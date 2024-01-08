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
  deviceList: any[];
  userList: any[];
  collectionList: any[];
  collectionDetailList: any[];
  lineList: any[] = [];
  lastEmpId: any;
  db: any;
  fileName: any;
  cityName: any;
  public isWardShow: any;
  collectionData: collectionDatail = {
    totalCollection: "0",
    totalDays: 0,
    name: "",
    sumTotalCollection: "0"
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    if (this.cityName == "jaipur-malviyanagar" || this.cityName == "jaipur-murlipura") {
      this.isWardShow = false;
    }
    else {
      this.isWardShow = true;
    }
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getDevices();
    this.getZoneList();
    this.getEmployee();
  }

  getDevices() {
    this.deviceList = [];
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaytmDeviceInformation.json?alt=media";
    let deviceJSONInstance = this.httpService.get(path).subscribe(deviceJsonData => {
      deviceJSONInstance.unsubscribe();
      if (deviceJsonData != null) {
        let keyArray = Object.keys(deviceJsonData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let key = keyArray[i];
            this.deviceList.push({ device: key });
          }
        }
      }
    });
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
              let deviceNo = "";
              let lines = "";
              if (userJsonData[empId]["assignedWard"] != null) {
                wardNo = userJsonData[empId]["assignedWard"];
              }
              if (userJsonData[empId]["assignedDevice"] != null) {
                deviceNo = userJsonData[empId]["assignedDevice"];
              }
              if (userJsonData[empId]["assignedLines"] != null) {
                lines = userJsonData[empId]["assignedLines"];
              }
              this.userList.push({
                empId: empId,
                name: userJsonData[empId]["name"],
                mobile: userJsonData[empId]["mobile"],
                isActive: userJsonData[empId]["isActive"],
                password: userJsonData[empId]["password"],
                fileName: userJsonData[empId]["fileName"],
                wardNo: wardNo,
                deviceNo: deviceNo,
                qrCodeImageUrl: this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2F" + empId + "%2F" + userJsonData[empId]["qrImage"] + "?alt=media",
                docImageUrl: this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2F" + empId + "%2F" + userJsonData[empId]["fileName"] + "?alt=media",
                collectedAmount: 0,
                collectionList: [],
                lines: lines
              });
              this.getCollectionDetail(empId);
            }
            if (this.userList.length > 0) {
              setTimeout(() => {
                this.showCollectionDetail(this.userList[0]["empId"], 0);
              }, 600);
            }
          }

        }
      }
    }, error => {
      this.lastEmpId = 100;
    });
  }


  getLines(wardNo: any) {
    return new Promise((resolve) => {
      this.lineList = [];
      if (wardNo == "0") {
        this.commonService.setAlertMessage("error", "Plese select ward !!!");
        return;
      }
      this.commonService.getWardLine(wardNo, this.commonService.setTodayDate()).then((response:any) => {
        let data=JSON.parse(response);
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo=keyArray[i];
          if (parseInt(lineNo)) {
            this.lineList.push({ lineNo:lineNo, isChecked: 0 });
          }
        }
        resolve("success");
      });     
    });
  }

  getCollectionDetail(empId: any) {
    let collectionList = [];
    let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + empId;
    let instance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        instance.unsubscribe();
        if (data != null) {

          let totalCollectionAmount = 0;

          let dateArray = Object.keys(data);
          for (let i = 0; i < dateArray.length; i++) {
            let date = dateArray[i];
            if (date != "Entities") {
              let totalAmount = 0;
              let keyArray = Object.keys(data[date]);
              if (keyArray.length > 0) {
                let detailArray = [];
                for (let j = 0; j < keyArray.length; j++) {
                  let key = keyArray[j];
                  if (data[date][key]["cardNo"] != null) {
                    if (data[date][key]["transactionAmount"] != null) {
                      totalCollectionAmount += Number(data[date][key]["transactionAmount"]);
                      totalAmount += Number(data[date][key]["transactionAmount"]);
                    }
                    detailArray.push({ cardNo: data[date][key]["cardNo"], merchantTransactionId: data[date][key]["merchantTransactionId"], payMethod: data[date][key]["payMethod"], retrievalReferenceNo: data[date][key]["retrievalReferenceNo"], transactionAmount: data[date][key]["transactionAmount"] });
                  }
                }
                collectionList.push({ date: date, collection: totalAmount.toFixed(2), detailArray: detailArray });
              }
            }
          }
          /*
         let detail = this.userList.find(item => item.empId == empId);
         if (detail != undefined) {
           detail.collectedAmount = totalCollectionAmount.toFixed(2);
           detail.collectionList = collectionList;
           this.collectionData.sumTotalCollection = (Number(this.collectionData.sumTotalCollection) + totalCollectionAmount).toFixed(2);
         }
         */
          this.getEntityCollection(empId, collectionList, totalCollectionAmount);
        }
      });
  }

  getEntityCollection(empId: any, collectionList: any, totalCollectionAmount: any) {
    let dbPath = "PaymentCollectionInfo/PaymentCollectorHistory/" + empId + "/Entities";
    let instance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        instance.unsubscribe();
        if (data != null) {
          let entityKeyArray = Object.keys(data);
          for (let m = 0; m < entityKeyArray.length; m++) {
            let entityKey = entityKeyArray[m];
            let dateData = data[entityKey];
            let dateArray = Object.keys(dateData);
            for (let n = 0; n < dateArray.length; n++) {
              let date = dateArray[n];
              let totalAmount = 0;
              let detail = collectionList.find(item => item.date == date);
              if (detail != undefined) {
                let keyArray = Object.keys(dateData[date]);
                if (keyArray.length > 0) {
                  let detailArray = detail.detailArray;
                  for (let j = 0; j < keyArray.length; j++) {
                    let key = keyArray[j];
                    if (dateData[date][key]["cardNo"] != null) {

                      if (dateData[date][key]["transactionAmount"] != null) {
                        totalCollectionAmount += Number(dateData[date][key]["transactionAmount"]);
                        totalAmount += Number(dateData[date][key]["transactionAmount"]);
                      }
                      detailArray.push({ cardNo: dateData[date][key]["cardNo"], merchantTransactionId: dateData[date][key]["merchantTransactionId"], payMethod: dateData[date][key]["payMethod"], retrievalReferenceNo: dateData[date][key]["retrievalReferenceNo"], transactionAmount: dateData[date][key]["transactionAmount"] });
                    }
                  }
                  detail.collection = (Number(detail.collection) + totalAmount).toFixed(2);
                  detail.detailArray = detailArray;
                }
              }
              else {
                let keyArray = Object.keys(dateData[date]);
                if (keyArray.length > 0) {
                  let detailArray = [];
                  for (let j = 0; j < keyArray.length; j++) {
                    let key = keyArray[j];
                    if (dateData[date][key]["cardNo"] != null) {
                      if (dateData[date][key]["transactionAmount"] != null) {
                        totalCollectionAmount += Number(dateData[date][key]["transactionAmount"]);
                        totalAmount += Number(dateData[date][key]["transactionAmount"]);
                      }
                      detailArray.push({ cardNo: dateData[date][key]["cardNo"], merchantTransactionId: dateData[date][key]["merchantTransactionId"], payMethod: dateData[date][key]["payMethod"], retrievalReferenceNo: dateData[date][key]["retrievalReferenceNo"], transactionAmount: dateData[date][key]["transactionAmount"] });
                    }
                  }
                  collectionList.push({ date: date, collection: totalAmount.toFixed(2), detailArray: detailArray });
                }
              }
            }
          }
        }

        let detail = this.userList.find(item => item.empId == empId);
        if (detail != undefined) {
          detail.collectedAmount = totalCollectionAmount.toFixed(2);
          detail.collectionList = collectionList;
          this.collectionData.sumTotalCollection = (Number(this.collectionData.sumTotalCollection) + totalCollectionAmount).toFixed(2);
        }
      });

  }

  showCollectionDetail(empId: any, index: any) {
    this.setActiveClass(index);
    this.collectionList = [];
    this.collectionData.name = "";
    this.collectionData.totalCollection = "0";
    this.collectionData.totalDays = 0;
    let detail = this.userList.find(item => item.empId == empId);
    if (detail != undefined) {
      this.collectionData.name = detail.name;
      this.collectionData.totalCollection = Number(detail.collectedAmount).toFixed(2);
      this.collectionData.totalDays = detail.collectionList.length;
      this.collectionList = detail.collectionList;
    }
  }

  openCollectionDetail(content: any, date: any) {
    this.collectionDetailList = [];
    let detail = this.collectionList.find(item => item.date == date);
    if (detail != undefined) {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 600;
      let width = 800;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      this.collectionDetailList = detail.detailArray;
    }
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.userList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        if (className != "in-active") {
          $("#tr" + i).removeClass(className);
        }
      }
      if (i == index) {
        if (this.userList[i]["isActive"] == true) {
          $("#tr" + i).addClass("active");
        }
      }
    }
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
      let height = 250;
      let width = 400;
      if (this.isWardShow == true) {
        height = 600;
        width = 600;
      }
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      $("#empID").val(id);
      userDetail = this.userList.find((item) => item.empId == id);
      if (userDetail != undefined) {
        if (userDetail.deviceNo != "") {
          if (this.isWardShow == false) {
            setTimeout(() => {
              if (userDetail.deviceNo != "") {
                $("#ddlDevice").val(userDetail.deviceNo);
              }
            }, 100);
          }
          else {
            setTimeout(() => {
              if (userDetail.wardNo != "") {
                if (userDetail.deviceNo != "") {
                  $("#ddlDevice").val(userDetail.deviceNo);
                }
                if (userDetail.wardNo != "") {
                  $("#ddlWard").val(userDetail.wardNo);
                  this.getLines(userDetail.wardNo).then((response) => {
                    setTimeout(() => {
                      if (userDetail.lines != "") {
                        let list = userDetail.lines.split(",");
                        for (let i = 0; i < list.length; i++) {
                          let detail = this.lineList.find(item => item.lineNo == list[i].trim());
                          if (detail != undefined) {
                            let chk = "chk" + detail.lineNo;
                            (<HTMLInputElement>document.getElementById(chk)).checked = true;
                          }
                        }
                      }
                    }, 200);
                    
                  });
                }
              }
            }, 100);

          }
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
    let lines = "";
    if ($("#ddlDevice").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select device serial no.!!!");
      return;
    }
    if (this.isWardShow == true) {
      if ($("#ddlWard").val() == "0") {
        this.commonService.setAlertMessage("error", "Please select ward !!!");
        return;
      }
      let isLine = false;

      if (this.lineList.length > 0) {
        for (let i = 0; i < this.lineList.length; i++) {
          let lineNo = this.lineList[i]["lineNo"];
          let chk = "chk" + lineNo;
          let element = <HTMLInputElement>document.getElementById(chk);
          if (element.checked == true) {
            isLine = true;
            if (lines != "") {
              lines = lines + ",";
            }
            lines = lines + lineNo;
          }
        }
      }
      if (isLine == false) {
        this.commonService.setAlertMessage("error", "Plese select at least one line !!!");
        return;
      }
    }

    if (empID != "0") {
      let deviceNo = $("#ddlDevice").val();
      let wardNo = $("#ddlWard").val();
      let list=this.userList.filter(item=>item.empId!=empID);
      let detail = list.find(item => item.deviceNo == deviceNo);
      if (detail != undefined) {
        this.commonService.setAlertMessage("error", "Sorry ! you have assigned this device to " + detail.name + " !!!");
        return;
      }
      let element = <HTMLInputElement>document.getElementById("chkRemove");
      if (element.checked == true) {
        deviceNo = null;
        wardNo = null;
        lines = null;
      }

      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FCollectionManagement%2FpaymentCollector.json?alt=media";
      let userJSONInstance = this.httpService.get(path).subscribe(userJsonData => {
        userJSONInstance.unsubscribe();
        if (userJsonData != null) {
          userJsonData[empID.toString()]["assignedDevice"] = deviceNo;
          userJsonData[empID.toString()]["assignedWard"] = wardNo;
          userJsonData[empID.toString()]["assignedLines"] = lines;
          let fileName = "paymentCollector.json";
          let filePath = "/CollectionManagement/";
          this.commonService.saveJsonFile(userJsonData, fileName, filePath).then(response => {
            this.commonService.setAlertMessage("success", "Device assigned successfully !!!");
            $("#empID").val("0");
            $("#ddlDevice").val("0");
            $("#ddlWard").val("0");
            this.lineList = [];
            this.closeModel();
            let userDetail = this.userList.find((item) => item.empId == empID);
            if (userDetail != undefined) {
              userDetail.deviceNo = deviceNo;
              if(this.isWardShow==true){
                userDetail.wardNo=wardNo;
                userDetail.lines=lines;
              }
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
        delete userJsonData[empID.toString()]["assignedDevice"];
        let fileName = "paymentCollector.json";
        let filePath = "/CollectionManagement/";
        this.commonService.saveJsonFile(userJsonData, fileName, filePath).then(response => {
          this.commonService.setAlertMessage("success", "Device removed successfully !!!");
          $("#empID").val("0");
          this.closeModel();
          let userDetail = this.userList.find((item) => item.empId == empID);
          if (userDetail != undefined) {
            userDetail.deviceNo = null;
          }
        });
      }
    });
  }
}


export class collectionDatail {
  totalCollection: string;
  totalDays: number;
  name: string;
  sumTotalCollection: string;
}
