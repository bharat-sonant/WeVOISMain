/// <reference types="@types/googlemaps" />

import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

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
    this.vtsPolylines = [];
    this.vehicleList = [];
    $(this.ddlWard).val(filterVal);
    $(this.ddlWardNav).val(filterVal);
    this.selectedWard = filterVal;
    this.setWardBoundary();
    this.showHideBoundariesHtml();
    this.getWardLineStatus();
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

  //#endregion

  //#region vehicle 

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
      let dbPath = "BVGRoutes/" + this.selectedDate + "/main";
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
  }

  addVehicleList(vehicleNo: any) {
    let latLng = [];
    let message = "Route not Imported";
    let showCheckBox = 0;
    let detail = this.vtsVehicleList.find(item => item.vehicle == vehicleNo);
    if (detail != undefined) {
      message = "Show Route";
      showCheckBox = 1;
    }
    this.vehicleList.push({ vehicle: vehicleNo, latLng: latLng, showCheckBox: showCheckBox, message: message });
    $(this.txtVehicle).val("");
    $(this.txtVehicleNav).val("");
    this.commonService.setAlertMessage("success", "Vehicle added successfully !!!");
  }

  getVtsRoute(vehicle: any, index: any) {
    let element = <HTMLInputElement>document.getElementById("chkVehicle" + index);
    if (element.checked == true) {
      if (this.vtsPolylines[index] != null) {
        this.vtsPolylines[index].setMap(this.map);
      }
      else {
        this.getVtsVehicleRoute(vehicle, index);
      }
    }
    else {
      if (this.vtsPolylines[index] != null) {
        this.vtsPolylines[index].setMap(null);
      }
    }
  }

  getVtsVehicleRoute(vehicle: any, index: any) {
    let detail = this.vtsVehicleList.find(item => item.vehicle == vehicle);
    if (detail != undefined) {
      let dbPath = "BVGRoutes/" + this.selectedDate + "/" + vehicle;
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
                latLng.push({ lat: Number(lat), lng: Number(lng) });
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

  getVTSLineColor(index: any) {
    let color = "#0614f4";
    if (index == 1) {
      color = "orange";
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