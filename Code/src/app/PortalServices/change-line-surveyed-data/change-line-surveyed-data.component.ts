import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-change-line-surveyed-data',
  templateUrl: './change-line-surveyed-data.component.html',
  styleUrls: ['./change-line-surveyed-data.component.scss']
})
export class ChangeLineSurveyedDataComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
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
    if (this.cityName == "test") {
      this.zoneList = [];
      this.zoneList.push({ zoneNo: 0, zoneName: "--Select--" });
      this.zoneList.push({ zoneNo: 1, zoneName: "Zone 1" });
      this.zoneList.push({ zoneNo: 2, zoneName: "Zone 2" });
      this.zoneList.push({ zoneNo: 3, zoneName: "Zone 3" });
      this.zoneList.push({ zoneNo: 4, zoneName: "Zone 4" });
    }
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
    let dbPath = "Houses/" + zoneFrom + "/" + lineFrom;
    let houseFromInstance = this.db.list(dbPath).valueChanges().subscribe(
      fromDataList => {
        houseFromInstance.unsubscribe();
        if (fromDataList.length > 0) {
          for (let i = 0; i < fromDataList.length; i++) {
            let cardNo = fromDataList[i]["cardNo"];
            fromDataList[i]["ward"] = zoneTo;
            fromDataList[i]["line"] = lineTo;
            const data = fromDataList[i];
            dbPath = "Houses/" + zoneTo + "/" + lineTo + "/" + cardNo;
            this.db.object(dbPath).update(data);
            dbPath = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
            const data1 = null;
            this.db.object(dbPath).remove();
            dbPath = "CardWardMapping/" + cardNo;
            this.db.object(dbPath).update({ line: lineTo, ward: zoneTo });
          }
          this.commonService.setAlertMessage("success", "Line data moved successfully");
        }
        else {
          this.commonService.setAlertMessage("error", "No house find in selected ward and lines !!!");
        }
      }
    );
  }

  updateCardLineData() {
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
          let keyArray = Object.keys(houseData);
          if (keyArray.length > 0) {
            let count=0;
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
            console.log("total houses : "+count);
          }
        }
        this.commonService.setAlertMessage("success", "Card line mapping updated !!!");
      }
    );
  }

}
