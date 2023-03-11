import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-add-vehicle-breakdown',
  templateUrl: './add-vehicle-breakdown.component.html',
  styleUrls: ['./add-vehicle-breakdown.component.scss']
})
export class AddVehicleBreakdownComponent implements OnInit {

  constructor(public fs: FirebaseService, private router: Router, private actRoute: ActivatedRoute, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
  cityName: any;
  db: any;
  toDayDate: any;
  selectedYear: any;
  selectedMonthName: any;
  entryType: any;
  breakdownList: any[] = [];
  vehicleList: any[] = [];
  breakdownId: any;
  fireStoragePath = this.commonService.fireStoragePath;
  vehicleBreakdownJSONData: any;
  mechanicList: any[] = [];
  preDate: any;
  txtDate = "#txtDate";
  ddlVehicle = "#ddlVehicle";
  chkCanRun = "chkCanRun";
  txtDescription = "#txtDescription";
  divLoader = "#divLoader";
  resolvedId = "#resolvedId";
  txtResolvedDate = "#txtResolvedDate";
  txtResolvedDescription = "#txtResolvedDescription";
  chkResolvedCanRun = "chkResolvedCanRun";
  ddlResolvedVehicle = "#ddlResolvedVehicle";
  txtWorkingHrs = "#txtWorkingHrs";
  divEntry = "#divEntry";
  divResolution = "#divResolution";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getMechanicList();
    const id = this.actRoute.snapshot.paramMap.get("id");
    if (id != null) {
      this.breakdownId = id.toString().split('-')[0];
      this.selectedMonthName = id.toString().split('-')[3];
      this.selectedYear = id.toString().split('-')[2];
      this.entryType = id.toString().split('-')[1];
      if (this.entryType == "entry") {
        $(this.divEntry).show();
      }
      else {
        $(this.divResolution).show();
      }

      if (this.breakdownId != "0") {
        $(this.divLoader).show();
        setTimeout(() => {
          this.fillDetail();
        }, 200);
      }
    }
    else {
      this.cancel();
    }
    $(this.txtDate).val(this.toDayDate);
    this.getVehicles();
  }

  getMechanicList() {
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployees.json?alt=media";
    let accountInstance = this.httpService.get(path).subscribe(data => {
      accountInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            if (data[empId]["GeneralDetails"]["designationId"] != null && data[empId]["GeneralDetails"]["designationId"] == "24") {
              this.mechanicList.push({ empId: empId, name: data[empId]["GeneralDetails"]["name"] })
            }
          }
        }
      }
    });
  }

  fillDetail() {
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleBreakdown%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let vehicleBreakdownInstance = this.httpService.get(path).subscribe(vehicleBreakdownData => {
      vehicleBreakdownInstance.unsubscribe();
      if (vehicleBreakdownData != null) {
        this.vehicleBreakdownJSONData = vehicleBreakdownData;
        if (this.entryType == "entry") {
          this.preDate = this.vehicleBreakdownJSONData[this.breakdownId]["date"];
          $(this.txtDate).val(this.vehicleBreakdownJSONData[this.breakdownId]["date"]);
          $(this.ddlVehicle).val(this.vehicleBreakdownJSONData[this.breakdownId]["vehicle"]);
          $(this.txtDescription).val(this.vehicleBreakdownJSONData[this.breakdownId]["description"]);
          if (this.vehicleBreakdownJSONData[this.breakdownId]["canRunInWard"] == "Yes") {
            (<HTMLInputElement>document.getElementById(this.chkCanRun)).checked = true;
          }
        }
        else {
          $(this.txtResolvedDate).val(this.toDayDate);
          if (this.vehicleBreakdownJSONData[this.breakdownId]["chkResolvedCanRun"] == "Yes") {
            (<HTMLInputElement>document.getElementById(this.chkResolvedCanRun)).checked = true;
          }
          $(this.ddlResolvedVehicle).val(this.vehicleBreakdownJSONData[this.breakdownId]["vehicle"]);
          if (this.vehicleBreakdownJSONData[this.breakdownId]["resolvedDate"] != null) {
            $(this.txtResolvedDate).val(this.vehicleBreakdownJSONData[this.breakdownId]["resolvedDate"]);
          }
          $(this.txtResolvedDescription).val(this.vehicleBreakdownJSONData[this.breakdownId]["resolvedDescription"]);
          $(this.txtWorkingHrs).val(this.vehicleBreakdownJSONData[this.breakdownId]["workingHrs"]);
          if (this.vehicleBreakdownJSONData[this.breakdownId]["mechanics"] != null) {
            let mechanics = this.vehicleBreakdownJSONData[this.breakdownId]["mechanics"];
            let list = mechanics.split(',');
            for (let i = 0; i < list.length; i++) {
              let empId = list[i].trim();
              let detail = this.mechanicList.find(item => item.empId == empId);
              if (detail != undefined) {
                (<HTMLInputElement>document.getElementById("chk" + empId)).checked = true;
              }
            }
          }
        }
        $(this.divLoader).hide();
      }
    }, error => {
      if (error["status"] != "404") {
        this.commonService.setAlertMessage("error", "Please check internet connection !!!");
        $(this.divLoader).hide();
      }
    });
  }

  getVehicles() {
    let vehicles = JSON.parse(localStorage.getItem("vehicle"));
    for (let i = 3; i < vehicles.length; i++) {
      this.vehicleList.push({ vehicle: vehicles[i]["vehicle"] });
    }
  }

  saveBreakdown() {
    let date = $(this.txtDate).val();
    let vehicle = $(this.ddlVehicle).val();
    let description = $(this.txtDescription).val();
    let canRunInWard = "No";

    if (date == "") {
      this.commonService.setAlertMessage("error", "Please enter date !!!");
      return;
    }
    if (vehicle == "0") {
      this.commonService.setAlertMessage("error", "Please select vehicle !!!");
      return;
    }
    if (description == "") {
      this.commonService.setAlertMessage("error", "Please enter description !!!");
      return;
    }
    $(this.divLoader).show();
    if ((<HTMLInputElement>document.getElementById(this.chkCanRun)).checked == true) {
      canRunInWard = "Yes";
    }
    const data = {
      date: date,
      vehicle: vehicle,
      canRunInWard: canRunInWard,
      description: description,
      createdBy: localStorage.getItem("userID"),
      creationDate: this.toDayDate,
      status: 'Pending'
    }
    let jsonData = {};
    let lastKey = 1;
    let year = date.toString().split('-')[0];
    let monthName = this.commonService.getCurrentMonthName(Number(date.toString().split('-')[1]) - 1);
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleBreakdown%2F" + year + "%2F" + monthName + ".json?alt=media";
    let vehicleBreakdownInstance = this.httpService.get(path).subscribe(vehicleBreakdownData => {
      vehicleBreakdownInstance.unsubscribe();
      if (vehicleBreakdownData != null) {
        jsonData = vehicleBreakdownData;
        if (this.breakdownId == "0") {
          lastKey = Number(jsonData["lastKey"]);
          lastKey++;
          jsonData["lastKey"] = lastKey;
        }
        else {
          if (this.preDate != null) {
            let preYear = this.preDate.toString().split('-')[0];
            let preMonthName = this.commonService.getCurrentMonthName(Number(this.preDate.toString().split('-')[1]) - 1);
            if (preYear == year && preMonthName == monthName) {
              lastKey = Number(this.breakdownId);
            }
            else {
              lastKey = Number(jsonData["lastKey"]);
              lastKey++;
              jsonData["lastKey"] = lastKey;
              this.deletePreData(preMonthName, preYear);
            }
          }
        }
        jsonData[lastKey.toString()] = data;

        this.saveData(jsonData, year, monthName);
      }
    }, error => {
      if (error["status"] == "404") {
        jsonData["lastKey"] = lastKey;
        jsonData[lastKey] = data;
        this.saveData(jsonData, year, monthName);
      }
      else {
        this.commonService.setAlertMessage("error", "Please check internet connection !!!");
        $(this.divLoader).hide();
      }
    });
  }

  deletePreData(preMonthName: any, preYear: any) {
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleBreakdown%2F" + preYear + "%2F" + preMonthName + ".json?alt=media";
    let vehicleBreakdownInstance = this.httpService.get(path).subscribe(vehicleBreakdownData => {
      vehicleBreakdownInstance.unsubscribe();
      if (vehicleBreakdownData != null) {
        let jsonData = {};
        jsonData = vehicleBreakdownData;
        delete jsonData[this.breakdownId.toString()];
        this.saveData(jsonData, preYear, preMonthName);
      }
    });
  }

  saveResolvedBreakdown() {
    let date = $(this.txtResolvedDate).val();
    let description = $(this.txtResolvedDescription).val();
    let workingHrs = $(this.txtWorkingHrs).val();
    let canRunInWard = "No";
    if (date == "") {
      this.commonService.setAlertMessage("error", "Please enter date !!!");
      return;
    }
    if (description == "") {
      this.commonService.setAlertMessage("error", "Please enter description !!!");
      return;
    }
    if (workingHrs == "") {
      this.commonService.setAlertMessage("error", "Please enter working hrs !!!");
      return;
    }
    $(this.divLoader).show();
    if ((<HTMLInputElement>document.getElementById(this.chkResolvedCanRun)).checked == true) {
      canRunInWard = "Yes";
    }
    let jsonData = {};
    let lastKey = Number(this.breakdownId);
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleBreakdown%2F" + this.selectedYear + "%2F" + this.selectedMonthName + ".json?alt=media";
    let vehicleBreakdownInstance = this.httpService.get(path).subscribe(vehicleBreakdownData => {
      vehicleBreakdownInstance.unsubscribe();
      if (vehicleBreakdownData != null) {
        jsonData = vehicleBreakdownData;
        lastKey = Number(this.breakdownId);
        jsonData[lastKey.toString()]["status"] = "Resolved";
        jsonData[lastKey.toString()]["canRunInWardResolved"] = canRunInWard;
        jsonData[lastKey.toString()]["resolvedDate"] = date;
        jsonData[lastKey.toString()]["resolvedDescription"] = description;
        jsonData[lastKey.toString()]["workingHrs"] = workingHrs;
        let mechanics = "";
        let mechanicName = "";
        if (this.mechanicList.length > 0) {
          for (let i = 0; i < this.mechanicList.length; i++) {
            let empId = this.mechanicList[i]["empId"];
            if ((<HTMLInputElement>document.getElementById("chk" + empId)).checked == true) {
              if (mechanics == "") {
                mechanics = empId;
                mechanicName = this.mechanicList[i]["name"];
              }
              else {
                mechanics = mechanics + "," + empId;
                mechanicName = mechanicName + "," + this.mechanicList[i]["name"];
              }
            }
          }
        }
        jsonData[lastKey.toString()]["mechanics"] = mechanics;
        jsonData[lastKey.toString()]["mechanicName"] = mechanicName;
        this.saveData(jsonData, this.selectedYear, this.selectedMonthName);
      }
    }, error => {
      if (error["status"] != "404") {
        this.commonService.setAlertMessage("error", "Please check internet connection !!!");
        $(this.divLoader).hide();
      }
    });
  }

  saveData(jsonData: any, year: any, monthName: any) {
    this.commonService.saveJsonFile(jsonData, monthName + ".json", "/VehicleBreakdown/" + year + "/");
    setTimeout(() => {
      this.commonService.setAlertMessage("success", "Data saved successfully !!!");
      $(this.divLoader).hide();
      this.cancel();
    }, 2000);
  }

  checkDate(filterVal: any) {
    this.commonService.setDate(this.toDayDate, filterVal, 'current').then((newDate: any) => {
      $(this.txtDate).val(newDate);
      $(this.txtResolvedDate).val(newDate);
      if (newDate != this.toDayDate) {
        this.toDayDate = newDate;
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  cancel() {
    let url = this.cityName + "/17A/vehicle-breakdown";
    this.router.navigate([url]);
  }
}
