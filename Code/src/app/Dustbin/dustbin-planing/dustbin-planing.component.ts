import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-dustbin-planing',
  templateUrl: './dustbin-planing.component.html',
  styleUrls: ['./dustbin-planing.component.scss']
})
export class DustbinPlaningComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal, public httpService: HttpClient) { }
  db: any;
  selectedZone: any;
  cityName: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  todayDate: any;
  firebaseStoragePath: any;

  yearList: any[] = [];
  zoneList: any[] = [];
  dustbinStorageList: any[] = [];
  dustbinList: any[] = [];
  planList: any;
  dustbinJsonList: any[] = [];

  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.firebaseStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.getYear();
    this.getZoneList();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.todayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedMonth = this.todayDate.split('-')[1];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.selectedYear = this.todayDate.split('-')[0];
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
  }

  getZoneList() {
    this.zoneList = [];
    this.dustbinStorageList = [];
    this.dustbinStorageList = JSON.parse(localStorage.getItem("dustbin"));
    if (this.dustbinStorageList != null) {
      let list = this.dustbinStorageList.map(item => item.zone).filter((value, index, self) => self.indexOf(value) === index);
      for (let i = 0; i < list.length; i++) {
        this.zoneList.push({ zoneNo: list[i], zone: "Zone " + list[i] });
      }
      this.zoneList = this.commonService.transformNumeric(this.zoneList, 'zone');
      this.selectedZone = this.zoneList[0]["zoneNo"];
      this.getDustbins();
    }
  }

  getDustbins() {
    this.dustbinList = [];
    let list = [];
    if (this.dustbinStorageList.length > 0) {
      if (this.selectedZone == "0") {
        list = this.dustbinStorageList;
      }
      else {
        list = this.dustbinStorageList.filter(item => item.zone == this.selectedZone);
      }
      for (let i = 0; i < list.length; i++) {
        let isBroken = "";
        if (list[i]["isBroken"] == true) {
          isBroken = "डस्टबिन टूटा हुआ है";
        }
        if (list[i]["isDisabled"] == "yes") {
          if (isBroken != "") { isBroken = isBroken + ", " }
          isBroken = isBroken + "Dustbin Disabled";
        }
        if (isBroken != "") { isBroken = "(" + isBroken + ")"; }
        this.dustbinList.push({ zoneNo: list[i]["zone"], dustbin: list[i]["dustbin"], address: list[i]["address"], pickFrequency: list[i]["pickFrequency"], isBroken: isBroken, isDisabled: list[i]["isDisabled"] });
      }
      if (this.dustbinList.length > 0) {
        $(this.divLoader).show();
        this.getDustbinHistoryJson();
        this.getDustbinPickingPlanHistory();
        this.getDustbinPickingPlans();
        setTimeout(() => {
           this.saveDustbinReportJSON();
          $(this.divLoader).hide();
        }, 12000);
      }
    }
  }

  saveDustbinReportJSON() {
    let filePath = "/DustbinData/" + this.selectedYear + "/" + this.selectedMonthName + "/";
    let fileName = this.selectedZone + ".json";
    this.commonService.saveJsonFile(this.dustbinList, fileName, filePath);
  }

  getDustbinHistoryJson() {
    this.dustbinJsonList = [];
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDustbinData%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedZone + ".json?alt=media";
    let dutbinJSONInstance = this.httpService.get(path).subscribe(planJsonData => {
      dutbinJSONInstance.unsubscribe();
      if (planJsonData != null) {
        this.dustbinJsonList = JSON.parse(JSON.stringify(planJsonData));
      }
    });
  }

  getDustbinPickingPlanHistory() {
    let dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.selectedYear + "/" + this.selectedMonthName;
    let dustbinPlanHistoryInstance = this.db.object(dbPath).valueChanges().subscribe(
      planHistoryData => {
        dustbinPlanHistoryInstance.unsubscribe();
        if (planHistoryData != null) {
          this.getDustbinePlanedStatus(planHistoryData);
        }
      }
    );
  }

  getDustbinPickingPlans() {
    let dbPath = "DustbinData/DustbinPickingPlans";
    let dustbinPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
      planData => {
        dustbinPlanInstance.unsubscribe();
        if (planData != null) {
          this.getDustbinePlanedStatus(planData);
        }
      }
    );
  }

  getDustbinePlanedStatus(planData: any) {
    let dateKeyArray = Object.keys(planData);
    if (dateKeyArray.length > 0) {
      for (let indexDate = 0; indexDate < dateKeyArray.length; indexDate++) {
        let planDate = dateKeyArray[indexDate];
        let day = "day" + Number(planDate.split('-')[2]);
        let planObject = planData[planDate];
        let planKeyArray = Object.keys(planObject);
        if (planKeyArray.length > 0) {
          for (let indexPlan = 0; indexPlan < planKeyArray.length; indexPlan++) {
            let planName = planKeyArray[indexPlan];
            if (planObject[planName]["isAssigned"] != "false") {
              if (planObject[planName]["bins"] != "") {
                let assignedBinList = planObject[planName]["bins"].split(',');
                let pickedBinList = planObject[planName]["pickedDustbin"].split(',');
                this.setDustbinPickStatus(day, assignedBinList, pickedBinList, planDate, planName);
              }
            }
          }
        }
      }
    }
  }

  setDustbinPickStatus(day: any, assignedBinList: any, pickedBinList: any, planDate: any, planName: any) {
    if (assignedBinList.length > 0) {
      for (let indexBin = 0; indexBin < assignedBinList.length; indexBin++) {
        let dustbin = assignedBinList[indexBin].trim();
        let binDetail = this.dustbinList.find(item => item.dustbin == dustbin);
        if (binDetail != undefined) {
          if (binDetail[day] == undefined) {
            binDetail[day] = [];
          }
          let isPicked = false;
          for (let i = 0; i < pickedBinList.length; i++) {
            if (pickedBinList[i].trim() == dustbin) {
              isPicked = true;
              i = pickedBinList.length;
            }
          }
          if (isPicked == false) {
            binDetail[day].push({ status: this.getIcon("assignedNotPicked") + " Assigned but not Picked", planDate: planDate, planName: planName, isPicked: false });
          }
          else {
            this.checkDustbinFromDustbinJsonList(day, binDetail, dustbin, planDate, planName);
          }
        }
      }
    }
  }

  checkDustbinFromDustbinJsonList(day: any, binDetail: any, dustbin: any, planDate: any, planName: any) {
    if (this.dustbinJsonList.length > 0) {
      let jsonBinDetail = this.dustbinJsonList.find(item => item.dustbin == dustbin);
      if (jsonBinDetail != undefined) {
        if (jsonBinDetail[day] != null) {
          let binPlanDetail = jsonBinDetail[day].find(item => item.planDate == planDate && item.planName == planName);
          if (binPlanDetail != undefined) {
            this.getDustbinPickedAnalysisDetail(binDetail, binPlanDetail, day, dustbin, planDate, planName);
          }
        }
        else {
          this.getDustbinPickedDetail(binDetail, day, dustbin, planDate, planName);
        }
      }
      else {
        this.getDustbinPickedDetail(binDetail, day, dustbin, planDate, planName);
      }
    }
    else {
      this.getDustbinPickedDetail(binDetail, day, dustbin, planDate, planName);
    }
  }

  getDustbinPickedAnalysisDetail(binDetail: any, binPlanDetail: any, day: any, dustbin: any, planDate: any, planName: any) {
    let dbPath = "DustbinData/DustbinPickHistory/" + this.selectedYear + "/" + this.selectedMonthName + "/" + planDate + "/" + dustbin + "/" + planName + "/Analysis";
    let pickedAnalysisDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
      pickAnalysisData => {
        pickedAnalysisDustbinInstance.unsubscribe();
        let icon = this.getIcon("picked");
        let pickTime = binPlanDetail.pickTime;
        let name = binPlanDetail.name;
        if (pickAnalysisData != null) {
          let filledPercentage = "";
          let remark = "";
          if (pickAnalysisData["filledPercentage"] != null) {
            filledPercentage = "<b>(" + pickAnalysisData["filledPercentage"] + "%)</b>";
          }
          if (pickAnalysisData["remark"] != null) {
            remark = pickAnalysisData["remark"];
          }
          let pickStatus = icon + filledPercentage + " at " + pickTime + " by " + name;
          if (remark != "") {
            pickStatus = pickStatus + "<br/>" + remark;
          }
          binDetail[day].push({ status: pickStatus, filledPercentage: filledPercentage, planDate: planDate, planName: planName, isPicked: true });
        }
        else {
          let pickStatus = icon + " at " + pickTime + " by " + name;
          binDetail[day].push({ status: pickStatus, planDate: planDate, planName: planName, isPicked: true, pickTime: pickTime, name: name });
        }
      }
    );
  }

  getDustbinPickedDetail(binDetail: any, day: any, dustbin: any, planDate: any, planName: any) {
    let dbPath = "DustbinData/DustbinPickHistory/" + this.selectedYear + "/" + this.selectedMonthName + "/" + planDate + "/" + dustbin + "/" + planName;
    let pickedDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
      pickData => {
        pickedDustbinInstance.unsubscribe();
        if (pickData == null) {
          binDetail[day].push({ status: this.getIcon("assignedNotPicked") + " Assigned but not Picked", planDate: planDate, planName: planName, isPicked: false });
        }
        else {
          if (pickData["endTime"] == null) {
            binDetail[day].push({ status: this.getIcon("assignedNotPicked") + " Assigned but not Picked", planDate: planDate, planName: planName, isPicked: false });
          }
          else {
            this.setDustbinPickedDetail(pickData, binDetail, day, planDate, planName);
          }
        }
      }
    );
  }

  setDustbinPickedDetail(pickData: any, binDetail: any, day: any, planDate: any, planName: any) {
    let icon = this.getIcon("picked");
    let empId = pickData["pickedBy"];
    if (pickData["remarks"] == "डस्टबिन लोकेशन पर नहीं है") {
      icon = this.getIcon("dustbinNotFound");
    }
    else if (pickData["remarks"] == "डस्टबिन खाली है") {
      icon = this.getIcon("dustbinNotFilled");
    }
    let pickTime = "";
    if (pickData["endTime"] != null) {
      pickTime = pickData["endTime"].split(' ')[1].toString().substring(0, 5);
    }
    let filledPercentage = "";
    let remark = "";
    if (pickData["Analysis"] != null) {
      if (pickData["Analysis"]["filledPercentage"] != null) {
        filledPercentage = "<b>(" + pickData["Analysis"]["filledPercentage"] + "%)</b>";
      }
      if (pickData["Analysis"]["remark"] != null) {
        remark = pickData["Analysis"]["remark"];
      }
    }
    let pickStatus = icon + filledPercentage + " at " + pickTime + "";
    this.getEmployeeDetail(empId, binDetail, day, pickStatus, remark, filledPercentage, planDate, planName, pickTime);
  }

  getEmployeeDetail(empId: any, binDetail: any, day: any, pickStatus: any, remark: any, filledPercentage: any, planDate: any, planName: any, pickTime: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      let name = employee["name"];
      pickStatus = pickStatus + " by " + name;
      if (remark != "") {
        pickStatus = pickStatus + "<br/>" + remark;
      }
      binDetail[day].push({ status: pickStatus, filledPercentage: filledPercentage, planDate: planDate, planName: planName, isPicked: true, pickTime: pickTime, remark: remark, name: name });
    });
  }

  getIcon(type: any) {
    let icon = "";
    if (type == "picked") {
      icon = "<img src='../../assets/img/Green-Circle-dustbin.png' height='20px'>";
    }
    else if (type == "dustbinNotFound") {
      icon = "<img src='../../assets/img/dustbin-circular-red.png' height='20px'>";
    }
    else if (type == "assignedNotPicked") {
      icon = "<img src='../../assets/img/blue without tick rectangle.png' height='20px'>";
    }
    else if (type == "dustbinNotFilled") {
      icon = "<img src='../../assets/img/Green-Circle-dustbin.png' height='20px'>";
    }
    else if (type == "planDustbin") {
      icon = "../../assets/img/blue-rectange-dustbin.svg";
    }
    else if (type == "selectedDustbin") {
      icon = "../../assets/img/blue-rectange-dustbin.svg";
    }
    else if (type == "pickedDustbin") {
      icon = "../../assets/img/green-rectange-dustbin.svg";
    }
    return icon;
  }

  changeSelection() {
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.selectedZone = $(this.ddlZone).val();
    if (this.selectedZone != "0") {
      this.getDustbins();
    }
  }

  openModel(content: any, type: any, plan: any, dustbin: any, day: any) {

  }

  closeModel() {

  }
}
