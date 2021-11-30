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
  userId: any;
  isBoundaryShow = true;
  isLineShow = true;
  strockColorNotDone = "#fa0505";
  strockColorDone = "#0ba118";
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
    $(this.txtPreDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
    $(this.txtPreDateNav).val(this.selectedDate);
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
        this.commonService.setAlertMessage("error", "Please enter line no. !!!");
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
        this.commonService.setAlertMessage("error", "Please enter stroke weight. !!!");
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


  //#region Total Ward Length
  getWardTotalLength() {
    this.progressData.wardLength = "0.00";
    this.progressData.totalWardLength = 0;
    if (this.selectedWard != "0") {
      this.commonService.getWardTotalLength(this.selectedWard).then((totalLength) => {
        if (totalLength != null) {
          this.progressData.wardLength = (parseFloat(totalLength.toString()) / 1000).toFixed(2);
          this.progressData.totalWardLength = Number(totalLength);
        }
      });
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
                    this.lines.push({
                      lineNo: lineNo,
                      latlng: latLng,
                      color: this.strockColorNotDone
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
        let line = new google.maps.Polyline({
          path: latlngs,
          strokeColor: this.strockColorNotDone,
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
        strokeColor = lineDetail.color;
        if (strokeColor == strockColorNotDone) {
          dbEvent.database.ref(dbEventPath + "/LineStatus/" + lineNo).set(time);
          lineDetail.color = strockColorDone;
          strokeColor = lineDetail.color;
        }
        else {
          dbEvent.database.ref(dbEventPath + "/LineStatus/" + lineNo).set(null);
          lineDetail.color = strockColorNotDone;
          strokeColor = lineDetail.color;
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
    $(this.ddlWard).val(filterVal);
    $(this.ddlWardNav).val(filterVal);
    this.selectedWard = filterVal;
    this.setWardBoundary();
    this.showHideBoundariesHtml();
    this.setWardLines();
    this.getWardTotalLength();
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
