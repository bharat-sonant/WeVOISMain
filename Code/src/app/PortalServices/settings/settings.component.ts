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

  txtFirstStartPointRange = "#txtFirstStartPointRange";
  txtLineEndPointRange = "#txtLineEndPointRange";
  txtCurrentLocationCaptureInterval = "#txtCurrentLocationCaptureInterval";
  txtMaxDistanceCanCover = "#txtMaxDistanceCanCover";
  txtTraversalPathDuration = "#txtTraversalPathDuration";
  txtCapturingGap = "#txtCapturingGap";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.firestotagePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.getCommonNavigatorSetting();
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
    let fileName = "NavigatorSetting.json";
    let path = "/Common/Settings/";
    this.commonService.saveCommonJsonFile(this.navigatorJsonObject, fileName, path);
    this.commonService.setAlertMessage("success", "Navigatory setting updated !!!");
  }

}
