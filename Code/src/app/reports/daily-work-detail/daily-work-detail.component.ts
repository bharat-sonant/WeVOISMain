import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-daily-work-detail',
  templateUrl: './daily-work-detail.component.html',
  styleUrls: ['./daily-work-detail.component.scss']
})
export class DailyWorkDetailComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  zoneList: any[] = [];
  dailyWorkList: any[];
  selectedDate: any;
  selectedMonth: any;
  selectedMonthName: any;
  selectedYear: any;
  txtDate = "#txtDate";
  isShowActual: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.isShowActual = false;
    if (localStorage.getItem("isActualWorkPercentage") != null) {
      console.log(localStorage.getItem("isActualWorkPercentage"))
      if (localStorage.getItem("isActualWorkPercentage") == "1") {
        this.isShowActual = true;
      }
    }
    this.selectedDate = this.commonService.setTodayDate();
    $(this.txtDate).val(this.selectedDate);
    this.getSelectedYearMonthName();
    this.getZones();
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.getDailyWorkDetail();
  }

  getSelectedYearMonthName() {
    this.selectedMonth = Number(this.selectedDate.split('-')[1]);
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.getSelectedYearMonthName();
        this.getDailyWorkDetail();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  getDailyWorkDetail() {
    this.dailyWorkList = [];
    if (this.zoneList.length > 0) {
      for (let i = 1; i < this.zoneList.length; i++) {
        let zoneNo = this.zoneList[i]["zoneNo"];
        this.dailyWorkList.push({ zoneNo: zoneNo, zoneName: this.zoneList[i]["zoneName"] });
        this.getWorkerDetail(zoneNo);
        this.getSummaryDetail(zoneNo);
        let dbPath = "LocationHistory/" + zoneNo + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
        this.getTotalRunning(zoneNo, dbPath);
      }
    }
    if (this.selectedDate == this.commonService.setTodayDate()) {
      this.getBinLiftingDetail("DustbinData/DustbinPickingPlans/" + this.selectedDate);
    }
    let dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    this.getBinLiftingDetail(dbPath);
  }

  getTotalRunning(zoneNo: any, dbPath: any) {
    let locationInstance = this.db.object(dbPath).valueChanges().subscribe(
      locationData => {
        locationInstance.unsubscribe();
        console.log(locationData);
        let distance = "0";
        if (locationData != null) {
          let keyArray = Object.keys(locationData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let time = keyArray[i];
              if (locationData[time]["distance-in-meter"] != null) {
                let coveredDistance = locationData[time]["distance-in-meter"];
                distance = (Number(distance) + Number(coveredDistance)).toFixed(0);
              }
            }

          }
          let detail = this.dailyWorkList.find(item => item.zoneNo == zoneNo);
          if (detail != undefined) {
            detail.runKm = (Number(distance) / 1000).toFixed(3);
          }
        }
      });
  }

  getBinLiftingDetail(dbPath: any) {
    let dustbinPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
      planData => {
        dustbinPlanInstance.unsubscribe();
        if (planData != null) {
          let keyArray = Object.keys(planData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let planKey = keyArray[i];
              if (planData[planKey]["isAssigned"] == "true") {
                if (planData[planKey]["planName"] != "") {
                  let pickedDustbin = 0;
                  if (planData[planKey]["pickedDustbin"] != null) {
                    if (planData[planKey]["pickedDustbin"] != "") {
                      pickedDustbin = planData[planKey]["pickedDustbin"].split(',').length;
                    }
                  }
                  let assignedDustbin = 0;
                  if (planData[planKey]["bins"] != null) {
                    if (planData[planKey]["bins"] != "") {
                      assignedDustbin = planData[planKey]["bins"].split(',').length;
                    }
                  }
                  let bins = pickedDustbin + "/" + assignedDustbin;
                  let percentage = ((pickedDustbin * 100) / assignedDustbin).toFixed(0) + "%";
                  this.dailyWorkList.push({ zoneNo: planKey, zoneName: "BinLifting(" + planData[planKey]["planName"] + ")", trips: bins, workPercentage: percentage });
                  this.getPlanAssignment(planKey);
                }
              }
            }
          }
        }
      }
    );
  }

  getPlanAssignment(planKey: any) {
    let dbPath = "DustbinData/DustbinAssignment/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + planKey;
    let assignmentDataInstance = this.db.object(dbPath).valueChanges().subscribe(
      assignedData => {
        assignmentDataInstance.unsubscribe();
        if (assignedData != null) {
          let driverId = assignedData["driver"];
          let helperId = assignedData["helper"];
          let vehicle = assignedData["vehicle"];
          let dbPath = "LocationHistory/BinLifting/" + vehicle + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
          this.getTotalRunning(planKey, dbPath);

          this.getBinliftingData(driverId, planKey, "driver");
          this.getBinliftingData(helperId, planKey, "helper");
          if (assignedData["secondHelper"] != null) {
            let secondHelperId = assignedData["secondHelper"];
            this.getBinliftingData(secondHelperId, planKey, "secondHelper");
          }
        }
      }
    );
  }

  getBinliftingData(empId: any, planKey: any, type: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      let name = employee["name"];
      let detail = this.dailyWorkList.find(item => item.zoneNo == planKey);
      if (detail != undefined) {
        if (type == "driver") {
          detail.driver = name + "(" + empId + ")";
          let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + empId;
          let workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
            workDetailData => {
              workDetailInstance.unsubscribe();
              if (workDetailData != null) {
                for (let i = 0; i <= 5; i++) {
                  if (workDetailData["task" + i] != null) {
                    if (workDetailData["task" + i]["binLiftingPlanId"] == planKey) {
                      let vehicle = workDetailData["task" + i]["vehicle"];
                      let startTime = "";
                      let endTime = "";
                      if (Object.keys(workDetailData["task" + i + ""]["in-out"])[0] != null) {
                        startTime = this.commonService.tConvert(Object.keys(workDetailData["task" + i + ""]["in-out"])[0]);
                        let removeSecond = startTime.split(" ");
                        startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                      }
                      if (Object.keys(workDetailData["task" + i + ""]["in-out"])[1] != null) {
                        endTime = this.commonService.tConvert(Object.keys(workDetailData["task" + i + ""]["in-out"])[1]);
                        let removeSecond = endTime.split(" ");
                        endTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                      }
                      detail.vehicle = vehicle;
                      detail.startTime = startTime;
                      detail.endTime = endTime;
                      let sTime = new Date(this.selectedDate + " " + startTime);
                      let eTime = new Date();
                      if (endTime != "") {
                        eTime = new Date(this.selectedDate + " " + endTime);
                      }
                      let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
                      detail.workTime = this.commonService.getHrsFull(totalMinutes);
                    }
                  }
                }
              }
            }
          );
        }
        else if (type == "helper") {
          detail.helper = name + "(" + empId + ")";
        }
        else {
          detail.secondHelper = name + "(" + empId + ")";
        }
      }
    });
  }

  getSummaryDetail(zoneNo: any) {
    let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary";
    let summaryDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
      summaryData => {
        summaryDetailInstance.unsubscribe();
        if (summaryData != null) {
          if (summaryData["dutyInTime"] != null) {
            let startTime = summaryData["dutyInTime"].split(',')[0];
            let endTime = "";
            let trips = "0";
            let workPercentage = "";
            let actualWorkPercentage = "0%";
            let wardRunKm = "0.000";
            if (summaryData["dutyOutTime"] != null) {
              endTime = summaryData["dutyOutTime"].split(',')[summaryData["dutyOutTime"].split(',').length - 1];
            }
            if (summaryData["trip"] != null) {
              trips = summaryData["trip"];
            }
            if (summaryData["workPercentage"] != null) {
              workPercentage = summaryData["workPercentage"] + "%";
              actualWorkPercentage = summaryData["workPercentage"] + "%";
            }
            if (summaryData["updatedWorkPercentage"] != null) {
              workPercentage = summaryData["updatedWorkPercentage"] + "%";
            }
            if (summaryData["wardCoveredDistance"] != null) {
              wardRunKm = (Number(summaryData["wardCoveredDistance"]) / 1000).toFixed(3);
            }

            let detail = this.dailyWorkList.find(item => item.zoneNo == zoneNo);
            if (detail != undefined) {
              detail.startTime = startTime;
              detail.endTime = endTime;
              detail.trips = trips;
              detail.wardRunKm = wardRunKm;
              detail.workPercentage = workPercentage;
              detail.actualWorkPercentage = actualWorkPercentage;
              let sTime = new Date(this.selectedDate + " " + startTime);
              let eTime = new Date();
              if (endTime != "") {
                eTime = new Date(this.selectedDate + " " + endTime);
              }
              let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
              detail.workTime = this.commonService.getHrsFull(totalMinutes);
            }
          }
        }
      });
  }

  getWorkerDetail(zoneNo: any) {
    let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/WorkerDetails";
    let workerDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
      workerData => {
        workerDetailInstance.unsubscribe();
        if (workerData != null) {
          let driverList = workerData["driverName"].split(',');
          let driverIdList = workerData["driver"].split(',');
          let driver = "";
          for (let j = 0; j < driverIdList.length; j++) {
            if (driverList[j] != null) {
              if (driver == "") {
                driver = driverList[j] + " (" + driverIdList[j] + ")";
              }
              else {
                if (!driver.includes(driverList[j])) {
                  driver += ", " + driverList[j] + " (" + driverIdList[j] + ")";
                }
              }
            }
          }
          let helperList = workerData["helperName"].split(',');
          let helperIdList = workerData["helper"].split(',');
          let helper = "";
          for (let j = 0; j < helperIdList.length; j++) {
            if (helperList[j] != null) {
              if (helper == "") {
                helper = helperList[j] + " (" + helperIdList[j] + ")";
              }
              else {
                if (!helper.includes(helperList[j])) {
                  helper += ", " + helperList[j] + " (" + helperIdList[j] + ")";
                }
              }
            }
          }
          let secondHelper = "";
          if (workerData["secondHelper"] != null) {
            let secondHelperList = workerData["secondHelperName"].split(',');
            let secondHelperIdList = workerData["secondHelper"].split(',');
            for (let j = 0; j < secondHelperIdList.length; j++) {
              if (secondHelperList[j] != null) {
                if (secondHelper == "") {
                  secondHelper = secondHelperList[j] + " (" + secondHelperIdList[j] + ")";
                }
                else {
                  if (!secondHelper.includes(secondHelperList[j])) {
                    secondHelper += ", " + secondHelperList[j] + " (" + secondHelperIdList[j] + ")";
                  }
                }
              }
            }
          }
          let vehicle = "";
          if (workerData["vehicle"] != null) {
            let vehicleList = workerData["vehicle"].split(',');
            for (let j = 0; j < vehicleList.length; j++) {
              if (vehicleList[j] != null) {
                if (vehicle == "") {
                  vehicle = vehicleList[j];
                }
                else {
                  if (!vehicle.includes(vehicleList[j])) {
                    vehicle += ", " + vehicleList[j];
                  }
                }
              }
            }
          }
          let detail = this.dailyWorkList.find(item => item.zoneNo == zoneNo);
          if (detail != undefined) {
            detail.driver = driver;
            detail.helper = helper;
            detail.secondHelper = secondHelper;
            detail.vehicle = vehicle;
          }
        }
      }
    );
  }


  exportToExcel() {
    let htmlString = "";
    htmlString = "<table>";
    htmlString += "<tr>";
    htmlString += "<td>";
    htmlString += "Zone";
    htmlString += "</td>";
    htmlString += "<td>";
    htmlString += "Start Time";
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
    htmlString += "Second Helper";
    htmlString += "</td>";
    htmlString += "<td>";
    htmlString += "Trip/Bins";
    htmlString += "</td>";
    htmlString += "<td>";
    htmlString += "Work Time";
    htmlString += "</td>";
    htmlString += "<td>";
    htmlString += "Work Percentage";
    htmlString += "</td>";
    htmlString += "<td>";
    htmlString += "Run KM";
    htmlString += "</td>";
    htmlString += "<td>";
    htmlString += "Zone Run KM";
    htmlString += "</td>";
    htmlString += "</tr>";
    if (this.dailyWorkList.length > 0) {
      for (let i = 0; i < this.dailyWorkList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.dailyWorkList[i]["zoneName"];
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["startTime"] != null) {
          htmlString += this.dailyWorkList[i]["startTime"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["endTime"] != null) {
          htmlString += this.dailyWorkList[i]["endTime"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["vehicle"] != null) {
          htmlString += this.dailyWorkList[i]["vehicle"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["driver"] != null) {
          htmlString += this.dailyWorkList[i]["driver"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["helper"] != null) {
          htmlString += this.dailyWorkList[i]["helper"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["secondHelper"] != null) {
          htmlString += this.dailyWorkList[i]["secondHelper"];
        }
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        if (this.dailyWorkList[i]["trips"] != null) {
          htmlString += this.dailyWorkList[i]["trips"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["workTime"] != null) {
          htmlString += this.dailyWorkList[i]["workTime"];
        }
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        if (this.dailyWorkList[i]["workPercentage"] != null) {
          htmlString += this.dailyWorkList[i]["workPercentage"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["runKm"] != null) {
          htmlString += this.dailyWorkList[i]["runKm"];
        }
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.dailyWorkList[i]["wardRunKm"] != null) {
          htmlString += this.dailyWorkList[i]["wardRunKm"];
        }
        htmlString += "</td>";
        htmlString += "</tr>";
      }
    }
    htmlString += "</table>";
    let fileName = this.commonService.getFireStoreCity() + "-Daily-Work-Report-" + this.selectedDate.split('-')[2] + "-" + this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split('-')[1])) + "-" + this.selectedDate.split('-')[0] + ".xlsx";
    this.commonService.exportExcel(htmlString, fileName);
  }
}
