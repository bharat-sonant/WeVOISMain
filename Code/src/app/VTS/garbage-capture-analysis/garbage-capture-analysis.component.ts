import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-garbage-capture-analysis',
  templateUrl: './garbage-capture-analysis.component.html',
  styleUrls: ['./garbage-capture-analysis.component.scss']
})
export class GarbageCaptureAnalysisComponent implements OnInit {

  constructor(public fs: FirebaseService, private actRoute: ActivatedRoute, private commonService: CommonService, public httpService: HttpClient) { }
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
    ward: "---",
    timeResolved: "---",
    latLngResolved: "---",
    distance: "---",
    resolvedBy: "---",
    totalResolved: 0,
    resolved: 0
  };

  // html id's
  topPenality = "#topPenality";
  topPenalityNav = "#topPenalityNav";
  leftPenality = "#leftPenality";
  divAnalysis = "#divAnalysis";
  tblPenalty = "#tblPenalty";
  txtDate = "#txtDate";
  txtDateNav = "#txtDateNav";
  ddlZone = "#ddlZone";
  ddlUser = "#ddlUser";
  ddlCategory = "#ddlCategory";
  ddlWard = "#ddlWard";
  txtTime1 = "#txtTime1";
  txtTime2 = "#txtTime2";
  txtPanalty = "#txtPanalty";
  ddlOptionNav = "#ddlOptionNav";
  ddlOption = "#ddlOption";
  divLoader = "#divLoader";
  divMessage = "#divMessage";
  dataId = "#dataId";
  collapsethree = "#collapsethree";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setUsersPermission();
    this.setDefaultArray();
    this.selectedOption = "0";
    this.setDefaultDate();
    this.getZoneList();
    this.getImageOptionTypes();
    this.resetData();
    this.setMonthYear();
    this.getTotals();
    let element = <HTMLButtonElement>document.getElementById("btnAnalysis");
    element.disabled = true;
  }

  setDefaultArray() {
    this.optionList = [];
    this.userList = [];
    this.wardList = [];
    this.zoneList = [];
  }

  setUsersPermission() {
    this.userType = localStorage.getItem("userType");
    if (this.userType == "External User") {
      $(this.divAnalysis).hide();
    }
  }

  getZoneList() {
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
  }

  setDefaultDate() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
  }

  getWard() {
    let zone = $(this.ddlZone).val();
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

  filterData() {
    this.resetDetail();
    let userId = $(this.ddlUser).val();
    let category = $(this.ddlCategory).val();
    let zone = $(this.ddlZone).val();
    let ward = $(this.ddlWard).val();
    let time1 = $(this.txtTime1).val();
    let time2 = $(this.txtTime2).val();

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

  getOrderBy(orderBy: any) {
    if (orderBy == "resolved") {
      this.progressList = this.progressList.sort((a, b) =>
        b.isResolved > a.isResolved ? 1 : -1
      );

      this.allProgressList = this.commonService.transformNumeric(this.allProgressList, "-isResolved");
    }
    else {
      this.progressList = this.commonService.transformNumeric(this.progressList, orderBy);
      this.allProgressList = this.commonService.transformNumeric(this.allProgressList, orderBy);
    }
    this.hideOrdeBy();
  }

  hideOrdeBy() {
    let element = <HTMLElement>document.getElementById("collapsethree");
    let className = element.className;
    $("#collapsethree").removeClass(className);
    $("#collapsethree").addClass("panel-collapse collapse in");
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
    this.userList = [];
    this.resetDetail();
    this.resetDefaultValues();
    this.hideOrdeBy();
    $(this.ddlCategory).val("1");
  }

  resetProgressData() {
    this.progressData.category = "---";
    this.progressData.panalty = 0;
    this.progressData.totalCount = 0;
    this.progressData.totalPenalty = 0;
    this.progressData.totalResolved = 0;
    $(this.ddlCategory).val("1");
    this.resetDetail();
  }

  resetDefaultValues() {
    $(this.txtPanalty).val("0");
    $(this.ddlUser).val("0");
    $(this.ddlCategory).val("0");
    $(this.ddlZone).val("0");
    $(this.ddlWard).val("0");
    $(this.txtTime1).val("");
    $(this.txtTime2).val("");
  }

  changeOptionSelection(option: any) {
    if (option == "0") {
      this.commonService.setAlertMessage("error", "Please select option !!!");
      this.selectedOption = "0";
      return;
    }
    $(this.ddlOptionNav).val(option);
    $(this.ddlOption).val(option);
    this.selectedOption = option;
    this.resetData();
    this.getCapturedImages();
  }

  startLoader() {
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 1000);
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
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
    this.resetProgressData();
    this.setMonthYear();
    this.getCapturedImages();
    this.getTotals();
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
    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/totalResolved";
    let resolvedInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        resolvedInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalResolved = Number(data);
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
    this.progressList = [];
    this.allProgressList = [];
    this.getCategorySummary();
    this.httpService.get("../../assets/jsons/WastebinMonitor/" + this.commonService.getFireStoreCity() + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + ".json").subscribe(data => {
      if (data != null) {
        if (data[this.selectedOption] != null) {
          $(this.divLoader).show();
          $(this.divMessage).hide();
          let objData = data[this.selectedOption];
          let keyArray = Object.keys(objData);
          if (keyArray.length > 0) {
            for (let i = 1; i < keyArray.length - 1; i++) {
              let imageId = keyArray[i];
              if (imageId != null) {
                if (data[imageId]["user"] != null) {
                  let resolved = 0;
                  let user = "";
                  let isClean = "कचरा उठा लिया है";
                  let penalty = 0;
                  let latLng = "";
                  let zone = "---";
                  let ward = "---";
                  let isAnalysis = false;
                  let isResolved = 0;
                  let BvgAction = null;
                  let status = "";
                  let userId = objData[imageId]["user"];
                  if (objData[imageId]["isClean"] == true) {
                    isClean = "कचरा नहीं उठाया";
                  }
                  if (objData[imageId]["isAnalysis"] != null) {
                    isAnalysis = true;
                  }
                  if (objData[imageId]["penalty"] != null) {
                    penalty = objData[imageId]["penalty"];
                  }
                  if (objData[imageId]["latLng"] != null) {
                    latLng = objData[imageId]["latLng"];
                  }
                  if (objData[imageId]["zone"] != null) {
                    zone = objData[imageId]["zone"];
                  }
                  if (objData[imageId]["ward"] != null) {
                    ward = objData[imageId]["ward"];
                  }
                  if (objData[imageId]["status"] != null) {
                    status = objData[imageId]["status"];
                  }
                  if (objData[imageId]["BvgAction"] != null) {
                    isResolved = 1;
                    resolved = resolved + 1;
                    const bvgData = {
                      user: objData[imageId]["BvgAction"]["user"],
                      imageRef: objData[imageId]["BvgAction"]["imageRef"],
                      time: objData[imageId]["BvgAction"]["time"],
                      date: objData[imageId]["BvgAction"]["date"],
                      latlng: objData[imageId]["BvgAction"]["latlng"]
                    }
                    BvgAction = bvgData;
                  }
                  let timeStemp = new Date(this.commonService.setTodayDate() + " " + data[imageId]["time"]).getTime();
                  if (isClean == "कचरा नहीं उठाया") {
                    this.progressList.push({ userId: userId, imageId: imageId, address: objData[imageId]["address"], isClean: isClean, time: objData[imageId]["time"], penalty: penalty, user: user, imageUrl: objData[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward, timeStemp: timeStemp, isResolved: isResolved, BvgAction: BvgAction, status: status });
                  }
                  this.allProgressList.push({ userId: userId, imageId: imageId, address: objData[imageId]["address"], isClean: isClean, time: objData[imageId]["time"], penalty: penalty, user: user, imageUrl: objData[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward, timeStemp: timeStemp, isResolved: isResolved, BvgAction: BvgAction, status: status });
                  let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId + "/penalty";
                  this.getPenalty(imageId, dbPath);
                  this.getUserName(imageId, userId);
                  if (i == keyArray.length - 2) {
                    $(this.divLoader).hide();
                  }
                  this.progressData.resolved = resolved;
                }
              }
            }
          }
        }
      }
    }, error => {
      let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption;
      let imageInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          imageInstance.unsubscribe();
          if (data != null) {
            $(this.divLoader).show();
            $(this.divMessage).hide();
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              let resolved = 0;
              for (let i = 0; i < keyArray.length - 1; i++) {
                let imageId = keyArray[i];
                if (data[imageId]["user"] != null) {

                  let user = "";
                  let isClean = "कचरा उठा लिया है";
                  let penalty = 0;
                  let latLng = "";
                  let zone = "---";
                  let ward = "---";
                  let isAnalysis = false;
                  let isResolved = 0;
                  let BvgAction = null;
                  let status = "";
                  let userId = data[imageId]["user"];
                  if (data[imageId]["isClean"] == true) {
                    isClean = "कचरा नहीं उठाया";
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
                  if (data[imageId]["BvgAction"] != null) {
                    isResolved = 1;
                  }
                  if (data[imageId]["status"] != null) {
                    status = data[imageId]["status"];
                  }
                  if (data[imageId]["BvgAction"] != null) {
                    isResolved = 1;
                    resolved = resolved + 1;
                    const bvgData = {
                      user: data[imageId]["BvgAction"]["user"],
                      imageRef: data[imageId]["BvgAction"]["imageRef"],
                      time: data[imageId]["BvgAction"]["time"],
                      date: data[imageId]["BvgAction"]["date"],
                      latlng: data[imageId]["BvgAction"]["latlng"]
                    }
                    BvgAction = bvgData;
                  }
                  let timeStemp = new Date(this.commonService.setTodayDate() + " " + data[imageId]["time"]).getTime();
                  if (isClean == "कचरा नहीं उठाया") {
                    this.progressList.push({ userId: userId, imageId: imageId, address: data[imageId]["address"], isClean: isClean, time: data[imageId]["time"], penalty: penalty, user: user, imageUrl: data[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward, timeStemp: timeStemp, isResolved: isResolved, BvgAction: BvgAction, status: status });
                  } this.allProgressList.push({ userId: userId, imageId: imageId, address: data[imageId]["address"], isClean: isClean, time: data[imageId]["time"], penalty: penalty, user: user, imageUrl: data[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward, timeStemp: timeStemp, isResolved: isResolved, BvgAction: BvgAction, status: status });
                  let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId + "/penalty";
                  this.getPenalty(imageId, dbPath);
                  this.getUserName(imageId, userId);
                  if (i == keyArray.length - 2) {
                    $(this.divLoader).hide();
                  }

                }
              }
              this.progressData.resolved = resolved;
            }
          }
          else {
            $(this.divMessage).show();
            $(this.divLoader).hide();
          }
        }
      );
    });
  }

  getUserName(imageId: any, userId: any) {
    this.commonService.getVTSUserDetailByUserId(userId).then((users) => {
      let user = users["name"].toString().charAt(0).toUpperCase() + users["name"].toString().slice(1);
      let userDetails = this.progressList.find((item) => item.imageId == imageId);
      if (userDetails != undefined) {
        userDetails.user = user;
      }

      if (this.progressList.length > 0) {
        let detail = this.progressList.find(item => item.imageId == imageId);
        if (detail != undefined) {
          detail.user = user;
        }
      }
      if (this.allProgressList.length > 0) {
        let detail = this.allProgressList.find(item => item.imageId == imageId);
        if (detail != undefined) {
          detail.user = user;
        }
      }
      let userDetail = this.userList.find(item => item.userId == userId);
      if (userDetail == undefined) {
        this.userList.push({ userId: userId, name: user });
        this.userList = this.commonService.transformNumeric(this.userList, "name");
      }

    });
  }

  getPenalty(imageId: any, dbPath: any) {
    let penaltyInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        penaltyInstance.unsubscribe();
        if (data != null) {

          if (this.progressList.length > 0) {
            let detail = this.progressList.find(item => item.imageId == imageId);
            if (detail != undefined) {
              detail.penalty = Number(data);
            }
          }
          if (this.allProgressList.length > 0) {
            let detail = this.allProgressList.find(item => item.imageId == imageId);
            if (detail != undefined) {
              detail.penalty = Number(data);
            }
          }
        }
      }
    );
  }

  getCategorySummary() {
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

    this.progressData.resolved = 0;
  }

  resetDetail() {
    this.progressData.time = "00:00";
    this.progressData.latLng = "---";
    this.progressData.timeResolved = "---";
    this.progressData.latLngResolved = "---";
    this.progressData.address = "---";
    this.progressData.zone = "---";
    this.progressData.ward = "---";
    this.progressData.distance = "---";
    this.progressData.resolvedBy = "---";
    $(this.txtPanalty).val(0);
    $(this.dataId).val("-1");
    let element = <HTMLImageElement>document.getElementById("mainImage");
    element.src = this.imageNoFoundURL;
    element = <HTMLImageElement>document.getElementById("mainImageResolved");
    element.src = this.imageNoFoundURL;
    let elementInput = <HTMLInputElement>document.getElementById("rdoReject");
    elementInput.checked = false;
    elementInput = <HTMLInputElement>document.getElementById("rdoAccept");
    elementInput.checked = false;
    let elementButton = <HTMLButtonElement>document.getElementById("btnAnalysis");
    elementButton.disabled = true;
  }

  getCaptureData(index: any) {
    this.startLoader();
    this.resetDetail();
    this.setActiveClass(index);
    if (this.progressList.length > 0) {
      this.progressData.time = this.progressList[index]["time"];
      this.progressData.latLng = this.progressList[index]["latLng"];
      this.progressData.address = this.progressList[index]["address"];
      this.progressData.zone = this.progressList[index]["zone"];
      this.progressData.ward = this.progressList[index]["ward"];
      $(this.txtPanalty).val(this.progressList[index]["penalty"]);
      $(this.dataId).val(index);
      let city = this.commonService.getFireStoreCity();
      let imageName = this.progressList[index]["imageUrl"];
      let imageURL = this.imageNoFoundURL; let elementButton = <HTMLButtonElement>document.getElementById("btnAnalysis");
      if (this.progressList[index]["status"] == "Reject") {
        let element = <HTMLInputElement>document.getElementById("rdoReject");
        element.checked = true;
        elementButton.disabled = false;
      }
      else if (this.progressList[index]["status"] == "Accept") {
        let element = <HTMLInputElement>document.getElementById("rdoAccept");
        element.checked = true;
        elementButton.disabled = false;
      }
      if (imageName.split('~')[0] != "2021") {
        imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FWastebinMonitorImages%2F" + imageName + "?alt=media";
      }
      else {
        imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FWastebinMonitorImages%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
      }
      let element = <HTMLImageElement>document.getElementById("mainImage");
      element.src = imageURL;
      let imageId = this.progressList[index]["imageId"];
      let dataDetail = this.progressList.find(item => item.imageId == imageId);
      if (dataDetail != undefined) {
        if (dataDetail.BvgAction != null) {
          this.getResolvedData(imageId, this.progressData.latLng);
        }
        else {
          let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId + "/BvgAction";
          let resolvedInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              resolvedInstance.unsubscribe();
              if (data != null) {
                const bvgData = {
                  user: data["user"],
                  imageRef: data["imageRef"],
                  time: data["time"],
                  date: data["date"],
                  latlng: data["latlng"]
                }
                dataDetail.BvgAction = bvgData;
                dataDetail.isResolved = 1;
                let allDetail = this.allProgressList.find(item => item.imageId == imageId);
                if (allDetail != undefined) {
                  allDetail.BvgAction = bvgData;
                  allDetail.isResolved = 1;
                }
                this.getResolvedData(imageId, this.progressData.latLng);
              }
            });
        }
      }
    }
  }

  getResolvedData(imageId: any, latLng: any) {
    let dataDetail = this.progressList.find(item => item.imageId == imageId);
    if (dataDetail != undefined) {
      let BvgAction = dataDetail.BvgAction;
      if (BvgAction != null) {
        let imageName = BvgAction["imageRef"];
        let userId = BvgAction["user"];
        this.progressData.timeResolved = BvgAction["date"] + " " + BvgAction["time"];
        this.progressData.latLngResolved = BvgAction["latlng"];
        let imageURL = this.imageNoFoundURL;
        if (imageName.split('~')[0] != "2021") {
          imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FWastebinMonitorImages%2F" + imageName + "?alt=media";
        }
        else {
          imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FWastebinMonitorImages%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
        }
        let element = <HTMLImageElement>document.getElementById("mainImageResolved");
        element.src = imageURL;
        let lat1 = Number(latLng.split(',')[0]);
        let lng1 = Number(latLng.split(',')[1]);
        let lat2 = Number(BvgAction["latlng"].split(',')[0]);
        let lng2 = Number(BvgAction["latlng"].split(',')[1]);
        let distance = this.commonService.getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2);
        if (distance > 1000) {
          this.progressData.distance = (distance / 1000).toFixed(3) + " KM";
        }
        else {
          this.progressData.distance = (distance).toFixed(3) + " M";
        }

        this.commonService.getBVGUserById(userId).then((user) => {
          this.progressData.resolvedBy = user["name"] != null ? user["name"] : "---";
        });
      }
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
    let index = $(this.dataId).val();
    let imageId = this.progressList[Number(index)]["imageId"];
    let prePenalty = this.progressList[Number(index)]["penalty"];
    let penalty = $(this.txtPanalty).val();
    let status = null;
    let element = <HTMLInputElement>document.getElementById("rdoReject");
    if (element.checked == true) {
      status = "Reject";
    }
    element = <HTMLInputElement>document.getElementById("rdoAccept");
    if (element.checked == true) {
      status = "Accept";
    }

    if (penalty == "") {
      penalty = 0;
    }
    if (imageId != "0") {
      let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId;
      this.db.object(dbPath).update({ isAnalysis: 'yes', penalty: penalty, status: status });
      this.setPenaltyCounts(prePenalty, penalty);
      this.progressList[Number(index)]["isAnalysis"] = true;
      this.progressList[Number(index)]["penalty"] = penalty;
      this.progressList[Number(index)]["status"] = status;
      let dataDetail = this.allProgressList.find(item => item.imageId == imageId);
      if (dataDetail != undefined) {
        dataDetail.isAnalysis = true;
        dataDetail.penalty = penalty;
        dataDetail.status = status;
      }
      this.commonService.setAlertMessage("success", "Analysis done successfully !!!");
    }
  }

  enableSaveData(rdo: any) {
    if (this.progressList.length > 0) {
      let elementButton = <HTMLButtonElement>document.getElementById("btnAnalysis");
      elementButton.disabled = false;
    }
    else {
      let element = <HTMLInputElement>document.getElementById(rdo);
      element.checked = false;
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
  timeResolved: string;
  latLngResolved: string;
  distance: string;
  resolvedBy: string;
  totalResolved: number;
  resolved: number;
}
