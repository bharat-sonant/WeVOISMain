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
  cityName: any;
  toDayDate: any;

  messageDetail: messageDetail = {
    type: "Good Morning"
  };

  ngOnInit() {
    this.getMessage();
    this.getRendomBackground();
    this.commonService.setPortalPages();
    this.commonService.setWebPortalUsers();
    this.cityName = localStorage.getItem("cityName");
    this.toDayDate = this.commonService.setTodayDate();
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
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
      this.commonService.setUserAccess(userDetails.userId);
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
      localStorage.setItem("notificationHalt", userDetails.notificationHalt);
      localStorage.setItem("haltDisableAccess", userDetails.haltDisableAccess);
      localStorage.setItem("notificationMobileDataOff", userDetails.notificationMobileDataOff);
      localStorage.setItem("notificationSkippedLines", userDetails.notificationSkippedLines);
      localStorage.setItem("notificationPickDustbins", userDetails.notificationPickDustbins);
      localStorage.setItem("notificationGeoSurfing", userDetails.notificationGeoSurfing);
      if (this.expiryDate != null) {
        if (new Date(this.commonService.setTodayDate()) < new Date(this.expiryDate)) {
          localStorage.setItem("loginStatus", "Success");
          setTimeout(() => {
            window.location.href = this.cityName + "/home";
          }, 1000);
        } else {
          localStorage.setItem("loginStatus", "Fail");
          this.commonService.setAlertMessage("error", "Account Not Activate !!!");
        }
      } else {
        localStorage.setItem("expiryDate", null);
        localStorage.setItem("loginStatus", "Success");
        setTimeout(() => {
          window.location.href = this.cityName + "/home";
        }, 1000);
      }
    } else {
      localStorage.setItem("loginStatus", "Fail");
      this.commonService.setAlertMessage("error", "Invalid username or password !!!");
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
