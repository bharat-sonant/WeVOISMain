import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { DustbinService } from "../../services/dustbin/dustbin.service";

@Component({
  selector: 'app-dustbin-ward-mapping',
  templateUrl: './dustbin-ward-mapping.component.html',
  styleUrls: ['./dustbin-ward-mapping.component.scss']
})
export class DustbinWardMappingComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private commonService: CommonService, private dustbinService: DustbinService) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  allDustbinList: any[];
  dustbinList: any[] = [];
  selectedDustbinList: any[] = [];
  cityName: any;
  wardBoundary: any;
  zoneDustbinMarkerList: any[] = [];

  defaultCircularDustbinUrl = "../assets/img/dustbin-circular-grey.png";
  defaultRectangularDustbinUrl = "../assets/img/dark gray without tick rectangle.png";
  defaultRectangularPickedDustbinUrl = "../assets/img/Green-Rectangle-dustbin.png";
  defaultCircularPickedDustbinUrl = "../assets/img/dustbin-circular-green.png";

  dustbinSummary: dustbinSummary = {
    totalDustbin: 0,
    assignedDustbin: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefaultMap();
    this.setHeight();
    this.getZones();
    this.getDustbinWardMapping();
  }

  getDustbinWardMapping() {
    this.dustbinService.getDustbinWardMappingJson().then((mapData: any) => {
      let dustbinMapList=[];
      if (mapData != null) {
        let keyArray = Object.keys(mapData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let dustbin = keyArray[i];
            dustbinMapList.push({ dustbin: dustbin, zone: mapData[dustbin]["zone"] });
          }
        }
      }
      this.getDustbinList(dustbinMapList);
    });
  }

  changeZoneSelection(zone: any) {
    this.selectedZone = zone;
    this.clearAll();
    this.setWardBoundary();
    this.showZoneDustbinMarker();
  }

  clearAll() {
    if (this.zoneDustbinMarkerList.length > 0) {
      for (let i = 0; i < this.zoneDustbinMarkerList.length; i++) {
        if (this.zoneDustbinMarkerList[i]["marker"] != null) {
          this.zoneDustbinMarkerList[i]["marker"].setMap(null);
        }
      }
    }
    this.selectedDustbinList = [];
    this.zoneDustbinMarkerList = [];
    this.showUnMappedDustbin();
  }

  mapDustbinToWard() {
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    if (this.selectedDustbinList.length == 0) {
      this.commonService.setAlertMessage("error", "Please select at least one dustbin !!!");
      return;
    }

    for (let i = 0; i < this.dustbinList.length; i++) {
      if (this.dustbinList[i]["zone"] == this.selectedZone) {
        this.dustbinList[i]["zone"] = "0";
        if (this.dustbinList[i]["type"] == "Rectangular") {
          this.dustbinList[i]["markerUrl"] = this.defaultRectangularDustbinUrl;
        }
        else {
          this.dustbinList[i]["markerUrl"] = this.defaultCircularDustbinUrl;
        }
      }
    }
    this.updateDustbinWardMappingJson();
  }

  updateDustbinWardMappingJson() {
    for (let i = 0; i < this.selectedDustbinList.length; i++) {
      let dustbinDetail = this.dustbinList.find(item => item.dustbin == this.selectedDustbinList[i]["dustbin"]);
      if (dustbinDetail != undefined) {
        dustbinDetail.zone = this.selectedZone;
        if (dustbinDetail.type == "Rectangular") {
          dustbinDetail.markerUrl = this.defaultRectangularPickedDustbinUrl;
        }
        else {
          dustbinDetail.markerUrl = this.defaultCircularPickedDustbinUrl;
        }
      }
    }
    const obj = {};
    for (let i = 0; i < this.dustbinList.length; i++) {
      if (this.dustbinList[i]["zone"] != "0") {
        obj[this.dustbinList[i]["dustbin"]] = { zone: this.dustbinList[i]["zone"] };
      }
    }
    this.getAssignedDustbinCount();
    this.commonService.saveJsonFile(obj, "mappingDustbinWard.json", "/DustbinData/");
    this.commonService.setAlertMessage("success", "Dustbin mapped with ward successfully !!!");
  }

  setWardBoundary() {
    this.commonService.getWardBoundary(this.selectedZone, this.wardBoundary, 4).then((boundaryData: any) => {
      if (this.wardBoundary != undefined) {
        this.wardBoundary[0]["line"].setMap(null);
      }
      this.wardBoundary = boundaryData;
      this.wardBoundary[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.wardBoundary[0]["latLng"].length; i = (i + 5)) {
        bounds.extend({ lat: Number(this.wardBoundary[0]["latLng"][i]["lat"]), lng: Number(this.wardBoundary[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
    });
  }

  getDustbinList(dustbinMapList:any) {
    this.allDustbinList = [];
    this.allDustbinList = JSON.parse(localStorage.getItem("dustbin"));
    for (let i = 0; i < this.allDustbinList.length; i++) {
      let markerUrl = this.defaultCircularDustbinUrl;
      if (this.allDustbinList[i]["type"] == "Rectangular") {
        markerUrl = this.defaultRectangularDustbinUrl;
      }
      let zone = "0";
      if (dustbinMapList.length > 0) {
        let dustbinWard = dustbinMapList.find(item => item.dustbin == this.allDustbinList[i]["dustbin"]);
        if (dustbinWard != undefined) {
          zone = dustbinWard.zone;
          if (this.allDustbinList[i]["type"] == "Rectangular") {
            markerUrl = this.defaultRectangularPickedDustbinUrl;
          }
          else {
            markerUrl = this.defaultRectangularPickedDustbinUrl;
          }
        }
      }
      this.dustbinList.push({ dustbin: this.allDustbinList[i]["dustbin"], lat: this.allDustbinList[i]["lat"], lng: this.allDustbinList[i]["lng"], zone: zone, markerUrl: markerUrl, type: this.allDustbinList[i]["type"] });
    }
    this.dustbinSummary.totalDustbin=this.dustbinList.length;
    this.getAssignedDustbinCount();
    this.showUnMappedDustbin();
  }

  getAssignedDustbinCount(){    
    let list=this.dustbinList.filter(item=>item.zone!="0");
    this.dustbinSummary.assignedDustbin=list.length;
  }

  showUnMappedDustbin() {
    if (this.dustbinList.length > 0) {
      for (let i = 0; i < this.dustbinList.length; i++) {
        if (this.dustbinList[i]["zone"] == "0") {
          this.setDustbinMarker(this.dustbinList[i]["dustbin"], this.dustbinList[i]["lat"], this.dustbinList[i]["lng"], this.dustbinList[i]["markerUrl"], this.dustbinList[i]["type"], "unMapped");
        }
      }
    }
  }

  showZoneDustbinMarker() {
    if (this.dustbinList.length > 0) {
      for (let i = 0; i < this.dustbinList.length; i++) {
        if (this.dustbinList[i]["zone"] == this.selectedZone) {
          this.selectedDustbinList.push({ dustbin: this.dustbinList[i]["dustbin"] });
          this.setDustbinMarker(this.dustbinList[i]["dustbin"], this.dustbinList[i]["lat"], this.dustbinList[i]["lng"], this.dustbinList[i]["markerUrl"], this.dustbinList[i]["type"], "zone");
        }
      }
    }
  }

  setDustbinMarker(dustbin: any, lat: any, lng: any, markerUrl: any, type: any, markerType: any) {
    let isSelected = false;
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(25, 31),
        labelOrigin: new google.maps.Point(15, 25)
      }
    });

    marker.addListener("click", (e) => {
      if (this.selectedZone == "0") {
        this.commonService.setAlertMessage("error", "Please select zone !!!");
        return;
      }
      let dustbinDetail = this.selectedDustbinList.find((item) => item.dustbin == dustbin);
      if (dustbinDetail == undefined) {
        this.selectedDustbinList.push({ dustbin: dustbin });
        isSelected = true;
      } else {
        this.selectedDustbinList = this.selectedDustbinList.filter((item) => item.dustbin !== dustbin);
        isSelected = false;
      }
      this.setMarkerAsSelected(marker, isSelected, type);
    });
    this.zoneDustbinMarkerList.push({ marker });
  }

  setMarkerAsSelected(marker: any, isSelected: boolean, type: any) {
    if (isSelected) {
      if (type == "Rectangular") {
        marker.icon.url = this.defaultRectangularPickedDustbinUrl;
      }
      else {
        marker.icon.url = this.defaultCircularPickedDustbinUrl;
      }
      this.zoneDustbinMarkerList.push({ marker });
    } else {
      if (type == "Rectangular") {
        marker.icon.url = this.defaultRectangularDustbinUrl;
      }
      else {
        marker.icon.url = this.defaultCircularDustbinUrl;
      }
    }
    marker.setMap(null);
    marker.setMap(this.map);
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["zoneName"] = "--Select Zone--";
    this.selectedZone = "0";
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  setDefaultMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.setOptions({ zoomControl: false });
  }
} 
export class dustbinSummary {
  totalDustbin: number;
  assignedDustbin: number;
}
