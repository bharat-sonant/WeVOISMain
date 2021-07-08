import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../services/common/common.service';

@Component({
  selector: 'app-ward-monitoring-report',
  templateUrl: './ward-monitoring-report.component.html',
  styleUrls: ['./ward-monitoring-report.component.scss']
})
export class WardMonitoringReportComponent implements OnInit {

  constructor(public db: AngularFireDatabase, private commonService: CommonService) { }

  toDayDate: any;
  selectDate: any;
  currentMonthName: any; 
  currentYear: any;
  selectedCircle: any;
  wardProgressList: any[] = [];
  wardProgressListShow: any[] = [];
  wardList: any[] = [];

  ngOnInit() {
   // this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.getWards();
    this.selectedCircle = "Circle1";
    //this.commonService.chkUserPermission("Ward Monitoring Report");
    this.toDayDate = this.commonService.setTodayDate();
    this.selectDate = this.toDayDate;
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.toDayDate).getMonth());
    this.currentYear = new Date(this.toDayDate).getFullYear();
    $('#txtDate').val(this.toDayDate);
  }



  getWards() {
    let dbPath = "Defaults/CircleWiseWards";
    let circleWiseWard = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        if (data != null) {
          let circledata: any;
          for (let i = 0; i < data.length; i++) {
            circledata = data[i];
            if (i == 0) {
              for (let j = 1; j < circledata.length; j++) {
                this.wardList.push({ circle: 'Circle1', wardNo: circledata[j] });
              }
            }
            if (i == 1) {
              for (let j = 1; j < circledata.length; j++) {
                this.wardList.push({ circle: 'Circle2', wardNo: circledata[j] });
              }
            }
            if (i == 2) {
              for (let j = 1; j < circledata.length; j++) {
                this.wardList.push({ circle: 'Circle3', wardNo: circledata[j] });
              }
            }
          }
        }
        this.selectedCircle = 'Circle1';
        this.onSubmit();

        circleWiseWard.unsubscribe();
      });
  }

  changeCircleSelection(filterVal: any) {
    this.selectedCircle = filterVal;
    this.onSubmit();
  }

  setNextDate() {
    let currentDate = $('#txtDate').val();
    let nextDate = this.commonService.getNextDate(currentDate, 1);
    $('#txtDate').val(nextDate);
    this.selectDate = nextDate;
    this.onSubmit();
  }
  setPreviousDate() {
    let currentDate = $('#txtDate').val();
    let previousDate = this.commonService.getPreviousDate(currentDate, 1);
    $('#txtDate').val(previousDate);
    this.selectDate = previousDate;
    this.onSubmit();
  }

  setDate() {
    let currentDate = $('#txtDate').val();
    this.selectDate = currentDate;
    this.onSubmit();
  }

  onSubmit() {
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectDate).getMonth());
    this.currentYear = new Date(this.selectDate).getFullYear();
    this.wardProgressList = [];
    if (this.wardList.length > 0) {
      for (let i = 0; i < this.wardList.length; i++) {
        if (this.wardList[i]["circle"] == this.selectedCircle) {
          this.getZoneAllLines(this.wardList[i]["wardNo"]);
        }
      }

    }
  }

  getZoneAllLines(wardNo: any) {
    let wardLines = this.db.list('Defaults/WardLines/' + wardNo).valueChanges().subscribe(
      zoneLine => {
        wardLines.unsubscribe();
        this.getStartTime(wardNo, zoneLine.length);
      });
  }

  getWorkProgress(zoneNo: any, totalLines: any, startTime: any) {
    let d = new Date();
    let time = d.toLocaleTimeString('en-US').split(':')[0] + "." + d.toLocaleTimeString('en-US').split(':')[1];
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectDate).getMonth());
    this.currentYear = new Date(this.selectDate).getFullYear();
    let workProgressPath = 'WasteCollectionInfo/' + zoneNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectDate + '/LineStatus';
    let workProgressDetails = this.db.list(workProgressPath).valueChanges().subscribe(
      workerProgressData => {
        if (workerProgressData.length > 0) {
          let lineComplteList = [];
          for (let i = 0; i < workerProgressData.length; i++) {
            if (workerProgressData[i]["Status"] == "LineCompleted") {
              if (workerProgressData[i]["end-time"] != null) {
                let endtime = workerProgressData[i]["end-time"].split(':')[0] + "." + workerProgressData[i]["end-time"].split(':')[1];
                lineComplteList.push({ time: parseFloat(endtime) });
              }
            }
          }
          let k = 0;
          let lineCompleted = 0;
          if (lineComplteList.length > 0) {
            for (let wardIndex = 0; wardIndex < this.wardProgressList.length; wardIndex++) {
              if (this.wardProgressList[wardIndex]["wardNo"] == zoneNo) {
                k = wardIndex;
                lineComplteList = this.commonService.transform(lineComplteList, "time");
                let endtime = lineComplteList[lineComplteList.length - 1]["time"];
                for (let i = 0; i < lineComplteList.length; i++) {
                  lineCompleted = lineCompleted + 1;
                  if (parseFloat(lineComplteList[i]["time"]) < 7) {
                    this.wardProgressList[wardIndex]["percent7"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 8 && parseFloat(endtime) >= 7) {

                    this.wardProgressList[wardIndex]["percent8"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 9 && parseFloat(endtime) >= 8) {
                    this.wardProgressList[wardIndex]["percent9"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 10 && parseFloat(endtime) >= 9) {
                    this.wardProgressList[wardIndex]["percent10"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 11 && parseFloat(endtime) >= 10) {
                    this.wardProgressList[wardIndex]["percent11"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 12 && parseFloat(endtime) >= 11) {
                    this.wardProgressList[wardIndex]["percent12"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 13 && parseFloat(endtime) >= 12) {
                    this.wardProgressList[wardIndex]["percent13"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 14 && parseFloat(endtime) >= 13) {
                    this.wardProgressList[wardIndex]["percent14"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 15 && parseFloat(endtime) >= 14) {
                    this.wardProgressList[wardIndex]["percent15"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 16 && parseFloat(endtime) >= 15) {
                    this.wardProgressList[wardIndex]["percent16"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 17 && parseFloat(endtime) >= 16) {
                    this.wardProgressList[wardIndex]["percent17"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 18 && parseFloat(endtime) >= 17) {
                    this.wardProgressList[wardIndex]["percent18"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 19 && parseFloat(endtime) >= 18) {
                    this.wardProgressList[wardIndex]["percent19"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                  if (parseFloat(lineComplteList[i]["time"]) < 20 && parseFloat(endtime) >= 19) {
                    this.wardProgressList[wardIndex]["percent20"] = ((lineCompleted * 100) / totalLines).toFixed(0);
                  }
                }
              }
              if (this.toDayDate == this.selectDate) {
                let getRealTimeWardDetails = this.db.object("RealTimeDetails/WardDetails/" + zoneNo + "/activityStatus").valueChanges().subscribe(
                  data => {
                    if (data == "completed") {
                      let zoneDetails = this.wardProgressList.find(item => item.wardNo == zoneNo);
                      if (zoneDetails != undefined) {
                        zoneDetails.class = "completed";
                      }
                    }
                    getRealTimeWardDetails.unsubscribe();
                  });
              }
            }
          }
        }
        workProgressDetails.unsubscribe();
      });
  }

  getStartTime(zoneNo: any, totalLines: any) {
    let wardName=zoneNo;
    if(wardName.includes("mkt"))
    {
      wardName=wardName.replace("mkt","Market ");
    }


    this.wardProgressList.push({ wardNo: zoneNo, wardName:wardName, totalLines: totalLines, startTime: "", percent7: "", percent8: "", percent9: "", percent10: "", percent11: "", percent12: "", percent13: "", percent14: "", percent15: "", percent16: "", percent17: "", percent18: "", percent19: "", percent20: "", class: 'active', stopClass: '' });

    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectDate).getMonth());
    this.currentYear = new Date(this.selectDate).getFullYear();
    let workDetailsPath = 'WasteCollectionInfo/' + zoneNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectDate + '/WorkerDetails';
    let driverId = 0;
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe(
      workerData => {
        if (workerData != null) {
          driverId = workerData["driver"];
          let workStartTimePath = 'DailyWorkDetail/' + this.currentYear + '/' + this.currentMonthName + '/' + this.selectDate + '/' + driverId;
          let workStarts = this.db.object(workStartTimePath).valueChanges().subscribe(
            startData => {
              let startTime = "";
              if (startData["task1"] != null) {
                if (startData["task1"]["task"] == zoneNo) {
                  if (startData["task1"]["in-out"] != null) {
                    startTime = this.commonService.tConvert(Object.keys(startData["task1"]["in-out"])[0]);
                    let removeSecond = startTime.split(' ');
                    startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  }
                }
              }
              if (startTime == "") {
                if (startData["task2"] != null) {
                  if (startData["task2"]["task"] == zoneNo) {
                    if (startData["task2"]["in-out"] != null) {
                      startTime = Object.keys(startData["task2"]["in-out"])[0];
                      startTime = this.commonService.tConvert(startTime);
                      let removeSecond = startTime.split(' ');
                      startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                    }
                  }
                }
              }
              if (startTime == "") {
                if (startData["task3"] != null) {
                  if (startData["task3"]["task"] == zoneNo) {
                    if (startData["task3"]["in-out"] != null) {
                      startTime = Object.keys(startData["task3"]["in-out"])[0];
                      startTime = this.commonService.tConvert(startTime);
                      let removeSecond = startTime.split(' ');
                      startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                    }
                  }
                }
              }
              if (startTime == "") {
                if (startData["task4"] != null) {
                  if (startData["task4"]["task"] == zoneNo) {
                    if (startData["task4"]["in-out"] != null) {
                      startTime = Object.keys(startData["task4"]["in-out"])[0];
                      startTime = this.commonService.tConvert(startTime);
                      let removeSecond = startTime.split(' ');
                      startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                    }
                  }
                }
              }
              if (startTime == "") {
                if (startData["task5"] != null) {
                  if (startData["task5"]["task"] == zoneNo) {
                    if (startData["task5"]["in-out"] != null) {
                      startTime = Object.keys(startData["task5"]["in-out"])[0];
                      startTime = this.commonService.tConvert(startTime);
                      let removeSecond = startTime.split(' ');
                      startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                    }
                  }
                }
              }
              workStarts.unsubscribe();
              let zoneDetails = this.wardProgressList.find(item => item.wardNo == zoneNo);
              if (zoneDetails != undefined) {
                zoneDetails.startTime = startTime;
              }
              this.getWorkProgress(zoneNo, totalLines, startTime);
            });
          workDetails.unsubscribe();
        }
        else {
          let zoneDetails = this.wardProgressList.find(item => item.wardNo == zoneNo);
          if (zoneDetails != undefined) {
            zoneDetails.class = "inactive";
          }
        }
      });
  }
}
