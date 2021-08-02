/// <reference types="@types/googlemaps" />

import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import * as $ from 'jquery';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


//services
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";
import { MapService } from '../services/map/map.service';


import * as CanvasJS from '../../assets/canvasjs.min';
import * as html2canvas from "html2canvas";

@Component({
  selector: 'app-halt-report',
  templateUrl: './halt-report.component.html',
  styleUrls: ['./halt-report.component.scss']
})
export class HaltReportComponent implements OnInit {

  require: any;

  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private mapService: MapService, private commonService: CommonService, private modalService: NgbModal) { }
  zoneList: any[];
  selectedDate: any;
  currentMonth: any;
  currentYear: any;
  haltList: any[];
  dateList: any[];
  minHalt: number;
  haltListDriver: any[];
  haltMonthlyListDriver: any[];
  db:any;

  headerData: headerDetail =
    {
      month: '',
      date: ''
    };

  ngOnInit() {
    this.db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    $('#chartContainer').css("height", $(window).height() - $("#divGeneralData").height() - 201);
    this.selectedDate = this.commonService.setTodayDate();
    this.currentMonth = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    //this.headerData.date
    this.minHalt = 5;
   // this.getZoneList();
   // this.getHaltDriverData();
   // this.getHaltMonthlyDriverData();
     //this.getHaltData();
  }


  getHaltMonthlyDriverData() {
    let d = new Date();
    this.haltMonthlyListDriver = [];
    let haltDateData = [];

    let month = d.getMonth() + 1;
    let day = d.getDate();
    let year = d.getFullYear();




    for (let index = 1; index < this.zoneList.length; index++) {
      //for (let index = 1; index < 2; index++) {


      let ward = this.zoneList[index]["zoneNo"];
      for (let i = 1; i <= day; i++) {
        let dataDate = this.commonService.getDate(i, month, year);
        // Get Driver data
        let workerDataPath = 'WasteCollectionInfo/' + ward + '/' + dataDate + '/WorkerDetails';

        let workerDetails = this.db.object(workerDataPath).valueChanges().subscribe(
          workerInfo => {

            setTimeout(() => {
              if (workerInfo) {

                let driverPath = 'Employees/' + workerInfo["driver"] + "/GeneralDetails";

                let driver = this.db.object(driverPath).valueChanges().subscribe(
                  driverData => {


                    let helperPath = 'Employees/' + workerInfo["helper"] + "/GeneralDetails";
                    let helper = this.db.object(helperPath).valueChanges().subscribe(
                      helperData => {


                        let haltInfoPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + dataDate;
                        let haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe(
                          haltData => {

                            let totalBreak = 0;
                            if (haltData.length > 0) {

                              for (let index = 0; index < haltData.length; index++) {

                                if (haltData[index]["haltType"] != "network-off") {
                                  let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                                  if (duration > this.minHalt) {
                                    totalBreak += duration;
                                  }
                                }
                              }
                            }

                            haltDateData.push(
                              {
                                wardNo: this.zoneList[index]["zoneNo"],
                                ward: 'Ward ' + this.zoneList[index]["zoneNo"],
                                driver: driverData != null ? (driverData["name"]) : "---",
                                helper: helperData != null ? (helperData["name"]) : "---",
                                breakTotal: parseFloat(this.commonService.getHrs(totalBreak).replace(":", ".")),
                                breakBGColor: this.commonService.getBreakTimeBGColor(totalBreak),
                                cursorType: totalBreak == 0 ? 'not-allowed' : 'pointer'
                              });
                            haltInfoData.unsubscribe();
                            for (let i = 0; i < haltDateData.length; i++) {
                              let rowIndex = 0;
                              if (i == 0) {
                                this.haltMonthlyListDriver=[];
                                let driverName = haltDateData[i]["driver"];
                                let breakTotal = haltDateData[i]["breakTotal"];

                                this.haltMonthlyListDriver.push({
                                  driver: haltDateData != null ? driverName : "---",
                                  breakTotal:parseFloat(breakTotal),
                                });
                              }
                              else {
                                let driverName = haltDateData[i]["driver"];
                                let haltTime = 0;
                                
                                let breakTotal = haltDateData[i]["breakTotal"];
                                let isdata: boolean = false;
                                for (let j = 0; j < this.haltMonthlyListDriver.length; j++) {
                                  if (driverName == this.haltMonthlyListDriver[j]["driver"]) {
                                    haltTime =parseFloat(this.haltMonthlyListDriver[j]["breakTotal"])+ parseFloat(haltDateData[i]["breakTotal"]);
                                    isdata = true;
                                    rowIndex = j;
                                  }
                                }
                                if (isdata == true) {
                                  this.haltMonthlyListDriver[rowIndex]["breakTotal"] = haltTime;
                                }
                                else {
                                  this.haltMonthlyListDriver.push(
                                    {
                                      driver: driverName != null ? (driverName) : "---",
                                      breakTotal: breakTotal
                                    });
                                }
                              }
                            }
                          });
                      });
                  });
              }
            }, 500);
            workerDetails.unsubscribe();
          });
      }
    }

  }

  getHaltDriverData() {
    this.haltListDriver = []; 
    for (let index = 1; index < this.zoneList.length; index++) {
      //for (let index = 1; index < 2; index++) {


      let ward = this.zoneList[index]["zoneNo"];

      // Get Driver data
      let workerDataPath = 'WasteCollectionInfo/' + ward + '/' + this.selectedDate + '/WorkerDetails';

      let workerDetails = this.db.object(workerDataPath).valueChanges().subscribe(
        workerInfo => {

          setTimeout(() => {
            if (workerInfo) {

              let driverPath = 'Employees/' + workerInfo["driver"] + "/GeneralDetails";

              let driver = this.db.object(driverPath).valueChanges().subscribe(
                driverData => {


                  let helperPath = 'Employees/' + workerInfo["helper"] + "/GeneralDetails";
                  let helper = this.db.object(helperPath).valueChanges().subscribe(
                    helperData => {


                      let haltInfoPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + this.selectedDate;
                      let haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe(
                        haltData => {

                          let totalBreak = 0;
                          if (haltData.length > 0) {

                            for (let index = 0; index < haltData.length; index++) {

                              if (haltData[index]["haltType"] != "network-off") {
                                let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                                if (duration > this.minHalt) {
                                  totalBreak += duration;
                                }
                              }
                            }
                          }

                          this.haltListDriver.push(
                            {
                              wardNo: this.zoneList[index]["zoneNo"],
                              ward: 'Ward ' + this.zoneList[index]["zoneNo"],
                              driver: driverData != null ? (driverData["name"]) : "---",
                              helper: helperData != null ? (helperData["name"]) : "---",
                              breakTotal: this.commonService.getHrs(totalBreak),
                              breakBGColor: this.commonService.getBreakTimeBGColor(totalBreak),
                              cursorType: totalBreak == 0 ? 'not-allowed' : 'pointer'
                            });
                          haltInfoData.unsubscribe();
                        });
                    });
                });
            }
          }, 500);
          workerDetails.unsubscribe();
        });
    }
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  getHaltData() {

    this.dateList = [];
    this.haltList = [];
    this.haltListDriver = [];
    let d = new Date();

    let month = d.getMonth() + 1;
    let day = d.getDate();
    let year = d.getFullYear();

    for (let i = 1; i <= day; i++) {
      let dataDate = this.commonService.getDate(i, month, year);

      for (let index = 1; index < this.zoneList.length; index++) {
        let haltInfoPath = 'HaltInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonth + '/' + dataDate;
        let haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe(
          haltData => {
            let totalBreak = 0;
            if (haltData.length > 0) {

              for (let index = 0; index < haltData.length; index++) {

                if (haltData[index]["haltType"] != "network-off") {
                  let duration = haltData[index]["duration"] != undefined ? haltData[index]["duration"] : 0;
                  if (duration > this.minHalt) {
                    totalBreak += duration;
                  }
                }
              }
            }


            // Get Driver data
            let workerDataPath = 'WasteCollectionInfo/' + this.zoneList[index]["zoneNo"] + '/' + dataDate + '/WorkerDetails';

            let workerDetails = this.db.object(workerDataPath).valueChanges().subscribe(
              workerInfo => {



                if (workerInfo) {

                  let driverPath = 'Employees/' + workerInfo["driver"] + "/GeneralDetails";

                  let driver = this.db.object(driverPath).valueChanges().subscribe(
                    driverData => {


                      let helperPath = 'Employees/' + workerInfo["helper"] + "/GeneralDetails";
                      let helper = this.db.object(helperPath).valueChanges().subscribe(
                        helperData => {

                          this.haltList.push(
                            {
                              wardNo: this.zoneList[index]["zoneNo"],
                              ward: 'Ward ' + this.zoneList[index]["zoneNo"],
                              date: dataDate,
                              month: this.currentMonth,
                              year: this.currentYear,
                              breakTotal: parseFloat(this.commonService.getHrs(totalBreak).replace(":", ".")),
                              driver: driverData != null ? (driverData["name"]) : "---",
                              helper: helperData != null ? (helperData["name"]) : "---",
                              breakBGColor: this.commonService.getBreakTimeBGColor(totalBreak),
                              cursorType: totalBreak == 0 ? 'not-allowed' : 'pointer'
                            });

                          if (this.haltList.length > 0) {

                            let chartData = [];
                            let chartDataMonth = [];
                            let chartDataMonthPie = [];
                            for (let i = 0; i < this.haltList.length; i++) {

                              if (this.haltList[i]["date"] == this.selectedDate) {
                                chartData.push({ y: this.haltList[i]["breakTotal"], label: this.haltList[i]["driver"] });

                              }
                            }
                            this.drawChartCurrentDay(chartData);

                            // for (let i = 1; i < this.zoneList.length; i++) {
                            //   let wardNo = this.zoneList[i]["zoneNo"];
                            //  let haltTime = 0;
                            //  for (let j = 0; j < this.haltList.length; j++) {
                            //    if (wardNo == this.haltList[j]["wardNo"]) {
                            //      haltTime += parseFloat(this.haltList[j]["breakTotal"]);
                            //    }
                            // }
                            //  chartDataMonth.push({ y: haltTime, label: wardNo });
                            // chartDataMonthPie.push({ y: haltTime, name: wardNo });
                            //   }
                            // this.drawChartCurrentMonth(chartDataMonth);
                            //this.drawChartPieCurrentMonth(chartDataMonthPie);
                          }
                        });
                    });
                }
                workerDetails.unsubscribe();
              })
            haltInfoData.unsubscribe();
          });
      }
    }
  }

  isGreaterThanFive(x: any, y: any) {
    return x = y;
  }

  getMonthHalt() {

  }

  drawChartCurrentDay(chartData: any) {


    let chart = new CanvasJS.Chart("chartContainer", {

      animationEnabled: true,
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      title: {
        text: "Today Ward Halts"
      },
      axisY: {
        title: "Halt Time"
      },
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

  drawChartCurrentMonth(chartData: any) {


    let chart = new CanvasJS.Chart("chartContainerMonth", {

      animationEnabled: true,
      theme: "light2", // "light1", "light2", "dark1", "dark2"
      title: {
        text: "This Month Ward Halts"
      },
      axisY: {
        title: "Halt Time"
      },
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

  drawChartPieCurrentMonth(chartData: any) {


    let chart = new CanvasJS.Chart("chartContainerPieMonth", {

      animationEnabled: true,
      legend: {
        fontSize: 13,
        verticalAlign: "top",
      },
      toolTip: {
        enabled: true,
      },
      data: [{
        type: "doughnut",
        showInLegend: true,
        indexLabel: "#percent%",
        indexLabelPlacement: "inside",
        indexLabelFontColor: "navy",
        indexLabelFontWeight: "bold",
        dataPoints: chartData
      }]
    });
    chart.render();
  }


}

export class headerDetail {
  month: string;
  date: string;
}


