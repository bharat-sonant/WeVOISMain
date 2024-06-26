import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-house-entry-form',
  templateUrl: './house-entry-form.component.html',
  styleUrls: ['./house-entry-form.component.scss']
})

export class HouseEntryFormComponent implements OnInit {

  constructor(public db: AngularFireDatabase, private toastr: ToastrService, public httpService: HttpClient) { }

  customer: Customer = new Customer();

  ngOnInit() {
    this.UploadExcelData();
  }

  SetHouseType(filterVal: any) {
    this.customer.houeType = filterVal;
  }

  UploadExcelData() {

    let cardExcelRawData = [];    
    let wardName = "ExcelData";
    this.httpService.get('../assets/excels/' + wardName + '.json').forEach(
      ExcelData => {

        // Now collect Excel Data
        for (let index = 0; index < ExcelData["Sheet1"].length; index++) {
          const excelelement = ExcelData["Sheet1"][index];
          let cardNo = excelelement["CARD_NO"] == undefined ? "" : excelelement["CARD_NO"].replace(" ", "");
          let address = excelelement["ADDRESS"];
          let name = excelelement["CUSTOMER_NAME"];
          let mobile = excelelement["MOBILE_NO"];
 
          cardExcelRawData.push(
            {
              "address": address,
              "name": name,
              "mobile": mobile,
              "cardno": cardNo
            }
          );
        }

        for (let index = 0; index < cardExcelRawData.length; index++) {
          const element = cardExcelRawData[index];

          this.db.object('CardExcelRawData/' + element["cardno"]).update({
            address: element["address"] == undefined ? "" : element["address"],
            name: element["name"] == undefined ? "" : element["name"],
            mobno: element["mobile"] == undefined ? "" : element["mobile"]
          });

        }


        let wardLines = this.db.list('CardExcelRawData').valueChanges().subscribe(
          totalRecord => {
          });

        //console.log("CardExcelRawData.length :" + cardExcelRawData.length);

        
      });
  }
}




export class Customer {
  sNo: number;
  cardNo: string;
  name: string;
  mobNo: string;
  ward: string;
  address: string;
  houeType: string;
  rfid: string;
  receiptNo: string;
}
