/// <reference types="@types/googlemaps" />

import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-jmaps-test-purpose',
  templateUrl: './jmaps-test-purpose.component.html',
  styleUrls: ['./jmaps-test-purpose.component.scss']
})
export class JmapsTestPurposeComponent implements OnInit {
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
  wardBoundary: any;
  strokeWeight = 4;
  vehicleList: any[];
  zoneList: any[];
  wardLineStatus: any[];
  userId: any;
  isBoundaryShow = true;
  isLineShow = true;
  strockColorNotDone = "#fa0505";
  strockColorDone = "#0ba118";
  vtsVehicleList: any[];
  vtsPolylines = [];
  markerList: any[];
  wardLineLatLng: any[];
  routeVehicleList: any[];
  eventHistoryList: any[];
  isShowMarker = false;
  eventInstance: any;
  isEventHistoryShow = false;
  instancesList: any[];
  progressData: progressDetail = {
    totalWardLength: 0,
    wardLength: "0",
    coveredLength: "0",
    workPercentage: "0%",
    coveredLengthMeter: 0,
    workPercentageNumber: 0,
    penalty: 0,
    lastShowDate: this.commonService.getTodayDateTime(),
    selectedLines: 0,
    savedLines: 0
  };

  showBoundries = "#showBoundries";
  showBoundriesNav = "#showBoundriesNav";
  showLines = "#showLines";
  showLinesNav = "#showLinesNav";
  ddlZone = "#ddlZone";
  ddlZoneNav = "#ddlZoneNav";
  txtDate = "#txtDate";
  txtDateNav = "#txtDateNav";
  txtPreDate = "#txtPreDate";
  txtPreDateNav = "#txtPreDateNav";
  txtStrokeWeight = "#txtStrokeWeight";
  txtStrokeWeightNav = "#txtStrokeWeightNav";
  iconDone = "#iconDone";
  iconPending = "#iconPending";
  iconDoneNav = "#iconDoneNav";
  iconPendingNav = "#iconPendingNav";
  txtPenalty = "#txtPenalty";
  txtPenaltyNav = "#txtPenaltyNav";
  ddlWard = "#ddlWard";
  ddlWardNav = "#ddlWardNav";
  txtVehicle = "#txtVehicle";
  txtVehicleNav = "#txtVehicleNav";
  divLoader = "#divLoader";
  approvalName = "#approvalName";
  divApproved = "#divApproved";
  divEventHistory = "#divEventHistory";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setEventHistoryHeight();
    this.setDefault();
  }

  setEventHistoryHeight() {
    let windowHeight = $(window).height();
    let element = <HTMLDivElement>document.getElementById("tblEventHistory");
    element.style.height = (windowHeight - 480) + "px";
  }

  setDefault() {
    this.selectedWard = "0";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZoneList();
    this.setDefaultArrayList();
    this.setDefaultLocalStorage();
    this.setDefaultDate();
    this.setHeight();
    this.setMaps();
    $(this.divApproved).hide();
    let btnElement = <HTMLButtonElement>document.getElementById("btnApprove");
    btnElement.disabled = true;
    $(this.iconDone).hide();
  }

  activateApprovalButton() {
    let element = <HTMLInputElement>document.getElementById("chkApprove");
    let btnElement = <HTMLButtonElement>document.getElementById("btnApprove");
    if (element.checked == true) {
      btnElement.disabled = false;
    }
    else {
      btnElement.disabled = true;
    }
  }

  getZoneList() {
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
  }

  setDefaultArrayList() {
    this.lines = [];
    this.polylines = [];
    this.vehicleList = [];
    this.wardLineStatus = [];
    this.vtsVehicleList = [];
    this.markerList = [];
    this.wardLineLatLng = [];
    this.routeVehicleList = [];
    this.eventHistoryList = [];
    this.instancesList = [];
  }

  resetAllData() {

    this.isBoundaryShow = true;
    if (this.wardBoundary != null) {
      this.wardBoundary.setMap(null);
    }
    this.wardBoundary = null;
    if (this.vtsPolylines.length > 0) {
      for (let i = 0; i < this.vtsPolylines.length; i++) {
        if (this.vtsPolylines[i] != null) {
          this.vtsPolylines[i].setMap(null);
        }
      }
    }
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        if (this.markerList[i]["marker"] != null) {
          this.markerList[i]["marker"].setMap(null);
        }
      }
    }
    this.vtsPolylines = [];
    this.vtsVehicleList = [];
    this.vehicleList = [];
    this.markerList = [];
    this.routeVehicleList = [];
    this.wardLineStatus = [];
    this.eventHistoryList = [];

    this.lines = [];
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        if (this.markerList[i] != null) {
          this.markerList[i]["marker"].setMap(null);
        }
      }
    }
    this.markerList = [];
    this.wardLineLatLng = [];
    let element = <HTMLInputElement>document.getElementById("chkApprove");
    let btnElement = <HTMLButtonElement>document.getElementById("btnApprove");
    element.checked = false;
    btnElement.disabled = true;
    this.progressData.selectedLines = 0;
    this.progressData.savedLines = 0;
    $(this.divApproved).hide();
    this.clearListeners();
  }

  setDefaultLocalStorage() {
    this.userId = localStorage.getItem("userID");
    if (localStorage.getItem("strokeWeight") != null) {
      this.strokeWeight = Number(localStorage.getItem("strokeWeight"));
      $(this.txtStrokeWeight).val(this.strokeWeight);
      $(this.txtStrokeWeightNav).val(this.strokeWeight);
    }
    if (this.userId == "6" || this.userId == "4" || this.userId == "11") {
      $(this.divEventHistory).show();
      this.isEventHistoryShow = true;
    }
  }

  getEventHistory() {
    if (this.eventInstance != null) {
      this.eventInstance.unsubscribe();
    }
    if (this.isEventHistoryShow == true) {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/EventHistory";
      this.eventInstance = this.db.list(dbPath).valueChanges().subscribe(
        data => {
          this.eventHistoryList = [];
          if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
              let name = data[i]["name"];
              let time = data[i]["time"];
              let desc = data[i]["desc"];
              let eventBy = data[i]["by"];
              let userData = this.commonService.getPortalUserDetailById(eventBy);
              if (userData != undefined) {
                this.eventHistoryList.push({ name: name, time: time, desc: desc, userName: userData["name"] });
              }
            }
          }
        }
      );
    }
  }

  setDefaultDate() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.commonService.getPreviousDate(this.toDayDate, 1);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
  }

  //#region region set StrokWeight

  getCurrentStrokeWeight(event: any, type: any) {
    if (event.key == "Enter") {
      let strokeWeight = "";
      if (type == "web") {
        strokeWeight = $(this.txtStrokeWeight).val().toString();
      }
      else {
        strokeWeight = $(this.txtStrokeWeightNav).val().toString();
      }
      if (strokeWeight == "") {
        this.commonService.setAlertMessage("error", "Please enter stroke weight !!!");
        return;
      }
      this.strokeWeight = Number(strokeWeight);
      $(this.txtStrokeWeight).val(this.strokeWeight);
      $(this.txtStrokeWeightNav).val(this.strokeWeight);
      localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
      this.setStrokeWeight();
    }
  }

  getNextPrevious(type: any) {
    let strokeWeight = $(this.txtStrokeWeight).val();
    if (strokeWeight == "") {
      strokeWeight = $(this.txtStrokeWeightNav).val();
      if (strokeWeight == "") {
        this.commonService.setAlertMessage("error", "Please enter stroke weight !!!");
        return;
      }
    }
    if (type == "pre") {
      if (strokeWeight != "1") {
        this.strokeWeight = Number(strokeWeight) - 1;
        $(this.txtStrokeWeight).val(this.strokeWeight);
        $(this.txtStrokeWeightNav).val(this.strokeWeight);
        localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
        this.setStrokeWeight();
      }
    } else if (type == "next") {
      this.strokeWeight = Number(strokeWeight) + 1;
      $(this.txtStrokeWeight).val(this.strokeWeight);
      $(this.txtStrokeWeightNav).val(this.strokeWeight);
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

  //#endregion

  //#region Ward Boundary

  setWardBoundary() {
    if (this.selectedWard != "0") {
      this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
        this.wardBoundary = wardKML;
      });
    }
  }

  showBounderis() {
    if (this.isBoundaryShow == true) {
      this.isBoundaryShow = false;
      if (this.wardBoundary != null) {
        this.wardBoundary.setMap(null);
      }
      this.wardBoundary = null;
    }
    else {
      this.isBoundaryShow = true;
      this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
        this.wardBoundary = wardKML;
      });
    }
    this.showHideBoundariesHtml();
    this.hideSetting();
  }

  showHideBoundariesHtml() {
    if (this.isBoundaryShow == true) {
      $(this.showBoundries).html("Hide Boundaries");
      $(this.showBoundriesNav).html("Hide Boundaries");
    }
    else {
      $(this.showBoundries).html("Show Boundaries");
      $(this.showBoundriesNav).html("Show Boundaries");
    }
  }

  //#endregion

  //#region Ward Lines

  getSummary() {
    this.routeVehicleList = [];
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    let approveInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        approveInstance.unsubscribe();
        if (data != null) {
          if (data["routeVehicles"] != null) {
            let vehicles = data["routeVehicles"].split(',');
            let latLngList = [];
            let speedList = [];
            for (let i = 0; i < vehicles.length; i++) {
              this.routeVehicleList.push({ vehicle: vehicles[i], latLngList: latLngList, isRoute: true, speedList: speedList });
            }
          }
          if (data["vehicles"] != null) {
            this.getVehicles(data["vehicles"]);
          }
          if (data["approvedBy"] != null) {
            let approvedBy = data["approvedBy"];
            let approveDate = data["approvalDate"];
            let analysisTime = approveDate.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(approveDate.split('-')[1])) + " " + approveDate.split('-')[0];
            let userData = this.commonService.getPortalUserDetailById(approvedBy);
            if (userData != undefined) {
              $(this.approvalName).html(userData["name"] + " on " + analysisTime);
            }
            $(this.divApproved).show();
          }
        }
        else {
          $(this.approvalName).html("");
        }
      }
    );
  }

  getWardLineStatus() {
    this.wardLineStatus = [];
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus";
    let statusInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        statusInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            this.wardLineStatus.push({ lineNo: lineNo });
          }
          this.progressData.selectedLines = keyArray.length;
          this.progressData.savedLines = keyArray.length;
        }
        this.checkData();
        this.setWardLines();
      }
    );
  }


  setWardLinesNew() {
    if (this.selectedWard != "0") {
      this.httpService.get("../../assets/jsons/WardLines/" + this.cityName + "/" + this.selectedWard + ".json").subscribe(data => {
        if (data != null) {
          var keyArray = Object.keys(data);
          console.log(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              this.wardLines = keyArray.length;
              let index = keyArray[i];
              let lineNo = data[index]["lineNoNew"];
              if (data[index] != null) {
                var latLng = [];
                if (data[index]["points"] != undefined) {
                  if (data[index]["points"].length > 0) {
                    for (let j = 0; j < data[index]["points"].length; j++) {
                      latLng.push({ lat: data[index]["points"][j][0], lng: data[index]["points"][j][1] });
                      this.wardLineLatLng.push({ lineNo: lineNo, lat: data[index]["points"][j][0], lng: data[index]["points"][j][1], isCovered: "no" });
                    }
                    let strokeColor = this.strockColorNotDone;
                    let wardLinsStatusDetail = this.wardLineStatus.find(item => item.lineNo == lineNo);
                    if (wardLinsStatusDetail != undefined) {
                      strokeColor = this.strockColorDone;
                    }
                    this.lines.push({
                      lineNo: lineNo,
                      latlng: latLng,
                      strokeColor: strokeColor
                    });
                  }
                }
              }
            }
            this.plotLinesOnMap();
          }
        }
      });
    }
  }

  setWardLines() {
    if (this.selectedWard != "0") {
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
                      this.wardLineLatLng.push({ lineNo: lineNo, lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1], isCovered: "no" });
                    }
                    let strokeColor = this.strockColorNotDone;
                    let wardLinsStatusDetail = this.wardLineStatus.find(item => item.lineNo == lineNo);
                    if (wardLinsStatusDetail != undefined) {
                      strokeColor = this.strockColorDone;
                    }
                    this.lines.push({
                      lineNo: lineNo,
                      latlng: latLng,
                      strokeColor: strokeColor,
                      count: 0
                    });
                  }
                }
              }
            }
            this.plotLinesOnMap();
          }
        }
      });
    }
  }

  plotLinesOnMap() {
    if (this.lines.length > 0) {
      for (let i = 0; i < this.lines.length; i++) {
        let lineNo = this.lines[i]["lineNo"];
        let latlngs = this.lines[i]["latlng"];
        let strokeColor = this.lines[i]["strokeColor"];
        let line = new google.maps.Polyline({
          path: latlngs,
          strokeColor: strokeColor,
          strokeWeight: this.strokeWeight,
        });
        this.polylines[i] = line;
        this.polylines[i].setMap(this.map);
        this.setClickInstance(line, lineNo, i);


      }
    }
  }

  setClickInstance(line: any, lineNo: any, index: any) {
    let progressData = this.progressData;
    let lines = this.lines;
    let polylines = this.polylines;
    let strockColorNotDone = this.strockColorNotDone;
    let strockColorDone = this.strockColorDone;
    let userId = this.userId;
    let dbEvent = this.db;
    let commonService = this.commonService;
    let toDayDate = this.toDayDate;
    let dbEventPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;
    let clickInstance = google.maps.event.addListener(line, 'click', function (h) {
      console.log(lineNo);
      if (commonService.checkInternetConnection() == "no") {
        commonService.setAlertMessage("error", "Please check internet connection !!!");
        return;
      }
      let time = commonService.getCurrentTimeWithSecond();
      time = time + "-" + userId + "-" + toDayDate;
      let strokeColor = strockColorNotDone;
      let lineDetail = lines.find(item => item.lineNo == lineNo);
      if (lineDetail != undefined) {
        strokeColor = lineDetail.strokeColor;
        if (strokeColor == strockColorNotDone) {
          dbEvent.database.ref(dbEventPath + "/LineStatus/" + lineNo).set(time);
          lineDetail.strokeColor = strockColorDone;
          strokeColor = lineDetail.strokeColor;
          progressData.selectedLines = progressData.selectedLines + 1;
        }
        else {
          dbEvent.database.ref(dbEventPath + "/LineStatus/" + lineNo).set(null);
          lineDetail.strokeColor = strockColorNotDone;
          strokeColor = lineDetail.strokeColor;
          progressData.selectedLines = progressData.selectedLines - 1;
        }
        let dataInstance = dbEvent.list(dbEventPath + "/LineStatus").valueChanges().subscribe(
          data => {
            dataInstance.unsubscribe();
            progressData.savedLines = data.length;
            let element = <HTMLImageElement>document.getElementById("imgSync");
            if (progressData.selectedLines != progressData.savedLines) {
              element.src = "../../../assets/img/red_data.svg";
            }
            else {
              element.src = "../../../assets/img/green_data.svg";
            }
          });

        var polyOptions = {
          strokeColor: strokeColor,
          strokeOpacity: 1.0,
          strokeWeight: Number(localStorage.getItem("strokeWeight"))
        }
        line.setOptions(polyOptions);
        polylines[index]["strokeColor"] = strokeColor;
      }
    });
    this.instancesList.push({ instances: clickInstance });
  }

  checkData() {
    let element = <HTMLImageElement>document.getElementById("imgSync");
    if (this.progressData.selectedLines != this.progressData.savedLines) {
      element.src = "../../../assets/img/red_data.svg";
    }
    else {
      element.src = "../../../assets/img/green_data.svg";
    }
  }

  getSavedLines() {
    if (this.progressData.selectedLines == this.progressData.savedLines) {
      this.commonService.setAlertMessage("error", "data already updated !!!");
      return;
    }
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;
    if (this.lines.length > 0) {
      let count = 0;
      for (let i = 0; i < this.lines.length; i++) {
        if (this.lines[i]["strokeColor"] == this.strockColorDone) {
          let time = this.commonService.getCurrentTimeWithSecond();
          time = time + "-" + this.userId + "-" + this.toDayDate;
          this.db.database.ref(dbPath + "/LineStatus/" + this.lines[i]["lineNo"]).set(time);
          count++;
        }
      }
      this.progressData.savedLines = count;
      let element = <HTMLImageElement>document.getElementById("imgSync");
      if (this.progressData.selectedLines != this.progressData.savedLines) {
        element.src = "../../../assets/img/red_data.svg";
        this.commonService.setAlertMessage("error", "Data not updated. Please try again !!!");
      }
      else {
        element.src = "../../../assets/img/green_data.svg";
        this.commonService.setAlertMessage("success", "Data updated !!!");
      }
    }
  }

  //#endregion

  //#region   Top  Left Filter

  setDate(filterVal: any, type: string) {
    this.resetAllData();
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
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    if (this.selectedWard != "0") {
      this.changeWardSelection(this.selectedWard);
    }
  }

  changeZoneSelection(filterVal: any) {
    this.resetAllData();
    this.wardList = [];
    let zoneDetail = this.zoneList.find(item => item.zoneName == filterVal);
    if (zoneDetail != undefined) {
      let wardList = zoneDetail.wardList;
      for (let i = 1; i < wardList.length; i++) {
        this.wardList.push({ wardNo: wardList[i], wardName: "Ward " + wardList[i] });
      }
    }
  }

  changeWardSelection(filterVal: any) {
    $(this.ddlWard).val(filterVal);
    $(this.ddlWardNav).val(filterVal);
    this.selectedWard = filterVal;
    this.resetAllData();
    if (filterVal != "0") {
      $(this.divLoader).show();
      setTimeout(() => {
        this.checkData();
        this.setWardBoundary();
        this.showHideBoundariesHtml();
        this.getWardLineStatus();
        this.getSummary();
        $(this.divLoader).hide();
        this.getEventHistory();
      }, 2000);
    }

  }

  //#endregion

  //#region 

  selectAll() {

    if (this.lines.length > 0) {
      for (let j = 0; j < this.lines.length; j++) {
        let line = new google.maps.Polyline(this.polylines[j]);
        var polyOptions = {
          strokeColor: this.strockColorDone,
          strokeOpacity: 1.0,
          strokeWeight: this.strokeWeight
        }
        let lineNo = this.lines[j]["lineNo"];
        if (this.lines[j]["strokeColor"] != this.strockColorDone) {
          let time = this.commonService.getCurrentTimeWithSecond();
          time = time + "-" + this.userId + "-" + this.toDayDate;
          let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
          this.db.database.ref(dbPath).set(time);
        }
        this.polylines[j]["strokeColor"] = this.strockColorDone;
        this.lines[j]["strokeColor"] = this.strockColorDone;
        line.setOptions(polyOptions);
      }
    }
    this.progressData.selectedLines = this.lines.length;
    this.progressData.savedLines = this.lines.length;
    this.checkData();
    this.commonService.setAlertMessage("success", "All lines selected !!!");
    this.closeModel();
    this.saveEventHistory("Select all lines", "");
  }

  resetAllLines() {

    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        let element = <HTMLInputElement>document.getElementById("chkVehicle" + i);
        if (element.checked == true) {
          element.checked = false;
          if (this.vtsPolylines[i] != null) {
            this.vtsPolylines[i].setMap(null);
            if (this.isShowMarker == true) {
              if (this.markerList.length > 0) {
                for (let i = 0; i < this.markerList.length; i++) {
                  if (this.markerList[i]["marker"] != null) {
                    this.markerList[i]["marker"].setMap(null);
                  }
                }
              }
            }
          }
        }
        this.vehicleList[i]["isDone"] = 0;
      }
      this.vtsPolylines = [];
      this.markerList = [];
    }
    if (this.lines.length > 0) {
      for (let j = 0; j < this.lines.length; j++) {
        let line = new google.maps.Polyline(this.polylines[j]);
        var polyOptions = {
          strokeColor: this.strockColorNotDone,
          strokeOpacity: 1.0,
          strokeWeight: this.strokeWeight
        }
        line.setOptions(polyOptions);
        this.polylines[j]["strokeColor"] = this.strockColorNotDone;
        this.lines[j]["strokeColor"] = this.strockColorNotDone;
      }
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/";
      this.db.database.ref(dbPath).set(null);
      dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/";
      this.db.object(dbPath + "/routeVehicles").set(null);
      this.routeVehicleList = [];
      let date = this.commonService.getTodayDateTime();
      this.db.object(dbPath).update({ resetBy: this.userId, resetDateTime: date });
      this.progressData.selectedLines = 0;
      this.progressData.savedLines = 0;
      this.checkData();
      this.commonService.setAlertMessage("success", "All lines resetted !!!");
      this.closeModel();
      this.saveEventHistory("Reset lines", "");
    }
  }

  setPreviousData() {

    this.resetAllData();
    this.setWardBoundary();
    let date = $(this.txtPreDate).val().toString();
    if (date == "") {
      this.commonService.setAlertMessage("error", "Please select date !!!");
      return;
    }
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus";
    this.db.database.ref(dbPath).set(null);
    dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/vehicles";
    this.db.database.ref(dbPath).set(null);
    dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/routeVehicles";
    this.db.database.ref(dbPath).set(null);
    let monthName = this.commonService.getCurrentMonthName(new Date(date).getMonth());
    let year = date.split("-")[0];
    dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + year + "/" + monthName + "/" + date;
    let preDataInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        preDataInstance.unsubscribe();
        if (data != null) {
          if (data["LineStatus"] != null) {
            let obj = data["LineStatus"];
            dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus";
            this.db.database.ref(dbPath).set(null);
            if (obj != null) {
              let keyArray = Object.keys(obj);
              for (let i = 0; i < keyArray.length; i++) {
                let lineNo = keyArray[i];
                let newPath = dbPath + "/" + lineNo;
                let time = this.commonService.getCurrentTimeWithSecond();
                time = time + "-" + this.userId + "-" + this.toDayDate;
                this.db.database.ref(newPath).set(time);
              }
            }
          }
          if (data["Summary"] != null) {
            if (data["Summary"]["vehicles"] != null) {
              dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
              this.db.object(dbPath).update({ vehicles: data["Summary"]["vehicles"] });
            }
          }
        }
        this.getWardLineStatus();
        this.getSummary();
        this.saveEventHistory("Set Previous Data", "Date " + $(this.txtPreDate).val());
        $(this.txtPreDate).val("");
      });
    this.hideSetting();
  }

  approve() {
    let approveDate = this.commonService.setTodayDate();
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/";
    this.db.object(dbPath).update({ approvalDate: this.commonService.setTodayDate(), approvedBy: this.userId });
    let analysisTime = approveDate.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(approveDate.split('-')[1])) + " " + approveDate.split('-')[0];
    let userData = this.commonService.getPortalUserDetailById(this.userId);
    if (userData != undefined) {
      $(this.approvalName).html(userData["name"] + " on " + analysisTime);
    }
    let message = "Thanks " + localStorage.getItem("userName") + " for approving this map !!!";
    this.commonService.setAlertMessage("success", message);
    $(this.divApproved).show();
  }

  //#endregion

  //#region vehicle 

  getVehicles(vehicles: any) {
    this.vehicleList = [];
    this.markerList = [];
    let list = vehicles.split(',');
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        let vehicleNo = list[i];
        let latLng = [];
        let message = "Route not Imported";
        let cssClass = "not-route-created";
        let showCheckBox = 0;
        if (this.vtsVehicleList.length == 0) {
          let dbPath = "BVGRoutes/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/main";
          let vehicleInstance = this.db.list(dbPath).valueChanges().subscribe(
            data => {
              vehicleInstance.unsubscribe();
              if (data.length > 0) {
                this.vtsVehicleList = data;
              }
              let detail = this.vtsVehicleList.find(item => item.vehicle == vehicleNo);
              if (detail != undefined) {
                message = "Show Route";
                showCheckBox = 1;
                cssClass = "";
              }
              let isDone = 0;
              let routeVehicleDetail = this.routeVehicleList.find(item => item.vehicle == vehicleNo);
              if (routeVehicleDetail != undefined) {
                isDone = 1;
              }
              this.vehicleList.push({ vehicle: vehicleNo, latLng: latLng, showCheckBox: showCheckBox, message: message, cssClass: cssClass, isDone: isDone });
            });
        }
        else {
          let detail = this.vtsVehicleList.find(item => item.vehicle == vehicleNo);
          if (detail != undefined) {
            message = "Show Route";
            showCheckBox = 1;
            cssClass = "";
          }
          let isDone = 0;
          let routeVehicleDetail = this.routeVehicleList.find(item => item.vehicle == vehicleNo);
          if (routeVehicleDetail != undefined) {
            isDone = 1;
          }
          this.vehicleList.push({ vehicle: vehicleNo, latLng: latLng, showCheckBox: showCheckBox, message: message, cssClass: cssClass, isDone: isDone });
        }
      }
    }
  }

  removeVehicle(index: any) {
    let vehicleList = [];
    let vehicles = "";
    let vehicleName = "";
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (i != index) {
        let message = "Route not Imported";
        let showCheckBox = 0;
        let cssClass = "not-route-created";
        let detail = this.vtsVehicleList.find(item => item.vehicle == this.vehicleList[i]["vehicle"]);
        if (detail != undefined) {
          message = "Show Route";
          showCheckBox = 1;
          cssClass = "";
        }
        vehicleList.push({ vehicle: this.vehicleList[i]["vehicle"], showCheckBox: showCheckBox, message: message, cssClass: cssClass });
        if (vehicles != "") { vehicles = vehicles + "," }
        vehicles = vehicles + this.vehicleList[i]["vehicle"];
      }
      else {
        vehicleName = this.vehicleList[i]["vehicle"];
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
    if (vehicles != "") {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.object(dbPath).update({ vehicles: vehicles });
    }
    else {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/vehicles";
      this.db.database.ref(dbPath).set(null);
    }
    if (vehicleName != "") {
      this.removeRouteVehicle(vehicleName);
    }
    this.commonService.setAlertMessage("success", "Vehicle deleted successfully !!!");
  }

  removeRouteVehicle(vehicle: any) {
    let vehicleList = [];
    let vehicles = "";
    for (let i = 0; i < this.routeVehicleList.length; i++) {
      if (this.routeVehicleList[i]["vehicle"] != vehicle) {
        vehicleList.push({ vehicle: this.routeVehicleList[i]["vehicle"], latLngList: this.routeVehicleList[i]["latLngList"], isRoute: this.routeVehicleList[i]["isRoute"], speedList: this.routeVehicleList[i]["speedList"] });
        if (vehicles != "") { vehicles = vehicles + "," }
        vehicles = vehicles + this.vehicleList[i]["vehicle"];
      }
    }
    this.routeVehicleList = vehicleList;
    if (vehicles != "") {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.object(dbPath).update({ routeVehicles: vehicles });
    }
    else {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/routeVehicles";
      this.db.database.ref(dbPath).set(null);
    }
  }

  addVehicle() {

    let vehicleNo = $(this.txtVehicle).val().toString().trim();
    if (this.selectedWard == "0" || this.selectedWard == null) {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
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
    if (this.vtsVehicleList.length == 0) {
      let dbPath = "BVGRoutes/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/main";
      let vehicleInstance = this.db.list(dbPath).valueChanges().subscribe(
        data => {
          vehicleInstance.unsubscribe();
          if (data.length > 0) {
            this.vtsVehicleList = data;
          }
          this.addVehicleList(vehicleNo);
        });
    }
    else {
      this.addVehicleList(vehicleNo);
    }
    $(this.txtVehicle).val("");
    $(this.txtVehicleNav).val("");
    this.commonService.setAlertMessage("success", "Vehicle added successfully !!!");
  }

  addVehicleList(vehicleNo: any) {
    let message = "Route not Imported";
    let showCheckBox = 0;
    let cssClass = "not-route-created";
    let isDone = 0;
    let detail = this.vtsVehicleList.find(item => item.vehicle == vehicleNo);
    if (detail != undefined) {
      message = "Show Route";
      showCheckBox = 1;
      cssClass = "";
    }
    this.vehicleList.push({ vehicle: vehicleNo, showCheckBox: showCheckBox, message: message, cssClass: cssClass, isDone: isDone });
    let vehicles = "";
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
    if (vehicles != "") {
      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.db.object(dbPath).update({ vehicles: vehicles });
    }
  }

  getVtsRoute(vehicle: any, index: any) {
    let element = <HTMLInputElement>document.getElementById("chkVehicle" + index);
    if (element.checked == true) {
      if (this.vtsPolylines[index] != null) {
        this.vtsPolylines[index].setMap(this.map);
        if (this.isShowMarker == true) {
          if (this.markerList.length > 0) {
            for (let i = 0; i < this.markerList.length; i++) {
              if (this.markerList[i]["marker"] != null) {
                if (this.markerList[i]["index"] == index) {
                  this.markerList[i]["marker"].setMap(this.map);
                }
              }
            }
          }
        }
      }
      else {
        this.getVtsVehicleRoute(vehicle, index);
      }
    }
    else {
      if (this.vtsPolylines[index] != null) {
        this.vtsPolylines[index].setMap(null);
        if (this.markerList.length > 0) {
          for (let i = 0; i < this.markerList.length; i++) {
            if (this.markerList[i]["marker"] != null) {
              if (this.markerList[i]["index"] == index) {
                this.markerList[i]["marker"].setMap(null);
              }
            }
          }
        }
      }
    }
  }

  getVtsVehicleRoute(vehicle: any, index: any) {
    let detail = this.vtsVehicleList.find(item => item.vehicle == vehicle);
    if (detail != undefined) {
      let vehicleDetail = this.routeVehicleList.find(item => item.vehicle == vehicle);
      if (vehicleDetail == undefined) {
        let latLngList = [];
        let speedList = [];
        this.routeVehicleList.push({ vehicle: vehicle, latLngList: latLngList, isRoute: false, speedList: speedList });
      }
      let dbPath = "BVGRoutes/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + vehicle;
      let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          routeInstance.unsubscribe();
          if (data != null) {
            let routeList = data.toString().split('~');
            if (routeList.length > 0) {
              let latLng = [];
              let speedList = [];
              for (let i = 0; i < routeList.length; i++) {
                let lat = routeList[i].split(',')[0];
                let lng = routeList[i].split(',')[1];
                let speed = 0;
                if (routeList[i].split(',')[2] != null) {
                  speed = Number(routeList[i].split(',')[2]);
                }
                speedList.push({ speed: speed });
                latLng.push({ lat: Number(lat), lng: Number(lng) });
                this.setVtsRouteMarker(index, speed, lat, lng);
              }
              let vehicleDetail = this.routeVehicleList.find(item => item.vehicle == vehicle);
              if (vehicleDetail != null) {
                vehicleDetail.latLngList = latLng;
                vehicleDetail.speedList = speedList;
              }
              let strockColor = this.getVTSLineColor(index);
              let line = new google.maps.Polyline({
                path: latLng,
                strokeColor: strockColor,
                strokeWeight: 4,
              });
              this.vtsPolylines[index] = line;
              this.vtsPolylines[index].setMap(this.map);
            }
          }
        }
      );
    }
  }

  selectLines() {
    let routeVehicles = "";
    let description = "No Vehicle data update";
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        let element = <HTMLInputElement>document.getElementById("chkVehicle" + i);
        if (element.checked == true) {
          let vehicle = this.vehicleList[i]["vehicle"];
          let vehicleDetail = this.routeVehicleList.find(item => item.vehicle == vehicle);
          if (vehicleDetail != undefined) {
            if (vehicleDetail.isRoute == false) {
              vehicleDetail.isRoute = true;
              if (routeVehicles != "") {
                routeVehicles = routeVehicles + ",";
              }
              routeVehicles = routeVehicles + vehicle;
              let latLngList = vehicleDetail.latLngList;
              let speedList = vehicleDetail.speedList;
              if (latLngList.length > 0) {
                for (let j = 0; j < latLngList.length; j++) {
                  let lat = latLngList[j]["lat"];
                  let lng = latLngList[j]["lng"];
                  let speed = 0;
                  if (speedList.length > 0) {
                    if (speedList[j]["speed"] != null) {
                      speed = speedList[j]["speed"];
                    }
                  }
                  this.getLinesInRoute(lat, lng, speed);
                }
              }
              let delail = this.vehicleList.find(item => item.vehicle == vehicle);
              if (delail != undefined) {
                delail.isDone = 1;
              }
            }
          }
        }
      }

      if (routeVehicles != "") {
        this.saveRouteVehicle(routeVehicles);
        description = routeVehicles;
        this.commonService.setAlertMessage("success", "Auto route selection applied for vehicles " + routeVehicles);
      }

      setTimeout(() => {
        let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
        let year = this.selectedDate.split("-")[0];
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + year + "/" + monthName + "/" + this.selectedDate;
        let dataInstance = this.db.list(dbPath + "/LineStatus").valueChanges().subscribe(
          data => {
            dataInstance.unsubscribe();
            this.progressData.savedLines = data.length;
            this.progressData.selectedLines = data.length;
            let element = <HTMLImageElement>document.getElementById("imgSync");
            element.src = "../../../assets/img/green_data.svg";
          });
      }, 2000);
    }
    this.saveEventHistory("Auto Apply", description);
  }

  saveEventHistory(eventName: any, description: any) {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let timestamp = new Date().getTime();
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + year + "/" + monthName + "/" + this.selectedDate + "/EventHistory/" + timestamp;

    const data = {
      by: this.userId,
      name: eventName,
      time: this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond(),
      desc: description
    }
    this.db.database.ref(dbPath).set(data);
  }

  getLinesInRoute(lat: any, lng: any, speed: any) {
    if (speed <= 15) {
      if (this.wardLineLatLng.length > 0) {
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;
        for (let i = 0; i < this.wardLineLatLng.length; i++) {
          let distance = this.commonService.getDistanceFromLatLonInKm(lat, lng, this.wardLineLatLng[i]["lat"], this.wardLineLatLng[i]["lng"]);
          if (distance < 30) {
            let lineNo = this.wardLineLatLng[i]["lineNo"];
            let lineDetail = this.lines.find(item => item.lineNo == lineNo);
            if (lineDetail != undefined) {
              lineDetail.count = lineDetail.count + 1;
              this.wardLineLatLng[i]["isCovered"] = "yes";
              let detail = this.wardLineLatLng.filter(item => item.lineNo == lineNo && item.isCovered == "yes");
              if (detail.length > 2) {
                let time = this.commonService.getCurrentTimeWithSecond();
                time = time + "-" + this.userId + "-" + this.toDayDate;
                let strokeColor = lineDetail.strokeColor;
                if (lineDetail.strokeColor != this.strockColorDone) {
                  this.db.database.ref(dbPath + "/LineStatus/" + lineNo).set(time);
                }
                lineDetail.strokeColor = this.strockColorDone;
                strokeColor = lineDetail.strokeColor;
                var polyOptions = {
                  strokeColor: strokeColor,
                  strokeOpacity: 1.0,
                  strokeWeight: Number(localStorage.getItem("strokeWeight"))
                }
                for (let j = 0; j < this.lines.length; j++) {
                  if (this.lines[j]["lineNo"] == lineNo) {
                    let line = new google.maps.Polyline(this.polylines[j]);
                    line.setOptions(polyOptions);
                    this.polylines[j]["strokeColor"] = strokeColor;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  saveRouteVehicle(vehicle: any) {
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/routeVehicles";
    let routeVehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        routeVehicleInstance.unsubscribe();
        if (data == null) {
          this.db.object(dbPath).set(vehicle);
        }
        else {
          let vehicleList = vehicle.split(',');
          let preVehicleList = data.split(',');
          let vehicles = "";
          for (let i = 0; i < vehicleList.length; i++) {
            let isData = false;
            for (let j = 0; j < preVehicleList.length; j++) {
              if (vehicleList[i] == preVehicleList[j]) {
                j = preVehicleList.length;
                isData = true;
              }
            }
            if (isData == false) {
              if (vehicles != "") { vehicles = vehicles + "," };
              vehicles = vehicles + vehicleList[i];
            }
          }
          vehicles = vehicles + "," + data.toString();
          this.db.object(dbPath).set(vehicles);
        }
      }
    );
  }

  setVtsRouteMarker(index: any, speed: any, lat: any, lng: any) {
    let lt = lat;
    let lg = lng;
    let markerURL = "../../../assets/img/bluemarker.png";
    if (speed > 15) {
      markerURL = "../../../assets/img/maroonmarker.png";
    }
    let marker = new google.maps.Marker({
      position: { lat: Number(lt), lng: Number(lg) },
      map: this.map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(10, 15),
        origin: new google.maps.Point(0, 0),
      },
    });
    this.markerList.push({ index: index, speed: speed, marker: marker });
    if (this.isShowMarker == false) {
      marker.setMap(null);
    }
  }

  showHideMarkers(showStatus: any) {
    if (showStatus == 'hide') {
      this.isShowMarker = false;
      $(this.iconDone).hide();
      $(this.iconPending).show();
    }
    else {
      this.isShowMarker = true;
      $(this.iconDone).show();
      $(this.iconPending).hide();
    }
    if (this.isShowMarker == true) {
      if (this.vehicleList.length > 0) {
        for (let i = 0; i < this.vehicleList.length; i++) {
          let element = <HTMLInputElement>document.getElementById("chkVehicle" + i);
          if (element.checked == true) {
            if (this.markerList.length > 0) {
              for (let j = 0; j < this.markerList.length; j++) {
                if (this.markerList[j]["marker"] != null) {
                  if (this.markerList[j]["index"] == i) {
                    this.markerList[j]["marker"].setMap(this.map);
                  }
                }
              }
            }
          }
        }
      }
    }
    else {
      if (this.markerList.length > 0) {
        for (let i = 0; i < this.markerList.length; i++) {
          if (this.markerList[i]["marker"] != null) {
            this.markerList[i]["marker"].setMap(null);
          }
        }
      }
    }
  }

  getVTSLineColor(index: any) {
    let color = "#154360";
    if (index == 1) {
      color = "#6c0000";
    }
    else if (index == 2) {
      color = "#5c12eb";
    }
    else if (index == 3) {
      color = "#9e00a1";
    }
    else if (index == 4) {
      color = "#040274";
    }
    else if (index == 5) {
      color = "#494a49";
    }
    else if (index == 6) {
      color = "#028b7e";
    }
    return color;
  }

  //#endregion

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.setOptions({ clickableIcons: false });
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  hideSetting() {
    let element = <HTMLElement>document.getElementById("collapsetwo");
    let className = element.className;
    $("#collapsetwo").removeClass(className);
    $("#collapsetwo").addClass("panel-collapse collapse in");
  }

  openModel(content: any) {

    if (this.selectedWard == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      this.hideSetting();
      return;
    }
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let height = 145;
    let width = 350;
    let marginTop = "0px";
    marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
    $('div .modal-dialog-centered').css("margin-top", "26px");
    this.hideSetting();
  }

  closeModel() {
    this.modalService.dismissAll();
    this.hideSetting();
  }

  clearListeners() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        google.maps.event.removeListener(this.instancesList[i]["instances"]);
      }
    }
    this.instancesList = [];
  }

  ngOnDestroy() {
    if (this.eventInstance != null) {
      this.eventInstance.unsubscribe();
    }
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
  lastShowDate: string;
  selectedLines: number;
  savedLines: number;
}