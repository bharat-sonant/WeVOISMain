import { ObjectUnsubscribedError } from 'rxjs';
/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
//services
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-field-executive-tracking',
  templateUrl: './field-executive-tracking.component.html',
  styleUrls: ['./field-executive-tracking.component.scss']
})
export class FieldExecutiveTrackingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private mapService: MapService, private commonService: CommonService) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedDate: any;
  selectedYear: any;
  selectMonthName: any;
  executiveList: any[];
  polylines = [];
  executiveId: any;
  public bounds: any;
  executiveDetail: executiveDetail =
    {
      totalHalt: "0 hr 00 min",
      dutyOn: "00:00 AM",
      dutyOff: "00:00 PM"
    }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.executiveList = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
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
              dbPath = "FEAttendance/" + executiveId + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate;
              let attendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
                data => {
                  attendanceInstance.unsubscribe();
                  let isShow = 0;
                  let cssClass = "normal";
                  let dutyOn = "00:00 AM";
                  let dutyOff = "00:00 PM";
                  if (data != null) {
                    isShow = 1;
                    if (data["inDetails"] != null) {
                      dutyOn = this.commonService.tConvert(data["inDetails"]["time"]);
                    }
                    if (data["outDetails"] != null) {
                      dutyOff = this.commonService.tConvert(data["outDetails"]["time"]);
                    }
                  }
                  else {
                    cssClass = "not-active";
                  }
                  this.executiveList.push({ executiveId: executiveId, name: name.toUpperCase(), cssClass: cssClass, dutyOn: dutyOn, dutyOff: dutyOff, totalHalt: 0, isShow: isShow });
                  this.executiveList = this.executiveList.sort((a, b) =>
                    b.name > a.name ? 1 : -1
                  );
                  this.executiveList = this.executiveList.sort((a, b) =>
                    b.isShow > a.isShow ? 1 : -1
                  );
                }
              );
            }
          }
        }
      }
    );
  }

  getDutyOnOff() {
    if (this.executiveList.length > 0) {
      let list = this.executiveList;
      for (let i = 0; i < list.length; i++) {
        let executiveId = list[i]["executiveId"];
        let dbPath = "FEAttendance/" + executiveId + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate;
        let attendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            attendanceInstance.unsubscribe();
            let cssClass = "normal";
            let isShow = 0;
            let dutyOn = "00:00 AM";
            let dutyOff = "00:00 PM";
            if (data != null) {
              isShow = 1;
              if (data["inDetails"] != null) {
                dutyOn = this.commonService.tConvert(data["inDetails"]["time"]);
              }
              if (data["outDetails"] != null) {
                dutyOff = this.commonService.tConvert(data["outDetails"]["time"]);
              }
            }
            else {
              cssClass = "not-active";
            }
            let detail = this.executiveList.find(item => item.executiveId == executiveId);
            if (detail != undefined) {
              detail.dutyOn = dutyOn;
              detail.dutyOff = dutyOff;
              detail.isShow = isShow;
              detail.cssClass = cssClass;
            }
            if (i = list.length - 1) {
              list = list.sort((a, b) =>
                b.name > a.name ? 1 : -1
              );
              this.executiveList = list.sort((a, b) =>
                b.isShow > a.isShow ? 1 : -1
              );
            }
          });
      }
    }
  }

  resetDetail() {
    this.setMaps();
    this.executiveDetail.dutyOff = "00:00 PM";
    this.executiveDetail.dutyOn = "00:00 AM";
    this.executiveDetail.totalHalt = "0 hr 00 min";
  }

  getExecutiveRoute(executiveId: any) {
    this.resetDetail();
    for (let i = 0; i < this.executiveList.length; i++) {
      if (this.executiveList[i]["executiveId"] == executiveId) {
        this.executiveList[i]["cssClass"] = "active";
        this.executiveId = executiveId;
        this.executiveDetail.dutyOn = this.executiveList[i]["dutyOn"];
        this.executiveDetail.dutyOff = this.executiveList[i]["dutyOff"];
        this.getHalt();
        this.getExecutiveRouteDetail();
        this.getImageData();
        if (this.selectedDate == this.toDayDate) {
          this.getCurrentLocation();
        }
      }
      else {
        if (this.executiveList[i]["cssClass"] != "not-active") {
          this.executiveList[i]["cssClass"] = "normal";
        }
      }
    }
  }

  getExecutiveRouteDetail() {
    this.bounds = new google.maps.LatLngBounds();
    this.polylines = [];
    if (this.executiveId != 0) {
      let dbPath = "LocationHistory/" + this.executiveId + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate;
      let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          this.polylines = [];
          routeInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              let preLat = 0;
              let preLng = 0;
              for (let i = 0; i < keyArray.length - 2; i++) {
                let latLng = [];
                let index = keyArray[i];
                if (data[index]["lat-lng"] != null) {
                  let latlngList = data[index]["lat-lng"].split("~");
                  if (latlngList.length > 0) {
                    for (let j = 0; j < latlngList.length; j++) {
                      let latLngString = latlngList[j].replace("(", "").replace(")", "");
                      let lat = latLngString.split(",")[0];
                      let lng = latLngString.split(",")[1];
                      if (preLat != 0) {
                        latLng.push({ lat: Number(preLat), lng: Number(preLng) });
                        preLat = 0;
                        preLng = 0;
                      }
                      latLng.push({ lat: Number(lat), lng: Number(lng) });
                      if (j == latlngList.length - 1) {
                        preLat = Number(lat);
                        preLng = Number(lng);
                      }
                      this.bounds.extend({ lat: Number(lat), lng: Number(lng) });
                    }
                    let line = new google.maps.Polyline({
                      path: latLng,
                      strokeColor: "green",
                      strokeWeight: 2,
                    });
                    this.polylines[i] = line;
                    this.polylines[i].setMap(this.map);
                  }
                }
              }
              this.map.fitBounds(this.bounds);
            }
          }
          else {
            this.commonService.setAlertMessage("error", "Sorry! no route found !!!");
          }
        }
      );
    }
  }

  getCurrentLocation() {
    let dbPath = "CurrentLocationInfo/" + this.executiveId + "/latLng";
    let locationInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        locationInstance.unsubscribe();
        if (data != null) {
          let lat = data.split(',')[0];
          let lng = data.split(',')[1];
          new google.maps.Marker({
            position: { lat: Number(lat), lng: Number(lng) },
            map: this.map,
            icon: {
              url: "../../assets/img/violet.svg",
              fillOpacity: 1,
              strokeWeight: 0,
              scaledSize: new google.maps.Size(40, 35),
              origin: new google.maps.Point(0, 0),
            },
          });
        }
      }
    );
  }

  getImageData() {
    let dbPath = "WastebinMonitor/UserImageRef/" + this.executiveId;
    let imageInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        imageInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let imageName = data[index];
              if (this.selectedDate == imageName.split('~')[2]) {
                let dbPath = "WastebinMonitor/ImagesData/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate + "/" + imageName.split('~')[3] + "/" + imageName.split('~')[4];
                console.log(dbPath);
                let detailInstance = this.db.object(dbPath).valueChanges().subscribe(
                  data => {
                    detailInstance.unsubscribe();
                    let lat = data["latLng"].split(',')[0];
                    let lng = data["latLng"].split(',')[1];
                    new google.maps.Marker({
                      position: { lat: Number(lat), lng: Number(lng) },
                      map: this.map,
                      icon: {
                        url: "../../assets/img/t-phone-off_1.png",
                        fillOpacity: 1,
                        strokeWeight: 0,
                        scaledSize: new google.maps.Size(20, 15),
                        origin: new google.maps.Point(0, 0),
                      },
                    });
                  }
                );
              }
            }
          }
        }
      }
    );
  }


  getHalt() {
    let dbPath = "HaltInfo/" + this.executiveId + "/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate;
    let haltInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        haltInstance.unsubscribe();
        if (data.length > 0) {
          let totalHalt = 0;
          for (let i = 0; i < data.length; i++) {
            let duration = 0;
            if (data[i]["duration"] != null) {
              duration = Number(data[i]["duration"]);
              totalHalt = totalHalt + duration;
            }
            if (data[i]["location"] != null) {
              let latlng = data[i]["location"].split(":")[1].split(",");
              let lt = $.trim(latlng[0]).replace("(", "");
              let lg = $.trim(latlng[1]).replace(")", "");
              let imageUrl = "../assets/img/" + this.getMarkerName(duration) + ".svg";
              this.setHaltMarker(lt, lg, imageUrl, duration);
            }
          }
          this.executiveDetail.totalHalt = this.commonService.getMinuteToHHMM(totalHalt);
        }
      }
    );
  }

  getMarkerName(breakTime: number) {
    let markerColor: any;
    if (breakTime <= 10) {
      markerColor = "green";
    } else if (breakTime > 10 && breakTime <= 20) {
      markerColor = "orange";
    } else {
      markerColor = "red";
    }
    return markerColor;
  }

  setHaltMarker(lat: any, lng: any, markerURL: any, markerLabel: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      label: {
        text: " " + markerLabel + " ",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
      },
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(50, 50),
        origin: new google.maps.Point(0, 0),
        labelOrigin: new google.maps.Point(25, 31),
      },
    });
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
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    this.getDutyOnOff();
    this.executiveId = 0;
    this.setMaps();
    this.resetDetail();
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }
}

export class executiveDetail {
  totalHalt: string;
  dutyOn: string;
  dutyOff: string;
}
