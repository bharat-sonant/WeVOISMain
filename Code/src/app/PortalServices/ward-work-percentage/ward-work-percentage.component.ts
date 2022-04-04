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
            dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/workPercentage";
            let workPercentageInstance = this.db.object(dbPath).valueChanges().subscribe(
              workPercentageData => {
                workPercentageInstance.unsubscribe();
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
                  let coveredLength = 0;
                  let count = 1;
                  let completedLines = 0;
                  for (let i = 1; i <= wardTotalLines; i++) {
                    dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + i;
                    let lineStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
                      lineStatusData => {
                        lineStatusInstance.unsubscribe();
                        if (count <= expectedLine) {
                          if (lineStatusData == null) {
                            dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + i;
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
                            dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary/";
                            this.db.object(dbPath).update({ completedLines: completedLines, wardCoveredDistance: coveredLength, workPercentage: this.expectedPercentage });
                            i = wardTotalLines + 1;
                            $("#divLoader").hide();
                            this.commonService.setAlertMessage("success", "Ward work percentage updated !!!")
                          }
                          count++;
                        }
                      }
                    );
                  }
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
}
