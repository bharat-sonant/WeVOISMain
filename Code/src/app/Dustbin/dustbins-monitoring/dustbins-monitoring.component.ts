/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { DustbinService } from "../../services/dustbin/dustbin.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-dustbins-monitoring',
  templateUrl: './dustbins-monitoring.component.html',
  styleUrls: ['./dustbins-monitoring.component.scss']
})
export class DustbinsMonitoringComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private actRoute: ActivatedRoute, private dustbinService: DustbinService, private commonService: CommonService, private modalService: NgbModal, public httpService: HttpClient) { }
  db: any;
  public selectedZone: any;
  selectedDate: any;
  selectedMonthName: any;
  selectedYear: any;
  zoneList: any[];
  dustbinStorageList: any[];
  dustbinList: any[];

  txtDate = "#txtDate";

  planDetail:any;

  pickkingPlanList:any[];

  trackData: trackDetail =
    {
      totalKM: 0,
      totalTime: "0 hr 0 min",
      time: "0:00",
      percentage: "0"
    };

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.setDefault();
  }

  setDefault() {
    this.selectedDate = this.commonService.setTodayDate();
    $(this.txtDate).val(this.selectedDate);
    this.getSelectedYearMonth();
    this.getDustbins();
    this.getPlans();
  }

  getPlans(){
    let dbPath="";
  }



  getSelectedYearMonth() {
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  getDustbins() {
    this.dustbinList = [];
    let list = [];
    if (this.dustbinStorageList.length > 0) {
      if (this.selectedZone == "0") {
        list = this.dustbinStorageList;
      }
      else {
        list = this.dustbinStorageList.filter(item => item.zone == this.selectedZone);
      }
      for (let i = 0; i < list.length; i++) {
        let isBroken = "";
        if (list[i]["isBroken"] == true) {
          isBroken = "डस्टबिन टूटा हुआ है";
        }
        if (list[i]["isDisabled"] == "yes") {
          if (isBroken != "") { isBroken = isBroken + ", " }
          isBroken = isBroken + "Dustbin Disabled";
        }
        if (isBroken != "") { isBroken = "(" + isBroken + ")"; }
        if (list[i]["isDisabled"] != "yes") {
          this.dustbinList.push({ zoneNo: list[i]["zone"], dustbin: list[i]["dustbin"], address: list[i]["address"], pickFrequency: list[i]["pickFrequency"], isBroken: isBroken, isDisabled: list[i]["isDisabled"] });
        }
      }
      if (this.dustbinList.length > 0) {

      }
    }
  }

  setDate(a:any,b:any){

  }
  showImageDetail(){

  }

  getRouteDataPreNext(a:any){

  }
  getRouteData(a:any){

  }
  changeZoneSelection(a:any){

  }

  changeDustbinPickPlanSelection(a:any){

  }

  showHalt(){

  }

  showRoute(){

  }

  showAll(){

  }

}


export class trackDetail {
  totalKM: number;
  totalTime: string;
  time: string;
  percentage: string;
}
