import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "angularfire2/storage";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { MarkerMappingService } from '../../services/marker/marker-mapping.service';

@Component({
  selector: 'app-change-line-surveyed-data',
  templateUrl: './change-line-surveyed-data.component.html',
  styleUrls: ['./change-line-surveyed-data.component.scss']
})
export class ChangeLineSurveyedDataComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, private storage: AngularFireStorage, private markerMapping: MarkerMappingService) { }
  cityName: any;
  db: any;
  public selectedZone: any;
  zoneList: any[];
  ddlZoneFrom = "#ddlZoneFrom";
  txtLineNoFrom = "#txtLineNoFrom";
  ddlZoneTo = "#ddlZoneTo";
  txtLineNoTo = "#txtLineNoTo";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";
  ddlZoneCount = "#ddlZoneCount";
  serviceName = "portal-service-change-line-surveyed-data";
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", "Change-Line-Surveyed-Data", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("allZoneList"));
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
            found++;
          }
          resolve(found > 0 ? lineData : null);
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

  // Old markerNo -> new uid (M{n}). Migrate na hua ho to null.
  getMarkerUid(ward: any, line: any, markerNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + ward + "/" + line + "/" + markerNo;
      let inst = this.db.object(linkPath).valueChanges().subscribe((uid: any) => {
        inst.unsubscribe();
        resolve(uid != null && uid != "" ? uid : null);
      });
    });
  }

  // uid se poora marker record.
  getMarkerByUid(uid: any): Promise<any> {
    return new Promise((resolve) => {
      let inst = this.db.object("EntityMarkingData/MarkersData/" + uid).valueChanges().subscribe((data: any) => {
        inst.unsubscribe();
        resolve(data);
      });
    });
  }

  // Marker ko nayi line/ward par. Data global rehta hai, sirf mapping re-point hoti hai. OriginalToUid yahan NAHI chhuti, warna migration re-run par duplicate uid ban jaayega.
  moveMarkerOnNewPath(uid: any, zoneFrom: any, lineFrom: any, markerNoFrom: any, zoneTo: any, lineTo: any, newMarkerNo: any, data: any, extra: any = null) {
    this.markersDataCache = null; // write ke baad cache stale

    // Move history: marker kahan se kahan gaya, iska permanent record.
    this.markerMapping.recordMove(this.db, uid, zoneFrom, lineFrom, markerNoFrom, zoneTo, lineTo, newMarkerNo);

    // lineTo textbox se string ("7") ban kar aata hai, jabki marker-data-move ne
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
    $(this.divLoader).show();
    let zoneFrom = $(this.ddlZoneFrom).val();
    let lineFrom = $(this.txtLineNoFrom).val();
    let zoneTo = $(this.ddlZoneTo).val();
    let lineTo = $(this.txtLineNoTo).val();
    let lastMarkerKey = 1;
    let dbPath = "Houses/" + zoneFrom + "/" + lineFrom;
    let houseFromInstance = this.db.list(dbPath).valueChanges().subscribe(
      fromDataList => {
        houseFromInstance.unsubscribe();
        if (fromDataList.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", fromDataList);
          // OLD PATH (reference ke liye rakha hai):
          // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/lastMarkerKey";
          // let lastMarkerKeyInstance = this.db.object(dbPath).valueChanges().subscribe(
          //   lastMarkerKeyData => {
          //     lastMarkerKeyInstance.unsubscribe();
          //     if (lastMarkerKeyData != null) {
          //       this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", lastMarkerKeyData);
          //       lastMarkerKey = Number(lastMarkerKeyData) + 1;
          //     }
          //     dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom;
          //     let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
          //       markerData => {
          // NEW PATH: agla markerNo = LineSummary ka lastMarkerKey aur line ki asli mapping keys, dono me se bada.
          this.getSafeLastKey(zoneTo, lineTo).then(
            (safeLastKey: any) => {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", safeLastKey);
              lastMarkerKey = Number(safeLastKey) + 1;
              // NEW PATH: MarkersData + LineWise (same {markerNo: record} shape)
              this.getNewPathLineData(zoneFrom, lineFrom).then(
                (markerData: any) => {
                  // OLD PATH (reference ke liye rakha hai):
                  // markerInstance.unsubscribe();
                  let markerList = [];
                  if (markerData != null) {
                    this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", markerData);
                    let keyArray = Object.keys(markerData);
                    for (let i = 0; i < keyArray.length; i++) {
                      let markerNo = keyArray[i];
                      if (markerData[markerNo]["cardNumber"] != null) {
                        markerList.push({ markerNo: markerNo, cardNumber: markerData[markerNo]["cardNumber"] });
                      }
                    }
                  }
                  this.moveHouseData(0, zoneFrom, zoneTo, lineFrom, lineTo, lastMarkerKey, markerList, fromDataList);
                }
              );
            }
          )
        }
        else {
          this.commonService.setAlertMessage("error", "No house find in selected ward and lines !!!");
        }
      }
    );
  }

  moveHouseData(index: any, zoneFrom: any, zoneTo: any, lineFrom: any, lineTo: any, lastMarkerKey: any, markerList: any, fromDataList: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "moveHouseData");
    if (index == fromDataList.length) {
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
      // NEW PATH: LineSummary
      let dbPath = this.getLineSummaryPath(zoneTo, lineTo);
      this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
      this.commonService.setAlertMessage("success", "Line data moved successfully");
      $(this.divLoader).hide();
    }
    else {
      let cardNo = fromDataList[index]["cardNo"];
      let data = fromDataList[index];
      data["line"] = lineTo;
      data["ward"] = zoneTo;
      let latLng = data["latLng"].toString().replace("(", "").replace(")", "");

      this.db.object("Houses/" + zoneTo + "/" + lineTo + "/" + cardNo).set(data);

      let path = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
      this.db.object(path).remove();

      // modify card ward mapping
      this.db.object("CardWardMapping/" + data["cardNo"]).set({ line: lineTo, ward: zoneTo, });

      if (data["mobile"] != "") {
        // modify house ward mapping
        this.db.object("HouseWardMapping/" + data["mobile"]).set({ line: lineTo, ward: zoneTo, });
      }
      if (markerList.length != 0) {
        let detail = markerList.find(item => item.cardNumber == cardNo);
        if (detail != undefined) {
          let markerNo = detail.markerNo;
          // OLD PATH (reference ke liye rakha hai):
          // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
          // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
          //   markerData => {
          //     markerInstance.unsubscribe();
          // NEW PATH: pehle uid nikaalo, phir usi uid ka record padho.
          this.getMarkerUid(zoneFrom, lineFrom, markerNo).then((uid: any) => {
            if (uid == null) {
              // marker migrate nahi hua -> marker move skip (card move ho chuka hai)
              lastMarkerKey++;
              index++;
              this.moveHouseData(index, zoneFrom, zoneTo, lineFrom, lineTo, lastMarkerKey, markerList, fromDataList);
              return;
            }
            this.getMarkerByUid(uid).then((markerData: any) => {
              if (markerData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveHouseData", markerData);
                let oldImageName = markerData["image"];
                // OLD PATH (reference ke liye rakha hai):
                // markerData["image"] = lastMarkerKey + ".jpg";
                // let newImageName = lastMarkerKey + ".jpg";
                // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.
                let newImageName = markerData["imgRef"] != null ? markerData["imgRef"] : oldImageName;
                markerData["latLng"] = latLng;
                let city = this.commonService.getFireStoreCity();
                if (this.cityName == "sikar") {
                  city = "Sikar-Survey";
                }
                let markerID = "";
                if (markerData["markerId"] != null) {
                  markerID = cardNo;
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
                // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastMarkerKey;
                // this.db.object(dbPath).update(markerData);
                }

                // OLD PATH (reference ke liye rakha hai):
                // dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
                // this.db.object(dbPath).remove();
                // NEW PATH: mapping re-point karo (data global hi rehta hai).
                this.moveMarkerOnNewPath(uid, zoneFrom, lineFrom, markerNo, zoneTo, lineTo, lastMarkerKey, markerData);

                if (markerID != "") {
                  // OLD PATH (reference ke liye rakha hai):
                  // dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
                  let dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
                  let obj = {
                    // OLD PATH (reference ke liye rakha hai):
                    // image: lastMarkerKey + ".jpg",
                    image: newImageName,
                    line: lineTo.toString(),
                    markerNo: lastMarkerKey.toString(),
                    ward: zoneTo
                  }
                  this.db.object(dbPath).update(obj);
                }


                lastMarkerKey++;
                index++;
                this.moveHouseData(index, zoneFrom, zoneTo, lineFrom, lineTo, lastMarkerKey, markerList, fromDataList);
              }
              else {
                lastMarkerKey++;
                index++;
                this.moveHouseData(index, zoneFrom, zoneTo, lineFrom, lineTo, lastMarkerKey, markerList, fromDataList);
              }
            // OLD PATH (reference ke liye rakha hai):
            //   }
            // );
            });
          });
        }
        else {
          lastMarkerKey++;
          index++;
          this.moveHouseData(index, zoneFrom, zoneTo, lineFrom, lineTo, lastMarkerKey, markerList, fromDataList);
        }
      }
      else {
        lastMarkerKey++;
        index++;
        this.moveHouseData(index, zoneFrom, zoneTo, lineFrom, lineTo, lastMarkerKey, markerList, fromDataList);
      }
    }
  }

  updateCardLineData() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCardLineData");
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone from !!!");
      return;
    }
    let zoneNo = $(this.ddlZone).val();
    let dbPath = "Houses/" + zoneNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        if (houseData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCardLineData", houseData);
          let keyArray = Object.keys(houseData);
          if (keyArray.length > 0) {
            let count = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let line = keyArray[i];
              let cardObj = houseData[line];
              let cardKeyArray = Object.keys(cardObj);
              for (let j = 0; j < cardKeyArray.length; j++) {
                count++;
                let cardNo = cardKeyArray[j];
                dbPath = "CardWardMapping/" + cardNo;
                this.db.object(dbPath).update({ line: line, ward: zoneNo });
              }
            }
          }
        }
        this.commonService.setAlertMessage("success", "Card line mapping updated !!!");
      }
    );
  }

  updateSurveyCount() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateSurveyCount");
    if ($(this.ddlZoneCount).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone from !!!");
      return;
    }
    let zoneNo = $(this.ddlZoneCount).val();
    let dbPath = "Houses/" + zoneNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        if (houseData != null) {
          let keyArray = Object.keys(houseData);
          if (keyArray.length > 0) {
            let totalHouseHoldCount = 0;
            let totalComplexCount = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let line = keyArray[i];
              let houseHoldCount = 0;
              let complexCount = 0;
              let cardObj = houseData[line];
              let cardKeyArray = Object.keys(cardObj);
              for (let j = 0; j < cardKeyArray.length; j++) {
                let cardNo = cardKeyArray[j];
                if (cardObj[cardNo]["houseType"] == "19" || cardObj[cardNo]["houseType"] == "20") {
                  complexCount++;
                  totalComplexCount++;
                  if (cardObj[cardNo]["Entities"] != null) {

                    houseHoldCount = houseHoldCount + (cardObj[cardNo]["Entities"].length - 1);
                    totalHouseHoldCount = totalHouseHoldCount + (cardObj[cardNo]["Entities"].length - 1);
                  }
                }
              }
              // OLD PATH (reference ke liye rakha hai):
              // let dbHouseHoldPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + line;
              // NEW PATH: line-level counts ab LineSummary par
              let dbHouseHoldPath = this.getLineSummaryPath(zoneNo, line);
              this.db.object(dbHouseHoldPath).update({ houseHoldCount: houseHoldCount, complexCount: complexCount });
            }

            let dbTotalHouseHoldCountPath = "EntitySurveyData/TotalHouseHoldCount/";
            let houseHoldInstance = this.db.object(dbTotalHouseHoldCountPath).valueChanges().subscribe(data => {
              houseHoldInstance.unsubscribe();
              let houseHoldData = {};
              if (data != null) {
                houseHoldData = data;
              }
              houseHoldData[zoneNo.toString()] = totalHouseHoldCount;
              this.db.object(dbTotalHouseHoldCountPath).update(houseHoldData);
              let dbTotalComplexCountPath = "EntitySurveyData/TotalComplexCount/";
              let complexInstance = this.db.object(dbTotalComplexCountPath).valueChanges().subscribe(complexData => {
                complexInstance.unsubscribe();
                let complexCountData = {};
                if (complexData != null) {
                  complexCountData = complexData;
                }
                complexCountData[zoneNo.toString()] = totalComplexCount;
                this.db.object(dbTotalComplexCountPath).update(complexCountData);
                this.commonService.setAlertMessage("success", "Card house hold count updated !!!");
              });
            });

          }
        }
      }
    );
  }


  updateWardWiseCard() {
    $(this.divLoader).show();
    this.getWardWiseCards(1);
  }

  getWardWiseCards(index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardWiseCards");
    if (index == this.zoneList.length) {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("success", "Ward wise JSON updated successfully !!!");
    }
    else {
      let zoneNo = this.zoneList[index]["zoneNo"];
      let dbPath = "Houses/" + zoneNo;
      let instance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          instance.unsubscribe();
          let houseCounts = 0;
          if (data != null) {
            let cardList = [];
            let lineArray = Object.keys(data);
            if (lineArray.length > 0) {
              for (let i = 0; i < lineArray.length; i++) {
                let lineNo = lineArray[i];
                let houseData = data[lineNo];
                let houseArray = Object.keys(houseData);
                for (let j = 0; j < houseArray.length; j++) {
                  let cardNo = houseArray[j];
                  let entityType = "1";
                  let amount = 0;
                  if (houseData[cardNo]["houseType"] != null) {
                    entityType = houseData[cardNo]["houseType"];
                  }
                  cardList.push({ cardNo: cardNo, entityType: entityType });
                }
                houseCounts = houseCounts + houseArray.length;
              }
            }
            let fileName = zoneNo + ".json";
            let filePath = "/WardWiseCardJSON/";
            this.commonService.saveJsonFile(cardList, fileName, filePath);
            index++;
            this.getWardWiseCards(index);
          }
          else {
            index++;
            this.getWardWiseCards(index);
          }
        }
      );
    }

  }
}
