/// <reference types="@types/googlemaps" />

import { Component, ViewChild } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-ward-survey-analysis",
  templateUrl: "./ward-survey-analysis.component.html",
  styleUrls: ["./ward-survey-analysis.component.scss"],
})
export class WardSurveyAnalysisComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(
    public db: AngularFireDatabase,
    public af: AngularFireModule,
    public httpService: HttpClient,
    private actRoute: ActivatedRoute,
    private mapService: MapService,
    private commonService: CommonService
  ) {}

  public selectedZone: any;
  zoneList: any[];
  toDayDate: any;
  currentYear: any;
  currentMonthName: any;
  zoneKML: any;
  progressData: progressDetail = {
    totalMarkers: 0,
    scannedMarkers: 0,
  };
  ngOnInit() {
    this.toDayDate = this.commonService.setTodayDate();
    this.currentYear = new Date().getFullYear();
    this.currentMonthName = this.commonService.getCurrentMonthName(
      new Date(this.toDayDate).getMonth()
    );
    this.setHeight();
    this.getZones();
    const id = this.actRoute.snapshot.paramMap.get("id");
    if (id != null) {
      this.selectedZone = id.trim();
      this.setMaps();
      this.setKml();
      this.onSubmit();
    } else {
      this.selectedZone = this.zoneList[1]["zoneNo"];
      this.setMaps();
      this.setKml();
      this.onSubmit();
    }
  }

  onSubmit() {}

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

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  getZones() {
    this.zoneList = [];
    this.zoneList = this.mapService.getlatestZones();
  }
}

export class progressDetail {
  totalMarkers: number;
  scannedMarkers: number;
}
