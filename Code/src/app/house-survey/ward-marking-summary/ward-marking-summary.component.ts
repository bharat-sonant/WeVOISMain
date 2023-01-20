import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-ward-marking-summary",
  templateUrl: "./ward-marking-summary.component.html",
  styleUrls: ["./ward-marking-summary.component.scss"],
})
export class WardMarkingSummaryComponent implements OnInit {
  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient, private modalService: NgbModal) { }
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
    wardNo:"0",
    lastScan:""
    
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
  public totalTypeCount: any;
  isActionShow: any;
  userId: any
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.isActionShow = true;
    if (this.cityName == "jaipur-malviyanagar" || this.cityName == "jaipur-murlipura") {
      this.isActionShow = false;
    }
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.getLastUpdate();
    this.getMarkerCityName();
    this.showHideAlreadyCardInstalled();
    this.getHouseType();
    this.getWards();


  }

  getLastUpdate() {
    let dbPath = "EntityMarkingData/MarkingSurveyData/markerSummarylastUpdate";
    let lastUpdateInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastUpdateData => {
        lastUpdateInstance.unsubscribe();
        if (lastUpdateData != null) {
          this.markerData.lastUpdate = lastUpdateData;
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

  getWards() {
    let path = "EntityMarkingData/MarkingSurveyData/MarkerSummary/"
    let wardInstance = this.db.object(path).valueChanges().subscribe((data) => {
      wardInstance.unsubscribe();
      this.markerData.totalMarkers = data["totalMarkers"];
      this.markerData.totalHouses = data["totalHouses"];
    })
    this.wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.wardProgressList = [];
    if (this.wardList.length > 0) {
      for (let i = 0; i < this.wardList.length; i++) {
        let wardNo = this.wardList[i]["zoneNo"];
        let url = this.cityName + "/13A3/house-marking/" + wardNo;
        this.wardProgressList.push({ wardNo: wardNo, markers: 0, url: url, alreadyInstalled: 0, wardLines: 0, approvedLines: 0, houses: 0, complex: 0, houseInComplex: 0, status: "", cssClass: "not-start" });
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
      this.updateMarkerAddress(0, type);
    }
    else {
      let zoneNo = this.wardList[index]["zoneNo"];
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
        markerData => {
          markerInstance.unsubscribe();
          if (markerData != null) {
            let keyArray = Object.keys(markerData);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let lineNo = keyArray[i];
                let lineData = markerData[lineNo];
                let markerKeyArray = Object.keys(lineData);
                for (let j = 0; j < markerKeyArray.length; j++) {
                  let markerNo = markerKeyArray[j];
                  if (lineData[markerNo]["houseType"] != null) {
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
                    let address = "";
                    let cardNumber = "";
                    if (lineData[markerNo]["address"] != null) {
                      address = lineData[markerNo]["address"];
                    }
                    if (lineData[markerNo]["cardNumber"] != null) {
                      cardNumber = lineData[markerNo]["cardNumber"];
                    }
                    this.markerExportList.push({ Zone: zoneNo, Line: lineNo, Longitue: lng, Latitude: lat, Type: houseType, address: address, MarkerNo: markerNo, cardNumber: cardNumber });
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

  updateMarkerAddress(index: any, type: any) {
    if (index == this.markerExportList.length) {
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
      htmlString += "</tr>";
      for (let i = 0; i < this.markerExportList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += this.markerExportList[i]["Zone"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.markerExportList[i]["Line"];
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
        htmlString += "</tr>";
      }
      htmlString += "<table>";
      let fileName = this.commonService.getFireStoreCity() + "-" + type + "-MarkersData.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
      $(this.divLoaderMain).hide();
    }
    else {
      let zoneNo = this.markerExportList[index]["Zone"];
      let LineNo = this.markerExportList[index]["Line"];
      let markerNo = this.markerExportList[index]["MarkerNo"];
      let address = this.markerExportList[index]["address"];
      if (address == "") {
        let cardNumber = this.markerExportList[index]["cardNumber"];
        if (cardNumber != "") {
          let dbPath = "Houses/" + zoneNo + "/" + LineNo + "/" + cardNumber + "/address";
          let addressInstance = this.db.object(dbPath).valueChanges().subscribe(
            addressData => {
              addressInstance.unsubscribe();
              if (addressData != null) {
                address = addressData.toString();
                dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + LineNo + "/" + markerNo;
                //this.db.object(dbPath).update({ address: address });
                this.markerExportList[index]["address"] = address;
              }
              index++;
              this.updateMarkerAddress(index, type);
            }
          );
        }
        else {
          if (index == 0) {
            address = this.markerCityName;
          }
          else {
            address = this.markerExportList[index - 1]["address"];
          }
          let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + LineNo + "/" + markerNo;
          this.db.object(dbPath).update({ address: address });
          this.markerExportList[index]["address"] = address;
          index++;
          this.updateMarkerAddress(index, type);
        }
      }
      else {
        index++;
        this.updateMarkerAddress(index, type);
      }
    }
  }

  getWardSummary(index: any, wardNo: any) {
    this.commonService.getWardLine(wardNo, this.commonService.setTodayDate()).then((data: any) => {
      let wardLines = JSON.parse(data);
      this.wardLines = wardLines["totalLines"];
      this.wardProgressList[index]["wardLines"] = this.wardLines;
      let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          let markers = 0;
          if (data["marked"] != null) {
            markers = Number(data["marked"]);
          }
          let alreadyInstalled = 0;
          if (data["alreadyInstalled"] != null) {
            alreadyInstalled = Number(data["alreadyInstalled"]);
            this.markerData.totalAlreadyCard = this.markerData.totalAlreadyCard + alreadyInstalled;
          }
          this.wardProgressList[index]["markers"] = markers;
          if (markers > 0) {
            this.wardProgressList[index]["status"] = "In progress";
            this.wardProgressList[index]["cssClass"] = "in-progress";
          }
          this.wardProgressList[index]["alreadyInstalled"] = alreadyInstalled;


          let houseCount = 0;
          if (data["houseCount"] != null) {
            houseCount = Number(data["houseCount"]);
          }
          this.wardProgressList[index]["houses"] = houseCount;
          let complex = 0;
          if (data["complexCount"] != null) {
            complex = Number(data["complexCount"]);
          }
          this.wardProgressList[index]["complex"] = complex;
          let houseInComplex = 0;
          if (data["housesInComplex"] != null) {
            houseInComplex = Number(data["housesInComplex"]);
          }
          this.wardProgressList[index]["houseInComplex"] = houseInComplex;
          let approved = 0;
          if (data["approved"] != null) {
            approved = Number(data["approved"]);
            this.wardProgressList[index]["approvedLines"] = approved;
            if (approved == Number(this.wardProgressList[index]["wardLines"])) {
              this.wardProgressList[index]["status"] = "Marking done";
              this.wardProgressList[index]["cssClass"] = "marking-done";
            }
          }
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
        $("#tr" + i).removeClass(className);
      }
      if (i == index) {
        $("#tr" + i).addClass("active");
      }
    }
  }

  getMarkingDetail(wardNo: any, listIndex: any) {
    this.markerData.lastScan=""
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
      this.markerData.wardNo=wardDetail.wardNo

      for (let i = 1; i <= wardDetail.wardLines; i++) {
        this.lineMarkerList.push({ wardNo: wardNo, lineNo: i, markers: 0, houses: 0, complex: 0, houseInComplex: 0, isApproved: false, alreadyCard: 0 });
        this.getLineStatus(wardNo, i);
        this.getLineMarkers(wardNo, i);
        this.getLineHouses(wardNo, i);
        this.getLineComplex(wardNo, i);
        this.getLineHousesInComplex(wardNo, i);
        this.getLineAlreadyCard(wardNo, i);
      }
  let dbPath="EntityMarkingData/LastScanTime/Ward/"+ wardNo;
    console.log(dbPath)
      let totalmarkingInstance=this.db.object(dbPath).valueChanges().subscribe((data)=>{
      totalmarkingInstance.unsubscribe();
        console.log(data)
        let lastscandata=data.split(":");
        let scandata=lastscandata[0]+":"+lastscandata[1]
        //this.markerData.lastScan = scandata;
        if(data !=null){
          this.markerData.lastScan = scandata;
        }
        
      })
    }
  }

  getLineAlreadyCard(wardNo: any, lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/alreadyInstalledCount";
    let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe(
      alreadyData => {
        alreadyInstance.unsubscribe();
        if (alreadyData != null) {
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.alreadyCard = Number(alreadyData);
          }
        }
      }
    );
  }

  getLineMarkers(wardNo: any, lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/marksCount";
    let markedInstance = this.db.object(dbPath).valueChanges().subscribe(
      markedData => {
        markedInstance.unsubscribe();
        if (markedData != null) {
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.markers = Number(markedData);
          }
        }
      }
    );
  }

  getLineHouses(wardNo: any, lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/marksHouse";
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        if (houseData != null) {
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.houses = Number(houseData);
          }
        }
      }
    );
  }


  getLineComplex(wardNo: any, lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/marksComplex";
    let complexInstance = this.db.object(dbPath).valueChanges().subscribe(
      complexData => {
        complexInstance.unsubscribe();
        if (complexData != null) {
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.complex = Number(complexData);
          }
        }
      }
    );
  }

  getLineHousesInComplex(wardNo: any, lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/marksHouseInComplex";
    let houseComplexInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseComplexData => {
        houseComplexInstance.unsubscribe();
        if (houseComplexData != null) {
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.houseInComplex = Number(houseComplexData);
          }
        }
      }
    );
  }

  getLineStatus(wardNo: any, lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/ApproveStatus/status";
    let approvedInstance = this.db.object(dbPath).valueChanges().subscribe(
      approveData => {
        approvedInstance.unsubscribe();
        if (approveData != null) {
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
    this.markerDetailList = [];
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (data[index]["latLng"] != null) {
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
              if (data[index]["houseType"] == "19" || data[index]["houseType"] == "20") {
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
                console.log(ApproveId);
              }



              let city = this.commonService.getFireStoreCity();

              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FMarkingSurveyImages%2F" + wardNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
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
                  ApproveId: ApproveId

                });
              }
            }
          }
        }
      }
    });
  }
  setHouseType(wardNo: any, lineNo: any, index: any) {
    $(this.divHouseType).show();
    $(this.houseWardNo).val(wardNo);
    $(this.houseLineNo).val(lineNo);
    $(this.houseIndex).val(index);
    let detail = this.markerDetailList.find(item => item.index == index);
    if (detail != undefined) {
      let houseTypeId = detail.houseTypeId;
      $(this.ddlHouseType).val(houseTypeId);
    }
  }

  updateHouseType() {
    let wardNo = $(this.houseWardNo).val();
    let lineNo = $(this.houseLineNo).val();
    let index = $(this.houseIndex).val();
    let houseTypeId = $(this.ddlHouseType).val();
    let detail = this.markerDetailList.find(item => item.index == index);
    if (detail != undefined) {
      detail.houseTypeId = houseTypeId;
      let houseTypeDetail = this.houseTypeList.find(item => item.id == houseTypeId);
      if (houseTypeDetail != undefined) {
        detail.type = houseTypeDetail.houseType;
        if (detail.cardNumber != "") {
          let cardType = "";
          if (houseTypeDetail.entityType == "residential") {
            cardType = "आवासीय"
          }
          else {
            cardType = "व्यावसायिक";
          }
          let dbPath = "Houses/" + wardNo + "/" + lineNo + "/" + detail.cardNumber;
          this.db.object(dbPath).update({ houseType: houseTypeId, cardType: cardType });
        }
      }
      let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + index;
      this.db.object(dbPath).update({ houseType: houseTypeId });
    }

    $(this.houseWardNo).val("0");
    $(this.houseLineNo).val("0");
    $(this.houseIndex).val("0");
    $(this.divHouseType).hide();
    this.commonService.setAlertMessage("success", "Saved successfully !!!");

  }

  cancelHouseType() {
    $(this.houseWardNo).val("0");
    $(this.houseLineNo).val("0");
    $(this.houseIndex).val("0");
    $(this.divHouseType).hide();
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
              if (lineData[markerNo]["houseType"] != null) {
                houseTypeCount++;
                let houseTypeId = lineData[markerNo]["houseType"];
                this.totalTypeCount++;
                let detail = this.houseTypeList.find(item => item.id == houseTypeId);
                if (detail != undefined) {
                  let houseType = detail.houseType;
                  if (this.zoneHouseTypeList.length == 0) {
                    this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1 });
                  }
                  else {
                    let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseTypeId);
                    if (listDetail != undefined) {
                      listDetail.counts = listDetail.counts + 1;
                    }
                    else {
                      this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1 });
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
    this.getLineDetail(wardNo, lineNo);
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 870;
    let width = windowWidth - 300;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 140 + "px";
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
      htmlString += "</tr>";
      for (let i = 0; i < this.zoneHouseTypeList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.zoneHouseTypeList[i]["houseType"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.zoneHouseTypeList[i]["counts"];
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
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
        markerData => {
          markerInstance.unsubscribe();
          if (markerData == null) {
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
                if (lineData[markerNo]["houseType"] != null) {
                  let houseTypeId = lineData[markerNo]["houseType"];
                  let detail = this.houseTypeList.find(item => item.id == houseTypeId);
                  if (detail != undefined) {
                    let houseType = detail.houseType;
                    if (this.zoneHouseTypeList.length == 0) {
                      this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1 });
                    }
                    else {
                      let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseTypeId);
                      if (listDetail != undefined) {
                        listDetail.counts = listDetail.counts + 1;
                      }
                      else {
                        this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: 1 });
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
      this.db.object(dbPath).update({ totalHouses: this.totalHousesCount, totalMarkers: this.totalMarkersCount });
      setTimeout(() => {
        this.commonService.setAlertMessage("success", "Data updated successfully !!!");
        $(this.divLoaderCounts).hide();
        this.markerData.lastUpdate = lastUpdate;
        this.markerData.totalAlreadyCard = 0;
        this.markerData.totalHouses = 0;
        this.markerData.totalMarkers = 0;
        this.getWards();
      }, 5000);

    }
    else {
      let zoneNo = this.wardList[index]["zoneNo"];
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;

      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
        markerData => {
          markerInstance.unsubscribe();

          if (markerData != null) {

            let keyArray = Object.keys(markerData);

            if (keyArray.length > 0) {

              let totalMarkerCount = 0;
              let totalHouseCount = 0;
              let totalComplexCount = 0;
              let totalHouseInComplexCount = 0;

              for (let i = 0; i < keyArray.length; i++) {
                let markerCount = 0;
                let houseCount = 0;
                let complexCount = 0;
                let houseInComplexCount = 0;
                let lineNo = keyArray[i];
                let lineData = markerData[lineNo];
                let markerKeyArray = Object.keys(lineData);

                for (let j = 0; j < markerKeyArray.length; j++) {
                  let markerNo = markerKeyArray[j];
                  if (parseInt(markerNo)) {
                    markerCount = markerCount + 1;
                    if (lineData[markerNo]["houseType"] == "19" || lineData[markerNo]["houseType"] == "20") {
                      complexCount = complexCount + 1;
                      let totalHouses = parseInt(lineData[markerNo]["totalHouses"]);
                      if (isNaN(totalHouses)) {
                        totalHouses = 1;
                      }
                      houseInComplexCount = houseInComplexCount + totalHouses;
                      houseCount = houseCount + totalHouses;
                    }
                    else {
                      houseCount = houseCount + 1;
                    }
                  }
                }

                totalMarkerCount = totalMarkerCount + markerCount;
                totalHouseCount = totalHouseCount + houseCount;
                totalComplexCount = totalComplexCount + complexCount;
                totalHouseInComplexCount = totalHouseInComplexCount + houseInComplexCount;

                this.totalHousesCount = this.totalHousesCount + houseCount;
                this.totalMarkersCount = this.totalMarkersCount + markerCount;

                let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                this.db.object(dbPath).update({
                  marksCount: markerCount,
                  marksHouse: houseCount,
                  marksHouseInComplex: houseInComplexCount,
                  marksComplex: complexCount
                });
              }

              let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo;
              this.db.object(dbPath).update({ marked: totalMarkerCount, complexCount: totalComplexCount, houseCount: totalHouseCount, housesInComplex: totalHouseInComplexCount });
              index++;
              this.updateCounts(index);
            }
            else {
              index++;
              this.updateCounts(index);
            }
          }
          else {
            index++;
            this.updateCounts(index);
          }
        });
    }
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
  wardNo:string
  lastScan:string;

}
