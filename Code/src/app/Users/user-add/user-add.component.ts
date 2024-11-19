import { Component, OnInit } from "@angular/core";
import { UserService } from "../../services/common/user.service";
import { CommonService } from "../../services/common/common.service";
import { ToastrService } from "ngx-toastr"; // Alert message using NGX toastr
import { Users } from "../../Users/users"; // Users data type interface class
import * as $ from "jquery";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFirestore } from "@angular/fire/firestore";
import { ActivatedRoute, Router } from "@angular/router";
import { UsersService } from "../../services/users/users.service";

@Component({
  selector: "app-user-add",
  templateUrl: "./user-add.component.html",
  styleUrls: ["./user-add.component.scss"],
})
export class UserAddComponent implements OnInit {
  //public userForm: FormGroup;
  constructor(private router: Router, private userService: UsersService, public dbFireStore: AngularFirestore, public usrService: UserService, private actRoute: ActivatedRoute, public commonService: CommonService, public toastr: ToastrService, public db: AngularFireDatabase) { }

  usr: Users;
  toDayDate: any;
  usrid: any;
  userRecord: any[];
  userid: any;
  $Key: any;
  cityName: any;
  roleList: any[] = [];
  cityList: any[] = [];
  userJsonData: any;
  divLoader = "#divLoader";

  ngOnInit() {
    this.setDefaults();
  }

  setDefaults() {
    $(this.divLoader).show();
    this.cityName = localStorage.getItem("cityName");
    this.commonService.savePageLoadHistory("Users", "Add-Users", localStorage.getItem("userID"));
    this.cityList = JSON.parse(localStorage.getItem("cityList"));
    this.toDayDate = this.commonService.setTodayDate();
    this.userid = this.actRoute.snapshot.paramMap.get("id");
    this.getRoles();
  }

  getRoles() {
    this.userService.getRoles().then((data: any) => {
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let roleId = keyArray[i];
            if (data[roleId]["roleName"] != null) {
              let roleName = data[roleId]["roleName"];
              this.roleList.push({ roleId: roleId, roleName: roleName });
              this.roleList = this.commonService.transformNumeric(this.roleList, "roleName");
            }
          }
        }
      }
      this.getPortalUsers();
    });
  }

  getPortalUsers() {
    this.userService.getPortalUsers().then((data: any) => {
      if (data != null) {
        this.userJsonData = data;
      }
      this.getUserDetail();
    });
  }

  getUserDetail() {
    if (this.userid != null) {
      let data = this.userJsonData[this.userid];
      $("#name").val(data["name"]);
      $("#name").val(data["name"]);
      $("#userType").val(data["userType"]);
      $("#mobile").val(data["mobile"]);
      $("#email").val(data["email"]);
      $("#password").val(data["password"]);
      $("#expiryDate").val(data["expiryDate"]);
      if (data["roleId"] != null) {
        $("#userRole").val(data["roleId"]);
      }
      if (data["officeAppUserId"] != null) {
        $("#officeAppUserId").val(data["officeAppUserId"]);
      }
      if (data["empLocation"] != null) {
        $("#empLocation").val(data["empLocation"]);
      }
      if (data["notificationHalt"] == "1") {
        (<HTMLInputElement>(document.getElementById("notificationHalt"))).checked = true;
      }
      if (data["notificationMobileDataOff"] == 1) {
        (<HTMLInputElement>(document.getElementById("notificationMobileDataOff"))).checked = true;
      }
      if (data["notificationSkippedLines"] == 1) {
        (<HTMLInputElement>(document.getElementById("notificationSkippedLines"))).checked = true;
      }
      if (data["notificationPickDustbins"] == 1) {
        (<HTMLInputElement>(document.getElementById("notificationPickDustbins"))).checked = true;
      }
      if (data["notificationGeoSurfing"] == 1) {
        (<HTMLInputElement>(document.getElementById("notificationGeoSurfing"))).checked = true;
      }
      if (data["isTaskManager"] == 1) {
        (<HTMLInputElement>(document.getElementById("isTaskManager"))).checked = true;
      }
      if (data["haltDisableAccess"] != undefined) {
        if (data["haltDisableAccess"] == 1) {
          (<HTMLInputElement>(document.getElementById("haltDisableAccess"))).checked = true;
        }
      }
      if (data["isActual"] != undefined) {
        if (data["isActual"] == 1) {
          (<HTMLInputElement>(document.getElementById("isActual"))).checked = true;
        }
      }
      if (data["isActualWorkPercentage"] != undefined) {
        if (data["isActualWorkPercentage"] == 1) {
          (<HTMLInputElement>(document.getElementById("isActualWorkPercentage"))).checked = true;
        }
      }
      if (data["isLock"] != undefined) {
        if (data["isLock"] == 1) {
          (<HTMLInputElement>(document.getElementById("isLock"))).checked = true;
        }
      }
      if (data["isAdmin"] != undefined) {
        if (data["isAdmin"] == 1) {
          (<HTMLInputElement>(document.getElementById("isAdmin"))).checked = true;
        }
      }
      if (data["isManager"] != undefined) {
        if (data["isManager"] == 1) {
          (<HTMLInputElement>(document.getElementById("isManager"))).checked = true;
        }
      }
      if (data["isAttendanceApprover"] != undefined) {
        if (data["isAttendanceApprover"] == 1) {
          (<HTMLInputElement>(document.getElementById("isAttendanceApprover"))).checked = true;
        }
      }
      if (data["canUpdateEmployeeDetail"] != undefined) {
        if (data["canUpdateEmployeeDetail"] == 1) {
          (<HTMLInputElement>(document.getElementById("canUpdateEmployeeDetail"))).checked = true;
        }
      }
      if (data["canUpdateOpendepotPickDetail"] != undefined) {
        if (data["canUpdateOpendepotPickDetail"] == 1) {
          (<HTMLInputElement>(document.getElementById("canUpdateOpendepotPickDetail"))).checked = true;
        }
      }
      if (data["canUpdateLeaveBalance"] != undefined) {
        if (data["canUpdateLeaveBalance"] == 1) {
          (<HTMLInputElement>(document.getElementById("canUpdateLeaveBalance"))).checked = true;
        }
      }
      if (data["canUpdateDustbinPickDetail"] != undefined) {
        if (data["canUpdateDustbinPickDetail"] == 1) {
          (<HTMLInputElement>(document.getElementById("canUpdateDustbinPickDetail"))).checked = true;
        }
      }
      if (data["canViewAttendance"] != undefined) {
        if (data["canViewAttendance"] == 1) {
          (<HTMLInputElement>(document.getElementById("canViewAttendance"))).checked = true;
        }
      }
      if (data["accessCities"] != undefined) {
        let list = data["accessCities"].split(',');
        for (let i = 0; i < list.length; i++) {
          let city = list[i].trim();
          if (city != "") {
            let chkCity = "chkCity" + city;
            (<HTMLInputElement>(document.getElementById(chkCity))).checked = true;
          }
        }
      }
    }
    $(this.divLoader).hide();
  }

  submitData() {
    if ($("#userType").val() == "0") {
      this.commonService.setAlertMessage("error", "Please Select User Type !!!");
      return;
    }
    if ($("#name").val() == "") {
      this.commonService.setAlertMessage("error", "Please Enter User Name !!!");
      return;
    }
    if ($("#mobile").val() == "") {
      this.commonService.setAlertMessage("error", "Please Enter Mobile No. !!!");
      return;
    }
    if ($("#userRole").val() == "0") {
      this.commonService.setAlertMessage("error", "Please Select Portal Access As !!!");
      return;
    }
    if ($("#email").val() == "") {
      this.commonService.setAlertMessage("error", "Please Enter Email ID !!!");
      return;
    }
    let emailChk = $("#email").val();
    if (this.validateEmail(emailChk) == false) {
      this.commonService.setAlertMessage("error", "Please Enter Valid Email ID !!!");
      return;
    }

    if (this.userJsonData != null) {
      let keyArray = Object.keys(this.userJsonData);
      if (keyArray.length > 0) {
        for (let i = 0; i < keyArray.length; i++) {
          let key = keyArray[i];
          if (this.actRoute.snapshot.paramMap.get("id") == null) {
            if (emailChk == this.userJsonData[key]["email"]) {
              if (this.userJsonData[key]["isDelete"] == "0") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with active user !!!");
              } else if (this.userJsonData[key]["isDelete"] == "1") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with deleted user !!!");
              }
              return;
            }
          } else {
            if (emailChk == this.userJsonData[key]["email"] && this.userid != this.userJsonData[key]["userId"]) {
              if (this.userJsonData[key]["isDelete"] == "0") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with active user !!!");
              } else if (this.userJsonData[key]["isDelete"] == "1") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with deleted user !!!");
              }
              return;
            }
          }
        }
      }
    }

    if ($("#password").val() == "") {
      this.commonService.setAlertMessage("error", "Please Enter Password !!!");
      return;
    }

    let notificationHalt: any = 0;
    let notificationMobileDataOff: any = 0;
    let notificationSkippedLines: any = 0;
    let notificationPickDustbins: any = 0;
    let notificationGeoSurfing: any = 0;
    let haltDisableAccess: any = 0;
    let name: any = $("#name").val();
    let userType: any = $("#userType").val();
    let roleId: any = $("#userRole").val();
    let mobile: any = $("#mobile").val();
    let email: any = $("#email").val();
    let password: any = $("#password").val();
    let expiryDate: any = $("#expiryDate").val();
    let officeAppUserId: any = $("#officeAppUserId").val();
    let isTaskManager: any = 0;
    let isActual: any = 0;
    let isActualWorkPercentage: any = 0;
    let isLock: any = 0;
    let isAdmin: any = 0;
    let isManager: any = 0;
    let isAttendanceApprover: any = 0;
    let canUpdateEmployeeDetail: any = 0;
    let canUpdateOpendepotPickDetail: any = 0;
    let canUpdateLeaveBalance:any=0;
    let canViewAttendance:any=0;
    let canUpdateDustbinPickDetail:any=0;
    if (officeAppUserId == "") {
      officeAppUserId = 0;
    }
    if (expiryDate == "") {
      expiryDate = "";
    }
    let accessCities = "";
    if (this.cityList.length > 0) {
      for (let i = 0; i < this.cityList.length; i++) {
        let city = this.cityList[i]["city"];
        let chkId = "chkCity" + city;
        if ((<HTMLInputElement>document.getElementById(chkId)).checked == true) {
          if (accessCities == "") {
            accessCities = city;
          }
          else {
            accessCities = accessCities + "," + city;
          }
        }
      }
    }
    let element = <HTMLInputElement>document.getElementById("notificationHalt");
    if (element.checked == true) notificationHalt = 1;
    element = <HTMLInputElement>(document.getElementById("notificationMobileDataOff"));
    if (element.checked == true) notificationMobileDataOff = 1;
    element = <HTMLInputElement>(document.getElementById("notificationSkippedLines"));
    if (element.checked == true) notificationSkippedLines = 1;
    element = <HTMLInputElement>(document.getElementById("notificationPickDustbins"));
    if (element.checked == true) notificationPickDustbins = 1;
    element = <HTMLInputElement>(document.getElementById("notificationGeoSurfing"));
    if (element.checked == true) notificationGeoSurfing = 1;
    element = <HTMLInputElement>document.getElementById("isTaskManager");
    if (element.checked == true) isTaskManager = 1;
    element = <HTMLInputElement>document.getElementById("haltDisableAccess");
    if (element.checked == true) haltDisableAccess = 1;
    element = <HTMLInputElement>document.getElementById("isActual");
    if (element.checked == true) isActual = 1;
    element = <HTMLInputElement>document.getElementById("isLock");
    if (element.checked == true) isLock = 1;
    element = <HTMLInputElement>document.getElementById("isAdmin");
    if (element.checked == true) isAdmin = 1;
    element = <HTMLInputElement>document.getElementById("isActualWorkPercentage");
    if (element.checked == true) isActualWorkPercentage = 1;
    element = <HTMLInputElement>document.getElementById("isAttendanceApprover");
    if (element.checked == true) isAttendanceApprover = 1;
    element = <HTMLInputElement>document.getElementById("isManager");
    if (element.checked == true) isManager = 1;
    element = <HTMLInputElement>document.getElementById("canUpdateEmployeeDetail");
    if (element.checked == true) canUpdateEmployeeDetail = 1;
    element = <HTMLInputElement>document.getElementById("canUpdateOpendepotPickDetail");
    if (element.checked == true) canUpdateOpendepotPickDetail = 1;
    element = <HTMLInputElement>document.getElementById("canUpdateLeaveBalance");
    if (element.checked == true) canUpdateLeaveBalance = 1;
    element = <HTMLInputElement>document.getElementById("canUpdateDustbinPickDetail");
    if (element.checked == true) canUpdateDustbinPickDetail = 1;
    element = <HTMLInputElement>document.getElementById("canViewAttendance");
    if (element.checked == true) canViewAttendance = 1;
    if (this.userid == null) {
      let lastKey = Number(this.userJsonData["lastKey"]) + 1;
      this.userid = lastKey;
    }

    const dish = {
      userId: this.userid,
      name: name,
      userType: userType,
      mobile: mobile,
      email: email,
      password: password,
      creattionDate: this.toDayDate,
      isDelete: 0,
      notificationHalt: notificationHalt,
      notificationMobileDataOff: notificationMobileDataOff,
      notificationSkippedLines: notificationSkippedLines,
      notificationPickDustbins: notificationPickDustbins,
      expiryDate: expiryDate,
      notificationGeoSurfing: notificationGeoSurfing,
      officeAppUserId: officeAppUserId,
      isTaskManager: isTaskManager,
      haltDisableAccess: haltDisableAccess,
      isActual: isActual,
      isActualWorkPercentage: isActualWorkPercentage,
      isLock: isLock,
      isAdmin: isAdmin,
      isManager: isManager,
      roleId: roleId,
      accessCities: accessCities,
      isAttendanceApprover: isAttendanceApprover,
      canUpdateEmployeeDetail: canUpdateEmployeeDetail,
      canUpdateOpendepotPickDetail:canUpdateOpendepotPickDetail,
      canUpdateLeaveBalance:canUpdateLeaveBalance,
      canViewAttendance:canViewAttendance,
      canUpdateDustbinPickDetail:canUpdateDustbinPickDetail
    };

    if (this.actRoute.snapshot.paramMap.get("id") != null) {
      this.userJsonData[this.userid] = dish;
      this.userService.savePortalUsers(this.userJsonData);
      let message = "" + $("#name").val() + " Updated Successfully !!!";
      let cssClass = "alert alert-info alert-with-icon";
      this.commonService.setAlertMessageWithCss("success", message, cssClass);
    } else {
      let lastKey = Number(this.userJsonData["lastKey"]) + 1;
      this.userJsonData["lastKey"] = lastKey;
      this.userJsonData[lastKey.toString()] = dish;
      this.userService.savePortalUsers(this.userJsonData);
      let message = "" + $("#name").val() + " Added Successfully !!!";
      let cssClass = "alert alert-info alert-with-icon";
      this.commonService.setAlertMessageWithCss("success", message, cssClass);
    }
    this.userService.setWebPortalUsers();
    setTimeout(() => {
      this.router.navigate(["/" + this.cityName + "/11/users"]);
    }, 2000);
  }

  cancelEntry() {
    this.router.navigate(["/" + this.cityName + "/11/users"]);
  }

  chkEmail() {
    if (this.validateEmail($("#email").val()) == false) {
      this.commonService.setAlertMessage("error", "Please Enter Valid Email ID !!!");
      return;
    }
  }

  chkMobile() {
    let mobileValue = $("#mobile").val();
    if (mobileValue.toString().length != 10) {
      if (this.validateEmail($("#email").val()) == false) {
        this.commonService.setAlertMessage("error", "Please Enter Valid Mobile No. !!!");
        return;
      }
    }
  }

  validateEmail(chkEmail: any) {
    const regularExpression =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regularExpression.test(String(chkEmail).toLowerCase());
  }
}
