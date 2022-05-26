import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, public fs: FirebaseService, private modalService: NgbModal, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  designationList: any[] = [];
  allEmployeeList: any[] = [];
  employeeList: any[] = [];
  ddlDesignation = "#ddlDesignation";
  ddlDesignationUpdate = "#ddlDesignationUpdate";
  empID = "#empID";
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    $(this.ddlDesignation).val("all");
    this.getAccountDetail();
  }

  getAccountDetail() {
    $(this.divLoader).show();
    this.allEmployeeList = [];
    this.designationList = [];
    this.employeeList = [];
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let accountInstance = this.httpService.get(path).subscribe(data => {
      accountInstance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        this.allEmployeeList = this.commonService.transformNumeric(JSON.parse(jsonData), "empCode");
        this.getRoles();
        this.filterData();
      }
    }, error => {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("error", "Sorry! no record found !!!");
    });
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
    let designationFilterVal = $(this.ddlDesignation).val();
    this.showAccountDetail(designationFilterVal);
  }

  showAccountDetail(designation: any) {
    if (designation != "all") {
      this.employeeList = this.allEmployeeList.filter(item => item.designation == designation);
    }
    else {
      this.employeeList = this.allEmployeeList;
    }
    $(this.divLoader).hide();
  }

  updateEmployeeStatus(status: any, empId: any) {
    let empDetail = this.allEmployeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.status = status;
    }
    empDetail = this.employeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.status = status;
    }
    this.filterData();
    this.updateStatusInDatabase(empId, status);
    let filePath = "/EmployeeAccount/";
    let fileName = "accountDetail.json";
    this.commonService.saveJsonFile(this.allEmployeeList, fileName, filePath);
    this.commonService.setAlertMessage("success", "Employee status updated successfully !!!");
  }

  updateStatusInDatabase(empId: any, status: any) {
    let dbPath = "Employees/" + empId + "/GeneralDetails/";
    this.db.object(dbPath).update({ status: status });
  }

  updateDesignation() {
    let empId = $(this.empID).val();

    let empDetail = this.allEmployeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.designation = $(this.ddlDesignationUpdate).val();
    }
    empDetail = this.employeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.designation = $(this.ddlDesignationUpdate).val();
    }
    this.filterData();
    this.updateDesignationInDatabase(empId, $(this.ddlDesignationUpdate).val());
    let filePath = "/EmployeeAccount/";
    let fileName = "accountDetail.json";
    this.commonService.saveJsonFile(this.allEmployeeList, fileName, filePath);
    this.commonService.setAlertMessage("success", "Employee designation updated successfully !!!");
  }

  updateDesignationInDatabase(empId: any, designation: any) {
    if (designation == "Helper") {
      designation = "Service Excecutive ";
    }
    else if (designation == "Driver") {
      designation = "Transportation Executive";
    }
    let designationId = 0;
    let allDesignationList = JSON.parse(localStorage.getItem("designation"));
    let detail = allDesignationList.find(item => item.designation == designation);
    if (detail != undefined) {
      designationId = detail.designationId;
    }
    let dbPath = "Employees/" + empId + "/GeneralDetails/";
    this.db.object(dbPath).update({ designationId: designationId });
    this.closeModel();
  }


  openModel(content: any, id: any) {
    let userDetail = this.allEmployeeList.find((item) => item.empId == id);
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 190;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.empID).val(id);
    if (userDetail != undefined) {
      if (userDetail.designation != null) {
        setTimeout(() => {
          $(this.ddlDesignationUpdate).val(userDetail.designation);
        }, 100);
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }
}
