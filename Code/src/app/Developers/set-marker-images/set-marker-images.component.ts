import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-set-marker-images',
  templateUrl: './set-marker-images.component.html',
  styleUrls: ['./set-marker-images.component.scss']
})
export class SetMarkerImagesComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private storage: AngularFireStorage) { }

  cityName: any;
  db: any;
  public selectedZone: any;
  zoneList: any[];
  markerList: any[];
  ddlZone = "#ddlZone";
  divLoaderLineMove = "#divLoaderLineMove";

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

  setMarkerID() {
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Ward");
      return;
    }
    $(this.divLoaderLineMove).show();
    this.selectedZone = $(this.ddlZone).val();
    let lastMarkerID = 0;
    let dbPath = "EntityMarkingData/lastMarkerId";
    let lastMarkerIdInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastId => {
        lastMarkerIdInstance.unsubscribe();
        if (lastId != null) {
          lastMarkerID = Number(lastId);
        }
        dbPath = "EntityMarkingData/" + this.selectedZone;
        let markerDataInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            markerDataInstance.unsubscribe();
            if (data != null) {
              this.markerList = [];
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let i = 0; i < keyArray.length; i++) {
                  let lineNo = keyArray[i];
                  let markerData = data[lineNo];
                  let markerKeyArray = Object.keys(markerData);
                  for (let j = 0; j < markerKeyArray.length; j++) {
                    let markerNo = markerKeyArray[j];
                    if (parseInt(markerNo)) {
                      if (markerData[markerNo]["markerId"] == null) {
                        lastMarkerID++;
                        dbPath = "EntityMarkingData/" + this.selectedZone + "/" + lineNo + "/" + markerNo;
                        this.db.object(dbPath).update({ markerId: lastMarkerID });
                        this.markerList.push({ ward: this.selectedZone, lineNo: lineNo, markerNo: markerNo, markerId: lastMarkerID, image: markerData[markerNo]["image"] });
                      }
                    }
                  }
                }
              }
              dbPath = "EntityMarkingData/lastMarkerId";
              this.db.object(dbPath).set(lastMarkerID);
              this.setImages(0);
            }
            else {
              $(this.divLoaderLineMove).hide();
              console.log("No Markers");
            }
          }
        );
      }
    );
  }

  setImages(index: any) {
    if (index == this.markerList.length) {
      $(this.divLoaderLineMove).hide();
      this.commonService.setAlertMessage("success", "Marker ID Updated Successfully !!!");
    } else {
      let lineNo = this.markerList[index]["lineNo"];
      let oldImageName = this.markerList[index]["image"];
      let markerId = this.markerList[index]["markerId"];
      let newImageName = markerId + ".jpg";
      const pathOld = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + this.selectedZone + "/" + lineNo + "/" + oldImageName;
      const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
      ref.getDownloadURL()
        .then((url) => {
          var xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.onload = (event) => {
            var blob = xhr.response;
            const pathNew = this.commonService.getFireStoreCity() + "/MarkingSurveyImagesWithMarkerID/" + newImageName;
            const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
            ref1.put(blob).then((promise) => {
              // ref.delete();
              index++;
              this.setImages(index);
              console.log(newImageName);

            }).catch((error) => {
              index++;
              this.setImages(index);
            });
          };
          xhr.open('GET', url);
          xhr.send();
        })
        .catch((error) => {
          index++;
          this.setImages(index);
        });
    }
  }
}
