import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-card-updated-history',
  templateUrl: './card-updated-history.component.html',
  styleUrls: ['./card-updated-history.component.scss']
})
export class CardUpdatedHistoryComponent implements OnInit {
  cityName: any;
  db: any;
  divLoader = "#divLoader";
  lastUpdateDate: any;
  cardUpdateList: any[];
  cardUpdateFilterList: any[];
  entityTypeList: any[];
  updateCardDetailList: any[];
  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.lastUpdateDate = "---";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getEntityTypes();
    this.getCardUpdateHistory();
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

  getCardUpdateHistory() {
    this.cardUpdateList = [];
    this.cardUpdateFilterList = [];
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FCardUpdateHistory.json?alt=media";
    let cardJSONInstance = this.httpService.get(path).subscribe(cardJsonData => {
      cardJSONInstance.unsubscribe();
      if (cardJsonData != null) {
        this.lastUpdateDate = cardJsonData["lastUpdateDate"];
        this.cardUpdateList = JSON.parse(JSON.stringify(cardJsonData["cards"]));
        this.cardUpdateFilterList = this.cardUpdateList;
      }
    });
  }

  showCardUpdateDetail(cardNo: any, index: any) {
    this.setActiveClass(index);
    this.updateCardDetailList = [];
    let detail = this.cardUpdateList.find(item => item.cardNo == cardNo);
    if (detail != undefined) {
      this.updateCardDetailList = detail.list;
    }
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.cardUpdateFilterList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        if (className != "in-active") {
          $("#tr" + i).removeClass(className);
        }
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }

  updateCardHistoryJSON() {
    let cardUpdateListJSON = [];
    $(this.divLoader).show();
    let dbPath = "PaymentCollectionInfo/EntityUpdateHistory";
    let dbInatance = this.db.object(dbPath).valueChanges().subscribe(data => {
      dbInatance.unsubscribe();
      if (data != null) {
        let cardArray = Object.keys(data);
        for (let i = 0; i < cardArray.length; i++) {
          let cardNo = cardArray[i];
          let cardData = data[cardNo];
          let keyArray = Object.keys(cardData);
          let list = [];
          for (let j = 0; j < keyArray.length; j++) {
            let key = keyArray[j];
            let preEntityTypeId = cardData[key]["preEntityType"];
            let entityTypeId = cardData[key]["entityType"];
            let preEntityType = "";
            let entityType = "";
            let detail = this.entityTypeList.find(item => item.entityTypeId == preEntityTypeId);
            if (detail != undefined) {
              preEntityType = detail.entityType;
            }
            detail = this.entityTypeList.find(item => item.entityTypeId == entityTypeId);
            if (detail != undefined) {
              entityType = detail.entityType;
            }
            let date = cardData[key]["updateDateTime"];
            let time = date.split(" ")[1];
            let newDate = date.split(" ")[0];
            let month = newDate.split("-")[1];
            let year = newDate.split("-")[0];
            let day = newDate.split("-")[2];
            let monthName = this.commonService.getCurrentMonthShortName(Number(month));
             date = day + " " + monthName + " " + year + " | " + time.split(":")[0] + ":" + time.split(":")[1];
            //date = day + " " + monthName + " " + year;
            list.push({ date: date, preEntityType: preEntityType, entityType: entityType, name: cardData[key]["name"], address: cardData[key]["address"], mobile: cardData[key]["mobile"], entityUpdateByName: cardData[key]["entityUpdateByName"] });
          }
          cardUpdateListJSON.push({ cardNo: cardNo, counts: keyArray.length, list: list });
        }
        this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
        this.cardUpdateList = cardUpdateListJSON;
        this.cardUpdateFilterList = this.cardUpdateList;
        let filePath = "/PaymentCollectionHistory/";
        const obj = { "cards": cardUpdateListJSON, "lastUpdateDate": this.lastUpdateDate };
        let fileName = "CardUpdateHistory.json";
        this.commonService.saveJsonFile(obj, fileName, filePath);
        this.commonService.setAlertMessage("success", "Data updated successfully !!!");
        $(this.divLoader).hide();
      }
      else {
        this.commonService.setAlertMessage("error","No data found !!!");
        $(this.divLoader).hide();
      }
    });
  }


  exportToExcel() {
    if (this.cardUpdateList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Card Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Update Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Mobile";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Address";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Pre Entity Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Entity Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Updated By";
      htmlString += "</td>";
      htmlString += "</tr>";
      if (this.cardUpdateList.length > 0) {
        for (let i = 0; i < this.cardUpdateList.length; i++) {
          let cardNo = this.cardUpdateList[i]["cardNo"];
          let list = this.cardUpdateList[i]["list"];
          for (let j = 0; j < list.length; j++) {
            htmlString += "<tr>";
            htmlString += "<td>";
            htmlString += cardNo;
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += list[j]["date"];
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += list[j]["name"];
            htmlString += "</td>";
            htmlString += "<td t='s'>";
            htmlString += list[j]["mobile"];
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += list[j]["address"];
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += list[j]["preEntityType"];
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += list[j]["entityType"];
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += list[j]["entityUpdateByName"];
            htmlString += "</td>";
            htmlString += "</tr>";
          }
        }
      }
      htmlString += "</table>";
      let fileName = this.commonService.getFireStoreCity() + "-CardUpdateReport.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

}
