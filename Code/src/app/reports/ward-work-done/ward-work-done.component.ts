import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-work-done',
  templateUrl: './ward-work-done.component.html',
  styleUrls: ['./ward-work-done.component.scss']
})
export class WardWorkDoneComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  cityName: any;
  db: any;
  toDayDate: any;
  selectedCircle: any;
  zoneList: any[] = [];
  workDateList: any[] = [];
  workDoneList: any[] = [];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getZones();
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
      this.getWorkDone(list[i]["wardNo"]);
    }
  }

  getWorkDone(zoneNo: any) {
    if (this.workDateList.length > 0) {
      for (let i = 0; i < this.workDateList.length; i++) {
        let date = this.workDateList[i]["date"];
        let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
        let year = date.split('-')[0];
        let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + date + "/Summary/workPercentage";
        let workPercentageInstance = this.db.object(dbPath).valueChanges().subscribe(
          workPercentage => {
            workPercentageInstance.unsubscribe();
            let detail = this.workDoneList.find(item => item.zoneNo == zoneNo);
            if (detail != undefined) {
              let dateDetail = this.workDateList.find(item => item.date == date);
              if (dateDetail != undefined) {
                if (workPercentage != null) {
                  detail[dateDetail.day] = workPercentage;
                  if (Number(workPercentage) < 85) {
                    detail[dateDetail.class] = "lessWork";
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

  getZones() {
    this.zoneList = [];
    this.commonService.getCityWiseWard().then((wardList: any) => {
      this.zoneList = JSON.parse(wardList);
      this.selectedCircle = 'Circle1';
      this.getWorkDoneDates();
    });
  }
}
