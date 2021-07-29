import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";

@Component({
  selector: "app-ward-survey-summary",
  templateUrl: "./ward-survey-summary.component.html",
  styleUrls: ["./ward-survey-summary.component.scss"],
})
export class WardSurveySummaryComponent implements OnInit {
  constructor(
    public db: AngularFireDatabase,
    private commonService: CommonService
  ) {}

  selectedCircle: any;
  wardProgressList: any[] = [];
  wardProgressListShow: any[] = [];
  wardList: any[] = [];
  cityName: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );
    this.getWards();
    this.selectedCircle = "Circle1";
  }

  getWards() {
    let dbPath = "Defaults/CircleWiseWards";
    let circleWiseWard = this.db
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
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
        console.log(this.wardList);
        this.onSubmit();
      });
  }

  changeCircleSelection(filterVal: any) {
    this.selectedCircle = filterVal;
    this.onSubmit();
  }
  onSubmit() {
    this.wardProgressList = [];
    if (this.wardList.length > 0) {
      let circleWardList = this.wardList.filter(
        (item) => item.circle == this.selectedCircle
      );
      if (circleWardList.length > 0) {
        for (let i = 0; i < circleWardList.length; i++) {
          let wardNo = circleWardList[i]["wardNo"];
          let url = this.cityName + "/13D/ward-survey-analysis/" + wardNo;
          this.wardProgressList.push({
            wardNo: wardNo,
            markers: 0,
            surveyed: 0,
            percentage: 0,
            url: url,
          });
          this.getWardSummary(i, wardNo);
        }
      }
    }
  }

  getWardSummary(index: any, wardNo: any) {
    let dbPath =
      "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" +
      wardNo +
      "/total";
    let markerInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          let markers = Number(data);
          this.wardProgressList[index]["markers"] = markers;
          dbPath = "EntitySurveyData/TotalHouseCount/" + wardNo;
          let surveyedInstance = this.db
            .object(dbPath)
            .valueChanges()
            .subscribe((data) => {
              surveyedInstance.unsubscribe();
              if (data != null) {
                let surveyed = Number(data);
                this.wardProgressList[index]["surveyed"] = surveyed;
                
                let percentage =
                  (surveyed * 100) /
                  Number(this.wardProgressList[index]["markers"]);
                  if(percentage%1==0){
                    this.wardProgressList[index]["percentage"] = percentage.toFixed(0);
                  }
                  else
                  {
                    this.wardProgressList[index]["percentage"] = percentage.toFixed(2);
                  }                
              }
            });
        }
      });
  }
}
