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
  localStorageDate: any;
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
    // localStorage.removeItem("jmapWasteCollectionLine");
    // localStorage.removeItem("jmapWardSummaryList");
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.selectedWard = "0";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZoneList();
    this.setDefaultLocalStorage();
    this.setDefaultDate();
    this.setHeight();
    this.setMaps();
    this.showHideAnalysisDoneHtml("hide");

  }

  getZoneList() {
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
  }

  setDefaultArrayList() {
    this.lines = [];
    this.polylines = [];
    this.vtsPolylines = [];
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
    this.removePreviousLocalStorage();
  }

  removePreviousLocalStorage() {
    let localStorageDate = this.commonService.getPreviousDate(this.toDayDate, 5);

    // ward lines 

    let wardCollectionList = JSON.parse(localStorage.getItem("jmapWasteCollectionLine"));
    if (wardCollectionList != null) {
      let tempList = [];
      for (let i = 0; i < wardCollectionList.length; i++) {
        if (new Date(wardCollectionList[i]["date"]) >= new Date(localStorageDate)) {
          tempList.push({ date: wardCollectionList[i]["date"], ward: wardCollectionList[i]["ward"], lineNo: wardCollectionList[i]["lineNo"], latlng: wardCollectionList[i]["latlng"], color: wardCollectionList[i]["color"], dateTime: wardCollectionList[i]["dateTime"] });
        }
      }
      localStorage.setItem("jmapWasteCollectionLine", JSON.stringify(tempList));
    }
    // summary
    let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
    if (summaryList != null) {
      let tempList = [];
      for (let i = 0; i < summaryList.length; i++) {
        if (new Date(summaryList[i]["date"]) >= new Date(localStorageDate)) {
          let workPerc = 0;
          let coveredLength = 0;
          let penalty = 0;
          let analysisDone = "No";
          let vehicles = "";
          if (summaryList[i]["workPerc"] != null) {
            workPerc = Number(summaryList[i]["workPerc"]);
          }
          if (summaryList[i]["coveredLength"] != null) {
            coveredLength = Number(summaryList[i]["coveredLength"]);
          }
          if (summaryList[i]["penalty"] != null) {
            penalty = Number(summaryList[i]["penalty"]);
          }
          if (summaryList[i]["analysisDone"] != null) {
            analysisDone = summaryList[i]["analysisDone"];
          }
          if (summaryList[i]["vehicles"] != null) {
            vehicles = summaryList[i]["vehicles"];
          }
          tempList.push({ ward: summaryList[i]["ward"], date: summaryList[i]["date"], workPerc: workPerc, coveredLength: coveredLength, penalty: penalty, analysisDone: analysisDone, vehicles: vehicles });
        }
      }
      localStorage.setItem("jmapWardSummaryList", JSON.stringify(tempList));
    }
  }

  changeZoneSelection(filterVal: any) {
    $(this.ddlZone).val(filterVal);
    $(this.ddlZoneNav).val(filterVal);
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
    this.map.setOptions({ clickableIcons: false });
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

  showHideAnalysisDoneHtml(type: any) {
    if (type == "hide") {
      $(this.iconDone).hide();
      $(this.iconPending).show();
      $(this.iconDoneNav).hide();
      $(this.iconPendingNav).show();
    }
    else {
      $(this.iconDone).show();
      $(this.iconPending).hide();
      $(this.iconDoneNav).show();
      $(this.iconPendingNav).hide();
    }
  }

  resetAll() {
    this.resetMap();
    this.resetProgressData();
    this.isBoundaryShow = true;
    this.showHideBoundariesHtml();
    this.showHideAnalysisDoneHtml("hide");
    $(this.txtPenalty).val("0");
    $(this.txtPenaltyNav).val("0");
    this.lines = [];
    this.vehicleList = [];
    this.wardLineLengthList = [];
  }

  resetProgressData() {
    this.progressData.coveredLength = "0";
    this.progressData.wardLength = "0";
    this.progressData.workPercentage = "0%";
    this.progressData.penalty = 0;
    this.progressData.coveredLengthMeter = 0;
    this.progressData.totalWardLength = 0;
    this.progressData.workPercentageNumber = 0;
  }

  resetMap() {
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
    if (this.wardBoundary != null) {
      this.wardBoundary.setMap(null);
    }
    this.wardBoundary = null;
  }

  changeWardSelection(filterVal: any) {
    $(this.ddlWard).val(filterVal);
    $(this.ddlWardNav).val(filterVal);
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
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.getWardData();
  }

  getWardData() {
    if (this.selectedWard == "0" || this.selectedWard == null) {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    this.resetAll();
    this.showLoader();
    this.getWardTotalLength();
    this.getWardLineLength();
    this.getProgressFromLocalStorage();
    this.setWardBoundary();
    this.getWardLines();
  }

  showLoader() {
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 2000);
  }

  getWardLineLength() {
    this.commonService.getWardLineLength(this.selectedWard).then((lengthList: any) => {
      if (lengthList != null) {
        this.wardLineLengthList = JSON.parse(lengthList);
      }
    });
  }

  getProgressFromLocalStorage() {
    let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
    if (summaryList == null) {
      this.getProgressDetail();
    }
    else {
      let summaryDetail = summaryList.find(item => item.date == this.selectedDate && item.ward == this.selectedWard);
      if (summaryDetail == undefined) {
        this.getProgressDetail();
      }
      else {
        this.progressData.workPercentageNumber = Number(summaryDetail.workPerc);
        this.progressData.workPercentage = summaryDetail.workPerc + "%";
        this.progressData.coveredLengthMeter = Number(summaryDetail.coveredLength);
        this.progressData.coveredLength = (parseFloat(summaryDetail.coveredLength) / 1000).toFixed(2);
        $(this.txtPenalty).val(summaryDetail.penalty);
        $(this.txtPenaltyNav).val(summaryDetail.penalty);
        this.progressData.penalty = summaryDetail.penalty;
        if (summaryDetail.analysisDone == "yes") {
          this.showHideAnalysisDoneHtml("show");
        }
        if (summaryDetail.vehicles != "") {
          let vechileList = summaryDetail.vehicles.split(',');
          if (vechileList.length > 0) {
            for (let i = 0; i < vechileList.length; i++) {
              if (vechileList[i] != "") {
                this.vehicleList.push({ vehicle: vechileList[i] });
              }
            }
          }
        }
      }
    }
  }

  getProgressDetail() {
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    let summaryInstance = this.db.object(dbPath).valueChanges().subscribe((summaryData) => {
      summaryInstance.unsubscribe();
      let workPerc = 0;
      let coveredLength = 0;
      let penalty = 0;
      let analysisDone = "no";
      let vehicles = "";
      if (summaryData != null) {
        if (summaryData["workPerc"] != null) {
          workPerc = Number(summaryData["workPerc"]);
          this.progressData.workPercentageNumber = Number(summaryData["workPerc"]);
          this.progressData.workPercentage = summaryData["workPerc"] + "%";
        } else {
          this.progressData.workPercentage = "0%";
          this.progressData.workPercentageNumber = 0;
        }
        if (summaryData["coveredLength"] != null) {
          coveredLength = Number(summaryData["coveredLength"]);
          this.progressData.coveredLengthMeter = Number(summaryData["coveredLength"]);
          this.progressData.coveredLength = (parseFloat(summaryData["coveredLength"]) / 1000).toFixed(2);
        } else {
          this.progressData.coveredLength = "0.00";
          this.progressData.coveredLengthMeter = 0;
        }
        if (summaryData["vehicles"] != null) {
          vehicles = summaryData["vehicles"];
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
          penalty = Number(summaryData["penalty"]);
          $(this.txtPenalty).val(summaryData["penalty"]);
          $(this.txtPenaltyNav).val(summaryData["penalty"]);
          this.progressData.penalty = summaryData["penalty"];
        }
        if (summaryData["analysisDone"] != null) {
          analysisDone = "yes";
          this.showHideAnalysisDoneHtml("show");
        }
      }
      let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
      if (summaryList == null) {
        summaryList = [];
      }
      summaryList.push({ ward: this.selectedWard, date: this.selectedDate, workPerc: workPerc, coveredLength: coveredLength, penalty: penalty, analysisDone: analysisDone, vehicles: vehicles });
      localStorage.setItem("jmapWardSummaryList", JSON.stringify(summaryList));
    });
  }

  setWardBoundary() {
    this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
      this.wardBoundary = wardKML;
    });
  }

  drowVTSVehicleRoute() {
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        this.drowVTSRoute(this.vehicleList[i]["vehicle"], i + 1, i);
      }
    }
  }

  getWardLines() {
    this.drowVTSVehicleRoute();
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
                    color: this.strockColorNotDone,
                    dist: dist
                  });
                }
              }
            }
          }
          let wardCollectionList = JSON.parse(localStorage.getItem("jmapWasteCollectionLine"));
          if (wardCollectionList == null) {
            this.plotLinesOnMap();
          }
          else {
            let collectionList = wardCollectionList.filter(item => item.date == this.selectedDate && item.ward == this.selectedWard);
            if (collectionList.length > 0) {
              this.progressData.lastShowDate = collectionList[0]["dateTime"];
              this.plotLinesOnMapStorage(collectionList);
            }
            else {
              this.plotLinesOnMap();
            }

          }
        }
      }
    });
  }

  plotLinesOnMapStorage(collectionList: any) {
    for (let i = 0; i < collectionList.length; i++) {
      let lineNo = collectionList[i]["lineNo"];
      let latlngs = collectionList[i]["latlng"];
      let strockColor = collectionList[i]["color"];
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
    }
  }

  plotLinesOnMap() {
    if (this.lines.length > 0) {
      for (let i = 0; i < this.lines.length; i++) {
        let lineNo = this.lines[i]["lineNo"];
        let latlngs = this.lines[i]["latlng"];
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
        let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
          status => {
            lineStatusInstance.unsubscribe();
            let strockColor = this.strockColorNotDone;
            if (status != null) {
              strockColor = this.strockColorDone;
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
            this.setLinesLocalStorage(lineNo, latlngs, strockColor);
            this.setClickInstance(line, lineNo, i);
          }
        );
      }
    }
  }

  setLinesLocalStorage(lineNo: any, latlng: any, color: any) {
    let wasteCollectionLine = JSON.parse(localStorage.getItem("jmapWasteCollectionLine"));
    if (wasteCollectionLine == null) {
      wasteCollectionLine = [];
    }
    this.progressData.lastShowDate = this.commonService.getTodayDateTime();
    wasteCollectionLine.push({ date: this.selectedDate, ward: this.selectedWard, lineNo: lineNo, latlng: latlng, color: color, dateTime: this.commonService.getTodayDateTime() });
    localStorage.setItem("jmapWasteCollectionLine", JSON.stringify(wasteCollectionLine));
  }

  setClickInstance(line: any, lineNo: any, index: any) {
    let progresData = this.progressData;
    let dbEvent = this.db;
    let lines = this.lines;
    let polylines = this.polylines;
    let userId = this.userId;
    let selectedWard = this.selectedWard;
    let selectedDate = this.selectedDate;
    let strockColorNotDone = this.strockColorNotDone;
    let strockColorDone = this.strockColorDone;
    let dbPathTime = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
    let dbPathSummary = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";

    google.maps.event.addListener(line, 'click', function (h) {
      let dist = 0;
      let date = new Date();
      let hour = date.getHours();
      let min = date.getMinutes();
      let second = date.getSeconds();
      let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;

      let stockColor = strockColorNotDone;
      let lineDetail = lines.find(item => item.lineNo == lineNo);
      if (lineDetail != undefined) {
        dist = Number(lineDetail.dist);
        let wardTotalLength = progresData.totalWardLength;
        let wardCoveredDistance = progresData.coveredLengthMeter;
        let workPercentage = 0;
        stockColor = lineDetail.color;
        if (stockColor == strockColorNotDone) {
          dbEvent.database.ref(dbPathTime).set(time);
          lineDetail.color = strockColorDone;
          stockColor = lineDetail.color;
          wardCoveredDistance = wardCoveredDistance + dist;
        }
        else {
          dbEvent.database.ref(dbPathTime).set(null);
          lineDetail.color = strockColorNotDone;
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
        let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
        if (summaryList != null) {
          let summaryDetail = summaryList.find(item => item.date == selectedDate && item.ward == selectedWard);
          if (summaryDetail != undefined) {
            summaryDetail.workPerc = Number(workPercentage);
            summaryDetail.coveredLength = wardCoveredDistance.toFixed(0);
          }
          localStorage.setItem("jmapWardSummaryList", JSON.stringify(summaryList));
        }
        let wardCollectionList = JSON.parse(localStorage.getItem("jmapWasteCollectionLine"));
        if (wardCollectionList != null) {
          let collectionDetail = wardCollectionList.find(item => item.date == selectedDate && item.ward == selectedWard && item.lineNo == lineNo);
          if (collectionDetail != null) {
            collectionDetail.color = lineDetail.color;
          }
          localStorage.setItem("jmapWasteCollectionLine", JSON.stringify(wardCollectionList));
        }
      }
    });
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
              let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
              if (summaryList != null) {
                let summaryDetail = summaryList.find(item => item.date == this.selectedDate && item.ward == this.selectedWard);
                if (summaryDetail != undefined) {
                  summaryDetail.workPerc = Number(workPercentage);
                  summaryDetail.coveredLength = wardCoveredDistance.toFixed(0);
                }
                localStorage.setItem("jmapWardSummaryList", JSON.stringify(summaryList));
              }
            }
            let wardCollectionList = JSON.parse(localStorage.getItem("jmapWasteCollectionLine"));
            if (wardCollectionList != null) {
              let newList = [];
              for (let i = 0; i < wardCollectionList.length; i++) {
                if (wardCollectionList[i]["date"] == this.selectedDate && wardCollectionList[i]["ward"] == this.selectedWard) {

                }
                else {
                  newList.push({ date: wardCollectionList[i]["date"], ward: wardCollectionList[i]["ward"], lineNo: wardCollectionList[i]["lineNo"], latlng: wardCollectionList[i]["latlng"], color: wardCollectionList[i]["color"], dateTime: wardCollectionList[i]["dateTime"] });

                }
              }
              localStorage.setItem("jmapWasteCollectionLine", JSON.stringify(newList));
            }
            this.getWardData();
          }
        }
      });
    this.hideSetting();
  }

  resetData() {
    let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
    if (summaryList != null) {
      let tempList = [];
      for (let i = 0; i < summaryList.length; i++) {
        if (summaryList[i]["date"] == this.selectedDate && summaryList[i]["ward"] == this.selectedWard) { }
        else {
          let workPerc = 0;
          let coveredLength = 0;
          let penalty = 0;
          let analysisDone = "No";
          let vehicles = "";
          if (summaryList[i]["workPerc"] != null) {
            workPerc = Number(summaryList[i]["workPerc"]);
          }
          if (summaryList[i]["coveredLength"] != null) {
            coveredLength = Number(summaryList[i]["coveredLength"]);
          }
          if (summaryList[i]["penalty"] != null) {
            penalty = Number(summaryList[i]["penalty"]);
          }
          if (summaryList[i]["analysisDone"] != null) {
            analysisDone = summaryList[i]["analysisDone"];
          }
          if (summaryList[i]["vehicles"] != null) {
            vehicles = summaryList[i]["vehicles"];
          }
          tempList.push({ ward: summaryList[i]["ward"], date: summaryList[i]["date"], workPerc: workPerc, coveredLength: coveredLength, penalty: penalty, analysisDone: analysisDone, vehicles: vehicles });
        }
      }
      localStorage.setItem("jmapWardSummaryList", JSON.stringify(tempList));
    }

    let wardCollectionList = JSON.parse(localStorage.getItem("jmapWasteCollectionLine"));
    if (wardCollectionList != null) {
      let tempList = [];
      for (let i = 0; i < wardCollectionList.length; i++) {
        if (wardCollectionList[i]["date"] == this.selectedDate && wardCollectionList[i]["ward"] == this.selectedWard) {
        }
        else {
          tempList.push({ date: wardCollectionList[i]["date"], ward: wardCollectionList[i]["ward"], lineNo: wardCollectionList[i]["lineNo"], latlng: wardCollectionList[i]["latlng"], color: wardCollectionList[i]["color"], dateTime: wardCollectionList[i]["dateTime"] });
        }
      }
      localStorage.setItem("jmapWasteCollectionLine", JSON.stringify(tempList));
    }
    this.getWardData();
  }

  resetAllLines() {
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
        this.setLocalStorageDetail(lineNo, this.strockColorNotDone, 0);
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
          strokeColor: this.strockColorDone,
          strokeOpacity: 1.0,
          strokeWeight: this.strokeWeight
        }
        let lineNo = this.lines[j]["lineNo"];
        this.polylines[j]["strokeColor"] = this.strockColorDone;
        this.lines[j]["color"] = this.strockColorDone;
        line.setOptions(polyOptions);
        let date = new Date();
        let hour = date.getHours();
        let min = date.getMinutes();
        let second = date.getSeconds();
        let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;
        let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
        this.db.database.ref(dbPath).set(time);
        this.setLocalStorageDetail(lineNo, this.strockColorDone, 100);
      }
      let wardCoveredDistance = this.progressData.totalWardLength;
      let workPercentage = 100;
      const data1 = {
        analysedBy: this.userId,
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

  setLocalStorageDetail(lineNo: any, strockColor: any, workPercentage: any) {
    let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
    if (summaryList != null) {
      let summaryDetail = summaryList.find(item => item.date == this.selectedDate && item.ward == this.selectedWard);
      if (summaryDetail != undefined) {
        summaryDetail.workPerc = Number(workPercentage);
        summaryDetail.coveredLength = this.progressData.totalWardLength.toFixed(0);
      }
      localStorage.setItem("jmapWardSummaryList", JSON.stringify(summaryList));
    }
    let wardCollectionList = JSON.parse(localStorage.getItem("jmapWasteCollectionLine"));
    if (wardCollectionList != null) {
      let collectionDetail = wardCollectionList.find(item => item.date == this.selectedDate && item.ward == this.selectedWard && item.lineNo == lineNo);
      if (collectionDetail != null) {
        collectionDetail.color = strockColor;
      }
      localStorage.setItem("jmapWasteCollectionLine", JSON.stringify(wardCollectionList));
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

  getCurrentStrokeWeight(event: any) {
    if (event.key == "Enter") {
      let strokeWeight = $(this.txtStrokeWeight).val();
      if (strokeWeight == "") {
        strokeWeight = $(this.txtStrokeWeightNav).val();
        if (strokeWeight == "") {
          this.commonService.setAlertMessage("error", "Please enter line no. !!!");
          return;
        }
      }
      this.strokeWeight = Number(strokeWeight);
      $(this.txtStrokeWeight).val(this.strokeWeight);
      $(this.txtStrokeWeightNav).val(this.strokeWeight);
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
    $(this.txtPreDate).val(filterVal);
    $(this.txtPreDateNav).val(filterVal);
  }

  showBounderis() {
    if (this.isBoundaryShow == true) {
      this.isBoundaryShow = false;
      this.showHideBoundariesHtml();
      if (this.wardBoundary != null) {
        this.wardBoundary.setMap(null);
      }
      this.wardBoundary = null;
    }
    else {
      this.isBoundaryShow = true;
      this.showHideBoundariesHtml();
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
    $(this.txtVehicle).val("");
    $(this.txtVehicleNav).val("");
    let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
    if (summaryList != null) {
      let summaryDetail = summaryList.find(item => item.date == this.selectedDate && item.ward == this.selectedWard);
      if (summaryDetail != undefined) {
        summaryDetail.vehicles = vehicles;
      }
      localStorage.setItem("jmapWardSummaryList", JSON.stringify(summaryList));
    }
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
    let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
    if (summaryList != null) {
      let summaryDetail = summaryList.find(item => item.date == this.selectedDate && item.ward == this.selectedWard);
      if (summaryDetail != undefined) {
        summaryDetail.vehicles = vehicles;
      }
      localStorage.setItem("jmapWardSummaryList", JSON.stringify(summaryList));
    }
    this.commonService.setAlertMessage("success", "Vehicle deleted successfully !!!");
  }

  saveVTSTrackingDone() {
    if (this.selectedWard == "0" || this.selectedWard == null) {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    let penalty = $(this.txtPenalty).val();
    if (penalty == "" || penalty == "0") {
      penalty = $(this.txtPenaltyNav).val();
      if (penalty == "" || penalty == "0") {
        penalty = 0;
      }
    }
    let dbPath = "WasteCollectionInfo/" + this.selectedWard + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
    this.db.object(dbPath).update({ analysisDone: "yes", analysedBy: localStorage.getItem("userID"), penalty: penalty });
    this.showHideAnalysisDoneHtml("show");
    this.progressData.penalty = Number(penalty);
    $(this.txtPenalty).val(penalty);
    $(this.txtPenaltyNav).val(penalty);
    let summaryList = JSON.parse(localStorage.getItem("jmapWardSummaryList"));
    if (summaryList != null) {
      let summaryDetail = summaryList.find(item => item.date == this.selectedDate && item.ward == this.selectedWard);
      if (summaryDetail != undefined) {
        summaryDetail.penalty = Number(penalty);
        summaryDetail.analysisDone = "yes";
      }
      localStorage.setItem("jmapWardSummaryList", JSON.stringify(summaryList));
    }
    this.commonService.setAlertMessage("success", "Analysis done for ward " + this.selectedWard + " done !!!");
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
  lastShowDate: string;
}
