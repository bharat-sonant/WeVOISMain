import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-web-portal-setting',
  templateUrl: './web-portal-setting.component.html',
  styleUrls: ['./web-portal-setting.component.scss']
})
export class WebPortalSettingComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  firestotagePath: any;
  dailyWorkDetailJsonObject: any;
  startTime: any = 0;
  reachOn: any = 0;
  endTime: any = 0;
  vehicle: any = 0;
  driver: any = 0;
  helper: any = 0;
  secondHelper: any = 0;
  trips: any = 0;
  workTime: any = 0;
  haltTime: any = 0;
  workPercentage: any = 0;
  runKM: any = 0;
  zoneRunKM: any = 0;

  vtsRouteCityList: any[] = [];
  vtsRouteLoaded: boolean = false;
  vtsRouteLoading: boolean = false;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", "Settings", localStorage.getItem("userID"));
    this.setDefault();
  }
  setDefault() {
    this.firestotagePath = this.commonService.fireStoragePath;
    this.getDailyWorkPercentagePermissions();
  }
  getDailyWorkPercentagePermissions() {
    const path = this.firestotagePath + this.commonService.getFireStoreCity() + "%2FSettings%2FDailyWorkReport.json?alt=media";
    let instance = this.httpService.get(path).subscribe(dailyWorkDetailJsonData => {
      instance.unsubscribe();
      if (dailyWorkDetailJsonData != null) {
        console.log(dailyWorkDetailJsonData);
        let element = <HTMLInputElement>document.getElementById("chkStartTime");
        if (dailyWorkDetailJsonData["startTime"] == 1) element.checked = true;
        element = <HTMLInputElement>(document.getElementById("chkReachOn"));
        if (dailyWorkDetailJsonData["reachOn"] == 1) element.checked = true;
        element = <HTMLInputElement>(document.getElementById("chkEndTime"));
        if (dailyWorkDetailJsonData["endTime"] == 1) element.checked = true;
        element = <HTMLInputElement>(document.getElementById("chkVehicle"));
        if (dailyWorkDetailJsonData["vehicle"] == 1) element.checked = true;
        element = <HTMLInputElement>(document.getElementById("chkDriver"));
        if (dailyWorkDetailJsonData["driver"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkHelper");
        if (dailyWorkDetailJsonData["helper"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkSecondHelper");
        if (dailyWorkDetailJsonData["secondHelper"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkTrips");
        if (dailyWorkDetailJsonData["trips"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkWorkTime");
        if (dailyWorkDetailJsonData["workTime"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkHaltTime");
        if (dailyWorkDetailJsonData["haltTime"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkWorkPercentage");
        if (dailyWorkDetailJsonData["workPercentage"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkRunKM");
        if (dailyWorkDetailJsonData["runKM"] == 1) element.checked = true;
        element = <HTMLInputElement>document.getElementById("chkZoneRunKM");
        if (dailyWorkDetailJsonData["zoneRunKM"] == 1) element.checked = true;


      }
    });
  }
  saveDailyWorkPermission() {
    let element = <HTMLInputElement>document.getElementById("chkStartTime");
    if (element.checked == true) this.startTime = 1;
    element = <HTMLInputElement>(document.getElementById("chkReachOn"));
    if (element.checked == true) this.reachOn = 1;
    element = <HTMLInputElement>(document.getElementById("chkEndTime"));
    if (element.checked == true) this.endTime = 1;
    element = <HTMLInputElement>(document.getElementById("chkVehicle"));
    if (element.checked == true) this.vehicle = 1;
    element = <HTMLInputElement>(document.getElementById("chkDriver"));
    if (element.checked == true) this.driver = 1;
    element = <HTMLInputElement>document.getElementById("chkHelper");
    if (element.checked == true) this.helper = 1;
    element = <HTMLInputElement>document.getElementById("chkSecondHelper");
    if (element.checked == true) this.secondHelper = 1;
    element = <HTMLInputElement>document.getElementById("chkTrips");
    if (element.checked == true) this.trips = 1;
    element = <HTMLInputElement>document.getElementById("chkWorkTime");
    if (element.checked == true) this.workTime = 1;
    element = <HTMLInputElement>document.getElementById("chkHaltTime");
    if (element.checked == true) this.haltTime = 1;
    element = <HTMLInputElement>document.getElementById("chkWorkPercentage");
    if (element.checked == true) this.workPercentage = 1;
    element = <HTMLInputElement>document.getElementById("chkRunKM");
    if (element.checked == true) this.runKM = 1;
    element = <HTMLInputElement>document.getElementById("chkZoneRunKM");
    if (element.checked == true) this.zoneRunKM = 1;

    let obj = {
      startTime: this.startTime,
      reachOn: this.reachOn,
      endTime: this.endTime,
      vehicle: this.vehicle,
      driver: this.driver,
      helper: this.helper,
      secondHelper: this.secondHelper,
      trips: this.trips,
      workTime: this.workTime,
      haltTime: this.haltTime,
      workPercentage: this.workPercentage,
      runKM: this.runKM,
      zoneRunKM: this.zoneRunKM
    };

    let fileName = "DailyWorkReport.json";
    let path = "/Settings/";
    this.commonService.saveJsonFile(obj, fileName, path);
    this.commonService.setAlertMessage("success", "Daily work report permissions updated !!!");
  }
  setActiveTab(tab: any) {
    $("#DailyWorkReport").hide();
    $("#VTSRoute").hide();
    $("#Reader").hide();
    $("#Halt").hide();
    $("#Salary").hide();

    let element = <HTMLButtonElement>document.getElementById("tabDailyWorkReport");
    let className = element.className;
    $("#tabDailyWorkReport").removeClass(className);
    $("#tabDailyWorkReport").addClass("nav-link buttons");

    element = <HTMLButtonElement>document.getElementById("tabVTSRoute");
    className = element.className;
    $("#tabVTSRoute").removeClass(className);
    $("#tabVTSRoute").addClass("nav-link buttons");

    if (tab == "DailyWorkReport") {
      $("#DailyWorkReport").show();
      element = <HTMLButtonElement>document.getElementById("tabDailyWorkReport");
      className = element.className;
      $("#tabDailyWorkReport").removeClass(className);
      $("#tabDailyWorkReport").addClass("nav-link active buttons");

      element = <HTMLButtonElement>document.getElementById("DailyWorkReport");
      className = element.className;
      $("#DailyWorkReport").removeClass(className);
      $("#DailyWorkReport").addClass("tab-pane fade show active save");
    } else if (tab == "VTSRoute") {
      $("#VTSRoute").show();
      element = <HTMLButtonElement>document.getElementById("tabVTSRoute");
      className = element.className;
      $("#tabVTSRoute").removeClass(className);
      $("#tabVTSRoute").addClass("nav-link active buttons");

      element = <HTMLButtonElement>document.getElementById("VTSRoute");
      className = element.className;
      $("#VTSRoute").removeClass(className);
      $("#VTSRoute").addClass("tab-pane fade show active");

      this.loadVTSRouteCitySettings();
    }
  }

  async loadVTSRouteCitySettings() {
    if (this.vtsRouteLoaded) return;
    this.vtsRouteLoaded = true;
    this.vtsRouteLoading = true;
    const rawList: any[] = JSON.parse(localStorage.getItem("CityDetailList") || "[]");
    this.vtsRouteCityList = rawList.map((item: any) => ({
      city: item.city,
      cityName: item.cityName,
      databaseURL: item.databaseURL,
      isEnabled: false,
      hasError: false
    }));

    await Promise.all(this.vtsRouteCityList.map(async (city: any, index: number) => {
      if (!city.databaseURL) { this.vtsRouteCityList[index].hasError = true; return; }
      try {
        const url = `${city.databaseURL}/Settings/VTSRouteVisibility/externalUser.json`;
        const data: any = await this.httpService.get(url).toPromise();
        this.vtsRouteCityList[index].isEnabled = data === true;
      } catch {
        this.vtsRouteCityList[index].hasError = true;
      }
    }));

    this.vtsRouteLoading = false;
  }

  saveVTSCitySetting(city: any) {
    if (city.hasError || !city.databaseURL) return;
    const url = `${city.databaseURL}/Settings/VTSRouteVisibility/externalUser.json`;
    this.httpService.put(url, city.isEnabled).subscribe(() => {
      this.commonService.setAlertMessage("success", city.cityName + " – VTS Route visibility updated !!!");
    });
  }
}
