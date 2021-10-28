/// <reference types="@types/googlemaps" />
import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-create-route',
  templateUrl: './create-route.component.html',
  styleUrls: ['./create-route.component.scss']
})
export class CreateRouteComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService) { }
  db: any;
  cityName: any
  selectedVehicle: any;
  lines: any[];
  polylines = [];
  ddlVehicle = "#ddlVehicle";
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.polylines = [];
    this.lines = [];
    this.selectedVehicle = "0";
    this.setHeight();
    this.setMaps();
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

  changeVehicleSelection(filterVal: any) {
    $(this.ddlVehicle).val(filterVal);
    this.selectedVehicle = filterVal;
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    this.createRoute();
  }

  createRoute() {
    this.httpService.get("../../assets/jsons/VehicleRoute/" + this.cityName + "/" + this.selectedVehicle + ".json").subscribe(data => {
      if (data != null) {
        let keyArray = Object.keys(data);
        let latLng = [];
        for (let i = 0; i < keyArray.length; i++) {
          let index = keyArray[i];
          let lat = data[index]["latitude"];
          let lng = data[index]["longitude"];
          latLng.push({ lat: Number(lat), lng: Number(lng) });
        }
        let strockColor = "red";
        let line = new google.maps.Polyline({
          path: latLng,
          strokeColor: strockColor,
          strokeWeight: 2,
        });
        this.polylines[0] = line;
        this.polylines[0].setMap(this.map);
      }
    });
  }

}
