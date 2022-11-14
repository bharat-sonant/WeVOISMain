import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-sacn-card-status',
  templateUrl: './sacn-card-status.component.html',
  styleUrls: ['./sacn-card-status.component.scss']
})
export class SacnCardStatusComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient) { }
  db: any;
  cityName: any;
  scanCardList: any[] = [];
  scanCardFilterList:any[]=[];
  public lastUpdateDate: any;
  txtSearch="#txtSearch";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getScanCardStatus();
  }

  getScanCardStatus() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FCardScanData%2FscanCardStatus.json?alt=media";
    let scanCardStatusInstance = this.httpService.get(path).subscribe(scanCardStatusData => {
      scanCardStatusInstance.unsubscribe();
      if (scanCardStatusData != null) {
        this.lastUpdateDate = scanCardStatusData["lastUpdate"];
      
      let keyArray = Object.keys(scanCardStatusData);
      if (keyArray.length > 0) {
        for (let i = 0; i < keyArray.length; i++) {
          let key = keyArray[i];
          if (key != "lastUpdate") {
            let cardNo = scanCardStatusData[key]["serialNo"];
            let serialNo=Number(cardNo.toString().substring(3,cardNo.toString().length));
            console.log(serialNo);
            let date = scanCardStatusData[key]["scanDate"].split(' ')[0];
            let scanDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0];
            let cardInstalled = scanCardStatusData[key]["cardInstalled"];
            this.scanCardList.push({ cardNo: cardNo, scanDate: scanDate, cardInstalled: cardInstalled,serialNo:serialNo });
            this.scanCardList=this.commonService.transformNumeric(this.scanCardList,'serialNo');
          }
        }
      }
      this.scanCardFilterList=this.scanCardList;
    }
    });
  }

  getScanCardFilteredData(){
    let serialNo = $(this.txtSearch).val();
    if(serialNo!=""){
      this.scanCardFilterList=this.scanCardList.filter(item=>item.serialNo.toString().includes(serialNo));
    }
    else{
      this.scanCardFilterList=this.scanCardList;
    }
  }

  getScanCardData() {
    let dbPath = "CardScanData";
    let scanCardDataInstance = this.db.list(dbPath).valueChanges().subscribe(
      scanCardData => {
        scanCardDataInstance.unsubscribe();
        console.log(scanCardData);
        const data = {};
        for (let i = 0; i < scanCardData.length; i++) {
          if (scanCardData[i]["serialNo"] != null) {
            data[i.toString()] = { serialNo: scanCardData[i]["serialNo"], scanDate: scanCardData[i]["date"], cardInstalled: scanCardData[i]["cardInstalled"] };
          }
        }
        data["lastUpdate"] = this.commonService.setTodayDate();
        let filePath = "/CardScanData/";
        this.commonService.saveJsonFile(data, "scanCardStatus.json", filePath);
        console.log(data);
      })
  }

}
