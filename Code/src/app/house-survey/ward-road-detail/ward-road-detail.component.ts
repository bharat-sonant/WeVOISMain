/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { AngularFireStorage } from "angularfire2/storage";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-road-detail',
  templateUrl: './ward-road-detail.component.html',
  styleUrls: ['./ward-road-detail.component.scss']
})
export class WardRoadDetailComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient, private storage: AngularFireStorage) { }
  db: any;
  selectedZone: any;
  zoneList: any;
  cityName: any;
  imageURL: any;
  roadList: any[];
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.imageURL = "../../../assets/img/system-generated-image.jpg";
    this.selectedZone = 0;
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  changeZoneSelection(filterVal: any) {
    this.clearAll();
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.selectedZone = filterVal;
    this.getWardRoadList();
  }

  clearAll(){
    this.imageURL="../../../assets/img/system-generated-image.jpg";
    this.roadList = [];
  }

  getWardRoadList() {
    $(this.divLoader).show();
    let dbPath = "EntityMarkingData/WardRoadDetail/" + this.selectedZone;
    let roadInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      roadInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          this.roadList.push({ lineNo: lineNo, roadType: data[lineNo]["roadType"], roadWidth: data[lineNo]["roadWidth"] });
        }
        $(this.divLoader).hide();
      }
      else {
        this.commonService.setAlertMessage("error", "No road information found !!!");
        $(this.divLoader).hide();
      }
    });
  }

  getWardRoadDetail(lineNo:any,index:any){
    this.setActiveClass(index);
  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.roadList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        if (className != "in-active") {
          $("#tr" + i).removeClass(className);
        }
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }
}
