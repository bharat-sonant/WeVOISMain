import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-garbage-capture-analysis',
  templateUrl: './garbage-capture-analysis.component.html',
  styleUrls: ['./garbage-capture-analysis.component.scss']
})
export class GarbageCaptureAnalysisComponent implements OnInit {

  constructor(public fs: FirebaseService, private actRoute: ActivatedRoute, private commonService: CommonService) { }
  db: any;
  cityName: any;
  taransferList: any[];
  openDepoList: any[];
  litterDustbinList: any[];
  roadsideList: any[];
  toDayDate: any;
  selectedDate: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
    this.getCapturedImages();
  }



  setDefault() {
    this.taransferList = [];
    this.openDepoList = [];
    this.roadsideList = [];
    this.litterDustbinList = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.toDayDate);
    this.setActiveTab("Transfer");
  }


  setActiveTab(tab: any) {
    $("#Transfer").hide();
    $("#OpenDepo").hide();
    $("#LitterDustbin").hide();
    $("#Roadside").hide();

    let element = <HTMLButtonElement>document.getElementById("tabTransfer");
    let className = element.className;
    $("#tabTransfer").removeClass(className);
    $("#tabTransfer").addClass("tablink");

    element = <HTMLButtonElement>document.getElementById("tabOpenDepo");
    className = element.className;
    $("#tabOpenDepo").removeClass(className);
    $("#tabOpenDepo").addClass("tablink");

    element = <HTMLButtonElement>document.getElementById("tabLitterDustbin");
    className = element.className;
    $("#tabLitterDustbin").removeClass(className);
    $("#tabLitterDustbin").addClass("tablink");

    element = <HTMLButtonElement>document.getElementById("tabRoadside");
    className = element.className;
    $("#tabRoadside").removeClass(className);
    $("#tabRoadside").addClass("tablink");

    if (tab == "Transfer") {
      $("#Transfer").show();
      element = <HTMLButtonElement>document.getElementById("tabTransfer");
      className = element.className;
      $("#tabTransfer").removeClass(className);
      $("#tabTransfer").addClass("tablink active-tab");
    } else if (tab == "OpenDepo") {
      $("#OpenDepo").show();
      element = <HTMLButtonElement>document.getElementById("tabOpenDepo");
      className = element.className;
      $("#tabOpenDepo").removeClass(className);
      $("#tabOpenDepo").addClass("tablink active-tab");
    } else if (tab == "LitterDustbin") {
      $("#LitterDustbin").show();
      element = <HTMLButtonElement>document.getElementById("tabLitterDustbin");
      className = element.className;
      $("#tabLitterDustbin").removeClass(className);
      $("#tabLitterDustbin").addClass("tablink active-tab");
    } else if (tab == "Roadside") {
      $("#Roadside").show();
      element = <HTMLButtonElement>document.getElementById("tabRoadside");
      className = element.className;
      $("#tabRoadside").removeClass(className);
      $("#tabRoadside").addClass("tablink active-tab");
    }
  }

  getCapturedImages() {
    let dbPath = "WastebinMonitor/ImagesData/" + this.selectedDate;  
    let imageInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        imageInstance.unsubscribe();
        console.log(data);
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            if (data[i]["category"] == "1") {
              this.taransferList.push({ address: data[i]["address"], imageURL: data[i]["imageRef"], isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
            else if (data[i]["category"] == "2") {
              this.openDepoList.push({ address: data[i]["address"], imageURL: data[i]["imageRef"], isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
            else if (data[i]["category"] == "3") {
              this.litterDustbinList.push({ address: data[i]["address"], imageURL: data[i]["imageRef"], isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
            else if (data[i]["category"] == "4") {
              this.roadsideList.push({ address: data[i]["address"], imageURL: data[i]["imageRef"], isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
          }
          console.log(this.taransferList);
        }
      }
    );
  }
}
