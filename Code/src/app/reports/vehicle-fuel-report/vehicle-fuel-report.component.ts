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
  trackList: any[];
  vehicleTrackList: any[];
  fuelDetail: fuelDetail = {
    totalAmount: "0.00",
    totalQuantity: "0.00",
    totalMonthAmount: "0.00",
    totalMonthQuantity: "0.00"
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
    this.vehicleTrackList = [];
    this.fuelList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getVehicles();
  }

  getFuelMonthData() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDieselEntriesData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        let totalAmount = 0;
        let totalQuantity = 0;
        for (let i = 0; i < keyArray.length; i++) {
          let date = keyArray[i];
          let obj = data[date];
          let objKeys = Object.keys(obj);
          for (let j = 0; j < objKeys.length - 1; j++) {
            let index = objKeys[j];
            let amount = 0;
            if (obj[index]["amount"] != null) {
              amount = Number(obj[index]["amount"]);
            }
            let quantity = 0;
            if (obj[index]["quantity"] != null) {
              quantity = Number(obj[index]["quantity"]);
            }
            let meterReading = obj[index]["meterReading"];
            let vehicle = obj[index]["vehicle"];
            totalAmount += amount;
            totalQuantity += quantity;
            let orderBy = new Date(date).getTime();
            this.fuelList.push({ vehicle: vehicle, date: date, orderBy: orderBy, amount: amount.toFixed(2), quantity: quantity.toFixed(2), meterReading: meterReading });
            let detail = this.vehicleList.find(item => item.vehicle == vehicle);
            if (detail != undefined) {
              detail.isEntry = 1;
              detail.cssClass = "ward-header";
            }
          }
          this.fuelList = this.fuelList.sort((a, b) =>
            a.orderBy > b.orderBy ? 1 : -1
          );
          this.fuelDetail.totalMonthAmount = totalAmount.toFixed(2);
          this.fuelDetail.totalMonthQuantity = totalQuantity.toFixed(2);
        }
        this.vehicleList = this.vehicleList.sort((a, b) =>
          a.isEntry > b.isEntry ? -1 : 1
        );
      }
    }, error => {
      let dbPath = "DieselEntriesData/" + this.selectedYear + "/" + this.selectedMonthName;
      let fuelInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          fuelInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            let totalAmount = 0;
            let totalQuantity = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let date = keyArray[i];
              let obj = data[date];
              let objKeys = Object.keys(obj);
              for (let j = 0; j < objKeys.length - 1; j++) {
                let index = objKeys[j];
                let amount = 0;
                if (obj[index]["amount"] != null) {
                  amount = Number(obj[index]["amount"]);
                }
                let quantity = 0;
                if (obj[index]["quantity"] != null) {
                  quantity = Number(obj[index]["quantity"]);
                }
                let meterReading = obj[index]["meterReading"];
                let vehicle = obj[index]["vehicle"];
                totalAmount = totalAmount + amount;
                totalQuantity = totalQuantity + quantity;
                let orderBy = new Date(date).getTime();
                this.fuelList.push({ vehicle: vehicle, date: date, orderBy: orderBy, amount: amount.toFixed(2), quantity: quantity.toFixed(2), meterReading: meterReading });
                let detail = this.vehicleList.find(item => item.vehicle == vehicle);
                if (detail != undefined) {
                  detail.isEntry = 1;
                  detail.cssClass = "ward-header";
                }
              }
            }
            this.fuelList = this.fuelList.sort((a, b) =>
              b.orderBy > a.orderBy ? -1 : 1
            );
            this.fuelDetail.totalMonthAmount = totalAmount.toFixed(2);
            this.fuelDetail.totalMonthQuantity = totalQuantity.toFixed(2);
          }
          this.vehicleList = this.vehicleList.sort((a, b) =>
            a.isEntry > b.isEntry ? -1 : 1
          );
        }
      );
    });
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
    let cssClass = "";
    for (let i = 3; i < vehicles.length; i++) {
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"], cssClass: cssClass, isEntry: 0 });
    }
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 6000);
    this.getFuelMonthData();
    this.getVehicleTracking();
  }

  getVehicleTracking() {
    this.trackList = [];
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FVehicleTrack%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2Ftrack.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        console.log(data);
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let vehicle = keyArray[i];
            if (vehicle != "updateDate") {
              let obj = data[vehicle];
              let dateArray = Object.keys(obj);
              if (dateArray.length > 0) {
                for (let j = 0; j < dateArray.length; j++) {
                  let date = dateArray[j];
                  let list = obj[date];
                  if (list.length > 0) {
                    for (let k = 0; k < list.length; k++) {
                      this.commonService.getEmplyeeDetailByEmployeeId(list[k]["driver"]).then((employee) => {
                        let name = employee["name"];
                        let distance = (Number(list[k]["distance"]) / 1000).toFixed(3) + " KM";
                        let orderBy = new Date(date).getTime();
                        this.trackList.push({ vehicle: vehicle, date: date, ward: list[k]["ward"], distance: distance, name: name,orderBy:orderBy, driver:list[k]["driver"] });
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
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
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 6000);
    this.fuelDetail.totalMonthQuantity = "0.00";
    this.fuelDetail.totalMonthAmount = "0.00";
    this.fuelList = [];
    this.trackList=[];
    this.vehicleFuelList = [];
    this.vehicleTrackList = [];
    this.selectedVehicle = "0";
    this.setActiveClass(-1);
    this.resetVehicleDetail();
    this.selectedMonth = filterVal;
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getFuelMonthData();
    this.getVehicleTracking();
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (index == -1) {
        this.vehicleList[i]["cssClass"] = "";
        this.vehicleList[i]["isEntry"] = 0;
      }
      else if (i == index) {
        this.vehicleList[i]["cssClass"] = "ward-header-active";
      }
      else {
        if (this.vehicleList[i]["cssClass"] != "") {
          this.vehicleList[i]["cssClass"] = "ward-header";
        }
      }
    }
  }

  resetVehicleDetail() {
    this.vehicleFuelList = [];
    this.fuelDetail.totalAmount = "0.00";
    this.fuelDetail.totalQuantity = "0.00";
  }

  getFuelList(vehicle: any, index: any) {
    this.selectedVehicle = vehicle;
    this.setActiveClass(index);
    this.resetVehicleDetail();
    this.getFuelDetail();
    this.getTrackDetail();
  }

  getTrackDetail() {
    this.vehicleTrackList = [];
    if (this.selectedVehicle != "0") {
      let trackList = this.trackList.filter(item => item.vehicle == this.selectedVehicle);
      if (trackList.length > 0) {
        this.vehicleTrackList = trackList;        
        this.vehicleTrackList = this.vehicleTrackList.sort((a, b) =>
        a.orderBy > b.orderBy ? 1 : -1
      );
      }
      else {
        this.commonService.setAlertMessage("error", "Sorry! no data found !!!");
      }
    }
  }

  getFuelDetail() {
    if (this.selectedVehicle != "0") {
      let fuelList = this.fuelList.filter(item => item.vehicle == this.selectedVehicle);
      if (fuelList.length > 0) {
        this.vehicleFuelList = fuelList;
        let sum: number = 0;
        fuelList.forEach(a => sum += Number(a.amount));
        this.fuelDetail.totalAmount = sum.toFixed(2);
        sum = 0;
        fuelList.forEach(a => sum += Number(a.quantity));
        this.fuelDetail.totalQuantity = sum.toFixed(2);
      }
      else {
        this.commonService.setAlertMessage("error", "Sorry! no data found !!!");
      }
    }
  }
}

export class fuelDetail {
  totalQuantity: string;
  totalAmount: string;
  totalMonthQuantity: string;
  totalMonthAmount: string;
}
