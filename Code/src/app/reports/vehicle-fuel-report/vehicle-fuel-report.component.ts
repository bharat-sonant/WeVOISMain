import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-vehicle-fuel-report',
  templateUrl: './vehicle-fuel-report.component.html',
  styleUrls: ['./vehicle-fuel-report.component.scss']
})
export class VehicleFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }
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
    totalDistance: "0.000 KM",
    vehicleName: "---",
    vehicleKM: "0.000",
    lastUpdateDate: "---"
  }


  totalQtyJSON: any;
  totalAmountJSON: any;
  totalRunningKMJSON: any;
  serviceName = "vehicle-fuel-report";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("General-Reports","Vehicle-Fuel-Report",localStorage.getItem("userID"));
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
    $('#divLoader').show();
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FVehicleFuel.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let totalAmount = 0;
        let totalQuantity = 0;
        let list = JSON.parse(JSON.stringify(data));
        for (let i = 0; i < list.length; i++) {
          let date = list[i]["date"];
          let vehicle = list[i]["vehicle"];
          let amount = Number(list[i]["amount"]);
          let quantity = Number(list[i]["quantity"]);
          let meterReading = list[i]["meterReading"];
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
        this.vehicleList = this.vehicleList.sort((a, b) =>
          a.isEntry > b.isEntry ? -1 : 1
        );
      }
      $('#divLoader').hide();
    }, error => {      
      $('#divLoader').hide();
      this.commonService.setAlertMessage("error", "No Record found. Please sync from top rigth side !!!");
    });
  }

  getMonthSummary() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FMonthSummary.json?alt=media";
    let summaryInstance = this.httpService.get(path).subscribe(data => {
      summaryInstance.unsubscribe();
      if (data != null) {
        this.fuelDetail.lastUpdateDate = data["lastUpdateDate"];
        this.fuelDetail.vehicleKM = data["totalKM"];
        this.fuelDetail.totalMonthQuantity = data["qty"];
        this.fuelDetail.totalMonthAmount = data["amount"];
      }
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
    this.getFuelMonthData();
    this.getMonthSummary();
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
    this.getMonthSummary();
  }

  resetAll() {
    this.fuelDetail.totalMonthQuantity = "0.00";
    this.fuelDetail.totalMonthAmount = "0.00";
    this.fuelDetail.totalDistance = "0.000 KM";
    this.fuelDetail.vehicleName = "---";
    this.fuelDetail.vehicleKM = "0.000";
    this.fuelDetail.lastUpdateDate = "---";
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
    this.fuelDetail.totalDistance = "0.000 KM";
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
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FVehicleWardKM%2F" + this.selectedVehicle + ".json?alt=media";

    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        let totalDistance = 0;

        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            let list = data[date];
            if (list.length > 0) {
              for (let k = 0; k < list.length; k++) {
                let distance = (Number(list[k]["distance"])) + " KM";
                totalDistance += Number(list[k]["distance"]);
                let orderBy = new Date(date).getTime();
                if (list[k]["ward"].includes("BinLifting")) {
                  let detail = this.vehicleTrackList.find(item => item.date == date && item.ward.includes("BinLifting"));
                  if (detail == undefined) {
                    this.vehicleTrackList.push({ date: date, ward: list[k]["ward"], distance: distance, name: list[k]["name"], orderBy: orderBy, driver: list[k]["driver"], distanceInMeter: Number(list[k]["distance"]) });
                  }
                  else {
                    detail.ward = detail.ward + ", " + list[k]["ward"];
                    detail.distance = (Number(detail.distance.replace("KM", "")) + Number(distance.replace("KM", ""))) + " KM";
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
          this.fuelDetail.totalDistance = (totalDistance).toFixed(3) + " KM";
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

  getDailyWorkDetail(startDays: any, days: any, workDetailList: any) {
    if (startDays > days) {
      let vehicleLengthList = [];
      let vehicleDistinctList = workDetailList.map(item => item.vehicle)
        .filter((value, index, self) => self.indexOf(value) === index);
      for (let i = 0; i < vehicleDistinctList.length; i++) {
        let vehicle = vehicleDistinctList[i];
        let vehicleWorkList = workDetailList.filter(item => item.vehicle == vehicle);
        vehicleLengthList.push({ vehicle: vehicle, length: vehicleWorkList.length, km: 0 });
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
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDailyWorkDetail");
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (startDays < 10 ? '0' : '') + startDays;
      let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
      let workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        workData => {
          workDetailInstance.unsubscribe();
          if (workData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDailyWorkDetail", workData);
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
      const aa = [];
      for (let j = 0; j < vehicleWorkList.length; j++) {
        let date = vehicleWorkList[j]["date"];
        let list2 = vehicleWorkList.filter(item => item.date == date);
        const bb = [];
        if (list2.length > 0) {
          for (let k = 0; k < list2.length; k++) {
            let distance = Number(list2[k]["distance"]);
            bb.push({ ward: list2[k]["zone"], distance: distance.toFixed(3), driver: list2[k]["empId"], name: list2[k]["name"] });
          }
        }
        objDate[date] = bb;
        aa[j] = objDate[date];
      }

      let vehicleRunningKM = 0;
      let keyArray = Object.keys(objDate);
      for (let i = 0; i < keyArray.length; i++) {
        let key = keyArray[i];
        let list = objDate[key];
        for (let j = 0; j < list.length; j++) {
          vehicleRunningKM = Number(vehicleRunningKM) + Number(list[j]["distance"]);
        }
      }

      vehicleLengthList[index]["km"] = vehicleRunningKM.toFixed(3);
      let filePath = "/VehicleFuelJSONData/" + this.selectedYear + "/" + this.selectedMonthName + "/";
      this.commonService.saveJsonFile(objDate, vehicle + ".json", filePath + "VehicleWardKM/");
      if (index == vehicleLengthList.length - 1) {
        setTimeout(() => {
          $('#divLoader').hide();
          let totalKM = 0;
          for (let i = 0; i < vehicleLengthList.length; i++) {
            totalKM = totalKM + Number(vehicleLengthList[i]["km"]);
          }
          this.fuelDetail.vehicleKM = totalKM.toFixed(3);
          this.fuelDetail.totalMonthAmount=this.totalAmountJSON.toFixed(2);
          this.fuelDetail.totalMonthQuantity=this.totalQtyJSON.toFixed(2);
          let lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
          this.fuelDetail.lastUpdateDate = lastUpdateDate;
          const obj = { "totalKM": totalKM.toFixed(3), "qty": this.totalQtyJSON.toFixed(2), "amount": this.totalAmountJSON.toFixed(2), "lastUpdateDate": lastUpdateDate };
          this.commonService.saveJsonFile(obj, "MonthSummary.json", filePath);
          this.commonService.setAlertMessage("success","Data updated successfully !!!");
          this.getFuelMonthData();
        }, 6000);

      }
    }
    else {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardRunningDistance");
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
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardRunningDistance", locationData);
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

  updateJSONData() {
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
    this.resetAll();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (Number(this.toDayDate.split("-")[1]) == Number(this.selectedMonth)) {
      days = this.toDayDate.split("-")[2];
    }
    this.updateJSONForDieselEntry();
    let workDetailList = [];
    this.getDailyWorkDetail(1, days, workDetailList);
  }

  updateJSONForDieselEntry() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateJSONForDieselEntry");
    this.totalQtyJSON = 0;
    this.totalAmountJSON = 0;
    let dbPath = "DieselEntriesData/" + this.selectedYear + "/" + this.selectedMonthName;
    let fuelInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        fuelInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateJSONForDieselEntry", data);
          let fuelList = [];
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
              let quantity = 0;
              let vehicle = obj[index]["vehicle"];
              if (obj[index]["amount"] != null) {
                amount = Number(obj[index]["amount"]);
              }
              if (obj[index]["quantity"] != null) {
                quantity = Number(obj[index]["quantity"]);
              }
              let meterReading = "00";
              if (obj[index]["meterReading"] != null) {
                meterReading = obj[index]["meterReading"];
              }
              totalAmount = totalAmount + amount;
              totalQuantity = totalQuantity + quantity;
              let orderBy = new Date(date).getTime();
              fuelList.push({ vehicle: vehicle, date: date, orderBy: orderBy, amount: amount.toFixed(2), quantity: quantity.toFixed(2), meterReading: meterReading });

            }
            fuelList = fuelList.sort((a, b) => b.orderBy > a.orderBy ? -1 : 1);
          }
          this.totalAmountJSON = totalAmount;
          this.totalQtyJSON = totalQuantity;
          let filePath = "/VehicleFuelJSONData/" + this.selectedYear + "/" + this.selectedMonthName + "/";
          this.commonService.saveJsonFile(fuelList, "VehicleFuel.json", filePath);
        }
      });
  }
}

export class fuelDetail {
  totalQuantity: string;
  totalAmount: string;
  totalMonthQuantity: string;
  totalMonthAmount: string;
  totalDistance: string;
  vehicleName: string;
  vehicleKM: string;
  lastUpdateDate: string;
}
