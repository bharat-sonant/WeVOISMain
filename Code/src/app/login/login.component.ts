import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import * as $ from "jquery";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { CommonService } from "../services/common/common.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  constructor(private router: Router, private commonService: CommonService, private toastr: ToastrService, public db: AngularFireDatabase, public dbFireStore: AngularFirestore, public httpService: HttpClient) { }
  userId: any;
  userName: any = "admin";
  expiryDate: any;
  portalAccessList: any[];
  vehicleList: any[];
  dustbinList: any[];
  fixdGeoLocations: any[];
  cityList: any[] = [];
  accessList: any[] = [];
  accessCity: any[] = [];
  cityName: any;
  toDayDate: any;
  divLoader = "#divLoader";

  messageDetail: messageDetail = {
    type: "Good Morning"
  };

  ngOnInit() {
    this.setCityList();
    this.getMessage();
    this.getRendomBackground();
    this.commonService.setPortalPages();
    this.commonService.setWebPortalUsers();
    this.toDayDate = this.commonService.setTodayDate();
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
  }

  setCityList() {
    this.cityList.push({ city: "sikar", name: "Sikar", storagePath: "Sikar" });
    this.cityList.push({ city: "reengus", name: "Reengus", storagePath: "Reengus" });
    this.cityList.push({ city: "shahpura", name: "Shahpura", storagePath: "Shahpura" });
    this.cityList.push({ city: "test", name: "Test", storagePath: "Test" });
    this.cityList.push({ city: "jaipur-office", name: "Jaipur Office", storagePath: "Jaipur" });
    this.cityList.push({ city: "jaipur", name: "Jaipur", storagePath: "JaipurD2D" });
    this.cityList.push({ city: "jaipur-greater", name: "Jaipur Greater", storagePath: "Jaipur-Greater" });
    this.cityList.push({ city: "kishangarh", name: "Kishangarh", storagePath: "Kishangarh" });
    this.cityList.push({ city: "niwai", name: "Niwai", storagePath: "Niwai" });
    this.cityList.push({ city: "jaisalmer", name: "Jaisalmer", storagePath: "Jaisalmer" });
    this.cityList.push({ city: "churu", name: "Churu", storagePath: "Churu" });
    this.cityList.push({ city: "bhiwadi", name: "Bhiwadi", storagePath: "Bhiwadi" });
    this.cityList.push({ city: "chhapar", name: "Chhapar", storagePath: "Chhapar" });
    this.cityList.push({ city: "behror", name: "Behror", storagePath: "Behror" });
    this.cityList.push({ city: "salasar", name: "Salasar Balaji", storagePath: "Salasar" });
    this.cityList.push({ city: "wevois-others", name: "WeVOIS-Others", storagePath: "WeVOIS-Others" });

    this.cityList.push({ city: "jaipur-jagatpura", name: "Jagatpura", storagePath: "Jaipur-Jagatpura" });
    this.cityList.push({ city: "jaipur-jhotwara", name: "Jhotwara", storagePath: "Jaipur-Jhotwara" });
    this.cityList.push({ city: "jaipur-malviyanagar", name: "Malviyanagar", storagePath: "Jaipur-Malviyanagar" });
    this.cityList.push({ city: "jaipur-mansarovar", name: "Mansarovar", storagePath: "Jaipur-Mansarovar" });
    this.cityList.push({ city: "jaipur-murlipura", name: "Murlipura", storagePath: "Jaipur-Murlipura" });
    this.cityList.push({ city: "jaipur-sanganer", name: "Sanganer", storagePath: "Jaipur-Sanganer" });
    this.cityList.push({ city: "jaipur-vidhyadhar", name: "Vidhyadhar", storagePath: "Jaipur-Vidhyadhar" });
    localStorage.setItem("cityList", JSON.stringify(this.cityList));
  }

  getRendomBackground() {
    let imageList = [];
    imageList.push({ img: "col-md-6 bg-img no-gutters" });
    imageList.push({ img: "col-md-6 bg-img1 no-gutters" });
    imageList.push({ img: "col-md-6 bg-img2 no-gutters" });
    imageList.push({ img: "col-md-6 bg-img3 no-gutters" });
    imageList.push({ img: "col-md-6 bg-img4 no-gutters" });
    imageList.push({ img: "col-md-6 bg-img5 no-gutters" });
    let index = this.getRandomNumberBetween(0, 5);
    let element = <HTMLElement>document.getElementById("divBack");
    let className = element.className;
    $('#divBack').removeClass(className);
    $('#divBack').addClass(imageList[index]["img"]);
  }

  getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  getMessage() {
    let time = new Date().getHours();
    if (time < 12) {
      this.messageDetail.type = "Good Morning";
    }
    else if (time >= 17) {
      this.messageDetail.type = "Good Evening";
    }
    else {
      this.messageDetail.type = "Good Afternoon";
    }
  }

  doLogin() {
    localStorage.setItem("loginDate", this.toDayDate);
    let userName = $("#txtUserName").val();
    let password = $("#txtPassword").val();
    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    let userDetails = userList.find((item) => item.email == userName && item.password == password);
    if (userDetails != undefined) {
      if (userDetails.expiryDate != "") {
        this.expiryDate = userDetails.expiryDate;
        localStorage.setItem("expiryDate", this.expiryDate);
      } else {
        this.expiryDate = null;
        localStorage.setItem("expiryDate", null);
      }
      localStorage.setItem("userName", userDetails.name);
      localStorage.setItem("userID", userDetails.userId);
      localStorage.setItem("userKey", userDetails.userKey);
      localStorage.setItem("userType", userDetails.userType);
      localStorage.setItem("userPassword", userDetails.password);
      if (userDetails.officeAppUserId != 0) {
        localStorage.setItem("officeAppUserId", userDetails.officeAppUserId);
      }
      // if (userDetails.accessCity != "") {
      //   localStorage.setItem("accessCity", userDetails.accessCity);
      //  }
      if (userDetails.isTaskManager != 0) {
        localStorage.setItem("isTaskManager", userDetails.isTaskManager);
      } else {
        localStorage.setItem("isTaskManager", "0");
      }
      if (userDetails.isActual != 0) {
        localStorage.setItem("isActual", userDetails.isActual);
      } else {
        localStorage.setItem("isActual", "0");
      }
      if (userDetails.isLock != 0) {
        localStorage.setItem("isLock", userDetails.isLock);
      } else {
        localStorage.setItem("isLock", "0");
      }
      if (userDetails.isAdmin != 0) {
        localStorage.setItem("isAdmin", userDetails.isAdmin);
      } else {
        localStorage.setItem("isAdmin", "0");
      }
      if (userDetails.isManager != null) {
        localStorage.setItem("isManager", userDetails.isManager);
      }
      else {
        localStorage.setItem("isManager", "0");
      }
      localStorage.setItem("notificationHalt", userDetails.notificationHalt);
      localStorage.setItem("haltDisableAccess", userDetails.haltDisableAccess);
      localStorage.setItem("notificationMobileDataOff", userDetails.notificationMobileDataOff);
      localStorage.setItem("notificationSkippedLines", userDetails.notificationSkippedLines);
      localStorage.setItem("notificationPickDustbins", userDetails.notificationPickDustbins);
      localStorage.setItem("notificationGeoSurfing", userDetails.notificationGeoSurfing);
      this.portalAccessList = JSON.parse(localStorage.getItem("portalAccess"));
      if (this.expiryDate != null) {
        if (new Date(this.commonService.setTodayDate()) < new Date(this.expiryDate)) {
          localStorage.setItem("loginStatus", "Success");
          $(this.divLoader).show();
          this.setUserCityAccess(0, userDetails.userId);
        } else {
          localStorage.setItem("loginStatus", "Fail");
          this.commonService.setAlertMessage("error", "Account Not Activate !!!");
        }
      } else {
        localStorage.setItem("expiryDate", null);
        localStorage.setItem("loginStatus", "Success");
        $(this.divLoader).show();
        this.setUserCityAccess(0, userDetails.userId);
      }
    } else {
      localStorage.setItem("loginStatus", "Fail");
      this.commonService.setAlertMessage("error", "Invalid username or password !!!");
    }
  }

  redirectHomePage() {
    if (this.accessList.length > 0) {
      localStorage.setItem("userAccessList", JSON.stringify(this.accessList));
      localStorage.setItem("accessCity", JSON.stringify(this.accessCity));
      this.cityName = this.accessList[0]["city"];
      localStorage.setItem("cityName", this.cityName);
      localStorage.setItem("isCityChange", "yes");
      window.location.href = this.cityName + "/home";
    }
    else {
      this.commonService.setAlertMessage("error", "No access given to you, Please contact to admin, Thanks for you patience !!!");
    }
    $(this.divLoader).hide();
  }

  setUserCityAccess(index: any, userId: any) {
    if (index != this.cityList.length - 1) {
      let city = this.cityList[index]["city"];
      let name = this.cityList[index]["name"];
      this.dbFireStore.collection("UserManagement").doc("UserAccess").collection("UserAccess").doc(userId.toString()).collection(city).doc(city).get().subscribe((doc) => {
        if (doc.data() != undefined) {
          let pageId = doc.data()["pageId"];
          if (pageId != null) {
            let dataList = pageId.toString().split(",");
            for (let j = 0; j < dataList.length; j++) {
              let accessDetails = this.portalAccessList.find((item) => item.pageID == dataList[j].trim());
              if (accessDetails != undefined) {
                this.accessList.push({
                  city: city,
                  userId: userId,
                  parentId: accessDetails.parentId,
                  pageId: accessDetails.pageID,
                  name: accessDetails.name,
                  url: accessDetails.url,
                  position: accessDetails.position,
                  img: accessDetails.img,
                });
              }
            }
            this.accessCity.push({ city: city, name: name });
            index = index + 1;
            this.setUserCityAccess(index, userId);
          }
          else {
            index = index + 1;
            this.setUserCityAccess(index, userId);
          }
        }
        else {
          index = index + 1;
          this.setUserCityAccess(index, userId);
        }
      });
    }
    else {
      this.redirectHomePage();
    }
  }

  checkLogin() {
    let userName = $("#txtUserName").val();
    let password = $("#txtPassword").val();
    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    let userDetails = userList.find((item) => item.email == userName && item.password == password);
    if (userDetails != undefined) {
      this.dbFireStore.collection("UserManagement").doc("UserAccess").collection("UserAccess").doc(userDetails.userId.toString()).collection(this.cityName).doc(this.cityName).get().subscribe((doc) => {
        if (doc.data() == undefined) {
          this.commonService.setAlertMessage("error", "sorry! you have not access for " + this.cityName + "");
          this.router.navigate(["/portal-access"]);
        } else {
          let pageId = doc.data()["pageId"];
          if (pageId == null) {
            this.commonService.setAlertMessage("error", "sorry! you have not access for " + this.cityName + "");
            this.router.navigate(["/portal-access"]);
          } else {
            this.doLogin();
          }
        }
      });
    }
    else {
      localStorage.setItem("loginStatus", "Fail");
      this.commonService.setAlertMessage("error", "Invalid username or password !!!");
    }
  }
}


export class messageDetail {
  type: string;
}
