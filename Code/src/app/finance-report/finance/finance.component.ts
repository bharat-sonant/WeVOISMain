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


    return;

    if (this.userid == "0") {
      userAccessList = this.commonService.transform(userAccessList, 'position');
    }
    if (this.portalAccessList != null) {
      this.accessList = [];
      let userAccessPermission = [];
      for (let i = 0; i < userAccessList.length; i++) {
        let kk = i + 1;
        if (this.userid != "0") {

          let userList = this.db.list('UserAccess/').valueChanges().subscribe(
            userlistdata => {

              if (userlistdata != null) {
                let url = "javaScript:void(0);";
                let dataClass = "dashboard-widgets";
                this.isShow = false;

                for (let j = 0; j < userlistdata.length; j++) {
                  if (userAccessList[i]["pageID"] == userlistdata[j]["pageID"] && userlistdata[j]["userId"] == this.userid) {

                    url = userAccessList[i]["url"];
                    this.accessList.push({ name: userAccessList[i]["name"], url: url, isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass })
                    userAccessPermission.push({ name: userAccessList[i]["name"], url: url });
                  }
                }
                // if (url == "javaScript:void(0);") {
                // dataClass = "dashboard-widgets-disabled";
                //  if (this.userType == "External User") {
                //    this.isShow = true;
                // }
                // }

                localStorage.setItem("userAccess", JSON.stringify(userAccessPermission));
              }
              // else {
              //   this.accessList.push({ name: userAccessList[i]["name"], url: "javaScript:void(0);", isShow: false, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: "dashboard-widgets" })
              //  }
              userList.unsubscribe();
            });
        }
        // else {
        //   this.accessList.push({ name: userAccessList[i]["name"], url: userAccessList[i]["url"], isShow: false, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: "dashboard-widgets" })
        // }

      }

    }
  }

}
