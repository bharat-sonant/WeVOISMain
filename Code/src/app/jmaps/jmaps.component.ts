/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import * as $ from "jquery";
import { ActivatedRoute } from "@angular/router";
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
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  public selectedWard: any;
  wardList: any[];
  marker = new google.maps.Marker();
  cityName: any;
  toDayDate: any;
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;
  wardLines: any;
  lines: any[];
  polylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  wardBoundary: any;
  strokeWeight = 4;
  vehicleList: any[];
  zoneList: any[];
  progressData: progressDetail = {
    totalWardLength: 0,
    wardLength: "0",
    coveredLength: "0",
    workPercentage: "0%",
    coveredLengthMeter: 0,
    workPercentageNumber: 0
  };

  ngOnInit() {
    this.setDefault();
  }

  setDefault() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.commonService.getPreviousDate(this.toDayDate, 1);
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
    $("#txtDate").val(this.selectedDate);
    $('#txtPreDate').val(this.selectedDate);
    this.setHeight();
    this.setMaps();
    this.lines = [];
    this.polylines = [];
    this.vehicleList = [];
    if(localStorage.getItem("strokeWeight")!=null)
    {
      this.strokeWeight=Number(localStorage.getItem("strokeWeight"));
      $('#txtStrokeWeight').val(this.strokeWeight);
    }
  }

  changeZoneSelection(filterVal: any) {
    this.selectedWard = 0;
    this.resetAll();
    this.wardList = [];
    let zoneDetail = this.zoneList.find(item => item.zoneName == filterVal);
    if (zoneDetail != undefined) {
      let wardList = zoneDetail.wardList;
      for (let i = 1; i < wardList.length; i++) {
        this.wardList.push({ wardNo: wardList[i], wardName: "Ward " + wardList[i] });
      }
    }
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  resetAll() {
    $('#showBoundries').html("Hide Boundaries");
    this.progressData.coveredLength = "0";
    this.progressData.wardLength = "0";
    this.progressData.workPercentage = "0%";
    $('#txtPenalty').val("0");
    if (this.wardBoundary != null) {
      this.wardBoundary.setMap(null);
    }
    this.wardBoundary = null;
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

  changeWardSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.selectedWard = filterVal;
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
    let workerDetailsdbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
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
    this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
      this.wardBoundary = wardKML;
    });

    this.httpService.get("../../assets/jsons/WardLines/" + this.cityName + "/" + this.selectedWard + ".json").subscribe(data => {
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
                  this.plotLineOnMap(lineNo, latLng, i - 1, this.selectedWard);
                }
              }
            }
          }
        }
      }
    });
  }

  setPreviousData() {
    let date = $('#txtPreDate').val().toString();
    if (date == "") {
      this.commonService.setAlertMessage("error", "Please select date !!!");
      return;
    }
    let monthName = this.commonService.getCurrentMonthName(new Date(date).getMonth());
    let year = date.split("-")[0];
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + year + "/" + monthName + "/" + date;
    let preDataInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        preDataInstance.unsubscribe();
        dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;
        this.db.object(dbPath).update(data);
        this.getWardData();
      });
      this.hideSetting();
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
        this.polylines[j]["strokeColor"] = "#fa0505";

        line.setOptions(polyOptions);
        let lineNo = this.lines[j]["lineNo"];
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
        this.db.database.ref(dbPath).set(null);
        dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Time";
        this.db.database.ref(dbPath).set(null);
      }

      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/";
      this.db.database.ref(dbPath).set(null);
      let date = new Date();
      let hour = date.getHours();
      let min = date.getMinutes();
      let second = date.getSeconds();
      let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;
      this.db.object(dbPath).update({ resetBy: localStorage.getItem("userID"), resetTime: time });
      this.progressData.coveredLength = "0";
      this.progressData.workPercentage = 0 + "%";
      this.closeModel();
    }

  }

  selectAll() {
    if (this.lines.length > 0) {
      let dist = 0;
      let lineLength = [];
      for (let j = 0; j < this.lines.length; j++) {
        let lineDistance = 0;
        let line = new google.maps.Polyline(this.polylines[j]);
        var polyOptions = {
          strokeColor: "#0ba118",
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
          lineDistance = lineDistance + (R * c);
        }
        let date = new Date();
        let hour = date.getHours();
        let min = date.getMinutes();
        let second = date.getSeconds();
        let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;

        let lineNo = this.lines[j]["lineNo"];
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
        let dbPath2 = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Time";
        this.db.database.ref(dbPath).set("LineCompleted");
        this.db.database.ref(dbPath2).set(time);
        console.log("lineNo: " + lineNo);
        console.log("length: " + lineDistance.toFixed(0));
        lineLength.push({ lineNo: lineNo, length: lineDistance.toFixed(0) });

      }
      console.log(lineLength);

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
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.object(dbPath).update(data1);
      this.progressData.coveredLength = (parseFloat(wardCoveredDistance.toString()) / 1000).toFixed(2);
      this.progressData.workPercentage = workPercentage + "%";
    }
    this.hideSetting();
  }

  plotLineOnMap(lineNo: any, latlngs: any, i: any, wardNo: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
      lineStatus.unsubscribe();
      let strockColor = "#fa0505";
      if (status == "LineCompleted") {
        strockColor = "#0ba118";
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
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
      let dbPathTime = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Time";
      let dbPathSummary = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
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

        let stockColor = "#fa0505";
        let isNew = true;

        let statusInstance = dbEvent.object(dbPath).valueChanges().subscribe(
          status => {
            statusInstance.unsubscribe();
            if (status == null) {
              isNew = true;
              dbEvent.database.ref(dbPath).set("LineCompleted");
              dbEvent.database.ref(dbPathTime).set(time);
              stockColor = "#0ba118";
            }
            else {
              isNew = false;
              dbEvent.database.ref(dbPath).set(null);
              dbEvent.database.ref(dbPathTime).set(null);
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
        localStorage.setItem("strokeWeight",this.strokeWeight.toFixed(0));
        this.setStrokeWeight();
      }
    } else if (type == "next") {
      this.strokeWeight = Number(strokeWeight) + 1;
      $("#txtStrokeWeight").val(this.strokeWeight);
      localStorage.setItem("strokeWeight",this.strokeWeight.toFixed(0));
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

  hideSetting() {
    let element = <HTMLElement>document.getElementById("collapsetwo");
    let className = element.className;
    $("#collapsetwo").removeClass(className);
    $("#collapsetwo").addClass("panel-collapse collapse in");
  }

  showBounderis() {
    if ($('#showBoundries').html() == "Show Boundaries") {
      $('#showBoundries').html("Hide Boundaries");
      this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
        this.wardBoundary = wardKML;
      });
    }
    else {
      $('#showBoundries').html("Show Boundaries");
      if (this.wardBoundary != null) {
        this.wardBoundary.setMap(null);
      }
      this.wardBoundary = null;
    }
    this.setStrokeWeight();
    this.hideSetting();
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  getWardTotalLength() {
    this.commonService.getWardTotalLength(this.selectedWard).then((totalLength) => {
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
    if (this.selectedWard == "0" || this.selectedWard == null) {
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
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vehicles: vehicles });
    $('#txtVehicle').val("");
    this.commonService.setAlertMessage("success", "Vehicle added successfully !!!");
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
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vehicles: vehicles });
    this.commonService.setAlertMessage("success", "Vehicle deleted successfully !!!");
  }

  saveVTSTrackingDone() {
    let penalty = $('#txtPenalty').val();
    if (penalty == "") {
      penalty = 0;
    }
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vtsDone: "yes", userid: localStorage.getItem("userID"), penalty: penalty });
    this.commonService.setAlertMessage("success", "VTS Tracking for ward " + this.selectedWard + " done !!!");
  }

  openModel(content: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let height = 145;
    let width = 350;
    let marginTop = "0px";
    marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
    $('div .modal-dialog-centered').css("margin-top", "26px");
  }

  closeModel() {
    this.modalService.dismissAll();
    this.hideSetting();
  }
}

export class progressDetail {
  totalWardLength: number;
  wardLength: string;
  coveredLength: string;
  workPercentage: string;
  coveredLengthMeter: number;
  workPercentageNumber: number;
}
