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

@Component({
  selector: "app-line-card-mapping",
  templateUrl: "./line-card-mapping.component.html",
  styleUrls: ["./line-card-mapping.component.scss"],
})
export class LineCardMappingComponent implements OnDestroy {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(private storage: AngularFireStorage, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService, public moveHelper: MoveHelperService, private modalService: NgbModal) { }

  // ---- move progress state ----
  pageName = "Line-Card-Mapping";
  historySection = "SurveyManagement";
  historyPageKey = "LineCardMapping";
  private networkInterrupted = false;
  @ViewChild("moveProgressModal", { static: false }) moveProgressModal: any;
  private moveModalRef: any = null;
  moveRows: MarkerMoveRow[] = [];
  moveSummary: MarkerMoveSummary = this.getEmptySummary();
  moveRunning = false;
  private cancelRequested = false;
  private moveContext: any = null;

  /** MoveHelperService ko batata hai ki cancel hua ya nahi, aur UI ko network wait dikhata hai */
  private run: MoveRun = {
    isCancelled: () => this.cancelRequested,
    setWaitingForNetwork: (waiting: boolean) => {
      this.moveSummary.waitingForNetwork = waiting;
      if (waiting) { this.networkInterrupted = true; }
    }
  };

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
  wardBoundary: any;
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
    this.commonService.savePageLoadHistory("Survey-Management", "Line-Card-Mapping", localStorage.getItem("userID"));
    this.selectedCardDetails = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.setHeight();
    this.getZones();
    this.setMap();
    this.moveHelper.watchConnection(this.db);
  }

  ngOnDestroy() {
    this.cancelRequested = true;
    this.moveHelper.stopWatchingConnection();
    if (this.moveModalRef != null) {
      this.moveModalRef.dismiss();
      this.moveModalRef = null;
    }
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
    this.activeZone = filterVal;
    $("#txtLineNo").val("1");
    $("#chk_wardLine").prop('checked', false);
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

  // =====================================================================
  // MOVE PROGRESS POPUP
  // =====================================================================

  private openMoveModal() {
    if (this.moveModalRef != null) {
      return;                                       // retry ke waqt popup pehle se khula hai
    }
    // move ke dauraan backdrop / ESC se band na ho - warna user ko lagega
    // process ruk gaya jabki wo background me chalta rahega
    this.moveModalRef = this.modalService.open(this.moveProgressModal, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
      windowClass: "card-move-modal"
    });
    this.moveModalRef.result.then(
      () => { this.moveModalRef = null; },
      () => { this.moveModalRef = null; }
    );
  }

  // ---- action history popup (sirf userId 4) ----
  @ViewChild("historyModal", { static: false }) historyModal: any;
  private historyModalRef: any = null;

  openHistoryModal() {
    if (!this.moveHelper.canViewActionHistory() || this.historyModalRef != null) {
      return;
    }
    this.historyModalRef = this.modalService.open(this.historyModal, { size: "lg", windowClass: "action-history-modal" });
    this.historyModalRef.result.then(
      () => { this.historyModalRef = null; },
      () => { this.historyModalRef = null; }
    );
  }

  closeHistoryModal() {
    if (this.historyModalRef != null) {
      this.historyModalRef.close();
      this.historyModalRef = null;
    }
  }

  closeMoveModal() {
    if (this.moveRunning) {
      return;                                       // chalte move ke beech band nahi hoga
    }
    if (this.moveModalRef != null) {
      this.moveModalRef.close();
      this.moveModalRef = null;
    }
  }

  private getEmptySummary(): MarkerMoveSummary {
    return {
      running: false,
      waitingForNetwork: false,
      statusText: "",
      fromZone: "",
      fromLine: "",
      toZone: "",
      toLine: "",
      backupFile: "",
      total: 0,
      moved: 0,
      failed: 0,
      pending: 0,
      imageMissing: 0
    };
  }

  // =====================================================================
  // MOVE SELECTED CARDS TO NEW LINE
  // =====================================================================

  async moveToNewLine() {
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
    let lineFrom = $("#txtLineNo").val();
    // selection ki copy - move ke dauraan user map par kuch aur select kar de
    // to chal raha move usse prabhavit na ho
    let selection = this.selectedCardDetails.slice();

    await this.startMove(lineFrom, lineTo, selection, null);
  }

  /**
   * onlyCardNos = null  -> selected sabhi cards
   * onlyCardNos = [...] -> sirf pehle fail hue cards ka retry
   */
  private async startMove(lineFrom: any, lineTo: any, selection: any[], onlyCardNos: string[]) {
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

    let action = (onlyCardNos != null) ? "RetryFailed" : "MoveSelectedCards";
    let startTime = new Date();
    let originalStartKey: any = null;
    this.networkInterrupted = false;

    try {
      // ---------- 1. data padho ----------
      this.moveSummary.statusText = "डेटा पढ़ा जा रहा है...";
      await this.moveHelper.waitForNetwork(this.run);

      let cardList = [];
      for (let i = 0; i < selection.length; i++) {
        let cardNo = selection[i]["cardNo"];
        if (onlyCardNos != null && onlyCardNos.indexOf(cardNo) < 0) {
          continue;
        }
        cardList.push(selection[i]);
      }
      if (cardList.length == 0) {
        this.commonService.setAlertMessage("error", "move करने लायक कोई card नहीं मिला।");
        await this.saveMoveHistory(action, "aborted", startTime, zone, lineFrom, zone, lineTo, null, "move karne layak koi card nahi mila");
        this.finishRun();
        return;
      }

      // purane code jaisa hi: mila to +1 se shuru, warna 1 se
      let lastMarkerKeyData = await this.moveHelper.readOnceWithRetry(this.db,
        "EntityMarkingData/MarkedHouses/" + zone + "/" + lineTo + "/lastMarkerKey", this.run);
      let startKey = 1;
      if (lastMarkerKeyData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", lastMarkerKeyData);
        startKey = Number(lastMarkerKeyData) + 1;
      }
      originalStartKey = startKey;

      let markerData = await this.moveHelper.readOnceWithRetry(this.db,
        "EntityMarkingData/MarkedHouses/" + zone + "/" + lineFrom, this.run);
      if (markerData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveToNewLine", markerData);
      }
      let markerByCard = this.buildMarkerIndex(markerData);

      let houseData = await this.moveHelper.readOnceWithRetry(this.db, "Houses/" + zone + "/" + lineFrom, this.run);

      // ---------- 2. backup pehle, uske baad hi move ----------
      this.moveSummary.statusText = "Backup सेव हो रहा है...";
      let now = new Date();
      let filePath = this.moveHelper.buildBackupFilePath(this.pageName, now);
      let fileName = this.moveHelper.buildBackupFileName(zone, lineFrom, zone, lineTo, (onlyCardNos != null ? "_retry" : ""), now);
      let backupData = this.buildBackupData(houseData, markerData, cardList, startKey, zone, lineFrom, lineTo, now);

      try {
        await this.moveHelper.saveBackupWithRetry(backupData, fileName, filePath, this.run);
      } catch (e) {
        let reason = (e && e.message) ? e.message : e;
        this.commonService.setAlertMessage("error", "Backup सेव नहीं हो पाया, move रद्द कर दिया गया। (" + reason + ")");
        this.moveSummary.statusText = "Backup फेल हुआ - move शुरू ही नहीं हुआ। डेटाबेस में कुछ नहीं बदला।";
        await this.saveMoveHistory(action, "aborted", startTime, zone, lineFrom, zone, lineTo, originalStartKey, "backup fail: " + reason);
        this.finishRun();
        return;
      }
      this.moveSummary.backupFile = filePath + fileName;

      // ---------- 3. rows ----------
      this.moveRows = this.buildRows(cardList, markerData, markerByCard, zone, lineFrom, lineTo);
      this.moveSummary.total = this.moveRows.length;
      this.moveSummary.pending = this.moveRows.length;

      let cardDataByNo = {};
      for (let i = 0; i < cardList.length; i++) {
        cardDataByNo[cardList[i]["cardNo"]] = cardList[i]["data"];
      }

      this.moveContext = {
        zone: zone, lineFrom: lineFrom, lineTo: lineTo,
        cardDataByNo: cardDataByNo, selection: selection, startKey: startKey
      };

      // ---------- 4. move ----------
      await this.runMoveLoop(this.moveContext);

      // ---------- 5. lastMarkerKey ----------
      // Purane code jaisa hi vyavhaar: har selected card ek key consume karta hai
      // chahe uska marker ho ya na ho, aur ant me start + count likha jata hai.
      this.moveSummary.statusText = "Last marker key अपडेट हो रही है...";
      await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkedHouses/" + zone + "/" + lineTo,
        { lastMarkerKey: startKey + this.moveRows.length });

      let status = "success";
      if (this.cancelRequested) { status = "cancelled"; }
      else if (this.moveSummary.failed > 0) { status = "partial"; }
      await this.saveMoveHistory(action, status, startTime, zone, lineFrom, zone, lineTo, originalStartKey, "");

      if (this.cancelRequested) {
        this.moveSummary.statusText = "Move रद्द कर दिया गया। जो move हो चुके वे सुरक्षित हैं, बाकी source पर ही हैं।";
        this.commonService.setAlertMessage("error", "Move रद्द कर दिया गया। " + this.moveSummary.moved + " cards move हो चुके थे।");
      } else if (this.moveSummary.failed > 0) {
        this.moveSummary.statusText = this.moveSummary.failed + " cards फेल हुए। नीचे table में कारण देखें, फिर 'Retry Failed' दबाएँ।";
        this.commonService.setAlertMessage("error", this.moveSummary.failed + " cards have some issue to be processed, Please try again.");
      } else {
        this.moveSummary.statusText = "सभी cards सफलतापूर्वक move हो गए।";
        if (this.moveSummary.imageMissing > 0) {
          this.moveSummary.statusText = this.moveSummary.statusText + " (" + this.moveSummary.imageMissing + " markers की image Storage में नहीं मिली - डेटा move हो गया है।)";
        }
        this.commonService.setAlertMessage("success", "Card moved to Line " + lineTo + " successfully");
      }
    } catch (e) {
      let reason = (e && e.message) ? e.message : e;
      this.moveSummary.statusText = "Move रोक दिया गया: " + reason;
      this.commonService.setAlertMessage("error", "Move में समस्या आ गई: " + reason);
      await this.saveMoveHistory(action, "error", startTime, zone, lineFrom, zone, lineTo, originalStartKey, "" + reason);
    }

    this.finishRun();

    // purane code jaisa hi: pura move safal hone par hi input clear hota hai
    if (!this.cancelRequested && this.moveSummary.failed == 0 && this.moveSummary.moved > 0) {
      $("#txtNewLine").val("");
    }
    // map hamesha refresh - warna jo cards move ho chuke wo bhi purani line par
    // dikhte rahenge
    if (this.moveSummary.total > 0) {
      this.getLineData();
    }
  }

  /**
   * ActionHistory/{section}/{pageKey}/{date} me ek record.
   * Fail / cancel / abort sab log hote hain - warna audit adhoora reh jayega.
   */
  private async saveMoveHistory(action: string, status: string, startTime: Date, wardFrom: any, lineFrom: any, wardTo: any, lineTo: any, startKey: any, note: string) {
    let now = new Date();
    let record: any = {
      action: action,
      status: status,
      startTime: this.moveHelper.getDateTimeString(startTime),
      endTime: this.moveHelper.getDateTimeString(now),
      durationSec: Math.round((now.getTime() - startTime.getTime()) / 1000),
      from: { ward: wardFrom, line: lineFrom },
      to: { ward: wardTo, line: lineTo },
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
    if (note != "") {
      record["note"] = note;
    }
    if (startKey != null && this.moveRows.length > 0) {
      record["destinationStartKey"] = Number(startKey);
      record["destinationEndKey"] = Number(startKey) + this.moveRows.length - 1;
    }
    await this.moveHelper.saveActionHistory(this.db, this.historySection, this.historyPageKey, record);
  }

  /** Move ke alawa wale actions ka chhota record */
  private async saveSimpleHistory(action: string, status: string, startTime: Date, detail: any) {
    let now = new Date();
    let record: any = {
      action: action,
      status: status,
      startTime: this.moveHelper.getDateTimeString(startTime),
      endTime: this.moveHelper.getDateTimeString(now),
      durationSec: Math.round((now.getTime() - startTime.getTime()) / 1000)
    };
    if (detail != null) {
      let keys = Object.keys(detail);
      for (let i = 0; i < keys.length; i++) {
        record[keys[i]] = detail[keys[i]];
      }
    }
    await this.moveHelper.saveActionHistory(this.db, this.historySection, this.historyPageKey, record);
  }

  /**
   * ActionHistory/{section}/{pageKey}/{date} me ek record.
   * Fail / cancel / abort sab log hote hain - warna audit adhoora reh jayega.
   */
  private async saveMoveHistory(action: string, status: string, startTime: Date, wardFrom: any, lineFrom: any, wardTo: any, lineTo: any, startKey: any, note: string) {
    let now = new Date();
    let record: any = {
      action: action,
      status: status,
      startTime: this.moveHelper.getDateTimeString(startTime),
      endTime: this.moveHelper.getDateTimeString(now),
      durationSec: Math.round((now.getTime() - startTime.getTime()) / 1000),
      from: { ward: wardFrom, line: lineFrom },
      to: { ward: wardTo, line: lineTo },
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
    if (startKey != null && this.moveRows.length > 0) {
      record["destinationStartKey"] = Number(startKey);
      record["destinationEndKey"] = Number(startKey) + this.moveRows.length - 1;
    }
    await this.moveHelper.saveActionHistory(this.db, this.historySection, this.historyPageKey, record);
  }

  private finishRun() {
    this.moveRunning = false;
    this.moveSummary.running = false;
    this.moveSummary.waitingForNetwork = false;
    if (this.moveSummary.total == 0) {
      this.closeMoveModal();                        // dikhane layak kuch hua hi nahi
    }
  }

  /** cardNumber -> markerNo, taaki har card ka marker turant mil jaye. */
  private buildMarkerIndex(markerData: any): any {
    let index = {};
    if (markerData == null) {
      return index;
    }
    let keyArray = Object.keys(markerData);
    for (let i = 0; i < keyArray.length; i++) {
      let markerNo = keyArray[i];
      if (markerData[markerNo] == null || typeof markerData[markerNo] != "object") {
        continue;
      }
      if (markerData[markerNo]["cardNumber"] != null) {
        index[markerData[markerNo]["cardNumber"]] = markerNo;
      }
    }
    return index;
  }

  private buildRows(cardList: any[], markerData: any, markerByCard: any, zone: any, lineFrom: any, lineTo: any): MarkerMoveRow[] {
    let rows: MarkerMoveRow[] = [];
    for (let i = 0; i < cardList.length; i++) {
      let cardNo = cardList[i]["cardNo"];
      let markerNo = (markerByCard[cardNo] != undefined) ? markerByCard[cardNo] : "";
      let oldImage = "";
      if (markerNo != "" && markerData != null && markerData[markerNo] != null && markerData[markerNo]["image"] != null) {
        oldImage = markerData[markerNo]["image"];
      }
      rows.push({
        srNo: i + 1,
        markerNo: markerNo,
        newKey: 0,
        newMarkerNo: "",
        fromZone: zone,
        fromLine: lineFrom,
        toZone: zone,
        toLine: lineTo,
        cardNo: cardNo,
        oldImage: oldImage,
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

  /**
   * Move me Houses, CardWardMapping, HouseWardMapping, MarkedHouses aur
   * MarkerWardMapping badalte hain - source line ka poora purana roop backup
   * me jata hai, saath me kaunse cards select the wo bhi.
   */
  private buildBackupData(houseData: any, markerData: any, cardList: any[], startKey: any, zone: any, lineFrom: any, lineTo: any, now: Date): any {
    let selectedCards = [];
    let cardWardMapping = {};
    let houseWardMapping = {};
    for (let i = 0; i < cardList.length; i++) {
      let cardNo = cardList[i]["cardNo"];
      selectedCards.push(cardNo);
      cardWardMapping[cardNo] = { line: lineFrom, ward: zone };
      let data = cardList[i]["data"];
      if (data != null && data["mobile"] != null && data["mobile"] != "") {
        houseWardMapping[data["mobile"]] = { line: lineFrom, ward: zone };
      }
    }
    let meta = this.moveHelper.buildBackupMeta(this.pageName, this.cityName, zone, lineFrom, zone, lineTo, cardList.length, now);
    meta["destinationStartKey"] = startKey;
    meta["selectedCards"] = selectedCards;
    return {
      meta: meta,
      houses: houseData,
      markedHouses: markerData,
      cardWardMapping: cardWardMapping,
      houseWardMapping: houseWardMapping
    };
  }

  // =====================================================================
  // MOVE LOOP
  // =====================================================================

  /**
   * Cards ek doosre se independent hain - har card apne alag paths par likhta
   * hai (apna cardNo, apna markerNo, apni key). Keys pehle allocate kar dete
   * hain, phir N cards saath-saath chal sakte hain bina kisi race ke.
   */
  private async runMoveLoop(ctx: any) {
    // Purane code jaisa hi: har selected card ek key consume karta hai,
    // chahe uska marker ho ya na ho. Numbering bilkul pehle jaisi rehti hai.
    for (let i = 0; i < this.moveRows.length; i++) {
      let row = this.moveRows[i];
      let key = ctx.startKey + i;
      row.newKey = key;
      row.newMarkerNo = (row.markerNo != "") ? ("" + key) : "";
      row.newImage = (row.markerNo != "") ? (key + ".jpg") : "";
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

      // is card ke dauraan kya-kya destination par likha ja chuka hai
      let state = {
        destHouseWritten: false,
        destMarkerWritten: false,
        mappingWritten: false,
        cleanupStarted: false,
        markerID: "",
        mobile: ""
      };

      try {
        await this.processCard(row, ctx, state);
        row.status = "moved";
        row.failedStep = "";
        row.error = "";
        if (row.imageMissing) {
          this.moveSummary.imageMissing = this.moveSummary.imageMissing + 1;
        }
        this.moveSummary.moved = this.moveSummary.moved + 1;
        this.moveSummary.pending = this.moveSummary.pending - 1;
        this.refreshMoveStatusText();
        return;
      } catch (e) {
        if (this.cancelRequested) { row.status = "pending"; return; }

        if (this.moveHelper.isNetworkError(e) && networkRetries < this.moveHelper.MAX_NETWORK_RETRIES) {
          networkRetries = networkRetries + 1;
          row.status = "pending";
          row.imageMissing = false;
          await this.moveHelper.waitForNetwork(this.run);
          continue;                                  // wahi card, wahi key
        }

        // Asli error. Destination par jo aadha-adhoora likha gaya use hata do,
        // warna card dono jagah reh jayega.
        if (!state.cleanupStarted) {
          await this.rollbackDestination(row, ctx, state);
          row.newMarkerNo = "";
          row.newImage = "";
        }

        row.status = "failed";
        row.imageMissing = false;
        row.error = (e && e.message) ? e.message : ("" + e);
        if (state.cleanupStarted) {
          row.error = row.error + " (source cleanup अधूरा - इस card को manually जाँच लें)";
        }
        this.moveSummary.failed = this.moveSummary.failed + 1;
        this.moveSummary.pending = this.moveSummary.pending - 1;
        this.refreshMoveStatusText();
        return;
      }
    }
  }

  private refreshMoveStatusText() {
    if (this.moveSummary.waitingForNetwork) {
      return;                                        // banner apna message dikha raha hai
    }
    let done = this.moveSummary.moved + this.moveSummary.failed;
    this.moveSummary.statusText = done + " / " + this.moveSummary.total + " cards हो चुके - "
      + this.moveHelper.CONCURRENCY + " एक साथ चल रहे हैं...";
  }

  /**
   * Ek card ka poora move. Order: pehle image + reads, phir SAARE destination
   * writes, sabse aakhir me source removes. Isse beech me kuch fail ho to
   * source poora salamat rehta hai aur retry saaf chalta hai. Har step
   * idempotent hai, isliye dobara chalane par kuch bigadta nahi.
   */
  private async processCard(row: MarkerMoveRow, ctx: any, state: any) {
    let zone = ctx.zone;
    let lineFrom = ctx.lineFrom;
    let lineTo = ctx.lineTo;
    let cardNo = row.cardNo;

    let data = ctx.cardDataByNo[cardNo];
    if (data == null) {
      throw new Error("card data not found");
    }

    // ---------- IMAGE ----------
    // Har marker ki image nahi hoti. Image na mile to card phir bhi move hoga,
    // bas row par flag lag jayega. Network/upload fail par card skip hoga.
    if (row.markerNo != "" && row.oldImage != "") {
      row.failedStep = "Image Copy";
      let city = this.moveHelper.getImageCity(this.cityName);
      let pathOld = city + "/MarkingSurveyImages/" + zone + "/" + lineFrom + "/" + row.oldImage;
      let pathNew = city + "/MarkingSurveyImages/" + zone + "/" + lineTo + "/" + row.newImage;
      try {
        await this.moveHelper.copyImageWithRetry(pathOld, pathNew, this.run);
        row.imageMissing = false;
      } catch (e) {
        if (!this.moveHelper.isImageMissingError(e)) {
          throw e;
        }
        row.imageMissing = true;
      }
    } else if (row.markerNo != "") {
      row.imageMissing = true;
    }

    // ---------- READS ----------
    let markerObj: any = null;
    if (row.markerNo != "") {
      row.failedStep = "Marker Read";
      markerObj = await this.moveHelper.readOnce(this.db,
        "EntityMarkingData/MarkedHouses/" + zone + "/" + lineFrom + "/" + row.markerNo);
      if (markerObj != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveHouseData", markerObj);
      }
    }

    data["line"] = lineTo;
    let mobile = (data["mobile"] != null) ? data["mobile"] : "";
    state.mobile = mobile;

    // latLng purane code me bina null check ke .toString() hota tha - ek bhi
    // card ka latLng missing hone par poora move wahin crash ho jata tha
    let latLng = "";
    if (data["latLng"] != null) {
      latLng = data["latLng"].toString().replace("(", "").replace(")", "");
    }

    // ---------- DESTINATION WRITES ----------
    row.failedStep = "House Write";
    state.destHouseWritten = true;
    await this.moveHelper.dbSet(this.db, "Houses/" + zone + "/" + lineTo + "/" + cardNo, data);

    row.failedStep = "Card Ward Mapping";
    await this.moveHelper.dbSet(this.db, "CardWardMapping/" + cardNo, { line: lineTo, ward: zone });
    if (mobile != "") {
      await this.moveHelper.dbSet(this.db, "HouseWardMapping/" + mobile, { line: lineTo, ward: zone });
    }

    if (markerObj != null) {
      row.failedStep = "Marker Write";
      markerObj["image"] = row.newImage;             // purane code jaisa - hamesha set hota hai
      if (latLng != "") {
        markerObj["latLng"] = latLng;
      }
      state.destMarkerWritten = true;
      await this.moveHelper.dbUpdate(this.db,
        "EntityMarkingData/MarkedHouses/" + zone + "/" + lineTo + "/" + row.newKey, markerObj);

      // markerID nikalne ka logic bilkul purane code jaisa hi rakha gaya hai
      row.failedStep = "Ward Mapping";
      let markerID = "";
      if (markerObj["markerId"] != null) {
        markerID = cardNo;
      }
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
    }

    // ---------- SOURCE REMOVES (sabse aakhir me) ----------
    row.failedStep = "Source Cleanup";
    state.cleanupStarted = true;
    await this.moveHelper.dbRemove(this.db, "Houses/" + zone + "/" + lineFrom + "/" + cardNo);
    if (markerObj != null) {
      await this.moveHelper.dbRemove(this.db,
        "EntityMarkingData/MarkedHouses/" + zone + "/" + lineFrom + "/" + row.markerNo);
    }

    row.failedStep = "";
  }

  /**
   * Card beech me fail hua to destination par likhi gayi aadhi entries hata
   * kar purani haalat wapas laata hai. Sirf tab chalta hai jab source se abhi
   * kuch delete nahi hua - warna data hi chala jayega.
   */
  private async rollbackDestination(row: MarkerMoveRow, ctx: any, state: any) {
    try {
      if (state.destHouseWritten) {
        await this.moveHelper.dbRemove(this.db, "Houses/" + ctx.zone + "/" + ctx.lineTo + "/" + row.cardNo);
        await this.moveHelper.dbSet(this.db, "CardWardMapping/" + row.cardNo, { line: ctx.lineFrom, ward: ctx.zone });
        if (state.mobile != "") {
          await this.moveHelper.dbSet(this.db, "HouseWardMapping/" + state.mobile, { line: ctx.lineFrom, ward: ctx.zone });
        }
      }
      if (state.destMarkerWritten) {
        await this.moveHelper.dbRemove(this.db,
          "EntityMarkingData/MarkedHouses/" + ctx.zone + "/" + ctx.lineTo + "/" + row.newKey);
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
    if (this.moveRunning || this.moveContext == null) {
      return;
    }
    let failedCardNos = this.moveRows.filter(r => r.status == "failed").map(r => r.cardNo);
    if (failedCardNos.length == 0) {
      return;
    }
    await this.startMove(this.moveContext.lineFrom, this.moveContext.lineTo, this.moveContext.selection, failedCardNos);
  }

  onCancelMove() {
    if (!this.moveRunning) {
      return;
    }
    this.cancelRequested = true;
    this.moveSummary.waitingForNetwork = false;
    this.moveSummary.statusText = "Cancel request भेज दी गई, चल रहे cards पूरे होते ही रुक जाएगा...";
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
  showWardLine(checkBox: any) {
    if (checkBox.checked && this.selectedZone) {
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
    }
  }
  resetMap = () => {
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
