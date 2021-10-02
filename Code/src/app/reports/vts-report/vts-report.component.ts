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
  index: any;
  studentDetail: any;
  zoneList: any[];
  reportData: ReportData =
    {
      zoneName: "--",
      reportDate: "--",
      vehicleNo: "--"
    };
  selectedZoneNo: any;
  selectedZoneName: any;
  selectedDate: any;

  public selectedZone: any;
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  skipCount: number;
  completeCount: number;
  totalLineCount: number;
  partailDoneCount: number;
  public bounds: any;

  polylines = [];
  currentMonthName: any;
  currentYear: any;
  db: any;
  mapRefrence: any;
  wardLines: any;
  cityName: any;

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
    this.selectedZoneNo = "0";
    this.selectedZoneName = "--Select--";
    this.getZoneList();
    this.setMap();
    this.setContainerHeight();
  }

  setContainerHeight() {
    $('#divMap').css("height", $(window).height() - 180);
    $('#divGraph').css("height", $(window).height() - $("#divGeneralData").height() - 191);
    $('#chartContainer').css("height", $(window).height() - $("#divGeneralData").height() - 201);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  setMap() {
    let mapProp = this.commonService.mapForReport();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setKml() {
    this.commonService.setKML(this.selectedZone, this.map);
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZoneNo = filterVal;
    this.selectedZoneName = "Ward " + filterVal;
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
      //this.selectedDate = this.commonService.setTodayDate();
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    this.showReport();
  }


  showReport() {
    this.skipCount = 0;
    this.completeCount = 0;
    this.totalLineCount = 0;
    this.partailDoneCount = 0;
    let msg: string;
    this.bounds = new google.maps.LatLngBounds();
    this.selectedZone = this.selectedZoneNo;
    this.polylines = [];
    this.setMap();
    this.setKml();
    this.drawZoneAllLines();
  }

  drawZoneAllLines() {
    this.httpService.get("../../assets/jsons/JaipurGreater/" + this.selectedZone + ".json").subscribe(data => {
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
      let wardLineCount = this.db.object("WardLines/" + this.selectedZone + "").valueChanges().subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          var linePath = [];
          this.wardLines = Number(lineCount);
          for (let i = 1; i <= Number(this.wardLines); i++) {
            let dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + i + "/points";
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
    let dbPathLineCompleted = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectedDate + '/LineStatus';

    let lineCompletedRecords = this.db.object(dbPathLineCompleted).valueChanges().subscribe(
      data => {
        for (let index = 1; index <= this.allLines.length; index++) {
          let lineData = this.allLines.find(item => item.lineNo == index);
          let lineColor = "#87CEFA";
          if (data != null) {
            document.getElementById('btnDownload')["disabled"] = false;
            if (data[index] != undefined) {
              if (data[index]["Status"] != 'undefined') {

                if (data[index]["Status"] == "LineCompleted") {
                  lineColor = "#33ff33";
                } else if (data[index]["Status"] == "PartialLineCompleted") {
                  lineColor = "#ff9d00";
                } else if (data[index]["Status"] == "skip" || data[index]["Status"] == "Skipped") {
                  lineColor = "red";
                } else {
                  lineColor = "#87CEFA";
                }
                if (data[index]["Status"] == "LineCompleted") {
                  this.completeCount++
                } else if (data[index]["Status"] == "PartialLineCompleted") {
                  this.partailDoneCount++;
                } else {
                  this.skipCount++
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

        this.getZoneVehicles();

      });
  }


  getZoneVehicles() {
    this.reportData.zoneName = this.selectedZoneName;
    this.reportData.reportDate = this.selectedDate;
    this.drawChart();
    let workerDetailsdbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
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
}
