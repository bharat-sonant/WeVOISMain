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
  imageNoFoundURL="../../../assets/img/NotAvailable.jfif";
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
    this.setActiveTab("Transfer");
    $('#txtDate').val(this.selectedDate);
  }

  resetData(){
    this.taransferList = [];
    this.openDepoList = [];
    this.roadsideList = [];
    this.litterDustbinList = [];
    let bigImage=<HTMLImageElement>document.getElementById("main");
    bigImage.src=this.imageNoFoundURL;
    let bigImage1=<HTMLImageElement>document.getElementById("main1");
    bigImage1.src=this.imageNoFoundURL;
    let bigImage2=<HTMLImageElement>document.getElementById("main2");
    bigImage2.src=this.imageNoFoundURL;
    let bigImage3=<HTMLImageElement>document.getElementById("main3");
    bigImage3.src=this.imageNoFoundURL;
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
    this.resetData();
    let dbPath = "WastebinMonitor/ImagesData/" + this.selectedDate;  
    let imageInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        imageInstance.unsubscribe();
        console.log(data);
        if (data.length > 0) {
          let city = this.commonService.getFireStoreCity();
          for (let i = 0; i < data.length; i++) {
            let imageURL = "../../../assets/img/system-generated-image.jpg";
          if (data[i]["imageRef"] != null) {
            imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FWastebinMonitorImages%2F"  + data[i]["imageRef"] + "?alt=media";

          }
            if (data[i]["category"] == "1") {
              this.taransferList.push({ address: data[i]["address"], imageURL: imageURL, isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
            else if (data[i]["category"] == "2") {
              this.openDepoList.push({ address: data[i]["address"], imageURL:imageURL, isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
            else if (data[i]["category"] == "3") {
              this.litterDustbinList.push({ address: data[i]["address"], imageURL: imageURL, isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
            else if (data[i]["category"] == "4") {
              this.roadsideList.push({ address: data[i]["address"], imageURL: imageURL, isClean: data[i]["isClean"], time: data[i]["time"], user: data[i]["user"], latLng: data[i]["latLng"] });
            }
            if(i==data.length-1){
              let transmain=this.taransferList[0]["imageURL"];
              let bigImage=<HTMLImageElement>document.getElementById("main");
              bigImage.src=transmain;
              let openmain=this.openDepoList[0]["imageURL"];
              let bigImage1=<HTMLImageElement>document.getElementById("main1");
              bigImage1.src=openmain;
              let littermainmain=this.litterDustbinList[0]["imageURL"];
              let bigImage2=<HTMLImageElement>document.getElementById("main2");
              bigImage2.src=littermainmain;
              let roadmain=this.roadsideList[0]["imageURL"];
              let bigImage3=<HTMLImageElement>document.getElementById("main3");
              bigImage3.src=roadmain;
              }
          }
        }
      }
    );
  }

  transchange(index:any)
  {
    let transmain=this.taransferList[index]["imageURL"];
    let bigImage=<HTMLImageElement>document.getElementById("main");
    bigImage.src=transmain;
  }
  openchange(index:any)
  {
    let openmain=this.openDepoList[index]["imageURL"];
    let bigImage1=<HTMLImageElement>document.getElementById("main1");
    bigImage1.src=openmain;
  }
  literchange(index:any)
  {
    let littermainmain=this.litterDustbinList[index]["imageURL"];
    let bigImage2=<HTMLImageElement>document.getElementById("main2");
    bigImage2.src=littermainmain;
  }
  citychange(index:any)
  {
    let roadmain=this.roadsideList[index]["imageURL"];
    let bigImage3=<HTMLImageElement>document.getElementById("main3");
    bigImage3.src=roadmain;
  }

  
  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate(
        $("#txtDate").val(),
        1
      );
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.toDayDate)) {
      this.selectedDate = this.toDayDate;
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
   this.getCapturedImages();
  }
 
}
