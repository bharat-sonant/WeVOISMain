import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-monthly-payment-report',
  templateUrl: './monthly-payment-report.component.html',
  styleUrls: ['./monthly-payment-report.component.scss']
})
export class MonthlyPaymentReportComponent implements OnInit {

  yearList: any[];
  zoneList: any[];
  collectorList: any[];
  cityName: any;
  db: any;
  todayDate: any;
  selectedMonth: any;
  selectedYear: any;
  list: any[] = [];
  wardPaymentList: any[];
  collectorPaymentList: any[];
  filterList: any[];
  cardWardList: any[];
  lastUpdateDate: any;
  ddlType = "#ddlType";
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  divLoader = "#divLoader";
  divLoaderMain = "#divLoaderMain";
  public columnType: any;
  public totalAmount: any;


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
    this.totalAmount = "0.00";
    this.columnType = "Ward";
    this.lastUpdateDate = "---";
    this.getYear();
    this.selectedMonth = this.todayDate.split('-')[1];
    $(this.ddlMonth).val(this.todayDate.split('-')[1]);
    this.getZones();
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
    this.cardWardList = [];
    let dbPath = "CardWardMapping";
    let cardWardInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      cardWardInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let cardNo = keyArray[i];
          this.cardWardList.push({ cardNo: cardNo, ward: data[cardNo]["ward"] });
        }
      }
      this.setPaymentListJSON(0);
    });
  }

  getPaymentYearMonth() {
    this.wardPaymentList = [];
    this.collectorPaymentList = [];
    this.filterList = [];
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
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FMonthlyPayment%2F" + this.selectedYear + "%2F" + monthName + ".json?alt=media";
    let cardJSONInstance = this.httpService.get(path).subscribe(cardJsonData => {
      cardJSONInstance.unsubscribe();
      if (cardJsonData != null) {
        this.lastUpdateDate = cardJsonData["lastUpdateDate"];
        this.wardPaymentList = JSON.parse(JSON.stringify(cardJsonData["wards"]));
        this.collectorPaymentList = JSON.parse(JSON.stringify(cardJsonData["collectors"]));
        this.getTotalAmount();
        this.getFilter();
      }
    }, error => {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("error", "Sorry! No data found !!!");
    });
  }

  updatePaymentData() {
    $(this.divLoaderMain).show();
      this.list = [];
      this.wardPaymentList = [];
      this.collectorPaymentList = [];
      this.filterList = [];
      this.totalAmount = "0.00";
      this.getPaymentCollector();
  }

  getTotalAmount() {
    let amount = 0;
    for (let i = 0; i < this.collectorPaymentList.length; i++) {
      amount += Number(this.collectorPaymentList[i]["amount"]);
    }
    this.totalAmount = amount.toFixed(2);
  }

  setPaymentListJSON(index: any) {
    if (index == this.collectorList.length) {
      this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
      this.getTotalAmount();
      this.getFilter();
      if (this.wardPaymentList.length > 0) {
        let filePath = "/PaymentCollectionHistory/MonthlyPayment/" + this.selectedYear + "/";
        this.wardPaymentList=this.commonService.transformString(this.wardPaymentList,"name");
        const obj = { "wards": this.wardPaymentList, "collectors": this.collectorPaymentList, "lastUpdateDate": this.lastUpdateDate };
        let monthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
        let fileName = monthName + ".json";
        this.commonService.saveJsonFile(obj, fileName, filePath);
      }
      $(this.divLoaderMain).hide();
      this.commonService.setAlertMessage("success", "Payment detail updated successfully !!!");
    }
    else {
      let collectorId = this.collectorList[index]["collectorId"];
      let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + collectorId;
      let patmentInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        patmentInstance.unsubscribe();
        if (data != null) {
          let dateArray = Object.keys(data);
          if (dateArray.length > 0) {
            for (let i = 0; i < dateArray.length; i++) {
              let date = dateArray[i];
              if (this.selectedYear == date.split('-')[0] && this.selectedMonth == date.split('-')[1]) {
                let dateData = data[date];
                let keyArray = Object.keys(dateData);
                for (let j = 0; j < keyArray.length; j++) {
                  let key = keyArray[j];
                  if (dateData[key]["cardNo"] != null) {
                    let cardNo = dateData[key]["cardNo"];
                    let amount = dateData[key]["transactionAmount"];
                    let wardNo = "";
                    let cardDetail = this.cardWardList.find(item => item.cardNo == cardNo);
                    if (cardDetail != undefined) {
                      wardNo = cardDetail.ward;
                    }
                    let name = "";
                    let nameDetail = this.collectorList.find(item => item.collectorId == collectorId);
                    if (nameDetail != undefined) {
                      name = nameDetail.name;
                    }
                    this.list.push({ cardNo: cardNo, wardNo: wardNo, name: name, amount: amount });
                    let wardDetail = this.wardPaymentList.find(item => item.name == wardNo);
                    if (wardDetail == undefined) {
                      this.wardPaymentList.push({ name: wardNo, amount: Number(amount) });
                    }
                    else {
                      wardDetail.amount += Number(amount);
                    }
                    let collectorDetail = this.collectorPaymentList.find(item => item.collectorId == collectorId);
                    if (collectorDetail == undefined) {
                      this.collectorPaymentList.push({ collectorId: collectorId, name: name, amount: Number(amount) });
                    }
                    else {
                      collectorDetail.amount += Number(amount);
                    }
                  }
                }
              }
            }
          }
          index++;
          this.setPaymentListJSON(index);
        }
        else {
          index++;
          this.setPaymentListJSON(index);
        }
      });
    }
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
      this.getCardWardMapping();
    });
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["ZoneName"] = "--Select Zone--";
  }


  getFilter() {
    $(this.divLoader).show();
    let type = $(this.ddlType).val();
    if (type == "Ward No") {
      this.columnType = "Ward";
      this.filterList =this.commonService.transformNumeric(this.wardPaymentList,"name");
    }
    else {
      this.columnType = "Collector Name";
      this.filterList = this.commonService.transformNumeric(this.collectorPaymentList,"name");
    }
    $(this.divLoader).hide();
  }

  exportToExcel() {
    let list = this.filterList;
    if (list.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      let type = $(this.ddlType).val();
      if (type == "Ward No") {
        htmlString += "Ward";
      }
      else {
        htmlString += "Collector Name";
      }
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Amount";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < list.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["name"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += list[i]["amount"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let monthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
      let fileName = "Monthly-Payment-Report-" + this.selectedYear + "-" + monthName + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
