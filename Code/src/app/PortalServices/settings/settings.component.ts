import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  firestotagePath: any;
  navigatorJsonObject: any;
  readerJsonObject: any;   
  haltJsonObject: any;
  salaryJsonObject: any;
  
  // Navigator
  txtFirstStartPointRange = "#txtFirstStartPointRange";
  txtLineEndPointRange = "#txtLineEndPointRange";
  txtCurrentLocationCaptureInterval = "#txtCurrentLocationCaptureInterval";
  txtMaxDistanceCanCover = "#txtMaxDistanceCanCover";
  txtScreenOffVoiceMessage = "#txtScreenOffVoiceMessage";
  txtInternetCheckVoiceMessage = "#txtInternetCheckVoiceMessage";
  txtStartLineNote = "#txtStartLineNote";
  txtLineHeading = "#txtLineHeading";
  txtSkipWarningMessage = "#txtSkipWarningMessage";
  txtHaltVoiceMessage = "#txtHaltVoiceMessage";
  txtHaltVoiceMessageInterval = "#txtHaltVoiceMessageInterval";
  txtHaltVoiceMessageMinimumTime = "#txtHaltVoiceMessageMinimumTime";
  txtLunchBreakMessage = "#txtLunchBreakMessage";
  txtLunchBreakMessageInterval = "#txtLunchBreakMessageInterval";
  txtReaderDeviceOfflineMessage = "#txtReaderDeviceOfflineMessage";
  txtScreenOffIntervalTime="#txtScreenOffIntervalTime";
  txtMicCapturingTime="#txtMicCapturingTime";
  txtMicNotificationTime="#txtMicNotificationTime";
  txtMicCapturingRangeInAmp="#txtMicCapturingRangeInAmp";
  txtMicRecordingStartTime="#txtMicRecordingStartTime";


  // Reader
  txtCardScanWaitTime = "#txtCardScanWaitTime";
  txtCardScanTimeGap = "#txtCardScanTimeGap";
  txtCardScanNote = "#txtCardScanNote";

  // Halt
  txtAllowedHalt="#txtAllowedHalt";
  txtHaltAllowedRange="#txtHaltAllowedRange";
  txtDistanceCoveredCheckInterval="#txtDistanceCoveredCheckInterval";
  txtMobileOffAllowedHalt="#txtMobileOffAllowedHalt";
  txtNetworkOffAllowedHalt="#txtNetworkOffAllowedHalt";
  txtMaxHaltAllowed="#txtMaxHaltAllowed";
  txtLunchMaxHalt="#txtLunchMaxHalt";
  txtLunchAllowedRange="#txtLunchAllowedRange";

  // Salary
  txtDriverSalaryPerHour="#txtDriverSalaryPerHour";
  txtHelperSalaryPerHour="#txtHelperSalaryPerHour";
  txtDriverSalaryPerHourForTractor="#txtDriverSalaryPerHourForTractor";
  txtBasicMinHours="#txtBasicMinHours";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.firestotagePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.getCommonNavigatorSetting();
    this.getCommonReaderSetting();
    this.getCityHaltSetting();
    this.getCitySalarySetting();
  }

  //Salary

  getCitySalarySetting() {
    const path = this.firestotagePath + this.commonService.getFireStoreCity() + "%2FSettings%2FSalarySetting.json?alt=media";
    let haltJsonInstance = this.httpService.get(path).subscribe(salaryJsonData => {
      haltJsonInstance.unsubscribe();
      if (salaryJsonData != null) {
        this.salaryJsonObject = salaryJsonData;
        if (salaryJsonData["driverSalaryPerHour"] != null) {
          $(this.txtDriverSalaryPerHour).val(salaryJsonData["driverSalaryPerHour"]);
        }
        if (salaryJsonData["helperSalaryPerHour"] != null) {
          $(this.txtHelperSalaryPerHour).val(salaryJsonData["helperSalaryPerHour"]);
        }
        if (salaryJsonData["driverSalaryPerHourForTractor"] != null) {
          $(this.txtDriverSalaryPerHourForTractor).val(salaryJsonData["driverSalaryPerHourForTractor"]);
        }
        if (salaryJsonData["basicMinHours"] != null) {
          $(this.txtBasicMinHours).val(salaryJsonData["basicMinHours"]);
        }
      }
    });
  }

  saveCitySalarySetting() {
    if (this.salaryJsonObject == null) {
      this.salaryJsonObject = {};
    }
    if ($(this.txtDriverSalaryPerHour).val() != "") {
      this.salaryJsonObject["driverSalaryPerHour"] = $(this.txtDriverSalaryPerHour).val();
    }
    if ($(this.txtHelperSalaryPerHour).val() != "") {
      this.salaryJsonObject["helperSalaryPerHour"] = $(this.txtHelperSalaryPerHour).val();
    }
    if ($(this.txtDriverSalaryPerHourForTractor).val() != "") {
      this.salaryJsonObject["driverSalaryPerHourForTractor"] = $(this.txtDriverSalaryPerHourForTractor).val();
    }
    if ($(this.txtBasicMinHours).val() != "") {
      this.salaryJsonObject["basicMinHours"] = $(this.txtBasicMinHours).val();
    }
    let fileName = "SalarySetting.json";
    let path = "/Settings/";
    this.commonService.saveJsonFile(this.salaryJsonObject, fileName, path);
    this.commonService.setAlertMessage("success", "Salary setting updated !!!");
  }


  // Navigator
  getCommonNavigatorSetting() {
    const path = this.firestotagePath + "Common%2FSettings%2FNavigatorSetting.json?alt=media";
    let navigatorJsonInstance = this.httpService.get(path).subscribe(navigetorJsonData => {
      navigatorJsonInstance.unsubscribe();
      if (navigetorJsonData != null) {
        this.navigatorJsonObject = navigetorJsonData;
        if (navigetorJsonData["firstStartPointRange"] != null) {
          $(this.txtFirstStartPointRange).val(navigetorJsonData["firstStartPointRange"]);
        }
        if (navigetorJsonData["lineEndPointRange"] != null) {
          $(this.txtLineEndPointRange).val(navigetorJsonData["lineEndPointRange"]);
        }
        if (navigetorJsonData["currentLocationCaptureInterval"] != null) {
          $(this.txtCurrentLocationCaptureInterval).val(navigetorJsonData["currentLocationCaptureInterval"]);
        }
        if (navigetorJsonData["maxDistanceCanCover"] != null) {
          $(this.txtMaxDistanceCanCover).val(navigetorJsonData["maxDistanceCanCover"]);
        }
        if (navigetorJsonData["screenOffVoiceMessage"] != null) {
          $(this.txtScreenOffVoiceMessage).val(navigetorJsonData["screenOffVoiceMessage"]);
        }
        if (navigetorJsonData["internetCheckVoiceMessage"] != null) {
          $(this.txtInternetCheckVoiceMessage).val(navigetorJsonData["internetCheckVoiceMessage"]);
        }
        if (navigetorJsonData["startLineNote"] != null) {
          $(this.txtStartLineNote).val(navigetorJsonData["startLineNote"]);
        }
        if (navigetorJsonData["lineHeading"] != null) {
          $(this.txtLineHeading).val(navigetorJsonData["lineHeading"]);
        }
        if (navigetorJsonData["skipWarningMessage"] != null) {
          $(this.txtSkipWarningMessage).val(navigetorJsonData["skipWarningMessage"]);
        }
        if (navigetorJsonData["haltVoiceMessage"] != null) {
          $(this.txtHaltVoiceMessage).val(navigetorJsonData["haltVoiceMessage"]);
        }
        if (navigetorJsonData["haltVoiceMessageInterval"] != null) {
          $(this.txtHaltVoiceMessageInterval).val(navigetorJsonData["haltVoiceMessageInterval"]);
        }
        if (navigetorJsonData["haltVoiceMessageMinimumTime"] != null) {
          $(this.txtHaltVoiceMessageMinimumTime).val(navigetorJsonData["haltVoiceMessageMinimumTime"]);
        }
        if (navigetorJsonData["lunchBreakMessage"] != null) {
          $(this.txtLunchBreakMessage).val(navigetorJsonData["lunchBreakMessage"]);
        }
        if (navigetorJsonData["lunchBreakMessageInterval"] != null) {
          $(this.txtLunchBreakMessageInterval).val(navigetorJsonData["lunchBreakMessageInterval"]);
        }
        if (navigetorJsonData["readerDeviceOfflineMessage"] != null) {
          $(this.txtReaderDeviceOfflineMessage).val(navigetorJsonData["readerDeviceOfflineMessage"]);
        }
        if (navigetorJsonData["screenOffIntervalTime"] != null) {
          $(this.txtScreenOffIntervalTime).val(navigetorJsonData["screenOffIntervalTime"]);
        }
        if (navigetorJsonData["micCapturingTime"] != null) {
          $(this.txtMicCapturingTime).val(navigetorJsonData["micCapturingTime"]);
        }
        if (navigetorJsonData["micNotificationTime"] != null) {
          $(this.txtMicNotificationTime).val(navigetorJsonData["micNotificationTime"]);
        }
        if (navigetorJsonData["micCapturingRangeInAmp"] != null) {
          $(this.txtMicCapturingRangeInAmp).val(navigetorJsonData["micCapturingRangeInAmp"]);
        }
        if (navigetorJsonData["micRecordingStartTime"] != null) {
          $(this.txtMicRecordingStartTime).val(navigetorJsonData["micRecordingStartTime"]);
        }
      }
    });
  }

  saveCommonNavigatorSetting() {
    if (this.navigatorJsonObject == null) {
      this.navigatorJsonObject = {};
    }
    if ($(this.txtFirstStartPointRange).val() != "") {
      this.navigatorJsonObject["firstStartPointRange"] = $(this.txtFirstStartPointRange).val();
    }
    if ($(this.txtLineEndPointRange).val() != "") {
      this.navigatorJsonObject["lineEndPointRange"] = $(this.txtLineEndPointRange).val();
    }
    if ($(this.txtCurrentLocationCaptureInterval).val() != "") {
      this.navigatorJsonObject["currentLocationCaptureInterval"] = $(this.txtCurrentLocationCaptureInterval).val();
    }
    if ($(this.txtMaxDistanceCanCover).val() != "") {
      this.navigatorJsonObject["maxDistanceCanCover"] = $(this.txtMaxDistanceCanCover).val();
    }
    if ($(this.txtScreenOffVoiceMessage).val() != "") {
      this.navigatorJsonObject["screenOffVoiceMessage"] = $(this.txtScreenOffVoiceMessage).val();
    }
    if ($(this.txtInternetCheckVoiceMessage).val() != "") {
      this.navigatorJsonObject["internetCheckVoiceMessage"] = $(this.txtInternetCheckVoiceMessage).val();
    }
    if ($(this.txtStartLineNote).val() != "") {
      this.navigatorJsonObject["startLineNote"] = $(this.txtStartLineNote).val();
    }
    if ($(this.txtLineHeading).val() != "") {
      this.navigatorJsonObject["lineHeading"] = $(this.txtLineHeading).val();
    }
    if ($(this.txtSkipWarningMessage).val() != "") {
      this.navigatorJsonObject["skipWarningMessage"] = $(this.txtSkipWarningMessage).val();
    }
    if ($(this.txtHaltVoiceMessage).val() != "") {
      this.navigatorJsonObject["haltVoiceMessage"] = $(this.txtHaltVoiceMessage).val();
    }
    if ($(this.txtHaltVoiceMessageInterval).val() != "") {
      this.navigatorJsonObject["haltVoiceMessageInterval"] = $(this.txtHaltVoiceMessageInterval).val();
    }
    if ($(this.txtHaltVoiceMessageMinimumTime).val() != "") {
      this.navigatorJsonObject["haltVoiceMessageMinimumTime"] = $(this.txtHaltVoiceMessageMinimumTime).val();
    }
    if ($(this.txtLunchBreakMessage).val() != "") {
      this.navigatorJsonObject["lunchBreakMessage"] = $(this.txtLunchBreakMessage).val();
    }
    if ($(this.txtLunchBreakMessageInterval).val() != "") {
      this.navigatorJsonObject["lunchBreakMessageInterval"] = $(this.txtLunchBreakMessageInterval).val();
    }
    if ($(this.txtReaderDeviceOfflineMessage).val() != "") {
      this.navigatorJsonObject["readerDeviceOfflineMessage"] = $(this.txtReaderDeviceOfflineMessage).val();
    }
    if ($(this.txtScreenOffIntervalTime).val() != "") {
      this.navigatorJsonObject["screenOffIntervalTime"] = $(this.txtScreenOffIntervalTime).val();
    }
    if ($(this.txtMicCapturingTime).val() != "") {
      this.navigatorJsonObject["micCapturingTime"] = $(this.txtMicCapturingTime).val();
    }
    if ($(this.txtMicNotificationTime).val() != "") {
      this.navigatorJsonObject["micNotificationTime"] = $(this.txtMicNotificationTime).val();
    }
    if ($(this.txtMicCapturingRangeInAmp).val() != "") {
      this.navigatorJsonObject["micCapturingRangeInAmp"] = $(this.txtMicCapturingRangeInAmp).val();
    }
    if ($(this.txtMicRecordingStartTime).val() != "") {
      this.navigatorJsonObject["micRecordingStartTime"] = $(this.txtMicRecordingStartTime).val();
    }
    let fileName = "NavigatorSetting.json";
    let path = "/Common/Settings/";
    this.commonService.saveCommonJsonFile(this.navigatorJsonObject, fileName, path);
    this.commonService.setAlertMessage("success", "Navigatory setting updated !!!");
  }

  //Reader

  getCommonReaderSetting() {
    const path = this.firestotagePath + "Common%2FSettings%2FReaderSetting.json?alt=media";
    let readerJsonInstance = this.httpService.get(path).subscribe(readerJsonData => {
      readerJsonInstance.unsubscribe();
      if (readerJsonData != null) {
        this.readerJsonObject = readerJsonData;
        if (readerJsonData["cardScanWaitTime"] != null) {
          $(this.txtCardScanWaitTime).val(readerJsonData["cardScanWaitTime"]);
        }
        if (readerJsonData["cardScanTimeGap"] != null) {
          $(this.txtCardScanTimeGap).val(readerJsonData["cardScanTimeGap"]);
        }
        if (readerJsonData["cardScanNote"] != null) {
          $(this.txtCardScanNote).val(readerJsonData["cardScanNote"]);
        }

      }
    });
  }

  saveCommonReaderSetting() {
    if (this.readerJsonObject == null) {
      this.readerJsonObject = {};
    }
    if ($(this.txtCardScanWaitTime).val() != "") {
      this.readerJsonObject["cardScanWaitTime"] = $(this.txtCardScanWaitTime).val();
    }
    if ($(this.txtCardScanTimeGap).val() != "") {
      this.readerJsonObject["cardScanTimeGap"] = $(this.txtCardScanTimeGap).val();
    }
    if ($(this.txtCardScanNote).val() != "") {
      this.readerJsonObject["cardScanNote"] = $(this.txtCardScanNote).val();
    }
    let fileName = "ReaderSetting.json";
    let path = "/Common/Settings/";
    this.commonService.saveCommonJsonFile(this.readerJsonObject, fileName, path);
    this.commonService.setAlertMessage("success", "Reader setting updated !!!");
  }

  //Halt

  getCityHaltSetting() {
    const path = this.firestotagePath + this.commonService.getFireStoreCity() + "%2FSettings%2FHaltSetting.json?alt=media";
    let haltJsonInstance = this.httpService.get(path).subscribe(haltJsonData => {
      haltJsonInstance.unsubscribe();
      if (haltJsonData != null) {
        this.haltJsonObject = haltJsonData;
        if (haltJsonData["allowedHalt"] != null) {
          $(this.txtAllowedHalt).val(haltJsonData["allowedHalt"]);
        }
        if (haltJsonData["haltAllowedRange"] != null) {
          $(this.txtHaltAllowedRange).val(haltJsonData["haltAllowedRange"]);
        }
        if (haltJsonData["distanceCoveredCheckInterval"] != null) {
          $(this.txtDistanceCoveredCheckInterval).val(haltJsonData["distanceCoveredCheckInterval"]);
        }
        if (haltJsonData["mobileOffAllowedHalt"] != null) {
          $(this.txtMobileOffAllowedHalt).val(haltJsonData["mobileOffAllowedHalt"]);
        }
        if (haltJsonData["networkOffAllowedHalt"] != null) {
          $(this.txtNetworkOffAllowedHalt).val(haltJsonData["networkOffAllowedHalt"]);
        }
        if (haltJsonData["maxHaltAllowed"] != null) {
          $(this.txtMaxHaltAllowed).val(haltJsonData["maxHaltAllowed"]);
        }
        if (haltJsonData["lunchMaxHalt"] != null) {
          $(this.txtLunchMaxHalt).val(haltJsonData["lunchMaxHalt"]);
        }
        if (haltJsonData["lunchAllowedRange"] != null) {
          $(this.txtLunchAllowedRange).val(haltJsonData["lunchAllowedRange"]);
        }
      }
    });
  }

  saveCityHaltSetting() {
    if (this.haltJsonObject == null) {
      this.haltJsonObject = {};
    }
    if ($(this.txtAllowedHalt).val() != "") {
      this.haltJsonObject["allowedHalt"] = $(this.txtAllowedHalt).val();
    }
    if ($(this.txtHaltAllowedRange).val() != "") {
      this.haltJsonObject["haltAllowedRange"] = $(this.txtHaltAllowedRange).val();
    }
    if ($(this.txtDistanceCoveredCheckInterval).val() != "") {
      this.haltJsonObject["distanceCoveredCheckInterval"] = $(this.txtDistanceCoveredCheckInterval).val();
    }
    if ($(this.txtMobileOffAllowedHalt).val() != "") {
      this.haltJsonObject["mobileOffAllowedHalt"] = $(this.txtMobileOffAllowedHalt).val();
    }
    if ($(this.txtNetworkOffAllowedHalt).val() != "") {
      this.haltJsonObject["networkOffAllowedHalt"] = $(this.txtNetworkOffAllowedHalt).val();
    }
    if ($(this.txtMaxHaltAllowed).val() != "") {
      this.haltJsonObject["maxHaltAllowed"] = $(this.txtMaxHaltAllowed).val();
    }
    if ($(this.txtLunchMaxHalt).val() != "") {
      this.haltJsonObject["lunchMaxHalt"] = $(this.txtLunchMaxHalt).val();
    }
    if ($(this.txtLunchAllowedRange).val() != "") {
      this.haltJsonObject["lunchAllowedRange"] = $(this.txtLunchAllowedRange).val();
    }
    let fileName = "HaltSetting.json";
    let path = "/Settings/";
    this.commonService.saveJsonFile(this.haltJsonObject, fileName, path);
    this.commonService.setAlertMessage("success", "Halt setting updated !!!");
  }


  setActiveTab(tab: any) {
    $("#Navigator").hide();
    $("#Reader").hide();
    $("#Halt").hide();
    $("#Salary").hide();

    let element = <HTMLButtonElement>document.getElementById("tabNavigator");
    let className = element.className;
    $("#tabNavigator").removeClass(className);
    $("#tabNavigator").addClass("nav-link");

    element = <HTMLButtonElement>document.getElementById("tabReader");
    className = element.className;
    $("#tabReader").removeClass(className);
    $("#tabReader").addClass("nav-link");

    element = <HTMLButtonElement>document.getElementById("tabHalt");
    className = element.className;
    $("#tabHalt").removeClass(className);
    $("#tabHalt").addClass("nav-link");

    element = <HTMLButtonElement>document.getElementById("tabSalary");
    className = element.className;
    $("#tabSalary").removeClass(className);
    $("#tabSalary").addClass("nav-link");

    if (tab == "Navigator") {
      $("#Navigator").show();
      element = <HTMLButtonElement>document.getElementById("tabNavigator");
      className = element.className;
      $("#tabNavigator").removeClass(className);
      $("#tabNavigator").addClass("nav-link active");

      element = <HTMLButtonElement>document.getElementById("Navigator");
      className = element.className;
      $("#Navigator").removeClass(className);
      $("#Navigator").addClass("tab-pane fade show active save");
    } else if (tab == "Reader") {
      $("#Reader").show();
      element = <HTMLButtonElement>document.getElementById("tabReader");
      className = element.className;
      $("#tabReader").removeClass(className);
      $("#tabReader").addClass("nav-link active");

      element = <HTMLButtonElement>document.getElementById("Reader");
      className = element.className;
      $("#Reader").removeClass(className);
      $("#Reader").addClass("tab-pane fade show active save");
    } else if (tab == "Halt") {
      $("#Halt").show();
      element = <HTMLButtonElement>document.getElementById("tabHalt");
      className = element.className;
      $("#tabHalt").removeClass(className);
      $("#tabHalt").addClass("nav-link active");

      element = <HTMLButtonElement>document.getElementById("Halt");
      className = element.className;
      $("#Halt").removeClass(className);
      $("#Halt").addClass("tab-pane fade show active save");
    } else if (tab == "Salary") {
      $("#Salary").show();
      element = <HTMLButtonElement>document.getElementById("tabSalary");
      className = element.className;
      $("#tabSalary").removeClass(className);
      $("#tabSalary").addClass("nav-link active");

      element = <HTMLButtonElement>document.getElementById("Salary");
      className = element.className;
      $("#Salary").removeClass(className);
      $("#Salary").addClass("tab-pane fade show active save");
    }
  }

}
