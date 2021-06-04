/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { HttpClient } from '@angular/common/http';

//services
import { CommonService } from '../services/common/common.service';
import { MapService } from '../services/map/map.service';
import * as $ from "jquery";
import { ToastrService } from 'ngx-toastr';
import { conditionallyCreateMapObjectLiteral } from '@angular/compiler/src/render3/view/util';

@Component({
  selector: 'app-line-card-mapping',
  templateUrl: './line-card-mapping.component.html',
  styleUrls: ['./line-card-mapping.component.scss']
})
export class LineCardMappingComponent {

  @ViewChild('gmap', null) gmap: any;
  public map: google.maps.Map;

  constructor(public db: AngularFireDatabase, public httpService: HttpClient, private mapService: MapService, private commonService: CommonService, private toastr: ToastrService) { }

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

  cardDetails: CardDetails =
    {
      mobile: '',
      address: '',
      cardNo: '',
      colonyName: '',
      createdDate: '',
      houseType: '',
      lat: '',
      line: '',
      lng: '',
      name: '',
      rfid: '',
      ward: '',
      surveyorId: '',
      selectedHouseCount: 0,
      totalCardOnLine: 0
    };

  ngOnInit() {

    this.selectedCardDetails = [];
    this.toDayDate = this.commonService.setTodayDate();
    this.setHeight();
    this.getZones();
    this.setMap();
  }

  setHeight() {
    setTimeout(() => {
      $('.navbar-toggler').show();
      $('#divMap').css("height", $(window).height() - 80);
    }, 2000);

  }

  setMap() {
    let mapProp = this.commonService.initMapProperties()
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  setKml() {
    this.db.object('Defaults/KmlBoundary/' + this.selectedZone).valueChanges().subscribe(
      wardPath => {
        new google.maps.KmlLayer({
          url: wardPath.toString(),
          map: this.map
        });
      });
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }

  changeZoneSelection(filterVal: any) {
    this.activeZone = filterVal;
  }

  loadData() {
    $("#txtNewLine").val('');
    this.selectedZone = this.activeZone;
    this.polylines = [];
    this.selectedCardDetails = [];
    this.setMap();
    this.getLinesFromJson();
    this.cardDetails.selectedHouseCount = this.selectedCardDetails.length;
  }

  moveToNewLine() {

    if ($("#txtNewLine").val() == "") {
      this.showMessagebox("Please enter line no.");
    } else {

      if (this.selectedCardDetails.length == 0) {
        this.showMessagebox("Please select atleast one card to move");
      }

      for (let index = 0; index < this.selectedCardDetails.length; index++) {
        const element = this.selectedCardDetails[index];
        let cardNo = element["cardNo"];
        let mobile = element["mobile"];
        let surveyorId = element["surveyorId"];
        if (element["surveyorId"] == undefined) {
          surveyorId = "";
        }

        let createdDate = element["createdDate"];
        if (element["createdDate"] == undefined) {
          createdDate = "";
        }

        let approverId = element["approverId"];
        if (element["approverId"] == undefined) {
          approverId = "";
        }

        let approvingDate = element["approvingDate"];
        if (element["approvingDate"] == undefined) {
          approvingDate = "";
        }

        let isApproved = element["isApproved"];
        if (element["isApproved"] == undefined) {
          isApproved = "";
        }




        this.db.object('Houses/' + this.selectedZone + '/' + $("#txtNewLine").val() + '/' + cardNo).set({
          address: element["address"] == undefined ? "" : element["address"],
          approverId: approverId,
          approvingDate: approvingDate,
          cardNo: element["cardNo"] == undefined ? "" : element["cardNo"],
          cardType: element["cardType"] == undefined ? "" : element["cardType"],
          colonyName: element["colonyName"] == undefined ? "" : element["colonyName"],
          createdDate: createdDate,
          houseType: element["houseType"] == undefined ? "" : element["houseType"],
          isApproved: isApproved,
          isNameCorrect: element["isNameCorrect"] == undefined ? "" : element["isNameCorrect"],
          latLng: element["latLng"] == undefined ? "" : element["latLng"],
          line: $("#txtNewLine").val(),
          mobile: element["mobile"] == undefined ? "" : element["mobile"],
          name: element["name"] == undefined ? "" : element["name"],
          phaseNo: element["phaseNo"] == undefined ? "" : element["phaseNo"],
          rfid: element["rfid"] == undefined ? "" : element["rfid"],
          surveyorId: surveyorId,
          ward: element["ward"] == undefined ? "" : element["ward"],

        });


        let path = 'Houses/' + this.selectedZone + '/' + element["line"] + '/' + cardNo;
        this.db.object(path).remove();

        // modify card ward mapping
        this.db.object('CardWardMapping/' + element["cardNo"]).set({
          line: $("#txtNewLine").val(),
          ward: this.selectedZone
        });

        if (mobile != "") {
          // modify house ward mapping
          this.db.object('HouseWardMapping/' + mobile).set({
            line: $("#txtNewLine").val(),
            ward: this.selectedZone
          });
        }

        setTimeout(() => {
          this.loadData();
        }, 3000);
      }
    }



  }

  showMessagebox(message: string) {
    let toast = this.toastr.error('<span class="now-ui-icons ui-1_bell-53"></span> ' + message + '.', '', {
      disableTimeOut: true,
      closeButton: true,
      enableHtml: true,
      toastClass: "alert alert-danger alert-with-icon",
      positionClass: 'toast-bottom-right',
      tapToDismiss: false
    });
  }

  getLinesFromJson() {
    let wardLines = this.db.object('Defaults/WardLines/' + this.selectedZone).valueChanges().subscribe(
      zoneLine => {

        var linePath = [];
        for (let i = 1; i < 10000; i++) {

          var line = zoneLine[i];
          if (line == undefined) { break; }
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

    this.polylines = [];
    let requestedLineNo = $("#txtLineNo").val();

    for (let index = 0; index < this.allLines.length; index++) {

      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }

      let lineNo = index + 1;

      let lineData = this.allLines.find(item => item.lineNo == lineNo);

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
          strokeWeight: strokeWeight
        });

        this.polylines[index] = line;
        this.polylines[index].setMap(this.map);
        this.setLineInfo(lineData, lineNo);
      }
    }

    setTimeout(() => {

      let lineNo = $("#txtLineNo").val();
      let firstLine = this.allLines.find(item => item.lineNo == Number(lineNo));
      this.centerPoint = firstLine.latlng[0];
      this.map.setZoom(19);
      this.map.setCenter(this.centerPoint);
      this.showHouses(lineNo)
    }, 2000);

  }

  showHouses(lineNo: any) {

    this.selectedCardDetails = [];
    let housePath = 'Houses/' + this.selectedZone + '/' + lineNo;
    let isSelected = false;
    let markers = [];
    let housesData = this.db.object(housePath).valueChanges().subscribe(
      data => {

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
              //if (cardData["phaseNo"] == "2") {
              let marker = new google.maps.Marker({
                position: { lat: Number(latLng[0]), lng: Number(latLng[1]) },
                icon: {
                  url: url,
                }
              });

              marker.addListener('click', (e) => {
                let lineData = this.selectedCardDetails.find(item => item.cardNo == cardData["cardNo"]);
                if (lineData == undefined) {
                  this.selectedCardDetails.push({
                    address: cardData["address"],
                    cardNo: cardData["cardNo"],
                    cardType: cardData["cardType"],
                    colonyName: cardData["colonyName"],
                    createdDate: cardData["createdDate"],
                    houseType: cardData["houseType"],
                    isNameCorrect: cardData["isNameCorrect"],
                    latLng: cardData["latLng"],
                    line: cardData["line"],
                    mobile: cardData["mobile"],
                    name: cardData["name"],
                    phaseNo: cardData["phaseNo"],
                    rfid: cardData["rfid"],
                    surveyorId: cardData["surveyorId"],
                    ward: cardData["ward"],
                    approverId: cardData["approverId"],
                    approvingDate: cardData["approvingDate"],
                    isApproved: cardData["isApproved"],
                  });

                  isSelected = true;
                } else {
                  this.selectedCardDetails = this.selectedCardDetails.filter(item => item !== lineData);
                  isSelected = false;
                }

                this.setMarkerAsSelected(markers, latLng[0], latLng[1], isSelected);
                this.cardDetails.selectedHouseCount = this.selectedCardDetails.length;

              });

              markers.push(marker);
              this.plotAllMarkers(markers);
              //}
            }
          }
        }
      });
  }

  plotAllMarkers(markers: any) {

    this.cardDetails.totalCardOnLine = markers.length;
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(this.map);
    }
  }

  setMarkerAsSelected(markers: any, lat: string, lng: string, isSelected: boolean) {


    for (var i = 0; i < markers.length; i++) {
      let marketLat = markers[i].position.lat();
      let markerLng = markers[i].position.lng();
      if (marketLat == lat && markerLng == lng) {
        if (isSelected) {
          markers[i].icon.url = "../assets/img/green-home.png";
        } else {
          markers[i].icon.url = "../assets/img/red-home.png";
        }

        markers[i].setMap(null);
        markers[i].setMap(this.map);
      }
    }
  }

  setLineInfo(lineData: any, lineNo: any) {

    let statusString = '<div style="margin:10px;background-color: white;float: left;">';
    statusString += '<div style="width: 100%;text-align:center;font-size:13px;color:black;font-weight:bold">' + lineNo;
    statusString += '</div></div>';
    var infowindow = new google.maps.InfoWindow({
      content: statusString,
      position: lineData.latlng[0]
    });

    infowindow.open(this.map);

    setTimeout(function () {
      $('.gm-ui-hover-effect').css("display", "none");
      $('.gm-style-iw-c').css("border-radius", "3px").css("padding", "0px");
      $('.gm-style-iw-d').css("overflow", "unset");
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


