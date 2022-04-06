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
  zoneKMLRevisit: any;
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
  nameList: any[];
  toDayDate: any;

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
    this.toDayDate = this.commonService.setTodayDate();
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.selectedZone = 0;
    this.getZones();
    this.getNameList();
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
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, 2).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
    });
    this.getWardDetail();
  }

  getWardDetail() {
    this.getAllLinesFromJson();
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

  getAllLinesFromJson() {
    this.commonService.getWardLine(this.selectedZone, this.toDayDate).then((data: any) => {
      if (this.allMarkers.length > 0) {
        for (let i = 0; i < this.allMarkers.length; i++) {
          this.allMarkers[i]["marker"].setMap(null);
        }
      }
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          if (this.polylines[i] != null) {
            this.polylines[i].setMap(null);
          }
        }
      }
      this.allMarkers = [];
      this.polylines = [];
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      this.wardLineCount = wardLines["totalLines"];
      for (let i = 0; i < keyArray.length - 3; i++) {
        let lineNo = Number(keyArray[i]);
        try {
          let points = wardLines[lineNo]["points"];
          var latLng = [];
          for (let j = 0; j < points.length; j++) {
            latLng.push({ lat: points[j][0], lng: points[j][1] });
          }
          this.lines.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA", });
          this.plotLineOnMap(lineNo, latLng, i, this.selectedZone);
        }
        catch { }
      }
      this.getMarkedHouses(this.lineNo);
    });
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    if (wardNo == this.selectedZone) {
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
                let imageURL = "../../../assets/img/system-generated-image.jpg";
                if (data[i]["cardImage"] != null) {

                  if (data[i]["surveyorId"] == "-1") {
                    imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyRfidNotFoundCardImage%2F" + data[i]["cardImage"] + "?alt=media";
                  }
                  else {
                    imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyCardImage%2F" + data[i]["cardImage"] + "?alt=media";
                  }
                }
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
                let imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyRfidNotFoundCardImage%2F" + data[i]["cardImage"] + "?alt=media";
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
        this.commonService.getWardBoundary(this.selectedZone, this.zoneKMLRevisit, 2).then((data: any) => {
          if (this.zoneKMLRevisit != undefined) {
            this.zoneKMLRevisit[0]["line"].setMap(null);
          }
          this.zoneKMLRevisit = data;
          this.zoneKMLRevisit[0]["line"].setMap(this.mapRevisit);
          const bounds = new google.maps.LatLngBounds();
          for (let i = 0; i < this.zoneKMLRevisit[0]["latLng"].length; i++) {
            bounds.extend({ lat: Number(this.zoneKMLRevisit[0]["latLng"][i]["lat"]), lng: Number(this.zoneKMLRevisit[0]["latLng"][i]["lng"]) });
          }
          this.mapRevisit.fitBounds(bounds);
        });
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
                let surveyorId = data[index]["id"];

                let requestDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
                let city = this.commonService.getFireStoreCity();
                let imageURL = "";
                if (data[index]["image"] != null) {
                  imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FRevisitCardImage%2F" + data[index]["image"] + "?alt=media";
                }
                else {
                  imageURL = "../../../assets/img/image-not-found.jpg";
                }
                let type = data[index]["houseType"];
                let dbPath = "Defaults/FinalHousesType/" + type + "/name";
                let houseInstance = this.db.object(dbPath).valueChanges().subscribe((houseData) => {
                  houseInstance.unsubscribe();
                  if (houseData != null) {
                    let houseType = houseData.toString().split("(")[0];
                    dbPath = "Surveyors/" + surveyorId + "/name";
                    let surveyorInstance = this.db.object(dbPath).valueChanges().subscribe(
                      surveyorData => {
                        surveyorInstance.unsubscribe();
                        let surveyorName = "";
                        if (surveyorData != null) {
                          surveyorName = surveyorData;
                        }
                        this.revisitSurveyList.push({ lineNo: this.lineNo, surveyorName: surveyorName, lines: 0, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                        this.revisitLineSurveyList.push({ lineNo: this.lineNo, surveyorName: surveyorName, lines: 0, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                        this.setMarkerForHouse(Number(data[index]["lat"]), Number(data[index]["lng"]), "../assets/img/red-home.png", "", "", "", "", this.mapRevisit);
                      }
                    );
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
                  let surveyorId = data[index]["id"];
                  let requestDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
                  let city = this.commonService.getFireStoreCity();
                  let imageURL = "";
                  if (data[index]["image"] != null) {
                    imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FRevisitCardImage%2F" + data[index]["image"] + "?alt=media";
                  }
                  else {
                    imageURL = "../../../assets/img/image-not-found.jpg";
                  }
                  let type = data[index]["houseType"];
                  let dbPath = "Defaults/FinalHousesType/" + type + "/name";
                  let houseInstance = this.db.object(dbPath).valueChanges().subscribe((houseData) => {
                    houseInstance.unsubscribe();
                    if (houseData != null) {
                      let houseType = houseData.toString().split("(")[0];
                      dbPath = "Surveyors/" + surveyorId + "/name";
                      let surveyorInstance = this.db.object(dbPath).valueChanges().subscribe(
                        surveyorData => {
                          surveyorInstance.unsubscribe();
                          let surveyorName = "";
                          if (surveyorData != null) {
                            surveyorName = surveyorData;
                          }
                          this.revisitSurveyList.push({ lineNo: lineNo, surveyorName: surveyorName, lines: lineNo, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                          this.revisitAllSurveyList.push({ lineNo: lineNo, surveyorName: surveyorName, lines: lineNo, name: data[index]["name"], requestDate: requestDate, reason: data[index]["reason"], houseType: houseType, lat: data[index]["lat"], lng: data[index]["lng"], activeClass: "halt-data-theme", imageURL: imageURL, surveyorId: data[index]["id"], date: data[index]["date"].split(' ')[0], revisitKey: index, houseTypeId: type });
                          this.setMarkerForHouse(Number(data[index]["lat"]), Number(data[index]["lng"]), "../assets/img/red-home.png", "", "", "", "", this.mapRevisit);
                        });
                    }
                  });
                }
              }
            }
          });
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
    let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data != null) {
          let canDelete = true;
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (data[index]["revisitKey"] != null) {
                if (data[index]["revisitKey"] == revisitKey) {
                  i = keyArray.length;
                  canDelete = false;
                  dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/" + index;
                  this.db.object(dbPath).update({ revisitCardDeleted: revisitKey });
                  dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/" + index + "/revisitKey";
                  this.db.database.ref(dbPath).set(null);
                }
              }
            }
          }
          if (canDelete == true) {
            this.deleteRevisit(lineNo, revisitKey, date, surveyorId, index);
          }
          else {
            this.deleteRevisit(lineNo, revisitKey, date, surveyorId, index);
            dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/lineRevisitCount"
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
          this.updateRevisitCounts(lineNo, date, surveyorId, "delete");

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
        revisitList.push({ lineNo: this.revisitSurveyList[i]["lineNo"], surveyorName: this.revisitSurveyList[i]["surveyorName"], lines: this.revisitSurveyList[i]["lines"], name: this.revisitSurveyList[i]["name"], requestDate: this.revisitSurveyList[i]["requestDate"], reason: this.revisitSurveyList[i]["reason"], houseType: this.revisitSurveyList[i]["houseType"], lat: this.revisitSurveyList[i]["lat"], lng: this.revisitSurveyList[i]["lng"], activeClass: "halt-data-theme", imageURL: this.revisitSurveyList[i]["imageURL"], surveyorId: this.revisitSurveyList[i]["surveyorId"], date: this.revisitSurveyList[i]["date"], revisitKey: this.revisitSurveyList[i]["revisitKey"], houseTypeId: this.revisitSurveyList[i]["houseTypeId"] });
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

    this.lines = [];
    this.lineNo = 1;
    this.previousLine = 1;
    $("#txtLineNo").val(this.lineNo);
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
    $('#divLoaderUpdate').show();
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
            this.generateNewCardNumber(index, markerNo, "", "revisit");
          }
          else {
            this.moveToRevisitSurveyData(lineNo, revisitKey, cardNo, index);
            this.commonService.setAlertMessage("error", "Survey already done for this revisit request  !!!");
          }
        }
      }
    );
  }

  generateNewCardNumber(index: any, markerNo: any, mobileNo: any, surveyType: any) {
    let dbPath = "Settings/virtualRevisitLastCardNumber";
    let cardNumberInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        cardNumberInstance.unsubscribe();
        let cardCount = 10001;
        if (data != null) {
          cardCount = Number(data) + 1;
        }
        this.checkFromCardWardMapping(index, cardCount, markerNo, mobileNo, surveyType);
      }
    );
  }

  checkFromCardWardMapping(index: any, cardCount: any, markerNo: any, mobileNo: any, surveyType: any) {
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
    if (cardCount > 65000) {
      let dbPath = "Settings/revisitLastCardNumber";
      let cardNumberInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          cardNumberInstance.unsubscribe();
          if (data != null) {
            cardCount = Number(data) + 1;
            this.db.object("Settings").update({ revisitLastCardNumber: cardCount });
            this.db.object("Settings").update({ virtualRevisitLastCardNumber: cardCount });
            let cardNumber = this.commonService.getCarePrefix(this.cityName) + cardCount;
            if (surveyType == "revisit") {
              this.generateMobileNo(cardNumber, index, markerNo);
            }
            else {
              if (mobileNo == "0000000000") {
                mobileNo = this.generateRFIDMobile();
              }
              this.saveRFIDSurveyData(index, cardNumber, mobileNo, markerNo);
            }
          }
        }
      );
    }
    else {
      let cardNumber = this.commonService.getCarePrefix(this.cityName) + cardNo;
      let dbPath = "CardWardMapping/" + cardNumber;
      let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          checkInstance.unsubscribe();
          if (data != null) {
            cardCount = cardCount + 1;
            this.checkFromCardWardMapping(index, cardCount, markerNo, mobileNo, surveyType);
          }
          else {
            this.db.object("Settings").update({ virtualRevisitLastCardNumber: cardCount });
            if (surveyType == "revisit") {
              this.generateMobileNo(cardNumber, index, markerNo);
            }
            else {
              if (mobileNo == "0000000000") {
                mobileNo = this.generateRFIDMobile();
              }
              this.saveRFIDSurveyData(index, cardNumber, mobileNo, markerNo);
            }
          }
        }
      );
    }
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
          this.saveRevisitSurvedData(cardNumber, index, mobileNo, markerNo);
        }
      }
    );
  }

  saveRevisitSurvedData(cardNumber: any, index: any, mobileNo: any, markerNo: any) {
    let rfId = Math.floor(1000000000 + Math.random() * 9000000000);
    let revisitKey = this.revisitSurveyList[index]["revisitKey"];
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

    if (name == "No name" || name == "No" || name == "NA" || name == "Na" || name == "Naam") {
      let random = Math.floor(Math.random() * this.nameList.length);
      name = this.nameList[random].toString();
    }

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

    dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/" + markerNo + "/revisitKey";
    this.db.database.ref(dbPath).set(null);

    this.moveToRevisitSurveyData(lineNo, revisitKey, cardNumber, index);
    this.resetSurveyed();
    this.commonService.setAlertMessage("success", "Revisit request surveyed successfully !!!");
  }

  moveToRevisitSurveyData(lineNo: any, revisitKey: any, cardNo: any, index: any) {
    let dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
    let revisiteMoveInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        revisiteMoveInstance.unsubscribe();
        if (data != null) {
          data.cardNumber = cardNo;
          let date = data.date.split(' ')[0];
          let surveyorId = data.id;
          dbPath = "EntitySurveyData/HistoryRevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
          this.db.object(dbPath).update(data);

          // update counts
          this.updateRevisitCounts(lineNo, date, surveyorId, "survey");
          this.updateSurveyedCounts(lineNo);

          dbPath = "EntitySurveyData/RevisitRequest/" + this.selectedZone + "/" + lineNo + "/" + revisitKey;
          this.db.object(dbPath).remove();
          this.resetRevisitRequests(index);
          $('#divLoaderUpdate').hide();
        }
      }
    );
  }

  updateRevisitCounts(lineNo: any, date: any, surveyorId: any, type: any) {
    let dbPath = "";
    if (type != "delete") {
      dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/lineRevisitCount"
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
    }

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

  updateSurveyedCounts(lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/surveyedCount";
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


    dbPath = "EntitySurveyData/TotalHouseCount/" + this.selectedZone;
    let totalRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        totalRevisitCountInstance.unsubscribe();
        let surveyedCount = 1;
        if (count != null) {
          surveyedCount = Number(count) + 1;
        }
        dbPath = "EntitySurveyData/TotalHouseCount/" + this.selectedZone;
        this.db.database.ref(dbPath).set(surveyedCount);
      }
    );
  }

  resetSurveyed() {
    this.progressData.totalSurveyed = Number(this.progressData.totalSurveyed) + 1;
    this.progressData.totalLineSurveyed = Number(this.progressData.totalLineSurveyed) + 1;
    this.getScannedCard();
  }


  getProcessRfId(index: any) {
    $('#divLoaderUpdate').show();
    let cardNumber = $('#txt' + index).val();
    let mobileNo = $('#spMobile' + index).html().trim();
    let rfidCardNo = $('#spCardNo' + index).html().trim().split(' ')[0];
    if (cardNumber != "") {
      cardNumber = this.commonService.getCarePrefix(this.cityName) + cardNumber;
      let dbPath = "CardWardMapping/" + cardNumber;
      let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          checkInstance.unsubscribe();
          if (data != null) {
            this.commonService.setAlertMessage("error", "You can not process this card number!!!");
            $('#divLoaderUpdate').hide();
          }
          else {
            if (mobileNo == "0000000000") {
              mobileNo = this.generateRFIDMobile();
            }
            this.saveRFIDSurveyData(index, cardNumber, mobileNo, rfidCardNo);
          }
        }
      );
    }
    else {
      this.generateNewCardNumber(index, rfidCardNo, mobileNo, "RFID");
    }
  }

  generateRFIDMobile() {
    let mobileNo = "";
    let mobilePrefixList = ["9001", "9166", "9571", "9784", "8003", "7568", "8385", "7597", "8993", "9530", "8764", "9694", "9785", "8058", "8502", "7891", "8741", "9887", "8442", "7014", "6001", "7737", "8233", "9214", "9251", "8823", "9549", "9587", "9982", "8094", "7229", "7665"];
    let random = Math.floor(Math.random() * mobilePrefixList.length);
    let postFix = Math.floor(100000 + Math.random() * 900000);
    mobileNo = mobilePrefixList[random].toString() + postFix;
    return mobileNo;
  }

  updateRFIDNotCounts(lineNo: any, date: any, surveyorId: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo + "/lineRfidNotFoundCount"
    let lineRFIDCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        lineRFIDCountInstance.unsubscribe();
        if (count != null) {
          let rfidCount = Number(count) - 1;
          dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
          this.db.object(dbPath).update({ lineRfidNotFoundCount: rfidCount });
        }
      }
    );

    let dateNew = date.split('-')[2] + "-" + date.split('-')[1] + "-" + date.split('-')[0];
    dbPath = "EntitySurveyData/DailyRfidNotFoundCount/" + this.selectedZone + "/" + surveyorId + "/" + dateNew;
    let dailyRFIDCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        dailyRFIDCountInstance.unsubscribe();
        if (count != null) {
          let rfidCount = Number(count) - 1;
          dbPath = "EntitySurveyData/DailyRfidNotFoundCount/" + this.selectedZone + "/" + surveyorId + "/" + dateNew;
          this.db.database.ref(dbPath).set(rfidCount);
        }
      }
    );

    dbPath = "EntitySurveyData/TotalRfidNotFoundCount/" + this.selectedZone;
    let totalRFIDCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        totalRFIDCountInstance.unsubscribe();
        if (count != null) {
          let rfidCount = Number(count) - 1;
          dbPath = "EntitySurveyData/TotalRfidNotFoundCount/" + this.selectedZone;
          this.db.database.ref(dbPath).set(rfidCount);
        }
      }
    );
  }

  resetRFIDNot(index: any) {
    this.progressData.totalOldCards = Number(this.progressData.totalOldCards) - 1;
    this.progressData.totalLineOldCard = Number(this.progressData.totalLineOldCard) - 1;

    let cardNo = this.oldCardList[index]["cardNo"];
    let cardList = [];
    for (let i = 0; i < this.oldCardList.length; i++) {
      if (this.oldCardList[i]["cardNo"] != cardNo) {
        cardList.push({ imageURL: this.oldCardList[i]["imageURL"], cardNo: this.oldCardList[i]["cardNo"], cardType: this.oldCardList[i]["cardType"], name: this.oldCardList[i]["name"], surveyDate: this.oldCardList[i]["surveyDate"], mobile: this.oldCardList[i]["mobile"] });
      }
    }
    this.oldCardList = cardList;
  }

  saveRFIDSurveyData(index: any, cardNumber: any, mobileNo: any, rfidCardNo: any) {
    let dbPath = "CardWardMapping/" + cardNumber;
    this.db.object(dbPath).update({ line: this.lineNo, ward: this.selectedZone });
    if (mobileNo != "") {
      dbPath = "HouseWardMapping/" + mobileNo;
      this.db.object(dbPath).update({ line: this.lineNo, ward: this.selectedZone });
    }

    dbPath = "EntitySurveyData/RFIDNotFoundSurvey/" + this.selectedZone + "/" + this.lineNo + "/" + rfidCardNo;
    let rfidInstance = this.db.object(dbPath).valueChanges().subscribe(
      rfidData => {
        rfidInstance.unsubscribe();
        if (rfidData != null) {
          let date = rfidData["createdDate"].split(' ')[0];
          let surveyorId = rfidData["surveyorId"];
          let rfid = rfidData["rfid"];
          rfidData["cardNo"] = cardNumber;
          let name = rfidData["name"];
          if (name == "No name" || name == "No" || name == "NA" || name == "Na" || name == "Naam") {
            let random = Math.floor(Math.random() * this.nameList.length);
            name = this.nameList[random].toString();
          }
          dbPath = "EntitySurveyData/HistoryRFIDNotFoundSurvey/" + this.selectedZone + "/" + this.lineNo + "/" + rfidCardNo;
          this.db.object(dbPath).update(rfidData);
          rfidData["surveyorId"] = "-1";
          dbPath = "Houses/" + this.selectedZone + "/" + this.lineNo + "/" + cardNumber;
          this.db.object(dbPath).update(rfidData);

          dbPath = "EntitySurveyData/RFIDNotFoundSurvey/" + this.selectedZone + "/" + this.lineNo + "/" + rfidCardNo;
          this.db.object(dbPath).remove();

          dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo;
          let rfidHouseInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              rfidHouseInstance.unsubscribe();
              if (data != null) {
                let keyArray = Object.keys(data);
                let markerNo = "";
                if (keyArray.length > 0) {
                  for (let i = 0; i < keyArray.length; i++) {
                    let markerIndex = keyArray[i];
                    if (data[markerIndex]["rfidNotFoundKey"] != null) {
                      if (data[markerIndex]["rfidNotFoundKey"] == rfid) {
                        markerNo = markerIndex;
                        dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/" + markerNo;
                        this.db.object(dbPath).update({ cardNumber: cardNumber });
                        dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/" + markerNo + "/rfidNotFoundKey";
                        this.db.database.ref(dbPath).set(null);
                      }
                    }
                  }
                }
              }
            }
          );
          this.updateSurveyedCounts(this.lineNo);
          this.updateRFIDNotCounts(this.lineNo, date, surveyorId);
          this.resetSurveyed();
          this.resetRFIDNot(index);
          this.commonService.setAlertMessage("success", "RFID not matched surveyed successfully !!!");
          $('#divLoaderUpdate').hide();
        }
      }
    );
  }


  getNameList() {
    this.nameList = ["Krishan kumar", "Satyanarayan", "Manoharlal", "Kishanlal Sharma", "Mahesh bhati", "Vinod saini", "Ratan Lal saini",
      "Arjun Saini", "Sitaram Sharma", "Rajiv kumar", "Gita Devi", "Pawan sharma", "Laxman Singh", "Abdul Sataar", "Mahendra gurjar", "Bajran Singh", "Gajendra Singh", "Indar Saini", "Sokhat khan", "Hitesh Sharma", "Suresh Kumar", "Omprakash Saini", "Kaluram saini", "Ganesh Kumar Saini", "Sunil pareek", "Rajkumar saini", "Motilal Verma", "Bhagwan Ram Saini", "Rahul saini", "Ramkisor", "Nemichand meena", "Mandan Singh", "Jitendra joshi", "Mahaveer Prasad", "Premchand Saini", "Dwarka prasad saini", "Dileep kumar", "Sayam singh", "Keshar Singh", "Gajraj Singh", "Kamal kishor", "Mulchand Shrama", "Bimla Devi", "Devipratap Singh", "Pappu soni", "Hanuman Singh", "Prabhu Singh", "Mahesh kumar", "Mangu Singh", "Sohanlal Jangir", "Jugalkishor", "Satendra Dhayal", "Omasankar", "Bhawani Devi", "Rajendra singh", "Rajveer singh", "Tara kunwar", "Sambhu Dayal", "Bansidhar Nayak", "Aakash Singh", "Murli Jangir", "Rampal", "Manprakash  Verma", "Birbal singh", "Bhawar Singh", "Surgun kumawat", "Vinod Kumar saini", "Harendra singh", "Vishnu sharma", "Gopal kumawat", "Dataram Sharma", "Ghanshyam sharma", "Balveer singh", "Nathuram soni", "Aaditya soni", "Abdul kalam", "Birju singh", "Moh. Farukh", "Debu gadhwal", " Sankar singh", "Manish kumar", "Gajanand singh", "Foolchand", "Rampal", "Dinesh", "Ram Swaroop kumawat", "Sultan khan", "Amin nagori", "Mohd Yashin", "Mohdsarif", "Naved", "Mohd Tohfik", "Mohd Salim", "Mohd Fharuk", "Rafik", "Mohd Ekbal", "Umar yashin", "Rahmdula", "Ram gopal verma", "Saroj devi", "Bihari Lal", "Behlim mumtaj", "Maqbool ahahmd", "Mohd Esub", "Jakir khan", "Mohmamd saruk", "Mohd Altab", "Mohammed daud", "Arif sadik", "Nijamudin", "Himamudin belim", "Mohammed salim", "Shidhusen", " Najma", "Mohammed kused", "Yasen", "Yakub", "Mohd Haneef", "Gulam nabi", "Abdul kariem", "Mohd Ishymal", "Mohd Essak", "Jamil ahmad", "Mohd Husain", "Mohd Ayub qureshi", "Abdul latief", "Mohd Ramjan", "Imamudeen", "Tofeek bhati", "Mohd Tanwar",
      "Keshav dev", "Mukesh", "Naru ram dhikiya", "Karan", "Raju kumar", "Mithun", "Balbeer", "Prahlad", "Santosh", "Mahaveer",
      "Anjali", "Sandip kumar", "Kailash Saini", "Umed Singh Rathor", "Mahender", "Boduram", "Sukhlal", "Gyani Devi", "Radhakishan",
      "Sushila devi", "Shobha Gupta", "Suraj Ruhela", "Arjun lal", "Bhagwan singh", "R.S. Shekhawat", "Bhivaram", "Suraj", "Bugli devi",
      "Ashok", "Vikram Nawriya", "Arun sharma", "Gopal dikiya", "Niraj kumar pareek", "Vinod", "Naresh Kumar", "Pawan sindhi",
      "Surendra kumar", "Krishan soni", "Dindayal sharma", "Nathamal sharma", "Rughuvir harijan", "Gopal Singh", "Krishan",
      "HARLAL SINGH", "Ranjit Singh ", "Rajendra Prasad ", "Ramavtar singh", "KESHRAM DHAYAL", "Sumesh Kumar", "Jagdish parsad",
      "Mahipal Singh", "Amarjit singh", "Ram Kumar", "Bhawar Lal", "Vajay kumar", "Gowrishankar sharma", "Sukharam chodhary",
      "Archana pareek", "RICHHPAL", "Madan Pal", "Dinesh Kumar", "Dinesh Kumar", "Murari lal", "Ratan Lal", "Sunil gupta", "Sanjay Kumar",
      "Dipak Sharma", "Rameswar lal", "RAMDEV SINGH DHAKA", "Udaram ji", "Narapat singh", "Surji devi", "Triilok Khandelwal",
      "Manish Kumar", "S. K. Nirmal", "Abdul ahaman", "Kelash Saini", "RAMSINGH BHATI", "GORI SHANKAR SHARMA", "RAMNARAYAN",
      "SHUSHIL PAREEK", "PURUSHOTAM", "SARWAN KUMAR PAREEK", "Tilak Singh", "Naresh Kumar", "Prakash Kumar soni", "Fhatechand jangid",
      "Anand Singh Sekhawat", "Adhil Singh bhati", "Mala singh", "Shersingh sekhawat", "Indu devi", "Ankush agarwal", "Pritam Singh",
      "Laxmi kant", "Sudhir", "Mahima singh", "Om Prakash singh", "Ganpat Singh Gadwal", "Mangal Chand", "Karan Singh beniwal", "Raj vijaya", "Rukmani devi", "Vinod kumar", "Baijnath Dheewan", "Jagdish Bhaskar", "Sanwar Mal Kajla", "Banarsi Devi", "Shiv narayan", "Vidhyadhar", "Hari Singh", "RAJENDRA SIYAG", "Sharwan ji", "Jagan Singh matwa", "Sukhdev", "Sharwan Gadwal", "Ram niwas Gadwal", "Ramswarup nehra", "Mamta devi", "Birju Singh jakhar", "Sultan Singh pilaniya", "Madhya ram ji dayal", "Kaishar Singh ranva", "Vikram Singh", "Raj Singh Choudhary", "Suresh kumar poonia", "Bhiwaram badariya", "Kusum lata", "Saver mal ji", "Mahaveer Singh", "Vijay Kumar rad", "Subhash Kumar", "Birbal", "Omparkash gadwal", "Kuldeep dhaka", "Bihari lal khichar", "Kuldeep", "Sumitra gadwal", "Bhagwan Singh karshniya", "Ram Gopal", "Ramniwas", "Manoj kumar nehra", "Ramdev Singh", "Omparkash jheegar", "Satender", "Sultan singh", "Banwari lal", "Nemichand", "Ramniwas dhaka", "Jagan singh", "Jagan Singh", "Khiv Singh", "Ramesh", "Anandpal", "Hariram", "Murari ji", "Om prakash", "Silochana", "Raja ram ji", "Jaber ji", "Shivdayal ji", "Ram Chandra Singh bagriya", "Harlal", "Mahendra singh", "Monu g", "Loked", "Govind Singh dotasara", "Dharmpal", "Omprkash", "Harpal singh", "Shahu sharma", "Shree chand", "Rajesh meel", "Sukhveer singh", "Shri chand dhaka", "Ramchandra ji", "Jagmal singh", "Dilip Garhwal", "Vidhadhar ji garwal", "Banvari ji", "Suresh garwal", "Rajiv sunda", "Dilip agarwal", "Mamraj dhareewal", "Tala laga hua", "Murari", "Vedant swami", "Subhash jakhar", "Maveer ji", "Gordhan ji", "Harmful singh", "Trilok singh", "Prem singh", "Rajesh kumar", "Rakesh Kumar ji", "Banvari ji", "Onkar Mal", "Bihari Lal khichar", "Satyaveer Singh poonia", "Chuni lalji", "Mahesh ji", "Ghanshyam ji", "Hanuman Singh", "Moolchandji", "Manoj Kumar ji", "Sheeshram Kajla", "Shohni devi", "Om Prakash kichar", "Shyam sundar", "Shiv prasad", "Balbir", "Hari Ram", "Sitaram kumawat", "Somnath", "Ghyarshiram", "Sarita sunda", "Ram kisan", "Sarwan", "Parkash chand", "Sarita w/o Har Lal Singh", "Nathu singh bhukar", "rashpal Singh bijarniya", "Shisupal", "Ramkumar Jangid", "Tarachand",
      "Sarwan kumar", "Hari ram", "A K SCHOOL DRAISH", "Ravendhar ji", "Ramratan ji", "Amar chand", "Kuldha ji", "Ranjeet ji", "Bhagirth mal", "Santhosh mood", "Rcs burdak", "Shivparshad", "Sukhveer", "Lokesh", "Kanhaiya Lal ji", "Dinesh kumar", "Jagdish ji", "Aravind", "Kelash kumar", "Jawahar singh", "Prakash chand ji", "Riddhi Siddhi PG", "Harlal singh", "Mahipal", "Mukul", "Chotu singh", "Chotu Singh ji", "Debu gora", "Onkarmal", "Roshan lal", "Bl. Bhamu", "Manju devi", "Mega ram", "Bhagirath singh", "Bhagoti devi", "Payarelal puniya", "Babulal", "Suresh Kumar", "Subhash chand", "Surjan singh", "Manoj Kumar", "Rakesh ji", "Santra", "Sukhbir Singh", "sanvarmal", "Rajesh", "Balbir singh", "Manoj", "Lekhram", "Manoj meel", "Sudhir kumar", "Ramakant sharma", "Jai parkash", "ARvind kumar", "Lalchand", "Surendra meel", "SUDHIR KUMAR KHICHAR", "Sultan Singh ji", "Jagdish ruhela", "Rajesh kumar poonia", "Suresh", "dr.rajenderkumar", "Mulchand ji meel", "Dr.k.k.choudhary", "Jaipal lamboriya", "Suresh bagariya", "PHOOLCHAND", "Bhanwar lal choudhary", "Lakhan kumar", "Rajesh choudhary", "Vidhadhar ji", "Bulbir ji gora", "Vedparkash", "Harlal ji", "Ramdev singh ji gora", "Bhanwer ji", "Davender duti", "Satish Chand punia", "Rajender singh dhaka", "Sukhaveer ji", "Mahendar kumer", "Naveen sunda", "Ashok ji", "Mukesh Kumar puniya", "Santra dave", "Gangadhar ji dhutt", "Nekiram mood", "ASHOK PILANIYA", "Sukhdevi davi", "Mahander ji", "Mohini dave", "Subhash ji", "Kamal ji", "Rajuveer singh", "Ramprath ji", "Parmeshwari devi", "Raghuveer ji", "Harish Kumar", "Banwari lal ola", "Hemaram ranwa", "Pithram", "IKRAMUDEEN", "Sunil Gadwal", "Sukhdev Singh", "Surendra ji", "Rajender kumar nehra", "Maju devi", "Dinesh nehra", "Hardev haritwal", "Kaluram", "Ramkumar", "KISHAN SINGH", "NEMICHAND KHICHAR", "BHANWARI DEVI", "SURESH KUMAR", "Susila ji", "Karan Singh Choudhary", "Jeevan ram chodhari", "Jhabar ji Chaudhary", "Shashibala", "H D S FAGERIA", "NEKIRAM", "Darmesh", "Mohan lal", "Satish bhichar", "ASHOK KUMAR JI SHARMA", "Rajeev kumar", "Balbir Singh", "Raguveer singh kajala", "Naresh mohar", "Raghuveer ji kajla", "Mahadev kajla", "Ranveer singh kajla", "Ashok Kumar", "Harlal ji kalwaniya", "Vidyadhar ji", "Prabhu dayal jangir", "Vijay", "Kuldaram jakhar", "Rajendar singh dhaka", "Kamla choudhary", "Birbal singh dotasara", "Radheshyam ji", "Saroj bugaliya", "MAHA SINGH RAO", "Parmeshar Lal swami", "Ramjilal swami", "Vidya Dhar ji pilania", "SANWAR MAL JANGIR", "HANSRAJ", "Jodhraj", "Jaiveer singh", "Nitesh kumar", "Santosh devi", "Ramchandra Singh pachar", "Ganesh ji", "Ram chandra", "Chotu ram dhaka", "Hansh Raj ji", "Shyam Chaudhary", "Hanshraj", "SHIVBHAGWAN", "S.R.katariya", "Santosh ji josi", "Nandlal meel", "SITA DEVI JANGID", "SATYANARAYAN SHASTRI", "Rajendar parsad", "Manju Sharma", "Hanuman singh", "Devendra", "MADAN LAL BIJARNIYA", "Sharda bijarniya", "Sunita khichar", "Rajesh Kumar dhaka", "Anil ji", "Amrchand", "Manohar lal", "Mahesh", "Shishram", "SUNITA DEVI", "MAHIPAL MOOND", "SATVEER SINGH", "RAMNIWASH MEEL", "GAYATRI DEVI", "PANKAJ BIRBAL", "Birju Singh", "MAHESH SUNDA", "DAYANAND DHATARWAL", "SAROJ DEVI", "SHISHAM KHICHAR", "TENDRA KUMAR", "RAJENDRA", "SAVITA DEVI", "NARESH KULHARI", "LAL BAHADUR", "ASHOK KUMAR", "PREM DEVI", "RAMDEV DHAKA", "AHA LAL SAIN", "VINIT KHICHAR", "DILIP SINGH MAHELA", "HIMMAT SINGH", "TENDRA SINGH", "OMPRAKASH SAIN", "RAKESH", "RAJENDRA KUMAR", "SAVINTRA DHAKA", "BIRBAL SINGH", "Ramlal", "Norang singh", "Vidhadhar singh", "Rajveer", "Subhita devi", "Shodanji", "Phochand fagediya", "YASHWANT SINGH DHAYAL", "Bhawar lal", "Surendra singh", "Shiv chand", "Ganeshram", "Ramesh Sharma", "Manoj shrma", "NATHURAM MEEL", "BL MEEL", "MAHIPAL MEEL", "SANJAY KUMAR S/O SHIV PRASAD", "Rajender parsad", "MR NAHAR SINGH", "MAHENDRA DHUKIYA", "RAJENDRA KULHARI", "BALVEER SINGH", "Ramesh Kumar", "Arjun singh", "Surendra Kumar batar", "Pyarelal shivran", "Niraj daya", "RAJENDRA CHOUDHARY", "BHANWAR LAL BAGDIA", "Mahendr bohra", "Omparkash", "PRAKASH SORAN", "RAMCHANDRA", "MAHESH KUMAR", "OMPRAKASH MEEL", "SUMAN DEVI W/O MAHESH KUMAR", "RAMCHANDRA SARAN", "BHANWAR LAL SUNDA", "Hari Ram ji", "Mahinder", "Sandeep", "Naresh", "Mukesh kumar", "Ramnivash", "Honny", "Jagdish", "Subash", "BRIJMOHAN", "MANOJ KUMAR PILANIYA", "Ramsingh", "Arjun Lal jangir", "BUDANIA GIRLS HOSTEL", "VIJAY KUMAR", "GOPAL", "SUKHVEER SINGH BUDANIA", "NAND LAL RANWA", "HEMANT KUMAR", "Harsh", "BHAGCHAND MAWLIYA", "JAGDISH PRASAD GADHWAL", "Kisturi devi", "Jagdish gadhwal", "SITA DEVI", "HANS RAM KHARBAS", "VIJAY SINGH", "PRAKASH CHAND FAGEDIYA", "PRAMESHWAR SINGH", "SURENDRA KUMAR POONIA", "SURENDRA SINGH", "Surnder Singh kajla", "Sukhadev", "Bhagchand", "Ramkumar", "NEMICHAND KAJLA", "SATYAPAL SINGH", "Namichand ji", "Bhagirat maal rewad ji", "Nemaram Nehra", "Sohan Singh khichar", "Kesardev  sain", "RAMSWAROOP BAGDIYA", "Chanderbhan Singh khara", "Ranjeet", "TARUN KUMAR DHABAI", "Rajesh Kajla", "Do. Vinay mund", "Laxman singh", "Banwar ji", "LAXMAN SINGH", "Ratan ji", "Laxman singh", "MOOLARAM MEEL", "SANWAR MAL SAIN", "OMPRAKASH BIJARNIYA", "MAHENDRA GADHWAL", "DALIP KUMAR", "VIMLA DEVI", "MAHIPAL KHICHAR", "DHARMPAL GADHWAL", "Rajender", "VIDHYADHAR KULHARI",
      "SURENDRA KUMAR BHASKAR", "SUBHASH CHAND", "RAJPAL BUDANIA", "RICHPAL SINGH BATAD", "Phoolchand", "Bhagirathi singh", "RAMCHAND HUDDA", "RAMPRATAP GADHWAL", "Ashok bijarniya", "SHANTI DEVI", "RAMESHWAR", "Rajesh", "Ram lal ji", "Harpal singh bhuriya", "Vidhyadhar ji ranwa", "OMPRAKASH BALBADA", "MANOJ KUMAR", "Nemichand ji", "Surendar singh payal", "Pahlad singh", "Laxmi narayan", "Pardeep", "BEDPAL", "Suresh ji", "Sumitra katariya", "Gdwal bhawan", "Shyam lal", "Jagu", "Misra", "Gjander", "Monika", "Lokender", "Davi lal ji", "Rameshver ji", "Bhola ram", "vishal", "Mulchand ji", "Mulchand bagriya", "Mahipal singh", "Mahaveer gadhwal", "Sarwan kumar jakhar", "Mani devi", "Jyani devi", "Kunal", "Harsh Garden", "Dalel singh", "Sumitra bijarniya", "Mahipal dhaka", "Ranveer singh", "Vishanu  prasad", "Nandkishor", "Kisar dev khyaliya", "Sunil ji", "Nathu ji saini", "Hari parsad saini", "Rahul", "Gori sankar", "Sarda devi", "Laxmi ji", "Indra jakhar", "Nemichand ji", "Subhkarn ji", "Birbal ji", "Nemichand bhaskar", "Om parkas  pangal", "Narendra ji", "Sisram ji", "Narendra kumar", "Goverdhan poonia", "Ummed singh", "Laxman  poonia", "Lekhram mahala", "Danaram choudhary", "Ram kumar ji", "Subhash chandra bugaliya", "BHAGIRATH", "Ram lal", "Ramniwash", "Mahaveer singh", "SHAYOPAL", "MAHESH KUMAWAT", "SANWAR MAL", "SHAYOPAL KUMAWAT", "AMAR CHAND", "RAJKUMAR KUMAWAT", "PRABHU RAM KUMAWAT", "Druga ram", "Surender", "Girdhari kumwat", "Hari", "Bhagwati devi", "Rameshwar", "Ashoka", "Bhagwati devi", "HARDEVA RAM", "OM PRAKASH PILANIA", "RAJURAM JAT", "DAVENDRA SINGH", "RAMSWAROOP", "MANOJ", "RAMKARAN", "Rakes kumar ranwa", "Bhagirath ji kajla", "Ghasi ram", "Manoj", "Devendra kajla", "SHIV CHAND", "VIDHYADHAR SINGH", "Inder g", "Bajrang lal ji", "Banwari lal", "Monu", "mukesh", "Mahver parshad", "Rohit Kumar", "Balveer", "Agrval house", "Mohan chand", "Bharti singh", "Ravi", "Vikash", "Manish", "Harish", "MOHAN SINGH", "Rukmani", "RAMCHANDRA", "BHANWAR LAL", "RAMSWAROOP SONI", "Mahesh Kumar daka", "BABULAL", "Saver ji", "Vijender ji",
      "Rameswar ji", "Payarelal ji", "Hemanshu", "Nayna", "Podar house", "Bhawani shankar ji", "Rajendra", "Omparkesh ji", "Manoj ji", "Mukesh ji", "Shisram", "Vishnu", "Keshav", "Mohit", "Suresh", "Jassraaj ji", "Sarojdevi", "Surendra", "Rohit", "Ratesh", "Sohan", "Babulal Singh", "BIRJU SINGH Bhaskar", "Fateh Mohammed shekh", "Shyam Lal Chawla", "Surjaram", "Panna Lal kumawat", "SUNITA W/O RAM KRISHANA", "TARACHAND CHOUDHARY ( INSPECTOR)", "RAMLAL SINGH", "VISHAL SINGH", "SARWAN KUMAR JANGID", "TARACHAND MAHALA", "Hrish", "Jagdish singh", "Laxmi chand", "PRAKASH", "SUBASH", "UMESH KUMAR JANGID", "SANWARMAL GADHWAL", "Ramutar", "Hanshu", "Subhash Chand", "Dharmapal matwa", "Sumar", "Babulal", "Suraj bhan singh", "Bhagir g", "Gopal", "Hanuman", "RAKESH KUMAR DHAKA", "MUKESH DHAKA", "Happy", "Rajash", "Abbas", "SHIV KUMAR MEEL", "NIRANJAN LAL", "Nirjan lal", "raghu", "JASHVEER CHOUDHRY", "Rishpal Singh ruhla", "Bhagirath Mal Jat mali", "Manroop batar", "Rameshar lal", "DEVKARAN", "Ram kumar", "Shiv pal Singh", "Suresh pooniya", "Ranjeet Singh", "Rakesh kumar", "Kelash", "SURESH", "Shevda Academy", "Janu house", "MUKESH", "CHUNNI LAL", "Yogesh", "Parveen ji", "Khulda ram ji", "SUNIL CHOUDHARY", "PRADEEEP SINGH", "ALKA SINGH", "SARITA DEVI", "GAJENDRA KUMAR", "NEMICHAND", "BAJARANG LAL", "MAHIPAL", "MAMRAJ BATAD", "DINESH KUMAR", "Shree shayam", "Kamal", "LAXMI CHAND", "HARI RAM BHADIYA", "Gerdari", "KAMAL FAGEDIYA", "KAJODMAL VYAVSTHAPAK", "Mahaveer singh", "Manmohan ji", "Rajan", "Balvir singh", "Satguru classes", "Satguru", "Raguveer", "Ranglal ji", "Eshwar singh", "Karan singh", "Suresh ji jakhar", "Mohar Singh ji", "Jagdesh ji", "Raju ji", "Kavita ji", "Gopchand ji", "Rajesh kumawt", "Suresh Kumar nayen", "Harisingh dhyal", "Sudhir jakhar", "Deelep", "Pankaj mahala", "Vijay singh", "Randheer ji", "Naveen", "Vasu dev jhakhar", "Kailash kumar", "Bahadur mal", "Banwari", "Vasu dev", "Ramesh kumar", "Aamod kumar", "Dataram dhayal", "Tarachand", "Sohanlal", "Muni devi", "Jagdish", "Reena devi", "Satkesh Kumar", "Ramkumar meel", "Pawan ji", "Mohan rewar", "Sunil Kumar", "Hariprasad dhaka", "Surendra", "Rajiv choudhary", "Ranveer Singh mahla", "Jatashnakr puniya", "Hemaram", "Sanju", "Pyare Lal", "Sawarmal bhuriya", "Ram Lal singh", "Mukesh", "Ranjeet", "Sardar singh", "Jagan lal", "Nikhil", "Kamla devi", "harendra", "Abhinav", "Vidhadhar", "Babulal ola", "Suresh kumar Dhaka", "Jeatender", "Hari kesan", "Sankar Lal sharma", "Surender singh mahla", "Suresh Jakhar", "Ram singh Dhaka", "Hari Dhyal", "bharat", "Sandeep singh", "Yashpal",
      "Saurabh", "Kailash", "Mahipal", "Rampartap", "Sudhir ji", "Mukesh Kumar", "Mahesh bhukar", "Om parkash", "Phoolchand kumawat", "Sawal singh", "Chanda devi", "Sunita", "Supayar choudhary", "Harpool baniwal", "Savita", "narendra", "Manaram", "Sunita devi", "RAJENDRA GADHWAL", "Sabir khan", "Bhagwana ram", "Dharmapal", "Poolchand", "rajendara singh", "Boduram saini", "Pankaj", "Vidhadhar meel", "Haribax", "VINOD KUMAR", "Mukan singh", "Bhpendra kumar", "Kuldeep kumar", "Sunil bhukar", "INDIRA DEVI", "Pardeep", "Goru ram", "Moti singh", "Chandra singh", "Ravidar singh", "Parmeshar lal", "Mukan meel", "Jabhar kajla", "Baldev singh", "Subhkarn singh", "Shoyobax sunda", "Sultan ji", "Nemichand", "Bhupendra singh", "Bansidhar kajla", "Savantri devi", "Manoj dhaka", "Rameshwar singh", "Singh house", "Omparakesh", "Ram Singh", "Satyeparkash", "Sumer ji", "Nanak ram", "Shyam sundar", "Rakesh Kumar sunda", "MAHESH BARI", "MADAN SINGH KAJLA", "Hanuman bagadiya", "Banchan Singh", "Mahavir ji batad", "Gopal ji", "Jitendra singh", "Nihal Singh", "Prameshwarlal", "Vikash rulaniya", "Kishore sunda", "Vikram singh", "Ramesh nayak", "Upandar kudi", "Dhruval sunda", "SANDEEP BABAL", "GOVIND RAM", "Aman", "Gopal gadwal", "Ved ji", "Mahi pal", "Fulchand bukar", "Kuma ram bhukar", "Dinesh shiran", "RAJKUMAR RAO", "Mukand Singh", "Randheer Singh", "Ranbir", "Choti devi", "Vishnu nathshrma", "Sanjiv nehara", "Dr. S. R. Pooina", "Birbal jhakhar", "Gopal ranwa", "Jungle ji jat", "SHARWAN KUMAR KHAYALIA", "Rajeev bagdriya", "Harlal Singh", "SURENDRA KUMAR", "Ramavtar", "Hariram", "Ranjeet", "Mahendra ji", "Goverdhan", "Ramavatar", "Baldev Singh", "Subhash chandra", "Vijay pal", "Kiran", "Pyarelal ji pooina", "Rakesh gajraj", "Phool chand", "Punit kumar mahla", "Prem devi", "Hanumansingh", "KURDARAM SAINI", "Rajkamal", "Chander Singh", "Tarachand dhayal", "Hanuman ji", "Dr. Bal veer sesmaw", "Sunil kumar", "Bhohit ram", "Ramchander", "Sanju", "Partap Singh", "Vikash", "Bhoitram ji", "HARPHOOL SINGH", "Mohar Singh", "Jagdish parsad poonia", "Dil sukh choudhary", "Sandeep ji", "Vidhayadhar", "Om parkash", "Shri chand", "Mhaveer parsad", "Saroj devi", "Mohan poonia", "Mohan Singh puniya", "Vivek", "Bhagirath", "Narendra", "Goverdhan singh bhaskar", "Rajendra", "Shyam lal varma", "Bhivaram", "Om ji", "Ramkumar", "Manoj kumar", "Satya sharma", "Manju Devi", "Girdhari lal", "Sitaram", "Chote lal sarwa", "Vijendra", "Naman", "Dr KAILASH CHANDRA", "Krishna bhawan", "Kailash", "Bhagirath Singh", "Mahipal", "Narendra", "PITARAM MEEL", "Bhagwan Singh", "SUNITA", "RAMCHANDRA SINGH", "Madan pooniya", "Ram parsad bari", "Vidhadhar",
      "Shivnath singh", "Rich pal Singh batar", "Vimla jakhar", "Kanyalal dara", "Naresh bydania", "Suman davi", "Surya pal", "Makhan Lal", "Hem Singh", "Rajesh gadwal", "Amar Singh matwa", "Daksh", "Nakul bagaria", "Moti Singh pooniya", "Harpool Singh", "BALVEER SINGH BHASKAR", "OMPRAKASH BHASKAR", "MANGAL CHAND MISHRA", "Hera lalsharma", "Dindayal nehara", "Rajkumari", "Madan singh", "DEVKARAN CHOUDHARY", "AJAY CHOUDHARY", "Rajesh Bhukar", "Tan Singh", "Ram chandra dhaka", "VIJENDRA SINGH GILL", "SURAJ MAL ARYA", "Dr Bhim bijarniya", "Dayanand dhaka", "Rajendra meel", "RAJKUMAR FAGEDIYA", "SANTOSH DHAKA", "RATAN SINGH", "RAJENDRA BAGDIYA", "BHAGIRATH MAL KHAYALIYA", "Ramdev bijarniya", "Hoshiyar Singh meel", "Bhawar Singh", "ASHOK SAINI", "SOHANI DEVI", "Pokhar Singh", "Mahesh meel", "Pramod meel", "Rajkumar fagediya", "NEMICHAND", "SHILA DEVI", "VIKASH SHARMA", "Deshraj", "Shri shyam complex", "Aashiyana complex", "Shishpal", "Pardeep jakhar", "NAVEEN KUMAR", "Pardeep kymar", "Sukhbeer Singh bhukar", "Pawan kumar", "BHANWAR", "DR ABHISEK", "banwari lal", "Suresh godara", "VIDHYADAHR", "GORDHAN SINGH GUDHA", "Sobhagaya ragidansy", "Shawai singh", "Banwar lal", "MANOHAR LAL", "Ram parsad", "Gordhan singh", "Madan Singh", "Chataru Singh", "chotu ram kumawat", "Choturam", "Sanju davi", "Sumit", "Bhagwan ji", "Sarwan achra", "Mahendra bhaskar", "Bhomaram", "Mahendra poonia", "No rang singh", "Ramesh soni", "Madan Lal bagdiya", "Kailash butolia", "Vidhadhar dhaka", "Navdeep", "Bhaghath Mal", "REKHA RAM", "Radha krishan", "VIKASH", "Savran Singh", "Maninadar Singh", "Ramdhan", "Rajesh bagria", "Rajpal", "Raj Singh", "Rajpal bhkar", "Kelash shawar mal", "BUDHRAM", "Ram chandra ola", "SUBHITA KAJLA", "DINESH RANWA", "BABULAL KUMAWAT", "Sunita tiffin centre", "ASHOK", "Subhash kumawat", "Dilsukh thalor", "Vidhadhar Singh", "Er Narendra", "Sultan meel", "Subhash Kumar", "Dinesh gadwal", "SURESH KUMAR DHAKA", "Nemichand mahala", "Ramesh", "Mohan singh", "RAJU SARPANCH", "Rajendra seshma", "SHUSHIL BARI", "Ashok kumar", "Ghisaram jakhar", "Dilbag Singh", "Sukhbeer", "Kalu ram", "Bhagirath singh ranwa", "Shyamshunder shain", "Yash apartment", "New house", "Gopal githala", "VEER TEJA APARTMENT", "Mukesh", "MAHESH", "Ramsavroop joshi", "Parbhudayal", "Maya", "Vinod meena", "Mahaveer parsad", "Narayan Lal rewad", "Mahesh", "Mahendra", "Mahendra Kumar godara", "DHANSINGH LAMBA", "URMILA", "Ram chandra sevda", "Bajranglal", "Makhan lal", "Balbir bhukar", "Bhagarthai davi", "Mahindra Singh", "POONAM DEVI", "DEEPAK KUMAR", "DEVA NAND", "BHAGIRATH", "BOY'S HOSTEL", "SHANKAR LAL", "GUNJAN MATWA",
      "RANDHEER SINGH PILANIYA", "LOKESH MAHALA", "DHANE SINGH", "Surendra", "LAXMICHAND PILANIYA", "HANUMAN", "Mahandra sing", "Ramkuvar", "Ramkuwar", "Ram chandra samota", "Silpa devi", "Mahesh godara", "VISHVANATH SONI", "BIRJMOHAN", "SARWAN", "MUKESH KUMAR JANGID", "Mahendra Singh", "Vikram Singh", "Harish chahar", "Rajendra Singh", "Ramdevi", "Chandan sungh katewa", "Suresh kumawat", "Subhash sharma", "Bhawar singh", "Parkash", "Kuldeep Nehra", "Manoj kumar", "Meena sharma", "Banwari Lal baskar", "Tajpal", "Sarwan", "Mahendra singh mood", "Amarnath butolia", "Dwarka", "Rajesh Kumar bagdiya", "Jhabahar mal bajaya", "Keshar bagdiya", "Subhash kumar", "Amarnath butoliya", "SURESH KUMAR SHARMA", "HARFOOL SINGH KHICHAR", "KANEHYA LAL", "BHAGWAN SINGH JHURIYA", "Kundan singh", "Virendara dotasara", "Virendra Singh", "Hukum Singh mahala", "Bhawar basakar", "SATYAPAL MAHRIYA", "TARACHAND", "Norang Singh kajala", "Norang Singh kajla", "Bhawar Lal dotasara", "SUBASH", "Bhagirath singh matwa", "omparkash", "SURENDRA KUMAR", "PUJA DEVI / LALIT KUMAR", "KELASH CHAND", "Radeshyam kumawat", "Dawarka parsad", "Gopichand", "vikash", "mhadev kumavat", "ramavtar", "radeshyam sharma", "bejrang lal meel", "mahendra", "sankar kumat", "sankar", "Sudhir", "Ramatar dhaka", "KAMLESH KUMAR PUNIYA", "VIJAY KUMAR AGARWAL", "PRAVEEN AGARWAL", "MAHESH KUMAR / DINESH", "SARWAN KUMAR", "Mahesh agrawal", "Shiv bhagwan", "Parveen", "Barjmohan swami", "Vijay Pal", "Mahaveer ji Jangid", "Ramvtar Sharma", "Vimal kumar", "BHANWARLAL NAGA", "RICHPAL", "RAM DEVI / VIKASH KAJALA", "Birabl singh", "SUNIL KUMAR", "MAHENDRA KUMAR MEEL", "SUNDA COLONY", "Dr B R SAINI", "Kumbha ram", "Sahnaj fansy store", "Mahesh kumar", "MANI DEVI", "MAHENDRA KUMAR MEEL", "Ramniwash nithala", "Big apartment", "Ashok kulhari", "Radhika house", "Kiran swami", "Dharmpal", "Dadu ram", "Harish kumar", "Baba men's parler", "Kedar Maan Singh", "Ramlal Singh", "Dr. Ranveer Singh", "Kasar ram bijraniya", "Hari ram meel", "Gora devi", "Indraj", "Ramji lal", "Ramwataar", "Sewa ram", "Sandeep", "Arvind bhaskar", "Ramchandr", "GODAVARI DEVIF", "Ramniwas", "Sunita meel", "SHISHRAM", "Baldev meel", "RANVEER SINGH", "Ram sukh sunda", "Dharmveer", "Manoj kumar pooina", "Johimal", "Anup kumar", "Anil kumar", "Dharmpal sesma", "Pyarelal dhaka", "Ramniwas dhaka", "M. K. General store", "Ravidar jangar", "Makhan Lal jangir", "Prabhudayaal", "Wahid", "Saroj davi", "Sila devi", "Chain Singh khedar", "Karsan kumar", "Dharmendar choudhary", "Vidhader mila", "Santhosh", "Royal digital photo studio", "Birda ram", "Gangadhar"];
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
