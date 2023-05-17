import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-daily-fuel-report',
  templateUrl: './daily-fuel-report.component.html',
  styleUrls: ['./daily-fuel-report.component.scss']
})
export class DailyFuelReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
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

  fuelDetail: fuelDetail = {
    date: "",
    totalFuel: "0.00",
    totalKm: "0.000",
    totalAmount:"0.00"
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
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
    let totalFuel = 0;
    let totalAmount=0;
    let dbPath = "DieselEntriesData/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let dieselInstance = this.db.object(dbPath).valueChanges().subscribe(
      dieselData => {
        dieselInstance.unsubscribe();
        if(dieselData!=null){
          let keyArray=Object.keys(dieselData);
          for(let i=0;i<keyArray.length;i++){
            let key=keyArray[i];
            if (dieselData[key]["vehicle"] != null) {
              let detail = this.vehicleList.find(item => item.vehicle == dieselData[key]["vehicle"]);
              if (detail != undefined) {
                let qty="";
                let amount="";
                if (dieselData[key]["quantity"] != null) {
                  qty=dieselData[key]["quantity"];
                  totalFuel += Number(dieselData[key]["quantity"]);
                }
                if (dieselData[key]["amount"] != null) {
                  amount=dieselData[key]["amount"];
                  totalAmount += Number(dieselData[key]["amount"]);
                }
                let meterImageUrl=this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2FmeterReadingImage?alt=media";   
                let slipImageUrl= this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDieselEntriesImages%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + "%2FamountSlipImage?alt=media";   
                detail.diesel.push({ qty: qty, amount:amount,meterImageUrl:meterImageUrl,slipImageUrl:slipImageUrl }); 
              }
            }
          }
          this.fuelDetail.totalFuel = totalFuel.toFixed(2);
          this.fuelDetail.totalAmount=totalAmount.toFixed(2);
        }
      }
    );
  }

  getDailyWorkDetail() {
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 12000);
    this.workDetailList = [];
    this.zoneDetailList = [];

    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDailyWorkDetail%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + ".json?alt=media";
    let workDetailInstance = this.httpService.get(path).subscribe(workData => {
      workDetailInstance.unsubscribe();
      if (workData != null) {
        let keyArray = Object.keys(workData);
        if (keyArray.length > 0) {
          this.getEmployName(0, keyArray, workData);
        }
      }
    }, error => {
      let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        workData => {
          workDetailInstance.unsubscribe();
          if (workData != null) {
            if (this.selectedDate != this.commonService.setTodayDate()) {
              this.commonService.saveJsonFile(workData, this.selectedDate + ".json", "/DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/");
            }
            let keyArray = Object.keys(workData);
            if (keyArray.length > 0) {
              this.getEmployName(0, keyArray, workData);
            }
          }
        });
    });
  }


  getEmployName(index: any, keyArray: any, workData: any) {
    if (index == keyArray.length) {
      let duplicateList = [];
      let finalDuplicateList = [];
      if (this.workDetailList.length > 0) {
        for (let i = 0; i < this.workDetailList.length; i++) {
          let zone = this.workDetailList[i]["zone"];
          if (zone != "Compactor") {
            let detail = duplicateList.find(item => item.zone == zone);
            if (detail == undefined) {
              let list = this.workDetailList.filter(item => item.zone == zone);
              if (list.length > 1) {
                for (let j = 0; j < list.length; j++) {
                  duplicateList.push({ vehicle: list[j]["vehicle"], zone: list[j]["zone"], name: list[j]["name"], empId: list[j]["empId"], task: list[j]["task"] });
                }
              }
            }
          }
        }
        if (duplicateList.length > 0) {
          for (let i = 0; i < duplicateList.length; i++) {
            let vehicle = duplicateList[i]["vehicle"];
            let zone = duplicateList[i]["zone"];
            let list = duplicateList.filter(item => item.zone == zone || item.vehicle == vehicle);
            let distinct = list.map(item => item.vehicle)
              .filter((value, index, self) => self.indexOf(value) === index);
            if (distinct.length > 1) {
              for (let j = 0; j < distinct.length; j++) {
                let detail = list.find(item => item.vehicle == distinct[j]);
                if (detail != undefined) {
                  let detailList = finalDuplicateList.find(item => item.vehicle == detail.vehicle);
                  if (detailList == undefined) {
                    finalDuplicateList.push({ vehicle: detail.vehicle, zone: detail.zone, name: detail.name, empId: detail.empId, task: detail.task });
                  }
                }
              }
            }
          }
        }

        for (let i = 0; i < this.workDetailList.length; i++) {
          let vehicle = this.workDetailList[i]["vehicle"];
          let zone = this.workDetailList[i]["zone"];
          let name = this.workDetailList[i]["name"];

          let detail = this.vehicleList.find(item => item.vehicle == vehicle);
          if (detail != undefined) {
            if (zone.includes("BinLifting")) {
              if (detail.wardList.length == 0) {
                detail.wardList.push({ zone: zone, km: "", driver: name });
              }
              else {
                let isdone = false;
                for (let j = 0; j < detail.wardList.length; j++) {
                  if (detail.wardList[j]["zone"].includes("BinLifting")) {
                    detail.wardList[j]["zone"] = detail.wardList[j]["zone"] + "<br/> " + zone;
                    detail.wardList[j]["driver"] = detail.wardList[j]["driver"] + "<br/> " + name;
                    isdone = true;
                    j = detail.wardList.length;
                  }
                }
                if (isdone == false) {
                  detail.wardList.push({ zone: zone, km: "", driver: name });
                }
              }
            }
            else {
              let zoneDetail = detail.wardList.find(item => item.zone == zone);
              if (zoneDetail == undefined) {
                detail.wardList.push({ zone: zone, km: "", driver: name });
              }
            }
          }
        }
        this.getVehicleZoneKMRunning(finalDuplicateList);
      }
      return;
    }
    let empId = keyArray[index];
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      if (employee["designation"] == "Transportation Executive") {
        let name = employee["name"];
        for (let k = 1; k <= 5; k++) {
          if (workData[empId]["task" + k] != null) {
            let zone = workData[empId]["task" + k]["task"];
            let vehicle = workData[empId]["task" + k]["vehicle"];
            if (vehicle != "NotApplicable") {
              let task = "task" + k;
              this.workDetailList.push({ vehicle: vehicle, zone: zone, name: name, empId: empId, task: task });
              this.workDetailList = this.commonService.transformString(this.workDetailList, "vehicle");
            }
          }
        }
      }
      index++;
      this.getEmployName(index, keyArray, workData);
    });
  }

  getVehicleZoneKMRunning(finalDuplicateList: any) {
    for (let i = 0; i < this.vehicleList.length; i++) {
      let vehicle = this.vehicleList[i]["vehicle"];
      let wardList = this.vehicleList[i]["wardList"];
      if (wardList.length > 0) {
        for (let j = 0; j < wardList.length; j++) {
          let zone = wardList[j]["zone"];
          let finalDetail = finalDuplicateList.find(item => item.zone == zone && item.vehicle == vehicle);
          if (finalDetail == undefined) {
            let dbLocationPath = "";
            if (zone.includes("BinLifting")) {
              dbLocationPath = "LocationHistory/BinLifting/" + vehicle + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/TotalCoveredDistance";
            }
            else {
              dbLocationPath = "LocationHistory/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/TotalCoveredDistance";
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
                  if (wardListDetail != undefined) {
                    this.fuelDetail.totalKm = (Number(this.fuelDetail.totalKm) + Number(distance)).toFixed(3);
                    let zoneDetail = detail.wardList.find(item => item.zone == zone);
                    if (zoneDetail != undefined) {
                      zoneDetail.km = distance;
                    }
                  }
                }
              });
          }
          else {
            this.getDuplicateVehicleKMRunning(zone, vehicle, finalDuplicateList);
          }
        }
      }
    }
  }

  getDuplicateVehicleKMRunning(zone: any, vehicle: any, finalDuplicateList: any) {
    if (finalDuplicateList.length > 0) {
      let detail = finalDuplicateList.find(item => item.zone == zone && item.vehicle == vehicle);
      if (detail != undefined) {
        let zone = detail.zone;
        let vehicle = detail.vehicle;
        let empId = detail.empId;
        let task = detail.task;
        let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + empId + "/" + task + "/in-out";
        let taskInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            taskInstance.unsubscribe();
            if (data != null) {
              let startTime = "";
              let endTime = "";
              let keyArray = Object.keys(data);
              for (let i = 0; i < keyArray.length; i++) {
                let time = keyArray[i];
                if (data[time] == "In") {
                  startTime = time.split(":")[0] + ":" + time.split(":")[1];
                }
              }
              for (let i = keyArray.length - 1; i >= 0; i--) {
                let time = keyArray[i];
                if (data[time] == "Out") {
                  endTime = time.split(":")[0] + ":" + time.split(":")[1];
                }
              }
              let date = new Date(this.selectedDate + " " + startTime);
              let endDate = new Date(this.selectedDate + " " + endTime);
              let diffMs = endDate.getTime() - date.getTime(); // milliseconds between now & Christmas

              let diffMins = Math.round(diffMs / 60000); // minutes
              dbPath = "LocationHistory/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
              let locationInstance = this.db.object(dbPath).valueChanges().subscribe(
                locationData => {
                  locationInstance.unsubscribe();
                  if (locationData != null) {
                    let keyArray = Object.keys(locationData);
                    if (keyArray.length > 0) {
                      let distance = "0";
                      for (let i = 0; i <= diffMins; i++) {
                        let locationList = keyArray.filter(item => item.includes(startTime));
                        if (locationList.length > 0) {
                          for (let j = 0; j < locationList.length; j++) {
                            if (locationData[locationList[j]]["distance-in-meter"] != null) {
                              let coveredDistance = locationData[locationList[j]]["distance-in-meter"];
                              distance = (Number(distance) + Number(coveredDistance)).toFixed(3);
                            }
                          }
                        }
                        date = new Date(date.setMinutes(date.getMinutes() + 1));
                        startTime = (date.getHours() < 10 ? '0' : '') + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
                      }
                      if (distance != "0") {
                        let detail = this.vehicleList.find(item => item.vehicle == vehicle);
                        if (detail != undefined) {
                          let wardListDetail = detail.wardList.find(item => item.zone == zone);
                          if (wardListDetail != undefined) {
                            distance=(Number(distance) / 1000).toFixed(3);
                            this.fuelDetail.totalKm = (Number(this.fuelDetail.totalKm) + Number(distance)).toFixed(3);
                            let zoneDetail = detail.wardList.find(item => item.zone == zone);
                            if (zoneDetail != undefined) {
                              zoneDetail.km = Number(distance).toFixed(3);
                            }
                          }
                        }
                      }

                    }

                  }
                }
              );

            }
          }
        );
      }
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
            list.push({ vehicle: vehicle, dieselQty: diesel[j]["qty"], zone: "", km: "", driver: "" });
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
              list.push({ vehicle: vehicle, dieselQty: "", zone: wardDetailList[j]["zone"], km: wardDetailList[j]["km"], driver: wardDetailList[j]["driver"] });
            }
          }
        }
        if (list.length > 0) {
          for (let j = 0; j < list.length; j++) {
            exportList.push({ vehicle: vehicle, dieselQty: list[j]["dieselQty"], zone: list[j]["zone"], km: list[j]["km"], driver: list[j]["driver"] })
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
  totalAmount:string;
}
