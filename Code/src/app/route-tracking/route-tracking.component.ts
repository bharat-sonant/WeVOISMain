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
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-route-tracking',
  templateUrl: './route-tracking.component.html',
  styleUrls: ['./route-tracking.component.scss']
})
export class RouteTrackingComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, public router: Router, private actRoute: ActivatedRoute, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }
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
  vtsRouteKM: any;
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
  vtsRouteList: any[] = [];
  vtsRouteMarker: any[] = [];
  vtsVehicleName: any;
  vtsVehicleList: any[] = [];
  routePolyline: any[] = [];
  lblVTS = "#lblVTS";
  chkVTS = "#chkVTS";
  userType: any;
  serviceName = "route-tracking";
  trackData: trackDetail =
    {
      totalKM: 0,
      totalTime: "0 hr 0 min",
      time: "0:00",
      percentage: "0"
    };

  ngOnInit() {
    this.userType = localStorage.getItem("userType");
    if (this.userType == "External User") {
      $(this.chkVTS).hide();
      $(this.lblVTS).hide();
      $("#divVTSRoute").hide();
      // this.router.navigate(["/" + localStorage.getItem("cityName") + "/something-wrong"]);
    }
    this.instancesList = [];
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.savePageLoadHistory("Monitoring", "Route-Tracking", localStorage.getItem("userID"));
    //this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.isActualData = localStorage.getItem("isActual");
    this.setSpeed(Number($('#ddlSpeed').val()));
    $('#btnPre').show();
    $('#btnReset').hide();
    this.getMinmumMaximumDistance();
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $('#txtDate').val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.preSelectedMonth = this.selectedDate.split('-')[1];
    this.preSelectedYear = this.selectedDate.split('-')[0];
    this.timeInterval = 0;
    this.selectedZone = "0";
    this.vtsRouteKM = "0.00";
    this.vtsVehicleList = [];

    this.getZoneList();

    this.setMaps();
    const id = this.actRoute.snapshot.paramMap.get('id1');
    if (id != null) {
      if (id.includes("~")) {
        let zoneUrl = id.toString().split("~")[0] + "(" + id.toString().split("~")[1] + ")";
        this.selectedZone = zoneUrl;
      }
      else {
        this.selectedZone = id.trim();
        this.onSubmit();
      }
    }
    else {
      setTimeout(() => {
        this.selectedZone = "0";
      }, 2000);
    }
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

  getColor(index: number) {
    // var randomColor = Math.floor(Math.random()*16777215).toString(16);
    // return "#"+randomColor;
    switch (index) {
      case 0:
        return "#7400FF";
      case 1:
        return "#6A2D42";
      case 2:
        return "#8AF123";
      case 3:
        return "#23F1EE";
      case 4:
        return "#6A0976";
      case 5:
        return "#EF0C46";
      case 6:
        return "#0651A4";
      case 7:
        return "#6E7B32";
      case 8:
        return "#F7C600";
      case 9:
        return "#6DD8F5";
      case 10:
        return "#F14723";
    }
  }

  getSILocation() {
    let siLocationInstance = this.db.object("Defaults/GeoLocations/FixedLocations/SILocations/" + this.selectedZone).valueChanges().subscribe(data => {
      siLocationInstance.unsubscribe();
      if (data != null) {
        let lat = data["lat"];
        let lng = data["lng"];
        let markerURL = "../../../assets/img/SI-Location.png";
        var markerLabel = "";
        let contentString = '<b>' + data["name"] + '</b>: ' + data["address"];
        this.setMarker(lat, lng, markerLabel, markerURL, contentString, "fixed");
      }
    })
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


  getVTSRoute() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getVTSRoute");
    if ((<HTMLInputElement>document.getElementById("chkVTS")).checked == false) {
      $("#divVTSRoute").hide();
      $(this.lblVTS).html("Show VTS Routes");
      if (this.routePolyline.length > 0) {
        for (let i = 0; i < this.routePolyline.length; i++) {
          this.routePolyline[i].setMap(null);
        }
      }
    }
    else {
      $(this.lblVTS).html("Hide VTS Routes");
      $("#divVTSRoute").show();
      let latLngCity = this.commonService.getDefaultCityLatLng();
      console.log(latLngCity)
      let latCity = latLngCity[0]["lat"];
      let lngCity = latLngCity[0]["lng"];
      if (this.vtsVehicleList.length == 0) {
        this.vtsVehicleName = "";
        let selectedYear = this.selectedDate.split("-")[0];
        let selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
        let path = "WasteCollectionInfo/" + this.selectedZone + "/" + selectedYear + "/" + selectedMonthName + "/" + this.selectedDate + "/WorkerDetails/vehicle";
        let vehicleInstance = this.db.object(path).valueChanges().subscribe(vehicleData => {
          vehicleInstance.unsubscribe();
          if (vehicleData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getVTSRoute", vehicleData);
            let vehicles = vehicleData.split(",");
            for (let i = 0; i < vehicles.length; i++) {
              let color = "blue";
              if (i == 1) {
                color = this.getColor(1);
              }
              else if (i == 2) {
                color = this.getColor(2);
              }
              else if (i == 3) {
                color = this.getColor(3);
              }
              let detail = this.vtsVehicleList.find(item => item.vehicle == vehicles[i].toString().trim());
              if (detail == undefined) {
                this.vtsVehicleList.push({ vehicle: vehicles[i].toString().trim(), color: color, km: '0.00', routeList: [], chasisNumber: "" });
                if (localStorage.getItem("cityName") == "hisar") {
                  let chasisInstance = this.db.object("VehicleChesisNumber/" + vehicles[i].toString().trim()).valueChanges().subscribe(chasisData => {
                    chasisInstance.unsubscribe();
                    if (chasisData != null) {
                      let chasisNumber = chasisData.toString();
                      let vDetail = this.vtsVehicleList.find(item => item.vehicle == vehicles[i].toString().trim());
                      if (vDetail != undefined) {
                            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getVTSRoute", vDetail);
                        vDetail.chasisNumber = chasisNumber;
                        path = "https://wevois-vts-default-rtdb.firebaseio.com/VehicleRoute/" + chasisNumber + "/" + this.selectedDate + ".json";
                        this.httpService.get(path).subscribe(data => {

                          if (data != null) {
                            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getVTSRoute", data);
                            let keyArray = Object.keys(data);
                            let list = [];
                            for (let j = 0; j < keyArray.length - 2; j++) {
                              let time = keyArray[j];
                              let lat1 = Number(data[keyArray[j]].toString().split(",")[0]);
                              let lng1 = Number(data[keyArray[j]].toString().split(",")[1]);
                              let distance = this.getDistanceFromLatLonInKm(lat1, lng1, latCity, lngCity);
                              if (distance < 150000) {
                                list.push({ time: time, latLng: data[keyArray[j]] });
                              }
                            }
                            for (let j = 0; j < list.length; j++) {
                              let time = list[j]["time"];
                              let latLng = list[j]["latLng"];
                              this.vtsVehicleList[i].routeList.push({ time: time, latLng });
                            }
                            (<HTMLInputElement>document.getElementById("chk" + i)).checked = true;
                            this.drowVTSRoute(i);
                            this.getVTSRouteDistance(i);
                          }
                          else {
                            (<HTMLInputElement>document.getElementById("chk" + i)).checked = false;
                            this.commonService.setAlertMessage("error", "No VTS Route found for vehicle " + vehicles[i].toString().trim());
                          };
                        });
                      }

                    }
                  })

                }
                else {
                  path = "https://wevois-vts-default-rtdb.firebaseio.com/VehicleRoute/" + vehicles[i] + "/" + this.selectedDate + ".json";
                  this.httpService.get(path).subscribe(data => {

                    if (data != null) {
                      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getVTSRoute", data);
                      let keyArray = Object.keys(data);
                      let list = [];
                      for (let j = 0; j < keyArray.length - 2; j++) {
                        let time = keyArray[j];
                        let lat1 = Number(data[keyArray[j]].toString().split(",")[0]);
                        let lng1 = Number(data[keyArray[j]].toString().split(",")[1]);
                        let distance = this.getDistanceFromLatLonInKm(lat1, lng1, latCity, lngCity);
                        if (distance < 150000) {
                          list.push({ time: time, latLng: data[keyArray[j]] });
                        }
                      }
                      for (let j = 0; j < list.length; j++) {
                        let time = list[j]["time"];
                        let latLng = list[j]["latLng"];
                        this.vtsVehicleList[i].routeList.push({ time: time, latLng });
                      }
                      (<HTMLInputElement>document.getElementById("chk" + i)).checked = true;
                      this.drowVTSRoute(i);
                      this.getVTSRouteDistance(i);
                    }
                    else {
                      (<HTMLInputElement>document.getElementById("chk" + i)).checked = false;
                      this.commonService.setAlertMessage("error", "No VTS Route found for vehicle " + vehicles[i].toString().trim());
                    };
                  });
                }
              }
            }
          }
        });
      }
      else {
        for (let i = 0; i < this.vtsVehicleList.length; i++) {
          if (this.vtsVehicleList[i].routeList.length > 0) {
            (<HTMLInputElement>document.getElementById("chk" + i)).checked = true;
            this.drowVTSRoute(i);
          }
          else {
            (<HTMLInputElement>document.getElementById("chk" + i)).checked = false;
            this.commonService.setAlertMessage("error", "No VTS Route found for vehicle " + this.vtsVehicleList[i].vehicle);
          }
        }
      }
    }
  }

  drowVTSRoute(index: any) {
    if ((<HTMLInputElement>document.getElementById("chk" + index)).checked == false) {
      this.routePolyline[index].setMap(null);
    }
    else {
      if (this.vtsVehicleList[index].routeList.length > 0) {
        let lineData = [];
        for (let i = 0; i < this.vtsVehicleList[index].routeList.length; i++) {
          let lat = this.vtsVehicleList[index].routeList[i]["latLng"].split(",")[0];
          let lng = this.vtsVehicleList[index].routeList[i]["latLng"].split(",")[1];
          lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        let line = new google.maps.Polyline({
          path: lineData,
          strokeColor: this.vtsVehicleList[index].color,
          strokeWeight: 2
        });
        this.routePolyline[index] = line;
        this.routePolyline[index].setMap(this.map);
      }
    }
  }

  getVTSRouteDistance(index: any) {
    let vtsKM = 0;
    for (let i = 0; i < this.vtsVehicleList[index].routeList.length - 1; i++) {
      let lat = this.vtsVehicleList[index].routeList[i]["latLng"].split(",")[0];
      let lng = this.vtsVehicleList[index].routeList[i]["latLng"].split(",")[1];
      let latNext = this.vtsVehicleList[index].routeList[i + 1]["latLng"].split(",")[0];
      let lngNext = this.vtsVehicleList[index].routeList[i + 1]["latLng"].split(",")[1];
      vtsKM += Math.round(Number(this.commonService.getDistanceFromLatLonInKm(lat, lng, latNext, lngNext)));
    }
    if (vtsKM > 0) {
      this.vtsVehicleList[index].km = (vtsKM / 1000).toFixed(2);
    }
  }

  getMinmumMaximumDistance() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMinmumMaximumDistance");
    let dbDistancePath = "Settings/RoueTrackings";
    let distanceDetail = this.db.object(dbDistancePath).valueChanges().subscribe(
      distanceData => {
        distanceDetail.unsubscribe();
        if (distanceData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMinmumMaximumDistance", distanceData);
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
      this.vtsRouteList = [];
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
    this.vtsRouteList = [];
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
    this.commonService.getWardBoundary(this.selectedZoneNo, this.zoneKML, 2).then((data: any) => {
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
    if (this.userType != "External User") {
      (<HTMLInputElement>document.getElementById("chkVTS")).checked = true;
      $("#divVTSCheck").show();
      $(this.lblVTS).html("Hide VTS Routes");
      $("#divVTSRoute").show();
    }
    else {
      $("#divVTSCheck").hide();
    }

    this.vtsRouteKM = "0.00";
    this.vtsRouteList = [];
    this.vtsVehicleList = [];
    if (this.routePolyline.length > 0) {
      for (let i = 0; i < this.routePolyline.length; i++) {
        this.routePolyline[i].setMap(null);
      }
    }
    this.selectedDate = $('#txtDate').val();
    let selectedMonth = this.selectedDate.split('-')[1];
    let selectedYear = this.selectedDate.split('-')[0];
    this.selectedZoneNo = this.selectedZone;
    this.routePolyline = [];
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
    this.getSILocation();
    this.getVTSRoute();
  }


  showVehicleMovement() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "showVehicleMovement");
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/vehicle";
    let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
      routePath => {
        if (routePath != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "showVehicleMovement", routePath);
          this.vehicleName = routePath;
          if (this.vehicleName.includes(",")) {
            this.vehicleName = this.vehicleName.split(",")[this.vehicleName.split(",").length - 1];
          }
          if (this.vehicleLocationInstance != undefined) {
            this.vehicleLocationInstance.unsubscribe();
          }
          let dbPath = "CurrentLocationInfo/" + this.selectedZone + "/latLng";
          this.vehicleLocationInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              this.instancesList.push({ instances: this.vehicleLocationInstance });
              if (data != undefined) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "showVehicleMovement", data);
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
    this.getVehicleRoute();
  }

  getVehicleRoute() {
    this.setMapOnAll();
    $('#ddlTime').val(0);

    this.isPreviousTime = false;
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getVehicleRoute");
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    this.getDutyInOutTime(this.selectedZone, year, monthName, this.selectedDate).then((response) => {
      let dutyOnOffList = JSON.parse(JSON.stringify(response));
      if (dutyOnOffList.length > 0) {
        let dbPath = "LocationHistory/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
        this.routePathStore = [];
        let routePathList = [];
        let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
          routePath => {
            vehicleTracking.unsubscribe();
            if (routePath != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getVehicleRoute", routePath);
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

              let dutyInTime = dutyOnOffList[0]["inTime"];
              let dutyOutTime = dutyOnOffList[dutyOnOffList.length - 1]["outTime"];
              let dutyInDateTime = new Date(this.selectedDate + " " + dutyInTime);
              let dutyOutDateTime = new Date(this.selectedDate + " " + dutyOutTime);

              if (this.userType == "External User") {
                let newArray = keyArray.reverse();
                let keyArrayNew = [];
                for (let i = 0; i < newArray.length; i++) {
                  let index = newArray[i];
                  if (newArray[i + 1] != undefined) {
                    let nextIndex = newArray[i + 1];
                    let time = index.toString().split('-')[0];
                    let nextTime = nextIndex.toString().split('-')[0];
                    if (time == nextTime) {
                      keyArrayNew.push(index);
                      i++;
                    }
                    else {
                      keyArrayNew.push(index);
                    }
                  }
                  else {
                    keyArrayNew.push(index);
                  }
                }
                keyArray = keyArrayNew.reverse();
                for (let i = 0; i < keyArray.length; i++) {
                  let index = keyArray[i];
                  let time = index.toString().split('-')[0];
                  if (Number(routePath[index]["distance-in-meter"]) > 0) {
                    if (routePath[index]["distance-in-meter"] != null || routePath[index]["distance-in-meter"] != undefined) {
                      let routeDateTime = new Date(this.selectedDate + " " + time);
                      if (routeDateTime >= dutyInDateTime && routeDateTime <= dutyOutDateTime) {
                        routePathList.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });
                      }
                    }
                  }
                }
              }
              else {
                for (let i = 0; i < keyArray.length; i++) {
                  let index = keyArray[i];
                  let time = index.toString().split('-')[0];
                  if (Number(routePath[index]["distance-in-meter"]) > 0) {
                    if (routePath[index]["distance-in-meter"] != null || routePath[index]["distance-in-meter"] != undefined) {
                      let routeDateTime = new Date(this.selectedDate + " " + time);
                      if (!index.includes("-")) {
                        if (routeDateTime >= dutyInDateTime && routeDateTime <= dutyOutDateTime) {
                          routePathList.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });
                        }
                      }
                    }
                  }
                }
              }
              // console.log(routePathList);
              let latLngList = [];
              this.routePathStore = routePathList;
              // this.getLatLngList(routePathList);


              this.showDataOnMap();



            }
          });

      }
    });
  }

  getLatLngList(routePathList: any) {
    let routeAllLatLngList = [];
    for (let i = 0; i < routePathList.length; i++) {
      let latLngList = routePathList[i]["latlng"].split('~');
      for (let j = 0; j < latLngList.length; j++) {
        let lat = latLngList[j].toString().replace("(", "").replace(")", "").split(",")[0];
        let lng = latLngList[j].toString().replace("(", "").replace(")", "").split(",")[1];
        routeAllLatLngList.push({ distanceinmeter: routePathList[i]["distanceinmeter"], time: routePathList[i]["time"], lat: lat, lng: lng });
      }
    }
    console.log(routeAllLatLngList);
    this.checkLatLngDistance(routeAllLatLngList, 0, []);
  }

  checkLatLngDistance(routeAllLatLngList: any, i: any, routeLatLngList: any) {
    if (i == routeAllLatLngList.length - 1) {
      console.log(routeAllLatLngList);

      let timeList = routeAllLatLngList.map(item => item.time)
        .filter((value, index, self) => self.indexOf(value) === index);
      let finalRouteList = [];
      for (let j = 0; j < timeList.length; j++) {
        let filterList = routeAllLatLngList.filter(item => item.time == timeList[j]);
        if (filterList.length > 0) {
          let distanceinmeter = filterList[0]["distanceinmeter"];
          let time = filterList[0]["time"];
          let latLng = "";
          for (let k = 0; k < filterList.length; k++) {
            if (k == 0) {
              latLng = "(" + filterList[k]["lat"] + "," + filterList[k]["lng"] + ")";
            }
            else {
              let latLng1 = "(" + filterList[k]["lat"] + "," + filterList[k]["lng"] + ")";
              latLng = latLng + "~" + latLng1;
            }
          }
          finalRouteList.push({ distanceinmeter: distanceinmeter, time: time, latlng: latLng });
        }
      }

      // console.log(finalRouteList);
      this.routePathStore = finalRouteList;
      this.showDataOnMap();
    }
    else {
      let lat1 = routeAllLatLngList[i]["lat"];
      let lng1 = routeAllLatLngList[i]["lng"];
      let lat2 = routeAllLatLngList[i + 1]["lat"];
      let lng2 = routeAllLatLngList[i + 1]["lng"];
      let checkDistance = Number(this.getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2));
      if (checkDistance < 5) {
        routeLatLngList.push({ distanceinmeter: routeAllLatLngList[i]["distanceinmeter"], time: routeAllLatLngList[i]["time"], lat: routeAllLatLngList[i]["lat"], lng: routeAllLatLngList[i]["lng"] });
        i++;
      }
      else {
        routeAllLatLngList.splice(i, 1);
        console.log(i);
      }
      this.checkLatLngDistance(routeAllLatLngList, i, routeLatLngList);
    }
  }


  showDataOnMap() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "showDataOnMap");
    let totalKM = 0;
    let lineData = [];
    for (let i = 0; i < this.routePathStore.length; i++) {
      let totalDistance = 0;
      let myTotalKM: number = 0;
      totalKM += parseFloat(parseFloat(this.routePathStore[i]["distanceinmeter"]).toFixed(8));
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
          if (lineData.length > 0) {
            let lat = lineData[lineData.length - 1]["lat"];
            let lng = lineData[lineData.length - 1]["lng"];
            let distance = this.getDistanceFromLatLonInKm(lat, lng, parseFloat(routePart[0]), parseFloat(routePart[1]));
            // if (distance < 100) {
            let distanceInMeter = distance * 1000;
            totalDistance += distanceInMeter;
            lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]), distance: distance });
            // }
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
          let contentString = '<br/>Start time: ' + this.routePathStore[i]["time"];
          this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
        }

        if (this.selectedDate != this.toDayDate) {
          if (i == this.routePathStore.length - 1) {
            let lat = lineData[lineData.length - 1]["lat"];
            let lng = lineData[lineData.length - 1]["lng"];
            let markerURL = this.getIcon("stop");
            var markerLabel = "";
            let contentString = '<br/>End time: ' + this.routePathStore[i]["time"];
            this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
          }
        }
        else {
          if (i == this.routePathStore.length - 1) {
            let dbPath = "RealTimeDetails/WardDetails/" + this.selectedZoneNo;
            let vehicleDutyData = this.db.object(dbPath).valueChanges().subscribe(
              dutyData => {
                vehicleDutyData.unsubscribe();
                if (dutyData != null) {
                  this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "showDataOnMap", dutyData);
                  if (dutyData["isOnDuty"] != "yes") {
                    let lat = lineData[lineData.length - 1]["lat"];
                    let lng = lineData[lineData.length - 1]["lng"];
                    let markerURL = this.getIcon("stop");
                    var markerLabel = "";
                    let contentString = '<br/>End time: ' + this.routePathStore[i]["time"];
                    this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
                  }
                }
              });
          }
        }
        this.polylines[i] = line;
        this.polylines[i].setMap(this.map);
        this.trackData.totalKM = parseFloat((totalKM / 1000).toFixed(2));
        this.trackData.time = this.routePathStore[i]["time"];
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


  getDutyInOutTime(zone: any, year: any, monthName: any, date: any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDutyInOutTime");
      let dutyInOutList = [];
      let dbPath = "WasteCollectionInfo/" + zone + "/" + year + "/" + monthName + "/" + date + "/Summary";
      let dutyInOutInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        dutyInOutInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDutyInOutTime", data);
          if (data["dutyInTime"] != null) {
            let dutyInList = data["dutyInTime"].split(",");
            for (let i = 0; i < dutyInList.length; i++) {
              dutyInOutList.push({ inTime: dutyInList[i].toString().trim(), outTime: "" });
            }
            if (data["dutyOutTime"] != null) {
              let dutyOutList = data["dutyOutTime"].split(",");
              for (let i = 0; i < dutyInList.length; i++) {
                dutyInOutList[i]["outTime"] = dutyOutList[i].toString().trim();
              }
            }
            for (let i = 0; i < dutyInOutList.length; i++) {
              if (dutyInOutList[i]["outTime"] == "") {
                if (date == this.toDayDate) {
                  dutyInOutList[i]["outTime"] = this.commonService.getCurrentTime();
                }
                else {
                  dutyInOutList[i]["outTime"] = "23:59:00";
                }
              }
            }
          }
        }
        resolve(dutyInOutList);
      });
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
        const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FRouteTrackingData%2F" + this.selectedZone + "%2F" + year + "%2F" + monthName + "%2F" + monthDate + ".json?alt=media";
        let routeInstance = this.httpService.get(path).subscribe(routeData => {
          routeInstance.unsubscribe();
          if (routeData != null) {
            let monthDetails = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
            if (monthDetails != undefined) {
              monthDetails.km = routeData["km"];
              monthDetails.driver = routeData["driver"];
              monthDetails.hour = routeData["hour"];
              monthDetails.percentage = routeData["percentage"];
            }
          }
        }, error => {
          routeInstance.unsubscribe();
          this.getMonthDetailData(i, year, month, monthName);
        });
      }
    }
  }

  getMonthDetailData(days: any, year: any, month: any, monthName: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMonthDetailData");
    let monthDate = year + '-' + month + '-' + (days < 10 ? '0' : '') + days;
    this.getDutyInOutTime(this.selectedZone, year, monthName, monthDate).then((response) => {
      let dutyOnOffList = JSON.parse(JSON.stringify(response));
      if (dutyOnOffList.length > 0) {
        let monthList = [];
        let dbPath = "LocationHistory/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + monthDate;
        this.commonService.getStorageLocationHistory(dbPath).then(response => {
          let monthDate = year + '-' + month + '-' + (days < 10 ? '0' : '') + days;
          let monthShortName = this.commonService.getCurrentMonthShortName(Number(monthDate.split('-')[1]));
          let day = monthDate.split("-")[2] + " " + monthShortName;
          if (response["status"] == "Fail") {
            let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
              routePath => {
                vehicleTracking.unsubscribe();
                if (routePath != null) {
                  this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMonthDetailData", routePath);
                  if (monthDate != this.toDayDate) {
                    //this.commonService.saveJsonFile(routePath, "route.json", "/" + dbPath + "/");
                  }
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

                  let dutyInTime = dutyOnOffList[0]["inTime"];
                  let dutyOutTime = dutyOnOffList[dutyOnOffList.length - 1]["outTime"];
                  let dutyInDateTime = new Date(this.selectedDate + " " + dutyInTime);
                  let dutyOutDateTime = new Date(this.selectedDate + " " + dutyOutTime);

                  if (this.userType == "External User") {
                    let newArray = keyArray.reverse();
                    let keyArrayNew = [];
                    for (let i = 0; i < newArray.length; i++) {
                      let index = newArray[i];
                      if (newArray[i + 1] != undefined) {
                        let nextIndex = newArray[i + 1];
                        let time = index.toString().split('-')[0];
                        let nextTime = nextIndex.toString().split('-')[0];
                        if (time == nextTime) {
                          keyArrayNew.push(index);
                          i++;
                        }
                        else {
                          keyArrayNew.push(index);
                        }
                      }
                      else {
                        keyArrayNew.push(index);
                      }
                    }
                    keyArray = keyArrayNew.reverse();
                    for (let i = 0; i < keyArray.length; i++) {
                      let index = keyArray[i];
                      let time = index.toString().split('-')[0];
                      if (routePath[index]["distance-in-meter"] != null || routePath[index]["distance-in-meter"] != undefined) {
                        let routeDateTime = new Date(this.selectedDate + " " + time);
                        if (routeDateTime >= dutyInDateTime && routeDateTime <= dutyOutDateTime) {
                          monthList.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });
                        }
                      }
                    }
                  }
                  else {
                    for (let i = 0; i < keyArray.length; i++) {
                      let index = keyArray[i];
                      let time = index.toString().split('-')[0];
                      if (routePath[index]["distance-in-meter"] != null || routePath[index]["distance-in-meter"] != undefined) {
                        let routeDateTime = new Date(this.selectedDate + " " + time);
                        if (!index.includes("-")) {
                          if (routeDateTime >= dutyInDateTime && routeDateTime <= dutyOutDateTime) {
                            monthList.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });
                          }
                        }
                      }
                    }
                  }
                  this.getMonthDetailList(monthList, year, monthName, monthDate);
                }
              }
            );
          }
          else {
            /*
            let routePath = response["data"];
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

            let dutyInTime = dutyOnOffList[0]["inTime"];
            let dutyOutTime = dutyOnOffList[dutyOnOffList.length - 1]["outTime"];
            let dutyInDateTime = new Date(this.selectedDate + " " + dutyInTime);
            let dutyOutDateTime = new Date(this.selectedDate + " " + dutyOutTime);

            for (let i = 0; i < keyArray.length - 3; i++) {
              let index = keyArray[i];
              let time = index.toString().split('-')[0];
              if (this.userType == "External User") {
                monthList.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });
              }
              else {
                let routeDateTime = new Date(this.selectedDate + " " + time);
                if (routeDateTime >= dutyInDateTime && routeDateTime <= dutyOutDateTime) {
                  monthList.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });
                }
              }
            }
            this.getMonthDetailList(monthList, year, monthName, monthDate);
*/
          }
        })
      }
    });
  }

  getMonthDetailList(monthList: any, year: any, monthName, monthDate: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMonthDetailList");
    let totalKM: number = 0;
    let monthDetails = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
    if (monthDetails != undefined) {
      let driverdbPath = "WasteCollectionInfo/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/WorkerDetails/driverName";
      let driverTracking = this.db.object(driverdbPath).valueChanges().subscribe(
        driverData => {
          driverTracking.unsubscribe();
          if (driverData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMonthDetailList", driverData);
            monthDetails.driver = driverData;
          }
          let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + monthDate + "/Summary";
          let workPersentageInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              workPersentageInstance.unsubscribe();
              if (data != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMonthDetailList", data);
                if (data["workPercentage"] != null) {
                  monthDetails.percentage = data["workPercentage"].toString();
                }
                if (this.userType == "External User") {
                  if (data["updatedWorkPercentage"] != null) {
                    monthDetails.percentage = Math.round(Number(data["updatedWorkPercentage"].toString())).toString();
                  }
                }
              }
              for (let i = 0; i < monthList.length; i++) {
                if (monthList[i]["distanceinmeter"] != null) {
                  totalKM += parseFloat(monthList[i]["distanceinmeter"]);
                }
                let startTime = monthList[0]["time"];
                let endTime = monthList[0]["time"];
                if (monthList.length > 1) {
                  endTime = monthList[monthList.length - 1]["time"];
                }
                let sTime = monthDate + " " + startTime;
                let eTime = monthDate + " " + endTime;
                let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
                let monthDetails = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
                if (monthDetails != undefined) {
                  monthDetails.km = parseFloat((totalKM / 1000).toFixed(1));
                  if (!isNaN(totalMinutes)) {
                    monthDetails.hour = this.commonService.getHrsFull(totalMinutes);
                  }
                  else {
                    monthDetails.hour = "0 hr 0 min";
                  }
                }
              }
              if (monthDate != this.toDayDate) {
                let obj = {
                  km: monthDetails.km,
                  hour: monthDetails.hour,
                  driver: monthDetails.driver,
                  percentage: monthDetails.percentage

                }
                let filePath = "/RouteTrackingData/" + this.selectedZone + "/" + year + "/" + monthName + "/";
                // this.commonService.saveJsonFile(obj, monthDate + ".json", filePath);
              }
            }
          );
        });
    }
  }


  getWorkPercentage(year: any, monthName: any, monthDate: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWorkPercentage");
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + monthDate + "/Summary/workPercentage";
    let workPersentageInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        workPersentageInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWorkPercentage", data);
          let monthDetails = this.monthDetail.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
          if (monthDetails != undefined) {
            monthDetails.percentage = data.toString();
          }
        }
      }
    );
  }

  getDriverName(year: any, monthName: any, monthDate: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDriverName");
    let driverdbPath = "WasteCollectionInfo/" + this.selectedZoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/WorkerDetails/driverName";
    let driverTracking = this.db.object(driverdbPath).valueChanges().subscribe(
      driverData => {
        driverTracking.unsubscribe();
        if (driverData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDriverName", driverData);
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
