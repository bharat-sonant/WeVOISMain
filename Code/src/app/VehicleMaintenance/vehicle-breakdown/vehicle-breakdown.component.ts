import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-vehicle-breakdown',
  templateUrl: './vehicle-breakdown.component.html',
  styleUrls: ['./vehicle-breakdown.component.scss']
})

export class VehicleBreakdownComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
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
  breakdownId = "#breakdownId";
  txtDate = "#txtDate";
  ddlVehicle = "#ddlVehicle";
  chkCanRun = "chkCanRun";
  txtDescription = "#txtDescription";
  divLoader = "#divLoader";
  resolvedId = "#resolvedId";
  txtResolvedDate = "#txtResolvedDate";
  txtResolvedDescription = "#txtResolvedDescription";
  chkResolvedCanRun = "chkResolvedCanRun";
  lblVehicleNo = "#lblVehicleNo";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    $(this.txtDate).val(this.toDayDate);
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
              if(vehicleBreakdownData[id]["canRunInWardResolved"]!=null){
                canRunInWardResolved=vehicleBreakdownData[id]["canRunInWardResolved"];
              }
              if(vehicleBreakdownData[id]["resolvedDate"]!=null){
                resolvedDate=vehicleBreakdownData[id]["resolvedDate"];
              }
              if(vehicleBreakdownData[id]["resolvedDescription"]!=null){
                resolvedDescription=vehicleBreakdownData[id]["resolvedDescription"];
              }
              this.breakdownList.push({ id: id, date: vehicleBreakdownData[id]["date"], vehicle: vehicleBreakdownData[id]["vehicle"], canRunInWard: vehicleBreakdownData[id]["canRunInWard"], description: vehicleBreakdownData[id]["description"], timeStamps: timeStamps, status: vehicleBreakdownData[id]["status"],canRunInWardResolved:canRunInWardResolved,resolvedDate:resolvedDate,resolvedDescription:resolvedDescription });
              this.breakdownList = this.breakdownList.sort((a, b) =>
                b.timeStamps > a.timeStamps ? 1 : -1
              );
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

  saveBreakdown() {
    let id = $(this.breakdownId).val();
    let date = $(this.txtDate).val();
    let vehicle = $(this.ddlVehicle).val();
    let description = $(this.txtDescription).val();
    let canRunInWard = "No";

    if (date == "") {
      this.commonService.setAlertMessage("error", "Please enter date !!!");
      return;
    }
    if (vehicle == "") {
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
        if (id == "0") {
          lastKey = Number(jsonData["lastKey"]);
          lastKey++;
          jsonData["lastKey"] = lastKey;
        }
        else {
          lastKey = Number(id);
        }
        jsonData[lastKey.toString()] = data;
        this.saveData(jsonData, year, monthName);
      }
    }, error => {
      jsonData["lastKey"] = lastKey;
      jsonData[lastKey] = data;
      this.saveData(jsonData, year, monthName);
    });
  }

  saveResolvedBreakdown() {
    let id = $(this.resolvedId).val();
    let date = $(this.txtResolvedDate).val();
    let description = $(this.txtResolvedDescription).val();
    let canRunInWard = "No";
    if (date == "") {
      this.commonService.setAlertMessage("error", "Please enter date !!!");
      return;
    }
    if (description == "") {
      this.commonService.setAlertMessage("error", "Please enter description !!!");
      return;
    }
    $(this.divLoader).show();
    if ((<HTMLInputElement>document.getElementById(this.chkResolvedCanRun)).checked == true) {
      canRunInWard = "Yes";
    }
    let jsonData = {};
    let lastKey = Number(id);
    let year = date.toString().split('-')[0];
    let monthName = this.commonService.getCurrentMonthName(Number(date.toString().split('-')[1]) - 1);
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVehicleBreakdown%2F" + year + "%2F" + monthName + ".json?alt=media";
    let vehicleBreakdownInstance = this.httpService.get(path).subscribe(vehicleBreakdownData => {
      vehicleBreakdownInstance.unsubscribe();
      if (vehicleBreakdownData != null) {
        jsonData = vehicleBreakdownData;
        lastKey = Number(id);
        jsonData[lastKey.toString()]["status"] = "Resolved";
        jsonData[lastKey.toString()]["canRunInWardResolved"] = canRunInWard;
        jsonData[lastKey.toString()]["resolvedDate"] = date;
        jsonData[lastKey.toString()]["resolvedDescription"] = description;
        this.saveData(jsonData, year, monthName);
      }
    });
  }

  saveData(jsonData: any, year: any, monthName: any) {
    this.commonService.saveJsonFile(jsonData, monthName + ".json", "/VehicleBreakdown/" + year + "/");
    if (this.selectedYear == year && this.selectedMonthName == monthName) {
      setTimeout(() => {
        this.getBreakdownList();
      }, 600);
    }
    else {
      $(this.divLoader).hide();
    }
    this.commonService.setAlertMessage("success", "Data saved successfully !!!");
    this.closeModel();
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 550;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.breakdownId).val(id);
    $(this.resolvedId).val(id);
    if (id != "0") {
      setTimeout(() => {
        let detail = this.breakdownList.find(item => item.id == id);
        if (detail != undefined) {
          if (type == "entry") {
            if (detail.canRunInWard == "Yes") {
              (<HTMLInputElement>document.getElementById(this.chkCanRun)).checked = true;
            }
            else {
              (<HTMLInputElement>document.getElementById(this.chkCanRun)).checked = false;
            }
            $(this.txtDate).val(detail.date);
            $(this.ddlVehicle).val(detail.vehicle);
            $(this.txtDescription).val(detail.description);
          }
          else if (type == "pending") {
            $(this.txtResolvedDate).val(this.toDayDate);
            $(this.lblVehicleNo).html("Vehicle No. " + detail.vehicle);
          }
          else if (type == "resolved") {
            if (detail.canRunInWardResolved == "Yes") {
              (<HTMLInputElement>document.getElementById(this.chkResolvedCanRun)).checked = true;
            }
            else {
              (<HTMLInputElement>document.getElementById(this.chkResolvedCanRun)).checked = false;
            }
            $(this.txtResolvedDate).val(detail.resolvedDate);
            $(this.txtResolvedDescription).val(detail.resolvedDescription);
            $(this.lblVehicleNo).html("Vehicle : " + detail.vehicle);
          }
        }
      }, 300);
    }
    else {
      $(this.txtDate).val(this.toDayDate);
    }
  }

  closeModel() {
    $(this.breakdownId).val("0");
    $(this.resolvedId).val("0");
    this.modalService.dismissAll();
  }

}
