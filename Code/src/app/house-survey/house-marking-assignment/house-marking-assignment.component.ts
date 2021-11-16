import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MapService } from "../../services/map/map.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-house-marking-assignment",
  templateUrl: "./house-marking-assignment.component.html",
  styleUrls: ["./house-marking-assignment.component.scss"],
})
export class HouseMarkingAssignmentComponent implements OnInit {
  constructor(private router: Router, public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal, private mapService: MapService) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  yearList: any[] = [];
  assignedList: any[] = [];
  surveyorList: any[] = [];
  userId: any;
  WardList: any[] = [];
  vehicleAllList: any[] = [];
  totalLiters: any = 0;
  totalAmount: any = 0;
  cityName: any;
  zoneList: any[];
  dbPath: any;
  userList: any[];
  lineList: any[];
  lineMarkerList: any[];
  isFirst = true;
  houseData: houseDatail = {
    totalMarking: "0",
    totalSurveyed: "0",
    totalRevisit: "0",
    totalRFID: "0",
    name: "",
    wardNo: "",
    average: "0",
    totalDays: "0"
  };
  db: any;
  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.getZoneList();
    this.getAssignedList();
  }

  //#region serveyor detail

  setActiveClass(index: any) {
    for (let i = 0; i < this.assignedList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        $("#tr" + i).removeClass(className);
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }

  getServeyorDetail(userId: any, index: any) {
    if (this.isFirst == false) {
      this.setActiveClass(index);
    } else {
      this.isFirst = false;
    }
    this.houseData.totalMarking = "0";
    this.houseData.totalSurveyed = "0";
    this.houseData.totalRevisit = "0";
    this.houseData.totalRFID = "0";
    this.houseData.average = "0";
    this.houseData.totalDays = "0";
    this.lineMarkerList = [];

    let userDetail = this.assignedList.find((item) => item.userId == userId);
    if (userDetail != undefined) {
      this.houseData.name = userDetail.name;
      this.houseData.wardNo = userDetail.wardNo;
      this.getSurveyCount(userId);
      this.getRevisitCount(userId);
      this.getRfidCount(userId);
    }
  }

  getSurveyCount(userId: any) {
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        let dbPath = "EntitySurveyData/DailyHouseCount/" + this.zoneList[i]["zoneNo"] + "/" + userId;
        let houseCountInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            houseCountInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let j = 0; j < keyArray.length; j++) {
                  let date = keyArray[j];
                  let count = Number(data[date]);
                  let detail = this.lineMarkerList.find(item => item.date == date);
                  if (detail != undefined) {
                    detail.surveyed = Number(detail.surveyed) + count;
                  }
                  else {
                    let dateOrder = new Date(date.split('-')[2] + "-" + date.split('-')[1] + "-" + date.split('-')[0]);
                    this.lineMarkerList.push({ date: date, surveyed: count, dateOrder: dateOrder });
                  }
                }
                this.lineMarkerList = this.lineMarkerList.sort((a, b) =>
                  b.dateOrder > a.dateOrder ? 1 : -1
                );
              }
            }
          }
        );
      }
    }
  }

  getRevisitCount(userId: any) {
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        let dbPath = "EntitySurveyData/DailyRevisitRequestCount/" + this.zoneList[i]["zoneNo"] + "/" + userId;
        let houseCountInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            houseCountInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let j = 0; j < keyArray.length; j++) {
                  let date = keyArray[j];
                  let count = Number(data[date]);
                  let detail = this.lineMarkerList.find(item => item.date == date);
                  if (detail != undefined) {
                    if (detail.revisit != null) {
                      detail.revisit = Number(detail.revisit) + count;
                    }
                    else {
                      detail.revisit = count;
                    }
                  }
                  else {
                    let dateOrder = new Date(date.split('-')[2] + "-" + date.split('-')[1] + "-" + date.split('-')[0]);
                    this.lineMarkerList.push({ date: date, revisit: count, dateOrder: dateOrder });
                  }
                }
                this.lineMarkerList = this.lineMarkerList.sort((a, b) =>
                  b.dateOrder > a.dateOrder ? 1 : -1
                );
              }
            }
          }
        );
      }
    }
  }

  getRfidCount(userId: any) {
    if (this.zoneList.length > 0) {
      for (let i = 0; i < this.zoneList.length; i++) {
        let dbPath = "EntitySurveyData/DailyRfidNotFoundCount/" + this.zoneList[i]["zoneNo"] + "/" + userId;
        let houseCountInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            houseCountInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let j = 0; j < keyArray.length; j++) {
                  let date = keyArray[j];
                  let count = Number(data[date]);
                  let detail = this.lineMarkerList.find(item => item.date == date);
                  if (detail != undefined) {
                    if (detail.rfid != null) {
                      detail.rfid = Number(detail.rfid) + count;
                    }
                    else {
                      detail.rfid = count;
                    }
                  }
                  else {
                    let dateOrder = new Date(date.split('-')[2] + "-" + date.split('-')[1] + "-" + date.split('-')[0]);
                    this.lineMarkerList.push({ date: date, rfid: count, dateOrder: dateOrder });
                  }
                }
                this.lineMarkerList = this.lineMarkerList.sort((a, b) =>
                  b.dateOrder > a.dateOrder ? 1 : -1
                );
              }

            }
            if (i == this.zoneList.length - 1) {
              this.getSummary();
            }
          }
        );
      }
    }
  }

  getSummary() {
    if (this.lineMarkerList.length > 0) {
      let surved = 0;
      let revisit = 0;
      let rfid = 0;
      for (let i = 0; i < this.lineMarkerList.length; i++) {
        if (this.lineMarkerList[i]["surveyed"] != null) {
          surved = surved + Number(this.lineMarkerList[i]["surveyed"]);
        }
        if (this.lineMarkerList[i]["revisit"] != null) {
          revisit = revisit + Number(this.lineMarkerList[i]["revisit"]);
        }
        if (this.lineMarkerList[i]["rfid"] != null) {
          rfid = rfid + Number(this.lineMarkerList[i]["rfid"]);
        }
        this.houseData.totalSurveyed = surved.toString();
        this.houseData.totalRevisit = revisit.toString();
        this.houseData.totalRFID = rfid.toString();
        this.houseData.totalDays = this.lineMarkerList.length.toString();
        this.houseData.average = ((surved + revisit + rfid) / this.lineMarkerList.length).toFixed(2);
      }
    }
  }

  //#endregion

  //#region  List Detail

  getAssignedList() {
    this.assignedList = [];
    this.surveyorList = [];
    this.userList = [];
    this.dbPath = "Surveyors";
    let userInstance = this.db.object(this.dbPath).valueChanges().subscribe((data) => {
      userInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length - 1; i++) {
            let index = keyArray[i];
            let name = data[index]["name"];
            let loginId = data[index]["pin"];
            let joiningDate = data[index]["joining-date"].split('-')[2] + "-" + data[index]["joining-date"].split('-')[1] + "-" + data[index]["joining-date"].split('-')[0];
            let isActive = false;
            if (data[index]["status"] == "2") {
              isActive = true;
            }

            if (data[index]["surveyor-type"] == "Surveyor") {
              this.dbPath = "SurveyorsCuurentAssignment/" + index;
              let assignInstance = this.db.object(this.dbPath).valueChanges().subscribe((dataSurvey) => {
                assignInstance.unsubscribe();
                if (dataSurvey != null) {
                  let linelist = dataSurvey["line"].split(',');
                  let lines = "";
                  if (linelist.length > 0) {
                    for (let l = 0; l < linelist.length; l++) {
                      if (lines == "") {
                        lines = linelist[l];
                      }
                      else {
                        lines = lines + ", " + linelist[l];
                      }
                    }
                  }
                  this.surveyorList.push({ userId: index, name: name, joiningDate: joiningDate, wardNo: dataSurvey["ward"], lines: lines, loginId: loginId, isActive: isActive });
                  if (isActive == true) {
                    this.assignedList.push({ userId: index, name: name, joiningDate: joiningDate, wardNo: dataSurvey["ward"], lines: lines, loginId: loginId, isActive: isActive });
                  }
                } else {
                  this.surveyorList.push({ userId: index, name: name, joiningDate: joiningDate, wardNo: "", lines: "", loginId: loginId, isActive: isActive });
                  if (isActive == true) {
                    this.assignedList.push({ userId: index, name: name, joiningDate: joiningDate, wardNo: "", lines: "", loginId: loginId, isActive: isActive });
                  }
                }
                this.surveyorList = this.commonService.transformNumeric(this.surveyorList, "name");
                this.assignedList = this.commonService.transformNumeric(this.assignedList, "name");
              });
            }
          }
          setTimeout(() => {
            $("#tr0").addClass("active");
            this.getServeyorDetail(this.assignedList[0]["userId"], 0);
          }, 2000);
        }
      }
    });
  }

  showAll() {
    this.assignedList = [];
    let element = <HTMLInputElement>document.getElementById("chkAll");
    if (element.checked == true) {
      this.assignedList = this.surveyorList;
    }
    else {
      this.assignedList = this.surveyorList.filter((item) => item.isActive == true);
    }
    setTimeout(() => {
      $("#tr0").addClass("active");
      this.getServeyorDetail(this.assignedList[0]["userId"], 0);
    }, 1000);
  }

  getLines(wardNo: any) {
    this.lineList = [];
    if (wardNo == "0") {
      this.commonService.setAlertMessage("error", "Plese select ward !!!");
      return;
    }
    this.dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "";
    let lineInstance = this.db.object(this.dbPath).valueChanges().subscribe((data) => {
      lineInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (data[index]["ApproveStatus"] != null) {
              if (data[index]["ApproveStatus"]["status"] == "Confirm") {
                this.lineList.push({ lineNo: index, isChecked: 0 });
              }
            }
          }
        }
      }
    });
  }

  saveAssignment() {
    let wardNo = $("#ddlWard").val();
    let userId = $("#key").val();
    let name = "";
    let lines = "";
    if (wardNo == "0") {
      this.commonService.setAlertMessage("error", "Plese select ward !!!");
      return;
    }

    let userDetail = this.assignedList.find((item) => item.userId == userId);
    if (userDetail != undefined) {
      name = userDetail.name;
    }
    let isChecked = false;
    if (this.lineList.length > 0) {
      for (let i = 0; i < this.lineList.length; i++) {
        let lineNo = this.lineList[i]["lineNo"];
        let chk = "chk" + lineNo;
        let element = <HTMLInputElement>document.getElementById(chk);
        if (element.checked == true) {
          isChecked = true;
          if (lines != "") {
            lines = lines + ",";
          }
          lines = lines + lineNo;
        }
      }
      if (isChecked == false) {
        this.commonService.setAlertMessage("error", "Plese select at least one line !!!");
        return;
      }
      const data = {
        line: lines,
        name: name,
        ward: wardNo,
      };
      this.dbPath = "SurveyorsCuurentAssignment/" + userId;
      this.db.object(this.dbPath).update(data);
      this.lineList = [];
      this.commonService.setAlertMessage("success", "Lines assigned successfully !!");
      let userDetail = this.assignedList.find((item) => item.userId == userId);
      if (userDetail != undefined) {
        userDetail.wardNo = wardNo;
        userDetail.lines = lines;
      }
      this.closeModel();
    }
  }

  deleteEntry(userId: any) {
    this.dbPath = "SurveyorsCuurentAssignment/" + userId;
    const data = { line: null, name: null, ward: null };
    this.db.object(this.dbPath).update(data);
    let userDetail = this.assignedList.find((item) => item.userId == userId);
    if (userDetail != undefined) {
      userDetail.wardNo = "";
      userDetail.lines = "";
    }
    this.commonService.setAlertMessage("success", "Lines assigned removed !!");
    this.closeModel();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  openModel(content: any, id: any, type: any) {
    this.lineList = [];
    if (type == "update") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 500;
      let width = 450;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#key").val(id);
        setTimeout(() => {
          let listDetail = this.assignedList.find((item) => item.userId == id);
          if (listDetail != undefined) {
            if (listDetail.wardNo != "") {
              $("#ddlWard").val(listDetail.wardNo);
              let lines = listDetail.lines.split(",");
              this.getLines(listDetail.wardNo);
              setTimeout(() => {
                if (lines.length > 0) {
                  for (let i = 0; i < lines.length; i++) {
                    let lineDetail = this.lineList.find(
                      (item) => item.lineNo == lines[i].trim()
                    );
                    if (lineDetail != undefined) {
                      let chk = "chk" + lineDetail.lineNo;
                      (<HTMLInputElement>document.getElementById(chk)).checked =
                        true;
                    }
                  }
                }
              }, 600);
            }
          }
        }, 100);
      }
    } else {
      let listDetail = this.assignedList.find((item) => item.userId == id);
      if (listDetail != undefined) {
        if (listDetail.wardNo == "") {
          this.commonService.setAlertMessage("error", "No assignment found!!!");
          return;
        }
      }
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 170;
      let width = 450;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#deleteId").val(id);
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  confirmDelete() {
    let id = $("#deleteId").val();
    this.deleteEntry(id);
  }

  //#endregion
}

export class houseDatail {
  totalMarking: string;
  totalSurveyed: string;
  totalRevisit: string;
  totalRFID: string;
  name: string;
  wardNo: string;
  average: string;
  totalDays: string;
}
