import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-daily-fuel-report',
  templateUrl: './daily-fuel-report.component.html',
  styleUrls: ['./daily-fuel-report.component.scss']
})
export class DailyFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  cityName: any;
  db: any;
  vehicleList: any[] = [];
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedDate: any;
  txtDate = "#txtDate";
  spDate = "#spDate";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    $(this.txtDate).val(this.selectedDate);
    $(this.spDate).html(this.selectedDate);
    this.getSelectedYearMonthName();
    this.getVehicles();
  }

  clearList() {
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        this.vehicleList[i]["diesel"] = [];
        this.vehicleList[i]["wardList"] = [];
      }
    }
  }

  getData(filterVal: any) {
    this.clearList();
    this.selectedDate = filterVal;
    $(this.spDate).html(this.selectedDate);
    this.getSelectedYearMonthName();
    this.getDieselQty();
    this.getWardRunningDetail();
  }

  getVehicles() {
    let vehicles = JSON.parse(localStorage.getItem("vehicle"));
    for (let i = 3; i < vehicles.length; i++) {
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"], diesel: [], wardList: [] });
    }
    this.getDieselQty();
    this.getWardRunningDetail();
  }

  getSelectedYearMonthName() {
    this.selectedMonth = Number(this.selectedDate.split('-')[1]);
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
  }

  getDieselQty() {
    let dbPath = "DieselEntriesData/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let dieselInstance = this.db.list(dbPath).valueChanges().subscribe(
      dieselData => {
        dieselInstance.unsubscribe();
        if (dieselData.length > 0) {
          for (let i = 0; i < dieselData.length; i++) {
            if (dieselData[i]["vehicle"] != null) {
              let detail = this.vehicleList.find(item => item.vehicle == dieselData[i]["vehicle"]);
              if (detail != undefined) {
                if (dieselData[i]["quantity"] != null) {
                  detail.diesel.push({ qty: dieselData[i]["quantity"] });
                }
              }
            }
          }
        }
      }
    );
  }

  getWardRunningDetail() {
    let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
      workData => {
        workDetailInstance.unsubscribe();
        if (workData != null) {
          let keyArray = Object.keys(workData);
          if (keyArray.length > 0) {
            for (let j = 0; j < keyArray.length; j++) {
              let empId = keyArray[j];
              this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                if (employee["designation"] == "Transportation Executive") {
                  let name = employee["name"];
                  for (let k = 1; k <= 5; k++) {
                    if (workData[empId]["task" + k] != null) {
                      let zone = workData[empId]["task" + k]["task"];
                      let vehicle = workData[empId]["task" + k]["vehicle"];
                      if (vehicle != "NotApplicable") {
                        let dbLocationPath = "LocationHistory/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/TotalCoveredDistance";
                        if (zone.includes("BinLifting")) {
                          dbLocationPath = "LocationHistory/BinLifting/" + vehicle + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/TotalCoveredDistance";
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
                              let wardListDetail = detail.wardList.find(item => item.zone == zone);
                              if (wardListDetail == undefined) {
                                detail.wardList.push({ zone: zone, km: distance, driver: name });
                              }
                            }
                          });
                      }
                    }
                  }
                }
              });
            }
          }
        }
      });
  }



}
