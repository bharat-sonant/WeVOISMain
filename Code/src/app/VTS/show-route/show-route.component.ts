/// <reference types="@types/googlemaps" />
import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-show-route',
  templateUrl: './show-route.component.html',
  styleUrls: ['./show-route.component.scss']
})
export class ShowRouteComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, private modalService: NgbModal, public httpService: HttpClient, private commonService: CommonService) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedWard: any;
  wardBoundary: any;
  wardKML: any;
  wardList: any[];
  zoneList: any[];
  lines: any[];
  polylines = [];
  routeList: any[];
  ddlWard = "#ddlWard";
  ddlZone = "#ddlZone";
  wardLines: any;
  strockColorNotDone = "#60c2ff";
  strockColorDone = "#0ba118";
  lblSelectedRoute = "#lblSelectedRoute";
  txtStrokeWeight = "#txtStrokeWeight";
  userId: any;
  strokeWeight = 4;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.polylines = [];
    this.wardKML = [];
    this.lines = [];
    this.zoneList = [];
    this.routeList = [];
    this.selectedWard = "0";
    this.wardBoundary = null;
    this.wardLines = 0;
    this.setHeight();
    this.setMaps();
    this.getZoneList();
    this.userId = localStorage.getItem("userID");
    if (localStorage.getItem("strokeWeight") != null) {
      this.strokeWeight = Number(localStorage.getItem("strokeWeight"));
      $(this.txtStrokeWeight).val(this.strokeWeight);
    }
  }

  resetAll() {
    let element=<HTMLInputElement>document.getElementById("chkAll");
    element.checked=false;
    localStorage.removeItem("routeLines");
    $(this.lblSelectedRoute).html("");
    this.routeList = [];
    this.lines=[];
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    if (this.wardBoundary != null) {
      this.wardBoundary[0].setMap(null);
    }
    this.wardBoundary = null;
  }

  getCurrentStrokeWeight(event: any) {
    if (event.key == "Enter") {
      let strokeWeight = $(this.txtStrokeWeight).val();
      if (strokeWeight == "") {
        if (strokeWeight == "") {
          this.commonService.setAlertMessage("error", "Please enter line no. !!!");
          return;
        }
      }
      this.strokeWeight = Number(strokeWeight);
      $(this.txtStrokeWeight).val(this.strokeWeight);
      localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
      this.setStrokeWeight();
    }
  }

  getRoutes() {
    let dbPath = "Route/" + this.selectedWard;
    let routeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        routeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let routeKey = keyArray[i];
              let routeName = data[routeKey]["name"];
              let isShow = 0;
              let lastRouteKey = 1;
              let route = [];
              if (i == 0) {
                isShow = 1;
              }
              if (data[routeKey]["Routes"] != null) {
                let obj = data[routeKey]["Routes"];
                let routeArray = Object.keys(obj);
                for (let j = routeArray.length - 1; j >= 0; j--) {
                  let key = routeArray[j];
                  if (key == "lastRouteKey") {
                    lastRouteKey = Number(obj[key]);
                  }
                  else {
                    let routeLines = [];
                    let startDate = obj[key]["startDate"];
                    let endDate = "---";
                    if (obj[key]["endDate"] != null) {
                      endDate = obj[key]["endDate"];
                    }
                    if (obj[key]["routeLines"] != null) {
                      let list = obj[key]["routeLines"].toString().split(',');
                      if (list.length > 0) {
                        for (let k = 0; k < list.length; k++) {
                          routeLines.push({ lineNo: list[k] });
                        }
                      }
                    }

                    let cssClass = "";
                    if (j == routeArray.length - 2) {
                      if (i == 0) {
                        cssClass = "active";
                        $(this.lblSelectedRoute).html(routeKey + "-" + key);
                        if (routeLines.length > 0) {
                          for (let k = 0; k < routeLines.length; k++) {
                            let lineNo = routeLines[k]["lineNo"];
                            let lineDetail = this.lines.find(item => item.lineNo == lineNo);
                            if (lineDetail != undefined) {
                              let index = lineDetail.index;
                              let line = new google.maps.Polyline(this.polylines[index]);
                              var polyOptions = {
                                strokeColor: this.strockColorDone,
                                strokeOpacity: 1.0,
                                strokeWeight: this.strokeWeight
                              }
                              line.setOptions(polyOptions);
                              this.polylines[index]["strokeColor"] = this.strockColorDone;
                            }
                          }
                        }
                      }
                    }
                    route.push({ key: Number(key), startDate: startDate, endDate: endDate, routeLines: routeLines, cssClass: cssClass });
                  }
                }
              }
              this.routeList.push({ routeKey: routeKey, routeName: routeName, isShow: isShow, route: route, lastRouteKey: lastRouteKey });
            }
            localStorage.setItem("routeLines", JSON.stringify(this.routeList));
          }
        }
      });
  }

  getRouteSelect(routeKey: any, key: any) {
    let element=<HTMLInputElement>document.getElementById("chkAll");
    element.checked=false;
    this.resetPolyLineOption();
    let routeList = JSON.parse(localStorage.getItem("routeLines"));
    if (routeList != null) {
      this.routeList = routeList;
    }
    if (this.routeList.length > 0) {
      for (let i = 0; i < this.routeList.length; i++) {
        if (this.routeList[i]["routeKey"] == routeKey) {
          let element = <HTMLInputElement>document.getElementById("chkRoute" + i);
          element.checked = true;
          this.routeList[i]["isShow"] = 1;
          let selectedRoute = routeKey;
          if (this.routeList[i]["route"] != null) {
            for (let j = 0; j < this.routeList[i]["route"].length; j++) {
              let list = [];
              if (key == 0) {
                if (j == 0) {
                  this.routeList[i]["route"][j]["cssClass"] = "active";
                  selectedRoute = selectedRoute + "-" + this.routeList[i]["route"][j]["key"];
                  list = this.routeList[i]["route"][j]["routeLines"];
                  this.setPolyLineOption(list);
                }
                else {
                  this.routeList[i]["route"][j]["cssClass"] = "";
                }
              }
              else {
                if (this.routeList[i]["route"][j]["key"] == key) {
                  selectedRoute = selectedRoute + "-" + this.routeList[i]["route"][j]["key"];
                  this.routeList[i]["route"][j]["cssClass"] = "active";
                  list = this.routeList[i]["route"][j]["routeLines"];
                  this.setPolyLineOption(list);
                }
                else {
                  this.routeList[i]["route"][j]["cssClass"] = "";
                }
              }
            }
          }
          $(this.lblSelectedRoute).html(selectedRoute);
        }
        else {
          this.routeList[i]["isShow"] = 0;
          if (this.routeList[i]["route"] != null) {
            for (let j = 0; j < this.routeList[i]["route"].length; j++) {
              this.routeList[i]["route"][j]["cssClass"] = "";
            }
          }
        }
      }
    }
    localStorage.setItem("routeLines", JSON.stringify(this.routeList));
  }

  showAllRoute() {
    this.resetPolyLineOption();
    let selectedRoute = $(this.lblSelectedRoute).html();
    let element = <HTMLInputElement>document.getElementById("chkAll");
    if (element.checked == true) {
      selectedRoute = selectedRoute + "-All";
      $(this.lblSelectedRoute).html(selectedRoute);
      let routeList = JSON.parse(localStorage.getItem("routeLines"));
      if (routeList != null) {
        this.routeList = routeList;
      }
      if (this.routeList.length > 0) {
        for (let i = 0; i < this.routeList.length; i++) {
          if (this.routeList[i]["route"] != null) {
            for (let j = 0; j < this.routeList[i]["route"].length; j++) {
              if (j == 0) {
                let list = [];
                list = this.routeList[i]["route"][j]["routeLines"];
                this.setPolyLineOption(list);
              }
            }
          }
        }
      }
    }
    else {
      selectedRoute = selectedRoute.replace("-All", "");
      $(this.lblSelectedRoute).html(selectedRoute);
      this.getRouteSelect(selectedRoute.split('-')[0], selectedRoute.split('-')[1]);
    }
  }

  resetPolyLineOption() {
    if (this.lines.length > 0) {
      for (let i = 0; i < this.lines.length; i++) {
        let strokeColor = this.strockColorNotDone;
        let line = new google.maps.Polyline(this.polylines[i]);
        var polyOptions = {
          strokeColor: strokeColor,
          strokeOpacity: 1.0,
          strokeWeight: this.strokeWeight
        }
        line.setOptions(polyOptions);
        this.polylines[i]["strokeColor"] = strokeColor;
      }
    }
  }

  setPolyLineOption(lineList: any) {
    if (lineList.length > 0) {
      for (let i = 0; i < lineList.length; i++) {
        let lineNo = lineList[i]["lineNo"];
        let lineDetail = this.lines.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          let index = lineDetail.index;
          let line = new google.maps.Polyline(this.polylines[index]);
          var polyOptions = {
            strokeColor: this.strockColorDone,
            strokeOpacity: 1.0,
            strokeWeight: this.strokeWeight
          }
          line.setOptions(polyOptions);
          this.polylines[index]["strokeColor"] = this.strockColorDone;
        }
      }
    }
  }

  getWardData() {
    this.setWardBoundary();
    this.getWardLines();
  }

  getWardLines() {
    this.httpService.get("../../assets/jsons/WardLines/" + this.cityName + "/" + this.selectedWard + ".json").subscribe(data => {
      if (data != null) {
        var keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          let index = 0;
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
                    color: strockColor,
                    index: index
                  });

                  let line = new google.maps.Polyline({
                    path: latLng,
                    strokeColor: strockColor,
                    strokeWeight: this.strokeWeight,
                  });
                  this.polylines[index] = line;
                  this.polylines[index].setMap(this.map);
                  index = index + 1;
                }
              }
            }
          }
        }
        this.getRoutes();
      }
    });
  }

  changeZoneSelection(filterVal: any) {
    this.resetAll();
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
    this.getWardData();
  }

  getZoneList() {
    this.commonService.getZoneWiseWard().then((zoneList: any) => {
      this.zoneList = JSON.parse(zoneList);
    });
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

  getNextPrevious(type: any) {
    let strokeWeight = $(this.txtStrokeWeight).val();
    if (strokeWeight == "") {
      this.commonService.setAlertMessage("error", "Please enter stroke weight. !!!");
      return;
    }
    if (type == "pre") {
      if (strokeWeight != "1") {
        this.strokeWeight = Number(strokeWeight) - 1;
        $(this.txtStrokeWeight).val(this.strokeWeight);
        localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
        this.setStrokeWeight();
      }
    } else if (type == "next") {
      this.strokeWeight = Number(strokeWeight) + 1;
      $(this.txtStrokeWeight).val(this.strokeWeight);
      localStorage.setItem("strokeWeight", this.strokeWeight.toFixed(0));
      this.setStrokeWeight();
    }
  }

  setStrokeWeight() {
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          let line = this.polylines[i];
          var polyOptions = {
            strokeColor: this.polylines[i]["strokeColor"],
            strokeOpacity: 1.0,
            strokeWeight: this.strokeWeight
          }
          line.setOptions(polyOptions);
        }
      }
    }
  }
}
