import { AngularFireObject } from "angularfire2/database";
/// <reference types="@types/googlemaps" />

import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-ward-scancard-report",
  templateUrl: "./ward-scancard-report.component.html",
  styleUrls: ["./ward-scancard-report.component.scss"],
})
export class WardScancardReportComponent implements OnInit {
  constructor(
    public fs: FirebaseService,
    public af: AngularFireModule,
    public httpService: HttpClient,
    private actRoute: ActivatedRoute,
    private commonService: CommonService
  ) {}

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
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.selectedDate);
    this.getWards();
  }

  getWards() {
    this.wardList = [];
    let dbPath = "Defaults/AllWard";
    let circleWiseWard = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        if (data != null) {
          var keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            let circleDataList = data[index];
            if (circleDataList.length > 0) {
              for (let j = 1; j < circleDataList.length; j++) {
                this.wardList.push({
                  circle: index,
                  wardNo: circleDataList[j]["wardNo"],
                  startDate: circleDataList[j]["startDate"],
                  endDate: circleDataList[j]["endDate"],
                  displayIndex: circleDataList[j]["displayIndex"],
                });
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
    this.selectedCircle = filterVal;
    this.isFirst = true;
    this.onSubmit();
  }

  onSubmit() {
    this.wardDataList = [];
    let circleWardList = this.wardList.filter(
      (item) => item.circle == this.selectedCircle
    );
    if (circleWardList.length > 0) {
      for (let i = 0; i < circleWardList.length; i++) {
        this.wardDataList.push({
          wardNo: circleWardList[i]["wardNo"],
          houses: 0,
          scanned: 0,
        });
      }
      this.getHouseSummary();
    }
  }

  getHouseSummary() {
    if (this.wardDataList.length > 0) {
      for (let i = 0; i < this.wardDataList.length; i++) {
        let dbPath = "Houses/" + this.wardDataList[i]["wardNo"] + "/totalHouse";
        let totalHouseInstance = this.db
          .object(dbPath)
          .valueChanges()
          .subscribe((data) => {
            totalHouseInstance.unsubscribe();
            if (data != null) {
              this.wardDataList[i]["houses"] = Number(data);
              this.getSacnedHouses(i, this.wardDataList[i]["wardNo"]);
            }
          });
        if (i == 0) {
          this.getScanDetail(this.wardDataList[i]["wardNo"], i);
          setTimeout(() => {
            $("#tr0").addClass("active");
          }, 600);
        }
      }
    }
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.wardDataList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        $("#tr" + i).removeClass(className);
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }

  getSacnedHouses(index: any, wardNo: any) {
    let monthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    let year = this.selectedDate.split("-")[0];
    let dbPath =
      "HousesCollectionInfo/" +
      wardNo +
      "/" +
      year +
      "/" +
      monthName +
      "/" +
      this.selectedDate +
      "/totalScanned";
    let totalHouseInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        totalHouseInstance.unsubscribe();
        if (data != null) {
          this.wardDataList[index]["scanned"] = Number(data);
        } else {
          this.wardDataList[index]["scanned"] = 0;
        }
      });
  }

  setDate(filterVal: any, type: string) {
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
      this.commonService.setAlertMessage(
        "error",
        "Please select current or previos date!!!"
      );
    }
    $("#txtDate").val(this.selectedDate);
    this.getHouseSummary();
  }

  getScanDetail(wardNo: any, index: any) {
    if (this.isFirst == false) {
      this.setActiveClass(index);
    } else {
      this.isFirst = false;
    }
    this.wardScaanedList = [];
    let monthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    let year = this.selectedDate.split("-")[0];

    let dbPath =
      "HousesCollectionInfo/" +
      wardNo +
      "/" +
      year +
      "/" +
      monthName +
      "/" +
      this.selectedDate;
    let scannedHouseInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        
        scannedHouseInstance.unsubscribe();
        if (data != null) {
          let employeePath =
            "WasteCollectionInfo/" +
            wardNo +
            "/" +
            year +
            "/" +
            monthName +
            "/" +
            this.selectedDate +
            "/WorkerDetails/helperName";
          let employeeInstance = this.db
            .object(employeePath)
            .valueChanges()
            .subscribe((empData) => {
              employeeInstance.unsubscribe();
              if (empData != null) {
                let name = empData;
                let keyArray = Object.keys(data);
                for (let i = 0; i < keyArray.length; i++) {
                  let lineNo = keyArray[i];
                  let obj = data[lineNo];
                  let keyArrayCard = Object.keys(obj);
                  for (let j = 0; j < keyArrayCard.length; j++) {
                    let cardNo = keyArrayCard[j];
                    let scanTime = obj[cardNo]["scanTime"];
                    let dbPath="Houses/"+wardNo+"/"+lineNo+"/"+cardNo+"";
                    let cardInstance=this.db.object(dbPath).valueChanges().subscribe(
                      cardData=>{
                        cardInstance.unsubscribe();
                        let rfId="";
                        let personName="";
                        if(cardData!=null){
                          rfId=cardData["rfid"];
                          personName=cardData["name"];
                        }
                        this.wardScaanedList.push({
                          lineNo: lineNo,
                          cardNo: cardNo,
                          time: scanTime,
                          name: name,
                          rfId:rfId,
                          personName:personName
                        });
                      }
                    );
                   
                  }
                }
              }
            });
        }
      });
  }
}
