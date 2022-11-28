import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MapService } from "../services/map/map.service";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-surveyor-assignment-test',
  templateUrl: './surveyor-assignment-test.component.html',
  styleUrls: ['./surveyor-assignment-test.component.scss']
})
export class SurveyorAssignmentTestComponent implements OnInit {

  constructor(private router: Router, public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal, private mapService: MapService) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  yearList: any[] = [];
  assignedList: any[] = [];
  surveyorList: any[] = [];
  surveyorSummaryList: any[] = [];
  userId: any;
  WardList: any[] = [];
  vehicleAllList: any[] = [];
  totalLiters: any = 0;
  totalAmount: any = 0;
  cityName: any;
  zoneList: any[];
  dbPath: any;
  userList: any[];
  lineList: any[];
  lineMarkerList: any[];
  isFirst = true;
  houseData: houseDatail = {
    days: "0",
    cards: "0",
    houses: "0",
    name: "",
    wardNo: "",
    average: "0",
    lastUpdate: "---",
    totalCards: "0",
    totalHouses: "0"
  };
  db: any;
  divLoader = "#divLoader";
  totalHouses: any;
  totalCards: any;
  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.getLastUpdate();
    this.getZoneList();
    this.getAssignedList();
  }

  getLastUpdate() {
    let dbPath = "EntitySurveyData/SurveyorSurveySummary/Summary";
    let lastUpdateInstance = this.db.object(dbPath).valueChanges().subscribe(
      summaryData => {
        lastUpdateInstance.unsubscribe();
        if (summaryData != null) {
          this.houseData.lastUpdate = summaryData["lastUpdate"];
          this.houseData.totalCards = summaryData["cards"];
          this.houseData.totalHouses = summaryData["houses"];
        }
      }
    );
  }

  updateSurveyorSummary() {
    $(this.divLoader).show();
    this.totalCards = 0;
    this.totalHouses = 0;
    let dbPath = "Houses";
    let housesInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        housesInstance.unsubscribe();
        if (houseData != null) {
          let keyArray = Object.keys(houseData);
          if (keyArray.length > 0) {
            this.updateSummaryCounts(0, keyArray, houseData);
          }
        }
      }
    );
  }

  updateSummaryCounts(index: any, keyArray: any, houseData: any) {
    if (index == keyArray.length) {
      this.surveyorSummaryList = this.commonService.transformNumeric(this.surveyorSummaryList, "surveyorId");
      for (let i = 0; i < this.surveyorSummaryList.length; i++) {
        let surveyorId = this.surveyorSummaryList[i]["surveyorId"];
        let surveyDate = this.surveyorSummaryList[i]["surveyDate"];
        const data = {
          cardCount: this.surveyorSummaryList[i]["cardCount"],
          cards: this.surveyorSummaryList[i]["cards"],
          complexCount: this.surveyorSummaryList[i]["complexCount"],
          houseCount: this.surveyorSummaryList[i]["houseCount"],
          housesInComplex: this.surveyorSummaryList[i]["housesInComplex"]
        }
        let dbPath = "EntitySurveyData/SurveyorSurveySummary/" + surveyorId + "/" + surveyDate;
        this.db.object(dbPath).update(data);
      }
      let date = this.commonService.setTodayDate();
      let time = new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1];
      let lastUpdate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time;
      const data = {
        lastUpdate: lastUpdate,
        cards: this.totalCards,
        houses: this.totalHouses
      }
      let dbPath = "EntitySurveyData/SurveyorSurveySummary/Summary";
      this.db.object(dbPath).update(data);
      this.houseData.lastUpdate = lastUpdate;
      this.houseData.totalCards = this.totalCards;
      this.houseData.totalHouses = this.totalHouses;
      this.commonService.setAlertMessage("success", "Data update successfully !!!");
      $(this.divLoader).hide();
    }
    else {
      let zoneNo = keyArray[index];
      let zoneData = houseData[zoneNo];
      let lineArray = Object.keys(zoneData);
      if (lineArray.length > 0) {
        for (let i = 0; i < lineArray.length; i++) {
          let lineNo = lineArray[i];
          let cardData = zoneData[lineNo];
          let cardArray = Object.keys(cardData);
          if (cardArray.length > 0) {
            for (let j = 0; j < cardArray.length; j++) {
              let cardNo = cardArray[j];
             // if (cardData[cardNo]["houseType"] != null) {
               // if (cardData[cardNo]["surveyorId"] != null) {
                  let surveyorId = cardData[cardNo]["surveyorId"];
                  let houseType = cardData[cardNo]["houseType"];
                  console.log(zoneNo+" , "+lineNo+" , "+cardNo);
                  if (cardData[cardNo]["createdDate"] != null) {
                    this.totalCards++;
                    let cardCount = 1;
                    let houseCount = 0;
                    let complexCount = 0;
                    let housesInComplex = 0;
                    let surveyDate = cardData[cardNo]["createdDate"].split(" ")[0];
                    let list = surveyDate.toString().split('-');
                    surveyDate = list[2] + "-" + list[1] + "-" + list[0];
                    if (houseType == "19" || houseType == "20") {
                      complexCount = 1;
                      let servingCount = parseInt(cardData[cardNo]["servingCount"]);
                      if (isNaN(servingCount)) {
                        servingCount = 1;
                      }
                      housesInComplex = servingCount;
                      houseCount = servingCount;
                    }
                    else {
                      houseCount = 1;
                    }
                    this.totalHouses += Number(houseCount);
                    if (this.surveyorSummaryList.length == 0) {
                      this.surveyorSummaryList.push({ surveyorId: surveyorId, surveyDate: surveyDate, cardCount: cardCount, houseCount: houseCount, complexCount: complexCount, housesInComplex: housesInComplex, cards: cardNo });
                    }
                    else {
                      let summaryDetail = this.surveyorSummaryList.find(item => item.surveyorId == surveyorId && item.surveyDate == surveyDate);
                      if (summaryDetail != undefined) {
                        summaryDetail.cardCount = Number(summaryDetail.cardCount) + Number(cardCount);
                        summaryDetail.houseCount = Number(summaryDetail.houseCount) + Number(houseCount);
                        summaryDetail.complexCount = Number(summaryDetail.complexCount) + Number(complexCount);
                        summaryDetail.housesInComplex = Number(summaryDetail.housesInComplex) + Number(housesInComplex);
                        summaryDetail.cards = summaryDetail.cards + "," + cardNo;
                      }
                      else {
                        this.surveyorSummaryList.push({ surveyorId: surveyorId, surveyDate: surveyDate, cardCount: cardCount, houseCount: houseCount, complexCount: complexCount, housesInComplex: housesInComplex, cards: cardNo });
                      }
                    }
                  }
                //}
             // }
            }
          }
        }
      }
      index++;
      this.updateSummaryCounts(index, keyArray, houseData);
    }
  }

  //#region serveyor detail

  setActiveClass(index: any) {
    for (let i = 0; i < this.assignedList.length; i++) {
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

  getServeyorDetail(userId: any, index: any) {
    if (this.isFirst == false) {
      this.setActiveClass(index);
    } else {
      this.isFirst = false;
    }
    this.houseData.days = "0";
    this.houseData.cards = "0";
    this.houseData.houses = "0";
    this.houseData.average = "0";
    this.lineMarkerList = [];

    let userDetail = this.assignedList.find((item) => item.userId == userId);
    if (userDetail != undefined) {
      this.houseData.name = userDetail.name;
      this.houseData.wardNo = userDetail.wardNo;
      let dbPath = "EntitySurveyData/SurveyorSurveySummary/" + userId;
      let summaryInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          summaryInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let key = keyArray[i];
                let dateOrder = new Date(key.split('-')[2] + "-" + key.split('-')[1] + "-" + key.split('-')[0]);
                let date = key.split('-')[0] + " " + this.commonService.getCurrentMonthShortName(Number(key.split('-')[1])) + " " + key.split('-')[2];
                this.lineMarkerList.push({ date: date, surveyed: data[key]["cardCount"], houses: data[key]["houseCount"], complex: data[key]["complexCount"], houseHold: data[key]["housesInComplex"], dateOrder: dateOrder });
              }
              this.lineMarkerList = this.lineMarkerList.sort((a, b) =>
                b.dateOrder > a.dateOrder ? 1 : -1
              );
              this.getSummary();
            }
          }
        }
      );
    }
  }

  getSummary() {
    if (this.lineMarkerList.length > 0) {
      let surved = 0;
      let revisit = 0;
      let rfid = 0;
      let houses = 0;
      for (let i = 0; i < this.lineMarkerList.length; i++) {
        if (this.lineMarkerList[i]["surveyed"] != null) {
          surved = surved + Number(this.lineMarkerList[i]["surveyed"]);
        }
        if (this.lineMarkerList[i]["houses"] != null) {
          houses = houses + Number(this.lineMarkerList[i]["houses"]);
        }
        this.houseData.houses = houses.toString();
        this.houseData.cards = surved.toString();
        this.houseData.days = this.lineMarkerList.length.toString();
        this.houseData.average = ((surved + revisit + rfid) / this.lineMarkerList.length).toFixed(2);
      }
    }
  }

  //#endregion

  //#region  List Detail

  getAssignedList() {
    this.assignedList = [];
    this.surveyorList = [];
    this.userList = [];
    this.dbPath = "Surveyors";
    let userInstance = this.db.object(this.dbPath).valueChanges().subscribe((data) => {
      userInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length - 1; i++) {
            let index = keyArray[i];
            let name = data[index]["name"];
            let loginId = data[index]["pin"];
            let isLogin = "no";
            if (data[index]["isLogin"] != null) {
              isLogin = data[index]["isLogin"];
            }
            let joiningDate = data[index]["joining-date"].split('-')[2] + "-" + data[index]["joining-date"].split('-')[1] + "-" + data[index]["joining-date"].split('-')[0];
            let isActive = false;
            if (data[index]["status"] == "2") {
              isActive = true;
            }

            if (data[index]["surveyor-type"] == "Surveyor") {
              this.dbPath = "SurveyorsCuurentAssignment/" + index;
              let assignInstance = this.db.object(this.dbPath).valueChanges().subscribe((dataSurvey) => {
                assignInstance.unsubscribe();
                if (dataSurvey != null) {
                  let linelist = dataSurvey["line"].split(',');
                  let lines = "";
                  if (linelist.length > 0) {
                    for (let l = 0; l < linelist.length; l++) {
                      if (lines == "") {
                        lines = linelist[l];
                      }
                      else {
                        lines = lines + ", " + linelist[l];
                      }
                    }
                  }
                  this.surveyorList.push({ userId: index, name: name, isLogin: isLogin, joiningDate: joiningDate, wardNo: dataSurvey["ward"], lines: lines, loginId: loginId, isActive: isActive });
                  if (isActive == true) {
                    this.assignedList.push({ userId: index, name: name, isLogin: isLogin, joiningDate: joiningDate, wardNo: dataSurvey["ward"], lines: lines, loginId: loginId, isActive: isActive });
                  }
                } else {
                  this.surveyorList.push({ userId: index, name: name, isLogin: isLogin, joiningDate: joiningDate, wardNo: "", lines: "", loginId: loginId, isActive: isActive });
                  if (isActive == true) {
                    this.assignedList.push({ userId: index, name: name, isLogin: isLogin, joiningDate: joiningDate, wardNo: "", lines: "", loginId: loginId, isActive: isActive });
                  }
                }
                this.surveyorList = this.commonService.transformNumeric(this.surveyorList, "name");
                this.assignedList = this.commonService.transformNumeric(this.assignedList, "name");
              });
            }
          }
          setTimeout(() => {
            $("#tr0").addClass("active");
            this.getServeyorDetail(this.assignedList[0]["userId"], 0);
          }, 2000);
        }
      }
    });
  }

  updateLoginStatus(userId: any) {
    let dbPath = "Surveyors/" + userId
    let detail = this.assignedList.find((item) => item.userId == userId);

    if (detail != undefined) {
      if (detail.isLogin == "yes") {
        detail.isLogin = "no"
        this.db.object(dbPath).update({ isLogin: 'no' });

      } else {
        detail.isLogin = "yes"
        this.db.object(dbPath).update({ isLogin: 'yes' });
      }
    }


  }
  showAll() {
    this.assignedList = [];
    let element = <HTMLInputElement>document.getElementById("chkAll");
    if (element.checked == true) {
      this.assignedList = this.surveyorList;
    }
    else {
      this.assignedList = this.surveyorList.filter((item) => item.isActive == true);
    }
    setTimeout(() => {
      $("#tr0").addClass("active");
      this.getServeyorDetail(this.assignedList[0]["userId"], 0);
    }, 1000);
  }

  getLines(wardNo: any) {
    this.lineList = [];
    if (wardNo == "0") {
      this.commonService.setAlertMessage("error", "Plese select ward !!!");
      return;
    }
    this.dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "";
    let lineInstance = this.db.object(this.dbPath).valueChanges().subscribe((data) => {
      lineInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (data[index]["ApproveStatus"] != null) {
              if (data[index]["ApproveStatus"]["status"] == "Confirm") {
                this.lineList.push({ lineNo: index, isChecked: 0 });
              }
            }
          }
        }
      }
    });
  }

  saveAssignment() {
    let wardNo = $("#ddlWard").val();
    let userId = $("#key").val();
    let name = "";
    let lines = "";
    if (wardNo == "0") {
      this.commonService.setAlertMessage("error", "Plese select ward !!!");
      return;
    }

    let userDetail = this.assignedList.find((item) => item.userId == userId);
    if (userDetail != undefined) {
      name = userDetail.name;
    }
    let isChecked = false;
    if (this.lineList.length > 0) {
      for (let i = 0; i < this.lineList.length; i++) {
        let lineNo = this.lineList[i]["lineNo"];
        let chk = "chk" + lineNo;
        let element = <HTMLInputElement>document.getElementById(chk);
        if (element.checked == true) {
          isChecked = true;
          if (lines != "") {
            lines = lines + ",";
          }
          lines = lines + lineNo;
        }
      }
      if (isChecked == false) {
        this.commonService.setAlertMessage("error", "Plese select at least one line !!!");
        return;
      }
      const data = {
        line: lines,
        name: name,
        ward: wardNo,
      };
      this.dbPath = "SurveyorsCuurentAssignment/" + userId;
      this.db.object(this.dbPath).update(data);
      this.lineList = [];
      this.commonService.setAlertMessage("success", "Lines assigned successfully !!");
      let userDetail = this.assignedList.find((item) => item.userId == userId);
      if (userDetail != undefined) {
        userDetail.wardNo = wardNo;
        userDetail.lines = lines;
      }
      this.closeModel();
    }
  }

  deleteEntry(userId: any) {
    this.dbPath = "SurveyorsCuurentAssignment/" + userId;
    const data = { line: null, name: null, ward: null };
    this.db.object(this.dbPath).update(data);
    let userDetail = this.assignedList.find((item) => item.userId == userId);
    if (userDetail != undefined) {
      userDetail.wardNo = "";
      userDetail.lines = "";
    }
    this.commonService.setAlertMessage("success", "Lines assigned removed !!");
    this.closeModel();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = JSON.parse(localStorage.getItem("markingWards"));
  }

  openModel(content: any, id: any, type: any) {
    this.lineList = [];
    if (type == "update") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 500;
      let width = 450;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#key").val(id);
        setTimeout(() => {
          let listDetail = this.assignedList.find((item) => item.userId == id);
          if (listDetail != undefined) {
            if (listDetail.wardNo != "") {
              $("#ddlWard").val(listDetail.wardNo);
              let lines = listDetail.lines.split(",");
              this.getLines(listDetail.wardNo);
              setTimeout(() => {
                if (lines.length > 0) {
                  for (let i = 0; i < lines.length; i++) {
                    let lineDetail = this.lineList.find(
                      (item) => item.lineNo == lines[i].trim()
                    );
                    if (lineDetail != undefined) {
                      let chk = "chk" + lineDetail.lineNo;
                      (<HTMLInputElement>document.getElementById(chk)).checked =
                        true;
                    }
                  }
                }
              }, 600);
            }
          }
        }, 100);
      }
    } else {
      let listDetail = this.assignedList.find((item) => item.userId == id);
      if (listDetail != undefined) {
        if (listDetail.wardNo == "") {
          this.commonService.setAlertMessage("error", "No assignment found!!!");
          return;
        }
      }
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 170;
      let width = 450;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        $("#deleteId").val(id);
      }
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  confirmDelete() {
    let id = $("#deleteId").val();
    this.deleteEntry(id);
  }


}


export class houseDatail {
  days: string;
  cards: string;
  houses: string;
  name: string;
  wardNo: string;
  average: string;
  lastUpdate: string;
  totalCards: string;
  totalHouses: string;
}
