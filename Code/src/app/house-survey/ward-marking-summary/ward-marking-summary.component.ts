import { LineCardMappingComponent } from './../../line-card-mapping/line-card-mapping.component';
import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-ward-marking-summary",
  templateUrl: "./ward-marking-summary.component.html",
  styleUrls: ["./ward-marking-summary.component.scss"],
})
export class WardMarkingSummaryComponent implements OnInit {
  constructor(
    public fs: FirebaseService,
    private commonService: CommonService,
    private modalService: NgbModal
  ) { }
  selectedCircle: any;
  wardProgressList: any[] = [];
  wardProgressListShow: any[] = [];
  wardList: any[] = [];
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
            alreadyInstalled: 0
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
      wardNo;
    let markerInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        markerInstance.unsubscribe();
        if (data != null) {
          let markers = Number(data["marked"]);
          let alreadyInstalled = 0;
          if (data["alreadyInstalled"] != null) {
            alreadyInstalled = Number(data["alreadyInstalled"]);
            this.markerData.totalAlreadyCard = this.markerData.totalAlreadyCard + alreadyInstalled;
          }
          this.wardProgressList[index]["markers"] = markers;
          this.wardProgressList[index]["alreadyInstalled"] = alreadyInstalled;
          this.markerData.totalMarkers = this.markerData.totalMarkers + markers;
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
    if (this.isFirst == false) {
      this.setActiveClass(listIndex);
    } else {
      this.isFirst = false;
    }
    this.lineMarkerList = [];
    this.markerList = [];
    let wardLineCount = this.db
      .object("WardLines/" + wardNo + "")
      .valueChanges()
      .subscribe((lineCount) => {
        wardLineCount.unsubscribe();
        if (lineCount != null) {
          this.wardLines = Number(lineCount);
          this.markerData.totalLines = this.wardLines;
          for (let i = 1; i <= this.wardLines; i++) {
            this.lineMarkerList.push({ lineNo: i, markers: 0, isApproved: false,alreadyCard:0 });
            let dbPath =
              "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i;
            let houseInstance = this.db
              .object(dbPath)
              .valueChanges()
              .subscribe((data) => {
                houseInstance.unsubscribe();
                if (data != null) {
                  let lineNo = i;
                  let isApproved = false;
                  let markers = 0;
                  let alreadyCard=0;

                  let keyArray = Object.keys(data);
                  if (keyArray.length > 0) {
                    for (let j = 0; j < keyArray.length; j++) {
                      let index = keyArray[j];
                      if (index == "ApproveStatus") {
                        if (data[index]["status"] == "Confirm") {
                          this.markerData.wardApprovedLines = this.markerData.wardApprovedLines + 1;
                          isApproved = true;
                        }
                      }
                      else if (index == "marksCount") {
                        this.markerData.wardMarkers = this.markerData.wardMarkers + Number(data[index]);
                        markers = Number(data[index]);
                      }
                      else {
                        if (index != "lastMarkerKey") {
                          let lineNo = i;
                          let alreadyInstalled = "नहीं";
                          if (data[index]["latLng"] != undefined) {
                            if (data[index]["alreadyInstalled"] == true) {
                              this.markerData.wardInstalled =
                                this.markerData.wardInstalled + 1;
                              alreadyInstalled = "हाँ";
                              alreadyCard=alreadyCard+1;
                            }
                            let imageName = data[index]["image"];
                            let userId = data[index]["userId"];
                            let date = data[index]["date"].split(" ")[0];
                            let status = "";
                            if (data[index]["status"] != null) {
                              status = data[index]["status"];
                            }
                            let city =
                              this.cityName.charAt(0).toUpperCase() +
                              this.cityName.slice(1);

                            let imageUrl =
                              "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" +
                              city +
                              "%2FMarkingSurveyImages%2F" +
                              wardNo +
                              "%2F" +
                              i +
                              "%2F" +
                              imageName +
                              "?alt=media";
                            let type = data[index]["houseType"];
                            let dbPath1 = "Defaults/FinalHousesType/" + type + "/name";
                            let houseInstance1 = this.db
                              .object(dbPath1)
                              .valueChanges()
                              .subscribe((data) => {
                                houseInstance1.unsubscribe();
                                if (data != null) {
                                  let houseType = data.toString().split("(")[0];
                                  this.markerList.push({
                                    lineNo:lineNo,
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
                    let lineDetail=this.lineMarkerList.find(item=>item.lineNo==lineNo);
                    if(lineDetail!=undefined){
                      lineDetail.markers=markers;
                      lineDetail.alreadyCard=alreadyCard;
                      lineDetail.isApproved=isApproved;
                    }
                    
                  }
                }
              });

          }
          /*
          for (let i = 1; i <= this.wardLines; i++) {
            let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i + "/marksCount";
            let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
              data => {
                markerInstance.unsubscribe();
                let markers = 0;
                if (data != null) {
                  markers = Number(data);
                }
                dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + i + "/ApproveStatus/status";
                let statusInstance = this.db.object(dbPath).valueChanges().subscribe(
                  statusData => {
                    let isApproved = false;
                    statusInstance.unsubscribe();
                    if (statusData != null) {
                      if (statusData == "Confirm") {
                        isApproved = true;
                      }
                    }
                    this.lineMarkerList.push({ lineNo: i, markers: markers, isApproved: isApproved, wardNo: wardNo });
                  });

              }
            );
          }
          */
        }
      });
  }

  //#endregion


  showLineDetail(content: any, wardNo: any, lineNo: any) {
    this.markerDetailList=[];
    if (this.markerList.length > 0) {
      this.markerDetailList = this.markerList.filter((item) => item.lineNo == lineNo)
      {
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
    }

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
