
/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from '@angular/core';
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-fleet-monitor',
  templateUrl: './fleet-monitor.component.html',
  styleUrls: ['./fleet-monitor.component.scss']
})

export class FleetMonitorComponent {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;
  db: any;
  public bounds: any;
  zoneList: any[];
  todayDate: any;
  wardForWeightageList: any[];
  currentMonthName: any;
  currentYear: any;
  cityName: any;
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
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.getWardForLineWeitage();
    this.wardForWeightageList = [];
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.todayDate.toString().split('-')[1]) - 1);
    this.setHeight();
    this.getZones();
    this.setMap();
  }

  getWardForLineWeitage() {
    this.commonService.getWardForLineWeitage().then((wardForWeightageList: any) => {
      this.wardForWeightageList = wardForWeightageList;
    });
  }

  setHeight() {
    $('.navbar-toggler').show();
    $('#divMap').css("height", $(window).height() - 80);
  }

  setMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  getZones() {
    this.zoneList = [];
    let allZones = JSON.parse(localStorage.getItem("latest-zones"));
    for (let index = 0; index < allZones.length; index++) {
      let dbPathLineCompleted = 'WasteCollectionInfo/' + allZones[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/LineStatus';
      let lineStatusInstance = this.db.object(dbPathLineCompleted).valueChanges().subscribe(
        lineStatusData => {
          lineStatusInstance.unsubscribe();
          if (lineStatusData != null) {
            this.zoneList.push({ zoneNo: allZones[index]["zoneNo"], zoneName: allZones[index]["zoneName"], totalLines: 0, lineWeightageList: [], lineStatusData: lineStatusData, driverName: "", driverMobile: "", helperName: "", vehicle: "", driverId: 0, helperId: 0,driverImageUrl:"",helperImageUrl:"" });
            this.getWardWorkProgressDetails(allZones[index]["zoneNo"]);
          }
        });
    }
  }

  getWardWorkProgressDetails(zoneNo: any) {
    this.bounds = new google.maps.LatLngBounds();
    let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
    if (zoneDetail != undefined) {
      let wardDetail = this.wardForWeightageList.find(item => item.zoneNo == zoneNo);
      if (wardDetail != undefined) {
        this.commonService.getWardLineWeightage(zoneNo, this.todayDate).then((lineWeightageList: any) => {
          zoneDetail.totalLines = Number(lineWeightageList[lineWeightageList.length - 1]["totalLines"]);
          zoneDetail.lineWeightageList = lineWeightageList;
          this.getWorkerDetail(zoneNo, true);
        });
      }
      else {
        this.commonService.getWardLine(zoneNo, this.todayDate).then((lineData: any) => {
          let wardLines = JSON.parse(lineData);
          zoneDetail.totalLines = Number(wardLines["totalLines"]);
          this.getWorkerDetail(zoneNo, false);
        });
      }
    }
  }

  getWorkerDetail(zoneNo: any, isWardLignWeightage: any) {
    let workerDetailsdbPath = 'WasteCollectionInfo/' + zoneNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/WorkerDetails';
    let workerDetailsInstance = this.db.object(workerDetailsdbPath).valueChanges().subscribe(
      workerData => {
        workerDetailsInstance.unsubscribe();
        if (workerData != null) {
          let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
          if (zoneDetail != undefined) {
            let vehicleList = workerData["vehicle"].split(',');
            let driverIdList = workerData["driver"].split(',');
            let helperIdList = workerData["helper"].split(',');
            zoneDetail.vehicle = vehicleList[vehicleList.length - 1];
            zoneDetail.driverId = driverIdList[driverIdList.length - 1];
            zoneDetail.helperId = helperIdList[helperIdList.length - 1];
            this.getDriverHelperDetail(zoneDetail, zoneDetail.driverId, "driver");
            this.getDriverHelperDetail(zoneDetail, zoneDetail.helperId, "helper");
            if (isWardLignWeightage == false) {
              this.getLineStatus(zoneNo);
            }
            else {
              this.getLineStatusForLineWeightage(zoneNo);
            }
          }
        }
      });
  }
  
  getDriverHelperDetail(zoneDetail: any, empId: any, type: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      if (type == "driver") {
        zoneDetail.driverName = (employee["name"]).toUpperCase();
        zoneDetail.driverMobile = employee["mobile"];
        zoneDetail.driverImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? (employee["profilePhotoURL"]) : "../../assets/img/internal-user.png";
      }
      else {
        zoneDetail.helperName = (employee["name"]).toUpperCase();
        zoneDetail.helperMobile = employee["mobile"];
        zoneDetail.helperImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? (employee["profilePhotoURL"]) : "../../assets/img/internal-user.png";
      }
    });
  }

  getLineStatusForLineWeightage(zoneNo: string) {
    let percentage = 0;
    let skippedLines = 0;
    let skippedPercentage = 0;
    let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
    if (zoneDetail != undefined) {
      let lineStatusData = zoneDetail.lineStatusData;
      let lineWeightageList = zoneDetail.lineWeightageList;
      let keyArray = Object.keys(lineStatusData);
      if (keyArray.length > 0) {
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          if (lineStatusData[lineNo]["Status"] == "LineCompleted") {
            let lineWeight = 1;
            let lineWeightDetail = lineWeightageList.find(item => item.lineNo == lineNo);
            if (lineWeightDetail != undefined) {
              lineWeight = Number(lineWeightDetail.weightage);
              percentage += (100 / Number(zoneDetail.totalLines)) * lineWeight;
            }
          }
          else if (lineStatusData[lineNo]["lineStatus"] == "Skipped") {
            skippedLines++;
          }
        }
      }
      if (skippedLines > 0) {
        skippedPercentage = 100 - ((skippedLines / Number(zoneDetail.totalLines)) * 100);
        if (percentage > skippedPercentage) {
          percentage = skippedPercentage;
        }
      }
      if (percentage > 100) {
        percentage = 100;
      }
      this.showVehicle(zoneNo, percentage.toFixed(0));
    }
  }

  getLineStatus(zoneNo: string) {
    let completedCount = 0;
    let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
    if (zoneDetail != undefined) {
      let lineStatusData = zoneDetail.lineStatusData;
      let keyArray = Object.keys(lineStatusData);
      if (keyArray.length > 0) {
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          if (lineStatusData[lineNo]["Status"] == "LineCompleted") {
            completedCount++;
          }
        }
      }
      let workPercentage = Number((completedCount / Number(zoneDetail.totalLines)) * 100).toFixed(0);
      this.showVehicle(zoneNo, workPercentage);
    }
  }

  showVehicle(zoneNo: string, workPercentage: any) {
    let currentLocationPath = "CurrentLocationInfo/" + zoneNo + "/latLng";
    let vehicleLocation = this.db.object(currentLocationPath).valueChanges().subscribe(
      locationData => {
        vehicleLocation.unsubscribe();
        let cureentStatusDPath = 'RealTimeDetails/WardDetails/' + zoneNo + '/activityStatus';
        let currentStatusInstance = this.db.object(cureentStatusDPath).valueChanges().subscribe(
          statusId => {
            currentStatusInstance.unsubscribe();
            let vehiclePath = '../assets/img/tipper-green.png';
            if (statusId == 'completed') {
              vehiclePath = '../assets/img/tipper-gray.png';
            } else if (statusId == 'stopped') {
              vehiclePath = '../assets/img/tipper-red.png';
            }

            if (statusId != "completed") {
              let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
              let dbPath = "DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.todayDate + "/" + zoneDetail.driverId;
              let dailyWorkInstance = this.db.object(dbPath).valueChanges().subscribe(
                dailyWorkData => {
                  dailyWorkInstance.unsubscribe();
                  if (dailyWorkData != null) {
                    for (let i = 5; i >= 1; i--) {
                      if (dailyWorkData["task" + i] != null) {
                        if (dailyWorkData["task" + i]["task"] == zoneNo) {
                          let obj = dailyWorkData["task" + i]["in-out"];
                          let valueArray = Object.values(obj);
                          if (valueArray[valueArray.length - 1] == "Out") {
                            vehiclePath = '../assets/img/tipper-gray.png';
                          }
                          i = 0;
                        }
                      }
                    }
                    let location = locationData.toString().split(",");
                    let marker = new google.maps.Marker({
                      position: { lat: Number(location[0]), lng: Number(location[1]) },
                      map: this.map,
                      icon: vehiclePath,
                    });
                    this.bounds.extend({ lat: Number(location[0]), lng: Number(location[1]) });
                    let statusString = '<div style="width: 100px;background-color: white;float: left;">';
                    statusString += '<div style="background:green;float: left;color:white;width: ' + workPercentage + '%;text-align:center;font-size:12px;"> ' + workPercentage + '%';
                    statusString += '</div></div>';
                    var infowindow = new google.maps.InfoWindow({
                      content: statusString,
                    });

                    infowindow.open(this.map, marker);

                    let wardString = '<div style="min-height: 35px;min-width: 35px;text-align: center;background: #fc6b03;color: white;'
                    wardString += 'font-size: 14px;font-weight: bold;padding:2px">' + zoneNo.replace("mkt", "Market ") + '</div>';
                    var infowindow1 = new google.maps.InfoWindow({
                      content: wardString,
                    });

                    infowindow1.open(this.map, marker);

                    setTimeout(function () {
                      $('.gm-ui-hover-effect').css("display", "none");
                      $('.gm-style-iw-c').css("border-radius", "3px").css("padding", "0px").css("z-index","99");
                      $('.gm-style-iw-d').css("overflow", "unset");
                    }, 300);

                    let details = this.workerDetails;
                    let cityName=this.cityName;
                    marker.addListener('click', function () {
                      if(zoneNo.includes('(')){
                        zoneNo=zoneNo.toString().replace("(","~").replace(")","");
                      }
                      details.wardMonitorUrl = "/" + cityName + "/ward-work-tracking/" + zoneNo;
                      details.driverName = zoneDetail.driverName;
                      details.helperName = zoneDetail.helperName;
                      details.vehicleNo = zoneDetail.vehicle;
                      details.driverImageUrl=zoneDetail.driverImageUrl;
                      details.helperImageUrl=zoneDetail.helperImageUrl;
                      details.driverMobile=zoneDetail.driverMobile;
                      details.helperMobile=zoneDetail.helperMobile;
                      $('#helperMsgD').hide();
                      $('#helperMsgM').hide();
                      $('#detailD').show();
                    });
                    this.map.fitBounds(this.bounds);
                  }
                }
              );
            }
          });
      });
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