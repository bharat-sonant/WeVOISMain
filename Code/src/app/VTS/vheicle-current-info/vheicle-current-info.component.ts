/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  selector: 'app-vheicle-current-info',
  templateUrl: './vheicle-current-info.component.html',
  styleUrls: ['./vheicle-current-info.component.scss']
})
export class VheicleCurrentInfoComponent {

  constructor(private commonService: CommonService, public httpService: HttpClient) { }

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;
  cityName: any;
  public bounds: any;


  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.setHeight();
    this.setMap();
    this.getAPI();
    this.getVehicleInfo();
  }

  getAPI(){
    const path="https://pullapi-s2.track360.co.in/api/v1/auth/pull_api?username=8955005947&password=Abc@1234";
    
    this.httpService.get(path).subscribe((res) => {
      let data = res;
      console.log(res);
      if (res != null) {
      }
    });
  }

  getVehicleInfo() {
    this.bounds = new google.maps.LatLngBounds();
    const dbPath = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FVTS.json?alt=media";
    let vtsInstance = this.httpService.get(dbPath).subscribe(VTSData => {
      vtsInstance.unsubscribe();
      console.log(VTSData["data"]);
      if (VTSData["data"] != null) {
        let vehicleList = JSON.parse(JSON.stringify(VTSData["data"]["list"]));
        console.log(vehicleList);
        for (let i = 0; i < vehicleList.length; i++) {
          let vehicle = vehicleList[i]["vehicleNumber"];
          let lat = vehicleList[i]["latitude"];
          let lng = vehicleList[i]["longitude"];
          let speed = Number(vehicleList[i]["speed"]);
          let vehiclePath = '../../assets/img/tipper-green.png';
          if (speed == 0) {
            vehiclePath = '../../assets/img/tipper-red.png';
          }
          let marker = new google.maps.Marker({
            position: { lat: Number(lat), lng: Number(lng) },
            map: this.map,
            icon: vehiclePath,
          });
          this.bounds.extend({ lat: Number(lat), lng: Number(lng) });
          let statusString = '<div style="width: 100px;background-color: white;float: left;">';
          statusString += '<div style="background:green;float: left;color:white;width: 100%;text-align:center;font-size:12px;"> ' + vehicle;
          statusString += '</div></div>';
          var infowindow = new google.maps.InfoWindow({
            content: statusString,
          });
          infowindow.open(this.map, marker);
          let wardString = '<div style="min-height: 35px;min-width: 35px;text-align: center;background: #fc6b03;color: white;'
          wardString += 'font-size: 14px;font-weight: bold;padding:2px">Ward No </div>';
          var infowindow1 = new google.maps.InfoWindow({
            content: wardString,
          });

          infowindow1.open(this.map, marker);

          setTimeout(function () {
            $('.gm-ui-hover-effect').css("display", "none");
            $('.gm-style-iw-c').css("border-radius", "3px").css("padding", "0px").css("z-index", "99");
            $('.gm-style-iw-d').css("overflow", "unset");
          }, 300);
        }
      }
    });
  }


  setHeight() {
    $('.navbar-toggler').show();
    $('#divMap').css("height", $(window).height() - 80);
  }

  setMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

}
