import { Subscription } from "rxjs";
import { SkipLineComponent } from "./../reports/skip-line/skip-line.component";
import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import * as $ from "jquery";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FirebaseService } from "../firebase.service";

//services
import { CommonService } from "../services/common/common.service";
import * as CanvasJS from "../../assets/canvasjs.min";
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-salary-summary",
  templateUrl: "./salary-summary.component.html",
  styleUrls: ["./salary-summary.component.scss"],
})
export class SalarySummaryComponent implements OnInit {
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, private modalService: NgbModal) { }

  selectedDate: any;
  currentMonth: any;
  currentYear: any;
  currentDate: any;
  monthSalaryList: any[] = [];
  yearList: any;
  cityName: any;
  public selectedYear: any;
  db: any;
  serviceName = "salary-summary";
  monthSalaryListShow: any[] = [];
  salaryData: salaryDetail = {
    totalSalary: "0.00",
    lastUpdateTime: "",
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Finance-Reports","Salary-Summary-Report",localStorage.getItem("userID"));
    this.currentDate = this.commonService.setTodayDate();
    this.currentMonth = this.commonService.getCurrentMonthName(new Date(this.currentDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.getYear();
    this.getLastUpdate();
    this.getMonthSalary();
    setTimeout(() => {
      this.getMonthSalaryGraph();
      this.getTotalSalary();
    }, 3000);
  }

  getLastUpdate() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLastUpdate");
    let dbPath = "FinanceSummary/Salary/lastUpdateDate";
    let lastUpdateInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      lastUpdateInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLastUpdate", data);
        this.salaryData.lastUpdateTime = data.toString();
      }
    });
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.currentDate.split("-")[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = year;
  }

  getMonthSalary() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMonthSalary");
    this.salaryData.totalSalary = "0.00";
    let currentMonth = Number(this.currentDate.split("-")[1]);
    if (this.selectedYear != this.currentYear) {
      currentMonth = 12;
    }
    for (let i = 1; i <= currentMonth; i++) {
      let monthName = this.commonService.getCurrentMonthName(i - 1);
      let monthShortName = this.commonService.getCurrentMonthShortName(i);
      this.monthSalaryList.push({
        id: i,
        month: monthShortName,
        year: this.selectedYear,
        salary: "0.00",
      });

      let dbPath = "FinanceSummary/Salary/" + this.selectedYear + "/" + monthName + "/salary";
      let salaryInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
        salaryInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMonthSalary", data);
          let monthDetail = this.monthSalaryList.find((item) => item.id === i);
          if (monthDetail != undefined) {
            monthDetail.salary = Number(data).toFixed(2);
          }
        } else {
          // this.getCurrentMonthSalary(i, monthName);
        }
      });
    }
  }

  updateSalary() {
    let updateMonth = Number(this.salaryData.lastUpdateTime.split("-")[1]);
    let currentMonth = Number(this.currentDate.split("-")[1]);
    for (let i = updateMonth; i <= currentMonth; i++) {
      let monthName = this.commonService.getCurrentMonthName(i - 1);
      this.getCurrentMonthSalary(i, monthName);
    }
    let time = new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1];
    let updateTime = this.currentDate + " " + time;
    this.db.object("FinanceSummary/Salary/").update({ lastUpdateDate: updateTime });
    this.salaryData.lastUpdateTime = updateTime;
    setTimeout(() => {
      this.getMonthSalaryGraph();
      this.getTotalSalary();
    }, 3000);
  }

  getTotalSalary() {
    this.salaryData.totalSalary = "0.00";
    for (let i = 0; i < this.monthSalaryList.length; i++) {
      this.salaryData.totalSalary = (
        Number(this.salaryData.totalSalary) +
        Number(this.monthSalaryList[i]["salary"])
      ).toFixed(2);
    }
  }

  getCurrentMonthSalary(index: any, monthName: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getCurrentMonthSalary");
    let days = new Date(parseInt(this.selectedYear), parseInt(index), 0).getDate();
    let rowTo = days;
    if (index == Number(this.commonService.setTodayDate().split("-")[1])) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }

    let monthSalary = 0;
    for (let i = 1; i <= rowTo; i++) {
      let monthDate = this.selectedYear + "-" + (index < 10 ? "0" : "") + index + "-" + (i < 10 ? "0" : "") + i;
      let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + monthName + "/" + monthDate;
      let monthSalaryInfo = this.db.list(dbPath).valueChanges().subscribe((salaryData) => {
        if (salaryData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getCurrentMonthSalary", salaryData);
          for (let j = 0; j < salaryData.length; j++) {
            if (salaryData[j]["today-wages"] != null) {
              monthSalary += parseFloat(salaryData[j]["today-wages"]);
            }
          }
          if (i == rowTo) {
            let monthDetail = this.monthSalaryList.find((item) => item.id === index);
            if (monthDetail != undefined) {
              monthDetail.salary = monthSalary.toFixed(2);
            }
          }
          this.db.object("FinanceSummary/Salary/" + this.selectedYear + "/" + monthName + "").update({ salary: monthSalary, });
        }
        monthSalaryInfo.unsubscribe();
      });
    }
  }

  getMonthSalaryGraph() {
    if (this.monthSalaryList.length > 0) {
      let chartData = [];
      for (let index = 0; index < this.monthSalaryList.length; index++) {
        chartData.push({
          y: parseFloat(this.monthSalaryList[index]["salary"]),
          label: this.monthSalaryList[index]["month"] + " " + this.monthSalaryList[index]["year"],
        });
      }
      this.drawChartCurrentDay(chartData);
    }
  }

  drawChartCurrentDay(chartData: any) {
    let chart = new CanvasJS.Chart("chartContainer", {
      animationEnabled: true,
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      axisY: {
        // title: "Salary (in month)",
        titleFontSize: 20,
        labelFontSize: 12,
      },
      axisX: {
        labelFontSize: 12,
      },
      legend: {
        fontSize: 20,
      },
      dataPointWidth: 30,
      data: [
        {
          type: "column",
          showInLegend: false,
          legendMarkerColor: "grey",
          legendText: "Month",
          dataPoints: chartData,
          fontSize: 12,
        },
      ],
    });
    chart.render();
  }

  changeYearSelection(filterVal: any) {
    this.salaryData.totalSalary = "0.00";
    let chartData = [];
    this.drawChartCurrentDay(chartData);
    this.monthSalaryList = [];
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
    }
    this.selectedYear = filterVal;
    this.getMonthSalary();
    setTimeout(() => {
      this.getMonthSalaryGraph();
      this.getTotalSalary();
    }, 2000);
  }
}

export class salaryDetail {
  totalSalary: string;
  lastUpdateTime: string;
}
