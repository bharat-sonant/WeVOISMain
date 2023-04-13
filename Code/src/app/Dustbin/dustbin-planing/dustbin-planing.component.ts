import { Component, OnInit, ViewChild } from '@angular/core';
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

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private dustbinService: DustbinService, private commonService: CommonService, private modalService: NgbModal, public httpService: HttpClient) { }

  selectedZone: any;
  cityName: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  todayDate: any;

  yearList: any[] = [];
  zoneList: any[] = [];
  dustbinStorageList: any[] = [];
  dustbinList: any[] = [];
  planList: any;
  dustbinPlanList: any[] = [];

  ddlMonth = "#ddlMonth";
  ddlYear = "#ddlYear";
  ddlZone = "#ddlZone";
  divLoader = "#divLoader";

  // plan section
  key = "#key";
  prePlanDate = "#prePlanDate";
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
  mapPlanId = "#mapPlanId";
  mapDate = "#mapDate";
  deleteDustbinId = "#deleteDustbinId";
  divDustbin = "#divDustbin";
  previousPlanList: any[];
  divNewPlan = "#divNewPlan";
  divPreviousPlan = "#divPreviousPlan";
  txtPreviousPlanDate = "#txtPreviousPlanDate";
  ddlPreviousPlanList = "#ddlPreviousPlanList";
  txtPrePlanDateFrom = "#txtPrePlanDateFrom";
  txtPrePlanDateTo = "#txtPrePlanDateTo";

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
  zone: any;
  pickedDustbin: any;
  highPriority: any;
  planAddDays = 5;
  dustbinMarker: any[] = [];
  dustbinMapList: any[] = [];
  preSelectedMarker: any;
  public bounds: any;
  selectedDustbin: any;

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.setDefault();
  }

  setDefault() {
    this.userId = localStorage.getItem("userID");
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
        if (list[i]["isDisabled"] != "yes") {
          this.dustbinList.push({ zoneNo: list[i]["zone"], dustbin: list[i]["dustbin"], address: list[i]["address"], pickFrequency: list[i]["pickFrequency"], isBroken: isBroken, isDisabled: list[i]["isDisabled"] });
        }
      }
      if (this.dustbinList.length > 0) {
        this.getDustbinAllPlan();
      }
    }
  }

  getDustbinAllPlan() {
    $(this.divLoader).show();
    this.getDustbinPickingPlanHistory();
    this.getWardAssignedDustbin();
    if (this.todayDate.split('-')[0] == this.selectedYear && this.todayDate.split('-')[1] == this.selectedMonth) {
      this.getDustbinPickingPlans("Report");
    }
    if (this.selectedZone != "0") {
      setTimeout(() => {
        $(this.divLoader).hide();
      }, 18000);
    }
  }

  getWardAssignedDustbin() {
    this.dustbinService.getWardAssignedDustbin(this.selectedYear, this.selectedMonthName).then((planHistoryData: any) => {
      if (planHistoryData != null) {
        this.getDustbinePlanedStatus(planHistoryData, "ward");
      }
    });
  }

  getDustbinPickingPlanHistory() {
    this.dustbinService.getDustbinPickingPlanHistory(this.selectedYear, this.selectedMonthName).then((planHistoryData: any) => {
      if (planHistoryData != null) {
        this.getDustbinePlanedStatus(planHistoryData, "");
      }
    });
  }

  getDustbinPickingPlans(type: any) {
    this.dustbinService.getDustbinPickingPlans().then((planData: any) => {
      if (planData != null) {
        if (type == "Report") {
          this.getDustbinePlanedStatus(planData, "");
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

  getDustbinePlanedStatus(planData: any, planType: any) {
    let dateKeyArray = Object.keys(planData);
    if (dateKeyArray.length > 0) {
      for (let indexDate = 0; indexDate < dateKeyArray.length; indexDate++) {
        let planDate = dateKeyArray[indexDate];
        if (planDate.split('-')[0] == this.selectedYear && planDate.split('-')[1] == this.selectedMonth) {
          let day = "day" + Number(planDate.split('-')[2]);
          let planObject = planData[planDate];
          let planKeyArray = Object.keys(planObject);
          if (planKeyArray.length > 0) {
            for (let indexPlan = 0; indexPlan < planKeyArray.length; indexPlan++) {
              let planId = planKeyArray[indexPlan];
              let assignedBinList = [];
              let pickedBinList = [];
              if (planType == "ward") {
                if (planObject[planId]["bins"] != "") {
                  assignedBinList = planObject[planId]["bins"].split(',');
                }
                if (planObject[planId]["completedBins"] != null) {
                  pickedBinList = planObject[planId]["completedBins"].split(',');
                }
              }
              else {
                if (planObject[planId]["isAssigned"] != "false") {
                  if (planObject[planId]["bins"] != "") {
                    assignedBinList = planObject[planId]["bins"].split(',');
                  }
                  if (planObject[planId]["pickedDustbin"] != null) {
                    pickedBinList = planObject[planId]["pickedDustbin"].split(',');
                  }
                }
              }
              this.setDustbinPickStatus(day, assignedBinList, pickedBinList, planDate, planId, planType);
            }
          }
        }
      }
    }
  }

  setDustbinPickStatus(day: any, assignedBinList: any, pickedBinList: any, planDate: any, planId: any, planType: any) {
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
            let status = this.dustbinService.getIcon("assignedNotPicked") + " Assigned but not Picked";
            if (planType == "ward") {
              status = status + " <b>(W)</b>";
            }
            binDetail[day].push({ status: status, planDate: planDate, planName: planId, isPicked: false });
          }
          else {
            this.getDustbinPickedDetail(binDetail, day, dustbin, planDate, planId, planType);
          }
        }
      }
    }
  }

  getDustbinPickedDetail(binDetail: any, day: any, dustbin: any, planDate: any, planId: any, planType: any) {
    this.dustbinService.getDustbinPickHistory(this.selectedYear, this.selectedMonthName, planDate, dustbin, planId).then((dustbinPickData: any) => {
      let status = this.dustbinService.getIcon("assignedNotPicked") + " Assigned but not Picked";
      if (planType == "ward") {
        status = status + " <b>(W)</b>";
      }
      if (dustbinPickData == null) {
        binDetail[day].push({ status: status, planDate: planDate, planName: planId, isPicked: false });
      }
      else {
        if (dustbinPickData["endTime"] == null) {
          binDetail[day].push({ status: status, planDate: planDate, planName: planId, isPicked: false });
        }
        else {
          this.setDustbinPickedDetail(dustbinPickData, binDetail, day, planDate, planId, planType);
        }
      }
    });
  }

  setDustbinPickedDetail(pickData: any, binDetail: any, day: any, planDate: any, planId: any, planType: any) {
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

    this.getEmployeeDetail(empId, binDetail, day, pickStatus, remark, filledPercentage, planDate, planId, pickTime, planType);
  }

  getEmployeeDetail(empId: any, binDetail: any, day: any, pickStatus: any, remark: any, filledPercentage: any, planDate: any, planId: any, pickTime: any, planType: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      let name = employee["name"];
      pickStatus = pickStatus + " by " + name;
      if (remark != "") {
        pickStatus = pickStatus + "<br/>" + remark;
      }
      if (planType == "ward") {
        pickStatus = pickStatus + " <b>(W)</b>";
      }
      binDetail[day].push({ status: pickStatus, filledPercentage: filledPercentage, planDate: planDate, planName: planId, isPicked: true, pickTime: pickTime, remark: remark, name: name });
    });

  }

  changeSelection() {
    this.selectedYear = $(this.ddlYear).val();
    this.selectedMonth = $(this.ddlMonth).val();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.selectedZone = $(this.ddlZone).val();

    this.getDustbins();
    setTimeout(() => {
      this.removeAssignedPlan();
    }, 2000);
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
    $(this.prePlanDate).val("");
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
    this.zone = "";
    this.pickedDustbin = "";
    this.highPriority = "";
  }

  addUpdatePlan() {
    let $Key = $(this.key).val();
    let prePlanDate = $(this.prePlanDate).val();
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
      if (prePlanDate != "") {
        $(this.txtPlanDate).val(prePlanDate);
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
      updatedAt: this.commonService.getTodayDateTime(),
      updatedBy: this.userId,
      zone: this.zone,
      maxDustbinCapacity: Number(maxDustbinCapacity),
      isConfirmed: this.isConfirmed,
      pickedDustbin: this.pickedDustbin,
      highPriority: this.highPriority
    };
    if ($Key == "0") {
      let planDetail = this.planList.find(item => item.planName == planName.toString() && item.date == planDate);
      if (planDetail != undefined) {
        this.commonService.setAlertMessage("error", "Plan Name " + planName.toString() + " already exist on date " + planDate + " !!!");
        return;
      }
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
        if (prePlanDate == planDate) {
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
        $("#divChkPrePlan").hide();
        $(this.key).val(plan.key);
        $(this.prePlanDate).val(plan.date);
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

  openPreviousPlan() {
    if ((<HTMLInputElement>document.getElementById("chkPreviousPlans")).checked == true) {
      $(this.divNewPlan).hide();
      $(this.divPreviousPlan).show();
    }
  }


  backToNewPlan() {
    $(this.divNewPlan).show();
    $(this.divPreviousPlan).hide();
    $(this.txtPreviousPlanDate).val("");
    $(this.txtPrePlanDateFrom).val("");
    $(this.txtPrePlanDateTo).val("");
    this.previousPlanList = [];
    (<HTMLInputElement>document.getElementById("chkPreviousPlans")).checked = false;
  }


  addPreviousPlan() {
    if ($(this.ddlPreviousPlanList).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select plan !!!");
      return;
    }
    if ($(this.txtPrePlanDateFrom).val() == "") {
      this.commonService.setAlertMessage("error", "Please select date !!!");
      return;
    }
    let planId = $(this.ddlPreviousPlanList).val();
    let planDateFrom = $(this.txtPrePlanDateFrom).val();
    if (new Date(planDateFrom.toString()) < new Date(this.todayDate)) {
      this.commonService.setAlertMessage("error", "plan date from can not be less than today date !!!");
      return;
    }
    let planDateTo = $(this.txtPrePlanDateTo).val();
    if (planDateTo != "") {
      if (new Date(planDateTo.toString()) < new Date(planDateFrom.toString())) {
        this.commonService.setAlertMessage("error", "plan date to can not be more than plan date to !!!");
        return;
      }
      if (new Date(planDateTo.toString()) > new Date(this.commonService.getNextDate(this.todayDate, this.planAddDays-1))) {
        this.commonService.setAlertMessage("error", "plan date to can not be more than " + this.commonService.getNextDate(this.todayDate, this.planAddDays-1) + " date !!!");
        return;
      }
    }

    let detail = this.previousPlanList.find(item => item.planId == planId);
    if (detail != undefined) {
      let planData = detail.planData;
      let planDate = planDateFrom;
      if (planDateTo == "") {
        this.savePreviousPlanData(1, planData, planDate, 1);
      }
      else {
        if(planDateFrom==planDateTo){
          this.savePreviousPlanData(1, planData, planDate, 1);
        }
        else{
          let days = this.commonService.getDaysBetweenDates(planDateFrom, planDateTo);
          this.savePreviousPlanData(0, planData, planDate, days);
        }        
      }
    }
  }

  savePreviousPlanData(index: any, planData: any, planDate: any, days: any) {
    if (index > days) {
      this.backToNewPlan();
    }
    else {
      let planDetail = this.planList.find(item => item.planName == planData.planName && item.date == planDate);
      if (planDetail != undefined) {
        this.commonService.setAlertMessage("error", "Plan Name " + planData.planName + " already exist on date " + planDate + " !!!");
      }
      else {
        let dbPath = "DustbinData/DustbinPickingPlans/" + planDate;
        const plan = {
          $Key: "0",
          bins: planData.bins,
          createdAt: this.createdAt,
          createdBy: this.userId,
          dustbinPickingPosition: this.dustbinPickingPosition,
          isAssigned: this.isAssigned,
          pickingSequence: planData.pickingSequence,
          planName: planData.planName,
          totalDustbin: planData.totalDustbin,
          updatedAt: this.commonService.getTodayDateTime(),
          updatedBy: this.userId,
          zone: planData.zone,
          maxDustbinCapacity: Number(planData.maxDustbinCapacity),
          isConfirmed: this.isConfirmed,
          pickedDustbin: this.pickedDustbin,
          highPriority: planData.highPriority
        };
        this.addPlan(plan, dbPath, "Plan " + planData.planName + " added for date " + planDate + "  successfully !!!");
      }
      index++;
      planDate = this.commonService.getNextDate(planDate, 1);
      this.savePreviousPlanData(index, planData, planDate, days);
    }
  }

  getPreviousPlans() {
    let date = $("#txtPreviousPlanDate").val();
    if (date == "") {
      this.commonService.setAlertMessage("error", "Please select date !!!");
      return;
    }
    this.previousPlanList = [];
    this.dustbinService.getDustbinPickingPlansByDate(date).then((planListData: any) => {
      if (planListData != null) {
        console.log(planListData);
        let keyArray = Object.keys(planListData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let planId = keyArray[i];
            let palnData = planListData[planId];
            let planName = planListData[planId]["planName"];
            if (planName != "") {
              this.previousPlanList.push({ planId: planId, planName: planName, planData: palnData });
            }
          }
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
          if (date.split('-')[0] == this.selectedYear && date.split('-')[1] == this.selectedMonth) {
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
          if (bins == "") {
            bins = dustbinId;
            sequence = dustbinId;
            zone = this.selectedZone;
            if (element.checked == true) {
              highPriority = dustbinId;
            }
            this.setDustbinPlan(planDetails, bins, sequence, highPriority, zone, 1, date, planId, dustbinId);
          }
          else {
            this.getBinsDustbinData(bins, dustbinId, zone, element, sequence, planDetails, highPriority, dustbinPickingPosition, date, planId);
          }
        }
      });
    }
  }

  getBinsDustbinData(bins: any, dustbinId: any, zone: any, element: any, sequence: any, planDetails: any, highPriority: any, dustbinPickingPosition: any, date: any, planId: any) {
    let totalDustbin = 0;
    let isDustbinAssined = false;
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

  getDustbinPickHistoryForHighPriority(planDetails: any, date: any, checkDustbin: any, planId: any, dustbinPickingPosition: any, sequenceList: any, dustbinId: any, binList: any, highPriority: any, zone: any, totalDustbin: any) {
    this.dustbinService.getDustbinPickHistory(this.selectedYear, this.selectedMonthName, date, checkDustbin, planId).then((dustbinPickData: any) => {
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
    if (new Date(date) >= new Date(this.todayDate)) {
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

  setSequenceIndex(type: any) {
    let currentIndex = this.selectedDustbin;
    let nextIndex = 0;
    if (type == "up") {
      if (currentIndex == 0) {
        nextIndex = this.dustbinMapList.length - 1;
      }
      else {
        nextIndex = currentIndex - 1;
      }
    }
    else {
      if (currentIndex == this.dustbinMapList.length - 1) {
        nextIndex = 0;
      }
      else {
        nextIndex = currentIndex + 1;
      }
    }

    let dustbinPre = this.dustbinMapList[currentIndex]["dustbin"];
    let addressPre = this.dustbinMapList[currentIndex]["address"];
    let latPre = this.dustbinMapList[currentIndex]["lat"];
    let lngPre = this.dustbinMapList[currentIndex]["lng"];
    let isPickedPre = this.dustbinMapList[currentIndex]["isPicked"];
    let isHighPriorityPre = this.dustbinMapList[currentIndex]["isHighPriority"];
    let zonePre = this.dustbinMapList[currentIndex]["zone"];

    let dustbinNext = this.dustbinMapList[nextIndex]["dustbin"];
    let addressNext = this.dustbinMapList[nextIndex]["address"];
    let latNext = this.dustbinMapList[nextIndex]["lat"];
    let lngNext = this.dustbinMapList[nextIndex]["lng"];
    let isPickedNext = this.dustbinMapList[nextIndex]["isPicked"];
    let isHighPriorityNext = this.dustbinMapList[nextIndex]["isHighPriority"];
    let zoneNext = this.dustbinMapList[nextIndex]["zone"];

    this.dustbinMapList[currentIndex]["dustbin"] = dustbinNext;
    this.dustbinMapList[currentIndex]["address"] = addressNext;
    this.dustbinMapList[currentIndex]["lat"] = latNext;
    this.dustbinMapList[currentIndex]["lng"] = lngNext;
    this.dustbinMapList[currentIndex]["isPicked"] = isPickedNext;
    this.dustbinMapList[currentIndex]["isHighPriority"] = isHighPriorityNext;
    this.dustbinMapList[currentIndex]["zone"] = zoneNext;

    this.dustbinMapList[nextIndex]["dustbin"] = dustbinPre;
    this.dustbinMapList[nextIndex]["address"] = addressPre;
    this.dustbinMapList[nextIndex]["lat"] = latPre;
    this.dustbinMapList[nextIndex]["lng"] = lngPre;
    this.dustbinMapList[nextIndex]["isPicked"] = isPickedPre;
    this.dustbinMapList[nextIndex]["isHighPriority"] = isHighPriorityPre;
    this.dustbinMapList[nextIndex]["zone"] = zonePre;
    this.getSelctedDustbin(nextIndex);
  }

  updateDustbinSequence() {
    let planId = $(this.mapPlanId).val();
    let date = $(this.mapDate).val();
    let bins = "";

    if (this.dustbinMapList.length > 0) {
      for (let i = 0; i < this.dustbinMapList.length; i++) {
        if (bins == "") {
          bins = this.dustbinMapList[i]["dustbin"];
        }
        else {
          bins = bins + ", " + this.dustbinMapList[i]["dustbin"];
        }
      }
    }
    let highPriority = "";
    let sequence = "";
    let zone = "";
    let planDetails = this.planList.find(item => item.key == planId);
    if (planDetails != undefined) {
      planDetails.bins = bins;
      zone = planDetails.zone;
      highPriority = planDetails.highPriority;
      sequence = planDetails.sequence;
    }
    this.dustbinService.updateDustbinPlans(bins, zone, this.dustbinMapList.length, date, planId, sequence, highPriority);
    this.commonService.setAlertMessage("success", "Dusting sequence updated successfully !!!");
    this.modalService.dismissAll();
  }

  openMapModel(date: any, planId: any) {
    this.dustbinMarker = [];
    this.dustbinMapList = [];
    this.bounds = new google.maps.LatLngBounds();
    this.setMaps();
    $(this.mapPlanId).val(planId);
    $(this.mapDate).val(date);
    if (this.planList.length > 0) {
      let planDetails = this.planList.find(item => item.key == planId);
      if (planDetails != undefined) {
        this.dustbinService.getDustbinPlanData(planDetails.date, planId, "today", "", "").then((planDustbinData: any) => {
          if (planDustbinData != null) {
            let bins = planDustbinData["bins"];
            let picked = planDustbinData["pickedDustbin"];
            let highPriority = planDustbinData["highPriority"];
            planDetails.sequence = planDustbinData["pickingSequence"];
            let pickedList = [];
            if (picked != "") {
              pickedList = picked.toString().replaceAll(" ", "").split(',');
            }
            let highPriorityList = [];
            if (highPriority != "") {
              highPriorityList = highPriority.toString().replaceAll(" ", "").split(',');
            }
            if (bins != "") {
              let binList = bins.toString().replaceAll(" ", "").split(',');
              if (binList.length > 0) {
                for (let i = 0; i < binList.length; i++) {
                  let dustbinDetails = this.dustbinStorageList.find(item => item.dustbin == binList[i]);
                  if (dustbinDetails != undefined) {
                    let isPicked = false;
                    if (pickedList.length > 0) {
                      for (let j = 0; j < pickedList.length; j++) {
                        if (dustbinDetails.dustbin == pickedList[j]) {
                          isPicked = true;
                        }
                      }
                    }
                    let isHighPriority = "";
                    for (let k = 0; k < highPriorityList.length; k++) {
                      if (dustbinDetails.dustbin == highPriorityList[k].trim()) {
                        isHighPriority = "(HP)";
                      }
                    }
                    this.dustbinMapList.push({ dustbin: dustbinDetails.dustbin, address: dustbinDetails.address, lat: dustbinDetails.lat, lng: dustbinDetails.lng, isPicked: isPicked, isHighPriority: isHighPriority, zone: dustbinDetails.zone });
                  }
                }
                if (this.dustbinMapList.length > 0) {
                  this.preSelectedMarker = 0;
                  this.setMarker(0);
                  setTimeout(() => {
                    this.getSelctedDustbin(0);
                  }, 600);
                }
              }
            }
          }
        });
      }
    }
  }

  getSelctedDustbin(index: any) {
    this.selectedDustbin = index;
    if (this.dustbinMapList.length > 0) {
      for (let i = 0; i < this.dustbinMapList.length; i++) {
        let className = $('#tr' + i).attr('class');
        $('#tr' + i).removeClass(className);
        if (i == index) {
          $('#tr' + i).addClass("selected-dustbin-active");
        }
        else {
          $('#tr' + i).addClass("selected-dustbin");
        }

        if (this.dustbinMapList[i]["isPicked"] == true) {
          let className = $('#tr' + i).attr('class');
          $('#tr' + i).removeClass(className);
          $('#tr' + i).addClass("picked-dustbin");
        }
      }

      this.dustbinMarker[this.preSelectedMarker]["marker"].setMap(null);
      let i = this.preSelectedMarker;
      let imgPath = this.dustbinService.getIcon("planDustbin");
      let scaledheight = 30;
      let scaledWidth = 35;
      let point1 = 15;
      let point2 = 25;
      let fontSize = "10px";
      let sequence = (i + 1);
      let contentString = 'Dustbin : ' + this.dustbinMapList[i]["address"];
      this.setSelectedMarker(i, this.dustbinMapList[i]["lat"], this.dustbinMapList[i]["lng"], sequence, imgPath, contentString, scaledheight, scaledWidth, point1, point2, fontSize, "preSelected", this.dustbinMapList[i]["isPicked"]);

      i = index;
      this.preSelectedMarker = index;
      this.dustbinMarker[i]["marker"].setMap(null);
      imgPath = this.dustbinService.getIcon("selectedDustbin");
      scaledheight = 40;
      scaledWidth = 45;
      point1 = 20;
      point2 = 15;
      fontSize = "14px";
      sequence = (i + 1);
      contentString = 'Dustbin : ' + this.dustbinMapList[i]["address"];
      this.setSelectedMarker(i, this.dustbinMapList[i]["lat"], this.dustbinMapList[i]["lng"], sequence, imgPath, contentString, scaledheight, scaledWidth, point1, point2, fontSize, "selected", this.dustbinMapList[i]["isPicked"]);
    }
  }

  deletePlanDustbin(dustbin: any) {
    let planId = $(this.mapPlanId).val();
    let date = $(this.mapDate).val();
    let planDetails = this.planList.find(item => item.key == planId);
    if (planDetails != undefined) {
      let isDelete = true;
      if (planDetails.pickedDustbin != "") {
        let pickedDustbinArray = planDetails.pickedDustbin.toString().split(',');
        if (pickedDustbinArray.length > 0) {
          for (let i = 0; i < pickedDustbinArray.length; i++) {
            if (pickedDustbinArray[i].trim() == dustbin) {
              isDelete = false;
              this.commonService.setAlertMessage("error", "this dustbin has picked !!!");
              break;
            }
          }
        }
      }
      if (isDelete == true) {
        this.dustbinService.getDustbinPickHistory(this.selectedYear, this.selectedMonthName, date, dustbin, planId).then((dustbinPickData: any) => {
          if (dustbinPickData == null) {
            $(this.deleteDustbinId).val(dustbin);
            $(this.divDustbin).show();
          }
          else {
            this.commonService.setAlertMessage("error", "this dustbin is on work !!!");
          }
        });
      }
    }
  }

  deleteDustbin() {
    let planId = $(this.mapPlanId).val();
    let date = $(this.mapDate).val();
    let dustbin = $(this.deleteDustbinId).val();
    $(this.deleteDustbinId).val("0");
    let planDetails = this.planList.find(item => item.key == planId);
    if (planDetails != undefined) {
      this.dustbinService.getDustbinPlanData(planDetails.date, planId, "today", "", "").then((planDustbinData: any) => {
        if (planDustbinData != null) {
          let bins = planDustbinData["bins"];
          let binArray = bins.toString().replaceAll(" ", "").split(',');
          if (binArray.length > 0) {
            bins = "";
            let zone = "";
            let zones = [];
            let assigned = 0;
            let totalDustbin = 0;
            for (let i = 0; i < binArray.length; i++) {
              if (binArray[i] != dustbin) {
                totalDustbin = totalDustbin + 1;
                assigned = assigned + 1;
                if (bins == "") {
                  bins = binArray[i];
                }
                else {
                  bins = bins + ", " + binArray[i];
                }
                let dustbinDetails = this.dustbinStorageList.find(item => item.dustbin == binArray[i]);
                if (dustbinDetails != undefined) {
                  if (zones.length == 0) {
                    zones.push({ zone: dustbinDetails.zone });
                  }
                  else {
                    let zoneDetails = zones.find(item => item.zone == dustbinDetails.zone);
                    if (zoneDetails == undefined) {
                      zones.push({ zone: dustbinDetails.zone });
                    }
                  }
                }
              }
            }
            if (zones.length > 0) {
              for (let z = 0; z < zones.length; z++) {
                if (z == 0) {
                  zone = zones[z]["zone"];
                }
                else {
                  zone = zone + ", " + zones[z]["zone"];
                }
              }
            }
            let highPriority = planDustbinData["highPriority"];
            let highPriorityArray = highPriority.toString().replaceAll(" ", "").split(',');
            if (highPriorityArray.length > 0) {
              highPriority = "";
              for (let i = 0; i < highPriorityArray.length; i++) {
                if (highPriorityArray[i] != dustbin) {
                  if (highPriority == "") {
                    highPriority = highPriorityArray[i];
                  }
                  else {
                    highPriority = highPriority + ", " + highPriorityArray[i];
                  }
                }
              }
            }
            let sequence = planDustbinData["pickingSequence"];;
            let sequenceArray = sequence.toString().replaceAll(" ", "").split(',');
            if (sequenceArray.length > 0) {
              sequence = "";
              for (let i = 0; i < sequenceArray.length; i++) {
                if (sequenceArray[i] != dustbin) {
                  if (sequence == "") {
                    sequence = sequenceArray[i];
                  }
                  else {
                    sequence = sequence + ", " + sequenceArray[i];
                  }
                }
              }
            }
            planDetails.zone = zone;
            planDetails.bins = bins;
            planDetails.dustbinAssigned = assigned;
            planDetails.sequence = sequence;
            planDetails.highPriority = highPriority;
            this.dustbinService.updateDustbinPlans(bins, zone, totalDustbin, date, planDetails.key, sequence, highPriority);

            let plan = "";
            let day = "day" + Number(date.toString().split('-')[2]);
            let spanId = "lbl-" + dustbin + "-" + day;
            let spanData = $('#' + spanId).html();
            if (spanData != "" && spanData != undefined) {
              let lblAssigned = spanData.split('</b>')[0];
              let spanDataList = spanData.split('</b>')[1].split('||');
              for (let spIndex = 0; spIndex < spanDataList.length; spIndex++) {
                if (planDetails.planName != spanDataList[spIndex].trim()) {
                  if (plan == "") {
                    plan = spanDataList[spIndex].trim();
                  }
                  else {
                    plan = plan + " || " + spanDataList[spIndex].trim();
                  }
                }
              }
              if (plan != "") {
                plan = lblAssigned + "</b> " + plan;
              }
              $('#' + spanId).html(plan);
            }
            this.openMapModel(planDetails.date, planDetails.key);
            this.removeAssignedPlan();
            this.commonService.setAlertMessage("success", "Dustbin deleted successfully !!!");
            $(this.divDustbin).hide();
          }
        }
      });
    }
  }

  cancelDustbinDelete() {
    $(this.deleteDustbinId).val("0");
    $(this.divDustbin).hide();
  }

  setSelectedMarker(index: any, lat: any, lng: any, markerLabel: any, markerUrl: any, contentString: any, scaledheight: any, scaledWidth: any, point1: any, point2: any, fontSize: any, type: any, isPicked: any) {
    if (isPicked == true) {
      markerUrl = this.dustbinService.getIcon("pickedDustbin");
    }
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(scaledheight, scaledWidth),
        labelOrigin: new google.maps.Point(point1, point2)
      },
      label: {
        text: markerLabel + '',
        color: '#fff',
        fontSize: fontSize,
        fontWeight: "bold"
      }
    });
    this.bounds.extend({ lat: Number(lat), lng: Number(lng) });
    let infowindow = new google.maps.InfoWindow({
      content: contentString
    });
    marker.addListener('click', function () {
      infowindow.open(this.map, marker);
    });
    if (type == "selected") {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
    this.dustbinMarker[index]["marker"] = marker;
  }

  setMarker(selectedIndex: any) {
    if (this.dustbinMarker.length > 0) {
      for (let i = 0; i < this.dustbinMarker.length; i++) {
        this.dustbinMarker[i]["marker"].setMap(null);
      }
      this.dustbinMarker = [];
    }
    if (this.dustbinMapList.length > 0) {
      for (let i = 0; i < this.dustbinMapList.length; i++) {
        let scaledheight = 30;
        let scaledWidth = 35;
        let point1 = 15;
        let point2 = 25;
        let fontSize = "10px";
        let imgPath = this.dustbinService.getIcon("planDustbin");
        if (this.dustbinMapList[i]["isPicked"] == true) {
          imgPath = this.dustbinService.getIcon("pickedDustbin");
        }
        if (selectedIndex == i) {
          scaledheight = 40;
          scaledWidth = 45;
          point1 = 20;
          point2 = 15;
          fontSize = "14px";
        }
        let sequence = (i + 1);

        let marker = new google.maps.Marker({
          position: { lat: Number(this.dustbinMapList[i]["lat"]), lng: Number(this.dustbinMapList[i]["lng"]) },
          map: this.map,
          icon: {
            url: imgPath,
            fillOpacity: 1,
            strokeWeight: 0,
            scaledSize: new google.maps.Size(scaledheight, scaledWidth),
            labelOrigin: new google.maps.Point(point1, point2)
          },
          label: {
            text: sequence + '',
            color: '#fff',
            fontSize: fontSize,
            fontWeight: "bold"
          }
        });
        this.bounds.extend({ lat: Number(this.dustbinMapList[i]["lat"]), lng: Number(this.dustbinMapList[i]["lng"]) });
        let contentString = 'Dustbin : ' + this.dustbinMapList[i]["address"];
        let infowindow = new google.maps.InfoWindow({
          content: contentString
        });
        if (selectedIndex == i) {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
        marker.addListener('click', function () {
          infowindow.open(this.map, marker);
        });
        this.dustbinMarker.push({ marker });
        if (selectedIndex == 0) {
          this.map.fitBounds(this.bounds);
        }
      }
    }
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(document.getElementById("haltMap"), mapProp);
  }

  openModel(content: any, type: any, plan: any, dustbin: any, day: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 0;
    let width = 0;
    let marginTop = "0px";
    if (type == "updatePlan" || type == "addPlan") {
      height = 400;
      width = 350;
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    }
    else if (type == "deletePlanConfirmation") {
      height = 145;
      width = 350;
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    }
    else if (type == "addDustbin") {
      height = 330;
      width = 450;
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    }
    else if (type == "openMapModel") {
      height = (windowHeight * 90) / 100;
      width = (windowWidth * 90) / 100;
      let mapHeight = (height - 100) + "px";
      let divHeight = (height - 136) + "px";
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $('#haltMap').css("height", mapHeight)
      $('#divSequence').css("height", divHeight);
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
    else if (type == "openMapModel") {
      this.openMapModel(plan.date, plan.key);
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  //#endregion
}
