import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-ward-marking-summary",
  templateUrl: "./ward-marking-summary.component.html",
  styleUrls: ["./ward-marking-summary.component.scss"],
})
export class WardMarkingSummaryComponent implements OnInit {
  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal) { }
  selectedCircle: any;
  wardProgressList: any[] = [];
  wardProgressListShow: any[] = [];
  cityName: any;
  db: any;
  isFirst = true;
  lineMarkerList: any[];
  wardLines: any;
  markerList: any[];
  markerDetailList: any[];
  markerData: markerDatail = {
    totalLines: "0",
    totalMarkers: 0,
    totalAlreadyCard: 0,
    wardMarkers: 0,
    wardInstalled: 0,
    wardApprovedLines: 0
  };
  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.getWards();
  }



  getWards() {
    let wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.wardProgressList = [];
    if (wardList.length > 0) {
      for (let i = 0; i < wardList.length; i++) {
        let wardNo = wardList[i]["zoneNo"];
        //if (wardNo != "0") {
          let url = this.cityName + "/13A3/house-marking/" + wardNo;
          this.wardProgressList.push({ wardNo: wardNo, markers: 0, url: url, alreadyInstalled: 0, wardLines: 0, approvedLines: 0, status: "", cssClass: "not-start" });
          if (i == 1) {
            setTimeout(() => {
              this.getMarkingDetail(wardNo, 1);
              $("#tr1").addClass("active");
            }, 1000);
          }
          this.getWardSummary(i, wardNo);
       // }
      }
    }
  }

  getWardSummary(index: any, wardNo: any) {
    this.wardLines = this.commonService.getWardLineCount(wardNo);
    this.wardProgressList[index]["wardLines"] = this.wardLines;

    let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      markerInstance.unsubscribe();
      if (data != null) {
        let markers = Number(data["marked"]);
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
        this.markerData.totalMarkers = this.markerData.totalMarkers + markers;
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
    let wardDetail = this.wardProgressList.find(item => item.wardNo == wardNo);
    if (wardDetail != undefined) {

      this.markerData.totalLines = wardDetail.wardLines;
      this.markerData.wardApprovedLines = wardDetail.approvedLines;
      this.markerData.wardInstalled = wardDetail.alreadyInstalled;
      this.markerData.wardMarkers = wardDetail.markers;

      for (let i = 1; i <= wardDetail.wardLines; i++) {
        this.lineMarkerList.push({ wardNo: wardNo, lineNo: i, markers: 0, isApproved: false, alreadyCard: 0 });
        this.getLineStatus(wardNo, i);
        this.getLineMarkers(wardNo, i);
        this.getLineAlreadyCard(wardNo, i);
      }
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

  removeMarker(wardNo: any, lineNo: any, markerNo: any, alreadyCard: any) {

    let markerDatails = this.markerDetailList.find((item) => item.index == markerNo);
    if (markerDatails != undefined) {
      let userId = markerDatails.userId;
      let date = markerDatails.date.toString().split(" ")[0];
      let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + markerNo;
      let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          dbPath = "EntityMarkingData/RemovedMarkers/" + wardNo + "/" + lineNo + "/" + markerNo;
          this.db.object(dbPath).update(data);
          dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + markerNo + "/";
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let key = keyArray[i];
              data[key] = null;
            }
          }
          this.db.object(dbPath).update(data);
          dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/marksCount";
          let markerCountInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
            markerCountInstance.unsubscribe();
            if (data != null) {
              let marksCount = Number(data) - 1;
              this.markerData.wardMarkers =
                Number(this.markerData.totalMarkers) - 1;
              dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo;
              const data1 = {
                marksCount: marksCount,
              };
              this.db.object(dbPath).update(data1);
            }
          });

          this.markerData.totalMarkers = Number(this.markerData.totalMarkers) - 1;
          let wardDetail = this.wardProgressList.find(item => item.wardNo == wardNo);
          if (wardDetail != undefined) {
            wardDetail.markers = Number(wardDetail.markers) - 1;
          }
          let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
          if (lineDetail != undefined) {
            lineDetail.markers = Number(lineDetail.markers) - 1;
          }

          let newMarkerList = [];

          if (this.markerDetailList.length > 0) {
            for (let i = 0; i < this.markerDetailList.length; i++) {
              if (this.markerDetailList[i]["index"] != markerNo) {
                newMarkerList.push({
                  wardNo: this.markerDetailList[i]["wardNo"],
                  lineNo: this.markerDetailList[i]["lineNo"],
                  index: this.markerDetailList[i]["index"],
                  alreadyInstalled: this.markerDetailList[i]["alreadyInstalled"],
                  imageName: this.markerDetailList[i]["imageName"],
                  type: this.markerDetailList[i]["houseType"],
                  imageUrl: this.markerDetailList[i]["imageUrl"],
                  status: this.markerDetailList[i]["status"],
                  userId: this.markerDetailList[i]["userId"],
                  date: this.markerDetailList[i]["date"],
                });
              }
            }
            this.markerDetailList = newMarkerList;
          }

          if (alreadyCard == "हाँ") {
            let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/alreadyInstalled";
            let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe(
              alreadyData => {
                alreadyInstance.unsubscribe();
                let total = 0;
                if (alreadyData != null) {
                  total = Number(alreadyData) - 1;
                }
                this.markerData.totalAlreadyCard = this.markerData.totalAlreadyCard - 1;
                this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/").update({ alreadyInstalled: total });
                let wardDetail = this.wardProgressList.find(item => item.wardNo == wardNo);
                if (wardDetail != undefined) {
                  wardDetail.alreadyInstalled = Number(wardDetail.alreadyInstalled) - 1;
                }
                let lineDetail = this.lineMarkerList.find(item => item.lineNo == lineNo);
                if (lineDetail != undefined) {
                  lineDetail.alreadyCard = Number(lineDetail.alreadyCard) - 1;
                }
              }
            );
            dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/alreadyInstalledCount";
            let alreadyLineInstance = this.db.object(dbPath).valueChanges().subscribe(
              alreadyLineData => {
                alreadyLineInstance.unsubscribe();
                let total = 0;
                if (alreadyLineData != null) {
                  total = Number(alreadyLineData) - 1;
                }
                this.db.object("EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/").update({ alreadyInstalledCount: total });
              }
            );
          }

          this.updateCount(wardNo, date, userId, "remove");

          this.commonService.setAlertMessage(
            "success",
            "Marker deleted successfully !!!"
          );
        }
      });
    }
  }

  saveMarkerStatus(wardNo: any, lineNo: any, markerNo: any) {
    let markerDatails = this.markerDetailList.find((item) => item.index == markerNo);
    if (markerDatails != undefined) {
      let userId = markerDatails.userId;
      let date = markerDatails.date.toString().split(" ")[0];
      markerDatails.status = "Reject";
      let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + markerNo;
      this.db.object(dbPath).update({ status: "Reject", });

      this.updateCount(wardNo, date, userId, "reject");

      this.commonService.setAlertMessage(
        "success",
        "Marker rejected succfuly !!!"
      );
    }
  }

  updateCount(wardNo: any, date: any, userId: any, type: any) {
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
    let totalinstance2 = this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + wardNo + "/" + countKey).valueChanges().subscribe((totalCount) => {
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
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + wardNo + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/Employee/EmployeeWise/" + userId + "/" + wardNo + "").update({ marked: total, });
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
    let totalinstance3 = this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + wardNo + "/" + countKey).valueChanges().subscribe((totalCount) => {
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
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + wardNo + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/" + date + "/" + wardNo + "").update({ marked: total, });
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
    let totalinstance4 = this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/" + countKey).valueChanges().subscribe((totalCount) => {
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
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "").update({ rejected: total, });
      } else {
        this.db.object("EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "").update({ marked: total, });
      }
    });
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
              let status = "";
              if (data[index]["cardNumber"] != null) {
                status = "Surveyed";
              }
              if (data[index]["revisitKey"] != null) {
                status = "Revisit";
              }

              if (data[index]["status"] != null) {
                status = data[index]["status"];
              }
              let city = this.commonService.getFireStoreCity();

              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FMarkingSurveyImages%2F" + wardNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
              let type = data[index]["houseType"];
              let dbPath1 = "Defaults/FinalHousesType/" + type + "/name";
              let houseInstance1 = this.db.object(dbPath1).valueChanges().subscribe((data) => {
                houseInstance1.unsubscribe();
                if (data != null) {
                  let houseType = data.toString().split("(")[0];
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
                  });
                }
              });
            }
          }
        }
      }
    });
  }


  showLineDetail(content: any, wardNo: any, lineNo: any) {
    this.markerDetailList = [];
    this.getLineDetail(wardNo, lineNo);
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 870;
    let width = windowWidth - 300;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 50 + "px";
    $("div .modal-content")
      .parent()
      .css("max-width", "" + width + "px")
      .css("margin-top", marginTop);
    $("div .modal-content")
      .css("height", height + "px")
      .css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#divStatus").css("height", divHeight);
  }

  closeModel() {
    this.modalService.dismissAll();
  }
}
export class markerDatail {
  totalLines: string;
  totalMarkers: number;
  totalAlreadyCard: number;
  wardMarkers: number;
  wardInstalled: number;
  wardApprovedLines: number;
}
