import { Subscription } from 'rxjs';
import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-ward-trip-analysis",
  templateUrl: "./ward-trip-analysis.component.html",
  styleUrls: ["./ward-trip-analysis.component.scss"],
})
export class WardTripAnalysisComponent implements OnInit {
  constructor(private commonService: CommonService, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService) { }
  tripList: any[];
  zoneList: any[];
  selectedDate: any;
  currentYear: any;
  currentMonthName: any;
  dbPath: any;
  userId: any;
  filledStatus: any;
  overLoad: any;
  remarkStatus: any;
  allZoneList: any[];
  selectedZone: any[];
  selectedTrip: any[];
  imageNotAvailablePath = "../assets/img/img-not-available-01.jpg";
  tripDetail: any;
  tripData: tripDetail = {
    pendingAnalysis: "0",
    refreshTime: "00:00:00",
    driverName: "",
    driverMobile: "",
    startTime: "00:00:00",
    analysisDetail: "",
    imageUrl: "",
    imageUrl1: "",
    remark: "",
    filledStatus: "",
    tripCount: 0,
    wasteCollection: 0,
    manualRemarks: "",
    overLoad: ""
  };
  cityName: any;
  db: any;
  txtManualRemark = "#txtManualRemark";
  serviceName = "trip-analysis";
  imageCurrentRotation1: any;
  imageCurrentRotation2: any;
  imageHeight1: any;
  imageWidth1: any;
  isFirstClick1: any;
  imageHeight2: any;
  imageWidth2: any;
  isFirstClick2: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Monitoring", "Trip-Analysis", localStorage.getItem("userID"));
    this.setDefaultValues();
    this.getPendingAnalysis();
    this.getWardTrips();
  }

  rotateImage(type: any) {
    const rotations = ['rotate0', 'rotate90', 'rotate180', 'rotate270'];
    if (type == 1) {
      const currentIndex = rotations.indexOf(this.imageCurrentRotation1);
      const nextIndex = (currentIndex + 1) % rotations.length;
      this.imageCurrentRotation1 = rotations[nextIndex];
      if (this.isFirstClick1 == "yes") {
        var img = (<HTMLElement>document.getElementById("slideImg1"));
        var rect = img.getBoundingClientRect();
        this.imageHeight1 = rect.height;
        this.imageWidth1 = rect.width;
        this.isFirstClick1 = "no";
      }
      if (this.imageCurrentRotation1 == "rotate90" || this.imageCurrentRotation1 == "rotate270") {
        (<HTMLElement>document.getElementById("slideImg1")).style.height = this.imageWidth1 + "px";
        (<HTMLElement>document.getElementById("slideImg1")).style.width = this.imageHeight1 + "px";
      }
      else {
        (<HTMLElement>document.getElementById("slideImg1")).style.height = this.imageHeight1 + "px";
        (<HTMLElement>document.getElementById("slideImg1")).style.width = this.imageWidth1 + "px";
      }
      $("#slideImg1").removeClass((<HTMLElement>document.getElementById("slideImg1")).className);
      $("#slideImg1").addClass(this.imageCurrentRotation1);
    }
    else {
      const currentIndex = rotations.indexOf(this.imageCurrentRotation2);
      const nextIndex = (currentIndex + 1) % rotations.length;
      this.imageCurrentRotation2 = rotations[nextIndex];
      if (this.isFirstClick2 == "yes") {
        var img = (<HTMLElement>document.getElementById("slideImg2"));
        var rect = img.getBoundingClientRect();
        this.imageHeight2 = rect.height;
        this.imageWidth2 = rect.width;
        this.isFirstClick2 = "no";
      }
      if (this.imageCurrentRotation2 == "rotate90" || this.imageCurrentRotation2 == "rotate270") {
        (<HTMLElement>document.getElementById("slideImg2")).style.height = this.imageWidth2 + "px";
        (<HTMLElement>document.getElementById("slideImg2")).style.width = this.imageHeight2 + "px";
      }
      else {
        (<HTMLElement>document.getElementById("slideImg2")).style.height = this.imageHeight2 + "px";
        (<HTMLElement>document.getElementById("slideImg2")).style.width = this.imageWidth2 + "px";
      }
      $("#slideImg2").removeClass((<HTMLElement>document.getElementById("slideImg2")).className);
      $("#slideImg2").addClass(this.imageCurrentRotation2);
    }
  }

  setDefaultValues() {
    this.isFirstClick1 = "yes";
    this.isFirstClick2 = "yes";
    this.allZoneList = [];
    this.zoneList = [];
    this.tripData.imageUrl = this.imageNotAvailablePath;
    this.tripData.imageUrl1 = this.imageNotAvailablePath;
    this.selectedDate = this.commonService.setTodayDate();
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.filledStatus = "";
    this.remarkStatus = "";
    this.overLoad = "";
    this.userId = localStorage.getItem("userID");
    this.allZoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.imageCurrentRotation1 = "rotate0";
    this.imageCurrentRotation2 = "rotate0";
  }

  getPendingAnalysis() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getPendingAnalysis");
    this.dbPath = "WardTrips/TotalTripAnalysisPending";
    let pendingInstance = this.db
      .object(this.dbPath)
      .valueChanges()
      .subscribe((data) => {
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPendingAnalysis", data);
          this.tripData.pendingAnalysis = data.toString();
        }
      });
  }



  getWardTrips() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardTrips");
    this.zoneList = [];
    if (this.allZoneList.length > 0) {
      for (let i = 1; i < this.allZoneList.length; i++) {
        let zoneNo = this.allZoneList[i]["zoneNo"];
        let zoneName = this.allZoneList[i]["zoneName"];
        this.dbPath = "WardTrips/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + zoneNo;
        let tripInstance = this.db.object(this.dbPath).valueChanges().subscribe((data) => {
          tripInstance.unsubscribe();
          let iconClass = "fas fa-ellipsis-h";
          let divClass = "address md-background";
          let tripList = [];
          let tripCount = 0;
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardTrips", data);
            iconClass = "fas fa-check-double";
            divClass = "address";
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              tripCount = keyArray.length;
              let tripAnalysisCount = 0;
              for (let j = 0; j < keyArray.length; j++) {
                let tripID = keyArray[j];
                let driverId = data[tripID]["driverId"];
                let driverName = "";
                let driverMobile = "";
                let time = data[tripID]["time"];
                let filledStatus = "";
                let analysisAt = "";
                let analysisBy = "";
                let remark = "";
                let imageName = "";
                let imageName2 = "";
                let manualRemarks = "";
                let overLoad = "";
                let vehicleType = data[tripID]["vehicle"].split('-')[0];
                if (data[tripID]["filledStatus"] != null) {
                  filledStatus = data[tripID]["filledStatus"];
                }
                if (data[tripID]["analysisAt"] != null) {
                  analysisAt = data[tripID]["analysisAt"];
                }
                if (data[tripID]["analysisBy"] != null) {
                  analysisBy = data[tripID]["analysisBy"];
                  tripAnalysisCount++;
                }
                if (data[tripID]["remark"] != null) {
                  remark = data[tripID]["remark"];
                }
                if (data[tripID]["manualRemarks"] != null) {
                  manualRemarks = data[tripID]["manualRemarks"];
                }
                if (data[tripID]["overLoad"] != null) {
                  overLoad = data[tripID]["overLoad"];
                }
                if (data[tripID]["imageName"] != null) {
                  imageName = data[tripID]["imageName"];
                }
                if (data[tripID]["imageName2"] != null) {
                  imageName2 = data[tripID]["imageName2"];
                }
                this.commonService.getEmplyeeDetailByEmployeeId(driverId).then((employee) => {
                  driverName =
                    employee["name"] != null
                      ? employee["name"].toUpperCase()
                      : "---";
                  driverMobile =
                    employee["mobile"] != null ? employee["mobile"] : "---";
                  tripList.push({
                    tripId: tripID,
                    tripName: "trip " + tripID,
                    driverName: driverName,
                    driverMobile: driverMobile,
                    time: time,
                    filledStatus: filledStatus,
                    analysisAt: analysisAt,
                    analysisBy: analysisBy,
                    remark: remark,
                    imageName: imageName,
                    imageName2: imageName2,
                    vehicleType: vehicleType,
                    manualRemarks: manualRemarks,
                    overLoad: overLoad
                  });
                });
              }
              if (tripAnalysisCount == tripCount) {
                iconClass = "fas fa-diagnoses";
              }
              this.zoneList.push({
                zoneNo: zoneNo,
                zoneName: zoneName,
                divClass: divClass,
                iconClass: iconClass,
                tripList: tripList,
                tripCount: tripCount,
                tripAnalysisCount: tripAnalysisCount
              });
            }
          } else {
            this.zoneList.push({
              zoneNo: zoneNo,
              zoneName: zoneName,
              divClass: divClass,
              iconClass: iconClass,
              tripList: tripList,
              tripCount: tripCount,
              tripAnalysisCount: 0

            });
          }
          if (this.allZoneList.length - 1 == this.zoneList.length) {
            setTimeout(() => {
              let tripFilter = this.zoneList.filter((item) => item.tripCount > 0);
              if (tripFilter.length > 0) {
                tripFilter[0]["divClass"] = "address md-background-active";
                this.getTripZoneData(tripFilter[0]["zoneNo"]);
                this.tripList = tripFilter[0]["tripList"];
                this.getTripData(this.tripList[0]["tripId"]);
              }
            }, 600);

          }
        });
      }
    }
  }

  saveTripDriverDetail(zoneNo: any, tripId: any, driverId: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(driverId).then((employee) => {
      let driverName = employee["name"] != null ? employee["name"].toUpperCase() : "---";
      let driverMobile = employee["mobile"] != null ? employee["mobile"] : "---";
      let path = "WardTrips/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + zoneNo + "/" + tripId;
      this.db.object(path).update({ driverName: driverName, driverMobile: driverMobile });
    });
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
        this.currentYear = this.selectedDate.split("-")[0];
        this.tripList = [];
        this.clearAll();
        this.getWardTrips();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  getTripZoneData(zoneNo: any) {
    this.imageCurrentRotation1 = "rotate0";
    this.imageCurrentRotation2 = "rotate0";
    this.isFirstClick1 = "yes";
    this.isFirstClick2 = "yes";
    $("#slideImg1").removeClass((<HTMLElement>document.getElementById("slideImg1")).className);
    $("#slideImg1").addClass(this.imageCurrentRotation1);
    $("#slideImg2").removeClass((<HTMLElement>document.getElementById("slideImg2")).className);
    $("#slideImg2").addClass(this.imageCurrentRotation2);
    
    (<HTMLElement>document.getElementById("slideImg1")).style.height = "";
    (<HTMLElement>document.getElementById("slideImg1")).style.width = "";
    (<HTMLElement>document.getElementById("slideImg2")).style.height = "";
    (<HTMLElement>document.getElementById("slideImg2")).style.width = "";
    
    for (let i = 1; i <= 8; i++) {
      $('#tripDiv' + i).hide();
    }
    this.selectedZone = zoneNo;
    this.tripData.wasteCollection = 0;
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
    if (zoneDetails != undefined) {
      this.tripList = zoneDetails.tripList;
      this.tripData.tripCount = zoneDetails.tripCount;

      if (this.tripList.length > 0) {
        for (let i = 1; i <= zoneDetails.tripCount; i++) {
          $('#tripDiv' + i).show();
        }
        this.getTripData(this.tripList[0]["tripId"]);
      } else {
        this.commonService.setAlertMessage("error", "No trips are available for analysis on selected date !!!");
      }
      this.setActiveWard(zoneNo);
      this.getTripWasteCollection();
    }
  }

  setActiveWard(zoneNo: any) {
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        if (this.zoneList[i]["divClass"] == "address md-background-active") {
          this.zoneList[i]["divClass"] = "address";
        }
        if (zoneNo == this.zoneList[i]["zoneNo"]) {
          this.zoneList[i]["divClass"] = "address md-background-active";
        }
      }
    }
  }

  getTripData(index: any) {
    this.selectedTrip = index;
    let tripCountForWard = this.tripData.tripCount;
   // if (this.tripData.tripCount > 4) {
   //   tripCountForWard = 4;
   // }
    for (let i = 1; i <= tripCountForWard; i++) {
      let element = <HTMLDivElement>document.getElementById("tripDiv" + i);
      let className = element.className;
      $('#tripDiv' + i).removeClass(className);
      if (i == index) {
        $('#tripDiv' + i).addClass("col-md-3 text-center trip-summary active-trip");
      }
      else {
        $('#tripDiv' + i).addClass("col-md-3 text-center trip-summary");
      }
    }

    let tripDetails = this.tripList.find((item) => item.tripId == index);
    if (tripDetails != undefined) {
      if (tripDetails.imageName != this.imageNotAvailablePath) {
        $("#ImageLoader").show();
      }
      this.tripDetail = tripDetails;
      this.tripData.driverName = tripDetails.driverName;
      this.tripData.driverMobile = "+91 " + tripDetails.driverMobile;
      this.tripData.startTime = tripDetails.time;
      this.tripData.filledStatus = tripDetails.filledStatus;
      this.tripData.remark = tripDetails.remark;
      this.tripData.manualRemarks = tripDetails.manualRemarks;
      this.tripData.overLoad = tripDetails.overLoad;
      this.filledStatus = tripDetails.filledStatus;
      this.remarkStatus = tripDetails.remark;
      this.overLoad = tripDetails.overLoad;
      this.tripData.imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTrips%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + this.selectedZone + "%2F" + this.selectedTrip + "%2F" + tripDetails.imageName + "?alt=media";
      this.tripData.imageUrl1 = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTrips%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + this.selectedZone + "%2F" + this.selectedTrip + "%2F" + tripDetails.imageName2 + "?alt=media";
      this.setOverload();
      this.setFilledStatus();
      this.setTripAnalysis();
      this.setRemarkStatus();
      setTimeout(function () {
        $("#ImageLoader").hide();
      }, 1000);
    }
  }

  getTripWasteCollection() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getTripWasteCollection");
    if (this.tripList.length > 0) {
      for (let i = 0; i < this.tripList.length; i++) {
        let vehicle = this.tripList[i]["vehicleType"];
        this.dbPath = "Settings/WasteCollectionVehicleCapacity/" + vehicle;
        let wasteInstance = this.db.object(this.dbPath).valueChanges().subscribe(
          data => {
            wasteInstance.unsubscribe();
            if (data != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getTripWasteCollection", data);
              this.tripData.wasteCollection = this.tripData.wasteCollection + Number(data);
            }
          }
        );
      }
    }
  }

  setTripAnalysis() {
    if (this.tripDetail.analysisBy != "") {
      this.commonService.getPortalUserDetailById(this.tripDetail.analysisBy).then((userData: any) => {
        if (userData != undefined) {
          let date = this.tripDetail.analysisAt.split(" ");
          let analysisTime = date[0].split("-")[2] + " " + this.commonService.getCurrentMonthName(Number(date[0].split("-")[1]) - 1) + ", " + date[1];
          this.tripData.analysisDetail = "BY : " + userData["name"] + "<br/> (" + analysisTime + ")";
        } else {
          this.commonService.setAlertMessage("error", "Something went wrong, Please logout and login again.");
        }
      });
    } else {
      this.tripData.analysisDetail = "";
    }
  }

  getSelected(id: any) {
    let element = <HTMLInputElement>document.getElementById(id);
    if (id == "chkFilledStatus") {
      if (element.checked == true) {
        this.filledStatus = "yes";
      } else {
        this.filledStatus = "no";
      }
    }
    if (id == "chkRemark") {
      if (element.checked == true) {
        this.remarkStatus = "वाहन पर तिरपाल है";
      } else {
        this.remarkStatus = "";
      }
    }
    if (id == "chkOverLoad") {
      if (element.checked == true) {
        this.overLoad = "yes";
      } else {
        this.overLoad = "";
      }
    }
  }

  setOverload() {
    let element = <HTMLInputElement>document.getElementById("chkOverLoad");
    if (
      this.tripData.overLoad == undefined ||
      this.tripData.overLoad == ""
    ) {
      this.tripData.overLoad = "";
      this.overLoad = "";
    }
    if (this.tripData.overLoad == "yes") {
      element.checked = true;
    } else {
      element.checked = false;
    }
  }

  setFilledStatus() {
    let element = <HTMLInputElement>document.getElementById("chkFilledStatus");
    if (
      this.tripData.filledStatus == undefined ||
      this.tripData.filledStatus == ""
    ) {
      this.tripData.filledStatus = "";
      this.filledStatus = "";
    }
    if (this.tripData.filledStatus == "yes") {
      element.checked = true;
    } else {
      element.checked = false;
    }
  }

  setRemarkStatus() {
    let element = <HTMLInputElement>document.getElementById("chkRemark");
    if (this.tripData.remark == undefined || this.tripData.remark == "") {
      this.tripData.remark = "";
      this.remarkStatus = "";
    }
    if (this.tripData.remark != "") {
      element.checked = true;
    } else {
      element.checked = false;
    }
  }

  saveTripAnalysis() {
    let dbPath = "WardTrips/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedZone + "/" + this.selectedTrip + "";
    this.db.object(dbPath).update({
      filledStatus: this.filledStatus,
      analysisAt: this.commonService.getTodayDateTime(),
      analysisBy: this.userId,
      remark: this.remarkStatus,
      manualRemarks: $(this.txtManualRemark).val(),
      overLoad: this.overLoad
    });
    this.updatePendingAnalysis();
    this.updateTripAndDetails();
    this.setTripAnalysis();
    this.commonService.setAlertMessage("success", "Data has been added successfully.");
  }

  updateTripAndDetails() {
    // set update values into the list
    let data = this.tripList.find((item) => item.tripId == this.selectedTrip);
    data.analysisAt = this.commonService.getTodayDateTime();
    data.analysisBy = this.userId;
    data.remark = this.remarkStatus;
    data.manualRemarks = $(this.txtManualRemark).val();
    data.filledStatus = this.filledStatus;
    data.overLoad = this.overLoad;
    let zondDetail = this.zoneList.find(
      (item) => item.zoneNo == this.selectedZone
    );
    zondDetail.tripList = this.tripList;
    zondDetail.tripAnalysisCount = zondDetail.tripAnalysisCount + 1;
    if (zondDetail.tripAnalysisCount == zondDetail.tripCount) {
      zondDetail.iconClass = "fas fa-diagnoses";
    }
  }

  updatePendingAnalysis() {
    if (this.tripDetail.analysisAt == "") {
      let pendingCountPath = this.db.object("WardTrips/TotalTripAnalysisPending").valueChanges().subscribe((pedingCount) => {
        pendingCountPath.unsubscribe();
        this.db.object("WardTrips").update({
          TotalTripAnalysisPending: Number(pedingCount) - 1,
        });
      });
    }
  }

  clearAll() {
    this.tripData.analysisDetail = "";
    this.tripData.driverMobile = "";
    this.tripData.driverName = "";
    this.tripData.filledStatus = "";
    this.tripData.manualRemarks = "";
    $(this.txtManualRemark).val("");
    this.tripData.imageUrl = this.imageNotAvailablePath;
    this.tripData.imageUrl1 = this.imageNotAvailablePath;
    this.tripData.remark = "";
    this.tripData.startTime = "00:00:00";
    this.tripData.wasteCollection = 0;
    this.tripData.tripCount = 0;
    this.tripData.overLoad = "";
    this.imageCurrentRotation1 = "rotate0";
    this.imageCurrentRotation2 = "rotate0";
    this.isFirstClick1 = "yes";
    this.isFirstClick2 = "yes";
    $("#slideImg1").removeClass((<HTMLElement>document.getElementById("slideImg1")).className);
    $("#slideImg1").addClass(this.imageCurrentRotation1);
    $("#slideImg2").removeClass((<HTMLElement>document.getElementById("slideImg2")).className);
    $("#slideImg2").addClass(this.imageCurrentRotation2);
    (<HTMLElement>document.getElementById("slideImg1")).style.height = "";
    (<HTMLElement>document.getElementById("slideImg1")).style.width = "";
    (<HTMLElement>document.getElementById("slideImg2")).style.height = "";
    (<HTMLElement>document.getElementById("slideImg2")).style.width = "";
    let element = <HTMLInputElement>document.getElementById("chkFilledStatus");
    element.checked = false;
    element = <HTMLInputElement>document.getElementById("chkRemark");
    element.checked = false;
    element = <HTMLInputElement>document.getElementById("chkOverLoad");
    element.checked = false;
  }
}

export class tripDetail {
  pendingAnalysis: string;
  refreshTime: string;
  driverName: string;
  driverMobile: string;
  startTime: string;
  analysisDetail: string;
  imageUrl: string;
  imageUrl1: string;
  remark: string;
  filledStatus: string;
  overLoad: string;
  tripCount: number;
  wasteCollection: number;
  manualRemarks: string;
}
