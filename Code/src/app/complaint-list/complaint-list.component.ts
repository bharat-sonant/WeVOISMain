import { Component, OnInit } from '@angular/core';
import { CommonService } from '../services/common/common.service';
import { AngularFireDatabase } from 'angularfire2/database';
@Component({
  selector: 'app-complaint-list',
  templateUrl: './complaint-list.component.html',
  styleUrls: ['./complaint-list.component.scss']
})
export class ComplaintListComponent implements OnInit {
  complainList: any[] = [];
  yearList: any[] = [];
  daylist: any[] = []
  selectedDate: any;
  todayDate: any;
  selectedMonth: any;
  selectedMonthName: any;
  selectedYear: any
  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";
  txtDate = "#txtDate";
  constructor(public db: AngularFireDatabase, public commonService: CommonService) { }
  ngOnInit() {
    this.getComplaint()
    this.getYear()

  }
  getYear() {
    this.yearList = [];
    let year = parseInt(this.todayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedMonth = this.todayDate.split('-')[1];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.selectedYear = this.todayDate.split('-')[0];
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);

  }

  changeSelection() {
    this.todayDate = this.commonService.setTodayDate();

    this.selectedYear = $(this.ddlYear).val();

    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedDate = $(this.txtDate).val();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getComplaint();

  }

  getComplaint() {
    this.todayDate = this.commonService.setTodayDate();
    this.selectedDate = this.todayDate;
    let monthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    let year = this.selectedDate.split("-")[0];

    let dbPath = "Complaints/ComplaintRequest/" + year + "/" + monthName + "/" + this.selectedDate + "";
    let complainInstance = this.db.object(dbPath).valueChanges().subscribe(complainJsondata => {
      complainInstance.unsubscribe();


      let keyArray = Object.keys(complainJsondata);
      for (let i = 0; i < keyArray.length; i++) {
        let key = keyArray[i];
        if (key != "lastKey") {
          let date = complainJsondata[key]["date"];
          let day = date.split('-')[2];
          let month = date.split('-')[1];
          let year = date.split('-')[0];
          let dateTime = day + " " + " " + this.commonService.getCurrentMonthShortName(month) + " " + year
          let complainType = complainJsondata[key]["complainType"];
          let zone = complainJsondata[key]["zone"];
          let name = complainJsondata[key]["name"];
          let message = complainJsondata[key]["message"];

          this.complainList.push({ dateTime: dateTime, complainType: complainType, zone: zone, name: name, message: message, key: key })



        }
      }
    })
  }
}

