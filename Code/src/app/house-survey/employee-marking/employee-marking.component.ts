import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MapService } from "../../services/map/map.service";

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
  lastEmpId: any;
  zoneList: any[];
  markerData: markerDatail = {
    totalMarking: "0",
    totalWardMarking: "0",
  };

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
            }
          }
        } else {
          this.lastEmpId = 101;
        }
      });
  }

  openModel(content: any, id: any, type: any) {
    if (type != "ward") {
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
    } else {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 200;
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
      let userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.wardNo != null) {
          setTimeout(() => {
            $("#ddlWard").val(userDetail.wardNo);
          }, 100);
        }
      }
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
    this.closeModel();
    this.getEmployee();
  }

  getCurrentWardMarking(empId: any, wardNo: any) {
    this.markerData.totalWardMarking = "0";
    let dbPath = "WardLines/" + wardNo;
    let wardLineInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((lineData) => {
        wardLineInstance.unsubscribe();
        if (lineData != null) {
          let lines = Number(lineData);
          for (let i = 1; i <= lines; i++) {
            dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i;
            let instance = this.db
              .list(dbPath)
              .valueChanges()
              .subscribe((data) => {
                instance.unsubscribe();
                if (data.length > 0) {
                  for (let j = 0; j < data.length; j++) {
                    if (data[j]["userId"] != undefined) {
                      if (data[j]["userId"] == empId) {
                        this.markerData.totalWardMarking = (
                          Number(this.markerData.totalWardMarking) + 1
                        ).toString();
                      }
                    }
                  }
                }
              });
          }
        }
      });
  }

  getMarkerDetail(empId: any, wardNo: any) {
    this.markerData.totalMarking = "0";
    this.markerList = [];
    let dbPath =
      "EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + empId;
    let markerInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          this.markerData.totalMarking = data.toString();
        }
      });
    if (wardNo != "") {
      this.getCurrentWardMarking(empId, wardNo);
    }
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
                    this.markerList.push({
                      date: index,
                      markers: data[index][list[j]],
                    });
                  }
                }
              }
            }
          }
        }
      });
  }
}

export class markerDatail {
  totalMarking: string;
  totalWardMarking: string;
}
