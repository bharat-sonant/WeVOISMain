import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbInputDatepicker } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-dustbin-analysis",
  templateUrl: "./dustbin-analysis.component.html",
  styleUrls: ["./dustbin-analysis.component.scss"],
})
export class DustbinAnalysisComponent implements OnInit {
  constructor(private commonService: CommonService, public fs: FirebaseService) { }

  planList: any[];
  dustbinList: any[];
  selectedDate: any;
  currentYear: any;
  currentMonthName: any;
  currentSlide: any;
  dbPath: any;
  fillPercentage: any;
  userId: any;
  remark: any;
  planId: any;
  imageNotAvailablePath = "../assets/img/img-not-available.png";
  maxSlideCount: any;
  cityName: any;
  db: any;
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
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);

    let element = <HTMLAnchorElement>(
      document.getElementById("dustbinReportLink")
    );
    element.href = this.cityName + "/3B/dustbin-planing";
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
  }

  getAssignedPlans() {
    this.planList = [];
    let assignedPlanPath = this.db.list("DustbinData/DustbinAssignment/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate).valueChanges()
      .subscribe((assignedPlans) => {
        if (assignedPlans.length > 0) {
          for (let index = 0; index < assignedPlans.length; index++) {
            const element = assignedPlans[index];
            if (element["planName"] != "") {
              this.planList.push({
                planId: element["planId"],
                planName: element["planName"],
                driver: element["driver"],
                helper: element["helper"],
                secondHelper: element["secondHelper"],
                thirdHelper: element["thirdHelper"],
                vehicle: element["vehicle"],
              });
            }
          }

          this.getBinsForSelectedPlan(this.planList[0]["planId"]);
        } else {
          this.resetData();
          this.commonService.setAlertMessage("error", "No plan created for the selected date.");
        }

        assignedPlanPath.unsubscribe();
      });
  }

  resetData() {
    this.dustbinList = [];
    this.binDetail.binId = "0";
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
    this.binDetail.analysisDetail = "";
    this.binDetail.canDoAnalysis = "no";

    // now reset plan data
    this.planDetail.driverName = "--";
    this.planDetail.vehicle = "--";
    this.planDetail.pickedCount = "";
    this.planDetail.assignedCount = " -- ";
    this.planDetail.notAtLocationCount = " -- ";
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
            address: dustbinAddress,
            iconClass: this.setIconClass(dustbinHistoryData),
            divClass: this.setBackgroudClasss(dustbinHistoryData),
            duration: this.setDuration(dustbinHistoryData),
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
            isPicked:"0"
          });
          this.setPickedBins(index);

          if (this.dustbinList[index]["divClass"] != "address md-background" && firstIndexNeedtobeSelected == -1) {
            firstIndexNeedtobeSelected = index;
          }

          if (index == binsArray.length - 1) {
            $("#divLoader").hide();
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

  setPickedBins(index:any){    
    let isPicked=false;
    if(this.dustbinList[index]["emptyFarFromImage"]!=this.imageNotAvailablePath){
      isPicked=true;
    }
    if(this.dustbinList[index]["emptyTopViewImage"]!=this.imageNotAvailablePath){
      isPicked=true;
    }
    if(this.dustbinList[index]["filledFarFromImage"]!=this.imageNotAvailablePath){
      isPicked=true;
    }
    if(this.dustbinList[index]["filledTopViewImage"]!=this.imageNotAvailablePath){
      isPicked=true;
    }
    if(this.dustbinList[index]["emptyDustbinFarFromImage"]!=this.imageNotAvailablePath){
      isPicked=true;
    }
    if(this.dustbinList[index]["emptyDustbinTopViewImage"]!=this.imageNotAvailablePath){
      isPicked=true;
    }
    if(isPicked==true){
      this.dustbinList[index]["isPicked"]="1";
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
    let userType = localStorage.getItem("userType");
    this.userId = localStorage.getItem("userID");
    if (userType == "External User") {
      $("#divAccess").hide();
    }
  }

  getPandingAnalysis() {
    let dbPath = "DustbinData/TotalDustbinAnalysisPending";
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

    this.binDetail.analysisBy = this.dustbinList[index]["analysisBy"];
    this.binDetail.analysisAt = this.dustbinList[index]["analysisAt"];
    this.binDetail.filledPercentage = this.dustbinList[index]["filledPercentage"];
    this.binDetail.dustbinRemark = this.dustbinList[index]["dustbinRemark"];
    this.binDetail.analysisRemarks = this.dustbinList[index]["analysisRemark"];

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
      $("#hText1").html("ऊपर से भरा ");
      $("#hText2").html("भरा दूर से");
      this.binDetail.filledTopViewImageUrl =
        this.binDetail.filledTopViewImageUrl;
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
    let data = this.dustbinList.find(
      (item) => item.dustbinId == this.binDetail.binId
    );
    data.analysisAt = this.commonService.getTodayDateTime();
    data.analysisBy = this.userId;
    data.analysisRemark = this.getRemarks();
    data.filledPercentage = this.fillPercentage;
    data.iconClass = "fas fa-diagnoses";

    this.binDetail.analysisBy = this.userId;
    this.binDetail.analysisAt = this.commonService.getTodayDateTime();
    this.binDetail.filledPercentage = this.fillPercentage;
    this.binDetail.analysisRemarks = this.getRemarks();
  }

  updatePendingAnalysis() {
    if (this.binDetail.analysisAt == "") {
      let pendingCountPath = this.db
        .object("DustbinData/TotalDustbinAnalysisPending")
        .valueChanges()
        .subscribe((pedingCount) => {
          pendingCountPath.unsubscribe();
          this.db.object("DustbinData").update({
            TotalDustbinAnalysisPending: Number(pedingCount) - 1,
          });
        });
    }
  }

  saveDustbinAnalysis() {

    if (this.binDetail.canDoAnalysis == "yes") {
      this.db.object("DustbinData/DustbinPickHistory/" + this.currentYear + "/" + this.currentMonthName + "/" + this.selectedDate + "/" + this.binDetail.binId + "/" + this.planDetail.planId + "/Analysis/").update({ filledPercentage: this.fillPercentage, analysisAt: this.commonService.getTodayDateTime(), analysisBy: this.userId, remark: this.getRemarks(), });
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
