import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-scan-card-status',
  templateUrl: './scan-card-status.component.html',
  styleUrls: ['./scan-card-status.component.scss']
})
export class ScanCardStatusComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient) { }
  db: any;
  cityName: any;
  scanCardList: any[] = [];
  scanCardFilterList: any[] = [];
  progressList: any[] = [];
  public lastUpdateDate: any;
  txtSearch = "#txtSearch";
  divLoader = "#divLoader";
  replaceKey: any;
  rowsProgressListIndex: any;
  summaryData: summary = {
    installed: 0,
    unInstalled: 0,
    date: "---"
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.rowsProgressListIndex = 30;
    this.setReplaceKey();
    this.getScanCardStatus();
  }

  setReplaceKey() {
    const path = this.commonService.fireStoragePath + "CityDetails%2FCityDetails.json?alt=media";
    let cityDataInstance = this.httpService.get(path).subscribe(cityData => {
      cityDataInstance.unsubscribe();
      if (cityData != null) {
        let cityList = JSON.parse(JSON.stringify(cityData));
        let detail = cityList.find(item => item.cityName == this.commonService.getFireStoreCity());
        if (detail != undefined) {
          this.replaceKey = detail.key;
        }
      }
    });
  }

  getScanCardStatus() {
    $(this.divLoader).show();
    const lastUpdatePath = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCardScanData%2FlastUpdate.json?alt=media";
    let lastUpdateInstance = this.httpService.get(lastUpdatePath).subscribe(lastUpdateData => {
      lastUpdateInstance.unsubscribe();
      if (lastUpdateData != null) {
        this.summaryData.date = lastUpdateData["lastUpdate"];
      }
    });
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCardScanData%2FscanCardStatus.json?alt=media";
    let scanCardStatusInstance = this.httpService.get(path).subscribe(scanCardStatusData => {
      scanCardStatusInstance.unsubscribe();
      if (scanCardStatusData != null) {
        this.scanCardList = JSON.parse(JSON.stringify(scanCardStatusData));
        this.scanCardList = this.commonService.transformNumeric(this.scanCardList, "serialNo");
        this.summaryData.installed = this.scanCardList.filter(item => item.cardInstalled == 'yes').length;
        this.summaryData.unInstalled = this.scanCardList.filter(item => item.cardInstalled == 'no').length;
        this.scanCardFilterList = this.scanCardList;
        this.progressList = this.scanCardFilterList.slice(0, this.rowsProgressListIndex);
        $(this.divLoader).hide();
      }
    }, error => {
      $(this.divLoader).hide();
    });
  }

  getScanCardFilteredData() {
    this.rowsProgressListIndex = 30;
    let serialNo = $(this.txtSearch).val();
    if (serialNo != "") {
      this.scanCardFilterList = this.scanCardList.filter(item => item.serialNo.toString().includes(serialNo));
    }
    else {
      this.scanCardFilterList = this.scanCardList;
    }
    this.progressList = this.scanCardFilterList.slice(0, this.rowsProgressListIndex);
  }


  onContainerScroll() {
    let element = <HTMLElement>document.getElementById("divList");
    if ((element.offsetHeight + element.scrollTop + 30) >= element.scrollHeight) {
      this.rowsProgressListIndex = this.rowsProgressListIndex + 30;
      this.progressList = this.scanCardFilterList.slice(0, this.rowsProgressListIndex);
    }
  }

  getScanCardData() {
    $(this.divLoader).show();
    let cardList = [];
    let dbPath = "CardScanData";
    let scanCardDataInstance = this.db.object(dbPath).valueChanges().subscribe(
      scanCardData => {
        scanCardDataInstance.unsubscribe();
        if (scanCardData != null) {
          const data = {};
          let keyArray = Object.keys(scanCardData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let key = keyArray[i];
              if (scanCardData[key]["serialNo"] != null) {
                // data[i.toString()] = { serialNo: scanCardData[key]["serialNo"], scanDate: scanCardData[key]["date"], cardInstalled: scanCardData[key]["cardInstalled"] };

                let cardNo = scanCardData[key]["serialNo"];
                let serialNo = Number(cardNo.toString().substring(this.replaceKey.length, cardNo.toString().length));
                let date = "";
                let scanDate = "";
                let cardInstalled = "no";
                if (scanCardData[key]["date"] != null) {
                  date = scanCardData[key]["date"].split(' ')[0];
                  scanDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0];
                }
                if (scanCardData[key]["cardInstalled"] != null) {
                  cardInstalled = scanCardData[key]["cardInstalled"];
                }
                cardList.push({ cardNo: cardNo, scanDate: scanDate, cardInstalled: cardInstalled, serialNo: serialNo });
              }
            }
          }
          data["lastUpdate"] = this.commonService.setTodayDate();
          let filePath = "/CardScanData/";
          this.commonService.saveJsonFile(data, "lastUpdate.json", filePath);
          this.commonService.saveJsonFile(cardList, "scanCardStatus.json", filePath);
        }
        setTimeout(() => {
          this.commonService.setAlertMessage("success", "Data update successfully !!!");
          this.getScanCardStatus();
        }, 9000);
      })
  }

  exportScanCardStatus() {
    $(this.divLoader).show();
    if (this.scanCardList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Card No";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Scan Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Is Installed";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.scanCardList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.scanCardList[i]["cardNo"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.scanCardList[i]["scanDate"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.scanCardList[i]["cardInstalled"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "<table>";
      let fileName = "SCan-Card-Report [" + this.commonService.getFireStoreCity() + "].xlsx";
      this.commonService.exportExcel(htmlString, fileName);
      $(this.divLoader).hide();
    }
  }

}

export class summary {
  installed: number;
  unInstalled: number;
  date: string;
}
