import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
@Component({
  selector: 'app-dustbin-service',
  templateUrl: './dustbin-service.component.html',
  styleUrls: ['./dustbin-service.component.scss']
})
export class DustbinServiceComponent implements OnInit {
  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }

  db: any;
  cityName: any;
  selectedDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  zoneList: any[];
  dustbinList: any[];
  entryList: any[];
  dustbinStorageList: any[];
  selectedZone: any;
  driverList: any[];
  vehicleList: any[];
  fireStoreCity: any;
  fireStorePath: any;
  txtDate = "#txtDate";
  ddlZone = "#ddlZone";
  txtPlan = "#txtPlan";
  ddlDustbin = "#ddlDustbin";
  txtPercentage = "#txtPercentage";
  txtPickTime = "#txtPickTime";
  txtTimeDiff = "#txtTimeDiff";
  ddlDriver = "#ddlDriver";
  ddlVahicle = "#ddlVahicle";


  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStorePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.selectedDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.dustbinList = [];
    this.entryList = [];
    this.zoneList = [];
    this.dustbinStorageList = [];
    this.selectedZone == "0";
    this.driverList = [];
    this.vehicleList = [];
    this.getDriverList();
    this.getVehicleList();
    this.getZoneList();
  }

  getDriverList() {
    this.driverList = [];
    const path = this.fireStorePath + this.fireStoreCity + "%2Fdriver.json?alt=media";
    let Instance = this.httpService.get(path).subscribe(data => {
      Instance.unsubscribe();
      let keyArray = Object.keys(data);
      for (let i = 1; i < keyArray.length; i++) {
        let index = keyArray[i];
        let id = data[index]["id"];
        let name = data[index]["name"];
        this.driverList.push({ id: id, name: name });
      }
    });
  }

  getVehicleList() {
    this.driverList = [];
    const path = this.fireStorePath + this.fireStoreCity + "%2Fvehicle.json?alt=media";
    let Instance = this.httpService.get(path).subscribe(data => {
      Instance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));
      if (list.length > 0) {
        for (let i = 0; i < list.length; i++) {
          this.vehicleList.push({ vehicle: list[i] });
        }
      }
    });
  }

  getZoneList() {
    this.zoneList = [];
    this.dustbinStorageList = [];
    this.dustbinStorageList = JSON.parse(localStorage.getItem("dustbin"));
    if (this.dustbinStorageList != null) {
      this.dustbinStorageList = this.commonService.transform(this.dustbinStorageList, "zone");
      for (let i = 0; i < this.dustbinStorageList.length; i++) {
        let zoneDetails = this.zoneList.find(item => item.zoneNo == this.dustbinStorageList[i]["zone"]);
        if (zoneDetails == undefined) {
          this.zoneList.push({ zoneNo: this.dustbinStorageList[i]["zone"], zone: "Zone " + this.dustbinStorageList[i]["zone"], pickFrequency: this.dustbinStorageList[i]["pickFrequency"] })
        }
      }
      this.zoneList = this.commonService.transformNumeric(this.zoneList, 'zone');
    }
  }


  getDustbins() {
    this.dustbinList = [];
    this.selectedZone = $("#ddlZone").val();
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone");
      return;
    }
    for (let i = 0; i < this.dustbinStorageList.length; i++) {
      if (this.dustbinStorageList[i]["zone"] == this.selectedZone && this.dustbinStorageList[i]["isDisabled"] != "yes") {
        this.dustbinList.push({ dustbin: this.dustbinStorageList[i]["dustbin"], address: this.dustbinStorageList[i]["address"] });
      }
    }
  }

  addData() {

    let dustbinId = $(this.ddlDustbin).val();
    let percentage = $(this.txtPercentage).val();
    let pickTime = $(this.txtPickTime).val();
    let diff = $(this.txtTimeDiff).val();


    if (dustbinId == "0") {
      this.commonService.setAlertMessage("error", "Please select dustbin");
      return;
    }
    if (percentage == "") {
      this.commonService.setAlertMessage("error", "Please enter percentage");
      return;
    }
    if (pickTime == "") {
      this.commonService.setAlertMessage("error", "Please select pick time");
      return;
    }
    if (diff == "") {
      this.commonService.setAlertMessage("error", "Please select Analysis time difference");
      return;
    }

    let chkDeustbin = this.entryList.find(item => item.dustbinId == dustbinId);
    if (chkDeustbin != undefined) {
      this.commonService.setAlertMessage("error", "Already in list");
      return;
    }

    let dat = new Date(this.selectedDate + " " + pickTime);
    let dat2 = this.addMinutes(dat, diff);
    let hour = dat2.getHours().toString();
    let min = dat2.getMinutes().toString();
    let sec = dat2.getSeconds().toString();
    if (hour.length == 1) {
      hour = "0" + hour;
    }
    if (min.length == 1) {
      min = "0" + min;
    }
    if (sec.length == 1) {
      sec = "0" + sec;
    }
    let analysisTime = hour + ":" + min + ":" + sec;


    let zone = "";
    let detail = this.zoneList.find(item => item.zoneNo == zone);
    if (detail != undefined) {
      zone = detail.zone;
    }
    let address = "";
    detail = this.dustbinList.find(item => item.dustbin == dustbinId);
    if (detail != undefined) {
      address = detail.address;
    }
    this.entryList.push({ dustbinId: dustbinId, address: address, percentage: percentage, pickTime: pickTime, analysisTime: analysisTime });
    this.clearAll();
  }

  clearAll() {
    $(this.ddlDustbin).val("0");
    $(this.txtPercentage).val("");
    $(this.txtPickTime).val("");
    $(this.txtTimeDiff).val("");
  }

  saveData() {
    let date = $(this.txtDate).val();
    this.selectedZone = $(this.ddlZone).val();
    let planName = "";
    let driverId = $(this.ddlDriver).val();
    let vehicle = $(this.ddlVahicle).val();
    let dustbinId = $(this.ddlDustbin).val();
    let percentage = $(this.txtPercentage).val();
    let pickTime = $(this.txtPickTime).val();
    let diff = $(this.txtTimeDiff).val();
    if (date == "") {
      this.commonService.setAlertMessage("error", "Please select date");
      return;
    }
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone");
      return;
    }

    if (driverId == "0") {
      this.commonService.setAlertMessage("error", "Please select driver");
      return;
    }
    if (vehicle == "0") {
      this.commonService.setAlertMessage("error", "Please select vehicle");
      return;
    }
    if (dustbinId == "0") {
      this.commonService.setAlertMessage("error", "Please select dustbin");
      return;
    }
    if (percentage == "") {
      this.commonService.setAlertMessage("error", "Please enter percentage");
      return;
    }
    if (pickTime == "") {
      this.commonService.setAlertMessage("error", "Please select pick time");
      return;
    }
    if (diff == "") {
      this.commonService.setAlertMessage("error", "Please select Analysis time difference");
      return;
    }

    let element = <HTMLInputElement>document.getElementById("chk");


    let dat = new Date(this.selectedDate + " " + pickTime);
    let dat2 = this.addMinutes(dat, diff);
    let hour = dat2.getHours().toString();
    let min = dat2.getMinutes().toString();
    let sec = dat2.getSeconds().toString();
    if (hour.length == 1) {
      hour = "0" + hour;
    }
    if (min.length == 1) {
      min = "0" + min;
    }
    if (sec.length == 1) {
      sec = "0" + sec;
    }
    let analysisTime = hour + ":" + min + ":" + sec;

    let bins = "";
    for (let i = 0; i < this.entryList.length; i++) {
      if (i == 0) {
        bins = this.entryList[i]["dustbinId"];
      }
      else {
        bins = bins + ", " + this.entryList[i]["dustbinId"];
      }
    }

    this.selectedYear = date.toString().split('-')[0];
    this.selectedMonth = date.toString().split('-')[1];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);

    let key = "-" + this.randomString(20);
    const data = {
      bins: dustbinId,
      pickedDustbin: dustbinId,
      pickingSequence: dustbinId,
      isAssigned: "true",
      planName: planName,
      totalDustbin: 1,
      createdBy: "-1",
    }

    let dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.selectedYear + "/" + this.selectedMonthName + "/" + date + "/" + key;
    this.db.object(dbPath).update(data);

    let JsonObj = {};
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDustbinData%2FDustbinPickingPlanHistory%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + date + ".json?alt=media";
    let dustbinPlanHistoryInstance = this.httpService.get(path).subscribe(planHistoryData => {
      dustbinPlanHistoryInstance.unsubscribe();
      JsonObj = planHistoryData;
      JsonObj[key] = data;
      this.commonService.saveJsonFile(JsonObj, date + ".json", "/DustbinData/DustbinPickingPlanHistory/" + this.selectedYear + "/" + this.selectedMonthName + "/")
    }, error => {
      JsonObj[key] = data;
      this.commonService.saveJsonFile(JsonObj, date + ".json", "/DustbinData/DustbinPickingPlanHistory/" + this.selectedYear + "/" + this.selectedMonthName + "/")
    });


    const data1 = {
      driver: driverId,
      planId: key,
      planName: planName,
      vehicle: vehicle
    }

    dbPath = "DustbinData/DustbinAssignment/" + this.selectedYear + "/" + this.selectedMonthName + "/" + date + "/" + key;
    this.db.object(dbPath).update(data1);

    let zone = "";
    let detail = this.zoneList.find(item => item.zoneNo == zone);
    if (detail != undefined) {
      zone = detail.zone;
    }
    let address = "";
    detail = this.dustbinList.find(item => item.dustbin == dustbinId);
    if (detail != undefined) {
      address = detail.address;
    }
    if (element.checked == true) {
      const analysisData = {
        analysisAt: date + " " + analysisTime,
        analysisBy: 21,
        filledPercentage: percentage
      }

      const data2 = {
        Analysis: analysisData,
        address: address,
        pickDateTime: date + " " + pickTime,
        pickedBy: driverId,
        zone: this.selectedZone,
        endTime: date + " " + pickTime
      }

      dbPath = "DustbinData/DustbinPickHistory/" + this.selectedYear + "/" + this.selectedMonthName + "/" + date + "/" + dustbinId + "/" + key;

      this.db.object(dbPath).update(data2);
    }

    this.commonService.setAlertMessage("Success", "Data saved successfully!!!");
  }

  randomString(length) {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
  }

  deleteEntry(dustbinId) {
    let list = [];
    for (let i = 0; i < this.entryList.length; i++) {
      if (this.entryList[i]["dustbinId"] != dustbinId) {
        list.push({ dustbinId: this.entryList[i]["dustbinId"], address: this.entryList[i]["address"], percentage: this.entryList[i]["percentage"], pickTime: this.entryList[i]["pickTime"], analysisTime: this.entryList[i]["analysisTime"] })
      }
    }
    this.entryList = list;
  }

  addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }


}
