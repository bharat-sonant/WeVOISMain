import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { FirebaseService } from "../../firebase.service";




@Component({
  selector: 'app-monthly-attendance',
  templateUrl: './monthly-attendance.component.html',
  styleUrls: ['./monthly-attendance.component.scss']
})
export class MonthlyAttendanceComponent implements OnInit {
  nameCountList = [
    { name: 'Anil Kumar Sharma', totalCount: 25 },
    { name: 'Prashant Meena', totalCount: 30 },
    { name: 'Nitin Jain', totalCount: 15 },
    { name: 'Nikhil Jain', totalCount: 16 },
    // Add more objects as needed
  ];
  db: any;
  cityName: any;
  allEmployeeList: any[] = [];
  yearList: any[] = [];
  selectedEmployee: any;
  selectedYear: any;
  selectedMonth: any;
  selectedMonthName: any;
  fireStorePath: any;
  dates: Date[] = [];
  todayDate: any;
  attendanceReportList: any[] = [];
  reportList: any[] = [];
  divLoader = "#divLoader";
  ddlYear = "#ddlYear";
  lastSyncData: any;
  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }

  ngOnInit() {

    this.todayDate = this.commonService.setTodayDate();
    this.getEmployees()
    this.getYear();
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedEmployee = '0'
    this.selectedYear = '2023'

    this.selectedMonth = this.todayDate.split('-')[1];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    setTimeout(() => {
      this.selectedMonthDates()
    }, 1000);

    this.getJsonData();
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
  getEmployees() {
    this.allEmployeeList = [];
    this.fireStorePath = this.commonService.fireStoragePath;
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployees.json?alt=media";

    let accountInstance = this.httpService.get(path).subscribe(data => {
      accountInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            if (data[empId]["GeneralDetails"]["empType"] == 1) {
              this.allEmployeeList.push({ empId: empId.toString(), empCode: data[empId]["GeneralDetails"]["empCode"], name: data[empId]["GeneralDetails"]["name"], designationId: data[empId]["GeneralDetails"]["designationId"], designation: data[empId]["GeneralDetails"]["designation"], status: data[empId]["GeneralDetails"]["status"], empType: data[empId]["GeneralDetails"]["empType"] });
            }
          }
        }
        this.allEmployeeList = this.allEmployeeList.sort((a, b) => Number(b.empId) < Number(a.empId) ? 1 : -1);
      }
    }, error => {
    });
  }



  selectedMonthDates() {

    if (this.selectedYear !== null) {
      this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1)
      const monthIndex = this.months.findIndex(month => month === this.selectedMonthName);
      if (monthIndex !== -1) {
        const startDate = new Date(this.selectedYear, monthIndex, 1);
        const endDate = new Date(this.selectedYear, monthIndex + 1, 0);
        this.dates = this.getDatesArray(startDate, endDate);

      }
    }
  }

  getDatesArray(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      dates.push(this.formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = this.padZero(date.getMonth() + 1); // Month is zero-based
    const day = this.padZero(date.getDate());

    return `${year}-${month}-${day}`;
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];



  changeSelection() {
    this.selectedMonthDates();
    this.reportList = [];
    if (this.selectedEmployee == '0') {
      this.getJsonData()
    }
    else {

      $(this.divLoader).show();
      this.fireStorePath = this.commonService.fireStoragePath;
      const path = this.fireStorePath + this.commonService.getFireStoreCity() + '%2FEmployeeAttendance%2F' + this.selectedMonthName + '-' + this.selectedYear + '.json?alt=media'

      let accountInstance = this.httpService.get(path).subscribe((value: any) => {
        accountInstance.unsubscribe();

        if (value != null) {

          this.reportList = value.Data.filter(item => item.empId === this.selectedEmployee);

          const inputDate = new Date(value.lastUpdated)
          this.lastSyncData = `${inputDate.getDate()} ${this.getMonthAbbreviation(inputDate.getMonth())} ${inputDate.getFullYear()} ${this.formatTime(inputDate)}`;

          $(this.divLoader).hide();
        }

      }, error => {
        $(this.divLoader).hide();
        this.commonService.setAlertMessage("error", "Attendance data is not available. Please synchronize data.!!!");

      });

    }
  }

  getEmployeeAttandanceData() {

    $(this.divLoader).show();
    this.attendanceReportList = [];

    const promises = this.allEmployeeList.map(employee => {
      let totalAttendance = 0;
      let dateList = [];

      let dbPath = `Attendance/${employee.empId}/${this.selectedYear}/${this.selectedMonthName}`;

      return new Promise(resolve => {
        const employeeAttendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
          attendanceData => {
            employeeAttendanceInstance.unsubscribe();
            let Attendance = 0;
            let dateString: any;

            if (attendanceData != null) {
              let keyArray = Object.keys(attendanceData);

              for (let j = 0; j < this.dates.length; j++) {
                dateString = this.dates[j].toString();
                let data = keyArray.find(item => item.toString() === dateString);

                if (data === undefined) {
                  Attendance = 0;
                } else {
                  let inDetails = attendanceData[data]['inDetails'];

                  if (inDetails && inDetails.status !== undefined) {
                    let status = inDetails.status;

                    if (status == '0') {
                      Attendance = 0;
                    } else if (status == '2' || status == '3') {
                      Attendance = 0.5;
                    } else if (status == '1') {
                      Attendance = 1;
                    }
                  } else {
                    // Handle the case where 'inDetails' or 'status' is undefined
                    Attendance = 0;
                  }
                }

                totalAttendance += Attendance;

                dateList.push({
                  day: 'day-' + (j + 1),
                  attendanceType: Attendance,
                });
              }
            } else {
              for (let j = 0; j < this.dates.length; j++) {
                dateList.push({
                  day: 'day-' + (j + 1),
                  attendanceType: 0,
                });
              }
            }

            resolve({
              empId: employee.empId,
              name: employee.name,
              list: dateList,
              total: totalAttendance,
            });
          },
          error => {
            // Handle errors here
            console.error('Error fetching attendance data:', error);
            resolve(null); // Resolve with null in case of an error
          }
        );
      });
    });


    Promise.all(promises).then((results: any) => {

      this.reportList = results;
      this.saveAttendaceInStorage(results)
      if (this.selectedEmployee != '0') {
        this.reportList = results.filter(item => item.empId === this.selectedEmployee);
      }
      else {
        this.reportList = results;
      }
      $(this.divLoader).hide();

    });
  }


  saveAttendaceInStorage(list: any) {
    let reportObject = {
      Data: list,
      lastUpdated: this.commonService.getTodayDateTime()
    }
    let fileName = `${this.selectedMonthName}-${this.selectedYear}.json`;
    let path = "/EmployeeAttendance/";
    this.commonService.saveJsonFile(reportObject, fileName, path);
    const inputDate = new Date(this.commonService.getTodayDateTime())
    this.lastSyncData = `${inputDate.getDate()} ${this.getMonthAbbreviation(inputDate.getMonth())} ${inputDate.getFullYear()} ${this.formatTime(inputDate)}`;
  }

  getJsonData() {

    $(this.divLoader).show();
    this.fireStorePath = this.commonService.fireStoragePath;
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + '%2FEmployeeAttendance%2F' + this.selectedMonthName + '-' + this.selectedYear + '.json?alt=media'

    let accountInstance = this.httpService.get(path).subscribe((value: any) => {
      accountInstance.unsubscribe();

      if (value != null) {

        this.reportList = value.Data

        const inputDate = new Date(value.lastUpdated);

        // Format the date to the desired format
        this.lastSyncData = `${inputDate.getDate()} ${this.getMonthAbbreviation(inputDate.getMonth())} ${inputDate.getFullYear()} ${this.formatTime(inputDate)}`;
        $(this.divLoader).hide();
      }

    }, error => {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("error", "Attendance data is not available. Please synchronize data!!!");

    });
  }

  getMonthAbbreviation(monthIndex: any) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[monthIndex];
  }

  // Helper function to format time (HH:mm)
  formatTime(date: any) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }


} 
