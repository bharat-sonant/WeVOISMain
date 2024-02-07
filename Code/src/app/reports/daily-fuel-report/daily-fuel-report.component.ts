import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-daily-fuel-report',
  templateUrl: './daily-fuel-report.component.html',
  styleUrls: ['./daily-fuel-report.component.scss']
})
export class DailyFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  vehicleList: any[] = [];
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedDate: any;
  toDayDate: any;
  txtDate = "#txtDate";
  divLoader = "#divLoader";
  workDetailList: any[] = [];
  zoneDetailList: any[] = [];
  serviceName = "daily-fuel-report";

  fuelDetail: fuelDetail = {
    date: "",
    totalFuel: "0.00",
    totalKm: "0.000",
    totalAmount: "0.00"
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("General-Reports","Daily-Fuel-Report",localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    this.fuelDetail.date = this.selectedDate.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split('-')[1])) + " " + this.selectedDate.split('-')[0];
    this.getSelectedYearMonthName();
    this.getVehicles();
  }

  clearList() {
    this.fuelDetail.totalFuel = "0.00";
    this.fuelDetail.totalAmount = "0.00";
    this.fuelDetail.totalKm = "0.000";
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        this.vehicleList[i]["diesel"] = [];
        this.vehicleList[i]["wardList"] = [];
      }
    }
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.fuelDetail.date = this.selectedDate.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split('-')[1])) + " " + this.selectedDate.split('-')[0];
        this.clearList();
        this.getSelectedYearMonthName();
        this.getDieselQty();
        this.getDailyWorkDetail();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  getVehicles() {
    let vehicles = JSON.parse(localStorage.getItem("vehicle"));
    for (let i = 3; i < vehicles.length; i++) {
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"], diesel: [], wardList: [] });
    }
    this.getDieselQty();
    this.getDailyWorkDetail();
  }

  getSelectedYearMonthName() {
    this.selectedMonth = Number(this.selectedDate.split('-')[1]);
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
  }

  getDieselQty() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDieselQty");
    $('#divLoader').show();
    let totalFuel = 0;
    let totalAmount = 0;
    let dbPath = "DieselEntriesData/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let dieselInstance = this.db.object(dbPath).valueChanges().subscribe(
      dieselData => {
        dieselInstance.unsubscribe();
        if (dieselData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDieselQty", dieselData);
          let keyArray = Object.keys(dieselData);
          for (let i = 0; i < keyArray.length; i++) {
            let key = keyArray[i];
            if (dieselData[key]["vehicle"] != null) {
              let detail = this.vehicleList.find(item => item.vehicle == dieselData[key]["vehicle"]);
              if (detail != undefined) {
                let qty = "";
                let amount = "";
                if (dieselData[key]["quantity"] != null) {
                  qty = dieselData[key]["quantity"];
                  totalFuel += Number(dieselData[key]["quantity"]);
                }
                if (dieselData[key]["amount"] != null) {
                  amount = dieselData[key]["amount"];
                  totalAmount += Number(dieselData[key]["amount"]);
                }
                let meterImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2FmeterReadingImage?alt=media";
                let slipImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2FamountSlipImage?alt=media";
                detail.diesel.push({ qty: qty, amount: amount, meterImageUrl: meterImageUrl, slipImageUrl: slipImageUrl });
              }
            }
          }
          this.fuelDetail.totalFuel = totalFuel.toFixed(2);
          this.fuelDetail.totalAmount = totalAmount.toFixed(2);
        }
      }
    );
  }

  getDailyWorkDetail() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDailyWorkDetail");
    let workDetailList = [];
    let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
      workData => {
        workDetailInstance.unsubscribe();
        if (workData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDailyWorkDetail", workData);
          if (this.selectedDate != this.commonService.setTodayDate()) {
            this.commonService.saveJsonFile(workData, this.selectedDate + ".json", "/DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/");
          }
          let keyArray = Object.keys(workData);
          if (keyArray.length > 0) {
            this.getEmployeeDetail(0, keyArray, workData, workDetailList);
          }
        }
        else{
          $('#divLoader').hide();
        }
      });
  }

  getEmployeeDetail(index: any, keyArray: any, workData: any, workDetailList: any) {
    if (index == keyArray.length) {
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
                let orderBy = new Date(this.selectedDate).getTime();
                workDetailList.push({ vehicle: vehicle, zone: zone, task: task, name: name, empId: empId, startTime: startTime, endTime: endTime, orderBy: orderBy, distance: 0 });
              }
            }
          }
        }
        index++;
        this.getEmployeeDetail(index, keyArray, workData, workDetailList);
      });
    }
  }

  getWardRunningDistance(listIndex: any, index: any, vehicleWorkList: any, workDetailList: any, vehicleLengthList: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardRunningDistance");
    if (listIndex == vehicleWorkList.length) {
      if (index == vehicleLengthList.length - 1) {
        let totalKM=0;
        for (let i = 0; i < workDetailList.length; i++) {
          let vehicle = workDetailList[i]["vehicle"];
          let detail = this.vehicleList.find(item => item.vehicle == vehicle);
          if (detail != undefined) {
            totalKM+=Number(workDetailList[i]["distance"]);
            detail.wardList.push({ zone: workDetailList[i]["zone"], km: workDetailList[i]["distance"], driver: workDetailList[i]["name"] })
          }
        }
        this.fuelDetail.totalKm=totalKM.toFixed(3);
        $('#divLoader').hide();
      }
    }
    else {
      let zone = vehicleWorkList[listIndex]["zone"];
      let vehicle = vehicleWorkList[listIndex]["vehicle"];
      let startTime = vehicleWorkList[listIndex]["startTime"];
      let endTime = vehicleWorkList[listIndex]["endTime"];
      if (endTime == "") {
        endTime = "23:59";
      }
      let dbLocationPath = "";
      if (zone.includes("BinLifting")) {
        dbLocationPath = "LocationHistory/BinLifting/" + vehicle + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      }
      else {
        dbLocationPath = "LocationHistory/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      }
      let locationInstance = this.db.object(dbLocationPath).valueChanges().subscribe(
        locationData => {
          locationInstance.unsubscribe();
          let distance = "0";
          if (locationData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardRunningDistance", locationData);
            let keyArray = Object.keys(locationData);
            if (keyArray.length > 0) {
              let startDate = new Date(this.selectedDate + " " + startTime);
              let endDate = new Date(this.selectedDate + " " + endTime);
              let diffMs = endDate.getTime() - startDate.getTime(); // milliseconds between now & Christmas
              if (diffMs < 0) {
                endDate = new Date(this.commonService.getNextDate(this.selectedDate, 1) + " " + endTime);
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

  exportToExcel() {
    let exportList = [];
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        let list = [];
        let vehicle = this.vehicleList[i]["vehicle"];
        let diesel = this.vehicleList[i]["diesel"];
        if (diesel.length > 0) {
          for (let j = 0; j < diesel.length; j++) {
            list.push({ vehicle: vehicle, dieselQty: diesel[j]["qty"], amount: diesel[j]["amount"], zone: "", km: "", driver: "" });
          }
        }
        let wardDetailList = this.vehicleList[i]["wardList"];
        if (wardDetailList.length > 0) {
          for (let j = 0; j < wardDetailList.length; j++) {
            if (list[j] != undefined) {
              list[j]["zone"] = wardDetailList[j]["zone"];
              list[j]["km"] = wardDetailList[j]["km"];
              list[j]["driver"] = wardDetailList[j]["driver"];
            }
            else {
              list.push({ vehicle: vehicle, dieselQty: "", amount: "", zone: wardDetailList[j]["zone"], km: wardDetailList[j]["km"], driver: wardDetailList[j]["driver"] });
            }
          }
        }
        if (list.length > 0) {
          for (let j = 0; j < list.length; j++) {
            exportList.push({ vehicle: vehicle, dieselQty: list[j]["dieselQty"], amount: list[j]["amount"], zone: list[j]["zone"], km: list[j]["km"], driver: list[j]["driver"] })
          }
        }
      }
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
      htmlString += "Diesel Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Ward No.";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "KM";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Driver Name";
      htmlString += "</td>";
      htmlString += "</tr>";
      if (exportList.length > 0) {
        for (let i = 0; i < exportList.length; i++) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += exportList[i]["vehicle"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += exportList[i]["dieselQty"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += exportList[i]["amount"];
          htmlString += "</td>";
          htmlString += "<td t='s'>";
          htmlString += exportList[i]["zone"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += exportList[i]["km"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += exportList[i]["driver"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }
      }
      htmlString += "</table>";
      let fileName = this.commonService.getFireStoreCity() + "-Daily-Fuel-Report-" + this.selectedDate.split('-')[2] + "-" + this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split('-')[1])) + "-" + this.selectedDate.split('-')[0] + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}


export class fuelDetail {
  date: string;
  totalFuel: string;
  totalKm: string;
  totalAmount: string;
}
