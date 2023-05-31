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
      dutyOff: "00:00 PM",
      totalImages: "0",
      totalKM: "0"
    }
  startPointUrl = "../../assets/img/start-point.svg";
  endPointUrl = "../../assets/img/end-point.svg";
  imageDataUrl = "../../assets/img/t-phone-off_1.png";
  currentLocationUrl = "../../assets/img/sports-bike.svg";
  divLoader = "#divLoader";

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
                  let latLng = "";
                  let latLngEnd = "";
                  if (data != null) {
                    isShow = 1;
                    if (data["inDetails"] != null) {
                      dutyOn = this.commonService.tConvert(data["inDetails"]["time"]);
                      latLng = data["inDetails"]["location"];
                    }
                    if (data["outDetails"] != null) {
                      dutyOff = this.commonService.tConvert(data["outDetails"]["time"]);
                      latLngEnd = data["outDetails"]["location"];
                    }
                  }
                  else {
                    cssClass = "not-active";
                  }
                  this.executiveList.push({ executiveId: executiveId, name: name.toUpperCase(), cssClass: cssClass, dutyOn: dutyOn, dutyOff: dutyOff, totalHalt: 0, isShow: isShow, latLng: latLng, latLngEnd: latLngEnd, imageData: [], haltData: [], lineData: [] });
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
            let latLng = "";
            let latLngEnd = "";
            if (data != null) {
              isShow = 1;
              if (data["inDetails"] != null) {
                dutyOn = this.commonService.tConvert(data["inDetails"]["time"]);
                latLng = data["inDetails"]["location"];
              }
              if (data["outDetails"] != null) {
                dutyOff = this.commonService.tConvert(data["outDetails"]["time"]);
                latLngEnd = data["outDetails"]["location"];
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
              detail.latLng = latLng;
              detail.latLngEnd = latLngEnd;
              detail.imageData = [];
              detail.haltData = [];
              detail.lineData = [];
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
    this.executiveDetail.totalImages = "0";
    this.executiveDetail.totalKM = "0";
  }

  getExecutiveRoute(executiveId: any) {
    $(this.divLoader).show();
    this.resetDetail();
    for (let i = 0; i < this.executiveList.length; i++) {
      if (this.executiveList[i]["executiveId"] == executiveId) {
        this.executiveList[i]["cssClass"] = "active";
        this.executiveId = executiveId;
        this.executiveDetail.dutyOn = this.executiveList[i]["dutyOn"];
        this.executiveDetail.dutyOff = this.executiveList[i]["dutyOff"];
        if (this.executiveList[i]["latLng"] != "") {
          let lat = this.executiveList[i]["latLng"].split(',')[0];
          let lng = this.executiveList[i]["latLng"].split(',')[1];
          this.setMarkers(lat, lng, this.startPointUrl, 50, 45, "");
        }
        if (this.executiveList[i]["latLngEnd"] != "") {
          let lat = this.executiveList[i]["latLngEnd"].split(',')[0];
          let lng = this.executiveList[i]["latLngEnd"].split(',')[1];
          this.setMarkers(lat, lng, this.endPointUrl, 50, 45, "");
        }
        this.getHalt();
        this.getExecutiveRouteDetail();
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

  setMarkers(lat: any, lng: any, markerUrl: any, point1: any, point2: any, time: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(point1, point2),
        origin: new google.maps.Point(0, 0),
      },
    });
    if (time != "") {
      let contentString = "Capture Time : " + time + " &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ";
      let infowindow = new google.maps.InfoWindow({
        content: contentString,
      });
      marker.addListener("click", function () {
        infowindow.open(this.map, marker);
      });
    }
  }

  getExecutiveRouteDetail() {
    this.bounds = new google.maps.LatLngBounds();
    this.polylines = [];
    if (this.executiveId != 0) {
      let executiveDetail = this.executiveList.find(item => item.executiveId == this.executiveId);
      if (executiveDetail != undefined) {
        let lineData = executiveDetail.lineData;
        if (lineData.length > 0) {
          let latLng = [];
          this.executiveDetail.totalKM = (Number(lineData[lineData.length - 1]["distance"]) / 1000).toFixed(1)
          for (let i = 0; i < lineData.length; i++) {
            let lat = lineData[i]["lat"];
            let lng = lineData[i]["lng"];
            latLng.push({ lat: Number(lat), lng: Number(lng) });
            this.bounds.extend({ lat: Number(lat), lng: Number(lng) });
          }
          let line = new google.maps.Polyline({
            path: latLng,
            strokeColor: "green",
            strokeWeight: 2,
          });
          this.polylines[0] = line;
          this.polylines[0].setMap(this.map);
          this.map.fitBounds(this.bounds);
          this.getImageData();
        }
        else {
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
                  let totalKM = 0;
                  for (let i = 0; i < keyArray.length - 2; i++) {
                    let latLng = [];
                    let index = keyArray[i];
                    if (data[index]["lat-lng"] != null) {
                      if (data[index]["distance-in-meter"] != null) {
                        totalKM = totalKM + Number(data[index]["distance-in-meter"]);
                      }
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
                          let detail = this.executiveList.find(item => item.executiveId == this.executiveId);
                          if (detail != undefined) {
                            detail.lineData.push({ lat: lat, lng: lng, distance: totalKM });
                          }
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
                    if (i == keyArray.length - 3) {
                      this.getImageData();
                    }
                  }
                  this.executiveDetail.totalKM = (totalKM / 1000).toFixed(1);
                  this.map.fitBounds(this.bounds);
                }
              }
              else {
                this.getImageData();
                this.commonService.setAlertMessage("error", "Sorry! no route found !!!");
              }
            }
          );

        }
      }
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
          this.setMarkers(lat, lng, this.currentLocationUrl, 50, 45, "");
        }
      }
    );
  }

  getImageData() {
    let executiveDetail = this.executiveList.find(item => item.executiveId == this.executiveId);
    if (executiveDetail != undefined) {
      let imageData = executiveDetail.imageData;
      if (imageData.length > 0) {
        this.executiveDetail.totalImages = imageData.length;
        for (let i = 0; i < imageData.length; i++) {
          let lat = imageData[i]["lat"];
          let lng = imageData[i]["lng"];
          let time = imageData[i]["time"];
          this.setMarkers(lat, lng, this.imageDataUrl, 20, 15, time);
        }
        setTimeout(() => {
          $(this.divLoader).hide();
        }, 1000);
      }
      else {
        let dbPath = "WastebinMonitor/UserImageRef/" + this.executiveId;
        let imageInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            imageInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                let totalImages = 0;
                for (let i = 0; i < keyArray.length; i++) {
                  let index = keyArray[i];
                  let imageName = data[index];
                  if (this.selectedDate == imageName.split('~')[2]) {
                    totalImages++;
                    let dbPath = "WastebinMonitor/ImagesData/" + this.selectedYear + "/" + this.selectMonthName + "/" + this.selectedDate + "/" + imageName.split('~')[3] + "/" + imageName.split('~')[4];
                    let detailInstance = this.db.object(dbPath).valueChanges().subscribe(
                      data => {
                        detailInstance.unsubscribe();
                        let lat = data["latLng"].split(',')[0];
                        let lng = data["latLng"].split(',')[1];
                        let time = data["time"];
                        this.setMarkers(lat, lng, this.imageDataUrl, 20, 15, time);
                        let detail = this.executiveList.find(item => item.executiveId == this.executiveId);
                        if (detail != undefined) {
                          detail.imageData.push({ lat: lat, lng: lng, time });
                        }
                      }
                    );
                  }
                }
                this.executiveDetail.totalImages = totalImages.toFixed(0);
                setTimeout(() => {
                  $(this.divLoader).hide();
                }, 1000);
              }
            }
            else {
              setTimeout(() => {
                $(this.divLoader).hide();
              }, 1000);
            }
          }
        );
      }
    }
  }

  getHalt() {
    let executiveDetail = this.executiveList.find(item => item.executiveId == this.executiveId);
    if (executiveDetail != undefined) {
      let haltData = executiveDetail.haltData;
      if (haltData.length > 0) {
        let totalHalt = 0;
        for (let i = 0; i < haltData.length; i++) {
          let lat = haltData[i]["lat"];
          let lng = haltData[i]["lng"];
          let duration = haltData[i]["duration"];
          totalHalt = totalHalt + duration;
          let address = haltData[i]["address"];
          let startTime = haltData[i]["startTime"];
          let endTime = haltData[i]["endTime"];
          let imageUrl = "../assets/img/" + this.getMarkerName(duration) + ".svg";
          this.setHaltMarker(lat, lng, imageUrl, duration, address, startTime, endTime);
        }
        this.executiveDetail.totalHalt = this.commonService.getMinuteToHHMM(totalHalt);
      }
      else {
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
                  let lat = $.trim(latlng[0]).replace("(", "");
                  let lng = $.trim(latlng[1]).replace(")", "");
                  let startTime = data[i]["startTime"];
                  let endTime = "";
                  if (data[i]["endTime"] != null) {
                    endTime = data[i]["endTime"];
                  }
                  let imageUrl = "../assets/img/" + this.getMarkerName(duration) + ".svg";
                  let address = data[i]["locality"];
                  this.setHaltMarker(lat, lng, imageUrl, duration, address, startTime, endTime);
                  let detail = this.executiveList.find(item => item.executiveId == this.executiveId);
                  if (detail != undefined) {
                    detail.haltData.push({ lat: lat, lng: lng, duration: duration, address: address, startTime: startTime, endTime: endTime });
                  }
                }
              }
              this.executiveDetail.totalHalt = this.commonService.getMinuteToHHMM(totalHalt);
            }
          }
        );
      }
    }
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

  setHaltMarker(lat: any, lng: any, markerURL: any, markerLabel: any, address: any, startTime: any, endTime: any) {
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

    let contentString = "Start Time : " + startTime + " - ";
    if (endTime != "") {
      contentString += "End Time : " + endTime + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br/>";
    }
    else {
      contentString += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br/>";
    }
    contentString += address;
    let infowindow = new google.maps.InfoWindow({
      content: contentString,
    });
    marker.addListener("click", function () {
      infowindow.open(this.mapHalt, marker);
    });
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.selectedYear = this.selectedDate.split('-')[0];
        this.selectMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
        this.getDutyOnOff();
        this.executiveId = 0;
        this.setMaps();
        this.resetDetail();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 50);
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
  totalImages: string;
  totalKM: string;
}
