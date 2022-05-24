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
  dustbinMarkerList: any[] = [];
  polylines: any[] = [];
  wardLineNoMarker: any[] = [];
  todayDate: any;

  invisibleImageUrl = "../assets/img/invisible-location.svg";
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
    this.todayDate = this.commonService.setTodayDate();
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefaultMap();
    this.setHeight();
    this.getZones();
    this.getDustbinWardMapping();
  }

  getDustbinWardMapping() {
    this.dustbinService.getDustbinWardMappingJson().then((mapData: any) => {
      let dustbinMapList = [];
      if (mapData != null) {
        let keyArray = Object.keys(mapData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let dustbin = keyArray[i];
            dustbinMapList.push({ dustbin: dustbin, zone: mapData[dustbin]["zone"], lineNo: mapData[dustbin]["lineNo"] });
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
    this.getAllLinesFromJson();
    this.showZoneDustbinMarker();
  }

  getAllLinesFromJson() {
    this.commonService.getWardLine(this.selectedZone, this.todayDate).then((linesData: any) => {
      let wardLinesDataObj = JSON.parse(linesData);
      let keyArray = Object.keys(wardLinesDataObj);
      for (let i = 0; i < keyArray.length - 3; i++) {
        let lineNo = Number(keyArray[i]);
        let points = wardLinesDataObj[lineNo]["points"];
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
          if (j == 0) {
            this.setLineNoMarker(lineNo, points[j][0], points[j][1]);
          }
        }
        this.plotLineOnMap(latLng, i);
      }
    }, error => {
    });
  }

  plotLineOnMap(latlng: any, index: any) {
    let line = new google.maps.Polyline({
      path: latlng,
      strokeColor: this.commonService.getLineColor(null),
      strokeWeight: 2,
    });
    this.polylines[index] = line;
    this.polylines[index].setMap(this.map);
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
        fontSize: "13px",
        fontWeight: "bold",
      },
    });
    this.wardLineNoMarker.push({ marker });
  }

  clearAll() {
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
    if (this.dustbinMarkerList.length > 0) {
      for (let i = 0; i < this.dustbinMarkerList.length; i++) {
        if (this.dustbinMarkerList[i]["marker"] != null) {
          this.dustbinMarkerList[i]["marker"].setMap(null);
        }
      }
    }
    if (this.wardBoundary != undefined) {
      this.wardBoundary[0]["line"].setMap(null);
    }
    this.selectedDustbinList = [];
    this.dustbinMarkerList = [];
    this.showUnMappedDustbin();
  }

  mapDustbinToWard() {
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
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
        let infoWindowText = "txtLine" + dustbinDetail.dustbin;
        let lineNo = $("#" + infoWindowText).val();
        dustbinDetail.lineNo = lineNo;
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
      if (this.dustbinList[i]["zone"] != "0" && this.dustbinList[i]["lineNo"]!="") {
        obj[this.dustbinList[i]["dustbin"]] = { zone: this.dustbinList[i]["zone"], lineNo: this.dustbinList[i]["lineNo"] };
      }
      else{
        this.dustbinList[i]["zone"] = "0";
        if (this.dustbinList[i]["type"] == "Rectangular") {
          this.dustbinList[i]["markerUrl"] = this.defaultRectangularDustbinUrl;
        }
        else {
          this.dustbinList[i]["markerUrl"] = this.defaultCircularDustbinUrl;
        }
      }
    }
    this.dustbinSummary.assignedDustbin = this.dustbinList.filter(item => item.zone != "0").length;
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

  getDustbinList(dustbinMapList: any) {
    this.allDustbinList = [];
    this.allDustbinList = JSON.parse(localStorage.getItem("dustbin"));
    for (let i = 0; i < this.allDustbinList.length; i++) {
      let markerUrl = this.defaultCircularDustbinUrl;
      if (this.allDustbinList[i]["type"] == "Rectangular") {
        markerUrl = this.defaultRectangularDustbinUrl;
      }
      let zone = "0";
      let lineNo = "";
      if (dustbinMapList.length > 0) {
        let dustbinWard = dustbinMapList.find(item => item.dustbin == this.allDustbinList[i]["dustbin"]);
        if (dustbinWard != undefined) {
          zone = dustbinWard.zone;
          lineNo = dustbinWard.lineNo;
          if (this.allDustbinList[i]["type"] == "Rectangular") {
            markerUrl = this.defaultRectangularPickedDustbinUrl;
          }
          else {
            markerUrl = this.defaultRectangularPickedDustbinUrl;
          }
        }
      }
      this.dustbinList.push({ dustbin: this.allDustbinList[i]["dustbin"], lat: this.allDustbinList[i]["lat"], lng: this.allDustbinList[i]["lng"], zone: zone, lineNo: lineNo, markerUrl: markerUrl, type: this.allDustbinList[i]["type"] });
    }
    this.dustbinSummary.totalDustbin = this.dustbinList.length;
    this.dustbinSummary.assignedDustbin = this.dustbinList.filter(item => item.zone != "0").length;
    this.showUnMappedDustbin();
  }

  showUnMappedDustbin() {
    if (this.dustbinList.length > 0) {
      for (let i = 0; i < this.dustbinList.length; i++) {
        if (this.dustbinList[i]["zone"] == "0") {
          this.setDustbinMarker(this.dustbinList[i]["dustbin"], this.dustbinList[i]["lineNo"], this.dustbinList[i]["lat"], this.dustbinList[i]["lng"], this.dustbinList[i]["markerUrl"], this.dustbinList[i]["type"]);
        }
      }
    }
  }

  showZoneDustbinMarker() {
    if (this.dustbinList.length > 0) {
      for (let i = 0; i < this.dustbinList.length; i++) {
        if (this.dustbinList[i]["zone"] == this.selectedZone) {
          this.selectedDustbinList.push({ dustbin: this.dustbinList[i]["dustbin"] });
          this.setDustbinMarker(this.dustbinList[i]["dustbin"], this.dustbinList[i]["lineNo"], this.dustbinList[i]["lat"], this.dustbinList[i]["lng"], this.dustbinList[i]["markerUrl"], this.dustbinList[i]["type"]);
        }
      }
    }
  }

  setDustbinMarker(dustbin: any, lineNo: any, lat: any, lng: any, markerUrl: any, type: any) {
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
    let statusString = '<input id="txtLine' + dustbin + '" type="text" style="width:30px; height:30px; font-weight:bold; border:none; text-align:center; background-color: #f6404d; color:#fff;position:absolute,z-index:999" value="' + lineNo + '"/>';
    var infowindow = new google.maps.InfoWindow({
      content: statusString,
    });
    if (lineNo != "") {
      infowindow.open(this.map, marker);
      setTimeout(function () {
        $('.gm-ui-hover-effect').css("display", "none");
        $('.gm-style-iw-c').css("border-radius", "3px").css("padding", "0px").css("z-index","99").css("margin-top","6px");
        $('.gm-style-iw-d').css("overflow", "unset");
      }, 300);
    }

    marker.addListener("click", (e) => {
      if (this.selectedZone == "0") {
        this.commonService.setAlertMessage("error", "Please select zone !!!");
        return;
      }

      infowindow.open(this.map, marker);
      setTimeout(function () {
        $('.gm-ui-hover-effect').css("display", "none");
        $('.gm-style-iw-c').css("border-radius", "3px").css("padding", "0px");
        $('.gm-style-iw-d').css("overflow", "unset");
      }, 300);
      let dustbinDetail = this.selectedDustbinList.find((item) => item.dustbin == dustbin);
      if (dustbinDetail == undefined) {
        this.selectedDustbinList.push({ dustbin: dustbin });
        isSelected = true;
      } else {
        this.selectedDustbinList = this.selectedDustbinList.filter((item) => item.dustbin !== dustbin);
        isSelected = false;
        infowindow.close();
        let detail=this.dustbinList.find(item=>item.dustbin==dustbin);
        if(detail!=undefined){
          detail.lineNo="";
        }
      }
      this.setMarkerAsSelected(marker, isSelected, type, infowindow);
    });
    this.dustbinMarkerList.push({ marker });
  }

  setMarkerAsSelected(marker: any, isSelected: boolean, type: any, infowindow: any) {
    if (isSelected) {
      if (type == "Rectangular") {
        marker.icon.url = this.defaultRectangularPickedDustbinUrl;
      }
      else {
        marker.icon.url = this.defaultCircularPickedDustbinUrl;
      }

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
