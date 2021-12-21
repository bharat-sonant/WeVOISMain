import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { FirebaseService } from "../../firebase.service";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-penalty-summary',
  templateUrl: './penalty-summary.component.html',
  styleUrls: ['./penalty-summary.component.scss']
})
export class PenaltySummaryComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  selectedZone: any;
  wardList: any[] = [];
  zoneList: any[] = [];
  wardDataList: any[] = [];
  yearList: any[] = [];
  dayList: any[] = [];
  db: any;
  rowTo: any;
  cityName: any;

  penaltyData: penaltyDatail =
    {
      totalPenalty: "0"
    };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  exportexcel(): void {
    let htmlString = "";
    if (this.wardList.length > 0) {
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Ward";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Route";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total";
      htmlString += "</td>";
      for (let i = 1; i <= this.rowTo; i++) {
        htmlString += "<td>";
        htmlString += (i < 10 ? '0' : '') + i + " " + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) + " [Work]";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += (i < 10 ? '0' : '') + i + " " + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) + " [Penalty]";
        htmlString += "</td>";
      }
      htmlString += "</tr>";
      for (let i = 0; i < this.wardList.length; i++) {
        let wardNo = this.wardList[i]["wardNo"];
        let routes = this.wardList[i]["routes"];
        let penalty = this.wardList[i]["penalty"];
        let dayList = this.wardList[i]["dayList"];
        if (routes.length > 0) {
          for (let j = 0; j < routes.length; j++) {
            htmlString += "<tr>";
            if (j == 0) {
              htmlString += "<td>";
              htmlString += wardNo;
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += routes[j]["routeName"] + " [" + routes[j]["totalLength"] + " Km]";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += penalty[j]["penalty"];
              htmlString += "</td>";
              for (let k = 0; k < dayList.length; k++) {
                let dayPenalty = dayList[k]["dayPenalty"];
                if (dayPenalty[j]["coveredLength"] != undefined) {
                htmlString += "<td>";
                htmlString += dayPenalty[j]["coveredLength"] + " Km [" + dayPenalty[j]["percentage"] + "%]";
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += dayPenalty[j]["penalty"];
                htmlString += "</td>";
                }
                else{
                  htmlString += "<td>";
                  htmlString +="";
                  htmlString += "</td>";
                  htmlString += "<td>";
                  htmlString += "";
                  htmlString += "</td>";
                }
              }
            }
            else {
              htmlString += "<td>";
              htmlString += "";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += routes[j]["routeName"] + " [" + routes[j]["totalLength"] + " Km]";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += penalty[j]["penalty"];
              htmlString += "</td>";
              for (let k = 0; k < dayList.length; k++) {
                let dayPenalty = dayList[k]["dayPenalty"];
                if (dayPenalty[j]["coveredLength"] != undefined) {
                  htmlString += "<td>";
                  htmlString += dayPenalty[j]["coveredLength"] + " Km [" + dayPenalty[j]["percentage"] + "%]";
                  htmlString += "</td>";
                  htmlString += "<td>";
                  htmlString += dayPenalty[j]["penalty"];
                  htmlString += "</td>";
                }
                else{
                  htmlString += "<td>";
                  htmlString +="";
                  htmlString += "</td>";
                  htmlString += "<td>";
                  htmlString += "";
                  htmlString += "</td>";
                }
              }
            }
          }
          htmlString += "</tr>";
        }
      }
      htmlString += "</table>";
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    let fileName = "Penalty-" + this.selectedZone + "-" + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) + ".xlsx";
    XLSX.writeFile(wb, fileName);
  }

  setDefault() {
    this.rowTo = 0;
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    this.getDays();
    this.getYear();
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.getZoneList();
  }

  getDays() {
    this.dayList = [];
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    this.rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      this.rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let i = 1; i <= this.rowTo; i++) {
      this.dayList.push({ day: (i < 10 ? '0' : '') + i, total: "0.00" });
    }
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getZoneList() {
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.selectedZone = filterVal;
    this.getWard();
  }

  getWard() {
    this.penaltyData.totalPenalty = "0.00";
    this.wardList = [];
    let zoneDetail = this.zoneList.find(item => item.zoneName == this.selectedZone);
    if (zoneDetail != undefined) {
      let wardList = zoneDetail.wardList;
      for (let i = 1; i < wardList.length; i++) {
        let routes = [];
        let penalty = [];
        let dayList = [];

        this.wardList.push({ wardNo: wardList[i], routes: routes, wardPenalty: "0.00", penalty: penalty, dayList: dayList });
        for (let j = 1; j <= this.rowTo; j++) {
          let wardDetail = this.wardList.find(item => item.wardNo == wardList[i]);
          if (wardDetail != undefined) {
            let dayPenalty = [];
            let d = "day" + j;
            wardDetail.dayList.push({ day: d, dayPenalty: dayPenalty, totalLength: "0.00", coveredLength: "0.00", percentage: "0.00" });
          }
        }
      }
      this.getRoutes();
    }
  }

  getRoutes() {
    if (this.wardList.length > 0) {
      for (let i = 0; i < this.wardList.length; i++) {
        let wardNo = this.wardList[i]["wardNo"];
        let dbPath = "Route/" + wardNo;
        let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            routeInstance.unsubscribe();
            if (data != null) {
              let routes = this.wardList[i]["routes"];
              let penalty = this.wardList[i]["penalty"];
              let dayList = this.wardList[i]["dayList"];
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let j = 0; j < keyArray.length; j++) {
                  let routeKey = keyArray[j];
                  let routeName = data[routeKey]["name"];
                  let routeList = [];
                  let routeDetailList = [];
                  if (data[routeKey]["Routes"] != null) {
                    routeList = data[routeKey]["Routes"];
                    let routeKeyArray = Object.keys(routeList);
                    if (routeKeyArray.length > 0) {
                      for (let k = 0; k < routeKeyArray.length - 1; k++) {
                        let key = routeKeyArray[k];
                        let startDate = routeList[key]["startDate"];
                        let endDate = this.commonService.setTodayDate();
                        if (routeList[key]["endDate"] != null) {
                          endDate = routeList[key]["endDate"];
                        }
                        let routeLines = "";
                        if (routeList[key]["routeLines"] != null) {
                          routeLines = routeList[key]["routeLines"];
                        }
                        routeDetailList.push({ startDate: startDate, endDate: endDate, routeLines: routeLines });
                      }
                    }
                  }
                  routes.push({ routeKey: routeKey, routeName: routeName, totalLength: "0.000", routeDetailList: routeDetailList });
                  penalty.push({ penalty: "0.00" });
                  for (let m = 0; m < dayList.length; m++) {
                    let dayPenalty = dayList[m]["dayPenalty"];
                    dayPenalty.push({ penalty: "0.00" });
                    dayList[m]["dayPenalty"] = dayPenalty;
                  }
                }
                this.wardList[i]["routes"] = routes;
                this.wardList[i]["penalty"] = penalty;
                this.wardList[i]["dayList"] = dayList;
                this.getRouteLines(this.wardList[i]["wardNo"]);
              }
            }
          });
      }
    }
  }

  getRouteLines(wardNo: any) {
    if (this.wardList.length > 0) {
      let wardDetail = this.wardList.find(item => item.wardNo == wardNo);
      if (wardDetail != undefined) {
        this.commonService.getWardLineLength(wardDetail.wardNo).then((lengthList: any) => {
          if (lengthList != null) {
            let wardLineLengthList = JSON.parse(lengthList);
            let routes = wardDetail.routes;
            if (routes.length > 0) {
              if (this.dayList.length > 0) {
                for (let i = 0; i < this.dayList.length; i++) {
                  let workDate = this.selectedYear + "-" + this.selectedMonth + "-" + this.dayList[i]["day"];
                  for (let j = 0; j < routes.length; j++) {
                    if (routes[j]["routeDetailList"] != null) {
                      let routeDetailList = routes[j]["routeDetailList"];
                      if (routeDetailList.length > 0) {
                        for (let k = 0; k < routeDetailList.length; k++) {
                          let startDate = new Date(routeDetailList[k]["startDate"]);
                          let endDate = new Date(routeDetailList[k]["endDate"]);
                          if (new Date(workDate) >= startDate && new Date(workDate) <= endDate) {
                            let lineList = [];
                            let routeLines = routeDetailList[k]["routeLines"].split(',');
                            if (routeLines.length > 0) {
                              let totalLength = 0;
                              for (let l = 0; l < routeLines.length; l++) {
                                let lineNo = routeLines[l];
                                let lineLength = 0;
                                let lineLengthDetail = wardLineLengthList.find(item => item.lineNo == lineNo);
                                if (lineLengthDetail != undefined) {
                                  lineLength = Number(lineLengthDetail.length);
                                  totalLength = totalLength + lineLength;
                                }
                                lineList.push({ lineNo: lineNo, lineLength: lineLength });
                              }
                              if (totalLength > 0) {
                                this.getPenalty(wardNo, j, lineList, workDate, totalLength, this.dayList[i]["day"]);
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
          }
        });
      }
    }
  }

  getPenalty(wardNo: any, routeIndex: any, lineList: any, workDate: any, totalLength: any, day: any) {
    let dbPath = "WasteCollectionInfo/" + wardNo + "/" + workDate.split('-')[0] + "/" + this.commonService.getCurrentMonthName(new Date(workDate).getMonth()) + "/" + workDate + "/LineStatus";
    let lineInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      lineInstance.unsubscribe();
      let coveredLength = 0;
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          let lineDetail = lineList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            coveredLength = coveredLength + Number(lineDetail.lineLength);
          }
        }
      }
      totalLength = (totalLength / 1000).toFixed(1);
      coveredLength = Number((coveredLength / 1000).toFixed(1));
      let workPercentage = Number(((coveredLength / totalLength) * 100).toFixed(2));
      let percentage = Number((((totalLength - coveredLength) / totalLength) * 100).toFixed(2));
      let penalty = Math.round((2000 * Number(percentage) / 100)).toFixed(2);
      let wardDetail = this.wardList.find(item => item.wardNo == wardNo);
      if (wardDetail != undefined) {
        let dayList = wardDetail.dayList;
        if (Number(penalty) == 2000) {
          for (let i = 0; i < dayList.length; i++) {
            let dayPenalty = dayList[i]["dayPenalty"];
            if (dayPenalty[routeIndex]["penalty"] == "2000.00") {
              penalty = "2500.00";
              i = dayList.length;
            }
          }
        }
        wardDetail.routes[routeIndex]["totalLength"] = (Number(totalLength)).toFixed(1);
        this.penaltyData.totalPenalty = (Number(this.penaltyData.totalPenalty) + Number(penalty)).toFixed(2);
        //console.log("ward: " + wardNo + " day :" + day + " percentage :" + percentage + " penalty :" + penalty);

        let penaltyList = wardDetail.penalty;
        penaltyList[routeIndex]["penalty"] = (Number(penaltyList[routeIndex]["penalty"]) + Number(penalty)).toFixed(2);

        let d = "day" + Number(day);
        let dayDetail = dayList.find(item => item.day == d);

        if (dayDetail != undefined) {
          dayDetail.dayPenalty[routeIndex]["totalLength"] = totalLength;
          dayDetail.dayPenalty[routeIndex]["coveredLength"] = (Number(coveredLength)).toFixed(1);
          dayDetail.dayPenalty[routeIndex]["percentage"] = workPercentage;
          dayDetail.dayPenalty[routeIndex]["penalty"] = penalty;
          wardDetail.wardPenalty = (Number(wardDetail.wardPenalty) + Number(penalty)).toFixed(2);
          let totalDayDetail = this.dayList.find(item => item.day == day);
          if (totalDayDetail != undefined) {
            totalDayDetail.total = (Number(totalDayDetail.total) + Number(penalty)).toFixed(2);
          }
        }
      }
    });
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getDays();
    this.getWard();

  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.getDays();
    this.getWard();
  }
}

export class penaltyDatail {
  totalPenalty: string;
}
