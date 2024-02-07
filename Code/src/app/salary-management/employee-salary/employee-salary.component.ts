import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';
import { AngularFirestore } from "@angular/fire/firestore";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-employee-salary',
  templateUrl: './employee-salary.component.html',
  styleUrls: ['./employee-salary.component.scss']
})
export class EmployeeSalaryComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, private besuh: BackEndServiceUsesHistoryService, private modalService: NgbModal, private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  sundayList: any[];
  designationList: any[];
  salaryList: any[];
  allSalaryList: any[];
  arrayBuffer: any;
  first_sheet_name: any;
  fireStoragePath: any;
  salaryDetail: salaryDetail = {
    totalSalary: "0.00",
    remark: ""
  }
  // setting data
  basic_minimum_minute: any;
  driver_reward_amount: any;
  helper_reward_amount: any;
  tractor_reward_amount: any;
  tractor_reward_days: any;
  workingDayInMonth: any;
  fireStoreCity: any;
  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";
  ddlUser = "#ddlUser";
  ddlDesignation = "#ddlDesignation";
  divLoader = "#divLoader";
  key = "#key";
  serviceName = "employee-salary";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Salary-Management-Driver","Employee-Salary",localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStoragePath = this.commonService.fireStoragePath;
    this.toDayDate = this.commonService.setTodayDate();
    let date = this.commonService.getPreviousMonth(this.toDayDate, 1);
    this.setDefaultValues();
    this.getYear();
    this.selectedMonth = date.split('-')[1];
    this.selectedYear = date.split('-')[0];
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getSetting();
  }

  setDefaultValues() {
    this.yearList = [];
    this.designationList = [];
    this.salaryList = [];
    this.allSalaryList = [];
    this.driver_reward_amount = 0;
    this.helper_reward_amount = 0;
    this.tractor_reward_amount = 0;
    this.tractor_reward_days = 0;
    this.basic_minimum_minute = 0;
    this.workingDayInMonth = 0;
  }

  getSetting() {
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSettings%2FSalary.json?alt=media";
    let salarySettingInstance = this.httpService.get(path).subscribe(data => {
      salarySettingInstance.unsubscribe();
      this.driver_reward_amount = data["driver_reward_amount"];
      this.helper_reward_amount = data["helper_reward_amount"];
      this.tractor_reward_amount = data["tractor_reward_amount"];
      this.tractor_reward_days = data["tractor_reward_days"];
      this.basic_minimum_minute = Number(data["basic_minimum_hour"]) * 60;
      this.getEmployee();
    });
  }

  getEmployee() {
    $(this.divLoader).show();
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let employeeInstance = this.httpService.get(path).subscribe(data => {
      employeeInstance.unsubscribe();
      if (data != null) {
        let salaryList = [];
        let jsonData = JSON.stringify(data);
        let list = JSON.parse(jsonData).filter(item => item.empType == 2);
        if (list.length > 0) {
          for (let i = 0; i < list.length; i++) {
            let empId = list[i]["empId"];
            let empCode = list[i]["empCode"];
            let name = list[i]["name"];
            let doj = list[i]["doj"];
            let email = list[i]["email"];
            let designation = list[i]["designation"];
            let accountNo = null;
            let ifsc = "";
            let isShow = 0;
            let task = [];
            let totalWages = [];

            if (list[i]["accountNo"] != "" && list[i]["accountNo"] != null) {
              accountNo = list[i]["accountNo"];
            }
            else {
              isShow = 1;
            }
            if (list[i]["ifsc"] != "") {
              ifsc = list[i]["ifsc"];
            }
            let salaryType = "salaried";
            if (list[i]["salaryType"] != null) {
              salaryType = list[i]["salaryType"];
            }
            if (salaryType == "salaried") {
              salaryList.push({ empId: empId, empCode: empCode, name: name, email: email, designation: designation, status: list[i]["status"], accountNo: accountNo, ifsc: ifsc, modifyBy: list[i]["modifyBy"], modifyDate: list[i]["modifyDate"], isLock: list[i]["isLock"], empType: list[i]["empType"], totalWages: totalWages, task: task, vehicle: "", fullDay: 0, totalAmount: 0, rewardAmount: 0, penaltyAmount: 0, finalAmount: 0, workingDays: 0, garageDuty: 0, orderBy: 0, uploadedSalary: 0, hold: 0, isShow: isShow, transfered: 0 });
            }
          }
          this.designationList = this.commonService.transformNumeric(this.designationList, "designation");
          this.allSalaryList = salaryList.sort((a, b) => Number(b.empId) < Number(a.empId) ? 1 : -1);
          this.getRoles();
          this.getSalary();
        }
      }
    });
  }

  getRoles() {
    let list = this.allSalaryList.map(item => item.designation)
      .filter((value, index, self) => self.indexOf(value) === index);
    for (let i = 0; i < list.length; i++) {
      this.designationList.push({ designation: list[i] });
    }
  }

  getSalary() {
    
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getSalary");
    $(this.divLoader).show();
    this.getUploadedSalary();
    this.getHoldSalary();
    this.getAccountIssue();
    this.getSundaysInMonth(this.selectedMonth, this.selectedYear);

    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDefaults%2FWorkingDayInMonth.json?alt=media";
    let workingDayInstance = this.httpService.get(path).subscribe(data => {
      workingDayInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let monthName = keyArray[i];
            if (monthName == this.selectedMonthName) {
              this.workingDayInMonth = Number(data[monthName]);
            }
          }
        }

        let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName;
        let workInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            workInstance.unsubscribe();
            if (data != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getSalary", data);
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
                      for (let k = 1; k <= 5; k++) {
                        if (empObject[empId]["task" + k] != null) {
                          vehicle = empObject[empId]["task" + k]["vehicle"];
                          if (empObject[empId]["task" + k]["final-approved-time-in-minute"] != null) {
                            timesInMinutes += Number(empObject[empId]["task" + k]["final-approved-time-in-minute"]);
                            task.push({ vehicle: vehicle, finalApproveTime: empObject[empId]["task" + k]["final-approved-time-in-minute"] });
                          }
                          taskCount++;
                          if (empObject[empId]["task" + k]["task"] == "GarageWork") {
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

                      let detail = this.allSalaryList.find(item => item.empId == empId);
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
    });
  }

  getUploadedSalary() {
    this.dbFireStore.collection(this.fireStoreCity + "/EmployeeUpdatedSalary/" + this.selectedYear + "/" + this.selectedMonthName + "/data").get().subscribe(
      (ss) => {
        ss.forEach((doc) => {
          let empId = doc.id;
          let uploadedSalary = doc.data()["uploadedSalary"];
          this.updateSalaryList(empId, uploadedSalary, "uploadedSalary");
        });
      });
  }

  getHoldSalary() {
    const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeHoldSalary%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FholdSalary.json?alt=media";
    let holdInstance = this.httpService.get(path).subscribe(data => {
      holdInstance.unsubscribe();
      let keyArray = Object.keys(data);
      if (keyArray.length > 0) {
        for (let i = 0; i < keyArray.length; i++) {
          let empId = keyArray[i];
          let empDetail = this.allSalaryList.find(item => item.empId == empId);
          if (empDetail != undefined) {
            empDetail.hold = 1;
          }
        }
      }
    });
  }

  getTransferedSalary() {
    if (this.allSalaryList.length > 0) {
      for (let i = 0; i < this.allSalaryList.length; i++) {
        let empId = this.allSalaryList[i]["empId"];
        const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeSalaryTransaction%2F" + this.selectedYear + "%2F" + empId + ".json?alt=media";
        let transferredInstance = this.httpService.get(path).subscribe(data => {
          transferredInstance.unsubscribe();
          if (data != null) {
            let empTransactionObj = JSON.parse(JSON.stringify(data));
            let transactionObj = empTransactionObj[this.selectedMonthName];
            let keyArray = Object.keys(transactionObj);
            let transferredAmount = 0;
            for (let j = 0; j < keyArray.length; j++) {
              let utrNumber = keyArray[j];
              if (transactionObj[utrNumber]["amount"] != null) {
                transferredAmount += Number(transactionObj[utrNumber]["amount"]);
              }
            }
            this.updateSalaryList(empId, transferredAmount, "transfered");
          }
        });
        if (i == this.allSalaryList.length - 1) {
          this.getFinalAmount();
        }
      }
    }
  }

  updateSalaryList(empId: any, updateValue: any, type: any) {
    let detail = this.allSalaryList.find(item => item.empId == empId);
    if (detail != undefined) {
      if (type == "transfered") {
        detail.transfered = updateValue;
      }
      else if (type == "uploadedSalary") {
        detail.uploadedSalary = updateValue;
      }
      else if (type == "accountIssue") {
        detail.remark = updateValue;
        detail.isShow = 1;
      }
    }
    detail = this.salaryList.find(item => item.empId == empId);
    if (detail != undefined) {
      if (type == "transfered") {
        detail.transfered = updateValue;
      }
      else if (type == "uploadedSalary") {
        detail.uploadedSalary = updateValue;
      }
      else if (type == "accountIssue") {
        detail.remark = updateValue;
        detail.isShow = 1;
      }
    }
  }

  getAccountIssue() {
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccountIssue%2FIssue.json?alt=media";
    let accountIssueInstance = this.httpService.get(path).subscribe(data => {
      accountIssueInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            let remark = data[empId]["remark"];
            this.updateSalaryList(empId, remark, "accountIssue");
          }
        }
      }
    });
  }

  getReward() {
    if (this.allSalaryList.length > 0) {
      let workDays = this.workingDayInMonth;
      for (let i = 0; i < this.allSalaryList.length; i++) {
        let fullDays = this.allSalaryList[i]["fullDay"];
        if (fullDays > workDays) {
          let rewardDays = fullDays - workDays;
          let rewardAmount = 0;

          if (this.allSalaryList[i]["vehicle"].includes("TRACTOR")) {
            if (this.sundayList.length > 4) {
              rewardDays = fullDays - (workDays + this.tractor_reward_days + 1);
            }
            else {
              rewardDays = fullDays - (workDays + this.tractor_reward_days);
            }
            if (this.allSalaryList[i]["designation"] == "Driver") {
              rewardAmount = this.tractor_reward_amount;
            }
            else if (this.allSalaryList[i]["designation"] == "Helper") {
              rewardAmount = this.helper_reward_amount;
            }
          }
          if (rewardDays > 0) {
            let designation = this.allSalaryList[i]["designation"];
            if (rewardAmount == 0) {
              if (designation == "Driver") {
                this.allSalaryList[i]["rewardAmount"] = rewardDays * this.driver_reward_amount;
              }
              else if (designation == "Helper") {
                this.allSalaryList[i]["rewardAmount"] = rewardDays * this.helper_reward_amount;
              }
            }
            else {
              this.allSalaryList[i]["rewardAmount"] = rewardAmount;
            }
          }
        }
      }
      this.getPenalty();
    }
  }

  getPenalty() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getPenalty");
    let dbPath = "Penalties/" + this.selectedYear + "/" + this.selectedMonthName;
    let penaltyInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        penaltyInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPenalty", data);
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
                  let detail = this.allSalaryList.find(item => item.empId == empId);
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
    for (let i = 0; i < this.allSalaryList.length; i++) {
      let task = this.allSalaryList[i]["task"];
      let designation = this.allSalaryList[i]["designation"];
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
            if (this.allSalaryList.length > 4) {
              workDays += this.tractor_reward_days + 1;
            }
            else {
              workDays += this.tractor_reward_days;
            }
            let workingDays = this.allSalaryList[i]["fullDay"];
            if (workingDays < workDays) {
              let dayDiff = workDays - workingDays;
              let penalty = dayDiff * Number(this.tractor_reward_amount);
              this.allSalaryList[i]["penaltyAmount"] = Number(this.allSalaryList[i]["penaltyAmount"]) + penalty;
            }
          }
        }
      }
    }
    this.getTransferedSalary();
  }

  getFinalAmount() {
    let totalSalary = 0;
    for (let i = 0; i < this.allSalaryList.length; i++) {
      let totalAmount = this.allSalaryList[i]["totalAmount"];
      let rewardAmount = this.allSalaryList[i]["rewardAmount"];
      let penaltyAmount = this.allSalaryList[i]["penaltyAmount"];
      let finalAmount = Number(totalAmount) + Number(rewardAmount) - Number(penaltyAmount);
      this.allSalaryList[i]["finalAmount"] = finalAmount;
      if (finalAmount == 0) {
        this.allSalaryList[i]["orderBy"] = 1;
      }
      else {
        this.allSalaryList[i]["orderBy"] = 0;
      }
      totalSalary += finalAmount;
    }

    this.salaryDetail.totalSalary = totalSalary.toFixed(2);
    this.showSalaryList("active", "all");
    $(this.divLoader).hide();
  }

  filterData() {
    let filterVal = $(this.ddlUser).val();
    let designationFilterVal = $(this.ddlDesignation).val();
    this.showSalaryList(filterVal, designationFilterVal);
  }

  showSalaryList(status: any, designation: any) {
    this.salaryList = [];
    for (let i = 0; i < this.allSalaryList.length; i++) {
      if (status == "all") {
        if (this.allSalaryList[i]["totalAmount"] != 0) {
          this.salaryList.push({ empId: this.allSalaryList[i]["empId"], empCode: this.allSalaryList[i]["empCode"], name: this.allSalaryList[i]["name"], email: this.allSalaryList[i]["email"], accountNo: this.allSalaryList[i]["accountNo"], ifsc: this.allSalaryList[i]["ifsc"], doj: this.allSalaryList[i]["doj"], status: this.allSalaryList[i]["status"], totalWages: this.allSalaryList[i]["totalWages"], task: this.allSalaryList[i]["task"], vehicle: this.allSalaryList[i]["vehicle"], designation: this.allSalaryList[i]["designation"], fullDay: this.allSalaryList[i]["fullDay"], totalAmount: this.allSalaryList[i]["totalAmount"], rewardAmount: this.allSalaryList[i]["rewardAmount"], penaltyAmount: this.allSalaryList[i]["penaltyAmount"], finalAmount: this.allSalaryList[i]["finalAmount"], workingDays: this.allSalaryList[i]["workingDays"], garageDuty: this.allSalaryList[i]["garageDuty"], orderBy: this.allSalaryList[i]["orderBy"], uploadedSalary: this.allSalaryList[i]["uploadedSalary"], hold: this.allSalaryList[i]["hold"], remark: this.allSalaryList[i]["remark"], isShow: this.allSalaryList[i]["isShow"], transfered: this.allSalaryList[i]["transfered"] });
        }
      }
      else if (status == "active") {
        if (this.allSalaryList[i]["status"] == "1" && this.allSalaryList[i]["totalAmount"] != 0) {
          this.salaryList.push({ empId: this.allSalaryList[i]["empId"], empCode: this.allSalaryList[i]["empCode"], name: this.allSalaryList[i]["name"], email: this.allSalaryList[i]["email"], accountNo: this.allSalaryList[i]["accountNo"], ifsc: this.allSalaryList[i]["ifsc"], doj: this.allSalaryList[i]["doj"], status: this.allSalaryList[i]["status"], totalWages: this.allSalaryList[i]["totalWages"], task: this.allSalaryList[i]["task"], vehicle: this.allSalaryList[i]["vehicle"], designation: this.allSalaryList[i]["designation"], fullDay: this.allSalaryList[i]["fullDay"], totalAmount: this.allSalaryList[i]["totalAmount"], rewardAmount: this.allSalaryList[i]["rewardAmount"], penaltyAmount: this.allSalaryList[i]["penaltyAmount"], finalAmount: this.allSalaryList[i]["finalAmount"], workingDays: this.allSalaryList[i]["workingDays"], garageDuty: this.allSalaryList[i]["garageDuty"], orderBy: this.allSalaryList[i]["orderBy"], uploadedSalary: this.allSalaryList[i]["uploadedSalary"], hold: this.allSalaryList[i]["hold"], remark: this.allSalaryList[i]["remark"], isShow: this.allSalaryList[i]["isShow"], transfered: this.allSalaryList[i]["transfered"] });
        }
      }
      else if (status == "inactive") {
        if (this.allSalaryList[i]["status"] != "1" && this.allSalaryList[i]["totalAmount"] != 0) {
          this.salaryList.push({ empId: this.allSalaryList[i]["empId"], empCode: this.allSalaryList[i]["empCode"], name: this.allSalaryList[i]["name"], email: this.allSalaryList[i]["email"], accountNo: this.allSalaryList[i]["accountNo"], ifsc: this.allSalaryList[i]["ifsc"], doj: this.allSalaryList[i]["doj"], status: this.allSalaryList[i]["status"], totalWages: this.allSalaryList[i]["totalWages"], task: this.allSalaryList[i]["task"], vehicle: this.allSalaryList[i]["vehicle"], designation: this.allSalaryList[i]["designation"], fullDay: this.allSalaryList[i]["fullDay"], totalAmount: this.allSalaryList[i]["totalAmount"], rewardAmount: this.allSalaryList[i]["rewardAmount"], penaltyAmount: this.allSalaryList[i]["penaltyAmount"], finalAmount: this.allSalaryList[i]["finalAmount"], workingDays: this.allSalaryList[i]["workingDays"], garageDuty: this.allSalaryList[i]["garageDuty"], orderBy: this.allSalaryList[i]["orderBy"], uploadedSalary: this.allSalaryList[i]["uploadedSalary"], hold: this.allSalaryList[i]["hold"], remark: this.allSalaryList[i]["remark"], isShow: this.allSalaryList[i]["isShow"], transfered: this.allSalaryList[i]["transfered"] });
        }
      }
    }
    for (let i = 0; i < this.allSalaryList.length; i++) {
      if (status == "all") {
        if (this.allSalaryList[i]["totalAmount"] == 0) {
          this.salaryList.push({ empId: this.allSalaryList[i]["empId"], empCode: this.allSalaryList[i]["empCode"], name: this.allSalaryList[i]["name"], email: this.allSalaryList[i]["email"], accountNo: this.allSalaryList[i]["accountNo"], ifsc: this.allSalaryList[i]["ifsc"], doj: this.allSalaryList[i]["doj"], status: this.allSalaryList[i]["status"], totalWages: this.allSalaryList[i]["totalWages"], task: this.allSalaryList[i]["task"], vehicle: this.allSalaryList[i]["vehicle"], designation: this.allSalaryList[i]["designation"], fullDay: this.allSalaryList[i]["fullDay"], totalAmount: this.allSalaryList[i]["totalAmount"], rewardAmount: this.allSalaryList[i]["rewardAmount"], penaltyAmount: this.allSalaryList[i]["penaltyAmount"], finalAmount: this.allSalaryList[i]["finalAmount"], workingDays: this.allSalaryList[i]["workingDays"], garageDuty: this.allSalaryList[i]["garageDuty"], orderBy: this.allSalaryList[i]["orderBy"], uploadedSalary: this.allSalaryList[i]["uploadedSalary"], hold: this.allSalaryList[i]["hold"], remark: this.allSalaryList[i]["remark"], isShow: this.allSalaryList[i]["isShow"], transfered: this.allSalaryList[i]["transfered"] });
        }
      }
      else if (status == "active") {
        if (this.allSalaryList[i]["status"] == "1" && this.allSalaryList[i]["totalAmount"] == 0) {
          this.salaryList.push({ empId: this.allSalaryList[i]["empId"], empCode: this.allSalaryList[i]["empCode"], name: this.allSalaryList[i]["name"], email: this.allSalaryList[i]["email"], accountNo: this.allSalaryList[i]["accountNo"], ifsc: this.allSalaryList[i]["ifsc"], doj: this.allSalaryList[i]["doj"], status: this.allSalaryList[i]["status"], totalWages: this.allSalaryList[i]["totalWages"], task: this.allSalaryList[i]["task"], vehicle: this.allSalaryList[i]["vehicle"], designation: this.allSalaryList[i]["designation"], fullDay: this.allSalaryList[i]["fullDay"], totalAmount: this.allSalaryList[i]["totalAmount"], rewardAmount: this.allSalaryList[i]["rewardAmount"], penaltyAmount: this.allSalaryList[i]["penaltyAmount"], finalAmount: this.allSalaryList[i]["finalAmount"], workingDays: this.allSalaryList[i]["workingDays"], garageDuty: this.allSalaryList[i]["garageDuty"], orderBy: this.allSalaryList[i]["orderBy"], uploadedSalary: this.allSalaryList[i]["uploadedSalary"], hold: this.allSalaryList[i]["hold"], remark: this.allSalaryList[i]["remark"], isShow: this.allSalaryList[i]["isShow"], transfered: this.allSalaryList[i]["transfered"] });
        }
      }
      else if (status == "inactive") {
        if (this.allSalaryList[i]["status"] != "1" && this.allSalaryList[i]["totalAmount"] == 0) {
          this.salaryList.push({ empId: this.allSalaryList[i]["empId"], empCode: this.allSalaryList[i]["empCode"], name: this.allSalaryList[i]["name"], email: this.allSalaryList[i]["email"], accountNo: this.allSalaryList[i]["accountNo"], ifsc: this.allSalaryList[i]["ifsc"], doj: this.allSalaryList[i]["doj"], status: this.allSalaryList[i]["status"], totalWages: this.allSalaryList[i]["totalWages"], task: this.allSalaryList[i]["task"], vehicle: this.allSalaryList[i]["vehicle"], designation: this.allSalaryList[i]["designation"], fullDay: this.allSalaryList[i]["fullDay"], totalAmount: this.allSalaryList[i]["totalAmount"], rewardAmount: this.allSalaryList[i]["rewardAmount"], penaltyAmount: this.allSalaryList[i]["penaltyAmount"], finalAmount: this.allSalaryList[i]["finalAmount"], workingDays: this.allSalaryList[i]["workingDays"], garageDuty: this.allSalaryList[i]["garageDuty"], orderBy: this.allSalaryList[i]["orderBy"], uploadedSalary: this.allSalaryList[i]["uploadedSalary"], hold: this.allSalaryList[i]["hold"], remark: this.allSalaryList[i]["remark"], isShow: this.allSalaryList[i]["isShow"], transfered: this.allSalaryList[i]["transfered"] });
        }
      }
    }
    if (designation != "all") {
      this.salaryList = this.salaryList.filter(item => item.designation == designation);
    }
  }

  clearDetail() {
    this.salaryDetail.totalSalary = "0.00";
    this.salaryList = [];
    for (let i = 0; i < this.allSalaryList.length; i++) {
      let task = [];
      let totalWages = [];
      this.allSalaryList[i]["totalWages"] = totalWages;
      this.allSalaryList[i]["task"] = task;
      this.allSalaryList[i]["vehicle"] = "";
      this.allSalaryList[i]["fullDay"] = 0;
      this.allSalaryList[i]["totalAmount"] = 0;
      this.allSalaryList[i]["rewardAmount"] = 0;
      this.allSalaryList[i]["penaltyAmount"] = 0;
      this.allSalaryList[i]["finalAmount"] = 0;
      this.allSalaryList[i]["workingDays"] = 0;
      this.allSalaryList[i]["garageDuty"] = 0;
      this.allSalaryList[i]["uploadedSalary"] = 0;
      this.allSalaryList[i]["hold"] = 0;
      this.allSalaryList[i]["transfered"] = 0;
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
    $(this.ddlMonth).val("0");
    $(this.ddlUser).val("active");
    $(this.ddlDesignation).val("all");
    let element = <HTMLInputElement>document.getElementById("chkAll");
    element.checked = false;
  }

  changeMonthSelection(filterVal: any) {
    this.clearDetail();
    this.selectedMonth = filterVal;
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    $(this.ddlUser).val("active");
    $(this.ddlDesignation).val("all");
    let element = <HTMLInputElement>document.getElementById("chkAll");
    element.checked = false;
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

  downloadSalary() {
    if (this.salaryList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "EmployeeId";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Salary";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.salaryList.length; i++) {
        if (this.salaryList[i]["finalAmount"] != 0) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += this.salaryList[i]["empCode"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.salaryList[i]["empCode"] + " " + this.salaryList[i]["name"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.salaryList[i]["finalAmount"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }
      }
      htmlString += "</table>";
      let fileName = "Data-Salary-" + this.selectedYear + "-" + this.selectedMonthName + ".xlsx";
      this.exportExcel(htmlString, fileName);
    }
  }

  uploadSalary() {
    let element = <HTMLInputElement>document.getElementById("fileUpload");
    if (element.files[0] == null) {
      this.commonService.setAlertMessage("error", "Please select excel !!!");
      $('#fileUpload').val("");
      return;
    }
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      $('#fileUpload').val("");
      return;
    }
    if (this.selectedMonth == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      $('#fileUpload').val("");
      return;
    }
    let file = element.files[0];
    let fileName = file.name;
    let fileExt = fileName.split('.');
    if (fileExt[fileExt.length - 1] != "xlsx" && fileExt[fileExt.length - 1] != "xls") {
      this.commonService.setAlertMessage("error", "Please upload only excel file !!!");
      $('#fileUpload').val("");
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
      this.saveData(fileList);
    }
  }

  saveData(fileList: any) {
    let errorData = [];
    if (fileList.length > 0) {
      if (fileList[0]["EmployeeId"] == undefined) {
        this.commonService.setAlertMessage("error", "Please check EmployeeId column in excel !!!");
        $('#fileUpload').val("");
        return;
      }
      if (fileList[0]["Salary"] == undefined) {
        this.commonService.setAlertMessage("error", "Please check Salary column in excel !!!");
        $('#fileUpload').val("");
        return;
      }
      for (let i = 0; i < fileList.length; i++) {
        let empCode = fileList[i]["EmployeeId"];
        let salary = fileList[i]["Salary"];
        let name = fileList[i]["Name"];
        let remark = "";
        if (empCode != undefined && salary != undefined) {
          let isCorrect = true;
          let chkSalary = Number(salary);
          if (Number.isNaN(chkSalary)) {
            isCorrect = false;
            remark = "Salary is not in correct format.";
          }
          if (isCorrect == true) {
            let detail = this.allSalaryList.find(item => item.empCode == empCode);
            if (detail != undefined) {
              let checkName = empCode + " " + detail.name.trim();
              if (checkName == name.trim()) {
                let systemSalary = detail.finalAmount;
                detail.uploadedSalary = salary;
                const data = {
                  systemSalary: systemSalary,
                  uploadedSalary: salary
                }
                this.dbFireStore.doc(this.fireStoreCity + "/EmployeeUpdatedSalary/" + this.selectedYear + "/" + this.selectedMonthName + "/data/" + detail.empId + "").set(data);
                detail = this.salaryList.find(item => item.empCode == empCode);
                if (detail != undefined) {
                  detail.uploadedSalary = salary;
                }
              }
              else {
                remark = "Name is not correct for this EmployeeId";
                errorData.push({ empCode: empCode, salary: salary, name: name, remark: remark });
              }
            }
            else {
              remark = "EmployeeId not in list.";
              errorData.push({ empCode: empCode, salary: salary, name: name, remark: remark });
            }
          }
          else {
            errorData.push({ empCode: empCode, salary: salary, name: name, remark: remark });
          }
        }
      }

      if (errorData.length > 0) {
        let htmlString = "";
        htmlString = "<table>";
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "EmployeeId";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Name";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Salary";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Remark";
        htmlString += "</td>";
        htmlString += "</tr>";
        for (let i = 0; i < errorData.length; i++) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += errorData[i]["empCode"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += errorData[i]["name"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += errorData[i]["salary"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += errorData[i]["remark"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }

        htmlString += "</table>";

        let fileName = "Error-Data-Salary.xlsx";
        this.exportExcel(htmlString, fileName);
      }
      else {
        this.commonService.setAlertMessage("success", "Salary uploaded successfully !!!");
        $('#fileUpload').val("");
      }
    }
  }

  checkAll() {
    let element = <HTMLInputElement>document.getElementById("chkAll");
    if (element.checked == true) {
      for (let i = 0; i < this.salaryList.length; i++) {
        if (this.salaryList[i]["uploadedSalary"] != 0) {
          if (this.salaryList[i]["isShow"] != 1 && this.salaryList[i]["hold"] != 1) {
            let elementChk = <HTMLInputElement>document.getElementById("chk" + this.salaryList[i]["empId"]);
            elementChk.checked = true;
          }
        }
      }
    }
    else {
      for (let i = 0; i < this.salaryList.length; i++) {
        let elementChk = <HTMLInputElement>document.getElementById("chk" + this.salaryList[i]["empId"]);
        elementChk.checked = false;
      }
    }
  }

  updateAccountDetail() {
    let isChecked = false;
    let checkArray = [];
    for (let i = 0; i < this.salaryList.length; i++) {
      let empId = this.salaryList[i]["empId"];
      let element = <HTMLInputElement>document.getElementById("chk" + empId);
      if (element.checked == true) {
        isChecked = true;
        checkArray.push({ empId: empId });
      }
    }
    if (isChecked == false) {
      this.commonService.setAlertMessage("error", "Please check at least 1 employee for salary !!!");
      return;
    }
    $(this.divLoader).show();
    for (let i = 0; i < checkArray.length; i++) {
      let empId = checkArray[i]["empId"];
      let dbPath = "Employees/" + empId + "/BankDetails/AccountDetails";
      let instance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          instance.unsubscribe();
          let accountNo = null;
          let ifsc = "";
          if (data != null) {
            if (data["accountNumber"] != null) {
              accountNo = data["accountNumber"];
            }
            if (data["ifsc"] != null) {
              ifsc = data["ifsc"];
            }
            let detail = this.allSalaryList.find(item => item.empId == empId);
            if (detail != undefined) {
              detail.accountNo = accountNo;
              detail.ifsc = ifsc;
            }
            detail = this.salaryList.find(item => item.empId == empId);
            if (detail != undefined) {
              detail.accountNo = accountNo;
              detail.ifsc = ifsc;
            }
          }
          if (i == checkArray.length - 1) {
            let filePath = "/EmployeeAccount/";
            this.commonService.saveJsonFile(this.allSalaryList, "accountDetail.json", filePath);
            let time = this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond();
            const obj = { lastUpdate: time };
            this.commonService.saveJsonFile(obj, "LastUpdate.json", filePath);
            this.downloadNEFTSalary();
          }
        }
      );
    }
  }

  downloadNEFTSalary() {
    let htmlString = "";
    if (this.salaryList.length > 0) {
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "EmployeeCode";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Beneficiary Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Beneficiary Account Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "IFSC";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Transaction Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Debit Account No";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Transaction Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Currency";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Beneficiary Email ID";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Remarks";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.salaryList.length; i++) {
        let empId = this.salaryList[i]["empId"];
        let element = <HTMLInputElement>document.getElementById("chk" + empId);
        if (element.checked == true) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += this.salaryList[i]["empCode"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.salaryList[i]["empCode"] + " " + this.salaryList[i]["name"];
          htmlString += "</td>";
          htmlString += "<td t='s'>";
          htmlString += this.salaryList[i]["accountNo"];
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.salaryList[i]["ifsc"].includes("IDFB")) {
          }
          else {
            htmlString += this.salaryList[i]["ifsc"];
          }
          if (this.salaryList[i]["ifsc"].includes("IDFB")) {
            htmlString += "<td>IFT";
          }
          else if (this.salaryList[i]["ifsc"] == "") {
            htmlString += "<td>IFT";
          }
          else {
            htmlString += "<td>NEFT";
          }
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += "</td>";
          htmlString += "<td t='s'>";
          htmlString += this.toDayDate.split('-')[2] + "/" + this.toDayDate.split('-')[1] + "/" + this.toDayDate.split('-')[0];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.salaryList[i]["uploadedSalary"];
          htmlString += "</td>";
          htmlString += "<td>INR";
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.salaryList[i]["email"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += "</td>";
          htmlString += "</tr>";
        }
      }
      htmlString += "</table>";

      $(this.divLoader).hide();
      let fileName = "Salary-" + this.selectedYear + "-" + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) + ".xlsx";
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

  openModel(content: any, id: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 250;
    let width = 400;

    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.key).val(id);

    let userDetail = this.allSalaryList.find((item) => item.empId == id);
    if (userDetail != undefined) {
      if (userDetail.accountNo == null) {
        this.salaryDetail.remark = "This employee have not account detail.";
      }
      if (userDetail.remark != null) {
        this.salaryDetail.remark = userDetail.remark;
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }
}

export class salaryDetail {
  totalSalary: string;
  remark: string;
}
