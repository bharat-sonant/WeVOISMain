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
    this.activeEmployeeCount = 0;
    $(this.divLoader).show();
    let dbPath = "Employees/lastEmpId";
    this.db.object(dbPath).valueChanges().subscribe(
      lastEmpId => {
        this.jsonObject = {};
        this.setEmployeeSalary(101, Number(lastEmpId));
      }
    );
  }

  setEmployeeSalary(employeeId: int, lastemployeeId: int) {
    this.monthDays = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (Number(this.selectedMonth) == Number(this.todayDate.split('-')[1]) && this.selectedYear == this.todayDate.split('-')[0]) {
      this.monthDays = this.todayDate.split("-")[2];
    }
    this.db.object("Employees/" + employeeId + "/GeneralDetails/status").valueChanges().subscribe(
      empStatus => {
        if (empStatus != null && empStatus == 1) {
          if (empStatus == 1) {
            this.db.object("Employees/" + employeeId + "/GeneralDetails").valueChanges().subscribe(
              empGeneralDetails => {
                console.log("empGeneralDetails :" + empGeneralDetails);

                if (employeeId <= lastemployeeId && this.activeEmployeeCount <= 2) {
                  if (empGeneralDetails["designationId"] == "5" || empGeneralDetails["designationId"] == "6") {
                    this.activeEmployeeCount++;
                    // do your work, salary and general details set up section
                    let designationList = JSON.parse(localStorage.getItem("designation"));
                    let detail = designationList.find(item => item.designationId == empGeneralDetails["designationId"]);
                    if (detail != undefined) {
                      let designation = detail.designation;
                      if (designation == "Transportation Executive") {
                        designation = "Driver";
                      }
                      else if (designation == "Service Excecutive ") {
                        designation = "Helper";
                      }
                      this.jsonObject[employeeId] = { name: empGeneralDetails["name"], empCode: empGeneralDetails["empCode"], designation: designation, day1: [] };
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
                      }
                    }
                  }
                  // after set the salary we need to recall this function again for next employee.

                  this.setEmployeeSalary(employeeId + 1, lastemployeeId);
                } else {
                  setTimeout(() => {
                  let filePath = "/SalarySummary/" + this.selectedYear + "/";
                  let fileName = this.selectedMonthName + ".json";
                  this.commonService.saveJsonFile(this.jsonObject, fileName, filePath);
                 
                    this.getSalaryList();

                  }, 6000);
                }
              });
          }
        }
        else {
          this.setEmployeeSalary(employeeId + 1, lastemployeeId);
        }
      });
  }

  getSalaryList() {
    this.salaryList = [];
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSalarySummary%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let salaryInstance = this.httpService.get(path).subscribe(data => {
      salaryInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let employeeId = keyArray[i];
          let detail=data[employeeId]["day1"];
          let totalWeges=0;
          for(let i=0;i<detail.length;i++){
            if(detail[i]["wages"]!=null){
              totalWeges+=Number(detail[i]["wages"]);
            }
          }

          this.salaryList.push({ employeeId: employeeId, name: data[employeeId]["name"], empCode: data[employeeId]["empCode"], designation: data[employeeId]["designation"], day1: data[employeeId]["day1"],totalDaySalary1:totalWeges });
        }
        $(this.divLoader).hide();
      }
    });

  }
}
