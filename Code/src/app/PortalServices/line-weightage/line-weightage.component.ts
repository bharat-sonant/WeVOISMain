import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-line-weightage',
  templateUrl: './line-weightage.component.html',
  styleUrls: ['./line-weightage.component.scss']
})
export class LineWeightageComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  selectedZone: any;
  zoneList: any[] = [];
  lineList: any[];
  todayDate: any;
  totalLines: any;
  totalWardLength: any;
  divLoader = "#divLoader";
  lineWeightageWards: any[] = [];
  chkAllow = "chkAllow";

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
    this.getLineWeightageWards();
    this.clearData();
  }

  getLineWeightageWards() {
    this.lineWeightageWards = JSON.parse(localStorage.getItem("wardForLineWeightage"));
  }

  setZoneAllowed() {
    if ((<HTMLInputElement>document.getElementById(this.chkAllow)).checked == false) {
      this.lineWeightageWards = this.lineWeightageWards.filter(item => item.zoneNo != this.selectedZone);
    }
    else {
      this.lineWeightageWards.push({ zoneNo: this.selectedZone });
    }
    localStorage.setItem("wardForLineWeightage", JSON.stringify(this.lineWeightageWards));
    this.saveWardForLineWeightage();
  }

  saveWardForLineWeightage() {
    let updateArray = [];
    for (let i = 0; i < this.lineWeightageWards.length; i++) {
      updateArray.push(this.lineWeightageWards[i]["zoneNo"]);
    }
    let filePath = "/WardLineWeightageJson/";
    let fileName = "wardLineWeightageAllowed.json";
    this.commonService.saveJsonFile(updateArray, fileName, filePath);
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
      this.getLineWeightage();
      let wardDetail = this.lineWeightageWards.find(item => item.zoneNo == this.selectedZone);
      if (wardDetail != undefined) {
        (<HTMLInputElement>document.getElementById(this.chkAllow)).checked = true;
      }

    }
  }

  getLineWeightage() {
    $(this.divLoader).show();
    this.commonService.getWardLineWeightage(this.selectedZone, this.todayDate).then((lineWeightageList: any) => {
      this.totalLines = lineWeightageList[lineWeightageList.length - 1]["totalLines"];
      for (let i = 0; i < lineWeightageList.length - 1; i++) {
        this.lineList.push({ lineNo: lineWeightageList[i]["lineNo"], weightage: lineWeightageList[i]["weightage"] });
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

    let updateList = [];
    for (let i = 0; i < this.lineList.length; i++) {
      updateList.push({ lineNo: this.lineList[i]["lineNo"], weightage: this.lineList[i]["weightage"] });
    }
    updateList.push({ totalLines: this.totalLines });

    let filePath = "/WardLineWeightageJson/" + this.selectedZone + "/";
    let fileName = this.todayDate + ".json";
    this.commonService.saveJsonFile(updateList, fileName, filePath);
    this.updateLineWeightageUpdateJson();
  }

  updateLineWeightageUpdateJson() {
    this.commonService.getWeightageUpdateHistoryJson(this.selectedZone).then((updateData: any) => {
      let dateArray = [];
      let updateArray = [];
      if (updateData == null) {
        updateArray.push(this.todayDate);
      }
      else {

        updateArray = JSON.parse(updateData);
        let isDate = false;
        for (let i = 0; i < updateArray.length; i++) {
          if (updateArray[i] == this.todayDate) {
            isDate = true;
            i = updateArray.length;
          }
        }
        if (isDate == false) {
          updateArray.push(this.todayDate);
        }
        for (let i = 0; i < updateArray.length; i++) {
          let timeStamp = new Date(updateArray[i]).getTime();
          dateArray.push({ date: updateArray[i], timeStamp: timeStamp });
        }
        dateArray = dateArray.sort((a, b) => b.timeStamp < a.timeStamp ? 1 : -1);
        updateArray = [];
        for (let i = 0; i < dateArray.length; i++) {
          updateArray.push(dateArray[i]["date"]);
        }
      }


      let filePath = "/WardLineWeightageJson/" + this.selectedZone + "/";
      let fileName = "weightageUpdateHistoryJson.json";
      this.commonService.saveJsonFile(updateArray, fileName, filePath);
      this.commonService.setAlertMessage("success", "Ward Lines Weightage update !!!");
    });
  }

  clearData() {
    (<HTMLInputElement>document.getElementById(this.chkAllow)).checked = false;
    this.lineList = [];
    this.totalLines = 0;
  }
}
