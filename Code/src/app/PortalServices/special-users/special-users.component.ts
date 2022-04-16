import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-special-users',
  templateUrl: './special-users.component.html',
  styleUrls: ['./special-users.component.scss']
})
export class SpecialUsersComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
  db: any;
  cityName: any;
  userList: any[] = [];
  userJsonObject: any = null;
  divLoader = "#divLoader";
  ddlType = "#ddlType";
  txtUserName = "#txtUserName";
  txtPassword = "#txtPassword";
  userId = "#key";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.getUserList();
  }

  getUserList() {
    $(this.divLoader).show();
    this.userList = [];
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FSettings%2FSpecialUsers.json?alt=media";
    let userInstance = this.httpService.get(path).subscribe(userData => {
      userInstance.unsubscribe();
      if (userData != null) {
        this.userJsonObject = userData;
        let keyArray = Object.keys(userData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let id = keyArray[i];
            if (id != "lastKey") {
              this.userList.push({ id: id, password: userData[id]["password"], type: userData[id]["type"], username: userData[id]["username"] });
            }
          }
        }
      }
      $(this.divLoader).hide();
    }, error => {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("error", "Sorry! no record found !!!");
    });
  }

  openModel(content: any, id: any) {
    this.clearPopUp();
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 335;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (id != "0") {
      $(this.userId).val(id);
      let userDetail = this.userList.find((item) => item.id == id);
      if (userDetail != undefined) {
        $(this.txtUserName).val(userDetail.username);
        $(this.txtPassword).val(userDetail.password);
        $(this.ddlType).val(userDetail.type);
      }
    }
  }

  clearPopUp(){
    $(this.txtUserName).val("");
    $(this.txtPassword).val("");
    $(this.ddlType).val("0");
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  saveUsers() {
    let lastKey = 1
    if (this.userJsonObject == null) {
      this.userJsonObject = {};
    }
    else {
      if ($(this.userId).val() == "0") {
        lastKey = Number(this.userJsonObject["lastKey"]) + 1;
      }
      else {
        lastKey = Number($(this.userId).val());
      }
    }
    const data = {
      password: $(this.txtPassword).val(),
      type: $(this.ddlType).val(),
      username: $(this.txtUserName).val()
    }
    this.userJsonObject[lastKey] = data;
    this.userJsonObject["lastKey"] = lastKey;
    let filePath = "/Settings/";
    let fileName = "SpecialUsers.json";
    this.commonService.saveJsonFile(this.userJsonObject, fileName, filePath);
    this.updateUserList(lastKey);
  }

  updateUserList(lastKey: any) {
    if (this.userList.length == 0) {
      this.userList.push({ id: lastKey, password: $(this.txtPassword).val(), type: $(this.ddlType).val(), username: $(this.txtUserName).val() });
    }
    else {
      let userDetail = this.userList.find((item) => item.id == lastKey);
      if (userDetail == undefined) {
        this.userList.push({ id: lastKey, password: $(this.txtPassword).val(), type: $(this.ddlType).val(), username: $(this.txtUserName).val() });
      }
      else {
        userDetail.password = $(this.txtPassword).val();
        userDetail.username = $(this.txtUserName).val();
        userDetail.type = $(this.ddlType).val();
      }
    }    
    this.commonService.setAlertMessage("success", "Data saved successfully !!!");
    this.closeModel();
  }
}
