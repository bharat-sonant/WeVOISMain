import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/common/user.service';
import { MapService } from '../../services/map/map.service';
import { HttpClient } from '@angular/common/http';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-dustbin-report',
  templateUrl: './dustbin-report.component.html',
  styleUrls: ['./dustbin-report.component.scss']
})
export class DustbinReportComponent implements OnInit {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public httpService: HttpClient, private mapService: MapService, public usrService: UserService, private modalService: NgbModal, public toastr: ToastrService, private commonService: CommonService) { }
  selectedMonth: any;
  public selectedYear: any;
  public selectedZone: any;
  yearList: any[];
  toDayDate: any;
  dustbinList: any[];
  zoneList: any[];
  dustbinStorageList: any[];
  userId: any;
  planList: any;
  $Key: any;
  bins: any;
  createdAt: any;
  createdBy: any;
  dustbinPickingPosition: any;
  isAssigned: any;
  pickingSequence: any;
  planName: any;
  totalDustbin: any;
  updatedAt: any;
  updatedBy: any;
  zone: any;
  maxDustbinCapacity: any;
  isConfirmed: any;
  isDelete: any;
  dustbinPlanList: any;
  dustbinPlanDetailList: any
  public bounds: any;
  dustbinMapList: any;
  selectedDustbin: any;
  dustbinMarker: any;
  planAddDays = 3;
  pickedDustbin: any;
  preSelectedMarker: any;
  highPriority: any;
  db: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.userId = localStorage.getItem('userID');
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    $('#txtPlanDate').val(this.toDayDate);
    this.clearPlan();
    this.getZoneList();
  }

  //#region Plan

  openModel(content: any, type: any, plan: any, dustbin: any, day: any) {
    if (this.commonService.checkInternetConnection() == "no") {
      this.commonService.setAlertMessage("error", "Please check internet connection !!!");
      return;
    }
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
    else if (type == "showPlanDustbin") {
      height = 550;
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
    else if (type == "showPlanDustbin") {
      this.showPlanDustbin(plan.date, plan.key);
    }
    else if (type == "openMapModel") {
      this.openMapModel(plan.date, plan.key);

    }
    else if (type == "addDustbin") {
      this.addDustbin(dustbin, day);
    }
    else if (type == "deletePlanConfirmation") {
      $('#deletePlanId').val(plan.key);
      $('#deletePlanDate').val(plan.date);
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  getPlans() {
    this.planList = [];
    let dbPath = "DustbinData/DustbinPickingPlans";
    let planInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        planInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let date = keyArray[i];
              let planObject = data[date];
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
                if (j == planArray.length - 1) {
                  this.removeAssignedPlan();
                }
              }
            }
          }
        }
      }
    );
  }

  savePlan() {
    let $Key = $('#key').val();
    let perPlanDate = $('#perPlanDate').val();
    let planName = $('#txtPlanName').val();
    let planDate = $('#txtPlanDate').val();
    let maxDustbinCapacity = $('#txtDustbinCapacity').val();

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
    if (new Date(planDate.toString()) < new Date(this.toDayDate)) {
      if (perPlanDate != "") {
        $('#txtPlanDate').val(perPlanDate);
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
      this.usrService.addPlan(plan, dbPath);
      this.commonService.setAlertMessage("success", "Plan added successfully !!!");
      this.clearPlan();
    }
    else {
      let planDetails = this.planList.find(item => item.key == $Key);
      if (planDetails != undefined) {
        if (Number(maxDustbinCapacity) < Number(planDetails.dustbinAssigned)) {
          this.commonService.setAlertMessage("error", "Max dustbin capacity can not be less than " + planDetails.dustbinAssigned + " !!!");
          $('#txtDustbinCapacity').val(planDetails.maxDustbin);
          return;
        }
      }

      if (perPlanDate == planDate) {
        this.usrService.UpdatePlan(plan, dbPath);
        this.clearPlan();
      }
      else {
        this.usrService.addPlan(plan, dbPath);
        let planDetails = this.planList.find(item => item.key == $Key);
        if (planDetails != undefined) {
          this.deletePlan(planDetails);
        }
      }
      this.commonService.setAlertMessage("success", "Plan updated successfully !!!");
      this.modalService.dismissAll();
    }
  }

  updatePlan(plan: any) {
    let dbPath = "DustbinData/DustbinPickingPlans/" + plan.date + "/" + plan.key + "";
    let planInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        planInstance.unsubscribe();
        if (data != null) {
          $('#key').val(plan.key);
          $('#perPlanDate').val(plan.date);
          $('#txtPlanName').val(data["planName"]);
          $('#txtPlanDate').val(plan.date);
          $('#txtDustbinCapacity').val(data["maxDustbinCapacity"]);
          let elementPlanName = <HTMLInputElement>document.getElementById('txtPlanName');
          let elementDate = <HTMLInputElement>document.getElementById('txtPlanDate');
          if (data["isAssigned"] == "true") {
            elementPlanName.readOnly = true;
            elementDate.readOnly = true;
          }
          else {
            elementPlanName.readOnly = false;
            elementDate.readOnly = false;
          }
          this.bins = data["bins"];
          this.createdAt = data["createdAt"];
          this.createdBy = data["createdBy"];
          this.dustbinPickingPosition = data["dustbinPickingPosition"];
          this.isAssigned = data["isAssigned"];
          this.isConfirmed = data["isConfirmed"];
          this.maxDustbinCapacity = data["maxDustbinCapacity"];
          this.pickingSequence = data["pickingSequence"];
          this.planName = data["planName"];
          this.totalDustbin = data["totalDustbin"];
          this.updatedAt = this.commonService.getTodayDateTime();
          this.updatedBy = this.userId;
          this.zone = data["zone"];
          this.pickedDustbin = data["pickedDustbin"];
          if (data["highPriority"] != null) {
            this.highPriority = data["highPriority"];
          }
          else {
            this.highPriority = "";
          }
        }
      }
    );
  }


  deleteConfirmPlan() {
    let planId = $('#deletePlanId').val();
    let date = $('#deletePlanDate').val();
    let dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId + "";
    this.db.object(dbPath).set({
      "isDelete": null
    });
    this.commonService.setAlertMessage("success", "Plan deleted successfully !!!");
    this.getPlans();
    this.modalService.dismissAll();
  }

  deletePlan(plan: any) {
    if (plan.isAssigned == "true") {
      this.commonService.setAlertMessage("error", "Plan already assigned !!!");
      return;
    }

    let dbPath = "DustbinData/DustbinPickingPlans/" + plan.date + "/" + plan.key + "";
    this.db.object(dbPath).set({
      "isDelete": null
    });
    this.commonService.setAlertMessage("success", "Plan deleted successfully !!!");
    this.getPlans();
    this.modalService.dismissAll();
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

  clearPlan() {
    $('#key').val("0");
    $('#perPlanDate').val("");
    $('#txtPlanName').val("");
    $('#txtPlanDate').val(this.commonService.setTodayDate());
    $('#txtDustbinCapacity').val("");
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
    this.getPlans();
  }

  getDustbinPlanAdd() {
    let currentDate = this.commonService.setTodayDate();
    for (let i = 0; i < this.planAddDays; i++) {
      let planDate = this.commonService.getNextDate(currentDate, i);
      if (this.selectedYear == planDate.split('-')[0] && this.selectedMonth == planDate.split('-')[1]) {
        this.getDustbinPlans(planDate);
      }
    }
  }

  getDustbinPlans(date: any) {
    let planDetails = this.planList.find(item => item.date == date);
    if (planDetails != undefined) {
      let d = "day" + parseFloat(date.split("-")[2]);
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
  }

  addDustbin(dustbin: any, day: any) {
    this.dustbinPlanList = [];
    $('#dustbinId').val(dustbin);
    let planDate = this.selectedYear + '-' + this.selectedMonth + '-' + day;
    $('#planDate').html(planDate);
    if (this.planList.length > 0) {
      for (let i = 0; i < this.planList.length; i++) {
        if (planDate == this.planList[i]["date"]) {
          this.dustbinPlanList.push({ key: this.planList[i]["key"], planName: this.planList[i]["planName"] });
        }
      }
    }
  }

  showPlanDustbin(date: any, planId: any) {
    $('#dustbinPlanId').val(planId);
    $('#planDustbinDate').val(date);
    this.getDustbinPlanDetail(planId);
  }

  getDustbinPlanDetail(planId: any) {
    this.dustbinPlanDetailList = [];
    if (this.planList.length > 0) {
      if (this.dustbinStorageList.length > 0) {
        let planDetails = this.planList.find(item => item.key == planId);
        if (planDetails != undefined) {
          let bins = planDetails.bins;
          $('#exampleModalLongTitle').html(planDetails.planName);
          let binArray = bins.toString().replaceAll(" ", "").split(',');
          if (binArray.length > 0) {
            bins = "";
            for (let i = 0; i < binArray.length; i++) {
              let dustbinDetails = this.dustbinStorageList.find(item => item.dustbin == binArray[i]);
              if (dustbinDetails != undefined) {
                this.dustbinPlanDetailList.push({ planId: planId, zone: dustbinDetails.zone, planName: dustbinDetails.planName, address: dustbinDetails.address, dustbin: dustbinDetails.dustbin });
              }
            }
          }
        }
      }
    }
  }

  deletePlanDustbin(dustbin: any) {
    let planId = $('#mapPlanId').val();
    let date = $('#mapDate').val();
    let planDetails = this.planList.find(item => item.key == planId);
    let highPriority = "";
    if (planDetails != undefined) {
      highPriority = planDetails.highPriority;
      let isDelete = true;
      let dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId + "/pickedDustbin";
      let pickedInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          pickedInstance.unsubscribe();
          let pickedDustbinArray = data.toString().split(',');
          if (pickedDustbinArray.length > 0) {
            for (let i = 0; i < pickedDustbinArray.length; i++) {
              if (pickedDustbinArray[i].trim() == dustbin) {
                isDelete = false;
                this.commonService.setAlertMessage("error", "this dustbin has picked !!!");
                break;
              }
            }
          }
          if (isDelete == true) {
            let monthName = this.commonService.getCurrentMonthName(parseInt(date.toString().split('-')[1]) - 1);
            let dbPath = "DustbinData/DustbinPickHistory/" + this.selectedYear + "/" + monthName + "/" + date + "/" + dustbin + "/" + planId;

            let dataInstance = this.db.object(dbPath).valueChanges().subscribe(
              data => {
                dataInstance.unsubscribe();
                if (data == null) {
                  $('#deleteDustbinId').val(dustbin);
                  $('#divDustbin').show();
                }
                else {
                  this.commonService.setAlertMessage("error", "this dustbin is on work !!!")
                }
              });
          }
        }
      );
    }
  }

  cancelDustbinDelete() {
    $('#deleteDustbinId').val("0");
    $('#divDustbin').hide();
  }


  deleteDustbin() {
    let planId = $('#mapPlanId').val();
    let date = $('#mapDate').val();
    let dustbin = $('#deleteDustbinId').val();
    $('#deleteDustbinId').val("0");
    let planDetails = this.planList.find(item => item.key == planId);
    if (planDetails != undefined) {
      let dbPath = "DustbinData/DustbinPickingPlans/" + planDetails.date + "/" + planId + "";
      let planDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          planDustbinInstance.unsubscribe();
          let bins = data["bins"];
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
            let highPriority = data["highPriority"];
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
            let sequence = data["pickingSequence"];;
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
            this.updateDustbinPlans(bins, zone, totalDustbin, date, planDetails.key, sequence, highPriority);

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
            $('#divDustbin').hide();
          }
        });
    }
  }

  getPlanDetail() {
    let planId = $('#ddlPlan').val();
    if (planId != "0") {
      let planDetails = this.planList.find(item => item.key == planId);
      if (planDetails != undefined) {
        $('#maxCapacity').html(planDetails.maxDustbin);
        $('#assignedDustbin').html(planDetails.dustbinAssigned);
      }
    }
    else {
      $('#maxCapacity').html("0");
      $('#assignedDustbin').html("0");
      this.commonService.setAlertMessage("error", "Please select plan !!!");
    }
  }

  saveDustbinPlan() {
    let dustbinId = $('#dustbinId').val();
    let planId = $('#ddlPlan').val();
    let date = $('#planDate').html();

    let element = <HTMLInputElement>document.getElementById('chkHigh');
    if (planId == "0") {
      this.commonService.setAlertMessage("error", "Please select plan !!!");
      return;
    }
    let planDetails = this.planList.find(item => item.key == planId);
    if (planDetails != undefined) {
      let dbPath = "DustbinData/DustbinPickingPlans/" + planDetails.date + "/" + planId + "";
      let planDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          planDustbinInstance.unsubscribe();
          let maxDustbin = data["maxDustbinCapacity"];
          let dustbinAssigned = planDetails.dustbinAssigned;
          let highPriority = data["highPriority"];
          let sequence = data["pickingSequence"];
          let dustbinPickingPosition = data["dustbinPickingPosition"];
          let zone = data["zone"];
          if ((dustbinAssigned + 1) > maxDustbin) {
            this.commonService.setAlertMessage("error", "You can not assign dustbin more than " + maxDustbin + " !!!");
            return;
          }
          let bins = data["bins"];
          let isDustbinAssined = false;
          let totalDustbin = 0;
          if (bins == "") {
            totalDustbin = totalDustbin + 1;
            bins = dustbinId;
            sequence = dustbinId;
            zone = this.selectedZone;
            if (element.checked == true) {
              highPriority = dustbinId;
            }
            this.checkDustbinPickingPosition(planDetails, bins, sequence, highPriority, zone, totalDustbin, date, planId, dustbinId);
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
                  this.checkDustbinPickingPosition(planDetails, bins, sequence, highPriority, zone, totalDustbin, date, planId, dustbinId);
                }
                else {

                  if (highPriority != "") { highPriority = ", " + highPriority }
                  highPriority = dustbinId + highPriority;
                  let binList = bins.toString().replaceAll(" ", "").split(',');
                  let sequenceList = sequence.toString().replaceAll(" ", "").split(',');

                  let checkDustbin = sequenceList[dustbinPickingPosition].trim();
                  let monthName = this.commonService.getCurrentMonthName(parseInt(date.toString().split('-')[1]) - 1);

                  let dbPath = "DustbinData/DustbinPickHistory/" + this.selectedYear + "/" + monthName + "/" + date + "/" + checkDustbin + "/" + planId;

                  let dataInstance = this.db.object(dbPath).valueChanges().subscribe(
                    data => {
                      dataInstance.unsubscribe();
                      if (data != null) {
                        let dustbinPosion = Number(dustbinPickingPosition) + 1;
                        checkDustbin = sequenceList[dustbinPosion];
                        bins = "";
                        sequence = "";
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
                        this.checkDustbinPickingPosition(planDetails, bins, sequence, highPriority, zone, totalDustbin, date, planId, dustbinId);
                      }
                      else {
                        let dustbinPosion = Number(dustbinPickingPosition);
                        checkDustbin = sequenceList[dustbinPosion];
                        bins = "";
                        sequence = "";
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
                        this.checkDustbinPickingPosition(planDetails, bins, sequence, highPriority, zone, totalDustbin, date, planId, dustbinId);
                      }
                    }
                  );
                }
              }
            }
          }

        }
      )
    }

  }

  checkDustbinPickingPosition(planDetails: any, bins: any, sequence: any, highPriority: any, zone: any, totalDustbin: any, date: any, planId: any, dustbinId: any) {
    planDetails.bins = bins;
    planDetails.dustbinAssigned = planDetails.dustbinAssigned + 1;
    planDetails.sequence = sequence;
    planDetails.highPriority = highPriority;
    planDetails.zone = zone;
    this.updateDustbinPlans(bins, zone, totalDustbin, date, planId, sequence, highPriority);
    $('#assignedDustbin').html(planDetails.dustbinAssigned);
    this.modalService.dismissAll();
    this.setAssignedPlan(dustbinId, date, planDetails.planName);
    this.commonService.setAlertMessage("success", "Dustbin Assigned Successfully !!!");
  }

  updateDustbinPlans(bins: any, zone: any, totalDustbin: any, date, planId: any, sequence: any, highPriority: any) {
    this.db.object("DustbinData/DustbinPickingPlans/" + date + "/" + planId + "").update({
      "bins": bins,
      "pickingSequence": sequence,
      "updatedAt": this.commonService.getTodayDateTime(),
      "updatedBy": this.userId,
      "zone": zone,
      "totalDustbin": totalDustbin,
      "highPriority": highPriority
    });
  }

  removeAssignedPlan() {
    for (let i = 0; i < this.dustbinList.length; i++) {
      for (let j = 1; j <= 31; j++) {
        let day = "day" + j;
        let labelId = 'lbl-' + this.dustbinList[i]["dustbin"] + '-' + day;
        let spanId = 'sp-' + this.dustbinList[i]["dustbin"] + '-' + day;
        $('#' + labelId).html("");
        $('#' + spanId).hide();
        let planDetails = this.planList.find(item => Number(item.date.split('-')[2]) == j && item.date.split('-')[1] == this.selectedMonth && item.date.split('-')[0] == this.selectedYear);
        if (planDetails != undefined) {
          if (planDetails.bins != "" && j > Number(this.toDayDate.split('-')[2])) {
            $('#' + spanId).show();
          }
          else {
            if (j > Number(this.toDayDate.split('-')[2]) && j < Number(this.commonService.getNextDate(this.toDayDate, this.planAddDays).split('-')[2])) {
              $('#' + spanId).show();
            }
          }
        }
      }
    }
    this.getAssignedPlanDustbin();
    this.getDustbinPlanAdd();
  }

  setAssignedPlan(dustbinId: any, date: any, planName: any) {
    if (Number(date.split('-')[2]) >= Number(this.toDayDate.toString().split('-')[2])) {
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

  openMapModel(date: any, planId: any) {

    if (this.commonService.checkInternetConnection() == "no") {
      this.commonService.setAlertMessage("error", "Please check internet connection !!!");
      return;
    }
    this.dustbinMarker = [];
    this.dustbinMapList = [];
    this.bounds = new google.maps.LatLngBounds();
    this.setMaps();
    $('#mapPlanId').val(planId);
    $('#mapDate').val(date);
    if (this.planList.length > 0) {
      let planDetails = this.planList.find(item => item.key == planId);
      if (planDetails != undefined) {
        let dbPath = "DustbinData/DustbinPickingPlans/" + planDetails.date + "/" + planId + "";
        let planDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            planDustbinInstance.unsubscribe();
            let bins = data["bins"];
            let picked = data["pickedDustbin"];
            let highPriority = data["highPriority"];
            planDetails.sequence = data["pickingSequence"];
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
          });
      }
    }
  }

  updateDustbinSequence() {
    let planId = $('#mapPlanId').val();
    let date = $('#mapDate').val();
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
    this.updateDustbinPlans(bins, zone, this.dustbinMapList.length, date, planId, sequence, highPriority);
    this.commonService.setAlertMessage("success", "Dusting sequence updated successfully !!!");
    this.modalService.dismissAll();
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
        let imgPath = this.getIcon("planDustbin");
        if (this.dustbinMapList[i]["isPicked"] == true) {
          imgPath = this.getIcon("pickedDustbin");
        }
        if (selectedIndex == i) {
          //imgPath = this.getIcon("selectedDustbin");
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
      let imgPath = this.getIcon("planDustbin");
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
      imgPath = this.getIcon("selectedDustbin");
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

  setSelectedMarker(index: any, lat: any, lng: any, markerLabel: any, markerUrl: any, contentString: any, scaledheight: any, scaledWidth: any, point1: any, point2: any, fontSize: any, type: any, isPicked: any) {

    if (isPicked == true) {
      markerUrl = this.getIcon("pickedDustbin");
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

  setMaps() {
    var mapstyle = new google.maps.StyledMapType(
      [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: "off" }]
        },
      ]
    );
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(document.getElementById("haltMap"), mapProp);
  }

  //#endregion

  //#region dustbin detail

  getZoneList() {
    this.zoneList = [];
    this.dustbinStorageList = [];
    this.dustbinStorageList = JSON.parse(localStorage.getItem("dustbin"));
    if (this.dustbinStorageList != null) {
      this.dustbinStorageList = this.commonService.transform(this.dustbinStorageList, "zone");
      for (let i = 0; i < this.dustbinStorageList.length; i++) {
        let zoneDetails = this.zoneList.find(item => item.zoneNo == this.dustbinStorageList[i]["zone"]);
        if (zoneDetails == undefined) {
          this.zoneList.push({ zoneNo: this.dustbinStorageList[i]["zone"], zone: "Zone " + this.dustbinStorageList[i]["zone"], pickFrequency: this.dustbinStorageList[i]["pickFrequency"] })
        }
      }
      this.zoneList = this.commonService.transformNumeric(this.zoneList, 'zone');
      this.selectedZone = this.zoneList[0]["zoneNo"];
      this.getDustbins();
    }
  }

  changeSelection() {
    if (this.commonService.checkInternetConnection() == "no") {
      this.commonService.setAlertMessage("error", "Please check internet connection !!!");
      return;
    }
    this.dustbinList = [];
    let year = $('#ddlYear').val();
    let month = $('#ddlMonth').val();
    let zone = $('#ddlZone').val();
    if (year == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    else {
      this.selectedYear = year;
    }
    if (month == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    else {
      this.selectedMonth = month;
    }
    this.selectedZone = zone;
    this.getDustbins();
    setTimeout(() => {
      this.getAssignedPlanDustbin();
      this.getDustbinPlanAdd();
    }, 2000);
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  dustbinStatus(dustbin) {
    let dustbinDetails = this.dustbinList.find(item => item.dustbin == dustbin);
    if (dustbinDetails != undefined) {
      let dbPath = "DustbinData/DustbinDetails/" + dustbin + "/isBroken";
      let brokenInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          brokenInstance.unsubscribe();
          if (data != null) {
            let isBroken = "";
            if (data == true) {
              isBroken = "true";
            }
            if (dustbinDetails.isDisabled == "yes") {
              if (isBroken != "") { isBroken + ", " }
              isBroken = isBroken + "Dustbin Disabled";
            }
            // if (isBroken != "") { isBroken = "(" + isBroken + ")"; }
            dustbinDetails.isBroken = isBroken;
          }
        }
      );
      dbPath = "DustbinData/DustbinDetails/" + dustbin + "/isDisabled";
      let disabledInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          disabledInstance.unsubscribe();
          if (data != null) {
            let isBroken = "";
            if (dustbinDetails.isBroken == "true") {
              isBroken = "डस्टबिन टूटा हुआ है";
            }
            if (data == "yes") {
              if (isBroken != "") { isBroken = isBroken + ", " }
              isBroken = isBroken + "Dustbin Disabled";
            }
            if (isBroken != "") { isBroken = "(" + isBroken + ")"; }
            dustbinDetails.isBroken = isBroken;
          }
          else {
            let isBroken = "";
            if (dustbinDetails.isBroken == "true") {
              isBroken = "डस्टबिन टूटा हुआ है";
            }
            if (isBroken != "") { isBroken = "(" + isBroken + ")"; }
            dustbinDetails.isBroken = isBroken;
          }
        }
      );
    }
  }

  getDustbins() {
    this.dustbinList = [];
    if (this.dustbinStorageList.length > 0) {
      if (this.selectedZone == "0") {
        for (let i = 0; i < this.dustbinStorageList.length; i++) {
          let isBroken = "";
          if (this.dustbinStorageList[i]["isBroken"] == true) {
            isBroken = "डस्टबिन टूटा हुआ है";
          }
          if (this.dustbinStorageList[i]["isDisabled"] == "yes") {
            if (isBroken != "") { isBroken = isBroken + ", " }
            isBroken = isBroken + "Dustbin Disabled";
          }
          if (isBroken != "") { isBroken = "(" + isBroken + ")"; }
          this.dustbinList.push({ zoneNo: this.dustbinStorageList[i]["zone"], dustbin: this.dustbinStorageList[i]["dustbin"], address: this.dustbinStorageList[i]["address"], pickFrequency: this.dustbinStorageList[i]["pickFrequency"], isBroken: isBroken, isDisabled: this.dustbinStorageList[i]["isDisabled"] });
          this.dustbinStatus(this.dustbinStorageList[i]["dustbin"]);
        }
      }
      else {
        for (let i = 0; i < this.dustbinStorageList.length; i++) {
          if (this.dustbinStorageList[i]["zone"] == this.selectedZone) {
            let isBroken = "";
            if (this.dustbinStorageList[i]["isBroken"] == true) {
              isBroken = "डस्टबिन टूटा हुआ है";
            }
            if (this.dustbinStorageList[i]["isDisabled"] == "yes") {
              if (isBroken != "") { isBroken = isBroken + ", " }
              isBroken = isBroken + "Dustbin Disabled";
            }
            if (isBroken != "") { isBroken = "(" + isBroken + ")"; }
            this.dustbinList.push({ zoneNo: this.dustbinStorageList[i]["zone"], dustbin: this.dustbinStorageList[i]["dustbin"], address: this.dustbinStorageList[i]["address"], pickFrequency: this.dustbinStorageList[i]["pickFrequency"], isBroken: isBroken, isDisabled: this.dustbinStorageList[i]["isDisabled"] })
            this.dustbinStatus(this.dustbinStorageList[i]["dustbin"]);
          }
        }
      }
      if (this.dustbinList.length > 0) {
        let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
        let rowTo = days;
        if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
          rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
        }
        for (let i = 1; i <= rowTo; i++) {
          let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
          let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
          let dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.selectedYear + "/" + monthName + "/" + monthDate + "";
          this.getPlanDustbin(dbPath, monthName, monthDate);
          // for current Date dustbinDetails
          if (this.toDayDate == monthDate) {
            dbPath = "DustbinData/DustbinPickingPlans";
            this.getPlanDustbin(dbPath, monthName, monthDate);
          }
          // for ward dustbins
          dbPath = "DustbinData/DustbinAssignToWard/" + this.selectedYear + "/" + monthName + "/" + monthDate + "";
          this.getWardDustbinAssignment(dbPath, monthName, monthDate);
        }
      }
    }
  }

  getWardDustbinAssignment(dbPath: any, monthName: any, monthDate: any) {
    let wardInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        wardInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let wardNo = keyArray[i];
              let binList = data[wardNo]["bins"].split(',');
              if (binList.length > 0) {
                for (let j = 0; j < binList.length; j++) {
                  let dustbin = binList[j].trim();
                  let dustbinDetail = this.dustbinList.find(item => item.dustbin == dustbin);
                  if (dustbinDetail != undefined) {
                    let d = "wardDay" + parseFloat(monthDate.split("-")[2]);
                    dustbinDetail[d] = this.getIcon("assignedNotPicked") + " Assigned but not Picked <b>(W)</b>";
                    dbPath = "DustbinData/DustbinPickHistory/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/" + dustbin + "/" + wardNo + "";
                    let dustbinStatusInstance = this.db.object(dbPath).valueChanges().subscribe(
                      statusData => {
                        dustbinStatusInstance.unsubscribe();
                        if (statusData != null) {
                          let icon = this.getIcon("picked");
                          let empId = statusData["pickedBy"];
                          if (statusData["remarks"] == "डस्टबिन लोकेशन पर नहीं है") {
                            icon = this.getIcon("dustbinNotFound");
                          }
                          else if (statusData["remarks"] == "डस्टबिन खाली है") {
                            icon = this.getIcon("dustbinNotFilled");
                          }
                          let pickTime = "";
                          if (statusData["endTime"] != null) {
                            pickTime = statusData["endTime"].split(' ')[1].toString().substring(0, 5);
                          }
                          this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                            dustbinDetail[d] = icon + " At " + pickTime + " by  " + employee["name"] + " <b>(W)</b>";
                          });
                        }
                      }
                    );
                  }
                }
              }
            }
          }
        }
      }
    );
  }

  getPlanDustbin(dbPath: any, monthName: any, monthDate: any) {
    let planInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        planInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let j = 0; j < keyArray.length; j++) {
              let index = keyArray[j];
              let checkDate = new Date(index);
              if (checkDate.toString() == "Invalid Date") {
                let planData = data[index];
                if (planData["isAssigned"] == "true") {
                  this.getDustbinDetails(planData, monthName, monthDate, index);
                }
              }
              else {
                if (index == this.commonService.setTodayDate()) {
                  let planData = data[index];
                  // if (planData.length > 0) {
                  let planKey = Object.keys(planData);
                  for (let k = 0; k < planKey.length; k++) {
                    let keyIndex = planKey[k];
                    if (planData[keyIndex]["isAssigned"] == "true") {
                      this.getDustbinDetails(planData[keyIndex], monthName, monthDate, keyIndex);
                    }
                  }
                  // }
                }
              }
            }
          }
        }
      }
    );
  }

  getDustbinDetails(data: any, monthName: any, monthDate: any, index: any) {
    if (data["bins"] != "") {
      let bins = data["bins"].toString().replaceAll(" ", "").split(',');
      if (bins.length > 0) {
        for (let binIndex = 0; binIndex < bins.length; binIndex++) {
          let dustbin = bins[binIndex];
          let d = "day" + parseFloat(monthDate.split("-")[2]);

          let dustbinDetails = this.dustbinList.find(item => item.dustbin == dustbin);
          if (dustbinDetails != undefined) {
            let dbPath = "DustbinData/DustbinPickHistory/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/" + dustbin + "/" + index;
            let pickedDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
              pickData => {
                pickedDustbinInstance.unsubscribe();

                if (pickData == null) {
                  dustbinDetails[d] = this.getIcon("assignedNotPicked") + " Assigned but not Picked";
                }
                else {
                  if (pickData["endTime"] == null) {
                    dustbinDetails[d] = this.getIcon("assignedNotPicked") + " Assigned but not Picked";
                  }
                  else {
                    this.getDustbinPicked(pickData, d, dustbin, index, monthDate);
                  }
                }
              }
            );
          }
        }
      }
    }
  }

  getDustbinPicked(pickedData: any, day: any, dustbin: any, index: any, monthDate: any) {

    let icon = this.getIcon("picked");
    let empId = pickedData["pickedBy"];
    if (pickedData["remarks"] == "डस्टबिन लोकेशन पर नहीं है") {
      icon = this.getIcon("dustbinNotFound");
    }
    else if (pickedData["remarks"] == "डस्टबिन खाली है") {
      icon = this.getIcon("dustbinNotFilled");
    }
    let pickTime = "";
    if (pickedData["endTime"] != null) {
      pickTime = pickedData["endTime"].split(' ')[1].toString().substring(0, 5);
    }
    let dustbinDetails = this.dustbinList.find(item => item.dustbin == dustbin);
    if (dustbinDetails != undefined) {
      let filledPercentage = "";
      let remark = "";
      if (pickedData["Analysis"] != null) {
        if (pickedData["Analysis"]["filledPercentage"] != null) {
          filledPercentage = "<b>(" + pickedData["Analysis"]["filledPercentage"] + "%)</b>";
        }
        if (pickedData["Analysis"]["remark"] != null) {
          remark = pickedData["Analysis"]["remark"];
        }
      }
      if (dustbinDetails[day] == null) {
        dustbinDetails[day] = icon + filledPercentage + " at " + pickTime + "";
        this.getEmployee(dustbin, empId, monthDate, 1, index, remark);
      }
      else {
        dustbinDetails[day] = dustbinDetails[day] + " - " + icon + filledPercentage + " at " + pickTime + "";
        this.getEmployee(dustbin, empId, monthDate, 2, index, remark);
      }
    }
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

  getEmployee(dustbin: any, empId: any, monthDate: any, sequence: any, index: any, remark: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      let name = employee["name"];
      let d = "day" + parseFloat(monthDate.split("-")[2]);
      let dustbinDetails = this.dustbinList.find(item => item.dustbin == dustbin);
      if (dustbinDetails != undefined) {
        let detail1 = dustbinDetails[d].split(" - ")[0];
        let detail2 = dustbinDetails[d].split(" - ")[1];
        if (sequence == 1) {
          let detail = detail1 + " by " + name;
          if (remark != "") {
            detail = detail + "<br/>" + remark;
          }
          dustbinDetails[d] = detail;
          if (detail2 != null) {
            dustbinDetails[d] = dustbinDetails[d] + " - " + detail2;
          }
        }
        else if (sequence == 2) {
          let detail = detail1 + " - " + detail2 + " by " + name;
          if (remark != "") {
            detail = detail + "<br/>" + remark;
          }
          dustbinDetails[d] = detail;
        }
        if (dustbinDetails[d].includes(' - ')) {
          let detailArray = dustbinDetails[d].split(' - ');
          dustbinDetails[d] = detailArray[0] + "<br/>" + detailArray[1];
        }
      }
    });
  }

}
//#endregion