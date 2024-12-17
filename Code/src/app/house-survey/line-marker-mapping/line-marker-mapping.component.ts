import { AngularFireList } from 'angularfire2/database';
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
  selector: 'app-line-marker-mapping',
  templateUrl: './line-marker-mapping.component.html',
  styleUrls: ['./line-marker-mapping.component.scss']
})
export class LineMarkerMappingComponent {

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }

  public selectedZone: any;
  db: any;
  cityName: any;
  wardLines: any;
  activeZone: any;
  lineNo: any;
  previousLine: any;
  centerPoint: any;
  isFirst = true;
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  markerUrl = "../assets/img/red-home.png";
  cardMarkerUrl = "../assets/img/blue-home.png";
  selectedMarkerUrl = "../assets/img/green-home.png";
  zoneList: any[];
  polylines: any[];
  houseMarker: any[];
  lines: any[];
  markerList: any[];
  allMarkers: any[];
  selectedCardDetails: any[];
  toDayDate: any;
  wardBoundary: any;
  public movedMarkerCount: any;
  public totalMoveMarkerCount: any;

  cardDetails: CardDetails = {
    selectedMarkerCount: 0,
    totalMarkerOnLine: 0,
  };

  oldMarkerList: any[];
  newMarkerList: any[];
  plansRef: AngularFireList<any>;
  divLoader = "#divLoader";
  divLoaderMarkerMove = "#divLoaderMarkerMove";
  serviceName = "line-marker-mapping";

  ngOnInit() {
    this.toDayDate = this.commonService.setTodayDate();
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Survey-Management", "Line-Marker-Mapping", localStorage.getItem("userID"));
    this.movedMarkerCount = 0;
    this.totalMoveMarkerCount = 0;
    this.lineNo = 1;
    this.previousLine = 1;
    this.allMarkers = [];
    this.houseMarker = [];
    this.polylines = [];
    this.selectedCardDetails = [];
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
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  changeZoneSelection(filterVal: any) {
    this.cardDetails.selectedMarkerCount = 0;
    this.cardDetails.totalMarkerOnLine = 0;
    this.activeZone = filterVal;
    this.lineNo = 1;
    this.previousLine = 1;
    $("#txtLineNo").val(this.lineNo);
    $("#chk_wardLine").prop('checked', false);
    if (this.wardBoundary) {
      this.wardBoundary[0]["line"].setMap(null);
      this.wardBoundary = undefined;
    }
    this.loadData();
  }

  loadData() {
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 2000);
    this.clearAllOnMap();
    this.getAllLinesFromJson();
  }

  clearAllOnMap() {
    this.selectedZone = this.activeZone;
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
      this.allMarkers = [];
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    if (this.wardBoundary) {
      this.wardBoundary[0]["line"].setMap(null);
    }
    this.polylines = [];
    this.wardBoundary = undefined;
  }

  getAllLinesFromJson() {
    this.lines = [];
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
      this.wardLines = wardLines["totalLines"];
      let lineNo = 0;
      for (let i = 0; i < keyArray.length - 3; i++) {
        lineNo = Number(keyArray[i]);

        let points = wardLines[lineNo]["points"];
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
        }
        this.lines.push({
          lineNo: lineNo,
          latlng: latLng,
          color: "#87CEFA",
        });
        this.plotLineOnMap(lineNo, latLng, i, this.selectedZone);
      }
      this.getMarkedHouses(this.lineNo);
    });
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    if (wardNo == this.selectedZone) {
      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }
      let status = "";
      let strokeWeight = 2;
      let lineColor = "";
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
      let lat = latlng[0]["lat"];
      let lng = latlng[0]["lng"];
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
        icon: {
          url: this.invisibleImageUrl,
          fillOpacity: 1,
          strokeWeight: 0,
          scaledSize: new google.maps.Size(10, 10),
          origin: new google.maps.Point(0, 0),
        },
        label: {
          text: lineNo.toString(),
          color: "#000",
          fontSize: "12px",
          fontWeight: "bold",
        },
      });
      this.allMarkers.push({ marker });
      if (lineNo == this.lineNo) {
        let firstLine = this.lines.find((item) => item.lineNo == Number(lineNo));
        this.centerPoint = firstLine.latlng[0];
        if (this.isFirst == true) {
          this.map.setZoom(19);
          this.isFirst = false;
        }
        this.map.setCenter(this.centerPoint);
      }
    }
  }

  getMarkedHouses(lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMarkedHouses");
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
      this.houseMarker = [];
    }
    this.selectedCardDetails = [];
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMarkedHouses", data);
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (index != "ApproveStatus" && index != "marksCount") {
              if (data[index]["latLng"] != undefined) {
                let lat = data[index]["latLng"].split(",")[0];
                let lng = data[index]["latLng"].split(",")[1];
                this.setMarker(lat, lng, index, data[index]);
                this.cardDetails.totalMarkerOnLine = this.houseMarker.length;
              }
            }
          }
        }
      }
    });
  }

  setMarker(lat: any, lng: any, index: any, cardData: any) {
    let isSelected = false;
    let url = this.markerUrl;
    if (cardData["cardNumber"] != null) {
      url = this.cardMarkerUrl;
    }
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: url,
        fillOpacity: 1,
        strokeWeight: 0,
        // scaledSize: new google.maps.Size(27, 27),
        origin: new google.maps.Point(0, 0),
      },
    });
    this.houseMarker.push({ markerNo: index, marker: marker });
    marker.addListener("click", (e) => {
      let lineData = this.selectedCardDetails.find((item) => item.markerNo == index);
      if (lineData == undefined) {
        this.selectedCardDetails.push({
          lineNo: this.lineNo,
          markerNo: index,
          data: cardData
        });
        isSelected = true;
      } else {
        this.selectedCardDetails = this.selectedCardDetails.filter((item) => item !== lineData);
        isSelected = false;
      }
      this.setMarkerAsSelected(marker, isSelected, lineData);
      this.cardDetails.selectedMarkerCount = this.selectedCardDetails.length;
    });
  }

  setMarkerAsSelected(marker: any, isSelected: boolean, lineData: any) {
    if (isSelected) {
      marker.icon.url = "../assets/img/green-home.png";
    } else {
      let url = this.markerUrl;
      if (lineData != undefined) {
        if (lineData["data"]["cardNumber"] != null) {
          url = this.cardMarkerUrl;
        }
      }
      marker.icon.url = url;
    }
    marker.setMap(null);
    marker.setMap(this.map);
  }

  getLineData() {
    this.cardDetails.selectedMarkerCount = 0;
    this.cardDetails.totalMarkerOnLine = 0;
    // previousLine
    let firstLine = this.lines.find(
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
    this.lineNo = $("#txtLineNo").val();
    this.polylines[Number(this.lineNo) - 1].setMap(null);
    firstLine = this.lines.find((item) => item.lineNo == Number(this.lineNo));
    this.centerPoint = firstLine.latlng[0];
    line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor("requestedLine"),
      strokeWeight: 5,
    });
    this.polylines[Number(this.lineNo) - 1] = line;
    this.polylines[Number(this.lineNo) - 1].setMap(this.map);
    this.previousLine = this.lineNo;
    this.map.setCenter(this.centerPoint);
    this.getMarkedHouses(this.lineNo);
  }

  getCurrentLineNo(event: any) {
    if (event.key == "Enter") {
      if ($('#txtLineNo').val() != "") {
        if (isNaN(Number($('#txtLineNo').val()))) {
          this.commonService.setAlertMessage("error", "Please enter numeric value as line no !!!");
          return;
        }
        if (Number($('#txtLineNo').val()) < 1) {
          this.commonService.setAlertMessage("error", "Please enter line no more than 0 !!!");
          return;
        }

        this.lineNo = $('#txtLineNo').val();
        this.getLineData();
      }
    }
  }

  nextPrevious(type: any) {
    if (isNaN(Number($('#txtLineNo').val()))) {
      this.commonService.setAlertMessage("error", "Please enter numeric value as line no !!!");
      return;
    }
    if (Number($('#txtLineNo').val()) < 1) {
      this.commonService.setAlertMessage("error", "Please enter line no more than 0 !!!");
      return;
    }
    if (this.selectedZone == undefined || this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 1000);
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
        this.commonService.setAlertMessage(
          "error",
          "line number not less than 1 !!!"
        );
      }
    }
  }

  moveToNewLine() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "moveToNewLine");
    if ($("#txtNewLine").val() == "") {
      this.commonService.setAlertMessage("error", "Please enter line no.");
      return;
    }
    if (isNaN(Number($('#txtNewLine').val()))) {
      this.commonService.setAlertMessage("error", "Please enter numeric value as line no !!!");
      return;
    }
    if (Number($('#txtNewLine').val()) < 1) {
      this.commonService.setAlertMessage("error", "Please enter line no more than 0 !!!");
      return;
    }
    if (this.selectedCardDetails.length == 0) {
      this.commonService.setAlertMessage("error", "Please select atleast one card to move");
      return;
    }
    if (this.selectedCardDetails[0]["lineNo"] == $("#txtNewLine").val()) {
      this.commonService.setAlertMessage("error", "Sorry! cards can't be move on same line");
      return;
    }
    $(this.divLoaderMarkerMove).show();
    this.totalMoveMarkerCount = this.selectedCardDetails.length;
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + $("#txtNewLine").val() + "/lastMarkerKey";
    let lastMarkerInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastMarkerData => {
        lastMarkerInstance.unsubscribe();
        let lastKey = 0;
        let newLineNo = $("#txtNewLine").val();
        if (lastMarkerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", lastMarkerData);
          lastKey = Number(lastMarkerData);
        }
        this.moveData(0, lastKey, this.selectedZone, this.lineNo, this.selectedZone, newLineNo, 0);
      }
    );
  }

  moveData(index: any, lastKey: any, zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "moveData");
    if (index < this.selectedCardDetails.length) {
      lastKey = lastKey + 1;
      let markerNo = this.selectedCardDetails[index]["markerNo"];
      let data = this.selectedCardDetails[index]["data"];
      let oldImageName = data["image"];
      data["image"] = lastKey + ".jpg";
      let newImageName = lastKey + ".jpg";
      let city = this.commonService.getFireStoreCity();
      if (this.cityName == "sikar") {
        city = "Sikar-Survey";
      }
      const pathOld = city + "/MarkingSurveyImages/" + zoneFrom + "/" + lineFrom + "/" + oldImageName;
      const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
      ref.getDownloadURL()
        .then((url) => {
          var xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.onload = (event) => {
            var blob = xhr.response;
            const pathNew = city + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
            const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
            ref1.put(blob).then((promise) => {
              // ref.delete();
              this.movedMarkerCount = this.movedMarkerCount + 1;
              if (data["cardNumber"] != null) {
                let cardNo = data["cardNumber"];
                let dbPath = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
                let cardInstance = this.db.object(dbPath).valueChanges().subscribe(cardData => {
                  cardInstance.unsubscribe();
                  if (cardData != null) {
                    this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", cardData);
                    data["latLng"] = cardData["latLng"].toString().replace("(", "").replace(")", "");
                    cardData["line"] = lineTo;
                    cardData["ward"] = zoneTo;
                    let dbPath = "Houses/" + zoneTo + "/" + lineTo + "/" + cardNo;
                    this.db.object(dbPath).update(cardData);

                    dbPath = "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo;
                    this.db.object(dbPath).remove();

                    // modify card ward mapping
                    this.db.object("CardWardMapping/" + cardNo).set({ line: lineTo, ward: zoneTo });

                    if (cardData["mobile"] != "") {
                      // modify house ward mapping
                      this.db.object("HouseWardMapping/" + cardData["mobile"]).set({ line: lineTo, ward: zoneTo });
                    }
                  }
                });
              }
              if (data["revisitKey"] != null) {
                let revisitKey = data["revisitKey"];
                let dbPathPre = "EntitySurveyData/RevisitRequest/" + zoneFrom + "/" + lineFrom + "/" + revisitKey;
                let revisitInstance = this.db.object(dbPathPre).valueChanges().subscribe(revisitData => {
                  revisitInstance.unsubscribe();
                  if (revisitData != null) {
                    let dbPath = "EntitySurveyData/RevisitRequest/" + zoneTo + "/" + lineTo + "/" + revisitKey;
                    this.db.object(dbPath).update(revisitData);
                    this.db.object(dbPathPre).remove();
                  }
                });
              }

              let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
              this.db.object(dbPath).update(data);

              dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
              this.db.object(dbPath).remove();
              index = index + 1;
              this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);

            }).catch((error) => {
              index = index + 1;
              failureCount = failureCount + 1;
              this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
            });
          };
          xhr.open('GET', url);
          xhr.send();
        })
        .catch((error) => {
          index = index + 1;
          failureCount = failureCount + 1;
          this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
        });
    }
    else {
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
      this.db.object(dbPath).update({ lastMarkerKey: lastKey });
      this.updateCounts(zoneFrom, failureCount);
    }
  }

  updateCounts(zoneNo: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts");
    $(this.divLoaderMarkerMove).show();
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCounts", markerData);
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            let zoneMarkerCount = 0;
            let zoneAlreadyInstalledCount = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let markerCount = 0;
              let surveyedCount = 0;
              let revisitCount = 0;
              let rfIdNotFound = 0;
              let alreadyInstalledCount = 0;
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let lastMarkerKey = 0;
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                if (lineData[markerNo]["houseType"] != null) {
                  lastMarkerKey = Number(markerNo);
                  markerCount = markerCount + 1;
                  zoneMarkerCount = zoneMarkerCount + 1;
                  if (lineData[markerNo]["cardNumber"] != null) {
                    surveyedCount = surveyedCount + 1;
                  }
                  else if (lineData[markerNo]["revisitKey"] != null) {
                    revisitCount = revisitCount + 1;
                  }
                  else if (lineData[markerNo]["rfidNotFoundKey"] != null) {
                    rfIdNotFound = rfIdNotFound + 1;
                  }
                  if (lineData[markerNo]["alreadyInstalled"] == true) {
                    alreadyInstalledCount = alreadyInstalledCount + 1;
                    zoneAlreadyInstalledCount = zoneAlreadyInstalledCount + 1;
                  }
                }
              }
              let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
              this.db.object(dbPath).update({ marksCount: markerCount, surveyedCount: surveyedCount, lineRevisitCount: revisitCount, lineRfidNotFoundCount: rfIdNotFound, alreadyInstalledCount: alreadyInstalledCount })
              if (lastMarkerKey > 0) {
                let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
              }
            }
            let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo;
            this.db.object(dbPath).update({ alreadyInstalled: zoneAlreadyInstalledCount, marked: zoneMarkerCount });
          }
          this.selectedCardDetails = [];
          $("#txtNewLine").val("");
          this.getLineData();
          if (failureCount > 0) {
            let msg = failureCount + " markers have some issue to be processed, Please try again.";
            this.commonService.setAlertMessage("error", msg);
          }
          else {
            this.commonService.setAlertMessage("success", "Marker moved successfully !!!");
          }
          $(this.divLoaderMarkerMove).hide();
          this.movedMarkerCount = 0;
          this.totalMoveMarkerCount = 0;
        }
        else {
          this.selectedCardDetails = [];
          $("#txtNewLine").val("");
          this.getLineData();
          if (failureCount > 0) {
            let msg = failureCount + " markers have some issue to be processed, Please try again.";
            this.commonService.setAlertMessage("error", msg);
          }
          else {
            this.commonService.setAlertMessage("success", "Marker moved successfully !!!");
          }
          $(this.divLoaderMarkerMove).hide();
          this.movedMarkerCount = 0;
          this.totalMoveMarkerCount = 0;
        }
      });
  }
  showWardLine(checkBox: any) {
    if (checkBox.checked && this.selectedZone && this.selectedZone !== '0') {
      this.wardBoundary = undefined;
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
    else {
      checkBox.checked = false;
      if (!this.selectedZone) {
        this.commonService.setAlertMessage("error", "Please select ward !!!");
      }
      if (this.wardBoundary) {
        this.wardBoundary[0]["line"].setMap(null);
      }
      this.wardBoundary = undefined;
    }
  }
}

export class CardDetails {
  selectedMarkerCount: number;
  totalMarkerOnLine: number;
}
