import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-routes-tracking',
  templateUrl: './routes-tracking.component.html',
  styleUrls: ['./routes-tracking.component.scss']
})
export class RoutesTrackingComponent implements OnInit {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }

  selectedZone: any;
  preSelectedZone: any;
  zoneList: any[];
  toDayDate: any;
  selectedDate: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedMonth: any;
  zoneKML: any;
  monthDetailList: any[];
  routePathStore: any[];
  vehicleMarker: any;
  fixdGeoLocations: any[];
  db: any;
  isActualData: any;

  txtDate = "#txtDate";

  trackData: trackDetail =
    {
      totalKM: 0,
      totalTime: "0 hr 0 min",
      time: "0:00",
      percentage: "0"
    };

  ngOnInit() {
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.isActualData = localStorage.getItem("isActual");
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    this.setSelectedMonthYear();
    this.getZoneList();
    this.setMaps();
    this.getMonthDetailList();
  }


  getData() {
    this.clearMap();
    this.setWardBoundary();
    if (this.selectedDate == this.toDayDate) {
      this.showVehicleCurrentLocation();
    }
  }

  clearMap() {
    if (this.vehicleMarker != undefined) {
      this.vehicleMarker.setMap(null);
    }
    if (this.zoneKML != undefined) {
      this.zoneKML[0]["line"].setMap(null);
    }
  }

  getMonthDetailList() {
    this.monthDetailList = [];
    let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (this.toDayDate.split("-")[1] == this.selectedDate.split("-")[1]) {
      days = this.toDayDate.split("-")[2];
    }
    for (let i = 1; i <= days; i++) {
      let monthDate = this.selectedYear + '-' + (this.selectedMonth < 10 ? '0' : '') + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
      let monthShortName = this.commonService.getCurrentMonthShortName(Number(monthDate.split('-')[1]));
      let day = monthDate.split("-")[2] + " " + monthShortName;
      this.monthDetailList.push({ wardNo: this.selectedZone, day: day, driver: '', km: '0', hour: '', percentage: '0', monthDate: monthDate });
      this.getMonthDetailData(monthDate);
    }
  }

  getMonthDetailData(monthDate: any) {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FLocationHistory%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + monthDate + ".json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let routePath = data["routePath"];
        let totalKM: number = 0;
        let routeKeyArray = Object.keys(routePath);
        let keyArray = [];
        if (routeKeyArray.length > 0) {
          if (this.isActualData == 0) {
            keyArray = routeKeyArray;
          }
          else {
            for (let i = 0; i < routeKeyArray.length; i++) {
              if (!routeKeyArray[i].toString().includes('-')) {
                keyArray.push(routeKeyArray[i]);
              }
            }
          }
        }
        for (let i = 0; i < keyArray.length - 3; i++) {
          let index = keyArray[i];
          totalKM += parseFloat(routePath[index]["distance-in-meter"]);
        }
        let startTime = keyArray[0];
        let endTime = keyArray[0];
        if (keyArray.length > 1) {
          endTime = keyArray[keyArray.length - 3];
        }
        let sTime = monthDate + " " + startTime;
        let eTime = monthDate + " " + endTime;
        let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
        let monthDetails = this.monthDetailList.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
        if (monthDetails != undefined) {
          monthDetails.km = parseFloat((totalKM / 1000).toFixed(1));
          monthDetails.hour = this.commonService.getHrsFull(totalMinutes);
          monthDetails.driver = data["driver"];
          monthDetails.percentage = data["percentage"];
        }
      }
    }, error => {
      this.getDateDetail(monthDate);
    });
  }

  getDateDetail(monthDate: any) {
    let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
    let vehicleTrackingInstance = this.db.object(dbPath).valueChanges().subscribe(
      routePath => {
        vehicleTrackingInstance.unsubscribe();
        if (routePath != null) {
          let totalKM: number = 0;
          let routeKeyArray = Object.keys(routePath);
          let keyArray = [];
          if (routeKeyArray.length > 0) {
            if (this.isActualData == 0) {
              keyArray = routeKeyArray;
            }
            else {
              for (let i = 0; i < routeKeyArray.length; i++) {
                if (!routeKeyArray[i].toString().includes('-')) {
                  keyArray.push(routeKeyArray[i]);
                }
              }
            }
          }

          for (let i = 0; i < keyArray.length - 3; i++) {
            let index = keyArray[i];
            totalKM += parseFloat(routePath[index]["distance-in-meter"]);
          }

          let startTime = keyArray[0];
          let endTime = keyArray[0];
          if (keyArray.length > 1) {
            endTime = keyArray[keyArray.length - 3];
          }
          let sTime = monthDate + " " + startTime;
          let eTime = monthDate + " " + endTime;
          let totalMinutes = this.commonService.timeDifferenceMin(new Date(eTime), new Date(sTime));
          let monthDetails = this.monthDetailList.find(item => item.wardNo == this.selectedZone && item.monthDate == monthDate);
          if (monthDetails != undefined) {
            monthDetails.km = parseFloat((totalKM / 1000).toFixed(1));
            monthDetails.hour = this.commonService.getHrsFull(totalMinutes);
            let driverdbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/WorkerDetails/driverName";
            let driverInstance = this.db.object(driverdbPath).valueChanges().subscribe(
              driverData => {
                driverInstance.unsubscribe();
                if (driverData != null) {
                  monthDetails.driver = driverData;
                }
                let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/Summary/workPercentage";
                let workPersentageInstance = this.db.object(dbPath).valueChanges().subscribe(
                  data => {
                    workPersentageInstance.unsubscribe();
                    if (data != null) {
                      monthDetails.percentage = data.toString();
                    }
                    const obj = {
                      driver: monthDetails.driver,
                      percentage: monthDetails.percentage,
                      km: monthDetails.km,
                      routePath: routePath
                    };
                    if (monthDate != this.toDayDate) {
                      let filePath = "/LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/";
                      let fileName = monthDate + ".json";
                      this.commonService.saveJsonFile(obj, fileName, filePath);
                    }
                  }
                );
              });
          }
        }
      }
    );
  }

  showVehicleCurrentLocation() {
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/WorkerDetails/vehicle";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      vehicleData => {
        vehicleInstance.unsubscribe();
        let vehicle = vehicleData;
        let dbPath = "CurrentLocationInfo/" + this.selectedZone + "/latLng";
        let currentLocationInstance = this.db.object(dbPath).valueChanges().subscribe(
          currentLocationData => {
            currentLocationInstance.unsubscribe();
            if (currentLocationData != null) {
              dbPath = "RealTimeDetails/WardDetails/" + this.selectedZone + "/activityStatus";
              let statusInstance = this.db.object(dbPath).valueChanges().subscribe(
                statusData => {
                  statusInstance.unsubscribe();
                  let statusId = statusData.toString();
                  let vehicleIcon = '';
                  if (vehicle.includes("TRACTOR")) {
                    vehicleIcon = this.getIcon("activeTractor");
                    if (statusId == 'completed') {
                      vehicleIcon = this.getIcon("deActiveTractor");
                    } else if (statusId == 'stopped') {
                      vehicleIcon = this.getIcon("stopTractor");
                    }
                  }
                  else {
                    vehicleIcon = this.getIcon("activeVehicle");
                    if (statusId == 'completed') {
                      vehicleIcon = this.getIcon("deActiveVehicle");
                    } else if (statusId == 'stopped') {
                      vehicleIcon = this.getIcon("stopVehicle");
                    }
                  }
                  let location = currentLocationData.toString().split(",");
                  let lat = Number(location[0]);
                  let lng = Number(location[1]);
                  this.vehicleMarker = new google.maps.Marker({
                    position: { lat: Number(lat), lng: Number(lng) },
                    map: this.map,
                    icon: vehicleIcon,
                  });
                });
            }
          }
        );
      }
    );
  }


  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["zoneName"] = "--Select Zone--";
    this.selectedZone = "0";
    this.preSelectedZone = "0";
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.getFixedGeoLocation();
  }

  getFixedGeoLocation() {
    this.fixdGeoLocations = JSON.parse(localStorage.getItem("fixedLocation"));;
    if (this.fixdGeoLocations != null) {
      if (this.fixdGeoLocations.length > 0) {
        for (let i = 0; i < this.fixdGeoLocations.length; i++) {
          let lat = this.fixdGeoLocations[i]["lat"];
          let lng = this.fixdGeoLocations[i]["lng"];
          let markerURL = "../../../assets/img/" + this.fixdGeoLocations[i]["img"];
          var markerLabel = "";
          let contentString = '<b>' + this.fixdGeoLocations[i]["name"] + '</b>: ' + this.fixdGeoLocations[i]["address"];
          let scaledHeight = 50;
          let scaledWidth = 50;
          let marker = new google.maps.Marker({
            position: { lat: Number(lat), lng: Number(lng) },
            map: this.map,
            label: { text: ' ' + markerLabel + ' ', color: "white", fontSize: "12px", fontWeight: "bold" },
            icon: {
              url: markerURL,
              fillOpacity: 1,
              strokeWeight: 0,
              scaledSize: new google.maps.Size(scaledHeight, scaledWidth),
              origin: new google.maps.Point(0, 0),
              labelOrigin: new google.maps.Point(25, 31)
            }
          });

          let infowindow = new google.maps.InfoWindow({
            content: contentString
          });

          marker.addListener('click', function () {
            infowindow.open(this.map, marker);
          });
        }
      }
    }
  }

  setDate(filterVal: any, type: string) {
    if (type == 'current') {
      this.selectedDate = filterVal;
    } else if (type == 'next') {
      let nextDate = this.commonService.getNextDate($('#txtDate').val(), 1);
      this.selectedDate = nextDate;
    } else if (type == 'previous') {
      let previousDate = this.commonService.getPreviousDate($('#txtDate').val(), 1);
      this.selectedDate = previousDate;
    }
    this.setSelectedMonthYear();
    let monthDetail=this.monthDetailList.find(item=>item.monthDate==this.selectedDate);
    if(monthDetail==undefined){
      this.getMonthDetailList();
    }
    this.getData();
  }

  setSelectedMonthYear() {
    $(this.txtDate).val(this.selectedDate);
    this.selectedMonth = Number(this.selectedDate.split('-')[1]);
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;    
    this.getMonthDetailList();
    this.getData();
  }

  getIcon(type: any) {
    let icon = "";
    if (type == "start") {
      icon = "../../../assets/img/start.svg";
    }
    else if (type == "stop") {
      icon = "../../../assets/img/stop.svg";
    }
    else if (type == "activeVehicle") {
      icon = '../assets/img/tipper-green.png';
    }
    else if (type == "stopVehicle") {
      icon = '../assets/img/tipper-red.png';
    }
    else if (type == "deActiveVehicle") {
      icon = '../assets/img/tipper-gray.png';
    }
    else if (type == "activeTractor") {
      icon = '../assets/img/active-tractormdpi.png';
    }
    else if (type == "stopTractor") {
      icon = '../assets/img/stop-tractormdpi.png';
    }
    else if (type == "deActiveTractor") {
      icon = '../assets/img/disabled-tractormdpi.png';
    }
    else if (type == "startMarker") {
      icon = "../../../assets/img/start.svg";
    }
    else if (type == "stopMarker") {
      icon = "../../../assets/img/greenmarker.png";
    }
    else if (type == "carMarker") {
      icon = "../../../assets/img/red-car.png";
    }
    return icon;
  }


  setWardBoundary() {
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
    });
  }

  setSpeed(speed: any) {

  }

  getPlayStop() {

  }

  getRouteDataPreNext(type: any) {

  }

  getReset() {

  }

  getRouteData(type: any) {

  }

}

export class trackDetail {
  totalKM: number;
  totalTime: string;
  time: string;
  percentage: string;
}

