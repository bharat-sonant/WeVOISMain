/// <reference types="@types/googlemaps" />

import { Component, ViewChild, OnInit } from "@angular/core";
//services
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-field-executive-tracking',
  templateUrl: './field-executive-tracking.component.html',
  styleUrls: ['./field-executive-tracking.component.scss']
})
export class FieldExecutiveTrackingComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private actRoute: ActivatedRoute, private mapService: MapService, private commonService: CommonService) { }
  db: any;
  cityName: any;
  selectedDate: any;
  executiveList: any[];
  polylines = [];
  executiveId: any;
  public bounds: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    console.log(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.executiveList = []; this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
    this.executiveId = 0;
    this.setHeight();
    this.setMaps();
    this.fillExecitives();
  }

  fillExecitives() {
    let dbPath = "WastebinMonitor/FieldExecutive";
    let instance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        instance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let executiveId = keyArray[i];
              let name = data[executiveId]["name"];
              this.executiveList.push({ executiveId: executiveId, name: name });
            }
          }
        }
      }
    );
  }

  getExecutiveRoute(executiveId: any) {
    this.bounds = new google.maps.LatLngBounds();
    this.executiveId = executiveId;
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
    let year = this.selectedDate.split('-')[0];
    let month = this.selectedDate.split('-')[1];
    let monthName = this.commonService.getCurrentMonthName(Number(month) - 1);
    let dbPath = "LocationHistory/" + executiveId + "/" + year + "/" + monthName + "/" + this.selectedDate;
    let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        routeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let latLng = [];
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (data[index]["lat-lng"] != null) {
                let latlngList = data[index]["lat-lng"].split("~");
                if (latlngList.length > 0) {
                  for (let j = 0; j < latlngList.length; j++) {
                    let latLngString = latlngList[j].replace("(", "").replace(")", "");
                    let lat = latLngString.split(",")[0];
                    let lng = latLngString.split(",")[1];
                    latLng.push({ lat: Number(lat), lng: Number(lng) });
                    this.bounds.extend({ lat: Number(lat), lng: Number(lng) });
                  }
                  let line = new google.maps.Polyline({
                    path: latLng,
                    strokeColor: "green",
                    strokeWeight: 4,
                  });
                  this.polylines[i] = line;
                  this.polylines[i].setMap(this.map);
                  this.map.fitBounds(this.bounds);
                }

              }
            }

          }
        }
      }
    );
  }


  setDate(filterVal: any, type: string) {
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
    this.getExecutiveRoute(this.executiveId);
  }


  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }


  setMaps() {
    var mapstyle = new google.maps.StyledMapType([
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ]);
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.mapTypes.set("styled_map", mapstyle);
    this.map.setMapTypeId("styled_map");
  }

}
