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
  isActualData: any;

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
    if (localStorage.getItem("userType") == "External User") {
      this.isActualData = 0;
    }
    else {
      this.isActualData = 1;
    }
    this.getZones();
  }

  getZones() {
    $(this.divMainLoader).show();
    this.zoneList = [];
    this.zoneDutyOnList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    for (let i = 1; i < this.zoneList.length; i++) {
      this.zoneDutyOnList.push({ zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"], dutyOnImages: [] });
    }
    const promises = [];
    for (let i = 0; i < this.zoneDutyOnList.length; i++) {
      promises.push(Promise.resolve(this.getDutyOnImages(this.zoneDutyOnList[i].zoneNo)));
    }
    Promise.all(promises).then((results) => {
      for (let i = 0; i < results.length; i++) {
        if (results[i]["status"] == "success") {
          let detail = this.zoneDutyOnList.find(item => item.zoneNo == results[i]["data"].zoneNo);
          if (detail != undefined) {
            detail.dutyOnImages = results[i]["data"].dutyOnImages;
            if (results[i]["data"].dutyOnImages.length > 0) {
              this.getDriverHelper(results[i]["data"].zoneNo);
            }
          }
        }
      }
      this.getDustbinDutyOnImages();
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
            let binPlanId = dataList[i]["planId"];
            let zoneName = "BinLifting(" + planName + ")";
            let planId = dataList[i]["planId"];
            if (dataList[i]["dutyOnImage"] != null) {
              let imageList = dataList[i]["dutyOnImage"].split(',');
              let imageOffList = [];
              if (dataList[i]["dutyOutImage"] != null) {
                imageOffList = dataList[i]["dutyOutImage"].split(',');
              }
              if (imageList.length > 0) {
                let driverList = dataList[i]["driver"].split(',');
                let helperList = dataList[i]["helper"].split(',');
                let secondHelperList = dataList[i]["secondHelper"] ? dataList[i]["secondHelper"].split(',') : [];
                let thirdHelperList = dataList[i]["thirdHelper"] ? dataList[i]["thirdHelper"].split(',') : [];
                let fourthHelperList = dataList[i]["fourthHelper"] ? dataList[i]["fourthHelper"].split(',') : [];
                let fifthHelperList = dataList[i]["fifthHelper"] ? dataList[i]["fifthHelper"].split(',') : [];
                let sixthHelperList = dataList[i]["sixthHelper"] ? dataList[i]["sixthHelper"].split(',') : [];
                let vehicleList = dataList[i]["vehicle"].split(',');
                for (let j = 0; j < imageList.length; j++) {
                  let imageName = imageList[j].toString().trim();
                  let driverId = "---";
                  let helperId = "---";
                  let secondHelperId = "---";
                  let thirdHelperId = "---";
                  let fourthHelperId = "---";
                  let fifthHelperId = "---";
                  let sixthHelperId = "---";
                  let vehicle = "---";
                  let time = "---";
                  if (driverList[j] != null) {
                    driverId = driverList[j];
                  }
                  if (helperList[j] != null) {
                    helperId = helperList[j];
                  }
                  if (secondHelperList[j] != null) {
                    secondHelperId = secondHelperList[j];
                  }
                  if (thirdHelperList[j] != null) {
                    thirdHelperId = thirdHelperList[j];
                  }
                  if (fourthHelperList[j] != null) {
                    fourthHelperId = fourthHelperList[j];
                  }
                  if (fifthHelperList[j] != null) {
                    fifthHelperId = fifthHelperList[j];
                  }
                  if (sixthHelperList[j] != null) {
                    sixthHelperId = sixthHelperList[j];
                  }
                  if (vehicleList[j] != null) {
                    vehicle = vehicleList[j];
                  }
                  let dutyOffImageName = "";
                  let dutyOffImageUrl = "";
                  if (imageOffList[j] != undefined) {
                    dutyOffImageName = imageOffList[j].toString().trim();
                    dutyOffImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutImages%2FBinLifting%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + planId + "%2F" + imageName + "?alt=media";
                  }

                  let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnImages%2FBinLifting%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + planId + "%2F" + imageName + "?alt=media";
                  dutyOnImages.push({ planId: binPlanId, imageUrl: imageUrl, time: time, driverId: driverId, helperId: helperId, secondHelperId: secondHelperId, thirdHelperId: thirdHelperId, fourthHelperId: fourthHelperId, fifthHelperId: fifthHelperId, sixthHelperId: sixthHelperId, driver: "---", helper: "---", secondHelper: "---", thirdHelper: "---", fourthHelper: "---", fifthHelper: "---", sixthHelper: "---", vehicle: vehicle, imageDutyOffUrl: dutyOffImageUrl });
                }
              }
            }
            this.zoneDutyOnList.push({ zoneNo: planName, zoneName: zoneName, dutyOnImages: dutyOnImages });

            this.getEmployeeNamebyId(planName);
            this.getDutyOnTime(planName, planId);
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


  getDutyOnTime(zone: any, planId: any) {
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
              let dutyOnDetail = detail.dutyOnImages.find(item => item.planId == planId);
              if (dutyOnDetail != undefined) {
                for (let j = 0; j <= 5; j++) {
                  if (data["task" + j] != null) {
                    if (data["task" + j]["task"].includes("BinLifting") || data["task" + j]["openDepotPlanId"] != null) {
                      if (data["task" + j]["binLiftingPlanId"] == planId || data["task" + j]["openDepotPlanId"] == planId) {
                        if (data["task" + j]["in-out"] != null) {
                          let keyArray = Object.keys(data["task" + j]["in-out"]);
                          for (let k = 0; k < keyArray.length; k++) {
                            let time = keyArray[k];
                            if (data["task" + j]["in-out"][time] == "In") {
                              time = time.toString().split(':')[0] + ":" + time.toString().split(':')[1];
                              k = keyArray.length;
                              j = 6;
                              dutyOnDetail.time = time;
                            }
                          }
                        }
                      }
                    }
                    else {

                    }
                  }
                }
                for (let j = 0; j <= 5; j++) {
                  if (data["task" + j] != null) {
                    if (data["task" + j]["task"].includes("BinLifting") || data["task" + j]["openDepotPlanId"] != null) {
                      if (data["task" + j]["binLiftingPlanId"] == planId || data["task" + j]["openDepotPlanId"] == planId) {
                        if (data["task" + j]["in-out"] != null) {
                          let keyArray = Object.keys(data["task" + j]["in-out"]);
                          for (let k = keyArray.length - 1; k >= 0; k--) {
                            let time = keyArray[k];
                            if (data["task" + j]["in-out"][time] == "Out") {
                              time = time.toString().split(':')[0] + ":" + time.toString().split(':')[1];
                              k = -1;
                              j = 6;
                              dutyOnDetail.timeDutyOff = time;
                            }
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
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["secondHelperId"]).then((employee) => {
          list[i]["secondHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["thirdHelperId"]).then((employee) => {
          list[i]["thirdHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["fourthHelperId"]).then((employee) => {
          list[i]["fourthHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["fifthHelperId"]).then((employee) => {
          list[i]["fifthHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["sixthHelperId"]).then((employee) => {
          list[i]["sixthHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
      }
    }
  }

  getDutyOnImages(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDutyOnImages");
    return new Promise((resolve) => {
      let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary";
      let summaryInstance = this.db.object(dbPath).valueChanges().subscribe(
        summaryData => {
          summaryInstance.unsubscribe();
          let dutyOnImages = [];
          if (summaryData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDutyOnImages", summaryData);
            if (summaryData["dutyInTime"] != null) {
              let timeList = summaryData["dutyInTime"].split(',');
              let outTimeList = [];
              if (summaryData["dutyOutTime"] != null) {
                outTimeList = summaryData["dutyOutTime"].split(',');
              }
              for (let i = 0; i < timeList.length; i++) {
                let time = timeList[i];
                let offTime = "";
                if (outTimeList[i] != undefined) {
                  offTime = outTimeList[i];
                }
                dutyOnImages.push({ binPlanId: "", imageUrl: "", time: time, driver: "---", helper: "---", secondHelper: "---", thirdHelper: "---", fourthHelper: "---", fifthHelper: "---", sixthHelper: "---", vehicle: "---", timeDutyOff: offTime, imageDutyOffUrl: "" });
              }
            }
            if (summaryData["dutyOnImage"] != null) {
              let list = summaryData["dutyOnImage"].split(',');
              for (let i = 0; i < list.length; i++) {
                let imageName = list[i].toString().trim();
                let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnImages%2F" + zoneNo + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
                if (imageName.includes("1")) {
                  dutyOnImages[0]["imageUrl"] = imageUrl;
                }
                else if (imageName.includes("2")) {
                  dutyOnImages[1]["imageUrl"] = imageUrl;
                }
                else if (imageName.includes("3")) {
                  dutyOnImages[2]["imageUrl"] = imageUrl;
                }
                else if (imageName.includes("4")) {
                  dutyOnImages[3]["imageUrl"] = imageUrl;
                }
                else if (imageName.includes("5")) {
                  dutyOnImages[4]["imageUrl"] = imageUrl;
                }
              }
            }
            if (summaryData["dutyOutImage"] != null) {
              let list = summaryData["dutyOutImage"].split(',');
              for (let i = 0; i < list.length; i++) {
                let imageName = list[i].toString().trim();
                let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutImages%2F" + zoneNo + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
                if (imageName.includes("1")) {
                  if (dutyOnImages.length > 0) {
                    dutyOnImages[0]["imageDutyOffUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("2")) {
                  if (dutyOnImages.length > 1) {
                    dutyOnImages[1]["imageDutyOffUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("3")) {
                  if (dutyOnImages.length > 2) {
                    dutyOnImages[2]["imageDutyOffUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("4")) {
                  if (dutyOnImages.length > 3) {
                    dutyOnImages[3]["imageDutyOffUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("5")) {
                  if (dutyOnImages.length > 4) {
                    dutyOnImages[4]["imageDutyOffUrl"] = imageUrl;
                  }
                }
              }
            }
            resolve({ status: "success", data: { zoneNo: zoneNo, dutyOnImages: dutyOnImages } });
          }
          else {
            resolve({ status: "fail", data: {} });
          }
        }
      );

    });
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
          let secondHelperList = workerData["secondHelperName"] ? workerData["secondHelperName"].split(',') : [];
          let thirdHelperList = workerData["thirdHelperName"] ? workerData["thirdHelperName"].split(',') : [];
          let fourthHelperList = workerData["fourthHelperName"] ? workerData["fourthHelperName"].split(',') : [];
          let fifthHelperList = workerData["fifthHelperName"] ? workerData["fifthHelperName"].split(',') : [];
          let sixthHelperList = workerData["sixthHelperName"] ? workerData["sixthHelperName"].split(',') : [];
          let vehicleList = workerData["vehicle"].split(',');
          let detail = this.zoneDutyOnList.find(item => item.zoneNo == zone);
          if (detail != undefined) {
            let list = detail.dutyOnImages;
            for (let i = 0; i < list.length; i++) {
              let driver = "---";
              let helper = "---";
              let secondHelper = "---";
              let thirdHelper = "---";
              let fourthHelper = "---";
              let fifthHelper = "---";
              let sixthHelper = "---";
              let vehicle = "---";
              if (driverList[i] != null) {
                driver = driverList[i];
              }
              if (helperList[i] != null) {
                helper = helperList[i];
              }
              if (secondHelperList[i] != null) {
                secondHelper = secondHelperList[i];
              }
              if (thirdHelperList[i] != null) {
                thirdHelper = thirdHelperList[i];
              }
              if (fourthHelperList[i] != null) {
                fourthHelper = fourthHelperList[i];
              }
              if (fifthHelperList[i] != null) {
                fifthHelper = fifthHelperList[i];
              }
              if (sixthHelperList[i] != null) {
                sixthHelper = sixthHelperList[i];
              }
              if (vehicleList[i] != null) {
                vehicle = vehicleList[i];
              }
              detail.dutyOnImages[i]["driver"] = driver;
              detail.dutyOnImages[i]["helper"] = helper;
              detail.dutyOnImages[i]["secondHelper"] = secondHelper;
              detail.dutyOnImages[i]["thirdHelper"] = thirdHelper;
              detail.dutyOnImages[i]["fourthHelper"] = fourthHelper;
              detail.dutyOnImages[i]["fifthHelper"] = fifthHelper;
              detail.dutyOnImages[i]["sixthHelper"] = sixthHelper;
              detail.dutyOnImages[i]["vehicle"] = vehicle;

              if (this.isActualData === 1 && i === 0) {
                this.getUpdatedTime(zone, i, detail);
              }
            }
          }
        }
      });
  }

  getUpdatedTime(zone: any, idx: any, detail: any) {
    const dbPath = `/WardTimeManageHistory/${this.selectedYear}/${this.selectedMonthName}/${this.selectedDate}/${zone}`
    this.db.object(dbPath).valueChanges().subscribe((res: any) => {
      if (res) {
        if (res.dutyOn) {
          const actualDutyOnTime = res.dutyOn[1].preTime || null
          if (actualDutyOnTime) {
            detail.dutyOnImages[idx]['actualDutyOnTime'] = actualDutyOnTime
          }
        }

        if (res.dutyOff) {
          const actualDutyOffTime = res.dutyOff[1].preTime || null
          if (actualDutyOffTime) {
            detail.dutyOnImages[idx]['actualDutyOffTime'] = actualDutyOffTime
          }
        }
      }
    })

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
    this.getZones();
  }

}
