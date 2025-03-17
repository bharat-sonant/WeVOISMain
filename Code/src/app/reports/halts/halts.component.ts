/// <reference types="@types/googlemaps" />
import { Component } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import * as $ from "jquery";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-halts",
  templateUrl: "./halts.component.html",
  styleUrls: ["./halts.component.scss"],
})
export class HaltsComponent {
  require: any;
  public map: google.maps.Map;
  constructor(private router: Router, public httpService: HttpClient, private besuh: BackEndServiceUsesHistoryService, public fs: FirebaseService, private mapService: MapService, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  zoneList: any[];
  selectedDate: any;
  toDayDate: any;
  public selectedZone: any;
  marker = new google.maps.Marker();
  haltInfo: any[];
  minHalt: number;
  zoneKML: any;
  public bounds: any;
  currentMonth: any;
  currentYear: any;
  employeeDetail: any[] = [];
  haltList: any;
  haltDataInfo: any;
  haltDataList: any;
  public mapHalt: google.maps.Map;
  haltMarkerList: any;
  fixdGeoLocations: any;
  preSelectedMarker: any;
  cityName: any;
  ishaltDisableAccess = false;
  serviceName = "halt";
  allowHaltTime: any;
  haltDetails: haltDetail = {
    zoneName: "---",
    driverName: "---",
    driverMobile: "---",
    helperName: "---",
    helperMobile: "---",
    totalBreakHours: "00:00",
    wardHalt: "00.00"
  };
  wardDutyOnOffList: any[] = [];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Monitoring", "Halts", localStorage.getItem("userID"));
    if (localStorage.getItem("haltDisableAccess") == "1") {
      this.ishaltDisableAccess = true;
    }
    this.bounds = new google.maps.LatLngBounds();
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.commonService.setTodayDate();
    $("#txtDate").val(this.selectedDate);
    this.currentMonth = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    this.currentYear = new Date(this.selectedDate).getFullYear();
    this.getAllowedHalt();
  }

  getAllowedHalt() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSettings%2FHaltSetting.json?alt=media";
    let haltJsonInstance = this.httpService.get(path).subscribe(haltJsonData => {
      haltJsonInstance.unsubscribe();
      if (haltJsonData != null) {
        if (haltJsonData["allowedHalt"] != null) {
          this.minHalt = Number(haltJsonData["allowedHalt"]);
        }
        else {
          this.minHalt = 5;
        }
      }
      else {
        this.minHalt = 5;
      }
      this.setMapHeight();
      this.getZoneList();
      this.getWardDutyOnOffList();
    });

  }

  setMapHeight() {
    let windowHeight = $(window).height();
    let mapHeight = windowHeight - 155 + "px";
    $("#haltMap").css("height", mapHeight);
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getZones(this.selectedDate);
  }

  getWardDutyOnOffList() {
    this.wardDutyOnOffList = [];
    const promises = [];
    for (let i = 0; i < this.zoneList.length; i++) {
      promises.push(Promise.resolve(this.getWardDutyOnOffTime(this.zoneList[i].zoneNo, this.zoneList[i].zoneName)));
    }
    Promise.all(promises).then((results) => {
      for (let i = 0; i < results.length; i++) {
        if (results[i]["status"] == "success") {
          let detail = this.zoneList.find(item => item.zoneNo == results[i]["data"].zoneNo);
          if (detail != undefined) {
            if (detail.startTime != "") {
              this.wardDutyOnOffList.push({ zoneNo: results[i]["data"].zoneNo, zoneName: results[i]["data"].zoneName, startTime: results[i]["data"].startTime, endTime: results[i]["data"].endTime });
            }
          }
        }
      }
      this.getHaltList();
    });
  }

  getWardDutyOnOffTime(zoneNo: any, zoneName: any) {
    return new Promise((resolve) => {
      let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.selectedDate + "/Summary";
      let instance = this.db.object(dbPath).valueChanges().subscribe(data => {
        instance.unsubscribe();
        if (data != null) {
          let startTime = data["dutyInTime"] ? data["dutyInTime"].split(",")[0] : "";
          let endTime = data["dutyOutTime"] ? data["dutyOutTime"].split(",")[data["dutyOutTime"].split(",").length - 1] : "";
          resolve({ status: "success", data: { zoneNo: zoneNo, zoneName: zoneName, startTime: startTime, endTime: endTime } });
        }
        else {
          resolve({ status: "success", data: { zoneNo: zoneNo, zoneName: zoneName, startTime: "", endTime: "" } });
        }
      });

    });
  }





  getHaltList() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getHaltList");
    this.haltList = [];
    this.haltDataInfo = [];
    this.haltDetails.wardHalt = "00.00";
    let totalWardHalts = 0;
    if (this.wardDutyOnOffList.length > 0) {
      for (let i = 1; i < this.wardDutyOnOffList.length; i++) {
        let haltInfoPath = "HaltInfo/" + this.wardDutyOnOffList[i]["zoneNo"] + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.selectedDate;
        let haltInfoData = this.db.list(haltInfoPath).valueChanges().subscribe((haltData) => {
          haltInfoData.unsubscribe();
          let zoneNo = this.wardDutyOnOffList[i]["zoneNo"];
          let startTime = this.wardDutyOnOffList[i]["startTime"];
          let endTime = this.wardDutyOnOffList[i]["endTime"];

          //let zoneName = this.zoneList[i]["zoneName"].replace("Ward ", "");
          let zoneName = this.wardDutyOnOffList[i]["zoneName"];
          let totalBreak = 0;
          if (this.wardDutyOnOffList[i]["startTime"] != "") {
            if (haltData.length > 0) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getHaltList", haltData);
              let sTime = new Date(this.selectedDate + " " + startTime);
              let eTime = new Date(this.selectedDate);
              if (endTime !== "") {
                eTime = new Date(this.selectedDate + " " + endTime);
              }
              for (let index = 0; index < haltData.length; index++) {
                if (haltData[index]["haltType"] != "network-off") {
                  if (haltData[index]["location"] != null) {
                    let haltStartTime = haltData[index]["startTime"];
                    let haltTime = new Date(this.selectedDate + " " + haltStartTime);
                    if (this.selectedDate == this.toDayDate) {
                      if (haltTime >= sTime) {
                        let duration = haltData[index]["duration"] ? haltData[index]["duration"] : 0;
                        if (Number(duration) > this.minHalt) {
                          totalBreak += duration;
                        }
                        let removeReason = "0";
                        let canRemove = "yes";
                        let remark = "";
                        if (haltData[index]["canRemove"] != null) {
                          canRemove = haltData[index]["canRemove"];
                        }
                        if (haltData[index]["removeReason"] != null) {
                          removeReason = haltData[index]["removeReason"];
                        }
                        if (haltData[index]["remark"] != null) {
                          remark = haltData[index]["remark"];
                        }
                        let latlng = haltData[index]["location"].split(":")[1].split(",");
                        let lt = $.trim(latlng[0]).replace("(", "");
                        let lg = $.trim(latlng[1]).replace(")", "");
                        this.haltDataInfo.push({
                          index: index,
                          zoneNo: zoneNo,
                          time: haltData[index]["startTime"],
                          duration: duration,
                          type: haltData[index]["haltType"],
                          location: haltData[index]["locality"],
                          lat: lt,
                          lng: lg,
                          removeReason: removeReason,
                          canRemove: canRemove,
                          remark: remark,
                          ishaltDisableAccess: this.ishaltDisableAccess
                        });
                      }
                    }
                    else {
                      if (haltTime >= sTime && haltTime <= eTime) {
                        let duration = haltData[index]["duration"] ? haltData[index]["duration"] : 0;
                        if (haltData[index]["endTime"] != null) {
                          let endHaltTime = new Date(this.selectedDate + " " + haltData[index]["endTime"]);
                          if (eTime > endHaltTime) {
                            duration = this.commonService.timeDifferenceMin(endHaltTime, haltTime);
                          }
                          else {
                            duration = 0;
                          }
                        }
                        else {
                          duration = 0;
                        }

                        if (Number(duration) > this.minHalt) {
                          totalBreak += duration;
                        }
                        let removeReason = "0";
                        let canRemove = "yes";
                        let remark = "";
                        if (haltData[index]["canRemove"] != null) {
                          canRemove = haltData[index]["canRemove"];
                        }
                        if (haltData[index]["removeReason"] != null) {
                          removeReason = haltData[index]["removeReason"];
                        }
                        if (haltData[index]["remark"] != null) {
                          remark = haltData[index]["remark"];
                        }
                        let latlng = haltData[index]["location"].split(":")[1].split(",");
                        let lt = $.trim(latlng[0]).replace("(", "");
                        let lg = $.trim(latlng[1]).replace(")", "");
                        this.haltDataInfo.push({
                          index: index,
                          zoneNo: zoneNo,
                          time: haltData[index]["startTime"],
                          duration: duration,
                          type: haltData[index]["haltType"],
                          location: haltData[index]["locality"],
                          lat: lt,
                          lng: lg,
                          removeReason: removeReason,
                          canRemove: canRemove,
                          remark: remark,
                          ishaltDisableAccess: this.ishaltDisableAccess
                        });
                      }
                    }
                  }

                }
              }
            }
          }
          let divClass = this.getClass(totalBreak, "divClass");
          let haltClass = this.getClass(totalBreak, "haltClass");
          let displayIndex = 1;
          if (totalBreak == 0) {
            displayIndex = 2;
          }
          totalWardHalts = totalWardHalts + totalBreak;
          this.haltDetails.wardHalt = this.commonService.getHrs(totalWardHalts);
          this.haltList.push({
            zoneNo: zoneNo,
            zoneName: zoneName,
            totalBreak: totalBreak,
            totalBreakHours: this.commonService.getHrs(totalBreak),
            divClass: divClass,
            haltClass: haltClass,
            displayIndex: displayIndex,
          });
          // this.haltList = this.commonService.transform(this.haltList, "displayIndex");
          if (this.haltList.length == this.zoneList.length - 1) {
            let haltDetail = this.haltList.find(
              (item) => item.totalBreak > 0
            );
            if (haltDetail != undefined) {
              this.getZoneDetail(haltDetail.zoneNo);
            }
          }
        });

      }
    }
  }

  getZoneDetail(zoneNo: any) {
    this.selectedZone = zoneNo;
    this.getEmployee(zoneNo);
    this.setMapHalt();
    setTimeout(() => {
      this.setWardBoundary(zoneNo);
    }, 200);
    this.getFixedGeoLocation();
    this.haltDataList = [];
    this.haltMarkerList = [];
    let haltDetail = this.haltList.find((item) => item.zoneNo == zoneNo);
    if (haltDetail != undefined) {
      this.haltDetails.zoneName = haltDetail.zoneName;
      this.haltDetails.totalBreakHours = haltDetail.totalBreakHours;
    }
    for (let i = 0; i < this.haltDataInfo.length; i++) {
      if (this.haltDataInfo[i]["zoneNo"] == zoneNo) {
        let divClass = this.getClass(0, "listClass");
        let haltClass = this.getClass(this.haltDataInfo[i]["duration"], "haltClass");
        if (this.haltDataList.length == 0) {
          divClass = this.getClass(1, "listClass");
        }
        let lat = this.haltDataInfo[i]["lat"];
        let lng = this.haltDataInfo[i]["lng"];
        let location = this.haltDataInfo[i]["location"];
        let time = this.haltDataInfo[i]["time"];
        let duration = this.haltDataInfo[i]["duration"];
        let type = this.haltDataInfo[i]["type"];
        let remark = this.haltDataInfo[i]["remark"];
        let index = this.haltDataInfo[i]["index"];
        let imageUrl =
          "../../../assets/img/" + this.getMarkerName(duration) + ".svg";
        let removeReason = "0";
        let canRemove = "yes";
        if (this.haltDataInfo[i]["canRemove"] != null) {
          canRemove = this.haltDataInfo[i]["canRemove"];
        }
        if (this.haltDataInfo[i]["removeReason"] != null) {
          removeReason = this.haltDataInfo[i]["removeReason"];
        }

        let height = 50;
        let point1 = 25;
        let point2 = 31;
        let isAnimation = false;
        if (this.haltDataList.length == 0) {
          isAnimation = true;
          height = 90;
          point1 = 45;
          point2 = 50;
          this.preSelectedMarker = 0;
        }
        this.haltDataList.push({ index: index, id: i, time: time, duration: duration, type: type, location: location, lat: lat, lng: lng, divClass: divClass, haltClass: haltClass, removeReason: removeReason, canRemove: canRemove, remark: remark, ishaltDisableAccess: this.ishaltDisableAccess });
        this.setMarker(0, lat, lng, duration, time, imageUrl, height, point1, point2, "", "", "halt", isAnimation);
      }
    }
  }

  getFixedGeoLocation() {
    this.fixdGeoLocations = JSON.parse(localStorage.getItem("fixedLocation"));
    if (this.fixdGeoLocations != null) {
      for (let i = 0; i < this.fixdGeoLocations.length; i++) {
        let Lat = this.fixdGeoLocations[i]["lat"];
        let Lng = this.fixdGeoLocations[i]["lng"];
        let imageUrl = "../../../assets/img/" + this.fixdGeoLocations[i]["img"];
        let height = 50;
        let point1 = 25;
        let point2 = 31;
        this.setMarker(0, Lat, Lng, 0, 0, imageUrl, height, point1, point2, this.fixdGeoLocations[i]["name"], this.fixdGeoLocations[i]["address"], "fixed", false);
      }
    }
  }

  getHaltMap(index: any) {
    let i = this.preSelectedMarker;
    this.haltMarkerList[i]["marker"].setMap(null);
    let height = 50;
    let point1 = 25;
    let point2 = 31;
    this.haltDataList[i]["divClass"] = this.getClass(0, "listClass");
    let isAnimation = false;
    let lt = this.haltDataList[i]["lat"];
    let lg = this.haltDataList[i]["lng"];
    let time = this.haltDataList[i]["time"];
    let duration = this.haltDataList[i]["duration"];
    let imageUrl =
      "../../../assets/img/" + this.getMarkerName(duration) + ".svg";
    this.bounds.extend({ lat: Number(lt), lng: Number(lg) });
    this.setMarker(i, lt, lg, duration, time, imageUrl, height, point1, point2, "", "", "preSelected", isAnimation);

    i = index;
    this.haltMarkerList[i]["marker"].setMap(null);
    this.preSelectedMarker = index;
    height = 90;
    point1 = 45;
    point2 = 50;
    isAnimation = true;
    this.haltDataList[i]["divClass"] = this.getClass(1, "listClass");
    lt = this.haltDataList[i]["lat"];
    lg = this.haltDataList[i]["lng"];
    time = this.haltDataList[i]["time"];
    duration = this.haltDataList[i]["duration"];
    imageUrl = "../../../assets/img/" + this.getMarkerName(duration) + ".svg";
    this.bounds.extend({ lat: Number(lt), lng: Number(lg) });
    this.setMarker(i, lt, lg, duration, time, imageUrl, height, point1, point2, "", "", "selected", isAnimation);
  }

  setMarker(i: any, lat: any, lng: any, duration: any, time: any, imageUrl: any, height: any, point1: any, point2: any, name: any, location: any, type: any, isAnimation: any) {
    let lt = lat;
    let lg = lng;
    let markerURL = imageUrl;
    var markerLabel = duration;
    if (type == "fixed") {
      markerLabel = "";
    }
    let marker = new google.maps.Marker({
      position: { lat: Number(lt), lng: Number(lg) },
      map: this.mapHalt,
      label: {
        text: " " + markerLabel + " ",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
      },
      icon: {
        url: markerURL,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(height, height),
        origin: new google.maps.Point(0, 0),
        labelOrigin: new google.maps.Point(point1, point2),
      },
    });

    let contentString = "Start Time : " + time + " <br/> Break Time : " + duration;
    if (type == "fixed") {
      contentString = "<b>" + name + "</b>: " + location;
    }

    let infowindow = new google.maps.InfoWindow({
      content: contentString,
    });
    if (isAnimation == true) {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }

    marker.addListener("click", function () {
      infowindow.open(this.mapHalt, marker);
    });
    if (type == "halt") {
      this.haltMarkerList.push({ marker });
    } else if (type == "selected" || type == "preSelected") {
      this.haltMarkerList[i]["marker"] = marker;
    }
  }

  getEmployee(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getEmployee");
    let zoneDetail = this.zoneList.find((item) => item.zoneNo == zoneNo);
    if (zoneDetail != undefined) {
      if (zoneDetail.driverId == null) {
        let workerDataPath = "WasteCollectionInfo/" + zoneNo + "/" + this.currentYear + "/" + this.currentMonth + "/" + this.selectedDate + "/WorkerDetails";
        let workerDetails = this.db.object(workerDataPath).valueChanges().subscribe((workerInfo) => {
          workerDetails.unsubscribe();
          if (workerInfo != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getEmployee", workerInfo);
            let driverList = workerInfo["driver"].toString().split(",");
            let helperList = workerInfo["helper"].toString().split(",");
            let driverId = driverList[driverList.length - 1].trim();
            let helperId = helperList[helperList.length - 1].trim();
            zoneDetail.driverId = driverId;
            zoneDetail.helperId = helperId;
            this.commonService.getEmplyeeDetailByEmployeeId(driverId).then((employee) => {
              zoneDetail.driverName = employee["name"];
              zoneDetail.driverMobile = employee["mobile"];
              this.haltDetails.driverName = employee["name"];
              this.haltDetails.driverMobile = employee["mobile"];
            });
            this.commonService.getEmplyeeDetailByEmployeeId(helperId).then((employee) => {
              zoneDetail.helperName = employee["name"];
              zoneDetail.helperMobile = employee["mobile"];
              this.haltDetails.helperName = employee["name"];
              this.haltDetails.helperMobile = employee["mobile"];
            });
          }
        });
      } else {
        this.haltDetails.driverName = zoneDetail.driverName;
        this.haltDetails.driverMobile = zoneDetail.driverMobile;
        this.haltDetails.helperName = zoneDetail.helperName;
        this.haltDetails.helperMobile = zoneDetail.helperMobile;
      }
    }
  }

  getClass(totalBreak: any, classType) {
    let className = "";
    // right ward list class
    if (classType == "divClass") {
      if (totalBreak == 0) {
        className = "ward-header disabled";
      } else {
        className = "ward-header";
      }
    }
    // halt color class
    if (classType == "haltClass") {
      if (totalBreak <= 10) {
        className = "success-halt";
      } else if (totalBreak > 10 && totalBreak <= 20) {
        className = "warning-halt";
      } else if (totalBreak > 20) {
        className = "danger-halt";
      }
    }
    // halt list class
    if (classType == "listClass") {
      if (totalBreak == 0) {
        className = "halt-bg";
      } else {
        className = "halt-bg active";
      }
    }
    return className;
  }

  getMarkerName(breakTime: number) {
    let markerColor: any;
    if (breakTime <= 10) {
      markerColor = "green";
    } else if (breakTime > 10 && breakTime <= 20) {
      markerColor = "orange";
    } else {
      markerColor = "red";
    }
    return markerColor;
  }

  setMapHalt() {
    var mapstyle = new google.maps.StyledMapType([
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ]);

    let mapProp = this.commonService.initMapProperties();
    this.mapHalt = new google.maps.Map(
      document.getElementById("haltMap"),
      mapProp
    );
  }

  setWardBoundary(wardNo: string) {
    this.commonService.getWardBoundary(wardNo, this.zoneKML, 2).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.mapHalt);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.mapHalt.fitBounds(bounds);
    });
  }

  setDate(filterVal: any, type: any) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $('#txtDate').val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.currentMonth = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
        this.currentYear = this.selectedDate.split("-")[0];
        this.getWardDutyOnOffList();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  showHaltSummary() {
    this.router.navigate(["/" + this.cityName + "/10B4/halt-summary"]);
  }

  //#region  disable halts start

  closeModel() {
    this.modalService.dismissAll();
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 240;
    let width = 350;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    for (let i = 0; i < this.haltDataList.length; i++) {
      if (i == id) {
        $("#txtRemark").val(this.haltDataList[i]["remark"]);
      }
    }
    if (type == "disable") {
      $("#btnRemark").val("Disable Halt");
    } else {
      $("#btnRemark").val("Enable Halt");
    }
    $("#type").val(type);
    $("#haltId").val(id);
  }

  saveRemark() {
    let id = Number($("#haltId").val());
    let time = this.haltDataList[id]["time"];
    let remark = $("#txtRemark").val();

    let monthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    let year = new Date(this.selectedDate).getFullYear();

    let dbPath = "HaltInfo/" + this.selectedZone + "/" + year + "/" + monthName + "/" + this.selectedDate + "/" + time;
    if ($("#type").val() == "disable") {
      // if ($("#txtRemark").val() == "") {
      //   this.commonService.setAlertMessage("error", "Please enter remark !!!");
      //   return;
      // }

      this.db.object(dbPath).update({ canRemove: "no", remark: remark, });

      this.haltDataList[id]["canRemove"] = "no";
      this.haltDataList[id]["remark"] = remark;
      let index = this.haltDataList[id]["index"];
      let haltDetail = this.haltDataInfo.find((item) => item.index == index && item.zoneNo == this.selectedZone);
      if (haltDetail != undefined) {
        haltDetail.canRemove = "no";
        haltDetail.remark = remark;
      }

      this.commonService.setAlertMessage("success", "halt disabled successfully !!!");
    } else {
      this.db.object(dbPath).update({ canRemove: "yes", remark: remark, });
      this.haltDataList[id]["canRemove"] = "yes";
      this.haltDataList[id]["remark"] = $("#txtRemark").val();
      let index = this.haltDataList[id]["index"];
      let haltDetail = this.haltDataInfo.find((item) => item.index == index && item.zoneNo == this.selectedZone);
      if (haltDetail != undefined) {
        haltDetail.canRemove = "yes";
        haltDetail.remark = $("#txtRemark").val();
      }

      this.commonService.setAlertMessage("success", "halt enabled successfully !!!");
    }
    $("#txtRemark").val("");
    $("#type").val("0");
    $("#haltId").val("0");
    this.closeModel();
  }

  //#endregion disable halts end
}
export class haltDetail {
  zoneName: string;
  driverName: string;
  driverMobile: string;
  helperName: string;
  helperMobile: string;
  totalBreakHours: string;
  wardHalt: string;
}
