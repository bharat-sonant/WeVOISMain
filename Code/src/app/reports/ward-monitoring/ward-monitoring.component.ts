'use strict';

/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from '@angular/core';
//services
import { CommonService } from '../../services/common/common.service';

import * as CanvasJS from '../../../assets/canvasjs.min';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-monitoring',
  templateUrl: './ward-monitoring.component.html',
  styleUrls: ['./ward-monitoring.component.scss']
})

export class WardMonitoringComponent {
  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;
  zoneList: any[];
  lineWeightageList: any[];
  wardForWeightageList:any[]=[];
  selectedZoneName: any;
  selectedDate: any;
  zoneKML: any;
  public selectedZone: any;
  allLines: any[];
  skipCount: number;
  completeCount: number;
  totalLineCount: number;
  partailDoneCount: number;
  public bounds: any;
  polylines = [];
  selectedMonthName: any;
  selectedYear: any;
  db: any;
  wardTotalLines: any;
  cityName: any;
  txtDate = "#txtDate";
  divMap = "#divMap";
  divGraph = "#divGraph";
  chartContainer = "#chartContainer";
  divGeneralData = "#divGeneralData";

  reportData: ReportData =
    {
      zoneName: "--",
      reportDate: "--",
      driverName: "--",
      helperName: "--",
      vehicleNo: "--"
    };

  constructor(public fs: FirebaseService, private commonService: CommonService) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("General-Reports","Ward-Collection-Report",localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    this.getWardForLineWeitage();
    this.setSelectedYearMonth();
    this.setMap();
    this.setContainerHeight();
    this.getZoneList();
  }
  
  getWardForLineWeitage() {
    this.commonService.getWardForLineWeitage().then((wardForWeightageList: any) => {
      this.wardForWeightageList = wardForWeightageList;
    });
  }

  setContainerHeight() {
    $(this.divMap).css("height", $(window).height() - 180);
    $(this.divGraph).css("height", $(window).height() - $(this.divGeneralData).height() - 191);
    $(this.chartContainer).css("height", $(window).height() - $(this.divGeneralData).height() - 201);
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
    this.showReport();
  }

  setSelectedYearMonth() {
    $(this.txtDate).val(this.selectedDate);
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;
    this.selectedZoneName = "Ward " + filterVal;
    this.showReport();
  }

  showReport() {
    this.resetAllData();
    this.setMap();
    this.setWardBoundary();
    this.getAllWardLines();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  setMap() {
    let mapProp = this.commonService.mapForReport();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  resetAllData() {
    this.allLines = [];
    this.lineWeightageList = [];
    this.skipCount = 0;
    this.completeCount = 0;
    this.totalLineCount = 0;
    this.partailDoneCount = 0;
    this.bounds = new google.maps.LatLngBounds();
    this.polylines = [];
    this.reportData.driverName = "--";
    this.reportData.helperName = "--";
    this.reportData.vehicleNo = "--";
    this.reportData.zoneName = "--";
    this.reportData.reportDate = this.selectedDate;
    this.drawChart();
  }

  setWardBoundary() {
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

  getAllWardLines() {
    let wardDetail = this.wardForWeightageList.find(item => item.zoneNo == this.selectedZone);
    if (wardDetail != undefined) {
      this.commonService.getWardLineWeightage(this.selectedZone, this.selectedDate).then((lineWeightageList: any) => {
        this.getAllLinesFromList(lineWeightageList);
      });
    }
    else {
      this.commonService.getWardLine(this.selectedZone, this.selectedDate).then((lineData: any) => {
        this.getAllLinesFromJson(lineData);
      });
    }
  }

  getAllLinesFromJson(data: any) {
    let wardLines = JSON.parse(data);
    let keyArray = Object.keys(wardLines);
    this.wardTotalLines = wardLines["totalLines"];
    let linePath = [];
    for (let i = 0; i < keyArray.length - 1; i++) {
      let lineNo = Number(keyArray[i]);
      try {
        let points = wardLines[lineNo]["points"];
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
        }
        linePath.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA",lineWeightage:1 });
      }
      catch { }
    }
    this.allLines = linePath;
    this.plotLineOnMap(false);
  }

  getAllLinesFromList(lineWeightageList: any) {
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
    this.plotLineOnMap(true);
  }

  plotLineOnMap(isLineWeghtageAllow: any) {
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != null) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
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
            if (lineStatusData[lineNo] != undefined) {
              if (lineStatusData[lineNo]["Status"] != 'undefined') {
                if (lineStatusData[lineNo]["Status"] == "LineCompleted") {
                  lineColor = "#33ff33";
                  this.completeCount++
                  percentage += (100 / Number(this.wardTotalLines)) * parseFloat(lineData.lineWeightage);
                } else if (lineStatusData[lineNo]["Status"] == "PartialLineCompleted") {
                  lineColor = "#ff9d00";
                  this.partailDoneCount++;
                  percentage += (100 / Number(this.wardTotalLines)) * parseFloat(lineData.lineWeightage);
                } else if (lineStatusData[lineNo]["Status"] == "Skipped") {
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
        if (isLineWeghtageAllow == true) {
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
        }
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
        fontSize: 13,
        verticalAlign: "top",
      },
      toolTip: {
        enabled: false,
      },
      data: [{
        type: "doughnut",
        showInLegend: true,
        indexLabel: "#percent%",
        indexLabelPlacement: "inside",
        indexLabelFontColor: "navy",
        indexLabelFontWeight: "bold",
        dataPoints: [
          { y: this.completeCount, name: "Complete", color: "#66ff71", },
          { y: this.skipCount, name: "Skip", color: "#fc5364" },
          { y: this.partailDoneCount, name: "Partial Done", color: "#ff9d00" },
          { y: pending, name: "Pending", color: "#DCDCDC" }
        ]
      }]
    });
    chart.render();
  }
}

export class ReportData {
  zoneName: string;
  reportDate: string;
  driverName: string;
  helperName: string;
  vehicleNo: string;
}
