
/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-jmaps',
  templateUrl: './jmaps.component.html',
  styleUrls: ['./jmaps.component.scss']
})
export class JmapsComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private actRoute: ActivatedRoute, private mapService: MapService, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  cityName: any;
  toDayDate: any;
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;
  lastLineInstance: any;
  workerDetails: any;
  mapRefrence: any;
  wardLines: any;
  lines: any[];
  wardLineInstanceList: any[];
  polylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  wardLineNoMarker: any[];
  centerPoint: any;
  zoneKML: any;

  progressData: progressDetail = {
    wardLength: "0",
    coveredLength: "0",
    workPercentage: "0%"
  };

  ngOnInit() {
    this.setDefault();
  }

  setDefault() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.toDayDate);
    this.setHeight();
    this.getZones();
    this.map = this.commonService.setMap(this.gmap);
    this.lines = [];
    this.wardLineInstanceList = [];
    this.polylines = [];
    this.wardLineNoMarker = [];
  }

  resetAll() {
    $('#showBoundries').html("Show Boundaries");
    this.progressData.coveredLength = "0";
    this.progressData.wardLength = "0";
    this.progressData.workPercentage = "0%";
    if (this.wardLineInstanceList.length > 0) {
      for (let i = 0; i < this.wardLineInstanceList.length; i++) {
        this.wardLineInstanceList[i]["lineStatus"].unsubscribe();
      }
    }
    this.wardLineInstanceList = [];
    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
      this.zoneKML = null;
    }

    if (this.wardLineNoMarker.length > 0) {
      for (let i = 0; i < this.wardLineNoMarker.length; i++) {
        this.wardLineNoMarker[i]["marker"].setMap(null);
      }
    }
    this.wardLineNoMarker = [];
    if (this.marker != null) {
      this.marker.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    this.lines = [];
  }


  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.selectedZone = filterVal;
    this.getWardData();
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
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.getWardData();
  }


  getWardData() {

    this.resetAll();
    this.getWardLines();
    this.getProgressDetail();
    this.getWardTotalLength();
  }


  getProgressDetail() {
    if (this.lastLineInstance != null) {
      this.lastLineInstance.unsubscribe();
    }
    if (this.workerDetails != null) {
      this.workerDetails.unsubscribe();
    }
    let workerDetailsdbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.workerDetails = this.db.object(workerDetailsdbPath).valueChanges().subscribe((workerData) => {
      if (workerData != null) {
        if (workerData["workPercentage"] != null) {
          this.progressData.workPercentage = workerData["workPercentage"] + "%";
        } else {
          this.progressData.workPercentage = "0%";
        }
        if (workerData["wardCoveredDistance"] != null) {
          this.progressData.coveredLength = (parseFloat(workerData["wardCoveredDistance"]) / 1000).toFixed(2);
        } else {
          this.progressData.coveredLength = "0.00";
        }
      }
    });
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
              this.getAllLinesFromJson();
            }
          });
        }
        else {
          this.mapRefrence = "";
          let wardLineCount = this.db.object("WardLines/" + this.selectedZone + "").valueChanges().subscribe((lineCount) => {
            wardLineCount.unsubscribe();
            if (lineCount != null) {
              this.wardLines = Number(lineCount);
              this.getAllLinesFromJson();
            }
          });
        }
      }
    );
  }


  getAllLinesFromJson() {
    for (let i = 1; i <= Number(this.wardLines); i++) {
      let dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + i + "/points";
      if (this.mapRefrence != "") {
        dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + this.mapRefrence + "/" + i + "/points";
      }
      let wardLines = this.db.list(dbPath).valueChanges().subscribe((zoneData) => {
        wardLines.unsubscribe();
        if (zoneData.length > 0) {
          let lineData = zoneData;
          var latLng = [];
          for (let j = 0; j < lineData.length; j++) {
            latLng.push({ lat: lineData[j][0], lng: lineData[j][1] });
          }
          this.lines.push({
            lineNo: i,
            latlng: latLng,
            color: "#87CEFA",
          });
          this.plotLineOnMap(i, latLng, i - 1, this.selectedZone);
        }
      });
    }
  }



  plotLineOnMap(lineNo: any, latlng: any, i: any, wardNo: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
      //lineStatus.unsubscribe();
      this.wardLineInstanceList.push({ lineStatus });
      if (this.selectedDate != this.toDayDate) {
        lineStatus.unsubscribe();
      }
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: this.commonService.getLineColor(status),
        strokeWeight: 7,
      });
      this.polylines[i] = line;
      this.polylines[i].setMap(this.map);
      let dbEvent = this.db;
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
      google.maps.event.addListener(line, 'click', function (h) {
        var latlng = h.latLng;
        var needle = {
          minDistance: 9999999999, //silly high
          index: -1,
          latlng: null
        };
        let dist = 0;
        line.getPath().forEach(function (routePoint, index) {
          dist = google.maps.geometry.spherical.computeDistanceBetween(latlng, routePoint);
          if (dist < needle.minDistance) {
            needle.minDistance = dist;
            needle.index = index;
            needle.latlng = routePoint;
          }
        });

        //alert(dist);

        let stockColor = "#60c2ff";

        let statusInstance = dbEvent.object(dbPath).valueChanges().subscribe(
          status => {
            statusInstance.unsubscribe();
            if (status == null) {
              dbEvent.database.ref(dbPath).set("LineCompleted");
              stockColor = "#00f645";
            }
            else {
              dbEvent.database.ref(dbPath).set(null);
              stockColor = "#60c2ff";
            }
            var polyOptions = {
              strokeColor: stockColor,
              strokeOpacity: 1.0,
              strokeWeight: 7
            }
            line.setOptions(polyOptions);
          }
        );

      });

      let lat = latlng[0]["lat"];
      let lng = latlng[0]["lng"];
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
        icon: {
          url: this.invisibleImageUrl,
          fillOpacity: 1,
          strokeWeight: 0,
          scaledSize: new google.maps.Size(32, 40),
          origin: new google.maps.Point(0, 0),
        },
        label: {
          text: lineNo.toString(),
          color: "#000",
          fontSize: "10px",
          fontWeight: "bold",
        },
      });
      this.wardLineNoMarker.push({ marker });
      setTimeout(() => {
        this.centerPoint = this.lines[0]["latlng"][0];
        this.map.setZoom(17);
        this.map.setCenter(this.centerPoint);
      }, 200);

    });
  }

  showBounderis() {
    if ($('#showBoundries').html() == "Show Boundaries") {
      $('#showBoundries').html("Hide Boundaries");
      this.zoneKML = this.commonService.setKML(this.selectedZone, this.map);
    }
    else {
      $('#showBoundries').html("Show Boundaries");
      if (this.zoneKML != null) {
        this.zoneKML.setMap(null);
        this.zoneKML = null;
      }
    }
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  getZones() {
    return new Promise((resolve) => {
      this.zoneList = [];
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
      this.zoneList[0]["zoneName"] = "--Select Zone--";
      resolve(true);
    });
  }


  getWardTotalLength() {
    let wardLenghtPath = "WardRouteLength/" + this.selectedZone;
    let wardLengthDetails = this.db.object(wardLenghtPath).valueChanges().subscribe((wardLengthData) => {
      wardLengthDetails.unsubscribe();
      if (wardLengthData != null) {
        this.progressData.wardLength = (
          parseFloat(wardLengthData.toString()) / 1000
        ).toFixed(2);
      } else {
        this.progressData.wardLength = "0.00";
      }
    });
  }
}

export class progressDetail {
  wardLength: string;
  coveredLength: string;
  workPercentage: string;
}
