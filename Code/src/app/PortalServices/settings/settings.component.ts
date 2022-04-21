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
// Navigator
  txtFirstStartPointRange = "#txtFirstStartPointRange";
  txtLineEndPointRange = "#txtLineEndPointRange";
  txtCurrentLocationCaptureInterval = "#txtCurrentLocationCaptureInterval";
  txtMaxDistanceCanCover = "#txtMaxDistanceCanCover";
  txtTraversalPathDuration = "#txtTraversalPathDuration";
  txtInternetCheckInterval="#txtInternetCheckInterval";
  txtScreenOffVoiceMessage="#txtScreenOffVoiceMessage";
  txtInternetCheckVoiceMessage="#txtInternetCheckVoiceMessage";
  txtStartLineNote="#txtStartLineNote";
  txtLineHeading="#txtLineHeading";
  txtSkipWarningMessage="#txtSkipWarningMessage";
  txtHaltVoiceMessage="#txtHaltVoiceMessage";
  txtHaltVoiceMessageInterval="#txtHaltVoiceMessageInterval";
  txtHaltVoiceMessageMinimumTime="#txtHaltVoiceMessageMinimumTime";


  // Reader
  txtCapturingGap = "#txtCapturingGap";
  txtCardScanWaitTime="#txtCardScanWaitTime";
  txtCardScanTimeGap="#txtCardScanTimeGap";
  txtCardScanNote="#txtCardScanNote";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.firestotagePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.getCommonNavigatorSetting();
    this.getCommonReaderSetting();
  }

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
        if (navigetorJsonData["traversalPathDuration"] != null) {
          $(this.txtTraversalPathDuration).val(navigetorJsonData["traversalPathDuration"]);
        }
        if (navigetorJsonData["capturingGap"] != null) {
          $(this.txtCapturingGap).val(navigetorJsonData["capturingGap"]);
        }
        if (navigetorJsonData["internetCheckInterval"] != null) {
          $(this.txtInternetCheckInterval).val(navigetorJsonData["internetCheckInterval"]);
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
    if ($(this.txtTraversalPathDuration).val() != "") {
      this.navigatorJsonObject["traversalPathDuration"] = $(this.txtTraversalPathDuration).val();
    }
    if ($(this.txtCapturingGap).val() != "") {
      this.navigatorJsonObject["capturingGap"] = $(this.txtCapturingGap).val();
    }
    if ($(this.txtInternetCheckInterval).val() != "") {
      this.navigatorJsonObject["internetCheckInterval"] = $(this.txtInternetCheckInterval).val();
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
    let fileName = "NavigatorSetting.json";
    let path = "/Common/Settings/";
    this.commonService.saveCommonJsonFile(this.navigatorJsonObject, fileName, path);
    this.commonService.setAlertMessage("success", "Navigatory setting updated !!!");
  }

  getCommonReaderSetting(){
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

  saveCommonReaderSetting(){
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

  
  setActiveTab(tab: any) {
    $("#Navigator").hide();
    $("#Reader").hide();

    let element = <HTMLButtonElement>document.getElementById("tabNavigator");
    let className = element.className;
    $("#tabNavigator").removeClass(className);
    $("#tabNavigator").addClass("nav-link");

    element = <HTMLButtonElement>document.getElementById("tabReader");
    className = element.className;
    $("#tabReader").removeClass(className);
    $("#tabReader").addClass("nav-link");

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
    }
  }

}
