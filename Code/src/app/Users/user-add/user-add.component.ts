import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/common/user.service';
import { CommonService } from '../../services/common/common.service';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { Users } from '../../Users/users';  // Users data type interface class
import * as $ from 'jquery';
import { AngularFireDatabase } from 'angularfire2/database';
import { ActivatedRoute, Router } from "@angular/router";


@Component({
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  styleUrls: ['./user-add.component.scss']
})
export class UserAddComponent implements OnInit {
  //public userForm: FormGroup;
  constructor(private router: Router, public usrService: UserService, private actRoute: ActivatedRoute, public commonService: CommonService, public toastr: ToastrService, public db: AngularFireDatabase) { }

  usr: Users;
  toDayDate: any;
  usrid: any;
  userRecord: any[];
  userid: any;
  $Key: any;
  cityName: any;

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    this.toDayDate = this.commonService.setTodayDate();
    const id = this.actRoute.snapshot.paramMap.get('id');
    this.userid = id;
    if (id != null) {
      //this.usrid=id;
      this.$Key = id;
      let myUser = this.db.object('Users/' + id).valueChanges().subscribe(
        data => {
          this.usrid = data["userId"];
          $("#name").val(data["name"]);
          $("#userType").val(data["userType"]);
          $("#mobile").val(data["mobile"]);
          $("#email").val(data["email"]);
          $("#password").val(data["password"]);
          $('#expiryDate').val(data["expiryDate"]);
          if (data["officeAppUserId"] != null) {
            $('#officeAppUserId').val(data["officeAppUserId"]);
          }
          if (data["empLocation"] != null) {
            $('#empLocation').val(data["empLocation"]);
          }
          if (data["notificationHalt"] == "1") {
            (<HTMLInputElement>document.getElementById("notificationHalt")).checked = true;
          }
          if (data["notificationMobileDataOff"] == 1) {
            (<HTMLInputElement>document.getElementById("notificationMobileDataOff")).checked = true;
          }
          if (data["notificationSkippedLines"] == 1) {
            (<HTMLInputElement>document.getElementById("notificationSkippedLines")).checked = true;
          }
          if (data["notificationPickDustbins"] == 1) {
            (<HTMLInputElement>document.getElementById("notificationPickDustbins")).checked = true;
          }
          if (data["notificationGeoSurfing"] == 1) {
            (<HTMLInputElement>document.getElementById("notificationGeoSurfing")).checked = true;
          }
          if (data["isTaskManager"] == 1) {
            (<HTMLInputElement>document.getElementById("isTaskManager")).checked = true;
          }

          myUser.unsubscribe();
        })

      let myUserList = this.db.list('Users/').valueChanges().subscribe(
        dataList => {
          this.userRecord = [];
          for (let i = 0; i < dataList.length; i++) {
            this.userRecord.push({ userId: dataList[i]["userId"], email: dataList[i]["email"], isDelete: dataList[i]["isDelete"] });
          }
          myUser.unsubscribe();
        });
    }
    else {
      let myUser = this.db.list('Users/').valueChanges().subscribe(
        data => {
          this.userRecord = [];
          this.$Key = 1;
          if (data.length == 0) {
            this.usrid = 1;
          }
          else {
            for (let i = 0; i < data.length; i++) {
              this.userRecord.push({ userId: data[i]["userId"], email: data[i]["email"], isDelete: data[i]["isDelete"] });
            }
            var sorted = this.userRecord.sort();
            this.usrid = (this.userRecord[this.userRecord.length - 1]["userId"] + 1);
          }
          myUser.unsubscribe();
        });
    }
  }

  submitData() {
    const id = this.actRoute.snapshot.paramMap.get('id');
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
    if ($("#email").val() == "") {
      this.commonService.setAlertMessage("error", "Please Enter Email ID !!!");
      return;
    }
    let emailChk = $("#email").val();
    if (this.validateEmail(emailChk) == false) {
      this.commonService.setAlertMessage("error", "Please Enter Valid Email ID !!!");
      return;
    }
    else {
      if (this.userRecord != null) {
        for (let i = 0; i < this.userRecord.length; i++) {
          if (this.usrid == null) {
            if (emailChk == this.userRecord[i]["email"]) {
              if (this.userRecord[i]["isDelete"] == "0") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with active user !!!");
              }
              else if (this.userRecord[i]["isDelete"] == "1") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with deleted user !!!");
              }
              return;
            }
          }
          else {
            if (emailChk == this.userRecord[i]["email"] && this.usrid != this.userRecord[i]["userId"]) {
              if (this.userRecord[i]["isDelete"] == "0") {
                this.commonService.setAlertMessage("error", "Email Id " + emailChk + " already exist with active user !!!");
              }
              else if (this.userRecord[i]["isDelete"] == "1") {
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
    let userId: any = this.usrid;
    let name: any = $("#name").val();
    let userType: any = $("#userType").val();
    let mobile: any = $("#mobile").val();
    let email: any = $("#email").val();
    let password: any = $("#password").val();
    let expiryDate: any = $("#expiryDate").val();
    let officeAppUserId: any = $('#officeAppUserId').val();
    let empLocation: any = $('#empLocation').val();
    let isTaskManager: any = 0;
    if (officeAppUserId == "") {
      officeAppUserId = null;
    }
    if (expiryDate == "") {
      expiryDate = null;
    }
    let element = <HTMLInputElement>document.getElementById("notificationHalt");
    if (element.checked == true)
      notificationHalt = 1;
    element = <HTMLInputElement>document.getElementById("notificationMobileDataOff");
    if (element.checked == true)
      notificationMobileDataOff = 1;
    element = <HTMLInputElement>document.getElementById("notificationSkippedLines");
    if (element.checked == true)
      notificationSkippedLines = 1;
    element = <HTMLInputElement>document.getElementById("notificationPickDustbins");
    if (element.checked == true)
      notificationPickDustbins = 1;
    element = <HTMLInputElement>document.getElementById("notificationGeoSurfing");
    if (element.checked == true)
      notificationGeoSurfing = 1;
    element = <HTMLInputElement>document.getElementById("isTaskManager");
    if (element.checked == true)
      isTaskManager = 1;

    const dish = {
      $Key: this.$Key,
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
      empLocation: empLocation,
      isTaskManager:isTaskManager
    };

    let myUser = this.db.list('Users/').valueChanges().subscribe(
      data => {

        this.userRecord = [];
        if (data.length == 0) {
          this.usrid = 1;
        }
        else {
          for (let i = 0; i < data.length; i++) {
            this.userRecord.push({ userId: data[i]["userId"] });
          }
          var sorted = this.userRecord.sort();
          this.usrid = (this.userRecord[this.userRecord.length - 1]["userId"] + 1);
        }
        myUser.unsubscribe();
      });

    if (id != null) {
      this.usrService.UpdateUser(dish);
      let message = "" + $("#name").val() + " Updated Successfully !!!";
      let cssClass = "alert alert-info alert-with-icon";
      this.commonService.setAlertMessageWithCss("success", message, cssClass);
    }
    else {
      this.usrService.AddUser(dish);
      let message = "" + $("#name").val() + " Added Successfully !!!";
      let cssClass = "alert alert-info alert-with-icon";
      this.commonService.setAlertMessageWithCss("success", message, cssClass);
      $("#name").val("");
      $("#userType").val("0");
      $("#mobile").val("");
      $("#email").val("");
      $("#password").val("");
      $('#officeAppUserId').val("");
      $('#empLocation').val("0");
    }
    this.router.navigate(['/' + this.cityName + '/users']);
  }

  cancelEntry() {
    this.router.navigate(['/' + this.cityName + '/users']);
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
    const regularExpression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regularExpression.test(String(chkEmail).toLowerCase());
  }
}
