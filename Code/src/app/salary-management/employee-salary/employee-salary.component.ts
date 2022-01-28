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


  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.getSetting();
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.employeeList = [];
    this.salaryList = [];
    this.allSalaryList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonth = "12";
    this.selectedYear = "2021";
    this.getSundaysInMonth(this.selectedMonth, this.selectedYear);
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
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
              let designation = "";
              if (data[i]["GeneralDetails"]["designationId"] == "5") {
                designation = "Driver";
              }
              else if (data[i]["GeneralDetails"]["designationId"] == "6") {
                designation = "Helper";
              }
              let task = [];
              let totalWages = [];
              salaryList.push({ empId: empId, empCode: empCode, name: name, totalWages: totalWages, task: task, vehicle: "", designation: designation, fullDay: 0, totalAmount: 0, rewardAmount: 0, penaltyAmount: 0, finalAmount: 0, workingDays: 0, garageDuty: 0 });
            }
            this.salaryList = this.commonService.transformNumeric(salaryList, "empCode");
          }
          this.getSalary();
        }
      }
    );
  }

  getSalary() {
    this.monthSalaryList = [];
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
                  for (let k = 1; k < 5; k++) {
                    if (empObject[empId]["task" + k] != null) {
                      vehicle = empObject[empId]["task" + k]["vehicle"];
                      if (empObject[empId]["task" + k]["final-approved-time-in-minute"] != null) {
                        timesInMinutes += Number(empObject[empId]["task" + k]["final-approved-time-in-minute"]);
                      }
                      taskCount++;
                      if (empObject[empId]["task" + k]["task"] == "GarageWork"/* && empObject[empId]["task" + k]["final-approved-time-in-minute"]=="360"*/) {
                        garageDays++;
                        if (empId == "160") {
                          console.log(date);
                        }
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

  getReward() {
    if (this.salaryList.length > 0) {
      let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
      let workDays = days - this.sundayList.length;
      for (let i = 0; i < this.salaryList.length; i++) {
        let fullDays = this.salaryList[i]["fullDay"];
        if (fullDays > workDays) {
          let rewardDays = fullDays - workDays;
          let rewardAmount = 0;
          if (this.salaryList[i]["vehicle"].includes("TRACTOR")) {
            rewardDays = fullDays - workDays - 2;
            rewardAmount = this.tractor_reward_amount;
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
        this.getFinalAmount();
      }
    );
  }

  getFinalAmount() {
    let totalSalary = 0;
    for (let i = 0; i < this.salaryList.length; i++) {
      let totalAmount = this.salaryList[i]["totalAmount"];
      let rewardAmount = this.salaryList[i]["rewardAmount"];
      let penaltyAmount = this.salaryList[i]["penaltyAmount"];
      let finalAmount = Number(totalAmount) + Number(rewardAmount) - Number(penaltyAmount);
      this.salaryList[i]["finalAmount"] = finalAmount;
      totalSalary += finalAmount;
    }
    this.salaryDetail.totalSalary = totalSalary.toFixed(2);
  }


  getSundaysInMonth(m: any, y: any) {
    this.sundayList = [];
    var days = new Date(y, m, 0).getDate();
    var sundays = [8 - (new Date(m + '/01/' + y).getDay())];
    this.sundayList.push({ day: sundays[0] });
    for (var i = sundays[0] + 7; i < days; i += 7) {
      sundays.push(i);
      this.sundayList.push({ day: i });
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

  }

  changeMonthSelection(filterVal: any) {

  }

  filterData() {

  }

  exportexcel() {

  }

}

export class salaryDetail {
  totalSalary: string;
}
