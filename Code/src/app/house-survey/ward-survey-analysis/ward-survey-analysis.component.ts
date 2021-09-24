import { Conditional } from '@angular/compiler';
/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { AngularFireDatabase } from "angularfire2/database";
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
  constructor(public fs: FirebaseService, public afd: AngularFireDatabase, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal) { }

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
  oldCardList: any[];
  revisitSurveyList: any[];
  revisitLineSurveyList: any[];
  revisitAllSurveyList: any[];
  revisitMarker: any[];
  preRevisitIndex: any;

  progressData: progressDetail = {
    totalMarkers: 0,
    totalSurveyed: 0,
    totalOldCards: 0,
    totalLineMarkers: 0,
    totalLineSurveyed: 0,
    cardNo: "",
    cardType: "",
    name: "",
    totalRevisit: 0,
    totalLineRevisit: 0,
    totalLineOldCard: 0,
    revisitHouseType: "",
    revisitName: "",
    revisitReason: "",
    revisitDate: "",
    rfId: "",
    rfIdName: "",
    rfIdHouseType: "",
    rfIdDate: "",
    rfIdAddress: ""
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
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
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
    this.wardLineCount = this.commonService.getWardLineCount(this.selectedZone);
    this.getWardLines(this.wardLineCount);
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

          $('#divRevisitCount').css("cursor", "pointer");
        }
      }
    );

    dbPath = "EntitySurveyData/TotalRfidNotFoundCount/" + this.selectedZone;
    let oldCardInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      oldCardInstance.unsubscribe();
      if (data != null) {
        this.progressData.totalOldCards = Number(data);
      }
    });
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
    this.getOldCards();
    this.getLineSurveyed();
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
            let revisitKey = "";
            let rfidNotFoundKey = "";
            if (data[i]["cardNumber"] != null) {
              markerURL = "../assets/img/green-home.png";
              cardNo = data[i]["cardNumber"];
              $('#divLineScannedCount').css("cursor", "pointer");
              dbPath = "Houses/" + this.selectedZone + "/" + lineNo + "/" + cardNo + "/latLng";
              let latLngInstance = this.db.object(dbPath).valueChanges().subscribe(
                latLngData => {
                  latLngInstance.unsubscribe();
                  if (latLngData != null) {
                    lat = latLngData.replace("(", "").replace(")", "").split(",")[0];
                    lng = latLngData.replace("(", "").replace(")", "").split(",")[1];
                    this.setMarkerForHouse(lat, lng, markerURL, cardNo, revisitKey, rfidNotFoundKey, lineNo, this.map);
                  }
                }
              );
            }
            else {
              if (data[i]["revisitKey"] != null) {
                markerURL = "../assets/img/purple-home.png";
                revisitKey = data[i]["revisitKey"];
                $('#divLineScannedCount').css("cursor", "pointer");
              }
              else if (data[i]["rfidNotFoundKey"] != null) {
                markerURL = "../assets/img/blue-home.png";
                rfidNotFoundKey = data[i]["rfidNotFoundKey"];
                $('#divLineScannedCount').css("cursor", "pointer");
              }
              this.setMarkerForHouse(lat, lng, markerURL, cardNo, revisitKey, rfidNotFoundKey, lineNo, this.map);
            }
          }
        }
      }
    });
  }

  getLineSurveyed() {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/surveyedCount";
    let revisitInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        revisitInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalLineSurveyed = Number(data);
          $('#divLineRevisitCount').css("cursor", "pointer");
        }
      }
    );
  }

  getRevisitRequest() {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/lineRevisitCount";
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

  getOldCards() {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/lineRfidNotFoundCount";
    let oldCardInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        oldCardInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalLineOldCard = Number(data);
          $('#divLineOldCardCount').css("cursor", "pointer");
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

  setMarkerForHouse(lat: any, lng: any, markerURL: any, cardNo: any, revisitKey: any, rfidNotFoundKey: any, lineNo: any, map: any) {
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
            $("#divOldCardDetail").hide();
            $("#divCardDetail").show();
            $("#divRevisitDetail").hide();
            progressData.cardNo = data["cardNo"];
            progressData.cardType = data["cardType"];
            progressData.name = data["name"];
          }
        });
      });
    } else if (revisitKey != "") {
      let wardNo = this.selectedZone;
      let progressData = this.progressData;
      let db = this.db;
      marker.addListener("click", function () {
        $("#divLoaderRevisit").show();
        setTimeout(() => {
          $("#divLoaderRevisit").hide();
        }, 600);
        let dbPath = "EntitySurveyData/RevisitRequest/" + wardNo + "/" + lineNo + "/" + revisitKey;
        let revisitInstance = db.object(dbPath).valueChanges().subscribe((data) => {
          revisitInstance.unsubscribe();
          if (data != null) {
            let date = data["date"].split(' ')[0];
            let time = data["date"].split(' ')[1];
            let revisitDate = date.split('-')[2] + " " + CommonService.prototype.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
            let dbPath = "Defaults/FinalHousesType/" + data["houseType"] + "/name";
            let houseInstance = db.object(dbPath).valueChanges().subscribe((houseData) => {
              houseInstance.unsubscribe();
              if (houseData != null) {
                let houseType = houseData.toString().split("(")[0];
                $("#divOldCardDetail").hide();
                $("#divRevisitDetail").show();
                $("#divCardDetail").hide();
                progressData.revisitHouseType = houseType;
                progressData.revisitName = data["name"];
                progressData.revisitReason = data["reason"];
                progressData.revisitDate = revisitDate;
              }
            });
          }
        });
      });
    }
    else if (rfidNotFoundKey != "") {
      let wardNo = this.selectedZone;
      let progressData = this.progressData;
      let db = this.db;
      marker.addListener("click", function () {
        $("#divLoaderOldCard").show();
        setTimeout(() => {
          $("#divLoaderOldCard").hide();
        }, 600);
        let dbPath = "EntitySurveyData/RFIDNotFoundSurvey/" + wardNo + "/" + lineNo + "/" + rfidNotFoundKey;
        let revisitInstance = db.object(dbPath).valueChanges().subscribe((data) => {
          revisitInstance.unsubscribe();
          if (data != null) {
            let date = data["createdDate"].split(' ')[0];
            let time = data["createdDate"].split(' ')[1];
            let rfIdDate = date.split('-')[2] + " " + CommonService.prototype.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
            $("#divOldCardDetail").show();
            $("#divRevisitDetail").hide();
            $("#divCardDetail").hide();
            progressData.rfId = rfidNotFoundKey;
            progressData.rfIdHouseType = data["cardType"];
            progressData.rfIdName = data["name"];
            progressData.rfIdAddress = data["address"];
            progressData.rfIdDate = rfIdDate;

          }
        });
      });
    }
    else {
      marker.addListener("click", function () {
        $("#divOldCardDetail").hide();
        $("#divCardDetail").hide();
        $('#divRevisitDetail').hide();
      });
    }
    if (map == this.mapRevisit) {
      this.revisitMarker.push({ marker });
    }
    this.houseMarker.push({ marker });
  }

  getNextPrevious(type: any) {
    let lineNo = $("#txtLineNo").val();
    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    if (type == "pre") {
      if (lineNo != "1") {
        this.lineNo = Number(lineNo) - 1;
        $("#txtLineNo").val(this.lineNo);

        this.clearLineData();
        this.getHouseLineData();
      }
    } else if (type == "next") {
      if (Number(lineNo) < this.wardLineCount) {
        this.lineNo = Number(lineNo) + 1;
        $("#txtLineNo").val(this.lineNo);
        this.clearLineData();
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
              if (data[i]["createdDate"] != null) {
                let imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyCardImage%2F" + this.selectedZone + "%2F" + this.lineNo + "%2F" + data[i]["cardImage"] + "?alt=media";
                let date = data[i]["createdDate"].split(' ')[0];
                let time = data[i]["createdDate"].split(' ')[1];
                let surveyDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
                this.scannedCardList.push({ imageURL: imageURL, cardNo: data[i]["cardNo"], cardType: data[i]["cardType"], name: data[i]["name"], surveyDate: surveyDate, mobile: data[i]["mobile"] });
              }
            }
          }
        }
      );
    }
  }

  getOldCard() {
    if (this.oldCardList.length == 0) {
      let dbPath = "EntitySurveyData/RFIDNotFoundSurvey/" + this.selectedZone + "/" + this.lineNo;
      let oldCardInstance = this.db.list(dbPath).valueChanges().subscribe(
        data => {
          oldCardInstance.unsubscribe();
          let city = this.commonService.getFireStoreCity();
          if (data.length > 0) {
            for (let i = 0; i < data.length; i++) {
              if (data[i]["createdDate"] != null) {
                let imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyRfidNotFoundCardImage%2F" + this.selectedZone + "%2F" + this.lineNo + "%2F" + data[i]["cardImage"] + "?alt=media";
                let date = data[i]["createdDate"].split(' ')[0];
                let time = data[i]["createdDate"].split(' ')[1];
                let surveyDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
                this.oldCardList.push({ imageURL: imageURL, cardNo: data[i]["rfid"], cardType: data[i]["cardType"], name: data[i]["name"], surveyDate: surveyDate, mobile: data[i]["mobile"] });
              }
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
    } else if (type == "OldCard") {
      let divHeight = height - 50 + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", marginTop);
      $("#divStatus").css("height", divHeight);
      this.getOldCard();
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
        if (type == "RevisitAll") {
          this.getRevisitAllRequest();
        }
        else {
          this.getRevisitLineRequest();
        }
      }, 200);
    }
  }

  getRevisitMarker(index: any) {
    if (this.preRevisitIndex != -1) {
      this.revisitMarker[this.preRevisitIndex]["marker"].setMap(null);
      let marker = new google.maps.Marker({
        position: { lat: Number(this.revisitSurveyList[this.preRevisitIndex]["lat"]), lng: Number(this.revisitSurveyList[this.preRevisitIndex]["lng"]) },
        map: this.mapRevisit,
        icon: {
          url: "../assets/img/red-home.png",
          fillOpacity: 1,
          strokeWeight: 0,
          scaledSize: new google.maps.Size(15, 15),
          origin: new google.maps.Point(0, 0),
        },
      });
      this.revisitMarker[this.preRevisitIndex]["marker"] = marker;
      this.revisitSurveyList[this.preRevisitIndex]["activeClass"] = "halt-data-theme";
    }

    this.revisitMarker[index]["marker"].setMap(null);
    let marker = new google.maps.Marker({
      position: { lat: Number(this.revisitSurveyList[index]["lat"]), lng: Number(this.revisitSurveyList[index]["lng"]) },
      map: this.mapRevisit,
      icon: {
        url: "../assets/img/red-home.png",
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(15, 15),
        origin: new google.maps.Point(0, 0),
      },
    });
    marker.setAnimation(google.maps.Animation.BOUNCE);
    this.revisitMarker[index]["marker"] = marker;
    this.preRevisitIndex = index;
    this.revisitSurveyList[index]["activeClass"] = "halt-data-theme active";
  }

  getRevisitLineRequest() {
    this.revisitSurveyList = [];
    this.revisitMarker = [];
    this.preRevisitIndex = -1;
    if (this.revisitLineSurveyList.length == 0) {
      let dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + this.lineNo;
      let revisitInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          revisitInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            for (let j = 0; j < keyArray.length; j++) {
              let index = keyArray[j];
              if (index != "lineRevisitCount") {
                let date = data[index]["date"].split(' ')[0];
                let time = data[index]["date"].split(' ')[1];
                let requestDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
                let city = this.commonService.getFireStoreCity();
                let imageURL = "";
                if (data[index]["image"] != null) {
                  imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FRevisitCardImage%2F" + this.selectedZone + "%2F" + this.lineNo + "%2F" + data[index]["image"] + "?alt=media";
                } let type = data[index]["houseType"];
                let dbPath = "Defaults/FinalHousesType/" + type + "/name";
                let houseInstance = this.db.object(dbPath).valueChanges().subscribe((houseData) => {
                  houseInstance.unsubscribe();
                  if (houseData != null) {
                    let houseType = houseData.toString().split("(")[0];
                    this.revisitSurveyList.push({ lineNo: this.lineNo, lines: 0, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                    this.revisitLineSurveyList.push({ lineNo: this.lineNo, lines: 0, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                    this.setMarkerForHouse(Number(data[index]["lat"]), Number(data[index]["lng"]), "../assets/img/red-home.png", "", "", "", "", this.mapRevisit);
                  }
                });
              }
            }
          }
        }
      );
    }
    else {
      this.revisitSurveyList = this.revisitLineSurveyList;
      for (let i = 0; i < this.revisitSurveyList.length; i++) {
        this.setMarkerForHouse(Number(this.revisitSurveyList[i]["lat"]), Number(this.revisitSurveyList[i]["lng"]), "../assets/img/red-home.png", "", "", "", "", this.mapRevisit);
      }
    }
  }

  getRevisitAllRequest() {
    this.revisitSurveyList = [];
    this.revisitMarker = [];
    this.preRevisitIndex = -1;
    if (this.revisitAllSurveyList.length == 0) {
      for (let i = 0; i < this.lines.length; i++) {
        let lineNo = this.lines[i]["lineNo"];
        let dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + lineNo;
        let revisitInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            revisitInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              for (let j = 0; j < keyArray.length; j++) {
                let index = keyArray[j];
                if (index != "lineRevisitCount") {
                  let date = data[index]["date"].split(' ')[0];
                  let time = data[index]["date"].split(' ')[1];
                  let requestDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
                  let city = this.commonService.getFireStoreCity();
                  let imageURL = "";
                  if (data[index]["image"] != null) {
                    imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FRevisitCardImage%2F" + this.selectedZone + "%2F" + lineNo + "%2F" + data[index]["image"] + "?alt=media";
                  }
                  let type = data[index]["houseType"];
                  let dbPath = "Defaults/FinalHousesType/" + type + "/name";
                  let houseInstance = this.db.object(dbPath).valueChanges().subscribe((houseData) => {
                    houseInstance.unsubscribe();
                    if (houseData != null) {
                      let houseType = houseData.toString().split("(")[0];
                      this.revisitSurveyList.push({ lineNo: lineNo, lines: lineNo, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                      this.revisitAllSurveyList.push({ lineNo: lineNo, lines: lineNo, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                      this.setMarkerForHouse(Number(data[index]["lat"]), Number(data[index]["lng"]), "../assets/img/red-home.png", "", "", "", "", this.mapRevisit);
                    }
                  });
                }
              }
            }
          }
        );
      }
    }
    else {
      this.revisitSurveyList = this.revisitAllSurveyList;
      for (let i = 0; i < this.revisitSurveyList.length; i++) {
        this.setMarkerForHouse(Number(this.revisitSurveyList[i]["lat"]), Number(this.revisitSurveyList[i]["lng"]), "../assets/img/red-home.png", "", "", "", "", this.mapRevisit);
      }
    }
  }

  confirmRevisitRequest(index: any) {
    $('#divConfirm').show();
    $('#revisitIndex').val(index);
  }

  cancelRevisitDelete() {
    $('#revisitIndex').val("0");
    $('#divConfirm').hide();
  }

  checkRevisit() {
    let index = Number($('#revisitIndex').val());
    $('#divConfirm').hide();
    $('#revisitIndex').val("0");
    // return;
    let lineNo = this.revisitSurveyList[index]["lineNo"];
    let surveyorId = this.revisitSurveyList[index]["surveyorId"];
    let date = this.revisitSurveyList[index]["date"];
    let revisitKey = this.revisitSurveyList[index]["revisitKey"];
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let checkInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data != null) {
          let canDelete = true;
          for (let i = 0; i < data.length; i++) {
            if (data[i]["revisitKey"] != null) {
              if (data[i]["revisitKey"] == revisitKey) {
                i = data.length;
                canDelete = false;
              }
            }
          }
          if (canDelete == true) {
            this.deleteRevisit(lineNo, revisitKey, date, surveyorId, index);
          }
          else {
            this.commonService.setAlertMessage("error", "You can not delete this marker. This is related to house marker !!!");

          }
        }
      }
    );
  }

  deleteRevisit(lineNo: any, revisitKey: any, date: any, surveyorId: any, index: any) {
    let dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
    let revisiteInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        revisiteInstance.unsubscribe();
        if (data != null) {
          dbPath = "EntitySurveyData/RemovedRevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
          this.db.object(dbPath).update(data);

          // update counts
          this.updateRevisitCounts(lineNo, date, surveyorId);

          dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
          this.db.object(dbPath).remove();

          this.commonService.setAlertMessage("success", "Revisit request deleted !!!");

          this.resetRevisitRequests(index);

        }
      }
    );
  }

  resetRevisitRequests(index: any) {
    this.revisitMarker[index]["marker"].setMap(null);
    this.progressData.totalRevisit = Number(this.progressData.totalRevisit) - 1;
    this.progressData.totalLineRevisit = Number(this.progressData.totalLineRevisit) - 1;

    let revisitKey = this.revisitSurveyList[index]["revisitKey"];
    let lines = this.revisitSurveyList[index]["lines"];
    let revisitList = [];
    for (let i = 0; i < this.revisitSurveyList.length; i++) {
      if (this.revisitSurveyList[i]["revisitKey"] != revisitKey) {
        revisitList.push({ lineNo: this.revisitSurveyList[i]["lineNo"], lines: this.revisitSurveyList[i]["lines"], name: this.revisitSurveyList[i]["name"], requestDate: this.revisitSurveyList[i]["requestDate"], reason: this.revisitSurveyList[i]["reason"], houseType: this.revisitSurveyList[i]["houseType"], lat: this.revisitSurveyList[i]["lat"], lng: this.revisitSurveyList[i]["lng"], activeClass: "halt-data-theme", imageURL: this.revisitSurveyList[i]["imageURL"], surveyorId: this.revisitSurveyList[i]["surveyorId"], date: this.revisitSurveyList[i]["date"], revisitKey: this.revisitSurveyList[i]["revisitKey"] });
      }
    }
    this.revisitSurveyList = revisitList;
    if (lines == 0) {
      this.revisitLineSurveyList = revisitList;
    }
    else {
      this.revisitAllSurveyList = revisitList;
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
    this.progressData.totalOldCards = 0;
    this.progressData.totalLineOldCard = 0;
    $('#divRevisitCount').css("cursor", "text");
    this.clearLineData();
  }

  clearLineData() {
    this.progressData.totalLineMarkers = 0;
    this.progressData.totalLineSurveyed = 0;
    this.progressData.totalLineRevisit = 0;
    this.progressData.totalLineOldCard = 0;
    this.progressData.cardNo = "";
    this.progressData.cardType = "";
    this.progressData.name = "";
    this.progressData.revisitDate = "";
    this.progressData.revisitHouseType = "";
    this.progressData.revisitName = "";
    this.progressData.revisitReason = "";
    this.progressData.rfId = "";
    this.progressData.rfIdAddress = "";
    this.progressData.rfIdDate = "";
    this.progressData.rfIdHouseType = "";
    this.progressData.rfIdName = "";
    $("#divCardDetail").hide();
    $('#divRevisitDetail').hide();
    $('#divLineScannedCount').css("cursor", "text");
    $('#divLineRevisitCount').css("cursor", "text");
    $('#divLineOldCardCount').css("cursor", "text");
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    this.houseMarker = [];
    this.scannedCardList = [];
    this.oldCardList = [];
    this.revisitSurveyList = [];
    this.revisitLineSurveyList = [];
    this.revisitAllSurveyList = [];
    this.revisitMarker = [];
  }

  // process for survey revisit request

  getProcess(index: any) {
    let lineNo = this.revisitSurveyList[index]["lineNo"];
    let revisitKey = this.revisitSurveyList[index]["revisitKey"];
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data != null) {
          let canProcess = true;
          let markerNo = "0";
          let cardNo = "";
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let markerIndex = keyArray[i];
              if (data[markerIndex]["revisitKey"] != null) {
                if (data[markerIndex]["revisitKey"] == revisitKey) {
                  markerNo = markerIndex;
                  if (data[markerIndex]["cardNumber"] != null) {
                    i = keyArray.length;
                    canProcess = false;
                    markerNo = markerIndex;
                    cardNo = data[markerIndex]["cardNumber"];
                  }
                }
              }
            }
          }
          if (canProcess == true) {
            this.generateNewCardNumber(index, markerNo);
            this.commonService.setAlertMessage("error", "Go for process !!!");
          }
          else {
            this.moveToRevisitSurveyData(lineNo, revisitKey, cardNo, index);

            this.commonService.setAlertMessage("error", "Survey already done for this revisit request  !!!");
          }
        }
      }
    );
  }

  generateNewCardNumber(index: any, markerNo: any) {
    let dbPath = "Settings/virtualRevisitLastCardNumber";
    let cardNumberInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        cardNumberInstance.unsubscribe();
        let cardCount = 10001;
        if (data != null) {
          cardCount = Number(data) + 1;
        }
        this.checkFromCardWardMapping(index, cardCount, markerNo);
      }
    );
  }

  checkFromCardWardMapping(index: any, cardCount: any, markerNo: any) {
    let cardNo = "00001";
    if (cardCount.toString().length == 1) {
      cardNo = "0000" + cardCount;
    }
    else if (cardCount.toString().length == 2) {
      cardNo = "000" + cardCount;
    }
    else if (cardCount.toString().length == 3) {
      cardNo = "00" + cardCount;
    }
    else if (cardCount.toString().length == 4) {
      cardNo = "0" + cardCount;
    }
    else {
      cardNo = cardCount;
    }
    let cardNumber = "SIKA" + cardNo;
    let dbPath = "CardWardMapping/" + cardNumber;
    let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data != null) {
          cardCount = cardCount + 1;
          this.checkFromCardWardMapping(index, cardCount, markerNo);
        }
        else {
          this.db.object("Settings").update({ virtualRevisitLastCardNumber: cardCount });

          this.generateMobileNo(cardNumber, index, markerNo);
          console.log(cardNumber);
        }
      }
    );
  }

  generateMobileNo(cardNumber: any, index: any, markerNo: any) {
    let mobilePrefixList = ["9001", "9166", "9571", "9784", "8003", "7568", "8385", "7597", "8993", "9530", "8764", "9694", "9785", "8058", "8502", "7891", "8741", "9887", "8442", "7014", "6001", "7737", "8233", "9214", "9251", "8823", "9549", "9587", "9982", "8094", "7229", "7665"];
    let random = Math.floor(Math.random() * mobilePrefixList.length);
    let postFix = Math.floor(100000 + Math.random() * 900000);
    let mobileNo = mobilePrefixList[random].toString() + postFix;
    let dbPath = "HouseWardMapping/" + mobileNo;
    let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data != null) {
          this.generateMobileNo(cardNumber, index, markerNo);
        }
        else {
          console.log(mobileNo);
          this.saveRevisitSurvedData(cardNumber, index, mobileNo, markerNo);
        }
      }
    );
  }

  saveRevisitSurvedData(cardNumber: any, index: any, mobileNo: any, markerNo: any) {
    let rfId = Math.floor(1000000000 + Math.random() * 9000000000);
    let revisitKey = this.revisitSurveyList[index]["revisitKey"];
    let surveyorId = this.revisitSurveyList[index]["surveyorId"];
    let lineNo = this.revisitSurveyList[index]["lineNo"];

    let dbPath = "CardWardMapping/" + cardNumber;
    this.db.object(dbPath).update({ line: lineNo, ward: this.selectedZone });

    dbPath = "HouseWardMapping/" + mobileNo;
    this.db.object(dbPath).update({ line: lineNo, ward: this.selectedZone });

    let date = new Date();
    let hour = date.getHours();
    let min = date.getMinutes();
    let second = date.getSeconds();
    let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;

    let address = "Ward " + this.selectedZone;
    let cardNo = cardNumber;
    let cardType = this.revisitSurveyList[index]["houseType"];
    let createdDate = this.commonService.setTodayDate() + " " + time;
    let houseType = this.revisitSurveyList[index]["houseTypeId"];
    let latLng = "(" + this.revisitSurveyList[index]["lat"] + "," + this.revisitSurveyList[index]["lng"] + ")";
    let line = lineNo;
    let mobile = mobileNo;
    let name = this.revisitSurveyList[index]["name"];
    let phaseNo = "2";
    let rfid = rfId;
    let ward = this.selectedZone;

    const data = {
      address: address,
      cardNo: cardNo,
      cardType: cardType,
      createdDate: createdDate,
      houseType: houseType,
      latLng: latLng,
      line: line,
      mobile: mobile,
      name: name,
      phaseNo: phaseNo,
      rfid: rfid,
      surveyorId: "-1",
      ward: ward
    }

    dbPath = "Houses/" + this.selectedZone + "/" + lineNo + "/" + cardNumber;
    this.db.object(dbPath).update(data);

    dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/" + markerNo;
    this.db.object(dbPath).update({ cardNumber: cardNumber });

    this.moveToRevisitSurveyData(lineNo, revisitKey, cardNumber, index);
    this.resetSurveyed(index);
  }

  moveToRevisitSurveyData(lineNo: any, revisitKey: any, cardNo: any, index: any) {
    let dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
    let revisiteMoveInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        revisiteMoveInstance.unsubscribe();
        if (data != null) {
          data.cardNumber = cardNo;
          let date = data.date.split(' ')[0]
          let surveyorId = data.id;
          dbPath = "EntitySurveyData/RevisitRequestSurveyed/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
          this.db.object(dbPath).update(data);

          // update counts
          this.updateRevisitCounts(lineNo, date, surveyorId);
          this.updateSurveyedCounts(lineNo, date, surveyorId);

          dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
          this.db.object(dbPath).remove();
          this.resetRevisitRequests(index);
        }
      }
    );
  }

  updateRevisitCounts(lineNo: any, date: any, surveyorId: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/lineRevisitCount"
    let lineRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        lineRevisitCountInstance.unsubscribe();
        if (count != null) {
          let revisitCount = Number(count) - 1;
          dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
          this.db.object(dbPath).update({ lineRevisitCount: revisitCount });
        }
      }
    );

    let dateNew = date.split('-')[2] + "-" + date.split('-')[1] + "-" + date.split('-')[0];
    dbPath = "EntitySurveyData/DailyRevisitRequestCount/" + this.selectedZone + "/" + surveyorId + "/" + dateNew;
    let dailyRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        dailyRevisitCountInstance.unsubscribe();
        if (count != null) {
          let revisitCount = Number(count) - 1;
          dbPath = "EntitySurveyData/DailyRevisitRequestCount/" + this.selectedZone + "/" + surveyorId + "/" + dateNew;
          this.db.database.ref(dbPath).set(revisitCount);
        }
      }
    );

    dbPath = "EntitySurveyData/TotalRevisitRequest/" + this.selectedZone;
    let totalRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        totalRevisitCountInstance.unsubscribe();
        if (count != null) {
          let revisitCount = Number(count) - 1;
          dbPath = "EntitySurveyData/TotalRevisitRequest/" + this.selectedZone;
          this.db.database.ref(dbPath).set(revisitCount);
        }
      }
    );
  }

  updateSurveyedCounts(lineNo: any, date: any, surveyorId: any) {
    let dateNew = date.split('-')[2] + "-" + date.split('-')[1] + "-" + date.split('-')[0];
    let dbPath = "EntitySurveyData/DailyHouseCount/" + this.selectedZone + "/" + surveyorId + "/" + dateNew;
    let dailyRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        dailyRevisitCountInstance.unsubscribe();
        let surveyedCount = 1;
        if (count != null) {
          surveyedCount = Number(count) + 1;
        }
        dbPath = "EntitySurveyData/DailyHouseCount/" + this.selectedZone + "/" + surveyorId + "/" + dateNew;
        this.db.database.ref(dbPath).set(surveyedCount);
      }
    );

    dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/surveyedCount";
    let lineSurvedCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        lineSurvedCountInstance.unsubscribe();
        let surveyedCount = 1;
        if (count != null) {
          surveyedCount = Number(count) + 1;
        }
        dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/surveyedCount";
        this.db.database.ref(dbPath).set(surveyedCount);
      }
    );

    dbPath = "EntitySurveyData/SurveyDateWise/" + surveyorId + "/" + dateNew;
    let datewiseRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        datewiseRevisitCountInstance.unsubscribe();
        let surveyedCount = Number(count) + 1;
        if (count != null) {
          surveyedCount = Number(count) + 1;
        }        
        dbPath = "EntitySurveyData/SurveyDateWise/" + surveyorId + "/" + dateNew;
        this.db.database.ref(dbPath).set(surveyedCount);
      }
    );

    dbPath = "EntitySurveyData/SurveyDateWise/" + surveyorId + "/totalCount";
    let datewiseTotalRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        datewiseTotalRevisitCountInstance.unsubscribe();
        let surveyedCount = 1;
        if (count != null) {
          surveyedCount = Number(count) + 1;
        }
        dbPath = "EntitySurveyData/SurveyDateWise/" + surveyorId + "/totalCount";
        this.db.database.ref(dbPath).set(surveyedCount);
      }
    );

    dbPath = "EntitySurveyData/TotalHouseCount/" + this.selectedZone;
    let totalRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        totalRevisitCountInstance.unsubscribe();
        let surveyedCount =  1;
        if (count != null) {
          surveyedCount = Number(count) + 1;
        }
        dbPath = "EntitySurveyData/TotalHouseCount/" + this.selectedZone;
        this.db.database.ref(dbPath).set(surveyedCount);
      }
    );
  }
  
  resetSurveyed(index: any) {
    this.revisitMarker[index]["marker"].setMap(null);
    this.progressData.totalSurveyed = Number(this.progressData.totalSurveyed) + 1;
    this.progressData.totalLineSurveyed = Number(this.progressData.totalLineSurveyed) + 1;

    this.getScannedCard();
  }

}

export class progressDetail {
  totalMarkers: number;
  totalSurveyed: number;
  totalOldCards: number;
  totalLineMarkers: number;
  totalLineSurveyed: number;
  cardNo: string;
  cardType: string;
  name: string;
  totalRevisit: number;
  totalLineRevisit: number;
  totalLineOldCard: number;
  revisitHouseType: string;
  revisitName: string;
  revisitReason: string;
  revisitDate: string;
  rfId: string;
  rfIdName: string;
  rfIdHouseType: string;
  rfIdDate: string;
  rfIdAddress: string;
}
