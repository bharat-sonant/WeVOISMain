import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { AngularFireList } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss']
})
export class AccountDetailComponent implements OnInit {

  constructor(private storage: AngularFireStorage, private modalService: NgbModal, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  accountRef: AngularFireList<any>;
  db: any;
  cityName: any;
  employeeList: any[];
  accountList: any[];
  ddlUser = "#ddlUser";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.employeeList = [];
    this.accountList = [];
    this.getAccountDetail();
  }

  getAccountDetail() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        let list = JSON.parse(jsonData);
        this.accountList = this.commonService.transformNumeric(list, "name");
      }
    }, error => {
      this.commonService.setAlertMessage("error", "Sorry! no record found !!!");

    });

  }


  openModel(content: any, id: any) {

    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 250;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $("#key").val(id);
    let userDetail = this.accountList.find((item) => item.empId == id);
    if (userDetail != undefined) {
      setTimeout(() => {
        $("#preAccountNo").val(userDetail.accountNo);
        $("#preIFSC").val(userDetail.ifsc);
        $("#txtAccountNo").val(userDetail.accountNo);
        $("#txtIFSC").val(userDetail.ifsc);
      }, 100);
    }
  }

  saveAccountDetail() {
    let id = $("#key").val();
    if (id != "0") {
      let userDetail = this.accountList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        let accountNo = $("#txtAccountNo").val();
        let ifsc = $("#txtIFSC").val();
        let dbPath = "Employees/" + id + "/BankDetails/AccountDetails";
        let preAccountNo = $("#preAccountNo").val();
        let preIFSC = $("#preIFSC").val();
        this.db.object(dbPath).update({ accountNumber: accountNo, ifsc: ifsc });
        dbPath = "EmployeeDetailModificationHistory/" + id + "/";
        let time = this.commonService.getCurrentTimeWithSecond();
        time = this.commonService.setTodayDate() + " " + time;
        let portalUserList = JSON.parse(localStorage.getItem("webPortalUserList"));
        let portalUserDetail = portalUserList.find(item => item.userId == localStorage.getItem("userID"));
        if (portalUserDetail != undefined) {
          let name = portalUserDetail.name;
          this.accountRef = this.db.list(dbPath);
          this.accountRef.push({
            accountNumber: preAccountNo,
            ifsc: preIFSC,
            modifyBy: name,
            modifyDate: time
          })

          this.db.object(dbPath).update({ lastModifyBy: name, lastModifyDate: time });
          userDetail.accountNo = accountNo;
          userDetail.ifsc = ifsc;
          userDetail.modifyBy = name;
          userDetail.modifyDate = time;
          this.saveJsonFile(this.accountList);
        }
        $("#key").val("0");
        this.commonService.setAlertMessage("success", "Acount Detail updated successfully !!!");
        this.closeModel();
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }


  saveJsonFile(listArray: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + this.commonService.getFireStoreCity() + "/EmployeeAccount/accountDetail.json";

    //const ref = this.storage.ref(path);
    const ref = this.storage.storage.app.storage("https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/").ref(path);
    var byteString;
    // write the bytes of the string to a typed array

    byteString = unescape(uri.split(",")[1]);
    var mimeString = uri
      .split(",")[0]
      .split(":")[1]
      .split(";")[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    let blob = new Blob([ia], { type: mimeString });
    const task = ref.put(blob);
  }


}
