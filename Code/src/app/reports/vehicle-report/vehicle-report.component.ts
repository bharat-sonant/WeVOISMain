import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';

@Component({
  selector: 'app-vehicle-report',
  templateUrl: './vehicle-report.component.html',
  styleUrls: ['./vehicle-report.component.scss']
})

export class VehicleReportComponent implements OnInit {

  constructor(public db: AngularFireDatabase, private commonService: CommonService, private modalService: NgbModal) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  vehicleList: any[];
  vehicleDataList: any[] = [];
  vehicleDetailList: any[];
  yearList: any[];
  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.getVehicleList();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getVehicleList() {
    this.vehicleList = [];
    let vehicleList = JSON.parse(localStorage.getItem('vehicle'));
    if (vehicleList != null) {
      this.vehicleList.push({ vehicle: "All Vehicle" });
      for (let i = 1; i < vehicleList.length; i++) {
        if (vehicleList[i]["vehicle"] != "Drum/Can" && vehicleList[i]["vehicle"] != "Motor Cycle") {
          this.vehicleList.push({ vehicle: vehicleList[i]["vehicle"] });
          this.vehicleDataList.push({ vehicle: vehicleList[i]["vehicle"] });
        }
      }
      this.getReason(this.vehicleList[0]["vehicle"]);
    }
  }

  getReason(vehicle: any) {
    this.vehicleDataList = [];
    this.vehicleDetailList = [];
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    let rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }

    if (vehicle == "All Vehicle") {
      for (let i = 1; i < this.vehicleList.length; i++) {
        this.vehicleDataList.push({ vehicle: this.vehicleList[i]["vehicle"] });
        for (let j = 1; j <= rowTo; j++) {
          let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
          let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
          this.getReasonData(this.vehicleList[i]["vehicle"], monthName, monthDate);
        }
      }
    }
    else {
      this.vehicleDataList.push({ vehicle: vehicle });
      for (let j = 1; j <= rowTo; j++) {
        let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
        let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
        this.getReasonData(vehicle, monthName, monthDate);
      }
    }
  }

  getReasonData(vehicle: any, monthName: any, monthDate: any) {
    let dbPath = "VehicleNotAssignedReasons/" + vehicle + "/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/reason";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        vehicleInstance.unsubscribe();
        if (data != null) {
          let d = "day" + parseFloat(monthDate.split("-")[2]);
          let vehicleDetails = this.vehicleDataList.find(item => item.vehicle == vehicle);
          if (vehicleDetails != undefined) {
            vehicleDetails[d] = data.toString();
          }
        }
      });
  }

  changeSelection() {

    let vehicle = $('#ddlVehicle').val();
    this.selectedYear = $('#ddlYear').val();
    this.selectedMonth = $('#ddlMonth').val();
    this.getReason(vehicle);
  }

  // open model 
  showDetail(content: any, vehicle: any, date: any, detail: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let height = 400;
    let width = 300;
    // height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 100;
    $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
    $('div .modal-dialog-centered').css("margin-top", "26px");
    //$('#divStatus').css("height", divHeight);
    let title = vehicle;
    $('#exampleModalLongTitle').html(title);
    $('#vehicleDetail').html(detail.toString().replaceAll("\n", "<br/>"));
    $('#vehicleDate').html(date);
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  showVehicleDetail(content: any, vehicle: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let height = 400;
    let width = 500;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 100;
    $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
    $('div .modal-dialog-centered').css("margin-top", "26px");
    $('#divStatus').css("height", divHeight);
    let title = vehicle;
    $('#exampleModalLongTitle').html(title);
    this.vehicleDetailList = [];
    let vehicleDetails = this.vehicleDataList.find(item => item.vehicle == vehicle);
    if (vehicleDetails != undefined) {
      let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
      let rowTo = days;
      if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
        rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
      }
      for (let i = 1; i <= rowTo; i++) {
        let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
        let d = "day" + parseFloat(monthDate.split("-")[2]);
        var reason = vehicleDetails[d];
        if (reason != undefined) {
          this.vehicleDetailList.push({ date: monthDate, reason: reason.toString().replaceAll("\n", "<br/>") });
        }
      }
    }
  }
}



