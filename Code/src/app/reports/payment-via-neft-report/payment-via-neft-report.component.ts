import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-payment-via-neft-report',
  templateUrl: './payment-via-neft-report.component.html',
  styleUrls: ['./payment-via-neft-report.component.scss']
})
export class PaymentViaNeftReportComponent implements OnInit {

  public selectedZone: any;
  zoneList: any[];
  collectorList: any[];
  cityName: any;
  db: any;
  todayDate: any;
  neftList: any[];
  neftFilterList: any[];
  ddlZone = "#ddlZone";
  ddlCollector = "#ddlCollector";
  txtNeftNo = "#txtNeftNo";
  divLoader = "#divLoader";
  lastUpdateDate: any;
  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.lastUpdateDate = "---";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.setMapHeight();
    this.todayDate = this.commonService.setTodayDate();
    this.selectedZone = 0;
    this.getZones();
    this.getPaymentCollector();
    this.getPaymentNeftDetail();
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["ZoneName"] = "--Select Zone--";
  }

  getPaymentCollector() {
    this.collectorList = [];
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaymentCollector.json?alt=media";
    let userJSONInstance = this.httpService.get(path).subscribe(userJsonData => {
      userJSONInstance.unsubscribe();
      if (userJsonData != null) {
        let keyArray = Object.keys(userJsonData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let collectorId = keyArray[i];
            if (collectorId != "lastKey") {
              this.collectorList.push({ collectorId: collectorId, name: userJsonData[collectorId]["name"] });
              this.collectorList = this.commonService.transformString(this.collectorList, "name");
            }
          }
        }
      }
    });
  }

  getPaymentNeftDetail() {
    $(this.divLoader).show();
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaNEFT%2FPaymentViaNEFT.json?alt=media";
    let monthWiseInstance = this.httpService.get(path).subscribe((data) => {
      monthWiseInstance.unsubscribe();
      if (data != null) {
        this.lastUpdateDate = data["lastUpdateDate"];
        this.neftList = JSON.parse(JSON.stringify(data["cards"]));
        this.neftFilterList = this.neftList;
        $(this.divLoader).hide();
      }
    }, error => {
      this.commonService.setAlertMessage("error", "No updated data found. Please update data !!!");
      $(this.divLoader).hide();
    });
  }

  updateReportJSON() {
    let neftListJSON = [];
    this.neftList = [];
    $(this.divLoader).show();
    let dbPath = "PaymentCollectionInfo/PaymentViaNEFT";
    let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        let cardArray = Object.keys(data);
        for (let i = 0; i < cardArray.length; i++) {
          let cardNo = cardArray[i];
          let cardData = data[cardNo];
          let dateArray = Object.keys(cardData);
          for (let j = 0; j < dateArray.length; j++) {
            let collectedDate = dateArray[j];
            let dateData = cardData[collectedDate];
            let keyArray = Object.keys(dateData);
            for (let k = 0; k < keyArray.length; k++) {
              let key = keyArray[k];
              if (dateData[key]["status"] != "Pending" && collectedDate!='Entities') {
                let timeStemp = new Date(collectedDate).getTime();
                let month = collectedDate.split("-")[1];
                let year = collectedDate.split("-")[0];
                let day = collectedDate.split("-")[2];
                let monthName = this.commonService.getCurrentMonthShortName(Number(month));
                let collectionDate = day + " " + monthName + " " + year;
                let transactionDateFormat = dateData[key]["transactionDate"];
                month = transactionDateFormat.split("-")[1];
                year = transactionDateFormat.split("-")[0];
                day = transactionDateFormat.split("-")[2];
                monthName = this.commonService.getCurrentMonthShortName(Number(month));
                transactionDateFormat = day + " " + monthName + " " + year;
                let neftDateFormat = dateData[key]["neftDate"];
                month = neftDateFormat.split("-")[1];
                year = neftDateFormat.split("-")[0];
                day = neftDateFormat.split("-")[2];
                monthName = this.commonService.getCurrentMonthShortName(Number(month));
                neftDateFormat = day + " " + monthName + " " + year;
                let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaNEFTImage%2F" + cardNo + "%2F" + dateData[key]["neftDate"] + "%2F" + dateData[key]["image"] + "?alt=media";
                let transactionId="NA";
                if(dateData[key]["transactionId"]!=null){
                  transactionId=dateData[key]["transactionId"];
                }
                neftListJSON.push({ key: key, cardNo: cardNo, zone: dateData[key]["ward"], neftNo: dateData[key]["neftNo"], neftDate: neftDateFormat, name: dateData[key]["name"], bankName: dateData[key]["bankName"], collectedBy: dateData[key]["collectedById"], collectedByName: dateData[key]["collectedByName"], collectedDate: collectedDate, collectionDate: collectionDate, amount: dateData[key]["amount"], monthYear: dateData[key]["monthYear"], transactionId: transactionId, transactionDate: dateData[key]["transactionDate"],transactionDateFormat:transactionDateFormat, timeStemp: timeStemp,imageUrl:imageUrl,status: dateData[key]["status"],declinedReason:dateData[key]["declinedReason"]});
              }
            }
          }
        }
        neftListJSON = neftListJSON.sort((a, b) => Number(b.timeStemp) < Number(a.timeStemp) ? 1 : -1);
        this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
        let filePath = "/PaymentCollectionHistory/PaymentViaNEFT/";
        const obj = { "cards": neftListJSON, "lastUpdateDate": this.lastUpdateDate };
        let fileName = "PaymentViaNEFT.json";
        this.commonService.saveJsonFile(obj, fileName, filePath);
        this.neftList = neftListJSON;
        this.neftFilterList = this.neftList;
        this.commonService.setAlertMessage("success", "Data update successfully !!!");
        $(this.divLoader).hide();
      } else {
        $(this.divLoader).hide();
      }
    });
  }


  getFilter() {
    $(this.divLoader).show();
    let zone = $(this.ddlZone).val();
    let collectorId = $(this.ddlCollector).val();
    let list = this.neftList;
    if (zone != "0") {
      list = list.filter(item => item.zone == zone);
    }
    if (collectorId != "0") {
      list = list.filter(item => item.collectedBy == collectorId);
    }
    if ($(this.txtNeftNo).val() != "") {
      list = list.filter(item => item.neftNo.toString().includes($(this.txtNeftNo).val()));
    }
    this.neftFilterList = list;
    $(this.divLoader).hide();
  }

  openModel(content: any, index: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 250;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    let reason=this.neftFilterList[index]["declinedReason"];
    $('#lblReason').html(reason);
  }


  closeModel() {
    this.modalService.dismissAll();
  }


  exportToExcel() {
    let list = this.neftList;
    if (list.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Collected Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Card Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Ward No";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "NEFT Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "NEFT Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Transaction ID";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Transaction Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Bank Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Amount";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Collected By";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < list.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["collectionDate"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["cardNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["zone"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["neftNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["neftDate"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["transactionId"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["transactionDateFormat"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["bankName"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["name"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += list[i]["amount"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["collectedByName"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Payment-Via-NEFT-Report" + this.todayDate + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
