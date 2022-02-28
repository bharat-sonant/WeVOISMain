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
  wardLineLengthList: any[];
  reportData: ReportData =
    {
      zoneName: "---",
      reportDate: "---",
      vehicleNo: "---",
      wardLength: "0.000",
      coveredLength: "0.000"
    };
  selectedWardNo: any;
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
  txtPenalty = "#txtPenalty";
  chart: any;

  bvgWardLinesPath = "../../assets/jsons/WardLines/jaipur-greater/";
  nggjWardLinesPath = "../../assets/jsons/WardLines/nggj/";
  wardLinesPath = "../../assets/jsons/WardLines/jaipur-greater/";
  
  bvgBoundaryPath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/Jaipur-Greater%2FWardBoundryJson%2F";
  nggjBoundaryPath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/Jaipur-Greater%2FNGGJWardBoundryJson%2F";
  boundaryPath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/Jaipur-Greater%2FWardBoundryJson%2F";

  bvgRoutePath="Route/";
  nggjRoutePath="NGGJRoute/";
  routePath="Route/";

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.percentage = 0;
    this.selectedWardNo="0";
    this.setDefaultDate();
    this.setDefaultArray();
    this.getZoneList();
    this.setMap();
    this.setContainerHeight();
  }

  setDefaultArray(){
    this.routeMainList = [];
    this.routeList = [];
    this.wardList = [];
    this.wardLineLengthList = [];
    this.lines = [];
  }

  setNGGJ() {
    let element = <HTMLInputElement>document.getElementById("chkNGGJ");
    if (element.checked == true) {
      this.wardLinesPath = this.nggjWardLinesPath;
      this.routePath=this.nggjRoutePath;
      this.boundaryPath=this.nggjBoundaryPath;
    }
    else {
      this.wardLinesPath = this.bvgWardLinesPath;
      this.routePath=this.bvgRoutePath;
      this.boundaryPath=this.bvgBoundaryPath;
    }    
    this.setMap();
    this.setKml();
    this.getWardLineLength();
    this.getRoute();
    this.changeRouteSelection("0");
  }

  setDefaultDate(){
    this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
    this.reportData.reportDate = this.selectedDate;
  }

  getZoneList(){
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
  }

  setContainerHeight() {
    $('#divMap').css("height", $(window).height() - 180);
    $('#divGraph').css("height", $(window).height() - $("#divGeneralData").height() - 189);
    $('#chartContainer').css("height", $(window).height() - $("#divGeneralData").height() - 203);
  }

  changeZoneSelection(filterVal: any) {
    this.wardList = [];
    let zoneDetail = this.zoneList.find(item => item.zoneName == filterVal);
    if (zoneDetail != undefined) {
      let wardList = zoneDetail.wardList;
      for (let i = 1; i < wardList.length; i++) {
        this.wardList.push({ wardNo: wardList[i], wardName: "Ward " + wardList[i] });
      }
    }
    this.changeWardSelection("0");
  }

  changeWardSelection(filterVal: any) {
    this.selectedWardNo = filterVal;
    this.setMap();
    this.setKml();
    this.getWardLineLength();
    this.getRoute();
    this.changeRouteSelection("0");
  }

  changeRouteSelection(filterVal: any) {
    this.resetAll();
    this.selectedRouteNo = filterVal;
    this.setReportHeader();
    this.getAllLinesFromJson();
  }

  setMap() {
    let mapProp = this.commonService.mapForReport();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setKml() {
    this.commonService.setJaipurGreaterWardBoundary(this.map, this.boundaryPath + + this.selectedWardNo + ".json?alt=media").then((wardKML: any) => {
     
    });
  }

  getWardLineLength() {
    if (this.selectedWardNo != "0") {
      this.commonService.getWardLineLength(this.selectedWardNo).then((lengthList: any) => {
        if (lengthList != null) {
          this.wardLineLengthList = JSON.parse(lengthList);
        }
      });
    }
  }

  setReportHeader() {
    if (this.selectedRouteNo != "0") {
      let routeDetail = this.routeMainList.find(item => item.routeKey == this.selectedRouteNo);
      if (routeDetail != undefined) {
        this.reportData.zoneName = "Ward " + this.selectedWardNo + " [" + routeDetail.routeName + "]";
      }
      else {
        this.reportData.zoneName = "Ward " + this.selectedWardNo;
      }
    }
    else {
      if (this.selectedWardNo != "0") {
        this.reportData.zoneName = "Ward " + this.selectedWardNo;
      }
      else {
        this.reportData.zoneName = "---";
      }
    }
  }

  getRoute() {
    this.routeMainList = [];
    this.routeList = [];
    if (this.selectedWardNo != "0") {
      let dbPath = this.routePath + this.selectedWardNo;
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
                    let endDate = this.commonService.setTodayDate();
                    if (routeObject[key]["endDate"] != null) {
                      endDate = routeObject[key]["endDate"];
                    }
                    let routeLines = [];
                    if (routeObject[key]["routeLines"] != null) {
                      let list = routeObject[key]["routeLines"].split(',');
                      if (list.length > 0) {
                        for (let k = 0; k < list.length; k++) {
                          routeLines.push({ lineNo: list[k], isDone: 0 });
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
  }

  getRouteList() {
    this.routeList=[];
    if (this.routeMainList.length > 0) {
      let selectedDate = new Date(this.selectedDate);
      for (let i = 0; i < this.routeMainList.length; i++) {
        let startDate = new Date(this.routeMainList[i]["startDate"]);
        let endDate = new Date(this.routeMainList[i]["endDate"]);
        if (selectedDate >= startDate && selectedDate <= endDate) {
          if (this.routeMainList[i]["routeLines"].length > 0) {
            this.routeList.push({ routeKey: this.routeMainList[i]["routeKey"], routeName: this.routeMainList[i]["routeName"], key: this.routeMainList[i]["key"], routeLines: this.routeMainList[i]["routeLines"] });
          }
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
    this.getRouteList();
    this.changeRouteSelection("0");
  }

  resetAll() {
    this.reportData.reportDate = this.selectedDate;
    this.percentage = 0;
    this.reportData.coveredLength = "0.000";
    this.reportData.vehicleNo = "---";
    this.reportData.wardLength = "0.000";
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != null) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    this.lines = [];
    if (this.chart != null) {
      this.chart.destroy();
    }
  }

  getAllLinesFromJson() {
    if (this.selectedWardNo != "0") {
      this.httpService.get(this.wardLinesPath + + this.selectedWardNo + ".json").subscribe(data => {
        if (data != null) {
          let routeLines = [];
          var keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              this.wardLines = keyArray.length;
              let lineNo = keyArray[i];
              let routeDetail = this.routeList.find(item => item.routeKey == this.selectedRouteNo);
              if (routeDetail != undefined) {
                routeLines = routeDetail.routeLines;
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
                        this.plotLineOnMap(lineNo, latLng, i - 1, this.selectedWardNo, routeLines);
                      }
                    }
                  }
                }
              }
            }
          }
          setTimeout(() => {
            this.getSummary(routeLines);
          }, 1000);
        }
      });
    }
  }

  plotLineOnMap(lineNo: any, latlngs: any, i: any, wardNo: any, routeLines: any) {
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split('-')[0];
    let dbPathLineStatus = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
      lineStatus.unsubscribe();
      let strockColor = "#fa0505";
      if (status != null) {
        strockColor = "#0ba118";
        let lineDetail = routeLines.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          lineDetail.isDone = 1;
        }
      }
      else {
        let lineDetail = routeLines.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          lineDetail.isDone = 0;
        }
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

  getSummary(routeLines: any) {
    if (routeLines.length > 0) {
      let totalLength = 0;
      let coveredLength = 0;
      for (let i = 0; i < routeLines.length; i++) {
        let lineNo = routeLines[i]["lineNo"];
        let isDone = routeLines[i]["isDone"];
        let lengthDetail = this.wardLineLengthList.find(item => item.lineNo == lineNo);
        if (lengthDetail != undefined) {
          totalLength = totalLength + Number(lengthDetail.length);
          if (isDone == 1) {
            coveredLength = coveredLength + Number(lengthDetail.length);
          }
        }
      }
      this.reportData.wardLength = (parseFloat(totalLength.toString()) / 1000).toFixed(3);
      this.reportData.coveredLength = (parseFloat(coveredLength.toString()) / 1000).toFixed(3) + "";
      this.percentage = Number(((coveredLength / totalLength) * 100).toFixed(2));
      this.drawChart();
    }
  }

  drawChart() {
    let pending = 100 - Number(this.percentage);
    this.chart = new CanvasJS.Chart("chartContainer", {
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
    this.chart.render();
  }
}

export class ReportData {
  zoneName: string;
  reportDate: string;
  vehicleNo: string;
  wardLength: string;
  coveredLength: string;
}
