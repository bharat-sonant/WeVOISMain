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


  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.setHeight();
    this.setMap();
    this.getVehicleInfo();
  }

  getVehicleInfo() {
    let request = new XMLHttpRequest();
    const headers = new HttpHeaders().set('Content-Type', 'application/json').set('Access-Control-Allow-Origin', '*');
    request.open("GET", "https://api.wheelseye.com/currentLoc?accessToken=68d9ecda-be3a-473e-b700-7898f1f84419");
    
    request.setRequestHeader('Access-Control-Allow-Headers', '*');
    request.setRequestHeader('Content-type', 'application/json');
    request.setRequestHeader('Access-Control-Allow-Origin', '*');
    request.send();
    request.onload = () => {
      if (request.status == 200) {
        var channelName = JSON.parse(request.response);
        console.log(channelName);

      } else {
        console.log(request.status);
        console.log(request.statusText);
      }
    }


   // const headers = new HttpHeaders().set('Content-Type', 'application/json').set('Access-Control-Allow-Origin', '*');
   // let dbPath = "https://api.wheelseye.com/currentLoc?accessToken=68d9ecda-be3a-473e-b700-7898f1f84419";
    //let data=this.httpService.get((dbPath));
    //this.httpService.get(res, { headers }).subscribe((data) => {
    //  console.log(data);
   // });
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
