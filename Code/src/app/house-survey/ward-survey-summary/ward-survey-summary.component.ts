import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-ward-survey-summary",
  templateUrl: "./ward-survey-summary.component.html",
  styleUrls: ["./ward-survey-summary.component.scss"],
})
export class WardSurveySummaryComponent implements OnInit {
  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal) { }

  selectedCircle: any;
  wardList: any[];
  wardProgressList: any[];
  lineSurveyList: any[];
  surveyedDetailList: any[];
  surveyDateList: any[];
  wardLineCount: any;
  cityName: any;
  isFirst = true;
  wardCheckList: any[] = [];
  houseTypeList: any[] = [];
  zoneHouseTypeList: any[];
  db: any;
  selectedWard: any;
  surveyData: surveyDatail = {
    totalLines: 0,
    totalMarkers: 0,
    totalSurveyed: 0,
    totalRevisit: 0,
    totalOldCards: 0,
    wardMarkers: 0,
    wardSurveyed: 0,
    wardRevisit: 0,
    wardAlreadyCard: 0,
    wardOldCards: 0,
    wardNameNotCorrect: 0
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.getHouseType();
    this.getWardProgressList();
  }


  getHouseType() {
    let dbPath = "Defaults/FinalHousesType";
    let houseTypeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        houseTypeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let id = keyArray[i];
            let houseType = data[id]["name"].toString().split("(")[0];
            this.houseTypeList.push({ id: id, houseType: houseType });
          }
        }
      }
    );

  }

  clearAll() {
    this.wardProgressList = [];
    this.lineSurveyList = [];
    this.surveyData.totalMarkers = 0;
    this.surveyData.totalSurveyed = 0;
    this.surveyData.totalRevisit = 0;
  }

  getWardProgressList() {
    this.wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.wardProgressList = [];
    if (this.wardList.length > 0) {
      for (let i = 0; i < this.wardList.length; i++) {
        let wardNo = this.wardList[i]["zoneNo"];
        this.wardProgressList.push({ wardNo: wardNo, markers: 0, surveyed: 0, revisit: 0, oldCard: 0, status: "", already: 0, nameNotCorrect: 0 });
        if (i == 1) {
          setTimeout(() => {
            this.getSurveyDetail(wardNo, 1);
            $("#tr1").addClass("active");
          }, 4000);
        }
        this.getWardSummary(i, wardNo);
      }
    }
  }

  getWardSummary(index: any, wardNo: any) {
    let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/marked";
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      markerInstance.unsubscribe();
      if (data != null) {
        this.wardProgressList[index]["markers"] = Number(data);
        this.surveyData.totalMarkers = this.surveyData.totalMarkers + Number(data);
        dbPath = "EntitySurveyData/TotalHouseCount/" + wardNo;
        let surveyedInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
          surveyedInstance.unsubscribe();
          if (data != null) {
            this.wardProgressList[index]["surveyed"] = Number(data);
            this.surveyData.totalSurveyed = this.surveyData.totalSurveyed + Number(data);
            this.wardProgressList[index]["status"] = "In Progress";
            if (Number(this.wardProgressList[index]["markers"]) == Number(data)) {
              this.wardProgressList[index]["status"] = "Survey Done";
            }
          }
        });
      }
    });

    dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/alreadyInstalled";
    let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      alreadyInstance.unsubscribe();
      if (data != null) {
        this.wardProgressList[index]["already"] = Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalRevisitRequest/" + wardNo;
    let revisitInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      revisitInstance.unsubscribe();
      if (data != null) {
        this.wardProgressList[index]["revisit"] = Number(data);
        this.surveyData.totalRevisit = this.surveyData.totalRevisit + Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalRfidNotFoundCount/" + wardNo;
    let oldCardInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      oldCardInstance.unsubscribe();
      if (data != null) {
        this.wardProgressList[index]["oldCard"] = Number(data);
        this.surveyData.totalOldCards = this.surveyData.totalOldCards + Number(data);
      }
    });

    let wardNameNotCorrectList = JSON.parse(localStorage.getItem("wardNameNotCorrectList"));
    if (wardNameNotCorrectList != null) {
      let wardNameDetail = wardNameNotCorrectList.find(item => item.wardNo == wardNo);
      if (wardNameDetail != undefined) {
        this.wardProgressList[index]["nameNotCorrect"] = wardNameDetail.count;
      }
    }
  }

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

  clearWardDetailData() {
    this.wardLineCount = 0;
    this.surveyData.totalLines = 0;
    this.surveyData.wardMarkers = 0;
    this.surveyData.wardRevisit = 0;
    this.surveyData.wardSurveyed = 0;
    this.surveyData.wardAlreadyCard = 0;
    this.surveyData.wardOldCards = 0;
    this.surveyData.wardNameNotCorrect = 0;
    this.lineSurveyList = [];
  }

  getSurveyDetail(wardNo: any, listIndex: any) {
    this.clearWardDetailData();
    this.selectedWard = wardNo;
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 1000);

    if (this.isFirst == false) {
      this.setActiveClass(listIndex);
    } else {
      this.isFirst = false;
    }

    this.commonService.getWardLine(wardNo, this.commonService.setTodayDate()).then((data: any) => {
      let wardLines = JSON.parse(data);
      let lineCount = Number(wardLines["totalLines"]);
      if (lineCount != undefined) {
        this.wardLineCount = Number(lineCount);
        this.surveyData.totalLines = this.wardLineCount;
        let wardSummary = this.wardProgressList.find(item => item.wardNo == wardNo);
        if (wardSummary != undefined) {
          this.surveyData.wardMarkers = wardSummary.markers;
          this.surveyData.wardRevisit = wardSummary.revisit;
          this.surveyData.wardSurveyed = wardSummary.surveyed;
          this.surveyData.wardAlreadyCard = wardSummary.already;
          this.surveyData.wardOldCards = wardSummary.oldCard;
          this.surveyData.wardNameNotCorrect = wardSummary.nameNotCorrect;
        }
        for (let i = 1; i <= this.wardLineCount; i++) {
          this.lineSurveyList.push({ lineNo: i, markers: 0, alreadyCard: 0, survyed: 0, oldCard: 0, revisit: 0, wardNo: wardNo });
          let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i + "/marksCount";
          let marksCountInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              marksCountInstance.unsubscribe();
              if (data != null) {
                let lineDetail = this.lineSurveyList.find(item => item.lineNo == i);
                if (lineDetail != undefined) {
                  lineDetail.markers = Number(data);
                }
              }
            }
          );

          dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i + "/surveyedCount";
          let survedInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              survedInstance.unsubscribe();
              if (data != null) {
                let lineDetail = this.lineSurveyList.find(item => item.lineNo == i);
                if (lineDetail != undefined) {
                  lineDetail.survyed = Number(data);
                }
              }
            }
          );

          dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i + "/lineRevisitCount";
          let revisitInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              revisitInstance.unsubscribe();
              if (data != null) {
                let lineDetail = this.lineSurveyList.find(item => item.lineNo == i);
                if (lineDetail != undefined) {
                  lineDetail.revisit = Number(data);
                }
              }
            }
          );

          dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i + "/lineRfidNotFoundCount";
          let oldCardInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              oldCardInstance.unsubscribe();
              if (data != null) {
                let lineDetail = this.lineSurveyList.find(item => item.lineNo == i);
                if (lineDetail != undefined) {
                  lineDetail.oldCard = Number(data);
                }
              }
            }
          );

          dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i + "/alreadyInstalledCount";
          let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe(
            alreadyData => {
              alreadyInstance.unsubscribe();
              if (alreadyData != null) {
                let lineDetail = this.lineSurveyList.find(item => item.lineNo == i);
                if (lineDetail != undefined) {
                  lineDetail.alreadyCard = Number(alreadyData);
                }
              }
            }
          );
        }
      }

    });


  }

  getNameNotCorrect() {
    let nameNotCorrectCount = 0;
    for (let i = 1; i <= this.wardLineCount; i++) {
      let dbPath = "Houses/" + this.selectedWard + "/" + i;
      let wardNameInstance = this.db.list(dbPath).valueChanges().subscribe(
        data => {
          wardNameInstance.unsubscribe();
          if (data.length > 0) {
            for (let j = 0; j < data.length; j++) {
              if (data[j]["isNameCorrect"] == null) {
                nameNotCorrectCount = nameNotCorrectCount + 1;
              }
              else if (data[j]["isNameCorrect"] != "yes") {
                nameNotCorrectCount = nameNotCorrectCount + 1;
              }
            }
            this.surveyData.wardNameNotCorrect = nameNotCorrectCount;
          }
        }
      );
    }
    setTimeout(() => {
      let wardSummary = this.wardProgressList.find(item => item.wardNo == this.selectedWard);
      if (wardSummary != undefined) {
        wardSummary.nameNotCorrect = nameNotCorrectCount;
        this.setWardNameNotCorrectList(this.selectedWard, nameNotCorrectCount);
      }
    }, 1000);
  }

  setWardNameNotCorrectList(ward: any, count: any) {
    let wardNameNotCorrectList = JSON.parse(localStorage.getItem("wardNameNotCorrectList"));
    if (wardNameNotCorrectList == null) {
      wardNameNotCorrectList = [];
      wardNameNotCorrectList.push({ wardNo: ward, count: count });
      localStorage.setItem("wardNameNotCorrectList", JSON.stringify(wardNameNotCorrectList));
    }
    else {
      let wardSummary = this.wardProgressList.find(item => item.wardNo == this.selectedWard);
      if (wardSummary != undefined) {
        let wardNameDetail = wardNameNotCorrectList.find(item => item.wardNo == this.selectedWard);
        if (wardNameDetail != undefined) {
          wardNameDetail.count = count;
        }
        else {
          wardNameNotCorrectList.push({ wardNo: ward, count: count });
        }
        localStorage.setItem("wardNameNotCorrectList", JSON.stringify(wardNameNotCorrectList));
      }
    }
  }

  showLineDetail(content: any, wardNo: any, lineNo: any) {
    this.surveyedDetailList = [];
    this.getLineDetail(wardNo, lineNo);
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

  closeModel() {
    this.modalService.dismissAll();
  }

  getLineDetail(wardNo: any, lineNo: any) {
    let dbPath = "Houses/" + wardNo + "/" + lineNo;
    let lineDetailInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        lineDetailInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            if (data[i]["latLng"] != null) {
              let imageName = data[i]["cardImage"];
              let city = this.commonService.getFireStoreCity();
              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyCardImage%2F" + imageName + "?alt=media";
              this.surveyedDetailList.push({ cardType: data[i]["cardType"], cardNo: data[i]["cardNo"], imageUrl: imageUrl, name: data[i]["name"] });
            }
          }
        }
      }
    );
  }

  showDateWiseDetail(content: any, type: any) {
    this.surveyDateList = [];
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = 870;
    let width = 400;
    height = (windowHeight * 90) / 100;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    let divHeight = height - 50 + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", marginTop);
    $("#tblSurvey").css("height", divHeight);
    $('#surveyType').html(type);
    if (type == "RFID Not Matched") {
      this.getRFIDNotFound();
    }
    else if (type == "Revisit Requests") {
      this.getRevisitRequests();
    }
    else {
      this.getHouses();
    }
  }

  getHouses() {
    let dateList = [];
    let dbPath = "EntitySurveyData/DailyHouseCount";
    let surveyedInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        surveyedInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let obj = data[i];
            let keyArray = Object.keys(obj);
            for (let j = 0; j < keyArray.length; j++) {
              let index = keyArray[j];
              let objDate = obj[index];
              let keyDateArray = Object.keys(objDate);
              for (let k = 0; k < keyDateArray.length; k++) {
                let dateDetail = dateList.find(item => item.date == keyDateArray[k]);
                if (dateDetail != undefined) {
                  dateDetail.count = Number(dateDetail.count) + Number(objDate[keyDateArray[k]]);
                }
                else {
                  if (objDate[keyDateArray[k]] > 0) {
                    let date = new Date(keyDateArray[k].split('-')[2] + "-" + keyDateArray[k].split('-')[1] + "-" + keyDateArray[k].split('-')[0]);
                    dateList.push({ date: keyDateArray[k], count: objDate[keyDateArray[k]], dateOrder: date });
                  }
                }
              }
            }
          }
          this.surveyDateList = dateList.sort((a, b) =>
            b.dateOrder > a.dateOrder ? 1 : -1
          );
        }
      }
    );
  }

  getRevisitRequests() {
    let dateList = [];
    let dbPath = "EntitySurveyData/DailyRevisitRequestCount";
    let revisitInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        revisitInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let obj = data[i];
            let keyArray = Object.keys(obj);
            for (let j = 0; j < keyArray.length; j++) {
              let index = keyArray[j];
              let objDate = obj[index];
              let keyDateArray = Object.keys(objDate);
              for (let k = 0; k < keyDateArray.length; k++) {
                let dateDetail = dateList.find(item => item.date == keyDateArray[k]);
                if (dateDetail != undefined) {
                  dateDetail.count = Number(dateDetail.count) + Number(objDate[keyDateArray[k]]);
                }
                else {
                  if (objDate[keyDateArray[k]] > 0) {
                    let date = new Date(keyDateArray[k].split('-')[2] + "-" + keyDateArray[k].split('-')[1] + "-" + keyDateArray[k].split('-')[0]);
                    dateList.push({ date: keyDateArray[k], count: objDate[keyDateArray[k]], dateOrder: date });
                  }
                }
              }
            }
          }
          this.surveyDateList = dateList.sort((a, b) =>
            b.dateOrder > a.dateOrder ? 1 : -1
          );
        }
      }
    );
  }

  getRFIDNotFound() {
    let dateList = [];
    let dbPath = "EntitySurveyData/DailyRfidNotFoundCount";
    let rfidInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        rfidInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let obj = data[i];
            let keyArray = Object.keys(obj);
            for (let j = 0; j < keyArray.length; j++) {
              let index = keyArray[j];
              let objDate = obj[index];
              let keyDateArray = Object.keys(objDate);
              for (let k = 0; k < keyDateArray.length; k++) {
                let dateDetail = dateList.find(item => item.date == keyDateArray[k]);
                if (dateDetail != undefined) {
                  dateDetail.count = Number(dateDetail.count) + Number(objDate[keyDateArray[k]]);
                }
                else {
                  if (objDate[keyDateArray[k]] > 0) {
                    let date = new Date(keyDateArray[k].split('-')[2] + "-" + keyDateArray[k].split('-')[1] + "-" + keyDateArray[k].split('-')[0]);
                    dateList.push({ date: keyDateArray[k], count: objDate[keyDateArray[k]], dateOrder: date });
                  }
                }
              }
            }
          }
          this.surveyDateList = dateList.sort((a, b) =>
            b.dateOrder > a.dateOrder ? 1 : -1
          );
        }
      }
    );
  }


  getZoneHouseTypeList(content: any) {
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
    let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedWard;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        if (markerData == null) {
          this.closeModel();
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
                    let count = 0;
                    if (lineData[markerNo]["cardNumber"] != null) {
                      count = 1;
                    }
                    this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: count });
                  }
                  else {
                    let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseTypeId);
                    if (listDetail != undefined) {
                      if (lineData[markerNo]["cardNumber"] != null) {
                        listDetail.counts = listDetail.counts + 1;
                      }
                    }
                    else {
                      let count = 0;
                      if (lineData[markerNo]["cardNumber"] != null) {
                        count = 1;
                      }
                      this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: count });
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
      let fileName = "Ward-" + this.selectedWard + "-EntityTypes.xlsx";
      if (type == "1") {
        fileName = "All-Ward-EntityTypes.xlsx";
      }
      this.commonService.exportExcel(htmlString, fileName);
      $('#divLoaderMain').hide();
    }
    else {
      this.commonService.setAlertMessage("error", "No Survey data found !!!");
      $('#divLoaderMain').hide();
    }
  }

  getAllZoneHouseTypeList() {
    this.zoneHouseTypeList = [];
    if (this.wardProgressList.length > 0) {
      $('#divLoaderMain').show();
      let zoneNo = this.wardProgressList[1]["wardNo"];
      this.getZoneHouseType(zoneNo, 0);
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
                      let count = 0;
                      if (lineData[markerNo]["cardNumber"] != null) {
                        count = 1;
                      }
                      this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: count });
                    }
                    else {
                      let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseTypeId);
                      if (listDetail != undefined) {
                        if (lineData[markerNo]["cardNumber"] != null) {
                          listDetail.counts = listDetail.counts + 1;
                        }
                      }
                      else {
                        let count = 0;
                        if (lineData[markerNo]["cardNumber"] != null) {
                          count = 1;
                        }
                        this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: count });
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
}

export class surveyDatail {
  totalLines: number;
  totalMarkers: number;
  totalSurveyed: number;
  totalRevisit: number;
  totalOldCards: number;
  wardMarkers: number;
  wardSurveyed: number;
  wardRevisit: number;
  wardAlreadyCard: number;
  wardOldCards: number;
  wardNameNotCorrect: number;
}
