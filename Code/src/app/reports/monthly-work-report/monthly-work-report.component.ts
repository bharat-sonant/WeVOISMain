import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-monthly-work-report',
  templateUrl: './monthly-work-report.component.html',
  styleUrls: ['./monthly-work-report.component.scss']
})
export class MonthlyWorkReportComponent {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  zoneList: any[] = [];
  selectedDate: any;
  selectedMonth: any;
  selectedMonthName: any;
  selectedYear: any;
  selectedZone: any;
  ddlZone = "#ddlZone";
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  isShowActual: any;
  serviceName = "monthly-work-report";
  toDayDate: any;
  yearList: any[] = [];
  monthWorkList: any[] = [];
  minHaltTime: any;
  public userType: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userType = localStorage.getItem("userType");
    //this.userType = "External User";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("General-Reports", "Daily-Work-Report", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedZone = "0";
    this.minHaltTime = 5;
    this.getYear();
    this.getZones();
    this.getMinHaltTime();
  }

  getMinHaltTime() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSettings%2FHaltSetting.json?alt=media";
    let haltJsonInstance = this.httpService.get(path).subscribe(haltJsonData => {
      haltJsonInstance.unsubscribe();
      if (haltJsonData != null) {
        if (haltJsonData["allowedHalt"] != null) {
          this.minHaltTime = Number(haltJsonData["allowedHalt"]);
        }
        else {
          this.minHaltTime = 5;
        }
      }
      else {
        this.minHaltTime = 5;
      }
    });
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.toDayDate.split('-')[0];
    this.selectedMonth = this.toDayDate.split('-')[1];
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  changeFilter() {
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedZone = $(this.ddlZone).val();
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if (this.selectedMonth == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getData();
  }

  getData() {
    this.monthWorkList = [];
    let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    for (let i = 1; i <= days; i++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
      this.monthWorkList.push({ date: monthDate });
      this.getWardWorkerDetail(monthDate);
      this.getWardSummary(monthDate);
    }
  }

  getWardWorkerDetail(date: any) {
    let workerInstance = this.db.object("WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + date + "/WorkerDetails").valueChanges().subscribe(data => {
      workerInstance.unsubscribe();
      if (data != null) {
        let driverName = "";
        let helperName = "";
        let vehicle = "";

        if (data["driverName"] != null) {
          let list = data["driverName"].split(",");
          for (let i = 0; i < list.length; i++) {
            if (i == 0) {
              driverName = list[i].trim();
            }
            else {
              if (!driverName.includes(list[i].trim())) {
                driverName = driverName + ", " + list[i].trim();
              }
            }
          }
        }
        if (data["helperName"] != null) {
          let list = data["helperName"].split(",");
          for (let i = 0; i < list.length; i++) {
            if (i == 0) {
              helperName = list[i].trim();
            }
            else {
              if (!helperName.includes(list[i].trim())) {
                helperName = helperName + ", " + list[i].trim();
              }
            }
          }
        }
        if (data["vehicle"] != null) {
          let list = data["vehicle"].split(",");
          for (let i = 0; i < list.length; i++) {
            if (i == 0) {
              vehicle = list[i].trim();
            }
            else {
              if (!vehicle.includes(list[i].trim())) {
                vehicle = vehicle + ", " + list[i].trim();
              }
            }
          }
        }
        let detail = this.monthWorkList.find(item => item.date == date);
        if (detail != undefined) {
          detail.driver = driverName;
          detail.helper = helperName;
          detail.vehicle = vehicle;
        }
      }
    })

  }

  getWardSummary(date: any) {
    let workerInstance = this.db.object("WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + date + "/Summary").valueChanges().subscribe(data => {
      workerInstance.unsubscribe();
      if (data != null) {
        let startTime = "";
        let reachTime = "";
        let endTime = "";
        let zoneRunKM = "";
        let workPercentage = "";
        let actualWorkPercentage = "";
        if (data["dutyInTime"] != null) {
          startTime = data["dutyInTime"].split(",")[0];
        }
        if (data["wardReachedOn"] != null) {
          reachTime = data["wardReachedOn"].split(",")[0];
        }
        if (data["dutyOutTime"] != null) {
          endTime = data["dutyOutTime"].split(",")[data["dutyOutTime"].split(",").length - 1];
        }
        if (data["wardCoveredDistance"] != null) {
          zoneRunKM = data["wardCoveredDistance"];
        }
        if (data["workPercentage"] != null) {
          actualWorkPercentage = Math.round(Number(data["workPercentage"])).toFixed(0) + "%";
          workPercentage = Math.round(Number(data["workPercentage"])).toFixed(0) + "%";
        }
        if (data["updatedWorkPercentage"] != null) {
          workPercentage = Math.round(Number(data["updatedWorkPercentage"])).toFixed(0) + "%";
        }

        let sTime = new Date(date + " " + startTime);
        let eTime = new Date();
        if (endTime != "") {
          eTime = new Date(date + " " + endTime);
        }
        let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));

        let detail = this.monthWorkList.find(item => item.date == date);
        if (detail != undefined) {
          detail.startTime = startTime;
          detail.reachTime = reachTime;
          detail.endTime = endTime;
          detail.zoneRunKM = (Number(zoneRunKM) / 1000).toFixed(3);
          detail.workPercentage = workPercentage;
          detail.actualWorkPercentage = actualWorkPercentage;
          detail.workTime = this.commonService.getHrsFull(totalMinutes);
        }
        this.getHaltTime(date, startTime, endTime);
        this.getTotalRunKM(date, startTime, endTime);
      }
    });
  }

  getHaltTime(date: any, startTime: any, endTime: any) {
    let haltInfoPath = "HaltInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + date;
    let haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe((haltData) => {
      haltInfoData.unsubscribe();
      if (haltData != undefined) {
        if (haltData.length > 0) {
          let sTime = new Date(date + " " + startTime);
          let eTime = new Date(date);
          if (endTime !== "") {
            eTime = new Date(date + " " + endTime);
          }
          let totalBreak = 0;
          for (let index = 0; index < haltData.length; index++) {
            if (haltData[index]["haltType"] != "network-off") {
              if (haltData[index]["location"] != null) {
                let haltStartTime = haltData[index]["startTime"];
                let haltTime = new Date(date + " " + haltStartTime);
                if (date == this.toDayDate) {
                  if (haltTime >= sTime) {
                    let duration = haltData[index]["duration"] ? haltData[index]["duration"] : 0;
                    if (Number(duration) > Number(this.minHaltTime)) {
                      totalBreak += duration;
                    }
                  }
                }
                else {
                  if (haltTime >= sTime && haltTime <= eTime) {
                    let duration = haltData[index]["duration"] ? haltData[index]["duration"] : 0;
                    if (haltData[index]["endTime"] != null) {
                      let endHaltTime = new Date(date + " " + haltData[index]["endTime"]);
                      if (eTime > endHaltTime) {
                        duration = this.commonService.timeDifferenceMin(endHaltTime, haltTime);
                      }
                      else {
                        duration = 0;
                      }
                    }
                    else {
                      duration = 0;
                    }
                    if (duration > Number(this.minHaltTime)) {
                      totalBreak += duration;
                    }
                  }
                }
              }
            }
          }
          if (totalBreak > 0) {
            let detail = this.monthWorkList.find(item => item.date == date);
            if (detail != undefined) {
              detail.haltTime = this.commonService.getHrs(totalBreak) + " hr";
            }
          }
        }
      }
    });
  }

  getTotalRunKM(date: any, startTime: any, endTime: any) {
    let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + date;
    let distance = 0;
    let vehicleTracking = this.db.object(dbPath).valueChanges().subscribe(
      routePath => {
        vehicleTracking.unsubscribe();
        if (routePath != null) {
          if (endTime == "") {
            if (date == this.toDayDate) {
              endTime = this.commonService.getCurrentTime();
            }
            else {
              endTime = "23:59:00";
            }
          }
          let dutyInDateTime = new Date(date + " " + startTime);
          let dutyOutDateTime = new Date(date + " " + endTime);
          let routeKeyArray = Object.keys(routePath);
          let keyArray = [];
          if (routeKeyArray.length > 0) {
            for (let i = 0; i < routeKeyArray.length; i++) {
              if (!routeKeyArray[i].toString().includes('-')) {
                keyArray.push(routeKeyArray[i]);
              }
            }
          }
          let newArray = keyArray.reverse();
          let keyArrayNew = [];
          for (let i = 0; i < newArray.length; i++) {
            let index = newArray[i];
            if (newArray[i + 1] != undefined) {
              let nextIndex = newArray[i + 1];
              let time = index.toString().split('-')[0];
              let nextTime = nextIndex.toString().split('-')[0];
              if (time == nextTime) {
                keyArrayNew.push(index);
                i++;
              }
              else {
                keyArrayNew.push(index);
              }
            }
            else {
              keyArrayNew.push(index);
            }
          }
          keyArray = keyArrayNew.reverse();
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            let time = index.toString().split('-')[0];
            if (routePath[index]["distance-in-meter"] != null || routePath[index]["distance-in-meter"] != undefined) {

              let routeDateTime = new Date(date + " " + time);
              if (routeDateTime >= dutyInDateTime && routeDateTime <= dutyOutDateTime) {
                distance += Number(routePath[index]["distance-in-meter"]);
              }
            }
          }
          let detail = this.monthWorkList.find(item => item.date == date);
          if (detail != undefined) {
            detail.runKM = (distance / 1000).toFixed(3);
          }
        }
      });
  }

  exportToExcel() {
    if (this.monthWorkList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Zone";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Start Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Ward Reach On";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "End Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Vehicle";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Driver";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Helper";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Work Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Halt Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Work Percentage";
      htmlString += "</td>";
      /*
      if (this.userType == "Internal User") {
        htmlString += "<td>";
        htmlString += "Actual Work Percentage";
        htmlString += "</td>";
      }
      */
      htmlString += "<td>";
      htmlString += "Run KM";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Zone Run KM";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Ward Coverage Report Approximate in %";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "S. I. Sign";
      htmlString += "</td>";
      htmlString += "</tr>";
      if (this.monthWorkList.length > 0) {
        for (let i = 0; i < this.monthWorkList.length; i++) {
          htmlString += "<tr>";
          htmlString += "<td t='s'>";
          htmlString += this.monthWorkList[i]["date"];
          htmlString += "</td>";
          htmlString += "<td t='s'>";
          htmlString += this.selectedZone;
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["startTime"] != null) {
            htmlString += this.monthWorkList[i]["startTime"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["reachTime"] != null) {
            htmlString += this.monthWorkList[i]["reachTime"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["endTime"] != null) {
            htmlString += this.monthWorkList[i]["endTime"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["vehicle"] != null) {
            htmlString += this.monthWorkList[i]["vehicle"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["driver"] != null) {
            htmlString += this.monthWorkList[i]["driver"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["helper"] != null) {
            htmlString += this.monthWorkList[i]["helper"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["workTime"] != null) {
            htmlString += this.monthWorkList[i]["workTime"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["haltTime"] != null) {
            htmlString += this.monthWorkList[i]["haltTime"];
          }
          htmlString += "</td>";
          htmlString += "<td t='s'>";
          if (this.monthWorkList[i]["workPercentage"] != null) {
            htmlString += this.monthWorkList[i]["workPercentage"];
          }
          htmlString += "</td>";
          /*
          if (this.userType == "Internal User") {
            htmlString += "<td t='s'>";
            if (this.monthWorkList[i]["actualWorkPercentage"] != null) {
              htmlString += this.monthWorkList[i]["actualWorkPercentage"];
            }
            htmlString += "</td>";
          }
          */
          htmlString += "<td>";
          if (this.monthWorkList[i]["runKM"] != null) {
            htmlString += this.monthWorkList[i]["runKM"];
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.monthWorkList[i]["zoneRunKM"] != null) {
            htmlString += this.monthWorkList[i]["zoneRunKM"];
          }
          htmlString += "</td>";
          htmlString += "<td>";

          htmlString += "</td>";
          htmlString += "<td>";

          htmlString += "</td>";
          htmlString += "</tr>";
        }
      }
      htmlString += "</table>";
      let fileName = this.commonService.getFireStoreCity() + "-Monthly-Work-Report-" + this.selectedZone + "-" + this.selectedYear + "-" + this.selectedMonthName + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }

  }
}
