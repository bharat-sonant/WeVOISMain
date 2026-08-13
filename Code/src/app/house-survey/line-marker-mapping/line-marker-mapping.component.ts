import { AngularFireList } from 'angularfire2/database';
/// <reference types="@types/googlemaps" />

import { Component, OnDestroy, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FirebaseService } from "../../firebase.service";

//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import * as $ from "jquery";
import { ToastrService } from "ngx-toastr";
import { AngularFireStorage } from "angularfire2/storage";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { MoveHelperService, MoveRun } from '../../services/common/move-helper.service';
import { MarkerMoveRow, MarkerMoveSummary } from '../../PortalServices/marker-move-progress/marker-move-progress.component';
import { MarkerMappingService } from '../../services/marker/marker-mapping.service';

@Component({
  selector: 'app-line-marker-mapping',
  templateUrl: './line-marker-mapping.component.html',
  styleUrls: ['./line-marker-mapping.component.scss']
})
export class LineMarkerMappingComponent implements OnDestroy {

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService, public moveHelper: MoveHelperService, private modalService: NgbModal, private markerMapping: MarkerMappingService) { }

  // ---- move progress state ----
  pageName = "Line-Marker-Mapping";
  historySection = "SurveyManagement";
  historyPageKey = "LineMarkerMapping";
  @ViewChild("moveProgressModal", { static: false }) moveProgressModal: any;
  @ViewChild("historyModal", { static: false }) historyModal: any;
  private moveModalRef: any = null;
  private historyModalRef: any = null;
  moveRows: MarkerMoveRow[] = [];
  moveSummary: MarkerMoveSummary = this.getEmptySummary();
  moveRunning = false;
  private cancelRequested = false;
  private moveContext: any = null;
  private networkInterrupted = false;

  /** MoveHelperService ko cancel/network state batata hai */
  private run: MoveRun = {
    isCancelled: () => this.cancelRequested,
    setWaitingForNetwork: (waiting: boolean) => {
      this.moveSummary.waitingForNetwork = waiting;
      if (waiting) { this.networkInterrupted = true; }
    }
  };

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
    this.moveHelper.watchConnection(this.db);
  }

  ngOnDestroy() {
    this.cancelRequested = true;
    this.moveHelper.stopWatchingConnection();
    if (this.moveModalRef != null) { this.moveModalRef.dismiss(); this.moveModalRef = null; }
    if (this.historyModalRef != null) { this.historyModalRef.dismiss(); this.historyModalRef = null; }
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

  // =====================================================================
  // NEW PATH helpers (MarkersData + MarkersMapping)
  //
  // Old path me line ka poora data ek node me tha - MarkedHouses/{ward}/{line}.
  // Ab record MarkersData/{uid} par hai aur "is line par kaun sa marker kis
  // number par hai" LineWise batata hai. Ye helpers wahi purani
  // {markerNo: record} shape lauta dete hain, isliye baaki page ka code
  // waisa ka waisa chalta rehta hai.
  //
  // Reads moveHelper.readOnce se hote hain - usme timeout aur cleanup
  // dono handle hain.
  // =====================================================================

  markersDataCache: any = null;

  private loadMarkersData(): Promise<any> {
    if (this.markersDataCache != null) {
      return Promise.resolve(this.markersDataCache);
    }
    return this.moveHelper.readOnce(this.db, "EntityMarkingData/MarkersData").then((data: any) => {
      this.markersDataCache = data != null ? data : {};
      return this.markersDataCache;
    });
  }

  // Ek line ka data, old path jaisi shape me. Jis uid ka record na mile use
  // chhod dete hain - mapping bachi ho par record na ho to marker hai hi nahi.
  getNewPathLineData(wardNo: any, lineNo: any): Promise<any> {
    let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + wardNo + "/" + lineNo;
    return this.moveHelper.readOnce(this.db, linkPath).then((links: any) => {
      if (links == null) {
        return null;
      }
      return this.loadMarkersData().then((markersData: any) => {
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
        return found > 0 ? lineData : null;
      });
    });
  }

  // Poore ward ka data, {line: {markerNo: record}} shape me.
  getNewPathWardData(wardNo: any): Promise<any> {
    let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + wardNo;
    return this.moveHelper.readOnce(this.db, linkPath).then((wardLinks: any) => {
      if (wardLinks == null) {
        return null;
      }
      return this.loadMarkersData().then((markersData: any) => {
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
              continue;
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
        return found > 0 ? wardData : null;
      });
    });
  }

  // Marker ka uid (M{n}) us line par uske number se. Na mile to null.
  getMarkerUid(ward: any, line: any, markerNo: any): Promise<any> {
    let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + ward + "/" + line + "/" + markerNo;
    return this.moveHelper.readOnce(this.db, linkPath).then((uid: any) => {
      return (uid != null && uid != "") ? uid : null;
    });
  }

  // Target line ka agla safe markerNo.
  //
  // Sirf LineSummary ka lastMarkerKey dekhna kaafi nahi - wo peeche reh sakta
  // hai (jaise koi marker move hokar is line par aa gaya ho). Aise me naye
  // marker ko wahi number mil jaata jo pehle se kisi ke paas hai, aur LineWise
  // me ek key par doosra uid chadh kar purana marker portal se gayab kar deta.
  // Isliye summary aur line ki asli sabse badi key, dono me se bada lete hain.
  getSafeLastKey(ward: any, line: any): Promise<any> {
    let summaryPath = "EntityMarkingData/MarkersMapping/LineSummary/" + ward + "/" + line + "/lastMarkerKey";
    let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + ward + "/" + line;
    return this.moveHelper.readOnce(this.db, summaryPath).then((summaryVal: any) => {
      let fromSummary = summaryVal != null ? Number(summaryVal) : 0;
      if (isNaN(fromSummary)) { fromSummary = 0; }
      return this.moveHelper.readOnce(this.db, linkPath).then((links: any) => {
        let maxKey = 0;
        if (links != null) {
          let keyArray = Object.keys(links);
          for (let i = 0; i < keyArray.length; i++) {
            if (links[keyArray[i]] == null || links[keyArray[i]] == "") {
              continue;
            }
            let n = Number(keyArray[i]);
            if (!isNaN(n) && n > maxKey) { maxKey = n; }
          }
        }
        return fromSummary > maxKey ? fromSummary : maxKey;
      });
    });
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
    // OLD PATH: MarkedHouses/{ward}/{line} - marker aur line ke scalars ek hi
    // node me the. NEW PATH: record MarkersData/{uid} par hai aur line par kaun
    // sa marker kis number par hai ye LineWise batata hai. Shape wahi
    // {markerNo: record} milti hai, isliye neeche ka code jaisa tha waisa hai.
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
    // Pehle check, phir hi kuch badlo. Line data poori load hone se pehle
    // line change karne par purana code beech me crash ho jata tha - header
    // ka box nayi line dikhata tha lekin map aur this.lineNo purani line par
    // hi atke reh jate the. Us stale this.lineNo ki wajah se move par
    // "cards can't be move on same line" ka galat error aata tha.
    let requestedLine = $("#txtLineNo").val();
    let newLine = this.lines.find((item) => item.lineNo == Number(requestedLine));
    if (newLine == undefined) {
      // previousLine hamesha wahi line hai jo map par draw ho chuki hai -
      // box aur lineNo dono ko usi par wapas le aao
      this.lineNo = this.previousLine;
      $("#txtLineNo").val(this.previousLine);
      this.commonService.setAlertMessage("error", "इस line का data अभी नहीं मिला, थोड़ी देर बाद try करें !!!");
      return;
    }

    this.cardDetails.selectedMarkerCount = 0;
    this.cardDetails.totalMarkerOnLine = 0;
    // previousLine
    let oldIndex = Number(this.previousLine) - 1;
    let firstLine = this.lines.find(
      (item) => item.lineNo == Number(this.previousLine)
    );
    if (firstLine != undefined && this.polylines[oldIndex] != undefined) {
      this.polylines[oldIndex].setMap(null);
      let oldLine = new google.maps.Polyline({
        path: firstLine.latlng,
        strokeColor: this.commonService.getLineColor(""),
        strokeWeight: 2,
      });
      this.polylines[oldIndex] = oldLine;
      this.polylines[oldIndex].setMap(this.map);
    }

    // new Line
    this.lineNo = requestedLine;
    let newIndex = Number(this.lineNo) - 1;
    if (this.polylines[newIndex] != undefined) {
      this.polylines[newIndex].setMap(null);
    }
    this.centerPoint = newLine.latlng[0];
    let line = new google.maps.Polyline({
      path: newLine.latlng,
      strokeColor: this.commonService.getLineColor("requestedLine"),
      strokeWeight: 5,
    });
    this.polylines[newIndex] = line;
    this.polylines[newIndex].setMap(this.map);
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

  // =====================================================================
  // MOVE PROGRESS / HISTORY POPUP
  // =====================================================================

  private openMoveModal() {
    if (this.moveModalRef != null) { return; }
    // move ke dauraan backdrop / ESC se band na ho
    this.moveModalRef = this.modalService.open(this.moveProgressModal, {
      size: "lg", backdrop: "static", keyboard: false, windowClass: "marker-move-modal"
    });
    this.moveModalRef.result.then(() => { this.moveModalRef = null; }, () => { this.moveModalRef = null; });
  }

  closeMoveModal() {
    if (this.moveRunning) { return; }
    if (this.moveModalRef != null) { this.moveModalRef.close(); this.moveModalRef = null; }
  }

  openHistoryModal() {
    if (!this.moveHelper.canViewActionHistory() || this.historyModalRef != null) { return; }
    this.historyModalRef = this.modalService.open(this.historyModal, { size: "lg", windowClass: "action-history-modal" });
    this.historyModalRef.result.then(() => { this.historyModalRef = null; }, () => { this.historyModalRef = null; });
  }

  closeHistoryModal() {
    if (this.historyModalRef != null) { this.historyModalRef.close(); this.historyModalRef = null; }
  }

  private getEmptySummary(): MarkerMoveSummary {
    return {
      running: false, waitingForNetwork: false, statusText: "",
      fromZone: "", fromLine: "", toZone: "", toLine: "", backupFile: "",
      total: 0, moved: 0, failed: 0, pending: 0, imageMissing: 0
    };
  }

  // =====================================================================
  // MOVE SELECTED MARKERS TO NEW LINE
  // =====================================================================

  async moveToNewLine() {
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

    let lineTo = $("#txtNewLine").val();
    let lineFrom = this.lineNo;
    // selection ki copy - move ke dauraan user map par kuch aur select kar de
    // to chal raha move usse prabhavit na ho
    let selection = this.selectedCardDetails.slice();

    await this.startMove(lineFrom, lineTo, selection, null);
  }

  /**
   * onlyMarkerNos = null  -> selected sabhi markers
   * onlyMarkerNos = [...] -> sirf pehle fail hue markers ka retry
   */
  private async startMove(lineFrom: any, lineTo: any, selection: any[], onlyMarkerNos: string[]) {
    if (this.moveRunning) {
      this.commonService.setAlertMessage("error", "एक move पहले से चल रहा है !!!");
      return;
    }

    let zone = this.selectedZone;
    this.cancelRequested = false;
    this.moveRunning = true;
    this.moveRows = [];
    this.moveSummary = this.getEmptySummary();
    this.moveSummary.running = true;
    this.moveSummary.fromZone = zone;
    this.moveSummary.fromLine = lineFrom;
    this.moveSummary.toZone = zone;
    this.moveSummary.toLine = lineTo;
    this.openMoveModal();

    let action = (onlyMarkerNos != null) ? "RetryFailed" : "MoveSelectedMarkers";
    let startTime = new Date();
    let originalLastKey: any = null;
    this.networkInterrupted = false;

    try {
      this.moveSummary.statusText = "डेटा पढ़ा जा रहा है...";
      await this.moveHelper.waitForNetwork(this.run);

      let markerList = [];
      for (let i = 0; i < selection.length; i++) {
        let markerNo = "" + selection[i]["markerNo"];
        if (onlyMarkerNos != null && onlyMarkerNos.indexOf(markerNo) < 0) { continue; }
        markerList.push(selection[i]);
      }
      if (markerList.length == 0) {
        this.commonService.setAlertMessage("error", "move करने लायक कोई marker नहीं मिला।");
        await this.saveMoveHistory(action, "aborted", startTime, zone, lineFrom, lineTo, null, "move karne layak koi marker nahi mila");
        this.finishRun();
        return;
      }

      // NEW PATH: lastMarkerKey LineSummary par hai. Sirf usi par bharosa nahi
      // karte - getSafeLastKey line ki asli sabse badi key bhi dekh leta hai,
      // warna naye marker ko wahi number mil sakta hai jo pehle se kisi ke paas
      // ho aur LineWise me purana marker dab jaaye.
      let lastKey = Number(await this.getSafeLastKey(zone, lineTo));
      if (isNaN(lastKey)) { lastKey = 0; }
      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", lastKey);
      originalLastKey = lastKey;

      // Backup ke liye source line ka poora data (new path se, purani shape me).
      let markerNodeData = await this.getNewPathLineData(zone, lineFrom);
      let houseData = await this.moveHelper.readOnceWithRetry(this.db, "Houses/" + zone + "/" + lineFrom, this.run);

      // ---------- backup pehle, uske baad hi move ----------
      this.moveSummary.statusText = "Backup सेव हो रहा है...";
      let now = new Date();
      let filePath = this.moveHelper.buildBackupFilePath(this.pageName, now);
      let fileName = this.moveHelper.buildBackupFileName(zone, lineFrom, zone, lineTo, (onlyMarkerNos != null ? "_retry" : ""), now);
      let backupData = this.buildBackupData(markerNodeData, houseData, markerList, lastKey, zone, lineFrom, lineTo, now);

      try {
        await this.moveHelper.saveBackupWithRetry(backupData, fileName, filePath, this.run);
      } catch (e) {
        let reason = (e && e.message) ? e.message : e;
        this.commonService.setAlertMessage("error", "Backup सेव नहीं हो पाया, move रद्द कर दिया गया। (" + reason + ")");
        this.moveSummary.statusText = "Backup फेल हुआ - move शुरू ही नहीं हुआ। डेटाबेस में कुछ नहीं बदला।";
        await this.saveMoveHistory(action, "aborted", startTime, zone, lineFrom, lineTo, originalLastKey, "backup fail: " + reason);
        this.finishRun();
        return;
      }
      this.moveSummary.backupFile = filePath + fileName;

      this.moveRows = this.buildRows(markerList, zone, lineFrom, lineTo);
      this.moveSummary.total = this.moveRows.length;
      this.moveSummary.pending = this.moveRows.length;
      this.totalMoveMarkerCount = this.moveRows.length;
      this.movedMarkerCount = 0;

      let dataByMarkerNo = {};
      for (let i = 0; i < markerList.length; i++) {
        dataByMarkerNo["" + markerList[i]["markerNo"]] = markerList[i]["data"];
      }

      this.moveContext = {
        zone: zone, lineFrom: lineFrom, lineTo: lineTo,
        dataByMarkerNo: dataByMarkerNo, selection: selection, lastKey: lastKey
      };

      await this.runMoveLoop(this.moveContext);

      // NEW PATH: destination ka lastMarkerKey LineSummary par.
      this.moveSummary.statusText = "Last marker key अपडेट हो रही है...";
      await this.moveHelper.dbUpdate(this.db,
        "EntityMarkingData/MarkersMapping/LineSummary/" + zone + "/" + lineTo,
        { lastMarkerKey: lastKey + this.moveRows.length });

      let status = "success";
      if (this.cancelRequested) { status = "cancelled"; }
      else if (this.moveSummary.failed > 0) { status = "partial"; }
      await this.saveMoveHistory(action, status, startTime, zone, lineFrom, lineTo, originalLastKey, "");

      if (this.cancelRequested) {
        this.moveSummary.statusText = "Move रद्द कर दिया गया। जो move हो चुके वे सुरक्षित हैं, बाकी source पर ही हैं।";
      } else if (this.moveSummary.failed > 0) {
        this.moveSummary.statusText = this.moveSummary.failed + " markers फेल हुए। नीचे table में कारण देखें, फिर 'Retry Failed' दबाएँ।";
      } else {
        this.moveSummary.statusText = "सभी markers सफलतापूर्वक move हो गए।";
        if (this.moveSummary.imageMissing > 0) {
          this.moveSummary.statusText = this.moveSummary.statusText + " (" + this.moveSummary.imageMissing + " markers की image Storage में नहीं मिली - डेटा move हो गया है।)";
        }
      }

      this.finishRun();
      // purane code jaisa hi: counts recalculate + UI reset + alert
      this.updateCounts(zone, this.moveSummary.failed);
      return;
    } catch (e) {
      let reason = (e && e.message) ? e.message : e;
      this.moveSummary.statusText = "Move रोक दिया गया: " + reason;
      this.commonService.setAlertMessage("error", "Move में समस्या आ गई: " + reason);
      await this.saveMoveHistory(action, "error", startTime, zone, lineFrom, lineTo, originalLastKey, "" + reason);
    }

    this.finishRun();
  }

  private finishRun() {
    this.moveRunning = false;
    this.moveSummary.running = false;
    this.moveSummary.waitingForNetwork = false;
    if (this.moveSummary.total == 0) { this.closeMoveModal(); }
  }

  /**
   * ActionHistory/SurveyManagement/LineMarkerMapping/{date} me ek record.
   * Fail / cancel / abort sab log hote hain.
   */
  private async saveMoveHistory(action: string, status: string, startTime: Date, zone: any, lineFrom: any, lineTo: any, originalLastKey: any, note: string) {
    let now = new Date();
    let record: any = {
      action: action,
      status: status,
      startTime: this.moveHelper.getDateTimeString(startTime),
      endTime: this.moveHelper.getDateTimeString(now),
      durationSec: Math.round((now.getTime() - startTime.getTime()) / 1000),
      from: { ward: zone, line: lineFrom },
      to: { ward: zone, line: lineTo },
      total: this.moveSummary.total,
      moved: this.moveSummary.moved,
      failed: this.moveSummary.failed,
      pending: this.moveSummary.pending,
      imageMissing: this.moveSummary.imageMissing,
      backupFile: this.moveSummary.backupFile,
      cancelled: this.cancelRequested,
      networkInterrupted: this.networkInterrupted,
      failedItems: this.moveHelper.buildFailedItems(this.moveRows)
    };
    if (note != "") { record["note"] = note; }
    if (originalLastKey != null && this.moveRows.length > 0) {
      record["destinationStartKey"] = Number(originalLastKey) + 1;
      record["destinationEndKey"] = Number(originalLastKey) + this.moveRows.length;
    }
    await this.moveHelper.saveActionHistory(this.db, this.historySection, this.historyPageKey, record);
  }

  private buildRows(markerList: any[], zone: any, lineFrom: any, lineTo: any): MarkerMoveRow[] {
    let rows: MarkerMoveRow[] = [];
    for (let i = 0; i < markerList.length; i++) {
      let data = markerList[i]["data"];
      rows.push({
        srNo: i + 1,
        markerNo: "" + markerList[i]["markerNo"],
        newKey: 0,
        newMarkerNo: "",
        fromZone: zone,
        fromLine: lineFrom,
        toZone: zone,
        toLine: lineTo,
        cardNo: (data != null && data["cardNumber"] != null) ? data["cardNumber"] : "",
        oldImage: (data != null && data["image"] != null) ? data["image"] : "",
        newImage: "",
        imageMissing: false,
        status: "pending",
        failedStep: "",
        error: "",
        attempts: 0
      });
    }
    return rows;
  }

  private buildBackupData(markerNodeData: any, houseData: any, markerList: any[], lastKey: any, zone: any, lineFrom: any, lineTo: any, now: Date): any {
    let selectedMarkers = [];
    for (let i = 0; i < markerList.length; i++) {
      selectedMarkers.push("" + markerList[i]["markerNo"]);
    }
    let meta = this.moveHelper.buildBackupMeta(this.pageName, this.cityName, zone, lineFrom, zone, lineTo, markerList.length, now);
    meta["destinationLastMarkerKey"] = lastKey;
    meta["selectedMarkers"] = selectedMarkers;
    return {
      meta: meta,
      markedHouses: markerNodeData,
      houses: houseData
    };
  }

  // =====================================================================
  // MOVE LOOP
  // =====================================================================

  /**
   * Markers ek doosre se independent hain - har marker apne alag paths par
   * likhta hai. Keys pehle allocate kar dete hain, phir N markers saath-saath
   * chal sakte hain bina kisi race ke.
   */
  private async runMoveLoop(ctx: any) {
    for (let i = 0; i < this.moveRows.length; i++) {
      let row = this.moveRows[i];
      let key = ctx.lastKey + 1 + i;
      row.newKey = key;
      row.newMarkerNo = "" + key;
      // NEW PATH: image hamesha AllMarkerImages/{uid}.jpg par rehti hai, move
      // par uska naam badalta hi nahi. Old path me har line ka apna folder tha
      // isliye wahan naye markerNo se naya naam banana padta tha.
      let data = ctx.dataByMarkerNo[row.markerNo];
      let imgRef = (data != null && data["imgRef"] != null) ? data["imgRef"] : row.oldImage;
      row.newImage = imgRef;
    }

    await this.moveHelper.runPool(this.moveRows.length, (index: number) => {
      return this.processRowWithRetry(this.moveRows[index], ctx);
    }, this.run);
  }

  private async processRowWithRetry(row: MarkerMoveRow, ctx: any) {
    let networkRetries = 0;

    while (true) {
      if (this.cancelRequested) { row.status = "pending"; return; }
      await this.moveHelper.waitForNetwork(this.run);
      if (this.cancelRequested) { row.status = "pending"; return; }

      row.status = "moving";
      row.attempts = row.attempts + 1;
      this.refreshMoveStatusText();

      let state = {
        destMarkerWritten: false, destCardWritten: false, destRevisitWritten: false,
        mappingWritten: false, cleanupStarted: false, revisitKey: "", markerID: "", mobile: ""
      };

      try {
        await this.processMarker(row, ctx, state);
        row.status = "moved";
        row.failedStep = "";
        row.error = "";
        if (row.imageMissing) { this.moveSummary.imageMissing = this.moveSummary.imageMissing + 1; }
        this.moveSummary.moved = this.moveSummary.moved + 1;
        this.moveSummary.pending = this.moveSummary.pending - 1;
        this.movedMarkerCount = this.moveSummary.moved;
        this.refreshMoveStatusText();
        return;
      } catch (e) {
        if (this.cancelRequested) { row.status = "pending"; return; }

        if (this.moveHelper.isNetworkError(e) && networkRetries < this.moveHelper.MAX_NETWORK_RETRIES) {
          networkRetries = networkRetries + 1;
          row.status = "pending";
          row.imageMissing = false;
          await this.moveHelper.waitForNetwork(this.run);
          continue;                                  // wahi marker, wahi key
        }

        if (!state.cleanupStarted) {
          await this.rollbackDestination(row, ctx, state);
          row.newMarkerNo = "";
          row.newImage = "";
        }

        row.status = "failed";
        row.imageMissing = false;
        row.error = (e && e.message) ? e.message : ("" + e);
        if (state.cleanupStarted) {
          row.error = row.error + " (source cleanup अधूरा - इस marker को manually जाँच लें)";
        }
        this.moveSummary.failed = this.moveSummary.failed + 1;
        this.moveSummary.pending = this.moveSummary.pending - 1;
        this.refreshMoveStatusText();
        return;
      }
    }
  }

  private refreshMoveStatusText() {
    if (this.moveSummary.waitingForNetwork) { return; }
    let done = this.moveSummary.moved + this.moveSummary.failed;
    this.moveSummary.statusText = done + " / " + this.moveSummary.total + " markers हो चुके - "
      + this.moveHelper.CONCURRENCY + " एक साथ चल रहे हैं...";
  }

  /**
   * Ek marker ka poora move. Order: image + saare reads -> saare destination
   * writes -> sabse aakhir me source removes. Isse beech me kuch fail ho to
   * source poora salamat rehta hai aur retry saaf chalta hai.
   */
  private async processMarker(row: MarkerMoveRow, ctx: any, state: any) {
    let zone = ctx.zone;
    let lineFrom = ctx.lineFrom;
    let lineTo = ctx.lineTo;
    let data = ctx.dataByMarkerNo[row.markerNo];
    if (data == null) { throw new Error("marker data not found"); }

    // ---------- IMAGE ----------
    // NEW PATH me image copy karne ki zaroorat hi nahi. Wo global folder
    // DevTest/MarkingSurveyImages/AllMarkerImages/{uid}.jpg par padi rehti hai
    // aur marker kahin bhi jaaye, uska naam wahi rehta hai. Old path me har
    // line ka apna folder tha, isliye wahan har move par file copy karni padti
    // thi - sabse dheema aur sabse zyada fail hone wala step wahi tha.
    row.imageMissing = (row.newImage == "");

    // ---------- UID ----------
    // Marker ki asli pehchaan uid hai; markerNo sirf line par uska serial hai.
    // Mapping se uid nahi mila to marker naye path par hai hi nahi - use move
    // karne ka koi tareeka nahi, isliye yahin ruk jaate hain.
    row.failedStep = "Marker UID";
    let uid = await this.getMarkerUid(zone, lineFrom, row.markerNo);
    if (uid == null) {
      throw new Error("marker naye path par nahi mila (LineWise me uid nahi hai)");
    }
    state.uid = uid;

    // ---------- READS ----------
    let cardNo = (data["cardNumber"] != null) ? data["cardNumber"] : "";
    let cardData: any = null;
    if (cardNo != "") {
      row.failedStep = "Card Read";
      cardData = await this.moveHelper.readOnce(this.db, "Houses/" + zone + "/" + lineFrom + "/" + cardNo);
      if (cardData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", cardData);
        if (cardData["mobile"] != null && cardData["mobile"] != "") { state.mobile = cardData["mobile"]; }
      }
    }

    let revisitKey = (data["revisitKey"] != null) ? data["revisitKey"] : "";
    let revisitData: any = null;
    state.revisitKey = revisitKey;
    if (revisitKey != "") {
      row.failedStep = "Revisit Read";
      revisitData = await this.moveHelper.readOnce(this.db,
        "EntitySurveyData/RevisitRequest/" + zone + "/" + lineFrom + "/" + revisitKey);
    }

    // latLng card se - marker write se PEHLE, warna save hi nahi hota tha
    if (cardData != null && cardData["latLng"] != null) {
      data["latLng"] = cardData["latLng"].toString().replace("(", "").replace(")", "");
    }
    data["image"] = row.newImage;                    // purane code jaisa - hamesha set

    // ---------- DESTINATION WRITES ----------
    // NEW PATH: record apni hi jagah (MarkersData/{uid}) par rehta hai - sirf
    // ward/line badalte hain aur mapping nayi jagah point karne lagti hai.
    // Old path me record nayi key par dobara likhna padta tha.
    row.failedStep = "Marker Write";
    let lineVal = this.markerMapping.lineValue(lineTo);
    state.destMarkerWritten = true;
    await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkersData/" + uid, {
      ward: zone,
      line: lineVal,
      markerNo: Number(row.newKey) || 0,
      movedFromWard: zone,
      movedFromLine: this.markerMapping.lineValue(lineFrom),
      movedFromMarkerNo: this.markerMapping.markerNoValue(row.markerNo),
      movedOn: this.commonService.getTodayDateTime()
    });
    // in-memory record bhi sync - caller isi object ko aage use karta hai
    data["ward"] = zone;
    data["line"] = lineVal;

    // Teeno mapping ek saath - aadhi likhi rehna sabse kharab haalat hai
    // (marker kisi ek page par dikhta, doosre par nahi).
    state.destMappingWritten = true;
    await this.markerMapping.writePlace(this.db, uid, zone, lineVal, row.newKey);

    // Har move ka permanent record: MoveHistory/{uid}.
    await this.markerMapping.recordMove(this.db, uid, zone, lineFrom, row.markerNo, zone, lineTo, row.newKey);

    if (cardData != null) {
      row.failedStep = "Card Write";
      cardData["line"] = lineTo;
      cardData["ward"] = zone;
      state.destCardWritten = true;
      await this.moveHelper.dbUpdate(this.db, "Houses/" + zone + "/" + lineTo + "/" + cardNo, cardData);
      await this.moveHelper.dbSet(this.db, "CardWardMapping/" + cardNo, { line: lineTo, ward: zone });
      if (state.mobile != "") {
        await this.moveHelper.dbSet(this.db, "HouseWardMapping/" + state.mobile, { line: lineTo, ward: zone });
      }
    }

    if (revisitData != null) {
      row.failedStep = "Revisit Write";
      state.destRevisitWritten = true;
      await this.moveHelper.dbUpdate(this.db,
        "EntitySurveyData/RevisitRequest/" + zone + "/" + lineTo + "/" + revisitKey, revisitData);
    }

    // markerID nikalne ka logic bilkul purane code jaisa hi
    row.failedStep = "Ward Mapping";
    let markerID = "";
    if (data["markerId"] != null) {
      markerID = this.commonService.getDefaultCardPrefix() + data["markerId"];
    }
    if (cardNo != "" && markerID != "") { markerID = cardNo; }
    state.markerID = markerID;
    if (markerID != "") {
      state.mappingWritten = true;
      await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkerWardMapping/" + markerID, {
        image: row.newImage,
        line: lineTo.toString(),
        markerNo: row.newKey.toString(),
        ward: zone
      });
    }

    // ---------- SOURCE REMOVES (sabse aakhir me) ----------
    // NEW PATH: record kahin nahi hataya jaata - wo MarkersData par apni jagah
    // hi hai. Sirf purani line ki LineWise entry hatani hai, warna marker
    // purani aur nayi dono line par dikhta rahega. WardWise/MarkerWise upar
    // writePlace me hi nayi jagah par point karne lag chuke hain (ward wahi
    // hai, isliye WardWise se kuch hataana nahi padta).
    row.failedStep = "Source Cleanup";
    state.cleanupStarted = true;
    await this.moveHelper.dbRemove(this.db,
      "EntityMarkingData/MarkersMapping/LineWise/" + zone + "/" + lineFrom + "/" + row.markerNo);
    this.markersDataCache = null; // write ke baad cache stale
    if (cardData != null) {
      await this.moveHelper.dbRemove(this.db, "Houses/" + zone + "/" + lineFrom + "/" + cardNo);
    }
    if (revisitData != null) {
      await this.moveHelper.dbRemove(this.db,
        "EntitySurveyData/RevisitRequest/" + zone + "/" + lineFrom + "/" + revisitKey);
    }

    row.failedStep = "";
  }

  /**
   * Marker beech me fail hua to destination par likhi gayi aadhi entries hata
   * kar purani haalat wapas laata hai. Sirf tab jab source se abhi kuch delete
   * nahi hua - warna data hi chala jayega.
   */
  private async rollbackDestination(row: MarkerMoveRow, ctx: any, state: any) {
    try {
      // NEW PATH: record delete nahi karna - wo MarkersData par hai aur wahi
      // asli data hai. Marker ko wapas purani line par point kara dete hain
      // aur nayi line ki LineWise entry hata dete hain.
      if (state.destMappingWritten && state.uid != null) {
        await this.markerMapping.writePlace(this.db, state.uid, ctx.zone,
          this.markerMapping.lineValue(ctx.lineFrom), row.markerNo);
        await this.moveHelper.dbRemove(this.db,
          "EntityMarkingData/MarkersMapping/LineWise/" + ctx.zone + "/" + ctx.lineTo + "/" + row.newKey);
      }
      if (state.destMarkerWritten && state.uid != null) {
        await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkersData/" + state.uid, {
          ward: ctx.zone,
          line: this.markerMapping.lineValue(ctx.lineFrom),
          markerNo: this.markerMapping.markerNoValue(row.markerNo)
        });
      }
      if (state.destCardWritten && row.cardNo != "") {
        await this.moveHelper.dbRemove(this.db, "Houses/" + ctx.zone + "/" + ctx.lineTo + "/" + row.cardNo);
        await this.moveHelper.dbSet(this.db, "CardWardMapping/" + row.cardNo, { line: ctx.lineFrom, ward: ctx.zone });
        if (state.mobile != "") {
          await this.moveHelper.dbSet(this.db, "HouseWardMapping/" + state.mobile, { line: ctx.lineFrom, ward: ctx.zone });
        }
      }
      if (state.destRevisitWritten && state.revisitKey != "") {
        await this.moveHelper.dbRemove(this.db,
          "EntitySurveyData/RevisitRequest/" + ctx.zone + "/" + ctx.lineTo + "/" + state.revisitKey);
      }
      if (state.mappingWritten && state.markerID != "") {
        await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkerWardMapping/" + state.markerID, {
          image: row.oldImage,
          line: ctx.lineFrom.toString(),
          markerNo: row.markerNo.toString(),
          ward: ctx.zone
        });
      }
    } catch (e) {
      // best effort - rollback fail hua to bhi source salamat hai
    }
  }

  async onRetryFailed() {
    if (this.moveRunning || this.moveContext == null) { return; }
    let failedMarkerNos = this.moveRows.filter(r => r.status == "failed").map(r => r.markerNo);
    if (failedMarkerNos.length == 0) { return; }
    await this.startMove(this.moveContext.lineFrom, this.moveContext.lineTo, this.moveContext.selection, failedMarkerNos);
  }

  onCancelMove() {
    if (!this.moveRunning) { return; }
    this.cancelRequested = true;
    this.moveSummary.waitingForNetwork = false;
    this.moveSummary.statusText = "Cancel request भेज दी गई, चल रहे markers पूरे होते ही रुक जाएगा...";
  }

  updateCounts(zoneNo: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts");
    $(this.divLoaderMarkerMove).show();
    this.markersDataCache = null; // move ke baad purana snapshot kaam ka nahi
    this.getNewPathWardData(zoneNo).then(
      (markerData: any) => {
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCounts", markerData);
          // Neeche wala loop sirf un lines par ghumta hai jo LineWise me hain.
          // Jis line ka aakhri marker nikal gaya uska LineWise node hi khatam
          // ho jaata hai, isliye wo line yahan aati hi nahi aur uske purane
          // counts LineSummary par pade rah jaate hain - table me Markers 0
          // dikhta hai par Houses purana number. Unhe yahan zero karte hain.
          this.markerMapping.resetEmptyLineSummaries(this.db, zoneNo, markerData);
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
              let dbPath = "EntityMarkingData/MarkersMapping/LineSummary/" + zoneNo + "/" + lineNo;
              this.db.object(dbPath).update({ marksCount: markerCount, surveyedCount: surveyedCount, lineRevisitCount: revisitCount, lineRfidNotFoundCount: rfIdNotFound, alreadyInstalledCount: alreadyInstalledCount })
              if (lastMarkerKey > 0) {
                let dbPath = "EntityMarkingData/MarkersMapping/LineSummary/" + zoneNo + "/" + lineNo;
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
