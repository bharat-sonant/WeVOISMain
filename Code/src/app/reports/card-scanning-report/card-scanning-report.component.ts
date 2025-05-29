import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-card-scanning-report',
  templateUrl: './card-scanning-report.component.html',
  styleUrls: ['./card-scanning-report.component.scss']
})
export class CardScanningReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, public httpService: HttpClient, private commonService: CommonService) { }

  wardList: any[];
  selectedDate: any;
  scannedList: any;
  isFirst = true;
  db: any;
  public cityName: any;
  txtDate = "#txtDate";
  serviceName = "card-scanning-report";
  userType: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userType = localStorage.getItem("userType");
    this.commonService.savePageLoadHistory("General-Reports", "Card-Scanning-Report", localStorage.getItem("userID"));
    this.setDefaults();
  }

  setDefaults() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    $(this.txtDate).val(this.selectedDate);
    this.getWards();
  }

  getWards() {
    this.wardList = [];
    this.wardList = JSON.parse(localStorage.getItem("latest-zones"));
    this.scannedList = [];
    if (this.wardList.length > 0) {
      for (let i = 1; i < this.wardList.length; i++) {
        if (!this.wardList[i]["zoneNo"].includes("Commercial") && !this.wardList[i]["zoneNo"].includes("Dummy")) {
          let ward = this.wardList[i]["zoneNo"];
          this.scannedList.push({ ward: this.wardList[i]["zoneNo"], cards: '', scanned: '', percentage: '' });
          this.getCardsData(ward);
        }
      }
    }
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.clearAllData();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  clearAllData() {
    if (this.scannedList.length > 0) {
      for (let i = 0; i < this.scannedList.length; i++) {
        this.scannedList[i]["cards"] = "";
        this.scannedList[i]["scanned"] = "";
        this.scannedList[i]["percentage"] = "";
        this.getCardsData(this.scannedList[i]["ward"]);
      }
    }
  }

  getCardsData(ward: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getCardsData");
    let dbPath = "EntitySurveyData/TotalHouseCount/" + ward;
    let houseCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseCountData => {
        houseCountInstance.unsubscribe();
        if (houseCountData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getCardsData", houseCountData);
          let detail = this.scannedList.find(item => item.ward == ward);
          if (detail != undefined) {
            detail.cards = Number(houseCountData);
            this.getScannedCardsNew(ward);
          }
        }
        else {
          this.commonService.getWardLine(ward, this.selectedDate).then((linesData: any) => {
            let wardLinesDataObj = JSON.parse(linesData);
            let detail = this.scannedList.find(item => item.ward == ward);
            if (detail != undefined) {
              detail.cards = wardLinesDataObj["totalHouseCount"];
              this.getScannedCardsNew(ward);
            }
          });
        }
      }
    );

  }

  getScannedCards(ward: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getScannedCards");
    let year = this.selectedDate.split('-')[0];
    let monthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    let dbPath = "HousesCollectionInfo/" + ward + "/" + year + "/" + monthName + "/" + this.selectedDate + "/totalScanned";
    let scannedCardsInstance = this.db.object(dbPath).valueChanges().subscribe(
      totalScanned => {
        scannedCardsInstance.unsubscribe();
        if (totalScanned != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScannedCards", totalScanned);
          let detail = this.scannedList.find(item => item.ward == ward);
          if (detail != undefined) {
            detail.scanned = totalScanned;
            if (Number(detail.scanned) > Number(detail.cards)) {
              detail.scanned = detail.cards;
            }
            let scanPercentage = ((Number(detail.scanned) / Number(detail.cards)) * 100);
            if (!isNaN(scanPercentage)) {
              detail.percentage = scanPercentage.toFixed(0);
            }
          }
        }
      }
    );
  }


  getScannedCardsNew(ward: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getScannedCards");
    let year = this.selectedDate.split('-')[0];
    let monthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    let dbPath = "HousesCollectionInfo/" + ward + "/" + year + "/" + monthName + "/" + this.selectedDate;
    let scannedCardsInstance = this.db.object(dbPath).valueChanges().subscribe(
      scannedCardObj => {
        scannedCardsInstance.unsubscribe();
        if (scannedCardObj != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getScannedCards", scannedCardObj);
          let scannedCardCount = 0;
          if (this.userType == "External User") {
            scannedCardCount = scannedCardObj["totalScanned"];
          }
          else {

            let keyArray = Object.keys(scannedCardObj);

            for (let i = 0; i < keyArray.length; i++) {
              let cardNo = keyArray[i];
              if (cardNo != "ImagesData") {
                if (cardNo != "recentScanned") {
                  if (cardNo != "totalScanned") {
                    if (scannedCardObj[cardNo]["scanBy"] != "-1")
                      scannedCardCount++;
                  }
                }
              }
            }
          } 
          let detail = this.scannedList.find(item => item.ward == ward);
          if (detail != undefined) {
            detail.scanned = scannedCardCount;
            if (Number(detail.scanned) > Number(detail.cards)) {
              detail.scanned = detail.cards;
            }
            let scanPercentage = ((Number(detail.scanned) / Number(detail.cards)) * 100);
            if (!isNaN(scanPercentage)) {
              detail.percentage = scanPercentage.toFixed(0);
            }
          }
        }
      }
    );
  }

  exportToExcel() {
    if (this.scannedList.length > 0) {
      let htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>Ward";
      htmlString += "</td>";
      htmlString += "<td>Cards";
      htmlString += "</td>";
      htmlString += "<td>Scanned Cards";
      htmlString += "</td>";
      htmlString += "<td>Scan (%)";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.scannedList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.scannedList[i]["ward"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.scannedList[i]["cards"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.scannedList[i]["scanned"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.scannedList[i]["percentage"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let exportDate = this.selectedDate.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split('-')[1])) + " " + this.selectedDate.split('-')[0]
      let fileName = "Card-Scan-Report [" + exportDate + "].xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}
