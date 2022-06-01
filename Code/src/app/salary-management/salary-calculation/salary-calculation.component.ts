import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-salary-calculation',
  templateUrl: './salary-calculation.component.html',
  styleUrls: ['./salary-calculation.component.scss']
})
export class SalaryCalculationComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
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
  wardWagesList: any[] = [];
  divLoader = "#divLoader";
  monthDays: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.todayDate = this.commonService.setTodayDate();
    this.getYear();
    this.getWardWagesList();
    this.getEmployee();
  }

  getWardWagesList() {
    this.httpService.get("../../assets/jsons/WardWeges/" + this.cityName + ".json").subscribe(wardWageData => {
      if (wardWageData != null) {
        let keyArray = Object.keys(wardWageData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let ward = keyArray[i];
            let driver = wardWageData[ward]["driver"];
            let helper = wardWageData[ward]["helper"];
            this.wardWagesList.push({ ward: ward, driver: driver, helper: helper });
          }
        }
      }
    });
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
      let list = JSON.parse(jsonData).filter(item => item.empType == 2 && item.status == 1);
      if (list.length > 0) {
        for (let i = 0; i < list.length; i++) {
          this.salaryList.push({ empId: list[i]["empId"], empCode: list[i]["empCode"], name: list[i]["name"], designation: list[i]["designation"], salary: 0 });
          this.salaryList = this.salaryList.sort((a, b) =>Number(b.empId) < Number(a.empId) ? 1 : -1);
        }
        this.getSalary();
      }
    });
  }

  getSalary() {
    $(this.divLoader).show();
    this.clearSalary();
    this.monthDays = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (Number(this.selectedMonth) == Number(this.todayDate.split('-')[1]) && this.selectedYear == this.todayDate.split('-')[0]) {
      this.monthDays = this.todayDate.split("-")[2];
    }
    if (this.salaryList.length > 0) {
      for (let i = 1; i <= this.monthDays; i++) {
        let monthDate = this.selectedYear + '-' + (this.selectedMonth < 10 ? '0' : '') + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
        this.getSalaryFromDailyWork(monthDate, i, this.monthDays);
      }
    }
  }

  getSalaryFromDailyWork(monthDate: any, index: any, days: any) {
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
                let isFirstZone = false;
                for (let j = 1; j < 10; j++) {
                  if (dailyWorkData[empId]["task" + j] != null) {
                    let ward = dailyWorkData[empId]["task" + j]["task"];
                    let wages = 0;
                    let percentage = 0;
                    if (dailyWorkData[empId]["task" + j]["task-wages"] != null) {
                      wages = dailyWorkData[empId]["task" + j]["task-wages"];
                    }
                    if (dailyWorkData[empId]["task" + j]["work-percent"] != null) {
                      percentage = dailyWorkData[empId]["task" + j]["work-percent"];
                    }
                    if (new Date(monthDate) > new Date(this.getDate())) {
                      let wageDetail = this.wardWagesList.find(item => item.ward == ward);
                      if (wageDetail != undefined) {
                        if (isFirstZone == true) {
                          wages = 200;
                        }
                        else {
                          if (salaryDetail.designation == "Driver") {
                            wages = wageDetail.driver;
                          }
                          else {
                            wages = wageDetail.helper;
                          }
                        }
                        if (!ward.includes["BinLifting"] && !ward.includes["GarageWork "]) {
                          isFirstZone = true;
                        }
                      }
                    }
                    workDetail.push({ ward: ward, wages: wages, percentage: percentage });
                  }
                }
                for (let k = 0; k < workDetail.length; k++) {
                  totalWeges += Number(workDetail[k]["wages"]);
                }
                salaryDetail[day] = workDetail;
                salaryDetail[totalDaySalary] = totalWeges;
                salaryDetail.salary += totalWeges;
              }
            }
          }
        }
        if (index == days) {
          $(this.divLoader).hide();
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

  getDate() {
    if (localStorage.getItem("cityName") == "reengus") {
      return "2022-05-21";
    }
    else if (localStorage.getItem("cityName") == "sikar") {
      return "2022-05-08";
    }
  }

  exportToExcel() {
    let exportList = [];
    if (this.salaryList.length > 0) {
      for (let i = 0; i < this.salaryList.length; i++) {
        let list = [];
        let length = 0;
        for (let j = 1; j <= this.monthDays; j++) {
          if (this.salaryList[i]["day" + j] != undefined) {
            if (length < this.salaryList[i]["day" + j].length) {
              length = this.salaryList[i]["day" + j].length;
            }
          }
        }
        for (let j = 0; j <= length; j++) {
          list.push({ empId: this.salaryList[i]["empId"], day1: "", day2: "", day3: "", day4: "", day5: "", day6: "", day7: "", day8: "", day9: "", day10: "", day11: "", day12: "", day13: "", day14: "", day15: "", day16: "", day17: "", day18: "", day19: "", day20: "", day21: "", day22: "", day23: "", day24: "", day25: "", day26: "", day27: "", day28: "", day29: "", day30: "", day31: "" });
        }

        for (let k = 1; k <= this.monthDays; k++) {
          if (this.salaryList[i]["day" + k] != undefined) {
            let taskDetail = this.salaryList[i]["day" + k];
            for (let j = 0; j <= length; j++) {
              let dayData = "";
              if (taskDetail[j] != null) {
                dayData = taskDetail[j]["ward"] + "(" + taskDetail[j]["percentage"] + "%) | " + taskDetail[j]["wages"];
                list[j]["day" + k] = dayData;
              }
              if (j == taskDetail.length) {
                list[j]["day" + k] = this.salaryList[i]["totalDaySalary" + k];
              }
            }
          }
        }
        for (let j = 0; j < list.length; j++) {
          if (j == 0) {
            exportList.push({ empId: list[j]["empId"], name: this.salaryList[i]["name"], empCode: this.salaryList[i]["empCode"], designation: this.salaryList[i]["designation"], salary: this.salaryList[i]["salary"], day1: list[j]["day1"], day2: list[j]["day2"], day3: list[j]["day3"], day4: list[j]["day4"], day5: list[j]["day5"], day6: list[j]["day6"], day7: list[j]["day7"], day8: list[j]["day8"], day9: list[j]["day9"], day10: list[j]["day10"], day11: list[j]["day11"], day12: list[j]["day12"], day13: list[j]["day13"], day14: list[j]["day14"], day15: list[j]["day15"], day16: list[j]["day16"], day17: list[j]["day17"], day18: list[j]["day18"], day19: list[j]["day19"], day20: list[j]["day20"], day21: list[j]["day21"], day22: list[j]["day22"], day23: list[j]["day23"], day24: list[j]["day24"], day25: list[j]["day25"], day26: list[j]["day26"], day27: list[j]["day27"], day28: list[j]["day28"], day29: list[j]["day29"], day30: list[j]["day30"], day31: list[j]["day31"] });
          }
          else {
            exportList.push({ empId: "", name: "", empCode: "", designation: "", salary: "", day1: list[j]["day1"], day2: list[j]["day2"], day3: list[j]["day3"], day4: list[j]["day4"], day5: list[j]["day5"], day6: list[j]["day6"], day7: list[j]["day7"], day8: list[j]["day8"], day9: list[j]["day9"], day10: list[j]["day10"], day11: list[j]["day11"], day12: list[j]["day12"], day13: list[j]["day13"], day14: list[j]["day14"], day15: list[j]["day15"], day16: list[j]["day16"], day17: list[j]["day17"], day18: list[j]["day18"], day19: list[j]["day19"], day20: list[j]["day20"], day21: list[j]["day21"], day22: list[j]["day22"], day23: list[j]["day23"], day24: list[j]["day24"], day25: list[j]["day25"], day26: list[j]["day26"], day27: list[j]["day27"], day28: list[j]["day28"], day29: list[j]["day29"], day30: list[j]["day30"], day31: list[j]["day31"] });
          }
        }
      }
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td [style.font-weight]='bold'>";
      htmlString += "Employee Code";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Role";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Salary";
      htmlString += "</td>";
      for (let i = 1; i <= this.monthDays; i++) {
        htmlString += "<td >";
        htmlString += "" + (i < 10 ? '0' : '') + i;
        htmlString += "</td>";
      }
      htmlString += "</tr>";
      for (let i = 0; i < exportList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += exportList[i]["empCode"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += exportList[i]["name"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += exportList[i]["designation"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += exportList[i]["salary"];
        htmlString += "</td>";
        for (let j = 1; j <= this.monthDays; j++) {
          let day = "day" + j;
          htmlString += "<td>";
          htmlString += exportList[i][day];
          htmlString += "</td>";
        }
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Calculated-Salary-" + this.selectedYear + "-" + this.selectedMonthName + ".xlsx";
      this.exportExcel(htmlString, fileName);
    }
  }

  exportExcel(htmlString: any, fileName: any) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, fileName);
  }
}
