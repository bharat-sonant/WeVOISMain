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

  // Realtime Database node jahan data save hoga
  dbBasePath = 'Settings/MinimumScanSettings';

  cityName: any = '';
  db: any;
  isAllowedCity = false;
  wardList: any[] = [];
  selectedWard = '';
  lines: { lineNo: number }[] = [];
  loadingLines = false;

  // DB se loaded object: { wardNo: dateString | { lineNo: dateString } }
  scanSettings: any = {};

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
    }, () => {
      this.scanSettings = {};
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

  // scanSettings se current ward ka saved state checkboxes mein reflect karo.
  // Disable sirf current day ke liye valid hai -> sirf aaj ki date wali entry checked dikhegi.
  // Purani date (kal/pehle) wali entries expired maani jaati hain -> unchecked (reset).
  hydrateWardState(wardNo: any) {
    let saved = this.scanSettings ? this.scanSettings[wardNo] : null;
    this.disableWholeWard = false;
    this.disabledLineMap = {};
    if (saved == null) {
      return;
    }
    if (typeof saved === 'string') {
      // poora ward disabled -> sirf tab checked jab date == aaj
      if (saved === this.currentDate) {
        this.disableWholeWard = true;
      }
    } else if (typeof saved === 'object') {
      // line-wise disabled -> sirf wahi lines checked jinki date == aaj
      let lineKeys = Object.keys(saved);
      for (let i = 0; i < lineKeys.length; i++) {
        if (saved[lineKeys[i]] === this.currentDate) {
          this.disabledLineMap[lineKeys[i]] = true;
        }
      }
    }
  }

  onWholeWardToggle() {
    if (this.disableWholeWard) {
      // poora ward disable hone par line selection clear
      this.disabledLineMap = {};
    }
  }

  saveSettings() {
    if (this.selectedWard == null || this.selectedWard === '') {
      this.commonService.setAlertMessage('error', 'Please select a ward first !!!');
      return;
    }
    if (this.scanSettings == null) {
      this.scanSettings = {};
    }

    const wardPath = this.dbBasePath + '/' + this.selectedWard;

    if (this.disableWholeWard) {
      // poora ward disable -> value = current date string (line object replace ho jayega)
      this.scanSettings[this.selectedWard] = this.currentDate;
      this.writeWard(this.db.object(wardPath).set(this.currentDate));
    } else {
      // line-wise disable -> sirf checked lines ka object
      let lineEntry: { [lineNo: string]: string } = {};
      for (let i = 0; i < this.lines.length; i++) {
        let lineNo = this.lines[i].lineNo;
        if (this.disabledLineMap[lineNo]) {
          lineEntry[lineNo] = this.currentDate;
        }
      }
      if (Object.keys(lineEntry).length > 0) {
        this.scanSettings[this.selectedWard] = lineEntry;
        this.writeWard(this.db.object(wardPath).set(lineEntry));
      } else {
        // kuch bhi disabled nahi -> ward node hata do
        delete this.scanSettings[this.selectedWard];
        this.writeWard(this.db.object(wardPath).remove());
      }
    }
  }

  // DB write ka result handle karo
  writeWard(promise: any) {
    promise.then(() => {
      this.commonService.setAlertMessage('success', 'Card scan disable setting updated !!!');
    }).catch(() => {
      this.commonService.setAlertMessage('error', 'Failed to update card scan disable setting.');
    });
  }
}
