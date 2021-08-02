/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-map-card-review",
  templateUrl: "./map-card-review.component.html",
  styleUrls: ["./map-card-review.component.scss"],
})
export class MapCardReviewComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(
    public fs: FirebaseService,
    public af: AngularFireModule,
    public httpService: HttpClient,
    private actRoute: ActivatedRoute,
    private mapService: MapService,
    private commonService: CommonService
  ) {}
db:any;
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
  vehicleLocationInstance: any;
  vehicleStatusInstance: any;
  completedLinesInstance: any;
  currentLat: any;
  currentLng: any;
  vehicleStatusId: any;
  lineDrawnDetails: any[];
  currentMonthName: any;
  currentYear: any;
  houseMarkerList: any[] = [];
  houseList: any[] = [];
  employeeDetail: any[] = [];
  defaultImageUrl = "../../assets/img/internal-user.png";
  parshadImageUrl = "../assets/img/sweet-home.png";
  approvedHomeLocationURL = "../assets/img/location-home2.png";
  wardStartUrl = "../assets/img/go-image.png";
  wardEndUrl = "../assets/img/end-image.png";
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  lines: any[] = [];
  lastLineInstance: any;
  workerDetails: any;
  wardLines: any;
  zoneKML: any;
  parhadhouseMarker: any;
  allMatkers: any[] = [];

  progressData: progressDetail = {
    totalLines: 0,
    completedLines: 0,
    skippedLines: 0,
    pendingLines: 0,
    currentLine: 0,
    wardLength: "0",
    coveredLength: "0",
    driverName: "",
    driverMobile: "",
    driverImageUrl: this.defaultImageUrl,
    helperName: "",
    helperMobile: "",
    helperImageUrl: this.defaultImageUrl,
    houses: 0,
    scanedHouses: 0,
    parshadName: "",
    parshadMobile: "",
  };

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
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
    this.zoneList = [];
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
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.clearAllOnMap();
    this.activeZone = filterVal;
    // this.setMaps();
    this.setKml();
    this.progressData.houses = 0;
    this.progressData.scanedHouses = 0;
    this.onSubmit();
  }

  onSubmit() {
    this.selectedZone = this.activeZone;
    this.polylines = [];
    this.houseMarkerList = [];
    this.houseList = [];
    this.getAllLinesFromJson();
    setTimeout(() => {
      this.getHouses();
    }, 2000);
  }

  clearAllOnMap() {
    if (this.allMatkers.length > 0) {
      for (let i = 0; i < this.allMatkers.length; i++) {
        this.allMatkers[i]["marker"].setMap(null);
      }
      this.allMatkers = [];
    }
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        this.houseMarkerList[i]["marker"].setMap(null);
      }
      this.houseMarkerList = [];
    }
    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
    }
    if (this.parhadhouseMarker != null) {
      this.parhadhouseMarker.setMap(null);
    }
    if (this.marker != null) {
      this.marker.setMap(null);
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
    }, 2000);
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
          // let checkMarkerDetails = status != null ? true : false;

          // if (status != null || Number(lastLine) == (lineNo - 1)) {
          //   checkMarkerDetails = true;
          //  }

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
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(32, 40),
        origin: new google.maps.Point(0, 0),
      },
      label: {
        text: markerLabel,
        color: "#000",
        fontSize: "10px",
        fontWeight: "bold",
      },
    });
    if (type == "ward") {
      let infowindow = new google.maps.InfoWindow({
        content: contentString,
      });
      marker.addListener("click", function () {
        infowindow.open(this.map, marker);
      });
    }
    this.allMatkers.push({ marker });
  }

  getHouses() {
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        this.houseMarkerList[i]["marker"].setMap(null);
      }
      this.houseMarkerList = [];
    }
    this.houseList = [];
    this.progressData.houses = 0;
    this.progressData.scanedHouses = 0;
    for (let i = 1; i <= this.wardLines; i++) {
      let housePath = "Houses/" + this.selectedZone + "/" + i;
      let houseInstance = this.db
        .list(housePath)
        .valueChanges()
        .subscribe((houseData) => {
          houseInstance.unsubscribe();
          if (houseData.length > 0) {
            for (let j = 0; j < houseData.length; j++) {
              let lat = houseData[j]["latLng"]
                .replace("(", "")
                .replace(")", "")
                .split(",")[0];
              let lng = houseData[j]["latLng"]
                .replace("(", "")
                .replace(")", "")
                .split(",")[1];
              let cardNo = houseData[j]["cardNo"];
              let rfId = houseData[j]["rfid"];
              let isApproved = "no";
              if (houseData[j]["isApproved"] != null) {
                if (houseData[j]["isApproved"] == "yes") {
                  isApproved = "yes";
                }
              }
              let markerType = "red";
              if (houseData[j]["phaseNo"] == "1") {
                markerType = "blue";
                if (isApproved == "yes") {
                  markerType = "purple";
                }
              } else {
                if (isApproved == "yes") {
                  markerType = "yellow";
                }
              }

              this.houseList.push({
                markerType: markerType,
                lat: lat,
                lng: lng,
                cardNo: cardNo,
                isApproved: isApproved,
              });
              this.progressData.houses = Number(this.progressData.houses) + 1;
              let houseDetails = this.houseList.find(
                (item) => item.cardNo == cardNo
              );

              if (houseDetails != undefined) {
                this.plotHouses(
                  houseDetails.markerType,
                  houseDetails.lat,
                  houseDetails.lng,
                  isApproved
                );
              }
/*
              let scanCardPath =
                "HousesCollectionInfo/" +
                this.selectedZone +
                "/" +
                this.toDayDate +
                "/" +
                i +
                "/" +
                rfId +
                "/scan-time";
              let scanInfo = this.db
                .object(scanCardPath)
                .valueChanges()
                .subscribe((scanTime) => {
                  scanInfo.unsubscribe();
                  if (scanTime != null) {
                    this.progressData.scanedHouses =
                      Number(this.progressData.scanedHouses) + 1;
                    let houseDetails = this.houseList.find(
                      (item) => item.cardNo == cardNo
                    );
                    if (houseDetails != undefined) {
                      houseDetails.markerType = "green";
                      this.plotHouses(
                        houseDetails.markerType,
                        houseDetails.lat,
                        houseDetails.lng,
                        isApproved
                      );
                    }
                  } else {
                    let houseDetails = this.houseList.find(
                      (item) => item.cardNo == cardNo
                    );

                    if (houseDetails != undefined) {
                      this.plotHouses(
                        houseDetails.markerType,
                        houseDetails.lat,
                        houseDetails.lng,
                        isApproved
                      );
                    }
                  }
                });

                */
            }
          }
        });
    }
  }

  plotHouses(markerType: string, lat: any, lng: any, isApproved: any) {
    let imgUrl = "../assets/img/" + markerType + "-home.png";
    // if (isApproved == "yes") {
    //   imgUrl = this.approvedHomeLocationURL;
    //  }
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: imgUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(16, 15),
      },
    });
    this.houseMarkerList.push({ marker });
  }
}
export class progressDetail {
  totalLines: number;
  completedLines: number;
  skippedLines: number;
  pendingLines: number;
  currentLine: number;
  wardLength: string;
  coveredLength: string;
  driverName: string;
  driverMobile: string;
  driverImageUrl: string;
  helperName: string;
  helperMobile: string;
  helperImageUrl: string;
  houses: number;
  scanedHouses: number;
  parshadName: string;
  parshadMobile: string;
}
