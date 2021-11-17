/// <reference types="@types/googlemaps" />

import { Component, ViewChild, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-jmaps-test-purpose',
  templateUrl: './jmaps-test-purpose.component.html',
  styleUrls: ['./jmaps-test-purpose.component.scss']
})
export class JmapsTestPurposeComponent implements OnInit {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  public selectedWard: any;
  wardList: any[];
  marker = new google.maps.Marker();
  cityName: any;
  toDayDate: any;
  selectedDate: any;
  currentMonthName: any;
  currentYear: any;
  wardLines: any;
  lines: any[];
  polylines = [];
  vtsPolylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  wardBoundary: any;
  strokeWeight = 4;
  vehicleList: any[];
  zoneList: any[];
  wardLineLengthList: any[];
  userId: any;
  isBoundaryShow = true;
  isLineShow = true;
  strockColorNotDone = "#fa0505";
  strockColorDone = "#0ba118";
  progressData: progressDetail = {
    totalWardLength: 0,
    wardLength: "0",
    coveredLength: "0",
    workPercentage: "0%",
    coveredLengthMeter: 0,
    workPercentageNumber: 0,
    penalty: 0,
    lastShowDate: this.commonService.getTodayDateTime()
  };

  showBoundries = "#showBoundries";
  showBoundriesNav = "#showBoundriesNav";
  showLines = "#showLines";
  showLinesNav = "#showLinesNav";
  ddlZone = "#ddlZone";
  ddlZoneNav = "#ddlZoneNav";
  txtDate = "#txtDate";
  txtDateNav = "#txtDateNav";
  txtPreDate = "#txtPreDate";
  txtPreDateNav = "#txtPreDateNav";
  txtStrokeWeight = "#txtStrokeWeight";
  txtStrokeWeightNav = "#txtStrokeWeightNav";
  iconDone = "#iconDone";
  iconPending = "#iconPending";
  iconDoneNav = "#iconDoneNav";
  iconPendingNav = "#iconPendingNav";
  txtPenalty = "#txtPenalty";
  txtPenaltyNav = "#txtPenaltyNav";
  ddlWard = "#ddlWard";
  ddlWardNav = "#ddlWardNav";
  txtVehicle = "#txtVehicle";
  txtVehicleNav = "#txtVehicleNav";
  divLoader = "#divLoader";

  ngOnInit() {
    
  }

}

export class progressDetail {
  totalWardLength: number;
  wardLength: string;
  coveredLength: string;
  workPercentage: string;
  coveredLengthMeter: number;
  workPercentageNumber: number;
  penalty: number;
  lastShowDate: string;
}