import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MapService } from "../../services/map/map.service";
import { HtmlAstPath, identifierModuleUrl } from "@angular/compiler";

@Component({
  selector: "app-employee-marking",
  templateUrl: "./employee-marking.component.html",
  styleUrls: ["./employee-marking.component.scss"],
})
export class EmployeeMarkingComponent implements OnInit {
  constructor(
    private router: Router,
    public db: AngularFireDatabase,
    private commonService: CommonService,
    private modalService: NgbModal,
    private mapService: MapService
  ) {}

  userList: any[];
  markerList: any[];
  markerWardList: any[];
  lastEmpId: any;
  zoneList: any[];
  markerData: markerDatail = {
    totalMarking: "0",
    totalWardMarking: "0",
    totalDays: 0,
    average: "0",
    name: "",
    wardNo: "",
  };
  isFirst = true;

  ngOnInit() {
    this.getZoneList();
    this.getEmployee();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  getEmployee() {
    this.userList = [];
    let dbPath = "EntityMarkingData/MarkerAppAccess";
    let userInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        userInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let name = data[index]["name"];
              let wardNo = data[index]["assignedWard"];
              this.userList.push({
                empId: Number(index),
                name: name,
                wardNo: wardNo,
                phone: data[index]["phone"],
                isActive: data[index]["isActive"],
                password: data[index]["password"],
              });
              if (i == 0) {
                this.getMarkerDetail(index, wardNo, 0);
                setTimeout(() => {
                  $("#tr0").addClass("active");
                }, 600);
              }
            }
          }
        } else {
          this.lastEmpId = 101;
        }
      });
  }

  getMarkerDetail(empId: any, wardNo: any, index: any) {
    if (this.isFirst == false) {
      this.setActiveClass(index);
    } else {
      this.isFirst = false;
    }
    this.markerData.totalMarking = "0";
    this.markerData.totalWardMarking = "0";
    this.markerData.average = "0";
    this.markerData.totalDays = 0;
    this.markerList = [];
    this.markerWardList = [];
    let userDetail = this.userList.find((item) => item.empId == empId);
    if (userDetail != undefined) {
      this.markerData.name = userDetail.name;
      this.markerData.wardNo = userDetail.wardNo;
    }
    let dbPath =
      "EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" +
      empId +
      "/total";
    let markerInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != undefined) {
          this.markerData.totalMarking = data.toString();
        }
      });

    dbPath =
      "EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + empId;
    let wardInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        wardInstance.unsubscribe();
        if (data != undefined) {
          console.log(data);
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length - 1; i++) {
              let index = keyArray[i];
              if (index == wardNo) {
                this.markerData.totalWardMarking = data[index];
              }
              this.markerWardList.push({ wardNo: index, markers: data[index] });
            }
          }
        }
      });

    dbPath = "EntityMarkingData/MarkingSurveyData/Employee/DateWise";
    let dateInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        dateInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let list = Object.keys(data[index]);
              if (list.length > 0) {
                for (let j = 0; j < list.length; j++) {
                  if (list[j] == empId) {
                    this.markerData.totalDays =
                      Number(this.markerData.totalDays) + 1;
                    this.markerList.push({
                      date: index,
                      markers: data[index][list[j]],
                    });
                  }
                }
              }
            }
            if (this.markerData.totalDays != 0) {
              let average =
                Number(this.markerData.totalMarking) /
                Number(this.markerData.totalDays);
              if (average % 1 == 0) {
                this.markerData.average = average.toFixed(0);
              } else {
                this.markerData.average = average.toFixed(2);
              }
            }
          }
        }
      });
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.userList.length; i++) {
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

  openModel(content: any, id: any, type: any) {
    if (type == "ward") {
      let userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.isActive == false) {
          this.commonService.setAlertMessage(
            "error",
            "This account is in-active, please active account !!!"
          );
          return;
        }
      }
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 190;
      let width = 400;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content")
        .parent()
        .css("max-width", "" + width + "px")
        .css("margin-top", marginTop);
      $("div .modal-content")
        .css("height", height + "px")
        .css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      $("#empID").val(id);
      userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.wardNo != null) {
          setTimeout(() => {
            $("#ddlWard").val(userDetail.wardNo);
          }, 100);
        }
      }
    } else if (type == "delete") {
      let userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.wardNo == null) {
          this.commonService.setAlertMessage(
            "error",
            "No assignment found !!!"
          );
          return;
        }
      }
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 170;
      let width = 400;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content")
        .parent()
        .css("max-width", "" + width + "px")
        .css("margin-top", marginTop);
      $("div .modal-content")
        .css("height", height + "px")
        .css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#deleteId").val(id);
      }
    } else {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 335;
      let width = 400;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content")
        .parent()
        .css("max-width", "" + width + "px")
        .css("margin-top", marginTop);
      $("div .modal-content")
        .css("height", height + "px")
        .css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#key").val(id);
        let userDetail = this.userList.find((item) => item.empId == id);
        if (userDetail != undefined) {
          $("#txtName").val(userDetail.name);
          $("#txtPhone").val(userDetail.phone);
          $("#txtPassword").val(userDetail.password);
          if (userDetail.isActive == true) {
            let element = <HTMLInputElement>document.getElementById("chkAcive");
            element.checked = true;
          }
        }
      }
    }
  }

  removeAssignment() {
    let empID = $("#deleteId").val();
    let dbPath = "EntityMarkingData/MarkerAppAccess/" + empID;
    this.db.object(dbPath).update({
      assignedWard: null,
    });
    this.closeModel();
    let userDetail = this.userList.find((item) => item.empId == empID);
    if (userDetail != undefined) {
      userDetail.wardNo = null;
    }
  }

  saveWard() {
    let empID = $("#empID").val();
    if ($("#ddlWard").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select ward!!!");
      return;
    }
    if (empID != "0") {
      let wardNo = $("#ddlWard").val();
      let element = <HTMLInputElement>document.getElementById("chkRemove");
      if (element.checked == true) {
        wardNo = null;
      }
      let dbPath = "EntityMarkingData/MarkerAppAccess/" + empID;
      this.db.object(dbPath).update({
        assignedWard: wardNo,
      });
      $("#empID").val("0");
      this.closeModel();
      let userDetail = this.userList.find((item) => item.empId == empID);
      if (userDetail != undefined) {
        userDetail.wardNo = wardNo;
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  saveEmployee() {
    let id = $("#key").val();
    let name = $("#txtName").val();
    let phone = $("#txtPhone").val();
    let password = $("#txtPassword").val();
    let isActive = false;
    let element = <HTMLInputElement>document.getElementById("chkAcive");
    if (element.checked == true) {
      isActive = true;
    }
    if (name == "") {
      this.commonService.setAlertMessage("error", "Please enter name !!!");
      return;
    }
    if (phone == "") {
      this.commonService.setAlertMessage(
        "error",
        "Please enter mobile no. !!!"
      );
      return;
    }
    if (password == "") {
      this.commonService.setAlertMessage("error", "Please enter password !!!");
      return;
    }
    if (id == "0") {
      if (this.userList.length > 0) {
        this.userList = this.commonService.transformString(
          this.userList,
          "empId"
        );
        this.lastEmpId =
          Number(this.userList[this.userList.length - 1]["empId"]) + 1;
      }

      let dbPath = "EntityMarkingData/MarkerAppAccess/" + this.lastEmpId;
      const data = {
        name: name,
        phone: phone,
        password: password,
        isActive: isActive,
      };
      this.db.object(dbPath).update(data);

      $("#key").val("0");
      this.commonService.setAlertMessage(
        "success",
        "User added successfully !!!"
      );
    } else {
      let dbPath = "EntityMarkingData/MarkerAppAccess/" + id;
      this.db.object(dbPath).update({
        name: name,
        password: password,
        phone: phone,
        isActive: isActive,
      });
    }
    this.isFirst = true;
    this.closeModel();
    this.getEmployee();
  }
}

export class markerDatail {
  totalMarking: string;
  totalWardMarking: string;
  totalDays: number;
  average: string;
  name: string;
  wardNo: string;
}
