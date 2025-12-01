import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-payment-via-neft',
  templateUrl: './payment-via-neft.component.html',
  styleUrls: ['./payment-via-neft.component.scss']
})
export class PaymentViaNeftComponent implements OnInit {

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
  serviceName = "collection-management-payment-via-neft";
  entityType:any="";
  entityId:any="";

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
    this.getPaymentNEFTDetail();
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
    this.zoneList[0]["zoneName"] = "--Select Zone--";
  }

  getPaymentNEFTDetail() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getPaymentNEFTDetail");
    this.neftList = [];
     $(this.divLoader).show();
    let dbPath = "PaymentCollectionInfo/PaymentViaNEFT";
    let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPaymentNEFTDetail", data);
        let cardArray = Object.keys(data);
        for (let i = 0; i < cardArray.length; i++) {
          let cardNo = cardArray[i];
          let cardData = data[cardNo];
          let dateArray = Object.keys(cardData);
          for (let j = 0; j < dateArray.length; j++) {
            let collectedDate = dateArray[j];

            //******************Case of Sub Entities********************
            if(collectedDate==='Entities'){
              const subEntityArray=Object.keys(cardData[collectedDate]);
              subEntityArray.map(entity=>{
                const subEntityDateArray=Object.keys(cardData[collectedDate][entity]);
                subEntityDateArray.map(date=>{
                  const dateEntriesArray=Object.keys(cardData[collectedDate][entity][date]);
                  dateEntriesArray.map(key=>{
                    const dataKey=cardData[collectedDate][entity][date];
                    if (dataKey[key]["status"] == "Pending") {
                      let timeStemp = new Date(date).getTime();
                      let month = date.split("-")[1];
                      let year = date.split("-")[0];
                      let day = date.split("-")[2];
                      let monthName = this.commonService.getCurrentMonthShortName(Number(month));
                      let collectedDateFormat = day + " " + monthName + " " + year;
                      let neftDate = dataKey[key]["neftDate"];
                      month = neftDate.split("-")[1];
                      year = neftDate.split("-")[0];
                      day = neftDate.split("-")[2];
                      monthName = this.commonService.getCurrentMonthShortName(Number(month));
                      let neftDateFormat = day + " " + monthName + " " + year;
                      let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaNEFTImage%2F" + cardNo + "%2FEntities%2F"+entity +"%2F"+ neftDate + "%2F" + dataKey[key]["image"] + "?alt=media";

                     const houseImgUrl = dataKey[key]["houseImage"] ? `${this.commonService.fireStoragePath}${this.commonService.getFireStoreCity()}%2FPaymentCollectionHistory%2FPaymentHouseImage%2F${cardNo}%2FEntities%2F${entity}%2F${neftDate}%2F${dataKey[key]["houseImage"]}?alt=media` : '';

                      this.neftList.push({ key: key, cardNo: cardNo, zone: dataKey[key]["ward"], neftNo: dataKey[key]["neftNo"], neftDate: dataKey[key]["neftDate"], neftDateFormat: neftDateFormat, name: dataKey[key]["name"], bankName: dataKey[key]["bankName"], collectedBy: dataKey[key]["collectedById"], collectedByName: dataKey[key]["collectedByName"], collectedDate: date, collectedDateFormat: collectedDateFormat, amount: dataKey[key]["amount"], monthYear: dataKey[key]["monthYear"], merchantTransactionId: dataKey[key]["merchantTransactionId"], timeStemp: timeStemp, imageUrl: imageUrl,entityType:"subEntity",entityId:entity, houseImgUrl, houseImage: dataKey[key]["houseImage"] || '',houseHolds:dataKey[key]["houseHolds"]?dataKey[key]["houseHolds"]:"1"  });
                    }

                  });
                });
              });
            }
            //******************Case of Main Entity********************
            else{
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
                let neftDate = dateData[key]["neftDate"];
                month = neftDate.split("-")[1];
                year = neftDate.split("-")[0];
                day = neftDate.split("-")[2];
                monthName = this.commonService.getCurrentMonthShortName(Number(month));
                let neftDateFormat = day + " " + monthName + " " + year;
                let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentViaNEFTImage%2F" + cardNo + "%2F" + collectedDate + "%2F" + dateData[key]["image"] + "?alt=media";
                
                const houseImgUrl = dateData[key]["houseImage"] ? `${this.commonService.fireStoragePath}${this.commonService.getFireStoreCity()}%2FPaymentCollectionHistory%2FPaymentHouseImage%2F${cardNo}%2F${collectedDate}%2F${dateData[key]["houseImage"]}?alt=media` : ''

                this.neftList.push({ key: key, cardNo: cardNo, zone: dateData[key]["ward"], neftNo: dateData[key]["neftNo"], neftDate: dateData[key]["neftDate"], neftDateFormat: neftDateFormat, name: dateData[key]["name"], bankName: dateData[key]["bankName"], collectedBy: dateData[key]["collectedById"], collectedByName: dateData[key]["collectedByName"], collectedDate: collectedDate, collectedDateFormat: collectedDateFormat, amount: dateData[key]["amount"], monthYear: dateData[key]["monthYear"], merchantTransactionId: dateData[key]["merchantTransactionId"], timeStemp: timeStemp, imageUrl: imageUrl ,entityType:'mainEntity',houseImgUrl, houseImage: dateData[key]["houseImage"] || '',houseHolds:dateData[key]["houseHolds"]?dateData[key]["houseHolds"]:"1" });
              }
            }

            }
          }
        }
        this.neftList = this.neftList.sort((a, b) => Number(b.timeStemp) < Number(a.timeStemp) ? 1 : -1);
        this.neftFilterList = this.neftList;
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

  openModel(content: any, cardNo: any, date: any, key: any, type: any,entityType:any,entityId:any) {
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
      this.entityType=entityType;
      this.entityId=entityId;

    }
    else {
      $(this.hddDeclinedCardNo).val(cardNo);
      $(this.hddDeclinedDate).val(date);
      $(this.hddDeclinedKey).val(key);
      this.entityType=entityType;
      this.entityId=entityId;
      
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
    this.entityType=='mainEntity'?this.acceptMainEntitytransaction():this.acceptSubEntitytransaction();
    
    
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
    this.entityType=='mainEntity'?this.declineMainEntitytransaction():this.declineSubEntitytransaction();
   
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
    this.entityType="";
    this.entityId="";
  }

  exportToExcel() {
    let list = this.neftFilterList;
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
      htmlString += "NEFT Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "NEFT Date";
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
      htmlString += "Payment Month";
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
        htmlString += list[i]["neftNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["neftDateFormat"];
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
        htmlString += list[i]["monthYear"];
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
      let fileName = "Payment-Via-NEFT-" + this.todayDate + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }


  acceptMainEntitytransaction(){
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "acceptMainEntitytransaction");
    let transactionId = $(this.txtTransactionId).val();
    let transactionDate = $(this.txtTransactionDate).val();
    $(this.divLoader).show();
    let cardNo = $(this.hddCardNo).val();
    let date = $(this.hddDate).val();
    let key = $(this.hddKey).val();
    let dbPath = "PaymentCollectionInfo/PaymentViaNEFT/" + cardNo + "/" + date + "/" + key;
    this.db.object(dbPath).update({ transactionId: transactionId, transactionDate: transactionDate, status: "Paid" });

    let detail = this.neftList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
    if (detail != undefined) {
      let monthYearList = detail.monthYear.split(",");
      for (let i = 0; i < monthYearList.length; i++) {
        let month = monthYearList[i].split('-')[0];
        let year = monthYearList[i].split('-')[1];
        let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/" + year + "/" + month;
        this.db.object(dbPath).update({ status: "Paid",payMethod:"NEFT" });
      }

      const transData = {
        merchantTransactionId: detail.merchantTransactionId,
        monthYear: detail.monthYear,
        payMethod: "By NEFT",
        paymentCollectionById: detail.collectedBy,
        paymentCollectionByName: detail.collectedByName,
        retrievalReferenceNo: transactionId,
        transactionAmount: detail.amount,
        transactionDateTime: transactionDate,
        updatedBy: localStorage.getItem("userID"),
        updatedDate: this.commonService.getCurrentTimeWithSecond(),
        houseImage: detail.houseImage || '',
        neftNo:detail.neftNo?detail.neftNo:'',
        bankName:detail.bankName?detail.bankName:'',
        payDate:date,
        houseHolds:detail.houseHolds
      }

      let monthName = this.commonService.getCurrentMonthName(Number(transactionDate.toString().split("-")[1])-1);
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
          collectorKey=detail.merchantTransactionId;
          const collectorData = {
            cardNo: cardNo,
            merchantTransactionId: detail.merchantTransactionId,
            payMethod: "By NEFT",
            transactionAmount: detail.amount,
            retrievalReferenceNo: transactionId
          }
          this.db.object(dbPath + "/" + collectorKey).update(collectorData);
          let index = this.neftList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
          this.neftList = this.neftList.filter((e, i) => i !== index);
          this.getFilter();
          this.clearAll();
          this.closeModel();
          this.commonService.setAlertMessage("success", "Transaction detail added successfully !!!");
          $(this.divLoader).hide();
        });
      });
    }

  }
  declineMainEntitytransaction(){
   
    let txtDeclinedReason = $(this.txtDeclinedReason).val();
    let txtDeclinedDate = $(this.txtDeclinedDate).val();
    $(this.divLoader).show();
    let cardNo = $(this.hddDeclinedCardNo).val();
    let date = $(this.hddDeclinedDate).val();
    let key = $(this.hddDeclinedKey).val();
    let dbPath = "PaymentCollectionInfo/PaymentViaNEFT/" + cardNo + "/" + date + "/" + key;
    this.db.object(dbPath).update({ declinedReason: txtDeclinedReason, transactionDate: txtDeclinedDate, status: "Declined" });
    let detail = this.neftList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
    if (detail != undefined) {
      let monthYearList = detail.monthYear.split(",");
      for (let i = 0; i < monthYearList.length; i++) {
        let month = monthYearList[i].split('-')[0];
        let year = monthYearList[i].split('-')[1];
        let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/" + year + "/" + month;
        this.db.object(dbPath).update({ status: "Pending" });
      }
    }

    let index = this.neftList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date);
    this.neftList = this.neftList.filter((e, i) => i !== index);
    this.getFilter();
    this.clearAll();
    this.closeModel();
    this.commonService.setAlertMessage("error", "Decliened data updated successfully !!!");
    $(this.divLoader).hide();


  }
  acceptSubEntitytransaction(){
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "acceptSubEntitytransaction");
    let transactionId = $(this.txtTransactionId).val();
    let transactionDate = $(this.txtTransactionDate).val();
    $(this.divLoader).show();
    let cardNo = $(this.hddCardNo).val();
    let date = $(this.hddDate).val();
    let key = $(this.hddKey).val();

  let detail = this.neftList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType==this.entityType && item.entityId==this.entityId);
  if (detail != undefined) {

    let path = "PaymentCollectionInfo/PaymentViaNEFT/" + cardNo + "/Entities/"+ detail.entityId+"/"+ date + "/" + key;
   this.db.object(path).update({ transactionId: transactionId, transactionDate: transactionDate, status: "Paid" });

    let monthYearList = detail.monthYear.split(",");
    for (let i = 0; i < monthYearList.length; i++) {
      let month = monthYearList[i].split('-')[0];
      let year = monthYearList[i].split('-')[1];
      let dbPath ="PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/Entities/" + detail.entityId+"/"+ year + "/" + month;
      this.db.object(dbPath).update({ status: "Paid" });
    }

    const transData = {
      merchantTransactionId: detail.merchantTransactionId,
      monthYear: detail.monthYear,
      payMethod: "By NEFT",
      paymentCollectionById: detail.collectedBy,
      paymentCollectionByName: detail.collectedByName,
      retrievalReferenceNo: transactionId,
      transactionAmount: detail.amount,
      transactionDateTime: transactionDate,
      updatedBy: localStorage.getItem("userID"),
      updatedDate: this.commonService.getCurrentTimeWithSecond(),
      houseImage: detail.houseImage || '',
      neftNo:detail.neftNo?detail.neftNo:'',
      bankName:detail.bankName?detail.bankName:'',
      payDate:date,
      houseHolds:detail.houseHolds
    }

    let monthName = this.commonService.getCurrentMonthName(Number(transactionDate.toString().split("-")[1])-1);
    let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/Entities/"+detail.entityId+"/" + transactionDate.toString().split('-')[0] + "/" + monthName + "/" + transactionDate;
   
    let transactionInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      transactionInstance.unsubscribe();
      let transkey = 1;
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "acceptSubEntitytransaction", data);
        let keyArray = Object.keys(data);
        transkey = keyArray.length + 1;
      }
      this.db.object(dbPath + "/" + transkey).update(transData);

      dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + detail.collectedBy + "/Entities/" + detail.entityId+"/" + transactionDate;
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
          payMethod: "By NEFT",
          transactionAmount: detail.amount,
          retrievalReferenceNo: transactionId
        }
        this.db.object(dbPath + "/" + collectorKey).update(collectorData);
        let index = this.neftList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType==this.entityType && item.entityId==this.entityId);
        this.neftList = this.neftList.filter((e, i) => i !== index);
        this.getFilter();
        this.clearAll();
        this.closeModel();
        this.commonService.setAlertMessage("success", "Transaction detail added successfully !!!");
        $(this.divLoader).hide();
      });
    });
  }

  }
  declineSubEntitytransaction(){
    let txtDeclinedReason = $(this.txtDeclinedReason).val();
    let txtDeclinedDate = $(this.txtDeclinedDate).val();
    $(this.divLoader).show();
    let cardNo = $(this.hddDeclinedCardNo).val();
    let date = $(this.hddDeclinedDate).val();
    let key = $(this.hddDeclinedKey).val();
    let detail = this.neftList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType==this.entityType && item.entityId==this.entityId); 
    if (detail != undefined) {
      let dbPath = "PaymentCollectionInfo/PaymentViaNEFT/" + cardNo + "/Entities/"+ detail.entityId+"/"+ date + "/" + key;
    this.db.object(dbPath).update({ declinedReason: txtDeclinedReason, transactionDate: txtDeclinedDate, status: "Declined" });
      let monthYearList = detail.monthYear.split(",");
      for (let i = 0; i < monthYearList.length; i++) {
        let month = monthYearList[i].split('-')[0];
        let year = monthYearList[i].split('-')[1];
        let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/Entities/" + detail.entityId+"/"+ year + "/" + month;
        this.db.object(dbPath).update({ status: "Pending" });
      }
    }

    let index = this.neftList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType==this.entityType && item.entityId==this.entityId);
    this.neftList = this.neftList.filter((e, i) => i !== index);
    this.getFilter();
    this.clearAll();
    this.closeModel();
    this.commonService.setAlertMessage("error", "Decliened data updated successfully !!!");
    $(this.divLoader).hide();

  }

}



























// updateTransaction() {
//   let transactionId = $(this.txtTransactionId).val();
//   let transactionDate = $(this.txtTransactionDate).val();
//   if (transactionId == "") {
//     this.commonService.setAlertMessage("error", "Please enter transaction id !!!");
//     return;
//   }
//   if (transactionDate == "") {
//     this.commonService.setAlertMessage("error", "Please enter transaction date !!!");
//     return;
//   }
//   if ((<HTMLInputElement>document.getElementById('chkConfirm')).checked == false) {
//     this.commonService.setAlertMessage("error", "Confirmation required !!!");
//     return;
//   }
//   $(this.divLoader).show();
//   let cardNo = $(this.hddCardNo).val();
//   let date = $(this.hddDate).val();
//   let key = $(this.hddKey).val();



//   // let dbPath = "PaymentCollectionInfo/PaymentViaNEFT/" + cardNo + "/" + date + "/" + key;
//   // this.db.object(dbPath).update({ transactionId: transactionId, transactionDate: transactionDate, status: "Paid" });

//   let detail = this.neftList.find(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType==this.entityType);
//   if (detail != undefined) {

//     let path =detail.entityType=="mainEntity" ? "PaymentCollectionInfo/PaymentViaNEFT/" + cardNo + "/" + date + "/" + key : "PaymentCollectionInfo/PaymentViaNEFT/" + cardNo + "/Entities/"+ detail.entityId+"/"+ date + "/" + key;//ternary condition in case of entity
//   this.db.object(path).update({ transactionId: transactionId, transactionDate: transactionDate, status: "Paid" });



//     let monthYearList = detail.monthYear.split(",");
//     for (let i = 0; i < monthYearList.length; i++) {
//       let month = monthYearList[i].split('-')[0];
//       let year = monthYearList[i].split('-')[1];
//       let dbPath =detail.entityType=="mainEntity" ? "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/" + year + "/" + month : "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/Entities/" + detail.entityId+"/"+ year + "/" + month;//ternary condition in case of entity
//       this.db.object(dbPath).update({ status: "Paid" });
//     }

//     const transData = {
//       merchantTransactionId: detail.merchantTransactionId,
//       monthYear: detail.monthYear,
//       payMethod: "By NEFT",
//       paymentCollectionById: detail.collectedBy,
//       paymentCollectionByName: detail.collectedByName,
//       retrievalReferenceNo: transactionId,
//       transactionAmount: detail.amount,
//       transactionDateTime: transactionDate,
//       updatedBy: localStorage.getItem("userID"),
//       updatedDate: this.commonService.getCurrentTimeWithSecond()
//     }

//     let monthName = this.commonService.getCurrentMonthName(Number(transactionDate.toString().split("-")[1])-1);
//     let dbPath = detail.entityType=="mainEntity" ? "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/" + transactionDate.toString().split('-')[0] + "/" + monthName + "/" + transactionDate : "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/Entities/"+detail.entityId+"/" + transactionDate.toString().split('-')[0] + monthName + "/" + transactionDate;////ternary condition in case of entity
   
//     let transactionInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
//       transactionInstance.unsubscribe();
//       let transkey = 1;
//       if (data != null) {
//         let keyArray = Object.keys(data);
//         transkey = keyArray.length + 1;
//       }
//       this.db.object(dbPath + "/" + transkey).update(transData);

//       dbPath = detail.entityType=="mainEntity" ?"PaymentCollectionInfo/PaymentCollectorHistory/" + detail.collectedBy + "/" + detail.collectedDate : "PaymentCollectionInfo/PaymentCollectorHistory/" + detail.collectedBy + "/Entities/" + detail.entityId+"/" + detail.collectedDate;////ternary condition in case of entity
//       let collectorInstance = this.db.object(dbPath).valueChanges().subscribe(colectorData => {
//         collectorInstance.unsubscribe();
//         let collectorKey = 1;
//         if (colectorData != null) {
//           let keyArray = Object.keys(colectorData);
//           collectorKey = keyArray.length + 1;
//         }
//         const collectorData = {
//           cardNo: cardNo,
//           merchantTransactionId: detail.merchantTransactionId,
//           payMethod: "By NEFT",
//           transactionAmount: detail.amount,
//           retrievalReferenceNo: transactionId
//         }
//         this.db.object(dbPath + "/" + collectorKey).update(collectorData);
//         let index = this.neftList.findIndex(item => item.cardNo == cardNo && item.key == key && item.collectedDate == date && item.entityType==this.entityType);
//         this.neftList = this.neftList.filter((e, i) => i !== index);
//         this.getFilter();
//         this.clearAll();
//         this.closeModel();
//         this.commonService.setAlertMessage("success", "Transaction detail added successfully !!!");
//         $(this.divLoader).hide();
//       });
//     });
//   }
// }












