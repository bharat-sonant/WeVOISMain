import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employee-salary',
  templateUrl: './employee-salary.component.html',
  styleUrls: ['./employee-salary.component.scss']
})
export class EmployeeSalaryComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  sundayList: any[];
  employeeList: any[];
  monthSalaryList: any[];
  salaryList: any[];
  allSalaryList: any[];
  salaryDetail: salaryDetail = {
    totalSalary: "0.00",
  }
  // setting data
  basic_minimum_hour: any;
  basic_minimum_minute: any;
  compactor_basic_hour: any;
  compactor_basic_minute: any;
  compactor_driver_incentive_per_hour: any;
  compactor_driver_salary_per_hour: any;
  driver_incentive_per_hour: any;
  driver_reward_amount: any;
  driver_salary_per_hour: any;
  helper_incentive_per_hour: any;
  helper_reward_amount: any;
  helper_salary_per_hour: any;
  tractor_driver_salary: any;
  tractor_reward_amount: any;
  tractor_reward_days: any;
  workingDayInMonth: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    let date = this.commonService.getPreviousMonth(this.toDayDate, 1);
    this.yearList = [];
    this.employeeList = [];
    this.salaryList = [];
    this.allSalaryList = [];
    this.getYear();
    this.selectedMonth = date.split('-')[1];
    this.selectedYear = date.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getSetting();
  }

  getSetting() {
    this.basic_minimum_hour = 0;
    this.compactor_basic_hour = 0;
    this.compactor_driver_incentive_per_hour = 0;
    this.compactor_driver_salary_per_hour = 0;
    this.driver_incentive_per_hour = 0;
    this.driver_reward_amount = 0;
    this.driver_salary_per_hour = 0;
    this.helper_incentive_per_hour = 0;
    this.helper_reward_amount = 0;
    this.helper_salary_per_hour = 0;
    this.tractor_driver_salary = 0;
    this.tractor_reward_amount = 0;
    this.tractor_reward_days = 0;
    this.basic_minimum_minute = 0;
    this.compactor_basic_minute = 0;
    this.workingDayInMonth = 0;

    let dbPath = "Settings/Salary";
    let salaryData = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        salaryData.unsubscribe();
        this.basic_minimum_hour = data["basic_minimum_hour"];
        this.compactor_basic_hour = data["compactor_basic_hour"];
        this.compactor_driver_incentive_per_hour = data["compactor_driver_incentive_per_hour"];
        this.compactor_driver_salary_per_hour = data["compactor_driver_salary_per_hour"];
        this.driver_incentive_per_hour = data["driver_incentive_per_hour"];
        this.driver_reward_amount = data["driver_reward_amount"];
        this.driver_salary_per_hour = data["driver_salary_per_hour"];
        this.helper_incentive_per_hour = data["helper_incentive_per_hour"];
        this.helper_reward_amount = data["helper_reward_amount"];
        this.helper_salary_per_hour = data["helper_salary_per_hour"];
        this.tractor_driver_salary = data["tractor_driver_salary"];
        this.tractor_reward_amount = data["tractor_reward_amount"];
        this.tractor_reward_days = data["tractor_reward_days"];
        this.basic_minimum_minute = Number(this.basic_minimum_hour) * 60;
        this.compactor_basic_minute = Number(this.compactor_basic_hour) * 60;
        this.getEmployee();
      });
  }

  getEmployee() {
    $('#divLoader').show();
    let dbPath = "Employees";
    let employeeInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        employeeInstance.unsubscribe();
        if (data.length > 0) {
          let salaryList = [];
          for (let i = 0; i < data.length; i++) {
            if (data[i]["GeneralDetails"] != null) {
              let empId = data[i]["GeneralDetails"]["userName"];
              let empCode = data[i]["GeneralDetails"]["empCode"];
              let name = data[i]["GeneralDetails"]["name"];
              let doj = data[i]["GeneralDetails"]["dateOfJoining"];
              let designation = "";
              if (data[i]["GeneralDetails"]["designationId"] == "5") {
                designation = "Driver";
              }
              else if (data[i]["GeneralDetails"]["designationId"] == "6") {
                designation = "Helper";
              }
              else {
                this.getDesignation(empId, data[i]["GeneralDetails"]["designationId"]);
              }
              let task = [];
              let totalWages = [];
              salaryList.push({ empId: empId, empCode: empCode, name: name, doj: doj, status:data[i]["GeneralDetails"]["status"], totalWages: totalWages, task: task, vehicle: "", designation: designation, fullDay: 0, totalAmount: 0, rewardAmount: 0, penaltyAmount: 0, finalAmount: 0, workingDays: 0, garageDuty: 0, orderBy: 0 });
            }
            this.salaryList = this.commonService.transformNumeric(salaryList, "empCode");
          }
          this.getSalary();
        }
      }
    );
  }

  getDesignation(empId: any, designationId: any) {
    let dbPath = "Defaults/Designations/" + designationId + "/name";
    let designationInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        designationInstance.unsubscribe();
        if (data != null) {
          let detail = this.salaryList.find(item => item.empId == empId);
          if (detail != undefined) {
            detail.designation = data;
          }
        }
      }
    );
  }


  getSalary() {
    $('#divLoader').show();
    this.getSundaysInMonth(this.selectedMonth, this.selectedYear);
    let dbPath = "Defaults/WorkingDayInMonth/" + this.selectedMonthName;
    let workingDayInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        workingDayInstance.unsubscribe();
        if (data != null) {
          this.workingDayInMonth = Number(data);
        }
        let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName;
        let workInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            workInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let i = 0; i < keyArray.length; i++) {
                  let date = keyArray[i];
                  let empObject = data[date];
                  let empArray = Object.keys(empObject);
                  if (empArray.length > 0) {
                    for (let j = 0; j < empArray.length; j++) {
                      let empId = empArray[j];
                      let salary = 0;
                      if (empObject[empId]["today-wages"] != null) {
                        salary = Number(empObject[empId]["today-wages"]);
                      }

                      let garageDays = 0;
                      let taskCount = 0;
                      let timesInMinutes = 0;
                      let vehicle = "";
                      let task = [];
                      for (let k = 1; k < 5; k++) {
                        if (empObject[empId]["task" + k] != null) {
                          vehicle = empObject[empId]["task" + k]["vehicle"];
                          if (empObject[empId]["task" + k]["final-approved-time-in-minute"] != null) {
                            timesInMinutes += Number(empObject[empId]["task" + k]["final-approved-time-in-minute"]);
                            task.push({ vehicle: vehicle, finalApproveTime: empObject[empId]["task" + k]["final-approved-time-in-minute"] });
                          }
                          taskCount++;
                          if (empObject[empId]["task" + k]["task"] == "GarageWork"/* && empObject[empId]["task" + k]["final-approved-time-in-minute"]=="360"*/) {
                            garageDays++;
                          }
                        }
                      }
                      if (taskCount != garageDays) {
                        garageDays = 0;
                      }
                      else {
                        garageDays = 1;
                      }

                      let detail = this.salaryList.find(item => item.empId == empId);
                      if (detail != undefined) {
                        detail.totalAmount += salary;
                        detail.workingDays += 1;
                        detail.garageDuty += garageDays;
                        if (task.length > 0) {
                          for (let l = 0; l < task.length; l++) {
                            detail.task.push({ vehicle: task[l]["vehicle"], finalApproveTime: task[l]["finalApproveTime"] });
                          }
                        }
                        detail.totalWages.push({ date: date, totalWages: salary });
                        if (!detail.vehicle.includes("TRACTOR")) {
                          detail.vehicle = vehicle;
                        }
                        if (timesInMinutes >= this.basic_minimum_minute) {
                          detail.fullDay += 1;
                        }
                      }
                    }
                  }
                }
              }
            }
            this.getReward();
          }
        );
      }
    );
  }

  getReward() {
    if (this.salaryList.length > 0) {
      let workDays = this.workingDayInMonth;
      for (let i = 0; i < this.salaryList.length; i++) {
        let fullDays = this.salaryList[i]["fullDay"];
        if (fullDays > workDays) {
          let rewardDays = fullDays - workDays;
          let rewardAmount = 0;

          if (this.salaryList[i]["vehicle"].includes("TRACTOR")) {
            if (this.sundayList.length > 4) {
              rewardDays = fullDays - (workDays + this.tractor_reward_days + 1);
            }
            else {
              rewardDays = fullDays - (workDays + this.tractor_reward_days);
            }
            if (this.salaryList[i]["designation"] == "Driver") {
              rewardAmount = this.tractor_reward_amount;
            }
            else if (this.salaryList[i]["designation"] == "Helper") {
              rewardAmount = this.helper_reward_amount;
            }
          }
          if (rewardDays > 0) {
            let designation = this.salaryList[i]["designation"];
            if (rewardAmount == 0) {
              if (designation == "Driver") {
                this.salaryList[i]["rewardAmount"] = rewardDays * this.driver_reward_amount;
              }
              else if (designation == "Helper") {
                this.salaryList[i]["rewardAmount"] = rewardDays * this.helper_reward_amount;
              }
            }
            else {
              this.salaryList[i]["rewardAmount"] = rewardAmount;
            }
          }
        }
      }
      this.getPenalty();
    }
  }

  getPenalty() {
    let dbPath = "Penalties/" + this.selectedYear + "/" + this.selectedMonthName;
    let penaltyInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        penaltyInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let date = keyArray[i];
              let empObject = data[date];
              let empArray = Object.keys(empObject);
              if (empArray.length > 0) {
                for (let j = 0; j < empArray.length; j++) {
                  let empId = empArray[j];
                  let penalty = 0;
                  if (empObject[empId]["amount"] != null) {
                    penalty = Number(empObject[empId]["amount"]);
                  }
                  let detail = this.salaryList.find(item => item.empId == empId);
                  if (detail != undefined) {
                    let totalWages = detail.totalWages;
                    if (empObject[empId]["penaltyType"] == "Absent + Penalty" || empObject[empId]["penaltyType"] == "Absent") {
                      let wagesDetail = totalWages.find(item => item.date == date);
                      if (wagesDetail != undefined) {
                        penalty = penalty + Number(wagesDetail.totalWages);
                      }
                    }
                    detail.penaltyAmount += penalty;
                  }
                }
              }
            }
          }
        }
        this.getTractorPenalty();
      }
    );
  }

  getTractorPenalty() {
    for (let i = 0; i < this.salaryList.length; i++) {
      let task = this.salaryList[i]["task"];
      let designation = this.salaryList[i]["designation"];
      if (designation == "Driver") {
        if (task.length > 0) {
          let isTractor = true;
          for (let j = 0; j < task.length; j++) {
            if (task[j]["vehicle"].includes("TRACTOR")) {
              isTractor = false;
              j = task.length;
            }
          }
          if (isTractor == false) {
            let workDays = this.workingDayInMonth;
            if (this.sundayList.length > 4) {
              workDays += this.tractor_reward_days + 1;
            }
            else {
              workDays += this.tractor_reward_days;
            }
            let workingDays = this.salaryList[i]["fullDay"];
            if (workingDays < workDays) {
              let dayDiff = workDays - workingDays;
              let penalty = dayDiff * Number(this.tractor_reward_amount);
              this.salaryList[i]["penaltyAmount"] = Number(this.salaryList[i]["penaltyAmount"]) + penalty;
            }
          }
        }
      }
    }
    this.getFinalAmount();
  }

  getFinalAmount() {
    let totalSalary = 0;
    for (let i = 0; i < this.salaryList.length; i++) {
      let totalAmount = this.salaryList[i]["totalAmount"];
      let rewardAmount = this.salaryList[i]["rewardAmount"];
      let penaltyAmount = this.salaryList[i]["penaltyAmount"];
      let finalAmount = Number(totalAmount) + Number(rewardAmount) - Number(penaltyAmount);
      this.salaryList[i]["finalAmount"] = finalAmount;
      if (totalAmount < 0) {
        this.salaryList[i]["orderBy"] = 1;
      }
      else {
        this.salaryList[i]["orderBy"] = totalAmount;
      }
      totalSalary += finalAmount;
    }
    this.salaryDetail.totalSalary = totalSalary.toFixed(2);
    this.salaryList = this.salaryList.sort((a, b) =>
      b.orderBy > a.orderBy ? 1 : -1
    );
    $('#divLoader').hide();
  }

  clearDetail() {
    this.salaryDetail.totalSalary = "0.00";
    for (let i = 0; i < this.salaryList.length; i++) {
      let task = [];
      let totalWages = [];
      this.salaryList[i]["totalWages"] = totalWages;
      this.salaryList[i]["task"] = task;
      this.salaryList[i]["vehicle"] = "";
      this.salaryList[i]["fullDay"] = 0;
      this.salaryList[i]["totalAmount"] = 0;
      this.salaryList[i]["rewardAmount"] = 0;
      this.salaryList[i]["penaltyAmount"] = 0;
      this.salaryList[i]["finalAmount"] = 0;
      this.salaryList[i]["workingDays"] = 0;
      this.salaryList[i]["garageDuty"] = 0;
    }
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  changeYearSelection(filterVal: any) {
    this.clearDetail();
    this.selectedYear = filterVal;
    this.selectedMonth = "0";
    $('#ddlMonth').val("0");
  }

  changeMonthSelection(filterVal: any) {
    this.clearDetail();
    this.selectedMonth = filterVal;
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getSalary();
  }

  getSundaysInMonth(m: any, y: any) {
    this.sundayList = [];
    var days = new Date(y, m, 0).getDate();
    var sundays = [8 - (new Date(m + '/01/' + y).getDay())];
    this.sundayList.push({ day: sundays[0] });
    for (var i = sundays[0] + 7; i <= days; i += 7) {
      sundays.push(i);
      this.sundayList.push({ day: i });
    }
  }

  exportexcel() {
    let htmlString = "";
    if (this.salaryList.length > 0) {
      let totalAmount = 0;
      let rewardAmount = 0;
      let penaltyAmount = 0;
      let finalAmount = 0;
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Reward Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Penalty Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Final Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Working Days";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Garage Duty";
      htmlString += "</td>";

      htmlString += "</tr>";
      for (let i = 0; i < this.salaryList.length; i++) {
        totalAmount += this.salaryList[i]["totalAmount"];
        rewardAmount += this.salaryList[i]["rewardAmount"];
        penaltyAmount += this.salaryList[i]["penaltyAmount"];
        finalAmount += this.salaryList[i]["finalAmount"];
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.salaryList[i]["name"] + "(" + this.salaryList[i]["empCode"] + ")";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.salaryList[i]["totalAmount"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.salaryList[i]["rewardAmount"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.salaryList[i]["penaltyAmount"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.salaryList[i]["finalAmount"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.salaryList[i]["workingDays"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.salaryList[i]["garageDuty"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "</tr>";
      // total
      htmlString += "<tr>";
      htmlString += "<td style='text-align:right'><b>Total</b>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += totalAmount;
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += rewardAmount;
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += penaltyAmount;
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += finalAmount;
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "</tr>";
      htmlString += "</table>";

      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlString, 'text/html');
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

      /* generate workbook and add the worksheet */
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      /* save to file */
      let fileName = "Salary-" + this.selectedYear + "-" + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) + ".xlsx";
      XLSX.writeFile(wb, fileName);
    }
  }
}

export class salaryDetail {
  totalSalary: string;
}
