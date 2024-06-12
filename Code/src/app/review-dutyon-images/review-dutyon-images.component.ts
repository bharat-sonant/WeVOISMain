import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { AngularFireStorage } from "@angular/fire/storage";
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-review-dutyon-images',
  templateUrl: './review-dutyon-images.component.html',
  styleUrls: ['./review-dutyon-images.component.scss']
})
export class ReviewDutyonImagesComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, private httpService: HttpClient, public actRoute: ActivatedRoute, private commonService: CommonService) { }
  zoneList: any[] = [];
  zoneDutyOnList: any[] = [];
  db: any;
  cityName: any;
  todayDate: any;
  selectedDate: any;
  selectedYear: any;
  selectedMonthName: any;
  divMainLoader = "#divMainLoader";
  serviceName = "review-duty-on-images";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Monitoring", "Review-Duty-On-Images", localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.todayDate = this.commonService.setTodayDate();
    this.selectedDate = this.todayDate;
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    this.getZones();
  }

  getZones() {
    $(this.divMainLoader).show();
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardDutyOnImageJSON%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + ".json?alt=media";
    let tripInstance = this.httpService.get(path).subscribe(data => {
      tripInstance.unsubscribe();
      if (data != null) {
        this.zoneDutyOnList = JSON.parse(JSON.stringify(data));
      }
      $(this.divMainLoader).hide();
    }, error => {
      this.zoneList = [];
      this.zoneDutyOnList = [];
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
      for (let i = 1; i < this.zoneList.length; i++) {
        this.zoneDutyOnList.push({ zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"], dutyOnImages: [] });
      }
      this.getDutyOnImages(0);
    });
  }

  getDustbinDutyOnImages() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinDutyOnImages");
    let dbPath = "DustbinData/DustbinAssignment/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "";
    let dustbinAssignInstance = this.db.list(dbPath).valueChanges().subscribe(
      dataList => {
        dustbinAssignInstance.unsubscribe();
        if (dataList.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinDutyOnImages", dataList);
          for (let i = 0; i < dataList.length; i++) {
            let dutyOnImages = [];
            let planName = dataList[i]["planName"];
            let zoneName = "BinLifting(" + planName + ")";
            let planId = dataList[i]["planId"];
            if (dataList[i]["dutyOnImage"] != null) {
              let imageList = dataList[i]["dutyOnImage"].split(',');
              if (imageList.length > 0) {
                let driverList = dataList[i]["driver"].split(',');
                let helperList = dataList[i]["helper"].split(',');
                let vehicleList = dataList[i]["vehicle"].split(',');
                for (let j = 0; j < imageList.length; j++) {
                  let imageName = imageList[j].toString().trim();
                  let driverId = "---";
                  let helperId = "---";
                  let vehicle = "---";
                  let time = "---";
                  if (driverList[j] != null) {
                    driverId = driverList[j];
                  }
                  if (helperList[j] != null) {
                    helperId = helperList[j];
                  }
                  if (vehicleList[j] != null) {
                    vehicle = vehicleList[j];
                  }
                  let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnImages%2FBinLifting%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + planId + "%2F" + imageName + "?alt=media";
                  dutyOnImages.push({ imageUrl: imageUrl, time: time, driverId: driverId, helperId: helperId, driver: "---", helper: "---", vehicle: vehicle });
                }
              }
            }
            this.zoneDutyOnList.push({ zoneNo: planName, zoneName: zoneName, dutyOnImages: dutyOnImages });
            this.getEmployeeNamebyId(planName);
            this.getDutyOnTime(planName);
          }
        }
        if (this.selectedDate == this.todayDate) {
          $(this.divMainLoader).hide();
        }
        else {
          setTimeout(() => {
            $(this.divMainLoader).hide();
            let filePath = "/WardDutyOnImageJSON/" + this.selectedYear + "/" + this.selectedMonthName + "/";
            this.commonService.saveJsonFile(this.zoneDutyOnList, this.selectedDate + ".json", filePath);
          }, 3000);
        }
      });
  }

  syncData() {
    $(this.divMainLoader).show();
    this.zoneList = [];
    this.zoneDutyOnList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    for (let i = 1; i < this.zoneList.length; i++) {
      this.zoneDutyOnList.push({ zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"], dutyOnImages: [] });
    }
    this.getDutyOnImages(0);
    // for (let i = 0; i < this.zoneDutyOnList.length; i++) {
    //   this.zoneDutyOnList[i]["dutyOnImages"] = [];
    // }
    // this.getDutyOnImages(0);
  }

  getDutyOnTime(zone: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDutyOnTime");
    let detail = this.zoneDutyOnList.find(item => item.zoneNo == zone);
    if (detail != undefined) {
      let list = detail.dutyOnImages;
      for (let i = 0; i < list.length; i++) {
        let driverId = list[i]["driverId"];
        let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + driverId;
        let instance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            instance.unsubscribe();
            if (data != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDutyOnTime", data);
              for (let j = 0; j <= 5; j++) {
                if (data["task" + j] != null) {
                  if (data["task" + j]["task"].includes("BinLifting")) {
                    if (data["task" + j]["in-out"] != null) {
                      let keyArray = Object.keys(data["task" + j]["in-out"]);
                      for (let k = 0; k < keyArray.length; k++) {
                        let time = keyArray[i];
                        if (data["task" + j]["in-out"][time] == "In") {
                          time = time.toString().split(':')[0] + ":" + time.toString().split(':')[1];
                          k = keyArray.length;
                          j = 6;
                          let dutyOnDetail = detail.dutyOnImages.find(item => item.driverId == driverId);
                          if (dutyOnDetail != undefined) {
                            dutyOnDetail.time = time;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        );
      }
    }
  }

  getEmployeeNamebyId(zone: any) {
    let detail = this.zoneDutyOnList.find(item => item.zoneNo == zone);
    if (detail != undefined) {
      let list = detail.dutyOnImages;
      for (let i = 0; i < list.length; i++) {
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["driverId"]).then((employee) => {
          list[i]["driver"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["helperId"]).then((employee) => {
          list[i]["helper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
      }
    }
  }

  getDutyOnImages(index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDutyOnImages");
    if (index == this.zoneDutyOnList.length) {
      this.getDustbinDutyOnImages();
    }
    else {
      let zone = this.zoneDutyOnList[index]["zoneNo"];
      let dbPath = "WasteCollectionInfo/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary";
      let summaryInstance = this.db.object(dbPath).valueChanges().subscribe(
        summaryData => {
          summaryInstance.unsubscribe();
          if (summaryData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDutyOnImages", summaryData);

            if (summaryData["dutyOnImage"] != null) {
              let list = summaryData["dutyOnImage"].split(',');
              let timeList = summaryData["dutyInTime"].split(',');
              let listDutyOff = [];
              let timeDutyOffList = [];
              if (summaryData["dutyOutImage"] != null) {
                listDutyOff = summaryData["dutyOutImage"].split(',');
              }
              if (summaryData["dutyOutTime"] != null) {
                timeDutyOffList = summaryData["dutyOutTime"].split(',');
              }
              let detail = this.zoneDutyOnList.find(item => item.zoneNo == zone);
              if (detail != undefined) {
                for (let i = 0; i < list.length; i++) {
                  let imageName = list[i];
                  let time = timeList[i];
                  let imageNameDutyOff = "";
                  let timeDutyOff = "";
                  if (listDutyOff[i] != null) {
                    imageNameDutyOff = listDutyOff[i].trim();
                  }
                  if (timeDutyOffList[i] != null) {
                    timeDutyOff = timeDutyOffList[i].trim();
                  }
                  if (imageName != "") {
                    let imageDutyOffUrl = "";
                    let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnImages%2F" + zone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
                    if (imageNameDutyOff != "") {
                      imageDutyOffUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutImages%2F" + zone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + imageNameDutyOff + "?alt=media";
                    }
                    detail.dutyOnImages.push({ imageUrl: imageUrl, time: time, driver: "---", helper: "---", vehicle: "---", timeDutyOff: timeDutyOff, imageDutyOffUrl: imageDutyOffUrl });
                  }
                }
              }
              if (detail.dutyOnImages.length > 0) {
                this.getDriverHelper(zone);
              }
            }
            else if (summaryData["dutyOutImage"] != null) {
              let timeList = summaryData["dutyInTime"].split(',');
              let listDutyOff = [];
              let timeDutyOffList = [];
              if (summaryData["dutyOutImage"] != null) {
                listDutyOff = summaryData["dutyOutImage"].split(',');
              }
              if (summaryData["dutyOutTime"] != null) {
                timeDutyOffList = summaryData["dutyOutTime"].split(',');
              }
              let detail = this.zoneDutyOnList.find(item => item.zoneNo == zone);
              if (detail != undefined) {
                for (let i = 0; i < timeDutyOffList.length; i++) {
                  let imageName = timeDutyOffList[i];
                  let time = timeList[i];
                  let imageNameDutyOff = "";
                  let timeDutyOff = "";
                  if (listDutyOff[i] != null) {
                    imageNameDutyOff = listDutyOff[i].trim();
                  }
                  if (timeDutyOffList[i] != null) {
                    timeDutyOff = timeDutyOffList[i].trim();
                  }
                  if (imageName != "") {
                    let imageDutyOffUrl = "";
                    let imageUrl = "";
                    if (imageNameDutyOff != "") {
                      imageDutyOffUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutImages%2F" + zone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + imageNameDutyOff + "?alt=media";
                    }
                    detail.dutyOnImages.push({ imageUrl: imageUrl, time: time, driver: "---", helper: "---", vehicle: "---", timeDutyOff: timeDutyOff, imageDutyOffUrl: imageDutyOffUrl });
                  }
                }
              }
              if (detail.dutyOnImages.length > 0) {
                this.getDriverHelper(zone);
              }
            }
          }
          index++;
          this.getDutyOnImages(index);
        }
      );
    }
  }

  getDriverHelper(zone: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDriverHelper");
    let dbPath = "WasteCollectionInfo/" + zone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/WorkerDetails";
    let workerDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
      workerData => {
        workerDetailInstance.unsubscribe();
        if (workerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDriverHelper", workerData);
          let driverList = workerData["driverName"].split(',');
          let helperList = workerData["helperName"].split(',');
          let vehicleList = workerData["vehicle"].split(',');
          let detail = this.zoneDutyOnList.find(item => item.zoneNo == zone);
          if (detail != undefined) {
            let list = detail.dutyOnImages;
            for (let i = 0; i < list.length; i++) {
              let driver = "---";
              let helper = "---";
              let vehicle = "---";
              if (driverList[i] != null) {
                driver = driverList[i];
              }
              if (helperList[i] != null) {
                helper = helperList[i];
              }
              if (vehicleList[i] != null) {
                vehicle = vehicleList[i];
              }
              detail.dutyOnImages[i]["driver"] = driver;
              detail.dutyOnImages[i]["helper"] = helper;
              detail.dutyOnImages[i]["vehicle"] = vehicle;
            }
          }
        }
      });
  }

  setDate(type: string) {
    if (type == "previous") {
      this.selectedDate = this.commonService.getPreviousDate(this.selectedDate, 1);
    }
    else if (type == "next") {
      this.selectedDate = this.commonService.getNextDate(this.selectedDate, 1);
    }
    if (new Date(this.selectedDate) > new Date(this.todayDate)) {
      this.commonService.setAlertMessage("error", "Selected date can not be more than " + this.todayDate + "");
      return;
    }
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    this.syncData();
    // this.getZones();
  }

}
