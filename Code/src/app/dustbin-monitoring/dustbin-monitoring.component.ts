/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
//services
import { CommonService } from '../services/common/common.service';
import { MapService } from '../services/map/map.service';
import * as $ from "jquery";
import { Router } from '@angular/router';
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-dustbin-monitoring',
  templateUrl: './dustbin-monitoring.component.html',
  styleUrls: ['./dustbin-monitoring.component.scss']
})
export class DustbinMonitoringComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(private router: Router, public fs: FirebaseService, public toastr: ToastrService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService) { }

  public selectedZone: any;
  selectedDate: any;
  zoneList: any[];
  pickkingPlanList: any[];
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  activePlan: any;
  vehicleLocationFirstTime: any;
  polylines: any[] = [];
  todayDate: any;
  previousScannedCard: any[];
  todayScannedCard: any[];
  allCards: any[];
  wardIndex: number;
  currentMonthName: any;
  currentYear: any;
  public bounds: any;
  assignedBinList: any[];
  allDustbin: any[];
  minHalt: number;
  fixdGeoLocations: any[];
  isHalt: boolean;
  isRoute: boolean;
  isAll: boolean;
  dustbinAllData: any[];
  allMarkers: any[] = [];
  allPolylines: any[] = [];
  vehicleMarkers: any[] = [];
  vehicleMarkers1: any[] = [];
  planDetail: any[] = [];
  haltMarker: any[] = [];
  routeMarker: any[] = [];
  assignedMarker: any[] = [];
  filterArray: any[] = [];
  mainDbPath: any;
  dustbinShow: any[] = [];
  startUrl: any;
  endUrl: any;
  haltUrl: any;
  vehicleUrl: any;
  pickedDustbinUrl: any;
  assignedDustbinUrl: any;
  defaultDustbinUrl: any;
  cityName: any;
  db: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.selectedDate = this.todayDate;
    this.minHalt = 5;
    this.isHalt = false;
    this.isRoute = false;
    this.setMaps();
    (<HTMLInputElement>document.getElementById("halt")).checked = false;
    (<HTMLInputElement>document.getElementById("route")).checked = false;
    $('#txtDate').val(this.selectedDate);
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.activeZone = 0;
    this.assignedBinList = [];
    this.getDefaultImageUrl();
    this.getDustbins();
    setTimeout(() => {
      this.setMarkerNew();
    }, 5000);
  }

  getDefaultImageUrl() {
    this.startUrl = "../../../assets/img/start.svg";
    this.endUrl = "../../../assets/img/stop.svg";
    this.haltUrl = "../../assets/img/red.svg";
    this.vehicleUrl = "../assets/img/portal-vehicle.svg";
    this.pickedDustbinUrl = "../assets/img/green-rectange-dustbin.svg";
    this.assignedDustbinUrl = "../../assets/img/blue-rectange-dustbin.svg";
    this.defaultDustbinUrl = "../assets/img/dark gray without tick rectangle.png";
  }

  setHeight() {
    $('.navbar-toggler').show();
    $('#divMap').css("height", $(window).height() - 80);
  }

  setMaps() {
    var mapstyle = new google.maps.StyledMapType(
      [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: "off" }]
        },
      ]
    );
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.mapTypes.set('styled_map', mapstyle);
    this.map.setMapTypeId('styled_map');
  }

  setDate(filterVal: any, type: string) {
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
    this.dustbinShow = [];
    if (this.vehicleMarkers.length > 0) {
      for (let i = 0; i < this.vehicleMarkers.length; i++) {
        this.vehicleMarkers[i]["marker"].setMap(null);
      }
      this.vehicleMarkers = [];
    }
    if (this.vehicleMarkers1.length > 0) {
      for (let i = 0; i < this.vehicleMarkers1.length; i++) {
        this.vehicleMarkers1[i]["marker"].setMap(null);
      }
      this.vehicleMarkers1 = [];
    }
    this.currentYear = this.selectedDate.split('-')[0];
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.findDustbins();
  }

  changeZoneSelection(filterVal: any) {
    this.activeZone = filterVal;
    this.getFilterData();
  }

  changeDustbinPickPlanSelection(filterVal: any) {
    this.activePlan = filterVal;
    setTimeout(() => {
      this.getFilterData();
    }, 1000);
  }

  getDustbins() {
    this.allDustbin = [];
    let dustbinStorageList = [];
    dustbinStorageList = JSON.parse(localStorage.getItem("dustbin"));
    if (dustbinStorageList != null) {
      for (let i = 0; i < dustbinStorageList.length; i++) {
        this.allDustbin.push({ dustbin: dustbinStorageList[i]["dustbin"], address: dustbinStorageList[i]["address"], isAssigned: dustbinStorageList[i]["isAssigned"], lat: dustbinStorageList[i]["lat"], lng: dustbinStorageList[i]["lng"], pickFrequency: dustbinStorageList[i]["pickFrequency"], spelledRight: dustbinStorageList[i]["spelledRight"], type: dustbinStorageList[i]["type"], ward: dustbinStorageList[i]["ward"], zone: dustbinStorageList[i]["zone"], planId: "", img: "", planName: "", vehicle: "", driver: "", sequence: 0, assigned: 0 });
      }
      this.getData();
    }
  }

  getData() {

    this.planDetail = [];
    this.pickkingPlanList = [];
    this.pickkingPlanList.push({ planId: 0, planName: "Select Dustbin Pick Plan" });
    this.setMapOnAll();
    $('#ddlZone').val("0");
    $('#ddlPickPlans').val("0");
    (<HTMLInputElement>document.getElementById("halt")).checked = false;
    (<HTMLInputElement>document.getElementById("route")).checked = false;
    (<HTMLInputElement>document.getElementById("dustbin")).checked = false;
    this.isHalt = false;
    this.isRoute = false;
    let dbPath = "";
    this.bounds = new google.maps.LatLngBounds();
    if (this.allDustbin != null) {
      let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
      let year = this.selectedDate.split("-")[0];
      dbPath = "DustbinData/DustbinAssignment/" + year + "/" + monthName + "/" + this.selectedDate + "";
      let assignedPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          assignedPlanInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let index = keyArray[i];
                let planName = data[index]["planName"];
                let driver = data[index]["driver"];
                let vehicle = data[index]["vehicle"]
                this.pickkingPlanList.push({ planId: index, planName: planName + " [" + vehicle + "]" });
                let classes = "collapse";
                if (i == 0) {
                  classes = "collapse show";
                }
                this.planDetail.push({ id: index, planName: planName, vehicle: vehicle, driver: driver, totDistance: 0, totTime: 0, driverName: "", mobileNo: "", totHalt: 0, assigned: 0, picked: 0, classes: classes, startTime: "00:00", endTime: "00:00" });
                this.getHalt(vehicle);
                this.getRoute(vehicle);
                this.getDriverDetail(driver);
                this.getStartTime(driver, index);
                this.getDistanceCovered(vehicle, index, year, monthName);
                this.dustbinShow = [];
                if (this.selectedDate == this.todayDate) {
                  let vehicleLocation = this.db.object('CurrentLocationInfo/BinLifting/' + vehicle + '/CurrentLoc').valueChanges().subscribe(
                    vehicleLocationData => {
                      if (vehicleLocationData != null) {
                        if (this.selectedDate == this.todayDate) {
                          let lat = vehicleLocationData["lat"];
                          let lng = vehicleLocationData["lng"];
                          let contentString = 'Vehicle: ' + vehicle;
                          this.setMarker(lat, lng, null, this.vehicleUrl, 60, 60, contentString, "vehicle", 0, 15, 25);
                        }
                      }
                      vehicleLocation.unsubscribe();
                    });
                }

                dbPath = "DustbinData/DustbinPickingPlans/" + index + "";
                let planInstance = this.db.object(dbPath).valueChanges().subscribe(
                  planData => {
                    planInstance.unsubscribe();
                    if (planData != null) {
                      this.getPickedDustbin(planData, i, index, planName, year, monthName, vehicle, driver);
                    }
                    else {
                      dbPath = "DustbinData/DustbinPickingPlans/" + this.todayDate + "/" + index + "";
                      let planInstance = this.db.object(dbPath).valueChanges().subscribe(
                        planData => {
                          planInstance.unsubscribe();
                          if (planData != null) {
                            this.getPickedDustbin(planData, i, index, planName, year, monthName, vehicle, driver);
                          }
                          else {
                            dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + this.selectedDate + "/" + index + "";
                            let planInstance = this.db.object(dbPath).valueChanges().subscribe(
                              planData => {
                                planInstance.unsubscribe();
                                if (planData != null) {
                                  this.getPickedDustbin(planData, i, index, planName, year, monthName, vehicle, driver);
                                }
                              }
                            );
                          }
                        });
                    }
                  }
                );
              }
            }
          }
        }
      );
    }
  }

  getPickedDustbin(planData: any, planIndex: any, index: any, planName: any, year: any, monthName: any, vehicle: any, driver: any) {
    let picked = 0;
    let assignedDustbin = planData["bins"];
    assignedDustbin = assignedDustbin.replace(" ", "");
    let assignedDustbinList = assignedDustbin.split(",");
    this.planDetail[planIndex]["assigned"] = assignedDustbinList.length;
    if (assignedDustbinList.length > 0) {
      for (let j = 0; j < assignedDustbinList.length; j++) {
        let dustbin = parseInt(assignedDustbinList[j]);
        this.dustbinShow.push({ planName: planName, dustbin: dustbin, picked: 0, address: '', isAssigned: 1, lat: 0, lng: 0, pickFrequency: (j + 1), spelledRight: '', type: '', ward: '', zone: '', planId: index, img: '', vehicle: vehicle, driver: driver, sequence: (j + 1), assigned: 1 });
        let dbPath = 'DustbinData/DustbinPickHistory/' + year + '/' + monthName + '/' + this.selectedDate + '/' + dustbin + '/' + index + '/endTime';
        let dustbinPicked = this.db.object(dbPath).valueChanges().subscribe(
          dustbinsPickedData => {
            dustbinPicked.unsubscribe();
            let isPicked = 0;
            let dustbins = dustbin;
            if (dustbinsPickedData != null) {
              picked += 1;
              isPicked = 1;
            }
            for (let showIndex = 0; showIndex < this.dustbinShow.length; showIndex++) {
              if (this.dustbinShow[showIndex]["dustbin"] == dustbins && this.dustbinShow[showIndex]["planId"] == index) {
                if (isPicked == 1) {
                  this.dustbinShow[showIndex]["img"] = this.pickedDustbinUrl;
                  this.dustbinShow[showIndex]["picked"] = 1;
                }
                else {
                  this.dustbinShow[showIndex]["img"] = this.assignedDustbinUrl;
                }
              }
            }
            this.planDetail[planIndex]["picked"] = picked;
          });
      }
    }
  }

  getRoute(vehicle: any) {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "LocationHistory/BinLifting/" + vehicle + "/" + year + "/" + monthName + "/" + this.selectedDate;
    let vehicleTracking = this.db.list(dbPath).valueChanges().subscribe(
      routePath => {
        vehicleTracking.unsubscribe();
        if (routePath != null) {
          for (let i = 0; i < routePath.length - 2; i++) {
            let lineData = [];
            let routeDateList = [];
            let latLong: string = routePath[i]["lat-lng"];
            if (latLong != undefined) {
              routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
              for (let j = 0; j < routeDateList.length; j++) {
                let routePart = routeDateList[j].split(',');
                if (routePart.length == 2) {
                  lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
                }
              }
            }
            if (this.isRoute == true) {
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
                  let markerURL = this.startUrl;
                  var markerLabel = null
                  let contentString = 'Vechile : ' + vehicle + '<br/>Start time: ' + routePath[i]["time"];
                  this.setMarker(lat, lng, markerLabel, markerURL, 50, 50, contentString, "route", 0, 15, 31);
                }
                if (this.selectedDate != this.todayDate) {
                  if (i == routePath.length - 3) {
                    let lat = lineData[lineData.length - 1]["lat"];
                    let lng = lineData[lineData.length - 1]["lng"];
                    let markerURL = this.endUrl;
                    var markerLabel = null
                    let contentString = 'Vechile : ' + vehicle + '<br/>End time: ' + routePath[i]["time"];
                    this.setMarker(lat, lng, markerLabel, markerURL, 50, 50, contentString, "route", 0, 15, 31);
                  }
                }
                else {
                  if (this.selectedDate == this.todayDate) {
                    if (i == routePath.length - 3) {
                      dbPath = "RealTimeDetails/WardDetails/BinLifting/" + vehicle;
                      let vehicleDutyData = this.db.object(dbPath).valueChanges().subscribe(
                        dutyData => {
                          if (dutyData != null) {
                            if (dutyData["isOnDuty"] != "yes") {
                              let lat = lineData[lineData.length - 1]["lat"];
                              let lng = lineData[lineData.length - 1]["lng"];
                              let markerURL = this.endUrl;
                              var markerLabel = null
                              let contentString = 'Vechile : ' + vehicle + '<br/>End time: ' + routePath[i]["time"];
                              this.setMarker(lat, lng, markerLabel, markerURL, 50, 50, contentString, "route", 0, 15, 31);
                            }
                          }
                        });
                    }
                  }
                }
                this.polylines[i] = line;
                this.polylines[i].setMap(this.map);
                this.allPolylines.push(line);
              }
            }
          }
          if (this.isRoute == true)
            this.getFixedGeoLocation();
        }
      });
  }

  getFixedGeoLocation() {
    this.fixdGeoLocations = JSON.parse(localStorage.getItem("fixedLocation"));;
    if (this.fixdGeoLocations.length > 0) {
      for (let i = 0; i < this.fixdGeoLocations.length; i++) {
        let Lat = this.fixdGeoLocations[i]["lat"];
        let Lng = this.fixdGeoLocations[i]["lng"];
        let markerURL = "../../../assets/img/" + this.fixdGeoLocations[i]["img"];
        var markerLabel = null;
        let contentString = '<b>' + this.fixdGeoLocations[i]["name"] + '</b>: ' + this.fixdGeoLocations[i]["address"];
        this.setMarker(Lat, Lng, markerLabel, markerURL, 50, 50, contentString, "route", 0, 25, 31);
      }
    }
  }

  getHalt(vehicle: any) {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "HaltInfo/BinLifting/" + vehicle + "/" + year + "/" + monthName + "/" + this.selectedDate;
    let halt = this.db.list(dbPath).valueChanges().subscribe(
      haltData => {
        halt.unsubscribe();
        if (haltData.length > 0) {
          let totalBreak = 0;
          for (let index = 0; index < haltData.length; index++) {
            if (haltData[index]["haltType"] != "network-off") {
              let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
              if (duration > this.minHalt) {
                totalBreak += duration;
                if (this.isHalt == true) {
                  let latlng = haltData[index]["location"].split(':')[1].split(',');
                  let lat = $.trim(latlng[0]).replace("(", "");
                  let lng = $.trim(latlng[1]).replace(")", "");
                  let markerURL = this.haltUrl;
                  var markerLabel = haltData[index]["duration"];
                  let contentString = 'Vehicle : ' + vehicle + '<br/>Start Time : ' + haltData[index]["startTime"] + ' <br/> Break Time : ' + haltData[index]["duration"];
                  this.setMarker(lat, lng, markerLabel, markerURL, 50, 50, contentString, "halt", 0, 25, 31);
                }
              }
            }
          }
          if (this.planDetail.length > 0) {
            for (let i = 0; i < this.planDetail.length; i++) {
              if (this.planDetail[i]["vehicle"] == vehicle) {
                this.planDetail[i]["totHalt"] = totalBreak;
              }
            }
          }
        }
      });
  }

  getDriverDetail(driver: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(driver).then((employee) => {
      let planDetails = this.planDetail.find(item => item.driver == driver);
      if (planDetails != undefined) {
        planDetails.driverName = employee["name"] != null ? (employee["name"]).toUpperCase() : "Not Assigned";
        planDetails.mobileNo = employee["mobile"] != null ? (employee["mobile"]) : "---";
      }
    });
  }

  setMapOnAll() {
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
      this.allMarkers = [];
    }
    if (this.allPolylines.length > 0) {
      for (let j = 0; j < this.allPolylines.length; j++) {
        this.allPolylines[j].setMap(null);
      }
    }
    this.allPolylines = [];
    if (this.routeMarker.length > 0) {
      for (let i = 0; i < this.routeMarker.length; i++) {
        this.routeMarker[i]["marker"].setMap(null);
      }
      this.routeMarker = [];
    }
    if (this.haltMarker.length > 0) {
      for (let i = 0; i < this.haltMarker.length; i++) {
        this.haltMarker[i]["marker"].setMap(null);
      }
      this.haltMarker = [];
    }
    if (this.assignedMarker.length > 0) {
      for (let i = 0; i < this.assignedMarker.length; i++) {
        this.assignedMarker[i]["marker"].setMap(null);
      }
      this.assignedMarker = [];
    }
  }

  showHalt() {
    let element = <HTMLInputElement>document.getElementById("halt");
    if (element.checked == true)
      this.isHalt = true;
    else
      this.isHalt = false;
    if (this.haltMarker.length > 0) {
      for (let i = 0; i < this.haltMarker.length; i++) {
        this.haltMarker[i]["marker"].setMap(null);
      }
      this.haltMarker = [];
    }
    if (this.planDetail.length > 0) {
      for (let i = 0; i < this.planDetail.length; i++) {
        if (this.activePlan == null || this.activePlan == "0") {
          this.getHalt(this.planDetail[i]["vehicle"]);
        }
        else {
          if (this.activePlan == this.planDetail[i]["id"]) {
            this.getHalt(this.planDetail[i]["vehicle"]);
          }
        }
      }
    }
  }

  showRoute() {
    let element = <HTMLInputElement>document.getElementById("route");
    if (element.checked == true)
      this.isRoute = true;
    else
      this.isRoute = false;
    if (this.routeMarker.length > 0) {
      for (let i = 0; i < this.routeMarker.length; i++) {
        this.routeMarker[i]["marker"].setMap(null);
      }
      this.routeMarker = [];
    }
    if (this.allPolylines.length > 0) {
      for (let i = 0; i < this.allPolylines.length; i++) {
        this.allPolylines[i].setMap(null);
      }
      this.allPolylines = [];
    }
    if (this.planDetail.length > 0) {
      for (let i = 0; i < this.planDetail.length; i++) {
        if (this.activePlan == null || this.activePlan == "0") {
          this.getRoute(this.planDetail[i]["vehicle"]);
        }
        else {
          if (this.activePlan == this.planDetail[i]["id"]) {
            this.getRoute(this.planDetail[i]["vehicle"]);
          }
        }
      }
    }
    //this.getFilterData();
  }

  showAll() {
    let element = <HTMLInputElement>document.getElementById("dustbin");
    if (element.checked == true)
      this.isAll = true;
    else
      this.isAll = false;
    if (this.isAll == true) {
      if (this.assignedMarker.length == 0) {
        for (let i = 0; i < this.dustbinShow.length; i++) {
          if (this.dustbinShow[i]["assigned"] == 0) {
            let lat = this.dustbinShow[i]["lat"];
            let lng = this.dustbinShow[i]["lng"];
            let markerLabel = null;
            let markerURL = this.dustbinShow[i]["img"];
            let contentString = 'Dustbin: ' + this.dustbinShow[i]["dustbin"] + '<br/> Address : ' + this.dustbinShow[i]["address"];
            this.setMarker(lat, lng, markerLabel, markerURL, 25, 31, contentString, "allDustbin", 0, 15, 25);
          }
        }
      }
      else {
        if (this.assignedMarker.length > 0) {
          for (let i = 0; i < this.assignedMarker.length; i++) {
            this.assignedMarker[i]["marker"].setMap(this.map);
          }
        }
      }
    }
    else {
      if (this.assignedMarker.length > 0) {
        for (let i = 0; i < this.assignedMarker.length; i++) {
          this.assignedMarker[i]["marker"].setMap(null);
        }
      }
    }
  }

  getStartTime(driverId: any, planId: any) {
    for (let i = 1; i < 5; i++) {
      let dbPath = "DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + driverId + "/task" + i + "";
      let taskInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          taskInstance.unsubscribe();
          if (data != null) {
            if (data["binLiftingPlanId"] == planId) {
              if (Object.keys(data["in-out"])[0] != null) {
                {
                  let time = this.commonService.tConvert(Object.keys(data["in-out"])[0]);
                  let removeSecond = time.split(' ');
                  time = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  let planDetails = this.planDetail.find(item => item.id == planId);
                  if (planDetails != undefined) {
                    planDetails.startTime = time;
                  }
                }
              }
              if (Object.keys(data["in-out"])[1] != null) {
                {
                  let time = this.commonService.tConvert(Object.keys(data["in-out"])[1]);
                  let removeSecond = time.split(' ');
                  time = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  let planDetails = this.planDetail.find(item => item.id == planId);
                  if (planDetails != undefined) {
                    planDetails.endTime = time;
                  }

                }
              }
              let planDetails = this.planDetail.find(item => item.id == planId);
              if (planDetails != undefined) {
                let dutyOnTime = planDetails.startTime.split(',')[0];
                let dat1 = new Date(this.selectedDate + " " + dutyOnTime);
                let dat2 = new Date();
                if (planDetails.endTime != "00:00") {
                  dat2 = new Date(this.selectedDate + " " + planDetails.endTime);
                }
                let totalMinutes = this.commonService.timeDifferenceMin(dat2, dat1);
                planDetails.totTime = this.commonService.getHrsFull(totalMinutes);
              }
            }
          }
        }
      );
    }
  }

  getDistanceCovered(vehicle: any, planId: any, year: any, monthName: any) {
    let dbPath = "LocationHistory/BinLifting/" + vehicle + "/" + year + "/" + monthName + "/" + this.selectedDate + "/TotalCoveredDistance";
    let distanceInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        distanceInstance.unsubscribe();
        if (data != null) {
          let planDetails = this.planDetail.find(item => item.id == planId);
          if (planDetails != undefined) {
            planDetails.totDistance = (Number(data) / 1000).toFixed(3);
          }
        }
      }
    );
  }

  setMarker(lat: any, lng: any, markerLabel: any, markerURL: any, scaledHeight: any, scaledWidth: any, contentString: any, type: any, assiged: any, labelHeight: any, labelWidth: any) {
    if (markerLabel != null) {
      markerLabel = markerLabel + '';
    }
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(scaledHeight, scaledWidth),
        labelOrigin: new google.maps.Point(labelHeight, labelWidth)
      },
      label: {
        text: markerLabel,
        color: '#fff',
        fontSize: '12px',
        fontWeight: "bold"
      }
    });

    let infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    marker.addListener('click', function () {
      infowindow.open(this.map, marker);
    });

    if (type == "vehicle") {
      this.vehicleMarkers.push({ marker });
    }
    else if (type == "assignedDustbin") {
      this.allMarkers.push({ marker });
      if (assiged == 0) {
        this.assignedMarker.push({ marker });
      }
    }
    else if (type == "halt") {
      this.haltMarker.push({ marker });
    }
    else if (type == "route") {
      this.routeMarker.push({ marker });
    }
    else if (type == "allDustbin") {
      this.assignedMarker.push({ marker });
    }
  }

  setMarkerNew() {
    if (this.dustbinShow.length > 0) {
      for (let i = 0; i < this.allDustbin.length; i++) {
        let isAssined = false;
        for (let j = 0; j < this.dustbinShow.length; j++) {
          if (this.allDustbin[i]["dustbin"] == this.dustbinShow[j]["dustbin"]) {
            isAssined = true;
            this.dustbinShow[j]["lat"] = this.allDustbin[i]["lat"];
            this.dustbinShow[j]["lng"] = this.allDustbin[i]["lng"];
            this.dustbinShow[j]["address"] = this.allDustbin[i]["address"];
            let lat = this.allDustbin[i]["lat"];
            let lng = this.allDustbin[i]["lng"];
            let markerLabel = null;
            if (this.dustbinShow[j]["sequence"] != null) {
              markerLabel = this.dustbinShow[j]["sequence"];
            }
            let markerURL = this.dustbinShow[j]["img"];
            let contentString = 'Dustbin: ' + this.allDustbin[i]["dustbin"] + '<br/> Address : ' + this.allDustbin[i]["address"];
            this.setMarker(lat, lng, markerLabel, markerURL, 30, 35, contentString, "assignedDustbin", 1, 15, 25);
            this.bounds.extend({ lat: Number(this.allDustbin[i]["lat"]), lng: Number(this.allDustbin[i]["lng"]) });
          }
        }
        if (isAssined == false) {
          this.dustbinShow.push({ dustbin: this.allDustbin[i]["dustbin"], address: this.allDustbin[i]["address"], isAssigned: 0, lat: this.allDustbin[i]["lat"], lng: this.allDustbin[i]["lng"], pickFrequency: (i + 1), spelledRight: '', type: '', ward: '', zone: '', planId: 0, img: this.defaultDustbinUrl, planName: '', vehicle: '', driver: '', sequence: 0, assigned: 0, picked: 0 });
        }
        this.map.fitBounds(this.bounds);
      }
    }
    else {
      this.setMaps();
    }
  }

  getFilterData() {
    this.setMapOnAll();
    (<HTMLInputElement>document.getElementById("halt")).checked = false;
    (<HTMLInputElement>document.getElementById("route")).checked = false;
    (<HTMLInputElement>document.getElementById("dustbin")).checked = false;
    this.isHalt = false;
    this.isRoute = false;
    let selectedPlan = $('#ddlPickPlans').val();
    if (this.vehicleMarkers.length > 0) {
      for (let i = 0; i < this.vehicleMarkers.length; i++) {
        this.vehicleMarkers[i]["marker"].setMap(null);
      }
    }
    let showMarker = false;
    this.bounds = new google.maps.LatLngBounds();
    if (this.dustbinShow.length > 0) {
      if (this.planDetail.length > 0) {
        for (let i = 0; i < this.planDetail.length; i++) {
          if (selectedPlan != 0) {
            if (this.vehicleMarkers.length > 0) {
              if (selectedPlan == this.planDetail[i]["id"]) {
                this.vehicleMarkers[i]["marker"].setMap(this.map);
              }
            }
            for (let j = 0; j < this.dustbinShow.length; j++) {
              if (this.dustbinShow[j]["planId"] == selectedPlan) {
                if (this.dustbinShow[j]["lat"] != "0") {
                  if (this.dustbinShow[j]["picked"] == 1) {
                    this.dustbinShow[j]["img"] = this.pickedDustbinUrl;
                  }
                  else {
                    this.dustbinShow[j]["img"] = this.assignedDustbinUrl;
                  }
                  showMarker = true;
                  let imgPath = this.dustbinShow[j]["img"];
                  let sequence = this.dustbinShow[j]["sequence"];
                  let assiged = this.dustbinShow[j]["assigned"];
                  let lat = this.dustbinShow[j]["lat"];
                  let lng = this.dustbinShow[j]["lng"];
                  let contentString = 'Dustbin: ' + this.dustbinShow[j]["dustbin"] + '<br/> Address : ' + this.dustbinShow[j]["address"];
                  this.setMarker(lat, lng, sequence, imgPath, 30, 35, contentString, "assignedDustbin", assiged, 15, 25);
                }
              }
            }
          }
          else {
            if (this.vehicleMarkers.length > 0) {
              for (let i = 0; i < this.vehicleMarkers.length; i++) {
                this.vehicleMarkers[i]["marker"].setMap(this.map);
              }
            }
            for (let j = 0; j < this.dustbinShow.length; j++) {
              if (this.dustbinShow[j]["lat"] != "0") {
                showMarker = true;
                let imgPath = this.dustbinShow[j]["img"];
                let sequence = this.dustbinShow[j]["sequence"];
                let assiged = this.dustbinShow[j]["assigned"];
                let lat = this.dustbinShow[j]["lat"];
                let lng = this.dustbinShow[j]["lng"];
                let contentString = 'Dustbin: ' + this.dustbinShow[j]["dustbin"] + '<br/> Address : ' + this.dustbinShow[j]["address"];
                this.setMarker(lat, lng, sequence, imgPath, 30, 35, contentString, "assignedDustbin", assiged, 15, 25);
              }
            }
          }
        }
        if (this.assignedMarker.length > 0) {
          for (let i = 0; i < this.assignedMarker.length; i++) {
            this.assignedMarker[i]["marker"].setMap(null);
          }
        }
      }
    }
  }

  findDustbins() {
    this.getData();
    setTimeout(() => {
      this.setMarkerNew();
    }, 5000);
  }

  showImageDetail() {
    this.router.navigate(['/' + this.cityName + '/3A/dustbin-analysis']);
  }
}