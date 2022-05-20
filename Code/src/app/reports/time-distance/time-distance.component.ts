import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';
import { HttpClient } from '@angular/common/http';
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";


@Component({
  selector: 'app-time-distance',
  templateUrl: './time-distance.component.html',
  styleUrls: ['./time-distance.component.scss']
})
export class TimeDistanceComponent implements OnInit {

  zoneList: any[];
  distance: any[];
  time: any[];
  distance1: any[];
  time1: any[];
  distance2: any[];
  time2: any[];
  distance3: any[];
  time3: any[];
  distance4: any[];
  time4: any[];

  tempdistance: any[];
  temptime: any[];
  tempdistance1: any[];
  temptime1: any[];
  tempdistance2: any[];
  temptime2: any[];
  tempdistance3: any[];
  temptime3: any[];
  tempdistance4: any[];
  temptime4: any[];

  graphData: any[];
  todayDate: any;
  activeZone: any;
  maxDistance: any[];
  days: number;


  graphHeaderData: graphHeaders =
    {
      date: '',
      date1: '',
      date2: '',
      date3: '',
      date4: '',
      workprogress: '0',
      workprogress1: '0',
      workprogress2: '0',
      workprogress3: '0',
      workprogress4: '0',
    };

  public lineBigDashboardChartType: any;
  public gradientStroke: any;
  public chartColor: any;
  public canvas: any;
  public ctx: any;
  public gradientFill: any;
  public lineBigDashboardChartData: Array<any>;
  public lineBigDashboardChartOptions: any;
  public lineBigDashboardChartLabels: any;
  public lineBigDashboardChartColors: Array<any>

  public lineBigDashboardChartData1: Array<any>;
  public lineBigDashboardChartLabels1: any;
  public lineBigDashboardChartOptions1: any;

  public lineBigDashboardChartData2: Array<any>;
  public lineBigDashboardChartLabels2: any;
  public lineBigDashboardChartOptions2: any;

  public lineBigDashboardChartData3: Array<any>;
  public lineBigDashboardChartLabels3: any;
  public lineBigDashboardChartOptions3: any;

  public lineBigDashboardChartData4: Array<any>;
  public lineBigDashboardChartLabels4: any;
  public lineBigDashboardChartOptions4: any;
  public graphMaxValue: number;
  public stepSize: number;

  endInterval: any;
  db: any;
  cityName: any;
  constructor(public fs: FirebaseService, private mapService: MapService, public httpService: HttpClient, private commonService: CommonService) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.zoneList = this.mapService.getZones(this.todayDate);
    this.zoneList.splice(0, 1);
    this.activeZone = 25;
    this.checkTodayWorkStatus();
  }

  changeZoneSelection(filterVal: any) {
    this.activeZone = filterVal;
    this.checkTodayWorkStatus();
  }

  checkTodayWorkStatus() {
    let dbPath = 'WasteCollectionInfo/' + this.activeZone + '/' + this.todayDate + '/LineStatus';
    let wardLineData = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        this.graphHeaderData.date = this.getDate(0);
        this.graphHeaderData.workprogress = "0";

        if (data.length > 0) {
          $("#divNoRecord").hide();

          this.getGrpahDataTodayAndLastFiveDays(15);
        } else {
          $("#divNoRecord").show();
        }

        wardLineData.unsubscribe();
      });
  }

  getGrpahDataTodayAndLastFiveDays(interval: any) {

    this.days = 1;
    this.endInterval = 0;
    this.maxDistance = [];
    this.initGrpahProperties();
    this.initTimeDistance();
    this.drawWorkProgress();
    this.drawWorkProgress1();
    this.drawWorkProgress2();
    this.drawWorkProgress3();
    this.drawWorkProgress4();

    this.getData(interval, this.time, this.distance, this.todayDate);
    this.graphHeaderData.date1 = this.getDate(1);
    this.graphHeaderData.date2 = this.getDate(2);
    this.graphHeaderData.date3 = this.getDate(3);
    this.graphHeaderData.date4 = this.getDate(4);
  }

  initTimeDistance() {
    this.temptime = [];
    this.tempdistance = [];
    this.temptime1 = [];
    this.tempdistance1 = [];
    this.temptime2 = [];
    this.tempdistance2 = [];
    this.temptime3 = [];
    this.tempdistance3 = [];
    this.temptime4 = [];
    this.tempdistance4 = [];

    this.time = [];
    this.distance = [];
    this.time1 = [];
    this.distance1 = [];
    this.time2 = [];
    this.distance2 = [];
    this.time3 = [];
    this.distance3 = [];
    this.time4 = [];
    this.distance4 = [];
  }

  getData(interval: any, timeCollection: any[], distanceCollection: any[], date: any) {

    let dbPath = 'WasteCollectionInfo/' + this.activeZone + '/' + date + '/LineStatus';

    let wardLineData = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        let lineCompleted = 0;
        if (data.length > 0) {
          let intervalInMinutes = interval;
          let timePeriod = (100 / (60 / intervalInMinutes)) / 100;

          let distanceCovered = 0;
          let timeInterval = 0;

          timeCollection.push(timeInterval + " ~0");
          distanceCollection.push(distanceCovered);

          let intervalStart = data[0]["start-time"];
          let endTime = data[0]["end-time"];

          // This is just a patch due to bad data
          if (intervalStart > endTime) {
            intervalStart = endTime;
          }

          let intervalEnd = new Date(new Date(this.getFormattedDate(0) + " " + intervalStart).getTime() + intervalInMinutes * 60000);

          for (let index = 0; index < data.length; index++) {

            let lineDistance = data[index]["line-distance"];
            let lineStartTime = data[index]["start-time"];

            let lineEndTime = new Date(this.getFormattedDate(0) + " " + data[index]["end-time"]);

            if (data[index]["end-time"] == undefined) {
              break;
            }

            if (timeInterval > this.endInterval) {
              break;
            }

            if (lineDistance == undefined) {
              lineDistance = 0;
            }

            if (lineEndTime < intervalEnd) {
              distanceCovered += Number(lineDistance);
            } else {
              timeInterval = timeInterval + timePeriod;

              timeCollection.push(timeInterval + " ~ " + index);
              distanceCollection.push(distanceCovered);

              if (index > 1) {
                index--;
                let previousLineEndTime = new Date(this.getFormattedDate(0) + " " + data[index]["end-time"]);
                if (distanceCovered == 0) {
                  intervalEnd = new Date((intervalEnd).getTime() + intervalInMinutes * 60000);
                } else {
                  intervalEnd = new Date((previousLineEndTime).getTime() + intervalInMinutes * 60000);
                }
              }

              distanceCovered = 0;
            }

            lineCompleted = index;

            if (this.days == 1) {
              this.endInterval = timeInterval;
            }

          }

          if (distanceCovered > 0) {
            timeCollection.push(timeInterval + timePeriod + " ~ " + lineCompleted);
            distanceCollection.push(distanceCovered);
          }

          this.maxDistance.push(Math.max.apply(null, distanceCollection));

          let wardLines = this.db.object('WardLines/' + this.activeZone).valueChanges().subscribe(
            lines => {
              if (this.days == 2) {
                this.graphHeaderData.workprogress = ((Number(lineCompleted) / Number(lines)) * 100).toFixed(2).toString();
              }
              if (this.days == 3) {
                this.graphHeaderData.workprogress1 = ((Number(lineCompleted) / Number(lines)) * 100).toFixed(2).toString();
              }
              if (this.days == 4) {
                this.graphHeaderData.workprogress2 = ((Number(lineCompleted) / Number(lines)) * 100).toFixed(2).toString();
              }
              if (this.days == 5) {
                this.graphHeaderData.workprogress3 = ((Number(lineCompleted) / Number(lines)) * 100).toFixed(2).toString();
              }
              if (this.days == 6) {
                this.graphHeaderData.workprogress4 = ((Number(lineCompleted) / Number(lines)) * 100).toFixed(2).toString();
              }

              wardLines.unsubscribe();
            });

        }

        this.days = Number(this.days) + 1;
        if (this.days < 6) {

          if (this.days == 2) {
            this.getData(interval, this.time1, this.distance1, this.getFormattedDate(Number(this.days) - 1));
          }
          if (this.days == 3) {
            this.getData(interval, this.time2, this.distance2, this.getFormattedDate(Number(this.days) - 1));
          }
          if (this.days == 4) {
            this.getData(interval, this.time3, this.distance3, this.getFormattedDate(Number(this.days) - 1));
          }
          if (this.days == 5) {
            this.getData(interval, this.time4, this.distance4, this.getFormattedDate(Number(this.days) - 1));
          }

        } else {
          this.setStepSizeandMaxValue(Math.max.apply(null, this.maxDistance));
          this.graphOptions();
        }
        wardLineData.unsubscribe();
      });
  }

  setStepSizeandMaxValue(value: any) {

    this.stepSize = Math.ceil((Number(value) / 5) / 100) * 100;
    this.graphMaxValue = Number(this.stepSize) * 5;

  }

  graphOptions() {


    this.lineBigDashboardChartOptions = {

      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 0,
          bottom: 20
        }
      },
      maintainAspectRatio: false,
      tooltips: {
        backgroundColor: '#fff',
        titleFontColor: '#333',
        bodyFontColor: '#666',
        bodySpacing: 4,
        xPadding: 12,
        mode: "nearest",
        intersect: 0,
        position: "nearest",
        title: "wow",
        callbacks: {
          label: function (tooltipItem, data) {
            return + Number(tooltipItem.yLabel) + " meter covered" + " & Line Completed :" + data.labels[tooltipItem.index].split("~")[1];;
          }
        }
      },
      legend: {
        position: "bottom",
        fillStyle: "#FFF",
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            fontColor: "rgba(255,255,255,0.4)",
            fontStyle: "bold",
            beginAtZero: true,
            maxTicksLimit: 50,
            padding: 10,
            stepSize: this.stepSize,
            max: this.graphMaxValue
          },
          gridLines: {
            drawTicks: true,
            drawBorder: false,
            display: true,
            color: "rgba(255,255,255,0.1)",
            zeroLineColor: "transparent"
          }
        }],
        xAxes: [{
          gridLines: {
            zeroLineColor: "transparent",
            display: false
          },
          ticks: {
            padding: 10,
            fontColor: "rgba(255,255,255,0.4)",
            fontStyle: "bold",
            callback: function (value) {
              return value.toString().split("~")[0];
            }
          },

        }]
      }
    };
  }

  initGrpahProperties() {

    this.chartColor = "#FFFFFF";
    this.lineBigDashboardChartType = 'line';
    this.canvas = document.getElementById("bigDashboardChart");
    this.ctx = this.canvas.getContext("2d");
    this.gradientStroke = this.ctx.createLinearGradient(500, 0, 100, 0);
    this.gradientStroke.addColorStop(0, '#80b6f4');
    this.gradientStroke.addColorStop(1, this.chartColor);
    this.gradientFill = this.ctx.createLinearGradient(0, 200, 0, 50);
    this.gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    this.gradientFill.addColorStop(1, "rgba(255, 255, 255, 0.24)");
    this.lineBigDashboardChartColors = [
      {
        backgroundColor: this.gradientFill,
        borderColor: this.chartColor,
        pointBorderColor: this.chartColor,
        pointBackgroundColor: "#2c2c2c",
        pointHoverBackgroundColor: "#2c2c2c",
        pointHoverBorderColor: this.chartColor,
      }
    ];

  }

  drawWorkProgress() {

    this.lineBigDashboardChartData = [
      {
        //pointBorderWidth: 1,
        //pointHoverRadius: 7,
        //pointHoverBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        borderWidth: 1,
        data: this.distance
      }
    ];

    this.lineBigDashboardChartLabels = this.time;
  }

  drawWorkProgress1() {

    this.lineBigDashboardChartData1 = [
      {
        pointRadius: 5,
        fill: true,
        borderWidth: 1,
        data: this.distance1
      }
    ];

    this.lineBigDashboardChartLabels1 = this.time1;

  }

  drawWorkProgress2() {

    this.lineBigDashboardChartData2 = [
      {
        pointRadius: 5,
        fill: true,
        borderWidth: 1,
        data: this.distance2
      }
    ];

    this.lineBigDashboardChartLabels2 = this.time2;

  }

  drawWorkProgress3() {

    this.lineBigDashboardChartData3 = [
      {
        pointRadius: 5,
        fill: true,
        borderWidth: 1,
        data: this.distance3
      }
    ];

    this.lineBigDashboardChartLabels3 = this.time3;

  }

  drawWorkProgress4() {

    this.lineBigDashboardChartData4 = [
      {
        pointRadius: 5,
        fill: true,
        borderWidth: 1,
        data: this.distance4
      }
    ];

    this.lineBigDashboardChartLabels4 = this.time4;

  }

  getDate(days: any) {
    let displayDate = new Date(new Date(this.todayDate).getTime() - (Number(days) * 1000 * 60 * 60 * 24)).toDateString().slice(4, 20);
    let month = displayDate.split(" ")[0];
    let day = displayDate.split(" ")[1];
    let year = displayDate.split(" ")[2];
    return day + ", " + month + " " + year;
  }

  getFormattedDate(days: any) {
    let date = new Date(new Date(this.todayDate).getTime() - (Number(days) * 1000 * 60 * 60 * 24));
    let day = new Date(date).getDate().toString();
    let month = (new Date(date).getMonth() + 1).toString();

    let year = new Date(date).getFullYear().toString();
    if (day.length == 1) { day = "0" + day; }
    if (month.length == 1) { month = "0" + month; }
    return year + "-" + month + "-" + day;
  }

}


export class graphHeaders {
  date: string;
  date1: string;
  date2: string;
  date3: string;
  date4: string;
  workprogress: string;
  workprogress1: string;
  workprogress2: string;
  workprogress3: string;
  workprogress4: string;
}