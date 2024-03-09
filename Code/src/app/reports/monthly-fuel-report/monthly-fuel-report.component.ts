import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-monthly-fuel-report',
  templateUrl: './monthly-fuel-report.component.html',
  styleUrls: ['./monthly-fuel-report.component.scss']
})
export class MonthlyFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }

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
  totalQtyJSON: any;
  totalAmountJSON: any;
  serviceName = "monthly-fuel-report";

  fuelDetail: fuelDetail = {
    totalFuel: "0.00",
    totalKm: "0.000",
    totalAmount: "0.00",
    lastUpdateDate: "---"
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("General-Reports", "Monthly-Fuel-Report", localStorage.getItem("userID"));
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
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"], qty: "0.00", km: "0.000", amount: "0.00", avg: "" });
    }
    this.getFuelData();
  }

  getMonthSummary() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FMonthSummary.json?alt=media";
    let summaryInstance = this.httpService.get(path).subscribe(data => {
      summaryInstance.unsubscribe();
      if (data != null) {
        this.fuelDetail.lastUpdateDate = data["lastUpdateDate"];
        this.fuelDetail.totalKm = data["totalKM"];
        this.fuelDetail.totalFuel = data["qty"];
        this.fuelDetail.totalAmount = data["amount"];
      }
    });
  }

  getFuelData() {
    this.getMonthSummary();
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FVehicleFuel.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let list = JSON.parse(JSON.stringify(data));
        for (let i = 0; i < this.vehicleList.length; i++) {
          let vehicle = this.vehicleList[i]["vehicle"];
          this.getVehicleKM(vehicle);
          this.getVehicleGPSKM(vehicle);
          let vehicleFuelList = list.filter(item => item.vehicle == vehicle);
          if (vehicleFuelList.length > 0) {
            let sumQty: number = vehicleFuelList.map(a => Number(a.quantity)).reduce(function (a, b) {
              return a + b;
            });
            this.vehicleList[i]["qty"] = sumQty.toFixed(2);
            let sumAmount: number = vehicleFuelList.map(a => Number(a.amount)).reduce(function (a, b) {
              return a + b;
            });
            this.vehicleList[i]["amount"] = sumAmount.toFixed(2);
          }
        }
        let totalAmount: number = this.vehicleList.map(a => Number(a.amount)).reduce(function (a, b) {
          return a + b;
        });
        this.fuelDetail.totalAmount = totalAmount.toFixed(2);

        let totalQuantity: number = this.vehicleList.map(a => Number(a.qty)).reduce(function (a, b) {
          return a + b;
        });
        this.fuelDetail.totalFuel = totalQuantity.toFixed(2);
      }
      $(this.divLoader).hide();
    }, error => {
      $(this.divLoader).hide();

    });
  }

  getVehicleKM(vehicle: any) {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FVehicleWardKM%2F" + vehicle + ".json?alt=media";
    let runningKMInstance = this.httpService.get(path).subscribe(runningData => {
      runningKMInstance.unsubscribe();
      if (runningData != null) {
        let totalKM = 0;
        let keyArray = Object.keys(runningData);
        for (let i = 0; i < keyArray.length; i++) {
          let date = keyArray[i];
          let list = JSON.parse(JSON.stringify(runningData[date]));
          for (let j = 0; j < list.length; j++) {
            let distance = list[j]["distance"];
            totalKM += Number(distance);
          }
        }
        let detail = this.vehicleList.find(item => item.vehicle == vehicle);
        if (detail != undefined) {
          detail.km = totalKM.toFixed(3);
          if (detail.qty != "0.00") {
            detail.avg = (Number(detail.km) / Number(detail.qty)).toFixed(2);
          }
        }
      }
    });
  }

  getVehicleGPSKM(vehicle: any) {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FVehicleGPSKM%2F" + vehicle + ".json?alt=media";
    let gpsKMInstance = this.httpService.get(path).subscribe(gpsData => {
      gpsKMInstance.unsubscribe();
      if (gpsData != null) {
        let list = JSON.parse(JSON.stringify(gpsData));
        let distance = 0;
        for (let i = 0; i < list.length; i++) {
          distance += Number(list[i]["distance"]);
        }
        let detail = this.vehicleList.find(item => item.vehicle == vehicle);
        if (detail != undefined) {
          detail.gpsKM = (distance).toFixed(3);
        }
      }
    });
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
      htmlString += "<td>";
      htmlString += "GPS KM Running";
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
        htmlString += "<td>";
        htmlString += this.vehicleList[i]["gpsKM"];
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


  /* ---------- Update JSON Code --------*/

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
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (Number(this.toDayDate.split("-")[1]) == Number(this.selectedMonth)) {
      days = this.toDayDate.split("-")[2];
    }
    for (let i = 0; i < this.vehicleList.length; i++) {
      let vehicle = this.vehicleList[i]["vehicle"];
      this.updateVehicleGPSKMJSON(1, days, vehicle, []);
    }
    this.updateJSONForDieselEntry();
    let workDetailList = [];
    this.getDailyWorkDetail(1, days, workDetailList);
  }

  updateVehicleGPSKMJSON(index: any, days: any, vehicle: any, list: any) {
    if (index == days) {
      let filePath = "/VehicleFuelJSONData/" + this.selectedYear + "/" + this.selectedMonthName + "/";
      this.commonService.saveJsonFile(list, vehicle + ".json", filePath + "VehicleGPSKM/");
    }
    else {
      let date = this.selectedYear + '-' + this.selectedMonth + '-' + (index < 10 ? '0' : '') + index;
      let path = "https://wevois-vts-default-rtdb.firebaseio.com/VehicleRoute/" + vehicle + "/" + date + ".json";
      this.httpService.get(path).subscribe(data => {
        let distance = 0;
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let j = 0; j < keyArray.length - 2; j++) {
            let time = keyArray[j];
            let nextTime = keyArray[j + 1];
            let lat = data[time].split(',')[0];
            let lng = data[time].split(',')[1];
            let nextLat = data[nextTime].split(',')[0];
            let nextLng = data[nextTime].split(',')[1];
            distance = distance + Number(this.commonService.getDistanceFromLatLonInKm(lat, lng, nextLat, nextLng));

          }
        }
        if (distance > 0) {
          list.push({ date: date, distance: (distance / 1000).toFixed(3) });
        }
        index++
        this.updateVehicleGPSKMJSON(index, days, vehicle, list);
      });



    }
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
          this.fuelDetail.totalKm = totalKM.toFixed(3);
          this.fuelDetail.totalAmount = this.totalAmountJSON.toFixed(2);
          this.fuelDetail.totalFuel = this.totalQtyJSON.toFixed(2);
          let lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
          this.fuelDetail.lastUpdateDate = lastUpdateDate;
          const obj = { "totalKM": totalKM.toFixed(3), "qty": this.totalQtyJSON.toFixed(2), "amount": this.totalAmountJSON.toFixed(2), "lastUpdateDate": lastUpdateDate };
          this.commonService.saveJsonFile(obj, "MonthSummary.json", filePath);
          this.commonService.setAlertMessage("success", "Data updated successfully !!!");
          this.getMonthDays();
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
      this.commonService.getStorageLocationHistory(dbLocationPath).then((response)=>{
        if (response["status"] == "Fail") {
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
        else{
          let distance = "0";
          let locationData=response["data"];
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

        }
      });
      
    }
  }
}

export class fuelDetail {
  totalFuel: string;
  totalKm: string;
  totalAmount: string;
  lastUpdateDate: string;
}
