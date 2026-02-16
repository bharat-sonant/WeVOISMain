/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild, HostListener } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { AngularFireDatabase, listChanges } from "angularfire2/database";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "angularfire2/storage";
import { Observable, of } from "rxjs";

@Component({
  selector: "app-set-nearby-ward",
  templateUrl: "./set-nearby-ward.component.html",
  styleUrls: ["./set-nearby-ward.component.scss"],
})
export class SetNearbyWardComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  public mapRevisit: google.maps.Map;
  constructor(private storage: AngularFireStorage, public fs: FirebaseService, public afd: AngularFireDatabase, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal) { }

  public selectedZone: any;
  zoneList: any[];
  zoneKML: any;
  cityName: any;
  db: any;
  nearByWards: any[] = [];
  nearByWardJsonObj: object;
  polygonsArray: any[] = [];
  divLoaderUpdate="#divLoaderUpdate";


  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("Portal-Services","Set-Nearby-Ward",localStorage.getItem("userID"));
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.getZones();
    this.selectedZone = "0";
  }

  getZones() {
    $(this.divLoaderUpdate).show();
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
    this.getNearByWards();
  }

  getNearByWards() {
    this.nearByWards = [];
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FNearByWards%2FNearByWards.json?alt=media";
    console.log("get path")
    console.log(path)
    let nearByWardsInstance = this.httpService.get(path).subscribe((data) => {
      nearByWardsInstance.unsubscribe();
      this.nearByWardJsonObj = data;
      this.getAllWardBoundaries();
    }, error => {
      this.getAllWardBoundaries();
    });
  }

  getAllWardBoundaries() {
    this.polygonsArray = [];
    this.nearByWards=[];
    for (let i = 0; i < this.zoneList.length; i++) {
      let zone = this.zoneList[i]["zoneNo"];
      let zoneKML: any;
      if (zone != 0) {
        this.commonService.getWardBoundary(zone, zoneKML, 2).then((data: any) => {
          zoneKML = data;
          var polyCords = [];
          for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
            polyCords.push(new google.maps.LatLng(Number(zoneKML[0]["latLng"][i]["lat"]), Number(zoneKML[0]["latLng"][i]["lng"])));
          }
          let polygon: any;
          let strokeColor = this.getColor();
          let fillColor = "#fff";
          let fillOpacity=0.35;
          if (zone == this.selectedZone) {
            fillColor = "#000000";
            fillOpacity=0.75;
            if (this.nearByWardJsonObj != null) {
              if (this.nearByWardJsonObj[this.selectedZone] != null) {
                if (this.nearByWardJsonObj[this.selectedZone].length > 0) {
                  for (let i = 0; i < this.nearByWardJsonObj[this.selectedZone].length; i++) {
                    this.nearByWards.push(this.nearByWardJsonObj[this.selectedZone][i]);
                  }
                }
              }
            }
          }



          polygon = new google.maps.Polygon({
            paths: polyCords,
            geodesic: true,
            strokeColor: strokeColor,
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
          });

          this.polygonsArray.push({
            zone: zone,
            polygon: polygon,
            polyCords: polyCords,
            strokeColor: strokeColor
          });


          let nearByWards = this.nearByWards;
          let commonService = this.commonService;
          polygon.addListener("click", function () {
            let selectedZone = $("#ddlZone").val();
            if (selectedZone == "0") {
              commonService.setAlertMessage("error", "Please select zone!!!");
              return;
            }
            if(selectedZone==zone){
              commonService.setAlertMessage("error", "Sorry this is selected zone!!!");
              return;
            }
            let isWardExist = false;
            for (let i = 0; i < nearByWards.length; i++) {
              if (zone == nearByWards[i]) {
                isWardExist = true;
                i == nearByWards.length;
              }
            }
            if (isWardExist == true) {
              commonService.setAlertMessage("error", "Zone " + zone + " already exist !!!");
              return;
            }
            nearByWards.push(zone);
          });
          polygon.setMap(this.map);
          if(i==this.zoneList.length-1){
            $(this.divLoaderUpdate).hide();
          }
        });
      }
    }
  }

  getColor() {
    var randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return "#" + randomColor;
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    $(this.divLoaderUpdate).show();
    this.selectedZone = filterVal;
    this.nearByWards = [];
    for (let i = 0; i < this.polygonsArray.length; i++) {
      let key = this.polygonsArray[i];
      let polygon = key["polygon"];
      polygon.setMap(null)
    }
    this.getNearByWards();
  }

  deleteNearByWard(zone: any) {
    $(this.divLoaderUpdate).show();
    this.nearByWards = this.nearByWards.filter((item) => item != zone);
    const list = [];
    for (let i = 0; i < this.nearByWards.length; i++) {
      list.push(this.nearByWards[i]);
    }
    this.nearByWardJsonObj[this.selectedZone.toString()] = list;
    for (let i = 0; i < this.polygonsArray.length; i++) {
      let key = this.polygonsArray[i];
      let polygon = key["polygon"];
      polygon.setMap(null)
    }
    this.getAllWardBoundaries();
  }

  saveData() {
    $(this.divLoaderUpdate).show();
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FNearByWards%2FNearByWards.json?alt=media";
    console.log("save path")
    console.log(path)
    let nearByWardsInstance = this.httpService.get(path).subscribe(
      (data) => {
        nearByWardsInstance.unsubscribe();
        if (this.selectedZone == "0") {
          this.commonService.setAlertMessage("error", "Please select zone !!!");
          return;
        }
        if (data != undefined) {
          data[this.selectedZone.toString()] = this.nearByWards;
          this.commonService.saveJsonFile(data, "NearByWards.json", "/NearByWards/");
          this.commonService.setAlertMessage("success", "Near by ward saved Successfully !!!");
        }
        $(this.divLoaderUpdate).hide();
      },
      (error) => {
        const data = {};
        data[this.selectedZone.toString()] = this.nearByWards;
        this.commonService.saveJsonFile(data, "NearByWards.json", "/NearByWards/");
        this.commonService.setAlertMessage("success", "Near by ward saved Successfully !!!");
        $(this.divLoaderUpdate).hide();
      }
    );
  }
}
