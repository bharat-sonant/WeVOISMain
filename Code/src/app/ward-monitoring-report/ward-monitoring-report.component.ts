import { Component, OnInit } from '@angular/core';
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-ward-monitoring-report',
  templateUrl: './ward-monitoring-report.component.html',
  styleUrls: ['./ward-monitoring-report.component.scss']
})
export class WardMonitoringReportComponent implements OnInit {
  constructor(public fs: FirebaseService, private commonService: CommonService) { }

  selectedDate: any;
  selectedMonthName: any;
  selectedYear: any;
  selectedCircle: any;
  zoneProgressList: any[] = [];
  wardForWeightageList: any[] = [];
  zoneList: any[] = [];
  db: any;
  txtDate = "#txtDate";

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.selectedCircle = "Circle1";
    this.selectedDate = this.commonService.setTodayDate();
    this.getWardForLineWeitage();
    this.getSelectedYearMonth();

  }

  getWardForLineWeitage() {
    this.commonService.getWardForLineWeitage().then((wardForWeightageList: any) => {
      this.wardForWeightageList = wardForWeightageList;
      this.getCircleWards();
    });
  }

  getCircleWards() {
    this.zoneList = [];
    this.commonService.getCityWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
      this.selectedCircle = 'Circle1';
      this.getData();
    });
  }

  changeCircleSelection(filterVal: any) {
    this.selectedCircle = filterVal;
    this.getData();
  }

  setDate(filterVal: any, type: string) {
    let newDate = this.commonService.setDate(this.selectedDate, filterVal, type);
    $(this.txtDate).val(newDate);
    if (newDate != this.selectedDate) {
      this.selectedDate = newDate;
      this.getSelectedYearMonth();
      this.getData();
    }
    else {
      this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
    }
  }

  getSelectedYearMonth() {
    $(this.txtDate).val(this.selectedDate);
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  getData() {
    this.zoneProgressList = [];
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        if (this.zoneList[i]["circle"] == this.selectedCircle) {
          let zoneName = this.zoneList[i]["wardNo"];
          if (zoneName.includes("mkt")) {
            zoneName = zoneName.replace("mkt", "Market ");
          }
          this.zoneProgressList.push({ zoneNo: this.zoneList[i]["wardNo"], zoneName: zoneName, totalLines: 0, startTime: "", percent7: "", percent8: "", percent9: "", percent10: "", percent11: "", percent12: "", percent13: "", percent14: "", percent15: "", percent16: "", percent17: "", percent18: "", percent19: "", percent20: "", class: 'active', stopClass: '', lineWeightage: [] });
          this.zoneProgressList = this.commonService.transformString(this.zoneProgressList, "wardNo");
          this.getZoneAllLine(this.zoneList[i]["wardNo"]);
        }
      }
    }
  }

  getZoneAllLine(zoneNo: any) {
    this.commonService.getWardLineWeightage(zoneNo, this.selectedDate).then((lineList: any) => {
      let totalLines = lineList[lineList.length - 1]["totalLines"];
      let zoneDetail = this.zoneProgressList.find(item => item.zoneNo == zoneNo);
      if (zoneDetail != undefined) {
        let wardDetail = this.wardForWeightageList.find(item => item.zoneNo == zoneNo);
        if (wardDetail != undefined) {
          zoneDetail.lineWeightage = lineList;
        }
        this.getStartTime(zoneNo, totalLines);
      }
    });
  }

  getStartTime(zoneNo: any, totalLines: any) {
    let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/dutyInTime";
    let dutyStartInstance = this.db.object(dbPath).valueChanges().subscribe(
      dutyStartTime => {
        dutyStartInstance.unsubscribe();
        let zoneDetails = this.zoneProgressList.find(item => item.zoneNo == zoneNo);
        if (zoneDetails != undefined) {
          if (dutyStartTime == null) {
            zoneDetails.class = "inactive";
          }
          else {
            let startTime = dutyStartTime.split(',')[0];
            zoneDetails.startTime = startTime;
            this.getWorkProgress(zoneNo, totalLines);
          }
        }
      }
    );
  }

  getWorkProgress(zoneNo: any, totalLines: any) {
    let workProgressPath = 'WasteCollectionInfo/' + zoneNo + '/' + this.selectedYear + '/' + this.selectedMonthName + '/' + this.selectedDate + '/LineStatus';
    let workProgressDetails = this.db.object(workProgressPath).valueChanges().subscribe(
      workerProgressData => {
        workProgressDetails.unsubscribe();
        if (workerProgressData != null) {
          let zoneDetail = this.zoneProgressList.find(item => item.zoneNo == zoneNo);
          if (zoneDetail != undefined) {
            let lineWeightageList = zoneDetail.lineWeightage;
            let lineComplteList = [];
            let keyArray = Object.keys(workerProgressData);
            if (keyArray.length > 0) {
              for (let index = 0; index < keyArray.length; index++) {
                let lineNo = keyArray[index];
                if (workerProgressData[lineNo]["end-time"] != null) {
                  let lineWeightage = 1;
                  let lineWeightageDetail = lineWeightageList.find(item => item.lineNo == lineNo);
                  if (lineWeightageDetail != undefined) {
                    lineWeightage = lineWeightageDetail.weightage;
                  }
                  let endtime = workerProgressData[lineNo]["end-time"].split(':')[0] + "." + workerProgressData[lineNo]["end-time"].split(':')[1];
                  lineComplteList.push({ time: parseFloat(endtime), lineWeightage: lineWeightage, lineStatus: workerProgressData[lineNo]["Status"] });
                }
              }
              if (lineWeightageList.length > 0) {
                this.getWorkLineWeightagePercentage(lineComplteList, totalLines, zoneDetail);
              }
              else {
                let lineCompleted = 0;
                if (lineComplteList.length > 0) {
                  let zoneDetails = this.zoneProgressList.find(item => item.zoneNo == zoneNo);
                  if (zoneDetails != undefined) {
                    lineComplteList = this.commonService.transform(lineComplteList, "time");
                    let endTime = lineComplteList[lineComplteList.length - 1]["time"];
                    for (let i = 0; i < lineComplteList.length; i++) {
                      if (lineComplteList[i]["lineStatus"] == "LineCompleted") {
                        lineCompleted = lineCompleted + 1;
                        let percentage = (lineCompleted * 100) / totalLines;
                        this.getWardWorkPercentage(lineComplteList[i]["time"], zoneDetails, percentage, endTime);
                      }
                    }
                    this.getWardStatus(zoneDetails);
                  }
                }
              }
            }
          }
        }
      });
  }

  getWorkLineWeightagePercentage(lineComplteList: any, totalLines: any, zoneDetail: any) {
    let percentage = 0;
    let skippedLines = 0;
    let skippedPercentage = 0;
    if (lineComplteList.length > 0) {
      lineComplteList = this.commonService.transform(lineComplteList, "time");
      let endtime = lineComplteList[lineComplteList.length - 1]["time"];
      for (let i = 0; i < lineComplteList.length; i++) {
        if (lineComplteList[i]["lineStatus"] == "LineCompleted") {
          percentage += (100 / Number(totalLines)) * parseFloat(lineComplteList[i]["lineWeightage"]);
        }
        else {
          skippedLines++;
        }

        if (skippedLines > 0) {
          skippedPercentage = 100 - ((skippedLines / Number(totalLines)) * 100);
          if (percentage > skippedPercentage) {
            percentage = skippedPercentage;
          }
        }

        if (percentage > 100) {
          percentage = 100;
        }
        this.getWardWorkPercentage(lineComplteList[i]["time"], zoneDetail, percentage, endtime);
      }
      this.getWardStatus(zoneDetail);
    }
  }

  getWardWorkPercentage(time: any, zoneDetail: any, percentage: any, endTime: any) {
    if (parseFloat(time) < 7) {
      zoneDetail.percent7 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 8 && parseFloat(endTime) >= 7) {
      zoneDetail.percent8 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 9 && parseFloat(endTime) >= 8) {
      zoneDetail.percent9 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 10 && parseFloat(endTime) >= 9) {
      zoneDetail.percent10 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 11 && parseFloat(endTime) >= 10) {
      zoneDetail.percent11 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 12 && parseFloat(endTime) >= 11) {
      zoneDetail.percent12 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 13 && parseFloat(endTime) >= 12) {
      zoneDetail.percent13 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 14 && parseFloat(endTime) >= 13) {
      zoneDetail.percent14 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 15 && parseFloat(endTime) >= 14) {
      zoneDetail.percent15 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 16 && parseFloat(endTime) >= 15) {
      zoneDetail.percent16 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 17 && parseFloat(endTime) >= 16) {
      zoneDetail.percent17 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 18 && parseFloat(endTime) >= 17) {
      zoneDetail.percent18 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 19 && parseFloat(endTime) >= 18) {
      zoneDetail.percent19 = percentage.toFixed(0);
    }
    if (parseFloat(time) < 20 && parseFloat(endTime) >= 19) {
      zoneDetail.percent20 = percentage.toFixed(0);
    }
  }

  getWardStatus(zoneDetails: any) {
    if (this.selectedDate == this.commonService.setTodayDate()) {
      let getRealTimeWardDetails = this.db.object("RealTimeDetails/WardDetails/" + zoneDetails.zoneNo + "/activityStatus").valueChanges().subscribe(
        statusData => {
          getRealTimeWardDetails.unsubscribe();
          if (statusData == "completed") {
            zoneDetails.class = "completed";
          }
        });
    }
  }
}
