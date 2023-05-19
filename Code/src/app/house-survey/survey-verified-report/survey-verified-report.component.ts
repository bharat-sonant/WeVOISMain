/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { AngularFireStorage } from "angularfire2/storage";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-survey-verified-report',
  templateUrl: './survey-verified-report.component.html',
  styleUrls: ['./survey-verified-report.component.scss']
})
export class SurveyVerifiedReportComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient, private storage: AngularFireStorage) { }
  db: any;
  selectedZone: any;
  zoneList: any;
  zoneKML: any;
  cityName: any;
  houseTypeList:any[];
  cardWardMappingList:any[];
  cardList: any[];
  cardMultipleList: any[];
  cardReverifiedList: any[];
  cardFilterList: any[];
  cardFinalList: any[];
  allMarkers: any[] = [];
  polylines = [];
  lines: any[] = [];
  toDayDate: any;
  divLoaderUpdate = "#divLoaderUpdate";
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  public totalVerifiedCount: any;
  public multipleCardsCount: any;
  public notVerifiedCardsCount: any;
  public notInHousesCardsCount: any;
  public notSameLineCardsCount: any;
  public reverifiedCardsCount: any;
  public imageURL: any;
  public entityType: any;
  public isVirtual: any;
  public imageHouseURL: any;

  txtCardNo = "#txtCardNo";
  ddlZone = "#ddlZone";
  chkDuplicate = "chkDuplicate";
  chkNotInZone = "chkNotInZone";
  chkNotVerified = "chkNotVerified";
  chkNotInLine = "chkNotInLine";
  chkReverified = "chkReverified";
  divCardDetail = "#divCardDetail";
  rowDataList: any;
  markerList: any[] = [];
  public isShowFilter: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.imageURL = "../../../assets/img/system-generated-image.jpg";
    this.imageHouseURL = "../../../assets/img/system-generated-image.jpg";
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedZone = 0;
    this.totalVerifiedCount = 0;
    this.multipleCardsCount = 0;
    this.notVerifiedCardsCount = 0;
    this.notInHousesCardsCount = 0;
    this.notSameLineCardsCount = 0;
    this.reverifiedCardsCount = 0;
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.isShowFilter = false;    
    this.getCardWardMappingJSON()
    this.getHouseType();
    this.getZones();
  }

  getCardWardMappingJSON(){
    this.cardWardMappingList=[];
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerificationJson%2FCardWardMapping.json?alt=media";
    let cardWardInstance = this.httpService.get(path).subscribe(data => {
      cardWardInstance.unsubscribe();
      if (data != null) {
        this.cardWardMappingList=JSON.parse(JSON.stringify(data));
      }
    });
  }

  

  getHouseType() {
    this.houseTypeList=[];
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

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    $(this.divLoaderUpdate).show();
    this.imageURL = "../../../assets/img/system-generated-image.jpg";
    this.imageHouseURL = "../../../assets/img/system-generated-image.jpg";
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
    this.selectedZone = filterVal;
    this.isShowFilter = false;
    this.isVirtual = "";
    this.entityType = "";
    $(this.divCardDetail).hide();
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
      this.getAllLinesFromJson();
      this.getCardList();
    });
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
      let wardLineCount = wardLines["totalLines"];
      for (let i = 0; i <= wardLineCount; i++) {
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

  getCardList() {
    this.cardList = [];
    this.cardMultipleList = [];
    this.cardFinalList = [];
    this.cardFilterList = [];
    this.cardReverifiedList=[];
    this.totalVerifiedCount = 0;
    this.multipleCardsCount = 0;
    this.notVerifiedCardsCount = 0;
    this.notInHousesCardsCount = 0;
    this.notSameLineCardsCount = 0;
    this.reverifiedCardsCount = 0;

    (<HTMLInputElement>document.getElementById(this.chkDuplicate)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotInZone)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotVerified)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotInLine)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkReverified)).checked = false;
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
        let notInSameLine = 0;
        if (list[i]["color"] == "red") {
          notInZone = 1;
        }
        if (list[i]["color"] == "purple") {
          notVerified = 1;
        }
        if (list[i]["color"] == "yellow") {
          notInSameLine = 1;
        }
        //let detail = this.cardList.find(item => item.cardNo == list[i]["cardNo"]);
        // if (detail == undefined) {
        let verifyLineNoList = [];
        verifyLineNoList.push({ lineNo: list[i]["verifiedLineNo"], latLng: list[i]["latLng"], color: list[i]["color"] });
        this.cardList.push({ cardNo: list[i]["cardNo"], color: list[i]["color"], houseLineNo: list[i]["houseLineNo"], lineNo: list[i]["verifiedLineNo"], latLng: list[i]["latLng"], entityType: list[i]["entityType"], isVirtual: list[i]["isVirtual"], verifyLineNoList: verifyLineNoList, count: 1, notInZone: notInZone, notVerified: notVerified, notInSameLine: notInSameLine });
        // }
        // else {
        //   detail.verifyLineNoList.push({ lineNo: list[i]["verifiedLineNo"], latLng: list[i]["latLng"], color: list[i]["color"] });
        //   detail.count = detail.count + 1;
        // }
      }
      this.multipleCardsCount = (this.cardList.filter(item => item.count > 1).length);
      this.notVerifiedCardsCount = (this.cardList.filter(item => item.color == "purple").length);
      this.notInHousesCardsCount = (this.cardList.filter(item => item.color == "red").length);
      this.notSameLineCardsCount = (this.cardList.filter(item => item.color == "yellow").length);
      this.totalVerifiedCount = this.cardList.filter(item => item.color != "purple").length;
      this.cardFilterList = this.cardList;
      this.cardFinalList = this.cardFilterList.slice(0, this.rowDataList);
      this.getMultipleCards();
    }, error => {
      $(this.divLoaderUpdate).hide();
      this.commonService.setAlertMessage("error", "Data not found. Please update from Survey Verfication !!!")
    });
  }

  getMultipleCards() {
    let duplicatList = [];
    for (let i = 0; i < this.cardList.length; i++) {
      let detail = duplicatList.find(item => item.cardNo == this.cardList[i]["cardNo"]);
      if (detail == undefined) {
        duplicatList.push({ cardNo: this.cardList[i]["cardNo"], count: 1 });
        duplicatList = this.commonService.transformString(duplicatList, "cardNo");
      }
      else {
        detail.count++;
      }
    }

    let list = duplicatList.filter(item => item.count > 1);
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < this.cardList.length; j++) {
        if (list[i]["cardNo"] == this.cardList[j]["cardNo"]) {
          let detail = this.cardMultipleList.find(item => item.cardNo == list[i]["cardNo"]);
          if (detail == undefined) {

            this.cardMultipleList.push({ cardNo: this.cardList[j]["cardNo"], color: this.cardList[j]["color"], houseLineNo: this.cardList[j]["houseLineNo"], lineNo: this.cardList[j]["lineNo"], latLng: this.cardList[j]["latLng"], verifyLineNoList: this.cardList[j]["verifyLineNoList"], notInZone: this.cardList[j]["notInZone"], notVerified: this.cardList[j]["notVerified"], notInSameLine: this.cardList[j]["notInSameLine"], count: 1 });
          }
          else {
            detail.lineNo = detail.lineNo + ", " + this.cardList[j]["lineNo"];
            detail.verifyLineNoList.push({ lineNo: this.cardList[j]["lineNo"], latLng: this.cardList[j]["latLng"], color: this.cardList[j]["color"] });
          }
        }
      }
    }
    this.multipleCardsCount = list.length;
    this.getReverifiedCards();
  }

  getReverifiedCards() {
    let dbPath = "SurveyVerifierData/HousesByVerifier/" + this.selectedZone;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            let lineData = data[lineNo];
            let lineArray = Object.keys(lineData);
            for (let j = 0; j < lineArray.length; j++) {
              let cardNo = lineArray[j];
              let houseLineNo="";
              let cardWardDetail=this.cardWardMappingList.find(item=>item.cardNo==cardNo);
              if(cardWardDetail!=undefined){
                houseLineNo="Zone "+cardWardDetail.ward+"  Line No "+cardWardDetail.line;
              }
              let entityType="";
              let detail=this.houseTypeList.find(item=>item.id==lineData[cardNo]["houseType"]);
              if(detail!=undefined){
                entityType=detail.houseType;
              }
              let imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerifierData%2FHousesByVerifierCardImage%2F" + lineData[cardNo]["cardImage"] + "?alt=media";
              let imageHouseURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerifierData%2FHousesByVerifierHouseImage%2F" + lineData[cardNo]["houseImage"] + "?alt=media";
              
              let verifyLineNoList = [];
              verifyLineNoList.push({ lineNo: lineNo, latLng: lineData[cardNo]["latLng"].replace("(", "").replace(")", ""), color: "green" });
              this.cardReverifiedList.push({ cardNo: cardNo, color: "", houseLineNo: houseLineNo, lineNo: lineNo, latLng: lineData[cardNo]["latLng"].replace("(", "").replace(")", ""), entityType: entityType,imageURL:imageURL,imageHouseURL:imageHouseURL, isVirtual: "", verifyLineNoList: verifyLineNoList });
            }
          }
        }
        this.reverifiedCardsCount = this.cardReverifiedList.length;
        $(this.divLoaderUpdate).hide();
      }
    );
  }

  onContainerScroll() {
    let element = <HTMLElement>document.getElementById("divList");
    if ((element.offsetHeight + element.scrollTop + 10) >= element.scrollHeight) {
      this.rowDataList = this.rowDataList + 100;
      this.cardFinalList = this.cardFilterList.slice(0, this.rowDataList);
    }
  }


  showMarkerOnMap(latLng: any, color: any, cardNo: any, entityType: any, isVirtual: any,verifyLineNoList:any) {
    if ((<HTMLInputElement>document.getElementById(this.chkNotVerified)).checked == true) {
    this.imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyCardImage%2F" + cardNo + ".jpg?alt=media";
    this.imageHouseURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyHouseImage%2F" + cardNo + "House.jpg?alt=media";
    }
    else{
      this.imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerifierData%2FHousesByVerifierCardImage%2F" + cardNo + ".jpg?alt=media";
    this.imageHouseURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerifierData%2FHousesByVerifierHouseImage%2F" + cardNo + "House.jpg?alt=media";
   
    }
    this.entityType = entityType;
    this.isVirtual = isVirtual;
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
    if (verifyLineNoList.length > 0) {
      for (let i = 0; i < verifyLineNoList.length; i++) {
        let lat = verifyLineNoList[i]["latLng"].split(',')[0];
        let lng = verifyLineNoList[i]["latLng"].split(',')[1];
        let markerURL = this.getMarkerIcon(verifyLineNoList[i]["color"]);
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
        this.markerList.push({ marker: marker });
      }
    }
  }
  /*
    showMarkerOnMap(verifyLineNoList: any[]) {
      if (this.markerList.length > 0) {
        for (let i = 0; i < this.markerList.length; i++) {
          this.markerList[i]["marker"].setMap(null);
        }
      }
      this.markerList = [];
      if (verifyLineNoList.length > 0) {
        for (let i = 0; i < verifyLineNoList.length; i++) {
          let lat = verifyLineNoList[i]["latLng"].split(',')[0];
          let lng = verifyLineNoList[i]["latLng"].split(',')[1];
          let markerURL = this.getMarkerIcon(verifyLineNoList[i]["color"]);
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
          this.markerList.push({ marker: marker });
        }
      }
    }
  */
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
    $(this.divCardDetail).hide();
    this.imageURL = "../../../assets/img/system-generated-image.jpg";
    this.imageHouseURL = "../../../assets/img/system-generated-image.jpg";
    this.isVirtual = "";
    this.entityType = "";
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
    let element = <HTMLElement>document.getElementById("divList");
    element.scrollTop = 0;
    this.rowDataList = 100;
    let cardNo = $(this.txtCardNo).val();
    this.isShowFilter = false;
    let list = this.cardList;
    if ((<HTMLInputElement>document.getElementById(this.chkDuplicate)).checked == true) {
      list = this.cardMultipleList;
      this.isShowFilter = true;
    }
    if ((<HTMLInputElement>document.getElementById(this.chkReverified)).checked == true) {
      list = this.cardReverifiedList;
      this.isShowFilter = true;
      $(this.divCardDetail).show();
    }
    if ((<HTMLInputElement>document.getElementById(this.chkNotInZone)).checked == true) {
      list = list.filter(item => item.notInZone == 1);
      this.isShowFilter = true;
    }
    if ((<HTMLInputElement>document.getElementById(this.chkNotVerified)).checked == true) {
      list = list.filter(item => item.notVerified == 1);
      this.isShowFilter = true;
      $(this.divCardDetail).show();
    }
    if ((<HTMLInputElement>document.getElementById(this.chkNotInLine)).checked == true) {
      list = list.filter(item => item.notInSameLine == 1);
      this.isShowFilter = true;
    }
    if (cardNo != "") {
      list = list.filter(item => item.cardNo.toString().toUpperCase().includes(cardNo.toString().toUpperCase()));
    }
    this.cardFilterList = list;
    this.cardFinalList = this.cardFilterList.slice(0, this.rowDataList);
  }

  exportList(type: any) {
    let list = [];
    if (type == "all") {
      list = this.cardList;
    }
    else {
      list = this.cardFilterList;
    }
    if (list.length > 0) {
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
      for (let i = 0; i < list.length; i++) {
        /*
        let verifyLineNoList = list[i]["verifyLineNoList"];
        let lineNos = "";
        for (let j = 0; j < verifyLineNoList.length; j++) {
          if (lineNos == "") {
            lineNos = verifyLineNoList[j]["lineNo"];
          }
          else {
            lineNos += ", " + verifyLineNoList[j]["lineNo"];
          }
        }
        */
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["cardNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["lineNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += list[i]["houseLineNo"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Zone-" + this.selectedZone + "-VerifiedCards.xlsx";
      this.commonService.exportExcel(htmlString, fileName);

    }
  }
}
