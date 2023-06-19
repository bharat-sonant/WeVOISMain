import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-entity-payment-report',
  templateUrl: './entity-payment-report.component.html',
  styleUrls: ['./entity-payment-report.component.scss']
})
export class EntityPaymentReportComponent implements OnInit {

  yearList: any[];
  zoneList: any[];
  collectorList: any[];
  entityTypeList: any[];
  cityName: any;
  db: any;
  todayDate: any;
  lastUpdateDate: any;
  selectedMonth: any;
  selectedYear: any;
  list: any[] = [];
  wardPaymentList: any[];
  entityPaymentList: any[];
  filterList: any[];
  cardWardList: any[];
  ddlEntity = "#ddlEntity";
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
    this.columnType = "Entity Type";
    this.lastUpdateDate = "---";
    this.getYear();
    this.selectedMonth = this.todayDate.split('-')[1];
    $(this.ddlMonth).val(this.todayDate.split('-')[1]);
    this.getZones();
    this.getEntityTypes();
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
          this.cardWardList.push({ cardNo: cardNo, ward: data[cardNo]["ward"], line: data[cardNo]["line"] });
        }
      }
      if (this.collectorList.length > 0) {
        this.setPaymentListJSON(0);
      }
      else {
        this.commonService.setAlertMessage("error", "Sorry! No data found  !!!");
        $(this.divLoader).hide();
      }
    });
  }

  updatePaymentData() {
    $(this.divLoaderMain).show();
    this.list = [];
    this.wardPaymentList = [];
    this.entityPaymentList = [];
    this.filterList = [];
    this.totalAmount = "0.00";
    this.getPaymentCollector();
  }

  getPaymentYearMonth() {
    this.wardPaymentList = [];
    this.entityPaymentList = [];
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
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FEntityWisePayment%2F" + this.selectedYear + "%2F" + monthName + ".json?alt=media";
    let cardJSONInstance = this.httpService.get(path).subscribe(cardJsonData => {
      cardJSONInstance.unsubscribe();
      if (cardJsonData != null) {
        this.lastUpdateDate = cardJsonData["lastUpdateDate"];
        this.wardPaymentList = JSON.parse(JSON.stringify(cardJsonData["wards"]));
        this.entityPaymentList = JSON.parse(JSON.stringify(cardJsonData["entities"]));
        this.getTotalAmount();
        this.getFilter();
      }
    }, error => {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("error", "Sorry! No data found !!!");
    });

  }

  getTotalAmount() {
    let amount = 0;
    for (let i = 0; i < this.entityPaymentList.length; i++) {
      amount += Number(this.entityPaymentList[i]["amount"]);
    }
    this.totalAmount = amount.toFixed(2);
  }

  setPaymentListJSON(index: any) {
    if (index == this.collectorList.length) {
      this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
      this.getTotalAmount();
      this.getFilter();
      if (this.wardPaymentList.length > 0) {
        let filePath = "/PaymentCollectionHistory/EntityWisePayment/" + this.selectedYear + "/";
        const obj = { "wards": this.wardPaymentList, "entities": this.entityPaymentList, "lastUpdateDate": this.lastUpdateDate };
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
                    let lineNo = "";
                    let cardDetail = this.cardWardList.find(item => item.cardNo == cardNo);
                    if (cardDetail != undefined) {
                      wardNo = cardDetail.ward;
                      lineNo = cardDetail.line;
                    }
                    this.getCardEntityType(wardNo, lineNo, cardNo, amount);
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

  getCardEntityType(wardNo: any, lineNo: any, cardNo: any, amount: any) {
    let dbPath = "Houses/" + wardNo + "/" + lineNo + "/" + cardNo + "/houseType";
    let houseTypeInstance = this.db.object(dbPath).valueChanges().subscribe(houseTypeData => {
      houseTypeInstance.unsubscribe();
      if (houseTypeData != null) {
        let entityTypeId = houseTypeData;
        let name = "";
        let nameDetail = this.entityTypeList.find(item => item.entityTypeId == Number(entityTypeId));
        if (nameDetail != undefined) {
          name = nameDetail.entityType;
        }
        this.list.push({ cardNo: cardNo, wardNo: wardNo, entityTypeId: entityTypeId, name: name, amount: amount });
        let wardDetail = this.wardPaymentList.find(item => item.name == wardNo && item.entityTypeId == entityTypeId);
        if (wardDetail == undefined) {
          this.wardPaymentList.push({ name: wardNo, entityTypeId: entityTypeId, amount: Number(amount) });
        }
        else {
          wardDetail.amount += Number(amount);
        }
        let entityDetail = this.entityPaymentList.find(item => item.entityTypeId == entityTypeId);
        if (entityDetail == undefined) {
          this.entityPaymentList.push({ entityTypeId: entityTypeId, name: name, amount: Number(amount) });
        }
        else {
          entityDetail.amount += Number(amount);
        }
      }
    });
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
    }, error => {
      this.commonService.setAlertMessage("error", "Sorry! No data found !!!");
      $(this.divLoaderMain).hide();
    });
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["ZoneName"] = "--Select Zone--";
  }


  getFilter() {
    $(this.divLoader).show();
    let entityId = $(this.ddlEntity).val();
    if (entityId == "0") {
      this.columnType = "Entity Type";
      this.filterList = this.commonService.transformNumeric(this.entityPaymentList, "name");
    }
    else {
      this.columnType = "Ward";
      let list = this.wardPaymentList.filter(item => item.entityTypeId == entityId);
      this.filterList = this.commonService.transformNumeric(list, "name");
    }
    $(this.divLoader).hide();
  }

  exportToExcel() {
    let list = this.filterList;
    if (list.length > 0) {
      let totalAmount = 0;
      let htmlString = "";
      let Heading = "";
      let entityId = $(this.ddlEntity).val();
      if (entityId == "0") {
        Heading = "Entity Type";
      }
      else {
        Heading += "Wrd";
      }
      htmlString = "<table>";
      if (entityId != "0") {
        let detail = this.entityTypeList.find(item => item.entityTypeId == entityId);
        if (detail != undefined) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += detail.entityType;
          htmlString += "</td>";
          htmlString += "</tr>";
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += "</td>";
          htmlString += "</tr>";
        }
      }
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += Heading;
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
        totalAmount += Number(list[i]["amount"]);
      }
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "</td>";
      htmlString += "</tr>";
      htmlString += "<tr>";
      htmlString += "<td>Total";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += totalAmount;
      htmlString += "</td>";
      htmlString += "</tr>";
      htmlString += "</table>";
      let monthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
      let fileName = "Entity-Payment-Report-" + this.selectedYear + "-" + monthName + ".xlsx";
      if (entityId != "0") {
        fileName = "Entity-Payment-Report-Wardwise-" + this.selectedYear + "-" + monthName + ".xlsx";
      }
      else {
        fileName = "Entity-Payment-Report-Entitywise-" + this.selectedYear + "-" + monthName + ".xlsx";
      }
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
