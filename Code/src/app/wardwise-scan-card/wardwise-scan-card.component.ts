import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { AngularFireStorage } from "@angular/fire/storage";
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-wardwise-scan-card',
  templateUrl: './wardwise-scan-card.component.html',
  styleUrls: ['./wardwise-scan-card.component.scss']
})
export class WardwiseScanCardComponent implements OnInit {
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, private httpService: HttpClient, public actRoute: ActivatedRoute, private commonService: CommonService) { }
  zoneList: any[] = [];
  cardList: any[];
  cardFinalList: any[];
  db: any;
  cityName: any;
  todayDate: any;
  selectedDate: any;
  selectedZone: any;
  selectedYear: any;
  selectedMonthName: any;
  cardPrefix: any;
  rowDataList: any;
  divLoader = "#divLoader";
  divMainLoader = "#divMainLoader";
  lastUpdateDate: any;
  serviceName = "review-scan-card-images";
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Monitoring", "Review-Scan-Card-Images", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.todayDate = this.commonService.setTodayDate();
    this.selectedDate = this.todayDate;
    this.lastUpdateDate = "---";
    this.getZoneList();
    this.getCardPrefix();
  }

  getZoneList() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.selectedZone = "0";
  }

  getCardPrefix() {
    let path = this.commonService.fireStorageCommonPath + "CityDetails%2FCityDetails.json?alt=media";
    let cityDetailInstance = this.httpService.get(path).subscribe((data) => {
      cityDetailInstance.unsubscribe();
      if (data != null) {
        let city = this.commonService.getFireStoreCity();
        let detail = JSON.parse(JSON.stringify(data)).find(item => item.cityName == city);
        if (detail != undefined) {
          this.cardPrefix = detail.key;
        }
      }
    });
  }

  changeSelection() {
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if (new Date(this.selectedDate) > new Date(this.todayDate)) {
      this.commonService.setAlertMessage("error", "Date can not be more than today date !!!");
      return;
    }
    this.lastUpdateDate = "---";
    $(this.divMainLoader).show();
    this.cardList = [];
    this.cardFinalList = [];
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    this.getDataFromJSON();
  }

  getDataFromJSON() {
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FHouseCardScanJSON%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2FlastUpdateDate.json?alt=media";
    let lastUpdateInstance = this.httpService.get(path).subscribe(data => {
      lastUpdateInstance.unsubscribe();
      if (data != null) {
        this.lastUpdateDate = data["lastUpdateDate"];
        path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FHouseCardScanJSON%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2Flist.json?alt=media";
        let listInstance = this.httpService.get(path).subscribe(listData => {
          listInstance.unsubscribe();
          if (listData != null) {
            this.cardList = JSON.parse(JSON.stringify(listData));
            let element = <HTMLElement>document.getElementById("divList");
            element.scrollTop = 0;
            this.rowDataList = 100;
            this.cardFinalList = this.cardList.slice(0, this.rowDataList);
            $(this.divMainLoader).hide();
          }
          else {
            this.getDataFromDatabase();
          }
        }, error => {
          this.getDataFromDatabase();
        });
      }
    }, error => {
      this.getDataFromDatabase();
    });
  }

  getDataFromDatabase() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDataFromDatabase");
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let houseCollectionInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        houseCollectionInstance.unsubscribe();
        if (data != null) {
          console.log(data)
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDataFromDatabase", data);
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let cardNo = keyArray[i];
              if (cardNo.includes("ImagesData")) {
                let cardData = data[cardNo];
                this.getNotScanedCard(cardData);
              }
              if (cardNo.includes("Scanned") || cardNo.includes("ImagesData")) {
                if (cardNo.includes("Scanned")) {
                  setTimeout(() => {
                    let element = <HTMLElement>document.getElementById("divList");
                    element.scrollTop = 0;
                    this.rowDataList = 100;
                    this.cardFinalList = this.cardList.slice(0, this.rowDataList);
                    if (this.selectedDate != this.todayDate) {
                      if (data["ImagesData"] == null) {
                        this.saveJSONData();
                      }
                    }
                    $(this.divMainLoader).hide();
                  }, 12000);
                }
              }
              else {
                this.getCardImagePath(cardNo);
              }
            }
            setTimeout(() => {
              let element = <HTMLElement>document.getElementById("divList");
              element.scrollTop = 0;
              this.rowDataList = 100;
              this.cardFinalList = this.cardList.slice(0, this.rowDataList);
              if (this.selectedDate != this.todayDate) {
                if (data["ImagesData"] == null) {
                  this.saveJSONData();
                }
              }
              $(this.divMainLoader).hide();
            }, 12000);
          }
        }
        else {
          $(this.divMainLoader).hide();
          this.commonService.setAlertMessage("error", "No Scan card record found !!!");
        }
      }
    );
  }

  saveJSONData() {
    let filePath = "/HouseCardScanJSON/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/";
    this.commonService.saveJsonFile(this.cardList, "list.json", filePath)
    this.lastUpdateDate = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTime();
    const obj = { "lastUpdateDate": this.lastUpdateDate };
    this.commonService.saveJsonFile(obj, "lastUpdateDate.json", filePath);
  }

  getNotScanedCard(cardData: any) {
    let keyArray = Object.keys(cardData);
    if (cardData["lastKey"] != null) {
      for (let i = 0; i < keyArray.length; i++) {
        let key = parseInt(keyArray[i]);
        let imageURL = "";
        if (!isNaN(key)) {
          let latLng = cardData[key]["latLng"];
          let scanBy = cardData[key]["scanBy"];
          let scanTime = cardData[key]["scanTime"];
          imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FHousesCardScanImages%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + key + ".jpg?alt=media";
          this.cardList.push({ cardNo: "", imageURL: imageURL, latLng: latLng, scanBy: scanBy, scanTime: scanTime, key: key });
        }
      }
    }
    else {
      for (let i = 0; i < keyArray.length; i++) {
        let lineNo = parseInt(keyArray[i]);
        if (!isNaN(lineNo)) {
          let lineData = cardData[lineNo];
          let lineArray = Object.keys(lineData);
          for (let j = 0; j < lineArray.length; j++) {
            let imageURL = "";
            let key = lineArray[j];
            let latLng = lineData[key]["latLng"];
            let scanBy = lineData[key]["scanBy"];
            let scanTime = lineData[key]["scanTime"];
            imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FHousesCollectionImagesData%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + lineNo + "%2F" + key + ".jpg?alt=media";
            this.cardList.push({ cardNo: "", imageURL: imageURL, latLng: latLng, scanBy: scanBy, scanTime: scanTime, lineNo: lineNo, key: key });
          }
        }
      }
    }
  }

  getCardImagePath(cardNo: any) {
    let imageURL = "";
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FHousesCardScanImages%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + cardNo + ".jpg";
    let monthWiseInstance = this.httpService.get(path).subscribe((data) => {
      monthWiseInstance.unsubscribe();
      imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FHousesCardScanImages%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + cardNo + ".jpg?alt=media";
      this.cardList.push({ cardNo: cardNo, imageURL: imageURL });
    }, error => {
      imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyCardImage%2F" + cardNo + ".jpg?alt=media";
      this.cardList.push({ cardNo: cardNo, imageURL: imageURL });
    });
  }


  onContainerScroll() {
    let element = <HTMLElement>document.getElementById("divList");
    if ((element.offsetHeight + element.scrollTop + 10) >= element.scrollHeight) {
      this.rowDataList = this.rowDataList + 200;
      this.cardFinalList = this.cardList.slice(0, this.rowDataList);
    }
  }

  checkLength(index: any) {
    let value = $("#txtCardNo" + index).val();
    if (value.toString().length > 10) {
      value = value.toString().substring(0, value.toString().length - 1);
      $("#txtCardNo" + index).val(value);
    }
  }

  updateScanData(index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateScanData");
    let scanBy = this.cardList[index]["scanBy"];
    let scanTime = this.cardList[index]["scanTime"];
    let latLng = this.cardList[index]["latLng"];
    let lineNo = this.cardList[index]["lineNo"];
    let key = this.cardList[index]["key"];
    let cardImage = key + ".jpg";
    if ($("#txtCardNo" + index).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter card number!!!");
      return
    }
    $(this.divLoader).show();
    let cardNumber = this.cardPrefix + $("#txtCardNo" + index).val();
    const data = {
      scanBy: scanBy,
      scanTime: scanTime,
      latLng: latLng
    }
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + cardNumber;
    let cardInstance = this.db.object(dbPath).valueChanges().subscribe(
      preData => {
        cardInstance.unsubscribe();
        if (preData == null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateScanData", preData);
          this.updatetotalScanCounts();
        }
        this.db.object(dbPath).update(data);
        dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/ImagesData/totalCount";
        let totalScannedInstance = this.db.object(dbPath).valueChanges().subscribe(countData => {
          totalScannedInstance.unsubscribe();
          let count = 0;
          if (countData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateScanData", countData);
            if (Number(countData) != 0) {
              count = Number(countData) - 1;
            }
          }
          dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/ImagesData";
          this.db.object(dbPath).update({ totalCount: count });
        })
        this.removeImageDataRecord(key, lineNo);
        this.cardList[index]["cardNo"] = cardNumber;
        let preImageName = cardImage;
        let newImageName = cardNumber + ".jpg";
        let newPath = this.commonService.getFireStoreCity() + "/HousesCardScanImages/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/";
        let oldPath = newPath;
        if (lineNo != undefined) {
          oldPath = this.commonService.getFireStoreCity() + "/HousesCollectionImagesData/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + lineNo + "/";
        }
        const oldRef = this.storage.ref(oldPath + preImageName);
        const newRef = this.storage.ref(newPath + newImageName);
        this.renameScanCardImages(oldRef, newRef);
      }
    );
  }

  removeImageDataRecord(key: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "removeImageDataRecord");
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/ImagesData/" + key;
    if (lineNo != undefined) {
      dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/ImagesData/" + lineNo + "/" + key;
    }
    this.db.object(dbPath).remove();
    if (this.selectedDate != this.todayDate) {
      setTimeout(() => {
        dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/ImagesData";
        let imageDataInstance = this.db.object(dbPath).valueChanges().subscribe(
          imageData => {
            imageDataInstance.unsubscribe();
            if (imageData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "removeImageDataRecord", imageData);
              let keyArray = Object.keys(imageData);
              let isData = false;
              for (let i = 0; i < keyArray.length; i++) {
                let keys = parseInt(keyArray[i]);
                if (!isNaN(keys)) {
                  isData = true;
                }
              }
              if (isData == false) {
                this.db.object(dbPath).remove();
                this.saveJSONData();
              }
            }
          });
      }, 200);
    }
  }

  updatetotalScanCounts() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updatetotalScanCounts");
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/totalActualScanned";
    let totalActualScannedInstance = this.db.object(dbPath).valueChanges().subscribe(countData => {
      totalActualScannedInstance.unsubscribe();
      let count = 1;
      if (countData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updatetotalScanCounts", countData);
        count = count + Number(countData);
      }
      dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      this.db.object(dbPath).update({ totalActualScanned: count });
    });
    dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/totalScanned";
    let totalScannedInstance = this.db.object(dbPath).valueChanges().subscribe(countData => {
      totalScannedInstance.unsubscribe();
      let count = 1;
      if (countData != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updatetotalScanCounts", countData);
        count = count + Number(countData);
      }
      dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      this.db.object(dbPath).update({ totalScanned: count });
    })
  }

  renameScanCardImages(oldRef: any, newRef: any) {
    // Rename the file
    oldRef.getDownloadURL().toPromise().then((url) => {
      // Copy the file to the new location
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = () => {
        const blob = xhr.response;
        newRef.put(blob).then(() => {
          this.commonService.setAlertMessage("success", "Scan card updated successfully !!!");
          $(this.divLoader).hide();
          /*
          // Delete the old file
          oldRef.delete().toPromise().then(() => {
            console.log('File renamed successfully');

          }).catch((error) => {
            console.error('Error deleting old file:', error);
          });
          */
        }).catch((error) => {
          this.commonService.setAlertMessage("success", "Scan card updated successfully !!!");
        });
      };
      xhr.open('GET', url);
      xhr.send();
    }).catch((error) => {
    });
  }

  updateCardColectionData() {
    $(this.divMainLoader).show();
    this.cardList = [];
    this.cardFinalList = [];
    this.getDataFromDatabase();
  }
}
