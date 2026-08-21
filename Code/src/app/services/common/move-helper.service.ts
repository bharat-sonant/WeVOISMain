import { Injectable } from '@angular/core';
import { AngularFireStorage } from "angularfire2/storage";
import { CommonService } from './common.service';
import { MarkerMappingService } from '../marker/marker-mapping.service';

/**
 * Ek chal rahe move ka state. Component ye implement karta hai taaki service
 * ko pata rahe ki user ne cancel dabaya hai ya nahi, aur wo UI ko bata sake
 * ki abhi network ka intezaar ho raha hai.
 */
export interface MoveRun {
  isCancelled(): boolean;
  setWaitingForNetwork(waiting: boolean): void;
}

/**
 * Data move karne wale portal pages (Change Line Marker Data, Change Line
 * Surveyed Data) ka common engine.
 *
 * Yahan sirf infrastructure hai - network detection, timeout wale DB calls,
 * image copy with retry, aur backup. Kaunsa data kahan move hoga wo har
 * component apne paas rakhta hai.
 */
@Injectable({
  providedIn: 'root'
})
export class MoveHelperService {

  constructor(private storage: AngularFireStorage, private commonService: CommonService, private markerMapping: MarkerMappingService) { }

  readonly IMAGE_ATTEMPTS = 3;
  readonly MAX_NETWORK_RETRIES = 10;
  readonly DB_TIMEOUT_MS = 20000;
  readonly READ_TIMEOUT_MS = 30000;
  readonly IMAGE_TIMEOUT_MS = 30000;
  readonly BACKUP_TIMEOUT_MS = 60000;
  // Kitne items ek saath. Browser ek host par ~6 connections kholta hai aur
  // har item me 1 image download + 1 upload hota hai, isliye 5 sweet spot hai.
  readonly CONCURRENCY = 5;

  private fbConnected = true;
  private connectionInstance: any = null;

  // =====================================================================
  // NETWORK DETECTION
  // =====================================================================

  /**
   * Firebase ka .info/connected node asli server connectivity batata hai.
   * navigator.onLine akela bharosemand nahi (router se juda ho par internet
   * band ho to bhi true deta hai), isliye dono ka AND liya jata hai.
   */
  watchConnection(db: any) {
    this.stopWatchingConnection();
    try {
      this.connectionInstance = db.object(".info/connected").valueChanges().subscribe(
        (value: any) => { this.fbConnected = (value === true); },
        (error: any) => { this.fbConnected = true; }   // node na mile to navigator.onLine par chalega
      );
    } catch (e) {
      this.fbConnected = true;
    }
  }

  stopWatchingConnection() {
    if (this.connectionInstance != null) {
      this.connectionInstance.unsubscribe();
      this.connectionInstance = null;
    }
  }

  isOnline(): boolean {
    let browserOnline = true;
    if (typeof navigator != "undefined" && navigator.onLine != undefined) {
      browserOnline = navigator.onLine;
    }
    return browserOnline && this.fbConnected;
  }

  /** Network wapas aane tak rukta hai. Cancel par turant return karta hai. */
  waitForNetwork(run: MoveRun): Promise<void> {
    if (this.isOnline() || run.isCancelled()) {
      return Promise.resolve();
    }
    run.setWaitingForNetwork(true);
    return new Promise<void>(resolve => {
      let timer = setInterval(() => {
        if (this.isOnline() || run.isCancelled()) {
          clearInterval(timer);
          run.setWaitingForNetwork(false);
          resolve();
        }
      }, 2000);
    });
  }

  /** Network wali failure (retry layak) aur asli failure (skip layak) ka farq. */
  isNetworkError(e: any): boolean {
    let code = (e && e.code) ? e.code : "";
    if (code == "storage/object-not-found") { return false; }   // file hi nahi hai
    if (code == "storage/unauthorized") { return false; }       // permission
    if (code == "storage/canceled") { return false; }
    let message = (e && e.message) ? e.message : "";
    if (message == "network error" || message == "timeout" || message == "db-timeout") { return true; }
    if (code == "storage/retry-limit-exceeded") { return true; }
    return !this.isOnline();
  }

  /**
   * "Image hai hi nahi" wali failure - na retry layak, na item ko rokne layak.
   * Permission (unauthorized) isme nahi aata, wo asli problem hai.
   */
  isImageMissingError(e: any): boolean {
    let code = (e && e.code) ? e.code : "";
    if (code == "storage/object-not-found") { return true; }
    let message = (e && e.message) ? e.message : "";
    return message == "HTTP 404";
  }

  // =====================================================================
  // GENERIC HELPERS
  // =====================================================================

  delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  /**
   * Firebase RTDB ka write offline hone par reject nahi hota - anant kaal tak
   * pending rehta hai. Isliye har write/read par timeout lagana zaroori hai,
   * warna loop chup-chaap latak jata hai.
   */
  withTimeout(promise: any, ms: number): Promise<any> {
    return Promise.race([
      Promise.resolve(promise),
      new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error("db-timeout")), ms);
      })
    ]);
  }

  readOnce(db: any, path: string): Promise<any> {
    let readPromise = new Promise<any>(resolve => {
      let instance: any = null;
      let done = false;
      instance = db.object(path).valueChanges().subscribe((data: any) => {
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

  listOnce(db: any, path: string): Promise<any> {
    let readPromise = new Promise<any>(resolve => {
      let instance: any = null;
      let done = false;
      instance = db.list(path).snapshotChanges().subscribe((data: any) => {
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

  /** Move shuru hone se pehle wale reads ke liye - network girte hi poora move
   *  abort na ho, balki connection wapas aane par dobara try kare. */
  async readOnceWithRetry(db: any, path: string, run: MoveRun): Promise<any> {
    let lastError: any = null;
    for (let attempt = 0; attempt < this.IMAGE_ATTEMPTS; attempt++) {
      if (run.isCancelled()) { throw new Error("cancelled"); }
      try {
        return await this.readOnce(db, path);
      } catch (e) {
        lastError = e;
        if (!this.isNetworkError(e)) { break; }
        await this.waitForNetwork(run);
        await this.delay(500 * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  /**
   * Marker ka data ya uski mapping badalne par MarkerMappingService ki cache
   * purani pad jaati hai.
   *
   * Pehle har move flow ko khud clearLinkCache() bulana padta tha, aur jahan
   * bhool hoti thi wahan page purani list dikhata rehta tha - aisi galti dikhti
   * bhi nahi hai, sirf "kabhi-kabhi data purana aata hai" jaisa lagta hai.
   * Isliye ab ye faisla yahin hota hai: path marker ka hai to cache apne aap
   * saaf. MarkerMappingService root-level singleton hai, yaani cache page badal
   * jaane par bhi zinda rehti hai - is wajah se ye aur zaroori ho jaata hai.
   */
  private clearMarkerCache(path: string) {
    if (path == null) {
      return;
    }
    if (path.indexOf("MarkersData") >= 0 || path.indexOf("MarkersMapping") >= 0) {
      this.markerMapping.clearLinkCache();
    }
  }

  dbUpdate(db: any, path: string, data: any): Promise<any> {
    this.clearMarkerCache(path);
    return this.withTimeout(db.object(path).update(data), this.DB_TIMEOUT_MS);
  }

  dbSet(db: any, path: string, data: any): Promise<any> {
    this.clearMarkerCache(path);
    return this.withTimeout(db.object(path).set(data), this.DB_TIMEOUT_MS);
  }

  dbRemove(db: any, path: string): Promise<any> {
    this.clearMarkerCache(path);
    return this.withTimeout(db.object(path).remove(), this.DB_TIMEOUT_MS);
  }

  // =====================================================================
  // IMAGE COPY
  // =====================================================================

  /** Image ke liye city folder - sikar ka alag naam hai. */
  getImageCity(cityName: any): string {
    if (cityName == "sikar") {
      return "Sikar-Survey";
    }
    return this.commonService.getFireStoreCity();
  }

  /**
   * Raw XHR ko Promise me wrap karta hai. Purane code me onerror/ontimeout
   * handle nahi the, isliye network girte hi poori chain chup-chaap mar jati
   * thi. Saath me HTTP status check bhi hai - warna 403/404 ka error body hi
   * .jpg banakar upload ho jata tha.
   */
  downloadBlob(url: string): Promise<Blob> {
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

  async copyImage(pathOld: string, pathNew: string): Promise<void> {
    let storageRef = this.storage.storage.app.storage(this.commonService.fireStoragePath);
    let url = await storageRef.ref(pathOld).getDownloadURL();
    let blob = await this.downloadBlob(url);
    await storageRef.ref(pathNew).put(blob);
  }

  async copyImageWithRetry(pathOld: string, pathNew: string, run: MoveRun): Promise<void> {
    let lastError: any = null;
    for (let attempt = 0; attempt < this.IMAGE_ATTEMPTS; attempt++) {
      if (run.isCancelled()) { throw new Error("cancelled"); }
      try {
        await this.copyImage(pathOld, pathNew);
        return;
      } catch (e) {
        lastError = e;
        if (!this.isNetworkError(e)) {
          break;                                     // file missing / permission - retry bekaar
        }
        await this.waitForNetwork(run);
        await this.delay(500 * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  // =====================================================================
  // BACKUP
  // =====================================================================

  twoDigit(value: number): string {
    return ("0" + value).slice(-2);
  }

  /** 2026-08-03 */
  getDateString(now: Date): string {
    return now.getFullYear() + "-" + this.twoDigit(now.getMonth() + 1) + "-" + this.twoDigit(now.getDate());
  }

  /** {city}/MovingBackUp/{pageName}/2026/August/2026-08-03/ */
  buildBackupFilePath(pageName: string, now: Date): string {
    let year = now.getFullYear();
    let monthName = this.commonService.getCurrentMonthName(now.getMonth());
    return "/MovingBackUp/" + pageName + "/" + year + "/" + monthName + "/" + this.getDateString(now) + "/";
  }

  buildBackupFileName(zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, suffix: string, now: Date): string {
    let time = this.twoDigit(now.getHours()) + this.twoDigit(now.getMinutes()) + this.twoDigit(now.getSeconds());
    return "Zone" + zoneFrom + "-Line" + lineFrom + "_to_Zone" + zoneTo + "-Line" + lineTo + "_" + time + suffix + ".json";
  }

  buildBackupMeta(pageName: string, cityName: any, zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, itemCount: number, now: Date): any {
    return {
      page: pageName,
      city: cityName,
      userId: localStorage.getItem("userID"),
      dateTime: this.getDateString(now) + " " + this.twoDigit(now.getHours()) + ":"
        + this.twoDigit(now.getMinutes()) + ":" + this.twoDigit(now.getSeconds()),
      from: { zone: zoneFrom, line: lineFrom },
      to: { zone: zoneTo, line: lineTo },
      totalItems: itemCount
    };
  }

  /**
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

  async saveBackupWithRetry(backupData: any, fileName: string, filePath: string, run: MoveRun): Promise<void> {
    let lastError: any = null;
    for (let attempt = 0; attempt < this.IMAGE_ATTEMPTS; attempt++) {
      if (run.isCancelled()) { throw new Error("cancelled"); }
      try {
        await this.saveBackupFile(backupData, fileName, filePath);
        return;
      } catch (e) {
        lastError = e;
        if (!this.isNetworkError(e)) { break; }
        await this.waitForNetwork(run);
        await this.delay(500 * Math.pow(2, attempt));
      }
    }
    throw lastError;
  }

  // =====================================================================
  // ACTION HISTORY
  // =====================================================================

  /**
   * Kisne kya kiya - ActionHistory/{Section}/{PageName}/{2026-08-03}/{pushKey}
   *
   * Logging kabhi bhi asli kaam ko rok na paye, isliye poora function try/catch
   * me hai aur error chup-chaap nigal liya jata hai.
   */
  async saveActionHistory(db: any, section: string, pageName: string, record: any): Promise<void> {
    try {
      let now = new Date();
      record["userId"] = localStorage.getItem("userID");
      record["city"] = localStorage.getItem("cityName");
      if (record["endTime"] == null) {
        record["endTime"] = this.getDateTimeString(now);
      }
      let path = "ActionHistory/" + section + "/" + pageName + "/" + this.getDateString(now);
      await this.withTimeout(db.list(path).push(record), this.DB_TIMEOUT_MS);
    } catch (e) {
      // history save na ho paye to bhi kuch nahi rukega
    }
  }

  /** 2026-08-03 14:32:10 */
  getDateTimeString(now: Date): string {
    return this.getDateString(now) + " " + this.twoDigit(now.getHours()) + ":"
      + this.twoDigit(now.getMinutes()) + ":" + this.twoDigit(now.getSeconds());
  }

  /** Action history sirf userId 4 dekh sakta hai */
  canViewActionHistory(): boolean {
    return localStorage.getItem("userID") == "4";
  }

  /** Ek din ke saare actions, naye pehle */
  async readActionHistory(db: any, section: string, pageName: string, date: string): Promise<any[]> {
    let list = [];
    let data = await this.readOnce(db, "ActionHistory/" + section + "/" + pageName + "/" + date);
    if (data == null) {
      return list;
    }
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      let record = data[keys[i]];
      if (record == null || typeof record != "object") {
        continue;
      }
      record["key"] = keys[i];
      list.push(record);
    }
    list.sort((a: any, b: any) => {
      let x = (a["startTime"] != null) ? a["startTime"] : "";
      let y = (b["startTime"] != null) ? b["startTime"] : "";
      return (x < y) ? 1 : -1;                       // naye pehle
    });
    return list;
  }

  /** Failed rows ko history ke liye chhota kar deta hai (poori before-state backup JSON me hai) */
  buildFailedItems(rows: any[]): any[] {
    let list = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status != "failed") { continue; }
      list.push({
        markerNo: rows[i].markerNo,
        cardNo: rows[i].cardNo,
        step: rows[i].failedStep,
        error: rows[i].error
      });
    }
    return list;
  }

  // =====================================================================
  // WORKER POOL
  // =====================================================================

  /**
   * N workers ek shared queue se items uthate hain. Items independent hone
   * chahiye - yani har item alag DB paths par likhe. Keys jaisi shared cheezein
   * caller ko pehle hi allocate karni chahiye, warna race ban jayega.
   */
  async runPool(itemCount: number, processItem: (index: number) => Promise<void>, run: MoveRun): Promise<void> {
    let nextIndex = 0;
    let takeNext = (): number => {
      if (nextIndex >= itemCount) { return -1; }
      let index = nextIndex;
      nextIndex = nextIndex + 1;
      return index;
    };

    let workerCount = Math.min(this.CONCURRENCY, itemCount);
    let workers = [];
    for (let w = 0; w < workerCount; w++) {
      workers.push(this.poolWorker(takeNext, processItem, run));
    }
    await Promise.all(workers);
  }

  private async poolWorker(takeNext: any, processItem: (index: number) => Promise<void>, run: MoveRun): Promise<void> {
    while (true) {
      if (run.isCancelled()) { return; }
      let index = takeNext();
      if (index < 0) { return; }
      await processItem(index);
    }
  }
}
