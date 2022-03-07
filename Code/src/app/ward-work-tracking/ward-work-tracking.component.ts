/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
//services
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-ward-work-tracking',
  templateUrl: './ward-work-tracking.component.html',
  styleUrls: ['./ward-work-tracking.component.scss']
})
export class WardWorkTrackingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  currentYear: any;
  zoneKML: any;
  selectedDate: any;
  cityName: any;
  lines: any[] = [];
  polylines = [];
  wardLineNoMarker: any[] = [];
  strokeWeight: any = 3;
  progressData: progressDetail = {

  };

  invisibleImageUrl = "../assets/img/invisible-location.svg";
  txtDate = "#txtDate";
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.selectedDate = this.commonService.setTodayDate();
    $(this.txtDate).val(this.selectedDate);
    this.setHeight();
    this.setDefaultMap();
    this.getZones().then(() => {
      this.selectedZone = "0";
    });
  }

  getWardData() {
    $(this.divLoader).show();
    this.setWardBoundary();
    this.getAllLinesFromJson();
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.selectedZone = filterVal;
    this.getWardData();
  }

  setWardBoundary() {
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, this.strokeWeight).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i = (i + 5)) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
    });
  }

  clearMapAll() {
    if (this.wardLineNoMarker.length > 0) {
      for (let i = 0; i < this.wardLineNoMarker.length; i++) {
        if (this.wardLineNoMarker[i]["marker"] != null) {
          this.wardLineNoMarker[i]["marker"].setMap(null);
        }
      }
      this.wardLineNoMarker = [];
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != null) {
          this.polylines[i].setMap(null);
        }
      }
      this.polylines = [];
    }
  }

  getAllLinesFromJson() {
    this.clearMapAll();
    this.commonService.getWardLineJson(this.selectedZone, this.selectedDate).then((data: any) => {
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      for (let i = 0; i < keyArray.length - 1; i++) {
        let lineNo = Number(keyArray[i]);
        try {
          let points = wardLines[lineNo]["points"];
          var latLng = [];
          for (let j = 0; j < points.length; j++) {
            latLng.push({ lat: points[j][0], lng: points[j][1] });
          }
          this.lines.push({
            lineNo: lineNo,
            latlng: latLng,
            color: "#87CEFA",
          });
          this.plotLineOnMap(lineNo, latLng, Number(lineNo) - 1);
        }
        catch { }
      }
      $(this.divLoader).hide();
    });
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any) {
    let line = new google.maps.Polyline({
      path: latlng,
      strokeColor: this.commonService.getLineColor(null),
      strokeWeight: 2,
    });
    this.polylines[index] = line;
    this.polylines[index].setMap(this.map);
    let lat = latlng[0]["lat"];
    let lng = latlng[0]["lng"];
    this.setLineNoMarker(lineNo, lat, lng);
  }

  setLineNoMarker(lineNo: any, lat: any, lng: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: this.invisibleImageUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(32, 40),
        origin: new google.maps.Point(0, 0),
      },
      label: {
        text: lineNo.toString(),
        color: "#000",
        fontSize: "10px",
        fontWeight: "bold",
      },
    });
    this.wardLineNoMarker.push({ marker });
  }

  setDefaultMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  getZones() {
    return new Promise((resolve) => {
      this.zoneList = [];
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
      this.zoneList[0]["zoneName"] = "--Select Zone--";
      resolve(true);
    });
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }
}


export class progressDetail {

}
