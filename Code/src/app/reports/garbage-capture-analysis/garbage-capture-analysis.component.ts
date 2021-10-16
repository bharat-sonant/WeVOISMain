import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-garbage-capture-analysis',
  templateUrl: './garbage-capture-analysis.component.html',
  styleUrls: ['./garbage-capture-analysis.component.scss']
})
export class GarbageCaptureAnalysisComponent implements OnInit {

  constructor(public fs: FirebaseService, private actRoute: ActivatedRoute, private commonService: CommonService) { }
  db: any;
  cityName: any;
  progressList: any[];
  allProgressList: any[];
  toDayDate: any;
  selectedDate: any;
  optionList: any[];
  userList: any[];
  zoneList: any[];
  wardList: any[];
  selectedOption: any;
  currentMonthName: any;
  currentYear: any;
  imageNoFoundURL = "../../../assets/img/img-not-available-01.jpg";
  userType: any;
  progressData: progressDetail = {
    category: "---",
    time: "00.00",
    panalty: 0,
    totalPenalty: 0,
    totalCount: 0,
    count: 0,
    address: "---",
    latLng: "---",
    zone: "---",
    ward: "---"
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.optionList = [];
    this.userList = [];
    this.wardList = [];
    this.zoneList = [];
    this.selectedOption = "0";
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $('#txtDate').val(this.selectedDate);
    this.getFilterData();
    this.getImageOptionTypes();
    this.resetData();
    this.setMonthYear();
    this.userType = localStorage.getItem("userType");
    if (this.userType == "External User") {
      $('#topPenality').hide();
      $('#leftPenality').hide();
      $('#divAnalysis').hide();
      $('#tblPenalty').hide();
    }
    this.getTotals();
  }

  getWard() {
    let zone = $('#ddlZone').val();
    if (zone == "0") {
      this.wardList = [];
    }
    else {
      let zoneDetail = this.zoneList.find(item => item.zoneName == zone);
      if (zoneDetail != undefined) {
        let wardList = zoneDetail.wardList;
        for (let i = 1; i < wardList.length; i++) {
          this.wardList.push({ wardNo: wardList[i], wardName: "Ward " + wardList[i] });
        }
      }
    }

    this.filterData();
  }

  getFilterData() {
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
    let dbPath = "WastebinMonitor/Users";
    let userInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        userInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let userId = keyArray[i];
              let name = data[userId]["name"];
              this.userList.push({ userId: userId, name: name });
            }
          }
          this.userList = this.commonService.transformNumeric(this.userList, "name");
        }
      }
    );
  }


  filterData() {
    this.resetDetail();
    let userId = $('#ddlUser').val();
    let category = $('#ddlCategory').val();
    let zone = $('#ddlZone').val();
    let ward = $('#ddlWard').val();
    let time1 = $('#txtTime1').val();
    let time2 = $('#txtTime2').val();

    let dat1 = new Date();
    let dat2 = new Date();
    if (time1 != "") {
      dat1 = new Date(this.selectedDate + " " + time1);
    }
    if (time2 != "") {
      dat2 = new Date(this.selectedDate + " " + time2);
    }
    let filterList = this.allProgressList;
    if (userId != "0") {
      filterList = filterList.filter((item) => item.userId == userId);
    }
    if (category != "0") {
      if (category == "1") {
        category = "कचरा नहीं उठाया";
      }
      else {
        category = "कचरा उठा लिया है";
      }
      filterList = filterList.filter((item) => item.isClean == category);
    }
    if (zone != "0") {
      filterList = filterList.filter((item) => item.zone == zone);
    }
    if (ward != "0") {
      filterList = filterList.filter((item) => item.ward == ward);
    }
    if (time1 != "") {
      filterList = filterList.filter((item) => new Date(this.selectedDate + " " + item.time) >= dat1);
    }
    if (time2 != "") {
      filterList = filterList.filter((item) => new Date(this.selectedDate + " " + item.time) <= dat2);
    }
    this.progressList = filterList;
    this.progressData.count = this.progressList.length;
    let sum = 0;
    for (let i = 0; i < this.progressList.length; i++) {
      sum = sum + Number(this.progressList[i]["penalty"]);
    }
    this.progressData.panalty = sum;
  }

  getImageOptionTypes() {
    this.commonService.getCategory().then((category: any) => {
      if (category != null) {
        this.optionList = JSON.parse(category);
      }
    });
  }

  setMonthYear() {
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
  }

  resetData() {
    this.progressList = [];
    this.progressData.category = "---";
    this.progressData.time = "00:00";
    this.progressData.panalty = 0;
    this.progressData.totalCount = 0;
    this.progressData.totalPenalty = 0;
    this.progressData.address = "---";
    this.progressData.latLng = "---";
    this.progressData.zone = "---";
    this.progressData.ward = "---";
    let element = <HTMLImageElement>document.getElementById("mainImage");
    element.src = this.imageNoFoundURL;
    $('#txtPanalty').val("0");
    $('#ddlUser').val("0");
    $('#ddlCategory').val("0");
    $('#ddlZone').val("0");
    $('#ddlWard').val("0");
    $('#txtTime1').val("");
    $('#txtTime2').val("");
  }

  changeOptionSelection(option: any) {
    if (option == "0") {
      this.commonService.setAlertMessage("error", "Please select option !!!");
      this.selectedOption = "0";
      return;
    }
    this.selectedOption = option;
    this.resetData();
    this.getCapturedImages();
  }

  startLoader() {
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 2000);
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate($("#txtDate").val(), 1);
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.toDayDate)) {
      this.selectedDate = this.toDayDate;
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    this.resetData();
    this.setMonthYear();
    this.getCapturedImages();
  }

  getTotals() {
    let dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/totalCount";
    let totalCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        totalCountInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalCount = Number(data);
        }
      }
    );
    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/totalPenalty";
    let penaltyInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        penaltyInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalPenalty = Number(data);
        }
      }
    );
  }

  getCapturedImages() {
    this.startLoader();
    this.getTotals();
    this.progressList = [];
    this.allProgressList = [];

    let categoryDetail = this.optionList.find(item => item.id == this.selectedOption);
    if (categoryDetail != undefined) {
      this.progressData.category = categoryDetail.optionType;
    }

    let dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption + "/totalPenalty";
    let totalPenaltyInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        totalPenaltyInstance.unsubscribe();
        if (data != null) {
          this.progressData.panalty = Number(data);
        }
        else {
          this.progressData.panalty = 0;
        }
      }
    );

    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption + "/totalCount";
    let totalCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        totalCountInstance.unsubscribe();
        if (data != null) {
          this.progressData.count = Number(data);
        }
        else {
          this.progressData.count = 0;
        }
      }
    );

    dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption;
    let imageInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        imageInstance.unsubscribe();
        if (data != null) {
          $('#divMessage').hide();
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length - 1; i++) {
              let imageId = keyArray[i];
              dbPath = "WastebinMonitor/Users/" + data[imageId]["user"] + "/name";
              let userInstance = this.db.object(dbPath).valueChanges().subscribe(
                userData => {
                  userInstance.unsubscribe();
                  let user = "";
                  let status = "कचरा उठा लिया है";
                  let penalty = 0;
                  let latLng = "";
                  let zone = "---";
                  let ward = "---";
                  let isAnalysis = false;
                  let userId = data[imageId]["user"];
                  if (userData != null) {
                    user = userData;
                  }
                  if (data[imageId]["isClean"] == true) {
                    status = "कचरा नहीं उठाया";
                  }
                  if (data[imageId]["isAnalysis"] != null) {
                    isAnalysis = true;
                  }
                  if (data[imageId]["penalty"] != null) {
                    penalty = data[imageId]["penalty"];
                  }
                  if (data[imageId]["latLng"] != null) {
                    latLng = data[imageId]["latLng"];
                  }
                  if (data[imageId]["zone"] != null) {
                    zone = data[imageId]["zone"];
                  }
                  if (data[imageId]["ward"] != null) {
                    ward = data[imageId]["ward"];
                  }
                  this.progressList.push({ userId: userId, imageId: i, address: data[imageId]["address"], isClean: status, time: data[imageId]["time"], penalty: penalty, user: user, imageUrl: data[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward });
                  this.allProgressList.push({ userId: userId, imageId: i, address: data[imageId]["address"], isClean: status, time: data[imageId]["time"], penalty: penalty, user: user, imageUrl: data[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward });
                });
            }
          }
        }
        else {
          $('#divMessage').show();
        }
      }
    );

  }

  resetDetail() {
    this.progressData.time = "00:00";
    this.progressData.latLng = "---";
    this.progressData.address = "---";
    this.progressData.zone = "---";
    this.progressData.ward = "---";
    $('#txtPanalty').val(0);
    $('#dataId').val(0);
    let city = this.commonService.getFireStoreCity();
    let element = <HTMLImageElement>document.getElementById("mainImage");
    element.src = this.imageNoFoundURL;
  }

  getCaptureData(index) {
    this.startLoader();
    this.setActiveClass(index);
    if (this.progressList.length > 0) {
      this.progressData.time = this.progressList[index]["time"];
      this.progressData.latLng = this.progressList[index]["latLng"];
      this.progressData.address = this.progressList[index]["address"];
      this.progressData.zone = this.progressList[index]["zone"];
      this.progressData.ward = this.progressList[index]["ward"];
      $('#txtPanalty').val(this.progressList[index]["penalty"]);
      $('#dataId').val(index);
      let city = this.commonService.getFireStoreCity();
      let imageName = this.progressList[index]["imageUrl"];
      let imageURL = this.imageNoFoundURL;
      if (imageName.split('~')[0] != "2021") {
        imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FWastebinMonitorImages%2F" + imageName + "?alt=media";
      }
      else {
        imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FWastebinMonitorImages%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
      }
      let element = <HTMLImageElement>document.getElementById("mainImage");
      element.src = imageURL;
    }
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.progressList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        $("#tr" + i).removeClass(className);
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }

  analysis() {
    let index = $('#dataId').val();
    let imageId = this.progressList[Number(index)]["imageId"];
    let prePenalty = this.progressList[Number(index)]["penalty"];
    let penalty = $('#txtPanalty').val();
    if (penalty == "") {
      penalty = 0;
    }
    if (imageId != "0") {
      let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId;
      this.db.object(dbPath).update({ isAnalysis: 'yes', penalty: penalty });
      this.setPenaltyCounts(prePenalty, penalty);
      this.progressList[Number(index)]["isAnalysis"] = true;
      this.progressList[Number(index)]["penalty"] = penalty;
    }
  }

  setPenaltyCounts(prePenalty, penalty: any) {
    let dbPath = "WastebinMonitor/Summary/CategoryWise/totalPenalty";
    let totalInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        totalInstance.unsubscribe();
        let total = penalty;
        if (count != null) {
          total = Number(count) - Number(prePenalty) + Number(penalty);
        }
        dbPath = "WastebinMonitor/Summary/CategoryWise";
        this.db.object(dbPath).update({ totalPenalty: total });
      }
    );

    dbPath = "WastebinMonitor/Summary/CategoryWise/" + this.selectedOption + "/totalPenalty";
    let categoryInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        categoryInstance.unsubscribe();
        let total = penalty;
        if (count != null) {
          total = Number(count) - Number(prePenalty) + Number(penalty);
        }
        dbPath = "WastebinMonitor/Summary/CategoryWise/" + this.selectedOption;
        this.db.object(dbPath).update({ totalPenalty: total });

      }
    );

    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption + "/totalPenalty";
    let dateInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        dateInstance.unsubscribe();
        let total = penalty;
        if (count != null) {
          total = Number(count) - Number(prePenalty) + Number(penalty);
        }
        dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption;
        this.db.object(dbPath).update({ totalPenalty: total });
        this.progressData.panalty = total;
      }
    );

    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/totalPenalty";
    let dateWiseInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        dateWiseInstance.unsubscribe();
        let total = penalty;
        if (count != null) {
          total = Number(count) - Number(prePenalty) + Number(penalty);
        }
        dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate;
        this.db.object(dbPath).update({ totalPenalty: total });
        this.progressData.totalPenalty = total;
      }
    );
  }
}

export class progressDetail {
  category: string;
  time: string;
  panalty: number;
  totalPenalty: number;
  totalCount: number;
  count: number;
  address: string;
  latLng: string;
  zone: string;
  ward: string;
}
