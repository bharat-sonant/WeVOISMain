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
    private router: Router,
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
  lineNo: any;
  cityName: any;
  previousLine: any;
  centerPoint: any;
  houseMarker: any[] = [];

  markerData: markerDetail = {
    totalMarkers: "0",
    totalLines: "0",
    totalLineMarkers: "0",
    approvedLines: "0",
    markerImgURL: "../assets/img/img-not-available-01.jpg",
    houseType: "",
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );
    this.toDayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.toDayDate).getMonth()
    );
    this.lineNo = "1";
    this.previousLine = "1";
    this.setHeight();
    this.getZones();
    this.selectedZone = this.zoneList[1]["zoneNo"];
    this.activeZone = this.zoneList[1]["zoneNo"];
    this.getLineApprove();
    this.setMaps();
    this.setKml();
    this.onSubmit();
  }

  getCurrentLineNo(event: any) {
    if (event.key == "Enter") {
      this.getLineDetail();
    }
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
    this.markerData.totalMarkers = "0";
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
    }
    this.clearAllOnMap();
    this.activeZone = filterVal;
    this.setKml();
    this.onSubmit();
    this.lineNo = 1;
    this.previousLine = 1;
    this.selectedZone = this.activeZone;
    $("#txtLineNo").val(this.lineNo);
    this.getLineApprove();
  }

  onSubmit() {
    this.markerData.houseType="";
    this.markerData.markerImgURL="../assets/img/img-not-available-01.jpg";
    this.selectedZone = this.activeZone;
    this.polylines = [];
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    this.getAllLinesFromJson();
    this.getTotalMarkers();
  }

  getTotalMarkers() {
    let dbPath =
      "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" +
      this.selectedZone +
      "";
    let totalInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        totalInstance.unsubscribe();
        if (data != null) {
          this.markerData.totalMarkers = data["total"].toString();
        }
      });
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

  getApprovedLines() {
    this.markerData.approvedLines = "0";
    let dbPath =
      "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" +
      this.selectedZone +
      "/approved";
    let approvedInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        approvedInstance.unsubscribe();
        if (data != null) {
          this.markerData.approvedLines = data.toString();
        }
      });
  }

  getAllLinesFromJson() {
    this.getApprovedLines();
    this.markerData.totalLines = "0";
    this.lines = [];
    this.polylines = [];
    let wardLineCount = this.db
      .object("WardLines/" + this.selectedZone + "")
      .valueChanges()
      .subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          this.wardLines = Number(lineCount);
          this.markerData.totalLines = lineCount.toString();
          for (let i = 1; i <= Number(lineCount); i++) {
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
                  if (this.lineNo == i.toString()) {
                    this.getMarkedHouses(i);
                  }
                }
              });
          }
        }
      });
  }

  getMarkedHouses(lineNo: any) {
    this.houseMarker = [];
    let dbPath =
      "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
        houseInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length - 1; i++) {
            if (data[i]["latLng"] != undefined) {
              let lat = data[i]["latLng"].split(",")[0];
              let lng = data[i]["latLng"].split(",")[1];
              let imageName = data[i]["image"];
              let type = data[i]["houseType"];
              let dbPath = "Defaults/FinalHousesType/" + type + "/name";
              let houseInstance = this.db
                .object(dbPath)
                .valueChanges()
                .subscribe((data) => {
                  houseInstance.unsubscribe();
                  if (data != null) {
                    let houseType = data.toString().split("(")[0];
                    let markerURL = this.getMarkerIcon(type);
                    this.setMarker(
                      lat,
                      lng,
                      markerURL,
                      houseType,
                      imageName,
                      "marker",
                      lineNo
                    );
                  }
                });
            }
          }
        }
      });
  }

  getMarkerIcon(type: any) {
    let url = "../assets/img/final-marker-2.svg";
    if (type == 1 || type == 19) {
      url = "../assets/img/marking-house.svg";
    } else if (
      type == 2 ||
      type == 3 ||
      type == 6 ||
      type == 7 ||
      type == 8 ||
      type == 9 ||
      type == 10 ||
      type == 20
    ) {
      url = "../assets/img/marking-shop.svg";
    } else if (type == 14 || type == 15) {
      url = "../assets/img/marking-warehouse.svg";
    } else if (type == 21 || type == 22) {
      url = "../assets/img/marking-institute.svg";
    } else if (type == 4 || type == 5) {
      url = "../assets/img/marking-hotel.svg";
    } else if (type == 16 || type == 17) {
      url = "../assets/img/marking-hall.svg";
    } else if (type == 18) {
      url = "../assets/img/marking-thela.svg";
    } else if (type == 11 || type == 12 || type == 13) {
      url = "../assets/img/marking-hospital.svg";
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
        lineStatus.unsubscribe();
        if (wardNo == this.selectedZone) {
          if (this.polylines[index] != undefined) {
            this.polylines[index].setMap(null);
          }
          let strokeWeight = 2;
          let lineColor = "";
          if (lineNo == this.lineNo) {
            strokeWeight = 5;
            status = "requestedLine";
          }
          let line = new google.maps.Polyline({
            path: latlng,
            strokeColor: this.commonService.getLineColor(status),
            strokeWeight: strokeWeight,
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
              "lineNo",
              lineNo
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
    imageName: any,
    type: any,
    lineNo: any
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
          scaledSize: new google.maps.Size(27, 27),
          origin: new google.maps.Point(0, 0),
        },
      });
      let wardNo = this.selectedZone;
      let markerDetail = this.markerData;
      let city = this.commonService.getFireStoreCity();
      marker.addListener("click", function () {
        $("#divLoader").show();
        setTimeout(() => {
          $("#divLoader").hide();
        }, 2000);
        let imageURL =
          "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" +
          city +
          "%2FMarkingSurveyImages%2F" +
          wardNo +
          "%2F" +
          lineNo +
          "%2F" +
          imageName +
          "?alt=media";
        markerDetail.markerImgURL = imageURL;
        markerDetail.houseType = markerLabel;
      });

      this.houseMarker.push({ marker });
    }
  }

  //#region Line Marking Status

  getNextPrevious(type: any) {
    this.markerData.houseType="";
    this.markerData.markerImgURL="../assets/img/img-not-available-01.jpg";
    let lineNo = $("#txtLineNo").val();
    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }

    if (type == "pre") {
      if (lineNo != "1") {
        this.lineNo = Number(lineNo) - 1;
        $("#txtLineNo").val(this.lineNo);
        this.getLineApprove();
        this.getHouseLineData();
      }
    } else if (type == "next") {
      if (Number(lineNo) < this.wardLines) {
        this.lineNo = Number(lineNo) + 1;
        $("#txtLineNo").val(this.lineNo);
        this.getLineApprove();
        this.getHouseLineData();
      }
    }
  }

  getHouseLineData() {
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    // previousLine
    let firstLine = this.lines.find(
      (item) => item.lineNo == Number(this.previousLine)
    );
    this.polylines[Number(this.previousLine) - 1].setMap(null);
    let line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor(""),
      strokeWeight: 2,
    });
    this.polylines[Number(this.previousLine) - 1] = line;
    this.polylines[Number(this.previousLine) - 1].setMap(this.map);

    // new Line
    this.lineNo = $("#txtLineNo").val();
    this.polylines[Number(this.lineNo) - 1].setMap(null);
    firstLine = this.lines.find((item) => item.lineNo == Number(this.lineNo));
    this.centerPoint = firstLine.latlng[0];
    line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor("requestedLine"),
      strokeWeight: 5,
    });
    this.polylines[Number(this.lineNo) - 1] = line;
    this.polylines[Number(this.lineNo) - 1].setMap(this.map);
    this.previousLine = this.lineNo;
    this.map.setCenter(this.centerPoint);
    this.getMarkedHouses(this.lineNo);
  }

  getLineDetail() {
    let lineNo = $("#txtLineNo").val();
    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    if (Number(lineNo) <= this.wardLines) {
      this.lineNo = lineNo;
      this.getLineApprove();
      this.getHouseLineData();
    } else {
      this.commonService.setAlertMessage(
        "error",
        "Line no. not exist in ward !!!"
      );
      this.lineNo = 1;
      $("#txtLineNo").val(this.lineNo);
      this.getLineApprove();
      this.getHouseLineData();
    }
  }

  assignUrl() {
    window.open(
      "/" + this.cityName + "/13B/house-marking-assignment",
      "_blank"
    );
  }

  getLineApprove() {
    this.markerData.totalLineMarkers = "0";
    let dbPath =
      "EntityMarkingData/MarkedHouses/" +
      this.selectedZone +
      "/" +
      this.lineNo +
      "/marksCount";
    let countInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        countInstance.unsubscribe();
        if (data != null) {
          $('#btnSave').show();
          this.markerData.totalLineMarkers = data.toString();
        }
        else
        {
          $('#btnSave').hide();
        }
      });
    dbPath =
      "EntityMarkingData/MarkedHouses/" +
      this.selectedZone +
      "/" +
      this.lineNo +
      "/ApproveStatus";
    let approveInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        approveInstance.unsubscribe();

        if (data != null) {
          //  $("#txtReamrk").val(data["remark"]);
          if (data["status"] == "Confirm") {
            $("#btnSave").html("Reject Line");
          } else {
            $("#btnSave").html("Approve Line");
          }
        } else {
          $("#btnSave").html("Approve Line");
        }
      });
  }

  saveData() {
    let lineNo = $("#txtLineNo").val();
    let lineStatus = $("#btnSave").html();
    let status = "";
    if (lineStatus == "Approve Line") {
      status = "Confirm";
      $("#btnSave").html("Reject Line");
    } else {
      status = "Reject";
      $("#btnSave").html("Approve Line");
    }

    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    this.lineNo = lineNo;
    let dbPath =
      "EntityMarkingData/MarkedHouses/" +
      this.selectedZone +
      "/" +
      this.lineNo +
      "/ApproveStatus";
    const data = {
      status: status,
      //remark: remark,
    };
    this.db.object(dbPath).update(data);
    dbPath =
      "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" +
      this.selectedZone +
      "/approved";
    let approvedInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((dataCount) => {
        approvedInstance.unsubscribe();
        let approvedCount = 1;
        if (dataCount != null) {
          if (status == "Confirm") {
            approvedCount = Number(dataCount) + 1;
          } else {
            approvedCount = Number(dataCount) - 1;
          }
        }
        dbPath =
          "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" +
          this.selectedZone;
        this.db.object(dbPath).update({
          approved: approvedCount,
        });
        setTimeout(() => {
          this.getApprovedLines();
        }, 200);

      });

    this.commonService.setAlertMessage(
      "success",
      "Line approve status updated !!!"
    );
  }

  //#endregion

  assignSurveyor() {
    this.router.navigate([
      "/" + this.cityName + "/13B/house-marking-assignment",
    ]);
  }
}
export class markerDetail {
  totalMarkers: string;
  totalLines: string;
  totalLineMarkers: string;
  approvedLines: string;
  markerImgURL: string;
  houseType: string;
}
