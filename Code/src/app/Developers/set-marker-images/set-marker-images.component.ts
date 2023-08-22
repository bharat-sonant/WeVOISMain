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
    this.selectedZone = $(this.ddlZone).val();
    let lastMarkerID = 0;
    let dbPath = "EntityMarkingData/lastMarkerId";
    let lastMarkerIdInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastId => {
        lastMarkerIdInstance.unsubscribe();
        if (lastId != null) {
          lastMarkerID = Number(lastId);
        }
        console.log(lastMarkerID);
        dbPath = "EntityMarkingData/" + this.selectedZone;
        let markerDataInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            markerDataInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {

                for (let i = 0; i < keyArray.length; i++) {
                  let lineNo = keyArray[i];
                  let markerData = data[lineNo];
                  let markerKeyArray = Object.keys(markerData);
                  for (let j = 0; j < markerKeyArray.length; j++) {
                    let markerNo = markerKeyArray[j];
                    if (parseInt(markerNo)) {
                      console.log(lineNo + " => " + markerNo);
                      if (markerData[markerNo]["markerId"] == null) {
                        lastMarkerID++;
                        dbPath = "EntityMarkingData/" + this.selectedZone + "/" + lineNo + "/" + markerNo;
                        this.db.object(dbPath).update({ markerId: lastMarkerID });
                      }
                    }
                  }
                }
              }
              dbPath = "EntityMarkingData/lastMarkerId";
              this.db.object(dbPath).set(lastMarkerID);
            }
            else {
              console.log("No Markers");
            }
          }
        );
      }
    );
  }
}
