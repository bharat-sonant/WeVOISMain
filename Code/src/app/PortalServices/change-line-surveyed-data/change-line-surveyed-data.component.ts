import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "angularfire2/storage";
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { MoveHelperService, MoveRun } from '../../services/common/move-helper.service';
import { MarkerMoveRow, MarkerMoveSummary } from '../marker-move-progress/marker-move-progress.component';
import { MarkerMappingService } from '../../services/marker/marker-mapping.service';

@Component({
  selector: 'app-change-line-surveyed-data',
  templateUrl: './change-line-surveyed-data.component.html',
  styleUrls: ['./change-line-surveyed-data.component.scss']
})
export class ChangeLineSurveyedDataComponent implements OnInit, OnDestroy {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, private storage: AngularFireStorage, public moveHelper: MoveHelperService, private modalService: NgbModal, private markerMapping: MarkerMappingService) { }

  // NEW PATH helpers - record ab MarkersData/{uid} par hai aur line par uska
  // number LineWise batata hai.




  // Line/ward ki list ab MarkerMappingService se aati hai, jo WardWise aur
  // LineWise dono ka union leti hai. Pehle sirf LineWise padha jaata tha aur
  // wo node adhoora hai - un wards ki lines poori khaali dikhti thi.
  getNewPathLineData(wardNo: any, lineNo: any): Promise<any> {
    return this.markerMapping.getLineRecords(this.db, wardNo, lineNo);
  }

  getMarkerUid(ward: any, line: any, markerNo: any): Promise<any> {
    return this.markerMapping.getUid(this.db, ward, line, markerNo);
  }

  // Target line ka agla safe markerNo: LineSummary ka lastMarkerKey aur line ki
  // asli sabse badi key, dono me se bada.
  getSafeLastKey(ward: any, line: any): Promise<any> {
    return this.markerMapping.getSafeLastKey(this.db, ward, line);
  }

  cityName: any;
  db: any;
  public selectedZone: any;
  zoneList: any[];
  ddlZoneFrom = "#ddlZoneFrom";
  txtLineNoFrom = "#txtLineNoFrom";
  ddlZoneTo = "#ddlZoneTo";
  txtLineNoTo = "#txtLineNoTo";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";
  ddlZoneCount = "#ddlZoneCount";
  serviceName = "portal-service-change-line-surveyed-data";
  pageName = "Change-Line-Surveyed-Data";

  // ---- action history ----
  historySection = "PortalServices";
  historyPageKey = "ChangeLineSurveyData";
  private networkInterrupted = false;

  // ---- move progress state ----
  @ViewChild("moveProgressModal", { static: false }) moveProgressModal: TemplateRef<any>;
  private moveModalRef: NgbModalRef = null;
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

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", this.pageName, localStorage.getItem("userID"));
    this.setDefault();
  }

  ngOnDestroy() {
    this.cancelRequested = true;
    this.moveHelper.stopWatchingConnection();
    if (this.moveModalRef != null) {
      this.moveModalRef.dismiss();
      this.moveModalRef = null;
    }
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
    this.moveHelper.watchConnection(this.db);
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("allZoneList"));
  }

  // =====================================================================
  // MOVE PROGRESS POPUP
  // =====================================================================

  private openMoveModal() {
    if (this.moveModalRef != null) {
      return;
    }
    this.moveModalRef = this.modalService.open(this.moveProgressModal, {
      size: "lg",
      backdrop: "static",
      keyboard: false,
      windowClass: "house-move-modal"
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
      return;
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
  // UPDATE HOUSE LINE
  // =====================================================================

  async saveData() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "saveData");
    if ($(this.ddlZoneFrom).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone from !!!");
      return;
    }

    if ($(this.txtLineNoFrom).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter line no from !!!");
      return;
    }

    if ($(this.ddlZoneTo).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone to !!!");
      return;
    }

    if ($(this.txtLineNoTo).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter line no to !!!");
      return;
    }

    let zoneFrom = $(this.ddlZoneFrom).val();
    let lineFrom = $(this.txtLineNoFrom).val();
    let zoneTo = $(this.ddlZoneTo).val();
    let lineTo = $(this.txtLineNoTo).val();

    if (zoneFrom == zoneTo && lineFrom == lineTo) {
      this.commonService.setAlertMessage("error", "From और To एक ही हैं, move का कोई मतलब नहीं !!!");
      return;
    }

    await this.startMove(zoneFrom, lineFrom, zoneTo, lineTo, null);
  }

  /**
   * onlyCardNos = null  -> poori line ka move
   * onlyCardNos = [...] -> sirf pehle fail hue houses ka retry
   */
  private async startMove(zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, onlyCardNos: string[]) {
    if (this.moveRunning) {
      this.commonService.setAlertMessage("error", "एक move पहले से चल रहा है !!!");
      return;
    }

    this.cancelRequested = false;
    this.moveRunning = true;
    this.moveRows = [];
    this.moveSummary = this.getEmptySummary();
    this.moveSummary.running = true;
    this.moveSummary.fromZone = zoneFrom;
    this.moveSummary.fromLine = lineFrom;
    this.moveSummary.toZone = zoneTo;
    this.moveSummary.toLine = lineTo;
    this.openMoveModal();

    let action = (onlyCardNos != null) ? "RetryFailed" : "MoveHouseLine";
    let startTime = new Date();
    let originalStartKey: any = null;
    this.networkInterrupted = false;

    try {
      // ---------- 1. saara data padho ----------
      this.moveSummary.statusText = "डेटा पढ़ा जा रहा है...";
      await this.moveHelper.waitForNetwork(this.run);

      let houseData = await this.moveHelper.readOnceWithRetry(this.db, "Houses/" + zoneFrom + "/" + lineFrom, this.run);
      if (houseData == null) {
        this.commonService.setAlertMessage("error", "No house find in selected ward and lines !!!");
        await this.saveMoveHistory(action, "aborted", startTime, zoneFrom, lineFrom, zoneTo, lineTo, null, "source line par koi house nahi mila");
        this.finishRun();
        return;
      }
      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", houseData);

      let cardNoList = this.buildCardList(houseData, onlyCardNos);
      if (cardNoList.length == 0) {
        this.commonService.setAlertMessage("error", "move करने लायक कोई house नहीं मिला।");
        await this.saveMoveHistory(action, "aborted", startTime, zoneFrom, lineFrom, zoneTo, lineTo, null, "move karne layak koi house nahi mila");
        this.finishRun();
        return;
      }

      // NEW PATH: lastMarkerKey LineSummary par. getSafeLastKey line ki asli
      // sabse badi key bhi dekh leta hai, warna naye marker ko wahi number mil
      // sakta hai jo pehle se kisi ke paas ho.
      let safeLastKey = Number(await this.getSafeLastKey(zoneTo, lineTo));
      if (isNaN(safeLastKey)) { safeLastKey = 0; }
      let startKey = safeLastKey + 1;
      originalStartKey = startKey;

      let markerData = await this.getNewPathLineData(zoneFrom, lineFrom);
      let markerByCard = this.buildMarkerIndex(markerData);
      // markerNo -> uid. Record ke andar uid hota nahi, aur naye path par har
      // node ki key uid hi hai - backup restore layak tabhi hai jab uid saath ho.
      let lineLinks = await this.markerMapping.readLineLinks(this.db, zoneFrom, lineFrom);

      // ---------- 2. backup pehle, uske baad hi move ----------
      this.moveSummary.statusText = "Backup सेव हो रहा है...";
      let now = new Date();
      let filePath = this.moveHelper.buildBackupFilePath(this.pageName, now);
      let fileName = this.moveHelper.buildBackupFileName(zoneFrom, lineFrom, zoneTo, lineTo, (onlyCardNos != null ? "_retry" : ""), now);
      let backupData = this.buildBackupData(houseData, markerData, lineLinks, startKey, zoneFrom, lineFrom, zoneTo, lineTo, cardNoList.length, now);

      try {
        await this.moveHelper.saveBackupWithRetry(backupData, fileName, filePath, this.run);
      } catch (e) {
        let reason = (e && e.message) ? e.message : e;
        this.commonService.setAlertMessage("error", "Backup सेव नहीं हो पाया, move रद्द कर दिया गया। (" + reason + ")");
        this.moveSummary.statusText = "Backup फेल हुआ - move शुरू ही नहीं हुआ। डेटाबेस में कुछ नहीं बदला।";
        await this.saveMoveHistory(action, "aborted", startTime, zoneFrom, lineFrom, zoneTo, lineTo, originalStartKey, "backup fail: " + reason);
        this.finishRun();
        return;
      }
      this.moveSummary.backupFile = filePath + fileName;

      // ---------- 3. rows ----------
      this.moveRows = this.buildRows(houseData, markerData, markerByCard, cardNoList, zoneFrom, lineFrom, zoneTo, lineTo);
      this.moveSummary.total = this.moveRows.length;
      this.moveSummary.pending = this.moveRows.length;

      this.moveContext = {
        zoneFrom: zoneFrom, lineFrom: lineFrom, zoneTo: zoneTo, lineTo: lineTo,
        houseData: houseData, markerData: markerData, startKey: startKey
      };

      // ---------- 4. move ----------
      await this.runMoveLoop(this.moveContext);

      // ---------- 5. destination ka lastMarkerKey ----------
      // Purane code jaisa hi vyavhaar: har house ek key consume karta hai chahe
      // uska marker ho ya na ho, aur ant me start + count likha jata hai.
      this.moveSummary.statusText = "Last marker key अपडेट हो रही है...";
      await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkersMapping/LineSummary/" + zoneTo + "/" + lineTo,
        { lastMarkerKey: this.moveContext.startKey + this.moveRows.length });

      let status = "success";
      if (this.cancelRequested) { status = "cancelled"; }
      else if (this.moveSummary.failed > 0) { status = "partial"; }
      await this.saveMoveHistory(action, status, startTime, zoneFrom, lineFrom, zoneTo, lineTo, originalStartKey, "");

      if (this.cancelRequested) {
        this.moveSummary.statusText = "Move रद्द कर दिया गया। जो move हो चुके वे सुरक्षित हैं, बाकी source पर ही हैं।";
        this.commonService.setAlertMessage("error", "Move रद्द कर दिया गया। " + this.moveSummary.moved + " houses move हो चुके थे।");
      } else if (this.moveSummary.failed > 0) {
        this.moveSummary.statusText = this.moveSummary.failed + " houses फेल हुए। नीचे table में कारण देखें, फिर 'Retry Failed' दबाएँ।";
        this.commonService.setAlertMessage("error", this.moveSummary.failed + " houses have some issue to be processed, Please try again.");
      } else {
        this.moveSummary.statusText = "Line का डेटा सफलतापूर्वक move हो गया।";
        if (this.moveSummary.imageMissing > 0) {
          this.moveSummary.statusText = this.moveSummary.statusText + " (" + this.moveSummary.imageMissing + " markers की image Storage में नहीं मिली - डेटा move हो गया है।)";
        }
        this.commonService.setAlertMessage("success", "Line data moved successfully");
      }
    } catch (e) {
      let reason = (e && e.message) ? e.message : e;
      this.moveSummary.statusText = "Move रोक दिया गया: " + reason;
      this.commonService.setAlertMessage("error", "Move में समस्या आ गई: " + reason);
      await this.saveMoveHistory(action, "error", startTime, zoneFrom, lineFrom, zoneTo, lineTo, originalStartKey, "" + reason);
    }

    this.finishRun();
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

  private finishRun() {
    this.moveRunning = false;
    this.moveSummary.running = false;
    this.moveSummary.waitingForNetwork = false;
    $(this.divLoader).hide();
    if (this.moveSummary.total == 0) {
      this.closeMoveModal();
    }
  }

  /** Houses/{zone}/{line} ke keys hi card numbers hain. */
  private buildCardList(houseData: any, onlyCardNos: string[]): string[] {
    let list: string[] = [];
    let keyArray = Object.keys(houseData);
    for (let i = 0; i < keyArray.length; i++) {
      let cardNo = keyArray[i];
      if (houseData[cardNo] == null || typeof houseData[cardNo] != "object") {
        continue;
      }
      if (onlyCardNos != null && onlyCardNos.indexOf(cardNo) < 0) {
        continue;
      }
      list.push(cardNo);
    }
    return list;
  }

  /** cardNumber -> markerNo, taaki har house ka marker turant mil jaye. */
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

  private buildRows(houseData: any, markerData: any, markerByCard: any, cardNoList: string[], zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any): MarkerMoveRow[] {
    let rows: MarkerMoveRow[] = [];
    for (let i = 0; i < cardNoList.length; i++) {
      let cardNo = cardNoList[i];
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
        fromZone: zoneFrom,
        fromLine: lineFrom,
        toZone: zoneTo,
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
   * Move me Houses, CardWardMapping, HouseWardMapping, marker ka record +
   * mapping, aur MarkerWardMapping badalte hain - sabka purana roop backup me
   * jata hai.
   *
   * Marker ka hissa uid ke hisaab se jaata hai (markersData / lineWise /
   * markerWise / wardWise). Pehle `markedHouses` jaata tha jiski key markerNo
   * thi - wo tab tak sahi tha jab tak record MarkedHouses/{ward}/{line} par
   * rehta tha; naye path par wo file kahin import hi nahi hoti thi.
   */
  private buildBackupData(houseData: any, markerData: any, lineLinks: any, startKey: any, zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, itemCount: number, now: Date): any {
    let cardWardMapping = {};
    let houseWardMapping = {};
    let cardKeys = Object.keys(houseData);
    for (let i = 0; i < cardKeys.length; i++) {
      let cardNo = cardKeys[i];
      if (houseData[cardNo] == null || typeof houseData[cardNo] != "object") {
        continue;
      }
      cardWardMapping[cardNo] = { line: lineFrom, ward: zoneFrom };
      let mobile = houseData[cardNo]["mobile"];
      if (mobile != null && mobile != "") {
        houseWardMapping[mobile] = { line: lineFrom, ward: zoneFrom };
      }
    }
    let markerBackup = this.markerMapping.buildLineBackup(lineLinks, markerData);
    let meta = this.moveHelper.buildBackupMeta(this.pageName, this.cityName, zoneFrom, lineFrom, zoneTo, lineTo, itemCount, now);
    meta["destinationStartKey"] = startKey;
    meta["restorePaths"] = this.markerMapping.buildRestoreNotes(zoneFrom, lineFrom);
    // jo marker file me nahi gaye - chupchaap chhoot na jaayein
    meta["skippedNoUid"] = markerBackup.skippedNoUid;
    meta["orphanLinks"] = markerBackup.orphanLinks;
    return {
      meta: meta,
      houses: houseData,
      markersData: markerBackup.markersData,
      lineWise: markerBackup.lineWise,
      markerWise: markerBackup.markerWise,
      wardWise: markerBackup.wardWise,
      cardWardMapping: cardWardMapping,
      houseWardMapping: houseWardMapping
    };
  }

  // =====================================================================
  // MOVE LOOP
  // =====================================================================

  /**
   * Houses ek doosre se independent hain - har house apne alag paths par
   * likhta hai (apna cardNo, apna markerNo, apni key). Keys pehle allocate
   * kar dete hain, phir N houses saath-saath chal sakte hain bina race ke.
   */
  private async runMoveLoop(ctx: any) {
    // Purane code jaisa hi: har house ek key consume karta hai, chahe uska
    // marker ho ya na ho. Isse numbering bilkul pehle jaisi rehti hai.
    for (let i = 0; i < this.moveRows.length; i++) {
      let row = this.moveRows[i];
      let key = ctx.startKey + i;
      row.newKey = key;
      row.newMarkerNo = (row.markerNo != "") ? ("" + key) : "";
      // NEW PATH: image ka naam kabhi nahi badalta - wo AllMarkerImages me
      // {uid}.jpg par padi rehti hai. Old path me har line ka apna folder tha
      // isliye wahan naye markerNo se naya naam banana padta tha.
      let markerRecord = (row.markerNo != "" && ctx.markerData != null) ? ctx.markerData[row.markerNo] : null;
      let imgRef = (markerRecord != null && markerRecord["imgRef"] != null) ? markerRecord["imgRef"] : row.oldImage;
      row.newImage = (row.markerNo != "") ? imgRef : "";
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
        destHouseWritten: false,
        destMarkerWritten: false,
        mappingWritten: false,
        cleanupStarted: false,
        markerID: "",
        mobile: ""
      };

      try {
        await this.processHouse(row, ctx, state);
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
          continue;                                  // wahi house, wahi key
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
          row.error = row.error + " (source cleanup अधूरा - इस house को manually जाँच लें)";
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
      return;
    }
    let done = this.moveSummary.moved + this.moveSummary.failed;
    this.moveSummary.statusText = done + " / " + this.moveSummary.total + " houses हो चुके - "
      + this.moveHelper.CONCURRENCY + " एक साथ चल रहे हैं...";
  }

  /**
   * Ek house ka poora move. Order: pehle SAARE reads + image, phir SAARE
   * destination writes, sabse aakhir me source removes. Isse beech me kuch
   * fail ho to source poora salamat rehta hai aur retry saaf chalta hai.
   * Har step idempotent hai, isliye dobara chalane par kuch bigadta nahi.
   */
  private async processHouse(row: MarkerMoveRow, ctx: any, state: any) {
    let zoneFrom = ctx.zoneFrom;
    let lineFrom = ctx.lineFrom;
    let zoneTo = ctx.zoneTo;
    let lineTo = ctx.lineTo;
    let cardNo = row.cardNo;

    let houseObj = ctx.houseData[cardNo];
    if (houseObj == null) {
      throw new Error("house data not found");
    }

    // ---------- IMAGE ----------
    // NEW PATH me image copy karne ki zaroorat hi nahi - wo global folder
    // AllMarkerImages/{uid}.jpg par padi rehti hai aur marker kahin bhi jaaye
    // uska naam wahi rehta hai. Old path me har line ka apna folder tha, isliye
    // har move par file copy karni padti thi.
    if (row.markerNo != "") {
      row.imageMissing = (row.newImage == "");
    }

    // ---------- READS ----------
    // Marker ki asli pehchaan uid hai. uid na mile to house phir bhi move
    // hoga, bas marker chhut jayega - purane code me bhi markerObj null par
    // yahi hota tha.
    let markerObj: any = null;
    let uid: any = null;
    if (row.markerNo != "") {
      row.failedStep = "Marker Read";
      uid = await this.getMarkerUid(zoneFrom, lineFrom, row.markerNo);
      if (uid != null) {
        markerObj = await this.moveHelper.readOnce(this.db, "EntityMarkingData/MarkersData/" + uid);
        if (markerObj != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveHouseData", markerObj);
        }
      }
    }
    state.uid = uid;

    // house ka data taiyaar
    let data = houseObj;
    data["line"] = lineTo;
    data["ward"] = zoneTo;
    let mobile = (data["mobile"] != null) ? data["mobile"] : "";
    state.mobile = mobile;

    // latLng purane code me bina null check ke .toString() hota tha - ek bhi
    // house ka latLng missing hone par poora move wahin crash ho jata tha
    let latLng = "";
    if (data["latLng"] != null) {
      latLng = data["latLng"].toString().replace("(", "").replace(")", "");
    }

    // ---------- DESTINATION WRITES ----------
    row.failedStep = "House Write";
    state.destHouseWritten = true;
    await this.moveHelper.dbSet(this.db, "Houses/" + zoneTo + "/" + lineTo + "/" + cardNo, data);

    row.failedStep = "Card Ward Mapping";
    await this.moveHelper.dbSet(this.db, "CardWardMapping/" + cardNo, { line: lineTo, ward: zoneTo });
    if (mobile != "") {
      await this.moveHelper.dbSet(this.db, "HouseWardMapping/" + mobile, { line: lineTo, ward: zoneTo });
    }

    if (markerObj != null) {
      // NEW PATH: record apni hi jagah rehta hai - sirf ward/line badalte hain
      // aur mapping nayi jagah point karne lagti hai.
      row.failedStep = "Marker Write";
      let lineVal = this.markerMapping.lineValue(lineTo);
      // Rollback ke liye purani move-stamp sambhal lo. Marker pehle bhi move
      // hua ho sakta hai - is move ke fail hone par uska pichhla record mitna
      // nahi chahiye, isliye null karne ki jagah purani value wapas likhte hain.
      state.prevMoved = {
        movedFromWard: (markerObj["movedFromWard"] != null) ? markerObj["movedFromWard"] : null,
        movedFromLine: (markerObj["movedFromLine"] != null) ? markerObj["movedFromLine"] : null,
        movedFromMarkerNo: (markerObj["movedFromMarkerNo"] != null) ? markerObj["movedFromMarkerNo"] : null,
        movedOn: (markerObj["movedOn"] != null) ? markerObj["movedOn"] : null
      };
      let patch: any = {
        ward: zoneTo,
        line: lineVal,
        markerNo: Number(row.newKey) || 0,
        image: row.newImage,                       // purane code jaisa - hamesha set hota hai
        movedFromWard: zoneFrom,
        movedFromLine: this.markerMapping.lineValue(lineFrom),
        movedFromMarkerNo: this.markerMapping.markerNoValue(row.markerNo),
        movedOn: this.commonService.getTodayDateTime()
      };
      if (latLng != "") {
        patch["latLng"] = latLng;
      }
      state.destMarkerWritten = true;
      await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkersData/" + uid, patch);

      // Teeno mapping ek saath. Ward badla ho to purane ward ki WardWise entry
      // bhi hatani padti hai, warna marker dono wards me dikhega.
      state.destMappingWritten = true;
      await this.markerMapping.writePlace(this.db, uid, zoneTo, lineVal, row.newKey);
      if (String(zoneFrom) != String(zoneTo)) {
        await this.moveHelper.dbRemove(this.db, "EntityMarkingData/MarkersMapping/WardWise/" + zoneFrom + "/" + uid);
      }

      // Har move ka permanent record: MoveHistory/{uid}.
      // Push key turant chahiye (ThenableReference par .key sync milti hai) -
      // move aage jaakar fail hua to rollback isi key se entry hata sake.
      let moveRef = this.markerMapping.recordMove(this.db, uid, zoneFrom, lineFrom, row.markerNo, zoneTo, lineTo, row.newKey);
      state.moveHistoryKey = (moveRef != null && moveRef.key != null) ? moveRef.key : "";
      await moveRef;

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
          markerkey: state.uid,
          line: lineTo.toString(),
          markerNo: row.newKey.toString(),
          ward: zoneTo
        });
      }
    }

    // ---------- SOURCE REMOVES (sabse aakhir me) ----------
    row.failedStep = "Source Cleanup";
    state.cleanupStarted = true;
    await this.moveHelper.dbRemove(this.db, "Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo);
    if (markerObj != null) {
      // NEW PATH: record hataana nahi - sirf purani line ki LineWise entry,
      // warna marker purani aur nayi dono line par dikhta rahega.
      await this.moveHelper.dbRemove(this.db, "EntityMarkingData/MarkersMapping/LineWise/" + zoneFrom + "/" + lineFrom + "/" + row.markerNo);
      this.markerMapping.clearLinkCache();
    }

    row.failedStep = "";
  }

  /**
   * House beech me fail hua to destination par likhi gayi aadhi entries hata
   * kar purani haalat wapas laata hai. Sirf tab chalta hai jab source se abhi
   * kuch delete nahi hua - warna data hi chala jayega.
   */
  private async rollbackDestination(row: MarkerMoveRow, ctx: any, state: any) {
    try {
      if (state.destHouseWritten) {
        await this.moveHelper.dbRemove(this.db, "Houses/" + ctx.zoneTo + "/" + ctx.lineTo + "/" + row.cardNo);
        await this.moveHelper.dbSet(this.db, "CardWardMapping/" + row.cardNo, { line: ctx.lineFrom, ward: ctx.zoneFrom });
        if (state.mobile != "") {
          await this.moveHelper.dbSet(this.db, "HouseWardMapping/" + state.mobile, { line: ctx.lineFrom, ward: ctx.zoneFrom });
        }
      }
      // NEW PATH: record delete nahi karna - wo MarkersData par hai aur wahi
      // asli data hai. Marker ko wapas purani jagah point kara dete hain aur
      // nayi line ki LineWise entry hata dete hain.
      if (state.destMappingWritten && state.uid != null) {
        await this.markerMapping.writePlace(this.db, state.uid, ctx.zoneFrom,
          this.markerMapping.lineValue(ctx.lineFrom), row.markerNo);
        if (String(ctx.zoneFrom) != String(ctx.zoneTo)) {
          await this.moveHelper.dbRemove(this.db, "EntityMarkingData/MarkersMapping/WardWise/" + ctx.zoneTo + "/" + state.uid);
        }
        await this.moveHelper.dbRemove(this.db,
          "EntityMarkingData/MarkersMapping/LineWise/" + ctx.zoneTo + "/" + ctx.lineTo + "/" + row.newKey);
        // Cache mapping badalne ke BAAD saaf hoti hai. writePlace() upar ek baar
        // clear kar chuka hai, par uske baad ye removal hua - to dobara clear
        // karna zaroori hai, warna beech me aayi koi read purani list rakh leti.
        this.markerMapping.clearLinkCache();
      }
      if (state.destMarkerWritten && state.uid != null) {
        // move-stamp wapas purani haalat par - is move ki stamp hatani hai par
        // pichhle successful move ki stamp bachani hai.
        let undo: any = {
          ward: ctx.zoneFrom,
          line: this.markerMapping.lineValue(ctx.lineFrom),
          markerNo: this.markerMapping.markerNoValue(row.markerNo),
          movedFromWard: null,
          movedFromLine: null,
          movedFromMarkerNo: null,
          movedOn: null
        };
        if (state.prevMoved != null) {
          undo["movedFromWard"] = state.prevMoved.movedFromWard;
          undo["movedFromLine"] = state.prevMoved.movedFromLine;
          undo["movedFromMarkerNo"] = state.prevMoved.movedFromMarkerNo;
          undo["movedOn"] = state.prevMoved.movedOn;
        }
        await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkersData/" + state.uid, undo);
      }
      // MoveHistory ki entry bhi hatani hai. Marker hila hi nahi, phir bhi
      // history "line X se line Y" dikhati rehti thi, aur retry successful
      // hone par usi ek move ki do entries chadh jaati thi.
      if (state.moveHistoryKey != null && state.moveHistoryKey != "" && state.uid != null) {
        await this.moveHelper.dbRemove(this.db,
          this.markerMapping.moveRecordPath(state.uid, state.moveHistoryKey));
      }
      if (state.mappingWritten && state.markerID != "") {
        await this.moveHelper.dbUpdate(this.db, "EntityMarkingData/MarkerWardMapping/" + state.markerID, {
          markerkey: state.uid,
          line: ctx.lineFrom.toString(),
          markerNo: row.markerNo.toString(),
          ward: ctx.zoneFrom
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
    await this.startMove(this.moveContext.zoneFrom, this.moveContext.lineFrom, this.moveContext.zoneTo, this.moveContext.lineTo, failedCardNos);
  }

  onCancelMove() {
    if (!this.moveRunning) {
      return;
    }
    this.cancelRequested = true;
    this.moveSummary.waitingForNetwork = false;
    this.moveSummary.statusText = "Cancel request भेज दी गई, चल रहे houses पूरे होते ही रुक जाएगा...";
  }

  // =====================================================================
  // BAAKI PAGE SERVICES (pehle jaisi - inme koi badlav nahi)
  // =====================================================================

  updateCardLineData() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCardLineData");
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone from !!!");
      return;
    }
    let zoneNo = $(this.ddlZone).val();
    let historyStart = new Date();
    let mappingCount = 0;
    let dbPath = "Houses/" + zoneNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        if (houseData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCardLineData", houseData);
          let keyArray = Object.keys(houseData);
          if (keyArray.length > 0) {
            let count = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let line = keyArray[i];
              let cardObj = houseData[line];
              let cardKeyArray = Object.keys(cardObj);
              for (let j = 0; j < cardKeyArray.length; j++) {
                count++;
                let cardNo = cardKeyArray[j];
                dbPath = "CardWardMapping/" + cardNo;
                this.db.object(dbPath).update({ line: line, ward: zoneNo });
                mappingCount = mappingCount + 1;
              }
            }
          }
        }
        this.commonService.setAlertMessage("success", "Card line mapping updated !!!");
        this.saveSimpleHistory("UpdateCardLineMapping", "success", historyStart, { ward: zoneNo, mappingUpdated: mappingCount });
      }
    );
  }

  updateSurveyCount() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateSurveyCount");
    if ($(this.ddlZoneCount).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone from !!!");
      return;
    }
    let zoneNo = $(this.ddlZoneCount).val();
    let historyStart = new Date();
    let dbPath = "Houses/" + zoneNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        if (houseData != null) {
          let keyArray = Object.keys(houseData);
          if (keyArray.length > 0) {
            let totalHouseHoldCount = 0;
            let totalComplexCount = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let line = keyArray[i];
              let houseHoldCount = 0;
              let complexCount = 0;
              let cardObj = houseData[line];
              let cardKeyArray = Object.keys(cardObj);
              for (let j = 0; j < cardKeyArray.length; j++) {
                let cardNo = cardKeyArray[j];
                if (cardObj[cardNo]["houseType"] == "19" || cardObj[cardNo]["houseType"] == "20") {
                  complexCount++;
                  totalComplexCount++;
                  if (cardObj[cardNo]["Entities"] != null) {

                    houseHoldCount = houseHoldCount + (cardObj[cardNo]["Entities"].length - 1);
                    totalHouseHoldCount = totalHouseHoldCount + (cardObj[cardNo]["Entities"].length - 1);
                  }
                }
              }
              let dbHouseHoldPath = "EntityMarkingData/MarkersMapping/LineSummary/" + zoneNo + "/" + line;
              this.db.object(dbHouseHoldPath).update({ houseHoldCount: houseHoldCount, complexCount: complexCount });
            }

            let dbTotalHouseHoldCountPath = "EntitySurveyData/TotalHouseHoldCount/";
            let houseHoldInstance = this.db.object(dbTotalHouseHoldCountPath).valueChanges().subscribe(data => {
              houseHoldInstance.unsubscribe();
              let houseHoldData = {};
              if (data != null) {
                houseHoldData = data;
              }
              houseHoldData[zoneNo.toString()] = totalHouseHoldCount;
              this.db.object(dbTotalHouseHoldCountPath).update(houseHoldData);
              let dbTotalComplexCountPath = "EntitySurveyData/TotalComplexCount/";
              let complexInstance = this.db.object(dbTotalComplexCountPath).valueChanges().subscribe(complexData => {
                complexInstance.unsubscribe();
                let complexCountData = {};
                if (complexData != null) {
                  complexCountData = complexData;
                }
                complexCountData[zoneNo.toString()] = totalComplexCount;
                this.db.object(dbTotalComplexCountPath).update(complexCountData);
                this.commonService.setAlertMessage("success", "Card house hold count updated !!!");
                this.saveSimpleHistory("UpdateHouseHoldCounts", "success", historyStart, { ward: zoneNo, houseHoldCount: totalHouseHoldCount, complexCount: totalComplexCount });
              });
            });

          }
        }
      }
    );
  }


  private wardJsonStart: Date = null;

  updateWardWiseCard() {
    this.wardJsonStart = new Date();
    $(this.divLoader).show();
    this.getWardWiseCards(1);
  }

  getWardWiseCards(index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardWiseCards");
    if (index == this.zoneList.length) {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("success", "Ward wise JSON updated successfully !!!");
      this.saveSimpleHistory("UpdateWardWiseCardJson", "success", (this.wardJsonStart != null ? this.wardJsonStart : new Date()), { wardCount: this.zoneList.length - 1 });
    }
    else {
      let zoneNo = this.zoneList[index]["zoneNo"];
      let dbPath = "Houses/" + zoneNo;
      let instance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          instance.unsubscribe();
          let houseCounts = 0;
          if (data != null) {
            let cardList = [];
            let lineArray = Object.keys(data);
            if (lineArray.length > 0) {
              for (let i = 0; i < lineArray.length; i++) {
                let lineNo = lineArray[i];
                let houseData = data[lineNo];
                let houseArray = Object.keys(houseData);
                for (let j = 0; j < houseArray.length; j++) {
                  let cardNo = houseArray[j];
                  let entityType = "1";
                  let amount = 0;
                  if (houseData[cardNo]["houseType"] != null) {
                    entityType = houseData[cardNo]["houseType"];
                  }
                  cardList.push({ cardNo: cardNo, entityType: entityType });
                }
                houseCounts = houseCounts + houseArray.length;
              }
            }
            let fileName = zoneNo + ".json";
            let filePath = "/WardWiseCardJSON/";
            this.commonService.saveJsonFile(cardList, fileName, filePath);
            index++;
            this.getWardWiseCards(index);
          }
          else {
            index++;
            this.getWardWiseCards(index);
          }
        }
      );
    }

  }
}
