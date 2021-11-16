/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FirebaseService } from "../firebase.service";

//services
import { CommonService } from "../services/common/common.service";
import { MapService } from "../services/map/map.service";
import * as $ from "jquery";
import { ToastrService } from "ngx-toastr";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: "app-line-card-mapping",
  templateUrl: "./line-card-mapping.component.html",
  styleUrls: ["./line-card-mapping.component.scss"],
})
export class LineCardMappingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }

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
  centerPoint: any;
  selectedCardDetails: any[];
  selectedCardCount = 0;
  markerList: any[] = [];
  isFirst = true;
  previousLine: any;
  db: any;
  cityName: any;
  cardDetails: CardDetails = {
    mobile: "",
    address: "",
    cardNo: "",
    colonyName: "",
    createdDate: "",
    houseType: "",
    lat: "",
    line: "",
    lng: "",
    name: "",
    rfid: "",
    ward: "",
    surveyorId: "",
    selectedHouseCount: 0,
    totalCardOnLine: 0,
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.selectedCardDetails = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.setHeight();
    this.getZones();
    this.setMap();
  }

  setHeight() {
    setTimeout(() => {
      $(".navbar-toggler").show();
      $("#divMap").css("height", $(window).height() - 80);
    }, 2000);
  }

  setMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  changeZoneSelection(filterVal: any) {
    this.activeZone = filterVal;
    $("#txtLineNo").val("1");
    this.loadData();
  }

  loadData() {
    this.isFirst = true;
    $("#txtNewLine").val("");
    this.cardDetails.totalCardOnLine = 0;
    this.selectedZone = this.activeZone;
    if (this.selectedZone == undefined || this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    this.polylines = [];
    this.selectedCardDetails = [];
    this.setMap();
    this.getLinesFromJson();
    this.cardDetails.selectedHouseCount = 0;
    this.cardDetails.totalCardOnLine = 0;
  }

  nextPrevious(type: any) {
    if (this.selectedZone == undefined || this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select ward !!!");
      return;
    }
    let currentLine = 1;
    let lineNo = this.previousLine;
    if (lineNo == "") {
      $("#txtLineNo").val(currentLine);
      this.getLineData();
    } else if (type == "next") {
      currentLine = Number(lineNo) + 1;
      $("#txtLineNo").val(currentLine);
      this.getLineData();
    } else {
      if (Number(lineNo) != 1) {
        currentLine = Number(lineNo) - 1;
        $("#txtLineNo").val(currentLine);
        this.getLineData();
      } else {
        this.commonService.setAlertMessage("error", "line number not less than 1 !!!");
      }
    }
  }

  moveToNewLine() {
    if ($("#txtNewLine").val() == "") {
      this.commonService.setAlertMessage("error", "Please enter line no.");
      return;
    }
    if (this.selectedCardDetails.length == 0) {
      this.commonService.setAlertMessage("error", "Please select atleast one card to move");
      return;
    }
    if (this.selectedCardDetails[0]["line"] == $("#txtNewLine").val()) {
      this.commonService.setAlertMessage("error", "Sorry! cards can't be move on same line");
      return;
    }
    let lineNo = $('#txtLineNo').val();
    let newLineNo = $("#txtNewLine").val();

    for (let index = 0; index < this.selectedCardDetails.length; index++) {
      let cardNo = this.selectedCardDetails[index]["cardNo"];
      let data = this.selectedCardDetails[index]["data"];
      data["line"] = $("#txtNewLine").val();

      this.db.object("Houses/" + this.selectedZone + "/" + $("#txtNewLine").val() + "/" + cardNo).set(data);

      let path = "Houses/" + this.selectedZone + "/" + $('#txtLineNo').val() + "/" + cardNo;
      this.db.object(path).remove();

      // modify card ward mapping
      this.db.object("CardWardMapping/" + data["cardNo"]).set({ line: $("#txtNewLine").val(), ward: this.selectedZone, });

      if (data["mobile"] != "") {
        // modify house ward mapping
        this.db.object("HouseWardMapping/" + data["mobile"]).set({ line: $("#txtNewLine").val(), ward: this.selectedZone, });
      }

    }
    setTimeout(() => {
      this.commonService.setAlertMessage("success", "Card moved to Line " + $("#txtNewLine").val() + " successfully");
      $("#txtNewLine").val("");
      this.getLineData();
    }, 3000);
  }

  getLinesFromJson() {
    let wardLineCount = this.commonService.getWardLineCount(this.selectedZone);
    let wardLines = this.db.object("Defaults/WardLines/" + this.selectedZone).valueChanges().subscribe((zoneLine) => {
      wardLines.unsubscribe();
      var linePath = [];
      for (let i = 1; i <= wardLineCount; i++) {
        var line = zoneLine[i];
        if (line == undefined) {
          break;
        }
        var path = [];
        for (let j = 0; j < line.points.length; j++) {
          path.push({ lat: line.points[j][0], lng: line.points[j][1] });
        }

        linePath.push({ lineNo: i, latlng: path, color: "#87CEFA" });
      }
      this.allLines = linePath;
      this.drawAllLines();
    });
  }

  drawAllLines() {
    this.cardDetails.selectedHouseCount = 0;
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
    let requestedLineNo = $("#txtLineNo").val();
    this.previousLine = requestedLineNo;
    for (let index = 0; index < this.allLines.length; index++) {
      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }
      let lineNo = index + 1;
      let lineData = this.allLines.find((item) => item.lineNo == lineNo);
      if (lineData != undefined) {
        let strokeWeight = 2;
        let status = "";
        if (lineNo == requestedLineNo) {
          strokeWeight = 5;
          status = "requestedLine";
        }

        let line = new google.maps.Polyline({
          path: lineData.latlng,
          strokeColor: this.commonService.getLineColor(status),
          strokeWeight: strokeWeight,
        });
        this.polylines[index] = line;
        this.polylines[index].setMap(this.map);
        this.setLineInfo(lineData, lineNo);
      }
    }

    setTimeout(() => {
      let lineNo = $("#txtLineNo").val();
      let firstLine = this.allLines.find(
        (item) => item.lineNo == Number(lineNo)
      );
      this.centerPoint = firstLine.latlng[0];
      if (this.isFirst == true) {
        this.map.setZoom(19);
        this.isFirst = false;
      }
      this.map.setCenter(this.centerPoint);
      this.showHouses(lineNo);
    }, 2000);
  }

  getLineData() {
    this.cardDetails.selectedHouseCount = 0;
    this.cardDetails.totalCardOnLine = 0;
    // previousLine
    let firstLine = this.allLines.find(
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
    let lineNo = $("#txtLineNo").val();
    this.polylines[Number(lineNo) - 1].setMap(null);
    firstLine = this.allLines.find((item) => item.lineNo == Number(lineNo));
    this.centerPoint = firstLine.latlng[0];
    line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor("requestedLine"),
      strokeWeight: 5,
    });
    this.polylines[Number(lineNo) - 1] = line;
    this.polylines[Number(lineNo) - 1].setMap(this.map);
    this.previousLine = lineNo;
    this.map.setCenter(this.centerPoint);
    this.showHouses(lineNo);
  }

  showHouses(lineNo: any) {
    this.cardDetails.totalCardOnLine = 0;
    this.selectedCardDetails = [];
    let housePath = "Houses/" + this.selectedZone + "/" + lineNo;
    if (this.markerList.length > 0) {
      for (let i = 0; i < this.markerList.length; i++) {
        this.markerList[i]["marker"].setMap(null);
      }
    }
    this.markerList = [];
    let housesData = this.db.object(housePath).valueChanges().subscribe((data) => {
      housesData.unsubscribe();
      if (data != null) {
        var keyArray = Object.keys(data);
        for (let index = 0; index < keyArray.length; index++) {
          const cardNo = keyArray[index];
          let cardData = data[cardNo];
          if (cardData["latLng"] != undefined) {
            let latLng = cardData["latLng"].toString().replace("(", "").replace(")", "").split(",");
            let url = "../assets/img/red-home.png";
            if (cardData["phaseNo"] == "1") {
              url = "../assets/img/blue-home.png";
            }
            this.setMarkers(latLng[0], latLng[1], url, cardData, cardNo, lineNo);
          }
        }
      }
    });
  }

  setMarkers(lat: any, lng: any, url: any, cardData: any, cardNo: any, lineNo: any) {
    let isSelected = false;
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      icon: {
        url: url,
      },
    });

    marker.addListener("click", (e) => {
      let lineData = this.selectedCardDetails.find((item) => item.cardNo == cardNo);
      if (lineData == undefined) {
        this.selectedCardDetails.push({
          lineNo: lineNo,
          cardNo: cardNo,
          data: cardData
        });
        isSelected = true;
      } else {
        this.selectedCardDetails = this.selectedCardDetails.filter(
          (item) => item !== lineData
        );
        isSelected = false;
      }
      this.setMarkerAsSelected(marker, isSelected);
      this.cardDetails.selectedHouseCount = this.selectedCardDetails.length;
    });
    marker.setMap(this.map);
    this.markerList.push({ marker });
    this.cardDetails.totalCardOnLine = this.markerList.length;
  }

  setMarkerAsSelected(marker: any, isSelected: boolean) {
    if (isSelected) {
      marker.icon.url = "../assets/img/green-home.png";
    } else {
      marker.icon.url = "../assets/img/red-home.png";
    }
    marker.setMap(null);
    marker.setMap(this.map);
  }

  setLineInfo(lineData: any, lineNo: any) {
    let statusString = '<div style="margin:10px;background-color: white;float: left;">';
    statusString += '<div style="width: 100%;text-align:center;font-size:13px;color:black;font-weight:bold">' + lineNo;
    statusString += "</div></div>";
    var infowindow = new google.maps.InfoWindow({
      content: statusString,
      position: lineData.latlng[0],
    });

    infowindow.open(this.map);

    setTimeout(function () {
      $(".gm-ui-hover-effect").css("display", "none");
      $(".gm-style-iw-c").css("border-radius", "3px").css("padding", "0px");
      $(".gm-style-iw-d").css("overflow", "unset");
    }, 1000);
  }
}

export class CardDetails {
  mobile: string;
  address: string;
  cardNo: string;
  colonyName: string;
  createdDate: string;
  houseType: string;
  lat: string;
  line: string;
  lng: string;
  name: string;
  rfid: string;
  ward: string;
  surveyorId: string;
  selectedHouseCount: number;
  totalCardOnLine: number;
}
