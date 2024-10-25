/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CardTransectionDetailComponent } from "../card-transection-detail/card-transection-detail.component";

@Component({
  selector: 'app-payment-collector-tracking',
  templateUrl: './payment-collector-tracking.component.html',
  styleUrls: ['./payment-collector-tracking.component.scss']
})
export class PaymentCollectorTrackingComponent {

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private mapService: MapService, private modalService: NgbModal, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedDate: any;
  selectedYear: any;
  selectMonthName: any;

  paymentCollectorList: any[];
  cardList: any[] = [];
  polylines = [];
  routePathStore: any[] = [];
  paymentCollectorId: any;
  public bounds: any;
  vehicleMarker: any;
  timeInterval: any;
  public startTime: any;
  endTime: any;
  isPreviousTime: any;
  isLast = false;
  public routeTime: any;
  paymentCollectorDetail: paymentCollectorDetail =
    {
      totalKM: "0",
      totalHr: "---",
      startTime: "---",
      endTime: "---",
      cardCount: "0"
    }
  startPointUrl = "../../assets/img/start-point.svg";
  endPointUrl = "../../assets/img/end-point.svg";
  divLoader = "#divLoader";
  trackDetail = "#trackDetail";
  timeBox = "#timeBox";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    $(this.trackDetail).hide();
    $(this.timeBox).hide();
    $('#btnReset').hide();
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.paymentCollectorList = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    this.selectedDate = "2024-10-23";
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    $('#txtDate').val(this.selectedDate);
    this.paymentCollectorId = 0;
    this.routeTime = "00:00";
    this.timeInterval = 0;
    this.setHeight();
    this.setMaps();
    this.getPaymentCollector();
  }

  // Play Button Functionality Start

  isStart = false;
  isReset = false;
  speed: any;
  skip: any;

  getPlayStop() {
    if (this.paymentCollectorId == 0) {
      this.commonService.setAlertMessage("error", "Please select payment collector.");
      return;
    }
    if (this.isStart == false) {
      let options = {
        // max zoom
        zoom: 16,
      };
      this.map.setOptions(options);
      this.isStart = true;
      $('#playStop').removeClass("fab fa-youtube");
      $('#playStop').addClass("fas fa-stop-circle");

      $('#btnPre').hide();
      $('#btnReset').show();

      this.setSpeed(Number($('#ddlSpeed').val()));
      $('#ddlTime').val("0");
      this.timeInterval = 0;
      if (this.timeInterval == 0) {
        let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == this.paymentCollectorId);
        if (detail != undefined) {
          this.endTime = detail.routePath.length - 1;
        }
      }
      else {
        this.endTime = this.endTime;
      }
      this.routeTime = "00:00";
      if (this.vehicleMarker != null) {
        this.vehicleMarker.setMap(null);
      }
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          this.polylines[i].setMap(null);
        }
      }
      this.getPaymentCollectorRoutePlay();
    }
    else {
      $('#playStop').removeClass("fas fa-stop-circle");
      $('#playStop').addClass("fab fa-youtube");
      $('#btnPre').show();
      $('#btnReset').hide();
      this.isStart = false;
    }
  }


  setSpeed(speed: any) {
    if (speed == 1) {
      this.speed = 20;
      this.skip = 1;
    }
    else if (speed == 2) {
      this.speed = 15;
      this.skip = 1;
    }
    else if (speed == 3) {
      this.speed = 10;
      this.skip = 2;
    }
    else if (speed == 4) {
      this.speed = 20;
      this.skip = 5;
    }
    else if (speed == 5) {
      this.speed = 15;
      this.skip = 4;
    }
    else if (speed == 10) {
      this.speed = 15;
      this.skip = 10;
    }
  }

  lineIndex: any = 0;
  routeMarker: any[] = [];
  lineDataList: any[] = [];
  timerHandle: any[] = [];


  getPaymentCollectorRoutePlay() {
    let lineData = [];
    this.lineDataList = [];
    this.routeTime = "00:00";
    if (this.vehicleMarker != null) {
      this.vehicleMarker.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == this.paymentCollectorId);
    if (detail != undefined) {
      if (this.endTime >= (detail.routePath.length - 1)) {
        this.endTime = detail.routePath.length - 1;
        this.isLast = true;
      }
      else {
        this.isLast = false;
      }

      for (let i = 0; i <= this.endTime; i++) {
        if (lineData.length > 0) {
          let lat = lineData[lineData.length - 1]["lat"];
          let lng = lineData[lineData.length - 1]["lng"];
          lineData = [];
          lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        let routeDateList = [];
        let latLong: string = detail.routePath[i]["latlng"];
        let time = detail.routePath[i]["time"];
        routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
        for (let j = 0; j < routeDateList.length; j++) {
          let routePart = routeDateList[j].split(',');
          if (routePart.length == 2) {
            lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
            this.lineDataList.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]), time: time });
          }
        }
        if (lineData != undefined) {

          let line = new google.maps.Polyline({
            path: lineData,
            strokeColor: "green",
            strokeWeight: 2
          });

          this.polylines[i] = line;
          this.polylines[i].setMap(this.map);
        }
      }
      if (this.isStart == true) {
        if (this.lineIndex == 0) {
          if (this.routeMarker.length > 0) {
            if (this.isReset == true) {
              this.lineIndex = 0;
              if (this.routeMarker[0] == null) {
                this.createMarker();
              }
              else {
                this.routeMarker[0]["marker"].setMap(null);
                this.routeMarker = [];
                this.createMarker();
              }
            }
            else {
              this.routeMarker[0]["marker"] = this.lineDataList[0];
            }
          }
          else {
            this.createMarker();
          }
        }
        else if (this.isReset == true) {
          this.isReset = false;
          this.lineIndex = 0;
          if (this.routeMarker[0] == null) {
            this.createMarker();
          }
          else {
            this.routeMarker[0]["marker"].setMap(null);
            this.routeMarker = [];
            this.createMarker();
          }
        }
        this.animate(this.lineIndex);
      }
    }
  }


  createMarker() {
    let lat = this.lineDataList[this.lineIndex]["lat"];
    let lng = this.lineDataList[this.lineIndex]["lng"]
    let markerURL = "../../../assets/img/red-car.png";
    var markerLabel = "";
    let contentString = '';
    this.setMarker(lat, lng, markerLabel, markerURL, contentString, "route");
  }

  animate(index: any) {
    if (this.timerHandle[this.lineIndex - this.skip]) {
      clearTimeout(this.timerHandle[this.lineIndex - this.skip]);
    }
    if (this.routeMarker[0] == null) {
      this.createMarker();
    }
    this.routeMarker[0]["marker"].setPosition(this.lineDataList[this.lineIndex]);
    this.map.setCenter(this.lineDataList[this.lineIndex]);

    if (this.isStart == true) {
      if (this.lineIndex < this.lineDataList.length) {
        this.timerHandle[this.lineIndex] = setTimeout(() => {
          this.lineIndex = this.lineIndex + this.skip;
          this.animate(this.lineIndex);
          if (this.lineDataList.length > 0) {
            if (this.lineDataList[this.lineIndex] != null) {
              this.routeTime = this.lineDataList[this.lineIndex]["time"];
            }
          }
        }, this.speed);
      }
      else {
        if (this.isLast == false) {
          this.getRouteDataPreNext("next");
          this.animate(this.lineIndex);
        }
        else {
          this.routeMarker[0]["marker"].setPosition(this.lineDataList[this.lineIndex - this.skip]);
          this.map.setCenter(this.lineDataList[this.lineIndex - this.skip]);
          this.isStart = false;
          $('#playStop').removeClass("fas fa-stop-circle");
          $('#playStop').addClass("fab fa-youtube");
        }
      }
    }
  }


  getReset() {
    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').show();
    $('#btnReset').hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.isPreviousTime = false;
    this.selectedDate = $('#txtDate').val();
    $('#ddlTime').val("0");
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.timeInterval = 0;
    this.getPaymentCollectorRoute(this.paymentCollectorId);
  }



  // Play Button Functionality End 

  getPaymentCollector() {
    this.paymentCollectorList = [];
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaymentCollector.json?alt=media";
    let userJSONInstance = this.httpService.get(path).subscribe(async userJsonData => {
      userJSONInstance.unsubscribe();
      if (userJsonData != null) {
        let keyArray = Object.keys(userJsonData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            if (empId != "lastKey") {
              this.paymentCollectorList.push({
                paymentCollectorId: empId,
                name: userJsonData[empId]["name"].toUpperCase().trim(),
                cssClass: "not-active",
                latLng: [],
                km: 0,
                startTime: "---",
                endTime: "---",
                workingHr: "---",
                wardList: [],
                cardCount: "0",
                isChecked: 0,
                cardList: [],
                isRoute: 0
              });
            }
          }
        }
        this.paymentCollectorList = this.paymentCollectorList.sort((a, b) => b.name < a.name ? 1 : -1);
        const promises = this.paymentCollectorList.map(async (item) => {
          const wardBoundary = await this.getPaymentCollectorRouteStatus(item.paymentCollectorId);
          return (wardBoundary);
        });
        const list = await Promise.all(promises);
        for (let i = 0; i < list.length; i++) {
          let empId = list[i]["empId"];
          let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == empId);
          if (detail != undefined) {
            detail.cssClass = list[i]["cssClass"];
            detail.isRoute = list[i]["status"];
          }
        }
        const array = [];
        const notRouteList = this.paymentCollectorList.filter(item => item.isRoute == 0);
        const routeList = this.paymentCollectorList.filter(item => item.isRoute == 1);
        const concatenatedArray = array.concat(routeList, notRouteList);
        this.paymentCollectorList = [];
        this.paymentCollectorList = concatenatedArray;
      }
    }, error => {
    });
  }

  sortUsers() {
    this.paymentCollectorList.sort((a, b) => {
      if (a.age === b.age) {
        return a.name.localeCompare(b.name);
      }
      return a.isRoute - b.isRoute;
    });
  }

  async getPaymentCollectorRouteStatus(empId: any) {
    return new Promise((resolve) => {
      let routeInstance = this.db.object("PaymentCollectionInfo/PaymentCollectorLocationHistory/" + empId + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate + "/last-update-time").valueChanges().subscribe(data => {
        routeInstance.unsubscribe();
        let status = 0;
        let cssClass = "not-active";
        if (data != null) {
          status = 1;
          cssClass = "normal";
          if (this.paymentCollectorId == empId) {
            this.getPaymentCollectorRoute(empId);
          }
        }
        resolve({ empId: empId, status: status, cssClass: cssClass });
      });
    });
  }

  resetDetail() {
    this.setMaps();
    this.paymentCollectorDetail.totalKM = "0";
    this.paymentCollectorDetail.endTime = "---";
    this.paymentCollectorDetail.startTime = "---";
    this.paymentCollectorDetail.totalHr = "---";
    this.paymentCollectorDetail.cardCount = "0";
    this.cardList = [];
    for (let i = 0; i < this.paymentCollectorList.length; i++) {
      if (this.paymentCollectorList[i].cssClass != "not-active") {
        this.paymentCollectorList[i].cssClass = "normal";
      }
    }
    $('#ddlTime').val("0");
    this.timeInterval = 0;
  }

  resetPaymentCollectorList() {
    this.getPaymentCollector();
  }

  getRouteDetail(paymentCollectorId: any) {
    let routeInstance = this.db.object("PaymentCollectionInfo/PaymentCollectorLocationHistory/" + paymentCollectorId + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate).valueChanges().subscribe(data => {
      routeInstance.unsubscribe();
      if (data != null) {
        let totalKM = 0;
        let latLng = [];
        let keyArray = Object.keys(data);
        let preLat = "";
        let preLat1 = 0;
        let preLng1 = 0;
        let routePath = [];
        for (let i = 0; i < keyArray.length - 2; i++) {
          let index = keyArray[i];

          let startTime = new Date(this.commonService.setTodayDate() + " " + "08:00");
          let endTime = new Date(this.commonService.setTodayDate() + " " + "21:00");
          let routeTime = new Date(this.commonService.setTodayDate() + " " + index);
          if (routeTime >= startTime && routeTime <= endTime) {
            routePath.push({ distanceinmeter: data[index]["distance-in-meter"], latlng: data[index]["lat-lng"], time: index });

            if (data[index]["distance-in-meter"] != null) {
              totalKM = totalKM + Number(data[index]["distance-in-meter"]);
            }
            if (data[index]["lat-lng"] != null) {
              let latlngList = data[index]["lat-lng"].split("~");
              if (latlngList.length > 0) {
                for (let j = 0; j < latlngList.length; j++) {
                  let latLngString = latlngList[j].replace("(", "").replace(")", "");
                  let lat = Number(latLngString.split(",")[0]);
                  let lng = Number(latLngString.split(",")[1]);
                  if (preLat1 == 0) {
                    latLng.push({ lat: lat, lng: lng, time: index });
                    preLat1 = lat;
                    preLng1 = lng;
                  }
                  else {
                    let distance = this.getDistanceFromLatLonInKm(preLat1, preLng1, lat, lng);
                    //if (distance > 15) {
                    latLng.push({ lat: lat, lng: lng, time: index });
                    preLat1 = lat;
                    preLng1 = lng;
                    // }
                  }
                }
              }
            }
          }
          let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == paymentCollectorId);
          if (detail != undefined) {
            if (latLng.length > 0) {
              detail.latLng = latLng;
              detail.routePath = routePath;
              detail.km = totalKM;
              detail.startTime = latLng[0]["time"] ? latLng[0]["time"] : "---";
              detail.endTime = latLng[latLng.length - 1]["time"] ? latLng[latLng.length - 1]["time"] : "---";
            }
            detail.isChecked = 1;
          }
        }
        this.getPaymentCardDetail(paymentCollectorId);
      }
      else {
        $(this.divLoader).hide();
      }
    });
  }

  getPaymentCardDetail(paymentCollectorId: any) {
    this.cardList = [];
    let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + paymentCollectorId + "/" + this.selectedDate;
    let collectionInstance = this.db.object(dbPath).valueChanges().subscribe(async data => {
      collectionInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (data[index]["cardNo"] != null) {
              this.cardList.push({ cardNo: data[index]["cardNo"], payMethod: data[index]["payMethod"] ? data[index]["payMethod"] : "", transactionAmount: data[index]["transactionAmount"] ? data[index]["transactionAmount"] : "0", entityId: 0, merchantTransactionId: data[index]["merchantTransactionId"] ? data[index]["merchantTransactionId"] : "" });
            }
          }
        }
        this.getEntityPaymentCardDetail(paymentCollectorId);
      }
      else {
        this.getEntityPaymentCardDetail(paymentCollectorId);
      }
    });
  }

  getEntityPaymentCardDetail(paymentCollectorId: any) {
    let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + paymentCollectorId + "/Entities";
    let entityInstance = this.db.object(dbPath).valueChanges().subscribe(entityData => {
      entityInstance.unsubscribe();
      if (entityData != null) {
        let keyArray = Object.keys(entityData);
        for (let i = 0; i < keyArray.length; i++) {
          let key = keyArray[i];
          let dateData = entityData[key];
          let dateKeyArray = Object.keys(dateData);
          for (let j = 0; j < dateKeyArray.length; j++) {
            let date = dateKeyArray[j];
            if (date == this.selectedDate) {
              let list = dateData[date];
              for (let k = 1; k < list.length; k++) {
                if (list[k]["cardNo"] != null) {
                  this.cardList.push({ cardNo: list[k]["cardNo"], payMethod: list[k]["payMethod"] ? list[k]["payMethod"] : "", transactionAmount: list[k]["transactionAmount"] ? list[k]["transactionAmount"] : "0", entityId: key, merchantTransactionId: list[k]["merchantTransactionId"] ? list[k]["merchantTransactionId"] : "" });
                }
              }
            }
          }
        }
        this.getCardDetail(paymentCollectorId);
      }
      else {
        this.getCardDetail(paymentCollectorId);
      }
    });
  }



  getCardDetail(paymentCollectorId: any) {
    if (this.cardList.length > 0) {
      const promises = [];
      for (let i = 0; i < this.cardList.length; i++) {
        promises.push(Promise.resolve(this.getCardLatLng(this.cardList[i].cardNo)));
      }
      Promise.all(promises).then((results) => {
        for (let i = 0; i < results.length; i++) {
          if (results[i]["status"] == "success") {
            let cardDetail = this.cardList.find(item => item.cardNo == results[i].data.cardNo);
            if (cardDetail != undefined) {
              cardDetail.lat = results[i].data.lat;
              cardDetail.lng = results[i].data.lng;
            }
          }
        }


        const promises1 = [];
        for (let i = 0; i < this.cardList.length; i++) {
          promises1.push(Promise.resolve(this.getCardPaymentTime(this.cardList[i].cardNo,this.cardList[i].merchantTransactionId)));
          promises1.push(Promise.resolve(this.getCardEntityPaymentTime(this.cardList[i].cardNo, this.cardList[i].entityId, this.cardList[i].merchantTransactionId)));
        }
        Promise.all(promises1).then((results) => {
          for (let i = 0; i < results.length; i++) {
            if (results[i]["status"] == "success") {
              let cardDetail = this.cardList.find(item => item.cardNo == results[i].data.cardNo && item.merchantTransactionId==results[i].data.merchantTransactionId);
              if (cardDetail != undefined) {
                cardDetail.time = results[i].data.time;
              }
            }
          }

          let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == paymentCollectorId);
          if (detail != undefined) {
            detail.cardCount = this.cardList.length;
            detail.cardList = this.cardList.sort((a,b)=>a.time>b.time?1:-1);
          }
          this.getPaymentCollectorRoute(paymentCollectorId);
        });
      });
    }
    else {
      let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == paymentCollectorId);
      if (detail != undefined) {
        detail.cardCount = this.cardList.length;
        detail.cardList = this.cardList;
      }
      this.getPaymentCollectorRoute(paymentCollectorId);
    }
  }


  getCardPaymentTime(cardNo: any,merchantTransactionId:any) {
    return new Promise((resolve) => {
      let obj = {};
      let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate;
      let timeInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        timeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let time = data[keyArray[0]]["transactionDateTime"].toString().split(" ")[1];
            let paymentTime = time.split(":")[0] + ":" + time.split(":")[1]
            obj = {
              cardNo: cardNo,
              time: paymentTime,
              merchantTransactionId:merchantTransactionId
            }
            resolve({ status: "success", data: obj });
          }
          else {
            resolve({ status: "fail", data: obj });
          }

        }
        else {
          resolve({ status: "fail", data: obj });
        }
      });
    });
  }

  getCardEntityPaymentTime(cardNo: any, entityId: any, merchantTransactionId: any) {
    return new Promise((resolve) => {
      let obj = {};
      if (entityId == 0) {
        resolve({ status: "fail", data: obj });
      }
      else {
        let dbPath = "PaymentCollectionInfo/PaymentTransactionHistory/" + cardNo + "/Entities/" + entityId + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate;
        let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
          instance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              let isData = 0;
              for (let i = 0; i < keyArray.length; i++) {
                let key = keyArray[i];
                if (data[key]["merchantTransactionId"] == merchantTransactionId) {
                  isData = 1;
                  let time = data[key]["transactionDateTime"].toString().split(" ")[1];
                  let paymentTime = time.split(":")[0] + ":" + time.split(":")[1]
                  obj = {
                    cardNo: cardNo,
                    time: paymentTime,
                    merchantTransactionId:merchantTransactionId
                  }
                  i = keyArray.length;
                }
              }
              if (isData == 1) {
                resolve({ status: "success", data: obj });
              }
              else {
                resolve({ status: "fail", data: obj });
              }
            }
            else {
              resolve({ status: "fail", data: obj });
            }
          }
          else {
            resolve({ status: "fail", data: obj });
          }
        });
      }
    });
  }

  getCardLatLng(cardNo: any) {
    return new Promise((resolve) => {
      let obj = {};
      let dbPath = "CardWardMapping/" + cardNo;
      let cardInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        cardInstance.unsubscribe();
        if (data != null) {
          let lineNo = data["line"];
          let ward = data["ward"];
          dbPath = "Houses/" + ward + "/" + lineNo + "/" + cardNo + "/latLng";
          let latLngInstance = this.db.object(dbPath).valueChanges().subscribe(latLngData => {
            latLngInstance.unsubscribe();
            if (latLngData != null) {
              if (latLngData != "") {
                let lat = latLngData.toString().replace("(", "").replace(")", "").split(",")[0];
                let lng = latLngData.toString().replace("(", "").replace(")", "").split(",")[1];
                obj = {
                  cardNo: cardNo,
                  lat: lat,
                  lng: lng
                }
                resolve({ status: "success", data: obj });
              }
              else {
                resolve({ status: "fail", data: obj });
              }
            }
            else {
              resolve({ status: "fail", data: obj });
            }
          });
        }
        else {
          resolve({ status: "fail", data: obj });
        }
      })
    });
  }


  openCollectionDetail(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 600;
    let width = 500;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
  }


  closeModel() {
    this.modalService.dismissAll();
  }


  getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6377830; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in metres
  }

  deg2rad(deg: any) {
    return deg * (Math.PI / 180)
  }

  getPaymentCollectorRoute(paymentCollectorId: any) {
    $(this.divLoader).show();
    this.resetDetail();
    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').show();
    $('#btnReset').hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.cardList = [];
    this.paymentCollectorId = paymentCollectorId;
    let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == paymentCollectorId);
    if (detail != undefined) {
      detail.cssClass = "active";
      if (detail.isChecked == 0) {
        this.getRouteDetail(paymentCollectorId);
      }
      else {
        $(this.trackDetail).show();
        $(this.timeBox).show();
        if (detail.startTime != "---") {
          this.paymentCollectorDetail.startTime = detail.startTime;
          this.paymentCollectorDetail.endTime = detail.endTime;
          this.paymentCollectorDetail.totalKM = (detail.km / 1000).toFixed(3);
          this.paymentCollectorDetail.cardCount = detail.cardCount;
          if (detail.cardList.length > 0) {
            this.cardList = detail.cardList;
            for (let i = 0; i < this.cardList.length; i++) {
              let imageURL = "../../../assets/img/green-home.png";
              let contentString = this.cardList[i].cardNo + " - " + this.cardList[i].time;
              this.setCardMarkers(this.cardList[i].lat, this.cardList[i].lng, imageURL, 25, 30, "", contentString);
            }
          }
          let totalMinutes = this.commonService.timeDifferenceMin(new Date(this.selectedDate + " " + detail.startTime), new Date(this.selectedDate + " " + detail.endTime));
          let time = "";
          this.paymentCollectorDetail.totalHr = this.commonService.getHrsFull(totalMinutes);
          this.bounds = new google.maps.LatLngBounds();
          this.polylines = [];
          for (let i = 0; i < detail.latLng.length; i++) {
            this.bounds.extend({ lat: Number(detail.latLng[i].lat), lng: Number(detail.latLng[i].lng) });
            if (i == 0) {
              time = detail.latLng[i].time.split(":")[0];
              let contentString = "Start Time : " + detail.latLng[i].time;
              this.setMarkers(detail.latLng[i].lat, detail.latLng[i].lng, this.startPointUrl, 35, 40, detail.latLng[i].time, contentString);
            }
            else if (i == detail.latLng.length - 1) {
              let contentString = "End Time : " + detail.latLng[i].time;
              this.routeTime = detail.latLng[i].time;
              this.setMarkers(detail.latLng[i].lat, detail.latLng[i].lng, this.endPointUrl, 35, 40, detail.latLng[i].time, contentString);
            }
          }
          let line = new google.maps.Polyline({
            path: detail.latLng,
            strokeColor: "green",
            strokeWeight: 2,
          });
          this.polylines[0] = line;
          this.polylines[0].setMap(this.map);
          this.map.fitBounds(this.bounds);
        }
        $(this.divLoader).hide();
      }
    }
  }




  getRouteData(timeInt: any) {
    if (this.paymentCollectorId == 0) {
      this.timeInterval = 0;
      $("#ddlTime").val("0");
      this.commonService.setAlertMessage("error", "Please select payment collector id.");
      return;
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }

    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').show();
    $('#btnReset').hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.isPreviousTime = false;
    this.selectedDate = $('#txtDate').val();
    this.lineDataList = [];




    this.endTime = 0;
    this.timeInterval = parseInt(timeInt);
    let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == this.paymentCollectorId);
    if (detail != undefined) {
      if (this.timeInterval == 0) {
        if (this.vehicleMarker != null) {
          this.vehicleMarker.setMap(null);
        }
        this.endTime = null;
        this.isPreviousTime = false;
        this.routeTime = this.paymentCollectorDetail.endTime;
        let line = new google.maps.Polyline({
          path: detail.latLng,
          strokeColor: "green",
          strokeWeight: 2,
        });
        this.polylines[0] = line;
        this.polylines[0].setMap(this.map);
      }
      else {
        if (this.endTime != null) {
          this.endTime = parseInt(this.endTime) + parseInt(timeInt) - 1;
          if (this.isPreviousTime == false) {
            this.isPreviousTime = true;
          }
        }
        else {
          this.endTime = parseInt(timeInt) - 1;
          this.isPreviousTime = false;
        }
        this.getPaymentCollectorRouteTime();
      }
    }

  }

  getPaymentCollectorRouteTime() {
    let lineData = [];
    this.routeTime = "00:00";
    if (this.vehicleMarker != null) {
      this.vehicleMarker.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == this.paymentCollectorId);
    if (detail != undefined) {
      if (this.endTime >= (detail.routePath.length - 1)) {
        this.endTime = detail.routePath.length - 1;
        this.isLast = true;
      }
      else {
        this.isLast = false;
      }

      for (let i = 0; i <= this.endTime; i++) {
        if (lineData.length > 0) {
          let lat = lineData[lineData.length - 1]["lat"];
          let lng = lineData[lineData.length - 1]["lng"];
          lineData = [];
          lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
        }
        let routeDateList = [];
        let latLong: string = detail.routePath[i]["latlng"];
        routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
        for (let j = 0; j < routeDateList.length; j++) {
          let routePart = routeDateList[j].split(',');
          if (routePart.length == 2) {
            lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
          }
        }
        if (lineData != undefined) {
          let line = new google.maps.Polyline({
            path: lineData,
            strokeColor: "green",
            strokeWeight: 2
          });

          if (i == this.endTime) {
            let flowMarkerURL = '../assets/img/walking.png';;
            var flowMarkerLabel = "";
            let lat = lineData[lineData.length - 1]["lat"];
            let lng = lineData[lineData.length - 1]["lng"];
            let contentString = '<br/>Time : ' + detail.routePath[i]["time"];
            this.setMarker(lat, lng, flowMarkerLabel, flowMarkerURL, contentString, "routeMarker");
            this.routeTime = detail.routePath[i]["time"];
          }

          this.polylines[i] = line;
          this.polylines[i].setMap(this.map);
        }
      }

    }

  }

  setMarker(lat: any, lng: any, markerLabel: any, markerURL: any, contentString: any, type: any) {
    let scaledHeight = 60;
    let scaledWidth = 40;
    if (type == "route") {
      scaledHeight = 10;
      scaledWidth = 20;
    }

    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      label: { text: ' ' + markerLabel + ' ', color: "white", fontSize: "12px", fontWeight: "bold" },
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(scaledHeight, scaledWidth),
        origin: new google.maps.Point(0, 0),
        labelOrigin: new google.maps.Point(25, 31)
      }
    });

    let infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    marker.addListener('click', function () {
      infowindow.open(this.map, marker);
    });
    if (type == "route") {
      if (this.routeMarker.length > 0) {
        this.routeMarker[0]["matker"] = marker;
      }
      else {
        this.routeMarker.push({ marker });
      }
    }
    else {
      this.vehicleMarker = marker;
    }
  }

  getRouteDataPreNext(type: any) {
    if (this.timeInterval != 0) {
      if (this.vehicleMarker != null) {
        this.vehicleMarker.setMap(null);
      }
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          this.polylines[i].setMap(null);
        }
      }
      if (type == "pre") {
        this.endTime = this.endTime - this.timeInterval;
        if (this.endTime < 0) {
          this.endTime = 0;
        }
        this.getPaymentCollectorRouteTime();
      }
      else {
        this.endTime = this.endTime + this.timeInterval;
        this.getPaymentCollectorRouteTime();
      }
    }
    else {
      this.commonService.setAlertMessage("error", "Please select time interval.");
    }
  }


  setMarkers(lat: any, lng: any, markerUrl: any, point1: any, point2: any, time: any, contentString: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(point1, point2),
        origin: new google.maps.Point(0, 0),
      },
    });
    let infowindowEnd = new google.maps.InfoWindow({
      content: contentString,
    });

    marker.addListener("click", function () {
      infowindowEnd.open(this.map, marker);
    });
  }

  setCardMarkers(lat: any, lng: any, markerUrl: any, point1: any, point2: any, time: any, contentString: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        origin: new google.maps.Point(0, 0),
      },
    });
    let infowindowEnd = new google.maps.InfoWindow({
      content: contentString,
    });

    marker.addListener("click", function () {
      infowindowEnd.open(this.map, marker);
    });
  }

  setDate(filterVal: any, type: string) {
    $(this.trackDetail).hide();
    $(this.timeBox).hide();
    this.routeTime = "00:00";
    this.isReset = true;
    this.isStart = false;
    $('#playStop').removeClass("fas fa-stop-circle");
    $('#playStop').addClass("fab fa-youtube");
    $('#btnPre').show();
    $('#btnReset').hide();
    this.lineDataList = [];
    this.lineIndex = 0;
    this.isPreviousTime = false;
    this.selectedDate = $('#txtDate').val();
    this.lineDataList = [];
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.selectedYear = this.selectedDate.split('-')[0];
        this.selectMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
        this.setMaps();
        this.resetDetail();
        this.resetPaymentCollectorList();
        for (let i = 0; i < this.paymentCollectorList.length; i++) {
          this.getPaymentCollectorRouteStatus(this.paymentCollectorList[i]["paymentCollectorId"]);
        }
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 50);
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

}

export class paymentCollectorDetail {
  totalKM: string;
  totalHr: string;
  startTime: string;
  endTime: string;
  cardCount: string;
}
