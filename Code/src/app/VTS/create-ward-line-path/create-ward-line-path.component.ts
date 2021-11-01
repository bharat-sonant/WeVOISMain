/// <reference types="@types/googlemaps" />
import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-create-ward-line-path',
  templateUrl: './create-ward-line-path.component.html',
  styleUrls: ['./create-ward-line-path.component.scss']
})
export class CreateWardLinePathComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService) { }
  db: any;
  cityName: any
  selectedWard: any;
  wardBoundary: any;
  wardKML: any;
  wardList: any[];
  zoneList: any[];
  lines: any[];
  polylines = [];
  RoutePolylines = [];
  refList: any[];
  ddlWard = "#ddlWard";
  ddlZone = "#ddlZone";
  ddlRef = "#ddlRef";
  wardLines: any;
  wardLineLengthList: any[];
  strockColorNotDone = "#60c2ff";
  strockColorDone = "#0ba118";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.polylines = [];
    this.RoutePolylines = [];
    this.wardKML = [];
    this.lines = [];
    this.zoneList = [];
    this.refList = [];
    this.selectedWard = "0";
    this.wardLines = 0;
    this.wardBoundary = null;
    this.setHeight();
    this.setMaps();
    this.getZoneList();
  }

  resetAll() {
    this.resetMap();
  }

  resetMap() {
    if (this.wardBoundary != null) {
      this.wardBoundary.setMap(null);
    }
    this.wardBoundary = null;
    this.wardLines = 0;
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    if (this.RoutePolylines.length > 0) {
      for (let i = 0; i < this.RoutePolylines.length; i++) {
        if (this.RoutePolylines[i] != undefined) {
          this.RoutePolylines[i].setMap(null);
        }
      }
    }
    this.RoutePolylines = [];
    this.refList = [];
  }

  getZoneList() {
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
  }

  changeZoneSelection(filterVal: any) {
    $(this.ddlZone).val(filterVal);
    this.selectedWard = 0;
    this.wardList = [];
    let zoneDetail = this.zoneList.find(item => item.zoneName == filterVal);
    if (zoneDetail != undefined) {
      let wardList = zoneDetail.wardList;
      for (let i = 1; i < wardList.length; i++) {
        this.wardList.push({ wardNo: wardList[i], wardName: "Ward " + wardList[i] });
      }
    }
  }

  changeWardSelection(filterVal: any) {
    this.resetAll();
    $(this.ddlWard).val(filterVal);
    this.selectedWard = filterVal;
    if (this.selectedWard == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    this.checkWardRoute();
  }

  checkWardRoute() {
    let dbPath = "WardRoute/Vehicle/" + this.selectedWard;
    let wardInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        wardInstance.unsubscribe();
        if (data == null) {
          this.commonService.setAlertMessage("error", "Sorry no ward route found in selected ward !!!");
          return;
        }
        this.getWardData();
      }
    );
  }

  getWardData() {
    this.setWardBoundary();
    this.getWardLines();
    this.getRefRoute();
  }

  getWardLines() {
    this.httpService.get("../../assets/jsons/WardLines/" + this.cityName + "/" + this.selectedWard + ".json").subscribe(data => {
      if (data != null) {
        var keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            this.wardLines = keyArray.length;
            let lineNo = keyArray[i];
            if (data[lineNo] != null) {
              var latLng = [];
              if (data[lineNo]["points"] != undefined) {
                if (data[lineNo]["points"].length > 0) {
                  for (let j = 0; j < data[lineNo]["points"].length; j++) {
                    latLng.push({ lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1] });
                  }
                  let strockColor = this.strockColorNotDone;
                  this.lines.push({
                    lineNo: lineNo,
                    latlng: latLng,
                    color: strockColor
                  });
                  let line = new google.maps.Polyline({
                    path: latLng,
                    strokeColor: strockColor,
                    strokeWeight: 4,
                  });

                  this.polylines[i] = line;
                  this.polylines[i].setMap(this.map);
                  this.setClickInstance(line, lineNo, i);
                }
              }
            }
          }
        }
      }
    });
  }

  setClickInstance(line: any, lineNo: any, index: any) {
    let dbEvent = this.db;
    let lines = this.lines;
    let polylines = this.polylines;
    let selectedWard = this.selectedWard;
    let strockColorNotDone = this.strockColorNotDone;
    let strockColorDone = this.strockColorDone;
    let commonServices = this.commonService;

    google.maps.event.addListener(line, 'click', function (h) {
      let ref = $('#ddlRef').val();
      if (ref == "0") {
        commonServices.setAlertMessage("error", "Please select Vehicle !!!");
        return;
      }
      let stockColor = strockColorNotDone;
      let lineDetail = lines.find(item => item.lineNo == lineNo);
      if (lineDetail != undefined) {
        stockColor = lineDetail.color;
        if (stockColor == strockColorNotDone) {
          lineDetail.color = strockColorDone;
          stockColor = lineDetail.color;
        }
        else {
          lineDetail.color = strockColorNotDone;
          stockColor = lineDetail.color;
        }
        var polyOptions = {
          strokeColor: stockColor,
          strokeOpacity: 1.0,
          strokeWeight: 4
        }
        line.setOptions(polyOptions);
        polylines[index]["strokeColor"] = stockColor;

      }
    });
  }

  getRefRoute() {
    let dbPath = "WardRoute/" + this.selectedWard;
    let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        routeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let ref = keyArray[i];
              let latLngList = data[ref];
              let color = this.getVTSLineColor(i);
              this.refList.push({ ref: ref, latLngList: latLngList, isShow: 1, color: color });
              this.plotRefRouteOnMap(ref, i);
            }
          }
        }
      }
    );
  }


  changeRef(ref: any, index: any) {
    let element = <HTMLInputElement>document.getElementById("chk" + index);
    if (element.checked == true) {
      this.refList[index]["isShow"] = 1;
    }
    else {
      this.refList[index]["isShow"] = 0;
    }
    if (this.RoutePolylines.length > 0) {
      for (let i = 0; i < this.RoutePolylines.length; i++) {
        if (this.RoutePolylines[i] != undefined) {
          this.RoutePolylines[i].setMap(null);
        }
      }
    }
    this.RoutePolylines = [];
    for (let i = 0; i < this.refList.length; i++) {
      if (this.refList[i]["isShow"] == 1) {
        this.plotRefRouteOnMap(this.refList[i]["ref"], i);
      }
    }
  }

  plotRefRouteOnMap(ref: any, index: any) {
    if (this.refList.length > 0) {
      let detail = this.refList.find(item => item.ref == ref);
      if (detail != undefined) {
        let latLngList = detail.latLngList;
        var latLng = [];
        if (latLngList.length > 0) {
          for (let i = 0; i < latLngList.length; i++) {
            latLng.push({ lat: Number(latLngList[i]["lat"]), lng: Number(latLngList[i]["lng"]) });
          }
          let strockColor = detail.color;
          let line = new google.maps.Polyline({
            path: latLng,
            strokeColor: strockColor,
            strokeWeight: 4,
          });
          this.RoutePolylines[index] = line;
          this.RoutePolylines[index].setMap(this.map);
        }
      }
    }
  }

  getVTSLineColor(index: any) {
    let color = "red";
    if (index == 1) {
      color = "#0614f4";
    }
    else if (index == 2) {
      color = "#ea06f4";
    }
    else if (index == 3) {
      color = "#03fef7";
    }
    else if (index == 4) {
      color = "#eafe03";
    }
    return color;
  }

  setWardBoundary() {
    this.commonService.setWardBoundary(this.selectedWard, this.map).then((wardKML: any) => {
      this.wardBoundary = wardKML;
    });
  }

  setMaps() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.setOptions({ clickableIcons: false });
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

}
