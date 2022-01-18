import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-employee-penalty',
  templateUrl: './employee-penalty.component.html',
  styleUrls: ['./employee-penalty.component.scss']
})
export class EmployeePenaltyComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
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
  penalitylDetail: penalitylDetail = {
    totalPenality: "0.00",
    employeePenality: "0.00"
  }
  ddlUser = "#ddlUser";
  txtDate = "#txtDate";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.employeeList = [];
    this.penalityList = [];
    this.allPenaltyList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getPenality();
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
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FPenality%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let penalityList = [];
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          let totalPenalty = 0;
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            let empObj = data[date];
            let empArray = Object.keys(empObj);
            if (empArray.length > 0) {
              for (let j = 0; j < empArray.length; j++) {
                let empId = empArray[j];
                this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                  let name = employee["name"];
                  let empDetail = this.employeeList.find(item => item.empId == empId);
                  if (empDetail == undefined) {
                    this.employeeList.push({ empId: empId, name: name });
                  }
                  let orderBy = new Date(date).getTime();
                  totalPenalty += Number(empObj[empId]["amount"]);
                  this.penalityList.push({ empId: empId, date: date, name: name, penaltyType: empObj[empId]["penaltyType"], reason: empObj[empId]["reason"], createdBy: empObj[empId]["createdBy"], amount: empObj[empId]["amount"], orderBy: orderBy });
                  this.penalityList = this.penalityList.sort((a, b) =>
                    a.orderBy > b.orderBy ? 1 : -1
                  );
                  let sum: number = 0;
                  this.allPenaltyList.forEach(a => sum += Number(a.amount));
                  this.penalitylDetail.totalPenality = sum.toFixed(2);
                });
              }
            }
          }
          this.allPenaltyList = this.penalityList;
        }
      }
      else {
        this.commonService.setAlertMessage("error", "Sorry! no record found");
      }
    }, error => {
      let dbPath = "Penalties/" + this.selectedYear + "/" + this.selectedMonthName;
      let penalityInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          penalityInstance.unsubscribe();
          if (data != null) {
            let penalityList = [];
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              let totalPenalty = 0;
              for (let i = 0; i < keyArray.length; i++) {
                let date = keyArray[i];
                let empObj = data[date];
                let empArray = Object.keys(empObj);
                if (empArray.length > 0) {
                  for (let j = 0; j < empArray.length; j++) {
                    let empId = empArray[j];
                    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                      let name = employee["name"];
                      let empDetail = this.employeeList.find(item => item.empId == empId);
                      if (empDetail == undefined) {
                        this.employeeList.push({ empId: empId, name: name });
                      }
                      let orderBy = new Date(date).getTime();
                      totalPenalty += Number(empObj[empId]["amount"]);
                      this.penalityList.push({ empId: empId, date: date, name: name, penaltyType: empObj[empId]["penaltyType"], reason: empObj[empId]["reason"], createdBy: empObj[empId]["createdBy"], amount: empObj[empId]["amount"], orderBy: orderBy });
                      this.penalityList = this.penalityList.sort((a, b) =>
                        a.orderBy > b.orderBy ? 1 : -1
                      );
                      let sum: number = 0;
                      this.allPenaltyList.forEach(a => sum += Number(a.amount));
                      this.penalitylDetail.totalPenality = sum.toFixed(2);
                    });
                  }
                }
              }
              this.allPenaltyList = this.penalityList;
            }
          }
          else {
            this.commonService.setAlertMessage("error", "Sorry! no record found");
          }
        }
      );
    });
  }

  filterData() {
    this.penalityList = [];
    if (this.allPenaltyList.length > 0) {
      let userId = $(this.ddlUser).val();
      console.log(userId);
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


}

export class penalitylDetail {
  totalPenality: string;
  employeePenality: string;
}
