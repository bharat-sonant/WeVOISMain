import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MapService } from "../services/map/map.service";
import { FirebaseService } from "../firebase.service";

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
    name: "",
    wardNo: "",
    average:"0",
    totalDays:"0"
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
    this.houseData.average="0";
    this.houseData.totalDays="0";
    this.lineMarkerList = [];
    let userDetail = this.assignedList.find((item) => item.userId == userId);
    if (userDetail != undefined) {
      this.houseData.name = userDetail.name;
      this.houseData.wardNo = userDetail.wardNo;
    }
    this.dbPath = "EntitySurveyData/SurveyDateWise/" + userId;
    let instance = this.db.object(this.dbPath).valueChanges().subscribe((data) => {
      instance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (index == "totalCount") {
              this.houseData.totalSurveyed = data[index];
              this.houseData.totalDays=(keyArray.length-1).toString();
              let average =
                Number(this.houseData.totalSurveyed) /
                Number(keyArray.length-1);
              if (average % 1 == 0) {
                this.houseData.average = average.toFixed(0);
              } else {
                this.houseData.average = average.toFixed(2);
              }

            } else {
              let date=new Date(index.split('-')[2]+"-"+index.split('-')[1]+"-"+index.split('-')[0])
              this.lineMarkerList.push({
                date:index,
                surveyed: data[index],
                dateOrder:date
              });
              this.lineMarkerList=this.commonService.transformNumeric(this.lineMarkerList,"dateOrder");
            }
          }
        }
      }
    });
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
                  this.surveyorList.push({ userId: index, name: name, wardNo: dataSurvey["ward"], lines: lines, loginId: loginId, isActive: isActive });
                  if (isActive == true) {
                    this.assignedList.push({ userId: index, name: name, wardNo: dataSurvey["ward"], lines: lines, loginId: loginId, isActive: isActive });
                  }
                } else {
                  this.surveyorList.push({ userId: index, name: name, wardNo: "", lines: "", loginId: loginId, isActive: isActive });
                  if (isActive == true) {
                    this.assignedList.push({ userId: index, name: name, wardNo: "", lines: "", loginId: loginId, isActive: isActive });
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
    let lineInstance = this.db
      .object(this.dbPath)
      .valueChanges()
      .subscribe((data) => {
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
    this.zoneList = this.mapService.getlatestZones();
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
  name: string;
  wardNo: string;
  average:string;
  totalDays:string;
}
