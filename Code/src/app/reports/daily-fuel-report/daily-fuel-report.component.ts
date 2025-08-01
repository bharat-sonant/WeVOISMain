import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-daily-fuel-report',
  templateUrl: './daily-fuel-report.component.html',
  styleUrls: ['./daily-fuel-report.component.scss']
})
export class DailyFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private modalService: NgbModal, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }
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
  dieselHistoryList: any[] = [];
  serviceName = "daily-fuel-report";

  fuelDetail: fuelDetail = {
    date: "-- --- ----",
    totalDiesel: "0.00",
    totalCNG: "0.00",
    totalPetrol: "0.00",
    totalKm: "0.000",
    totalAmount: "0.00",
    totalFuel:"0.00"
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("General-Reports", "Daily-Fuel-Report", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getVehicles();
  }

  clearList() {
    this.fuelDetail.totalDiesel = "0.00";
    this.fuelDetail.totalCNG = "0.00";
    this.fuelDetail.totalPetrol = "0.00";
    this.fuelDetail.totalAmount = "0.00";
    this.fuelDetail.totalKm = "0.000";
    this.fuelDetail.totalFuel="0.00";
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        this.vehicleList[i]["diesel"] = [];
        this.vehicleList[i]["wardList"] = [];
        this.vehicleList[i]["gpsKM"] = "";
      }
    }
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.fuelDetail.date = this.selectedDate.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split('-')[1])) + " " + this.selectedDate.split('-')[0];
        $("#spMessage").hide();
        this.clearList();
        this.getSelectedYearMonthName();
        this.getDieselQty();
        this.getVehicleGPSKM();
        this.getDailyWardKMDetail();
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
  }

  getSelectedYearMonthName() {
    this.selectedMonth = Number(this.selectedDate.split('-')[1]);
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
  }

  showHistory(content: any, key: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 400;
    let width = 600;
    let mapHeight = height - 40 + "px";
    let divHeight = height - 40 + "px";
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";

    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $("#haltMap").css("height", mapHeight);
    $("#divSequence").css("height", divHeight);
    this.getDiselEntryHistory(key);
  }


  closeMapModelHalt() {
    this.modalService.dismissAll();
  }

  getDiselEntryHistory(key: any) {
    this.dieselHistoryList = [];
    let instance = this.db.object("DieselEntriesData/History/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + key).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          if (keyArray[i] != "lastEntry") {
            let historyKey = keyArray[i];
            let meterImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2FHistory%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2F" + keyArray[i] + "%2FmeterReadingImage?alt=media";
            let slipImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2FHistory%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2F" + keyArray[i] + "%2FamountSlipImage?alt=media";
            this.dieselHistoryList.push({ key: historyKey, amount: data[historyKey]["amount"], meterReading: data[historyKey]["meterReading"], quantity: data[historyKey]["quantity"], vehicle: data[historyKey]["vehicle"], createdBy: data[historyKey]["createdBy"], creationDate: data[historyKey]["creationDate"], meterImageUrl: meterImageUrl, slipImageUrl: slipImageUrl, time: data[historyKey]["time"] != null ? data[historyKey]["time"] : "" });
            if (!isNaN(parseInt(data[historyKey]["createdBy"]))) {
              this.getUserName(historyKey, data[historyKey]["createdBy"]);
            }
          }
        }
      }
    })
  }

  getUserName(key: any, userId: any) {
    let dbPath = "Employees/" + userId + "/GeneralDetails/name";
    let nameInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      nameInstance.unsubscribe();
      if (data != null) {
        let detail = this.dieselHistoryList.find(item => item.key == key);
        if (detail != undefined) {
          detail.createdBy = data.toString();
        }
      }
    });
  }

  getDieselQty() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDieselQty");
    $('#divLoader').show();
    let totalDiesel = 0;
    let totalPetrol = 0;
    let totalCNG = 0;
    let totalAmount = 0;
    let totalFuel=0;
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
                let isUpdate = 0;
                let fuelType = "";
                if (dieselData[key]["isUpdate"] != null) {
                  isUpdate = 1;
                }
                if (dieselData[key]["amount"] != null) {
                  amount = dieselData[key]["amount"];
                  totalAmount += Number(dieselData[key]["amount"]);
                }
                if (dieselData[key]["fuelType"] != null) {
                  fuelType = dieselData[key]["fuelType"];
                }
                if (dieselData[key]["quantity"] != null) {
                  qty = dieselData[key]["quantity"];
                  if (fuelType == "Petrol") {
                    totalPetrol += Number(dieselData[key]["quantity"]);
                  }
                  else if (fuelType == "CNG") {
                    totalCNG += Number(dieselData[key]["quantity"]);
                  }
                  else if (fuelType == "Diesel"){
                    totalDiesel += Number(dieselData[key]["quantity"]);
                  }
                  totalFuel+= Number(dieselData[key]["quantity"]);
                }
                let meterImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2FmeterReadingImage?alt=media";
                let slipImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2FamountSlipImage?alt=media";
                let dieselDetail = detail.diesel.find(item => item.fuelType == fuelType);
                //if (dieselDetail != undefined) {
                //    fuelType = "";
                //  }
                detail.diesel.push({ key: key, fuelType: fuelType, qty: qty, amount: amount, meterImageUrl: meterImageUrl, slipImageUrl: slipImageUrl, isUpdate: isUpdate });
              }
            }
          }
          this.fuelDetail.totalDiesel = totalDiesel.toFixed(2);
          this.fuelDetail.totalCNG = totalCNG.toFixed(2);
          this.fuelDetail.totalPetrol = totalPetrol.toFixed(2);
          this.fuelDetail.totalAmount = totalAmount.toFixed(2);
          this.fuelDetail.totalFuel = totalFuel.toFixed(2);
        }
      }
    );
  }

  getDailyWardKMDetail() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDailyWardKMDetail");
    let dbPath = "DailyFuelWardKMDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        let totalKM = 0;
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDailyWardKMDetail", data);
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let vehicle = keyArray[i];
          let wardObject = data[vehicle];
          let wardArray = Object.keys(wardObject);
          let wardList = [];
          for (let j = 0; j < wardArray.length; j++) {
            let ward = wardArray[j];
            let km = wardObject[ward]["km"];
            let driver = wardObject[ward]["driver"];
            wardList.push({ zone: ward, km: km, driver: driver });
          }
          let detail = this.vehicleList.find(item => item.vehicle == vehicle);
          if (detail != undefined) {
            detail.wardList = wardList;
            for (let j = 0; j < wardList.length; j++) {
              totalKM += Number(wardList[j]["km"]);
            }
          }
        }
        this.fuelDetail.totalKm = totalKM.toFixed(3);
        $('#divLoader').hide();
      }
      else {
        this.getDailyWorkDetail();
      }
    });
  }

  getDailyWorkDetail() {
    let workDetailList = [];
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDailyWorkDetail");
    let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
      workData => {
        workDetailInstance.unsubscribe();
        if (workData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDailyWorkDetail", workData);
          this.getWorkDetailList(workData).then(resp => {
            workDetailList = JSON.parse(JSON.stringify(resp));
            if (workDetailList.length > 0) {
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
              $('#divLoader').hide();
            }
          });
        }
        else {
          $('#divLoader').hide();
        }
      });
  }

  getWorkDetailList(workData: any) {
    return new Promise(async (resolve) => {
      let workDetailList = [];
      let keyArray = Object.keys(workData);
      if (keyArray.length > 0) {
        for (let index = 0; index < keyArray.length; index++) {
          let empId = keyArray[index];
          for (let k = 1; k <= 5; k++) {
            if (workData[empId]["task" + k] != null) {
              let zone = workData[empId]["task" + k]["task"];
              let vehicle = workData[empId]["task" + k]["vehicle"];
              let startTime = "";
              let endTime = "";
              let binLiftingPlanId = "";
              if (workData[empId]["task" + k]["binLiftingPlanId"] != null) {
                binLiftingPlanId = workData[empId]["task" + k]["binLiftingPlanId"];
              }
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
                workDetailList.push({ vehicle: vehicle, zone: zone, task: task, empId: empId, driverName: "", binLiftingPlanId: binLiftingPlanId, startTime: startTime, endTime: endTime, orderBy: orderBy, distance: 0 });
              }
            }
          }
        }
        if (workDetailList.length > 0) {
          const promises = [];
          for (let i = 0; i < workDetailList.length; i++) {
            promises.push(Promise.resolve(this.getDriverDetail(workDetailList[i]["zone"], workDetailList[i]["empId"], workDetailList[i]["binLiftingPlanId"], workDetailList[i]["vehicle"], i)));
          }

          Promise.all(promises).then((results) => {
            for (let i = 0; i < workDetailList.length; i++) {
              let detail = results.find(item => item.index == i);
              if (detail != undefined) {
                workDetailList[i]["name"] = detail.driverName;
              }
            }
            workDetailList = workDetailList.filter(item => item.name != "");
            resolve(workDetailList);
          });
        }
      }
    });
  }

  getDriverDetail(zone: any, empId: any, binLiftingPlanId: any, vehicle: any, index: any) {
    return new Promise((resolve) => {
      let driverName = "";
      if (binLiftingPlanId != "") {
        let dbPath = "DustbinData/DustbinAssignment/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + binLiftingPlanId + "/driver";
        let instance = this.db.object(dbPath).valueChanges().subscribe(async driverIdData => {
          instance.unsubscribe();
          if (driverIdData != null) {
            if (empId == driverIdData) {
              let employee = await this.commonService.getEmplyeeDetailByEmployeeId(empId);
              driverName = employee["name"];
            }
          }
          resolve({ index: index, driverName: driverName });
        });
      }
      else {
        let dbPath = "WasteCollectionInfo/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/WorkerDetails";
        let instance = this.db.object(dbPath).valueChanges().subscribe(async workerData => {
          instance.unsubscribe();
          if (workerData != null) {
            let driverList = workerData["driver"].split(",");
            let vehicleList = workerData["vehicle"].split(",");
            let driverNameList = workerData["driverName"].split(",");
            for (let i = 0; i < driverList.length; i++) {
              if (empId == driverList[i].trim() && vehicle == vehicleList[i].trim()) {
                driverName = driverNameList[i];
              }
            }
          }
          resolve({ index: index, driverName: driverName });
        });
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

  getVehicleGPSKM() {
    for (let i = 0; i < this.vehicleList.length; i++) {
      let vehicle = this.vehicleList[i]["vehicle"];
      let path = "https://wevois-vts-default-rtdb.firebaseio.com/VehicleRoute/" + vehicle + "/" + this.selectedDate + ".json";
      this.httpService.get(path).subscribe(data => {
        if (data != null) {
          let distance = 0;
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
          if (distance > 0) {
            let detail = this.vehicleList.find(item => item.vehicle == vehicle);
            if (detail != undefined) {
              detail.gpsKM = (distance / 1000).toFixed(3);
            }
          }
        }
      });
    }
  }

  getWardRunningDistance(listIndex: any, index: any, vehicleWorkList: any, workDetailList: any, vehicleLengthList: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardRunningDistance");
    if (listIndex == vehicleWorkList.length) {
      if (index == vehicleLengthList.length - 1) {
        let totalKM = 0;
        setTimeout(() => {
          for (let i = 0; i < workDetailList.length; i++) {
            let vehicle = workDetailList[i]["vehicle"];
            let detail = this.vehicleList.find(item => item.vehicle == vehicle);
            if (detail != undefined) {
              totalKM += Number(workDetailList[i]["distance"]);
              detail.wardList.push({ zone: workDetailList[i]["zone"], km: workDetailList[i]["distance"], driver: workDetailList[i]["name"] + " <b>(" + workDetailList[i]["empId"] + ")</b>" });
            }
          }
          this.fuelDetail.totalKm = totalKM.toFixed(3);
          $('#divLoader').hide();
        }, 2000);
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
        let gpsKM = this.vehicleList[i]["gpsKM"];
        let diesel = this.vehicleList[i]["diesel"];
        if (diesel.length > 0) {
          for (let j = 0; j < diesel.length; j++) {
            list.push({ vehicle: vehicle, gpsKM: "",fuelType:diesel[j]["fuelType"], dieselQty: diesel[j]["qty"], amount: diesel[j]["amount"], zone: "", km: "", driver: "" });
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
              list.push({ vehicle: vehicle, gpsKM: "", dieselQty: "", amount: "", zone: wardDetailList[j]["zone"], km: wardDetailList[j]["km"], driver: wardDetailList[j]["driver"] });
            }
          }
        }
        if (gpsKM != "") {
          if (list.length > 0) {
            list[0]["gpsKM"] = gpsKM;
          }
          else {
            list.push({ vehicle: vehicle, gpsKM: gpsKM, dieselQty: "", amount: "", zone: "", km: "", driver: "" });
          }
        }
        if (list.length > 0) {
          for (let j = 0; j < list.length; j++) {
            exportList.push({ vehicle: vehicle, gpsKM: list[j]["gpsKM"],fuelType:list[j]["fuelType"]?list[j]["fuelType"]:"", dieselQty: list[j]["dieselQty"], amount: list[j]["amount"], zone: list[j]["zone"], km: list[j]["km"], driver: list[j]["driver"] })
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
      htmlString += "GPS KM";
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
          htmlString += exportList[i]["fuelType"];
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
          htmlString += exportList[i]["gpsKM"];
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
  totalDiesel: string;
  totalCNG: string;
  totalPetrol: string;
  totalKm: string;
  totalAmount: string;
  totalFuel:string;
}
