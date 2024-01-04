import { Component, OnInit } from "@angular/core";
import { FirebaseService } from "../firebase.service";
import { CommonService } from "../services/common/common.service";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-page-load-history",
  templateUrl: "./page-load-history.component.html",
  styleUrls: ["./page-load-history.component.scss"],
})
export class PageLoadHistoryComponent implements OnInit {
  constructor(
    public fs: FirebaseService,
    private commonService: CommonService,
    public httpService: HttpClient,
    private modalService: NgbModal
  ) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  public lastUpdateDate: any;
  mainPageList: any[] = [];
  pageList: any[] = [];
  dateList: any[] = [];
  dataObject: any;
  portalUserList: any[] = [];
  pageLoadDetailList: any[] = [];
  userList: any[] = [];
  pageLoadSummaryList: any[] = [];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.portalUserList = JSON.parse(localStorage.getItem("webPortalUserList"));
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split("-")[1];
    this.selectedYear = this.toDayDate.split("-")[0];
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(
      Number(this.selectedMonth) - 1
    );
    this.getSummaryData();
    this.getHistoryData();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split("-")[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  changeYearSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    this.selectedYear = filterVal;
    this.selectedMonth = "0";
    $(this.ddlMonth).val("0");
  }

  changeMonthSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    $("#divLoader").show();
    setTimeout(() => {
      $("#divLoader").hide();
    }, 2000);
    this.selectedMonth = filterVal;
    this.selectedMonthName = this.commonService.getCurrentMonthName(
      Number(this.selectedMonth) - 1
    );
    this.getHistoryData();
  }

  getSummaryData() {
    let dbPath = "PageLoadHistory/Summary";
    let summaryInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      summaryInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          this.pageLoadSummaryList.push({ name: keyArray[i], counts: data[keyArray[i]] });
        }
      }
    });
  }

  getHistoryData() {
    this.mainPageList = [];
    this.pageList = [];
    this.dateList = [];
    this.userList = [];
    this.dataObject = null;
    let dbPath =
      "PageLoadHistory/" + this.selectedYear + "/" + this.selectedMonthName;
    let historyInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        historyInstance.unsubscribe();
        if (data != null) {
          this.dataObject = data;
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let mainPage = keyArray[i];
            this.mainPageList.push({ mainPage: mainPage });
            if (i == 0) {
              this.getPageHistory(mainPage, 0);
            }
          }
        } else {
          this.commonService.setAlertMessage("error", "No record found");
        }
      });
  }

  getPageHistory(mainPage: any, index: any) {
    this.pageList = [];
    this.dateList = [];
    this.userList = [];
    let pageData = this.dataObject[mainPage];
    let pageKeyArray = Object.keys(pageData);
    for (let j = 0; j < pageKeyArray.length; j++) {
      let page = pageKeyArray[j];
      let pageCount = 0;
      let detail = this.pageLoadSummaryList.find(item => item.name == page);
      if (detail != undefined) {
        pageCount = detail.counts;
      }
      this.pageList.push({ mainPage: mainPage, page: page, pageCount: pageCount, monthCounts: 0 });
      if (j == 0) {
        this.getPageDateHistory(mainPage, page);
      }
      this.getMonthCount(mainPage, page);
    }
  }

  getMonthCount(mainPage: any, page: any) {
    let dateData = this.dataObject[mainPage][page];
    let counts = 0;
    let dateKeyArray = Object.keys(dateData);
    for (let i = 0; i < dateKeyArray.length; i++) {
      let date = dateKeyArray[i];
      let countdata = dateData[date];
      let countKeyArray = Object.keys(countdata);
      for (let l = 0; l < countKeyArray.length; l++) {
        let userId = countKeyArray[l];
        counts += Number(countdata[userId]);
      }
    }
    let detail = this.pageList.find(item => item.page == page);
    if (detail != undefined) {
      detail.monthCounts = counts;
    }
  }

  getPageDateHistory(mainPage: any, page: any) {
    this.dateList = [];
    let dateData = this.dataObject[mainPage][page];
    let dateKeyArray = Object.keys(dateData);
    for (let k = 0; k < dateKeyArray.length; k++) {
      let userList = [];
      let date = dateKeyArray[k];
      let countdata = dateData[date];
      let countKeyArray = Object.keys(countdata);
      let totalCount = 0;
      for (let l = 0; l < countKeyArray.length; l++) {
        let userId = countKeyArray[l];
        let detail = this.portalUserList.find((item) => item.userId == userId);
        if (detail != undefined) {
          let count = countdata[userId];
          totalCount += Number(count);
          userList.push({ userId: userId, count: count, name: detail.name });
        }
      }
      this.dateList.push({
        mainPage: mainPage,
        page: page,
        date: date,
        userList: userList,
        totalCount: totalCount,
      });
      this.getUserList(this.dateList[0]["date"]);
    }
  }

  getUserList(date: any) {
    let detail = this.dateList.find((item) => item.date == date);
    if (detail != undefined) {
      this.userList = detail.userList;
    }
  }

  setActiveClass(type: any, index: any) {
    for (let i = 0; i < this.mainPageList.length; i++) {
      let id = "divMainPage" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        $("#divMainPage" + i).removeClass("active");
      }
      if (i == index) {
        $("#divMainPage" + i).addClass("active");
      }
    }
  }
}
