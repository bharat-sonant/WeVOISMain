import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-ward-work-percentage',
  templateUrl: './ward-work-percentage.component.html',
  styleUrls: ['./ward-work-percentage.component.scss']
})
export class WardWorkPercentageComponent implements OnInit {

  constructor(public fs: FirebaseService, public httpService: HttpClient, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService) { }

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

  private historyKey: string = "";
  private historySnapshot: any = {};
  private rawEnteredPercentage: any = "";
  private newlyCompletedLineNosLocal: any[] = [];
  private skippedConvertedToCompletedLocal: any[] = [];
  private locationHistoryEntriesAdded: number = 0;
  private isSaveInProgress: boolean = false;
  private preFetchedOldSummary: any = null;
  private saveSafetyTimer: any = null;

  historyDisplayList: any[] = [];
  isLoadingHistory: boolean = false;
  historyLoaded: boolean = false;
  currentHistoryZone: string = "";
  private historyLoadToken: number = 0;
  selectedZoneValue: string = "0";

  onZoneChange(event: any) {
    this.selectedZoneValue = event && event.target ? event.target.value : "0";
  }

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
    if (this.cityName == "jodhpur") {
      this.getJodhpurWards();
    }
    else {
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    }
  }

  getJodhpurWards() {


    this.zoneList.push({ zoneNo: "0", zoneName: "-- Select --" });

    let path = this.commonService.fireStoragePath + "Jodhpur%2FDefaults%2FAvailableWardJodhpur.json?alt=media";
    let availableWardInstance = this.httpService.get(path).subscribe(data => {
      availableWardInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));

      if (list.length > 0) {
        for (let index = 0; index < list.length; index++) {
          if (list[index] != null) {
            if (!list[index].toString().includes("Test") && list[index] != "OfficeWork" && list[index] != "FixedWages" && list[index] != "BinLifting" && list[index] != "GarageWork" && list[index] != "Compactor" && list[index] != "SegregationWork" && list[index] != "GeelaKachra" && list[index] != "SecondHelper" && list[index] != "ThirdHelper") {
              if (list[index].toString().includes("mkt")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Market " + list[index].toString().replace("mkt", ""), });
              } else if (list[index].toString().includes("MarketRoute1")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Market 1" });
              } else if (list[index].toString().includes("MarketRoute2")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Market 2" });
              } else if (list[index].toString() == "WetWaste") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 1" });
              } else if (list[index].toString() == "WetWaste1") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 2" });
              } else if (list[index].toString() == "WetWaste2") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 3" });
              } else if (list[index].toString() == "WetWaste4") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 4" });
              } else if (list[index].toString() == "WetWaste5") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 5" });
              } else if (list[index].toString() == "WetWaste6") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 6" });
              } else if (list[index].toString() == "WetWaste7") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 7" });
              } else if (list[index].toString() == "CompactorTracking1") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "CompactorTracking1", });
              } else if (list[index].toString() == "CompactorTracking2") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "CompactorTracking2", });
              } else if (list[index].toString().includes("Commercial") || list[index].toString().includes("Market")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: data[index], });
              } else {
                this.zoneList.push({ zoneNo: data[index], zoneName: "Zone " + data[index], });
              }
              //this.saveLocationHistory(data[index]);
            }
          }
        }
      }
    }, error => {
    });

  }

  async saveData() {
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
    this.rawEnteredPercentage = $("#txtPercentage").val();
    this.expectedPercentage = $("#txtPercentage").val();
    let pctNum = Number(this.expectedPercentage);
    if (isNaN(pctNum) || pctNum > 100 || pctNum < 0) {
      this.commonService.setAlertMessage("error", "Percentage must be a valid number between 0 and 100 !!!");
      return;
    }
    this.selectedDate = $("#txtDate").val();
    this.selectedZone = $("#ddlZone").val();
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);

    if (this.isSaveInProgress) {
      this.commonService.setAlertMessage("info", "A save is already in progress, please wait...");
      return;
    }
    this.isSaveInProgress = true;
    if (this.saveSafetyTimer) clearTimeout(this.saveSafetyTimer);
    this.saveSafetyTimer = setTimeout(() => { this.isSaveInProgress = false; }, 15000);

    this.historyKey = this.getHistoryTimestampKey();
    this.newlyCompletedLineNosLocal = [];
    this.skippedConvertedToCompletedLocal = [];
    this.locationHistoryEntriesAdded = 0;
    this.historySnapshot = {
      userID: localStorage.getItem("userID") || "unknown",
      userName: localStorage.getItem("userName") || "unknown",
      cityName: this.cityName,
      updateDateTime: this.commonService.setTodayDate() + " " + this.commonService.getCurrentTimeWithSecond(),
      input: {
        selectedDate: this.selectedDate,
        selectedZone: this.selectedZone,
        enteredPercentage: this.rawEnteredPercentage,
        appliedPercentage: this.expectedPercentage
      },
      afterUpdate: {
        completedLines: 0,
        skippedLines: 0,
        wardCoveredDistance: 0,
        updatedWorkPercentage: "0",
        newlyCompletedLineNos: [],
        skippedConvertedToCompleted: [],
        locationHistoryEntriesAdded: 0,
        defaultedWorkPercentageToZero: false
      }
    };

    this.preFetchedOldSummary = await this.fetchOldSummary();

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

                let oldSummaryData = this.preFetchedOldSummary;
                let oldWorkPct = oldSummaryData && oldSummaryData["workPercentage"] != null ? oldSummaryData["workPercentage"] : "0";
                let oldCoveredDistance = oldSummaryData && oldSummaryData["wardCoveredDistance"] != null ? oldSummaryData["wardCoveredDistance"] : 0;
                this.historySnapshot.old = {
                  wardTotalLines: wardTotalLines,
                  completedLines: completedLines,
                  skippedLines: skippedLines,
                  workPercentage: oldWorkPct,
                  wardCoveredDistance: oldCoveredDistance,
                  skippedLineNos: skipLineList.map(item => item.lineNo),
                  dutyInTime: dutyInTime
                };
                this.historySnapshot.calculations = {
                  expectedLines: expectedLines,
                  updateLinesNeeded: updateLines
                };

                //$("#divLoader").hide();
                this.updateLineStatus(dutyInTime, wardTotalLines, updateLines, wardLines, lineStatusList, skipLineList, expectedLines);
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

  updateLineStatus(dutyInTime: any, wardTotalLines: any, updateLines: any, wardLines: any, lineStatusList: any, skipLineList: any, expectedLine: any) {
    let count = 1;
    let isNewLine = 0;
    for (let i = 1; i <= wardTotalLines; i++) {
      if (count <= updateLines) {
        let detail = lineStatusList.find(item => item.lineNo == i);
        if (detail == undefined) {
          let lineLength = "0";
          let lineDetail = wardLines.find(item => item.lineNo == i);
          if (lineDetail != undefined) {
            lineLength = lineDetail.lineLength;
          }
          let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + i;
          this.db.object(dbPath).update({ Status: "LineCompleted", "line-distance": lineLength.toString() });
          this.newlyCompletedLineNosLocal.push(i);
          count++;
          isNewLine = 1;
        }
      }
    }
    if (isNewLine == 1) {
      for (let i = 0; i < skipLineList.length; i++) {
        let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + skipLineList[i]["lineNo"];
        this.db.object(dbPath).update({ Status: "LineCompleted", "line-distance": skipLineList[i]["distance"] });
        this.skippedConvertedToCompletedLocal.push(skipLineList[i]["lineNo"]);
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
              this.skippedConvertedToCompletedLocal.push(skipLineList[i]["lineNo"]);
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
          let workPercentageDbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/workPercentage";
          let worPercentageInstance = this.db.object(workPercentageDbPath).valueChanges().subscribe(data => {
            worPercentageInstance.unsubscribe();
            if (data == null) {
              this.db.object(dbPath).update({ workPercentage: "0" });
            }
            this.historySnapshot.afterUpdate = {
              completedLines: completedLines,
              skippedLines: skippedLines,
              wardCoveredDistance: coveredLength,
              updatedWorkPercentage: percentage,
              newlyCompletedLineNos: this.newlyCompletedLineNosLocal,
              skippedConvertedToCompleted: this.skippedConvertedToCompletedLocal,
              defaultedWorkPercentageToZero: data == null
            };
          })
        }
        this.updateLocationHistoryNew(dutyInTime, lineStatusList, expectedLine, wardLines);

      });
  }

  async updateLocationHistoryNew(dutyInTime: any, lineStatusList: any, expectedLine: any, wardLines: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateLocationHistory");
    let lineList = [];
    let time = dutyInTime;
    if (lineStatusList.length > 0) {
      let timeList = lineStatusList[lineStatusList.length - 1]["endTime"].split(':');
      time = timeList[0] + ":" + timeList[1];
    }
    for (let i = 1; i <= expectedLine; i++) {
      let detail = lineStatusList.find(item => item.lineNo == i);
      if (detail == undefined) {
        lineList.push({ linoNo: i });
      }
    }
    if (lineList.length > 0) {
      let lineStatusList = [];
      for (let i = 0; i < lineList.length; i++) {
        for (let j = 0; j < 10; j++) {
          let date = this.commonService.getPreviousDate(this.selectedDate, (j + 1));
          let data = await this.getPriviousLineStatus(date, lineList[i]["linoNo"]);
          if (data["status"] == "yes") {
            lineStatusList.push({ status: data["status"], endTime: data["endTime"], startTime: data["startTime"], lineNo: data["lineNo"], duration: data["duration"], date: data["date"] });
            j = 10;
          }
          else if (j == 9) {
            lineStatusList.push({ status: data["status"], endTime: data["endTime"], startTime: data["startTime"], lineNo: data["lineNo"], duration: data["duration"], date: data["date"] });
          }
        }
      }
      if (lineStatusList.length > 0) {
        this.getPreviousLocationHistory(0, lineStatusList, time, wardLines);
      }
    }
  }

  getPriviousLineStatus(date: any, lineNo: any) {
    return new Promise((resolve) => {
      let year = date.split("-")[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date + "/LineStatus/" + lineNo;
      let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
        instance.unsubscribe();
        if (data != null) {
          if (data["start-time"] != null) {
            let timeList = data["end-time"].split(":");
            let time = timeList[0] + ":" + timeList[1];
            let startTimeList = data["start-time"].split(":");
            let startTime = startTimeList[0] + ":" + startTimeList[1];
            let duration = this.commonService.timeDifferenceMin(new Date(date + " " + time), new Date(date + " " + startTime))
            let obj = { status: "yes", endTime: time, startTime: startTime, lineNo: lineNo, duration: duration, date: date };
            resolve(obj);
          }
          else {
            let obj = { status: "no", endTime: "", startTime: "", lineNo: lineNo, duration: 0, date: "" };
            resolve(obj);
          }
        }
        else {
          let obj = { status: "no", endTime: "", startTime: "", lineNo: lineNo, duration: 0, date: "" };
          resolve(obj);
        }
      });

    })
  }

  getPreviousLocationHistory(index: any, list: any, time: any, wardLines: any) {
    if (index < list.length) {
      let status = list[index]["status"];
      let lineNo = list[index]["lineNo"];
      if (status == "yes") {
        let date = list[index]["date"];
        let startTime = list[index]["startTime"];
        let endTime = list[index]["endTime"];
        let year = date.split("-")[0];
        let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
        let dbPath = "LocationHistory/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date;
        let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
          instance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let locationTime = keyArray[i];
                if (new Date(date + " " + locationTime) >= new Date(date + " " + startTime) && new Date(date + " " + locationTime) <= new Date(date + " " + endTime)) {
                  let dateTime = new Date(this.selectedDate + " " + time);
                  dateTime.setMinutes(dateTime.getMinutes() + 1);
                  time = (dateTime.getHours() < 10 ? '0' : '') + dateTime.getHours() + ":" + (dateTime.getMinutes() < 10 ? '0' : '') + dateTime.getMinutes();
                  dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + time + "-" + lineNo;
                  this.db.object(dbPath).update(data[locationTime]);
                  this.locationHistoryEntriesAdded++;
                }
              }
            }
          }
          index++;
          this.getPreviousLocationHistory(index, list, time, wardLines);
        })
      }
      else {
        let lineDetail = wardLines.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          let latLng = this.getLatLng(lineDetail.points);
          const data = {
            "distance-in-meter": lineDetail.lineLength,
            "lat-lng": latLng
          }
          let dateTime = new Date(this.selectedDate + " " + time);
          dateTime.setMinutes(dateTime.getMinutes() + 1);
          time = (dateTime.getHours() < 10 ? '0' : '') + dateTime.getHours() + ":" + (dateTime.getMinutes() < 10 ? '0' : '') + dateTime.getMinutes();
          let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + time + "-" + lineNo;
          this.db.object(dbPath).update(data);
          this.locationHistoryEntriesAdded++;
        }
        index++;
        this.getPreviousLocationHistory(index, list, time, wardLines);
      }
    }
    else {
      $("#divLoader").hide();
      this.commonService.setAlertMessage("success", "Ward work percentage updated !!!");
      if (!this.historySnapshot.afterUpdate) {
        this.historySnapshot.afterUpdate = {};
      }
      this.historySnapshot.afterUpdate.locationHistoryEntriesAdded = this.locationHistoryEntriesAdded;
      this.historySnapshot.status = "completed";
      this.writeHistory();
    }
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

  private getHistoryTimestampKey(): string {
    let date = this.commonService.setTodayDate();
    let time = this.commonService.getCurrentTimeWithSecond();
    return date + "_" + time.split(":").join("-");
  }

  private fetchOldSummary(): Promise<any> {
    return new Promise(resolve => {
      let resolved = false;
      let path = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary";
      let inst = this.db.object(path).valueChanges().subscribe(data => {
        if (resolved) return;
        resolved = true;
        try { inst.unsubscribe(); } catch (e) {}
        resolve(data);
      });
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        try { inst.unsubscribe(); } catch (e) {}
        resolve(null);
      }, 5000);
    });
  }

  private clearSaveInProgress() {
    this.isSaveInProgress = false;
    if (this.saveSafetyTimer) {
      clearTimeout(this.saveSafetyTimer);
      this.saveSafetyTimer = null;
    }
  }

  private writeHistory() {
    if (!this.historyKey) return;

    let detailedPath = "WardWorkPercentageUpdateHistory/" + this.selectedZone +
      "/" + this.selectedYear + "/" + this.selectedMonthName +
      "/" + this.selectedDate + "/" + this.historyKey;
    this.db.object(detailedPath).set(this.historySnapshot);

    let updateDate = this.historyKey.split("_")[0];
    let updateYear = updateDate.split("-")[0];
    let updateMonthName = this.commonService.getCurrentMonthName(Number(updateDate.split("-")[1]) - 1);
    let indexPath = "WardWorkPercentageUpdateHistory/_Index/" + updateYear +
      "/" + updateMonthName + "/" + updateDate + "/" + this.historyKey;

    let snap = this.historySnapshot;
    let indexData: any = {
      zone: this.selectedZone,
      targetDate: this.selectedDate,
      userID: snap.userID,
      userName: snap.userName,
      cityName: snap.cityName,
      updateDateTime: snap.updateDateTime,
      status: snap.status
    };
    if (snap.input) {
      indexData.enteredPercentage = snap.input.enteredPercentage;
      indexData.appliedPercentage = snap.input.appliedPercentage;
    }
    this.db.object(indexPath).set(indexData);

    this.clearSaveInProgress();

    if (this.currentHistoryZone && this.currentHistoryZone == this.selectedZone) {
      this.loadHistoryForZone(this.selectedZone);
    }
  }

  showHistoryForSelectedZone() {
    let zone = $("#ddlZone").val();
    if (!zone || zone == "0") {
      this.commonService.setAlertMessage("error", "Please select a zone first !!!");
      return;
    }
    this.loadHistoryForZone(zone.toString());
  }

  async loadHistoryForZone(zone: string) {
    this.historyLoadToken++;
    const myToken = this.historyLoadToken;

    this.currentHistoryZone = zone;
    this.isLoadingHistory = true;
    this.historyLoaded = false;
    this.historyDisplayList = [];

    let zoneData = await this.fetchHistoryByZone(zone);

    if (myToken !== this.historyLoadToken) {
      return;
    }

    let entries: any[] = [];
    if (zoneData != null) {
      for (let year of Object.keys(zoneData)) {
        let yearData = zoneData[year];
        if (!yearData || typeof yearData !== 'object') continue;
        for (let month of Object.keys(yearData)) {
          let monthData = yearData[month];
          if (!monthData || typeof monthData !== 'object') continue;
          for (let date of Object.keys(monthData)) {
            let dateData = monthData[date];
            if (!dateData || typeof dateData !== 'object') continue;
            for (let key of Object.keys(dateData)) {
              let detail = dateData[key];
              if (detail && typeof detail === 'object') {
                entries.push({ historyKey: key, targetDate: date, detail: detail });
              }
            }
          }
        }
      }
    }

    entries.sort((a, b) => (a.historyKey < b.historyKey ? 1 : -1));

    this.historyDisplayList = entries.map(e => ({
      historyKey: e.historyKey,
      updateDateTime: e.detail.updateDateTime,
      userID: e.detail.userID,
      userName: e.detail.userName,
      zone: zone,
      targetDate: e.targetDate,
      enteredPercentage: e.detail.input ? e.detail.input.enteredPercentage : "",
      appliedPercentage: e.detail.input ? e.detail.input.appliedPercentage : "",
      status: e.detail.status,
      detail: e.detail,
      isNew: this.isHistoryRecordNew(e.detail.updateDateTime)
    }));

    this.isLoadingHistory = false;
    this.historyLoaded = true;
  }

  private fetchHistoryByZone(zone: string): Promise<any> {
    return new Promise(resolve => {
      let path = "WardWorkPercentageUpdateHistory/" + zone;
      let inst = this.db.object(path).valueChanges().subscribe(data => {
        inst.unsubscribe();
        resolve(data);
      });
    });
  }

  private isHistoryRecordNew(updateDateTime: string): boolean {
    if (!updateDateTime) return false;
    let updateMs = new Date(updateDateTime.replace(" ", "T")).getTime();
    if (isNaN(updateMs)) return false;
    return (Date.now() - updateMs) < 24 * 60 * 60 * 1000;
  }

  getZoneNameById(zoneNo: any): string {
    let z = this.zoneList.find(item => item.zoneNo == zoneNo);
    return z ? z.zoneName : zoneNo;
  }

}
