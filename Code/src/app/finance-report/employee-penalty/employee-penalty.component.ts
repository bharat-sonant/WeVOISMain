import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-employee-penalty",
  templateUrl: "./employee-penalty.component.html",
  styleUrls: ["./employee-penalty.component.scss"],
})
export class EmployeePenaltyComponent implements OnInit {
  constructor(
    private storage: AngularFireStorage,
    private besuh: BackEndServiceUsesHistoryService,
    public fs: FirebaseService,
    private commonService: CommonService,
    public httpService: HttpClient
  ) {}
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  employeeList: any[];
  penalityList: any[];
  allPenaltyList: any[];
  specialUserList: any[];
  penalitylDetail: penalitylDetail = {
    totalPenality: "0.00",
    employeePenality: "0.00",
    totalReward:'0.00'
  };
  ddlUser = "#ddlUser";
  ddlPenaltyType = "#ddlPenaltyType";
  txtDate = "#txtDate";
  divLoader = "#divLoader";
  serviceName = "penalty";
  empCode: any;
  portalUserList: any[] = [];
  penaltyTypeList: any[] = [];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory(
      "Finance-Reports",
      "Penalty-Report",
      localStorage.getItem("userID")
    );
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.employeeList = [];
    this.penalityList = [];
    this.allPenaltyList = [];
    this.specialUserList = [];
    this.getYear();
    this.selectedMonth = this.toDayDate.split("-")[1];
    this.selectedYear = this.toDayDate.split("-")[0];
    $("#ddlMonth").val(this.selectedMonth);
    $("#ddlYear").val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(
      Number(this.selectedMonth) - 1
    );
    this.portalUserList = JSON.parse(localStorage.getItem("webPortalUserList"));
    this.getSpecialUsers();
    this.getEmployeeCodeByCityDetail();
  }

  getEmployeeCodeByCityDetail() {
    const path =
      this.commonService.fireStoragePath +
      "CityDetails%2FCityDetails.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe((data) => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let list = JSON.parse(JSON.stringify(data));
        let detail = list.find(
          (item) => item.cityName.toString().toLowerCase() == this.cityName
        );
        if (detail != undefined) {
          this.empCode = detail.empCode;
        }
        this.getPenalities();
      }
    });
  }

  getSpecialUsers() {
    this.besuh.saveBackEndFunctionCallingHistory(
      this.serviceName,
      "getSpecialUsers"
    );
    let dbPath = "Settings/SpecialUsers";
    let userInstance = this.db
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
        userInstance.unsubscribe();
        if (data.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(
            this.serviceName,
            "getSpecialUsers",
            data
          );
          for (let i = 0; i < data.length; i++) {
            this.specialUserList.push({ name: data[i]["username"] });
          }
        }
      });
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split("-")[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  changeYearSelection(filterVal: any) {
    this.resetAll();
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    this.selectedYear = filterVal;
    this.selectedMonth = "0";
    $("#ddlMonth").val("0");
  }

  changeMonthSelection(filterVal: any) {
    this.resetAll();
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    this.selectedMonth = filterVal;
    this.selectedMonthName = this.commonService.getCurrentMonthName(
      Number(this.selectedMonth) - 1
    );
    this.getPenalities();
  }

  resetAll() {
    this.penalitylDetail.employeePenality = "0.00";
    this.penalitylDetail.totalPenality = "0.00";
    this.penalitylDetail.totalReward = '0.00';
    this.penalityList = [];
    this.employeeList = [];
    this.penaltyTypeList = [];
    this.allPenaltyList = [];
  }

  getPenalities() {
    $(this.divLoader).show();
    const promises = [];
    promises.push(Promise.resolve(this.getAppPenalities()));
    promises.push(Promise.resolve(this.getAnalysisPenalities()));
    promises.push(Promise.resolve(this.getScanCardPenalties()));
    Promise.all(promises).then((results) => {
      let merged = [];
      for (let i = 0; i < results.length; i++) {
        merged = merged.concat(results[i]);
      }
      this.penalityList = merged;
      this.penalityList = this.penalityList.sort((a, b) => a.orderBy > b.orderBy ? 1 : -1);
      this.allPenaltyList = this.penalityList;
      this.penalitylDetail.totalPenality = this.allPenaltyList.reduce((acc, current) => {
         return (acc + (current.entryType !== "Reward" ? Number(current.amount) || 0 : 0));
        }, 0.0
      );

      // Total Reward (only rewards)
      this.penalitylDetail.totalReward = this.allPenaltyList.reduce((acc, current) => {
        return (acc +(current.entryType === "Reward" ? Number(current.amount) || 0 : 0));
        },0.0
      );
      for (let i = 0; i < this.allPenaltyList.length; i++) {
        let empDetail = this.employeeList.find((item) => item.empId == this.allPenaltyList[i]["empId"]);
        if (empDetail == undefined) {
          this.employeeList.push({ empId: this.allPenaltyList[i]["empId"], name: this.allPenaltyList[i]["name"],});
        }

        let penaltyDetail = this.penaltyTypeList.find((item) => item.penaltyType == this.allPenaltyList[i]["penaltyType"]);
        if (penaltyDetail == undefined) {
          this.penaltyTypeList.push({penaltyType: this.allPenaltyList[i]["penaltyType"]});
        }
      }
      this.employeeList = this.employeeList.sort((a, b) => a.name > b.name ? 1 : -1 );

      this.penaltyTypeList = this.penaltyTypeList.sort((a, b) => a.type > b.type ? 1 : -1 );

      $(this.divLoader).hide();
    });
  }

  getEmpNameById(empId: any) {
    return new Promise((resolve) => {
      let empName = "";
      let detail = this.specialUserList.find((item) => item.name == empId);
      if (detail != undefined) {
        empName = empId;
        resolve(empName);
      } else {
        let dbPath = "Employees/" + empId + "/GeneralDetails/name";
        let empInstance = this.db
          .object(dbPath)
          .valueChanges()
          .subscribe((empData) => {
            empInstance.unsubscribe();
            if (empData != null) {
              empName = empData;
            }
            resolve(empName);
          });
      }
    });
  }

  getAppPenalities() {
    return new Promise(async (resolve) => {
      let penaltyList = [];
      let dbPath ="Penalties/" + this.selectedYear + "/" + this.selectedMonthName;
      let penalityInstance = this.db.object(dbPath).valueChanges().subscribe(async (data:any) => {
          penalityInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let date = keyArray[i];
                let todayDate = new Date(date);
                let formattedDate = todayDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                let empObj = data[date];
                let empArray = Object.keys(empObj);
                if (empArray.length > 0) {
                  for (let j = 0; j < empArray.length; j++) {
                    let empId = empArray[j];
                    const empData = empObj[empId];
                    if (empData["lastKey"]) {
                      Object.keys(empData).map(async(key)=>{
                        if(key!=='lastKey'){
                          let keyDataObj = empData[key]
                          let processedData = await this.processPenaltiesData(keyDataObj,empId,date,penaltyList,formattedDate);
                          penaltyList.push(processedData);
                        }
                      });
                    }
                    else{
                      let processedData = await this.processPenaltiesData(empData,empId,date,penaltyList,formattedDate);
                      penaltyList.push(processedData);
                    }
                  }
                }
              }
            }
          }
          resolve(penaltyList);
        });
    });
  }

  getScanCardPenalties() {
    return new Promise(async (resolve) => {
      let penaltyList = [];
      let dbPath =
        "WardScanCardPenalties/" +
        this.selectedYear +
        "/" +
        this.selectedMonthName;
      let penalityInstance = this.db
        .object(dbPath)
        .valueChanges()
        .subscribe(async (data) => {
          penalityInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let date = keyArray[i];
                let todayDate = new Date(date);
                let formattedDate = todayDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                let empObj = data[date];
                let empArray = Object.keys(empObj);
                if (empArray.length > 0) {
                  for (let j = 0; j < empArray.length; j++) {
                    let empId = empArray[j];
                    let name;
                    let empCode = "";
                    let orderBy = new Date(date).getTime();
                    let empDetail = penaltyList.find(
                      (item) => item.empId == empId
                    );
                    if (empDetail == undefined) {
                      let empObjName =
                        await this.commonService.getEmplyeeDetailByEmployeeId(
                          empId
                        );
                      name = empObjName["name"];
                      empCode = empObjName["empCode"];
                      // name = await this.getEmpNameById(empId);
                    } else {
                      name = empDetail.name;
                      empCode = empDetail.empCode;
                    }
                    let penaltyType = "Scan Card";
                    let obj = empObj[empId];
                    let objKeyArray = Object.keys(obj);
                    for (let k = 0; k < objKeyArray.length; k++) {
                      let ward = objKeyArray[k];
                      let reason = obj[ward]["reason"];
                      let amount = obj[ward]["amount"];
                      let createdById = obj[ward]["createdBy"];
                      let createdBy;
                      let detail = this.portalUserList.find(
                        (item) => item.userId == createdById
                      );
                      if (detail != undefined) {
                        createdBy = detail.name;
                      }
                      let createdDate = obj[ward]["createdOn"];
                      let createdOn =
                        createdDate.split(" ")[0].split("-")[2] +
                        " " +
                        this.commonService.getCurrentMonthShortName(
                          Number(createdDate.split(" ")[0].split("-")[1])
                        ) +
                        " " +
                        createdDate.split(" ")[0].split("-")[0] +
                        " " +
                        createdDate.split(" ")[1];

                      penaltyList.push({
                        empId: empId,
                        empCode: empCode,
                        date: formattedDate,
                        name: name,
                        penaltyType: penaltyType,
                        reason: reason,
                        createdById: createdById,
                        createdBy: createdBy,
                        createdOn: createdOn,
                        amount: amount,
                        orderBy: orderBy,
                        entryType: empObj[empId]["entryType"] || "Penalty",
                      });
                    }
                  }
                }
              }
            }
          }
          resolve(penaltyList);
        });
    });
  }

  getAnalysisPenalities() {
    return new Promise(async (resolve) => {
      let penaltyList = [];
      let dbPath =
        "PenaltiesData/" + this.selectedYear + "/" + this.selectedMonthName;
      let penalityInstance = this.db
        .object(dbPath)
        .valueChanges()
        .subscribe(async (data) => {
          penalityInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let date = keyArray[i];
                let todayDate = new Date(date);
                let formattedDate = todayDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                let empObj = data[date];
                let empArray = Object.keys(empObj);
                if (empArray.length > 0) {
                  for (let j = 0; j < empArray.length; j++) {
                    let empId = empArray[j];
                    let name;
                    let empCode = "";
                    let orderBy = new Date(date).getTime();
                    let empDetail = penaltyList.find(
                      (item) => item.empId == empId
                    );
                    if (empDetail == undefined) {
                      let empObjName =
                        await this.commonService.getEmplyeeDetailByEmployeeId(
                          empId
                        );
                      name = empObjName["name"];
                      empCode = empObjName["empCode"];
                      // name = await this.getEmpNameById(empId);
                    } else {
                      name = empDetail.name;
                      empCode = empDetail.empCode;
                    }
                    let penaltyType = "";

                    let obj = empObj[empId];
                    let objKeyArray = Object.keys(obj);
                    for (let p = 0; p < objKeyArray.length; p++) {
                      let key = objKeyArray[p];
                      if (key == "Trips") {
                        penaltyType = "Trip Analysis";
                        let tripObj = obj[key];
                        let tripKeyArray = Object.keys(tripObj);
                        for (let k = 0; k < tripKeyArray.length; k++) {
                          let tripId = tripKeyArray[k];
                          let reason = tripObj[tripId]["reason"];
                          let amount = tripObj[tripId]["amount"];
                          let createdById = tripObj[tripId]["_by"];
                          let createdBy;
                          let detail = this.portalUserList.find(
                            (item) => item.userId == createdById
                          );
                          if (detail != undefined) {
                            createdBy = detail.name;
                          }
                          let createdDate = tripObj[tripId]["_at"];
                          let createdOn =
                            createdDate.split(" ")[0].split("-")[2] +
                            " " +
                            this.commonService.getCurrentMonthShortName(
                              Number(createdDate.split(" ")[0].split("-")[1])
                            ) +
                            " " +
                            createdDate.split(" ")[0].split("-")[0] +
                            " " +
                            createdDate.split(" ")[1];

                          penaltyList.push({
                            empId: empId,
                            empCode: empCode,
                            date: formattedDate,
                            name: name,
                            penaltyType: penaltyType,
                            reason: reason,
                            createdById: createdById,
                            createdBy: createdBy,
                            createdOn: createdOn,
                            amount: amount,
                            orderBy: orderBy,
                            entryType: empObj[empId]["entryType"] || "Penalty",
                          });
                        }
                      } else {
                        penaltyType = "Vehicle Route Analysis";
                        let VRAObj = obj[key];
                        let reason = VRAObj["VRA"]["reason"];
                        let amount = VRAObj["VRA"]["amount"];
                        let createdById = VRAObj["VRA"]["_by"];
                        let createdBy;
                        let detail = this.portalUserList.find(
                          (item) => item.userId == createdById
                        );
                        if (detail != undefined) {
                          createdBy = detail.name;
                        }
                        let createdDate = VRAObj["VRA"]["_at"];
                        let createdOn =
                          createdDate.split(" ")[0].split("-")[2] +
                          " " +
                          this.commonService.getCurrentMonthShortName(
                            Number(createdDate.split(" ")[0].split("-")[1])
                          ) +
                          " " +
                          createdDate.split(" ")[0].split("-")[0] +
                          " " +
                          createdDate.split(" ")[1];

                        penaltyList.push({
                          empId: empId,
                          empCode: empCode,
                          date: formattedDate,
                          name: name,
                          penaltyType: penaltyType,
                          reason: reason,
                          createdById: createdById,
                          createdBy: createdBy,
                          createdOn: createdOn,
                          amount: amount,
                          orderBy: orderBy,
                          entryType: empObj[empId]["entryType"] || "Penalty",
                        });
                      }
                    }
                  }
                }
              }
            }
          }
          resolve(penaltyList);
        });
    });
  }

  filterData() {
    this.penalityList = [];
    if (this.allPenaltyList.length > 0) {
      let penaltyType = $(this.ddlPenaltyType).val();
      let userId = $(this.ddlUser).val();
      let date = $(this.txtDate).val();
      let filteredList = this.allPenaltyList;
      if (penaltyType != "0") {
        filteredList = filteredList.filter(
          (item) => item.penaltyType == penaltyType
        );
      }
      if (userId != "0") {
        filteredList = filteredList.filter((item) => item.empId == userId);
      }
      if (date != "") {
        let todayDate = new Date(date.toString());
        let formattedDate = todayDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        if (formattedDate != "") {
          filteredList = filteredList.filter(
            (item) => item.date === formattedDate
          );
        }
      }
      this.penalityList = filteredList;
      // this.penalitylDetail.totalPenality = this.penalityList.reduce(
      //   (accumulator, current) => {
      //     return accumulator + (Number(current.amount) || 0);
      //   },
      //   0.0
      // );
      this.penalitylDetail.totalPenality = this.penalityList.reduce((acc, current) => {
        return (acc + (current.entryType !== "Reward" ? Number(current.amount) || 0 : 0));
        },0.0
      );

      // Total Reward (only rewards)
      this.penalitylDetail.totalReward = this.penalityList.reduce((acc, current) => {
        return (acc +(current.entryType === "Reward" ? Number(current.amount) || 0 : 0));
        },0.0
      );
    }
  }

  resetData() {
    $(this.txtDate).val("");
    $(this.ddlUser).val("0");
    $(this.ddlPenaltyType).val("0");
    this.penalityList = this.allPenaltyList;
    // this.penalitylDetail.totalPenality = this.penalityList.reduce(
    //   (accumulator, current) => {
    //     return accumulator + (Number(current.amount) || 0);
    //   },
    //   0.0
    // );
    this.penalitylDetail.totalPenality = this.penalityList.reduce((acc, current) => {
       return (acc + (current.entryType !== "Reward" ? Number(current.amount) || 0 : 0));
      },0.0
    );

      // Total Reward (only rewards)
    this.penalitylDetail.totalReward = this.penalityList.reduce((acc, current) => {
      return (acc +(current.entryType === "Reward" ? Number(current.amount) || 0 : 0));
      },0.0
     );
    
  }

  exportexcel() {
    let htmlString = "";
    if (this.penalityList.length > 0) {
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Entry Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Penalty";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Reason";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Penalty by";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Penalty on";
      htmlString += "</td>";

      htmlString += "</tr>";
      for (let i = 0; i < this.penalityList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.penalityList[i]["date"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["entryType"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["penaltyType"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["amount"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["reason"]?this.penalityList[i]["reason"].replace("/", "~").replace("/", "~"):'';
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString +=
          this.penalityList[i]["name"] +
          " (" +
          this.penalityList[i]["empCode"] +
          ")";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.penalityList[i]["createdBy"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += String(this.penalityList[i]["createdOn"]);
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, "text/html");
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    /* save to file */
    let fileName = "Penalty/Reward-" + this.selectedYear + "-" + this.commonService.getCurrentMonthShortName(Number(this.selectedMonth)) +  ".xlsx";
    XLSX.writeFile(wb, fileName);
  }
  processPenaltiesData = async(data:any,empId:any,date:any,penaltyList:any[],formattedDate:any) => {
    let name:any;
    let empCode = "";
    let orderBy = new Date(date).getTime();
    let createdById = data["createdBy"];
    let createdBy:any;
    if (parseInt(createdById)) {
      let detail = penaltyList.find((item) => item.createdById == data["createdBy"]);
      if (detail == undefined) {
        createdBy = await this.getEmpNameById(createdById);
      } else {
        createdBy = detail.createdBy;
      }
    } else {
      createdBy = createdById;
    }
    let empDetail = penaltyList.find((item) => item.empId == empId);
    if (empDetail == undefined) {
      let empObjName = await this.commonService.getEmplyeeDetailByEmployeeId(empId);
      name = empObjName["name"];
      empCode = empObjName["empCode"];
      // name = await this.getEmpNameById(empId);
    } else {
      name = empDetail.name;
      empCode = empDetail.empCode;
    }
    let createdDate = data["createdOn"];
    let createdOn = createdDate
      ? createdDate.split(" ")[0].split("-")[2] +
        " " +
        this.commonService.getCurrentMonthShortName(
          Number(createdDate.split(" ")[0].split("-")[1])
        ) +
        " " +
        createdDate.split(" ")[0].split("-")[0] +
        " " +
        createdDate.split(" ")[1]
      : "";
    return {
      empId: empId,
      empCode: empCode,
      date: formattedDate,
      name: name,
      penaltyType: data["penaltyType"],
      reason: data["reason"],
      createdById: data["createdBy"],
      createdBy: createdBy,
      createdOn: createdOn,
      amount: data["amount"],
      orderBy: orderBy,
      entryType: data["entryType"] || "Penalty",
    }
  };
}



export class penalitylDetail {
  totalPenality: string;
  employeePenality: string;
  totalReward:string;
}
