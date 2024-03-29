import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-penalty-review',
  templateUrl: './penalty-review.component.html',
  styleUrls: ['./penalty-review.component.scss']
})
export class PenaltyReviewComponent implements OnInit {

  constructor(private storage: AngularFireStorage, private besuh: BackEndServiceUsesHistoryService, private modalService: NgbModal, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  penaltyList: any[];
  specialUserList: any[];
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  zoneList: any[];
  arrayBuffer: any;
  first_sheet_name: any;
  monthPenaltyList: any[];
  public totalCards: any;
  divLoader = "#divLoader";
  serviceName = "portal-service-penalty-review";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services","Penality-Review",localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.totalCards = 0;
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.penaltyList = [];
    this.specialUserList = [];
    this.zoneList = [];
    this.monthPenaltyList = [];
    this.getYear();
    this.getZones();
  }
  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.toDayDate.split('-')[0];
    this.selectedMonth = this.toDayDate.split('-')[1];
    $(this.ddlMonth).val(this.selectedMonth);
    setTimeout(() => {
      this.getMonthPenalty();
    }, 200);
  }

  getMonthPenalty() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMonthPenalty");
    this.totalCards = 0;
    this.monthPenaltyList = [];
    for (let i = 1; i < this.zoneList.length; i++) {
      if (!this.zoneList[i]["zoneNo"].includes("Commercial")) {
        this.monthPenaltyList.push({ zone: this.zoneList[i]["zoneNo"] });
      }
    }
    if ($(this.ddlYear).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if ($(this.ddlMonth).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    $(this.divLoader).show();
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let days = new Date(Number(this.selectedYear), Number(this.selectedMonth), 0).getDate();
    for (let i = 1; i <= days; i++) {
      let date = this.selectedYear + "-" + this.selectedMonth + "-" + (i < 10 ? '0' : '') + i;
      let dbPath = "PenaltyReview/" + date;
      let penaltyInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        penaltyInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMonthPenalty", data);
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let j = 0; j < keyArray.length; j++) {
              let zoneNo = keyArray[j];
              let detail = this.monthPenaltyList.find(item => item.zone == zoneNo);
              if (detail != undefined) {
                detail["day" + i] = data[zoneNo];
                this.totalCards += Number(data[zoneNo]);
              }
            }
          }
        }
        if (i == days) {
          setTimeout(() => {
            $(this.divLoader).hide();
            this.closeModel();
          }, 600);
        }
      });
    }
  }

  openModel(content: any) {
    let showPopup = true;
    if ($(this.ddlYear).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      showPopup = false;
    }
    if ($(this.ddlMonth).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      showPopup = false;
    }
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let days = new Date(Number(this.selectedYear), Number(this.selectedMonth), 0).getDate();
    let element = <HTMLInputElement>document.getElementById("flpUpload");
    let file = element.files[0];
    if (file == null) {
      this.commonService.setAlertMessage("error", "Please select file !!!");
      return;
    }
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      this.first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[this.first_sheet_name];
      let fileList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      if (fileList[0]["Ward"] == null) {
        this.commonService.setAlertMessage("error", "File is not correct. Please download sample file !!!");
        showPopup = false;
      }
      if (showPopup == true) {
        this.modalService.open(content, { size: "lg" });
        let windowHeight = $(window).height();
        let height = 200;
        let width = 400;
        let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
        $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
        $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
        $("div .modal-dialog-centered").css("margin-top", "26px");
      }
      else {
        this.closeModel();
      }
    }

  }

  closeModel() {
    this.modalService.dismissAll();
  }

  getFileData() {
    if ($(this.ddlYear).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if ($(this.ddlMonth).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let days = new Date(Number(this.selectedYear), Number(this.selectedMonth), 0).getDate();
    let element = <HTMLInputElement>document.getElementById("flpUpload");
    let file = element.files[0];
    if (file == null) {
      this.commonService.setAlertMessage("error", "Please select file !!!");
      return;
    }
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      this.first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[this.first_sheet_name];
      let fileList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      if (fileList[0]["Ward"] == null) {
        this.commonService.setAlertMessage("error", "File is not correct. Please download sample file !!!");
        return;
      }
      for (let j = 1; j <= days; j++) {
        let date = this.selectedYear + "-" + this.selectedMonth + "-" + (j < 10 ? '0' : '') + j;
        const jsonObj = {};
        for (let i = 0; i < fileList.length; i++) {
          let wardNo = fileList[i]["Ward"];
          let unScanedCards = 0;
          if (fileList[i][j] != undefined) {
            unScanedCards = fileList[i][j];
          }
          jsonObj[wardNo.toString()] = unScanedCards;
        }
        let dbPath = "PenaltyReview/" + date;
        this.db.object(dbPath).update(jsonObj);
      }
      this.getMonthPenalty();
      this.commonService.setAlertMessage("success", "Data Updated Successfully!!!");
    }
  }


  downloadTemplate() {
    let link = document.createElement("a");
    link.download = "sample";
    link.href = this.commonService.fireStoragePath + "Common%2FPenaltySample.xlsx?alt=media";
    link.click();
    link.remove();
    this.commonService.setAlertMessage("success","File downloaded successfully !!!");
  }
}
