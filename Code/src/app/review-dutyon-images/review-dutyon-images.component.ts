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
  selectedDetail: selectedDetail = {
    driver: "---",
    helper: "---",
    driverImageURL: "---",
    helperImageURL: "---",
    secondHelper: "---",
    secondHelperImageURL: "---",
    thirdHelper: "---",
    thirdHelperImageURL: "---",
    fourthHelper: "---",
    fourthHelperImageURL: "---",
    fifthHelper: "---",
    fifthHelperImageURL: "---",
    sixthHelper: "---",
    sixthHelperImageURL: "---",
  };
  selectedOtherDutyDetail: otherDutySelectedDetail = {
    name: "---",
    profileImageURL: "---"
  };


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

  isSliderOpen = false;
  isOtherDutySliderOpen = false;
  isImagePopupOpen = false;
  isPopupImageLoading = false;
  selectedPopupImageUrl = "";
  imageNotAvailablePath = "../../../assets/img/avtar-user.png";

  setDefaultImage(event: any) {
    event.target.src = this.imageNotAvailablePath;
  }

  hideBrokenDutyImage(event: any) {
    const imageElement = event.target as HTMLElement;
    let imageWrapper: HTMLElement = null;
    if (imageElement != null && imageElement.parentElement != null && imageElement.parentElement.parentElement != null) {
      imageWrapper = imageElement.parentElement.parentElement as HTMLElement;
    }
    if (imageWrapper != null) {
      imageWrapper.style.display = "none";
    }
    else if (imageElement != null) {
      imageElement.style.display = "none";
    }
  }

  resetDetail() {
    this.selectedDetail.driver = "---";
    this.selectedDetail.helper = "---";
    this.selectedDetail.secondHelper = "---";
    this.selectedDetail.thirdHelper = "---";
    this.selectedDetail.fourthHelper = "---";
    this.selectedDetail.fifthHelper = "---";
    this.selectedDetail.sixthHelper = "---";
    this.selectedDetail.driverImageURL = this.imageNotAvailablePath;
    this.selectedDetail.helperImageURL = this.imageNotAvailablePath;
    this.selectedDetail.secondHelperImageURL = this.imageNotAvailablePath;
    this.selectedDetail.thirdHelperImageURL =this.imageNotAvailablePath;
    this.selectedDetail.fourthHelperImageURL = this.imageNotAvailablePath;
    this.selectedDetail.fifthHelperImageURL = this.imageNotAvailablePath;
    this.selectedDetail.sixthHelperImageURL = this.imageNotAvailablePath;
  }

  openSlider(data: any) {
    this.closeOtherDutySlider();
    this.resetDetail();
    this.selectedDetail.driver = data.driver;
    this.selectedDetail.helper = data.helper;
    this.selectedDetail.secondHelper = data.secondHelper;
    this.selectedDetail.thirdHelper = data.thirdHelper;
    this.selectedDetail.fourthHelper = data.fourthHelper;
    this.selectedDetail.fifthHelper = data.fifthHelper;
    this.selectedDetail.sixthHelper = data.sixthHelper;
    if (data.driverId != "---") {
      this.selectedDetail.driverImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.driverId + "%2FprofilePhoto.jpg?alt=media";
    }
    if (data.helperId != "---") {
      this.selectedDetail.helperImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.helperId + "%2FprofilePhoto.jpg?alt=media";
    }
    if (data.secondHelperId != "---") {
      this.selectedDetail.secondHelperImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.secondHelperId + "%2FprofilePhoto.jpg?alt=media";
    }
    if (data.thirdHelperId != "---") {
      this.selectedDetail.thirdHelperImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.thirdHelperId + "%2FprofilePhoto.jpg?alt=media";
    }
    if (data.fourthHelperId != "---") {
      this.selectedDetail.fourthHelperImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.fourthHelperId + "%2FprofilePhoto.jpg?alt=media";
    }
    if (data.fifthHelperId != "---") {
      this.selectedDetail.fifthHelperImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.fifthHelperId + "%2FprofilePhoto.jpg?alt=media";
    }
    if (data.sixthHelperId != "---") {
      this.selectedDetail.sixthHelperImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.sixthHelperId + "%2FprofilePhoto.jpg?alt=media";
    }
    this.isSliderOpen = true;
  }

  closeSlider() {
    this.isSliderOpen = false;
  }

  resetOtherDutyDetail() {
    this.selectedOtherDutyDetail.name = "---";
    this.selectedOtherDutyDetail.profileImageURL = this.imageNotAvailablePath;
  }

  openOtherDutySlider(data: any) {
    this.closeSlider();
    this.resetOtherDutyDetail();
    this.selectedOtherDutyDetail.name = data.driver || "---";
    if (data.driverId != null && data.driverId != "" && data.driverId != "---") {
      this.selectedOtherDutyDetail.profileImageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + data.driverId + "%2FprofilePhoto.jpg?alt=media";
    } else {
      this.selectedOtherDutyDetail.profileImageURL = this.imageNotAvailablePath;
    }
    this.isOtherDutySliderOpen = true;
  }

  closeOtherDutySlider() {
    this.isOtherDutySliderOpen = false;
  }

  openImagePopup(imageUrl: any, event?: any) {
    if (event != null) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (imageUrl == null || imageUrl.toString().trim() == "") {
      return;
    }
    this.isPopupImageLoading = true;
    this.selectedPopupImageUrl = imageUrl.toString();
    this.isImagePopupOpen = true;
  }

  onPopupImageLoad() {
    this.isPopupImageLoading = false;
  }

  onPopupImageError() {
    this.isPopupImageLoading = false;
    this.selectedPopupImageUrl = this.imageNotAvailablePath;
  }

  closeImagePopup() {
    this.isImagePopupOpen = false;
    this.isPopupImageLoading = false;
    this.selectedPopupImageUrl = "";
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
              let imageOnMeterList = [];
              let imageOutMeterList = [];
              if (dataList[i]["dutyOutImage"] != null) {
                imageOffList = dataList[i]["dutyOutImage"].split(',');
              }
              if (dataList[i]["dutyOnMeterImage"] != null) {
                imageOnMeterList = dataList[i]["dutyOnMeterImage"].split(',');
              }
              if (dataList[i]["dutyOutMeterImage"] != null) {
                imageOutMeterList = dataList[i]["dutyOutMeterImage"].split(',');
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
                  let dutyOnMeterImageUrl = "";
                  let dutyOutMeterImageUrl = "";
                  if (imageOffList[j] != undefined) {
                    dutyOffImageName = imageOffList[j].toString().trim();
                    dutyOffImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutImages%2FBinLifting%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + planId + "%2F" + imageName + "?alt=media";
                  }
                  if (imageOnMeterList[j] != undefined) {
                    dutyOnMeterImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnMeterReadingImages%2FBinLifting%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + planId + "%2F" + imageName + "?alt=media";
                  }
                  if (imageOutMeterList[j] != undefined) {
                    dutyOutMeterImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutMeterReadingImages%2FBinLifting%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + planId + "%2F" + imageName + "?alt=media";
                  }
                  let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnImages%2FBinLifting%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + planId + "%2F" + imageName + "?alt=media";
                  dutyOnImages.push({ planId: binPlanId, imageUrl: imageUrl, time: time, driverId: driverId, helperId: helperId, secondHelperId: secondHelperId, thirdHelperId: thirdHelperId, fourthHelperId: fourthHelperId, fifthHelperId: fifthHelperId, sixthHelperId: sixthHelperId, driver: "---", helper: "---", secondHelper: "---", thirdHelper: "---", fourthHelper: "---", fifthHelper: "---", sixthHelper: "---", vehicle: vehicle, imageDutyOffUrl: dutyOffImageUrl, imageDutyOnMeterUrl: dutyOnMeterImageUrl, imageDutyOutMeterUrl: dutyOutMeterImageUrl, driverImageURL: this.imageNotAvailablePath, helperImageURL: this.imageNotAvailablePath, secondHelperImageURL: this.imageNotAvailablePath, thirdHelperImageURL: this.imageNotAvailablePath, fourthHelperImageURL: this.imageNotAvailablePath, fifthHelperImageURL: this.imageNotAvailablePath, sixthHelperImageURL: this.imageNotAvailablePath });
                }
              }
            }
            this.zoneDutyOnList.push({ zoneNo: planName, zoneName: zoneName, dutyOnImages: dutyOnImages });

            this.getEmployeeNamebyId(planName);
            this.getDutyOnTime(planName, planId);
          }
        }
        this.getSupportServiceDutyFromWasteCollectionInfo().then(() => {
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
      });
  }

  getSupportServiceDutyFromWasteCollectionInfo() {
    return new Promise((resolve) => {
      const zoneMasterList = this.zoneList || [];
      const filteredZones = [];
      for (let i = 1; i < zoneMasterList.length; i++) {
        const zoneNo = (zoneMasterList[i]["zoneNo"] || "").toString();
        const zoneName = (zoneMasterList[i]["zoneName"] || "").toString();
        const checkValue = (zoneNo + " " + zoneName).toLowerCase();
        if (checkValue.includes("support") || checkValue.includes("service")) {
          filteredZones.push(zoneMasterList[i]);
        }
      }
      if (filteredZones.length == 0) {
        resolve(true);
        return;
      }

      const promises = [];
      for (let i = 0; i < filteredZones.length; i++) {
        promises.push(Promise.resolve(this.getSupportServiceRowsByZone(filteredZones[i]["zoneNo"])));
      }

      Promise.all(promises).then((results: any[]) => {
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result["status"] != "success" || result["rows"].length == 0) {
            continue;
          }
          const zoneNo = result["zoneNo"];
          let zoneDetail = this.zoneDutyOnList.find(item => item.zoneNo == zoneNo);
          if (zoneDetail == undefined) {
            zoneDetail = { zoneNo: zoneNo, zoneName: result["zoneName"], dutyOnImages: [] };
            this.zoneDutyOnList.push(zoneDetail);
          }
          zoneDetail.dutyOnImages = (zoneDetail.dutyOnImages || []).concat(result["rows"]);
          this.getEmployeeNamebyId(zoneNo);
        }
        resolve(true);
      });
    });
  }

  getSupportServiceRowsByZone(zoneNo: any) {
    return new Promise((resolve) => {
      const zoneMaster = this.zoneList.find(item => item["zoneNo"] == zoneNo);
      const zoneName = zoneMaster != null ? zoneMaster["zoneName"] : zoneNo;
      const dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      const instance = this.db.object(dbPath).valueChanges().subscribe((zoneData: any) => {
        instance.unsubscribe();
        const rows = [];
        if (zoneData == null) {
          resolve({ status: "fail", zoneNo: zoneNo, zoneName: zoneName, rows: rows });
          return;
        }
        const employeeIds = Object.keys(zoneData);
        for (let i = 0; i < employeeIds.length; i++) {
          const empId = employeeIds[i];
          if (empId == "Summary" || empId == "WorkerDetails") {
            continue;
          }
          const empData = zoneData[empId];
          if (empData == null) {
            continue;
          }
          for (let j = 1; j <= 10; j++) {
            const taskData = empData["task" + j];
            if (taskData == null) {
              continue;
            }

            // Support/Service zones often store task blocks without "task" name.
            // In these zones, any task block having duty data should be shown.
            const taskName = (taskData["task"] || "").toString().toLowerCase();
            const hasDutyData = taskData["dutyInTime"] != null || taskData["dutyOutTime"] != null || taskData["dutyOnImage"] != null || taskData["dutyOutImage"] != null;
            const isSupportServiceTask = taskName.includes("support") || taskName.includes("service");
            if (!isSupportServiceTask && !hasDutyData) {
              continue;
            }
            const inTime = taskData["dutyInTime"] != null ? taskData["dutyInTime"].toString() : "---";
            const outTime = taskData["dutyOutTime"] != null ? taskData["dutyOutTime"].toString() : "---";
            const inImageName = taskData["dutyOnImage"] != null ? taskData["dutyOnImage"].toString().trim() : "";
            const outImageName = taskData["dutyOutImage"] != null ? taskData["dutyOutImage"].toString().trim() : "";

            const inImageUrl = inImageName != ""
              ? this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnImages%2F" + zoneNo + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + empId + "%2F" + inImageName + "?alt=media"
              : "";
            const outImageUrl = outImageName != ""
              ? this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutImages%2F" + zoneNo + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + empId + "%2F" + outImageName + "?alt=media"
              : "";

            rows.push({
              binPlanId: "",
              imageUrl: inImageUrl,
              time: inTime,
              driverId: empId,
              helperId: "---",
              secondHelperId: "---",
              thirdHelperId: "---",
              fourthHelperId: "---",
              fifthHelperId: "---",
              sixthHelperId: "---",
              driver: "---",
              helper: "---",
              secondHelper: "---",
              thirdHelper: "---",
              fourthHelper: "---",
              fifthHelper: "---",
              sixthHelper: "---",
              vehicle: "---",
              timeDutyOff: outTime,
              imageDutyOffUrl: outImageUrl,
              imageDutyOnMeterUrl: "",
              imageDutyOutMeterUrl: "",
              driverImageURL: this.imageNotAvailablePath,
              helperImageURL: this.imageNotAvailablePath,
              secondHelperImageURL: this.imageNotAvailablePath,
              thirdHelperImageURL: this.imageNotAvailablePath,
              fourthHelperImageURL: this.imageNotAvailablePath,
              fifthHelperImageURL: this.imageNotAvailablePath,
              sixthHelperImageURL: this.imageNotAvailablePath,
              isOtherDuty: true
            });
          }
        }
        resolve({ status: "success", zoneNo: zoneNo, zoneName: zoneName, rows: rows });
      });
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
        if (list[i]["isOtherDuty"] === true) {
          this.commonService.getEmplyeeDetailByEmployeeId(list[i]["driverId"]).then((employee) => {
            list[i]["driver"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
            list[i]["driverImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["driverId"] + "%2FprofilePhoto.jpg?alt=media";
          });
          continue;
        }
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["driverId"]).then((employee) => {
          list[i]["driver"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
          list[i]["driverImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["driverId"] + "%2FprofilePhoto.jpg?alt=media";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["helperId"]).then((employee) => {
          list[i]["helper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
          list[i]["helperImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["helperId"] + "%2FprofilePhoto.jpg?alt=media";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["secondHelperId"]).then((employee) => {
          list[i]["secondHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
          list[i]["secondHelperImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["secondHelperId"] + "%2FprofilePhoto.jpg?alt=media";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["thirdHelperId"]).then((employee) => {
          list[i]["thirdHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
          list[i]["thirdHelperImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["thirdHelperId"] + "%2FprofilePhoto.jpg?alt=media";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["fourthHelperId"]).then((employee) => {
          list[i]["fourthHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
          list[i]["fourthHelperImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["fourthHelperId"] + "%2FprofilePhoto.jpg?alt=media";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["fifthHelperId"]).then((employee) => {
          list[i]["fifthHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
          list[i]["fifthHelperImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["fifthHelperId"] + "%2FprofilePhoto.jpg?alt=media";
        });
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["sixthHelperId"]).then((employee) => {
          list[i]["sixthHelper"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
          list[i]["sixthHelperImageURL"] = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeImage%2F" + list[i]["sixthHelperId"] + "%2FprofilePhoto.jpg?alt=media";
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
              let remarkArray = summaryData['workPercentageRemark'] && summaryData['workPercentageRemark'] !== undefined ? summaryData['workPercentageRemark'].split(',') : '';
              let outTimeList = [];
              if (summaryData["dutyOutTime"] != null) {
                outTimeList = summaryData["dutyOutTime"].split(',');
              }
              for (let i = 0; i < timeList.length; i++) {
                let time = timeList[i];
                let workPercentageRemark = remarkArray[i] ? remarkArray[i] : '';
                let offTime = "";
                if (outTimeList[i] != undefined) {
                  offTime = outTimeList[i];
                }

                let driverId = "---";
                let helperId = "---";
                let secondHelperId = "---";
                let thirdHelperId = "---";
                let fourthHelperId = "---";
                let fifthHelperId = "---";
                let sixthHelperId = "---";
                dutyOnImages.push({ binPlanId: "", imageUrl: "", workPercentageRemark: workPercentageRemark, time: time, driverId: driverId, helperId: helperId, secondHelperId: secondHelperId, thirdHelperId: thirdHelperId, fourthHelperId: fourthHelperId, fifthHelperId: fifthHelperId, sixthHelperId: sixthHelperId, driver: "---", helper: "---", secondHelper: "---", thirdHelper: "---", fourthHelper: "---", fifthHelper: "---", sixthHelper: "---", vehicle: "---", timeDutyOff: offTime, imageDutyOffUrl: "", imageDutyOnMeterUrl: "", imageDutyOutMeterUrl: "", driverImageURL: this.imageNotAvailablePath, helperImageURL: this.imageNotAvailablePath, secondHelperImageURL: this.imageNotAvailablePath, thirdHelperImageURL: this.imageNotAvailablePath, fourthHelperImageURL: this.imageNotAvailablePath, fifthHelperImageURL: this.imageNotAvailablePath, sixthHelperImageURL: this.imageNotAvailablePath });
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
            if (summaryData["dutyOnMeterImage"] != null) {
              let list = summaryData["dutyOnMeterImage"].split(',');
              for (let i = 0; i < list.length; i++) {
                let imageName = list[i].toString().trim();
                let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOnMeterReadingImages%2F" + zoneNo + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
                if (imageName.includes("1")) {
                  dutyOnImages[0]["imageDutyOnMeterUrl"] = imageUrl;
                }
                else if (imageName.includes("2")) {
                  dutyOnImages[1]["imageDutyOnMeterUrl"] = imageUrl;
                }
                else if (imageName.includes("3")) {
                  dutyOnImages[2]["imageDutyOnMeterUrl"] = imageUrl;
                }
                else if (imageName.includes("4")) {
                  dutyOnImages[3]["imageDutyOnMeterUrl"] = imageUrl;
                }
                else if (imageName.includes("5")) {
                  dutyOnImages[4]["imageDutyOnMeterUrl"] = imageUrl;
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
            if (summaryData["dutyOutMeterImage"] != null) {
              let list = summaryData["dutyOutMeterImage"].split(',');
              for (let i = 0; i < list.length; i++) {
                let imageName = list[i].toString().trim();
                let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDutyOutMeterReadingImages%2F" + zoneNo + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + imageName + "?alt=media";
                if (imageName.includes("1")) {
                  if (dutyOnImages.length > 0) {
                    dutyOnImages[0]["imageDutyOutMeterUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("2")) {
                  if (dutyOnImages.length > 1) {
                    dutyOnImages[1]["imageDutyOutMeterUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("3")) {
                  if (dutyOnImages.length > 2) {
                    dutyOnImages[2]["imageDutyOutMeterUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("4")) {
                  if (dutyOnImages.length > 3) {
                    dutyOnImages[3]["imageDutyOutMeterUrl"] = imageUrl;
                  }
                }
                else if (imageName.includes("5")) {
                  if (dutyOnImages.length > 4) {
                    dutyOnImages[4]["imageDutyOutMeterUrl"] = imageUrl;
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

          let driverIDList = workerData["driver"].split(',');
          let helperIDList = workerData["helper"].split(',');
          let seconHelperIDList = workerData["secondHelper"] ? workerData["secondHelper"].split(',') : [];
          let thirdHelperIDList = workerData["thirdHelper"] ? workerData["thirdHelper"].split(',') : [];
          let fourthHelperIDList = workerData["fourthHelper"] ? workerData["fourthHelper"].split(',') : [];
          let fifthHelperIDList = workerData["fifthHelper"] ? workerData["fifthHelper"].split(',') : [];
          let sixthHelperIDList = workerData["sixthHelper"] ? workerData["sixthHelper"].split(',') : [];

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
              let driverId = "---";
              let helperId = "---";
              let secondHelperId = "---";
              let thirdHelperId = "---";
              let fourthHelperId = "---";
              let fifthHelperId = "---";
              let sixthHelperId = "---";
              let driver = "---";
              let helper = "---";
              let secondHelper = "---";
              let thirdHelper = "---";
              let fourthHelper = "---";
              let fifthHelper = "---";
              let sixthHelper = "---";
              let vehicle = "---";


              if (driverIDList[i] != null) {
                driverId = driverIDList[i];
              }
              if (helperIDList[i] != null) {
                helperId = helperIDList[i];
              }
              if (seconHelperIDList[i] != null) {
                secondHelperId = seconHelperIDList[i];
              }
              if (thirdHelperIDList[i] != null) {
                thirdHelperId = thirdHelperIDList[i];
              }
              if (fourthHelperIDList[i] != null) {
                fourthHelperId = fourthHelperIDList[i];
              }
              if (fifthHelperIDList[i] != null) {
                fifthHelperId = fifthHelperIDList[i];
              }
              if (sixthHelperIDList[i] != null) {
                sixthHelperId = sixthHelperIDList[i];
              }



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

              detail.dutyOnImages[i]["driverId"] = driverId;
              detail.dutyOnImages[i]["helperId"] = helperId;
              detail.dutyOnImages[i]["secondHelperId"] = secondHelperId;
              detail.dutyOnImages[i]["thirdHelperId"] = thirdHelperId;
              detail.dutyOnImages[i]["fourthHelperId"] = fourthHelperId;
              detail.dutyOnImages[i]["fifthHelperId"] = fifthHelperId;
              detail.dutyOnImages[i]["sixthHelperId"] = sixthHelperId;

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
    this.closeSlider();
    this.closeOtherDutySlider();
    this.closeImagePopup();
    this.resetDetail();
    this.resetOtherDutyDetail();
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

export class selectedDetail {
  driver: string;
  helper: string;
  driverImageURL: string;
  helperImageURL: string;
  secondHelper: string;
  secondHelperImageURL: string;
  thirdHelper: string;
  thirdHelperImageURL: string;
  fourthHelper: string;
  fourthHelperImageURL: string;
  fifthHelper: string;
  fifthHelperImageURL: string;
  sixthHelper: string;
  sixthHelperImageURL: string;
}

export class otherDutySelectedDetail {
  name: string;
  profileImageURL: string;
}
