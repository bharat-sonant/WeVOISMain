import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';


import { MarkerMappingService } from '../../services/marker/marker-mapping.service';
@Component({
  selector: 'app-supervisor-report',
  templateUrl: './supervisor-report.component.html',
  styleUrls: ['./supervisor-report.component.scss']
})
export class SupervisorReportComponent implements OnInit {
  db: any
  cityName: any;
  supervisorJsonList: any[] = [];
  supervisorList: any[] = [];
  superviosorDetailList: any[] = [];
  currentDateList: any[] = [];
  lastUpdatedTime: any;
  supervisorName: any;
  supervisorCount: any;
  divLoaderCounts = "#divLoaderCounts";
  serviceName = "supervisor-report";

  // grid and list view
  isGridView: boolean = false;


  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, public commonService: CommonService, private httpService: HttpClient, private modalService: NgbModal, private markerMapping: MarkerMappingService) { }
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("Survey-Management", "Supervisor-Report", localStorage.getItem("userID"));
    this.getLastUpdate();
    this.getSurviorSummary();
  }

  getLastUpdate() {
    this.lastUpdatedTime = "---";
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FMarkingSurviorSummary%2FlastUpdated.json?alt=media"
    let lastUpdateInstance = this.httpService.get(path).subscribe((data) => {
      lastUpdateInstance.unsubscribe();
      if (data != null) {
        this.lastUpdatedTime = data["updateDateTime"].toString();
      }
    });
  }

  getSurviorSummary() {
    this.supervisorList = [];

    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FMarkingSurviorSummary%2FmarkingSurviorDetail.json?alt=media"
    let surviorInstance = this.httpService.get(path).subscribe((surviordata) => {
      surviorInstance.unsubscribe();
      if (surviordata != null) {
        let keyArray = Object.keys(surviordata);
        for (let i = 0; i < keyArray.length; i++) {
          let key = keyArray[i];
          let supervisorName = surviordata[key]["supervisorName"];
          let approvedMarkers = surviordata[key]["counts"];
          let detailList = surviordata[key]["detailList"];
          let supervisorId = surviordata[key]["supervisorId"];
          this.supervisorList.push({ supervisorId: supervisorId, supervisorName: supervisorName, counts: approvedMarkers, key: key, detailList: detailList });

        }
        this.supervisorList = this.commonService.transformNumeric(this.supervisorList, "supervisorName");
        setTimeout(() => {
          $("#tr0").addClass("active");
          this.showSurviorDetail(this.supervisorList[0]["supervisorId"], 0);
        }, 200);
      }
    })
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.supervisorList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        $("#tr" + i).removeClass(className);
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }

  showSurviorDetail(supervisorId: any, index: any) {
    this.setActiveClass(index);
    this.superviosorDetailList = [];
    let detail = this.supervisorList.find(item => item.supervisorId == supervisorId);
    if (detail != undefined) {
      this.supervisorName = detail.supervisorName;
      this.supervisorCount = detail.counts
      let list = detail.detailList;
      for (let i = 0; i < list.length; i++) {
        if (list[i]["approveDate"] != null) {
          let date = list[i]["approveDate"].split(" ")[0];
          let showDate = date.split("-")[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split("-")[1])) + " " + date.split("-")[0];
          let timeStemp = new Date(date).getTime();
          let supervisordetail = this.superviosorDetailList.find(item => item.date == date);
          if (supervisordetail == undefined) {
            this.superviosorDetailList.push({ date: date, showDate: showDate, counts: 1, timeStemp });
            this.superviosorDetailList.sort((a, b) => Number(b.timeStemp) < Number(a.timeStemp) ? 1 : -1);
          }
          else {
            supervisordetail.counts = supervisordetail.counts + 1;
          }
        }
      }
    }
  }

  updateSupervisorReport() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateSupervisorReport");
    this.supervisorJsonList = [];
    $(this.divLoaderCounts).show();
    // Ye report POORE shehar ke approve hue markers ki hai, isliye yahan har
    // marker ka record sach me chahiye - is ek jagah full read jaayaz hai.
    //
    // Pehle iske saath mapping (WardWise + LineWise) bhi padhi jaati thi taaki
    // ward/line pata chale. Ab uski zaroorat nahi: record khud apna ward, line
    // aur markerNo rakhta hai. Isse do bade index reads bach jaate hain aur
    // teen nested loop ek loop me aa jaate hain.
    let markersInstance = this.db.object("EntityMarkingData/MarkersData").valueChanges().subscribe((markersData: any) => {
      markersInstance.unsubscribe();
      if (markersData == null) { markersData = {}; }
      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateSupervisorReport", markersData);
      let uidArray = Object.keys(markersData);
      for (let i = 0; i < uidArray.length; i++) {
        let markerData = markersData[uidArray[i]];
        // MarkersData ke neeche sirf marker record hain - koi scalar aa jaaye
        // to wo marker nahi hai.
        if (markerData == null || typeof markerData != "object") {
          continue;
        }
        // Report sirf approve ho chuke markers ki hai.
        if (markerData["approveById"] == null || markerData["approveDate"] == null) {
          continue;
        }
        // ward/line record ke andar se - pehle ye mapping se aate the.
        let ward = markerData["ward"];
        let line = markerData["line"];
        let supervisorId = markerData["approveById"];
        let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
        let supervisorIdDetail = userList.find(item => item.userId == supervisorId);
        // Supervisor userList me na mile to id hi dikha do - pehle yahan
        // undefined par crash ho jaata tha.
        let supervisorName = supervisorIdDetail != undefined ? supervisorIdDetail.name : supervisorId;
        let image = markerData["image"];
        let houseType = markerData["houseType"];
        let approveDate = markerData["approveDate"];
        let detail = this.supervisorJsonList.find(item => item.supervisorId == supervisorId);
        if (detail == undefined) {
          let detailList = [];
          detailList.push({ supervisorId: supervisorId, approveDate: approveDate, image: image, houseType: houseType, ward: ward, line: line });
          this.supervisorJsonList.push({ supervisorId: supervisorId, supervisorName: supervisorName, counts: 1, detailList: detailList });
        }
        else {
          detail.counts = detail.counts + 1;
          detail.detailList.push({ supervisorId: supervisorId, approveDate: approveDate, image: image, houseType: houseType, ward: ward, line: line });
        }
      }
      let fileName = "markingSurviorDetail.json";
      let filePath = "/MarkingSurviorSummary/";
      this.commonService.saveJsonFile(this.supervisorJsonList, fileName, filePath);
      let updateDateTime = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
      const updateData = {
        updateDateTime: updateDateTime
      };
      fileName = "lastUpdated.json";
      filePath = "/MarkingSurviorSummary/";
      this.commonService.saveJsonFile(updateData, fileName, filePath);
      this.lastUpdatedTime = updateDateTime;
      setTimeout(() => {
        this.getSurviorSummary();
        this.commonService.setAlertMessage("success", "Supervisor data updated successfully !!!");
        $(this.divLoaderCounts).hide();
      }, 300);
    });
  }
}


