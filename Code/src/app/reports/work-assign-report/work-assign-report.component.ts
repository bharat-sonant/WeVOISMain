import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-work-assign-report',
  templateUrl: './work-assign-report.component.html',
  styleUrls: ['./work-assign-report.component.scss']
})
export class WorkAssignReportComponent implements OnInit {

  constructor(private commonService: CommonService, public fs: FirebaseService, private mapService: MapService) { }

  workList: any[] = [];
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
    $('#txtDate').val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.onSubmit();
  }

  onSubmit() {
    this.workList = [];
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let dbPath = "WhoAssignWork/" + year + "/" + monthName + "/" + this.selectedDate;
    let workData = this.db.object(dbPath).valueChanges().subscribe(
      Data => {
        workData.unsubscribe();
        var keyArray = Object.keys(Data);
        for (let index = 0; index < keyArray.length; index++) {
          let empId = keyArray[index];
          this.workList.push({ empId: empId, name: '', detail: '' });
          let assignedList = Data[empId];
          if (assignedList.length > 0) {
            let detail = "";
            for (let i = 0; i < assignedList.length; i++) {
              if (assignedList[i] != null) {
                if (detail == "") {
                  detail = "<b>" + i + ".</b> Work assigned for " + assignedList[i]["task"] + " at " + assignedList[i]["time"];
                }
                else {
                  detail = detail + "<br/><b>" + i + ".</b> Work assigned for " + assignedList[i]["task"] + " at " + assignedList[i]["time"];
                }
              }
            }
            this.workList[index]["detail"] = detail;

            this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
              let workDetails = this.workList.find(item => item.empId == empId);
              if (workDetails != undefined) {
                workDetails.name = employee["name"];
              }
            });
          }
        }
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
