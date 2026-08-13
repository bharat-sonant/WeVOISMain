// App se naya marker aate hi use new marker structure me daal deta hai.
//
// App abhi bhi purane path par likhti hai:
//   EntityMarkingData/MarkedHouses/{ward}/{line}/{markerNo}
// Ye trigger wahi likhta hai jo portal ka MarkerMappingService likhta hai, to
// marker turant portal ki har screen par dikhne lagta hai - na app me koi
// change chahiye, na marker-data-move chalana padta hai.
//
// Sirf CREATE hota hai, update kabhi nahi: marker ek baar new path par aa gaya
// to uske baad portal ke edits hi sach hain. Purane record se dobara likhne par
// wo edits ud jaate (migration me bhi yahi galti ho chuki hai).
//
// Guard app ke record par likha `uid` field hai - us wajah se ye trigger apne
// hi write par dobara chalta hai, par doosri baar `uid` dekh kar turant ruk
// jaata hai.

const admin = require("firebase-admin");
const { onValueWritten } = require("firebase-functions/v2/database");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const logger = require("firebase-functions/logger");

admin.initializeApp();

const config = require("./config");
const mm = require("./marker-mapping");

const MARKER_REF = "/EntityMarkingData/MarkedHouses/{ward}/{line}/{markerNo}";

// Function ke naam me sirf letters/digits/underscore chal sakte hain.
function safeName(value) {
  return value.replace(/[^a-zA-Z0-9]/g, "_");
}

async function syncMarker(entry, ward, line, markerNo, data) {
  const db = mm.getDb(entry.db);

  // Pehle se new path par hai to kuch nahi karna (create-only).
  const existingUid = await mm.getExistingUid(db, ward, line, markerNo, data);
  if (existingUid) {
    return;
  }

  const uid = await mm.allocateUid(db);
  if (!uid) {
    logger.error("counter reserve nahi hua", { db: entry.db, ward, line, markerNo });
    return;
  }

  const record = mm.buildRecord(data, ward, line, uid);
  await mm.writeMarker(db, ward, line, markerNo, uid, record);

  // Image aksar DB record ke baad upload hoti hai. Na mile to Storage trigger
  // baad me copy kar dega, isliye yahan fail hona koi problem nahi.
  let copied = false;
  try {
    copied = await mm.copyImage(entry, ward, line, data.image, uid);
  } catch (err) {
    logger.warn("image copy fail", { db: entry.db, uid, error: err.message });
  }

  logger.info("marker sync", { db: entry.db, ward, line, markerNo, uid, image: copied });
}

// ---- Har database instance ke liye ek DB trigger ----
config.forEach(function (entry) {
  exports["syncMarker_" + safeName(entry.db)] = onValueWritten(
    { ref: MARKER_REF, instance: entry.db },
    async (event) => {
      const data = event.data.after.val();
      const ward = event.params.ward;
      const line = event.params.line;
      const markerNo = event.params.markerNo;

      // Delete/khali node ignore. Marker hataane ka kaam portal karta hai.
      if (data === null) {
        return;
      }
      // Line ke neeche pade scalars (lastMarkerKey, marksCount...) aur adhoore
      // record (houseType abhi nahi aaya) skip. Baad me houseType aayega to ye
      // trigger dobara chalega aur tab marker ban jaayega.
      if (!mm.isRealMarker(markerNo, data)) {
        return;
      }

      await syncMarker(entry, ward, line, markerNo, data);
    }
  );
});

// ---- Late aane wali image ke liye Storage trigger ----
// DB record pehle aur image baad me aaye to upar wali copy fail ho jaati hai;
// ye trigger tab image aate hi use flat folder me daal deta hai.
const imageEntries = config.filter(function (entry) {
  return !!entry.oldImageFolder;
});

const bucketGroups = {};
imageEntries.forEach(function (entry) {
  const bucket = entry.bucket || "_default";
  if (!bucketGroups[bucket]) {
    bucketGroups[bucket] = [];
  }
  bucketGroups[bucket].push(entry);
});

Object.keys(bucketGroups).forEach(function (bucket) {
  const entries = bucketGroups[bucket];
  const options = bucket === "_default" ? {} : { bucket: bucket };

  exports["syncMarkerImage_" + safeName(bucket)] = onObjectFinalized(options, async (event) => {
    const path = event.data.name || "";
    // {folder}/MarkingSurveyImages/{ward}/{line}/{markerNo}.jpg
    // Naya flat path (AllMarkerImages/{uid}.jpg) me ek segment kam hai, isliye
    // wo match nahi karta - loop nahi banta.
    const match = path.match(/^(.+)\/MarkingSurveyImages\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!match) {
      return;
    }
    const folder = match[1];
    const ward = match[2];
    const line = match[3];
    const imageName = match[4];

    const entry = entries.find(function (item) {
      return item.oldImageFolder === folder;
    });
    if (!entry) {
      return;
    }

    const db = mm.getDb(entry.db);
    // Image ka naam markerNo.jpg ho, ye zaroori nahi - isliye line ke markers me
    // se wo dhoondhte hain jiska `image` field isi file ka naam ho.
    const uid = await mm.findUidByImage(db, ward, line, imageName);
    if (!uid) {
      return; // marker abhi sync hi nahi hua; wo trigger khud copy kar lega
    }

    try {
      await mm.copyImage(entry, ward, line, imageName, uid);
      logger.info("late image copy", { db: entry.db, uid });
    } catch (err) {
      logger.error("late image copy fail", { db: entry.db, uid, error: err.message });
    }
  });
});
