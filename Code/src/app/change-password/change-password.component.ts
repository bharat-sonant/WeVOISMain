import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from "@angular/fire/firestore";
import { CommonService } from "../services/common/common.service";

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, public commonService: CommonService) { }

  oldPassword: any;
  userId: any;
  userKey: any;
  ngOnInit() {
    this.userId = localStorage.getItem("userID");
    this.oldPassword = localStorage.getItem("userPassword");
    this.userKey = localStorage.getItem("userKey");
  }

  changePassword() {
    if ($('#txtOldPassword').val() == "") {
      this.commonService.setAlertMessage("error", "Please enter old password !!!");
      return;
    }
    if ($('#txtNewPassword').val() == "") {
      this.commonService.setAlertMessage("error", "Please enter new password !!!");
      return;
    }
    if ($('#txtConfirmPassword').val() == "") {
      this.commonService.setAlertMessage("error", "Please enter re-type password !!!");
      return;
    }
    let oldPassword = $('#txtOldPassword').val();
    if (oldPassword != this.oldPassword) {
      this.commonService.setAlertMessage("error", "Old password not correct !!!");
      return;
    }
    if ($('#txtNewPassword').val() != $('#txtConfirmPassword').val()) {
      this.commonService.setAlertMessage("error", "Re-type password not matched to new password !!!");
      return;
    }
    let password = $('#txtNewPassword').val().toString().trim();
    this.dbFireStore.doc("UserManagement/Users").collection("Users").doc(this.userKey).update({ password: password });
    this.commonService.setAlertMessage("success", "Password changed successfully!!!");
    $('#txtOldPassword').val("");
    $('#txtNewPassword').val("");
    $('#txtConfirmPassword').val("");
  }

}
