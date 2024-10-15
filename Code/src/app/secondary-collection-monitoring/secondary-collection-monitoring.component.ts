/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
//services
import { CommonService } from '../services/common/common.service';
import { MapService } from '../services/map/map.service';
import * as $ from "jquery";
import { Router } from '@angular/router';
import { FirebaseService } from "../firebase.service";
import { DustbinService } from "../services/dustbin/dustbin.service";
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-secondary-collection-monitoring',
  templateUrl: './secondary-collection-monitoring.component.html',
  styleUrls: ['./secondary-collection-monitoring.component.scss']
})
export class SecondaryCollectionMonitoringComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(private router: Router, private dustbinService: DustbinService, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, public toastr: ToastrService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService) { }

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
  routePolyline: any[] = [];
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
  dehradunSunlightDustbinUrl: any;
  dehradunEconDustbinUrl: any;
  cityName: any;
  db: any;
  instancesList: any[] = [];
  serviceName = "secondary-collection-monitoring";
  // route tracking

  routePathStore: any[];
  timeInterval: any;
  endTime: any;
  isPreviousTime: any;
  public startTime: any;
  isLast = false;
  isStart = false;
  totalTiminingKM: any;
  lineDataList: any[];
  lineIndex: any = 0;
  isReset = false;
  routeMarkIcon: any;
  trackData: trackDetail =
    {
      totalKM: 0,
      totalTime: "0 hr 0 min",
      time: "0:00",
      percentage: "0"
    };
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Monitoring", "Secondary-Collection-Monitoring", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.getDefaultImageUrl();
    this.setMaps();
    if (this.cityName == "dehradun") {
      $("#divOthersCity").hide();
      $("#divOthersZone").hide();
      $("#divOthersToggle").hide();
    }
    else {
      $("#ddlCompany").hide();
      this.todayDate = this.commonService.setTodayDate();
      this.selectedDate = this.todayDate;
      this.minHalt = 5;
      this.isHalt = false;
      this.isRoute = false;
      (<HTMLInputElement>document.getElementById("halt")).checked = false;
      (<HTMLInputElement>document.getElementById("route")).checked = false;
      $('#txtDate').val(this.selectedDate);
      this.currentYear = new Date().getFullYear();
      this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
      this.activeZone = 0;
      this.assignedBinList = [];
      this.instancesList = [];
      setTimeout(() => {
        this.setMarkerNew();
        this.getFixedGeoLocation();
      }, 5000);
    }
    this.getDustbins();
  }

  getDefaultImageUrl() {
    this.startUrl = "../../../assets/img/start.svg";
    this.endUrl = "../../../assets/img/stop.svg";
    this.haltUrl = "../../assets/img/red.svg";
    this.vehicleUrl = "../assets/img/portal-vehicle.svg";
    this.pickedDustbinUrl = "../assets/img/green-rectange-dustbin.svg";
    this.assignedDustbinUrl = "../../assets/img/blue-rectange-dustbin.svg";
    this.defaultDustbinUrl = "../assets/img/dark gray without tick rectangle.png";
    this.dehradunSunlightDustbinUrl = "../assets/img/green-rectange-dustbin.svg";
    this.dehradunEconDustbinUrl = "../assets/img/blue-rectange-dustbin.svg";
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
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $('#txtDate').val(newDate.toString());
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
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
        this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
        this.findDustbins();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
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
    dustbinStorageList = JSON.parse(localStorage.getItem("openDepot"));
    if (dustbinStorageList != null) {
      for (let i = 0; i < dustbinStorageList.length; i++) {
        this.allDustbin.push({ dustbin: dustbinStorageList[i]["dustbin"], address: dustbinStorageList[i]["address"], isAssigned: dustbinStorageList[i]["isAssigned"], lat: dustbinStorageList[i]["lat"], lng: dustbinStorageList[i]["lng"], pickFrequency: dustbinStorageList[i]["pickFrequency"], spelledRight: dustbinStorageList[i]["spelledRight"], type: dustbinStorageList[i]["type"], ward: dustbinStorageList[i]["ward"], zone: dustbinStorageList[i]["zone"], planId: "", img: "", planName: "", vehicle: "", driver: "", sequence: 0, assigned: 0 });
      }
      if (this.cityName != "dehradun") {
        this.getData();
      }
      else {
        this.showDehradunDustbin();
      }
    }
  }

  showVTSRoute() {
    let element = <HTMLInputElement>document.getElementById("vtsRoute");
    if (element.checked == true) {
      if (this.activePlan == null || this.activePlan == "0") {
        element.checked = false;
        this.commonService.setAlertMessage("error", "Please select plan.");
        return;
      }
      let detail = this.planDetail.find(item => item.id == this.activePlan);
      if (detail != undefined) {
        this.getVTSRoute(detail.vehicle);
      }
    }
    else {
      if (this.routePolyline.length > 0) {
        for (let i = 0; i < this.routePolyline.length; i++) {
          this.routePolyline[i].setMap(null);
        }
        this.routePolyline = [];
      }
    }
  }

  getVTSRoute(vehicle: any) {
    let path = "https://wevois-vts-default-rtdb.firebaseio.com/VehicleRoute/" + vehicle + "/" + this.selectedDate + ".json";
    this.httpService.get(path).subscribe(data => {
      if (data != null) {
        let keyArray = Object.keys(data);
        let lineData = [];
        for (let j = 0; j < keyArray.length - 2; j++) {
          let time = keyArray[j];
          let lat = data[time].split(",")[0];
          let lng = data[time].split(",")[1];
          lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        let line = new google.maps.Polyline({
          path: lineData,
          strokeColor: "blue",
          strokeWeight: 2
        });
        this.routePolyline[0] = line;
        this.routePolyline[0].setMap(this.map);
      }
      else {
        (<HTMLInputElement>document.getElementById("vtsRoute")).checked = false;
        this.commonService.setAlertMessage("error", "No VTS Route found for vehicle " + vehicle);
      };
    });

  }

  /* ----------Dehradun Dustbin Start----------------- */

  changeCompanySelection() {
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
      this.allMarkers = [];
    }
    this.showDehradunDustbin();
  }

  showDehradunDustbin() {
    let list = this.allDustbin;
    if ($("#ddlCompany").val() == "Sunlight") {
      list = this.allDustbin.filter(item => item.type == "Circular");
    }
    if ($("#ddlCompany").val() == "Econ") {
      list = this.allDustbin.filter(item => item.type == "Rectangular");
    }
    for (let i = 0; i < list.length; i++) {
      let imageUrl = this.dehradunEconDustbinUrl;
      if (list[i]["type"] == "Circular") {
        imageUrl = this.dehradunSunlightDustbinUrl;
      }
      this.setMarker(list[i]["lat"], list[i]["lng"], list[i]["pickFrequency"], imageUrl, 30, 35, "", "dehradun", 0, 15, 25);
    }
  }



  /* ----------Dehradun Dustbin End----------------- */

  getData() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getData");
    this.planDetail = [];
    this.pickkingPlanList = [];
    this.dustbinShow = [];
    this.pickkingPlanList.push({ planId: 0, planName: "Select Pick Plan" });
    this.setMapOnAll();
    $('#ddlZone').val("0");
    $('#ddlPickPlans').val("0");
    (<HTMLInputElement>document.getElementById("halt")).checked = false;
    (<HTMLInputElement>document.getElementById("route")).checked = false;
    (<HTMLInputElement>document.getElementById("dustbin")).checked = false;
    (<HTMLInputElement>document.getElementById("vtsRoute")).checked = false;
    $("#divTrack").hide();
    this.isHalt = false;
    this.isRoute = false;
    this.bounds = new google.maps.LatLngBounds();
    if (this.allDustbin != null) {
      let year = this.selectedDate.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
      this.dustbinService.getAssignedOpenDepotByDate(this.selectedDate).then(response => {
        if (response["status"] == "success") {
          let list = response["data"];
          for (let i = 0; i < list.length; i++) {
            let classes = "collapse";
            if (i == 0) {
              classes = "collapse show";
            }
            this.pickkingPlanList.push({ planId: list[i]["id"], vehicle: list[i]["vehicle"], planName: list[i]["planName"] + " [" + list[i]["vehicle"] + "]" });
            this.planDetail.push({ id: list[i]["id"], planName: list[i]["planName"], vehicle: list[i]["vehicle"], driver: list[i]["driver"], totDistance: 0, totTime: 0, driverName: "", mobileNo: "", totHalt: 0, assigned: 0, picked: 0, classes: classes, startTime: "00:00", endTime: "00:00", isWardPlan: list[i]["isWardPlan"] });
            this.getHalt(list[i]["vehicle"], list[i]["id"]);
            this.getDriverDetail(list[i]["driver"], list[i]["id"]);
            this.getStartTime(list[i]["driver"], list[i]["id"]);
            this.getDistanceCovered(list[i]["vehicle"], list[i]["id"], year, monthName);
            if (this.selectedDate == this.todayDate) {
              let vehicleLocation = this.db.object('CurrentLocationInfo/BinLifting/' + list[i]["vehicle"] + '/CurrentLoc').valueChanges().subscribe(
                vehicleLocationData => {
                  if (vehicleLocationData != null) {
                    this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getData", vehicleLocationData);
                    if (this.selectedDate == this.todayDate) {
                      let lat = vehicleLocationData["lat"];
                      let lng = vehicleLocationData["lng"];
                      let contentString = 'Vehicle: ' + list[i]["vehicle"];
                      this.setMarker(lat, lng, null, this.vehicleUrl, 60, 60, contentString, "vehicle", 0, 15, 25);
                    }
                  }
                  vehicleLocation.unsubscribe();
                });
            }
            this.getPickedDustbin(list[i]["planData"], i, list[i]["id"], list[i]["planName"], year, monthName, list[i]["vehicle"], list[i]["driver"]);
          }
        }
      });
    }
  }


  getPickedDustbin(planData: any, planIndex: any, index: any, planName: any, year: any, monthName: any, vehicle: any, driver: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getPickedDustbin");
    let picked = 0;
    let assignedDustbin = planData["bins"];
    assignedDustbin = assignedDustbin.replace(" ", "");
    let assignedDustbinList = assignedDustbin.split(",");
    let detail = this.planDetail.find(item => item.id == index);
    if (detail != undefined) {
      detail.assigned = assignedDustbinList.length;
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
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPickedDustbin", dustbinsPickedData);
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
              detail.picked = picked;
            });
        }
      }
    }

  }


  getRoute(vehicle: any, index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getRoute");
    let planDetail = this.planDetail.find(item => item.id == index);
    console.log(planDetail);
    if (planDetail != undefined) {
      let monthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
      let year = this.selectedDate.split("-")[0];
      let dbPath = "LocationHistory/BinLifting/" + vehicle + "/" + year + "/" + monthName + "/" + this.selectedDate;
      if (planDetail.isWardPlan == "1") {
        let planName = planDetail.planName;
        let ward = planName.split(' ')[1];
        dbPath = "LocationHistory/"+ward+"/" + year + "/" + monthName + "/" + this.selectedDate;
      }
      let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
        routePath => {
          vehicleTracking.unsubscribe();
          this.routePathStore = [];
          if (routePath != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getRoute", routePath);
            let keyArray = Object.keys(routePath);
            for (let i = 0; i < keyArray.length - 2; i++) {
              let time = keyArray[i];
              let lineData = [];
              let routeDateList = [];
              let latLong: string = routePath[time]["lat-lng"];
              this.routePathStore.push({ vehicle: vehicle, distanceinmeter: routePath[time]["distance-in-meter"], latlng: routePath[time]["lat-lng"], time: time });
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
                    var markerLabel = null;
                    let contentString = 'Vechile : ' + vehicle + '<br/>Start time: ' + time;
                    this.setMarker(lat, lng, markerLabel, markerURL, 50, 50, contentString, "route", 0, 15, 31);
                  }
                  if (this.selectedDate != this.todayDate) {
                    if (i == keyArray.length - 3) {
                      let lat = lineData[lineData.length - 1]["lat"];
                      let lng = lineData[lineData.length - 1]["lng"];
                      let markerURL = this.endUrl;
                      var markerLabel = null;
                      let contentString = 'Vechile : ' + vehicle + '<br/>End time: ' + time;
                      this.setMarker(lat, lng, markerLabel, markerURL, 50, 50, contentString, "route", 0, 15, 31);
                    }
                  }
                  else {
                    if (this.selectedDate == this.todayDate) {
                      if (i == keyArray.length - 3) {
                        dbPath = "RealTimeDetails/WardDetails/BinLifting/" + vehicle;
                        let vehicleDutyData = this.db.object(dbPath).valueChanges().subscribe(
                          dutyData => {
                            this.instancesList.push({ instances: vehicleDutyData });
                            if (dutyData != null) {
                              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getRoute", dutyData);
                              if (dutyData["isOnDuty"] != "yes") {
                                let lat = lineData[lineData.length - 1]["lat"];
                                let lng = lineData[lineData.length - 1]["lng"];
                                let markerURL = this.endUrl;
                                var markerLabel = null
                                let contentString = 'Vechile : ' + vehicle + '<br/>End time: ' + time;
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
            if (this.isRoute == true) {
              //this.getFixedGeoLocation();
            }
          }
        });
    }
  }


  getFixedGeoLocation() {
    this.fixdGeoLocations = JSON.parse(localStorage.getItem("fixedLocation"));
    if (this.fixdGeoLocations.length > 0) {
      for (let i = 0; i < this.fixdGeoLocations.length; i++) {
        if (this.fixdGeoLocations[i]["lat"] != null) {
          let Lat = this.fixdGeoLocations[i]["lat"];
          let Lng = this.fixdGeoLocations[i]["lng"];
          let markerURL = "../../../assets/img/" + this.fixdGeoLocations[i]["img"];
          var markerLabel = null;
          let contentString = '<b>' + this.fixdGeoLocations[i]["name"] + '</b>: ' + this.fixdGeoLocations[i]["address"];
          this.setMarker(Lat, Lng, markerLabel, markerURL, 50, 50, contentString, "route", 0, 25, 31);
        }
      }
    }
  }

  getHalt(vehicle: any, index: any) {
    let detail = this.planDetail.find(item => item.id == index);
    if (detail != undefined) {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getHalt");
      let monthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
      let year = this.selectedDate.split("-")[0];
      let dbPath = "HaltInfo/BinLifting/" + vehicle + "/" + year + "/" + monthName + "/" + this.selectedDate;
      if (detail.isWardPlan == "1") {
        let planName = detail.planName;
        let ward = planName.split(' ')[1];
        dbPath = "HaltInfo/" + ward + "/" + year + "/" + monthName + "/" + this.selectedDate;
      }

      let halt = this.db.list(dbPath).valueChanges().subscribe(
        haltData => {
          halt.unsubscribe();
          if (haltData.length > 0) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getHalt", haltData);
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

            detail.totHalt = totalBreak;

          }
        });
    }
  }

  getDriverDetail(driver: any, index: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(driver).then((employee) => {
      let planDetails = this.planDetail.find(item => item.id == index);
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
    if (this.routePolyline.length > 0) {
      for (let i = 0; i < this.routePolyline.length; i++) {
        this.routePolyline[i].setMap(null);
      }
      this.routePolyline = [];
    }
  }

  showHalt() {
    let element = <HTMLInputElement>document.getElementById("halt");

    if (element.checked == true) {
      if (this.activePlan == null || this.activePlan == "0") {
        element.checked = false;
        this.commonService.setAlertMessage("error", "Please select plan.");
        return;
      }
      this.isHalt = true;
    }
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
          this.getHalt(this.planDetail[i]["vehicle"], "0");
        }
        else {
          if (this.activePlan == this.planDetail[i]["id"]) {
            this.getHalt(this.planDetail[i]["vehicle"], this.planDetail[i]["id"]);
          }
        }
      }
    }
  }

  showRoute() {
    let element = <HTMLInputElement>document.getElementById("route");
    if (element.checked == true) {
      if (this.activePlan == null || this.activePlan == "0") {
        element.checked = false;
        this.commonService.setAlertMessage("error", "Please select plan.");
        return;
      }
      this.isRoute = true;
      $("#divTrack").show();
    }
    else {
      this.isRoute = false;
      $("#divTrack").hide();
    }
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
          this.getRoute(this.planDetail[i]["vehicle"], "0");
        }
        else {
          if (this.activePlan == this.planDetail[i]["id"]) {
            this.getRoute(this.planDetail[i]["vehicle"], this.planDetail[i]["id"]);
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
        if (this.dustbinShow.length > 0) {
          for (let i = 0; i < this.dustbinShow.length; i++) {
            if (this.dustbinShow[i]["assigned"] == 0) {
              let lat = this.dustbinShow[i]["lat"];
              let lng = this.dustbinShow[i]["lng"];
              let markerLabel = null;
              let markerURL = this.dustbinShow[i]["img"];
              let contentString = 'Open Depot : ' + this.dustbinShow[i]["dustbin"] + '<br/> Address : ' + this.dustbinShow[i]["address"];
              this.setMarker(lat, lng, markerLabel, markerURL, 25, 31, contentString, "allDustbin", 0, 15, 25);
            }
          }
        }
        else {
          for (let i = 0; i < this.allDustbin.length; i++) {
            let lat = this.allDustbin[i]["lat"];
            let lng = this.allDustbin[i]["lng"];
            let markerLabel = null;
            let markerURL = this.defaultDustbinUrl;
            let contentString = 'Open Depot : ' + this.allDustbin[i]["dustbin"] + '<br/> Address : ' + this.allDustbin[i]["address"];
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getStartTime");
    for (let i = 1; i < 5; i++) {
      let dbPath = "DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + driverId + "/task" + i + "";
      let taskInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          taskInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getStartTime", data);
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
            else if (data["openDepotPlanId"] == planId) {
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDistanceCovered");
    let planDetails = this.planDetail.find(item => item.id == planId);
    if (planDetails != undefined) {
      let dbPath = "LocationHistory/BinLifting/" + vehicle + "/" + year + "/" + monthName + "/" + this.selectedDate + "/TotalCoveredDistance";
      if (planDetails.isWardPlan == "1") {
        let planName = planDetails.planName;
        let ward = planName.split(' ')[1];
        dbPath = "LocationHistory/" + ward + "/" + year + "/" + monthName + "/" + this.selectedDate + "/TotalCoveredDistance";
      }

      let distanceInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          distanceInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDistanceCovered", data);
            planDetails.totDistance = (Number(data) / 1000).toFixed(3);
          }
        }
      );
    }
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
    else if (type == "dehradun") {
      this.allMarkers.push({ marker });
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
            let contentString = 'Open Depot : ' + this.allDustbin[i]["dustbin"] + '<br/> Address : ' + this.allDustbin[i]["address"];
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
    (<HTMLInputElement>document.getElementById("vtsRoute")).checked = false;
    $('#divTrack').hide();
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
                  let contentString = 'Open Depot : ' + this.dustbinShow[j]["dustbin"] + '<br/> Address : ' + this.dustbinShow[j]["address"];
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
                let contentString = 'Open Depot : ' + this.dustbinShow[j]["dustbin"] + '<br/> Address : ' + this.dustbinShow[j]["address"];
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
    this.router.navigate(['/' + this.cityName + '/25A/open-depot-analysis']);
  }

  ngOnDestroy() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
      }
    }
  }

  getRouteData(timeInt: any) {
    if (this.polylines != null) {
      for (let j = 0; j < this.polylines.length; j++) {
        this.polylines[j].setMap(null);
      }
    }
    this.polylines = [];
    this.trackData.totalKM = 0;
    this.trackData.totalTime = "0 hr 0 min";
    this.timeInterval = parseInt(timeInt);
    let planId = $("#ddlPickPlans").val();
    if (planId == "0") {
      this.commonService.setAlertMessage("error", "Please select pick plan !!!");
      $("#ddlTime").val("0");
      return;
    }
    if (this.routePathStore.length > 0) {
      if (this.timeInterval == 0) {
        this.endTime = null;
        this.isPreviousTime = false;
      }
      else {
        if (this.endTime != null) {
          if (this.isPreviousTime == false) {
            this.endTime = parseInt(timeInt) - 1;
            this.isPreviousTime = true;
          }
          else {
            this.endTime = parseInt(this.endTime) + parseInt(timeInt) - 1;
          }
        }
        else {
          this.endTime = parseInt(timeInt) - 1;
          this.isPreviousTime = false;
        }
      }
    }
    this.getVehicleRouteTime();
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
      let lat = "";
      let lng = "";
      for (let i = 0; i <= this.endTime; i++) {
        if (lineData.length > 0) {
          lat = lineData[lineData.length - 1]["lat"];
          lng = lineData[lineData.length - 1]["lng"];
          lineData = [];
          lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        let routeDateList = [];
        let latLong: string = this.routePathStore[i]["latlng"];
        let time = this.routePathStore[i]["time"];
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

          this.polylines[i] = line;
          this.polylines[i].setMap(this.map);
          this.trackData.totalKM = parseFloat((totalKM / 1000).toFixed(2));
          this.trackData.totalTime = this.commonService.getHrsFull((this.endTime + 1));
          this.totalTiminingKM = totalKM;
          if (i == this.endTime) {
            if (this.routeMarkIcon != null) {
              this.routeMarkIcon.setMap(null);
            }
            this.setRouteMarker(parseFloat(lat), parseFloat(lng), time);
          }
        }
      }
    }
  }

  getRouteDataPreNext(type: any) {
    if (this.timeInterval != 0) {
      if (this.polylines != null) {
        for (let j = 0; j < this.polylines.length; j++) {
          this.polylines[j].setMap(null);
        }
      }
      this.polylines = [];
      this.trackData.totalKM = 0;
      this.trackData.totalTime = "0 hr 0 min";
      if (type == "pre") {
        this.endTime = this.endTime - this.timeInterval;
        if (this.endTime < 0) {
          this.endTime = 0;
        }
        this.getVehicleRouteTime();
      }
      else {
        this.endTime = this.endTime + this.timeInterval;
        this.getVehicleRouteTime();
      }
    }
  }

  setRouteMarker(lat: any, lng: any, time: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: '../assets/img/greenmarker.png',
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(32, 40),
        origin: new google.maps.Point(0, 0),
      },
    });

    let infowindow = new google.maps.InfoWindow({
      content: "<br/>time : " + time
    });

    marker.addListener('click', function () {
      infowindow.open(this.map, marker);
    });
    this.routeMarkIcon = marker;
  }

}



export class trackDetail {
  totalKM: number;
  totalTime: string;
  time: string;
  percentage: string;
}
