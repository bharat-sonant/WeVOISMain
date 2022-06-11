import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { int } from 'css-line-break/dist/types/Trie';

@Component({
  selector: 'app-salary-calculations',
  templateUrl: './salary-calculations.component.html',
  styleUrls: ['./salary-calculations.component.scss']
})
export class SalaryCalculationsComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";
  ddlRoles = "#ddlRoles";
  divLoader = "#divLoader";
  todayDate: any;
  selectedMonth: any;
  selectedMonthName: any;
  selectedYear: any;
  yearList: any[] = [];
  fireStoragePath: any;
  activeEmployeeCount = 0;
  jsonObject: any;
  salaryList: any[];
  monthDays: any;
  zoneList: any[];
  employeeIds: any[];
  employees: any;
  storagePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity();

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.getYear();
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

  calculate() {
    $(this.divLoader).show();
    this.activeEmployeeCount = 0;
    this.jsonObject = {};
    this.httpService.get(this.storagePath + "%2FEmployees.json?alt=media").subscribe(data => {
      if (data != null) {
        this.employeeIds = Object.keys(data);
        console.log("Length :- " + this.employeeIds.length);
        this.employees = data;
        this.setEmployeeData(0);
      }
    });
  }

  setEmployeeData(index: int) {
    let employeeId = this.employeeIds[index];
    console.log(Number(employeeId));
    let designationId = this.employees[employeeId]["GeneralDetails"]["designationId"];
    if (designationId == "5" || designationId == "6") {
      let lastEmpId = this.employeeIds[this.employeeIds.length - 1];
      if (Number(employeeId) <= Number(lastEmpId) && this.activeEmployeeCount <= 2) {
        this.activeEmployeeCount++;
        this.jsonObject[employeeId] = {
          name: this.employees[employeeId]["GeneralDetails"]["name"],
          empCode: this.employees[employeeId]["GeneralDetails"]["empCode"],
          designation: this.employees[employeeId]["GeneralDetails"]["designation"],
          day1: []
        };


        index++
        this.setEmployeeData(index);


      }
      else {
        let filePath = "/SalarySummary/" + this.selectedYear + "/";
        let fileName = this.selectedMonthName + ".json";
        this.commonService.saveJsonFile(this.jsonObject, fileName, filePath).then((response) => {
          this.getSalaryList();
        });

      }


    } else {
      index++;
      this.setEmployeeData(index);
    }
  }


  /*
    setEmployeeSalary(employeeId: int, lastemployeeId: int) {
  
      this.monthDays = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
  
      if (Number(this.selectedMonth) == Number(this.todayDate.split('-')[1]) && this.selectedYear == this.todayDate.split('-')[0]) {
        this.monthDays = this.todayDate.split("-")[2];
      }
  
      this.db.object("Employees/" + employeeId + "/GeneralDetails/status").valueChanges().subscribe(
        empStatus => {
          if (empStatus != null && empStatus == 1) {
            this.db.object("Employees/" + employeeId + "/GeneralDetails").valueChanges().subscribe(
              empGeneralDetails => {
                //if (employeeId <= lastemployeeId && this.activeEmployeeCount <= 30) {
                if (employeeId <= lastemployeeId) {
  
                  if (empGeneralDetails["designationId"] == "5" || empGeneralDetails["designationId"] == "6") {
                    this.activeEmployeeCount++;
                    console.log("Details => " + employeeId + " : " + empGeneralDetails["name"]);
                    // 5 => driver ||  => Helper
                    this.jsonObject[employeeId] = { name: empGeneralDetails["name"], empCode: empGeneralDetails["empCode"], designation: this.getDesignation(Number(empGeneralDetails["designationId"])), day1: [] };
  */
  // get Day 1 work Details


  /*
  for (let i = 1; i <= 1; i++) {

    let monthDate = this.selectedYear + '-' + (this.selectedMonth < 10 ? '0' : '') + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
    let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/" + employeeId;
    let dailyWorkInstance = this.db.object(dbPath).valueChanges().subscribe(
      dailyWorkData => {
        dailyWorkInstance.unsubscribe();
        if (dailyWorkData != null) {
          let day = "day" + Number(monthDate.split('-')[2]);
          let workDetail = [];
          for (let j = 1; j <= 5; j++) {
            if (dailyWorkData["task" + j] != null) {
              let ward = dailyWorkData["task" + j]["task"];
              let wages = 0;
              if (dailyWorkData["task" + j]["task-wages"] != null) {
                wages = dailyWorkData["task" + j]["task-wages"];
              }

              workDetail.push({ ward: ward, wages: wages, percentage: 0 });
              let zoneDetail = this.zoneList.find(item => item.zoneNo == ward);
              if (zoneDetail != undefined) {
                let dbPath = "WasteCollectionInfo/" + ward + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/Summary/workPercentage";
                let workPercentageInstance = this.db.object(dbPath).valueChanges().subscribe(
                  workPercentageData => {
                    workPercentageInstance.unsubscribe();
                    if (workPercentageData != null) {
                      for (let i = 0; i < workDetail.length; i++) {
                        if (workDetail[i]["ward"] == ward) {
                          workDetail[i]["percentage"] = Number(workPercentageData);
                        }
                      }
                    }
                    this.jsonObject[employeeId][day] = workDetail;
                  });
              }
              else {
                this.jsonObject[employeeId][day] = workDetail;
              }
            }
 
          }
        }
      });
  
}*/

  /*
                         
                } else {
                  let filePath = "/SalarySummary/" + this.selectedYear + "/";
                  let fileName = this.selectedMonthName + ".json";
                  this.commonService.saveJsonFile(this.jsonObject, fileName, filePath);
                  setTimeout(() => {
                    this.getSalaryList();
  
                  }, 200);
                }
              });
  
          }
          else {
            this.setEmployeeSalary(employeeId + 1, lastemployeeId);
          }
        });
        */

  getSalaryList() {
    this.salaryList = [];
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSalarySummary%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let salaryInstance = this.httpService.get(path).subscribe(data => {
      salaryInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let employeeId = keyArray[i];
          let detail = data[employeeId]["day1"];
          let totalWeges = 0;
          for (let i = 0; i < detail.length; i++) {
            if (detail[i]["wages"] != null) {
              totalWeges += Number(detail[i]["wages"]);
            }
          }

          this.salaryList.push({ employeeId: employeeId, name: data[employeeId]["name"], empCode: data[employeeId]["empCode"], designation: data[employeeId]["designation"], day1: data[employeeId]["day1"], totalDaySalary1: totalWeges });
        }
        $(this.divLoader).hide();
      }
    });

  }
}




