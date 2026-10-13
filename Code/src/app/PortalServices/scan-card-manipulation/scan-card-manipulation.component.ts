import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';


@Component({
  selector: 'app-scan-card-manipulation',
  templateUrl: './scan-card-manipulation.component.html',
  styleUrls: ['./scan-card-manipulation.component.scss']
})
export class ScanCardManipulationComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }

  db: any;
  cityName: any;
  selectedZone: any;
  zoneList: any[] = [];
  percentage: any;
  toDayDate: any;
  scanTimeList: any[] = [];
  public processDate: any;
  public processLine: any;
  divLoader = "#divLoader";
  serviceName = "portal-service-scan-card-manipulation";
  nokhaAvailableWards: any[] = [];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", "Scan-Card-Modification", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.percentage = 0;
    this.processDate = "---";
    this.processLine = "---";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getZones();
    if (this.cityName == "nokha") {
      this.getAvailableWards();
    }
  }

  getAvailableWards() {
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDefaults%2FAvailableWard.json?alt=media";
    let availableWardInstance = this.httpService.get(path).subscribe(data => {
      availableWardInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));
      if (list.length > 0) {
        for (let index = 0; index < list.length; index++) {
          if (list[index] != null) {
            if (!list[index].toString().includes("Test") && list[index] != "OfficeWork" && list[index] != "FixedWages" && list[index] != "BinLifting" && list[index] != "GarageWork" && list[index] != "Compactor" && list[index] != "SegregationWork" && list[index] != "GeelaKachra" && list[index] != "SecondHelper" && list[index] != "ThirdHelper") {
              this.nokhaAvailableWards.push({ zoneNo: list[index], zoneName: "Market " + list[index].toString().replace("mkt", ""), });
            }
          }
        }
      }
    }, error => {
    });
  }


  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }


  saveData() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "saveData");
    this.processDate = "---";
    this.processLine = "---";
    if ($("#txtDateFrom").val() == "") {
      this.commonService.setAlertMessage("error", "Please enter date from !!!");
      return;
    }
    if ($("#txtDateTo").val() == "") {
      this.commonService.setAlertMessage("error", "Please enter date to !!!");
      return;
    }

    let dateFrom = $("#txtDateFrom").val();
    let dateTo = $("#txtDateTo").val();
    if (new Date(dateFrom.toString()) > new Date(dateTo.toString())) {
      this.commonService.setAlertMessage("error", "Date to can not be less than date from !!!");
      return;
    }
    if ($("#ddlZone").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if ($("#ddlPercentage").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select percentage !!!");
      return;
    }
    this.percentage = $("#ddlPercentage").val();
    this.selectedZone = $("#ddlZone").val();
    let detail = this.zoneList.find(item => item.zoneNo == this.selectedZone);
    if (detail != undefined) {
      $(this.divLoader).show();
      let dbPath = "Houses/" + this.selectedZone;
      let housesInstance = this.db.object(dbPath).valueChanges().subscribe(
        houseData => {
          housesInstance.unsubscribe();
          let wardHouses = [];
          let wardTotalLines = 0;
          if (houseData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", houseData);
            let lineArray = Object.keys(houseData);
            if (lineArray.length > 0) {
              wardTotalLines = Number(lineArray[lineArray.length - 1]);
              for (let i = 0; i < lineArray.length; i++) {
                let lineNo = lineArray[i];
                let cardData = houseData[lineNo];
                let cardArray = Object.keys(cardData);
                if (cardArray.length > 0) {
                  for (let j = 0; j < cardArray.length; j++) {
                    let cardNumber = cardArray[j];
                    if (cardData[cardNumber]["latLng"] != null) {
                    let latlng = cardData[cardNumber]["latLng"].toString().replace('(', '').replace(')', '');
                    wardHouses.push({ lineNo: lineNo, cardNumber: cardNumber, latlng: latlng });
                    }
                  }
                }
              }
            }
          }
          if (wardHouses.length > 0) {
            if (this.cityName == "ajmer") {
              this.saveScanCardAjmer(dateFrom, dateTo, wardHouses);
            }
            else {
              this.saveScanCardManipulation(dateFrom, dateTo, wardHouses, wardTotalLines);
            }
          }
          else {
            $(this.divLoader).hide();
          }
        }
      );
    }
    else {
      this.saveTotalScanCounts(dateFrom,dateTo);
    }
  }

  saveTotalScanCounts(date:any,endDate:any){
    if (new Date(date) > new Date(endDate) || new Date(date) > new Date(this.commonService.setTodayDate())) {
      setTimeout(() => {
        this.commonService.setAlertMessage("success", "Scan card manipulation done successfully!!!");
      }, 2000);
    }
    else{
      this.commonService.getWardLine(this.selectedZone, date).then((linesData: any) => {
        let wardLinesDataObj = JSON.parse(linesData);
        let totalHouses = Number(wardLinesDataObj["totalHouseCount"]);
        let scanCounts = ((totalHouses * Number(this.percentage)) / 100).toFixed(0);
        let year = date.toString().split('-')[0];
        let monthName = this.commonService.getCurrentMonthName(Number(date.toString().split("-")[1]) - 1);
        let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date + "/";
        
        this.db.object(dbPath).update({ totalScanned: scanCounts });
        date = this.commonService.getNextDate(date, 1);
        this.saveTotalScanCounts(date,endDate);

      });
    }
  }

  saveScanCardManipulation(date: any, endDate: any, wardHouses: any, wardTotalLines: any) {
    if (new Date(date) > new Date(endDate) || new Date(date) > new Date(this.commonService.setTodayDate())) {
      setTimeout(() => {
        this.updateTotalScaned($("#txtDateFrom").val(), $("#txtDateTo").val(), wardHouses);
      }, 2000);
    }
    else {
      this.processDate = date;
      this.scanTimeList = [];
      this.updateLineCard(1, date, endDate, wardHouses, wardTotalLines);
    }
  }

  updateLineCard(lineNo: any, date: any, endDate: any, wardHouses: any, wardTotalLines: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateLineCard");
    console.log(date);
    if (lineNo > wardTotalLines) {
      date = this.commonService.getNextDate(date, 1);
      this.saveScanCardManipulation(date, endDate, wardHouses, wardTotalLines);
    }
    else {
      this.processLine = lineNo;
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
      let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date + "/LineStatus/" + lineNo;
      let wardCollectionInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          wardCollectionInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateLineCard", data);
            // if (data["Status"] == "LineCompleted") {
            let startTime = "";
            let endTime = "";
            if (data["start-time"] != null) {
              startTime = data["start-time"];
            }
            if (data["end-time"] != null) {
              endTime = data["end-time"];
            }
            this.scanTimeList = [];
            let scanStartTime = new Date(this.toDayDate + " " + startTime).getTime();
            let scanEndTime = new Date(this.toDayDate + " " + endTime).getTime();
            let cardList = wardHouses.filter(item => item.lineNo == lineNo);
            let totalCards = cardList.length;
            if (totalCards > 0) {
              let cardToScanCount = ((totalCards * Number(this.percentage)) / 100);
              for (let i = 0; i < cardToScanCount; i++) {
                let cardNumber = cardList[i]["cardNumber"];
                dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date + "/" + cardNumber;
                let houseCollectionInstance = this.db.object(dbPath).valueChanges().subscribe(
                  houseCollectionData => {
                    houseCollectionInstance.unsubscribe();
                    if (houseCollectionData == null) {
                      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateLineCard", houseCollectionData);
                      let scanTime = this.getRandomScanTime(scanStartTime, scanEndTime);
                      const scanData = {
                        latLng: cardList[i]["latlng"],
                        scanBy: "-1",
                        scanTime: scanTime
                      }
                      dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date + "/" + cardNumber;
                      this.db.object(dbPath).update(scanData);
                    }
                  });
              }
              lineNo++;
              this.updateLineCard(lineNo, date, endDate, wardHouses, wardTotalLines);
            }
            else {
              lineNo++;
              this.updateLineCard(lineNo, date, endDate, wardHouses, wardTotalLines);
            }
            //}
            // else {
            //  lineNo++;
            //   this.updateLineCard(lineNo, date, endDate, wardHouses, wardTotalLines);
            // }
          }
          else {
            lineNo++;
            this.updateLineCard(lineNo, date, endDate, wardHouses, wardTotalLines);
          }
        });
    }
  }

  /* ================= AJMER : WARD LEVEL TARGET ================= */
  // Card Scanning Report (Ajmer external user) shows: all scan records / EntitySurveyData TotalHouseCount.
  // So here target = round(percentage x same total), and only the missing records are added on worked lines.

  getDataOnce(dbPath: any): Promise<any> {
    return new Promise((resolve) => {
      let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
        instance.unsubscribe();
        resolve(data);
      });
    });
  }

  async getWardTotalCards(date: any) {
    let houseCount = await this.getDataOnce("EntitySurveyData/TotalHouseCount/" + this.selectedZone);
    if (houseCount != null) {
      return Number(houseCount);
    }
    let linesData: any = await this.commonService.getWardLine(this.selectedZone, date);
    return Number(JSON.parse(linesData)["totalHouseCount"]);
  }

  async saveScanCardAjmer(dateFrom: any, dateTo: any, wardHouses: any) {
    let date = dateFrom;
    let skippedDates = [];
    while (new Date(date) <= new Date(dateTo) && new Date(date) <= new Date(this.commonService.setTodayDate())) {
      this.processDate = date;
      this.processLine = "---";
      let added = await this.updateDateScanAjmer(date, wardHouses);
      if (added < 0) {
        skippedDates.push(date);
      }
      date = this.commonService.getNextDate(date, 1);
    }
    setTimeout(() => {
      this.updateTotalScaned($("#txtDateFrom").val(), $("#txtDateTo").val(), wardHouses);
      if (skippedDates.length > 0) {
        this.commonService.setAlertMessage("error", "Required percentage could not be reached on worked lines for " + skippedDates.join(", "));
      }
    }, 2000);
  }

  // returns number of records added, -1 if target can not be reached with available cards
  async updateDateScanAjmer(date: any, wardHouses: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateDateScanAjmer");
    let year = date.split('-')[0];
    let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
    let wastePath = "WasteCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date;
    let scanPath = "HousesCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date;

    let lineStatusData = await this.getDataOnce(wastePath + "/LineStatus");
    if (lineStatusData == null) {
      return 0;
    }
    let summaryData = await this.getDataOnce(wastePath + "/Summary");
    let scanData = await this.getDataOnce(scanPath);
    let totalCards = await this.getWardTotalCards(date);

    // same keys as excluded in Card Scanning Report
    let existingCards = {};
    if (scanData != null) {
      Object.keys(scanData).forEach(key => {
        if (!["ImagesData", "recentScanned", "totalScanned", "totalActualScanned"].includes(key)) {
          existingCards[key] = true;
        }
      });
    }
    let targetCount = Math.round((totalCards * Number(this.percentage)) / 100);
    let requiredCount = targetCount - Object.keys(existingCards).length;
    if (requiredCount <= 0) {
      return 0;
    }

    // worked lines with their scan window
    let wardStartTime = "";
    let wardEndTime = "";
    let lineList = [];
    Object.keys(lineStatusData).forEach(lineNo => {
      let status = lineStatusData[lineNo];
      if (status == null) {
        return;
      }
      if (status["start-time"] != null && (wardStartTime == "" || status["start-time"] < wardStartTime)) {
        wardStartTime = status["start-time"];
      }
      if (status["end-time"] != null && status["end-time"] > wardEndTime) {
        wardEndTime = status["end-time"];
      }
      let cardList = wardHouses.filter(item => item.lineNo == lineNo);
      if (cardList.length > 0) {
        lineList.push({
          lineNo: lineNo,
          totalCards: cardList.length,
          scannedCards: cardList.filter(item => existingCards[item.cardNumber] != null).length,
          freeCards: cardList.filter(item => existingCards[item.cardNumber] == null),
          startTime: status["start-time"],
          endTime: status["end-time"]
        });
      }
    });
    // lines added from work percentage page have no time, use ward / duty time for them
    if (wardStartTime == "" && summaryData != null && summaryData["dutyInTime"] != null) {
      wardStartTime = summaryData["dutyInTime"];
    }
    if (wardEndTime == "" && summaryData != null && summaryData["dutyOutTime"] != null) {
      wardEndTime = summaryData["dutyOutTime"];
    }
    if (wardEndTime == "") {
      wardEndTime = wardStartTime;
    }

    // spread required cards over worked lines, each time picking the line with lowest coverage
    let newScanData = {};
    let addedCount = 0;
    while (addedCount < requiredCount) {
      let selectedLine = null;
      for (let i = 0; i < lineList.length; i++) {
        let line = lineList[i];
        if (line.freeCards.length > 0 && (selectedLine == null || (line.scannedCards / line.totalCards) < (selectedLine.scannedCards / selectedLine.totalCards))) {
          selectedLine = line;
        }
      }
      if (selectedLine == null) {
        break;
      }
      let card = selectedLine.freeCards.shift();
      selectedLine.scannedCards++;
      let startTime = selectedLine.startTime != null ? selectedLine.startTime : wardStartTime;
      let endTime = selectedLine.endTime != null ? selectedLine.endTime : (selectedLine.startTime != null ? selectedLine.startTime : wardEndTime);
      newScanData[card.cardNumber] = {
        latLng: card.latlng,
        scanBy: "-1",
        scanTime: this.getRandomScanTime(new Date(this.toDayDate + " " + startTime).getTime(), new Date(this.toDayDate + " " + endTime).getTime())
      };
      addedCount++;
    }

    if (addedCount > 0) {
      await this.db.object(scanPath).update(newScanData);
    }
    return addedCount < requiredCount ? -1 : addedCount;
  }

  getRandomScanTime(scanStartTime: any, scanEndTime: any) {
    let randomTime = new Date(scanStartTime + Math.random() * (scanEndTime - scanStartTime));
    let scanTime = (randomTime.getHours() < 10 ? '0' : '') + randomTime.getHours() + ":" + (randomTime.getMinutes() < 10 ? '0' : '') + randomTime.getMinutes() + ":" + (randomTime.getSeconds() < 10 ? '0' : '') + randomTime.getSeconds();
    return scanTime;
  }

  updateTotalScaned(date: any, endDate: any, wardHouses: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateTotalScaned");
    if (new Date(date) > new Date(endDate)) {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("success", "Scan card data processing has been completed !!!");
    }
    else {
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
      let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date;
      let totalScanedInstance = this.db.object(dbPath).valueChanges().subscribe(
        scanData => {
          totalScanedInstance.unsubscribe();
          if (scanData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateTotalScaned", scanData);
            let scanCardCount = 0;
            let actualScanCount = 0;
            let keyArray = Object.keys(scanData);
            for (let i = 0; i < keyArray.length; i++) {
              let cardNo = keyArray[i];
              if (cardNo != "recentScanned") {
                if (scanData[cardNo]["scanBy"] != null) {

                  if (scanData[cardNo]["scanBy"] != "-1") {
                    actualScanCount++;
                  }
                  scanCardCount++;
                }
              }
            }
            dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + date + "/";
            this.db.object(dbPath).update({ totalScanned: scanCardCount, totalActualScanned: actualScanCount });
            date = this.commonService.getNextDate(date, 1);
            this.updateTotalScaned(date, endDate, wardHouses);
          }
          else {
            date = this.commonService.getNextDate(date, 1);
            this.updateTotalScaned(date, endDate, wardHouses);
          }
        }
      );
    }

  }


}
