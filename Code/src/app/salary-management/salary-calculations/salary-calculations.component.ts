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
    this.activeEmployeeCount = 0;
    $(this.divLoader).show();
    let dbPath = "Employees/lastEmpId";
    this.db.object(dbPath).valueChanges().subscribe(
      lastEmpId => {
        this.setEmployeeSalary(101, Number(lastEmpId));
      }
    );
  }

  setEmployeeSalary(employeeId: int, lastemployeeId: int) {
    this.db.object("Employees/" + employeeId + "/GeneralDetails/status").valueChanges().subscribe(
      empStatus => {
        if (empStatus != null && empStatus == 1) {
          if (empStatus == 1) {
            this.db.object("Employees/" + employeeId + "/GeneralDetails").valueChanges().subscribe(
              empGeneralDetails => {
                console.log("empGeneralDetails :" + empGeneralDetails);
                this.activeEmployeeCount++;
                if (employeeId <= lastemployeeId && this.activeEmployeeCount == 1) {

                  // do your work, salary and general details set up section
                  


                  // after set the salary we need to recall this function again for next employee.
                  this.setEmployeeSalary(employeeId + 1, lastemployeeId);
                } else {
                  $(this.divLoader).hide();
                }
              });
          }
        }
        else {
          this.setEmployeeSalary(employeeId + 1, lastemployeeId);
        }
      });
  }


}
