import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import * as XLSX from 'xlsx';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-non-salaried-calculation',
  templateUrl: './non-salaried-calculation.component.html',
  styleUrls: ['./non-salaried-calculation.component.scss']
})
export class NonSalariedCalculationComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  fireStoreCity: any;
  fireStoragePath: any;
  todayDate: any;
  selectedMonth: any;
  selectedMonthName: any;
  selectedYear: any;
  yearList: any[] = [];
  zoneList: any[];
  employeeList: any[] = [];
  salaryList: any[] = [];
  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";
  ddlRoles = "#ddlRoles";
  wardWagesList: any[] = [];
  divLoader = "#divLoader";
  monthDays: any;
  serviceName = "non-salaried-calculation";


  salarySummary: salarySummary =
    {
      salary: "0.00",
      salary1: "0.00",
      salary2: "0.00",
      salary3: "0.00",
      salary4: "0.00",
      salary5: "0.00",
      salary6: "0.00",
      salary7: "0.00",
      salary8: "0.00",
      salary9: "0.00",
      salary10: "0.00",
      salary11: "0.00",
      salary12: "0.00",
      salary13: "0.00",
      salary14: "0.00",
      salary15: "0.00",
      salary16: "0.00",
      salary17: "0.00",
      salary18: "0.00",
      salary19: "0.00",
      salary20: "0.00",
      salary21: "0.00",
      salary22: "0.00",
      salary23: "0.00",
      salary24: "0.00",
      salary25: "0.00",
      salary26: "0.00",
      salary27: "0.00",
      salary28: "0.00",
      salary29: "0.00",
      salary30: "0.00",
      salary31: "0.00"
    };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Salary-Management-Driver", "Salary-Calculation", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.fireStoragePath = this.commonService.fireStoragePath;
    this.todayDate = this.commonService.setTodayDate();
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.getYear();
    this.getWardWagesList();
  }

  getWardWagesList() {
    const pathDate = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSettings%2FWages.json?alt=media";
    let wardLineInstance = this.httpService.get(pathDate).subscribe(wardWageData => {
      wardLineInstance.unsubscribe();
      if (wardWageData != null) {
        let keyArray = Object.keys(wardWageData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            let wages = [];
            let wardObject = wardWageData[date];
            let wardKeyArray = Object.keys(wardObject);
            if (wardKeyArray.length > 0) {
              for (let j = 0; j < wardKeyArray.length; j++) {
                let ward = wardKeyArray[j];
                let driver = wardObject[ward]["driver"];
                let helper = wardObject[ward]["helper"];
                wages.push({ ward: ward, driver: driver, helper: helper });
              }
            }
            let timestamp = new Date(date).getTime();
            this.wardWagesList.push({ date: date, timestamp: timestamp, wages: wages });
          }
        }
        this.wardWagesList = this.commonService.transformNumeric(this.wardWagesList, "-timestamp");
      }
      this.getEmployee();
    }, error => {
      this.getEmployee();
    });
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.todayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.todayDate.split('-')[0];
    $(this.ddlYear).val(this.selectedYear);
  }

  getEmployee() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getEmployee");
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 2000);
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let employeeInstance = this.httpService.get(path).subscribe(data => {
      employeeInstance.unsubscribe();
      let jsonData = JSON.stringify(data);
      let list = JSON.parse(jsonData).filter(item => item.empType == 2 && item.status == 1);
      if (list.length > 0) {
        for (let i = 0; i < list.length; i++) {
          let empId = list[i]["empId"];
          let dbPath = "Employees/" + empId + "/GeneralDetails/salaryType";
          let salaryTypeInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
            salaryTypeInstance.unsubscribe();
            let isSalaried = false;

            if (data != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getEmployee", data);
              if (data == "non-salaried") {
                isSalaried = true;
              }
            }

            if (isSalaried == true) {
              this.employeeList.push({ empId: list[i]["empId"], empCode: list[i]["empCode"], name: list[i]["name"], designation: list[i]["designation"] });
              this.employeeList = this.employeeList.sort((a, b) => Number(b.empId) < Number(a.empId) ? 1 : -1);
            }
            this.salaryList = this.employeeList;
          });
        }
      }
      setTimeout(() => {
        $(this.divLoader).hide();
      }, 12000);

    });
  }

  getFilterEmployeeList(filterVal: any) {
    if (filterVal == "0") {
      this.salaryList = this.employeeList;
    }
    else {
      this.salaryList = this.employeeList.filter(item => item.designation == filterVal);
      this.salaryList = this.salaryList.sort((a, b) => Number(b.empId) < Number(a.empId) ? 1 : -1);
    }
    this.getSalary();
  }

  
  async getSalary() {
    $(this.divLoader).show();

   this.clearSalary();
   this.monthDays = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
   if (Number(this.selectedMonth) == Number(this.todayDate.split('-')[1]) && this.selectedYear == this.todayDate.split('-')[0]) {
     this.monthDays = this.todayDate.split("-")[2];
   }
   if (this.salaryList.length > 0) {

     let loaderTime = 12000;
     if (this.monthDays < 5) {
       loaderTime = 24000;
     }
     else if (this.monthDays < 10) {
       loaderTime = 36000;
     }
     else if (this.monthDays < 15) {
       loaderTime = 48000;
     }
     else if (this.monthDays < 20) {
       loaderTime = 60000;
     }
     else if (this.monthDays < 25) {
       loaderTime = 72000;
     }
     else if (this.monthDays < 32) {
       loaderTime = 84000;
     }

     for (let i = 1; i <= this.monthDays; i++) {
       let monthDate = this.selectedYear + '-' + (this.selectedMonth < 10 ? '0' : '') + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
       this.getSalaryFromDailyWork(monthDate, i, this.monthDays);
     }
     setTimeout(() => {
       $(this.divLoader).hide();
     }, loaderTime);
   }
 }
  
  getSalaryFromDailyWork(monthDate: any, index: any, days: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getSalaryFromDailyWork");
    let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
    let dailyWorkInstance = this.db.object(dbPath).valueChanges().subscribe(
      dailyWorkData => {
        dailyWorkInstance.unsubscribe();
        if (dailyWorkData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getSalaryFromDailyWork", dailyWorkData);
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
                    let inTime = "";
                    let outTime = "";
                    if (dailyWorkData[empId]["task" + j]["task-wages"] != null) {
                      wages = dailyWorkData[empId]["task" + j]["task-wages"];
                    }
                    if (!ward.includes("BinLifting")) {
                      if (dailyWorkData[empId]["task" + j]["in-out"] != null) {
                        let inOutObj = dailyWorkData[empId]["task" + j]["in-out"];
                        let inOutKeyArray = Object.keys(inOutObj);
                        for (let i = 0; i < inOutKeyArray.length; i++) {
                          if (inOutObj[inOutKeyArray[i]] == "In") {
                            inTime = inOutKeyArray[i];
                            i = inOutKeyArray.length;
                          }
                        }
                        for (let i = inOutKeyArray.length - 1; i >= 0; i--) {
                          if (inOutObj[inOutKeyArray[i]] == "Out") {
                            outTime = inOutKeyArray[i];
                            i = -1;
                          }
                        }
                      }
                    }
                    if (new Date(monthDate) >= new Date(this.getDate())) {
                      if (this.wardWagesList.length > 0) {
                        for (let k = 0; k < this.wardWagesList.length; k++) {
                          let wageDate = this.wardWagesList[k]["date"];
                          if (new Date(monthDate) >= new Date(wageDate)) {
                            let wagesList = this.wardWagesList[k]["wages"];
                            let wageDetail = wagesList.find(item => item.ward == ward);
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
                            k = this.wardWagesList.length;
                          }
                        }
                      }
                    }

                    if (new Date(this.commonService.setTodayDate() + " " + inTime) > new Date(this.commonService.setTodayDate() + " " + outTime)) {
                      let dbPath = "WasteCollectionInfo/" + ward + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/Summary/lastLineCompletedOn";
                      let lastLineCompletedOnInstance = this.db.object(dbPath).valueChanges().subscribe(lastData => {
                        lastLineCompletedOnInstance.unsubscribe();
                        if (lastData != null) {
                          let hour = Number(lastData.toString().split(":")[0]) + 1;
                          outTime = (hour < 10 ? '0' : '') + hour + ":" + lastData.toString().split(":")[1] + ":00";
                        }
                        let detail = workDetail.find(item => item.ward == ward);
                        if (detail == undefined) {
                          workDetail.push({ ward: ward, wages: wages, inTime: inTime, outTime: outTime, percentage: 0 });
                        }
                        let zoneDetail = this.zoneList.find(item => item.zoneNo == ward);
                        if (zoneDetail != undefined) {
                          this.getWorkPercentage(empId, ward, monthDate, index, days, inTime, outTime);
                        }
                        for (let k = 0; k < workDetail.length; k++) {
                          totalWeges += Number(workDetail[k]["wages"]);
                        }
                        salaryDetail[day] = workDetail;
                        salaryDetail[totalDaySalary] = totalWeges;
                        salaryDetail.salary += totalWeges;
                        this.salarySummary.salary = (Number(this.salarySummary.salary) + totalWeges).toFixed(2);
                        this.getTotalSalaryFooter(index, totalWeges);
                      });
                    }
                    else {
                      let detail = workDetail.find(item => item.ward == ward);
                      if (detail == undefined) {
                        workDetail.push({ ward: ward, wages: wages, inTime: inTime, outTime: outTime, percentage: 0 });
                      }

                      // workDetail.push({ ward: ward, wages: wages, inTime: inTime, outTime: outTime, percentage: 0 });
                      let zoneDetail = this.zoneList.find(item => item.zoneNo == ward);
                      if (zoneDetail != undefined) {
                        this.getWorkPercentage(empId, ward, monthDate, index, days, inTime, outTime);
                      }
                      for (let k = 0; k < workDetail.length; k++) {
                        totalWeges += Number(workDetail[k]["wages"]);
                      }
                      salaryDetail[day] = workDetail;
                      salaryDetail[totalDaySalary] = totalWeges;
                      salaryDetail.salary += totalWeges;
                      this.salarySummary.salary = (Number(this.salarySummary.salary) + totalWeges).toFixed(2);
                      this.getTotalSalaryFooter(index, totalWeges);
                    }
                  }
                }
              }
            }
          }
        }
      }
    );
  }
  
  getWorkPercentage(empId: any, ward: any, monthDate: any, index: any, days: any, inTime: any, outTime: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWorkPercentage");
    this.commonService.getWardLine(ward, monthDate).then((linesData: any) => {
      let wardLinesDataObj = JSON.parse(linesData);
      let totalLines = Number(wardLinesDataObj["totalLines"]);
      let dbPath = "WasteCollectionInfo/" + ward + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/LineStatus";
      let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
        lineStatusInstance.unsubscribe();

        let inTimeDate = new Date(monthDate + " " + inTime);
        let outTimeDate = new Date();
        if (outTime != "") {
          outTimeDate = new Date(monthDate + " " + outTime);
        }
        let workLines = 0;
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            if (data[lineNo]["Status"] == "LineCompleted") {
              if (data[lineNo]["reason"] == "-NA-") {
                if (data[lineNo]["start-time"] != null) {
                  let startTime = data[lineNo]["start-time"];
                  let hour = Number(startTime.split(":")[0]);
                  if (hour >= 1 && hour <= 4) {
                    startTime = (hour + 12) + ":" + startTime.split(":")[1] + ":" + startTime.split(":")[2];
                  }
                  if (new Date(monthDate + " " + startTime) >= inTimeDate && new Date(monthDate + " " + startTime) <= outTimeDate) {
                    workLines++;
                  }
                }
              }
            }
          }
          let workPercentage = Number(((workLines / totalLines) * 100).toFixed(2).split(".")[0]);
          let salaryDetail = this.salaryList.find(item => item.empId == empId);
          if (salaryDetail != undefined) {
            let day = "day" + Number(monthDate.split('-')[2]);
            let workDetailList = salaryDetail[day];
            if (workDetailList.length > 0) {
              for (let i = 0; i < workDetailList.length; i++) {
                if (workDetailList[i]["ward"] == ward) {
                  workDetailList[i]["percentage"] = Number(workDetailList[i]["percentage"]) + workPercentage;
                }
              }
            }
          }
        }
      })
    })

  }



  getTotalSalaryFooter(index: any, totalWeges: any) {
    if (index == 1) {
      this.salarySummary.salary1 = (Number(this.salarySummary.salary1) + totalWeges).toFixed(2);
    }
    if (index == 2) {
      this.salarySummary.salary2 = (Number(this.salarySummary.salary2) + totalWeges).toFixed(2);
    }
    if (index == 3) {
      this.salarySummary.salary3 = (Number(this.salarySummary.salary3) + totalWeges).toFixed(2);
    }
    if (index == 4) {
      this.salarySummary.salary4 = (Number(this.salarySummary.salary4) + totalWeges).toFixed(2);
    }
    if (index == 5) {
      this.salarySummary.salary5 = (Number(this.salarySummary.salary5) + totalWeges).toFixed(2);
    }
    if (index == 6) {
      this.salarySummary.salary6 = (Number(this.salarySummary.salary6) + totalWeges).toFixed(2);
    }
    if (index == 7) {
      this.salarySummary.salary7 = (Number(this.salarySummary.salary7) + totalWeges).toFixed(2);
    }
    if (index == 8) {
      this.salarySummary.salary8 = (Number(this.salarySummary.salary8) + totalWeges).toFixed(2);
    }
    if (index == 9) {
      this.salarySummary.salary9 = (Number(this.salarySummary.salary9) + totalWeges).toFixed(2);
    }
    if (index == 10) {
      this.salarySummary.salary10 = (Number(this.salarySummary.salary10) + totalWeges).toFixed(2);
    }
    if (index == 11) {
      this.salarySummary.salary11 = (Number(this.salarySummary.salary11) + totalWeges).toFixed(2);
    }
    if (index == 12) {
      this.salarySummary.salary12 = (Number(this.salarySummary.salary12) + totalWeges).toFixed(2);
    }
    if (index == 13) {
      this.salarySummary.salary13 = (Number(this.salarySummary.salary13) + totalWeges).toFixed(2);
    }
    if (index == 14) {
      this.salarySummary.salary14 = (Number(this.salarySummary.salary14) + totalWeges).toFixed(2);
    }
    if (index == 15) {
      this.salarySummary.salary15 = (Number(this.salarySummary.salary15) + totalWeges).toFixed(2);
    }
    if (index == 16) {
      this.salarySummary.salary16 = (Number(this.salarySummary.salary16) + totalWeges).toFixed(2);
    }
    if (index == 17) {
      this.salarySummary.salary17 = (Number(this.salarySummary.salary17) + totalWeges).toFixed(2);
    }
    if (index == 18) {
      this.salarySummary.salary18 = (Number(this.salarySummary.salary18) + totalWeges).toFixed(2);
    }
    if (index == 19) {
      this.salarySummary.salary19 = (Number(this.salarySummary.salary19) + totalWeges).toFixed(2);
    }
    if (index == 20) {
      this.salarySummary.salary20 = (Number(this.salarySummary.salary20) + totalWeges).toFixed(2);
    }
    if (index == 21) {
      this.salarySummary.salary21 = (Number(this.salarySummary.salary21) + totalWeges).toFixed(2);
    }
    if (index == 22) {
      this.salarySummary.salary22 = (Number(this.salarySummary.salary22) + totalWeges).toFixed(2);
    }
    if (index == 23) {
      this.salarySummary.salary23 = (Number(this.salarySummary.salary23) + totalWeges).toFixed(2);
    }
    if (index == 24) {
      this.salarySummary.salary24 = (Number(this.salarySummary.salary24) + totalWeges).toFixed(2);
    }
    if (index == 25) {
      this.salarySummary.salary25 = (Number(this.salarySummary.salary25) + totalWeges).toFixed(2);
    }
    if (index == 26) {
      this.salarySummary.salary26 = (Number(this.salarySummary.salary26) + totalWeges).toFixed(2);
    }
    if (index == 27) {
      this.salarySummary.salary27 = (Number(this.salarySummary.salary27) + totalWeges).toFixed(2);
    }
    if (index == 28) {
      this.salarySummary.salary28 = (Number(this.salarySummary.salary28) + totalWeges).toFixed(2);
    }
    if (index == 29) {
      this.salarySummary.salary29 = (Number(this.salarySummary.salary29) + totalWeges).toFixed(2);
    }
    if (index == 30) {
      this.salarySummary.salary30 = (Number(this.salarySummary.salary30) + totalWeges).toFixed(2);
    }
    if (index == 31) {
      this.salarySummary.salary31 = (Number(this.salarySummary.salary31) + totalWeges).toFixed(2);
    }

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
    this.salarySummary.salary = "0.00";
    this.salarySummary.salary1 = "0.00";
    this.salarySummary.salary2 = "0.00";
    this.salarySummary.salary3 = "0.00";
    this.salarySummary.salary4 = "0.00";
    this.salarySummary.salary5 = "0.00";
    this.salarySummary.salary6 = "0.00";
    this.salarySummary.salary7 = "0.00";
    this.salarySummary.salary8 = "0.00";
    this.salarySummary.salary9 = "0.00";
    this.salarySummary.salary10 = "0.00";
    this.salarySummary.salary11 = "0.00";
    this.salarySummary.salary12 = "0.00";
    this.salarySummary.salary13 = "0.00";
    this.salarySummary.salary14 = "0.00";
    this.salarySummary.salary15 = "0.00";
    this.salarySummary.salary16 = "0.00";
    this.salarySummary.salary17 = "0.00";
    this.salarySummary.salary18 = "0.00";
    this.salarySummary.salary19 = "0.00";
    this.salarySummary.salary20 = "0.00";
    this.salarySummary.salary21 = "0.00";
    this.salarySummary.salary22 = "0.00";
    this.salarySummary.salary23 = "0.00";
    this.salarySummary.salary24 = "0.00";
    this.salarySummary.salary25 = "0.00";
    this.salarySummary.salary26 = "0.00";
    this.salarySummary.salary27 = "0.00";
    this.salarySummary.salary28 = "0.00";
    this.salarySummary.salary29 = "0.00";
    this.salarySummary.salary30 = "0.00";
    this.salarySummary.salary31 = "0.00";
    for (let i = 1; i <= 31; i++) {
      for (let j = 0; j < this.salaryList.length; j++) {
        if (this.salaryList[j]["day" + i] != null) {
          this.salaryList[j]["day" + i] = [];
        }
        if (this.salaryList[j]["totalDaySalary" + i] != null) {
          this.salaryList[j]["totalDaySalary" + i] = null;
        }
        this.salaryList[j]["salary"] = 0;
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
              if (j == length) {
                list[j]["day" + k] = this.salaryList[i]["totalDaySalary" + k];
              }
            }
          }
        }
        for (let j = 0; j < list.length; j++) {
          if (j == 0) {
            exportList.push({ empId: list[j]["empId"], name: this.salaryList[i]["name"], empCode: this.salaryList[i]["empCode"], designation: this.salaryList[i]["designation"], salary: "", day1: list[j]["day1"], day2: list[j]["day2"], day3: list[j]["day3"], day4: list[j]["day4"], day5: list[j]["day5"], day6: list[j]["day6"], day7: list[j]["day7"], day8: list[j]["day8"], day9: list[j]["day9"], day10: list[j]["day10"], day11: list[j]["day11"], day12: list[j]["day12"], day13: list[j]["day13"], day14: list[j]["day14"], day15: list[j]["day15"], day16: list[j]["day16"], day17: list[j]["day17"], day18: list[j]["day18"], day19: list[j]["day19"], day20: list[j]["day20"], day21: list[j]["day21"], day22: list[j]["day22"], day23: list[j]["day23"], day24: list[j]["day24"], day25: list[j]["day25"], day26: list[j]["day26"], day27: list[j]["day27"], day28: list[j]["day28"], day29: list[j]["day29"], day30: list[j]["day30"], day31: list[j]["day31"] });
          }
          else if (j == list.length - 1) {
            exportList.push({ empId: "", name: "", empCode: "", designation: "", salary: this.salaryList[i]["salary"], day1: list[j]["day1"], day2: list[j]["day2"], day3: list[j]["day3"], day4: list[j]["day4"], day5: list[j]["day5"], day6: list[j]["day6"], day7: list[j]["day7"], day8: list[j]["day8"], day9: list[j]["day9"], day10: list[j]["day10"], day11: list[j]["day11"], day12: list[j]["day12"], day13: list[j]["day13"], day14: list[j]["day14"], day15: list[j]["day15"], day16: list[j]["day16"], day17: list[j]["day17"], day18: list[j]["day18"], day19: list[j]["day19"], day20: list[j]["day20"], day21: list[j]["day21"], day22: list[j]["day22"], day23: list[j]["day23"], day24: list[j]["day24"], day25: list[j]["day25"], day26: list[j]["day26"], day27: list[j]["day27"], day28: list[j]["day28"], day29: list[j]["day29"], day30: list[j]["day30"], day31: list[j]["day31"] });
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
          if (exportList[i][day] != null) {
            htmlString += exportList[i][day];
          }
          htmlString += "</td>";
        }
        htmlString += "</tr>";
      }
      // total on footer
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total";
      htmlString += "</td>";
      let totalSalary = 0;
      for (let i = 0; i < this.salaryList.length; i++) {
        totalSalary += this.salaryList[i]["salary"];
      }
      htmlString += "<td>";
      htmlString += totalSalary;
      htmlString += "</td>";

      for (let j = 1; j <= this.monthDays; j++) {
        let daySalary = 0;
        let totalDaySalary = "totalDaySalary" + j;
        for (let i = 0; i < this.salaryList.length; i++) {
          if (this.salaryList[i][totalDaySalary] != null) {
            daySalary += this.salaryList[i][totalDaySalary];
          }
        }
        htmlString += "<td>";
        htmlString += daySalary;
        htmlString += "</td>";
      }
      htmlString += "</tr>";
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


export class salarySummary {
  salary: string;
  salary1: string;
  salary2: string;
  salary3: string;
  salary4: string;
  salary5: string;
  salary6: string;
  salary7: string;
  salary8: string;
  salary9: string;
  salary10: string;
  salary11: string;
  salary12: string;
  salary13: string;
  salary14: string;
  salary15: string;
  salary16: string;
  salary17: string;
  salary18: string;
  salary19: string;
  salary20: string;
  salary21: string;
  salary22: string;
  salary23: string;
  salary24: string;
  salary25: string;
  salary26: string;
  salary27: string;
  salary28: string;
  salary29: string;
  salary30: string;
  salary31: string;
}