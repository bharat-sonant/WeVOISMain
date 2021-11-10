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
    ward: "---"
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

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefaultArray();
    this.selectedOption = "0";
    this.setDefaultDate();
    this.getZoneList();
    this.getImageOptionTypes();
    this.resetData();
    this.setMonthYear();
    this.getTotals();
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
      $(this.topPenality).hide();
      $(this.topPenalityNav).hide();
      $(this.leftPenality).hide();
      $(this.divAnalysis).hide();
      $(this.tblPenalty).hide();
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
    this.resetProgressData();
    this.resetDefaultValues();
  }

  resetProgressData() {
    this.progressData.category = "---";
    this.progressData.panalty = 0;
    this.progressData.totalCount = 0;
    this.progressData.totalPenalty = 0;
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
    this.getTotals();
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
            for (let i = 0; i < keyArray.length - 1; i++) {
              let imageId = keyArray[i];
              let user = "";
              let status = "कचरा उठा लिया है";
              let penalty = 0;
              let latLng = "";
              let zone = "---";
              let ward = "---";
              let isAnalysis = false;
              let userId = objData[imageId]["user"];
              if (objData[imageId]["isClean"] == true) {
                status = "कचरा नहीं उठाया";
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
              this.progressList.push({ userId: userId, imageId: i, address: objData[imageId]["address"], isClean: status, time: objData[imageId]["time"], penalty: penalty, user: user, imageUrl: objData[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward });
              this.allProgressList.push({ userId: userId, imageId: i, address: objData[imageId]["address"], isClean: status, time: objData[imageId]["time"], penalty: penalty, user: user, imageUrl: objData[imageId]["imageRef"], isAnalysis: isAnalysis, latLng: latLng, userType: this.userType, zone: zone, ward: ward });
              let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + imageId + "/penalty";
              this.getPenalty(i, dbPath);
              this.getUserName(i, userId);
              if (i == keyArray.length - 2) {
                $(this.divLoader).hide();
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
              for (let i = 0; i < keyArray.length - 1; i++) {
                let imageId = keyArray[i];

                let user = "";
                let status = "कचरा उठा लिया है";
                let penalty = 0;
                let latLng = "";
                let zone = "---";
                let ward = "---";
                let isAnalysis = false;
                let userId = data[imageId]["user"];
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
                this.getUserName(i, userId);
                if (i == keyArray.length - 2) {
                  $(this.divLoader).hide();
                }

              }
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
      let user=users["name"].toString().charAt(0).toUpperCase() + users["name"].toString().slice(1);
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
  }

  resetDetail() {
    this.progressData.time = "00:00";
    this.progressData.latLng = "---";
    this.progressData.address = "---";
    this.progressData.zone = "---";
    this.progressData.ward = "---";
    $(this.txtPanalty).val(0);
    $(this.dataId).val(0);
    let element = <HTMLImageElement>document.getElementById("mainImage");
    element.src = this.imageNoFoundURL;
  }

  getCaptureData(index: any) {
    this.startLoader();
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
    let index = $(this.dataId).val();
    let imageId = this.progressList[Number(index)]["imageId"];
    let prePenalty = this.progressList[Number(index)]["penalty"];
    let penalty = $(this.txtPanalty).val();
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
