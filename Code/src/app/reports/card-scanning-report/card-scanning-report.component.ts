import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";

import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-card-scanning-report',
  templateUrl: './card-scanning-report.component.html',
  styleUrls: ['./card-scanning-report.component.scss']
})
export class CardScanningReportComponent implements OnInit {

  constructor(
    public fs: FirebaseService,
    private besuh: BackEndServiceUsesHistoryService,
    public httpService: HttpClient,
    private commonService: CommonService
  ) { }

  wardList: any[] = [];
  scannedList: any[] = [];
  selectedDate: any;
  db: any;
  cityName: any;
  userType: any;

  txtDate = "#txtDate";
  serviceName = "card-scanning-report";

  /* ================= INIT ================= */

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userType = localStorage.getItem("userType");

    this.commonService.savePageLoadHistory(
      "General-Reports",
      "Card-Scanning-Report",
      localStorage.getItem("userID")
    );

    this.setDefaults();
  }

  setDefaults() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    $(this.txtDate).val(this.selectedDate);
    this.getWards();
  }

  /* ================= WARDS ================= */

  getWards() {

    this.wardList = JSON.parse(localStorage.getItem("latest-zones") || "[]");
    this.scannedList = [];

    for (let i = 1; i < this.wardList.length; i++) {

      if (
        !this.wardList[i]["zoneNo"].includes("Commercial") &&
        !this.wardList[i]["zoneNo"].includes("Dummy")
      ) {

        let ward = this.wardList[i]["zoneNo"];

        this.scannedList.push({
          ward: ward,
          cards: '',
          scanned: '',
          percentage: '',
          residentialCount: '',
          commercialCount: ''
        });
      }
    }

    this.processAllWardsParallel();
  }

  /* ================= DATE ================= */

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type)
      .then((newDate: any) => {

        $(this.txtDate).val(newDate);

        if (newDate != this.selectedDate) {
          this.selectedDate = newDate;
          this.clearAllData();
        }
        else {
          this.commonService.setAlertMessage(
            "error",
            "Date can not be more than today date!!!"
          );
        }
      });
  }

  clearAllData() {

    for (let item of this.scannedList) {
      item.cards = "";
      item.scanned = "";
      item.percentage = "";
      item.residentialCount = 0;
      item.commercialCount = 0;
    }

    this.processAllWardsParallel();
  }

  /* ================= PARALLEL PROCESS ================= */

  async processAllWardsParallel() {

    let promises: Promise<any>[] = [];

    for (let item of this.scannedList) {
      promises.push(this.getCardsData(item.ward));
    }

    try {
      await Promise.all(promises);
      console.log("✅ All wards processed in parallel");
    }
    catch (e) {
      console.error("❌ Error in ward processing", e);
    }
  }

  /* ================= CARD COUNT ================= */

  getCardsData(ward: any): Promise<any> {

    return new Promise((resolve) => {

      this.besuh.saveBackEndFunctionCallingHistory(
        this.serviceName,
        "getCardsData"
      );

      let dbPath = "EntitySurveyData/TotalHouseCount/" + ward;

      let sub = this.db.object(dbPath).valueChanges()
        .subscribe(houseCountData => {

          sub.unsubscribe();

          let detail = this.scannedList.find(x => x.ward == ward);
          if (!detail) {
            resolve(null);
            return;
          }

          if (houseCountData != null) {

            detail.cards = Number(houseCountData);
            this.getScannedCardsNew(ward).then(() => resolve(true));
          }
          else {

            this.commonService.getWardLine(ward, this.selectedDate)
              .then((linesData: any) => {

                let wardLinesDataObj = JSON.parse(linesData);
                detail.cards = wardLinesDataObj["totalHouseCount"];
                this.getScannedCardsNew(ward).then(() => resolve(true));
              });
          }
        });
    });
  }

  /* ================= SCANNED CARDS ================= */

  getScannedCardsNew(ward: any): Promise<any> {

    return new Promise((resolve) => {

      this.besuh.saveBackEndFunctionCallingHistory(
        this.serviceName,
        "getScannedCards"
      );

      let year = this.selectedDate.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(
        Number(this.selectedDate.split('-')[1]) - 1
      );

      let dbPath =
        "HousesCollectionInfo/" +
        ward + "/" +
        year + "/" +
        monthName + "/" +
        this.selectedDate;

      let sub = this.db.object(dbPath).valueChanges()
        .subscribe(scannedCardObj => {

          sub.unsubscribe();

          if (!scannedCardObj) {
            resolve(null);
            return;
          }

          let scannedCardCount = 0;
          let keyArray = Object.keys(scannedCardObj)
            .filter(k => !["ImagesData", "recentScanned", "totalScanned"].includes(k));

          let cardsForTypeCount: string[] = [];

          /* ===== External User ===== */

          if (this.userType === "External User") {

            scannedCardCount = scannedCardObj["totalScanned"];

            if (this.cityName.toLowerCase().trim() === 'hisar') {
              cardsForTypeCount = keyArray.slice();
            }
          }

          /* ===== Internal User ===== */

          else {

            for (let cardNo of keyArray) {
              if (scannedCardObj[cardNo]["scanBy"] != "-1") {
                scannedCardCount++;
                if (this.cityName.toLowerCase().trim() === 'hisar') {
                  cardsForTypeCount.push(cardNo);
                }
              }
            }
          }

          let detail = this.scannedList.find(x => x.ward == ward);
          if (detail) {

            detail.scanned = scannedCardCount;

            if (Number(detail.scanned) > Number(detail.cards)) {
              detail.scanned = detail.cards;
            }

            let scanPercentage =
              (Number(detail.scanned) / Number(detail.cards)) * 100;

            if (!isNaN(scanPercentage)) {
              detail.percentage = scanPercentage.toFixed(0);
            }
          }

          /* 🔥 CARD TYPE COUNT – PARALLEL */
          if (
            this.cityName.toLowerCase().trim() === 'hisar' &&
            cardsForTypeCount.length
          ) {
            this.updateCardTypeCountBatch(cardsForTypeCount, ward)
              .then(() => resolve(true));
          }
          else {
            resolve(true);
          }
        });
    });
  }

  /* ================= CARD TYPE (PARALLEL) ================= */

  updateCardTypeCount(cardNo: string): Promise<string | null> {

    return new Promise((resolve) => {

      let sub = this.db
        .object(`/CardTypeMapping/${cardNo}/cardType`)
        .valueChanges()
        .subscribe(cardType => {

          sub.unsubscribe();
          resolve(cardType as string);
        });
    });
  }

  async updateCardTypeCountBatch(cardNos: string[], ward: any) {

    let detail = this.scannedList.find(x => x.ward == ward);
    if (!detail) return;

    detail.residentialCount = 0;
    detail.commercialCount = 0;

    let promises: Promise<string | null>[] = [];

    for (let cardNo of cardNos) {
      promises.push(this.updateCardTypeCount(cardNo));
    }

    const results = await Promise.all(promises);

    for (let type of results) {
      if (type === 'Commercial') {
        detail.commercialCount++;
      }
      else if (type === 'Residential') {
        detail.residentialCount++;
      }
    }
  }

  /* ================= EXPORT ================= */

  exportToExcel() {

    if (!this.scannedList.length) return;

    let isHisar = this.cityName.toLowerCase().trim() === 'hisar';

    let htmlString = "<table><tr>";
    htmlString += "<td>Ward</td><td>Cards</td><td>Scanned Cards</td><td>Scan (%)</td>";

    if (isHisar) {
      htmlString += "<td>Residential</td><td>Commercial</td>";
    }

    htmlString += "</tr>";

    for (let item of this.scannedList) {

      htmlString += "<tr>";
      htmlString += "<td>" + item.ward + "</td>";
      htmlString += "<td>" + item.cards + "</td>";
      htmlString += "<td>" + item.scanned + "</td>";
      htmlString += "<td>" + item.percentage + "</td>";

      if (isHisar) {
        htmlString += "<td>" + (item.residentialCount || 0) + "</td>";
        htmlString += "<td>" + (item.commercialCount || 0) + "</td>";
      }

      htmlString += "</tr>";
    }

    htmlString += "</table>";

    let exportDate =
      this.selectedDate.split('-')[2] + " " +
      this.commonService.getCurrentMonthShortName(
        Number(this.selectedDate.split('-')[1])
      ) + " " +
      this.selectedDate.split('-')[0];

    let fileName = "Card-Scan-Report [" + exportDate + "].xlsx";
    this.commonService.exportExcel(htmlString, fileName);
  }
}
