import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
//import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive form services
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { Users } from '../../Users/users';  // Users data type interface class
import * as $ from 'jquery';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users/users.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})

export class UserListComponent implements OnInit {

  constructor(private router: Router, private userService: UsersService, public commonService: CommonService, public toastr: ToastrService) { }

  userRecord: any[];
  User: Users[];
  cityName: any;
  userJsonData: any;
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Users","Users",localStorage.getItem("userID"));
    this.getUserList();
  }

  getUserList() {
    this.userRecord = [];
    $(this.divLoader).show();
    this.userService.getPortalUsers().then((data: any) => {
      if (data != null) {
        this.userJsonData = data;
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let userId = keyArray[i];
            let imgUrl = "internal-user.png";
            let utitle = "Internal User";
            if (data[userId]["userType"] == "External User") {
              imgUrl = "external-user.png";
              utitle = "External User";
            }
            if (data[userId]["isDelete"] == "0") {
              this.userRecord.push({ uid: data[userId]["uid"], userId: data[userId]["userId"], name: data[userId]["name"], email: data[userId]["email"], mobile: data[userId]["mobile"], userType: data[userId]["userType"], password: data[userId]["password"], $Key: data[userId], imgUrl: imgUrl, utitle: utitle, cityName: this.cityName });
            }
          }
          this.userRecord = this.commonService.transformNumeric(this.userRecord, "name");
        }
      }
      $(this.divLoader).hide();
    });
  }

  deleteUsers(userId: any) {
    if (window.confirm('Are sure you want to delete this user ?')) { // Asking from user before Deleting student data.
      this.userJsonData[userId.toString()]["isDelete"] = 1;
      this.userService.savePortalUsers(this.userJsonData);
      this.toastr.error("Deleted Successfully !!!", '', {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-info alert-with-icon",
        positionClass: 'toast-bottom-right',

      }); // Alert message will show up when student successfully deleted.

      setTimeout(() => {
        this.getUserList();
      }, 200);
    }
  }

  addNew() {
    this.router.navigate(['/' + this.cityName + '/useradd']);
  }
}
