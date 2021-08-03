import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-ward-marking-summary",
  templateUrl: "./ward-marking-summary.component.html",
  styleUrls: ["./ward-marking-summary.component.scss"],
})
export class WardMarkingSummaryComponent implements OnInit {
  constructor(
    public fs: FirebaseService,
    private commonService: CommonService
  ) {}
  selectedCircle: any;
  wardProgressList: any[] = [];
  wardProgressListShow: any[] = [];
  wardList: any[] = [];
  cityName: any;
  db: any;
  isFirst = true;
  lineMarkerList: any[];
  wardLines: any;
  markerData: markerDatail = {
    totalLines: "0",
  };
  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
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
          let url = this.cityName + "/13A3/house-marking/" + wardNo;
          this.wardProgressList.push({
            wardNo: wardNo,
            markers: 0,
            url: url,
          });

          if (i == 0) {
            this.getMarkingDetail(wardNo, 0);
            setTimeout(() => {
              $("#tr0").addClass("active");
            }, 600);
          }
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

  getMarkingDetail(wardNo: any, index: any) {
    if (this.isFirst == false) {
      this.setActiveClass(index);
    } else {
      this.isFirst = false;
    }
    this.lineMarkerList = [];
    let wardLineCount = this.db
      .object("WardLines/" + wardNo + "")
      .valueChanges()
      .subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          this.wardLines = Number(lineCount);
          this.markerData.totalLines = this.wardLines;
          for (let i = 1; i <= this.wardLines; i++) {
            let dbPath="EntityMarkingData/MarkedHouses/"+wardNo+"/"+i+"/marksCount";
            let markerInstance=this.db.object(dbPath).valueChanges().subscribe(
              data=>{
                markerInstance.unsubscribe();
                let markers=0;
                if(data!=null){
                  markers=Number(data);
                }
                this.lineMarkerList.push({lineNo:i,markers:markers});
              }
            );
          }
        }
      });
  }

  //#endregion

  //#region  List Detail
}
export class markerDatail {
  totalLines: string;
}
