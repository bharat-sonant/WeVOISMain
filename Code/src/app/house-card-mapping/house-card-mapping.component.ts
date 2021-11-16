/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';

//services
import { CommonService } from '../services/common/common.service';
import { MapService } from '../services/map/map.service';
import { FirebaseService } from "../firebase.service";
import * as $ from "jquery";

//import undefined = require('firebase/empty-import');

@Component({
  selector: 'app-house-card-mapping',
  templateUrl: './house-card-mapping.component.html',
  styleUrls: ['./house-card-mapping.component.scss']
})

export class HouseCardMappingComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService) { }

  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  vehicleLocationFirstTime: any;
  polylines = [];
  toDayDate: any;
  previousScannedCard: any[];
  todayScannedCard: any[];
  allCards: any[];
  db: any;
  cityName: any;
  instancesList: any[];
  ngOnInit() {
    this.instancesList = [];
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.getZones();
    this.setMap();
  }

  setHeight() {
    $('.navbar-toggler').show();
    $('#divMap').css("height", $(window).height() - 80);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getAllZones();
  }

  setMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setKml() {
    this.commonService.setKML(this.selectedZone, this.map);
  }

  getZones() {
    this.zoneList = [];
    this.zoneList.push({ zoneNo: "0", zoneName: "-- Select Zone --" });
    let allZones = this.mapService.getZones(this.toDayDate);
    for (let index = 0; index < allZones.length; index++) {
      let dbPathLineCompleted = 'WasteCollectionInfo/' + allZones[index]["zoneNo"] + '/' + this.toDayDate + '/LineStatus';
      let zonesData = this.db.object(dbPathLineCompleted).valueChanges().subscribe(
        data => {
          if (data != null) {
            this.zoneList.push({ zoneNo: allZones[index]["zoneNo"], zoneName: allZones[index]["zoneName"] });
          }
          zonesData.unsubscribe();
        });
    }
  }

  changeZoneSelection(filterVal: any) {
    this.activeZone = filterVal;
  }

  onSubmit() {
    this.selectedZone = this.activeZone;
    this.polylines = [];
    this.setMap();
    this.setKml();
    this.showVehicleMovement();
    this.getLinesFromJson();
    let vehicleInterval = interval(10000).subscribe((val) => {
      this.instancesList.push({ instances: vehicleInterval });
      this.showVehicleMovement();
    });
  }

  getCardScanHistory() {
    this.previousScannedCard = [];
    let cardData = this.db.object('HousesCollectionHistory/' + this.selectedZone).valueChanges().subscribe(
      cards => {
        this.instancesList.push({ instances: cardData });
        if (cards != null) {
          var keyArray = Object.keys(cards);
          for (let index = 0; index < keyArray.length; index++) {
            const element = keyArray[index];

            let lineData = this.previousScannedCard.find(item => item.card == element);
            if (lineData == undefined) {
              this.previousScannedCard.push({ 'card': element });
            }
          }
          this.getLinesFromJson();
        }
      });
  }

  showVehicleMovement() {
    let vehicleLocation = this.db.object('CurrentLocationInfo/' + this.selectedZone + '/CurrentLoc').valueChanges().subscribe(
      data => {
        vehicleLocation.unsubscribe();
        if (data != undefined) {
          this.marker.setMap(null);
          this.marker = new google.maps.Marker({
            position: { lat: data["lat"], lng: data["lng"] },
            map: this.map,
            icon: '../assets/img/tipper-green.png',
          });
        }
      });
  }

  getLinesFromJson() {

    //this.httpService.get('../assets/jsons/' + this.selectedZone + '.json').forEach(
    let wardLines = this.db.object('Defaults/WardLines/' + this.selectedZone).valueChanges().subscribe(
      zoneLine => {
        this.instancesList.push({ instances: wardLines });
        var linePath = [];
        for (let i = 1; i < 10000; i++) {
          var line = zoneLine[i];
          if (line == undefined) { break; }
          var path = [];
          for (let j = 0; j < line.points.length; j++) {
            path.push({ lat: line.points[j][0], lng: line.points[j][1] });
          }
          linePath.push({ lineNo: i, latlng: path, color: "#87CEFA" });
        }
        this.allLines = linePath;
        this.plotLinesOnMap(zoneLine);
      });
  }


  plotLinesOnMap(zoneLine: any) {
    let lastLineDone = this.db.object('WasteCollectionInfo/LastLineCompleted/' + this.selectedZone).valueChanges().subscribe(
      lastLine => {
        lastLineDone.unsubscribe();
        this.polylines = [];
        for (let index = 0; index < this.allLines.length; index++) {
          let lineNo = index + 1;
          let dbPathLineStatus = 'WasteCollectionInfo/' + this.selectedZone + '/' + this.toDayDate + '/LineStatus/' + lineNo + '/Status';
          let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe(
            status => {
              this.instancesList.push({ instances: lineStatus });
              if (this.polylines[index] != undefined) {
                this.polylines[index].setMap(null);
              }

              let lineData = this.allLines.find(item => item.lineNo == lineNo);
              if (lineData != undefined) {
                let line = new google.maps.Polyline({
                  path: lineData.latlng,
                  strokeColor: this.commonService.getLineColor(status),
                  strokeWeight: 2
                });

                this.polylines[index] = line;
                this.polylines[index].setMap(this.map);

                let checkMarkerDetails = status != null ? true : false;

                if (status != null || Number(lastLine) == (lineNo - 1)) {
                  checkMarkerDetails = true;
                }
                this.plotMarkersOnMap(zoneLine[lineNo].Houses, lineNo, checkMarkerDetails);
              }
            });
        }
      });
  }

  plotMarkersOnMap(houseData: any, lineNo: number, needToCheckMarkerScannedDetails: boolean) {
    for (let j = 0; j < houseData.length; j++) {
      if (needToCheckMarkerScannedDetails) {
        let time;
        if (this.selectedZone == 28) {
          time = 'scan-time';
        } else {
          time = 'scan-time';
        }
        let scanCardPath = 'HousesCollectionInfo/' + this.selectedZone + '/' + this.toDayDate + '/' + lineNo + "/" + houseData[j].UID + "/" + time;

        let scanInfo = this.db.object(scanCardPath).valueChanges().subscribe(
          scanTime => {
            this.instancesList.push({ instances: scanInfo });
            if (scanTime != null) {
              this.plotHouses('green', houseData[j]);
            } else {
              let card: any;
              if (this.previousScannedCard != undefined) {
                card = this.previousScannedCard.find(item => item.card == houseData[j].UID);
              }
              if (card == undefined) {
                this.plotHouses('red', houseData[j]);
              } else {
                this.plotHouses('red', houseData[j]);
              }
            }
          });
      } else {
        this.plotHouses('red', houseData[j]);
      }
    }
  }

  plotHouses(markerType: string, houseData: any) {
    new google.maps.Marker({
      position: { lat: Number(houseData.latlong["latitude"]), lng: Number(houseData.latlong["longitude"]) },
      map: this.map,
      icon: {
        url: "../assets/img/" + markerType + "-home.png",
        fillOpacity: 1,
        strokeWeight: 0,
        //scaledSize: new google.maps.Size(20,19)
      }
    });
  }

  ngOnDestroy() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
      }
    }
  }
}