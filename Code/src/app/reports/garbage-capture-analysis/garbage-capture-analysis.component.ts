import { ObjectUnsubscribedError } from 'rxjs';

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
  toDayDate: any;
  selectedDate: any;
  optionList: any[];
  selectedOption: any;
  currentMonthName: any;
  currentYear: any;
  startIndex: any;
  endIndex: any;
  imageNoFoundURL = "../../../assets/img/img-not-available-01.jpg";
  userType:any;
  progressData: progressDetail = {
    startFrom: 0,
    endTo: 0,
    category: "",
    time: "00.00",
    panalty: 0,
    totalPenalty: 0,
    totalCount: 0,
    count: 0,
    address:"---",
    latLng:"---"
  };
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    
    this.optionList = [];
    this.selectedOption = "0";
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $('#txtDate').val(this.selectedDate);
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
  }

  getImageOptionTypes() {
    this.commonService.getCategory().then((category:any) => {
      if (category != null) {
        console.log(category);
        this.optionList=JSON.parse(category);
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
    this.startIndex = 1;
    this.endIndex = 20;
    this.progressData.category = "";
    this.progressData.endTo = 20;
    this.progressData.startFrom = 1;
    this.progressData.time = "00:00";
    this.progressData.panalty = 0;
    this.progressData.totalCount = 0;
    this.progressData.totalPenalty = 0;
    this.progressData.address="---";
    this.progressData.latLng="---";
    let element = <HTMLImageElement>document.getElementById("mainImage");
    element.src = this.imageNoFoundURL;
  }

  changeOptionSelection(option: any) {
    if (option == "0") {
      this.commonService.setAlertMessage("error", "Please select option !!!")
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
      let previousDate = this.commonService.getPreviousDate(
        $("#txtDate").val(),
        1
      );
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
    let dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption + "/totalCount";
    let totalCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        totalCountInstance.unsubscribe();
        if (data != null) {
          this.progressData.totalCount = Number(data);
        }
      }
    );
    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption + "/totalPenalty";
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
      }
    );

    dbPath = "WastebinMonitor/Summary/DateWise/" + this.selectedDate + "/" + this.selectedOption + "/totalCount";
    let totalCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        totalCountInstance.unsubscribe();
        if (data != null) {
          this.progressData.count = Number(data);
        }
      }
    );

    for (let i = this.startIndex; i <= this.endIndex; i++) {
      let dbPath = "WastebinMonitor/ImagesData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.selectedOption + "/" + i;
      let imageDataInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          imageDataInstance.unsubscribe();
          if (data != null) {
            dbPath = "WastebinMonitor/Users/" + data["user"] + "/name";
            let userInstance = this.db.object(dbPath).valueChanges().subscribe(
              userData => {
                userInstance.unsubscribe();
                let user = "";
                let status = "कचरा उठा लिया है |";
                let penalty = 0;
                let latLng="";
                let isAnalysis = false;
                if (userData != null) {
                  user = userData;
                }
                if (data["isClean"] == true) {
                  status = "कचरा नहीं उठाया |";
                }
                if (data["isAnalysis"] != null) {
                  isAnalysis = true;
                }
                if (data["penalty"] != null) {
                  penalty = data["penalty"];
                }
                if(data["latLng"]!=null){
                  latLng=data["latLng"];
                }
                this.progressList.push({ imageId: i, address: data["address"], isClean: status, time: data["time"], penalty: penalty, user: user, imageUrl: data["imageRef"], isAnalysis: isAnalysis,latLng:latLng,userType:this.userType });
              }
            );
          }
        }
      );
    }
    setTimeout(() => {
      if (this.progressList.length == 0) {
        $('#divMessage').show();
      }
      else {
        $('#divMessage').hide();
      }

    }, 1000);
  }

  getCaptureData(index) {
    this.startLoader();
    this.setActiveClass(index);
    if (this.progressList.length > 0) {
      this.progressData.time = this.progressList[index]["time"];
      this.progressData.latLng=this.progressList[index]["latLng"];
      this.progressData.address=this.progressList[index]["address"];
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
      //$('#txtPanalty').val("0");
      //$('#dataId').val("0");
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
        this.progressData.totalPenalty = total;
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
        this.progressData.panalty = total;
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
      }
    );
  }

  getRecord(type: any) {
    if (type == "next") {
      this.startIndex = this.startIndex + 20;
      this.endIndex = this.endIndex + 20;
      this.progressData.startFrom = this.startIndex;
      this.progressData.endTo = this.endIndex;
      this.getCapturedImages();
    }
    else {
      if (this.startIndex != 1) {
        this.startIndex = this.startIndex - 20;
        this.endIndex = this.endIndex - 20;
        this.progressData.startFrom = this.startIndex;
        this.progressData.endTo = this.endIndex;
        this.getCapturedImages();
      }
    }
  }
}

export class progressDetail {
  startFrom: number;
  endTo: number;
  category: string;
  time: string;
  panalty: number;
  totalPenalty: number;
  totalCount: number;
  count: number;
  address:string;
  latLng:string;
}
