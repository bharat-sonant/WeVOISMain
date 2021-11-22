/// <reference types="@types/googlemaps" />
import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-bvg-routes',
  templateUrl: './bvg-routes.component.html',
  styleUrls: ['./bvg-routes.component.scss']
})
export class BvgRoutesComponent implements OnInit {

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private storage: AngularFireStorage, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService) { }
  db: any;
  cityName: any
  selectedDate: any;
  selectedVehicle: any;
  vehicleList: any[];
  polylines = [];
  lines: any[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
    this.setHeight();
    this.setMaps();
    this.getRouteVehicles();
  }

  setDefault() {
    this.selectedDate = this.commonService.setTodayDate();
    this.selectedDate = "2021-09-01";
    $('#txtDate').val(this.selectedDate);
    this.vehicleList = [];
  }

  clearAll() {
    this.vehicleList = [];
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
  }


  setDate(filterVal: any, type: string) {
    this.clearAll();
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate($("#txtDate").val(), 1);
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.commonService.setTodayDate())) {
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    this.getRouteVehicles();
  }


  getRouteVehicles() {
    let dbPath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FBVGRouteJson%2F" + this.selectedDate + "%2Fmain.json?alt=media";
    this.httpService.get(dbPath).subscribe(data => {
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let index = keyArray[i];
          let vehicle = data[index]["vehicle"];
          let isShow = 0;
          if (i == 0) {
            isShow = 1;
            this.getRouteData(vehicle, 2);
          }
          this.vehicleList.push({ vehicle: vehicle, isShow: isShow });
        }
      }
    });
  }

  getRouteData(vehicle: any, index: any) {
    let dbPath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FBVGRouteJson%2F" + this.selectedDate + "%2F" + vehicle + ".json?alt=media";
    this.httpService.get(dbPath).subscribe(data => {
      if (data != null) {
        let points = data[0]["points"];
        let latLng = [];
        for (let i = 0; i < points.length; i++) {
          latLng.push({ lat: Number(points[i]["lat"]), lng: Number(points[i]["lng"]) });
        }
        let strockColor = "red";
        let line = new google.maps.Polyline({
          path: latLng,
          strokeColor: strockColor,
          strokeWeight: 4,
        });
        this.polylines[index] = line;
        this.polylines[index].setMap(this.map);
      }
    });

  }

  changeRef(index: any) {
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (i == index) {
        this.vehicleList[i]["isShow"] = 1;
        this.getRouteData(this.vehicleList[i]["vehicle"], i);
      }
      else {
        this.vehicleList[i]["isShow"] = 0;
      }
    }
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.setOptions({ clickableIcons: false });
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

}
