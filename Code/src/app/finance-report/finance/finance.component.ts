import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {

  constructor(public db: AngularFireDatabase, private commonService: CommonService) { }
  userid: any;
  isShow: any;
  accessList: any[];
  portalAccessList: any[];
  userType: any;
  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.userid = localStorage.getItem('userID');
    this.portalAccessList = [];
    this.portalAccessList = JSON.parse(localStorage.getItem("portalAccess"));
    this.getUserAccess();
  }


  getUserAccess() {
    let userAccessList = this.portalAccessList;
    this.accessList = [];
    for (let i = 0; i < userAccessList.length; i++) {
      let dataClass = "dashboard-widgets";
      if (userAccessList[i]["name"] == "Salary Summary" || userAccessList[i]["name"] == "Ward Reach Cost" || userAccessList[i]["name"] == "Ward Monthly Cost") {
        this.accessList.push({ name: userAccessList[i]["name"], url: userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass })
      }
    }
  }

}
