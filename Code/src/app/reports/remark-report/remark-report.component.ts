import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-remark-report',
  templateUrl: './remark-report.component.html',
  styleUrls: ['./remark-report.component.scss']
})
export class RemarkReportComponent implements OnInit {

  constructor(private commonService: CommonService, public fs: FirebaseService, private mapService: MapService) { }


  public selectedZone: any;
  selectedCategory: any;
  zoneList: any[];
  remarkList: any[] = [];
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;
  filterList: any[] = [];
  db: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
    this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date().getFullYear();
    this.getZoneList();
    this.selectedZone = this.zoneList[1]["zoneNo"];
    this.selectedCategory = "0";
    this.onSubmit();
  }

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
    this.onSubmit();

  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;
    this.onSubmit();
  }

  changeCategorySelection(filterVal: any) {
    this.selectedCategory = filterVal;
    this.onSubmit();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  setNextDate() {
    let currentDate = $('#txtDate').val();
    let nextDate = this.commonService.getNextDate(currentDate, 1);
    $('#txtDate').val(nextDate);
    this.selectedDate = nextDate;
    this.selectedCategory = "0";
    this.onSubmit();
  }
  setPreviousDate() {
    let currentDate = $('#txtDate').val();
    let previousDate = this.commonService.getPreviousDate(currentDate, 1);
    $('#txtDate').val(previousDate);
    this.selectedDate = previousDate;
    this.onSubmit();
  }

  onSubmit() {
    this.remarkList = [];
    if (this.selectedZone == "0" && this.selectedCategory == "0") {
      this.getRemark();
    }
    else if (this.selectedCategory != "0" && this.selectedZone == "0") {
      this.getCategoryRemark();
    }
    else if (this.selectedCategory == "0" && this.selectedZone != "0") {
      this.getWardRemark();
    }
    else if (this.selectedZone != "0" && this.selectedCategory != "0") {
      this.getWardRemark();
    }
  }


  getCategoryRemark() {
    this.remarkList = [];
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
        let year = this.selectedDate.split("-")[0];
        let wardNo = this.zoneList[i]["zoneNo"];
        let dbPath = "Remarks/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
        let remarkData = this.db.list(dbPath).valueChanges().subscribe(
          Data => {
            if (Data.length > 0) {
              for (let j = 0; j < Data.length; j++) {
                if (Data[j]["category"] == this.selectedCategory) {
                  let topicId = Data[j]["category"];
                  let topic = "";
                  if (topicId == "1") {
                    topic = "Vehicle Related";
                  }
                  else if (topicId == "2") {
                    topic = "Device";
                  }
                  else if (topicId == "3") {
                    topic = "Location Issue";
                  }
                  else if (topicId == "4") {
                    topic = "Fast Working";
                  }
                  else if (topicId == "5") {
                    topic = "Halts";
                  }
                  else if (topicId == "6") {
                    topic = "General";
                  }
                  this.remarkList.push({ wardNo: wardNo, wardName: wardNo, topic: topic, category: Data[j]["category"], time: Data[j]["time"], remark: Data[j]["remark"], user: "", userId: Data[j]["userId"] });
                  dbPath = "Users";
                  let userInfoData = this.db.list(dbPath).valueChanges().subscribe(
                    userData => {
                      if (userData.length > 0) {
                        for (let usr = 0; usr < userData.length; usr++) {
                          for (let index = 0; index < this.remarkList.length; index++) {
                            if (userData[usr]["userId"] == this.remarkList[index]["userId"]) {
                              this.remarkList[index]["user"] = userData[usr]["name"];
                            }
                          }
                        }
                      }
                      userInfoData.unsubscribe();
                    });
                }
              }
            }
            remarkData.unsubscribe();
          });
      }
    }
  }


  getRemark() {
    this.remarkList = [];
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
        let year = this.selectedDate.split("-")[0];
        let wardNo = this.zoneList[i]["zoneNo"];
        let dbPath = "Remarks/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
        let remarkData = this.db.list(dbPath).valueChanges().subscribe(
          Data => {
            if (Data.length > 0) {
              for (let j = 0; j < Data.length; j++) {
                let topicId = Data[j]["category"];
                let topic = "";
                if (topicId == "1") {
                  topic = "Vehicle Related";
                }
                else if (topicId == "2") {
                  topic = "Device";
                }
                else if (topicId == "3") {
                  topic = "Location Issue";
                }
                else if (topicId == "4") {
                  topic = "Fast Working";
                }
                else if (topicId == "5") {
                  topic = "Halts";
                }
                else if (topicId == "6") {
                  topic = "General";
                }
                if (this.selectedCategory == "0") {
                  this.remarkList.push({ wardNo: wardNo, wardName: wardNo, topic: topic, category: Data[j]["category"], time: Data[j]["time"], remark: Data[j]["remark"], user: "", userId: Data[j]["userId"] });
                }
                else {
                  if (Data[j]["category"] == this.selectedCategory) {
                    this.remarkList.push({ wardNo: wardNo, wardName: wardNo, topic: topic, category: Data[j]["category"], time: Data[j]["time"], remark: Data[j]["remark"], user: "", userId: Data[j]["userId"] });
                  }
                }
                dbPath = "Users";
                let userInfoData = this.db.list(dbPath).valueChanges().subscribe(
                  userData => {
                    if (userData.length > 0) {
                      for (let usr = 0; usr < userData.length; usr++) {
                        for (let index = 0; index < this.remarkList.length; index++) {
                          if (userData[usr]["userId"] == this.remarkList[index]["userId"]) {
                            this.remarkList[index]["user"] = userData[usr]["name"];
                          }
                        }
                      }
                    }
                    userInfoData.unsubscribe();
                  });
              }
            }
            remarkData.unsubscribe();
          });
      }
    }
  }

  getWardRemark() {
    this.remarkList = [];
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    let wardNo = this.selectedZone;
    let dbPath = "Remarks/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
    let remarkData = this.db.list(dbPath).valueChanges().subscribe(
      Data => {
        if (Data.length > 0) {
          for (let j = 0; j < Data.length; j++) {
            let topicId = Data[j]["category"];
            let topic = "";
            if (topicId == "1") {
              topic = "Vehicle Related";
            }
            else if (topicId == "2") {
              topic = "Device";
            }
            else if (topicId == "3") {
              topic = "Location Issue";
            }
            else if (topicId == "4") {
              topic = "Fast Working";
            }
            else if (topicId == "5") {
              topic = "Halts";
            }
            else if (topicId == "6") {
              topic = "General";
            }
            if (this.selectedCategory == "0") {
              this.remarkList.push({ wardNo: wardNo, wardName: wardNo, topic: topic, category: Data[j]["category"], time: Data[j]["time"], remark: Data[j]["remark"], user: "", userId: Data[j]["userId"] });
            }
            else {
              if (Data[j]["category"] == this.selectedCategory) {
                this.remarkList.push({ wardNo: wardNo, wardName: wardNo, topic: topic, category: Data[j]["category"], time: Data[j]["time"], remark: Data[j]["remark"], user: "", userId: Data[j]["userId"] });
              }
            }
            dbPath = "Users";
            let userInfoData = this.db.list(dbPath).valueChanges().subscribe(
              userData => {
                if (userData.length > 0) {
                  for (let usr = 0; usr < userData.length; usr++) {

                    for (let index = 0; index < this.remarkList.length; index++) {
                      if (userData[usr]["userId"] == this.remarkList[index]["userId"]) {
                        this.remarkList[index]["user"] = userData[usr]["name"];
                      }
                    }
                  }
                }
                userInfoData.unsubscribe();
              });
          }
        }
        remarkData.unsubscribe();
      });
  }

}
