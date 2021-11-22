/// <reference types="@types/googlemaps" />
import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-create-routes',
  templateUrl: './create-routes.component.html',
  styleUrls: ['./create-routes.component.scss']
})
export class CreateRoutesComponent implements OnInit {

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
  txtRouteName = "#txtRouteName";
  lblSelectedRoute = "#lblSelectedRoute";
  txtStrokeWeight = "#txtStrokeWeight";
  txtApplicableDate = '#txtApplicableDate';
  lblHeading = "#lblHeading";
  btnUpdate = "#btnUpdate";
  txtUpdateDate = "#txtUpdateDate";
  updateKey = "#updateKey";
  updateRouteKey = "#updateRouteKey";
  userId: any;
  strokeWeight = 4;

  ngOnInit() {
    localStorage.removeItem("routeLines");
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
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
    localStorage.removeItem("routeLines");
    if (localStorage.getItem("strokeWeight") != null) {
      this.strokeWeight = Number(localStorage.getItem("strokeWeight"));
      $(this.txtStrokeWeight).val(this.strokeWeight);
      this.toDayDate = this.commonService.setTodayDate();

    }
  }

  resetAll() {
    localStorage.removeItem("routeLines");
    $(this.lblSelectedRoute).html("");
    this.routeList = [];
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != undefined) {
          this.polylines[i].setMap(null);
        }
      }
    }
    this.polylines = [];
    if (this.wardBoundary != null) {
      this.wardBoundary.setMap(null);
    }
    this.wardBoundary = null;
  }

  createRoute() {
    let applicableDate = $(this.txtApplicableDate).val();
    if (applicableDate == "") {
      this.commonService.setAlertMessage("error", "Please enter applicable date !!!");
      return;
    }
    let routeName = $(this.txtRouteName).val();
    if (routeName == "") {
      this.commonService.setAlertMessage("error", "Please enter route name !!!");
      return;
    }
    let routeKey = routeName.toString().replace(" ", "").replace(" ", "").replace(" ", "").replace(" ", "").replace(" ", "").replace(" ", "");

    let routeDetail = this.routeList.find(item => item.routeKey == routeKey);
    if (routeDetail != undefined) {
      this.commonService.setAlertMessage("error", "Route name already exist !!!");
      return;
    }

    const Routes = {
      lastRouteKey: 1,
      1: {
        startDate: applicableDate
      }
    }

    const data = {
      name: routeName,
      createdBy: this.userId,
      creationDate: this.commonService.getTodayDateTime(),
      Routes: Routes
    }
    let dbPath = "Route/" + this.selectedWard + "/" + routeKey;

    this.db.object(dbPath).update(data);
    let routeList = JSON.parse(localStorage.getItem("routeLines"));
    if (routeList != null) {
      this.routeList = routeList;
    }
    let routeLines = [];
    let route = [];
    route.push({ key: 1, startDate: applicableDate, endDate: "---", routeLines: routeLines });
    this.routeList.push({ routeKey: routeKey, routeName: routeName, isShow: 1, lastRouteKey: 1, route: route });
    localStorage.setItem("routeLines", JSON.stringify(this.routeList));
    setTimeout(() => {
      let element = <HTMLInputElement>document.getElementById("chkRoute" + (this.routeList.length - 1));
      element.checked = true;
      this.getRouteSelect(this.routeList.length - 1);
    }, 200);
    this.closeModel();

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

  updateRoute() {
    let routeList = JSON.parse(localStorage.getItem("routeLines"));
    let routeKey = $(this.updateRouteKey).val();
    let applicableDate = $(this.txtUpdateDate).val();
    let key = $(this.updateKey).val();
    if ($(this.btnUpdate).html() == "Create New") {
      let routeDetail = routeList.find(item => item.routeKey == routeKey);
      if (routeDetail != undefined) {
        key = routeDetail.route[0]["key"];
        let startDate = routeDetail.route[0]["startDate"];
        let dat1 = new Date(startDate);
        let dat2 = new Date(applicableDate.toString());
        if (dat2 <= dat1) {
          this.commonService.setAlertMessage("error", "Applicable date cna't be less than " + startDate);
          return;
        }
        let endDate = this.commonService.getPreviousDate(applicableDate, 1);
        routeDetail.route[0]["endDate"] = endDate;
        let dbPath = "Route/" + this.selectedWard + "/" + routeKey + "/Routes/" + key + "/endDate";
        this.db.database.ref(dbPath).set(endDate);
        let lastRouteKey = Number(routeDetail.lastRouteKey) + 1;
        routeDetail.lastRouteKey = lastRouteKey;
        dbPath = "Route/" + this.selectedWard + "/" + routeKey + "/Routes/lastRouteKey";
        this.db.database.ref(dbPath).set(lastRouteKey);
        dbPath = "Route/" + this.selectedWard + "/" + routeKey + "/Routes/" + lastRouteKey + "/startDate";
        this.db.database.ref(dbPath).set(applicableDate);
        let routeLines = [];
        routeDetail.route.push({ key: lastRouteKey, startDate: applicableDate, endDate: "---", routeLines: routeLines });
        routeDetail.route = routeDetail.route.sort((a, b) =>
          Number(b.key) > Number(a.key) ? 1 : -1
        );
        localStorage.setItem("routeLines", JSON.stringify(routeList));
        this.routeList = routeList;
        this.closeModel();
      }
    }
    else {
      let routeDetail = routeList.find(item => item.routeKey == routeKey);
      if (routeDetail != undefined) {
        if (routeDetail.route.length > 1) {
          let preKey = routeDetail.route[1]["key"];
          let startDate = routeDetail.route[1]["startDate"];

          let dat1 = new Date(startDate);
          let dat2 = new Date(applicableDate.toString());
          if (startDate == applicableDate) {
            this.commonService.setAlertMessage("error", "Applicable date cna't be equal than " + startDate);
            return;
          }
          if (dat2 < dat1) {
            this.commonService.setAlertMessage("error", "Applicable date cna't be less than " + startDate);
            return;
          }
          let endDate = this.commonService.getPreviousDate(applicableDate, 1);
          routeDetail.route[1]["endDate"] = endDate;
          let dbPath = "Route/" + this.selectedWard + "/" + routeKey + "/Routes/" + preKey + "/endDate";
          this.db.database.ref(dbPath).set(endDate);
        }
        routeDetail.route[0]["startDate"] = applicableDate;
        let dbPath = "Route/" + this.selectedWard + "/" + routeKey + "/Routes/" + key + "/startDate";
        this.db.database.ref(dbPath).set(applicableDate);
        localStorage.setItem("routeLines", JSON.stringify(routeList));
        this.routeList = routeList;
        this.closeModel();
      }
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
              let routeLines = [];
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
                    let startDate = obj[key]["startDate"];
                    let endDate = "---";
                    if (obj[key]["endDate"] != null) {
                      endDate = obj[key]["endDate"];
                    }
                    if (obj[key]["routeLines"] != null) {
                      let list = data[routeKey]["routeLines"].toString().split(',');
                      if (list.length > 0) {
                        for (let k = 0; k < list.length; k++) {
                          routeLines.push({ lineNo: list[i] });
                        }
                      }
                    }

                    let cssClass = "";
                    if (j == routeArray.length - 2) {
                      cssClass = "active";
                      if (i == 0) {
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
                                strokeWeight: 4
                              }
                              line.setOptions(polyOptions);
                            }
                          }
                        }
                      }
                    }

                    route.push({ key: Number(key), startDate: startDate, endDate: endDate, routeLines: routeLines, cssClass: cssClass });
                  }
                }
              }
              this.routeList.push({ routeKey: routeKey, routeName: routeName, isShow: isShow, route: route, routeLines: routeLines, lastRouteKey: lastRouteKey });
            }
            localStorage.setItem("routeLines", JSON.stringify(this.routeList));
          }
        }
      });
  }

  getRouteSelect(index: any) {
    let routeList = JSON.parse(localStorage.getItem("routeLines"));
    if (routeList != null) {
      this.routeList = routeList;
    }
    if (this.routeList.length > 0) {
      for (let i = 0; i < this.routeList.length; i++) {
        if (i == index) {
          let element = <HTMLInputElement>document.getElementById("chkRoute" + index);
          if (element.checked == true) {
            this.routeList[i]["isShow"] = 1;
            $(this.lblSelectedRoute).html(this.routeList[i]["routeKey"]);
            this.setPolyLineOption(this.routeList[i]["routeLines"]);
          }
          else {
            this.routeList[i]["isShow"] = 0;
            $(this.lblSelectedRoute).html("");
            let list = [];
            this.setPolyLineOption(list);
          }
        }
        else {
          this.routeList[i]["isShow"] = 0;
        }
      }
    }
    localStorage.setItem("routeLines", JSON.stringify(this.routeList));
  }

  setPolyLineOption(lineList: any) {
    if (this.lines.length > 0) {
      for (let i = 0; i < this.lines.length; i++) {
        let strokeColor = this.strockColorNotDone;
        let lineDetail = lineList.find(item => item.lineNo == this.lines[i]["lineNo"]);
        if (lineDetail != undefined) {
          strokeColor = this.strockColorDone;
        }

        let line = new google.maps.Polyline(this.polylines[i]);
        var polyOptions = {
          strokeColor: strokeColor,
          strokeOpacity: 1.0,
          strokeWeight: 4
        }
        line.setOptions(polyOptions);
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
                  this.setClickInstance(line, lineNo, index);
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


  setClickInstance(line: any, lineNo: any, index: any) {
    let dbEvent = this.db;
    let polylines = this.polylines;
    let selectedWard = this.selectedWard;
    let strockColorNotDone = this.strockColorNotDone;
    let strockColorDone = this.strockColorDone;
    let commonServices = this.commonService;
    let lblSelectedRoute = this.lblSelectedRoute;

    google.maps.event.addListener(line, 'click', function (h) {
      let routeKeyElement = $(lblSelectedRoute).html();
      if (routeKeyElement == "") {
        commonServices.setAlertMessage("error", "Please create or select route !!!");
        return;
      }
      let routeKey = routeKeyElement.split('-')[0];
      let key = routeKeyElement.split('-')[1];
      let stockColor = strockColorNotDone;
      let isOtherLine = false;
      let routeName = "";

      let routeLines = JSON.parse(localStorage.getItem("routeLines"));
      if (routeLines == null) {
        routeLines = [];
      }
      /*
      if (routeLines.length > 0) {
        for (let i = 0; i < routeLines.length; i++) {
          if (routeLines[i]["routeKey"] != routeKey) {
            let lineInRoutes = routeLines[i]["route"]["routeLines"];
            let detail = lineInRoutes.find(item => item.lineNo == lineNo);
            if (detail != undefined) {
              isOtherLine = true;
              routeName = routeLines[i]["routeName"];
              i = routeLines.length;
            }
          }
        }
      }
      if (isOtherLine == true) {
        commonServices.setAlertMessage("error", "This line already in " + routeName + " !!!");
        return;
      }
*/
      let routeDetail = routeLines.find(item => item.routeKey == routeKey);
      if (routeDetail != undefined) {
        let routeLinesData = "";
        let route = routeDetail.route;
        let keyDetail = route.find(item => item.key == key);
        if (keyDetail != undefined) {
          let keyRoutesLines = keyDetail.routeLines;
          let lineDetail = keyRoutesLines.find(item => item.lineNo == lineNo);
          if (lineDetail == undefined) {
            keyRoutesLines.push({ lineNo: lineNo });
            stockColor = strockColorDone;
          }
          else {
            let list = keyRoutesLines.filter(item => item.lineNo != lineNo);
            keyRoutesLines = list;
            stockColor = strockColorNotDone;
          }
          keyDetail.routeLines = keyRoutesLines;          

          let list = keyDetail.routeLines;
          for (let i = 0; i < list.length; i++) {
            if (i == 0) {
              routeLinesData = list[i]["lineNo"];
            }
            else {
              routeLinesData = routeLinesData + "," + list[i]["lineNo"];
            }
          }
          dbEvent.database.ref("Route/" + selectedWard + "/" + routeKey + "/Routes/" + key + "/routeLines").set(routeLinesData);
        }
      }
      localStorage.setItem("routeLines", JSON.stringify(routeLines));
      var polyOptions = {
        strokeColor: stockColor,
        strokeOpacity: 1.0,
        strokeWeight: this.strokeWeight
      }
      line.setOptions(polyOptions);
      polylines[index]["strokeColor"] = stockColor;
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

  openModel(content: any, type: any, routeKey: any, key: any) {
    if ($(this.ddlWard).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 250;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    if (type == "createRoute") {
      $(this.txtApplicableDate).val(this.toDayDate);
    }
    else {
      let routeList = JSON.parse(localStorage.getItem("routeLines"));
      let routeName = "";
      let keyData = "";
      let routeDetail = routeList.find(item => item.routeKey == routeKey);
      if (routeDetail != undefined) {
        routeName = routeDetail.routeName;
        let keyList = routeDetail.route;
        let keyDetail = keyList.find(item => item.key == key);
        if (keyDetail != undefined) {
          keyData = keyDetail.startDate;
        }
      }
      if (type == "createNew") {
        $(this.btnUpdate).html("Create New");
        $(this.lblHeading).html("Create New for " + routeName);
        $(this.txtUpdateDate).val(this.toDayDate);
      }
      else {
        $(this.btnUpdate).html("Update");
        $(this.lblHeading).html("Update for " + routeName + " - " + keyData);
        $(this.txtUpdateDate).val(keyData);
      }
      $(this.updateRouteKey).val(routeKey);
      $(this.updateKey).val(key);
    }
  }


  closeModel() {
    this.modalService.dismissAll();
  }
}
