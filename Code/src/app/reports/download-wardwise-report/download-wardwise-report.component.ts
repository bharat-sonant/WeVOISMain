"use strict";

/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
import { interval } from "rxjs";
import { CommonService } from "../../services/common/common.service";
import * as CanvasJS from "../../../assets/canvasjs.min";
import * as html2canvas from "html2canvas";
import * as jspdf from "jspdf";
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-download-wardwise-report",
  templateUrl: "./download-wardwise-report.component.html",
  styleUrls: ["./download-wardwise-report.component.scss"],
})
export class DownloadWardwiseReportComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  zoneList: any[];
  reportData: ReportData = {
    zoneName: "--",
    reportDate: "--",
    driverName: "--",
    helperName: "--",
    vehicleNo: "--",
  };
  zoneKML: any;
  selectedZoneName: any;
  selectedDate: any;
  selectedMonthName: any;
  selectedYear: any;
  public selectedZone: any;
  marker = new google.maps.Marker();
  allLines: any[];
  lineWeightageList: any[];
  skipCount: number;
  completeCount: number;
  totalLineCount: number;
  wardIndex: number;
  public progress: any;
  public progressDisplayText: string;
  polylines = [];
  partailDoneCount: number;
  reportImages: any[];

  constructor(public fs: FirebaseService,  private commonService: CommonService) { }

  db: any;
  cityName: any;
  mapRefrence: any;
  wardTotalLines: any;
  txtDate = "#txtDate";
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedZone = "0";
    this.progress = 0;
    this.reportImages = [];
    this.selectedDate = this.commonService.setTodayDate();
    this.setSelectedYearMonth();
    this.getZoneList();
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      this.selectedDate = this.commonService.getNextDate($(this.txtDate).val(), 1);
    } else if (type == "previous") {
      this.selectedDate = this.commonService.getPreviousDate($(this.txtDate).val(), 1);
    }
    this.setSelectedYearMonth();
  }

  setSelectedYearMonth() {
    $(this.txtDate).val(this.selectedDate);
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  prepareReport() {
    this.reportImages = [];
    this.wardIndex = 1;
    this.progress = 0;

    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!")
      return;
    }
    $("#divProgress").show();
    this.progressDisplayText = "Progress";
    this.createReport();
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;
    this.selectedZoneName = "Ward " + filterVal;
  }

  createReport() {
    this.skipCount = 0;
    this.completeCount = 0;
    this.totalLineCount = 0;
    this.partailDoneCount = 0;
    this.mapRefrence = "";
    this.wardTotalLines = 0;
    this.selectedZoneName = "Ward " + this.selectedZone;
    this.polylines = [];
    this.allLines = [];
    this.lineWeightageList=[];
    this.setMap();
    this.drawZoneAllLines();
    this.showReportCreationProgress();
  }

  setMap() {
    let mapProp = this.commonService.mapForReport();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, 2).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
    });
  }

  drawZoneAllLines() {
    this.commonService.getWardLineWeightage(this.selectedZone, this.selectedDate).then((lineWeightageList: any) => {
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          if (this.polylines[i] != null) {
            this.polylines[i].setMap(null);
          }
        }
      }
      this.polylines = [];
      this.lineWeightageList = lineWeightageList;
      this.wardTotalLines = this.lineWeightageList[this.lineWeightageList.length - 1]["totalLines"];
      for (let i = 0; i < this.lineWeightageList.length - 1; i++) {
        let lineNo = this.lineWeightageList[i]["lineNo"];
        let points = this.lineWeightageList[i]["points"];
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
        }
        this.allLines.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA", lineWeightage: this.lineWeightageList[i]["weightage"] });
      }
      this.drawRealTimePloylines();
    });
  }

  drawRealTimePloylines(){
    let dbPath = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.selectedYear + '/' + this.selectedMonthName + '/' + this.selectedDate + '/LineStatus';
    let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
      lineStatusData => {
        lineStatusInstance.unsubscribe();
        let percentage = 0;
        let skippedPercentage = 0;
        for (let index = 0; index < this.allLines.length; index++) {
          let lineNo = this.allLines[index]["lineNo"];
          let lineData = this.allLines.find(item => item.lineNo == lineNo);
          let lineColor = "#87CEFA";
          if (lineStatusData != null) {
            if (lineStatusData[index] != undefined) {
              if (lineStatusData[index]["Status"] != 'undefined') {
                if (lineStatusData[index]["Status"] == "LineCompleted") {
                  lineColor = "#33ff33";
                  percentage += (100 / Number(this.wardTotalLines)) * parseFloat(lineData.lineWeightage);
                } else if (lineStatusData[index]["Status"] == "PartialLineCompleted") {
                  lineColor = "#ff9d00";
                  this.partailDoneCount++;
                  percentage += (100 / Number(this.wardTotalLines)) * parseFloat(lineData.lineWeightage);
                } else if (lineStatusData[index]["Status"] == "Skipped") {
                  lineColor = "red";
                  this.skipCount++
                } else {
                  lineColor = "#87CEFA";
                }
              }
            }
          }
          lineData.color = lineColor;
          let line = new google.maps.Polyline({
            path: lineData.latlng,
            strokeColor: lineData.color,
            strokeWeight: 2
          });
          this.polylines.push(line);
          this.polylines[index].setMap(this.map);
          this.totalLineCount++;
        }
        if (this.skipCount > 0) {
          skippedPercentage = 100 - ((this.skipCount / Number(this.wardTotalLines)) * 100);
          if (percentage > skippedPercentage) {
            percentage = skippedPercentage;
          }
        }
        if (percentage > 100) {
          percentage = 100;
        }
        this.completeCount = Number(((Number(percentage.toFixed(0)) * this.wardTotalLines) / 100).toFixed(0));
        this.getSummaryDetail();
      });
  }

  getSummaryDetail() {
    let workDetailsPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/WorkerDetails";
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe((workerData) => {
      workDetails.unsubscribe();
      if (workerData != null) {
        let driverList = workerData["driverName"].split(',');
        let driverName = "";
        for (let i = 0; i < driverList.length; i++) {
          if (i == 0) {
            driverName = driverList[i];
          }
          if (!driverName.includes(driverList[i])) {
            driverName = driverName + "," + driverList[i];
          }
        }
        this.reportData.driverName = driverName != "" ? driverName : "Not Assigned";

        let helperList = workerData["helperName"].split(',');
        let helperName = "";
        for (let i = 0; i < helperList.length; i++) {
          if (i == 0) {
            helperName = helperList[i];
          }
          if (!helperName.includes(helperList[i])) {
            helperName = helperName + "," + helperList[i];
          }
        }
        this.reportData.helperName = helperName != "" ? helperName : "Not Assigned";
        this.reportData.vehicleNo = workerData != null ? workerData["vehicle"] : "Not Assigned";
        this.reportData.zoneName = this.selectedZoneName;
        this.reportData.reportDate = this.selectedDate;
        this.drawChart();

      } else {
        this.reportData.driverName = "Not Assigned";
        this.reportData.helperName = "Not Assigned";
        this.reportData.vehicleNo = "Not Assigned";
        this.reportData.zoneName = this.selectedZoneName;
        this.reportData.reportDate = this.selectedDate;
        this.drawChart();
      }
    });

  }

  drawChart() {
    let pending = this.totalLineCount - (this.completeCount + this.skipCount + this.partailDoneCount);
    let chart = new CanvasJS.Chart("chartContainer", {
      animationEnabled: true,
      legend: {
        fontSize: 10,
        verticalAlign: "top",
      },
      toolTip: {
        enabled: false,
      },
      data: [
        {
          type: "doughnut",
          showInLegend: true,
          indexLabel: "#percent%",
          indexLabelPlacement: "inside",
          indexLabelFontColor: "navy",
          indexLabelFontWeight: "bold",
          dataPoints: [
            { y: this.completeCount, name: "Complete", color: "#66ff71" },
            { y: this.skipCount, name: "Skip", color: "#fc5364" },
            {
              y: this.partailDoneCount,
              name: "Partial Done",
              color: "#ff9d00",
            },
            { y: pending, name: "Pending", color: "#DCDCDC" },
          ],
        },
      ],
    });

    chart.render();

    setTimeout(() => {
      this.prepareReportImages();
    }, 3000);
  }

  prepareReportImages() {
    // Google map image
    html2canvas(document.querySelector(".gm-style"), {
      useCORS: true,
      allowTaint: false,
      async: false,
    }).then((canvas: { toDataURL: (arg0: string) => string }) => {
      document
        .getElementById("mapImg")
        .setAttribute("src", canvas.toDataURL("image/png"));

      // Information Image
      html2canvas(document.querySelector(".tbl"), {
        useCORS: true,
        allowTaint: false,
        async: false,
      }).then((canvas: { toDataURL: (arg0: string) => string }) => {
        document
          .getElementById("infoImg")
          .setAttribute("src", canvas.toDataURL("image/png"));

        // Chart Image
        html2canvas(document.querySelector(".divChart"), {
          useCORS: true,
          allowTaint: false,
          async: false,
        }).then((canvas: { toDataURL: (arg0: string) => string }) => {
          document
            .getElementById("chartImg")
            .setAttribute("src", canvas.toDataURL("image/png"));

          html2canvas(document.querySelector(".reportFrame"), {
            useCORS: true,
            allowTaint: false,
            async: false,
          }).then(
            function (canvas: { toDataURL: (arg0: string) => string }) {
              this.reportImages.push({ name: canvas.toDataURL("image/png") });
              this.downloadPDFReport();
            }.bind(this)
          );
        });
      });
    });
  }

  showReportCreationProgress() {
    let count = 1;
    let progressInterval = interval(300).subscribe((val) => {
      count++;
      this.progress = 4 * count;
      if (count == 25) {
        progressInterval.unsubscribe();
      }
    });
  }

  downloadPDFReport() {
    let pdf = new jspdf({
      orientation: "landscape",
      unit: "mm",
      format: [850, 550],
    });

    var position = 0;
    for (let index = 0; index < this.reportImages.length; index++) {
      pdf.addImage(
        this.reportImages[index]["name"],
        "PNG",
        0,
        position,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight(),
        this.zoneList[index],
        "FAST"
      );

      if (index != this.reportImages.length - 1) {
        pdf.addPage();
      }
    }
    pdf.save(this.selectedZoneName + "[ " + this.selectedDate + "]");
  }
}

export class ReportData {
  zoneName: string;
  reportDate: string;
  driverName: string;
  helperName: string;
  vehicleNo: string;
}
