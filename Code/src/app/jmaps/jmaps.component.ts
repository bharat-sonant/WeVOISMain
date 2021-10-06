
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
  vehicleList: any[];
  circleList: any[];
  progressData: progressDetail = {
    totalWardLength: 0,
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
    this.selectedDate = this.commonService.getPreviousDate(this.toDayDate, 1);
    this.commonService.getCircleWiseWard().then((circleList: any) => {
      this.circleList = JSON.parse(circleList);
    });
    $("#txtDate").val(this.selectedDate);
    this.setHeight();
    this.setMaps();
    this.lines = [];
    this.polylines = [];
    this.wardLineNoMarker = [];
    this.vehicleList = [];
  }

  changeCircleSelection(filterVal: any) {
    this.selectedZone = 0;
    this.resetAll();
    this.zoneList = [];
    let circleDetail = this.circleList.find(item => item.circleName == filterVal);
    if (circleDetail != undefined) {
      let zoneList = circleDetail.wardList;
      for (let i = 1; i < zoneList.length; i++) {
        this.zoneList.push({ zoneNo: zoneList[i], zoneName: "Ward " + zoneList[i] });
      }
    }
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  resetAll() {
    $('#showBoundries').html("Show Boundaries");
    this.progressData.coveredLength = "0";
    this.progressData.wardLength = "0";
    this.progressData.workPercentage = "0%";
    $('#txtPenalty').val("0");
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
    this.vehicleList = [];
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
      let previousDate = this.commonService.getPreviousDate($("#txtDate").val(), 1);
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
        if (workerData["vehicles"] != null) {
          let vechileList = workerData["vehicles"].split(',');
          if (vechileList.length > 0) {
            for (let i = 0; i < vechileList.length; i++) {
              this.vehicleList.push({ vehicle: vechileList[i] });
            }
          }
        }
        if (workerData["penalty"] != null) {
          $('#txtPenalty').val(workerData["penalty"]);
        }
      }
      this.getAllLinesFromJson();
    });
  }

  getAllLinesFromJson() {
    //this.zoneKML = this.commonService.setKML(this.selectedZone, this.map);
    this.httpService.get("../../assets/jsons/JaipurGreater/" + this.selectedZone + ".json").subscribe(data => {
      if (data != null) {
        var keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            this.wardLines = keyArray.length;
            let lineNo = keyArray[i];
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
                  this.plotLineOnMap(lineNo, latLng, i - 1, this.selectedZone);
                }
              }
            }
          }
        }
      }
    }, err => {
      let wardLineCount = this.db.object("WardLines/" + this.selectedZone + "").valueChanges().subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          this.wardLines = Number(lineCount);
          for (let i = 1; i <= Number(this.wardLines); i++) {
            let dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + i + "/points";
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
                  color: "#fa0505",
                });
                this.plotLineOnMap(i, latLng, i - 1, this.selectedZone);
              }
            });
          }
        }
      });
    });
  }

  resetAllLines() {
    if (this.lines.length > 0) {
      for (let j = 0; j < this.lines.length; j++) {
        let line = new google.maps.Polyline(this.polylines[j]);
        var polyOptions = {
          strokeColor: "#fa0505",
          strokeOpacity: 1.0,
          strokeWeight: this.strokeWeight
        }
        line.setOptions(polyOptions);
        let lineNo = this.lines[j]["lineNo"];
        let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
        let dbPath2 = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Time";
        this.db.database.ref(dbPath).set(null);
        this.db.database.ref(dbPath2).set(null);
      }      
      
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.database.ref(dbPath).set(null);
      this.progressData.coveredLength = "0";
      this.progressData.workPercentage = 0 + "%";
    }
  }


  selectAll() {
    if (this.lines.length > 0) {
      let dist = 0;
      for (let j = 0; j < this.lines.length; j++) {
        let line = new google.maps.Polyline(this.polylines[j]);
        var polyOptions = {
          strokeColor: "#28a745",
          strokeOpacity: 1.0,
          strokeWeight: this.strokeWeight
        }
        line.setOptions(polyOptions);
        let latlngs = this.lines[j]["latlng"];

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

        let lineNo = this.lines[j]["lineNo"];
        let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
        let dbPath2 = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Time";
        this.db.database.ref(dbPath).set("LineCompleted");
        this.db.database.ref(dbPath2).set(time);

      }

      let wardCoveredDistance = dist;
      let completedLines = this.lines.length - 1;
      let workPercentage = 0;
      workPercentage = Math.round((wardCoveredDistance * 100) / this.progressData.totalWardLength);

      let userid = localStorage.getItem("userID");
      const data1 = {
        userid: userid,
        completedLines: completedLines,
        wardCoveredDistance: wardCoveredDistance.toFixed(0),
        workPercentage: workPercentage
      }
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.object(dbPath).update(data1);
      this.progressData.coveredLength = (parseFloat(wardCoveredDistance.toString()) / 1000).toFixed(2);
      this.progressData.workPercentage = workPercentage + "%";
    }
  }

  plotLineOnMap(lineNo: any, latlngs: any, i: any, wardNo: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
      lineStatus.unsubscribe();
      let strockColor="#fa0505";
      if(status=="LineCompleted"){
        strockColor="#28a745";
      }
      let line = new google.maps.Polyline({
        path: latlngs,
        strokeColor: strockColor,
        strokeWeight: this.strokeWeight,
      });
      this.polylines[i] = line;
      this.polylines[i].setMap(this.map);
      let progresData = this.progressData;
      let dbEvent = this.db;
      let wardLines = this.wardLines;
      let totalWardLength = this.progressData.totalWardLength;
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

        let stockColor = "#fa0505";
        let isNew = true;

        let statusInstance = dbEvent.object(dbPath).valueChanges().subscribe(
          status => {
            statusInstance.unsubscribe();
            if (status == null) {
              isNew = true;
              dbEvent.database.ref(dbPath).set("LineCompleted");
              dbEvent.database.ref(dbPath2).set(time);
              stockColor = "#28a745";
            }
            else {
              isNew = false;
              dbEvent.database.ref(dbPath).set(null);
              dbEvent.database.ref(dbPath2).set(null);
              stockColor = "#fa0505";
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
                  workPercentage = Math.round((wardCoveredDistance * 100) / totalWardLength);
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

  getWardTotalLength() {
    this.commonService.getWardTotalLength(this.selectedZone).then((totalLength) => {
      if (totalLength != null) {
        this.progressData.wardLength = (parseFloat(totalLength.toString()) / 1000).toFixed(2);
        this.progressData.totalWardLength = Number(totalLength);
      }
      else {
        this.progressData.wardLength = "0.00";
        this.progressData.totalWardLength = 0;
      }
    });
  }

  addVehicle() {
    if (this.selectedZone == "0" || this.selectedZone == null) {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if ($('#txtVehicle').val() == "") {
      this.commonService.setAlertMessage("error", "Please enter vehicle no. !!!");
      return;
    }
    let vehicleNo = $('#txtVehicle').val();
    let vehicles = "";
    this.vehicleList.push({ vehicle: vehicleNo });
    if (this.vehicleList != null) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        if (i == 0) {
          vehicles = this.vehicleList[i]["vehicle"];
        }
        else {
          vehicles = vehicles + "," + this.vehicleList[i]["vehicle"];
        }
      }
    }
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vehicles: vehicles });
    $('#txtVehicle').val("");
    this.commonService.setAlertMessage("success", "Vehicle add successfully !!!");
  }

  removeVehicle(index: any) {
    let vehicleList = [];
    let vehicles = "";
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (i != index) {
        vehicleList.push({ vehicle: this.vehicleList[i]["vehicle"] });
        if (vehicles != "") { vehicles = vehicles + "," }
        vehicles = this.vehicleList[i]["vehicle"];
      }
    }
    this.vehicleList = vehicleList;
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vehicles: vehicles });
    this.commonService.setAlertMessage("success", "Vehicle deleted successfully !!!");
  }

  saveDone() {
    let penalty = $('#txtPenalty').val();
    if (penalty == "") {
      penalty = 0;
    }
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vtsDone: "yes" });
    this.db.object(dbPath).update({ userid: localStorage.getItem("userID") });
    this.db.object(dbPath).update({ penalty: penalty });
  }

}

export class progressDetail {
  totalWardLength: number;
  wardLength: string;
  coveredLength: string;
  workPercentage: string;
  coveredLengthMeter: number;
  workPercentageNumber: number;
  completedLines: number;
}
