/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
//services
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  cityName: any;
  db: any;
  toDayDate: any;
  selectedDate: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedZone: any;
  selectedRoute: any;
  mainZoneList: any[] = [];
  zoneList: any[] = [];
  zoneRouteList: any[] = [];
  lines: any[] = [];
  polylines = [];
  activeCount:any;
  bounds = new google.maps.LatLngBounds();
  txtDate = "#txtDate";
  divLoader = "#divLoader";
  invisibleImageUrl = "../assets/img/invisible-location.svg";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    this.getSelectedYearMonth();
    this.setHeight();
    this.setDefaultMap();
    this.getZone();
  }

  clearAllOnMap() {
    this.activeCount=0;
    this.bounds = new google.maps.LatLngBounds();
    this.setDefaultMap();
  }

  showAllRoute() {
    if (this.zoneRouteList.length > 0) {
      for (let i = 0; i < this.zoneRouteList.length; i++) {
        if ((<HTMLInputElement>document.getElementById("chkAll")).checked == true) {
          (<HTMLInputElement>document.getElementById("chk" + i)).checked = true;
        }
        else {
          (<HTMLInputElement>document.getElementById("chk" + i)).checked = false;
        }
      }
      this.getSelectedData();
    }
  }

  getSelectedData() {
    $(this.divLoader).show();
    this.clearAllOnMap();
    this.setWardBoundary(0)
    this.getAllLinesFromJson(0);
  }

  getAllLinesFromJson(index: any) {
    if (index < this.zoneRouteList.length) {
      if ((<HTMLInputElement>document.getElementById("chk" + index)).checked == true) {
        let zoneNo = this.zoneRouteList[index]["zoneNo"];
        this.commonService.getWardLine(zoneNo, this.selectedDate).then((linesData: any) => {
          let wardLinesDataObj = JSON.parse(linesData);
          let keyArray = Object.keys(wardLinesDataObj);
          for (let i = 0; i < keyArray.length - 3; i++) {
            let lineNo = Number(keyArray[i]);
            let points = wardLinesDataObj[lineNo]["points"];
            let lineLength = 0;
            let houses = [];
            if (wardLinesDataObj[lineNo]["Houses"] != null) {
              houses = wardLinesDataObj[lineNo]["Houses"];
            }
            if (wardLinesDataObj[lineNo]["lineLength"] != null) {
              lineLength = wardLinesDataObj[lineNo]["lineLength"];
            }
            var latLng = [];
            for (let j = 0; j < points.length; j++) {
              latLng.push({ lat: points[j][0], lng: points[j][1] });
              if (j == 0) {
                this.setLineStartMarker(points[j][0], points[j][1]);
              }
            }
            this.lines.push({
              zoneNo: zoneNo,
              lineNo: lineNo,
              latlng: latLng,
              color: "#60c2ff",
              lineLength: lineLength,
              houseCount: houses.length,
              lineStatus: ""
            });
            this.setLineNoMarker(lineNo, points[0][0], points[0][1]);
            this.plotLineOnMap(zoneNo, lineNo, latLng, i);
          }
          index = index + 1;
          this.getAllLinesFromJson(index);
        }, error => {
          index = index + 1;
          this.getAllLinesFromJson(index);
        });
      }
      else {
        index = index + 1;
        this.getAllLinesFromJson(index);
      }
    }
    else {
      setTimeout(() => {
        $(this.divLoader).hide();
      }, 600);
    }
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
  }

  setLineStartMarker(lat: any, lng: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "black",
        fillOpacity: 0.6,
        strokeColor: 'black',
        strokeOpacity: 0.9,
        strokeWeight: 1,
        scale: 3
      }
    });
  }

  plotLineOnMap(zoneNo: any, lineNo: any, latlng: any, index: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + zoneNo + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatusInstance = this.db.object(dbPathLineStatus).valueChanges().subscribe((lineStatus) => {
      lineStatusInstance.unsubscribe();
      let strokeColor = this.commonService.getLineColor(null);
      if (lineStatus != null) {
        strokeColor = this.commonService.getLineColor(lineStatus);
        let lineDetail = this.lines.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          lineDetail.lineStatus = lineStatus;
          lineDetail.color = strokeColor;
        }
      }
      const iconsetngs = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
      };
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: strokeColor,
        strokeWeight: 2,
        icons: [{
          icon: iconsetngs,
          repeat: "60px",
          offset: '100%'
        }]
      });
      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);
    });
  }

  setWardBoundary(index: any) {
    if (index < this.zoneRouteList.length) {
      if ((<HTMLInputElement>document.getElementById("chk" + index)).checked == true) {
        this.activeCount++;
        let zoneNo = this.zoneRouteList[index]["zoneNo"];
        this.commonService.getWardBoundary(zoneNo, null, "4").then((boundaryData: any) => {
          console.log(boundaryData);
          let wardBoundary = boundaryData;
          wardBoundary[0]["line"].setMap(this.map);
          for (let i = 0; i < wardBoundary[0]["latLng"].length; i = (i + 5)) {
            this.bounds.extend({ lat: Number(wardBoundary[0]["latLng"][i]["lat"]), lng: Number(wardBoundary[0]["latLng"][i]["lng"]) });
          }
          index = index + 1;
          this.setWardBoundary(index);
        });
      }
      else {
        index = index + 1;
        this.setWardBoundary(index);
      }
    }
    else {
      if (this.activeCount>0) {
        this.map.fitBounds(this.bounds);
        if(this.activeCount==this.zoneRouteList.length){
          (<HTMLInputElement>document.getElementById("chkAll")).checked = true;
        }
        else{
          (<HTMLInputElement>document.getElementById("chkAll")).checked = false;
        }
      }
    }
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.getSelectedYearMonth();
        if (this.selectedZone != "0") {
          this.clearAllOnMap();
          this.getSelectedData();
        }
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone");
      return;
    }
    this.clearAllOnMap();
    this.selectedZone = filterVal;
    this.zoneRouteList = this.mainZoneList.filter(item => item.mainZone == this.selectedZone);
  }

  getZone() {
    this.zoneList.push({ zoneNo: "0", zoneName: "--Select Zone--" });
    let list = JSON.parse(localStorage.getItem("latest-zones"));
    for (let i = 1; i < list.length; i++) {
      let zone = list[i]["zoneNo"];
      let mainZone = zone;
      if (zone.toString().includes("-R")) {
        mainZone = zone.toString().split('-')[0];
      }
      let zoneDetail = this.zoneList.find(item => item.zoneNo == mainZone);
      if (zoneDetail == undefined) {
        this.zoneList.push({ zoneNo: mainZone, zoneName: "Zone " + mainZone });
      }
      this.mainZoneList.push({ mainZone: mainZone, zoneNo: zone, zoneName: zone });
    }
  }

  getSelectedYearMonth() {
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
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
