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
  ddlSalaryTypeUpdate = "#ddlSalaryTypeUpdate";
  ddlUser = "#ddlUser";
  empID = "#empID";
  empIDActive = "#empIDActive";
  empStatus = "#empStatus";
  confirmTitle = "#confirmTitle";
  divLoader = "#divLoader";
  txtName = "#txtName";
  accountList: any[] = [];

  employeeCountSummary: employeeCountSummary = {
    active: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.fireStorePath = this.commonService.fireStoragePath;
    $(this.ddlDesignation).val("all");
    $(this.ddlUser).val("active");
    this.designationUpdateList = JSON.parse(localStorage.getItem("designation"));
    this.getEmployeeAccountDetail();
    this.getEmployees();
  }

  getEmployeeAccountDetail() {
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let employeeInstance = this.httpService.get(path).subscribe(data => {
      employeeInstance.unsubscribe();
      let jsonData = JSON.stringify(data);
      this.accountList = JSON.parse(jsonData);
    });
  }

  getEmployees() {
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
            let salaryType = "salaried";
            if (data[empId]["GeneralDetails"]["salaryType"] != null) {
              salaryType = data[empId]["GeneralDetails"]["salaryType"];
            }
            this.allEmployeeList.push({ empId: empId.toString(), empCode: data[empId]["GeneralDetails"]["empCode"], name: data[empId]["GeneralDetails"]["name"], designationId: data[empId]["GeneralDetails"]["designationId"], designation: data[empId]["GeneralDetails"]["designation"], status: data[empId]["GeneralDetails"]["status"], empType: data[empId]["GeneralDetails"]["empType"], salaryType: salaryType });
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
          this.employeeCountSummary.active = this.allEmployeeList.filter(item => item.status == "1").length;
          this.getRoles();
          this.filterData();
        }
      }
    );
  }

  getCountSummary() {
    this.employeeCountSummary.active = this.allEmployeeList.filter(item => item.status == "1").length;
  }

  updateJsonForNewEmployee(jsonLastEmpId: any, lastEmpId: any) {
    if (jsonLastEmpId > lastEmpId) {
      this.employeeCountSummary.active = this.allEmployeeList.filter(item => item.status == "1").length;
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
        empType: this.allEmployeeList[i]["empType"],
        salaryType: this.allEmployeeList[i]["salaryType"]
      }
      obj[this.allEmployeeList[i]["empId"]] = { GeneralDetails: data };
    }
    this.commonService.saveJsonFile(obj, "Employees.json", path);
    $(this.divLoader).hide();
  }

  getRoles() {
    this.designationList = [];
    let list = this.allEmployeeList.map(item => item.designation).filter((value, index, self) => self.indexOf(value) === index);
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
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 3000);
    let empId = $(this.empIDActive).val();
    let status = $(this.empStatus).val();

    let empDetail = this.allEmployeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.status = status;
    }
    let accountDetail = this.accountList.find(item => item.empId == empId);
    if (accountDetail != undefined) {
      accountDetail.status = status;
      this.saveAccountJSONData();
    }
    this.filterData();
    this.employeeCountSummary.active = this.allEmployeeList.filter(item => item.status == "1").length;
    this.updateStatusInDatabase(empId, status);
    this.saveJSONData();
    this.commonService.setAlertMessage("success", "Employee status updated successfully !!!");
  }

  saveAccountJSONData() {
    let path = "/EmployeeAccount/";
    this.commonService.saveJsonFile(this.accountList, "accountDetail.json", path);
  }

  updateStatusInDatabase(empId: any, status: any) {
    let dbPath = "Employees/" + empId + "/GeneralDetails/";
    this.db.object(dbPath).update({ status: status });
    this.closeModel();
  }

  updateDesignation() {
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 3000);
    let empId = $(this.empID).val();
    let designationId = $(this.ddlDesignationUpdate).val();
    let salaryType = $(this.ddlSalaryTypeUpdate).val();
    let empDetail = this.allEmployeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.designationId = designationId;
      empDetail.salaryType = salaryType;
      let empType = 1;
      if (designationId == "5") {
        empDetail.designation = "Driver";
        empDetail.empType = 2;
        empType = 2;
      }
      else if (designationId == "6") {
        empDetail.designation = "Helper";
        empDetail.empType = 2;
        empType = 2;
      }
      else {
        let detail = this.designationUpdateList.find(item => item.designationId == designationId);
        if (detail != undefined) {
          empDetail.designation = detail.designation;
          empDetail.empType = 1;
        }
      }
      let accountDetail = this.accountList.find(item => item.empId == empId);
      if (accountDetail != undefined) {
        accountDetail.designation = empDetail.designation;
        accountDetail.salaryType = empDetail.salaryType;
        accountDetail.empType = empType;
        this.saveAccountJSONData();
      }
      this.updateDesignationInDatabase(empId, designationId, salaryType);
    }
    this.getRoles();
    this.filterData();
    this.saveJSONData();
    this.closeModel();
    this.commonService.setAlertMessage("success", "Employee designation updated successfully !!!");
  }

  updateDesignationInDatabase(empId: any, designationId: any, salaryType: any) {
    let dbPath = "Employees/" + empId + "/GeneralDetails/";
    this.db.object(dbPath).update({ designationId: designationId.toString(), salaryType: salaryType });
    this.closeModel();
  }

  openModel(content: any, id: any, type: any) {
    let userDetail = this.allEmployeeList.find((item) => item.empId == id);
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 190;
    let width = 420;
    if (type == "designation") {
      height = 250;
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
            $(this.ddlDesignationUpdate).val(userDetail.designationId);
            $(this.ddlSalaryTypeUpdate).val(userDetail.salaryType);
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

  exportEmployee() {
    let exportEmployeeList = [];
    $(this.divLoader).show();
    let dbPath = "Employees/";
    let employeeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        employeeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let empId = keyArray[i];
              if (data[empId]["GeneralDetails"] != null) {
                if (data[empId]["GeneralDetails"]["status"] != null) {
                  let status = data[empId]["GeneralDetails"]["status"];
                  let designation = "";
                  let detail = this.designationUpdateList.find(item => item.designationId == data[empId]["GeneralDetails"]["designationId"]);
                  if (detail != undefined) {
                    designation = detail.designation;
                  }
                  let empStatus = "In-Active";
                  if (status == "1") {
                    empStatus = "Active";
                  }
                  exportEmployeeList.push({ name: data[empId]["GeneralDetails"]["name"], mobile: data[empId]["GeneralDetails"]["mobile"], designation: designation, empId:Number(empId), empStatus: empStatus });
                }
              }
            }
            if (exportEmployeeList.length > 0) {
              exportEmployeeList=this.commonService.transformNumeric(exportEmployeeList,"empId");
              let htmlString = "";
              htmlString = "<table>";
              htmlString += "<tr>";
              htmlString += "<td>";
              htmlString += "Employee ID";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "Name";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "Mobile";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "Designation";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "Status";
              htmlString += "</td>";
              htmlString += "</tr>";
              for (let i = 0; i < exportEmployeeList.length; i++) {
                htmlString += "<tr>";
                htmlString += "<td>";
                htmlString += exportEmployeeList[i]["empId"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += exportEmployeeList[i]["name"];
                htmlString += "</td>";
                htmlString += "<td t='s'>";
                htmlString += exportEmployeeList[i]["mobile"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += exportEmployeeList[i]["designation"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += exportEmployeeList[i]["empStatus"];
                htmlString += "</td>";
                htmlString += "</tr>";
              }
              htmlString += "<table>";
              let fileName = "Employee [" + this.commonService.getFireStoreCity() + "].xlsx";
              this.commonService.exportExcel(htmlString, fileName);
              $(this.divLoader).hide();
            }
          }
        }
      }
    );

  }
}


export class employeeCountSummary {
  active: number
}

