"use strict";

/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
import { AngularFireDatabase } from "angularfire2/database";
import { ToastrService } from "ngx-toastr";
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import * as CanvasJS from "../../../assets/canvasjs.min";
import * as html2canvas from "html2canvas";
import * as jspdf from "jspdf";
import * as $ from "jquery";
import { stringify } from "@angular/compiler/src/util";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-download-collection-report",
  templateUrl: "./download-collection-report.component.html",
  styleUrls: ["./download-collection-report.component.scss"],
})
export class DownloadCollectionReportComponent {
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

  selectedZoneNo: any;
  selectedZoneName: any;
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;

  public selectedZone: any;
  marker = new google.maps.Marker();
  allLines: any[];
  skipCount: number;
  completeCount: number;
  totalLineCount: number;
  wardIndex: number;
  public progress: any;
  public progressDisplayText: string;
  polylines = [];
  partailDoneCount: number;
  reportImages: any[];
  constructor(
    public fs: FirebaseService,
    private mapService: MapService,
    private commonService: CommonService,
    private httpService: HttpClient,
    private toastr: ToastrService
  ) {}

  reportCount: number;
db:any;
  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );
    this.progress = 0;
    this.getZoneList();
    this.reportImages = [];
    //this.selectedDate = "2019-07-20";
    //this.prepareReport();
  }

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getZones(this.selectedDate);
  }

  prepareReport() {
    this.reportImages = [];
    this.wardIndex = 1;
    this.progress = 0;

    let isFormValid = true;
    let msg: string;

    if (this.selectedDate == undefined) {
      isFormValid = false;
      msg = "Please select date.";
    }

    if (isFormValid) {
      $("#divProgress").show();
      this.progressDisplayText = "Progress";
      this.createReport(this.wardIndex);
    } else {
      let errorMsg = '<span class="now-ui-icons ui-1_bell-53"></span> ' + msg;
      this.toastr.error(errorMsg, "", {
        timeOut: 5000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-danger alert-with-icon",
        positionClass: "toast-bottom-right",
      });
    }
  }

  createReport(index: number) {
    this.reportCount = this.zoneList.length - 1;

    if (index > this.reportCount) {
      document.getElementById("btnDownloadReport")["disabled"] = false;
      this.downloadPDFReport();
      return;
    }

    this.skipCount = 0;
    this.completeCount = 0;
    this.totalLineCount = 0;
    this.partailDoneCount = 0;

    this.selectedZone = this.zoneList[index]["zoneNo"];

    this.selectedZoneName = "Ward " + this.selectedZone;
    this.polylines = [];
    this.allLines = [];
    this.setMap();
    this.drawZoneAllLines();
    this.showReportCreationProgress();
  }

  setMap() {
    let mapProp = this.commonService.mapForReport();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);

    this.db
      .object("Defaults/KmlBoundary/" + this.selectedZone)
      .valueChanges()
      .subscribe((wardPath) => {
        new google.maps.KmlLayer({
          url: wardPath.toString(),
          map: this.map,
        });
      });
  }

  drawZoneAllLines() {
    let wardLines = this.db
      .object("Defaults/WardLines/" + this.selectedZone)
      .valueChanges()
      .subscribe((zoneLine) => {
        for (let i = 1; i < 10000; i++) {
          var line = zoneLine[i];
          if (line == undefined) {
            break;
          }

          var path = [];
          for (let j = 0; j < line.points.length; j++) {
            path.push({ lat: line.points[j][0], lng: line.points[j][1] });
          }

          this.allLines.push({ lineNo: i, latlng: path, color: "#87CEFA" });
        }

        this.drawRealTimePloylines();
      });
  }

  drawRealTimePloylines() {
    this.currentYear = this.selectedDate.split("-")[0];
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );

    let dbPathLineCompleted =
      "WasteCollectionInfo/" +
      this.selectedZone +
      "/" +
      this.currentYear +
      "/" +
      this.currentMonthName +
      "/" +
      this.selectedDate +
      "/LineStatus";

    let lineCompletedRecords = this.db
      .object(dbPathLineCompleted)
      .valueChanges()
      .subscribe((data) => {
        if (data != null) {
          for (let index = 1; index <= this.allLines.length; index++) {
            if (data[index] != undefined) {
              let lineData = this.allLines.find((item) => item.lineNo == index);
              if (data[index]["Status"] != "undefined") {
                lineData.color = this.setLineColor(data, index);
                this.setStatusCounts(data, index);
              }
            }
          }
        }

        for (let index = 0; index < this.polylines.length; index++) {
          this.polylines[index].setMap(null);
        }

        this.polylines = [];

        for (let index = 0; index < this.allLines.length; index++) {
          let lineData = this.allLines.find((item) => item.lineNo == index + 1);
          let line = new google.maps.Polyline({
            path: lineData.latlng,
            strokeColor: lineData.color,
            strokeWeight: 2,
          });

          this.polylines.push(line);
          this.totalLineCount++;
        }

        for (let index = 0; index < this.polylines.length; index++) {
          this.polylines[index].setMap(this.map);
        }

        lineCompletedRecords.unsubscribe();

        this.getWardAssignmentInformation();
      });
  }

  getWardAssignmentInformation() {
    this.currentYear = this.selectedDate.split("-")[0];
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );

    if (new Date(this.selectedDate) < new Date("2019-08-01")) {
      let driverDataDbPath =
        "WasteCollectionInfo/" +
        this.selectedZone +
        "/" +
        this.currentYear +
        "/" +
        this.currentMonthName +
        "/" +
        this.selectedDate +
        "/DriverData";
      let driverInfo = this.db
        .object(driverDataDbPath)
        .valueChanges()
        .subscribe((driverData) => {
          // Set Driver details
          this.reportData.driverName =
            driverData != null ? driverData["dName"] : "Not Assigned";
          this.reportData.vehicleNo =
            driverData != null ? driverData["vNo"] : "Not Assigned";

          driverInfo.unsubscribe();

          let ReaderDataPath =
            "WasteCollectionInfo/" +
            this.selectedZone +
            "/" +
            this.selectedDate +
            "/ReaderData";
          let readerInfo = this.db
            .object(ReaderDataPath)
            .valueChanges()
            .subscribe((readerData) => {
              // Set Driver helper Details
              this.reportData.helperName =
                readerData != null ? readerData["dName"] : "Not Assigned";
              this.reportData.zoneName = this.selectedZoneName;
              this.reportData.reportDate = this.selectedDate;

              this.drawChart();
              readerInfo.unsubscribe();
            });
        });
    } else {
      let workDetailsPath =
        "WasteCollectionInfo/" +
        this.selectedZone +
        "/" +
        this.currentYear +
        "/" +
        this.currentMonthName +
        "/" +
        this.selectedDate +
        "/WorkerDetails";

      let workDetails = this.db
        .object(workDetailsPath)
        .valueChanges()
        .subscribe((workerData) => {
          if (workerData != null) {
            let driverPath =
              "Employees/" + workerData["driver"] + "/GeneralDetails";

            let driver = this.db
              .object(driverPath)
              .valueChanges()
              .subscribe((driverData) => {
                let helperPath =
                  "Employees/" + workerData["helper"] + "/GeneralDetails";

                let helper = this.db
                  .object(helperPath)
                  .valueChanges()
                  .subscribe((helperData) => {
                    let helperName;
                    if (helperData == null) {
                      helperName = "Not Assigned";
                    } else {
                      helperName = helperData["name"];
                      if (helperName == null) {
                        helperName = "Not Assigned";
                      }
                    }

                    this.reportData.driverName =
                      driverData != null
                        ? driverData["name"].toUpperCase()
                        : "Not Assigned";
                    this.reportData.helperName =
                      helperData != null
                        ? helperName.toUpperCase()
                        : "Not Assigned";
                    this.reportData.vehicleNo =
                      workerData != null
                        ? workerData["vehicle"]
                        : "Not Assigned";
                    this.reportData.zoneName = this.selectedZoneName;
                    this.reportData.reportDate = this.selectedDate;
                    this.drawChart();
                  });
              });
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
  }

  drawChart() {
    let pending =
      this.totalLineCount -
      (this.completeCount + this.skipCount + this.partailDoneCount);

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

              setTimeout(() => {
                this.wardIndex++;
                this.createReport(this.wardIndex);
              }, 3000);
            }.bind(this)
          );
        });
      });
    });
  }

  showReportCreationProgress() {
    this.progress = ((this.wardIndex / this.reportCount) * 100).toFixed(0);

    /*
    let wardCount = this.zoneList.length;

    let drawingInterval = interval(1000).subscribe((val) => {

      this.progress = ((this.wardIndex / wardCount) * 100).toFixed(0);

      if (this.wardIndex >= wardCount) {
        this.progress = 100;
        drawingInterval.unsubscribe();
      }

    });*/
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

    pdf.save("Report [" + this.selectedDate + "]");
  }

  setStatusCounts(data: any, index: any) {
    if (data[index]["Status"] == "LineCompleted") {
      this.completeCount++;
    } else if (data[index]["Status"] == "PartialLineCompleted") {
      this.partailDoneCount++;
    } else {
      this.skipCount++;
    }
  }

  setLineColor(data: any, index: any) {
    let color: string;

    if (data[index]["Status"] == "LineCompleted") {
      color = "#33ff33";
    } else if (data[index]["Status"] == "PartialLineCompleted") {
      color = "#ff9d00";
    } else if (data[index]["Status"] == "skip") {
      color = "red";
    } else {
      color = "#87CEFA";
    }

    return color;
  }
}

export class ReportData {
  zoneName: string;
  reportDate: string;
  driverName: string;
  helperName: string;
  vehicleNo: string;
}
