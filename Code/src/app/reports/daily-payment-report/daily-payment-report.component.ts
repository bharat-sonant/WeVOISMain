import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-daily-payment-report',
  templateUrl: './daily-payment-report.component.html',
  styleUrls: ['./daily-payment-report.component.scss']
})
export class DailyPaymentReportComponent implements OnInit {
  zoneList: any[];
  collectorList: any[];
  cityName: any;
  db: any;
  todayDate: any;
  selectedDate: any;
  list: any[] = [];
  wardPaymentList: any[];
  collectorPaymentList: any[];
  filterList: any[];
  cardWardList: any[];
  ddlType = "#ddlType";
  txtDate = "#txtDate";
  divLoader = "#divLoader";
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
    $(this.txtDate).val(this.todayDate);
    this.selectedDate = this.todayDate;
    this.totalAmount = "0.00";
    this.columnType = "Ward";
    this.getZones();
    this.getPaymentCollector();
    this.getCardWardMapping();
  }

  getCardWardMapping() {
    this.cardWardList = [];
    $(this.divLoader).show();
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
      this.getPayment();
    })
  }

  getPayment() {
    this.wardPaymentList = [];
    this.collectorPaymentList = [];
    this.filterList = [];
    this.totalAmount = "0.00";
    if (this.collectorList.length > 0) {
      this.list = [];
      this.setcollectorWiseList(0);
    }
    else {
      this.commonService.setAlertMessage("error", "No data found  !!!");
      $(this.divLoader).hide();
    }
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      this.selectedDate = this.commonService.getNextDate($(this.txtDate).val(), 1);
    } else if (type == "previous") {
      this.selectedDate = this.commonService.getPreviousDate($(this.txtDate).val(), 1);
    }
    $(this.txtDate).val(this.selectedDate);
    $(this.divLoader).show();
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FDailyPayment%2F" + this.selectedDate + ".json?alt=media";
    let cardJSONInstance = this.httpService.get(path).subscribe(cardJsonData => {
      cardJSONInstance.unsubscribe();
      if (cardJsonData != null) {
        this.wardPaymentList = JSON.parse(JSON.stringify(cardJsonData["wards"]));
        this.collectorPaymentList = JSON.parse(JSON.stringify(cardJsonData["collectors"]));
        this.getTotalAmount();
        this.getFilter();
      }
    }, error => {
      this.getPayment();
    });
  }

  getTotalAmount() {
    let amount = 0;
    for (let i = 0; i < this.collectorPaymentList.length; i++) {
      amount += Number(this.collectorPaymentList[i]["amount"]);
    }
    this.totalAmount = amount.toFixed(2);
  }

  setcollectorWiseList(index: any) {
    if (index == this.collectorList.length) {
      this.getEntityCollection(0);
    }
    else {
      let collectorId = this.collectorList[index]["collectorId"];
      let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + collectorId + "/" + this.selectedDate;
      let patmentInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        patmentInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let key = keyArray[i];
              if (data[key]["cardNo"] != null) {
                let cardNo = data[key]["cardNo"];
                let amount = data[key]["transactionAmount"];
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
          index++;
          this.setcollectorWiseList(index);
        }
        else {
          index++;
          this.setcollectorWiseList(index);
        }
      });
    }
  }

  getEntityCollection(index: any) {
    if (index == this.collectorList.length) {
      this.getTotalAmount();
      this.getFilter();
      if (this.wardPaymentList.length > 0) {
        if (this.selectedDate != this.todayDate) {
          let filePath = "/PaymentCollectionHistory/DailyPayment/";
          const obj = { "wards": this.wardPaymentList, "collectors": this.collectorPaymentList };
          let fileName = this.selectedDate + ".json";
          this.commonService.saveJsonFile(obj, fileName, filePath);
          this.commonService.setAlertMessage("success", "Payment detail updated successfully !!!");
          $(this.divLoader).hide();
        }
      }
      else {
        this.commonService.setAlertMessage("error", "No data found  !!!");
        $(this.divLoader).hide();
      }
    }
    else {
      let collectorId = this.collectorList[index]["collectorId"];
      let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + collectorId + "/Entities";
      let patmentInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        patmentInstance.unsubscribe();
        if (data != null) {
          let entityKeyArray = Object.keys(data);
          for (let m = 0; m < entityKeyArray.length; m++) {
            let entytyKey = entityKeyArray[m];
            let entityData = data[entytyKey];
            let dateArray = Object.keys(entityData);
            for (let n = 0; n < dateArray.length; n++) {
              let date = dateArray[n];
              if (date == this.selectedDate) {
                let dateData = entityData[date];
                let keyArray = Object.keys(dateData);
                if (keyArray.length > 0) {
                  for (let i = 0; i < keyArray.length; i++) {
                    let key = keyArray[i];
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
          }
          index++;
          this.getEntityCollection(index);
        }
        else {
          index++;
          this.getEntityCollection(index);
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
      this.filterList = this.commonService.transformNumeric(this.wardPaymentList, "name");
    }
    else {
      this.columnType = "Collector Name"
      this.filterList = this.commonService.transformNumeric(this.collectorPaymentList, "name");
    }
    $(this.divLoader).hide();
  }

  exportToExcel() {
    let list = this.filterList;
    let fileName = "Daily-Payment-Report-" + this.todayDate + ".xlsx";
    let type = $(this.ddlType).val();
    if (type == "Ward No") {
      fileName = "Daily-Payment-Report-Wardwise-" + this.todayDate + ".xlsx";
    }
    else {
      fileName = "Daily-Payment-Report-Collectorwise-" + this.todayDate + ".xlsx";
    }
    if (list.length > 0) {
      let totalAmount = 0;
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

      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
