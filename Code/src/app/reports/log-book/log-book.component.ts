import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-log-book',
  templateUrl: './log-book.component.html',
  styleUrls: ['./log-book.component.scss']
})
export class LogBookComponent implements OnInit {

  constructor(private commonService: CommonService, public fs: FirebaseService) { }
  allZoneList: any[];
  selectedZone: any;
  zoneList: any[];
  selectedDate: any;
  currentYear: any;
  currentMonthName: any;
  imageNotAvailablePath = "../../../assets/img/img-not-available-01.jpg";
  db: any;
  dbPath: any;
  cityName: any;
  isFirst: any = true;
  logBookData: logBookDetail = {
    imageUrl: this.imageNotAvailablePath,
    reason: "",
    driver: "",
    driverMobile: ""
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaultValues();
    this.getWardLogbook();
  }

  setDefaultValues() {
    this.zoneList = [];
    this.logBookData.imageUrl = this.imageNotAvailablePath;
    this.selectedDate = this.commonService.setTodayDate();
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.allZoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  setDate(filterVal: any, type: string) {
    this.isFirst = true;
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
        this.currentYear = this.selectedDate.split("-")[0];
        this.clearDetailData();
        this.getWardLogbook();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  getWardLogbook() {
    this.zoneList = [];
    if (this.allZoneList.length > 0) {
      for (let i = 1; i < this.allZoneList.length; i++) {
        let zoneNo = this.allZoneList[i]["zoneNo"];
        let zoneName = this.allZoneList[i]["zoneName"];
        this.dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/logBookImage";
        let logBookInstance = this.db.object(this.dbPath).valueChanges().subscribe(
          data => {
            logBookInstance.unsubscribe();
            let iconClass = "fas fa-ellipsis-h";
            let divClass = "address md-background";
            let image = "";
            if (data != null) {
              iconClass = "fas fa-check-double";
              divClass = "address";
              image = data;
            }
            this.zoneList.push({ zoneNo: zoneNo, zoneName: zoneName, image: image, iconClass: iconClass, divClass: divClass, reason: "" });
            this.dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/Summary/logBookImageNotCaptureReason";
            let logBookReasonInstance = this.db.object(this.dbPath).valueChanges().subscribe(
              data => {
                logBookReasonInstance.unsubscribe();
                if (data != null) {
                  iconClass = "fas fa-check-double";
                  divClass = "address";
                  let reason = data;
                  this.selectedZone = zoneNo;
                  let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
                  if (zoneDetail != undefined) {
                    zoneDetail.iconClass = iconClass;
                    zoneDetail.divClass = divClass;
                    zoneDetail.reason = reason;
                  }
                }

                if (this.allZoneList.length - 1 == this.zoneList.length) {

                  setTimeout(() => {
                    for (let index = 0; index < this.zoneList.length; index++) {
                      if (this.isFirst == true) {
                        if (this.zoneList[index]["divClass"] == "address") {
                          this.isFirst = false;
                          this.selectedZone = this.zoneList[index]["zoneNo"];
                          this.getLogBookDetail(this.selectedZone, index);
                          index = this.zoneList.length;
                        }
                      }
                    }
                  }, 1000);
                }
              });
          }
        );
      }
    }
  }

  setActiveWard(zoneNo: any, index: any) {
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        if (this.zoneList[i]["divClass"] == "address md-background-active") {
          this.zoneList[i]["divClass"] = "address";
        }
        if (zoneNo == this.zoneList[i]["zoneNo"]) {
          this.zoneList[i]["divClass"] = "address md-background-active";
        }
      }
    }
  }

  getLogBookDetail(zoneNo: any, index: any) {
    this.selectedZone = zoneNo;
    this.setActiveWard(zoneNo, index);
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 1000);
    this.clearDetailData();
    let zoneDetail = this.zoneList.find(item => item.zoneNo == zoneNo);
    if (zoneDetail != undefined) {
      this.logBookData.reason = zoneDetail.reason;
      let imageUrl = this.imageNotAvailablePath;
      if (zoneDetail.image != "") {
        imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FLogBookImages%2F" + this.selectedZone + "%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + zoneDetail.image + "?alt=media";
      }

      this.logBookData.imageUrl = imageUrl;
      this.dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/WorkerDetails/driver";
      let driverInstance = this.db.object(this.dbPath).valueChanges().subscribe(
        data => {
          driverInstance.unsubscribe();
          if (data != null) {
            let driverList = data.toString().split(',');
            let driverId = driverList[driverList.length - 1].trim();
            this.commonService.getEmplyeeDetailByEmployeeId(driverId).then((employee) => {
              this.logBookData.driver = employee["name"];
              this.logBookData.driverMobile = employee["mobile"] != null ? employee["mobile"] : "";
            });
          }
        }
      );
    }
  }

  clearDetailData() {
    this.logBookData.imageUrl = this.imageNotAvailablePath;
    this.logBookData.reason = "";
    this.logBookData.driver = "";
    this.logBookData.driverMobile = "";
  }
}

export class logBookDetail {
  imageUrl: string;
  reason: string;
  driver: string;
  driverMobile: string;
}
