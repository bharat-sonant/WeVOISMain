import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import { ToastrService } from "ngx-toastr"; // Alert message using NGX toastr
import { FirebaseService } from "../../firebase.service";
@Component({
  selector: "app-ward-work-percentage",
  templateUrl: "./ward-work-percentage.component.html",
  styleUrls: ["./ward-work-percentage.component.scss"],
})
export class WardWorkPercentageComponent implements OnInit {
  constructor(private commonService: CommonService, public toastr: ToastrService, public fs: FirebaseService, private mapService: MapService) { }
  workList: any[] = [];
  zoneList: any[] = [];
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;
  db: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    $("#txtDate").val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.getZoneList();
    this.onSubmit();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  onSubmit() {
    if (this.zoneList.length > 0) {
      this.workList = [];
      let monthName = this.commonService.getCurrentMonthName(
        new Date(this.selectedDate).getMonth()
      );
      let year = this.selectedDate.split("-")[0];
      for (let i = 1; i < this.zoneList.length; i++) {
        this.workList.push({
          zoneNo: this.zoneList[i]["zoneNo"],
          zoneName: this.zoneList[i]["zoneName"],
          percentage: "0",
          totalLines: 0,
        });
        let zoneNo = this.zoneList[i]["zoneNo"];
        let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/Summary/workPercentage";
        let workDetail = this.db.object(dbPath).valueChanges().subscribe((data) => {
          workDetail.unsubscribe();
          if (data != null) {
            let workDetails = this.workList.find((item) => item.zoneNo == zoneNo);
            if (workDetails != undefined) {
              workDetails.percentage = data + "%";
            }
          } else {
            let workDetails = this.workList.find((item) => item.zoneNo == zoneNo);
            if (workDetails != undefined) {
              workDetails.percentage = "0%";
            }
          }
        });
        let totalLineData = this.db.object("WardLines/" + zoneNo).valueChanges().subscribe((totalLines) => {
          let zoneDetails = this.workList.find((item) => item.zoneNo == zoneNo);
          if (zoneDetails != undefined) {
            zoneDetails.totalLines = totalLines;
          }
          totalLineData.unsubscribe();
        });
      }
    }
  }

  setWardPercentageAll() {
    if (this.zoneList.length > 0) {
      for (let i = 1; i < this.zoneList.length; i++) {
        this.setWardPercentage(this.zoneList[i]["zoneNo"], "All");
      }
      setTimeout(() => {
        this.showAlert("All Ward");
      }, 2000);
    }
  }

  setWardPercentage(zoneNo: any, type: any) {
    let monthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    let year = this.selectedDate.split("-")[0];
    let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/LineStatus";
    let lineStatus = this.db.list(dbPath).valueChanges().subscribe((lineStatusData) => {
      lineStatus.unsubscribe();
      let completedCount = 0;

      for (let index = 0; index < lineStatusData.length; index++) {
        if (lineStatusData[index]["start-time"] != null) {
          if (lineStatusData[index]["Status"] == "LineCompleted") {
            completedCount++;
          }
        }
      }
      let zoneDetails = this.workList.find((item) => item.zoneNo == zoneNo);
      if (zoneDetails != undefined) {
        let totalLines = zoneDetails.totalLines;
        let workPercentage = (completedCount * 100) / totalLines;
        zoneDetails.percentage = workPercentage.toFixed(0) + "%";
        this.db.object("WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/Summary").update({ workPercentage: workPercentage.toFixed(0), });
        if (type == "single") {
          this.showAlert(zoneDetails.zoneName);
        }
      }
    });
  }

  showAlert(name: any) {
    this.toastr.error("" + name + " Updated Successfully !!!", "", {
      timeOut: 2000,
      enableHtml: true,
      closeButton: true,
      toastClass: "alert alert-info alert-with-icon",
      positionClass: "toast-bottom-right",
    });
  }

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
    this.onSubmit();
  }
  setNextDate() {
    let currentDate = $("#txtDate").val();
    let nextDate = this.commonService.getNextDate(currentDate, 1);
    $("#txtDate").val(nextDate);
    this.selectedDate = nextDate;
    this.onSubmit();
  }
  setPreviousDate() {
    let currentDate = $("#txtDate").val();
    let previousDate = this.commonService.getPreviousDate(currentDate, 1);
    $("#txtDate").val(previousDate);
    this.selectedDate = previousDate;
    this.onSubmit();
  }
}
