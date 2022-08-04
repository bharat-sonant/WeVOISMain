import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-change-line-marker-data',
  templateUrl: './change-line-marker-data.component.html',
  styleUrls: ['./change-line-marker-data.component.scss']
})
export class ChangeLineMarkerDataComponent implements OnInit {

  constructor(public fs: FirebaseService, private storage: AngularFireStorage, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  zoneList: any[];
  ddlZoneFrom = "#ddlZoneFrom";
  txtLineNoFrom = "#txtLineNoFrom";
  ddlZoneTo = "#ddlZoneTo";
  txtLineNoTo = "#txtLineNoTo";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  saveData() {
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
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            let lastKey = 0;
            let markerCount = 1;
            dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/lastMarkerKey";
            let lastMarkerInstance = this.db.object(dbPath).valueChanges().subscribe(
              lastMarkerData => {
                lastMarkerInstance.unsubscribe();
                if (lastMarkerData != null) {
                  lastKey = Number(lastMarkerData);
                }
                for (let i = 0; i < keyArray.length; i++) {
                  let markerNo = keyArray[i];
                  if (markerData[markerNo]["houseType"] != null) {
                    markerCount = markerCount + 1;
                    lastKey = lastKey + 1;
                    let data = markerData[markerNo];
                    data["image"] = lastKey + ".jpg";
                    dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
                    this.db.object(dbPath).update(data);

                    let oldImageName = markerNo + ".jpg";
                    let newImageName = lastKey + ".jpg";
                    this.moveImages(oldImageName, newImageName, lineFrom, lineTo, zoneFrom, zoneTo);
                  }
                }
                dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
                this.db.object(dbPath).update({ lastMarkerKey: lastKey })
                dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom;
                this.db.object(dbPath).remove();
                this.updateCounts(zoneFrom, zoneTo, "markerMove");
              });
          }
        }
        else {
          $(this.divLoader).hide();
        }
      }
    );
  }

  updateCounts(zoneNo: any, zoneTo: any, type: any) {
    $(this.divLoader).show();
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        if (markerData != null) {
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            let zoneMarkerCount = 0;
            let zoneAlreadyInstalledCount = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let markerCount = 0;
              let surveyedCount = 0;
              let revisitCount = 0;
              let rfIdNotFound = 0;
              let alreadyInstalledCount = 0;
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                if (lineData[markerNo]["houseType"] != null) {
                  markerCount = markerCount + 1;
                  zoneMarkerCount = zoneMarkerCount + 1;
                  if (lineData[markerNo]["cardNumber"] != null) {
                    surveyedCount = surveyedCount + 1;
                  }
                  else if (lineData[markerNo]["revisitKey"] != null) {
                    revisitCount = revisitCount + 1;
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
              this.db.object(dbPath).update({ marksCount: markerCount, surveyedCount: surveyedCount, lineRevisitCount: revisitCount, lineRfidNotFoundCount: rfIdNotFound, alreadyInstalledCount: alreadyInstalledCount })
            }

            let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo;
            this.db.object(dbPath).update({ alreadyInstalled: zoneAlreadyInstalledCount, marked: zoneMarkerCount });
          }
          if (type == "totalCount") {
            this.commonService.setAlertMessage("success", "Marker counts updated !!!")
            $(this.divLoader).hide();
          }
          else {
            if (zoneNo != zoneTo) {
              this.updateCounts(zoneTo, zoneTo, "markerMove");
            }
            else {
              this.commonService.setAlertMessage("success", "Marker moved successfully !!!")
              $(this.divLoader).hide();
            }
          }
        }
        else {
          if (type == "totalCount") {
            this.commonService.setAlertMessage("success", "Marker counts updated !!!")
            $(this.divLoader).hide();
          }
          else {
            if (zoneNo != zoneTo) {
              this.updateCounts(zoneTo, zoneTo, "markerMove");
            }
            else {
              this.commonService.setAlertMessage("success", "Marker moved successfully !!!")
              $(this.divLoader).hide();
            }
          }
        }
      });
  }


  moveImages(imageName: any, newImageName: any, lineNo: any, newLineNo: any, zoneNo: any, newZoneNo: any) {
    const pathOld = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneNo + "/" + lineNo + "/" + imageName;
    const ref = this.storage.storage.app.storage("https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/").ref(pathOld);
    ref.getDownloadURL()
      .then((url) => {
        // `url` is the download URL for 'images/stars.jpg'

        // This can be downloaded directly:
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        // xhr.setRequestHeader("Access-Control-Allow-Origin","*");
        // xhr.setRequestHeader('Connection', 'close');



        xhr.onload = (event) => {
          var blob = xhr.response;
          const pathNew = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + newZoneNo + "/" + newLineNo + "/" + newImageName;
          const ref1 = this.storage.storage.app.storage("https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/").ref(pathNew);
          ref1.put(blob).then((promise) => {
            // ref.delete();

          });
        };
        xhr.open('GET', url);

        xhr.send();
        // Or inserted into an <img> element
        // var img = document.getElementById('myimg');
        // img.setAttribute('src', url);
      })
      .catch((error) => {
        // console.log(error);
        // Handle any errors
      });
  }

  updateMarkerCounts() {
    let zoneNo = $(this.ddlZone).val();
    if (zoneNo == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.updateCounts(zoneNo, zoneNo, "totalCount");
  }
}
