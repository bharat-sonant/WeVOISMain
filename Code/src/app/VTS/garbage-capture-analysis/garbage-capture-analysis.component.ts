import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-garbage-capture-analysis',
  templateUrl: './garbage-capture-analysis.component.html',
  styleUrls: ['./garbage-capture-analysis.component.scss']
})
export class GarbageCaptureAnalysisComponent implements OnInit {

  constructor(public fs: FirebaseService, private modalService: NgbModal, private actRoute: ActivatedRoute, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  progressList: any[];
  allProgressList: any[];
  toDayDate: any;
  selectedDate: any;
  optionList: any[];
  userList: any[] = [];
  zoneList: any[];
  wardList: any[];
  selectedOption: any;
  currentMonthName: any;
  currentYear: any;
  imageNoFoundURL = "../../../assets/img/img-not-available-01.jpg";
  userType: any;
  filterList: any[];
  rowsProgressList: any;
  orderBy: any;
  storageCityName: any;
  garbageUserList: any[] = [];
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

  onContainerScroll() {
    let element = <HTMLElement>document.getElementById("divList");
    if ((element.offsetHeight + element.scrollTop + 10) >= element.scrollHeight) {
      this.rowsProgressList = this.rowsProgressList + 15;
      this.progressList = this.filterList.slice(0, this.rowsProgressList);
    }
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.storageCityName = this.commonService.getFireStoreCity();
    this.getUsers();
    this.setUsersPermission();
    this.setDefaultArray();
    this.selectedOption = "0";
    this.setDefaultDate();
    this.getZoneList();
    this.getImageOptionTypes();
    this.resetData();
    this.setMonthYear();
    this.getTotals();
    this.orderBy = "timeStemp";
    let element = <HTMLButtonElement>document.getElementById("btnAnalysis");
    element.disabled = true;
  }

  getUsers() {
    let dbPath = "WastebinMonitor/Users";
    let userInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      userInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let userId = keyArray[i];
          if (data[userId]["name"] != null) {
            this.userList.push({ userId: userId, name: data[userId]["name"] });
          }
        }
        this.userList.sort((a, b) => b.name > a.name ? -1 : 1);
      }
    })

  }

  setDefaultArray() {
    this.optionList = [];
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
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    for (let i = 1; i < this.zoneList.length; i++) {
      this.wardList.push({ zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"] });
    }
  }

  setDefaultDate() {
    this.toDayDate = this.commonService.setTodayDate();
    //this.toDayDate = "2022-01-01"
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateNav).val(this.selectedDate);
  }

  getWard() {
    $(this.ddlWard).val("0");
    this.wardList = [];
    let zone = $(this.ddlZone).val();
    if (zone != "0") {
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
    let element = <HTMLElement>document.getElementById("divList");
    element.scrollTop = 0;
    this.rowsProgressList = 15;
    this.filterList = [];
    if (this.allProgressList.length > 0) {
      if (this.orderBy == "resolved") {
        this.allProgressList = this.allProgressList.sort((a, b) =>
          b.isResolved > a.isResolved ? 1 : -1
        );
      }
      else {
        this.allProgressList = this.commonService.transformNumeric(this.allProgressList, this.orderBy);
      }
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
      this.filterList = this.allProgressList;
      if (userId != "0") {
        this.filterList = this.filterList.filter((item) => item.userId == userId);
      }
      if (category != "0") {
        if (category == "1") {
          category = "कचरा नहीं उठाया";
        }
        else {
          category = "कचरा उठा लिया है";
        }
        this.filterList = this.filterList.filter((item) => item.isClean == category);
      }
      if (zone != "0") {
        this.filterList = this.filterList.filter((item) => item.zone == zone);
      }
      if (ward != "0") {
        this.filterList = this.filterList.filter((item) => item.ward == ward);
      }
      if (time1 != "") {
        this.filterList = this.filterList.filter((item) => new Date(this.selectedDate + " " + item.time) >= dat1);
      }
      if (time2 != "") {
        this.filterList = this.filterList.filter((item) => new Date(this.selectedDate + " " + item.time) <= dat2);
      }
      this.progressList = this.filterList.slice(0, this.rowsProgressList);
      this.progressData.count = this.filterList.length;
      let sum = 0;
      let resolved = 0;
      for (let i = 0; i < this.filterList.length; i++) {
        sum = sum + Number(this.filterList[i]["penalty"]);
        if (this.filterList[i]["isResolved"] == 1) {
          resolved = resolved + 1;
        }
      }
      this.progressData.panalty = sum;
      this.progressData.resolved = resolved;
      $(this.divLoader).hide();
    }
  }

  getOrderBy(orderBy: any) {
    this.orderBy = orderBy;
    this.filterData();
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
    /*
    this.optionList.push({ id: 1, optionType: "Open Depo" });
    this.optionList.push({ id: 2, optionType: "litter Dustbin" });
    */
  }

  setMonthYear() {
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
  }

  resetData() {
    this.progressList = [];
    this.resetDetail();
    this.resetDefaultValues();
    this.hideOrdeBy();
    $(this.ddlCategory).val("0");
  }

  resetProgressData() {
    this.progressData.category = "---";
    this.progressData.panalty = 0;
    this.progressData.totalCount = 0;
    this.progressData.totalPenalty = 0;
    this.progressData.totalResolved = 0;
    $(this.ddlCategory).val("0");
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
    this.garbageUserList=[];
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
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      $(this.txtDateNav).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.garbageUserList=[];
        this.resetProgressData();
        this.setMonthYear();
        this.getCapturedImages();
        this.getTotals();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
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
    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/totalResolvedCount";
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
    $(this.divLoader).show();
    let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption;
    console.log(dbPath);
    let imageInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        imageInstance.unsubscribe();
        console.log(data);
        if (data != null) {
          $(this.divMessage).hide();
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let resolved = 0;
            for (let i = 0; i < keyArray.length; i++) {
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
                let userDetail = this.userList.find(item => item.userId == userId);
                if (userDetail != undefined) {
                  user = userDetail.name;
                  let detail = this.garbageUserList.find(item => item.userId == userId);
                  if (detail == undefined) {
                    this.garbageUserList.push({ userId: userId, name: user });
                  }
                }
                if (data[imageId]["isClean"] == true) {
                  isClean = "कचरा नहीं उठाया";
                }
                //if (data[imageId]["name"] != null) {
                //   user = data[imageId]["name"];
                // }
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
                let timeStemp = new Date(this.selectedDate + " " + data[imageId]["time"]).getTime();
                this.allProgressList.push({ userId: userId, imageId: imageId, address: data[imageId]["address"], isClean: isClean, time: data[imageId]["time"], penalty: penalty, user: user, imageUrl: data[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward, timeStemp: timeStemp, isResolved: isResolved, BvgAction: BvgAction, status: status });
              }

              if (i == keyArray.length - 1) {
                this.filterData();
              }
            }
            this.garbageUserList.sort((a, b) => b.name > a.name ? -1 : 1);
          }
        }
        else {
          $(this.divMessage).show();
          $(this.divLoader).hide();
        }
      }
    );
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
    let elementDistance = <HTMLElement>document.getElementById("resolvedDistance");
    let className = elementDistance.className;
    $('#resolvedDistance').removeClass(className);
    $('#resolvedDistance').addClass("");
  }

  getCaptureData(index: any) {

    this.startLoader();
    this.resetDetail();
    this.setActiveClass(index);
    if (this.progressList.length > 0) {
      this.progressData.time = this.progressList[index]["time"];
      this.progressData.latLng = this.progressList[index]["latLng"];
      this.progressData.address = this.progressList[index]["address"];
      this.progressData.zone = this.commonService.getCityName(this.cityName);
      this.progressData.ward = this.progressList[index]["ward"];
      $(this.txtPanalty).val(this.progressList[index]["penalty"]);
      $(this.dataId).val(index);

      let imageName = this.progressList[index]["imageUrl"];

      let optionType = "";
      if (this.selectedOption == "1") {
        optionType = "OpenDepo";
      }
      else if (this.selectedOption == "2") {
        optionType = "LitterDustbin";
      }

      let imageURL = this.imageNoFoundURL;
      let elementButton = <HTMLButtonElement>document.getElementById("btnAnalysis");
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
      //imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FImagesData%2F" + optionType + "%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + this.selectedOption + "%2F" + imageName + "?alt=media";
      imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWastebinMonitorImages%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
      console.log(imageURL)
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
        let optionType = "";

        if (this.selectedOption == "1") {
          optionType = "OpenDepo";
        }
        else if (this.selectedOption == "2") {
          optionType = "LitterDustbin";
        }
        // imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FImagesData%2F" + optionType + "%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + this.selectedOption + "%2F" + imageName + "?alt=media";
        imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWastebinMonitorImages%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";

        let element = <HTMLImageElement>document.getElementById("mainImageResolved");
        element.src = imageURL;
        let lat1 = Number(latLng.split(',')[0]);
        let lng1 = Number(latLng.split(',')[1]);
        let lat2 = Number(BvgAction["latlng"].split(',')[0]);
        let lng2 = Number(BvgAction["latlng"].split(',')[1]);
        let distance = this.commonService.getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2);
        let cssClass = "";
        if (distance > 50) {
          cssClass = "resolved-distance";
        }
        let elementDistance = <HTMLElement>document.getElementById("resolvedDistance");
        let className = elementDistance.className;
        $('#resolvedDistance').removeClass(className);
        $('#resolvedDistance').addClass(cssClass);
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

  openModel(content: any) {

    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 170;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  deleteData() {
    let index = $(this.dataId).val();
    let imageId = this.progressList[Number(index)]["imageId"];
    let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId;
    let deleteInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        deleteInstance.unsubscribe();
        let dbSavePath = "WastebinMonitor/ImagesData_Deleted/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId;
        this.db.database.ref(dbSavePath).update(data);
        this.db.object(dbSavePath).update({ deletedBy: localStorage.getItem("userID") });
        this.db.database.ref(dbPath).set(null);
        this.setTotalCounts();
        let list = [];
        list = this.progressList.filter(item => item.imageId != imageId);
        if (list.length > 0) {
          this.progressList = list;
        }
        list = this.filterList.filter(item => item.imageId != imageId);
        if (list.length > 0) {
          this.filterList = list;
        }
        list = this.allProgressList.filter(item => item.imageId != imageId);
        if (list.length > 0) {
          this.allProgressList = list;
        }
        this.resetDetail();
        this.commonService.setAlertMessage("success", "Data deleted successfully !!!");
        this.closeModel();
      });
  }

  setTotalCounts() {
    let dbPath = "WastebinMonitor/Summary/CategoryWise/totalCount";
    let totalInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        totalInstance.unsubscribe();
        let total = 0;
        if (count != null) {
          total = Number(count) - 1;
        }
        dbPath = "WastebinMonitor/Summary/CategoryWise";
        this.db.object(dbPath).update({ totalCount: total });
      }
    );

    dbPath = "WastebinMonitor/Summary/CategoryWise/" + this.selectedOption + "/totalCount";
    let categoryInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        categoryInstance.unsubscribe();
        let total = 0;
        if (count != null) {
          total = Number(count) - 1;
        }
        dbPath = "WastebinMonitor/Summary/CategoryWise/" + this.selectedOption;
        this.db.object(dbPath).update({ totalCount: total });
      }
    );

    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption + "/totalCount";
    let dateInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        dateInstance.unsubscribe();
        let total = 0;
        if (count != null) {
          total = Number(count) - 1;
        }
        dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption;
        this.db.object(dbPath).update({ totalCount: total });
        this.progressData.count = total;
      }
    );

    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/totalCount";
    let dateWiseInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        dateWiseInstance.unsubscribe();
        let total = 0;
        if (count != null) {
          total = Number(count) - 1;
        }
        dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate;
        this.db.object(dbPath).update({ totalCount: total });
        this.progressData.totalCount = total;
      }
    );
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
