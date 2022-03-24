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
    localStorage.removeItem("userAccessList");
    localStorage.removeItem("savedData");
    localStorage.removeItem("fixedLocation");
    localStorage.removeItem("routeMonthDetail");
    localStorage.removeItem("savedRouteData");
    localStorage.removeItem("employeeDetail");
    localStorage.removeItem("wardLineStorage");
    localStorage.removeItem("lineStatusDate");
    localStorage.removeItem("employee");
    localStorage.removeItem("expiryDate");
    localStorage.removeItem("vehicle");
    localStorage.removeItem("dustbin");
    localStorage.removeItem("employeeList");
    localStorage.setItem('loginStatus', "Fail");
    localStorage.removeItem('webPortalUserList');
    localStorage.removeItem('dustbin');
    localStorage.removeItem('portalAccess');
    localStorage.removeItem('userID');
    localStorage.removeItem('officeAppUserId');
    localStorage.removeItem('empLocation');
    localStorage.removeItem('cityName');
    $("#divSideMenus").hide();
    localStorage.setItem('notificationHalt', "0");
    localStorage.setItem('notificationMobileDataOff', "0");
    localStorage.setItem('notificationSkippedLines', "0");
    localStorage.setItem('notificationPickDustbins', "0");
    localStorage.setItem('notificationGeoSurfing', "0");
    localStorage.setItem('isTaskManager', "0");
    localStorage.removeItem("houseList");
    localStorage.removeItem("jmapWardSummaryList");
    localStorage.removeItem("loginDate");
    localStorage.removeItem("vtsUserList");
    localStorage.removeItem("mapUpdateHistory");
    localStorage.removeItem("wardWorkTrackingLineShow");
    localStorage.removeItem("designation");
    if (this.commonService.notificationInterval != null) {
      this.commonService.notificationInterval.unsubscribe();
    }
    this.router.navigate(['/index']);
  }

}
