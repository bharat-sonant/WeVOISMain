/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-ward-survey-analysis",
  templateUrl: "./ward-survey-analysis.component.html",
  styleUrls: ["./ward-survey-analysis.component.scss"],
})
export class WardSurveyAnalysisComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  public mapRevisit: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal) { }

  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  polylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  lines: any[] = [];
  wardLineCount: any;
  zoneKML: any;
  allMarkers: any[] = [];
  lineNo: any;
  cityName: any;
  previousLine: any;
  centerPoint: any;
  houseMarker: any[] = [];
  db: any;
  scannedCardList: any[];
  revisitSurveyList: any[];

  progressData: progressDetail = {
    totalMarkers: 0,
    totalSurveyed: 0,
    totalLineMarkers: 0,
    totalLineSurveyed: 0,
    cardNo: "",
    cardType: "",
    name: "",
    totalRevisit: 0,
    totalLineRevisit: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.selectedZone = 0;
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.clearAllOnMap();
    this.selectedZone = filterVal;
    this.zoneKML = this.commonService.setKML(this.selectedZone, this.map);
    this.getWardDetail();
  }

  getWardDetail() {
    this.getWardLineCount();
    this.getTotalMarkers();
  }

  getTotalMarkers() {
    let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "/marked";
    let totalInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      totalInstance.unsubscribe();
      if (data != null) {
        this.progressData.totalMarkers = Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalHouseCount/" + this.selectedZone;
    let surveyedInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      surveyedInstance.unsubscribe();
      if (data != null) {
        this.progressData.totalSurveyed = Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalRevisitRequest/" + this.selectedZone;
    let revisitInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        revisitInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalRevisit = Number(data);
        }
      }
    );
  }

  getCurrentLineDetail(event: any) {
    if (event.key == "Enter") {
      let lineNo = $("#txtLineNo").val();
      if (lineNo == "") {
        this.commonService.setAlertMessage("error", "Please enter line no. !!!");
        return;
      }
      if (Number(lineNo) <= this.wardLineCount) {
        this.lineNo = lineNo;
        this.getHouseLineData();
      } else {
        this.commonService.setAlertMessage(
          "error",
          "Line no. not exist in ward !!!"
        );
        this.lineNo = 1;
        $("#txtLineNo").val(this.lineNo);
        this.getHouseLineData();
      }
    }
  }

  getWardLineCount() {
    let wardLineCountList = JSON.parse(localStorage.getItem("wardLineCountList"));
    if (wardLineCountList != null) {
      let lineCount = wardLineCountList.find(item => item.wardNo == this.selectedZone);
      if (lineCount != undefined) {
        this.wardLineCount = Number(lineCount.lineCount);
        this.getWardLines(lineCount.lineCount);
      }
    }
  }

  getWardLines(lineCount: any) {
    for (let i = 1; i <= Number(lineCount); i++) {
      let wardLines = this.db.list("Defaults/WardLines/" + this.selectedZone + "/" + i + "/points").valueChanges().subscribe((zoneData) => {
        wardLines.unsubscribe();
        if (zoneData.length > 0) {
          let lineData = zoneData;
          var latLng = [];
          for (let j = 0; j < lineData.length; j++) {
            latLng.push({ lat: lineData[j][0], lng: lineData[j][1] });
          }
          this.lines.push({ lineNo: i, latlng: latLng, color: "#87CEFA", });
          this.plotLineOnMap(i, latLng, i - 1, this.selectedZone);
          if (this.lineNo == i.toString()) {
            this.getMarkedHouses(i);
          }
        }
      });
    }
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    if (wardNo == this.selectedZone) {
      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }
      let strokeWeight = 2;
      let status = "";
      if (lineNo == this.lineNo) {
        strokeWeight = 5;
        status = "requestedLine";
      }
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: this.commonService.getLineColor(status),
        strokeWeight: strokeWeight,
      });
      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);

      let userType = localStorage.getItem("userType");
      if (userType == "Internal User") {
        let lat = latlng[0]["lat"];
        let lng = latlng[0]["lng"];
        this.setMarkerForLineNo(lat, lng, this.invisibleImageUrl, lineNo.toString(), this.map, "MainMap");
      }
    }
  }

  getMarkedHouses(lineNo: any) {
    this.clearLineData();
    this.getRevisitRequest();
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db.list(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data.length > 0) {
        for (let i = 0; i < data.length - 1; i++) {
          if (data[i]["latLng"] != undefined) {
            this.progressData.totalLineMarkers++;
            let markerURL = "../assets/img/red-home.png";
            let lat = data[i]["latLng"].split(",")[0];
            let lng = data[i]["latLng"].split(",")[1];
            let cardNo = "";
            if (data[i]["isSurveyed"] != null) {
              if (data[i]["isSurveyed"] == "yes") {
                this.progressData.totalLineSurveyed++;
                markerURL = "../assets/img/green-home.png";
                cardNo = data[i]["cardNumber"];
                $('#divLineScannedCount').css("cursor", "pointer");
              }
            }
            this.setMarkerForHouse(lat, lng, markerURL, cardNo, lineNo, this.map);
          }
        }
      }
    });
  }

  getRevisitRequest() {
    let dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + this.lineNo + "/lineRevisitCount";
    let revisitInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        revisitInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalLineRevisit = Number(data);
          $('#divLineRevisitCount').css("cursor", "pointer");
        }
      }
    );
  }

  setMarkerForLineNo(lat: any, lng: any, markerURL: any, markerLabel: any, map: any, type: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(30, 40),
        origin: new google.maps.Point(0, 0),
      },
      label: {
        text: markerLabel,
        color: "#000",
        fontSize: "10px",
        fontWeight: "bold",
      },
    });
    if (type == "MainMap") {
      this.allMarkers.push({ marker });
    }
  }

  setMarkerForHouse(lat: any, lng: any, markerURL: any, cardNo: any, lineNo: any, map: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(15, 15),
        origin: new google.maps.Point(0, 0),
      },
    });
    if (cardNo != "") {
      let wardNo = this.selectedZone;
      let progressData = this.progressData;
      let db = this.db;
      marker.addListener("click", function () {
        $("#divLoader").show();
        setTimeout(() => {
          $("#divLoader").hide();
        }, 600);
        let dbPath = "Houses/" + wardNo + "/" + lineNo + "/" + cardNo;
        let houseInstance = db.object(dbPath).valueChanges().subscribe((data) => {
          houseInstance.unsubscribe();
          if (data != null) {
            $("#divCardDetail").show();
            progressData.cardNo = data["cardNo"];
            progressData.cardType = data["cardType"];
            progressData.name = data["name"];
          }
        });
      });
    } else {
      marker.addListener("click", function () {
        $("#divCardDetail").hide();
      });
    }
    this.houseMarker.push({ marker });
  }

  getNextPrevious(type: any) {
    let lineNo = $("#txtLineNo").val();
    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    this.clearLineData();
    if (type == "pre") {
      if (lineNo != "1") {
        this.lineNo = Number(lineNo) - 1;
        $("#txtLineNo").val(this.lineNo);
        this.getHouseLineData();
      }
    } else if (type == "next") {
      if (Number(lineNo) < this.wardLineCount) {
        this.lineNo = Number(lineNo) + 1;
        $("#txtLineNo").val(this.lineNo);
        this.getHouseLineData();
      }
    }
  }

  getHouseLineData() {
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    // previousLine
    let firstLine = this.lines.find(
      (item) => item.lineNo == Number(this.previousLine)
    );
    this.polylines[Number(this.previousLine) - 1].setMap(null);
    let line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor(""),
      strokeWeight: 2,
    });
    this.polylines[Number(this.previousLine) - 1] = line;
    this.polylines[Number(this.previousLine) - 1].setMap(this.map);

    // new Line
    this.lineNo = $("#txtLineNo").val();
    this.polylines[Number(this.lineNo) - 1].setMap(null);
    firstLine = this.lines.find((item) => item.lineNo == Number(this.lineNo));
    this.centerPoint = firstLine.latlng[0];
    line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor("requestedLine"),
      strokeWeight: 5,
    });
    this.polylines[Number(this.lineNo) - 1] = line;
    this.polylines[Number(this.lineNo) - 1].setMap(this.map);
    this.previousLine = this.lineNo;
    this.map.setCenter(this.centerPoint);
    this.getMarkedHouses(this.lineNo);
  }

  getScannedCard() {
    if (this.scannedCardList.length == 0) {
      let dbPath = "Houses/" + this.selectedZone + "/" + this.lineNo;
      let scannedCardInstance = this.db.list(dbPath).valueChanges().subscribe(
        data => {
          scannedCardInstance.unsubscribe();
          let city = this.commonService.getFireStoreCity();

          if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
              let imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyCardImage%2F" + this.selectedZone + "%2F" + this.lineNo + "%2F" + data[i]["cardImage"] + "?alt=media";
              let date = data[i]["createdDate"].split(' ')[0];
              let time = data[i]["createdDate"].split(' ')[1];
              let surveyDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
              this.scannedCardList.push({ imageURL: imageURL, cardNo: data[i]["cardNo"], cardType: data[i]["cardType"], name: data[i]["name"], surveyDate: surveyDate });
            }
          }
        }
      );
    }
  }

  openModel(content: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = (windowHeight * 90) / 100;
    let width = (windowWidth * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    if (type == "ScannedCard") {
      let divHeight = height - 50 + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", marginTop);
      $("#divStatus").css("height", divHeight);
      this.getScannedCard();
    }
    else {
      let mapHeight = height - 80 + "px";
      let divHeight = height - 80 + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      $("#revisitMap").css("height", mapHeight);
      $("#divSequence").css("height", divHeight);
      this.mapRevisit = this.commonService.setMapById("revisitMap");
      setTimeout(() => {
        this.commonService.setKML(this.selectedZone, this.mapRevisit);
        let revisitPolyLine = [];
        for (let i = 0; i < this.lines.length; i++) {
          let strokeWeight = 2;
          let status = "";
          let lineNo = this.lines[i]["lineNo"];
          if (lineNo == this.lineNo) {
            strokeWeight = 5;
            status = "requestedLine";
          }
          let line = new google.maps.Polyline({
            path: this.lines[i]["latlng"],
            strokeColor: this.commonService.getLineColor(status),
            strokeWeight: strokeWeight,
          });
          revisitPolyLine[i] = line;
          revisitPolyLine[i].setMap(this.mapRevisit);
          let userType = localStorage.getItem("userType");
          if (userType == "Internal User") {
            let lat = this.lines[i]["latlng"][0]["lat"];
            let lng = this.lines[i]["latlng"][0]["lng"];
            this.setMarkerForLineNo(lat, lng, this.invisibleImageUrl, lineNo.toString(), this.mapRevisit, "RevisitMap");
          }
        }
        this.getRevisitLineRequest();
      }, 200);
    }
  }

  getRevisitLineRequest() {
    if (this.revisitSurveyList.length == 0) {
      let dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + this.lineNo;
      let revisitInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          revisitInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (index != "lineRevisitCount") {
                this.setMarkerForHouse(Number(data[index]["lat"]), Number(data[index]["lng"]), "../assets/img/red-home.png", "", "", this.mapRevisit);
                let date = data[index]["date"].split(' ')[0];
                let time = data[index]["date"].split(' ')[1];
                let requestDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
                let type = data[index]["houseType"];
                let dbPath = "Defaults/FinalHousesType/" + type + "/name";
                let houseInstance = this.db.object(dbPath).valueChanges().subscribe((houseData) => {
                  houseInstance.unsubscribe();
                  if (houseData != null) {
                    let houseType = houseData.toString().split("(")[0];
                    this.revisitSurveyList.push({ name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"] });
                  }
                });
              }
            }
          }
        }
      );
    }
    else {
      for (let i = 0; i < this.revisitSurveyList.length; i++) {
        this.setMarkerForHouse(Number(this.revisitSurveyList[i]["lat"]), Number(this.revisitSurveyList[i]["lng"]), "../assets/img/red-home.png", "", "", this.mapRevisit);
      }
    }
  }

  setMapHalt() {
    let mapProp = this.commonService.mapForHaltReport();
    this.mapRevisit = new google.maps.Map(
      document.getElementById("revisitMap"),
      mapProp
    );
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  clearAllOnMap() {
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
      this.allMarkers = [];
    }
    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.lines = [];
    this.lineNo = 1;
    this.previousLine = 1;
    $("#txtLineNo").val(this.lineNo);
    this.polylines = [];
    this.progressData.totalMarkers = 0;
    this.progressData.totalSurveyed = 0;
    this.progressData.totalRevisit = 0;
    this.clearLineData();
  }

  clearLineData() {
    this.progressData.totalLineMarkers = 0;
    this.progressData.totalLineSurveyed = 0;
    this.progressData.totalLineRevisit = 0;
    this.progressData.cardNo = "";
    this.progressData.cardType = "";
    this.progressData.name = "";
    $("#divCardDetail").hide();
    $('#divLineScannedCount').css("cursor", "text");
    $('#divLineRevisitCount').css("cursor", "text");
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    this.houseMarker = [];
    this.scannedCardList = [];
    this.revisitSurveyList = [];
  }
}

export class progressDetail {
  totalMarkers: number;
  totalSurveyed: number;
  totalLineMarkers: number;
  totalLineSurveyed: number;
  cardNo: string;
  cardType: string;
  name: string;
  totalRevisit: number;
  totalLineRevisit: number;
}
