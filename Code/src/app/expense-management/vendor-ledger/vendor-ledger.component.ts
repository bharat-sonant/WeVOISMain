import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-vendor-ledger',
  templateUrl: './vendor-ledger.component.html',
  styleUrls: ['./vendor-ledger.component.scss']
})
export class VendorLedgerComponent implements OnInit {

  constructor(public fs: FirebaseService, private modalService: NgbModal, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  vendorList: any[] = [];
  firebaseStoragePath: any;
  vendorJsonObject: any;

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
              this.vendorList.push({ vendorId: vendorId, name: vendorJsonData[vendorId]["name"], mobile:vendorJsonData[vendorId]["mobile"], address:vendorJsonData[vendorId]["address"], bankName:vendorJsonData[vendorId]["bankName"], accountNumber:vendorJsonData[vendorId]["accountNumber"], branch:vendorJsonData[vendorId]["branch"], ifsc:vendorJsonData[vendorId]["ifsc"]});
            }
          }
        }
      }
    });
  }

  getVendorDetail(vendorId:any){
    if(this.vendorList.length>0){
      let vendorDetail=this.vendorList.find(item=>item.vendorId==vendorId);
      if(vendorDetail!=undefined){
        this.vendorData.name=vendorDetail.name;
        this.vendorData.mobile=vendorDetail.mobile;
        this.vendorData.address=vendorDetail.address;
        this.vendorData.bankName=vendorDetail.bankName;
        this.vendorData.accountNumber=vendorDetail.accountNumber;
        this.vendorData.branch=vendorDetail.branch;
        this.vendorData.ifsc=vendorDetail.ifsc;
      }
    }
  }
}

export class vendorDetail {
  name:string;
  mobile:string;
  address:string;
  bankName:string;
  accountNumber:string;
  branch:string;
  ifsc:string;
}
