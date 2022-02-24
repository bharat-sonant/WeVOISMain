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
  accountJsonList: any[];
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
    this.toDayDate = this.commonService.setTodayDate();
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStorePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.designationList = [];
    this.designationUpdateList = [];
    this.allAccountList = [];
    this.accountList = [];
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
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FLastUpdate.json?alt=media";
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
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
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
        let dbPath = "Employees/" + id + "/BankDetails/AccountDetails";
        let preAccountNo = $(this.preAccountNo).val();
        let preIFSC = $(this.preIFSC).val();
        this.db.object(dbPath).update({ accountNumber: accountNo, ifsc: ifsc });

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

          this.saveEmployeeModificationHistory(id, preAccountNo, preIFSC, name, time);

          dbPath = "Employees/" + id + "/updateSummary";
          const data = {
            by: name,
            date: time
          }
          this.db.object(dbPath).update(data);
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
          let path = "" + this.commonService.getFireStoreCity() + "/EmployeeAccount/";
          this.saveJsonFile(this.allAccountList, "accountDetail.json", path);
        }
        $(this.key).val("0");
        this.commonService.setAlertMessage("success", "Acount Detail updated successfully !!!");
        this.closeModel();
      }
    }
  }

  saveEmployeeModificationHistory(empId: any, accountNumber: any, ifsc: any, modifyBy: any, modifyDate: any) {
    let historyList = [];
    let filePath = "" + this.commonService.getFireStoreCity() + "/EmployeeDetailModificationHistory/";
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployeeDetailModificationHistory%2F" + empId + ".json?alt=media";
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

  saveRemarks() {
    let id = $(this.key).val();
    let remark = $(this.txtRemarks).val();
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
          $(this.key).val("0");
          $(this.txtRemarks).val("");
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
          $(this.key).val("0");
          $(this.txtRemarks).val("");
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
    let path = "" + this.commonService.getFireStoreCity() + "/EmployeeAccount/";
    this.saveJsonFile(this.accountJsonList, "accountDetail.json", path);
    let time = this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond();
    this.remarkDetail.lastUpdate = time;
    let userData = this.commonService.getPortalUserDetailById(localStorage.getItem("userID"));
    if (userData != undefined) {
      this.remarkDetail.lastUpdateBy = userData["name"];
    }
    const obj = { lastUpdate: time, updateBy: localStorage.getItem("userID") };
    this.saveJsonFile(obj, "LastUpdate.json", path);
    this.commonService.setAlertMessage("success", "Account data updated successfully !!!");
    $(this.divLoader).hide();
  }

  updateJson() {
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
                let detail = this.allAccountList.find(item => item.empId == empId);
                if (detail != undefined) {
                  detail.designation = designation;
                  detail.accountNo = accountNo;
                  detail.ifsc = ifsc;
                  detail.name = name;
                }
                detail = this.accountList.find(item => item.empId == empId);
                if (detail != undefined) {
                  detail.designation = designation;
                  detail.accountNo = accountNo;
                  detail.ifsc = ifsc;
                  detail.name = name;
                }
              }
            }
            this.allAccountList=this.accountJsonList;
            this.showAccountDetail("active", "all");
            this.saveJSONData();
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
