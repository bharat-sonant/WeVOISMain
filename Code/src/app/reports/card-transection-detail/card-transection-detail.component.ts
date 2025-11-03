import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { AngularFireStorage } from "angularfire2/storage";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";


@Component({
  selector: 'app-card-transection-detail',
  templateUrl: './card-transection-detail.component.html',
  styleUrls: ['./card-transection-detail.component.scss']
})
export class CardTransectionDetailComponent implements OnInit {

  constructor(private commonService: CommonService, private modalService: NgbModal, private storage: AngularFireStorage, private besuh: BackEndServiceUsesHistoryService, public httpService: HttpClient, public fs: FirebaseService) { }
  cityName: any;
  db: any;
  transactionList: any[];
  txtCardNo = "#txtCardNo";
  public totalAmount: any;
  divLoader = "#divLoader";
  divEntity = "#divEntity";
  cardPrefix: any;
  houseTypeList: any[] = [];
  public ward: any;
  public name: any;
  public entityType: any;
  serviceName = "collection-management-card-payment-report";
  imageNotAvailablePath = "../assets/img/image-not-found.jpg";
  cardEntityList: any[] = [];
  imgMarkerURL = "../assets/img/image-not-found.jpg";
  imgHouseURL = "../assets/img/image-not-found.jpg";
  selectedFilter:string="";
  filteredTransactionList:any[]=[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.totalAmount = "0.00";
    this.cardPrefix = this.commonService.getDefaultCardPrefix();
    this.ward = "---";
    this.name = "---";
    this.entityType = "---";
    let element = <HTMLImageElement>document.getElementById("imgMarker");
    element.src = this.imageNotAvailablePath;
    element = <HTMLImageElement>document.getElementById("imgHouse");
    element.src = this.imageNotAvailablePath;

    $(this.divEntity).hide();
    this.getHouseType();
  }

  getHouseType() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDefaults%2FFinalHousesType.json?alt=media";
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getCardDetail");
    this.ward = "---";
    this.name = "---";
    this.entityType = "---";
    let element = <HTMLImageElement>document.getElementById("imgMarker");
    element.src = this.imageNotAvailablePath;
    element = <HTMLImageElement>document.getElementById("imgHouse");
    element.src = this.imageNotAvailablePath;
    this.cardEntityList = [];
    $(this.divEntity).hide();
    let cardNo = this.cardPrefix + $(this.txtCardNo).val();
    let dbPath = "CardWardMapping/" + cardNo;
    let cardWardInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      cardWardInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getCardDetail", data);
        this.ward = data["ward"];
        let lineNo = data["line"];
        dbPath = "Houses/" + this.ward + "/" + lineNo + "/" + cardNo;
        let cardInstance = this.db.object(dbPath).valueChanges().subscribe(cardData => {
          cardInstance.unsubscribe();
          if (cardData != null) {
            this.name = cardData["name"];
            let houseType = cardData["houseType"];
            let detail = this.houseTypeList.find(item => item.id == houseType);
            if (detail != undefined) {
              this.entityType = detail.houseType;
            }
            let city = this.commonService.getFireStoreCity();
            if (this.cityName == "sikar") {
              city = "Sikar-Survey";
            }
            if (this.cityName == "sikar") {
              this.getSikarHouseImages(cardData["houseImage"]);
            }
            else {
              let mainHouseImage = cardData["houseImage"];
              this.imgHouseURL = this.commonService.fireStoragePath + city + "%2FSurveyHouseImage%2F" + mainHouseImage + "?alt=media";
              let element = <HTMLImageElement>document.getElementById("imgHouse");
              element.src = this.imgHouseURL;
            }

            this.getMarkerImage(lineNo, cardNo);

            if (Number(houseType) == 19 || Number(houseType) == 20) {
              if (cardData["Entities"] != undefined) {
                $(this.divEntity).show();
                let keyArray = Object.keys(cardData["Entities"]);
                for (let i = 0; i < keyArray.length; i++) {
                  let key = keyArray[i];
                  let name = cardData["Entities"][key]["name"]?cardData["Entities"][key]["name"].toUpperCase():"";
                  let houseImage = cardData["Entities"][key]["houseImage"];
                  let houseImageURL = this.imageNotAvailablePath;
                  let entity = "";
                  let entityDetail = this.houseTypeList.find(item => item.id == cardData["Entities"][key]["entityType"]);
                  if (entityDetail != undefined) {
                    entity = entityDetail.houseType;
                  }


                  let imagePath = city + "/SurveyHouseImage/" + cardNo + "/Entities/" + houseImage;
                  this.commonService.checkImageExist(imagePath).then(resp => {
                    if (resp == true) {
                      houseImageURL = this.commonService.fireStoragePath + city + "%2FSurveyHouseImage%2F" + cardNo + "%2FEntities%2F" + houseImage + "?alt=media";
                    }
                    else {
                      houseImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyHouseImage%2F" + cardNo + "%2FEntities%2F" + houseImage + "?alt=media";
                    }

                    this.cardEntityList.push({key, name: name, entity: entity, houseImageURL: houseImageURL });
                    this.cardEntityList=this.cardEntityList.sort((a, b) =>
                        b.name< a.name ? 1 : -1
                      );
                  })
                }
              }
            }
          }
        })
      }
    });
  }

  getSikarHouseImages(houseImage: any) {
    let urlSikarSurvey = "Sikar-Survey/SurveyHouseImage/" + houseImage;
    const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(urlSikarSurvey);
    ref.getDownloadURL()
      .then((url) => {
        this.imgHouseURL = this.commonService.fireStoragePath + "Sikar-Survey%2FSurveyHouseImage%2F" + houseImage + "?alt=media";
        let element = <HTMLImageElement>document.getElementById("imgHouse");
        element.src = this.imgHouseURL;
      })
      .catch((error) => {
        this.imgHouseURL = this.commonService.fireStoragePath + "Sikar%2FSurveyHouseImage%2F" + houseImage + "?alt=media";
        let element = <HTMLImageElement>document.getElementById("imgHouse");
        element.src = this.imgHouseURL;
      });
  }

  getMarkerImage(lineNo: any, cardNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.ward + "/" + lineNo + "/";
    let markedHouseInstance = this.db.object(dbPath).valueChanges().subscribe(
      markedHouseData => {
        markedHouseInstance.unsubscribe();
        if (markedHouseData != null) {
          let keyArray = Object.keys(markedHouseData);
          for (let j = 0; j < keyArray.length; j++) {
            let markerNo = parseInt(keyArray[j]);
            if (!isNaN(markerNo)) {
              if (markedHouseData[markerNo]["cardNumber"] != null) {
                if (markedHouseData[markerNo]["cardNumber"] == cardNo) {
                  let image = markedHouseData[markerNo]["image"];
                  let city = this.commonService.getFireStoreCity();
                  if (this.cityName == "sikar") {
                    city = "Sikar-Survey";
                  }
                  this.imgMarkerURL = this.commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + this.ward + "%2F" + lineNo + "%2F" + image + "?alt=media";
                  let element = <HTMLImageElement>document.getElementById("imgMarker");
                  element.src = this.imgMarkerURL;
                }
              }
            }
          }
        }
      }
    );
  }

  getTransaction() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getTransaction");
    this.totalAmount = "0.00";
    this.transactionList = [];
    this.filteredTransactionList = [];
    this.selectedFilter='';
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
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getTransaction", data);
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
                    let referId = "";
                    let payMethod = "";
                    if (dateData[key]["retrievalReferenceNo"] != null) {
                      referId = dateData[key]["retrievalReferenceNo"];
                    }
                    else if (dateData[key]["RRN"] != null) {
                      referId = dateData[key]["RRN"];
                    }
                    if (dateData[key]["payMethod"] != null) {
                      payMethod = dateData[key]["payMethod"];
                    }
                    else if (dateData[key]["PaymentMode"] != null) {
                      payMethod = dateData[key]["PaymentMode"];
                    }
                    else if (dateData[key]["TranType"] != null) {
                      payMethod = dateData[key]["TranType"];
                    }
                    amount = amount + Number(dateData[key]["transactionAmount"]);
                    let houseImage = "";
                    let houseImageURL = this.imageNotAvailablePath;
                    if (dateData[key]["houseImage"]) {
                      houseImage = dateData[key]["houseImage"];
                      houseImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentHouseImage%2F" + cardNo + "%2F" + date + "%2F" + houseImage + "?alt=media";
                    }
                    let timestemp = new Date(date).getTime();
                    this.transactionList.push({ timestemp: timestemp, key: key, transDate: "", year: year, month: month, date, transId: dateData[key]["merchantTransactionId"], referId: referId, payMethod: payMethod, collectedBy: dateData[key]["paymentCollectionByName"], amount: Number(dateData[key]["transactionAmount"]).toFixed(2), monthYear: dateData[key]["monthYear"], houseImageURL: houseImageURL ,type:"card"});
                    this.transactionList = this.transactionList.sort((a, b) =>
                      b.timestemp < a.timestemp ? 1 : -1
                    );
                    this.filteredTransactionList = this.transactionList
                    this.getDateTimeFormat(key, dateData[key]["transactionDateTime"], date, year, month);
                  }
                }
              }
            }
          }
          if (data["Entities"] != null) {
            let entityData = data["Entities"];
            this.getEntityPayment(entityData, amount);
          }
          else {
            this.totalAmount = amount.toFixed(2);
          }
          $(this.divLoader).hide();
        }
        else {
          this.commonService.setAlertMessage("error", "No transaction found for card number " + cardNo);
          $(this.divLoader).hide();
        }
      }
    );
  }

  getEntityPayment(entityData: any, amount: any) {

    let entityKeyArray = Object.keys(entityData);
    let cardNo = this.cardPrefix + $(this.txtCardNo).val();
    for (let i = 0; i < entityKeyArray.length; i++) {
      let entityKey = entityKeyArray[i];
      let data = entityData[entityKey];
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
                let referId = "";
                let payMethod = "";
                if (dateData[key]["retrievalReferenceNo"] != null) {
                  referId = dateData[key]["retrievalReferenceNo"];
                }
                else if (dateData[key]["RRN"] != null) {
                  referId = dateData[key]["RRN"];
                }
                if (dateData[key]["payMethod"] != null) {
                  payMethod = dateData[key]["payMethod"];
                }
                else if (dateData[key]["PaymentMode"] != null) {
                  payMethod = dateData[key]["PaymentMode"];
                }
                else if (dateData[key]["TranType"] != null) {
                  payMethod = dateData[key]["TranType"];
                }
                amount = amount + Number(dateData[key]["transactionAmount"]);
                let houseImage = "";
                let houseImageURL = this.imageNotAvailablePath;
                if (dateData[key]["houseImage"]) {
                  houseImage = dateData[key]["houseImage"];
                  houseImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FPaymentCollectionHistory%2FPaymentHouseImage%2F" + cardNo + "%2FEntities%2F" + entityKey + "%2F" + date + "%2F" + houseImage + "?alt=media";
                }

                let timestemp = new Date(date).getTime();
                this.transactionList.push({ timestemp: timestemp, key: key, transDate: "", year: year, month: month, date, transId: dateData[key]["merchantTransactionId"], referId: referId, payMethod: payMethod, collectedBy: dateData[key]["paymentCollectionByName"], amount: Number(dateData[key]["transactionAmount"]).toFixed(2), monthYear: dateData[key]["monthYear"], houseImageURL: houseImageURL,entityKey,type:"entity" });
                this.transactionList = this.transactionList.sort((a, b) =>
                  b.timestemp < a.timestemp ? 1 : -1
                );
                this.filteredTransactionList = this.transactionList
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
    if (this.filteredTransactionList.length > 0) {
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
      for (let i = 0; i < this.filteredTransactionList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.filteredTransactionList[i]["date"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.filteredTransactionList[i]["transId"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.filteredTransactionList[i]["referId"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.filteredTransactionList[i]["payMethod"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.filteredTransactionList[i]["monthYear"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.filteredTransactionList[i]["collectedBy"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.filteredTransactionList[i]["amount"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Card No " + $(this.txtCardNo).val() + "-Transaction-Detail.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
    else{
      this.commonService.setAlertMessage("error","No data to export.");
    }
  }
  openHouseModel(content: any, url: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 520;
    let width = 348;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (type == "list") {
      let element = <HTMLImageElement>document.getElementById("houseImage");
      element.src = url;
    }
    else if (type == "marker") {
      let element = <HTMLImageElement>document.getElementById("houseImage");
      element.src = this.imgMarkerURL;
    } else {
      let element = <HTMLImageElement>document.getElementById("houseImage");
      element.src = this.imgHouseURL;
    }
  }


  closeModel() {
    this.modalService.dismissAll();
  }

  onChangeFilter(event:any){
    // this.selectedFilter=event.target.value;
    if(!event){
      this.filteredTransactionList = this.transactionList;
    }
    else if(event=="cardTransactions"){
      this.filteredTransactionList = this.transactionList.filter(item=>item.type=="card");
    }
    else{
      this.filteredTransactionList = this.transactionList.filter(item=>item.entityKey==event);
    }
  }
}
