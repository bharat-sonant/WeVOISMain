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
  paymentCollectorId: any;
  public bounds: any;
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

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    // $(this.trackDetail).hide();
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.paymentCollectorList = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    $('#txtDate').val(this.selectedDate);
    this.paymentCollectorId = 0;
    this.setHeight();
    this.setMaps();
    this.getPaymentCollector();
  }

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
          let detail=this.paymentCollectorList.find(item=>item.paymentCollectorId==empId);
          if(detail!=undefined){
            detail.cssClass=list[i]["cssClass"];
            detail.isRoute=list[i]["status"];
          }
        }
        const array=[];
        const notRouteList=this.paymentCollectorList.filter(item=>item.isRoute==0);
        const routeList=this.paymentCollectorList.filter(item=>item.isRoute==1);
        const concatenatedArray = array.concat(routeList, notRouteList);
        this.paymentCollectorList = [];
        this.paymentCollectorList=concatenatedArray;
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
        let cssClass="not-active";
        if (data != null) {
          status = 1;
          cssClass="normal";
        }
        resolve({ empId: empId, status: status,cssClass:cssClass });
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
        for (let i = 0; i < keyArray.length - 2; i++) {
          let index = keyArray[i];
          let startTime = new Date(this.commonService.setTodayDate() + " " + "08:00");
          let endTime = new Date(this.commonService.setTodayDate() + " " + "21:00");
          let routeTime = new Date(this.commonService.setTodayDate() + " " + index);
          if (routeTime >= startTime && routeTime <= endTime) {

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
                    if (distance > 15) {
                      latLng.push({ lat: lat, lng: lng, time: index });
                      preLat1 = lat;
                      preLng1 = lng;
                    }
                  }
                }
              }
            }
          }
          let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == paymentCollectorId);
          if (detail != undefined) {
            if (latLng.length > 0) {
              detail.latLng = latLng;
              detail.km = totalKM;
              detail.startTime = latLng[0]["time"] ? latLng[0]["time"] : "---";
              detail.endTime = latLng[latLng.length - 1]["time"] ? latLng[latLng.length - 1]["time"] : "---";
            }
            detail.isChecked = 1;
          }
        }
        this.getPaymentCardDetail(paymentCollectorId);
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
              this.cardList.push({ cardNo: data[index]["cardNo"], merchantTransactionId: data[index]["merchantTransactionId"] ? data[index]["merchantTransactionId"] : "", payMethod: data[index]["payMethod"] ? data[index]["payMethod"] : "", retrievalReferenceNo: data[index]["retrievalReferenceNo"] ? data[index]["retrievalReferenceNo"] : "", transactionAmount: data[index]["transactionAmount"] ? data[index]["transactionAmount"] : "0" });
            }
          }
        }

        let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == paymentCollectorId);
        if (detail != undefined) {
          detail.cardCount = keyArray.length;
          detail.cardList = this.cardList;
        }
      }
      this.getPaymentCollectorRoute(paymentCollectorId);
    });
  }


  openCollectionDetail(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 600;
    let width = 800;
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
    this.cardList = [];
    let detail = this.paymentCollectorList.find(item => item.paymentCollectorId == paymentCollectorId);
    if (detail != undefined) {
      detail.cssClass = "active";
      if (detail.isChecked == 0) {
        this.getRouteDetail(paymentCollectorId);
      }
      else {
        $(this.trackDetail).show();
        if (detail.startTime != "---") {
          this.paymentCollectorDetail.startTime = detail.startTime;
          this.paymentCollectorDetail.endTime = detail.endTime;
          this.paymentCollectorDetail.totalKM = (detail.km / 1000).toFixed(3);
          this.paymentCollectorDetail.cardCount = detail.cardCount;
          if (detail.cardList.length > 0) {
            this.cardList = detail.cardList;
            for (let i = 0; i < this.cardList.length; i++) {
              let imageURL = "../../../assets/img/green.svg";
              let contentString = this.cardList[i].cardNo;
              this.setMarkers(this.cardList[i].lat, this.cardList[i].lng, imageURL, 35, 40, "", contentString);
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
              this.setMarkers(detail.latLng[i].lat, detail.latLng[i].lng, this.endPointUrl, 35, 40, detail.latLng[i].time, contentString);
            }
            else {
              if (time != detail.latLng[i].time.split(":")[0]) {
                let imageURL = "../../../assets/img/green.svg";
                let contentString = detail.latLng[i].time;
                this.setMarkers(detail.latLng[i].lat, detail.latLng[i].lng, imageURL, 35, 40, detail.latLng[i].time, contentString);
                time = detail.latLng[i].time.split(":")[0];
              }
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

  setDate(filterVal: any, type: string) {
    $(this.trackDetail).hide();
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.selectedYear = this.selectedDate.split('-')[0];
        this.selectMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
        this.paymentCollectorId = 0;
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
