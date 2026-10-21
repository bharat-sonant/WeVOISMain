import { Component, OnInit, NgZone } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-monthly-fuel-report',
  templateUrl: './monthly-fuel-report.component.html',
  styleUrls: ['./monthly-fuel-report.component.scss']
})
export class MonthlyFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient, private zone: NgZone) { }

  cityName: any;
  db: any;
  vehicleList: any[] = [];
  fromDate: any;
  toDate: any;
  toDayDate: any;
  divLoader = "#divLoader";
  isFileSaved: any;
  totalQtyJSON: any;
  totalCNGQtyJSON: any;
  totalPetrolQtyJSON: any;
  totalDieselQtyJSON: any;
  totalAmountJSON: any;
  serviceName = "monthly-fuel-report";
  loadRequestId = 0;
  syncMonthList: any[] = [];
  syncMonthIndex = 0;
  petrolPumpList: any[] = [];
  allPetrolPumpList: any[] = [];
  selectedPetrolPump = "0";
  selectedFuelType = "0";
  rangeFuelList: any[] = [];
  displayVehicleList: any[] = [];
  isNoFilteredData = false;
  regNoList: any = {};

  fuelDetail: fuelDetail = {
    totalFuel: "0.00",
    totalCNGFuel: "0.00",
    totalPetrolFuel: "0.00",
    totalDieselFuel: "0.00",
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
    this.fromDate = this.toDayDate.split('-')[0] + "-" + this.toDayDate.split('-')[1] + "-01";
    this.toDate = this.toDayDate;
    this.getPetrolPumpList();
    this.getRegistrationNumbers();
    this.getFuelReport();
  }

  // Pump list is loaded in every city, irrespective of Settings/FuelEntry/isApplyPetrolPumpDetail.
  getPetrolPumpList() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FFuelSettingData%2FpetrolPump.json?alt=media";
    let petrolPumpInstance = this.httpService.get(path).subscribe(data => {
      petrolPumpInstance.unsubscribe();
      if (data != null) {
        let list = JSON.parse(JSON.stringify(data));
        for (let i = 0; i < list.length; i++) {
          this.allPetrolPumpList.push(list[i].toString().trim());
        }
        this.setPetrolPumpList();
      }
    }, error => { });
  }

  // Dropdown shows only pumps present in the loaded date range data, in petrolPump.json order;
  // pumps found in data but missing from petrolPump.json are added at the end.
  setPetrolPumpList() {
    let dataPumpList = [];
    for (let i = 0; i < this.rangeFuelList.length; i++) {
      let petrolPump = this.rangeFuelList[i]["petrolPump"] != undefined ? this.rangeFuelList[i]["petrolPump"].toString().trim() : "";
      if (petrolPump != "" && !dataPumpList.includes(petrolPump)) {
        dataPumpList.push(petrolPump);
      }
    }
    let pumpList = this.allPetrolPumpList.filter(name => dataPumpList.includes(name));
    pumpList = pumpList.concat(dataPumpList.filter(name => !pumpList.includes(name)));
    this.petrolPumpList = pumpList.filter((name, index) => pumpList.indexOf(name) == index).map(name => ({ name: name }));
    if (this.selectedPetrolPump != "0" && this.petrolPumpList.find(item => item.name == this.selectedPetrolPump) == undefined) {
      this.selectedPetrolPump = "0";
      setTimeout(() => { $("#ddlPetrolPump").val("0"); });
    }
  }

  changePetrolPump(filterVal: any) {
    this.selectedPetrolPump = filterVal;
    this.setVehicleFuelDetail();
  }

  changeFuelType(filterVal: any) {
    this.selectedFuelType = filterVal;
    this.setVehicleFuelDetail();
  }

  changeFromDate(filterVal: any) {
    this.fromDate = filterVal;
    this.resetPetrolPumpFilter();
    this.getFuelReport();
  }

  changeToDate(filterVal: any) {
    this.toDate = filterVal;
    this.resetPetrolPumpFilter();
    this.getFuelReport();
  }

  // New date range starts with all pumps.
  resetPetrolPumpFilter() {
    this.selectedPetrolPump = "0";
    $("#ddlPetrolPump").val("0");
  }

  isValidDateRange() {
    if (this.fromDate == undefined || this.fromDate == "") {
      this.commonService.setAlertMessage("error", "Please select from date !!!");
      return false;
    }
    if (this.toDate == undefined || this.toDate == "") {
      this.commonService.setAlertMessage("error", "Please select to date !!!");
      return false;
    }
    if (this.fromDate > this.toDate) {
      this.commonService.setAlertMessage("error", "From date can not be greater than to date !!!");
      return false;
    }
    if (this.toDate > this.toDayDate) {
      this.commonService.setAlertMessage("error", "To date can not be greater than today !!!");
      return false;
    }
    return true;
  }

  // Data is stored month wise, so every month touched by the date range is read and then filtered by date.
  getMonthListInRange() {
    let monthList = [];
    let year = Number(this.fromDate.split('-')[0]);
    let month = Number(this.fromDate.split('-')[1]);
    let toYear = Number(this.toDate.split('-')[0]);
    let toMonth = Number(this.toDate.split('-')[1]);
    while (year < toYear || (year == toYear && month <= toMonth)) {
      monthList.push({ year: year.toString(), month: (month < 10 ? '0' : '') + month, monthName: this.commonService.getCurrentMonthName(month - 1) });
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    return monthList;
  }

  isDateInRange(date: any) {
    return date >= this.fromDate && date <= this.toDate;
  }

  getFuelReport() {
    this.loadRequestId++;
    this.isFileSaved = false;
    this.fuelDetail.totalFuel = "0.00";
    this.fuelDetail.totalKm = "0.000";
    this.fuelDetail.totalAmount = "0.00";
    this.fuelDetail.lastUpdateDate = "---";
    this.vehicleList = [];
    this.displayVehicleList = [];
    this.isNoFilteredData = false;
    this.rangeFuelList = [];
    if (!this.isValidDateRange()) {
      $(this.divLoader).hide();
      return;
    }
    $(this.divLoader).show();
    this.getVehicles();
  }

  getVehicles() {
    let vehicles = JSON.parse(localStorage.getItem("vehicle"));
    for (let i = 3; i < vehicles.length; i++) {
      let vehicle = vehicles[i]["vehicle"];
      this.vehicleList.push({ vehicle: vehicle, qty: "0.00", km: "0.000", amount: "0.00", avg: "", fuelList: [], pumpList: [], regNo: this.regNoList[vehicle] != undefined ? this.regNoList[vehicle] : "" });
    }
    this.getFuelData();
  }

  // Registration numbers of all vehicles are read once (one read of VehicleDetails instead of one read per vehicle).
  getRegistrationNumbers() {
    if (localStorage.getItem('userType') !== 'Internal User') {
      return;
    }
    let regNoInstance = this.db.object("VehicleDetails").valueChanges().subscribe((data: any) => {
      regNoInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          if (data[keyArray[i]] != null && data[keyArray[i]]["regNumber"] != undefined) {
            this.regNoList[keyArray[i]] = data[keyArray[i]]["regNumber"];
          }
        }
        for (let i = 0; i < this.vehicleList.length; i++) {
          let regNo = this.regNoList[this.vehicleList[i]["vehicle"]];
          if (regNo != undefined) { this.vehicleList[i]["regNo"] = regNo; }
        }
      }
    });
  }

  getStorageJSON(monthDetail: any, fileName: any) {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleFuelJSONData%2F" + monthDetail.year + "%2F" + monthDetail.monthName + "%2F" + fileName + "?alt=media";
    return this.httpService.get(path).pipe(catchError(() => of(null)));
  }

  getMonthSummary(requestId: any, monthList: any) {
    // "Last Update" is shown from the summary of the To Date's month.
    this.getStorageJSON(monthList[monthList.length - 1], "MonthSummary.json").subscribe(data => {
      if (requestId != this.loadRequestId) { return; }
      if (data != null) {
        this.fuelDetail.lastUpdateDate = data["lastUpdateDate"];
      }
    });
  }

  getFuelData() {
    let requestId = this.loadRequestId;
    let monthList = this.getMonthListInRange();
    this.getMonthSummary(requestId, monthList);
    forkJoin(monthList.map(monthDetail => this.getStorageJSON(monthDetail, "VehicleFuel.json"))).subscribe((monthData: any[]) => {
      if (requestId != this.loadRequestId) { return; }
      let list = [];
      for (let i = 0; i < monthData.length; i++) {
        if (monthData[i] != null) {
          list = list.concat(JSON.parse(JSON.stringify(monthData[i])));
        }
      }
      this.rangeFuelList = list.filter(item => this.isDateInRange(item.date));
      this.setPetrolPumpList();
      this.setVehicleFuelDetail();
      $(this.divLoader).hide();
      this.getVehicleKMData(requestId, monthList);
    });
  }

  // Pump and fuel type filters apply on already loaded entries, so changing them does not fetch again.
  setVehicleFuelDetail() {
    let list = this.rangeFuelList.filter(item =>
      (this.selectedPetrolPump == "0" || (item.petrolPump != undefined && item.petrolPump.toString().trim() == this.selectedPetrolPump)) &&
      (this.selectedFuelType == "0" || item.fuelType == this.selectedFuelType));
    for (let i = 0; i < this.vehicleList.length; i++) {
      this.vehicleList[i]["qty"] = "0.00";
      this.vehicleList[i]["amount"] = "0.00";
      this.vehicleList[i]["fuelList"] = [];
      this.vehicleList[i]["pumpList"] = [];
      let vehicle = this.vehicleList[i]["vehicle"];
      let vehicleFuelList = list.filter(item => item.vehicle == vehicle);
      this.vehicleList[i]["entryCount"] = vehicleFuelList.length;
      if (vehicleFuelList.length > 0) {
        let fuelList = [];
        let pumpList = [];
        for (let i = 0; i < vehicleFuelList.length; i++) {
          let petrolPump = vehicleFuelList[i]["petrolPump"] != undefined ? vehicleFuelList[i]["petrolPump"].toString().trim() : "";
          if (petrolPump != "") {
            let pumpDetail = pumpList.find(item => item.petrolPump == petrolPump);
            if (pumpDetail == undefined) {
              pumpList.push({ petrolPump: petrolPump, qty: Number(vehicleFuelList[i]["quantity"]) });
            }
            else {
              pumpDetail.qty = Number(pumpDetail.qty) + Number(vehicleFuelList[i]["quantity"]);
            }
          }
          let fuelType = "";
          if (vehicleFuelList[i]["fuelType"] != undefined) {
            fuelType = vehicleFuelList[i]["fuelType"];
            let fuelBarCount = this.getFuelBarCount(vehicleFuelList[i]["fuelBarCount"]);
            if (fuelType != "") {
              let detail = fuelList.find(item => item.fuelType == fuelType);
              if (detail == undefined) {
                fuelList.push({ fuelType: fuelType, qty: Number(vehicleFuelList[i]["quantity"]), fuelBarCount: fuelBarCount });
              }
              else {
                detail.qty = Number(detail.qty) + Number(vehicleFuelList[i]["quantity"]);
                if (fuelBarCount != "") {
                  detail.fuelBarCount = detail.fuelBarCount == "" ? fuelBarCount : detail.fuelBarCount + ", " + fuelBarCount;
                }
              }
            }
          }
        }
        let sumQty: number = vehicleFuelList.map(a => Number(a.quantity)).reduce((a, b) => a + b, 0);
        this.vehicleList[i]["qty"] = sumQty.toFixed(2);
        let sumAmount: number = vehicleFuelList.map(a => Number(a.amount)).reduce((a, b) => a + b, 0);
        this.vehicleList[i]["amount"] = sumAmount.toFixed(2);
        this.vehicleList[i]["fuelList"] = fuelList;
        this.vehicleList[i]["pumpList"] = pumpList.map(item => ({ petrolPump: item.petrolPump, qty: item.qty.toFixed(2) }));
      }
      this.setVehicleAverage(this.vehicleList[i]);
    }
    let totalAmount: number = this.vehicleList.map(a => Number(a.amount)).reduce((a, b) => a + b, 0);
    this.fuelDetail.totalAmount = totalAmount.toFixed(2);
    let totalQuantity: number = this.vehicleList.map(a => Number(a.qty)).reduce((a, b) => a + b, 0);
    this.fuelDetail.totalFuel = totalQuantity.toFixed(2);
    this.setDisplayVehicleList();
  }

  // When pump or fuel type filter is applied, only vehicles having at least one matching entry are shown and exported.
  setDisplayVehicleList() {
    if (this.selectedPetrolPump == "0" && this.selectedFuelType == "0") {
      this.displayVehicleList = this.vehicleList;
      this.isNoFilteredData = false;
    }
    else {
      this.displayVehicleList = this.vehicleList.filter(item => item.entryCount > 0);
      this.isNoFilteredData = this.displayVehicleList.length == 0;
    }
  }

  setVehicleAverage(detail: any) {
    detail.avg = "";
    if (detail.hasKM == true && detail.qty != "0.00") {
      detail.avg = (Number(detail.km) / Number(detail.qty)).toFixed(2);
    }
  }

  // Table is already shown by now; KM, GPS KM, Avg and total KM fill in per vehicle as each response arrives.
  // Requests run outside Angular so each of the 2 x vehicles responses does not re-render the whole table;
  // the table is refreshed in batches (every 500 ms) and once more when everything has arrived.
  getVehicleKMData(requestId: any, monthList: any) {
    let totalKM = 0;
    let pending = this.vehicleList.length * 2;
    let refreshTimer = null;
    const refreshView = (isLast: boolean) => {
      if (isLast) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
        this.zone.run(() => { });
      }
      else if (refreshTimer == null) {
        refreshTimer = setTimeout(() => {
          refreshTimer = null;
          this.zone.run(() => { });
        }, 500);
      }
    };
    const onResponse = () => {
      pending--;
      refreshView(pending == 0);
    };
    this.zone.runOutsideAngular(() => {
      for (let i = 0; i < this.vehicleList.length; i++) {
        let detail = this.vehicleList[i];
        this.getVehicleKM(detail.vehicle, monthList).subscribe((runningKM: any) => {
          if (requestId != this.loadRequestId) { return; }
          if (runningKM != null) {
            detail.km = runningKM.toFixed(3);
            detail.hasKM = true;
            totalKM += Number(detail.km);
            this.fuelDetail.totalKm = totalKM.toFixed(3);
            this.setVehicleAverage(detail);
          }
          onResponse();
        });
        this.getVehicleGPSKM(detail.vehicle, monthList).subscribe((gpsKM: any) => {
          if (requestId != this.loadRequestId) { return; }
          if (gpsKM != null) {
            detail.gpsKM = gpsKM.toFixed(3);
          }
          onResponse();
        });
      }
    });
  }

  // Returns null when no month in range has a ward KM file for this vehicle.
  getVehicleKM(vehicle: any, monthList: any) {
    return forkJoin(monthList.map(monthDetail => this.getStorageJSON(monthDetail, "VehicleWardKM%2F" + vehicle + ".json"))).pipe(map((monthData: any[]) => {
      let totalKM = null;
      for (let m = 0; m < monthData.length; m++) {
        let runningData = monthData[m];
        if (runningData != null) {
          totalKM = totalKM == null ? 0 : totalKM;
          let keyArray = Object.keys(runningData);
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            if (this.isDateInRange(date)) {
              let list = JSON.parse(JSON.stringify(runningData[date]));
              for (let j = 0; j < list.length; j++) {
                totalKM += Number(list[j]["distance"]);
              }
            }
          }
        }
      }
      return totalKM;
    }));
  }

  // Returns null when no month in range has a GPS KM file for this vehicle.
  getVehicleGPSKM(vehicle: any, monthList: any) {
    return forkJoin(monthList.map(monthDetail => this.getStorageJSON(monthDetail, "VehicleGPSKM%2F" + vehicle + ".json"))).pipe(map((monthData: any[]) => {
      let distance = null;
      for (let m = 0; m < monthData.length; m++) {
        if (monthData[m] != null) {
          distance = distance == null ? 0 : distance;
          let list = JSON.parse(JSON.stringify(monthData[m]));
          for (let i = 0; i < list.length; i++) {
            if (this.isDateInRange(list[i]["date"])) {
              distance += Number(list[i]["distance"]);
            }
          }
        }
      }
      return distance;
    }));
  }

  exportToExcel() {
    if (this.displayVehicleList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Vehicle Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Petrol Pump";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Fuel Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Fuel Bar Count";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Fuel Quantity";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "KM Running";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "GPS KM Running";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Average";
      htmlString += "</td>";
      htmlString += "</tr>";



      for (let i = 0; i < this.displayVehicleList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.displayVehicleList[i]["vehicle"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.displayVehicleList[i]["pumpList"].map(item => item.petrolPump + "-" + item.qty).join(", ");
        htmlString += "</td>";
        let list = this.displayVehicleList[i]["fuelList"];
        if (list.length > 0) {
          htmlString += "<td>";
          let fuelType = "";
          for (let j = 0; j < list.length; j++) {
            if (fuelType == "") {
              fuelType = list[j]["fuelType"] +"-"+ list[j]["qty"];
            }
            else {
              fuelType = fuelType + ", " + list[j]["fuelType"] +"-"+ list[j]["qty"];
            }
          }
          htmlString += fuelType;
          htmlString += "</td>";
          htmlString += "<td>";
          let fuelBarCount = "";
          for (let j = 0; j < list.length; j++) {
            if (list[j]["fuelBarCount"] != undefined && list[j]["fuelBarCount"] != "") {
              if (fuelBarCount == "") {
                fuelBarCount = list[j]["fuelBarCount"];
              }
              else {
                fuelBarCount = fuelBarCount + ", " + list[j]["fuelBarCount"];
              }
            }
          }
          htmlString += fuelBarCount;
          htmlString += "</td>";
        }
        else {
          htmlString += "<td>";
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += "</td>";
        }

        htmlString += "<td>";
        htmlString += this.displayVehicleList[i]["qty"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.displayVehicleList[i]["amount"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.displayVehicleList[i]["km"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.displayVehicleList[i]["gpsKM"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.displayVehicleList[i]["avg"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = this.commonService.getFireStoreCity() + "-Monthly-Fuel-Report-" + this.fromDate + "-to-" + this.toDate + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }


  getFuelBarCount(value: any): string {
    if (value == null || value.toString().trim() == "") {
      return "";
    }
    return value.toString().trim();
  }


  /* ---------- Update JSON Code --------*/

  // JSON files are month wise, so every month touched by the selected date range is rebuilt fully, one month after another.
  updateJSONData() {
    if (!this.isValidDateRange()) {
      return;
    }
    $('#divLoader').show();
    this.syncMonthList = this.getMonthListInRange();
    this.syncMonthIndex = 0;
    this.updateMonthJSONData();
  }

  updateMonthJSONData() {
    let period = this.syncMonthList[this.syncMonthIndex];
    let days = new Date(Number(period.year), Number(period.month), 0).getDate();
    if (period.year == this.toDayDate.split("-")[0] && Number(this.toDayDate.split("-")[1]) == Number(period.month)) {
      days = this.toDayDate.split("-")[2];
    }
    for (let i = 0; i < this.vehicleList.length; i++) {
      let vehicle = this.vehicleList[i]["vehicle"];
      this.updateVehicleGPSKMJSON(1, days, vehicle, [], period);
    }
    this.updateJSONForDieselEntry(period);
    let workDetailList = [];
    this.getDailyWorkDetail(1, days, workDetailList, period);
  }

  onMonthJSONUpdated() {
    this.syncMonthIndex++;
    if (this.syncMonthIndex < this.syncMonthList.length) {
      this.updateMonthJSONData();
    }
    else {
      $('#divLoader').hide();
      this.commonService.setAlertMessage("success", "Data updated successfully !!!");
      this.getFuelReport();
    }
  }

  updateVehicleGPSKMJSON(index: any, days: any, vehicle: any, list: any, period: any) {
    if (index == days) {
      let filePath = "/VehicleFuelJSONData/" + period.year + "/" + period.monthName + "/";
      this.commonService.saveJsonFile(list, vehicle + ".json", filePath + "VehicleGPSKM/");
    }
    else {
      let date = period.year + '-' + period.month + '-' + (index < 10 ? '0' : '') + index;
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
        this.updateVehicleGPSKMJSON(index, days, vehicle, list, period);
      });
    }
  }



  updateJSONForDieselEntry(period: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateJSONForDieselEntry");
    this.totalQtyJSON = 0;
    this.totalCNGQtyJSON = 0;
    this.totalDieselQtyJSON = 0;
    this.totalPetrolQtyJSON = 0;
    this.totalAmountJSON = 0;
    let dbPath = "DieselEntriesData/" + period.year + "/" + period.monthName;
    let fuelInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        fuelInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateJSONForDieselEntry", data);
          let fuelList = [];
          let keyArray = Object.keys(data);
          let totalAmount = 0;
          let totalQuantity = 0;
          let totalCNGQuantity = 0;
          let totalPetrolQuantity = 0;
          let totalDieselQuantity = 0;
          for (let i = 0; i < keyArray.length; i++) {
            let date = keyArray[i];
            let obj = data[date];
            let objKeys = Object.keys(obj);
            for (let j = 0; j < objKeys.length - 1; j++) {
              let index = objKeys[j];
              let amount = 0;
              let quantity = 0;
              let cngQty = 0;
              let fuelType = "";
              let fuelVehicle="";
              let petrolPump="";
              let payMethod="";
              let remark="";
              let fuelBarCount = this.getFuelBarCount(obj[index]["fuelBarCount"]);

              let vehicle = obj[index]["vehicle"];
              if (obj[index]["amount"] != null) {
                amount = Number(obj[index]["amount"]);
              }
              if (obj[index]["quantity"] != null) {
                if (obj[index]["fuelType"] != null) {
                  fuelType = obj[index]["fuelType"];
                  if (obj[index]["fuelType"] == "CNG") {

                    totalCNGQuantity += Number(obj[index]["quantity"]);
                  }
                  else if (obj[index]["fuelType"] == "Petrol") {
                    totalPetrolQuantity += Number(obj[index]["quantity"]);
                  }
                  else if (obj[index]["fuelType"] == "Diesel") {
                    totalDieselQuantity += Number(obj[index]["quantity"]);
                  }
                }
                quantity = Number(obj[index]["quantity"]);
              }
              let meterReading = "00";
              if (obj[index]["meterReading"] != null) {
                meterReading = obj[index]["meterReading"];
              }
              if(obj[index]["fuelVehicle"]!=null){
                fuelVehicle=obj[index]["fuelVehicle"];
              }
              if(obj[index]["petrolPump"]!=null){
                petrolPump=obj[index]["petrolPump"];
              }
              if(obj[index]["petrolPump"]!=null){
                petrolPump=obj[index]["petrolPump"];
              }
              if(obj[index]["payMethod"]!=null){
                payMethod=obj[index]["payMethod"];
              }
              if(obj[index]["remark"]!=null){
                remark=obj[index]["remark"];
              }
              totalAmount = totalAmount + amount;
              totalQuantity = totalQuantity + quantity;
              let orderBy = new Date(date).getTime();
              fuelList.push({ vehicle: vehicle, date: date, orderBy: orderBy, amount: amount.toFixed(2), fuelType: fuelType, quantity: quantity.toFixed(2), meterReading: meterReading,fuelVehicle:fuelVehicle,petrolPump:petrolPump,payMethod:payMethod,remark:remark,fuelBarCount:fuelBarCount });

            }
            fuelList = fuelList.sort((a, b) => b.orderBy > a.orderBy ? -1 : 1);
          }
          this.totalAmountJSON = totalAmount;
          this.totalQtyJSON = totalQuantity;
          this.totalCNGQtyJSON = totalCNGQuantity;
          this.totalDieselQtyJSON = totalDieselQuantity;
          this.totalPetrolQtyJSON = totalPetrolQuantity;
          let filePath = "/VehicleFuelJSONData/" + period.year + "/" + period.monthName + "/";
          this.commonService.saveJsonFile(fuelList, "VehicleFuel.json", filePath);
        }
      });
  }

  getDailyWorkDetail(startDays: any, days: any, workDetailList: any, period: any) {
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
          this.getWardRunningDistance(0, i, vehicleWorkList, workDetailList, vehicleLengthList, period);
        }
      }
      if (vehicleLengthList.length == 0) {
        this.saveMonthSummary(vehicleLengthList, period);
      }
    }
    else {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDailyWorkDetail");
      let monthDate = period.year + '-' + period.month + '-' + (startDays < 10 ? '0' : '') + startDays;
      let dbPath = "DailyWorkDetail/" + period.year + "/" + period.monthName + "/" + monthDate;
      let workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        workData => {
          workDetailInstance.unsubscribe();
          if (workData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDailyWorkDetail", workData);
            if (monthDate != this.commonService.setTodayDate()) {
              this.commonService.saveJsonFile(workData, monthDate + ".json", "/DailyWorkDetail/" + period.year + "/" + period.monthName + "/");
            }
            let keyArray = Object.keys(workData);
            if (keyArray.length > 0) {
              this.getEmployeeDetail(0, keyArray, workData, startDays, days, workDetailList, monthDate, period);
            }
            else {
              startDays++;
              this.getDailyWorkDetail(startDays, days, workDetailList, period);
            }
          }
          else {
            startDays++;
            this.getDailyWorkDetail(startDays, days, workDetailList, period);
          }
        });
    }
  }

  getEmployeeDetail(index: any, keyArray: any, workData: any, startDays: any, days: any, workDetailList: any, monthDate: any, period: any) {
    if (index == keyArray.length) {
      startDays++;
      this.getDailyWorkDetail(startDays, days, workDetailList, period);
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
        this.getEmployeeDetail(index, keyArray, workData, startDays, days, workDetailList, monthDate, period);
      });
    }
  }


  saveMonthSummary(vehicleLengthList: any, period: any) {
    setTimeout(() => {
      let totalKM = 0;
      for (let i = 0; i < vehicleLengthList.length; i++) {
        totalKM = totalKM + Number(vehicleLengthList[i]["km"]);
      }
      let filePath = "/VehicleFuelJSONData/" + period.year + "/" + period.monthName + "/";
      let lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
      const obj = { "totalKM": totalKM.toFixed(3), "qty": this.totalQtyJSON.toFixed(2), "cngQty": this.totalCNGQtyJSON.toFixed(2), "petralQty": this.totalPetrolQtyJSON.toFixed(2), "dieselQty": this.totalDieselQtyJSON.toFixed(2), "amount": this.totalAmountJSON.toFixed(2), "lastUpdateDate": lastUpdateDate };
      this.commonService.saveJsonFile(obj, "MonthSummary.json", filePath);
      this.onMonthJSONUpdated();
    }, 6000);
  }

  getWardRunningDistance(listIndex: any, index: any, vehicleWorkList: any, workDetailList: any, vehicleLengthList: any, period: any) {
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
      let filePath = "/VehicleFuelJSONData/" + period.year + "/" + period.monthName + "/";
      this.commonService.saveJsonFile(objDate, vehicle + ".json", filePath + "VehicleWardKM/");
      if (index == vehicleLengthList.length - 1) {
        this.saveMonthSummary(vehicleLengthList, period);
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
      this.getLocationHistory(dbLocationPath).then((locationData: any) => {
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
        this.getWardRunningDistance(listIndex, index, vehicleWorkList, workDetailList, vehicleLengthList, period);
      });

    }
  }

  getLocationHistory(dbLocationPath: any) {
    return new Promise((resolve) => {
      this.getLocationHistoryArchiveStatus(dbLocationPath).then((archiveData: any) => {
        if (archiveData == null) {
          //data is not archived, read it from realtime database
          this.getLocationHistoryFromDatabase(dbLocationPath).then((locationData: any) => {
            resolve(locationData);
          });
          return;
        }
        //data is archived, read it from storage
        this.getLocationHistoryFromStorage(dbLocationPath).then((locationData: any) => {
          if (locationData == null) {
            //data not found in storage, read it from realtime database
            this.getLocationHistoryFromDatabase(dbLocationPath).then((data: any) => {
              resolve(data);
            });
            return;
          }
          resolve(locationData);
        });
      });
    });
  }

  getLocationHistoryArchiveStatus(dbLocationPath: any) {
    return new Promise((resolve) => {
      let archivePath = dbLocationPath.toString().replace("LocationHistory/", "LocationHistoryArchive/");
      let archiveInstance = this.db.object(archivePath).valueChanges().subscribe((archiveData: any) => {
        archiveInstance.unsubscribe();
        resolve(archiveData);
      });
    });
  }

  getLocationHistoryFromStorage(dbLocationPath: any) {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2F" + dbLocationPath.toString().replaceAll("/", "%2F") + ".json?alt=media";
      let storageInstance = this.httpService.get(path).subscribe((storageData: any) => {
        storageInstance.unsubscribe();
        resolve(this.getStorageLocationData(storageData));
      }, error => {
        //old archived files are saved as route.json, read them from there
        this.commonService.getStorageLocationHistory(dbLocationPath).then((response: any) => {
          if (response["status"] == "Fail") {
            resolve(null);
            return;
          }
          resolve(this.getStorageLocationData(response["data"]));
        });
      });
    });
  }

  getStorageLocationData(storageData: any) {
    if (storageData == null) {
      return null;
    }
    let locationData = storageData;
    if (storageData["routePath"] != undefined && storageData["routePath"] != null) {
      locationData = storageData["routePath"];
    }
    if (locationData == null) {
      return null;
    }
    //keep key order same as realtime database (sorted keys)
    let sortedLocationData: any = {};
    Object.keys(locationData).sort().forEach((key) => {
      sortedLocationData[key] = locationData[key];
    });
    return sortedLocationData;
  }

  getLocationHistoryFromDatabase(dbLocationPath: any) {
    return new Promise((resolve) => {
      let locationInstance = this.db.object(dbLocationPath).valueChanges().subscribe((locationData: any) => {
        locationInstance.unsubscribe();
        if (locationData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardRunningDistance", locationData);
        }
        resolve(locationData);
      });
    });
  }
}

export class fuelDetail {
  totalFuel: string;
  totalCNGFuel: string;
  totalPetrolFuel: string;
  totalDieselFuel: string;
  totalKm: string;
  totalAmount: string;
  lastUpdateDate: string;
}
