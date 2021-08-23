import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-ward-trip-analysis",
  templateUrl: "./ward-trip-analysis.component.html",
  styleUrls: ["./ward-trip-analysis.component.scss"],
})
export class WardTripAnalysisComponent implements OnInit {
  constructor(
    private commonService: CommonService,
    public fs: FirebaseService
  ) { }
  tripList: any[];
  zoneList: any[];
  selectedDate: any;
  currentYear: any;
  currentMonthName: any;
  dbPath: any;
  userId: any;
  filledStatus: any;
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
    remark: "",
    filledStatus: "",
    tripCount: 0
  };
  db: any;
  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );
    this.setDefaultValues();
    this.getPendingAnalysis();
    this.getWardTrips();
  }

  setDefaultValues() {
    this.allZoneList = [];
    this.zoneList = [];
    this.tripData.imageUrl = this.imageNotAvailablePath;
    this.selectedDate = this.commonService.setTodayDate();
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.filledStatus = "";
    this.remarkStatus = "";
    this.userId = localStorage.getItem("userID");
    this.allZoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  getPendingAnalysis() {
    this.dbPath = "WardTrips/TotalTripAnalysisPending";
    let pendingInstance = this.db
      .object(this.dbPath)
      .valueChanges()
      .subscribe((data) => {
        if (data != null) {
          this.tripData.pendingAnalysis = data.toString();
        }
      });
  }

  getWardTrips() {
    this.zoneList = [];
    if (this.allZoneList.length > 0) {
      for (let i = 1; i < this.allZoneList.length; i++) {
        let zoneNo = this.allZoneList[i]["zoneNo"];
        let zoneName = this.allZoneList[i]["zoneName"];
        this.dbPath =
          "WardTrips/" +
          this.currentYear +
          "/" +
          this.currentMonthName +
          "/" +
          this.selectedDate +
          "/" +
          zoneNo;
        let tripInstance = this.db
          .object(this.dbPath)
          .valueChanges()
          .subscribe((data) => {
            tripInstance.unsubscribe();
            let iconClass = "fas fa-ellipsis-h";
            let divClass = "address md-background";
            let tripList = [];
            let tripCount = 0;
            if (data != null) {
              iconClass = "fas fa-check-double";
              divClass = "address";
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                tripCount = keyArray.length;
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
                  if (data[tripID]["filledStatus"] != null) {
                    filledStatus = data[tripID]["filledStatus"];
                  }
                  if (data[tripID]["analysisAt"] != null) {
                    analysisAt = data[tripID]["analysisAt"];
                  }
                  if (data[tripID]["analysisBy"] != null) {
                    analysisBy = data[tripID]["analysisBy"];
                  }
                  if (data[tripID]["remark"] != null) {
                    remark = data[tripID]["remark"];
                  }
                  if (data[tripID]["imageName"] != null) {
                    imageName = data[tripID]["imageName"];
                  }
                  this.commonService
                    .getEmplyeeDetailByEmployeeId(driverId)
                    .then((employee) => {
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

                      });
                    });
                }
                this.zoneList.push({
                  zoneNo: zoneNo,
                  zoneName: zoneName,
                  divClass: divClass,
                  iconClass: iconClass,
                  tripList: tripList,
                  tripCount: tripCount
                });
              }
            } else {
              this.zoneList.push({
                zoneNo: zoneNo,
                zoneName: zoneName,
                divClass: divClass,
                iconClass: iconClass,
                tripList: tripList,
                tripCount: tripCount
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

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate(
        $("#txtDate").val(),
        1
      );
      this.selectedDate = previousDate;
    }

    if (
      new Date(this.selectedDate.toString()) <=
      new Date(this.commonService.setTodayDate())
    ) {
      $("#txtDate").val(this.selectedDate);
      this.currentMonthName = this.commonService.getCurrentMonthName(
        new Date(this.selectedDate).getMonth()
      );
      this.currentYear = this.selectedDate.split("-")[0];
      this.tripList = [];
      this.clearAll();
      this.getWardTrips();
    } else {
      this.commonService.setAlertMessage(
        "error",
        "Selected date is greater then today date."
      );
    }
  }

  getTripZoneData(zoneNo: any) {
    this.selectedZone = zoneNo;
    let zoneDetails = this.zoneList.find((item) => item.zoneNo == zoneNo);
    if (zoneDetails != undefined) {
      this.tripList = zoneDetails.tripList;
      this.tripData.tripCount = zoneDetails.tripCount;
      if (this.tripList.length > 0) {
        this.getTripData(this.tripList[0]["tripId"]);
      } else {
        this.commonService.setAlertMessage(
          "error",
          "No trips are available for analysis on selected date !!!"
        );
      }
      this.setActiveWard(zoneNo);
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
    $("#ddlTrip").val(this.selectedTrip);
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
      this.filledStatus = tripDetails.filledStatus;
      this.remarkStatus = tripDetails.remark;
      this.tripData.imageUrl =
        "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" +
        this.commonService.getFireStoreCity() +
        "%2FWardTrips%2F" +
        this.currentYear +
        "%2F" +
        this.currentMonthName +
        "%2F" +
        this.selectedDate +
        "%2F" +
        this.selectedZone +
        "%2F" +
        this.selectedTrip +
        "%2F" +
        tripDetails.imageName +
        "?alt=media";

      this.setFilledStatus();
      this.setTripAnalysis();
      this.setRemarkStatus();
      setTimeout(function () {
        $("#ImageLoader").hide();
      }, 1000);
    }
  }

  setTripAnalysis() {
    if (this.tripDetail.analysisBy != "") {
      let userData = this.commonService.getPortalUserDetailById(
        this.tripDetail.analysisBy
      );
      if (userData != undefined) {
        let date = this.tripDetail.analysisAt.split(" ");
        let analysisTime =
          date[0].split("-")[2] +
          " " +
          this.commonService.getCurrentMonthName(
            Number(date[0].split("-")[1]) - 1
          ) +
          ", " +
          date[1];
        this.tripData.analysisDetail =
          "BY : " + userData["name"] + "<br/> (" + analysisTime + ")";
      } else {
        this.commonService.setAlertMessage(
          "error",
          "Something went wrong, Please logout and login again."
        );
      }
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
    let dbPath =
      "WardTrips/" +
      this.currentYear +
      "/" +
      this.currentMonthName +
      "/" +
      this.selectedDate +
      "/" +
      this.selectedZone +
      "/" +
      this.selectedTrip +
      "";
    this.db.object(dbPath).update({
      filledStatus: this.filledStatus,
      analysisAt: this.commonService.getTodayDateTime(),
      analysisBy: this.userId,
      remark: this.remarkStatus,
    });
    this.updatePendingAnalysis();
    this.updateTripAndDetails();
    this.setTripAnalysis();
    this.commonService.setAlertMessage(
      "success",
      "Data has been added successfully."
    );
  }

  updateTripAndDetails() {
    // set update values into the list
    let data = this.tripList.find((item) => item.tripId == this.selectedTrip);
    data.analysisAt = this.commonService.getTodayDateTime();
    data.analysisBy = this.userId;
    data.remark = this.remarkStatus;
    data.filledStatus = this.filledStatus;
    let zondDetail = this.zoneList.find(
      (item) => item.zoneNo == this.selectedZone
    );
    zondDetail.tripList = this.tripList;
  }

  updatePendingAnalysis() {
    if (this.tripDetail.analysisAt == "") {
      let pendingCountPath = this.db
        .object("WardTrips/TotalTripAnalysisPending")
        .valueChanges()
        .subscribe((pedingCount) => {
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
    this.tripData.imageUrl = this.imageNotAvailablePath;
    this.tripData.remark = "";
    this.tripData.startTime = "00:00:00";
    let element = <HTMLInputElement>document.getElementById("chkFilledStatus");
    element.checked = false;
    element = <HTMLInputElement>document.getElementById("chkRemark");
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
  remark: string;
  filledStatus: string;
  tripCount: number
}
