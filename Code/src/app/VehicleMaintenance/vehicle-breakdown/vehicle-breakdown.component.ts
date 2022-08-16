import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-vehicle-breakdown',
  templateUrl: './vehicle-breakdown.component.html',
  styleUrls: ['./vehicle-breakdown.component.scss']
})

export class VehicleBreakdownComponent implements OnInit {

  constructor(public fs: FirebaseService, private router: Router, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
  cityName: any;
  db: any;
  yearList: any[];
  toDayDate: any;
  selectedYear: any;
  selectedMonth: any;
  selectedMonthName: any;
  breakdownList: any[] = [];
  vehicleList: any[] = [];
  fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";

  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    $(this.ddlMonth).val(this.toDayDate.split('-')[1]);
    this.getVehicles();
    this.getBreakdownList();
  }

  getVehicles() {
    let vehicles = JSON.parse(localStorage.getItem("vehicle"));
    for (let i = 3; i < vehicles.length; i++) {
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"] });
    }
  }

  getBreakdownList() {
    $(this.divLoader).show();
    this.breakdownList = [];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleBreakdown%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let vehicleBreakdownInstance = this.httpService.get(path).subscribe(vehicleBreakdownData => {
      vehicleBreakdownInstance.unsubscribe();
      if (vehicleBreakdownData != null) {
        let keyArray = Object.keys(vehicleBreakdownData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let id = keyArray[i];
            if (id != "lastKey") {
              let timeStamps = new Date(vehicleBreakdownData[id]["date"]).getTime();
              let canRunInWardResolved = "No";
              let resolvedDate = "";
              let resolvedDescription = "";
              let mechanicName = "";
              let workingHrs = "";
              let createdBy = "";
              let userName = "";
              if (vehicleBreakdownData[id]["createdBy"] != null) {
                createdBy = vehicleBreakdownData[id]["createdBy"];
              }
              if (vehicleBreakdownData[id]["canRunInWardResolved"] != null) {
                canRunInWardResolved = vehicleBreakdownData[id]["canRunInWardResolved"];
              }
              if (vehicleBreakdownData[id]["resolvedDate"] != null) {
                resolvedDate = vehicleBreakdownData[id]["resolvedDate"];
              }
              if (vehicleBreakdownData[id]["resolvedDescription"] != null) {
                resolvedDescription = vehicleBreakdownData[id]["resolvedDescription"];
              }
              if (vehicleBreakdownData[id]["workingHrs"] != null) {
                workingHrs = vehicleBreakdownData[id]["workingHrs"];
              }
              if (vehicleBreakdownData[id]["mechanicName"] != null) {
                mechanicName = vehicleBreakdownData[id]["mechanicName"];
              }
              this.commonService.getPortalUserDetailById(createdBy).then((data: any) => {
                userName = data["name"];
                this.breakdownList.push({ id: id, date: vehicleBreakdownData[id]["date"], vehicle: vehicleBreakdownData[id]["vehicle"], canRunInWard: vehicleBreakdownData[id]["canRunInWard"], description: vehicleBreakdownData[id]["description"], timeStamps: timeStamps, status: vehicleBreakdownData[id]["status"], canRunInWardResolved: canRunInWardResolved, resolvedDate: resolvedDate, resolvedDescription: resolvedDescription, workingHrs: workingHrs, mechanicName: mechanicName, userName: userName });
                this.breakdownList = this.breakdownList.sort((a, b) =>
                  b.timeStamps > a.timeStamps ? 1 : -1
                );
              });
            }
          }
        }
      }
      $(this.divLoader).hide();
    }, error => {
      $(this.divLoader).hide();
    });
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.toDayDate.split('-')[0];
  }

  getSelectedData() {
    if ($(this.ddlYear).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if ($(this.ddlMonth).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.getBreakdownList();
  }

  addNewEntry(id: any, type: any) {
    let url = localStorage.getItem("cityName") + "/add-vehicle-breakdown/" + id + "-" + type + "-" + this.selectedYear + "-" + this.selectedMonthName;
    this.router.navigate([url]);
  }
}
