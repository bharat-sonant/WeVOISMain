import { createOfflineCompileUrlResolver, getUrlScheme } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-reach-cost',
  templateUrl: './ward-reach-cost.component.html',
  styleUrls: ['./ward-reach-cost.component.scss']
})
export class WardReachCostComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  selectedCircle: any;
  wardTimeList: any[] = [];
  wardList: any[] = [];
  zoneList: any[] = [];
  wardDataList: any[] = [];
  selectedWard: any;
  driveySalary: any;
  halperSalary: any;
  totalSalary: any;
  yearList: any[] = [];
  db:any;

  costData: costDatail =
    {
      totalCost: "0",
      day1: "0.00",
      day2: "0.00",
      day3: "0.00",
      day4: "0.00",
      day5: "0.00",
      day6: "0.00",
      day7: "0.00",
      day8: "0.00",
      day9: "0.00",
      day10: "0.00",
      day11: "0.00",
      day12: "0.00",
      day13: "0.00",
      day14: "0.00",
      day15: "0.00",
      day16: "0.00",
      day17: "0.00",
      day18: "0.00",
      day19: "0.00",
      day20: "0.00",
      day21: "0.00",
      day22: "0.00",
      day23: "0.00",
      day24: "0.00",
      day25: "0.00",
      day26: "0.00",
      day27: "0.00",
      day28: "0.00",
      day29: "0.00",
      day30: "0.00",
      day31: "0.00"
    };


  ngOnInit() {
    this.db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.getSalary();
    this.getWards();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getSalary() {
    let dbPath = "Settings/Salary";
    let salaryData = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        this.driveySalary = data["driver_salary_per_hour"];
        this.halperSalary = data["helper_salary_per_hour"];
        this.totalSalary = parseFloat(this.driveySalary) + parseFloat(this.halperSalary);
        salaryData.unsubscribe();
      });
  }

  getWards() {
    let dbPath = "Defaults/AllWard";
    let circleWiseWard = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        if (data != null) {
          var keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            let circleDataList = data[index];
            if (circleDataList.length > 0) {
              for (let j = 1; j < circleDataList.length; j++) {
                this.wardList.push({ circle: index, wardNo: circleDataList[j]["wardNo"], startDate: circleDataList[j]["startDate"], endDate: circleDataList[j]["endDate"], displayIndex: circleDataList[j]["displayIndex"] });
              }
            }
          }
        }
        this.selectedCircle = 'Circle1';
        circleWiseWard.unsubscribe();
        this.onSubmit();
      });
  }

  changeCircleSelection(filterVal: any) {
    this.selectedCircle = filterVal;
    this.onSubmit();
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.onSubmit();
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.onSubmit();
  }

  onSubmit() {
    this.clearAll();
    if (this.wardList.length > 0) {
      let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
      let rowTo = days;
      if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
        rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
      }
      let monthStartDate = new Date(this.selectedYear + "-" + this.selectedMonth + "-01");
      let monthendDate = new Date(this.selectedYear + "-" + this.selectedMonth + "-" + rowTo);
      for (let wardIndex = 0; wardIndex < this.wardList.length; wardIndex++) {
        if (this.wardList[wardIndex]["circle"] == this.selectedCircle) {
          let startDate = new Date(this.wardList[wardIndex]["startDate"]);
          let endDate: Date = null;
          if (this.wardList[wardIndex]["endDate"] != null) {
            endDate = new Date(this.wardList[wardIndex]["endDate"]);
          }
          if (startDate < monthendDate) {
            if (endDate == null) {
              this.zoneList.push({ wardNo: this.wardList[wardIndex]["wardNo"], startDate: this.wardList[wardIndex]["startDate"], endDate: endDate });
              this.wardDataList.push({ wardNo: this.wardList[wardIndex]["wardNo"], totalTime: '0.00', cost: 0, driver: "", totalMin: 0 })
            }
            else {
              if (endDate >= monthStartDate && startDate < monthendDate) {
                this.zoneList.push({ wardNo: this.wardList[wardIndex]["wardNo"], startDate: this.wardList[wardIndex]["startDate"], endDate: endDate });
                this.wardDataList.push({ wardNo: this.wardList[wardIndex]["wardNo"], totalTime: '0.00', cost: 0, driver: "", totalMin: 0 })
              }
            }
          }
        }
      }
      if (this.zoneList.length > 0) {
        for (let i = 0; i < this.zoneList.length; i++) {
          this.getData(this.zoneList[i]["wardNo"]);
        }
      }
    }
  }

  getWardReachTime(wardNo: any, monthName: any, monthDate: any) {
    let workDetailsPath = 'WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary';
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe(
      workData => {
        workDetails.unsubscribe();
        if (workData != null) {
          let zoneDetails = this.wardDataList.find(item => item.wardNo == wardNo);
          if (zoneDetails != undefined) {
            let d = "day" + parseFloat(monthDate.split("-")[2]);
            if (workData["wardReachingDuration"] != null) {
              let durationList = workData["wardReachingDuration"].toString().split(',');
              let reachCostList = workData["wardReachingCost"].toString().split(',');
              let duration = 0;  
              let cost = 0;
              for (let i = 0; i < durationList.length; i++) {
                duration = Number(duration) + Number(durationList[i].trim());
              }
              for (let i = 0; i < reachCostList.length; i++) {
                cost = Number(cost) + Number(reachCostList[i].trim());
              }
              zoneDetails[d] = duration + " min (₹ " + cost.toFixed(2) + ")";
              zoneDetails.totalMin = Number(zoneDetails.totalMin) + Number(duration);
              let totalTime = this.commonService.getHrsFull(zoneDetails.totalMin);
              zoneDetails.totalTime = totalTime;
              this.costData.totalCost = (Number(this.costData.totalCost) + Number(cost)).toFixed(2);
              zoneDetails.cost = (Number(cost) + Number(zoneDetails.cost)).toFixed(2);
              this.getSum(d, cost);
              let workerDetailsPath = 'WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/WorkerDetails/driverName';
              let workerDetails = this.db.object(workerDetailsPath).valueChanges().subscribe(
                workerData => {
                  workerDetails.unsubscribe();
                  if (workerData != null) {
                    let zoneDetails = this.wardDataList.find(item => item.wardNo == wardNo);
                    if (zoneDetails != undefined) {
                      let d = "day" + parseFloat(monthDate.split("-")[2]);
                      zoneDetails[d] = zoneDetails[d] + "<br/>" + workerData;
                    } 
                  }
                });
            }
          }
        }
      }
    );
  }

  getData(wardNo: any) {
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    let rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let j = 1; j <= rowTo; j++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
      let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
      this.getWardReachTime(wardNo, monthName, monthDate);
    }
    return;
  }

  clearAll() {
    this.zoneList = [];
    this.costData.totalCost = "0.00";
    this.wardDataList = [];
    this.costData.day1 = "0.00";
    this.costData.day2 = "0.00";
    this.costData.day3 = "0.00";
    this.costData.day4 = "0.00";
    this.costData.day5 = "0.00";
    this.costData.day6 = "0.00";
    this.costData.day7 = "0.00";
    this.costData.day8 = "0.00";
    this.costData.day9 = "0.00";
    this.costData.day10 = "0.00";
    this.costData.day11 = "0.00";
    this.costData.day12 = "0.00";
    this.costData.day13 = "0.00";
    this.costData.day14 = "0.00";
    this.costData.day15 = "0.00";
    this.costData.day16 = "0.00";
    this.costData.day17 = "0.00";
    this.costData.day18 = "0.00";
    this.costData.day19 = "0.00";
    this.costData.day20 = "0.00";
    this.costData.day21 = "0.00";
    this.costData.day22 = "0.00";
    this.costData.day23 = "0.00";
    this.costData.day24 = "0.00";
    this.costData.day25 = "0.00";
    this.costData.day26 = "0.00";
    this.costData.day27 = "0.00";
    this.costData.day28 = "0.00";
    this.costData.day29 = "0.00";
    this.costData.day30 = "0.00";
    this.costData.day31 = "0.00";
  }

  getSum(day: any, cost: any) {
    if (day == "day1") {
      this.costData.day1 = (parseFloat(this.costData.day1) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day2") {
      this.costData.day2 = (parseFloat(this.costData.day2) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day3") {
      this.costData.day3 = (parseFloat(this.costData.day3) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day4") {
      this.costData.day4 = (parseFloat(this.costData.day4) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day5") {
      this.costData.day5 = (parseFloat(this.costData.day5) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day6") {
      this.costData.day6 = (parseFloat(this.costData.day6) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day7") {
      this.costData.day7 = (parseFloat(this.costData.day7) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day8") {
      this.costData.day8 = (parseFloat(this.costData.day8) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day9") {
      this.costData.day9 = (parseFloat(this.costData.day9) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day10") {
      this.costData.day10 = (parseFloat(this.costData.day10) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day11") {
      this.costData.day11 = (parseFloat(this.costData.day11) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day12") {
      this.costData.day12 = (parseFloat(this.costData.day12) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day13") {
      this.costData.day13 = (parseFloat(this.costData.day13) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day14") {
      this.costData.day14 = (parseFloat(this.costData.day14) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day15") {
      this.costData.day15 = (parseFloat(this.costData.day15) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day16") {
      this.costData.day16 = (parseFloat(this.costData.day16) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day17") {
      this.costData.day17 = (parseFloat(this.costData.day17) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day18") {
      this.costData.day18 = (parseFloat(this.costData.day18) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day19") {
      this.costData.day19 = (parseFloat(this.costData.day19) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day20") {
      this.costData.day20 = (parseFloat(this.costData.day20) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day21") {
      this.costData.day21 = (parseFloat(this.costData.day21) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day22") {
      this.costData.day22 = (parseFloat(this.costData.day22) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day23") {
      this.costData.day23 = (parseFloat(this.costData.day23) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day24") {
      this.costData.day24 = (parseFloat(this.costData.day24) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day25") {
      this.costData.day25 = (parseFloat(this.costData.day25) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day26") {
      this.costData.day26 = (parseFloat(this.costData.day26) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day27") {
      this.costData.day27 = (parseFloat(this.costData.day27) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day28") {
      this.costData.day28 = (parseFloat(this.costData.day28) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day29") {
      this.costData.day29 = (parseFloat(this.costData.day29) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day30") {
      this.costData.day30 = (parseFloat(this.costData.day30) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day31") {
      this.costData.day31 = (parseFloat(this.costData.day31) + parseFloat(cost)).toFixed(2);
    }
  }
}

export class costDatail {
  totalCost: string;
  day1: string;
  day2: string;
  day3: string;
  day4: string;
  day5: string;
  day6: string;
  day7: string;
  day8: string;
  day9: string;
  day10: string;
  day11: string;
  day12: string;
  day13: string;
  day14: string;
  day15: string;
  day16: string;
  day17: string;
  day18: string;
  day19: string;
  day20: string;
  day21: string;
  day22: string;
  day23: string;
  day24: string;
  day25: string;
  day26: string;
  day27: string;
  day28: string;
  day29: string;
  day30: string;
  day31: string;
}

