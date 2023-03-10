import { Component, ViewChild } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../services/common/common.service";
import * as $ from "jquery";
import { Router } from "@angular/router";
import { FirebaseService } from "../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "angularfire2/storage";
import { NgTemplateOutlet } from "@angular/common";
import { isNumber } from "@ng-bootstrap/ng-bootstrap/util/util";
@Component({
  selector: 'app-marker-approval-test',
  templateUrl: './marker-approval-test.component.html',
  styleUrls: ['./marker-approval-test.component.scss']
})
export class MarkerApprovalTestComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private storage: AngularFireStorage, public af: AngularFireModule, public httpService: HttpClient, private router: Router, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  allLines: any[];
  polylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
  lines: any[] = [];
  wardLineCount: any;
  zoneKML: any;
  allMatkers: any[] = [];
  lineNo: any;
  cityName: any;
  previousLine: any;
  centerPoint: any;
  houseMarker: any[] = [];
  markerList: any[];
  toDayDate: any;
  Approvename: any
  userList: any[] = [];
  public isAlreadyShow = false;
  isShowWardAndLine:any;
  houseTypeList: any[] = [];
  divHouseType = "#divHouseType";
  houseWardNo = "#houseWardNo";
  houseLineNo = "#houseLineNo";
  houseIndex = "#houseIndex";
  ddlHouseType = "#ddlHouseType";
  divLoader = "#divLoader";
  deleteMarkerId = "#deleteMarkerId";
  deleteAlreadyCard = "#deleteAlreadyCard";
  divConfirm = "#divConfirm";
  divConfirmApprove = "#divConfirmApprove";
  approveMarkerId = "#approveMarkerId";
  approveAlreadyCard = "#approveAlreadyCard";
  isActionShow: any;
  approveZoneNo = "#approveZoneNo";
  approveLineNo = "#approveLineNo";
  deleteZoneNo = "#deleteZoneNo";
  deletelineNo = "#deleteLineNo";
  btnRemoveIncludedLines="#btnRemoveIncludedLines";
  markerData: markerDetail = {
    totalMarkers: "0",
    totalLines: "0",
    totalLineMarkers: "0",
    approvedLines: "0",
    markerImgURL: "../assets/img/img-not-available-01.jpg",
    houseType: "",
    alreadyCardCount: 0,
    alreadyCardLineCount: 0,
    alreadyCard: "",
    lastScanTime: "",
    isApprovedCount: "0",
    wardno: "0",
    lineno: "0",
    totalHouseTypeModifiedCount:"0",
    totalRemovedMarkersCount:"0",
    lineApprovedBy:"",
    lineApprovedDate:"",
  };
  markerListIncluded:any[]=[];
  deletedMarkerList:any[]=[];
  locationCordinates:any[]=[];  
  workingPersonUrl="../assets/img/walking.png"
  surveyorMarker:any[]=[];
  modifiedMarkerList:any[]=[];
  modificationDataList:any[]=[];
  modificationDataFilterList:any[]=[];
  nearByWards:any[]=[];
  nearByWardsPolygon:any[]=[];
  nearByStatus:any;
  deleteReason:any="0";

  ngOnInit() {
    this.nearByStatus="show";
    this.markerList=[];
    this.deletedMarkerList=[];

    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.isActionShow = true;
    this.isShowWardAndLine=false;
    if (this.cityName == "jaipur-malviyanagar" || this.cityName == "jaipur-murlipura") {
      this.isActionShow = false;
    }
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.commonService.setMapHeight();
    this.showHideAlreadyCardInstalled();
    this.getHouseType();
    this.getZones();
   
  }

  showHideAlreadyCardInstalled() {
    if (this.cityName == "sikar" || this.cityName == "reengus") {
      this.isAlreadyShow = true;
    }
  }

  getHouseType() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDefaults%2FFinalHousesType.json?alt=media";
    let houseTypeInstance = this.httpService.get(path).subscribe(data => {
      houseTypeInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 1; i < keyArray.length; i++) {
          let id = keyArray[i];
          let houseType = data[id]["name"].toString().split("(")[0];
          this.houseTypeList.push({ id: id, houseType: houseType, entityType: data[id]["entity-type"] });
        }
      }
    });
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
    if (this.zoneList != null) {
      this.selectedZone = 0;
      this.map = this.commonService.setMap(this.gmap);
    }
  }

  changeZoneSelection(filterVal: any) {
    $("#btnNearBy").html("Show Near By Wards");
      for(let i=0;i<this.nearByWardsPolygon.length;i++){
          this.nearByWardsPolygon[i].setMap(null);
      }
      this.nearByWardsPolygon=[];
    

    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    $(this.divLoader).show();
    (<HTMLInputElement>document.getElementById("chkAll")).checked = false;
    this.clearAllData();
    this.clearAllOnMap();
    this.commonService.getWardBoundary(this.selectedZone, this.zoneKML, 4).then((data: any) => {
      if (this.zoneKML != undefined) {
        this.zoneKML[0]["line"].setMap(null);
      }
      this.zoneKML = data;
      this.zoneKML[0]["line"].setMap(this.map);
      const bounds = new google.maps.LatLngBounds();
      for (let i = 0; i < this.zoneKML[0]["latLng"].length; i++) {
        bounds.extend({ lat: Number(this.zoneKML[0]["latLng"][i]["lat"]), lng: Number(this.zoneKML[0]["latLng"][i]["lng"]) });
      }
      this.map.fitBounds(bounds);
    });
    this.getWardDetail();
  }

  getWardDetail() {
    this.getTotalMarkers();
    this.getLastScanTime();
    this.getAllLinesFromJson();
    this.getLineApprove();
    this.getTotalRemovedMarkersCount();
    this.getSurveyorLoaction();
   
  }

  getLastScanTime() {
    let dbPath = "EntityMarkingData/LastScanTime/Ward/" + this.selectedZone;
    let lastScanInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        lastScanInstance.unsubscribe();
        if (data != null) {
          $('#divLastUpdate').show();
          this.markerData.lastScanTime = data.toString().split(':')[0] + ":" + data.toString().split(':')[1];
        }
        else {
          this.markerData.lastScanTime = "";
          $('#divLastUpdate').hide();
        }
      }
    );
  }

  getTotalMarkers() {
    let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "";
    let totalInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      totalInstance.unsubscribe();
      if (data != null) {
        this.markerData.totalMarkers = data["marked"].toString();
        if (data["alreadyInstalled"] != null) {
          this.markerData.alreadyCardCount = data["alreadyInstalled"].toString();
        }
        this.markerData.approvedLines = data["approved"].toString();
        this.markerData.totalHouseTypeModifiedCount=data["totalHouseTypeModifiedCount"].toString();

      }
    });
  }

  getTotalRemovedMarkersCount(){
    
    let dbPath="EntityMarkingData/RemovedMarkers/"+this.selectedZone+"/totalRemovedMarkersCount";
    let deleteCountInstance=this.db.object(dbPath).valueChanges().subscribe((data)=>{
      deleteCountInstance.unsubscribe();
      this.markerData.totalRemovedMarkersCount=Number(data);
      
    });
  }

  showAllMarkers() {
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        this.houseMarker[i]["marker"].setMap(null);
      }
      this.houseMarker = [];
    }
    let element = <HTMLInputElement>document.getElementById("chkAll");
    if (element.checked == true) {
      for (let i = 1; i <= this.wardLineCount; i++) {
        this.showMarkers(i);
      }
    } else {
      this.showMarkers(this.lineNo);
    }
  }

  showMarkers(lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (data[index]["latLng"] != undefined) {
              let lat = data[index]["latLng"].split(",")[0];
              let lng = data[index]["latLng"].split(",")[1];
              let type = data[index]["houseType"];
              let houseTypeDetail = this.houseTypeList.find(item => item.id == type);
              if (houseTypeDetail != undefined) {
                let houseType = houseTypeDetail.houseType;
                let markerURL = this.getMarkerIcon(type);
                this.setMarker(lat, lng, markerURL, houseType, "", "marker", lineNo, "", index);
              }
            }
          }
        }
      }
    });
  }

  getApprovedLines() {
    this.markerData.approvedLines = "0";
    let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "/approved";
    let approvedInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      approvedInstance.unsubscribe();
      if (data != null) {
        this.markerData.approvedLines = data.toString();
      }
    });
  }

  getAllLinesFromJson() {
    this.commonService.getWardLine(this.selectedZone, this.toDayDate).then((data: any) => {
      if (this.polylines.length > 0) {
        for (let i = 0; i < this.polylines.length; i++) {
          if (this.polylines[i] != null) {
            this.polylines[i].setMap(null);
          }
        }
      }
      this.polylines = [];

      if (this.allMatkers.length > 0) {
        for (let i = 0; i < this.allMatkers.length; i++) {
          if (this.allMatkers[i]["marker"] != null) {
            this.allMatkers[i]["marker"].setMap(null);
          }
        }
        this.allMatkers = [];
      }
      let wardLines = JSON.parse(data);
      let keyArray = Object.keys(wardLines);
      this.wardLineCount = wardLines["totalLines"];
      this.markerData.totalLines = this.wardLineCount;
      let lineNo = 0;
      for (let i = 0; i < keyArray.length - 3; i++) {
        lineNo = Number(keyArray[i]);
        let points = wardLines[lineNo]["points"];
        var latLng = [];
        for (let j = 0; j < points.length; j++) {
          latLng.push({ lat: points[j][0], lng: points[j][1] });
        }
        this.lines.push({ lineNo: lineNo, latlng: latLng, color: "#87CEFA", });
        this.plotLineOnMap(lineNo, latLng, i, this.selectedZone);
      }
      this.getMarkedHouses(this.lineNo);
    });
  }

  getMarkedHouses(lineNo: any) {
    $(this.divLoader).show();
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      this.markerList = [];
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          let count = 0;
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (data[index]["latLng"] != undefined) {
              let lat = data[index]["latLng"].split(",")[0];
              let lng = data[index]["latLng"].split(",")[1];
              let imageName = data[index]["image"];
              let userId = data[index]["userId"];
              let date = "";

              if (data[index]["date"] != null) {
                date = data[index]["date"].split(" ")[0];
              }
              let approveDate = data[index]["approveDate"];
              let status = "";
              let statusClass = "";
              let isRevisit = "0";
              let cardNumber = "";
              let isApprove = "0";
              let servingCount = 0;
              let markingBy = "";
              let ApproveId = 0;
              let approveName = ""
              let modifiedHouseTypeHistoryId = "";
              this.markerData.wardno = this.selectedZone;
              this.markerData.lineno = this.lineNo;

              if (data[index]["houseType"] == "19" || data[index]["houseType"] == "20") {
                servingCount = parseInt(data[index]["totalHouses"]);
                if (isNaN(servingCount)) {
                  servingCount = 0;
                }
              }

              if (data[index]["isApprove"] != null) {
                if (data[index]["isApprove"] == "1") {
                  count++;
                }
                isApprove = data[index]["isApprove"];
              }
              this.markerData.isApprovedCount = count.toString();
              if (data[index]["status"] != null) {
                // status = data[index]["status"];
              }
              if (data[index]["cardNumber"] != null) {
                cardNumber = data[index]["cardNumber"];
                status = "Surveyed";
              }
              if (data[index]["revisitKey"] != null) {
                status = "Revisit";
              }
              if (data[index]["rfidNotFoundKey"] != null) {
                status = "RFID not matched";
              }
              if (data[index]["revisitCardDeleted"] != null) {
                status = "Revisit Deleted";
                isRevisit = "1";
                statusClass = "status-deleted";
              }
              if (data[index]["approveById"] != null) {

                ApproveId = data[index]["approveById"];
              }
              if (data[index]["modifiedHouseTypeHistoryId"] != null) {
                modifiedHouseTypeHistoryId = data[index]["modifiedHouseTypeHistoryId"];
              }


              let city = this.commonService.getFireStoreCity();
              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FMarkingSurveyImages%2F" + this.selectedZone + "%2F" + this.lineNo + "%2F" + imageName + "?alt=media";
              let type = data[index]["houseType"];
              let alreadyInstalled = "नहीं";
              if (data[index]["alreadyInstalled"] == true) {
                this.markerData.alreadyCardLineCount =
                  this.markerData.alreadyCardLineCount + 1;
                alreadyInstalled = "हाँ";
              }
              let alreadyCard = "";
              if (alreadyInstalled == "हाँ") {
                alreadyCard = "(कार्ड पहले से लगा हुआ है) ";
              }
              let houseType = "";
              let houseTypeDetail = this.houseTypeList.find(item => item.id == type);
              if (houseTypeDetail != undefined) {
                houseType = houseTypeDetail.houseType;
              }
              this.markerList.push({ zoneNo: this.selectedZone, lineNo: lineNo, index: index, lat: lat, lng: lng, alreadyInstalled: alreadyInstalled, imageName: imageName, type: houseType, imageUrl: imageUrl, status: status, userId: userId, date: date, statusClass: statusClass, isRevisit: isRevisit, cardNumber: cardNumber, houseTypeId: type, isApprove: isApprove, servingCount: servingCount, approveDate: approveDate, markingBy: markingBy, ApproveId: ApproveId, approveName: approveName, modifiedHouseTypeHistoryId: modifiedHouseTypeHistoryId });
              let markerURL = this.getMarkerIcon(type);
              this.setMarker(lat, lng, markerURL, houseType, imageName, "marker", lineNo, alreadyCard, index);
              this.getUsername(index, userId, this.selectedZone, lineNo);
              this.getApproveUsername(ApproveId, index, this.selectedZone, lineNo);
            }
          }
         

          $(this.divLoader).hide();
        }
        else {
          $(this.divLoader).hide();
        }
      }
      else {
        $(this.divLoader).hide();
      }

    });

  }
  getUsername(index: any, userId: any, zoneNo: any, lineNo: any) {
    let path = "EntityMarkingData/MarkerAppAccess" + "/" + userId + "/" + "name";
    let usernameInstance = this.db.object(path).valueChanges().subscribe((data) => {
      usernameInstance.unsubscribe();
      let detail;
      detail = this.markerList.find(item => item.index == index && item.zoneNo == zoneNo && item.lineNo == lineNo);
      if (detail != undefined) {
        detail.markingBy = data;
      }
      else{
        detail=this.markerListIncluded.find(item => item.index == index && item.zoneNo == zoneNo && item.lineNo == lineNo);
        if (detail != undefined) {
          detail.markingBy = data;
        }
      }
     
    })
  }
  getApproveUsername(ApproveId: any, index: any, zoneNo: any, lineNo: any) {
    this.userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    let userDetail = this.userList.find(item => item.userId == ApproveId);
    if (userDetail != undefined) {
      let detail;
       detail=this.markerList.find(item => item.index == index && item.zoneNo == zoneNo && item.lineNo == lineNo);
      if (detail != undefined) {
        detail.approveName = userDetail.name;
      }
      else{
        detail=this.markerListIncluded.find(item => item.index == index && item.zoneNo == zoneNo && item.lineNo == lineNo);
        if (detail != undefined) {
          detail.approveName = userDetail.name;
        }
      }
      
    }
  }
  getOtherMarkerData() {
    let height:any=$("#divStatusHeight").val();
    $("#divStatus1").css("height",height);
    $("#divStatus2").css("height",height);

    this.markerListIncluded=[];
    let zoneNo = $("#ddlZoneMarker").val();
    let lineNo = $("#txtLine").val();
    if (zoneNo == "0") {
      this.commonService.setAlertMessage("error", "Select zone number");
      return;
    }
    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Select line number");
      return;
    }
    if (this.markerData.wardno == zoneNo && this.markerData.lineno == lineNo) {
      this.commonService.setAlertMessage("error", "sorry ! ward " + this.markerData.wardno + " and line " + this.markerData.lineno + " already selected");
      return;
    }


    this.markerList = this.markerList.filter(item => item.lineNo == this.markerData.lineno && item.zoneNo == this.markerData.wardno);
    let path = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
    let houseInstance = this.db.object(path).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          let count = 0;
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (data[index]["latLng"] != undefined) {
              count++;
              let lat = data[index]["latLng"].split(",")[0];
              let lng = data[index]["latLng"].split(",")[1];
              let imageName = data[index]["image"];
              let userId = data[index]["userId"];
              let date = "";

              if (data[index]["date"] != null) {
                date = data[index]["date"].split(" ")[0];
              }
              let approveDate = data[index]["approveDate"];
              let status = "";
              let statusClass = "";
              let isRevisit = "0";
              let cardNumber = "";
              let isApprove = "0";
              let servingCount = 0;
              let markingBy = "";
              let ApproveId = 0;
              let approveName = ""
              let modifiedHouseTypeHistoryId = "";
              this.markerData.wardno = this.selectedZone;
              this.markerData.lineno = this.lineNo;
              if (data[index]["houseType"] == "19" || data[index]["houseType"] == "20") {
                servingCount = parseInt(data[index]["totalHouses"]);
                if (isNaN(servingCount)) {
                  servingCount = 0;
                }
              }

              if (data[index]["isApprove"] != null) {
                isApprove = data[index]["isApprove"];
              }
              
              if (data[index]["status"] != null) {
                // status = data[index]["status"];
              }
              if (data[index]["cardNumber"] != null) {
                cardNumber = data[index]["cardNumber"];
                status = "Surveyed";
              }
              if (data[index]["revisitKey"] != null) {
                status = "Revisit";
              }
              if (data[index]["rfidNotFoundKey"] != null) {
                status = "RFID not matched";
              }
              if (data[index]["revisitCardDeleted"] != null) {
                status = "Revisit Deleted";
                isRevisit = "1";
                statusClass = "status-deleted";
              }
              if (data[index]["approveById"] != null) {

                ApproveId = data[index]["approveById"];
              }
              if (data[index]["modifiedHouseTypeHistoryId"] != null) {

                modifiedHouseTypeHistoryId = data[index]["modifiedHouseTypeHistoryId"];
              }

              let city = this.commonService.getFireStoreCity();
              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FMarkingSurveyImages%2F" + zoneNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
              let type = data[index]["houseType"];
              let alreadyInstalled = "नहीं";
              if (data[index]["alreadyInstalled"] == true) {
                this.markerData.alreadyCardLineCount =
                  this.markerData.alreadyCardLineCount + 1;
                alreadyInstalled = "हाँ";
              }
              let alreadyCard = "";
              if (alreadyInstalled == "हाँ") {
                alreadyCard = "(कार्ड पहले से लगा हुआ है) ";
              }
              let houseType = "";
              let houseTypeDetail = this.houseTypeList.find(item => item.id == type);
              if (houseTypeDetail != undefined) {
                houseType = houseTypeDetail.houseType;
              }
              
              this.markerListIncluded.push({ zoneNo: zoneNo, lineNo: lineNo, index: index, lat: lat, lng: lng, alreadyInstalled: alreadyInstalled, imageName: imageName, type: houseType, imageUrl: imageUrl, status: status, userId: userId, date: date, statusClass: statusClass, isRevisit: isRevisit, cardNumber: cardNumber, houseTypeId: type, isApprove: isApprove, servingCount: servingCount, approveDate: approveDate, markingBy: markingBy, ApproveId: ApproveId, approveName: approveName, modifiedHouseTypeHistoryId: modifiedHouseTypeHistoryId });
              this.getUsername(index, userId, zoneNo, lineNo);
              this.getApproveUsername(ApproveId, index, zoneNo, lineNo);
            }
          }
          if (count == 0) {
            this.commonService.setAlertMessage("error", "No marker found in ward " + zoneNo + " on line " + lineNo + " !!!");
          }
          else {
            this.isShowWardAndLine=true;
            $(this.btnRemoveIncludedLines).show();
            this.commonService.setAlertMessage("success", "Marker added for ward " + zoneNo + " and line " + lineNo + " !!!");
          }
          $(this.divLoader).hide();
        }
        else {
          this.commonService.setAlertMessage("error", "No marker found in ward " + zoneNo + " on line " + lineNo + " !!!");
          $(this.divLoader).hide();
        }
      }
      else {
        this.commonService.setAlertMessage("error", "No marker found in ward " + zoneNo + " on line " + lineNo + " !!!");
        $(this.divLoader).hide();
      }
    });
  }
 
  setHouseType(index: any, zoneNo: any, lineNo: any,type:any) {
    $(this.divHouseType).show();
    $(this.houseIndex).val(index);
    $(this.houseLineNo).val(lineNo);
    $(this.houseWardNo).val(zoneNo);
    $("#type").val(type);
    let detail;
    if(type=="marker"){
      detail = this.markerList.find(item => item.index == index && item.zoneNo == zoneNo && item.lineNo == lineNo);
    }
    else if(type=="includedMarker"){
      detail=this.markerListIncluded.find(item => item.index == index && item.zoneNo == zoneNo && item.lineNo == lineNo);
    }
    
    if (detail != undefined) {
      let houseTypeId = detail.houseTypeId;
      $(this.ddlHouseType).val(houseTypeId);
    }
  }

  updateHouseType() {
    let index = $(this.houseIndex).val();
    let zoneNo = $(this.houseWardNo).val();
    let lineNo = $(this.houseLineNo).val();
    let houseTypeId = $(this.ddlHouseType).val();
    let type= $("#type").val();
    let detail;
    if(type=="marker"){
      detail=this.markerList.find(item => item.index == index && item.lineNo == lineNo && item.zoneNo == zoneNo);
    }
    else if(type=="includedMarker"){
      detail=this.markerListIncluded.find(item => item.index == index && item.lineNo == lineNo && item.zoneNo == zoneNo);
    }
    if (detail != undefined) {
      let preHouseTypeId = detail.houseTypeId;
      let modifiedHouseTypeHistoryId = detail.modifiedHouseTypeHistoryId;
      detail.houseTypeId = houseTypeId;
      let houseTypeDetail = this.houseTypeList.find(item => item.id == houseTypeId);
      if (houseTypeDetail != undefined) {
        detail.type = houseTypeDetail.houseType;
        let zoneNo = detail.zoneNo;
        let lineNo = detail.lineNo;
        if (detail.cardNumber != "") {
          let cardType = "";
          if (houseTypeDetail.entityType == "residential") {
            cardType = "आवासीय"
          }
          else {
            cardType = "व्यावसायिक";
          }
          let dbPath = "Houses/" + zoneNo + "/" + lineNo + "/" + detail.cardNumber;
          this.db.object(dbPath).update({ houseType: houseTypeId, cardType: cardType });
        }
        let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + index;
        this.db.object(dbPath).update({ houseType: houseTypeId });
        this.saveModifiedHouseTypeHistory(index, zoneNo, lineNo, modifiedHouseTypeHistoryId, preHouseTypeId, houseTypeId,type);
      }

    }
   
    $(this.houseIndex).val("0");
    $(this.divHouseType).hide();
    this.commonService.setAlertMessage("success", "Saved successfully !!!");
  }

  saveModifiedHouseTypeHistory(index: any, zoneNo: any, lineNo: any, modifiedHouseTypeHistoryId: any, preHouseTypeId: any, houseTypeId: any,type:any) {
    const data = {
      preHouseTypeId: preHouseTypeId,
      newHouseTypeId: houseTypeId,
      updatedById: localStorage.getItem("userID"),
      updateDate: this.toDayDate + " " + this.commonService.getCurrentTime()
    }

    if (modifiedHouseTypeHistoryId == "") {
      let newRef = this.db.list("EntityMarkingData/ModifiedHouseTypeHistory").push({ a: "a" });
      let modifiedHouseTypeHistoryId = newRef.key;
      this.db.object("EntityMarkingData/ModifiedHouseTypeHistory/" + modifiedHouseTypeHistoryId + "/a").remove();
      this.db.list("EntityMarkingData/ModifiedHouseTypeHistory/" + modifiedHouseTypeHistoryId).push(data);
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + index;
      this.db.object(dbPath).update({ modifiedHouseTypeHistoryId });

      let detail; 
      if(type=="marker")
      {
        detail=this.markerList.find(item => item.index == index && item.lineNo == lineNo && item.zoneNo == zoneNo);
      }
      else if(type=="includedMarker"){
        detail=this.markerListIncluded.find(item => item.index == index && item.lineNo == lineNo && item.zoneNo == zoneNo);

      }
      if (detail != undefined)
      {
        detail.modifiedHouseTypeHistoryId = modifiedHouseTypeHistoryId;
      }

        this.markerData.totalHouseTypeModifiedCount=Number(this.markerData.totalHouseTypeModifiedCount)+1;
        let path="EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/"+zoneNo+"/totalHouseTypeModifiedCount"
        let modifiedCountInstance =  this.db.object(path).valueChanges().subscribe((data)=>{
        modifiedCountInstance.unsubscribe();
        let count=1;
        if(data!=null){
         count=Number(data)+1;
          this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/"+zoneNo).update({totalHouseTypeModifiedCount:count});
        }
         else{
          this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/"+zoneNo).update({totalHouseTypeModifiedCount:count});
         }
     
      });
      
    }

    else {
      let dbPath = "EntityMarkingData/ModifiedHouseTypeHistory/" + modifiedHouseTypeHistoryId;
      this.db.list(dbPath).push(data);
    }
    
  }

  cancelHouseType() {
    $(this.houseIndex).val("0");
    $(this.divHouseType).hide();
  }

  showLineDetail(content: any,type:any) {
    if(this.selectedZone=="0"){
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
   
    if(type=="deletedMarker" ){
      this.deletedMarkerList=[];
      let dbPath="EntityMarkingData/RemovedMarkers/"+this.selectedZone;
      let deleteCountInstance=this.db.object(dbPath).valueChanges().subscribe((data)=>{
        deleteCountInstance.unsubscribe();
        if(data!=null)
        {
          this.openPopUp(content,type);
          this. getDeletedMarkerData(data);
        }
        else {
          this.commonService.setAlertMessage("error", "No Deleted Marker Found !!!");
          
        }
      });
      
    }
    else if(type=="modifiedMarker"){
      // this.openPopUp(content);
      this.getMarkersList(content,type);
    }
    
    
    else{      
      if (this.markerList.length == 0) {
        this.commonService.setAlertMessage("error", "No Marker Found !!!");
      }
      else{
        this.openPopUp(content,type);
        this.markerApprovalStatus();
      }
    }
  }
  openPopUp(content:any,type:any){
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 870;
    
    let width = windowWidth - 300;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    
    let divHeight = height - 100 + "px";
    if(type=="approvedMarker")
   { 
    divHeight = height - 200 + "px";
   }
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
    $("#divStatusHeight").val(divHeight);

  }

  closeModel() {
    this.modalService.dismissAll();
    this.markerListIncluded=[];
    this.deletedMarkerList=[];
    }

  confirmationMarkerDelete(markerNo: any, alreadyCard: any, zoneNo: any, lineNo: any,type:any) {
    $(this.deleteMarkerId).val(markerNo);
    $(this.deleteAlreadyCard).val(alreadyCard);
    $(this.deleteZoneNo).val(zoneNo);
    $(this.deletelineNo).val(lineNo);
    $("#type").val(type)
    this.deleteReason="0";
    $(this.divConfirm).show(); 
  }

  confirmationMarkerApprove(markerNo: any, alreadyCard: any, zoneNo: any, lineNo: any,type:any) {
    $(this.divConfirmApprove).show();
    $(this.approveMarkerId).val(markerNo);
    $(this.approveZoneNo).val(zoneNo);
    $(this.approveLineNo).val(lineNo);
    $("#type").val(type)
  }

  cancelMarkerDelete() {
    $(this.deleteMarkerId).val("0");
    $(this.deleteAlreadyCard).val("");
    $(this.divConfirm).hide();
  }
  cancelMarkerApproveDelete() {
    $(this.deleteMarkerId).val("0");
    $(this.deleteAlreadyCard).val("");
    $(this.divConfirmApprove).hide();
  }

  deleteMarker() {
    this.deleteReason=$("#reasonSelect").val();
    if(this.deleteReason=="0"){
      this.commonService.setAlertMessage("error", "Please Select a Delete Reason!!!");
      return;
    }
    let markerNo = $(this.deleteMarkerId).val();
    let alreadyCard = $(this.deleteAlreadyCard).val();
    let zoneNo = $(this.deleteZoneNo).val();
    let lineNo = $(this.deletelineNo).val();
    let type   = $("#type").val()
    this.removeMarker(markerNo, alreadyCard, zoneNo, lineNo,type,this.deleteReason);
    $(this.divConfirm).hide();
  }
  removeAddLines(){
    this.markerListIncluded=[];
    this.markerList = this.markerList.filter(item => item.lineNo == this.markerData.lineno && item.zoneNo == this.markerData.wardno);
    $("#ddlZoneMarker").val("0");
    $("#txtLine").val("");
    this.isShowWardAndLine=false;
    $(this.btnRemoveIncludedLines).hide();
    setTimeout(()=>{
      this.commonService.setAlertMessage("success", "Remove successfully !!!");
    },100)
 
    }
  removeMarker(markerNo: any, alreadyCard: any, zoneNo: any, lineNo: any,type:any,reason:any) {
    $(this.divLoader).show();
    
    let markerDatails;
    if(type=="marker")
    {
      markerDatails= this.markerList.find((item) => item.index == markerNo && item.zoneNo==zoneNo && item.lineNo==lineNo);  
    }
    else if(type=="includedMarker"){
      markerDatails= this.markerListIncluded.find((item) => item.index == markerNo && item.zoneNo==zoneNo && item.lineNo==lineNo); 
    }

    if (markerDatails != undefined) {
      let userId = markerDatails.userId;
      let date = markerDatails.date.toString().split(" ")[0];
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          data["removeDate"] = this.commonService.getTodayDateTime();
          data["removeBy"] = localStorage.getItem("userID");
          data["reason"]=reason;

          dbPath = "EntityMarkingData/RemovedMarkers/" + zoneNo + "/" + lineNo + "/" + markerNo;
          this.db.object(dbPath).update(data);

          dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/";
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let key = keyArray[i];
              data[key] = null;
            }
          }
          this.db.object(dbPath).update(data);
          dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/marksCount";
          let markerCountInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
            markerCountInstance.unsubscribe();
            if (data != null) {
              let marksCount = Number(data) - 1;
              this.markerData.totalMarkers = (Number(this.markerData.totalMarkers) - 1).toString();
              if(type=="marker")
              {
               
                this.markerData.totalLineMarkers = (Number(this.markerData.totalLineMarkers) - 1).toString();
              }
              
              dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
              const data1 = {
                marksCount: marksCount,
              };
              this.db.object(dbPath).update(data1);
            }
          });

          if (this.houseMarker.length > 0) {
            for (let i = 0; i < this.houseMarker.length; i++) {
              if (this.houseMarker[i]["markerNo"] == markerNo) {
                this.houseMarker[i]["marker"].setMap(null);
              }
            }
          }

          let newMarkerList = [];
       
          if(type=="marker"){
            if (this.markerList.length > 0) {
              for (let i = 0; i < this.markerList.length; i++) {
                if (this.markerList[i]["index"] == markerNo && this.markerList[i]["zoneNo"] == zoneNo && this.markerList[i]["lineNo"] == lineNo) {
                  if (this.markerList[i]["approveName"] != "") {
                    this.markerData.isApprovedCount = (Number(this.markerData.isApprovedCount) - 1).toFixed(0);
                  }
                }
                else {
                  newMarkerList.push({ zoneNo: this.markerList[i]["zoneNo"], lineNo: this.markerList[i]["lineNo"], index: this.markerList[i]["index"], lat: this.markerList[i]["lat"], lng: this.markerList[i]["lng"], alreadyInstalled: this.markerList[i]["alreadyInstalled"], imageName: this.markerList[i]["imageName"], type: this.markerList[i]["type"], imageUrl: this.markerList[i]["imageUrl"], status: this.markerList[i]["status"], userId: this.markerList[i]["userId"], date: this.markerList[i]["date"], statusClass: this.markerList[i]["statusClass"], isRevisit: this.markerList[i]["isRevisit"], cardNumber: this.markerList[i]["cardNumber"], houseTypeId: this.markerList[i]["houseTypeId"], isApprove: this.markerList[i]["isApprove"], servingCount: this.markerList[i]["servingCount"], approveDate: this.markerList[i]["approveDate"], markingBy: this.markerList[i]["markingBy"], ApproveId: this.markerList[i]["ApproveId"], approveName: this.markerList[i]["approveName"], modifiedHouseTypeHistoryId: this.markerList[i]["modifiedHouseTypeHistoryId"] })
                }
              }
              this.markerList = newMarkerList;
            }
          }
          else if(type=="includedMarker"){
             if (this.markerListIncluded.length > 0) {
              for (let i = 0; i < this.markerListIncluded.length; i++) {
                let key=this.markerListIncluded[i];


                if (key["index"] == markerNo && key["zoneNo"] == zoneNo && key["lineNo"] == lineNo) {
                  if (key["approveName"] != "") {
                    if(type=="marker"){
                      this.markerData.isApprovedCount = (Number(this.markerData.isApprovedCount) - 1).toFixed(0);
                    }
                   
                  }
                }
                else {
                  newMarkerList.push({ zoneNo: key["zoneNo"], lineNo: key["lineNo"], index: key["index"], lat: key["lat"], lng: key["lng"], alreadyInstalled: key["alreadyInstalled"], imageName: key["imageName"], type: key["type"], imageUrl: key["imageUrl"], status: key["status"], userId: key["userId"], date: key["date"], statusClass: key["statusClass"], isRevisit: key["isRevisit"], cardNumber: key["cardNumber"], houseTypeId: key["houseTypeId"], isApprove: key["isApprove"], servingCount: key["servingCount"], approveDate: key["approveDate"], markingBy:key["markingBy"], ApproveId:key["ApproveId"], approveName:key["approveName"], modifiedHouseTypeHistoryId: key["modifiedHouseTypeHistoryId"] })
                }
              }
              this.markerListIncluded = newMarkerList;
            }
          }
          
          if (alreadyCard == "हाँ") {
            let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo + "/alreadyInstalled";
            let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe(
              alreadyData => {
                alreadyInstance.unsubscribe();
                let total = 0;
                if (alreadyData != null) {
                  total = Number(alreadyData) - 1;
                }
                this.markerData.alreadyCardCount = this.markerData.alreadyCardCount - 1;
                this.markerData.alreadyCardLineCount = this.markerData.alreadyCardLineCount - 1;
               this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo + "/").update({ alreadyInstalled: total });
                let wardDetail = this.markerList.find((item) => item.index == markerNo && item.zoneNo == zoneNo && item.lineNo == lineNo);
                if (wardDetail != undefined) {
                  wardDetail.alreadyInstalled = Number(wardDetail.alreadyInstalled) - 1;

                }
              }
            );

            dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/alreadyInstalledCount";
            let alreadyLineInstance = this.db.object(dbPath).valueChanges().subscribe(
              alreadyLineData => {
                alreadyLineInstance.unsubscribe();
                let total = 0;
                if (alreadyLineData != null) {
                  total = Number(alreadyLineData) - 1;
                }
                this.db.object("EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/").update({ alreadyInstalledCount: total });
              }
            );
          }
        
          if(markerDatails.modifiedHouseTypeHistoryId!=""){
            
             this.markerData.totalHouseTypeModifiedCount=Number(this.markerData.totalHouseTypeModifiedCount)-1;
             let path="EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/"+zoneNo+"/totalHouseTypeModifiedCount"
             let modifiedCountInstance =  this.db.object(path).valueChanges().subscribe((data)=>{
             modifiedCountInstance.unsubscribe();
             let count=1;
             if(data!=null){
              count=Number(data)-1;
               this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/"+zoneNo).update({totalHouseTypeModifiedCount:count});
             }
     
            });
          }

           
          let path="EntityMarkingData/RemovedMarkers/"+zoneNo+"/totalRemovedMarkersCount"
          let totalRemovedCountInstance =  this.db.object(path).valueChanges().subscribe((data)=>{
          totalRemovedCountInstance.unsubscribe();
          let count=1;
          if(data!=null){
          count=Number(data)+1;
          this.db.object("EntityMarkingData/RemovedMarkers/"+zoneNo).update({totalRemovedMarkersCount:count});
          this.markerData.totalRemovedMarkersCount=Number(this.markerData.totalRemovedMarkersCount)+1;
          }
         else{
          this.db.object("EntityMarkingData/RemovedMarkers/"+zoneNo).update({totalRemovedMarkersCount:count});
          this.markerData.totalRemovedMarkersCount=count;
         }
  
         });



         this.updateCount(date, userId, zoneNo, "remove");
          this.commonService.setAlertMessage("success", "Marker deleted successfully !!!");
        }
        else {
          $(this.divLoader).hide();
        }
      });
    }
  }

  updateCount(date: any, userId: any, zoneNo: any, type: any) {
    let countKey = "rejected";
    let totalCountKey = "totalRejected";
    if (type != "reject") {
      countKey = "marked";
      totalCountKey = "totalMarked";
    }
    //// employee date wise rejected
    let totalinstance1 = this.db.object("EntityMarkingData/MarkingSurveyData/Employee/DateWise/" + date + "/" + userId + "/" + countKey).valueChanges().subscribe((totalCount) => {
      totalinstance1.unsubscribe();
      let total = 1;
      if (totalCount != null) {
        if (type == "reject") {
          total = Number(totalCount) + 1;
        } else {
          total = Number(totalCount) - 1;
        }
      }
      if (type == "reject") {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/DateWise/" + date + "/" + userId).update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/DateWise/" + date + "/" + userId).update({ marked: total, });
      }
    });

    let totalinstanceReject1 = this.db.object("EntityMarkingData/MarkingSurveyData/Employee/DateWise/" + date + "/" + totalCountKey).valueChanges().subscribe((totalCount) => {
      totalinstanceReject1.unsubscribe();
      let total = 1;
      if (totalCount != null) {
        if (type == "reject") {
          total = Number(totalCount) + 1;
        } else {
          total = Number(totalCount) - 1;
        }
      }
      if (type == "reject") {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/DateWise/" + date).update({ totalRejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/DateWise/" + date).update({ totalMarked: total, });
      }
    });

    ////  employee wise rejected
    let totalinstance2 = this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + zoneNo + "/" + countKey).valueChanges().subscribe((totalCount) => {
      totalinstance2.unsubscribe();
      let total = 1;
      if (totalCount != null) {
        if (type == "reject") {
          total = Number(totalCount) + 1;
        } else {
          total = Number(totalCount) - 1;
        }
      }
      if (type == "reject") {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + zoneNo + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + zoneNo + "").update({ marked: total, });
      }
    });

    let totalinstanceRejected2 = this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + totalCountKey).valueChanges().subscribe((totalCount) => {
      totalinstanceRejected2.unsubscribe();
      let total = 1;
      if (totalCount != null) {
        if (type == "reject") {
          total = Number(totalCount) + 1;
        } else {
          total = Number(totalCount) - 1;
        }
      }
      if (type == "reject") {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId).update({ totalRejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId).update({ totalMarked: total, });
      }
    });

    //// ward date wise rejected
    let totalinstance3 = this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + zoneNo + "/" + countKey).valueChanges().subscribe((totalCount) => {
      totalinstance3.unsubscribe();
      let total = 1;
      if (totalCount != null) {
        if (type == "reject") {
          total = Number(totalCount) + 1;
        } else {
          total = Number(totalCount) - 1;
        }
      }
      if (type == "reject") {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + zoneNo + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + zoneNo + "").update({ marked: total, });
      }
    });

    let totalinstanceRejected3 = this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + totalCountKey).valueChanges().subscribe((totalCount) => {
      totalinstanceRejected3.unsubscribe();
      let total = 1;
      if (totalCount != null) {
        if (type == "reject") {
          total = Number(totalCount) + 1;
        } else {
          total = Number(totalCount) - 1;
        }
      }
      if (type == "reject") {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date).update({ totalRejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date).update({ totalMarked: total, });
      }
    });

    //// ward ward wise rejected
    let totalinstance4 = this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo + "/" + countKey).valueChanges().subscribe((totalCount) => {
      totalinstance4.unsubscribe();
      let total = 1;
      if (totalCount != null) {
        if (type == "reject") {
          total = Number(totalCount) + 1;
        } else {
          total = Number(totalCount) - 1;
        }
      }
      if (type == "reject") {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo + "").update({ marked: total, });
      }
    });
    $(this.divLoader).hide();
  }

  saveMarkerStatus(markerNo: any, zoneNo: any, lineNo: any,type:any) {
    let markerDatails;
    if(type=="marker")
    {
      markerDatails=this.markerList.find((item) => item.index == markerNo && item.zoneNo == zoneNo && item.lineNo == lineNo);
    }
    else if(type=="includedMarker"){
      markerDatails=this.markerListIncluded.find((item) => item.index == markerNo && item.zoneNo == zoneNo && item.lineNo == lineNo);

    }
 
    if (markerDatails != undefined) {
      let userId = markerDatails.userId;
      let date = markerDatails.date.toString().split(" ")[0];
      markerDatails.status = "Reject";
      markerDatails.isApprove = "0";
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
      this.db.object(dbPath).update({ status: "Reject", isApprove: "0" });
      this.updateCount(date, userId, zoneNo, "reject");
      this.commonService.setAlertMessage("success", "Marker rejected successfully !!!");
    }
  }

  approveMarkerStatus() {
    let markerNo = $(this.approveMarkerId).val();
    let zoneNo = $(this.approveZoneNo).val();
    let lineNo = $(this.approveLineNo).val();
    let Entity = "chkApprovedEntity";
    let Markar = "chkApprovedMarkar";
    let type   = $("#type").val()
    if ((<HTMLInputElement>document.getElementById(Entity)).checked == false) {
      this.commonService.setAlertMessage("error", "Choose Entity checkbox !!! ");
      return;
    }
    if ((<HTMLInputElement>document.getElementById(Markar)).checked == false) {
      this.commonService.setAlertMessage("error", "Choose Markar checkbox !!!");
      return;
    }
    let markerDatails;
    if(type=="marker"){
      markerDatails=this.markerList.find((item) => item.index == markerNo && item.zoneNo == zoneNo && item.lineNo == lineNo);
    }
    else if(type=="includedMarker"){
      markerDatails=this.markerListIncluded.find((item) => item.index == markerNo && item.zoneNo == zoneNo && item.lineNo == lineNo);
    }
      
    if (markerDatails != undefined) {
      markerDatails.isApprove = "1";
      markerDatails.approveDate = this.commonService.getTodayDateTime();
      if (this.markerData.wardno == zoneNo && this.markerData.lineno == lineNo) {
        this.markerData.isApprovedCount = (Number(this.markerData.isApprovedCount) + 1).toFixed(0);
      }
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
      this.db.object(dbPath).update({ isApprove: "1", approveById: localStorage.getItem("userID"), approveDate: this.commonService.getTodayDateTime() });
      (<HTMLInputElement>document.getElementById(Entity)).checked = false;
      (<HTMLInputElement>document.getElementById(Markar)).checked = false;
      this.getApproveUsername(localStorage.getItem("userID"), markerNo, zoneNo, lineNo,);
      this.commonService.setAlertMessage("success", "Marker approved successfuly !!!");
      $(this.divConfirmApprove).hide();
    }
    if(this.markerData.isApprovedCount==this.markerData.totalLineMarkers){
      let element =(<HTMLInputElement>document.getElementById("approveCheck"));
      element.disabled=false;


    }
  }

  getMarkerIcon(type: any) {
    let url = "../assets/img/marking-house.png";
    if (type == 1 || type == 19 || type == 25) {
      url = "../assets/img/marking-house.png";
    } else if (type == 2 || type == 3 || type == 6 || type == 7 || type == 8 || type == 9 || type == 10 || type == 20) {
      url = "../assets/img/marking-shop.png";
    } else if (type == 14 || type == 15) {
      url = "../assets/img/marking-warehouse.png";
    } else if (type == 21 || type == 22) {
      url = "../assets/img/marking-institute.png";
    } else if (type == 4 || type == 5) {
      url = "../assets/img/marking-hotel.png";
    } else if (type == 16 || type == 17) {
      url = "../assets/img/marking-mela.png";
    } else if (type == 18) {
      url = "../assets/img/marking-thela.png";
    } else if (type == 11 || type == 12 || type == 13) {
      url = "../assets/img/marking-hospital.png";
    }
    return url;
  }

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any) {
    if (wardNo == this.selectedZone) {
      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }
      let strokeWeight = 2;
      let status = "";
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
        this.setMarker(lat, lng, this.invisibleImageUrl, lineNo.toString(), "", "lineNo", lineNo, "", "");
      }
    }
  }

  setMarker(lat: any, lng: any, markerURL: any, markerLabel: any, imageName: any, type: any, lineNo: any, alreadyCard: any, markerNo: any) {
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
        let imageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FMarkingSurveyImages%2F" + wardNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
        markerDetail.markerImgURL = imageURL;
        markerDetail.houseType = markerLabel;
        markerDetail.alreadyCard = alreadyCard;
      });
      this.houseMarker.push({ markerNo: markerNo, marker: marker });
    }
  }

  getNextPrevious(type: any) {
    this.clearLineData();
    let element = <HTMLInputElement>document.getElementById("chkAll");
    element.checked = false;
    this.markerData.houseType = "";
    this.markerData.markerImgURL = "../assets/img/img-not-available-01.jpg";
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
      if (Number(lineNo) < this.wardLineCount) {
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

  getCurrentLineDetail(event: any) {
    if (event.key == "Enter") {
      let lineNo = $("#txtLineNo").val();
      if (lineNo == "") {
        this.commonService.setAlertMessage("error", "Please enter line no. !!!");
        return;
      }
      this.clearLineData();
      if (Number(lineNo) <= this.wardLineCount) {
        this.lineNo = lineNo;
        this.getLineApprove();
        this.getHouseLineData();
      } else {
        this.commonService.setAlertMessage("error", "Line no. not exist in ward !!!");
        this.lineNo = 1;
        $("#txtLineNo").val(this.lineNo);
        this.getLineApprove();
        this.getHouseLineData();
      }
    }
  }

  assignUrl() {
    window.open("/" + this.cityName + "/13B/house-marking-assignment", "_blank");
  }

  getLineApprove() {
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/marksCount";
    let countInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      countInstance.unsubscribe();
      // let element = <HTMLButtonElement>document.getElementById("btnSave");
      if (data != null) {
        // $("#btnSave").css("background", "#0ba118");
        // element.disabled = false;
        this.markerData.totalLineMarkers = data.toString();
      } else {
        // $("#btnSave").css("background", "#626262");
        // element.disabled = true;
      }
    });
    // dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/ApproveStatus";
    // let approveInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
    //   approveInstance.unsubscribe();
    //   if (data != null) {
    //     if (data["status"] == "Confirm") {
    //       $("#btnSave").html("Reject Line");
    //     } else {
    //       $("#btnSave").html("Approve Line");
    //     }
    //   } else {
    //     $("#btnSave").html("Approve Line");
    //   }
    // });
  }

  saveData() {
    let isApprove = true;
    let element = <HTMLInputElement>document.getElementById("chkAll");
    if (element.checked == true) {
      this.commonService.setAlertMessage("error", "Please remove check from show all markers for approve this line!!!");
      return;
    }
    for (let i = 0; i < this.markerList.length; i++) {
      if (this.markerList[i]["isApprove"] == "0") {
        i = this.markerList.length;
        isApprove = false;
      }
    }

    if (isApprove == false) {
      this.commonService.setAlertMessage("error", "Please approve all markers for approve this line!!!");
      return;
    }

    let approveById = "0";
    let lineNo = $("#txtLineNo").val();
    let lineStatus = $("#btnSave").html();
    let status = "";
    if (lineStatus == "Approve Line") {
      status = "Confirm";
      approveById = localStorage.getItem("userID");
      $("#btnSave").html("Reject Line");
      $("#approveLineCheckDiv").hide();
      $("#approveLineStatusDiv").show();
     
     
    } else {
      status = "Reject";
      approveById = "0";
      $("#btnSave").html("Approve Line");
      $("#approveLineStatusDiv").hide();
      $("#approveLineCheckDiv").show();
      let element=(<HTMLInputElement>document.getElementById("approveCheck"));
      element.checked=false;
    }

    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    this.lineNo = lineNo;
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/ApproveStatus";
    this.markerData.lineApprovedBy=localStorage.getItem("userName");
    this.markerData.lineApprovedDate=this.commonService.getTodayDateTime();
    const data = {
      status: status,
      approveById: approveById,
      approvedDate:this.commonService.getTodayDateTime()
    };
    this.db.object(dbPath).update(data);
    dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "/approved";
    let approvedInstance = this.db.object(dbPath).valueChanges().subscribe((dataCount) => {
      approvedInstance.unsubscribe();
      let approvedCount = 1;
      if (dataCount != null) {
        if (status == "Confirm") {
          approvedCount = Number(dataCount) + 1;
        } else {
          approvedCount = Number(dataCount) - 1;
        }
      }
      dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone;
      this.db.object(dbPath).update({ approved: approvedCount, });
      setTimeout(() => {
        this.getApprovedLines();
      }, 200);
    });

    this.commonService.setAlertMessage("success", "Line approve status updated !!!");
  }

  assignSurveyor() {
    this.router.navigate([
      "/" + this.cityName + "/13B/house-marking-assignment",
    ]);
  }

  clearAllOnMap() {
    this.lines = [];
    if (this.houseMarker.length > 0) {
      for (let i = 0; i < this.houseMarker.length; i++) {
        if (this.houseMarker[i]["marker"] != null) {
          this.houseMarker[i]["marker"].setMap(null);
        }
      }
      this.houseMarker=[];
    }
    if (this.surveyorMarker.length > 0) {
      for (let i = 0; i < this.surveyorMarker.length; i++) {
          this.surveyorMarker[i]["marker"].setMap(null);
      }
    }
    this.surveyorMarker=[];
  }

  clearAllData() {
    this.lineNo = 1;
    this.previousLine = 1;
    $("#txtLineNo").val(this.lineNo);
    this.markerData.totalMarkers = "0";
    this.markerData.alreadyCardCount = 0;
    this.markerData.alreadyCard = "";
    this.markerData.alreadyCardLineCount = 0;
    this.markerData.approvedLines = "0";
    this.markerData.houseType = "";
    this.markerData.markerImgURL = "../assets/img/img-not-available-01.jpg";
    this.markerData.totalLineMarkers = "0";
    this.markerData.totalLines = "0";
    this.markerData.isApprovedCount = "0";
    this.markerData.totalHouseTypeModifiedCount="0";
    this.markerData.totalRemovedMarkersCount="0";
  }

  clearLineData() {
    this.markerData.alreadyCard = "";
    this.markerData.alreadyCardLineCount = 0;
    this.markerData.houseType = "";
    this.markerData.markerImgURL = "../assets/img/img-not-available-01.jpg";
    this.markerData.totalLineMarkers = "0";
    this.markerData.isApprovedCount = "0";
  }

  getDeletedMarkerData(data:any){
    this.deletedMarkerList=[];
    if(data!=null){
      let lineKeysArray=Object.keys(data);
      for(let i=0;i<lineKeysArray.length;i++){
        let lineKey=lineKeysArray[i];
        if(lineKey!="totalRemovedMarkersCount"){
          let indexKeyArray=Object.keys(data[lineKey]);
          for(let j=0;j<indexKeyArray.length;j++){

            let indexKey=indexKeyArray[j];
            let dataKey=data[lineKey][indexKey];

           
            let removedBy="";
            let houseType="";
            let removedDate=dataKey["removeDate"];
            let removeReason=dataKey["reason"]
            

            let image=dataKey["image"];
            let city = this.commonService.getFireStoreCity();
            let imageUrl= "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FMarkingSurveyImages%2F" + this.selectedZone + "%2F" + lineKey + "%2F" + image + "?alt=media";
            
            let removedById=dataKey["removeBy"];
            let removedByDetail=this.userList.find(item=>item.userId==removedById)
            if(removedByDetail!=undefined){
            removedBy=removedByDetail.name;}

            let housetypeId=dataKey["houseType"];
            let houseTypeDetail = this.houseTypeList.find(item => item.id == housetypeId);
            if (houseTypeDetail != undefined) {
              houseType = houseTypeDetail.houseType;
            }


           this.deletedMarkerList.push({lineNo:lineKey,houseType:houseType,removedBy:removedBy,removedDate:removedDate,imageUrl:imageUrl,reason:removeReason});
           
           
          }
        }
      }
    }
  }
  getSurveyorLoaction(){
     
    let dbPath="EntityMarkingData/MarkerAppAccess";
    let assignedWardInstance=this.db.object(dbPath).valueChanges().subscribe((data)=>{
      assignedWardInstance.unsubscribe();
      if(data!=null){
      let keyArray=Object.keys(data);
      for(let i=0;i<keyArray.length;i++){
        let key=keyArray[i];
        let assignedWard=data[key]["assignedWard"];
        if(assignedWard!=undefined){
          let lastLocationInstance=this.db.object("EntityMarkingData/SurveyorLastLocation/"+ key).valueChanges().subscribe((locationData)=>{
            // lastLocationInstance.unsubscribe();
            if (this.surveyorMarker.length > 0) {
              for (let i = 0; i < this.surveyorMarker.length; i++) {
                if (this.surveyorMarker[i]["key"] == key) {
                  this.surveyorMarker[i]["marker"].setMap(null);
                }
              }
            }
            if(locationData!=null){
              if(assignedWard==this.selectedZone)
              {
                let location = locationData.toString().split(",");
                let lat = Number(location[0]);
                let lng = Number(location[1]);
                  let marker = new google.maps.Marker({
                    position: { lat: Number(lat), lng: Number(lng) },
                    map: this.map,
                    icon:{
                      url:this.workingPersonUrl,
                      fillOpacity: 1,
                      strokeWeight: 1,
                      scaledSize: new google.maps.Size(40, 50),
                      origin: new google.maps.Point(0, 0),
                    }
                  }); 
                  
                  this.surveyorMarker.push({marker});
              }
            }
          });
        }
      }
      }
    });
  }
  getMarkersList(content:any,type:any){
    this.modifiedMarkerList=[];
    let dbpath="EntityMarkingData/MarkedHouses/"+this.selectedZone;
    let dataInstance=this.db.object(dbpath).valueChanges().subscribe((data)=>{
      dataInstance.unsubscribe();
      if(data!=null){
        let lineKeyArray=Object.keys(data);
        for(let i=0;i<lineKeyArray.length;i++){
          let lineKey=lineKeyArray[i];
          let markerKeyArray=Object.keys(data[lineKey]);
          for(let j=0;j< markerKeyArray.length;j++){
            let marker=markerKeyArray[j];
            if(data[lineKey][marker]["latLng"]!=undefined){
              
              let key=data[lineKey][marker];
              if(key["modifiedHouseTypeHistoryId"]!=null){
              // To get image url....
              let imageName=key["image"];
              let city = this.commonService.getFireStoreCity();
              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FMarkingSurveyImages%2F" + this.selectedZone + "%2F" + lineKey + "%2F" + imageName + "?alt=media";

              // To get Housetype name from housetype id
              let houseType="";
              let houseTypeDetail = this.houseTypeList.find(item => item.id == key["houseType"]);
              if (houseTypeDetail != undefined) {
                houseType = houseTypeDetail.houseType;
              }
              this.modifiedMarkerList.push({zoneNo:this.selectedZone,imageUrl:imageUrl,modifiedHouseTypeHistoryId:key["modifiedHouseTypeHistoryId"],houseType: houseType,lineNo:lineKey})
            }
          }
          }
        }
        if(this.modifiedMarkerList.length>0){
          this.openPopUp(content,type);
        }
        else{
          this.commonService.setAlertMessage("error","No Modified House Type marker found");
        }
       
      } 
      else{
        this.commonService.setAlertMessage("error","No Modified House Type marker found");
      }
    });
  }
  
  getModifiedMarkersList(modificationId:any,lineNo:any){
    this.modificationDataList=[];
    this.modificationDataFilterList=[];
    $("#divModifiedEntities").show();
    let dbPath="EntityMarkingData/ModifiedHouseTypeHistory/"+modificationId;
    let modificationInstance=this.db.object(dbPath).valueChanges().subscribe((data)=>{
      modificationInstance.unsubscribe();
      let keyArrray=Object.keys(data);
      for(let i=0;i<keyArrray.length;i++){
        let key=keyArrray[i];
        let newHouseTypeId=data[key]["newHouseTypeId"];
        let preHouseTypeId=data[key]["preHouseTypeId"];
        let updatedById=data[key]["updatedById"];
        let updateDate=data[key]["updateDate"];
        let date = new Date(updateDate);
        let timeSpan = date.getTime();
      
      // For new Housetype name
        let newHouseType="";
              let newHouseTypeDetail = this.houseTypeList.find(item => item.id == newHouseTypeId);
              if (  newHouseTypeDetail != undefined) {
                newHouseType = newHouseTypeDetail.houseType;
              }

      // For previous Housetype name
        let preHouseType="";
              let preHouseTypeDetail = this.houseTypeList.find(item => item.id == preHouseTypeId);
              if (  preHouseTypeDetail != undefined) {
                preHouseType = preHouseTypeDetail.houseType;
              } 
            
      // To get the user name by update by id        
        let updatedBy="";
              let updatedByDetail=this.userList.find(item=>item.userId== updatedById)
              if(updatedByDetail!=undefined){
                updatedBy=updatedByDetail.name;}

        this.modificationDataList.push({lineNo:lineNo, updatedBy: updatedBy,updateDate:updateDate,newHouseType:newHouseType,preHouseType:preHouseType,timeSpan:timeSpan})  
        
      }
      this.modificationDataFilterList = this.modificationDataList.sort((a, b) =>
      b.timespan > a.timespan ? 1 : -1);

    });
    
  }

  closeSubModel(id:any){
    $(id).hide();
  }
  markerApprovalStatus(){
    this.markerData.lineApprovedBy="";
    let element =(<HTMLInputElement>document.getElementById("approveCheck"));
    if(this.markerData.isApprovedCount==this.markerData.totalLineMarkers){
      element.disabled=false;
    }
    else{
      element.disabled=true;
    }
    let btnElement = <HTMLButtonElement>document.getElementById("btnSave");
    if ( element.checked == true) {
      $("#btnSave").css("background", "#0ba118");
      btnElement.disabled = false;
    }
     else {
      $("#btnSave").css("background", "#626262");
      btnElement.disabled = true;
    }

    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/ApproveStatus";
    let approveInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      approveInstance.unsubscribe();
      if (data != null) {
        if (data["status"] == "Confirm") {
          btnElement.disabled = false;
          this.markerData.lineApprovedDate=data["approvedDate"];
          let approvedById=data["approveById"];
          let detail=this.userList.find(item=>item.userId== approvedById);
          if(detail!=undefined){
            this.markerData.lineApprovedBy=detail.name;
          }
          $("#btnSave").html("Reject Line");


          $("#approveLineCheckDiv").hide();
          $("#approveLineStatusDiv").show();
          console.log(this.markerData.lineApprovedBy,this.markerData.lineApprovedDate)

          
        } else {
          $("#btnSave").html("Approve Line");
          $("#approveLineStatusDiv").hide();
          $("#approveLineCheckDiv").show();
         
        }
      } else {
        $("#btnSave").html("Approve Line");
        $("#approveLineStatusDiv").hide();
        $("#approveLineCheckDiv").show();
        
      }
    });
  }
  checkvalue(id:any){
    if(id=="approveCheck"){
     let element=<HTMLInputElement>document.getElementById("approveCheck");
     let btnElement = <HTMLButtonElement>document.getElementById("btnSave");
     if ( element.checked == true) {
      $("#btnSave").css("background", "#0ba118");
      btnElement.disabled = false;
    }
     else {
      $("#btnSave").css("background", "#626262");
      btnElement.disabled = true;
    }
    }

  }
  getNearByWards(){
    this.nearByWards=[];
    if(this.nearByStatus=="hide"){
      for(let i=0;i<this.nearByWardsPolygon.length;i++){
        this.nearByWardsPolygon[i].setMap(null);
    }
    this.nearByWardsPolygon=[];
      $("#btnNearBy").html("Show Near By Wards");
      this.nearByStatus="show";

    }
    else{
      $("#btnNearBy").html("Hide Near By Wards");
      this.nearByStatus="hide";
      const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FSettings%2FNearByWards.json?alt=media";
      let nearByWardsInstance = this.httpService.get(path).subscribe(data => {
        nearByWardsInstance.unsubscribe();
        if(this.selectedZone=="0"){
          this.commonService.setAlertMessage("error", "Please select zone !!!");
          return;
        }
        if(data!=undefined){
          let jsonKeyArray=Object.keys(data);
          // console.log(jsonKeyArray)
          let detail=jsonKeyArray.find(item=>item==this.selectedZone)
          if(detail!=undefined){
            this.nearByWards=data[detail];
            this.showNearByWards(); 
          }
          else{
            this.commonService.setAlertMessage("error", "No Data Found !!!");
            $("#btnNearBy").html("Show Near By Wards");
          }  
        }
      });
    }
   
  }

  showNearByWards(){
    
    if(this.nearByWards.length!=0){
      for(let i=0;i<this.nearByWards.length;i++){
        let zone=this.nearByWards[i];
        let zoneKML:any;
        this.commonService.getWardBoundary(zone,zoneKML, 4).then((data: any) => {
          zoneKML = data;
          let aa=[];
          for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
            aa.push({lat:Number(zoneKML[0]["latLng"][i]["lat"]), lng: Number(zoneKML[0]["latLng"][i]["lng"])})
          }

          const polygon=new google.maps.Polyline({
            path: aa,
            geodesic: true,
            strokeColor: this.getColor(),
            strokeOpacity: 1.0,
            strokeWeight: 2,            
          });
          this.nearByWardsPolygon.push(polygon);
          let statusString = '<div style="width: 100px;background-color: white;float: left;">';
          statusString += '<div style="float: left;width: 100px;text-align:center;font-size:12px;"> ' + zone + '';
          statusString += '</div></div>';
          var infowindow = new google.maps.InfoWindow({
            content: statusString,
          });
          
          infowindow.open(this.map, polygon);
        
          
          polygon.setMap(this.map);
          // const bounds = new google.maps.LatLngBounds();
          // for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
          //   bounds.extend({ lat: Number(zoneKML[0]["latLng"][i]["lat"]), lng: Number(zoneKML[0]["latLng"][i]["lng"]) });
          // }
          // this.map.fitBounds(bounds);
        });
      }
    }
    

  }
  getColor(){
    var randomColor = Math.floor(Math.random()*16777215).toString(16);
    return "#"+randomColor;
  }

}

export class markerDetail {
  totalMarkers: string;
  totalLines: string;
  totalLineMarkers: string;
  approvedLines: string;
  markerImgURL: string;
  houseType: string;
  alreadyCardCount: number;
  alreadyCardLineCount: number;
  alreadyCard: string;
  lastScanTime: string;
  isApprovedCount: string;
  wardno: string;
  lineno: string;
  totalHouseTypeModifiedCount:any;
  totalRemovedMarkersCount:any;
  lineApprovedBy:any;
  lineApprovedDate:any;

}