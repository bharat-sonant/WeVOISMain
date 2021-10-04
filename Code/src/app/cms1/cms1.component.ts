import { ObjectUnsubscribedError } from 'rxjs';
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
    let zoneList = [];
    let year = "2021";
    let monthName = "October";
    let date = "2021-10-03";
    for (let i = 1; i <= 150; i++) {
      let zoneNo = i;
      this.httpService.get("../../assets/jsons/JaipurGreater/" + zoneNo + ".json").subscribe(data => {
        if (data != null) {
          var keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let m = 1; m < keyArray.length; m++) {
              let lineNo = keyArray[m];
              let dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + date + "/LineStatus/" + lineNo + "/Status";
              let wasteInstance = this.db.object(dbPath).valueChanges().subscribe(
                wasteData => {
                  wasteInstance.unsubscribe();
                  if (wasteData != null) {
                    if (wasteData == "LineCompleted") {

                      if (data[lineNo]["points"] != null) {
                        var latLng = [];
                        for (let j = 0; j < data[lineNo]["points"].length; j++) {
                          latLng.push({ lat: data[lineNo]["points"][j][0], lng: data[lineNo]["points"][j][1] });
                        }
                        let dist = 0;
                        for (let k = latLng.length - 1; k > 0; k--) {
                          let lat1 = latLng[k]["lat"];
                          let lon1 = latLng[k]["lng"];
                          let lat2 = latLng[k - 1]["lat"];
                          let lon2 = latLng[k - 1]["lng"];

                          const R = 6377830; // metres
                          const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
                          const φ2 = lat2 * Math.PI / 180;
                          const Δφ = (lat2 - lat1) * Math.PI / 180;
                          const Δλ = (lon2 - lon1) * Math.PI / 180;

                          const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                            Math.cos(φ1) * Math.cos(φ2) *
                            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                          dist = dist + (R * c);

                        }
                        if (zoneList.length == 0) {
                          zoneList.push({ zone: zoneNo, dist: dist });
                        }
                        else {
                          let zoneLineList = zoneList.find(item => item.zone == zoneNo);
                          if (zoneLineList != undefined) {
                            zoneLineList.dist = Number(zoneLineList.dist) + dist;
                          }
                          else {
                            zoneList.push({ zone: zoneNo, dist: dist });
                          }
                        }
                      }
                    }
                  }
                }
              );
            }
          }
        }
      });
    }
    setTimeout(() => {
      for (let i = 1; i <= 150; i++) {
        let zoneNo = i;
        let dbPath = "WardRouteLength/" + zoneNo;
        let wardLengthInstance = this.db.object(dbPath).valueChanges().subscribe(
          wardLength => {
            wardLengthInstance.unsubscribe();
            if (wardLength != null) {
              let workPercentage = 0;
              let zoneLineList = zoneList.find(item => item.zone == zoneNo);
              if (zoneLineList != undefined) {
                workPercentage = Math.round((zoneLineList.dist * 100) / Number(wardLength));
                dbPath = "WasteCollectionInfo/" + zoneNo + "/" + year + "/" + monthName + "/" + date + "/Summary";
                this.db.object(dbPath).update({ wardCoveredDistance: zoneLineList.dist.toFixed(0) });
                this.db.object(dbPath).update({ workPercentage: workPercentage });
                console.log(workPercentage);
              }
            }
          }
        );
      }
    }, 12000);

  }
}
