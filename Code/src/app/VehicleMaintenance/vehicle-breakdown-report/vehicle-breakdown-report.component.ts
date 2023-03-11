import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-vehicle-breakdown-report',
  templateUrl: './vehicle-breakdown-report.component.html',
  styleUrls: ['./vehicle-breakdown-report.component.scss']
})
export class VehicleBreakdownReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  yearList: any[];
  toDayDate: any;
  selectedYear: any;
  selectedMonth: any;
  selectedMonthName: any;
  allBreakdownList: any[] = [];
  breakdownList:any[]=[];
  fireStoragePath = this.commonService.fireStoragePath;
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  ddlStatus="#ddlStatus";
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
    this.getBreakdownList();
  }

  getBreakdownList() {
    $(this.divLoader).show();
    this.allBreakdownList = [];
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
      this.getFilterData();
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

  getFilterData(){
    this.breakdownList=this.allBreakdownList;
    if($(this.ddlStatus).val()!="0")
    {     
      this.breakdownList=this.allBreakdownList.filter(item=>item.status==$(this.ddlStatus).val());
    }
  }
}
