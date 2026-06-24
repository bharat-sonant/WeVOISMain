import { Component, OnInit } from "@angular/core";
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-ward-route-auto-scan",
  templateUrl: "./ward-route-auto-scan.component.html",
  styleUrls: ["./ward-route-auto-scan.component.scss"],
})
export class WardRouteAutoScanComponent implements OnInit {

  constructor(public fs: FirebaseService, public httpService: HttpClient, private commonService: CommonService) { }

  cityName: any;
  db: any;
  userId: any;

  // Realtime DB node: ScanningDeviceManagement/WardAutoScanSettings/<ward>
  dbBasePath = "ScanningDeviceManagement/WardAutoScanSettings";
  // Per-ward line-card-count JSON folder
  wardLineCardsFolder = "/ScanningDeviceManagement/WardLineCards/";
  // HousesCollectionInfo me ye keys actual cards nahi (scanned count me hatani hain)
  scannedMetaKeys = ["recentScanned", "totalScanned", "ImagesData", "totalActualScanned"];

  wardList: any[] = [];
  rows: any[] = [];

  loading: boolean = false;
  syncing: boolean = false;
  syncProgress: string = "";

  // Themed confirmation modal
  confirmVisible: boolean = false;
  confirmMessage: string = "";
  private confirmYes: () => void = null;
  private confirmNo: () => void = null;

  // ---------- Aggregate totals (sabhi wards) ----------
  get totalWards(): number { return this.rows.length; }
  get sumCardsInWard(): number { return this.rows.reduce((s, r) => s + (Number(r.totalCardsInWard) || 0), 0); }
  get sumCardsAvailable(): number { return this.rows.reduce((s, r) => s + (Number(r.cardsAvailable) || 0), 0); }
  get sumCardsScanned(): number { return this.rows.reduce((s, r) => s + (Number(r.cardsScanned) || 0), 0); }
  get enabledCount(): number { return this.rows.filter(r => r.autoScanEnabled).length; }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userId = localStorage.getItem("userID");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services", "Ward-Route-Auto-Scan", localStorage.getItem("userID"));
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.loadWards();
  }

  loadWards() {
    let zones = JSON.parse(localStorage.getItem("latest-zones"));
    let list = zones != null ? zones : [];
    this.wardList = list.filter((w: any) => w.zoneNo != "0" && w.zoneNo != 0);
    this.rows = this.wardList.map((w: any) => ({
      wardNo: w.zoneNo,
      wardName: w.zoneName,
      totalCompletedLines: 0,
      cardsAvailable: 0,
      cardsScanned: 0,
      totalCardsInWard: 0,
      autoScanEnabled: false,
      hasSavedSetting: false,
      range: "",
      previousRange: "",
      lastSyncAt: "",
      synced: false,
      loaded: false
    }));
    this.loadAllRows();
  }

  // Har ward ka row existing JSON + DB se load karo (build NAHI -> woh sirf Sync par)
  loadAllRows() {
    if (this.rows.length === 0) {
      return;
    }
    this.loading = true;
    let pending = this.rows.length;
    for (let i = 0; i < this.rows.length; i++) {
      this.loadRow(this.rows[i], () => {
        pending--;
        if (pending <= 0) {
          this.loading = false;
        }
      });
    }
  }

  loadRow(row: any, done: () => void) {
    this.loadWardSetting(row.wardNo, row);
    this.loadWardLineCardsJson(row.wardNo).then((jsonObj: any) => {
      this.computeRow(row, jsonObj, done);
    });
  }

  // jsonObj (WardLineCards) + lastLine + scanned se row populate karo
  computeRow(row: any, jsonObj: any, done?: () => void) {
    let ward = row.wardNo;
    this.getLastLineCompleted(ward).then((lastLine: number) => {
      let lines = jsonObj && jsonObj.lines ? jsonObj.lines : {};
      let tillLine = lastLine > 0 ? lastLine : 0;
      let avail = 0;
      for (let i = 1; i <= tillLine; i++) {
        let c = lines[i.toString()];
        if (c != null) {
          avail += Number(c);
        }
      }
      row.totalCompletedLines = lastLine;
      row.cardsAvailable = avail;
      row.totalCardsInWard = jsonObj && jsonObj.totalCards != null ? Number(jsonObj.totalCards) : 0;
      row.lastSyncAt = jsonObj && jsonObj.lastSyncAt ? jsonObj.lastSyncAt : "";
      row.synced = jsonObj != null;
      this.getScannedCount(ward).then((scanned: number) => {
        row.cardsScanned = scanned;
        row.loaded = true;
        if (done) {
          done();
        }
      });
    });
  }

  // ---------- Sync ALL wards ----------
  syncAll() {
    if (this.syncing || this.rows.length === 0) {
      return;
    }
    this.syncing = true;
    this.syncOne(0);
  }

  syncOne(i: number) {
    if (i >= this.rows.length) {
      this.syncing = false;
      this.syncProgress = "";
      this.commonService.setAlertMessage("success", "All wards synced !!!");
      return;
    }
    this.syncProgress = (i + 1) + " / " + this.rows.length;
    let row = this.rows[i];
    this.buildAndSaveWardLineCards(row.wardNo).then((jsonObj: any) => {
      this.computeRow(row, jsonObj);
      this.syncOne(i + 1);
    });
  }

  // ---------- Per-row auto scan toggle (with confirmation) ----------
  onRowToggle(row: any) {
    // row.autoScanEnabled ab naya (toggled) value rakhta hai
    if (row.autoScanEnabled) {
      // ENABLE
      if (row.range == "") {
        this.commonService.setAlertMessage("error", "Please select card scanning % for " + row.wardName + " !!!");
        setTimeout(() => { row.autoScanEnabled = false; }, 0);
        return;
      }
      this.openConfirm(
        "Enable auto scan for " + row.wardName + "?",
        () => this.saveRowSetting(row),
        () => { setTimeout(() => { row.autoScanEnabled = false; }, 0); }
      );
    } else {
      // DISABLE
      this.openConfirm(
        "Are you sure you want to disable auto scan for " + row.wardName + "?",
        () => this.disableRowSetting(row),
        () => { setTimeout(() => { row.autoScanEnabled = true; }, 0); }
      );
    }
  }

  onRowCriteriaChange(row: any) {
    if (row.autoScanEnabled && row.hasSavedSetting) {
      if (row.range == row.previousRange) {
        return;
      }
      this.openConfirm(
        "You are changing the scanning % for " + row.wardName + ". Save the new setting?",
        () => this.saveRowSetting(row),
        () => { let prev = row.previousRange; setTimeout(() => { row.range = prev; }, 0); }
      );
    }
  }

  saveRowSetting(row: any) {
    let data = {
      _at: this.getCurrentDateTime(),
      _by: Number(this.userId) || this.userId || "",
      appliedFor: this.getCurrentDate(),
      range: row.range
    };
    this.db.object(this.dbBasePath + "/" + row.wardNo).set(data).then(() => {
      row.autoScanEnabled = true;
      row.hasSavedSetting = true;
      row.previousRange = row.range;
      this.commonService.setAlertMessage("success", "Auto scan enabled for " + row.wardName + " !!!");
    }).catch(() => {
      this.commonService.setAlertMessage("error", "Save problem for " + row.wardName);
      setTimeout(() => { row.autoScanEnabled = false; }, 0);
    });
  }

  disableRowSetting(row: any) {
    this.db.object(this.dbBasePath + "/" + row.wardNo).remove().then(() => {
      row.autoScanEnabled = false;
      row.hasSavedSetting = false;
      row.previousRange = "";
      row.range = "";
      this.commonService.setAlertMessage("success", "Auto scan disabled for " + row.wardName + " !!!");
    }).catch(() => {
      this.commonService.setAlertMessage("error", "Disable problem for " + row.wardName);
      setTimeout(() => { row.autoScanEnabled = true; }, 0);
    });
  }

  // ---------- WardLineCards JSON ----------
  loadWardLineCardsJson(ward: any): Promise<any> {
    return new Promise((resolve) => {
      let folder = this.wardLineCardsFolder.replace(/\//g, "%2F");
      let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + folder + encodeURIComponent(ward) + ".json?alt=media";
      let inst = this.httpService.get(path).subscribe((data: any) => {
        inst.unsubscribe();
        resolve(data != null ? data : null);
      }, () => resolve(null));
    });
  }

  // Houses/<ward>/<line>/<card> se per-line count bana ke JSON save
  buildAndSaveWardLineCards(ward: any): Promise<any> {
    return new Promise((resolve) => {
      let inst = this.db.object("Houses/" + ward).valueChanges().subscribe((data: any) => {
        inst.unsubscribe();
        let lines = {};
        let totalCards = 0;
        if (data != null) {
          let lineKeys = Object.keys(data);
          for (let i = 0; i < lineKeys.length; i++) {
            let lineNo = lineKeys[i];
            if (isNaN(Number(lineNo))) {
              continue;
            }
            let cards = data[lineNo];
            let cnt = cards != null ? Object.keys(cards).length : 0;
            lines[lineNo] = cnt;
            totalCards += cnt;
          }
        }
        let jsonObj = {
          ward: ward,
          lastSyncAt: this.getCurrentDateTime(),
          totalCards: totalCards,
          lines: lines
        };
        this.commonService.saveJsonFile(jsonObj, ward + ".json", this.wardLineCardsFolder);
        resolve(jsonObj);
      }, () => {
        resolve({ ward: ward, lastSyncAt: this.getCurrentDateTime(), totalCards: 0, lines: {} });
      });
    });
  }

  // ---------- Scanned count ----------
  getScannedCount(ward: any): Promise<number> {
    return new Promise((resolve) => {
      let date = this.getCurrentDate();
      let year = date.split("-")[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
      let path = "HousesCollectionInfo/" + ward + "/" + year + "/" + monthName + "/" + date;
      let inst = this.db.object(path).valueChanges().subscribe((data: any) => {
        inst.unsubscribe();
        let count = 0;
        if (data != null) {
          let keys = Object.keys(data).filter(k => this.scannedMetaKeys.indexOf(k) === -1);
          count = keys.length;
        }
        resolve(count);
      }, () => resolve(0));
    });
  }

  // ---------- Last line completed ----------
  getLastLineCompleted(ward: any): Promise<number> {
    return new Promise((resolve) => {
      let path = "WasteCollectionInfo/LastLineCompleted/" + ward;
      let inst = this.db.object(path).valueChanges().subscribe((val: any) => {
        inst.unsubscribe();
        let lastLine = Number(val) || 0;
        if (lastLine > 0) {
          resolve(lastLine);
        } else {
          this.getLastLineFromLineStatus(ward).then((fb: number) => resolve(fb));
        }
      }, () => {
        this.getLastLineFromLineStatus(ward).then((fb: number) => resolve(fb));
      });
    });
  }

  getLastLineFromLineStatus(ward: any): Promise<number> {
    return new Promise((resolve) => {
      let date = this.getCurrentDate();
      let year = date.split("-")[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
      let path = "WasteCollectionInfo/" + ward + "/" + year + "/" + monthName + "/" + date + "/LineStatus";
      let inst = this.db.object(path).valueChanges().subscribe((data: any) => {
        inst.unsubscribe();
        let lastLine = 0;
        if (data != null) {
          let nums = Object.keys(data).map(k => Number(k)).filter(n => !isNaN(n));
          if (nums.length > 0) {
            lastLine = Math.max.apply(null, nums);
          }
        }
        resolve(lastLine);
      }, () => resolve(0));
    });
  }

  // ---------- Auto-scan setting (current date only) ----------
  loadWardSetting(ward: any, row: any) {
    let inst = this.db.object(this.dbBasePath + "/" + ward).valueChanges().subscribe((data: any) => {
      inst.unsubscribe();
      if (data != null && data.range != null && data.appliedFor == this.getCurrentDate()) {
        row.autoScanEnabled = true;
        row.hasSavedSetting = true;
        row.range = data.range;
        row.previousRange = data.range;
      } else {
        row.autoScanEnabled = false;
        row.hasSavedSetting = false;
      }
    }, () => { });
  }

  // ---------- Confirmation modal ----------
  openConfirm(message: string, onYes: () => void, onNo: () => void) {
    this.confirmMessage = message;
    this.confirmYes = onYes;
    this.confirmNo = onNo;
    this.confirmVisible = true;
  }

  onConfirmYes() {
    this.confirmVisible = false;
    let fn = this.confirmYes;
    this.confirmYes = null;
    this.confirmNo = null;
    if (fn) { fn(); }
  }

  onConfirmNo() {
    this.confirmVisible = false;
    let fn = this.confirmNo;
    this.confirmYes = null;
    this.confirmNo = null;
    if (fn) { fn(); }
  }

  // ---------- Date helpers ----------
  getCurrentDate(): string {
    let d = new Date();
    let month = ("0" + (d.getMonth() + 1)).slice(-2);
    let day = ("0" + d.getDate()).slice(-2);
    return d.getFullYear() + "-" + month + "-" + day;
  }

  getCurrentDateTime(): string {
    let d = new Date();
    let h = ("0" + d.getHours()).slice(-2);
    let m = ("0" + d.getMinutes()).slice(-2);
    let s = ("0" + d.getSeconds()).slice(-2);
    return this.getCurrentDate() + " " + h + ":" + m + ":" + s;
  }

}
