import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-ward-marking-summary",
  templateUrl: "./ward-marking-summary.component.html",
  styleUrls: ["./ward-marking-summary.component.scss"],
})
export class WardMarkingSummaryComponent implements OnInit {
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
  selectedCircle: any;
  selectedZone: any;
  wardList: any[] = [];
  wardProgressList: any[] = [];
  wardProgressListShow: any[] = [];
  houseTypeList: any[] = [];
  zoneHouseTypeList: any[];
  cityName: any;
  cityList: any[] = [];
  markerCityName: any;
  Approvemarker: any;
  Username: any;
  db: any;
  isFirst = true;
  public isAlreadyShow = false;
  lineMarkerList: any[];
  wardLines: any;
  markerList: any[];
  userList: any[] = [];
  markerDetailList: any[];
  markerExportList: any[] = [];
  markerData: markerDatail = {
    totalLines: "0",
    totalMarkers: 0,
    totalAlreadyCard: 0,
    totalHouses: 0,
    wardMarkers: 0,
    wardHouses: 0,
    wardInstalled: 0,
    wardApprovedLines: 0,
    lastUpdate: "---",
    wardNo: "0",
    lineNo: "0",
    lastScan: ""

  };
  divHouseType = "#divHouseType";
  ddlHouseType = "#ddlHouseType";
  houseWardNo = "#houseWardNo";
  houseLineNo = "#houseLineNo";
  houseIndex = "#houseIndex";
  divConfirm = "#divConfirm";
  deleteMarkerId = "#deleteMarkerId";
  deleteAlreadyCard = "#deleteAlreadyCard";
  deleteWardNo = "#deleteWardNo";
  deleteLineNo = "#deleteLineNo";
  ddlZone = "#ddlZone";
  divLoaderMain = "#divLoaderMain";
  divLoaderCounts = "#divLoaderCounts";
  totalMarkersCount: any;
  totalHousesCount: any;
  totalMarkersCountActual: any; //for actual couts
  totalHousesCountActual: any; //for actual couts
  userIsExternal:boolean;

  public totalTypeCount: any;
  isActionShow: any;
  userId: any
  inProgressWards: any[] = [];
  serviceName = "marking-summary";
  isShowEntityExport: any;
  
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("Survey-Management", "Marking-Summary", localStorage.getItem("userID"));
    this.isActionShow = true;
    this.isShowEntityExport = true;
    this.userIsExternal = localStorage.getItem("userType") == "External User"?true:false;
    if (localStorage.getItem("userType") == "External User" && this.cityName == "jodhpur") {
      this.isShowEntityExport = false;
    }
    if (this.cityName == "jaipur-malviyanagar" || this.cityName == "jaipur-murlipura") {
      this.isActionShow = false;
    }
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.getMarkerSummary();
    this.getMarkerCityName();
    this.showHideAlreadyCardInstalled();
    this.getHouseType();
    this.getAssignedWard();
  }

  getMarkerSummary() {
    let dbPath = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FSurveyManagement%2FMarkingManagement%2FMarkingSummary.json?alt=media";
    let markerSummaryInstance = this.httpService.get(dbPath).subscribe(
      data => {
        markerSummaryInstance.unsubscribe();
        if (data != null) {
          this.markerData.lastUpdate = data["markerSummarylastUpdate"];
          this.markerData.totalHouses = this.userIsExternal?data["actualTotalHouses"]:data["totalHouses"];
          this.markerData.totalMarkers = this.userIsExternal?data["actualTotalMarkers"]:data["totalMarkers"];

        }
      }
    );
  }

  getMarkerCityName() {
    this.cityList = JSON.parse(localStorage.getItem("cityList"));
    let detail = this.cityList.find(item => item.city == this.cityName);
    if (detail != undefined) {
      this.markerCityName = detail.name;
    }
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

  getWards() {

    this.wardList = JSON.parse(localStorage.getItem("allZoneList"));
    this.wardProgressList = [];
    if (this.wardList.length > 0) {
      for (let i = 0; i < this.wardList.length; i++) {
        let wardNo = this.wardList[i]["zoneNo"];
        let url = this.cityName + "/13A3/house-marking/" + wardNo;
        let preCssClass = "";
        let newDetail = this.inProgressWards.find(item => item.ward == wardNo);
        if (newDetail != undefined) {
          preCssClass = "inProgress";
        }
        this.wardProgressList.push({ wardNo: wardNo, markers: 0, url: url, alreadyInstalled: 0, wardLines: 0, approvedLines: 0, houses: 0, complex: 0, houseInComplex: 0, status: "", cssClass: "not-start", preCssClass: preCssClass });

        if (i == 1) {
          setTimeout(() => {
            $("#tr1").addClass("active");
            this.getMarkingDetail(wardNo, 1);
          }, 3000);

        }
        if (wardNo != "0") {
          this.getWardSummary(i, wardNo);
        }

      }
    }
    this.wardList[0]["zoneNo"] = "--All--";
  }

  exportMarkers() {
    this.markerExportList = [];
    $(this.divLoaderMain).show();
    let zoneNo = $(this.ddlZone).val();
    if (zoneNo == "--All--") {
      this.getExportMarkerData(1, 'All');
    }
    else {
      for (let i = 0; i < this.wardList.length; i++) {
        if (this.wardList[i]["zoneNo"] == zoneNo) {
          this.getExportMarkerData(i, zoneNo);
          i = this.wardList.length;
        }
      }
    }
  }



  getExportMarkerData(index: any, type: any) {
    if (index == this.wardList.length) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Zone";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Line";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Marker ID";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Longitue";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Latitude";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Address";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Entity Counts";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Owner Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Mobile No.";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "House No.";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Building Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Street/Colony";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "No. of Person";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Ward";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total Area of the plot";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Vacant Area";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Plinth Area";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total Build-Up Area";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "No of Floors/Stories";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Land Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Under Ground (In Square Feet)";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Ground Floor (In Square Feet)";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "First Floor ((In Square Feet)";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Second Floor (In Square Feet)";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Third Floor (In Square Feet)";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total Area";
      htmlString += "</td>";
      // if (this.cityName == "jodhpur") {
      //   htmlString += "<td>";
      //   htmlString += "Owner Name";
      //   htmlString += "</td>";
      //   htmlString += "<td>";
      //   htmlString += "No. of Persons";
      //   htmlString += "</td>";
      // }
      htmlString += "<td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.markerExportList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.markerExportList[i]["Zone"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.markerExportList[i]["Line"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["markerId"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["Longitue"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["Latitude"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["address"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["Type"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["entityCounts"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["ownerName"];
        htmlString += "</td>";
        htmlString += "<td t=s>";
        htmlString += this.markerExportList[i]["mobileNo"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["houseNo"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["buildingName"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["streetColony"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["persons"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["wardNumber"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["totalAreaOfPlot"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["vacantArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["plinthArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["totalBuildupArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["totalFloor"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["landType"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["underGroundArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["groundFloorArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["firstFloorArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["secondFloorArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["thirdFloorArea"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["totalArea"];
        htmlString += "</td>";
        // if (this.cityName == "jodhpur") {
        //   htmlString += "<td>";
        //   htmlString += this.markerExportList[i]["ownerName"];
        //   htmlString += "</td>";
        //   htmlString += "<td>";
        //   htmlString += this.markerExportList[i]["persons"];
        //   htmlString += "</td>";
        // }
        htmlString += "</tr>";
      }
      htmlString += "<table>";
      let fileName = this.commonService.getFireStoreCity() + "-" + type + "-MarkersData.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
      $(this.divLoaderMain).hide();
    }
    else {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getExportMarkerData");
      let zoneNo = this.wardList[index]["zoneNo"];
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
        markerData => {
          markerInstance.unsubscribe();
          if (markerData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getExportMarkerData", markerData);
            let keyArray = Object.keys(markerData);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let lineNo = keyArray[i];
                let lineData = markerData[lineNo];
                let markerKeyArray = Object.keys(lineData);
                for (let j = 0; j < markerKeyArray.length; j++) {
                  let markerNo = markerKeyArray[j];
                  const isUserAllowed = this.userIsExternal ? parseInt(lineData[markerNo]["userId"]) !== -4 : true;//condition for excluding data if external user
                  if (lineData[markerNo]["houseType"] != null && isUserAllowed) {
                    let houseType = "";
                    let detail = this.houseTypeList.find(item => item.id == lineData[markerNo]["houseType"]);
                    if (detail != undefined) {
                      houseType = detail.houseType;
                    }
                    let lat = "";
                    let lng = "";
                    if (lineData[markerNo]["latLng"] != null) {
                      lat = lineData[markerNo]["latLng"].split(',')[0];
                      lng = lineData[markerNo]["latLng"].split(',')[1];
                    }
                    let address = lineData[markerNo]['address'] || `${lineData[markerNo]['address1']} ${lineData[markerNo]['address2']}` || '';
                    const mobileNo = lineData[markerNo]['mobileNumber'] || '';
                    const houseNo = lineData[markerNo]['houseNumber'] || '';
                    const streetColony = lineData[markerNo]['streetColony'] || '';
                    const buildingName = lineData[markerNo]['buildingName'] || '';
                    const totalHouses = lineData[markerNo]['totalHouses'] || '';
                    const wardNumber = lineData[markerNo]['wardNumber'] || '';
                    const totalAreaOfPlot = lineData[markerNo]['totalAreaOfPlot'] || '';
                    const vacantArea = lineData[markerNo]['vacantArea'] || '';
                    const plinthArea = lineData[markerNo]['plinthArea'] || '';
                    const totalBuildupArea = lineData[markerNo]['totalBuildupArea'] || '';
                    const totalFloor = lineData[markerNo]['totalFloor'] || '';
                    const landType = lineData[markerNo]['landType'] || '';
                    const underGroundArea = lineData[markerNo]['underGroundArea'] || '';
                    const groundFloorArea = lineData[markerNo]['groundFloorArea'] || '';
                    const firstFloorArea = lineData[markerNo]['firstFloorArea'] || '';
                    const secondFloorArea = lineData[markerNo]['secondFloorArea'] || '';
                    const thirdFloorArea = lineData[markerNo]['thirdFloorArea'] || '';
                    const totalArea = lineData[markerNo]['totalArea'] || '';
                    let cardNumber = "";
                    let vertualMarkerID = "";
                    if (lineData[markerNo]["cardNumber"] != null) {
                      cardNumber = lineData[markerNo]["cardNumber"];
                      vertualMarkerID = lineData[markerNo]["cardNumber"];
                    }
                    else {
                      if (lineData[markerNo]["markerId"] != null) {
                        vertualMarkerID = this.commonService.getDefaultCardPrefix() + lineData[markerNo]["markerId"];
                      }
                    }
                    let ownerName = "";
                    let persons = "";
                    if (lineData[markerNo]["ownerName"] != null) {
                      ownerName = lineData[markerNo]["ownerName"].toUpperCase();
                    }
                    if (lineData[markerNo]["totalPerson"] != null) {
                      persons = lineData[markerNo]["totalPerson"];
                    }
                    let entityCounts = 1;
                    if (lineData[markerNo]["houseType"] == "19" || lineData[markerNo]["houseType"] == "20") {
                      if (lineData[markerNo]["totalHouses"] != null) {
                        let servingCount = parseInt(lineData[markerNo]["totalHouses"]);
                        if (isNaN(servingCount)) {
                          servingCount = 1;
                        }
                        entityCounts = servingCount;
                      }
                    }
                    if (address == "") {
                      if (cardNumber != "") {
                        let dbPath = "Houses/" + zoneNo + "/" + lineNo + "/" + cardNumber + "/address";
                        let addressInstance = this.db.object(dbPath).valueChanges().subscribe(
                          addressData => {
                            addressInstance.unsubscribe();
                            if (addressData != null) {
                              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getExportMarkerData", addressData);
                              address = addressData.toString();
                              dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                              this.db.object(dbPath).update({ address: address });
                            }
                            this.markerExportList.push({ Zone: zoneNo, Line: lineNo, Longitue: lng, Latitude: lat, Type: houseType, address: address, MarkerNo: markerNo, cardNumber: cardNumber, entityCounts: entityCounts, ownerName: ownerName, persons: persons, markerId: vertualMarkerID, mobileNo, houseNo, streetColony, buildingName, totalHouses, wardNumber, totalAreaOfPlot, vacantArea, plinthArea, totalBuildupArea, totalFloor, landType, underGroundArea, groundFloorArea, firstFloorArea, secondFloorArea, thirdFloorArea, totalArea });
                          }
                        );
                      }
                      else {
                        address = this.markerCityName;
                        let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                        this.db.object(dbPath).update({ address: address });
                        this.markerExportList.push({ Zone: zoneNo, Line: lineNo, Longitue: lng, Latitude: lat, Type: houseType, address: address, MarkerNo: markerNo, cardNumber: cardNumber, entityCounts: entityCounts, ownerName: ownerName, persons: persons, markerId: vertualMarkerID, mobileNo, houseNo, streetColony, buildingName, totalHouses, wardNumber, totalAreaOfPlot, vacantArea, plinthArea, totalBuildupArea, totalFloor, landType, underGroundArea, groundFloorArea, firstFloorArea, secondFloorArea, thirdFloorArea, totalArea });
                      }
                    }
                    else {
                      this.markerExportList.push({ Zone: zoneNo, Line: lineNo, Longitue: lng, Latitude: lat, Type: houseType, address: address, MarkerNo: markerNo, cardNumber: cardNumber, entityCounts: entityCounts, ownerName: ownerName, persons: persons, markerId: vertualMarkerID, mobileNo, houseNo, streetColony, buildingName, totalHouses, wardNumber, totalAreaOfPlot, vacantArea, plinthArea, totalBuildupArea, totalFloor, landType, underGroundArea, groundFloorArea, firstFloorArea, secondFloorArea, thirdFloorArea, totalArea });
                    }
                  }
                }
              }
              index++;
              if (type != "All") {
                index = this.wardList.length;
              }
              this.getExportMarkerData(index, type);
            }
            else {
              index++;
              if (type != "All") {
                index = this.wardList.length;
              }
              this.getExportMarkerData(index, type);
            }
          }
          else {
            index++;
            if (type != "All") {
              index = this.wardList.length;
            }
            this.getExportMarkerData(index, type);
          }
        });
    }
  }

  getWardSummary(index: any, wardNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardSummary");
    this.commonService.getWardLine(wardNo, this.commonService.setTodayDate()).then((data: any) => {
      let wardLines = JSON.parse(data);
      this.wardLines = wardLines["totalLines"];
      this.wardProgressList[index]["wardLines"] = this.wardLines;
      let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
          const {marked=0,actualMarked=0,houseCount=0,actualHouseCount=0,complexCount=0,actualComplexCount=0,housesInComplex=0,actualHousesInComplex=0,alreadyInstalled=0,approved=0} = data || {};

          this.markerData.totalAlreadyCard += Number(alreadyInstalled);
          this.wardProgressList[index]["markers"] = this.userIsExternal?parseInt(actualMarked):parseInt(marked);
          this.wardProgressList[index]["alreadyInstalled"] = Number(alreadyInstalled);
          this.wardProgressList[index]["houses"] = this.userIsExternal?parseInt(actualHouseCount):parseInt(houseCount);
          this.wardProgressList[index]["complex"] = this.userIsExternal?parseInt(actualComplexCount):parseInt(complexCount);
          this.wardProgressList[index]["houseInComplex"] = this.userIsExternal?parseInt(actualHousesInComplex):parseInt(housesInComplex);
          this.wardProgressList[index]["approvedLines"] = Number(approved);
          this.wardProgressList[index]["status"] = this.wardProgressList[index]["markers"]>0?"In progress":this.wardProgressList[index]["status"];
          if (approved && Number(approved) == Number(this.wardProgressList[index]["wardLines"])) {
            this.wardProgressList[index]["status"] = "Marking done";
            this.wardProgressList[index]["cssClass"] = "marking-done";
          }
          
          
         
          // if (data["marked"] != null) {
          //   markers = Number(data["marked"]);
          // }
          // let alreadyInstalled = 0;
          // if (data["alreadyInstalled"] != null) {
          //   alreadyInstalled = Number(data["alreadyInstalled"]);
          //   this.markerData.totalAlreadyCard = this.markerData.totalAlreadyCard + alreadyInstalled;
          // }
          // this.wardProgressList[index]["markers"] = markers;
          // if (markers > 0) {
          //   this.wardProgressList[index]["status"] = "In progress";
          //   // this.wardProgressList[index]["cssClass"] = "in-progress";
          // }
          // this.wardProgressList[index]["alreadyInstalled"] = alreadyInstalled;
          
          // let houseCount = 0;
          // if (data["houseCount"] != null) {
          //   houseCount = Number(data["houseCount"]);
          // }
          // this.wardProgressList[index]["houses"] = houseCount;
          // let complex = 0;
          // if (data["complexCount"] != null) {
          //   complex = Number(data["complexCount"]);
          // }
          // this.wardProgressList[index]["complex"] = complex;
          // let houseInComplex = 0;
          // if (data["housesInComplex"] != null) {
          //   houseInComplex = Number(data["housesInComplex"]);
          // }
          // this.wardProgressList[index]["houseInComplex"] = houseInComplex;
          // let approved = 0;
          // if (data["approved"] != null) {
          //   approved = Number(data["approved"]);
          //   this.wardProgressList[index]["approvedLines"] = approved;
          //   if (approved == Number(this.wardProgressList[index]["wardLines"])) {
          //     this.wardProgressList[index]["status"] = "Marking done";
          //     this.wardProgressList[index]["cssClass"] = "marking-done";
          //   }
          // }
        }
      });
    });
  }

  //#region serveyor detail

  setActiveClass(index: any) {
    for (let i = 0; i < this.wardProgressList.length; i++) {
      let id = "tr" + i;
      let element = <HTMLElement>document.getElementById(id);
      let className = element.className;
      if (className != null) {
        $("#tr" + i).removeClass("active");
        $("#tr" + i).addClass(this.wardProgressList[i]["preCssClass"]);
      }
      if (i == index) {
        $("#tr" + i).removeClass(this.wardProgressList[i]["preCssClass"]);
        $("#tr" + i).addClass("active");
      }
    }

  }

  getMarkingDetail(wardNo: any, listIndex: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getMarkingDetail");
    this.markerData.lastScan = ""
    let dbPath = "EntityMarkingData/LastScanTime/Ward/" + wardNo;
    let totalmarkingInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      totalmarkingInstance.unsubscribe();
      let lastscandata = data.split(":");
      let scandata = lastscandata[0] + ":" + lastscandata[1];
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getMarkingDetail", data);
        this.markerData.lastScan = scandata;
      }
    });
    this.selectedZone = wardNo;
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 1000);

    if (this.isFirst == false) {
      this.setActiveClass(listIndex);
    } else {
      this.isFirst = false;
    }
    this.lineMarkerList = [];
    this.markerList = [];
    this.markerData.totalLines = "0";
    this.markerData.wardApprovedLines = 0;
    this.markerData.wardInstalled = 0;
    this.markerData.wardMarkers = 0;
    this.markerData.wardHouses = 0;
    let wardDetail = this.wardProgressList.find(item => item.wardNo == wardNo);
    if (wardDetail != undefined) {
      this.markerData.totalLines = wardDetail.wardLines;
      this.markerData.wardApprovedLines = wardDetail.approvedLines;
      this.markerData.wardInstalled = wardDetail.alreadyInstalled;
      this.markerData.wardMarkers = wardDetail.markers;
      this.markerData.wardHouses = wardDetail.houses;
      this.markerData.wardNo = wardDetail.wardNo

      for (let i = 1; i <= wardDetail.wardLines; i++) {
        this.lineMarkerList.push({ wardNo: wardNo, lineNo: i, markers: 0, houses: 0, complex: 0, houseInComplex: 0, isApproved: false, alreadyCard: 0 });
        this.getLineStatus(wardNo, i);
        this.getLineMarkers(wardNo, i);
        this.getLineHouses(wardNo, i);
        this.getLineComplex(wardNo, i);
        this.getLineHousesInComplex(wardNo, i);
        this.getLineAlreadyCard(wardNo, i);
      }

    }
  }

  getLineAlreadyCard(wardNo: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineAlreadyCard");
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/alreadyInstalledCount";
    let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe(
      alreadyData => {
        alreadyInstance.unsubscribe();
        if (alreadyData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineAlreadyCard", alreadyData);
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.alreadyCard = Number(alreadyData);
          }
        }
      }
    );
  }

  getLineMarkers(wardNo: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineMarkers");
    let dataKey = this.userIsExternal?'actualMarksCount':'marksCount';
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + dataKey;
    let markedInstance = this.db.object(dbPath).valueChanges().subscribe(
      markedData => {
        markedInstance.unsubscribe();
        if (markedData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineMarkers", markedData);
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.markers = Number(markedData);
          }
        }
      }
    );
  }

  getLineHouses(wardNo: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineHouses");
    let dataKey = this.userIsExternal?'actualMarksHouse':'marksHouse';
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + dataKey;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        if (houseData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineHouses", houseData);
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.houses = Number(houseData);
          }
        }
      }
    );
  }


  getLineComplex(wardNo: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineComplex");
    let dataKey = this.userIsExternal?'actualMarksComplex':'marksComplex';
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + dataKey;
    let complexInstance = this.db.object(dbPath).valueChanges().subscribe(
      complexData => {
        complexInstance.unsubscribe();
        if (complexData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineComplex", complexData);
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.complex = Number(complexData);
          }
        }
      }
    );
  }

  getLineHousesInComplex(wardNo: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineHousesInComplex");
    let dataKey = this.userIsExternal?'actualMarksHouseInComplex':'marksHouseInComplex';
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + dataKey;
    let houseComplexInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseComplexData => {
        houseComplexInstance.unsubscribe();
        if (houseComplexData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineHousesInComplex", houseComplexData);
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.houseInComplex = Number(houseComplexData);
          }
        }
      }
    );
  }

  getLineStatus(wardNo: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineStatus");
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/ApproveStatus/status";
    let approvedInstance = this.db.object(dbPath).valueChanges().subscribe(
      approveData => {
        approvedInstance.unsubscribe();
        if (approveData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineStatus", approveData);
          if (approveData == "Confirm") {
            let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
            if (lineDetail != undefined) {
              lineDetail.isApproved = true;
            }
          }
        }
      }
    );
  }


  //#endregion

  getLineDetail(wardNo: any, lineNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineDetail");
    this.markerDetailList = [];
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineDetail", data);
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            const latLngExists = data[index]["latLng"] != null;
            const isUserAllowed = this.userIsExternal ? parseInt(data[index]["userId"]) !== -4 : true; //condition for excluding data if external user
            if (latLngExists && isUserAllowed) {
              let alreadyInstalled = "नहीं";
              if (data[index]["alreadyInstalled"] == true) {
                alreadyInstalled = "हाँ";
              }
              let imageName = data[index]["image"];
              let userId = data[index]["userId"];
              let date = data[index]["date"].split(" ")[0];
              let approveDate = data[index]["approveDate"];
              let status = "";
              let isApprove = "0";
              let cardNumber = "";
              let servingCount = 0;
              let ApproveId = 0;
              let className = "house-list";
              if (data[index]["houseType"] == "19" || data[index]["houseType"] == "20") {
                className = "commercial-list";
                servingCount = parseInt(data[index]["totalHouses"]);
                if (isNaN(servingCount)) {
                  servingCount = 0;
                }
              }
              if (data[index]["cardNumber"] != null) {
                status = "Surveyed";
                cardNumber = data[index]["cardNumber"];
              }
              if (data[index]["revisitKey"] != null) {
                status = "Revisit";
              }

              if (data[index]["status"] != null) {
                //status = data[index]["status"];
              }
              if (data[index]["isApprove"] != null) {

                isApprove = data[index]["isApprove"];
              }
              if (data[index]["approveDate"] != null) {

                approveDate = data[index]["approveDate"];
              }
              if (data[index]["approveById"] != null) {

                ApproveId = data[index]["approveById"];

              }



              let city = this.commonService.getFireStoreCity();
              if (this.cityName == "sikar") {
                city = "Sikar-Survey";
              }

              let imageUrl = this.commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + wardNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
              let type = data[index]["houseType"];
              let houseTypeDetail = this.houseTypeList.find(item => item.id == type);
              if (houseTypeDetail != undefined) {
                let houseType = houseTypeDetail.houseType;
                this.markerDetailList.push({
                  wardNo: wardNo,
                  lineNo: lineNo,
                  index: index,
                  alreadyInstalled: alreadyInstalled,
                  imageName: imageName,
                  type: houseType,
                  imageUrl: imageUrl,
                  status: status,
                  userId: userId,
                  date: date,
                  houseTypeId: type,
                  isApprove: isApprove,
                  cardNumber: cardNumber,
                  servingCount: servingCount,
                  approveDate: approveDate,
                  ApproveId: ApproveId,
                  class: className

                });
              }
            }
          }
        }
      }
    });
  }

  openExportMarkerData(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 200;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divHouseStatus").css("height", divHeight);

  }


  getZoneHouseTypeList(content: any) {
    this.totalTypeCount = 0;
    this.zoneHouseTypeList = [];
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 870;
    let width = 400;
    height = (windowHeight * 70) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 75 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divHouseStatus").css("height", divHeight);
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        if (markerData == null) {
          this.closeModel();
        }
        else {
          let keyArray = Object.keys(markerData);
          for (let i = 0; i < keyArray.length; i++) {
            let houseTypeCount = 0;
            let lineNo = keyArray[i];
            let lineData = markerData[lineNo];

            let markerKeyArray = Object.keys(lineData);
            for (let j = 0; j < markerKeyArray.length; j++) {
              let markerNo = markerKeyArray[j];
              const isUserAllowed = this.userIsExternal ? parseInt(lineData[markerNo]["userId"]) !== -4 : true;//condition for excluding data if external user
              if (lineData[markerNo]["houseType"] != null && isUserAllowed) {
                houseTypeCount++;
                let houseTypeId = lineData[markerNo]["houseType"];
                let servingCount = 1;
                if (houseTypeId == "19" || houseTypeId == "20") {
                  let totalHouses = parseInt(lineData[markerNo]["totalHouses"]);
                  if (isNaN(totalHouses) || totalHouses == 0) {
                    totalHouses = 1;
                  }
                  servingCount = totalHouses;
                }
                this.totalTypeCount++;
                let detail = this.houseTypeList.find(item => item.id == houseTypeId);
                if (detail != undefined) {
                  let houseType = detail.houseType;
                  if (this.zoneHouseTypeList.length == 0) {
                    this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1, servingCounts: servingCount });
                  }
                  else {
                    let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseTypeId);
                    if (listDetail != undefined) {
                      listDetail.counts = listDetail.counts + 1;
                      listDetail.servingCounts = listDetail.servingCounts + servingCount;
                    }
                    else {
                      this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1, servingCounts: servingCount });
                    }
                  }
                }
              }
            }
          }
        }
      }
    );
  }

  showLineDetail(content: any, wardNo: any, lineNo: any, index: any, userId: any) {
    this.markerDetailList = [];
    this.markerData.lineNo = lineNo;
    this.getLineDetail(wardNo, lineNo);
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 870;
    let width = windowWidth - 300;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 130 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
  }
  closeModel() {
    this.modalService.dismissAll();
  }

  exportHouseTypeList(type: any) {
    if (this.zoneHouseTypeList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Entity Type";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Counts";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Serving Counts";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.zoneHouseTypeList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.zoneHouseTypeList[i]["houseType"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.zoneHouseTypeList[i]["counts"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.zoneHouseTypeList[i]["servingCounts"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Ward-" + this.selectedZone + "-EntityTypes.xlsx";
      if (type == "1") {
        fileName = "All-Ward-EntityTypes.xlsx";
      }
      this.commonService.exportExcel(htmlString, fileName);
      $('#divLoaderMain').hide();
    }
  }

  getAllZoneHouseTypeList() {
    this.zoneHouseTypeList = [];
    if (this.wardProgressList.length > 0) {
      $('#divLoaderMain').show();
      let zoneNo = this.wardProgressList[1]["wardNo"];
      this.getZoneHouseType(zoneNo, 1);
    }
  }

  getZoneHouseType(zoneNo: any, index: any) {
    index = index + 1;
    if (index == this.wardProgressList.length + 1) {
      this.exportHouseTypeList("1");
    }
    else {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getZoneHouseType");
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
        markerData => {
          markerInstance.unsubscribe();
          if (markerData == null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getZoneHouseType", markerData);
            if (this.wardProgressList[index] != null) {
              let zoneNoNew = this.wardProgressList[index]["wardNo"];
              this.getZoneHouseType(zoneNoNew, index);
            }
            else {
              this.exportHouseTypeList("1");
            }
          }
          else {
            let keyArray = Object.keys(markerData);
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                const isUserAllowed = this.userIsExternal ? parseInt(lineData[markerNo]["userId"]) !== -4 : true; //condition for excluding data if external user
                if (lineData[markerNo]["houseType"] != null && isUserAllowed) {
                  let houseTypeId = lineData[markerNo]["houseType"];
                  let servingCount = 1;
                  if (houseTypeId == "19" || houseTypeId == "20") {
                    let totalHouses = parseInt(lineData[markerNo]["totalHouses"]);
                    if (isNaN(totalHouses) || totalHouses == 0) {
                      totalHouses = 1;
                    }
                    servingCount = totalHouses;
                  }
                  let detail = this.houseTypeList.find(item => item.id == houseTypeId);
                  if (detail != undefined) {
                    let houseType = detail.houseType;
                    if (this.zoneHouseTypeList.length == 0) {
                      this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1, servingCounts: servingCount });
                    }
                    else {
                      let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseTypeId);
                      if (listDetail != undefined) {
                        listDetail.counts = listDetail.counts + 1;
                        listDetail.servingCounts = listDetail.servingCounts + servingCount;
                      }
                      else {
                        this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1, servingCounts: servingCount });
                      }
                    }
                  }
                }
              }
            }
            if (this.wardProgressList[index] != null) {
              let zoneNoNew = this.wardProgressList[index]["wardNo"];
              this.getZoneHouseType(zoneNoNew, index);
            }
            else {
              this.getZoneHouseType(zoneNo, index);
            }

          }
        }
      );
    }
  }


  updateMarkerCounts() {
    $(this.divLoaderCounts).show();
    this.totalHousesCount = 0;
    this.totalMarkersCount = 0;
    this.totalHousesCountActual = 0;
    this.totalMarkersCountActual = 0;
    this.wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.updateCounts(1);
  }


  updateCounts(index: any) {
    if (index == this.wardList.length) {
      let date = this.commonService.setTodayDate();
      let time = new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1];
      let lastUpdate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time;
      let dbPath = "EntityMarkingData/MarkingSurveyData";
      this.db.object(dbPath).update({ markerSummarylastUpdate: lastUpdate });
      dbPath = "EntityMarkingData/MarkingSurveyData/MarkerSummary";
      this.db.object(dbPath).update({ 
        totalHouses: this.totalHousesCount, 
        totalMarkers: this.totalMarkersCount,
        actualTotalHouses:this.totalHousesCountActual,
        actualTotalMarkers: this.totalMarkersCountActual,
      });
      const markingSummary = {
        markerSummarylastUpdate: lastUpdate,
        totalHouses: this.totalHousesCount,
        totalMarkers: this.totalMarkersCount,
        actualTotalHouses: this.totalHousesCountActual,
        actualTotalMarkers: this.totalMarkersCountActual
      }
      this.commonService.saveJsonFile(markingSummary, "MarkingSummary.json", "/SurveyManagement/MarkingManagement/");
      setTimeout(() => {
        this.commonService.setAlertMessage("success", "Data updated successfully !!!");
        $(this.divLoaderCounts).hide();
        this.markerData.lastUpdate = lastUpdate;
        this.markerData.totalAlreadyCard = 0;
        this.markerData.totalHouses = this.userIsExternal?this.totalHousesCountActual:this.totalHousesCount;
        this.markerData.totalMarkers = this.userIsExternal?this.totalMarkersCountActual:this.totalMarkersCount;
        this.getWards();
      }, 5000);

    }
    else {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts");
      let zoneNo = this.wardList[index]["zoneNo"];
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;

      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
        (markerData:any) => {
          markerInstance.unsubscribe();
          if (markerData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCounts", markerData);

            let keyArray = Object.keys(markerData);

            if (keyArray.length > 0) {

              let totalMarkerCount = 0;
              let totalHouseCount = 0;
              let totalComplexCount = 0;
              let totalHouseInComplexCount = 0;
              let totalModifiedHouseTypeCount = 0;
              let actualTotalMarkerCount = 0;
              let actualTotalHouseCount = 0;
              let actualTotalComplexCount = 0;
              let actualTotalHouseInComplexCount = 0;
              let actualTotalModifiedHouseTypeCount = 0; 

              for (let i = 0; i < keyArray.length; i++) {
                let markerCount = 0;
                let houseCount = 0;
                let complexCount = 0;
                let houseInComplexCount = 0;
                let actualMarkerCount = 0;
                let actualHouseCount = 0;
                let actualComplexCount = 0;
                let actualHouseInComplexCount = 0;
                let lineNo = keyArray[i];
                let lineData = markerData[lineNo];
                let markerKeyArray = Object.keys(lineData);

                for (let j = 0; j < markerKeyArray.length; j++) {
                  let markerNo = markerKeyArray[j];
                  if (parseInt(markerNo)) {
                    if (lineData[markerNo]["houseType"] != null) {
                      let userId = lineData[markerNo]["userId"]?parseInt(lineData[markerNo]["userId"]):null;
                      let internalUser = userId != -4 ? true:false;


                      markerCount = markerCount + 1;
                      actualMarkerCount += internalUser ? 1 : 0 ;// TO update actual marker count when userId is not -4

                      if (lineData[markerNo]["houseType"] == "19" || lineData[markerNo]["houseType"] == "20") {
                        complexCount = complexCount + 1;
                        actualComplexCount += internalUser ? 1 : 0 ;// TO update actual complex count when userId is not -4
                        let totalHouses = parseInt(lineData[markerNo]["totalHouses"]);
                        if (isNaN(totalHouses)) {
                          totalHouses = 1;
                        }
                        houseInComplexCount = houseInComplexCount + totalHouses;
                        houseCount = houseCount + totalHouses;

                        actualHouseInComplexCount += internalUser? totalHouses:0;// TO update actual count when userId is not -4
                        actualHouseCount += internalUser? totalHouses:0;// TO update actual count  when userId is not -4
                      }
                      else {
                        houseCount = houseCount + 1;
                        actualHouseCount += internalUser? 1:0 ;// TO update actual count  when userId is not -4
                      }
                      if (lineData[markerNo]["modifiedHouseTypeHistoryId"] != null) {
                        totalModifiedHouseTypeCount = totalModifiedHouseTypeCount + 1;
                        actualTotalModifiedHouseTypeCount = internalUser? 1:0 ;// TO update actual count  when userId is not -4
                      }
                    }
                  }
                }

                totalMarkerCount = totalMarkerCount + markerCount;
                totalHouseCount = totalHouseCount + houseCount;
                totalComplexCount = totalComplexCount + complexCount;
                totalHouseInComplexCount = totalHouseInComplexCount + houseInComplexCount;

                actualTotalMarkerCount += actualMarkerCount;// TO update actual count  when userId is not -4
                actualTotalHouseCount += actualHouseCount;// TO update actual count  when userId is not -4
                actualTotalComplexCount += actualComplexCount;// TO update actual count  when userId is not -4
                actualTotalHouseInComplexCount += actualHouseInComplexCount;// TO update actual count  when userId is not -4



                this.totalHousesCount = this.totalHousesCount + houseCount;
                this.totalMarkersCount = this.totalMarkersCount + markerCount;

                this.totalHousesCountActual +=  actualHouseCount;
                this.totalMarkersCountActual += actualMarkerCount;

                let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                this.db.object(dbPath).update({
                  marksCount: markerCount,
                  marksHouse: houseCount,
                  marksHouseInComplex: houseInComplexCount,
                  marksComplex: complexCount,

                  actualMarksCount: actualMarkerCount,
                  actualMarksHouse: actualHouseCount,
                  actualMarksHouseInComplex: actualHouseInComplexCount,
                  actualMarksComplex: actualComplexCount
                });
              }

              let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo;
              this.db.object(dbPath).update({ 
                marked: totalMarkerCount, 
                complexCount: totalComplexCount, 
                houseCount: totalHouseCount, 
                housesInComplex: totalHouseInComplexCount, 
                totalHouseTypeModifiedCount: totalModifiedHouseTypeCount,

                actualMarked: actualTotalMarkerCount, 
                actualComplexCount: actualTotalComplexCount, 
                actualHouseCount: actualTotalHouseCount, 
                actualHousesInComplex: actualTotalHouseInComplexCount, 
                actualTotalHouseTypeModifiedCount: actualTotalModifiedHouseTypeCount
              
              });
              this.updateDeleteCounts(zoneNo);
              index++;
              this.updateCounts(index);
            }
            else {
              this.updateDeleteCounts(zoneNo);
              index++;
              this.updateCounts(index);
            }
          }
          else {
            this.updateDeleteCounts(zoneNo);
            index++;
            this.updateCounts(index);
          }
        });
    }
  }

  updateDeleteCounts(ward: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateDeleteCounts");
    let dbPath = "EntityMarkingData/RemovedMarkers/" + ward;
    let deleteInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      deleteInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateDeleteCounts", data);
        let counts = 0;
        let lineArray = Object.keys(data);
        if (lineArray.length > 0) {
          for (let i = 0; i < lineArray.length; i++) {
            let lineNo = lineArray[i];
            if (lineNo != "totalRemovedMarkersCount") {
              let lineObj = data[lineNo];
              let markerArrray = Object.keys(lineObj);
              if (markerArrray.length > 0) {
                counts = counts + markerArrray.length;
              }
            }
          }
        }
        this.db.object(dbPath).update({ totalRemovedMarkersCount: counts });
      }
    })
  }

  getAssignedWard() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAssignedWard");
    let path = "EntityMarkingData/MarkerAppAccess";
    let assignWardInstance = this.db.object(path).valueChanges().subscribe(
      data => {
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedWard", data);
        }
        assignWardInstance.unsubscribe();
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let key = keyArray[i];
          if (data[key]["assignedWard"] != undefined) {
            this.inProgressWards.push({ ward: data[key]["assignedWard"] });
          }
        }
        this.getWards();
      });
  }
}

export class markerDatail {
  totalLines: string;
  totalMarkers: number;
  totalAlreadyCard: number;
  totalHouses: number;
  wardMarkers: number;
  wardHouses: number;
  wardInstalled: number;
  wardApprovedLines: number;
  lastUpdate: string;
  wardNo: string
  lastScan: string;
  lineNo: string

}
