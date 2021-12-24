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
      for (let i = 0; i < this.fieldExecutiveList.length; i++) {
        this.fieldExecutiveDataList.push({ id: this.fieldExecutiveList[i]["id"], name: this.fieldExecutiveList[i]["name"] });
      }
    }
    else {
      let detail=this.fieldExecutiveList.find(item=>item.id==this.selectedFieldExecutive);
      if(detail!=undefined){
        this.fieldExecutiveDataList.push({ id: detail.id, name: detail.name });
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
