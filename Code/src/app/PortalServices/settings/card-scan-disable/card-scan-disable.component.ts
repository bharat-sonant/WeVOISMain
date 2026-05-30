import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common/common.service';
import { FirebaseService } from '../../../firebase.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-card-scan-disable',
  templateUrl: './card-scan-disable.component.html',
  styleUrls: ['./card-scan-disable.component.scss']
})
export class CardScanDisableComponent implements OnInit {

  // Feature sirf in cities ke liye visible hoga (cityName lowercase store hota hai)
  allowedCities = ['hisar', 'devtest'];

  // Realtime Database base node. Iske andar do sub-node:
  //   Ward -> { wardName: "YYYY-MM-DD HH:mm:ss" }            (poora ward disabled)
  //   Line -> { wardName: { lineNo: "YYYY-MM-DD HH:mm:ss" } } (line-wise disabled)
  dbBasePath = 'Settings/MinimumScanSettings';

  cityName: any = '';
  db: any;
  isAllowedCity = false;
  wardList: any[] = [];
  selectedWard = '';
  lines: { lineNo: number }[] = [];
  loadingLines = false;

  // DB se loaded object: { Ward: {...}, Line: {...} }
  scanSettings: any = { Ward: {}, Line: {} };

  // Current ward ka UI state
  disableWholeWard = false;
  disabledLineMap: { [lineNo: string]: boolean } = {};

  currentDate = '';

  constructor(private commonService: CommonService, public fs: FirebaseService, public httpService: HttpClient) { }

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    this.isAllowedCity = this.allowedCities.indexOf(this.cityName) !== -1;
    if (!this.isAllowedCity) {
      return;
    }
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.currentDate = this.getCurrentDate();
    this.loadWards();
    this.loadScanSettings();
  }

  // YYYY-MM-DD format
  getCurrentDate(): string {
    let d = new Date();
    let month = ('0' + (d.getMonth() + 1)).slice(-2);
    let day = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + month + '-' + day;
  }

  // YYYY-MM-DD HH:mm:ss format (DB mein save hone wali value)
  getCurrentDateTime(): string {
    let d = new Date();
    let h = ('0' + d.getHours()).slice(-2);
    let m = ('0' + d.getMinutes()).slice(-2);
    let s = ('0' + d.getSeconds()).slice(-2);
    return this.getCurrentDate() + ' ' + h + ':' + m + ':' + s;
  }

  // Stored datetime ka date-part aaj ke barabar hai ya nahi (current-day-only check)
  isToday(value: any): boolean {
    return value != null && value.toString().substring(0, 10) === this.currentDate;
  }

  // Ward list AvailableWard.json se: data ek string array hai jaise [null,"Bharat","Anil",...]
  loadWards() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + '%2FDefaults%2FAvailableWard.json?alt=media';
    let instance = this.httpService.get(path).subscribe((data: any) => {
      instance.unsubscribe();
      let list = (data != null) ? data : [];
      let wards: { wardNo: any }[] = [];
      for (let i = 0; i < list.length; i++) {
        if (list[i] != null && list[i].toString().trim() !== '') {
          wards.push({ wardNo: list[i] });
        }
      }
      this.wardList = wards;
    }, () => {
      this.wardList = [];
    });
  }

  // Realtime Database se existing MinimumScanSettings padho
  loadScanSettings() {
    let instance = this.db.object(this.dbBasePath).valueChanges().subscribe((data: any) => {
      instance.unsubscribe();
      this.scanSettings = (data != null) ? data : {};
      if (this.scanSettings.Ward == null) { this.scanSettings.Ward = {}; }
      if (this.scanSettings.Line == null) { this.scanSettings.Line = {}; }
    }, () => {
      this.scanSettings = { Ward: {}, Line: {} };
    });
  }

  onWardChange(wardNo: any) {
    // Ward change hote hi previous ward ki saari selection turant clear
    this.lines = [];
    this.disableWholeWard = false;
    this.disabledLineMap = {};
    this.loadingLines = false;
    if (wardNo == null || wardNo === '') {
      return;
    }
    this.loadingLines = true;
    this.commonService.getWardLine(wardNo, this.currentDate).then((linesData: any) => {
      // Agar tab tak user ne dusra ward select kar liya, to ye purana response ignore karo
      if (this.selectedWard != wardNo) {
        return;
      }
      this.loadingLines = false;
      if (linesData != null) {
        let lineObj = JSON.parse(linesData);
        let keys = Object.keys(lineObj);
        let lineList: { lineNo: number }[] = [];
        for (let i = 0; i < keys.length; i++) {
          // sirf numeric lineNo keys; meta keys (totalLines/totalHouseCount) skip
          if (keys[i] !== '' && !isNaN(Number(keys[i]))) {
            lineList.push({ lineNo: Number(keys[i]) });
          }
        }
        lineList.sort((a, b) => a.lineNo - b.lineNo);
        this.lines = lineList;
      }
      this.hydrateWardState(wardNo);
    }, () => {
      if (this.selectedWard != wardNo) {
        return;
      }
      this.loadingLines = false;
      this.hydrateWardState(wardNo);
    });
  }

  // scanSettings se current ward ka saved state toggles mein reflect karo.
  // Disable sirf current day ke liye valid hai -> sirf aaj ki datetime wali entry ON dikhegi.
  // Purani date (kal/pehle) wali entries expired maani jaati hain -> OFF (reset).
  hydrateWardState(wardNo: any) {
    this.disableWholeWard = false;
    this.disabledLineMap = {};

    // Poora ward disabled?
    let wardVal = this.scanSettings.Ward ? this.scanSettings.Ward[wardNo] : null;
    if (this.isToday(wardVal)) {
      this.disableWholeWard = true;
    }

    // Line-wise disabled?
    let lineVal = this.scanSettings.Line ? this.scanSettings.Line[wardNo] : null;
    if (lineVal != null && typeof lineVal === 'object') {
      let lineKeys = Object.keys(lineVal);
      for (let i = 0; i < lineKeys.length; i++) {
        if (this.isToday(lineVal[lineKeys[i]])) {
          this.disabledLineMap[lineKeys[i]] = true;
        }
      }
    }
  }

  // Complete-ward toggle -> turant DB update (auto-save, koi save button nahi)
  onWholeWardToggle() {
    const ward = this.selectedWard;
    if (ward == null || ward === '') {
      return;
    }
    if (this.disableWholeWard) {
      // Poora ward disable: sirf Ward node set karo. Line data ko bilkul mat chhedo
      // (Line aur Ward dono independent hain).
      let now = this.getCurrentDateTime();
      if (this.scanSettings.Ward == null) { this.scanSettings.Ward = {}; }
      this.scanSettings.Ward[ward] = now;
      this.writeResult(this.db.object(this.dbBasePath + '/Ward/' + ward).set(now), 'पूरा वार्ड कार्ड स्कैनिंग के लिए बंद कर दिया गया।');
    } else {
      // Ward enable: Ward node hata do
      if (this.scanSettings.Ward) { delete this.scanSettings.Ward[ward]; }
      this.writeResult(this.db.object(this.dbBasePath + '/Ward/' + ward).remove(), 'पूरा वार्ड फिर से चालू कर दिया गया।');
    }
  }

  // Line toggle -> turant DB update. Poora ward disabled ho to allowed nahi.
  onLineToggle(lineNo: any) {
    const ward = this.selectedWard;
    if (ward == null || ward === '') {
      return;
    }
    if (this.disableWholeWard) {
      // Poora ward disabled ho to lines change nahi kar sakte (toggle UI mein disabled hai;
      // ye sirf safety guard hai). Line data waisa hi rahega.
      this.commonService.setAlertMessage('error', 'पूरा वार्ड पहले से बंद है। लाइन के हिसाब से बंद करने के लिए पहले वार्ड को चालू करें।');
      return;
    }
    let linePath = this.dbBasePath + '/Line/' + ward + '/' + lineNo;
    if (this.disabledLineMap[lineNo]) {
      // Line disable
      let now = this.getCurrentDateTime();
      if (this.scanSettings.Line == null) { this.scanSettings.Line = {}; }
      if (this.scanSettings.Line[ward] == null) { this.scanSettings.Line[ward] = {}; }
      this.scanSettings.Line[ward][lineNo] = now;
      this.writeResult(this.db.object(linePath).set(now), 'लाइन ' + lineNo + ' कार्ड स्कैनिंग के लिए बंद कर दी गई।');
    } else {
      // Line enable
      if (this.scanSettings.Line && this.scanSettings.Line[ward]) {
        delete this.scanSettings.Line[ward][lineNo];
      }
      this.writeResult(this.db.object(linePath).remove(), 'लाइन ' + lineNo + ' फिर से चालू कर दी गई।');
    }
  }

  // DB write ka result handle karo
  writeResult(promise: any, successMsg: string) {
    promise.then(() => {
      this.commonService.setAlertMessage('success', successMsg);
    }).catch(() => {
      this.commonService.setAlertMessage('error', 'सेटिंग अपडेट करने में समस्या हुई।');
    });
  }
}
