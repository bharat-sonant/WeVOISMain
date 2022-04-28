import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { DustbinService } from "../../services/dustbin/dustbin.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-dustbin-planing',
  templateUrl: './dustbin-planing.component.html',
  styleUrls: ['./dustbin-planing.component.scss']
})
export class DustbinPlaningComponent implements OnInit {

  constructor(public fs: FirebaseService, private dustbinService: DustbinService, private commonService: CommonService, private modalService: NgbModal, public httpService: HttpClient) { }
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
  dustbinPlanList: any[] = [];

  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";

  // plan section
  key = "#key";
  perPlanDate = "#perPlanDate";
  txtPlanName = "#txtPlanName";
  txtPlanDate = "#txtPlanDate";
  txtDustbinCapacity = "#txtDustbinCapacity";
  deletePlanId = "#deletePlanId";
  deletePlanDate = "#deletePlanDate";
  dustbinId = "#dustbinId";
  planDate = "#planDate";
  ddlPlan = "#ddlPlan";
  maxCapacity = "#maxCapacity";
  assignedDustbin = "#assignedDustbin";

  bins: any;
  createdAt: any;
  createdBy: any;
  userId: any;
  dustbinPickingPosition: any;
  isAssigned: any;
  isConfirmed: any;
  maxDustbinCapacity: any;
  pickingSequence: any;
  planName: any;
  totalDustbin: any;
  updatedAt: any;
  updatedBy: any;
  zone: any;
  pickedDustbin: any;
  highPriority: any;
  planAddDays = 5;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.userId = localStorage.getItem("userID");
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
    this.getDustbinPickingPlans("plan");
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

  //#region report

  getDustbins() {
    this.dustbinList = [];
    this.dustbinJsonList = [];
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
        this.getDustbinAllPlan();
      }
    }
  }

  getDustbinAllPlan() {
    $(this.divLoader).show();
    this.getDustbinPickingPlanHistory();
    this.getDustbinPickingPlans("Report");
    if (this.selectedZone != "0") {
      this.getDustbinHistoryJson();
      setTimeout(() => {
        this.saveDustbinReportJSON();
        $(this.divLoader).hide();
      }, 12000);
    }
    else {
      setTimeout(() => {
        $(this.divLoader).hide();
      }, 60000);
    }
  }

  saveDustbinReportJSON() {
    let filePath = "/DustbinData/" + this.selectedYear + "/" + this.selectedMonthName + "/";
    let fileName = this.selectedZone + ".json";
    this.commonService.saveJsonFile(this.dustbinList, fileName, filePath);
  }

  getDustbinHistoryJson() {
    this.dustbinJsonList = [];
    this.dustbinService.getDustbinHistoryJson(this.selectedYear, this.selectedMonthName, this.selectedZone).then((planJsonData: any) => {
      if (planJsonData != null) {
        this.dustbinJsonList = JSON.parse(JSON.stringify(planJsonData));
      }
    });
  }

  getDustbinPickingPlanHistory() {
    this.dustbinService.getDustbinPickingPlanHistory(this.selectedYear, this.selectedMonthName).then((planHistoryData: any) => {
      if (planHistoryData != null) {
        this.getDustbinePlanedStatus(planHistoryData);
      }
    });
  }

  getDustbinPickingPlans(type: any) {
    this.planList = [];
    this.dustbinService.getDustbinPickingPlans().then((planData: any) => {
      if (planData != null) {
        if (type == "Report") {
          this.getDustbinePlanedStatus(planData);
        }
        else {
          this.getPlanList(planData);
        }
      }
      else {
        this.removeAssignedPlan();
      }
    });
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
            let planId = planKeyArray[indexPlan];
            if (planObject[planId]["isAssigned"] != "false") {
              if (planObject[planId]["bins"] != "") {
                let assignedBinList = planObject[planId]["bins"].split(',');
                let pickedBinList = planObject[planId]["pickedDustbin"].split(',');
                this.setDustbinPickStatus(day, assignedBinList, pickedBinList, planDate, planId);
              }
            }
          }
        }
      }
    }
  }

  setDustbinPickStatus(day: any, assignedBinList: any, pickedBinList: any, planDate: any, planId: any) {
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
            binDetail[day].push({ status: this.dustbinService.getIcon("assignedNotPicked") + " Assigned but not Picked", planDate: planDate, planName: planId, isPicked: false });
          }
          else {
            this.checkDustbinFromDustbinJsonList(day, binDetail, dustbin, planDate, planId);
          }
        }
      }
    }
  }

  checkDustbinFromDustbinJsonList(day: any, binDetail: any, dustbin: any, planDate: any, planId: any) {
    if (this.dustbinJsonList.length > 0) {
      let jsonBinDetail = this.dustbinJsonList.find(item => item.dustbin == dustbin);
      if (jsonBinDetail != undefined) {
        if (jsonBinDetail[day] != null) {
          let binPlanDetail = jsonBinDetail[day].find(item => item.planDate == planDate && item.planName == planId);
          if (binPlanDetail != undefined) {
            this.getDustbinPickedAnalysisDetail(binDetail, binPlanDetail, day, dustbin, planDate, planId);
          }
        }
        else {
          this.getDustbinPickedDetail(binDetail, day, dustbin, planDate, planId);
        }
      }
      else {
        this.getDustbinPickedDetail(binDetail, day, dustbin, planDate, planId);
      }
    }
    else {
      this.getDustbinPickedDetail(binDetail, day, dustbin, planDate, planId);
    }
  }

  getDustbinPickedAnalysisDetail(binDetail: any, binPlanDetail: any, day: any, dustbin: any, planDate: any, planId: any) {
    this.dustbinService.getDustbinPickedAnalysisDetail(this.selectedYear, this.selectedMonthName, planDate, dustbin, planId).then((pickAnalysisData: any) => {
      let icon = this.dustbinService.getIcon("picked");
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
        binDetail[day].push({ status: pickStatus, filledPercentage: filledPercentage, planDate: planDate, planName: planId, isPicked: true });
      }
      else {
        let pickStatus = icon + " at " + pickTime + " by " + name;
        binDetail[day].push({ status: pickStatus, planDate: planDate, planName: planId, isPicked: true, pickTime: pickTime, name: name });
      }
    });
  }

  getDustbinPickedDetail(binDetail: any, day: any, dustbin: any, planDate: any, planId: any) {
    this.dustbinService.getDustbinPickHistory(this.selectedYear, this.selectedMonthName, planDate, dustbin, planId).then((dustbinPickData: any) => {
      if (dustbinPickData == null) {
        binDetail[day].push({ status: this.dustbinService.getIcon("assignedNotPicked") + " Assigned but not Picked", planDate: planDate, planName: planId, isPicked: false });
      }
      else {
        if (dustbinPickData["endTime"] == null) {
          binDetail[day].push({ status: this.dustbinService.getIcon("assignedNotPicked") + " Assigned but not Picked", planDate: planDate, planName: planId, isPicked: false });
        }
        else {
          this.setDustbinPickedDetail(dustbinPickData, binDetail, day, planDate, planId);
        }
      }     
    });
  }

  setDustbinPickedDetail(pickData: any, binDetail: any, day: any, planDate: any, planId: any) {
    let icon = this.dustbinService.getIcon("picked");
    let empId = pickData["pickedBy"];
    if (pickData["remarks"] == "डस्टबिन लोकेशन पर नहीं है") {
      icon = this.dustbinService.getIcon("dustbinNotFound");
    }
    else if (pickData["remarks"] == "डस्टबिन खाली है") {
      icon = this.dustbinService.getIcon("dustbinNotFilled");
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
    this.getEmployeeDetail(empId, binDetail, day, pickStatus, remark, filledPercentage, planDate, planId, pickTime);
  }

  getEmployeeDetail(empId: any, binDetail: any, day: any, pickStatus: any, remark: any, filledPercentage: any, planDate: any, planId: any, pickTime: any) {
    binDetail[day].push({ status: pickStatus, filledPercentage: filledPercentage, planDate: planDate, planName: planId, isPicked: true, pickTime: pickTime, remark: remark, name: "Harendra" });
    /*
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      let name = employee["name"];
      pickStatus = pickStatus + " by " + name;
      if (remark != "") {
        pickStatus = pickStatus + "<br/>" + remark;
      }
      binDetail[day].push({ status: pickStatus, filledPercentage: filledPercentage, planDate: planDate, planName: planId, isPicked: true, pickTime: pickTime, remark: remark, name: name });
    });
    */
  }

  changeSelection() {
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.selectedZone = $(this.ddlZone).val();
    this.getDustbins();
  }

  //#endregion

  //#region Plans

  getPlanList(planData: any) {
    this.planList = [];
    let keyArray = Object.keys(planData);
    if (keyArray.length > 0) {
      for (let i = 0; i < keyArray.length; i++) {
        let date = keyArray[i];
        let planObject = planData[date];
        let planArray = Object.keys(planObject);
        for (let j = 0; j < planArray.length; j++) {
          let dustbinAssigned = 0;
          let bins = "";
          let dustbinPicked = 0;
          let highPriority = "";
          if (planObject[planArray[j]]["bins"] != undefined) {
            bins = planObject[planArray[j]]["bins"];
            if (bins != "") {
              dustbinAssigned = bins.toString().split(',').length;
            }
            if (planObject[planArray[j]]["pickedDustbin"] != undefined) {
              if (planObject[planArray[j]]["pickedDustbin"] != "") {
                dustbinPicked = planObject[planArray[j]]["pickedDustbin"].toString().split(',').length;
              }
            }
            if (planObject[planArray[j]]["highPriority"] != null) {
              highPriority = planObject[planArray[j]]["highPriority"];
            }
          }
          this.planList.push({ date: date, key: planArray[j], planName: planObject[planArray[j]]["planName"], maxDustbin: planObject[planArray[j]]["maxDustbinCapacity"], dustbinAssigned: dustbinAssigned, isAssigned: planObject[planArray[j]]["isAssigned"], bins: bins, zone: planObject[planArray[j]]["zone"], pickedDustbin: planObject[planArray[j]]["pickedDustbin"], dustbinPicked: dustbinPicked, sequence: planObject[planArray[j]]["pickingSequence"], highPriority: highPriority, dustbinPickingPosition: planObject[planArray[j]]["dustbinPickingPosition"] });

        }
      }
      this.removeAssignedPlan();
    }
  }

  clearPlan() {
    $(this.key).val("0");
    $(this.perPlanDate).val("");
    $(this.txtPlanName).val("");
    $(this.txtPlanDate).val(this.commonService.setTodayDate());
    $(this.txtDustbinCapacity).val("");
    this.bins = "";
    this.createdAt = this.commonService.getTodayDateTime();
    this.createdBy = this.userId;
    this.dustbinPickingPosition = "0";
    this.isAssigned = "false";
    this.isConfirmed = "false";
    this.maxDustbinCapacity = 0;
    this.pickingSequence = "";
    this.planName = "";
    this.totalDustbin = 0;
    this.updatedAt = "";
    this.updatedBy = "";
    this.zone = "";
    this.pickedDustbin = "";
    this.highPriority = "";
  }

  addUpdatePlan() {
    let $Key = $(this.key).val();
    let perPlanDate = $(this.perPlanDate).val();
    let planName = $(this.txtPlanName).val();
    let planDate = $(this.txtPlanDate).val();
    let maxDustbinCapacity = $(this.txtDustbinCapacity).val();

    if (planName == "") {
      this.commonService.setAlertMessage("error", "Please fill plan name !!!");
      return;
    }
    if (planDate == "") {
      this.commonService.setAlertMessage("error", "Please fill plan date !!!");
      return;
    }
    if (maxDustbinCapacity == "") {
      this.commonService.setAlertMessage("error", "Please fill max. dustbin capacity !!!");
      return;
    }
    if (new Date(planDate.toString()) < new Date(this.todayDate)) {
      if (perPlanDate != "") {
        $(this.txtPlanDate).val(perPlanDate);
      }
      this.commonService.setAlertMessage("error", "plan date can not be less than today date !!!");
      return;
    }
    let dbPath = "DustbinData/DustbinPickingPlans/" + planDate;
    const plan = {
      $Key: $Key,
      bins: this.bins,
      createdAt: this.createdAt,
      createdBy: this.userId,
      dustbinPickingPosition: this.dustbinPickingPosition,
      isAssigned: this.isAssigned,
      pickingSequence: this.pickingSequence,
      planName: planName.toString(),
      totalDustbin: this.totalDustbin,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
      zone: this.zone,
      maxDustbinCapacity: Number(maxDustbinCapacity),
      isConfirmed: this.isConfirmed,
      pickedDustbin: this.pickedDustbin,
      highPriority: this.highPriority
    };
    if ($Key == "0") {
      this.addPlan(plan, dbPath, "Plan added successfully !!!");
    }
    else {
      let planDetails = this.planList.find(item => item.key == $Key);
      if (planDetails != undefined) {
        if (Number(maxDustbinCapacity) < Number(planDetails.dustbinAssigned)) {
          this.commonService.setAlertMessage("error", "Max dustbin capacity can not be less than " + planDetails.dustbinAssigned + " !!!");
          $('#txtDustbinCapacity').val(planDetails.maxDustbin);
          return;
        }
        if (perPlanDate == planDate) {
          this.dustbinService.UpdatePlan(plan, dbPath);
          this.commonService.setAlertMessage("success", "Plan updated successfully !!!");
        }
        else {
          if (planDetails.isAssigned == "true") {
            this.commonService.setAlertMessage("error", "Plan already assigned !!!");
            return;
          }
          this.dustbinService.deletePlan(planDetails.date, planDetails.key);
          this.addPlan(plan, dbPath, "Plan updated successfully !!!");
        }
        this.closeModel();
        this.getDustbinPickingPlans("Plan");
      }
    }
  }

  addPlan(plan: any, dbPath: any, message: any) {
    this.dustbinService.addPlan(plan, dbPath);
    this.commonService.setAlertMessage("success", message);
    this.clearPlan();
    this.getDustbinPickingPlans("Plan");
  }

  updatePlan(plan: any) {
    this.dustbinService.getDustbinPlanDetail(plan.date, plan.key).then((planDetailData: any) => {
      if (planDetailData != null) {
        $(this.key).val(plan.key);
        $(this.perPlanDate).val(plan.date);
        $(this.txtPlanName).val(planDetailData["planName"]);
        $(this.txtPlanDate).val(plan.date);
        $(this.txtDustbinCapacity).val(planDetailData["maxDustbinCapacity"]);
        let elementPlanName = <HTMLInputElement>document.getElementById('txtPlanName');
        let elementDate = <HTMLInputElement>document.getElementById('txtPlanDate');
        if (planDetailData["isAssigned"] == "true") {
          elementPlanName.readOnly = true;
          elementDate.readOnly = true;
        }
        else {
          elementPlanName.readOnly = false;
          elementDate.readOnly = false;
        }
        this.bins = planDetailData["bins"];
        this.createdAt = planDetailData["createdAt"];
        this.createdBy = planDetailData["createdBy"];
        this.dustbinPickingPosition = planDetailData["dustbinPickingPosition"];
        this.isAssigned = planDetailData["isAssigned"];
        this.isConfirmed = planDetailData["isConfirmed"];
        this.maxDustbinCapacity = planDetailData["maxDustbinCapacity"];
        this.pickingSequence = planDetailData["pickingSequence"];
        this.planName = planDetailData["planName"];
        this.totalDustbin = planDetailData["totalDustbin"];
        this.updatedAt = this.commonService.getTodayDateTime();
        this.updatedBy = this.userId;
        this.zone = planDetailData["zone"];
        this.pickedDustbin = planDetailData["pickedDustbin"];
        if (planDetailData["highPriority"] != null) {
          this.highPriority = planDetailData["highPriority"];
        }
        else {
          this.highPriority = "";
        }
      }
    });
  }

  deleteConfirmPlan() {
    this.dustbinService.deletePlan($(this.deletePlanDate).val(), $(this.deletePlanId).val());
    this.getDustbinPickingPlans("Plan");
    this.commonService.setAlertMessage("success", "Plan deleted successfully !!!");
    this.closeModel();
  }

  removeAssignedPlan() {
    for (let i = 0; i < this.dustbinList.length; i++) {
      for (let j = 1; j <= 31; j++) {
        let day = "day" + j;
        let labelId = 'lbl-' + this.dustbinList[i]["dustbin"] + '-' + day;
        let spanId = 'sp-' + this.dustbinList[i]["dustbin"] + '-' + day;
        $('#' + labelId).html("");
        $('#' + spanId).hide();
      }
    }
    this.getAssignedPlanDustbin();
    this.getDustbinPlanAdd();
  }

  getAssignedPlanDustbin() {
    if (this.dustbinList.length > 0) {
      if (this.planList.length > 0) {
        for (let i = 0; i < this.planList.length; i++) {
          let date = this.planList[i]["date"];
          let bins = this.planList[i]["bins"];
          if (bins != "") {
            let binArray = bins.toString().replaceAll(" ", "").split(',');
            if (binArray.length > 0) {
              for (let j = 0; j < binArray.length; j++) {
                let dustbinDetails = this.dustbinList.find(item => item.dustbin == binArray[j]);
                if (dustbinDetails != undefined) {
                  this.setAssignedPlan(binArray[j], date, this.planList[i]["planName"]);
                }
              }
            }
          }
        }
      }
    }
  }

  getDustbinPlanAdd() {
    let currentDate = this.todayDate;
    for (let i = 0; i < this.planAddDays; i++) {
      let planDate = this.commonService.getNextDate(currentDate, i);
      if (this.selectedYear == planDate.split('-')[0] && this.selectedMonth == planDate.split('-')[1]) {
        this.getDustbinPlans(planDate);
      }
    }
  }

  getDustbinPlans(date: any) {
    let d = "day" + parseFloat(date.split("-")[2]);
    let planDetails = this.planList.find(item => item.date == date);
    if (planDetails != undefined) {
      for (let i = 0; i < this.dustbinList.length; i++) {
        if (this.dustbinList[i]["isDisabled"] == "no") {
          let id = "sp-" + this.dustbinList[i]["dustbin"] + "-" + d;
          $('#' + id).show();
        }
        else {
          let id = "sp-" + this.dustbinList[i]["dustbin"] + "-" + d;
          $('#' + id).hide();
        }
      }
    }
    else {
      for (let i = 0; i < this.dustbinList.length; i++) {
        let id = "sp-" + this.dustbinList[i]["dustbin"] + "-" + d;
        $('#' + id).hide();
      }
    }
  }

  addDustbin(dustbin: any, day: any) {
    this.dustbinPlanList = [];
    $(this.dustbinId).val(dustbin);
    let planDate = this.selectedYear + '-' + this.selectedMonth + '-' + day;
    $(this.planDate).html(planDate);
    if (this.planList.length > 0) {
      for (let i = 0; i < this.planList.length; i++) {
        if (planDate == this.planList[i]["date"]) {
          this.dustbinPlanList.push({ key: this.planList[i]["key"], planName: this.planList[i]["planName"] });
        }
      }
    }
  }

  getPlanDetail() {
    let planId = $(this.ddlPlan).val();
    if (planId != "0") {
      let planDetails = this.planList.find(item => item.key == planId);
      if (planDetails != undefined) {
        $(this.maxCapacity).html(planDetails.maxDustbin);
        $(this.assignedDustbin).html(planDetails.dustbinAssigned);
      }
    }
    else {
      $(this.maxCapacity).html("0");
      $(this.assignedDustbin).html("0");
    }
  }

  saveDustbinPlan() {
    let planId = $(this.ddlPlan).val();
    if (planId == "0") {
      this.commonService.setAlertMessage("error", "Please select plan !!!");
      return;
    }
    let date = $(this.planDate).html();
    let dustbinId = $(this.dustbinId).val();
    let element = <HTMLInputElement>document.getElementById('chkHigh');
    if (planId == "0") {
      this.commonService.setAlertMessage("error", "Please select plan !!!");
      return;
    }
    this.getDustbinPlanData(planId, dustbinId, date, element);
  }

  getDustbinPlanData(planId: any, dustbinId: any, date: any, element: any) {
    let planDetails = this.planList.find(item => item.key == planId);
    if (planDetails != undefined) {
      this.dustbinService.getDustbinPlanData(planDetails.date, planId, "today", "", "").then((planDustbinData: any) => {
        if (planDustbinData != null) {
          let maxDustbin = planDustbinData["maxDustbinCapacity"];
          let dustbinAssigned = planDetails.dustbinAssigned;
          let highPriority = planDustbinData["highPriority"];
          let sequence = planDustbinData["pickingSequence"];
          let dustbinPickingPosition = planDustbinData["dustbinPickingPosition"];
          let zone = planDustbinData["zone"];
          if ((dustbinAssigned + 1) > maxDustbin) {
            this.commonService.setAlertMessage("error", "You can not assign dustbin more than " + maxDustbin + " !!!");
            return;
          }
          let bins = planDustbinData["bins"];
          let isDustbinAssined = false;
          let totalDustbin = 0;
          if (bins == "") {
            totalDustbin = 1;
            bins = dustbinId;
            sequence = dustbinId;
            zone = this.selectedZone;
            if (element.checked == true) {
              highPriority = dustbinId;
            }
            this.setDustbinPlan(planDetails, bins, sequence, highPriority, zone, totalDustbin, date, planId, dustbinId);
          }
          else {
            let binArray = bins.toString().replaceAll(" ", "").split(',');
            if (binArray.length > 0) {
              totalDustbin = binArray.length;
              for (let i = 0; i < binArray.length; i++) {
                if (binArray[i] == dustbinId) {
                  isDustbinAssined = true;
                  this.commonService.setAlertMessage("error", "You have already added this dustbin in selected plan !!!");
                  return;
                }
              }
              if (isDustbinAssined == false) {
                totalDustbin = totalDustbin + 1;
                if (zone == "") {
                  zone = this.selectedZone;
                }
                else {
                  let zones = zone.toString().replaceAll(" ", "").split(',');
                  let isZone = false;
                  if (zones.length > 0) {
                    for (let z = 0; z < zones.length; z++) {
                      if (this.selectedZone == zones[z]) {
                        isZone = true;
                      }
                    }
                    if (isZone == false) {
                      zone = zone + ", " + this.selectedZone;
                    }
                  }
                }
                if (element.checked == false) {
                  bins = bins + ", " + dustbinId;
                  sequence = sequence + ", " + dustbinId;
                  this.setDustbinPlan(planDetails, bins, sequence, highPriority, zone, totalDustbin, date, planId, dustbinId);
                }
                else {
                  if (highPriority != "") { highPriority = ", " + highPriority }
                  highPriority = dustbinId + highPriority;
                  let binList = bins.toString().replaceAll(" ", "").split(',');
                  let sequenceList = sequence.toString().replaceAll(" ", "").split(',');
                  let checkDustbin = sequenceList[dustbinPickingPosition].trim();
                  this.getDustbinPickHistoryForHighPriority(planDetails, date, checkDustbin, planId, dustbinPickingPosition, sequenceList, dustbinId, binList, highPriority, zone, totalDustbin);
                }
              }
            }
          }
        }
      });
    }
  }

  getDustbinPickHistoryForHighPriority(planDetails: any, date: any, checkDustbin: any, planId: any, dustbinPickingPosition: any, sequenceList: any, dustbinId: any, binList: any, highPriority: any, zone: any, totalDustbin: any) {
    let monthName = this.commonService.getCurrentMonthName(parseInt(date.toString().split('-')[1]) - 1);
    this.dustbinService.getDustbinPickHistory(this.selectedYear, monthName, date, checkDustbin, planId).then((dustbinPickData: any) => {
      if (dustbinPickData != null) {
        let bins = "";
        let sequence = "";
        if (dustbinPickData != null) {
          let dustbinPosion = Number(dustbinPickingPosition) + 1;
          checkDustbin = sequenceList[dustbinPosion];
          for (let i = 0; i < sequenceList.length; i++) {
            if (sequence != "") { sequence = sequence + ", " }
            if (checkDustbin == sequenceList[i].trim()) {
              sequence = sequence + dustbinId + ", " + sequenceList[i].trim();
            }
            else {
              sequence = sequence + sequenceList[i].trim();
            }
          }
          for (let i = 0; i < binList.length; i++) {
            if (bins != "") { bins = bins + ", " }
            if (checkDustbin == binList[i].trim()) {
              bins = bins + dustbinId + ", " + binList[i].trim();
            }
            else {
              bins = bins + binList[i].trim();
            }
          }
        }
        else {
          let dustbinPosion = Number(dustbinPickingPosition);
          checkDustbin = sequenceList[dustbinPosion];
          for (let i = 0; i < sequenceList.length; i++) {
            if (sequence != "") { sequence = sequence + ", " }
            if (checkDustbin == sequenceList[i].trim()) {
              sequence = sequence + dustbinId + ", " + sequenceList[i].trim();
            }
            else {
              sequence = sequence + sequenceList[i].trim();
            }
          }
          for (let i = 0; i < binList.length; i++) {
            if (bins != "") { bins = bins + ", " }
            if (checkDustbin == binList[i].trim()) {
              bins = bins + dustbinId + ", " + binList[i].trim();
            }
            else {
              bins = bins + binList[i].trim();
            }
          }
        }
        this.setDustbinPlan(planDetails, bins, sequence, highPriority, zone, totalDustbin, date, planId, dustbinId);
      }
    });
  }

  setDustbinPlan(planDetails: any, bins: any, sequence: any, highPriority: any, zone: any, totalDustbin: any, date: any, planId: any, dustbinId: any) {
    planDetails.bins = bins;
    planDetails.dustbinAssigned = planDetails.dustbinAssigned + 1;
    planDetails.sequence = sequence;
    planDetails.highPriority = highPriority;
    planDetails.zone = zone;
    this.dustbinService.updateDustbinPlans(bins, zone, totalDustbin, date, planId, sequence, highPriority);
    $(this.assignedDustbin).html(planDetails.dustbinAssigned);
    this.modalService.dismissAll();
    this.setAssignedPlan(dustbinId, date, planDetails.planName);
    this.commonService.setAlertMessage("success", "Dustbin Assigned Successfully !!!");
  }

  setAssignedPlan(dustbinId: any, date: any, planName: any) {
    if (Number(date.split('-')[2]) >= Number(this.todayDate.toString().split('-')[2])) {
      let day = "day" + Number(date.split('-')[2]);
      let spanId = "lbl-" + dustbinId + "-" + day;
      let spanData = $('#' + spanId).html();
      if (spanData == "") {
        spanData = "<b> Assigned :</b> " + planName;
      }
      else {
        spanData = spanData + " || " + planName;
      }
      $('#' + spanId).html(spanData);
    }
  }

  openModel(content: any, type: any, plan: any, dustbin: any, day: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 0;
    let width = 0;
    let marginTop = "0px";
    if (type == "updatePlan" || type == "addPlan") {
      height = 380;
      width = 350;
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    }
    else if (type == "deletePlanConfirmation" || type == "deleteDustbinConfirmation") {
      height = 145;
      width = 350;
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    }
    else if (type == "addDustbin") {
      height = 330;
      width = 450;
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    }
    $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
    $('div .modal-dialog-centered').css("margin-top", "26px");
    if (type == "addPlan") {
      this.clearPlan();
    }
    else if (type == "updatePlan") {
      this.updatePlan(plan);
    }
    else if (type == "deletePlanConfirmation") {
      $(this.deletePlanId).val(plan.key);
      $(this.deletePlanDate).val(plan.date);
    }
    else if (type == "addDustbin") {
      this.addDustbin(dustbin, day);
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  //#endregion
}
