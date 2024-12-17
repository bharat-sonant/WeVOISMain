import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: "app-ward-survey-summary",
  templateUrl: "./ward-survey-summary.component.html",
  styleUrls: ["./ward-survey-summary.component.scss"],
})
export class WardSurveySummaryComponent implements OnInit {
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, public httpService: HttpClient, private commonService: CommonService, private modalService: NgbModal) { }

  selectedCircle: any;
  wardList: any[];
  wardProgressList: any[];
  lineSurveyList: any[];
  surveyedDetailList: any[];
  surveyDateList: any[];
  dateSummaryList: any[] = [];
  surveyorList: any[];
  wardLineCount: any;
  cityName: any;
  isFirst = true;
  wardCheckList: any[] = [];
  houseTypeList: any[] = [];
  zoneHouseTypeList: any[];
  entityList: any[] = [];
  employeeSurvey: any[] = [];
  db: any;
  selectedWard: any;
  public isAlreadyShow = false;
  divEntityList = "#divEntityList";
  divLoaderMain = "#divLoaderMain";
  divLoaderCounts = "#divLoaderCounts";
  ddlZone = "#ddlZone";
  divHouseType = "#divHouseType";
  houseWardNo = "#houseWardNo";
  houseLineNo = "#houseLineNo";
  houseIndex = "#houseIndex";
  ddlHouseType = "#ddlHouseType";
  txtServingCount = "#txtServingCount";
  divServingCount = "#divServingCount";
  serviceName = "survey-summary";
  surveyData: surveyDatail = {
    totalLines: 0,
    totalMarkers: 0,
    totalSurveyed: 0,
    totalRevisit: 0,
    totalOldCards: 0,
    totalHouses: 0,
    totalResidential: 0,
    totalCommercial: 0,
    wardMarkers: 0,
    wardSurveyed: 0,
    wardRevisit: 0,
    wardAlreadyCard: 0,
    wardOldCards: 0,
    wardNameNotCorrect: 0,
    lastUpdate: ''
  };
  cardHousesList: any[];
  lineuptoLoop: any;
  wardLineMarkerImageList: any[] = [];
  isActionShow: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("Survey-Management", "Survey-Summary", localStorage.getItem("userID"));
    this.isActionShow = true;
    if (this.cityName == "jaipur-malviyanagar" || this.cityName == "jaipur-murlipura") {
      this.isActionShow = false;
    }

    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.showHideAlreadyCardInstalled();
    this.getLastUpdate();
    this.getHouseType();
    this.getSurveyorList();
    this.getWardProgressList();
    //this.checkWithCardWardMapping();
  }

  getLastUpdate() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLastUpdate");
    let dbPath = "EntitySurveyData/surveySummarylastUpdate";
    let lastUpdateInstance = this.db.object(dbPath).valueChanges().subscribe(
      lastUpdateData => {
        lastUpdateInstance.unsubscribe();
        if (lastUpdateData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLastUpdate", lastUpdateData);
          this.surveyData.lastUpdate = lastUpdateData;
        }
      }
    );
  }

  getSurveyorList() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getSurveyorList");
    this.surveyorList = [];
    let surveyorInstance = this.db.object("Surveyors/").valueChanges().subscribe(
      surveyorData => {
        surveyorInstance.unsubscribe();
        if (surveyorData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getSurveyorList", surveyorData);
          let keyArray = Object.keys(surveyorData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let surveyorId = keyArray[i];
              let name = surveyorData[surveyorId]["name"];
              this.surveyorList.push({ surveyorId: surveyorId, name: name });
            }
          }
        }
      }
    );
  }

  duplicateHouseCardList: any[] = [];

  updateSurveyCounts() {
    $(this.divLoaderCounts).show();
    this.employeeSurvey = [];
    this.dateSummaryList = [];
    this.wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.lineuptoLoop = this.wardList.length;
    this.updateCounts_Bharat(1);
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

  clearAll() {
    this.wardProgressList = [];
    this.lineSurveyList = [];
    this.surveyData.totalMarkers = 0;
    this.surveyData.totalSurveyed = 0;
    this.surveyData.totalRevisit = 0;
    this.surveyData.totalHouses = 0;
    this.surveyData.totalResidential = 0;
    this.surveyData.totalCommercial = 0;
  }

  openExportHouseData(content: any) {
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

  cardNumberList: any[] = [];

  checkWithCardWardMapping() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "checkWithCardWardMapping");
    let dbPath = "CardWardMapping";
    let houseinstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        houseinstance.unsubscribe();
        let htmlString = "<table>";
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "CardNo";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Zone No";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Line No";
        htmlString += "</td>";
        htmlString += "</tr>";

        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "checkWithCardWardMapping", data);
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let cardNo = keyArray[i];
            // let lineNo=data[cardNo]["line"];
            //let zoneNo=data[cardNo]["ward"];
            // let dbPath="Houses/"+zoneNo+"/"+lineNo+"/"+cardNo;
            //console.log(dbPath);
            // let instance=this.db.object(dbPath).valueChanges().subscribe(
            //  houseData=>{
            //    instance.unsubscribe();
            //    if(houseData==null){
            //      dbPath="Houses/"+zoneNo+"/"+lineNo+"/"+cardNo;
            //      this.db.object(dbPath).remove();
            //      console.log(cardNo);
            //    }
            //  }
            //)

            //console.log(cardNo);
            let detail = this.cardNumberList.find(item => item.cardNo == cardNo);
            if (detail == undefined) {
              //console.log(cardNo);
              htmlString += "<tr>";
              htmlString += "<td>";
              htmlString += cardNo;
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += data[cardNo]["ward"];
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += data[cardNo]["line"];
              htmlString += "</td>";
              htmlString += "</tr>";
            }
          }
        }
        htmlString += "</table>";
        // console.log(htmlString);
        this.commonService.exportExcel(htmlString, "CardWardMappingNotInMArkedHouses.xlsx");



      }
    );
  }

  updateCounts_Bharat(index: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateCounts_Bharat");
    if (index == this.wardList.length) {
      let date = this.commonService.setTodayDate();
      let time = new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1];
      let lastUpdate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time;
      let dbPath = "EntitySurveyData/";
      this.db.object(dbPath).update({ surveySummarylastUpdate: lastUpdate });
      if (this.dateSummaryList.length > 0) {
        let dbPath = "EntitySurveyData/DailyHouseCount/";
        this.db.object(dbPath).remove();

      }

      setTimeout(() => {
        for (let i = 0; i < this.dateSummaryList.length; i++) {
          let surveyorId = this.dateSummaryList[i]["surveyorId"];
          let surveyDate = this.dateSummaryList[i]["surveyDate"];
          let zone = this.dateSummaryList[i]["zoneNo"];
          let cardCount = this.dateSummaryList[i]["cardCount"];
          let dbPath = "EntitySurveyData/DailyHouseCount/" + zone + "/" + surveyorId + "/" + surveyDate;
          this.db.object(dbPath).set(cardCount);
        }
        this.commonService.setAlertMessage("success", "Data updated successfully !!!");
        $(this.divLoaderCounts).hide();
        this.surveyData.lastUpdate = lastUpdate;
        //this.checkWithCardWardMapping();

        //console.log(this.cardNumberList);
        this.clearAll();
        this.getWardProgressList();
      }, 2000);

    }
    else {
      let zoneNo = this.wardList[index]["zoneNo"];
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;

      let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
        markerData => {
          markerInstance.unsubscribe();

          if (markerData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateCounts_Bharat", markerData);

            let keyArray = Object.keys(markerData);

            if (keyArray.length > 0) {

              let totalMarkerCount = 0;
              let totalCardCount = 0;
              let totalRevisit = 0;

              for (let i = 0; i < keyArray.length; i++) {
                let markerCount = 0;
                let cardCount = 0;
                let revisitCount = 0;
                let lineNo = keyArray[i];
                let lineData = markerData[lineNo];
                let lastMarkerKey = 0;
                let markerKeyArray = Object.keys(lineData);
                let isMarker = false;

                for (let j = 0; j < markerKeyArray.length; j++) {
                  let markerNo = markerKeyArray[j];
                  if (parseInt(markerNo)) {
                    isMarker = true;
                    markerCount = markerCount + 1;
                    lastMarkerKey = Number(markerNo);
                    if (lineData[markerNo]["cardNumber"] != null) {
                      if (lineData[markerNo]["houseType"] == null) {
                        // console.log(zoneNo + " " + lineNo + " " + markerNo);
                      }
                      cardCount = cardCount + 1;
                      // if (lineData[markerNo]["isVirtualAssign"] != null) {

                      //  let newCard=Number(lineData[markerNo]["cardNumber"].replace("MPZ", ""));
                      // if(newCard<200000)
                      // {
                      //   console.log(lineData[markerNo]["cardNumber"]);
                      //this.updateVirtualCards(zoneNo, lineNo, markerNo, lineData[markerNo]["cardNumber"]);
                      // }

                      //}
                      /*
                                            let detail = this.cardNumberList.find(item => item.cardNo == lineData[markerNo]["cardNumber"]);
                                            if (detail != undefined) {
                                              detail.count = detail.count + 1;
                                              detail.zoneNo = detail.zoneNo + ", " + zoneNo;
                                              detail.lineNo = detail.lineNo + ", " + lineNo;
                      
                                              console.log(detail.zoneNo + " " + detail.lineNo + " " + lineData[markerNo]["cardNumber"] + " " + detail.count);
                                            }
                                            else {
                                              this.cardNumberList.push({ zoneNo: zoneNo, lineNo: lineNo, cardNo: lineData[markerNo]["cardNumber"], count: 1 });
                                            }
                      */

                    } else if (lineData[markerNo]["revisitKey"] != null) {
                      revisitCount = revisitCount + 1;
                    }
                  }
                }

                if (isMarker == false) {
                  let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                  //this.db.object(dbPath).remove();
                }
                else {
                  let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                  this.db.object(dbPath).update({
                    marksCount: markerCount,
                    surveyedCount: cardCount,
                    lineRevisitCount: revisitCount
                  });
                }

                totalMarkerCount = totalMarkerCount + markerCount;
                totalCardCount = totalCardCount + cardCount;
                totalRevisit = totalRevisit + revisitCount;

                if (lastMarkerKey > 0) {
                  let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
                  this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
                }

              }

              let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + zoneNo;
              this.db.object(dbPath).update({ marked: totalMarkerCount });

              dbPath = "EntitySurveyData/TotalHouseCount/" + zoneNo;
              this.db.object(dbPath).set(totalCardCount.toString());

              dbPath = "EntitySurveyData/TotalRevisitRequest/" + zoneNo;
              this.db.object(dbPath).set(totalRevisit.toString());

              index++;
              this.updateCounts_Bharat(index);

              this.updateSurveyComplexCount_Bharat(zoneNo);
            }
            else {
              index++;
              this.updateCounts_Bharat(index);
            }
          }
          else {
            index++;
            this.updateCounts_Bharat(index);
          }
        });
    }
  }

  updateVirtualCards(zoneNo: any, lineNo: any, markerNo: any, cardNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateVirtualCards");
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        if (markerData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateVirtualCards", markerData);
          let newCardNo = "MPZ" + (Number(cardNo.replace("MPZ", "")) + 100000);
          markerData["cardNumber"] = newCardNo;
          //console.log(markerData);
          dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
          this.db.object(dbPath).update(markerData);
        }
      }
    );



  }

  updateSurveyComplexCount_Bharat(zoneNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateSurveyComplexCount_Bharat");

    let dbPath = "Houses/" + zoneNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        let totalHouseHoldCount = 0;
        let totalComplexCount = 0;
        let totalHouseCount = 0;
        let totalResidencialCount = 0;
        let totalCommercialCount = 0;
        if (houseData != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateSurveyComplexCount_Bharat", houseData);
          let keyArray = Object.keys(houseData);
          if (keyArray.length > 0) {
            let cardsCount = 0;

            let wardLastLineNo = keyArray[keyArray.length - 1];
            for (let i = 1; i <= parseInt(wardLastLineNo); i++) {
              let line = i;
              let houseCount = 0;
              let houseHoldCount = 0;
              let complexCount = 0;
              let residencialCount = 0;
              let commercialCount = 0;

              let cardObj = houseData[line];
              if (cardObj != undefined) {
                let cardKeyArray = Object.keys(cardObj);
                for (let j = 0; j < cardKeyArray.length; j++) {
                  let cardNo = cardKeyArray[j];
                  //if (cardObj[cardNo]["houseType"] == null || cardObj[cardNo]["houseType"] == "") {
                  //  console.log(zoneNo + " >> " + line + " >> " + cardNo);
                  //this.updateHousesDataHouseType(zoneNo, line, cardNo, cardObj[cardNo]["cardType"]);
                  // }
                  if (cardObj[cardNo]["latLng"] != null) {
                    let duplicateDetail = this.duplicateHouseCardList.find(item => item.cardNo == cardNo);
                    if (duplicateDetail != undefined) {
                      console.log(cardNo, line);
                    }
                    else {
                      this.duplicateHouseCardList.push({ cardNo: cardNo });
                    }
                    cardsCount++;
                    if (cardObj[cardNo]["houseType"] == "19" || cardObj[cardNo]["houseType"] == "20") {
                      complexCount = complexCount + 1;
                      let servingCount = parseInt(cardObj[cardNo]["servingCount"]);
                      if (isNaN(servingCount)) {
                        servingCount = 1;
                      }
                      houseHoldCount = houseHoldCount + servingCount;
                      houseCount = houseCount + servingCount;
                      if (cardObj[cardNo]["houseType"] == "19") {
                        residencialCount = residencialCount + servingCount;
                      }
                      else {
                        commercialCount = commercialCount + servingCount;
                      }
                    } else {
                      houseCount = houseCount + 1;
                      if (cardObj[cardNo]["houseType"] == "1") {
                        residencialCount = residencialCount + 1;
                      }
                      else {
                        commercialCount = commercialCount + 1;
                      }
                    }
                    /*
                    let cardData=cardObj[cardNo];
                    //console.log(cardData);
                    cardData["line"]=line;
                    cardData["ward"]=zoneNo;
                    dbPath="Houses/"+zoneNo+"/"+line+"/"+cardNo;
                    this.db.object(dbPath).update(cardData);
                    */
                    let cardCount = 1;
                    let surveyorId = cardObj[cardNo]["surveyorId"];
                    if (cardObj[cardNo]["createdDate"] != null) {
                      let surveyDate = cardObj[cardNo]["createdDate"].split(" ")[0];
                      if (this.dateSummaryList.length == 0) {
                        this.dateSummaryList.push({ zoneNo: zoneNo, surveyorId: surveyorId, surveyDate: surveyDate, cardCount: cardCount });
                      }
                      else {
                        let summaryDetail = this.dateSummaryList.find(item => item.zoneNo == zoneNo && item.surveyorId == surveyorId && item.surveyDate == surveyDate);
                        if (summaryDetail != undefined) {
                          summaryDetail.cardCount = Number(summaryDetail.cardCount) + Number(cardCount);
                        }
                        else {
                          this.dateSummaryList.push({ zoneNo: zoneNo, surveyorId: surveyorId, surveyDate: surveyDate, cardCount: cardCount });
                        }
                      }
                    }

                  }
                }
              }


              totalComplexCount = totalComplexCount + complexCount;
              totalHouseHoldCount = totalHouseHoldCount + houseHoldCount;
              totalHouseCount = totalHouseCount + houseCount;
              totalCommercialCount = totalCommercialCount + commercialCount;
              totalResidencialCount = totalResidencialCount + residencialCount;

              let dbHouseHoldPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + line;

              this.db.object(dbHouseHoldPath).update({
                houseHoldCount: houseHoldCount,
                complexCount: complexCount,
                houseCount: houseCount
              });
            }

            // console.log(cardsCount);
          }
        }
        dbPath = "EntitySurveyData/TotalHouseHoldCount/" + zoneNo;
        this.db.object(dbPath).set(totalHouseHoldCount.toString());

        dbPath = "EntitySurveyData/TotalComplexCount/" + zoneNo;
        this.db.object(dbPath).set(totalComplexCount.toString());

        dbPath = "EntitySurveyData/totalHouseWithComplexCount/" + zoneNo;
        this.db.object(dbPath).set(totalHouseCount.toString());

        dbPath = "EntitySurveyData/TotalResidentialCount/" + zoneNo;
        this.db.object(dbPath).set(totalResidencialCount.toString());

        dbPath = "EntitySurveyData/TotalCommercialCount/" + zoneNo;
        this.db.object(dbPath).set(totalCommercialCount.toString());
      }
    );

  }

  updateHousesDataHouseType(zoneNo: any, lineNo: any, cardNo: any, cardType: any) {
    let houseType = "1";
    if (cardType == "व्यावसायिक") {
      houseType = "2";
    }
    let dbPath = "Houses/" + zoneNo + "/" + lineNo + "/" + cardNo;
    this.db.object(dbPath).update({ houseType: houseType });

  }


  getWardProgressList() {
    this.wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.wardProgressList = [];
    if (this.wardList.length > 0) {
      for (let i = 0; i < this.wardList.length; i++) {
        let wardNo = this.wardList[i]["zoneNo"];
        this.wardProgressList.push({ wardNo: wardNo, markers: 0, surveyed: 0, houses: 0, revisit: 0, oldCard: 0, status: "", already: 0, nameNotCorrect: 0, houseHold: '', complex: '' });
        if (i == 1) {
          setTimeout(() => {
            this.getSurveyDetail(wardNo, 1);
            $("#tr1").addClass("active");
          }, 4000);
        }
        this.getWardSummary(i, wardNo);
      }
    }
    this.wardList[0]["zoneNo"] = "--All--";
  }

  exportCards() {
    this.cardHousesList = [];
    $(this.divLoaderMain).show();
    let zoneNo = $(this.ddlZone).val();
    if (zoneNo == "--All--") {
      this.getExportCardData(1, 'All');
    }
    else {
      for (let i = 0; i < this.wardList.length; i++) {
        if (this.wardList[i]["zoneNo"] == zoneNo) {
          this.getExportCardData(i, zoneNo);
          i = this.wardList.length;
        }
      }
    }
  }

  getExportCardData(index: any, type: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getExportCardData");
    if (index == this.wardList.length) {
      if (this.cardHousesList.length > 0) {
        let totalHouses = 0;
        let htmlString = "";
        htmlString = "<table>";
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "Zone No";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Line No";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Card No";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "No of Houses";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Name";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Address";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Card Type";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "LatLng";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Mobile";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Date";
        htmlString += "</td>";
        htmlString += "</tr>";
        for (let i = 0; i < this.cardHousesList.length; i++) {
          htmlString += "<tr>";
          htmlString += "<td t='s'>";
          htmlString += this.cardHousesList[i]["zoneNo"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["lineNo"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["cardNo"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["houseCount"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["name"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["address"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["cardType"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["latLng"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["mobile"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += this.cardHousesList[i]["date"];
          htmlString += "</td>";
          htmlString += "</tr>";
          totalHouses += Number(this.cardHousesList[i]["houseCount"]);
        }

        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "Total";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += totalHouses;
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "</td>";
        htmlString += "</tr>";
        htmlString += "<table>";
        let fileName = this.commonService.getFireStoreCity() + "-" + type + "-HouseData.xlsx";
        this.commonService.exportExcel(htmlString, fileName);
      }
      $(this.divLoaderMain).hide();
    }
    else {
      let zoneNo = this.wardList[index]["zoneNo"];
      let dbPath = "Houses/" + zoneNo;
      let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
        houseData => {
          houseInstance.unsubscribe();
          if (houseData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getExportCardData", houseData);
            let keyArray = Object.keys(houseData);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length; i++) {
                let line = keyArray[i];
                let cardObj = houseData[line];
                let cardKeyArray = Object.keys(cardObj);
                for (let j = 0; j < cardKeyArray.length; j++) {
                  let cardNo = cardKeyArray[j];
                  let name = cardObj[cardNo]["name"];
                  let address = cardObj[cardNo]["address"];
                  let cardType = "";
                  let latLng = cardObj[cardNo]["latLng"];
                  let mobile = cardObj[cardNo]["mobile"];
                  let date = "";
                  let houseCount = 0;
                  if (cardObj[cardNo]["createdDate"] != null) {
                    date = cardObj[cardNo]["createdDate"].split(' ')[0];
                  }
                  let houseType = cardObj[cardNo]["houseType"];
                  if (houseType == "19" || houseType == "20") {
                    if (cardObj[cardNo]["servingCount"] != null) {
                      let servingCount = parseInt(cardObj[cardNo]["servingCount"]);
                      if (isNaN(servingCount)) {
                        servingCount = 1;
                      }
                      houseCount = servingCount;
                    }
                    else {
                      houseCount = 1;
                    }
                  }
                  else {
                    houseCount = 1;
                  }
                  let detail = this.houseTypeList.find(item => item.id == houseType);
                  if (detail != undefined) {
                    cardType = detail.houseType;
                  }
                  this.cardHousesList.push({ zoneNo: zoneNo, lineNo: line, cardNo: cardNo, name: name, address: address, cardType: cardType, latLng: latLng, mobile: mobile, date: date, houseCount: houseCount });
                }
              }
              index++;
              if (type != "All") {
                index = this.wardList.length;
              }
              this.getExportCardData(index, type);
            }
            else {
              index++;
              if (type != "All") {
                index = this.wardList.length;
              }
              this.getExportCardData(index, type);
            }
          }
          else {
            index++;
            if (type != "All") {
              index = this.wardList.length;
            }
            this.getExportCardData(index, type);
          }
        }
      );
    }
  }

  getWardSummary(index: any, wardNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardSummary");
    let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/marked";
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      markerInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["markers"] = Number(data);
        this.surveyData.totalMarkers = this.surveyData.totalMarkers + Number(data);
        dbPath = "EntitySurveyData/TotalHouseCount/" + wardNo;
        let surveyedInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
          surveyedInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
            this.wardProgressList[index]["surveyed"] = Number(data);
            this.surveyData.totalSurveyed = this.surveyData.totalSurveyed + Number(data);
            this.wardProgressList[index]["status"] = "In Progress";
            if (Number(this.wardProgressList[index]["markers"]) == Number(data)) {
              this.wardProgressList[index]["status"] = "Survey Done";
            }
          }
        });
        dbPath = "EntitySurveyData/totalHouseWithComplexCount/" + wardNo;
        let housesInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
          housesInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
            this.wardProgressList[index]["houses"] = Number(data);
            this.surveyData.totalHouses = this.surveyData.totalHouses + Number(data);
          }
        });
      }
    });

    dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/alreadyInstalled";
    let alreadyInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      alreadyInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["already"] = Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalRevisitRequest/" + wardNo;
    let revisitInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      revisitInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["revisit"] = Number(data);
        this.surveyData.totalRevisit = this.surveyData.totalRevisit + Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalRfidNotFoundCount/" + wardNo;
    let oldCardInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      oldCardInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["oldCard"] = Number(data);
        this.surveyData.totalOldCards = this.surveyData.totalOldCards + Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalHouseHoldCount/" + wardNo;
    let houseHoldInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseHoldInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["houseHold"] = Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalComplexCount/" + wardNo;
    let complexInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      complexInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["complex"] = Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalResidentialCount/" + wardNo;
    let residentailInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      residentailInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["residential"] = Number(data);
        this.surveyData.totalResidential = this.surveyData.totalResidential + Number(data);
      }
    });

    dbPath = "EntitySurveyData/TotalCommercialCount/" + wardNo;
    let commercialInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      commercialInstance.unsubscribe();
      if (data != null) {
        this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardSummary", data);
        this.wardProgressList[index]["commercial"] = Number(data);
        this.surveyData.totalCommercial = this.surveyData.totalCommercial + Number(data);
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
    this.wardLineMarkerImageList = [];
  }

  getSurveyDetail(wardNo: any, listIndex: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getSurveyDetail");
    this.clearWardDetailData();
    this.selectedWard = wardNo;
    $('#divLoaderMain').show();
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

        let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo;
        let markedHouseInstance = this.db.object(dbPath).valueChanges().subscribe(
          markedHouseData => {
            markedHouseInstance.unsubscribe();
            if (markedHouseData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getSurveyDetail", markedHouseData);
              for (let i = 1; i <= this.wardLineCount; i++) {

                this.lineSurveyList.push({ lineNo: i, markers: 0, alreadyCard: 0, survyed: 0, houses: 0, oldCard: 0, revisit: 0, wardNo: wardNo, houseHoldCount: '', complexCount: '0', class: '' });
                if (markedHouseData[i] != null) {
                  let markedCount = 0;
                  let surveyedCount = 0;
                  let houseCount = 0;
                  let lineRevisitCount = 0;
                  let lineRfidNotFoundCount = 0;
                  let alreadyInstalledCount = 0;
                  let houseHoldCount = 0;
                  let complexCount = 0;
                  if (parseInt(markedHouseData[i]["marksCount"])) {
                    markedCount = markedHouseData[i]["marksCount"];
                  }
                  if (parseInt(markedHouseData[i]["surveyedCount"])) {
                    surveyedCount = markedHouseData[i]["surveyedCount"];
                  }
                  if (parseInt(markedHouseData[i]["houseCount"])) {
                    houseCount = markedHouseData[i]["houseCount"];
                  }
                  if (parseInt(markedHouseData[i]["lineRevisitCount"])) {
                    lineRevisitCount = markedHouseData[i]["lineRevisitCount"];
                  }
                  if (parseInt(markedHouseData[i]["lineRfidNotFoundCount"])) {
                    lineRfidNotFoundCount = markedHouseData[i]["lineRfidNotFoundCount"];
                  }
                  if (parseInt(markedHouseData[i]["alreadyInstalledCount"])) {
                    alreadyInstalledCount = markedHouseData[i]["alreadyInstalledCount"];
                  }
                  if (parseInt(markedHouseData[i]["houseHoldCount"])) {
                    houseHoldCount = markedHouseData[i]["houseHoldCount"];
                  }
                  if (parseInt(markedHouseData[i]["complexCount"])) {
                    complexCount = markedHouseData[i]["complexCount"];
                  }

                  let lineDetail = this.lineSurveyList.find(item => item.lineNo == i);
                  if (lineDetail != undefined) {
                    lineDetail.markers = Number(markedCount);
                    lineDetail.survyed = Number(surveyedCount);
                    lineDetail.houses = Number(houseCount);
                    lineDetail.revisit = Number(lineRevisitCount);
                    lineDetail.oldCard = Number(lineRfidNotFoundCount);
                    lineDetail.alreadyCard = Number(alreadyInstalledCount);
                    lineDetail.houseHoldCount = Number(houseHoldCount);
                    lineDetail.complexCount = Number(complexCount);
                    if (Number(lineDetail.markers != Number(lineDetail.survyed))) {
                      lineDetail.class = "not-matched";
                    }
                  }
                  let markerData = markedHouseData[i];
                  let keyArray = Object.keys(markerData);
                  if (keyArray.length > 0) {
                    for (let j = 0; j < keyArray.length; j++) {
                      let markerNo = parseInt(keyArray[j]);
                      if (!isNaN(markerNo)) {
                        if (markerData[markerNo]["cardNumber"] != null) {
                          let image = markerData[markerNo]["image"];
                          this.wardLineMarkerImageList.push({ wardNo: wardNo, lineNo: i, markerNo: markerNo, cardNo: markerData[markerNo]["cardNumber"], image: image });
                        }
                      }
                    }
                  }
                }
              }
            }
            $('#divLoaderMain').hide();
          }
        );
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
    width = (windowWidth * 90) / 100;
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getLineDetail");
    let dbPath = "Houses/" + wardNo + "/" + lineNo;
    let lineDetailInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        lineDetailInstance.unsubscribe();
        if (data.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getLineDetail", data);
          for (let i = 0; i < data.length; i++) {
            if (data[i]["latLng"] != null) {
              let city = this.commonService.getFireStoreCity();
              if (this.cityName == "sikar") {
                city = "Sikar-Survey";
              }
              let entityList = [];
              let houseHoldCount = 0;
              let surveyorName = "";
              let surveyDate = "";
              let isCommercial = false;
              if (data[i]["surveyorId"] != null) {
                let detail = this.surveyorList.find(item => item.surveyorId == data[i]["surveyorId"]);
                if (detail != undefined) {
                  surveyorName = detail.name;
                }
              }
              if (data[i]["createdDate"] != null) {
                let date = data[i]["createdDate"].split(' ')[0];
                let time = data[i]["createdDate"].split(' ')[1];
                surveyDate = date.split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(date.split('-')[1])) + " " + date.split('-')[0] + " " + time.split(':')[0] + ":" + time.split(':')[1];
              }
              let servingCount = 0;
              if (data[i]["servingCount"] != null) {
                if (data[i]["servingCount"] != "") {
                  servingCount = Number(data[i]["servingCount"]);
                }
              }
              let className = "house-list";
              let imageURL = "../../../assets/img/system-generated-image.jpg";
              if (data[i]["cardImage"] != null) {
                if (data[i]["surveyorId"] == "-1") {
                  imageURL = this.commonService.fireStoragePath + city + "%2FSurveyRfidNotFoundCardImage%2F" + data[i]["cardImage"] + "?alt=media";
                }
                else {
                  imageURL = this.commonService.fireStoragePath + city + "%2FSurveyCardImage%2F" + data[i]["cardImage"] + "?alt=media";
                }
              }
              let houseImageURL = "../../../assets/img/system-generated-image.jpg";
              if (data[i]["houseImage"] != null) {
                if (data[i]["surveyorId"] == "-1") {
                  houseImageURL = this.commonService.fireStoragePath + city + "%2FSurveyRfidNotFoundCardImage%2F" + data[i]["cardImage"] + "?alt=media";
                }
                else {
                  houseImageURL = this.commonService.fireStoragePath + city + "%2FSurveyHouseImage%2F" + data[i]["houseImage"] + "?alt=media";
                }
              }
              if (data[i]["houseType"] == "19" || data[i]["houseType"] == "20") {
                className = "commercial-list";
                isCommercial = true;
                if (data[i]["Entities"] != null) {
                  let entityData = data[i]["Entities"];
                  houseHoldCount = entityData.length - 1;
                  for (let j = 1; j < entityData.length; j++) {
                    let keyIndex = j;
                    let entityImageURL = "../../../assets/img/system-generated-image.jpg";
                    if (entityData[keyIndex]["house image"] != null) {
                      entityImageURL = this.commonService.fireStoragePath + city + "%2FSurveyHouseImage%2F" + data[i]["cardNo"] + "%2FEntities%2F" + entityData[keyIndex]["house image"] + "?alt=media";
                    }
                    entityList.push({ name: entityData[keyIndex]["name"], mobile: entityData[keyIndex]["mobile"], entityImageURL: entityImageURL });
                  }
                }
              }
              let cardType = data[i]["cardType"];
              let entityType = "";
              let detail = this.houseTypeList.find(item => item.id == data[i]["houseType"]);
              if (detail != undefined) {
                entityType = detail.houseType;
              }
              let markerImageURL = "../../../assets/img/system-generated-image.jpg";
              detail = this.wardLineMarkerImageList.find(item => item.cardNo == data[i]["cardNo"]);
              if (detail != undefined) {
                if (detail.image != "") {
                  markerImageURL = this.commonService.fireStoragePath + city + "%2FMarkingSurveyImages%2F" + wardNo + "%2F" + lineNo + "%2F" + detail.image + "?alt=media";
                }
              }

              this.surveyedDetailList.push({ wardNo: wardNo, lineNo: lineNo, cardType: cardType, entityType: entityType, cardNo: data[i]["cardNo"], imageUrl: imageURL, name: data[i]["name"], houseImageUrl: houseImageURL, markerImageURL: markerImageURL, entityList: entityList, houseHoldCount: houseHoldCount, surveyorName: surveyorName, surveyDate: surveyDate, houseType: data[i]["houseType"], servingCount: servingCount, isCommercial: isCommercial, class: className });
            }
          }
        }
      }
    );
  }

  getMarkerImage() {

  }

  openHouseTypePopup(wardNo: any, lineNo: any, index: any) {
    $(this.divHouseType).show();
    $(this.houseWardNo).val(wardNo);
    $(this.houseLineNo).val(lineNo);
    $(this.houseIndex).val(index);
    if (this.surveyedDetailList.length > 0) {
      $(this.ddlHouseType).val(this.surveyedDetailList[index]["houseType"]);
      if (this.surveyedDetailList[index]["houseType"] == "19" || this.surveyedDetailList[index]["houseType"] == "20") {
        $(this.txtServingCount).val(this.surveyedDetailList[index]["servingCount"]);
        $(this.divServingCount).show();
      }
      else {
        $(this.txtServingCount).val("0");
        $(this.divServingCount).hide();
      }
    }
  }

  setServingCount() {
    let houseType = $(this.ddlHouseType).val();
    $(this.txtServingCount).val('0');
    if (houseType == "19" || houseType == "20") {
      $(this.divServingCount).show();
    }
    else {
      $(this.divServingCount).hide();
    }
  }

  updateHouseType() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateHouseType");
    let wardNo = $(this.houseWardNo).val();
    let lineNo = $(this.houseLineNo).val();
    let index = $(this.houseIndex).val();
    let houseTypeId = $(this.ddlHouseType).val();
    let servingCount = $(this.txtServingCount).val();
    let cardType = "व्यावसायिक";
    let isCommercial = false;
    if (houseTypeId == "19" || houseTypeId == "20") {
      isCommercial = true;
    }
    else {
      servingCount = "0";
    }
    this.surveyedDetailList[Number(index)]["isCommercial"] = isCommercial;
    this.surveyedDetailList[Number(index)]["houseType"] = houseTypeId;
    this.surveyedDetailList[Number(index)]["servingCount"] = servingCount;
    let cardNumber = this.surveyedDetailList[Number(index)]["cardNo"];

    let houseTypeDetail = this.houseTypeList.find(item => item.id == houseTypeId);
    if (houseTypeDetail != undefined) {
      if (houseTypeDetail.entityType == "residential") {
        cardType = "आवासीय"
      }
      this.surveyedDetailList[Number(index)]["entityType"] = houseTypeDetail.houseType;
    }
    let dbPath = "Houses/" + wardNo + "/" + lineNo + "/" + cardNumber;
    this.db.object(dbPath).update({ houseType: houseTypeId, cardType: cardType, servingCount: servingCount });
    dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateHouseType", data);
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let markerNo = keyArray[i];
              if (data[markerNo]["cardNumber"] != null) {
                if (cardNumber == data[markerNo]["cardNumber"]) {
                  let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + markerNo;
                  this.db.object(dbPath).update({ houseType: houseTypeId });
                  i = keyArray.length;
                }
              }
            }
          }
          this.cancelHouseType();
          this.commonService.setAlertMessage("success", "Saved successfully !!!");
        }
        else {
          this.cancelHouseType();
          this.commonService.setAlertMessage("success", "Saved successfully !!!");
        }
      }
    );
  }

  cancelHouseType() {
    $(this.houseWardNo).val("0");
    $(this.houseLineNo).val("0");
    $(this.houseIndex).val("0");
    $(this.txtServingCount).val("0");
    $(this.divHouseType).hide();
  }


  showEntity(cardNo: any) {
    let detail = this.surveyedDetailList.find(item => item.cardNo == cardNo);
    if (detail != undefined) {
      this.entityList = detail.entityList;
      $(this.divEntityList).show();
    }
  }

  hideEntity() {
    this.entityList = [];
    $(this.divEntityList).hide();
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getHouses");
    let dateList = [];
    let dbPath = "EntitySurveyData/DailyHouseCount";
    let surveyedInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        surveyedInstance.unsubscribe();
        if (data.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getHouses", data);
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getRevisitRequests");
    let dateList = [];
    let dbPath = "EntitySurveyData/DailyRevisitRequestCount";
    let revisitInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        revisitInstance.unsubscribe();
        if (data.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getRevisitRequests", data);
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getRFIDNotFound");
    let dateList = [];
    let dbPath = "EntitySurveyData/DailyRfidNotFoundCount";
    let rfidInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        rfidInstance.unsubscribe();
        if (data.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getRFIDNotFound", data);
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
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getZoneHouseTypeList");
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
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getZoneHouseTypeList", markerData);
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

  exportDateWiseCards() {
    if (this.surveyDateList.length > 0) {
      $('#divLoaderMain').show();

      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Cards";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.surveyDateList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.surveyDateList[i]["date"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.surveyDateList[i]["count"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
      let fileName = "Date-Wise-Cards.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
      $('#divLoaderMain').hide();
    }

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

      let totalCounts = 0;
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
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getZoneHouseType", markerData);
            let keyArray = Object.keys(markerData);
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineData = markerData[lineNo];
              let markerKeyArray = Object.keys(lineData);
              for (let j = 0; j < markerKeyArray.length; j++) {
                let markerNo = markerKeyArray[j];
                if (parseInt(markerNo)) {
                  // if (lineData[markerNo]["houseType"] == "") {
                  //   console.log(zoneNo + " >> " + lineNo + " >> " + markerNo + " >> " + lineData[markerNo]["cardNumber"]);
                  //  }
                  if (lineData[markerNo]["houseType"] != null) {
                    let houseTypeId = lineData[markerNo]["houseType"];
                    let detail = this.houseTypeList.find(item => item.id == houseTypeId);
                    if (detail != undefined) {
                      let houseType = detail.houseType;
                      if (this.zoneHouseTypeList.length == 0) {
                        let count = 0;
                        if (lineData[markerNo]["cardNumber"] != null) {
                          count = 1;
                          totalCounts = totalCounts + 1;
                        }
                        this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: count });
                      }
                      else {
                        let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseTypeId);
                        if (listDetail != undefined) {
                          if (lineData[markerNo]["cardNumber"] != null) {
                            listDetail.counts = listDetail.counts + 1;
                            totalCounts = totalCounts + 1;
                          }
                        }
                        else {
                          let count = 0;
                          if (lineData[markerNo]["cardNumber"] != null) {
                            count = 1;
                            totalCounts = totalCounts + 1;
                          }
                          this.zoneHouseTypeList.push({ houseTypeId: houseTypeId, houseType: houseType, counts: count });
                        }
                      }
                    }
                  }
                  else {
                    if (lineData[markerNo]["cardNumber"] != null) {
                      // console.log(zoneNo + " >> " + lineNo + " >> " + markerNo + " >> " + lineData[markerNo]["cardNumber"]);
                      this.updateHousesType(zoneNo, lineNo, markerNo, lineData[markerNo]["cardNumber"]);
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

  updateHousesType(zoneNo: any, lineNo: any, markerNo: any, cardNo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateHousesType");
    let dbPath = "CardWardMapping/" + cardNo;
    let cardWardInstance = this.db.object(dbPath).valueChanges().subscribe(
      mappingData => {
        cardWardInstance.unsubscribe();
        if (mappingData != undefined) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateHousesType", mappingData);
          let line = mappingData["line"];
          let ward = mappingData["ward"];
          dbPath = "Houses/" + ward + "/" + line + "/" + cardNo + "/houseType";
          let houseTypeInstance = this.db.object(dbPath).valueChanges().subscribe(
            houseTypeData => {
              let houseType = "1";
              houseTypeInstance.unsubscribe();
              if (houseTypeData != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "updateHousesType", houseTypeData);
                if (houseTypeData != "") {
                  houseType = houseTypeData;
                }
              }
              dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
              this.db.object(dbPath).update({ houseType: houseType });
              let listDetail = this.zoneHouseTypeList.find(item => item.houseTypeId == houseType);
              if (listDetail != undefined) {
                listDetail.counts = listDetail.counts + 1;
              }
              else {
                let count = 0;
                count = 1;
                this.zoneHouseTypeList.push({ houseTypeId: houseType, houseType: houseType, counts: count });
              }
            }
          );
        }
      }
    );
  }
}

export class surveyDatail {
  totalLines: number;
  totalMarkers: number;
  totalSurveyed: number;
  totalRevisit: number;
  totalOldCards: number;
  totalHouses: number;
  totalResidential: number;
  totalCommercial: number;
  wardMarkers: number;
  wardSurveyed: number;
  wardRevisit: number;
  wardAlreadyCard: number;
  wardOldCards: number;
  wardNameNotCorrect: number;
  lastUpdate: string;
}
