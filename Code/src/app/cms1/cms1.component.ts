import { Component, OnInit } from '@angular/core';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { HttpClient } from "@angular/common/http";
import * as XLSX from 'xlsx';

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

  updateCardWardMapping() {

    return;


    let dbPath = "HousesCollectionInfo/55/2022/March/2022-03-21";
    let collectionInstance = this.db.object(dbPath).valueChanges().subscribe(
      collectionData => {
        collectionInstance.unsubscribe();
        if (collectionData != null) {
          let keyArray = Object.keys(collectionData);
          for (let i = 0; i < keyArray.length; i++) {
            let cardNo = keyArray[i];
            for (let j = 1; j <= 311; j++) {
              dbPath = "Houses/55/" + j + "/" + cardNo;
              let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
                data => {
                  houseInstance.unsubscribe();
                  if (data != null) {
                    let lineNo = data["line"];
                    let cardNumber = data["cardNo"];
                    console.log(cardNumber + " > " + lineNo);
                    this.db.object("CardWardMapping/" + cardNumber).update({ line: lineNo, ward: "55" });

                  }
                }
              );

            }
          }
        }
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

  updateWardDustbin() {
    let dbPath = "DustbinData/DustbinDetails";
    let wardDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        wardDustbinInstance.unsubscribe();
        if (data != null) {
          console.log(data);
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let dustbin = keyArray[i];
              let zone = data[dustbin]["zone"];
              dbPath = "DustbinData/DustbinDetails/" + dustbin + "/";
              // this.db.object(dbPath).update({ward: zone});
            }
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

  getJulyData() {
    let month = 7;
    for (let i = 1; i <= 150; i++) {
      let dbPath = "WasteCollectionInfo/" + i + "/2021/July";
      let dataInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          if (data != null) {
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
    //for (let i = 136; i <= 136; i++) {
    let wardNo = 1000;
    this.httpService.get("../../assets/jsons/WardLineLength/test/" + wardNo + ".json").subscribe(data => {
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
    //}
  }



  getWastebinData() {
    let userList = [];
    let lengthStr = "";
    let dbPath = "WastebinMonitor/Users";
    let lineInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        lineInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let userId = keyArray[i];
              let name = data[userId]["name"];
              let count = 0;
              let startDate = "";
              let endDate = "";
              let dateList = [];
              userList.push({ userId: userId, name: name, count: count, startDate: startDate, endDate: endDate, dateList: dateList });
              let dbPath = "WastebinMonitor/UserImageRef/" + userId;
              let imageInstance = this.db.list(dbPath).valueChanges().subscribe(
                imageData => {
                  imageInstance.unsubscribe();
                  // console.log(userId+" "+imageData);
                  if (imageData.length > 0) {
                    let detail = userList.find(item => item.userId == userId);
                    if (detail != undefined) {
                      detail.count = imageData.length;
                      for (let i = 0; i < imageData.length; i++) {
                        let imageName = imageData[i];
                        let date = "";
                        if (imageName.split('~')[0] == "2021") {
                          date = imageName.split('~')[2];
                        }
                        else {
                          date = imageName.split('~')[1];
                        }
                        if (date != "") {
                          let timeStamps = new Date(date).getTime();
                          detail.dateList.push({ date: date, timeStamps: timeStamps });
                        }
                      }
                      detail.dateList = detail.dateList.sort((a, b) =>
                        b.timeStamps > a.timeStamps ? 1 : -1
                      );
                      detail.startDate = detail.dateList[detail.dateList.length - 1]["date"];
                      detail.endDate = detail.dateList[0]["date"];
                    }
                  }
                });
            }
            setTimeout(() => {
              this.exportexcel(userList);
            }, 6000);

          }
        }
      });
  }

  exportexcel(userList: any): void {
    let htmlString = "";
    if (userList.length > 0) {
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Name";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Start Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "End Date";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Image Count";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < userList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += userList[i]["name"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += userList[i]["startDate"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += userList[i]["endDate"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += userList[i]["count"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "</table>";
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    let fileName = "Wastebin.xlsx";
    XLSX.writeFile(wb, fileName);
  }

  downloadSikarDustbin() {
    let dustbinList = JSON.parse(localStorage.getItem("dustbin"));
    let dustbinListExcel = [];
    if (dustbinList != null) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Zone";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Lat";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Lng";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Dustbin Address";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < dustbinList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += dustbinList[i]["zone"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += dustbinList[i]["lat"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += dustbinList[i]["lng"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += dustbinList[i]["address"];
        htmlString += "</td>";
        htmlString += "</tr>";

      }
      htmlString += "</table>";

      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlString, 'text/html');
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

      /* generate workbook and add the worksheet */
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      /* save to file */
      XLSX.writeFile(wb, "Sikar_Dustbin.xlsx");
    }
  }

  updateGarbageData() {
    let userID = "04ZR7M0KarbLlReZaMmM4sUnnZK2";
    let year = "2022";
    let month = "April";
    let date = "2022-04-06";
    let lastKey = 0
    let dbPath = "WastebinMonitor/ImagesData/" + year + "/" + month + "/" + date + "/1";
    let imageDataInstance = this.db.object(dbPath).valueChanges().subscribe(
      imageData => {
        imageDataInstance.unsubscribe();
        if (imageData != null) {
          dbPath = "WastebinMonitor/ImagesData/" + year + "/" + month + "/" + date + "/2/lastKey";
          let lastKeyInstance = this.db.object(dbPath).valueChanges().subscribe(
            lastKeyData => {
              lastKeyInstance.unsubscribe();
              if (lastKeyData != null) {
                lastKey = Number(lastKeyData);
              }
              console.log("Pre Last Key : " + lastKey)
              let keyArray = Object.keys(imageData);
              let count = 0;
              for (let i = 0; i < keyArray.length; i++) {
                let id = keyArray[i];
                if (id != "lastKey") {
                  if (imageData[id]["user"] == userID) {
                    count++;
                    const data = imageData[id];
                    lastKey++;
                    let dbPath1 = "WastebinMonitor/ImagesData/" + year + "/" + month + "/" + date + "/2/" + lastKey;
                    this.db.object(dbPath1).update(data);
                    let dbPathDelete = "WastebinMonitor/ImagesData/" + year + "/" + month + "/" + date + "/1/" + id;
                    this.db.object(dbPathDelete).remove();
                  }
                }
              }
              console.log("Last Key : " + lastKey);
              let dbPathLastKey = "WastebinMonitor/ImagesData/" + year + "/" + month + "/" + date + "/2/";
              this.db.object(dbPathLastKey).update({ lastKey: lastKey });
              console.log("count : " + count);

            }
          );
        }
      }
    );


  }


  arrayBuffer: any;
  first_sheet_name: any;

  uploadDustbinData() {
    let element = <HTMLInputElement>document.getElementById("fileUpload");
    let file = element.files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      this.first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[this.first_sheet_name];
      let fileList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      console.log(fileList);
      let key = 1;
      const jsonObj = {};
      for (let i = 0; i < fileList.length; i++) {
        let address = fileList[i]["Ward No"];
        let lat = fileList[i]["Latitude"];
        let lng = fileList[i]["Longitude"];
        const data = {
          address: address,
          lat: lat,
          lng: lng,
          isApproved: false,
          pickFrequency: "1",
          type: "Rectangular",
          ward: "0",
          zone: "A",
          createdDate: "2022-04-19"
        }
        jsonObj[key] = data;
        key++;
      }
      console.log(jsonObj);
      this.db.object("DustbinData/DustbinDetails").update(jsonObj);

    }
  }

  checkMarkerCount() {
    let wardNo = "2_3";
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let totalMarkerCount = 0;
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length - 1; i++) {
            let lineNo = Number(keyArray[i]);
            let lineObj = data[lineNo];
            let lineArray = Object.keys(lineObj);
            let markerCount = 0;
            let lastMarkerKey = 0;
            for (let j = 0; j < lineArray.length; j++) {
              let markerNo = lineArray[j];
              if (lineObj[markerNo]["latLng"] != undefined) {
                lastMarkerKey = Number(markerNo);
                totalMarkerCount++;
                markerCount++;
              }
            }
            console.log(lineNo + " ==> " + markerCount);
            console.log("last Marker Key : " + lastMarkerKey);
            dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/";
            this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey, marksCount: markerCount });
          }
          console.log(totalMarkerCount);
          dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "";
          this.db.object(dbPath).update({ marked: totalMarkerCount });
        }
      }
    );

  }

  exportCardNo() {
    let houseList = [];
    let dbPath = "Houses";
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      houseInstance.unsubscribe();
      let keyArray = Object.keys(data);
      for (let i = 0; i < keyArray.length; i++) {
        let wardObj = data[keyArray[i]];
        let wardArray = Object.keys(wardObj);
        for (let j = 0; j < wardArray.length; j++) {
          let lineObj = wardObj[wardArray[j]];
          let cardArray = Object.keys(lineObj);
          for (let k = 0; k < cardArray.length; k++) {
            let cardNo = cardArray[k];
            houseList.push({ cardNo: cardNo });
            // console.log(cardNo);
          }
        }
      }
      if (houseList.length > 0) {
        console.log(houseList);
        let htmlString = "";
        htmlString = "<table>";
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "cardNo";
        htmlString += "</td>";
        htmlString += "</tr>";
        for (let i = 0; i < houseList.length; i++) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += houseList[i]["cardNo"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }
        htmlString += "<table>";
        var parser = new DOMParser();
        var doc = parser.parseFromString(htmlString, 'text/html');
        const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        /* save to file */
        XLSX.writeFile(wb, "houses.xlsx");
      }

    });
  }

  updateMarkingData() {
    let markerList = [];
    let wardNo = "21_28";
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markerInstance.unsubscribe();
        let keyArray = Object.keys(markerData);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          let markerObj = markerData[lineNo];
          let markerArray = Object.keys(markerObj);
          let markerCount = 0;
          let lastMarkerKey = 0;
          for (let j = 0; j < markerArray.length; j++) {
            let index = markerArray[j];
            if (markerObj[index]["cardNumber"] != null) {
              markerCount++;
              markerList.push({ lineNo: lineNo, cardNo: markerObj[index]["cardNumber"] });
            }
          }
          dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/";
          // this.db.object(dbPath).update({surveyedCount: markerCount });
        }
        console.log(markerList);
        // dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "";
        // this.db.object(dbPath).update({ marked: markerList.length });
      }
    );
  }

  addHouse() {
    let zoneNo = $("#txtZoneNo").val();
    let lineNo = $("#txtLineNo").val();
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
    let markingInstance = this.db.object(dbPath).valueChanges(
      markerData => {
        markingInstance.unsubscribe();
        if (markerData != null) {
          let keyArray = Object.keys(markerData);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (markerData[index]["latLng"] != null) {
                if (markerData[index]["cardNumber"] == null) {

                }
              }
            }
          }
        }
      }
    );
  }



}
