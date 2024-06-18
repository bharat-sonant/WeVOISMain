import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private modalService: NgbModal, private commonService: CommonService, public httpService: HttpClient) { }
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
  spStatus = "#spStatus";
  empIDActive = "#empIDActive";
  empStatus = "#empStatus";
  confirmTitle = "#confirmTitle";
  divLoader = "#divLoader";
  txtName = "#txtName";
  accountList: any[] = [];
  serviceName = "employees";

  departmentList: any[] = [];
  departmentUpdateList: any[] = [];
  ddlDepartment = "#ddlDepartment";
  ddlDepartmentUpdate: any;

  employeeCountSummary: employeeCountSummary = {
    active: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault = async () => {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.fireStorePath = this.commonService.fireStoragePath;
    $(this.ddlDesignation).val("all");
    $(this.ddlUser).val("active");
    this.designationUpdateList = JSON.parse(localStorage.getItem("designation"));
    this.departmentUpdateList = JSON.parse(localStorage.getItem("department"));
    this.getEmployeesNew();
  }

  getEmployeesNew() {
    $(this.divLoader).show();
    this.allEmployeeList = [];
    this.designationList = [];
    this.employeeList = [];
    let dbPath = "Employees/lastEmpId";
    let lastEmpIdInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      lastEmpIdInstance.unsubscribe();
      if (data != null) {
        let i = 100;
        let lastEmpId = Number(data);
        const promises = [];
        for (let i = 100; i <= lastEmpId; i++) {
          promises.push(Promise.resolve(this.getEmployeeDetail(i)));
        }

        Promise.all(promises).then((results) => {
          let merged = [];
          for (let i = 0; i < results.length; i++) {
            if (results[i]["status"] == "success") {
              merged = merged.concat(results[i]["data"]);
            }
          }
          this.allEmployeeList = merged;
          this.getDepartments();
          this.filterData();
          this.saveJSONData();
          $(this.divLoader).hide();
        });
      }
      else {
        this.commonService.setAlertMessage("error", "No record found !!!");
        $(this.divLoader).hide();
      }
    });
  }

  getEmployeeDetail(empId: any) {
    return new Promise((resolve) => {
      let employeeData = {};
      let dbPath = "Employees/" + empId + "/GeneralDetails";
      let employeeDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        employeeDetail => {
          employeeDetailInstance.unsubscribe();
          if (employeeDetail) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getEmployeeDetail", employeeDetail);
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
                else if (detail.designation == "Service Executive") {
                  designation = "Helper";
                  empType = 2;
                }
                else {
                  designation = detail.designation;
                }
              }
            }
            let mobile = "";
            if (employeeDetail["mobile"] != null) {
              mobile = employeeDetail["mobile"];
            }
            let salaryType = "salaried";
            if (employeeDetail["salaryType"] != null) {
              salaryType = employeeDetail["salaryType"];
            }
            let department = "";
            if (this.departmentUpdateList.length > 0) {
              let detail = this.departmentUpdateList.find(item => item.id == employeeDetail["departmentId"]);
              if (detail != undefined) {
                department = detail.name;
              }
            }
            employeeData = { empId: empId.toString(), empCode: employeeDetail["empCode"], name: employeeDetail["name"], designationId: employeeDetail["designationId"], designation: designation, status: employeeDetail["status"], empType: empType, mobile: mobile, salaryType: salaryType, departmentId: employeeDetail['departmentId'].toString(), department: department };
            resolve({ status: "success", data: employeeData });
          }
          else {
            resolve({ status: "fail", data: employeeData });
          }
        }
      );
    });
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
        salaryType: this.allEmployeeList[i]["salaryType"],
        mobile: this.allEmployeeList[i]["mobile"],
        department: this.allEmployeeList[i]["department"],
        departmentId: this.allEmployeeList[i]["departmentId"]

      }
      obj[this.allEmployeeList[i]["empId"]] = { GeneralDetails: data };
    }
    this.commonService.saveJsonFile(obj, "Employees.json", path);
    $(this.divLoader).hide();
  }

  getDepartments() {
    this.designationList = [];
    this.departmentList = []
    $(this.ddlDepartment).val('all');

    let list = this.allEmployeeList.map(item => item.department).filter((value, index, self) => self.indexOf(value) === index);
    for (let i = 0; i < list.length; i++) {
      this.departmentList.push({ department: list[i] });

      this.departmentList = this.commonService.transformNumeric(this.departmentList, "department");
    }
  }
  getDesignations() {
    let selectedDepartment = $(this.ddlDepartment).val();
    this.designationList = [];
    $(this.ddlDesignation).val('all');

    // let list = this.allEmployeeList.map(item => ({designationId:item.designationId,designation: item.designation,department: item.department})).filter((value, index, self) => self.indexOf(value) === index);
    let list = this.allEmployeeList.filter(item => item.department === selectedDepartment).filter((value, index, self) =>
      index === self.findIndex((t) => (t.designation === value.designation && t.department === value.department))).map(item => item.designation);

    for (let i = 0; i < list.length; i++) {
      this.designationList.push({ designation: list[i] });
      this.designationList = this.commonService.transformNumeric(this.designationList, "designation");
    }
    this.filterData()
  }

  filterData() {
    let name = $(this.txtName).val();
    name = name.toString().toUpperCase();
    let status = $(this.ddlUser).val();
    let designationFilterVal = $(this.ddlDesignation).val();
    this.showAccountDetail(status, designationFilterVal, name);
  }

  showAccountDetail(status: any, designation: any, name: any) {
    this.employeeList = this.allEmployeeList;
    if (status == "all") {
      this.employeeList = this.allEmployeeList.filter(item => item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name));
      // this.employeeCountSummary.active = this.employeeList.length;
      $(this.spStatus).html("All");
    }
    else if (status == "active") {
      this.employeeList = this.allEmployeeList.filter(item => item.status == "1" && (item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name)));
      $(this.spStatus).html("Active");
      // this.employeeCountSummary.active = this.employeeList.length;
    }
    else {
      this.employeeList = this.allEmployeeList.filter(item => item.status != "1" && (item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name)));
      $(this.spStatus).html("In-Active");
      // this.employeeCountSummary.active = this.employeeList.length;
    }
    if ($(this.ddlDepartment).val() !== 'all') {
      this.employeeList = this.employeeList.filter(item => item.department == $(this.ddlDepartment).val() && (item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name)));
    }
    if (designation != "all") {
      this.employeeList = this.employeeList.filter(item => item.designation == designation && (item.name.toString().toUpperCase().includes(name) || item.empCode.includes(name)));
    }
    this.employeeCountSummary.active = this.employeeList.length;
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
    this.filterData();
    this.employeeCountSummary.active = this.allEmployeeList.filter(item => item.status == "1").length;
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
    $(this.divLoader).show();
    setTimeout(() => {
      $(this.divLoader).hide();
    }, 3000);
    let empId = $(this.empID).val();
    let designationId = $(this.ddlDesignationUpdate).val();
    if (!designationId) {
      this.commonService.setAlertMessage("error", "Please select a designation !!!");
      $(this.divLoader).hide();
      return;
    }
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
      empDetail.departmentId = this.ddlDepartmentUpdate;
      let departmentDeatil = this.departmentUpdateList.find(item => item.id == this.ddlDepartmentUpdate);
      if (departmentDeatil) {
        empDetail.department = departmentDeatil.name;
      }
      this.updateDesignationInDatabase(empId, designationId, salaryType);
    }
    this.getDepartments();
    this.filterData();
    this.saveJSONData();
    this.closeModel();
    this.commonService.setAlertMessage("success", "Employee designation updated successfully !!!");
  }

  updateDesignationInDatabase(empId: any, designationId: any, salaryType: any) {
    let dbPath = "Employees/" + empId + "/GeneralDetails/";
    this.db.object(dbPath).update({ designationId: designationId.toString(), salaryType: salaryType, departmentId: this.ddlDepartmentUpdate });
    this.closeModel();
  }

  openModel(content: any, id: any, type: any) {
    let userDetail = this.allEmployeeList.find((item) => item.empId == id);
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 190;
    let width = 420;
    if (type == "designation") {
      height = 300;
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
            this.ddlDepartmentUpdate = userDetail.departmentId

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
    if (this.employeeList.length > 0) {
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
      htmlString += "Department";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Designation";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Status";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.employeeList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.employeeList[i]["empCode"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.employeeList[i]["name"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.employeeList[i]["mobile"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.employeeList[i]["department"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.employeeList[i]["designation"];
        htmlString += "</td>";
        htmlString += "<td>";
        if (this.employeeList[i]["status"] == "1") {
          htmlString += "Active";
        }
        else {
          htmlString += "In-Active";
        }
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "<table>";
      let fileName = "Employee [" + this.commonService.getFireStoreCity() + "].xlsx";
      this.commonService.exportExcel(htmlString, fileName);
      $(this.divLoader).hide();
    }
  }

  resetDesignationField = () => {
    $(this.ddlDesignationUpdate).val('');
  }

}


export class employeeCountSummary {
  active: number
}

