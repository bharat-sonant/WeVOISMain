import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

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
  hddDeclinedCardNo = "#hddDeclinedCardNo";
  hddDeclinedDate = "#hddDeclinedDate";
  hddDeclinedKey = "#hddDeclinedKey";
  txtDeclinedDate = "#txtDeclinedDate";
  txtDeclinedReason = "#txtDeclinedReason";
  entityType: any = "";
  entityId: any = "";
  serviceName = "collection-management-payment-via-cheque";



  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }

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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getPaymentChequeDetail");
    this.chequeList = [];
    $(this.divLoader).show();
    let dbPath = "PaymentCollectionInfo/PaymentViaCheque";
    let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPaymentChequeDetail", data);
        let cardArray = Object.keys(data);
        for (let i = 0; i < cardArray.length; i++) {
          let cardNo = cardArray[i];
          let cardData = data[cardNo];
          let dateArray = Object.keys(cardData);
          for (let j = 0; j < dateArray.length; j++) {
            let collectedDate = dateArray[j];

            //******************Case of Sub Entities********************
            if (collectedDate === 'Entities') {
              const subEntityArray = Object.keys(cardData[collectedDate]);
              subEntityArray.map(entity => {
                const subEntityDateArray = Object.keys(cardData[collectedDate][entity]);
                subEntityDateArray.map(date => {
                  const dateEntriesArray = Object.keys(cardData[collectedDate][entity][date]);
                  dateEntriesArray.map(key => {
                    const dataKey = cardData[collectedDate][entity][date];
                    if (dataKey[key]["status"] == "Pending") {
                      let timeStemp = new Date(date).getTime();
                      let month = date.split("-")[1];
                      let year = date.split("-")[0];
                      let day = date.split("-")[2];
                      let monthName = this.commonService.getCurrentMonthShortName(Number(month));
                      let collectedDateFormat = day + " " + monthName + " " + year;
                      let checkDate = dataKey[key]["chequeDate"];
                      month = checkDate.split("-")[1];
                      year = checkDate.split("-")[0];
                      day = checkDate.split("-")[2];
                      monthName = this.commonService.getCurrentMonthShortName(Number(month));
                      let checkDateFormat = day + " " + monthName + " " + year;
                      let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaChequeImage%2F" + cardNo + "%2FEntities%2F" + entity + "%2F" + checkDate + "%2F" + dataKey[key]["image"] + "?alt=media";

                      const paymentImageName = dataKey[key]["houseImage"] || `${dataKey[key]["merchantTransactionId"]}.jpg`;

                      const houseImgUrl = dataKey[key]["houseImage"] ? `${this.commonService.fireStoragePath}${this.commonService.getFireStoreCity()}%2FPaymentCollectionHistory%2FPaymentHouseImage%2F${cardNo}%2FEntities%2F${entity}%2F${checkDate}%2F${paymentImageName}?alt=media` : ''

                      this.chequeList.push({ key: key, cardNo: cardNo, zone: dataKey[key]["ward"], chequeNo: dataKey[key]["chequeNo"], chequeDate: dataKey[key]["chequeDate"], checkDateFormat: checkDateFormat, name: dataKey[key]["name"], bankName: dataKey[key]["bankName"], collectedBy: dataKey[key]["collectedById"], collectedByName: dataKey[key]["collectedByName"], collectedDate: date, collectedDateFormat: collectedDateFormat, amount: dataKey[key]["amount"], monthYear: dataKey[key]["monthYear"], merchantTransactionId: dataKey[key]["merchantTransactionId"], timeStemp: timeStemp, imageUrl: imageUrl, entityType: "subEntity", entityId: entity, houseImgUrl, houseImage: paymentImageName });
                    }

                  });
                });
              });
            }
            //******************Case of Main Entity********************
            else {
              let dateData = cardData[collectedDate];
              let keyArray = Object.keys(dateData);
              for (let k = 0; k < keyArray.length; k++) {
                let key = keyArray[k];
                if (dateData[key]["status"] == "Pending") {
                  let timeStemp = new Date(collectedDate).getTime();
                  let month = collectedDate.split("-")[1];
                  let year = collectedDate.split("-")[0];
                  let day = collectedDate.split("-")[2];
                  let monthName = this.commonService.getCurrentMonthShortName(Number(month));
                  let collectedDateFormat = day + " " + monthName + " " + year;
                  let checkDate = dateData[key]["chequeDate"];
                  month = checkDate.split("-")[1];
                  year = checkDate.split("-")[0];
                  day = checkDate.split("-")[2];
                  monthName = this.commonService.getCurrentMonthShortName(Number(month));
                  let checkDateFormat = day + " " + monthName + " " + year;
                  let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaChequeImage%2F" + cardNo + "%2F" + collectedDate + "%2F" + dateData[key]["image"] + "?alt=media";

                  const paymentImageName = dateData[key]["houseImage"] || `${dateData[key]["merchantTransactionId"]}.jpg`;

                  const houseImgUrl = `${this.commonService.fireStoragePath}${this.commonService.getFireStoreCity()}%2FPaymentCollectionHistory%2FPaymentHouseImage%2F${cardNo}%2F${collectedDate}%2F${paymentImageName}?alt=media`;

                  this.chequeList.push({ key: key, cardNo: cardNo, zone: dateData[key]["ward"], chequeNo: dateData[key]["chequeNo"], chequeDate: dateData[key]["chequeDate"], checkDateFormat: checkDateFormat, name: dateData[key]["name"], bankName: dateData[key]["bankName"], collectedBy: dateData[key]["collectedById"], collectedByName: dateData[key]["collectedByName"], collectedDate: collectedDate, collectedDateFormat: collectedDateFormat, amount: dateData[key]["amount"], monthYear: dateData[key]["monthYear"], merchantTransactionId: dateData[key]["merchantTransactionId"], timeStemp: timeStemp, imageUrl: imageUrl, entityType: 'mainEntity', houseImgUrl, houseImage: paymentImageName });
                }
              }
            }
          }
        }
        this.chequeList = this.chequeList.sort((a, b) => Number(b.timeStemp) < Number(a.timeStemp) ? 1 : -1);
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

  openModel(content: any, cardNo: any, date: any, key: any, type: any, entityType: any, entityId: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 330;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (type == "clear") {
      $(this.hddCardNo).val(cardNo);
      $(this.hddDate).val(date);
      $(this.hddKey).val(key);
      this.entityType = entityType;
      this.entityId = entityId;
    }
    else {
      $(this.hddDeclinedCardNo).val(cardNo);
      $(this.hddDeclinedDate).val(date);
      $(this.hddDeclinedKey).val(key);
      this.entityType = entityType;
      this.entityId = entityId;
    }
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

    this.entityType == 'mainEntity' ? this.acceptMainEntitytransaction() : this.acceptSubEntitytransaction();

  }

  updateDecliened() {
    let txtDeclinedReason = $(this.txtDeclinedReason).val();
    let txtDeclinedDate = $(this.txtDeclinedDate).val();
    if (txtDeclinedReason == "") {
      this.commonService.setAlertMessage("error", "Please enter reason !!!");
      return;
    }
    if (txtDeclinedDate == "") {
      this.commonService.setAlertMessage("error", "Please enter date !!!");
      return;
    }
    if ((<HTMLInputElement>document.getElementById('chkDeclinedConfirm')).checked == false) {
      this.commonService.setAlertMessage("error", "Confirmation required !!!");
      return;
    }

    this.entityType == 'mainEntity' ? this.declineMainEntitytransaction() : this.declineSubEntitytransaction();


  }

  clearAll() {
    $(this.txtTransactionId).val("");
    $(this.txtTransactionDate).val("");
    $(this.hddCardNo).val("");
    $(this.hddDate).val("");
    $(this.hddKey).val("");

    $(this.txtDeclinedReason).val("");
    $(this.txtDeclinedDate).val("");
    $(this.hddDeclinedCardNo).val("");
    $(this.hddDeclinedDate).val("");
    $(this.hddDeclinedKey).val("");
    this.entityType = "";
    this.entityId = "";
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
        htmlString += list[i]["checkDateFormat"];
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
        htmlString += list[i]["collectedDateFormat"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Payment-Via-Cheque-" + this.todayDate + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

  acceptMainEntitytransaction() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "acceptMainEntitytransaction");
    let transactionId = $(this.txtTransactionId).val();
    let transactionDate = $(this.txtTransactionDate).val();
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
        this.db.object(dbPath).update({ status: "Paid", payMethod: "CHEQUE" });
      }

      const transData = {
        merchantTransactionId: detail.merchantTransactionId,
        monthYear: detail.monthYear,
        payMethod: "By Cheque",
        paymentCollectionById: detail.collectedBy,
        paymentCollectionByName: detail.collectedByName,
        retrievalReferenceNo: transactionId,
        transactionAmount: detail.amount,
        transactionDateTime: transactionDate,
        updatedBy: localStorage.getItem("userID"),
        updatedDate: this.commonService.getCurrentTimeWithSecond(),
        // houseImage: detail.houseImage || '',
        chequeNo: detail.chequeNo ? detail.chequeNo : '',
        bankName: detail.bankName ? detail.bankName : '',
        payDate: date

      }

      let monthName = this.commonService.getCurrentMonthName(Number(transactionDate.toString().split("-")[1]) - 1);
      let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/" + transactionDate.toString().split('-')[0] + "/" + monthName + "/" + transactionDate;
      let transactionInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        transactionInstance.unsubscribe();
        let transkey = 1;
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "acceptMainEntitytransaction", data);
          let keyArray = Object.keys(data);
          transkey = keyArray.length + 1;
        }
        this.db.object(dbPath + "/" + transkey).update(transData);

        dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + detail.collectedBy + "/" + transactionDate;
        let collectorInstance = this.db.object(dbPath).valueChanges().subscribe(colectorData => {
          collectorInstance.unsubscribe();
          let collectorKey = 1;
          if (colectorData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "acceptMainEntitytransaction", colectorData);
            let keyArray = Object.keys(colectorData);
            collectorKey = keyArray.length + 1;
          }
          collectorKey = detail.merchantTransactionId;
          const collectorData = {
            cardNo: cardNo,
            merchantTransactionId: detail.merchantTransactionId,
            payMethod: "By Cheque",
            transactionAmount: detail.amount,
            retrievalReferenceNo: transactionId
          }
          this.db.object(dbPath + "/" + collectorKey).update(collectorData);
          let index = this.chequeList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
          this.chequeList = this.chequeList.filter((e, i) => i !== index);
          this.getFilter();
          this.clearAll();
          this.closeModel();
          this.commonService.setAlertMessage("success", "Transaction detail added successfully !!!");
          $(this.divLoader).hide();
        });
      });
    }

  }
  declineMainEntitytransaction() {

    let txtDeclinedReason = $(this.txtDeclinedReason).val();
    let txtDeclinedDate = $(this.txtDeclinedDate).val();
    $(this.divLoader).show();
    let cardNo = $(this.hddDeclinedCardNo).val();
    let date = $(this.hddDeclinedDate).val();
    let key = $(this.hddDeclinedKey).val();
    let dbPath = "PaymentCollectionInfo/PaymentViaCheque/" + cardNo + "/" + date + "/" + key;
    this.db.object(dbPath).update({ declinedReason: txtDeclinedReason, transactionDate: txtDeclinedDate, status: "Declined" });
    let detail = this.chequeList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
    if (detail != undefined) {
      let monthYearList = detail.monthYear.split(",");
      for (let i = 0; i < monthYearList.length; i++) {
        let month = monthYearList[i].split('-')[0];
        let year = monthYearList[i].split('-')[1];
        let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/" + year + "/" + month;
        this.db.object(dbPath).update({ status: "Pending" });
      }
    }

    let index = this.chequeList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
    this.chequeList = this.chequeList.filter((e, i) => i !== index);
    this.getFilter();
    this.clearAll();
    this.closeModel();
    this.commonService.setAlertMessage("error", "Decliened data updated successfully !!!");
    $(this.divLoader).hide();

  }


  acceptSubEntitytransaction() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "acceptSubEntitytransaction");
    let transactionId = $(this.txtTransactionId).val();
    let transactionDate = $(this.txtTransactionDate).val();
    $(this.divLoader).show();
    let cardNo = $(this.hddCardNo).val();
    let date = $(this.hddDate).val();
    let key = $(this.hddKey).val();
    let detail = this.chequeList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType == this.entityType && item.entityId == this.entityId);
    if (detail != undefined) {

      let path = "PaymentCollectionInfo/PaymentViaCheque/" + cardNo + "/Entities/" + detail.entityId + "/" + date + "/" + key;
      this.db.object(path).update({ transactionId: transactionId, transactionDate: transactionDate, status: "Paid" });

      let monthYearList = detail.monthYear.split(",");
      for (let i = 0; i < monthYearList.length; i++) {
        let month = monthYearList[i].split('-')[0];
        let year = monthYearList[i].split('-')[1];
        let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/Entities/" + detail.entityId + "/" + year + "/" + month;
        this.db.object(dbPath).update({ status: "Paid" });
      }

      const transData = {
        merchantTransactionId: detail.merchantTransactionId,
        monthYear: detail.monthYear,
        payMethod: "By Cheque",
        paymentCollectionById: detail.collectedBy,
        paymentCollectionByName: detail.collectedByName,
        retrievalReferenceNo: transactionId,
        transactionAmount: detail.amount,
        transactionDateTime: transactionDate,
        updatedBy: localStorage.getItem("userID"),
        updatedDate: this.commonService.getCurrentTimeWithSecond(),
        // houseImage: detail.houseImage || '',
        chequeNo: detail.chequeNo ? detail.chequeNo : '',
        bankName: detail.bankName ? detail.bankName : '',
        payDate: date
      }


      let monthName = this.commonService.getCurrentMonthName(Number(transactionDate.toString().split("-")[1]) - 1);
      let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/Entities/" + detail.entityId + "/" + transactionDate.toString().split('-')[0] + "/" + monthName + "/" + transactionDate;

      let transactionInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        transactionInstance.unsubscribe();
        let transkey = 1;
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "acceptSubEntitytransaction", data);
          let keyArray = Object.keys(data);
          transkey = keyArray.length + 1;
        }
        this.db.object(dbPath + "/" + transkey).update(transData);

        dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + detail.collectedBy + "/Entities/" + detail.entityId + "/" + transactionDate;
        let collectorInstance = this.db.object(dbPath).valueChanges().subscribe(colectorData => {
          collectorInstance.unsubscribe();
          let collectorKey = 1;
          if (colectorData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "acceptSubEntitytransaction", colectorData);
            let keyArray = Object.keys(colectorData);
            collectorKey = keyArray.length + 1;
          }
          collectorKey=detail.merchantTransactionId;
          const collectorData = {
            cardNo: cardNo,
            merchantTransactionId: detail.merchantTransactionId,
            payMethod: "By Cheque",
            transactionAmount: detail.amount,
            retrievalReferenceNo: transactionId
          }
          this.db.object(dbPath + "/" + collectorKey).update(collectorData);
          let index = this.chequeList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType == this.entityType && item.entityId == this.entityId);
          this.chequeList = this.chequeList.filter((e, i) => i !== index);
          this.getFilter();
          this.clearAll();
          this.closeModel();
          this.commonService.setAlertMessage("success", "Transaction detail added successfully !!!");
          $(this.divLoader).hide();
        });
      });
    }

  }


  declineSubEntitytransaction() {
    let txtDeclinedReason = $(this.txtDeclinedReason).val();
    let txtDeclinedDate = $(this.txtDeclinedDate).val();
    $(this.divLoader).show();
    let cardNo = $(this.hddDeclinedCardNo).val();
    let date = $(this.hddDeclinedDate).val();
    let key = $(this.hddDeclinedKey).val();
    let detail = this.chequeList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType == this.entityType && item.entityId == this.entityId);
    if (detail != undefined) {
      let dbPath = "PaymentCollectionInfo/PaymentViaCheque/" + cardNo + "/Entities/" + detail.entityId + "/" + date + "/" + key;
      this.db.object(dbPath).update({ declinedReason: txtDeclinedReason, transactionDate: txtDeclinedDate, status: "Declined" });
      let monthYearList = detail.monthYear.split(",");
      for (let i = 0; i < monthYearList.length; i++) {
        let month = monthYearList[i].split('-')[0];
        let year = monthYearList[i].split('-')[1];
        let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/Entities/" + detail.entityId + "/" + year + "/" + month;
        this.db.object(dbPath).update({ status: "Pending" });
      }
    }

    let index = this.chequeList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType == this.entityType && item.entityId == this.entityId);
    this.chequeList = this.chequeList.filter((e, i) => i !== index);
    this.getFilter();
    this.clearAll();
    this.closeModel();
    this.commonService.setAlertMessage("error", "Decliened data updated successfully !!!");
    $(this.divLoader).hide();
  }


}
