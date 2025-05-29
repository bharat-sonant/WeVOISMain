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
  selector: 'app-ward-route-tracking',
  templateUrl: './ward-route-tracking.component.html',
  styleUrls: ['./ward-route-tracking.component.scss']
})
export class WardRouteTrackingComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, public router: Router, private actRoute: ActivatedRoute, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }
  db: any;
  public selectedZone: any;
  public selectedWard: any;
  zoneList: any[];
  wardList: any[];
  wardObject: any;
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
  routePolyline: any[] = [];
  userType: any;
  lineList: any[] = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  wardStartUrl = "../assets/img/go-image.png";
  wardEndUrl = "../assets/img/end-image.png";
  vehicleRunningTipperUrl = "../assets/img/tipper-green.png";
  vehicleCompletedTipperUrl = "../assets/img/tipper-gray.png";
  vehicleStopedTipperUrl = "../assets/img/tipper-red.png";
  vehicleRunningTractorUrl = "../assets/img/active-tractormdpi.png";
  vehicleCompletedTractorUrl = "../assets/img/disabled-tractormdpi.png";
  vehicleStopedTractorUrl = "../assets/img/stop-tractormdpi.png";
  wardNoUrl = "../assets/img/wardNo.png";
  chkIsShowLineNo = "chkIsShowLineNo";
  divOptional="#divOptional";
  lineNoBox="#lineNoBox";
  wardStartEndMarkerList: any[] = [];
  vehicleMarkerList: any[] = [];
  lineMarkerList: any[] = [];
  isShowLineNo: any;
  trackData: trackDetail =
    {
      totalKM: 0,
      totalTime: "0 hr 0 min",
      time: "0:00",
      percentage: "0"
    };
  ngOnInit() {
    this.userType = localStorage.getItem("userType");
    this.instancesList = [];
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.savePageLoadHistory("Monitoring", "Route-Tracking", localStorage.getItem("userID"));
    this.isShowLineNo = false;
    this.setSpeed(Number($('#ddlSpeed').val()));
    $("#divVehicleMovement").hide();
    $("#timeBox").hide();
    $('#btnPre').hide();
    $('#btnReset').hide();
    this.getMinmumMaximumDistance();
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $('#txtDate').val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.timeInterval = 0;
    this.getZoneList();
    this.setMaps();
    // this.getFixedGeoLocation();
  }

  showLoader() {
    $("#divLoader").show();
    setTimeout(() => {
      $("#divLoader").hide();
    }, 3000);
  }


  getZoneList() {
    this.wardList = [];
    this.zoneList = [];
    this.zoneKML = [];
    this.routePathStore = [];
    this.wardList.push({ wardNo: "0", wardName: "--Select--" });
    this.selectedWard = "0";
    this.selectedZone = "0";
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDefaults%2FWardRouteMapping.json?alt=media";
    let jsonInstance = this.httpService.get(path).subscribe(data => {
      jsonInstance.unsubscribe();
      this.wardObject = data;
      let keyArray = Object.keys(data);
      for (let i = 0; i < keyArray.length; i++) {
        let wardNo = keyArray[i];
        let wardName = "Zone " + wardNo;
        this.wardList.push({ wardNo: wardNo, wardName: wardName });
      }
      const id = this.actRoute.snapshot.paramMap.get('id1');
      if (id != null) {
        this.showLoader();
        this.selectedWard = id.toString().split("-")[0].trim();
        let data = this.wardObject[this.selectedWard];
        let keyArray = Object.keys(data);
        this.zoneList.push({ zoneNo: "Show All", zoneName: "--Select--" });
        for (let i = 0; i < keyArray.length; i++) {
          let zoneNo = keyArray[i];
          this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneNo, color: this.getBoundaryColor(i), routeColor: this.getRouteColor(i), dutyOff: "" });
        }
        $("#divVehicleMovement").hide();
        this.getWardBoundaries(id.trim());
        this.getRouteLines(id.trim());
        this.getDutyOnOffTime(id.trim());
        this.selectedZone = id.trim();
        setTimeout(() => {
          let element = <HTMLInputElement>document.getElementById("chk" + id.trim());
          element.checked = true;
        }, 200);
      }
    }, error => {
    });
  }

  changeWardSelection(value: any) {
    $("#divVehicleMovement").hide();
    $("#timeBox").hide();
    this.setDefaultVechileMovement();
    this.clearZoneLines();
    this.clearAllInstance();
    this.setMapOnAll();
    this.zoneList = [];
    if (this.zoneKML != undefined) {
      if (this.zoneKML.length > 0) {
        for (let i = 0; i < this.zoneKML.length; i++) {
          this.zoneKML[i][0]["line"].setMap(null);
        }
      }
    }
    this.zoneKML = [];
    if (this.routePathStore.length > 0) {
      for (let i = 0; i < this.routePathStore.length; i++) {
        let polyLines = this.routePathStore[i]["polyLines"];
        if (polyLines.length > 0) {
          for (let j = 0; j < polyLines.length; j++) {
            polyLines[j].setMap(null);
          }
        }
      }
    }
    this.routePathStore = [];
    if (value == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
    }
    else {
      this.showLoader();
      let data = this.wardObject[value];
      let keyArray = Object.keys(data);
      this.zoneList.push({ zoneNo: "Show All", zoneName: "--Select--" });
      this.selectedZone = "Show All";
      for (let i = 0; i < keyArray.length; i++) {
        let zoneNo = keyArray[i];
        this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneNo, color: this.getBoundaryColor(i), routeColor: this.getRouteColor(i) });
        this.getWardBoundaries(zoneNo);
        this.getRouteLines(zoneNo);
        this.getDutyOnOffTime(zoneNo);
      }
      setTimeout(() => {
        for (let i = 0; i < this.zoneList.length; i++) {
          let element = <HTMLInputElement>document.getElementById("chk" + this.zoneList[i]["zoneNo"].trim());
          element.checked = true;
        }

      }, 200);
    }
  }

  changeZoneSelection(value: any) {
    this.setDefaultVechileMovement();
    this.clearZoneLines();
    this.clearAllInstance();
    this.setMapOnAll();
    if (this.zoneKML != undefined) {
      if (this.zoneKML.length > 0) {
        for (let i = 0; i < this.zoneKML.length; i++) {
          this.zoneKML[i][0]["line"].setMap(null);
        }

      }
    }
    this.selectedZone = value;
    this.zoneKML = [];
    if (this.routePathStore.length > 0) {
      for (let i = 0; i < this.routePathStore.length; i++) {
        let polyLines = this.routePathStore[i]["polyLines"];
        if (polyLines.length > 0) {
          for (let j = 0; j < polyLines.length; j++) {
            polyLines[j].setMap(null);
          }
        }
      }
    }
    let element = <HTMLInputElement>document.getElementById("chk" + value);
    if (value == "Show All") {
      if (element.checked == false) {
        for (let i = 0; i < this.zoneList.length; i++) {
          let element = <HTMLInputElement>document.getElementById("chk" + this.zoneList[i]["zoneNo"].trim());
          element.checked = false;
        }
      }
      else {
        this.showLoader();
        for (let i = 0; i < this.zoneList.length; i++) {
          let element = <HTMLInputElement>document.getElementById("chk" + this.zoneList[i]["zoneNo"].trim());
          element.checked = true;
        }
        $("#divVehicleMovement").hide();
        if (this.zoneList.length > 0) {
          for (let i = 1; i < this.zoneList.length; i++) {
            this.getWardBoundaries(this.zoneList[i]["zoneNo"]);
            this.getRouteLines(this.zoneList[i]["zoneNo"]);
            this.getDutyOnOffTime(this.zoneList[i]["zoneNo"]);
          }
        }
      }
    }
    else {
      this.showLoader();
      let routeCount = this.zoneList.length - 1;
      let checkedCount = 0;
      for (let i = 1; i < this.zoneList.length; i++) {
        let element = <HTMLInputElement>document.getElementById("chk" + this.zoneList[i]["zoneNo"].trim());
        if (element.checked == true) {
          checkedCount++;
          $("#divVehicleMovement").hide();
          this.getWardBoundaries(this.zoneList[i]["zoneNo"].trim());
          this.getRouteLines(this.zoneList[i]["zoneNo"].trim());
          this.getDutyOnOffTime(this.zoneList[i]["zoneNo"].trim());
        }
      }
      let element = <HTMLInputElement>document.getElementById("chk" + this.zoneList[0]["zoneNo"].trim());
      if (checkedCount == routeCount) {
        element.checked = true;
      }
      else {
        element.checked = false;
      }
    }
  }

  setDate(filterVal: any, type: string) {
    //if (this.isStart == true) {
    this.setDefaultVechileMovement();
    this.clearAllInstance();
    //}
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
      this.showLoader();
      // this.selectedDate = filterVal; 
      this.setMapOnAll();
      if (this.routePathStore.length > 0) {
        for (let i = 0; i < this.routePathStore.length; i++) {
          let polyLines = this.routePathStore[i]["polyLines"];
          if (polyLines.length > 0) {
            for (let j = 0; j < polyLines.length; j++) {
              polyLines[j].setMap(null);
            }
          }
        }
      }
      this.routePathStore = [];

      if (this.selectedWard != "0" && this.selectedZone != "Show All") {
        this.changeZoneSelection(this.selectedZone);
      }
      else if (this.selectedWard != "0") {
        this.changeWardSelection(this.selectedWard);
      }
    }
    else {
      $('#txtDate').val(this.toDayDate);
      this.commonService.setAlertMessage("error", "Selected date is greater then today date.");
    }
  }

  getDutyOnOffTime(zoneNo: any) {
    if (this.selectedDate == this.commonService.setTodayDate()) {
      let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
      let year = this.selectedDate.split("-")[0];
      let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/Summary/dutyOutTime";
      let dutyOffInstance = this.db.object(dbPath).valueChanges().subscribe(dutyOffTime => {
        this.instancesList.push({ instances: dutyOffInstance });
        if (dutyOffTime != null) {
          dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/Summary/dutyInTime";
          let dutyInTimeInstance = this.db.object(dbPath).valueChanges().subscribe(dutyInTime => {
            dutyInTimeInstance.unsubscribe();
            if (dutyInTime != null) {
              if (dutyInTime.toString().split(",").length != dutyOffTime.toString().split(",").length) {
                this.getRunningVehicle(zoneNo);
              }
              else {
                let detail = this.zoneList.find(item => item.zoneNo == zoneNo);
                if (detail != undefined) {
                  detail.dutyOff = "(Duty Off)";
                  this.clearVehicleMarker(zoneNo);
                }
              }
            }
          });
        }
        else {
          this.getRunningVehicle(zoneNo);
        }
      })
    }
  }

  getRunningVehicle(zoneNo: any) {
    if (this.selectedDate == this.commonService.setTodayDate()) {
      let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
      let year = this.selectedDate.split("-")[0];
      let dbPathVehicle = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/vehicle";
      let vehicleInstance = this.db.object(dbPathVehicle).valueChanges().subscribe(vehicleData => {
        vehicleInstance.unsubscribe();
        if (vehicleData != null) {
          let vehicle = vehicleData.toString().split(",")[vehicleData.toString().split(",").length - 1];
          let dbPath = "CurrentLocationInfo/" + zoneNo + "/latLng";
          let vehicleLocationInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
            this.instancesList.push({ instances: vehicleLocationInstance });
            if (data != undefined) {
              let isShow = false;
              let detail = this.zoneList.find(item => item.zoneNo == zoneNo);
              if (detail != undefined) {
                if (detail.dutyOff != "(Duty Off)") {
                  isShow = true;
                }
              }

              if (isShow == true) {
                dbPath = "RealTimeDetails/WardDetails/" + zoneNo + "/activityStatus";
                let vehicleStatusInstance = this.db.object(dbPath).valueChanges().subscribe((vehicleStatusData) => {
                  vehicleStatusInstance.unsubscribe();
                  if (data != null) {

                    let location = data.toString().split(",");
                    let lat = Number(location[0]);
                    let lng = Number(location[1]);
                    let marker = new google.maps.Marker({
                      position: { lat: Number(lat), lng: Number(lng) },
                      map: this.map,
                      icon: this.getVehicleIcon(vehicleStatusData.toString(), vehicle)
                    });
                    let marker1 = new google.maps.Marker({
                      position: { lat: Number(lat), lng: Number(lng) },
                      map: this.map,
                      label: {
                        text: " " + zoneNo + " ",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold",
                      },
                      icon: {
                        url: this.wardNoUrl,
                        size: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(15, 57),
                        labelOrigin: new google.maps.Point(20, 15)
                      }
                    });

                    if (this.vehicleMarkerList.length > 0) {
                      let detail = this.vehicleMarkerList.find(item => item.zoneNo == zoneNo);
                      if (detail != undefined) {
                        detail.marker.setMap(null);
                        detail.marker1.setMap(null);
                        detail.marker = marker;
                        detail.marker1 = marker1;
                      }
                      else {
                        this.vehicleMarkerList.push({ zoneNo, marker, marker1 });
                      }
                    }
                    else {
                      this.vehicleMarkerList.push({ zoneNo, marker, marker1 });
                    }
                  }
                });
              }

            }
          });
        }
      });
    }
  }


  getVehicleIcon(vehicleStatus: any, vehicle: any) {
    let vehicleIcon = this.vehicleRunningTipperUrl;
    if (vehicle.includes("TRACTOR")) {
      vehicleIcon = this.vehicleRunningTractorUrl;
      if (vehicleStatus.toString() == "completed") {
        vehicleIcon = this.vehicleCompletedTractorUrl;
      } else if (vehicleStatus.toString() == "stopped") {
        vehicleIcon = this.vehicleStopedTractorUrl;
      }
    }
    else {
      if (vehicleStatus.toString() == "completed") {
        vehicleIcon = this.vehicleCompletedTipperUrl;
      } else if (vehicleStatus.toString() == "stopped") {
        vehicleIcon = this.vehicleStopedTipperUrl;
      }
    }
    return vehicleIcon;
  }

  showRoute() {

  }

  getRouteLines(zoneNo: any) {
    this.commonService.getWardLine(zoneNo, this.selectedDate).then((linesData: any) => {
      let wardLinesDataObj = JSON.parse(linesData);
      let keyArray = Object.keys(wardLinesDataObj);
      for (let i = 0; i < keyArray.length - 3; i++) {
        let lineNo = Number(keyArray[i]);
        let points = wardLinesDataObj[lineNo]["points"];
        var latLng = [];

        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
          if (i == 0 && j == 0) {
            this.setWardStartEndMarker(points[j][0], points[j][1], this.wardStartUrl);
          }
          if (i == (keyArray.length - 4) && j == (points.length - 1)) {
            this.setWardStartEndMarker(points[j][0], points[j][1], this.wardEndUrl);
          }
        }

        this.lineList.push({
          lineNo: lineNo,
          latlng: latLng,
          color: "#60c2ff",
          lineStatus: "",
          zoneNo: zoneNo
        });
      }

      let routeLineList = this.lineList.filter(item => item.zoneNo == zoneNo);
      if (routeLineList.length > 0) {
        for (let i = 0; i < routeLineList.length; i++) {
          this.plotLineOnMap(routeLineList[i]["lineNo"], routeLineList[i]["latlng"], i, zoneNo);
        }
      }
      this.showHideLineNo();
    }, error => {
    });

  }


  setWardStartEndMarker(lat: any, lng: any, iconPath: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: iconPath,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(32, 40),
        origin: new google.maps.Point(0, 0),
      },
    });
    this.wardStartEndMarkerList.push({ marker });
  }


  clearZoneLines() {
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != null) {
          this.polylines[i].setMap(null);
        }
      }
      this.polylines = [];
    }
    if (this.wardStartEndMarkerList.length > 0) {
      for (let i = 0; i < this.wardStartEndMarkerList.length; i++) {
        if (this.wardStartEndMarkerList[i] != null) {
          this.wardStartEndMarkerList[i]["marker"].setMap(null);
        }
      }
      this.wardStartEndMarkerList = [];
    }
    if (this.vehicleMarkerList.length > 0) {
      for (let i = 0; i < this.vehicleMarkerList.length; i++) {
        if (this.vehicleMarkerList[i] != null) {
          this.vehicleMarkerList[i]["marker"].setMap(null);
          this.vehicleMarkerList[i]["marker1"].setMap(null);
        }
      }
      this.vehicleMarkerList = [];
    }
    if (this.lineMarkerList.length > 0) {
      for (let i = 0; i < this.lineMarkerList.length; i++) {
        if (this.lineMarkerList[i]["marker"] != null) {
          this.lineMarkerList[i]["marker"].setMap(null);
        }
      }
      this.lineMarkerList = [];
    }
  }

  clearVehicleMarker(zoneNo: any) {
    let detail = this.vehicleMarkerList.find(item => item.zoneNo == zoneNo);
    if (detail != undefined) {
      detail.marker.setMap(null);
      detail.marker1.setMap(null);
    }
  }


  plotLineOnMap(lineNo: any, latlng: any, index: any, zoneNo: any) {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPathLineStatus = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatusInstance = this.db.object(dbPathLineStatus).valueChanges().subscribe((lineStatus) => {
      this.instancesList.push({ instances: lineStatusInstance });
      let strokeColor = this.commonService.getLineColor(null);
      if (lineStatus != null) {
        strokeColor = this.commonService.getLineColor(lineStatus);
      }
      const iconsetngs = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
      };
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: strokeColor,
        strokeWeight: 2,
        icons: [{
          icon: iconsetngs,
          repeat: "60px",
          offset: '100%'
        }]
      });
      if (this.polylines.length != 0) {
        index = this.polylines.length;
      }
      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }
      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);
    });
  }


  showHideLineNo() {    
    this.clearLineNoMarker();
    if ((<HTMLInputElement>document.getElementById(this.chkIsShowLineNo)).checked == true) {
      for (let i = 1; i < this.zoneList.length; i++) {
        if ((<HTMLInputElement>document.getElementById('chk' + this.zoneList[i]["zoneNo"])).checked == true) {
          let routeLineList = this.lineList.filter(item => item.zoneNo == this.zoneList[i]["zoneNo"]);
          if (routeLineList.length > 0) {
              for (let j = 0; j < routeLineList.length; j++) {
                let lineNo = routeLineList[j]["lineNo"];
                let latlng = routeLineList[j]["latlng"];
                let lat = latlng[0]["lat"];
                let lng = latlng[0]["lng"];
                this.setLineNoMarker(lineNo, lat, lng);
            }
          }
        }
      }
    }
  }

  clearLineNoMarker() {
    if (this.lineMarkerList.length > 0) {
      for (let i = 0; i < this.lineMarkerList.length; i++) {
        if (this.lineMarkerList[i]["marker"] != null) {
          this.lineMarkerList[i]["marker"].setMap(null);
        }
      }
      this.lineMarkerList = [];
    }
  }

  setLineNoMarker(lineNo: any, lat: any, lng: any) {
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
        fontSize: "13px",
        fontWeight: "bold",
      },
    });
    this.lineMarkerList.push({ marker });
  }

  getVehicleRoute(zoneNo: any) {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    this.getDutyInOutTime(zoneNo, year, monthName, this.selectedDate).then((response) => {
      let dutyOnOffList = JSON.parse(JSON.stringify(response));
      if (dutyOnOffList.length > 0) {
        let dbPath = "LocationHistory/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
        let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
          routePath => {
            vehicleTracking.unsubscribe();
            if (routePath != null) {
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

              let list = [];

              let dutyInTime = dutyOnOffList[0]["inTime"];
              let dutyOutTime = dutyOnOffList[dutyOnOffList.length - 1]["outTime"];
              let dutyInDateTime = new Date(this.selectedDate + " " + dutyInTime);
              let dutyOutDateTime = new Date(this.selectedDate + " " + dutyOutTime);

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
                  if (Number(routePath[index]["distance-in-meter"]) > 0) {
                    let routeDateTime = new Date(this.selectedDate + " " + time);
                    if (routeDateTime >= dutyInDateTime && routeDateTime <= dutyOutDateTime) {
                      let latlng = routePath[index]["lat-lng"] !== undefined ? routePath[index]["lat-lng"].split('~') : [];
                      let newLatLng = "";
                      for (let k = 0; k < latlng.length; k++) {
                        let distanceDetail = this.checkDistance(latlng, k);
                        if (distanceDetail != undefined) {
                          let distance = distanceDetail.distance;
                          if (distance > 0) {
                            if (newLatLng == "") {
                              newLatLng = distanceDetail.latlng;
                            }
                            else {
                              newLatLng = newLatLng + "~" + distanceDetail.latlng;
                            }
                            //list.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });
                          }
                        }
                      }
                      list.push({ distanceinmeter: routePath[index]["distance-in-meter"], latlng: routePath[index]["lat-lng"], time: time });

                    }
                  }
                }
              }
              this.routePathStore.push({ zone: zoneNo, lines: list, polyLines: [] });
              this.showDataOnMap(zoneNo);
            }
          });
      }
    });
  }

  checkDistance(latlng: any, startIndex: any) {
    let distance = 0;
    let newLatLng = "";
    for (let i = startIndex; i < latlng.length - 1; i++) {
      let lat1 = latlng[i].toString().replace("(", "").replace(")", "").split(",")[0];
      let lng1 = latlng[i].toString().replace("(", "").replace(")", "").split(",")[1];
      let lat2 = latlng[i + 1].toString().replace("(", "").replace(")", "").split(",")[0];
      let lng2 = latlng[i + 1].toString().replace("(", "").replace(")", "").split(",")[1];
      let checkDistance = Number(this.getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2));
      if (checkDistance < 10) {
        distance = checkDistance;
        newLatLng = latlng[i];
        i = latlng.length;
      }
    }
    return { distance: distance, latlng: newLatLng };
  }


  getDutyInOutTime(zone: any, year: any, monthName: any, date: any) {
    return new Promise((resolve) => {
      let dutyInOutList = [];
      let dbPath = "WasteCollectionInfo/" + zone + "/" + year + "/" + monthName + "/" + date + "/Summary";
      let dutyInOutInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        dutyInOutInstance.unsubscribe();
        if (data != null) {
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



  showDataOnMap(zoneNo: any) {

    let totalKM = 0;
    let lineData = [];
    let detail = this.routePathStore.find(item => item.zone == zoneNo);
    if (detail != undefined) {
      let list = detail.lines;
      let polylineList = [];
      for (let i = 0; i < list.length; i++) {
        let totalDistance = 0;
        totalKM += parseFloat(parseFloat(list[i]["distanceinmeter"]).toFixed(8));
        if (lineData.length > 0) {
          let lat = lineData[lineData.length - 1]["lat"];
          let lng = lineData[lineData.length - 1]["lng"];
          lineData = [];
          lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        let routeDateList = [];
        let latLong: string = list[i]["latlng"];
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
          let routeColor = this.getRouteColor(0);
          let detail = this.zoneList.find(item => item.zoneNo == zoneNo);
          if (detail != undefined) {
            routeColor = detail.routeColor;
          }
          let line = new google.maps.Polyline({
            path: lineData,
            strokeColor: routeColor,
            strokeWeight: 2
          });

          if (i == 0) {
            let lat = lineData[0]["lat"];
            let lng = lineData[0]["lng"];
            let markerURL = this.getIcon("start");
            var markerLabel = "";
            let contentString = '<br/>Start time: ' + list[i]["time"];
            this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
          }

          if (this.selectedDate != this.toDayDate) {
            if (i == list.length - 1) {
              let lat = lineData[lineData.length - 1]["lat"];
              let lng = lineData[lineData.length - 1]["lng"];
              let markerURL = this.getIcon("stop");
              var markerLabel = "";
              let contentString = '<br/>End time: ' + list[i]["time"];
              this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
            }
          }
          else {
            if (i == list.length - 1) {
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
                      let contentString = '<br/>End time: ' + list[i]["time"];
                      this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
                    }
                  }
                });
            }
          }
          polylineList[i] = line;
          polylineList[i].setMap(this.map);
        }
        detail.polyLines = polylineList;
      }

      if (list.length > 0) {
        let startTime = list[0]["time"];
        let endTime = list[0]["time"];
        if (list.length > 1) {
          endTime = list[list.length - 1]["time"];
        }
        let sTime = this.selectedDate + " " + startTime;
        let eTime = this.selectedDate + " " + endTime;
      }
    }
  }

  getPlayStop() {
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select Route !!!");
      return;
    }
    if (this.isStart == false) {
      $("#timeBox").show();
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
      this.timeInterval = 0;
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
      $('#btnPre').hide();
      $('#btnReset').hide();
      this.isStart = false;
    }
  }

  setDefaultVechileMovement() {
    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').hide();
    $('#btnReset').hide();
    $("#timeBox").hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.isTiming = false;
    this.isPreviousTime = false;
    this.totalTiminingKM = 0;
    //$('#ddlTime').val("0");
    this.trackData.time = "0:00";
  }


  getReset() {
    this.setDefaultVechileMovement();
    this.changeZoneSelection(this.selectedZone);
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

  getRouteDataPreNext(type: any) {
    if (this.timeInterval != 0) {
      // this.setMapOnAll();
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

  getVehicleRouteTime() {
    if (this.routePathStore != null) {
      let detail = this.routePathStore.find(item => item.zone == this.selectedZone);
      if (detail != undefined) {
        let routeList = detail.lines;
        let polylineList = [];
        if (this.timeInterval == 0) {
          this.startTime = 0;
          this.endTime = routeList.length - 1;
        }
        if (this.endTime >= (routeList.length - 1)) {
          this.endTime = routeList.length - 1;
          this.isLast = true;
        }
        else {
          this.isLast = false;
        }
        let totalKM = 0;
        let lineData = [];
        for (let i = 0; i <= this.endTime; i++) {
          totalKM += parseFloat(routeList[i]["distanceinmeter"]);
        }

        for (let i = 0; i <= this.endTime; i++) {
          if (lineData.length > 0) {
            let lat = lineData[lineData.length - 1]["lat"];
            let lng = lineData[lineData.length - 1]["lng"];
            lineData = [];
            lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
          }
          let routeDateList = [];
          let latLong: string = routeList[i]["latlng"];
          routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
          for (let j = 0; j < routeDateList.length; j++) {
            let routePart = routeDateList[j].split(',');
            if (routePart.length == 2) {
              lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
            }
          }
          if (lineData != undefined) {
            if (i == this.startTime) {
              let latLong: string = routeList[0]["latlng"];
              let routeDateListStart = latLong.substring(1, latLong.length - 1).split(')~(');

              let routePartStart = routeDateListStart[0].split(',');
              if (routePartStart.length == 2) {
                let markerURL = this.getIcon("start");
                var markerLabel = "";
                let lat = routePartStart[0];
                let lng = routePartStart[1];
                let contentString = '<br/>Start Time : ' + routeList[i]["time"];
                this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
              }
            }
            if (i == this.endTime) {
              if (this.isStart == false) {
                this.trackData.time = routeList[i]["time"];
              }
              let flowMarkerURL = this.getIcon("stopMarker");
              var flowMarkerLabel = "";
              let lat = lineData[lineData.length - 1]["lat"];
              let lng = lineData[lineData.length - 1]["lng"];
              let contentString = '<br/>Time : ' + routeList[i]["time"];
              this.setMarker(lat, lng, flowMarkerLabel, flowMarkerURL, contentString, "routeMarker");
            }
          }
        }
        if (this.timeInterval == 0) {
          this.startTime = 0;
          this.endTime = null;
        }

        this.lineDataList = [];
        for (let i = 0; i < detail.polyLines.length; i++) {
          let routeDateList = [];
          let latLong: string = routeList[i]["latlng"];
          let time = routeList[i]["time"];
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
        let latLong: string = routeList[routeList.length - 1]["latlng"];
        let endtimes: string = routeList[routeList.length - 1]["time"];

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
  }

  setMapOnAll() {
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
    }
    this.allMarkers = [];
    this.trackData.totalKM = 0;
    this.trackData.totalTime = "0 hr 0 min";
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

  playRoute() {
    //this.setMapOnAll();
    this.timeInterval = 1;
    this.endTime = 0;
    this.getVehicleRouteTime();
    setInterval(() => {
      // this.setMapOnAll();
      this.timeInterval = 1;
      this.endTime = this.endTime + this.timeInterval;
      this.getVehicleRouteTime();
    }, 600);
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

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
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

  getWardBoundaries(zoneNo: any) {
    let polylines = [];
    this.httpService.get("../../assets/jsons/WardBoundries/" + localStorage.getItem("cityName") + "/" + zoneNo + ".json").subscribe(data => {
      if (data != null) {
        //let str = "";
        let points = data["points"];
        if (points.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          var latLng = [];
          for (let j = 0; j < points.length; j++) {
            latLng.push({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
            bounds.extend({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
            // str += points[j][1] + "," + points[j][0] + ",0 ";
          }
          // console.log(str);
          let boundrayColor = "black";
          let detail = this.zoneList.find(item => item.zoneNo == zoneNo);
          if (detail != undefined) {
            boundrayColor = detail.color;
          }
          let line = new google.maps.Polyline({
            path: latLng,
            strokeColor: boundrayColor,
            strokeWeight: 3,
          });
          polylines.push({ line: line, latLng: latLng });
          this.map.fitBounds(bounds);
        }
      }
      polylines[0]["line"].setMap(this.map);
      this.zoneKML.push(polylines);
    });
  }

  getBoundaryColor(index: any) {
    let wardBoundaryColor = "black";
    if (index == 1) {
      wardBoundaryColor = "brown";
    }
    else if (index == 2) {
      wardBoundaryColor = "blue";
    }
    return wardBoundaryColor;
  }


  getRouteColor(index: any) {
    let wardBoundaryColor = "#00f645";
    if (index == 1) {
      wardBoundaryColor = "#026bc4";
    }
    else if (index == 2) {
      wardBoundaryColor = "#03ce8e";
    }
    return wardBoundaryColor;
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

  clearAllInstance() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
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
