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
  ddlYear="#ddlYear";
  ddlMonth="#ddlMonth";
  fuelDetail: fuelDetail = {
    totalAmount: "0.00",
    totalQuantity: "0.00",
    totalMonthAmount: "0.00",
    totalMonthQuantity: "0.00",
    totalDistance: "0.0 KM",
    vehicleName: "---"
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
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
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
    }, 2000);
    this.getFuelMonthData();
  }

  changeYearSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    this.selectedYear = filterVal;
    this.resetAll();
    this.selectedMonth = "0";
    $(this.ddlMonth).val("0");
    //this.changeMonthSelection(this.selectedMonth);
  }

  changeMonthSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 2000);
    this.resetAll();
    this.selectedMonth = filterVal;
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getFuelMonthData();
  }

  resetAll() {
    this.fuelDetail.totalMonthQuantity = "0.00";
    this.fuelDetail.totalMonthAmount = "0.00";
    this.fuelDetail.totalDistance = "0.0 KM";
    this.fuelDetail.vehicleName = "---";
    this.fuelList = [];
    this.trackList = [];
    this.vehicleFuelList = [];
    this.vehicleTrackList = [];
    this.selectedVehicle = "0";
    this.setActiveClass(-1);
    this.resetVehicleDetail();
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
    this.fuelDetail.totalDistance = "0.0 KM";
    this.fuelDetail.vehicleName = "---";
  }

  getFuelList(vehicle: any, index: any) {
    this.selectedVehicle = vehicle;
    this.setActiveClass(index);
    this.resetVehicleDetail();
    this.getFuelDetail();
    this.getTrackDetail();
    this.fuelDetail.vehicleName = vehicle;
  }

  getTrackDetail() {
    $('#divLoader').show();
    this.vehicleTrackList = [];
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FVehicleWardKM%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedVehicle + ".json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            let list = data[date];
            if (list.length > 0) {
              for (let k = 0; k < list.length; k++) {
                let distance = (Number(list[k]["distance"])).toFixed(1) + " KM";
                let orderBy = new Date(date).getTime();
                this.vehicleTrackList.push({ date: date, ward: list[k]["ward"], distance: distance, name: list[k]["name"], orderBy: orderBy, driver: list[k]["driver"], distanceInMeter: Number(list[k]["distance"]) });
              }
            }
          }
          let sum: number = 0;
          this.vehicleTrackList.forEach(a => sum += Number(a.distanceInMeter));
          this.fuelDetail.totalDistance = (sum).toFixed(1) + " KM";
          this.vehicleTrackList = this.vehicleTrackList.sort((a, b) =>
            a.orderBy > b.orderBy ? 1 : -1
          );
        }
        $('#divLoader').hide();
      }
    }, error => {
      this.commonService.setAlertMessage("error", "Sorry! no vehicle ward KM data found !!!");
      $('#divLoader').hide();
    });
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

  updateVehicleRunning() {
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if (this.selectedMonth == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    $('#divLoader').show();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    this.getVehicleRunning(1, days);
  }

  getVehicleRunning(stratDays: any, days: any) {
    let workDetailList = [];
    for (let i = stratDays; i <= days; i++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
      let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
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
                    for (let k = 1; k <= 5; k++) {
                      if (workData[empId]["task" + k] != null) {
                        let ward = workData[empId]["task" + k]["task"];
                        let vehicle = workData[empId]["task" + k]["vehicle"];
                        if (vehicle != "NotApplicable") {
                          let dbLocationPath = "LocationHistory/" + ward + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/TotalCoveredDistance";
                          if (ward.includes("BinLifting")) {
                            dbLocationPath = "LocationHistory/BinLifting/" + vehicle + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/TotalCoveredDistance";
                          }
                          let locationInstance = this.db.object(dbLocationPath).valueChanges().subscribe(
                            locationData => {
                              locationInstance.unsubscribe();
                              let distance = 0;
                              if (locationData != null) {
                                distance = locationData;
                              }
                              let preDetail = workDetailList.find(item => item.date == monthDate && item.ward == ward);
                              if (preDetail == undefined) {
                                let orderBy = new Date(monthDate).getTime();
                                this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                                  let name = employee["name"];
                                  workDetailList.push({ date: monthDate, vehicle: vehicle, ward: ward, distance: distance, empId: empId, orderBy: orderBy, name: name });
                                });
                              }
                            }
                          );
                        }
                      }
                    }
                  }
                });
              }
            }
          }
        }
      );
    }
    setTimeout(() => {
      this.createJSON(workDetailList, days);
      this.commonService.setAlertMessage("success", "Data updated successfully !!!");
      $('#divLoader').hide();
    }, 24000);
  }


  createJSON(workDetailList: any, days: any) {
    if (workDetailList.length > 0) {
      workDetailList = workDetailList.sort((a, b) =>
        b.orderBy > a.orderBy ? -1 : 1
      );
      const data = [];
      const map = new Map();
      for (const item of workDetailList) {
        if (!map.has(item.vehicle)) {
          map.set(item.vehicle, true);    // set any value to Map
          data.push(item.vehicle);
        }
      }
      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let vehicle = data[i];
          let list = workDetailList.filter(item => item.vehicle == vehicle);
          if (list.length > 0) {
            const objDate = {}
            const aa = []
            for (let j = 0; j < list.length; j++) {
              let date = list[j]["date"];
              let list2 = list.filter(item => item.date == date);
              const bb = [];
              if (list2.length > 0) {
                for (let k = 0; k < list2.length; k++) {
                  let distance = Number(list2[k]["distance"]) / 1000;
                  distance = Math.round(distance * 10) / 10;
                  bb.push({ ward: list2[k]["ward"], distance: distance.toFixed(1), driver: list2[k]["empId"], name: list2[k]["name"] });
                }
              }
              objDate[date] = bb;
              aa[j] = objDate[date];
            }
            let filePath = "/VehicleWardKM/" + this.selectedYear + "/" + this.selectedMonthName + "/";
            this.commonService.saveJsonFile(objDate, vehicle+".json", filePath);
          }
        }
      }
    }
  }
}

export class fuelDetail {
  totalQuantity: string;
  totalAmount: string;
  totalMonthQuantity: string;
  totalMonthAmount: string;
  totalDistance: string;
  vehicleName: string;
}
