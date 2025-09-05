
import { Component, OnInit, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { MapService } from "../../services/map/map.service";
import * as $ from "jquery";
import { ToastrService } from "ngx-toastr";
import { Router, } from "@angular/router";
import { CmsComponent } from "../../cms/cms.component";
import { ConnectionService } from 'ng-connection-service';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}

export const ROUTES: RouteInfo[] = [
  { path: "/dashboard", title: "Dashboard", icon: "design_app", class: "" },
];

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"],
})
export class SidebarComponent implements OnInit {
  @ViewChild("contentInternetCheck", null) contentInternetCheck: any;
  @ViewChild('contentSecondCity', null) contentSecondCity: any;
  userid: any;
  isShow: any;
  accessList: any[];
  portalAccessList: any[];
  userType: any;
  db: any;
  userDetail: userDetail = {
    name: "",
    homeLink: "/home",
    changePasswordLink: "/change-password",
  };
  menuItems: any[];
  citySelectionList: any[] = [];
  jaipurCityList: any[] = [];

  constructor(private connectionService: ConnectionService, public fb: FirebaseService, private modalService: NgbModal, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService, public router: Router) { }

  zoneList: any[];
  toDayDate: any;
  haltDetails: any[];
  wardIndex: number;
  runningTasks: any[];
  currentMonth: any;
  currentYear: any;
  skippedLines: any[] = [];
  pickDustbins: any[];
  planList: any[];
  geoList: any[];
  cityName: any;
  accessCity: any[] = [];
  isConnected = true;
  noInternetConnection: boolean;
  isDehradun: boolean;
  isActual: any;

  ngOnInit() {
    this.checkLoginDate();
    this.setDefault();
  }

  setDefault() {
    this.isDehradun = false;
    this.cityName = localStorage.getItem("cityName");
    this.commonService.setStoragePath(this.cityName);
    this.db = this.fb.getDatabaseByCity(this.cityName);
    this.isActual = localStorage.getItem("isActual");
    this.accessCity = JSON.parse(localStorage.getItem("accessCity"));
    if (this.accessCity.length > 1) {
      $("#liCity").show();
    }
    if (this.cityName == "jaipur") {
      $("#cityName").html("Jaipur D2D");
    }
    else {
      $("#cityName").html(this.commonService.getCityName(this.cityName));
    }
    if (this.cityName == "dehradun" || this.cityName == "test") {
      this.isDehradun = true;
    }
    let element = <HTMLImageElement>document.getElementById("cityImage");
    element.src = this.getCityIcon(this.cityName);

    this.userid = localStorage.getItem("userID");
    if (localStorage.getItem("isCityChange") == "yes") {
      localStorage.setItem("isCityChange", "no");
      this.commonService.setLocalStorageData(this.db);
      setTimeout(() => {
        this.commonService.setNotificationPermissions(this.userid);
      }, 2000);
    }
    this.userDetail.homeLink = "/" + this.cityName + "/home";
    this.userDetail.changePasswordLink = "/" + this.cityName + "/change-password";
    this.toDayDate = this.commonService.setTodayDate();
    let date = localStorage.getItem("date");
    if (date != null) {
      if (this.toDayDate != date) {
        localStorage.setItem("date", this.toDayDate);
        localStorage.setItem("skipLines", null);
        localStorage.setItem("pickDustbins", null);
        localStorage.setItem("geoSurfing", null);
      }
    } else {
      localStorage.setItem("date", this.toDayDate);
    }

    if (this.userid != null) {
      this.userType = localStorage.getItem("userType");
      this.portalAccessList = [];
      this.portalAccessList = JSON.parse(localStorage.getItem("portalAccess"));
      setTimeout(() => {
        this.getUserAccess();
        this.wardIndex = 1;
        this.haltDetails = [];
        this.pickDustbins = [];
        this.toDayDate = this.commonService.setTodayDate();
        this.currentMonth = this.commonService.getCurrentMonthName(
          new Date(this.toDayDate).getMonth()
        );
        this.currentYear = new Date().getFullYear();
        this.getZoneList();
        if (localStorage.getItem("notificationHalt") == "1") {
          this.getHalts();
        }
        if (localStorage.getItem("notificationMobileDataOff") == "1") {
          this.notifyMobileDataOff();
          let dataInterval = interval(180000).subscribe((val) => {
            if (localStorage.getItem("notificationMobileDataOff") == "1") {
              this.notifyMobileDataOff();
            }
          });
          this.commonService.notificationInterval = dataInterval;
        }
        if (localStorage.getItem("notificationSkippedLines") == "1") {
          this.skippedLines = JSON.parse(localStorage.getItem("skipLines"));
          if (this.skippedLines == null) {
            this.skippedLines = [];
          }
          this.getSkippedLines();
        }

        if (localStorage.getItem("notificationPickDustbins") == "1") {
          this.planList = JSON.parse(localStorage.getItem("pickDustbins"));
          if (this.planList == null) {
            this.planList = [];
          }
          this.getDustbinPicked();
        }

        if (localStorage.getItem("notificationGeoSurfing") == "1") {
          this.geoList = JSON.parse(localStorage.getItem("geoSurfing"));
          if (this.geoList == null) {
            this.geoList = [];
          }
          this.getGeoSurfing();
        }
      }, 2000);
    }
  }

  getCityIcon(cityName: any) {
    let icon = "./assets/img/sikar.svg";
    if (cityName == "reengus") {
      icon = "./assets/img/reengus.svg";
    } else if (cityName == "test") {
      icon = "./assets/img/test.svg";
    } else if (cityName == "jaipur") {
      icon = "./assets/img/jaipur.svg";
    } else if (cityName == "jaipur-office") {
      icon = "./assets/img/jaipur-office.svg";
    } else if (cityName == "jaipur-greater") {
      icon = "./assets/img/jaipur_greater.svg";
    } else if (cityName == "kishangarh") {
      icon = "./assets/img/kishangarh.svg";
    } else if (cityName == "niwai") {
      icon = "./assets/img/niwai.svg";
    } else if (cityName == "jaisalmer") {
      icon = "./assets/img/jaisalmer.svg";
    } else if (cityName == "salasar") {
      icon = "./assets/img/salasar.svg";
    } else if (cityName == "behror") {
      icon = "./assets/img/behror.svg";
    }
    return icon;
  }

  changeCity(cityName: any) {
    localStorage.removeItem("mapUpdateHistory");
    this.commonService.setStoragePath(cityName);
    localStorage.setItem("cityName", cityName);
    localStorage.setItem("isCityChange", "yes");
    this.setDefault();
    this.closeMapModel();
    this.router.navigate(["/" + cityName + "/home"]);
  }

  getGeoSurfing() {
    if (this.zoneList.length > 0) {
      for (let i = 1; i < this.zoneList.length; i++) {
        let zoneNo = this.zoneList[i]["zoneNo"];
        let dbPath = "GeoGraphicallySurfingHistory/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.toDayDate + "";
        let geoInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
          if (localStorage.getItem("notificationGeoSurfing") == "1") {
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                let tripList = [];
                for (let j = 0; j < keyArray.length; j++) {
                  let index = keyArray[j];
                  let remark = data[index];
                  tripList.push({ remark: remark });
                  if (remark == "ward-out") {
                    let message = "Ward " + zoneNo + " driver is going to out of ward";
                    this.sendGeoNotification(zoneNo, index, remark, message);
                  } else if (remark == "collectionPoint1-in") {
                    let message = "Ward " + zoneNo + " driver reached at Collection Point 1";
                    this.sendGeoNotification(zoneNo, index, remark, message);
                  } else if (remark == "dumpingYard-in") {
                    let message = "Ward " + zoneNo + " driver reached at Dumping Yard";
                    this.sendGeoNotification(zoneNo, index, remark, message);
                  } else if (remark == "collectionPoint2-in") {
                    let message = "Ward " + zoneNo + " driver reached at Collection Point 2";
                    this.sendGeoNotification(zoneNo, index, remark, message);
                  } else if (remark == "plant-in") {
                    let message = "Ward " + zoneNo + " driver reached at Composting Plant";
                    this.sendGeoNotification(zoneNo, index, remark, message);
                  }
                }
                //this.getTrip(zoneNo, tripList);
              }
            }
          }
        });
      }
    }
  }

  getTrip(ZoneNo: any, tripList: any) {
    let tripCount = 0;
    if (tripList.length > 1) {
      for (let i = 0; i < tripList.length; i++) {
        if (tripList[i]["remark"] == "collectionPoint1-in") {
          tripCount = tripCount + 1;
        } else if (tripList[i]["remark"] == "collectionPoint2-in") {
          tripCount = tripCount + 1;
        } else if (tripList[i]["remark"] == "dumpingYard-in") {
          tripCount = tripCount + 1;
        } else if (tripList[i]["remark"] == "plant-in") {
          tripCount = tripCount + 1;
        }
      }
    }
    let lastWardStatus = tripList[tripList.length - 1]["remark"];
    if (lastWardStatus == "ward-in") {
      lastWardStatus = "Ward In";
    } else if (lastWardStatus == "ward-out") {
      lastWardStatus = "Ward Out";
    } else if (lastWardStatus == "office-in") {
      lastWardStatus = "Office In";
    } else if (lastWardStatus == "office-out") {
      lastWardStatus = "Office Out";
    } else if (lastWardStatus == "petrolPump-in") {
      lastWardStatus = "Petrol Pump In";
    } else if (lastWardStatus == "petrolPump-out") {
      lastWardStatus = "Petrol Pump Out";
    } else if (lastWardStatus == "collectionPoint1-in") {
      lastWardStatus = "Collection Point 1 In";
    } else if (lastWardStatus == "collectionPoint1-out") {
      lastWardStatus = "Collection Point 1 Out";
    } else if (lastWardStatus == "collectionPoint2-in") {
      lastWardStatus = "Collection Point 2 In";
    } else if (lastWardStatus == "collectionPoint2-out") {
      lastWardStatus = "Collection Point 2 Out";
    } else if (lastWardStatus == "dumpingYard-in") {
      lastWardStatus = "Dumping Yard In";
    } else if (lastWardStatus == "dumpingYard-out") {
      lastWardStatus = "Dumping Yard Out";
    } else if (lastWardStatus == "plant-in") {
      lastWardStatus = "Composting Plant In";
    } else if (lastWardStatus == "plant-out") {
      lastWardStatus = "Composting Plant Out";
    }
    let dbPath = "WasteCollectionInfo/" + ZoneNo + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.toDayDate + "/Summary";
    this.db.object(dbPath).update({ vehicleCurrentLocation: lastWardStatus, });
  }

  sendGeoNotification(zoneNo: any, time: any, remark: any, message: any) {
    this.geoList = JSON.parse(localStorage.getItem("geoSurfing"));
    if (this.geoList == null) {
      this.geoList = [];
    }
    let geoListDetails = this.geoList.find((item) => item.zoneNo == zoneNo && item.time == time && item.isSent == true);
    if (geoListDetails == undefined) {
      this.geoList.push({
        zoneNo: zoneNo,
        time: time,
        remark: remark,
        isSent: true,
      });
      let notificationTime = new Date(this.toDayDate + " " + time);
      let currentTime = new Date();
      let timeDiff = this.commonService.timeDifferenceMin(currentTime, notificationTime);

      if (timeDiff < 15) {
        let cssClass = "alert alert-danger alert-with-icon";
        this.setNotificationAlert(message, cssClass);
      }
      localStorage.setItem("geoSurfing", JSON.stringify(this.geoList));
    }
  }

  getUserAccess() {
    this.accessList = [];
    if (this.portalAccessList != null) {
      let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
      if (userAccessList != null) {
        for (let i = 0; i < userAccessList.length; i++) {
          if (userAccessList[i]["parentId"] == 0 && userAccessList[i]["userId"] == this.userid && userAccessList[i]["city"] == this.cityName) {
            let url = "javaScript:void(0);";
            let isOuterUrl = "no";
            if (userAccessList[i]["url"].includes("https")) {
              isOuterUrl = "yes";
              let newUrl = userAccessList[i]["url"].split("https://mainportal-react.web.app/userId/")[1];

              url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userid + "/" + newUrl;

              if (userAccessList[i]["url"].includes("dehradun-pmc")) {
                if (this.isDehradun == true) {
                  let userType = "1";
                  if (localStorage.getItem("userType") != "Internal User") {
                    userType = "2";
                  }
                  url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userid + "/" + userType + "/" + newUrl;

                  this.accessList.push({ name: userAccessList[i]["name"], url: url, isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], isOuterUrl: isOuterUrl });
                }
              }
              else {
                this.accessList.push({ name: userAccessList[i]["name"], url: url, isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], isOuterUrl: isOuterUrl });
              }
            }
            else {
              if (userAccessList[i]["url"].includes("task-manager")) {
                if (localStorage.getItem("officeAppUserId") != null) {
                  this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + "/" + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], isOuterUrl: isOuterUrl });
                }
              }
              else if (userAccessList[i]["url"].includes("/cms/22")) {
                if (this.isDehradun == true) {
                  this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + "/" + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], isOuterUrl: isOuterUrl });
                }
              }
              else if (userAccessList[i]["url"].includes("/cms/21")) {
                if (this.cityName == "jaipur-greater" || this.cityName == "dehradun" || this.cityName == "test") {
                  this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + "/" + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], isOuterUrl: isOuterUrl });
                }
              }
              else if (userAccessList[i]["url"].includes("deharadun-pmc")) {
                if (this.isDehradun == true) {
                  this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + "/" + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], isOuterUrl: isOuterUrl });
                }
              }
              else {
                this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + "/" + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], isOuterUrl: isOuterUrl });
              }
            }

          }
        }
      }
    }
  }

  // picked Dustbin Start

  getDustbinPicked() {
    let dbPath = "DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonth + "/" + this.toDayDate + "";
    let pickInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      if (localStorage.getItem("notificationPickDustbins") == "1") {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let dustbinIndex = keyArray[i];
              let dustbinData = data[dustbinIndex];
              let planArray = Object.keys(dustbinData);
              if (planArray.length > 0) {
                for (let j = 0; j < planArray.length; j++) {
                  let planIndex = planArray[j];
                  if (dustbinData[planIndex]["endTime"] != null) {
                    let address = dustbinData[planIndex]["address"];
                    dbPath = "DustbinData/DustbinPickingPlans/" + this.toDayDate + "/" + planIndex + "/planName";
                    let palnInstance = this.db.object(dbPath).valueChanges().subscribe((palnData) => {
                      palnInstance.unsubscribe();
                      if (palnData != null) {
                        let planDetails = this.planList.find((item) => item.planId == planIndex && item.dustbinId == dustbinIndex);
                        if (planDetails == undefined) {
                          this.planList = JSON.parse(
                            localStorage.getItem("pickDustbins")
                          );
                          if (this.planList == null) {
                            this.planList = [];
                          }
                          this.planList.push({
                            planId: planIndex,
                            dustbinId: dustbinIndex,
                            planName: palnData,
                            address: address,
                            isSend: true,
                          });
                          let notificationTime = new Date(dustbinData[planIndex]["endTime"]);
                          let currentTime = new Date();
                          let timeDiff = this.commonService.timeDifferenceMin(currentTime, notificationTime);
                          if (timeDiff < 15) {
                            let message = "Dustbin Picked for Plan " + palnData + " at address " + address;
                            let cssClass = "alert alert-danger alert-with-icon";
                            this.setNotificationAlert(message, cssClass);
                          }
                          localStorage.setItem("pickDustbins", JSON.stringify(this.planList));
                        }
                      }
                    });
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  // picked Dustbin End

  isMobileMenu() {
    if (window.innerWidth > 991) {
      return false;
    }
    return true;
  }

  getZoneList() {
    this.toDayDate = this.commonService.setTodayDate();
    this.zoneList = [];
    this.zoneList = this.mapService.getZones(this.toDayDate);
  }

  getHalts() {
    let wardNo = this.zoneList[this.wardIndex].zoneNo;
    this.getWardWiseHalts(wardNo);
  }

  getWardWiseHalts(wardNo: string) {
    var dt = new Date();
    let haltCheckPath = "HaltInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.toDayDate;
    let halts = this.db.list(haltCheckPath).valueChanges().subscribe((haltData) => {
      if (localStorage.getItem("notificationHalt") == "1") {
        this.wardIndex++;
        if (haltData.length > 0) {
          let currentTime = new Date(dt.getTime() - 10 * 60000);
          let startTime = haltData[haltData.length - 1]["startTime"];
          let endTime = haltData[haltData.length - 1]["endTime"];
          let hatlTime = new Date(this.toDayDate + " " + startTime);
          if (hatlTime > currentTime) {
            let halt = this.haltDetails.find(
              (item) => item.wardNo == wardNo && item.startTime == startTime
            );
            if (halt == undefined) {
              this.haltDetails.push({
                wardNo: wardNo,
                date: this.toDayDate,
                startTime: startTime,
                notified: false,
              });
            }
          }
          this.notifyHalts();
        }
        if (this.zoneList[this.wardIndex] != undefined) {
          this.getWardWiseHalts(this.zoneList[this.wardIndex].zoneNo);
        }
      }
    });
  }

  notifyHalts() {
    for (let index = 0; index < this.haltDetails.length; index++) {
      let record = this.haltDetails.find((item) => item.notified == false);
      if (record != undefined) {
        let message = "ward " + record.wardNo + " driver is stopped working, he stopped at " + record.startTime;
        let cssClass = "alert alert-danger alert-with-icon";
        this.setNotificationAlert(message, cssClass);
        record.notified = true;
      }
    }
  }

  notifyMobileDataOff() {
    this.getRunningTasks();
    return false;
  }

  getRunningTasks() {
    var dt = new Date();
    let Vehicle = this.db.list("Vehicles").valueChanges().subscribe((data) => {
      for (let index = 0; index < data.length; index++) {
        if (data[index]["assigned-task"] != undefined) {
          if (data[index]["assigned-task"] != "") {
            let dbPath = "LocationHistory/" + data[index]["assigned-task"] + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.toDayDate + "/last-update-time";
            let locations = this.db.object(dbPath).valueChanges().subscribe((updatedTime) => {
              if (updatedTime != null) {
                var lastUpdatedTime = new Date(
                  this.toDayDate + " " + updatedTime
                );
                var currentTime = new Date(dt.getTime());
                var difference = currentTime.getTime() - lastUpdatedTime.getTime(); // This will give difference in milliseconds
                var resultInMinutes = Math.round(difference / 60000);
                if (resultInMinutes >= 7) {
                  let message = "Ward " + data[index]["assigned-task"] + " : We are not getting any data from last " + resultInMinutes + " minutes. ";
                  let cssClass = "alert alert-danger alert-with-icon";
                  this.setNotificationAlert(message, cssClass);
                }
              }
              locations.unsubscribe();
            });
          }
        }
      }
      Vehicle.unsubscribe();
    });
  }

  getSkippedLines() {
    let wardNo = this.zoneList[this.wardIndex].zoneNo;
    this.getWardWiseSkippedLines(wardNo);
  }

  getWardWiseSkippedLines(wardNo: any) {
    let skippedLinePath = "WasteCollectionInfo/" + wardNo + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.toDayDate + "/Summary/skippedLines";
    let skippedLinesInstance = this.db.object(skippedLinePath).valueChanges().subscribe((skippedData) => {
      if (localStorage.getItem("notificationSkippedLines") == "1") {
        if (skippedData != null) {
          if (skippedData != 0) {
            if (this.skippedLines.length > 0) {
              let zoneDetails = this.skippedLines.find(
                (item) => item.wardNo == wardNo
              );
              if (zoneDetails != undefined) {
                if (zoneDetails.skipLine != skippedData) {
                  zoneDetails.skipLine = skippedData;
                  this.notificationSkipLine(wardNo, skippedData);
                }
              } else {
                this.skippedLines.push({
                  wardNo: wardNo,
                  skipLine: skippedData,
                });
                this.notificationSkipLine(wardNo, skippedData);
              }
            } else {
              this.skippedLines.push({
                wardNo: wardNo,
                skipLine: skippedData,
              });
              this.notificationSkipLine(wardNo, skippedData);
            }
            localStorage.setItem(
              "skipLines",
              JSON.stringify(this.skippedLines)
            );
          }
        }
        this.wardIndex++;
        if (this.zoneList[this.wardIndex] != undefined) {
          this.getWardWiseSkippedLines(this.zoneList[this.wardIndex].zoneNo);
        }
      }
    });
  }

  notificationSkipLine(wardNo: any, skipLine: any) {
    let message = "ward " + wardNo + " driver skipped " + skipLine + " lines";
    let cssClass = "alert alert-lineskip alert-with-icon";
    this.setNotificationAlert(message, cssClass);
  }

  setNotificationAlert(message: any, cssClass: any) {
    let toast = this.toastr.error(
      '<span class="now-ui-icons ui-1_bell-53"></span> ' + message + ".",
      "",
      {
        disableTimeOut: true,
        closeButton: true,
        enableHtml: true,
        toastClass: cssClass,
        positionClass: "toast-bottom-right",
        tapToDismiss: false,
      }
    );
  }

  checkLoginDate() {
    if (localStorage.getItem("loginDate") != null) {
      if (this.commonService.setTodayDate() != localStorage.getItem("loginDate")) {
        localStorage.removeItem("loginDate");
        window.location.href = "/logout";
      }
    }
  }

  getPage(value: any) {
    this.checkLoginDate();
    let list = value.split("/");
    if (list.length <= 2) {
      this.router.navigate([value], { replaceUrl: true });
    } else {
      let url = window.location.href;
      this.router.navigate([value], { replaceUrl: true });
      const id = list[list.length - 1];
      let pageList = id.split("-");
      this.getPages(pageList[pageList.length - 1]);
      // CmsComponent.prototype.ngOnInit();
    }
  }

  getPages(pageId: any) {
    CmsComponent.prototype.accessList = [];
    CmsComponent.prototype.pageList = [];
    // CmsComponent.prototype.getPages(pageId);


    let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
    if (userAccessList != null) {
      let detail = userAccessList.find((item) => item.pageId == pageId);
      if (detail != undefined) {
        $("#pageName").html(detail.name);
        $("#pageNameMobile").html(detail.name);
      }
      this.clearAll();
      let k = 0;
      for (let i = 0; i < userAccessList.length; i++) {
        if (
          userAccessList[i]["parentId"] == pageId &&
          userAccessList[i]["userId"] == this.userid &&
          userAccessList[i]["city"] == this.cityName
        ) {
          CmsComponent.prototype.pageList.push({ name: userAccessList[i]["name"], img: userAccessList[i]["img"], url: userAccessList[i]["url"], pageId: userAccessList[i]["pageId"] });
          if (userAccessList[i]["url"].toString().includes("https")) {
            if (this.cityName == "test") {
              k = k + 1;
              // this.setLink(k, userAccessList, i);
            }
            else if (this.cityName == "dehradun") {
              let url = userAccessList[i]["url"];
              let newUrl = url.split("https://mainportal-react.web.app/userId/")[1];

              let isLink = true;
              if (newUrl == "dashboard") {
                isLink = false;
              }
              if (isLink == true) {
                k = k + 1;
                //  this.setLink(k, userAccessList, i);
              }

            }
            else {
              k = k + 1;
              // this.setLink(k, userAccessList, i);
            }
          }
          else {
            k = k + 1;
            // this.setLink(k, userAccessList, i);
          }
        }
      }
    }

  }

  setLink(k: any, userAccessList: any, i: any) {
    let element = <HTMLElement>document.getElementById("div" + k);
    if (element != undefined) {
      $("#div" + k).show();
      $("#span" + k).html(userAccessList[i]["name"]);
      // let className = $("#icon" + k).attr("class");
      // $("#icon" + k).removeClass(className);
      let imgElement = <HTMLImageElement>document.getElementById("icon" + k);
      imgElement.src = userAccessList[i]["img"];
      // $("#icon" + k).addClass(userAccessList[i]["img"]);
      if (element != null) {
        element.addEventListener("click", (e) => {
          if (userAccessList[i]["url"].toString().includes("https")) {
            this.goToOuterURL(userAccessList[i]["url"]);
          }
          else {
            this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"]);
          }
        });
      }
    }
    element = <HTMLElement>document.getElementById("divMob" + k);
    if (element != undefined) {
      $("#divMob" + k).show();
      $("#spanMob" + k).html(userAccessList[i]["name"]);
      // let className = $("#iconMob" + k).attr("class");
      // $("#iconMob" + k).removeClass(className);
      let imgElement = <HTMLImageElement>document.getElementById("iconMob" + k);
      imgElement.src = userAccessList[i]["img"];
      // $("#iconMob" + k).addClass(userAccessList[i]["img"]);
      if (element != null) {
        element.addEventListener("click", (e) => {
          if (userAccessList[i]["url"].toString().includes("https")) {
            this.goToOuterURL(userAccessList[i]["url"]);
          }
          else {
            this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"]);
          }
        });
      }
    }
  }

  goToOuterURL(url: any) {
    let newUrl = url.split("https://mainportal-react.web.app/userId/")[1];

    url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userid + "/" + this.userType + "/" + this.isActual + "/" + newUrl;

    window.open(url, "_blank");
  }

  clearAll() {
    for (let k = 1; k <= 30; k++) {
      $("#div" + k).hide();
      $("#divMob" + k).hide();
    }
  }

  openModel(content: any, type: any) {
    this.closeMapModel();
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 200;
    let width = 465;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top",);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (type == "Yes") {
      //$('#divMessage').html("Now internet is connected, enjoy your work !!!");
    }
    else {
      $('#divMessage').html("Sorry! no internet available. Please check internet !!!");
    }
  }

  openCityModel(content: any) {
    this.jaipurCityList = [];
    this.citySelectionList = [];
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 500;
    let width = 767;



    let windowwidth = $(window).width();

    if (windowwidth >= 1350) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "3%");

    } else if (windowwidth <= 1349 && windowwidth >= 1201) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 1200 && windowwidth >= 1025) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 1024 && windowwidth >= 768) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 767 && windowwidth >= 577) {
      width = 575;


    } else if (windowwidth <= 576 && windowwidth >= 410) {
      width = 400;

    } else if (windowwidth <= 413 && windowwidth >= 270) {
      width = 265;

    }


    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";

    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top");
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (this.cityName == "jaipur") {
      $("#popUpCityName").html("jaipur D2D");
    }
    else {
      $("#popUpCityName").html(this.commonService.getCityName(this.cityName));
    }
    let isBaseCity = false;
    let cityList = JSON.parse(localStorage.getItem("cityList"));
    let isJaipurCity = false;
    for (let i = 0; i < this.accessCity.length; i++) {
      let detail = cityList.find(item => item.city == this.accessCity[i]["city"]);
      if (detail != undefined) {
        if (this.accessCity[i]["city"] == "jaipur-jagatpura" || this.accessCity[i]["city"] == "jaipur-jhotwara" || this.accessCity[i]["city"] == "jaipur-malviyanagar" || this.accessCity[i]["city"] == "jaipur-mansarovar" || this.accessCity[i]["city"] == "jaipur-murlipura" || this.accessCity[i]["city"] == "jaipur-sanganer" || this.accessCity[i]["city"] == "jaipur-vidhyadhar" || this.accessCity[i]["city"] == "jaipur-civil-line" || this.accessCity[i]["city"] == "jaipur-kishanpole") {
          isJaipurCity = true;
          this.jaipurCityList.push({ city: detail.city, cityLogo: detail.cityLogo ? detail.cityLogo : "", name: detail.cityName });
        }
        else {
          isBaseCity = true;
          this.citySelectionList.push({ city: detail.city, cityLogo: detail.cityLogo ? detail.cityLogo : "", name: detail.cityName });
        }
      }

    }
    if (isJaipurCity == true) {
      this.citySelectionList.push({ city: "", cityLogo: "../../../assets/images/jaipur icon.png", name: "Jaipur D2D" });
    }
    this.citySelectionList = this.citySelectionList.sort((a, b) => b.name < a.name ? 1 : -1);
    if (isBaseCity == false) {
      this.openSecondCityModel(this.contentSecondCity);
    }

  }


  openSecondCityModel(content: any) {
    this.closeMapModel();
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 300;
    let width = 767;

    let windowwidth = $(window).width();

    if (windowwidth >= 1350) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "20%");
      $("div .modal-content").css("background", "transparent").css("box-shadow", "none").css("border", "none");

    } else if (windowwidth <= 1349 && windowwidth >= 1201) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 1200 && windowwidth >= 1025) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 1024 && windowwidth >= 768) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 767 && windowwidth >= 577) {
      width = 575;


    } else if (windowwidth <= 576 && windowwidth >= 410) {
      width = 400;

    } else if (windowwidth <= 413 && windowwidth >= 270) {
      width = 265;

    }

    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";

    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top");
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");

  }

  closeMapModel() {
    this.modalService.dismissAll();
  }
}

export class userDetail {
  name: string;
  homeLink: string;
  changePasswordLink: string;
}
