import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-payment-via-cheque',
  templateUrl: './payment-via-cheque.component.html',
  styleUrls: ['./payment-via-cheque.component.scss']
})
export class PaymentViaChequeComponent implements OnInit {

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
  hddCardNo = "#hddCardNo";
  hddDate = "#hddDate";
  hddKey = "#hddKey";
  txtTransactionId = "#txtTransactionId";
  txtTransactionDate = "#txtTransactionDate";


  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.setMapHeight();
    this.todayDate = this.commonService.setTodayDate();
    this.selectedZone = 0;
    this.getZones();
    this.getPaymentCollector();
    this.getPaymentChequeDetail();
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

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["ZoneName"] = "--Select Zone--";
  }

  getPaymentChequeDetail() {
    this.chequeList = [];
    $(this.divLoader).show();
    let dbPath = "PaymentCollectionInfo/PaymentViaCheque";
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
              if (dateData[key]["status"] == "Pending") {
                this.chequeList.push({ key: key, cardNo: cardNo, zone: dateData[key]["ward"], chequeNo: dateData[key]["chequeNo"], chequeDate: dateData[key]["chequeDate"], name: dateData[key]["name"], bankName: dateData[key]["bankName"], collectedBy: dateData[key]["collectedById"], collectedByName: dateData[key]["collectedByName"], collectedDate: collectedDate, amount: dateData[key]["amount"], monthYear: dateData[key]["monthYear"] });
              }
            }
          }
        }
        this.chequeFilterList = this.chequeList;
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

  openModel(content: any, cardNo: any, date: any, key: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 330;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.hddCardNo).val(cardNo);
    $(this.hddDate).val(date);
    $(this.hddKey).val(key);
  }


  closeModel() {
    this.modalService.dismissAll();
  }

  updateTransaction() {
    let transactionId = $(this.txtTransactionId).val();
    let transactionDate = $(this.txtTransactionDate).val();
    if (transactionId == "") {
      this.commonService.setAlertMessage("error", "Please enter transaction id !!!");
      return;
    }
    if (transactionDate == "") {
      this.commonService.setAlertMessage("error", "Please enter transaction date !!!");
      return;
    }
    if ((<HTMLInputElement>document.getElementById('chkConfirm')).checked == false) {
      this.commonService.setAlertMessage("error", "Confirmation required !!!");
      return;
    }
    $(this.divLoader).show();
    let cardNo = $(this.hddCardNo).val();
    let date = $(this.hddDate).val();
    let key = $(this.hddKey).val();
    let dbPath = "PaymentCollectionInfo/PaymentViaCheque/" + cardNo + "/" + date + "/" + key;
    this.db.object(dbPath).update({ transactionId: transactionId, transactionDate: transactionDate, status: "Paid" });

    let detail = this.chequeList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
    if (detail != undefined) {
      let monthYearList = detail.monthYear.split(",");
      for (let i = 0; i < monthYearList.length; i++) {
        let month = monthYearList[i].split('-')[0];
        let year = monthYearList[i].split('-')[1];
        let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/" + year + "/" + month;
        this.db.object(dbPath).update({ status: "Paid" });
      }

      const transData = {
        monthYear: detail.monthYear,
        payMethod: "By Cheque",
        paymentCollectionById: detail.collectedBy,
        paymentCollectionByName: detail.collectedByName,
        retrievalReferenceNo: transactionId,
        transactionAmount: detail.amount,
        transactionDateTime: transactionDate,
        updatedBy: localStorage.getItem("userID"),
        updatedDate: this.commonService.getCurrentTimeWithSecond()
      }

      let monthName = this.commonService.getCurrentMonthShortName(Number(transactionDate.toString().split("-")[1]));
      let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/" + transactionDate.toString().split('-')[0] + "/" + monthName + "/" + transactionDate;
      let transactionInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        transactionInstance.unsubscribe();
        let transkey = 1;
        if (data != null) {
          let keyArray = Object.keys(data);
          transkey = keyArray.length + 1;
        }
        this.db.object(dbPath + "/" + transkey).update(transData);
        let index = this.chequeList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
        this.chequeList = this.chequeList.filter((e, i) => i !== index);
        this.getFilter();
        this.clearAll();
        this.closeModel();
        this.commonService.setAlertMessage("success", "Transaction detail added successfully !!!");
        $(this.divLoader).hide();
      });
    }
  }

  clearAll() {
    $(this.txtTransactionId).val("");
    $(this.txtTransactionDate).val("");
    $(this.hddCardNo).val("");
    $(this.hddDate).val("");
    $(this.hddKey).val("");
  }

  exportToExcel() {
    let list = this.chequeList;
    if (list.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
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
      htmlString += "<td>";
      htmlString += "Collected Date";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < list.length; i++) {
        htmlString += "<tr>";
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
        htmlString += "<td t='s'>";
        htmlString += list[i]["collectedDate"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Payment-Via-Cheque-" + this.todayDate + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}