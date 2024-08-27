import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-ward-work-done',
  templateUrl: './ward-work-done.component.html',
  styleUrls: ['./ward-work-done.component.scss']
})
export class WardWorkDoneComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService) { }
  public cityName: any;
  db: any;
  toDayDate: any;
  selectedCircle: any;
  zoneList: any[] = [];
  workDateList: any[] = [];
  workDoneList: any[] = [];
  wardForWeightageList: any[] = [];
  serviceName = "7-days-work-done-report";
  userType: any;

  ngOnInit() {
    this.userType = localStorage.getItem("userType");
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("General-Reports", "7-Days-Work-Done-Report", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.getWardForLineWeitage();
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
  }

  getWardForLineWeitage() {
    this.commonService.getWardForLineWeitage().then((wardForWeightageList: any) => {
      this.wardForWeightageList = wardForWeightageList;
      this.getZones();
    });
  }

  changeCircleSelection(filterVal: any) {
    this.workDoneList = [];
    this.selectedCircle = filterVal;
    this.getZoneList();
  }

  getWorkDoneDates() {
    this.workDateList.push({ day: 'day1', class: 'class1', date: this.toDayDate });
    for (let i = 1; i < 7; i++) {
      let previousDate = this.commonService.getPreviousDate(this.toDayDate, i);
      this.workDateList.push({ day: 'day' + (i + 1), class: 'class' + (i + 1), date: previousDate });
    }
    this.getZoneList();
  }

  getZoneList() {
    let list = this.zoneList.filter(item => item.circle == this.selectedCircle);
    for (let i = 0; i < list.length; i++) {
      this.workDoneList.push({ zoneNo: list[i]["wardNo"], day1: 0, day2: 0, day3: 0, day4: 0, day5: 0, day6: 0, day7: 0, });
      let wardDetail = this.wardForWeightageList.find(item => item.zoneNo == list[i]["wardNo"]);
      if (wardDetail != undefined) {
        this.getWardLineWeightage(list[i]["wardNo"]);
      }
      else {
        this.getWorkDone(list[i]["wardNo"]);
      }
    }
  }

  getWardLineWeightage(zoneNo: any) {
    if (this.workDateList.length > 0) {
      for (let i = 0; i < this.workDateList.length; i++) {
        let date = this.workDateList[i]["date"];
        this.commonService.getWardLineWeightage(zoneNo, date).then((lineWeightageList: any) => {
          this.getWorkDoneWithLineWeightage(zoneNo, date, lineWeightageList);
        });
      }
    }
  }

  getWorkDone(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWorkDone");
    if (this.workDateList.length > 0) {
      for (let i = 0; i < this.workDateList.length; i++) {
        let date = this.workDateList[i]["date"];
        let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
        let year = date.split('-')[0];
        let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + date + "/Summary/";
        let workPercentageInstance = this.db.object(dbPath).valueChanges().subscribe(
          workPercentage => {
            workPercentageInstance.unsubscribe();
            let detail = this.workDoneList.find(item => item.zoneNo == zoneNo);
            if (detail != undefined) {
              let dateDetail = this.workDateList.find(item => item.date == date);
              if (dateDetail != undefined) {
                if (workPercentage != null) {
                  this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWorkDone", workPercentage);
                  if (workPercentage.workPercentage != null) {
                    detail[dateDetail.day] = workPercentage.workPercentage;
                    if (Number(workPercentage.workPercentage) < 85) {
                      detail[dateDetail.class] = "lessWork";
                    }
                  }
                  else{
                    detail[dateDetail.class] = "inactive";
                  }
                  if (this.userType == "External User") {
                    if (workPercentage["updatedWorkPercentage"] != null) {
                      detail[dateDetail.day] = Math.round(workPercentage["updatedWorkPercentage"]);
                      if (Number(Math.round(workPercentage["updatedWorkPercentage"])) < 85) {
                        detail[dateDetail.class] = "lessWork";
                      }
                      else{
                        detail[dateDetail.class] = "";
                      }
                    }
                  }
                }
                else {
                  detail[dateDetail.class] = "inactive";
                }
              }
            }
          }
        );
      }
    }
  }

  getWorkDoneWithLineWeightage(zoneNo: any, date: any, lineWeightageList: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWorkDoneWithLineWeightage");
    let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
    let year = date.split('-')[0];
    let dbPathLineStatus = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + date + "/LineStatus";
    let lineStatusInstance = this.db.object(dbPathLineStatus).valueChanges().subscribe((lineStatusData) => {
      lineStatusInstance.unsubscribe();
      let percentage = 0;
      let skippedLines = 0;
      let skippedPercentage = 0;
      let totalLines = lineWeightageList[lineWeightageList.length - 1]["totalLines"];
      let detail = this.workDoneList.find(item => item.zoneNo == zoneNo);
      if (detail != undefined) {
        let dateDetail = this.workDateList.find(item => item.date == date);
        if (dateDetail != undefined) {
          if (lineStatusData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWorkDoneWithLineWeightage", lineStatusData);
            let keyArray = Object.keys(lineStatusData);
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineStatus = lineStatusData[lineNo]["Status"];
              if (lineStatus == "LineCompleted") {
                let lineWeight = 1;
                let lineWeightDetail = lineWeightageList.find(item => item.lineNo == lineNo);
                if (lineWeightDetail != undefined) {
                  lineWeight = Number(lineWeightDetail.weightage);
                  percentage += (100 / Number(totalLines)) * lineWeight;
                }
              }
              else {
                skippedLines++;
              }
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
            detail[dateDetail.day] = percentage.toFixed(0);
            if (Number(percentage) < 85) {
              detail[dateDetail.class] = "lessWork";
            }
          }
          else {
            detail[dateDetail.class] = "inactive";
          }
        }
      }
    });
  }

  getZones() {
    this.zoneList = [];
    this.commonService.getCityWiseWard().then((wardList: any) => {
      this.zoneList = JSON.parse(wardList);
      this.selectedCircle = 'Circle1';
      this.getWorkDoneDates();
    });
  }
}
