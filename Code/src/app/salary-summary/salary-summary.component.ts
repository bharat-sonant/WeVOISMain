import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import * as $ from 'jquery';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


//services
import { CommonService } from '../services/common/common.service';
import * as CanvasJS from '../../assets/canvasjs.min';

@Component({
  selector: 'app-salary-summary',
  templateUrl: './salary-summary.component.html',
  styleUrls: ['./salary-summary.component.scss']
})
export class SalarySummaryComponent implements OnInit {

  constructor(public db: AngularFireDatabase, private commonService: CommonService, private modalService: NgbModal) { }

  selectedDate: any;
  currentMonth: any;
  currentYear: any;
  currentDate: any;
  monthSalaryList: any[] = [];

  monthSalaryListShow: any[] = [];
  salaryData: salaryDetail =
    {
      monthSalary: "0",
      lastMonthSalary: "0",
      monthProfitLose: "0",
      monthPercent: "0",

      month1: "",
      month2: "",
      month3: "",
      month4: "",
      month5: "",

    };

  salaryDataShow: salaryDetailShow =
    {
      monthSalary: "0",
      lastMonthSalary: "0",
      monthProfitLose: "0",
      monthPercent: "0",

      month1: "",
      month2: "",
      month3: "",
      month4: "",
      month5: "",

    };
  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.currentDate = this.commonService.setTodayDate();
    this.selectedDate = this.commonService.setTodayDate();
    this.currentMonth = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();


    this.getCurrentMonthSalary();
    setTimeout(() => {
      this.getMonthSalaryGraph();
    }, 6000);

  }

  getMonthSalaryGraph() {
    if (this.monthSalaryList.length > 0) {
      let chartData = [];
      for (let index = 0; index < this.monthSalaryList.length; index++) {
        chartData.push({ y: parseFloat(this.monthSalaryList[index]["salary"]), label: this.monthSalaryList[index]["month"]+' '+this.monthSalaryList[index]["year"] });
      }
      this.drawChartCurrentDay(chartData);
    }


  }

  drawChartCurrentDay(chartData: any) {


    let chart = new CanvasJS.Chart("chartContainer", {

      animationEnabled: true,
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      axisY: {
        title: "Salary (in hour)"
      },
      dataPointWidth: 60,
      data: [{
        type: "column",

        showInLegend: true,
        legendMarkerColor: "grey",
        legendText: "Ward No.",
        dataPoints:
          chartData

      }]

    });
    chart.render();
  }

  getCurrentMonthSalary() {
    for (let index = 1; index <= 5; index++) {
      let monthSalary = 0;
      let lastMonthDate = this.commonService.getPreviousMonth(this.currentDate, index - 1);
      let monthName = this.commonService.getCurrentMonthName(parseInt(lastMonthDate.split('-')[1]) - 1);
      let monthShortName = this.commonService.getCurrentMonthShortName(parseInt(lastMonthDate.split('-')[1]) - 1)
      let year = lastMonthDate.split('-')[0];
      let month = lastMonthDate.split('-')[1];
      
    let days = new Date(parseInt(year), parseInt(month), 0).getDate();
    
      for (let i = 1; i <= days; i++) {
        let monthDate = year + '-'  + month + '-' + (i < 10 ? '0' : '') + i;
        let dbPath = 'DailyWorkDetail/' + year + '/' + monthName + '/' + monthDate;
        let monthSalaryInfo = this.db.list(dbPath).valueChanges().subscribe(
          salaryData => {
            if (salaryData != null) {
              for (let j = 0; j < salaryData.length; j++) {
                if (salaryData[j]["today-wages"] != null) {
                  monthSalary += parseFloat(salaryData[j]["today-wages"]);
                }
              }
              if (i == days) {
                this.monthSalaryList.push({ month: monthShortName, year: year, salary: monthSalary });
              }
            }
            monthSalaryInfo.unsubscribe();
          });
      }

    }
  }

}

export class salaryDetail {

  monthSalary: string;
  lastMonthSalary: string;
  monthProfitLose: string;
  monthPercent: string;

  month1: string;
  month2: string;
  month3: string;
  month4: string;
  month5: string;
}


export class salaryDetailShow {

  monthSalary: string;
  lastMonthSalary: string;
  monthProfitLose: string;
  monthPercent: string;

  month1: string;
  month2: string;
  month3: string;
  month4: string;
  month5: string;
}

