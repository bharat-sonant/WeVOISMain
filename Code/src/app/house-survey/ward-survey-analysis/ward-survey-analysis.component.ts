/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-ward-survey-analysis",
  templateUrl: "./ward-survey-analysis.component.html",
  styleUrls: ["./ward-survey-analysis.component.scss"],
})
export class WardSurveyAnalysisComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(
    public db: AngularFireDatabase,
    public af: AngularFireModule,
    public httpService: HttpClient,
    private actRoute: ActivatedRoute,
    private mapService: MapService,
    private router: Router,
    private commonService: CommonService
  ) {}

  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  polylines = [];
  toDayDate: any;
  currentLat: any;
  currentLng: any;
  lineDrawnDetails: any[];
  currentMonthName: any;
  currentYear: any;
  wardStartUrl = "../assets/img/go-image.png";
  wardEndUrl = "../assets/img/end-image.png";
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  lines: any[] = [];
  lastLineInstance: any;
  wardLines: any;
  zoneKML: any;
  allMatkers: any[] = [];
  lineNo: any;
  cityName: any;
  previousLine: any;
  centerPoint: any;
  houseMarker: any[] = [];

  progressData: progressDetail = {
    totalMarkers: 0,
    totalSurveyed: 0,
    totalWardMarkers: 0,
    totalWardSurveyed: 0,
    cardNo: "",
    cardType: "",
    name: "",
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );
    this.toDayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.toDayDate).getMonth()
    );
    this.lineNo = "1";
    this.previousLine = "1";
    this.setHeight();
    this.getZones();
    this.selectedZone = this.zoneList[1]["zoneNo"];
    this.activeZone = this.zoneList[1]["zoneNo"];
    this.setMaps();
    this.setKml();
    this.onSubmit();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getAllZones();
  }

  setMaps() {
    var mapstyle = new google.maps.StyledMapType([
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ]);
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.mapTypes.set("styled_map", mapstyle);
    this.map.setMapTypeId("styled_map");
  }

  setKml() {
    this.db
      .object("Defaults/KmlBoundary/" + this.selectedZone)
      .valueChanges()
      .subscribe((wardPath) => {
        this.zoneKML = new google.maps.KmlLayer({
          url: wardPath.toString(),
          map: this.map,
        });
      });
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.clearAllOnMap();
    this.activeZone = filterVal;
    this.setKml();
    this.onSubmit();
    this.lineNo = 1;
    this.selectedZone = this.activeZone;
    $("#txtLineNo").val(this.lineNo);
  }

  onSubmit() {
    this.selectedZone = this.activeZone;
    this.polylines = [];
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    this.getAllLinesFromJson();
    this.getTotalMarkers();
  }

  getTotalMarkers() {
    let dbPath =
      "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" +
      this.selectedZone +
      "";
    let totalInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        totalInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalMarkers = Number(data);
        }
      });

    dbPath = "EntitySurveyData/TotalHouseCount/" + this.selectedZone;
    let surveyedInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        surveyedInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalSurveyed = Number(data);
        }
      });
  }

  clearAllOnMap() {
    if (this.allMatkers.length > 0) {
      for (let i = 0; i < this.allMatkers.length; i++) {
        this.allMatkers[i]["marker"].setMap(null);
      }
      this.allMatkers = [];
    }
    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
    this.progressData.cardNo = "";
    this.progressData.cardType = "";
    this.progressData.name = "";
  }

  getAllLinesFromJson() {
    this.lines = [];
    this.polylines = [];
    let wardLineCount = this.db
      .object("WardLines/" + this.selectedZone + "")
      .valueChanges()
      .subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          this.wardLines = Number(lineCount);
          for (let i = 1; i <= Number(lineCount); i++) {
            let wardLines = this.db
              .list(
                "Defaults/WardLines/" + this.selectedZone + "/" + i + "/points"
              )
              .valueChanges()
              .subscribe((zoneData) => {
                wardLines.unsubscribe();
                if (zoneData.length > 0) {
                  let lineData = zoneData;
                  var latLng = [];
                  for (let j = 0; j < lineData.length; j++) {
                    latLng.push({ lat: lineData[j][0], lng: lineData[j][1] });
                  }
                  this.lines.push({
                    lineNo: i,
                    latlng: latLng,
                    color: "#87CEFA",
                  });
                  this.plotLineOnMap(i, latLng, i - 1, this.selectedZone);
                  if (this.lineNo == i.toString()) {
                    this.getMarkedHouses(i);
                  }
                }
              });
          }
        }
      });
  }

  getMarkedHouses(lineNo: any) {
    this.progressData.totalWardMarkers = 0;
    this.progressData.totalWardSurveyed = 0;
    this.progressData.cardNo = "";
    this.progressData.cardType = "";
    this.progressData.name = "";
    this.houseMarker = [];
    $("#divCardDetail").show();
    let dbPath =
      "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
        houseInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length - 1; i++) {
            if (data[i]["latLng"] != undefined) {
              this.progressData.totalWardMarkers++;
              let markerURL = "../assets/img/red-home.png";
              let lat = data[i]["latLng"].split(",")[0];
              let lng = data[i]["latLng"].split(",")[1];
              let cardNo = "";
              if (data[i]["isSurveyed"] != null) {
                if (data[i]["isSurveyed"] == "yes") {
                  this.progressData.totalWardSurveyed++;
                  markerURL = "../assets/img/green-home.png";
                  cardNo = data[i]["cardNumber"];
                }
              }
              this.setMarker(
                lat,
                lng,
                markerURL,
                null,
                cardNo,
                "marker",
                lineNo
              );
            }
          }
        }
      });
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    let dbPathLineStatus =
      "WasteCollectionInfo/" +
      wardNo +
      "/" +
      this.currentYear +
      "/" +
      this.currentMonthName +
      "/" +
      this.toDayDate +
      "/LineStatus/" +
      lineNo +
      "/Status";
    let lineStatus = this.db
      .object(dbPathLineStatus)
      .valueChanges()
      .subscribe((status) => {
        lineStatus.unsubscribe();
        if (wardNo == this.selectedZone) {
          if (this.polylines[index] != undefined) {
            this.polylines[index].setMap(null);
          }
          let strokeWeight = 2;
          let lineColor = "";
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
            this.setMarker(
              lat,
              lng,
              this.invisibleImageUrl,
              lineNo.toString(),
              "",
              "lineNo",
              lineNo
            );
          }
        }
      });
  }

  setMarker(
    lat: any,
    lng: any,
    markerURL: any,
    markerLabel: any,
    cardNo: any,
    type: any,
    lineNo: any
  ) {
    if (type == "lineNo") {
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
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

      this.allMatkers.push({ marker });
    } else {
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
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
          let houseInstance = db
            .object(dbPath)
            .valueChanges()
            .subscribe((data) => {
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
  }

  //#region Line Marking Status

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
        this.getHouseLineData();
      }
    } else if (type == "next") {
      if (Number(lineNo) < this.wardLines) {
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

  getLineDetail() {
    let lineNo = $("#txtLineNo").val();
    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    if (Number(lineNo) <= this.wardLines) {
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

  //#endregion
}

export class progressDetail {
  totalMarkers: number;
  totalSurveyed: number;
  totalWardMarkers: number;
  totalWardSurveyed: number;
  cardNo: string;
  cardType: string;
  name: string;
}
