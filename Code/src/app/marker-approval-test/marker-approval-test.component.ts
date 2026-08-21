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

import { MarkerMappingService } from '../services/marker/marker-mapping.service';
@Component({
  selector: 'app-marker-approval-test',
  templateUrl: './marker-approval-test.component.html',
  styleUrls: ['./marker-approval-test.component.scss']
})
export class MarkerApprovalTestComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, private storage: AngularFireStorage, public af: AngularFireModule, public httpService: HttpClient, private router: Router, private commonService: CommonService, private modalService: NgbModal, private markerMapping: MarkerMappingService) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  allLines: any[];
  polylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
  fireStoragePath = this.commonService.fireStoragePath;
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
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDefaults%2FFinalHousesType.json?alt=media";
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
    // $("#btnNearBy").html("Show Near By Wards");
    this.nearByStatus="show";
    
      for(let i=0;i<this.nearByWardsPolygon.length;i++){
          this.nearByWardsPolygon[i]["polygon"].setMap(null);
      }
      this.nearByWards=[];
      this.nearByWardsPolygon=[];
      
    

    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    $(this.divLoader).show();
    (<HTMLInputElement>document.getElementById("chkAll")).checked = false;
    this.clearMarkerCache();   // ward badla to record fresh load ho
    this.wardIndexCache = {};     // ward index bhi fresh
    this.markerMapping.clearLinkCache();
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
    this.getNearByWards()
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


  // { uid: record } — sirf wahi markers jo is ward/line par chahiye the.
  // Pehle poora EntityMarkingData/MarkersData ek saath padha jaata tha (saare
  // ward ke saare markers). Wo read city ke saath badhta jaata hai aur dheere
  // ya fail hone par page chup-chaap khaali reh jaata tha. Ab ward index se
  // uid nikaal kar sirf utne hi record padhte hain.
  markerRecordCache: any = {};
  // { ward: { uid: line } } — line ki list isi se banti hai (LineWise se nahi).
  wardIndexCache: any = {};

  // Write ke baad record dobara padha jaana chahiye.
  clearMarkerCache() {
    this.markerRecordCache = {};
  }

  readMarkerRecord(uid: any): Promise<any> {
    return new Promise((resolve) => {
      if (this.markerRecordCache[uid] !== undefined) {
        resolve(this.markerRecordCache[uid]);
        return;
      }
      let recordInstance = this.db.object("EntityMarkingData/MarkersData/" + uid).valueChanges().subscribe((data: any) => {
        recordInstance.unsubscribe();
        this.markerRecordCache[uid] = data != null ? data : null;
        resolve(this.markerRecordCache[uid]);
      });
    });
  }

  // uid ki list -> { uid: record }. Jis uid ka record na ho wo chhod diya
  // jaata hai (mapping hai par data nahi - adhoora write).
  readMarkerRecords(uidArray: any[]): Promise<any> {
    let readArray = uidArray.map((uid: any) => this.readMarkerRecord(uid));
    return Promise.all(readArray).then((recordArray: any) => {
      let records = {};
      for (let i = 0; i < uidArray.length; i++) {
        if (recordArray[i] != null) {
          records[uidArray[i]] = recordArray[i];
        }
      }
      return records;
    });
  }

  // Ward ka marker index: { uid: line }. Ward-wise cache (ward badalne par
  // changeZoneSelection ise khaali kar deta hai).
  //
  // Pehle line ki list LineWise/{ward}/{line} se banti thi, par LineWise
  // ADHOORA hai: app ke cloud function ne kaafi samay tak wo node likha hi
  // nahi, aur purani migration ke markers bhi usme nahi aaye. Un markers ka
  // record MarkersData me hai aur WardWise/MarkerWise me bhi hai - sirf
  // LineWise me nahi. Isliye page par counts (LineSummary se) to dikhte the
  // par marker list aur map dono khaali rehte the.
  // WardWise har writer (app function, migration, portal) likhta hai, isliye
  // line ki list ab isi se banti hai.
  loadWardIndex(ward: any): Promise<any> {
    return new Promise((resolve) => {
      if (this.wardIndexCache != null && this.wardIndexCache[ward] != null) {
        resolve(this.wardIndexCache[ward]);
        return;
      }
      let indexPath = "EntityMarkingData/MarkersMapping/WardWise/" + ward;
      let indexInstance = this.db.object(indexPath).valueChanges().subscribe((data: any) => {
        indexInstance.unsubscribe();
        if (this.wardIndexCache == null) {
          this.wardIndexCache = {};
        }
        this.wardIndexCache[ward] = data != null ? data : {};
        resolve(this.wardIndexCache[ward]);
      });
    });
  }

  // Ward index me se ek line ke uid. lastMarkerKey jaisa scalar marker nahi
  // hai, isliye sirf M se shuru hone wale keys lete hain.
  getLineUids(wardIndex: any, lineNo: any): any[] {
    let uidArray: any[] = [];
    if (wardIndex == null) {
      return uidArray;
    }
    let keyArray = Object.keys(wardIndex);
    for (let i = 0; i < keyArray.length; i++) {
      let uid = keyArray[i];
      if (uid.charAt(0) != "M") {
        continue;
      }
      // line kahin number me padi hai kahin string me - dono ek jaisi mile.
      if (String(wardIndex[uid]) == String(lineNo)) {
        uidArray.push(uid);
      }
    }
    // M2 M10 se pehle aaye - warna list ulti-pulti dikhti hai.
    uidArray.sort((a: any, b: any) => Number(a.substring(1)) - Number(b.substring(1)));
    return uidArray;
  }

  // Purana index: LineWise/{ward}/{line} -> uid ki list. Sirf fallback ke liye
  // (WardWise me line khaali nikle tab).
  getLineUidsFromLineWise(ward: any, lineNo: any): Promise<any> {
    return new Promise((resolve) => {
      let linkPath = "EntityMarkingData/MarkersMapping/LineWise/" + ward + "/" + lineNo;
      let linkInstance = this.db.object(linkPath).valueChanges().subscribe((links: any) => {
        linkInstance.unsubscribe();
        let uidArray: any[] = [];
        if (links == null || typeof links != "object") {
          resolve(uidArray);
          return;
        }
        let keyArray = Object.keys(links);
        for (let i = 0; i < keyArray.length; i++) {
          let uid = links[keyArray[i]];
          // numeric keys ki wajah se aaye array-nulls skip
          if (uid == null || uid == "" || uidArray.indexOf(uid) >= 0) {
            continue;
          }
          uidArray.push(uid);
        }
        resolve(uidArray);
      });
    });
  }

  // Line ka data usi shape me ({ key: record }) jo poora page pehle se use
  // karta hai. Key ab uid (M12) hai - screen par ye kahin dikhta nahi, sirf
  // update/approve ke waqt record dhoondhne ke liye chalta hai, aur uid se
  // MarkersData ka path seedha ban jaata hai.
  getNewPathLineData(lineNo: any, zone: any = null): Promise<any> {
    let ward = zone != null ? zone : this.selectedZone;
    return this.loadWardIndex(ward).then((wardIndex: any) => {
      let uidArray = this.getLineUids(wardIndex, lineNo);
      // Khaali list par page chup-chaap khaali reh jaata tha - ab console me
      // saaf dikhta hai ki ward index mila ya nahi aur us line par kitne uid
      // the. WardWise/{ward} khaali = ward ka naam match nahi ho raha.
      console.log("[marker-approval] ward:", ward, "line:", lineNo,
        "wardIndex keys:", Object.keys(wardIndex).length, "line uids:", uidArray.length, uidArray);
      if (uidArray.length == 0) {
        // WardWise me is line par kuch nahi - purane LineWise se dekh lo, taaki
        // koi aisa marker na chhoote jiska sirf LineWise entry bani ho.
        return this.getLineUidsFromLineWise(ward, lineNo).then((oldUids: any) => {
          console.log("[marker-approval] LineWise fallback uids:", oldUids.length, oldUids);
          if (oldUids.length == 0) {
            return null;
          }
          return this.readMarkerRecords(oldUids).then((records: any) => {
            return Object.keys(records).length > 0 ? records : null;
          });
        });
      }
      return this.readMarkerRecords(uidArray).then((records: any) => {
        let found = Object.keys(records).length;
        if (found < uidArray.length) {
          console.log("[marker-approval] mapping hai par MarkersData record nahi mila:", uidArray.length - found);
        }
        return found > 0 ? records : null;
      });
    });
  }

  getNewPathWardData(zone: any = null): Promise<any> {
    let ward = zone != null ? zone : this.selectedZone;
    return this.loadWardIndex(ward).then((wardIndex: any) => {
      let keyArray = Object.keys(wardIndex);
      if (keyArray.length == 0) {
        return null;
      }
      let uidArray = keyArray.filter((uid: any) => uid.charAt(0) == "M"); // lastMarkerKey jaise scalar chhod do
      return this.readMarkerRecords(uidArray).then((records: any) => {
        let wardData = {};
        let found = 0;
        let recordKeys = Object.keys(records);
        for (let i = 0; i < recordKeys.length; i++) {
          let uid = recordKeys[i];
          let lineNo = String(wardIndex[uid]);
          if (wardData[lineNo] == null) {
            wardData[lineNo] = {};
          }
          wardData[lineNo][uid] = records[uid];
          found++;
        }
        return found > 0 ? wardData : null;
      });
    });
  }

  // Marker image ka URL: AllMarkerImages/{imgRef}.
  // Marker image ka URL. Rule ek hi jagah likha hai (MarkerMappingService):
  // imgRef ho to flat AllMarkerImages folder se, na ho (marker abhi migrate
  // nahi hua) to purane per-line folder se. Pehle yahan doosri soorat me bhi
  // flat folder ka URL banta tha - us folder me purane naam ki file hoti hi
  // nahi, to image tooti hui dikhti thi.
  getNewPathImageUrl(entry: any, ward: any = null, line: any = null): string {
    return this.markerMapping.markerImageUrl(entry, ward, line);
  }

  // Line-level scalars (counts, lastMarkerKey, ApproveStatus) ka new-path base.
  getLineSummaryPath(ward: any, line: any): string {
    return "EntityMarkingData/MarkersMapping/LineSummary/" + ward + "/" + line;
  }

  // Marker ka MarkersData path. List ab uid se banti hai (getNewPathLineData),
  // isliye markerNo yahan seedha "M12" aata hai - path usi se ban jaata hai.
  // Kahin se purana markerNo (1, 2, 3...) aaye to LineWise se resolve karte
  // hain; wahan na mile to null (matlab wo marker migrate hi nahi hua).
  getMarkerNewPath(ward: any, line: any, markerNo: any): Promise<any> {
    if (markerNo != null && String(markerNo).charAt(0) == "M") {
      return Promise.resolve("EntityMarkingData/MarkersData/" + markerNo);
    }
    // Purana markerNo (1, 2, 3...) - service se resolve, jo WardWise aur
    // LineWise dono dekhti hai. Akela LineWise adhoora hai.
    return this.markerMapping.getMarkerDataPath(this.db, ward, line, markerNo);
  }

  showMarkers(lineNo: any) {
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    // let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
    //   houseInstance.unsubscribe();
    // NEW PATH: MarkersData + WardWise index (shape same: { key: record })
    this.getNewPathLineData(lineNo).then((data: any) => {
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

        this.getLineApproveStatus(lineNo,latLng,i);
      }
      this.getMarkedHouses(this.lineNo);
      
    });
  }
  getLineApproveStatus(lineNo:any,latLng:any,i:any){
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath="EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo+"/ApproveStatus/status"
    // NEW PATH: LineSummary
    let dbPath = this.getLineSummaryPath(this.selectedZone, lineNo) + "/ApproveStatus/status";
        let approveStatusInstance=this.db.object(dbPath).valueChanges().subscribe(approveStatus=>{
          // approveStatusInstance.unsubscribe();
          
         
          let color="";
          if(approveStatus=="Confirm"){
            color="#00f645";
            this.lines.push({ lineNo: lineNo, latlng: latLng, color:color,approveStatus:approveStatus });
            this.plotLineOnMap(lineNo, latLng, i, this.selectedZone,approveStatus);
          }
          else{
            color="#fa0000";
            this.lines.push({ lineNo: lineNo, latlng: latLng, color:color,approveStatus:approveStatus });
            this.plotLineOnMap(lineNo, latLng, i, this.selectedZone,approveStatus);

          }

          // this.lines.push({ lineNo: lineNo, latlng: latLng, color:color, });
          // this.plotLineOnMap(lineNo, latLng, i, this.selectedZone,approveStatus);
        });

  }
  getMarkedHouses(lineNo: any) {
    $(this.divLoader).show();
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    // let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
    //   houseInstance.unsubscribe();
    // NEW PATH: MarkersData + WardWise index (shape same: { key: record })
    this.getNewPathLineData(lineNo).then((data: any) => {
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
              // OLD PATH (reference ke liye rakha hai):
              // let imageName = data[index]["image"];
              // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.
              let imageName = data[index]["imgRef"] != null ? data[index]["imgRef"] : data[index]["image"];
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
              // OLD PATH (reference ke liye rakha hai):
              // let imageUrl = this.commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + this.selectedZone + "%2F" + this.lineNo + "%2F" + imageName + "?alt=media";
              // NEW PATH: record ke imgRef se
              let imageUrl = this.getNewPathImageUrl(data[index], this.selectedZone, this.lineNo);
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
    // OLD PATH (reference ke liye rakha hai):
    // let path = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
    // let houseInstance = this.db.object(path).valueChanges().subscribe((data) => {
    //   houseInstance.unsubscribe();
    // NEW PATH: MarkersData + WardWise index
    this.getNewPathLineData(lineNo, zoneNo).then((data: any) => {
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
              // OLD PATH (reference ke liye rakha hai):
              // let imageName = data[index]["image"];
              // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.
              let imageName = data[index]["imgRef"] != null ? data[index]["imgRef"] : data[index]["image"];
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
              // OLD PATH (reference ke liye rakha hai):
              // let imageUrl = this.commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + zoneNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
              // NEW PATH: record ke imgRef se
              let imageUrl = this.getNewPathImageUrl(data[index], zoneNo, lineNo);
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
        // OLD PATH (reference ke liye rakha hai):
        // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + index;
        // this.db.object(dbPath).update({ houseType: houseTypeId });
        // NEW PATH: MarkersData/{uid}
        this.getMarkerNewPath(zoneNo, lineNo, index).then((newMarkerPath: any) => {
          if (newMarkerPath != null) {
            this.clearMarkerCache(); // write ke baad cache stale
            this.db.object(newMarkerPath).update({ houseType: houseTypeId });
          }
        });
        this.saveModifiedHouseTypeHistory(index, zoneNo, lineNo, modifiedHouseTypeHistoryId, preHouseTypeId, houseTypeId,type);
      }

    }
   
    $(this.houseIndex).val("0");
    $(this.divHouseType).hide();
    this.commonService.setAlertMessage("success", "House Type updated successfully !!!");
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
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + index;
      // this.db.object(dbPath).update({ modifiedHouseTypeHistoryId });
      // NEW PATH: MarkersData/{uid}
      this.getMarkerNewPath(zoneNo, lineNo, index).then((newMarkerPath: any) => {
        if (newMarkerPath != null) {
          this.clearMarkerCache(); // write ke baad cache stale
          this.db.object(newMarkerPath).update({ modifiedHouseTypeHistoryId });
        }
      });

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
    // DELETE ABHI BAND HAI (new-path migration ke dauraan).
    // Wajah: delete MarkersData/{uid} ko khaali kar deta hai par mapping
    // entries (LineWise / MarkerWise / WardWise / OriginalToUid)
    // waise hi reh jaati hain — yaani orphan mapping bachti hai. Cleanup
    // banne tak delete rok diya gaya hai.
    // Chalu karne ke liye: neeche wale 2 line hata dein.
    this.commonService.setAlertMessage("error", "Marker delete abhi band hai. (New path migration chal rahi hai)");
    return;
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
      this.commonService.setAlertMessage("success", "Included line removed successfully !!!");
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
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
      // let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      // NEW PATH: MarkersData/{uid}
      let dbPath = "";
      this.getMarkerNewPath(zoneNo, lineNo, markerNo).then((newMarkerPath: any) => {
        if (newMarkerPath == null) {
          $(this.divLoader).hide();
          return; // marker abhi migrate nahi hua -> delete skip
        }
        this.clearMarkerCache(); // write ke baad cache stale
        let markerInstance = this.db.object(newMarkerPath).valueChanges().subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          data["removeDate"] = this.commonService.getTodayDateTime();
          data["removeBy"] = localStorage.getItem("userID");
          data["reason"]=reason;

          // Archive purani jagah par hi hai - sirf key badli hai. Pehle key
          // markerNo (1, 2, 3...) hoti thi, jo marker ke move hone par badal
          // jaati thi aur us number par baad me doosra marker bhi aa sakta tha.
          // Ab key uid (M23) hai - marker ki ekmatra sthir pehchaan.
          //
          // Migration se PEHLE delete hue records apni purani numeric key par
          // hi pade rehte hain; unhe chhua nahi jaata. Isliye is node me dono
          // tarah ki keys mil sakti hain aur padhne wala key par bharosa nahi
          // karta - sirf record ke andar dekhta hai.
          let removedUid = String(newMarkerPath).substring(String(newMarkerPath).lastIndexOf("/") + 1);
          dbPath = "EntityMarkingData/RemovedMarkers/" + zoneNo + "/" + lineNo + "/" + removedUid;
          this.db.object(dbPath).update(data);

          // OLD PATH (reference ke liye rakha hai):
          // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/";
          // NEW PATH: MarkersData/{uid} — saare keys null karke khaali karna
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let key = keyArray[i];
              data[key] = null;
            }
          }
          // OLD PATH (reference ke liye rakha hai):
          // this.db.object(dbPath).update(data);
          // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/marksCount";
          this.db.object(newMarkerPath).update(data);
          // NEW PATH: LineSummary
          dbPath = this.getLineSummaryPath(zoneNo, lineNo) + "/marksCount";
          let markerCountInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
            markerCountInstance.unsubscribe();
            if (data != null) {
              let marksCount = Number(data) - 1;
              this.markerData.totalMarkers = (Number(this.markerData.totalMarkers) - 1).toString();
              if(type=="marker")
              {

                this.markerData.totalLineMarkers = (Number(this.markerData.totalLineMarkers) - 1).toString();
              }
// OLD PATH (reference ke liye rakha hai):
// dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;

              const data1 = {
                marksCount: marksCount,
              };
              // OLD PATH (reference ke liye rakha hai):
              // this.db.object(dbPath).update(data1);
              this.db.object(this.getLineSummaryPath(zoneNo, lineNo)).update(data1);
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

            // OLD PATH (reference ke liye rakha hai):
            // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/alreadyInstalledCount";
            // NEW PATH: LineSummary
            dbPath = this.getLineSummaryPath(zoneNo, lineNo) + "/alreadyInstalledCount";
            let alreadyLineInstance = this.db.object(dbPath).valueChanges().subscribe(
              alreadyLineData => {
                alreadyLineInstance.unsubscribe();
                let total = 0;
                if (alreadyLineData != null) {
                  total = Number(alreadyLineData) - 1;
                }
                // OLD PATH (reference ke liye rakha hai):
                // this.db.object("EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/").update({ alreadyInstalledCount: total });
                this.db.object(this.getLineSummaryPath(zoneNo, lineNo)).update({ alreadyInstalledCount: total });
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
      }); // getMarkerNewPath().then wrapper close (new-path delete flow)
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
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
      // this.db.object(dbPath).update({ status: "Reject", isApprove: "0" });
      // NEW PATH: MarkersData/{uid}
      this.getMarkerNewPath(zoneNo, lineNo, markerNo).then((newMarkerPath: any) => {
        if (newMarkerPath != null) {
          this.clearMarkerCache(); // write ke baad cache stale
          this.db.object(newMarkerPath).update({ status: "Reject", isApprove: "0" });
        }
      });
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
      // OLD PATH (reference ke liye rakha hai):
      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
      // this.db.object(dbPath).update({ isApprove: "1", approveById: localStorage.getItem("userID"), approveDate: this.commonService.getTodayDateTime() });
      // NEW PATH: MarkersData/{uid}
      this.getMarkerNewPath(zoneNo, lineNo, markerNo).then((newMarkerPath: any) => {
        if (newMarkerPath != null) {
          this.clearMarkerCache(); // write ke baad cache stale
          this.db.object(newMarkerPath).update({ isApprove: "1", approveById: localStorage.getItem("userID"), approveDate: this.commonService.getTodayDateTime() });
        }
      });
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

  plotLineOnMap(lineNo: any, latlng: any, index: any, wardNo: any,lineApproveStatus:any) {
   
    if (wardNo == this.selectedZone) {
      if (this.polylines[index] != undefined) {
        this.polylines[index].setMap(null);
      }
      let strokeWeight = 2;
      let status = "";
      if (lineApproveStatus == "Confirm") {
        strokeWeight = 4;
        status = "LineCompleted";
      }
      else{
        strokeWeight = 2;
        status = "skip";

      }
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
      let commonService=this.commonService;
      // callback ke andar `this` component nahi hota - image URL ka rule
      // service me hai, isliye uska handle bhi yahin local me le lete hain.
      let markerMapping = this.markerMapping;
      marker.addListener("click", function () {
        $("#divLoader").show();
        // $("#markerImageBox").show();
        setTimeout(() => {
          $("#markerImageBox").show();
          $("#divLoader").hide();
        }, 2000);
        // OLD PATH (reference ke liye rakha hai):
        // let imageURL = commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + wardNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
        // NEW PATH: imageName imgRef ("M12.jpg") ho to flat AllMarkerImages
        // folder se, warna (marker abhi migrate nahi hua) purane per-line
        // folder se. Pehle yahan dono soorat me flat folder ka URL banta tha
        // aur migrate na hue marker ki image tooti hui dikhti thi.
        let imageURL = markerMapping.imageUrlFromName(imageName, wardNo, lineNo);
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
    
    let status="";
    let strokeWeight=2;
    if(firstLine.approveStatus=="Confirm")
    {
      status="LineCompleted";
      strokeWeight=4;
    }
    else{
      status="skip";
      strokeWeight=2;
    }
    this.polylines[Number(this.previousLine) - 1].setMap(null);
    let line = new google.maps.Polyline({
      path: firstLine.latlng,
      strokeColor: this.commonService.getLineColor(status),
      strokeWeight: strokeWeight,
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
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/marksCount";
    // NEW PATH: LineSummary
    let dbPath = this.getLineSummaryPath(this.selectedZone, this.lineNo) + "/marksCount";
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
    // OLD PATH (reference ke liye rakha hai):
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
    });
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
      let btnElement = <HTMLButtonElement>document.getElementById("btnSave");
      element.checked=false;
      btnElement.disabled = true;

    }

    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    this.lineNo = lineNo;
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/ApproveStatus";
    // NEW PATH: LineSummary
    let dbPath = this.getLineSummaryPath(this.selectedZone, this.lineNo) + "/ApproveStatus";
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

  // Pehle ye {line}/{markerNo} do-level tha, isliye yahan do loop chalte the.
  // Ab ek hi loop hai aur line record ke andar se aati hai - marker chahe kitni
  // bhi baar line badal chuka ho, uski pehchaan (uid) wahi rehti hai.
  // Archive: RemovedMarkers/{ward}/{line}/{key}. Key nayi entries me uid (M23)
  // hai aur purani entries me markerNo - dono chalte hain, isliye key ko haath
  // nahi lagate. `totalRemovedMarkersCount` isi node me scalar hai, use chhod
  // dete hain.
  getDeletedMarkerData(data: any) {
    this.deletedMarkerList = [];
    if (data == null) {
      return;
    }
    let lineKeysArray = Object.keys(data);
    for (let i = 0; i < lineKeysArray.length; i++) {
      let lineKey = lineKeysArray[i];
      let lineObj = data[lineKey];
      if (lineObj == null || typeof lineObj != "object") {
        continue; // totalRemovedMarkersCount jaisa scalar
      }
      let indexKeyArray = Object.keys(lineObj);
      for (let j = 0; j < indexKeyArray.length; j++) {
        let dataKey = lineObj[indexKeyArray[j]];
        if (dataKey == null || typeof dataKey != "object") {
          continue;
        }
        let removedBy = "";
        let houseType = "";
        let removedDate = dataKey["removeDate"];
        let removeReason = dataKey["reason"];

        let image = dataKey["image"];
        let city = this.commonService.getFireStoreCity();
        // imgRef wali entry nayi hai - uski image flat AllMarkerImages folder
        // me hai. Migration se pehle delete hue record me imgRef hota hi nahi
        // aur uski image aaj bhi purane per-line folder me padi hai - uske liye
        // purana URL hi ban sakta hai.
        let imageUrl = dataKey["imgRef"] != null
          ? this.getNewPathImageUrl(dataKey)
          : this.commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + this.selectedZone + "%2F" + lineKey + "%2F" + image + "?alt=media";

        let removedById = dataKey["removeBy"];
        let removedByDetail = this.userList.find(item => item.userId == removedById);
        if (removedByDetail != undefined) {
          removedBy = removedByDetail.name;
        }

        let housetypeId = dataKey["houseType"];
        let houseTypeDetail = this.houseTypeList.find(item => item.id == housetypeId);
        if (houseTypeDetail != undefined) {
          houseType = houseTypeDetail.houseType;
        }

        this.deletedMarkerList.push({ lineNo: lineKey, houseType: houseType, removedBy: removedBy, removedDate: removedDate, imageUrl: imageUrl, reason: removeReason });
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
                  
                  this.surveyorMarker.push({key:key,marker:marker});
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
    // OLD PATH (reference ke liye rakha hai):
    // let dbpath="EntityMarkingData/MarkedHouses/"+this.selectedZone;
    // let dataInstance=this.db.object(dbpath).valueChanges().subscribe((data)=>{
    //   dataInstance.unsubscribe();
    // NEW PATH: MarkersData + WardWise index (shape same: {lineNo:{key:record}})
    this.getNewPathWardData().then((data: any)=>{
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
              // OLD PATH (reference ke liye rakha hai):
              // let imageUrl = this.commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + this.selectedZone + "%2F" + lineKey + "%2F" + imageName + "?alt=media";
              // NEW PATH: record ke imgRef se
              let imageUrl = this.getNewPathImageUrl(key, this.selectedZone, lineKey);

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

    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/ApproveStatus";
    // NEW PATH: LineSummary
    let dbPath = this.getLineSummaryPath(this.selectedZone, this.lineNo) + "/ApproveStatus";
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
          // console.log(this.markerData.lineApprovedBy,this.markerData.lineApprovedDate)

          
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
      // $("#btnNearBy").html("Show Near By Wards");
      this.nearByStatus="show";

    }
    else{
      // $("#btnNearBy").html("Hide Near By Wards");
      this.nearByStatus="hide";
      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FNearByWards%2FNearByWards.json?alt=media";
      let nearByWardsInstance = this.httpService.get(path).subscribe(data => {
        nearByWardsInstance.unsubscribe();
        if(this.selectedZone=="0"){
          // $("#btnNearBy").html("Show Near By Wards");
          this.nearByStatus="show";
          this.commonService.setAlertMessage("error", "Please select zone !!!");
          return;
        }
        if(data!=undefined){
          let jsonKeyArray=Object.keys(data);
          let detail=jsonKeyArray.find(item=>item==this.selectedZone)
          if(detail!=undefined){
            this.nearByWards=data[detail];
            setTimeout(() => {
              for(let i=0;i<this.nearByWards.length;i++){
                let color=this.getColor(i);
                $("#tr"+i).css("color",color);
              }
            }, 0);
          }
          else{
            this.commonService.setAlertMessage("error", "No Near By Zone Data Found !!!");
            // $("#btnNearBy").html("Show Near By Wards");
            this.nearByStatus="show";
          } 
        }
      },error=>
      {
        this.commonService.setAlertMessage("error", "No Near By Wards Data Found !!!");
        // $("#btnNearBy").html("Show Near By Wards");
        this.nearByStatus="show";
      });
  }
   
  }

  showNearByWards(index:any,zone:any){
    
    if(this.nearByWards.length!=0){
    let element=<HTMLInputElement>document.getElementById("checkBox"+index);
      if(element.checked == true){
        let zoneKML:any;
        this.commonService.getWardBoundary(zone,zoneKML, 4).then((data: any) => {
              zoneKML = data;
              let aa=[];
              for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
                aa.push({lat:Number(zoneKML[0]["latLng"][i]["lat"]), lng: Number(zoneKML[0]["latLng"][i]["lng"])})
              }
            
              const polygon=new google.maps.Polygon({
                paths: aa,
                geodesic: true,
                strokeColor: this.getColor(index),
                strokeOpacity: 1.0,
                strokeWeight: 2,      
              });
              polygon.setOptions({
                fillColor: polygon["strokeColor"],
                fillOpacity: 0.35
              });
              
             
              
              // element.style.accentColor=polygon["strokeColor"] ;
              $("#tr"+index).css("accentColor",polygon["strokeColor"]);

               
              
              this.nearByWardsPolygon.push({polygon:polygon,zone:zone});
              let statusString = '<div style="width: 100px;background-color: white;float: left;">';
              statusString += '<div style="float: left;width: 100px;text-align:center;font-size:12px;"> ' + zone + '';
              statusString += '</div></div>';
              var infowindow = new google.maps.InfoWindow({
                content: statusString,
              });
              
              infowindow.open(this.map, polygon);
              polygon.setMap(this.map);
             
            });
       
      }
      else{
        let detail=this.nearByWardsPolygon.find(item=>item.zone==zone);
        if(detail!=undefined)
        {
          detail.polygon.setMap(null)
          this.nearByWardsPolygon= this.nearByWardsPolygon.filter(item=>item!=detail);
        }
      }


      // for(let i=0;i<this.nearByWards.length;i++){
      //   let zone=this.nearByWards[i];
      //   let zoneKML:any;
      //   this.commonService.getWardBoundary(zone,zoneKML, 4).then((data: any) => {
      //     zoneKML = data;
      //     let aa=[];
      //     for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
      //       aa.push({lat:Number(zoneKML[0]["latLng"][i]["lat"]), lng: Number(zoneKML[0]["latLng"][i]["lng"])})
      //     }
        
      //     const polygon=new google.maps.Polygon({
      //       paths: aa,
      //       geodesic: true,
      //       strokeColor: this.getColor(i),
      //       strokeOpacity: 1.0,
      //       strokeWeight: 2,      
      //     });
      //     polygon.setOptions({
      //       fillColor: polygon["strokeColor"],
      //       fillOpacity: 0.35
      //     });
          
         
          
      //     $("#tr"+i).css("color",polygon["strokeColor"]);
           
          
      //     this.nearByWardsPolygon.push(polygon);
      //     let statusString = '<div style="width: 100px;background-color: white;float: left;">';
      //     statusString += '<div style="float: left;width: 100px;text-align:center;font-size:12px;"> ' + zone + '';
      //     statusString += '</div></div>';
      //     var infowindow = new google.maps.InfoWindow({
      //       content: statusString,
      //     });
          
      //     infowindow.open(this.map, polygon);
        
          
      //     polygon.setMap(this.map);
      //     // const bounds = new google.maps.LatLngBounds();
      //     // for (let i = 0; i < zoneKML[0]["latLng"].length; i++) {
      //     //   bounds.extend({ lat: Number(zoneKML[0]["latLng"][i]["lat"]), lng: Number(zoneKML[0]["latLng"][i]["lng"]) });
      //     // }
      //     // this.map.fitBounds(bounds);
      //   });
      // }
    }
    

  }
  getColor(index:number){
    // var randomColor = Math.floor(Math.random()*16777215).toString(16);
    // return "#"+randomColor;
    switch(index){
      case 0:
      return "#7400FF";
      case 1:
      return "#6A2D42";
      case 2:
      return "#8AF123";
      case 3:
      return "#23F1EE";
      case 4:
      return "#6A0976";
      case 5:
      return "#EF0C46";
      case 6:
      return "#0651A4";
      case 7:
      return "#6E7B32";
      case 8:
      return "#F7C600";
      case 9:
      return "#6DD8F5";
      case 10:
      return "#F14723";
    }
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