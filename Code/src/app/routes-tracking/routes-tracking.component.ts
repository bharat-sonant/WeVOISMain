import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../services/common/common.service';
import { FirebaseService } from "../firebase.service";
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-routes-tracking',
  templateUrl: './routes-tracking.component.html',
  styleUrls: ['./routes-tracking.component.scss']
})
export class RoutesTrackingComponent implements OnInit {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient, private actRoute: ActivatedRoute) { }

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
  vehicleMarker: any;
  fixdGeoLocations: any[];
  db: any;
  isActualData: any;
  routePath: any;
  routePathList: any[];
  allMarkers: any[] = [];
  polylines: any[] = [];
  lineData: any[] = [];
  endMarker: any;

  txtDate = "#txtDate";
  ddlTime = "#ddlTime";

  timeInterval: any;
  isFirst: any;
  endTime: any;
  isLast: any;

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

  drowRouteData(type: any) {
    if (this.routePathList.length > 0) {
      this.timeInterval = parseInt($(this.ddlTime).val().toString());
      if (this.timeInterval == 0) {
        this.isFirst=true;
        this.lineData = [];
        this.endTime = this.routePathList.length - 1;
      }
      else {
        if(this.isFirst==true){
          this.endTime=null;
          this.isFirst=false;
        }
        if (this.endTime != null) {
          if (this.endTime <= this.routePathList.length - 1) {
            if (type == "pre") {
              if (this.timeInterval == 1) {
                this.endTime = parseInt(this.endTime) - 1;
              }
              this.endTime = parseInt(this.endTime) - parseInt(this.timeInterval);
              if (this.endTime < 0) {
                this.endTime = 1;
              }
            }
            else {
              if (this.timeInterval == 1) {
                this.endTime = parseInt(this.endTime) + 1;
              }
              this.endTime = parseInt(this.endTime) + parseInt(this.timeInterval) - 1;
            }
          }
          else {
            this.endTime = parseInt(this.timeInterval);
            this.lineData = [];
          }
        }
        else {
          this.endTime = parseInt(this.timeInterval);
          this.lineData = [];
        }
      }
      if (this.endTime >= (this.routePathList.length - 1)) {
        this.endTime = this.routePathList.length - 1;
        this.isLast = true;
      }
      else {
        this.isLast = false;
      }
      this.drowRouteDataTiming();
    }
    else {
      $(this.ddlTime).val("0");
    }
  }

  drowRouteDataTiming() {
    let totalKM = 0;
    for (let i = 0; i <= this.endTime; i++) {
      totalKM += parseFloat(this.routePathList[i]["distanceinmeter"]);
    }
    this.trackData.totalKM = parseFloat((totalKM / 1000).toFixed(2));
    this.trackData.totalTime = this.commonService.getHrsFull((this.endTime + 1));
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
    }
    this.allMarkers = [];
    if (this.polylines != null) {
      for (let j = 0; j < this.polylines.length; j++) {
        this.polylines[j].setMap(null);
      }
    }
    this.polylines = [];
    this.lineData = [];
    for (let i = 0; i <= this.endTime; i++) {
      if (this.lineData.length > 0) {
        let lat = this.lineData[this.lineData.length - 1]["lat"];
        let lng = this.lineData[this.lineData.length - 1]["lng"];
        this.lineData = [];
        this.lineData.push({ lat: parseFloat(lat), lng: parseFloat(lng) });
      }
      let routeDateList = [];
      let latLong: string = this.routePathList[i]["latlng"];
      routeDateList = latLong.substring(1, latLong.length - 1).split(')~(');
      for (let j = 0; j < routeDateList.length; j++) {
        let routePart = routeDateList[j].split(',');
        if (routePart.length == 2) {
          this.lineData.push({ lat: parseFloat(routePart[0]), lng: parseFloat(routePart[1]) });
        }
      }
      if (this.lineData.length > 0) {
        let line = new google.maps.Polyline({
          path: this.lineData,
          strokeColor: this.commonService.getLineColor("LineCompleted"),
          strokeWeight: 2
        });

        if (i == 0) {
          let latLong: string = this.routePathList[0]["latlng"];
          let routeDateListStart = latLong.substring(1, latLong.length - 1).split(')~(');
          let routePartStart = routeDateListStart[0].split(',');
          if (routePartStart.length == 2) {
            let markerURL = this.getIcon("start");
            var markerLabel = "";
            let lat = routePartStart[0];
            let lng = routePartStart[1];
            let contentString = '<br/>Start Time : ' + this.routePathList[i]["time"];
            this.setMarker(lat, lng, markerLabel, markerURL, contentString, "all");
          }
        }
        if (i == this.endTime) {
          this.trackData.time = this.routePathList[this.endTime]["time"];
          let flowMarkerURL = this.getIcon("stopMarker");
          var flowMarkerLabel = "";
          let lat = this.lineData[this.lineData.length - 1]["lat"];
          let lng = this.lineData[this.lineData.length - 1]["lng"];
          let contentString = '<br/>Time : ' + this.routePathList[i]["time"];
          this.setMarker(lat, lng, flowMarkerLabel, flowMarkerURL, contentString, "routeMarker");
        }
        this.polylines[i] = line;
        this.polylines[i].setMap(this.map);
      }
    }
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.isActualData = localStorage.getItem("isActual");
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    this.setSelectedMonthYear();
    this.getZoneList();
    this.setMaps();
    const id = this.actRoute.snapshot.paramMap.get('id');
    if (id != null) {
      this.selectedZone = id.trim();
    }
    else {
      this.selectedZone = "1";
    }
    this.getMonthDetailList();
    this.getData();
  }

  getData() {
    this.clearMap();
    if (this.selectedZone != "0") {
      this.setWardBoundary();
      if (this.selectedDate == this.toDayDate) {
        this.showVehicleCurrentLocation();
        this.getLocationHistoryFromDatabase(this.selectedDate, "trackRoute");
      }
      else {
        this.getLocationHistoryFromStorage(this.selectedDate, "trackRoute");
      }
    }
  }

  clearMap() {
    if (this.vehicleMarker != undefined) {
      this.vehicleMarker.setMap(null);
    }
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
    }
    this.allMarkers = [];
    if (this.polylines != null) {
      for (let j = 0; j < this.polylines.length; j++) {
        this.polylines[j].setMap(null);
      }
    }
    this.polylines = [];
    this.routePath = null;
    this.trackData.totalKM = 0;
    this.trackData.totalTime = "0 hr 0 min";
    this.trackData.time = "0:00";
  }

  getMonthSelectedDetail(monthDate: any) {
    this.clearMap();
    $(this.txtDate).val(monthDate);
    if (this.selectedZone != "0") {
      if (this.selectedDate == this.toDayDate) {
        this.showVehicleCurrentLocation();
      }
      let monthDetail = this.monthDetailList.find(item => item.monthDate == monthDate);
      if (monthDetail != undefined) {
        if (monthDetail.routePath != undefined) {
          this.getMonthListData(monthDate, monthDetail.routePath, "trackRoute");
        }
        else {
          this.getLocationHistoryFromStorage(this.selectedDate, "trackRoute");
        }
      }
      else {
        this.getLocationHistoryFromStorage(this.selectedDate, "trackRoute");
      }
    }
  }

  drowRouteOnMap() {
    $(this.ddlTime).val("0");
    this.endTime = null;
    this.routePathList = []
    if (this.allMarkers.length > 0) {
      for (let i = 0; i < this.allMarkers.length; i++) {
        this.allMarkers[i]["marker"].setMap(null);
      }
    }
    this.allMarkers = [];
    if (this.polylines != null) {
      for (let j = 0; j < this.polylines.length; j++) {
        this.polylines[j].setMap(null);
      }
    }
    this.polylines = [];
    var keyArray = Object.keys(this.routePath);
    for (let i = 0; i < keyArray.length - 2; i++) {
      let index = keyArray[i];
      this.routePathList.push({ distanceinmeter: this.routePath[index]["distance-in-meter"], latlng: this.routePath[index]["lat-lng"], time: index });

    }
    this.drowRouteData("current");
  }

  setMarker(lat: any, lng: any, markerLabel: any, markerURL: any, contentString: any, type: any) {
    let scaledHeight = 50;
    let scaledWidth = 50;
    if (type == "route") {
      scaledHeight = 10;
      scaledWidth = 20;
    }
    else if (type == "routeMarker") {
      scaledHeight = 25;
      scaledWidth = 31;
    }
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
    if (type == "all" || type == "routeMarker") {
      this.allMarkers.push({ marker });
    }
  }

  getMonthDetailList() {
    this.monthDetailList = [];
    if (this.selectedZone != "0") {
      let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
      if (this.toDayDate.split("-")[1] == this.selectedDate.split("-")[1]) {
        days = this.toDayDate.split("-")[2];
      }
      for (let i = 1; i <= days; i++) {
        let monthDate = this.selectedYear + '-' + (this.selectedMonth < 10 ? '0' : '') + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
        let monthShortName = this.commonService.getCurrentMonthShortName(Number(monthDate.split('-')[1]));
        let day = monthDate.split("-")[2] + " " + monthShortName;
        this.monthDetailList.push({ wardNo: this.selectedZone, day: day, driver: '', km: '0', hour: '', percentage: '0', monthDate: monthDate });
        if (monthDate != this.toDayDate) {
          this.getLocationHistoryFromStorage(monthDate, "monthList");
        }
      }
    }
  }

  getMonthListData(monthDate: any, routePath: any, type: any) {
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
    let monthDetails = this.monthDetailList.find(item => item.monthDate == monthDate);
    if (monthDetails != undefined) {
      monthDetails.km = parseFloat((totalKM / 1000).toFixed(1));
      monthDetails.hour = this.commonService.getHrsFull(totalMinutes);
      monthDetails.routePath = routePath;
    }
    if (type == "trackRoute") {
      this.routePath = routePath;
      this.trackData.totalKM = parseFloat((totalKM / 1000).toFixed(1));
      this.trackData.totalTime = this.commonService.getHrsFull(totalMinutes);
      this.drowRouteOnMap();
      if (this.selectedDate == monthDate) {
        this.getMonthDetail(monthDetails, routePath, monthDate);
      }
    }
    else {
      this.getMonthDetail(monthDetails, routePath, monthDate);
    }
  }

  getLocationHistoryFromStorage(monthDate: any, type: any) {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FLocationHistory%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + monthDate + ".json?alt=media";
    let locationHistoryInstance = this.httpService.get(path).subscribe(data => {
      locationHistoryInstance.unsubscribe();
      if (data != null) {
        let routePath = data["routePath"];
        let monthDetails = this.monthDetailList.find(item => item.monthDate == monthDate);
        if (monthDetails != undefined) {
          monthDetails.driver = data["driver"];
          monthDetails.percentage = data["percentage"];
          monthDetails.routePath = routePath;
          this.getMonthListData(monthDate, routePath, type);
        }
      }
    }, error => {
      this.getLocationHistoryFromDatabase(monthDate, type);
    });
  }

  getLocationHistoryFromDatabase(monthDate: any, type: any) {
    let dbPath = "LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
    let locationHistoryInstance = this.db.object(dbPath).valueChanges().subscribe(
      routePath => {
        locationHistoryInstance.unsubscribe();
        if (routePath != null) {
          this.getMonthListData(monthDate, routePath, type);
        }
      }
    );
  }

  getMonthDetail(monthDetails: any, routePath: any, monthDate: any) {
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
            if (monthDate != this.toDayDate) {
              const obj = {
                driver: monthDetails.driver,
                percentage: monthDetails.percentage,
                km: monthDetails.km,
                routePath: routePath
              };
              let filePath = "/LocationHistory/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/";
              let fileName = monthDate + ".json";
              this.commonService.saveJsonFile(obj, fileName, filePath);
            }
          }
        );
      });
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
      let nextDate = this.commonService.getNextDate($(this.txtDate).val(), 1);
      if (new Date(nextDate) > new Date(this.toDayDate)) {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!")
        $(this.txtDate).val(this.toDayDate);
        this.selectedDate = this.toDayDate;
        return;
      }
      this.selectedDate = nextDate;
    } else if (type == 'previous') {
      let previousDate = this.commonService.getPreviousDate($(this.txtDate).val(), 1);
      this.selectedDate = previousDate;
    }
    this.setSelectedMonthYear();
    let monthDetail = this.monthDetailList.find(item => item.monthDate == this.selectedDate);
    if (monthDetail == undefined) {
      this.getMonthDetailList();
      this.getMonthSelectedDetail(this.selectedDate);
      if (this.selectedMonth == Number(this.toDayDate.split('-')[1])) {
        this.getLocationHistoryFromDatabase(this.toDayDate, "monthList");
      }
    }
    else {
      this.getMonthSelectedDetail(this.selectedDate);
    }
  }

  setSelectedMonthYear() {
    $(this.txtDate).val(this.selectedDate);
    this.selectedMonth = Number(this.selectedDate.split('-')[1]);
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;
    if (this.zoneKML != undefined) {
      this.zoneKML[0]["line"].setMap(null);
    }
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

  getReset() {

  }
}

export class trackDetail {
  totalKM: number;
  totalTime: string;
  time: string;
  percentage: string;
}

