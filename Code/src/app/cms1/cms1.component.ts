import { Component, OnInit } from '@angular/core';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-cms1',
  templateUrl: './cms1.component.html',
  styleUrls: ['./cms1.component.scss']
})
export class Cms1Component implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
  }

  setSurveyorId() {
    let dbPath = "EntitySurveyData/HistoryRFIDNotFoundSurvey/1000";
    let dataInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        dataInstance.unsubscribe();
        console.log(data);
      }
    );
  }

  setData() {
    let date = "2021-10-04";
    let dbPath = "WastebinMonitor/ImagesData/" + date;
    let dataInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        dataInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let transferIndex = 0;
            let openIndex = 0;
            let litterIndex = 0;
            let roadIndex = 0;
            let addindex = 0;
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (data[index]["category"] != null) {
                let dataObject = data[index];
                let category = data[index]["category"];
                if (category == "1") {
                  transferIndex = transferIndex + 1;
                  addindex = transferIndex;
                } else if (category == "2") {
                  openIndex = openIndex + 1;
                  addindex = openIndex;
                } else if (category == "3") {
                  litterIndex = litterIndex + 1;
                  addindex = litterIndex;
                } else if (category == "4") {
                  roadIndex = roadIndex + 1;
                  addindex = roadIndex;
                }
                dbPath = "WastebinMonitor/ImagesData/2021/October/" + date + "/" + category + "/" + addindex;
                this.db.object(dbPath).update(dataObject);
              }
            }

            let preTotal = 0 + transferIndex;
            dbPath = "WastebinMonitor/Summary/CategoryWise/1";
            this.db.object(dbPath).update({ totalCount: preTotal });

            preTotal = 783 + openIndex;
            dbPath = "WastebinMonitor/Summary/CategoryWise/2";
            this.db.object(dbPath).update({ totalCount: preTotal });

            preTotal = 28 + litterIndex;
            dbPath = "WastebinMonitor/Summary/CategoryWise/3";
            this.db.object(dbPath).update({ totalCount: preTotal });

            preTotal = 1 + roadIndex;
            dbPath = "WastebinMonitor/Summary/CategoryWise/4";
            this.db.object(dbPath).update({ totalCount: preTotal });

            //  this.getCategoryWiseTotal(transferIndex, "1");
            //   this.getCategoryWiseTotal(openIndex, "2");
            //  this.getCategoryWiseTotal(litterIndex, "3");
            //   this.getCategoryWiseTotal(roadIndex, "4");

            this.getDateWiseTotal(transferIndex, "1", date);
            this.getDateWiseTotal(openIndex, "2", date);
            this.getDateWiseTotal(litterIndex, "3", date);
            this.getDateWiseTotal(roadIndex, "4", date);


            // let total = transferIndex + openIndex + litterIndex + roadIndex;

            dbPath = "WastebinMonitor/Summary/CategoryWise/totalCount";
            let totalInstance = this.db.object(dbPath).valueChanges().subscribe(
              count => {
                totalInstance.unsubscribe();
                let total = 812 + transferIndex + openIndex + litterIndex + roadIndex;
                // if (count != null) {
                //    total = 267 + Number(total);
                //  }
                dbPath = "WastebinMonitor/Summary/CategoryWise";
                this.db.object(dbPath).update({ totalCount: total });
              }
            );

            dbPath = "WastebinMonitor/Summary/DateWise/" + date + "/totalCount";
            let dateWiseInstance = this.db.object(dbPath).valueChanges().subscribe(
              count => {
                dateWiseInstance.unsubscribe();
                let total1 = transferIndex + openIndex + litterIndex + roadIndex;
                // if (count != null) {
                //   total = 267 + Number(total);
                // }
                dbPath = "WastebinMonitor/Summary/DateWise/" + date;
                this.db.object(dbPath).update({ totalCount: total1 });
              }
            );
          }
        }
      }
    );
  }

  getCategoryWiseTotal(total: any, category: any) {
    let dbPath = "WastebinMonitor/Summary/CategoryWise/" + category + "/totalCount";
    let categoryInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        categoryInstance.unsubscribe();
        if (count != null) {

          total = Number(count) + Number(total);
        }
        dbPath = "WastebinMonitor/Summary/CategoryWise/" + category;
        this.db.object(dbPath).update({ totalCount: total });
      }
    );
  }

  getDateWiseTotal(total: any, category: any, date: any) {
    let dbPath = "WastebinMonitor/Summary/DateWise/" + date + "/" + category + "/totalCount";
    let categoryInstance = this.db.object(dbPath).valueChanges().subscribe(
      count => {
        categoryInstance.unsubscribe();
        if (count != null) {
          total = Number(total);
        }
        dbPath = "WastebinMonitor/Summary/DateWise/" + date + "/" + category;
        this.db.object(dbPath).update({ totalCount: total });
      }
    );
  }

  setWasteCollectionInfoData() {
    let year = Number($('#txtYear').val());
    let wardNo = Number($('#txtWardNo').val());
    let wardTotalLength = Number($('#txtWardTotalLength').val());
    let month = Number($('#txtMonth').val());
    let date = $('#txtDate').val();
    if (wardNo == 0) {
      this.commonService.setAlertMessage("error", "Please enter ward No.");
      return;
    }

    if (wardTotalLength == 0) {
      this.commonService.setAlertMessage("error", "Please enter ward total length");
      return;
    }

    if (date == "") {
      if (month == 0) {
        this.commonService.setAlertMessage("error", "Please enter month or date");
        return;
      }
    }

    let days = new Date(year, month, 0).getDate();
    this.commonService.getWardLineLength(wardNo).then((lengthList: any) => {
      if (lengthList != null) {
        let wardLineLengthList = JSON.parse(lengthList);
        if (date == "") {
          for (let i = 1; i <= days; i++) {
            let monthDate = year + '-' + (month < 10 ? '0' : '') + month + '-' + (i < 10 ? '0' : '') + i;
            let monthName = this.commonService.getCurrentMonthName(new Date(monthDate).getMonth());
            let dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + monthDate + "/LineStatus";
            let wasteInstance = this.db.object(dbPath).valueChanges().subscribe(
              data => {
                wasteInstance.unsubscribe();
                if (data != null) {
                  let keyArray = Object.keys(data);
                  if (keyArray.length > 0) {
                    let coveredLength = 0;
                    for (let j = 0; j < keyArray.length; j++) {
                      let lineNo = keyArray[j];
                      let time = "00:00:58";
                      if (data[lineNo]["Time"] != null) {
                        time = data[lineNo]["Time"];
                      }
                      else {
                        if (data[lineNo]["Status"] == null) {
                          time = data[lineNo];
                        }
                      }
                      let lineDetail = wardLineLengthList.find(item => item.lineNo == lineNo);
                      if (lineDetail != undefined) {
                        dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + monthDate + "/LineStatus/" + lineNo;
                        this.db.database.ref(dbPath).set(time);
                        coveredLength = coveredLength + Number(lineDetail.length);
                      }
                    }
                    let workPerc = Math.round((coveredLength * 100) / wardTotalLength);
                    dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + monthDate + "/Summary";
                    const data1 = {
                      coveredLength: coveredLength.toFixed(0),
                      workPerc: workPerc
                    }
                    this.db.object(dbPath).update(data1);
                    console.log(wardNo);
                    console.log(monthDate);
                    console.log(coveredLength);
                    console.log(workPerc + "%")
                  }
                }
              }
            );
          }
        }
        else {
          let month = Number(date.toString().split('-')[1])
          let monthDate = date;
          let monthName = this.commonService.getCurrentMonthName(month - 1);

          let dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + monthDate + "/LineStatus";
          let wasteInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              wasteInstance.unsubscribe();
              if (data != null) {
                let keyArray = Object.keys(data);
                if (keyArray.length > 0) {
                  let coveredLength = 0;
                  for (let j = 0; j < keyArray.length; j++) {
                    let lineNo = keyArray[j];
                    let time = "00:00:58";
                    if (data[lineNo]["Time"] != null) {
                      time = data[lineNo]["Time"];
                    }
                    else {
                      if (data[lineNo]["Status"] == null) {
                        time = data[lineNo];
                      }
                    }
                    let lineDetail = wardLineLengthList.find(item => item.lineNo == lineNo);
                    if (lineDetail != undefined) {
                      dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + monthDate + "/LineStatus/" + lineNo;
                      this.db.database.ref(dbPath).set(time);
                      coveredLength = coveredLength + Number(lineDetail.length);
                    }
                  }
                  let workPerc = Math.round((coveredLength * 100) / wardTotalLength);
                  dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + monthDate + "/Summary";
                  const data1 = {
                    coveredLength: coveredLength.toFixed(0),
                    workPerc: workPerc
                  }
                  this.db.object(dbPath).update(data1);
                  console.log(wardNo);
                  console.log(monthDate);
                  console.log(coveredLength);
                  console.log(workPerc + "%")
                }
              }
            }
          );
        }
      }
    });
  }

  getJulyData()
  {
    let month=7;
    for(let i=1;i<=150;i++){
    let dbPath="WasteCollectionInfo/"+i+"/2021/July";
    let dataInstance=this.db.object(dbPath).valueChanges().subscribe(
      data=>{
        if(data!=null){
          console.log(i);
        }
      }
    );
    }

  }

  setSummary() {
    let year = Number($('#txtYear').val());
    let wardNo = Number($('#txtWardNo').val());
    let month = Number($('#txtMonth').val());
    if (wardNo == 0) {
      this.commonService.setAlertMessage("error", "Please enter ward No.");
      return;
    }
    if (month == 0) {
      this.commonService.setAlertMessage("error", "Please enter month or date");
      return;
    }
    for (let j = 1; j <= 150; j++) {
      wardNo = j;
      let days = new Date(year, month, 0).getDate();
      for (let i = 1; i <= days; i++) {
        let monthDate = year + '-' + (month < 10 ? '0' : '') + month + '-' + (i < 10 ? '0' : '') + i;
        let monthName = this.commonService.getCurrentMonthName(new Date(monthDate).getMonth());
        let dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + monthDate + "/Summary";
        let wasteInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            wasteInstance.unsubscribe();
            if (data != null) {
              if (data["wardCoveredDistance"] != null) {
                this.db.database.ref(dbPath + "/wardCoveredDistance").set(null);
              }
              if (data["completedLines"] != null) {
                this.db.database.ref(dbPath + "/completedLines").set(null);
              }
              if (data["workPercentage"] != null) {
                this.db.database.ref(dbPath + "/workPercentage").set(null);
              }
              if (data["analysedBy"] != null) {
                this.db.database.ref(dbPath + "/analysisDoneBy").set(data["analysedBy"]);
                this.db.database.ref(dbPath + "/analysedBy").set(null);
              }
              console.log(data);
            }
          });
      }
    }
  }

  setWardTotalLength() {
    for (let i = 1; i <= 1; i++) {
      let wardNo = i;
      this.httpService.get("../../assets/jsons/\WardLineLength/jaipur-greater/" + wardNo + ".json").subscribe(data => {
        if (data != null) {
          var keyArray = Object.keys(data);
          //console.log(data);
          if (keyArray.length > 0) {
            let dist = 0;
            for (let m = 0; m < keyArray.length; m++) {
              let lineNo = keyArray[m];
              dist = dist + Number(data[lineNo]);
              // console.log("line No. "+lineNo);
              // console.log(Number(data[lineNo]));
            }
            console.log("Ward No. " + wardNo);
            console.log(dist);

          }
        }
      })
    }
  }
}
