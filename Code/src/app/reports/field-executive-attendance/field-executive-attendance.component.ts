import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { FirebaseService } from "../../firebase.service";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-field-executive-attendance',
  templateUrl: './field-executive-attendance.component.html',
  styleUrls: ['./field-executive-attendance.component.scss']
})
export class FieldExecutiveAttendanceComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedFieldExecutive: any;
  fieldExecutiveList: any[];
  fieldExecutiveDataList: any[];
  yearList: any[] = [];
  dayList: any[] = [];
  db: any;
  rowTo: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.fieldExecutiveList = [];
    this.fieldExecutiveDataList = [];
    this.rowTo = 0;
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    this.selectedFieldExecutive = "0";
    this.getDays();
    this.getYear();
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.getFieldExecutiveList();
  }

  getAttendance() {
    this.fieldExecutiveDataList = [];
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if (this.selectedMonth == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    if (this.selectedFieldExecutive == "0") {
      this.commonService.setAlertMessage("error", "Please select field executive !!!");
      return;
    }
    if (this.selectedFieldExecutive == "All") {
      for (let i = 0; i < this.fieldExecutiveList.length - 1; i++) {
        let summary = [];
        let dayList = [];
        this.fieldExecutiveDataList.push({ id: this.fieldExecutiveList[i]["id"], name: this.fieldExecutiveList[i]["name"], summary: summary, dayList: dayList });
        for (let j = 1; j <= this.rowTo; j++) {
          let detail = this.fieldExecutiveDataList.find(item => item.id == this.fieldExecutiveList[i]["id"]);
          if (detail != undefined) {
            let d = "day" + j;
            detail.dayList.push({ day: d, attendance: "" });
          }
        }
      }
    }
    else {
      let detail = this.fieldExecutiveList.find(item => item.id == this.selectedFieldExecutive);
      if (detail != undefined) {
        let summary = [];
        let dayList = [];
        this.fieldExecutiveDataList.push({ id: detail.id, name: detail.name, summary: summary, dayList: dayList });
        for (let j = 1; j <= this.rowTo; j++) {
          let details = this.fieldExecutiveDataList.find(item => item.id == this.selectedFieldExecutive);
          if (details != undefined) {
            let d = "day" + j;
            details.dayList.push({ day: d, attendance: "" });
          }
        }
      }
    }

    this.getMonthAttendance();
  }

  getMonthAttendance() {
    if (this.fieldExecutiveDataList.length > 0) {
      for (let i = 0; i < this.fieldExecutiveDataList.length; i++) {
        let id = this.fieldExecutiveDataList[i]["id"];
        for (let j = 0; j < this.dayList.length; j++) {
          let attendanceDate = this.selectedYear + "-" + this.selectedMonth + "-" + this.dayList[j]["day"];
          let monthName = this.commonService.getCurrentMonthName(new Date(attendanceDate).getMonth());
          let dbPath = "FEAttendance/" + id + "/" + this.selectedYear + "/" + monthName + "/" + attendanceDate;
          let attendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              attendanceInstance.unsubscribe();
              if (data != null) {
                let inTime = "00.00";
                let outTime = "0.00";
                if (data["inDetails"] != null) {
                  if (data["inDetails"]["time"] != null) {
                    inTime = data["inDetails"]["time"];
                  }
                }
                if (data["outDetails"] != null) {
                  if (data["outDetails"]["time"] != null) {
                    outTime = data["outDetails"]["time"];
                  }
                }
                let detail = this.fieldExecutiveDataList.find(item => item.id == id);
                if (detail != undefined) {
                  let dayList = detail.dayList;
                  let dayDetail = dayList.find(item => item.day == "day" + this.dayList[j]["day"]);
                  if (dayDetail != undefined) {
                    dayDetail.attendance = "In :" + inTime + "<br/>Out : " + outTime;
                  }
                }
              }
            }
          );
        }

      }
    }









  }

  getDays() {
    this.dayList = [];
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    this.rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      this.rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let i = 1; i <= this.rowTo; i++) {
      this.dayList.push({ day: (i < 10 ? '0' : '') + i, total: "0.00" });
    }
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getFieldExecutiveList() {
    let dbPath = "WastebinMonitor/FieldExecutive";
    let fieldExecutiveInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        fieldExecutiveInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let id = keyArray[i];
              let name = data[id]["name"];
              this.fieldExecutiveList.push({ id: id, name: name });
            }
            this.fieldExecutiveList.push({ id: "All", name: "All Field Executives" });
          }
        }
      });
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getDays();
    this.getAttendance();

  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.getDays();
    this.getAttendance();
  }

  changeSelection(filterVal: any) {
    this.selectedFieldExecutive = filterVal;
    this.getDays();
    this.getAttendance();
  }
}
