import { Component, ViewChild } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
//services
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-house-marking",
  templateUrl: "./house-marking.component.html",
  styleUrls: ["./house-marking.component.scss"],
})
export class HouseMarkingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(
    public db: AngularFireDatabase,
    public af: AngularFireModule,
    public httpService: HttpClient,
    private actRoute: ActivatedRoute,
    private mapService: MapService,
    private commonService: CommonService
  ) {}

  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  polylines = [];
  toDayDate: any;
  currentLat: any;
  currentLng: any;
  lineDrawnDetails: any[];
  currentMonthName: any;
  currentYear: any;
  wardStartUrl = "../assets/img/go-image.png";
  wardEndUrl = "../assets/img/end-image.png";
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  lines: any[] = [];
  lastLineInstance: any;
  wardLines: any;
  zoneKML: any;
  allMatkers: any[] = [];
  markerData: markerDetail = {
    totalMarkers: 0,
  };

  ngOnInit() {
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );
    this.toDayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.toDayDate).getMonth()
    );
    this.setHeight();
    this.getZones();
    this.selectedZone = this.zoneList[1]["zoneNo"];
    this.activeZone = this.zoneList[1]["zoneNo"];
    this.setMaps();
    this.setKml();
    this.onSubmit();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getAllZones();
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

  setKml() {
    this.db
      .object("Defaults/KmlBoundary/" + this.selectedZone)
      .valueChanges()
      .subscribe((wardPath) => {
        this.zoneKML = new google.maps.KmlLayer({
          url: wardPath.toString(),
          map: this.map,
        });
      });
  }

  changeZoneSelection(filterVal: any) {
    this.markerData.totalMarkers = 0;
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.clearAllOnMap();
    this.activeZone = filterVal;
    this.setKml();
    this.onSubmit();
  }

  onSubmit() {
    this.selectedZone = this.activeZone;
    this.polylines = [];
    this.getAllLinesFromJson();
  }

  clearAllOnMap() {
    if (this.allMatkers.length > 0) {
      for (let i = 0; i < this.allMatkers.length; i++) {
        this.allMatkers[i]["marker"].setMap(null);
      }
      this.allMatkers = [];
    }
    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
  }

  getAllLinesFromJson() {
    this.lines = [];
    this.polylines = [];
    let wardLineCount = this.db
      .object("WardLines/" + this.selectedZone + "")
      .valueChanges()
      .subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          this.wardLines = Number(lineCount);
          for (let i = 1; i < Number(lineCount); i++) {
            let wardLines = this.db
              .list(
                "Defaults/WardLines/" + this.selectedZone + "/" + i + "/points"
              )
              .valueChanges()
              .subscribe((zoneData) => {
                wardLines.unsubscribe();
                if (zoneData.length > 0) {
                  let lineData = zoneData;
                  var latLng = [];
                  for (let j = 0; j < lineData.length; j++) {
                    latLng.push({ lat: lineData[j][0], lng: lineData[j][1] });
                  }
                  this.lines.push({
                    lineNo: i,
                    latlng: latLng,
                    color: "#87CEFA",
                  });
                  this.plotLineOnMap(i, latLng, i - 1, this.selectedZone);
                  this.getMarkedHouses(i);
                }
              });
          }
        }
      });
    setTimeout(() => {
      if (this.lines.length > 0) {
        let latLngArray = [];
        latLngArray = this.lines[0]["latlng"];
        let lat = latLngArray[0]["lat"];
        let lng = latLngArray[0]["lng"];
        this.setMarker(lat, lng, this.wardStartUrl, null, "Ward Start", "ward");
        latLngArray = this.lines[this.lines.length - 1]["latlng"];
        lat = latLngArray[latLngArray.length - 1]["lat"];
        lng = latLngArray[latLngArray.length - 1]["lng"];
        this.setMarker(lat, lng, this.wardEndUrl, null, "Ward End", "ward");
      }
    }, 1000);
  }

  getMarkedHouses(lineNo: any) {
    let dbPath =
      "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
        houseInstance.unsubscribe();
        if (data.length > 0) {
          this.markerData.totalMarkers =
            Number(this.markerData.totalMarkers) + Number(data.length - 1);
          for (let i = 0; i < data.length - 1; i++) {
            if (data[i]["latLng"] != undefined) {
              let lat = data[i]["latLng"].split(",")[0];
              let lng = data[i]["latLng"].split(",")[1];
              let type = data[i]["houseType"];
              let markerURL = this.getMarkerIcon(type);
              this.setMarker(lat, lng, markerURL, null, "", "marker");
            }
          }
        }
      });
  }

  getMarkerIcon(type: any) {
    let url = "../assets/img/final-marker-2.svg";
    if (type == 1 || type == 16) {
      url = "../assets/img/house.svg";
    } else if (type == 2 || type == 17) {
      url = "../assets/img/shop.svg";
    } else if (type == 11 || type == 12) {
      url = "../assets/img/warehouse.svg";
    } else if (type == 8) {
      url = "../assets/img/institutes.svg";
    } else if (type == 5 || type == 6 || type == 7 || type == 3 || type == 4) {
      url = "../assets/img/hotel.svg";
    } else if (type == 13 || type == 14) {
      url = "../assets/img/wedding.svg";
    } else if (type == 15 || type == 16) {
      url = "../assets/img/thela.svg";
    } else if (type == 9 || type == 10) {
      url = "../assets/img/hospital.svg";
    }
    return url;
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    let dbPathLineStatus =
      "WasteCollectionInfo/" +
      wardNo +
      "/" +
      this.currentYear +
      "/" +
      this.currentMonthName +
      "/" +
      this.toDayDate +
      "/LineStatus/" +
      lineNo +
      "/Status";
    let lineStatus = this.db
      .object(dbPathLineStatus)
      .valueChanges()
      .subscribe((status) => {
        if (wardNo == this.selectedZone) {
          if (this.polylines[index] != undefined) {
            this.polylines[index].setMap(null);
          }
          let line = new google.maps.Polyline({
            path: latlng,
            strokeColor: this.commonService.getLineColor(status),
            strokeWeight: 2,
          });
          this.polylines[index] = line;
          this.polylines[index].setMap(this.map);

          let userType = localStorage.getItem("userType");
          if (userType == "Internal User") {
            let lat = latlng[0]["lat"];
            let lng = latlng[0]["lng"];
            this.setMarker(
              lat,
              lng,
              this.invisibleImageUrl,
              lineNo.toString(),
              "",
              "lineNo"
            );
          }
        }
      });
  }

  setMarker(
    lat: any,
    lng: any,
    markerURL: any,
    markerLabel: any,
    contentString: any,
    type: any
  ) {
    if (type == "lineNo") {
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
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

      this.allMatkers.push({ marker });
    } else {
      let marker = new google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: this.map,
        icon: {
          url: markerURL,
          fillOpacity: 1,
          strokeWeight: 0,
          scaledSize: new google.maps.Size(30, 40),
          origin: new google.maps.Point(0, 0),
        },
      });

      this.allMatkers.push({ marker });
    }
  }
}
export class markerDetail {
  totalMarkers: number;
}
