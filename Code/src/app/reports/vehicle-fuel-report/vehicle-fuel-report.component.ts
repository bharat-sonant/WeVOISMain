import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-vehicle-fuel-report',
  templateUrl: './vehicle-fuel-report.component.html',
  styleUrls: ['./vehicle-fuel-report.component.scss']
})
export class VehicleFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
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
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
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
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
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
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleWardKM%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedVehicle + ".json?alt=media";

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
                if (list[k]["ward"].includes("BinLifting")) {
                  let detail = this.vehicleTrackList.find(item => item.date == date && item.ward.includes("BinLifting"));
                  if (detail == undefined) {
                    this.vehicleTrackList.push({ date: date, ward: list[k]["ward"], distance: distance, name: list[k]["name"], orderBy: orderBy, driver: list[k]["driver"], distanceInMeter: Number(list[k]["distance"]) });
                  }
                  else {
                    detail.ward = detail.ward + ", " + list[k]["ward"];
                    detail.distance = (Number(detail.distance.replace("KM", "")) + Number(distance.replace("KM", ""))).toFixed(1) + " KM";
                    if (!detail.name.includes(list[k]["name"])) {
                      detail.name = detail.name + ", " + list[k]["name"];
                    }
                  }
                }
                else {
                  this.vehicleTrackList.push({ date: date, ward: list[k]["ward"], distance: distance, name: list[k]["name"], orderBy: orderBy, driver: list[k]["driver"], distanceInMeter: Number(list[k]["distance"]) });
                }
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
    if (Number(this.toDayDate.split("-")[1]) == Number(this.selectedMonth)) {
      days = this.toDayDate.split("-")[2];
    }

    let workDetailList = [];
    this.getDailyWorkDetail(1, days, workDetailList);
  }

  getDailyWorkDetail(startDays: any, days: any, workDetailList: any) {
    if (startDays > days) {
      let vehicleLengthList = [];
      let vehicleDistinctList = workDetailList.map(item => item.vehicle)
        .filter((value, index, self) => self.indexOf(value) === index);
      for (let i = 0; i < vehicleDistinctList.length; i++) {
        let vehicle = vehicleDistinctList[i];
        let vehicleWorkList = workDetailList.filter(item => item.vehicle == vehicle);
        vehicleLengthList.push({ vehicle: vehicle, length: vehicleWorkList.length });
        vehicleLengthList = vehicleLengthList.sort((a, b) =>
        b.length > a.length ? -1 : 1
      );
      }      
      
      for (let i = 0; i < vehicleLengthList.length; i++) {
        let vehicle = vehicleLengthList[i]["vehicle"];
        let vehicleWorkList = workDetailList.filter(item => item.vehicle == vehicle);
        if (vehicleWorkList.length > 0) {
          vehicleWorkList = vehicleWorkList.sort((a, b) => b.orderBy > a.orderBy ? -1 : 1);
          this.getWardRunningDistance(0, i, vehicleWorkList, workDetailList, vehicleLengthList);
        }
      }
      
    }
    else {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (startDays < 10 ? '0' : '') + startDays;
      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDailyWorkDetail%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + monthDate + ".json?alt=media";
      let workDetailInstance = this.httpService.get(path).subscribe(workData => {
        workDetailInstance.unsubscribe();
        if (workData != null) {
          let keyArray = Object.keys(workData);
          if (keyArray.length > 0) {
            this.getEmployeeDetail(0, keyArray, workData, startDays, days, workDetailList, monthDate);
          }
          else {
            startDays++;
            this.getDailyWorkDetail(startDays, days, workDetailList);
          }
        }
        else {
          startDays++;
          this.getDailyWorkDetail(startDays, days, workDetailList);
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
              let keyArray = Object.keys(workData);
              if (keyArray.length > 0) {
                this.getEmployeeDetail(0, keyArray, workData, startDays, days, workDetailList, monthDate);
              }
              else {
                startDays++;
                this.getDailyWorkDetail(startDays, days, workDetailList);
              }
            }
            else {
              startDays++;
              this.getDailyWorkDetail(startDays, days, workDetailList);
            }
          });
      });
    }
  }

  getEmployeeDetail(index: any, keyArray: any, workData: any, startDays: any, days: any, workDetailList: any, monthDate: any) {
    if (index == keyArray.length) {
      startDays++;
      this.getDailyWorkDetail(startDays, days, workDetailList);
    }
    else {
      let empId = keyArray[index];
      this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
        if (employee["designation"] == "Transportation Executive") {
          let name = employee["name"];
          for (let k = 1; k <= 5; k++) {
            if (workData[empId]["task" + k] != null) {
              let zone = workData[empId]["task" + k]["task"];
              let vehicle = workData[empId]["task" + k]["vehicle"];
              let startTime = "";
              let endTime = "";
              if (vehicle != "NotApplicable") {
                let task = "task" + k;
                if (workData[empId][task]["in-out"] != null) {
                  let data = workData[empId]["task" + k]["in-out"];
                  let inOutKeyArray = Object.keys(data);
                  for (let i = 0; i < inOutKeyArray.length; i++) {
                    let time = inOutKeyArray[i];
                    if (data[time] == "In") {
                      startTime = time.split(":")[0] + ":" + time.split(":")[1];
                    }
                  }
                  for (let i = inOutKeyArray.length - 1; i >= 0; i--) {
                    let time = inOutKeyArray[i];
                    if (data[time] == "Out") {
                      endTime = time.split(":")[0] + ":" + time.split(":")[1];
                    }
                  }
                }
                let orderBy = new Date(monthDate).getTime();
                workDetailList.push({ date: monthDate, vehicle: vehicle, zone: zone, task: task, name: name, empId: empId, startTime: startTime, endTime: endTime, orderBy: orderBy, distance: 0 });
              }
            }
          }
        }
        index++;
        this.getEmployeeDetail(index, keyArray, workData, startDays, days, workDetailList, monthDate);
      });
    }
  }


  getWardRunningDistance(listIndex: any, index: any, vehicleWorkList: any, workDetailList: any, vehicleLengthList: any) {
    if (listIndex == vehicleWorkList.length) {
      let vehicle = vehicleLengthList[index]["vehicle"];
      const objDate = {}
      const aa = []
      for (let j = 0; j < vehicleWorkList.length; j++) {
        let date = vehicleWorkList[j]["date"];
        let list2 = vehicleWorkList.filter(item => item.date == date);
        const bb = [];
        if (list2.length > 0) {
          for (let k = 0; k < list2.length; k++) {
            let distance = Number(list2[k]["distance"]);
            distance = Math.round(distance * 10) / 10;
            bb.push({ ward: list2[k]["zone"], distance: distance.toFixed(1), driver: list2[k]["empId"], name: list2[k]["name"] });
          }
        }
        objDate[date] = bb;
        aa[j] = objDate[date];
      }
      let filePath = "/VehicleWardKM/" + this.selectedYear + "/" + this.selectedMonthName + "/";
      this.commonService.saveJsonFile(objDate, vehicle + ".json", filePath);
      if (index == vehicleLengthList.length - 1) {
        setTimeout(() => {
          $('#divLoader').hide();

        }, 6000);

      }
    }
    else {
      let date = vehicleWorkList[listIndex]["date"];
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      let zone = vehicleWorkList[listIndex]["zone"];
      let vehicle = vehicleWorkList[listIndex]["vehicle"];
      let startTime = vehicleWorkList[listIndex]["startTime"];
      let endTime = vehicleWorkList[listIndex]["endTime"];
      if (endTime == "") {
        endTime = "23:59";
      }
      let dbLocationPath = "";
      if (zone.includes("BinLifting")) {
        dbLocationPath = "LocationHistory/BinLifting/" + vehicle + "/" + year + "/" + monthName + "/" + date;
      }
      else {
        dbLocationPath = "LocationHistory/" + zone + "/" + year + "/" + monthName + "/" + date;
      }
      let locationInstance = this.db.object(dbLocationPath).valueChanges().subscribe(
        locationData => {
          locationInstance.unsubscribe();
          let distance = "0";
          if (locationData != null) {
            let keyArray = Object.keys(locationData);
            if (keyArray.length > 0) {
              let startDate = new Date(date + " " + startTime);
              let endDate = new Date(date + " " + endTime);
              let diffMs = endDate.getTime() - startDate.getTime(); // milliseconds between now & Christmas
              if (diffMs < 0) {
                endDate = new Date(this.commonService.getNextDate(date, 1) + " " + endTime);
                diffMs = endDate.getTime() - startDate.getTime();
              }
              let diffMins = Math.round(diffMs / 60000); // minutes
              for (let i = 0; i <= diffMins; i++) {
                let locationList = keyArray.filter(item => item.includes(startTime));
                if (locationList.length > 0) {
                  for (let j = 0; j < locationList.length; j++) {
                    if (locationData[locationList[j]]["distance-in-meter"] != null) {
                      let coveredDistance = locationData[locationList[j]]["distance-in-meter"];
                      distance = (Number(distance) + Number(coveredDistance)).toFixed(0);
                    }
                  }
                }
                startDate = new Date(startDate.setMinutes(startDate.getMinutes() + 1));
                startTime = (startDate.getHours() < 10 ? '0' : '') + startDate.getHours() + ":" + (startDate.getMinutes() < 10 ? '0' : '') + startDate.getMinutes();
              }
              if (distance != "0") {
                vehicleWorkList[listIndex]["distance"] = (Number(distance) / 1000).toFixed(3);
              }
            }
          }
          listIndex++;
          this.getWardRunningDistance(listIndex, index, vehicleWorkList, workDetailList, vehicleLengthList);
        });
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
