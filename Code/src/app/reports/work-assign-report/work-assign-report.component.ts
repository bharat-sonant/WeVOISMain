import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-work-assign-report',
  templateUrl: './work-assign-report.component.html',
  styleUrls: ['./work-assign-report.component.scss']
})
export class WorkAssignReportComponent implements OnInit {

  constructor(private commonService: CommonService, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, private mapService: MapService) { }

  workList: any[] = [];
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;
  db: any;
  cityName: any;
  serviceName = "work-assign-report";
  dutyOnByList: any[] = [];
  dutyOffByList: any[] = [];
  workFilterList: any[] = [];
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("General-Reports", "Work-Assign-Report", localStorage.getItem("userID"));
    this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.getWorkAssignment();
  }

  getWorkAssignment() {
    let list = [];
    let dbPath = "DailyWorkDetail/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate;

    let workInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      workInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let key = keyArray[i];
          for (let i = 0; i <= 5; i++) {
            if (data[key]["task" + i] != null) {
              if (data[key]["task" + i]["task"] != null) {
                let ward = data[key]["task" + i]["task"];
                let startTime = "";
                let endTime = "";
                if (Object.keys(data[key]["task" + i + ""]["in-out"])[0] != null) {
                  if (Object.values(data[key]["task" + i + ""]["in-out"])[0] == "In") {
                    startTime = this.commonService.tConvert(Object.keys(data[key]["task" + i + ""]["in-out"])[0]);
                    let removeSecond = startTime.split(" ");
                    startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  }
                  else {
                    endTime = this.commonService.tConvert(Object.keys(data[key]["task" + i + ""]["in-out"])[0]);
                    let removeSecond = endTime.split(" ");
                    endTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  }

                }
                if (Object.keys(data[key]["task" + i + ""]["in-out"])[1] != null) {
                  if (Object.values(data[key]["task" + i + ""]["in-out"])[1] == "In") {
                    startTime = this.commonService.tConvert(Object.keys(data[key]["task" + i + ""]["in-out"])[1]);
                    let removeSecond = startTime.split(" ");
                    startTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  }
                  else {
                    endTime = this.commonService.tConvert(Object.keys(data[key]["task" + i + ""]["in-out"])[1]);
                    let removeSecond = endTime.split(" ");
                    endTime = removeSecond[0].slice(0, -3) + " " + removeSecond[1];
                  }
                }
                let dutyOffBy = "";
                if (data[key]["task" + i]["task-dutyoff-by"] != null) {
                  dutyOffBy = data[key]["task" + i]["task-dutyoff-by"];
                }
                let detail = list.find(item => item.ward == ward && item.inTime == startTime);
                if (detail == undefined) {
                  list.push({ ward: ward, inTime: startTime, outTime: endTime, dutyOnBy: data[key]["task" + i]["task-assigned-by"], dutyOffBy: dutyOffBy, dutyOnByName: "", dutyOffByName: "" });
                }
              }
            }

          }

        }
        if (list.length > 0) {
          this.workList = list.sort((a, b) =>
            b.ward < a.ward ? 1 : -1
          );
          for (let i = 0; i < this.workList.length; i++) {

            let dutyOnBy = this.workList[i].dutyOnBy;
            let dutyOffBy = this.workList[i].dutyOffBy;

            /* -------- DUTY ON -------- */
            if (this.isEmployeeId(dutyOnBy)) {

              this.getEmployeeName(i, dutyOnBy, "dutyOn");

            } else {

              // ✅ empty / null / blank check
              if (dutyOnBy && dutyOnBy.toString().trim() !== "") {

                const cleanName = dutyOnBy.toString().trim().toUpperCase();
                this.workList[i].dutyOnByName = cleanName;

                // ✅ stable unique id (name based)
                const id = cleanName.toLowerCase().replace(/\s+/g, "_");

                let detail = this.dutyOnByList.find(item => item.id === id);
                if (detail === undefined) {
                  this.dutyOnByList.push({ id, name: cleanName });
                }
              }
            }

            /* -------- DUTY OFF -------- */
            if (this.isEmployeeId(dutyOffBy)) {

              this.getEmployeeName(i, dutyOffBy, "dutyOff");

            } else {

              // ✅ empty / null / blank check
              if (dutyOffBy && dutyOffBy.toString().trim() !== "") {

                const cleanName = dutyOffBy.toString().trim().toUpperCase();
                this.workList[i].dutyOffByName = cleanName;

                // ✅ stable unique id (name based)
                const id = cleanName.toLowerCase().replace(/\s+/g, "_");

                let detail = this.dutyOffByList.find(item => item.id === id);
                if (detail === undefined) {
                  this.dutyOffByList.push({ id, name: cleanName });
                }
              }
            }

            if (i === this.workList.length - 1) {
              setTimeout(() => {
                this.workFilterList = this.workList;
              }, 200);
            }
          }


        }
        else {
          this.commonService.setAlertMessage("error", "No record found !!!");
        }
      }
      else {
        this.commonService.setAlertMessage("error", "No record found !!!");
      }
    });

  }
  normalizeName(value: any): string | null {
    if (!value) return null;

    const name = value.toString().trim();
    return name.length > 0 ? name : null;
  }
  generateId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "_");
  }

  isEmployeeId(value: any) {
    return (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !isNaN(value)
    );
  }

  getFilteredData(empName: any, type: any) {
    let list = this.workList;
    if (type == "dutyOn") {
      $("#drpDutyOff").val("0");
      if (empName != "0") {
        list = list.filter(item => item.dutyOnByName.toUpperCase().trim() == empName.toUpperCase().trim());
      }
    }
    else {
      $("#drpDutyOn").val("0");
      if (empName != "0") {
        list = list.filter(item => item.dutyOffByName.toUpperCase().trim() == empName.toUpperCase().trim());
      }
    }
    this.workFilterList = list;
  }

  getEmployeeName(index: any, empId: any, type: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      if (type == "dutyOn") {
        this.workList[index]["dutyOnByName"] = employee["name"];
        let detail = this.dutyOnByList.find(item => item.id == empId);
        if (detail == undefined) {
          this.dutyOnByList.push({ id: empId, name: employee["name"].toUpperCase() });
          this.dutyOnByList = this.dutyOnByList.sort((a, b) =>
            b.name < a.name ? 1 : -1
          );
        }
      } else {
        this.workList[index]["dutyOffByName"] = employee["name"].toUpperCase();
        let detail = this.dutyOffByList.find(item => item.id == empId);
        if (detail == undefined) {
          this.dutyOffByList.push({ id: empId, name: employee["name"].toUpperCase() });
          this.dutyOffByList = this.dutyOffByList.sort((a, b) =>
            b.name < a.name ? 1 : -1
          );
        }
      }
    });
  }

  resetData() {
    $("#drpDutyOn").val("0");
    $("#drpDutyOff").val("0");
    this.workList = [];
    this.workFilterList = [];
    this.dutyOffByList = [];
    this.dutyOnByList = [];
  }

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.resetData();
    this.getWorkAssignment();

  }
  setNextDate() {
    let currentDate = $('#txtDate').val();
    let nextDate = this.commonService.getNextDate(currentDate, 1);
    $('#txtDate').val(nextDate);
    this.selectedDate = nextDate;
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.resetData();
    this.getWorkAssignment();
  }
  setPreviousDate() {
    let currentDate = $('#txtDate').val();
    let previousDate = this.commonService.getPreviousDate(currentDate, 1);
    $('#txtDate').val(previousDate);
    this.selectedDate = previousDate;
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    this.resetData();
    this.getWorkAssignment();
  }

  exportToExcel() {
    if (this.workFilterList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Work";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Duty On Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Duty On By";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Duty Off Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Duty Off By";
      htmlString += "</td>";
      htmlString += "</tr>";

      for (let i = 0; i < this.workFilterList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.workFilterList[i]["ward"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.workFilterList[i]["inTime"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.workFilterList[i]["dutyOnByName"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.workFilterList[i]["outTime"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.workFilterList[i]["dutyOffByName"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Work-Assigned-Report - " + this.selectedDate + " .xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
