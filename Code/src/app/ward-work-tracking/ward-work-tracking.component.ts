/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
//services
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-ward-work-tracking',
  templateUrl: './ward-work-tracking.component.html',
  styleUrls: ['./ward-work-tracking.component.scss']
})
export class WardWorkTrackingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  selectedYear: any;
  selectedMonthName: any;
  zoneKML: any;
  toDayDate: any;
  selectedDate: any;
  cityName: any;
  lines: any[] = [];
  polylines = [];
  wardLineNoMarker: any[] = [];
  strokeWeight: any = 3;
  showLineNoText = "#showLineNoText";
  isLineNoShow = false;
  progressData: progressDetail = {
    totalLines: 0,
    completedLines: 0,
    skippedLines: 0,
    currentLine: 0,
    wardLength: "0",
    coveredLength: "0"
  };

  invisibleImageUrl = "../assets/img/invisible-location.svg";
  txtDate = "#txtDate";
  divLoader = "#divLoader";
  divLinesShowHide = "#divLinesShowHide";
  divLinesShowHideCheckBox="#divLinesShowHideCheckBox";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.getLocalStorage();
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    this.getSelectedYearMonth();
    this.setHeight();
    this.setDefaultMap();
    this.getZones().then(() => {
      this.selectedZone = "0";
    });
  }

  getLocalStorage(){
    if (localStorage.getItem("userType") == "External User") {
      $(this.divLinesShowHide).hide();
      $(this.divLinesShowHideCheckBox).hide();
    }
    if (localStorage.getItem("wardWorkTrackingLineShow") == "1") {
      this.isLineNoShow = true;
      this.showHideLineNoHtml();
      let element=<HTMLInputElement>document.getElementById("chkIsShow");
      element.checked=true;
    }
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($(this.txtDate).val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate($(this.txtDate).val(), 1);
      this.selectedDate = previousDate;
    }
    $(this.txtDate).val(this.selectedDate);
    this.getSelectedYearMonth();
    this.getWardData();
  }

  getSelectedYearMonth() {
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  getWardData() {
    this.resetData();
    $(this.divLoader).show();
    this.getCurrentLine();
    this.getSummaryData();
    this.setWardBoundary();
    this.getAllLinesFromJson();
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.selectedZone = filterVal;
    this.getWardData();
  }

  resetData() {
    this.progressData.completedLines = 0;
    this.progressData.coveredLength = "0";
    this.progressData.currentLine = 0;
    this.progressData.skippedLines = 0;
    this.progressData.totalLines = 0;
    this.progressData.wardLength = "0";
  }

  setWardBoundary() {
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, this.strokeWeight).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i = (i + 5)) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
    });
  }

  clearMapAll() {
    if (this.wardLineNoMarker.length > 0) {
      for (let i = 0; i < this.wardLineNoMarker.length; i++) {
        if (this.wardLineNoMarker[i]["marker"] != null) {
          this.wardLineNoMarker[i]["marker"].setMap(null);
        }
      }
      this.wardLineNoMarker = [];
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        if (this.polylines[i] != null) {
          this.polylines[i].setMap(null);
        }
      }
      this.polylines = [];
    }
  }

  getAllLinesFromJson() {
    this.clearMapAll();
    this.commonService.getWardLineJson(this.selectedZone, this.selectedDate).then((data: any) => {
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      this.progressData.totalLines = wardLines["totalLines"];
      this.progressData.wardLength=(parseFloat(wardLines["totalWardLength"]) / 1000).toFixed(2);;
      for (let i = 0; i < keyArray.length - 3; i++) {
        let lineNo = Number(keyArray[i]);
        let points = wardLines[lineNo]["points"];
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
        }
        this.lines.push({
          lineNo: lineNo,
          latlng: latLng,
          color: "#87CEFA",
        });
        this.plotLineOnMap(lineNo, latLng, i);
      }
      $(this.divLoader).hide();
    });
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatusInstance = this.db.object(dbPathLineStatus).valueChanges().subscribe((lineStatus) => {
      lineStatusInstance.unsubscribe();
      let strokeColor = this.commonService.getLineColor(null);
      if (lineStatus != null) {
        strokeColor = this.commonService.getLineColor(lineStatus);
        if (lineStatus == "LineCompleted") {
          this.progressData.completedLines = this.progressData.completedLines + 1;
        }
      }
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: strokeColor,
        strokeWeight: 2,
      });
      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);
      let lat = latlng[0]["lat"];
      let lng = latlng[0]["lng"];
      this.setLineNoMarker(lineNo, lat, lng);
    });
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
        fontSize: "10px",
        fontWeight: "bold",
      },
    });
    if (this.isLineNoShow == false) {
      marker.setMap(null);
    }
    this.wardLineNoMarker.push({ marker });
  }

  getSummaryData() {
    let workSummarydbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary";
    let workSummaryInstance = this.db.object(workSummarydbPath).valueChanges().subscribe((workSummary) => {
      workSummaryInstance.unsubscribe();
      if (workSummary != null) {
        if (workSummary["skippedLines"] != null) {
          this.progressData.skippedLines = workSummary["skippedLines"];
        } else {
          this.progressData.skippedLines = 0;
        }
        if (workSummary["wardCoveredDistance"] != null) {
          this.progressData.coveredLength = (parseFloat(workSummary["wardCoveredDistance"]) / 1000).toFixed(2);
        } else {
          this.progressData.coveredLength = "0.00";
        }
      }
    });
  }

  getCurrentLine() {
    if (this.selectedDate == this.toDayDate) {
      let lastLineInstance = this.db.object("WasteCollectionInfo/LastLineCompleted/" + this.selectedZone).valueChanges().subscribe((lastLine) => {
        lastLineInstance.unsubscribe();
        if (lastLine != null) {
          this.progressData.currentLine = Number(lastLine) + 1;
        }
      });
    }
  }

  setDefaultMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
  }

  getZones() {
    return new Promise((resolve) => {
      this.zoneList = [];
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
      this.zoneList[0]["zoneName"] = "--Select Zone--";
      resolve(true);
    });
  }

  setHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  showLineNo() {
    if (this.isLineNoShow == true) {
      this.isLineNoShow = false;
      localStorage.setItem("wardWorkTrackingLineShow", "0");
    }
    else {
      this.isLineNoShow = true;
      localStorage.setItem("wardWorkTrackingLineShow", "1");
    }
    this.showHideLineNo();
    this.showHideLineNoHtml();
    this.hideSetting();
  }

  showHideLineNo() {
    if (this.wardLineNoMarker.length > 0) {
      for (let i = 0; i < this.wardLineNoMarker.length; i++) {
        if (this.wardLineNoMarker != null) {
          if (this.isLineNoShow == false) {
            this.wardLineNoMarker[i]["marker"].setMap(null);
          }
          else {
            this.wardLineNoMarker[i]["marker"].setMap(this.map);
          }
        }
      }
    }
  }

  showHideLineNoHtml() {
    if (this.isLineNoShow == true) {
      $(this.showLineNoText).html("Hide Line No.");
      let element=<HTMLInputElement>document.getElementById("chkIsShow");
      element.checked=true;
    }
    else {
      $(this.showLineNoText).html("Show Line No.");
      let element=<HTMLInputElement>document.getElementById("chkIsShow");
      element.checked=false;
    }
  }

  hideSetting() {
    let element = <HTMLElement>document.getElementById("collapsetwo");
    let className = element.className;
    $("#collapsetwo").removeClass(className);
    $("#collapsetwo").addClass("panel-collapse collapse in");
  }

}

export class progressDetail {
  totalLines: number;
  completedLines: number;
  skippedLines: number;
  currentLine: number;
  wardLength: string;
  coveredLength: string;
}
