
import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";

@Component({
  selector: 'app-survey-verified-report',
  templateUrl: './survey-verified-report.component.html',
  styleUrls: ['./survey-verified-report.component.scss']
})
export class SurveyVerifiedReportComponent {

  constructor(private commonService: CommonService, private httpService: HttpClient) { }
  selectedZone: any;
  zoneList: any;
  cityName: any;
  cardList: any[];
  cardFilterList: any[];
  cardFinalList:any[];
  divLoaderUpdate = "#divLoaderUpdate";
  public totalVerifiedCount: any;
  public multipleCardsCount:any;
  txtCardNo="#txtCardNo";
  ddlZone="#ddlZone";
  chkDuplicate="chkDuplicate";
  rowDataList:any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.selectedZone = 0;
    this.totalVerifiedCount = 0;
    this.multipleCardsCount=0;
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    $(this.divLoaderUpdate).show();
    this.selectedZone = filterVal;
    this.getCardList();
  }

  getCardList() {
    this.cardList = [];
    this.cardFinalList=[];
    this.cardFilterList=[];
    this.totalVerifiedCount = 0;
    this.multipleCardsCount=0;
    (<HTMLInputElement>document.getElementById(this.chkDuplicate)).checked=false;
    $(this.txtCardNo).val("");
    
    let element = <HTMLElement>document.getElementById("divList");
    element.scrollTop = 0;
    this.rowDataList = 100;
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyVerificationJson%2F" + this.selectedZone + "%2FHouseAndItsVerifiedCards.json?alt=media";
    let verifiedInstance = this.httpService.get(path).subscribe(data => {
      verifiedInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));
      let counts = 0;
      for (let i = 0; i < list.length; i++) {
        if (list[i]["color"] != "purple") {
          counts++;
          let detail = this.cardList.find(item => item.cardNo == list[i]["cardNo"]);
          if (detail == undefined) {
            let verifyLineNoList = [];
            verifyLineNoList.push({ lineNo: list[i]["verifiedLineNo"] });
            this.cardList.push({ cardNo: list[i]["cardNo"], houseLineNo: list[i]["houseLineNo"], verifyLineNoList: verifyLineNoList, count: 1 });
          }
          else {
            detail.verifyLineNoList.push({ lineNo: list[i]["verifiedLineNo"] });
            detail.count = detail.count + 1;
          }
        }
      }
      this.multipleCardsCount=(this.cardList.filter(item=>item.count>1).length)
      this.totalVerifiedCount = counts;      
      this.cardFilterList = this.cardList;
      this.cardFinalList=this.cardFilterList.slice(0, this.rowDataList);
      $(this.divLoaderUpdate).hide();
    },error=>{
      $(this.divLoaderUpdate).hide();
      this.commonService.setAlertMessage("error","Data not found. Please update from Survey Verfication !!!")
    });
  }

  onContainerScroll() {
    let element = <HTMLElement>document.getElementById("divList");
    if ((element.offsetHeight + element.scrollTop + 10) >= element.scrollHeight) {
      this.rowDataList = this.rowDataList + 100;
      this.cardFinalList = this.cardFilterList.slice(0, this.rowDataList);
    }
  }

  getFilter(){
    let element = <HTMLElement>document.getElementById("divList");
    element.scrollTop = 0;
    this.rowDataList = 100;
    let cardNo=$(this.txtCardNo).val();
    let list=this.cardList;
    if((<HTMLInputElement>document.getElementById(this.chkDuplicate)).checked == true){
      list=this.cardList.filter(item=>item.count>1);
    }
    if(cardNo!=""){
      list=list.filter(item=>item.cardNo.toString().toUpperCase().includes(cardNo.toString().toUpperCase()));
    }
    this.cardFilterList=list;
    this.cardFinalList=this.cardFilterList.slice(0, this.rowDataList);
  }
}
