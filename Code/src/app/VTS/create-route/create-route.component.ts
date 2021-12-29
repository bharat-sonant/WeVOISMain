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
  vehicleRouteLength: any;
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
    this.selectedVehicle = "0";
    this.vehicleRouteLength = 0;
    this.wardBoundaryList = [];
    this.wardLatLngList = [];
    this.setHeight();
    this.setMaps();
    this.getCityBoundaryList();
  }

  getCityBoundaryList() {
    this.httpService.get("../../assets/jsons/WardBoundries/" + this.cityName + ".json").subscribe(data => {
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
    $('#divLoader').show();
    this.httpService.get("../../assets/jsons/VehicleRoute/" + this.cityName + "/" + this.selectedVehicle + ".json").subscribe(data => {
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
        let strockColor = "red";
        let line = new google.maps.Polyline({
          path: latLng,
          strokeColor: strockColor,
          strokeWeight: 2,
        });
        this.polylines[0] = line;
        this.polylines[0].setMap(this.map);
        $('#divLoader').hide();
      }
    });
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
            this.checkWardVehicle(ward);
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

  checkWardVehicle(ward: any) {
    let dbPath = "WardRoute/Vehicle/" + ward + "/" + this.selectedVehicle;
    let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data != null) {
          let detail = this.wardBoundaryList.find(item => item.ward == ward);
          if (detail != undefined) {
            detail.isDone = 1;
          }
        }
      });
  }

  saveWardRoute() {
    let ward = $('#lblWardNo').html();
    let dbPath = "WardRoute/Vehicle/" + ward + "/" + this.selectedVehicle;
    let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data == null) {
          let detail = this.wardBoundaryList.find(item => item.ward == ward);
          if (detail != undefined) {
            let latLng = detail.latLng;
            dbPath = "WardRoute/" + ward + "/" + this.selectedVehicle;
            this.db.database.ref(dbPath).set(latLng);
            dbPath = "WardRoute/Vehicle/" + ward + "/" + this.selectedVehicle;
            this.db.database.ref(dbPath).set("1");
            let details = this.wardBoundaryList.find(item => item.ward == ward);
            if (details != undefined) {
              details.isDone = 1;
            }
          }
          $('#lblWardNo').html("0");
          this.commonService.setAlertMessage("success", "Ward route added successfully");
        }
        else {
          this.commonService.setAlertMessage("error", "Ward " + ward + " already added with vehicle " + this.selectedVehicle);
        }
      }
    );
  }

  showAllRoute() {
    $('#lblWardNo').html("0");
    if (this.wardKMLList.length > 0) {
      for (let i = 0; i < this.wardKMLList.length; i++) {
        if (this.wardKMLList[i] != undefined) {
          this.wardKMLList[i]["wardKML"].setMap(null);
        }
      }
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    if (this.wardBoundaryList.length > 0) {
      for (let i = 0; i < this.wardBoundaryList.length; i++) {
        this.wardKMLList[i]["wardKML"].setMap(this.map);
        let detail = this.wardBoundaryList.find(item => item.ward == this.wardKMLList[i]["ward"]);
        if (detail != undefined) {
          let latLng = detail.latLng;
          let strockColor = "red";
          let line = new google.maps.Polyline({
            path: latLng,
            strokeColor: strockColor,
            strokeWeight: 2,
          });
          this.polylines[i] = line;
          this.polylines[i].setMap(this.map);
        }
      }
    }
  }
}
