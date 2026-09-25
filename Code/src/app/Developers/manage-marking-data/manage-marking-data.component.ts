import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-manage-marking-data',
  templateUrl: './manage-marking-data.component.html',
  styleUrls: ['./manage-marking-data.component.scss']
})
export class ManageMarkingDataComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private storage: AngularFireStorage, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  selectedZone: any;
  divLoader = "#divLoader";
  allMarkerList: any[];
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
  }

  setMarkerData() {
    $(this.divLoader).show();
    this.db.object("EntityMarkingData/WardLineMapping").remove();
    this.allMarkerList = [];
    let index = 1;
    let dbPath = "EntityMarkingData/MarkedHouses";
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(markedHousesData => {
      markerInstance.unsubscribe();
      if (markedHousesData != null) {
        let zoneList = Object.keys(markedHousesData);
        if (zoneList.length > 0) {
          for (let i = 0; i < zoneList.length; i++) {
            let zoneNo = zoneList[i];
            let zoneData = markedHousesData[zoneNo];
            let lineList = Object.keys(zoneData);
            if (lineList.length > 0) {
              for (let j = 0; j < lineList.length; j++) {
                let lineNo = lineList[j];
                let lineData = zoneData[lineNo];
                let markerList = Object.keys(lineData);
                if (markerList.length > 0) {
                  for (let k = 0; k < markerList.length; k++) {
                    if (!isNaN(parseInt(markerList[k]))) {
                      let markerNo = parseInt(markerList[k]);
                      let newMarkerNo = "M" + index;
                      this.allMarkerList.push({ zoneNo: zoneNo, lineNo: lineNo, markerNo: markerNo, newMarkerNo: newMarkerNo });
                      index++;
                    }
                  }
                }
              }
            }
          }
        }
          this.addFlatMarkerData(0);
      }
      else {
        $(this.divLoader).hide();
      }
    });
  }

  addFlatMarkerData(index: any) {
    if (index == this.allMarkerList.length) {
      this.db.object("EntityMarkingData/Markers/").update({ lastKey: index });
      this.commonService.setAlertMessage("success", "Markers added successfully !!!");
      $(this.divLoader).hide();
      return;
    }
    let zoneNo = this.allMarkerList[index]["zoneNo"];
    let lineNo = this.allMarkerList[index]["lineNo"];
    let markerNo = this.allMarkerList[index]["markerNo"];
    let newMarkerNo = this.allMarkerList[index]["newMarkerNo"]
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let image = data["image"];
          let newImage = newMarkerNo + ".jpg";
          data["image"] = newImage;
          data["line"] = lineNo;
          data["zone"] = zoneNo;
          const pathOld = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneNo + "/" + lineNo + "/" + image;
          const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
          ref.getDownloadURL()
            .then((url) => {
              var xhr = new XMLHttpRequest();
              xhr.responseType = 'blob';
              xhr.onload = (event) => {
                var blob = xhr.response;
                const pathNew = this.commonService.getFireStoreCity() + "/MarkingImages/" + newImage;
                const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
                ref1.put(blob).then((promise) => {
                  let dbPath = "EntityMarkingData/Markers/" + newMarkerNo;
                  this.db.object(dbPath).update(data);
                  this.setWardLineMapping(zoneNo, lineNo, newMarkerNo);
                  index++;
                  this.addFlatMarkerData(index);

                }).catch((error) => {
                  let dbPath = "EntityMarkingData/Markers/" + newMarkerNo;
                  this.db.object(dbPath).update(data);
                  this.setWardLineMapping(zoneNo, lineNo, newMarkerNo);
                  index++;
                  this.addFlatMarkerData(index);
                });
              };
              xhr.open('GET', url);
              xhr.send();
            })
            .catch((error) => {
              let dbPath = "EntityMarkingData/Markers/" + newMarkerNo;
              this.db.object(dbPath).update(data);
              this.setWardLineMapping(zoneNo, lineNo, newMarkerNo);
              index++;
              this.addFlatMarkerData(index);
            });
        }
        else {
          index++;
          this.addFlatMarkerData(index);
        }
      });
  }

  setWardLineMapping(zoneNo: any, lineNo: any, markerNo: any) {
    let dbPath = "EntityMarkingData/WardLineMapping/" + zoneNo + "/" + lineNo;
    this.db.list(dbPath).push(markerNo);
  }

  setMarkerMapping() {
    $(this.divLoader).hide();
    this.db.object("EntityMarkingData/WardLineMapping").remove();
    let dbPath = "EntityMarkingData/Markers";
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let markerNo = keyArray[i];
            if (markerNo != "lastKey") {
              let line = data[markerNo]["line"];
              let zone = data[markerNo]["zone"];
              dbPath = "EntityMarkingData/WardLineMapping/" + zone + "/" + line;
              this.db.list(dbPath).push(markerNo);
            }
          }
        }
        this.commonService.setAlertMessage("success", "Markers mapping done successfully !!!");
        $(this.divLoader).hide();
      }
    )
  }
}

