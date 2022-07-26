import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-support-query',
  templateUrl: './support-query.component.html',
  styleUrls: ['./support-query.component.scss']
})
export class SupportQueryComponent implements OnInit {

  constructor(private commonService: CommonService, public httpService: HttpClient) { }
  toDayDate: any;
  divLoader = "#divLoader";
  allComplaintList: any[];
  complaintList: any[];
  yearList: any[];
  selectedYear: any;
  managerList:any;
  ddlYear = "#ddlYear";
  ddlCity = "#ddlCity";
  ddlCategory = "#ddlCategory";
  ddlStatus="#ddlStatus";
  fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";

  ngOnInit() {
    this.toDayDate = this.commonService.setTodayDate();
    this.getManagers();
    this.getYear();
  }

  getManagers(){
    let employeeList=JSON.parse(localStorage.getItem("webPortalUserList"));
    this.managerList=employeeList.filter(item=>item.isManager==1);
    console.log(this.managerList);
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
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length - 1; i++) {
            let id = keyArray[i];
            let name = data[id]["name"];
            if (data[id]["empId"] != "") {
              name = name + " (" + data[id]["empId"] + ")";
            }
            let timeStamps = new Date(data[id]["date"]).getTime();
            this.allComplaintList.push({ id: id, date: data[id]["date"], city: data[id]["city"], name: name, empId: data[id]["empId"], category: data[id]["category"], description: data[id]["description"], timeStamps: timeStamps,status:data[id]["status"] });
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

  filterData() {
    this.complaintList = this.allComplaintList;
    if ($(this.ddlCity).val() != "0") {
      this.complaintList = this.allComplaintList.filter(item => item.city == $(this.ddlCity).val());
    }
    if ($(this.ddlCategory).val() != "0") {
      this.complaintList = this.complaintList.filter(item => item.category == $(this.ddlCategory).val());
    }
    if ($(this.ddlStatus).val() != "0") {
      this.complaintList = this.complaintList.filter(item => item.status == $(this.ddlStatus).val());
    }
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getComplaintList();
  }
}
