import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-collected-amount-report',
  templateUrl: './collected-amount-report.component.html',
  styleUrls: ['./collected-amount-report.component.scss']
})
export class CollectedAmountReportComponent implements OnInit {
  constructor(private commonService: CommonService, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, public httpService: HttpClient) { }
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
  serviceName = "collection-management-collected-amount-report";
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getStartChargesMonthYear");
    let dbPath = "Settings/PaymentCollectionSettings/userChargesApplicableFrom";
    let userChargeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        userChargeInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getStartChargesMonthYear", data);
          this.chargeStartMonth = Number(this.commonService.getMonthShortNameToMonth(data.toString().split('-')[0]));
          this.chargeStartYear = Number(data.toString().split('-')[1]);
        }
      }
    );
  }

  getEntityTypes() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getEntityTypes");
    this.entityTypeList = [];
    let dbPath = "Settings/PaymentCollectionSettings/EntityType";
    let entityTypeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        entityTypeInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getEntityTypes", data);
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
    this.rowDataList = 15;
    this.setDefaultValues();
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FCollectedAmountHistory%2F" + this.selectedYear + "%2F" + this.selectedZone + ".json?alt=media";
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
        Jan: (Number(previousValue.Jan ? previousValue.Jan : 0) + Number(currentValue.Jan ? currentValue.Jan : 0)).toFixed(2),
        Feb: (Number(previousValue.Feb ? previousValue.Feb : 0) + Number(currentValue.Feb ? currentValue.Feb : 0)).toFixed(2),
        Mar: (Number(previousValue.Mar ? previousValue.Mar : 0) + Number(currentValue.Mar ? currentValue.Mar : 0)).toFixed(2),
        Apr: (Number(previousValue.Apr ? previousValue.Apr : 0) + Number(currentValue.Apr ? currentValue.Apr : 0)).toFixed(2),
        May: (Number(previousValue.May ? previousValue.May : 0) + Number(currentValue.May ? currentValue.May : 0)).toFixed(2),
        Jun: (Number(previousValue.Jun ? previousValue.Jun : 0) + Number(currentValue.Jun ? currentValue.Jun : 0)).toFixed(2),
        Jul: (Number(previousValue.Jul ? previousValue.Jul : 0) + Number(currentValue.Jul ? currentValue.Jul : 0)).toFixed(2),
        Aug: (Number(previousValue.Aug ? previousValue.Aug : 0) + Number(currentValue.Aug ? currentValue.Aug : 0)).toFixed(2),
        Sep: (Number(previousValue.Sep ? previousValue.Sep : 0) + Number(currentValue.Sep ? currentValue.Sep : 0)).toFixed(2),
        Oct: (Number(previousValue.Oct ? previousValue.Oct : 0) + Number(currentValue.Oct ? currentValue.Oct : 0)).toFixed(2),
        Nov: (Number(previousValue.Nov ? previousValue.Nov : 0) + Number(currentValue.Nov ? currentValue.Nov : 0)).toFixed(2),
        Dec: (Number(previousValue.Dec ? previousValue.Dec : 0) + Number(currentValue.Dec ? currentValue.Dec : 0)).toFixed(2),

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
      this.rowDataList = this.rowDataList + 20;
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
      monthTo = Number(this.commonService.getPreviousMonth(this.todayDate, 1).toString().split('-')[1]);
    }

    this.wardCardPaymentList = [];

    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        if (markerData != null) {
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                if (lineData[markerNo]["latLng"] != null) {
                  let markerId = "";
                  if (lineData[markerNo]["cardNumber"] != null) {
                    markerId = lineData[markerNo]["cardNumber"];
                  }
                  else if (lineData[markerNo]["markerId"] != null) {
                    markerId = this.commonService.getDefaultCardPrefix() + lineData[markerNo]["markerId"];
                  }

                  let entityTypeId = lineData[markerNo]["houseType"];
                  let entityType = "";
                  let charges = "0";
                  let detail = this.entityTypeList.find(item => item.entityTypeId == entityTypeId);
                  if (detail != undefined) {
                    entityType = detail.entityType;
                    charges = detail.amount;
                  }
                  let cardDetail = this.wardCardPaymentList.find(item => item.cardNo == markerId);
                  if (cardDetail == undefined) {
                    this.wardCardPaymentList.push({ cardNo: markerId, entityTypeId: entityTypeId, entityType: entityType, charges: charges, totalAmount: 0 });
                  }
                }
              }
            }
          }
        }
        if (this.wardCardPaymentList.length > 0) {
          this.totalCards = this.wardCardPaymentList.length;
          for(let i=0;i<this.wardCardPaymentList.length;i++){
            for(let j=monthFrom;j<=monthTo;j++){
              let monthName = this.commonService.getCurrentMonthShortName(j);
              console.log(this.wardCardPaymentList[i]["cardNo"]);
              console.log(monthName);
              
              this.setMonthAmountInList(this.wardCardPaymentList[i]["cardNo"], monthName.trim(), 0, "");
            }
          }

          const promises = [];
          for (let i = 0; i < this.wardCardPaymentList.length; i++) {
            promises.push(Promise.resolve(this.getCollectedAmountNew(this.wardCardPaymentList[i]["cardNo"], monthFrom, monthTo)));
          }
          Promise.all(promises).then((results) => {

            this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
            this.wardCardList = this.wardCardPaymentList;
            let element = <HTMLElement>document.getElementById("divList");
            element.scrollTop = 0;
            this.rowDataList = 200;
            this.wardCardFinalList = this.wardCardList.slice(0, this.rowDataList);
            this.setTotalInFooter();
            let filePath = "/PaymentCollectionHistory/CollectedAmountHistory/" + this.selectedYear + "/";
            const obj = { "cards": this.wardCardPaymentList, "lastUpdateDate": this.lastUpdateDate };
            let fileName = this.selectedZone + ".json";
            this.commonService.saveJsonFile(obj, fileName, filePath);
            setTimeout(() => {
              $(this.divLoader).hide();
              this.commonService.setAlertMessage("success", "Data updated successfully !!!");
            }, 1200);
          });

          // this.getCollectedAmount(0, monthFrom, monthTo);
        }
        else {
          this.commonService.setAlertMessage("error", "No record found.");
          $(this.divLoader).hide();
        }
      });



    /*
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
          this.getCollectedAmount(0, monthFrom, monthTo);
        });
        */
  }


  getCollectedAmountNew(cardNo: any, monthFrom: any, monthTo: any) {
    return new Promise(async (resolve) => {
      console.log(monthFrom,monthTo)
      let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo;
      let transactionInstance = this.db.object(dbPath).valueChanges().subscribe(async data => {
        transactionInstance.unsubscribe();
        let totalAmount = 0;
        if (data != null) {
          let yearArray = Object.keys(data);
          for (let i = 0; i < yearArray.length; i++) {
            let year = yearArray[i];
            let yearData = data[year];
            let monthArray = Object.keys(yearData);
            for (let j = 0; j < monthArray.length; j++) {
              let month = monthArray[j];
              let monthData = yearData[month];
              let dateArray = Object.keys(monthData);
              for (let k = 0; k < dateArray.length; k++) {
                let date = dateArray[k];
                let dateData = monthData[date];
                let keyArray = Object.keys(dateData);
                for (let l = 0; l < keyArray.length; l++) {
                  let key = keyArray[l];
                  if (dateData[key]["monthYear"] != undefined) {
                    let monthYearList = dateData[key]["monthYear"] ? dateData[key]["monthYear"].split(',') : [];
                    let transactionAmount = dateData[key]["transactionAmount"] ? Number(dateData[key]["transactionAmount"]) : 0;
                    let amount = transactionAmount / monthYearList.length;
                    for (let m = 0; m < monthYearList.length; m++) {
                      let monthName = monthYearList[m].split('-')[0];
                      let yearName = monthYearList[m].split('-')[1];
                      if (yearName == this.selectedYear) {
                        totalAmount += Number(amount);
                        await this.setCollectedTotalAmount(cardNo, totalAmount);
                        await this.setMonthAmountInList(cardNo, monthName.trim(), Number(amount), date);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        resolve({ status: "success", data: {} });
      });
    });
  }
/*
  getCollectedAmount(index: any, monthFrom: any, monthTo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getCollectedAmount");
    if (index == this.wardCardPaymentList.length) {
      this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
      this.wardCardList = this.wardCardPaymentList;
      let element = <HTMLElement>document.getElementById("divList");
      element.scrollTop = 0;
      this.rowDataList = 200;
      this.wardCardFinalList = this.wardCardList.slice(0, this.rowDataList);
      this.setTotalInFooter();
      let filePath = "/PaymentCollectionHistory/CollectedAmountHistory/" + this.selectedYear + "/";
      const obj = { "cards": this.wardCardPaymentList, "lastUpdateDate": this.lastUpdateDate };
      let fileName = this.selectedZone + ".json";
      this.commonService.saveJsonFile(obj, fileName, filePath);
      this.commonService.setAlertMessage("success", "Data updated successfully !!!");
      $(this.divLoader).hide();
    }
    else {
      this.processedCards = index + 1;
      let cardNo = this.wardCardPaymentList[index]["cardNo"];
      let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/" + this.selectedYear;
      let collectionInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          collectionInstance.unsubscribe();
          let totalAmount = 0;
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getCollectedAmount", data);
            for (let i = monthFrom; i <= monthTo; i++) {
              let monthName = this.commonService.getCurrentMonthShortName(i);
              let amount = "0";
              if (data[monthName] != null) {
                if (data[monthName]["status"] == 'Paid') {
                  amount = data[monthName]["amount"];
                  totalAmount += Number(amount);
                  this.setCollectedTotalAmount(cardNo, totalAmount);
                  this.setMonthAmountInList(cardNo, monthName, amount);
                }
                else {
                  this.setMonthAmountInList(cardNo, monthName, amount);
                }
              }
              else {
                this.setMonthAmountInList(cardNo, monthName, amount);
              }
            }
          }
          else {
            for (let i = monthFrom; i <= monthTo; i++) {
              let monthName = this.commonService.getCurrentMonthShortName(i);
              let amount = "0";
              this.setMonthAmountInList(cardNo, monthName, amount);
            }
          }
          index++;
          this.getCollectedAmount(index, monthFrom, monthTo);
        }
      );
    }
  }
  */

  
  setMonthAmountInList(cardNo: any, monthName: any, amount: any, transactionDate: any) {
    return new Promise((resolve) => {
      let detail = this.wardCardPaymentList.find(item => item.cardNo == cardNo);
      if (detail != undefined) {
        detail[monthName] = Number(amount).toFixed(2);
        let monthTransationDate = monthName + "transDate";
        if (transactionDate != "") {
          let month = transactionDate.split("-")[1];
          let year = transactionDate.split("-")[0];
          let day = transactionDate.split("-")[2];
          let monthName1 = this.commonService.getCurrentMonthShortName(Number(month));
          let date = day + "-" + monthName1 + "-" + year;
          detail[monthTransationDate] = date;
        }
        else {
          detail[monthTransationDate] = transactionDate;
        }
      }
      resolve({ status: "success" });
    })
  }

  setCollectedTotalAmount(cardNo: any, totalAmount: any) {
    return new Promise((resolve) => {
      let detail = this.wardCardPaymentList.find(item => item.cardNo == cardNo);
      if (detail != undefined) {
        detail.totalAmount = Number(totalAmount).toFixed(2);
      }
      resolve({ status: "success" });
    })
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
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Feb"] != undefined) {
            htmlString += this.wardCardList[i]["Feb"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Mar"] != undefined) {
            htmlString += this.wardCardList[i]["Mar"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Apr"] != undefined) {
            htmlString += this.wardCardList[i]["Apr"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["May"] != undefined) {
            htmlString += this.wardCardList[i]["May"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Jun"] != undefined) {
            htmlString += this.wardCardList[i]["Jun"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Jul"] != undefined) {
            htmlString += this.wardCardList[i]["Jul"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Aug"] != undefined) {
            htmlString += this.wardCardList[i]["Aug"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Sep"] != undefined) {
            htmlString += this.wardCardList[i]["Sep"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Oct"] != undefined) {
            htmlString += this.wardCardList[i]["Oct"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Nov"] != undefined) {
            htmlString += this.wardCardList[i]["Nov"];
          }
          else {
            htmlString += 0;
          }
          htmlString += "</td>";
          htmlString += "<td>";
          if (this.wardCardList[i]["Dec"] != undefined) {
            htmlString += this.wardCardList[i]["Dec"];
          }
          else {
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
      let fileName = this.commonService.getFireStoreCity() + "-" + this.selectedZone + "-" + this.selectedYear + "-CollectedAmountReport.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
