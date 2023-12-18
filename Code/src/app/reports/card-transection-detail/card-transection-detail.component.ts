import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";


@Component({
  selector: 'app-card-transection-detail',
  templateUrl: './card-transection-detail.component.html',
  styleUrls: ['./card-transection-detail.component.scss']
})
export class CardTransectionDetailComponent implements OnInit {

  constructor(private commonService: CommonService, public httpService: HttpClient, public fs: FirebaseService) { }
  cityName: any;
  db: any;
  transactionList: any[];
  txtCardNo = "#txtCardNo";
  public totalAmount: any;
  divLoader = "#divLoader";
  cardPrefix: any;
  houseTypeList: any[] = [];
  public ward: any;
  public name: any;
  public entityType: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.totalAmount = "0.00";
    if (this.cityName == "jaipur-malviyanagar") {
      this.cardPrefix = "MNZ";
    }
    else if (this.cityName == "jaipur-murlipura"){
      this.cardPrefix = "MPZ";
    }
    else {
      this.cardPrefix = "PAL";
    }
    this.ward = "---";
    this.name = "---";
    this.entityType = "---";
    this.getHouseType();
  }

  getHouseType() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDefaults%2FFinalHousesType.json?alt=media";
    let houseTypeInstance = this.httpService.get(path).subscribe(data => {
      houseTypeInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 1; i < keyArray.length; i++) {
          let id = keyArray[i];
          let houseType = data[id]["name"].toString().split("(")[0];
          this.houseTypeList.push({ id: id, houseType: houseType, entityType: data[id]["entity-type"] });
        }
      }
    });
  }

  getCardDetail() {
    this.ward = "---";
    this.name = "---";
    this.entityType = "---";
    let cardNo = this.cardPrefix + $(this.txtCardNo).val();
    let dbPath = "CardWardMapping/" + cardNo;
    let cardWardInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      cardWardInstance.unsubscribe();
      if (data != null) {
        this.ward = data["ward"];
        let lineNo = data["line"];
        dbPath = "Houses/" + this.ward + "/" + lineNo + "/" + cardNo;
        let cardInstance = this.db.object(dbPath).valueChanges().subscribe(cardData => {
          cardInstance.unsubscribe();
          if (cardData != null) {
            this.name = cardData["name"];
            let houseType = cardData["houseType"];
            console.log(houseType)
            let detail = this.houseTypeList.find(item => item.id == houseType);
            if (detail != undefined) {
              this.entityType = detail.houseType;
            }
          }
        })
      }
    });
  }

  getTransaction() {
    this.totalAmount = "0.00";
    this.transactionList = [];
    if ($(this.txtCardNo).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter card number");
      return;
    }
    this.getCardDetail();
    $(this.divLoader).show();
    let cardNo = this.cardPrefix + $(this.txtCardNo).val();
    let amount = 0;
    let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo;
    let instance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        instance.unsubscribe();
        console.log(data);
        if (data != null) {
          let yearArray = Object.keys(data);
          for (let i = 0; i < yearArray.length; i++) {
            let year = yearArray[i];
            if (year != "Entities") {
              let yearData = data[year];
              let monthArray = Object.keys(yearData);
              for (let j = 0; j < monthArray.length; j++) {
                let month = monthArray[j];
                let monthData = yearData[month];
                let dateyArray = Object.keys(monthData);
                for (let k = 0; k < dateyArray.length; k++) {
                  let date = dateyArray[k];
                  let dateData = monthData[date];
                  let keyArray = Object.keys(dateData);
                  for (let l = 0; l < keyArray.length; l++) {
                    let key = keyArray[l];
                    amount = amount + Number(dateData[key]["transactionAmount"]);
                    let timestemp = new Date(date).getTime();
                    this.transactionList.push({ timestemp: timestemp, key: key, transDate: "", year: year, month: month, date, transId: dateData[key]["merchantTransactionId"], referId: dateData[key]["retrievalReferenceNo"], payMethod: dateData[key]["payMethod"], collectedBy: dateData[key]["paymentCollectionByName"], amount: Number(dateData[key]["transactionAmount"]).toFixed(2), monthYear: dateData[key]["monthYear"] });
                    this.transactionList = this.transactionList.sort((a, b) =>
                      b.timestemp < a.timestemp ? 1 : -1
                    );
                    this.getDateTimeFormat(key, dateData[key]["transactionDateTime"], date, year, month);
                  }
                }
              }
            }
            else {
              let entityData = data["Entities"];
              this.getEntityPayment(entityData,amount);
            }
          }
          this.totalAmount = amount.toFixed(2);
          $(this.divLoader).hide();
        }
        else {
          this.commonService.setAlertMessage("error", "No transaction found for card number " + cardNo);
          $(this.divLoader).hide();
        }
      }
    );
  }

  getEntityPayment(entityData: any,amount:any) {
    let entityKeyArray = Object.keys(entityData);
    for(let i=0;i<entityKeyArray.length;i++){
      let entityKey=entityKeyArray[i];
      let data=entityData[entityKey];
      let yearArray = Object.keys(data);
          for (let i = 0; i < yearArray.length; i++) {
            let year = yearArray[i];
            if (year != "Entities") {
              let yearData = data[year];
              let monthArray = Object.keys(yearData);
              for (let j = 0; j < monthArray.length; j++) {
                let month = monthArray[j];
                let monthData = yearData[month];
                let dateyArray = Object.keys(monthData);
                for (let k = 0; k < dateyArray.length; k++) {
                  let date = dateyArray[k];
                  let dateData = monthData[date];
                  let keyArray = Object.keys(dateData);
                  for (let l = 0; l < keyArray.length; l++) {
                    let key = keyArray[l];
                    amount = amount + Number(dateData[key]["transactionAmount"]);
                    let timestemp = new Date(date).getTime();
                    this.transactionList.push({ timestemp: timestemp, key: key, transDate: "", year: year, month: month, date, transId: dateData[key]["merchantTransactionId"], referId: dateData[key]["retrievalReferenceNo"], payMethod: dateData[key]["payMethod"], collectedBy: dateData[key]["paymentCollectionByName"], amount: Number(dateData[key]["transactionAmount"]).toFixed(2), monthYear: dateData[key]["monthYear"] });
                    this.transactionList = this.transactionList.sort((a, b) =>
                      b.timestemp < a.timestemp ? 1 : -1
                    );
                    this.getDateTimeFormat(key, dateData[key]["transactionDateTime"], date, year, month);
                  }
                }
              }
            }
          }
          this.totalAmount = amount.toFixed(2);
    }
  }

  getDateTimeFormat(key: any, transDate: any, date: any, year: any, month: any) {
    let list = transDate.split(" ");
    let time = "";
    if (list.length > 1) {
      time = transDate.split(" ")[1];
    }
    let newDate = transDate.split(" ")[0];
    let newMonth = newDate.split("-")[1];
    let newYear = newDate.split("-")[0];
    let day = newDate.split("-")[2];
    let monthName = this.commonService.getCurrentMonthShortName(Number(newMonth));
    let detail = this.transactionList.find(item => item.key == key && item.year == year && item.month == month && item.date == date);
    if (detail != undefined) {
      if (list.length > 1) {
        detail.transDate = day + " " + monthName + " " + newYear + " | " + time.split(":")[0] + ":" + time.split(":")[1];
      }
      else {
        detail.transDate = day + " " + monthName + " " + newYear;
      }
    }
  }

  exportToExcel() {
    if (this.transactionList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Transaction ID";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Reference ID";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Payment Method";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Payment Month";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Payment Collected By";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Amount";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.transactionList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.transactionList[i]["date"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.transactionList[i]["transId"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.transactionList[i]["referId"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.transactionList[i]["payMethod"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.transactionList[i]["monthYear"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.transactionList[i]["collectedBy"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.transactionList[i]["amount"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Card No " + $(this.txtCardNo).val() + "-Transaction-Detail.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}
