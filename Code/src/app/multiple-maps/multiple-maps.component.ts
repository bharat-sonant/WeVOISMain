import { Component, ViewChild } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import * as $ from "jquery";
import { ToastrService } from "ngx-toastr";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: "app-multiple-maps",
  templateUrl: "./multiple-maps.component.html",
  styleUrls: ["./multiple-maps.component.scss"],
})
export class MultipleMapsComponent {
  @ViewChild("gmapWard1", null) gmapWard1: any;
  @ViewChild("gmapWard2", null) gmapWard2: any;
  @ViewChild("gmapWard3", null) gmapWard3: any;
  @ViewChild("gmapWard4", null) gmapWard4: any;
  @ViewChild("gmapMarketRoute1", null) gmapMarketRoute1: any;
  @ViewChild("gmapMarketRoute2", null) gmapMarketRoute2: any;
  public mapWard1: google.maps.Map;
  public mapWard2: google.maps.Map;
  public mapWard3: google.maps.Map;
  public mapWard4: google.maps.Map;
  public mapMarketRoute1: google.maps.Map;
  public mapMarketRoute2: google.maps.Map;

  screenRefreshTime: any;

  vehicleLocationInstance: any;
  vehicleLocationInstance1: any;
  vehicleLocationInstance2: any;
  vehicleLocationInstance3: any;
  vehicleLocationInstance4: any;
  vehicleLocationInstance5: any;

  vehicleStatusInstance: any;
  vehicleStatusInstance1: any;
  vehicleStatusInstance2: any;
  vehicleStatusInstance3: any;
  vehicleStatusInstance4: any;
  vehicleStatusInstance5: any;

  completedLinesInstance: any;
  completedLinesInstance1: any;
  completedLinesInstance2: any;
  completedLinesInstance3: any;
  completedLinesInstance4: any;
  completedLinesInstance5: any;

  polylinesWard1 = [];
  allLinesWard1: any[];
  polylinesWard2 = [];
  allLinesWard2: any[];
  polylinesWard3 = [];
  allLinesWard3: any[];
  polylinesWard4 = [];
  allLinesWard4: any[];
  polylinesMarketRoute1 = [];
  allLinesMarketRoute1: any[];
  polylinesMarketRoute2 = [];
  allLinesMarketRoute2: any[];
  toDayDate: any;
  lineDrawnDetails: any[];
  prevNowPlaying: any;
  currentMonthName: any;
  currentYear: any;
  cityName: any;
  instancesList:any[];
  markerWard1 = new google.maps.Marker();
  markerWard2 = new google.maps.Marker();
  markerWard3 = new google.maps.Marker();
  markerWard4 = new google.maps.Marker();
  markerMarketRoute1 = new google.maps.Marker();
  markerMarketRoute2 = new google.maps.Marker();
  db: any;
  constructor(public fs: FirebaseService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }

  ngOnInit() {
    this.instancesList=[];
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    let element = <HTMLAnchorElement>document.getElementById("homeLink");
    element.href = "/" + this.cityName + "/home";
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");

    this.toDayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.toDayDate).getMonth()
    );

    //this.commonService.hideLeftMenu();
    // Init Maps
    let mapProperties = this.commonService.initMapProperties();
    this.mapWard1 = new google.maps.Map(
      this.gmapWard1.nativeElement,
      mapProperties
    );
    this.mapWard2 = new google.maps.Map(
      this.gmapWard2.nativeElement,
      mapProperties
    );
    this.mapWard3 = new google.maps.Map(
      this.gmapWard3.nativeElement,
      mapProperties
    );
    this.mapWard4 = new google.maps.Map(
      this.gmapWard4.nativeElement,
      mapProperties
    );
    this.mapMarketRoute1 = new google.maps.Map(
      this.gmapMarketRoute1.nativeElement,
      mapProperties
    );
    this.mapMarketRoute2 = new google.maps.Map(
      this.gmapMarketRoute2.nativeElement,
      mapProperties
    );

    // init Mp Boundries
    this.setWardBoundary("1", this.mapWard1);
    this.setWardBoundary("2", this.mapWard2);
    this.setWardBoundary("3", this.mapWard3);
    this.setWardBoundary("4", this.mapWard4);
    this.setWardBoundary("MarketRoute1", this.mapMarketRoute1);
    this.setWardBoundary("MarketRoute2", this.mapMarketRoute2);

    // show Vehicle on Map
    this.showVehicleMovement("1", this.vehicleStatusInstance, this.vehicleLocationInstance);
    this.showVehicleMovement("2", this.vehicleStatusInstance1, this.vehicleLocationInstance1);
    this.showVehicleMovement("3", this.vehicleStatusInstance2, this.vehicleLocationInstance2);
    this.showVehicleMovement("4", this.vehicleStatusInstance3, this.vehicleLocationInstance3);
    this.showVehicleMovement("MarketRoute1", this.vehicleStatusInstance4, this.vehicleLocationInstance4);
    this.showVehicleMovement("MarketRoute2", this.vehicleStatusInstance5, this.vehicleLocationInstance5);

    // Show Lines on Map
    this.getAllLinesFromJson("1");
    this.getAllLinesFromJson("2");
    this.getAllLinesFromJson("3");
    this.getAllLinesFromJson("4");
    this.getAllLinesFromJson("MarketRoute1");
    this.getAllLinesFromJson("MarketRoute2");

    let screenRefresh = this.db.object("Settings/portal-multiple-map-screen-refresh-time").valueChanges().subscribe((timeId) => {
      screenRefresh.unsubscribe();
      this.screenRefreshTime = timeId;
      this.prevNowPlaying = localStorage.getItem("multipleMap");
      if (this.prevNowPlaying) {
        clearInterval(this.prevNowPlaying);
      }
      this.prevNowPlaying = setInterval(() => {
        $("#divWait").show();
        setTimeout(() => {
          $("#divWait").hide();
        }, 3000);
        // Init Maps
        let mapProperties = this.commonService.initMapProperties();
        this.mapWard1 = new google.maps.Map(
          this.gmapWard1.nativeElement,
          mapProperties
        );
        this.mapWard2 = new google.maps.Map(
          this.gmapWard2.nativeElement,
          mapProperties
        );
        this.mapWard3 = new google.maps.Map(
          this.gmapWard3.nativeElement,
          mapProperties
        );
        this.mapWard4 = new google.maps.Map(
          this.gmapWard4.nativeElement,
          mapProperties
        );
        this.mapMarketRoute1 = new google.maps.Map(
          this.gmapMarketRoute1.nativeElement,
          mapProperties
        );
        this.mapMarketRoute2 = new google.maps.Map(
          this.gmapMarketRoute2.nativeElement,
          mapProperties
        );

        // init Mp Boundries




        this.setWardBoundary("1", this.mapWard1);
        this.setWardBoundary("2", this.mapWard2);
        this.setWardBoundary("3", this.mapWard3);
        this.setWardBoundary("4", this.mapWard4);
        this.setWardBoundary("MarketRoute1", this.mapMarketRoute1);
        this.setWardBoundary("MarketRoute2", this.mapMarketRoute2);
        // show Vehicle on Map

        this.showVehicleMovement("1", this.vehicleStatusInstance, this.vehicleLocationInstance);
        this.showVehicleMovement("2", this.vehicleStatusInstance1, this.vehicleLocationInstance1);
        this.showVehicleMovement("3", this.vehicleStatusInstance2, this.vehicleLocationInstance2);
        this.showVehicleMovement("4", this.vehicleStatusInstance3, this.vehicleLocationInstance3);
        this.showVehicleMovement("MarketRoute1", this.vehicleStatusInstance4, this.vehicleLocationInstance4);
        this.showVehicleMovement("MarketRoute2", this.vehicleStatusInstance5, this.vehicleLocationInstance5);
        // Show Lines on Map

        this.getAllLinesFromJson("1");
        this.getAllLinesFromJson("2");
        this.getAllLinesFromJson("3");
        this.getAllLinesFromJson("4");
        this.getAllLinesFromJson("MarketRoute1");
        this.getAllLinesFromJson("MarketRoute2");
      }, this.screenRefreshTime);

      localStorage.setItem("multipleMap", this.prevNowPlaying);
    });
  }

  setWardBoundary(selectedZone: any, map: any) {
    this.commonService.setKML(selectedZone, null).then((data: any) => {
      let zoneKML = data;
      zoneKML[0]["line"].setMap(map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(zoneKML[0]["latLng"][i]["lat"]), lng: Number(zoneKML[0]["latLng"][i]["lng"]) });
      }
      map.fitBounds(bounds);
    });  
  }

  showVehicleMovement(selectedZone: any, vehicleStatusInstance: any, vehicleLocationInstance: any) {
    if (vehicleStatusInstance != undefined) {
      vehicleStatusInstance.unsubscribe();
    }

    vehicleStatusInstance = this.db.object("CurrentLocationInfo/" + selectedZone + "/StatusId").valueChanges().subscribe((statusId) => {
      this.instancesList.push({ instances: vehicleStatusInstance }); 
      if (statusId != undefined) {
        if (vehicleLocationInstance != undefined) {
          vehicleLocationInstance.unsubscribe();
        }

        vehicleLocationInstance = this.db.object("CurrentLocationInfo/" + selectedZone + "/CurrentLoc/location").valueChanges().subscribe((data) => {
          this.instancesList.push({ instances: vehicleStatusInstance }); 
          if (data != undefined) {
            let vehicleIcon = "../assets/img/tipper-green.png";
            if (statusId == "3") {
              vehicleIcon = "../assets/img/tipper-gray.png";
            } else if (statusId == "2") {
              vehicleIcon = "../assets/img/tipper-red.png";
            }

            let location = data.toString().split(":")[1].replace("(", "").replace(")", "").replace(" ", "").split(",");
            if (selectedZone == "1") {
              this.markerWard1.setMap(null);
              this.markerWard1 = new google.maps.Marker({
                position: {
                  lat: Number(location[0]),
                  lng: Number(location[1]),
                },
                map: this.mapWard1,
                icon: vehicleIcon,
              });
            }
            if (selectedZone == "2") {
              this.markerWard2.setMap(null);
              this.markerWard2 = new google.maps.Marker({
                position: {
                  lat: Number(location[0]),
                  lng: Number(location[1]),
                },
                map: this.mapWard2,
                icon: vehicleIcon,
              });
            }
            if (selectedZone == "3") {
              this.markerWard3.setMap(null);
              this.markerWard3 = new google.maps.Marker({
                position: {
                  lat: Number(location[0]),
                  lng: Number(location[1]),
                },
                map: this.mapWard3,
                icon: vehicleIcon,
              });
            }
            if (selectedZone == "4") {
              this.markerWard4.setMap(null);
              this.markerWard4 = new google.maps.Marker({
                position: {
                  lat: Number(location[0]),
                  lng: Number(location[1]),
                },
                map: this.mapWard4,
                icon: vehicleIcon,
              });
            }
            if (selectedZone == "MarketRoute1") {
              this.markerMarketRoute1.setMap(null);
              this.markerMarketRoute1 = new google.maps.Marker({
                position: {
                  lat: Number(location[0]),
                  lng: Number(location[1]),
                },
                map: this.mapMarketRoute1,
                icon: vehicleIcon,
              });
            }
            if (selectedZone == "MarketRoute2") {
              this.markerMarketRoute2.setMap(null);
              this.markerMarketRoute2 = new google.maps.Marker({
                position: {
                  lat: Number(location[0]),
                  lng: Number(location[1]),
                },
                map: this.mapMarketRoute2,
                icon: vehicleIcon,
              });
            }
          }
        });
      }
    });
  }

  getAllLinesFromJson(selectedZone: any) {
    this.commonService.getWardLine(selectedZone, this.toDayDate).then((data: any) => {      
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      let linePath = [];
      for (let i = 0; i < keyArray.length - 1; i++) {
        let lineNo = Number(keyArray[i]);
        let points = wardLines[lineNo]["points"];
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
        }
        linePath.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA" });
      }
      if (selectedZone == "1") {
        this.allLinesWard1 = linePath;
        this.plotLinesOnMap(selectedZone);
      }
      if (selectedZone == "2") {
        this.allLinesWard2 = linePath;
        this.plotLinesOnMap1(selectedZone);
      }
      if (selectedZone == "3") {
        this.allLinesWard3 = linePath;
        this.plotLinesOnMap2(selectedZone);
      }
      if (selectedZone == "4") {
        this.allLinesWard4 = linePath;
        this.plotLinesOnMap3(selectedZone);
      }
      if (selectedZone == "MarketRoute1") {
        this.allLinesMarketRoute1 = linePath;
        this.plotLinesOnMap4(selectedZone);
      }
      if (selectedZone == "MarketRoute2") {
        this.allLinesMarketRoute2 = linePath;
        this.plotLinesOnMap5(selectedZone);
      }
    });
  }

  plotLinesOnMap(selectedZone: any) {
    let lastLineDone = this.db.object("WasteCollectionInfo/LastLineCompleted/" + selectedZone).valueChanges().subscribe((lastLine) => {
      this.instancesList.push({ instances: lastLineDone }); 
      this.polylinesWard1 = [];
      for (let index = 0; index < this.allLinesWard1.length; index++) {
        let lineNo = index + 1;
        let dbPathLineStatus = "WasteCollectionInfo/" + selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus/" + lineNo + "/Status";

        let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
          this.instancesList.push({ instances: lineStatus }); 
          if (this.polylinesWard1[index] != undefined) {
            this.polylinesWard1[index].setMap(null);
          }

          let lineData = this.allLinesWard1.find(
            (item) => item.lineNo == lineNo
          );

          if (lineData != undefined) {
            let line = new google.maps.Polyline({
              path: lineData.latlng,
              strokeColor: this.commonService.getLineColor(status),
              strokeWeight: 2,
            });
            this.polylinesWard1[index] = line;
            this.polylinesWard1[index].setMap(this.mapWard1);

            let checkMarkerDetails = status != null ? true : false;

            if (status != null || Number(lastLine) == lineNo - 1) {
              checkMarkerDetails = true;
            }
            lastLineDone.unsubscribe();
          }
        });
      }
    });
  }

  plotLinesOnMap1(selectedZone: any) {
    let lastLineDone = this.db.object("WasteCollectionInfo/LastLineCompleted/" + selectedZone).valueChanges().subscribe((lastLine) => {
      this.instancesList.push({ instances: lastLineDone }); 
      this.polylinesWard2 = [];
      for (let index = 0; index < this.allLinesWard2.length; index++) {
        let lineNo = index + 1;
        let dbPathLineStatus = "WasteCollectionInfo/" + selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus/" + lineNo + "/Status";

        let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
          this.instancesList.push({ instances: lineStatus }); 
          if (this.polylinesWard2[index] != undefined) {
            this.polylinesWard2[index].setMap(null);
          }

          let lineData = this.allLinesWard2.find(
            (item) => item.lineNo == lineNo
          );

          if (lineData != undefined) {
            let line = new google.maps.Polyline({
              path: lineData.latlng,
              strokeColor: this.commonService.getLineColor(status),
              strokeWeight: 2,
            });

            this.polylinesWard2[index] = line;
            this.polylinesWard2[index].setMap(this.mapWard2);

            let checkMarkerDetails = status != null ? true : false;

            if (status != null || Number(lastLine) == lineNo - 1) {
              checkMarkerDetails = true;
            }

            lastLineDone.unsubscribe();
          }
        });
      }
    });
  }

  plotLinesOnMap2(selectedZone: any) {
    let lastLineDone = this.db.object("WasteCollectionInfo/LastLineCompleted/" + selectedZone).valueChanges().subscribe((lastLine) => {
      this.instancesList.push({ instances: lastLineDone }); 
      this.polylinesWard3 = [];
      for (let index = 0; index < this.allLinesWard3.length; index++) {
        let lineNo = index + 1;
        let dbPathLineStatus = "WasteCollectionInfo/" + selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus/" + lineNo + "/Status";

        let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
          this.instancesList.push({ instances: lineStatus }); 
          if (this.polylinesWard3[index] != undefined) {
            this.polylinesWard3[index].setMap(null);
          }

          let lineData = this.allLinesWard3.find(
            (item) => item.lineNo == lineNo
          );

          if (lineData != undefined) {
            let line = new google.maps.Polyline({
              path: lineData.latlng,
              strokeColor: this.commonService.getLineColor(status),
              strokeWeight: 2,
            });

            this.polylinesWard3[index] = line;
            this.polylinesWard3[index].setMap(this.mapWard3);

            let checkMarkerDetails = status != null ? true : false;

            if (status != null || Number(lastLine) == lineNo - 1) {
              checkMarkerDetails = true;
            }

            lastLineDone.unsubscribe();
          }
        });
      }
    });
  }

  plotLinesOnMap3(selectedZone: any) {
    let lastLineDone = this.db.object("WasteCollectionInfo/LastLineCompleted/" + selectedZone).valueChanges().subscribe((lastLine) => {
      this.instancesList.push({ instances: lastLineDone }); 
      this.polylinesWard4 = [];
      for (let index = 0; index < this.allLinesWard4.length; index++) {
        let lineNo = index + 1;
        let dbPathLineStatus = "WasteCollectionInfo/" + selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus/" + lineNo + "/Status";

        let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
          this.instancesList.push({ instances: lineStatus }); 
          if (this.polylinesWard4[index] != undefined) {
            this.polylinesWard4[index].setMap(null);
          }

          let lineData = this.allLinesWard4.find(
            (item) => item.lineNo == lineNo
          );

          if (lineData != undefined) {
            let line = new google.maps.Polyline({
              path: lineData.latlng,
              strokeColor: this.commonService.getLineColor(status),
              strokeWeight: 2,
            });

            this.polylinesWard4[index] = line;
            this.polylinesWard4[index].setMap(this.mapWard4);

            let checkMarkerDetails = status != null ? true : false;

            if (status != null || Number(lastLine) == lineNo - 1) {
              checkMarkerDetails = true;
            }

            lastLineDone.unsubscribe();
          }
        });
      }
    });
  }

  plotLinesOnMap4(selectedZone: any) {
    let lastLineDone = this.db.object("WasteCollectionInfo/LastLineCompleted/" + selectedZone).valueChanges().subscribe((lastLine) => {
      this.instancesList.push({ instances: lastLineDone }); 
      this.polylinesMarketRoute1 = [];
      for (let index = 0; index < this.allLinesMarketRoute1.length; index++) {
        let lineNo = index + 1;
        let dbPathLineStatus = "WasteCollectionInfo/" + selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus/" + lineNo + "/Status";

        let lineStatus = this.db.object(dbPathLineStatus).valueChanges().subscribe((status) => {
          this.instancesList.push({ instances: lineStatus }); 
          if (this.polylinesMarketRoute1[index] != undefined) {
            this.polylinesMarketRoute1[index].setMap(null);
          }

          let lineData = this.allLinesMarketRoute1.find(
            (item) => item.lineNo == lineNo
          );

          if (lineData != undefined) {
            let line = new google.maps.Polyline({
              path: lineData.latlng,
              strokeColor: this.commonService.getLineColor(status),
              strokeWeight: 2,
            });

            this.polylinesMarketRoute1[index] = line;
            this.polylinesMarketRoute1[index].setMap(this.mapMarketRoute1);

            let checkMarkerDetails = status != null ? true : false;

            if (status != null || Number(lastLine) == lineNo - 1) {
              checkMarkerDetails = true;
            }

            lastLineDone.unsubscribe();
          }
        });
      }
    });
  }

  plotLinesOnMap5(selectedZone: any) {
    let lastLineDone = this.db.object("WasteCollectionInfo/LastLineCompleted/" + selectedZone).valueChanges().subscribe((lastLine) => {
      this.instancesList.push({ instances: lastLineDone }); 
      this.polylinesMarketRoute2 = [];
      for (let index = 0; index < this.allLinesMarketRoute2.length; index++) {
        let lineNo = index + 1;
        let dbPathLineStatus = "WasteCollectionInfo/" + selectedZone + "/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/LineStatus/" + lineNo + "/Status";

        let lineStatus = this.db          .object(dbPathLineStatus)          .valueChanges()          .subscribe((status) => {
          this.instancesList.push({ instances: lineStatus }); 
          if (this.polylinesMarketRoute2[index] != undefined) {
              this.polylinesMarketRoute2[index].setMap(null);
            }

            let lineData = this.allLinesMarketRoute2.find(
              (item) => item.lineNo == lineNo
            );

            if (lineData != undefined) {
              let line = new google.maps.Polyline({
                path: lineData.latlng,
                strokeColor: this.commonService.getLineColor(status),
                strokeWeight: 2,
              });

              this.polylinesMarketRoute2[index] = line;
              this.polylinesMarketRoute2[index].setMap(this.mapMarketRoute2);

              let checkMarkerDetails = status != null ? true : false;

              if (status != null || Number(lastLine) == lineNo - 1) {
                checkMarkerDetails = true;
              }

              lastLineDone.unsubscribe();
            }
          });
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
