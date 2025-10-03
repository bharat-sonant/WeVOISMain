import { Component, OnInit } from "@angular/core";
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { NgbInputDatepicker } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "angularfire2/storage";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-secondary-collection-analysis',
  templateUrl: './secondary-collection-analysis.component.html',
  styleUrls: ['./secondary-collection-analysis.component.scss']
})
export class SecondaryCollectionAnalysisComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal, public fs: FirebaseService) { }

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
  db: any;
  canUpdateOpendepotPickDetail: any;
  canRemoveNotPickedDustbin: any;
  dustbinStorageList: any[] = [];
  userType: any;
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
    isOffline: 0,
    imageCaptureAddress: "",
    latLng: ""
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

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userType = localStorage.getItem("userType");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Secondary-Collection-Management", "Secondary-Collection-Analysis", localStorage.getItem("userID"));
    this.canUpdateOpendepotPickDetail = localStorage.getItem("canUpdateOpendepotPickDetail");
    this.canRemoveNotPickedDustbin = localStorage.getItem("canRemoveNotPickedDustbin");
    let element = <HTMLAnchorElement>(
      document.getElementById("dustbinReportLink")
    );
    element.href = this.cityName + "/25B/open-depot-planing";
    this.dustbinStorageList = JSON.parse(localStorage.getItem("openDepot"));
    this.setPageAccessAndPermissions();
    this.setDefaultValues();
    this.getPandingAnalysis();
    this.getAssignedPlans();
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.currentMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
        this.currentYear = this.selectedDate.split("-")[0];
        $(this.txtManualRemark).val("");
        this.getAssignedPlans();
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
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    this.currentYear = this.selectedDate.split("-")[0];
    $("#txtDate").val(this.selectedDate);
    this.dustbinData.refreshTime = this.commonService.getCurrentTime();
    this.fillPercentage = 0;
    $(this.txtManualRemark).val("");
  }



  removeUnpickedDustbin() {
    let element = <HTMLInputElement>document.getElementById("chkConfirm");
    if (element.checked == false) {
      this.commonService.setAlertMessage("error", "Please check confirmation!!!");
      return;
    }
    let dustbinId = $("#hddRemoveIndex").val();
    let planId = $("#hddRemovePlanId").val();
    if (this.dustbinList.length > 0) {
      this.dustbinList = this.dustbinList.filter(item => item.dustbinId != dustbinId);
      if (this.dustbinList.length == 0) {
        this.planList = this.planList.filter(item => item.planId != planId);
      }
      this.getRemoveUnpickedDustbinFromPlan(planId, dustbinId);
    }
    this.closeModel();
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  getRemoveUnpickedDustbinFromPlan(planId: any, dustbinId: any) {
    let dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + planId;
    let planDateInstance = this.db.object(dbPath).valueChanges().subscribe(historyData => {
      planDateInstance.unsubscribe();
      if (historyData == null) {
        dbPath = "DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + planId;
        let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
          planInstance.unsubscribe();
          if (planData != null) {
            this.removeUnpickedDustbinFromPlan(planId, dustbinId, planData, dbPath);
          }
        });
      }
      else {
        this.removeUnpickedDustbinFromPlan(planId, dustbinId, historyData, dbPath);
      }
    });
  }

  removeUnpickedDustbinFromPlan(planId: any, dustbinId: any, planData: any, dbPath: any) {
    let binList = planData["bins"].split(",");
    let sequenceList = planData["pickingSequence"].split(",");
    let bins = "";
    let pickingSequence = "";
    for (let i = 0; i < binList.length; i++) {
      if (binList[i].trim() != dustbinId.trim()) {
        if (bins == "") {
          bins = binList[i].trim();
        }
        else {
          bins += "," + binList[i].trim();
        }
      }
    }
    for (let i = 0; i < sequenceList.length; i++) {
      if (sequenceList[i].trim() != dustbinId.trim()) {
        if (pickingSequence == "") {
          pickingSequence = sequenceList[i].trim();
        }
        else {
          pickingSequence += "," + sequenceList[i].trim();
        }
      }
    }
    let obj = {
      bins: bins,
      pickingSequence: pickingSequence
    };
    if (bins == "") {
      this.db.object(dbPath).set(null);
      this.resetData();
      this.getBinsForSelectedPlan(this.planList[0]["planId"]);
    }
    else {
      this.db.object(dbPath).update(obj);
    }
    this.commonService.setAlertMessage("success", "Dustbin removed from plan!!!");

  }

  openConfirmationModel(content: any, id: any, planId: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 200;
    let width = 450;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $("#hddRemoveIndex").val(id);
    $("#hddRemovePlanId").val(planId);
  }

  getAssignedPlans() {
    this.planList = [];
    let assignedPlanPath = this.db.object("DustbinData/DustbinAssignment/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate).valueChanges()
      .subscribe((assignedPlans) => {
        if (assignedPlans != null) {
          const promises = [];
          let keyArray = Object.keys(assignedPlans);
          for (let index = 0; index < keyArray.length; index++) {
            const planId = keyArray[index];
            promises.push(Promise.resolve(this.getOpenDepotAssignedPlans(planId, assignedPlans)));
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

        assignedPlanPath.unsubscribe();
      });
  }

  getOpenDepotAssignedPlans(planId: any, assignedPlans: any) {
    return new Promise((resolve) => {
      let obj = {};
      let pickingPlanPath = this.db.object("DustbinData/DustbinPickingPlans/" + planId + "/planType").valueChanges().subscribe((pickingPlanData) => {
        if (pickingPlanData == null) {
          pickingPlanPath.unsubscribe();
          // now need to find with date
          let pickingPlanWithDatePath = this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + planId + "/planType").valueChanges().subscribe((pickingPlanWithDateData) => {
            pickingPlanWithDatePath.unsubscribe();
            if (pickingPlanWithDateData == null) {
              let pickingPlanHistory = this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + planId + "/planType").valueChanges().subscribe((dustbinPlanHistoryData) => {
                pickingPlanHistory.unsubscribe();
                if (dustbinPlanHistoryData != null) {
                  if (dustbinPlanHistoryData == "Open Depot") {
                    if (assignedPlans[planId]["planName"] != "") {
                      obj = {
                        planId: assignedPlans[planId]["planId"],
                        planName: assignedPlans[planId]["planName"],
                        driver: assignedPlans[planId]["driver"],
                        helper: assignedPlans[planId]["helper"],
                        secondHelper: assignedPlans[planId]["secondHelper"],
                        thirdHelper: assignedPlans[planId]["thirdHelper"],
                        vehicle: assignedPlans[planId]["vehicle"]
                      };
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
                else {
                  resolve({ status: "fail", data: obj });
                }
              });
            } else {
              if (pickingPlanWithDateData != null) {
                if (pickingPlanWithDateData == "Open Depot") {
                  if (assignedPlans[planId]["planName"] != "") {
                    obj = {
                      planId: assignedPlans[planId]["planId"],
                      planName: assignedPlans[planId]["planName"],
                      driver: assignedPlans[planId]["driver"],
                      helper: assignedPlans[planId]["helper"],
                      secondHelper: assignedPlans[planId]["secondHelper"],
                      thirdHelper: assignedPlans[planId]["thirdHelper"],
                      vehicle: assignedPlans[planId]["vehicle"]
                    };
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
              else {
                resolve({ status: "fail", data: obj });
              }
            }
          });
        } else {
          if (pickingPlanData != null) {
            if (pickingPlanData == "Open Depot") {
              if (assignedPlans[planId]["planName"] != "") {
                obj = {
                  planId: assignedPlans[planId]["planId"],
                  planName: assignedPlans[planId]["planName"],
                  driver: assignedPlans[planId]["driver"],
                  helper: assignedPlans[planId]["helper"],
                  secondHelper: assignedPlans[planId]["secondHelper"],
                  thirdHelper: assignedPlans[planId]["thirdHelper"],
                  vehicle: assignedPlans[planId]["vehicle"]
                };
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
          else {
            resolve({ status: "fail", data: obj });
          }
        }
      });
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
    this.binDetail.isOffline = 0;
    this.binDetail.imageCaptureAddress = "";
    this.binDetail.latLng = "";

    // now reset plan data
    this.planDetail.driverName = "--";
    this.planDetail.vehicle = "--";
    this.planDetail.pickedCount = "";
    this.planDetail.assignedCount = " -- ";
    this.planDetail.notAtLocationCount = " -- ";

    $("#divUpdatePickDetail").hide();
  }

  getBinsForSelectedPlan(planId: string) {
    $("#divLoader").show();
    this.resetData();

    let pickingPlanPath = this.db.object("DustbinData/DustbinPickingPlans/" + planId).valueChanges().subscribe((pickingPlanData) => {
      if (pickingPlanData == null) {
        // now need to find with date
        let pickingPlanWithDatePath = this.db.object("DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + planId).valueChanges().subscribe((pickingPlanWithDateData) => {
          if (pickingPlanWithDateData == null) {
            let pickingPlanHistory = this.db.object("DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + planId).valueChanges().subscribe((dustbinPlanHistoryData) => {
              let bins = dustbinPlanHistoryData["bins"];
              this.getBinsDetail(bins, planId);
              pickingPlanHistory.unsubscribe();
            });
          } else {
            let bins = pickingPlanWithDateData["bins"];
            this.getBinsDetail(bins, planId);
          }
          pickingPlanWithDatePath.unsubscribe();
        });
      } else {
        let bins = pickingPlanData["bins"];
        this.getBinsDetail(bins, planId);
      }

      pickingPlanPath.unsubscribe();
    });
  }

  getBinsDetail(bins: string, planId: string) {
    let firstIndexNeedtobeSelected = -1;
    let binsArray = bins.toString().split(",");
    this.dustbinList = [];
    for (let index = 0; index < binsArray.length; index++) {
      let binId = binsArray[index].replace(" ", "");
      let binsDetailsPath = this.db.object("DustbinData/DustbinDetails/" + binId + "/address").valueChanges().subscribe((dustbinAddress) => {
        let dustbinPickHistoryPath = this.db.object("DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + binId + "/" + planId).valueChanges().subscribe((dustbinHistoryData) => {
          this.dustbinList.push({
            dustbinId: binId,
            planId: planId,
            address: dustbinAddress,
            iconClass: this.setIconClass(dustbinHistoryData),
            divClass: this.setBackgroudClasss(dustbinHistoryData),
            duration: this.setDuration(dustbinHistoryData),
            isOffline: this.setIsOffline(dustbinHistoryData),
            dustbinRemark: this.checkNullValue(
              dustbinHistoryData,
              "remarks"
            ),
            filledTopViewImage: this.setImageUrl(
              dustbinHistoryData,
              "filled-top"
            ),
            filledFarFromImage: this.setImageUrl(
              dustbinHistoryData,
              "filled-far"
            ),
            emptyTopViewImage: this.setImageUrl(
              dustbinHistoryData,
              "empty-top"
            ),
            emptyFarFromImage: this.setImageUrl(
              dustbinHistoryData,
              "empty-far"
            ),
            emptyDustbinTopViewImage: this.setImageUrl(
              dustbinHistoryData,
              "empty-dustbin-top"
            ),
            emptyDustbinFarFromImage: this.setImageUrl(
              dustbinHistoryData,
              "empty-dustbin-far"
            ),
            dustbinNotFoundImage: this.setImageUrl(
              dustbinHistoryData,
              "not-at-location"
            ),
            startTime: this.checkNullValue(dustbinHistoryData, "startTime"),
            endTime: this.checkNullValue(dustbinHistoryData, "endTime"),
            analysisBy: this.checkAnalysisValues(dustbinHistoryData, "analysisBy"),
            analysisAt: this.checkAnalysisValues(dustbinHistoryData, "analysisAt"),
            filledPercentage: this.checkAnalysisValues(dustbinHistoryData, "filledPercentage"),
            analysisRemark: this.checkAnalysisValues(dustbinHistoryData, "remark"),
            manualRemarks: this.checkAnalysisValues(dustbinHistoryData, "manualRemark"),
            isPicked: "0",
            imageCaptureAddress: this.checkNullValue(dustbinHistoryData, "imageCaptureAddress"),
            latLng: this.checkLatLngValue(dustbinHistoryData, "latLng", binId),
            isVerifiedDustbinChecked: dustbinHistoryData && dustbinHistoryData.verified === 'yes' ? true : false
          });
          this.setPickedBins(index);

          if (this.dustbinList[index]["divClass"] != "address md-background" && firstIndexNeedtobeSelected == -1) {
            firstIndexNeedtobeSelected = index;
          }

          if (index == binsArray.length - 1) {
            $("#divLoader").hide();
            if (firstIndexNeedtobeSelected != -1) {
              this.showDustbinData(firstIndexNeedtobeSelected, 'picked');
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
  /**
   * Format a JS Date into YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  /**
   * Method for update verified dustbins when user check/uncheck the checkbox
   * @param dustbinId 
   * @param planId
   * @param isChecked - true when checkbox is ticked, false when unticked
   * @description Handles Analysis/verified updates, updates dustbinList,
   * builds verified dustbin string, and saves it in PickingPlanHistory (and PickingPlans if current date).
   * @author Ritik
   * @date 29 Sep 2025
   */
  async updateVerifiedDustbins(dustbinId: string, planId: string, isChecked: boolean) {
    const year = this.selectedDate.split("-")[0];
    const monthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
    const date = this.selectedDate; // YYYY-MM-DD
    const currentDate = this.formatDate(new Date()); // today's date (YYYY-MM-DD)


    const analysisPath = `DustbinData/DustbinPickHistory/${year}/${monthName}/${date}/${dustbinId}/${planId}/`;

    if (isChecked) {
      // ✅ True case → set verified = "yes"
      await this.db.object(analysisPath).update({ verified: "yes" });
    } else {
      // ❌ False case → remove only verified key
      await this.db.object(`${analysisPath}/verified`).remove();
    }


    const index = this.dustbinList.findIndex(d => d.dustbinId === dustbinId);
    if (index !== -1) {
      this.dustbinList[index].isVerifiedDustbinChecked = isChecked;
    }

    // Build verified IDs string from dustbinList
    const verifiedIds = this.dustbinList
      .filter(d => d.isVerifiedDustbinChecked === true)
      .map(d => d.dustbinId)
      .join(",");

    if (date === currentDate) {
      const pickingPlanPath = `DustbinData/DustbinPickingPlans/${date}/${planId}`;

      let instance = this.db.object(pickingPlanPath).valueChanges().subscribe(async (planData) => {
        instance.unsubscribe();

        if (planData != null) {
          // ✅ path exists → safe to update
          this.db.object(pickingPlanPath).update({ verifiedDustbin: verifiedIds });
        } else {
          if (verifiedIds && verifiedIds.trim().length > 0) {
            const planHistoryPath = `DustbinData/DustbinPickingPlanHistory/${year}/${monthName}/${date}/${planId}`;
            await this.db.object(planHistoryPath).update({ verifiedDustbin: verifiedIds });
          }
          else {
            const planHistoryPath = `DustbinData/DustbinPickingPlanHistory/${year}/${monthName}/${date}/${planId}`;
            await this.db.object(`${planHistoryPath}/verifiedDustbin`).remove();
          }
        }
      });
    }
    else {
      if (verifiedIds && verifiedIds.trim().length > 0) {

        const planHistoryPath = `DustbinData/DustbinPickingPlanHistory/${year}/${monthName}/${date}/${planId}`;
        await this.db.object(planHistoryPath).update({ verifiedDustbin: verifiedIds });
      }
      else {
        const planHistoryPath = `DustbinData/DustbinPickingPlanHistory/${year}/${monthName}/${date}/${planId}`;
        await this.db.object(`${planHistoryPath}/verifiedDustbin`).remove();
      }
    }

    this.commonService.setAlertMessage(`success`, `Open depot ${isChecked ? "Verified" : "Unverified"} Successfully.`);
  }
  setIsOffline(dustbinHistoryData) {
    let isOffline = 0;
    if (dustbinHistoryData != null) {
      if (dustbinHistoryData.isOffline != null) {
        isOffline = dustbinHistoryData.isOffline;
      }
    }
    return isOffline;
  }

  setPickedBins(index: any) {
    let isPicked = false;
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
    }
  }

  showPlanDetails(planId: any) {
    let plan = this.planList.find((item) => item.planId == planId);
    this.commonService.getEmplyeeDetailByEmployeeId(plan.driver).then((employee) => (this.planDetail.driverName = employee["name"] + " [D]")
    );
    this.commonService.getEmplyeeDetailByEmployeeId(plan.helper).then((employee) => (this.planDetail.helper = employee["name"] + " [H1]")
    );
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

  checkNullValue(binData: any, fieldName: string) {
    let time = "";
    if (binData != null) {
      if (binData[fieldName] != undefined) {
        time = binData[fieldName];
      }
    }

    return time;
  }

  checkLatLngValue(binData: any, fieldName: string, binId: any) {
    let latLng = "";
    let detail = this.dustbinStorageList.find(item => Number(item.dustbin) == Number(binId));
    if (detail != undefined) {
      latLng = detail.lat + "," + detail.lng;
    }
    if (binData != null) {
      if (binData[fieldName] != undefined) {
        latLng = binData[fieldName];
      }
    }
    return latLng;

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

          if (emptyDustbinTopViewImage != undefined && emptyDustbinFarFromImage != undefined
          ) {
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
          duration = binData["duration"] + "  min <img src='../../../assets/img/clock-icon.png'>";
        }
      }
    }

    return duration;
  }

  setPageAccessAndPermissions() {
    this.userId = localStorage.getItem("userID");
    if (this.userType == "External User") {
      $("#divAccess").hide();
    }
  }

  getPandingAnalysis() {
    let dbPath = "DustbinData/TotalOpenDepotAnalysisPending";
    this.db.object(dbPath).valueChanges().subscribe((data) => {
      if (data != null) {
        let pending = Number(data);
        if (pending < 0) {
          pending = 0;
        }
        this.dustbinData.pendingAnalysis = pending.toString();
      }
    });
  }

  downloadImage(uri: any) {

    fetch(uri)
      .then(response => response.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = this.binDetail.binId + "-without-GPS.jpg";   // suggest filename
        document.body.appendChild(a);
        a.click();

        // cleanup
        a.remove();
        URL.revokeObjectURL(objectUrl);
      })
      .catch(err => console.error('Download failed:', err));
  }

  downloadGPSImage(uri: any, address: any, latLng: any, type: any) {

    $("#ImageLoader").show();
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const fontSize = 100;
      const padding = 50;
      const lineHeight = fontSize + 20;
      const maxTextWidth = canvas.width - padding * 2;

      ctx.font = `${fontSize}px Arial`;

      // Function to wrap long text
      const wrapText = (text, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let line = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const testWidth = ctx.measureText(testLine).width;
          if (testWidth > maxWidth && i > 0) {
            lines.push(line.trim());
            line = words[i] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());
        return lines;
      };

      let time = "";
      if (type == "start") {
        time = this.binDetail.startTime;
      }
      else {
        time = this.binDetail.endTime;
        if (time == "") {
          time = this.getNextTime(this.binDetail.startTime, this.getRandemTimeDifference());
        }
      }



      let lines = [];
      let date = this.selectedDate.split("-")[2] + " " + this.commonService.getCurrentMonthShortName(Number(this.selectedDate.split("-")[1])) + " " + this.selectedDate.split("-")[0] + " " + time;
      let lat = latLng.split(",")[0];
      let lng = latLng.split(",")[1];

      if (address) {
        const addressLines = wrapText(`${address}`, maxTextWidth);
        lines = lines.concat(addressLines);
      }
      lines.push(`Lat: ${lat} Long: ${lng}`);
      lines.push(`${date}`);

      const extraSpacing = 30;
      const rectHeight = lines.length * (lineHeight + extraSpacing) + padding * 1.5;


      // Draw background rectangle
      ctx.fillStyle = 'rgba(70, 70, 70, 0.77)';
      ctx.fillRect(0, canvas.height - rectHeight, canvas.width, rectHeight);

      // Set text style
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;

      // Draw each line

      lines.forEach((line, i) => {
        const x = padding;
        const y = canvas.height - rectHeight + padding + (i + 1) * lineHeight + i * extraSpacing;
        ctx.strokeText(line, x, y);
        ctx.fillText(line, x, y);
      });


      // Trigger download
      const link = document.createElement('a');
      link.download = this.binDetail.binId + "-with-GPS-information.jpg";
      link.href = canvas.toDataURL('image/png');
      link.click();
      $("#ImageLoader").hide();
    };

    img.src = uri;

  }

  getRandemTimeDifference() {
    return Math.floor(Math.random() * (3 - 1 + 1)) + 1;
  }

  getNextTime(startTime: any, timediff: any) {
    const now = new Date(new Date(this.selectedDate + " " + startTime).getTime() + timediff * 60000);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return hours + ":" + minutes;
  }

  showDustbinData(index: any, type: any) {
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
    this.binDetail.isOffline = this.dustbinList[index]["isOffline"] ? this.dustbinList[index]["isOffline"] : 0;
    this.binDetail.imageCaptureAddress = this.dustbinList[index]["imageCaptureAddress"] ? this.dustbinList[index]["imageCaptureAddress"] : "";
    this.binDetail.latLng = this.dustbinList[index]["latLng"] ? this.dustbinList[index]["latLng"] : "";
    this.binDetail.analysisBy = this.dustbinList[index]["analysisBy"];
    this.binDetail.analysisAt = this.dustbinList[index]["analysisAt"];
    this.binDetail.filledPercentage = this.dustbinList[index]["filledPercentage"];
    this.binDetail.dustbinRemark = this.dustbinList[index]["dustbinRemark"];
    this.binDetail.analysisRemarks = this.dustbinList[index]["analysisRemark"];
    this.binDetail.manualRemarks = this.dustbinList[index]["manualRemarks"];

    if (type == "edit") {
      if (this.canUpdateOpendepotPickDetail == 1) {
        $("#divUpdatePickDetail").show();
      }
      else {
        $("#divUpdatePickDetail").hide();
      }
    }
    else {
      if (this.binDetail.isOffline == 1) {
        if (this.canUpdateOpendepotPickDetail == 1) {
          $("#divUpdatePickDetail").show();
        }
        else {
          $("#divUpdatePickDetail").hide();
        }
      }
      else {
        $("#divUpdatePickDetail").hide();
      }
    }

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
      let isBrokenPath = this.db
        .object(
          "DustbinData/DustbinDetails/" + this.binDetail.binId + "/isBroken"
        )
        .valueChanges()
        .subscribe((isBroken) => {
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
    /*
    if (this.binDetail.filledFarFromImageUrl == this.imageNotAvailablePath) {
      canDo = "no";
    } else if (this.binDetail.emptyDustbinFarViewImageUrl != this.imageNotAvailablePath) {
      canDo = "no";
    }
      */

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
      this.binDetail.filledTopViewImageUrl =
        this.binDetail.emptyDustbinTopViewImageUrl;
      this.binDetail.filledFarFromImageUrl =
        this.binDetail.emptyDustbinFarViewImageUrl;
      this.maxSlideCount = 2;
    } else if (this.binDetail.dustbinRemark == "डस्टबिन लोकेशन पर नहीं है") {
      $("#box1").show();
      $("#preLink").hide();
      $("#nextLink").hide();
      $("#hText1").html("लोकेशन पर नहीं है");
      this.binDetail.filledTopViewImageUrl =
        this.binDetail.dustbinNotFoundImageUrl;
    } else {
      $("#box1").show();
      $("#box2").show();
      $("#box3").show();
      $("#box4").show();
      $("#preLink").show();
      $("#nextLink").show();
      $("#hText1").html("कचरा उठाने से पहले ");
      $("#hText2").html("कचरा उठाने के बाद");
      this.binDetail.filledTopViewImageUrl = this.binDetail.filledTopViewImageUrl;
      this.maxSlideCount = 2;
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
    let data = this.dustbinList.find(
      (item) => item.dustbinId == this.binDetail.binId
    );
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
    if (this.binDetail.analysisAt == "") {
      let pendingCountPath = this.db
        .object("DustbinData/TotalOpenDepotAnalysisPending")
        .valueChanges()
        .subscribe((pedingCount) => {
          pendingCountPath.unsubscribe();
          this.db.object("DustbinData").update({
            TotalOpenDepotAnalysisPending: Number(pedingCount) - 1,
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
      this.commonService.setAlertMessage("error", "Can not do analysis for this open depot.");
    }
  }

  saveOfflineDustbinDetail() {
    let startTime = $("#txtPickTime").val();
    let endTime = $("#txtPickTimeEnd").val();
    let fileUploadBefore = <HTMLInputElement>document.getElementById("fileUploadBefore");
    let file = fileUploadBefore.files[0];
    let fileUploadAfter = <HTMLInputElement>document.getElementById("fileUploadAfter");
    let file1 = fileUploadAfter.files[0];

    if (file == null) {
      this.commonService.setAlertMessage("error", "Please upload before pick image.");
      return;
    }
    if (file1 == null) {
      this.commonService.setAlertMessage("error", "Please upload after pick image.");
      return;
    }
    if (startTime == "") {
      this.commonService.setAlertMessage("error", "Please enter start time.");
      return;
    }
    if (endTime == "") {
      this.commonService.setAlertMessage("error", "Please enter end time.");
      return;
    }

    if (new Date(this.selectedDate + " " + endTime) < new Date(this.selectedDate + " " + startTime)) {
      this.commonService.setAlertMessage("error", "End time must be greater then start time.");
      return;
    }

    $("#divLoader").show();
    let storageCityName = this.commonService.getFireStoreCity();
    let filledFarFromImageUrl = "";
    let emptyFarFromImageUrl = "";
    let imageObj;
    let urlObj = {};
    let token = new Date().getTime();
    let duration = (new Date(this.selectedDate + " " + endTime).getTime() - new Date(this.selectedDate + " " + startTime).getTime()) / 60000;

    if (file != null) {
      filledFarFromImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDustbinImages%2FDustbinPickHistory%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + this.binDetail.binId + "%2F" + this.planDetail.planId + "%2FfilledFarFromImage.jpg?alt=media&token=" + token + "";
      urlObj["filledFarFromImageUrl"] = filledFarFromImageUrl;
      let filePath = "/" + storageCityName + "/DustbinImages/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.binDetail.binId + "/" + this.planDetail.planId + "/filledFarFromImage.jpg";
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);
    }


    if (file1 != null) {
      emptyFarFromImageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDustbinImages%2FDustbinPickHistory%2F" + this.currentYear + "%2F" + this.currentMonthName + "%2F" + this.selectedDate + "%2F" + this.binDetail.binId + "%2F" + this.planDetail.planId + "%2FemptyFarFromImage.jpg?alt=media&token=" + token + "";
      urlObj["emptyFarFromImageUrl"] = emptyFarFromImageUrl;
      let filePath = "/" + storageCityName + "/DustbinImages/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.binDetail.binId + "/" + this.planDetail.planId + "/emptyFarFromImage.jpg";
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file1);
    }

    let keyArray = Object.keys(urlObj);
    if (keyArray.length > 0) {
      imageObj = {};
      imageObj["Urls"] = urlObj;
    }

    let zone = "";
    let latLng = "";
    let pickedBy = "";
    let detail = this.dustbinStorageList.find(item => item.dustbin == this.binDetail.binId);
    if (detail != undefined) {
      zone = detail.zone;
      latLng = detail.lat + "," + detail.lng;
    }

    let driverDetail = this.planList.find(item => item.planId == this.planDetail.planId);
    if (driverDetail != undefined) {
      pickedBy = driverDetail.driver;
    }

    const data = {
      Image: imageObj ? imageObj : null,
      address: this.binDetail.address,
      pickDateTime: this.selectedDate + " " + endTime,
      duration: duration,
      pickedBy: pickedBy,
      latLng: latLng,
      zone: zone,
      endTime: this.selectedDate + " " + endTime,
      startTime: this.selectedDate + " " + startTime,
      isOffline: 1
    };

    let dbPath = "DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.binDetail.binId + "/" + this.planDetail.planId;
    this.db.object(dbPath).update(data);
    this.updatePickedOpenDepotInPlan(this.planDetail.planId, this.binDetail.binId);
    setTimeout(() => {
      this.binDetail.startTime = this.commonService.gteHrsAndMinutesOnly(this.selectedDate + " " + startTime);
      this.binDetail.endTime = this.commonService.gteHrsAndMinutesOnly(this.selectedDate + " " + endTime);
      this.binDetail.filledFarFromImageUrl = filledFarFromImageUrl;
      this.binDetail.emptyFarFromImageUrl = emptyFarFromImageUrl;
      this.binDetail.isOffline = 1;

      let data = this.dustbinList.find((item) => item.dustbinId == this.binDetail.binId);
      data.startTime = this.selectedDate + " " + startTime;
      data.endTime = this.selectedDate + " " + endTime;
      data.filledFarFromImage = this.binDetail.filledFarFromImageUrl;
      data.emptyFarFromImage = this.binDetail.emptyFarFromImageUrl;
      data.iconClass = "fas warning";
      data.isPicked = "1";
      data.isOffline = 1;
      data.divClass = "address";
      data.duration = duration + "  min <img src='../../../assets/img/clock-icon.png'>";
      $("#txtPickTime").val("");
      $("#txtPickTimeEnd").val("");
      $("#fileUploadBefore").val("");
      $("#fileUploadAfter").val("");
      this.commonService.setAlertMessage("success", "Open depot pick detail updated successfully.");
      $("#divLoader").hide();
    }, 2000);
  }

  updatePickedOpenDepotInPlan(planId: any, dustbinId: any) {
    let dbPath = "DustbinData/DustbinPickingPlans/" + this.selectedDate + "/" + planId;
    let planInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      planInstance.unsubscribe();
      if (data != null) {
        if (data.pickedDustbin == "") {
          this.db.object(dbPath).update({ pickedDustbin: dustbinId.toString() });
        }
        else {
          let pickedDustbin = data.pickedDustbin.toString();
          let list = pickedDustbin.split(",");
          let pickedList = [];
          for (let i = 0; i < list.length; i++) {
            pickedList.push({ dustbin: list[i].toString().trim() });
          }
          let detail = pickedList.find(item => item.dustbin == dustbinId.toString());
          if (detail == undefined) {
            this.db.object(dbPath).update({ pickedDustbin: pickedDustbin + "," + dustbinId.toString() });
          }
        }
      }
      else {
        dbPath = "DustbinData/DustbinPickingPlanHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + planId;
        let planHistoryInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
          planHistoryInstance.unsubscribe();
          if (planData != null) {
            if (planData.pickedDustbin == "") {
              this.db.object(dbPath).update({ pickedDustbin: dustbinId.toString() });
            }
            else {
              let pickedDustbin = planData.pickedDustbin.toString();
              let list = pickedDustbin.split(",");
              let pickedList = [];
              for (let i = 0; i < list.length; i++) {
                pickedList.push({ dustbin: list[i].toString().trim() });
              }
              let detail = pickedList.find(item => item.dustbin == dustbinId.toString());
              if (detail == undefined) {
                this.db.object(dbPath).update({ pickedDustbin: pickedDustbin + "," + dustbinId.toString() });
              }
            }
          }
        });
      }
    });
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
    let element = <HTMLInputElement>(
      document.getElementById("remark" + remarkNo)
    );
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

    for (let i = 1; i <= 2; i++) {
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
  isOffline: number;
  imageCaptureAddress: string;
  latLng: string;
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

