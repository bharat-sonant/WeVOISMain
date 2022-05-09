/// <reference types="@types/googlemaps" />
import { Component, ViewChild } from "@angular/core";
//services
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-ward-work-tracking',
  templateUrl: './ward-work-tracking.component.html',
  styleUrls: ['./ward-work-tracking.component.scss']
})
export class WardWorkTrackingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private actRoute: ActivatedRoute, private commonService: CommonService, private modalService: NgbModal, public httpService: HttpClient) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  selectedYear: any;
  selectedMonthName: any;
  wardBoundary: any;
  toDayDate: any;
  selectedDate: any;
  cityName: any;
  lines: any[] = [];
  polylines = [];
  wardLineNoMarker: any[] = [];
  dustbinMarkerList: any[] = [];
  houseMarkerList: any[] = [];
  instancesList: any[] = [];
  dustbinList: any[] = [];
  zoneLineList: any[] = [];
  parshadList: any[] = [];
  cardNotScanedList: any[] = [];
  skipLineList: any[] = [];
  strokeWeight: any = 3;
  parhadhouseMarker: any;
  wardStartMarker: any;
  wardEndMarker: any;
  vehicleMarker: any;
  firebaseStoragePath: any;
  skipLineMarker: any;
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  parshadMarkerImageUrl = "../assets/img/sweet-home.png";
  defaultRectangularDustbinUrl = "../assets/img/dark gray without tick rectangle.png";
  defaultCircularDustbinUrl = "../assets/img/dustbin-circular-grey.png";
  defaultRectangularAssignedDustbinUrl = "../../assets/img/blue without tick rectangle.png";
  defaultCircularAssignedDustbinUrl = "../../assets/img/dustbin-circular-blue.png";
  defaultRectangularPickedDustbinUrl = "../assets/img/Green-Rectangle-dustbin.png";
  defaultCircularPickedDustbinUrl = "../assets/img/dustbin-circular-green.png";
  vehicleRunningTipperUrl = "../assets/img/tipper-green.png";
  vehicleCompletedTipperUrl = "../assets/img/tipper-gray.png";
  vehicleStopedTipperUrl = "../assets/img/tipper-red.png";
  vehicleRunningTractorUrl = "../assets/img/active-tractormdpi.png";
  vehicleCompletedTractorUrl = "../assets/img/disabled-tractormdpi.png";
  vehicleStopedTractorUrl = "../assets/img/stop-tractormdpi.png";
  skippedMarkerUrl = "../../../assets/img/red.svg";
  scanHouseUrl = "../assets/img/green-home.png";
  notScanHouseUrl = "../assets/img/red-home.png";
  wardStartUrl = "../assets/img/go-image.png";
  wardEndUrl = "../assets/img/end-image.png";
  txtDate = "#txtDate";
  txtAllLineScancard = "#txtAllLineScancard";
  divLoader = "#divLoader";
  divSetting = "#divSetting";
  divParshadDetail = "#divParshadDetail";
  divWorkDetail = "#divWorkDetail";
  divWorkerDetail = "#divWorkerDetail";
  chkIsWorkerDetail = "chkIsWorkerDetail";
  chkIsWorkDetail = "chkIsWorkDetail";
  chkIsShowLineNo = "chkIsShowLineNo";
  chkIsShowAllDustbin = "chkIsShowAllDustbin";
  chkIsShowHouse = "chkIsShowHouse";
  chkIsAvailableForScancard = "chkIsAvailableForScancard";
  isParshadShow: any;
  divDustbinDetail = "#divDustbinDetail";
  divTotalHouse = "#divTotalHouse";
  divNotSacnned = "#divNotSacnned";
  divScannedHouses = "#divScannedHouses";
  wardLinesDataObj: any;
  isShowAllHouse = false;
  progressData: progressDetail = {
    totalLines: 0,
    completedLines: 0,
    skippedLines: 0,
    currentLine: 0,
    wardLength: "0",
    coveredLength: "0",
    driverName: "---",
    driverMobile: "",
    helperName: "---",
    helperMobile: "",
    secondHelperName: "",
    parshadName: "",
    parshadMobile: "",
    totalDustbin: 0,
    circularDustbin: 0,
    rectangularDustbin: 0,
    totalHouses: 0,
    cardNotScanedImages: 0,
    scanedHouses: 0,
    totalTimer: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.firebaseStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    if (this.cityName == "reengus" || this.cityName == "shahpura" || this.cityName == "niwai") {
      $(this.divParshadDetail).hide();
      this.isParshadShow = false;
    }
    else {
      this.getParshadList();
      this.isParshadShow = true;
    }
    this.getLocalStorage();
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    this.getSelectedYearMonth();
    this.setHeight();
    this.setDefaultMap();
    this.getZones().then(() => {
      const id = this.actRoute.snapshot.paramMap.get("id");
      if (id != null) {
        this.selectedZone = id.trim();
        this.getWardData();
      } else {
        this.selectedZone = "0";
      }
    });
  }

  setDetailShowHideSetting() {
    if ((<HTMLInputElement>document.getElementById(this.chkIsWorkerDetail)).checked == false && (<HTMLInputElement>document.getElementById(this.chkIsWorkDetail)).checked == false) {
      $(this.divDustbinDetail).css("right", "15px");
    }
    else if ((<HTMLInputElement>document.getElementById(this.chkIsWorkerDetail)).checked == false && (<HTMLInputElement>document.getElementById(this.chkIsWorkDetail)).checked == true) {
      $(this.divDustbinDetail).css("right", "305px");
      $(this.divWorkDetail).css("top", "80px");
    }
    else if ((<HTMLInputElement>document.getElementById(this.chkIsWorkerDetail)).checked == true && (<HTMLInputElement>document.getElementById(this.chkIsWorkDetail)).checked == false) {
      $(this.divDustbinDetail).css("right", "305px");
    }
    else if ((<HTMLInputElement>document.getElementById(this.chkIsWorkerDetail)).checked == true && (<HTMLInputElement>document.getElementById(this.chkIsWorkDetail)).checked == true) {
      $(this.divDustbinDetail).css("right", "305px");
      if (this.isParshadShow == false) {
        $(this.divWorkDetail).css("top", "215px");
      }
      else {
        $(this.divWorkDetail).css("top", "270px");
      }
    }
  }

  showHideWorkerDetail() {
    localStorage.setItem("wardWorkTrackingWorkerDetailShow", (<HTMLInputElement>document.getElementById("chkIsWorkerDetail")).checked.toString());
    if ((<HTMLInputElement>document.getElementById(this.chkIsWorkerDetail)).checked == false) {
      $(this.divWorkerDetail).hide();
    }
    else {
      $(this.divWorkerDetail).show();
    }
    this.setDetailShowHideSetting();
    this.hideSetting();
  }

  showHideWorkDetail() {
    localStorage.setItem("wardWorkTrackingWorkShow", (<HTMLInputElement>document.getElementById("chkIsWorkDetail")).checked.toString());
    if ((<HTMLInputElement>document.getElementById(this.chkIsWorkDetail)).checked == false) {
      $(this.divWorkDetail).hide();
    }
    else {
      $(this.divWorkDetail).show();
    }
    this.setDetailShowHideSetting();
    this.hideSetting();
  }

  getVehicleLocation(vehicle: any) {
    let dbPath = "CurrentLocationInfo/" + this.selectedZone + "/latLng";
    let vehicleLocationInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      this.instancesList.push({ instances: vehicleLocationInstance });
      if (data != undefined) {
        dbPath = "RealTimeDetails/WardDetails/" + this.selectedZone + "/activityStatus";
        let vehicleStatusInstance = this.db.object(dbPath).valueChanges().subscribe((vehicleStatusData) => {
          vehicleStatusInstance.unsubscribe();
          if (data != null) {
            if (this.vehicleMarker != null) {
              this.vehicleMarker.setMap(null);
            }
            let location = data.toString().split(",");
            let lat = Number(location[0]);
            let lng = Number(location[1]);
            this.vehicleMarker = new google.maps.Marker({
              position: { lat: Number(lat), lng: Number(lng) },
              map: this.map,
              icon: this.getVehicleIcon(vehicleStatusData.toString(), vehicle)
            });
          }
        });
      }
    });
  }

  getVehicleIcon(vehicleStatus: any, vehicle: any) {
    let vehicleIcon = this.vehicleRunningTipperUrl;
    if (vehicle.includes("TRACTOR")) {
      vehicleIcon = this.vehicleRunningTractorUrl;
      if (vehicleStatus.toString() == "completed") {
        vehicleIcon = this.vehicleCompletedTractorUrl;
      } else if (vehicleStatus.toString() == "stopped") {
        vehicleIcon = this.vehicleStopedTractorUrl;
      }
    }
    else {
      if (vehicleStatus.toString() == "completed") {
        vehicleIcon = this.vehicleCompletedTipperUrl;
      } else if (vehicleStatus.toString() == "stopped") {
        vehicleIcon = this.vehicleStopedTipperUrl;
      }
    }
    return vehicleIcon;
  }

  showHouse() {
    if (this.wardLinesDataObj == null) {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      (<HTMLInputElement>document.getElementById(this.chkIsShowHouse)).checked = false;
      return;
    }
    if ((<HTMLInputElement>document.getElementById(this.chkIsShowHouse)).checked == true) {
      $(this.divTotalHouse).show();
      $(this.divNotSacnned).show();
      $(this.divScannedHouses).show();
      if (this.houseMarkerList.length > 0) {
        this.showHouseOnMap();
      }
      else {
        this.getHouses();
      }
      this.getCardNotScanedImages();
    }
    else {
      $(this.divTotalHouse).hide();
      $(this.divNotSacnned).hide();
      $(this.divScannedHouses).hide();
      this.clearHouseFromMap();
    }
  }

  showHouseOnMap() {
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        if (this.houseMarkerList[i]["marker"] != null) {
          this.houseMarkerList[i]["marker"].setMap(this.map);
        }
      }
    }
  }

  getHouses() {
    this.progressData.scanedHouses = 0;
    if (this.wardLinesDataObj != null) {
      let keyArray = Object.keys(this.wardLinesDataObj);
      if (this.wardLinesDataObj["totalHouseCount"] != null) {
        this.progressData.totalHouses = this.wardLinesDataObj["totalHouseCount"];
      }
      for (let i = 0; i < keyArray.length - 3; i++) {
        let lineNo = Number(keyArray[i]);
        let houses = [];
        if (this.wardLinesDataObj[lineNo]["Houses"] != null) {
          houses = this.wardLinesDataObj[lineNo]["Houses"];
          for (let j = 0; j < houses.length; j++) {
            let lat = houses[j]["latlong"]["latitude"];
            let lng = houses[j]["latlong"]["longitude"];
            let cardNo = "";
            if (houses[j]["Basicinfo"] != null) {
              if (houses[j]["Basicinfo"]["CardNumber"] != null) {
                cardNo = houses[j]["Basicinfo"]["CardNumber"];
              }
            }
            this.setHouseMarker(cardNo, lat, lng);
          }
        }
        if (i == keyArray.length - 4) {
          this.getScanedHouses();
          if (this.selectedDate == this.toDayDate) {
            this.getRecentScanedCard();
          }
        }
      }
    }
  }

  getScanedHouses() {
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        let cardNo = this.houseMarkerList[i]["cardNo"];
        let scanCardPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + cardNo + "/scanBy";
        let scanInfoInstance = this.db.object(scanCardPath).valueChanges().subscribe((scanBy) => {
          this.instancesList.push({ instances: scanInfoInstance });
          if (scanBy != undefined) {
            let houseDetail = this.houseMarkerList.find(item => item.cardNo == cardNo);
            if (houseDetail != undefined) {
              houseDetail.scanBy = scanBy;
              this.setProgressDetailScanedHouseCount(scanBy);
              this.setScanedIcon(houseDetail, houseDetail.scanBy);
            }
          }
        });
      }
    }
  }

  setProgressDetailScanedHouseCount(scanBy: any) {
    if (this.isShowAllHouse == false) {
      if (scanBy > -1) {
        this.progressData.scanedHouses = this.progressData.scanedHouses + 1;
      }
    }
    else {
      if (scanBy > -2) {
        this.progressData.scanedHouses = this.progressData.scanedHouses + 1;
      }
    }
  }

  getRecentScanedCard() {
    if (this.houseMarkerList.length > 0) {
      let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/recentScanned";
      let recentScanCardInstance = this.db.object(dbPath).valueChanges().subscribe(
        recentScanData => {
          this.instancesList.push({ instances: recentScanCardInstance });
          if (recentScanData != null) {
            let cardNo = recentScanData["cardNo"];
            for (let i = 0; i < this.houseMarkerList.length; i++) {
              this.houseMarkerList[i]["marker"].setAnimation(null);
            }
            let houseDetail = this.houseMarkerList.find(item => item.cardNo == cardNo);
            if (houseDetail != undefined) {
              houseDetail.marker.setAnimation(google.maps.Animation.BOUNCE);
              this.setScanedIcon(houseDetail, houseDetail.scanBy);
            }
            let scanTime = recentScanData["scanTime"];
            let notificationTime = new Date(this.toDayDate + " " + scanTime);
            let currentTime = new Date();
            let timeDiff = this.commonService.timeDifferenceMin(currentTime, notificationTime);
            if (timeDiff < 3) {
              if (this.isShowAllHouse == true) {
                if (recentScanData["isShowMessage"] == "yes") {
                  this.showScanedHouseMessage(cardNo, scanTime);
                }
              }
              else {
                if (recentScanData["scanBy"] != "-1") {
                  if (recentScanData["isShowMessage"] == "yes") {
                    this.showScanedHouseMessage(cardNo, scanTime);
                  }
                }
              }
            }
          }
        }
      );
    }
  }

  showAllScanedHouses() {
    this.progressData.scanedHouses = 0;
    if (this.isShowAllHouse == false) {
      this.isShowAllHouse = true;
    }
    else {
      this.isShowAllHouse = false;
    }
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        let cardNo = this.houseMarkerList[i]["cardNo"];
        let houseDetail = this.houseMarkerList.find(item => item.cardNo == cardNo);
        if (houseDetail != undefined) {
          this.setProgressDetailScanedHouseCount(houseDetail.scanBy);
          this.setScanedIcon(houseDetail, houseDetail.scanBy);
        }
      }
    }
  }

  showScanedHouseMessage(cardNo: any, scanTime: any) {
    let dbPath = "CardWardMapping/" + cardNo;
    let mapInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      mapInstance.unsubscribe();
      if (data != null) {
        let lineNo = data["line"];
        let ward = data["ward"];
        dbPath = "Houses/" + ward + "/" + lineNo + "/" + cardNo;
        let houseInstance = this.db.object(dbPath).valueChanges().subscribe((dataHouse) => {
          houseInstance.unsubscribe();
          if (dataHouse != null) {
            let name = dataHouse["name"];
            let time = scanTime.split(":")[0] + ":" + scanTime.split(":")[1];
            let message = name + " के यहां से " + time + " बजे कचरा उठा लिया गया है";
            this.commonService.setAlertMessageWithLeftPosition("success", message, "alert alert-houses ");
          }
        });
      }
    });
  }

  setScanedIcon(houseDetail: any, scanBy: any) {
    let imgUrl = this.notScanHouseUrl;
    if (this.isShowAllHouse == false) {
      if (scanBy > -1) {
        imgUrl = this.scanHouseUrl;
      }
    }
    else {
      if (scanBy > -2) {
        imgUrl = this.scanHouseUrl;
      }
    }
    const icon = {
      url: imgUrl,
      fillOpacity: 1,
      strokeWeight: 0,
      scaledSize: new google.maps.Size(16, 15),
    }
    houseDetail.marker.setIcon(icon);

  }

  setHouseMarker(cardNo: any, lat: any, lng: any) {
    let houseDetail = this.houseMarkerList.find(item => item.cardNo == cardNo);
    if (houseDetail != undefined) {
      houseDetail.marker.setMap(null);
      houseDetail.cardNo = null;
    }
    let imgUrl = this.notScanHouseUrl;
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: imgUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(16, 15),
      },
    });
    this.houseMarkerList.push({ cardNo: cardNo, marker: marker, scanBy: -2 });
  }

  clearHouseFromMap() {
    $(this.divTotalHouse).hide();
    if (this.houseMarkerList.length > 0) {
      for (let i = 0; i < this.houseMarkerList.length; i++) {
        if (this.houseMarkerList[i]["marker"] != null) {
          this.houseMarkerList[i]["marker"].setMap(null);
        }
      }
    }
  }

  getCardNotScanedImages() {
    if (this.cardNotScanedList.length > 0) {
      return;
    }
    this.progressData.cardNotScanedImages = 0;
    let dbPath = "HousesCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/ImagesData";
    let notScanCardInstance = this.db.object(dbPath).valueChanges().subscribe((notScanedImageData) => {
      this.instancesList.push({ instances: notScanCardInstance });
      if (notScanedImageData != null) {
        let count = 0;
        let city = this.commonService.getFireStoreCity();
        let keyArray = Object.keys(notScanedImageData);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          if (lineNo != "totalCount") {
            let obj = notScanedImageData[lineNo];
            let keyArrayLine = Object.keys(obj);
            if (keyArrayLine.length > 0) {
              for (let j = 0; j < keyArrayLine.length; j++) {
                let index = keyArrayLine[j];
                if (obj[index]["cardImage"] != null) {
                  let imageUrl = this.firebaseStoragePath + city + "%2FHousesCollectionImagesData%2F" + this.selectedZone + "%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + lineNo + "%2F" + obj[index]["cardImage"] + "?alt=media";
                  let time = obj[index]["scanTime"].split(":")[0] + ":" + obj[index]["scanTime"].split(":")[1];
                  this.cardNotScanedList.push({
                    imageUrl: imageUrl,
                    time: time,
                    lineNo: lineNo,
                  });
                  count++;
                }
              }
            }
          }
        }
        this.progressData.cardNotScanedImages = count;
      }
    });
  }

  getParshadList() {
    this.httpService.get("../../assets/jsons/ParshadDetail/" + this.cityName + ".json").subscribe(parshadData => {
      if (parshadData != null) {
        let keyArray = Object.keys(parshadData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let zone = keyArray[i];
            this.parshadList.push({ zoneNo: zone, lat: parshadData[zone]["lat"], lng: parshadData[zone]["lng"], mobile: parshadData[zone]["mobile"], name: parshadData[zone]["name"] });
          }
        }
      }
    });
  }

  getLocalStorage() {
    if (localStorage.getItem("userType") == "External User") {
      $(this.divSetting).hide();
      this.isShowAllHouse = true;
    }
    (<HTMLInputElement>document.getElementById(this.chkIsShowLineNo)).checked = JSON.parse(localStorage.getItem("wardWorkTrackingLineShow"));
    (<HTMLInputElement>document.getElementById(this.chkIsShowAllDustbin)).checked = JSON.parse(localStorage.getItem("wardWorkTrackingAllDustbinShow"));
    (<HTMLInputElement>document.getElementById(this.chkIsWorkerDetail)).checked = JSON.parse(localStorage.getItem("wardWorkTrackingWorkerDetailShow"));
    (<HTMLInputElement>document.getElementById(this.chkIsWorkDetail)).checked = JSON.parse(localStorage.getItem("wardWorkTrackingWorkShow"));
    this.showHideWorkDetail();
    this.showHideWorkerDetail();
    this.showHideAllDustbin();
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      this.selectedDate = this.commonService.getNextDate($(this.txtDate).val(), 1);
    } else if (type == "previous") {
      this.selectedDate = this.commonService.getPreviousDate($(this.txtDate).val(), 1);
    }
    $(this.txtDate).val(this.selectedDate);
    this.getSelectedYearMonth();
    if (this.selectedZone != "0") {
      this.getWardData();
    }
  }

  getSelectedYearMonth() {
    this.selectedYear = this.selectedDate.split("-")[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split("-")[1]) - 1);
  }

  getWardData() {
    this.resetData();
    $(this.divLoader).show();
    let element = <HTMLAnchorElement>(document.getElementById("routeTrackingLink"));
    element.href = this.cityName + "/route-tracking/" + this.selectedZone;
    this.getEmployeeData();
    this.getCurrentLine();
    this.getSummaryData();
    this.setWardBoundary();
    this.getAllLinesFromJson();
    if (this.cityName != "reengus" || this.cityName != "shahpura" || this.cityName != "niwai") {
      this.getParshadDetail();
    }
    if ((<HTMLInputElement>document.getElementById(this.chkIsShowAllDustbin)).checked == true) {
      this.getDustbins();
    }
  }

  openModel(content: any, type: any) {
    if (this.selectedZone == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 870;
    let width = 300;
    let divHeight = "0px";
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    if (type == "lineDetail") {
      width = 900;
      height = (windowHeight * 90) / 100;
      divHeight = height - 80 + "px";
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    }
    else if (type == "notScanedImages") {
      width = windowWidth - 300;
      height = (windowHeight * 90) / 100;
      marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      divHeight = height - 50 + "px";
    }
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    if (type == "lineDetail") {
      $("#divLinePopup").css("height", divHeight);
      this.getZoneLineDetail();
    }
    else if (type == "notScanedImages") {
      $("#divNotScanedImages").css("height", divHeight);
    }
    this.hideSetting();
  }

  getZoneLineDetail() {
    this.zoneLineList = [];
    for (let i = 0; i < this.lines.length; i++) {
      this.zoneLineList.push({ lineNo: this.lines[i]["lineNo"], length: 0, timerTime: 0, actualCoveredTime: 0, houseCount: 0, scancardPercentage: 0 });
      this.getLineActualCoveredTime(this.lines[i]["lineNo"]);
      if (i == this.lines.length - 1) {
        this.getTimerTime();
        this.getWardLineLengthAndHouses();
        this.getScancardPercentage();
      }
    }
  }

  getLineActualCoveredTime(lineNo: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo;
    let lineStatusInstance = this.db.object(dbPathLineStatus).valueChanges().subscribe((lineData) => {
      this.instancesList.push({ instances: lineStatusInstance });
      if (lineData != null) {
        if (lineData["end-time"] != null) {
          let lineDetail = this.zoneLineList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.actualCoveredTime = this.commonService.timeDifferenceMin(new Date(this.toDayDate + " " + lineData["end-time"]), new Date(this.toDayDate + " " + lineData["start-time"]));
          }
        }
      }
    });
  }

  getWardLineLengthAndHouses() {
    if (this.lines.length > 0) {
      for (let i = 0; i < this.lines.length; i++) {
        let lineNo = this.lines[i]["lineNo"];
        let lineDetail = this.zoneLineList.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          lineDetail.length = this.lines[i]["lineLength"];
          lineDetail.houseCount = this.lines[i]["houseCount"];
        }
      }
    }
  }

  getTimerTime() {
    this.progressData.totalTimer = 0;
    const timerTimeJsonPath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FSettings%2FTimingForLines%2F" + this.selectedZone + ".json?alt=media";
    let timerTimeInstance = this.httpService.get(timerTimeJsonPath).subscribe(timerTimeData => {
      timerTimeInstance.unsubscribe();
      if (timerTimeData != null) {
        let keyArray = Object.keys(timerTimeData);
        if (keyArray.length > 0) {
          let totalTimer = 0;
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            let lineDetail = this.zoneLineList.find(item => item.lineNo == lineNo);
            if (lineDetail != undefined) {
              lineDetail.timerTime = timerTimeData[lineNo]["minimumTimeToCollectWaste"];
              totalTimer += Number(timerTimeData[lineNo]["minimumTimeToCollectWaste"]);
            }
          }
          this.progressData.totalTimer = totalTimer;
        }
      }
    });
  }

  getTotalTimer() {
    let totalTimer = 0;
    if (this.zoneLineList.length > 0) {
      for (let i = 0; i < this.zoneLineList.length; i++) {
        if ($("#txtTimer" + this.zoneLineList[i]["lineNo"]).val() != "") {
          totalTimer += Number($("#txtTimer" + this.zoneLineList[i]["lineNo"]).val());
        }
      }
      this.progressData.totalTimer = totalTimer;
    }
  }


  getScancardPercentage() {
    const scancardPercentageJsonPath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FSettings%2FLinewiseScancardPercentageInWard%2F" + this.selectedZone + ".json?alt=media";
    let scancardPercentageInstance = this.httpService.get(scancardPercentageJsonPath).subscribe(scancardPercentageData => {
      scancardPercentageInstance.unsubscribe();
      if (scancardPercentageData != null) {
        if (scancardPercentageData["isAvailable"] != null) {
          (<HTMLInputElement>document.getElementById(this.chkIsAvailableForScancard)).checked = scancardPercentageData["isAvailable"];
        }
        let keyArray = Object.keys(scancardPercentageData);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            let lineDetail = this.zoneLineList.find(item => item.lineNo == lineNo);
            if (lineDetail != undefined) {
              lineDetail.scancardPercentage = scancardPercentageData[lineNo]["scancardPercentage"];
            }
          }
        }
      }
    });
  }

  updateLineScancardPercentage() {
    if (this.zoneLineList != null) {
      const obj = {};
      for (let i = 0; i < this.zoneLineList.length; i++) {
        let lineNo = this.zoneLineList[i]["lineNo"];
        let scancardPercentage = $('#txtScancardPercentage' + lineNo).val();
        this.zoneLineList[i]["scancardPercentage"] = scancardPercentage;
        obj[lineNo] = { scancardPercentage: scancardPercentage };
      }
      if ((<HTMLInputElement>document.getElementById(this.chkIsAvailableForScancard)).checked == true) {
        obj["isAvailable"] = true;
      }
      else {
        obj["isAvailable"] = false;
      }
      this.commonService.saveJsonFile(obj, this.selectedZone + ".json", "/Settings/LinewiseScancardPercentageInWard/");
      this.commonService.setAlertMessage("success", "Data saved successfully !!!");
    }
  }

  updateAllLineScancardPercentage() {
    if ($(this.txtAllLineScancard).val() == "0" || $(this.txtAllLineScancard).val() == "") {
      this.commonService.setAlertMessage("error", "Please enter percentage !!!");
      return;
    }
    if (this.zoneLineList != null) {
      for (let i = 0; i < this.zoneLineList.length; i++) {
        $('#txtScancardPercentage' + this.zoneLineList[i]["lineNo"]).val($(this.txtAllLineScancard).val());
      }
    }
    this.updateLineScancardPercentage();
  }

  updateLineTimerTime() {
    if (this.zoneLineList != null) {
      const obj = {};
      for (let i = 0; i < this.zoneLineList.length; i++) {
        let lineNo = this.zoneLineList[i]["lineNo"];
        let timerTime = $('#txtTimer' + lineNo).val();
        this.updateLineTimerInRealtimeDatabase(lineNo, this.zoneLineList[i]["timerTime"], timerTime);
        this.zoneLineList[i]["timerTime"] = timerTime;
        obj[lineNo] = { minimumTimeToCollectWaste: timerTime };
      }
      this.commonService.saveJsonFile(obj, this.selectedZone + ".json", "/Settings/TimingForLines/");
      this.commonService.setAlertMessage("success", "Data saved successfully !!!");
    }
  }

  updateLineTimerInRealtimeDatabase(lineNo: any, preTimerTime: any, timerTime: any) {
    let dbPath = "Settings/LinewiseTimingDetailsInWard/" + this.selectedZone + "/" + lineNo;
    if (preTimerTime != timerTime) {
      if (timerTime == 0) {
        this.db.object(dbPath).update({ minimumTimeToCollectWaste: null });
      }
      else {
        this.db.object(dbPath).update({ minimumTimeToCollectWaste: timerTime });
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  showHideAllDustbin() {
    this.hideSetting();
    localStorage.setItem("wardWorkTrackingAllDustbinShow", (<HTMLInputElement>document.getElementById("chkIsShowAllDustbin")).checked.toString());
    if ((<HTMLInputElement>document.getElementById(this.chkIsShowAllDustbin)).checked == false) {
      this.clearDustbinFromMap();
    }
    else {
      if (this.dustbinMarkerList.length > 0) {
        this.showDustbinOnMap();
      }
      else {
        this.getDustbins();
      }
    }
  }

  clearDustbinFromMap() {
    $(this.divDustbinDetail).hide();
    if (this.dustbinMarkerList.length > 0) {
      for (let i = 0; i < this.dustbinMarkerList.length; i++) {
        if (this.dustbinMarkerList[i]["marker"] != null) {
          this.dustbinMarkerList[i]["marker"].setMap(null);
        }
      }
    }
  }

  showDustbinOnMap() {
    $(this.divDustbinDetail).show();
    if (this.dustbinMarkerList.length > 0) {
      for (let i = 0; i < this.dustbinMarkerList.length; i++) {
        if (this.dustbinMarkerList[i]["marker"] != null) {
          this.dustbinMarkerList[i]["marker"].setMap(this.map);
        }
      }
    }
  }

  getDustbins() {
    $(this.divDustbinDetail).show();
    if (this.dustbinList.length == 0) {
      this.dustbinList = JSON.parse(localStorage.getItem("dustbin"));
    }
    if (this.selectedZone != "0") {
      let zoneDustbins = this.dustbinList.filter(item => item.ward == this.selectedZone);
      if (zoneDustbins.length > 0) {
        this.progressData.totalDustbin = zoneDustbins.length;
        for (let i = 0; i < zoneDustbins.length; i++) {
          let dustbin = zoneDustbins[i]["dustbin"];
          let lat = zoneDustbins[i]["lat"];
          let lng = zoneDustbins[i]["lng"];
          let markerUrl = this.defaultCircularDustbinUrl;
          if (zoneDustbins[i]["type"] == "Rectangular") {
            markerUrl = this.defaultRectangularDustbinUrl;
            this.progressData.rectangularDustbin += 1;
          }
          else {
            this.progressData.circularDustbin += 1;
          }
          let contentString = '<br/>' + zoneDustbins[i]["address"];
          this.setDustbinMarker(dustbin, lat, lng, markerUrl, contentString, zoneDustbins[i]["type"]);
          if (i == zoneDustbins.length - 1) {
            this.getWardAssignedDustbin();
          }
        }
      }
    }
  }

  setDustbinMarker(dustbin: any, lat: any, lng: any, markerUrl: any, contentString: any, type: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: markerUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(25, 31),
        labelOrigin: new google.maps.Point(15, 25)
      }
    });

    let infowindow = new google.maps.InfoWindow({
      content: contentString
    });

    marker.addListener('click', function () {
      infowindow.open(this.map, marker);
    });

    this.dustbinMarkerList.push({ dustbin: dustbin, marker: marker, type: type });
  }

  getWardAssignedDustbin() {
    if (this.dustbinList.length > 0) {
      let dbPath = "DustbinData/DustbinAssignToWard/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + this.selectedZone;
      let dustbinAssignedInstance = this.db.object(dbPath).valueChanges().subscribe(
        dustbinAssignedData => {
          this.instancesList.push({ instances: dustbinAssignedInstance });
          if (dustbinAssignedData != null) {
            if (dustbinAssignedData["bins"] != null) {
              let bins = dustbinAssignedData["bins"].split(',');
              let binList = [];
              for (let i = 0; i < bins.length; i++) {
                binList.push({ dustbin: bins[i].trim(), status: 'assigned' });
              }
              let completedBins = [];
              if (dustbinAssignedData["completedBins"] != null) {
                completedBins = dustbinAssignedData["completedBins"].split(',');
                for (let i = 0; i < completedBins.length; i++) {
                  let binDetail = binList.find(item => item.dustbin == completedBins[i].trim())
                  if (binDetail != undefined) {
                    binDetail.status = "picked";
                  }
                }
              }
              for (let i = 0; i < binList.length; i++) {
                let dustbinDetail = this.dustbinMarkerList.find(item => item.dustbin == binList[i]["dustbin"].trim());
                if (dustbinDetail != undefined) {
                  let imgUrl = this.defaultRectangularAssignedDustbinUrl;
                  if (binList[i]["status"] == "picked") {
                    imgUrl = this.defaultRectangularPickedDustbinUrl;
                  }
                  if (dustbinDetail.type != "Rectangular") {
                    imgUrl = this.defaultCircularAssignedDustbinUrl;
                    if (binList[i]["status"] == "picked") {
                      imgUrl = this.defaultCircularPickedDustbinUrl;
                    }
                  }
                  this.setIconForDustbinMarker(dustbinDetail, imgUrl);
                }
              }
            }
          }
        }
      );
    }
  }

  setIconForDustbinMarker(dustbinDetail: any, imgUrl: any) {
    const icon = {
      url: imgUrl,
      fillOpacity: 1,
      strokeWeight: 0,
      scaledSize: new google.maps.Size(25, 31),
      labelOrigin: new google.maps.Point(15, 25)
    }
    dustbinDetail.marker.setIcon(icon);
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      if (this.wardBoundary != undefined) {
        this.wardBoundary[0]["line"].setMap(null);
      }
      this.clearMapAll();
      this.resetData();
      return;
    }
    this.selectedZone = filterVal;
    this.getWardData();
  }

  resetData() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
      }
      this.instancesList = [];
    }
    if (this.vehicleMarker != null) {
      this.vehicleMarker.setMap(null);
    }
    if (this.wardStartMarker != null) {
      this.wardStartMarker.setMap(null);
    }
    if (this.wardEndMarker != null) {
      this.wardEndMarker.setMap(null);
    }
    this.wardLinesDataObj = null;
    this.progressData.completedLines = 0;
    this.progressData.coveredLength = "0";
    this.progressData.currentLine = 0;
    this.progressData.skippedLines = 0;
    this.progressData.totalLines = 0;
    this.progressData.wardLength = "0";
    this.progressData.driverMobile = "";
    this.progressData.driverName = "---";
    this.progressData.helperMobile = "";
    this.progressData.helperName = "---";
    this.progressData.secondHelperName = "";
    this.progressData.parshadMobile = "";
    this.progressData.parshadName = "";
    this.progressData.totalDustbin = 0;
    this.progressData.circularDustbin = 0;
    this.progressData.rectangularDustbin = 0;
    this.progressData.totalHouses = 0;
    this.progressData.cardNotScanedImages = 0;
    this.progressData.scanedHouses = 0;
    this.clearHouseFromMap();
    this.houseMarkerList = [];
    this.cardNotScanedList = [];
    $(this.divNotSacnned).hide();
    $(this.divScannedHouses).hide();
    $(this.divTotalHouse).hide();
  }

  setWardBoundary() {
    this.commonService.getWardBoundary(this.selectedZone, this.wardBoundary, this.strokeWeight).then((boundaryData: any) => {
      if (this.wardBoundary != undefined) {
        this.wardBoundary[0]["line"].setMap(null);
      }
      this.wardBoundary = boundaryData;
      this.wardBoundary[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.wardBoundary[0]["latLng"].length; i = (i + 5)) {
        bounds.extend({ lat: Number(this.wardBoundary[0]["latLng"][i]["lat"]), lng: Number(this.wardBoundary[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
    });
  }

  clearMapAll() {
    this.clearHouseFromMap();
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
    if (this.dustbinMarkerList.length > 0) {
      for (let i = 0; i < this.dustbinMarkerList.length; i++) {
        if (this.dustbinMarkerList[i]["marker"] != null) {
          this.dustbinMarkerList[i]["marker"].setMap(null);
        }
      }
      this.dustbinMarkerList = [];
    }
    if (this.skipLineMarker != null) {
      this.skipLineMarker.setMap(null);
    }
    this.skipLineMarker = null;
  }

  getCoverdWardLength() {
    let dbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus";
    let wardCoveredLengthInstance = this.db.object(dbPath).valueChanges().subscribe(
      lineStatusData => {
        wardCoveredLengthInstance.unsubscribe();
        if (lineStatusData != null) {
          let keyArray = Object.keys(lineStatusData);
          if (keyArray.length > 0) {
            let coveredLength = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineDateil = this.lines.find(item => item.lineNo == lineNo);
              if (lineDateil != undefined) {
                coveredLength += Number(lineDateil.lineLength);
              }
            }
            this.progressData.coveredLength = (parseFloat(coveredLength.toString()) / 1000).toFixed(2);
          }
        }
      }
    );
  }

  getAllLinesFromJson() {
    this.clearMapAll();
    this.commonService.getWardLine(this.selectedZone, this.selectedDate).then((linesData: any) => {
      this.lines = [];
      this.wardLinesDataObj = JSON.parse(linesData);
      let keyArray = Object.keys(this.wardLinesDataObj);
      this.progressData.totalLines = this.wardLinesDataObj["totalLines"];
      this.progressData.wardLength = (parseFloat(this.wardLinesDataObj["totalWardLength"]) / 1000).toFixed(2);;
      for (let i = 0; i < keyArray.length - 3; i++) {
        let lineNo = Number(keyArray[i]);
        let points = this.wardLinesDataObj[lineNo]["points"];
        let lineLength = 0;
        let houses = [];
        if (this.wardLinesDataObj[lineNo]["Houses"] != null) {
          houses = this.wardLinesDataObj[lineNo]["Houses"];
        }
        if (this.wardLinesDataObj[lineNo]["lineLength"] != null) {
          lineLength = this.wardLinesDataObj[lineNo]["lineLength"];
        }
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
        }
        this.lines.push({
          lineNo: lineNo,
          latlng: latLng,
          color: "#60c2ff",
          lineLength: lineLength,
          houseCount: houses.length
        });
        this.plotLineOnMap(lineNo, latLng, i);
        if (i == keyArray.length - 4) {
          this.setWardStartMarker();
          this.setWardEndMarker();
        }
      }
      this.getCoverdWardLength();
      if ((<HTMLInputElement>document.getElementById(this.chkIsShowLineNo)).checked == true) {
        this.showHideLineNo();
      }
      if ((<HTMLInputElement>document.getElementById(this.chkIsShowHouse)).checked == true || this.selectedZone != "0") {
        this.showHouse();
      }
      $(this.divLoader).hide();
    }, error => {
      $(this.divLoader).hide();
    });
  }

  setWardStartMarker() {
    if (this.lines.length > 0) {
      let latLngArray = [];
      if (this.lines[0]["latlng"].length > 0) {
        latLngArray = this.lines[0]["latlng"];
        let lat = latLngArray[0]["lat"];
        let lng = latLngArray[0]["lng"];
        this.wardStartMarker = new google.maps.Marker({
          position: { lat: Number(lat), lng: Number(lng) },
          map: this.map,
          icon: {
            url: this.wardStartUrl,
            fillOpacity: 1,
            strokeWeight: 0,
            scaledSize: new google.maps.Size(32, 40),
            origin: new google.maps.Point(0, 0),
          },
        });
      }
    }
  }

  setWardEndMarker() {
    if (this.lines.length > 0) {
      let latLngArray = [];
      if (this.lines[this.lines.length - 1]["latlng"].length > 0) {
        latLngArray = this.lines[this.lines.length - 1]["latlng"];
        let lat = latLngArray[latLngArray.length - 1]["lat"];
        let lng = latLngArray[latLngArray.length - 1]["lng"];
        this.wardEndMarker = new google.maps.Marker({
          position: { lat: Number(lat), lng: Number(lng) },
          map: this.map,
          icon: {
            url: this.wardEndUrl,
            fillOpacity: 1,
            strokeWeight: 0,
            scaledSize: new google.maps.Size(32, 40),
            origin: new google.maps.Point(0, 0),
          },
        });
      }
    }
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any) {
    let dbPathLineStatus = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/LineStatus/" + lineNo + "/Status";
    let lineStatusInstance = this.db.object(dbPathLineStatus).valueChanges().subscribe((lineStatus) => {
      this.instancesList.push({ instances: lineStatusInstance });
      let strokeColor = this.commonService.getLineColor(null);
      if (lineStatus != null) {
        strokeColor = this.commonService.getLineColor(lineStatus);
        if (this.polylines[index] != undefined) {
          this.polylines[index].setMap(null);
        }
        let lineDetail = this.lines.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          if (lineStatus == "LineCompleted") {
            if (lineDetail.color == "#60c2ff") {
              this.progressData.completedLines = this.progressData.completedLines + 1;
            }
          }
          lineDetail.color = strokeColor;
        }
      }
      let line = new google.maps.Polyline({
        path: latlng,
        strokeColor: strokeColor,
        strokeWeight: 2,
      });
      this.polylines[index] = line;
      this.polylines[index].setMap(this.map);
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
        fontSize: "13px",
        fontWeight: "bold",
      },
    });
    this.wardLineNoMarker.push({ marker });
  }

  getSummaryData() {
    let workSummarydbPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/Summary";
    let workSummaryInstance = this.db.object(workSummarydbPath).valueChanges().subscribe((workSummary) => {
      this.instancesList.push({ instances: workSummaryInstance });
      if (workSummary != null) {
        if (workSummary["skippedLines"] != null) {
          this.progressData.skippedLines = workSummary["skippedLines"];
        } else {
          this.progressData.skippedLines = 0;
        }
      }
    });
  }

  getCurrentLine() {
    if (this.selectedDate == this.toDayDate) {
      let lastLineInstance = this.db.object("WasteCollectionInfo/LastLineCompleted/" + this.selectedZone).valueChanges().subscribe((lastLine) => {
        this.instancesList.push({ instances: lastLineInstance });
        if (lastLine != null) {
          this.progressData.currentLine = Number(lastLine) + 1;
        }
      });
    }
  }

  getEmployeeData() {
    let workDetailsPath = "WasteCollectionInfo/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/WorkerDetails";
    let workDetails = this.db.object(workDetailsPath).valueChanges().subscribe((workerData) => {
      workDetails.unsubscribe();
      if (workerData != undefined) {
        let driverList = workerData["driver"].toString().split(",");
        let helperList = workerData["helper"].toString().split(",");
        let driverId = driverList[driverList.length - 1].trim();
        let helperId = helperList[helperList.length - 1].trim();
        this.getEmployee(driverId, "driver");
        this.getEmployee(helperId, "helper");

        if (workerData["secondHelper"] != null) {
          let secondHelperList = workerData["secondHelper"].toString().split(",");
          let secondHelperId = secondHelperList[secondHelperList.length - 1].trim();
          this.getEmployee(secondHelperId, "secondHelper");
        }
        if (workerData["vehicle"] != null) {
          let vehicleList = workerData["vehicle"].split(',');
          if (vehicleList.length > 0) {
            if (this.selectedDate == this.toDayDate) {
              this.getVehicleLocation(vehicleList[vehicleList.length - 1].trim());
            }
          }
        }
      } else {
        this.commonService.setAlertMessage("success", "Work is not assigned for the selected date!!!");
      }
    });
  }

  getEmployee(empId: any, empType: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      if (empType == "driver") {
        this.progressData.driverName = employee["name"] != null ? employee["name"].toUpperCase() : "Not Assigned";
        this.progressData.driverMobile = employee["mobile"] != null ? employee["mobile"] : "---";
      } else if (empType == "helper") {
        this.progressData.helperName = employee["name"] != null ? employee["name"].toUpperCase() : "Not Assigned";
        this.progressData.helperMobile = employee["mobile"] != null ? employee["mobile"] : "---";
      } else {
        this.progressData.secondHelperName = employee["name"] != null ? employee["name"].toUpperCase() : "";
      }
    });
  }

  getParshadDetail() {
    if (this.parhadhouseMarker != null) {
      this.parhadhouseMarker.setMap(null);
      this.parhadhouseMarker = null;
    }
    if (this.parshadList.length > 0) {
      let parshadDetail = this.parshadList.find(item => item.zoneNo == this.selectedZone);
      if (parshadDetail != undefined) {
        this.progressData.parshadName = parshadDetail.name;
        this.progressData.parshadMobile = parshadDetail.mobile;
        this.setParshadHouseMarker(parshadDetail.lat, parshadDetail.lng);
      }
    }
  }

  setParshadHouseMarker(lat: any, lng: any) {
    this.parhadhouseMarker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: this.parshadMarkerImageUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(45, 30),
      },
    });
  }

  setDefaultMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.setOptions({ zoomControl: false });
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
    localStorage.setItem("wardWorkTrackingLineShow", (<HTMLInputElement>document.getElementById("chkIsShowLineNo")).checked.toString());
    this.showHideLineNo();
    this.hideSetting();
  }

  showHideLineNo() {
    if ((<HTMLInputElement>document.getElementById(this.chkIsShowLineNo)).checked == true || this.wardLineNoMarker.length == 0) {
      for (let i = 0; i < this.lines.length; i++) {
        let lineNo = this.lines[i]["lineNo"];
        let latlng = this.lines[i]["latlng"];
        let lat = latlng[0]["lat"];
        let lng = latlng[0]["lng"];
        this.setLineNoMarker(lineNo, lat, lng);
      }
    }
    else {
      for (let i = 0; i < this.wardLineNoMarker.length; i++) {
        if (this.wardLineNoMarker[i]["marker"] != null || (<HTMLInputElement>document.getElementById(this.chkIsShowLineNo)).checked == false) {
          this.wardLineNoMarker[i]["marker"].setMap(null);
        }
        else if (this.wardLineNoMarker[i]["marker"] != null || (<HTMLInputElement>document.getElementById(this.chkIsShowLineNo)).checked == true) {
          this.wardLineNoMarker[i]["marker"].setMap(this.map);
        }
      }
    }
  }

  hideSetting() {
    let element = <HTMLElement>document.getElementById("collapsetwo");
    let className = element.className;
    $("#collapsetwo").removeClass(className);
    $("#collapsetwo").addClass("panel-collapse collapse in");
  }

  showSkipLineDetail(content: any) {
    this.skipLineList = [];
    let dbPath = "SkipCaptureImage/" + this.selectedZone + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
    let skipLineInstance = this.db.object(dbPath).valueChanges().subscribe(
      skipLineData => {
        skipLineInstance.unsubscribe();
        if (skipLineData != null) {
          let keyArray = Object.keys(skipLineData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              this.skipLineList.push({ lineNo: index, imageUrl: skipLineData[index]["imageUrl"], time: skipLineData[index]["time"], reason: skipLineData[index]["reason"], latLng: skipLineData[index]["latLng"] });
            }
          }
          this.modalService.open(content, { size: "lg" });
          let windowHeight = $(window).height();
          let windowWidth = $(window).width();
          let height = 870;
          let width = windowWidth - 300;
          height = (windowHeight * 90) / 100;
          let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
          let divHeight = height - 50 + "px";
          $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
          $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
          $("div .modal-dialog-centered").css("margin-top", marginTop);
          $("#divStatus").css("height", divHeight);
        }
        else {
          this.commonService.setAlertMessage("error", "No Skipped Lines!!!");
        }
      }
    );
  }

  showSkippedMarker(latLng: any) {
    if (this.skipLineMarker != null) {
      this.skipLineMarker.setMap(null);
    }
    this.skipLineMarker = null;
    let lat = latLng.split(',')[0];
    let lng = latLng.split(',')[1];
    this.skipLineMarker = new google.maps.Marker({
      position: { lat: Number(lat), lng: Number(lng) },
      map: this.map,
      icon: {
        url: this.skippedMarkerUrl,
        fillOpacity: 1,
        strokeWeight: 0,
        scaledSize: new google.maps.Size(45, 50),
      },
    });
    this.skipLineMarker.setAnimation(google.maps.Animation.BOUNCE);
    this.closeModel();
  }

  ngOnDestroy() {
    if (this.instancesList.length > 0) {
      for (let i = 0; i < this.instancesList.length; i++) {
        this.instancesList[i]["instances"].unsubscribe();
      }
    }
  }
}

export class progressDetail {
  totalLines: number;
  completedLines: number;
  skippedLines: number;
  currentLine: number;
  wardLength: string;
  coveredLength: string;
  driverName: string;
  driverMobile: string;
  helperName: string;
  secondHelperName: string;
  helperMobile: string;
  parshadName: string;
  parshadMobile: string;
  totalDustbin: number;
  rectangularDustbin: number;
  circularDustbin: number;
  totalHouses: number;
  cardNotScanedImages: number;
  scanedHouses: number;
  totalTimer: number;
}
