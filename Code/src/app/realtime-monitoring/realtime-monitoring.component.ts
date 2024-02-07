/// <reference types="@types/googlemaps" />
import { Component, OnInit, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import * as $ from "jquery";
import { ToastrService } from "ngx-toastr";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserService } from "../services/common/user.service";
import { FirebaseService } from "../firebase.service";
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-realtime-monitoring",
  templateUrl: "./realtime-monitoring.component.html",
  styleUrls: ["./realtime-monitoring.component.scss"],
})
export class RealtimeMonitoringComponent implements OnInit {
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService, public usrService: UserService, private actRoute: ActivatedRoute, private modalService: NgbModal) { }

  db: any;
  public selectedZone: any;
  zoneList: any[] = [];
  toDayDate: any;
  currentMonthName: any;
  currentYear: any;
  assignedWards: any[];
  allZones: any[];
  stoppedWorkingWards: any[];
  activeWards: any[];
  completedWards: any[];
  workNotStartedWards: any[];
  donePercentage: any;
  routePathStore: any[];
  applicationDataList: any[];
  todayHaltList: any[];
  zoneDataList: any[] = [];
  unAssignedVehicle: any[] = [];
  firstData = false;
  wardLineStatusData: any[] = [];
  vehicleStstusList: any[];
  wardForWeightageList: any[] = [];

  // Halt Time
  require: any;
  selectedDate: any;
  haltInfo: any[];
  minHalt: number;
  public bounds: any;
  currentMonth: any;
  selectedDriver: any;
  haltInfoData: any;

  public mapHalt: google.maps.Map;
  haltMarkerList: any[] = [];

  application: any;
  vehicle: any;

  $Key: any;
  userId: any;
  category: any;
  remark: any;
  remarkList: any[] = [];
  fixdGeoLocations: any[] = [];
  wardLineStatus: any;
  wardLineStorage: any[] = [];
  employeeDetail: any[] = [];
  garageDutyList: any[] = [];

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  vehicleLocationFirstTime: any;
  polylines = [];
  previousScannedCard: any[];
  todayScannedCard: any[];
  allCards: any[];
  vehicleLocationInstance: any;
  vehicleStatusInstance: any;
  completedLinesInstance: any;
  zoneKML: any;
  zoneKMLHalt: any;
  allMarkers: any[] = [];
  cityName: any;
  selectedZoneName: any;

  workerDetails: WorkderDetails = {
    speed: "0",
    totalKM: "0",
    totalTime: "0 hr 0 min",
    wardTime: "0 hr 0 min",
    vehicleNo: "",
    driverName: "",
    driverMobile: "",
    helperName: "",
    helperMobile: "",
    wardNo: "",
    wardName: "",
    startTime: "---",
    endTime: "---",
    haltTime: "0:00",
    currentHaltTime: "0:00",
    wardKM: "0",
    driverImageUrl: "../../assets/img/internal-user.png",
    helperImageUrl: "../../assets/img/internal-user.png",
    totalWard: "0",
    completedWard: "0",
    activeWard: "0",
    inActiveWard: "0",
    stopWard: "0",
    totalLines: "0",
    completedLines: "0",
    skippedLines: "0",
    applicationStatus: "---",
    lastUpdateTime: "",
    wardReachTime: "---",
    currentLine: "0",
    vehicleCurrentLocation: "---",
    tripCount: "0",
    totalUnAssignedVehicle: "0",
    peopleAtWork: "0",
    garageWorkDutyCount: "0",
    garageWorkActiveDutyCount: "0",
  };

  // Time Graph

  distance: any[];
  time: any[];

  tempdistance: any[];
  temptime: any[];

  graphData: any[];
  todayDate: any;
  activeZone: any;
  maxDistance: any[];
  days: number;

  graphHeaderData: graphHeaders = {
    date: "",
    workprogress: "0",
  };

  public lineBigDashboardChartType: any;
  public gradientStroke: any;
  public chartColor: any;
  public canvas: any;
  public ctx: any;
  public gradientFill: any;
  public lineBigDashboardChartData: Array<any>;
  public lineBigDashboardChartOptions: any;
  public lineBigDashboardChartLabels: any;
  public lineBigDashboardChartColors: Array<any>;
  public graphMaxValue: number;
  public stepSize: number;

  endInterval: any;
  wardLines: any;
  lastLineDone: any;
  lineStatus: any;
  wardWorkTime: any[];
  totalMinutesInWard: any;
  wardInInfo: any;
  dutyStatusList: any[];
  dutyOnImageList: any[];
  dutyOffImageList: any[];
  instancesList: any[];

  divRemark = "#divRemark";
  dutyDetail = "#dutyDetail";
  vehicleStatusH3 = "#vehicleStatusH3";
  drpRemark = "#drpRemark";
  key = "#key";
  txtRemark = "#txtRemark";
  totalHaltH3 = "#totalHaltH3";
  currentHaltH3 = "#currentHaltH3";
  appStatusH3 = "#appStatusH3";
  txtVehicle = "#txtVehicle";
  serviceName = "realtime-monitoring";

  ngOnInit() {

    this.instancesList = [];
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    let element = <HTMLAnchorElement>(document.getElementById("wardProgressLink"));
    element.href = this.cityName + "/ward-monitoring-report";
    this.bounds = new google.maps.LatLngBounds();
    this.toDayDate = this.commonService.setTodayDate();
    let lineStatusDate = localStorage.getItem("lineStatusDate");
    if (lineStatusDate != null) {
      if (this.toDayDate != lineStatusDate) {
        localStorage.setItem("lineStatusDate", this.toDayDate);
        localStorage.setItem("wardLineStorage", null);
        localStorage.setItem("employeeDetail", null);
      }
    } else {
      localStorage.setItem("lineStatusDate", this.toDayDate);
      localStorage.setItem("wardLineStorage", null);
      localStorage.setItem("employeeDetail", null);
    }

    this.zoneList = [];
    this.firstData = false;
    this.userId = localStorage.getItem("userID");
    this.commonService.savePageLoadHistory("Monitoring", "RealTime", localStorage.getItem("userID"));
    if (localStorage.getItem("userType") == "External User") {
      $(this.divRemark).hide();
    }
    this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.toDayDate.toString().split("-")[1]) - 1);
    this.currentYear = new Date().getFullYear();
    this.allZones = this.mapService.getZones(this.toDayDate);
    this.minHalt = 5;
    this.setMap();
    this.getpeopleAtWork();
    this.getGarageWorkDutyOn();
    if (this.cityName != "wevois-others") {
      this.setWorkNotStarted();
    }
    this.getWardForLineWeitage();
  }

  getWardForLineWeitage() {
    this.commonService.getWardForLineWeitage().then((wardForWeightageList: any) => {
      this.wardForWeightageList = wardForWeightageList;
      this.getWardsStatusWise();
    });
  }

  clearAllOnMap() {

    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
    }
    this.allMarkers = [];
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
  }

  showGraph() {
    this.getWardLineStatus();
    this.getEmployeeData();
  }

  setWorkNotStarted() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "setWorkNotStarted");
    for (let index = 1; index < this.allZones.length; index++) {
      const element = this.allZones[index];
      this.db.list("WasteCollectionInfo/" + element["zoneNo"] + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/WorkerDetails").valueChanges().subscribe((workerData) => {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "setWorkNotStarted", workerData);
        if (workerData.length == 0) {
          this.db.object("RealTimeDetails/WardDetails/" + element["zoneNo"]).set({ activityStatus: "workNotStarted", isOnDuty: "no", });
        }
      });
    }
  }

  showRemark() {
    if (this.unAssignedVehicle.length > 0) {
      for (let i = 0; i < this.unAssignedVehicle.length; i++) {
        let chkId = "chk" + i;
        let txtId = "txtVehicle" + i;
        let checkBoxElement = <HTMLInputElement>document.getElementById(chkId);
        let textBoxElement = <HTMLInputElement>document.getElementById(txtId);
        let className = textBoxElement.className;
        $("#" + txtId).removeClass(className);
        if (checkBoxElement.checked == true) {
          textBoxElement.readOnly = false;
          $("#" + txtId).addClass("remark-active");
        } else {
          textBoxElement.readOnly = true;
          $("#" + txtId).addClass("remark-de-active");
        }
      }
    }
  }

  setWardCompleted() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "setWardCompleted");
    for (let index = 1; index < this.allZones.length; index++) {
      const element = this.allZones[index];
      this.db.object("WasteCollectionInfo/" + element["zoneNo"] + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/Summary/dutyOutTime").valueChanges().subscribe((dutyOutTime) => {
        if (dutyOutTime != undefined) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "setWardCompleted", dutyOutTime);
          this.db.object("RealTimeDetails/WardDetails/" + element["zoneNo"]).set({ activityStatus: "completed", isOnDuty: "no", });
        }
      });
    }
  }

  getWardsStatusWise() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardsStatusWise");
    let getRealTimeWardDetails = this.db.object("RealTimeDetails/WardDetails").valueChanges().subscribe((data) => {
      this.instancesList.push({ instances: getRealTimeWardDetails });
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardsStatusWise", data);
      }
      let activeWard = 0;
      let inActiveWard = 0;
      let stoppedWard = 0;
      let completedWard = 0;
      let totalWard = this.allZones.length - 1;
      for (let index = 1; index < this.allZones.length; index++) {
        let zoneNo = this.allZones[index]["zoneNo"];
        let zoneName = this.allZones[index]["zoneName"].replace("Zone ", "");
        let status = data[zoneNo]["activityStatus"];
        let isMic = "notActive";
        if (data[zoneNo]["micStatus"] != null) {
          if (data[zoneNo]["micStatus"] == "disabled") {
            isMic = "disabled";
          }
        }
        if (this.firstData == false) {
          if (status == "active") {
            activeWard++;
            this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneName, status: "active", shortIndex: index, displayOrder: 2, totalLines: 0, completedLines: 0, skippedLines: 0, workPer: "0%", workPerShow: "0", borderClass: "", bgColor: "white", iconName: "fas fa-caret-right active-ward", progressClass: "progress progress-float", wardKM: "0.00", wardTime: "0.00", dutyOnTime: "---", dutyOffTime: "---", wardReachTime: "---", driverId: "0", helperId: "0", vehicleNo: "", isMic: isMic, lineWeight: [], totalWardLength: 0, currentLine: 0 });
          } else if (status == "stopped") {
            stoppedWard++;
            this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneName, status: "stopped", shortIndex: index, displayOrder: 1, totalLines: 0, completedLines: 0, skippedLines: 0, workPer: "0%", workPerShow: "0", borderClass: "", bgColor: "white", iconName: "fas fa-caret-right stop-indication", progressClass: "progress progress-float", wardKM: "0.00", wardTime: "0.00", dutyOnTime: "---", dutyOffTime: "---", wardReachTime: "---", driverId: "0", helperId: "0", vehicleNo: "", isMic: isMic, lineWeight: [], totalWardLength: 0, currentLine: 0 });
          } else if (status == "completed") {
            completedWard++;
            this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneName, status: "completed", shortIndex: index, displayOrder: 3, totalLines: 0, completedLines: 0, skippedLines: 0, workPer: "0%", workPerShow: "0", borderClass: "", bgColor: "#95e495", iconName: "fas fa-caret-right active-ward", progressClass: "progress progress-float-completed", wardKM: "0.00", wardTime: "0.00", dutyOnTime: "---", dutyOffTime: "---", wardReachTime: "---", driverId: "0", helperId: "0", vehicleNo: "", isMic: isMic, lineWeight: [], totalWardLength: 0, currentLine: 0 });
          } else if ((status = "workNotStarted")) {
            inActiveWard++;
            this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneName, status: "notStarted", shortIndex: index, displayOrder: 4, totalLines: 0, completedLines: 0, skippedLines: 0, workPer: "0%", workPerShow: "0", borderClass: "", bgColor: "rgb(221 225 221)", iconName: "fas fa-caret-right inactive-ward", progressClass: "progress progress-float", wardKM: "0.00", wardTime: "0.00", dutyOnTime: "---", dutyOffTime: "---", wardReachTime: "---", driverId: "0", helperId: "0", vehicleNo: "", isMic: isMic, lineWeight: [], totalWardLength: 0, currentLine: 0 });
          }
        } else {
          let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
          if (zoneDetails != undefined) {
            zoneDetails.zoneNo = zoneNo;
            zoneDetails.zoneName = zoneName;
            zoneDetails.isMic = isMic;

            if (status == "active") {
              activeWard++;
              zoneDetails.status = "active";
              zoneDetails.displayOrder = 2;
              zoneDetails.bgColor = "white";
              zoneDetails.iconName = "fas fa-caret-right active-ward";
              zoneDetails.borderClass = "progress-bar  progress-success";
              zoneDetails.progressClass = "progress progress-float";
            } else if (status == "stopped") {
              stoppedWard++;
              zoneDetails.status = "stopped";
              zoneDetails.displayOrder = 1;
              zoneDetails.bgColor = "white";
              zoneDetails.iconName = "fas fa-caret-right stop-indication";
              zoneDetails.borderClass = "progress-bar  progress-success";
              zoneDetails.progressClass = "progress progress-float";
            } else if (status == "completed") {
              completedWard++;
              zoneDetails.status = "completed";
              zoneDetails.displayOrder = 3;
              zoneDetails.bgColor = "#95e495";
              zoneDetails.iconName = "fas fa-caret-right active-ward";
              zoneDetails.borderClass = "completed-ward";
              zoneDetails.progressClass = "progress progress-float-completed";
            } else if (status == "workNotStarted") {
              inActiveWard++;
              zoneDetails.status = "notStarted";
              zoneDetails.displayOrder = 4;
              zoneDetails.bgColor = "rgb(221 225 221)";
              zoneDetails.iconName = "fas fa-caret-right inactive-ward";
              zoneDetails.borderClass = "progress-bar  progress-success";
              zoneDetails.progressClass = "progress progress-float";
            }
            if (this.selectedZone == zoneNo) {
              if (zoneDetails.status != "stopped") {
                this.workerDetails.currentHaltTime = "0:00";
              } else {
                if (this.todayHaltList.length > 0) {
                  this.workerDetails.currentHaltTime = this.commonService.getHrs(this.todayHaltList[this.todayHaltList.length - 1]["duration"]);
                }
              }
            }
          }
        }
        this.workerDetails.inActiveWard = inActiveWard.toString();
        this.workerDetails.stopWard = stoppedWard.toString();
        this.workerDetails.activeWard = activeWard.toString();
        this.workerDetails.completedWard = completedWard.toString();
        this.workerDetails.totalWard = totalWard.toString();
        if (this.firstData == false) {
          let wardDetail = this.wardForWeightageList.find(item => item.zoneNo == zoneNo);
          if (wardDetail != undefined) {
            this.commonService.getWardLineWeightage(zoneNo, this.toDayDate).then((lineList: any) => {
              let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
              if (zoneDetails != undefined) {
                zoneDetails.totalLines = Number(lineList[lineList.length - 1]["totalLines"]);
                for (let i = 0; i < lineList.length - 1; i++) {
                  zoneDetails.lineWeight.push({ lineNo: lineList[i]["lineNo"], weightage: lineList[i]["weightage"], lineLength: lineList[i]["lineLength"], lineStatus: "", endTime: 0 });
                }
              }
              this.getWardDetail(zoneNo);
            });
          }
          else {
            this.getWardDetail(zoneNo);
          }
        }
      }

      this.zoneList = this.commonService.transform(this.zoneList, "shortIndex");
      this.zoneList = this.commonService.transform(this.zoneList, "displayOrder");
      if (this.firstData == false) {
        this.selectedZone = this.zoneList[0]["zoneNo"];
        this.selectedZoneName = this.zoneList[0]["zoneName"];
        this.workerDetails.wardNo = this.zoneList[0]["zoneNo"];
        if (this.zoneList[0]["zoneNo"].toString().includes("mkt")) {
          this.workerDetails.wardName = "Market " + this.zoneList[0]["zoneNo"].toString().replace("mkt", "");
        } else {
          this.workerDetails.wardName = "Zone " + this.selectedZoneName;
        }
        this.initGrpahProperties();
        this.initTimeDistance();
        this.drawWorkProgress();
        this.getWardProgress();
        this.getWardLineStatus();
        this.getVehicleStatus();
        this.firstData = true;
      }
    });
  }

  getWardDetail(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardDetail");
    let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/Summary";
    let summaryDataUpate = this.db.object(dbPath).valueChanges().subscribe((summaryData) => {
      if (summaryData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", summaryData);
        this.instancesList.push({ instances: summaryDataUpate });
        let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
        if (zoneDetails != undefined) {
          if (summaryData["workPercentage"] != null) {
            if (zoneDetails.lineWeight.length > 0) {
              this.getWorkPercentage(zoneNo);
            }
            else {
              zoneDetails.workPer = summaryData["workPercentage"] + "%";
              zoneDetails.workPerShow = summaryData["workPercentage"] + " %";
              if (summaryData["completedLines"] != null) {
                zoneDetails.completedLines = summaryData["completedLines"];
              }
              if (summaryData["wardCoveredDistance"] != null) {
                zoneDetails.wardKM = (parseFloat(summaryData["wardCoveredDistance"]) / 1000).toFixed(2);
              }
              this.getCurrentLine(zoneNo);
            }
            if (zoneDetails.status == "completed")
              zoneDetails.borderClass = "completed-ward";
            else zoneDetails.borderClass = "progress-bar  progress-success";
          }
          if (summaryData["dutyInTime"] != null) {
            zoneDetails.dutyOnTime = summaryData["dutyInTime"];
          } else {
            zoneDetails.dutyOnTime = "---";
          }
          if (summaryData["dutyOnImage"] != null) {
            zoneDetails.dutyOnImage = summaryData["dutyOnImage"];
          } else {
            zoneDetails.dutyOnImage = "---";
          }
          if (summaryData["dutyOutTime"] != null) {
            zoneDetails.dutyOffTime = summaryData["dutyOutTime"];
          } else {
            zoneDetails.dutyOffTime = "---";
          }
          if (summaryData["dutyOutImage"] != null) {
            zoneDetails.dutyOffImage = summaryData["dutyOutImage"];
          } else {
            zoneDetails.dutyOffImage = "---";
          }
          if (summaryData["wardReachedOn"] != null) {
            zoneDetails.wardReachTime = this.commonService.tConvert(summaryData["wardReachedOn"]);
          }
          if (summaryData["vehicleCurrentLocation"] != null) {
            zoneDetails.vehicleCurrentLocation =
              summaryData["vehicleCurrentLocation"];
          }
          if (summaryData["trip"] != null) {
            this.getWardTrips(zoneNo);
            //zoneDetails.tripCount = summaryData["trip"];
          }
          if (summaryData["skippedLines"] != null) {
            zoneDetails.skippedLines = summaryData["skippedLines"];
          }
          if (zoneDetails.driverId == "0") {
            dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/WorkerDetails/driver";
            let driverDataInstance = this.db.object(dbPath).valueChanges().subscribe((driverData) => {
              driverDataInstance.unsubscribe();
              if (driverData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", driverData);
                zoneDetails.driverId = driverData;
              }
            });

            dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/WorkerDetails/driverName";
            let driverNameInstance = this.db.object(dbPath).valueChanges().subscribe((driverData) => {
              driverNameInstance.unsubscribe();
              if (driverData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", driverData);
                zoneDetails.driverName = driverData;
              }
            });
          }
          if (zoneDetails.helperId == "0") {
            dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/WorkerDetails/helper";
            let helperDataInstance = this.db.object(dbPath).valueChanges().subscribe((helperData) => {
              helperDataInstance.unsubscribe();
              if (helperData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", helperData);
                zoneDetails.helperId = helperData;
              }
            });
            dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/WorkerDetails/helperName";
            let helperNameInstance = this.db.object(dbPath).valueChanges().subscribe((helperData) => {
              helperNameInstance.unsubscribe();
              if (helperData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", helperData);
                zoneDetails.helperName = helperData;
              }
            });
          }
          if (zoneDetails.vehicleNo == "") {
            dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/WorkerDetails/vehicle";
            let vehicleDataInstance = this.db.object(dbPath).valueChanges().subscribe((vehicleData) => {
              vehicleDataInstance.unsubscribe();
              if (vehicleData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", vehicleData);
                zoneDetails.vehicleNo = vehicleData;
              }
            });
          }
          if (zoneNo == this.selectedZone) {
            if (summaryData["wardReachedOn"] != null) {
              this.workerDetails.wardReachTime = summaryData["wardReachedOn"];
            }
            if (summaryData["trip"] != null) {
              this.workerDetails.tripCount = summaryData["trip"];
            }
            else {
              this.workerDetails.tripCount = "0";
            }
            if (summaryData["completedLines"] != null) {
              this.workerDetails.completedLines = summaryData["completedLines"];
            }
            if (summaryData["skippedLines"] != null) {
              this.workerDetails.skippedLines = summaryData["skippedLines"];
            }
            if (summaryData["vehicleCurrentLocation"] == "Ward In") {
              $(this.vehicleStatusH3).css("color", "green");
            } else {
              $(this.vehicleStatusH3).css("color", "red");
            }
            if (summaryData["wardCoveredDistance"] != null) {
              this.workerDetails.wardKM = (parseFloat(summaryData["wardCoveredDistance"]) / 1000).toFixed(2);
            }
            setTimeout(() => {
              this.getEmployeeData();
            }, 1500);
            this.getDistanceCovered(zoneNo);
            this.showHaltTime();
            this.getWardInTime();
            this.getRemarks(zoneNo);
            this.getTotalTime(zoneNo);
            this.getWardProgress();
            this.getVehicleStatus();
          }
        }
      }
    });
  }

  getWardTrips(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardTrips");
    let dbPath = "WardTrips/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/" + zoneNo;
    let tripInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      tripInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardTrips", data);
        let keyArray = Object.keys(data);
        let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
        if (zoneDetails != undefined) {
          zoneDetails.tripCount = keyArray.length;
          this.workerDetails.tripCount = zoneDetails.tripCount;
        }
      }
    });
  }

  getCurrentLine(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getCurrentLine");
    if (zoneNo == this.selectedZone) {
      let lastLineDone = this.db.object("WasteCollectionInfo/LastLineCompleted/" + this.selectedZone).valueChanges().subscribe((lastLine) => {
        lastLineDone.unsubscribe();
        if (lastLine != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getCurrentLine", lastLine);
          this.workerDetails.currentLine = (Number(lastLine) + 1).toString();
        }
      });
    }
  }

  getWorkPercentage(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWorkPercentage");
    let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus";
    let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
      lineStatusData => {
        lineStatusInstance.unsubscribe();
        if (lineStatusData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWorkPercentage", lineStatusData);
        }
        let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
        if (zoneDetails != undefined) {
          if (lineStatusData == null) {
            zoneDetails.workPer = "0%";
            zoneDetails.workPerShow = "0 %";
          }
          else {
            let keyArray = Object.keys(lineStatusData);
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineWeightDetail = zoneDetails.lineWeight.find(item => item.lineNo == lineNo);
              if (lineWeightDetail != undefined) {
                lineWeightDetail.lineStatus = lineStatusData[lineNo]["Status"];
                if (lineStatusData[lineNo]["end-time"] != null) {
                  let date = new Date(this.toDayDate + " " + lineStatusData[lineNo]["end-time"]);
                  let timeSpan = date.getTime();
                  lineWeightDetail.endTime = timeSpan;
                }
              }
            }
            this.getCompletedLinesAndCoveredLength(zoneNo);
          }
        }
      }
    );
  }

  getCompletedLinesAndCoveredLength(zoneNo: any) {
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
    if (zoneDetails != undefined) {
      let lines = zoneDetails.lineWeight;
      if (lines.length > 0) {
        let percentage = 0;
        let skippedLines = 0;
        let skippedPercentage = 0;
        let lineLength = 0;
        let actualLineCompleted = 0;
        let lastLineNo = 0;
        for (let i = 0; i < lines.length; i++) {
          let lineNo = lines[i]["lineNo"];
          if (lines[i]["lineStatus"] == "LineCompleted") {
            lastLineNo = lineNo;
            actualLineCompleted++;
            lineLength += Number(lines[i]["lineLength"]);
            let lineWeight = Number(lines[i]["weightage"]);
            percentage += (100 / Number(zoneDetails.totalLines)) * lineWeight;
          }
          else if (lines[i]["lineStatus"] == "Skipped") {
            skippedLines++;
          }
        }
        if (skippedLines > 0) {
          zoneDetails.skippedLines = skippedLines;
          skippedPercentage = 100 - ((skippedLines / Number(zoneDetails.totalLines)) * 100);
          if (percentage > skippedPercentage) {
            percentage = skippedPercentage;
          }
        }
        if (percentage > 100) {
          percentage = 100;
        }

        zoneDetails.workPer = percentage.toFixed(0) + "%";
        zoneDetails.workPerShow = percentage.toFixed(0) + " %";

        zoneDetails.completedLines = Number(((Number(percentage.toFixed(0)) * zoneDetails.totalLines) / 100).toFixed(0));
        zoneDetails.coveredLength = (lineLength / 1000).toFixed(2);

        let lineDifference = zoneDetails.completedLines - actualLineCompleted;
        if (lineDifference == 0) {
          zoneDetails.coveredLength = (lineLength / 1000).toFixed(2);
          zoneDetails.currentLine = zoneDetails.completedLines + 1;
        }
        else {
          let currentLine = lastLineNo;
          for (let j = (lastLineNo + 1); j <= (lastLineNo + lineDifference); j++) {
            if (lines[j] != null) {
              if (lines[j]["lineLength"] != null) {
                lineLength += Number(lines[j]["lineLength"]);
              }
            }
          }
          zoneDetails.coveredLength = (lineLength / 1000).toFixed(2);
          zoneDetails.currentLine = currentLine + 1;
        }
        this.getWardCurrentLine(zoneDetails, lines, lineDifference);
        if (this.selectedZone == zoneNo) {
          this.workerDetails.completedLines = zoneDetails.completedLines;
          this.workerDetails.wardKM = zoneDetails.coveredLength;
        }
      }
    }
  }

  getWardCurrentLine(zoneDetails: any, lines: any, lineDifference: any) {
    lines = lines.sort((a, b) => b.endTime > a.endTime ? 1 : -1);
    let currentLine = Number(lines[0]["lineNo"]);
    if (currentLine == zoneDetails.totalLines) {
      currentLine = 0;
    }
    for (let i = 0; i < lineDifference; i++) {
      currentLine++;
      if (currentLine == zoneDetails.totalLines) {
        currentLine = 1;
      }
    }
    zoneDetails.currentLine = currentLine + 1;
    if (zoneDetails.zoneNo == this.selectedZone) {
      this.workerDetails.currentLine = zoneDetails.currentLine;
    }
  }

  getTotalTime(zoneNo: any) {
    this.workerDetails.startTime = "---";
    this.workerDetails.endTime = "---";
    this.workerDetails.totalTime = "0 hr 0 min";
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
    if (zoneDetails != undefined) {
      let startTime = zoneDetails.dutyOnTime;
      let startList = startTime.split(",");
      if (startList.length > 1) {
        $(this.dutyDetail).show();
      } else {
        $(this.dutyDetail).hide();
      }

      let sTime = this.commonService.tConvert(startList[startList.length - 1]);
      this.workerDetails.startTime = sTime;

      if (zoneDetails.wardReachTime != "---") {
        let reachOnList = zoneDetails.wardReachTime.split(",");
        let rTime = this.commonService.tConvert(
          reachOnList[reachOnList.length - 1]
        );
        this.workerDetails.wardReachTime = rTime;
      }

      if (zoneDetails.dutyOffTime == "---") {
        this.workerDetails.endTime = "---";
        let dat1 = new Date(this.toDayDate + " " + startTime);
        let dat2 = new Date();
        let totalMinutes = this.commonService.timeDifferenceMin(dat2, dat1);
        this.workerDetails.totalTime = this.commonService.getHrsFull(totalMinutes);
      } else {
        let endTime = zoneDetails.dutyOffTime;
        let endList = endTime.split(",");
        if (endList[startList.length - 1] != null) {
          let eTime = this.commonService.tConvert(endList[endList.length - 1]);
          this.workerDetails.endTime = eTime;
        } else {
          this.workerDetails.endTime = "---";
        }

        if (startList.length > 0) {
          let totalMinutes = 0;
          for (let i = 0; i < startList.length; i++) {
            let startMinutes = startList[i];
            let endMinutes = endList[i];
            if (endMinutes == undefined) {
              let dat1 = new Date(this.toDayDate + " " + startMinutes);
              let dat2 = new Date();
              totalMinutes += this.commonService.timeDifferenceMin(dat2, dat1);
            } else {
              let dat1 = new Date(this.toDayDate + " " + startMinutes);
              let dat2 = new Date(this.toDayDate + " " + endMinutes);
              totalMinutes += this.commonService.timeDifferenceMin(dat2, dat1);
            }
          }
          this.workerDetails.totalTime = this.commonService.getHrsFull(totalMinutes);
        }
      }
      if (zoneNo.includes('(')) {
        zoneNo = zoneNo.toString().replace("(", "~").replace(")", "");
      }
      let element = <HTMLAnchorElement>(document.getElementById("routeTrackingLink"));
      element.href = this.cityName + "/route-tracking/" + zoneNo;
      element = <HTMLAnchorElement>document.getElementById("mapsLink");
      element.href = this.cityName + "/ward-work-tracking/" + zoneNo;
    }
  }

  getDistanceCovered(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDistanceCovered");
    let dbPath = "LocationHistory/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/TotalCoveredDistance";
    let distanceCovered = this.db.object(dbPath).valueChanges().subscribe((distanceData) => {
      if (distanceData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDistanceCovered", distanceData);
        this.workerDetails.totalKM = (parseFloat(distanceData.toString()) / 1000).toFixed(2);
      }
      else {
        this.workerDetails.totalKM = "0.00";
      }
      distanceCovered.unsubscribe();
    });
  }

  // Employee Detail

  getEmployeeData() {
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
    if (zoneDetails != undefined) {
      let driverList = zoneDetails.driverId.toString().split(",");
      let helperList = zoneDetails.helperId.toString().split(",");
      let vehicleList = zoneDetails.vehicleNo.toString().split(",");
      this.getEmployee(driverList[driverList.length - 1], "driver");
      this.getEmployee(helperList[helperList.length - 1], "helper");
      this.workerDetails.vehicleNo = vehicleList[vehicleList.length - 1];
      this.getApplicationStatus(driverList[driverList.length - 1]);
    }
  }

  getEmployee(empId: any, empType: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      if (empType == "driver") {
        this.workerDetails.driverName = employee["name"] != null ? employee["name"].toUpperCase() : "Not Assigned";
        this.workerDetails.driverMobile = employee["mobile"] != null ? employee["mobile"] : "---";
        this.workerDetails.driverImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? employee["profilePhotoURL"] : "../../assets/img/internal-user.png";
      } else {
        this.workerDetails.helperName = employee["name"] != null ? employee["name"].toUpperCase() : "Not Assigned";
        this.workerDetails.helperMobile = employee["mobile"] != null ? employee["mobile"] : "---";
        this.workerDetails.helperImageUrl = employee["profilePhotoURL"] != null && employee["profilePhotoURL"] != "" ? employee["profilePhotoURL"] : "../../assets/img/internal-user.png";
      }
    });
  }

  fillWardDetail() {
    this.workerDetails.startTime = "---";
    this.workerDetails.endTime = "---";
    this.workerDetails.wardReachTime = "---";
    this.workerDetails.tripCount = "0";
    this.workerDetails.vehicleCurrentLocation = "---";
    this.employeeDetail = [];

    let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
    if (zoneDetails != undefined) {
      this.workerDetails.wardReachTime = zoneDetails.wardReachTime;
      this.workerDetails.wardKM = zoneDetails.wardKM;
      if (zoneDetails.lineWeight.length == 0) {
        this.getCurrentLine(this.selectedZone);
      }
    }
    this.time = [];
    this.distance = [];
    this.initGrpahProperties();
    this.drawWorkProgress();
    this.getEmployeeData();
    this.getDistanceCovered(this.selectedZone);
    this.showHaltTime();
    this.getWardInTime();
    this.getRemarks(this.selectedZone);
    this.getTotalTime(this.selectedZone);
    this.getWardTrips(this.selectedZone);
    this.getWardProgress();
    this.checkTodayWorkStatus();
    this.getVehicleStatus();
  }

  getWardInTime() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardInTime");
    if (this.wardInInfo != undefined) {
      this.wardInInfo.unsubscribe();
    }
    this.workerDetails.wardTime = "0 hr 0 min";
    this.workerDetails.vehicleCurrentLocation = "---";
    this.totalMinutesInWard = 0;
    let dbPath = "GeoGraphicallySurfingHistory/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "";
    this.wardInInfo = this.db.object(dbPath).valueChanges().subscribe((data) => {
      this.instancesList.push({ instances: this.wardInInfo });
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardInTime", data);
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          let tripCount = 0;
          let vehicleLocation = data[keyArray[keyArray.length - 1]].replace("-in", "").replace("-out", "");
          if (vehicleLocation != "ward") {
            let dbLocationPath = "Defaults/GeoLocations/FixedLocations/" + vehicleLocation + "/name";
            let locationDetail = this.db.object(dbLocationPath).valueChanges().subscribe((locationPath) => {
              locationDetail.unsubscribe();
              if (locationPath != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardInTime", locationPath);
                this.workerDetails.vehicleCurrentLocation = locationPath.toString() + " " + data[keyArray[keyArray.length - 1]].replace(vehicleLocation + "-", "");
              }
              if (this.workerDetails.vehicleCurrentLocation == "ward in") {
                $(this.vehicleStatusH3).css("color", "green");
              } else {
                $(this.vehicleStatusH3).css("color", "red");
              }
            });
          } else {
            this.workerDetails.vehicleCurrentLocation = data[keyArray[keyArray.length - 1]].replace("-", " ");
            if (this.workerDetails.vehicleCurrentLocation == "ward in") {
              $(this.vehicleStatusH3).css("color", "green");
            } else {
              $(this.vehicleStatusH3).css("color", "red");
            }
          }

          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            let remark = data[index];
            if (remark == "ward-in" && i < keyArray.length - 1) {
              if (data[keyArray[(i + 1)]] == "ward-in") {
                i = i + 1;
                this.getWardIn(data, keyArray, i, i + 1, this.totalMinutesInWard);
              }
              else {
                this.getWardIn(data, keyArray, i, i + 1, this.totalMinutesInWard);
              }
            } else if (remark == "ward-in" && i == keyArray.length - 1) {
              let dat1 = new Date(this.toDayDate + " " + index);
              let dat2 = new Date();
              if (this.workerDetails.endTime != "---") {
                dat2 = new Date(this.toDayDate + " " + this.workerDetails.endTime.split(" ")[0]);
              }
              this.totalMinutesInWard = this.totalMinutesInWard + this.commonService.timeDifferenceMin(dat2, dat1);
              this.workerDetails.wardTime = this.commonService.getHrsFull(this.totalMinutesInWard);
            }

            if (remark == "collectionPoint1-in") {
              tripCount = tripCount + 1;
            } else if (remark == "collectionPoint2-in") {
              tripCount = tripCount + 1;
            } else if (remark == "dumpingYard-in") {
              tripCount = tripCount + 1;
            } else if (remark == "plant-in") {
              tripCount = tripCount + 1;
            }
          }
        }
      }
    });
  }

  getWardIn(data: any, keyArray: any, index: any, nextIndex: any, totalMinutes: any) {
    if (data[keyArray[nextIndex]] == "ward-out" || data[keyArray[nextIndex]] == "office-in") {
      let dat1 = new Date(this.toDayDate + " " + keyArray[index]);
      let dat2 = new Date(this.toDayDate + " " + keyArray[nextIndex]);
      this.totalMinutesInWard = totalMinutes + this.commonService.timeDifferenceMin(dat2, dat1);
      this.workerDetails.wardTime = this.commonService.getHrsFull(this.totalMinutesInWard);
    } else if (nextIndex == keyArray.length - 1) {
      let dat1 = new Date(this.toDayDate + " " + keyArray[index]);
      let dat2 = new Date();
      this.totalMinutesInWard = totalMinutes + this.commonService.timeDifferenceMin(dat2, dat1);
      this.workerDetails.wardTime = this.commonService.getHrsFull(this.totalMinutesInWard);
    } else {
      nextIndex = nextIndex + 1;
      if (nextIndex < keyArray.length) {
        this.getWardIn(data, keyArray, index, nextIndex, totalMinutes);
      }
    }
  }

  getWardProgress() {
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
    if (zoneDetails != undefined) {
      if (zoneDetails.completedLines != null) {
        this.workerDetails.completedLines = zoneDetails.completedLines;
      }
      if (zoneDetails.skippedLines != null) {
        this.workerDetails.skippedLines = zoneDetails.skippedLines;
      }
      if (zoneDetails.totalLines != null) {
        this.workerDetails.totalLines = zoneDetails.totalLines;
      }
      if (zoneDetails.coveredLength != null) {
        this.workerDetails.wardKM = zoneDetails.coveredLength;
      }
      this.workerDetails.currentLine = zoneDetails.currentLine;
    }
  }

  // Remarks


  saveRemarks() {
    if ($(this.drpRemark).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select remark topic !!!");
      return;
    }

    if ($(this.txtRemark).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter remark !!!");
      return;
    }

    this.$Key = $(this.key).val();
    this.category = $(this.drpRemark).val();
    this.remark = $(this.txtRemark).val();
    let time = new Date().toLocaleTimeString();
    let image = "";
    if (this.category == "1") {
      image = "t-vehicle.png";
    } else if (this.category == "2") {
      image = "device-issue.png";
    } else if (this.category == "3") {
      image = "location-issue.png";
    } else if (this.category == "4") {
      image = "fast-working.png";
    } else if (this.category == "5") {
      image = "halt.png";
    } else if (this.category == "6") {
      image = "general-halt.png";
    }

    let dbPath = "Remarks/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
    const remark = {
      $Key: this.$Key,
      userId: this.userId,
      category: this.category,
      remark: this.remark,
      time: time,
      image: image,
    };

    if (this.$Key == "0") {
      this.usrService.addRemarks(remark, dbPath);
      this.commonService.setAlertMessage("success", "Remark added successfully !!!");
    } else {
      this.usrService.UpdateRemarks(remark, dbPath);
      this.commonService.setAlertMessage("success", "Remark updated successfully !!!");
    }
    $(this.drpRemark).val("0");
    $(this.txtRemark).val("");
    $(this.key).val("0");
  }

  getRemarks(wardNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getRemarks");
    $(this.key).val("0");
    this.remarkList = [];
    let dbPath = "Remarks/" + wardNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
    let remarkData = this.db.object(dbPath).valueChanges().subscribe((Data) => {
      this.instancesList.push({ instances: remarkData });
      if (wardNo == this.selectedZone) {
        this.remarkList = [];
        if (Data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getRemarks", Data);
          var keyArray = Object.keys(Data);
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            this.remarkList.push({ key: index, topic: Data[index]["category"], remark: Data[index]["remark"], time: Data[index]["time"], image: Data[index]["image"], loginId: this.userId, userId: Data[index]["userId"], });
          }
        }
      }
    });
  }

  getFixedGeoLocation() {
    this.fixdGeoLocations = JSON.parse(localStorage.getItem("fixedLocation"));
    if (this.fixdGeoLocations != null) {
      if (this.fixdGeoLocations.length > 0) {
        for (let i = 0; i < this.fixdGeoLocations.length; i++) {
          let Lat = this.fixdGeoLocations[i]["lat"];
          let Lng = this.fixdGeoLocations[i]["lng"];
          let markerURL = "../../../assets/img/" + this.fixdGeoLocations[i]["img"];
          let contentString = "<b>" + this.fixdGeoLocations[i]["name"] + "</b>: " + this.fixdGeoLocations[i]["address"];
          let scaledHeight = 50;
          let scaledWidth = 50;
          let point1 = 0;
          let point2 = 0;
          this.setMarker(0, Lat, Lng, markerURL, "", contentString, this.mapHalt, scaledHeight, scaledWidth, point1, point2, false, "fixed");
        }
      }
    }
  }

  // Halt Time


  showHaltTime() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "showHaltTime");
    this.todayHaltList = [];
    this.workerDetails.currentHaltTime = "0:00";
    this.workerDetails.haltTime = "0:00";
    if (this.haltInfoData != undefined) {
      this.haltInfoData.unsubscribe();
    }
    let haltInfoPath = "HaltInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
    this.haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe((haltData) => {
      this.instancesList.push({ instances: this.haltInfoData });
      this.todayHaltList = [];
      if (haltData != undefined) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "showHaltTime", haltData);
        let totalBreak = 0;
        this.workerDetails.currentHaltTime = "0:00";

        if (haltData.length > 0) {
          for (let index = 0; index < haltData.length; index++) {
            if (haltData[index]["haltType"] != "network-off") {
              if (haltData[index]["location"] != null) {
                let latlng = haltData[index]["location"].split(":")[1].split(",");
                let lt = $.trim(latlng[0]).replace("(", "");
                let lg = $.trim(latlng[1]).replace(")", "");
                let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                if (duration > this.minHalt) {
                  totalBreak += duration;
                }
                let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
                if (zoneDetails != undefined) {
                  this.workerDetails.haltTime = this.commonService.getHrs(totalBreak);

                  let breakBGColor = this.getMarkerName(duration);
                  $(this.totalHaltH3).css("color", this.commonService.getHrs(totalBreak));
                  let activeClass = "halt-data-theme";
                  if (this.todayHaltList.length == 0) {
                    activeClass = "halt-data-theme active";
                  }
                  this.todayHaltList.push({ time: haltData[index]["startTime"], duration: duration, type: haltData[index]["haltType"], location: haltData[index]["locality"], lat: lt, lng: lg, breakBGColor: breakBGColor, activeClass: activeClass, });
                  if (index == haltData.length - 1) {
                    if (zoneDetails.status == "stopped") {
                      let lastDuration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                      this.workerDetails.currentHaltTime = this.commonService.getHrs(lastDuration);
                      $(this.currentHaltH3).css("color", this.getMarkerName(duration));
                    } else {
                      this.workerDetails.currentHaltTime = "0:00";
                      $(this.currentHaltH3).css("color", this.getMarkerName(0));
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  // Halt Detail

  setMapHalt() {
    let mapProp = this.commonService.mapForHaltReport();
    this.mapHalt = new google.maps.Map(document.getElementById("haltMap"), mapProp);
  }

  setWardBoundaryHalt(wardNo: string) {
    this.commonService.getWardBoundary(wardNo, this.zoneKMLHalt, 2).then((data: any) => {
      if (this.zoneKMLHalt != undefined) {
        this.zoneKMLHalt[0]["line"].setMap(null);
      }
      this.zoneKMLHalt = data;
      this.zoneKMLHalt[0]["line"].setMap(this.mapHalt);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKMLHalt[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(this.zoneKMLHalt[0]["latLng"][i]["lat"]), lng: Number(this.zoneKMLHalt[0]["latLng"][i]["lng"]) });
      }
      this.mapHalt.fitBounds(bounds);
    });
  }

  getMarkerName(breakTime: number) {
    let markerColor: any;
    if (breakTime <= 10) {
      markerColor = "green";
    } else if (breakTime > 10 && breakTime <= 20) {
      markerColor = "orange";
    } else {
      markerColor = "red";
    }
    return markerColor;
  }

  showBreaksOnMap() {
    this.haltMarkerList = [];
    for (let index = 0; index < this.todayHaltList.length; index++) {
      if (this.todayHaltList[index]["lat"] != null) {
        let lt = this.todayHaltList[index]["lat"];
        let lg = this.todayHaltList[index]["lng"];

        let markerURL = "../../../assets/img/" + this.getMarkerName(this.todayHaltList[index]["duration"]) + ".svg";
        var markerLabel = this.todayHaltList[index]["duration"];
        let contentString = "Start Time : " + this.todayHaltList[index]["time"] + " <br/> Break Time : " + this.todayHaltList[index]["duration"];
        let scaledHeight = 50;
        let scaledWidth = 50;
        let point1 = 25;
        let point2 = 31;
        let isAnimation = false;
        if (index == 0) {
          isAnimation = true;
          scaledHeight = 90;
          scaledWidth = 90;
          point1 = 45;
          point2 = 50;
        }
        this.setMarker(0, lt, lg, markerURL, markerLabel, contentString, this.mapHalt, scaledHeight, scaledWidth, point1, point2, isAnimation, "halt");
      }
    }
  }

  // open model
  openMapModelHalt(contentHalt) {
    this.modalService.open(contentHalt, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = (windowHeight * 90) / 100;
    let width = (windowWidth * 90) / 100;
    let mapHeight = height - 80 + "px";
    let divHeight = height - 80 + "px";
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";

    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $("#haltMap").css("height", mapHeight);
    $("#divSequence").css("height", divHeight);

    this.setMapHalt();
    setTimeout(() => {
      this.setWardBoundaryHalt(this.selectedZone);
    }, 200);
    this.getFixedGeoLocation();
    this.showBreaksOnMap();
  }

  closeMapModelHalt() {
    this.modalService.dismissAll();
  }

  getHaltMap(index: any) {
    if (this.haltMarkerList.length > 0) {
      for (let i = 0; i < this.haltMarkerList.length; i++) {
        let height = 50;
        let point1 = 25;
        let point2 = 31;
        if (i == index) {
          height = 90;
          point1 = 45;
          point2 = 50;
        }
        this.haltMarkerList[i]["marker"].setMap(null);
        let lt = this.todayHaltList[i]["lat"];
        let lg = this.todayHaltList[i]["lng"];
        if (i == index) {
          this.todayHaltList[i]["activeClass"] = "halt-data-theme active";
          let markerURL = "../../../assets/img/" + this.getMarkerName(this.todayHaltList[i]["duration"]) + ".svg";
          var markerLabel = this.todayHaltList[i]["duration"];
          let contentString = "Start Time : " + this.todayHaltList[i]["time"] + " <br/> Break Time : " + this.todayHaltList[i]["duration"];
          this.setMarker(i, lt, lg, markerURL, markerLabel, contentString, this.mapHalt, height, height, point1, point2, true, "haltShow");
        } else {
          this.todayHaltList[i]["activeClass"] = "halt-data-theme";
          let markerURL = "../../../assets/img/" + this.getMarkerName(this.todayHaltList[i]["duration"]) + ".svg";
          var markerLabel = this.todayHaltList[i]["duration"];
          let contentString = "Start Time : " + this.todayHaltList[i]["time"] + " <br/> Break Time : " + this.todayHaltList[i]["duration"];
          this.setMarker(i, lt, lg, markerURL, markerLabel, contentString, this.mapHalt, height, height, point1, point2, false, "haltShow");
        }
      }
    }
  }

  getAllData(wardNo: string) {
    this.selectedZone = wardNo;
    let detail = this.zoneList.find(item => item.zoneNo == wardNo);
    if (detail != undefined) {
      this.selectedZoneName = detail.zoneName;
    }
    this.workerDetails.wardNo = wardNo;
    if (wardNo.toString().includes("mkt")) {
      this.workerDetails.wardName = wardNo.toString().replace("mkt", "Market ");
    } else {
      this.workerDetails.wardName = "Zone " + this.selectedZoneName;
    }
    this.fillWardDetail();
  }

  // open model
  openMapModelRemark(content: any, id: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 290;
    let width = 350;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (this.remarkList.length > 0) {
      $(this.drpRemark).val(this.remarkList[id]["topic"]);
      $(this.txtRemark).val(this.remarkList[id]["remark"]);
      $(this.key).val(this.remarkList[id]["key"]);
    }
  }

  // Application Detail


  getApplicationStatus(driverID) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getApplicationStatus");
    this.applicationDataList = [];
    if (this.application != null) {
      this.application.unsubscribe();
    }
    let applicationPath = "NavigatorEventsTracking/Date/" + driverID + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
    this.application = this.db.object(applicationPath).valueChanges().subscribe((applicationData) => {
      this.instancesList.push({ instances: this.application });
      if (applicationData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getApplicationStatus", applicationData);
        this.applicationDataList = [];
        let applicationArray = Object.entries(applicationData);
        for (let index = applicationArray.length - 1; index >= 0; index--) {
          let status = applicationArray[index][1];
          let time = applicationArray[index][0];

          time = time.split(":")[0] + ":" + time.split(":")[1] + ":" + time.split(":")[2];

          this.applicationDataList.push({ time: time, status: status });
        }
        this.workerDetails.applicationStatus =
          this.applicationDataList[0]["status"];
        if (this.applicationDataList[0]["status"] == "Opened") {
          $(this.appStatusH3).css("color", "#000");
        } else {
          $(this.appStatusH3).css("color", "red");
        }
      }
    });
  }

  // Vehicle Status Detail

  getVehicleStatus() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getVehicleStatus");
    this.vehicleStstusList = [];
    let dbPath = "GeoGraphicallySurfingHistory/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
    let vehicleStatusInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      vehicleStatusInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getVehicleStatus", data);
        this.vehicleStstusList = [];
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            let time = index;
            let status = data[index];
            time = time.split(":")[0] + ":" + time.split(":")[1] + ":" + time.split(":")[2];
            this.vehicleStstusList.push({ time: time, status: status });
          }
        }
      }
    });
  }

  // open model
  openMapModel(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 870;
    let width = 350;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 26 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
  }

  openVehicleStatusModel(content: any) {
    if (this.workerDetails.vehicleCurrentLocation != "---") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 870;
      let width = 350;
      height = (windowHeight * 90) / 100;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      let divHeight = height - 26 + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", marginTop);
      $("#divStatus").css("height", divHeight);
    }
  }

  openDutyModel(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 450;
    let width = 550;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 26 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
    this.getDutyOnOff();
  }

  getDutyOnOff() {
    this.dutyStatusList = [];
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
    if (zoneDetails != undefined) {
      if (zoneDetails.dutyOnTime != "---") {
        let driverList = zoneDetails.driverName.toString().split(",");
        let vehicleList = zoneDetails.vehicleNo.toString().split(",");
        let dutyOnList = zoneDetails.dutyOnTime.toString().split(",");
        let dutyOffList = zoneDetails.dutyOffTime.toString().split(",");
        let reachOnList = zoneDetails.wardReachTime.toString().split(",");
        for (let i = 0; i < driverList.length; i++) {
          this.dutyStatusList.push({ name: driverList[i], dutyOn: "---", reachOn: "---", dutyOff: "---", });
          if (dutyOnList[i] != null) {
            this.dutyStatusList[i]["dutyOn"] = this.commonService.tConvert(dutyOnList[i].trim());
          }
          if (dutyOffList[i] != null) {
            this.dutyStatusList[i]["dutyOff"] = this.commonService.tConvert(dutyOffList[i].trim());
          }
          if (vehicleList[i] != null) {
            this.dutyStatusList[i]["vehicle"] = vehicleList[i];
          }
        }
        for (let i = 0; i < reachOnList.length; i++) {
          this.getReachOnTime(reachOnList[i].trim());
        }
      }
    }
  }


  openDutyOnImageModel(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 400;
    let width = 900;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 26 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
    this.getDutyOnImages();
  }

  getDutyOnImages() {
    this.dutyOnImageList = [];
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
    if (zoneDetails != undefined) {
      if (zoneDetails.dutyOnImage != "---") {
        let dutyOnList = zoneDetails.dutyOnTime.toString().split(",");
        let dutyOnImageList = zoneDetails.dutyOnImage.toString().split(",");
        for (let i = 0; i < dutyOnImageList.length; i++) {
          let imageName = dutyOnImageList[i].toString().trim();
          let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnImages%2F" + this.selectedZone + "%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.toDayDate + "%2F" + imageName + "?alt=media";
          let time = "---";
          if (dutyOnList[i] != null) {
            time = dutyOnList[i];
          }
          this.dutyOnImageList.push({ imageUrl: imageUrl, time: time });
        }
      }
    }
  }


  openDutyOffImageModel(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 400;
    let width = 900;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 26 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
    this.getDutyOffImages();
  }

  getDutyOffImages() {
    this.dutyOffImageList = [];
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
    if (zoneDetails != undefined) {
      if (zoneDetails.dutyOnImage != "---") {
        let dutyOffList = zoneDetails.dutyOffTime.toString().split(",");
        let dutyOffImageList = zoneDetails.dutyOffImage.toString().split(",");
        for (let i = 0; i < dutyOffImageList.length; i++) {
          let imageName = dutyOffImageList[i].toString().trim();
          let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutImages%2F" + this.selectedZone + "%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.toDayDate + "%2F" + imageName + "?alt=media";
          let time = "---";
          if (dutyOffList[i] != null) {
            time = dutyOffList[i];
          }
          this.dutyOffImageList.push({ imageUrl: imageUrl, time: time });
        }
      }
    }
  }

  getReachOnTime(reachTime: any) {
    let dat1 = new Date(this.toDayDate + " " + reachTime);
    for (let i = 0; i < this.dutyStatusList.length; i++) {
      let startDate = new Date(this.toDayDate + " " + this.dutyStatusList[i]["dutyOn"]);
      if (dat1 > startDate) {
        if (this.dutyStatusList[i]["dutyOn"] == "---") {
          this.dutyStatusList[i]["reachOn"] = this.commonService.tConvert(reachTime);
        } else {
          if (this.dutyStatusList[i]["dutyOff"] == "---") {
            this.dutyStatusList[i]["reachOn"] = this.commonService.tConvert(reachTime);
          } else {
            let endDate = new Date(this.toDayDate + " " + this.dutyStatusList[i]["dutyOff"]);
            if (dat1 < endDate) {
              this.dutyStatusList[i]["reachOn"] = this.commonService.tConvert(reachTime);
            }
          }
        }
      }
    }
  }

  closeMapModel() {
    this.modalService.dismissAll();
  }

  // Unassigned Vehicle

  // Application Detail

  getUnassignedVehicle() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getUnassignedVehicle");
    let vehiclePath = "Vehicles";
    this.unAssignedVehicle = [];
    if (this.vehicle != null) {
      this.vehicle.unsubscribe();
    }
    this.vehicle = this.db.object(vehiclePath).valueChanges().subscribe((vehicleData) => {
      this.instancesList.push({ instances: this.vehicle });
      this.unAssignedVehicle = [];
      if (vehicleData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getUnassignedVehicle", vehicleData);
        let vehicleArray = Object.entries(vehicleData);
        let total = 0;
        for (let index = 0; index < vehicleArray.length; index++) {
          let vehicleName = vehicleArray[index][0];
          let status = vehicleArray[index][1]["status"];
          if (status == "1") {
            total += 1;
            this.workerDetails.totalUnAssignedVehicle = total.toString();
            let dbPath = "VehicleNotAssignedReasons/" + vehicleName + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
            let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
              vehicleInstance.unsubscribe();
              let reason = "";
              let textAreaClass = "remark-de-active";
              let isChecked = false;
              let userId = this.userId;
              if (data != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getUnassignedVehicle", data);
                reason = data["reason"].toString();
                userId = data["userId"].toString();
                textAreaClass = "remark-active";
                isChecked = true;
              }
              this.unAssignedVehicle.push({ name: vehicleName, total: 0, reason: reason, entryId: userId, userId: this.userId, textAreaClass: textAreaClass, isChecked: isChecked, });
              this.unAssignedVehicle[0]["total"] = this.unAssignedVehicle.length;
            });
          }
        }
      }
      this.vehicle.unsubscribe();
    });
  }

  // open model
  openMapModelVehicle(contentVehicle: any) {
    this.getUnassignedVehicle();
    this.modalService.open(contentVehicle, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 880;
    let width = 570;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2);
    let divHeight = height - 150 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px");
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "29px");
    $("#divVehicle").css("height", divHeight);
  }


  saveVehicleReason() {
    if (this.unAssignedVehicle != null) {
      for (let i = 0; i < this.unAssignedVehicle.length; i++) {
        let vehicle = this.unAssignedVehicle[i]["name"];
        let userId = this.unAssignedVehicle[i]["entryId"];
        let reason = $(this.txtVehicle + i).val();
        let chkId = "chk" + i;
        let element = <HTMLInputElement>document.getElementById(chkId);
        let updatedBy = this.userId;
        if (element.checked == false) {
          reason = null;
          userId = null;
          updatedBy = null;
        }

        let dbPath = "VehicleNotAssignedReasons/" + vehicle + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
        this.db.object(dbPath).update({ reason: reason, userId: userId, updatedBy: updatedBy, });
      }
      this.commonService.setAlertMessage("success", "Vehicle Not Assigned Reason Added Successfully !!!");
    }
  }

  closeMapModelVehicle() {
    this.modalService.dismissAll();
  }

  getDate(days: any) {
    let displayDate = new Date(new Date(this.todayDate).getTime() - Number(days) * 1000 * 60 * 60 * 24).toDateString().slice(4, 20);
    let month = displayDate.split(" ")[0];
    let day = displayDate.split(" ")[1];
    let year = displayDate.split(" ")[2];
    return day + ", " + month + " " + year;
  }

  getFormattedDate(days: any) {
    let date = new Date(new Date(this.toDayDate).getTime() - Number(days) * 1000 * 60 * 60 * 24);
    let day = new Date(date).getDate().toString();
    let month = (new Date(date).getMonth() + 1).toString();
    let year = new Date(date).getFullYear().toString();
    if (day.length == 1) {
      day = "0" + day;
    }
    if (month.length == 1) {
      month = "0" + month;
    }
    return year + "-" + month + "-" + day;
  }

  initGrpahProperties() {
    this.chartColor = "#ececec";
    this.lineBigDashboardChartType = "line";
    this.canvas = document.getElementById("bigDashboardChart");
    if (this.canvas != null) {
      this.ctx = this.canvas.getContext("2d");
      this.gradientStroke = this.ctx.createLinearGradient(500, 0, 100, 0);
      this.gradientStroke.addColorStop(0, "#80b6f4");
      this.gradientStroke.addColorStop(1, this.chartColor);
      this.gradientFill = this.ctx.createLinearGradient(0, 200, 0, 50);
      this.gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
      this.gradientFill.addColorStop(1, "rgba(255, 255, 255, 0.24)");

      this.lineBigDashboardChartColors = [
        {
          backgroundColor: this.gradientFill,
          borderColor: this.chartColor,
          pointBorderColor: this.chartColor,
          pointBackgroundColor: "#fff",
          pointHoverBackgroundColor: "#2c2c2c",
          pointHoverBorderColor: this.chartColor,
        },
      ];
    }
  }

  checkTodayWorkStatus() {
    this.initTimeDistance();
    this.drawWorkProgress();
    this.wardLineStatus = [];
    let wardLocalStorage = JSON.parse(localStorage.getItem("wardLineStorage"));
    if (wardLocalStorage != null) {
      let wardDetails = wardLocalStorage.find((item) => item.ward == this.selectedZone);
      if (wardDetails != undefined) {
        this.wardLineStatus = wardDetails.data;
        this.workerDetails.lastUpdateTime = wardDetails.time;
        this.getAllLinesFromJson();
        this.getGrpahDataTodayAndLastFiveDays(15);
      } else {
        this.getWardLineStatus();
      }
    } else {
      this.getWardLineStatus();
    }
  }

  getWardLineStatus() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardLineStatus");
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus";
    let wardLineData = this.db.object(dbPath).valueChanges().subscribe((data) => {
      this.instancesList.push({ instances: wardLineData });
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardLineStatus", data);
      }
      this.graphHeaderData.date = this.getDate(0);
      this.graphHeaderData.workprogress = "0";
      this.wardLineStatus = data;
      let time = new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1];
      let wardLocalStorage = JSON.parse(localStorage.getItem("wardLineStorage"));
      if (wardLocalStorage != null) {
        let wardDetails = wardLocalStorage.find((item) => item.ward == this.selectedZone);
        if (wardDetails != undefined) {
          wardDetails.time = time;
          wardDetails.data = this.wardLineStatus;
          this.workerDetails.lastUpdateTime = wardDetails.time;
        } else {
          wardLocalStorage.push({ ward: this.selectedZone, time: time, data: data, });
          this.workerDetails.lastUpdateTime = time;
        }
      } else {
        wardLocalStorage = [];
        wardLocalStorage.push({ ward: this.selectedZone, time: time, data: data, });
        this.workerDetails.lastUpdateTime = time;
      }
      localStorage.setItem("wardLineStorage", JSON.stringify(wardLocalStorage));
      this.initTimeDistance();
      this.drawWorkProgress();
      this.getAllLinesFromJson();
      this.getGrpahDataTodayAndLastFiveDays(15);
      wardLineData.unsubscribe();
    });
  }

  initTimeDistance() {
    this.temptime = [];
    this.tempdistance = [];
    this.time = [];
    this.distance = [];
  }

  getGrpahDataTodayAndLastFiveDays(interval: any) {
    this.graphData = [];
    if (this.wardLineStatus != null) {
      var keyArray = Object.keys(this.wardLineStatus);
      if (keyArray.length > 0) {
        for (let i = 0; i < keyArray.length; i++) {
          if (keyArray[i] != null) {
            if (this.wardLineStatus[keyArray[i]] != null) {
              let startTime = this.wardLineStatus[keyArray[i]]["start-time"];
              let endTime = this.wardLineStatus[keyArray[i]]["end-time"];
              let lineDistance = this.wardLineStatus[keyArray[i]]["line-distance"];
              this.graphData.push({ startTime: startTime, endTime: endTime, lineDistance: lineDistance, });
            }
          }
        }
      }
    }

    if (this.graphData.length > 0) {
      this.days = 1;
      this.endInterval = 0;
      this.maxDistance = [];
      setTimeout(() => {
        this.initTimeDistance();
        this.drawWorkProgress();
        this.getData(interval, this.time, this.distance, this.toDayDate);
      }, 2000);
    } else {
      setTimeout(() => {
        this.initTimeDistance();
        this.drawWorkProgress();
        this.getDataNull(15, this.time, this.distance, this.toDayDate);
      }, 2000);
    }
  }

  drawWorkProgress() {
    this.lineBigDashboardChartData = [
      {
        pointRadius: 5,
        fill: true,
        borderWidth: 1,
        data: this.distance,
      },
    ];
    this.lineBigDashboardChartLabels = this.time;
  }

  getDataNull(interval: any, timeCollection: any[], distanceCollection: any[], date: any) {
    this.maxDistance = [];
    let intervalInMinutes = interval;
    let timePeriod = 100 / (60 / intervalInMinutes) / 100;

    let distanceCovered = 0;
    let timeInterval = 0;

    this.time.push(timeInterval + " ~0");
    this.distance.push(distanceCovered);

    let intervalStart = this.workerDetails.startTime;

    this.time.push(timeInterval + " ~0");
    this.distance.push(distanceCovered + 0.05);
    this.maxDistance.push(Math.max.apply(null, this.distance));
    this.setStepSizeandMaxValue(Math.max.apply(null, this.maxDistance));
    this.graphOptions();
  }
  getData(interval: any, timeCollection: any[], distanceCollection: any[], date: any) {
    this.maxDistance = [];
    let lineCompleted = 0;
    if (this.graphData.length > 0) {
      this.graphData = this.commonService.transformNumeric(this.graphData, "startTime");
      let intervalInMinutes = interval;
      let timePeriod = 100 / (60 / intervalInMinutes) / 100;
      let distanceCovered = 0;
      let timeInterval = 0;

      this.time.push(timeInterval + " ~0");
      this.distance.push(distanceCovered);

      let intervalStart = this.graphData[0]["startTime"];
      let endTime = this.graphData[0]["endTime"];

      if (intervalStart > endTime) {
        intervalStart = endTime;
      }

      let intervalEnd = new Date(new Date(this.getFormattedDate(0) + " " + intervalStart).getTime() + intervalInMinutes * 60000);

      for (let index = 0; index < this.graphData.length; index++) {
        let lineDistance = this.graphData[index]["lineDistance"];

        let lineEndTime = new Date(this.getFormattedDate(0) + " " + this.graphData[index]["endTime"]);

        if (this.graphData[index]["endTime"] == undefined) {
          break;
        }

        if (timeInterval > this.endInterval) {
          break;
        }

        if (lineDistance == undefined) {
          lineDistance = 0;
        }

        if (lineEndTime < intervalEnd) {
          distanceCovered += Number(lineDistance);
        } else {
          timeInterval = timeInterval + timePeriod;

          this.time.push(timeInterval + " ~ " + index);
          this.distance.push(distanceCovered);

          if (index > 0) {
            index--;
            if (distanceCovered == 0) {
              intervalEnd = new Date(intervalEnd.getTime() + intervalInMinutes * 60000);
            } else {
              intervalEnd = new Date(intervalEnd.getTime() + intervalInMinutes * 60000);
            }
          } else {
            index--;
            if (distanceCovered == 0) {
              intervalEnd = new Date(intervalEnd.getTime() + intervalInMinutes * 60000);
            }
          }
          distanceCovered = 0;
        }

        lineCompleted = index;

        if (this.days == 1) {
          this.endInterval = timeInterval;
        }
      }

      if (distanceCovered > 0) {
        this.time.push(timeInterval + timePeriod + " ~ " + lineCompleted);
        this.distance.push(distanceCovered);
      }

      this.maxDistance.push(Math.max.apply(null, this.distance));

      let zoneDetails = this.zoneList.find((item) => item.zoneNo == this.selectedZone);
      if (zoneDetails != undefined) {
        if (this.days == 2) {
          this.graphHeaderData.workprogress = ((Number(lineCompleted) / Number(zoneDetails.totalLines)) * 100).toFixed(2).toString();
        }
      }
    }

    this.days = Number(this.days) + 1;
    this.setStepSizeandMaxValue(Math.max.apply(null, this.maxDistance));
    this.graphOptions();
  }

  setStepSizeandMaxValue(value: any) {
    this.stepSize = Math.ceil(Number(value) / 5 / 100) * 100;
    this.graphMaxValue = Number(this.stepSize) * 5;
  }

  graphOptions() {
    this.lineBigDashboardChartOptions = {
      layout: {
        padding: {
          left: 15,
          right: 30,
          top: 15,
          bottom: 10,
        },
      },
      maintainAspectRatio: false,
      tooltips: {
        backgroundColor: "#fff",
        titleFontColor: "#333",
        bodyFontColor: "#666",
        bodySpacing: 4,
        xPadding: 12,
        mode: "nearest",
        intersect: 0,
        position: "nearest",
        title: "wow",
        callbacks: {
          title: function () { },
          label: function (tooltipItem, data) {
            return (
              +Number(tooltipItem.yLabel) +
              " meter covered" +
              " & Line Completed :" +
              data.labels[tooltipItem.index].split("~")[1]
            );
          },
        },
      },
      legend: {
        position: "bottom",
        fillStyle: "#FFF",
        display: false,
      },
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: "rgba(255,255,255,0.4)",
              fontStyle: "bold",
              beginAtZero: true,
              maxTicksLimit: 50,
              padding: 10,
              stepSize: this.stepSize,
              max: this.graphMaxValue,
            },
            gridLines: {
              drawTicks: true,
              drawBorder: false,
              display: true,
              color: "rgba(255,255,255,0.1)",
              zeroLineColor: "transparent",
            },
          },
        ],
        xAxes: [
          {
            gridLines: {
              zeroLineColor: "transparent",
              display: false,
            },
            ticks: {
              padding: 10,
              fontColor: "rgba(255,255,255,0.4)",
              fontStyle: "bold",
              callback: function (value) {
                return value.toString().split("~")[0];
              },
            },
          },
        ],
      },
    };
  }


  // Google Map

  setMap() {
    let mapProp = this.commonService.initMapPropertiesRealTime();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setMapDefault() {
    let mapProp = this.commonService.initMapPropertiesDefault();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setWardBoundary() {
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, 2).then((data: any) => {
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

  showVehicleMovement() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "showVehicleMovement");
    let dbPath = "CurrentLocationInfo/" + this.selectedZone + "/latLng";
    this.vehicleLocationInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      if (data != undefined) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "showVehicleMovement", data);
        dbPath = "RealTimeDetails/WardDetails/" + this.selectedZone + "/activityStatus";
        let statusInstance = this.db.object(dbPath).valueChanges().subscribe((statusData) => {
          statusInstance.unsubscribe();
          if (statusData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "showVehicleMovement", statusData);
          }
          let statusId = statusData.toString();
          let vehicleIcon;
          if (this.workerDetails.vehicleNo.includes("TRACTOR")) {
            vehicleIcon = "../assets/img/active-tractormdpi.png";
            if (statusId == "completed") {
              vehicleIcon = "../assets/img/disabled-tractormdpi.png";
            } else if (statusId == "stopped") {
              vehicleIcon = "../assets/img/stop-tractormdpi.png";
            }
          } else {
            vehicleIcon = "../assets/img/tipper-green.png";
            if (statusId == "completed") {
              vehicleIcon = "../assets/img/tipper-gray.png";
            } else if (statusId == "stopped") {
              vehicleIcon = "../assets/img/tipper-red.png";
            }
          }
          let location = data.toString().split(",");
          this.marker.setMap(null);
          this.marker = new google.maps.Marker({
            position: {
              lat: Number(location[0]),
              lng: Number(location[1]),
            },
            map: this.map,
            icon: vehicleIcon,
          });
        });
      }
      this.vehicleLocationInstance.unsubscribe();
    });
  }

  getAllLinesFromJson() {
    this.setWardBoundary();
    if (this.wardLines != undefined) {
      this.wardLines.unsubscribe();
    }
    this.clearAllOnMap();
    this.commonService.getWardLine(this.selectedZone, this.toDayDate).then((data: any) => {
      this.clearAllOnMap();
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      this.workerDetails.totalLines = wardLines["totalLines"];
      var linePath = [];
      for (let i = 0; i < keyArray.length - 3; i++) {

        let lineNo = Number(keyArray[i]);
        try {
          let points = wardLines[lineNo]["points"];
          var latLng = [];
          for (let j = 0; j < points.length; j++) {
            latLng.push({ lat: points[j][0], lng: points[j][1] });
          }
          linePath.push({ lineNo: i, latlng: latLng, color: "#87CEFA" });
        }
        catch { }
      }
      this.allLines = linePath;
      this.plotLinesOnMap();
    });
  }

  plotLinesOnMap() {
    if (this.allLines.length > 0) {
      let latLngArray = [];
      latLngArray = this.allLines[0]["latlng"];
      let lat = latLngArray[0]["lat"];
      let lng = latLngArray[0]["lng"];
      let startIcon = "../assets/img/start-point.svg";
      let contentString = "Ward Start";
      let scaledHeight = 25;
      let scaledWidth = 31;
      let point1 = 0;
      let point2 = 0;

      this.setMarker(0, lat, lng, startIcon, "", contentString, this.map, scaledHeight, scaledWidth, point1, point2, false, "map");

      latLngArray = this.allLines[this.allLines.length - 1]["latlng"];
      lat = latLngArray[latLngArray.length - 1]["lat"];
      lng = latLngArray[latLngArray.length - 1]["lng"];
      startIcon = "../assets/img/end-point.svg";
      contentString = "Ward End";
      this.setMarker(0, lat, lng, startIcon, "", contentString, this.map, scaledHeight, scaledWidth, point1, point2, false, "map");
    }

    for (let index = 0; index < this.allLines.length; index++) {
      let lineNo = index + 1;
      let status = null;
      if (this.wardLineStatus != null) {
        if (this.wardLineStatus[lineNo] != null)
          status = this.wardLineStatus[lineNo]["Status"];
      }
      let latlng = this.allLines[index]["latlng"];
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: this.commonService.getLineColor(status),
        strokeWeight: 2,
      });

      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);
    }
    this.showVehicleMovement();
  }

  setMarker(i: any, lat: any, lng: any, markerURL: any, markerLabel: any, contentString: any, map: any, scaledHeight: any, scaledWidth: any, point1: any, point2: any, isAnimation: any, type: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: map,
      label: {
        text: " " + markerLabel + " ",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
      },
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(scaledHeight, scaledWidth),
        origin: new google.maps.Point(0, 0),
        labelOrigin: new google.maps.Point(point1, point2),
      },
    });

    let infowindowEnd = new google.maps.InfoWindow({
      content: contentString,
    });

    marker.addListener("click", function () {
      infowindowEnd.open(map, marker);
    });

    if (type == "halt") {
      this.haltMarkerList.push({ marker });
    }
    if (type == "haltShow") {
      this.haltMarkerList[i]["marker"] = marker;
    }
    if (isAnimation == true) {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
    this.allMarkers.push({ marker });
  }

  getpeopleAtWork() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getpeopleAtWork");
    let dbPath = "DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
    let dutyInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      this.instancesList.push({ instances: dutyInstance });
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getpeopleAtWork", data);
        let counts = 0;
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let empId = keyArray[i];

          for (let j = 1; j < 10; j++) {
            let taskData = data[empId]["task" + j];
            if (taskData == undefined) { break; };
            let isOn = true;
            let task = taskData["in-out"];
            let inOutList = Object.values(task);
            for (let k = inOutList.length - 1; k >= 0; k--) {
              if (inOutList[k] == "Out") {
                isOn = false;
                k == -1;
              }
            }
            if (isOn == true) {
              counts++;
            }
          }
        }
        this.workerDetails.peopleAtWork = counts.toString();
      }
    });
  }

  getGarageWorkDutyOn() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getGarageWorkDutyOn");
    this.garageDutyList = [];
    let dbPath = "DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate;
    let garageInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      garageInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getGarageWorkDutyOn", data);
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            for (let j = 1; j <= 5; j++) {
              if (data[empId]["task" + j] != null) {
                if (data[empId]["task" + j]["task"] == "GarageWork") {
                  let dutyOnTime = "";
                  let dutyOffTime = "";
                  if (Object.keys(data[empId]["task" + j + ""]["in-out"])[0] != null) {
                    dutyOnTime = this.commonService.tConvert(
                      Object.keys(data[empId]["task" + j + ""]["in-out"])[0]
                    );
                    let removeSecond = dutyOnTime.split(" ");
                    dutyOnTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  }
                  if (Object.keys(data[empId]["task" + j + ""]["in-out"])[1] != null) {
                    dutyOffTime = this.commonService.tConvert(Object.keys(data[empId]["task" + j + ""]["in-out"])[1]);
                    let removeSecond = dutyOffTime.split(" ");
                    dutyOffTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  }
                  if (this.garageDutyList.length == 0) {
                    this.workerDetails.garageWorkDutyCount = "1";
                    this.garageDutyList.push({ empId: empId, name: "", dutyOnTime: dutyOnTime, dutyOffTime: dutyOffTime, mobile: "", designation: "", });
                  } else {
                    let empDetails = this.garageDutyList.find((item) => item.empId == empId);
                    if (empDetails != undefined) {
                      empDetails.dutyOnTime = empDetails.dutyOnTime + " <br/> " + dutyOnTime;
                      empDetails.dutyOffTime = empDetails.dutyOffTime + " <br/> " + dutyOffTime;
                    } else {
                      this.workerDetails.garageWorkDutyCount = (Number(this.workerDetails.garageWorkDutyCount) + 1).toString();
                      this.garageDutyList.push({ empId: empId, name: "", dutyOnTime: dutyOnTime, dutyOffTime: dutyOffTime, mobile: "", designation: "", });
                    }
                  }
                  this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                    let empDetails = this.garageDutyList.find((item) => item.empId == empId);
                    if (empDetails != undefined) {
                      empDetails.name = employee["name"];
                      empDetails.mobile = employee["mobile"];
                      if (employee["designation"] == "Transportation Executive") {
                        empDetails.designation = "driver";
                      } else if (employee["designation"].toString().trim() == "Service Excecutive") {
                        empDetails.designation = "helper";
                      }
                    }
                  });
                }
              }
            }
          }
          for (let i = 0; i < this.garageDutyList.length; i++) {
            if (this.garageDutyList[i]["dutyOffTime"] == "") {
              this.workerDetails.garageWorkActiveDutyCount = (Number(this.workerDetails.garageWorkActiveDutyCount) + 1).toString();
            }
          }
        }
      }
    });
  }

  openMapModelGarage(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 880;
    let width = 570;
    height = (windowHeight * 90) / 100;
    let divHeight = height - 90 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px");
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "29px");
    $("#divVehicle").css("height", divHeight);
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
  wardNo: string;
  wardName: string;
  startTime: string;
  endTime: string;
  haltTime: string;
  currentHaltTime: string;
  totalTime: string;
  wardTime: string;
  totalKM: string;
  wardKM: string;
  speed: string;
  totalWard: string;
  completedWard: string;
  activeWard: string;
  inActiveWard: string;
  stopWard: string;
  totalLines: string;
  completedLines: string;
  skippedLines: string;
  applicationStatus: string;
  lastUpdateTime: string;
  wardReachTime: string;
  currentLine: string;
  vehicleCurrentLocation: string;
  tripCount: string;
  totalUnAssignedVehicle: string;
  peopleAtWork: string;
  garageWorkDutyCount: string;
  garageWorkActiveDutyCount: string;
}

export class graphHeaders {
  date: string;
  workprogress: string;
}
