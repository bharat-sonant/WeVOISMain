import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-cash-management',
  templateUrl: './cash-management.component.html',
  styleUrls: ['./cash-management.component.scss']
})
export class CashManagementComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  yearList: any[] = [];
  userList:any[]=[];
  expenceList: any[] = [];
  selectedMonthName: any;
  selectedUser:any;
  db: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getYear();
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);    
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;

  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
  }

  changeUserSelection(filterVal: any) {
    this.selectedUser = filterVal;
  }

}
