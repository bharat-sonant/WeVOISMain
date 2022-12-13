import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';


@Component({
  selector: 'app-scan-card-manipulation',
  templateUrl: './scan-card-manipulation.component.html',
  styleUrls: ['./scan-card-manipulation.component.scss']
})
export class ScanCardManipulationComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }

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

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.percentage = 0;
    this.processDate = "---";
    this.processLine = "---";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getZones();
  }


  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }


  saveData() {
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
    $(this.divLoader).show();
    let dbPath = "Houses/" + this.selectedZone;
    let housesInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        housesInstance.unsubscribe();
        let wardHouses = [];
        let wardTotalLines = 0;
        if (houseData != null) {
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
                  let latlng = cardData[cardNumber]["latLng"].toString().replace('(', '').replace(')', '');
                  wardHouses.push({ lineNo: lineNo, cardNumber: cardNumber, latlng: latlng });
                }
              }
            }
          }
        }
        if (wardHouses.length > 0) {
          this.saveScanCardManipulation(dateFrom, dateTo, wardHouses, wardTotalLines);
        }
        else {
          $(this.divLoader).hide();
        }
      }
    );
  }

  saveScanCardManipulation(date: any, endDate: any, wardHouses: any, wardTotalLines: any) {
    if (new Date(date) > new Date(endDate)) {
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
            if (data["Status"] == "LineCompleted") {
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
            }
            else {
              lineNo++;
              this.updateLineCard(lineNo, date, endDate, wardHouses, wardTotalLines);
            }
          }
          else {
            lineNo++;
            this.updateLineCard(lineNo, date, endDate, wardHouses, wardTotalLines);
          }
        });
    }
  }

  getRandomScanTime(scanStartTime: any, scanEndTime: any) {
    let randomTime = new Date(scanStartTime + Math.random() * (scanEndTime - scanStartTime));
    let scanTime = (randomTime.getHours() < 10 ? '0' : '') + randomTime.getHours() + ":" + (randomTime.getMinutes() < 10 ? '0' : '') + randomTime.getMinutes() + ":" + (randomTime.getSeconds() < 10 ? '0' : '') + randomTime.getSeconds();
    return scanTime;
  }

  updateTotalScaned(date: any, endDate: any, wardHouses: any) {
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
