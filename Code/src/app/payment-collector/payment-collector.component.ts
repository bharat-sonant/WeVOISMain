import { Component, OnInit } from '@angular/core';
import { CommonService } from "../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MapService } from "../services/map/map.service";
import { FirebaseService } from "../firebase.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "@angular/fire/storage";
//import * as QRCode from 'qrcode';

@Component({
  selector: 'app-payment-collector',
  templateUrl: './payment-collector.component.html',
  styleUrls: ['./payment-collector.component.scss']
})
export class PaymentCollectorComponent implements OnInit {

  constructor(private router: Router, private storage: AngularFireStorage, public fs: FirebaseService, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal, private mapService: MapService) { }

  zoneList: any[];
  userList: any[];
  lastEmpId: any;
  db: any;
  fileName: any;

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.getZoneList();
    this.getEmployee();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  getEmployee() {
    this.userList = [];
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaymentCollector.json?alt=media";
    let userJSONInstance = this.httpService.get(path).subscribe(userJsonData => {
      userJSONInstance.unsubscribe();
      if (userJsonData != null) {
        this.lastEmpId = Number(userJsonData["lastKey"]);
        let keyArray = Object.keys(userJsonData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            if (empId != "lastKey") {
              let wardNo = "";
              if (userJsonData[empId]["assignedWard"] != null) {
                wardNo = userJsonData[empId]["assignedWard"];
              }
              this.userList.push({
                empId: empId,
                name: userJsonData[empId]["name"],
                mobile: userJsonData[empId]["mobile"],
                isActive: userJsonData[empId]["isActive"],
                password: userJsonData[empId]["password"],
                fileName: userJsonData[empId]["fileName"],
                wardNo: wardNo,
                qrCodeImageUrl: this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2F" + empId + "%2F" + userJsonData[empId]["qrImage"] + "?alt=media",
                docImageUrl: this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2F" + empId + "%2F" + userJsonData[empId]["fileName"] + "?alt=media"
              });
            }
          }
        }
      }
    }, error => {
      this.lastEmpId = 100;
    });
  }


  saveEmployee() {
    let id = $("#key").val();
    let name = $("#txtName").val();
    let mobile = $("#txtPhone").val();
    let password = $("#txtPassword").val();
    let isActive = false;
    let element = <HTMLInputElement>document.getElementById("chkAcive");
    if (element.checked == true) {
      isActive = true;
    }
    if (name == "") {
      this.commonService.setAlertMessage("error", "Please enter name !!!");
      return;
    }
    if (mobile == "") {
      this.commonService.setAlertMessage("error", "Please enter mobile no. !!!");
      return;
    }
    let mobileFilterList = this.userList.filter(item => item.empId != id);
    let detail = mobileFilterList.find(item => item.mobile == mobile);
    if (detail != undefined) {
      this.commonService.setAlertMessage("error", "Mobile no already exist !!!");
      return;
    }

    let jsonData = {};

    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaymentCollector.json?alt=media";
    let userJSONInstance = this.httpService.get(path).subscribe(userJsonData => {
      userJSONInstance.unsubscribe();
      if (userJsonData != null) {
        jsonData = userJsonData;
        this.lastEmpId = Number(userJsonData["lastKey"]);
        this.saveDataInJSON(id, jsonData, name, mobile, password, isActive);
      }
    }, error => {
      this.saveDataInJSON(id, jsonData, name, mobile, password, isActive);
    });
  }

  saveDataInJSON(id: any, jsonData: any, name: any, mobile: any, password: any, isActive: any) {
    if (id == "0") {
      this.lastEmpId++;
      if ((<HTMLInputElement>document.getElementById("fileUpload")).value == "") {
        this.commonService.setAlertMessage("error", "Please upload file !!!");
        return;
      }
      if ((<HTMLInputElement>document.getElementById("fileUpload")).value != "") {
        let element = <HTMLInputElement>document.getElementById("fileUpload");
        let file = element.files[0];
        this.fileName = this.lastEmpId + ".jpg";
        const path = this.commonService.getFireStoreCity() + "/CollectionManagement/" + this.lastEmpId + "/" + this.fileName;
        const storageRef = this.storage.ref(path);
        const uploadTask = this.storage.upload(path, file);
      }
      jsonData["lastKey"] = this.lastEmpId;
      $("#key").val("0");
      this.commonService.setAlertMessage("success", "User added successfully !!!");
    }
    else {
      this.lastEmpId = Number(id);
      if ((<HTMLInputElement>document.getElementById("fileUpload")).value != "") {
        let element = <HTMLInputElement>document.getElementById("fileUpload");
        let file = element.files[0];
        this.fileName = this.lastEmpId + ".jpg";
        const path = this.commonService.getFireStoreCity() + "/CollectionManagement/" + this.lastEmpId + "/" + this.fileName;
        const storageRef = this.storage.ref(path);
        const uploadTask = this.storage.upload(path, file);
      }
      this.commonService.setAlertMessage("success", "User updated successfully !!!");
    }
    const data = {
      name: name,
      mobile: mobile,
      password: password,
      isActive: isActive,
      fileName: this.fileName,
      qrImage: "qrCode.png"
    };
    jsonData[this.lastEmpId.toString()] = data;
    let url = "https://jaipurgreaterd2d.web.app/payment-receiver-detail/" + this.lastEmpId + "~" + this.commonService.getFireStoreCity();
    // this.uploadQRCode(url);

    let fileName = "paymentCollector.json";
    let filePath = "/CollectionManagement/";
    this.commonService.saveJsonFile(jsonData, fileName, filePath).then(response => {
      this.closeModel();
      this.getEmployee();
    });
  }

  /*
  
    private async uploadQRCode(url: any) {
      let qrData: string = url;
      let qrCodeImage = await QRCode.toDataURL(qrData);
      var byteString = atob(qrCodeImage.split(',')[1]);
  
      // separate out the mime component
      var mimeString = qrCodeImage.split(',')[0].split(':')[1].split(';')[0]
  
      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);
  
      // create a view into the buffer
      var ia = new Uint8Array(ab);
  
      // set the bytes of the buffer to the correct values
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
  
      // write the ArrayBuffer to a blob, and you're done
      var blob = new Blob([ab], { type: mimeString });
      let filePath = "/CollectionManagement/" + this.lastEmpId + "/";
      const path = this.commonService.getFireStoreCity() + filePath + "qrCode.png";
      const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(path);
      const task = ref.put(blob);
    }
    */

  openModel(content: any, id: any, type: any) {
    if (type == "ward") {
      let userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.isActive == false) {
          this.commonService.setAlertMessage("error", "This account is in-active, please active account !!!");
          return;
        }
      }
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 190;
      let width = 400;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      $("#empID").val(id);
      userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.wardNo != "") {
          setTimeout(() => {
            $("#ddlWard").val(userDetail.wardNo);
          }, 100);
        }
      }
    } else if (type == "delete") {
      let userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.wardNo == null) {
          this.commonService.setAlertMessage("error", "No assignment found !!!");
          return;
        }
      }
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 170;
      let width = 400;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#deleteId").val(id);
      }
    } else {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 380;
      let width = 400;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#key").val(id);
        let userDetail = this.userList.find((item) => item.empId == id);
        if (userDetail != undefined) {
          $("#txtName").val(userDetail.name);
          $("#txtPhone").val(userDetail.mobile);
          $("#txtPassword").val(userDetail.password);
          this.fileName = userDetail.fileName;
          if (userDetail.isActive == true) {
            let element = <HTMLInputElement>document.getElementById("chkAcive");
            element.checked = true;
          }
        }
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  saveWard() {
    let empID = $("#empID").val();
    if ($("#ddlWard").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select ward!!!");
      return;
    }
    if (empID != "0") {
      let wardNo = $("#ddlWard").val();
      let element = <HTMLInputElement>document.getElementById("chkRemove");
      if (element.checked == true) {
        wardNo = null;
      }

      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaymentCollector.json?alt=media";
      let userJSONInstance = this.httpService.get(path).subscribe(userJsonData => {
        userJSONInstance.unsubscribe();
        if (userJsonData != null) {
          userJsonData[empID.toString()]["assignedWard"] = wardNo;
          let fileName = "paymentCollector.json";
          let filePath = "/CollectionManagement/";
          this.commonService.saveJsonFile(userJsonData, fileName, filePath).then(response => {
            this.commonService.setAlertMessage("success", "Zone assigned successfully !!!");
            $("#empID").val("0");
            this.closeModel();
            let userDetail = this.userList.find((item) => item.empId == empID);
            if (userDetail != undefined) {
              userDetail.wardNo = wardNo;
            }
          });
        }
      });
    }
  }

  removeAssignment() {
    let empID = $("#deleteId").val();
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaymentCollector.json?alt=media";
    let userJSONInstance = this.httpService.get(path).subscribe(userJsonData => {
      userJSONInstance.unsubscribe();
      if (userJsonData != null) {
        userJsonData[empID.toString()]["assignedWard"] = null;
        let fileName = "paymentCollector.json";
        let filePath = "/CollectionManagement/";
        this.commonService.saveJsonFile(userJsonData, fileName, filePath).then(response => {
          this.commonService.setAlertMessage("success", "Zone removed successfully !!!");
          $("#empID").val("0");
          this.closeModel();
          let userDetail = this.userList.find((item) => item.empId == empID);
          if (userDetail != undefined) {
            userDetail.wardNo = null;
          }
        });
      }
    });
  }
}