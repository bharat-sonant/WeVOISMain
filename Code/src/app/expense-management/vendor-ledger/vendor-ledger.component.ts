import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-vendor-ledger',
  templateUrl: './vendor-ledger.component.html',
  styleUrls: ['./vendor-ledger.component.scss']
})
export class VendorLedgerComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  vendorList: any[] = [];
  firebaseStoragePath: any;
  selectedVendorId: any;
  vendorJsonObject: any;

  txtName = "#txtName";
  txtMobile = "#txtMobile";
  txtAddress = "#txtAddress";
  txtBankName = "#txtBankName";
  txtAccountNo = "#txtAccountNo";
  txtBranch = "#txtBranch";
  txtIfsc = "#txtIfsc";

  vendorData: vendorDetail = {
    name: "---",
    mobile: "---",
    address: "---",
    bankName: "---",
    accountNumber: "---",
    branch: "---",
    ifsc: "---"
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.firebaseStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.getVendorList();
  }

  getVendorList() {
    const path = this.firebaseStoragePath + "Common%2FVendorList.json?alt=media";
    let vendorJsonInstance = this.httpService.get(path).subscribe(vendorJsonData => {
      vendorJsonInstance.unsubscribe();
      if (vendorJsonData != null) {
        this.vendorJsonObject = vendorJsonData;
        let keyArray = Object.keys(vendorJsonData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let vendorId = keyArray[i];
            if (vendorId != "lastVendorId") {
              this.vendorList.push({ vendorId: vendorId, name: vendorJsonData[vendorId]["name"], mobile: vendorJsonData[vendorId]["mobile"], address: vendorJsonData[vendorId]["address"], bankName: vendorJsonData[vendorId]["bankName"], accountNumber: vendorJsonData[vendorId]["accountNumber"], branch: vendorJsonData[vendorId]["branch"], ifsc: vendorJsonData[vendorId]["ifsc"] });
            }
            this.getVendorDetail(this.vendorList[0]["vendorId"]);
          }
        }
      }
    });
  }

  getVendorDetail(vendorId: any) {
    this.selectedVendorId = vendorId;
    if (this.vendorList.length > 0) {
      let vendorDetail = this.vendorList.find(item => item.vendorId == vendorId);
      if (vendorDetail != undefined) {
        this.vendorData.name = vendorDetail.name;
        this.vendorData.mobile = vendorDetail.mobile;
        this.vendorData.address = vendorDetail.address;
        this.vendorData.bankName = vendorDetail.bankName;
        this.vendorData.accountNumber = vendorDetail.accountNumber;
        this.vendorData.branch = vendorDetail.branch;
        this.vendorData.ifsc = vendorDetail.ifsc;
      }
    }
  }

  openModel(content: any) {
    if (this.selectedVendorId != null) {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 650;
      let width = 600;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      this.getVendorUpdateDetail();
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  getVendorUpdateDetail() {
    if (this.selectedVendorId != null) {
      let vendorDetail = this.vendorList.find(item => item.vendorId == this.selectedVendorId);
      if (vendorDetail != undefined) {
        $(this.txtName).val(vendorDetail.name);
        $(this.txtMobile).val(vendorDetail.mobile);
        $(this.txtAddress).val(vendorDetail.address);
        $(this.txtBankName).val(vendorDetail.bankName);
        $(this.txtAccountNo).val(vendorDetail.accountNumber);
        $(this.txtBranch).val(vendorDetail.branch);
        $(this.txtIfsc).val(vendorDetail.ifsc);
      }
    }
  }

  updateVendorDetail() {
    if(this.checkUpdateVendorValidation()!="yes"){
      this.commonService.setAlertMessage("error",this.checkUpdateVendorValidation());
      return;
    }
    let vendorDetail = this.vendorList.find(item => item.vendorId == this.selectedVendorId);
    if (vendorDetail != undefined) {
      vendorDetail.name = $(this.txtName).val();
      vendorDetail.mobile = $(this.txtMobile).val();
      vendorDetail.address = $(this.txtAddress).val();
      vendorDetail.bankName = $(this.txtBankName).val();
      vendorDetail.accountNumber = $(this.txtAccountNo).val();
      vendorDetail.branch = $(this.txtBranch).val();
      vendorDetail.ifsc = $(this.txtIfsc).val();
      this.getVendorDetail(this.selectedVendorId);
      this.updateVendorJsonObject();
      this.closeModel();
    }
  }

  checkUpdateVendorValidation(){
    let message="yes";
    if($(this.txtIfsc).val()==""){
      message="Please enter IFSC !!!";
    }
    if($(this.txtBranch).val()==""){
      message="Please enter bank branch !!!";
    }
    if($(this.txtAccountNo).val()==""){
      message="Please enter account number !!!";
    }
    if($(this.txtBankName).val()==""){
      message="Please enter bank name !!!";
    }
    if($(this.txtAddress).val()==""){
      message="Please enter address !!!";
    }
    if($(this.txtMobile).val()==""){
      message="Please enter mobile number !!!";
    }
    if($(this.txtName).val()==""){
      message="Please enter name !!!";
    }
    return message;
  }

  updateVendorJsonObject() {
    this.vendorJsonObject[this.selectedVendorId]["name"] = $(this.txtName).val();
    this.vendorJsonObject[this.selectedVendorId]["mobile"] = $(this.txtMobile).val();
    this.vendorJsonObject[this.selectedVendorId]["address"] = $(this.txtAddress).val();
    this.vendorJsonObject[this.selectedVendorId]["bankName"] = $(this.txtBankName).val();
    this.vendorJsonObject[this.selectedVendorId]["accountNumber"] = $(this.txtAccountNo).val();
    this.vendorJsonObject[this.selectedVendorId]["branch"] = $(this.txtBranch).val();
    this.vendorJsonObject[this.selectedVendorId]["ifsc"] = $(this.txtIfsc).val();
    let fileName = "VendorList.json";
    let path = "/Common/";
    this.commonService.saveCommonJsonFile(this.vendorJsonObject, fileName, path);
    this.commonService.setAlertMessage("success", "Vendor detail updated !!!");
  }
}

export class vendorDetail {
  name: string;
  mobile: string;
  address: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  ifsc: string;
}