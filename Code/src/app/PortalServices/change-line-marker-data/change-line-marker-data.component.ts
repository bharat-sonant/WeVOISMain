import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-change-line-marker-data',
  templateUrl: './change-line-marker-data.component.html',
  styleUrls: ['./change-line-marker-data.component.scss']
})
export class ChangeLineMarkerDataComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, private commonService: CommonService, public httpService: HttpClient) { }
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
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", markerData);
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            let lastKey = 0;
            dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/lastMarkerKey";
            let lastMarkerInstance = this.db.object(dbPath).valueChanges().subscribe(
              lastMarkerData => {
                lastMarkerInstance.unsubscribe();
                if (lastMarkerData != null) {
                  this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", lastMarkerData);
                  lastKey = Number(lastMarkerData);
                }
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
      data["image"] = lastKey + ".jpg";
      let newImageName = lastKey + ".jpg";
      let city = this.commonService.getFireStoreCity();
      if (this.cityName == "sikar") {
        city = "Sikar-Survey";
      }
      let markerID = "";
      if (data["markerId"] != null) {
        markerID = this.commonService.getDefaultCardPrefix() + data["markerId"];
      }

      if (this.cityName == "hisar") {
        const pathOld = city + "/MarkingSurveyImages/" + zoneFrom + "/" + lineFrom + "/" + oldImageName;
        const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
        ref.getDownloadURL()
          .then((url) => {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = (event) => {
              var blob = xhr.response;
              const pathNew = city + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
              const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
              ref1.put(blob).then((promise) => {
                // ref.delete();

              }
              ).catch((error) => {

              });
            };
            xhr.open('GET', url);
            xhr.send();
          })
          .catch((error) => {

          });

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

        let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
        this.db.object(dbPath).update(data);

        dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
        this.db.object(dbPath).remove();

        if (markerID != "") {
          dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
          let obj = {
            image: lastKey + ".jpg",
            line: lineTo.toString(),
            markerNo: lastKey.toString(),
            ward: zoneTo
          }
          this.db.object(dbPath).update(obj);
        }
        index = index + 1;
        this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
      }
      else {

        const pathOld = city + "/MarkingSurveyImages/" + zoneFrom + "/" + lineFrom + "/" + oldImageName;
        const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
        ref.getDownloadURL()
          .then((url) => {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = (event) => {
              var blob = xhr.response;
              const pathNew = city + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
              const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
              ref1.put(blob).then((promise) => {
                // ref.delete();
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

                let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
                this.db.object(dbPath).update(data);

                dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
                this.db.object(dbPath).remove();

                if (markerID != "") {
                  dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
                  let obj = {
                    image: lastKey + ".jpg",
                    line: lineTo.toString(),
                    markerNo: lastKey.toString(),
                    ward: zoneTo
                  }
                  this.db.object(dbPath).update(obj);
                }
                index = index + 1;
                this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
              }).catch((error) => {
                index = index + 1;
                failureCount = failureCount + 1;
                this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
              });
            };

            xhr.open('GET', url);
            xhr.send();
          })
          .catch((error) => {
            index = index + 1;
            failureCount = failureCount + 1;
            this.moveData(index, markerNoList, lastKey, markerData, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
          });

      }
    }
    else {
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
      this.db.object(dbPath).update({ lastMarkerKey: lastKey });
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
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
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
                if (lineData[markerNo]["image"] != null) {
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
        this.commonService.saveCommonJsonFile(data, "MarkerWardMapping.json", this.commonService.getFireStoreCity() + "/MarkerWardMapping/");
        this.commonService.setAlertMessage("success", "File saved successfully.")
      }
    });

  }

  updateCounts(zoneNo: any, zoneTo: any, type: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts");
    $(this.divLoader).show();
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
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
              let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
              this.db.object(dbPath).update({ marksCount: markerCount, surveyedCount: surveyedCount, lineRevisitCount: revisitCount, lineRfidNotFoundCount: rfIdNotFound, alreadyInstalledCount: alreadyInstalledCount });
              if (lastMarkerKey > 0) {
                let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
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
