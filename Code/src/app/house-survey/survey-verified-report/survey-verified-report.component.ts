/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";

@Component({
  selector: 'app-survey-verified-report',
  templateUrl: './survey-verified-report.component.html',
  styleUrls: ['./survey-verified-report.component.scss']
})
export class SurveyVerifiedReportComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(private commonService: CommonService, private httpService: HttpClient) { }
  selectedZone: any;
  zoneList: any;
  zoneKML: any;
  cityName: any;
  cardList: any[];
  cardFilterList: any[];
  cardFinalList: any[];
  divLoaderUpdate = "#divLoaderUpdate";
  public totalVerifiedCount: any;
  public multipleCardsCount: any;
  public notVerifiedCardsCount: any;
  txtCardNo = "#txtCardNo";
  ddlZone = "#ddlZone";
  chkDuplicate = "chkDuplicate";
  chkNotInZone = "chkNotInZone";
  chkNotVerified = "chkNotVerified";
  rowDataList: any;
  marker:any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.selectedZone = 0;
    this.totalVerifiedCount = 0;
    this.multipleCardsCount = 0;
    this.notVerifiedCardsCount = 0;
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    $(this.divLoaderUpdate).show();
    if(this.marker!=null){
      this.marker.setMap(null);
    }
    this.selectedZone = filterVal;
    this.selectedZone = filterVal;
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, 2).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
      this.getCardList();
    });
  }

  getCardList() {
    this.cardList = [];
    this.cardFinalList = [];
    this.cardFilterList = [];
    this.totalVerifiedCount = 0;
    this.multipleCardsCount = 0;
    this.notVerifiedCardsCount = 0;
    (<HTMLInputElement>document.getElementById(this.chkDuplicate)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotInZone)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotVerified)).checked = false;
    $(this.txtCardNo).val("");

    let element = <HTMLElement>document.getElementById("divList");
    element.scrollTop = 0;
    this.rowDataList = 100;
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerificationJson%2F" + this.selectedZone + "%2FHouseAndItsVerifiedCards.json?alt=media";
    let verifiedInstance = this.httpService.get(path).subscribe(data => {
      verifiedInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));
      let counts = 0;
      for (let i = 0; i < list.length; i++) {
        counts++;
        let notInZone = 0;
        let notVerified = 0;
        if (list[i]["color"] == "red") {
          notInZone = 1;
        }
        if (list[i]["color"] == "purple") {
          notVerified = 1;
        }
        let detail = this.cardList.find(item => item.cardNo == list[i]["cardNo"]);
        if (detail == undefined) {
          let verifyLineNoList = [];
          verifyLineNoList.push({ lineNo: list[i]["verifiedLineNo"] });
          this.cardList.push({ cardNo: list[i]["cardNo"],color:list[i]["color"], houseLineNo: list[i]["houseLineNo"],latLng:list[i]["latLng"], verifyLineNoList: verifyLineNoList, count: 1, notInZone: notInZone, notVerified: notVerified });
        }
        else {
          detail.verifyLineNoList.push({ lineNo: list[i]["verifiedLineNo"] });
          detail.count = detail.count + 1;
        }
      }
      this.multipleCardsCount = (this.cardList.filter(item => item.count > 1).length);
      this.notVerifiedCardsCount = (this.cardList.filter(item => item.notVerified == 1).length);
      this.totalVerifiedCount = counts;
      this.cardFilterList = this.cardList;
      this.cardFinalList = this.cardFilterList.slice(0, this.rowDataList);
      $(this.divLoaderUpdate).hide();
    }, error => {
      $(this.divLoaderUpdate).hide();
      this.commonService.setAlertMessage("error", "Data not found. Please update from Survey Verfication !!!")
    });
  }

  onContainerScroll() {
    let element = <HTMLElement>document.getElementById("divList");
    if ((element.offsetHeight + element.scrollTop + 10) >= element.scrollHeight) {
      this.rowDataList = this.rowDataList + 100;
      this.cardFinalList = this.cardFilterList.slice(0, this.rowDataList);
    }
  }

  showMarkerOnMap(latLng:any,color:any){
    if(this.marker!=null){
      this.marker.setMap(null);
    }
    let lat=latLng.split(',')[0];
    let lng=latLng.split(',')[1];
    let markerURL=this.getMarkerIcon(color);
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(25, 25),
        origin: new google.maps.Point(0, 0),
      },
    });
    marker.setAnimation(google.maps.Animation.BOUNCE);
    this.marker=marker;
  }

  getMarkerIcon(color: any) {
    let markerIcon = "../assets/img/red-home.png";
    if (color == "green") {
      markerIcon = "../assets/img/green-home.png";
    }
    else if (color == "yellow") {
      markerIcon = "../assets/img/yellow-home.png";
    }
    else if (color == "purple") {
      markerIcon = "../assets/img/purple-home.png";
    }
    return markerIcon;
  }

  getFilter() {
    let element = <HTMLElement>document.getElementById("divList");
    element.scrollTop = 0;
    this.rowDataList = 100;
    let cardNo = $(this.txtCardNo).val();
    let list = this.cardList;
    if ((<HTMLInputElement>document.getElementById(this.chkDuplicate)).checked == true) {
      list = this.cardList.filter(item => item.count > 1);
    }
    if ((<HTMLInputElement>document.getElementById(this.chkNotInZone)).checked == true) {
      list = list.filter(item => item.notInZone == 1);
    }
    if ((<HTMLInputElement>document.getElementById(this.chkNotVerified)).checked == true) {
      list = list.filter(item => item.notVerified == 1);
    }
    if (cardNo != "") {
      list = list.filter(item => item.cardNo.toString().toUpperCase().includes(cardNo.toString().toUpperCase()));
    }
    this.cardFilterList = list;
    this.cardFinalList = this.cardFilterList.slice(0, this.rowDataList);
  }

  exportList() {
    if (this.cardList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Card Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Varified Line Number";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Houses Line Number";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.cardList.length; i++) {
        let verifyLineNoList = this.cardList[i]["verifyLineNoList"];
        for (let j = 0; j < verifyLineNoList.length; j++) {
          htmlString += "<tr>";
          htmlString += "<td t='s'>";
          htmlString += this.cardList[i]["cardNo"];
          htmlString += "</td>";
          htmlString += "<td t='s'>";
          htmlString += verifyLineNoList[j]["lineNo"];
          htmlString += "</td>";
          htmlString += "<td t='s'>";
          htmlString += this.cardList[i]["houseLineNo"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }
      }
      htmlString += "</table>";
      let fileName = "Zone-" + this.selectedZone + "-VerifiedCards.xlsx";
      this.commonService.exportExcel(htmlString, fileName);

    }
  }
}
