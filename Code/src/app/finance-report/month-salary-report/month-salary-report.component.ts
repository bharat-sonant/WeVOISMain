import { createOfflineCompileUrlResolver, getUrlScheme, ThrowStmt } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { data } from 'jquery';
import { parse } from 'querystring';
import { CommonService } from '../../services/common/common.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-month-salary-report',
  templateUrl: './month-salary-report.component.html',
  styleUrls: ['./month-salary-report.component.scss']
})
export class MonthSalaryReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  selectedCircle: any;
  wardTimeList: any[] = [];
  wardList: any[] = [];
  zoneList: any[] = [];
  wardDataList: any[] = [];
  selectedWard: any;
  driveySalary: any;
  halperSalary: any;
  totalSalary: any;
  petrolPrice: any;
  vechicleAvg: any;
  penaltyArray: any[] = [];
  yearList: any[] = [];
  OtherList: any[];
  db:any
  cityName:any;

  costData: costDatail =
    {
      totalCost: "0.00",
      salary: "0.00",
      petrol: "0.00",
      penalty: "0.00",
      day1: "0.00",
      day2: "0.00",
      day3: "0.00",
      day4: "0.00",
      day5: "0.00",
      day6: "0.00",
      day7: "0.00",
      day8: "0.00",
      day9: "0.00",
      day10: "0.00",
      day11: "0.00",
      day12: "0.00",
      day13: "0.00",
      day14: "0.00",
      day15: "0.00",
      day16: "0.00",
      day17: "0.00",
      day18: "0.00",
      day19: "0.00",
      day20: "0.00",
      day21: "0.00",
      day22: "0.00",
      day23: "0.00",
      day24: "0.00",
      day25: "0.00",
      day26: "0.00",
      day27: "0.00",
      day28: "0.00",
      day29: "0.00",
      day30: "0.00",
      day31: "0.00",

      salary1: "0.00",
      salary2: "0.00",
      salary3: "0.00",
      salary4: "0.00",
      salary5: "0.00",
      salary6: "0.00",
      salary7: "0.00",
      salary8: "0.00",
      salary9: "0.00",
      salary10: "0.00",
      salary11: "0.00",
      salary12: "0.00",
      salary13: "0.00",
      salary14: "0.00",
      salary15: "0.00",
      salary16: "0.00",
      salary17: "0.00",
      salary18: "0.00",
      salary19: "0.00",
      salary20: "0.00",
      salary21: "0.00",
      salary22: "0.00",
      salary23: "0.00",
      salary24: "0.00",
      salary25: "0.00",
      salary26: "0.00",
      salary27: "0.00",
      salary28: "0.00",
      salary29: "0.00",
      salary30: "0.00",
      salary31: "0.00",


      petrol1: "0.00",
      petrol2: "0.00",
      petrol3: "0.00",
      petrol4: "0.00",
      petrol5: "0.00",
      petrol6: "0.00",
      petrol7: "0.00",
      petrol8: "0.00",
      petrol9: "0.00",
      petrol10: "0.00",
      petrol11: "0.00",
      petrol12: "0.00",
      petrol13: "0.00",
      petrol14: "0.00",
      petrol15: "0.00",
      petrol16: "0.00",
      petrol17: "0.00",
      petrol18: "0.00",
      petrol19: "0.00",
      petrol20: "0.00",
      petrol21: "0.00",
      petrol22: "0.00",
      petrol23: "0.00",
      petrol24: "0.00",
      petrol25: "0.00",
      petrol26: "0.00",
      petrol27: "0.00",
      petrol28: "0.00",
      petrol29: "0.00",
      petrol30: "0.00",
      petrol31: "0.00",


      penalty1: "0.00",
      penalty2: "0.00",
      penalty3: "0.00",
      penalty4: "0.00",
      penalty5: "0.00",
      penalty6: "0.00",
      penalty7: "0.00",
      penalty8: "0.00",
      penalty9: "0.00",
      penalty10: "0.00",
      penalty11: "0.00",
      penalty12: "0.00",
      penalty13: "0.00",
      penalty14: "0.00",
      penalty15: "0.00",
      penalty16: "0.00",
      penalty17: "0.00",
      penalty18: "0.00",
      penalty19: "0.00",
      penalty20: "0.00",
      penalty21: "0.00",
      penalty22: "0.00",
      penalty23: "0.00",
      penalty24: "0.00",
      penalty25: "0.00",
      penalty26: "0.00",
      penalty27: "0.00",
      penalty28: "0.00",
      penalty29: "0.00",
      penalty30: "0.00",
      penalty31: "0.00"
    };

  ngOnInit() {
    this.cityName=localStorage.getItem("cityName");
    this.db=this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href,this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.getSetting();
    this.getWards();
  }
  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getSetting() {
    let dbPath = "Settings/Salary";
    let salaryData = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        this.driveySalary = data["driver_salary_per_hour"];
        this.halperSalary = data["helper_salary_per_hour"];
        this.totalSalary = parseFloat(this.driveySalary) + parseFloat(this.halperSalary);
        salaryData.unsubscribe();
      });
    dbPath = "Settings/Petrol";
    let petrolData = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        this.vechicleAvg = data["avg"];
        this.petrolPrice = data["price"];
        petrolData.unsubscribe();
      });
    dbPath = "Settings/Penalty";
    let penaltyData = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        this.penaltyArray = Object.entries(data);
        penaltyData.unsubscribe();
      });
  }

  getWards() {
    let dbPath = "Defaults/AllWard";
    let circleWiseWard = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        if (data != null) {
          var keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            let circleDataList = data[index];
            if (circleDataList.length > 0) {
              for (let j = 1; j < circleDataList.length; j++) {
                this.wardList.push({ circle: index, wardNo: circleDataList[j]["wardNo"], startDate: circleDataList[j]["startDate"], endDate: circleDataList[j]["endDate"], displayIndex: circleDataList[j]["displayIndex"] });
              }
            }
          }
        }
        this.selectedCircle = 'Circle1';
        this.onSubmit();
        circleWiseWard.unsubscribe();
      });
  }

  changeCircleSelection(filterVal: any) {
    this.selectedCircle = filterVal;
    this.onSubmit();
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.onSubmit();
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.onSubmit();
  }

  onSubmit() {
    this.clearAll();
    if (this.wardList.length > 0) {
      let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
      let rowTo = days;
      if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
        rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
      }
      let monthStartDate = new Date(this.selectedYear + "-" + this.selectedMonth + "-01");
      let monthendDate = new Date(this.selectedYear + "-" + this.selectedMonth + "-" + rowTo);
      for (let wardIndex = 0; wardIndex < this.wardList.length; wardIndex++) {
        if (this.wardList[wardIndex]["circle"] == this.selectedCircle) {
          let startDate = new Date(this.wardList[wardIndex]["startDate"]);
          let endDate: Date = null;
          if (this.wardList[wardIndex]["endDate"] != null) {
            endDate = new Date(this.wardList[wardIndex]["endDate"]);
          }
          if (startDate < monthendDate) {
            if (endDate == null) {
              this.zoneList.push({ wardNo: this.wardList[wardIndex]["wardNo"], startDate: this.wardList[wardIndex]["startDate"], endDate: endDate });
              this.wardDataList.push({ wardNo: this.wardList[wardIndex]["wardNo"], totalSalary: "0.00", driverSalary: "0.00", helperSalary: "0.00", cost: 0, petrol: 0, petrolCost: 0, totalCost: 0, wardTotalCost: 0, fine: 0, fineCost: 0, driverId: 0, helperId: 0 });
            }
            else {
              if (endDate >= monthStartDate && startDate < monthendDate) {
                this.zoneList.push({ wardNo: this.wardList[wardIndex]["wardNo"], startDate: this.wardList[wardIndex]["startDate"], endDate: endDate });
                this.wardDataList.push({ wardNo: this.wardList[wardIndex]["wardNo"], totalSalary: "0.00", driverSalary: "0.00", helperSalary: "0.00", cost: 0, petrol: 0, petrolCost: 0, totalCost: 0, wardTotalCost: 0, fine: 0, fineCost: 0, driverId: 0, helperId: 0 });
              }
            }
          }
        }
      }

      for (let i = 0; i < this.zoneList.length; i++) {
        for (let j = 0; j <= rowTo; j++) {
          let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
          let d = "day" + parseFloat(monthDate.split("-")[2]);
          if (this.selectedCircle != "Others") {
            this.wardDataList[i][d] = "0.00<br/> 0.00<br/>0.00<br/>0.00";
          }
          else {
            this.wardDataList[i][d] = "0.00";
            this.wardDataList[i].type = "1";
          }
        }
      }
      if (this.zoneList.length > 0) {
        if (this.selectedCircle != "Others") {
          this.showHide(0);
          for (let i = 0; i < this.zoneList.length; i++) {
            this.getPanaltyData(this.zoneList[i]["wardNo"], this.zoneList[i]["startDate"], this.zoneList[i]["endDate"]);
          }
        }
        else {
          this.showHide(1);
          this.getOtherWages();
        }
      }
    }
  }

  //#region Others Wages


  getOtherWages() {
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    let rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let j = 1; j <= rowTo; j++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
      let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
      if (this.toDayDate == monthDate) {
        this.getOtherWagesData(monthName, monthDate, j);
      }
      else {
        let dbPath = "OtherWages/" + this.selectedYear + "/" + monthName + "/" + monthDate;
        let dataInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            dataInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                let d = "day" + parseFloat(monthDate.split("-")[2]);
                let type = "type" + parseFloat(monthDate.split("-")[2]);
                let detail = "day" + parseFloat(monthDate.split("-")[2]) + "Detail";
                for (let i = 0; i < keyArray.length; i++) {
                  let index = keyArray[i];
                  let wardDetails = this.wardDataList.find(item => item.wardNo == index);
                  if (wardDetails != undefined) {
                    wardDetails[d] = data[index]["totalWages"];
                    wardDetails[detail] = data[index]["detailURL"];
                    wardDetails[type] = "1";
                    if (wardDetails.cost == undefined) {
                      wardDetails.cost = Number(data[index]["totalWages"]);
                    }
                    else {
                      wardDetails.cost = Number(wardDetails.cost) + Number(data[index]["totalWages"]);
                    }
                    this.costData.salary = (parseFloat(this.costData.salary) + Number(data[index]["totalWages"])).toFixed(2);
                    this.costData.totalCost = (parseFloat(this.costData.totalCost) + Number(data[index]["totalWages"])).toFixed(2);
                    this.getSum(d, data[index]["totalWages"], "S");
                  }
                }
              }
            }
            else {
              this.getOtherWagesData(monthName, monthDate, j);
            }
          });
      }
    }
  }

  getOtherWagesData(monthName: any, monthDate: any, j: any) {
    let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + monthName + "/" + monthDate;
    let otherWagesInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        otherWagesInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          let d = "day" + parseFloat(monthDate.split("-")[2]);
          let type = "type" + parseFloat(monthDate.split("-")[2]);
          let detail = "day" + parseFloat(monthDate.split("-")[2]) + "Detail";
          for (let k = 0; k < keyArray.length; k++) {
            let index = keyArray[k];
            for (let i = 0; i < 5; i++) {
              let task = "task" + i;
              if (data[index][task] != null) {
                let wardNo = data[index][task]["task"];
                if (wardNo.includes("BinLifting")) {
                  wardNo = "BinLifting";
                }
                // if (wardNo == "BinLifting") {
                if (data[index][task]["task-wages"] != null) {
                  let wardDetails = this.wardDataList.find(item => item.wardNo == wardNo);
                  if (wardDetails != undefined) {
                    let taskWages = Number(data[index][task]["task-wages"]);
                    if (taskWages < 0) {
                      taskWages = 0;
                    }
                    let wages = taskWages;
                    if (wardDetails[d] != null) {
                      taskWages = Number(wardDetails[d]) + taskWages;
                    }
                    wardDetails[d] = taskWages.toFixed(2);
                    if (wardDetails.cost == undefined) {
                      wardDetails.cost = wages;
                    }
                    else {
                      wardDetails.cost = Number(wardDetails.cost) + wages;
                    }
                    if (wardDetails[detail] == null) {
                      wardDetails[detail] = j + '-' + wardNo + '-' + index + '-' + task + '-' + wages;
                    }
                    else {
                      wardDetails[detail] = wardDetails[detail] + "," + j + '-' + wardNo + '-' + index + '-' + task + '-' + wages;
                    }
                    wardDetails[type] = "1";
                    this.costData.salary = (parseFloat(this.costData.salary) + Number(wages)).toFixed(2);
                    this.costData.totalCost = (parseFloat(this.costData.totalCost) + Number(wages)).toFixed(2);
                    this.getSum(d, wages, "S");
                    if (this.toDayDate != monthDate) {
                      let savePath = "OtherWages/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/" + wardNo + "";
                      this.db.object(savePath).update({
                        "totalWages": taskWages,
                        "detailURL": wardDetails[detail]
                      });
                    }
                  }
                }
                //  }
              }
            }
          }
        }
      });
  }

  showHide(type: any) {
    if (type == 1) {
      $('#leftTotal').hide();
      $('#divTotalPetrol').hide();
      $('#divTotalPenalty').hide();
      for (let i = 1; i <= 31; i++) {
        $('#leftTotal' + i).hide();
      }
    }
    else {
      $('#leftTotal').show();
      $('#divTotalPetrol').show();
      $('#divTotalPenalty').show();
      for (let i = 1; i <= 31; i++) {
        $('#leftTotal' + i).show();
      }
    }
  }

  // open model 
  openDetail(content: any, detail: any) {
    this.OtherList = [];
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let height = 700;
    let width = 750;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 100;
    $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
    $('div .modal-dialog-centered').css("margin-top", "26px");
    $('#divStatus').css("height", divHeight);
    let detailList = detail.split(',');
    let totalWages = 0;
    for (let i = 0; i < detailList.length; i++) {
      let j = detailList[i].split('-')[0];
      totalWages += Number(detailList[i].split('-')[4]);
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
      let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
      let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/" + detailList[i].split('-')[2] + "/" + detailList[i].split('-')[3];
      let detailInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          detailInstance.unsubscribe();
          if (data != null) {
            if (data["task-wages"] != null) {
              let wages = Number(data["task-wages"]);
              if (wages < 0) {
                wages = 0;
              }
              let inTime = "---";
              let outTime = "---";
              if (data["in-out"] != null) {
                let valueArray = Object.values(data["in-out"]);
                let keyArray = Object.keys(data["in-out"]);
                for (let inOutIndex = 0; inOutIndex < valueArray.length; inOutIndex++) {
                  if (valueArray[inOutIndex] == "In") {
                    let time = keyArray[inOutIndex].split(':')[0] + ":" + keyArray[inOutIndex].split(':')[1];
                    inTime = this.commonService.tConvert(time);
                  }
                  else if (valueArray[inOutIndex] == "Out") {
                    let time = keyArray[inOutIndex].split(':')[0] + ":" + keyArray[inOutIndex].split(':')[1];
                    outTime = this.commonService.tConvert(time);
                  }
                }
              }
              this.commonService.getEmplyeeDetailByEmployeeId(detailList[i].split('-')[2]).then((employee) => {
                let plan = null;
                let name = employee["name"] != null ? (employee["name"].toUpperCase()) : "Not Assigned";
                if (detailList[0].split('-')[1] == "BinLifting") {
                  $('#tdPlan').show();
                  plan = data["task"].replace("BinLifting", "").replace("(", "").replace(")", "");
                }
                else {
                  $('#tdPlan').hide();
                }
                let designation = employee["designation"];
                if (designation.trim() == "Transportation Executive") {
                  designation = "Driver";
                }
                else if (designation.trim() == "Service Excecutive") {
                  designation = "Helper";
                }

                this.OtherList.push({ name: name, wages: wages, inTime: inTime, outTime: outTime, designation: designation, plan: plan });
              });
            }
          }
        });
    }
    let title = detailList[0].split('-')[1] + "&nbsp;&nbsp;<b>₹ " + totalWages.toFixed(2) + "</b>";
    $('#exampleModalLongTitle').html(title);
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  //#endregion Other Wages

  getPanaltyData(wardNo: string, startDate: any, endDate: any) {
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    let rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let j = 1; j <= rowTo; j++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
      let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
      if (new Date(startDate) <= new Date(monthDate)) {
        if (endDate == null) {
          this.getPenalty(wardNo, monthName, monthDate);
        }
        else {
          if (endDate >= monthDate && startDate < monthDate) {
            this.getPenalty(wardNo, monthName, monthDate);
          }
        }
      }
      this.getPetrolData(wardNo, monthName, monthDate);
      this.getSalary(wardNo, monthName, monthDate);
    }
  }

  getPenalty(wardNo: string, monthName: any, monthDate: any) {
    let workPercentPath = 'WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary/workPercentage';
    let workPercentDetails = this.db.object(workPercentPath).valueChanges().subscribe(
      workePercentData => {
        if (workePercentData != null) {
          let zoneDetails = this.wardDataList.find(item => item.wardNo == wardNo);
          if (zoneDetails != undefined) {
            let d = "day" + parseFloat(monthDate.split("-")[2]);
            let workPercentage = workePercentData;
            let penalty = 0;
            if (!wardNo.toString().includes("mkt")) {
              if (this.penaltyArray.length > 0) {
                for (let i = 0; i < this.penaltyArray.length; i++) {
                  if (i == 0) {
                    if (workPercentage <= parseFloat(this.penaltyArray[i][0])) {
                      penalty = parseFloat(this.penaltyArray[i][1]);
                    }
                  }
                  else {
                    if (workPercentage > parseFloat(this.penaltyArray[i - 1][0]) && workPercentage <= parseFloat(this.penaltyArray[i][0])) {
                      penalty = penalty = parseFloat(this.penaltyArray[i][1]);
                    }
                  }
                }
              }
            }
            zoneDetails.fine = Number(penalty);
            zoneDetails.fineCost = (parseFloat(zoneDetails.fineCost) + parseFloat(zoneDetails.fine)).toFixed(2);
            if (zoneDetails[d] != null) {
              let daydetail = zoneDetails[d];
              let dayArray = daydetail.split("<br/>");
              zoneDetails[d] = " " + dayArray[0] + "<br/> " + dayArray[1] + "<br/>" + penalty.toFixed(2) + "<br/>" + (parseFloat(dayArray[0]) + parseFloat(dayArray[1]) + Number(penalty)).toFixed(2) + "";
            }
            this.costData.totalCost = (parseFloat(this.costData.totalCost) + Number(penalty)).toFixed(2);
            this.costData.penalty = (parseFloat(this.costData.penalty) + Number(penalty)).toFixed(2);
            zoneDetails.totalCost = (parseFloat(zoneDetails.totalCost) + Number(zoneDetails.fine)).toFixed(2);
            this.getSum(d, penalty, "F");
          }
        }
        workPercentDetails.unsubscribe();
      });
  }

  getDriverHelperSalary(wardNo: any, monthName: any, monthDate: any, empId: any, type: any) {
    let dbPath = 'DailyWorkDetail/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/' + empId;
    let salaryInstance = this.db.object(dbPath).valueChanges().subscribe(
      salaryData => {
        salaryInstance.unsubscribe();
        if (salaryData != null) {
          let salary = 0;
          for (let i = 0; i < 5; i++) {
            if (salaryData["task" + i + ""] != null) {
              if (salaryData["task" + i + ""]["task"] == wardNo) {
                if (salaryData["task" + i + ""]["task-wages"] != null) {
                  salary = salary + parseFloat(salaryData["task" + i + ""]["task-wages"]);
                }
              }
            }
          }
          let zoneDetails = this.wardDataList.find(item => item.wardNo == wardNo);
          if (zoneDetails != undefined) {
            let d = "day" + parseFloat(monthDate.split("-")[2]);
            let driverSalary = "driverSalary" + parseFloat(monthDate.split("-")[2]);
            let helperSalary = "helperSalary" + parseFloat(monthDate.split("-")[2]);
            let secondHelperSalary = "secondHelperSalary" + parseFloat(monthDate.split("-")[2]);
            let thirdHelperSalary = "thirdHelperSalary" + parseFloat(monthDate.split("-")[2]);
            let fourthHelperSalary = "fourthHelperSalary" + parseFloat(monthDate.split("-")[2]);
            let totalSalary = Number(zoneDetails.totalSalary);
            let wardSalary=0;
            let cost=Number(zoneDetails.cost);
            let driverList = [];
            let helperList = [];
            let secondHelperList = [];
            let thirdHelperList = [];
            let fourthHelperList = [];
            if (type == "driver") {
              if (zoneDetails[driverSalary] == null) {
                zoneDetails[driverSalary] = salary;
              }
              else {
                zoneDetails[driverSalary] = zoneDetails[driverSalary] + "," + salary;
              }
              if (this.toDayDate != monthDate) {
                this.db.object('WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary').update({
                  "driverSalary": zoneDetails[driverSalary]
                });
              }
            }
            else if (type == "helper") {
              if (zoneDetails[helperSalary] == null) {
                zoneDetails[helperSalary] = salary;
              }
              else {
                zoneDetails[helperSalary] = zoneDetails[helperSalary] + "," + salary;
              }
              if (this.toDayDate != monthDate) {
                this.db.object('WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary').update({
                  "helperSalary": zoneDetails[helperSalary]
                });
              }
            }
            else if (type == "secondHelper") {
              if (zoneDetails[secondHelperSalary] == null) {
                zoneDetails[secondHelperSalary] = salary;
              }
              else {
                zoneDetails[secondHelperSalary] = zoneDetails[secondHelperSalary] + "," + salary;
              }
              if (this.toDayDate != monthDate) {
                this.db.object('WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary').update({
                  "secondHelperSalary": zoneDetails[secondHelperSalary]
                });
              }
            }
            else if (type == "thirdHelper") {
              if (zoneDetails[thirdHelperSalary] == null) {
                zoneDetails[thirdHelperSalary] = salary;
              }
              else {
                zoneDetails[thirdHelperSalary] = zoneDetails[thirdHelperSalary] + "," + salary;
              }
              if (this.toDayDate != monthDate) {
                this.db.object('WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary').update({
                  "thirdHelperSalary": zoneDetails[thirdHelperSalary]
                });
              }
            }
            else if (type == "fourthHelper") {
              if (zoneDetails[fourthHelperSalary] == null) {
                zoneDetails[fourthHelperSalary] = salary;
              }
              else {
                zoneDetails[fourthHelperSalary] = zoneDetails[fourthHelperSalary] + "," + salary;
              }
              if (this.toDayDate != monthDate) {
                this.db.object('WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary').update({
                  "fourthHelperSalary": zoneDetails[fourthHelperSalary]
                });
              }
            }
            totalSalary = Number(totalSalary) + Number(salary.toString().trim());
            
            if (zoneDetails[driverSalary] != null) {
              driverList = zoneDetails[driverSalary].toString().split(',');
              for (let i = 0; i < driverList.length; i++) {
                wardSalary = Number(wardSalary) + Number(driverList[i].toString().trim());
              }
            }
            if (zoneDetails[helperSalary] != null) {
              helperList = zoneDetails[helperSalary].toString().split(',');
              for (let i = 0; i < helperList.length; i++) {
                wardSalary = Number(wardSalary) + Number(helperList[i].toString().trim());
              }
            }
            if (zoneDetails[secondHelperSalary] != null) {
              secondHelperList = zoneDetails[secondHelperSalary].toString().split(',');
              for (let i = 0; i < secondHelperList.length; i++) {
                wardSalary = Number(wardSalary) + Number(secondHelperList[i].toString().trim());
              }
            }
            if (zoneDetails[thirdHelperSalary] != null) {
              thirdHelperList = zoneDetails[thirdHelperSalary].toString().split(',');
              for (let i = 0; i < thirdHelperList.length; i++) {
                wardSalary = Number(wardSalary) + Number(thirdHelperList[i].toString().trim());
              }
            }
            if (zoneDetails[fourthHelperSalary] != null) {
              fourthHelperList = zoneDetails[fourthHelperSalary].toString().split(',');
              for (let i = 0; i < fourthHelperList.length; i++) {
                wardSalary = Number(wardSalary) + Number(fourthHelperList[i].toString().trim());
              }
            }
            
            zoneDetails.totalSalary = totalSalary.toFixed(2);
            if (zoneDetails[d] != null) {
              let daydetail = zoneDetails[d];
              let dayArray = daydetail.split("<br/>");
              zoneDetails[d] = " " + wardSalary + "<br/> " + dayArray[1] + "<br/>" + dayArray[2] + "<br/>" + (Number(wardSalary) + parseFloat(dayArray[1]) + parseFloat(dayArray[2])).toFixed(2) + "";
            }
            this.costData.totalCost = (parseFloat(this.costData.totalCost) + Number(salary)).toFixed(2);
            this.costData.salary = (parseFloat(this.costData.salary) + Number(salary)).toFixed(2);
            zoneDetails.cost = (Number(cost) + Number(salary)).toFixed(2);
            zoneDetails.totalCost = (parseFloat(zoneDetails.totalCost) + Number(salary)).toFixed(2);
            this.getSum(d, salary, "S");
          }
        }
      }
    );
  }

  getSalary(wardNo: any, monthName: any, monthDate: any) {
   // this.getWardSalary(wardNo, monthName, monthDate);
   // return;
    if (monthDate == this.toDayDate) {
      this.getWardSalary(wardNo, monthName, monthDate);
    }
    else {
      let Path = 'WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary';
      let driverDetails = this.db.object(Path).valueChanges().subscribe(
        data => {
          let isData = false;
          driverDetails.unsubscribe();
          if (data != null) {
            if (data["driverSalary"] == null) {
              isData = true;
            }
            else if (data["driverSalary"] == 0) {
              isData = true;
            }
            if (isData == false) {
              let driverSalary = data["driverSalary"];
              let helperSalary = data["helperSalary"];
              let secondHelperSalary = null;
              if (data["secondHelperSalary"] != null) {
                secondHelperSalary = data["secondHelperSalary"];
              }
              let thirdHelperSalary = null;
              if (data["thirdHelperSalary"] != null) {
                thirdHelperSalary = data["thirdHelperSalary"];
              }
              let fourthHelperSalary = null;
              if (data["fourthHelperSalary"] != null) {
                fourthHelperSalary = data["fourthHelperSalary"];
              }
              let zoneDetails = this.wardDataList.find(item => item.wardNo == wardNo);
              if (zoneDetails != undefined) {
                let d = "day" + parseFloat(monthDate.split("-")[2]);
                let driverList = driverSalary.toString().split(',');
                let helperList = helperSalary.toString().split(',');
                let secondHelperList = [];
                let thirdHelperList = [];
                let fourthHelperList = [];
                let driverSalaryTotal = 0;
                let helperSalaryTotal = 0;
                let secondHelperSalaryTotal = 0;
                let thirdHelperSalaryTotal = 0;
                let fourthHelperSalaryTotal = 0;
                if (secondHelperSalary != null) {
                  secondHelperList = secondHelperSalary.toString().split(',');
                }
                if (thirdHelperSalary != null) {
                  thirdHelperList = thirdHelperSalary.toString().split(',');
                }
                if (fourthHelperSalary != null) {
                  fourthHelperList = fourthHelperSalary.toString().split(',');
                }
                for (let i = 0; i < driverList.length; i++) {
                  driverSalaryTotal = Number(driverSalaryTotal) + Number(driverList[i].trim());
                }
                for (let i = 0; i < helperList.length; i++) {
                  helperSalaryTotal = Number(helperSalaryTotal) + Number(helperList[i].trim());
                }
                for (let i = 0; i < secondHelperList.length; i++) {
                  secondHelperSalaryTotal = Number(secondHelperSalaryTotal) + Number(secondHelperList[i].trim());
                }
                for (let i = 0; i < thirdHelperList.length; i++) {
                  thirdHelperSalaryTotal = Number(thirdHelperSalaryTotal) + Number(thirdHelperList[i].trim());
                }
                for (let i = 0; i < fourthHelperList.length; i++) {
                  fourthHelperSalaryTotal = Number(fourthHelperSalaryTotal) + Number(fourthHelperList[i].trim());
                }

                zoneDetails.driverSalary = driverSalaryTotal.toFixed(2);
                zoneDetails.helperSalary = helperSalaryTotal.toFixed(2);
                zoneDetails.secondHelperSalary = secondHelperSalaryTotal.toFixed(2);
                zoneDetails.thirdHelperSalary = thirdHelperSalaryTotal.toFixed(2);
                zoneDetails.fourthHelperSalary = fourthHelperSalaryTotal.toFixed(2);
                zoneDetails.totalSalary = (Number(zoneDetails.driverSalary) + Number(zoneDetails.helperSalary) + Number(zoneDetails.secondHelperSalary) + Number(zoneDetails.thirdHelperSalary) + Number(zoneDetails.fourthHelperSalary)).toFixed(2);
                if (zoneDetails[d] != null) {
                  let daydetail = zoneDetails[d];
                  let dayArray = daydetail.split("<br/>");
                  zoneDetails[d] = " " + zoneDetails.totalSalary + "<br/> " + dayArray[1] + "<br/>" + dayArray[2] + "<br/>" + (parseFloat(zoneDetails.totalSalary) + parseFloat(dayArray[1]) + parseFloat(dayArray[2])).toFixed(2) + "";
                }
                this.costData.totalCost = (parseFloat(this.costData.totalCost) + parseFloat(zoneDetails.totalSalary)).toFixed(2);
                this.costData.salary = (parseFloat(this.costData.salary) + parseFloat(zoneDetails.totalSalary)).toFixed(2);
                zoneDetails.cost = (parseFloat(zoneDetails.cost) + parseFloat(zoneDetails.totalSalary)).toFixed(2);
                zoneDetails.totalCost = (parseFloat(zoneDetails.totalCost) + parseFloat(zoneDetails.totalSalary)).toFixed(2);
                this.getSum(d, zoneDetails.totalSalary, "S");
              }
            }
            else {
              this.getWardSalary(wardNo, monthName, monthDate);
            }
          }
        });
    }
  }

  getWardSalary(wardNo: any, monthName: any, monthDate: any) {
    let workDetailsPath = 'WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/WorkerDetails';
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe(
      workerData => {
        workDetails.unsubscribe();
        if (workerData != null) {
          let driverId = "";
          let helperId = "";
          let secondHelperId = "";
          let thirdHelperId = "";
          let fourthHelperId = "";
          // driver 
          if (workerData["driver"] != null) {
            driverId = workerData["driver"];
            let list = driverId.split(",");
            this.getWardEmpSalary(wardNo, monthName, monthDate, list, "driver");
          }
          if (workerData["helper"] != null) {
            helperId = workerData["helper"];
            let list = helperId.split(",");
            this.getWardEmpSalary(wardNo, monthName, monthDate, list, "helper");
          }
          if (workerData["secondHelper"] != null) {
            secondHelperId = workerData["secondHelper"];
            let list = secondHelperId.split(",");
            this.getWardEmpSalary(wardNo, monthName, monthDate, list, "secondHelper");
          }
          if (workerData["thirdHelper"] != null) {
            thirdHelperId = workerData["thirdHelper"];
            let list = thirdHelperId.split(",");
            this.getWardEmpSalary(wardNo, monthName, monthDate, list, "thirdHelper");
          }
          if (workerData["fourthHelper"] != null) {
            fourthHelperId = workerData["fourthHelper"];
            let list = fourthHelperId.split(",");
            this.getWardEmpSalary(wardNo, monthName, monthDate, list, "fourthHelper");
          }
        }
      });
  }

  getWardEmpSalary(wardNo: any, monthName: any, monthDate: any, list: any[], type: any) {
    for (let i = 0; i < list.length; i++) {
      if (list.length == 1) {
        this.getDriverHelperSalary(wardNo, monthName, monthDate, list[i].trim(), type);
      }
      else {
        let isDriver = false;
        for (let j = 0; j < i; j++) {
          if (list[i].trim() == list[j].trim()) {
            isDriver = true;
          }
        }
        if (isDriver == false) {
          this.getDriverHelperSalary(wardNo, monthName, monthDate, list[i].trim(), type);
        }
      }
    }

  }

  getPetrolData(wardNo: any, monthName: any, monthDate: any) {
    let todayDate = this.commonService.setTodayDate();
    if (todayDate == monthDate) {
      this.getPetrolCost(wardNo, monthName, monthDate);
    }
    else {
      let Path = 'WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary/petrolCost';
      let Details = this.db.object(Path).valueChanges().subscribe(
        Data => {
          if (Data == null) {
            this.getPetrolCost(wardNo, monthName, monthDate);
          }
          else if (Data == 0) {
            this.getPetrolCost(wardNo, monthName, monthDate);
          }
          else {
            let zoneDetails = this.wardDataList.find(item => item.wardNo == wardNo);
            if (zoneDetails != undefined) {
              let d = "day" + parseFloat(monthDate.split("-")[2]);
              let petrolCost = Number(Data);
              zoneDetails.petrolCost = (parseFloat(zoneDetails.petrolCost) + Number(petrolCost)).toFixed(2);
              this.costData.totalCost = (parseFloat(this.costData.totalCost) + Number(petrolCost)).toFixed(2);
              this.costData.petrol = (parseFloat(this.costData.petrol) + Number(petrolCost)).toFixed(2);
              zoneDetails.totalCost = (parseFloat(zoneDetails.totalCost) + Number(petrolCost)).toFixed(2);
              if (zoneDetails[d] != null) {
                let daydetail = zoneDetails[d];
                let dayArray = daydetail.split("<br/>");
                let total = (parseFloat(dayArray[0]) + Number(petrolCost) + parseFloat(dayArray[2])).toFixed(2);
                zoneDetails[d] = " " + parseFloat(dayArray[0]).toFixed(2) + "<br/> " + Number(petrolCost).toFixed(2) + "<br/>" + parseFloat(dayArray[2]).toFixed(2) + "<br/>" + total + "";
              }
              this.getSum(d, petrolCost, "P");
            }
          }
          Details.unsubscribe();
        });
    }
  }

  getPetrolCost(wardNo: any, monthName: any, monthDate: any) {
    let workDetailsPath = 'WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/WorkerDetails';
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe(
      workerData => {
        if (workerData != null) {
          let distanceDetailsPath = 'LocationHistory/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '';
          let distanceDetails = this.db.list(distanceDetailsPath).valueChanges().subscribe(
            distanceData => {
              if (distanceData != null) {
                let distance = 0;
                for (let i = 0; i < distanceData.length; i++) {
                  if (distanceData[i]["distance-in-meter"] != null) {
                    distance += parseFloat(distanceData[i]["distance-in-meter"]);
                  }
                }
                let zoneDetails = this.wardDataList.find(item => item.wardNo == wardNo);
                if (zoneDetails != undefined) {
                  let d = "day" + parseFloat(monthDate.split("-")[2]);
                  let petrol = (distance / 1000) / this.vechicleAvg;
                  let price = petrol * this.petrolPrice;
                  zoneDetails.petrolCost = (parseFloat(zoneDetails.petrolCost) + Number(price)).toFixed(2);
                  this.costData.totalCost = (parseFloat(this.costData.totalCost) + Number(price)).toFixed(2);
                  zoneDetails.totalCost = (parseFloat(zoneDetails.totalCost) + Number(price)).toFixed(2);
                  this.costData.petrol = (parseFloat(this.costData.petrol) + Number(price)).toFixed(2);
                  if (zoneDetails[d] != null) {
                    let daydetail = zoneDetails[d];
                    let dayArray = daydetail.split("<br/>");
                    let total = (parseFloat(dayArray[0]) + Number(price) + parseFloat(dayArray[2])).toFixed(2);
                    zoneDetails[d] = " " + parseFloat(dayArray[0]).toFixed(2) + "<br/> " + Number(price).toFixed(2) + "<br/>" + parseFloat(dayArray[2]).toFixed(2) + "<br/>" + total + "";
                  }
                  if (this.toDayDate != monthDate) {
                    this.db.object('WasteCollectionInfo/' + wardNo + '/' + this.selectedYear + '/' + monthName + '/' + monthDate + '/Summary').update({
                      "petrolCost": price
                    });
                  }
                  this.getSum(d, price, "P");
                }
              }
              distanceDetails.unsubscribe();
            });
        }
        workDetails.unsubscribe();
      });
  }


  clearAll() {
    this.zoneList = [];
    this.wardDataList = [];
    this.costData.totalCost = "0.00";
    this.costData.salary = "0.00";
    this.costData.petrol = "0.00";
    this.costData.penalty = "0.00";
    this.costData.day1 = "0.00";
    this.costData.day2 = "0.00";
    this.costData.day3 = "0.00";
    this.costData.day4 = "0.00";
    this.costData.day5 = "0.00";
    this.costData.day6 = "0.00";
    this.costData.day7 = "0.00";
    this.costData.day8 = "0.00";
    this.costData.day9 = "0.00";
    this.costData.day10 = "0.00";
    this.costData.day11 = "0.00";
    this.costData.day12 = "0.00";
    this.costData.day13 = "0.00";
    this.costData.day14 = "0.00";
    this.costData.day15 = "0.00";
    this.costData.day16 = "0.00";
    this.costData.day17 = "0.00";
    this.costData.day18 = "0.00";
    this.costData.day19 = "0.00";
    this.costData.day20 = "0.00";
    this.costData.day21 = "0.00";
    this.costData.day22 = "0.00";
    this.costData.day23 = "0.00";
    this.costData.day24 = "0.00";
    this.costData.day25 = "0.00";
    this.costData.day26 = "0.00";
    this.costData.day27 = "0.00";
    this.costData.day28 = "0.00";
    this.costData.day29 = "0.00";
    this.costData.day30 = "0.00";
    this.costData.day31 = "0.00";


    this.costData.salary1 = "0.00";
    this.costData.salary2 = "0.00";
    this.costData.salary3 = "0.00";
    this.costData.salary4 = "0.00";
    this.costData.salary5 = "0.00";
    this.costData.salary6 = "0.00";
    this.costData.salary7 = "0.00";
    this.costData.salary8 = "0.00";
    this.costData.salary9 = "0.00";
    this.costData.salary10 = "0.00";
    this.costData.salary11 = "0.00";
    this.costData.salary12 = "0.00";
    this.costData.salary13 = "0.00";
    this.costData.salary14 = "0.00";
    this.costData.salary15 = "0.00";
    this.costData.salary16 = "0.00";
    this.costData.salary17 = "0.00";
    this.costData.salary18 = "0.00";
    this.costData.salary19 = "0.00";
    this.costData.salary20 = "0.00";
    this.costData.salary21 = "0.00";
    this.costData.salary22 = "0.00";
    this.costData.salary23 = "0.00";
    this.costData.salary24 = "0.00";
    this.costData.salary25 = "0.00";
    this.costData.salary26 = "0.00";
    this.costData.salary27 = "0.00";
    this.costData.salary28 = "0.00";
    this.costData.salary29 = "0.00";
    this.costData.salary30 = "0.00";
    this.costData.salary31 = "0.00";


    this.costData.petrol1 = "0.00";
    this.costData.petrol2 = "0.00";
    this.costData.petrol3 = "0.00";
    this.costData.petrol4 = "0.00";
    this.costData.petrol5 = "0.00";
    this.costData.petrol6 = "0.00";
    this.costData.petrol7 = "0.00";
    this.costData.petrol8 = "0.00";
    this.costData.petrol9 = "0.00";
    this.costData.petrol10 = "0.00";
    this.costData.petrol11 = "0.00";
    this.costData.petrol12 = "0.00";
    this.costData.petrol13 = "0.00";
    this.costData.petrol14 = "0.00";
    this.costData.petrol15 = "0.00";
    this.costData.petrol16 = "0.00";
    this.costData.petrol17 = "0.00";
    this.costData.petrol18 = "0.00";
    this.costData.petrol19 = "0.00";
    this.costData.petrol20 = "0.00";
    this.costData.petrol21 = "0.00";
    this.costData.petrol22 = "0.00";
    this.costData.petrol23 = "0.00";
    this.costData.petrol24 = "0.00";
    this.costData.petrol25 = "0.00";
    this.costData.petrol26 = "0.00";
    this.costData.petrol27 = "0.00";
    this.costData.petrol28 = "0.00";
    this.costData.petrol29 = "0.00";
    this.costData.petrol30 = "0.00";
    this.costData.petrol31 = "0.00";


    this.costData.penalty1 = "0.00";
    this.costData.penalty2 = "0.00";
    this.costData.penalty3 = "0.00";
    this.costData.penalty4 = "0.00";
    this.costData.penalty5 = "0.00";
    this.costData.penalty6 = "0.00";
    this.costData.penalty7 = "0.00";
    this.costData.penalty8 = "0.00";
    this.costData.penalty9 = "0.00";
    this.costData.penalty10 = "0.00";
    this.costData.penalty11 = "0.00";
    this.costData.penalty12 = "0.00";
    this.costData.penalty13 = "0.00";
    this.costData.penalty14 = "0.00";
    this.costData.penalty15 = "0.00";
    this.costData.penalty16 = "0.00";
    this.costData.penalty17 = "0.00";
    this.costData.penalty18 = "0.00";
    this.costData.penalty19 = "0.00";
    this.costData.penalty20 = "0.00";
    this.costData.penalty21 = "0.00";
    this.costData.penalty22 = "0.00";
    this.costData.penalty23 = "0.00";
    this.costData.penalty24 = "0.00";
    this.costData.penalty25 = "0.00";
    this.costData.penalty26 = "0.00";
    this.costData.penalty27 = "0.00";
    this.costData.penalty28 = "0.00";
    this.costData.penalty29 = "0.00";
    this.costData.penalty30 = "0.00";
    this.costData.penalty31 = "0.00";
  }

  getSum(day: any, cost: any, type: any) {
    if (day == "day1") {
      this.costData.day1 = (parseFloat(this.costData.day1) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary1 = (parseFloat(this.costData.salary1) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol1 = (parseFloat(this.costData.petrol1) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty1 = (parseFloat(this.costData.penalty1) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day2") {
      this.costData.day2 = (parseFloat(this.costData.day2) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary2 = (parseFloat(this.costData.salary2) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol2 = (parseFloat(this.costData.petrol2) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty2 = (parseFloat(this.costData.penalty2) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day3") {
      this.costData.day3 = (parseFloat(this.costData.day3) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary3 = (parseFloat(this.costData.salary3) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol3 = (parseFloat(this.costData.petrol3) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty3 = (parseFloat(this.costData.penalty3) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day4") {
      this.costData.day4 = (parseFloat(this.costData.day4) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary4 = (parseFloat(this.costData.salary4) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol4 = (parseFloat(this.costData.petrol4) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty4 = (parseFloat(this.costData.penalty4) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day5") {
      this.costData.day5 = (parseFloat(this.costData.day5) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary5 = (parseFloat(this.costData.salary5) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol5 = (parseFloat(this.costData.petrol5) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty5 = (parseFloat(this.costData.penalty5) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day6") {
      this.costData.day6 = (parseFloat(this.costData.day6) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary6 = (parseFloat(this.costData.salary6) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol6 = (parseFloat(this.costData.petrol6) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty6 = (parseFloat(this.costData.penalty6) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day7") {
      this.costData.day7 = (parseFloat(this.costData.day7) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary7 = (parseFloat(this.costData.salary7) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol7 = (parseFloat(this.costData.petrol7) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty7 = (parseFloat(this.costData.penalty7) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day8") {
      this.costData.day8 = (parseFloat(this.costData.day8) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary8 = (parseFloat(this.costData.salary8) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol8 = (parseFloat(this.costData.petrol8) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty8 = (parseFloat(this.costData.penalty8) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day9") {
      this.costData.day9 = (parseFloat(this.costData.day9) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary9 = (parseFloat(this.costData.salary9) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol9 = (parseFloat(this.costData.petrol9) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty9 = (parseFloat(this.costData.penalty9) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day10") {
      this.costData.day10 = (parseFloat(this.costData.day10) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary10 = (parseFloat(this.costData.salary10) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol10 = (parseFloat(this.costData.petrol10) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty10 = (parseFloat(this.costData.penalty10) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day11") {
      this.costData.day11 = (parseFloat(this.costData.day11) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary11 = (parseFloat(this.costData.salary11) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol11 = (parseFloat(this.costData.petrol11) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty11 = (parseFloat(this.costData.penalty11) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day12") {
      this.costData.day12 = (parseFloat(this.costData.day12) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary12 = (parseFloat(this.costData.salary12) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol12 = (parseFloat(this.costData.petrol12) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty12 = (parseFloat(this.costData.penalty12) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day13") {
      this.costData.day13 = (parseFloat(this.costData.day13) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary13 = (parseFloat(this.costData.salary13) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol13 = (parseFloat(this.costData.petrol13) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty13 = (parseFloat(this.costData.penalty13) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day14") {
      this.costData.day14 = (parseFloat(this.costData.day14) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary14 = (parseFloat(this.costData.salary14) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol14 = (parseFloat(this.costData.petrol14) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty14 = (parseFloat(this.costData.penalty14) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day15") {
      this.costData.day15 = (parseFloat(this.costData.day15) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary15 = (parseFloat(this.costData.salary15) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol15 = (parseFloat(this.costData.petrol15) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty15 = (parseFloat(this.costData.penalty15) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day16") {
      this.costData.day16 = (parseFloat(this.costData.day16) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary16 = (parseFloat(this.costData.salary16) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol16 = (parseFloat(this.costData.petrol16) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty16 = (parseFloat(this.costData.penalty16) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day17") {
      this.costData.day17 = (parseFloat(this.costData.day17) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary17 = (parseFloat(this.costData.salary17) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol17 = (parseFloat(this.costData.petrol17) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty17 = (parseFloat(this.costData.penalty17) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day18") {
      this.costData.day18 = (parseFloat(this.costData.day18) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary18 = (parseFloat(this.costData.salary18) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol18 = (parseFloat(this.costData.petrol18) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty18 = (parseFloat(this.costData.penalty18) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day19") {
      this.costData.day19 = (parseFloat(this.costData.day19) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary19 = (parseFloat(this.costData.salary19) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol19 = (parseFloat(this.costData.petrol19) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty19 = (parseFloat(this.costData.penalty19) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day20") {
      this.costData.day20 = (parseFloat(this.costData.day20) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary20 = (parseFloat(this.costData.salary20) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol20 = (parseFloat(this.costData.petrol20) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty20 = (parseFloat(this.costData.penalty20) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day21") {
      this.costData.day21 = (parseFloat(this.costData.day21) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary21 = (parseFloat(this.costData.salary21) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol21 = (parseFloat(this.costData.petrol21) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty21 = (parseFloat(this.costData.penalty21) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day22") {
      this.costData.day22 = (parseFloat(this.costData.day22) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary22 = (parseFloat(this.costData.salary22) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol22 = (parseFloat(this.costData.petrol22) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty22 = (parseFloat(this.costData.penalty22) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day23") {
      this.costData.day23 = (parseFloat(this.costData.day23) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary23 = (parseFloat(this.costData.salary23) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol23 = (parseFloat(this.costData.petrol23) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty23 = (parseFloat(this.costData.penalty23) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day24") {
      this.costData.day24 = (parseFloat(this.costData.day24) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary24 = (parseFloat(this.costData.salary24) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol24 = (parseFloat(this.costData.petrol24) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty24 = (parseFloat(this.costData.penalty24) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day25") {
      this.costData.day25 = (parseFloat(this.costData.day25) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary25 = (parseFloat(this.costData.salary25) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol25 = (parseFloat(this.costData.petrol25) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty25 = (parseFloat(this.costData.penalty25) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day26") {
      this.costData.day26 = (parseFloat(this.costData.day26) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary26 = (parseFloat(this.costData.salary26) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol26 = (parseFloat(this.costData.petrol26) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty26 = (parseFloat(this.costData.penalty26) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day27") {
      this.costData.day27 = (parseFloat(this.costData.day27) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary27 = (parseFloat(this.costData.salary27) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol27 = (parseFloat(this.costData.petrol27) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty27 = (parseFloat(this.costData.penalty27) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day28") {
      this.costData.day28 = (parseFloat(this.costData.day28) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary28 = (parseFloat(this.costData.salary28) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol28 = (parseFloat(this.costData.petrol28) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty28 = (parseFloat(this.costData.penalty28) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day29") {
      this.costData.day29 = (parseFloat(this.costData.day29) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary29 = (parseFloat(this.costData.salary29) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol29 = (parseFloat(this.costData.petrol29) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty29 = (parseFloat(this.costData.penalty29) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day30") {
      this.costData.day30 = (parseFloat(this.costData.day30) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary30 = (parseFloat(this.costData.salary30) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol30 = (parseFloat(this.costData.petrol30) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty30 = (parseFloat(this.costData.penalty30) + parseFloat(cost)).toFixed(2);
      }
    }
    if (day == "day31") {
      this.costData.day31 = (parseFloat(this.costData.day31) + parseFloat(cost)).toFixed(2);
      if (type == "S") {
        this.costData.salary31 = (parseFloat(this.costData.salary31) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "P") {
        this.costData.petrol31 = (parseFloat(this.costData.petrol31) + parseFloat(cost)).toFixed(2);
      }
      else if (type == "F") {
        this.costData.penalty31 = (parseFloat(this.costData.penalty31) + parseFloat(cost)).toFixed(2);
      }
    }
  }
}

export class costDatail {
  totalCost: string;
  salary: string;
  petrol: string;
  penalty: string;
  day1: string;
  day2: string;
  day3: string;
  day4: string;
  day5: string;
  day6: string;
  day7: string;
  day8: string;
  day9: string;
  day10: string;
  day11: string;
  day12: string;
  day13: string;
  day14: string;
  day15: string;
  day16: string;
  day17: string;
  day18: string;
  day19: string;
  day20: string;
  day21: string;
  day22: string;
  day23: string;
  day24: string;
  day25: string;
  day26: string;
  day27: string;
  day28: string;
  day29: string;
  day30: string;
  day31: string;


  salary1: string;
  salary2: string;
  salary3: string;
  salary4: string;
  salary5: string;
  salary6: string;
  salary7: string;
  salary8: string;
  salary9: string;
  salary10: string;
  salary11: string;
  salary12: string;
  salary13: string;
  salary14: string;
  salary15: string;
  salary16: string;
  salary17: string;
  salary18: string;
  salary19: string;
  salary20: string;
  salary21: string;
  salary22: string;
  salary23: string;
  salary24: string;
  salary25: string;
  salary26: string;
  salary27: string;
  salary28: string;
  salary29: string;
  salary30: string;
  salary31: string;


  petrol1: string;
  petrol2: string;
  petrol3: string;
  petrol4: string;
  petrol5: string;
  petrol6: string;
  petrol7: string;
  petrol8: string;
  petrol9: string;
  petrol10: string;
  petrol11: string;
  petrol12: string;
  petrol13: string;
  petrol14: string;
  petrol15: string;
  petrol16: string;
  petrol17: string;
  petrol18: string;
  petrol19: string;
  petrol20: string;
  petrol21: string;
  petrol22: string;
  petrol23: string;
  petrol24: string;
  petrol25: string;
  petrol26: string;
  petrol27: string;
  petrol28: string;
  petrol29: string;
  petrol30: string;
  petrol31: string;


  penalty1: string;
  penalty2: string;
  penalty3: string;
  penalty4: string;
  penalty5: string;
  penalty6: string;
  penalty7: string;
  penalty8: string;
  penalty9: string;
  penalty10: string;
  penalty11: string;
  penalty12: string;
  penalty13: string;
  penalty14: string;
  penalty15: string;
  penalty16: string;
  penalty17: string;
  penalty18: string;
  penalty19: string;
  penalty20: string;
  penalty21: string;
  penalty22: string;
  penalty23: string;
  penalty24: string;
  penalty25: string;
  penalty26: string;
  penalty27: string;
  penalty28: string;
  penalty29: string;
  penalty30: string;
  penalty31: string;
}
