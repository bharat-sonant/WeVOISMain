import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-ward-work-percentage',
  templateUrl: './ward-work-percentage.component.html',
  styleUrls: ['./ward-work-percentage.component.scss']
})
export class WardWorkPercentageComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService) { }

  db: any;
  cityName: any;
  selectedDate: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedZone: any;
  zoneList: any[] = [];
  expectedPercentage: any;
  lblMsg = "#lblMsg";
  serviceName = "portal-service-work-percentage";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", "Work-Percentage", localStorage.getItem("userID"));
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
    $(this.lblMsg).html("");
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
    if (Number(this.expectedPercentage) > 100) {
      $("#txtPercentage").val("100");
      this.expectedPercentage = 100;
    }
    this.selectedDate = $("#txtDate").val();
    this.selectedZone = $("#ddlZone").val();
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
    this.getWardLines();
  }

  getWardLines() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardLines");
    $("#divLoader").show();
    let wardLines = [];
    this.commonService.getWardLine(this.selectedZone, this.selectedDate).then((linesData: any) => {
      let wardLinesDataObj = JSON.parse(linesData);
      let wardTotalLines = wardLinesDataObj["totalLines"];
      let keyArray = Object.keys(wardLinesDataObj);
      for (let i = 0; i < keyArray.length; i++) {
        let lineNo = keyArray[i];
        if (parseInt(lineNo)) {
          let lineLength = 0;
          if (wardLinesDataObj[lineNo]["lineLength"] != null) {
            lineLength = wardLinesDataObj[lineNo]["lineLength"];
          }
          let points = wardLinesDataObj[lineNo]["points"];
          wardLines.push({ lineNo: lineNo, lineLength: lineLength, points: points });
        }
      }
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/dutyInTime";
      let dutyOnInstance = this.db.object(dbPath).valueChanges().subscribe(
        dutyOnData => {
          dutyOnInstance.unsubscribe();
          if (dutyOnData != undefined) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardLines", dutyOnData);
            let dutyInTime = dutyOnData;
            let completedLines = 0;
            let skippedLines = 0;
            let skipLineList = [];
            dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus";
            let lineStatusIndtance = this.db.object(dbPath).valueChanges().subscribe(
              lineStatusData => {
                lineStatusIndtance.unsubscribe();
                let lineStatusList = [];
                if (lineStatusData != null) {
                  this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardLines", lineStatusData);
                  let keyArray = Object.keys(lineStatusData);
                  for (let i = 0; i < keyArray.length; i++) {
                    let lineNo = keyArray[i];
                    let status = lineStatusData[lineNo]["Status"];
                    if (lineStatusData[lineNo]["start-time"] == null) {
                      let removeDbPath = dbPath + "/" + lineNo;
                      this.db.object(removeDbPath).remove();
                    }
                    else {
                      let startTime = lineStatusData[lineNo]["start-time"];
                      let endTime = null;
                      if (lineStatusData[lineNo]["end-time"] != null) {
                        endTime = lineStatusData[lineNo]["end-time"];
                      }
                      if (lineStatusData[lineNo]["Status"] == "LineCompleted") {
                        if (lineStatusData[lineNo]["reason"] == "-NA-") {
                          completedLines++;
                        }
                        else {
                          skippedLines++;
                          this.db.object(dbPath + "/" + lineNo).update({ Status: "Skipped" });
                          status = "Skipped";
                          skipLineList.push({ lineNo: lineNo, distance: lineStatusData[lineNo]["line-distance"] });
                        }
                      }
                      else {
                        skippedLines++;
                        skipLineList.push({ lineNo: lineNo, distance: lineStatusData[lineNo]["line-distance"] });
                      }
                      lineStatusList.push({ lineNo: lineNo, startTime: startTime, endTime: endTime, status: status });
                    }
                  }
                }
                let expectedLines = (Number(wardTotalLines) * Number(this.expectedPercentage)) / 100;
                let aa = Number(expectedLines.toString().split('.')[0]);
                if (expectedLines > aa) {
                  expectedLines = aa + 1;
                }
                if (expectedLines > wardTotalLines) {
                  expectedLines = wardTotalLines;
                }
                let updateLines = expectedLines - (completedLines + skippedLines);
                this.updateLineStatus(dutyInTime, wardTotalLines, updateLines, wardLines, lineStatusList, skipLineList);
              }
            );
          }
          else {
            $("#divLoader").hide();
            let msg = "We can not modify the work % due to no duty on this " + this.selectedDate + ", Please contact to admin for further process."
            $(this.lblMsg).html(msg);
          }
        });
    });
  }

  updateLineStatus(dutyInTime: any, wardTotalLines: any, expectedLine: any, wardLines: any, lineStatusList: any, skipLineList: any) {
    let count = 1;
    let isNewLine = 0;
    for (let i = 1; i <= wardTotalLines; i++) {
      if (count <= expectedLine) {
        let detail = lineStatusList.find(item => item.lineNo == i);
        if (detail == undefined) {
          let lineLength = "0";
          let lineDetail = wardLines.find(item => item.lineNo == i);
          if (lineDetail != undefined) {
            lineLength = lineDetail.lineLength;
          }
          let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + i;
          this.db.object(dbPath).update({ Status: "LineCompleted", "line-distance": lineLength.toString() });
          count++;
          isNewLine = 1;
        }
      }
    }
    if (isNewLine == 1) {
      for (let i = 0; i < skipLineList.length; i++) {
        let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + skipLineList[i]["lineNo"];
        this.db.object(dbPath).update({ Status: "LineCompleted", "line-distance": skipLineList[i]["distance"] });
      }
      setTimeout(() => {
        this.updateSummary(wardLines, wardTotalLines, dutyInTime, lineStatusList, expectedLine);
      }, 3000);
    }
    else if (skipLineList.length > 0) {
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/workPercentage";
      let currentWorkPercentageInstance = this.db.object(dbPath).valueChanges().subscribe(currentWorkPercentageData => {
        currentWorkPercentageInstance.unsubscribe();
        let currentWorkPercentage = Number(currentWorkPercentageData);
        let linesForOnePercentage = Number((wardTotalLines / 100));
        let differencePercentage = Number(this.expectedPercentage) - currentWorkPercentage;
        let linesToBeAdded = Number((linesForOnePercentage * differencePercentage).toFixed(0));
        if (linesToBeAdded > 0) {
          for (let i = 0; i < linesToBeAdded; i++) {
            if (i < skipLineList.length) {
              let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + skipLineList[i]["lineNo"];
              this.db.object(dbPath).update({ Status: "LineCompleted", "line-distance": skipLineList[i]["distance"] });
            }
          }
        }
        setTimeout(() => {
          this.updateSummary(wardLines, wardTotalLines, dutyInTime, lineStatusList, expectedLine);
        }, 3000);
      });
    }
  }

  updateSummary(wardLines: any, wardTotalLines: any, dutyInTime: any, lineStatusList: any, expectedLine: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateSummary");
    let coveredLength = 0;
    let completedLines = 0;
    let skippedLines = 0;
    let percentage = "0";
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus";
    let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
      lineStatusData => {
        lineStatusInstance.unsubscribe();
        if (lineStatusData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateSummary", lineStatusData);
          let keyArray = Object.keys(lineStatusData);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            if (lineStatusData[lineNo]["Status"] == "LineCompleted") {
              completedLines++;
              let lineDetail = wardLines.find(item => item.lineNo == i);
              if (lineDetail != undefined) {
                coveredLength = coveredLength + lineDetail.lineLength;
              }
            }
            else if (lineStatusData[lineNo]["Status"] != "LineCompleted") {
              skippedLines++;
            }
          }
          percentage = ((completedLines / Number(wardTotalLines)) * 100).toFixed(2);
          let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/";
          this.db.object(dbPath).update({ completedLines: completedLines, skippedLines: skippedLines, wardCoveredDistance: coveredLength, updatedWorkPercentage: percentage });
        }
        this.updateLocationHistory(dutyInTime, lineStatusList, expectedLine, wardLines, skippedLines, percentage);
      });
  }

  updateLocationHistory(dutyInTime: any, lineStatusList: any, expectedLine: any, wardLines: any, skippedLines: any, percentage: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateLocationHistory");
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
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateLocationHistory", totalDistanceCovered);
            coveredLength += Number(totalDistanceCovered);
          }
          let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
          this.db.object(dbPath).update({ TotalCoveredDistance: coveredLength });
          $("#divLoader").hide();
          this.commonService.setAlertMessage("success", "Ward work percentage updated !!!");
          /*
                    if (skippedLines > 0) {
                      let msg = "We can not modify the work % upto " + this.expectedPercentage + "% due to " + skippedLines + " skipped line, Now modified % is : " + percentage + " %, Please contact to admin for further process."
                      $(this.lblMsg).html(msg);
                    }
          */
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
      this.updateCalculatedDistance();
      /*
            if (skippedLines > 0) {
              let msg = "We can not modify the work % upto " + this.expectedPercentage + "% due to " + skippedLines + " skipped line, Now modified % is : " + percentage + " %, Please contact to admin for further process."
              $(this.lblMsg).html(msg);
            }
      */
    }
  }

  updateCalculatedDistance() {
    let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let locationInstance = this.db.object(dbPath).valueChanges().subscribe(
      locationData => {
        locationInstance.unsubscribe();
        let distance = "0";
        if (locationData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getTotalRunning", locationData);
          let keyArray = Object.keys(locationData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let time = keyArray[i];
              if (locationData[time]["distance-in-meter"] != null) {
                let coveredDistance = locationData[time]["distance-in-meter"];
                distance = (Number(distance) + Number(coveredDistance)).toFixed(0);
              }
            }
          }
          this.db.object(dbPath).update({ calculatedDistance: (Number(distance) / 1000).toFixed(3) });
        }
      });
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
