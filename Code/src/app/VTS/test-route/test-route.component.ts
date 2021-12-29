/// <reference types="@types/googlemaps" />
import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-test-route',
  templateUrl: './test-route.component.html',
  styleUrls: ['./test-route.component.scss']
})
export class TestRouteComponent implements OnInit {

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService) { }
  db: any;
  cityName: any
  selectedDate: any;
  lines: any[];
  polylines = [];
  ddlDate = "#ddlDate";
  wardLatLngList: any[];
  wardBoundaryList: any[];
  wardKMLList = [];
  vehicleRouteLength: any;
  dateVehicleList: any[];
  vehicleList:any[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }


  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.polylines = [];
    this.wardKMLList = [];
    this.lines = [];
    this.selectedDate = "0";
    this.vehicleRouteLength = 0;
    this.wardBoundaryList = [];
    this.wardLatLngList = [];
    this.dateVehicleList = [];
    this.vehicleList=[];
    this.setHeight();
    this.setMaps();
    this.getVehicleList();
    this.commonService.setWardBoundary(75, this.map).then((wardKML: any) => {
      //this.wardBoundary = wardKML;
    });
    this.commonService.setWardBoundary(2, this.map).then((wardKML: any) => {
      //this.wardBoundary = wardKML;
    });
  }

  getVehicleList() {
    this.httpService.get("../../assets/jsons/Test-JSON/vehicleRoute.json").subscribe(data => {
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let date = keyArray[i];
          let vehicles = data[date];
          for (let j = 1; j < vehicles.length; j++) {
            this.dateVehicleList.push({ date: date, vehicle: vehicles[j] });
          }
        }
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
    // $('#divLoader').show();
    this.vehicleRouteLength = 0;
    $(this.ddlDate).val(filterVal);
    this.selectedDate = filterVal;
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    this.vehicleList=[];
    this.createRoute();
  }


  createRoute() {
    // $('#divLoader').show();
    let filterList = this.dateVehicleList.filter(item => item.date == this.selectedDate);
    if (filterList.length > 0) {
      for (let i = 0; i < filterList.length; i++) {
        let vehicle = filterList[i]["vehicle"];
        
        this.httpService.get("../../assets/jsons/Test-JSON/" + this.selectedDate + "/" + vehicle + ".json").subscribe(data => {
          if (data != null) {
            let keyArray = Object.keys(data);
            let latLng = [];
            this.vehicleRouteLength = keyArray.length - 1;
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let lat = data[index]["latitude"];
              let lng = data[index]["longitude"];
              latLng.push({ lat: Number(lat), lng: Number(lng) });
              this.getPlyGon(lat, lng);
            }
            this.vehicleList.push({vehicle:vehicle, color:this.getLineColor(i), isShow:1,latLng:latLng});
            let strockColor = this.getLineColor(i);
            let line = new google.maps.Polyline({
              path: latLng,
              strokeColor: strockColor,
              strokeWeight: 2,
            });
            this.polylines[i] = line;
            this.polylines[i].setMap(this.map);
          }
        });
      }
    }
  }

  getLineColor(index: any) {
    let color = "#ff0000";
    if (index == 1) {
      color = "#ff00c8";
    }
    else if (index == 2) {
      color = "#9d00ff";
    }
    else if (index == 3) {
      color = "#0400ff";
    }
    else if (index == 4) {
      color = "#00e7ff";
    }
    else if (index == 5) {
      color = "#10ff00";
    }
    else if (index == 6) {
      color = "#fbff00";
    }
    else if (index == 7) {
      color = "#ffbc00";
    }
    else if (index == 8) {
      color = "#28a745";
    }
    return color;
  }

  
  changeRef(index: any) {
    let element = <HTMLInputElement>document.getElementById("chk" + index);
    if (element.checked == true) {
      this.vehicleList[index]["isShow"] = 1;
    }
    else {
      this.vehicleList[index]["isShow"] = 0;
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    for (let i = 0; i < this.vehicleList.length; i++) {
      if (this.vehicleList[i]["isShow"] == 1) {
        this.plotRefRouteOnMap(this.vehicleList[i]["vehicle"], i);
      }
    }
  }

  
  plotRefRouteOnMap(vehicle: any, index: any) {
    if (this.vehicleList.length > 0) {
      let detail = this.vehicleList.find(item => item.vehicle == vehicle);
      if (detail != undefined) {
        let latLngList = detail.latLng;
        var latLng = [];
        if (latLngList.length > 0) {
          for (let i = 0; i < latLngList.length; i++) {
            latLng.push({ lat: Number(latLngList[i]["lat"]), lng: Number(latLngList[i]["lng"]) });
          }
          let strockColor = detail.color;
          let line = new google.maps.Polyline({
            path: latLng,
            strokeColor: strockColor,
            strokeWeight: 4,
          });
          this.polylines[index] = line;
          this.polylines[index].setMap(this.map);
        }
      }
    }
  }


  getPlyGon(lat: any, lng: any) {
    if (this.wardLatLngList.length > 0) {
      for (let k = 0; k < this.wardLatLngList.length; k++) {
        let ward = this.wardLatLngList[k]["ward"];
        let vs = this.wardLatLngList[k]["latLngList"];

        var x = lat, y = lng;
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
          var xi = vs[i]["lat"], yi = vs[i]["lng"];
          var xj = vs[j]["lat"], yj = vs[j]["lng"];

          var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        if (inside == true) {
          k = this.wardLatLngList.length;
          let detail = this.wardBoundaryList.find(item => item.ward == ward);
          if (detail == undefined) {
            let latLng = [];
            latLng.push({ lat: Number(lat), lng: Number(lng) });
            this.commonService.setWardBoundary(ward, this.map).then((wardKML: any) => {
              this.wardKMLList.push({ ward: ward, wardKML: wardKML });
              let wardKMLList = this.wardKMLList;
              let polylines = this.polylines;
              let wardBoundaryList = this.wardBoundaryList;
              let map = this.map;
              google.maps.event.addListener(wardKML, 'click', function (h) {
                $('#lblWardNo').html(ward);
                if (wardKMLList.length > 0) {
                  for (let i = 0; i < wardKMLList.length; i++) {
                    if (wardKMLList[i] != undefined) {
                      wardKMLList[i]["wardKML"].setMap(null);
                    }
                  }
                }

                if (polylines.length > 0) {
                  for (let i = 0; i < polylines.length; i++) {
                    if (polylines[i] != undefined) {
                      polylines[i].setMap(null);
                    }
                  }
                }
                wardKML.setMap(map);
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
            });
            this.wardBoundaryList.push({ ward: ward, latLng: latLng, isDone: 0 });
          }
          else {
            let latLng = detail.latLng;
            latLng.push({ lat: Number(lat), lng: Number(lng) });
            detail.latLng = latLng;
          }
        }
      }
    }
  }


}
