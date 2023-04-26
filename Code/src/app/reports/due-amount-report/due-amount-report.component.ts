import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-due-amount-report',
  templateUrl: './due-amount-report.component.html',
  styleUrls: ['./due-amount-report.component.scss']
})
export class DueAmountReportComponent implements OnInit {

  constructor(private commonService: CommonService, public fs: FirebaseService, public httpService: HttpClient) { }
  zoneList: any[];
  yearList: any[];
  wardCardList: any[];
  wardCardFinalList: any[];
  rowDataList: any;
  wardCardPaymentList: any[];
  entityTypeList: any[];
  cityName: any;
  db: any;
  selectedYear: any;
  selectedZone: any;
  chargeStartYear: any;
  chargeStartMonth: any;
  todayDate: any;
  ddlYear = "#ddlYear";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";
  divLoaderGet = "#divLoaderGet";
  Jan: any;
  Feb: any;
  Mar: any;
  Apr: any;
  May: any;
  Jun: any;
  Jul: any;
  Aug: any;
  Sep: any;
  Oct: any;
  Nov: any;
  Dec: any;
  totalDueAmount: any;
  processedCards: any;
  totalCards: any;
  lastUpdateDate: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.todayDate = this.commonService.setTodayDate();
    this.setDefaultValues();
    this.getZoneList();
    this.getYearList();
    this.getStartChargesMonthYear();
    this.getEntityTypes();
  }

  setDefaultValues() {
    this.Jan = "0.00";
    this.Feb = "0.00";
    this.Mar = "0.00";
    this.Apr = "0.00";
    this.May = "0.00";
    this.Jun = "0.00";
    this.Jul = "0.00";
    this.Aug = "0.00";
    this.Sep = "0.00";
    this.Oct = "0.00";
    this.Nov = "0.00";
    this.Dec = "0.00";
    this.totalDueAmount = "0.00";
    this.processedCards = "0";
    this.totalCards = "0";
    this.lastUpdateDate = "---";
  }

  getZoneList() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.selectedZone = "0";
  }

  getYearList() {
    this.yearList = [];
    let year = parseInt(this.commonService.setTodayDate().split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = year;
  }

  getStartChargesMonthYear() {
    let dbPath = "Settings/PaymentCollectionSettings/userChargesApplicableFrom";
    let userChargeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        userChargeInstance.unsubscribe();
        if (data != null) {
          this.chargeStartMonth = Number(this.commonService.getMonthShortNameToMonth(data.toString().split('-')[0]));
          this.chargeStartYear = Number(data.toString().split('-')[1]);
        }
      }
    );
  }

  getEntityTypes() {
    this.entityTypeList = [];
    let dbPath = "Settings/PaymentCollectionSettings/EntityType";
    let entityTypeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        entityTypeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let entityTypeId = keyArray[i];
            this.entityTypeList.push({ entityTypeId: entityTypeId, entityType: data[entityTypeId]["name"], amount: data[entityTypeId]["amount"] });
          }
        }
      }
    )
  }

  changeSelection() {
    if ($(this.ddlYear).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.wardCardList = [];
    this.wardCardFinalList = [];
    this.selectedYear = $(this.ddlYear).val();
    this.selectedZone = $(this.ddlZone).val();
    this.getCardPaymentHistory();
  }

  getCardPaymentHistory() {
    $(this.divLoaderGet).show();
    let element = <HTMLElement>document.getElementById("divList");
    element.scrollTop = 0;
    this.rowDataList = 200;
    this.setDefaultValues();
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FDueAmountHistory%2F" + this.selectedYear + "%2F" + this.selectedZone + ".json?alt=media";
    let monthWiseInstance = this.httpService.get(path).subscribe((data) => {
      monthWiseInstance.unsubscribe();
      if (data != null) {
        this.lastUpdateDate = data["lastUpdateDate"];
        this.wardCardList = JSON.parse(JSON.stringify(data["cards"]));
        this.wardCardFinalList = this.wardCardList.slice(0, this.rowDataList);
        this.setTotalInFooter();
      }
    }, error => {
      this.commonService.setAlertMessage("error", "No updated data found. Please update data !!!");
      $(this.divLoaderGet).hide();
    });
  }

  setTotalInFooter() {
    let sum = this.wardCardList.reduce(function (previousValue, currentValue) {
      return {
        Jan: (Number(previousValue.Jan) + Number(currentValue.Jan)).toFixed(2),
        Feb: (Number(previousValue.Feb) + Number(currentValue.Feb)).toFixed(2),
        Mar: (Number(previousValue.Mar) + Number(currentValue.Mar)).toFixed(2),
        Apr: (Number(previousValue.Apr) + Number(currentValue.Apr)).toFixed(2),
        May: (Number(previousValue.May) + Number(currentValue.May)).toFixed(2),
        Jun: (Number(previousValue.Jun) + Number(currentValue.Jun)).toFixed(2),
        Jul: (Number(previousValue.Jul) + Number(currentValue.Jul)).toFixed(2),
        Aug: (Number(previousValue.Aug) + Number(currentValue.Aug)).toFixed(2),
        Sep: (Number(previousValue.Sep) + Number(currentValue.Sep)).toFixed(2),
        Oct: (Number(previousValue.Oct) + Number(currentValue.Oct)).toFixed(2),
        Nov: (Number(previousValue.Nov) + Number(currentValue.Nov)).toFixed(2),
        Dec: (Number(previousValue.Dec) + Number(currentValue.Dec)).toFixed(2),

      }
    });

    let totalAmount = 0;
    if (!isNaN(sum["Jan"])) {
      this.Jan = (Number(sum["Jan"])).toFixed(2);
      totalAmount += Number(sum["Jan"]);
    }
    if (!isNaN(sum["Feb"])) {
      this.Feb = (Number(sum["Feb"])).toFixed(2);
      totalAmount += Number(sum["Feb"]);
    }
    if (!isNaN(sum["Mar"])) {
      this.Mar = (Number(sum["Mar"])).toFixed(2);
      totalAmount += Number(sum["Mar"]);
    }
    if (!isNaN(sum["Apr"])) {
      this.Apr = (Number(sum["Apr"])).toFixed(2);
      totalAmount += Number(sum["Apr"]);
    }
    if (!isNaN(sum["May"])) {
      this.May = (Number(sum["May"])).toFixed(2);
      totalAmount += Number(sum["May"]);
    }
    if (!isNaN(sum["Jun"])) {
      this.Jun = (Number(sum["Jun"])).toFixed(2);
      totalAmount += Number(sum["Jun"]);
    }
    if (!isNaN(sum["Jul"])) {
      this.Jul = (Number(sum["Jul"])).toFixed(2);
      totalAmount += Number(sum["Jul"]);
    }
    if (!isNaN(sum["Aug"])) {
      this.Aug = (Number(sum["Aug"])).toFixed(2);
      totalAmount += Number(sum["Aug"]);
    }
    if (!isNaN(sum["Sep"])) {
      this.Sep = (Number(sum["Sep"])).toFixed(2);
      totalAmount += Number(sum["Sep"]);
    }
    if (!isNaN(sum["Oct"])) {
      this.Oct = (Number(sum["Oct"])).toFixed(2);
      totalAmount += Number(sum["Oct"]);
    }
    if (!isNaN(sum["Nov"])) {
      this.Nov = (Number(sum["Nov"])).toFixed(2);
      totalAmount += Number(sum["Nov"]);
    }
    if (!isNaN(sum["Dec"])) {
      this.Dec = (Number(sum["Dec"])).toFixed(2);
      totalAmount += Number(sum["Dec"]);
    }
    this.totalDueAmount = totalAmount.toFixed(2);
    $(this.divLoaderGet).hide();
  }


  onContainerScroll() {
    let element = <HTMLElement>document.getElementById("divList");
    if ((element.offsetHeight + element.scrollTop + 10) >= element.scrollHeight) {
      this.rowDataList = this.rowDataList + 200;
      this.wardCardFinalList = this.wardCardList.slice(0, this.rowDataList);
    }
  }

  updateCardColectionData() {
    $(this.divLoader).show();
    this.setDefaultValues();
    let monthFrom = 1;
    let monthTo = 12;
    let year = this.todayDate.split('-')[0];

    if (Number(this.selectedYear) < Number(this.chargeStartYear)) {
      this.commonService.setAlertMessage("error", "No Data Found !!!");
      $(this.divLoader).hide();
      return;
    }
    else if (Number(this.selectedYear) == Number(this.chargeStartYear)) {
      monthFrom = Number(this.chargeStartMonth);
    }
    if (Number(this.selectedYear) == Number(year)) {
      monthTo =Number(this.commonService.getPreviousMonth(this.todayDate,1).toString().split('-')[1]);
    }

    this.wardCardPaymentList = [];
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardWiseCardJSON%2F" + this.selectedZone + ".json?alt=media";
    let entityTypeInstance = this.httpService.get(path).subscribe(data => {
      entityTypeInstance.unsubscribe();
      if (data != null) {
        let list = JSON.parse(JSON.stringify(data));
        this.totalCards = list.length;
        for (let i = 0; i < list.length; i++) {
          let entityTypeId = list[i]["entityType"];
          let entityType = "";
          let charges = "0";
          let detail = this.entityTypeList.find(item => item.entityTypeId == entityTypeId);
          if (detail != undefined) {
            entityType = detail.entityType;
            charges = detail.amount;
          }
          this.wardCardPaymentList.push({ cardNo: list[i]["cardNo"], entityTypeId: entityTypeId, entityType: entityType, charges: charges, totalAmount: 0 });
        }
      }
      this.getDueAmount(0, monthFrom, monthTo);
    });
  }

  getDueAmount(index: any, monthFrom: any, monthTo: any) {
    if (index == this.wardCardPaymentList.length) {
      this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
      this.wardCardList = this.wardCardPaymentList;
      let element = <HTMLElement>document.getElementById("divList");
      element.scrollTop = 0;
      this.rowDataList = 200;
      this.wardCardFinalList = this.wardCardList.slice(0, this.rowDataList);
      this.setTotalInFooter();
      let filePath = "/PaymentCollectionHistory/DueAmountHistory/" + this.selectedYear + "/";
      const obj = { "cards": this.wardCardPaymentList, "lastUpdateDate": this.lastUpdateDate };
      let fileName = this.selectedZone + ".json";
      this.commonService.saveJsonFile(obj, fileName, filePath);
      this.commonService.setAlertMessage("success", "Data updated successfully !!!");
      $(this.divLoader).hide();
    }
    else {
      this.processedCards = index + 1;
      let cardNo = this.wardCardPaymentList[index]["cardNo"];
      let charges = this.wardCardPaymentList[index]["charges"];
      let dbPath = "PaymentCollectionHistory/" + cardNo + "/" + this.selectedYear;
      let collectionInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          collectionInstance.unsubscribe();
          let totalAmount = 0;
          if (data != null) {
            for (let i = monthFrom; i <= monthTo; i++) {
              let monthName = this.commonService.getCurrentMonthShortName(i);
              let amount = "0";
              if (data[monthName] != null) {
                if (data[monthName]["status"] == 'Pending') {
                  amount = data[monthName]["amount"];
                }
              }
              else {
                amount = charges;
                this.setDueAmountDatabase(cardNo, monthName, amount);
              }
              totalAmount += Number(amount);
              this.setDueTotalAmount(cardNo, totalAmount);
              this.setMonthAmountInList(cardNo, monthName, amount);
            }
          }
          else {
            for (let i = monthFrom; i <= monthTo; i++) {
              let monthName = this.commonService.getCurrentMonthShortName(i);
              let amount = charges;
              totalAmount += Number(amount);
              this.setDueTotalAmount(cardNo, totalAmount);
              this.setMonthAmountInList(cardNo, monthName, amount);
              this.setDueAmountDatabase(cardNo, monthName, amount);
            }
          }
          index++;
          this.getDueAmount(index, monthFrom, monthTo);
        }
      );
    }
  }

  setMonthAmountInList(cardNo: any, monthName: any, amount: any) {
    let detail = this.wardCardPaymentList.find(item => item.cardNo == cardNo);
    if (detail != undefined) {
      detail[monthName] = Number(amount).toFixed(2);
    }
  }

  setDueTotalAmount(cardNo: any, totalAmount: any) {
    let detail = this.wardCardPaymentList.find(item => item.cardNo == cardNo);
    if (detail != undefined) {
      detail.totalAmount = Number(totalAmount).toFixed(2);
    }
  }

  setDueAmountDatabase(cardNo: any, monthName: any, amount: any) {
    const data = {
      amount: amount,
      status: "Pending"
    }
    let dbPath = "PaymentCollectionHistory/" + cardNo + "/" + this.selectedYear + "/" + monthName;
    this.db.object(dbPath).update(data);

  }

  exportToExcel() {
    if (this.wardCardList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Card Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Entity Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "JAN";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "FEB";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "MAR";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "APR";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "MAY";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "JUN";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "JUL";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "AUG";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "SEP";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "OCT";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "NOV";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "DEC";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total Amount";
      htmlString += "</td>";
      htmlString += "</tr>";
      if (this.wardCardList.length > 0) {

        let totalAmount = 0;
        for (let i = 0; i < this.wardCardList.length; i++) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += this.wardCardList[i]["cardNo"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.wardCardList[i]["entityType"];
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Jan"] != undefined) {
            htmlString += this.wardCardList[i]["Jan"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Feb"] != undefined) {
            htmlString += this.wardCardList[i]["Feb"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Mar"] != undefined) {
            htmlString += this.wardCardList[i]["Mar"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Apr"] != undefined) {
            htmlString += this.wardCardList[i]["Apr"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["May"] != undefined) {
            htmlString += this.wardCardList[i]["May"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Jun"] != undefined) {
            htmlString += this.wardCardList[i]["Jun"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Jul"] != undefined) {
            htmlString += this.wardCardList[i]["Jul"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Aug"] != undefined) {
            htmlString += this.wardCardList[i]["Aug"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Sep"] != undefined) {
            htmlString += this.wardCardList[i]["Sep"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Oct"] != undefined) {
            htmlString += this.wardCardList[i]["Oct"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Nov"] != undefined) {
            htmlString += this.wardCardList[i]["Nov"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Dec"] != undefined) {
            htmlString += this.wardCardList[i]["Dec"];
          }
          else{
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.wardCardList[i]["totalAmount"];
          htmlString += "</td>";
          htmlString += "</tr>";
          totalAmount += Number(this.wardCardList[i]["totalAmount"]);
        }
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "<td></td>";
        htmlString += "</tr>";

        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>Total</td>";
        htmlString += "<td>";
        htmlString += this.Jan;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Feb;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Mar;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Apr;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.May;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Jun;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Jul;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Aug;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Sep;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Oct;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Nov;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.Dec;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += totalAmount;
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = this.commonService.getFireStoreCity() + "-DueAmountReport.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}
