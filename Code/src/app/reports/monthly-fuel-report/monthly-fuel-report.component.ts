import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-monthly-fuel-report',
  templateUrl: './monthly-fuel-report.component.html',
  styleUrls: ['./monthly-fuel-report.component.scss']
})
export class MonthlyFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }

  cityName: any;
  db: any;
  yearList: any[];
  vehicleList: any[] = [];
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  monthDays: any;
  toDayDate: any;
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  divLoader = "#divLoader";
  isFileSaved: any;

  fuelDetail: fuelDetail = {
    totalFuel: "0.00",
    totalKm: "0.000",
    totalAmount: "0.00"
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.isFileSaved = false;
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    $(this.ddlMonth).val(this.toDayDate.split('-')[1]);
    this.getMonthDays();
  }

  getMonthDays() {
    $(this.divLoader).show();
    this.isFileSaved = false;
    this.fuelDetail.totalFuel = "0.00";
    this.fuelDetail.totalKm = "0.000";
    this.fuelDetail.totalAmount = "0.00";
    this.vehicleList = [];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.monthDays = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (Number(this.selectedMonth) == Number(this.toDayDate.split('-')[1]) && this.selectedYear == this.toDayDate.split('-')[0]) {
      this.monthDays = this.toDayDate.split("-")[2];
    }
    this.getVehicles();
  }

  getVehicles() {
    let vehicles = JSON.parse(localStorage.getItem("vehicle"));
    for (let i = 3; i < vehicles.length; i++) {
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"], qty: "0.00", km: "0.000", amount: 0, avg: "" });
    }
    this.getFuelData();
  }

  getFuelData() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FReports%2FMonthlyFuelReport%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(fuelData => {
      fuelInstance.unsubscribe();
      if (fuelData != null) {
        this.vehicleList = JSON.parse(JSON.stringify(fuelData));
        this.fuelDetail.totalFuel = this.vehicleList.reduce((accumulator, current) => accumulator + Number(current.qty), 0).toFixed(2);
        this.fuelDetail.totalKm = this.vehicleList.reduce((accumulator, current) => accumulator + Number(current.km), 0).toFixed(3);
        this.fuelDetail.totalAmount = this.vehicleList.reduce((accumulator, current) => accumulator + Number(current.amount), 0).toFixed(1);
        $(this.divLoader).hide();
      }
    }, error => {
      this.getDailyWorkDetail(1);
      for (let i = 1; i <= this.monthDays; i++) {
        let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
        this.getFuelQty(monthDate);
      }
    });
  }

  getFuelQty(monthDate: any) {
    let dbPath = "DieselEntriesData/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
    let dieselInstance = this.db.list(dbPath).valueChanges().subscribe(
      dieselData => {
        dieselInstance.unsubscribe();
        if (dieselData.length > 0) {
          for (let i = 0; i < dieselData.length; i++) {
            if (dieselData[i]["vehicle"] != null) {
              let detail = this.vehicleList.find(item => item.vehicle == dieselData[i]["vehicle"]);
              if (detail != undefined) {
                if (dieselData[i]["quantity"] != null) {
                  detail.qty = (Number(detail.qty) + Number(dieselData[i]["quantity"])).toFixed(2);
                  detail.amount = (Number(detail.amount) + Number(dieselData[i]["amount"])).toFixed(2);
                }
              }
            }
          }
        }
      }
    );
  }

  getDailyWorkDetail(day: any) {
    let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (day < 10 ? '0' : '') + day;
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDailyWorkDetail%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + monthDate + ".json?alt=media";
    let workDetailInstance = this.httpService.get(path).subscribe(workData => {
      workDetailInstance.unsubscribe();
      if (workData != null) {
        this.getWardRunningDetail(workData, monthDate).then((res) => {
          if (day < this.monthDays) {
            this.getDailyWorkDetail((day + 1));
          }
        });
      }
      else {
        if (day < this.monthDays) {
          this.getDailyWorkDetail((day + 1));
        }
        else {
          this.saveMonthlyFuelReportJson();
        }
      }

    }, error => {
      let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
      workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        workData => {
          workDetailInstance.unsubscribe();
          if (workData != null) {
            if (monthDate != this.commonService.setTodayDate()) {
              this.commonService.saveJsonFile(workData, monthDate + ".json", "/DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/");
            }
            this.getWardRunningDetail(workData, monthDate).then((res) => {
              if (day < this.monthDays) {
                this.getDailyWorkDetail((day + 1));
              }
            });
          }
          else {
            if (day < this.monthDays) {
              this.getDailyWorkDetail((day + 1));
            }
            else {
              this.saveMonthlyFuelReportJson();
            }
          }
        });
    });
  }

  getWardRunningDetail(workData: any, monthDate: any) {
    return new Promise((resolve) => {
      let keyArray = Object.keys(workData);
      if (keyArray.length > 0) {
        for (let j = 0; j < keyArray.length; j++) {
          let empId = keyArray[j];
          this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
            if (employee["designation"] == "Transportation Executive") {
              for (let k = 1; k <= 5; k++) {
                if (workData[empId]["task" + k] != null) {
                  let zone = workData[empId]["task" + k]["task"];
                  let vehicle = workData[empId]["task" + k]["vehicle"];
                  if (vehicle != "NotApplicable") {
                    let dbLocationPath = "LocationHistory/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/TotalCoveredDistance";
                    if (zone.includes("BinLifting")) {
                      dbLocationPath = "LocationHistory/BinLifting/" + vehicle + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/TotalCoveredDistance";
                    }
                    let locationInstance = this.db.object(dbLocationPath).valueChanges().subscribe(
                      locationData => {
                        locationInstance.unsubscribe();
                        let distance = "0";
                        if (locationData != null) {
                          distance = (Number(locationData) / 1000).toFixed(3);
                        }
                        let detail = this.vehicleList.find(item => item.vehicle == vehicle);
                        if (detail != undefined) {
                          detail.km = (Number(detail.km) + Number(distance)).toFixed(3);
                          if (detail.qty != "0.00") {
                            detail.avg = (Number(detail.km) / Number(detail.qty)).toFixed(2);
                          }
                        }
                        if (this.monthDays == Number(monthDate.split('-')[2])) {
                          this.saveMonthlyFuelReportJson();
                        }
                        resolve(null);
                      });
                  }
                }
              }
            }
          });
        }
      }
    });
  }

  saveMonthlyFuelReportJson() {
    setTimeout(() => {
      if (this.isFileSaved == false) {
        if (Number(this.selectedMonth) == Number(this.toDayDate.split('-')[1]) && this.selectedYear == this.toDayDate.split('-')[0]) {

        }
        else {

          this.isFileSaved = true;
          this.commonService.saveJsonFile(this.vehicleList, this.selectedMonthName + ".json", "/Reports/MonthlyFuelReport/" + this.selectedYear + "/");
        }
      }
      this.fuelDetail.totalFuel = this.vehicleList.reduce((accumulator, current) => accumulator + Number(current.qty), 0).toFixed(2);
      this.fuelDetail.totalKm = this.vehicleList.reduce((accumulator, current) => accumulator + Number(current.km), 0).toFixed(3);
      this.fuelDetail.totalAmount = this.vehicleList.reduce((accumulator, current) => accumulator + Number(current.amount), 0).toFixed(2);
      $(this.divLoader).hide();
    }, 6000);
  }

  exportToExcel() {
    if (this.vehicleList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Vehicle Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Diesel Quantity";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "KM Running";
      htmlString += "</td>";
      htmlString += "</tr>";

      for (let i = 0; i < this.vehicleList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.vehicleList[i]["vehicle"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.vehicleList[i]["qty"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.vehicleList[i]["km"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = this.commonService.getFireStoreCity() + "-Monthly-Fuel-Report-" + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) + "-" + this.selectedYear + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.getMonthDays();
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getMonthDays();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.toDayDate.split('-')[0];
  }
}

export class fuelDetail {
  totalFuel: string;
  totalKm: string;
  totalAmount: string;
}
