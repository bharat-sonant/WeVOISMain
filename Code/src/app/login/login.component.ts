import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as $ from 'jquery';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireModule } from 'angularfire2';
import { CommonService } from '../services/common/common.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  constructor(private router: Router, private commonService: CommonService, private toastr: ToastrService, public db: AngularFireDatabase) { }
  userId: any;
  userName: any = "admin";
  expiryDate: any;
  portalAccessList: any[];
  vehicleList: any[];
  dustbinList: any[];
  fixdGeoLocations: any[];
  cityName: any;

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    $('.navbar-toggler').hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    this.commonService.setLocalStorageData(this.cityName);    
  }

  doLogin() {
    let userName = $("#txtUserName").val();
    let password = $("#txtPassword").val();
    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    let userDetails = userList.find(item => item.email == userName && item.password == password);
    if (userDetails != undefined) {

      if (userDetails.expiryDate != null) {
        this.expiryDate = userDetails.expiryDate;
        localStorage.setItem('expiryDate', this.expiryDate);
      }
      else {
        this.expiryDate = null;
        localStorage.setItem('expiryDate', null);
      }
      localStorage.setItem('userName', userDetails.name);
      localStorage.setItem('userID', userDetails.userId);
      localStorage.setItem('userKey', userDetails.userKey);
      localStorage.setItem('userType', userDetails.userType);
      if (userDetails.officeAppUserId != undefined) {
        localStorage.setItem('officeAppUserId', userDetails.officeAppUserId);
      }
      if (userDetails.empLocation != undefined) {
        localStorage.setItem('empLocation', userDetails.empLocation);
      }
      if (userDetails.isTaskManager != undefined) {
        localStorage.setItem('isTaskManager', userDetails.isTaskManager);
      }
      else {
        localStorage.setItem("isTaskManager", "0");
      }
      localStorage.setItem('notificationHalt', userDetails.notificationHalt);
      localStorage.setItem('notificationMobileDataOff', userDetails.notificationMobileDataOff);
      localStorage.setItem('notificationSkippedLines', userDetails.notificationSkippedLines);
      localStorage.setItem('notificationPickDustbins', userDetails.notificationPickDustbins);
      localStorage.setItem('notificationGeoSurfing', userDetails.notificationGeoSurfing);
      if (this.expiryDate != null) {
        if (new Date(this.commonService.setTodayDate()) < new Date(this.expiryDate)) {
          localStorage.setItem('loginStatus', "Success");
          setTimeout(() => {
            window.location.href = this.cityName + "/home";
            //  $("#divMainContent").css("width", "calc(100% - 80px)");
            //  $("#divSideMenus").show();
          }, 1000);
          // this.router.navigate(['/home']);
        }
        else {
          localStorage.setItem('loginStatus', "Fail");
          this.commonService.setAlertMessage("error", "Account Not Activate !!!");
        }
      }
      else {
        localStorage.setItem('expiryDate', null);
        localStorage.setItem('loginStatus', "Success");
        setTimeout(() => {
          window.location.href = this.cityName + "/home";
          // $("#divMainContent").css("width", "calc(100% - 80px)");
          //$("#divSideMenus").show();
        }, 1000);
      }
    }
    else {
      localStorage.setItem('loginStatus', "Fail");
      this.commonService.setAlertMessage("error", "Invalid username or password !!!");
    }
  }


}
