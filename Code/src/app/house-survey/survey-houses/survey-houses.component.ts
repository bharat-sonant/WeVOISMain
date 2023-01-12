import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-survey-houses',
  templateUrl: './survey-houses.component.html',
  styleUrls: ['./survey-houses.component.scss']
})
export class SurveyHousesComponent implements OnInit {
  wardList: any[] = [];
  surveydHouseList: any[] = [];
  cityName: any;
  db: any;
  surveyData: surveyDatail = {
    totalMarkers: 0,
    totalSurveyed: 0,
    totalHouses: 0,
    totalResidential: 0,
    totalCommercial: 0
  };
  constructor(public fs: FirebaseService, private commonService: CommonService) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.getHouseSummary();
    this.getWardProgressList();

  }
  getWardProgressList() {
    this.wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.surveydHouseList = [];
    if (this.wardList.length > 0) {
      for (let i = 0; i < this.wardList.length; i++) {
        let wardNo = this.wardList[i]["zoneNo"];
        this.surveydHouseList.push({ wardNo: wardNo, markers: 0, surveyed: 0, houses: 0, revisit: 0, oldCard: 0, status: "", already: 0, nameNotCorrect: 0, houseHold: '', complex: '' });
        this.getWardSurveyedHouses(wardNo);
      }
    }
  }
  getHouseSummary() {
    let dbPath = "EntitySurveyData/SurveyedHouses/Summary";
    let summaryInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        summaryInstance.unsubscribe();
        if (data != null) {
          this.surveyData.totalMarkers = data["markers"];
          this.surveyData.totalSurveyed = data["surveyed"];
          this.surveyData.totalResidential = data["residential"];
          this.surveyData.totalCommercial = data["commercial"];
          this.surveyData.totalHouses = data["houses"];
        }
      }
    );
  }

  getWardSurveyedHouses(wardNo: any) {
    let dbPath = "EntitySurveyData/SurveyedHouses/WardWise/" + wardNo;
    let wardInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        wardInstance.unsubscribe();
        if (data != null) {
          let detail = this.surveydHouseList.find(item => item.wardNo == wardNo);
          if (detail != undefined) {
            detail.markers = data["markers"];
            detail.surveyed = data["cards"];
            detail.houses = data["houses"];
            detail.revisit = data["revisit"];
            detail.complex = data["complex"];
            detail.houseHold = data["houseInComplex"];
          }
        }

      }
    );
  }



}


export class surveyDatail {
  totalMarkers: number;
  totalSurveyed: number;
  totalResidential: number;
  totalCommercial: number;
  totalHouses: number;
}
