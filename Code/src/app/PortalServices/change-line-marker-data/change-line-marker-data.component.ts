import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import { ActivatedRoute, Router } from "@angular/router";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-change-line-marker-data',
  templateUrl: './change-line-marker-data.component.html',
  styleUrls: ['./change-line-marker-data.component.scss']
})
export class ChangeLineMarkerDataComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, private commonService: CommonService, public httpService: HttpClient, private route: ActivatedRoute, private router: Router) { }
  cityName: any;
  db: any;
  zoneList: any[] = [];
  ddlZoneFrom = "#ddlZoneFrom";
  ddlZoneMarker = "#ddlZoneMarker";
  txtLineNoFrom = "#txtLineNoFrom";
  ddlZoneTo = "#ddlZoneTo";
  txtLineNoTo = "#txtLineNoTo";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";
  serviceName = "portal-service-change-line-marker-data";
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", "Change-Line-Marker-Data", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("allZoneList"));
  }

  // Opens the "Marker Data Move" page, keeping the same cityId/id route segments.
  goToMoveMarkerData() {
    let cityId = this.route.snapshot.paramMap.get("cityId");
    let id = this.route.snapshot.paramMap.get("id");
    this.router.navigate([cityId, id, "marker-data-move"]);
  }

  getAllZones() {
    let hiddenList = [{ zone: "Beed-Tractor" }, { zone: "BinLifting" }, { zone: "Commercial" }, { zone: "Compactor" }, { zone: "FixedWages" }, { zone: "GarageWork" }, { zone: "GeelaKachra" }, { zone: "Maint" }, { zone: "Market" }, { zone: "SegregationWork" }, { zone: "UIT" }, { zone: "WetWaste" }, { zone: "mkt" }];
    console.log(hiddenList);
    this.zoneList.push({ zoneNo: "0", zoneName: "-- Select --" });
    let dbPath = "Tasks";
    let zoneInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      zoneInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let zone = keyArray[i];
          console.log(zone)
          let detail = hiddenList.find(item => zone.toString().includes(item.zone.toString()));
          console.log(detail);
          if (detail == undefined) {
            this.zoneList.push({ zoneNo: zone, zoneName: "Zone " + zone });
          }
        }
      }
    })
  }


  markersDataCache: any = null;

  loadMarkersData(): Promise<any> {
    return new Promise((resolve) => {
      if (this.markersDataCache != null) {
        resolve(this.markersDataCache);
        return;
      }
      let markersInstance = this.db.object("EntityMarkingData/MarkersData").valueChanges().subscribe((data: any) => {
        markersInstance.unsubscribe();
        this.markersDataCache = data != null ? data : {};
        resolve(this.markersDataCache);
      });
    });
  }

  getNewPathLineData(wardNo: any, lineNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + wardNo + "/" + lineNo;
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
            found++;
          }
          resolve(found > 0 ? lineData : null);
        });
      });
    });
  }

  getNewPathWardData(wardNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + wardNo;
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

        let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + zoneTo + "/" + lineTo;
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

  // Old markerNo -> new uid (M{n}). Migrate na hua ho to null.
  getMarkerUid(ward: any, line: any, markerNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + ward + "/" + line + "/" + markerNo;
      let inst = this.db.object(linkPath).valueChanges().subscribe((uid: any) => {
        inst.unsubscribe();
        resolve(uid != null && uid != "" ? uid : null);
      });
    });
  }

  // Marker ko nayi line/ward par. Data global rehta hai, sirf mapping re-point hoti hai. OriginalToUid yahan NAHI chhuti, warna migration re-run par duplicate uid ban jaayega.
  moveMarkerOnNewPath(uid: any, zoneFrom: any, lineFrom: any, markerNoFrom: any, zoneTo: any, lineTo: any, newMarkerNo: any, data: any, extra: any = null) {
    this.markersDataCache = null; // write ke baad cache stale

    // Move history: marker kahan se kahan gaya, iska permanent record.
    this.writeMoveHistory(uid, zoneFrom, lineFrom, markerNoFrom, zoneTo, lineTo, newMarkerNo);

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

    // OldMarkerToNewUid: nayi jagah add, purani jagah se hata do
    this.db.object("EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + zoneTo + "/" + lineTo + "/" + newMarkerNo).set(uid);
    this.db.database.ref("EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + zoneFrom + "/" + lineFrom + "/" + markerNoFrom).set(null);

    // MarkerWise mapping (line wahi type me jo record par likhi, warna kahin Number kahin string ho jaati)
    this.db.object("EntityMarkingData/MarkersMapping/MarkerWise/" + uid).update({ line: patch["line"], ward: zoneTo });

    // WardWise mapping: ward badla to purane ward se hata do
    if (zoneFrom != zoneTo) {
      this.db.database.ref("EntityMarkingData/MarkersMapping/WardWise/" + zoneFrom + "/" + uid).set(null);
    }
    this.db.object("EntityMarkingData/MarkersMapping/WardWise/" + zoneTo + "/" + uid).set(patch["line"]);
  }

  // Har move ka permanent record: MoveHistory/{uid}.
  writeMoveHistory(uid: any, zoneFrom: any, lineFrom: any, markerNoFrom: any, zoneTo: any, lineTo: any, newMarkerNo: any) {
    let entry = {
      fromWard: zoneFrom,
      fromLine: lineFrom,
      fromMarkerNo: markerNoFrom,
      toWard: zoneTo,
      toLine: lineTo,
      toMarkerNo: newMarkerNo,
      movedBy: localStorage.getItem("userID"),
      movedOn: this.commonService.getTodayDateTime()
    };
    this.db.list("EntityMarkingData/MarkersMapping/MoveHistory/" + uid).push(entry);
  }

  saveData() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "saveData");
    if ($(this.ddlZoneFrom).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone from !!!");
      return;
    }

    if ($(this.txtLineNoFrom).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter line no from !!!");
      return;
    }

    if ($(this.ddlZoneTo).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone to !!!");
      return;
    }

    if ($(this.txtLineNoTo).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter line no to !!!");
      return;
    }
    let zoneFrom = $(this.ddlZoneFrom).val();
    let lineFrom = $(this.txtLineNoFrom).val();
    let zoneTo = $(this.ddlZoneTo).val();
    let lineTo = $(this.txtLineNoTo).val();
    $(this.divLoader).show();
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom;
    // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
    //   markerData => {
    //     markerInstance.unsubscribe();
    // NEW PATH: MarkersData + OldMarkerToNewUid (same {markerNo: record} shape)
    let dbPath = "";
    this.getNewPathLineData(zoneFrom, lineFrom).then(
      (markerData: any) => {
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", markerData);
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            let lastKey = 0;
            // OLD PATH (reference ke liye rakha hai):
            // dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/lastMarkerKey";
            // let lastMarkerInstance = this.db.object(dbPath).valueChanges().subscribe(
            //   lastMarkerData => {
            //     lastMarkerInstance.unsubscribe();
            //     if (lastMarkerData != null) {
            //       this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", lastMarkerData);
            //       lastKey = Number(lastMarkerData);
            //     }
            // NEW PATH: agla markerNo = LineSummary ka lastMarkerKey aur line ki asli mapping keys, dono me se bada.
            this.getSafeLastKey(zoneTo, lineTo).then(
              (safeLastKey: any) => {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", safeLastKey);
                lastKey = Number(safeLastKey);
                let markerNoList = [];
                for (let i = 0; i < keyArray.length; i++) {
                  let markerNo = keyArray[i];
                  if (markerData[markerNo]["houseType"] != null) {
                    markerNoList.push({ markerNo: markerNo });
                  }
                }
                this.moveData(0, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, 0);
              });
          }
        }
        else {
          $(this.divLoader).hide();
        }
      }
    );
  }

  moveData(index: any, markerNoList: any, lastKey: any, markerData: any, zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "moveData");
    if (index < markerNoList.length) {
      lastKey = lastKey + 1;
      let markerNo = markerNoList[index]["markerNo"];
      let data = markerData[markerNo];
      let oldImageName = data["image"];
      // OLD PATH (reference ke liye rakha hai):
      // data["image"] = lastKey + ".jpg";
      // let newImageName = lastKey + ".jpg";
      // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.
      let newImageName = data["imgRef"] != null ? data["imgRef"] : oldImageName;
      let city = this.commonService.getFireStoreCity();
      if (this.cityName == "sikar") {
        city = "Sikar-Survey";
      }
      let markerID = "";
      if (data["markerId"] != null) {
        markerID = this.commonService.getDefaultCardPrefix() + data["markerId"];
      }

        // OLD PATH (reference ke liye rakha hai):
        // const pathOld = city + "/MarkingSurveyImages/" + zoneFrom + "/" + lineFrom + "/" + oldImageName;
        // const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
        // ref.getDownloadURL()
        //   .then((url) => {
        //     var xhr = new XMLHttpRequest();
        //     xhr.responseType = 'blob';
        //     xhr.onload = (event) => {
        //       var blob = xhr.response;
        //       const pathNew = city + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
        //       const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
        //       ref1.put(blob).then((promise) => {
                // ref.delete();
        //       }
        //       ).catch((error) => {
        //       });
        //     };
        //     xhr.open('GET', url);
        //     xhr.send();
        //   })
        //   .catch((error) => {
        //   });
      if (this.cityName == "hisar") {

        if (data["cardNumber"] != null) {
          let cardNo = data["cardNumber"];
          if (markerID != "") {
            markerID = cardNo;
          }
          let dbPath = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
          let cardInstance = this.db.object(dbPath).valueChanges().subscribe(cardData => {
            cardInstance.unsubscribe();
            if (cardData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", cardData);
              data["latLng"] = cardData["latLng"].toString().replace("(", "").replace(")", "");
              cardData["line"] = lineTo;
              cardData["ward"] = zoneTo;
              let dbPath = "Houses/" + zoneTo + "/" + lineTo + "/" + cardNo;
              this.db.object(dbPath).update(cardData);

              dbPath = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
              this.db.object(dbPath).remove();

              // modify card ward mapping
              this.db.object("CardWardMapping/" + cardNo).set({ line: lineTo, ward: zoneTo });

              if (cardData["mobile"] != "") {
                // modify house ward mapping
                this.db.object("HouseWardMapping/" + cardData["mobile"]).set({ line: lineTo, ward: zoneTo });
              }
            }

          });

        }
        if (data["revisitKey"] != null) {
          let revisitKey = data["revisitKey"];
          let dbPathPre = "EntitySurveyData/RevisitRequest/" + zoneFrom + "/" + lineFrom + "/" + revisitKey;
          let revisitInstance = this.db.object(dbPathPre).valueChanges().subscribe(revisitData => {
            revisitInstance.unsubscribe();
            if (revisitData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", revisitData);
              let dbPath = "EntitySurveyData/RevisitRequest/" + zoneTo + "/" + lineTo + "/" + revisitKey;
              this.db.object(dbPath).update(revisitData);
              this.db.object(dbPathPre).remove();
            }
          });
        }

        // OLD PATH (reference ke liye rakha hai):
        // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
        // this.db.object(dbPath).update(data);
        // dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
        // this.db.object(dbPath).remove();
        // NEW PATH: uid nikaal kar mapping re-point karo (data global hi rehta hai)
        this.getMarkerUid(zoneFrom, lineFrom, markerNo).then((uid: any) => {
          if (uid == null) {
            // marker migrate nahi hua -> move skip, failure me gino
            index = index + 1;
            failureCount = failureCount + 1;
            this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
            return;
          }
          this.moveMarkerOnNewPath(uid, zoneFrom, lineFrom, markerNo, zoneTo, lineTo, lastKey, data);

          // OLD PATH (reference ke liye rakha hai):
          // if (markerID != "") {
          //   dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
          //   let obj = {
          //     image: lastKey + ".jpg",
          //     line: lineTo.toString(),
          //     markerNo: lastKey.toString(),
          //     ward: zoneTo
          if (markerID != "") {
            let dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
            let obj = {
              image: newImageName,
              line: lineTo.toString(),
              markerNo: lastKey.toString(),
              ward: zoneTo
            }
            this.db.object(dbPath).update(obj);
          }
          // OLD PATH (reference ke liye rakha hai):
          //   this.db.object(dbPath).update(obj);
          // }
          // index = index + 1;
          // this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
          index = index + 1;
          this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
        });
      }
      else {
        // OLD PATH (reference ke liye rakha hai):
        // const pathOld = city + "/MarkingSurveyImages/" + zoneFrom + "/" + lineFrom + "/" + oldImageName;
        // const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
        // ref.getDownloadURL()
        //   .then((url) => {
        //     var xhr = new XMLHttpRequest();
        //     xhr.responseType = 'blob';
        //     xhr.onload = (event) => {
        //       var blob = xhr.response;
        //       const pathNew = city + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
        //       const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
        //       ref1.put(blob).then((promise) => {
                // ref.delete();
        // New path me image global hai, isliye DB kaam ab seedha chalta hai (pehle image copy ke andar tha).
                if (data["cardNumber"] != null) {
                  let cardNo = data["cardNumber"];
                  if (markerID != "") {
                    markerID = cardNo;
                  }
                  let dbPath = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
                  let cardInstance = this.db.object(dbPath).valueChanges().subscribe(cardData => {
                    cardInstance.unsubscribe();
                    if (cardData != null) {
                      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", cardData);
                      data["latLng"] = cardData["latLng"].toString().replace("(", "").replace(")", "");
                      cardData["line"] = lineTo;
                      cardData["ward"] = zoneTo;
                      let dbPath = "Houses/" + zoneTo + "/" + lineTo + "/" + cardNo;
                      this.db.object(dbPath).update(cardData);

                      dbPath = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
                      this.db.object(dbPath).remove();

                      // modify card ward mapping
                      this.db.object("CardWardMapping/" + cardNo).set({ line: lineTo, ward: zoneTo });



                      if (cardData["mobile"] != "") {
                        // modify house ward mapping
                        this.db.object("HouseWardMapping/" + cardData["mobile"]).set({ line: lineTo, ward: zoneTo });
                      }
                    }

                  });

                }
                if (data["revisitKey"] != null) {
                  let revisitKey = data["revisitKey"];
                  let dbPathPre = "EntitySurveyData/RevisitRequest/" + zoneFrom + "/" + lineFrom + "/" + revisitKey;
                  let revisitInstance = this.db.object(dbPathPre).valueChanges().subscribe(revisitData => {
                    revisitInstance.unsubscribe();
                    if (revisitData != null) {
                      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", revisitData);
                      let dbPath = "EntitySurveyData/RevisitRequest/" + zoneTo + "/" + lineTo + "/" + revisitKey;
                      this.db.object(dbPath).update(revisitData);
                      this.db.object(dbPathPre).remove();
                    }
                  });
                }

                // OLD PATH (reference ke liye rakha hai):
                // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
                // this.db.object(dbPath).update(data);
                // dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
                // this.db.object(dbPath).remove();
                // if (markerID != "") {
                //   dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
                //   let obj = {
                //     image: lastKey + ".jpg",
                //     line: lineTo.toString(),
                //     markerNo: lastKey.toString(),
                //     ward: zoneTo
                // NEW PATH: uid nikaal kar mapping re-point karo (data global hi rehta hai)
                this.getMarkerUid(zoneFrom, lineFrom, markerNo).then((uid: any) => {
                  if (uid == null) {
                    // marker migrate nahi hua -> move skip, failure me gino
                    index = index + 1;
                    failureCount = failureCount + 1;
                    this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
                    return;
                  }
                  // OLD PATH (reference ke liye rakha hai):
                  //         this.db.object(dbPath).update(obj);
                  //       }
                  //       index = index + 1;
                  //       this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
                  //     }).catch((error) => {
                  //       index = index + 1;
                  //       failureCount = failureCount + 1;
                  //       this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
                  //     });
                  //   };
                  //   xhr.open('GET', url);
                  //   xhr.send();
                  // })
                  // .catch((error) => {
                  //   index = index + 1;
                  //   failureCount = failureCount + 1;
                  //   this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
                  // });
                  this.moveMarkerOnNewPath(uid, zoneFrom, lineFrom, markerNo, zoneTo, lineTo, lastKey, data);

                  if (markerID != "") {
                    let dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
                    let obj = {
                      image: newImageName,
                      line: lineTo.toString(),
                      markerNo: lastKey.toString(),
                      ward: zoneTo
                    }
                    this.db.object(dbPath).update(obj);
                  }
                  index = index + 1;
                  this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
                });
      }
    }
    else {
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
      // NEW PATH: LineSummary
      let dbPath = this.getLineSummaryPath(zoneTo, lineTo);
      this.db.object(dbPath).update({ lastMarkerKey: lastKey });
      // NOTE: MarkersMapping/WardWise/{ward}/lastMarkerKey yahan jaan-boojh kar nahi likhte. Wahan marker-data-move GLOBAL M-counter ka mirror rakhta hai, aur yahan wala lastKey line-level markerNo hai - likhne se counter ka mirror kharab ho jaata.
      this.updateCounts(zoneFrom, zoneTo, "markerMove", failureCount);
    }
  }

  updateWardMarker() {
    let zoneNo = $(this.ddlZoneMarker).val();
    if (zoneNo == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateWardMarker");
    $(this.divLoader).show();
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
    //   markerData => {
    //     markerInstance.unsubscribe();
    // NEW PATH: MarkersData + OldMarkerToNewUid
    this.getNewPathWardData(zoneNo).then(
      (markerData: any) => {
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateWardMarker", markerData);
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                let markerId = "";
                let latLng = "";
                let image = "";
                if (lineData[markerNo]["cardNumber"] != null) {
                  markerId = lineData[markerNo]["cardNumber"];
                }
                else if (lineData[markerNo]["markerId"] != null) {
                  markerId = this.commonService.getDefaultCardPrefix() + lineData[markerNo]["markerId"];
                }
                if (lineData[markerNo]["latLng"] != null) {
                  latLng = lineData[markerNo]["latLng"];
                }
                // OLD PATH (reference ke liye rakha hai):
                // if (lineData[markerNo]["image"] != null) {
                // NEW PATH: imgRef (flat AllMarkerImages folder), fallback purana image
                if (lineData[markerNo]["imgRef"] != null) {
                  image = lineData[markerNo]["imgRef"];
                }
                else if (lineData[markerNo]["image"] != null) {
                  image = lineData[markerNo]["image"];
                }
                if (markerId != "") {
                  let data = {
                    ward: zoneNo,
                    line: lineNo,
                    latLng: latLng,
                    image: image,
                    markerNo: markerNo
                  }
                  let path = "EntityMarkingData/MarkerWardMapping/" + markerId;
                  this.db.object(path).update(data);
                }
              }
            }
          }
          this.commonService.setAlertMessage("success", "Data updated successfully.")

        }
        else {
          this.commonService.setAlertMessage("error", "Sorry! No data found for selected ward.")
        }
        $(this.divLoader).hide();
      });

  }

  saveOnStorage() {
    let path = "EntityMarkingData/MarkerWardMapping/";
    let instance = this.db.object(path).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        this.commonService.saveJsonFile(data, "MarkerWardMapping.json", "/MarkerWardMapping/");
        this.commonService.setAlertMessage("success", "File saved successfully.")
      }
    });

  }

  updateCounts(zoneNo: any, zoneTo: any, type: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts");
    $(this.divLoader).show();
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
    //   markerData => {
    //     markerInstance.unsubscribe();
    // NEW PATH: MarkersData + OldMarkerToNewUid
    this.getNewPathWardData(zoneNo).then(
      (markerData: any) => {
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCounts", markerData);
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            let zoneMarkerCount = 0;
            let zoneAlreadyInstalledCount = 0;
            let totalSurveyed = 0;
            let totalRevisit = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let markerCount = 0;
              let surveyedCount = 0;
              let revisitCount = 0;
              let rfIdNotFound = 0;
              let alreadyInstalledCount = 0;
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let lastMarkerKey = 0;
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                if (lineData[markerNo]["houseType"] != null) {
                  lastMarkerKey = Number(markerNo);
                  markerCount = markerCount + 1;
                  zoneMarkerCount = zoneMarkerCount + 1;
                  if (lineData[markerNo]["cardNumber"] != null) {
                    surveyedCount = surveyedCount + 1;
                    totalSurveyed = totalSurveyed + 1;
                  }
                  else if (lineData[markerNo]["revisitKey"] != null) {
                    revisitCount = revisitCount + 1;
                    totalRevisit = totalRevisit + 1;
                  }
                  else if (lineData[markerNo]["rfidNotFoundKey"] != null) {
                    rfIdNotFound = rfIdNotFound + 1;
                  }
                  if (lineData[markerNo]["alreadyInstalled"] == true) {
                    alreadyInstalledCount = alreadyInstalledCount + 1;
                    zoneAlreadyInstalledCount = zoneAlreadyInstalledCount + 1;
                  }
                }
              }
              // OLD PATH (reference ke liye rakha hai):
              // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
              // NEW PATH: LineSummary
              let dbPath = this.getLineSummaryPath(zoneNo, lineNo);
              this.db.object(dbPath).update({ marksCount: markerCount, surveyedCount: surveyedCount, lineRevisitCount: revisitCount, lineRfidNotFoundCount: rfIdNotFound, alreadyInstalledCount: alreadyInstalledCount });
              if (lastMarkerKey > 0) {
                // OLD PATH (reference ke liye rakha hai):
                // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                // NEW PATH: LineSummary
                let dbPath = this.getLineSummaryPath(zoneNo, lineNo);
                this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
              }
            }
            let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo;
            this.db.object(dbPath).update({ alreadyInstalled: zoneAlreadyInstalledCount, marked: zoneMarkerCount });
            dbPath = "EntitySurveyData/TotalHouseCount/" + zoneNo;
            this.db.object(dbPath).set(totalSurveyed.toString());
            dbPath = "EntitySurveyData/TotalRevisitRequest/" + zoneNo;
            this.db.object(dbPath).set(totalRevisit.toString());
          }
          if (type == "totalCount") {
            this.commonService.setAlertMessage("success", "Marker counts updated !!!")
            $(this.divLoader).hide();
          }
          else {
            if (zoneNo != zoneTo) {
              this.updateCounts(zoneTo, zoneTo, "markerMove", failureCount);
            }
            else {
              if (failureCount > 0) {
                let msg = failureCount + " markers have some issue to be processed, Please try again.";
                this.commonService.setAlertMessage("error", msg);
              }
              else {
                this.commonService.setAlertMessage("success", "Marker moved successfully !!!");
              }
              $(this.divLoader).hide();
            }
          }
        }
        else {
          if (type == "totalCount") {
            this.commonService.setAlertMessage("success", "Marker counts updated !!!")
            $(this.divLoader).hide();
          }
        }
      });
  }

  updateMarkerCounts() {
    let zoneNo = $(this.ddlZone).val();
    if (zoneNo == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.updateCounts(zoneNo, zoneNo, "totalCount", 0);
  }
}
