import { Component, OnInit } from "@angular/core";
import { FirebaseService } from "../firebase.service";
import { CommonService } from "../services/common/common.service";
import { BackEndServiceUsesHistoryService } from '../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-database-utilization',
  templateUrl: './database-utilization.component.html',
  styleUrls: ['./database-utilization.component.scss']
})
export class DatabaseUtilizationComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService) { }

  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  ddlYear = "#ddlYear";
  ddlMonth = "#ddlMonth";
  summaryList: any[] = [];
  servicePageList: any[] = [];
  serviceList: any[] = [];
  dateList: any[] = [];
  public monthCounts: any;
  public monthDataSize: any;
  serviceName = "developer-database-utilization";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split("-")[1];
    this.selectedYear = this.toDayDate.split("-")[0];
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthShortName(
      Number(this.selectedMonth)
    );
    this.monthCounts = "0";
    this.monthDataSize = "0 KB";
    this.getSummaryData();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split("-")[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getSummaryData() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getSummaryData");
    let dbPath = "BackEndFunctionCallingHistory/Summary";
    let summaryInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      summaryInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getSummaryData", data);
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let servicePage = keyArray[i];
          let functionData = data[servicePage];
          let functionArray = Object.keys(functionData);
          let functionList = [];
          let totalCounts = 0;
          let totalDataSize = 0;
          let totalDataSizeUnit = "";
          let totalDataSizeOrder = 0;
          for (let j = 0; j < functionArray.length; j++) {
            let functionName = functionArray[j];
            let count = 0;
            let dataSize = 0;
            let dataSizeOrder = 0;
            let unit = "";
            if (functionData[functionName]["count"] != null) {
              count = functionData[functionName]["count"];
              totalCounts += count;
            }
            if (functionData[functionName]["dataSize"] != null) {
              dataSize = functionData[functionName]["dataSize"];
              totalDataSize += dataSize;
              dataSizeOrder += dataSize;
              totalDataSizeOrder+=dataSize;
              unit = dataSize > 1024000 ? "Gb" : dataSize > 1024 ? "Mb" : "Kb";
            }
            functionList.push({ servicePage: servicePage, functionName: functionName, count: count, dataSize: dataSize > 1024000 ? (dataSize / 1024000).toFixed(2) : dataSize > 1024 ? (dataSize / 1024).toFixed(2) : dataSize.toFixed(2), unit: unit,dataSizeOrder:dataSizeOrder });
          }
          functionList = functionList.sort((a, b) => a.dataSizeOrder > b.dataSizeOrder ? -1 : 1);
          totalDataSizeUnit = totalDataSize > 1024000 ? "Gb" : totalDataSize > 1024 ? "Mb" : "Kb";
          this.summaryList.push({ servicePage: servicePage, functionList: functionList, totalCounts: totalCounts, totalDataSize: totalDataSize > 1024000 ? (totalDataSize / 1024000).toFixed(2) : totalDataSize > 1024 ? (totalDataSize / 1024).toFixed(2) : totalDataSize.toFixed(2), totalDataSizeUnit: totalDataSizeUnit,totalDataSizeOrder:totalDataSizeOrder });
        }
        this.summaryList = this.summaryList.sort((a, b) => a.totalDataSizeOrder > b.totalDataSizeOrder ? -1 : 1);
        this.servicePageList = this.summaryList;
        this.getServiceNameData(this.servicePageList[0]["servicePage"], 0);
      }
    })
  }

  getServiceNameData(servicePage: any, index: any) {
    this.setActiveClass("mainPage", index);
    this.serviceList = [];
    let detail = this.servicePageList.find(item => item.servicePage == servicePage);
    if (detail != undefined) {
      this.serviceList = detail.functionList;
      this.getMonthData(this.serviceList[0]["functionName"], 0);
    }
  }

  getMonthData(functionName: any, index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMonthData");
    this.setActiveClass("page", index);
    this.dateList = [];
    this.monthCounts = "0";
    this.monthDataSize = "0";
    let detail = this.serviceList.find(item => item.functionName == functionName);
    if (detail != undefined) {
      let dbPath = "BackEndFunctionCallingHistory/History/" + detail.servicePage + "/" + functionName + "/" + this.selectedYear + "/" + this.selectedMonthName;
      let detailInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        detailInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMonthData", data);
          let list = [];
          let keyArray = Object.keys(data);
          for (let i = keyArray.length - 1; i >= 0; i--) {
            let date = keyArray[i];
            if (date == "count") {
              this.monthCounts = data[date] == null ? 0 : data[date];
            }
            else if (date == "dataSize") {
              this.monthDataSize = data[date] == null ? 0 + " KB" : data[date] > 1024 ? (data[date] / 1024).toFixed(2) + " MB" : data[date].toFixed(2) + " KB";
            }
            else {
              let formatedDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1]));
              let count = data[date]["count"] == null ? 0 : data[date]["count"];
              let dataSize = data[date]["dataSize"] == null ? 0 : data[date]["dataSize"];
              let unit = dataSize > 1024 ? "Mb" : "Kb";
              list.push({ date: formatedDate, count: count, dataSize: dataSize > 1024 ? (dataSize / 1024).toFixed(2) : dataSize.toFixed(2), unit: unit });
            }
          }
          this.dateList = list;
        }
      })
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
    this.selectedMonth = filterVal;
    this.selectedMonthName = this.commonService.getCurrentMonthShortName(
      Number(this.selectedMonth)
    );
    this.getMonthData(this.serviceList[0]["functionName"], 0);
  }

  setActiveClass(type: any, index: any) {
    setTimeout(() => {
      let list = this.servicePageList;
      let divId = "divMainPage";
      if (type == "page") {
        list = this.serviceList;
        divId = "divPage";
      }
      for (let i = 0; i < list.length; i++) {
        let id = divId + i;
        let element = <HTMLElement>document.getElementById(id);
        let className = element.className;
        if (className != null) {
          $("#" + id).removeClass("active");
        }
        if (i == index) {
          $("#" + id).addClass("active");
        }
      }
    }, 100);

  }
}
