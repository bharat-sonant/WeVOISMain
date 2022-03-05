import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-salary-holding-management',
  templateUrl: './salary-holding-management.component.html',
  styleUrls: ['./salary-holding-management.component.scss']
})
export class SalaryHoldingManagementComponent implements OnInit {

  constructor(private storage: AngularFireStorage, private modalService: NgbModal, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  fireStoreCity: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[] = [];
  allEmployeeList: any[] = [];
  employeeList: any[] = [];
  salaryHoldingList: any[] = [];
  salaryUnholdingList: any[] = [];
  fireStoragePath: any;
  holdJsonObject: any;
  userId: any;
  ddlYear = '#ddlYear';
  ddlMonth = "#ddlMonth";
  holdingId = "#holdingId";
  eventType = "#eventType";
  ddlHoldEmployee = "#ddlHoldEmployee";
  txtHoldSaid = "#txtHoldSaid";
  txtHoldingReason = "#txtHoldingReason";
  divHoldList = "#divHoldList";
  divUnholdList = "#divUnholdList";
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.userId = localStorage.getItem("userID");
    this.toDayDate = this.commonService.setTodayDate();
    let date = this.commonService.getPreviousMonth(this.toDayDate, 1);
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
    const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let employeeInstance = this.httpService.get(path).subscribe(data => {
      employeeInstance.unsubscribe();
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
        this.getHoldSalary();
        this.getUnholdSalary();
      }
    });
  }

  getHoldSalary() {
    $(this.divLoader).show();
    this.salaryHoldingList = [];
    const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeHoldSalary%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FholdSalary.json?alt=media";
    let holdInstance = this.httpService.get(path).subscribe(data => {
      holdInstance.unsubscribe();
      let salaryHoldingList = [];
      if (data != null) {
        this.holdJsonObject = data;
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            let empDetail = this.allEmployeeList.find(item => item.empId == empId);
            if (empDetail != undefined) {
              let name = empDetail.name;
              let empCode = empDetail.empCode;
              let holdBy = data[empId]["holdBy"];
              let userData = this.commonService.getPortalUserDetailById(holdBy);
              if (userData != undefined) {
                let WhoHold = userData["name"];
                let holdSaidBy = data[empId]["holdSaidBy"];
                let holdReason = data[empId]["holdReason"];
                let holdDate = data[empId]["holdDate"];
                let userID = this.userId;
                salaryHoldingList.push({ userID: userID, empId: empId, holdDate: holdDate, name: name, empCode: empCode, holdBy: holdBy, WhoHold: WhoHold, holdSaidBy: holdSaidBy, holdReason: holdReason });
              }
            }
          }
        }
      }
      this.salaryHoldingList = this.commonService.transformNumeric(salaryHoldingList, "name");
      $(this.divLoader).hide();
    }, error => {
      $(this.divLoader).hide();
    });
  }


  getUnholdSalary() {
    this.salaryUnholdingList = [];
    const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeHoldSalary%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FunholdSalary.json?alt=media";
    let unHoldInstance = this.httpService.get(path).subscribe(data => {
      unHoldInstance.unsubscribe();
      const obj = JSON.parse(JSON.stringify(data));
      let keyArray = Object.keys(obj);
      if (keyArray.length > 0) {
        for (let i = 0; i < keyArray.length; i++) {
          let empId = keyArray[i];
          let empDetail = this.allEmployeeList.find(item => item.empId == empId);
          if (empDetail != undefined) {
            let name = empDetail.name;
            let empCode = empDetail.empCode;
            let unHoldData = obj[empId];
            let list = Object.keys(unHoldData);
            if (list.length > 0) {
              for (let j = 0; j < list.length; j++) {
                let key = list[j];
                let holdBy = unHoldData[key]["holdBy"];
                let userData = this.commonService.getPortalUserDetailById(holdBy);
                if (userData != undefined) {
                  let WhoHold = userData["name"];
                  let holdSaidBy = unHoldData[key]["holdSaidBy"];
                  let holdReason = unHoldData[key]["holdReason"];
                  let holdDate = unHoldData[key]["holdDate"];
                  let unHoldDate = unHoldData[key]["unHoldDate"];
                  let unHoldReason = unHoldData[key]["unHoldReason"];
                  let unHoldSaidBy = unHoldData[key]["unHoldSaidBy"];
                  let unholdBy = unHoldData[key]["unHoldBy"];
                  let userDataUnHold = this.commonService.getPortalUserDetailById(unholdBy);
                  if (userDataUnHold != undefined) {
                    let WhoUnhold = userDataUnHold["name"];
                    this.salaryUnholdingList.push({ empId: empId, holdDate: holdDate, name: name, empCode: empCode, holdBy: holdBy, WhoHold: WhoHold, holdSaidBy: holdSaidBy, holdReason: holdReason, unHoldDate: unHoldDate, unHoldReason: unHoldReason, unHoldSaidBy: unHoldSaidBy, WhoUnhold: WhoUnhold });
                    this.salaryUnholdingList = this.commonService.transformNumeric(this.salaryUnholdingList, "empCode");
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  changeYearSelection(filterVal: any) {
    this.salaryHoldingList = [];
    this.salaryUnholdingList = [];
    this.selectedYear = filterVal;
    this.selectedMonth = "0";
    $(this.ddlMonth).val("0");
    let holdElement = <HTMLInputElement>document.getElementById("rdoHold");
    holdElement.checked = true;
    let unholdElement = <HTMLInputElement>document.getElementById("rdoUnhold");
    unholdElement.checked = false;
    $(this.divHoldList).show();
    $(this.divUnholdList).hide();
  }

  changeMonthSelection(filterVal: any) {
    this.salaryHoldingList = [];
    this.salaryUnholdingList = [];
    this.selectedMonth = filterVal;
    $(this.ddlMonth).val(this.selectedMonth);
    $(this.ddlYear).val(this.selectedYear);
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let holdElement = <HTMLInputElement>document.getElementById("rdoHold");
    holdElement.checked = true;
    let unholdElement = <HTMLInputElement>document.getElementById("rdoUnhold");
    unholdElement.checked = false;
    $(this.divHoldList).show();
    $(this.divUnholdList).hide();
    this.getHoldSalary();
    this.getUnholdSalary();
  }

  openModel(content: any, id: any, type: any) {
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
      $('#lblwho').html("Who said to hold");
      $('#lblreason').html("Holding Reason");
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
      $('#exampleModalLongTitle').html("Un-hold Entry");
      $('#lblwho').html("Who said to un-hold");
      $('#lblreason').html("Un-holding Reason");
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

  checkHoldList() {
    if ($(this.eventType).val() == "hold") {
      let empId = $(this.ddlHoldEmployee).val();
      if (empId != "0") {
        let detail = this.salaryHoldingList.find(item => item.empId == empId);
        if (detail != undefined) {
          this.commonService.setAlertMessage("error", "Employee " + detail.name + " (" + detail.empCode + ") already exist in salary hold list !!!");
          $(this.ddlHoldEmployee).val("0");
        }
      }
    }
  }

  saveHoldUnhold() {
    let id = $(this.holdingId).val();
    let eventType = $(this.eventType).val();
    let empId = $(this.ddlHoldEmployee).val();
    let holdSaidBy = $(this.txtHoldSaid).val();
    let holdReason = $(this.txtHoldingReason).val();
    let holdDate = this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond();
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
      this.saveHoldData(id, empId, holdSaidBy, holdReason, holdDate);
    }
    else {
      this.saveUnholdData(id,empId,holdSaidBy,holdReason,holdDate);
    }
  }

  saveUnholdData(id:any,empId:any,unHoldSaidBy:any,unHoldReason:any,unHoldDate:any){
    if (id != "0") {
      let detail = this.salaryHoldingList.find(item => item.empId == empId);
      if (detail != undefined) {
        const data = {
          holdSaidBy: detail.holdSaidBy,
          holdReason: detail.holdReason,
          holdDate: detail.holdDate,
          holdBy: detail.holdBy,
          unHoldSaidBy: unHoldSaidBy,
          unHoldReason: unHoldReason,
          unHoldDate: unHoldDate,
          unHoldBy: this.userId
        }
        const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeHoldSalary%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2FunholdSalary.json?alt=media";
        let unHoldInstance = this.httpService.get(path).subscribe(unHoldData => {
          unHoldInstance.unsubscribe();
          if (unHoldData != null) {
            const obj = JSON.parse(JSON.stringify(unHoldData));
            if (obj[empId.toString()] == null) {
              const aa = {};
              aa[0] = data;
              obj[empId.toString()] = aa;
            }
            else {
              const aa = obj[empId.toString()];
              let keyArray = Object.keys(aa);
              aa[keyArray.length] = data;
              obj[empId.toString()] = aa;
            }
            this.updateUnholdData(empId, obj);
          }
        }, error => {
          const obj = {};
          const aa = {};
          aa[0] = data;
          obj[empId.toString()] = aa;
          this.updateUnholdData(empId, obj);
        });
      }
    }
  }

  saveHoldData(id: any, empId: any, holdSaidBy: any, holdReason: any, holdDate: any) {
    let message = "";
    if (id == "0") {
      message = "Data saved successfully !!!";
      this.saveHold(empId, holdSaidBy, holdReason, holdDate, message);
    }
    else {
      message = "Data updated successfully !!!";
      this.updateHoldData(empId, holdSaidBy, holdReason, message);
      let detail = this.salaryHoldingList.find(item => item.empId == empId);
      if (detail != undefined) {
        detail.holdSaidBy = holdSaidBy;
        detail.holdReason = holdReason;
      }
    }
    this.closeModel();
  }


  saveUnhold(obj: any) {
    let filePath = "" + this.fireStoreCity + "/EmployeeHoldSalary/" + this.selectedYear + "/" + this.selectedMonthName + "/";
    let fileName = "unholdSalary.json";
    this.saveJsonFile(obj, fileName, filePath);
    setTimeout(() => {
      this.getHoldSalary();
      this.getUnholdSalary();
      this.closeModel();
      this.commonService.setAlertMessage("success", "Un-hold salary added successfully !!!");
    }, 300);
  }

  updateUnholdData(empId: any, obj: any) {
    this.saveUnhold(obj);
    const obj2 = this.holdJsonObject;
    delete obj2[empId.toString()];
    this.updateHoldJson(obj2);
  }

  updateHoldData(empId: any, holdSaidBy: any, holdReason: any, message: any) {
    const obj = this.holdJsonObject;
    obj[empId.toString()]["holdSaidBy"] = holdSaidBy;
    obj[empId.toString()]["holdReason"] = holdReason;
    this.updateHoldJson(obj);
    this.commonService.setAlertMessage("success", message);
  }

  saveHold(empId: any, holdSaidBy: any, holdReason: any, holdDate: any, message: any) {
    const data = {
      holdSaidBy: holdSaidBy,
      holdReason: holdReason,
      holdBy: this.userId,
      holdDate: holdDate
    }
    if (this.holdJsonObject == null) {
      const obj = {};
      obj[empId.toString()] = data;
      this.holdJsonObject = obj;
      this.updateHoldJson(obj);
    }
    else {
      const obj = this.holdJsonObject;
      obj[empId.toString()] = data;
      this.updateHoldJson(obj);
    }
    this.commonService.setAlertMessage("success", message);
  }

  updateHoldJson(obj: any) {
    let filePath = "" + this.fireStoreCity + "/EmployeeHoldSalary/" + this.selectedYear + "/" + this.selectedMonthName + "/";
    let fileName = "holdSalary.json";
    this.saveJsonFile(obj, fileName, filePath);
    setTimeout(() => {
      this.getHoldSalary();
    }, 300);
  }

  saveJsonFile(listArray: any, fileName: any, filePath: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + filePath + fileName;

    //const ref = this.storage.ref(path);
    const ref = this.storage.storage.app.storage(this.fireStoragePath).ref(path);
    var byteString;
    // write the bytes of the string to a typed array

    byteString = unescape(uri.split(",")[1]);
    var mimeString = uri
      .split(",")[0]
      .split(":")[1]
      .split(";")[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    let blob = new Blob([ia], { type: mimeString });
    const task = ref.put(blob);
  }

  getHoldUnHold(type: any) {
    if (type == 'hold') {
      let holdElement = <HTMLInputElement>document.getElementById("rdoHold");
      holdElement.checked = true;
      let unholdElement = <HTMLInputElement>document.getElementById("rdoUnhold");
      unholdElement.checked = false;
      $(this.divHoldList).show();
      $(this.divUnholdList).hide();
    }
    else {
      let holdElement = <HTMLInputElement>document.getElementById("rdoHold");
      holdElement.checked = false;
      let unholdElement = <HTMLInputElement>document.getElementById("rdoUnhold");
      unholdElement.checked = true;
      $(this.divHoldList).hide();
      $(this.divUnholdList).show();
    }
  }
}
