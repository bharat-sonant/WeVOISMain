import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-ward-work-percentage',
  templateUrl: './ward-work-percentage.component.html',
  styleUrls: ['./ward-work-percentage.component.scss']
})
export class WardWorkPercentageComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }

  db: any;
  cityName: any;
  selectedDate: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedZone: any;
  zoneList: any[] = [];
  expectedPercentage: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.expectedPercentage = 0;
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  saveData() {
    if ($("#txtDate").val() == "") {
      this.commonService.setAlertMessage("error", "Please enter date !!!");
      return;
    }
    if ($("#ddlZone").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if ($("#txtPercentage").val() == "") {
      this.commonService.setAlertMessage("error", "Please enter expected percentage !!!");
      return;
    }
    this.expectedPercentage = $("#txtPercentage").val();
    this.selectedDate = $("#txtDate").val();
    this.selectedZone = $("#ddlZone").val();
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
    this.getWardLines();
  }

  getWardLines() {
    $("#divLoader").show();
    let wardLines = [];
    this.commonService.getWardLine(this.selectedZone, this.selectedDate).then((linesData: any) => {
      let wardLinesDataObj = JSON.parse(linesData);
      let wardTotalLines = wardLinesDataObj["totalLines"];
      let keyArray = Object.keys(wardLinesDataObj);
      for (let i = 0; i < keyArray.length - 3; i++) {
        let lineNo = keyArray[i];
        let lineLength = 0;
        if (wardLinesDataObj[lineNo]["lineLength"] != null) {
          lineLength = wardLinesDataObj[lineNo]["lineLength"];
        }
        let points = wardLinesDataObj[lineNo]["points"];
        wardLines.push({ lineNo: lineNo, lineLength: lineLength, points: points });
      }

      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/dutyInTime";
      let dutyOnInstance = this.db.object(dbPath).valueChanges().subscribe(
        dutyOnData => {
          dutyOnInstance.unsubscribe();
          if (dutyOnData != undefined) {
            let dutyInTime = dutyOnData;
            dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary";
            let workInstance = this.db.object(dbPath).valueChanges().subscribe(
              workData => {
                workInstance.unsubscribe();
                let workPercentageData = workData["workPercentage"];
                if (workData["updatedWorkPercentage"] != null) {
                  workPercentageData = workData["updatedWorkPercentage"];
                }
                let expectedLine = Number(((this.expectedPercentage / 100) * wardTotalLines).toFixed(0));
                let workPercentage = this.expectedPercentage;
                if (workPercentageData != null) {
                  if (Number(workPercentageData) >= this.expectedPercentage) {
                    this.commonService.setAlertMessage("error", "Already expected percentage updated !!!");
                    $("#divLoader").hide();
                    return;
                  }
                  workPercentage = this.expectedPercentage - Number(workPercentageData);
                }

                expectedLine = Number(((workPercentage / 100) * wardTotalLines).toFixed(0));
                if (expectedLine > 0) {
                  dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus";
                  let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
                    lineStatusData => {
                      lineStatusInstance.unsubscribe();
                      let lineStatusList = [];
                      if (lineStatusData != null) {
                        let keyArray = Object.keys(lineStatusData);
                        for (let i = 0; i < keyArray.length; i++) {
                          let lineNo = keyArray[i];
                          let startTime = lineStatusData[lineNo]["start-time"];
                          let endTime = null;
                          if (lineStatusData[lineNo]["end-time"] != null) {
                            endTime = lineStatusData[lineNo]["end-time"];
                          }
                          lineStatusList.push({ lineNo: lineNo, startTime: startTime, endTime: endTime });
                        }
                      }
                      this.updateWorkPercentage(dutyInTime, wardTotalLines, expectedLine, wardLines, lineStatusList);
                    }
                  );
                }
                else {
                  dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/";
                  this.db.object(dbPath).update({ workPercentage: this.expectedPercentage });
                  $("#divLoader").hide();
                  this.commonService.setAlertMessage("success", "Ward work percentage updated !!!")
                }
              }
            );
          }
          else {
            this.commonService.setAlertMessage("error", "Sorry, no work assign for this zone on selected date !!!");
            $("#divLoader").hide();
          }
        }
      );
    });
  }

  updateWorkPercentage(dutyInTime: any, wardTotalLines: any, expectedLine: any, wardLines: any, lineStatusList: any) {
    let coveredLength = 0;
    let count = 1;
    let completedLines = 0;
    for (let i = 1; i <= wardTotalLines; i++) {
      if (count <= expectedLine) {
        let detail = lineStatusList.find(item => item.lineNo == i);
        if (detail == undefined) {
          let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + i;
          this.db.object(dbPath).update({ Status: "LineCompleted" });
        }
        else {
          expectedLine++;
        }
        let lineDetail = wardLines.find(item => item.lineNo == i);
        if (lineDetail != undefined) {
          coveredLength = coveredLength + lineDetail.lineLength;
          completedLines++;
        }
        if (count == expectedLine) {
          let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/";
          this.db.object(dbPath).update({ completedLines: completedLines, wardCoveredDistance: coveredLength, updatedWorkPercentage: this.expectedPercentage });
          i = wardTotalLines + 1;
          this.updateLocationHistory(dutyInTime, lineStatusList, expectedLine, wardLines);
        }
        count++;
      }
    }
  }

  updateLocationHistory(dutyInTime: any, lineStatusList: any, expectedLine: any, wardLines: any) {
    let coveredLength = 0;
    let lastUpdatedTime = dutyInTime;
    if (lineStatusList.length > 0) {
      for (let i = 1; i <= expectedLine; i++) {
        let detail = lineStatusList.find(item => item.lineNo == i);
        if (detail == undefined) {
          dutyInTime = dutyInTime.split('-')[0] + "-" + i;
          let lineDetail = wardLines.find(item => item.lineNo == i);
          if (lineDetail != undefined) {
            coveredLength = coveredLength + lineDetail.lineLength;
            let latLng = this.getLatLng(lineDetail.points);
            const data = {
              "distance-in-meter": lineDetail.lineLength,
              "lat-lng": latLng
            }
            let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + dutyInTime;
            this.db.object(dbPath).update(data);
          }
        }
        else {
          if (detail.endTime != null) {
            dutyInTime = detail.endTime.split(':')[0] + ":" + detail.endTime.split(':')[1];
          }
        }
      }
      let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/TotalCoveredDistance";
      let totalDistanceCoveredInstance = this.db.object(dbPath).valueChanges().subscribe(
        totalDistanceCovered => {
          totalDistanceCoveredInstance.unsubscribe();
          if (totalDistanceCovered != null) {
            coveredLength += Number(totalDistanceCovered);
          }
          let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
          this.db.object(dbPath).update({ TotalCoveredDistance: coveredLength });
          $("#divLoader").hide();
          this.commonService.setAlertMessage("success", "Ward work percentage updated !!!");
        }
      );
    }
    else {
      for (let i = 1; i <= expectedLine; i++) {
        dutyInTime = this.getTimeFormat(dutyInTime.split('-')[0], 1);
        lastUpdatedTime = dutyInTime;
        let lineDetail = wardLines.find(item => item.lineNo == i);
        if (lineDetail != undefined) {
          coveredLength = coveredLength + lineDetail.lineLength;
          let latLng = this.getLatLng(lineDetail.points);
          const data = {
            "distance-in-meter": lineDetail.lineLength,
            "lat-lng": latLng
          }
          let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + dutyInTime;
          this.db.object(dbPath).update(data);
        }
      }
      let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      this.db.object(dbPath).update({ TotalCoveredDistance: coveredLength, 'last-update-time': lastUpdatedTime });
      $("#divLoader").hide();
      this.commonService.setAlertMessage("success", "Ward work percentage updated !!!");
    }
  }

  getLatLng(points: any) {
    let latLng = "";
    for (let i = 0; i < points.length; i++) {
      if (i == 0) {
        latLng = "(" + points[i][0] + "," + points[i][1] + ")";
      }
      else {
        latLng = latLng + "~(" + points[i][0] + "," + points[i][1] + ")";
      }
    }
    return latLng;
  }

  getTimeFormat(time: any, min: any) {
    let oldDate = new Date(this.commonService.setTodayDate() + " " + time);
    let newDate = new Date(oldDate.getTime() + min * 60000);
    return (newDate.getHours() < 10 ? "0" : "") + newDate.getHours() + ":" + (newDate.getMinutes() < 10 ? "0" : "") + newDate.getMinutes()
  }
}
