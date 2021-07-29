/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireModule } from 'angularfire2';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';
//services
import { CommonService } from '../services/common/common.service';
import { MapService } from '../services/map/map.service';
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})

export class MapsComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public db: AngularFireDatabase, public af: AngularFireModule, public httpService: HttpClient, private actRoute: ActivatedRoute, private mapService: MapService, private commonService: CommonService) { }

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
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  lines: any[] = [];
  lastLineInstance: any;
  workerDetails: any;
  wardLines: any;
  zoneKML: any;
  parhadhouseMarker: any;
  allMatkers: any[] = [];

  progressData: progressDetail =
    {
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
      parshadMobile: ""
    };

  ngOnInit() {
    //this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    let userType = localStorage.getItem('userType');
    if (userType == "External User") {
      $('#isHouse').hide();
      $('#showHouseLabel').hide();
    }
    this.toDayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.toDayDate).getMonth());
    this.setHeight();
    this.getZones().then(() => {
      const id = this.actRoute.snapshot.paramMap.get('id');
      if (id != null) {
        this.selectedZone = id.trim();
        this.activeZone = this.selectedZone;
        this.setMaps();
        this.setKml();
        this.onSubmit();
      }
      else {
        this.selectedZone = this.zoneList[1]["zoneNo"];
        this.activeZone = this.zoneList[1]["zoneNo"];
        this.setMaps();
        this.setKml();
        this.onSubmit();
      }
    });
  }

  getZones() {
    return new Promise(resolve => {
      this.zoneList = [];
      let allZones = this.mapService.getZones(this.toDayDate);
      let getRealTimeWardDetails = this.db.object("RealTimeDetails/WardDetails").valueChanges().subscribe(
        data => {
          getRealTimeWardDetails.unsubscribe();
          for (let index = 1; index < allZones.length; index++) {
            let zoneNo = allZones[index]["zoneNo"];
            let zoneName = allZones[index]["zoneName"];
            let status = data[zoneNo]["activityStatus"];
            let zoneDetails = this.zoneList.find(item => item.zoneNo == zoneNo);
            if (zoneDetails == undefined) {
              if (status != "workNotStarted") {
                this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneName });
              }
            }
          }
          resolve(true);
        });
    });
  }

  getEmployeeData() {
    let workDetailsPath = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.toDayDate + '/WorkerDetails';
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe(
      workerData => {
        workDetails.unsubscribe();
        if (workerData != null) {
          let driverList = workerData["driver"].toString().split(',');
          let helperList = workerData["helper"].toString().split(',');
          let driverId = driverList[driverList.length - 1].trim();
          let helperId = helperList[helperList.length - 1].trim();
          this.getEmployee(driverId, "driver");
          this.getEmployee(helperId, "helper");
        }
      });
  }

  getEmployee(empId: any, empType: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      if (empType == "driver") {
        this.progressData.driverName = employee["name"] != null ? (employee["name"].toUpperCase()) : "Not Assigned";
        this.progressData.driverMobile = employee["mobile"] != null ? (employee["mobile"]) : "---";
        this.progressData.driverImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? (employee["profilePhotoURL"]) : this.defaultImageUrl;
      }
      else {
        this.progressData.helperName = employee["name"] != null ? (employee["name"].toUpperCase()) : "Not Assigned";
        this.progressData.helperMobile = employee["mobile"] != null ? (employee["mobile"]) : "---";
        this.progressData.helperImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? (employee["profilePhotoURL"]) : this.defaultImageUrl;
      }
    });
  }

  getWardTotalLength() {
    let wardLenghtPath = 'WardRouteLength/' + this.selectedZone;
    let wardLengthDetails = this.db.object(wardLenghtPath).valueChanges().subscribe(
      wardLengthData => {
        wardLengthDetails.unsubscribe();
        if (wardLengthData != null) {
          this.progressData.wardLength = (parseFloat(wardLengthData.toString()) / 1000).toFixed(2);
        }
        else {
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
    this.lastLineInstance = this.db.object('WasteCollectionInfo/LastLineCompleted/' + this.selectedZone).valueChanges().subscribe(
      lastLine => {
        if (lastLine != null) {
          this.progressData.currentLine = Number(lastLine) + 1;
        }
      });
    let totalLineData = this.db.object('WardLines/' + this.selectedZone).valueChanges().subscribe(
      totalLines => {
        totalLineData.unsubscribe();
        let workerDetailsdbPath = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.toDayDate + '/Summary';
        this.progressData.totalLines = Number(totalLines);
        this.workerDetails = this.db.object(workerDetailsdbPath).valueChanges().subscribe(
          workerData => {
            if (workerData != null) {
              if (workerData["completedLines"] != null) {
                this.progressData.completedLines = workerData["completedLines"];
              }
              else {
                this.progressData.completedLines = 0;
              }
              if (workerData["skippedLines"] != null) {
                this.progressData.skippedLines = workerData["skippedLines"];
              }
              else {
                this.progressData.skippedLines = 0;
              }
              if (workerData["wardCoveredDistance"] != null) {
                this.progressData.coveredLength = (parseFloat(workerData["wardCoveredDistance"]) / 1000).toFixed(2);
              }
              else {
                this.progressData.coveredLength = "0.00";
              }
            }
          });
      });
  }

  setHeight() {
    $('.navbar-toggler').show();
    $('#divMap').css("height", $(window).height() - 80);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getAllZones();
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



  setKml() {
    this.db.object('Defaults/KmlBoundary/' + this.selectedZone).valueChanges().subscribe(
      wardPath => {
        this.zoneKML = new google.maps.KmlLayer({
          url: wardPath.toString(),
          map: this.map
        });
      });
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.clearAllOnMap();
    this.activeZone = filterVal;
    // this.setMaps();
    this.setKml();
    this.progressData.houses = 0;
    this.progressData.scanedHouses = 0;
    this.onSubmit();
  }

  onSubmit() {
    this.selectedZone = this.activeZone;
    this.polylines = [];
    this.houseMarkerList = [];
    this.houseList = [];
    this.showVehicleMovement();
    this.getAllLinesFromJson();
    this.getProgressDetail();
    this.getEmployeeData();
    this.getWardTotalLength();
    let element = <HTMLInputElement>document.getElementById("isHouse");
    element.checked = false;
    $('#houseCount').hide();
    $('#houseDetail').hide();
    this.getParshadHouse();
  }

  clearAllOnMap() {
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
    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
    }
    if (this.parhadhouseMarker != null) {
      this.parhadhouseMarker.setMap(null);
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
  }

  getAllLinesFromJson() {
    this.lines = [];
    this.polylines = [];
    let wardLineCount = this.db.object('WardLines/' + this.selectedZone + '').valueChanges().subscribe(
      lineCount => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          this.wardLines = Number(lineCount);
          for (let i = 1; i < Number(lineCount); i++) {
            let wardLines = this.db.list('Defaults/WardLines/' + this.selectedZone + '/' + i + '/points').valueChanges().subscribe(
              zoneData => {
                wardLines.unsubscribe();
                if (zoneData.length > 0) {
                  let lineData = zoneData;
                  var latLng = [];
                  for (let j = 0; j < lineData.length; j++) {
                    latLng.push({ lat: lineData[j][0], lng: lineData[j][1] });
                  }
                  this.lines.push({ lineNo: i, latlng: latLng, color: "#87CEFA" });
                  this.plotLineOnMap(i, latLng, (i - 1), this.selectedZone);
                }
              });
          }
        }
      }
    );
    setTimeout(() => {
      if (this.lines.length > 0) {
        let latLngArray = [];
        latLngArray = this.lines[0]["latlng"];
        let lat = latLngArray[0]["lat"];
        let lng = latLngArray[0]["lng"];
        this.setMarker(lat, lng, this.wardStartUrl, null, "Ward Start", "ward");

        latLngArray = this.lines[this.lines.length - 1]["latlng"];
        lat = latLngArray[latLngArray.length - 1]["lat"];
        lng = latLngArray[latLngArray.length - 1]["lng"];
        this.setMarker(lat, lng, this.wardEndUrl, null, "Ward End", "ward");
      }
    }, 1000);
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    let dbPathLineStatus = 'WasteCollectionInfo/' + wardNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.toDayDate + '/LineStatus/' + lineNo + '/Status';
    let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe(
      status => {

        if (wardNo == this.selectedZone) {

          if (this.polylines[index] != undefined) {
            this.polylines[index].setMap(null);
          }
          let line = new google.maps.Polyline({
            path: latlng,
            strokeColor: this.commonService.getLineColor(status),
            strokeWeight: 2
          });
          this.polylines[index] = line;
          this.polylines[index].setMap(this.map);
          // let checkMarkerDetails = status != null ? true : false;

          // if (status != null || Number(lastLine) == (lineNo - 1)) {
          //   checkMarkerDetails = true;
          //  }

          let userType = localStorage.getItem('userType');
          if (userType == "Internal User") {
            let lat = latlng[0]["lat"];
            let lng = latlng[0]["lng"];
            this.setMarker(lat, lng, this.invisibleImageUrl, lineNo.toString(), "", "lineNo");
          }
        }

      });
  }
  getParshadHouse() {
    this.progressData.parshadName = "";
    this.progressData.parshadMobile = "";
    let dbPath = "Settings/WardSettings/" + this.selectedZone + "/ParshadDetail";
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
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
              scaledSize: new google.maps.Size(45, 30)
            }
          });
        }
      });
  }

  onHouseSubmit() {
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        this.houseMarkerList[i]["marker"].setMap(null);
      }
      this.houseMarkerList = [];
    }
    let element = <HTMLInputElement>document.getElementById("isHouse");
    if (element.checked == true) {
      $('#isHouse').prop("disabled", true);
      $('#houseCount').show();
      $('#houseDetail').hide();
      if (this.houseList.length == 0) {
        let element = <HTMLInputElement>document.getElementById("isHouse");
        if (element.checked == true) {
          $('#isHouse').prop("disabled", true);
          this.getHouses().then(() => {
            $('#isHouse').prop("disabled", false);
          });
        }
      }
      else {
        for (let i = 0; i < this.houseList.length; i++) {
          let imgUrl = "../assets/img/" + this.houseList[i]["markerType"] + "-home.png";
          // if (this.houseList[i]["isApproved"] == "yes") {
          //   imgUrl = this.approvedHomeLocationURL;
          //  }
          let marker = new google.maps.Marker({
            position: { lat: Number(this.houseList[i]["lat"]), lng: Number(this.houseList[i]["lng"]) },
            map: this.map,
            icon: {
              url: imgUrl,
              fillOpacity: 1,
              strokeWeight: 0,
              scaledSize: new google.maps.Size(20, 19)
            }
          });
          this.houseMarkerList.push({ marker });
          $('#isHouse').prop("disabled", false);
        }
      }
    }
    else {
      $('#isHouse').prop("disabled", false);
      $('#houseCount').hide();
      $('#houseDetail').hide();
      if (this.houseMarkerList.length > 0) {
        for (let i = 0; i < this.houseMarkerList.length; i++) {
          this.houseMarkerList[i]["marker"].setMap(null);
        }
        this.houseMarkerList = [];
      }
    }
  }

  showVehicleMovement() {
    if (this.vehicleLocationInstance != undefined) {
      this.vehicleLocationInstance.unsubscribe();
    }
    let dbPath = "CurrentLocationInfo/" + this.selectedZone + "/latLng";
    this.vehicleLocationInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        if (data != undefined) {
          dbPath = "RealTimeDetails/WardDetails/" + this.selectedZone + "/activityStatus";
          let statusInstance = this.db.object(dbPath).valueChanges().subscribe(
            statusData => {
              statusInstance.unsubscribe();
              let statusId = statusData.toString();
              let vehicleIcon = '../assets/img/tipper-green.png';
              if (statusId == 'completed') {
                vehicleIcon = '../assets/img/tipper-gray.png';
              } else if (statusId == 'stopped') {
                vehicleIcon = '../assets/img/tipper-red.png';
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


  setMarker(lat: any, lng: any, markerURL: any, markerLabel: any, contentString: any, type: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(32, 40),
        origin: new google.maps.Point(0, 0)
      },
      label: {
        text: markerLabel,
        color: '#000',
        fontSize: '10px',
        fontWeight: "bold"
      }
    });
    if (type == "ward") {
      let infowindow = new google.maps.InfoWindow({
        content: contentString
      });
      marker.addListener('click', function () {
        infowindow.open(this.map, marker);
      });
    }
    this.allMatkers.push({ marker });
  }

  getHouses() {
    return new Promise(resolve => {
      this.houseList = [];
      this.progressData.houses = 0;
      this.progressData.scanedHouses = 0;
      for (let i = 1; i <= this.wardLines; i++) {
        let housePath = "Houses/" + this.selectedZone + "/" + i;
        let object = this.db.database.ref(housePath).child('key');


        let houseInstance = this.db.list(housePath).valueChanges().subscribe(
          houseData => {
            houseInstance.unsubscribe();
            if (houseData.length > 0) {
              for (let j = 0; j < houseData.length; j++) {
                let lat = houseData[j]["latLng"].replace("(", "").replace(")", "").split(',')[0];
                let lng = houseData[j]["latLng"].replace("(", "").replace(")", "").split(',')[1];
                let cardNo = houseData[j]["cardNo"];
                let rfId=houseData[j]["rfid"];
                let isApproved = "no";
                if (houseData[j]["isApproved"] != null) {
                  if (houseData[j]["isApproved"] == "yes") {
                    isApproved = "yes"
                  }
                }
                let markerType = "red";
                /*
                if (houseData[j]["phaseNo"] == "1") {
                  markerType = "blue";
                  if (isApproved == "yes") {
                    markerType = "purple"
                  }
                }
                else {
                  if (isApproved == "yes") {
                    markerType = "yellow";
                  }
                }
                */

                this.houseList.push({ markerType: markerType, lat: lat, lng: lng, cardNo: cardNo, isApproved: isApproved });
                this.progressData.houses = Number(this.progressData.houses) + 1;
                let scanCardPath = 'HousesCollectionInfo/' + this.selectedZone + '/' + this.toDayDate + '/' + i + "/" + rfId + "/scan-time";
                let scanInfo = this.db.object(scanCardPath).valueChanges().subscribe(
                  scanTime => {

                    scanInfo.unsubscribe();
                    if (scanTime != null) {
                      this.progressData.scanedHouses = Number(this.progressData.scanedHouses) + 1;
                      let houseDetails = this.houseList.find(item => item.cardNo == cardNo);
                      if (houseDetails != undefined) {
                        houseDetails.markerType = "green";
                        this.plotHouses(houseDetails.markerType, houseDetails.lat, houseDetails.lng, isApproved);
                      }
                    }
                    else {
                      let houseDetails = this.houseList.find(item => item.cardNo == cardNo);

                      if (houseDetails != undefined) {
                        this.plotHouses(houseDetails.markerType, houseDetails.lat, houseDetails.lng, isApproved);
                      }
                    }
                  });
              }
            }
          }
        );
      }
      resolve(true);
    });
  }

  plotHouses(markerType: string, lat: any, lng: any, isApproved: any) {


    let element = <HTMLInputElement>document.getElementById("isHouse");
    if (element.checked == true) {
      let imgUrl = "../assets/img/" + markerType + "-home.png";
      // if (isApproved == "yes") {
      //   imgUrl = this.approvedHomeLocationURL;
      //  }
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
        icon: {
          url: imgUrl,
          fillOpacity: 1,
          strokeWeight: 0,
          scaledSize: new google.maps.Size(16, 15)
        }
      });
      this.houseMarkerList.push({ marker });
    }
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
}