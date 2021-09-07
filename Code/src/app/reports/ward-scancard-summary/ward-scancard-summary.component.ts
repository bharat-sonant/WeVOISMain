import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-scancard-summary',
  templateUrl: './ward-scancard-summary.component.html',
  styleUrls: ['./ward-scancard-summary.component.scss']
})
export class WardScancardSummaryComponent implements OnInit {

  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private actRoute: ActivatedRoute, private commonService: CommonService) { }

  wardList: any[];
  selectedCircle: any;
  selectedDate: any;
  toDayDate: any;
  wardDataList: any[];
  wardScaanedList: any;
  isFirst = true;
  db: any;

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.showLoder();
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.selectedDate);
    this.getWards();
  }


  showLoder() {
    $("#divLoader").show();
    setTimeout(() => {
      $("#divLoader").hide();
    }, 4000);
  }


  getWards() {
    this.wardList = [];
    let dbPath = "Defaults/CircleWiseWards";
    let circleWiseWard = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        if (data != null) {
          let circledata: any;
          for (let i = 0; i < data.length; i++) {
            circledata = data[i];
            if (i == 0) {
              for (let j = 1; j < circledata.length; j++) {
                this.wardList.push({ circle: 'Circle1', wardNo: circledata[j] });
              }
            }
            if (i == 1) {
              for (let j = 1; j < circledata.length; j++) {
                this.wardList.push({ circle: 'Circle2', wardNo: circledata[j] });
              }
            }
            if (i == 2) {
              for (let j = 1; j < circledata.length; j++) {
                this.wardList.push({ circle: 'Circle3', wardNo: circledata[j] });
              }
            }
          }
        }
        this.selectedCircle = "Circle1";
        this.onSubmit();
        circleWiseWard.unsubscribe();
      });
  }


  changeCircleSelection(filterVal: any) {
    this.showLoder();
    this.selectedCircle = filterVal;
    this.isFirst = true;
    this.onSubmit();
  }


  onSubmit() {
    this.wardDataList = [];
    let circleWardList = this.wardList.filter((item) => item.circle == this.selectedCircle);
    if (circleWardList.length > 0) {
      console.log(circleWardList);
      for (let i = 0; i < circleWardList.length; i++) {
        if (circleWardList[i]["wardNo"] != undefined) {
          this.wardDataList.push({
            wardNo: circleWardList[i]["wardNo"],
            scanned: 0,
            notScanned: 0,
            helper: ""
          });
        }
      }
      this.getWardDetail();
    }
  }

  getWardDetail() {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    for (let i = 0; i < this.wardList.length; i++) {
      let wardNo = this.wardList[i]["wardNo"];
      let dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/helperName";
      let helperInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          helperInstance.unsubscribe();
          let helper = "";
          let scanned = 0;
          let notScanned = 0;
          if (data != null) {
            helper = data.toString();
          }

          dbPath = "HousesCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/ImagesData/totalCount";
          let notScannedInstance = this.db.object(dbPath).valueChanges().subscribe(
            notScannedData => {
              notScannedInstance.unsubscribe();
              if (notScannedData != null) {
                notScanned = Number(notScannedData);
              }
              dbPath = "HousesCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
              let scannedInstance = this.db.object(dbPath).valueChanges().subscribe(
                scannedData => {
                  scannedInstance.unsubscribe();
                  if (scannedData != null) {
                    let keyArray = Object.keys(scannedData);
                    for (let j = 0; j < keyArray.length; j++) {
                      let index = keyArray[j];
                      if (index != "recentScanned" && index != "totalScanned" && index != "ImagesData") {
                        if (scannedData[index]["scanBy"] != "-1") {
                          scanned = scanned + 1;
                        }
                      }
                    }
                  }
                  let detail = this.wardDataList.find(item => item.wardNo == wardNo);
                  if (detail != undefined) {
                    detail.helper = helper;
                    detail.scanned = scanned;
                    detail.notScanned = notScanned;
                  }

                }
              );
            }
          );

        }
      );
    }

  }

  setDate(filterVal: any, type: string) {
    this.showLoder();
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate(
        $("#txtDate").val(),
        1
      );
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.toDayDate)) {
      this.selectedDate = this.toDayDate;
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    for (let i = 0; i < this.wardDataList.length; i++) {
      this.wardDataList[i]["helper"] = "";
      this.wardDataList[i]["scanned"] = 0;
      this.wardDataList[i]["notScanned"] = 0;
    }
    this.getWardDetail();
  }

}
