/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { AngularFireStorage } from "angularfire2/storage";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-ward-road-detail',
  templateUrl: './ward-road-detail.component.html',
  styleUrls: ['./ward-road-detail.component.scss']
})
export class WardRoadDetailComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private commonService: CommonService, private httpService: HttpClient, private storage: AngularFireStorage) { }
  db: any;
  selectedZone: any;
  zoneList: any;
  cityName: any;
  imageURL: any;
  roadList: any[];
  zoneKML: any;
  allMarkers: any[] = [];
  markerList: any[] = [];
  polylines = [];
  lines: any[] = [];
  toDayDate: any;
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefaults();
  }

  setDefaults() {
    this.imageURL = "../../../assets/img/system-generated-image.jpg";
    this.selectedZone = 0;
    this.toDayDate = this.commonService.setTodayDate();
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.setMapHeight();
    this.map = this.commonService.setMap(this.gmap);
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  changeZoneSelection(filterVal: any) {
    this.clearAll();
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.selectedZone = filterVal;
    this.getWardRoadList();
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, 2).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
      this.getAllLinesFromJson();
    });
  }


  getAllLinesFromJson() {
    this.commonService.getWardLineRoadDetail(this.selectedZone, this.toDayDate).then((data: any) => {
      if (this.allMarkers.length > 0) {
        for (let i = 0; i < this.allMarkers.length; i++) {
          this.allMarkers[i]["marker"].setMap(null);
        }
      }
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          if (this.polylines[i] != null) {
            this.polylines[i].setMap(null);
          }
        }
      }
      this.allMarkers = [];
      this.polylines = [];
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      let wardLineCount = wardLines["totalLines"];
      for (let i = 0; i <= wardLineCount; i++) {
        let lineNo = Number(keyArray[i]);
        try {
          let points = wardLines[lineNo]["points"];
          var latLng = [];
          for (let j = 0; j < points.length; j++) {
            latLng.push({ lat: points[j][0], lng: points[j][1] });
          }
          this.lines.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA", });
          this.plotLineOnMap(lineNo, latLng, i, this.selectedZone);
        }
        catch { }
      }

    });
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    if (wardNo == this.selectedZone) {
      let strokeWeight = 2;
      let status = "";
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: this.commonService.getLineColor(status),
        strokeWeight: strokeWeight,
      });
      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);

      let userType = localStorage.getItem("userType");
      if (userType == "Internal User") {
        let lat = latlng[0]["lat"];
        let lng = latlng[0]["lng"];
        this.setMarkerForLineNo(lat, lng, this.invisibleImageUrl, lineNo.toString(), this.map);
      }
    }
  }

  setMarkerForLineNo(lat: any, lng: any, markerURL: any, markerLabel: any, map: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(30, 40),
        origin: new google.maps.Point(0, 0),
      },
      label: {
        text: markerLabel,
        color: "#000",
        fontSize: "10px",
        fontWeight: "bold",
      },
    });
    this.allMarkers.push({ marker });
  }

  clearAll() {
    this.imageURL = "../../../assets/img/system-generated-image.jpg";
    this.roadList = [];
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
  }

  getWardRoadList() {
    $(this.divLoader).show();
    let dbPath = "EntityMarkingData/WardRoadDetail/" + this.selectedZone;
    let roadInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      roadInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          let imageURL = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardRoadImages%2F" + this.selectedZone + "%2F" + data[lineNo]["image"] + "?alt=media";
          this.roadList.push({ lineNo: lineNo, roadType: data[lineNo]["roadType"], roadWidth: data[lineNo]["roadWidth"], latLng: data[lineNo]["latLng"], imageURL: imageURL });
        }
        $(this.divLoader).hide();
      }
      else {
        this.commonService.setAlertMessage("error", "No road information found !!!");
        $(this.divLoader).hide();
      }
    });
  }

  getWardRoadDetail(lineNo: any, index: any) {
    this.setActiveClass(index);
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
    let markerIcon = "../assets/img/red-home.png";
    this.imageURL = this.roadList[index]["imageURL"];
    let lat = this.roadList[index]["latLng"].split(',')[0];
    let lng = this.roadList[index]["latLng"].split(',')[1];
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerIcon,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(25, 25),
        origin: new google.maps.Point(0, 0),
      },
    });
    this.markerList.push({ marker: marker });

  }

  setActiveClass(index: any) {
    for (let i = 0; i < this.roadList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        if (className != "in-active") {
          $("#tr" + i).removeClass(className);
        }
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }
}
