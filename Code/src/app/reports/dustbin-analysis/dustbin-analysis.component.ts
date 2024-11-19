import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "angularfire2/storage";


@Component({
  selector: "app-dustbin-analysis",
  templateUrl: "./dustbin-analysis.component.html",
  styleUrls: ["./dustbin-analysis.component.scss"],
})
export class DustbinAnalysisComponent implements OnInit {
  constructor(private commonService: CommonService, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, private modalService: NgbModal, private storage: AngularFireStorage) { }

  planList: any[];
  dustbinList: any[];
  selectedDate: any;
  currentYear: any;
  currentMonthName: any;
  currentSlide: any;
  dbPath: any;
  fillPercentage: any;
  txtManualRemark = "#txtManualRemark";
  userId: any;
  remark: any;
  planId: any;
  imageNotAvailablePath = "../assets/img/img-not-available.png";
  maxSlideCount: any;
  cityName: any;
  userType: any;
  isShowData: any;
  db: any;
  serviceName = "dustbin-analysis";
  autoPickedDustbin: any;
  canUpdateDustbinPickDetail: any;
  binDetail: dustbinDetails = {
    binId: "",
    filledTopViewImageUrl: "",
    filledFarFromImageUrl: "",
    emptyTopViewImageUrl: "",
    emptyFarFromImageUrl: "",
    dustbinNotFoundImageUrl: "",
    emptyDustbinFarViewImageUrl: "",
    emptyDustbinTopViewImageUrl: "",
    dustbinRemark: "",
    startTime: "--",
    endTime: "--",
    address: "",
    canDoAnalysis: "",
    analysisAt: "",
    analysisBy: "",
    filledPercentage: "",
    analysisRemarks: "",
    analysisDetail: "",
    manualRemarks: "",
    imageCaptureAddress: "",
    latLng: "",
    isAutoPicked: '0'
  };

  planDetail: planDetails = {
    planId: "",
    driverName: "",
    helper: "",
    secondHelper: "",
    vehicle: "",
    dutyStartTime: "",
    dutyEndTime: "",
    pickedCount: "",
    assignedCount: "",
    notAtLocationCount: "",
  };

  dustbinData: dustbinDetail = {
    pendingAnalysis: "0",
    refreshTime: "00:00",
  };
  showUpdateDetailButton = 0;
  showResetPickedButton = 0;
  showReStorePickedButton = 0;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userType = localStorage.getItem("userType");
    this.canUpdateDustbinPickDetail = localStorage.getItem("canUpdateDustbinPickDetail");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Dustbin-Management", "Dustbin-Analysis", localStorage.getItem("userID"));
    let element = <HTMLAnchorElement>(document.getElementById("dustbinReportLink"));
    element.href = this.cityName + "/3B/dustbin-planing";
    this.setPageAccessAndPermissions();
    this.setDefaultValues();
    if (this.userType == "External User" && this.cityName == "jodhpur") {
      this.isShowData = false;
    }
    else {
      this.isShowData = true;
      this.getPandingAnalysis();
      this.getAssignedPlans();
    }
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
        this.currentYear = this.selectedDate.split("-")[0];
        $(this.txtManualRemark).val("");
        if (this.isShowData == true) {
          this.getAssignedPlans();
        }
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  refreshData() {
    this.dustbinData.refreshTime = this.commonService.getCurrentTime();
    this.changePlan(this.planDetail.planId);
  }

  setDefaultValues() {
    this.selectedDate = this.commonService.setTodayDate();
    this.selectedDate = "2024-10-28";
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.dustbinData.refreshTime = this.commonService.getCurrentTime();
    this.fillPercentage = 0;
    $(this.txtManualRemark).val("");
  }

  getAssignedPlans() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAssignedPlans");
    this.planList = [];
    let assignedPlanPath = this.db.object("DustbinData/DustbinAssignment/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate).valueChanges().subscribe((assignedPlans) => {
      assignedPlanPath.unsubscribe();
      if (assignedPlans != null) {
        const promises = [];
        let keyArray = Object.keys(assignedPlans);
        for (let index = 0; index < keyArray.length; index++) {
          const planId = keyArray[index];
          promises.push(Promise.resolve(this.getDustbinAssignedPlans(planId, assignedPlans)));
        }

        Promise.all(promises).then((results) => {
          let merged = [];
          for (let i = 0; i < results.length; i++) {
            if (results[i]["status"] == "success") {
              merged = merged.concat(results[i]["data"]);
            }
          }
          this.planList = merged;
          if (this.planList.length > 0) {
            this.getBinsForSelectedPlan(this.planList[0]["planId"]);
          } else {
            this.resetData();
            this.commonService.setAlertMessage("error", "No plan created for the selected date.");
          }
        });
      } else {
        this.resetData();
        this.commonService.setAlertMessage("error", "No plan created for the selected date.");
      }

    });
  }

  getDustbinAssignedPlans(planId: any, assignedPlans: any) {
    return new Promise((resolve) => {
      let obj = {};
      let pickingPlanPathInstance = this.db.object("DustbinData/DustbinPickingPlans/" + planId).valueChanges().subscribe(pickingPlanData => {
        pickingPlanPathInstance.unsubscribe();
        if (pickingPlanData == null) {
          let pickingPlanWithDatePath = this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + planId).valueChanges().subscribe((pickingPlanWithDateData) => {
            pickingPlanWithDatePath.unsubscribe();
            if (pickingPlanWithDateData == null) {
              let pickingPlanHistory = this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + planId).valueChanges().subscribe((dustbinPlanHistoryData) => {
                pickingPlanHistory.unsubscribe();
                if (dustbinPlanHistoryData == null) {
                  resolve({ status: "fail", data: obj });
                }
                else {
                  if (dustbinPlanHistoryData["planType"] == null) {
                    if (assignedPlans[planId]["planName"] != "") {
                      obj = {
                        planId: assignedPlans[planId]["planId"],
                        planName: assignedPlans[planId]["planName"],
                        driver: assignedPlans[planId]["driver"],
                        helper: assignedPlans[planId]["helper"],
                        secondHelper: assignedPlans[planId]["secondHelper"],
                        thirdHelper: assignedPlans[planId]["thirdHelper"],
                        vehicle: assignedPlans[planId]["vehicle"],
                        bins: dustbinPlanHistoryData["bins"],
                        pickingSequence: dustbinPlanHistoryData["pickingSequence"],
                        resetPicked: ""
                      }
                      resolve({ status: "success", data: obj });
                    } else {
                      resolve({ status: "fail", data: obj });
                    }
                  }
                  else if (dustbinPlanHistoryData["planType"] == "Dustbin") {
                    if (assignedPlans[planId]["planName"] != "") {
                      obj = {
                        planId: assignedPlans[planId]["planId"],
                        planName: assignedPlans[planId]["planName"],
                        driver: assignedPlans[planId]["driver"],
                        helper: assignedPlans[planId]["helper"],
                        secondHelper: assignedPlans[planId]["secondHelper"],
                        thirdHelper: assignedPlans[planId]["thirdHelper"],
                        vehicle: assignedPlans[planId]["vehicle"],
                        bins: dustbinPlanHistoryData["bins"],
                        pickingSequence: dustbinPlanHistoryData["pickingSequence"],
                        resetPicked: ""
                      }
                      resolve({ status: "success", data: obj });
                    }
                    else {
                      resolve({ status: "fail", data: obj });
                    }
                  }
                  else {
                    resolve({ status: "fail", data: obj });
                  }
                }
              });
            }
            else {
              if (pickingPlanWithDateData["planType"] == null) {
                if (assignedPlans[planId]["planName"] != "") {
                  obj = {
                    planId: assignedPlans[planId]["planId"],
                    planName: assignedPlans[planId]["planName"],
                    driver: assignedPlans[planId]["driver"],
                    helper: assignedPlans[planId]["helper"],
                    secondHelper: assignedPlans[planId]["secondHelper"],
                    thirdHelper: assignedPlans[planId]["thirdHelper"],
                    vehicle: assignedPlans[planId]["vehicle"],
                    bins: pickingPlanWithDateData["bins"],
                    pickingSequence: pickingPlanWithDateData["pickingSequence"],
                    resetPicked: ""
                  }
                  resolve({ status: "success", data: obj });
                }
                else {
                  resolve({ status: "fail", data: obj });
                }
              }
              else if (pickingPlanWithDateData["planType"] == "Dustbin") {

                if (assignedPlans[planId]["planName"] != "") {
                  obj = {
                    planId: assignedPlans[planId]["planId"],
                    planName: assignedPlans[planId]["planName"],
                    driver: assignedPlans[planId]["driver"],
                    helper: assignedPlans[planId]["helper"],
                    secondHelper: assignedPlans[planId]["secondHelper"],
                    thirdHelper: assignedPlans[planId]["thirdHelper"],
                    vehicle: assignedPlans[planId]["vehicle"],
                    bins: pickingPlanWithDateData["bins"],
                    pickingSequence: pickingPlanWithDateData["pickingSequence"],
                    resetPicked: ""
                  }
                  resolve({ status: "success", data: obj });
                }
                else {
                  resolve({ status: "fail", data: obj });
                }

              }
              else {
                resolve({ status: "fail", data: obj });
              }
            }

          });
        }
        else {
          if (pickingPlanData["planType"] == null) {

            if (assignedPlans[planId]["planName"] != "") {
              obj = {
                planId: assignedPlans[planId]["planId"],
                planName: assignedPlans[planId]["planName"],
                driver: assignedPlans[planId]["driver"],
                helper: assignedPlans[planId]["helper"],
                secondHelper: assignedPlans[planId]["secondHelper"],
                thirdHelper: assignedPlans[planId]["thirdHelper"],
                vehicle: assignedPlans[planId]["vehicle"],
                bins: pickingPlanData["bins"],
                pickingSequence: pickingPlanData["pickingSequence"],
                resetPicked: ""
              }
              resolve({ status: "success", data: obj });
            }
            else {
              resolve({ status: "fail", data: obj });
            }
          }
          else if (pickingPlanData["planType"] == "Dustbin") {
            if (assignedPlans[planId]["planName"] != "") {
              obj = {
                planId: assignedPlans[planId]["planId"],
                planName: assignedPlans[planId]["planName"],
                driver: assignedPlans[planId]["driver"],
                helper: assignedPlans[planId]["helper"],
                secondHelper: assignedPlans[planId]["secondHelper"],
                thirdHelper: assignedPlans[planId]["thirdHelper"],
                vehicle: assignedPlans[planId]["vehicle"],
                bins: pickingPlanData["bins"],
                pickingSequence: pickingPlanData["pickingSequence"],
                resetPicked: ""

              }
              resolve({ status: "success", data: obj });
            }
            else {
              resolve({ status: "fail", data: obj });
            }
          }
          else {
            resolve({ status: "fail", data: obj });
          }
        }
      })

    });
  }

  resetData() {
    this.dustbinList = [];
    this.binDetail.binId = "0";
    $(this.txtManualRemark).val("");
    this.binDetail.filledTopViewImageUrl = this.imageNotAvailablePath;
    this.binDetail.filledFarFromImageUrl = this.imageNotAvailablePath;
    this.binDetail.emptyTopViewImageUrl = this.imageNotAvailablePath;
    this.binDetail.emptyFarFromImageUrl = this.imageNotAvailablePath;
    this.binDetail.dustbinNotFoundImageUrl = this.imageNotAvailablePath;
    this.binDetail.emptyDustbinFarViewImageUrl = this.imageNotAvailablePath;
    this.binDetail.emptyDustbinTopViewImageUrl = this.imageNotAvailablePath;
    this.binDetail.dustbinRemark = "";
    this.binDetail.startTime = " -- ";
    this.binDetail.endTime = " -- ";
    this.binDetail.address = " --";
    this.binDetail.analysisAt = "";
    this.binDetail.analysisBy = "";
    this.binDetail.filledPercentage = "";
    this.binDetail.analysisRemarks = "";
    this.binDetail.manualRemarks = "";
    this.binDetail.analysisDetail = "";
    this.binDetail.canDoAnalysis = "no";
    this.binDetail.latLng = "";
    this.binDetail.imageCaptureAddress = "";
    this.binDetail.isAutoPicked = '0'

    // now reset plan data
    this.planDetail.driverName = "--";
    this.planDetail.vehicle = "--";
    this.planDetail.pickedCount = "";
    this.planDetail.assignedCount = " -- ";
    this.planDetail.notAtLocationCount = " -- ";
  }

  getBinsForSelectedPlan(planId: string) {
    this.planId = planId;
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getBinsForSelectedPlan");
    $("#divLoader").show();

    this.resetData();
    /*
        let detail = this.planList.find(item => item.planId == planId);
        if (detail != undefined) {
          let bins = detail.bins;
          this.getBinsDetail(bins, planId);
        }
          */

    let pickingPlanPath = this.db.object("DustbinData/DustbinPickingPlans/" + planId).valueChanges().subscribe((pickingPlanData) => {
      if (pickingPlanData == null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getBinsForSelectedPlan", pickingPlanData);
        // now need to find with date
        let pickingPlanWithDatePath = this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + planId).valueChanges().subscribe((pickingPlanWithDateData) => {
          if (pickingPlanWithDateData == null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getBinsForSelectedPlan", pickingPlanWithDateData);
            let pickingPlanHistory = this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + planId).valueChanges().subscribe((dustbinPlanHistoryData) => {
              if (dustbinPlanHistoryData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getBinsForSelectedPlan", dustbinPlanHistoryData);
              }
              let bins = dustbinPlanHistoryData["bins"];
              let resetPicked = dustbinPlanHistoryData["resetPicked"] ? dustbinPlanHistoryData["resetPicked"] : "";
              let detail = this.planList.find(item => item.planId == this.planId);
              if (detail != undefined) {
                detail.resetPicked = resetPicked;
              }
              this.getBinsDetail(bins, planId);
              pickingPlanHistory.unsubscribe();
            });
          } else {
            let bins = pickingPlanWithDateData["bins"];
            let resetPicked = pickingPlanWithDateData["resetPicked"] ? pickingPlanWithDateData["resetPicked"] : "";
            let detail=this.planList.find(item=>item.planId==this.planId);
            if(detail!=undefined){
             detail.resetPicked=resetPicked;
            }
            this.getBinsDetail(bins, planId);
          }
          pickingPlanWithDatePath.unsubscribe();
        });
      } else {
        let bins = pickingPlanData["bins"];
        let resetPicked = pickingPlanData["resetPicked"] ? pickingPlanData["resetPicked"] : "";
        let detail=this.planList.find(item=>item.planId==this.planId);
        if(detail!=undefined){
         detail.resetPicked=resetPicked;
        }
        this.getBinsDetail(bins, planId);
      }
      pickingPlanPath.unsubscribe();

    });
  }

  getBinsDetail(bins: string, planId: string) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getBinsDetail");
    let firstIndexNeedtobeSelected = -1;
    this.autoPickedDustbin = "";
    let binsArray = bins.toString().split(",");
    this.dustbinList = [];
    for (let index = 0; index < binsArray.length; index++) {
      let binId = binsArray[index].replace(" ", "");
      let binsDetailsPath = this.db.object("DustbinData/DustbinDetails/" + binId + "/address").valueChanges().subscribe((dustbinAddress) => {
        let dustbinPickHistoryPath = this.db.object("DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + binId + "/" + planId).valueChanges().subscribe((dustbinHistoryData) => {
          if (dustbinHistoryData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getBinsDetail", dustbinHistoryData);
          }
          this.dustbinList.push({
            dustbinId: binId,
            address: dustbinAddress,
            iconClass: this.setIconClass(dustbinHistoryData),
            divClass: this.setBackgroudClasss(dustbinHistoryData),
            duration: this.setDuration(dustbinHistoryData),
            dustbinRemark: this.checkNullValue(dustbinHistoryData, "remarks"),
            filledTopViewImage: this.setImageUrl(dustbinHistoryData, "filled-top"),
            filledFarFromImage: this.setImageUrl(dustbinHistoryData, "filled-far"),
            emptyTopViewImage: this.setImageUrl(dustbinHistoryData, "empty-top"),
            emptyFarFromImage: this.setImageUrl(dustbinHistoryData, "empty-far"),
            emptyDustbinTopViewImage: this.setImageUrl(dustbinHistoryData, "empty-dustbin-top"),
            emptyDustbinFarFromImage: this.setImageUrl(dustbinHistoryData, "empty-dustbin-far"),
            dustbinNotFoundImage: this.setImageUrl(dustbinHistoryData, "not-at-location"),
            imageCaptureAddress: this.checkNullValue(dustbinHistoryData, "imageCaptureAddress"),
            latLng: this.checkNullValue(dustbinHistoryData, "latLng"),
            startTime: this.checkNullValue(dustbinHistoryData, "startTime"),
            endTime: this.checkNullValue(dustbinHistoryData, "endTime"),
            analysisBy: this.checkAnalysisValues(dustbinHistoryData, "analysisBy"),
            analysisAt: this.checkAnalysisValues(dustbinHistoryData, "analysisAt"),
            filledPercentage: this.checkAnalysisValues(dustbinHistoryData, "filledPercentage"),
            analysisRemark: this.checkAnalysisValues(dustbinHistoryData, "remark"),
            manualRemarks: this.checkAnalysisValues(dustbinHistoryData, "manualRemark"),
            isPicked: "0",
            isNotPickedIcon: this.checkAutoPickedValue(dustbinHistoryData, "isAutoPicked")
          });
          this.setPickedBins(index);

          if (this.dustbinList[index]["divClass"] != "address md-background" && firstIndexNeedtobeSelected == -1) {
            firstIndexNeedtobeSelected = index;
          }

          if (index == binsArray.length - 1) {
            setTimeout(() => {
              if (this.autoPickedDustbin != "") {
                this.updatePlanPickedDustbin();
                this.updateAutoPendingAnalysis();
                // $("#divLoader").hide();
              }
              else {
                $("#divLoader").hide();
              }

            }, 4000);

            if (firstIndexNeedtobeSelected != -1) {
              this.showDustbinData(firstIndexNeedtobeSelected);
            } else {
              this.binDetail.filledTopViewImageUrl = this.imageNotAvailablePath;
            }
            this.showPlanDetails(planId);
          }
          dustbinPickHistoryPath.unsubscribe();
        });
        binsDetailsPath.unsubscribe();
      });
    }

    // this.totalDustbins = binsArray.length;
  }


  updatePlanPickedDustbin() {
    let dbPath = "DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + this.planId + "/pickedDustbin";
    let instance = this.db.object(dbPath).valueChanges().subscribe(planData => {
      instance.unsubscribe();
      if (planData == null) {
        dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.planId + "/pickedDustbin";
        let planInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
          planInstance.unsubscribe();
          if (data != null) {
            let pickedDustbin = data.toString();
            let list = [];
            let listAuto = [];
            let pickedDustbinList = data.toString().split(",");
            let autoPickedDustbinList = this.autoPickedDustbin.split(",");
            for (let i = 0; i < pickedDustbinList.length; i++) {
              list.push({ dustbin: pickedDustbinList[i].toString().trim() });
            }
            for (let i = 0; i < autoPickedDustbinList.length; i++) {
              listAuto.push({ dustbin: autoPickedDustbinList[i].toString().trim() });
            }
            for (let i = 0; i < listAuto.length; i++) {
              let detail = list.find(item => item.dustbin == listAuto[i]["dustbin"]);
              if (detail == undefined) {
                pickedDustbin = pickedDustbin + ", " + listAuto[i]["dustbin"];
              }
            }
            dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.planId;
            this.db.object(dbPath).update({ pickedDustbin: pickedDustbin });
          }
          $("#divLoader").hide();
        })
      }
      else {
        let pickedDustbin = planData.toString();
        let list = [];
        let listAuto = [];
        let pickedDustbinList = planData.toString().split(",");
        let autoPickedDustbinList = this.autoPickedDustbin.split(",");
        for (let i = 0; i < pickedDustbinList.length; i++) {
          list.push({ dustbin: pickedDustbinList[i].toString().trim() });
        }
        for (let i = 0; i < autoPickedDustbinList.length; i++) {
          listAuto.push({ dustbin: autoPickedDustbinList[i].toString().trim() });
        }
        for (let i = 0; i < listAuto.length; i++) {
          let detail = list.find(item => item.dustbin == listAuto[i]["dustbin"]);
          if (detail == undefined) {
            pickedDustbin = pickedDustbin + ", " + listAuto[i]["dustbin"];
          }
        }
        dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.planId;
        this.db.object(dbPath).update({ pickedDustbin: pickedDustbin });
        $("#divLoader").hide();
      }
    })
  }

  updateAutoPendingAnalysis() {
    let list = this.autoPickedDustbin.split(",");
    if (list.length > 0) {
      let pending = list.length;
      let dbPath = "DustbinData/TotalDustbinAnalysisPending";
      let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
        instance.unsubscribe();
        if (data != null) {
          pending = pending + Number(data);
        }
        this.db.object("DustbinData/").update({ TotalDustbinAnalysisPending: pending.toString() });
      })
    }
  }

  setPickedBins(index: any) {
    let isPicked = false;
    let dustbinId = this.dustbinList[index]["dustbinId"];
    if (this.dustbinList[index]["emptyFarFromImage"] != this.imageNotAvailablePath) {
      isPicked = true;
    }
    if (this.dustbinList[index]["emptyTopViewImage"] != this.imageNotAvailablePath) {
      isPicked = true;
    }
    if (this.dustbinList[index]["filledFarFromImage"] != this.imageNotAvailablePath) {
      isPicked = true;
    }
    if (this.dustbinList[index]["filledTopViewImage"] != this.imageNotAvailablePath) {
      isPicked = true;
    }
    if (this.dustbinList[index]["emptyDustbinFarFromImage"] != this.imageNotAvailablePath) {
      isPicked = true;
    }
    if (this.dustbinList[index]["emptyDustbinTopViewImage"] != this.imageNotAvailablePath) {
      isPicked = true;
    }
    if (isPicked == true) {
      this.dustbinList[index]["isPicked"] = "1";
      if (this.userType == "External User" || this.canUpdateDustbinPickDetail != 1) {
        this.dustbinList[index]["isNotPickedIcon"] = "0";
      }
    }
    else {
      if (this.selectedDate != this.commonService.setTodayDate()) {
        this.dustbinList[index]["isNotPickedIcon"] = "1";
        if (this.userType == "External User" || this.canUpdateDustbinPickDetail != 1) {
          this.dustbinList[index]["isNotPickedIcon"] = "0";
          this.dustbinList[index]["divClass"] = "address md-background";
        }
        let planDetail = this.planList.find(item => item.planId == this.planId);
        if (planDetail != undefined) {
          let resetPickedList = planDetail.resetPicked.split(",");
          if (resetPickedList.length == 0) {
            this.getUnpickedDustbinDetail(dustbinId);
          }
          else {
            let isReset = false;
            for (let i = 0; i < resetPickedList.length; i++) {
              if (resetPickedList[i].trim() == dustbinId) {
                isReset = true;
                i = resetPickedList.length;
              }
            }
            if (isReset == false) {
              this.getUnpickedDustbinDetail(dustbinId);
            }
          }
        }
      }
      else {
        this.dustbinList[index]["isNotPickedIcon"] = "0";
        this.dustbinList[index]["divClass"] = "address md-background";
      }
    }
  }


  getUnpickedDustbinDetail(dustbinId: any) {
    let d = new Date(this.selectedDate);
    let newDate = new Date(d.setDate(d.getDate() - 60));
    let month = newDate.getMonth() + 1;
    let day = newDate.getDate();
    let date = (newDate.getFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day);
    this.getPreviousDustbinPickedDetail(0, date, 59, dustbinId);
  }

  getPreviousDustbinPickedDetail(index: any, date: any, lastDay: any, dustbinId: any) {
    if (index < lastDay) {
      let year = date.split("-")[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split("-")[1]) - 1);
      let dbPath = "DustbinData/DustbinPickHistory/" + year + "/" + monthName + "/" + date + "/" + dustbinId;
      let dustbinPickInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        dustbinPickInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            if (data[keyArray[0]]["Image"] != null) {
              if (data[keyArray[0]]["Image"]["Urls"] != null) {
                if (data[keyArray[0]]["Image"]["Urls"]["emptyFarFromImageUrl"] != null) {
                  let pickedBy = "0";
                  let detail = this.planList.find(item => item.planId == this.planId);
                  if (detail != undefined) {
                    pickedBy = detail.driver;
                  }
                  let obj = {
                    Image: data[keyArray[0]]["Image"],
                    address: data[keyArray[0]]["address"] ? data[keyArray[0]]["address"] : "",
                    latLng: data[keyArray[0]]["latLng"] ? data[keyArray[0]]["latLng"] : "",
                    remarks: data[keyArray[0]]["remarks"] ? data[keyArray[0]]["remarks"] : "",
                    zone: data[keyArray[0]]["zone"] ? data[keyArray[0]]["zone"] : "",
                    imageCaptureAddress: data[keyArray[0]]["imageCaptureAddress"] ? data[keyArray[0]]["imageCaptureAddress"] : "",
                    pickedBy: pickedBy,
                    duration: data[keyArray[0]]["duration"] ? data[keyArray[0]]["duration"] : 0,
                    isAutoPicked: 1
                  }
                  this.setUnpickDustbinDetail(dustbinId, obj);
                }
                else {
                  date = this.commonService.getNextDate(date, 1);
                  index++;
                  this.getPreviousDustbinPickedDetail(index, date, lastDay, dustbinId);
                }
              }
              else {
                date = this.commonService.getNextDate(date, 1);
                index++;
                this.getPreviousDustbinPickedDetail(index, date, lastDay, dustbinId);
              }
            }
            else {
              date = this.commonService.getNextDate(date, 1);
              index++;
              this.getPreviousDustbinPickedDetail(index, date, lastDay, dustbinId);
            }
          }
        }
        else {
          date = this.commonService.getNextDate(date, 1);
          index++;
          this.getPreviousDustbinPickedDetail(index, date, lastDay, dustbinId);
        }
      });
    }
  }

  setUnpickDustbinDetail(dustbinId: any, obj: any) {
    let detail = this.dustbinList.find(item => item.dustbinId == dustbinId);
    if (detail != null) {
      detail.address = obj["address"];
      detail.iconClass = this.setIconClass(obj);
      detail.divClass = this.setBackgroudClasss(obj);
      detail.duration = this.setDuration(obj);
      detail.dustbinRemark = this.checkNullValue(obj, "remarks");
      detail.filledTopViewImage = this.setImageUrl(obj, "filled-top");
      detail.filledFarFromImage = this.setImageUrl(obj, "filled-far");
      detail.emptyTopViewImage = this.setImageUrl(obj, "empty-top");
      detail.emptyFarFromImage = this.setImageUrl(obj, "empty-far");
      detail.emptyDustbinTopViewImage = this.setImageUrl(obj, "empty-dustbin-top");
      detail.emptyDustbinFarFromImage = this.setImageUrl(obj, "empty-dustbin-far");
      detail.dustbinNotFoundImage = this.setImageUrl(obj, "not-at-location");
      detail.imageCaptureAddress = this.checkNullValue(obj, "imageCaptureAddress");
      detail.latLng = this.checkNullValue(obj, "latLng");
      detail.isPicked = "1";
      this.setStartAndEndTime(dustbinId, obj);
    }
  }

  setStartAndEndTime(dustbinId: any, obj: any) {
    let preDuration = obj["duration"];
    let detail = this.planList.find(item => item.planId == this.planId);
    if (detail != undefined) {
      let index = 0;
      let pickSequenceList = detail.pickingSequence.split(",");
      if (pickSequenceList.length > 0) {
        for (let i = pickSequenceList.length - 1; i >= 0; i--) {
          if (pickSequenceList[i].trim() == dustbinId) {
            index = i;
            i = -1;
          }
        }
      }
      let preEndTime = "";
      let lastStartTime = "";
      for (let i = index - 1; i >= 0; i--) {
        let indexDustbinId = pickSequenceList[i].trim();
        let dustbinDetail = this.dustbinList.find(item => item.dustbinId == indexDustbinId);
        if (dustbinDetail != undefined) {
          if (dustbinDetail.endTime != undefined && dustbinDetail.endTime != "") {
            preEndTime = dustbinDetail.endTime;
            i = -1;
          }
        }
      }

      for (let i = index + 1; i < pickSequenceList.length; i++) {
        let indexDustbinId = pickSequenceList[i].trim();
        let dustbinDetail = this.dustbinList.find(item => item.dustbinId == indexDustbinId);
        if (dustbinDetail != undefined) {
          if (dustbinDetail.endTime != undefined && dustbinDetail.endTime != "") {
            lastStartTime = dustbinDetail.startTime;
            i = pickSequenceList.length;
          }
        }
      }

      if (lastStartTime == "") {
        let date = new Date(preEndTime);
        let newStartTime = date.setMinutes(date.getMinutes() + Math.floor(Math.random() * (20 - 10 + 1)) + 10);

        let newStartDate = new Date(newStartTime);
        let newStartDateTime = this.selectedDate + " " + (newStartDate.getHours() < 10 ? "0" : "") + newStartDate.getHours() + ":" + (newStartDate.getMinutes() < 10 ? "0" : "") + newStartDate.getMinutes() + ":" + (newStartDate.getSeconds() < 10 ? "0" : "") + newStartDate.getSeconds();

        let newEndTime = newStartDate.setMinutes(newStartDate.getMinutes() + Number(preDuration));
        let newEndDate = new Date(newEndTime);

        let newEndDateTime = this.selectedDate + " " + (newEndDate.getHours() < 10 ? "0" : "") + newEndDate.getHours() + ":" + (newEndDate.getMinutes() < 10 ? "0" : "") + newEndDate.getMinutes() + ":" + (newEndDate.getSeconds() < 10 ? "0" : "") + newEndDate.getSeconds();
        let dustbinDetail = this.dustbinList.find(item => item.dustbinId == dustbinId);
        if (dustbinDetail != undefined) {
          dustbinDetail.startTime = newStartDateTime;
          dustbinDetail.endTime = newEndDateTime;
          dustbinDetail.duration = preDuration + "  MIN <img src='../../../assets/img/clock-icon.png'>";
          obj["startTime"] = newStartDateTime;
          obj["pickDateTime"] = newEndDateTime;
          obj["endTime"] = newEndDateTime;
        }
      }
      else {
        let timeDifference = this.commonService.timeDifferenceMin(new Date(lastStartTime), new Date(preEndTime));
        let date = new Date(preEndTime);
        let timeToAdd = Math.round(timeDifference / 2);
        let newStartTime = date.setMinutes(date.getMinutes() + timeToAdd);
        let newStartDate = new Date(newStartTime);
        let newStartDateTime = this.selectedDate + " " + (newStartDate.getHours() < 10 ? "0" : "") + newStartDate.getHours() + ":" + (newStartDate.getMinutes() < 10 ? "0" : "") + newStartDate.getMinutes() + ":" + (newStartDate.getSeconds() < 10 ? "0" : "") + newStartDate.getSeconds();
        let newEndTime = newStartDate.setMinutes(newStartDate.getMinutes() + preDuration);
        let newEndDate = new Date(newEndTime);
        let newEndDateTime = this.selectedDate + " " + (newEndDate.getHours() < 10 ? "0" : "") + newEndDate.getHours() + ":" + (newEndDate.getMinutes() < 10 ? "0" : "") + newEndDate.getMinutes() + ":" + (newEndDate.getSeconds() < 10 ? "0" : "") + newEndDate.getSeconds();
        let dustbinDetail = this.dustbinList.find(item => item.dustbinId == dustbinId);
        if (dustbinDetail != undefined) {
          dustbinDetail.startTime = newStartDateTime;
          dustbinDetail.endTime = newEndDateTime;
          dustbinDetail.duration = preDuration + "  MIN <img src='../../../assets/img/clock-icon.png'>";
          obj["startTime"] = newStartDateTime;
          obj["pickDateTime"] = newEndDateTime;
          obj["endTime"] = newEndDateTime;
        }
      }
      let dbPath = "DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + dustbinId + "/" + this.planId;
      this.db.object(dbPath).update(obj);
      if (this.autoPickedDustbin == "") {
        this.autoPickedDustbin = dustbinId;
      }
      else {
        this.autoPickedDustbin = this.autoPickedDustbin + ", " + dustbinId;
      }
      this.planDetail.pickedCount = (Number(this.planDetail.pickedCount.replace("/", "")) + 1).toString() + "/";
    }
  }

  showPlanDetails(planId: any) {
    let plan = this.planList.find((item) => item.planId == planId);
    this.commonService.getEmplyeeDetailByEmployeeId(plan.driver).then((employee) => (this.planDetail.driverName = employee["name"] + " [D]"));
    this.commonService.getEmplyeeDetailByEmployeeId(plan.helper).then((employee) => (this.planDetail.helper = employee["name"] + " [H1]"));
    if (plan.secondHelper != undefined) {
      this.commonService.getEmplyeeDetailByEmployeeId(plan.secondHelper).then((employee) =>
        (this.planDetail.secondHelper = employee["name"] + " [H2]")
      );
    } else {
      this.planDetail.secondHelper = "Not Assigned";
    }

    this.planDetail.planId = planId;
    this.planDetail.vehicle = plan.vehicle;
    this.planDetail.pickedCount = this.getDustbinCounts("picked").toString() + "/";
    this.planDetail.assignedCount = this.getDustbinCounts("totalAssigned").toString();
    this.planDetail.notAtLocationCount = this.getDustbinCounts("notAtLocation").toString();
    this.planDetail.dutyStartTime = "";
    this.planDetail.dutyEndTime = "";
  }

  getDustbinCounts(countType: string) {
    let count = 0;
    if (countType == "totalAssigned") {
      count = this.dustbinList.length;
    }

    if (countType == "picked") {
      for (let index = 0; index < this.dustbinList.length; index++) {
        const element = this.dustbinList[index];
        if (element["isPicked"] == "1") {
          count++;
        }
      }
    }

    if (countType == "notAtLocation") {
      for (let index = 0; index < this.dustbinList.length; index++) {
        const element = this.dustbinList[index];
        if (element["dustbinNotFoundImage"] != this.imageNotAvailablePath) {
          count++;
        }
      }
    }
    return count;
  }

  checkAutoPickedValue(binData: any, fieldName: string) {
    let time = "0";
    if (binData != null) {
      if (binData[fieldName] != undefined) {
        time = binData[fieldName];
      }
    }

    return time;
  }

  checkNullValue(binData: any, fieldName: string) {
    let time = "";
    if (binData != null) {
      if (binData[fieldName] != undefined) {
        time = binData[fieldName];
      }
    }

    return time;
  }

  checkAnalysisValues(list: any, fieldName: string) {
    let value = "";
    if (list != null) {
      if (list["Analysis"] != undefined) {
        if (list["Analysis"][fieldName] != undefined) {
          value = list["Analysis"][fieldName];
        }
      }
    }

    return value;
  }

  setImageUrl(binData: any, imageType: any) {
    let imageUrl = this.imageNotAvailablePath;

    if (binData != undefined) {
      if (binData["Image"] != undefined) {
        if (imageType == "filled-top") {
          imageUrl = binData["Image"]["Urls"]["filledTopViewImageUrl"] == undefined ? imageUrl : binData["Image"]["Urls"]["filledTopViewImageUrl"];
        } else if (imageType == "filled-far") {
          imageUrl = binData["Image"]["Urls"]["filledFarFromImageUrl"] == undefined ? imageUrl : binData["Image"]["Urls"]["filledFarFromImageUrl"];
        } else if (imageType == "empty-top") {
          imageUrl = binData["Image"]["Urls"]["emptyTopViewImageUrl"] == undefined ? imageUrl : binData["Image"]["Urls"]["emptyTopViewImageUrl"];
        } else if (imageType == "empty-far") {
          imageUrl = binData["Image"]["Urls"]["emptyFarFromImageUrl"] == undefined ? imageUrl : binData["Image"]["Urls"]["emptyFarFromImageUrl"];
        } else if (imageType == "not-at-location") {
          imageUrl = binData["Image"]["Urls"]["dustbinNotFoundImageUrl"] == undefined ? imageUrl : binData["Image"]["Urls"]["dustbinNotFoundImageUrl"];
        } else if (imageType == "empty-dustbin-top") {
          imageUrl = binData["Image"]["Urls"]["emptyDustbinTopViewImageUrl"] == undefined ? imageUrl : binData["Image"]["Urls"]["emptyDustbinTopViewImageUrl"];
        } else if (imageType == "empty-dustbin-far") {
          imageUrl = binData["Image"]["Urls"]["emptyDustbinFarFromImageUrl"] == undefined ? imageUrl : binData["Image"]["Urls"]["emptyDustbinFarFromImageUrl"];
        }
      }
    }

    return imageUrl;
  }

  setIconClass(binData: any) {
    // icon for "no action taken"
    let iconClass = "fas fa-ellipsis-h";

    if (binData != null) {
      // icon for "picked dustbin"
      iconClass = "fas fa-check-double";

      if (binData["Image"] == undefined) {
        // icon for "No Image Found"
        iconClass = "fas fa-times-circle";
      } else if (binData["Analysis"] != undefined) {
        // icon for "Analysis done"
        iconClass = "fas fa-diagnoses";
      } else {
        let dustbinNotFoundImage =
          binData["Image"]["Urls"]["dustbinNotFoundImageUrl"];
        if (dustbinNotFoundImage != undefined) {
          // icon for "dustbin not at location"
          iconClass = "fas not-at-location";
        } else {
          let filledTopViewImageUrl = binData["Image"]["Urls"]["filledTopViewImageUrl"];
          let emptyFarFromImageUrl = binData["Image"]["Urls"]["emptyFarFromImageUrl"];
          let emptyTopViewImageUrl = binData["Image"]["Urls"]["emptyTopViewImageUrl"];
          let filledFarFromImageUrl = binData["Image"]["Urls"]["filledFarFromImageUrl"];
          let emptyDustbinTopViewImage = binData["Image"]["Urls"]["emptyDustbinTopViewImageUrl"];
          let emptyDustbinFarFromImage = binData["Image"]["Urls"]["emptyDustbinFarFromImageUrl"];

          if (emptyDustbinTopViewImage != undefined && emptyDustbinFarFromImage != undefined) {
            iconClass = "fas fa-check-double";
          } else if (filledTopViewImageUrl == undefined || emptyFarFromImageUrl == undefined || emptyTopViewImageUrl == undefined || filledFarFromImageUrl == undefined) {
            // icon for "If any one is missing"
            iconClass = "fas warning";
          }
        }
      }
    }

    return iconClass;
  }

  setBackgroudClasss(binData: any) {
    // class for "no action taken"
    let divClass = "address md-background";

    if (binData != undefined) {
      // class for "bin is picked"
      divClass = "address ";
    }
    else {
      divClass = "address ";
    }

    return divClass;
  }

  setDuration(binData: any) {
    let duration = "";

    if (binData != null) {
      if (binData["Image"] != undefined) {
        let dustbinNotFoundImage =
          binData["Image"]["Urls"]["dustbinNotFoundImageUrl"];
        if (dustbinNotFoundImage != undefined) {
          duration = "";
        } else if (binData["duration"] != null) {
          duration = binData["duration"] + "  MIN <img src='../../../assets/img/clock-icon.png'>";
        }
      }
    }

    return duration;
  }

  setPageAccessAndPermissions() {
    let userType = localStorage.getItem("userType");
    this.userId = localStorage.getItem("userID");
    if (userType == "External User") {
      $("#divAccess").hide();
    }
  }

  getPandingAnalysis() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getPandingAnalysis");
    let dbPath = "DustbinData/TotalDustbinAnalysisPending";
    this.db.object(dbPath).valueChanges().subscribe((data) => {
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getPandingAnalysis", data);
        let pending = Number(data);
        if (pending < 0) {
          pending = 0;
        }
        this.dustbinData.pendingAnalysis = pending.toString();
      }
    });
  }

  showDustbinData(index: any) {
    if (this.dustbinList[index]["filledTopViewImage"] != this.imageNotAvailablePath) {
      $("#ImageLoader").show();
    }

    this.binDetail.binId = this.dustbinList[index]["dustbinId"];
    this.binDetail.address = this.dustbinList[index]["address"];
    this.binDetail.startTime = this.commonService.gteHrsAndMinutesOnly(this.dustbinList[index]["startTime"]);
    this.binDetail.endTime = this.commonService.gteHrsAndMinutesOnly(this.dustbinList[index]["endTime"]);
    this.binDetail.filledTopViewImageUrl = this.dustbinList[index]["filledTopViewImage"];
    this.binDetail.filledFarFromImageUrl = this.dustbinList[index]["filledFarFromImage"];
    this.binDetail.emptyFarFromImageUrl = this.dustbinList[index]["emptyFarFromImage"];
    this.binDetail.emptyTopViewImageUrl = this.dustbinList[index]["emptyTopViewImage"];
    this.binDetail.emptyDustbinTopViewImageUrl = this.dustbinList[index]["emptyDustbinTopViewImage"];
    this.binDetail.emptyDustbinFarViewImageUrl = this.dustbinList[index]["emptyDustbinFarFromImage"];
    this.binDetail.dustbinNotFoundImageUrl = this.dustbinList[index]["dustbinNotFoundImage"];
    this.binDetail.latLng = this.dustbinList[index]["latLng"];
    this.binDetail.imageCaptureAddress = this.dustbinList[index]["imageCaptureAddress"];

    this.binDetail.analysisBy = this.dustbinList[index]["analysisBy"];
    this.binDetail.analysisAt = this.dustbinList[index]["analysisAt"];
    this.binDetail.filledPercentage = this.dustbinList[index]["filledPercentage"];
    this.binDetail.dustbinRemark = this.dustbinList[index]["dustbinRemark"];
    this.binDetail.analysisRemarks = this.dustbinList[index]["analysisRemark"];
    this.binDetail.manualRemarks = this.dustbinList[index]["manualRemarks"];
    this.binDetail.isAutoPicked = this.dustbinList[index]['isNotPickedIcon'];

    setTimeout(function () {
      $("#ImageLoader").hide();
    }, 800);

    this.currentSlide = 1;
    this.showHideBottomSlideBoxes();
    this.setSlideImage(this.currentSlide, "selected");
    this.setBackgroundColorForSelectedItem(index);
    this.setFillingPercentage();
    this.setRemark();
    this.setAnalysisDetails();
    this.binDetail.canDoAnalysis = this.canAnalysisTheBin();
    this.hideShowAutoPick();
  }

  setFillingPercentage() {
    if (this.binDetail.filledPercentage == undefined || this.binDetail.filledPercentage == "") {
      this.binDetail.filledPercentage = "0";
      this.fillPercentage = "0";
    }

    let element = <HTMLInputElement>(document.getElementById("radio" + this.binDetail.filledPercentage + ""));
    element.checked = true;
  }

  setRemark() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "setRemark");
    let chkRemark1 = <HTMLInputElement>document.getElementById("chkRemark1");
    let chkRemark2 = <HTMLInputElement>document.getElementById("chkRemark2");

    chkRemark1.checked = false;
    chkRemark2.checked = false;

    if (this.binDetail.analysisRemarks != "") {
      let remark = this.binDetail.analysisRemarks.split(",");
      for (let index = 0; index < remark.length; index++) {
        let value = remark[index];
        if (value == "कचरा बाहर फैला हुआ है") {
          chkRemark1.checked = true;
        }
        if (value == "डस्टबिन टूटा हुआ है") {
          chkRemark2.checked = true;
        }
      }
    }

    // Need to get isBroken data from dustbinDetail
    if (chkRemark2.checked == false) {
      let isBrokenPath = this.db.object("DustbinData/DustbinDetails/" + this.binDetail.binId + "/isBroken").valueChanges().subscribe((isBroken) => {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "setRemark", isBroken);
        let chkRemark2 = <HTMLInputElement>(
          document.getElementById("chkRemark2")
        );
        chkRemark2.checked = Boolean(isBroken);
        isBrokenPath.unsubscribe();
      });
    }
  }

  setAnalysisDetails() {
    if (this.binDetail.analysisBy != "") {
      this.commonService.getPortalUserDetailById(this.binDetail.analysisBy).then((userData: any) => {
        if (userData != undefined) {
          let date = this.binDetail.analysisAt.split(" ");
          let analysisTime = date[0].split("-")[2] + " " + this.commonService.getCurrentMonthName(Number(date[0].split("-")[1]) - 1) + ", " + date[1];
          this.binDetail.analysisDetail = "BY : " + userData["name"] + "<br/> (" + analysisTime + ")";
        } else {
          this.commonService.setAlertMessage("error", "Something went wrong, Please logout and login again.");
        }
      });
    } else {
      this.binDetail.analysisDetail = "";
    }
  }

  canAnalysisTheBin() {
    let canDo = "yes";
    if (this.binDetail.filledTopViewImageUrl == this.imageNotAvailablePath) {
      canDo = "no";
    } else if (this.binDetail.dustbinNotFoundImageUrl != this.imageNotAvailablePath) {
      canDo = "no";
    }

    return canDo;
  }

  showHideBottomSlideBoxes() {
    $("#box1").hide();
    $("#box2").hide();
    $("#box3").hide();
    $("#box4").hide();

    if (this.binDetail.dustbinRemark == "डस्टबिन खाली है") {
      $("#box1").show();
      $("#box2").show();
      $("#hText1").html("ऊपर से खाली");
      $("#hText2").html("खाली दूर से");
      this.binDetail.filledTopViewImageUrl = this.binDetail.emptyDustbinTopViewImageUrl;
      this.binDetail.filledFarFromImageUrl = this.binDetail.emptyDustbinFarViewImageUrl;
      this.maxSlideCount = 2;
    } else if (this.binDetail.dustbinRemark == "डस्टबिन लोकेशन पर नहीं है") {
      $("#box1").show();
      $("#preLink").hide();
      $("#nextLink").hide();
      $("#hText1").html("लोकेशन पर नहीं है");
      this.binDetail.filledTopViewImageUrl = this.binDetail.dustbinNotFoundImageUrl;
    } else {
      $("#box1").show();
      $("#box2").show();
      $("#box3").show();
      $("#box4").show();
      $("#preLink").show();
      $("#nextLink").show();
      $("#hText1").html("ऊपर से भरा ");
      $("#hText2").html("भरा दूर से");
      this.binDetail.filledTopViewImageUrl = this.binDetail.filledTopViewImageUrl;
      this.maxSlideCount = 4;
    }
  }

  setBackgroundColorForSelectedItem(index: any) {
    for (let i = 0; i < this.dustbinList.length; i++) {
      $("#filter" + i).removeAttr("style");
    }

    $("#filter" + index).attr("style", "background :#7dcd5a");
  }

  updateBinListAndDetails() {
    // set update values into the list
    let data = this.dustbinList.find((item) => item.dustbinId == this.binDetail.binId);
    data.analysisAt = this.commonService.getTodayDateTime();
    data.analysisBy = this.userId;
    data.analysisRemark = this.getRemarks();
    data.manualRemarks = $(this.txtManualRemark).val().toString();
    data.filledPercentage = this.fillPercentage;
    data.iconClass = "fas fa-diagnoses";

    this.binDetail.analysisBy = this.userId;
    this.binDetail.analysisAt = this.commonService.getTodayDateTime();
    this.binDetail.filledPercentage = this.fillPercentage;
    this.binDetail.analysisRemarks = this.getRemarks();
    this.binDetail.manualRemarks = $(this.txtManualRemark).val().toString();
  }

  updatePendingAnalysis() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updatePendingAnalysis");
    if (this.binDetail.analysisAt == "") {
      let pendingCountPath = this.db.object("DustbinData/TotalDustbinAnalysisPending").valueChanges().subscribe((pedingCount) => {
        pendingCountPath.unsubscribe();
        if (pedingCount != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updatePendingAnalysis", pedingCount);
        }
        this.db.object("DustbinData").update({
          TotalDustbinAnalysisPending: Number(pedingCount) - 1,
        });
      });
    }
  }

  saveDustbinAnalysis() {

    if (this.binDetail.canDoAnalysis == "yes") {
      this.db.object("DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.binDetail.binId + "/" + this.planDetail.planId + "/Analysis/").update({ filledPercentage: this.fillPercentage, analysisAt: this.commonService.getTodayDateTime(), analysisBy: this.userId, remark: this.getRemarks(), manualRemark: $(this.txtManualRemark).val() });
      this.updatePendingAnalysis();
      this.updateBinListAndDetails();
      this.setAnalysisDetails();
      this.updateIsDustbinBroken();
      this.commonService.setAlertMessage("success", "Data has been added successfully.");
    } else {
      this.commonService.setAlertMessage("error", "Can not do analysis for this bin.");
    }
  }

  updateIsDustbinBroken() {
    let element = <HTMLInputElement>document.getElementById("chkRemark2");
    this.db.object("DustbinData/DustbinDetails/" + this.binDetail.binId + "/").update({ isBroken: element.checked, });
  }

  getRemarks() {
    let remarks = "";
    let element = <HTMLInputElement>document.getElementById("chkRemark1");
    if (element.checked == true) {
      remarks += "कचरा बाहर फैला हुआ है";
    }

    element = <HTMLInputElement>document.getElementById("chkRemark2");
    if (element.checked == true) {
      if (remarks != "") {
        remarks += ",";
      }
      remarks += "डस्टबिन टूटा हुआ है";
    }

    return remarks;
  }

  changePlan(planId: any) {
    this.getBinsForSelectedPlan(planId);
  }

  getFillPercentage(percentage: any) {
    this.fillPercentage = Number(percentage);
  }

  getRemark(remarkNo: any) {
    let element = <HTMLInputElement>(document.getElementById("remark" + remarkNo));
    if (element.checked == true) {
      this.remark = "कचरा बाहर फैला हुआ है।";
    } else {
      this.remark = null;
    }
  }

  setSlideImage(slideIndex: any, clickType: string) {
    if (clickType == "selected") {
      this.currentSlide = slideIndex;
    } else if (clickType == "previous") {
      if (this.currentSlide == 1) {
        this.currentSlide = this.maxSlideCount + 1;
      }
      this.currentSlide = this.currentSlide - 1;
    } else if (clickType == "next") {
      if (this.currentSlide == this.maxSlideCount) {
        this.currentSlide = 0;
      }
      this.currentSlide = this.currentSlide + 1;
    }

    for (let i = 1; i <= 4; i++) {
      let slideImage = <HTMLImageElement>document.getElementById("img" + i);
      this.removeOldClasses(i);
      if (i == this.currentSlide) {
        slideImage.src = "../../../assets/img/dustbin-hover.png";
        $("#box" + i).addClass("icon-box active-box text-center");
        $("#slide" + i).addClass("carousel-item active");
        $("#i" + i).show();
      } else {
        slideImage.src = "../../../assets/img/dustbin.png";
        $("#box" + i).addClass("icon-box  text-center");
        $("#slide" + i).addClass("carousel-item");
        $("#i" + i).hide();
      }
    }
  }

  removeOldClasses(index: any) {
    let slideClass = $("#slide" + index).attr("class");
    let classname = $("#box" + index).attr("class");
    $("#slide" + index).removeClass(slideClass);
    $("#box" + index).removeClass(classname);
  }
  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 480;
    let width = 500;

    if (type === 'UpdateDustbinPickedDetail') {
      $('#txtStartTime').val(this.binDetail.startTime || '');
      $('#txtEndTime').val(this.binDetail.endTime || '');

    }
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");

  }

  closeModel() {
    this.modalService.dismissAll();
  }
  updateDustbinPickupDetail = () => {

    let startTime = $('#txtStartTime').val();
    let endTime = $('#txtEndTime').val();
    const imageElements = {
      filledTopView: $('#imgFilledTopView')[0] as HTMLInputElement,
      filledFarFrom: $('#imgFilledFarFrom')[0] as HTMLInputElement,
      emptyTopView: $('#imgEmptyTopView')[0] as HTMLInputElement,
      emptyFarFrom: $('#imgEmptyFarFrom')[0] as HTMLInputElement
    };

    // Check if end time is after start time
    if (new Date(`${this.selectedDate} ${endTime}`) < new Date(`${this.selectedDate} ${startTime}`)) {
      this.commonService.setAlertMessage("error", "End time must be greater than start time.");
      return;
    }

    $("#divLoader").show();
    const storageCityName = this.commonService.getFireStoreCity();
    const token = new Date().getTime();
    const urlObj = {};
    const uploadPromises = [];

    const imageDetails = [
      { key: "filledTopView", name: "filledTopViewImage.jpg" },
      { key: "filledFarFrom", name: "filledFarFromImage.jpg" },
      { key: "emptyTopView", name: "emptyTopViewImage.jpg" },
      { key: "emptyFarFrom", name: "emptyFarFromImage.jpg" }
    ];

    imageDetails.forEach(({ key, name }) => {
      const fileInput = imageElements[key];
      const file = fileInput.files ? fileInput.files[0] : null;
      if (file) {
        const url = `https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/${storageCityName}%2FDustbinImages%2FDustbinPickHistory%2F${this.currentYear}%2F${this.currentMonthName}%2F${this.selectedDate}%2F${this.binDetail.binId}%2F${this.planDetail.planId}%2F${name}?alt=media&token=${token}`;
        const filePath = `/${storageCityName}/DustbinImages/DustbinPickHistory/${this.currentYear}/${this.currentMonthName}/${this.selectedDate}/${this.binDetail.binId}/${this.planDetail.planId}/${name}`;

        urlObj[`${key}ImageUrl`] = url;
        uploadPromises.push(this.storage.upload(filePath, file));
      }
    });

    Promise.all(uploadPromises).then((responses) => {
      let dbPath = "DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.binDetail.binId + "/" + this.planDetail.planId + "/";
      let duration = this.commonService.timeDifferenceMin(new Date(this.selectedDate + " " + endTime), new Date(this.selectedDate + " " + startTime))
      let timeData = {
        endTime: this.selectedDate + " " + endTime,
        startTime: this.selectedDate + " " + startTime,
        pickDateTime: this.selectedDate + " " + endTime,
        duration: duration
      }

      this.db.object(dbPath).update(timeData);
      this.db.object(dbPath + 'Image/Urls').update(urlObj);

      let data = this.dustbinList.find((item) => item.dustbinId == this.binDetail.binId);
      data.startTime = this.selectedDate + " " + startTime;
      data.endTime = this.selectedDate + " " + endTime;
      this.binDetail.startTime = this.commonService.gteHrsAndMinutesOnly(this.selectedDate + " " + startTime);
      this.binDetail.endTime = this.commonService.gteHrsAndMinutesOnly(this.selectedDate + " " + endTime);
      let dustbinDetail = this.dustbinList.find(item => item.dustbinId === this.binDetail.binId);
      if (dustbinDetail != undefined) {
        dustbinDetail.duration = duration + "  MIN <img src='../../../assets/img/clock-icon.png'>";
        dustbinDetail.startTime = data.startTime;
        dustbinDetail.endTime = data.endTime;
      }
      Object.keys(urlObj).map(key => {
        this.binDetail[key] = urlObj[key];
        data[key.replace("Url", "")] = urlObj[key];
      });

      // To reset model fields
      $("#txtStartTime").val("");
      $("#txtEndTime").val("");
      $("#imgFilledTopView").val("");
      $("#imgFilledFarFrom").val("");
      $("#imgEmptyTopView").val("");
      $("#imgEmptyFarFrom").val("");
      this.commonService.setAlertMessage("success", "Dustbin picked detail updated successfully.");
      this.closeModel()
      $("#divLoader").hide();

    });
  }

  resetDustbinPickedDetail() {
    $("#divLoader").show();
    let planDetail = this.planList.find(item => item.planId == this.planId);
    if (planDetail != undefined) {
      if (planDetail.resetPicked == "") {
        planDetail.resetPicked = this.binDetail.binId;
      }
      else {
        planDetail.resetPicked = planDetail.resetPicked+"," + this.binDetail.binId;
      }
      let dbPath = "DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.binDetail.binId + "/" + this.planDetail.planId + "/";
      this.db.object(dbPath).set(null);
      let pending = 0;
      dbPath = "DustbinData/TotalDustbinAnalysisPending";
      let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
        instance.unsubscribe();
        if (data != null) {
          pending = Number(data) - 1;
        }
        this.db.object("DustbinData/").update({ TotalDustbinAnalysisPending: pending.toString() });
      });
      // now need to find with date
      let pickingPlanWithDatePath = this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + this.planId).valueChanges().subscribe((pickingPlanWithDateData) => {
        pickingPlanWithDatePath.unsubscribe();
        if (pickingPlanWithDateData == null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "resetDustbinPickedDetail", pickingPlanWithDateData);
          let pickingPlanHistory = this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.planId).valueChanges().subscribe((dustbinPlanHistoryData) => {
            pickingPlanHistory.unsubscribe();
            if (dustbinPlanHistoryData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "resetDustbinPickedDetail", dustbinPlanHistoryData);
              let pickedDustbinList = dustbinPlanHistoryData["pickedDustbin"].split(",");
              let pickedDustbin = "";
              for (let i = 0; i < pickedDustbinList.length; i++) {
                if (pickedDustbinList[i].toString().trim() != this.binDetail.binId) {
                  if (pickedDustbin == "") {
                    pickedDustbin = pickedDustbinList[i].toString().trim();
                  }
                  else {
                    pickedDustbin = pickedDustbin + "," + pickedDustbinList[i].toString().trim();
                  }
                }
              }
              let resetPicked = "";
              if (dustbinPlanHistoryData["resetPicked"] == null || dustbinPlanHistoryData["resetPicked"] == "") {
                resetPicked = this.binDetail.binId;
              }
              else {
                resetPicked = dustbinPlanHistoryData["resetPicked"] + "," + this.binDetail.binId;
              }
              this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.planId).update({ pickedDustbin: pickedDustbin, resetPicked: resetPicked });
            }
            this.updateRsetBinDetail();
            $("#divLoader").hide();
          });
        } else {
          let pickedDustbinList = pickingPlanWithDateData["pickedDustbin"].split(",");
          let pickedDustbin = "";
          for (let i = 0; i < pickedDustbinList.length; i++) {
            if (pickedDustbinList[i].toString().trim() != this.binDetail.binId) {
              if (pickedDustbin == "") {
                pickedDustbin = pickedDustbinList[i].toString().trim();
              }
              else {
                pickedDustbin = pickedDustbin + "," + pickedDustbinList[i].toString().trim();
              }
            }
          }
          let resetPicked = "";
          if (pickingPlanWithDateData["resetPicked"] == null || pickingPlanWithDateData["resetPicked"] == "") {
            resetPicked = this.binDetail.binId;
          }
          else {
            resetPicked = pickingPlanWithDateData["resetPicked"] + "," + this.binDetail.binId;
          }
          this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + this.planId).update({ pickedDustbin: pickedDustbin, resetPicked: resetPicked });
          this.updateRsetBinDetail();
          $("#divLoader").hide();
        }
      });
    }
  }

  restoreDustbinPickedDetail() {
    $("#divLoader").show();
    this.getUnpickedDustbinDetail(this.binDetail.binId);
    setTimeout(() => {
      let pending = 0;
      let dbPath = "DustbinData/TotalDustbinAnalysisPending";
      let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
        instance.unsubscribe();
        if (data != null) {
          pending = Number(data) + 1;
        }
        this.db.object("DustbinData/").update({ TotalDustbinAnalysisPending: pending.toString() });
      });

      let pickingPlanWithDatePath = this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + this.planId).valueChanges().subscribe((pickingPlanWithDateData) => {
        pickingPlanWithDatePath.unsubscribe();
        if (pickingPlanWithDateData == null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "restoreDustbinPickedDetail", pickingPlanWithDateData);
          let pickingPlanHistory = this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.planId).valueChanges().subscribe((dustbinPlanHistoryData) => {
            pickingPlanHistory.unsubscribe();
            if (dustbinPlanHistoryData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "restoreDustbinPickedDetail", dustbinPlanHistoryData);
              let pickedDustbin = dustbinPlanHistoryData["pickedDustbin"];
              if (pickedDustbin == "") {
                pickedDustbin = this.binDetail.binId;
              }
              else {
                pickedDustbin = pickedDustbin + "," + this.binDetail.binId;
              }
              let resetPicked = "";
              if (dustbinPlanHistoryData["resetPicked"] == null || dustbinPlanHistoryData["resetPicked"] == "") {
              }
              else {

                let resetPickedList = dustbinPlanHistoryData["resetPicked"].split(",");
                for (let i = 0; i < resetPickedList.length; i++) {
                  if (resetPickedList[i].toString().trim() != this.binDetail.binId) {
                    if (resetPicked == "") {
                      resetPicked = resetPickedList[i].toString();
                    }
                    else {
                      resetPicked = resetPicked + "," + resetPickedList[i].toString();
                    }
                  }
                }
                let detail = this.planList.find(item => item.planId == this.planId);
                if (detail != undefined) {
                  detail.resetPicked = resetPicked;
                }
              }

              this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.planId).update({ pickedDustbin: pickedDustbin, resetPicked: resetPicked });
            }
            this.updateRestoreBinDetail();
            $("#divLoader").hide();
          });
        } else {
          let pickedDustbin = pickingPlanWithDateData["pickedDustbin"];
          if (pickedDustbin == "") {
            pickedDustbin = this.binDetail.binId;
          }
          else {
            pickedDustbin = pickedDustbin + "," + this.binDetail.binId;
          }
          let resetPicked = "";
          if (pickingPlanWithDateData["resetPicked"] == null || pickingPlanWithDateData["resetPicked"] == "") {
          }
          else {
            let resetPickedList = pickingPlanWithDateData["resetPicked"].split(",");
            for (let i = 0; i < resetPickedList.length; i++) {
              if (resetPickedList[i].toString().trim() != this.binDetail.binId) {
                if (resetPicked == "") {
                  resetPicked = resetPickedList[i].toString();
                }
                else {
                  resetPicked = resetPicked + "," + resetPickedList[i].toString();
                }
              }
            }
          }
          this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + this.planId).update({ pickedDustbin: pickedDustbin, resetPicked: resetPicked });
          this.updateRestoreBinDetail();
          $("#divLoader").hide();
        }
      });

    }, 4000);

  }

  updateRestoreBinDetail() {
    let detail = this.dustbinList.find(item => item.dustbinId == this.binDetail.binId);
    if (detail != undefined) {
      this.binDetail.address = detail.address;
      this.binDetail.startTime = this.commonService.gteHrsAndMinutesOnly(detail.startTime);
      this.binDetail.endTime = this.commonService.gteHrsAndMinutesOnly(detail.endTime);
      this.binDetail.filledTopViewImageUrl = detail.filledTopViewImage;
      this.binDetail.filledFarFromImageUrl = detail.filledFarFromImage;
      this.binDetail.emptyFarFromImageUrl = detail.emptyFarFromImage;
      this.binDetail.emptyTopViewImageUrl = detail.emptyTopViewImage;
      this.binDetail.emptyDustbinTopViewImageUrl = detail.emptyDustbinTopViewImage;
      this.binDetail.emptyDustbinFarViewImageUrl = detail.emptyDustbinFarFromImage;
      this.binDetail.dustbinNotFoundImageUrl = detail.dustbinNotFoundImage;
      this.binDetail.latLng = detail.latLng;
      this.binDetail.imageCaptureAddress = detail.imageCaptureAddress;
      this.binDetail.isAutoPicked = "1";
    }
    this.hideShowAutoPick();
  }

  updateRsetBinDetail() {
    let data = this.dustbinList.find((item) => item.dustbinId == this.binDetail.binId);
    data.startTime = "";
    data.endTime = "";
    let dustbinDetail = this.dustbinList.find(item => item.dustbinId === this.binDetail.binId);
    if (dustbinDetail != undefined) {
      dustbinDetail.duration = "";
      dustbinDetail.startTime = "";
      dustbinDetail.endTime = "";
      dustbinDetail.filledTopViewImage = this.imageNotAvailablePath;
      dustbinDetail.filledFarFromImage = this.imageNotAvailablePath;
      dustbinDetail.emptyFarFromImage = this.imageNotAvailablePath;
      dustbinDetail.emptyTopViewImage = this.imageNotAvailablePath;
      dustbinDetail.emptyDustbinTopViewImage = this.imageNotAvailablePath;
      dustbinDetail.emptyDustbinFarFromImage = this.imageNotAvailablePath;
      dustbinDetail.dustbinNotFoundImage = this.imageNotAvailablePath;
      dustbinDetail.latLng = "";
      dustbinDetail.imageCaptureAddress = "";

      this.binDetail.startTime = "";
      this.binDetail.endTime = "";
      this.binDetail.filledTopViewImageUrl = this.imageNotAvailablePath;
      this.binDetail.filledFarFromImageUrl = this.imageNotAvailablePath;
      this.binDetail.emptyFarFromImageUrl = this.imageNotAvailablePath;
      this.binDetail.emptyTopViewImageUrl = this.imageNotAvailablePath;
      this.binDetail.emptyDustbinTopViewImageUrl = this.imageNotAvailablePath;
      this.binDetail.emptyDustbinFarViewImageUrl = this.imageNotAvailablePath;
      this.binDetail.dustbinNotFoundImageUrl = this.imageNotAvailablePath;
      this.binDetail.latLng = "";
      this.binDetail.imageCaptureAddress = "";
    }
    this.hideShowAutoPick();
  }

  hideShowAutoPick() {
    let detail = this.dustbinList.find(item => item.dustbinId == this.binDetail.binId);
    if (detail != undefined) {
      if (detail.isNotPickedIcon == "1") {
        if (this.userType == "External User" || this.canUpdateDustbinPickDetail != 1) {
          this.showReStorePickedButton = 0;
          this.showResetPickedButton = 0;
          this.showUpdateDetailButton = 0;
        }
        else {
          if (detail.startTime == "") {
            this.showUpdateDetailButton = 0;
            this.showReStorePickedButton = 1;
            this.showResetPickedButton = 0;
          }
          else {
            this.showUpdateDetailButton = 1;
            this.showReStorePickedButton = 0;
            this.showResetPickedButton = 1;
          }
        }

      }
      else {
        this.showReStorePickedButton = 0;
        this.showResetPickedButton = 0;
        this.showUpdateDetailButton = 0;
      }
    }

  }
}

export class dustbinDetail {
  pendingAnalysis: string;
  refreshTime: string;
}

export class dustbinDetails {
  binId: string;
  filledTopViewImageUrl: string;
  filledFarFromImageUrl: string;
  emptyTopViewImageUrl: string;
  emptyFarFromImageUrl: string;
  dustbinNotFoundImageUrl: string;
  emptyDustbinTopViewImageUrl: string;
  emptyDustbinFarViewImageUrl: string;
  dustbinRemark: string;
  startTime: string;
  endTime: string;
  address: string;
  canDoAnalysis: string;
  analysisAt: string;
  analysisBy: string;
  filledPercentage: string;
  analysisRemarks: string;
  analysisDetail: string;
  manualRemarks: string;
  imageCaptureAddress: string;
  latLng: string;
  isAutoPicked: any;

}

export class planDetails {
  planId: string;
  driverName: string;
  helper: string;
  secondHelper: string;
  vehicle: string;
  dutyStartTime: string;
  dutyEndTime: string;
  pickedCount: string;
  assignedCount: string;
  notAtLocationCount: string;
}

//969 Total Lines
