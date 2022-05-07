import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-line-weightage',
  templateUrl: './line-weightage.component.html',
  styleUrls: ['./line-weightage.component.scss']
})
export class LineWeightageComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  selectedZone: any;
  zoneList: any[] = [];
  lineList: any[];
  todayDate: any;
  totalLines: any;
  divLoader="#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedZone = "0";
    this.todayDate = this.commonService.setTodayDate();
    this.getZones();
    this.clearData();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["zoneName"] = "--Select Zone--";
  }

  changeZoneSelection(filterVal: any) {
    this.clearData();
    this.selectedZone = filterVal;
    if (this.selectedZone != "0") {
$(this.divLoader).show();
      this.getWardLines();
    }
  }

  getWardLines() {
    this.commonService.getWardLine(this.selectedZone, this.todayDate).then((linesData: any) => {
      this.getWardLineWeightage(JSON.parse(linesData));
    });
  }

  getWardLineWeightage(wardLinesDataObj: any) {
    let keyArray = Object.keys(wardLinesDataObj);
    this.totalLines = wardLinesDataObj["totalLines"];
    let weightage = (1 / this.totalLines) * 100;
    this.commonService.getWardLineWeightageJson(this.selectedZone).then((jsonData: any) => {
      if (jsonData != null) {
        this.lineList=JSON.parse(JSON.stringify(jsonData));
      }
      else {
        for (let i = 0; i < keyArray.length - 3; i++) {
          let lineNo = Number(keyArray[i]);
          this.lineList.push({ lineNo: lineNo, weightage: weightage });
        }
      }
      $(this.divLoader).hide();
    });
  }

  saveWeightage() {
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    let isAll = true;
    for (let i = 0; i < this.lineList.length; i++) {
      if ($("#txt" + this.lineList[i]["lineNo"]).val() == "") {
        isAll = false;
        i = this.lineList.length;
      }
      else {
        this.lineList[i]["weightage"] = $("#txt" + this.lineList[i]["lineNo"]).val();
      }
    }
    if (isAll == false) {
      this.commonService.setAlertMessage("error", "Please fill all lines weightage !!!");
      return;
    }
    let filePath = "/WardLinesWeightageJson/";
    let fileName = this.selectedZone + ".json";
    this.commonService.saveJsonFile(this.lineList, fileName, filePath);
    this.commonService.setAlertMessage("success", "Ward Lines Weightage update !!!");
  }

  clearData() {
    this.lineList = [];
    this.totalLines = 0;
  }
}
