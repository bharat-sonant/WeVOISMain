import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { interval } from 'rxjs';
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";
import { MapService } from '../services/map/map.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

  zoneList: any[];
  wards: any[];
  workDone: any[];
  graphData: any[];
  wardCompletedCount: number;
  allZones: any[];
  assignedWards: any[];
  todayDate: any;
  currentMonthName: any;
  currentYear: any;
  instancesList: any[];

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
  cityName:any;

  dashboardData: dashboardSummary =
    {
      wardCompleted: '0',
      peopleAtWork: '0',
      vehiclesOnDuty: '0',
      wasteCollected: '0'
    };

  constructor(public fs: FirebaseService, private mapService: MapService, public httpService: HttpClient, private commonService: CommonService) { }

  ngOnInit() {
    this.instancesList = [];
    this.cityName=localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.todayDate = this.commonService.setTodayDate();//"2019-07-24";
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.todayDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.allZones = this.mapService.getZones(this.todayDate);
    this.getAssignedWardList();
    this.zoneList = this.mapService.getZones(this.todayDate);
    this.wardCompletedCount = 0;
    this.workDone = [];
    this.wards = [];
    this.getCompletedWards();
    this.getActiveVehicles();
    this.drawWorkProgress();
    this.getWardCollection();
    this.getWardWorkProgressData(this.todayDate);
    let drawProgress = interval(60000).subscribe((val) => {
      this.instancesList.push({ instances: drawProgress });
      this.workDone = [];
      this.wards = [];
      this.getWardWorkProgressData(this.todayDate);
    });
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

  getAssignedWardList() {
    let workDetails = this.db.list("DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.todayDate).valueChanges().subscribe(
      data => {
        this.assignedWards = [];
        for (let index = 0; index < data.length; index++) {
          for (let j = 1; j < 10; j++) {
            let taskData = data[index]["task" + j];
            if (taskData == undefined) { break; }
            let task = taskData["task"];
            let zoneData = this.allZones.find(item => item.zoneNo == task);
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

  setWorkNotStartedforWards() {
    for (let index = 1; index < this.allZones.length; index++) {
      let ZoneNo = this.allZones[index]["zoneNo"];
      let isAssigned = this.assignedWards.find(item => item.zoneNo == this.allZones[index]["zoneNo"]);
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
        let driverDetail = this.db.object("WasteCollectionInfo/" + this.allZones[index]["zoneNo"] + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.todayDate + "/WorkerDetails/driver").valueChanges().subscribe(
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
                        if (startData["task" + k + ""]["task"] == this.allZones[index]["zoneNo"]) {
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
                      this.db.object('RealTimeDetails/WardDetails/' + this.allZones[index]["zoneNo"]).update({
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
        this.dashboardData.vehiclesOnDuty = activeVehicleCount.toString();
        this.getpeopleAtWork();
      });
  }

  getCompletedWards() {
    for (let index = 1; index < this.zoneList.length; index++) {
      // check duty status
      let getRealTimeWardDetails = this.db.object("RealTimeDetails/WardDetails/" + this.zoneList[index]["zoneNo"] + "").valueChanges().subscribe(
        data => {
          this.instancesList.push({ instances: getRealTimeWardDetails });

          if (data != null) {
            let status = data["activityStatus"];
            if (status == "completed") {
              this.wardCompletedCount++;
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
        setTimeout(() => {
          this.dashboardData.wardCompleted = this.wardCompletedCount.toString();
        }, 2000);

      });
  }

  getWardWorkProgressData(date: string) {
    this.graphData = [];
    for (let index = 1; index < this.zoneList.length; index++) {
      let dbPath = 'WasteCollectionInfo/' + this.zoneList[index]["zoneNo"] + '/' + this.currentYear + '/' + this.currentMonthName + '/' + date + '/LineStatus'
      let wardLineData = this.db.list(dbPath).valueChanges().subscribe(
        data => {
          let completedCount = 0;
          // get total lines in the ward        
          let wardLines = this.db.object('WardLines/' + this.zoneList[index]["zoneNo"]).valueChanges().subscribe(
            zoneLine => {
              this.instancesList.push({ instances: wardLines });
              let totalLines =Number(zoneLine);
              // total compelted lines
              for (let index = 0; index < data.length; index++) {
                if (data[index]["Status"] == "LineCompleted") {
                  completedCount++;
                }
              }
              let workPercentage = (completedCount / totalLines) * 100;
              this.graphData.push(
                {
                  wardIndex: index,
                  ward: this.zoneList[index]["zoneName"].replace("Ward ", ""),
                  work: Number(workPercentage).toFixed(1)
                });
            });
          wardLineData.unsubscribe();
        });
    }

    let setWardData = interval(500).subscribe((val) => {
      if ((this.zoneList.length - 1) == this.graphData.length) {
        for (let index = 0; index < this.graphData.length; index++) {
          let data = this.graphData.find(item => item.wardIndex == (index + 1));
          if (Number(data["work"]) != 0) {
            this.wards.push(data["ward"]);
            this.workDone.push(data["work"]);
          }
        }
        setWardData.unsubscribe();
        this.drawWorkProgress();
      }
    });
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
  wardCompleted: string;
  peopleAtWork: string;
  vehiclesOnDuty: string;
  wasteCollected: string;
}
