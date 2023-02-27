/// <reference types="@types/googlemaps" />

import { Component, OnInit,ViewChild } from '@angular/core';
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { AngularFireDatabase } from "angularfire2/database";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-set-nearby-ward',
  templateUrl: './set-nearby-ward.component.html',
  styleUrls: ['./set-nearby-ward.component.scss']
})
export class SetNearbyWardComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  public mapRevisit: google.maps.Map;
  constructor(private storage: AngularFireStorage, public fs: FirebaseService, public afd: AngularFireDatabase, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal) { }

  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  zoneKML: any;
  cityName: any;
  houseMarker: any[] = [];
  db: any;
  
  
 

 

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.getZones();
    this.selectedZone="0";
  }


  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
    this.getAllWardBoundaries();
    // console.log(this.zoneList)

  }
  getAllWardBoundaries(){
    for(let i=0;i<this.zoneList.length;i++){
     let zone=this.zoneList[i]["zoneNo"];
     let zoneKML:any;
     if(zone!=0){
      this.commonService.getWardBoundary(zone, zoneKML, 2).then((data: any) => {

        zoneKML = data;
        zoneKML[0]["line"].setMap(this.map);
        const bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
          bounds.extend({ lat: Number(zoneKML[0]["latLng"][i]["lat"]), lng: Number(zoneKML[0]["latLng"][i]["lng"]) });
        }
        this.map.fitBounds(bounds);
      });

     }
    }

  }
  // changeZoneSelection(filterVal: any) {
  //   if (filterVal == "0") {
  //     this.commonService.setAlertMessage("error", "Please select zone !!!");
  //     return;
  //   }

  //   this.selectedZone = filterVal;
   
  //   this.getWardDetail();
  // }
 
}



