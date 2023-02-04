import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
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
  divLoaderCounts = "#divLoaderCounts";
  constructor(public fs: FirebaseService, public commonService: CommonService, private httpService: HttpClient, private modalService: NgbModal) { }
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getLastUpdate();
    this.getSurviorSummary();
  }

  getLastUpdate() {
    this.lastUpdatedTime = "---";
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FMarkingSurviorSummary%2FlastUpdated.json?alt=media"
    let lastUpdateInstance = this.httpService.get(path).subscribe((data) => {
      lastUpdateInstance.unsubscribe();
      if (data != null) {
        this.lastUpdatedTime = data["updateDateTime"].toString();
      }
    });
  }

  getSurviorSummary() {
    this.supervisorList = [];
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FMarkingSurviorSummary%2FmarkingSurviorDetail.json?alt=media"
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
      let list = detail.detailList;
      for (let i = 0; i < list.length; i++) {
        if (list[i]["approveDate"] != null) {
          let date = list[i]["approveDate"].split(" ")[0];
          let timeStemp=new Date(date).getTime();
          let supervisordetail = this.superviosorDetailList.find(item => item.date == date);
          if (supervisordetail == undefined) {
            this.superviosorDetailList.push({ date: date, counts: 1,timeStemp });
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
    this.supervisorJsonList = [];
    $(this.divLoaderCounts).show();
    let dbPath = "EntityMarkingData/MarkedHouses/";
    let supervisorInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      supervisorInstance.unsubscribe();
      if (data != undefined) {
        let keyArray = Object.keys(data);
        for (let i = 0; i <= keyArray.length; i++) {
          let ward = keyArray[i];
          let wardData = data[ward];
          if (wardData != null) {
            let keyArray1 = Object.keys(wardData);
            for (let j = 0; j <= keyArray1.length; j++) {
              let line = keyArray1[j];
              let lineData = wardData[line];
              if (lineData != null) {
                let keyArray2 = Object.keys(lineData);
                for (let k = 0; k <= keyArray2.length; k++) {
                  let marker = keyArray2[k];
                  let markerData = lineData[marker];
                  if (markerData != null) {
                    if (markerData["approveById"] != null && markerData["approveDate"] != null) {
                      let supervisorId = markerData["approveById"];
                      let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
                      let supervisorIdDetail = userList.find(item => item.userId == supervisorId);
                      let supervisorName = supervisorIdDetail.name;
                      let image = markerData["image"];
                      let houseType = markerData["houseType"];
                      let approveDate = markerData["approveDate"];
                      let detail = this.supervisorJsonList.find(item => item.supervisorId == supervisorId)
                      if (detail == undefined) {
                        let detailList = [];
                        detailList.push({ supervisorId: supervisorId, approveDate: approveDate, image: image, houseType: houseType, ward: ward, line: line })
                        this.supervisorJsonList.push({ supervisorId: supervisorId, supervisorName: supervisorName, counts: 1, detailList: detailList })
                      }
                      else {
                        detail.counts = detail.counts + 1;
                        detail.detailList.push({ supervisorId: supervisorId, approveDate: approveDate, image: image, houseType: houseType, ward: ward, line: line });
                      }
                    }

                  }
                }
              }
            }
          }
        }
        let fileName = "markingSurviorDetail.json";
        let filePath = "/MarkingSurviorSummary/";
        this.commonService.saveJsonFile(this.supervisorJsonList, fileName, filePath);
        let updateDateTime = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
        const updateData = {
          updateDateTime: updateDateTime
        }
        fileName = "lastUpdated.json";
        filePath = "/MarkingSurviorSummary/";
        this.commonService.saveJsonFile(updateData, fileName, filePath);
        this.lastUpdatedTime = updateDateTime;
        setTimeout(() => {
          this.getSurviorSummary();
          this.commonService.setAlertMessage("success", "Supervisor data updated successfully !!!");
          $(this.divLoaderCounts).hide();
        }, 300);
      }
    });
  }
}
