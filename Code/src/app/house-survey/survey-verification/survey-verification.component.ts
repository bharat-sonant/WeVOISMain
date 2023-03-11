/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-survey-verification',
  templateUrl: './survey-verification.component.html',
  styleUrls: ['./survey-verification.component.scss']
})
export class SurveyVerificationComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  public selectedZone: any;
  zoneList: any[];
  cityName: any;
  db: any;
  zoneKML: any;
  polylines = [];
  allMarkers: any[] = [];
  cardMarkers: any[] = [];
  toDayDate: any;
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  fileStoragePath = this.commonService.fireStoragePath;
  lines: any[] = [];
  wardLineCount: any;
  lineNo: any;
  chkShowAll = "chkShowAll";
  divLoaderUpdate = "#divLoaderUpdate";
  previousLine: any;
  houseCardList: any[] = [];
  verifiedCardList: any[] = [];
  cardWardList: any[] = [];
  allCardList: any[] = [];
  houseVerifiedCardList: any[] = [];
  verifiedDetail: verifiedDetail = {
    lastUpdate: "---",
    greenCount: 0,
    yellowCount: 0,
    purpleCount: 0,
    redCount: 0
  }

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient, private storage: AngularFireStorage) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.selectedZone = 0;
    (<HTMLInputElement>document.getElementById(this.chkShowAll)).checked = true;
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
    this.clearAllOnMap();
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
      this.getWardDetail();
    });
  }


  getNextPrevious(type: any) {
    (<HTMLInputElement>document.getElementById(this.chkShowAll)).checked = false;
    let lineNo = $("#txtLineNo").val();
    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    if (type == "pre") {
      if (lineNo != "1") {
        this.lineNo = Number(lineNo) - 1;
        $("#txtLineNo").val(this.lineNo);
      }
    } else if (type == "next") {
      if (Number(lineNo) < this.wardLineCount) {
        this.lineNo = Number(lineNo) + 1;
        $("#txtLineNo").val(this.lineNo);
      }
    }
    this.showVerifiedCardsOnMap(this.lineNo);
  }

  getCurrentLineDetail(event: any) {
    (<HTMLInputElement>document.getElementById(this.chkShowAll)).checked = false;
    if (event.key == "Enter") {
      let lineNo = $("#txtLineNo").val();
      if (lineNo == "") {
        this.commonService.setAlertMessage("error", "Please enter line no. !!!");
        return;
      }
      if (Number(lineNo) <= this.wardLineCount) {
        this.lineNo = lineNo;
      } else {
        this.commonService.setAlertMessage("error", "Line no. not exist in ward !!!");
        this.lineNo = 1;
        $("#txtLineNo").val(this.lineNo);
      }
      this.showVerifiedCardsOnMap(this.lineNo);
    }
  }

  showAllMarkers() {
    if ((<HTMLInputElement>document.getElementById(this.chkShowAll)).checked == true) {
      this.showVerifiedCardsOnMap("0");
    }
    else {
      this.showVerifiedCardsOnMap(this.lineNo);
    }
  }

  clearAllOnMap() {
    (<HTMLInputElement>document.getElementById(this.chkShowAll)).checked = true;
    this.lines = [];
    this.lineNo = 1;
    this.previousLine = 1;
    $("#txtLineNo").val(this.lineNo);
    this.verifiedDetail.lastUpdate = "---";
    if (this.cardMarkers.length > 0) {
      for (let i = 0; i < this.cardMarkers.length; i++) {
        this.cardMarkers[i]["marker"].setMap(null);
      }
    }
    this.cardMarkers = [];
    this.verifiedDetail.greenCount = 0;
    this.verifiedDetail.yellowCount = 0;
    this.verifiedDetail.purpleCount = 0;
    this.verifiedDetail.redCount = 0;
  }

  getWardDetail() {
    this.getAllLinesFromJson();
    this.getVarifiedCardJSON();
  }

  getVarifiedCardJSON() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerificationJson%2F" + this.selectedZone + "%2FLastUpdate.json?alt=media";
    let lastUpdateInstance = this.httpService.get(path).subscribe(lastUpdatedata => {
      lastUpdateInstance.unsubscribe();
      if (lastUpdatedata != null) {
        this.verifiedDetail.lastUpdate = lastUpdatedata["date"];
        const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerificationJson%2F" + this.selectedZone + "%2FHouseAndItsVerifiedCards.json?alt=media";
        let verifiedInstance = this.httpService.get(path).subscribe(data => {
          verifiedInstance.unsubscribe();
          this.houseVerifiedCardList = JSON.parse(JSON.stringify(data));
          setTimeout(() => {
            this.showVerifiedCardsOnMap("0");
          }, 100);
        });
      }
    }, error => {
      this.updateJSONData();
    });
  }

  showVerifiedCardsOnMap(lineNo: any) {
    if (this.cardMarkers.length > 0) {
      for (let i = 0; i < this.cardMarkers.length; i++) {
        this.cardMarkers[i]["marker"].setMap(null);
      }
    }
    this.cardMarkers = [];
    this.verifiedDetail.greenCount = 0;
    this.verifiedDetail.yellowCount = 0;
    this.verifiedDetail.purpleCount = 0;
    this.verifiedDetail.redCount = 0;
    if (this.houseVerifiedCardList.length > 0) {
      let houseVerifiedMarkerList = [];
      if (lineNo == "0") {
        houseVerifiedMarkerList = this.houseVerifiedCardList;
      }
      else {
        houseVerifiedMarkerList = this.houseVerifiedCardList.filter(item => item.mapLineNo == lineNo);
      }

      this.verifiedDetail.greenCount = houseVerifiedMarkerList.filter(item => item.color == "green").length;
      this.verifiedDetail.yellowCount = houseVerifiedMarkerList.filter(item => item.color == "yellow").length;
      this.verifiedDetail.purpleCount = houseVerifiedMarkerList.filter(item => item.color == "purple").length;
      this.verifiedDetail.redCount = houseVerifiedMarkerList.filter(item => item.color == "red").length;
      for (let i = 0; i < houseVerifiedMarkerList.length; i++) {
        let markerURL = this.getMarkerIcon(houseVerifiedMarkerList[i]["color"]);
        let cardNo=houseVerifiedMarkerList[i]["cardNo"];
        let lat = houseVerifiedMarkerList[i]["latLng"].split(",")[0];
        let lng = houseVerifiedMarkerList[i]["latLng"].split(",")[1];
        let marker = new google.maps.Marker({
          position: { lat: Number(lat), lng: Number(lng) },
          map: this.map,
          icon: {
            url: markerURL,
            fillOpacity: 1,
            strokeWeight: 0,
            scaledSize: new google.maps.Size(15, 15),
            origin: new google.maps.Point(0, 0),
          },
        });
        let infowindow = new google.maps.InfoWindow({
          content: cardNo
        });
        marker.addListener('click', function () {
          infowindow.open(this.map, marker);
        });
        this.cardMarkers.push({ marker });
      }
      $(this.divLoaderUpdate).hide();
    }
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

  getAllLinesFromJson() {
    this.commonService.getWardLine(this.selectedZone, this.toDayDate).then((data: any) => {
      if (this.allMarkers.length > 0) {
        for (let i = 0; i < this.allMarkers.length; i++) {
          this.allMarkers[i]["marker"].setMap(null);
        }
      }
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          if (this.polylines[i] != null) {
            this.polylines[i].setMap(null);
          }
        }
      }
      this.allMarkers = [];
      this.polylines = [];
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      this.wardLineCount = wardLines["totalLines"];
      for (let i = 1; i <= this.wardLineCount; i++) {
        let lineNo = Number(keyArray[i]);
        try {
          let points = wardLines[lineNo]["points"];
          var latLng = [];
          for (let j = 0; j < points.length; j++) {
            latLng.push({ lat: points[j][0], lng: points[j][1] });
          }
          this.lines.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA", });
          this.plotLineOnMap(lineNo, latLng, i, this.selectedZone);
        }
        catch { }
      }

    });
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    if (wardNo == this.selectedZone) {
      let strokeWeight = 2;
      let status = "";
      if (lineNo == this.lineNo) {
        strokeWeight = 5;
        status = "requestedLine";
      }
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: this.commonService.getLineColor(status),
        strokeWeight: strokeWeight,
      });
      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);

      let userType = localStorage.getItem("userType");
      if (userType == "Internal User") {
        let lat = latlng[0]["lat"];
        let lng = latlng[0]["lng"];
        this.setMarkerForLineNo(lat, lng, this.invisibleImageUrl, lineNo.toString(), this.map);
      }
    }
  }

  setMarkerForLineNo(lat: any, lng: any, markerURL: any, markerLabel: any, map: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(30, 40),
        origin: new google.maps.Point(0, 0),
      },
      label: {
        text: markerLabel,
        color: "#000",
        fontSize: "10px",
        fontWeight: "bold",
      },
    });
    this.allMarkers.push({ marker });
  }

  // update json data start

  updateJSONData() {
    $(this.divLoaderUpdate).show();
    this.cardWardList = [];
    this.allCardList = [];
    this.verifiedCardList = [];
    this.houseCardList = [];
    this.houseVerifiedCardList = [];
    if (this.cardMarkers.length > 0) {
      for (let i = 0; i < this.cardMarkers.length; i++) {
        this.cardMarkers[i]["marker"].setMap(null);
      }
    }
    this.getVerifiedCardData();
  }


  getVerifiedCardData() {
    let dbPath = "SurveyVerifierData/VerifiedHouses/" + this.selectedZone;
    let verifiedCardInstance = this.db.object(dbPath).valueChanges().subscribe(
      verifiedCardData => {
        verifiedCardInstance.unsubscribe();
        if (verifiedCardData != null) {
          let keyArray = Object.keys(verifiedCardData);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            let cardData = verifiedCardData[lineNo];
            let cardKeyArray = Object.keys(cardData);
            for (let j = 0; j < cardKeyArray.length; j++) {
              let cardNo = cardKeyArray[j];
              this.verifiedCardList.push({ cardNo: cardNo, lineNo: lineNo });
              this.allCardList.push({ cardNo: cardNo });
            }
          }
          if (this.verifiedCardList.length > 0) {
            this.verifiedCardList = this.commonService.transformNumeric(this.verifiedCardList, "cardNo");
            let fileName = "VerifiedCardData.json";
            let filePath = "/SurveyVerificationJson/" + this.selectedZone + "/";
            this.commonService.saveJsonFile(this.verifiedCardList, fileName, filePath);
          }
          this.getCardWardMappingData();
        }
        else {
          this.commonService.setAlertMessage("error", "Card Varification not started in this ward. !!!");
          $(this.divLoaderUpdate).hide();
        }

      }
    );
  }

  getCardWardMappingData() {
    let dbPath = "CardWardMapping";
    let cardWardInstance = this.db.object(dbPath).valueChanges().subscribe(
      cardWardData => {
        cardWardInstance.unsubscribe();
        if (cardWardData != null) {
          let keyArray = Object.keys(cardWardData);
          for (let i = 0; i < keyArray.length; i++) {
            let cardNo = keyArray[i];
            let ward = cardWardData[cardNo]["ward"];
            let line = cardWardData[cardNo]["line"];
            //if (this.selectedZone == ward) {
            this.cardWardList.push({ cardNo: cardNo, lineNo: line, ward: ward });
            // }
          }
        }
        if (this.cardWardList.length > 0) {
          this.cardWardList = this.commonService.transformNumeric(this.cardWardList, "cardNo");
          let fileName = "CardWardMapping.json";
          let filePath = "/SurveyVerificationJson/";
          this.commonService.saveJsonFile(this.cardWardList, fileName, filePath);
        }
        this.getHouseCardData();
      }
    )
  }


  getHouseCardData() {
    let dbPath = "Houses/" + this.selectedZone;
    let houseCardInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseCardData => {
        houseCardInstance.unsubscribe();
        if (houseCardData != null) {
          let keyArray = Object.keys(houseCardData);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            let cardData = houseCardData[lineNo];
            let cardKeyArray = Object.keys(cardData);
            for (let j = 0; j < cardKeyArray.length; j++) {
              let cardNo = cardKeyArray[j];
              let latLng = "";
              if (cardData[cardNo]["latLng"] != null) {
                latLng = cardData[cardNo]["latLng"].toString().replace("(", "").replace(")", "");
              }
              this.houseCardList.push({ cardNo: cardNo, lineNo: lineNo, latLng: latLng });
              this.allCardList.push({ cardNo: cardNo });
            }
          }
        }
        if (this.houseCardList.length > 0) {
          this.houseCardList = this.commonService.transformNumeric(this.houseCardList, "cardNo");
          let fileName = "HouseCardData.json";
          let filePath = "/SurveyVerificationJson/" + this.selectedZone + "/";
          this.commonService.saveJsonFile(this.houseCardList, fileName, filePath);
        }
        if (this.allCardList.length > 0) {
          this.allCardList = this.commonService.transformNumeric(this.allCardList, "cardNo");
          let fileName = "AllCardData.json";
          let filePath = "/SurveyVerificationJson/" + this.selectedZone + "/";
          this.commonService.saveJsonFile(this.houseCardList, fileName, filePath);
        }
        this.getVerifiedHouseData();
      }
    );
  }

  getVerifiedHouseData() {
    if (this.allCardList.length > 0) {
      this.getHouseAndItsVaridiedCards(0);
    }
  }

  getHouseAndItsVaridiedCards(index: any) {
    if (index == this.allCardList.length) {
      if (this.houseVerifiedCardList.length > 0) {
        let fileName = "HouseAndItsVerifiedCards.json";
        let filePath = "/SurveyVerificationJson/" + this.selectedZone + "/";
        this.commonService.saveJsonFile(this.houseVerifiedCardList, fileName, filePath);
      }
      this.setLastUpdate();
    }
    else {
      let isExistInVerified = 0;
      let isExistInHouses = 0;
      let verifiedLineNo = "";
      let houseLineNo = "";
      let latLng = "";
      let color = "red";
      let cardNo = this.allCardList[index]["cardNo"];
      let mapLineNo = "";
      let detail = this.verifiedCardList.find(item => item.cardNo == cardNo);
      if (detail != undefined) {
        isExistInVerified = 1;
        verifiedLineNo = detail.lineNo;
      }
      detail = this.houseCardList.find(item => item.cardNo == cardNo);
      if (detail != undefined) {
        isExistInHouses = 1;
        houseLineNo = detail.lineNo;
        latLng = detail.latLng;
      }
      if (isExistInHouses == 1 && isExistInVerified == 1) {
        if (verifiedLineNo == houseLineNo) {
          color = "green";
        }
        else {
          color = "yellow";
        }
        mapLineNo = verifiedLineNo;
        this.houseVerifiedCardList.push({ cardNo: cardNo, isExistInVerified: isExistInVerified, isExistInHouses: isExistInHouses, verifiedLineNo: verifiedLineNo, houseLineNo: houseLineNo, latLng: latLng, color: color, mapLineNo: mapLineNo });
        index++;
        this.getHouseAndItsVaridiedCards(index);
      }
      else if (isExistInVerified == 0) {
        color = "purple";
        mapLineNo = houseLineNo;
        this.houseVerifiedCardList.push({ cardNo: cardNo, isExistInVerified: isExistInVerified, isExistInHouses: isExistInHouses, verifiedLineNo: verifiedLineNo, houseLineNo: houseLineNo, latLng: latLng, color: color, mapLineNo: mapLineNo });
        index++;
        this.getHouseAndItsVaridiedCards(index);
      }
      else {
        color = "red";
        let detail = this.cardWardList.find(item => item.cardNo == cardNo);
        if (detail != undefined) {
          let ward = detail.ward;
          let line = detail.lineNo;
          let dbPath = "Houses/" + ward + "/" + line + "/" + cardNo + "/latLng";
          let houseLatLngInstance = this.db.object(dbPath).valueChanges().subscribe(
            houseLatLngData => {
              houseLatLngInstance.unsubscribe();
              if (houseLatLngData != null) {
                latLng = houseLatLngData.toString().replace("(", "").replace(")", "");
              }
              mapLineNo = verifiedLineNo;
              this.houseVerifiedCardList.push({ cardNo: cardNo, isExistInVerified: isExistInVerified, isExistInHouses: isExistInHouses, verifiedLineNo: verifiedLineNo, houseLineNo: houseLineNo, latLng: latLng, color: color, mapLineNo: mapLineNo });
              index++;
              this.getHouseAndItsVaridiedCards(index);
            }
          );
        }
        else {
          index++;
          this.getHouseAndItsVaridiedCards(index);
        }
      }
    }
  }

  setLastUpdate() {
    let fileName = "LastUpdate.json";
    let filePath = "/SurveyVerificationJson/" + this.selectedZone + "/";
    let date = this.commonService.setTodayDate();
    let time = new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1];
    let lastUpdate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time;
    this.verifiedDetail.lastUpdate = lastUpdate;
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerificationJson%2F" + this.selectedZone + "%2FLastUpdate.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(lastUpdateData => {
      fuelInstance.unsubscribe();
      if (lastUpdateData != null) {
        lastUpdateData["date"] = lastUpdate;
        this.commonService.saveJsonFile(lastUpdateData, fileName, filePath);
        this.showVerifiedCardsOnMap("0");
        $(this.divLoaderUpdate).hide();
      }
    }, error => {
      let date = this.commonService.setTodayDate();
      let time = new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1];
      let lastUpdate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time;
      const lastUpdateData = {
        date: lastUpdate
      }
      this.commonService.saveJsonFile(lastUpdateData, fileName, filePath);
      this.showVerifiedCardsOnMap("0");
    });
  }

  // update json data end
}

export class verifiedDetail {
  lastUpdate: string;
  greenCount: number;
  yellowCount: number;
  purpleCount: number;
  redCount: number;
}
