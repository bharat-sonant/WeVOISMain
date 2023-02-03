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
  currentDateList:any[]=[];
  constructor(public fs: FirebaseService, public commonService: CommonService, private httpService: HttpClient, private modalService: NgbModal) { }
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getSurviorSummary();
    this.saveCurrentDateTime();


  }
  updateSupervisorReport() {
    this.supervisorJsonList=[];
    let dbPath = "EntityMarkingData/MarkedHouses/";
    let supervisorInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      supervisorInstance.unsubscribe();
      let keyArray = Object.keys(data);
      for (let i = 0; i <= keyArray.length; i++) {
        let ward = keyArray[i];
        let wardData = data[ward];
        if (wardData != null) {
          let keyArray1 = Object.keys(wardData)
          for (let j = 0; j <= keyArray1.length; j++) {
            let line = keyArray1[j];
            let lineData = wardData[line];
            if (lineData != null) {
              let keyArray2 = Object.keys(lineData);
              for (let k = 0; k <= keyArray2.length; k++) {
                let marker = keyArray2[k];
                let markerData = lineData[marker];
                let detailList = [];
                if (markerData != null) {
                  if (markerData["approveById"] != null) {
                    let supervisorId = markerData["approveById"];
                    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
                    let supervisorIdDetail = userList.find(item => item.userId == supervisorId);
                    let supervisorName = supervisorIdDetail.name;
                    let image = markerData["image"];
                    let houseType = markerData["houseType"];
                    let approveDate = markerData["approveDate"];
                    let counts = 1;
                    let detail = this.supervisorJsonList.find(item => item.supervisorId == supervisorId)
                    if (detail == undefined) {
                      detailList.push({ image: image, houseType: houseType, ward: ward, line: line, approveDate: approveDate })
                      this.supervisorJsonList.push({ supervisorId: supervisorId, supervisorName: supervisorName, counts: counts, detailList: detailList })

                    }
                    else {
                      detail.counts += 1;
                      detailList = detail.detailList;
                      detailList.push({ image: image, houseType: houseType, ward: ward, line: line, approveDate: approveDate });
                      detail.detailList = detailList;
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
      this.getSurviorSummary();
      this.saveCurrentDateTime();

     

    });
  }
 
  getSurviorSummary() {
    this.supervisorList=[];
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FMarkingSurviorSummary%2FmarkingSurviorDetail.json?alt=media"
    let surviorInstance = this.httpService.get(path).subscribe((surviordata) => {
      surviorInstance.unsubscribe();
      let keyArray = Object.keys(surviordata);
      for (let i = 0; i < keyArray.length; i++) {
        let key = keyArray[i];
        let supervisorName = surviordata[key]["supervisorName"];
        let approvedMarkers = surviordata[key]["counts"];
        let detailList = surviordata[key]["detailList"];
        this.supervisorList.push({ supervisorName: supervisorName, counts: approvedMarkers, key: key, detailList: detailList })
      }

    })
  }
saveCurrentDateTime(){
    this.currentDateList=[];
    let currentDate = localStorage.getItem("loginDate");
    let currentTime=this.commonService.getCurrentTime();
    this.currentDateList.push({currentDate:currentDate,currentTime:currentTime});
    let fileName = "upDate.json";
    let filePath = "/MarkingSurviorSummary/";
    this.commonService.saveJsonFile(this.currentDateList, fileName, filePath);
    
  }
  showSurviorDetail(content: any, supervisorId: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 870;
    let width = 500;
    height = (windowHeight * 80) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 140 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
    let detail = this.supervisorList.find(item => item.supervisorId == supervisorId);
    if (detail != undefined) {
      let list = detail.detailList;
      for (let i = 0; i <= list.length; i++) {
        if (list[i]["approveDate"] != null) {
          let date = list[i]["approveDate"];
          let supervisordetail = this.superviosorDetailList.find(item => item.date == date);
          if (supervisordetail == undefined) {
            this.superviosorDetailList.push({ date: date, counts: 1 });
          }
          else {
            supervisordetail.counts += 1;
          }
        }
      }
    }
  }



  closeModel() {
    this.modalService.dismissAll();
  }
}
