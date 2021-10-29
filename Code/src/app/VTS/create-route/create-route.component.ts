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
  wardLatLngList: any[];
  wardBoundaryList: any[];
  wardKMLList = [];
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.polylines = [];
    this.wardKMLList = [];
    this.lines = [];
    this.selectedVehicle = "0";
    this.wardBoundaryList = [];
    this.wardLatLngList = [];
    this.setHeight();
    this.setMaps();
    this.getCityBoundaryList();
  }

  getCityBoundaryList() {
    this.httpService.get("../../assets/jsons/WardBoundries/WardWise/" + this.cityName + ".json").subscribe(data => {
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let index = keyArray[i];
          let ward = index.split("_")[0];
          let latLngList = [];
          for (let j = 0; j < data[index].length; j++) {
            let latLng = data[index][j];
            let lat = latLng.split(",")[1];
            let lng = latLng.split(",")[0];
            latLngList.push({ lat: Number(lat), lng: Number(lng) })
          }
          this.wardLatLngList.push({ ward: ward, latLngList: latLngList });
        }
        // console.log(this.wardLatLngList);
      }
    });
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
    if (this.wardKMLList.length > 0) {
      for (let i = 0; i < this.wardKMLList.length; i++) {
        if (this.wardKMLList[i] != undefined) {
          this.wardKMLList[i]["wardKML"].setMap(null);
        }
      }
    }
    this.wardKMLList = [];
    this.wardBoundaryList = [];
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
          this.getPlyGon(lat, lng);
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


  getPlyGon(lat: any, lng: any) {
    if (this.wardLatLngList.length > 0) {
      for (let i = 0; i < this.wardLatLngList.length; i++) {
        let ward = this.wardLatLngList[i]["ward"];
        this.inside(lat, lng, this.wardLatLngList[i]["latLngList"], ward);
      }
    }
  }

  inside(point1: any, point2: any, vs: any, ward: any) {
    var x = point1, y = point2;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i]["lat"], yi = vs[i]["lng"];
      var xj = vs[j]["lat"], yj = vs[j]["lng"];

      var intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    if (inside == true) {
      let detail = this.wardBoundaryList.find(item => item.ward == ward);
      if (detail == undefined) {
        let latLng = [];
        latLng.push({ lat: Number(point1), lng: Number(point2) });
        this.commonService.setWardBoundary(ward, this.map).then((wardKML: any) => {
          let wardKMLList = this.wardKMLList;
          let polylines = this.polylines;
          let wardBoundaryList=this.wardBoundaryList;
          let map=this.map;
          let commonService=this.commonService;
          google.maps.event.addListener(wardKML, 'click', function (h) {
            if (wardKMLList.length > 0) {
              for (let i = 0; i < wardKMLList.length; i++) {
                if (wardKMLList[i] != undefined) {
                  wardKMLList[i]["wardKML"].setMap(null);
                }
              }
            }
            wardKMLList = [];
            if (polylines.length > 0) {
              for (let i = 0; i < polylines.length; i++) {
                if (polylines[i] != undefined) {
                  polylines[i].setMap(null);
                }
              }
            }
            polylines = [];

            commonService.setWardBoundary(ward, map).then((wardKML: any) => {
              wardKMLList.push({ ward: ward, wardKML: wardKML });
            });
            let detail = wardBoundaryList.find(item => item.ward == ward);
            if (detail != undefined) {
              let latLng = detail.latLng;
              let strockColor = "red";
              let line = new google.maps.Polyline({
                path: latLng,
                strokeColor: strockColor,
                strokeWeight: 2,
              });
              polylines[0] = line;
              polylines[0].setMap(map);
            }



          });
          this.wardKMLList.push({ ward: ward, wardKML: wardKML });
        });
        this.wardBoundaryList.push({ ward: ward, latLng: latLng });
      }
      else {
        let latLng = detail.latLng;
        latLng.push({ lat: Number(point1), lng: Number(point2) });
        detail.latLng = latLng;
      }
    }
  }

  getSelectedWardData(ward: any) {
    if (this.wardKMLList.length > 0) {
      for (let i = 0; i < this.wardKMLList.length; i++) {
        if (this.wardKMLList[i] != undefined) {
          this.wardKMLList[i]["wardKML"].setMap(null);
        }
      }
    }
    this.wardKMLList = [];
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    this.commonService.setWardBoundary(ward, this.map).then((wardKML: any) => {

      google.maps.event.addListener(wardKML, 'click', function (h) {
        alert("wardKML");


      });

      this.wardKMLList.push({ ward: ward, wardKML: wardKML });

    });
    if (this.wardBoundaryList.length > 0) {
      let detail = this.wardBoundaryList.find(item => item.ward == ward);
      if (detail != undefined) {
        let latLng = detail.latLng;
        let strockColor = "red";
        let line = new google.maps.Polyline({
          path: latLng,
          strokeColor: strockColor,
          strokeWeight: 2,
        });
        this.polylines[0] = line;
        this.polylines[0].setMap(this.map);
      }
    }
  }

}
