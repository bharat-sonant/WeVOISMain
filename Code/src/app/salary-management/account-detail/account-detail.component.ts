import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
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
  db: any;
  cityName: any;
  designationList: any[];
  designationUpdateList: any[];
  allAccountList: any[];
  accountList: any[];
  ddlUser = "#ddlUser";
  ddlDesignation = "#ddlDesignation";
  preAccountNo = "#preAccountNo";
  preIFSC = "#preIFSC";
  txtAccountNo = "#txtAccountNo";
  txtIFSC = "#txtIFSC";
  txtRemarks = "#txtRemarks";
  key = "#key";
  divSolved = "#divSolved";
  divLoader = "#divLoader";
  fireStoreCity: any;
  fireStorePath: any;
  toDayDate: any;
  remarkJsonObject: any;
  accountJsonList: any[];
  userId: any;
  remarkDetail: remarkDetail = {
    by: "",
    remark: "",
    date: "",
    lastUpdate: "",
    lastUpdateBy: ""
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.userId = localStorage.getItem("userID");
    this.toDayDate = this.commonService.setTodayDate();
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStorePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.designationList = [];
    this.designationUpdateList = [];
    this.allAccountList = [];
    this.accountList = [];
    this.remarkJsonObject = null;
    $(this.ddlUser).val("active");
    $(this.ddlDesignation).val("all");
    this.getLastUpdate();
    this.getDesignation();
    this.getAccountDetail();
  }

  getDesignation() {
    this.commonService.getDesignation().then((destinationList: any) => {
      this.designationUpdateList = JSON.parse(destinationList);
    });
  }

  getLastUpdate() {
    const path = this.fireStorePath + this.fireStoreCity + "%2FEmployeeAccount%2FLastUpdate.json?alt=media";
    let lastUpdateInstance = this.httpService.get(path).subscribe(data => {
      lastUpdateInstance.unsubscribe();
      if (data != null) {
        this.remarkDetail.lastUpdate = data["lastUpdate"];
        let userData = this.commonService.getPortalUserDetailById(data["updateBy"]);
        if (userData != undefined) {
          this.remarkDetail.lastUpdateBy = userData["name"];
        }
      }
    });
  }

  getAccountDetail() {
    $(this.divLoader).show();
    this.allAccountList = [];
    this.designationList = [];
    this.accountList = [];
    const path = this.fireStorePath + this.fireStoreCity + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let accountInstance = this.httpService.get(path).subscribe(data => {
      accountInstance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        let list = JSON.parse(jsonData);
        this.allAccountList = this.commonService.transformNumeric(list, "name");
        this.getRoles();
        this.getAccountIssue();
      }
    }, error => {
      this.commonService.setAlertMessage("error", "Sorry! no record found !!!");
    });
  }

  getRoles() {
    let list = this.allAccountList.map(item => item.designation)
      .filter((value, index, self) => self.indexOf(value) === index);
    for (let i = 0; i < list.length; i++) {
      this.designationList.push({ designation: list[i] });
    }
  }

  getAccountIssue() {
    const path = this.fireStorePath + this.fireStoreCity + "%2FEmployeeAccountIssue%2FIssue.json?alt=media";
    let accountIssueInstance = this.httpService.get(path).subscribe(data => {
      accountIssueInstance.unsubscribe();
      if (data != null) {
        this.remarkJsonObject = data;
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            let userDetail = this.allAccountList.find(item => item.empId == empId);
            if (userDetail != undefined) {
              userDetail.remarkDate = data[empId]["remarkDate"];
              userDetail.remarkBy = data[empId]["remarkBy"];
              userDetail.remark = data[empId]["remark"];
            }
          }
        }
      }
      this.showAccountDetail("active", "all");
    }, error => {
      this.showAccountDetail("active", "all");
    });
  }

  filterData() {
    let filterVal = $(this.ddlUser).val();
    let designationFilterVal = $(this.ddlDesignation).val();
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
    $(this.divLoader).hide();
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
    $(this.key).val(id);
    if (type == "account") {
      let userDetail = this.accountList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        setTimeout(() => {
          $(this.preAccountNo).val(userDetail.accountNo);
          $(this.preIFSC).val(userDetail.ifsc);
          $(this.txtAccountNo).val(userDetail.accountNo);
          $(this.txtIFSC).val(userDetail.ifsc);
        }, 100);
      }
    }
    else if (type == "remark") {
      let userDetail = this.accountList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.remark == null) {
          $(this.divSolved).hide();
        }
        else {
          $(this.divSolved).show();
          $(this.txtRemarks).val(userDetail.remark);
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
    let id = $(this.key).val();
    if (id != "0") {
      let userDetail = this.accountList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        let accountNo = $(this.txtAccountNo).val();
        let ifsc = $(this.txtIFSC).val();
        this.updateBankDetail(id, accountNo, ifsc);
        let time = this.commonService.getCurrentTimeWithSecond();
        time = this.commonService.setTodayDate() + " " + time;
        let portalUserList = JSON.parse(localStorage.getItem("webPortalUserList"));
        let portalUserDetail = portalUserList.find(item => item.userId == this.userId);
        if (portalUserDetail != undefined) {
          let name = portalUserDetail.name;
          this.saveEmployeeModificationHistory(id, name, time);
          this.updateEmployeeSummary(id, name, time);
          this.updateAccountListData(id, name, time, accountNo, ifsc);
        }
        $(this.key).val("0");
        this.commonService.setAlertMessage("success", "Acount Detail updated successfully !!!");
        this.closeModel();
      }
    }
  }

  updateBankDetail(id: any, accountNo: any, ifsc: any) {
    let dbPath = "Employees/" + id + "/BankDetails/AccountDetails";
    this.db.object(dbPath).update({ accountNumber: accountNo, ifsc: ifsc });
  }

  updateEmployeeSummary(id: any, name: any, time: any) {
    let dbPath = "Employees/" + id + "/updateSummary";
    const data = {
      by: name,
      date: time
    }
    this.db.object(dbPath).update(data);
  }

  updateAccountListData(id: any, name: any, time: any, accountNo: any, ifsc: any) {
    let userDetail = this.accountList.find((item) => item.empId == id);
    if (userDetail != undefined) {
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
      let path = "" + this.fireStoreCity + "/EmployeeAccount/";
      this.saveJsonFile(this.allAccountList, "accountDetail.json", path);
    }
  }

  saveEmployeeModificationHistory(empId: any, modifyBy: any, modifyDate: any) {
    let historyList = [];
    let accountNumber = $(this.preAccountNo).val();
    let ifsc = $(this.preIFSC).val();
    let filePath = "" + this.fireStoreCity + "/EmployeeDetailModificationHistory/";
    const path = this.fireStorePath + this.fireStoreCity + "%2FEmployeeDetailModificationHistory%2F" + empId + ".json?alt=media";
    let instance = this.httpService.get(path).subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        let list = JSON.parse(jsonData);
        list.push({ accountNumber: accountNumber, ifsc: ifsc, modifyBy: modifyBy, modifyDate: modifyDate });
        this.saveJsonFile(list, empId.toString() + ".json", filePath);
      }
    }, error => {
      historyList.push({ accountNumber: accountNumber, ifsc: ifsc, modifyBy: modifyBy, modifyDate: modifyDate });
      this.saveJsonFile(historyList, empId.toString() + ".json", filePath);
    });
  }

  saveRemarkData(id: any, remarkBy: any, remark: any, remarkDate: any) {
    const data = {
      remarkBy: remarkBy,
      remark: remark,
      remarkDate: remarkDate
    }
    if (this.remarkJsonObject == null) {
      const obj = {};
      obj[id.toString()] = data;
      this.remarkJsonObject = obj;
      this.updateIssueJson(obj);
    }
    else {
      const obj = this.remarkJsonObject;
      obj[id.toString()] = data;
      this.updateIssueJson(obj);
    }
    this.commonService.setAlertMessage("success", "Remark added successfully !!!");
  }

  updateRemarkData(id: any, remark: any) {
    const obj = this.remarkJsonObject;
    obj[id.toString()]["remark"] = remark;
    this.updateIssueJson(obj);
    this.commonService.setAlertMessage("success", "Remark updated successfully !!!");
  }

  updateRemarkHistoryData(id: any, obj: any) {
    this.saveRemarkHistory(id, obj);
    const obj2 = this.remarkJsonObject;
    delete obj2[id.toString()];
    this.updateIssueJson(obj2);
    this.commonService.setAlertMessage("success", "Issue solved updated successfully !!!");
  }

  saveRemarks() {
    let id = $(this.key).val();
    let remark = $(this.txtRemarks).val();
    let remarkDate = this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond();
    let remarkBy = this.userId;
    let userDetail = this.accountList.find((item) => item.empId == id);
    if (userDetail != undefined) {
      if (userDetail.remark == null) {
        if (remark == "") {
          this.commonService.setAlertMessage("error", "Please enter remark !!!");
          return;
        }
        this.saveRemarkData(id, remarkBy, remark, remarkDate);
        this.setRemarkDetail(userDetail, remark, remarkBy, remarkDate);
      }
      else {
        let element = <HTMLInputElement>document.getElementById("chkSolved");
        if (element.checked == false) {
          this.updateRemarkData(id, remark);
          this.setRemarkDetail(userDetail, remark, userDetail.remarkBy, userDetail.remarkDate);
        }
        else {
          const data = {
            remark: userDetail.remark,
            remarkBy: userDetail.remarkBy,
            remarkDate: userDetail.remarkDate,
            solvedDate: remarkDate,
            solvedBy: remarkBy
          }

          const path = this.fireStorePath + this.fireStoreCity + "%2FEmployeeAccountIssue%2FHistory%2F" + id + ".json?alt=media";
          let accountIssueInstance = this.httpService.get(path).subscribe(remarkData => {
            accountIssueInstance.unsubscribe();
            if (remarkData != null) {
              let list = JSON.parse(JSON.stringify(remarkData));
              let keyArray = Object.keys(list);
              const obj = remarkData;
              obj[keyArray.length] = data;
              this.updateRemarkHistoryData(id, obj);
              this.setRemarkDetail(userDetail, null, null, null);
            }
          }, error => {
            const obj = {};
            obj[0] = data;
            this.updateRemarkHistoryData(id, obj);
            this.setRemarkDetail(userDetail, null, null, null);
          });
        }
      }
    }
    this.closeModel();
  }

  setRemarkDetail(userDetail: any, remark: any, remarkBy: any, remarkDate: any) {
    $(this.key).val("0");
    $(this.txtRemarks).val("");
    userDetail.remark = remark;
    userDetail.remarkBy = remarkBy;
    userDetail.remarkDate = remarkDate;
  }

  saveRemarkHistory(id: any, obj: any) {
    let filePath = "" + this.fireStoreCity + "/EmployeeAccountIssue/History/";
    let fileName = id + ".json";
    this.saveJsonFile(obj, fileName, filePath);
  }

  updateIssueJson(obj: any) {
    let filePath = "" + this.fireStoreCity + "/EmployeeAccountIssue/";
    let fileName = "Issue.json";
    this.saveJsonFile(obj, fileName, filePath);
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  saveJsonFile(listArray: any, fileName: any, filePath: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + filePath + fileName;

    //const ref = this.storage.ref(path);
    const ref = this.storage.storage.app.storage(this.fireStorePath).ref(path);
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

  saveJSONData() {
    let path = "" + this.fireStoreCity + "/EmployeeAccount/";
    this.saveJsonFile(this.accountJsonList, "accountDetail.json", path);
    let time = this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond();
    this.remarkDetail.lastUpdate = time;
    let userData = this.commonService.getPortalUserDetailById(this.userId);
    if (userData != undefined) {
      this.remarkDetail.lastUpdateBy = userData["name"];
    }
    const obj = { lastUpdate: time, updateBy: this.userId };
    this.saveJsonFile(obj, "LastUpdate.json", path);
    this.commonService.setAlertMessage("success", "Account data updated successfully !!!");
    $(this.divLoader).hide();
  }

  updateAccountJson() {
    $(this.divLoader).show();
    this.accountJsonList = [];
    let dbPath = "Employees";
    let employeeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        employeeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let empId = keyArray[i];
              if (data[empId]["GeneralDetails"] != null) {
                let status = data[empId]["GeneralDetails"]["status"];
                let name = data[empId]["GeneralDetails"]["name"];
                let empCode = data[empId]["GeneralDetails"]["empCode"];
                let designationId = data[empId]["GeneralDetails"]["designationId"];
                let email = data[empId]["GeneralDetails"]["email"];
                let accountNo = "";
                let ifsc = "";
                let modifyBy = "";
                let modifyDate = "";

                if (data[empId]["BankDetails"] != null) {
                  if (data[empId]["BankDetails"]["AccountDetails"] != null) {
                    if (data[empId]["BankDetails"]["AccountDetails"]["accountNumber"] != null) {
                      accountNo = data[empId]["BankDetails"]["AccountDetails"]["accountNumber"];
                    }
                    if (data[empId]["BankDetails"]["AccountDetails"]["ifsc"] != null) {
                      ifsc = data[empId]["BankDetails"]["AccountDetails"]["ifsc"];
                    }
                  }
                }

                if (data[empId]["updateSummary"] != null) {
                  if (data[empId]["updateSummary"]["by"] != null) {
                    modifyBy = data[empId]["updateSummary"]["by"];
                  }
                  if (data[empId]["updateSummary"]["date"] != null) {
                    modifyDate = data[empId]["updateSummary"]["date"];
                  }
                }
                let designation = "";
                if (this.designationUpdateList.length > 0) {
                  let detail = this.designationUpdateList.find(item => item.designationId == designationId);
                  if (detail != undefined) {

                    if (detail.designation == "Transportation Executive") {
                      designation = "Driver";
                    }
                    else if (detail.designation == "Service Excecutive ") {
                      designation = "Helper";
                    }
                    else {
                      designation = detail.designation;
                    }
                  }
                }
                this.accountJsonList.push({ empId: empId, empCode: empCode, name: name, email: email, designation: designation, status: status, accountNo: accountNo, ifsc: ifsc, modifyBy: modifyBy, modifyDate: modifyDate });
              }
            }
            this.saveJSONData();
            this.getAccountDetail();
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
  lastUpdate: string;
  lastUpdateBy: string;
}
