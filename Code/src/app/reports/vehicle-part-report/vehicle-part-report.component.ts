import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { NgbDatepickerNavigation } from '@ng-bootstrap/ng-bootstrap/datepicker/datepicker-navigation';

import { FirebaseService } from "../../firebase.service";
@Component({
  selector: 'app-vehicle-part-report',
  templateUrl: './vehicle-part-report.component.html',
  styleUrls: ['./vehicle-part-report.component.scss']
})
export class VehiclePartReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private modalService: NgbModal, public toastr: ToastrService, private mapService: MapService, public httpService: HttpClient, private commonService: CommonService) { }
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  yearList: any[];
  partList: any[];
  monthFilterPartList: any[] = [];
  dateFilterPartList: any[] = [];
  monthDataList: any[];
  isOnLoad = false;
  dateDataListStore: any[];
  dateDataList: any[];
  db:any;

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.dateDataList = [];
    this.dateDataListStore = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    this.getParts();
    this.isOnLoad = true;
    this.getMonthData("All Parts");
    setTimeout(() => {
      this.getDateData("All Parts", $('#date1').val(), $('#date2').val());
    }, 2000);
  }


  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }


  getParts() {
    this.partList = [];
    let dbPath = "Defaults/VehicleParts";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      vehicle => {
        vehicleInstance.unsubscribe();
        this.partList.push({ part: "All Parts" });
        this.monthFilterPartList.push({ part: "All Parts" });
        this.dateFilterPartList.push({ part: "All Parts" });
        if (vehicle != null) {
          let keyArray = Object.keys(vehicle);
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            this.partList.push({ part: vehicle[index]["name"] });
            this.monthFilterPartList.push({ part: vehicle[index]["name"] });
            this.dateFilterPartList.push({ part: vehicle[index]["name"] });
          }
        }
      });
  }

  changeSelection() {
    this.selectedMonth = $('#ddlMonth').val();
    this.selectedYear = $('#ddlYear').val();
    let part = $('#ddlMonthPart').val();
    if (part == "") {
      part = "All Parts";
    }
    this.getMonthData(part);
  }

  showMonthList() {
    $('#monthPartList').show();
  }

  hideMonthList() {
    setTimeout(() => {
      $('#monthPartList').hide();
    }, 500);

  }

  getMonthValue(e) {
    $('#ddlMonthPart').val(e.target.innerHTML);
    $('#monthPartList').hide();
    this.getMonthData(e.target.innerHTML);
  }

  getMonthFilter() {
    this.monthFilterPartList = [];
    let flt = $('#ddlMonthPart').val();
    if (flt != "") {
      if (this.partList.length > 0) {
        for (let i = 0; i < this.partList.length; i++) {
          if (this.partList[i]["part"].toString().toUpperCase().includes(flt.toString().toUpperCase())) {
            this.monthFilterPartList.push({ part: this.partList[i]["part"] });
          }
        }
      }
    }
    else {
      if (this.partList.length > 0) {
        for (let i = 0; i < this.partList.length; i++) {
          this.monthFilterPartList.push({ part: this.partList[i]["part"] });
        }
      }
    }
  }

  showDateList() {
    $('#datePartList').show();
  }

  hideDateList() {
    setTimeout(() => {
      $('#datePartList').hide();
    }, 500);

  }

  getDateValue(e) {
    $('#ddlDatePart').val(e.target.innerHTML);
    $('#datePartList').hide();
    this.getDateData(e.target.innerHTML, $('#date1').val(), $('#date2').val());
  }

  getDateFilter() {
    this.dateFilterPartList = [];
    let flt = $('#ddlDatePart').val();
    if (flt != "") {
      if (this.partList.length > 0) {
        for (let i = 0; i < this.partList.length; i++) {
          if (this.partList[i]["part"].toString().toUpperCase().includes(flt.toString().toUpperCase())) {
            this.dateFilterPartList.push({ part: this.partList[i]["part"] });
          }
        }
      }
    }
    else {
      if (this.partList.length > 0) {
        for (let i = 0; i < this.partList.length; i++) {
          this.dateFilterPartList.push({ part: this.partList[i]["part"] });
        }
      }
    }
  }

  getMonthData(part: any) {
    this.monthDataList = [];
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    let rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let j = 1; j <= rowTo; j++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
      let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
      let dbPath = "Inventory/VehiclePartData/" + this.selectedYear + "/" + monthName + "/" + monthDate + "";
      let partInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          partInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length - 1; i++) {
                let index = keyArray[i];
                if (data[index]["isDelete"] == 0) {
                  if (data[index]["Detail"] != null) {
                    let partArray = data[index]["Detail"];
                    for (let j = 0; j < partArray.length; j++) {
                      if (part != "All Parts") {
                        if (partArray[j]["part"] == part) {
                          let partDetails = this.monthDataList.find(item => item.part == partArray[j]["part"]);
                          if (partDetails != undefined) {
                            let qty = Number(partDetails.qty) + Number(partArray[j]["qty"]);
                            partDetails.qty = qty;
                          }
                          else {
                            this.monthDataList.push({ part: partArray[j]["part"], qty: partArray[j]["qty"], unit: partArray[j]["unit"] });
                          }
                        }
                      }
                      else {
                        let partDetails = this.monthDataList.find(item => item.part == partArray[j]["part"]);
                        if (partDetails != undefined) {
                          let qty = Number(partDetails.qty) + Number(partArray[j]["qty"]);
                          partDetails.qty = qty;
                        }
                        else {
                          this.monthDataList.push({ part: partArray[j]["part"], qty: partArray[j]["qty"], unit: partArray[j]["unit"] });
                        }
                        if (this.isOnLoad == true) {
                          this.dateDataListStore.push({ date: data[index]["creationDate"], part: partArray[j]["part"], qty: partArray[j]["qty"], unit: partArray[j]["unit"], billNo: data[index]["billNo"] });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
    }
  }

  getDateData(part: any, dateFrom: any, dateTo: any) {
    this.dateDataList = [];
    if (this.isOnLoad == true) {
      this.dateDataList = this.dateDataListStore;
      dateFrom = this.selectedYear + '-' + this.selectedMonth + '-01';
      if (dateFrom == this.commonService.setTodayDate()) {
        dateTo = this.selectedYear + '-' + this.selectedMonth + '-01';
      }
      else {
        let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
        let rowTo = days;
        if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
          rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
        }
        dateTo = this.commonService.getNextDate(dateFrom, rowTo);
      }
      $('#date1').val(dateFrom);
      $('#date2').val(dateTo);
      this.isOnLoad = false;
    }
    else {
      let days = this.commonService.getDaysBetweenDates(dateFrom, dateTo);
      if (days == 0) {
        let monthDate = dateFrom;
        let year = monthDate.split('-')[0];
        let monthName = this.commonService.getCurrentMonthName(Number(monthDate.split('-')[1]) - 1);
        this.getDateDataList(part, monthName, year, monthDate);
      }
      else {
        for (let i = 0; i <= days; i++) {
          let monthDate = this.commonService.getNextDate(dateFrom, i);
          let year = monthDate.split('-')[0];
          let monthName = this.commonService.getCurrentMonthName(Number(monthDate.split('-')[1]) - 1);
          this.getDateDataList(part, monthName, year, monthDate);
        }
      }
    }
  }

  getDateDataList(part: any, monthName: any, monthYear: any, monthDate) {
    let dbPath = "Inventory/VehiclePartData/" + monthYear + "/" + monthName + "/" + monthDate;
    let partInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        partInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length - 1; i++) {
              let index = keyArray[i];
              if (data[index]["isDelete"] == 0) {
                if (data[index]["Detail"] != null) {
                  let partArray = data[index]["Detail"];
                  for (let j = 0; j < partArray.length; j++) {
                    if (part != "All Parts") {
                      if (partArray[j]["part"] == part) {
                        this.dateDataList.push({ part: partArray[j]["part"], qty: partArray[j]["qty"], unit: partArray[j]["unit"] });
                      }
                    }
                    else {
                      this.dateDataList.push({ date: data[index]["creationDate"], part: partArray[j]["part"], qty: partArray[j]["qty"], unit: partArray[j]["unit"], billNo: data[index]["billNo"] });
                    }
                  }
                }
              }
            }
          }
        }
      });
  }

  getDateDataFilter() {
    let part = $('#ddlDatePart').val();
    if (part == "") {
      part = "All Parts";
    }
    let dateFrom = $('#date1').val();
    let dateTo = $('#date2').val();

    if (dateFrom == "") {
      this.setAlertMessage("Please fill Date From !!!!");
      return;
    }
    if (dateTo == "") {
      this.setAlertMessage("Please fill Date To !!!!");
      return;
    }
    let days = this.commonService.getDaysBetweenDates(dateFrom, dateTo);
    if (days < 0) {
      this.setAlertMessage("Please fill Date From previous than Date To!!!!");
      return;
    }
    this.getDateData(part, dateFrom, dateTo);
  }

  resetAllFilter() {
    $('#ddlDatePart').val("");
    let dateFrom = "";
    let dateTo = "";
    let date = this.commonService.setTodayDate();
    let month = this.toDayDate.split('-')[1];
    let year = this.toDayDate.split('-')[0];
    this.dateDataList = this.dateDataListStore;
    dateFrom = year + '-' + month + '-01';
    if (dateFrom == this.commonService.setTodayDate()) {
      dateTo = year + '-' + month + '-01';
    }
    else {
      let days = new Date(parseInt(year), parseInt(month), 0).getDate();
      let rowTo = days;
      if (month == this.commonService.setTodayDate().split("-")[1]) {
        rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
      }
      dateTo = this.commonService.getNextDate(dateFrom, rowTo);
    }
    $('#date1').val(dateFrom);
    $('#date2').val(dateTo);
    this.dateDataList = this.dateDataListStore;
  }

  setAlertMessage(message: any) {
    this.toastr.error(message, '', {
      timeOut: 6000,
      enableHtml: true,
      closeButton: true,
      toastClass: "alert alert-danger alert-with-icon",
      positionClass: 'toast-bottom-right'
    });
  }

}
