import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-card-marker-mapping',
  templateUrl: './card-marker-mapping.component.html',
  styleUrls: ['./card-marker-mapping.component.scss']
})
export class CardMarkerMappingComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  cityName: any;
  db: any;
  todayDate: any;
  public selectedZone: any;
  zoneList: any[];
  markerList: any[];
  ddlZone = "#ddlZone";
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
                  latLng=latLng.toString().replace('(','').replace(')','');
                  this.setMarkerLocation(zoneNo,cardNo,latLng,totalLines);
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
                  console.log(i);
                  console.log(cardNo);
                  console.log(markerNo);
                  console.log(data[markerNo]["latLng"]);
                }
              }
            }
          }
        }
      });
    }
  }
}
