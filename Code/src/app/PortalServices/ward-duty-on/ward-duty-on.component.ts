import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { HttpClient } from "@angular/common/http";
import { valHooks } from 'jquery';

@Component({
  selector: 'app-ward-duty-on',
  templateUrl: './ward-duty-on.component.html',
  styleUrls: ['./ward-duty-on.component.scss']
})
export class WardDutyOnComponent implements OnInit {

  constructor(public fs: FirebaseService, public httpService: HttpClient, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService) { }

  db: any;
  cityName: any;
  selectedDate: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedZone: any;
  zoneList: any[] = [];
  expectedPercentage: any;
  lblMsg = "#lblMsg";
  serviceName = "ward-duty-on";
  ddlZone = "#ddlZone";
  txtDateFrom = "#txtDateFrom";
  txtPercentage = "#txtPercentage";
  txtDateTo = "#txtDateTo";
  txtDriverId = "#txtDriverId";
  txtDriver = "#txtDriver";
  txtHelperId = "#txtHelperId";
  txtHelper = "#txtHelper";
  txtVehicle = "#txtVehicle";
  txtDutyOn = "#txtDutyOn";
  txtReachOn = "#txtReachOn";
  txtDutyOff = "#txtDutyOff";
  txtOutTime = "#txtOutTime";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", "Work-Percentage", localStorage.getItem("userID"));
    this.setDefault();
  }
  setDefault() {
    this.expectedPercentage = 0;
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
  }

  getZones() {
    if (this.cityName == "jodhpur") {
      this.getJodhpurWards();
    }
    else {
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    }
  }

  getJodhpurWards() {
    this.zoneList.push({ zoneNo: "0", zoneName: "-- Select --" });
    let path = this.commonService.fireStoragePath + "Jodhpur%2FDefaults%2FAvailableWardJodhpur.json?alt=media";
    let availableWardInstance = this.httpService.get(path).subscribe(data => {
      availableWardInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));
      if (list.length > 0) {
        for (let index = 0; index < list.length; index++) {
          if (list[index] != null) {
            if (!list[index].toString().includes("Test") && list[index] != "OfficeWork" && list[index] != "FixedWages" && list[index] != "BinLifting" && list[index] != "GarageWork" && list[index] != "Compactor" && list[index] != "SegregationWork" && list[index] != "GeelaKachra" && list[index] != "SecondHelper" && list[index] != "ThirdHelper") {
              if (list[index].toString().includes("mkt")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Market " + list[index].toString().replace("mkt", ""), });
              } else if (list[index].toString().includes("MarketRoute1")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Market 1" });
              } else if (list[index].toString().includes("MarketRoute2")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Market 2" });
              } else if (list[index].toString() == "WetWaste") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 1" });
              } else if (list[index].toString() == "WetWaste1") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 2" });
              } else if (list[index].toString() == "WetWaste2") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 3" });
              } else if (list[index].toString() == "WetWaste4") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 4" });
              } else if (list[index].toString() == "WetWaste5") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 5" });
              } else if (list[index].toString() == "WetWaste6") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 6" });
              } else if (list[index].toString() == "WetWaste7") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "Wet 7" });
              } else if (list[index].toString() == "CompactorTracking1") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "CompactorTracking1", });
              } else if (list[index].toString() == "CompactorTracking2") {
                this.zoneList.push({ zoneNo: list[index], zoneName: "CompactorTracking2", });
              } else if (list[index].toString().includes("Commercial") || list[index].toString().includes("Market")) {
                this.zoneList.push({ zoneNo: list[index], zoneName: data[index], });
              } else {
                this.zoneList.push({ zoneNo: data[index], zoneName: "Zone " + data[index], });
              }
              //this.saveLocationHistory(data[index]);
            }
          }
        }
      }
    }, error => {
    });

  }

  clearAll() {
    $(this.txtPercentage).val("");
    $(this.txtDateTo).val("");
    $(this.txtDriverId).val("");
    $(this.txtDriver).val("");
    $(this.txtHelperId).val("");
    $(this.txtHelper).val("");
    $(this.txtVehicle).val("");
    $(this.txtDutyOn).val("");
    $(this.txtReachOn).val("");
    $(this.txtDutyOff).val("");
    $(this.txtOutTime).val("");

  }

  getData() {
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if ($(this.txtDateFrom).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter date from !!!");
      return;
    }
    $("#divLoader").show();
    let date = $(this.txtDateFrom).val();
    let zone = $(this.ddlZone).val();
    let year = date.toString().split("-")[0];
    let monthName = this.commonService.getCurrentMonthName(Number(date.toString().split("-")[1]) - 1);
    let dbPath = "WasteCollectionInfo/" + zone + "/" + year + "/" + monthName + "/" + date;
    let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        if (data["Summary"] != null) {
          $(this.txtDutyOn).val(data["Summary"]["dutyInTime"] ? data["Summary"]["dutyInTime"] : "");
          $(this.txtDutyOff).val(data["Summary"]["dutyOutTime"] ? data["Summary"]["dutyOutTime"] : "");
          $(this.txtReachOn).val(data["Summary"]["wardReachedOn"] ? data["Summary"]["wardReachedOn"] : "");
          $(this.txtPercentage).val(data["Summary"]["workPercentage"] ? data["Summary"]["workPercentage"] : "");
        }
        if (data["WorkerDetails"] != null) {
          $(this.txtDriverId).val(data["WorkerDetails"]["driver"] ? data["WorkerDetails"]["driver"] : "");
          $(this.txtDriver).val(data["WorkerDetails"]["driverName"] ? data["WorkerDetails"]["driverName"] : "");
          $(this.txtHelperId).val(data["WorkerDetails"]["helper"] ? data["WorkerDetails"]["helper"] : "");
          $(this.txtHelper).val(data["WorkerDetails"]["helperName"] ? data["WorkerDetails"]["helperName"] : "");
          $(this.txtVehicle).val(data["WorkerDetails"]["vehicle"] ? data["WorkerDetails"]["vehicle"] : "");
        }
        if (data["LineStatus"] != null) {
          let lineData = data["LineStatus"];
          let keyArray = Object.keys(lineData);
          if (keyArray.length > 0) {
            for (let i = keyArray.length - 1; i >= 0; i--) {
              if (lineData[i]["end-time"] != null) {
                $(this.txtOutTime).val(lineData[i]["end-time"]);
                i = -1;
              }
            }
          }
        }
      }
      $("#divLoader").hide();
    });
  }

  saveData() {
    if ($(this.txtDateFrom).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter date from !!!");
      return;
    }
    if ($(this.txtDateTo).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter date to !!!");
      return;
    }
    if ($(this.txtDriverId).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter driver id !!!");
      return;
    }
    if ($(this.txtDriver).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter driver name !!!");
      return;
    }
    if ($(this.txtHelperId).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter helper id !!!");
      return;
    }
    if ($(this.txtHelper).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter helper name !!!");
      return;
    }
    if ($(this.txtVehicle).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter vehicle !!!");
      return;
    }
    if ($(this.txtDutyOn).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter duty on time !!!");
      return;
    }
    if ($(this.txtReachOn).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter ward reach on time !!!");
      return;
    }
    if ($(this.txtDutyOff).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter duty off time !!!");
      return;
    }
    if ($(this.txtPercentage).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter work percentage !!!");
      return;
    }
    $("#divLoader").show();
    this.selectedDate = $(this.txtDateTo).val();
    this.selectedZone = $(this.ddlZone).val();
    this.selectedYear = this.selectedDate.toString().split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.toString().split("-")[1]) - 1);
    this.getWardLines($(this.txtDateFrom).val());
  }

  getLocationHistoryData(date: any) {
    let zone = $(this.ddlZone).val();
    let year = date.toString().split("-")[0];
    let monthName = this.commonService.getCurrentMonthName(Number(date.toString().split("-")[1]) - 1);
    let locationHistoryPath = "LocationHistory/" + zone + "/" + year + "/" + monthName + "/" + date;
    let locationInstance = this.db.object(locationHistoryPath).valueChanges().subscribe(data => {
      locationInstance.unsubscribe();
      if (data != null) {
        locationHistoryPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
        this.db.object(locationHistoryPath).update(data);
      }
      this.clearAll();
      this.commonService.setAlertMessage("success", "Data updated succesfully !!!");
      $("#divLoader").hide();
    });
  }

  getWardLines(date) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardLines");
    let wardLines = [];
    this.commonService.getWardLine(this.selectedZone, this.selectedDate).then((linesData: any) => {
      let wardLinesDataObj = JSON.parse(linesData);
      let wardTotalLines = wardLinesDataObj["totalLines"];
      let keyArray = Object.keys(wardLinesDataObj);
      for (let i = 0; i < keyArray.length; i++) {
        let lineNo = keyArray[i];
        if (parseInt(lineNo)) {
          let lineLength = 0;
          if (wardLinesDataObj[lineNo]["lineLength"] != null) {
            lineLength = wardLinesDataObj[lineNo]["lineLength"];
          }
          let points = wardLinesDataObj[lineNo]["points"];
          wardLines.push({ lineNo: lineNo, lineLength: lineLength, points: points });
        }
      }
      let expectedPercentage = Number($(this.txtPercentage).val());
      let expectedLines = (Number(wardTotalLines) * Number(expectedPercentage)) / 100;
      let count = 0;
      let coveredDistance = 0;
      for (let i = 0; i < wardLines.length; i++) {
        if (count < expectedLines) {
          let lineNo = i + 1;
          let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
          let lineLength = wardLines[i]["lineLength"];
          coveredDistance = Number(coveredDistance) + Number(lineLength);
          count++;
          this.db.object(dbPath).update({ Status: "LineCompleted", "line-distance": lineLength.toString() });
        }
      }
      let obj = {
        Summary: {
          dutyInTime: $(this.txtDutyOn).val(),
          dutyOutTime: $(this.txtDutyOff).val(),
          wardReachedOn: $(this.txtReachOn).val(),
          wardCoveredDistance: coveredDistance,
          workPercentage: "0",
          updatedWorkPercentage: $(this.txtPercentage).val(),
          wardOutTime: $(this.txtOutTime).val()
        },
        WorkerDetails: {
          driver: $(this.txtDriverId).val(),
          driverName: $(this.txtDriver).val(),
          helper: $(this.txtHelperId).val(),
          helperName: $(this.txtHelper).val(),
          vehicle: $(this.txtVehicle).val()
        }
      }
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      this.db.object(dbPath).update(obj);
      this.getLocationHistoryData(date);
    });
  }
}
