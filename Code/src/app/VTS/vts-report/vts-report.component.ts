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
  zoneList: any[];
  wardList: any[];
  routeMainList: any[];
  routeList: any[];
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
  selectedRouteName: any;
  selectedRouteNo: any;
  selectedDate: any;
  polylines = [];
  currentMonthName: any;
  currentYear: any;
  db: any;
  wardLines: any;
  cityName: any;
  percentage: any;
  lines: any[];
  routeData: any;

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
    this.routeList = [];
    this.wardList = [];
    this.setMap();
    this.setContainerHeight();
    this.percentage = 0;
    this.lines = [];
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
    this.commonService.setWardBoundary(this.selectedWardNo, this.map).then((wardKML: any) => {
    });
  }

  changeWardSelection(filterVal: any) {
    this.selectedWardNo = filterVal;
    if (filterVal != "0") {
      this.selectedWardName = "Ward " + filterVal;
    }
    else {
      this.selectedWardName = "---";
    }
    this.getRoute();

    this.showReport();
  }

  changeRouteSelection(filterVal: any) {
    this.selectedRouteNo = filterVal;
    this.showReport();
  }

  getRoute() {
    this.routeMainList = [];
    this.routeList = [];
    let dbPath = "Route/" + this.selectedWardNo;
    let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        routeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let routeKey = keyArray[i];
              let routeName = data[routeKey]["name"];
              let routeObject = data[routeKey]["Routes"];
              let routeKeyArray = Object.keys(routeObject);
              if (routeKeyArray.length > 0) {
                for (let j = 0; j < routeKeyArray.length - 1; j++) {
                  let key = routeKeyArray[j];
                  let startDate = routeObject[key]["startDate"];
                  let endDate = this.selectedDate;
                  if (routeObject[key]["endDate"] != null) {
                    endDate = routeObject[key]["endDate"];
                  }
                  let routeLines = [];
                  if (routeObject[key]["routeLines"] != null) {
                    let list = routeObject[key]["routeLines"].split(',');
                    if (list.length > 0) {
                      for (let k = 0; k < list.length; k++) {
                        routeLines.push({ lineNo: list[k] });
                      }
                    }
                  }
                  this.routeMainList.push({ routeKey: routeKey, routeName: routeName, key: key, startDate: startDate, endDate: endDate, routeLines: routeLines });
                }
              }
            }
            this.getRouteList();
          }
        }
      }
    );
  }

  getRouteList() {
    if (this.routeMainList.length > 0) {
      let selectedDate = new Date(this.selectedDate);
      for (let i = 0; i < this.routeMainList.length; i++) {
        let startDate = new Date(this.routeMainList[i]["startDate"]);
        let endDate = new Date(this.routeMainList[i]["endDate"]);
        if (selectedDate >= startDate && selectedDate <= endDate) {
          this.routeList.push({ routeKey: this.routeMainList[i]["routeKey"], routeName: this.routeMainList[i]["routeName"], key: this.routeMainList[i]["key"], routeLines: this.routeMainList[i]["routeLines"] });
        }
      }
    }
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
    this.getAllLinesFromJson();
  }

  resetAll() {
    this.reportData.zoneName = this.selectedWardName;
    this.reportData.reportDate = this.selectedDate;
    this.percentage = 0;
    this.reportData.coveredLength = "0.000";
    this.reportData.vehicleNo = "--";
    this.reportData.wardLength = "0.000";
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if(this.polylines[i]!=undefined){
        this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    this.lines = [];
  }

  getAllLinesFromJson() {
    this.httpService.get("../../assets/jsons/WardLines/" + this.cityName + "/" + this.selectedWardNo + ".json").subscribe(data => {
      if (data != null) {
        var keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            this.wardLines = keyArray.length;
            let lineNo = keyArray[i];
            let routeDetail = this.routeList.find(item => item.routeKey == this.selectedRouteNo);
            if (routeDetail != undefined) {
              let routeLines = routeDetail.routeLines;
              let lineDetail = routeLines.find(item => item.lineNo == lineNo);
              if (lineDetail != undefined) {
                if (data[lineNo] != null) {
                  var latLng = [];
                  if (data[lineNo]["points"] != undefined) {
                    if (data[lineNo]["points"].length > 0) {
                      for (let j = 0; j < data[lineNo]["points"].length; j++) {
                        latLng.push({ lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1] });
                      }
                      this.lines.push({
                        lineNo: lineNo,
                        latlng: latLng,
                        color: "#fa0505",
                      });
                      this.plotLineOnMap(lineNo, latLng, i - 1, this.selectedWardNo);
                    }
                  }
                }
              }
            }
          }
        }
        this.getSummary();
        setTimeout(() => {
          this.drawChart();
        }, 1000);
      }
    });
  }

  plotLineOnMap(lineNo: any, latlngs: any, i: any, wardNo: any) {
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split('-')[0];
    let dbPathLineStatus = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
      lineStatus.unsubscribe();
      let strockColor = "#fa0505";
      if (status != null) {
        strockColor = "#0ba118";
      }
      let line = new google.maps.Polyline({
        path: latlngs,
        strokeColor: strockColor,
        strokeWeight: 2,
      });
      this.polylines[i] = line;
      this.polylines[i].setMap(this.map);
    });
  }

  getSummary() {
    this.commonService.getWardTotalLength(this.selectedWardNo).then((totalLength) => {
      if (totalLength != null) {
        this.reportData.wardLength = (parseFloat(totalLength.toString()) / 1000).toFixed(3);
      }
      else {
        this.reportData.wardLength = "0.000";
      }
    });

    let workerDetailsdbPath = "WasteCollectionInfo/" + this.selectedWardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
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
        if (workerData["workPerc"] != null) {
          this.percentage = Number(workerData["workPerc"]);
        }
        if (workerData["coveredLength"] != null) {
          this.reportData.coveredLength = (parseFloat(workerData["coveredLength"].toString()) / 1000).toFixed(3) + "";
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
