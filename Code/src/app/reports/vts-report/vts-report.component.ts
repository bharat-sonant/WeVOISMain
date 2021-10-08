'use strict';

/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../services/common/common.service';
import * as CanvasJS from '../../../assets/canvasjs.min';
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-vts-report',
  templateUrl: './vts-report.component.html',
  styleUrls: ['./vts-report.component.scss']
})
export class VtsReportComponent {
  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;
  zoneList:any[];
  wardList: any[];
  circleList: any[];
  reportData: ReportData =
    {
      zoneName: "--",
      reportDate: "--",
      vehicleNo: "--",
      wardLength: "0.000",
      coveredLength: "0.000"

    };
  selectedWardNo: any;
  selectedWardName: any;
  selectedDate: any;

  public selectedWard: any;
  allLines: any[];
  totalLineCount: number;
  public bounds: any;

  polylines = [];
  currentMonthName: any;
  currentYear: any;
  db: any;
  wardLines: any;
  cityName: any;
  percentage: any;

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
    this.selectedWardNo = "0";
    this.selectedWardName = "---";
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
    this.wardList = [];
    this.wardList.push({ wardNo: "0", wardName: "--Select--" });
    this.setMap();
    this.setContainerHeight();
    this.percentage = 0;
  }

  setContainerHeight() {
    $('#divMap').css("height", $(window).height() - 180);
    $('#divGraph').css("height", $(window).height() - $("#divGeneralData").height() - 191);
    $('#chartContainer').css("height", $(window).height() - $("#divGeneralData").height() - 201);
  }

  changeZoneSelection(filterVal: any) {
    this.selectedWardNo = "0";
    this.selectedWardName = "---";
    this.resetAll();
    this.drawChart();
    this.wardList = [];
    this.wardList.push({ wardNo: "0", wardName: "--Select--" });

    let zoneDetail = this.zoneList.find(item => item.zoneName == filterVal);
    if (zoneDetail != undefined) {
      let wardList = zoneDetail.wardList;
      for (let i = 1; i < wardList.length; i++) {
        this.wardList.push({ wardNo: wardList[i], wardName: "Ward " + wardList[i] });
      }
    }
  }

  setMap() {
    let mapProp = this.commonService.mapForReport();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setKml() {
    this.commonService.setKML(this.selectedWard, this.map);
  }

  changeWardSelection(filterVal: any) {
    this.selectedWardNo = filterVal;
    if (filterVal != "0") {
      this.selectedWardName = "Ward " + filterVal;
    }
    else {
      this.selectedWardName = "---";
    }
    this.showReport();
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate($("#txtDate").val(), 1);
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.commonService.setTodayDate())) {
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    this.showReport();
  }

  showReport() {
    this.resetAll();
    this.setMap();
    this.setKml();
    this.drawWardAllLines();
  }

  resetAll() {
    this.reportData.zoneName = this.selectedWardName;
    this.reportData.reportDate = this.selectedDate;
    this.percentage = 0;
    this.reportData.coveredLength = "0.000";
    this.reportData.vehicleNo = "--";
    this.reportData.wardLength = "0.000";
    this.bounds = new google.maps.LatLngBounds();
    this.selectedWard = this.selectedWardNo;
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
  }

  drawWardAllLines() {
    this.httpService.get("../../assets/jsons/JaipurGreater/" + this.selectedWard + ".json").subscribe(data => {
      if (data != null) {
        var linePath = [];
        var keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 1; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            if (data[lineNo] != null) {
              var path = [];
              for (let j = 0; j < data[lineNo]["points"].length; j++) {
                path.push({ lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1] });
                this.bounds.extend({ lat: data[lineNo].points[j][0], lng: data[lineNo].points[j][1] });
              }
              linePath.push({ lineNo: i, latlng: path, color: "#87CEFA" });
            }
          }
          this.allLines = linePath;
          this.drawRealTimePloylines();
        }
      }
    }, err => {
      let wardLineCount = this.db.object("WardLines/" + this.selectedWard + "").valueChanges().subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          var linePath = [];
          this.wardLines = Number(lineCount);
          for (let i = 1; i <= Number(this.wardLines); i++) {
            let dbPath = "Defaults/WardLines/" + this.selectedWard + "/" + i + "/points";
            let wardLines = this.db.list(dbPath).valueChanges().subscribe((zoneData) => {
              wardLines.unsubscribe();
              if (zoneData.length > 0) {
                let lineData = zoneData;
                var path = [];
                for (let j = 0; j < lineData.length; j++) {
                  path.push({ lat: lineData[j][0], lng: lineData[j][1] });
                  this.bounds.extend({ lat: lineData[j][0], lng: lineData[j][1] });
                }
                linePath.push({ lineNo: i, latlng: path, color: "#87CEFA" });
              }
            });
          }
          this.allLines = linePath;
          this.drawRealTimePloylines();
        }
      });
    });
  }

  drawRealTimePloylines() {
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split('-')[0];
    let dbPathLineCompleted = 'WasteCollectionInfo/' + this.selectedWard + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectedDate + '/LineStatus';
    let lineCompletedRecords = this.db.object(dbPathLineCompleted).valueChanges().subscribe(
      data => {
        for (let index = 1; index <= this.allLines.length; index++) {
          let lineData = this.allLines.find(item => item.lineNo == index);
          let lineColor = "#fa0505";
          if (data != null) {
            if (data[index] != undefined) {
              if (data[index]["Status"] != 'undefined') {
                if (data[index]["Status"] == "LineCompleted") {
                  lineColor = "#0ba118";
                }
              }
            }
          }
          lineData.color = lineColor;
        }

        for (let index = 0; index < this.polylines.length; index++) {
          this.polylines[index].setMap(null);
        }

        this.polylines = [];
        for (let index = 0; index < this.allLines.length; index++) {

          let lineData = this.allLines.find(item => item.lineNo == (index + 1));
          let line = new google.maps.Polyline({
            path: lineData.latlng,
            strokeColor: lineData.color,
            strokeWeight: 2
          });

          this.polylines.push(line);
          this.totalLineCount++;
        }
        for (let index = 0; index < this.polylines.length; index++) {
          this.polylines[index].setMap(this.map);
        }
        this.map.fitBounds(this.bounds);
        lineCompletedRecords.unsubscribe();
        this.getSummary();
        setTimeout(() => {
          this.drawChart();
        }, 1000);
      });
  }

  getSummary() {

    let wardLenghtPath = "WardRouteLength/" + this.selectedWard;
    let wardLengthDetails = this.db.object(wardLenghtPath).valueChanges().subscribe((wardLengthData) => {
      wardLengthDetails.unsubscribe();
      if (wardLengthData != null) {
        this.reportData.wardLength = (parseFloat(wardLengthData.toString()) / 1000).toFixed(3) + "";
      } else {
        this.reportData.wardLength = "0.000";
      }
    });

    let workerDetailsdbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    let workerDetails = this.db.object(workerDetailsdbPath).valueChanges().subscribe((workerData) => {
      workerDetails.unsubscribe();
      if (workerData != null) {
        if (workerData["vehicles"] != null) {
          let vechileList = workerData["vehicles"].split(',');
          if (vechileList.length > 0) {
            for (let i = 0; i < vechileList.length; i++) {
              if (i == 0) {
                this.reportData.vehicleNo = vechileList[i];
              }
              else {
                this.reportData.vehicleNo = this.reportData.vehicleNo + ", " + vechileList[i];
              }
            }
          }
        }
        if (workerData["workPercentage"] != null) {
          this.percentage = Number(workerData["workPercentage"]);
        }
        if (workerData["wardCoveredDistance"] != null) {
          this.reportData.coveredLength = (parseFloat(workerData["wardCoveredDistance"].toString()) / 1000).toFixed(3) + "";
        }

      }
    });
  }

  drawChart() {
    let pending = 100 - Number(this.percentage);
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
          { y: this.percentage, name: "Complete", color: "#66ff71", },
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
  vehicleNo: string;
  wardLength: string;
  coveredLength: string;
}
