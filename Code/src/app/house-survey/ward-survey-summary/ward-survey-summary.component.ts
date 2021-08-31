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
  wardProgressList: any[];
  lineSurveyList: any[];
  wardList: any[] = [];
  surveyedDetailList: any[];
  wardLineCount: any;
  cityName: any;
  isFirst = true;
  db: any;
  surveyData: surveyDatail = {
    totalLines: 0,
    totalMarkers: 0,
    totalSurveyed: 0,
    totalRevisit:0,
    wardMarkers: 0,
    wardSurveyed: 0,
    wardRevisit: 0,
  };

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.getWards();
    this.selectedCircle = "Circle1";
  }

  getWards() {
    let dbPath = "Defaults/CircleWiseWards";
    let circleWiseWard = this.db.list(dbPath).valueChanges().subscribe((data) => {
      circleWiseWard.unsubscribe();
      if (data != null) {
        let circledata: any;
        for (let i = 0; i < data.length; i++) {
          circledata = data[i];
          if (i == 0) {
            for (let j = 1; j < circledata.length; j++) {
              this.wardList.push({
                circle: "Circle1",
                wardNo: circledata[j],
              });
            }
          }
          if (i == 1) {
            for (let j = 1; j < circledata.length; j++) {
              this.wardList.push({
                circle: "Circle2",
                wardNo: circledata[j],
              });
            }
          }
          if (i == 2) {
            for (let j = 1; j < circledata.length; j++) {
              this.wardList.push({
                circle: "Circle3",
                wardNo: circledata[j],
              });
            }
          }
        }
      }
      this.selectedCircle = "Circle1";
      this.clearAll();
      this.getWardProgressList();
    });
  }

  clearAll() {
    this.wardProgressList = [];
    this.lineSurveyList = [];
    this.surveyData.totalMarkers=0;
    this.surveyData.totalSurveyed=0;
    this.surveyData.totalRevisit=0;
  }

  changeCircleSelection(filterVal: any) {
    this.selectedCircle = filterVal;
    this.getWardProgressList();
  }

  getWardProgressList() {
    if (this.wardList.length > 0) {
      let circleWardList = this.wardList.filter(
        (item) => item.circle == this.selectedCircle
      );
      if (circleWardList.length > 0) {
        for (let i = 0; i < circleWardList.length; i++) {
          let wardNo = circleWardList[i]["wardNo"];
          this.wardProgressList.push({
            wardNo: wardNo,
            markers: 0,
            surveyed: 0,
            revisit: 0,
            status: "",
          });
          if (i == 0) {
            setTimeout(() => {
              this.getSurveyDetail(wardNo, 0);
              $("#tr0").addClass("active");
            }, 1000);
          }
          this.getWardSummary(i, wardNo);
        }
      }
    }
  }

  getWardSummary(index: any, wardNo: any) {
    let dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/marked";
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      markerInstance.unsubscribe();
      if (data != null) {
        this.wardProgressList[index]["markers"] = Number(data);
        this.surveyData.totalMarkers=this.surveyData.totalMarkers+Number(data);
        dbPath = "EntitySurveyData/TotalHouseCount/" + wardNo;
        let surveyedInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
          surveyedInstance.unsubscribe();
          if (data != null) {
            this.wardProgressList[index]["surveyed"] = Number(data);
            this.surveyData.totalSurveyed=this.surveyData.totalSurveyed+Number(data);
            this.wardProgressList[index]["status"] = "In Progress";
            if (Number(this.wardProgressList[index]["markers"]) == Number(data)) {
              this.wardProgressList[index]["status"] = "Survey Done";
            }
          }
        });
      }
    });

    dbPath = "EntitySurveyData/TotalRevisitRequest/" + wardNo;
    let revisitInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      revisitInstance.unsubscribe();
      if (data != null) {
        this.wardProgressList[index]["revisit"] = Number(data);
        this.surveyData.totalRevisit=this.surveyData.totalRevisit+Number(data);
      }
    });
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
    this.surveyData.wardMarkers=0;
    this.surveyData.wardRevisit=0;
    this.surveyData.wardSurveyed=0;
    this.lineSurveyList = [];
  }

  getSurveyDetail(wardNo: any, listIndex: any) {
    this.clearWardDetailData();
    $('#divLoader').show();
    setTimeout(() => {
      $('#divLoader').hide();
    }, 1000);

    if (this.isFirst == false) {
      this.setActiveClass(listIndex);
    } else {
      this.isFirst = false;
    }
    let wardLineCountList = JSON.parse(localStorage.getItem("wardLineCountList"));
    if (wardLineCountList != null) {
      let lineCount = wardLineCountList.find(item => item.wardNo == wardNo);
      if (lineCount != undefined) {
        this.wardLineCount = Number(lineCount.lineCount);
        this.surveyData.totalLines = this.wardLineCount;
        let wardSummary = this.wardProgressList.find(item => item.wardNo == wardNo);
        if (wardSummary != undefined) {
          this.surveyData.wardMarkers = wardSummary.markers;
          this.surveyData.wardRevisit = wardSummary.revisit;
          this.surveyData.wardSurveyed = wardSummary.surveyed;
        }
        for (let i = 1; i <= this.wardLineCount; i++) {
          this.lineSurveyList.push({ lineNo: i, markers: 0, survyed: 0, revisit: 0, wardNo: wardNo });
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
              else {
                this.getSurvedData(wardNo, i);
              }
            }
          );

          dbPath = "EntitySurveyData/RevisitRequest/" + wardNo + "/" + i + "/lineRevisitCount";
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
        }
      }
    }
  }
  getSurvedData(wardNo: any, lineNo: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo;
    let survedHouseInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        survedHouseInstance.unsubscribe();
        let surveyed = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i]["cardNumber"] != null) {
            surveyed++;
          }
        }
        let lineDetail = this.lineSurveyList.find(item => item.lineNo == lineNo);
        if (lineDetail != undefined) {
          lineDetail.survyed = surveyed;
        }
      }
    );
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
              let city = this.cityName.charAt(0).toUpperCase() + this.cityName.slice(1);
              let imageUrl = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + city + "%2FSurveyCardImage%2F" + wardNo + "%2F" + lineNo + "%2F" + imageName + "?alt=media";
              this.surveyedDetailList.push({ cardType: data[i]["cardType"], cardNo: data[i]["cardNo"], imageUrl: imageUrl, name: data[i]["name"] });
            }
          }
        }
      }
    );
  }
}


export class surveyDatail {
  totalLines: number;
  totalMarkers: number;
  totalSurveyed: number;
  totalRevisit:number;
  wardMarkers: number;
  wardSurveyed: number;
  wardRevisit: number;
}
