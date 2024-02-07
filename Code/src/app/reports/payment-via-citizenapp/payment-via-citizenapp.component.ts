import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-payment-via-citizenapp',
  templateUrl: './payment-via-citizenapp.component.html',
  styleUrls: ['./payment-via-citizenapp.component.scss']
})
export class PaymentViaCitizenappComponent implements OnInit {

  yearList: any[];
  cityName: any;
  db: any;
  todayDate: any;
  selectedMonth: any;
  selectedYear: any;
  cardWardList: any[];
  paymentList: any[] = [];
  lastUpdateDate: any;
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  divLoader = "#divLoader";
  divLoaderMain = "#divLoaderMain";
  serviceName = "collection-management-payment-via-citizenapp";
  public columnType: any;
  public totalAmount: any;


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
    this.totalAmount = "0.00";
    this.columnType = "Ward";
    this.lastUpdateDate = "---";
    this.getYear();
    this.selectedMonth = this.todayDate.split('-')[1];
    $(this.ddlMonth).val(this.todayDate.split('-')[1]);
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.todayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.todayDate.split('-')[0];
    setTimeout(() => {
      this.getPaymentYearMonth();
    }, 200);
  }

  getCardWardMapping() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getCardWardMapping");
    this.cardWardList = [];
    let dbPath = "CardWardMapping";
    let cardWardInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      cardWardInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "CardWardMapping", data);
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let cardNo = keyArray[i];
          this.cardWardList.push({ cardNo: cardNo, ward: data[cardNo]["ward"] });
        }
      }
      this.setPaymentListJSON();
    });
  }

  getPaymentYearMonth() {
    this.paymentList = [];
    this.totalAmount = "0.00";
    if ($(this.ddlYear).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if ($(this.ddlMonth).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    $(this.divLoader).show();
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    let monthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FCitizenAppMonthlyPayment%2F" + this.selectedYear + "%2F" + monthName + ".json?alt=media";
    let cardJSONInstance = this.httpService.get(path).subscribe(cardJsonData => {
      cardJSONInstance.unsubscribe();
      if (cardJsonData != null) {
        this.lastUpdateDate = cardJsonData["lastUpdateDate"];
        this.paymentList = JSON.parse(JSON.stringify(cardJsonData["data"]));
        this.getTotalAmount();
        $(this.divLoader).hide();
      }
    }, error => {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("error", "Sorry! No data found !!!");
    });
  }

  updatePaymentData() {
    $(this.divLoaderMain).show();
    this.paymentList=[];
    this.totalAmount = "0.00";
    this.getCardWardMapping();
  }

  getTotalAmount() {
    let amount = 0;
    for (let i = 0; i < this.paymentList.length; i++) {
      amount += Number(this.paymentList[i]["amount"]);
    }
    this.totalAmount = amount.toFixed(2);
  }

  setPaymentListJSON() {
    this.paymentList = [];
    let year = $(this.ddlYear).val();
    let month = $(this.ddlMonth).val();
    let days = new Date(Number(year), Number(month), 0).getDate();
    this.getData(1, year, month, days);
  }

  getData(index: any, year: any, month: any, days: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getData");
    if (index > days) {
      this.getTotalAmount();
      this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
      let filePath = "/PaymentCollectionHistory/CitizenAppMonthlyPayment/" + this.selectedYear + "/";
      const obj = { "data": this.paymentList, "lastUpdateDate": this.lastUpdateDate };
      let monthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
      let fileName = monthName + ".json";
      this.commonService.saveJsonFile(obj, fileName, filePath);
      $(this.divLoaderMain).hide();
    }
    else {
      let monthDate = year + '-' + month + '-' + (index < 10 ? '0' : '') + index;
      let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/100/" + monthDate;
      let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
        instance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getData", data);
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let ward = "";
            let detail = this.cardWardList.find(item => item.cardNo == data[keyArray[i]]["cardNo"]);
            if (detail != undefined) {
              ward = detail.ward;
            }

            let newMonth = monthDate.split("-")[1];
            let newYear = monthDate.split("-")[0];
            let day = monthDate.split("-")[2];
            let monthName = this.commonService.getCurrentMonthShortName(Number(newMonth));
            let collectedDate = day + " " + monthName + " " + newYear;
            this.paymentList.push({ collectedDate: collectedDate, cardNo: data[keyArray[i]]["cardNo"], transactionNo: data[keyArray[i]]["merchantTransactionId"], referenceNo: data[keyArray[i]]["retrievalReferenceNo"], amount: Number(data[keyArray[i]]["transactionAmount"]).toFixed(2), paymentMethod: data[keyArray[i]]["payMethod"], ward: ward })
          }
          index++;
          this.getData(index, year, month, days);
        }
        else {
          index++;
          this.getData(index, year, month, days);
        }
      });
    }
  }

  exportToExcel() {
    let list = this.paymentList;
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
      htmlString += "Transaction ID";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Reference No";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Payment By";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Amount";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < list.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["collectedDate"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["cardNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["ward"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["transactionNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["referenceNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["paymentMethod"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += list[i]["amount"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let monthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
      let fileName = "Payment-Via-Citizen-App-Report" + this.selectedYear + "-" + monthName + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}
