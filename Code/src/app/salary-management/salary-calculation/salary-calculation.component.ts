import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-salary-calculation',
  templateUrl: './salary-calculation.component.html',
  styleUrls: ['./salary-calculation.component.scss']
})
export class SalaryCalculationComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  fireStoreCity: any;
  fireStoragePath: any;
  todayDate: any;
  selectedMonth: any;
  selectedMonthName: any;
  selectedYear: any;
  yearList: any[] = [];
  salaryList: any[] = [];
  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.todayDate = this.commonService.setTodayDate();
    this.getYear();
    this.getEmployee();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.todayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedMonth = Number(this.todayDate.split('-')[1]);
    this.selectedYear = this.todayDate.split('-')[0];
    $(this.ddlMonth).val(this.todayDate.split('-')[1]);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
  }

  getEmployee() {
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let employeeInstance = this.httpService.get(path).subscribe(data => {
      employeeInstance.unsubscribe();
      let jsonData = JSON.stringify(data);
      let list = JSON.parse(jsonData).filter(item => item.empType == 2);
      if (list.length > 0) {
        for (let i = 0; i < list.length; i++) {
          this.salaryList.push({ empId: list[i]["empId"], empCode: list[i]["empCode"], name: list[i]["name"], designation: list[i]["designation"] });
          this.salaryList = this.commonService.transformNumeric(this.salaryList, "empCode");
        }
        this.getSalary();
      }
    });
  }

  getSalary() {
    this.clearSalary();
    let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (Number(this.selectedMonth) == Number(this.todayDate.split('-')[1]) && this.selectedYear == this.todayDate.split('-')[0]) {
      days = this.todayDate.split("-")[2];
    }
    if (this.salaryList.length > 0) {
      for (let i = 1; i <= days; i++) {
        let monthDate = this.selectedYear + '-' + (this.selectedMonth < 10 ? '0' : '') + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
        this.getSalaryFromDailyWork(monthDate);
      }
    }
  }

  getSalaryFromDailyWork(monthDate: any) {
    let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
    let dailyWorkInstance = this.db.object(dbPath).valueChanges().subscribe(
      dailyWorkData => {
        dailyWorkInstance.unsubscribe();
        if (dailyWorkData != null) {
          let keyArray = Object.keys(dailyWorkData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let empId = keyArray[i];
              let salaryDetail = this.salaryList.find(item => item.empId == empId);
              if (salaryDetail != undefined) {
                let day = "day" + Number(monthDate.split('-')[2]);
                let totalDaySalary = "totalDaySalary" + Number(monthDate.split('-')[2]);
                let workDetail = [];
                let totalWeges = 0;
                for (let j = 1; j < 10; j++) {
                  if (dailyWorkData[empId]["task" + j] != null) {
                    let ward = dailyWorkData[empId]["task" + j]["task"];
                    let wages = 0;
                    let percentage = 0;
                    if (dailyWorkData[empId]["task" + j]["task-wages"] != null) {
                      wages = dailyWorkData[empId]["task" + j]["task-wages"];
                      percentage = dailyWorkData[empId]["task" + j]["work-percent"];
                      totalWeges += Number(dailyWorkData[empId]["task" + j]["task-wages"]);
                    }
                    workDetail.push({ ward: ward, wages: wages, percentage: percentage });
                  }
                }
                salaryDetail[day] = workDetail;
                salaryDetail[totalDaySalary] = totalWeges;
              }
            }
          }
        }
      }
    );
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    if (filterVal != "0") {
      this.getSalary();
    }
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = Number(filterVal);
    if (this.selectedMonth != 0) {
      this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
      this.getSalary();
    }
  }

  clearSalary() {
    console.log("Aaaaa");
    for (let i = 1; i <= 31; i++) {
      for (let j = 0; j < this.salaryList.length; j++) {
        if (this.salaryList[j]["day" + i] != null) {
          this.salaryList[j]["day" + i] = [];
        }
        if (this.salaryList[j]["totalDaySalary" + i] != null) {
          this.salaryList[j]["totalDaySalary" + i] = null;
        }
      }
    }
  }
}
