import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-support-query',
  templateUrl: './support-query.component.html',
  styleUrls: ['./support-query.component.scss']
})
export class SupportQueryComponent implements OnInit {

  constructor(private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
  toDayDate: any;
  complaintsJSON: any;
  divLoader = "#divLoader";
  allComplaintList: any[];
  complaintList: any[];
  cityList: any[] = [];
  yearList: any[];
  selectedYear: any;
  managerList: any[] = [];
  managerFilterList: any[] = [];
  ddlYear = "#ddlYear";
  ddlCity = "#ddlCity";
  ddlCategory = "#ddlCategory";
  ddlStatus = "#ddlStatus";
  ddlFilterManager = "#ddlFilterManager";
  assignKey = "#assignKey";
  ddlManager = "#ddlManager";
  resolvedId = "#resolvedId";
  txtResolvedDate = "#txtResolvedDate";
  txtResolvedDescription = "#txtResolvedDescription";
  detailBy = "#detailBy";
  detailDate = "#detailDate";
  detailDescription = "#detailDescription";
  public userType: any;
  fireStoragePath = this.commonService.fireStoragePath;
  spShowAll = "#spShowAll";
  isShowAll: any;
  chkShowAll = "chkShowAll";
  roleId: any;
  showAllData:any;

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.setDefault();
  }

  setDefault() {
    this.isShowAll = false;
    this.showAllData=false;
    this.toDayDate = this.commonService.setTodayDate();
    this.roleId = localStorage.getItem("roleId");
    if (this.roleId == "10" || this.roleId == "17") {
      $(this.spShowAll).show();
      this.isShowAll = true;
    }
    else {
      $(this.spShowAll).hide();
    }
    if (localStorage.getItem("isAdmin") == "1") {
      this.userType = "admin";
    }
    else if (localStorage.getItem("isManager") == "1") {
      this.userType = "manager";
    }

    this.getCityList();
    this.getManagers();
    this.getYear();
  }

  getCityList() {
    const path = this.fireStoragePath + "CityDetails%2FCityDetails.json?alt=media";
    let cityInstance = this.httpService.get(path).subscribe(data => {
      cityInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));
      for (let i = 0; i < list.length; i++) {
        if (list[i]["cityName"] != "Test") {
          this.cityList.push({ city: list[i]["cityName"] });
        }
      }
      this.cityList = this.commonService.transformNumeric(this.cityList, "city");
    });
  }

  getManagers() {
    this.managerList.push({ empId: "0", name: "--Select--" });
    let employeeList = JSON.parse(localStorage.getItem("webPortalUserList"));
    let list = employeeList.filter(item => item.isManager == 1);
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        this.managerList.push({ empId: list[i]["userId"], name: list[i]["name"] });
      }
      this.managerFilterList = this.managerList;
      this.managerFilterList[0]["name"] = "---All---";
    }
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.toDayDate.split('-')[0];
    $(this.ddlYear).val(this.selectedYear);
    this.getComplaintList();
  }

  getComplaintList() {
    $(this.divLoader).show();
    $(this.ddlCity).val("0");
    $(this.ddlCategory).val("0");
    this.allComplaintList = [];
    this.complaintList = [];
    const path = this.fireStoragePath + "Common%2FComplaints%2F" + this.selectedYear + ".json?alt=media";
    let complaintInstance = this.httpService.get(path).subscribe(data => {
      complaintInstance.unsubscribe();
      if (data != null) {
        this.complaintsJSON = data;
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length - 1; i++) {
            let id = keyArray[i];
            let name = data[id]["name"];
            if (data[id]["empId"] != "") {
              name = name + " (" + data[id]["empId"] + ")";
            }
            let assignedTo = "0";
            let assignedToName = "--";
            if (data[id]["assignedTo"] != null) {
              assignedTo = data[id]["assignedTo"];
              let assignDetail = this.managerList.find(item => item.empId == assignedTo);
              if (assignDetail != undefined) {
                assignedToName = assignDetail.name;
              }
            }
            let resolvedDate = "";
            if (data[id]["resolvedDate"] != null) {
              resolvedDate = data[id]["resolvedDate"];
            }
            let resolvedDescription = "";
            if (data[id]["resolvedDescription"] != null) {
              resolvedDescription = data[id]["resolvedDescription"];
            }
            let timeStamps = new Date(data[id]["date"]).getTime();
            let date=data[id]["date"].split('-')[2]+" "+this.commonService.getCurrentMonthShortName(Number(data[id]["date"].split('-')[1]))+" "+data[id]["date"].split('-')[0];
            this.allComplaintList.push({ id: id, date: date, city: data[id]["city"], name: name, empId: data[id]["empId"], category: data[id]["category"], description: data[id]["description"], timeStamps: timeStamps, status: data[id]["status"], assignedTo: assignedTo, assignedToName: assignedToName, resolvedDate: resolvedDate, resolvedDescription: resolvedDescription });
            this.allComplaintList = this.allComplaintList.sort((a, b) =>
              b.timeStamps > a.timeStamps ? 1 : -1
            );
          }
        }
        this.filterData();
      }
      $(this.divLoader).hide();
    }, error => {
      $(this.divLoader).hide();
    });
  }

  showAll() {
    if((<HTMLInputElement>document.getElementById(this.chkShowAll)).checked==true){
      this.showAllData=true;
      this.filterData();
    }
    else{
      this.showAllData=false;
      this.filterData();
    }
  }

  filterData() {
    this.complaintList = this.allComplaintList;
    if (this.showAllData == false) {
      this.complaintList = this.complaintList.filter(item => item.assignedTo == localStorage.getItem("userID"));
    }
    if ($(this.ddlCity).val() != "0") {
      this.complaintList = this.allComplaintList.filter(item => item.city == $(this.ddlCity).val());
    }
    if ($(this.ddlCategory).val() != "0") {
      this.complaintList = this.complaintList.filter(item => item.category == $(this.ddlCategory).val());
    }
    if ($(this.ddlStatus).val() != "0") {
      let status = $(this.ddlStatus).val();
      if (this.userType == "manager" && status == "pending") {
        status = "assigned";
      }
      this.complaintList = this.complaintList.filter(item => item.status == status);
    }
    if ($(this.ddlFilterManager).val() != "0") {
      this.complaintList = this.complaintList.filter(item => item.assignedTo == $(this.ddlFilterManager).val());
    }
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getComplaintList();
  }

  openModel(content: any, id: any, type: any) {
    this.clearPopUp();
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 250;
    let width = 400;
    if(type=="resolved"){
      let detail = this.complaintList.find((item) => item.id == id);
      if (detail != undefined) {
        if(detail.assignedTo!=localStorage.getItem("userID")){
          this.closeModel();
          this.commonService.setAlertMessage("error","Only assigned user can resolve this complaint !!!");
          return;
        }
      }

    }
    if (type != "assign") {
      height = 430;
    }
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    setTimeout(() => {
      let detail = this.complaintList.find((item) => item.id == id);
      if (detail != undefined) {
        if (type == "assign") {
          $(this.assignKey).val(id);
          if (detail.assignedTo != undefined) {
            $(this.ddlManager).val(detail.assignedTo);
          }
        }
        else if (type == "adminResolved") {

          let empDetail = this.managerList.find(item => item.empId == detail.assignedTo);
          if (empDetail != undefined) {
            $(this.detailBy).html(empDetail.name);
          }
          $(this.detailDate).html(detail.resolvedDate);
          $(this.detailDescription).html(detail.resolvedDescription);
        }
        else {
          $(this.resolvedId).val(id);
          $(this.txtResolvedDate).val(detail.resolvedDate);
          $(this.txtResolvedDescription).val(detail.resolvedDescription);
        }
      }
    }, 200);
  }

  clearPopUp() {
    $(this.ddlManager).val("0");
    $(this.assignKey).val("0");
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  saveAssignment() {
    let id = $(this.assignKey).val();
    let assignedTo = $(this.ddlManager).val();
    if (assignedTo == "0") {
      this.commonService.setAlertMessage("error", "Please select manager !!!");
      return;
    }
    let detail = this.allComplaintList.find(item => item.id == id);
    if (detail != undefined) {
      detail.assignedTo = assignedTo;
      detail.status = "assigned";
    }
    detail = this.complaintList.find(item => item.id == id);
    if (detail != undefined) {
      detail.assignedTo = assignedTo;
      detail.status = "assigned";
    }
    this.complaintsJSON[id.toString()]["assignedTo"] = assignedTo;
    this.complaintsJSON[id.toString()]["status"] = "assigned";
    let path = "/Common/Complaints/";
    let fileName = this.selectedYear + ".json";
    this.commonService.saveCommonJsonFile(this.complaintsJSON, fileName, path);
    this.commonService.setAlertMessage("success", "Query assigned successfully !!!");
    this.closeModel();
  }

  saveResolved() {
    let id = $(this.resolvedId).val();
    let resolvedDate = $(this.txtResolvedDate).val();
    let resolvedDescription = $(this.txtResolvedDescription).val();
    if (resolvedDate == "") {
      this.commonService.setAlertMessage("error", "Please select date !!!");
      return;
    }
    if (resolvedDescription == "") {
      this.commonService.setAlertMessage("error", "Please enter description !!!");
      return;
    }
    let detail = this.allComplaintList.find(item => item.id == id);
    if (detail != undefined) {
      detail.resolvedDate = resolvedDate;
      detail.resolvedDescription = resolvedDescription;
      detail.status = "resolved";
    }
    detail = this.complaintList.find(item => item.id == id);
    if (detail != undefined) {
      detail.resolvedDate = resolvedDate;
      detail.resolvedDescription = resolvedDescription;
      detail.status = "resolved";
    }
    this.complaintsJSON[id.toString()]["resolvedDate"] = resolvedDate;
    this.complaintsJSON[id.toString()]["resolvedDescription"] = resolvedDescription;
    this.complaintsJSON[id.toString()]["status"] = "resolved";
    let path = "/Common/Complaints/";
    let fileName = this.selectedYear + ".json";
    this.commonService.saveCommonJsonFile(this.complaintsJSON, fileName, path);
    this.commonService.setAlertMessage("success", "Data saved successfully !!!");
    this.closeModel();
  }

}
