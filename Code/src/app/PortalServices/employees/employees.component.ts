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
  designationUpdateList: any[];
  allEmployeeList: any[] = [];
  employeeList: any[] = [];
  employeeJsonList: any[];
  fireStorePath: any;
  ddlDesignation = "#ddlDesignation";
  ddlDesignationUpdate = "#ddlDesignationUpdate";
  ddlUser = "#ddlUser";
  empID = "#empID";
  empIDActive = "#empIDActive";
  empStatus="#empStatus";
  exampleModalLongTitleActive = "#exampleModalLongTitleActive";
  divLoader = "#divLoader";
  txtName = "#txtName";

  employeeDetail: employeeDetail = {
    lastUpdate: "",
    lastUpdateBy: ""
  }

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
    this.getLastUpdate();
    this.getAccountDetail();
  }

  getLastUpdate() {
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FLastUpdate.json?alt=media";
    let lastUpdateInstance = this.httpService.get(path).subscribe(data => {
      lastUpdateInstance.unsubscribe();
      if (data != null) {
        this.employeeDetail.lastUpdate = data["lastUpdate"];
        let userData = this.commonService.getPortalUserDetailById(data["updateBy"]);
        if (userData != undefined) {
          this.employeeDetail.lastUpdateBy = userData["name"];
        }
      }
    });
  }

  getAccountDetail() {
    $(this.divLoader).show();
    this.allEmployeeList = [];
    this.designationList = [];
    this.employeeList = [];
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let accountInstance = this.httpService.get(path).subscribe(data => {
      accountInstance.unsubscribe();
      if (data != null) {
        this.allEmployeeList = JSON.parse(JSON.stringify(data));
        this.allEmployeeList = this.allEmployeeList.sort((a, b) => Number(b.empId) < Number(a.empId) ? 1 : -1);
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
    let empId=$(this.empIDActive).val();
    let status=$(this.empStatus).val();
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
    this.closeModel();
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

  updateAccountJson() {
    $(this.divLoader).show();
    this.employeeJsonList = [];
    let dbPath = "Employees";
    let employeeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        employeeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let empId = keyArray[i];
              if (data[empId]["GeneralDetails"] != null) {
                let status = data[empId]["GeneralDetails"]["status"];
                let name = data[empId]["GeneralDetails"]["name"];
                let empCode = data[empId]["GeneralDetails"]["empCode"];
                let designationId = data[empId]["GeneralDetails"]["designationId"];
                let email = data[empId]["GeneralDetails"]["email"];
                let accountNo = "";
                let ifsc = "";
                let modifyBy = "";
                let modifyDate = "";
                let isLock = 0;

                if (data[empId]["BankDetails"] != null) {
                  if (data[empId]["BankDetails"]["AccountDetails"] != null) {
                    if (data[empId]["BankDetails"]["AccountDetails"]["accountNumber"] != null) {
                      accountNo = data[empId]["BankDetails"]["AccountDetails"]["accountNumber"];
                    }
                    if (data[empId]["BankDetails"]["AccountDetails"]["ifsc"] != null) {
                      ifsc = data[empId]["BankDetails"]["AccountDetails"]["ifsc"];
                    }
                  }
                  if (data[empId]["BankDetails"]["isLock"] != null) {
                    isLock = data[empId]["BankDetails"]["isLock"];
                  }
                }

                if (data[empId]["updateSummary"] != null) {
                  if (data[empId]["updateSummary"]["by"] != null) {
                    modifyBy = data[empId]["updateSummary"]["by"];
                  }
                  if (data[empId]["updateSummary"]["date"] != null) {
                    modifyDate = data[empId]["updateSummary"]["date"];
                  }
                }
                let designation = "";
                let empType = 1;
                if (this.designationUpdateList.length > 0) {
                  let detail = this.designationUpdateList.find(item => item.designationId == designationId);
                  if (detail != undefined) {
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
                this.employeeJsonList.push({ empId: empId, empCode: empCode, name: name, email: email, designation: designation, status: status, accountNo: accountNo, ifsc: ifsc, modifyBy: modifyBy, modifyDate: modifyDate, isLock: isLock, empType: empType });
              }
            }
            this.saveJSONData();
            setTimeout(() => {
              this.getAccountDetail();
            }, 3000);

          }
        }
      }
    );
  }

  saveJSONData() {
    let path = "/EmployeeAccount/";
    this.commonService.saveJsonFile(this.employeeJsonList, "accountDetail.json", path);
    let time = this.commonService.setTodayDate() + " " + this.commonService.getCurrentTimeWithSecond();
    this.employeeDetail.lastUpdate = time;
    let userData = this.commonService.getPortalUserDetailById(localStorage.getItem("userID"));
    if (userData != undefined) {
      this.employeeDetail.lastUpdateBy = userData["name"];
    }
    const obj = { lastUpdate: time, updateBy: localStorage.getItem("userID") };
    this.commonService.saveJsonFile(obj, "LastUpdate.json", path);
    this.commonService.setAlertMessage("success", "Employee data updated successfully !!!");
    $(this.divLoader).hide();
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
        $(this.exampleModalLongTitleActive).html("Do you want to in-active employee?");
        $(this.empStatus).val("2");

      }
      else {
        $(this.exampleModalLongTitleActive).html("Do you want to active employee?");
        $(this.empStatus).val("1");
      }
    }

  }

  closeModel() {
    this.modalService.dismissAll();
  }


}

export class employeeDetail {
  lastUpdate: string;
  lastUpdateBy: string;
}
