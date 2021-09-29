
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
  workerDetails: any;
  mapRefrence: any;
  wardLines: any;
  lines: any[];
  polylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  wardLineNoMarker: any[];
  centerPoint: any;
  zoneKML: any;
  strokeWeight = 7;
  progressData: progressDetail = {
    wardLength: "0",
    coveredLength: "0",
    workPercentage: "0%",
    coveredLengthMeter: 0,
    workPercentageNumber: 0,
    completedLines: 0
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
    this.polylines = [];
    this.wardLineNoMarker = [];

  }

  resetAll() {
    $('#showBoundries').html("Show Boundaries");
    this.progressData.coveredLength = "0";
    this.progressData.wardLength = "0";
    this.progressData.workPercentage = "0%";
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

    let workerDetailsdbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    let workerDetails = this.db.object(workerDetailsdbPath).valueChanges().subscribe((workerData) => {
      workerDetails.unsubscribe();
      if (workerData != null) {
        if (workerData["workPercentage"] != null) {
          this.progressData.workPercentageNumber = Number(workerData["workPercentage"]);
          this.progressData.workPercentage = workerData["workPercentage"] + "%";
        } else {
          this.progressData.workPercentage = "0%";
          this.progressData.workPercentageNumber = 0;

        }
        if (workerData["wardCoveredDistance"] != null) {
          this.progressData.coveredLengthMeter = Number(workerData["wardCoveredDistance"]);
          this.progressData.coveredLength = (parseFloat(workerData["wardCoveredDistance"]) / 1000).toFixed(2);
        } else {
          this.progressData.coveredLength = "0.00";
          this.progressData.coveredLengthMeter = 0;
        }

        if (workerData["completedLines"] != null) {
          this.progressData.completedLines = Number(workerData["completedLines"]);
        } else {
          this.progressData.completedLines = 0;
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
    this.httpService.get("../../assets/jsons/ward-" + this.selectedZone + "-2021-09-28.json").subscribe(data => {
      if (data != null) {
        var keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 1; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            if (data[lineNo] != null) {
              var latLng = [];
              for (let j = 0; j < data[lineNo]["points"].length; j++) {
                latLng.push({ lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1] });
              }
              this.lines.push({
                lineNo: i,
                latlng: latLng,
                color: "#87CEFA",
              });
              this.plotLineOnMap(i, latLng, i - 1, this.selectedZone);
            }
          }
        }
      }
    });
    /*
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
        */
  }

  plotLineOnMap(lineNo: any, latlngs: any, i: any, wardNo: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
      lineStatus.unsubscribe();
      let line = new google.maps.Polyline({
        path: latlngs,
        strokeColor: this.commonService.getLineColor(status),
        strokeWeight: this.strokeWeight,
      });
      this.polylines[i] = line;
      this.polylines[i].setMap(this.map);
      let progresData = this.progressData;
      let dbEvent = this.db;
      let wardLines = this.wardLines;
      let strokeWeight = this.strokeWeight;
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
      let dbPath2 = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Time";
      let dbPathSummary = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      google.maps.event.addListener(line, 'click', function (h) {

        let dist = 0;
        for (let i = latlngs.length - 1; i > 0; i--) {
          let lat1 = latlngs[i]["lat"];
          let lon1 = latlngs[i]["lng"];
          let lat2 = latlngs[i - 1]["lat"];
          let lon2 = latlngs[i - 1]["lng"];

          const R = 6377830; // metres
          const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
          const φ2 = lat2 * Math.PI / 180;
          const Δφ = (lat2 - lat1) * Math.PI / 180;
          const Δλ = (lon2 - lon1) * Math.PI / 180;

          const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          dist = dist + (R * c);

        }

        let date = new Date();
        let hour = date.getHours();
        let min = date.getMinutes();
        let second = date.getSeconds();
        let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;


        // alert(dist);

        let stockColor = "#60c2ff";
        let isNew = true;

        let statusInstance = dbEvent.object(dbPath).valueChanges().subscribe(
          status => {
            statusInstance.unsubscribe();
            if (status == null) {
              isNew = true;
              dbEvent.database.ref(dbPath).set("LineCompleted");
              dbEvent.database.ref(dbPath2).set(time);
              stockColor = "#00f645";
            }
            else {
              isNew = false;
              dbEvent.database.ref(dbPath).set(null);
              dbEvent.database.ref(dbPath2).set(null);
              stockColor = "#60c2ff";
            }
            var polyOptions = {
              strokeColor: stockColor,
              strokeOpacity: 1.0,
              strokeWeight: strokeWeight
            }
            let summaryInstance = dbEvent.object(dbPathSummary).valueChanges().subscribe(
              data => {
                summaryInstance.unsubscribe();
                let wardCoveredDistance = dist;
                let completedLines = 1;
                let workPercentage = 0;
                if (data == null) {
                  workPercentage = Math.round((completedLines * 100) / wardLines);
                }
                else {
                  if (isNew == true) {
                    if (data["completedLines"] != null) {
                      completedLines = Number(data["completedLines"]) + completedLines;
                    }
                    if (data["wardCoveredDistance"] != null) {
                      wardCoveredDistance = Number(data["wardCoveredDistance"]) + wardCoveredDistance;
                    }
                  }
                  else {
                    if (data["completedLines"] != null) {
                      completedLines = Number(data["completedLines"]) - completedLines;
                    }
                    if (data["wardCoveredDistance"] != null) {
                      wardCoveredDistance = Number(data["wardCoveredDistance"]) - wardCoveredDistance;
                    }
                  }
                  workPercentage = Math.round((completedLines * 100) / wardLines);
                }
                progresData.coveredLength = (parseFloat(wardCoveredDistance.toString()) / 1000).toFixed(2);
                progresData.workPercentage = workPercentage + "%";
                let userid = localStorage.getItem("userID");
                const data1 = {
                  userid: userid,
                  completedLines: completedLines,
                  wardCoveredDistance: wardCoveredDistance.toFixed(0),
                  workPercentage: workPercentage
                }
                dbEvent.object(dbPathSummary).update(data1);
              }
            );
            line.setOptions(polyOptions);
          }
        );
      });
/*
      let lat = latlngs[0]["lat"];
      let lng = latlngs[0]["lng"];
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
      */
      setTimeout(() => {
        this.centerPoint = this.lines[0]["latlng"][0];
        this.map.setZoom(17);
        this.map.setCenter(this.centerPoint);
      }, 200);

    });
  }


  getNextPrevious(type: any) {
    let strokeWeight = $("#txtStrokeWeight").val();
    if (strokeWeight == "") {
      this.commonService.setAlertMessage("error", "Please enter stroke weight. !!!");
      return;
    }
    if (type == "pre") {
      if (strokeWeight != "1") {
        this.strokeWeight = Number(strokeWeight) - 1;
        $("#txtStrokeWeight").val(this.strokeWeight);
        this.setStrokeWeight();
      }
    } else if (type == "next") {

      this.strokeWeight = Number(strokeWeight) + 1;
      $("#txtStrokeWeight").val(this.strokeWeight);
      this.setStrokeWeight();
    }
  }

  setStrokeWeight() {
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          let line = this.polylines[i];
          var polyOptions = {
            strokeColor: this.polylines[i]["strokeColor"],
            strokeOpacity: 1.0,
            strokeWeight: this.strokeWeight
          }
          line.setOptions(polyOptions);
        }
      }
    }
  }


  getCurrentStrokeWeight(event: any) {
    if (event.key == "Enter") {
      let strokeWeight = $("#txtLineNo").val();
      if (strokeWeight == "") {
        this.commonService.setAlertMessage("error", "Please enter line no. !!!");
        return;
      }
      this.strokeWeight = Number(strokeWeight);
      $("#txtLineNo").val(this.strokeWeight);
      this.setStrokeWeight();
    }
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
    this.setStrokeWeight();
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
  coveredLengthMeter: number;
  workPercentageNumber: number;
  completedLines: number;
}
