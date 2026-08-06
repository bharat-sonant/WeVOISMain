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
    this.zoneList = JSON.parse(localStorage.getItem("allZoneList"));
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


  markersDataCache: any = null;

  loadMarkersData(): Promise<any> {
    return new Promise((resolve) => {
      if (this.markersDataCache != null) {
        resolve(this.markersDataCache);
        return;
      }
      let markersInstance = this.db.object("EntityMarkingData/MarkersData").valueChanges().subscribe((data: any) => {
        markersInstance.unsubscribe();
        this.markersDataCache = data != null ? data : {};
        resolve(this.markersDataCache);
      });
    });
  }

  getNewPathLineData(wardNo: any, lineNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + wardNo + "/" + lineNo;
      let linkInstance = this.db.object(linkPath).valueChanges().subscribe((links: any) => {
        linkInstance.unsubscribe();
        if (links == null) {
          resolve(null);
          return;
        }
        this.loadMarkersData().then((markersData: any) => {
          let lineData = {};
          let keyArray = Object.keys(links);
          let found = 0;
          for (let i = 0; i < keyArray.length; i++) {
            let markerNo = keyArray[i];
            let uid = links[markerNo];
            if (uid == null || uid == "") {
              continue; // numeric keys ki wajah se aaye array-nulls skip
            }
            if (markersData[uid] == null) {
              continue;
            }
            lineData[markerNo] = markersData[uid];
            found++;
          }
          resolve(found > 0 ? lineData : null);
        });
      });
    });
  }

  getNewPathWardData(wardNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + wardNo;
      let linkInstance = this.db.object(linkPath).valueChanges().subscribe((wardLinks: any) => {
        linkInstance.unsubscribe();
        if (wardLinks == null) {
          resolve(null);
          return;
        }
        this.loadMarkersData().then((markersData: any) => {
          let wardData = {};
          let found = 0;
          let lineArray = Object.keys(wardLinks);
          for (let l = 0; l < lineArray.length; l++) {
            let lineNo = lineArray[l];
            let links = wardLinks[lineNo];
            if (links == null || typeof links != "object") {
              continue;
            }
            let lineData = {};
            let markerArray = Object.keys(links);
            for (let m = 0; m < markerArray.length; m++) {
              let markerNo = markerArray[m];
              let uid = links[markerNo];
              if (uid == null || uid == "") {
                continue; // numeric keys ki wajah se aaye array-nulls skip
              }
              if (markersData[uid] == null) {
                continue;
              }
              lineData[markerNo] = markersData[uid];
              found++;
            }
            if (Object.keys(lineData).length > 0) {
              wardData[lineNo] = lineData;
            }
          }
          resolve(found > 0 ? wardData : null);
        });
      });
    });
  }

  // Line-level scalars (counts, lastMarkerKey, ApproveStatus) ka new-path base.
  getLineSummaryPath(ward: any, line: any): string {
    return "EntityMarkingData/MarkersMapping/LineSummary/" + ward + "/" + line;
  }

  // Agla safe markerNo: LineSummary ka lastMarkerKey aur us line ki asli mapping keys, dono me se bada.
  getSafeLastKey(zoneTo: any, lineTo: any): Promise<any> {
    return new Promise((resolve) => {
      let summaryPath = this.getLineSummaryPath(zoneTo, lineTo) + "/lastMarkerKey";
      let sInst = this.db.object(summaryPath).valueChanges().subscribe((summaryVal: any) => {
        sInst.unsubscribe();
        let fromSummary = summaryVal != null ? Number(summaryVal) : 0;
        if (isNaN(fromSummary)) { fromSummary = 0; }

        let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + zoneTo + "/" + lineTo;
        let lInst = this.db.object(linkPath).valueChanges().subscribe((links: any) => {
          lInst.unsubscribe();
          let maxKey = 0;
          if (links != null) {
            let keyArray = Object.keys(links);
            for (let i = 0; i < keyArray.length; i++) {
              if (links[keyArray[i]] == null || links[keyArray[i]] == "") {
                continue; // numeric keys ki wajah se aaye array-nulls skip
              }
              let n = Number(keyArray[i]);
              if (!isNaN(n) && n > maxKey) { maxKey = n; }
            }
          }
          resolve(fromSummary > maxKey ? fromSummary : maxKey);
        });
      });
    });
  }

  // Old markerNo -> new uid (M{n}). Migrate na hua ho to null.
  getMarkerUid(ward: any, line: any, markerNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + ward + "/" + line + "/" + markerNo;
      let inst = this.db.object(linkPath).valueChanges().subscribe((uid: any) => {
        inst.unsubscribe();
        resolve(uid != null && uid != "" ? uid : null);
      });
    });
  }

  // Marker ko nayi line/ward par. Data global rehta hai, sirf mapping re-point hoti hai. OriginalToUid yahan NAHI chhuti, warna migration re-run par duplicate uid ban jaayega.
  moveMarkerOnNewPath(uid: any, zoneFrom: any, lineFrom: any, markerNoFrom: any, zoneTo: any, lineTo: any, newMarkerNo: any, data: any, extra: any = null) {
    this.markersDataCache = null; // write ke baad cache stale

    // Move history: marker kahan se kahan gaya, iska permanent record.
    this.writeMoveHistory(uid, zoneFrom, lineFrom, markerNoFrom, zoneTo, lineTo, newMarkerNo);

    // lineTo textbox se string ("7") ban kar aata hai, jabki marker-data-move ne
    // migration me line NUMBER (7) likhi thi. Number me convert kar ke likhte hain
    // taaki record aur mapping dono me line ka type ek jaisa rahe.
    let lineVal = isNaN(Number(lineTo)) ? lineTo : Number(lineTo);

    // Sirf badle hue fields likhte hain, poora record nahi. Old path par record nayi key par banta tha isliye poora likhna padta tha; yahan record apni hi jagah rehta hai.
    let patch: any = {
      line: (isNaN(Number(lineTo)) ? lineTo : Number(lineTo)),
      ward: zoneTo,
      movedFromWard: zoneFrom,
      movedFromLine: lineFrom,
      movedFromMarkerNo: markerNoFrom,
      movedOn: this.commonService.getTodayDateTime()
    };
    if (data["latLng"] != null) { patch["latLng"] = data["latLng"]; }
    if (extra != null) {
      let eKeys = Object.keys(extra);
      for (let e = 0; e < eKeys.length; e++) { patch[eKeys[e]] = extra[eKeys[e]]; }
    }
    // in-memory record bhi sync rakho, caller isi object ko aage use karta hai
    let pKeys = Object.keys(patch);
    for (let k = 0; k < pKeys.length; k++) { data[pKeys[k]] = patch[pKeys[k]]; }
    this.db.object("EntityMarkingData/MarkersData/" + uid).update(patch);

    // OldMarkerToNewUid: nayi jagah add, purani jagah se hata do
    this.db.object("EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + zoneTo + "/" + lineTo + "/" + newMarkerNo).set(uid);
    this.db.database.ref("EntityMarkingData/MarkersMapping/OldMarkerToNewUid/" + zoneFrom + "/" + lineFrom + "/" + markerNoFrom).set(null);

    // MarkerWise mapping
    this.db.object("EntityMarkingData/MarkersMapping/MarkerWise/" + uid).update({ line: lineVal, ward: zoneTo });

    // WardWise mapping: ward badla to purane ward se hata do
    if (zoneFrom != zoneTo) {
      this.db.database.ref("EntityMarkingData/MarkersMapping/WardWise/" + zoneFrom + "/" + uid).set(null);
    }
    this.db.object("EntityMarkingData/MarkersMapping/WardWise/" + zoneTo + "/" + uid).set(lineVal);
  }

  // Har move ka permanent record: MoveHistory/{uid}.
  writeMoveHistory(uid: any, zoneFrom: any, lineFrom: any, markerNoFrom: any, zoneTo: any, lineTo: any, newMarkerNo: any) {
    let entry = {
      fromWard: zoneFrom,
      fromLine: lineFrom,
      fromMarkerNo: markerNoFrom,
      toWard: zoneTo,
      toLine: lineTo,
      toMarkerNo: newMarkerNo,
      movedBy: localStorage.getItem("userID"),
      movedOn: this.commonService.getTodayDateTime()
    };
    this.db.list("EntityMarkingData/MarkerMovementData/MoveHistory/" + uid).push(entry);
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
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    // let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
    //   houseInstance.unsubscribe();
    // NEW PATH: MarkersData + OldMarkerToNewUid (same {markerNo: record} shape)
    this.getNewPathLineData(this.selectedZone, lineNo).then((data: any) => {
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
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + $("#txtNewLine").val() + "/lastMarkerKey";
    // let lastMarkerInstance = this.db.object(dbPath).valueChanges().subscribe(
    //   lastMarkerData => {
    //     lastMarkerInstance.unsubscribe();
    //     let lastKey = 0;
    //     let newLineNo = $("#txtNewLine").val();
    //     if (lastMarkerData != null) {
    //       this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", lastMarkerData);
    //       lastKey = Number(lastMarkerData);
    //     }
    let newLineNo = $("#txtNewLine").val();
    // NEW PATH: agla markerNo = LineSummary ka lastMarkerKey aur line ki asli mapping keys, dono me se bada.
    this.getSafeLastKey(this.selectedZone, newLineNo).then(
      (safeLastKey: any) => {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", safeLastKey);
        let lastKey = Number(safeLastKey);
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
      // OLD PATH (reference ke liye rakha hai):
      // data["image"] = lastKey + ".jpg";
      // let newImageName = lastKey + ".jpg";
      // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.
      let newImageName = data["imgRef"] != null ? data["imgRef"] : oldImageName;
      let city = this.commonService.getFireStoreCity();
      if (this.cityName == "sikar") {
        city = "Sikar-Survey";
      }
      let markerID = "";
      if (data["markerId"] != null) {
        markerID = this.commonService.getDefaultCardPrefix() + data["markerId"];
      }
      // OLD PATH (reference ke liye rakha hai):
      // if (this.cityName == "hisar") {
        // ref.delete();
      // NEW PATH: uid sabse pehle - warna marker migrate na hone par card/revisit move ho jaate aur marker peeche reh jaata.
      this.getMarkerUid(zoneFrom, lineFrom, markerNo).then((uid: any) => {
        if (uid == null) {
          // marker migrate nahi hua -> move skip, failure me gino
          index = index + 1;
          failureCount = failureCount + 1;
          this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
          return;
        }
        if (this.cityName == "hisar") {
        // OLD PATH (reference ke liye rakha hai):
        // const pathOld = city + "/MarkingSurveyImages/" + zoneFrom + "/" + lineFrom + "/" + oldImageName;
        // const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
        // ref.getDownloadURL()
        //   .then((url) => {
        //     var xhr = new XMLHttpRequest();
        //     xhr.responseType = 'blob';
        //     xhr.onload = (event) => {
        //       var blob = xhr.response;
        //       const pathNew = city + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
        //       const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
        //       ref1.put(blob).then((promise) => {
                // ref.delete();
        //       }
        //       ).catch((error) => {
        //       });
        //     };
        //     xhr.open('GET', url);
        //     xhr.send();
        //   })
        //   .catch((error) => {
        //   });
        this.movedMarkerCount = this.movedMarkerCount + 1;
        if (data["cardNumber"] != null) {
          let cardNo = data["cardNumber"];
          if (markerID != "") {
            markerID = cardNo;
          }
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

        // OLD PATH (reference ke liye rakha hai):
        // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
        // this.db.object(dbPath).update(data);
        // dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
        // this.db.object(dbPath).remove();
        // NEW PATH: mapping re-point karo (data global hi rehta hai)
        this.moveMarkerOnNewPath(uid, zoneFrom, lineFrom, markerNo, zoneTo, lineTo, lastKey, data);

        if (markerID != "") {
          // OLD PATH (reference ke liye rakha hai):
          // dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
          let dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
          let obj = {
            // OLD PATH (reference ke liye rakha hai):
            // image: lastKey + ".jpg",
            image: newImageName,
            line: lineTo.toString(),
            markerNo: lastKey.toString(),
            ward: zoneTo
          }
          this.db.object(dbPath).update(obj);
        }

        index = index + 1;
        this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
      }
      else {
        // OLD PATH (reference ke liye rakha hai):
        // const pathOld = city + "/MarkingSurveyImages/" + zoneFrom + "/" + lineFrom + "/" + oldImageName;
        // const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
        // ref.getDownloadURL()
        //   .then((url) => {
        //     var xhr = new XMLHttpRequest();
        //     xhr.responseType = 'blob';
        //     xhr.onload = (event) => {
        //       var blob = xhr.response;
        //       const pathNew = city + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
        //       const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
        //       ref1.put(blob).then((promise) => {
                // ref.delete();
        // New path me image global hai, isliye DB kaam ab seedha chalta hai (pehle image copy ke andar tha).
                this.movedMarkerCount = this.movedMarkerCount + 1;
                if (data["cardNumber"] != null) {
                  let cardNo = data["cardNumber"];
                  if (markerID != "") {
                    markerID = cardNo;
                  }
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

                // OLD PATH (reference ke liye rakha hai):
                // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastKey;
                // this.db.object(dbPath).update(data);
                // dbPath = "EntityMarkingData/MarkedHouses/" + zoneFrom + "/" + lineFrom + "/" + markerNo;
                // this.db.object(dbPath).remove();
                // NEW PATH: mapping re-point karo (data global hi rehta hai)
                this.moveMarkerOnNewPath(uid, zoneFrom, lineFrom, markerNo, zoneTo, lineTo, lastKey, data);

                if (markerID != "") {
                  // OLD PATH (reference ke liye rakha hai):
                  // dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
                  let dbPath = "EntityMarkingData/MarkerWardMapping/" + markerID;
                  let obj = {
                    // OLD PATH (reference ke liye rakha hai):
                    // image: lastKey + ".jpg",
                    image: newImageName,
                    line: lineTo.toString(),
                    markerNo: lastKey.toString(),
                    ward: zoneTo
                  }
                  this.db.object(dbPath).update(obj);
                }

                index = index + 1;
              // OLD PATH (reference ke liye rakha hai):
              //     }).catch((error) => {
              //       index = index + 1;
              //       failureCount = failureCount + 1;
              //       this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
              //     });
              //   };
              //   xhr.open('GET', url);
              //   xhr.send();
              // })
              // .catch((error) => {
              //   index = index + 1;
              //   failureCount = failureCount + 1;
              //   this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
              // });
                this.moveData(index, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, failureCount);
      }
      }); // getMarkerUid(...).then band
    }
    else {
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
      // NEW PATH: LineSummary
      let dbPath = this.getLineSummaryPath(zoneTo, lineTo);
      this.db.object(dbPath).update({ lastMarkerKey: lastKey });
      // NOTE: MarkersMapping/WardWise/{ward}/lastMarkerKey ko yahan JAAN-BOOJH KAR
      // nahi likha jaata. Wahan marker-data-move GLOBAL M-counter ka mirror rakhta
      // hai (M{n} ka n), jabki yahan wala lastKey line-level markerNo hai — likh
      // dete to ek chhota number global counter ke mirror ko kharab kar deta.
      this.updateCounts(zoneFrom, failureCount);
    }
  }

  // Jin lines par ab ek bhi marker nahi bacha unke counts zero. lastMarkerKey nahi chhedte, warna markerNo dobara use ho jaayenge.
  resetEmptyLineSummaries(zoneNo: any, markerData: any) {
    let summaryPath = "EntityMarkingData/MarkersMapping/LineSummary/" + zoneNo;
    let summaryInstance = this.db.object(summaryPath).valueChanges().subscribe(
      (summary: any) => {
        summaryInstance.unsubscribe();
        if (summary == null) {
          return;
        }
        let lineArray = Object.keys(summary);
        for (let i = 0; i < lineArray.length; i++) {
          let lineNo = lineArray[i];
          if (summary[lineNo] == null || typeof summary[lineNo] != "object") {
            continue; // ward-level scalars skip
          }
          if (markerData != null && markerData[lineNo] != null) {
            continue; // is line par markers hain -> neeche wala loop count karega
          }
          this.db.object(summaryPath + "/" + lineNo).update({
            marksCount: 0,
            surveyedCount: 0,
            lineRevisitCount: 0,
            lineRfidNotFoundCount: 0,
            alreadyInstalledCount: 0
          });
        }
      });
  }

  updateCounts(zoneNo: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts");
    $(this.divLoaderMarkerMove).show();
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
    //   markerData => {
    //     markerInstance.unsubscribe();
    // NEW PATH: MarkersData + OldMarkerToNewUid
    this.getNewPathWardData(zoneNo).then(
      (markerData: any) => {
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCounts", markerData);
          // Jis line ke SAARE markers move ho gaye, uska OldMarkerToNewUid node hi
          // khatam ho jaata hai — isliye wo line neeche wale loop me aati hi nahi
          // aur uske purane counts LineSummary par jyon ke tyon reh jaate hain
          this.resetEmptyLineSummaries(zoneNo, markerData);
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
              // OLD PATH (reference ke liye rakha hai):
              // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
              // NEW PATH: LineSummary
              let dbPath = this.getLineSummaryPath(zoneNo, lineNo);
              this.db.object(dbPath).update({ marksCount: markerCount, surveyedCount: surveyedCount, lineRevisitCount: revisitCount, lineRfidNotFoundCount: rfIdNotFound, alreadyInstalledCount: alreadyInstalledCount })
              if (lastMarkerKey > 0) {
                // OLD PATH (reference ke liye rakha hai):
                // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                // NEW PATH: LineSummary
                let dbPath = this.getLineSummaryPath(zoneNo, lineNo);
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
