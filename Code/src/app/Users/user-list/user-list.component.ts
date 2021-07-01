import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/common/user.service';
import { CommonService } from '../../services/common/common.service';
//import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive form services
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { Users } from '../../Users/users';  // Users data type interface class
import * as $ from 'jquery';
import { AngularFireDatabase } from 'angularfire2/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  constructor(private router: Router, public usrService: UserService, public commonService: CommonService, public toastr: ToastrService, public db: AngularFireDatabase) { }

  userRecord: any[];
  User: Users[];
  cityName: any;

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    this.commonService.chkUserPermission("Users");
    this.dataState();
    this.getUserList();
  }

  getUserList() {
    let index: any;
    let MUser = this.db.object('Users/').valueChanges().subscribe(
      mdata => {

        this.userRecord = [];
        var keyArray = Object.keys(mdata);
        index = keyArray.length;
        for (let k = 0; k < keyArray.length; k++) {
          let lineNo = keyArray[k];

          let myUser = this.db.object('Users/' + lineNo).valueChanges().subscribe(
            data => {

              let imgUrl = "internal-user.png";
              let utitle = "Internal User";
              if (data["userType"] == "External User") {
                imgUrl = "external-user.png";
                utitle = "External User";

              }
              if (data["isDelete"] == "0") {
                this.userRecord.push({ uid: data["uid"], name: data["name"], email: data["email"], mobile: data["mobile"], userType: data["userType"], password: data["password"], $Key: lineNo, imgUrl: imgUrl, utitle: utitle });
              }
              // myUser.unsubscribe();
            });
        }
        // MUser.unsubscribe();
      });
  }

  dataState() {
    this.usrService.GetUsersList().valueChanges().subscribe(data => {
    })
  }

  deleteUsers(user) {
    if (window.confirm('Are sure you want to delete this user ?')) { // Asking from user before Deleting student data.
      this.usrService.DeleteUser(user.$Key) // Using Delete student API to delete student.
      this.toastr.error("Deleted Successfully !!!", '', {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-info alert-with-icon",
        positionClass: 'toast-bottom-right',

      }); // Alert message will show up when student successfully deleted.
    }
    //this.getUserList();
  }

  addNew() {
    this.router.navigate(['/' + this.cityName + '/useradd']);
  }



}
