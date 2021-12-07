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
  year:any;
  monthName:any;
  selectedVehicle: any;
  vehicleList: any[];
  polylines = [];
  lines: any[];
  markerList: any[];
  public bounds: any;
  chkShowLines = "#chkShowLines";
  chkShowMarker = "#chkShowMarker";
  divLoader = "#divLoader";
  showMarker: any;
  showLines: any;

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
    $('#txtDate').val(this.selectedDate);
    this.vehicleList = [];
    this.markerList = [];
    this.lines = [];
    this.showMarker = true;
    this.showLines = true;
  }

  clearAll() {
    this.vehicleList = [];
    this.lines = [];
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
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
    this.year = this.selectedDate.split('-')[0];
    let month = this.selectedDate.split('-')[1];
    this.monthName = this.commonService.getCurrentMonthName(Number(month) - 1);
    let dbPath = "BVGRoutes/" + this.year + "/" + this.monthName + "/" + this.selectedDate + "/main";
    let vehicleInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        vehicleInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let vehicle = data[i]["vehicle"];
            let isShow = 0;
            this.vehicleList.push({ vehicle: vehicle, isShow: isShow });
          }
        }
      });
  }

  getRouteData(vehicle: any, index: any) {
    $('#divLoader').show();
    this.lines = [];
    this.bounds = new google.maps.LatLngBounds();
    let dbPath = "BVGRoutes/" + this.year + "/" + this.monthName + "/" + this.selectedDate + "/" + vehicle;
    let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        routeInstance.unsubscribe();
        if (data != null) {
          let list = data.toString().split("~");
          console.log(list);
          if (list.length > 0) {
            let latLng = [];
            for (let i = 0; i < list.length; i++) {
              let lat = list[i].split(',')[0];
              let lng = list[i].split(',')[1];
              latLng.push({ lat: Number(lat), lng: Number(lng) });
              this.bounds.extend({ lat: Number(lat), lng: Number(lng) });
              if (this.showMarker == true) {
                this.setMarker(Number(lat), Number(lng));
              }
            }
            this.lines = latLng;
            if (this.showLines == true) {
              let strockColor = "red";
              let line = new google.maps.Polyline({
                path: latLng,
                strokeColor: strockColor,
                strokeWeight: 4,
              });
              this.polylines[0] = line;
              this.polylines[0].setMap(this.map);
            }

            this.map.fitBounds(this.bounds);
            $('#divLoader').hide();
          }
        }
      });
  }


  setMarker(lat: any, lng: any) {
    let lt = lat;
    let lg = lng;
    let markerURL = "../../../assets/img/greenmarker.png";
    let marker = new google.maps.Marker({
      position: { lat: Number(lt), lng: Number(lg) },
      map: this.map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(10, 15),
        origin: new google.maps.Point(0, 0),
      },
    });
    this.markerList.push({ marker });
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
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
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

  showHideLines() {
    let element = <HTMLInputElement>document.getElementById("chkShowLines");
    if (element.checked == true) {
      this.showLines = true;
      let strockColor = "red";
      let line = new google.maps.Polyline({
        path: this.lines,
        strokeColor: strockColor,
        strokeWeight: 4,
      });
      this.polylines[0] = line;
      this.polylines[0].setMap(this.map);
      this.map.fitBounds(this.bounds);
    }
    else {
      this.showLines = false;
      this.polylines[0].setMap(null);
    }
  }

  showHideMarkers() {
    let element = <HTMLInputElement>document.getElementById("chkShowMarker");
    if (element.checked == true) {
      this.showMarker = true;
      if (this.lines.length > 0) {
        for (let i = 0; i < this.lines.length; i++) {
          this.setMarker(Number(this.lines[i]["lat"]), Number(this.lines[i]["lng"]));
        }

      }
    }
    else {
      this.showMarker = false;
      if (this.markerList.length > 0) {
        for (let i = 0; i < this.markerList.length; i++) {
          this.markerList[i]["marker"].setMap(null);
        }
      }
      this.markerList = [];
    }
  }

}
