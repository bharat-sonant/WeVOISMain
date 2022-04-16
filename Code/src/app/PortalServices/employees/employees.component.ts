import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  designationList: any[] = [];
  allEmployeeList: any[] = [];
  employeeList: any[] = [];
  ddlDesignation = "#ddlDesignation";
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

  updateEmployee(status: any, empId: any) {
    let empDetail = this.allEmployeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.status = status;
    }
    empDetail = this.employeeList.find(item => item.empId == empId);
    if (empDetail != undefined) {
      empDetail.status = status;
    }
    this.filterData();
    this.updateInDatabase(empId,status);
    let filePath = "/EmployeeAccount/";
    let fileName = "accountDetail.json";
    this.commonService.saveJsonFile(this.allEmployeeList, fileName, filePath);
    this.commonService.setAlertMessage("success", "Employee updated successfully !!!");
  }

  updateInDatabase(empId: any, status: any) {
    let dbPath = "Employees/" + empId + "/GeneralDetails/status";
    this.db.object(dbPath).update({ status: status });
  }
}
