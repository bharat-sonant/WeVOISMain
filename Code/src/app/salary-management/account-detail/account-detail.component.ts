import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { AngularFireList } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFirestore } from "@angular/fire/firestore";

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss']
})
export class AccountDetailComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, private storage: AngularFireStorage, private modalService: NgbModal, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  accountRef: AngularFireList<any>;
  db: any;
  cityName: any;
  designationList: any[];
  allAccountList: any[];
  accountList: any[];
  ddlUser = "#ddlUser";
  ddlDesignation = "#ddlDesignation";
  fireStoreCity: any;
  toDayDate: any;
  remarkDetail: remarkDetail = {
    by: "",
    remark: "",
    date: ""
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.fireStoreCity = this.commonService.getFireStoreCity();
    if (this.fireStoreCity == "Test") {
      this.fireStoreCity = "Testing";
    }
    this.designationList = [];
    this.allAccountList = [];
    this.accountList = [];
    $(this.ddlUser).val("active");
    $(this.ddlDesignation).val("all");
    this.getAccountDetail();
  }

  getAccountDetail() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        let list = JSON.parse(jsonData);
        this.allAccountList = this.commonService.transformNumeric(list, "name");
        for (let i = 0; i < this.allAccountList.length; i++) {
          let designationDetail = this.designationList.find(item => item.designation == this.allAccountList[i]["designation"]);
          if (designationDetail == undefined) {
            this.designationList.push({ designation: this.allAccountList[i]["designation"] });
            this.designationList = this.commonService.transformNumeric(this.designationList, "designation");
          }
        }
        this.getAccountIssue();
      }
    }, error => {
      this.commonService.setAlertMessage("error", "Sorry! no record found !!!");
    });
  }

  getAccountIssue() {
    this.dbFireStore.collection(this.fireStoreCity + "/EmployeeAccountIssue/Issue").get().subscribe((ss) => {
      ss.forEach((doc) => {
        let empId = doc.id;
        let userDetail = this.allAccountList.find(item => item.empId == empId);
        if (userDetail != undefined) {
          userDetail.remarkDate = doc.data()["remarkDate"];
          userDetail.remarkBy = doc.data()["remarkBy"];
          userDetail.remark = doc.data()["remark"];
        }
      });
      this.showAccountDetail("active", "all");
    });
  }

  filterData() {
    let filterVal = $('#ddlUser').val();
    let designationFilterVal = $('#ddlDesignation').val();
    this.showAccountDetail(filterVal, designationFilterVal);
  }

  showAccountDetail(status: any, designation: any) {
    if (status == "all") {
      this.accountList = this.allAccountList;
    }
    else if (status == "active") {
      this.accountList = this.allAccountList.filter(item => item.status == "1");
    }
    else {
      this.accountList = this.allAccountList.filter(item => item.status != "1");
    }
    if (designation != "all") {
      this.accountList = this.accountList.filter(item => item.designation == designation);
    }
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 250;
    let width = 400;
    if (type == "remark") {
      height = 275;
    }

    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $("#key").val(id);
    if (type == "account") {
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
    else if (type == "remark") {
      let userDetail = this.accountList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.remark == null) {
          $("#divSolved").hide();
        }
        else {
          $("#divSolved").show();
          $("#txtRemarks").val(userDetail.remark);
        }
      }
    }
    else {
      let userDetail = this.accountList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        this.remarkDetail.remark = userDetail.remark;
        this.remarkDetail.date = userDetail.remarkDate;
        let userData = this.commonService.getPortalUserDetailById(userDetail.remarkBy);
        if (userData != undefined) {
          let name = userData["name"];
          this.remarkDetail.by = name
        }
      }
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
          let allUserDetail = this.allAccountList.find(item => item.empId == id);
          if (allUserDetail != undefined) {
            allUserDetail.accountNo = accountNo;
            allUserDetail.ifsc = ifsc;
            allUserDetail.modifyBy = name;
            allUserDetail.modifyDate = time;
          }
          this.saveJsonFile(this.allAccountList);
        }
        $("#key").val("0");
        this.commonService.setAlertMessage("success", "Acount Detail updated successfully !!!");
        this.closeModel();
      }
    }
  }

  saveRemarks() {
    let id = $("#key").val();
    let remark = $("#txtRemarks").val();
    let userDetail = this.accountList.find((item) => item.empId == id);
    if (userDetail != undefined) {
      if (userDetail.remark == null) {
        if (remark == "") {
          this.commonService.setAlertMessage("error", "Please enter remark !!!");
          return;
        }
        else {
          const data = {
            remarkBy: localStorage.getItem("userID"),
            remark: remark,
            remarkDate: this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond()
          }
          this.dbFireStore.collection(this.fireStoreCity + "/EmployeeAccountIssue/Issue").doc(id.toString()).set(data);
          $("#key").val("0");
          $("#txtRemarks").val("");
          userDetail.remark = remark;
          userDetail.remarkBy = localStorage.getItem("userID");
          userDetail.remarkDate = this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond();
          this.commonService.setAlertMessage("success", "Remark added successfully !!!");
        }
      }
      else {
        let element = <HTMLInputElement>document.getElementById("chkSolved");
        if (element.checked == false) {
          this.dbFireStore.collection(this.fireStoreCity + "/EmployeeAccountIssue/Issue").doc(id.toString()).update({ remark: remark });
          $("#key").val("0");
          $("#txtRemarks").val("");
          userDetail.remark = remark;
          this.commonService.setAlertMessage("success", "Remark updated successfully !!!");
        }
        else {
          this.dbFireStore.doc(this.fireStoreCity + "/EmployeeAccountIssue/History/" + id + "").get().subscribe((ss) => {
            let key = 1;
            if (ss.data() != null) {
              if (ss.data()["lastKey"] != undefined) {
                key += Number(ss.data()["lastKey"]);
              }
            }
            const data = {
              remark: userDetail.remark,
              remarkBy: userDetail.remarkBy,
              remarkDate: userDetail.remarkDate,
              solvedDate: this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond(),
              solvedBy: localStorage.getItem("userID")
            }
            this.dbFireStore.doc(this.fireStoreCity + "/EmployeeAccountIssue/History/" + id + "").set({ lastKey: key });
            this.dbFireStore.doc(this.fireStoreCity + "/EmployeeAccountIssue/History/" + id + "").collection(key.toString()).doc("1").set(data);
            this.dbFireStore.doc(this.fireStoreCity + "/EmployeeAccountIssue/Issue/" + id + "").delete();
            this.commonService.setAlertMessage("success", "Data saved successfully !!!");
            userDetail.remark = null;
            userDetail.remarkBy = null;
            userDetail.remarkDate = null;
          });

        }
      }
    }
    this.closeModel();
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

  updateJson() {
    if (this.allAccountList.length > 0) {
      $("#divLoader").show();
      let dbPath = "Employees/lastEmpId";
      let employeeInstance = this.db.object(dbPath).valueChanges().subscribe(
        lastData => {
          employeeInstance.unsubscribe();
          if (lastData != null) {
            let to = Number(lastData);
            for (let i = 1; i <= to; i++) {
              let empId = i;
              let dbPath = "Employees/" + empId + "/GeneralDetails";
              let generalInstance = this.db.object(dbPath).valueChanges().subscribe(
                gData => {
                  generalInstance.unsubscribe();
                  if (gData != null) {
                    let detail = this.allAccountList.find(item => item.empId == empId);
                    if (detail != undefined) {
                      detail.status = gData["status"];
                      detail.name = gData["name"];
                      detail.email = gData["email"];
                      this.getBankDetails(empId);
                    }
                    else {
                      let status = gData["status"];
                      let name = gData["name"];
                      let doj = gData["dateOfJoining"];
                      let empCode = gData["empCode"];
                      let designationId = gData["designationId"];
                      let email = gData["email"];
                      let accountNo = "";
                      let ifsc = "";
                      let aadharNo = "";
                      let panNo = "";
                      let modifyBy = "";
                      let modifyDate = "";
                      let dbPath = "Defaults/Designations/" + designationId + "/name";
                      let designationInstance = this.db.object(dbPath).valueChanges().subscribe(
                        data => {
                          designationInstance.unsubscribe();
                          let designation = "";
                          if (data != null) {
                            if (data == "Transportation Executive") {
                              designation = "Driver";
                            }
                            else if (data == "Service Excecutive ") {
                              designation = "Helper";
                            }
                            else {
                              designation = data;
                            }
                          }
                          this.allAccountList.push({ empId: empId, empCode: empCode, name: name, email: email, designation: designation, status: status, doj: doj, accountNo: accountNo, ifsc: ifsc, aadharNo: aadharNo, panNo: panNo, modifyBy: modifyBy, modifyDate: modifyDate });
                          this.getIdentificationDetails(empId);
                          this.getBankDetails(empId);
                        });
                    }
                  }
                }
              );
            }
            setTimeout(() => {
              this.saveJsonFile(this.allAccountList);
              setTimeout(() => {
                this.commonService.setAlertMessage("success", "Data updated successfully !!!");
                $("#divLoader").hide();
              }, 6000);
            }, 30000);
          }
        }
      );
    }
  }

  getIdentificationDetails(empId: any) {
    let dbPath = "Employees/" + empId + "/IdentificationDetails";
    let instance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        instance.unsubscribe();
        if (data != null) {
          let aadharNo = "";
          let panNo = "";
          if (data["AadharCardDetails"] != null) {
            if (data["AadharCardDetails"]["aadharNumber"] != null) {
              aadharNo = ["AadharCardDetails"]["aadharNumber"];
            }
            if (data["PanCardDetails"]["panNumber"] != null) {
              panNo = ["PanCardDetails"]["panNumber"];
            }
            let detail = this.allAccountList.find(item => item.empId == empId);
            if (detail != undefined) {
              detail.aadharNo = aadharNo;
              detail.panNo = panNo;
            }
          }
        }
      }
    );
  }

  getBankDetails(empId: any) {
    let dbPath = "Employees/" + empId + "/BankDetails/AccountDetails";
    let instance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        instance.unsubscribe();
        if (data != null) {
          let accountNo = "";
          let ifsc = "";
          if (data["accountNumber"] != null) {
            accountNo = data["accountNumber"];
          }
          if (data["ifsc"] != null) {
            ifsc = data["ifsc"];
          }
          let detail = this.allAccountList.find(item => item.empId == empId);
          if (detail != undefined) {
            detail.accountNo = accountNo;
            detail.ifsc = ifsc;
          }
        }
      }
    );
  }
}


export class remarkDetail {
  date: string;
  by: string;
  remark: string;
}
