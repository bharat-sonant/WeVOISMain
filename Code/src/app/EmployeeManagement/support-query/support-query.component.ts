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
  complaintList: any[];
  yearList: any[];
  selectedYear: any;
  ddlYear = "#ddlYear";
  fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";

  ngOnInit() {
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
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
            this.complaintList.push({ id: id, date: data[id]["date"], city: data[id]["city"], name: name, empId: data[id]["empId"], category: data[id]["category"], description: data[id]["description"] });
          }
        }
      }
      $(this.divLoader).hide();
    }, error => {
      $(this.divLoader).hide();
    });
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getComplaintList();
  }
}
