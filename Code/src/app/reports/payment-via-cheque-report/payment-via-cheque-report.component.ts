import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';


@Component({
  selector: 'app-payment-via-cheque-report',
  templateUrl: './payment-via-cheque-report.component.html',
  styleUrls: ['./payment-via-cheque-report.component.scss']
})
export class PaymentViaChequeReportComponent implements OnInit {
  public selectedZone: any;
  zoneList: any[];
  collectorList: any[];
  cityName: any;
  db: any;
  todayDate: any;
  chequeList: any[];
  chequeFilterList: any[];
  ddlZone = "#ddlZone";
  ddlCollector = "#ddlCollector";
  txtChequeNo = "#txtChequeNo";
  divLoader = "#divLoader";
  serviceName = "collection-management-payment-via-cheque-report";
  lastUpdateDate: any;
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }

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
    this.getPaymentChequeDetail();
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

  getPaymentChequeDetail() {
    $(this.divLoader).show();
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaCheque%2FPaymentViaCheque.json?alt=media";
    let monthWiseInstance = this.httpService.get(path).subscribe((data) => {
      monthWiseInstance.unsubscribe();
      if (data != null) {
        this.lastUpdateDate = data["lastUpdateDate"];
        this.chequeList = JSON.parse(JSON.stringify(data["cards"]));
        this.chequeFilterList = this.chequeList;
        $(this.divLoader).hide();
      }
    }, error => {
      this.commonService.setAlertMessage("error", "No updated data found. Please update data !!!");
      $(this.divLoader).hide();
    });
  }

  updateReportJSON() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateReportJSON");
    let chequeListJSON = [];
    this.chequeList = [];
    $(this.divLoader).show();
    let dbPath = "PaymentCollectionInfo/PaymentViaCheque";
    let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateReportJSON", data);
        let cardArray = Object.keys(data);
        for (let i = 0; i < cardArray.length; i++) {
          let cardNo = cardArray[i];
          let cardData = data[cardNo];
          let dateArray = Object.keys(cardData);
          for (let j = 0; j < dateArray.length; j++) {
            let collectedDate = dateArray[j];
            if (collectedDate == "Entities") {
              let entityData = cardData["Entities"];
              let entityKeyArray = Object.keys(entityData);
              for (let m = 0; m < entityKeyArray.length; m++) {
                let entityKey = entityKeyArray[m];
                let entityKeyData = entityData[entityKey];
                let entityDateKeyArray = Object.keys(entityKeyData);
                for (let n = 0; n < entityDateKeyArray.length; n++) {
                  let entityCollectedDate = entityDateKeyArray[n];
                  let dateData = entityKeyData[entityCollectedDate];
                  let keyArray = Object.keys(dateData);
                  for (let k = 0; k < keyArray.length; k++) {
                    let key = keyArray[k];
                    if (dateData[key]["status"] != "Pending") {
                      let timeStemp = new Date(entityCollectedDate).getTime();
                      let month = entityCollectedDate.split("-")[1];
                      let year = entityCollectedDate.split("-")[0];
                      let day = entityCollectedDate.split("-")[2];
                      let monthName = this.commonService.getCurrentMonthShortName(Number(month));
                      let collectionDate = day + " " + monthName + " " + year;
                      let transactionDateFormat = dateData[key]["transactionDate"];
                      month = transactionDateFormat.split("-")[1];
                      year = transactionDateFormat.split("-")[0];
                      day = transactionDateFormat.split("-")[2];
                      monthName = this.commonService.getCurrentMonthShortName(Number(month));
                      transactionDateFormat = day + " " + monthName + " " + year;
                      let checkDateFormat = dateData[key]["chequeDate"];
                      month = checkDateFormat.split("-")[1];
                      year = checkDateFormat.split("-")[0];
                      day = checkDateFormat.split("-")[2];
                      monthName = this.commonService.getCurrentMonthShortName(Number(month));
                      checkDateFormat = day + " " + monthName + " " + year;
                      let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaChequeImage%2F" + cardNo + "%2FEntities%2F" + entityKey + "%2F" + entityCollectedDate + "%2F" + dateData[key]["image"] + "?alt=media";
                      let transactionId = "NA";
                      if (dateData[key]["transactionId"] != null) {
                        transactionId = dateData[key]["transactionId"];
                      }
                      chequeListJSON.push({ key: key, cardNo: cardNo, zone: dateData[key]["ward"], chequeNo: dateData[key]["chequeNo"], chequeDate: checkDateFormat, name: dateData[key]["name"], bankName: dateData[key]["bankName"], collectedBy: dateData[key]["collectedById"], collectedByName: dateData[key]["collectedByName"], collectedDate: entityCollectedDate, collectionDate: collectionDate, amount: dateData[key]["amount"], monthYear: dateData[key]["monthYear"], transactionId: transactionId, transactionDate: dateData[key]["transactionDate"], transactionDateFormat: transactionDateFormat, timeStemp: timeStemp, imageUrl: imageUrl, status: dateData[key]["status"], declinedReason: dateData[key]["declinedReason"] });
                    }
                  }
                }
              }
            }
            else {
              let dateData = cardData[collectedDate];
              let keyArray = Object.keys(dateData);
              for (let k = 0; k < keyArray.length; k++) {
                let key = keyArray[k];
                if (dateData[key]["status"] != "Pending") {
                  let timeStemp = new Date(collectedDate).getTime();
                  let collectionDateImage=collectedDate;
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
                  let checkDateFormat = dateData[key]["chequeDate"];
                  month = checkDateFormat.split("-")[1];
                  year = checkDateFormat.split("-")[0];
                  day = checkDateFormat.split("-")[2];
                  monthName = this.commonService.getCurrentMonthShortName(Number(month));
                  checkDateFormat = day + " " + monthName + " " + year;
                  let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaChequeImage%2F" + cardNo + "%2F" + collectionDateImage + "%2F" + dateData[key]["image"] + "?alt=media";
                  let transactionId = "NA";
                  if (dateData[key]["transactionId"] != null) {
                    transactionId = dateData[key]["transactionId"];
                  }
                  chequeListJSON.push({ key: key, cardNo: cardNo, zone: dateData[key]["ward"], chequeNo: dateData[key]["chequeNo"], chequeDate: checkDateFormat, name: dateData[key]["name"], bankName: dateData[key]["bankName"], collectedBy: dateData[key]["collectedById"], collectedByName: dateData[key]["collectedByName"], collectedDate: collectedDate, collectionDate: collectionDate, amount: dateData[key]["amount"], monthYear: dateData[key]["monthYear"], transactionId: transactionId, transactionDate: dateData[key]["transactionDate"], transactionDateFormat: transactionDateFormat, timeStemp: timeStemp, imageUrl: imageUrl, status: dateData[key]["status"], declinedReason: dateData[key]["declinedReason"] });
                }
              }
            }
          }
        }
        chequeListJSON = chequeListJSON.sort((a, b) => Number(b.timeStemp) < Number(a.timeStemp) ? 1 : -1);
        this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
        let filePath = "/PaymentCollectionHistory/PaymentViaCheque/";
        const obj = { "cards": chequeListJSON, "lastUpdateDate": this.lastUpdateDate };
        let fileName = "PaymentViaCheque.json";
        this.commonService.saveJsonFile(obj, fileName, filePath);
        this.chequeList = chequeListJSON;
        this.chequeFilterList = this.chequeList;
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
    let list = this.chequeList;
    if (zone != "0") {
      list = list.filter(item => item.zone == zone);
    }
    if (collectorId != "0") {
      list = list.filter(item => item.collectedBy == collectorId);
    }
    if ($(this.txtChequeNo).val() != "") {
      list = list.filter(item => item.chequeNo.toString().includes($(this.txtChequeNo).val()));
    }
    this.chequeFilterList = list;
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
    let reason = this.chequeFilterList[index]["declinedReason"];
    $('#lblReason').html(reason);
  }


  closeModel() {
    this.modalService.dismissAll();
  }


  exportToExcel() {
    let list = this.chequeList;
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
      htmlString += "Cheque Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Cheque Date";
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
        htmlString += list[i]["chequeNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["chequeDate"];
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
      let fileName = "Payment-Via-Cheque-Report" + this.todayDate + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
