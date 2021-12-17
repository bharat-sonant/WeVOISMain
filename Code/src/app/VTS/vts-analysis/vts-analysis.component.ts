/// <reference types="@types/googlemaps" />

import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { count } from "rxjs/operators";

@Component({
  selector: 'app-vts-analysis',
  templateUrl: './vts-analysis.component.html',
  styleUrls: ['./vts-analysis.component.scss']
})
export class VtsAnalysisComponent implements OnInit {

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
  wardLineLengthList: any[];
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
  isShowMarker = false;
  progressData: progressDetail = {
    totalWardLength: 0,
    wardLength: "0",
    coveredLength: "0",
    workPercentage: "0%",
    coveredLengthMeter: 0,
    workPercentageNumber: 0,
    penalty: 0,
    lastShowDate: this.commonService.getTodayDateTime()
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

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
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
    this.wardLineLengthList = [];
    this.wardLineStatus = [];
    this.vtsVehicleList = [];
    this.markerList = [];
    this.wardLineLatLng = [];
    this.routeVehicleList = [];
  }

  setDefaultLocalStorage() {
    this.userId = localStorage.getItem("userID");
    if (localStorage.getItem("strokeWeight") != null) {
      this.strokeWeight = Number(localStorage.getItem("strokeWeight"));
      $(this.txtStrokeWeight).val(this.strokeWeight);
      $(this.txtStrokeWeightNav).val(this.strokeWeight);
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
    this.isBoundaryShow = true;
    if (this.wardBoundary != null) {
      this.wardBoundary.setMap(null);
    }
    this.wardBoundary = null;
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
          if (data["routeVehicles"] != null) {
            let vehicles = data["routeVehicles"].split(',');
            for (let i = 0; i < vehicles.length; i++) {
              this.routeVehicleList.push({ vehicle: vehicles[i] });
            }
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
        }
        this.setWardLines();
      }
    );
  }


  setWardLines() {
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
    if (this.selectedWard != "0") {
      this.httpService.get("../../assets/jsons/WardLines/" + this.cityName + "/" + this.selectedWard + ".json").subscribe(data => {
        if (data != null) {
          var keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let newLineNo = 1;
            for (let i = 0; i < keyArray.length; i++) {
              this.wardLines = keyArray.length;
              let lineNo = keyArray[i];
              //if (lineNo == "94") {
              if (data[lineNo] != null) {
                var latLng = [];
                if (data[lineNo]["points"] != undefined) {
                  if (data[lineNo]["points"].length > 0) {
                    for (let j = 0; j < data[lineNo]["points"].length; j++) {
                      latLng = [];
                      if (data[lineNo]["points"][j + 1] != null) {
                        latLng.push({ lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1] });
                        latLng.push({ lat: data[lineNo]["points"][j + 1][0], lng: data[lineNo]["points"][j + 1][1] });
                       // this.wardLineLatLng.push({lineNo:newLineNo,lat:data[lineNo]["points"][j][0],lng:data[lineNo]["points"][j][1]});
                        //this.wardLineLatLng.push({lineNo:newLineNo,lat:data[lineNo]["points"][j+1][0],lng:data[lineNo]["points"][j+1][1]});
                        this.getPoints(newLineNo, data[lineNo]["points"][j][0], data[lineNo]["points"][j][1], data[lineNo]["points"][j + 1][0], data[lineNo]["points"][j + 1][1]);
                        let strokeColor = this.strockColorNotDone;
                        // let wardLinsStatusDetail = this.wardLineStatus.find(item => item.lineNo == newLineNo);
                        // if (wardLinsStatusDetail != undefined) {
                        // strokeColor = this.strockColorDone;
                        // }
                        this.lines.push({
                          lineNo: newLineNo,
                          latlng: latLng,
                          strokeColor: strokeColor
                        });
                        newLineNo++;
                      }
                      //this.setLineMarker(Number(data[lineNo]["points"][j][0]), Number(data[lineNo]["points"][j][1]))
                    }
                  }
                }
              }
              //  }
            }
            this.plotLinesOnMap();
          }
        }
      });
    }
  }

  /*
    setWardLines() {
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
      if (this.selectedWard != "0") {
        this.httpService.get("../../assets/jsons/WardLines/" + this.cityName + "/" + this.selectedWard + ".json").subscribe(data => {
          if (data != null) {
            var keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                this.wardLines = keyArray.length;
                let lineNo = keyArray[i];
                let newLineNo=1;
                //if (lineNo == "94") {
                  if (data[lineNo] != null) {
                    var latLng = [];
                    if (data[lineNo]["points"] != undefined) {
                      if (data[lineNo]["points"].length > 0) {
                        for (let j = 0; j < data[lineNo]["points"].length; j++) {
                          latLng.push({ lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1] });
                          if (data[lineNo]["points"][j + 1] != null) {
                            this.getPoints(lineNo, data[lineNo]["points"][j][0], data[lineNo]["points"][j][1], data[lineNo]["points"][j + 1][0], data[lineNo]["points"][j + 1][1]);
                          }
                          this.setLineMarker(Number(data[lineNo]["points"][j][0]), Number(data[lineNo]["points"][j][1]))
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
              //  }
              }
              this.plotLinesOnMap();
            }
          }
        });
      }
    }
    */

  getPoints(lineNo: any, lat1: any, lng1: any, lat2: any, lng2: any) {
    let d = Math.sqrt((lat1 - lat2) * (lat1 - lat2) + (lng1 - lng2) * (lng1 - lng2)) / 100;
    let fi = Math.atan2(lng2 - lng1, lat2 - lat1);
    for (let i = 0; i <= 100; i++) {
      this.wardLineLatLng.push({ lineNo: lineNo, lat: (lat1 + i * d * Math.cos(fi)), lng: (lng1 + i * d * Math.sin(fi)) });
    }
  }

  setLineMarker(lat: any, lng: any) {
    let lt = lat;
    let lg = lng;
    let markerURL = "../../../assets/img/black-dot.png";
    let marker = new google.maps.Marker({
      position: { lat: Number(lt), lng: Number(lg) },
      map: this.map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(10, 10),
        origin: new google.maps.Point(0, 0),
      },
    });
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
    let lines = this.lines;
    let polylines = this.polylines;
    let strockColorNotDone = this.strockColorNotDone;
    let strockColorDone = this.strockColorDone;
    let userId = this.userId;
    let dbEvent = this.db;
    let commonService = this.commonService;
    let dbEventPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;
    google.maps.event.addListener(line, 'click', function (h) {
      let time = commonService.getCurrentTimeWithSecond();
      time = time + "-" + userId;
      let strokeColor = strockColorNotDone;
      let lineDetail = lines.find(item => item.lineNo == lineNo);
      if (lineDetail != undefined) {
        strokeColor = lineDetail.strokeColor;
        if (strokeColor == strockColorNotDone) {
          dbEvent.database.ref(dbEventPath + "/LineStatus/" + lineNo).set(time);
          lineDetail.strokeColor = strockColorDone;
          strokeColor = lineDetail.strokeColor;
        }
        else {
          dbEvent.database.ref(dbEventPath + "/LineStatus/" + lineNo).set(null);
          lineDetail.strokeColor = strockColorNotDone;
          strokeColor = lineDetail.strokeColor;
        }
        var polyOptions = {
          strokeColor: strokeColor,
          strokeOpacity: 1.0,
          strokeWeight: Number(localStorage.getItem("strokeWeight"))
        }
        line.setOptions(polyOptions);
        polylines[index]["strokeColor"] = strokeColor;
      }
    });
  }


  //#endregion

  //#region   Top  Left Filter

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
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.vtsVehicleList = [];
    this.changeWardSelection(this.selectedWard);
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
    this.vehicleList = [];
    this.markerList = [];
    $(this.ddlWard).val(filterVal);
    $(this.ddlWardNav).val(filterVal);
    this.selectedWard = filterVal;
    let element = <HTMLInputElement>document.getElementById("chkApprove");
    let btnElement = <HTMLButtonElement>document.getElementById("btnApprove");
    element.checked = false;
    btnElement.disabled = true;
    $(this.divApproved).hide();
    this.setWardBoundary();
    this.showHideBoundariesHtml();
    this.getWardLineStatus();
    this.getSummary();
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
        this.polylines[j]["strokeColor"] = this.strockColorDone;
        this.lines[j]["strokeColor"] = this.strockColorDone;
        line.setOptions(polyOptions);
        let time = this.commonService.getCurrentTimeWithSecond();
        time = time + "-" + this.userId;
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
        this.db.database.ref(dbPath).set(time);
      }
    }
    this.commonService.setAlertMessage("success", "All lines selected !!!");
    this.closeModel();
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
                    // if (this.markerList[i]["index"] == i) {
                    this.markerList[i]["marker"].setMap(null);
                    // }
                  }
                }
              }
            }
          }
        }
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
        let lineNo = this.lines[j]["lineNo"];
        this.polylines[j]["strokeColor"] = this.strockColorNotDone;
        this.lines[j]["color"] = this.strockColorNotDone;
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
        this.db.database.ref(dbPath).set(null);
      }

      let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/";
      this.db.object(dbPath + "/routeVehicles").set(null);
      this.routeVehicleList = [];
      let date = this.commonService.getTodayDateTime();
      this.db.object(dbPath).update({ resetBy: this.userId, resetDateTime: date });
      this.commonService.setAlertMessage("success", "All lines resetted !!!");
      this.closeModel();
    }
  }


  setPreviousData() {
    let date = $(this.txtPreDate).val().toString();
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
            this.db.database.ref(dbPath).set(null);
            if (obj != null) {
              let keyArray = Object.keys(obj);
              for (let i = 0; i < keyArray.length; i++) {
                let lineNo = keyArray[i];
                let newPath = dbPath + "/" + lineNo;
                this.db.database.ref(newPath).set(obj[lineNo]);
              }
            }
            if (data["Summary"] != null) {
              if (data["Summary"]["vehicles"] != null) {
                dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
                this.db.object(dbPath).update({ vehicles: data["Summary"]["vehicles"] });
              }
              if (data["Summary"]["routeVehicles"] != null) {
                this.db.database.ref(dbPath + "/routeVehicles").set(data["Summary"]["routeVehicles"]);
              }
            }
            this.getWardLineStatus();
            this.getSummary();
            $(this.txtPreDate).val("");
          }
        }
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
              this.vehicleList.push({ vehicle: vehicleNo, latLng: latLng, showCheckBox: showCheckBox, message: message, cssClass: cssClass });
            });
        }
        else {
          let detail = this.vtsVehicleList.find(item => item.vehicle == vehicleNo);
          if (detail != undefined) {
            message = "Show Route";
            showCheckBox = 1;
            cssClass = "";
          }
          this.vehicleList.push({ vehicle: vehicleNo, latLng: latLng, showCheckBox: showCheckBox, message: message, cssClass: cssClass });
        }
      }
    }
  }

  removeVehicle(index: any) {
    let vehicleList = [];
    let vehicles = "";
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (i != index) {
        let latLng = [];
        let message = "Route not Imported";
        let showCheckBox = 0;
        let cssClass = "not-route-created";
        let detail = this.vtsVehicleList.find(item => item.vehicle == this.vehicleList[i]["vehicle"]);
        if (detail != undefined) {
          message = "Show Route";
          showCheckBox = 1;
          cssClass = "";
        }
        vehicleList.push({ vehicle: this.vehicleList[i]["vehicle"], latLng: latLng, showCheckBox: showCheckBox, message: message, cssClass: cssClass });
        if (vehicles != "") { vehicles = vehicles + "," }
        vehicles = vehicles + this.vehicleList[i]["vehicle"];
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
    this.commonService.setAlertMessage("success", "Vehicle deleted successfully !!!");
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
    let latLng = [];
    let message = "Route not Imported";
    let showCheckBox = 0;
    let cssClass = "not-route-created";
    let detail = this.vtsVehicleList.find(item => item.vehicle == vehicleNo);
    if (detail != undefined) {
      message = "Show Route";
      showCheckBox = 1;
      cssClass = "";
    }
    this.vehicleList.push({ vehicle: vehicleNo, latLng: latLng, showCheckBox: showCheckBox, message: message, cssClass: cssClass });
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
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ vehicles: vehicles });
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
      let isRoute = false;
      let vehicleDetail = this.routeVehicleList.find(item => item.vehicle == vehicle);
      if (vehicleDetail != null) {
        isRoute = true;
      }
      else {
        this.routeVehicleList.push({ vehicle: vehicle });
        this.saveRouteVehicle(vehicle);
      }
      let dbPath = "BVGRoutes/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + vehicle;
      let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          routeInstance.unsubscribe();
          if (data != null) {
            let routeList = data.toString().split('~');
            if (routeList.length > 0) {
              let latLng = [];
              for (let i = 0; i < routeList.length; i++) {
                let lat = routeList[i].split(',')[0];
                let lng = routeList[i].split(',')[1];
                let speed = 0;
                if (routeList[i].split(',')[2] != null) {
                  speed = Number(routeList[i].split(',')[2]);
                }
                latLng.push({ lat: Number(lat), lng: Number(lng) });
                if (isRoute == false) {
                  this.getLinesInRoute(Number(lat), Number(lng), speed);
                }
                this.setVtsRouteMarker(index, speed, lat, lng);
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
    else {
      this.commonService.setAlertMessage("error", "Sorry this vehicle not run on selected date !!!");
    }
  }


  getLinesInRoute(lat: any, lng: any, speed: any) {

    if (speed <= 15) {
      if (this.wardLineLatLng.length > 0) {
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;
        for (let i = 0; i < this.wardLineLatLng.length; i++) {
          let distance = this.commonService.getDistanceFromLatLonInKm(lat, lng, this.wardLineLatLng[i]["lat"], this.wardLineLatLng[i]["lng"]);
          if (distance < 3) {
            let lineNo = this.wardLineLatLng[i]["lineNo"];
            let lineDetail = this.lines.find(item => item.lineNo == lineNo);
            if (lineDetail != undefined) {
              let time = this.commonService.getCurrentTimeWithSecond();
              time = time + "-" + this.userId;
              let strokeColor = lineDetail.strokeColor;
              // this.db.database.ref(dbPath + "/LineStatus/" + lineNo).set(time);
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


  saveRouteVehicle(vehicle: any) {
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/routeVehicles";
    let routeVehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        routeVehicleInstance.unsubscribe();
        let vehicles = vehicle;
        if (data != null) {
          vehicles = data + "," + vehicle;
        }
        // this.db.object(dbPath).set(vehicles);
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
}
