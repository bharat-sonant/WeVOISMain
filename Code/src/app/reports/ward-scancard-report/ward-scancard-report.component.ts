
/// <reference types="@types/googlemaps" />
import * as jsPDF from "jspdf";
import "jspdf-autotable";

import { Component, ViewChild, ElementRef, OnInit } from "@angular/core";
import { AngularFireDatabase, AngularFireList, AngularFireObject } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-ward-scancard-report",
  templateUrl: "./ward-scancard-report.component.html",
  styleUrls: ["./ward-scancard-report.component.scss"],
})
export class WardScancardReportComponent implements OnInit {
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, public af: AngularFireModule, public httpService: HttpClient, private actRoute: ActivatedRoute, private commonService: CommonService) { }

  wardList: any[];
  selectedCircle: any;
  selectedDate: any;
  toDayDate: any;
  wardDataList: any[] = [];
  wardScaanedList: any[] = [];
  wardScanedListFiltered: any[] = [];
  totalScanedCards: any;
  isFirst = true;
  db: any;
  public cityName: any;
  public isEcogram: any;
  serviceName = "ward-scan-card-report";
  userType: any;
  header = [["Card No.", "Name", "RFID", "Time", "Scaned By"]];
  headerEcogram = [["Card No.", "Waste Category", "Time", "Scaned By"]];
  headerWard = [["Ward No.", "Ward Length(km)", "Covered Length(km)"]];

  tableData = [[]];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    if (this.cityName == "test" || this.cityName == "ecogram") {
      this.isEcogram = "1";
      $("#divEcogram").show();
      this.totalScanedCards = 0;
    }
    else {
      this.isEcogram = "0";
      $("#divEcogram").hide();
    }
    this.userType = localStorage.getItem("userType");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("General-Reports", "Ward-Scan-Card-Report", localStorage.getItem("userID"));
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

  SavePDF(type: any) {
    if (type == "detail") {
      this.generateDetailPdf();
    } else {
      this.generatePdf();
    }
  }

  generateDetailPdf() {
    this.tableData = [];
    if (this.wardScanedListFiltered.length > 0) {
      for (let i = 0; i < this.wardScanedListFiltered.length; i++) {
        let tableArray = [];
        tableArray.push(this.wardScanedListFiltered[i]["cardNo"]);
        if (this.isEcogram == "0") {
          tableArray.push(this.wardScanedListFiltered[i]["personName"]);
          tableArray.push(this.wardScanedListFiltered[i]["rfId"]);
        }
        else {
          tableArray.push(this.wardScanedListFiltered[i]["wasteCategory"]);
        }
        tableArray.push(this.wardScanedListFiltered[i]["time"]);
        tableArray.push(this.wardScanedListFiltered[i]["name"]);
        this.tableData.push(tableArray);
      }
      var pdf = new jsPDF();
      var pageWidth =
        pdf.internal.pageSize.width || pdf.internal.pageSize.getWidth();

      let monthName = this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split("-")[1]));
      let title = " Card Scan Report - Ward " + this.wardScanedListFiltered[0]["wardNo"] + " [" + this.selectedDate.split("-")[2] + " " + monthName + " " + this.selectedDate.split("-")[0] + "]";

      pdf.text(title, pageWidth / 2, 8, { align: "center" });
      pdf.setFont("helvetica");
      pdf.setFontType("italic");
      pdf.setFontSize(5);
      pdf.setTextColor(99);

      (pdf as any).autoTable({
        head: this.isEcogram == "0" ? this.header : this.headerEcogram,
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
      let monthName = this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split("-")[1])
      );
      let title = " Card Scan Report  [" + this.selectedDate.split("-")[2] + " " + monthName + " " + this.selectedDate.split("-")[0] + "]";

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
    this.commonService.getCityWiseWard().then((zoneList: any) => {
      this.wardList = JSON.parse(zoneList);
      this.selectedCircle = 'Circle1';
      this.onSubmit();
    });
  }

  changeCircleSelection(filterVal: any) {
    this.selectedCircle = filterVal;
    this.isFirst = true;
    this.clearList();
    this.clearScanCardDetail();
    this.onSubmit();
  }

  onSubmit() {
    this.wardDataList = [];
    let circleWardList = this.wardList.filter((item) => item.circle == this.selectedCircle);
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

  clearList() {
    for (let i = 0; i < this.wardDataList.length; i++) {
      this.wardDataList[i]["houses"] = 0;
      this.wardDataList[i]["scanned"] = 0;
      this.wardDataList[i]["wardLength"] = 0;
      this.wardDataList[i]["wardCoveredLength"] = 0;
      this.wardDataList[i]["workPer"] = 0;
    }
  }

  getWardLength() {
    if (this.wardDataList.length > 0) {

      for (let i = 0; i < this.wardDataList.length; i++) {
        this.commonService.getWardLine(this.wardDataList[i]["wardNo"], this.selectedDate).then((linesData: any) => {
          let wardLinesDataObj = JSON.parse(linesData);
          let wardLength = (parseFloat(wardLinesDataObj["totalWardLength"]) / 1000).toFixed(2);
          this.wardDataList[i]["wardLength"] = Number(wardLength);
          this.getCoveredLength(i, this.wardDataList[i]["wardNo"]);
        });
      }
    }
  }

  getCoveredLength(index: any, wardNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getCoveredLength");
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/LineStatus";
    let instance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      instance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getCoveredLength", data);
        let length = 0;
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          if (data[keyArray[i]]["Status"] == "LineCompleted") {
            if (data[keyArray[i]]["line-distance"] != null) {
              length += Number(data[keyArray[i]]["line-distance"]);
            }
          }
        }
        let wardCoveredLength = (parseFloat(length.toString()) / 1000).toFixed(2);
        this.wardDataList[index]["wardCoveredLength"] =
          Number(wardCoveredLength);
        let wardLength = this.wardDataList[index]["wardLength"];
        let workPercentage = (Number(wardCoveredLength) / wardLength) * 100;
        this.wardDataList[index]["workPer"] = workPercentage.toFixed(0) + "%";
      }
    });
  }

  getHouseSummary() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getHouseSummary");
    if (this.wardDataList.length > 0) {
      for (let i = 0; i < this.wardDataList.length; i++) {
        let dbPath = "Houses/" + this.wardDataList[i]["wardNo"] + "/totalHouse";
        let totalHouseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
          totalHouseInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getHouseSummary", data);
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getSacnedHouses");
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "HousesCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/totalScanned";
    let totalHouseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      totalHouseInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getSacnedHouses", data);
        this.wardDataList[index]["scanned"] = Number(data);
      } else {
        this.wardDataList[index]["scanned"] = 0;
      }
    });
  }

  setDate(filterVal: any, type: string) {
    this.clearList();
    this.clearScanCardDetail();
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.showLoder();
        this.getWardLength();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  getFilterScanData(value: any) {
    if (value == "0") {
      this.wardScanedListFiltered = this.wardScaanedList;
    }
    else {
      this.wardScanedListFiltered = this.wardScaanedList.filter(item => item.wasteCategory == value);
    }
    this.totalScanedCards = this.wardScanedListFiltered.length;

  }

  clearScanCardDetail() {
    this.wardScaanedList = [];
    this.wardScanedListFiltered = [];
    this.totalScanedCards = 0;
  }

  getScanDetail(wardNo: any, index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getScanDetail");
    this.showLoder();
    this.clearScanCardDetail();
    if (this.isFirst == false) {
      this.setActiveClass(index);
    } else {
      this.isFirst = false;
    }
    let monthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    let year = this.selectedDate.split("-")[0];

    let dbPath = "HousesCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate;

    let scannedHouseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      scannedHouseInstance.unsubscribe();
      if (data != null) {

        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScanDetail", data);
        let employeePath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/helperName";
        if (this.cityName == "ecogram") {
          employeePath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/driverName";
        }

        let employeeInstance = this.db.object(employeePath).valueChanges().subscribe((empData) => {
          employeeInstance.unsubscribe();
          if (empData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScanDetail", empData);
            let name = empData.split(',')[empData.split(',').length-1];

            let keyArray = Object.keys(data);
            for (let i = 0; i < keyArray.length; i++) {
              let cardNo = keyArray[i];
              let cardNumber = "";
              if (cardNo != "ImagesData" && cardNo != "recentScanned" && cardNo != "totalScanned") {
                let cardNoList = cardNo.split("~");
                if (cardNoList.length > 1) {
                  for (let p = 0; p < cardNoList.length; p++) {
                    if (p == 0) {
                      cardNumber = cardNoList[p];
                    }
                    else {
                      cardNumber = cardNumber + "." + cardNoList[p];
                    }
                  }
                }
                else {
                  cardNumber = cardNo;
                }
                let scanTime = data[cardNo]["scanTime"].split(":")[0] + ":" + data[cardNo]["scanTime"].split(":")[1];
                let date = Number(new Date(this.selectedDate + " " + scanTime).getTime()) / 10000;
                if (this.userType == "External User") {
                  if (this.cityName == "test" || this.cityName == "ecogram") {
                    let wasteCategory = "";
                    if (data[cardNo]["wasteCategory"] != undefined) {
                      wasteCategory = data[cardNo]["wasteCategory"];
                    }


                    this.wardScaanedList.push({
                      wardNo: wardNo,
                      cardNo: cardNumber,
                      time: scanTime,
                      name: name,
                      rfId: "",
                      personName: "",
                      sno: Number(date),
                      wasteCategory: wasteCategory
                    });
                    this.wardScaanedList = this.wardScaanedList.sort((a, b) =>
                      Number(b.sno) < Number(a.sno) ? 1 : -1
                    );
                    this.wardScanedListFiltered = this.wardScaanedList;
                    this.totalScanedCards = this.wardScanedListFiltered.length;
                  }
                  else {

                    let dbPath = "CardWardMapping/" + cardNo;

                    let mapInstance = this.db.object(dbPath).valueChanges().subscribe((mapData) => {
                      mapInstance.unsubscribe();
                      if (mapData != null) {
                        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScanDetail", mapData);
                        let line = mapData["line"];
                        let ward = mapData["ward"];

                        dbPath = "Houses/" + ward + "/" + line + "/" + cardNo;

                        let houseInstance = this.db.object(dbPath).valueChanges().subscribe((houseData) => {
                          houseInstance.unsubscribe();
                          let rfId = "";
                          let personName = "";
                          if (houseData != null) {
                            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScanDetail", houseData);
                            rfId = houseData["rfid"];
                            personName = houseData["name"];
                            this.wardScaanedList.push({
                              wardNo: wardNo,
                              cardNo: cardNumber,
                              time: scanTime,
                              name: name,
                              rfId: rfId,
                              personName: personName,
                              sno: Number(date),
                              wasteCategory: ""
                            });
                            this.wardScaanedList = this.wardScaanedList.sort((a, b) =>
                              Number(b.sno) < Number(a.sno) ? 1 : -1
                            );
                            this.wardScanedListFiltered = this.wardScaanedList;
                            this.totalScanedCards = this.wardScanedListFiltered.length;
                          }

                        });
                      }
                    });

                  }
                }
                else {

                  if (data[cardNo]["scanBy"] != "-1") {
                    if (this.cityName == "test" || this.cityName == "ecogram") {
                      let wasteCategory = "";
                      if (data[cardNo]["wasteCategory"] != undefined) {
                        wasteCategory = data[cardNo]["wasteCategory"];
                      }
                      this.wardScaanedList.push({
                        wardNo: wardNo,
                        cardNo: cardNumber,
                        time: scanTime,
                        name: name,
                        rfId: "",
                        personName: "",
                        sno: Number(date),
                        wasteCategory: wasteCategory
                      });
                      this.wardScaanedList = this.wardScaanedList.sort((a, b) =>
                        Number(b.sno) < Number(a.sno) ? 1 : -1
                      );
                      this.wardScanedListFiltered = this.wardScaanedList;
                      this.totalScanedCards = this.wardScanedListFiltered.length;
                    }
                    else {
                      let dbPath = "CardWardMapping/" + cardNo;
                      let mapInstance = this.db.object(dbPath).valueChanges().subscribe((mapData) => {
                        mapInstance.unsubscribe();
                        if (mapData != null) {
                          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScanDetail", mapData);
                          let line = mapData["line"];
                          let ward = mapData["ward"];

                          dbPath = "Houses/" + ward + "/" + line + "/" + cardNo;

                          let houseInstance = this.db.object(dbPath).valueChanges().subscribe((houseData) => {
                            houseInstance.unsubscribe();
                            let rfId = "";
                            let personName = "";
                            if (houseData != null) {
                              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScanDetail", houseData);
                              rfId = houseData["rfid"];
                              personName = houseData["name"];
                              this.wardScaanedList.push({
                                wardNo: wardNo,
                                cardNo: cardNumber,
                                time: scanTime,
                                name: name,
                                rfId: rfId,
                                personName: personName,
                                sno: Number(date),
                              });
                              this.wardScaanedList = this.wardScaanedList.sort((a, b) =>
                                Number(b.sno) < Number(a.sno) ? 1 : -1
                              );
                              this.wardScanedListFiltered = this.wardScaanedList;
                              this.totalScanedCards = this.wardScanedListFiltered.length;
                            }

                          });
                        }
                      });
                    }
                  }
                }
              }
            }
          }
        });
      }
    });
  }
}
