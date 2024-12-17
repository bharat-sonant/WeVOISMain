/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FirebaseService } from "../../firebase.service";

//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import * as $ from "jquery";
import { ToastrService } from "ngx-toastr";
import { AngularFireStorage } from "angularfire2/storage";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-line-card-mapping",
  templateUrl: "./line-card-mapping.component.html",
  styleUrls: ["./line-card-mapping.component.scss"],
})
export class LineCardMappingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(private storage: AngularFireStorage, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }

  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  vehicleLocationFirstTime: any;
  polylines = [];
  toDayDate: any;
  previousScannedCard: any[];
  todayScannedCard: any[];
  allCards: any[];
  centerPoint: any;
  selectedCardDetails: any[];
  selectedCardCount = 0;
  markerList: any[] = [];
  isFirst = true;
  previousLine: any;
  db: any;
  cityName: any;
  wardBoundary:any;
  serviceName = "line-card-mapping";
  cardDetails: CardDetails = {
    mobile: "",
    address: "",
    cardNo: "",
    colonyName: "",
    createdDate: "",
    houseType: "",
    lat: "",
    line: "",
    lng: "",
    name: "",
    rfid: "",
    ward: "",
    surveyorId: "",
    selectedHouseCount: 0,
    totalCardOnLine: 0,
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Survey-Management","Line-Card-Mapping",localStorage.getItem("userID"));
    this.selectedCardDetails = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.setHeight();
    this.getZones();
    this.setMap();
  }

  setHeight() {
    setTimeout(() => {
      $(".navbar-toggler").show();
      $("#divMap").css("height", $(window).height() - 80);
    }, 2000);
  }

  setMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  changeZoneSelection(filterVal: any) {
    this.activeZone = filterVal;
    $("#txtLineNo").val("1");
    $("#chk_wardLine").prop('checked',false);
    if (this.wardBoundary) {
      this.wardBoundary[0]["line"].setMap(null);
    }
    this.loadData();
  }

  loadData() {
    this.isFirst = true;
    $("#txtNewLine").val("");
    this.cardDetails.totalCardOnLine = 0;
    this.selectedZone = this.activeZone;
    if (this.selectedZone == undefined || this.selectedZone == "0") {
      this.resetMap();
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    this.polylines = [];
    this.selectedCardDetails = [];
    this.setMap();
    this.getAllLinesFromJson();
    this.cardDetails.selectedHouseCount = 0;
    this.cardDetails.totalCardOnLine = 0;

  }

  nextPrevious(type: any) {
    if (this.selectedZone == undefined || this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    let currentLine = 1;
    let lineNo = this.previousLine;
    if (lineNo == "") {
      $("#txtLineNo").val(currentLine);
      this.getLineData();
    } else if (type == "next") {
      currentLine = Number(lineNo) + 1;
      $("#txtLineNo").val(currentLine);
      this.getLineData();
    } else {
      if (Number(lineNo) != 1) {
        currentLine = Number(lineNo) - 1;
        $("#txtLineNo").val(currentLine);
        this.getLineData();
      } else {
        this.commonService.setAlertMessage("error", "line number not less than 1 !!!");
      }
    }
  }

  moveToNewLine() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "moveToNewLine");

    if ($("#txtNewLine").val() == "") {
      this.commonService.setAlertMessage("error", "Please enter line no.");
      return;
    }
    if (this.selectedCardDetails.length == 0) {
      this.commonService.setAlertMessage("error", "Please select atleast one card to move");
      return;
    }
    if ($("#txtLineNo").val() == $("#txtNewLine").val()) {
      this.commonService.setAlertMessage("error", "Sorry! cards can't be move on same line");
      return;
    }
    let lineTo = $("#txtNewLine").val();
    let lineFrom = $('#txtLineNo').val();
    let lastMarkerKey = 1;
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineTo + "/lastMarkerKey";
    let lastMarkerKeyInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastMarkerKeyData => {
        lastMarkerKeyInstance.unsubscribe();
        if (lastMarkerKeyData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", lastMarkerKeyData);
          lastMarkerKey = Number(lastMarkerKeyData) + 1;
        }
        dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineFrom;
        let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
          markerData => {
            let markerList = [];
            markerInstance.unsubscribe();
            if (markerData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", markerData);
              let keyArray = Object.keys(markerData);
              for (let i = 0; i < keyArray.length; i++) {
                let markerNo = keyArray[i];
                if (markerData[markerNo]["cardNumber"] != null) {
                  markerList.push({ markerNo: markerNo, cardNumber: markerData[markerNo]["cardNumber"] });
                }
              }
            }
            this.moveHouseData(0, lineFrom, lineTo, lastMarkerKey, markerList);
          }
        );
      }
    )
  }

  moveHouseData(index: any, lineFrom: any, lineTo: any, lastMarkerKey: any, markerList: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "moveHouseData");
    if (index == this.selectedCardDetails.length) {
      let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineTo;
      this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
      this.commonService.setAlertMessage("success", "Card moved to Line " + lineTo + " successfully");
      $("#txtNewLine").val("");
      this.getLineData();
    }
    else {
      let cardNo = this.selectedCardDetails[index]["cardNo"];
      let data = this.selectedCardDetails[index]["data"];
      data["line"] = lineTo;
      let latLng = data["latLng"].toString().replace("(", "").replace(")", "");

      this.db.object("Houses/" + this.selectedZone + "/" + lineTo + "/" + cardNo).set(data);

      let path = "Houses/" + this.selectedZone + "/" + lineFrom + "/" + cardNo;
      this.db.object(path).remove();

      // modify card ward mapping
      this.db.object("CardWardMapping/" + data["cardNo"]).set({ line: lineTo, ward: this.selectedZone, });

      if (data["mobile"] != "") {
        // modify house ward mapping
        this.db.object("HouseWardMapping/" + data["mobile"]).set({ line: lineTo, ward: this.selectedZone, });
      }
      if (markerList.length != 0) {
        let detail = markerList.find(item => item.cardNumber == cardNo);
        if (detail != undefined) {
          let markerNo = detail.markerNo;
          let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineFrom + "/" + markerNo;
          let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
            markerData => {
              markerInstance.unsubscribe();
              if (markerData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveHouseData", markerData);
                let oldImageName = markerData["image"];
                markerData["image"] = lastMarkerKey + ".jpg";
                let newImageName = lastMarkerKey + ".jpg";
                markerData["latLng"] = latLng;
                let city = this.commonService.getFireStoreCity();
                if (this.cityName == "sikar") {
                  city = "Sikar-Survey";
                }
                const pathOld = city + "/MarkingSurveyImages/" + this.selectedZone + "/" + lineFrom + "/" + oldImageName;
                const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
                ref.getDownloadURL()
                  .then((url) => {
                    var xhr = new XMLHttpRequest();
                    xhr.responseType = 'blob';
                    xhr.onload = (event) => {
                      var blob = xhr.response;
                      const pathNew = city + "/MarkingSurveyImages/" + this.selectedZone + "/" + lineTo + "/" + newImageName;
                      const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
                      ref1.put(blob).then((promise) => {
                        // ref.delete();

                      }
                      ).catch((error) => {

                      });
                    };
                    xhr.open('GET', url);
                    xhr.send();
                  })
                  .catch((error) => {

                  });
                let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineTo + "/" + lastMarkerKey;
                this.db.object(dbPath).update(markerData);

                dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineFrom + "/" + markerNo;
                this.db.object(dbPath).remove();
                lastMarkerKey++;
                index++;
                this.moveHouseData(index, lineFrom, lineTo, lastMarkerKey, markerList);
              }
              else {
                lastMarkerKey++;
                index++;
                this.moveHouseData(index, lineFrom, lineTo, lastMarkerKey, markerList);
              }
            }
          );
        }
        else {
          lastMarkerKey++;
          index++;
          this.moveHouseData(index, lineFrom, lineTo, lastMarkerKey, markerList);
        }
      }
      else {
        lastMarkerKey++;
        index++;
        this.moveHouseData(index, lineFrom, lineTo, lastMarkerKey, markerList);
      }
    }
  }

  getAllLinesFromJson() {

    this.commonService.getWardLine(this.selectedZone, this.toDayDate).then((data: any) => {
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          if (this.polylines[i] != null) {
            this.polylines[i].setMap(null);
          }
        }
      }
      this.polylines = [];
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      let linePath = [];
      for (let i = 0; i < keyArray.length - 1; i++) {
        let lineNo = Number(keyArray[i]);
        try {
          let points = wardLines[lineNo]["points"];
          var latLng = [];
          for (let j = 0; j < points.length; j++) {
            latLng.push({ lat: points[j][0], lng: points[j][1] });
          }
          linePath.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA" });
        }
        catch { }
      }
      this.allLines = linePath;
      this.plotLineOnMap();
    });
  }

  plotLineOnMap() {
    this.cardDetails.selectedHouseCount = 0;
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
    let requestedLineNo = $("#txtLineNo").val();
    this.previousLine = requestedLineNo;
    for (let index = 0; index < this.allLines.length; index++) {
      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }
      let lineNo = index + 1;
      let lineData = this.allLines.find((item) => item.lineNo == lineNo);
      if (lineData != undefined) {
        let strokeWeight = 2;
        let status = "";
        if (lineNo == requestedLineNo) {
          strokeWeight = 5;
          status = "requestedLine";
        }

        let line = new google.maps.Polyline({
          path: lineData.latlng,
          strokeColor: this.commonService.getLineColor(status),
          strokeWeight: strokeWeight,
        });
        this.polylines[index] = line;
        this.polylines[index].setMap(this.map);
        this.setLineInfo(lineData, lineNo);
      }
    }

    setTimeout(() => {
      let lineNo = $("#txtLineNo").val();
      let firstLine = this.allLines.find(
        (item) => item.lineNo == Number(lineNo)
      );
      this.centerPoint = firstLine.latlng[0];
      if (this.isFirst == true) {
        this.map.setZoom(19);
        this.isFirst = false;
      }
      this.map.setCenter(this.centerPoint);
      this.showHouses(lineNo);
    }, 2000);
  }

  getLineData() {
    this.cardDetails.selectedHouseCount = 0;
    this.cardDetails.totalCardOnLine = 0;
    // previousLine
    let firstLine = this.allLines.find(
      (item) => item.lineNo == Number(this.previousLine)
    );
    this.polylines[Number(this.previousLine) - 1].setMap(null);
    let line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor(""),
      strokeWeight: 2,
    });
    this.polylines[Number(this.previousLine) - 1] = line;
    this.polylines[Number(this.previousLine) - 1].setMap(this.map);

    // new Line
    let lineNo = $("#txtLineNo").val();
    this.polylines[Number(lineNo) - 1].setMap(null);
    firstLine = this.allLines.find((item) => item.lineNo == Number(lineNo));
    this.centerPoint = firstLine.latlng[0];
    line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor("requestedLine"),
      strokeWeight: 5,
    });
    this.polylines[Number(lineNo) - 1] = line;
    this.polylines[Number(lineNo) - 1].setMap(this.map);
    this.previousLine = lineNo;
    this.map.setCenter(this.centerPoint);
    this.showHouses(lineNo);
  }

  showHouses(lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "showHouses");
    this.cardDetails.totalCardOnLine = 0;
    this.selectedCardDetails = [];
    let housePath = "Houses/" + this.selectedZone + "/" + lineNo;
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
    let housesData = this.db.object(housePath).valueChanges().subscribe((data) => {
      housesData.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "showHouses", data);
        var keyArray = Object.keys(data);
        for (let index = 0; index < keyArray.length; index++) {
          const cardNo = keyArray[index];
          let cardData = data[cardNo];
          if (cardData["latLng"] != undefined) {
            let latLng = cardData["latLng"].toString().replace("(", "").replace(")", "").split(",");
            let url = "../assets/img/red-home.png";
            if (cardData["phaseNo"] == "1") {
              url = "../assets/img/blue-home.png";
            }
            this.setMarkers(latLng[0], latLng[1], url, cardData, cardNo, lineNo);
          }
        }
      }
    });
  }

  setMarkers(lat: any, lng: any, url: any, cardData: any, cardNo: any, lineNo: any) {
    let isSelected = false;
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      icon: {
        url: url,
      },
    });

    marker.addListener("click", (e) => {
      let lineData = this.selectedCardDetails.find((item) => item.cardNo == cardNo);
      if (lineData == undefined) {
        this.selectedCardDetails.push({
          lineNo: lineNo,
          cardNo: cardNo,
          data: cardData
        });
        isSelected = true;
      } else {
        this.selectedCardDetails = this.selectedCardDetails.filter((item) => item !== lineData);
        isSelected = false;
      }
      this.setMarkerAsSelected(marker, isSelected);
      this.cardDetails.selectedHouseCount = this.selectedCardDetails.length;
    });
    marker.setMap(this.map);
    this.markerList.push({ marker });
    this.cardDetails.totalCardOnLine = this.markerList.length;
  }

  setMarkerAsSelected(marker: any, isSelected: boolean) {
    if (isSelected) {
      marker.icon.url = "../assets/img/green-home.png";
    } else {
      marker.icon.url = "../assets/img/red-home.png";
    }
    marker.setMap(null);
    marker.setMap(this.map);
  }

  setLineInfo(lineData: any, lineNo: any) {
    let statusString = '<div style="margin:10px;background-color: white;float: left;">';
    statusString += '<div style="width: 100%;text-align:center;font-size:13px;color:black;font-weight:bold">' + lineNo;
    statusString += "</div></div>";
    var infowindow = new google.maps.InfoWindow({
      content: statusString,
      position: lineData.latlng[0],
    });

    infowindow.open(this.map);

    setTimeout(function () {
      $(".gm-ui-hover-effect").css("display", "none");
      $(".gm-style-iw-c").css("border-radius", "3px").css("padding", "0px");
      $(".gm-style-iw-d").css("overflow", "unset");
    }, 1000);
  }
  showWardLine(checkBox:any){
    if(checkBox.checked && this.selectedZone){
      this.commonService.getWardBoundary(this.selectedZone, this.wardBoundary, 5).then((boundaryData: any) => {
        if (this.wardBoundary != undefined) {
          this.wardBoundary[0]["line"].setMap(null);
        }
        this.wardBoundary = boundaryData;
        this.wardBoundary[0]["line"].setMap(this.map);
        const bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < this.wardBoundary[0]["latLng"].length; i = (i + 5)) {
          bounds.extend({ lat: Number(this.wardBoundary[0]["latLng"][i]["lat"]), lng: Number(this.wardBoundary[0]["latLng"][i]["lng"]) });
        }
        this.map.fitBounds(bounds);
      });
    }
    else{
      checkBox.checked=false;
      if(!this.selectedZone){
        this.commonService.setAlertMessage("error", "Please select ward !!!");
      }
      if (this.wardBoundary) {
        this.wardBoundary[0]["line"].setMap(null);
      }
    }
  }
  resetMap=()=>{
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.wardBoundary[0]["line"].setMap(null);
    this.polylines = [];
  }
}

export class CardDetails {
  mobile: string;
  address: string;
  cardNo: string;
  colonyName: string;
  createdDate: string;
  houseType: string;
  lat: string;
  line: string;
  lng: string;
  name: string;
  rfid: string;
  ward: string;
  surveyorId: string;
  selectedHouseCount: number;
  totalCardOnLine: number;
}
