import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-vehicle-fuel-report',
  templateUrl: './vehicle-fuel-report.component.html',
  styleUrls: ['./vehicle-fuel-report.component.scss']
})
export class VehicleFuelReportComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  vehicleList: any;
  selectedVehicle: any;
  fuelList: any[];
  vehicleFuelList: any[];
  fuelDetail: fuelDetail = {
    totalAmount: "0.00",
    totalQuantity: "0.00"
  }
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedVehicle = "0";
    this.yearList = [];
    this.vehicleList = [];
    this.fuelList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getVehicles()
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getVehicles() {
    let vehicles = JSON.parse(localStorage.getItem("vehicle"));
    let cssClass = "ward-header";
    for (let i = 3; i < vehicles.length; i++) {
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"], cssClass: cssClass });
    }
  }

  changeYearSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    this.selectedYear = filterVal;
    this.changeMonthSelection(this.selectedMonth);
  }

  changeMonthSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    this.fuelList = [];
    this.vehicleFuelList = [];
    this.selectedVehicle = "0";
    this.setActiveClass(-1);
    this.resetVehicleDetail();
    this.selectedMonth = filterVal;
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (i == index) {
        this.vehicleList[i]["cssClass"] = "ward-header-active";
      }
      else {
        this.vehicleList[i]["cssClass"] = "ward-header";
      }
    }
  }

  resetVehicleDetail() {
    this.fuelDetail.totalAmount = "0.00";
    this.fuelDetail.totalQuantity = "0.00";
  }

  getFuelList(vehicle: any, index: any) {
    this.selectedVehicle = vehicle;
    this.setActiveClass(index);
    this.resetVehicleDetail();
    if (this.fuelList.length == 0) {
      const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDieselEntriesData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
      let fuelInstance = this.httpService.get(path).subscribe(data => {
        fuelInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            let obj = data[date];
            let objKeys = Object.keys(obj);
            for (let j = 0; j < objKeys.length; j++) {
              let index = objKeys[j];
              let amount = Number(obj[index]["amount"]);
              let meterReading = obj[index]["meterReading"];
              let quantity = Number(obj[index]["quantity"]);
              let vehicle = obj[index]["vehicle"];
              this.fuelList.push({ vehicle: vehicle, date: date, amount: amount, quantity: quantity, meterReading: meterReading });
            }
          }
          this.getFuelDetail();
        }

      }, error => {
        let dbPath = "DieselEntriesData/" + this.selectedYear + "/" + this.selectedMonthName;
        let fuelInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            fuelInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              for (let i = 0; i < keyArray.length; i++) {
                let date = keyArray[i];
                let obj = data[date];
                let objKeys = Object.keys(obj);
                for (let j = 0; j < objKeys.length; j++) {
                  let index = objKeys[j];
                  let amount = Number(obj[index]["amount"]);
                  let meterReading = obj[index]["meterReading"];
                  let quantity = Number(obj[index]["quantity"]);
                  let vehicle = obj[index]["vehicle"];
                  this.fuelList.push({ vehicle: vehicle, date: date, amount: amount, quantity: quantity, meterReading: meterReading });
                }
              }
              this.getFuelDetail();
            }
          }
        );
      });

    }
    else {
      this.getFuelDetail();
    }
  }

  getFuelDetail() {
    if (this.selectedVehicle != "0") {
      let fuelList = this.fuelList.filter(item => item.vehicle == this.selectedVehicle);
      if (fuelList.length > 0) {
        this.vehicleFuelList = fuelList;
        let sum: number = 0;
        fuelList.forEach(a => sum += a.amount);
        this.fuelDetail.totalAmount = sum.toFixed(2);
        sum = 0;
        fuelList.forEach(a => sum += a.quantity);
        this.fuelDetail.totalQuantity = sum.toFixed(2);
      }
      else {
        this.vehicleFuelList = [];
        this.commonService.setAlertMessage("error", "Sorry! no data found !!!");
      }
    }
  }
}

export class fuelDetail {
  totalQuantity: string;
  totalAmount: string;
}
