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
  allVendorList: any[]=[];
  vendorList: any[] = [];
  yearList: any[] = [];
  allLedgerList: any[];
  ledgerList: any[];
  firebaseStoragePath: any;
  selectedVendorId: any;
  vendorJsonObject: any;
  toDayDate: any;
  selectedYear: any;

  txtName = "#txtName";
  txtMobile = "#txtMobile";
  txtAddress = "#txtAddress";
  txtBankName = "#txtBankName";
  txtAccountNo = "#txtAccountNo";
  txtBranch = "#txtBranch";
  txtIfsc = "#txtIfsc";
  txtSearch = "#txtSearch";

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
    this.toDayDate = this.commonService.setTodayDate();
    this.getVendorList();
    this.getYear();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
    this.selectedYear = this.toDayDate.split('-')[0];
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
              this.allVendorList.push({ vendorId: vendorId, name: vendorJsonData[vendorId]["name"].toUpperCase(), mobile: vendorJsonData[vendorId]["mobile"], address: vendorJsonData[vendorId]["address"], bankName: vendorJsonData[vendorId]["bankName"], accountNumber: vendorJsonData[vendorId]["accountNumber"], branch: vendorJsonData[vendorId]["branch"], ifsc: vendorJsonData[vendorId]["ifsc"] });
            }
          }
        }
        this.allVendorList = this.commonService.transformNumeric(this.allVendorList, "name");
        this.vendorList = this.allVendorList;
        this.selectedVendorId = this.vendorList[0]["vendorId"];
        this.getVendorDetail(this.selectedVendorId);
      }
    });
  }

  searchVendor() {
    let name = $(this.txtSearch).val();
    name = name.toString().toUpperCase();
    let list = this.allVendorList.filter(item => item.name.includes(name));
    if (list.length > 0) {
      this.vendorList = list;
    }
    else {
      this.vendorList = [];
    }
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
        this.getVendorLedger();
      }
    }
  }

  getVendorLedger() {
    this.allLedgerList = [];
    this.ledgerList = [];
    this.getExpenses();
  }

  getExpenses() {
    const path = this.firebaseStoragePath + "Common%2FExpenses%2F" + this.selectedVendorId + ".json?alt=media";
    let expensesJsonInstance = this.httpService.get(path).subscribe(expenseJsonData => {
      expensesJsonInstance.unsubscribe();
      if (expenseJsonData != null) {
        let keyArray = Object.keys(expenseJsonData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let dateKey = keyArray[i];
            let expenseData = expenseJsonData[dateKey];
            let year = dateKey.split('-')[0];
            let billNo = expenseData["billNo"];
            let amount = Number(expenseData["amount"]);
            this.allLedgerList.push({ date: dateKey, year: year, billNo: billNo, amount: amount.toFixed(2) });
          }
          this.getSelectedYearLedger();
        }
      }
    });
  }

  getSelectedYearLedger() {
    if (this.allLedgerList.length > 0) {
      this.ledgerList = this.allLedgerList.filter(item => item.year == this.selectedYear);
    }
  }

  changeYearSelection(year: any) {
    this.selectedYear = year;
    this.getSelectedYearLedger();
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
    if (this.checkUpdateVendorValidation() != "yes") {
      this.commonService.setAlertMessage("error", this.checkUpdateVendorValidation());
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

  checkUpdateVendorValidation() {
    let message = "yes";
    if ($(this.txtAddress).val() == "") {
      message = "Please enter address !!!";
    }
    if ($(this.txtMobile).val() == "") {
      message = "Please enter mobile number !!!";
    }
    if ($(this.txtName).val() == "") {
      message = "Please enter name !!!";
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
