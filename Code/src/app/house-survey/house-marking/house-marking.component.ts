import { Component, ViewChild } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-house-marking",
  templateUrl: "./house-marking.component.html",
  styleUrls: ["./house-marking.component.scss"],
})
export class HouseMarkingComponent {
  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;
  constructor(public fs: FirebaseService, public af: AngularFireModule, public httpService: HttpClient, private router: Router, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  public selectedZone: any;
  zoneList: any[];
  marker = new google.maps.Marker();
  allLines: any[];
  polylines = [];
  invisibleImageUrl = "../assets/img/invisible-location.svg";
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
    lastScanTime: ""
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.setMapHeight();
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
    if (this.zoneList != null) {
      this.selectedZone = 0;
      this.map = this.commonService.setMap(this.gmap);
    }
  }

  changeZoneSelection(filterVal: any) {
    if (filterVal == "0") {
      this.commonService.setAlertMessage("error", "Please select zone !!!");
      return;
    }
    this.clearAllData();
    this.clearAllOnMap();
    this.zoneKML = this.commonService.setKML(this.selectedZone, this.map);
    this.getWardDetail();
  }

  getWardDetail() {
    this.getTotalMarkers();
    this.wardLineCount = this.commonService.getWardLineCount(this.selectedZone);
    this.markerData.totalLines = this.wardLineCount;
    this.getWardLines(this.wardLineCount);
    this.getLastScanTime();
    this.getLineApprove();
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
        this.markerData.alreadyCardCount = data["alreadyInstalled"].toString();
        this.markerData.approvedLines = data["approved"].toString();
      }
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
              let dbPath = "Defaults/FinalHousesType/" + type + "/name";
              let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
                houseInstance.unsubscribe();
                if (data != null) {
                  let houseType = data.toString().split("(")[0];
                  let markerURL = this.getMarkerIcon(type);
                  this.setMarker(lat, lng, markerURL, houseType, "", "marker", lineNo, "", index);
                }
              });
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

  getWardLines(lineCount: any) {

    for (let i = 1; i <= Number(lineCount); i++) {
      let wardLines = this.db.list("Defaults/WardLines/" + this.selectedZone + "/" + i + "/points").valueChanges().subscribe((zoneData) => {
        wardLines.unsubscribe();
        if (zoneData.length > 0) {
          let lineData = zoneData;
          var latLng = [];
          for (let j = 0; j < lineData.length; j++) {
            latLng.push({ lat: lineData[j][0], lng: lineData[j][1] });
          }
          this.lines.push({ lineNo: i, latlng: latLng, color: "#87CEFA", });
          this.plotLineOnMap(i, latLng, i - 1, this.selectedZone);
          if (this.lineNo == i.toString()) {
            this.getMarkedHouses(i);
          }
        }
      });
    }
  }

  getMarkedHouses(lineNo: any) {
    this.markerList = [];
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + lineNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (index != "ApproveStatus" && index != "marksCount" && index != "lastMarkerKey" && index != "alreadyInstalledCount") {
              if (data[index]["latLng"] != undefined) {
                let lat = data[index]["latLng"].split(",")[0];
                let lng = data[index]["latLng"].split(",")[1];
                let imageName = data[index]["image"];
                let userId = data[index]["userId"];
                let date = data[index]["date"].split(" ")[0];
                let status = "";
                let statusClass="";
                let isRevisit="0";
                if (data[index]["status"] != null) {
                  status = data[index]["status"];
                }
                if (data[index]["cardNumber"] != null) {
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
                  isRevisit="1";
                  statusClass="status-deleted";
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
                let dbPath1 = "Defaults/FinalHousesType/" + type + "/name";
                let houseInstance1 = this.db.object(dbPath1).valueChanges().subscribe((data) => {
                  houseInstance1.unsubscribe();
                  if (data != null) {
                    let houseType = data.toString().split("(")[0];
                    this.markerList.push({ index: index, lat: lat, lng: lng, alreadyInstalled: alreadyInstalled, imageName: imageName, type: houseType, imageUrl: imageUrl, status: status, userId: userId, date: date, statusClass: statusClass,isRevisit:isRevisit });
                  }
                });
                let alreadyCard = "";
                if (alreadyInstalled == "हाँ") {
                  alreadyCard = "(कार्ड पहले से लगा हुआ है) ";
                }

                let dbPath = "Defaults/FinalHousesType/" + type + "/name";
                let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
                  houseInstance.unsubscribe();
                  if (data != null) {
                    let houseType = data.toString().split("(")[0];
                    let markerURL = this.getMarkerIcon(type);
                    this.setMarker(lat, lng, markerURL, houseType, imageName, "marker", lineNo, alreadyCard, index);
                  }
                });
              }
            }
          }
        }
      }
    });
  }

  showLineDetail(content: any) {
    if (this.markerList.length > 0) {
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
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  removeMarker(markerNo: any, alreadyCard: any) {
    let markerDatails = this.markerList.find((item) => item.index == markerNo);
    if (markerDatails != undefined) {
      let userId = markerDatails.userId;
      let date = markerDatails.date.toString().split(" ")[0];
      let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/" + markerNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          dbPath = "EntityMarkingData/RemovedMarkers/" + this.selectedZone + "/" + this.lineNo + "/" + markerNo;
          this.db.object(dbPath).update(data);
          dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/" + markerNo + "/";
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let key = keyArray[i];
              data[key] = null;
            }
          }
          this.db.object(dbPath).update(data);
          dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/marksCount";
          let markerCountInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
            markerCountInstance.unsubscribe();
            if (data != null) {
              let marksCount = Number(data) - 1;
              this.markerData.totalMarkers = (Number(this.markerData.totalMarkers) - 1).toString();
              this.markerData.totalLineMarkers = (Number(this.markerData.totalLineMarkers) - 1).toString();
              dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo;
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
          if (this.markerList.length > 0) {
            for (let i = 0; i < this.markerList.length; i++) {
              if (this.markerList[i]["index"] != markerNo) {
                newMarkerList.push({ index: this.markerList[i]["index"], lat: this.markerList[i]["lat"], lng: this.markerList[i]["lng"], alreadyInstalled: this.markerList[i]["alreadyInstalled"], imageName: this.markerList[i]["imageName"], type: this.markerList[i]["houseType"], imageUrl: this.markerList[i]["imageUrl"], status: this.markerList[i]["status"], userId: this.markerList[i]["userId"], date: this.markerList[i]["date"],isRevisit:this.markerList[i]["isRevisit"] });
              }
            }
            this.markerList = newMarkerList;
          }

          if (alreadyCard == "हाँ") {
            let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "/alreadyInstalled";
            let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe(
              alreadyData => {
                alreadyInstance.unsubscribe();
                let total = 0;
                if (alreadyData != null) {
                  total = Number(alreadyData) - 1;
                }
                this.markerData.alreadyCardCount = this.markerData.alreadyCardCount - 1;
                this.markerData.alreadyCardLineCount = this.markerData.alreadyCardLineCount - 1;
                this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "/").update({ alreadyInstalled: total });
                let wardDetail = this.markerList.find((item) => item.index == markerNo);
                if (wardDetail != undefined) {
                  wardDetail.alreadyInstalled = Number(wardDetail.alreadyInstalled) - 1;
                }
              }
            );

            dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/alreadyInstalledCount";
            let alreadyLineInstance = this.db.object(dbPath).valueChanges().subscribe(
              alreadyLineData => {
                alreadyLineInstance.unsubscribe();
                let total = 0;
                if (alreadyLineData != null) {
                  total = Number(alreadyLineData) - 1;
                }
                this.db.object("EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/").update({ alreadyInstalledCount: total });
              }
            );
          }
          this.updateCount(date, userId, "remove");
          this.commonService.setAlertMessage("success", "Marker deleted successfully !!!"
          );
        }
      });
    }
  }

  updateCount(date: any, userId: any, type: any) {
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
    let totalinstance2 = this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + this.selectedZone + "/" + countKey).valueChanges().subscribe((totalCount) => {
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
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + this.selectedZone + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + this.selectedZone + "").update({ marked: total, });
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
    let totalinstance3 = this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + this.selectedZone + "/" + countKey).valueChanges().subscribe((totalCount) => {
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
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + this.selectedZone + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + this.selectedZone + "").update({ marked: total, });
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
    let totalinstance4 = this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "/" + countKey).valueChanges().subscribe((totalCount) => {
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
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + this.selectedZone + "").update({ marked: total, });
      }
    });
  }

  saveMarkerStatus(markerNo: any) {
    let markerDatails = this.markerList.find((item) => item.index == markerNo);
    if (markerDatails != undefined) {
      let userId = markerDatails.userId;
      let date = markerDatails.date.toString().split(" ")[0];
      markerDatails.status = "Reject";
      let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/" + markerNo;
      this.db.object(dbPath).update({ status: "Reject", });
      this.updateCount(date, userId, "reject");
      this.commonService.setAlertMessage("success", "Marker rejected successfully !!!");
    }
  }

  getMarkerIcon(type: any) {
    let url = "../assets/img/final-marker-2.svg";
    if (type == 1 || type == 19) {
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
      let element = <HTMLButtonElement>document.getElementById("btnSave");
      if (data != null) {
        $("#btnSave").css("background", "#0ba118");
        element.disabled = false;
        this.markerData.totalLineMarkers = data.toString();
      } else {
        $("#btnSave").css("background", "#626262");
        element.disabled = true;
      }
    });
    dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/ApproveStatus";
    let approveInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      approveInstance.unsubscribe();
      if (data != null) {
        if (data["status"] == "Confirm") {
          $("#btnSave").html("Reject Line");
        } else {
          $("#btnSave").html("Approve Line");
        }
      } else {
        $("#btnSave").html("Approve Line");
      }
    });
  }

  saveData() {
    let element = <HTMLInputElement>document.getElementById("chkAll");
    if (element.checked == true) {
      this.commonService.setAlertMessage("error", "Please remove check from show all markers for approve this line!!!");
      return;
    }

    let lineNo = $("#txtLineNo").val();
    let lineStatus = $("#btnSave").html();
    let status = "";
    if (lineStatus == "Approve Line") {
      status = "Confirm";
      $("#btnSave").html("Reject Line");
    } else {
      status = "Reject";
      $("#btnSave").html("Approve Line");
    }

    if (lineNo == "") {
      this.commonService.setAlertMessage("error", "Please enter line no. !!!");
      return;
    }
    this.lineNo = lineNo;
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone + "/" + this.lineNo + "/ApproveStatus";
    const data = {
      status: status,
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
        this.houseMarker[i]["marker"].setMap(null);
      }
    }
    if (this.allMatkers.length > 0) {
      for (let i = 0; i < this.allMatkers.length; i++) {
        this.allMatkers[i]["marker"].setMap(null);
      }
      this.allMatkers = [];
    }
    if (this.zoneKML != null) {
      this.zoneKML.setMap(null);
    }
    if (this.polylines.length > 0) {
      for (let i = 0; i < this.polylines.length; i++) {
        this.polylines[i].setMap(null);
      }
    }
    this.polylines = [];
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
  }

  clearLineData() {
    this.markerData.alreadyCard = "";
    this.markerData.alreadyCardLineCount = 0;
    this.markerData.houseType = "";
    this.markerData.markerImgURL = "../assets/img/img-not-available-01.jpg";
    this.markerData.totalLineMarkers = "0";
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
}