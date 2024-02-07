import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-employee-penalty',
  templateUrl: './employee-penalty.component.html',
  styleUrls: ['./employee-penalty.component.scss']
})
export class EmployeePenaltyComponent implements OnInit {

  constructor(private storage: AngularFireStorage, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  employeeList: any[];
  penalityList: any[];
  allPenaltyList: any[];
  specialUserList: any[];
  penalitylDetail: penalitylDetail = {
    totalPenality: "0.00",
    employeePenality: "0.00"
  }
  ddlUser = "#ddlUser";
  txtDate = "#txtDate";
  divLoader = "#divLoader";
  serviceName = "penalty";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Finance-Reports","Penalty-Report",localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.employeeList = [];
    this.penalityList = [];
    this.allPenaltyList = [];
    this.specialUserList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getSpecialUsers();
    this.getPenality();
  }


  getSpecialUsers() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getSpecialUsers");
    let dbPath = "Settings/SpecialUsers";
    let userInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        userInstance.unsubscribe();
        if (data.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getSpecialUsers", data);
          for (let i = 0; i < data.length; i++) {
            this.specialUserList.push({ name: data[i]["username"] });
          }
        }
      }
    );
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  changeYearSelection(filterVal: any) {
    this.resetAll();
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    this.selectedYear = filterVal;
    this.selectedMonth = "0";
    $('#ddlMonth').val("0");
  }

  changeMonthSelection(filterVal: any) {
    this.resetAll();
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    this.selectedMonth = filterVal;
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getPenality();
  }

  resetAll() {
    this.penalitylDetail.employeePenality = "0.00";
    this.penalitylDetail.totalPenality = "0.00";
    this.penalityList = [];
    this.employeeList = [];
  }

  getPenality() {
    $(this.divLoader).show();
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPenality%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            let empObj = data[date];
            let empArray = Object.keys(empObj);
            if (empArray.length > 0) {
              for (let j = 0; j < empArray.length; j++) {
                let empId = empArray[j];
                let empCode = empObj[empId]["empCode"];
                let name = empObj[empId]["name"];
                let empDetail = this.employeeList.find(item => item.empId == empId);
                if (empDetail == undefined) {
                  this.employeeList.push({ empId: empId, name: name, empCode: empCode });
                  this.employeeList = this.commonService.transformNumeric(this.employeeList, "name");
                }
                let orderBy = new Date(date).getTime();
                this.penalityList.push({ empId: empId, empCode: empCode, date: date, name: name, penaltyType: empObj[empId]["penaltyType"], reason: empObj[empId]["reason"], createdBy: empObj[empId]["createdBy"], amount: empObj[empId]["amount"], orderBy: orderBy });
                this.penalityList = this.penalityList.sort((a, b) =>
                  a.orderBy > b.orderBy ? 1 : -1
                );
              }
            }
            if (i == keyArray.length - 1) {
              let sum: number = 0;
              this.penalityList.forEach(a => sum += Number(a.amount));
              this.penalitylDetail.totalPenality = sum.toFixed(2);
              this.allPenaltyList = this.penalityList;
              $(this.divLoader).hide();
            }
          }

        }
      }
      else {
        this.commonService.setAlertMessage("error", "Sorry! no record found");
        $(this.divLoader).hide();
      }
    }, error => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getPenality");
      let dbPath = "Penalties/" + this.selectedYear + "/" + this.selectedMonthName;
      let penalityInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          penalityInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPenality", data);
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let date = keyArray[i];
                let empObj = data[date];
                let empArray = Object.keys(empObj);
                if (empArray.length > 0) {
                  for (let j = 0; j < empArray.length; j++) {
                    let empId = empArray[j];
                    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                      let name = employee["name"];
                      let empCode = employee["empCode"];
                      let empDetail = this.employeeList.find(item => item.empId == empId);
                      if (empDetail == undefined) {
                        this.employeeList.push({ empId: empId, name: name, empCode: empCode });
                        this.employeeList = this.commonService.transformNumeric(this.employeeList, "name");
                      }
                      let orderBy = new Date(date).getTime();
                      let createdBy = empObj[empId]["createdBy"]
                      let detail = this.specialUserList.find(item => item.name == createdBy);
                      if (detail != undefined) {
                        this.penalityList.push({ empId: empId, empCode: empCode, date: date, name: name, penaltyType: empObj[empId]["penaltyType"], reason: empObj[empId]["reason"], createdBy: createdBy, amount: empObj[empId]["amount"], orderBy: orderBy });
                        this.penalityList = this.penalityList.sort((a, b) =>
                          a.orderBy > b.orderBy ? 1 : -1
                        );
                      }
                      else {
                        dbPath = "Employees/" + createdBy + "/GeneralDetails/name";
                        let empInstance = this.db.object(dbPath).valueChanges().subscribe(
                          empData => {
                            empInstance.unsubscribe();
                            if (empData != null) {
                              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPenality", empData);
                              createdBy = empData;
                            }
                            this.penalityList.push({ empId: empId, empCode: empCode, date: date, name: name, penaltyType: empObj[empId]["penaltyType"], reason: empObj[empId]["reason"], createdBy: createdBy, amount: empObj[empId]["amount"], orderBy: orderBy });
                            this.penalityList = this.penalityList.sort((a, b) =>
                              a.orderBy > b.orderBy ? 1 : -1
                            );
                          });
                      }
                      let sum: number = 0;
                      this.penalityList.forEach(a => sum += Number(a.amount));
                      this.penalitylDetail.totalPenality = sum.toFixed(2);
                    });
                  }
                }

                if (i == keyArray.length - 1) {
                  setTimeout(() => {
                    this.allPenaltyList = this.penalityList;
                    $(this.divLoader).hide();
                  }, 4000);
                }
              }
            }
          }
          else {
            this.commonService.setAlertMessage("error", "Sorry! no record found");
            $(this.divLoader).hide();
          }
        }
      );
    });
  }

  filterData() {
    this.penalityList = [];
    if (this.allPenaltyList.length > 0) {
      let userId = $(this.ddlUser).val();
      let date = $(this.txtDate).val();
      this.penalityList = this.allPenaltyList;
      if (userId != "0") {
        this.penalityList = this.penalityList.filter(item => item.empId == userId);
      }
      if (date != "") {
        this.penalityList = this.penalityList.filter(item => item.date == date);
      }
    }
  }

  resetData() {
    $(this.txtDate).val("");
    $(this.ddlUser).val("0");
    this.penalityList = this.allPenaltyList;
  }

  exportexcel() {

    let htmlString = "";
    if (this.penalityList.length > 0) {
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Penalty";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Reason";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Penalty by";
      htmlString += "</td>";

      htmlString += "</tr>";
      for (let i = 0; i < this.penalityList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["date"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["penaltyType"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["amount"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["reason"].replace('/', '~').replace('/', '~');
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["name"] + " (" + this.penalityList[i]["empCode"] + ")";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["createdBy"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    let fileName = "Penalty-" + this.selectedYear + "-" + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) + ".xlsx";
    XLSX.writeFile(wb, fileName);
  }


}

export class penalitylDetail {
  totalPenality: string;
  employeePenality: string;
}
