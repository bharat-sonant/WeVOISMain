import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as $ from "jquery";
import { CommonService } from '../services/common/common.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private router: Router, private commonService: CommonService) { }

  ngOnInit() {
    localStorage.setItem("userAccessList", null);
    localStorage.setItem("savedData", null);
    localStorage.setItem("fixedLocation", null);
    localStorage.setItem("routeMonthDetail", null);
    localStorage.setItem("savedRouteData", null);
    localStorage.setItem("employeeDetail", null);
    localStorage.setItem("wardLineStorage", null);
    localStorage.setItem("lineStatusDate", null);
    localStorage.setItem("employee", null);
    localStorage.setItem("expiryDate", null);
    localStorage.setItem("vehicle", null);
    localStorage.setItem("dustbin", null);
    localStorage.setItem("employeeList", null);
    localStorage.setItem('loginStatus', "Fail");
    localStorage.setItem('webPortalUserList', null);
    localStorage.setItem('dustbin', null);
    localStorage.setItem('portalAccess', null);
    localStorage.setItem('userID', null);
    localStorage.setItem('cityName', null);
    this.router.navigate(['/index']);
    $("#divSideMenus").hide();
    localStorage.setItem('notificationHalt', "0");
    localStorage.setItem('notificationMobileDataOff', "0");
    localStorage.setItem('notificationSkippedLines', "0");
    localStorage.setItem('notificationPickDustbins', "0");
    localStorage.setItem('notificationGeoSurfing', "0");
    if (this.commonService.notificationInterval != null) {
      this.commonService.notificationInterval.unsubscribe();
    }
  }

}
