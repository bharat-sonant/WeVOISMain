'use strict';

/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';
import { AngularFireDatabase } from 'angularfire2/database';
import { ToastrService } from 'ngx-toastr';
//services
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';

import * as CanvasJS from '../../../assets/canvasjs.min';
import * as html2canvas from "html2canvas";
import * as jspdf from "jspdf";
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-monitoring',
  templateUrl: './ward-monitoring.component.html',
  styleUrls: ['./ward-monitoring.component.scss']
})

export class WardMonitoringComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  index: any;
  studentDetail: any;
  zoneList: any[];
  reportData: ReportData =
    {
      zoneName: "--",
      reportDate: "--",
      driverName: "--",
      helperName: "--",
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
  activeZone: any;
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

  constructor(public fs: FirebaseService, private mapService: MapService, private commonService: CommonService, private httpService: HttpClient, private toastr: ToastrService) { }

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
    this.selectedZoneNo = "0";
    this.activeZone = "0";
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

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
    this.selectedZoneNo = $('#ddlZone').val();
    this.activeZone = $('#ddlZone').val();
    this.selectedZoneName = "Ward " + $('#ddlZone').val();
    this.showReport();
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZoneNo = filterVal;
    this.selectedZoneName = "Ward " + filterVal;
    this.showReport();
  }

  showReport() {
    this.skipCount = 0;
    this.completeCount = 0;
    this.totalLineCount = 0;
    this.partailDoneCount = 0;
    let isFormValid = true;
    let msg: string;
    this.bounds = new google.maps.LatLngBounds();
    /*
    this.selectedDate = "2019-07-12";
    this.selectedZoneNo = "28"
    */
    if (this.selectedDate == undefined) {
      isFormValid = false;
      msg = "Please select date.";
    } else if (this.selectedZoneNo == undefined) {
      isFormValid = false;
      msg = "Please select ward.";
    }

    if (isFormValid) {
      document.getElementById('btnDownload')["disabled"] = true;
      this.selectedZone = this.selectedZoneNo;
      this.polylines = [];
      this.setMap();
      this.setKml();
      this.getWardLines();
    } else {
      let errorMsg = '<span class="now-ui-icons ui-1_bell-53"></span> ' + msg;
      this.toastr.error(errorMsg, '', { timeOut: 5000, enableHtml: true, closeButton: true, toastClass: "alert alert-danger alert-with-icon", positionClass: 'toast-bottom-left' });
    }

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


  getWardLines() {
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/mapReference";

    let lineMapRefrenceInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        if (data != null) {
          lineMapRefrenceInstance.unsubscribe();
          this.mapRefrence = data.toString();
          dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + this.mapRefrence + "/totalLines";

          let wardLineCount = this.db.object(dbPath).valueChanges().subscribe((lineCount) => {
            wardLineCount.unsubscribe();
            if (lineCount != null) {
              this.wardLines = Number(lineCount);
              this.drawZoneAllLines();
            }
          });
        }
        else {
          this.mapRefrence = "";
          let wardLineCount = this.db.object("WardLines/" + this.selectedZone + "").valueChanges().subscribe((lineCount) => {
            wardLineCount.unsubscribe();
            if (lineCount != null) {
              this.wardLines = Number(lineCount);
              this.drawZoneAllLines();
            }
          });
        }
      }
    );
  }

  drawZoneAllLines() {
    //this.httpService.get('../assets/jsons/' + this.selectedZone + '.json').forEach(
    let dbPath = "Defaults/WardLines/" + this.selectedZone;
    if (this.mapRefrence != "") {
      dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + this.mapRefrence;
    }
    let wardLines = this.db.object(dbPath).valueChanges().subscribe(
      zoneLine => {
        wardLines.unsubscribe();
        var linePath = [];
        for (let i = 1; i < this.wardLines; i++) {

          var line = zoneLine[i];
          if (line == undefined) { break; }
          var path = [];
          for (let j = 0; j < line.points.length; j++) {
            path.push({ lat: line.points[j][0], lng: line.points[j][1] });
            this.bounds.extend({ lat: line.points[j][0], lng: line.points[j][1] });
          }

          linePath.push({ lineNo: i, latlng: path, color: "#87CEFA" });
        }

        this.allLines = linePath;
        this.drawRealTimePloylines();
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
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split('-')[0];

    if (new Date(this.selectedDate) < new Date("2019-08-01")) {
      let VehicleDataPath = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectedDate + '/DriverData';
      let driverInfo = this.db.object(VehicleDataPath).valueChanges().subscribe(
        vehiclesData => {

          // Set Driver details
          this.reportData.driverName = vehiclesData != null ? vehiclesData["dName"] : "Not Assigned";
          this.reportData.vehicleNo = vehiclesData != null ? vehiclesData["vNo"] : "Not Assigned";

          driverInfo.unsubscribe();

          let ReaderDataPath = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectedDate + '/ReaderData';
          let readerInfo = this.db.object(ReaderDataPath).valueChanges().subscribe(
            readerData => {

              // Set Driver helper Details
              this.reportData.helperName = readerData != null ? readerData["dName"] : "Not Assigned";

              readerInfo.unsubscribe();

            });

          this.reportData.zoneName = this.selectedZoneName;
          this.reportData.reportDate = this.selectedDate;

          this.drawChart();
        });
    } else {
      let workDetailsPath = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectedDate + '/WorkerDetails';

      let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe(
        workerData => {
          workDetails.unsubscribe();
          if (workerData != null) {
            this.reportData.driverName = workerData != null ? (workerData["driverName"]).toUpperCase() : "Not Assigned";
            this.reportData.helperName = workerData != null ? (workerData["helperName"]).toUpperCase() : "Not Assigned";
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

  downloadReport() {

    var element = document.getElementById("divReport");


    /*
    html2canvas(document.querySelector("#divRptRight")).then(canvas => {
      //document.body.appendChild(canvas)
      //document.getElementById("image1")["src"] = canvas.toDataURL("image/png");
    });
    */
    /*
    var screenshot = {};
        html2canvas(document.getElementById('divReport'), {
            useCORS: true,
            optimized: false,
            allowTaint: false,
            onrendered: function (canvas) {
    
               
                var tempcanvas=document.createElement('canvas');
                tempcanvas.width=1350;
                tempcanvas.height=700;
                var context=tempcanvas.getContext('2d');
                context.drawImage(canvas,0,0,1350,700,0,0,1350,700);
                var link=document.createElement("a");
                //link.href=tempcanvas.toDataURL('image/jpg');   //function blocks CORS
                //link.download = 'screenshot.jpg';
                //link.click();
                document.getElementById("image1")["src"] = tempcanvas.toDataURL("image/png");
            }
        });*/


    /*
        html2canvas(element, {
          useCORS: true,
          onrendered: function (canvas) {
            var dataUrl = canvas.toDataURL("image/png");
    
            // DO SOMETHING WITH THE DATAURL
            // Eg. write it to the page
            //document.write('<img src="' + dataUrl + '"/>');
            document.getElementById("image1")["src"] = dataUrl;
          }
        });
    */

    /*
        html2canvas(data, {
          useCORS: true,
          allowTaint: false,
          scale: 3,
          backgroundColor: null
        }).then(function (canvas) {
          var imgWidth = 208;
          //var pageHeight = 295;
          var imgHeight = canvas.height * imgWidth / canvas.width;
          //var heightLeft = imgHeight;
    
          const contentDataURL = canvas.toDataURL('image/png');
          //document.getElementById("image").src=contentDataURL;
    
          let pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF  
          var position = 0;
          pdf.addImage(contentDataURL, 'jpeg', 0, position, imgWidth, imgHeight)
          pdf.save('report.pdf'); // Generated PDF
        });
    */
    //FIX
    /*
    
    var transform = jQuery("#divReport .gm-style>div:first>div").css("transform");
    var comp = transform.split(","); //split up the transform matrix
    var mapleft = parseFloat(comp[4]); //get left value
    var maptop = parseFloat(comp[5]); //get top value
    
    jQuery("#divReport .gm-style>div:first>div:first>div:nth-child(2)>div:first>div").css({ //get the map container. not sure if stable
      "transform": "none",
      "left": 250,
      "top": 290,
    });*/
    //html2canvas(data).then(canvas => {
    // Few necessary setting options 
    //document.getElementById('.gm-style>div:first')[0]
    //document.getElementsByClassName('.gm-style>div:first')
    //var data = document.getElementById('divReport');
    var data = document.getElementById('divReport');

    html2canvas(document.querySelector('.gm-style'),
      { useCORS: true, allowTaint: false, async: false }).then(canvas => {

        // document.getElementById("myDiv").appendChild(canvas);

        //var image = new Image();
        // image.crossOrigin = "Anonymous";
        //image.src = canvas.toDataURL("image/png");
        // document.getElementById("myImg") .src = canvas.toDataURL("image/png");
        //document.getElementById('image').src = 'http://yourImagePathHere';
        //document.getElementById("myImg").src
        //(<HTMLImageElement>document.querySelector(".mapimg")).src =canvas.toDataURL("image/png");
        //document.getElementById("myDiv").appendChild(image);
        document.getElementById('myImg').setAttribute('src', canvas.toDataURL("image/png"));
        //const contentDataURL = canvas.toDataURL('image/png');
        //$("#myDiv").append(canvas);
        //$('#myDiv').append('bharat');
        //document.body.appendChild(canvas);              
      });

    /*
    jQuery("#divRptRight .gm-style>div").css({ //get the map container. not sure if stable
      "transform": "none",
      "left": 0,
      "top": 0,
    });
    */

    setTimeout(() => {


      var data = document.getElementById('myDiv');
      //html2canvas(document.querySelector('.gm-style'), {
      html2canvas(data, {
        useCORS: true,
        allowTaint: false,
        // scale: 3,
      }).then(function (canvas) {

        var imgWidth = 285;
        //var pageHeight = 295;
        var imgHeight = canvas.height * imgWidth / canvas.width;
        //var heightLeft = imgHeight;

        const contentDataURL = canvas.toDataURL('image/png');
        //document.getElementById("image1")["src"] = contentDataURL;

        let pdf = new jspdf('l', 'mm', 'a4'); // A4 size page of PDF  
        var position = 0;
        pdf.addImage(contentDataURL, 'jpeg', 0, position, imgWidth, imgHeight)
        //pdf.save(this.selectedZoneName + ' [' + this.selectedDate + ']'); // Generated PDF  
        pdf.save('report'); // Generated PDF   
      });
    }, 5000);

  }


  setNextDate() {
    let currentDate = $('#txtDate').val();
    let nextDate = this.commonService.getNextDate(currentDate, 1);
    $('#txtDate').val(nextDate);
    this.selectedDate = nextDate;
    this.selectedZoneNo = $('#ddlZone').val();
    this.activeZone = $('#ddlZone').val();
    this.selectedZoneName = "Ward " + $('#ddlZone').val();
    this.showReport();
  }
  setPreviousDate() {

    let currentDate = $('#txtDate').val();
    let previousDate = this.commonService.getPreviousDate(currentDate, 1);
    $('#txtDate').val(previousDate);
    this.selectedDate = previousDate;
    this.selectedZoneNo = $('#ddlZone').val();
    this.activeZone = $('#ddlZone').val();
    this.selectedZoneName = "Ward " + $('#ddlZone').val();
    this.showReport();
  }

}

export class ReportData {
  zoneName: string;
  reportDate: string;
  driverName: string;
  helperName: string;
  vehicleNo: string;
}
