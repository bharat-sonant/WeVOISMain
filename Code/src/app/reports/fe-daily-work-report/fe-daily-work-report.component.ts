import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import { AngularFirestore } from "@angular/fire/firestore";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-fe-daily-work-report',
  templateUrl: './fe-daily-work-report.component.html',
  styleUrls: ['./fe-daily-work-report.component.scss']
})
export class FeDailyWorkReportComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, private modalService: NgbModal, private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  dailyWorkList: any[];
  dailyWorkListShow: any[];
  txtDate = "#txtDate";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    this.yearList = [];
    this.dailyWorkList = [];
    this.dailyWorkListShow = [];
    this.getYear();
    this.selectedMonth = this.selectedDate.split('-')[1];
    this.selectedYear = this.selectedDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.fillExecitives();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate($("#txtDate").val(), 1);
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.toDayDate)) {
      this.selectedDate = this.toDayDate;
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $(this.txtDate).val(this.selectedDate);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    this.selectedYear = this.selectedDate.split("-")[0];
    this.getDailyWorkList();
  }

  fillExecitives() {
    $("#divLoader").show();
    let dbPath = "WastebinMonitor/FieldExecutive";
    let instance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        instance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let executiveId = keyArray[i];
              let name = data[executiveId]["name"];
              let imageTime = [];
              this.dailyWorkList.push({ executiveId: executiveId, name: name.toUpperCase(), dutyOn: "", dutyOff: "", images: "", firstImage: "", lastImage: "", ftime: 0, ltime: 0, halt: "", km: "", imageTime: imageTime });
              this.dailyWorkList = this.dailyWorkList.sort((a, b) =>
                b.name < a.name ? 1 : -1
              );
            }
            this.getDailyWorkList();
          }
        }
      }
    );
  }

  getDailyWorkList() {
    this.resetList();
    this.getImageData();
  }

  resetList() {
    this.dailyWorkListShow = [];
    for (let i = 0; i < this.dailyWorkList.length; i++) {
      this.dailyWorkList[i]["dutyOn"] = "";
      this.dailyWorkList[i]["dutyOff"] = "";
      this.dailyWorkList[i]["images"] = "";
      this.dailyWorkList[i]["firstImage"] = "";
      this.dailyWorkList[i]["lastImage"] = "";
      this.dailyWorkList[i]["halt"] = "";
      this.dailyWorkList[i]["km"] = "";
      this.dailyWorkList[i]["imageTime"] = [];
    }
  }

  getDutyOnOff() {
    if (this.dailyWorkList.length > 0) {
      let list = this.dailyWorkList;
      for (let i = 0; i < list.length; i++) {
        let executiveId = list[i]["executiveId"];
        let dbPath = "FEAttendance/" + executiveId + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
        let attendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            attendanceInstance.unsubscribe();
            let dutyOn = "";
            let dutyOff = "";
            if (data != null) {
              if (data["inDetails"] != null) {
                dutyOn = this.commonService.tConvert(data["inDetails"]["time"]);
              }
              if (data["outDetails"] != null) {
                dutyOff = this.commonService.tConvert(data["outDetails"]["time"]);
              }
            }
            let detail = this.dailyWorkList.find(item => item.executiveId == executiveId);
            if (detail != undefined) {
              detail.dutyOn = dutyOn;
              detail.dutyOff = dutyOff;
            }
            if (i == list.length - 1) {
              this.getHalt();
            }
          });
      }
    }
  }

  getHalt() {
    if (this.dailyWorkList.length > 0) {
      for (let i = 0; i < this.dailyWorkList.length; i++) {
        let dbPath = "HaltInfo/" + this.dailyWorkList[i]["executiveId"] + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
        let haltInstance = this.db.list(dbPath).valueChanges().subscribe(
          data => {
            haltInstance.unsubscribe();
            if (data.length > 0) {
              let totalHalt = 0;
              for (let j = 0; j < data.length; j++) {
                let duration = 0;
                if (data[j]["duration"] != null) {
                  duration = Number(data[j]["duration"]);
                  totalHalt = totalHalt + duration;
                }
                this.dailyWorkList[i]["halt"] = this.commonService.getMinuteToHHMM(totalHalt);
              }
            }
            if (i == this.dailyWorkList.length - 1) {
              this.getKM();
            }
          });
      }
    }
  }

  getImageData() {
    $("#divLoader").show();
    if (this.dailyWorkList.length > 0) {
      for (let i = 0; i < this.dailyWorkList.length; i++) {
        let dbPath = "WastebinMonitor/UserImageRef/" + this.dailyWorkList[i]["executiveId"];
        let imageInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            imageInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                let totalImages = 0;
                for (let j = 0; j < keyArray.length; j++) {
                  let index = keyArray[j];
                  let imageName = data[index];
                  if (this.selectedDate == imageName.split('~')[2]) {
                    totalImages++;
                    let dbPath = "WastebinMonitor/ImagesData/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + imageName.split('~')[3] + "/" + imageName.split('~')[4];
                    let detailInstance = this.db.object(dbPath).valueChanges().subscribe(
                      data => {
                        detailInstance.unsubscribe();
                        let time = data["time"];
                        let orderBy = new Date(this.toDayDate + " " + time).getTime();
                        this.dailyWorkList[i]["imageTime"].push({ time: time, orderBy: orderBy });
                        this.dailyWorkList[i]["imageTime"] = this.dailyWorkList[i]["imageTime"].sort((a, b) =>
                          b.orderBy < a.orderBy ? 1 : -1
                        );
                      }
                    );
                  }
                }
                if (totalImages > 0) {
                  this.dailyWorkList[i]["images"] = totalImages.toFixed(0);
                }
              }
            }
            if (i == this.dailyWorkList.length - 1) {
              this.getDutyOnOff();
            }
          }
        );
      }
    }
  }

  getKM() {
    if (this.dailyWorkList.length > 0) {
      for (let i = 0; i < this.dailyWorkList.length; i++) {
        let dbPath = "LocationHistory/" + this.dailyWorkList[i]["executiveId"] + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
        let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            routeInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                let totalKM = 0;
                for (let j = 0; j < keyArray.length - 2; j++) {
                  let index = keyArray[j];
                  if (data[index]["distance-in-meter"] != null) {
                    totalKM = totalKM + Number(data[index]["distance-in-meter"]);
                  }
                }
                this.dailyWorkList[i]["km"] = (totalKM / 1000).toFixed(1) + "Km";
              }
            }
            if (i == this.dailyWorkList.length - 1) {
              this.getFirstLastImage();
            }
          }
        );
      }
    }
  }

  getFirstLastImage() {
    for (let i = 0; i < this.dailyWorkList.length; i++) {
      if (this.dailyWorkList[i]["imageTime"].length > 0) {
        this.dailyWorkList[i]["firstImage"] = this.dailyWorkList[i]["imageTime"][0]["time"];
        this.dailyWorkList[i]["lastImage"] = this.dailyWorkList[i]["imageTime"][this.dailyWorkList[i]["imageTime"].length - 1]["time"];
      }
    }
    this.dailyWorkListShow = this.dailyWorkList;
    $("#divLoader").hide();

  }
}
