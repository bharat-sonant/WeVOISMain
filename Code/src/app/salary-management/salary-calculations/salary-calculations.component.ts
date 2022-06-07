import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

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
  divLoader="#divLoader";
  todayDate: any;
  selectedMonth: any;
  selectedMonthName: any;
  selectedYear: any;
  yearList: any[] = [];
  fireStoragePath: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
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
    let dbPath = "Employees/lastEmpId";
    let lastEmpIdInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastEmpId => {
        lastEmpIdInstance.unsubscribe();
        let count = Number(lastEmpId);
        const obj = {};
        for (let i = 101; i <= count; i++) {
          let dbPath = "Employees/" + i + "/GeneralDetails";
          let employeeInstance = this.db.object(dbPath).valueChanges().subscribe(
            empData => {
              employeeInstance.unsubscribe();
              if (empData != null) {
                if (empData["status"] == "1") {
                  this.commonService.getEmplyeeDetailByEmployeeId(i.toString()).then((employee) => {
                    let empId = i;
                    obj[empId] = { name: empData["name"], empCode: empData["empCode"], designation: employee["designation"] };
                  });
                }
                if (i == count) {
                  $(this.divLoader).hide();
                  let filePath = "/SalarySummary/" + this.selectedYear + "/";
                  this.commonService.saveJsonFile(obj, this.selectedMonthName + ".json", filePath);
                }
              }              
            }
          );
        }
      }
    );
  }

}
