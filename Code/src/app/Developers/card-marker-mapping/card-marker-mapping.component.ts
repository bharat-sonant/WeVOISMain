import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-card-marker-mapping',
  templateUrl: './card-marker-mapping.component.html',
  styleUrls: ['./card-marker-mapping.component.scss']
})
export class CardMarkerMappingComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private storage: AngularFireStorage) { }
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

  mapHouseMarkerData() {
    if ($(this.ddlZoneCount).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Zone !!!");
      return;
    }
    $(this.divLoaderLineMove).show();
    let zoneNo = $(this.ddlZoneCount).val();
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            this.totalLineCount = keyArray.length;
            this.getWardLinesMarker(zoneNo, data, keyArray, 0);
          }
        }
      }
    );
  }

  getWardLinesMarker(zoneNo: any, data: any, keyArray: any, index: any) {
    if (index == keyArray.length) {
      $(this.divLoaderLineMove).hide();
      this.commonService.setAlertMessage("success", "Data Update Successfully!!!");
    }
    else {
      let lineNo = keyArray[index];
      let markerData = data[lineNo];
      let markerKeyArray = Object.keys(markerData);
      if (markerKeyArray.length > 0) {
        this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, 0, markerKeyArray);
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
                      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                      this.db.object(dbPath).update(markerData[markerNo]);
                      markerIndex++;
                      this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
                    }
                    else {
                      let lastMarkerKey = 1;
                      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/lastMarkerKey";
                      let lastMarkerKeyInstance = this.db.object(dbPath).valueChanges().subscribe(
                        lastMarkerKeyData => {
                          lastMarkerKeyInstance.unsubscribe();
                          if (lastMarkerKeyData != null) {
                            lastMarkerKey = Number(lastMarkerKeyData) + 1;
                          }
                          let oldImageName = markerData[markerNo]["image"];
                          markerData[markerNo]["image"] = lastMarkerKey + ".jpg";
                          let newImageName = lastMarkerKey + ".jpg";
                        //  console.log(markerData[markerNo]);
                          const pathOld = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneNo + "/" + lineNo + "/" + oldImageName;
                          const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
                          ref.getDownloadURL()
                            .then((url) => {
                              var xhr = new XMLHttpRequest();
                              xhr.responseType = 'blob';
                              xhr.onload = (event) => {
                                var blob = xhr.response;
                                const pathNew = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
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
                          let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastMarkerKey;
                          this.db.object(dbPath).update(markerData[markerNo]);

                          dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                          this.db.object(dbPath).remove();

                          dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
                          this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
                          markerIndex++;
                          this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);

                        });
                    }
                  }
                  else {
                  //  console.log("Card house not found => " + cardNo);
                    dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/cardNumber";
                    this.db.object(dbPath).remove();
                    markerIndex++;
                    this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
                  }
                });
            }
            else {
             // console.log("Card not mapped => " + cardNo);
              dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/cardNumber";
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
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + i;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let j = 0; j < keyArray.length; j++) {
              let markerNo = keyArray[j];
              if (data[markerNo]["cardNumber"] != null) {
                if (data[markerNo]["cardNumber"] == cardNo) {
                  dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + i + "/" + markerNo;
                  this.db.object(dbPath).update({ latLng: latLng, preLatLng: data[markerNo]["latLng"] });
                }
              }
            }
          }
        }
      });
    }
  }
}
