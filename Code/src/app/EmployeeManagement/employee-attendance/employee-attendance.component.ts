import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-employee-attendance',
  templateUrl: './employee-attendance.component.html',
  styleUrls: ['./employee-attendance.component.scss']
})
export class EmployeeAttendanceComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  divLoader = "#divLoader";
  allEmployeeList: any[] = [];
  employeeList: any[];
  attendanceList: any[];
  fireStorePath: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedDate: any;
  toDayDate: any;
  txtDate = "#txtDate";
  ddlTime = "#ddlTime";
  chkFieldExecutive = "chkFieldExecutive";
  rdoByDate = "rdoByDate";
  rdoByEmployee = "rdoByEmployee";
  divByDate = "#divByDate";
  divByEmployee = "#divByEmployee";
  txtDateFrom = "#txtDateFrom";
  txtDateTo = "#txtDateTo";
  ddlEmployee = "#ddlEmployee";

  public filterType: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.filterType = "byDate";
    (<HTMLInputElement>document.getElementById(this.rdoByDate)).checked = true;
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateFrom).val(this.selectedDate);
    $(this.txtDateTo).val(this.selectedDate);
    this.getSelectedYearMonthName();
    this.fireStorePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.getEmployees();
  }

  setFilterType(filterVal: any,empId:any) {
    $(this.ddlEmployee).val(empId);
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateFrom).val(this.selectedDate);
    $(this.txtDateTo).val(this.selectedDate);
    this.attendanceList = [];
    this.filterType = filterVal;
    if (this.filterType == "byDate") {
      this.getAttendance();
    }
  }

  getSelectedYearMonthName() {
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
  }

  getEmployees() {
    $(this.divLoader).show();
    this.allEmployeeList = [];
    this.employeeList = [];
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
        this.getAttendance();
      }
    }, error => {
    });
  }

  getAttendance() {
    $(this.ddlTime).val("0");
    this.employeeList = [];
    this.attendanceList = [];
    for (let i = 0; i < this.allEmployeeList.length; i++) {
      let empId = this.allEmployeeList[i]["empId"];
      let designationId = this.allEmployeeList[i]["designationId"];
      let dbPath = "Attendance/" + empId + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      let employeeAttendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
        attendanceData => {
          employeeAttendanceInstance.unsubscribe();
          if (attendanceData != null) {
            let detail = this.allEmployeeList.find(item => item.empId == empId);
            if (detail != undefined) {
              let inTime = "";
              let outTime = "";
              let inTimestemp = 0;
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inTimestemp = new Date(this.selectedDate + " " + inTime).getTime();
                }
              }
              if (attendanceData["outDetails"] != null) {
                if (attendanceData["outDetails"]["time"] != null) {
                  outTime = attendanceData["outDetails"]["time"];
                }
              }
              this.employeeList.push({ empId: empId, name: detail.name, empCode: detail.empCode, designationId: designationId, inTime: inTime, outTime: outTime, inTimestemp });
            }
          }
          if (i == this.allEmployeeList.length - 1) {
            this.filterData();
            $(this.divLoader).hide();
          }
        }
      );
    }
  }

  getAttendanceByEmployee() {
    this.attendanceList = [];
    if ($(this.ddlEmployee).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select employee !!!");
      return;
    }
    let empId = $(this.ddlEmployee).val();
    let dateFrom = $(this.txtDateFrom).val();
    let dateTo = $(this.txtDateTo).val();
    if (new Date(dateFrom.toString()) > new Date(dateTo.toString())) {
      this.commonService.setAlertMessage("error", "Please select correct date range !!!");
      return;
    }
    $(this.divLoader).show();
    this.getAttendanceEmployee(empId, dateFrom, dateTo);
  }

  getAttendanceEmployee(empId: any, date: any, dateTo: any) {
    if (new Date(date) <= new Date(dateTo)) {
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      let dbPath = "Attendance/" + empId + "/" + year + "/" + monthName + "/" + date;
      let employeeAttendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
        attendanceData => {
          employeeAttendanceInstance.unsubscribe();
          if (attendanceData != null) {
            let detail = this.allEmployeeList.find(item => item.empId == empId);
            if (detail != undefined) {
              let inTime = "";
              let outTime = "";
              let inTimestemp = 0;
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inTimestemp = new Date(date + " " + inTime).getTime();
                }
              }
              if (attendanceData["outDetails"] != null) {
                if (attendanceData["outDetails"]["time"] != null) {
                  outTime = attendanceData["outDetails"]["time"];
                }
              }
              this.attendanceList.push({ empId: empId, name: date, empCode: detail.empCode, inTime: inTime, outTime: outTime, inTimestemp });
            }
            this.getAttendanceEmployee(empId, this.commonService.getNextDate(date, 1), dateTo);
          }
          else {
            this.getAttendanceEmployee(empId, this.commonService.getNextDate(date, 1), dateTo);
          }
        });
    }
    else {
      $(this.divLoader).hide();
    }
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        $(this.divLoader).show();
        this.getSelectedYearMonthName();
        this.getAttendance();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  filterData() {
    this.attendanceList = [];
    let filterVal = $(this.ddlTime).val();
    if (filterVal == "0") {
      this.attendanceList = this.employeeList;
    }
    else {
      let filterTimestemp = new Date(this.selectedDate + " " + filterVal).getTime();
      this.attendanceList = this.employeeList.filter(item => item.inTimestemp >= filterTimestemp);
    }
    if ((<HTMLInputElement>document.getElementById(this.chkFieldExecutive)).checked == false) {
      this.attendanceList = this.attendanceList.filter(item => item.designationId != "25");
    }
  }

  exportToExcel() {
    if (this.attendanceList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      if (this.filterType == "byDate") {
        htmlString += "<td>";
        htmlString += "Employee ID";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Name";
        htmlString += "</td>";
      }
      else {
        htmlString += "<td>";
        htmlString += "Date";
        htmlString += "</td>";
      }
      htmlString += "<td>";
      htmlString += "In Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Out Time";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.attendanceList.length; i++) {
        htmlString += "<tr>";
        if (this.filterType == "byDate") {
          htmlString += "<td>";
          htmlString += this.attendanceList[i]["empCode"];
          htmlString += "</td>";
        }
        htmlString += "<td t='s'>";
        htmlString += this.attendanceList[i]["name"];
        htmlString += "</td>";

        htmlString += "<td>";
        htmlString += this.attendanceList[i]["inTime"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["outTime"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Attendance-" + this.selectedDate + ".xlsx";
      if (this.filterType == "byEmployee") {
        let detail=this.allEmployeeList.find(item=>item.empId==$(this.ddlEmployee).val());
        if(detail!=undefined){
          fileName=detail.name+"-Attendance.xlsx";
        }        
      }
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}
