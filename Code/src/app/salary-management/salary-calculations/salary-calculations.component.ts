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
  dailyWorkDetail: any;
  datesInSelectedMonth: any;
  salaryList: any[];
  monthDays: any;
  zoneList: any[];
  employeeIds: any[];
  employees: any;
  maxTaskCount = 10;
  wardWagesList: any[];
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
    this.getWardWagesList();
    this.getYear();

  }

  getWardWagesList() {
    this.wardWagesList = [];
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

    this.selectedYear = this.todayDate.split('-')[0];
    $(this.ddlYear).val(this.selectedYear);
    /*
    this.selectedMonth = Number(this.todayDate.split('-')[1]);    
    $(this.ddlMonth).val(this.todayDate.split('-')[1]);    
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);*/
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = Number(filterVal);
    if (this.selectedMonth != 0) {
      this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    }
  }

  getDailyWorkDetailForSelectedMonth() {

  }


  calculate() {
    $(this.divLoader).show();
    this.activeEmployeeCount = 0;
    this.jsonObject = {};
    if (this.selectedMonth != undefined) {

      this.httpService.get(this.storagePath + "%2FEmployees.json?alt=media").subscribe(data => {
        if (data != null) {
          this.employeeIds = Object.keys(data);
          this.employees = data;
          this.monthDays = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
          let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName;
          let dailyWorkInstance = this.db.object(dbPath).valueChanges().subscribe(dailyWorkDetailData => {
            dailyWorkInstance.unsubscribe();
            this.dailyWorkDetail = dailyWorkDetailData;
            this.datesInSelectedMonth = Object.keys(this.dailyWorkDetail);
            this.setEmployeeData(0);
          });
        }
      });
    }
    else {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("error", "Please select Month");
    }
  }

  setEmployeeData(index: int) {
    let employeeId = this.employeeIds[index];

    let designationId = this.employees[employeeId]["GeneralDetails"]["designationId"];
    let status = this.employees[employeeId]["GeneralDetails"]["status"]
    if (status == "1" && (designationId == "5" || designationId == "6")) {
      let lastEmpId = this.employeeIds[this.employeeIds.length - 1];
      if (Number(employeeId) <= Number(lastEmpId) && this.activeEmployeeCount <= 4) {
        this.activeEmployeeCount++;

        this.jsonObject[employeeId] = {
          name: this.employees[employeeId]["GeneralDetails"]["name"],
          empCode: this.employees[employeeId]["GeneralDetails"]["empCode"],
          designation: this.employees[employeeId]["GeneralDetails"]["designation"]
        };


        //for (let index = 0; index < this.datesInSelectedMonth.length; index++) {
        for (let index = 0; index < 3; index++) {
          let date = this.datesInSelectedMonth[index];
          let employeeAssignments = this.dailyWorkDetail[date][employeeId];
          if (employeeAssignments != undefined) {

            this.jsonObject[employeeId]["day" + (index + 1)] = [];
            let assignedTaskCount = 1;
            while (assignedTaskCount < this.maxTaskCount) {

              let task = this.dailyWorkDetail[date][employeeId]["task" + assignedTaskCount];
              if (task != undefined) {
                let taskName = task["task"];
                let wages = task["task-wages"];

                if (new Date(date) >= new Date(this.salaryCalculationChangedDate())) {
                  let wageDetail = this.wardWagesList.find(item => item.ward == taskName);
                  if (wageDetail != undefined) {

                    console.log("wageDetail:" + wageDetail);

                    if (assignedTaskCount > 1) {
                      wages = 200;
                    } else {
                      wages = designationId == "5" ? wageDetail.driver : wageDetail.helper;
                    }

                    /*
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
                    */
                  }
                }

                
                this.jsonObject[employeeId]["day" + (index + 1)].push({
                  ward: taskName,
                  wages: wages,
                  percentage: 0
                });
                assignedTaskCount++;
              } else {
                break;
              }
            }
          }
        }

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

  salaryCalculationChangedDate() {
    if (localStorage.getItem("cityName") == "reengus") {
      return "2022-05-21";
    }
    else if (localStorage.getItem("cityName") == "sikar") {
      return "2022-05-08";
    }
  }

  /*
    setEmployeeSalary(employeeId: int, lastemployeeId: int) {
  
      this.monthDays = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
  
      if (Number(this.selectedMonth) == Number(this.todayDate.split('-')[1]) && this.selectedYear == this.todayDate.split('-')[0]) {
        this.monthDays = this.todayDate.split("-")[2];
      }
  */

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

  getSalaryList() {

    $(this.divLoader).show();

    this.salaryList = [];

    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSalarySummary%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let salaryInstance = this.httpService.get(path).subscribe(data => {
      salaryInstance.unsubscribe();
      console.log("json data:" + data);
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let employeeId = keyArray[i];

          this.salaryList.push({
            employeeId: employeeId,
            name: data[employeeId]["name"],
            empCode: data[employeeId]["empCode"],
            designation: data[employeeId]["designation"]
          });

          for (let dateIndex = 0; dateIndex < 32; dateIndex++) {
            let dayNumber = dateIndex + 1;
            if (data[employeeId]["day" + dayNumber] != undefined) {

              this.salaryList[i]["day" + dayNumber] = [];
              this.salaryList[i]["totalDaySalary" + dayNumber] = [];

              let dayData = data[employeeId]["day" + dayNumber];
              let totalWages = 0;
              for (let i = 0; i < dayData.length; i++) {
                if (dayData[i]["wages"] != null) {
                  totalWages += Number(dayData[i]["wages"]);
                }
              }

              this.salaryList[i]["day" + dayNumber] = dayData;
              this.salaryList[i]["totalDaySalary" + dayNumber] = totalWages;
            } else {
              break;
            }
          }
        }
        $(this.divLoader).hide();
      }
    });
  }
}




