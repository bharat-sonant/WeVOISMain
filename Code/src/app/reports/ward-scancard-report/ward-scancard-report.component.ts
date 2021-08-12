import { AngularFireObject } from "angularfire2/database";
/// <reference types="@types/googlemaps" />
import * as jsPDF from "jspdf";
import "jspdf-autotable";

import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
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

  header = [["Card No.", "Name", "RFID", "Time", "Scaned By"]];
  headerWard = [["Ward No.", "Routing Length(km)", "Covered Length(km)"]];

  tableData = [[]];

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.selectedDate);
    this.getWards();
  }

  SavePDF(type: any) {
    if (type == "detail") {
      this.generateDetailPdf();
    }
    else
    {
      this.generatePdf();
    }
  }

  generateDetailPdf() {
    this.tableData = [];
    if (this.wardScaanedList.length > 0) {
      for (let i = 0; i < this.wardScaanedList.length; i++) {
        let tableArray = [];
        tableArray.push(this.wardScaanedList[i]["cardNo"]);
        tableArray.push(this.wardScaanedList[i]["personName"]);
        tableArray.push(this.wardScaanedList[i]["rfId"]);
        tableArray.push(this.wardScaanedList[i]["time"]);
        tableArray.push(this.wardScaanedList[i]["name"]);
        this.tableData.push(tableArray);
      }
      var pdf = new jsPDF();
      var pageWidth =
        pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();

      let title =
        "Ward " + this.wardScaanedList[0]["wardNo"] + " Card Scan Report";
      pdf.text(title, pageWidth / 2, 8, { align: "center" });
      pdf.setFont("helvetica");
      pdf.setFontType("italic");
      pdf.setFontSize(5);
      pdf.setTextColor(99);

      (pdf as any).autoTable({
        head: this.header,
        body: this.tableData,
        theme: "grid",
      });

      // Open PDF document in browser's new tab
      pdf.output("dataurlnewwindow");

      // Download PDF doc
      let fileName = this.wardScaanedList[0]["wardNo"] + ".pdf";
      pdf.save(fileName);
    }
  }

  generatePdf() {
    this.tableData = [];
    if (this.wardDataList.length > 0) {
      for (let i = 0; i < this.wardDataList.length; i++) {
        let tableArray = [];
        tableArray.push(this.wardDataList[i]["wardNo"]);
        tableArray.push(this.wardDataList[i]["wardLength"]);
        tableArray.push(this.wardDataList[i]["wardCoveredLength"]);
        this.tableData.push(tableArray);
      }
      var pdf = new jsPDF();
      var pageWidth =
        pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();

      let title = "Card Scan Report";
      pdf.text(title, pageWidth / 2, 8, { align: "center" });
      pdf.setFont("helvetica");
      pdf.setFontType("italic");
      pdf.setFontSize(5);
      pdf.setTextColor(99);

      (pdf as any).autoTable({
        head: this.headerWard,
        body: this.tableData,
        theme: "grid",
      });

      // Open PDF document in browser's new tab
      pdf.output("dataurlnewwindow");

      // Download PDF doc
      let fileName = "CardScanReport.pdf";
      pdf.save(fileName);
    }
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
        this.selectedCircle = "Circle2";
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
          wardLength: 0,
          wardCoveredLength: 0,
          workPer: 0,
        });
      }
      this.getWardLength();
      //this.getHouseSummary();
    }
  }

  getWardLength() {
    if (this.wardDataList.length > 0) {
      for (let i = 0; i < this.wardDataList.length; i++) {
        let wardLenghtPath =
          "WardRouteLength/" + this.wardDataList[i]["wardNo"];
        let wardLengthDetails = this.db
          .object(wardLenghtPath)
          .valueChanges()
          .subscribe((wardLengthData) => {
            wardLengthDetails.unsubscribe();
            if (wardLengthData != null) {
              let wardLength = (
                parseFloat(wardLengthData.toString()) / 1000
              ).toFixed(2);
              this.wardDataList[i]["wardLength"] = Number(wardLength);
              this.getCoveredLength(i, this.wardDataList[i]["wardNo"]);
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

  getCoveredLength(index, wardNo) {
    let monthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    let year = this.selectedDate.split("-")[0];
    let dbPath =
      "WasteCollectionInfo/" +
      wardNo +
      "/" +
      year +
      "/" +
      monthName +
      "/" +
      this.selectedDate +
      "/Summary/wardCoveredDistance";
    let instance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        instance.unsubscribe();
        if (data != null) {
          let wardCoveredLength = (parseFloat(data.toString()) / 1000).toFixed(
            2
          );
          this.wardDataList[index]["wardCoveredLength"] =
            Number(wardCoveredLength);
          let wardLength = this.wardDataList[index]["wardLength"];
          let workPercentage = (Number(wardCoveredLength) / wardLength) * 100;
          this.wardDataList[index]["workPer"] = workPercentage.toFixed(0) + "%";
        }
      });
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
    this.getWardLength();
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
                  let cardNo = keyArray[i];

                  if (
                    cardNo != "ImagesData" &&
                    cardNo != "recentScanned" &&
                    cardNo != "totalScanned"
                  ) {
                    let scanTime =
                      data[cardNo]["scanTime"].split(":")[0] +
                      ":" +
                      data[cardNo]["scanTime"].split(":")[1];
                    let date =
                      Number(
                        new Date(this.selectedDate + " " + scanTime).getTime()
                      ) / 10000;
                    let dbPath = "CardWardMapping/" + cardNo;
                    let mapInstance = this.db
                      .object(dbPath)
                      .valueChanges()
                      .subscribe((mapData) => {
                        mapInstance.unsubscribe();
                        if (mapData != null) {
                          let line = mapData["line"];
                          let ward = mapData["ward"];
                          dbPath = "Houses/" + ward + "/" + line + "/" + cardNo;
                          let houseInstance = this.db
                            .object(dbPath)
                            .valueChanges()
                            .subscribe((houseData) => {
                              houseInstance.unsubscribe();
                              let rfId = "";
                              let personName = "";
                              if (houseData != null) {
                                rfId = houseData["rfid"];
                                personName = houseData["name"];
                              }
                              this.wardScaanedList.push({
                                wardNo: wardNo,
                                cardNo: cardNo,
                                time: scanTime,
                                name: name,
                                rfId: rfId,
                                personName: personName,
                                sno: Number(date),
                              });
                            });
                        } else {
                          this.wardScaanedList.push({
                            wardNo: wardNo,
                            cardNo: cardNo,
                            time: scanTime,
                            name: name,
                            rfId: "",
                            personName: "",
                            sno: Number(date),
                          });
                        }
                      });
                  }
                }
                setTimeout(() => {
                  this.wardScaanedList = this.wardScaanedList.sort((a, b) =>
                    Number(b.sno) < Number(a.sno) ? 1 : -1
                  );
                }, 2000);
              }
            });
        }
      });
  }
}
