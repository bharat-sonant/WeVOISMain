import { Component, OnInit } from "@angular/core";
import { UserService } from "../../services/common/user.service";
import { CommonService } from "../../services/common/common.service";
import { ToastrService } from "ngx-toastr"; // Alert message using NGX toastr
import { Users } from "../../Users/users"; // Users data type interface class
import * as $ from "jquery";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFirestore } from "@angular/fire/firestore";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-user-add",
  templateUrl: "./user-add.component.html",
  styleUrls: ["./user-add.component.scss"],
})
export class UserAddComponent implements OnInit {
  //public userForm: FormGroup;
  constructor(private router: Router, public dbFireStore: AngularFirestore, public usrService: UserService, private actRoute: ActivatedRoute, public commonService: CommonService, public toastr: ToastrService, public db: AngularFireDatabase) { }

  usr: Users;
  toDayDate: any;
  usrid: any;
  userRecord: any[];
  userid: any;
  $Key: any;
  cityName: any;

  ngOnInit() {

    this.cityName = localStorage.getItem("cityName");
    this.toDayDate = this.commonService.setTodayDate();
    const id = this.actRoute.snapshot.paramMap.get("id");
    this.userid = id;

    if (id != null) {
      this.usrid = id;
      this.dbFireStore.collection("UserManagement").doc("Users").collection("Users").doc(this.userid).get().subscribe((doc) => {
        this.usrid = doc.data()["userId"];
        $("#name").val(doc.data()["name"]);
        $("#name").val(doc.data()["name"]);
        $("#userType").val(doc.data()["userType"]);
        $("#mobile").val(doc.data()["mobile"]);
        $("#email").val(doc.data()["email"]);
        $("#password").val(doc.data()["password"]);
        $("#expiryDate").val(doc.data()["expiryDate"]);
        if (doc.data()["officeAppUserId"] != null) {
          $("#officeAppUserId").val(doc.data()["officeAppUserId"]);
        }
        if (doc.data()["empLocation"] != null) {
          $("#empLocation").val(doc.data()["empLocation"]);
        }
        if (doc.data()["notificationHalt"] == "1") {
          (<HTMLInputElement>(document.getElementById("notificationHalt"))).checked = true;
        }
        if (doc.data()["notificationMobileDataOff"] == 1) {
          (<HTMLInputElement>(document.getElementById("notificationMobileDataOff"))).checked = true;
        }
        if (doc.data()["notificationSkippedLines"] == 1) {
          (<HTMLInputElement>(document.getElementById("notificationSkippedLines"))).checked = true;
        }
        if (doc.data()["notificationPickDustbins"] == 1) {
          (<HTMLInputElement>(document.getElementById("notificationPickDustbins"))).checked = true;
        }
        if (doc.data()["notificationGeoSurfing"] == 1) {
          (<HTMLInputElement>(document.getElementById("notificationGeoSurfing"))).checked = true;
        }
        if (doc.data()["isTaskManager"] == 1) {
          (<HTMLInputElement>(document.getElementById("isTaskManager"))).checked = true;
        }
        if (doc.data()["haltDisableAccess"] != undefined) {
          if (doc.data()["haltDisableAccess"] == 1) {
            (<HTMLInputElement>(document.getElementById("haltDisableAccess"))).checked = true;
          }
        }
        if(doc.data()["isActual"]!=undefined){
          if (doc.data()["isActual"] == 1) {
            (<HTMLInputElement>(document.getElementById("isActual"))).checked = true;
          }
        }
        if(doc.data()["isLock"]!=undefined){
          if (doc.data()["isLock"] == 1) {
            (<HTMLInputElement>(document.getElementById("isLock"))).checked = true;
          }
        }
        if(doc.data()["isAdmin"]!=undefined){
          if (doc.data()["isAdmin"] == 1) {
            (<HTMLInputElement>(document.getElementById("isAdmin"))).checked = true;
          }
        }
      });
    } else {
      this.userRecord = [];
      this.dbFireStore.collection("UserManagement").doc("Users").collection("Users").get().subscribe((ss) => {
        const document = ss.docs;
        document.forEach((doc) => {
          this.userRecord.push({ userId: doc.data()["userId"] });
        });
        if (this.userRecord.length == 0) {
          this.usrid = 1;
        } else {
          this.userRecord = this.commonService.transform(this.userRecord, "userId");
          // var sorted = this.userRecord.sort();
          this.usrid =
            this.userRecord[this.userRecord.length - 1]["userId"] + 1;

        }
      });
    }
  }

  submitData() {
    const id = this.actRoute.snapshot.paramMap.get("id");
    if ($("#userType").val() == "0") {
      this.commonService.setAlertMessage("error", "Please Select User Type !!!");
      return;
    }
    if ($("#name").val() == "") {
      this.commonService.setAlertMessage("error", "Please Enter User Name !!!");
      return;
    }
    if ($("#mobile").val() == "") {
      this.commonService.setAlertMessage(
        "error",
        "Please Enter Mobile No. !!!"
      );
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
    } else {
      if (this.userRecord != null) {
        for (let i = 0; i < this.userRecord.length; i++) {
          if (this.usrid == null) {
            if (emailChk == this.userRecord[i]["email"]) {
              if (this.userRecord[i]["isDelete"] == "0") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with active user !!!");
              } else if (this.userRecord[i]["isDelete"] == "1") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with deleted user !!!");
              }
              return;
            }
          } else {
            if (
              emailChk == this.userRecord[i]["email"] &&
              this.usrid != this.userRecord[i]["userId"]
            ) {
              if (this.userRecord[i]["isDelete"] == "0") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with active user !!!");
              } else if (this.userRecord[i]["isDelete"] == "1") {
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
    let userId: any = this.usrid;
    let name: any = $("#name").val();
    let userType: any = $("#userType").val();
    let mobile: any = $("#mobile").val();
    let email: any = $("#email").val();
    let password: any = $("#password").val();
    let expiryDate: any = $("#expiryDate").val();
    let officeAppUserId: any = $("#officeAppUserId").val();
    let isTaskManager: any = 0;
    let isActual:any=0;
    let isLock:any=0;
    let isAdmin:any=0;
    if (officeAppUserId == "") {
      officeAppUserId = 0;
    }
    if (expiryDate == "") {
      expiryDate = "";
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

    const dish = {
      userId: userId,
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
      isActual:isActual,
      isLock:isLock,
      isAdmin:isAdmin
    };

    if (id != null) {
      this.usrService.UpdateUser(id, dish);
      let message = "" + $("#name").val() + " Updated Successfully !!!";
      let cssClass = "alert alert-info alert-with-icon";
      this.commonService.setAlertMessageWithCss("success", message, cssClass);
    } else {
      this.usrService.AddUser(dish);
      let message = "" + $("#name").val() + " Added Successfully !!!";
      let cssClass = "alert alert-info alert-with-icon";
      this.commonService.setAlertMessageWithCss("success", message, cssClass);
    }
    this.router.navigate(["/" + this.cityName + "/11/users"]);
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
        this.commonService.setAlertMessage("error", "Please Enter Valid Mobile N0. !!!");
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
