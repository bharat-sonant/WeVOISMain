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
  divLoader = "#divLoader";

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
      this.getLineWeightage();
    }
  }

  getLineWeightage(){
    this.commonService.getWardLineWeightage(this.selectedZone,this.todayDate).then((lineWeightageList: any) => {
      for(let i=0;i<lineWeightageList.length-1;i++){
        this.lineList.push({lineNo:lineWeightageList[i]["lineNo"],weightage:lineWeightageList[i]["weightage"]});
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
