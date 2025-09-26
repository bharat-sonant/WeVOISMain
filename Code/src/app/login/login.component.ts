import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import * as $ from "jquery";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { CommonService } from "../services/common/common.service";
import { UsersService } from "../services/users/users.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  constructor(public userService: UsersService, private router: Router, private commonService: CommonService, private toastr: ToastrService, public db: AngularFireDatabase, public dbFireStore: AngularFirestore, public httpService: HttpClient) { }
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
  roleJSONData: any;

  messageDetail: messageDetail = {
    type: "Good Morning"
  };

  ngOnInit() {
    this.setCityDetailList();
    this.setCommonCityData();
    //this.setCityList();
    this.getRoles();
    this.getMessage();
    this.getRendomBackground();
    this.userService.setPortalPages();
    this.userService.setWebPortalUsers();
    this.toDayDate = this.commonService.setTodayDate();
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
  }

  setCityDetailList() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/Common%2FCityDetails.json?alt=media";
    let cityDetailJSONInstance = this.httpService.get(path).subscribe(cityDetailJsonData => {
      cityDetailJSONInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(cityDetailJsonData));
      list = list.filter(item => item.isOuter == "no");
      this.cityList = list.sort((a, b) => b.cityName > a.cityName ? 1 : -1);
      localStorage.setItem("CityDetailList", JSON.stringify(cityDetailJsonData));
      localStorage.setItem("cityList", JSON.stringify(this.cityList));
    }, error => {

    });

  }

  setCommonCityData() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/Common%2FCityCommonData.json?alt=media";
    let cityCommonDataJSONInstance = this.httpService.get(path).subscribe(cityCommonDataJsonData => {
      cityCommonDataJSONInstance.unsubscribe();
      let keyArray = Object.keys(cityCommonDataJsonData);
      let list = [];
      for (let i = 0; i < keyArray.length; i++) {
        let key = keyArray[i];
        list.push({ city: key, latLng: cityCommonDataJsonData[key]["latLng"] });
        localStorage.setItem("CityCommonDataList", JSON.stringify(list));
      }
    }, error => {

    });
  }

  getRoles() {
    this.userService.getRoles().then((data: any) => {
      if (data != null) {
        this.roleJSONData = data;
      }
    });
  }

  setCityList() {
    this.cityList.push({ city: "ajmer", name: "Ajmer", storagePath: "Ajmer" });
    this.cityList.push({ city: "bharatpur", name: "Bharatpur", storagePath: "Bharatpur" });
    this.cityList.push({ city: "biofics-surat", name: "Biofics Surat", storagePath: "Biofics-Surat" });
    this.cityList.push({ city: "chennai", name: "Chennai", storagePath: "Chennai" });
    this.cityList.push({ city: "chirawa", name: "Chirawa", storagePath: "Chirawa" });
    this.cityList.push({ city: "dausa", name: "Dausa", storagePath: "Dausa" });
    this.cityList.push({ city: "dei-bundi", name: "Dei-Bundi", storagePath: "Dei-Bundi" });
    this.cityList.push({ city: "dehradun", name: "Dehradun", storagePath: "Dehradun" });
    this.cityList.push({ city: "ecogram", name: "Ecogram", storagePath: "Ecogram" });
    this.cityList.push({ city: "etmadpur", name: "Etmadpur", storagePath: "Etmadpur" });
    this.cityList.push({ city: "iit-roorkee", name: "IIT-Roorkee", storagePath: "IIT-Roorkee" });
    this.cityList.push({ city: "jaunpur", name: "Jaunpur", storagePath: "Jaunpur" });
    this.cityList.push({ city: "jammu-survey", name: "Jammu Survey", storagePath: "Jammu-Survey" });
    this.cityList.push({ city: "jaipur-office", name: "Jaipur Office", storagePath: "Jaipur" });
    this.cityList.push({ city: "jaipur-test", name: "Jaipur Test", storagePath: "Jaipur-Test" });
    this.cityList.push({ city: "jaipur-bwg", name: "Jaipur-BWG", storagePath: "Jaipur-BWG" });
    this.cityList.push({ city: "jaipur", name: "Jaipur", storagePath: "JaipurD2D" });
    this.cityList.push({ city: "jaipur-greater", name: "Jaipur Greater", storagePath: "Jaipur-Greater" });
    this.cityList.push({ city: "jaipur-jagatpura", name: "Jagatpura", storagePath: "Jaipur-Jagatpura" });
    this.cityList.push({ city: "jaipur-jhotwara", name: "Jhotwara", storagePath: "Jaipur-Jhotwara" });
    this.cityList.push({ city: "jaipur-malviyanagar", name: "Malviyanagar", storagePath: "Jaipur-Malviyanagar" });
    this.cityList.push({ city: "jaipur-mansarovar", name: "Mansarovar", storagePath: "Jaipur-Mansarovar" });
    this.cityList.push({ city: "jaipur-murlipura", name: "Murlipura", storagePath: "Jaipur-Murlipura" });
    this.cityList.push({ city: "jaipur-sanganer", name: "Sanganer", storagePath: "Jaipur-Sanganer" });
    this.cityList.push({ city: "jaipur-civil-line", name: "Civil Line", storagePath: "Jaipur-Civil-Line" });
    this.cityList.push({ city: "jaipur-kishanpole", name: "Kishanpole", storagePath: "Jaipur-Kishanpole" });
    this.cityList.push({ city: "jaipur-textile-recycling-facility", name: "Textile Recycling Facility-Jaipur", storagePath: "Jaipur-Textile-Recycling-Facility" });
    this.cityList.push({ city: "jodhpur", name: "Jodhpur", storagePath: "Jodhpur" });
    this.cityList.push({ city: "jodhpur-bwg", name: "Jodhpur-BWG", storagePath: "Jodhpur-BWG" });
    this.cityList.push({ city: "khandela", name: "Khandela", storagePath: "Khandela" });
    this.cityList.push({ city: "khairabad", name: "Khairabad", storagePath: "Khairabad" });
    this.cityList.push({ city: "kishangarh", name: "Kishangarh", storagePath: "Kishangarh" });
    this.cityList.push({ city: "kuchaman", name: "Kuchaman", storagePath: "Kuchaman" });
    this.cityList.push({ city: "losal", name: "Losal", storagePath: "Losal" });
    this.cityList.push({ city: "mapusa-goa", name: "Mapusa Goa", storagePath: "Mapusa-Goa" });
    this.cityList.push({ city: "mnz-test", name: "MNZ-Test", storagePath: "Jaipur-Malviyanagar" });
    this.cityList.push({ city: "mpz-test", name: "MPZ-Test", storagePath: "Jaipur-Murlipura" });
    this.cityList.push({ city: "nainwa", name: "Nainwa", storagePath: "Nainwa" });
    this.cityList.push({ city: "nawa", name: "Nawa", storagePath: "Nawa" });
    this.cityList.push({ city: "nokha", name: "Nokha", storagePath: "Nokha" });
    this.cityList.push({ city: "noida", name: "Noida", storagePath: "Noida" });
    this.cityList.push({ city: "pali", name: "Pali", storagePath: "Pali" });
    this.cityList.push({ city: "ratangarh", name: "Ratangarh", storagePath: "Ratangarh" });
    this.cityList.push({ city: "reengus", name: "Reengus", storagePath: "Reengus" });
    this.cityList.push({ city: "rajsamand", name: "Rajsamand", storagePath: "Rajsamand" });
    this.cityList.push({ city: "sanchore", name: "Sanchore", storagePath: "Sanchore" });
    this.cityList.push({ city: "salasar", name: "Salasar Balaji", storagePath: "Salasar" });
    this.cityList.push({ city: "sikar", name: "Sikar", storagePath: "Sikar" });
    this.cityList.push({ city: "sikar-survey", name: "Sikar Survey", storagePath: "Sikar-Survey" });
    this.cityList.push({ city: "sonipat", name: "Sonipat", storagePath: "Sonipat" });
    this.cityList.push({ city: "sujangarh", name: "Sujangarh", storagePath: "Sujangarh" });
    this.cityList.push({ city: "sujalpur", name: "Sujalpur", storagePath: "Sujalpur" });
    this.cityList.push({ city: "sultanpur", name: "Sultanpur", storagePath: "Sultanpur" });
    this.cityList.push({ city: "tonk", name: "Tonk", storagePath: "Tonk" });
    this.cityList.push({ city: "tonk-raj", name: "Tonk-Raj", storagePath: "Tonk-Raj" });
    this.cityList.push({ city: "test", name: "Test", storagePath: "Test" });
    this.cityList.push({ city: "uniara", name: "Uniara", storagePath: "Uniara" });
    this.cityList.push({ city: "wevois-others", name: "WeVOIS-Others", storagePath: "WeVOIS-Others" });
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
    let userDetails = userList.find((item) => item.email == userName && item.password == password && item.isDelete == 0);
    if (userDetails != undefined) {
      if (userDetails.accessCities == "") {
        this.commonService.setAlertMessage("error", "No access given to you, Please contact to admin, Thanks for you patience !!!");
        return;
      }
      if (userDetails.roleId == 0) {
        this.commonService.setAlertMessage("error", "No access given to you, Please contact to admin, Thanks for you patience !!!");
        return;
      }

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
      localStorage.setItem("roleId", userDetails.roleId);
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
      if (userDetails.isActualWorkPercentage != 0) {
        localStorage.setItem("isActualWorkPercentage", userDetails.isActualWorkPercentage);
      } else {
        localStorage.setItem("isActualWorkPercentage", "0");
      }
      if (userDetails.isAttendanceApprover != 0) {
        localStorage.setItem("isAttendanceApprover", userDetails.isAttendanceApprover);
      } else {
        localStorage.setItem("isAttendanceApprover", "0");
      }
      if (userDetails.isManager != null) {
        localStorage.setItem("isManager", userDetails.isManager);
      }
      else {
        localStorage.setItem("isManager", "0");
      }
      if (userDetails.canUpdateOpendepotPickDetail != null) {
        localStorage.setItem("canUpdateOpendepotPickDetail", userDetails.canUpdateOpendepotPickDetail);
      }
      else {
        localStorage.setItem("canUpdateOpendepotPickDetail", "0");
      }
      if (userDetails.canViewAttendance != null) {
        localStorage.setItem("canViewAttendance", userDetails.canViewAttendance);
      }
      else {
        localStorage.setItem("canViewAttendance", "0");
      }
      if (userDetails.canUpdateDustbinPickDetail != null) {
        localStorage.setItem("canUpdateDustbinPickDetail", userDetails.canUpdateDustbinPickDetail);
      }
      else {
        localStorage.setItem("canUpdateDustbinPickDetail", "0");
      }
      if (userDetails.canRemoveNotPickedDustbin != null) {
        localStorage.setItem("canRemoveNotPickedDustbin", userDetails.canRemoveNotPickedDustbin);
      }
      else {
        localStorage.setItem("canRemoveNotPickedDustbin", "0");
      }
      if (userDetails.canAccessBIDashboard != null) {
        localStorage.setItem("canAccessBIDashboard", userDetails.canAccessBIDashboard);
      }
      else {
        localStorage.setItem("canAccessBIDashboard", "0");
      }
      if (userDetails.canAddWardDutyOn != null) {
        localStorage.setItem("canAddWardDutyOn", userDetails.canAddWardDutyOn);
      }
      else {
        localStorage.setItem("canAddWardDutyOn", "0");
      }
      if (userDetails.canReimburseFuel != null) {
        localStorage.setItem("canReimburseFuel", userDetails.canReimburseFuel);
      }
      else {
        localStorage.setItem("canReimburseFuel", "0");
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
          let obj = {
            lastLogin: this.commonService.getTodayDateTime()
          }
          this.commonService.saveCommonJsonFile(obj, userDetails.userId + ".json", "/Common/EmployeeLastLogin/");
          this.setUserCityAccess(userDetails.userId, userDetails.accessCities, userDetails.roleId, userDetails.canAccessBIDashboard);
        } else {
          localStorage.setItem("loginStatus", "Fail");
          this.commonService.setAlertMessage("error", "Account Not Activate !!!");
        }
      } else {
        localStorage.setItem("expiryDate", null);
        localStorage.setItem("loginStatus", "Success");
        $(this.divLoader).show();
        let obj = {
          lastLogin: this.commonService.getTodayDateTime()
        }
        this.commonService.saveCommonJsonFile(obj, userDetails.userId + ".json", "/Common/EmployeeLastLogin/");
        this.setUserCityAccess(userDetails.userId, userDetails.accessCities, userDetails.roleId, userDetails.canAccessBIDashboard);
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
      window.location.href = "/portal-access";
    }
    else {
      this.commonService.setAlertMessage("error", "No access given to you, Please contact to admin, Thanks for you patience !!!");
    }
    $(this.divLoader).hide();
  }

  setLastLoginTime(userId: any) {
    let obj = {
      lastLogin: this.commonService.getTodayDateTime()
    }
    this.commonService.saveCommonJsonFile(obj, userId + ".json", "/Common/EmployeeLastLogin/");
  }

  setUserCityAccess(userId: any, accessCities: any, roleId: any, canAccessBIDashboard: any) {
    let list = [
      { pageId: "2A2" },
      { pageId: "10C" },
      { pageId: "10D" },
      { pageId: "10E" },
      { pageId: "10F" },
      { pageId: "16I" },
      { pageId: "20U" }
    ];
    if (this.roleJSONData != null) {
      let cityList = accessCities.split(',');
      for (let i = 0; i < cityList.length; i++) {
        let city = cityList[i].trim();
        let cityDetail = this.cityList.find(item => item.city == city);
        if (cityDetail != undefined) {
          this.accessCity.push({ city: city, name: cityDetail.name });
        }
        if (this.roleJSONData[roleId]["pages"] != undefined) {
          let pagesList = this.roleJSONData[roleId]["pages"].split(',');
          for (let j = 0; j < pagesList.length; j++) {
            let accessDetails = this.portalAccessList.find((item) => item.pageID == pagesList[j].toString().trim());
            if (accessDetails != undefined) {
              let isPush = 0;
              let pageDetail = list.find(item => item.pageId == pagesList[j].toString().trim());
              if (pageDetail != undefined) {
                if (Number(canAccessBIDashboard) == 1) {
                  isPush = 1;
                }
              }
              else {
                isPush = 1;
              }

              if (isPush == 1) {
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
          }
        }
      }
    }
    this.redirectHomePage();
  }
}


export class messageDetail {
  type: string;
}
