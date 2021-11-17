import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import { ToastrService } from "ngx-toastr"; // Alert message using NGX toastr
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-portal-services",
  templateUrl: "./portal-services.component.html",
  styleUrls: ["./portal-services.component.scss"],
})
export class PortalServicesComponent implements OnInit {
  constructor(public fs: FirebaseService, private router: Router, public toastr: ToastrService, private commonService: CommonService, private mapService: MapService) { }
  toDayDate: any;
  yearList: any[] = [];
  zoneList: any[];
  driverSalary: any;
  halperSalary: any;
  totalSalary: any;
  userId: any;
  cityName: any;
  db: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.userId = localStorage.getItem("userID");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getUserAccess();
  }

  getUserAccess() {
    let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
    if (userAccessList != null) {
      for (let i = 0; i < userAccessList.length; i++) {
        if (userAccessList[i]["pageId"] == "8A" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divLineCard").show();
        }
        if (userAccessList[i]["pageId"] == "8B" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divWorkPercentage").show();
        }
        if (userAccessList[i]["pageId"] == "8C" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divReachCost").show();
        }
        if (userAccessList[i]["pageId"] == "8D" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divTaskMasters").show();
        }
        if (userAccessList[i]["pageId"] == "8E" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divMapReview").show();
        }
        if (userAccessList[i]["pageId"] == "8F" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divLineMarker").show();
        }

        if (userAccessList[i]["pageId"] == "8G" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divVTSRoute").show();
        }
        if (userAccessList[i]["pageId"] == "8H" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divCreateRouteOld").show();
        }
        if (userAccessList[i]["pageId"] == "8I" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divCreateLinePath").show();
        }
        if (userAccessList[i]["pageId"] == "8J" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divCreateRoute").show();
        }
      }
      this.getSalary();
      this.getYear();
      this.getZoneList();
    }
  }

  getSalary() {
    let dbPath = "Settings/Salary";
    let salaryData = this.db.object(dbPath).valueChanges().subscribe((data) => {
      this.driverSalary = data["driver_salary_per_hour"];
      this.halperSalary = data["helper_salary_per_hour"];
      this.totalSalary = parseFloat(this.driverSalary) + parseFloat(this.halperSalary);
      salaryData.unsubscribe();
    });
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
    this.zoneList[0]["zoneName"] = "All Ward";
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split("-")[0]);
    for (let i = year - 10; i <= year; i++) {
      if (i >= 2019) {
        this.yearList.push({ year: i });
      }
    }
  }

  setWardDutyDataAll() {
    let month = $("#ddlMonth").val();
    let year = $("#ddlYear").val();
    let ward = $("#ddlZone").val();
    if (month == "0") {
      this.toastr.error("Please Select Month !!!", "", {
        timeOut: 2000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-danger alert-with-icon",
        positionClass: "toast-bottom-right",
      });
      return;
    }
    if (year == "0") {
      this.toastr.error("Please Select Year !!!", "", {
        timeOut: 2000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-danger alert-with-icon",
        positionClass: "toast-bottom-right",
      });
      return;
    }
    if (ward == "0") {
      for (let i = 1; i < this.zoneList.length; i++) {
        this.setWardDutyData(this.zoneList[i]["zoneNo"], year, month);
      }
      setTimeout(() => {
        this.showAlert();
      }, 6000);
    } else {
      this.setWardDutyData(ward, year, month);
      setTimeout(() => {
        this.showAlert();
      }, 1000);
    }
  }

  setWardDutyData(zoneNo: any, year: any, month: any) {
    let days = new Date(Number(year), Number(month), 0).getDate();
    let rowTo = days;
    if (month == this.commonService.setTodayDate().split("-")[1]) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }

    for (let j = 1; j <= rowTo; j++) {
      let monthDate = year + "-" + month + "-" + (j < 10 ? "0" : "") + j;
      let monthName = this.commonService.getCurrentMonthName(
        parseInt(monthDate.split("-")[1]) - 1
      );
      let workDetailsPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/WorkerDetails/driver";
      let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe((workerData) => {
        workDetails.unsubscribe();
        if (workerData != null) {
          let driverId = workerData;
          this.commonService.getEmplyeeDetailByEmployeeId(driverId).then((employee) => {
            this.db.object("WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/WorkerDetails").update({ driverName: employee["name"], });
          });
          

          let dbPath = "DailyWorkDetail/" + year + "/" + monthName + "/" + monthDate + "/" + driverId;
          let monthSalaryInfo = this.db.object(dbPath).valueChanges().subscribe((data) => {
            if (data != null) {
              monthSalaryInfo.unsubscribe();
              let startTime = "";
              for (let i = 0; i < 5; i++) {
                if (data["task" + i + ""] != null) {
                  if (data["task" + i + ""]["task"] == zoneNo) {
                    if (data["task" + i + ""]["in-out"] != null) {
                      if (startTime == "") {
                        startTime = this.commonService.tConvert(
                          Object.keys(data["task" + i + ""]["in-out"])[0]
                        );
                        let removeSecond = startTime.split(" ");
                        startTime =
                          removeSecond[0].slice(0, -3) +
                          " " +
                          removeSecond[1];
                        startTime = this.commonService.convert24(startTime);
                      }
                    }
                  }
                }
              }
              if (startTime != "") {

                let dbPathLine = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/LineStatus";
                let LineInfo = this.db.list(dbPathLine).valueChanges().subscribe((lineData) => {
                  LineInfo.unsubscribe();
                  if (lineData != null) {
                    let lineStatus = lineData;
                    if (lineStatus.length > 0) {
                      let reachTime = "";
                      let timeLineStatus = [];
                      for (let p = 1; p < lineStatus.length - 1; p++) {
                        if (lineStatus[p] != null) {
                          if (lineStatus[p]["start-time"] != "undefined" && lineStatus[p]["start-time"] != null) {
                            let sTime = lineStatus[p]["start-time"];
                            timeLineStatus.push({ startTime: lineStatus[p]["start-time"], position: parseFloat(sTime.split(":")[0] + "." + sTime.split(":")[1]), });
                          }
                        }
                      }
                      timeLineStatus = this.commonService.transform(timeLineStatus, "position");
                      if (timeLineStatus[0]["startTime"] != "undefined" && timeLineStatus[0]["startTime"] != null) {
                        reachTime = timeLineStatus[0]["startTime"];
                        let removeSecond = reachTime.split(" ");
                        reachTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                        reachTime = this.commonService.convert24(reachTime);
                      }
                      if (reachTime != "") {
                        let date1 = "2020-12-11 " + reachTime;
                        let date2 = "2020-12-11 " + startTime;
                        let duration = this.commonService.timeDifferenceMin(new Date(date1), new Date(date2));
                        let cost = ((Number(duration) / 60) * this.totalSalary).toFixed(2);
                        this.db.object("WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + monthDate + "/Summary").update({ wardReachedOn: reachTime, wardReachingDuration: duration, wardReachingCost: cost, });
                      }
                    }
                  }
                });
              }
            }
          });
        }
      });
    }
  }

  showAlert() {
    this.toastr.error("Updated Successfully !!!", "", {
      timeOut: 2000,
      enableHtml: true,
      closeButton: true,
      toastClass: "alert alert-info alert-with-icon",
      positionClass: "toast-bottom-right",
    });
  }

  goToPage(url: any) {
    url = localStorage.getItem("cityName") + url;
    this.router.navigate([url]);
  }
}
