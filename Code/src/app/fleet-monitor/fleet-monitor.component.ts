
/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { HttpClient } from '@angular/common/http';

//services
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";
import { MapService } from '../services/map/map.service';
import * as $ from "jquery";

@Component({
  selector: 'app-fleet-monitor',
  templateUrl: './fleet-monitor.component.html',
  styleUrls: ['./fleet-monitor.component.scss']
})

export class FleetMonitorComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;
  db: any;

  constructor(public fs: FirebaseService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService) { }

  public selectedZone: any;
  public bounds: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  vehicleLocationFirstTime: any;
  polylines = [];
  todayDate: any;
  previousScannedCard: any[];
  todayScannedCard: any[];
  allCards: any[];
  wardIndex: number;
  currentMonthName: any;
  currentYear: any;
  cityName: any;
  instancesList: any[];
  workerDetails: WorkderDetails =
    {
      vehicleNo: '',
      driverName: '',
      driverMobile: '',
      helperName: '',
      helperMobile: '',
      wardMonitorUrl: '',
      driverImageUrl: '../../assets/img/driver.jfif',
      helperImageUrl: '../../assets/img/driver.jfif'
    };

  ngOnInit() {
    this.instancesList = [];
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.cityName = localStorage.getItem('cityName');
    this.todayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.todayDate.toString().split('-')[1]) - 1);
    this.setHeight();
    this.getZoneList();
    this.setMap();
    this.getWardWorkProgressDetails();
  }

  setHeight() {
    $('.navbar-toggler').show();
    $('#divMap').css("height", $(window).height() - 80);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  setMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  getZones() {
    this.zoneList = [];
    this.zoneList.push({ zoneNo: "0", zoneName: "-- Select Zone --" });
    let allZones = this.mapService.getAllZones();
    for (let index = 0; index < allZones.length; index++) {
      let dbPathLineCompleted = 'WasteCollectionInfo/' + allZones[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/LineStatus';
      let zonesData = this.db.object(dbPathLineCompleted).valueChanges().subscribe(
        data => {
          if (data != null) {
            this.zoneList.push({ zoneNo: allZones[index]["zoneNo"], zoneName: allZones[index]["zoneName"] });
          }
          zonesData.unsubscribe();
        });
    }
  }

  getWardWorkProgressDetails() {
    for (let index = 1; index <= this.zoneList.length; index++) {
      if (this.zoneList[index] != undefined) {
        let wardNo = this.zoneList[index].zoneNo;
        let totalLineData = this.db.object('WardLines/' + wardNo).valueChanges().subscribe(
          totalLines => {
            let workerDetailsdbPath = 'WasteCollectionInfo/' + wardNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/WorkerDetails';
            let workerDetails = this.db.list(workerDetailsdbPath).valueChanges().subscribe(
              workerData => {
                this.instancesList.push({ instances: workerDetails });
                if (workerData.length > 0) {
                  this.getLineStatus(wardNo, Number(totalLines));
                  totalLineData.unsubscribe();
                }
              });

          });
      }

    }

  }

  getLineStatus(wardNo: string, totalLines: Number) {
    let dbPath = 'WasteCollectionInfo/' + wardNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/LineStatus';
    let lineStatus = this.db.list(dbPath).valueChanges().subscribe(
      lineStatusData => {
        lineStatus.unsubscribe();
        let completedCount = 0;
        for (let index = 0; index < lineStatusData.length; index++) {
          if (lineStatusData[index]["Status"] == "LineCompleted") {
            completedCount++;
          }
        }
        let workPercentage = Number((completedCount / Number(totalLines)) * 100).toFixed(0);
        this.showVehicle(wardNo, workPercentage);
      });
  }

  showVehicle(wardNo: string, workPercentage: any) {
    this.bounds = new google.maps.LatLngBounds();
    let currentLocationPath = "CurrentLocationInfo/" + wardNo + "/latLng";
    let vehicleLocation = this.db.object(currentLocationPath).valueChanges().subscribe(
      locationData => {
        vehicleLocation.unsubscribe();
        let cureentStatusDPath = 'RealTimeDetails/WardDetails/' + wardNo + '/activityStatus';
        let currentDtatus = this.db.object(cureentStatusDPath).valueChanges().subscribe(
          statusId => {
            this.instancesList.push({ instances: currentDtatus });
            let vehiclePath = '../assets/img/tipper-green.png';
            if (statusId == 'completed') {
              vehiclePath = '../assets/img/tipper-gray.png';
            } else if (statusId == 'stopped') {
              vehiclePath = '../assets/img/tipper-red.png';
            }

            if (statusId != "completed") {
              let driverIdPath = 'WasteCollectionInfo/' + wardNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/WorkerDetails/driver';
              let driver = this.db.object(driverIdPath).valueChanges().subscribe(
                driverId => {
                  this.instancesList.push({ instances: driver });
                  let cardswapentriesPath = 'DailyWorkDetail/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/' + driverId + '/card-swap-entries';
                  let cardSwapEntries = this.db.list(cardswapentriesPath).valueChanges().subscribe(
                    cardSwapEntriesData => {

                      this.instancesList.push({ instances: cardSwapEntries });
                      let cardEntiresArr = cardSwapEntriesData.toString().split(',');

                      if (cardEntiresArr[cardEntiresArr.length - 1] == 'Out') {
                        vehiclePath = '../assets/img/tipper-gray.png';
                      }
                      let location = locationData.toString().split(",");
                      this.marker = new google.maps.Marker({
                        position: { lat: Number(location[0]), lng: Number(location[1]) },
                        map: this.map,
                        icon: vehiclePath,
                      });
                      this.bounds.extend({ lat: Number(location[0]), lng: Number(location[1]) });
                      if (cardEntiresArr[cardEntiresArr.length - 1] == 'In') {
                        let statusString = '<div style="width: 100px;background-color: white;float: left;">';
                        statusString += '<div style="background:green;float: left;color:white;width: ' + workPercentage + '%;text-align:center;font-size:12px;"> ' + workPercentage + '%';
                        statusString += '</div></div>';
                        var infowindow = new google.maps.InfoWindow({
                          content: statusString,
                        });

                        infowindow.open(this.map, this.marker);

                        let wardString = '<div style="min-height: 35px;min-width: 35px;text-align: center;background: #fc6b03;color: white;'
                        wardString += 'font-size: 14px;font-weight: bold;padding:2px">' + wardNo.replace("mkt", "Market ") + '</div>';
                        var infowindow1 = new google.maps.InfoWindow({
                          content: wardString,
                        });

                        infowindow1.open(this.map, this.marker);

                        setTimeout(function () {
                          $('.gm-ui-hover-effect').css("display", "none");
                          $('.gm-style-iw-c').css("border-radius", "3px").css("padding", "0px");
                          $('.gm-style-iw-d').css("overflow", "unset");
                          //$('.gm-style-iw-t::after').css("background", "green").css("z-index","-1");
                          //vehicleLocation.unsubscribe();
                        }, 300);

                        let todayDate = this.todayDate;
                        let currentYear = this.currentYear;
                        let currentMonthName = this.currentMonthName;

                        let dbPath = this.db
                        let details = this.workerDetails;
                        let commonService = this.commonService;

                        this.marker.addListener('click', function () {
                          let myFirebase = this.firebase;

                          let workDetailsPath = 'WasteCollectionInfo/' + wardNo + '/' + currentYear + '/' + currentMonthName + '/' + todayDate + '/WorkerDetails';

                          let workDetails = dbPath.object(workDetailsPath).valueChanges().subscribe(
                            workerData => {
                              workDetails.unsubscribe();
                              details.vehicleNo = workerData["vehicle"];
                              this.cityName = localStorage.getItem('cityName');
                              details.wardMonitorUrl = "/" + this.cityName + "/maps/" + wardNo;
                              // details.wardMonitorUrl = "maps/" + wardNo;
                              $('#helperMsgD').hide();
                              $('#helperMsgM').hide();
                              $('#detailD').show();

                              commonService.getEmplyeeDetailByEmployeeId(workerData["driver"]).then((employee) => {
                                details.driverName = (employee["name"]).toUpperCase();
                                details.driverMobile = employee["mobile"];
                                details.driverImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? (employee["profilePhotoURL"]) : "../../assets/img/internal-user.png";
                                localStorage.setItem('employee', JSON.stringify(this.employeeDetail));
                              });

                              commonService.getEmplyeeDetailByEmployeeId(workerData["helper"]).then((employee) => {
                                details.helperName = (employee["name"]).toUpperCase();
                                details.helperMobile = employee["mobile"];
                                details.helperImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? (employee["profilePhotoURL"]) : "../../assets/img/internal-user.png";
                                localStorage.setItem('employee', JSON.stringify(this.employeeDetail));
                              });

                            });
                        });
                        this.map.fitBounds(this.bounds);
                      }
                    });
                });
            }
          });
      });
  }
  ngOnDestroy() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
      }
    }
  }

}

export class WorkderDetails {
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  driverImageUrl: string;
  helperName: string;
  helperMobile: string;
  helperImageUrl: string;
  wardMonitorUrl: string;
}