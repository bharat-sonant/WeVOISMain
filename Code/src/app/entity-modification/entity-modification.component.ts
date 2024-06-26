import { Component, OnInit } from '@angular/core';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-entity-modification',
  templateUrl: './entity-modification.component.html',
  styleUrls: ['./entity-modification.component.scss']
})
export class EntityModificationComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
  cityName: any;
  db: any;
  todayDate: any;
  public selectedZone: any;
  zoneList: any[];
  serviceName = "entity-modification";
  entityTypeList: any[] = [];
  entityModificationList: any[];
  entityModificationFilterList: any[];
  paymentYearMonthList: any[] = [];
  currentYear: any;
  currentMonth: any;
  chargeStartMonth: any;
  chargeStartYear: any;
  ddlZone = "#ddlZone";
  ddlCurrentEntityType = "#ddlCurrentEntityType";
  ddlRequestedEntityType = "#ddlRequestedEntityType";
  divLoader = "#divLoader";
  divServingCount = "#divServingCount";
  txtServingCount = "#txtServingCount";

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
    this.getEnityTypeList();
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["ZoneName"] = "--Select Zone--";
  }

  getEnityTypeList() {
    $(this.divLoader).show();
    this.entityTypeList = [];
    this.paymentYearMonthList = [];
    let cardWardMappingInstance = this.db.object("Settings/PaymentCollectionSettings/").valueChanges().subscribe(data => {
      cardWardMappingInstance.unsubscribe();
      if (data != null) {
        let userChargesApplicableFrom = data["userChargesApplicableFrom"];
        this.chargeStartMonth = Number(this.commonService.getMonthShortNameToMonth(userChargesApplicableFrom.split('-')[0]));
        this.chargeStartYear = Number(userChargesApplicableFrom.split('-')[1]);
        let entityData = data["EntityType"];
        let keyArray = Object.keys(entityData);
        for (let i = 0; i < keyArray.length; i++) {
          let id = keyArray[i];
          this.entityTypeList.push({ entityTypeId: id, name: entityData[id]["name"], amount: entityData[id]["amount"] });
        }
        this.currentYear = this.todayDate.split('-')[0];
        this.currentMonth = Number(this.todayDate.split('-')[1]);
        this.paymentYearMonthList.push({ year: this.chargeStartYear, month: this.chargeStartMonth, monthName: userChargesApplicableFrom.split('-')[0] });
        this.getNextMonth(this.chargeStartYear, this.chargeStartMonth);
        this.getRequestedEntities();
      }
    });
  }


  getNextMonth(year: any, month: any) {
    if (year != this.currentYear || month != this.currentMonth - 1) {
      if (month < 12) {
        month = month + 1;
        let monthName = this.commonService.getCurrentMonthShortName(month);
        this.paymentYearMonthList.push({ year: year, month: month, monthName: monthName });
      }
      else {
        year = year + 1;
        month = 1;
        let monthName = this.commonService.getCurrentMonthShortName(month);
        this.paymentYearMonthList.push({ year: year, month: month, monthName: monthName });
      }
      this.getNextMonth(year, month);
    }
  }

  getRequestedEntities() {
    this.entityModificationList = [];
    this.entityModificationFilterList = [];
    let requestedInstance = this.db.object("PaymentCollectionInfo/EntityModificationRequest").valueChanges().subscribe(data => {
      requestedInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let cardNo = keyArray[i];
          if (data[cardNo]["status"] == "Pending") {
            let preEntityId = data[cardNo]["preEntity"];
            let reqEntityId = data[cardNo]["reqEntity"];
            let preEntityType = "";
            let reqEntityType = "";
            let reqDate = data[cardNo]["dateTime"] ? (data[cardNo]["dateTime"].split(" ")[0]).split("-")[2] + " " + this.commonService.getCurrentMonthName(Number((data[cardNo]["dateTime"].split(" ")[0]).split("-")[1]) - 1) + " " + (data[cardNo]["dateTime"].split(" ")[0]).split("-")[0] + " " + data[cardNo]["dateTime"].split(" ")[1] : "";
            let detail = this.entityTypeList.find(item => item.entityTypeId == preEntityId);
            if (detail != undefined) {
              preEntityType = detail.name;
            }
            detail = this.entityTypeList.find(item => item.entityTypeId == reqEntityId);
            if (detail != undefined) {
              reqEntityType = detail.name;
            }
            this.entityModificationList.push({ cardNo: cardNo, zone: data[cardNo]["ward"], preEntityId: preEntityId, preEntityType: preEntityType, reqEntityId: reqEntityId, reqEntityType: reqEntityType, reqDate: reqDate });
          }
        }
      }
      this.entityModificationFilterList = this.entityModificationList;
      $(this.divLoader).hide();

    });
  }

  getFilter() {
    if ($(this.ddlZone).val() == "0") {
      this.entityModificationFilterList = this.entityModificationList;
    }
    else {
      this.entityModificationFilterList = this.entityModificationList.filter(item => item.zone == $(this.ddlZone).val());
    }
  }

  openModel(content: any, cardNo: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 380;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    setTimeout(() => {
      $("#hddCardNo").val(cardNo);
      let detail = this.entityModificationFilterList.find(item => item.cardNo == cardNo);
      if (detail != undefined) {
        $(this.ddlCurrentEntityType).val(detail.preEntityId);
        $(this.ddlRequestedEntityType).val(detail.reqEntityId);
        if (detail.reqEntityId == "19" || detail.reqEntityId == "20") {
          $(this.divServingCount).show();
        }
        else {
          $(this.divServingCount).hide();
        }
      }
    }, 200);
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  updateEntityType() {
    if ((<HTMLInputElement>document.getElementById('chkConfirm')).checked == false) {
      this.commonService.setAlertMessage("error", "Confirmation required !!!");
      return;
    }
    $(this.divLoader).show();
    let cardNo = $("#hddCardNo").val();
    let cardWardMapingInstance = this.db.object("CardWardMapping/" + cardNo).valueChanges().subscribe(data => {
      cardWardMapingInstance.unsubscribe();
      if (data != null) {
        let lineNo = data["line"];
        let ward = data["ward"];
        let dbPath = "Houses/" + ward + "/" + lineNo + "/" + cardNo;
        let houseInstance = this.db.object(dbPath).valueChanges().subscribe(houseData => {
          houseInstance.unsubscribe();
          if (houseData != null) {
            let servingCount = "0";
            let houseType = $(this.ddlRequestedEntityType).val();
            if (houseType == "19" || houseType == "20") {
              servingCount = $(this.txtServingCount).val().toString();
            }
            this.db.object(dbPath).update({ houseType: houseType, servingCount: servingCount });
            let amount = 0;
            let detail = this.entityTypeList.find(item => item.entityTypeId == houseType);
            if (detail != undefined) {
              amount = Number(detail.amount);
            }
            this.updateEntityHistory(cardNo, servingCount);
            this.updatePayment(cardNo, amount, 0, this.paymentYearMonthList.length);
          }
        })
      }
    });
  }

  updateEntityHistory(cardNo: any, servingCount: any) {
    let detail = this.entityModificationFilterList.find(item => item.cardNo == cardNo);
    if (detail != undefined) {
      let dbPath = "PaymentCollectionInfo/EntityUpdateHistory/" + cardNo;
      let historyInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        historyInstance.unsubscribe();
        let key = 1;
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            if (keyArray[keyArray.length - 1]=="Entities") {
              key = Number(keyArray[keyArray.length - 2]) + 1;
            }
            else {
              key = Number(keyArray[keyArray.length - 1]) + 1;
            }
          }
          let obj = {
            entityType: detail.reqEntityId,
            entityUpdateById: localStorage.getItem("userID"),
            entityUpdateByName: localStorage.getItem("userName"),
            preEntityType: detail.preEntityId,
            servingCount: servingCount,
            updateDateTime: this.todayDate + " " + this.commonService.getCurrentTime()
          }
          this.db.object(dbPath + "/" + key).update(obj);
        }
      });
    }
  }

  updatePayment(cardNo: any, amount: any, index: any, length: any) {
    if (index == length) {
      this.deleteRequest(cardNo);
      this.closeModel();
      this.commonService.setAlertMessage("success", "Entity modification done successfully");
      $(this.divLoader).hide();
    }
    else {
      let dbPath = "PaymentCollectionInfo/PaymentCollectionHistory/" + cardNo + "/" + this.paymentYearMonthList[index]["year"] + "/" + this.paymentYearMonthList[index]["monthName"];
      let paymentInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        paymentInstance.unsubscribe();
        if (data != null) {
          if (data["status"] == "Pending") {
            this.db.object(dbPath).update({ amount: amount });
          }
        }
        index++;
        this.updatePayment(cardNo, amount, index, length);
      });
    }
  }

  deleteRequest(cardNo: any) {
    this.db.object("PaymentCollectionInfo/EntityModificationRequest/" + cardNo).remove();
    this.entityModificationList=this.entityModificationList.filter(item=>item.cardNo!=cardNo);
    this.getFilter();
  }
}

