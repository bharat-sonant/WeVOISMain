/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

//services
import { CommonService } from '../services/common/common.service';
import { MapService } from '../services/map/map.service';
import * as $ from "jquery";
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-route-tracking',
  templateUrl: './route-tracking.component.html',
  styleUrls: ['./route-tracking.component.scss']
})
export class RouteTrackingComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private actRoute: ActivatedRoute, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  zoneKML: any;
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
  currentMonthName: any;
  currentYear: any;
  public startTime: any;
  endTime: any;
  timeInterval: any;
  fixdGeoLocations: any[] = [];
  selectedZoneNo: any;
  selectedZoneName: any;
  selectedDate: any;
  preSelectedMonth: any;
  preSelectedYear: any;
  routeLocation: any[];
  routePathStore: any[];
  allMarkers: any[] = [];
  allKml: any[] = [];
  monthDetail: any[] = [];
  maximaumDistance: number;
  minimumDistance: number;
  isTiming: any;
  totalTiminingKM: any;
  isPreviousTime: any;
  vehicleName: any;
  routeMarker: any[] = [];
  timerHandle: any[] = [];
  isStart = false;
  lineDataList: any[] = [];
  lineIndex: any = 0;
  speed: any;
  skip: any;
  isLast = false;
  isReset = false;
  savedDataList: any[] = [];
  routePath: any[] = [];
  instancesList: any[];
  isActualData: any;
  trackData: trackDetail =
    {
      totalKM: 0,
      totalTime: "0 hr 0 min",
      time: "0:00",
      percentage: "0"
    };

  ngOnInit() {
    this.instancesList = [];
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    //this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.isActualData = localStorage.getItem("isActual");
    this.setSpeed(Number($('#ddlSpeed').val()));
    $('#btnPre').show();
    $('#btnReset').hide();
    this.getMinmumMaximumDistance();
    this.toDayDate = this.commonService.setTodayDate();
    if (this.toDayDate.split('-')[2] == "01") {
      localStorage.setItem("routeMonthDetail", null);
      localStorage.setItem("savedRouteData", null);
    }

    this.selectedDate = this.toDayDate;
    $('#txtDate').val(this.toDayDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.toDayDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.preSelectedMonth = this.toDayDate.split('-')[1];
    this.preSelectedYear = this.toDayDate.split('-')[0];
    this.timeInterval = 0;
    this.selectedZone = "0";
    this.getZoneList();

    const id = this.actRoute.snapshot.paramMap.get('id');
    if (id != null) {
      if (id.includes("~")) {
        let zoneUrl = id.toString().split("~")[0] + "(" + id.toString().split("~")[1] + ")";
        this.selectedZone = zoneUrl;
      }
      else {
        this.selectedZone = id.trim();
      }
    }
    else {
      this.selectedZone = "1";
    }
    this.setMaps();
    this.onSubmit();
  }

  getIcon(type: any) {
    let icon = "";
    if (type == "start") {
      icon = "../../../assets/img/start.svg";
    }
    else if (type == "stop") {
      icon = "../../../assets/img/stop.svg";
    }
    else if (type == "activeVehicle") {
      icon = '../assets/img/tipper-green.png';
    }
    else if (type == "stopVehicle") {
      icon = '../assets/img/tipper-red.png';
    }
    else if (type == "deActiveVehicle") {
      icon = '../assets/img/tipper-gray.png';
    }
    else if (type == "activeTractor") {
      icon = '../assets/img/active-tractormdpi.png';
    }
    else if (type == "stopTractor") {
      icon = '../assets/img/stop-tractormdpi.png';
    }
    else if (type == "deActiveTractor") {
      icon = '../assets/img/disabled-tractormdpi.png';
    }
    else if (type == "startMarker") {
      icon = "../../../assets/img/start.svg";
    }
    else if (type == "stopMarker") {
      icon = "../../../assets/img/greenmarker.png";
    }
    else if (type == "carMarker") {
      icon = "../../../assets/img/red-car.png";
    }
    return icon;
  }

  getMinmumMaximumDistance() {
    let dbDistancePath = "Settings/RoueTrackings";
    let distanceDetail = this.db.object(dbDistancePath).valueChanges().subscribe(
      distanceData => {
        distanceDetail.unsubscribe();
        if (distanceData != null) {
          this.maximaumDistance = parseFloat(distanceData["maximumDistanceCanCoverInOneSecondInMeters"]);
          this.minimumDistance = parseFloat(distanceData["minimumDistanceShouldCoverinOneSecondInMeter"])
        }
      });
  }

  setDate(filterVal: any, type: string) {
    this.setMapOnAll();
    if (type == 'current') {
      this.selectedDate = filterVal;
    } else if (type == 'next') {
      let nextDate = this.commonService.getNextDate($('#txtDate').val(), 1);
      this.selectedDate = nextDate;
    } else if (type == 'previous') {
      let previousDate = this.commonService.getPreviousDate($('#txtDate').val(), 1);
      this.selectedDate = previousDate;
    }
    $('#txtDate').val(this.selectedDate);
    if (new Date(this.selectedDate.toString()) <= new Date(this.commonService.setTodayDate())) {
      this.selectedDate = filterVal;
      if (this.timerHandle[this.lineIndex - 1]) {
        clearTimeout(this.timerHandle[this.lineIndex - 1]);
      }
      this.isReset = true;
      this.isStart = false;
      $('#playStop').removeClass("fas fa-stop-circle");
      $('#playStop').addClass("fab fa-youtube");
      $('#btnPre').show();
      $('#btnReset').hide();
      $('#txtDate').val();
      this.lineDataList = [];
      this.lineIndex = 0;
      this.isTiming = false;
      this.isPreviousTime = false;
      this.totalTiminingKM = 0;
      $('#ddlTime').val("0");
      this.startTime = 0;
      this.endTime = null;
      this.onSubmit();
    }
    else {
      $('#txtDate').val(this.toDayDate);
      this.commonService.setAlertMessage("error", "Selected date is greater then today date.");
    }
  }

  changeZoneSelection(filterVal: any) {
    if (this.timerHandle[this.lineIndex - 1]) {
      clearTimeout(this.timerHandle[this.lineIndex - 1]);
    }
    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').show();
    $('#btnReset').hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.isTiming = false;
    this.isPreviousTime = false;
    this.totalTiminingKM = 0;
    this.selectedDate = $('#txtDate').val();
    $('#ddlTime').val("0");
    this.selectedZoneNo = this.selectedZone;
    this.polylines = [];
    this.timeInterval = 0;
    this.startTime = 0;
    this.endTime = null;
    this.lineIndex = -1;
    this.selectedZone = filterVal;
    this.selectedZoneName = "Ward " + filterVal;
    this.onSubmit();
  }

  setHeight() {
    $('.navbar-toggler').show();
    setTimeout(() => {
      $('#divMap').css("height", $(window).height() - 80);
    }, 2000);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setWardBoundary() {
    this.commonService.getWardBoundary(this.selectedZoneNo, this.zoneKML,2).then((data: any) => {
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
  }

  onSubmit() {
    this.isTiming = false;
    this.isPreviousTime = false;
    this.totalTiminingKM = 0;
    this.selectedDate = $('#txtDate').val();
    let selectedMonth = this.selectedDate.split('-')[1];
    let selectedYear = this.selectedDate.split('-')[0];
    //if (this.preSelectedMonth != selectedMonth || this.preSelectedYear != selectedYear) {
    //   localStorage.setItem("routeMonthDetail", null);
    //  localStorage.setItem("savedRouteData", null);
    //   this.preSelectedYear = selectedYear;
    //   this.preSelectedMonth = selectedMonth;
    //  }
    this.selectedZoneNo = this.selectedZone;
    this.polylines = [];
    this.setMaps();
    this.setWardBoundary();
    if (this.selectedDate == this.toDayDate) {
      this.showVehicleMovement();
    }
    else {
      this.marker.setMap(null);
    }
    this.getSavedData();
    this.getMonthDetail();
    this.getFixedGeoLocation();
  }


  showVehicleMovement() {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/vehicle";
    let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
      routePath => {
        if (routePath != null) {
          this.vehicleName = routePath;
          if (this.vehicleLocationInstance != undefined) {
            this.vehicleLocationInstance.unsubscribe();
          }
          let dbPath = "CurrentLocationInfo/" + this.selectedZone + "/latLng";
          this.vehicleLocationInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              this.instancesList.push({ instances: this.vehicleLocationInstance });
              if (data != undefined) {
                dbPath = "RealTimeDetails/WardDetails/" + this.selectedZone + "/activityStatus";
                let statusInstance = this.db.object(dbPath).valueChanges().subscribe(
                  statusData => {
                    statusInstance.unsubscribe();
                    let statusId = statusData.toString();
                    let vehicleIcon = '';
                    if (this.vehicleName.includes("TRACTOR")) {
                      vehicleIcon = this.getIcon("activeTractor");
                      if (statusId == 'completed') {
                        vehicleIcon = this.getIcon("deActiveTractor");
                      } else if (statusId == 'stopped') {
                        vehicleIcon = this.getIcon("stopTractor");
                      }
                    }
                    else {
                      vehicleIcon = this.getIcon("activeVehicle");
                      if (statusId == 'completed') {
                        vehicleIcon = this.getIcon("deActiveVehicle");
                      } else if (statusId == 'stopped') {
                        vehicleIcon = this.getIcon("stopVehicle");
                      }
                    }
                    let location = data.toString().split(",");
                    let lat = Number(location[0]);
                    let lng = Number(location[1]);
                    this.marker.setMap(null);
                    this.marker = new google.maps.Marker({
                      position: { lat: Number(lat), lng: Number(lng) },
                      map: this.map,
                      icon: vehicleIcon,
                    });
                  });
              }
            });
        }
        vehicleTracking.unsubscribe();
      });
  }

  getRouteData(timeInt: any) {
    this.timeInterval = parseInt(timeInt);
    this.setSpeed(Number($('#ddlSpeed').val()));
    this.setMapOnAll();
    if (this.timeInterval == 0) {
      this.endTime = null;
      this.isPreviousTime = false;
    }
    else {
      if (this.endTime != null) {
        this.endTime = parseInt(this.endTime) + parseInt(timeInt) - 1;
        if (this.isPreviousTime == false) {
          this.isPreviousTime = true;
        }
      }
      else {
        this.endTime = parseInt(timeInt) - 1;
        this.isPreviousTime = false;
      }
    }
    this.getVehicleRouteTime();
  }

  getRouteDataPreNext(type: any) {
    if (this.timeInterval != 0) {
      this.setMapOnAll();
      if (type == "pre") {
        this.endTime = this.endTime - this.timeInterval;
        if (this.endTime < 0) {
          this.endTime = 0;
        }
        this.getVehicleRouteTime();
        if (this.isStart == false) {
          this.lineIndex = this.lineDataList.length - 5;
          if (this.routeMarker[0] != null) {
            if (this.routeMarker[0]["marker"] != null) {
              this.routeMarker[0]["marker"].setPosition(this.lineDataList[this.lineIndex]);
              this.map.setCenter(this.lineDataList[this.lineIndex]);
            }
          }
        }
      }
      else {
        this.endTime = this.endTime + this.timeInterval;
        this.getVehicleRouteTime();
      }
    }
  }

  playRoute() {
    this.setMapOnAll();
    this.timeInterval = 1;
    this.endTime = 0;
    this.getVehicleRouteTime();
    setInterval(() => {
      this.setMapOnAll();
      this.timeInterval = 1;
      this.endTime = this.endTime + this.timeInterval;
      this.getVehicleRouteTime();
    }, 600);
  }

  getFixedGeoLocation() {
    this.fixdGeoLocations = JSON.parse(localStorage.getItem("fixedLocation"));;
    if (this.fixdGeoLocations != null) {
      if (this.fixdGeoLocations.length > 0) {
        for (let i = 0; i < this.fixdGeoLocations.length; i++) {
          let lat = this.fixdGeoLocations[i]["lat"];
          let lng = this.fixdGeoLocations[i]["lng"];
          let markerURL = "../../../assets/img/" + this.fixdGeoLocations[i]["img"];
          var markerLabel = "";
          let contentString = '<b>' + this.fixdGeoLocations[i]["name"] + '</b>: ' + this.fixdGeoLocations[i]["address"];
          this.setMarker(lat, lng, markerLabel, markerURL, contentString, "fixed");
        }
      }
    }
  }

  setMarker(lat: any, lng: any, markerLabel: any, markerURL: any, contentString: any, type: any) {
    let scaledHeight = 50;
    let scaledWidth = 50;
    if (type == "route") {
      scaledHeight = 10;
      scaledWidth = 20;
    }
    else if (type == "routeMarker") {
      scaledHeight = 25;
      scaledWidth = 31;
    }

    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      label: { text: ' ' + markerLabel + ' ', color: "white", fontSize: "12px", fontWeight: "bold" },
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(scaledHeight, scaledWidth),
        origin: new google.maps.Point(0, 0),
        labelOrigin: new google.maps.Point(25, 31)
      }
    });

    let infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    marker.addListener('click', function () {
      infowindow.open(this.map, marker);
    });
    if (type == "all" || type == "routeMarker") {
      this.allMarkers.push({ marker });
    }
    else if (type == "route") {
      if (this.routeMarker.length > 0) {
        this.routeMarker[0]["matker"] = marker;
      }
      else {
        this.routeMarker.push({ marker });
      }
    }
  }

  getSavedData() {
    if (this.selectedDate != this.toDayDate) {
      this.routePath = JSON.parse(localStorage.getItem("savedRouteData"));
      let previousDate = this.commonService.getPreviousDate(this.commonService.setTodayDate(), 4);

      let localroutePath = [];
      if (this.routePath != null) {

        for (let i = 0; i < this.routePath.length; i++) {
          if (new Date(this.routePath[i]["date"]) >= new Date(previousDate)) {
            localroutePath.push({ wardNo: this.routePath[i]["wardNo"], date: this.routePath[i]["date"], routePath: this.routePath[i]["routePath"] });
          }
        }
        localStorage.setItem('savedRouteData', JSON.stringify(localroutePath));
        let zoneDetails = localroutePath.find(item => item.wardNo == this.selectedZone && item.date == this.selectedDate);
        if (zoneDetails != undefined) {
          this.routePath = zoneDetails.routePath;

          this.routePathStore = [];
          let lineData = [];
          let totalKM: number = 0;
          var keyArray = Object.keys(this.routePath);
          for (let i = 0; i < keyArray.length - 2; i++) {
            let index = keyArray[i];
            let totalDistance = 0;
            this.routePathStore.push({ distanceinmeter: this.routePath[index]["distance-in-meter"], latlng: this.routePath[index]["lat-lng"], time: index });

            let myTotalKM: number = 0;
            totalKM += parseFloat(parseFloat(this.routePath[index]["distance-in-meter"]).toFixed(8));

            if (lineData.length > 0) {
              let lat = lineData[lineData.length - 1]["lat"];
              let lng = lineData[lineData.length - 1]["lng"];
              lineData = [];
              lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
            }
            let routeDateList = [];
            let latLong: string = this.routePath[index]["lat-lng"];
            routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
            for (let j = 0; j < routeDateList.length; j++) {
              let routePart = routeDateList[j].split(',');
              if (routePart.length == 2) {
                if (lineData.length > 0) {
                  let lat = lineData[lineData.length - 1]["lat"];
                  let lng = lineData[lineData.length - 1]["lng"];
                  let distance = this.getDistanceFromLatLonInKm(lat, lng, parseFloat(routePart[0]), parseFloat(routePart[1]));

                  let distanceInMeter = distance * 1000;
                  totalDistance += distanceInMeter;
                  lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]), distance: distance });
                }
                else {
                  lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]), distance: 0 });
                }
              }
            }
            if (lineData != undefined) {
              let status = "LineCompleted";
              let line = new google.maps.Polyline({
                path: lineData,
                strokeColor: this.commonService.getLineColor(status),
                strokeWeight: 2
              });

              if (i == 0) {
                let lat = lineData[0]["lat"];
                let lng = lineData[0]["lng"];
                let markerURL = this.getIcon("start");
                var markerLabel = "";
                let contentString = 'Start time: ' + index;
                this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
              }

              if (this.selectedDate != this.toDayDate) {
                if (i == this.routePath.length - 2) {
                  let lat = lineData[lineData.length - 1]["lat"];
                  let lng = lineData[lineData.length - 1]["lng"];
                  let markerURL = this.getIcon("stop");
                  var markerLabel = "";
                  let contentString = 'End time: ' + index;
                  this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
                }
              }
              else {
                if (i == this.routePath.length - 2) {
                  let dbPath = "RealTimeDetails/WardDetails/" + this.selectedZoneNo;
                  let vehicleDutyData = this.db.object(dbPath).valueChanges().subscribe(
                    dutyData => {
                      vehicleDutyData.unsubscribe();
                      if (dutyData != null) {
                        if (dutyData["isOnDuty"] != "yes") {
                          let lat = lineData[lineData.length - 1]["lat"];
                          let lng = lineData[lineData.length - 1]["lng"];
                          let markerURL = this.getIcon("stop");
                          var markerLabel = "";
                          let contentString = 'End time: ' + index;
                          this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
                        }
                      }
                    });
                }
              }
              this.polylines[i] = line;
              this.polylines[i].setMap(this.map);
              this.trackData.totalKM = parseFloat((totalKM / 1000).toFixed(2));
              this.trackData.time = index;
            }
            myTotalKM = parseFloat((parseFloat((totalDistance).toFixed(8)) / 1000).toFixed(8));
          }
          if (this.routePathStore.length > 0) {
            let startTime = this.routePathStore[0]["time"];
            let endTime = this.routePathStore[0]["time"];
            if (this.routePathStore.length > 1) {
              endTime = this.routePathStore[this.routePathStore.length - 1]["time"];
            }
            let sTime = this.selectedDate + " " + startTime;

            let eTime = this.selectedDate + " " + endTime;
            let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
            this.trackData.totalTime = this.commonService.getHrsFull(totalMinutes);
          }

          if (this.isStart == true) {
            this.lineDataList = [];
            for (let i = 0; i < this.polylines.length; i++) {
              let routeDateList = [];
              let latLong: string = this.routePathStore[i]["latlng"];
              routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
              for (let j = 0; j < routeDateList.length; j++) {
                let routePart = routeDateList[j].split(',');
                if (routePart.length == 2) {
                  this.lineDataList.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
                }
              }
            }
            if (this.lineIndex == 0) {
              this.createMarker();
            }
            this.animate(this.lineIndex);
          }
        }
        else {
          this.getVehicleRoute();
        }
      }
      else {
        this.getVehicleRoute();
      }
    }
    else {
      this.getVehicleRoute();
    }
  }

  getVehicleRoute() {
    this.setMapOnAll();
    $('#ddlTime').val(0);

    this.isPreviousTime = false;
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "LocationHistory/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
    let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
      routePath => {
        vehicleTracking.unsubscribe();
        if (routePath != null) {
          this.routePathStore = [];
          let lineData = [];
          let totalKM: number = 0;
          let routeKeyArray = Object.keys(routePath);
          let keyArray = [];
          if (routeKeyArray.length > 0) {
            if (this.isActualData == 0) {
              keyArray = routeKeyArray;
            }
            else {
              for (let i = 0; i < routeKeyArray.length; i++) {
                if (!routeKeyArray[i].toString().includes('-')) {
                  keyArray.push(routeKeyArray[i]);
                }
              }
            }
          }

          for (let i = 0; i < keyArray.length - 2; i++) {
            let index = keyArray[i];
            let time=index.toString().split('-')[0];
            let totalDistance = 0;
            this.routePathStore.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });

            let myTotalKM: number = 0;
            totalKM += parseFloat(parseFloat(routePath[index]["distance-in-meter"]).toFixed(8));
            if (lineData.length > 0) {
              let lat = lineData[lineData.length - 1]["lat"];
              let lng = lineData[lineData.length - 1]["lng"];
              lineData = [];
              lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
            }
            let routeDateList = [];
            let latLong: string = routePath[index]["lat-lng"];
            routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
            for (let j = 0; j < routeDateList.length; j++) {
              let routePart = routeDateList[j].split(',');
              if (routePart.length == 2) {
                if (lineData.length > 0) {
                  let lat = lineData[lineData.length - 1]["lat"];
                  let lng = lineData[lineData.length - 1]["lng"];
                  let distance = this.getDistanceFromLatLonInKm(lat, lng, parseFloat(routePart[0]), parseFloat(routePart[1]));
                  let distanceInMeter = distance * 1000;
                  totalDistance += distanceInMeter;
                  lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]), distance: distance });
                }
                else {
                  lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]), distance: 0 });
                }
              }
            }
            if (lineData != undefined) {
              let status = "LineCompleted";
              let line = new google.maps.Polyline({
                path: lineData,
                strokeColor: this.commonService.getLineColor(status),
                strokeWeight: 2
              });

              if (i == 0) {
                let lat = lineData[0]["lat"];
                let lng = lineData[0]["lng"];
                let markerURL = this.getIcon("start");
                var markerLabel = "";
                let contentString = '<br/>Start time: ' + index;
                this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
              }

              if (this.selectedDate != this.toDayDate) {
                if (i == keyArray.length - 3) {
                  let lat = lineData[lineData.length - 1]["lat"];
                  let lng = lineData[lineData.length - 1]["lng"];
                  let markerURL = this.getIcon("stop");
                  var markerLabel = "";
                  let contentString = '<br/>End time: ' + index;
                  this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
                }
              }
              else {
                if (i == keyArray.length - 3) {
                  dbPath = "RealTimeDetails/WardDetails/" + this.selectedZoneNo;
                  let vehicleDutyData = this.db.object(dbPath).valueChanges().subscribe(
                    dutyData => {
                      vehicleDutyData.unsubscribe();
                      if (dutyData != null) {
                        if (dutyData["isOnDuty"] != "yes") {
                          let lat = lineData[lineData.length - 1]["lat"];
                          let lng = lineData[lineData.length - 1]["lng"];
                          let markerURL = this.getIcon("stop");
                          var markerLabel = "";
                          let contentString = '<br/>End time: ' + index;
                          this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
                        }
                      }
                    });
                }
              }
              this.polylines[i] = line;
              this.polylines[i].setMap(this.map);
              this.trackData.totalKM = parseFloat((totalKM / 1000).toFixed(2));
              this.trackData.time = index;
            }
            myTotalKM = parseFloat((parseFloat((totalDistance).toFixed(8)) / 1000).toFixed(8));
          }
          if (this.routePathStore.length > 0) {
            let startTime = this.routePathStore[0]["time"];
            let endTime = this.routePathStore[0]["time"];
            if (this.routePathStore.length > 1) {
              endTime = this.routePathStore[this.routePathStore.length - 1]["time"];
            }
            let sTime = this.selectedDate + " " + startTime;

            let eTime = this.selectedDate + " " + endTime;
            let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
            this.trackData.totalTime = this.commonService.getHrsFull(totalMinutes);
          }
          if (this.isStart == true) {
            this.lineDataList = [];
            for (let i = 0; i < this.polylines.length; i++) {
              let routeDateList = [];
              let latLong: string = this.routePathStore[i]["latlng"];
              routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
              for (let j = 0; j < routeDateList.length; j++) {
                let routePart = routeDateList[j].split(',');
                if (routePart.length == 2) {
                  this.lineDataList.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
                }
              }
            }
            if (this.lineIndex == 0) {
              this.createMarker();
            }
            this.animate(this.lineIndex);
          }
          this.savedDataList.push({ wardNo: this.selectedZone, date: this.selectedDate, routePath: routePath });
          localStorage.setItem('savedRouteData', JSON.stringify(this.savedDataList));
        }
      });
  }

  getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6377830; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in metres
  }

  deg2rad(deg: any) {
    return deg * (Math.PI / 180)
  }

  setMapOnAll() {
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
    }
    this.allMarkers = [];
    if (this.polylines != null) {
      for (let j = 0; j < this.polylines.length; j++) {
        this.polylines[j].setMap(null);
      }
    }
    this.polylines = [];
    this.trackData.totalKM = 0;
    this.trackData.totalTime = "0 hr 0 min";
  }

  getReset() {
    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').show();
    $('#btnReset').hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.isTiming = false;
    this.isPreviousTime = false;
    this.totalTiminingKM = 0;
    this.selectedDate = $('#txtDate').val();
    $('#ddlTime').val("0");
    this.selectedZoneNo = this.selectedZone;
    this.polylines = [];
    this.timeInterval = 0;
    this.setMaps();
    this.setWardBoundary();
    this.setMapOnAll();
    this.getFixedGeoLocation();
    this.getVehicleRouteTime();
  }

  getMonthDetail() {
    //localStorage.setItem("routeMonthDetail", null);
    this.monthDetail = [];
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let month = this.selectedDate.split("-")[1];
    let days = new Date(year, month, 0).getDate();
    if (this.toDayDate.split("-")[1] == this.selectedDate.split("-")[1]) {
      days = this.toDayDate.split("-")[2];
    }

    for (let i = 1; i <= days; i++) {
      let monthDate = year + '-' + month + '-' + (i < 10 ? '0' : '') + i;
      let monthShortName = this.commonService.getCurrentMonthShortName(Number(monthDate.split('-')[1]));
      let day = monthDate.split("-")[2] + " " + monthShortName;
      this.monthDetail.push({ wardNo: this.selectedZone, day: day, driver: '', km: '0', hour: '', percentage: '0', monthDate: monthDate });
      if (monthDate == this.toDayDate) {
        this.getMonthDetailData(i, year, month, monthName);
      }
      else {
        let monthDetailData = JSON.parse(localStorage.getItem("routeMonthDetail"));
        if (monthDetailData == null) {
          this.getMonthDetailData(i, year, month, monthName);
        }
        else {
          let monthDetails = monthDetailData.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
          if (monthDetails != undefined) {
            let monthDetail = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
            if (monthDetail != undefined) {
              monthDetail.km = monthDetails.km;
              monthDetail.hour = monthDetails.hour;
              if (monthDetails.driver != "") {
                monthDetail.driver = monthDetails.driver;
              }
              else {
                this.getDriverName(year, monthName, monthDate);
              }
              if (monthDetails.percentage != "0") {
                monthDetail.percentage = monthDetails.percentage;
              }
              else {
                this.getWorkPercentage(year, monthName, monthDate);
              }
            }
          }
          else {
            this.getMonthDetailData(i, year, month, monthName);
          }
        }
      }
    }
  }

  getMonthDetailData(days: any, year: any, month: any, monthName: any) {
    let monthDate = year + '-' + month + '-' + (days < 10 ? '0' : '') + days;
    let dbPath = "LocationHistory/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + monthDate;
    let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
      routePath => {
        if (routePath != null) {
          let monthDate = year + '-' + month + '-' + (days < 10 ? '0' : '') + days;
          let monthShortName = this.commonService.getCurrentMonthShortName(Number(monthDate.split('-')[1]));
          let day = monthDate.split("-")[2] + " " + monthShortName;
          let totalKM: number = 0;

          let routeKeyArray = Object.keys(routePath);
          let keyArray = [];
          if (routeKeyArray.length > 0) {
            if (this.isActualData == 0) {
              keyArray = routeKeyArray;
            }
            else {
              for (let i = 0; i < routeKeyArray.length; i++) {
                if (!routeKeyArray[i].toString().includes('-')) {
                  keyArray.push(routeKeyArray[i]);
                }
              }
            }
          }

          for (let i = 0; i < keyArray.length - 3; i++) {
            let index = keyArray[i];
            totalKM += parseFloat(routePath[index]["distance-in-meter"]);
          }

          let startTime = keyArray[0];
          let endTime = keyArray[0];
          if (keyArray.length > 1) {
            endTime = keyArray[keyArray.length - 3];
          }
          let sTime = monthDate + " " + startTime;
          let eTime = monthDate + " " + endTime;
          let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
          let monthDetails = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
          if (monthDetails != undefined) {
            monthDetails.km = parseFloat((totalKM / 1000).toFixed(1));
            monthDetails.hour = this.commonService.getHrsFull(totalMinutes);
            let driverdbPath = "WasteCollectionInfo/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/WorkerDetails/driverName";
            let driverTracking = this.db.object(driverdbPath).valueChanges().subscribe(
              driverData => {
                driverTracking.unsubscribe();
                if (driverData != null) {
                  monthDetails.driver = driverData;
                }
                let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + monthDate + "/Summary/workPercentage";
                let workPersentageInstance = this.db.object(dbPath).valueChanges().subscribe(
                  data => {
                    workPersentageInstance.unsubscribe();
                    if (data != null) {
                      monthDetails.percentage = data.toString();
                    }
                    let monthDetailData = JSON.parse(localStorage.getItem("routeMonthDetail"));
                    if (monthDetailData == null) {
                      monthDetailData = [];
                    }
                    monthDetailData.push({ wardNo: this.selectedZone, day: day, driver: monthDetails.driver, km: monthDetails.km, hour: monthDetails.hour, percentage: monthDetails.percentage, monthDate: monthDate });
                    if (monthDate != this.toDayDate) {
                      localStorage.setItem('routeMonthDetail', JSON.stringify(monthDetailData));
                    }
                  }
                );
              });
          }
        }
        vehicleTracking.unsubscribe();
      }
    );
  }


  getWorkPercentage(year: any, monthName: any, monthDate: any) {
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + monthDate + "/Summary/workPercentage";
    let workPersentageInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        workPersentageInstance.unsubscribe();
        if (data != null) {
          let monthDetails = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
          if (monthDetails != undefined) {
            monthDetails.percentage = data.toString();
          }
        }
      }
    );
  }

  getDriverName(year: any, monthName: any, monthDate: any) {
    let driverdbPath = "WasteCollectionInfo/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/WorkerDetails/driverName";
    let driverTracking = this.db.object(driverdbPath).valueChanges().subscribe(
      driverData => {
        driverTracking.unsubscribe();
        if (driverData != null) {
          let monthDetails = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
          if (monthDetails != undefined) {
            monthDetails.driver = driverData;
          }
        }
      });
  }

  getMonthSelectedDetail(day: any) {
    let date = $('#txtDate').val();
    date = date.toString().split('-')[0] + "-" + date.toString().split('-')[1] + "-" + day.split(' ')[0];
    $('#txtDate').val(date);
    if (this.timerHandle[this.lineIndex - 1]) {
      clearTimeout(this.timerHandle[this.lineIndex - 1]);
    }
    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').show();
    $('#btnReset').hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.isTiming = false;
    this.isPreviousTime = false;
    this.totalTiminingKM = 0;
    this.selectedDate = $('#txtDate').val();
    $('#ddlTime').val("0");
    this.startTime = 0;
    this.endTime = null;
    this.onSubmit();
  }

  setSpeed(speed: any) {
    if (speed == 1) {
      this.speed = 20;
      this.skip = 1;
    }
    else if (speed == 2) {
      this.speed = 15;
      this.skip = 1;
    }
    else if (speed == 3) {
      this.speed = 10;
      this.skip = 2;
    }
    else if (speed == 4) {
      this.speed = 20;
      this.skip = 5;
    }
    else if (speed == 5) {
      this.speed = 15;
      this.skip = 4;
    }
    else if (speed == 10) {
      this.speed = 15;
      this.skip = 10;
    }
  }

  getVehicleRouteTime() {
    if (this.routePathStore != null) {
      if (this.timeInterval == 0) {
        this.startTime = 0;
        this.endTime = this.routePathStore.length - 1;
      }
      if (this.endTime >= (this.routePathStore.length - 1)) {
        this.endTime = this.routePathStore.length - 1;
        this.isLast = true;
      }
      else {
        this.isLast = false;
      }
      let totalKM = 0;
      let lineData = [];
      for (let i = 0; i <= this.endTime; i++) {
        totalKM += parseFloat(this.routePathStore[i]["distanceinmeter"]);
      }

      for (let i = 0; i <= this.endTime; i++) {
        if (lineData.length > 0) {
          let lat = lineData[lineData.length - 1]["lat"];
          let lng = lineData[lineData.length - 1]["lng"];
          lineData = [];
          lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        let routeDateList = [];
        let latLong: string = this.routePathStore[i]["latlng"];
        routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
        for (let j = 0; j < routeDateList.length; j++) {
          let routePart = routeDateList[j].split(',');
          if (routePart.length == 2) {
            lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
          }
        }
        if (lineData != undefined) {

          let status = "LineCompleted";
          let line = new google.maps.Polyline({
            path: lineData,
            strokeColor: this.commonService.getLineColor(status),
            strokeWeight: 4
          });

          if (i == this.startTime) {
            let latLong: string = this.routePathStore[0]["latlng"];
            let routeDateListStart = latLong.substring(1, latLong.length - 1).split(')~(');

            let routePartStart = routeDateListStart[0].split(',');
            if (routePartStart.length == 2) {
              let markerURL = this.getIcon("start");
              var markerLabel = "";
              let lat = routePartStart[0];
              let lng = routePartStart[1];
              let contentString = '<br/>Start Time : ' + this.routePathStore[i]["time"];
              this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
            }
          }
          if (i == this.endTime) {
            if (this.isStart == false) {
              this.trackData.time = this.routePathStore[i]["time"];
            }
            let flowMarkerURL = this.getIcon("stopMarker");
            var flowMarkerLabel = "";
            let lat = lineData[lineData.length - 1]["lat"];
            let lng = lineData[lineData.length - 1]["lng"];
            let contentString = '<br/>Time : ' + this.routePathStore[i]["time"];
            this.setMarker(lat, lng, flowMarkerLabel, flowMarkerURL, contentString, "routeMarker");
          }
          this.polylines[i] = line;
          this.polylines[i].setMap(this.map);
          this.trackData.totalKM = parseFloat((totalKM / 1000).toFixed(2));
          this.trackData.totalTime = this.commonService.getHrsFull((this.endTime + 1));
          this.totalTiminingKM = totalKM;
        }
      }

      if (this.timeInterval == 0) {
        this.startTime = 0;
        this.endTime = null;
      }

      this.lineDataList = [];
      for (let i = 0; i < this.polylines.length; i++) {
        let routeDateList = [];
        let latLong: string = this.routePathStore[i]["latlng"];
        let time = this.routePathStore[i]["time"];
        routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
        for (let j = 0; j < routeDateList.length; j++) {
          let routePart = routeDateList[j].split(',');
          if (routePart.length == 2) {
            this.lineDataList.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]), time: time });
          }
        }
      }
      if (this.isStart == true) {
        if (this.lineIndex == 0) {
          if (this.routeMarker.length > 0) {
            if (this.isReset == true) {
              this.lineIndex = 0;
              if (this.routeMarker[0] == null) {
                this.createMarker();
              }
              else {
                this.routeMarker[0]["marker"].setMap(null);
                this.routeMarker = [];
                this.createMarker();
              }
            }
            else {
              this.routeMarker[0]["marker"] = this.lineDataList[0];
            }
          }
          else {
            this.createMarker();
          }
        }
        else if (this.isReset == true) {
          this.isReset = false;
          this.lineIndex = 0;
          if (this.routeMarker[0] == null) {
            this.createMarker();
          }
          else {
            this.routeMarker[0]["marker"].setMap(null);
            this.routeMarker = [];
            this.createMarker();
          }
        }
        this.animate(this.lineIndex);
      }

      let routeDateList = [];
      let latLong: string = this.routePathStore[this.routePathStore.length - 1]["latlng"];
      let endtimes: string = this.routePathStore[this.routePathStore.length - 1]["time"];

      if (this.selectedDate != this.toDayDate) {
        routeDateList = latLong.substring(1, latLong.length - 4).split(')~(');

        let routePart = routeDateList[routeDateList.length - 4].split(',');
        let endMarkerURL = this.getIcon("stop");
        var endMarkerLabel = "";
        let lat = parseFloat(routePart[0]);
        let lng = parseFloat(routePart[1]);
        let contentString = '<br/>End Time : ' + endtimes;
        this.setMarker(lat, lng, endMarkerLabel, endMarkerURL, contentString, "all");
      }
    }
  }

  getPlayStop() {
    if (this.isStart == false) {
      let options = {
        // max zoom
        zoom: 16,
      };
      this.map.setOptions(options);
      this.isStart = true;
      $('#playStop').removeClass("fab fa-youtube");
      $('#playStop').addClass("fas fa-stop-circle");

      $('#btnPre').hide();
      $('#btnReset').show();

      this.setSpeed(Number($('#ddlSpeed').val()));
      this.timeInterval = Number($('#ddlTime').val());
      if (this.timeInterval == 0) {
        this.endTime = this.routePathStore.length - 1;
      }
      else {
        this.endTime = this.endTime;
      }
      this.setMapOnAll();
      this.getVehicleRouteTime();
    }
    else {
      $('#playStop').removeClass("fas fa-stop-circle");
      $('#playStop').addClass("fab fa-youtube");
      $('#btnPre').show();
      $('#btnReset').hide();
      this.isStart = false;
    }
  }

  createMarker() {
    let lat = this.lineDataList[this.lineIndex]["lat"];
    let lng = this.lineDataList[this.lineIndex]["lng"]
    let markerURL = this.getIcon("carMarker");
    var markerLabel = "";
    let contentString = '';
    this.setMarker(lat, lng, markerLabel, markerURL, contentString, "route");
  }

  animate(index: any) {
    if (this.timerHandle[this.lineIndex - this.skip]) {
      clearTimeout(this.timerHandle[this.lineIndex - this.skip]);
    }
    if (this.routeMarker[0] == null) {
      this.createMarker();
    }
    this.routeMarker[0]["marker"].setPosition(this.lineDataList[this.lineIndex]);
    this.map.setCenter(this.lineDataList[this.lineIndex]);

    if (this.isStart == true) {
      if (this.lineIndex < this.lineDataList.length) {
        this.timerHandle[this.lineIndex] = setTimeout(() => {
          this.lineIndex = this.lineIndex + this.skip;
          this.animate(this.lineIndex);
          if (this.lineDataList.length > 0) {
            if (this.lineDataList[this.lineIndex] != null) {
              this.trackData.time = this.lineDataList[this.lineIndex]["time"];
            }
          }
        }, this.speed);
      }
      else {
        if (this.isLast == false) {
          this.getRouteDataPreNext("next");
          this.animate(this.lineIndex);
        }
        else {
          this.routeMarker[0]["marker"].setPosition(this.lineDataList[this.lineIndex - this.skip]);
          this.map.setCenter(this.lineDataList[this.lineIndex - this.skip]);
          this.isStart = false;
          $('#playStop').removeClass("fas fa-stop-circle");
          $('#playStop').addClass("fab fa-youtube");
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
      }
    }
  }
}

export class trackDetail {
  totalKM: number;
  totalTime: string;
  time: string;
  percentage: string;
}
