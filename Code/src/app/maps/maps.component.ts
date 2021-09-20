import { Validators } from '@angular/forms';
/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
//services
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-maps",
  templateUrl: "./maps.component.html",
  styleUrls: ["./maps.component.css"],
})
export class MapsComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private actRoute: ActivatedRoute, private mapService: MapService, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  vehicleLocationFirstTime: any;
  polylines = [];
  toDayDate: any;
  previousScannedCard: any[];
  todayScannedCard: any[];
  allCards: any[];
  vehicleLocationInstance: any;
  vehicleStatusInstance: any;
  completedLinesInstance: any;
  currentLat: any;
  currentLng: any;
  vehicleStatusId: any;
  lineDrawnDetails: any[];
  currentMonthName: any;
  currentYear: any;
  houseMarkerList: any[] = [];
  houseList: any[] = [];
  employeeDetail: any[] = [];
  defaultImageUrl = "../../assets/img/internal-user.png";
  parshadImageUrl = "../assets/img/sweet-home.png";
  approvedHomeLocationURL = "../assets/img/location-home2.png";
  wardStartUrl = "../assets/img/go-image.png";
  wardEndUrl = "../assets/img/end-image.png";
  wardStartMarker: any;
  wardEndMarker: any;
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  wardDefaultMarkers: any[] = [];
  lines: any[] = [];
  lastLineInstance: any;
  workerDetails: any;
  wardLines: any;
  zoneKML: any;
  parhadhouseMarker: any;
  allMatkers: any[] = [];
  selectedDate: any;
  userType: any;
  isWardChange: true;
  isFirst: any;
  currentMarker: any;
  cardInstance: any;
  showAllScanedCard: any;
  cardNotScanedList: any[];
  cityName: any;
  notScanInstance: any;
  wardLineMarker: any[] = [];
  wardLineNoMarker: any[] = [];
  isWardLines = true;
  wardLineInstanceList: any[] = [];
  totalWardHouse: any;
  totalScannedHouse: any;
  skipLineList: any[];
  mapRefrence: any;
  completedLines: any;

  progressData: progressDetail = {
    totalLines: 0,
    completedLines: 0,
    skippedLines: 0,
    pendingLines: 0,
    currentLine: 0,
    wardLength: "0",
    coveredLength: "0",
    driverName: "",
    driverMobile: "",
    driverImageUrl: this.defaultImageUrl,
    helperName: "",
    helperMobile: "",
    helperImageUrl: this.defaultImageUrl,
    houses: 0,
    scanedHouses: 0,
    parshadName: "",
    parshadMobile: "",
    cardNotScaned: 0,
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    localStorage.setItem("houseList", null);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    if (this.cityName == "jaipur-greater") {
      $('#isHouse').hide();
      $('#showHouseLabel').hide();
      $('#divDriverDetail').hide();
      $('#divLineDetail').hide();
    }
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.toDayDate);
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.toDayDate).getMonth());
    this.setHeight();
    this.getUserAccess();
    this.getZones().then(() => {
      const id = this.actRoute.snapshot.paramMap.get("id");
      if (id != null) {
        this.selectedZone = id.trim();
        this.activeZone = this.selectedZone;
        this.setMaps();
        this.getWardData();
      } else {
        this.selectedZone = this.zoneList[1]["zoneNo"];
        this.activeZone = this.zoneList[1]["zoneNo"];
        this.setMaps();
        this.getWardData();
      }
    });
  }

  getUserAccess() {
    this.userType = localStorage.getItem("userType");
    if (this.userType == "External User") {
      $("#divInternal").hide();
      this.showAllScanedCard = true;
      $("#DivNotSacnned").hide();
      $("#DivExternal").css("cursor", "none");
    } else {
      this.showAllScanedCard = false;
    }
  }

  setDefaultWard() {
    this.progressData.cardNotScaned = 0;
    this.progressData.completedLines = 0;
    this.progressData.coveredLength = "0";
    this.progressData.currentLine = 0;
    this.progressData.driverImageUrl = this.defaultImageUrl;
    this.progressData.driverMobile = "";
    this.progressData.driverName = "";
    this.progressData.helperImageUrl = this.defaultImageUrl;
    this.progressData.helperMobile = "";
    this.progressData.helperName = "";
    this.progressData.houses = 0;
    this.progressData.parshadMobile = "";
    this.progressData.parshadName = "";
    this.progressData.pendingLines = 0;
    this.progressData.scanedHouses = 0;
    this.progressData.skippedLines = 0;
    this.progressData.totalLines = 0;
    this.progressData.wardLength = "0";
    this.totalWardHouse = 0;
    this.totalScannedHouse = 0;

    this.isWardLines = true;

    if (this.wardLineInstanceList.length > 0) {
      for (let i = 0; i < this.wardLineInstanceList.length; i++) {
        this.wardLineInstanceList[i]["lineStatus"].unsubscribe();
      }
    }
    this.wardLineInstanceList = [];

    if (this.notScanInstance != null) {
      this.notScanInstance.unsubscribe();
      this.notScanInstance = null;
    }
    if (this.cardInstance != null) {
      this.cardInstance.unsubscribe();
      this.cardInstance = null;
    }

    if (this.vehicleLocationInstance != null) {
      this.vehicleLocationInstance.unsubscribe();
      this.vehicleLocationInstance = null;
    }

    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
      this.zoneKML = null;
    }

    if (this.wardStartMarker != null) {
      this.wardStartMarker.setMap(null);
    }
    this.wardStartMarker = null;

    if (this.wardEndMarker != null) {
      this.wardEndMarker.setMap(null);
    }
    this.wardEndMarker = null;

    if (this.parhadhouseMarker != null) {
      this.parhadhouseMarker.setMap(null);
    }
    this.parhadhouseMarker = null;

    if (this.wardLineMarker.length > 0) {
      for (let i = 0; i < this.wardLineMarker.length; i++) {
        this.wardLineMarker[i]["marker"].setMap(null);
      }
    }
    this.wardLineMarker = [];

    if (this.wardLineNoMarker.length > 0) {
      for (let i = 0; i < this.wardLineNoMarker.length; i++) {
        this.wardLineNoMarker[i]["marker"].setMap(null);
      }
    }
    this.wardLineNoMarker = [];

    if (this.allMatkers.length > 0) {
      for (let i = 0; i < this.allMatkers.length; i++) {
        this.allMatkers[i]["marker"].setMap(null);
      }
      this.allMatkers = [];
    }
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        this.houseMarkerList[i]["marker"].setMap(null);
      }
      this.houseMarkerList = [];
    }

    if (this.marker != null) {
      this.marker.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
    this.houseList = [];
    this.selectedZone = this.activeZone;
    this.lines = [];
    this.polylines = [];
    this.cardNotScanedList = [];
    let element = <HTMLInputElement>document.getElementById("isHouse");
    element.checked = false;
    $("#houseCount").hide();
    $("#houseDetail").hide();
    this.setKml();
  }

  setDateFilterDefault() {
    this.progressData.cardNotScaned = 0;
    this.progressData.completedLines = 0;
    this.progressData.coveredLength = "0";
    this.progressData.currentLine = 0;
    this.progressData.driverImageUrl = this.defaultImageUrl;
    this.progressData.driverMobile = "";
    this.progressData.driverName = "";
    this.progressData.helperImageUrl = this.defaultImageUrl;
    this.progressData.helperMobile = "";
    this.progressData.helperName = "";
    this.progressData.pendingLines = 0;
    this.progressData.scanedHouses = 0;
    this.progressData.skippedLines = 0;

    if (this.wardLineInstanceList.length > 0) {
      for (let i = 0; i < this.wardLineInstanceList.length; i++) {
        this.wardLineInstanceList[i]["lineStatus"].unsubscribe();
      }
    }
    this.wardLineInstanceList = [];
    this.totalScannedHouse = 0;

    if (this.notScanInstance != null) {
      this.notScanInstance.unsubscribe();
      this.notScanInstance = null;
    }
    if (this.cardInstance != null) {
      this.cardInstance.unsubscribe();
      this.cardInstance = null;
    }

    if (this.vehicleLocationInstance != null) {
      this.vehicleLocationInstance.unsubscribe();
      this.vehicleLocationInstance = null;
    }

    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        this.houseMarkerList[i]["marker"].setMap(null);
      }
      this.houseMarkerList = [];
    }

    if (this.wardLineNoMarker.length > 0) {
      for (let i = 0; i < this.wardLineNoMarker.length; i++) {
        this.wardLineNoMarker[i]["marker"].setMap(null);
      }
      this.wardLineNoMarker = [];
    }

    if (this.marker != null) {
      this.marker.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.selectedZone = this.activeZone;
    this.lines = [];
    this.polylines = [];
    this.cardNotScanedList = [];
    let element = <HTMLInputElement>document.getElementById("isHouse");
    if (element.checked == true) {
      for (let i = 0; i < this.houseList.length; i++) {
        this.progressData.scanedHouses = 0;
        this.getScanedCard(
          this.houseList[i]["cardNo"],
          this.houseList[i]["markerType"]
        );
        $("#isHouse").prop("disabled", false);
        this.getCardNotScaned();
      }
      if (this.selectedDate == this.toDayDate) {
        setTimeout(() => {
          this.getRecentCardDetail();
        }, 3000);
      }
    }
  }

  getWardData() {
    this.setDefaultWard();
    if (this.selectedDate == this.toDayDate) {
      if (this.cityName != "jaipur-greater") {
        this.showVehicleMovement();
      }
    }
    this.getWardLines();
    this.getProgressDetail();
    this.getEmployeeData();
    this.getWardTotalLength();
    if (this.cityName != "jaipur-greater") {
      this.getParshadHouse();
    }
  }

  setDate(filterVal: any, type: string) {
    this.isFirst = true;
    if (this.notScanInstance != null) {
      this.notScanInstance.unsubscribe();
    }
    if (this.cardInstance != null) {
      this.cardInstance.unsubscribe();
    }
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate(
        $("#txtDate").val(),
        1
      );
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.toDayDate)) {
      this.selectedDate = this.toDayDate;
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
    this.selectedZone = this.activeZone;
    this.setDateFilterDefault();
    if (this.selectedDate == this.toDayDate) {
      if (this.cityName != "jaipur-greater") {
        this.showVehicleMovement();
      }
    } else {
      this.marker.setMap(null);
    }
    this.getWardLines();
    //this.getAllLinesFromJson();
    this.getProgressDetail();
    this.getEmployeeData();
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.activeZone = filterVal;
    this.getWardData();
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
    this.db.object("Defaults/KmlBoundary/" + this.selectedZone).valueChanges().subscribe((wardPath) => {
      this.zoneKML = new google.maps.KmlLayer({
        url: wardPath.toString(),
        map: this.map,
      });
    });
  }

  showVehicleMovement() {
    if (this.vehicleLocationInstance != undefined) {
      this.vehicleLocationInstance.unsubscribe();
    }
    let dbPath = "CurrentLocationInfo/" + this.selectedZone + "/latLng";
    this.vehicleLocationInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      if (data != undefined) {
        dbPath = "RealTimeDetails/WardDetails/" + this.selectedZone + "/activityStatus";
        let statusInstance = this.db.object(dbPath).valueChanges().subscribe((statusData) => {
          statusInstance.unsubscribe();
          let statusId = statusData.toString();
          let vehicleIcon = "../assets/img/tipper-green.png";
          if (statusId == "completed") {
            vehicleIcon = "../assets/img/tipper-gray.png";
          } else if (statusId == "stopped") {
            vehicleIcon = "../assets/img/tipper-red.png";
          }
          if (data != null) {
            let location = data.toString().split(",");
            let lat = Number(location[0]);
            let lng = Number(location[1]);
            this.marker.setMap(null);
            this.marker = new google.maps.Marker({
              position: { lat: Number(lat), lng: Number(lng) },
              map: this.map,
              icon: vehicleIcon,
            });
          }
        });
      }
    });
  }


  getWardLines() {
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/mapReference";

    let lineMapRefrenceInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        if (data != null) {
          lineMapRefrenceInstance.unsubscribe();
          this.mapRefrence = data.toString();
          dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + this.mapRefrence + "/totalLines";

          let wardLineCount = this.db.object(dbPath).valueChanges().subscribe((lineCount) => {
            wardLineCount.unsubscribe();
            if (lineCount != null) {
              this.wardLines = Number(lineCount);
              this.progressData.totalLines = Number(lineCount);
              this.getAllLinesFromJson();
            }
          });
        }
        else {
          this.mapRefrence = "";
          let wardLineCount = this.db.object("WardLines/" + this.selectedZone + "").valueChanges().subscribe((lineCount) => {
            wardLineCount.unsubscribe();
            if (lineCount != null) {
              this.wardLines = Number(lineCount);
              this.progressData.totalLines = Number(lineCount);
              this.getAllLinesFromJson();
            }
          });
        }
      }
    );
  }


  getAllLinesFromJson() {
    this.completedLines = 0;
    for (let i = 1; i <= Number(this.wardLines); i++) {
      let dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + i + "/points";
      if (this.mapRefrence != "") {
        dbPath = "Defaults/WardLines/" + this.selectedZone + "/" + this.mapRefrence + "/" + i + "/points";
      }
      let wardLines = this.db.list(dbPath).valueChanges().subscribe((zoneData) => {
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
          if (this.wardStartMarker == null) {
            if (i == Number(this.wardLines)) {
              let latLngArray = [];
              latLngArray = this.lines[0]["latlng"];
              let lat = latLngArray[0]["lat"];
              let lng = latLngArray[0]["lng"];
              this.wardStartMarker = new google.maps.Marker({
                position: { lat: Number(lat), lng: Number(lng) },
                map: this.map,
                icon: {
                  url: this.wardStartUrl,
                  fillOpacity: 1,
                  strokeWeight: 0,
                  scaledSize: new google.maps.Size(32, 40),
                  origin: new google.maps.Point(0, 0),
                },
              });

              latLngArray = this.lines[this.lines.length - 1]["latlng"];
              lat = latLngArray[latLngArray.length - 1]["lat"];
              lng = latLngArray[latLngArray.length - 1]["lng"];
              this.wardEndMarker = new google.maps.Marker({
                position: { lat: Number(lat), lng: Number(lng) },
                map: this.map,
                icon: {
                  url: this.wardEndUrl,
                  fillOpacity: 1,
                  strokeWeight: 0,
                  scaledSize: new google.maps.Size(32, 40),
                  origin: new google.maps.Point(0, 0),
                },
              });
            }
          }
        }
      });
    }
  }



  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
      //lineStatus.unsubscribe();
      this.wardLineInstanceList.push({ lineStatus });
      if (this.selectedDate != this.toDayDate) {
        lineStatus.unsubscribe();
      }

      if (status == "LineCompleted") {
        this.completedLines = this.completedLines + 1;
      }
      if (lineNo == this.wardLines) {
        this.progressData.completedLines = this.completedLines;
      }

      if (wardNo == this.selectedZone) {
        if (this.polylines[index] != undefined) {
          this.polylines[index].setMap(null);
        }
        let line = new google.maps.Polyline({
          path: latlng,
          strokeColor: this.commonService.getLineColor(status),
          strokeWeight: 2,
        });
        this.polylines[index] = line;
        this.polylines[index].setMap(this.map);

        let userType = localStorage.getItem("userType");
        // if (this.isWardLines == true) {
        if (userType == "Internal User") {
          let lat = latlng[0]["lat"];
          let lng = latlng[0]["lng"];
          let marker = new google.maps.Marker({
            position: { lat: Number(lat), lng: Number(lng) },
            map: this.map,
            icon: {
              url: this.invisibleImageUrl,
              fillOpacity: 1,
              strokeWeight: 0,
              scaledSize: new google.maps.Size(32, 40),
              origin: new google.maps.Point(0, 0),
            },
            label: {
              text: lineNo.toString(),
              color: "#000",
              fontSize: "10px",
              fontWeight: "bold",
            },
          });

          this.wardLineNoMarker.push({ marker });
          if (lineNo == this.wardLines) {
            this.isWardLines = false;
          }
        }
        //}
      }
    });
  }
  getParshadHouse() {
    let dbPath = "Settings/WardSettings/" + this.selectedZone + "/ParshadDetail";
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data != null) {
        if (data["name"] != null) {
          this.progressData.parshadName = data["name"];
        }
        if (data["mobile"] != null) {
          this.progressData.parshadMobile = data["mobile"];
        }
        let imgUrl = this.parshadImageUrl;
        this.parhadhouseMarker = new google.maps.Marker({
          position: { lat: Number(data["lat"]), lng: Number(data["lng"]) },
          map: this.map,
          icon: {
            url: imgUrl,
            fillOpacity: 1,
            strokeWeight: 0,
            scaledSize: new google.maps.Size(45, 30),
          },
        });
        // this.wardDefaultMarkers.push({ marker });
      }
    });
  }

  getWardTotalLength() {
    let wardLenghtPath = "WardRouteLength/" + this.selectedZone;
    let wardLengthDetails = this.db.object(wardLenghtPath).valueChanges().subscribe((wardLengthData) => {
      wardLengthDetails.unsubscribe();
      if (wardLengthData != null) {
        this.progressData.wardLength = (
          parseFloat(wardLengthData.toString()) / 1000
        ).toFixed(2);
      } else {
        this.progressData.wardLength = "0.00";
      }
    });
  }

  getProgressDetail() {
    if (this.lastLineInstance != null) {
      this.lastLineInstance.unsubscribe();
    }
    if (this.workerDetails != null) {
      this.workerDetails.unsubscribe();
    }
    if (this.selectedDate == this.toDayDate) {
      this.lastLineInstance = this.db.object("WasteCollectionInfo/LastLineCompleted/" + this.selectedZone).valueChanges().subscribe((lastLine) => {
        if (lastLine != null) {
          this.progressData.currentLine = Number(lastLine) + 1;
        }
      });
    }
    let totalLineData = this.db.object("WardLines/" + this.selectedZone).valueChanges().subscribe((totalLines) => {
      totalLineData.unsubscribe();
      let workerDetailsdbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary";
      this.workerDetails = this.db.object(workerDetailsdbPath).valueChanges().subscribe((workerData) => {
        if (workerData != null) {
          // if (workerData["completedLines"] != null) {
          //   this.progressData.completedLines = workerData["completedLines"];
          // } else {
          //   this.progressData.completedLines = 0;
          // }
          if (workerData["skippedLines"] != null) {
            this.progressData.skippedLines = workerData["skippedLines"];
          } else {
            this.progressData.skippedLines = 0;
          }
          if (workerData["wardCoveredDistance"] != null) {
            this.progressData.coveredLength = (
              parseFloat(workerData["wardCoveredDistance"]) / 1000
            ).toFixed(2);
          } else {
            this.progressData.coveredLength = "0.00";
          }
        }
      });
    });
  }

  getZones() {
    return new Promise((resolve) => {
      this.zoneList = [];
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
      this.zoneList[0]["zoneName"] = "--Select Zone--";
      resolve(true);
    });
  }

  getEmployeeData() {
    let workDetailsPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/WorkerDetails";
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe((workerData) => {
      workDetails.unsubscribe();

      if (workerData != undefined) {
        let driverList = workerData["driver"].toString().split(",");
        let helperList = workerData["helper"].toString().split(",");
        let driverId = driverList[driverList.length - 1].trim();
        let helperId = helperList[helperList.length - 1].trim();
        this.getEmployee(driverId, "driver");
        this.getEmployee(helperId, "helper");
      } else {
        this.commonService.setAlertMessage("success", "No work assign selected zone on selected date!!!");
      }
    });
  }

  getEmployee(empId: any, empType: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      if (empType == "driver") {
        this.progressData.driverName = employee["name"] != null ? employee["name"].toUpperCase() : "Not Assigned";
        this.progressData.driverMobile = employee["mobile"] != null ? employee["mobile"] : "---";
        this.progressData.driverImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? employee["profilePhotoURL"] : this.defaultImageUrl;
      } else {
        this.progressData.helperName = employee["name"] != null ? employee["name"].toUpperCase() : "Not Assigned";
        this.progressData.helperMobile = employee["mobile"] != null ? employee["mobile"] : "---";
        this.progressData.helperImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? employee["profilePhotoURL"] : this.defaultImageUrl;
      }
    });
  }

  showCardDetail(content: any) {
    if (this.cardNotScanedList.length > 0) {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let windowWidth = $(window).width();
      let height = 870;
      let width = windowWidth - 300;
      height = (windowHeight * 90) / 100;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      let divHeight = height - 50 + "px";
      $("div .modal-content")
        .parent()
        .css("max-width", "" + width + "px")
        .css("margin-top", marginTop);
      $("div .modal-content")
        .css("height", height + "px")
        .css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", marginTop);
      $("#divStatus").css("height", divHeight);
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  showAllMarkers() {
    if (this.userType != "External User") {
      if (this.showAllScanedCard == true) {
        this.showAllScanedCard = false;
      } else {
        this.showAllScanedCard = true;
      }
      if (this.houseMarkerList.length > 0) {
        for (let i = 0; i < this.houseMarkerList.length; i++) {
          this.houseMarkerList[i]["marker"].setMap(null);
        }
        this.houseMarkerList = [];
      }
      if (this.houseList.length > 0) {
        for (let i = 0; i < this.houseList.length; i++) {
          this.progressData.scanedHouses = 0;
          this.getScanedCard(this.houseList[i]["cardNo"], "red");
        }
      }
    }
  }

  showHouse() {
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        this.houseMarkerList[i]["marker"].setMap(null);
      }
      this.houseMarkerList = [];
    }
    this.cardNotScanedList = [];
    let element = <HTMLInputElement>document.getElementById("isHouse");
    if (element.checked == true) {
      $("#isHouse").prop("disabled", true);
      $("#houseCount").show();
      $("#houseDetail").hide();
      $("#isHouse").prop("disabled", false);
      if (this.houseList.length == 0) {
        let element = <HTMLInputElement>document.getElementById("isHouse");
        if (element.checked == true) {
          $("#isHouse").prop("disabled", true);
          this.getHouses().then(() => {
            $("#isHouse").prop("disabled", false);
            this.getCardNotScaned();
          });
        }
      } else {
        for (let i = 0; i < this.houseList.length; i++) {
          this.progressData.scanedHouses = 0;
          this.progressData.houses = this.houseList.length;
          this.getScanedCard(
            this.houseList[i]["cardNo"],
            this.houseList[i]["markerType"]
          );
          $("#isHouse").prop("disabled", false);
          this.getCardNotScaned();
        }
      }
    } else {
      $("#isHouse").prop("disabled", false);
      $("#houseCount").hide();
      $("#houseDetail").hide();
      if (this.houseMarkerList.length > 0) {
        for (let i = 0; i < this.houseMarkerList.length; i++) {
          this.houseMarkerList[i]["marker"].setMap(null);
        }
      }
    }
    if (this.selectedDate == this.toDayDate) {
      setTimeout(() => {
        this.isFirst = true;
        if (this.cardInstance != null) {
          this.cardInstance.unsubscribe();
        }
        this.getRecentCardDetail();
      }, 3000);
    }
  }

  getHouses() {
    this.totalWardHouse = 0;
    return new Promise((resolve) => {
      let houseLocalList = JSON.parse(localStorage.getItem("houseList"));
      if (houseLocalList == null) {
        this.getLocalStorageHouse();
      } else {
        let houseList = houseLocalList.filter(
          (item) => item.ward == this.selectedZone
        );
        if (houseList.length == 0) {
          this.getLocalStorageHouse();
        } else {
          for (let i = 0; i < houseList.length; i++) {
            let lat = houseList[i]["lat"];
            let lng = houseList[i]["lng"];
            let cardNo = houseList[i]["cardNo"];
            let isApproved = "no";

            let markerType = "red";

            this.houseList.push({
              wardNo: this.selectedZone,
              markerType: markerType,
              lat: lat,
              lng: lng,
              cardNo: cardNo,
              isApproved: isApproved,
              isActive: false,
            });
            this.totalWardHouse = this.totalWardHouse + 1;
            if (i == houseList.length - 1) {
              this.progressData.houses = this.totalWardHouse;
            }
            this.getScanedCard(cardNo, markerType);
          }
        }
      }

      resolve(true);
    });
  }

  getLocalStorageHouse() {
    for (let i = 1; i <= this.wardLines; i++) {
      let lineNo = i;
      let housePath = "Houses/" + this.selectedZone + "/" + lineNo;
      let houseInstance = this.db.list(housePath).valueChanges().subscribe((houseData) => {
        houseInstance.unsubscribe();
        if (houseData.length > 0) {
          for (let j = 0; j < houseData.length; j++) {
            let lat = houseData[j]["latLng"].replace("(", "").replace(")", "").split(",")[0];
            let lng = houseData[j]["latLng"].replace("(", "").replace(")", "").split(",")[1];
            let cardNo = houseData[j]["cardNo"];
            let rfId = houseData[j]["rfid"];
            let name = houseData[j]["name"];
            let ward = this.selectedZone;
            let line = houseData[j]["line"];
            let isApproved = "no";
            if (houseData[j]["isApproved"] != null) {
              if (houseData[j]["isApproved"] == "yes") {
                isApproved = "yes";
              }
            }
            let markerType = "red";

            this.houseList.push({
              wardNo: this.selectedZone,
              markerType: markerType,
              lat: lat,
              lng: lng,
              cardNo: cardNo,
              isApproved: isApproved,
              isActive: false,
            });
            let houseLocalList = JSON.parse(
              localStorage.getItem("houseList")
            );
            if (houseLocalList == null) {
              houseLocalList = [];
              houseLocalList.push({
                ward: ward,
                name: name,
                cardNo: cardNo,
                rfId: rfId,
                line: line,
                lat: lat,
                lng: lng,
              });
            } else {
              let houseDetail = houseLocalList.find((item) => item.cardNo == cardNo && item.ward == this.selectedZone);
              if (houseDetail == undefined) {
                houseLocalList.push({
                  ward: ward,
                  name: name,
                  cardNo: cardNo,
                  rfId: rfId,
                  line: line,
                  lat: lat,
                  lng: lng,
                });
              }
            }
            this.totalWardHouse = Number(this.totalWardHouse) + 1;
            if (lineNo == this.wardLines) {
              this.progressData.houses = this.totalWardHouse;
            }
            this.getScanedCard(cardNo, markerType);
            localStorage.setItem("houseList", JSON.stringify(houseLocalList));
          }
        }
      });
    }
  }

  getCardNotScanned() {
    this.progressData.cardNotScaned = 0;
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/ImagesData";
    this.notScanInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      // notScanInstance.unsubscribe();
      if (this.selectedDate != this.toDayDate) {
        this.notScanInstance.unsubscribe();
      }
      if (data != null) {
        let count = 0;
        this.cardNotScanedList = [];
        let city = this.commonService.getFireStoreCity();
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          if (lineNo != "totalCount") {
            let obj = data[lineNo];
            let keyArrayLine = Object.keys(obj);
            if (keyArrayLine.length > 0) {
              for (let j = 0; j < keyArrayLine.length; j++) {
                let index = keyArrayLine[j];
                if (obj[index]["cardImage"] != null) {
                  let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FHousesCollectionImagesData%2F" + this.selectedZone + "%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + lineNo + "%2F" + obj[index]["cardImage"] + "?alt=media";
                  let time = obj[index]["scanTime"].split(":")[0] + ":" + obj[index]["scanTime"].split(":")[1];
                  this.cardNotScanedList.push({
                    imageUrl: imageUrl,
                    time: time,
                    lineNo: lineNo,
                  });
                  count++;
                }
              }
            }
          }
        }
        this.progressData.cardNotScaned = count;
      }
    });
  }

  getCardNotScaned() {
    this.cardNotScanedList = [];
    let oldDate = new Date("2021-08-12");
    let currentDate = new Date(this.selectedDate);
    if (currentDate >= oldDate) {
      this.getCardNotScanned();
    } else {
      this.progressData.cardNotScaned = 0;
      let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/ImagesData";
      this.notScanInstance = this.db.list(dbPath).valueChanges().subscribe((data) => {
        // notScanInstance.unsubscribe();
        if (this.selectedDate != this.toDayDate) {
          this.notScanInstance.unsubscribe();
        }
        this.cardNotScanedList = [];

        if (data.length > 0) {
          let count = 0;
          let city = this.commonService.getFireStoreCity();
          for (let i = 0; i < data.length; i++) {
            if (data[i]["cardImage"] != null) {
              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FHousesCollectionImagesData%2F" + this.selectedZone + "%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + data[i]["cardImage"] + "?alt=media";
              let time = data[i]["scanTime"].split(":")[0] + ":" + data[i]["scanTime"].split(":")[1];
              this.cardNotScanedList.push({ imageUrl: imageUrl, time: time });
              count++;
            }
          }
          this.progressData.cardNotScaned = count;
        }
      });
    }
  }

  getScanedCard(cardNo: any, markerType: any) {
    let scanCardPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + cardNo + "/scanBy";
    let scanInfo = this.db.object(scanCardPath).valueChanges().subscribe((scanBy) => {
      let houseDetails = this.houseList.find((item) => item.cardNo == cardNo);
      if (houseDetails != undefined) {
        scanInfo.unsubscribe();
        if (this.showAllScanedCard == true) {
          if (scanBy != undefined) {
            this.progressData.scanedHouses =
              Number(this.progressData.scanedHouses) + 1;
            markerType = "green";
          }
        } else {
          if (scanBy != null) {
            if (scanBy != "-1") {
              this.progressData.scanedHouses =
                Number(this.progressData.scanedHouses) + 1;
              markerType = "green";
            }
          }
        }
        houseDetails.markerType = markerType;
        this.plotHouses(
          houseDetails.markerType,
          houseDetails.lat,
          houseDetails.lng,
          cardNo,
          false
        );
      }
    });
  }

  getRecentCardDetail() {
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/recentScanned";
    this.cardInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      if (this.selectedDate != this.toDayDate) {
        this.cardInstance.unsubscribe();
      }
      if (data != null) {
        if (this.showAllScanedCard == true) {
          if (data["isShowMessage"] == "yes") {
            this.showMessage(data["cardNo"], data["scanTime"]);
          }
          this.setMarkerCurrent(data["cardNo"]);
        } else {
          if (data["scanBy"] != "-1") {
            if (data["isShowMessage"] == "yes") {
              this.showMessage(data["cardNo"], data["scanTime"]);
            }
            this.setMarkerCurrent(data["cardNo"]);
          }
        }
      } else {
        this.isFirst = false;
      }
    });
  }

  setMarkerCurrent(cardNo: any) {
    let element = <HTMLInputElement>document.getElementById("isHouse");

    if (this.currentMarker != null) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        if (this.houseMarkerList[i]["cardNo"] == this.currentMarker) {
          this.houseMarkerList[i]["marker"].setMap(null);
          let cardDetail = this.houseList.find(
            (item) => item.cardNo == this.currentMarker
          );
          if (cardDetail != null) {
            cardDetail.markerType = "green";
            cardDetail.isActive = false;
            if (element.checked == true) {
              let imgUrl =
                "../assets/img/" + cardDetail.markerType + "-home.png";

              let marker = new google.maps.Marker({
                position: {
                  lat: Number(cardDetail.lat),
                  lng: Number(cardDetail.lng),
                },
                map: this.map,
                icon: {
                  url: imgUrl,
                  fillOpacity: 1,
                  strokeWeight: 0,
                  scaledSize: new google.maps.Size(16, 15),
                },
              });
              this.houseMarkerList[i]["marker"] = marker;
            }
          }
          i = this.houseMarkerList.length;
        }
      }
    }
    for (let i = 0; i < this.houseMarkerList.length; i++) {
      if (this.houseMarkerList[i]["cardNo"] == cardNo) {
        this.houseMarkerList[i]["marker"].setMap(null);
        let cardDetail = this.houseList.find((item) => item.cardNo == cardNo);
        if (cardDetail != null) {
          if (this.isFirst == false) {
            this.progressData.scanedHouses =
              Number(this.progressData.scanedHouses) + 1;
          }
          this.isFirst = false;
          cardDetail.markerType = "green";
          cardDetail.isActive = true;
          if (element.checked == true) {
            let imgUrl = "../assets/img/" + cardDetail.markerType + "-home.png";

            let marker = new google.maps.Marker({
              position: {
                lat: Number(cardDetail.lat),
                lng: Number(cardDetail.lng),
              },
              map: this.map,
              icon: {
                url: imgUrl,
                fillOpacity: 1,
                strokeWeight: 0,
                scaledSize: new google.maps.Size(16, 15),
              },
            });
            marker.setAnimation(google.maps.Animation.BOUNCE);
            this.houseMarkerList[i]["marker"] = marker;
          }
        }
        i = this.houseMarkerList.length;
      }
    }
    this.currentMarker = cardNo;
  }

  showMessage(cardNo: any, scanTime: any) {
    let dbPath = "CardWardMapping/" + cardNo;
    let mapInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      mapInstance.unsubscribe();
      if (data != null) {
        let lineNo = data["line"];
        let ward = data["ward"];
        dbPath = "Houses/" + ward + "/" + lineNo + "/" + cardNo;
        let houseInstance = this.db.object(dbPath).valueChanges().subscribe((dataHouse) => {
          houseInstance.unsubscribe();
          if (dataHouse != null) {
            let name = dataHouse["name"];
            let time = scanTime;
            let notificationTime = new Date(this.toDayDate + " " + time);
            let currentTime = new Date();
            let timeDiff = this.commonService.timeDifferenceMin(
              currentTime,
              notificationTime
            );
            if (timeDiff < 3) {
              time = time.split(":")[0] + ":" + time.split(":")[1];
              let message =
                name + " के यहां से " + time + " बजे कचरा उठा लिया गया है";
              this.commonService.setAlertMessageWithLeftPosition(
                "success",
                message,
                "alert alert-houses "
              );
            }
          }
        });
      }
    });
  }

  plotHouses(markerType: string, lat: any, lng: any, cardNo: any, isActive: any) {
    let element = <HTMLInputElement>document.getElementById("isHouse");
    if (element.checked == true) {
      let imgUrl = "../assets/img/" + markerType + "-home.png";
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
        icon: {
          url: imgUrl,
          fillOpacity: 1,
          strokeWeight: 0,
          scaledSize: new google.maps.Size(16, 15),
        },
      });

      if (isActive == true) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
      this.houseMarkerList.push({ cardNo: cardNo, marker: marker });
    }
  }

  showSkipLineDetail(content: any) {
    this.skipLineList = [];
    let dbPath = "SkipCaptureImage/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;
    let skipLineInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        skipLineInstance.unsubscribe();
        if (data != null) {
          console.log(data);
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let imageUrl = data[index]["imageUrl"];
              let time = data[index]["time"];
              let reason = data[index]["reason"];
              this.skipLineList.push({ lineNo: index, imageUrl: imageUrl, time: time, reason: reason })
            }
          }
          this.modalService.open(content, { size: "lg" });
          let windowHeight = $(window).height();
          let windowWidth = $(window).width();
          let height = 870;
          let width = windowWidth - 300;
          height = (windowHeight * 90) / 100;
          let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
          let divHeight = height - 50 + "px";
          $("div .modal-content")
            .parent()
            .css("max-width", "" + width + "px")
            .css("margin-top", marginTop);
          $("div .modal-content")
            .css("height", height + "px")
            .css("width", "" + width + "px");
          $("div .modal-dialog-centered").css("margin-top", marginTop);
          $("#divStatus").css("height", divHeight);
        }
        else {
          this.commonService.setAlertMessage("error", "No Skipped Lines!!!");
        }
      }
    );

  }
}

export class progressDetail {
  totalLines: number;
  completedLines: number;
  skippedLines: number;
  pendingLines: number;
  currentLine: number;
  wardLength: string;
  coveredLength: string;
  driverName: string;
  driverMobile: string;
  driverImageUrl: string;
  helperName: string;
  helperMobile: string;
  helperImageUrl: string;
  houses: number;
  scanedHouses: number;
  parshadName: string;
  parshadMobile: string;
  cardNotScaned: number;
}
