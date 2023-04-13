import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-wardwise-scan-card',
  templateUrl: './wardwise-scan-card.component.html',
  styleUrls: ['./wardwise-scan-card.component.scss']
})
export class WardwiseScanCardComponent implements OnInit {

  constructor(public fs: FirebaseService, private http: HttpClient, public actRoute: ActivatedRoute, private commonService: CommonService) { }
  zoneList: any[] = [];
  cardList: any[];
  db: any;
  cityName: any;
  todayDate: any;
  selectedDate: any;
  selectedZone: any;
  selectedYear: any;
  selectedMonthName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.todayDate = this.commonService.setTodayDate();
    this.selectedDate = this.todayDate;
    this.getZoneList();
  }

  getZoneList() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.selectedZone = "0";
  }

  changeSelection() {
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if (new Date(this.selectedDate) > new Date(this.todayDate)) {
      this.commonService.setAlertMessage("error", "Date can not be more than today date !!!");
      return;
    }
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let houseCollectionInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        houseCollectionInstance.unsubscribe();
        console.log(data);
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let cardNo = keyArray[i];
            if (cardNo.includes("Scanned") || cardNo.includes("ImagesData")) {

            }
            else {
              console.log(cardNo);
            }
          }
        }
      }
    );
  }

}
