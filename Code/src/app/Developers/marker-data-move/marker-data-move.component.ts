import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "angularfire2/storage";

// Moves a whole ward's markers from the old per-line structure
//   EntityMarkingData/MarkedHouses/{ward}/{line}/{markerNo}
// into the new global structure:
//   - Data:    EntityMarkingData/MarkersData/M{n}          (flat, global M-index)
//   - Image:   DevTest/MarkingSurveyImages/AllMarkerImages/M{n}.jpg
//   - Mapping: EntityMarkingData/MarkersMapping/MarkerWise/M{n} = { line, ward }
//              EntityMarkingData/MarkersMapping/WardWise/{ward}/M{n} = line
//              EntityMarkingData/MarkersMapping/WardWise/{ward}/lastMarkerKey = n
//              EntityMarkingData/MarkersMapping/LineWise/{ward}/{line}/{markerNo} = M{n}
//   - Line:    EntityMarkingData/MarkersMapping/LineSummary/{ward}/{line}
// OLD PATH (reference ke liye rakha hai):
//              (ApproveStatus node + all line-level count scalars, copied as-is)
//
// The M-index is GLOBAL, so the allocation counter lives at
//   EntityMarkingData/MarkersMapping/lastMarkerKey
// (MarkersMapping ke andar, taaki MarkersData me sirf M{n} records rahen).
// Ye counter ek atomic transaction se badhta hai, isliye portal aur marking app
// ek saath chalein tab bhi dono ko alag M number milta hai.
// This prevents two wards from both producing "M1" and overwriting each other.
//
// Old record par sirf EK naya node add hota hai (baaki kuch na badla jaata hai
// na delete hota hai):
//   MarkedHouses/{ward}/{line}/{markerNo}/movedToNewPath = {
//     newMarkerUid, newImageName, movedOn
//   }
// Isse old record ko dekhte hi pata chal jaata hai ki marker new path par ja
// chuka hai aur wahan uska naam kya hai - mapping node kho jaaye to recovery
// isi se ho sakti hai. Marker ABHI kahan hai ye MarkerWise/{uid} batata hai,
// yahan duplicate nahi rakha jaata.
//
// Idempotent: once a marker is moved, its old location -> new UID link is
// recorded in LineWise.
// On re-run we reuse that UID — if the data is unchanged we skip it, otherwise
// we update the existing M record in place. For wards moved by the earlier
// version (which wrote movedMarkerUid on the old record) that key is still
// honoured as a fallback and backfilled into the mapping.
//              (ApproveStatus node + all line-level count scalars. First run
//              copies them as-is; a re-run only fills keys that are MISSING on
//              the new path — see writeLineSummary().)
@Component({
  selector: 'app-marker-data-move',
  templateUrl: './marker-data-move.component.html',
  styleUrls: ['./marker-data-move.component.scss']
})
export class MarkerDataMoveComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private storage: AngularFireStorage) { }

  cityName: any;
  db: any;
  userName: any;
  userId: any;

  moveValue: string = "0";
  zoneList: any[] = [];

  markerList: any[] = [];
  lineWiseMap: any = {};
  // Permanent original-location -> UID map. LineWise gets re-pointed
  // when a marker is moved to another line; this one never does.
  originalToUidMap: any = {};
  failureMap: any = {};
  lastKey = 0;
  createdCount = 0;
  updatedCount = 0;
  skippedCount = 0;
  // Record to tha par LineWise entry missing thi - wo bhar di gayi.
  repairedCount = 0;
  noImageCount = 0;
  invalidSkipCount = 0;
  failCount = 0;
  lineSummaryCount = 0;
  failureList: any[] = [];

  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userName = localStorage.getItem("userName");
    this.userId = localStorage.getItem("userID");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Developers", "Marker-Data-Move", localStorage.getItem("userID"));
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
  }

  // City-wise available wards, same source the other marker pages use.
  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("allZoneList"));
  }

  // Reads the whole ward, builds the marker list, then processes one-by-one
  // (image copy is async, so we recurse through processMarker).
  moveData() {
    let ward = (this.moveValue || "").trim();
    if (ward == "" || ward == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }

    this.markerList = [];
    this.createdCount = 0;
    this.updatedCount = 0;
    this.skippedCount = 0;
    this.repairedCount = 0;
    this.noImageCount = 0;
    this.invalidSkipCount = 0;
    this.failCount = 0;
    this.lineSummaryCount = 0;
    this.failureList = [];
    $(this.divLoader).show();

    let wardPath = "EntityMarkingData/MarkedHouses/" + ward;
    let wardInstance = this.db.object(wardPath).valueChanges().subscribe(
      (data: any) => {
        wardInstance.unsubscribe();
        if (data == null) {
          $(this.divLoader).hide();
          this.commonService.setAlertMessage("error", "No marker data found for ward: " + ward);
          return;
        }
        let lineArray = Object.keys(data);
        for (let i = 0; i < lineArray.length; i++) {
          let lineNo = lineArray[i];
          let lineData = data[lineNo];
          if (lineData == null || typeof lineData != "object") {
            continue; // skips scalars like lastMarkerKey sitting under the ward
          }
          let lineSummary: any = {};
          let hasSummary = false;
          let markerKeyArray = Object.keys(lineData);
          for (let j = 0; j < markerKeyArray.length; j++) {
            let markerNo = markerKeyArray[j];
            let marker = lineData[markerNo];
            if (marker == null) {
              continue;
            }
            // Line-level metadata (scalars like marksCount/lastMarkerKey and
            // the ApproveStatus node) — not markers, collected into LineSummary
            // so the new path also carries line approval + counts.
            if (typeof marker != "object" || markerNo == "ApproveStatus") {
              lineSummary[markerNo] = marker;
              hasSummary = true;
              continue;
            }
            // Object without houseType = suspicious remnant. Not copied, but
            // logged to MoveSkipped so silent skips leave an audit trail.
            if (marker["houseType"] == null) {
              this.logSkippedEntry(ward, lineNo, markerNo);
              this.invalidSkipCount++;
              continue;
            }
            this.markerList.push({ line: lineNo, oldMarkerNo: markerNo, data: marker });
          }
          // OLD PATH (reference ke liye rakha hai):
          // set() per line: a re-run always mirrors the latest old-path values
          // (old path stays the write-side source of truth for now).
          // Copy this line's summary (ApproveStatus + counts) to the new path.
          if (hasSummary) {
            // OLD PATH (reference ke liye rakha hai):
            // this.db.object("EntityMarkingData/MarkersMapping/LineSummary/" + ward + "/" + lineNo).set(lineSummary);
            this.writeLineSummary(ward, lineNo, lineSummary);
            this.lineSummaryCount++;
          }
        }

        if (this.markerList.length == 0) {
          $(this.divLoader).hide();
          this.commonService.setAlertMessage("error", "No valid markers found in ward: " + ward);
          return;
        }

        // Date-wise allocation: oldest marker gets the smallest M number, so the
        // M sequence follows the marking date. "YYYY-MM-DD HH:mm:ss" strings sort
        // correctly as-is. Markers without a date go last. Already-moved markers
        // keep their existing UID regardless of this order.
        this.markerList.sort((a: any, b: any) => {
          let dateA = a["data"]["date"] != null ? a["data"]["date"].toString() : "";
          let dateB = b["data"]["date"] != null ? b["data"]["date"].toString() : "";
          if (dateA == "" && dateB == "") { return 0; }
          if (dateA == "") { return 1; }
          if (dateB == "") { return -1; }
          return dateA < dateB ? -1 : (dateA > dateB ? 1 : 0);
        });

        // Read this ward's old-location -> new-UID links, so re-runs can
        // recognize already-moved markers without touching the old records.
        let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + ward;
        let linkInstance = this.db.object(linkPath).valueChanges().subscribe(
          (linkData: any) => {
            linkInstance.unsubscribe();
            this.lineWiseMap = linkData != null ? linkData : {};

            // Permanent original-location links, so markers that were later
            // moved to another line are still recognized (no duplicate UID).
            let origPath = "EntityMarkingData/MarkersMapping/OriginalToUid/" + ward;
            let origInstance = this.db.object(origPath).valueChanges().subscribe(
              (origData: any) => {
                origInstance.unsubscribe();
                this.originalToUidMap = origData != null ? origData : {};

            // Read this ward's pending failure history (used for attemptCount
            // and cleared automatically when a marker finally succeeds).
            let failPath = "EntityMarkingData/MarkerMovementData/MoveFailures/" + ward;
            let failInstance = this.db.object(failPath).valueChanges().subscribe(
              (failData: any) => {
                failInstance.unsubscribe();
                this.failureMap = failData != null ? failData : {};

                // GLOBAL counter. Pehle sirf padha jaata tha (padho -> use karo ->
                // likho), jisse ek saath chalne wale app/portal ko same M number mil
                // sakta tha. Ab ek hi transaction me is run ke liye poora block
                // reserve kar lete hain - transaction server par atomic hai, isliye
                // koi doosra caller usi number par nahi aa sakta.
                // Block me se kuch numbers use na hon to bas gap reh jaata hai, jo
                // nuksan nahi karta (M number sirf unique hona chahiye).
                let counterPath = "EntityMarkingData/MarkersMapping/lastMarkerKey";
                let blockSize = this.markerList.length;
                this.db.database.ref(counterPath).transaction(
                  (current: any) => (Number(current) || 0) + blockSize
                ).then((res: any) => {
                  if (res == null || !res.committed) {
                    $(this.divLoader).hide();
                    this.commonService.setAlertMessage("error", "Marker counter reserve nahi ho paya, dobara try karein.");
                    return;
                  }
                  // Transaction ne jo value lautayi wahi block ka END hai.
                  let blockEnd = Number(res.snapshot.val());
                  this.lastKey = blockEnd - blockSize;
                  this.processMarker(0, ward);
                });
              }
            );
              } // origInstance callback close
            ); // origInstance subscribe close
          }
        );
      }
    );
  }

  processMarker(index: any, ward: any) {
    if (index >= this.markerList.length) {
      $(this.divLoader).hide();
      let msg = "Done. Created: " + this.createdCount + ", Updated: " + this.updatedCount +
        ", Already up-to-date: " + this.skippedCount + ", LineWise repaired: " + this.repairedCount +
        ", No image: " + this.noImageCount +
        ", Invalid skipped: " + this.invalidSkipCount + ", Failed: " + this.failCount +
        ", Line summaries: " + this.lineSummaryCount;
      if (this.failCount > 0) {
        this.commonService.setAlertMessage("error", msg + ". Re-run to retry failed markers (details in MoveFailures).");
        console.log("Failed markers:", this.failureList);
      }
      else {
        this.commonService.setAlertMessage("success", msg);
      }
      return;
    }

    let item = this.markerList[index];
    let old = item["data"];

    // Already moved once -> reuse the same UID (idempotent re-run).
    // Link ka pehla source LineWise mapping hai; na mile to neeche 4 fallback.
    let lineLinks = this.lineWiseMap != null ? this.lineWiseMap[item["line"]] : null;
    let linkedUid = lineLinks != null ? lineLinks[item["oldMarkerNo"]] : null;
    // Is marker ka LineWise entry hai ya nahi - neeche repair ke liye chahiye.
    let hasLineWise = linkedUid != null && linkedUid != "";
    // Fallback 1: OriginalToUid — never re-pointed, so it still resolves even
    // after the marker was moved to another line/ward from the portal.
    if (linkedUid == null || linkedUid == "") {
      let origLineLinks = this.originalToUidMap != null ? this.originalToUidMap[item["line"]] : null;
      let origUid = origLineLinks != null ? origLineLinks[item["oldMarkerNo"]] : null;
      if (origUid != null && origUid != "") {
        linkedUid = origUid;
      }
    }
    // Fallback 2: cloud function ka guard. App se aaya marker function ne
    // sync kiya hota hai aur old record par `uid` likh diya hota hai. Ise na
    // dekhein to re-run us marker ka DUPLICATE bana dega.
    if ((linkedUid == null || linkedUid == "") && old["uid"] != null && old["uid"] != "") {
      linkedUid = old["uid"];
    }
    // Fallback 3: movedToNewPath node (function aur ye page dono likhte hain).
    if ((linkedUid == null || linkedUid == "") && old["movedToNewPath"] != null
      && old["movedToNewPath"]["newMarkerUid"] != null && old["movedToNewPath"]["newMarkerUid"] != "") {
      linkedUid = old["movedToNewPath"]["newMarkerUid"];
    }
    // Fallback 4: movedMarkerUid written on the old record by an earlier version.
    if ((linkedUid == null || linkedUid == "") && old["movedMarkerUid"] != null && old["movedMarkerUid"] != "") {
      linkedUid = old["movedMarkerUid"];
    }

    if (linkedUid != null && linkedUid != "") {
      let uid = linkedUid;
      let existingPath = "EntityMarkingData/MarkersData/" + uid;
      let existingInstance = this.db.object(existingPath).valueChanges().subscribe(
        (existing: any) => {
          existingInstance.unsubscribe();
          let record = this.buildRecord(old, item["line"], ward, uid);
// OLD PATH (reference ke liye rakha hai):
// if (existing != null && this.isSame(existing, record)) {
  // Nothing changed -> "already updated". Backfill the link map so
  // wards moved by the earlier version also end up in the mapping.
//   this.writeLineWiseLink(ward, item["line"], item["oldMarkerNo"], uid);

          // NEW PATH IS THE SOURCE OF TRUTH: an existing record is never refreshed from the old tree - that would revert approve/edit changes and drag a moved marker back to its original line. Re-run is create-only.
          if (existing != null) {
            // Sirf PERMANENT link backfill + failure clear.
            this.writeOriginalLink(ward, item["line"], item["oldMarkerNo"], uid);
            // LineWise entry missing hai -> REPAIR. Aisa un markers par hota
            // hai jinhe cloud function ne sync kiya tha jab wo LineWise likhta
            // hi nahi tha: record MarkersData me pada hai par portal ke page
            // line ki list LineWise se banate hain, isliye marker kahin dikhta
            // nahi.
            //
            // Sirf tab likhte hain jab record khud keh raha ho ki marker ABHI
            // bhi isi ward+line par hai. Portal se doosri line par move ho
            // chuka ho to haath nahi lagate - warna wo apni purani line par
            // bhi dikhne lag jaayega (duplicate).
            if (!hasLineWise
              && String(existing["ward"]) == String(ward)
              && String(existing["line"]) == String(item["line"])) {
              this.writeLineWiseLink(ward, item["line"], item["oldMarkerNo"], uid);
              this.repairedCount++;
            }
            // Pichhli baar ke moved markers par ye node hai hi nahi - ek baar
            // bhar dete hain. Missing ho tabhi likhte hain, warna har re-run
            // par old path par bekaar ka write jaata.
            if (old["movedToNewPath"] == null) {
              this.writeMovedToNewPath(ward, item["line"], item["oldMarkerNo"], uid);
            }
            this.clearMoveFailure(ward, item["line"], item["oldMarkerNo"]);
            this.skippedCount++;
            this.processMarker(index + 1, ward);
            return;
          }
          // OLD PATH (reference ke liye rakha hai):
          // Data changed -> refresh the record + image + mapping under the same UID.
          // Record new path par hai hi nahi (pichhli baar likhna fail hua tha) -> usi uid par likho.
          this.copyImage(old, item["line"], ward, uid, 0,
            (hadImage: boolean) => {
              if (!hadImage) { this.noImageCount++; }
              this.writeRecordAndMapping(uid, record, item["line"], ward);
              this.writeLineWiseLink(ward, item["line"], item["oldMarkerNo"], uid);
              this.writeMovedToNewPath(ward, item["line"], item["oldMarkerNo"], uid);
              this.clearMoveFailure(ward, item["line"], item["oldMarkerNo"]);
              this.updatedCount++;
              this.processMarker(index + 1, ward);
            },
            () => {
              this.failCount++;
              this.failureList.push({ line: item["line"], oldMarkerNo: item["oldMarkerNo"], uid: uid, reason: "image copy failed (update)" });
              this.writeMoveFailure(ward, item["line"], item["oldMarkerNo"], uid, "image copy failed (update)");
              this.processMarker(index + 1, ward);
            }
          );
        }
      );
      return;
    }

    // New marker -> allocate the next GLOBAL M number.
    this.lastKey = this.lastKey + 1;
    let uid = "M" + this.lastKey;
    let record = this.buildRecord(old, item["line"], ward, uid);
    this.copyImage(old, item["line"], ward, uid, 0,
      (hadImage: boolean) => {
        if (!hadImage) { this.noImageCount++; }
        this.writeRecordAndMapping(uid, record, item["line"], ward);
        // Link old location -> new UID so a re-run reuses this UID instead of
        // duplicating. Lives in the mapping; the old record stays untouched.
        this.writeLineWiseLink(ward, item["line"], item["oldMarkerNo"], uid);
        // Old record par saaf-saaf likh do ki ye marker new path par ja chuka
        // hai. Sabse aakhir me, taaki OriginalToUid pehle ban jaaye (cloud
        // function usi ko guard ki tarah padhta hai).
        this.writeMovedToNewPath(ward, item["line"], item["oldMarkerNo"], uid);
        this.clearMoveFailure(ward, item["line"], item["oldMarkerNo"]);
        // Counter yahan NAHI likhte - poora block shuru me transaction se reserve ho
        // chuka hai. Yahan likhne se counter neeche chala jaata aur koi doosra caller
        // wahi number dobara le leta.
        this.createdCount++;
        this.processMarker(index + 1, ward);
      },
      () => {
        this.failCount++;
        this.failureList.push({ line: item["line"], oldMarkerNo: item["oldMarkerNo"], uid: uid, reason: "image copy failed" });
        this.writeMoveFailure(ward, item["line"], item["oldMarkerNo"], uid, "image copy failed");
        // Number pehle hi reserve tha, fail hone par bas gap reh jaata hai.
        this.processMarker(index + 1, ward);
      }
    );
  }

  // Builds the new global record: all old fields + the current line/ward and
  // the new image reference. Keys match the existing DB (line, ward, imgRef).
  buildRecord(old: any, line: any, ward: any, uid: string) {
    let record = Object.assign({}, old);
    delete record["movedMarkerUid"]; // link stays on the old record, not the new one
    delete record["movedToNewPath"]; // ye old record ka apna node hai, naye record par nahi jaata
    record["line"] = isNaN(Number(line)) ? line : Number(line);
    record["ward"] = ward;
    record["imgRef"] = uid + ".jpg";
    return record;
  }

  // Field-by-field compare so a re-run knows whether anything actually changed.
  isSame(a: any, b: any) {
    let keys: any = {};
    Object.keys(a || {}).forEach(k => keys[k] = true);
    Object.keys(b || {}).forEach(k => keys[k] = true);
    for (let k in keys) {
      if (k == "movedMarkerUid") { continue; }
      let av = a ? a[k] : undefined;
      let bv = b ? b[k] : undefined;
      if (typeof av == "object" || typeof bv == "object") {
        if (JSON.stringify(av) != JSON.stringify(bv)) { return false; }
      }
      else if (String(av) != String(bv)) { return false; }
    }
    return true;
  }

  // Pehli baar poora summary copy; re-run par sirf wahi keys jo new path par missing hain (approve/counts overwrite na ho).
  writeLineSummary(ward: any, lineNo: any, lineSummary: any) {
    let summaryPath = "EntityMarkingData/MarkersMapping/LineSummary/" + ward + "/" + lineNo;
    let summaryInstance = this.db.object(summaryPath).valueChanges().subscribe(
      (existing: any) => {
        summaryInstance.unsubscribe();
        if (existing == null) {
          this.db.object(summaryPath).set(lineSummary);
          return;
        }
        let missing: any = {};
        let hasMissing = false;
        let keyArray = Object.keys(lineSummary);
        for (let i = 0; i < keyArray.length; i++) {
          let key = keyArray[i];
          if (existing[key] == null) {
            missing[key] = lineSummary[key];
            hasMissing = true;
          }
        }
        if (hasMissing) {
          this.db.object(summaryPath).update(missing);
        }
      });
  }

  // Records where an old marker went:
  //   MarkersMapping/LineWise/{ward}/{line}/{markerNo} = M{n}
  // This is the re-run guard — old record par sirf movedToNewPath node add hota hai.
  //
  // NOTE: LineWise doubles as the "which markers are on this line"
  // index that the display pages read, so a line-move re-points it. That would
  // break re-run idempotency (the old MarkedHouses tree still shows the marker
  // at its ORIGINAL line, so the lookup would miss and a duplicate UID would be
  // allocated). OriginalToUid below is therefore written ONCE at migration time
  // and never re-pointed — it is the permanent original-location -> UID link.
  writeLineWiseLink(ward: any, line: any, markerNo: any, uid: string) {
    this.db.object("EntityMarkingData/MarkersMapping/LineWise/" + ward + "/" + line + "/" + markerNo).set(uid);
    this.writeOriginalLink(ward, line, markerNo, uid);
  }

  // Old record par ek naya node - saaf-saaf batata hai ki ye marker new path
  // par ja chuka hai aur wahan uski pehchaan kya hai:
  //   MarkedHouses/{ward}/{line}/{markerNo}/movedToNewPath = {
  //     newMarkerUid, newImageName, movedOn
  //   }
  // Ye SIRF add hota hai - old record ka baaki data na badla jaata hai na
  // delete hota hai. Ek baar likhne ke baad kabhi nahi badalta.
  //
  // Marker ABHI kis ward/line par hai, ye yahan jaan-boojh kar NAHI rakha:
  // uska ek hi maalik hai - MarkerWise/{uid}. Do jagah rakhte to kabhi ek
  // update hoti, doosri nahi, aur old record jhoot bolne lagta.
  //
  // Ye ek aisi jagah hai jahan hum old path par likhte hain, isliye order
  // maayne rakhta hai: pehle OriginalToUid, phir ye. Cloud function is write
  // par dobara trigger hota hai aur OriginalToUid dekh kar ruk jaata hai -
  // ulta karne par wo marker ko "naya" samajh kar duplicate bana deta.
  writeMovedToNewPath(ward: any, line: any, markerNo: any, uid: string) {
    this.db.object("EntityMarkingData/MarkedHouses/" + ward + "/" + line + "/" + markerNo + "/movedToNewPath").update({
      newMarkerUid: uid,
      newImageName: uid + ".jpg",
      movedOn: this.commonService.getTodayDateTime()
    });
  }

  // Permanent original-location -> UID link. Move ise kabhi nahi badalta,
  // isliye re-run moved markers ko bhi pehchaan leta hai.
  writeOriginalLink(ward: any, line: any, markerNo: any, uid: string) {
    this.db.object("EntityMarkingData/MarkersMapping/OriginalToUid/" + ward + "/" + line + "/" + markerNo).set(uid);
  }

  // Persistent failure history:
  //   MarkerMovementData/MoveFailures/{ward}/{line}_{markerNo} = { uid, reason, failedOn, attemptCount }
  // Whatever is left in this node = markers still pending because of failures.
  writeMoveFailure(ward: any, line: any, markerNo: any, uid: string, reason: string) {
    let key = line + "_" + markerNo;
    let prev = this.failureMap != null ? this.failureMap[key] : null;
    let attemptCount = (prev != null && prev["attemptCount"] != null ? Number(prev["attemptCount"]) : 0) + 1;
    this.db.object("EntityMarkingData/MarkerMovementData/MoveFailures/" + ward + "/" + key).update({
      uid: uid,
      reason: reason,
      failedOn: this.commonService.getTodayDateTime(),
      attemptCount: attemptCount
    });
  }

  // A marker that finally succeeded clears its own failure entry, so
  // MoveFailures never carries stale/solved cases.
  clearMoveFailure(ward: any, line: any, markerNo: any) {
    let key = line + "_" + markerNo;
    if (this.failureMap != null && this.failureMap[key] != null) {
      this.db.object("EntityMarkingData/MarkerMovementData/MoveFailures/" + ward + "/" + key).remove();
    }
  }

  // Audit trail for entries that were silently skipped (object without houseType):
  //   MarkerMovementData/MoveSkipped/{ward}/{line}_{markerNo} = { reason, skippedOn }
  logSkippedEntry(ward: any, line: any, markerNo: any) {
    this.db.object("EntityMarkingData/MarkerMovementData/MoveSkipped/" + ward + "/" + line + "_" + markerNo).update({
      reason: "houseType missing",
      skippedOn: this.commonService.getTodayDateTime()
    });
  }

  // Writes the record + all three mapping locations for one marker.
  writeRecordAndMapping(uid: string, record: any, line: any, ward: any) {
    let lineVal = isNaN(Number(line)) ? line : Number(line);

    this.db.object("EntityMarkingData/MarkersData/" + uid).update(record);

    this.db.object("EntityMarkingData/MarkersMapping/MarkerWise/" + uid).update({ line: lineVal, ward: ward });
    this.db.object("EntityMarkingData/MarkersMapping/WardWise/" + ward + "/" + uid).set(lineVal);
    this.db.object("EntityMarkingData/MarkersMapping/WardWise/" + ward + "/lastMarkerKey").set(this.lastKey);
  }

  // Downloads the old per-line image and re-uploads it as M{n}.jpg in the flat
  // AllMarkerImages folder. Retries up to 3 times. onSuccess(hadImage) is called
  // when done (hadImage=false when the marker had no source image).
  copyImage(old: any, line: any, ward: any, uid: string, attempt: number, onSuccess: any, onFail: any) {
    let oldImageName = old["image"];
    if (oldImageName == null || oldImageName == "") {
      // No source image -> still move the data, just no upload.
      onSuccess(false);
      return;
    }

    let city = this.commonService.getFireStoreCity();
    if (this.cityName == "sikar") {
      city = "Sikar-Survey";
    }
    let pathOld = city + "/MarkingSurveyImages/" + ward + "/" + line + "/" + oldImageName;
    let pathNew = "DevTest/MarkingSurveyImages/AllMarkerImages/" + uid + ".jpg";

    let ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
    ref.getDownloadURL()
      .then((url: any) => {
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = () => {
          let blob = xhr.response;
          let refNew = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
          refNew.put(blob).then(() => {
            onSuccess(true);
          }).catch(() => {
            this.retryOrFail(old, line, ward, uid, attempt, onSuccess, onFail);
          });
        };
        xhr.onerror = () => {
          this.retryOrFail(old, line, ward, uid, attempt, onSuccess, onFail);
        };
        xhr.open('GET', url);
        xhr.send();
      })
      .catch(() => {
        // Source image missing in storage -> no point retrying the download.
        onFail();
      });
  }

  retryOrFail(old: any, line: any, ward: any, uid: string, attempt: number, onSuccess: any, onFail: any) {
    if (attempt < 2) {
      this.copyImage(old, line, ward, uid, attempt + 1, onSuccess, onFail);
    }
    else {
      onFail();
    }
  }
}
