import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {

  constructor(public fs: FirebaseService, private modalService: NgbModal, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  designationList: any[] = [];
  designationUpdateList: any[];
  allEmployeeList: any[] = [];
  employeeList: any[] = [];
  fireStorePath: any;
  ddlDesignation = "#ddlDesignation";
  ddlDesignationUpdate = "#ddlDesignationUpdate";
  ddlUser = "#ddlUser";
  empID = "#empID";
  empIDActive = "#empIDActive";
  empStatus = "#empStatus";
  confirmTitle = "#confirmTitle";
  divLoader = "#divLoader";
  txtName = "#txtName";

  employeeCountSummary: employeeCountSummary = {
    total: 0,
    active: 0,
    inActive: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.fireStorePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    $(this.ddlDesignation).val("all");
    $(this.ddlUser).val("active");
    this.designationUpdateList = JSON.parse(localStorage.getItem("designation"));
    this.getAccountDetail();
  }

  getAccountDetail() {
    $(this.divLoader).show();
    this.allEmployeeList = [];
    this.designationList = [];
    this.employeeList = [];
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployees.json?alt=media";
    let accountInstance = this.httpService.get(path).subscribe(data => {
      accountInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            this.allEmployeeList.push({ empId: empId.toString(), empCode: data[empId]["GeneralDetails"]["empCode"], name: data[empId]["GeneralDetails"]["name"], designationId: data[empId]["GeneralDetails"]["designationId"], designation: data[empId]["GeneralDetails"]["designation"], status: data[empId]["GeneralDetails"]["status"], empType: data[empId]["GeneralDetails"]["empType"] });
          }
        }
        this.allEmployeeList = this.allEmployeeList.sort((a, b) => Number(b.empId) < Number(a.empId) ? 1 : -1);
        this.checkForNewEmployee();
      }
    }, error => {
      this.checkForNewEmployee();
    });
  }

  checkForNewEmployee() {
    let dbPath = "Employees/lastEmpId";
    let lastEmpIdInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastEmpIdData => {
        lastEmpIdInstance.unsubscribe();
        let lastEmpId = Number(lastEmpIdData);
        let jsonLastEmpId = 100;
        if (this.allEmployeeList.length > 0) {
          jsonLastEmpId = Number(this.allEmployeeList[this.allEmployeeList.length - 1]["empId"]);
        }
        if (lastEmpId != jsonLastEmpId) {
          this.updateJsonForNewEmployee(jsonLastEmpId, lastEmpId);
        }
        else {
          this.getCountSummary();
          this.getRoles();
          this.filterData();
        }
      }
    );
  }

  getCountSummary() {
    this.employeeCountSummary.total = this.allEmployeeList.length;
    this.employeeCountSummary.active = this.allEmployeeList.filter(item => item.status == "1").length;
    this.employeeCountSummary.inActive = this.allEmployeeList.filter(item => item.status != "1").length;
  }

  updateJsonForNewEmployee(jsonLastEmpId: any, lastEmpId: any) {
    if (jsonLastEmpId > lastEmpId) {
      this.getCountSummary();
      this.getRoles();
      this.filterData();
      this.saveJSONData();
    }
    else {
      jsonLastEmpId++;
      let dbPath = "Employees/" + jsonLastEmpId + "/GeneralDetails";
      let employeeDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        employeeDetail => {
          employeeDetailInstance.unsubscribe();
          if (employeeDetail != null) {
            let designation = "";
            let empType = 1;
            if (this.designationUpdateList.length > 0) {
              let detail = this.designationUpdateList.find(item => item.designationId == employeeDetail["designationId"]);
              if (detail != undefined) {
                designation = detail.designation;
                if (detail.designation == "Transportation Executive") {
                  designation = "Driver";
                  empType = 2;
                }
                else if (detail.designation == "Service Excecutive ") {
                  designation = "Helper";
                  empType = 2;
                }
                else {
                  designation = detail.designation;
                }
              }
            }
            this.allEmployeeList.push({ empId: jsonLastEmpId.toString(), empCode: employeeDetail["empCode"], name: employeeDetail["name"], designationId: employeeDetail["designationId"], designation: designation, status: employeeDetail["status"], empType: empType });
          }
          this.updateJsonForNewEmployee(jsonLastEmpId, lastEmpId);
        }
      );
    }
  }

  saveJSONData() {
    let path = "/";
    const obj = {};
    for (let i = 0; i < this.allEmployeeList.length; i++) {
      const data = {
        designationId: this.allEmployeeList[i]["designationId"],
        empCode: this.allEmployeeList[i]["empCode"],
        name: this.allEmployeeList[i]["name"],
        designation: this.allEmployeeList[i]["designation"],
        status: this.allEmployeeList[i]["status"],
        empType: this.allEmployeeList[i]["empType"]
      }
      obj[this.allEmployeeList[i]["empId"]] = { GeneralDetails: data };
    }
    this.commonService.saveJsonFile(obj, "Employees.json", path);
    $(this.divLoader).hide();
  }

  getRoles() {
    let list = this.allEmployeeList.map(item => item.designation)
      .filter((value, index, self) => self.indexOf(value) === index);
    for (let i = 0; i < list.length; i++) {
      this.designationList.push({ designation: list[i] });
      this.designationList = this.commonService.transformNumeric(this.designationList, "designation");
    }
  }

  filterData() {
    let name = $(this.txtName).val();
    name = name.toString().toUpperCase();
    let status = $(this.ddlUser).val();
    let designationFilterVal = $(this.ddlDesignation).val();
    this.showAccountDetail(status, designationFilterVal, name);
  }

  showAccountDetail(status: any, designation: any, name: any) {
    if (status == "all") {
      this.employeeList = this.allEmployeeList;
    }
    else if (status == "active") {
      this.employeeList = this.allEmployeeList.filter(item => item.status == "1" && (item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name)));
    }
    else {
      this.employeeList = this.allEmployeeList.filter(item => item.status != "1" && (item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name)));
    }
    if (designation != "all") {
      this.employeeList = this.employeeList.filter(item => item.designation == designation && (item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name)));
    }
    $(this.divLoader).hide();
  }

  updateEmployeeStatus() {
    let empId = $(this.empIDActive).val();
    let status = $(this.empStatus).val();
    let empDetail = this.allEmployeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.status = status;
    }
    this.filterData();
    this.getCountSummary();
    this.updateStatusInDatabase(empId, status);
    this.saveJSONData();
    this.commonService.setAlertMessage("success", "Employee status updated successfully !!!");
  }

  updateStatusInDatabase(empId: any, status: any) {
    let dbPath = "Employees/" + empId + "/GeneralDetails/";
    this.db.object(dbPath).update({ status: status });
    this.closeModel();
  }

  updateDesignation() {
    let empId = $(this.empID).val();
    let designation = $(this.ddlDesignationUpdate).val();
    let empDetail = this.allEmployeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.designation = designation;
      let empType = 1;
      if (designation == "Driver") {
        designation = "Transportation Executive";
        empType = 2;
      }
      else if (designation == "Helper") {
        designation = "Service Excecutive ";
        empType = 2;
      }
      let detail = this.designationUpdateList.find(item => item.designation == designation);
      if (detail != undefined) {
        empDetail.designationId = detail.designationId;
        this.updateDesignationInDatabase(empId, detail.designationId);
      }
    }
    this.filterData();
    this.saveJSONData();
    this.closeModel();
    this.commonService.setAlertMessage("success", "Employee designation updated successfully !!!");
  }

  updateDesignationInDatabase(empId: any, designationId: any) {
    let dbPath = "Employees/" + empId + "/GeneralDetails/";
    this.db.object(dbPath).update({ designationId: designationId.toString() });
    this.closeModel();
  }

  openModel(content: any, id: any, type: any) {
    let userDetail = this.allEmployeeList.find((item) => item.empId == id);
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 190;
    let width = 420;
    if (type == "designation") {
      height = 190;
    }
    else {
      height = 160;
    }
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (type == "designation") {
      $(this.empID).val(id);
      if (userDetail != undefined) {
        if (userDetail.designation != null) {
          setTimeout(() => {
            $(this.ddlDesignationUpdate).val(userDetail.designation);
          }, 100);
        }
      }
    }
    else {
      $(this.empIDActive).val(id);
      if (type == "active") {
        $(this.confirmTitle).html("Do you want to in-active employee?");
        $(this.empStatus).val("2");

      }
      else {
        $(this.confirmTitle).html("Do you want to active employee?");
        $(this.empStatus).val("1");
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }
}


export class employeeCountSummary {
  total: number;
  active: number;
  inActive: number
}

