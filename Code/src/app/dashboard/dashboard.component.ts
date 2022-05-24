import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

  zoneList: any[] = [];
  wards: any[] = [];
  workDone: any[] = [];
  graphData: any[] = [];
  assignedWards: any[] = [];
  wardForWeightageList: any[] = [];
  todayDate: any;
  currentMonthName: any;
  currentYear: any;
  instancesList: any[] = [];

  public lineBigDashboardChartType;
  public gradientStroke;
  public chartColor;
  public canvas: any;
  public ctx;
  public gradientFill;
  public lineBigDashboardChartData: Array<any>;
  public lineBigDashboardChartOptions: any;
  public lineBigDashboardChartLabels: Array<any>;
  public lineBigDashboardChartColors: Array<any>;
  db: any;
  cityName: any;

  dashboardData: dashboardSummary =
    {
      wardCompleted: 0,
      peopleAtWork: 0,
      vehiclesOnDuty: 0,
      wasteCollected: 0
    };

  constructor(public fs: FirebaseService, public httpService: HttpClient, private commonService: CommonService) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {    
    this.drawWorkProgress();
    this.getWardForLineWeitage();
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.todayDate = this.commonService.setTodayDate();
    this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.todayDate.toString().split('-')[1]) - 1);
    this.currentYear = new Date().getFullYear();
  }

  getWardForLineWeitage() {
    this.commonService.getWardForLineWeitage().then((wardForWeightageList: any) => {
      this.wardForWeightageList = wardForWeightageList;
      this.getData();
    });
  }

  getData() {
    this.getAssignedWardList();
    this.getCompletedWards();
    this.getActiveVehicles();
    if (localStorage.getItem("userType") == "External User") {
      $('#divWasteCollected').hide();
    }
    else {
      this.getWardCollection();
    }
    this.getWardLines();
  }

  getWardCollection() {
    let collectionInstance = this.db.object("WardTrips/" + this.currentYear + "/" + this.currentMonthName + "/" + this.todayDate + "/totalWasteCollection").valueChanges().subscribe(
      data => {
        this.instancesList.push({ instances: collectionInstance });
        if (data != null) {
          this.dashboardData.wasteCollected = data.toString();
        }
      }
    );
  }

  getActiveVehicles() {
    let vehicleData = this.db.list('Vehicles').valueChanges().subscribe(
      data => {
        this.instancesList.push({ instances: vehicleData });
        let activeVehicleCount = 0;
        for (let index = 0; index < data.length; index++) {
          if (data[index]["status"] == "3") {
            activeVehicleCount++;
          }
        }
        this.dashboardData.vehiclesOnDuty = activeVehicleCount;
        this.getpeopleAtWork();
      });
  }

  getCompletedWards() {
    for (let index = 0; index < this.zoneList.length; index++) {
      let getRealTimeWardDetails = this.db.object("RealTimeDetails/WardDetails/" + this.zoneList[index]["zoneNo"] + "").valueChanges().subscribe(
        data => {
          this.instancesList.push({ instances: getRealTimeWardDetails });
          if (data != null) {
            let status = data["activityStatus"];
            if (status == "completed") {
              this.dashboardData.wardCompleted += 1;
            }
          }
        });
    }
  }

  getpeopleAtWork() {
    let peopleAtWork = this.db.object('RealTimeDetails/peopleOnWork').valueChanges().subscribe(
      data => {
        this.instancesList.push({ instances: peopleAtWork });
        this.dashboardData.peopleAtWork = data.toString();
      });
  }

  getAssignedWardList() {
    let workDetails = this.db.list("DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.todayDate).valueChanges().subscribe(
      data => {
        this.assignedWards = [];
        for (let index = 0; index < data.length; index++) {
          for (let j = 1; j < 10; j++) {
            let taskData = data[index]["task" + j];
            if (taskData == undefined) { break; }
            let task = taskData["task"];
            let zoneData = this.zoneList.find(item => item.zoneNo == task);
            if (zoneData != undefined) {
              let zoneDetails = this.assignedWards.find(item => item.zoneNo == task);
              if (zoneDetails == undefined) {
                this.assignedWards.push({ zoneNo: zoneData["zoneNo"], zoneName: zoneData["zoneName"] });
              }
            }
          }
        }
        this.setWorkNotStartedforWards();
        workDetails.unsubscribe();
      });
  }

  getWardProgress() {
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {

      }

    }
  }

  getWardLines() {
    this.graphData = [];
    if (this.zoneList.length > 0) {
      for (let i = 1; i < this.zoneList.length; i++) {
        let zoneNo = this.zoneList[i]["zoneNo"];
        let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
        if (zoneDetail != undefined) {
          zoneDetail.index = i;
          let wardDetail = this.wardForWeightageList.find(item => item.zoneNo == zoneNo);
          if (wardDetail != undefined) {
            this.commonService.getWardLineWeightage(zoneNo, this.todayDate).then((lineWeightageList: any) => {
              zoneDetail.totalLines = Number(lineWeightageList[lineWeightageList.length - 1]["totalLines"]);
              zoneDetail.lineWeightageList = lineWeightageList;
              this.getWardWorkProgressData(zoneDetail);
            });
          }
          else {
            this.commonService.getWardLine(zoneNo, this.todayDate).then((lineData: any) => {
              let wardLines = JSON.parse(lineData);
              zoneDetail.totalLines = Number(wardLines["totalLines"]);
              zoneDetail.lineWeightageList=[];
              this.getWardWorkProgressData(zoneDetail);
            });
          }
        }
      }
      setTimeout(() => {
        let setWardData = interval(500).subscribe((val) => {
          this.instancesList.push({ instances: setWardData });
          this.getGraphData();
        });
      }, 6000);
    }
  }

  getWardWorkProgressData(zoneDetail: any) {
    let dbPath = 'WasteCollectionInfo/' + zoneDetail.zoneNo + '/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/LineStatus';
    let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
      lineStatusData => {
        let completedCount = 0;
        this.instancesList.push({ instances: lineStatusInstance });
      
        if (lineStatusData != null) {
          let keyArray = Object.keys(lineStatusData);
          if (keyArray.length > 0) {
            let percentage = 0;
            let skippedLines = 0;
            let skippedPercentage = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              if (lineStatusData[lineNo]["Status"] == "LineCompleted") {
                completedCount++;
                let lineWeight = 1;
                let lineWeightDetail = zoneDetail.lineWeightageList.find(item => item.lineNo == lineNo);
                if (lineWeightDetail != undefined) {
                  lineWeight = Number(lineWeightDetail.weightage);
                  percentage += (100 / Number(zoneDetail.totalLines)) * lineWeight;
                }
              }
            }

            if (zoneDetail.lineWeightageList.length > 0) {
              if (skippedLines > 0) {
                skippedPercentage = 100 - ((skippedLines / Number(zoneDetail.totalLines)) * 100);
                if (percentage > skippedPercentage) {
                  percentage = skippedPercentage;
                }
              }
              if (percentage > 100) {
                percentage = 100;
              }
            }
            else {
              percentage = (completedCount / zoneDetail.totalLines) * 100;
            }
            let graphDataDetail = this.graphData.find(item => item.ward == zoneDetail.zoneNo);
            if (graphDataDetail != undefined) {
              graphDataDetail.work = Number(percentage).toFixed(1);
            }
            else {
              this.graphData.push({ index: zoneDetail.index, ward: zoneDetail.zoneName.replace("Zone ", ""), work: Number(percentage).toFixed(1) });
              this.graphData = this.commonService.transformNumeric(this.graphData, "ward");
            }
          }
        }
      }
    );
  }

  getGraphData() {
    let index = 0;
    this.graphData = this.graphData.sort((a, b) => Number(b.index) < Number(a.index) ? 1 : -1);
    for (let i = 0; i < this.graphData.length; i++) {
      if (this.wards.length == 0) {
        this.wards.push(this.graphData[i]["ward"]);
        this.workDone.push(this.graphData[i]["work"]);
      }
      else {
        let isWard = false;
        for (let j = 0; j < this.wards.length; j++) {
          if (this.wards[j] == this.graphData[i]["ward"]) {
            isWard = true;
            index = j;
            j = this.wards.length;
          }
        }
        if (isWard == false) {
          this.wards.push(this.graphData[i]["ward"]);
          this.workDone.push(this.graphData[i]["work"]);
        }
        else {
          this.workDone[index] = this.graphData[i]["work"];
        }
      }
    }
    this.drawWorkProgress();
  }

  setWorkNotStartedforWards() {
    for (let index = 1; index < this.zoneList.length; index++) {
      let ZoneNo = this.zoneList[index]["zoneNo"];
      let isAssigned = this.assignedWards.find(item => item.zoneNo == this.zoneList[index]["zoneNo"]);
      if (isAssigned == undefined) {
        let setWardStatus = this.db.object("RealTimeDetails/WardDetails/" + ZoneNo).valueChanges().subscribe(
          data => {
            setWardStatus.unsubscribe();
            this.db.object('RealTimeDetails/WardDetails/' + ZoneNo).set({
              activityStatus: 'workNotStarted',
              isOnDuty: 'no'
            });

          });
      }
      else {
        let driverDetail = this.db.object("WasteCollectionInfo/" + this.zoneList[index]["zoneNo"] + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.todayDate + "/WorkerDetails/driver").valueChanges().subscribe(
          driverdata => {
            if (driverdata != null) {
              let driverId = driverdata;
              let workStartTimePath = 'DailyWorkDetail/' + this.currentYear + '/' + this.currentMonthName + '/' + this.todayDate + '/' + driverId;
              let workStarts = this.db.object(workStartTimePath).valueChanges().subscribe(
                startData => {
                  workStarts.unsubscribe();
                  if (startData != null) {
                    let endTime = "";
                    for (let k = 10; k > 0; k--) {
                      if (startData["task" + k + ""] != null) {
                        if (startData["task" + k + ""]["task"] == this.zoneList[index]["zoneNo"]) {
                          if (Object.keys(startData["task" + k + ""]["in-out"])[1] != null) {
                            endTime = this.commonService.tConvert(Object.keys(startData["task" + k + ""]["in-out"])[1]);
                            let removeSecond = endTime.split(' ');
                            endTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                          }
                          break;
                        }
                      }
                    }
                    if (endTime != "") {
                      this.db.object('RealTimeDetails/WardDetails/' + this.zoneList[index]["zoneNo"]).update({
                        activityStatus: 'completed',
                        isOnDuty: 'no'
                      });
                    }
                  }
                });
            }
            driverDetail.unsubscribe();
          });
      }
    }
  }


  drawWorkProgress() {
    this.chartColor = "#FFFFFF";
    this.canvas = document.getElementById("bigDashboardChart");
    if (this.canvas == null) { return false; }
    this.ctx = this.canvas.getContext("2d");

    this.gradientStroke = this.ctx.createLinearGradient(500, 0, 100, 0);
    this.gradientStroke.addColorStop(0, '#80b6f4');
    this.gradientStroke.addColorStop(1, this.chartColor);

    this.gradientFill = this.ctx.createLinearGradient(0, 200, 0, 50);
    this.gradientFill.addColorStop(0, "rgba(128, 182, 244, 0)");
    this.gradientFill.addColorStop(1, "rgba(255, 255, 255, 0.24)");

    this.lineBigDashboardChartData = [
      {
        //label: "Work(%)",
        pointBorderWidth: 1,
        pointHoverRadius: 7,
        pointHoverBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        borderWidth: 2,
        data: this.workDone
      }
    ];

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

    this.lineBigDashboardChartLabels = this.wards;
    this.lineBigDashboardChartOptions = {
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 0,
          bottom: 30
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
        position: "nearest"
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
            maxTicksLimit: 20,
            padding: 10,
            stepSize: 25
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
            display: false,

          },
          ticks: {
            padding: 10,
            fontColor: "rgba(255,255,255,0.4)",
            fontStyle: "bold"
          }
        }]
      }
    };
    this.lineBigDashboardChartType = 'line';
  }

  ngOnDestroy() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
      }
    }
  }
}

export class dashboardSummary {
  wardCompleted: number;
  peopleAtWork: number;
  vehiclesOnDuty: number;
  wasteCollected: number;
}
