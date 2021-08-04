import { createOfflineCompileUrlResolver, getUrlScheme, ThrowStmt } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { data } from 'jquery';
import { parse } from 'querystring';
import { CommonService } from '../../services/common/common.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-halt-report',
  templateUrl: './ward-halt-report.component.html',
  styleUrls: ['./ward-halt-report.component.scss']
})
export class WardHaltReportComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal) { }
  
  yearList: any[] = [];
  toDayDate:any;
  selectedMonth:any;
  selectedYear:any;
  selectedCircle: any;
  wardTimeList: any[] = [];
  wardList: any[] = [];
  db:any




  ngOnInit() {
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  getWards() {
    let dbPath = "Defaults/AllWard";
    let circleWiseWard = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        if (data != null) {
          var keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            let circleDataList = data[index];
            if (circleDataList.length > 0) {
              for (let j = 1; j < circleDataList.length; j++) {
                this.wardList.push({ circle: index, wardNo: circleDataList[j]["wardNo"], startDate: circleDataList[j]["startDate"], endDate: circleDataList[j]["endDate"], displayIndex: circleDataList[j]["displayIndex"] });
              }
            }
          }
        }
        this.selectedCircle = 'Circle1';
        // this.onSubmit();
        circleWiseWard.unsubscribe();
      });
  }

}
