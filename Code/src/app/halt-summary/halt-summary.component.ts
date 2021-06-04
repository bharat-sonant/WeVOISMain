/// <reference types="@types/googlemaps" />

import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import * as $ from 'jquery';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


//services
import { CommonService } from '../services/common/common.service';
import { MapService } from '../services/map/map.service';

import * as CanvasJS from '../../assets/canvasjs.min';
import * as html2canvas from "html2canvas";
import { componentNeedsResolution } from '@angular/core/src/metadata/resource_loading';
import { parse } from 'querystring';

@Component({
  selector: 'app-halt-summary',
  templateUrl: './halt-summary.component.html',
  styleUrls: ['./halt-summary.component.scss']
})
export class HaltSummaryComponent implements OnInit {
  constructor(public db: AngularFireDatabase, private mapService: MapService, private commonService: CommonService, private modalService: NgbModal) { }
  zoneList: any[];
  selectedDate: any;
  currentMonth: any;
  currentYear: any;
  currentDate: any;
  haltList: any[] = [];
  weekHaltList: any[] = [];
  dateList: any[];
  minHalt: number;
  dailyPerformerList: any[] = [];
  dailyPerformer: any[] = [];
  weekPerformerList: any[] = [];
  weekPerformer: any[] = [];
  monthPerformerList: any[] = [];
  monthPerformer: any[] = [];
  todayHaltList: any[] = [];
  zoneHaltList: any[] = [];
  allMarkers: any[] = [];
  todaySaleryPre: number = 0;
  driveySalary: any;
  halperSalary: any;
  totalSalary: any;

  public map: google.maps.Map;
  marker = new google.maps.Marker();
  public bounds: any;



  haltData: haltDetail =
    {
      todayHalt: "0",
      todayHaltUnApproved: "0",
      todayHaltApproved: "0",
      todaySalary: "0",
      lastDayHalt: "0",
      lastDaySalery: "0",
      todayProfitLose: "0",
      todayPercent: "0",

      weekHalt: "0",
      weekHaltUnApproved: "0",
      weekHaltApproved: "0",
      weekSalary: "0",
      lastWeekHalt: "0",
      lastWeekSalary: "0",
      weekProfitLose: "0",
      weekPercent: "0",

      monthHalt: "0",
      monthHaltUnApproved: "0",
      monthHaltApproved: "0",
      monthSalary: "0",
      lastMonthHalt: "0",
      lastMonthSalary: "0",
      monthProfitLose: "0",
      monthPercent: "0",

      date1: "",
      date2: "",
      date3: "",
      date4: "",
      date5: "",
      date6: "",
      date7: "",
      date8: ""

    };

  haltDataShow: haltDetailShow =
    {
      todayHalt: "0",
      todayHaltUnApproved: "0",
      todayHaltApproved: "0",
      todaySalary: "0",
      lastDayHalt: "0",
      lastDaySalery: "0",
      todayProfitLose: "0",
      todayPercent: "0",

      weekHalt: "0",
      weekHaltUnApproved: "0",
      weekHaltApproved: "0",
      weekSalary: "0",
      lastWeekHalt: "0",
      lastWeekSalary: "0",
      weekProfitLose: "0",
      weekPercent: "0",

      monthHalt: "0",
      monthHaltUnApproved: "0",
      monthHaltApproved: "0",
      monthSalary: "0",
      lastMonthHalt: "0",
      lastMonthSalary: "0",
      monthProfitLose: "0",
      monthPercent: "0",

      date1: "",
      date2: "",
      date3: "",
      date4: "",
      date5: "",
      date6: "",
      date7: "",
      date8: ""

    };

  ngOnInit() {
    $('#divG').hide();
    $('#divTbl').show();
    $('#spGraph').show();
    $('#spTable').hide();
    //this.commonService.chkUserPermission("halt-summary");
    this.currentDate = this.commonService.setTodayDate();
    this.selectedDate = this.commonService.setTodayDate();
    this.currentMonth = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.minHalt = 0;
    this.getSalary();
    this.getZoneList();
    this.getHaltDataToday();
    this.getHaltDataMonth();
    this.getHaltDataWeek();
    this.getHaltDataLastWeek();
    this.getHaltDataLastMonth();
    //this.getDriverData();
    setTimeout(() => {
      this.setSummary();
      this.getHaltDataRealTime();
    }, 6000);

    setInterval(() => {
      this.setProfitLose();
    }, 6000);
  }

  getSalary() {
    let dbPath = "Settings/Salary";
    let salaryData = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        this.driveySalary = data["driver_salary_per_hour"];
        this.halperSalary = data["helper_salary_per_hour"];
        this.totalSalary = parseFloat(this.driveySalary) + parseFloat(this.halperSalary);
      })
  }

  setSummary() {
    this.haltDataShow.todayHalt = this.haltData.todayHalt;
    this.haltDataShow.todayHaltApproved = this.haltData.todayHaltApproved;
    this.haltDataShow.todayHaltUnApproved = this.haltData.todayHaltUnApproved;
    this.haltDataShow.todayPercent = this.haltData.todayPercent;
    this.haltDataShow.todayProfitLose = this.haltData.todayProfitLose;
    this.haltDataShow.todaySalary = this.haltData.todaySalary;
    this.haltDataShow.weekHalt = this.haltData.weekHalt;
    this.haltDataShow.weekHaltApproved = this.haltData.weekHaltApproved;
    this.haltDataShow.weekHaltUnApproved = this.haltData.weekHaltUnApproved;
    this.haltDataShow.weekPercent = this.haltData.weekPercent;
    this.haltDataShow.weekProfitLose = this.haltData.weekProfitLose;
    this.haltDataShow.weekSalary = this.haltData.weekSalary;
    this.haltDataShow.lastDayHalt = this.haltData.lastDayHalt;
    this.haltDataShow.lastDaySalery = this.haltData.lastDaySalery;
    this.haltDataShow.lastMonthHalt = this.haltData.lastMonthHalt;
    this.haltDataShow.lastMonthSalary = this.haltData.lastMonthSalary;
    this.haltDataShow.lastWeekHalt = this.haltData.lastWeekHalt;
    this.haltDataShow.lastWeekSalary = this.haltData.lastWeekSalary;
    this.haltDataShow.monthHalt = this.haltData.monthHalt;
    this.haltDataShow.monthHaltApproved = this.haltData.monthHaltApproved;
    this.haltDataShow.monthHaltUnApproved = this.haltData.monthHaltUnApproved;
    this.haltDataShow.monthPercent = this.haltData.monthPercent;
    this.haltDataShow.monthProfitLose = this.haltData.monthProfitLose;
    this.haltDataShow.monthSalary = this.haltData.monthSalary;

    this.setProfitLose();

  }


  getHaltDataRealTime() {

    let toDayHaltInfoPath = 'HaltInfo';

    let haltInfoData = this.db.object(toDayHaltInfoPath).valueChanges().subscribe(
      haltData => {
        this.getHaltDataToday();
      });

  }



  getHaltDataToday() {
    let halt = 0;
    let haltApproved = 0;
    for (let index = 1; index < this.zoneList.length; index++) {
      let ward = this.zoneList[index]["zoneNo"];
      let d = new Date();
      let today = d.getDate();
      let month = d.getMonth() + 1;
      let year = d.getFullYear();

      let haltDate = "";
      haltDate = d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (today < 10 ? '0' : '') + today;
      let monthName = this.commonService.getCurrentMonthName(new Date(haltDate).getMonth());

      let toDayHaltInfoPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + monthName + '/' + haltDate;

      let haltInfoData = this.db.list(toDayHaltInfoPath).valueChanges().subscribe(
        haltData => {


          if (haltData.length > 0) {
            for (let index = 0; index < haltData.length; index++) {
              if (haltData[index]["haltType"] != "network-off") {
                let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                if (duration > this.minHalt) {
                  halt += duration;
                  if (haltData[index]["canRemove"] != null) {
                    if (haltData[index]["canRemove"] == "yes") {
                      haltApproved += duration;
                    }
                  }
                  else {
                    haltApproved += duration;
                  }
                }
              }
            }
          }
          this.haltData.todaySalary = ((haltApproved) / 60 * parseFloat(this.totalSalary)).toFixed(2);
          this.haltData.todayHalt = this.commonService.getHrs(halt);
          this.haltData.todayHaltApproved = this.commonService.getHrs(haltApproved);

          if (this.weekHaltList.length > 0) {
            let unApproved = halt - haltApproved;
            this.weekHaltList[0]["halt"] = this.commonService.getHrs(halt);
            this.weekHaltList[0]["unApproved"] = this.commonService.getHrs(unApproved);
            this.weekHaltList[0]["approved"] = this.commonService.getHrs(haltApproved);
            this.weekHaltList[0]["salary"] = this.haltData.todaySalary;
            this.haltData.weekSalary = (parseFloat(this.haltData.weekSalary) - this.todaySaleryPre + ((haltApproved) / 60 * parseFloat(this.totalSalary))).toFixed(2);
            this.haltData.monthSalary = (parseFloat(this.haltData.monthSalary) - this.todaySaleryPre + ((haltApproved) / 60 * parseFloat(this.totalSalary))).toFixed(2);
            this.todaySaleryPre = parseFloat(this.haltData.todaySalary);
            this.setSummary();
          }
          haltInfoData.unsubscribe();
        });
    }

  }


  getHaltDataMonth() {
    let monthHalt = 0;
    let monthHaltApproved = 0;

    for (let index = 1; index < this.zoneList.length; index++) {
      let ward = this.zoneList[index]["zoneNo"];
      let d = new Date();
      let today = d.getDate();
      let month = d.getMonth() + 1;
      let year = d.getFullYear();
      let haltDate = "";
      for (let i = 1; i <= today; i++) {
        haltDate = d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (i < 10 ? '0' : '') + i;
        let monthName = this.commonService.getCurrentMonthName(new Date(haltDate).getMonth());
        let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + monthName + '/' + haltDate;
        let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
          haltMonthData => {

            if (haltMonthData.length > 0) {
              for (let index = 0; index < haltMonthData.length; index++) {
                if (haltMonthData[index]["haltType"] != "network-off") {
                  let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                  if (duration > this.minHalt) {
                    monthHalt += duration;
                    if (haltMonthData[index]["canRemove"] != null) {
                      if (haltMonthData[index]["canRemove"] == "yes") {
                        monthHaltApproved += duration;
                      }
                    }
                    else {
                      monthHaltApproved += duration;
                    }
                  }
                }
              }
            }
            this.haltData.monthSalary = ((monthHaltApproved) / 60 * parseFloat(this.totalSalary)).toFixed(2);
            this.haltData.monthHalt = this.commonService.getHrs(monthHalt);
            this.haltData.monthHaltApproved = this.commonService.getHrs(monthHaltApproved);
            haltInfoMonthData.unsubscribe();
          });
      }

    }



  }

  getHaltDataWeek() {
    let halt = 0;
    let haltApproved = 0;
    for (let i = 0; i <= 7; i++) {
      let haltDat = this.commonService.getPreviousDate(this.currentDate, i);
      let dayList = "day" + (i + 1);
      let wDate = haltDat.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDat).getMonth());
      this.weekHaltList.push({ wDate: wDate, day: dayList, halt: "0", haltMin: 0, unApproved: "0", unApprovedMin: 0, approved: "0", approvedMin: 0, salary: "0", percent: "0", class: "fas fa-long-arrow-alt-down", percentUnApproved: "0", classUnApproved: "fas fa-long-arrow-alt-down", percentApproved: "0", classApproved: "fas fa-long-arrow-alt-down", percentSalary: "0", classSalary: "fas fa-long-arrow-alt-down" });
    }


    for (let i = 1; i <= 8; i++) {

      let lastDayHalt = 0;
      for (let index = 0; index < this.zoneList.length; index++) {
        let haltDate = this.commonService.getPreviousDate(this.currentDate, (i - 1));
        if (i == 1)
          this.haltDataShow.date1 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());
        if (i == 2)
          this.haltDataShow.date2 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());
        if (i == 3)
          this.haltDataShow.date3 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());
        if (i == 4)
          this.haltDataShow.date4 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());
        if (i == 5)
          this.haltDataShow.date5 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());
        if (i == 6)
          this.haltDataShow.date6 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());
        if (i == 7)
          this.haltDataShow.date7 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());
        if (i == 8)
          this.haltDataShow.date7 = haltDate.toString().split('-')[2] + " " + this.commonService.getCurrentMonthShortName(new Date(haltDate).getMonth());

        let monthName = this.commonService.getCurrentMonthName(new Date(haltDate).getMonth());
        let year = haltDate.split("-")[0];

        let haltInfoPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + monthName + '/' + haltDate;
        let haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe(
          haltData => {
            if (haltData.length > 0) {
              let totalBreak = 0;
              let totalHalt = 0;
              let haltApproved1 = 0;
              let haltUnApproved = 0;
              for (let index = 0; index < haltData.length; index++) {

                if (haltData[index]["haltType"] != "network-off") {
                  let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                  if (duration > this.minHalt) {
                    halt += duration;
                    totalHalt += duration;
                    if (haltData[index]["canRemove"] != null) {
                      if (haltData[index]["canRemove"] == "yes") {
                        haltApproved += duration;
                        totalBreak += duration;
                        lastDayHalt += duration;
                      }
                    }
                    else {
                      haltApproved += duration;
                      totalBreak += duration;
                      lastDayHalt += duration;
                    }
                    haltApproved1 = totalBreak;
                    haltUnApproved = totalHalt - haltApproved1;
                  }
                }

              }
              for (let j = 0; j < this.weekHaltList.length; j++) {
                let dayf = "day" + i;
                if (this.weekHaltList[j]["day"] == dayf) {
                  this.weekHaltList[j]["haltMin"] = parseInt(this.weekHaltList[j]["haltMin"]) + totalHalt;
                  this.weekHaltList[j]["halt"] = (this.commonService.getHrs(parseInt(this.weekHaltList[j]["haltMin"])));

                  this.weekHaltList[j]["approvedMin"] = parseInt(this.weekHaltList[j]["approvedMin"]) + haltApproved1;
                  this.weekHaltList[j]["approved"] = (this.commonService.getHrs(parseInt(this.weekHaltList[j]["approvedMin"])));

                  this.weekHaltList[j]["unApprovedMin"] = parseInt(this.weekHaltList[j]["unApprovedMin"]) + haltUnApproved;
                  this.weekHaltList[j]["unApproved"] = (this.commonService.getHrs(parseInt(this.weekHaltList[j]["unApprovedMin"])));
                  this.weekHaltList[j]["salary"] = ((parseInt(this.weekHaltList[j]["approvedMin"]) / 60) * parseFloat(this.totalSalary)).toFixed(2);


                }

              }
              if (i == 2) {
                this.haltData.lastDaySalery = ((lastDayHalt) / 60 * parseFloat(this.totalSalary)).toFixed(2);
              }
              this.haltData.weekSalary = ((haltApproved) / 60 * parseFloat(this.totalSalary)).toFixed(2);
              this.haltData.weekHalt = this.commonService.getHrs(halt);
              this.haltData.weekHaltApproved = this.commonService.getHrs(haltApproved);

            }
            haltInfoData.unsubscribe();
          });
      }
    }
  }

  drawChartCurrentDay(chartData: any) {


    let chart = new CanvasJS.Chart("chartContainer", {

      animationEnabled: true,
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      axisY: {
        title: "Halt Time (in hour)"
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

  showGraph() {
    $('#divG').show();
    $('#divTbl').hide();
    $('#spGraph').hide();
    $('#spTable').show();
    if (this.weekHaltList.length > 0) {
      let chartData = [];
      for (let i = 0; i < this.weekHaltList.length - 1; i++) {
        let haltHour = this.weekHaltList[i]["approved"].toString().replace(":", ".");
        chartData.push({ y: parseFloat(haltHour), label: this.weekHaltList[i]["wDate"] });
      }
      this.drawChartCurrentDay(chartData);
    }
  }
  showTable() {
    $('#divG').hide();
    $('#divTbl').show();
    $('#spGraph').show();
    $('#spTable').hide();
    if (this.weekHaltList.length > 0) {
      let chartData = [];
      for (let i = 0; i < this.weekHaltList.length; i++) {
        let haltHour = this.weekHaltList[i]["approved"].toString().replace(":", ".");

        chartData.push({ y: parseFloat(haltHour), label: this.weekHaltList[i]["wDate"] });


      }
      this.drawChartCurrentDay(chartData);
    }
  }


  getHaltDataLastWeek() {
    let halt = 0;
    let haltApproved = 0;
    for (let index = 1; index < this.zoneList.length; index++) {
      for (let i = 7; i < 14; i++) {
        let haltDate = this.commonService.getPreviousDate(this.currentDate, i);
        let monthName = this.commonService.getCurrentMonthName(new Date(haltDate).getMonth());
        let year = haltDate.split("-")[0];
        let haltInfoPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + monthName + '/' + haltDate;
        let haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe(
          haltData => {
            if (haltData.length > 0) {
              for (let index = 0; index < haltData.length; index++) {
                if (haltData[index]["haltType"] != "network-off") {
                  let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                  if (duration > this.minHalt) {
                    halt += duration;
                    if (haltData[index]["canRemove"] != null) {
                      if (haltData[index]["canRemove"] == "yes") {
                        haltApproved += duration;
                      }
                    }
                    else {
                      haltApproved += duration;
                    }
                  }
                }
              }
            }
            this.haltData.lastWeekSalary = ((haltApproved) / 60 * parseFloat(this.totalSalary)).toFixed(2);

            haltInfoData.unsubscribe();
          });
      }
    }
  }

  getHaltDataLastMonth() {
    let lastMonthHalt = 0;
    let d = new Date();
    let monthPre = d.getMonth();
    let year = d.getFullYear();
    if (monthPre == 0) {
      monthPre = 12;
      year = (parseInt(year.toString()) - 1);
    }

    let days = new Date(year, monthPre, 0).getDate();
    for (let index = 1; index < this.zoneList.length; index++) {
      for (let i = 1; i <= days; i++) {
        let monthDate = year + '-' + (monthPre < 10 ? '0' : '') + monthPre + '-' + (i < 10 ? '0' : '') + i;
        let fullMonth = this.commonService.getCurrentMonthName(new Date(monthDate).getMonth());
        let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + fullMonth + '/' + monthDate;
        
        let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
          haltMonthData => {
            if (haltMonthData.length > 0) {
              for (let index = 0; index < haltMonthData.length; index++) {
                if (haltMonthData[index]["haltType"] != "network-off") {
                  let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                  if (duration > this.minHalt) {
                    if (haltMonthData[index]["canRemove"] != null) {
                      if (haltMonthData[index]["canRemove"] == "yes") {
                        lastMonthHalt += duration;
                      }
                    }
                    else {
                      lastMonthHalt += duration;
                    }
                  }
                }
              }
            }
            this.haltData.lastMonthSalary = ((lastMonthHalt) / 60 * parseFloat(this.totalSalary)).toFixed(2);
            haltInfoMonthData.unsubscribe();
          });
      }
    }
  }


  setPerformar() {
    this.dailyPerformerList = [];
    this.dailyPerformer = [];
    this.weekPerformerList = [];
    this.weekPerformer = [];
    this.monthPerformerList = [];
    this.monthPerformer = [];
    if (this.haltList.length > 0) {
      //Week halt performance

      for (let i = 0; i < this.haltList.length; i++) {
        if (this.haltList[i]["dayMin1"] != "0" && this.haltList[i]["dayMin2"] != "0" && this.haltList[i]["dayMin3"] != "0" && this.haltList[i]["dayMin4"] != "0" && this.haltList[i]["dayMin5"] != "0" && this.haltList[i]["dayMin6"] != "0" && this.haltList[i]["dayMin7"] != "0") {
          let weekHalt = parseInt(this.haltList[i]["dayMin1"]) + parseInt(this.haltList[i]["dayMin2"]) + parseInt(this.haltList[i]["dayMin3"]) + parseInt(this.haltList[i]["dayMin4"]) + parseInt(this.haltList[i]["dayMin5"]) + parseInt(this.haltList[i]["dayMin6"]) + parseInt(this.haltList[i]["dayMin7"]);
          let halt = this.commonService.getHrs(weekHalt);
          this.weekPerformerList.push({ driverName: this.haltList[i]["driverName"], halt: halt, haltMin: weekHalt });
        }
      }
      this.weekPerformerList = this.commonService.transform(this.weekPerformerList, "haltMin");
      for (let i = 0; i < 5; i++) {
        this.weekPerformer.push({ driverName: this.weekPerformerList[i]["driverName"], halt: this.weekPerformerList[i]["halt"], driverName2: "", halt2: "0" });

      }
      let k = 0;
      for (let i = this.weekPerformerList.length - 1; i > this.weekPerformerList.length - 6; i--) {
        this.weekPerformer[k]["driverName2"] = this.weekPerformerList[i]["driverName"];
        this.weekPerformer[k]["halt2"] = this.weekPerformerList[i]["halt"];
        k++;
      }
      // daily halt performance
      for (let i = 0; i < this.haltList.length; i++) {
        if (this.haltList[i]["dayMin1"] != "0") {
          let weekHalt = parseInt(this.haltList[i]["dayMin1"]);
          let halt = this.commonService.getHrs(weekHalt);
          this.dailyPerformerList.push({ driverName: this.haltList[i]["driverName"], halt: halt, haltMin: weekHalt });
        }
      }
      this.dailyPerformerList = this.commonService.transform(this.dailyPerformerList, "haltMin");
      for (let i = 0; i < 5; i++) {
        this.dailyPerformer.push({ driverName: this.dailyPerformerList[i]["driverName"], halt: this.dailyPerformerList[i]["halt"], driverName2: "", halt2: "0" });

      }
      k = 0;
      for (let i = this.dailyPerformerList.length - 1; i > this.dailyPerformerList.length - 6; i--) {
        this.dailyPerformer[k]["driverName2"] = this.dailyPerformerList[i]["driverName"];
        this.dailyPerformer[k]["halt2"] = this.dailyPerformerList[i]["halt"];
        k++;

      }
    }
  }

  setProfitLose() {
    let todaySalary = $('#sptodaySalary').html();
    let lastDaySalery = $('#splastDaySalery').html();
    let todayProfitLose = (parseFloat(lastDaySalery) - parseFloat(todaySalary)).toFixed(2);
    let todatPercent = (((parseFloat(lastDaySalery) - parseFloat(todaySalary)) / parseFloat(lastDaySalery)) * 100).toFixed(2);
    $('#sptodayProfitLose').html(todayProfitLose);
    $('#sptodayPercent').html(todatPercent + "%");

    if (!todatPercent.toString().includes("-")) {
      $('#sptodayPercent').removeClass("fas fa-long-arrow-alt-down");
      $('#sptodayPercent').addClass("fas fa-long-arrow-alt-up");
    }
    else {
      $('#sptodayPercent').html((todatPercent + "%").replace("-", ""));
    }
    let weekSalary = $('#spweekSalary').html();
    let lastWeekSalary = $('#splastWeekSalary').html();
    let weekProfitLose = (parseFloat(lastWeekSalary) - parseFloat(weekSalary)).toFixed(2);
    let weekPercent = (((parseFloat(lastWeekSalary) - parseFloat(weekSalary)) / parseFloat(lastWeekSalary)) * 100).toFixed(2);
    $('#spweekProfitLose').html(weekProfitLose);
    $('#spweekPercent').html(weekPercent + "%");
    if (!weekPercent.toString().includes("-")) {
      $('#spweekPercent').removeClass("fas fa-long-arrow-alt-down");
      $('#spweekPercent').addClass("fas fa-long-arrow-alt-up");
      $('#spweekPercent').html((weekPercent + "%").replace("-", ""));
    }
    else {
      $('#spweekPercent').html((weekPercent + "%").replace("-", ""));
      $('#spweekPercent').removeClass("fas fa-long-arrow-alt-up");
      $('#spweekPercent').addClass("fas fa-long-arrow-alt-down");
    }

    let monthSalary = $('#spmonthSalary').html();
    let lastMonthSalary = $('#splastMonthSalary').html();
    let monthProfitLose = (parseFloat(lastMonthSalary) - parseFloat(monthSalary)).toFixed(2);
    let monthPercent = (((parseFloat(lastMonthSalary) - parseFloat(monthSalary)) / parseFloat(lastMonthSalary)) * 100).toFixed(2);
    $('#spmonthProfitLose').html(monthProfitLose)
    $('#spmonthPercent').html(monthPercent + "%");
    if (!monthPercent.toString().includes("-")) {
      $('#spmonthPercent').removeClass("fas fa-long-arrow-alt-down");
      $('#spmonthPercent').addClass("fas fa-long-arrow-alt-up");
      $('#spmonthPercent').html((monthPercent + "%").replace("-", ""));
    }
    else {
      $('#spmonthPercent').html((monthPercent + "%").replace("-", ""));
    }

    if (this.weekHaltList.length > 0) {
      for (let i = 0; i < this.weekHaltList.length - 1; i++) {
        let halt = this.weekHaltList[i]["halt"].replace(":", ".");
        let preHalt = this.weekHaltList[i + 1]["halt"].replace(":", ".");
        let percent = (((parseFloat(preHalt) - parseFloat(halt)) / parseFloat(preHalt)) * 100).toFixed(2);
        this.weekHaltList[i]["percent"] = percent.replace("-", "");
        if (percent.includes("-")) {
          this.weekHaltList[i]["class"] = "fas fa-long-arrow-alt-down";
        }
        else {
          this.weekHaltList[i]["class"] = "fas fa-long-arrow-alt-up";
        }

        let unApproved = this.weekHaltList[i]["unApproved"].replace(":", ".");
        let preUnApproved = this.weekHaltList[i + 1]["unApproved"].replace(":", ".");
        let percentUnApproved = (((parseFloat(preUnApproved) - parseFloat(unApproved)) / parseFloat(preUnApproved)) * 100).toFixed(2);
        this.weekHaltList[i]["percentUnApproved"] = percentUnApproved.replace("-", "");
        if (percentUnApproved.includes("-")) {
          this.weekHaltList[i]["classUnApproved"] = "fas fa-long-arrow-alt-down";
        }
        else {
          this.weekHaltList[i]["classUnApproved"] = "fas fa-long-arrow-alt-up";
        }

        let approved = this.weekHaltList[i]["approved"].replace(":", ".");
        let preApproved = this.weekHaltList[i + 1]["approved"].replace(":", ".");
        let percentApproved = (((parseFloat(preApproved) - parseFloat(approved)) / parseFloat(preApproved)) * 100).toFixed(2);
        this.weekHaltList[i]["percentApproved"] = percentApproved.replace("-", "");
        if (percentApproved.includes("-")) {
          this.weekHaltList[i]["classApproved"] = "fas fa-long-arrow-alt-down";
        }
        else {
          this.weekHaltList[i]["classApproved"] = "fas fa-long-arrow-alt-up";
        }

        let salary = this.weekHaltList[i]["salary"];
        let preSalary = this.weekHaltList[i + 1]["salary"];
        let percentSalary = (((parseFloat(preSalary) - parseFloat(salary)) / parseFloat(preSalary)) * 100).toFixed(2);
        this.weekHaltList[i]["percentSalary"] = percentSalary.replace("-", "");
        if (percentSalary.includes("-")) {
          this.weekHaltList[i]["classSalary"] = "fas fa-long-arrow-alt-down";
        }
        else {
          this.weekHaltList[i]["classSalary"] = "fas fa-long-arrow-alt-up";
        }
      }

    }
  }

  getDriverData() {
    this.haltList = [];
    let d = new Date();
    let today = d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();
    for (let i = 1; i < 8; i++) {

      let dataDate = this.commonService.getPreviousDate(this.currentDate, (i - 1));

      let monthName = this.commonService.getCurrentMonthName(new Date(dataDate).getMonth());
      let year = dataDate.split("-")[0];

      for (let index = 1; index < this.zoneList.length; index++) {
        let ward = this.zoneList[index]["zoneNo"];
        // Get Driver data
        let workerDataPath = 'WasteCollectionInfo/' + ward + '/' + dataDate + '/WorkerDetails';

        let workerDetails = this.db.object(workerDataPath).valueChanges().subscribe(
          workerInfo => {
            if (workerInfo) {

              let driverPath = 'Employees/' + workerInfo["driver"] + "/GeneralDetails";

              let driver = this.db.object(driverPath).valueChanges().subscribe(
                driverData => {
                  let driverName = driverData["name"];
                  if (this.haltList.length > 0) {
                    let lineData = this.haltList.find(item => item.driverName == driverData["name"]);
                    if (lineData == null) {
                      this.haltList.push({ driverName: driverData != null ? (driverData["name"]) : "---", day1: "0", day2: "0", day3: "0", day4: "0", day5: "0", day6: "0", day7: "0", dayMin1: 0, dayMin2: 0, dayMin3: 0, dayMin4: 0, dayMin5: 0, dayMin6: 0, dayMin7: 0 })
                    }
                  }
                  else {
                    this.haltList.push({ driverName: driverData != null ? (driverData["name"]) : "---", day1: "0", day2: "0", day3: "0", day4: "0", day5: "0", day6: "0", day7: "0", dayMin1: 0, dayMin2: 0, dayMin3: 0, dayMin4: 0, dayMin5: 0, dayMin6: 0, dayMin7: 0 })
                  }
                  this.haltList = this.commonService.transform(this.haltList, "driverName");
                  let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + monthName + '/' + dataDate;
                  let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
                    haltMonthData => {
                      if (haltMonthData.length > 0) {
                        let totalBreak = 0;
                        for (let i = 0; i < haltMonthData.length; i++) {
                          if (haltMonthData[i]["haltType"] != "network-off") {
                            let duration = haltMonthData[i]["duration"] != undefined ? haltMonthData[i]["duration"] : 0;
                            if (duration > this.minHalt) {
                              if (haltMonthData[i]["canRemove"] != null) {
                                if (haltMonthData[i]["canRemove"] == "yes") {
                                  totalBreak += duration;
                                }
                              }
                              else {
                                totalBreak += duration;
                              }
                            }
                          }
                        }
                        if (i == 1) {
                          for (let j = 0; j < this.haltList.length; j++) {
                            if (this.haltList[j]["driverName"] == driverName) {
                              this.haltList[j]["dayMin1"] = parseInt(this.haltList[j]["dayMin1"]) + totalBreak;
                              this.haltList[j]["day1"] = (this.commonService.getHrs(parseInt(this.haltList[j]["dayMin1"])));
                            }
                          }
                        }
                        if (i == 2) {
                          for (let j = 0; j < this.haltList.length; j++) {
                            if (this.haltList[j]["driverName"] == driverName) {
                              this.haltList[j]["dayMin2"] = parseInt(this.haltList[j]["dayMin2"]) + totalBreak;
                              this.haltList[j]["day2"] = (this.commonService.getHrs(parseInt(this.haltList[j]["dayMin2"])));
                            }
                          }
                        }
                        if (i == 3) {
                          for (let j = 0; j < this.haltList.length; j++) {
                            if (this.haltList[j]["driverName"] == driverName) {
                              this.haltList[j]["dayMin3"] = parseInt(this.haltList[j]["dayMin3"]) + totalBreak;
                              this.haltList[j]["day3"] = (this.commonService.getHrs(parseInt(this.haltList[j]["dayMin3"])));
                            }
                          }
                        }
                        if (i == 4) {
                          for (let j = 0; j < this.haltList.length; j++) {
                            if (this.haltList[j]["driverName"] == driverName) {
                              this.haltList[j]["dayMin4"] = parseInt(this.haltList[j]["dayMin4"]) + totalBreak;
                              this.haltList[j]["day4"] = (this.commonService.getHrs(parseInt(this.haltList[j]["dayMin4"])));
                            }
                          }
                        }
                        if (i == 5) {
                          for (let j = 0; j < this.haltList.length; j++) {
                            if (this.haltList[j]["driverName"] == driverName) {
                              this.haltList[j]["dayMin5"] = parseInt(this.haltList[j]["dayMin5"]) + totalBreak;
                              this.haltList[j]["day5"] = (this.commonService.getHrs(parseInt(this.haltList[j]["dayMin5"])));
                            }
                          }
                        }
                        if (i == 6) {
                          for (let j = 0; j < this.haltList.length; j++) {
                            if (this.haltList[j]["driverName"] == driverName) {
                              this.haltList[j]["dayMin6"] = parseInt(this.haltList[j]["dayMin6"]) + totalBreak;
                              this.haltList[j]["day6"] = (this.commonService.getHrs(parseInt(this.haltList[j]["dayMin6"])));
                            }
                          }
                        }
                        if (i == 7) {
                          for (let j = 0; j < this.haltList.length; j++) {
                            if (this.haltList[j]["driverName"] == driverName) {
                              this.haltList[j]["dayMin7"] = parseInt(this.haltList[j]["dayMin7"]) + totalBreak;
                              this.haltList[j]["day7"] = (this.commonService.getHrs(parseInt(this.haltList[j]["dayMin7"])));
                            }
                          }
                        }
                      }
                      haltInfoMonthData.unsubscribe();
                    });
                });
            }
            workerDetails.unsubscribe();
          });
      }
    }
  }

  getHaltData() {
    let todayHalt = 0;
    let todayHaltApproved = 0;
    let lastDayHalt = 0;

    let weekHalt = 0;
    let weekHaltApproved = 0;
    let lastWeekHalt = 0;

    let monthHalt = 0;
    let monthHaltApproved = 0;
    let lastMonthHalt = 0;

    let day1 = this.currentDate;
    let day2 = this.commonService.getPreviousDate(this.currentDate, 1);
    let day3 = this.commonService.getPreviousDate(this.currentDate, 2);
    let day4 = this.commonService.getPreviousDate(this.currentDate, 3);
    let day5 = this.commonService.getPreviousDate(this.currentDate, 4);
    let day6 = this.commonService.getPreviousDate(this.currentDate, 5);
    let day7 = this.commonService.getPreviousDate(this.currentDate, 6);
    let day8 = this.commonService.getPreviousDate(this.currentDate, 7);
    let day9 = this.commonService.getPreviousDate(this.currentDate, 8);
    let day10 = this.commonService.getPreviousDate(this.currentDate, 9);
    let day11 = this.commonService.getPreviousDate(this.currentDate, 10);
    let day12 = this.commonService.getPreviousDate(this.currentDate, 11);
    let day13 = this.commonService.getPreviousDate(this.currentDate, 12);
    let day14 = this.commonService.getPreviousDate(this.currentDate, 13);

    for (let index = 1; index < this.zoneList.length; index++) {
      let ward = this.zoneList[index]["zoneNo"];
      let d = new Date();
      let today = d.getDate();
      let month = d.getMonth() + 1;
      let year = d.getFullYear();
      let haltDate = "";
      for (let i = 1; i <= today; i++) {

        haltDate = d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (i < 10 ? '0' : '') + i;
        let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + this.currentMonth + '/' + haltDate;
        let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
          haltMonthData => {
            if (haltMonthData.length > 0) {
              for (let index = 0; index < haltMonthData.length; index++) {
                if (haltMonthData[index]["haltType"] != "network-off") {
                  let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                  if (duration > this.minHalt) {
                    monthHalt += duration;
                    if (haltMonthData[index]["canRemove"] != null) {
                      if (haltMonthData[index]["canRemove"] == "yes") {
                        monthHaltApproved += duration;
                      }
                    }
                    else {
                      monthHaltApproved += duration;
                    }
                  }
                }
              }
            }
            this.haltData.monthSalary = ((monthHaltApproved) / 60 * parseFloat(this.totalSalary)).toFixed(2);
            this.haltData.monthHalt = this.commonService.getHrs(monthHalt);
            this.haltData.monthHaltApproved = this.commonService.getHrs(monthHaltApproved);
            haltInfoMonthData.unsubscribe();
          });

        if (haltDate == this.currentDate) {
          let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + haltDate;
          let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
            haltMonthData => {
              if (haltMonthData.length > 0) {
                for (let index = 0; index < haltMonthData.length; index++) {
                  if (haltMonthData[index]["haltType"] != "network-off") {
                    let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                    if (duration > this.minHalt) {
                      todayHalt += duration;
                      if (haltMonthData[index]["canRemove"] != null) {
                        if (haltMonthData[index]["canRemove"] == "yes") {
                          todayHaltApproved += duration;
                        }
                      }
                      else {
                        todayHaltApproved += duration;
                      }
                    }
                  }
                }
              }
              this.haltData.todaySalary = ((todayHaltApproved) / 60 * parseFloat(this.totalSalary)).toFixed(2);
              this.haltData.todayHalt = this.commonService.getHrs(todayHalt);
              this.haltData.todayHaltApproved = this.commonService.getHrs(todayHaltApproved);
              haltInfoMonthData.unsubscribe();
            });
        }

        if (haltDate == day2) {
          let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + haltDate;
          let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
            haltMonthData => {
              if (haltMonthData.length > 0) {
                for (let index = 0; index < haltMonthData.length; index++) {
                  if (haltMonthData[index]["haltType"] != "network-off") {
                    let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                    if (duration > this.minHalt) {
                      if (haltMonthData[index]["canRemove"] != null) {
                        if (haltMonthData[index]["canRemove"] == "yes") {
                          lastDayHalt += duration;
                        }
                      }
                      else {
                        lastDayHalt += duration;
                      }
                    }
                  }
                }
              }
              this.haltData.lastDaySalery = ((lastDayHalt) / 60 * parseFloat(this.totalSalary)).toFixed(2);
              haltInfoMonthData.unsubscribe();
            });
        }

        if (haltDate == day1 || haltDate == day2 || haltDate == day3 || haltDate == day4 || haltDate == day5 || haltDate == day6 || haltDate == day7) {
          let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + haltDate;
          let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
            haltMonthData => {
              if (haltMonthData.length > 0) {
                for (let index = 0; index < haltMonthData.length; index++) {
                  if (haltMonthData[index]["haltType"] != "network-off") {
                    let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                    if (duration > this.minHalt) {
                      weekHalt += duration;
                      if (haltMonthData[index]["canRemove"] != null) {
                        if (haltMonthData[index]["canRemove"] == "yes") {
                          weekHaltApproved += duration;
                        }
                      }
                      else {
                        weekHaltApproved += duration;
                      }
                    }
                  }
                }
              }
              this.haltData.weekSalary = ((weekHaltApproved) / 60 * parseFloat(this.totalSalary)).toFixed(2);
              this.haltData.weekHalt = this.commonService.getHrs(weekHalt);
              this.haltData.weekHaltApproved = this.commonService.getHrs(weekHaltApproved);
              haltInfoMonthData.unsubscribe();
            });
        }

        if (haltDate == day8 || haltDate == day9 || haltDate == day10 || haltDate == day11 || haltDate == day12 || haltDate == day13 || haltDate == day14) {
          let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + haltDate;
          let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
            haltMonthData => {
              if (haltMonthData.length > 0) {
                for (let index = 0; index < haltMonthData.length; index++) {
                  if (haltMonthData[index]["haltType"] != "network-off") {
                    let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                    if (duration > this.minHalt) {
                      if (haltMonthData[index]["canRemove"] != null) {
                        if (haltMonthData[index]["canRemove"] == "yes") {
                          lastWeekHalt += duration;
                        }
                      }
                      else {
                        lastWeekHalt += duration;
                      }
                    }
                  }
                }
              }
              this.haltData.lastWeekSalary = ((lastWeekHalt) / 60 * parseFloat(this.totalSalary)).toFixed(2);
              let plPercent = parseFloat(this.haltData.weekProfitLose) * 100 / parseFloat(this.haltData.lastWeekSalary);
              this.haltData.weekPercent = plPercent.toFixed(2);
              haltInfoMonthData.unsubscribe();
            });
        }
      }

      let monthPre = d.getMonth();
      year = d.getFullYear();
      let days = new Date(year, monthPre, 0).getDate();
      for (let i = 1; i <= days; i++) {
        let monthDate = d.getFullYear() + '-' + (monthPre < 10 ? '0' : '') + monthPre + '-' + (i < 10 ? '0' : '') + i;
        let fullMonth = this.commonService.getCurrentMonthName(new Date(monthDate).getMonth());
        let haltInfoMonthPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + year + '/' + fullMonth + '/' + monthDate;

        let haltInfoMonthData = this.db.list(haltInfoMonthPath).valueChanges().subscribe(
          haltMonthData => {
            if (haltMonthData.length > 0) {
              for (let index = 0; index < haltMonthData.length; index++) {
                if (haltMonthData[index]["haltType"] != "network-off") {
                  let duration = haltMonthData[index]["duration"] != undefined ? haltMonthData[index]["duration"] : 0;
                  if (duration > this.minHalt) {
                    if (haltMonthData[index]["canRemove"] != null) {
                      if (haltMonthData[index]["canRemove"] == "yes") {
                        lastMonthHalt += duration;
                      }
                    }
                    else {
                      lastMonthHalt += duration;
                    }
                  }
                }
              }
            }
            this.haltData.lastMonthSalary = ((lastMonthHalt) / 60 * parseFloat(this.totalSalary)).toFixed(2);
            haltInfoMonthData.unsubscribe();
          });
      }

    }

  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }


  getHaltDataTodayDetail() {
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
      this.allMarkers = [];
    }
    this.bounds = new google.maps.LatLngBounds();
    this.todayHaltList = [];
    this.zoneHaltList = [];
    for (let i = 1; i < this.zoneList.length; i++) {
      let d = new Date();
      let today = d.getDate();
      let month = d.getMonth() + 1;
      let year = d.getFullYear();

      let haltDate = "";
      haltDate = d.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (today < 10 ? '0' : '') + today;
      let monthName = this.commonService.getCurrentMonthName(new Date(haltDate).getMonth());

      let toDayHaltInfoPath = 'HaltInfo/' + this.zoneList[i]["zoneNo"] + '/' + year + '/' + monthName + '/' + haltDate;

      let haltInfoData = this.db.list(toDayHaltInfoPath).valueChanges().subscribe(
        haltData => {

          if (haltData.length > 0) {
            let totalBreak = 0;
            let totalHalt = 0;
            let haltApproved = 0;
            let haltUnApproved = 0;
            for (let index = 0; index < haltData.length; index++) {
              if (haltData[index]["haltType"] != "network-off") {
                let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                if (duration > this.minHalt) {
                  totalHalt += duration;
                  if (haltData[index]["canRemove"] != null) {
                    if (haltData[index]["canRemove"] == "yes") {
                      totalBreak += duration;
                    }
                  }
                  else {
                    totalBreak += duration;
                  }
                  haltApproved = totalBreak;
                  haltUnApproved = totalHalt - haltApproved;
                  this.zoneHaltList.push({ zoneNo: this.zoneList[i]["zoneNo"], location: haltData[index]["location"], duration: haltData[index]["duration"], startTime: haltData[index]["startTime"] });


                  let latlng = haltData[index]["location"].split(':')[1].split(',');
                  let lt = $.trim(latlng[0]).replace("(", "");
                  let lg = $.trim(latlng[1]).replace(")", "");

                  this.bounds.extend({ lat: Number(lt), lng: Number(lg) });

                  let markerURL = "../../../assets/img/" + this.getMarkerName(duration) + ".svg";
                  var markerLabel = haltData[index]["duration"];
                  let marker = new google.maps.Marker({
                    position: { lat: Number(lt), lng: Number(lg) },
                    map: this.map,
                    label: { text: ' ' + markerLabel + ' ', color: "white", fontSize: "12px", fontWeight: "bold" },
                    icon: {
                      url: markerURL,
                      fillOpacity: 1,
                      strokeWeight: 0,
                      scaledSize: new google.maps.Size(50, 50),
                      origin: new google.maps.Point(0, 0),
                      labelOrigin: new google.maps.Point(25, 31)
                    }
                  });
                  this.map.fitBounds(this.bounds);

                  let contentString = 'Start Time : ' + haltData[index]["startTime"] + ' <br/> Break Time : ' + haltData[index]["duration"];

                  let infowindow = new google.maps.InfoWindow({
                    content: contentString
                  });

                  marker.addListener('click', function () {
                    infowindow.open(this.map, marker);
                  });
                  this.allMarkers.push({ marker });
                }
              }
            }
            let halt = this.commonService.getHrs(totalHalt);
            let approved = this.commonService.getHrs(haltApproved);
            let unApproved = this.commonService.getHrs(haltUnApproved);
            let haltSalary = ((haltApproved / 60) * parseFloat(this.totalSalary)).toFixed(2);
            let workerDataPath = 'WasteCollectionInfo/' + this.zoneList[i]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + haltDate + '/WorkerDetails';

            let workerDetails = this.db.object(workerDataPath).valueChanges().subscribe(
              workerInfo => {
                if (workerInfo) {

                  let driverPath = 'Employees/' + workerInfo["driver"] + "/GeneralDetails";

                  let driver = this.db.object(driverPath).valueChanges().subscribe(
                    driverData => {

                      this.todayHaltList.push({ driverName: driverData != null ? (driverData["name"]) : "---", zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"].replace("Ward ", ""), halt: halt, approved: approved, unApproved: unApproved, salary: haltSalary, bgColor: "" });

                    });
                }
              });
          }
          this.map.fitBounds(this.bounds);
          haltInfoData.unsubscribe();
        });
    }

  }

  getMarkerName(breakTime: number) {

    let markerColor: any;
    if (breakTime <= 10) {
      markerColor = "green";
    } else if (breakTime > 10 && breakTime <= 20) {
      markerColor = "orange";
    } else { markerColor = "red"; }

    return markerColor;
  }

  setMap() {

    var mapstyle = new google.maps.StyledMapType(
      [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: "off" }]
        },
      ]
    );

    let mapProp = this.commonService.mapForHaltReport();
    this.map = new google.maps.Map(document.getElementById("haltMap"), mapProp);

    this.map.mapTypes.set('styled_map', mapstyle);
    this.map.setMapTypeId('styled_map');
  }

  getWardMap(zoneNo: any) {
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
      this.allMarkers = [];
    }
    if (this.todayHaltList.length > 0) {
      for (let i = 0; i < this.todayHaltList.length; i++) {
        if (this.todayHaltList[i]["zoneNo"] == zoneNo) {
          this.todayHaltList[i]["bgColor"] = "selectedZone";
        }
        else {
          this.todayHaltList[i]["bgColor"] = "";
        }
      }
    }
    if (this.zoneHaltList.length > 0) {
      for (let i = 0; i < this.zoneHaltList.length; i++) {
        if (this.zoneHaltList[i]["zoneNo"] == zoneNo) {

          let latlng = this.zoneHaltList[i]["location"].split(':')[1].split(',');
          let lt = $.trim(latlng[0]).replace("(", "");
          let lg = $.trim(latlng[1]).replace(")", "");

          this.bounds.extend({ lat: Number(lt), lng: Number(lg) });

          let markerURL = "../../../assets/img/" + this.getMarkerName(this.zoneHaltList[i]["duration"]) + ".svg";
          var markerLabel = this.zoneHaltList[i]["duration"];
          let marker = new google.maps.Marker({
            position: { lat: Number(lt), lng: Number(lg) },
            map: this.map,
            label: { text: ' ' + markerLabel + ' ', color: "white", fontSize: "12px", fontWeight: "bold" },
            icon: {
              url: markerURL,
              fillOpacity: 1,
              strokeWeight: 0,
              scaledSize: new google.maps.Size(50, 50),
              origin: new google.maps.Point(0, 0),
              labelOrigin: new google.maps.Point(25, 31)
            }
          });

          let contentString = 'Start Time : ' + this.zoneHaltList[i]["startTime"] + ' <br/> Break Time : ' + this.zoneHaltList[i]["duration"];

          let infowindow = new google.maps.InfoWindow({
            content: contentString
          });

          marker.addListener('click', function () {
            infowindow.open(this.map, marker);
          });
          this.allMarkers.push({ marker });
        }
      }
    }

  }

  openMapModel(content: any) {

    //if (breakTime == "0:00") { return; }
    this.getHaltDataTodayDetail();


    this.modalService.open(content, { size: 'lg' });
    let height = $(window).height();
    $('div .modal-content').parent().css("max-width", ($(window).width() - 250) + "px").css("margin-top", "10px");
    $('div .modal-content').css("height", (height - 40) + "px");
    $('#divMap').css("height", (height - 65) + "px");
    this.setMap();
    //this.setKml(wardno);
    //this.showBreaksOnMap(wardno);
  }

  closeMapModel() {
    if (this.todayHaltList.length > 0) {
      for (let i = 0; i < this.todayHaltList.length; i++) {
        this.todayHaltList[i]["bgColor"] = "";
      }
    }
    this.modalService.dismissAll();
  }
}


export class haltDetail {

  todayHalt: string;
  todayHaltUnApproved: string;
  todayHaltApproved: string;
  todaySalary: string;
  lastDayHalt: string;
  lastDaySalery: string;
  todayProfitLose: string;
  todayPercent: string;

  weekHalt: string;
  weekHaltUnApproved: string;
  weekHaltApproved: string;
  weekSalary: string;
  lastWeekHalt: string;
  lastWeekSalary: string;
  weekProfitLose: string;
  weekPercent: string;

  monthHalt: string;
  monthHaltUnApproved: string;
  monthHaltApproved: string;
  monthSalary: string;
  lastMonthHalt: string;
  lastMonthSalary: string;
  monthProfitLose: string;
  monthPercent: string;


  date1: string;
  date2: string;
  date3: string;
  date4: string;
  date5: string;
  date6: string;
  date7: string;
  date8: string;


}


export class haltDetailShow {

  todayHalt: string;
  todayHaltUnApproved: string;
  todayHaltApproved: string;
  todaySalary: string;
  lastDayHalt: string;
  lastDaySalery: string;
  todayProfitLose: string;
  todayPercent: string;

  weekHalt: string;
  weekHaltUnApproved: string;
  weekHaltApproved: string;
  weekSalary: string;
  lastWeekHalt: string;
  lastWeekSalary: string;
  weekProfitLose: string;
  weekPercent: string;

  monthHalt: string;
  monthHaltUnApproved: string;
  monthHaltApproved: string;
  monthSalary: string;
  lastMonthHalt: string;
  lastMonthSalary: string;
  monthProfitLose: string;
  monthPercent: string;


  date1: string;
  date2: string;
  date3: string;
  date4: string;
  date5: string;
  date6: string;
  date7: string;
  date8: string;


}
