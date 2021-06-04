import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr

@Component({
  selector: 'app-ward-duty-data',
  templateUrl: './ward-duty-data.component.html',
  styleUrls: ['./ward-duty-data.component.scss']
})
export class WardDutyDataComponent implements OnInit {

  constructor(private commonService: CommonService, public toastr: ToastrService, public db: AngularFireDatabase, private mapService: MapService) { }
  workList: any[] = [];
  zoneList: any[] = [];
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;
  driverSalary:any;
  halperSalary:any;
  totalSalary:any;
  ngOnInit() {
    //this.selectedDate = this.commonService.setTodayDate();
   // $('#txtDate').val(this.selectedDate);
    this.selectedDate = "2020-12-24";
    $('#txtDate').val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.getZoneList();
    this.getSalary();
    this.onSubmit();
  }
  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  getSalary() {
    let dbPath = "Settings/Salary";
    let salaryData = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        this.driverSalary = data["driver_salary_per_hour"];
        this.halperSalary = data["helper_salary_per_hour"];
        this.totalSalary = parseFloat(this.driverSalary) + parseFloat(this.halperSalary);
        salaryData.unsubscribe();
      });
  }


  onSubmit() {
    if (this.zoneList.length > 0) {
      this.workList = [];
      let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
      let year = this.selectedDate.split("-")[0];
      for (let i = 1; i < 2; i++) {
        this.workList.push({ zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"], dutyInTime: "---", wardReachedOn: "---", wardReachingCost: "---", wardReachingDuration: "---", driverName: "---" });
        let zoneNo = this.zoneList[i]["zoneNo"];
        let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/Summary";
        let workDetail = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            workDetail.unsubscribe();
            if (data != null) {
              let wardDetails = this.workList.find(item => item.zoneNo == zoneNo);
              if (wardDetails != undefined) {
                //wardDetails.driverName = data["driverName"];
                wardDetails.dutyInTime = data["dutyInTime"];
                wardDetails.wardReachedOn = data["wardReachedOn"];
                wardDetails.wardReachingDuration = data["wardReachingDuration"];
                wardDetails.wardReachingCost = data["wardReachingCost"];
                let workerDetailsPath = 'WasteCollectionInfo/' + zoneNo + '/' + year + '/' + monthName + '/' + this.selectedDate + '/WorkerDetails/driverName';
                let workerDetails = this.db.object(workerDetailsPath).valueChanges().subscribe(
                  workerData => {
                    workerDetails.unsubscribe();
                    if (workerData != null) {
                      let zoneDetails = this.workList.find(item => item.zoneNo == zoneNo);
                      if (zoneDetails != undefined) {
                        zoneDetails.driverName = workerData;
                      }
                    }
                  });
              }
            }
          });
      }
    }
  }

  setWardDutyDataAll() {
    if (this.zoneList.length > 0) {
      for (let i = 1; i < this.zoneList.length; i++) {
        this.setWardDutyData(this.zoneList[i]["zoneNo"], "All");
      }
      setTimeout(() => {
        this.showAlert("All Ward");
      }, 2000);
    }

  }


  setWardDutyData(zoneNo: any, type: any) {
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let workDetailsPath = 'WasteCollectionInfo/' + zoneNo + '/' + year + '/' + monthName + '/' + this.selectedDate;
    let driverId = 0;
    let helperId = 0;
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe(
      workerData => {
        if (workerData != null) {
          if (workerData["WorkerDetails"]["driver"] != null) {
            driverId = workerData["WorkerDetails"]["driver"];
            let lineStatus = workerData["LineStatus"];
            let reachTime = "";
            let isdata = false;
            if (lineStatus != null) {
              if (lineStatus.length > 0) {
                isdata = true;
                for (let p = 1; p < lineStatus.length - 1; p++) {
                  if (lineStatus[p] != null) {
                    if (lineStatus[p]["start-time"] != "undefined" && lineStatus[p]["start-time"] != null) {
                      let sTime = lineStatus[p]["start-time"];
                      lineStatus[p]["position"] = parseFloat(sTime.split(":")[0] + "." + sTime.split(":")[1]);
                    }
                  }
                }
                lineStatus = this.commonService.transform(lineStatus, 'position');
                if (lineStatus[0]["start-time"] != "undefined" && lineStatus[0]["start-time"] != null) {
                  reachTime = lineStatus[0]["start-time"];
                  let removeSecond = reachTime.split(' ');
                  reachTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  reachTime = this.commonService.convert24(reachTime);
                }
              }
            }
            if (isdata == true) {
              let dbPath = 'DailyWorkDetail/' + year+ '/' + monthName + '/' + this.selectedDate + '/' + driverId;
              let monthSalaryInfo = this.db.object(dbPath).valueChanges().subscribe(
                data => {
                  if (data != null) {
                    let startTime = "";
                    for (let i = 0; i < 5; i++) {
                      if (data["task" + i + ""] != null) {
                        if (data["task" + i + ""]["task"] == zoneNo) {
                          if (data["task" + i + ""]["in-out"] != null) {
                            if (startTime == "") {
                              startTime = this.commonService.tConvert(Object.keys(data["task" + i + ""]["in-out"])[0]);
                              let removeSecond = startTime.split(' ');
                              startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                              startTime = this.commonService.convert24(startTime);
                              let date1 = "2020-12-11 " + reachTime;
                              let date2 = "2020-12-11 " + startTime;
                              let duration = this.commonService.timeDifferenceMin(new Date(date1), new Date(date2));
                              let cost = ((Number(duration) / 60) * this.totalSalary).toFixed(2);

                              let driverPath = 'Employees/' + driverId + '/GeneralDetails';
                              let drivers = this.db.object(driverPath).valueChanges().subscribe(
                                driverData => {
                                  if (driverData != null) {
                                    this.db.object('WasteCollectionInfo/' + zoneNo + '/' + year + '/' + monthName + '/' + this.selectedDate + '/Summary').update({
                                      "dutyInTime": startTime,
                                      "wardReachedOn": reachTime,
                                      "wardReachingDuration": duration,
                                      "wardReachingCost": cost
                                    });
                                    this.db.object('WasteCollectionInfo/' + zoneNo + '/' + year + '/' + monthName + '/' + this.selectedDate + '/WorkerDetails').update({
                                      "driverName": driverData["name"]
                                    });
                                    let zoneDetails = this.workList.find(item => item.zoneNo == zoneNo);
                                    if (zoneDetails != undefined) {
                                      zoneDetails.dutyInTime = startTime;
                                      zoneDetails.wardReachedOn=reachTime;
                                      zoneDetails.wardReachingDuration=duration;
                                      zoneDetails.wardReachingCost=cost;
                                      zoneDetails.driverName=driverData["name"];
                                      
                                    }
                                  }
                                  drivers.unsubscribe();
                                });
                              break;
                            }
                          }
                        }
                      }
                    }
                  }
                  monthSalaryInfo.unsubscribe();
                });
            }
          }
        }
        workDetails.unsubscribe();
      });
    
  }

  showAlert(name: any) {
    this.toastr.error("" + name + " Updated Successfully !!!", '', {
      timeOut: 2000,
      enableHtml: true,
      closeButton: true,
      toastClass: "alert alert-info alert-with-icon",
      positionClass: 'toast-bottom-right'
    });
  }

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
    this.onSubmit();

  }
  setNextDate() {
    let currentDate = $('#txtDate').val();
    let nextDate = this.commonService.getNextDate(currentDate, 1);
    $('#txtDate').val(nextDate);
    this.selectedDate = nextDate;
    this.onSubmit();
  }
  setPreviousDate() {
    let currentDate = $('#txtDate').val();
    let previousDate = this.commonService.getPreviousDate(currentDate, 1);
    $('#txtDate').val(previousDate);
    this.selectedDate = previousDate;
    this.onSubmit();
  }

}
