import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFirestore } from "@angular/fire/firestore";

@Component({
  selector: 'app-salary-holding-management',
  templateUrl: './salary-holding-management.component.html',
  styleUrls: ['./salary-holding-management.component.scss']
})
export class SalaryHoldingManagementComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, private modalService: NgbModal, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  fireStoreCity: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  allEmployeeList: any[];
  employeeList: any[];
  salaryHoldingList: any[];
  ddlYear = '#ddlYear';
  ddlMonth = "#ddlMonth";
  holdingId = "#holdingId";
  eventType = "#eventType";
  ddlHoldEmployee = "#ddlHoldEmployee";
  txtHoldSaid = "#txtHoldSaid";
  txtHoldingReason = "#txtHoldingReason";


  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.fireStoreCity = this.commonService.getFireStoreCity();
    if(this.fireStoreCity=="Test"){
      this.fireStoreCity="Testing";
    }
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    let date = this.commonService.getPreviousMonth(this.toDayDate, 1);
    this.yearList = [];
    this.allEmployeeList = [];
    this.employeeList = [];
    this.salaryHoldingList = [];
    this.getYear();
    this.getEmployee();
    this.selectedMonth = date.split('-')[1];
    this.selectedYear = date.split('-')[0];
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
  }


  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getEmployee() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        this.allEmployeeList = JSON.parse(jsonData);
        for (let i = 0; i < this.allEmployeeList.length; i++) {
          if (this.allEmployeeList[i]["status"] == "1") {
            let empId = this.allEmployeeList[i]["empId"];
            let name = this.allEmployeeList[i]["name"] + " (" + this.allEmployeeList[i]["empCode"] + ")";
            this.employeeList.push({ empId: empId, name: name });
            this.employeeList = this.commonService.transformNumeric(this.employeeList, "name");
          }
        }
        this.getSalaryHolding();
      }
    });
  }

  getSalaryHolding() {
    this.salaryHoldingList = [];
    this.dbFireStore.collection(this.fireStoreCity + "/EmployeeHoldSalary/Hold").get().subscribe(
      (ss) => {
        let salaryHoldingList = [];
        ss.forEach((doc) => {
          let empId = doc.id;
          let empDetail = this.allEmployeeList.find(item => item.empId == empId);
          if (empDetail != undefined) {
            let name = empDetail.name;
            let empCode = empDetail.empCode;
            let holdBy = doc.data()["holdBy"];
            let userData = this.commonService.getPortalUserDetailById(holdBy);
            if (userData != undefined) {
              let WhoHold = userData["name"];
              let holdSaidBy = doc.data()["holdSaidBy"];
              let holdReason = doc.data()["holdReason"];
              let holdDate = doc.data()["holdDate"];
              salaryHoldingList.push({ empId: empId, holdDate: holdDate, name: name, empCode: empCode, holdBy: holdBy, WhoHold: WhoHold, holdSaidBy: holdSaidBy, holdReason: holdReason });
            }
          }
        });
        this.salaryHoldingList = this.commonService.transformNumeric(salaryHoldingList, "name");
      });
  }

  changeYearSelection(filterVal: any) {
    this.salaryHoldingList = [];
    this.selectedYear = filterVal;
    this.selectedMonth = "0";
    $(this.ddlMonth).val("0");
    let element = <HTMLInputElement>document.getElementById("chkAll");
    element.checked = false;
  }

  changeMonthSelection(filterVal: any) {
    this.salaryHoldingList = [];
    this.selectedMonth = filterVal;
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    this.getSalaryHolding();
  }

  openModel(content: any, id: any, type: any, eventType: any) {
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if (this.selectedMonth == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 550;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.holdingId).val(id);
    $(this.eventType).val(type);
    if (type == "hold") {
      $('#exampleModalLongTitle').html("Hold Entry");
      if (eventType == "edit") {
        if (id != "0") {
          setTimeout(() => {
            let detail = this.salaryHoldingList.find(item => item.empId == id);
            if (detail != undefined) {
              let element = <HTMLInputElement>document.getElementById("ddlHoldEmployee");
              element.disabled = true;
              $(this.ddlHoldEmployee).val(id);
              $(this.txtHoldSaid).val(detail.holdSaidBy);
              $(this.txtHoldingReason).val(detail.holdReason);
            }
          }, 300);
        }
      }
      else {

      }
    }
    else {
      $('#exampleModalLongTitle').html("Un-hold Entry");
      setTimeout(() => {
        let detail = this.salaryHoldingList.find(item => item.empId == id);
        if (detail != undefined) {
          let element = <HTMLInputElement>document.getElementById("ddlHoldEmployee");
          element.disabled = true;
          $(this.ddlHoldEmployee).val(id);
        }
      }, 300);
    }
  }

  closeModel() {
    $(this.holdingId).val("0");
    $(this.eventType).val("");
    this.modalService.dismissAll();
  }

  saveHolding() {
    let id = $(this.holdingId).val();
    let eventType = $(this.eventType).val();
    let empId = $(this.ddlHoldEmployee).val();
    let holdSaidBy = $(this.txtHoldSaid).val();
    let holdReason = $(this.txtHoldingReason).val();

    if (empId == "0") {
      this.commonService.setAlertMessage("error", "Please select employee !!!");
      return;
    }
    if (holdSaidBy == "") {
      this.commonService.setAlertMessage("error", "Please enter Who said to hold !!!");
      return;
    }
    if (holdReason == "") {
      this.commonService.setAlertMessage("error", "Please enter Holding Reason !!!");
      return;
    }
    if (eventType == "hold") {
      const data = {
        holdSaidBy: holdSaidBy,
        holdReason: holdReason,
        holdBy: localStorage.getItem("userID"),
        holdDate: this.toDayDate
      }
      this.dbFireStore.doc(this.fireStoreCity + "/EmployeeHoldSalary/Hold/" + empId + "").set(data);
      let detail = this.salaryHoldingList.find(item => item.empId == empId);
      if (detail != undefined) {
        detail.holdSaidBy = holdSaidBy
        detail.holdReason = holdReason;
      }
      if (id == "0") {
        this.commonService.setAlertMessage("success", "Data saved successfully !!!");
        this.getSalaryHolding();
      }
      else {
        this.commonService.setAlertMessage("success", "Data updated successfully !!!")
      }
      this.closeModel();
    }
    else {
      if (id != "0") {
        this.dbFireStore.doc(this.fireStoreCity + "/EmployeeHoldSalary/UnHold/" + empId + "").get().subscribe((ss) => {
          console.log(ss.id);
          let key = 1;
          if (ss.data() != null) {
            if (ss.data()["lastKey"] != undefined) {
              key += Number(ss.data()["lastKey"]);
            }
          }
          console.log(key);
          let detail = this.salaryHoldingList.find(item => item.empId == empId);
          if (detail != undefined) {
            const data = {
              holdSaidBy: detail.holdSaidBy,
              holdReason: detail.holdReason,
              holdDate: detail.holdDate,
              holdBy: detail.holdBy,
              unHoldSaidBy: $(this.txtHoldSaid).val(),
              unHoldReason: $(this.txtHoldingReason).val(),
              unHoldDate: this.toDayDate,
              unHoldBy: localStorage.getItem("userID")
            }
            this.dbFireStore.doc(this.fireStoreCity + "/EmployeeHoldSalary/UnHold/" + empId + "").set({ lastKey: key });
            this.dbFireStore.doc(this.fireStoreCity + "/EmployeeHoldSalary/UnHold/" + empId + "").collection(key.toString()).doc("1").set(data);
            this.dbFireStore.doc(this.fireStoreCity + "/EmployeeHoldSalary/Hold/" + empId + "").delete();
            this.commonService.setAlertMessage("success", "Data saved successfully !!!");
            this.getSalaryHolding();
            this.closeModel();
          }
        });
      }
    }
  }
}
