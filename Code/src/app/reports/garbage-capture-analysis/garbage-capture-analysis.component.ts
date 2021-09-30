
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
  imageNoFoundURL = "../../../assets/img/NotAvailable.jfif";
  progressData: progressDetail = {
    startFrom: 0,
    endTo: 0,
    category: ""
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
    this.optionList = this.commonService.getImageOptionTypes();
    this.resetData();
    this.setMonthYear();
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
    this.endIndex = 10;
    this.progressData.category = "";
    this.progressData.endTo = 10;
    this.progressData.startFrom = 1;
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


  getCapturedImages() {
    this.progressList = [];
    let categoryDetail = this.optionList.find(item => item.id == this.selectedOption);
    if (categoryDetail != undefined) {
      this.progressData.category = categoryDetail.optionType;
    }

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
                let panalty = 0;
                if (userData != null) {
                  user = userData;
                }
                if (data["isClean"] == false) {
                  status = "कचरा नहीं उठाया |";
                  let date1 = new Date(this.toDayDate + " " + data["time"]);
                  let date2 = new Date(this.toDayDate + " 12:00");
                  if (date2 < date1) {
                    panalty = 100;
                  }
                }

                this.progressList.push({ address: data["address"], isClean: status, time: data["time"], panalty: panalty, user: user, imageUrl: data["imageRef"] });
              }
            );
            $('#divMessage').hide();
          }
          else {
            $('#divMessage').show();
          }
        }
      );
    }
  }

  getRecord(type: any) {
    console.log(type);
    if (type == "next") {
      this.startIndex = this.startIndex + 10;
      this.endIndex = this.endIndex + 10;
      this.progressData.startFrom = this.startIndex;
      this.progressData.endTo = this.endIndex;
      this.getCapturedImages();
    }
    else {
      if (this.startIndex != 1) {
        this.startIndex = this.startIndex - 10;
        this.endIndex = this.endIndex - 10;
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
}
