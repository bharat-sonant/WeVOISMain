import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { MarkerMappingService } from "../../services/marker/marker-mapping.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-card-marker-mapping',
  templateUrl: './card-marker-mapping.component.html',
  styleUrls: ['./card-marker-mapping.component.scss']
})
export class CardMarkerMappingComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private storage: AngularFireStorage, private markerMapping: MarkerMappingService) { }
  cityName: any;
  db: any;
  todayDate: any;
  public selectedZone: any;
  zoneList: any[];
  markerList: any[];
  ddlZone = "#ddlZone";
  ddlZoneCount = "#ddlZoneCount";
  divLoaderLineMove = "#divLoaderLineMove";
  public totalLineCount: any;
  public movedLineCount: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }


  markersDataCache: any = null;
  markersDataPromise: any = null;
  uidMap: any = {};
  notMigratedCount = 0;

  // Cache sirf operation ke shuru me clear hota hai, har write par nahi.
  resetNewPathCache() {
    this.markersDataCache = null;
    this.markersDataPromise = null;
    this.uidMap = {};
    this.notMigratedCount = 0;
  }

  loadMarkersData(): Promise<any> {
    if (this.markersDataCache != null) {
      return Promise.resolve(this.markersDataCache);
    }
    // Ek hi read chale chahe 100 caller ek saath aa jayein.
    if (this.markersDataPromise != null) {
      return this.markersDataPromise;
    }
    this.markersDataPromise = new Promise((resolve) => {
      let markersInstance = this.db.object("EntityMarkingData/MarkersData").valueChanges().subscribe((data: any) => {
        markersInstance.unsubscribe();
        this.markersDataCache = data != null ? data : {};
        resolve(this.markersDataCache);
      });
    });
    return this.markersDataPromise;
  }

  setUid(ward: any, line: any, markerNo: any, uid: any) {
    this.uidMap[ward + "|" + line + "|" + markerNo] = uid;
  }

  getUid(ward: any, line: any, markerNo: any) {
    let uid = this.uidMap[ward + "|" + line + "|" + markerNo];
    return uid != null && uid != "" ? uid : null;
  }

  getNewPathLineData(wardNo: any, lineNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + wardNo + "/" + lineNo;
      let linkInstance = this.db.object(linkPath).valueChanges().subscribe((links: any) => {
        linkInstance.unsubscribe();
        if (links == null) {
          resolve(null);
          return;
        }
        this.loadMarkersData().then((markersData: any) => {
          let lineData = {};
          let keyArray = Object.keys(links);
          let found = 0;
          for (let i = 0; i < keyArray.length; i++) {
            let markerNo = keyArray[i];
            let uid = links[markerNo];
            if (uid == null || uid == "") {
              continue; // numeric keys ki wajah se aaye array-nulls skip
            }
            if (markersData[uid] == null) {
              continue;
            }
            lineData[markerNo] = markersData[uid];
            this.setUid(wardNo, lineNo, markerNo, uid);
            found++;
          }
          resolve(found > 0 ? lineData : null);
        });
      });
    });
  }

  getNewPathWardData(wardNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + wardNo;
      let linkInstance = this.db.object(linkPath).valueChanges().subscribe((wardLinks: any) => {
        linkInstance.unsubscribe();
        if (wardLinks == null) {
          resolve(null);
          return;
        }
        this.loadMarkersData().then((markersData: any) => {
          let wardData = {};
          let found = 0;
          let lineArray = Object.keys(wardLinks);
          for (let l = 0; l < lineArray.length; l++) {
            let lineNo = lineArray[l];
            let links = wardLinks[lineNo];
            if (links == null || typeof links != "object") {
              continue;
            }
            let lineData = {};
            let markerArray = Object.keys(links);
            for (let m = 0; m < markerArray.length; m++) {
              let markerNo = markerArray[m];
              let uid = links[markerNo];
              if (uid == null || uid == "") {
                continue; // numeric keys ki wajah se aaye array-nulls skip
              }
              if (markersData[uid] == null) {
                continue;
              }
              lineData[markerNo] = markersData[uid];
              this.setUid(wardNo, lineNo, markerNo, uid);
              found++;
            }
            if (Object.keys(lineData).length > 0) {
              wardData[lineNo] = lineData;
            }
          }
          resolve(found > 0 ? wardData : null);
        });
      });
    });
  }

  // Line-level scalars (counts, lastMarkerKey, ApproveStatus) ka new-path base.
  getLineSummaryPath(ward: any, line: any): string {
    return "EntityMarkingData/MarkersMapping/LineSummary/" + ward + "/" + line;
  }

  // Agla safe markerNo: LineSummary ka lastMarkerKey aur us line ki asli mapping keys, dono me se bada.
  getSafeLastKey(zoneTo: any, lineTo: any): Promise<any> {
    return new Promise((resolve) => {
      let summaryPath = this.getLineSummaryPath(zoneTo, lineTo) + "/lastMarkerKey";
      let sInst = this.db.object(summaryPath).valueChanges().subscribe((summaryVal: any) => {
        sInst.unsubscribe();
        let fromSummary = summaryVal != null ? Number(summaryVal) : 0;
        if (isNaN(fromSummary)) { fromSummary = 0; }

        let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + zoneTo + "/" + lineTo;
        let lInst = this.db.object(linkPath).valueChanges().subscribe((links: any) => {
          lInst.unsubscribe();
          let maxKey = 0;
          if (links != null) {
            let keyArray = Object.keys(links);
            for (let i = 0; i < keyArray.length; i++) {
              if (links[keyArray[i]] == null || links[keyArray[i]] == "") {
                continue; // numeric keys ki wajah se aaye array-nulls skip
              }
              let n = Number(keyArray[i]);
              if (!isNaN(n) && n > maxKey) { maxKey = n; }
            }
          }
          resolve(fromSummary > maxKey ? fromSummary : maxKey);
        });
      });
    });
  }

  // Marker ko nayi line/ward par. Data global rehta hai, sirf mapping re-point hoti hai. OriginalToUid yahan NAHI chhuti, warna migration re-run par duplicate uid ban jaayega.
  moveMarkerOnNewPath(uid: any, zoneFrom: any, lineFrom: any, markerNoFrom: any, zoneTo: any, lineTo: any, newMarkerNo: any, data: any, extra: any = null) {
    // Move history: marker kahan se kahan gaya, iska permanent record.
    this.markerMapping.recordMove(this.db, uid, zoneFrom, lineFrom, markerNoFrom, zoneTo, lineTo, newMarkerNo);

    // line kabhi string ("7") ban kar aa sakti hai, jabki marker-data-move ne
    // migration me line NUMBER (7) likhi thi — Number me convert kar ke likhte hain.
    let lineVal = isNaN(Number(lineTo)) ? lineTo : Number(lineTo);

    // Sirf badle hue fields likhte hain, poora record nahi. Old path par record nayi key par banta tha isliye poora likhna padta tha; yahan record apni hi jagah rehta hai.
    let patch: any = {
      line: (isNaN(Number(lineTo)) ? lineTo : Number(lineTo)),
      ward: zoneTo,
      movedFromWard: zoneFrom,
      movedFromLine: lineFrom,
      movedFromMarkerNo: markerNoFrom,
      movedOn: this.commonService.getTodayDateTime()
    };
    if (data["latLng"] != null) { patch["latLng"] = data["latLng"]; }
    if (extra != null) {
      let eKeys = Object.keys(extra);
      for (let e = 0; e < eKeys.length; e++) { patch[eKeys[e]] = extra[eKeys[e]]; }
    }
    // in-memory record bhi sync rakho, caller isi object ko aage use karta hai
    let pKeys = Object.keys(patch);
    for (let k = 0; k < pKeys.length; k++) { data[pKeys[k]] = patch[pKeys[k]]; }
    this.db.object("EntityMarkingData/MarkersData/" + uid).update(patch);

    // LineWise: nayi jagah add, purani jagah se hata do
    this.db.object("EntityMarkingData/MarkersMapping/LineWise/" + zoneTo + "/" + lineTo + "/" + newMarkerNo).set(uid);
    this.db.database.ref("EntityMarkingData/MarkersMapping/LineWise/" + zoneFrom + "/" + lineFrom + "/" + markerNoFrom).set(null);

    // MarkerWise mapping
    this.db.object("EntityMarkingData/MarkersMapping/MarkerWise/" + uid).update({ line: lineVal, ward: zoneTo });

    // WardWise mapping: ward badla to purane ward se hata do
    if (zoneFrom != zoneTo) {
      this.db.database.ref("EntityMarkingData/MarkersMapping/WardWise/" + zoneFrom + "/" + uid).set(null);
    }
    this.db.object("EntityMarkingData/MarkersMapping/WardWise/" + zoneTo + "/" + uid).set(lineVal);
  }

  mapHouseMarkerData() {
    if ($(this.ddlZoneCount).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Zone !!!");
      return;
    }
    $(this.divLoaderLineMove).show();
    this.resetNewPathCache();
    let zoneNo = $(this.ddlZoneCount).val();
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
    //   data => {
    //     markerInstance.unsubscribe();
    // NEW PATH: MarkersData + LineWise (same {lineNo: {markerNo: record}} shape)
    this.getNewPathWardData(zoneNo).then(
      (data: any) => {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            this.totalLineCount = keyArray.length;
            this.getWardLinesMarker(zoneNo, data, keyArray, 0);
            return;
          }
        }
        // Ward me ek bhi migrate hua marker nahi mila. Pehle yahan kuch nahi hota
        // tha aur loader hamesha ke liye chalta reh jaata tha.
        $(this.divLoaderLineMove).hide();
        this.commonService.setAlertMessage("error", "Sorry! No marker data found on new path for this ward.");
      }
    );
  }

  getWardLinesMarker(zoneNo: any, data: any, keyArray: any, index: any) {
    if (index == keyArray.length) {
      $(this.divLoaderLineMove).hide();
      // OLD PATH (reference ke liye rakha hai):
      // this.commonService.setAlertMessage("success", "Data Update Successfully!!!");
      let msg = "Data Update Successfully!!!";
      if (this.notMigratedCount > 0) {
        msg = msg + " (" + this.notMigratedCount + " markers skipped — new path par nahi mile)";
      }
      this.commonService.setAlertMessage("success", msg);
    }
    else {
      let lineNo = keyArray[index];
      let markerData = data[lineNo];
      let markerKeyArray = Object.keys(markerData);
      if (markerKeyArray.length > 0) {
        this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, 0, markerKeyArray);
      }
      else {
        // Khaali line par pehle recursion yahin ruk jaati thi (na aage badhti, na
        // loader hatta). Ab agli line par chale jaate hain.
        index++;
        this.getWardLinesMarker(zoneNo, data, keyArray, index);
      }
    }
  }

  mapData(zoneNo: any, data: any, keyArray: any, index: any, lineNo: any, markerData: any, markerIndex: any, markerKeyArray: any) {
    if (markerIndex == markerKeyArray.length) {
      index++;
      this.getWardLinesMarker(zoneNo, data, keyArray, index);
    }
    else {
      let markerNo = markerKeyArray[markerIndex];
      if (markerData[markerNo]["cardNumber"] != null) {

        let cardNo = markerData[markerNo]["cardNumber"];
        // NEW PATH: is marker ka uid — ward load ke waqt uidMap me bhar chuka hai,
        let uid = this.getUid(zoneNo, lineNo, markerNo);
        if (uid == null) {
          // marker new path par nahi hai -> is marker par kuch nahi karna
          this.notMigratedCount++;
          markerIndex++;
          this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
          return;
        }
        let dbPath = "CardWardMapping/" + cardNo;
        let cardWardMappingInstance = this.db.object(dbPath).valueChanges().subscribe(
          mappingData => {
            cardWardMappingInstance.unsubscribe();
            if (mappingData != null) {
              let zoneTo = mappingData["ward"];
              let lineTo = mappingData["line"];
              this.movedLineCount = lineNo;
              let dbPath = "Houses/" + zoneTo + "/" + lineTo + "/" + cardNo;
              let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
                houseData => {
                  houseInstance.unsubscribe();
                  if (houseData != null) {
                    let latLng = houseData["latLng"].toString().replace("(", "").replace(")", "");
                    markerData[markerNo]["latLng"] = latLng;
                    markerData[markerNo]["alreadyInstalled"] = null;
                    if (zoneNo == zoneTo && lineNo == lineTo) {
                     // console.log(markerData[markerNo]);
                      // OLD PATH (reference ke liye rakha hai):
                      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                      // this.db.object(dbPath).update(markerData[markerNo]);
                      // NEW PATH: marker apni hi line par hai. Sirf wahi do fields likhte hain jo upar badle hain, poora record nahi - warna beech me hua koi approve/edit purane snapshot se overwrite ho jaata.
                      this.db.object("EntityMarkingData/MarkersData/" + uid).update({ latLng: latLng, alreadyInstalled: null });
                      markerIndex++;
                      this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
                    }
                    else {
                      let lastMarkerKey = 1;
                      // OLD PATH (reference ke liye rakha hai):
                      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/lastMarkerKey";
                      // let lastMarkerKeyInstance = this.db.object(dbPath).valueChanges().subscribe(
                      //   lastMarkerKeyData => {
                      //     lastMarkerKeyInstance.unsubscribe();
                      //     if (lastMarkerKeyData != null) {
                      //       lastMarkerKey = Number(lastMarkerKeyData) + 1;
                      //     }
                      //     let oldImageName = markerData[markerNo]["image"];
                      //     markerData[markerNo]["image"] = lastMarkerKey + ".jpg";
                      //     let newImageName = lastMarkerKey + ".jpg";
                        //  console.log(markerData[markerNo]);
                      //     const pathOld = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneNo + "/" + lineNo + "/" + oldImageName;
                      //     const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
                      //     ref.getDownloadURL()
                      //       .then((url) => {
                      //         var xhr = new XMLHttpRequest();
                      //         xhr.responseType = 'blob';
                      //         xhr.onload = (event) => {
                      //           var blob = xhr.response;
                      //           const pathNew = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
                      //           const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
                      //           ref1.put(blob).then((promise) => {
                                  // ref.delete();
                      //           }
                      //           ).catch((error) => {
                      //           });
                      //         };
                      //         xhr.open('GET', url);
                      //         xhr.send();
                      //       })
                      //       .catch((error) => {
                      //       });
                      //     let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastMarkerKey;
                      //     this.db.object(dbPath).update(markerData[markerNo]);
                      //     dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                      //     this.db.object(dbPath).remove();
                      //     dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
                      // NEW PATH: agla markerNo = LineSummary ka lastMarkerKey aur line ki asli mapping keys, dono me se bada.
                      this.getSafeLastKey(zoneTo, lineTo).then(
                        (safeLastKey: any) => {
                          lastMarkerKey = Number(safeLastKey) + 1;
                          // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.

                          // NEW PATH: mapping re-point karo (data global hi rehta hai).
                          this.moveMarkerOnNewPath(uid, zoneNo, lineNo, markerNo, zoneTo, lineTo, lastMarkerKey, markerData[markerNo], { alreadyInstalled: null });

                          // NEW PATH: LineSummary
                          let dbPath = this.getLineSummaryPath(zoneTo, lineTo);
                          this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
                          markerIndex++;
                          this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);

                        });
                    }
                  }
                  else {
                  //  console.log("Card house not found => " + cardNo);
                    // OLD PATH (reference ke liye rakha hai):
                    // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/cardNumber";
                    // NEW PATH: MarkersData/{uid}/cardNumber
                    dbPath = "EntityMarkingData/MarkersData/" + uid + "/cardNumber";
                    this.db.object(dbPath).remove();
                    markerIndex++;
                    this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
                  }
                });
            }
            else {
             // console.log("Card not mapped => " + cardNo);
              // OLD PATH (reference ke liye rakha hai):
              // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/cardNumber";
              // NEW PATH: MarkersData/{uid}/cardNumber
              dbPath = "EntityMarkingData/MarkersData/" + uid + "/cardNumber";
              this.db.object(dbPath).remove();
              markerIndex++;
              this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
            }
          });
      }
      else {
        markerIndex++;
        this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
      }
    }
  }

  updateMarkerLocation() {
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Zone !!!");
      return;
    }
    let zoneNo = $(this.ddlZone).val();
    this.resetNewPathCache();
    this.commonService.getWardLine(zoneNo, this.todayDate).then((linesData: any) => {
      let totalLines = JSON.parse(linesData)["totalLines"];
      let dbPath = "Houses/" + zoneNo;
      let houseInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        houseInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let houseData = data[lineNo];
              let cardKeyArray = Object.keys(houseData);
              if (cardKeyArray.length > 0) {
                for (let j = 0; j < cardKeyArray.length; j++) {
                  let cardNo = cardKeyArray[j];
                  let latLng = houseData[cardNo]["latLng"];
                  latLng = latLng.toString().replace('(', '').replace(')', '');
                  this.setMarkerLocation(zoneNo, cardNo, latLng, totalLines);
                }
              }

            }
          }
        }
      });
    });
  }

  setMarkerLocation(zoneNo: any, cardNo: any, latLng: any, totalLines: any) {
    for (let i = 1; i <= totalLines; i++) {
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + i;
      // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      //   markerInstance.unsubscribe();
      // NEW PATH: MarkersData + LineWise (same {markerNo: record} shape)
      this.getNewPathLineData(zoneNo, i).then((data: any) => {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let j = 0; j < keyArray.length; j++) {
              let markerNo = keyArray[j];
              if (data[markerNo]["cardNumber"] != null) {
                if (data[markerNo]["cardNumber"] == cardNo) {
                  // OLD PATH (reference ke liye rakha hai):
                  // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + i + "/" + markerNo;
                  // this.db.object(dbPath).update({ latLng: latLng, preLatLng: data[markerNo]["latLng"] });
                  // NEW PATH: MarkersData/{uid}
                  let uid = this.getUid(zoneNo, i, markerNo);
                  if (uid == null) {
                    continue; // marker new path par nahi hai
                  }
                  this.db.object("EntityMarkingData/MarkersData/" + uid).update({ latLng: latLng, preLatLng: data[markerNo]["latLng"] });
                }
              }
            }
          }
        }
      });
    }
  }
}
