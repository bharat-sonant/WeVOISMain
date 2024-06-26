import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-remove-deleted-scancards',
  templateUrl: './remove-deleted-scancards.component.html',
  styleUrls: ['./remove-deleted-scancards.component.scss']
})
export class RemoveDeletedScancardsComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  cityName: any;
  db: any;
  public selectedZone: any;
  zoneList: any[];
  markerList: any[];
  ddlZone = "#ddlZone";
  divLoaderLineMove = "#divLoaderLineMove";
  toDayDate: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    //this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }
  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getZones();
  }
  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  removeDeletedCards() {
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Ward");
      return;
    }
    let checkDate = "2022-10-01";
    let removedCardList = [];
    this.selectedZone = $(this.ddlZone).val();
    let dbPath = "EntitySurveyData/RemovedCards/" + this.selectedZone;
    let removedCardsInstance = this.db.object(dbPath).valueChanges().subscribe(
      removeCardData => {
        removedCardsInstance.unsubscribe();
        if (removeCardData != null) {
          let keyArray = Object.keys(removeCardData);
          for (let i = 0; i < keyArray.length; i++) {
            let cardNo = keyArray[i];
            let date = removeCardData[cardNo];
            removedCardList.push({ cardNo: cardNo, date: date });
          }
          this.getScanedCards(checkDate);
        }
      }
    );
  }

  getScanedCards(checkDate: any) {
    if (new Date(checkDate) > new Date(this.toDayDate)) {

    }
    else {
      let year = checkDate.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(checkDate.split('-')[1]) - 1);
      let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + checkDate;
      let cardScanInstence = this.db.object(dbPath).valueChanges().subscribe(data => {
        cardScanInstence.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let cardNo = keyArray[i];
              if (cardNo.includes("MNZ")) {
                

              }
            }

          }
        }
        checkDate = this.commonService.getNextDate(checkDate, 1);
        this.getScanedCards(checkDate);
      });
    }
  }





}
