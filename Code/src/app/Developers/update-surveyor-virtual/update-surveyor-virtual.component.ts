import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-update-surveyor-virtual',
  templateUrl: './update-surveyor-virtual.component.html',
  styleUrls: ['./update-surveyor-virtual.component.scss']
})
export class UpdateSurveyorVirtualComponent implements OnInit {

  constructor(public fs: FirebaseService, private storage: AngularFireStorage, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  arrayBuffer: any;
  first_sheet_name: any;
  cardWardList: any[];
  divLoader = "#divLoader";
  updateList: any[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getCardWardMapping();
  }

  getCardWardMapping() {
    this.cardWardList = [];
    $(this.divLoader).show();
    let dbPath = "CardWardMapping";
    let cardWardInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      cardWardInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let cardNo = keyArray[i];
          this.cardWardList.push({ cardNo: cardNo, ward: data[cardNo]["ward"], line: data[cardNo]["line"] });
        }
        $(this.divLoader).hide();
      }
    })
  }

  updateData() {
    this.updateList = [];
    let element = <HTMLInputElement>document.getElementById("fileUpload");
    let file = element.files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      this.first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[this.first_sheet_name];
      let fileList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      for (let i = 0; i < fileList.length; i++) {
        let cardNo = fileList[i]["Card No"].trim();
        let ward = "";
        let line = "";
        let detail = this.cardWardList.find(item => item.cardNo == cardNo);
        if (detail != undefined) {
          ward = detail.ward;
          line = detail.line;
          let dbPath = "Houses/" + ward + "/" + line + "/" + cardNo;
          
          this.db.object(dbPath).update({ surveyorId: "-2" });
        }
        this.updateList.push({ cardNo: cardNo, ward: ward, line: line });
      }
      this.commonService.setAlertMessage("success", "Surveyor Id updated successfully !!!");
    }
  }
}
