import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { MoveHelperService } from '../../services/common/move-helper.service';
import { MarkerMoveRow, MarkerMoveSummary } from '../marker-move-progress/marker-move-progress.component';
import { MarkerMappingService } from '../../services/marker/marker-mapping.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-change-line-marker-data',
  templateUrl: './change-line-marker-data.component.html',
  styleUrls: ['./change-line-marker-data.component.scss']
})
export class ChangeLineMarkerDataComponent implements OnInit, OnDestroy {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal, public moveHelper: MoveHelperService, private markerMapping: MarkerMappingService, private router: Router, private route: ActivatedRoute) { }

  // "MOVE MARKER DATA TO NEW PATH" button ka handler.
  //
  // Ye function do baar gum ho chuka hai (28 Jul aur phir 13 Aug ke merge me):
  // HTML ka button apni jagah bana raha aur TS ka function doosri branch ki
  // file ke saath chala gaya. Button dabane par kuch hota hi nahi tha, aur
  // tsc bhi nahi pakadta kyunki wo HTML template check nahi karta.
  //
  // Route 3-segment hai - :cityId/:id/marker-data-move - isliye dono param
  // yahin se aage bheje jaate hain.
  goToMoveMarkerData() {
    let cityId = this.route.snapshot.paramMap.get("cityId");
    let id = this.route.snapshot.paramMap.get("id");
    this.router.navigate([cityId, id, "marker-data-move"]);
  }

  // NEW PATH helpers - record ab MarkersData/{uid} par hai aur line par uska
  // number LineWise batata hai. Ye purani {markerNo: record} shape lauta dete
  // hain, isliye baaki page waisa ka waisa chalta hai.




  // Line/ward ki list ab MarkerMappingService se aati hai, jo WardWise aur
  // LineWise dono ka union leti hai. Pehle sirf LineWise padha jaata tha aur
  // wo node adhoora hai - un wards ki lines poori khaali dikhti thi.
  // Marker ka data/mapping badalne par service ki cache purani pad jaati hai.
  // Ye page apne dbUpdate/dbRemove use karta hai (moveHelper ke nahi), isliye
  // wahi faisla yahan bhi rakha gaya hai.
  private clearMarkerCache(path: string) {
    if (path != null && (path.indexOf("MarkersData") >= 0 || path.indexOf("MarkersMapping") >= 0)) {
      this.markerMapping.clearLinkCache();
    }
  }

  getNewPathLineData(wardNo: any, lineNo: any): Promise<any> {
    return this.markerMapping.getLineRecords(this.db, wardNo, lineNo);
  }

  getNewPathWardData(wardNo: any): Promise<any> {
    return this.markerMapping.getWardRecords(this.db, wardNo);
  }

  getMarkerUid(ward: any, line: any, markerNo: any): Promise<any> {
    return this.markerMapping.getUid(this.db, ward, line, markerNo);
  }

  // Target line ka agla safe markerNo: LineSummary ka lastMarkerKey aur line ki
  // asli sabse badi key, dono me se bada.
  getSafeLastKey(ward: any, line: any): Promise<any> {
    return this.markerMapping.getSafeLastKey(this.db, ward, line);
  }

  @ViewChild("moveProgressModal", { static: false }) moveProgressModal: TemplateRef<any>;
  private moveModalRef: NgbModalRef = null;
  cityName: any;
  db: any;
  zoneList: any[] = [];
  ddlZoneFrom = "#ddlZoneFrom";
  ddlZoneMarker = "#ddlZoneMarker";
  txtLineNoFrom = "#txtLineNoFrom";
  ddlZoneTo = "#ddlZoneTo";
  txtLineNoTo = "#txtLineNoTo";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";
  serviceName = "portal-service-change-line-marker-data";
  pageName = "Change-Line-Marker-Data";

  // ---- action history (ActionHistory/{section}/{pageKey}/{date}) ----
  historySection = "PortalServices";
  historyPageKey = "ChangeLineMarkerData";
  private networkInterrupted = false;

  // ---- move progress state (bound to app-marker-move-progress) ----
  moveRows: MarkerMoveRow[] = [];
  moveSummary: MarkerMoveSummary = this.getEmptySummary();
  moveRunning = false;

  // ---- network state ----
  private fbConnected = true;
  private connectionInstance: any = null;
  private cancelRequested = false;

  // context of the last / current run, used by "Retry Failed"
  private moveContext: any = null;

  // tuning
  private readonly IMAGE_ATTEMPTS = 3;
  private readonly MAX_NETWORK_RETRIES = 10;
  // Kitne markers ek saath. Browser ek host par ~6 connections hi kholta hai
  // aur har marker me 1 image download + 1 upload hota hai, isliye 5 sweet
  // spot hai. Isse zyada karne par requests queue hone lagti hain aur
  // timeout/failure badhte hain - speed nahi badhti.
  private readonly MOVE_CONCURRENCY = 5;
  private readonly DB_TIMEOUT_MS = 20000;
  private readonly READ_TIMEOUT_MS = 30000;
  private readonly IMAGE_TIMEOUT_MS = 30000;
  private readonly BACKUP_TIMEOUT_MS = 60000;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", this.pageName, localStorage.getItem("userID"));
    this.setDefault();
  }

  ngOnDestroy() {
    this.cancelRequested = true;
    if (this.connectionInstance != null) {
      this.connectionInstance.unsubscribe();
      this.connectionInstance = null;
    }
    if (this.moveModalRef != null) {
      this.moveModalRef.dismiss();
      this.moveModalRef = null;
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
      windowClass: "marker-move-modal"
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

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getZones();
    this.watchConnection();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("allZoneList"));
  }

  getAllZones() {
    let hiddenList = [{ zone: "Beed-Tractor" }, { zone: "BinLifting" }, { zone: "Commercial" }, { zone: "Compactor" }, { zone: "FixedWages" }, { zone: "GarageWork" }, { zone: "GeelaKachra" }, { zone: "Maint" }, { zone: "Market" }, { zone: "SegregationWork" }, { zone: "UIT" }, { zone: "WetWaste" }, { zone: "mkt" }];
    console.log(hiddenList);
    this.zoneList.push({ zoneNo: "0", zoneName: "-- Select --" });
    let dbPath = "Tasks";
    let zoneInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      zoneInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let zone = keyArray[i];
          console.log(zone)
          let detail = hiddenList.find(item => zone.toString().includes(item.zone.toString()));
          console.log(detail);
          if (detail == undefined) {
            this.zoneList.push({ zoneNo: zone, zoneName: "Zone " + zone });
          }
        }
      }
    })
  }

  // =====================================================================
  // NETWORK DETECTION
  // =====================================================================

  /**
   * Firebase ka .info/connected node asli server connectivity batata hai.
   * navigator.onLine akela bharosemand nahi (router se juda ho par internet band ho
   * to bhi true deta hai), isliye dono ka AND liya jata hai.
   */
  private watchConnection() {
    try {
      this.connectionInstance = this.db.object(".info/connected").valueChanges().subscribe(
        value => { this.fbConnected = (value === true); },
        error => { this.fbConnected = true; }        // node na mile to navigator.onLine par chalega
      );
    } catch (e) {
      // agar ye node available na ho to sirf navigator.onLine par chalega
      this.fbConnected = true;
    }
  }

  private isOnline(): boolean {
    let browserOnline = true;
    if (typeof navigator != "undefined" && navigator.onLine != undefined) {
      browserOnline = navigator.onLine;
    }
    return browserOnline && this.fbConnected;
  }

  /**
   * Network wapas aane tak rukta hai. Cancel dabane par turant return karta hai.
   */
  private waitForNetwork(): Promise<void> {
    if (this.isOnline() || this.cancelRequested) {
      return Promise.resolve();
    }
    this.moveSummary.waitingForNetwork = true;
    this.networkInterrupted = true;                  // history me record hoga
    return new Promise<void>(resolve => {
      let timer = setInterval(() => {
        if (this.isOnline() || this.cancelRequested) {
          clearInterval(timer);
          this.moveSummary.waitingForNetwork = false;
          resolve();
        }
      }, 2000);
    });
  }

  /**
   * Network wali failure (retry karne layak) aur asli failure (skip karne layak) ka farq.
   */
  /**
   * "Image hai hi nahi" wali failure - ye retry karne layak bhi nahi hai aur
   * marker ko rokne layak bhi nahi. Permission (unauthorized) isme nahi aata,
   * wo asli problem hai.
   */
  private isImageMissingError(e: any): boolean {
    let code = (e && e.code) ? e.code : "";
    if (code == "storage/object-not-found") { return true; }
    let message = (e && e.message) ? e.message : "";
    return message == "HTTP 404";
  }

  private isNetworkError(e: any): boolean {
    let code = (e && e.code) ? e.code : "";
    if (code == "storage/object-not-found") { return false; }   // file hi nahi hai
    if (code == "storage/unauthorized") { return false; }       // permission
    if (code == "storage/canceled") { return false; }
    let message = (e && e.message) ? e.message : "";
    if (message == "network error" || message == "timeout" || message == "db-timeout") { return true; }
    if (code == "storage/retry-limit-exceeded") { return true; }
    return !this.isOnline();
  }

  // =====================================================================
  // GENERIC HELPERS
  // =====================================================================

  private delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  /**
   * Firebase RTDB ka write offline hone par reject nahi hota - anant kaal tak
   * pending rehta hai. Isliye har write/read par timeout lagana zaroori hai,
   * warna loop chup-chaap latak jata hai.
   */
  private withTimeout(promise: any, ms: number): Promise<any> {
    return Promise.race([
      Promise.resolve(promise),
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error("db-timeout")), ms);
      })
    ]);
  }

  private readOnce(path: string): Promise<any> {
    let readPromise = new Promise<any>(resolve => {
      let instance: any = null;
      let done = false;
      instance = this.db.object(path).valueChanges().subscribe(data => {
        if (done) { return; }
        done = true;
        if (instance != null) {
          instance.unsubscribe();
        } else {
          setTimeout(() => { if (instance != null) { instance.unsubscribe(); } }, 0);
        }
        resolve(data);
      });
    });
    return this.withTimeout(readPromise, this.READ_TIMEOUT_MS);
  }

  /** Move shuru hone se pehle wale reads ke liye - network girte hi poora
   *  move abort na ho, balki connection wapas aane par dobara try kare. */
  private async readOnceWithRetry(path: string): Promise<any> {
    let lastError: any = null;
    for (let attempt = 0; attempt < this.IMAGE_ATTEMPTS; attempt++) {
      if (this.cancelRequested) { throw new Error("cancelled"); }
      try {
        return await this.readOnce(path);
      } catch (e) {
        lastError = e;
        if (!this.isNetworkError(e)) {
          break;
        }
        await this.waitForNetwork();
        await this.delay(500 * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  private dbUpdate(path: string, data: any): Promise<any> {
    this.clearMarkerCache(path);
    return this.withTimeout(this.db.object(path).update(data), this.DB_TIMEOUT_MS);
  }

  private dbSet(path: string, data: any): Promise<any> {
    this.clearMarkerCache(path);
    return this.withTimeout(this.db.object(path).set(data), this.DB_TIMEOUT_MS);
  }

  private dbRemove(path: string): Promise<any> {
    this.clearMarkerCache(path);
    return this.withTimeout(this.db.object(path).remove(), this.DB_TIMEOUT_MS);
  }

  // =====================================================================
  // IMAGE COPY
  // =====================================================================

  /**
   * Raw XHR ko Promise me wrap karta hai. Purane code me onerror/ontimeout
   * handle nahi the, isliye network girte hi poori chain chup-chaap mar jati thi.
   * Saath me HTTP status check bhi hai - warna 403/404 ka error body hi
   * .jpg banakar upload ho jata tha.
   */
  private downloadBlob(url: string): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.responseType = "blob";
      xhr.timeout = this.IMAGE_TIMEOUT_MS;
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error("HTTP " + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error("network error"));
      xhr.ontimeout = () => reject(new Error("timeout"));
      xhr.onabort = () => reject(new Error("aborted"));
      xhr.open("GET", url);
      xhr.send();
    });
  }

  private async copyImage(pathOld: string, pathNew: string): Promise<void> {
    let storageRef = this.storage.storage.app.storage(this.commonService.fireStoragePath);
    let url = await storageRef.ref(pathOld).getDownloadURL();
    let blob = await this.downloadBlob(url);
    await storageRef.ref(pathNew).put(blob);
  }

  private async copyImageWithRetry(pathOld: string, pathNew: string): Promise<void> {
    let lastError: any = null;
    for (let attempt = 0; attempt < this.IMAGE_ATTEMPTS; attempt++) {
      if (this.cancelRequested) { throw new Error("cancelled"); }
      try {
        await this.copyImage(pathOld, pathNew);
        return;
      } catch (e) {
        lastError = e;
        if (!this.isNetworkError(e)) {
          break;                                   // file missing / permission - retry bekaar
        }
        await this.waitForNetwork();
        await this.delay(500 * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  // =====================================================================
  // BACKUP
  // =====================================================================

  private twoDigit(value: number): string {
    return ("0" + value).slice(-2);
  }

  /** 2026-08-03 */
  private getDateString(now: Date): string {
    return now.getFullYear() + "-" + this.twoDigit(now.getMonth() + 1) + "-" + this.twoDigit(now.getDate());
  }

  private buildBackupFileName(zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, suffix: string, now: Date): string {
    let time = this.twoDigit(now.getHours()) + this.twoDigit(now.getMinutes()) + this.twoDigit(now.getSeconds());
    return "Zone" + zoneFrom + "-Line" + lineFrom + "_to_Zone" + zoneTo + "-Line" + lineTo + "_" + time + suffix + ".json";
  }

  /** {city}/MovingBackUp/{pageName}/2026/August/2026-08-03/ */
  private buildBackupFilePath(now: Date): string {
    let year = now.getFullYear();
    let monthName = this.commonService.getCurrentMonthName(now.getMonth());
    let dateString = this.getDateString(now);
    return "/MovingBackUp/" + this.pageName + "/" + year + "/" + monthName + "/" + dateString + "/";
  }

  /**
   * Move se pehle source ka poora snapshot Storage par JSON me save karta hai.
   * saveJsonFile() upload shuru hote hi resolve kar deta hai (common.service.ts),
   * isliye actual UploadTask ka bhi await karna zaroori hai - warna backup
   * complete hue bina hi move shuru ho jayega.
   */
  private async saveBackupFile(backupData: any, fileName: string, filePath: string): Promise<void> {
    let task: any = await this.commonService.saveJsonFile(backupData, fileName, filePath);
    if (task != null && typeof task.then == "function") {
      await this.withTimeout(task, this.BACKUP_TIMEOUT_MS);
    }
  }

  private async saveBackupWithRetry(backupData: any, fileName: string, filePath: string): Promise<void> {
    let lastError: any = null;
    for (let attempt = 0; attempt < this.IMAGE_ATTEMPTS; attempt++) {
      if (this.cancelRequested) { throw new Error("cancelled"); }
      try {
        await this.saveBackupFile(backupData, fileName, filePath);
        return;
      } catch (e) {
        lastError = e;
        if (!this.isNetworkError(e)) {
          break;
        }
        await this.waitForNetwork();
        await this.delay(500 * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  /**
   * Backup me sirf markers kaafi nahi - move me Houses, RevisitRequest,
   * CardWardMapping aur HouseWardMapping bhi badalte hain, isliye unka
   * purana roop bhi save hota hai. Ye teen node-level reads me ho jata hai.
   *
   * Marker ka hissa uid ke hisaab se jaata hai (markersData / lineWise /
   * markerWise / wardWise). Pehle `markedHouses` jaata tha jiski key markerNo
   * thi - wo tab tak sahi tha jab tak record MarkedHouses/{ward}/{line} par
   * rehta tha; naye path par wo file kahin import hi nahi hoti thi.
   */
  private buildBackupData(markerData: any, lineLinks: any, houseData: any, revisitData: any, lastMarkerKey: any, zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, markerCount: number, now: Date): any {
    let cardWardMapping = {};
    let houseWardMapping = {};
    if (houseData != null) {
      let cardKeys = Object.keys(houseData);
      for (let i = 0; i < cardKeys.length; i++) {
        let cardNo = cardKeys[i];
        cardWardMapping[cardNo] = { line: lineFrom, ward: zoneFrom };
        let mobile = houseData[cardNo]["mobile"];
        if (mobile != null && mobile != "") {
          houseWardMapping[mobile] = { line: lineFrom, ward: zoneFrom };
        }
      }
    }
    let markerBackup = this.markerMapping.buildLineBackup(lineLinks, markerData);
    return {
      meta: {
        page: this.pageName,
        city: this.cityName,
        userId: localStorage.getItem("userID"),
        dateTime: this.getDateString(now)
          + " " + this.twoDigit(now.getHours()) + ":" + this.twoDigit(now.getMinutes()) + ":" + this.twoDigit(now.getSeconds()),
        from: { zone: zoneFrom, line: lineFrom },
        to: { zone: zoneTo, line: lineTo },
        totalMarkers: markerCount,
        destinationLastMarkerKey: lastMarkerKey,
        restorePaths: this.markerMapping.buildRestoreNotes(zoneFrom, lineFrom),
        // jo marker file me nahi gaye - chupchaap chhoot na jaayein
        skippedNoUid: markerBackup.skippedNoUid,
        orphanLinks: markerBackup.orphanLinks
      },
      markersData: markerBackup.markersData,
      lineWise: markerBackup.lineWise,
      markerWise: markerBackup.markerWise,
      wardWise: markerBackup.wardWise,
      houses: houseData,
      revisitRequests: revisitData,
      cardWardMapping: cardWardMapping,
      houseWardMapping: houseWardMapping
    };
  }

  // =====================================================================
  // MOVE - ENTRY POINT
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
   * onlyMarkerNos = null  -> poori line ka move
   * onlyMarkerNos = [...] -> sirf pehle fail hue markers ka retry
   */
  private async startMove(zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, onlyMarkerNos: string[]) {
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

    let action = (onlyMarkerNos != null) ? "RetryFailed" : "MoveMarkerLine";
    let startTime = new Date();
    let originalLastKey: any = null;
    this.networkInterrupted = false;

    try {
      // ---------- 1. source + related data padho ----------
      this.moveSummary.statusText = "डेटा पढ़ा जा रहा है...";
      await this.waitForNetwork();

      let markerData = await this.getNewPathLineData(zoneFrom, lineFrom);
      if (markerData == null) {
        this.commonService.setAlertMessage("error", "चुनी गई line में कोई marker नहीं मिला।");
        await this.saveMoveHistory(action, "aborted", startTime, zoneFrom, lineFrom, zoneTo, lineTo, null, "source line par koi marker nahi mila");
        this.finishRun();
        return;
      }
      this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "saveData", markerData);

      let markerNoList = this.buildMarkerList(markerData, onlyMarkerNos);
      if (markerNoList.length == 0) {
        this.commonService.setAlertMessage("error", "move करने लायक कोई marker नहीं मिला।");
        await this.saveMoveHistory(action, "aborted", startTime, zoneFrom, lineFrom, zoneTo, lineTo, null, "move karne layak koi marker nahi mila");
        this.finishRun();
        return;
      }

      // NEW PATH: lastMarkerKey LineSummary par. getSafeLastKey line ki asli
      // sabse badi key bhi dekh leta hai, warna naye marker ko wahi number mil
      // sakta hai jo pehle se kisi ke paas ho aur purana marker dab jaaye.
      let lastKey = Number(await this.getSafeLastKey(zoneTo, lineTo));
      if (isNaN(lastKey)) { lastKey = 0; }
      originalLastKey = lastKey;

      let houseData = await this.readOnceWithRetry("Houses/" + zoneFrom + "/" + lineFrom);
      let revisitData = await this.readOnceWithRetry("EntitySurveyData/RevisitRequest/" + zoneFrom + "/" + lineFrom);
      // markerNo -> uid. Record ke andar uid hota nahi, aur naye path par har
      // node ki key uid hi hai - backup restore layak tabhi hai jab uid saath ho.
      let lineLinks = await this.markerMapping.readLineLinks(this.db, zoneFrom, lineFrom);

      // ---------- 2. backup pehle, uske baad hi move ----------
      this.moveSummary.statusText = "Backup सेव हो रहा है...";
      // ek hi Date se path, file name aur meta - warna aadhi raat ko run ho to
      // folder aur file alag-alag din ke ban sakte hain
      let now = new Date();
      let filePath = this.buildBackupFilePath(now);
      let fileName = this.buildBackupFileName(zoneFrom, lineFrom, zoneTo, lineTo, (onlyMarkerNos != null ? "_retry" : ""), now);
      let backupData = this.buildBackupData(markerData, lineLinks, houseData, revisitData, lastKey, zoneFrom, lineFrom, zoneTo, lineTo, markerNoList.length, now);

      try {
        await this.saveBackupWithRetry(backupData, fileName, filePath);
      } catch (e) {
        let reason = (e && e.message) ? e.message : e;
        this.commonService.setAlertMessage("error", "Backup सेव नहीं हो पाया, move रद्द कर दिया गया। (" + reason + ")");
        this.moveSummary.statusText = "Backup फेल हुआ - move शुरू ही नहीं हुआ। डेटाबेस में कुछ नहीं बदला।";
        await this.saveMoveHistory(action, "aborted", startTime, zoneFrom, lineFrom, zoneTo, lineTo, originalLastKey, "backup fail: " + reason);
        this.finishRun();
        return;
      }
      this.moveSummary.backupFile = filePath + fileName;

      // ---------- 3. progress rows banao ----------
      this.moveRows = this.buildRows(markerData, markerNoList, zoneFrom, lineFrom, zoneTo, lineTo);
      this.moveSummary.total = this.moveRows.length;
      this.moveSummary.pending = this.moveRows.length;

      this.moveContext = {
        zoneFrom: zoneFrom, lineFrom: lineFrom, zoneTo: zoneTo, lineTo: lineTo,
        markerData: markerData, lastKey: lastKey
      };

      // ---------- 4. move loop ----------
      await this.runMoveLoop(this.moveContext);

      // ---------- 5. counts + final message ----------
      this.moveSummary.statusText = "Counts अपडेट हो रहे हैं...";
      await this.dbUpdate("EntityMarkingData/MarkersMapping/LineSummary/" + zoneTo + "/" + lineTo, { lastMarkerKey: this.moveContext.lastKey });
      await this.updateCounts(zoneFrom, zoneTo, "markerMove", this.moveSummary.failed);

      let status = "success";
      if (this.cancelRequested) { status = "cancelled"; }
      else if (this.moveSummary.failed > 0) { status = "partial"; }
      await this.saveMoveHistory(action, status, startTime, zoneFrom, lineFrom, zoneTo, lineTo, originalLastKey, "");

      if (this.cancelRequested) {
        this.moveSummary.statusText = "Move रद्द कर दिया गया। जो move हो चुके वे सुरक्षित हैं, बाकी source पर ही हैं।";
        this.commonService.setAlertMessage("error", "Move रद्द कर दिया गया। " + this.moveSummary.moved + " markers move हो चुके थे।");
      } else if (this.moveSummary.failed > 0) {
        this.moveSummary.statusText = this.moveSummary.failed + " markers फेल हुए। नीचे table में कारण देखें, फिर 'Retry Failed' दबाएँ।";
        this.commonService.setAlertMessage("error", this.moveSummary.failed + " markers have some issue to be processed, Please try again.");
      } else {
        this.moveSummary.statusText = "सभी markers सफलतापूर्वक move हो गए।";
        if (this.moveSummary.imageMissing > 0) {
          this.moveSummary.statusText = this.moveSummary.statusText + " (" + this.moveSummary.imageMissing + " markers की image Storage में नहीं मिली - डेटा move हो गया है।)";
        }
        this.commonService.setAlertMessage("success", "Marker moved successfully !!!");
      }
    } catch (e) {
      let reason = (e && e.message) ? e.message : e;
      this.moveSummary.statusText = "Move रोक दिया गया: " + reason;
      this.commonService.setAlertMessage("error", "Move में समस्या आ गई: " + reason);
      await this.saveMoveHistory(action, "error", startTime, zoneFrom, lineFrom, zoneTo, lineTo, originalLastKey, "" + reason);
    }

    this.finishRun();
  }

  /**
   * ActionHistory/PortalServices/ChangeLineMarkerData/{date} me ek record.
   * Fail / cancel / abort sab log hote hain - warna audit adhoora reh jayega.
   */
  private async saveMoveHistory(action: string, status: string, startTime: Date, zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, originalLastKey: any, note: string) {
    let now = new Date();
    let record: any = {
      action: action,
      status: status,
      startTime: this.moveHelper.getDateTimeString(startTime),
      endTime: this.moveHelper.getDateTimeString(now),
      durationSec: Math.round((now.getTime() - startTime.getTime()) / 1000),
      from: { ward: zoneFrom, line: lineFrom },
      to: { ward: zoneTo, line: lineTo },
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
    if (originalLastKey != null && this.moveRows.length > 0) {
      record["destinationStartKey"] = Number(originalLastKey) + 1;
      record["destinationEndKey"] = Number(originalLastKey) + this.moveRows.length;
    }
    await this.moveHelper.saveActionHistory(this.db, this.historySection, this.historyPageKey, record);
  }

  /** Move ke alawa wale actions (counts, mapping, json upload) ka chhota record */
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
      this.closeMoveModal();                        // dikhane layak kuch hua hi nahi
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

  private buildMarkerList(markerData: any, onlyMarkerNos: string[]): string[] {
    let list: string[] = [];
    let keyArray = Object.keys(markerData);
    for (let i = 0; i < keyArray.length; i++) {
      let markerNo = keyArray[i];
      // Firebase numeric keys ko kabhi-kabhi array bana deta hai, jisme holes null hote hain
      if (markerData[markerNo] == null || typeof markerData[markerNo] != "object") {
        continue;
      }
      if (markerData[markerNo]["houseType"] == null) {
        continue;                                   // marksCount / lastMarkerKey jaise metadata keys
      }
      if (onlyMarkerNos != null && onlyMarkerNos.indexOf(markerNo) < 0) {
        continue;
      }
      list.push(markerNo);
    }
    return list;
  }

  private buildRows(markerData: any, markerNoList: string[], zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any): MarkerMoveRow[] {
    let rows: MarkerMoveRow[] = [];
    for (let i = 0; i < markerNoList.length; i++) {
      let markerNo = markerNoList[i];
      let data = markerData[markerNo];
      rows.push({
        srNo: i + 1,
        markerNo: markerNo,
        newKey: 0,
        newMarkerNo: "",
        fromZone: zoneFrom,
        fromLine: lineFrom,
        toZone: zoneTo,
        toLine: lineTo,
        cardNo: (data["cardNumber"] != null) ? data["cardNumber"] : "",
        oldImage: (data["image"] != null) ? data["image"] : "",
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

  // =====================================================================
  // MOVE - MAIN LOOP
  // =====================================================================

  /**
   * Markers ek doosre se poori tarah independent hain - har marker apne alag
   * DB paths par likhta hai (apna markerNo, apna cardNo, apna revisitKey,
   * apni image). Sirf EK cheez shared thi: lastKey counter. Use loop se pehle
   * hi allocate kar dete hain, uske baad N markers bilkul safely saath-saath
   * chal sakte hain - koi race, koi overwrite, koi data loss nahi.
   *
   * Har marker ka apna retry hai, isliye network girne par sirf wahi marker
   * rukta hai aur connection aate hi wahin se continue hota hai.
   */
  private async runMoveLoop(ctx: any) {
    // ---- 1. saari keys pehle se allocate ----
    for (let i = 0; i < this.moveRows.length; i++) {
      let row = this.moveRows[i];
      let key = ctx.lastKey + 1 + i;
      row.newKey = key;
      row.newMarkerNo = "" + key;
      row.newImage = key + ".jpg";                 // purane code jaisa - hamesha set hota hai
    }

    // ---- 2. shared queue - har worker agla pending marker uthata hai ----
    let nextIndex = 0;
    let takeNext = (): MarkerMoveRow => {
      if (nextIndex >= this.moveRows.length) {
        return null;
      }
      let row = this.moveRows[nextIndex];
      nextIndex = nextIndex + 1;
      return row;
    };

    let workerCount = Math.min(this.MOVE_CONCURRENCY, this.moveRows.length);
    let workers = [];
    for (let w = 0; w < workerCount; w++) {
      workers.push(this.moveWorker(ctx, takeNext));
    }
    await Promise.all(workers);

    // ---- 3. destination ka lastMarkerKey = jo markers sach me move hue ----
    // (fail hue markers ki keys gap chhod jati hain, wo harmless hai)
    let maxKey = ctx.lastKey;
    for (let i = 0; i < this.moveRows.length; i++) {
      let row = this.moveRows[i];
      if (row.status == "moved" && row.newKey > maxKey) {
        maxKey = row.newKey;
      }
    }
    ctx.lastKey = maxKey;
  }

  private async moveWorker(ctx: any, takeNext: any): Promise<void> {
    while (true) {
      if (this.cancelRequested) {
        return;
      }
      let row = takeNext();
      if (row == null) {
        return;
      }
      await this.processRowWithRetry(row, ctx);
    }
  }

  /**
   * Ek marker ka poora lifecycle. Network fail par wahi marker dobara chalta
   * hai - wahi key, wahi image name - isliye resume ke baad duplicate nahi
   * banta. Asli error par destination ki aadhi entries rollback ho jati hain.
   */
  private async processRowWithRetry(row: MarkerMoveRow, ctx: any) {
    let data = ctx.markerData[row.markerNo];
    let networkRetries = 0;

    while (true) {
      if (this.cancelRequested) { row.status = "pending"; return; }
      await this.waitForNetwork();
      if (this.cancelRequested) { row.status = "pending"; return; }

      row.status = "moving";
      row.attempts = row.attempts + 1;
      this.refreshMoveStatusText();

      // is marker ke dauraan kya-kya destination par likha ja chuka hai
      let state = {
        destMarkerWritten: false,
        destCardWritten: false,
        destRevisitWritten: false,
        mappingWritten: false,
        cleanupStarted: false,
        revisitKey: "",
        markerID: "",
        mobile: ""
      };

      try {
        await this.processMarker(row, data, ctx, state);
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

        if (this.isNetworkError(e) && networkRetries < this.MAX_NETWORK_RETRIES) {
          networkRetries = networkRetries + 1;
          row.status = "pending";
          row.imageMissing = false;
          await this.waitForNetwork();
          continue;                                  // wahi marker, wahi key
        }

        // Asli error. Destination par jo aadha-adhoora likha gaya use hata do,
        // warna marker dono jagah reh jayega. Key wapas nahi le sakte kyunki
        // baaki markers apni keys le chuke hain - gap harmless hai, aur
        // updateCounts lastMarkerKey dobara sahi kar deta hai.
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
    if (this.moveSummary.waitingForNetwork) {
      return;                                        // banner apna message dikha raha hai
    }
    let done = this.moveSummary.moved + this.moveSummary.failed;
    this.moveSummary.statusText = done + " / " + this.moveSummary.total + " markers हो चुके - "
      + this.MOVE_CONCURRENCY + " एक साथ चल रहे हैं...";
  }

  /**
   * Marker beech me fail hua to destination par likhi gayi aadhi entries hata
   * kar purani haalat wapas laata hai. Sirf tab chalta hai jab source se abhi
   * kuch delete nahi hua - warna data hi chala jayega.
   */
  private async rollbackDestination(row: MarkerMoveRow, ctx: any, state: any) {
    try {
      if (state.destMarkerWritten) {
        // NEW PATH: record delete nahi karna - wo MarkersData par hai aur wahi
        // asli data hai. Marker ko wapas purani jagah point kara dete hain aur
        // nayi line ki LineWise entry hata dete hain.
        if (state.uid != null) {
          await this.markerMapping.writePlace(this.db, state.uid, ctx.zoneFrom,
            this.markerMapping.lineValue(ctx.lineFrom), row.markerNo);
          if (String(ctx.zoneFrom) != String(ctx.zoneTo)) {
            await this.dbRemove("EntityMarkingData/MarkersMapping/WardWise/" + ctx.zoneTo + "/" + state.uid);
          }
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
          await this.dbUpdate("EntityMarkingData/MarkersData/" + state.uid, undo);
        }
        await this.dbRemove("EntityMarkingData/MarkersMapping/LineWise/" + ctx.zoneTo + "/" + ctx.lineTo + "/" + row.newKey);
        // Cache mapping badalne ke BAAD saaf hoti hai. writePlace() upar ek baar
        // clear kar chuka hai, par uske baad ye removal hua - to dobara clear
        // karna zaroori hai, warna beech me aayi koi read purani list rakh leti.
        this.markerMapping.clearLinkCache();
      }
      // MoveHistory ki entry bhi hatani hai. Marker hila hi nahi, phir bhi
      // history "line X se line Y" dikhati rehti thi, aur retry successful
      // hone par usi ek move ki do entries chadh jaati thi.
      if (state.moveHistoryKey != null && state.moveHistoryKey != "" && state.uid != null) {
        await this.dbRemove(this.markerMapping.moveRecordPath(state.uid, state.moveHistoryKey));
      }
      if (state.destCardWritten && row.cardNo != "") {
        await this.dbRemove("Houses/" + ctx.zoneTo + "/" + ctx.lineTo + "/" + row.cardNo);
        await this.dbSet("CardWardMapping/" + row.cardNo, { line: ctx.lineFrom, ward: ctx.zoneFrom });
        if (state.mobile != "") {
          await this.dbSet("HouseWardMapping/" + state.mobile, { line: ctx.lineFrom, ward: ctx.zoneFrom });
        }
      }
      if (state.destRevisitWritten && state.revisitKey != "") {
        await this.dbRemove("EntitySurveyData/RevisitRequest/" + ctx.zoneTo + "/" + ctx.lineTo + "/" + state.revisitKey);
      }
      if (state.mappingWritten && state.markerID != "") {
        await this.dbUpdate("EntityMarkingData/MarkerWardMapping/" + state.markerID, {
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

  /**
   * Ek marker ka poora move. Order jaan-boojh kar aisa hai:
   *   pehle SAARE reads -> phir SAARE destination writes -> sabse aakhir me source removes.
   * Isse beech me kuch fail ho to source poora salamat rehta hai aur retry
   * bilkul saaf chalta hai. Har step idempotent hai, isliye same marker
   * dobara chalane par kuch bigadta nahi.
   */
  private async processMarker(row: MarkerMoveRow, data: any, ctx: any, state: any) {
    let zoneFrom = ctx.zoneFrom;
    let lineFrom = ctx.lineFrom;
    let zoneTo = ctx.zoneTo;
    let lineTo = ctx.lineTo;

    let city = this.commonService.getFireStoreCity();
    if (this.cityName == "sikar") {
      city = "Sikar-Survey";
    }

    // ---------- IMAGE ----------
    // NEW PATH me image copy karne ki zaroorat hi nahi - wo global folder
    // AllMarkerImages/{uid}.jpg par padi rehti hai aur marker kahin bhi jaaye
    // (doosri line, doosra ward) uska naam wahi rehta hai. Old path me har
    // line ka apna folder tha, isliye har move par file copy karni padti thi -
    // sabse dheema aur sabse zyada fail hone wala step wahi tha.
    row.imageMissing = (row.newImage == "");

    // ---------- UID ----------
    // Marker ki asli pehchaan uid hai; markerNo sirf line par uska serial hai.
    row.failedStep = "Marker UID";
    let uid = await this.getMarkerUid(zoneFrom, lineFrom, row.markerNo);
    if (uid == null) {
      throw new Error("marker naye path par nahi mila (LineWise me uid nahi hai)");
    }
    state.uid = uid;

    // ---------- READS ----------
    let cardNo = (data["cardNumber"] != null) ? data["cardNumber"] : "";
    let cardData: any = null;
    if (cardNo != "") {
      row.failedStep = "Card Read";
      cardData = await this.readOnce("Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo);
      if (cardData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", cardData);
        if (cardData["mobile"] != null && cardData["mobile"] != "") {
          state.mobile = cardData["mobile"];
        }
      }
    }

    let revisitKey = (data["revisitKey"] != null) ? data["revisitKey"] : "";
    let revisitData: any = null;
    state.revisitKey = revisitKey;
    if (revisitKey != "") {
      row.failedStep = "Revisit Read";
      revisitData = await this.readOnce("EntitySurveyData/RevisitRequest/" + zoneFrom + "/" + lineFrom + "/" + revisitKey);
      if (revisitData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "moveData", revisitData);
      }
    }

    // latLng card se lena hai - ye marker write se PEHLE hona chahiye.
    // purane code me ye async callback me hota tha jo write ke baad chalta tha,
    // isliye latLng kabhi save hota hi nahi tha.
    if (cardData != null && cardData["latLng"] != null) {
      data["latLng"] = cardData["latLng"].toString().replace("(", "").replace(")", "");
    }
    data["image"] = row.newImage;                  // purane code jaisa - hamesha set hota hai

    // ---------- DESTINATION WRITES ----------
    // NEW PATH: record apni hi jagah (MarkersData/{uid}) par rehta hai - sirf
    // ward/line badalte hain aur mapping nayi jagah point karne lagti hai.
    row.failedStep = "Marker Write";
    let lineVal = this.markerMapping.lineValue(lineTo);
    // Rollback ke liye purani move-stamp sambhal lo. Marker pehle bhi move
    // hua ho sakta hai - is move ke fail hone par uska pichhla record mitna
    // nahi chahiye, isliye null karne ki jagah purani value wapas likhte hain.
    state.prevMoved = {
      movedFromWard: (data["movedFromWard"] != null) ? data["movedFromWard"] : null,
      movedFromLine: (data["movedFromLine"] != null) ? data["movedFromLine"] : null,
      movedFromMarkerNo: (data["movedFromMarkerNo"] != null) ? data["movedFromMarkerNo"] : null,
      movedOn: (data["movedOn"] != null) ? data["movedOn"] : null
    };
    let patch: any = {
      ward: zoneTo,
      line: lineVal,
      markerNo: Number(row.newKey) || 0,
      image: data["image"],
      movedFromWard: zoneFrom,
      movedFromLine: this.markerMapping.lineValue(lineFrom),
      movedFromMarkerNo: this.markerMapping.markerNoValue(row.markerNo),
      movedOn: this.commonService.getTodayDateTime()
    };
    // latLng har marker par nahi hota. undefined bhejne par Firebase update()
    // throw kar deta hai (poora move fail ho jaata), isliye field tabhi bhejte
    // hain jab value ho - baaki teeno move page bhi yahi guard lagate hain.
    if (data["latLng"] != null) {
      patch["latLng"] = data["latLng"];
    }
    state.destMarkerWritten = true;
    await this.dbUpdate("EntityMarkingData/MarkersData/" + uid, patch);
    data["ward"] = zoneTo;
    data["line"] = lineVal;

    // Teeno mapping ek saath. Ward badla ho to purane ward ki WardWise entry
    // bhi hatani padti hai, warna marker dono wards me dikhega - writePlace ke
    // baad wo alag se hataate hain.
    state.destMappingWritten = true;
    await this.markerMapping.writePlace(this.db, uid, zoneTo, lineVal, row.newKey);
    if (String(zoneFrom) != String(zoneTo)) {
      await this.dbRemove("EntityMarkingData/MarkersMapping/WardWise/" + zoneFrom + "/" + uid);
    }

    // Har move ka permanent record: MoveHistory/{uid}.
    // Push key turant chahiye (ThenableReference par .key sync milti hai) -
    // move aage jaakar fail hua to rollback isi key se entry hata sake.
    let moveRef = this.markerMapping.recordMove(this.db, uid, zoneFrom, lineFrom, row.markerNo, zoneTo, lineTo, row.newKey);
    state.moveHistoryKey = (moveRef != null && moveRef.key != null) ? moveRef.key : "";
    await moveRef;

    if (cardData != null) {
      row.failedStep = "Card Write";
      cardData["line"] = lineTo;
      cardData["ward"] = zoneTo;
      state.destCardWritten = true;
      await this.dbUpdate("Houses/" + zoneTo + "/" + lineTo + "/" + cardNo, cardData);
      await this.dbSet("CardWardMapping/" + cardNo, { line: lineTo, ward: zoneTo });
      if (state.mobile != "") {
        await this.dbSet("HouseWardMapping/" + state.mobile, { line: lineTo, ward: zoneTo });
      }
    }

    if (revisitData != null) {
      row.failedStep = "Revisit Write";
      state.destRevisitWritten = true;
      await this.dbUpdate("EntitySurveyData/RevisitRequest/" + zoneTo + "/" + lineTo + "/" + revisitKey, revisitData);
    }

    // markerID nikalne ka logic bilkul purane code jaisa hi rakha gaya hai
    row.failedStep = "Ward Mapping";
    let markerID = "";
    if (data["markerId"] != null) {
      markerID = this.commonService.getDefaultCardPrefix() + data["markerId"];
    }
    if (cardNo != "" && markerID != "") {
      markerID = cardNo;
    }
    state.markerID = markerID;
    if (markerID != "") {
      state.mappingWritten = true;
      await this.dbUpdate("EntityMarkingData/MarkerWardMapping/" + markerID, {
        markerkey: state.uid,
        line: lineTo.toString(),
        markerNo: row.newKey.toString(),
        ward: zoneTo
      });
    }

    // ---------- SOURCE REMOVES (sabse aakhir me) ----------
    // yahan tak pahunchne ka matlab destination par sab kuch likha ja chuka hai,
    // isliye ab source hatana safe hai. Iske baad rollback nahi hoga.
    row.failedStep = "Source Cleanup";
    state.cleanupStarted = true;
    // NEW PATH: record hataana nahi - wo MarkersData par apni jagah hi rehta
    // hai. Sirf purani line ki LineWise entry hatani hai, warna marker purani
    // aur nayi dono line par dikhta rahega.
    await this.dbRemove("EntityMarkingData/MarkersMapping/LineWise/" + zoneFrom + "/" + lineFrom + "/" + row.markerNo);
    this.markerMapping.clearLinkCache();
    if (cardData != null) {
      await this.dbRemove("Houses/" + zoneFrom + "/" + lineFrom + "/" + cardNo);
    }
    if (revisitData != null) {
      await this.dbRemove("EntitySurveyData/RevisitRequest/" + zoneFrom + "/" + lineFrom + "/" + revisitKey);
    }

    row.failedStep = "";
  }

  // =====================================================================
  // PROGRESS COMPONENT KE EVENTS
  // =====================================================================

  async onRetryFailed() {
    if (this.moveRunning || this.moveContext == null) {
      return;
    }
    let failedMarkerNos = this.moveRows.filter(r => r.status == "failed").map(r => r.markerNo);
    if (failedMarkerNos.length == 0) {
      return;
    }
    await this.startMove(this.moveContext.zoneFrom, this.moveContext.lineFrom, this.moveContext.zoneTo, this.moveContext.lineTo, failedMarkerNos);
  }

  onCancelMove() {
    if (!this.moveRunning) {
      return;
    }
    this.cancelRequested = true;
    this.moveSummary.waitingForNetwork = false;
    this.moveSummary.statusText = "Cancel request भेज दी गई, चल रहा marker पूरा होते ही रुक जाएगा...";
  }

  // =====================================================================
  // BAAKI PAGE SERVICES (pehle jaisi)
  // =====================================================================

  updateWardMarker() {
    let zoneNo = $(this.ddlZoneMarker).val();
    if (zoneNo == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateWardMarker");
    let startTime = new Date();
    let mappingCount = 0;
    $(this.divLoader).show();
    this.markerMapping.clearLinkCache();
    // Link index bhi chahiye - MarkerWardMapping me ab markerkey (uid) jaata
    // hai, aur uid sirf mapping me hota hai, record ke andar nahi.
    Promise.all([
      this.getNewPathWardData(zoneNo),
      this.markerMapping.getWardLinks(this.db, zoneNo)
    ]).then(
      (result: any) => {
        let markerData = result[0];
        let wardLinks = result[1] != null ? result[1] : {};
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateWardMarker", markerData);
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                let markerId = "";
                let latLng = "";
                if (lineData[markerNo]["cardNumber"] != null) {
                  markerId = lineData[markerNo]["cardNumber"];
                }
                else if (lineData[markerNo]["markerId"] != null) {
                  markerId = this.commonService.getDefaultCardPrefix() + lineData[markerNo]["markerId"];
                }
                if (lineData[markerNo]["latLng"] != null) {
                  latLng = lineData[markerNo]["latLng"];
                }
                if (markerId != "") {
                  let uid = (wardLinks[lineNo] != null) ? wardLinks[lineNo][markerNo] : null;
                  let data: any = {
                    ward: zoneNo,
                    line: lineNo,
                    latLng: latLng,
                    // `image` yahan nahi jaati - image ka naam hamesha
                    // AllMarkerImages/{uid}.jpg hai, yaani markerkey se khud
                    // ban jaata hai. Record ka purana per-line naam likhne se
                    // to URL galat hi banta tha.
                    markerNo: markerNo
                  }
                  if (uid != null && uid != "") {
                    // markerkey = marker ka uid. Move par uid nahi badalta,
                    // isliye card ka link ek baar ban jaaye to move-proof hai.
                    data["markerkey"] = uid;
                  }
                  let path = "EntityMarkingData/MarkerWardMapping/" + markerId;
                  this.db.object(path).update(data);
                  mappingCount = mappingCount + 1;
                }
              }
            }
          }
          this.commonService.setAlertMessage("success", "Data updated successfully.")
          this.saveSimpleHistory("UpdateWardMarkerMapping", "success", startTime, { ward: zoneNo, mappingUpdated: mappingCount });

        }
        else {
          this.commonService.setAlertMessage("error", "Sorry! No data found for selected ward.")
          this.saveSimpleHistory("UpdateWardMarkerMapping", "aborted", startTime, { ward: zoneNo, note: "selected ward par koi data nahi mila" });
        }
        $(this.divLoader).hide();
      });

  }

  saveOnStorage() {
    let startTime = new Date();
    let path = "EntityMarkingData/MarkerWardMapping/";
    let instance = this.db.object(path).valueChanges().subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        this.commonService.saveJsonFile(data, "MarkerWardMapping.json", "/MarkerWardMapping/");
        this.commonService.setAlertMessage("success", "File saved successfully.")
        this.saveSimpleHistory("UploadMarkerMappingJson", "success", startTime, { file: "/MarkerWardMapping/MarkerWardMapping.json" });
      }
      else {
        this.saveSimpleHistory("UploadMarkerMappingJson", "aborted", startTime, { note: "MarkerWardMapping node khaali hai" });
      }
    });

  }

  /**
   * Ek zone ke saare lines ke counts dobara ginta hai.
   */
  private async recalcZoneCounts(zoneNo: any): Promise<boolean> {
    this.markerMapping.clearLinkCache();
    let markerData = await this.getNewPathWardData(zoneNo);
    if (markerData == null) {
      return false;
    }
    this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCounts", markerData);
    // Neeche wala loop sirf un lines par ghumta hai jo LineWise me hain. Jis
    // line ka aakhri marker nikal gaya uska LineWise node hi khatam ho jaata
    // hai, isliye wo line yahan aati hi nahi aur uske purane counts LineSummary
    // par pade rah jaate hain (Markers 0 dikhta hai par Houses purana number).
    await this.markerMapping.resetEmptyLineSummaries(this.db, zoneNo, markerData);
    let keyArray = Object.keys(markerData);
    if (keyArray.length == 0) {
      return false;
    }

    let zoneMarkerCount = 0;
    let zoneAlreadyInstalledCount = 0;
    let totalSurveyed = 0;
    let totalRevisit = 0;

    for (let i = 0; i < keyArray.length; i++) {
      let markerCount = 0;
      let surveyedCount = 0;
      let revisitCount = 0;
      let rfIdNotFound = 0;
      let alreadyInstalledCount = 0;
      let lineNo = keyArray[i];
      let lineData = markerData[lineNo];
      if (lineData == null || typeof lineData != "object") {
        continue;
      }
      let lastMarkerKey = 0;
      let markerKeyArray = Object.keys(lineData);
      for (let j = 0; j < markerKeyArray.length; j++) {
        let markerNo = markerKeyArray[j];
        if (lineData[markerNo] == null || typeof lineData[markerNo] != "object") {
          continue;
        }
        if (lineData[markerNo]["houseType"] != null) {
          if (Number(markerNo) > lastMarkerKey) {
            lastMarkerKey = Number(markerNo);
          }
          markerCount = markerCount + 1;
          zoneMarkerCount = zoneMarkerCount + 1;
          if (lineData[markerNo]["cardNumber"] != null) {
            surveyedCount = surveyedCount + 1;
            totalSurveyed = totalSurveyed + 1;
          }
          else if (lineData[markerNo]["revisitKey"] != null) {
            revisitCount = revisitCount + 1;
            totalRevisit = totalRevisit + 1;
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
      // Pehle ye do alag dbUpdate() the (counts + lastMarkerKey), dono usi
      // path par - yaani har line par do await, do write. Ek patch me bhej
      // rahe hain: 300 line wale ward par 600 ki jagah 300 write.
      let summaryPatch: any = {
        marksCount: markerCount,
        surveyedCount: surveyedCount,
        lineRevisitCount: revisitCount,
        lineRfidNotFoundCount: rfIdNotFound,
        alreadyInstalledCount: alreadyInstalledCount
      };
      if (lastMarkerKey > 0) {
        summaryPatch["lastMarkerKey"] = lastMarkerKey;
      }
      await this.dbUpdate("EntityMarkingData/MarkersMapping/LineSummary/" + zoneNo + "/" + lineNo, summaryPatch);
    }

    await this.dbUpdate("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo, {
      alreadyInstalled: zoneAlreadyInstalledCount,
      marked: zoneMarkerCount
    });
    await this.dbSet("EntitySurveyData/TotalHouseCount/" + zoneNo, totalSurveyed.toString());
    await this.dbSet("EntitySurveyData/TotalRevisitRequest/" + zoneNo, totalRevisit.toString());
    return true;
  }

  /**
   * Purane code me agar source zone ka node null nikal jata tha to "markerMove"
   * case handle hi nahi tha - destination ke counts kabhi update nahi hote the
   * aur loader atka reh jata tha. Ab dono zone alag-alag handle hote hain.
   */
  async updateCounts(zoneNo: any, zoneTo: any, type: any, failureCount: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts");
    // move ke dauraan popup hi status dikhata hai, full screen loader uske upar aa jayega
    let useLoader = !this.moveRunning;
    if (useLoader) { $(this.divLoader).show(); }
    try {
      await this.recalcZoneCounts(zoneNo);
      if (zoneNo != zoneTo) {
        await this.recalcZoneCounts(zoneTo);
      }
      if (type == "totalCount") {
        this.commonService.setAlertMessage("success", "Marker counts updated !!!");
      }
    } catch (e) {
      let reason = (e && e.message) ? e.message : e;
      this.commonService.setAlertMessage("error", "Counts अपडेट नहीं हो पाए: " + reason);
    }
    if (useLoader) { $(this.divLoader).hide(); }
  }

  async updateMarkerCounts() {
    let zoneNo = $(this.ddlZone).val();
    if (zoneNo == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    let startTime = new Date();
    await this.updateCounts(zoneNo, zoneNo, "totalCount", 0);
    await this.saveSimpleHistory("UpdateMarkerCounts", "success", startTime, { ward: zoneNo });
  }
}
