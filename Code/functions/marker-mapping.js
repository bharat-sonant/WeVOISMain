// New marker structure likhne ka core logic. Portal ke
// src/app/services/marker/marker-mapping.service.ts se bilkul same shape likhta
// hai - dono jagah ka data ek jaisa rehna chahiye.
//
// Jitni jagah banti hai:
//   MarkersData/{uid}                              = poora record + ward + line + imgRef
//   MarkersMapping/MarkerWise/{uid}                = { ward, line }
//   MarkersMapping/WardWise/{ward}/{uid}           = line
//   MarkersMapping/LineWise/{ward}/{line}/{markerNo} = uid
//   MarkersMapping/LineSummary/{ward}/{line}/lastMarkerKey = line ka aakhri markerNo
//
// LineWise ke bina marker DB me to ban jaata hai par portal par dikhta nahi -
// portal ke 15 page line ki list isi se banate hain. Isliye ise likhna optional
// nahi hai (pehle ye chhod diya gaya tha, isi wajah se app se aaye markers
// portal par nahi dikh rahe the).
//
// Likhne ka order: pehle DATA, phir MAPPING. Ulta karne par mapping kuch der ke
// liye aise uid par point karti hai jiska record hi nahi hota.
//
// Image: {oldImageFolder}/MarkingSurveyImages/{ward}/{line}/{image}
//        -> DevTest/MarkingSurveyImages/AllMarkerImages/{uid}.jpg
//
// Duplicate guard app ke apne record par hai: sync hone ke baad wahan `uid`
// likh dete hain. Trigger dobara chale to `uid` dekh kar ruk jaata hai - iske
// liye alag mapping node rakhne ki zaroorat nahi.

const admin = require("firebase-admin");

const NEW_IMAGE_FOLDER = "DevTest/MarkingSurveyImages/AllMarkerImages";
const COUNTER_PATH = "EntityMarkingData/MarkersMapping/lastMarkerKey";
const MARKERS_DATA = "EntityMarkingData/MarkersData/";
const MARKER_WISE = "EntityMarkingData/MarkersMapping/MarkerWise/";
const WARD_WISE = "EntityMarkingData/MarkersMapping/WardWise/";
const LINE_WISE = "EntityMarkingData/MarkersMapping/LineWise/";
const LINE_SUMMARY = "EntityMarkingData/MarkersMapping/LineSummary/";
const OLD_MARKERS = "EntityMarkingData/MarkedHouses/";
// Refactor se pehle jo markers sync ho chuke hain unka guard yahan pada hai.
// Naya kuch isme likha nahi jaata - sirf padha jaata hai, warna wo markers
// dobara ban jaate.
const LEGACY_GUARD = "EntityMarkingData/MarkersMapping/OriginalToUid/";

// Har city ka apna database instance hai.
function getDb(instance) {
  return admin.app().database("https://" + instance + ".firebaseio.com");
}

// Line number ko wahi type me badalta hai jo DB me jaata hai - "12" aur 12
// compare karte waqt alag pad jaate hain.
function lineValue(line) {
  return isNaN(Number(line)) ? line : Number(line);
}

// Line ke neeche marker ke alawa scalars bhi hote hain (lastMarkerKey,
// marksCount, ApproveStatus...). Asli marker wahi jiska key number ho aur
// houseType ho.
function isRealMarker(markerNo, data) {
  if (data === null || typeof data !== "object") {
    return false;
  }
  if (markerNo === null || isNaN(Number(markerNo))) {
    return false;
  }
  return data.houseType !== null && data.houseType !== undefined;
}

// Global M counter se agla number. Transaction server par atomic hai, isliye
// app aur portal ek saath chalein to bhi same number nahi milta.
async function allocateUid(db) {
  const res = await db.ref(COUNTER_PATH).transaction(function (current) {
    return (Number(current) || 0) + 1;
  });
  if (!res.committed) {
    return null;
  }
  return "M" + Number(res.snapshot.val());
}

// Record = app ka data + ward/line/imgRef.
function buildRecord(old, ward, line, uid) {
  const record = Object.assign({}, old);
  delete record.uid; // guard field record par nahi jaata
  delete record.movedToNewPath; // ye old record ka apna node hai
  record.ward = ward;
  record.line = lineValue(line);
  record.imgRef = uid + ".jpg";
  return record;
}

// Marker pehle se sync ho chuka hai kya. Naya guard app ke record ka `uid`
// field hai; purane (refactor se pehle sync hue) markers ke liye OriginalToUid
// bhi dekh lete hain.
async function getExistingUid(db, ward, line, markerNo, data) {
  if (data && data.uid) {
    return data.uid;
  }
  // marker-data-move se aaye markers par ye node padta hai. Wo write khud is
  // trigger ko chalata hai, isliye ise pehchanna zaroori hai - warna trigger
  // ek migrated marker ka doosra copy bana dega.
  if (data && data.movedToNewPath && data.movedToNewPath.newMarkerUid) {
    return data.movedToNewPath.newMarkerUid;
  }
  const snap = await db
    .ref(LEGACY_GUARD + ward + "/" + line + "/" + markerNo)
    .once("value");
  return snap.val() ? snap.val() : null;
}

// Storage se image aayi par uska naam markerNo.jpg na ho - to line ke markers
// me se wo dhoondho jiska `image` field isi file ka naam ho, aur uska uid do.
async function findUidByImage(db, ward, line, imageName) {
  const snap = await db.ref(OLD_MARKERS + ward + "/" + line).once("value");
  const lineData = snap.val();
  if (lineData === null || typeof lineData !== "object") {
    return null;
  }
  const keys = Object.keys(lineData);
  for (let i = 0; i < keys.length; i++) {
    const marker = lineData[keys[i]];
    if (marker && typeof marker === "object" && marker.image === imageName) {
      return await getExistingUid(db, ward, line, keys[i], marker);
    }
  }
  return null;
}

// Pehle data, uske baad mapping. Aakhir me app ke record par guard.
async function writeMarker(db, ward, line, markerNo, uid, record) {
  const lineVal = lineValue(line);

  await db.ref(MARKERS_DATA + uid).update(record);

  // Teeno mapping ek saath - aadha likha rehna sabse kharab haalat hai.
  const mapping = {};
  mapping[MARKER_WISE + uid] = { ward: ward, line: lineVal };
  mapping[WARD_WISE + ward + "/" + uid] = lineVal;
  mapping[LINE_WISE + ward + "/" + lineVal + "/" + markerNo] = uid;
  await db.ref().update(mapping);

  // Line ka lastMarkerKey kabhi peeche nahi jaana chahiye - app ka markerNo
  // portal ke counter se aage ho sakta hai, isliye max lete hain. Iske bina
  // portal us line par naya marker banaye to wahi number dobara de deta.
  await db
    .ref(LINE_SUMMARY + ward + "/" + lineVal + "/lastMarkerKey")
    .transaction(function (current) {
      const currentKey = Number(current) || 0;
      const newKey = Number(markerNo) || 0;
      return newKey > currentKey ? newKey : currentKey;
    });

  // Old record par: `uid` guard + movedToNewPath (saaf-saaf batata hai ki marker
  // new path par ja chuka hai aur wahan uski pehchaan kya hai). Old record ka
  // baaki data na badla jaata hai na delete hota hai.
  // Ye write trigger ko dobara chalayega, par tab `uid` mil jaayega aur wo
  // wahin ruk jaayega - yahi duplicate guard hai. Sabse aakhir me isliye ki
  // beech me kuch fail ho to marker "ho gaya" mark na ho jaaye.
  const oldRecordUpdate = {};
  oldRecordUpdate[OLD_MARKERS + ward + "/" + line + "/" + markerNo + "/uid"] = uid;
  oldRecordUpdate[OLD_MARKERS + ward + "/" + line + "/" + markerNo + "/movedToNewPath"] = {
    newMarkerUid: uid,
    newImageName: uid + ".jpg",
    movedOn: new Date().toISOString().replace("T", " ").substring(0, 19),
  };
  await db.ref().update(oldRecordUpdate);
}

// Purani per-line image ko flat AllMarkerImages folder me copy karta hai.
// Image ka naam record ke `image` field me hota hai (markerNo.jpg hi ho, ye
// zaroori nahi). Image abhi upload na hui ho to false - Storage trigger baad
// me kar dega.
async function copyImage(entry, ward, line, imageName, uid) {
  if (!entry.oldImageFolder || !imageName) {
    return false;
  }
  const bucket = entry.bucket
    ? admin.storage().bucket(entry.bucket)
    : admin.storage().bucket();
  const source = bucket.file(
    entry.oldImageFolder + "/MarkingSurveyImages/" + ward + "/" + line + "/" + imageName
  );
  const exists = await source.exists();
  if (!exists[0]) {
    return false;
  }
  await source.copy(bucket.file(NEW_IMAGE_FOLDER + "/" + uid + ".jpg"));
  return true;
}

module.exports = {
  NEW_IMAGE_FOLDER,
  getDb,
  lineValue,
  isRealMarker,
  allocateUid,
  buildRecord,
  getExistingUid,
  findUidByImage,
  writeMarker,
  copyImage,
};
