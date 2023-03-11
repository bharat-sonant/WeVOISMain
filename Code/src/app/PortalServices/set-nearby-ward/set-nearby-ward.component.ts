/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from "@angular/core";
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
  constructor(
    private storage: AngularFireStorage,
    public fs: FirebaseService,
    public afd: AngularFireDatabase,
    public af: AngularFireModule,
    public httpService: HttpClient,
    private commonService: CommonService,
    private modalService: NgbModal
  ) { }

  public selectedZone: any;
  zoneList: any[];
  zoneKML: any;
  cityName: any;
  db: any;
  nearByWards: any[] = [];
  nearByWardJsonObj: object;
  polygonsArray: any[] = [];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.getZones();
    this.selectedZone = "0";
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
    this.getAllWardBoundaries();
  }

  getAllWardBoundaries() {

    for (let i = 0; i < this.zoneList.length; i++) {
      let zone = this.zoneList[i]["zoneNo"];
      let zoneKML: any;
      if (zone != 0) {
        this.commonService
          .getWardBoundary(zone, zoneKML, 2)
          .then((data: any) => {
            zoneKML = data;
            var polyCords = [];
            for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
              polyCords.push(
                new google.maps.LatLng(
                  Number(zoneKML[0]["latLng"][i]["lat"]),
                  Number(zoneKML[0]["latLng"][i]["lng"])
                )
              );
            }

            const polygon = new google.maps.Polygon({
              paths: polyCords,
              geodesic: true,
              strokeColor: this.getColor(),
              strokeOpacity: 1.0,
              strokeWeight: 2,
              fillColor: "#FFF",
            });
            this.polygonsArray.push({
              zone: zone,
              polygon: polygon,
              polyCords: polyCords,
            });
            let statusString =
              '<div style="width: 100px;background-color: white;float: left;">';
            statusString +=
              '<div style="float: left;width: 100px;text-align:center;font-size:12px;"> ' +
              zone +
              "";
            statusString += "</div></div>";
            var infowindow = new google.maps.InfoWindow({
              content: statusString,
            });

            infowindow.open(this.map, polygon);

            // polygon.addListener("click", function () {
            // let selectedZone=$("#ddlZone").val();
            // if(selectedZone=="0"){
            //     alert("please select zone");
            //     return;
            // }
            //   let detail=nearByWards.find(item=>item==zone);
            //   if(detail==undefined){
            //      nearByWards.push(zone);
            //      console.log(nearByWards)
            //   }

            // });

            polygon.setMap(this.map);
            const bounds = new google.maps.LatLngBounds();
            for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
              bounds.extend({
                lat: Number(zoneKML[0]["latLng"][i]["lat"]),
                lng: Number(zoneKML[0]["latLng"][i]["lng"]),
              });
            }
            this.map.fitBounds(bounds);
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
    this.selectedZone = filterVal;
    for(let i = 0; i < this.polygonsArray.length; i++){
    let key =this.polygonsArray[i];
  
     let polygon=key["polygon"];
     polygon.setMap(null)
    }
    this.getAllWardBoundaries();
    this.getNearByWards();

  }
  deleteNearByWard(zone: any) {
    this.nearByWards = this.nearByWards.filter((item) => item != zone);
  }
  saveData() {
    const path =
    this.commonService.fireStoragePath +
      this.commonService.getFireStoreCity() +
      "%2FNearByWards%2FNearByWards.json?alt=media";
    let nearByWardsInstance = this.httpService.get(path).subscribe(
      (data) => {
        nearByWardsInstance.unsubscribe();
        if (this.selectedZone == "0") {
          this.commonService.setAlertMessage("error", "Please select zone !!!");
          return;
        }
        if (data != undefined) {
          data[this.selectedZone.toString()] = this.nearByWards;
          this.commonService.saveCommonJsonFile(
            data,
            "NearByWards.json",
            this.commonService.getFireStoreCity() + "/NearByWards/"
          );
          this.commonService.setAlertMessage(
            "success",
            "Data saved Successfully !!!"
          );
        }
      },
      (error) => {
        const data = {};
        data[this.selectedZone.toString()] = this.nearByWards;
        this.commonService.saveCommonJsonFile(
          data,
          "NearByWards.json",
          this.commonService.getFireStoreCity() + "/NearByWards/"
        );
        this.commonService.setAlertMessage(
          "success",
          "Data saved Successfully !!!"
        );
      }
    );
  }
  getNearByWards() {
    this.nearByWards = [];
    const path =this.commonService.fireStoragePath +this.commonService.getFireStoreCity() +"%2FNearByWards%2FNearByWards.json?alt=media";
    let nearByWardsInstance = this.httpService.get(path).subscribe((data) => {
      nearByWardsInstance.unsubscribe();
      if (this.selectedZone == "0") {
        this.commonService.setAlertMessage("error", "Please select zone !!!");
        return;
      }
      if (data != undefined) {
        if (data[this.selectedZone] != undefined) {
          this.nearByWards = data[this.selectedZone.toString()];
        }
       
      }
        this.setPolygonListner();
    }
    ,error=>{
     this.setPolygonListner();
    }
    );
    

  }
  setPolygonListner(){
  let nearByWards: any[];
  nearByWards = this.nearByWards;
  let commonService = this.commonService;

  for (let i = 0; i < this.polygonsArray.length; i++) {
    let key = this.polygonsArray[i];
    let polygon = key["polygon"];
   
 
    polygon.addListener("click", function () {
      let selectedZone = $("#ddlZone").val();
      if (selectedZone == "0") {
        commonService.setAlertMessage("error", "Please Select Zone");
        return;
      }
      let detail = nearByWards.find((item) => item == key["zone"]);
      if (detail == undefined) {
         if(selectedZone == key["zone"]){
        commonService.setAlertMessage("error", "Same Zone");
        return;
       }
        nearByWards.push(key["zone"]);
      } else {
        commonService.setAlertMessage("error","Zone " + key["zone"] + " already exist.");
        
      }
    });
  }
  }
}
