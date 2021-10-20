/// <reference types="@types/googlemaps" />

import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-jmaps',
  templateUrl: './jmaps.component.html',
  styleUrls: ['./jmaps.component.scss']
})
export class JmapsComponent implements OnInit {
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
  vtsPolylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  wardBoundary: any;
  strokeWeight = 4;
  vehicleList: any[];
  zoneList: any[];
  wardLineLengthList: any[];
  userId: any;
  isBoundaryShow = true;
  progressData: progressDetail = {
    totalWardLength: 0,
    wardLength: "0",
    coveredLength: "0",
    workPercentage: "0%",
    coveredLengthMeter: 0,
    workPercentageNumber: 0,
    penalty: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.commonService.getPreviousDate(this.toDayDate, 1);
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
    this.userId = localStorage.getItem("userID");
    $("#txtDate").val(this.selectedDate);
    $('#txtPreDate').val(this.selectedDate);
    $("#txtDateNav").val(this.selectedDate);
    $('#txtPreDateNav').val(this.selectedDate);
    this.setHeight();
    this.setMaps();
    this.lines = [];
    this.polylines = [];
    this.vtsPolylines = [];
    this.vehicleList = [];
    this.wardLineLengthList = [];
    this.selectedWard = "0";
    if (localStorage.getItem("strokeWeight") != null) {
      this.strokeWeight = Number(localStorage.getItem("strokeWeight"));
      $('#txtStrokeWeight').val(this.strokeWeight);
      $('#txtStrokeWeightNav').val(this.strokeWeight);
    }
    $('#iconDone').hide();
    $('#iconPending').show();
    $('#iconDoneNav').hide();
    $('#iconPendingNav').show();
  }

  changeZoneSelection(filterVal: any) {
    $('#ddlZone').val(filterVal);
    $('#ddlZoneNav').val(filterVal);
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
    this.isBoundaryShow = true;
    $('#showBoundries').html("Hide Boundaries");
    $('#iconDone').hide();
    $('#iconPending').show();
    $('#txtPenalty').val("0");
    $('#showBoundriesNav').html("Hide Boundaries");
    $('#iconDoneNav').hide();
    $('#iconPendingNav').show();
    $('#txtPenaltyNav').val("0");
    this.progressData.coveredLength = "0";
    this.progressData.wardLength = "0";
    this.progressData.workPercentage = "0%";
    this.progressData.penalty = 0;
    this.progressData.coveredLengthMeter = 0;
    this.progressData.totalWardLength = 0;
    this.progressData.workPercentageNumber = 0;
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

    if (this.vtsPolylines.length > 0) {
      for (let i = 0; i < this.vtsPolylines.length; i++) {
        if (this.vtsPolylines[i] != undefined) {
          this.vtsPolylines[i].setMap(null);
        }
      }
    }
    this.vtsPolylines = [];
    this.lines = [];
    this.vehicleList = [];
    this.wardLineLengthList = [];
  }

  changeWardSelection(filterVal: any) {
    $('#ddlWard').val(filterVal);
    $('#ddlWardNav').val(filterVal);
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
    }
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
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
    $("#txtDateNav").val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.getWardData();
  }

  getWardData() {
    if(this.selectedWard=="0"){
      return;
    }
    this.resetAll();
    this.getProgressDetail();
    this.getWardTotalLength();
    this.getWardLineLength();
  }

  getWardLineLength() {
      this.commonService.getWardLineLength(this.selectedWard).then((lengthList: any) => {
        if (lengthList != null) {
          this.wardLineLengthList = JSON.parse(lengthList);
        }
      });
  }

  getProgressDetail() {
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    let summaryInstance = this.db.object(dbPath).valueChanges().subscribe((summaryData) => {
      summaryInstance.unsubscribe();
      if (summaryData != null) {
        if (summaryData["workPerc"] != null) {
          this.progressData.workPercentageNumber = Number(summaryData["workPerc"]);
          this.progressData.workPercentage = summaryData["workPerc"] + "%";
        } else {
          this.progressData.workPercentage = "0%";
          this.progressData.workPercentageNumber = 0;
        }
        if (summaryData["coveredLength"] != null) {
          this.progressData.coveredLengthMeter = Number(summaryData["coveredLength"]);
          this.progressData.coveredLength = (parseFloat(summaryData["coveredLength"]) / 1000).toFixed(2);
        } else {
          this.progressData.coveredLength = "0.00";
          this.progressData.coveredLengthMeter = 0;
        }

        if (summaryData["vehicles"] != null) {
          let vechileList = summaryData["vehicles"].split(',');
          if (vechileList.length > 0) {
            for (let i = 0; i < vechileList.length; i++) {
              if (vechileList[i] != "") {
                this.vehicleList.push({ vehicle: vechileList[i] });
              }
            }
          }
        }
        if (summaryData["penalty"] != null) {
          $('#txtPenalty').val(summaryData["penalty"]);
          $('#txtPenaltyNav').val(summaryData["penalty"]);
          this.progressData.penalty = summaryData["penalty"];
        }
        if (summaryData["vtsDone"] != null) {
          $('#iconDone').show();
          $('#iconPending').hide();
          $('#iconDoneNav').show();
          $('#iconPendingNav').hide();
        }
      }
      this.getAllLinesFromJson();
    });
  }

  getAllLinesFromJson() {
    
    this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
      this.wardBoundary = wardKML;
    });

    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        this.drowVTSRoute(this.vehicleList[i]["vehicle"], i + 1, i);
      }
    }

    

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
                  let dist = 0;
                  let lineDetail = this.wardLineLengthList.find(item => item.lineNo == lineNo);
                  if (lineDetail != undefined) {
                    dist = Number(lineDetail.length);
                  }

                  this.lines.push({
                    lineNo: lineNo,
                    latlng: latLng,
                    color: "#fa0505",
                    dist: dist
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
        if (data != null) {
          if (data["LineStatus"] != null) {
            let obj = data["LineStatus"];
            dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus";
            this.db.object(dbPath).update(obj);
            if (data["Summary"] != null) {
              dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
              let userid = localStorage.getItem("userID");
              let wardCoveredDistance = 0;
              let workPercentage = 0;
              if (data["Summary"]["coveredLength"] != null) {
                wardCoveredDistance = Number(data["Summary"]["coveredLength"]);
              }
              if (data["Summary"]["workPerc"] != null) {
                workPercentage = Number(data["Summary"]["workPerc"]);
              }
              const data1 = {
                analysedBy: userid,
                coveredLength: wardCoveredDistance.toFixed(0),
                workPerc: workPercentage
              }
              this.db.object(dbPath).update(data1);
            }
            this.getWardData();
          }
        }
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
        line.setOptions(polyOptions);
        let lineNo = this.lines[j]["lineNo"];
        this.polylines[j]["strokeColor"] = "#fa0505";
        this.lines[j]["color"] = "#fa0505";
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
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
      this.progressData.coveredLengthMeter = 0;
      this.closeModel();
    }
  }

  selectAll() {
    if (this.lines.length > 0) {
      for (let j = 0; j < this.lines.length; j++) {
        let line = new google.maps.Polyline(this.polylines[j]);
        var polyOptions = {
          strokeColor: "#0ba118",
          strokeOpacity: 1.0,
          strokeWeight: this.strokeWeight
        }
        let lineNo = this.lines[j]["lineNo"];
        this.polylines[j]["strokeColor"] = "#0ba118";
        this.lines[j]["color"] = "#0ba118";
        line.setOptions(polyOptions);
        let date = new Date();
        let hour = date.getHours();
        let min = date.getMinutes();
        let second = date.getSeconds();
        let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
        this.db.database.ref(dbPath).set(time);
      }

      let wardCoveredDistance = this.progressData.totalWardLength;
      let workPercentage = 100;
      let userid = localStorage.getItem("userID");
      const data1 = {
        analysedBy: userid,
        coveredLength: wardCoveredDistance.toFixed(0),
        workPerc: workPercentage
      }
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.object(dbPath).update(data1);
      this.progressData.coveredLength = (parseFloat(wardCoveredDistance.toString()) / 1000).toFixed(2);
      this.progressData.workPercentage = workPercentage + "%";
      this.progressData.coveredLengthMeter = wardCoveredDistance;
    }
    this.hideSetting();
  }

  plotLineOnMap(lineNo: any, latlngs: any, i: any, wardNo: any) {
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
        strokeWeight: this.strokeWeight,
      });
      this.polylines[i] = line;
      this.polylines[i].setMap(this.map);
      let lineDetail = this.lines.find(item => item.lineNo == lineNo);
      if (lineDetail != undefined) {
        lineDetail.color = strockColor;
      }
      this.setClickInstance(line, lineNo, i);
    });
  }


  setClickInstance(line: any, lineNo: any, index: any) {
    let progresData = this.progressData;
    let dbEvent = this.db;
    let lines = this.lines;
    let polylines = this.polylines;
    let userId = this.userId;
    let dbPathTime = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
    let dbPathSummary = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";

    google.maps.event.addListener(line, 'click', function (h) {
      let dist = 0;
      let date = new Date();
      let hour = date.getHours();
      let min = date.getMinutes();
      let second = date.getSeconds();
      let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;

      let stockColor = "#fa0505";
      let lineDetail = lines.find(item => item.lineNo == lineNo);
      if (lineDetail != undefined) {
        dist = Number(lineDetail.dist);
        let wardTotalLength = progresData.totalWardLength;
        let wardCoveredDistance = progresData.coveredLengthMeter;
        let workPercentage = 0;
        stockColor = lineDetail.color;
        if (stockColor == "#fa0505") {
          dbEvent.database.ref(dbPathTime).set(time);
          lineDetail.color = "#0ba118";
          stockColor = lineDetail.color;
          wardCoveredDistance = wardCoveredDistance + dist;
        }
        else {
          dbEvent.database.ref(dbPathTime).set(null);
          lineDetail.color = "#fa0505";
          stockColor = lineDetail.color;
          wardCoveredDistance = wardCoveredDistance - dist;
        }
        var polyOptions = {
          strokeColor: stockColor,
          strokeOpacity: 1.0,
          strokeWeight: Number(localStorage.getItem("strokeWeight"))
        }
        line.setOptions(polyOptions);
        polylines[index]["strokeColor"] = stockColor;
        if (wardCoveredDistance > 0) {
          workPercentage = Math.round((wardCoveredDistance * 100) / wardTotalLength);
        }
        const data1 = {
          analysedBy: userId,
          coveredLength: wardCoveredDistance.toFixed(0),
          workPerc: workPercentage
        }
        dbEvent.object(dbPathSummary).update(data1);
        progresData.workPercentage = workPercentage + "%";
        progresData.coveredLengthMeter = wardCoveredDistance;
        progresData.coveredLength = (wardCoveredDistance / 1000).toFixed(2);
      }
    });
  }

  getNextPrevious(type: any) {
    let strokeWeight = $("#txtStrokeWeight").val();
    if (strokeWeight == "") {
      strokeWeight = $("#txtStrokeWeightNav").val();
      if (strokeWeight == "") {
        this.commonService.setAlertMessage("error", "Please enter stroke weight. !!!");
        return;
      }
    }
    if (type == "pre") {
      if (strokeWeight != "1") {
        this.strokeWeight = Number(strokeWeight) - 1;
        $("#txtStrokeWeight").val(this.strokeWeight);
        $("#txtStrokeWeightNav").val(this.strokeWeight);
        localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
        this.setStrokeWeight();
      }
    } else if (type == "next") {
      this.strokeWeight = Number(strokeWeight) + 1;
      $("#txtStrokeWeight").val(this.strokeWeight);
      $("#txtStrokeWeightNav").val(this.strokeWeight);
      localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
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
      let strokeWeight = $("#txtStrokeWeight").val();
      if (strokeWeight == "") {
        strokeWeight = $("#txtStrokeWeightNav").val();
        if (strokeWeight == "") {
          this.commonService.setAlertMessage("error", "Please enter line no. !!!");
          return;
        }
      }
      this.strokeWeight = Number(strokeWeight);
      $("#txtStrokeWeight").val(this.strokeWeight);
      $("#txtStrokeWeightNav").val(this.strokeWeight);
      localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
      this.setStrokeWeight();
    }
  }

  hideSetting() {
    let element = <HTMLElement>document.getElementById("collapsetwo");
    let className = element.className;
    $("#collapsetwo").removeClass(className);
    $("#collapsetwo").addClass("panel-collapse collapse in");
  }

  setPreDate(filterVal: any) {
    $('#txtPreDate').val(filterVal);
    $('#txtPreDateNav').val(filterVal);
  }

  showBounderis() {
    if (this.isBoundaryShow == true) {
      $('#showBoundries').html("Show Boundaries");
      $('#showBoundriesNav').html("Show Boundaries");
      this.isBoundaryShow = false;
      if (this.wardBoundary != null) {
        this.wardBoundary.setMap(null);
      }
      this.wardBoundary = null;
    }
    else {
      $('#showBoundries').html("Hide Boundaries");
      $('#showBoundriesNav').html("Hide Boundaries");
      this.isBoundaryShow = true;
      this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
        this.wardBoundary = wardKML;
      });

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
    let vehicleNo = $('#txtVehicle').val().toString().trim();
    if (this.selectedWard == "0" || this.selectedWard == null) {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if (vehicleNo == "") {
      vehicleNo = $('#txtVehicleNav').val().toString().trim();
      if (vehicleNo == "") {
        this.commonService.setAlertMessage("error", "Please enter vehicle no. !!!");
        return;
      }
    }
    let vehicleDetail = this.vehicleList.find(item => item.vehicle == vehicleNo);
    if (vehicleDetail != undefined) {
      this.commonService.setAlertMessage("error", "This vehicle already added !!!");
      return;
    }


    let vehicles = "";
    let latLng = [];
    this.vehicleList.push({ vehicle: vehicleNo, latLng: latLng });
    this.drowVTSRoute(vehicleNo, this.vehicleList.length, this.vehicleList.length - 1);
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
    $('#txtVehicleNav').val("");
    this.commonService.setAlertMessage("success", "Vehicle added successfully !!!");
  }

  drowVTSRoute(vehicle: any, colorIndex: any, index: any) {
    let VTSList = [];
    let dbPath = "VTSRoute/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + vehicle;

    let VTSInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        VTSInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let time = keyArray[i];
              let date = new Date(this.selectedDate + " " + time);
              VTSList.push({ time: time, filterTime: date.getTime(), lat: data[time]["lat"], lng: data[time]["lng"] });
            }
            let latLng = [];
            VTSList = this.commonService.transformNumeric(VTSList, "filterTime");
            for (let j = 0; j < VTSList.length; j++) {
              latLng.push({ lat: Number(VTSList[j]["lat"]), lng: Number(VTSList[j]["lng"]) });
            }
            let strockColor = this.getVTSLineColor(colorIndex);
            let line = new google.maps.Polyline({
              path: latLng,
              strokeColor: strockColor,
              strokeWeight: 2,
            });
            this.vtsPolylines[index] = line;
            this.vtsPolylines[index].setMap(this.map);
            let vehicleDetail = this.vehicleList.find(item => item.vehicle == vehicle);
            if (vehicleDetail != undefined) {
              vehicleDetail.latLng = latLng;
            }
          }
        }
      }
    );
  }

  getVTSLineColor(index: any) {
    let color = "blue";
    if (index == 1) {
      color = "#0614f4";
    }
    else if (index == 2) {
      color = "#ea06f4";
    }
    else if (index == 3) {
      color = "#03fef7";
    }
    else if (index == 4) {
      color = "#eafe03";
    }
    return color;

  }


  removeVehicle(index: any) {
    let vehicleList = [];
    let vehicles = "";
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (i != index) {
        vehicleList.push({ vehicle: this.vehicleList[i]["vehicle"], latLng: this.vehicleList[i]["latLng"] });
        if (vehicles != "") { vehicles = vehicles + "," }
        vehicles = this.vehicleList[i]["vehicle"];
      }
    }
    this.vehicleList = vehicleList;
    if (this.vtsPolylines.length > 0) {
      for (let i = 0; i < this.vtsPolylines.length; i++) {
        if (this.vtsPolylines[i] != undefined) {
          this.vtsPolylines[i].setMap(null);
        }
      }
    }
    this.vtsPolylines = [];
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        let latLng = this.vehicleList[i]["latLng"];
        if (latLng.length > 0) {
          let strockColor = this.getVTSLineColor(i + 1);
          let line = new google.maps.Polyline({
            path: latLng,
            strokeColor: strockColor,
            strokeWeight: 2,
          });
          this.vtsPolylines[i] = line;
          this.vtsPolylines[i].setMap(this.map);
        }
      }
    }
    if (vehicles != "") {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.object(dbPath).update({ vehicles: vehicles });
    }
    else {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/vehicles";
      this.db.database.ref(dbPath).set(null);
    }
    this.commonService.setAlertMessage("success", "Vehicle deleted successfully !!!");
  }

  saveVTSTrackingDone() {
    let penalty = $('#txtPenalty').val();
    if (penalty == "" || penalty == "0") {
      penalty = $('#txtPenaltyNav').val();
      if (penalty == "" || penalty == "0") {
        penalty = 0;
      }
    }

    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vtsDone: "yes", analysedBy: localStorage.getItem("userID"), penalty: penalty });

    $('#iconDone').show();
    $('#iconPending').hide();
    $('#iconDoneNav').show();
    $('#iconPendingNav').hide();
    this.progressData.penalty = Number(penalty);
    $('#txtPenalty').val(penalty);
    $('#txtPenaltyNav').val(penalty);
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
  penalty: number;
}
