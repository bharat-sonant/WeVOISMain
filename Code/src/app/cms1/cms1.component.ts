import { Component, OnInit } from '@angular/core';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { HttpClient } from "@angular/common/http";
import * as XLSX from 'xlsx';
import { AngularFireStorage } from "angularfire2/storage";
import { AngularFirestore } from "@angular/fire/firestore";
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-cms1',
  templateUrl: './cms1.component.html',
  styleUrls: ['./cms1.component.scss']
})
export class Cms1Component implements OnInit {

  constructor(public fs: FirebaseService,public dbFireStore: AngularFirestore, private storage: AngularFireStorage, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  nameList: any = [];
  cardTypeList: any[] = [];
  ngOnInit() {

    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.getNameList();
    //this.getCardTypeList();
  }

  createUserJson(){
    this.dbFireStore.collection("UserManagement").doc("Users").collection("Users").get().subscribe((ss) => {
      const document = ss.docs;
      const userJson={};
      document.forEach((doc) => {
       let userId=doc.data()["userId"];
       let data=doc.data();
       userJson[userId]=data;
      })
      console.log(userJson);
      this.commonService.saveCommonJsonFile(userJson, "PortalUsers.json", "/Common/");
    });
  }

  createHelperDevice() {
    this.addDevices(328,75);
  }

  addDevices(lastDevice: any, index: any) {
    index = index + 1;
    lastDevice=lastDevice+1;
    if (index <= 85) {
      let key = "DummyHelper" + index;
      const data = {
        appType: "2",
        lastActive: "25/07/2022 09:10",
        name: "JAI-" + lastDevice,
        readerAppVersion: "1.0.2.9",
        status: "1"
      }
      let dbPath="Devices/Jaipur-Malviyanagar/"+key;
      this.db.object(dbPath).update(data);
      this.addDevices(lastDevice,index);
    }
    else{
      this.db.object("Devices").update({LastConfigurationNo:lastDevice });
    }
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
      let key = 1;
      const jsonObj = {};
      for (let i = 0; i < fileList.length; i++) {
        let wardNo = fileList[i]["Ward Number"].split('.')[1].trim();
        let address = fileList[i]["Address"];
        let lat = fileList[i]["Lat."];
        let lng = fileList[i]["Long."];
        const data = {
          address: address,
          lat: lat,
          lng: lng,
          isApproved: false,
          pickFrequency: "1",
          type: "Rectangular",
          ward: wardNo,
          zone: "A",
          createdDate: "2022-04-19"
        }
        jsonObj[key] = data;
        key++;
      }
      console.log(jsonObj);
      this.db.object("DustbinData/DustbinDetails").set(jsonObj);

    }
  }

  markerSurveyUpdate(){
    let wardNo="128-R1";
    let lineNo="1";
    

  }

  removeLineApprove(){
    let wardNo = "18-R2";
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = Number(keyArray[i]);
            if(data[lineNo]["ApproveStatus"]!=null){
              dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/ApproveStatus";
              this.db.object(dbPath).remove();
            }
          }
          dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/"+wardNo;
          this.db.object(dbPath).update({approved:0,rejected:0});
        }
      }
    );
  }

  checkMarkerCount() {
    let wardNo = "129-R1";
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let totalMarkerCount = 0;
          let totalSurvey = 0
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = Number(keyArray[i]);
            let lineObj = data[lineNo];
            let lineArray = Object.keys(lineObj);
            let markerCount = 0;
            let lastMarkerKey = 0;
            let surveyCount = 0;
            for (let j = 0; j < lineArray.length; j++) {
              let markerNo = lineArray[j];
              if (lineObj[markerNo]["latLng"] != undefined) {
                lastMarkerKey = Number(markerNo);
                totalMarkerCount++;
                markerCount++;
              }
              if (lineObj[markerNo]["cardNumber"] != undefined) {
                surveyCount++;
                totalSurvey++;
              }
            }
            console.log(lineNo + " ==> " + markerCount + "  S = " + surveyCount);
            // console.log("last Marker Key : " + lastMarkerKey);
            dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/";
            this.db.object(dbPath).update({ marksCount: markerCount });
            this.db.object(dbPath).update({ surveyedCount: surveyCount });
          }
          console.log("totalMarkerCount => " + totalMarkerCount);
          console.log("totalSurvey => " + totalSurvey);
          dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "";
          this.db.object(dbPath).update({ marked: totalMarkerCount });
          // this.db.object(dbPath).update({ marked: totalSurvey });
          dbPath = "EntitySurveyData/TotalHouseCount/" + wardNo;
          this.db.database.ref(dbPath).set(totalSurvey);
        }
      }
    );

  }

  exportMarkers() {
    let houseTypeList = [];
    let dbPath = "Defaults/FinalHousesType/";
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe((data) => {
      houseInstance.unsubscribe();
      if (data != null) {
        let houseKeyArray = Object.keys(data);
        for (let i = 0; i < houseKeyArray.length; i++) {
          let id = houseKeyArray[i];
          let houseType = data[id]["name"].toString().split("(")[0];
          houseTypeList.push({ id: id, houseType: houseType });
        }

        let markerList = [];
        let dbPath = "EntityMarkingData/MarkedHouses/1";
        let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            markerInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              for (let i = 0; i < keyArray.length; i++) {
                let lineNo = keyArray[i];
                let markerObject = data[lineNo];

                let markerKeyList = Object.keys(markerObject);

                if (markerKeyList.length > 0) {
                  for (let j = 0; j < markerKeyList.length; j++) {
                    let markerId = markerKeyList[j];
                    if (markerObject[markerId]["latLng"] != null) {
                      let houseType = "";
                      let detail = houseTypeList.find(item => item.id == markerObject[markerId]["houseType"]);
                      if (detail != undefined) {
                        houseType = detail.houseType;
                      }
                      markerList.push({ lineNo: lineNo, date: markerObject[markerId]["date"], houseType: houseType, latLng: markerObject[markerId]["latLng"], image: markerObject[markerId]["image"], userId: markerObject[markerId]["userId"], alreadyInstalled: markerObject[markerId]["alreadyInstalled"] });
                    }
                  }
                }
              }
              console.log(markerList);
              let htmlString = "";
              htmlString = "<table>";
              htmlString += "<tr>";
              htmlString += "<td>";
              htmlString += "Line No.";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "Date";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "house Type";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "lat Lng";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "Image";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "User Id";
              htmlString += "</td>";
              htmlString += "<td>";
              htmlString += "Already Installed";
              htmlString += "</td>";
              htmlString += "</tr>";
              for (let i = 0; i < markerList.length; i++) {
                htmlString += "<tr>";
                htmlString += "<td>";
                htmlString += markerList[i]["lineNo"];
                htmlString += "</td>";
                htmlString += "<td t='s'>";
                htmlString += markerList[i]["date"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += markerList[i]["houseType"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += markerList[i]["latLng"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += markerList[i]["image"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += markerList[i]["userId"];
                htmlString += "</td>";
                htmlString += "<td>";
                htmlString += markerList[i]["alreadyInstalled"];
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
              XLSX.writeFile(wb, "Salasar-Markers.xlsx");
            }
          }

        );


      }


    });

  }

  getD2DMatkers() {
    let wardNo = "139-R1";
    let todayDate = "2022-07-12";
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
      markerInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let lineNo = keyArray[i];
          let lineObject = data[lineNo];
          let lineKeyArray = Object.keys(lineObject);
          for (let j = 0; j < lineKeyArray.length; j++) {
            let markerNo = lineKeyArray[j];
            if (lineObject[markerNo]["date"] != null) {
              let date = lineObject[markerNo]["date"];
              if (date.includes(todayDate)) {
                let markerData = lineObject[markerNo];
                console.log(markerData);
                dbPath = "EntityMarkingData/MarkedHousesNew/" + wardNo + "/" + lineNo + "/" + markerNo;
                this.db.object(dbPath).update(markerData);
              }
            }
          }
        }
      }
    });

  }

  updateMalviyaNagarData() {
    let wardNo = "140-R1";
    let lineNo = "10";
    let dbPath = "EntityMarkingData/MarkedHousesNew/" + wardNo + "/" + lineNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let markerCount = keyArray.length;
            dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/lastMarkerKey";
            let markerCountInstance = this.db.object(dbPath).valueChanges().subscribe(
              lastKeyData => {
                markerCountInstance.unsubscribe();
                let lastMarkerKey = markerCount;
                let lastKey = 0;
                if (lastKeyData != null) {
                  lastKey = Number(lastKeyData);
                  lastMarkerKey = Number(lastKeyData) + markerCount;
                }
                for (let i = 0; i < keyArray.length; i++) {
                  let markerNo = keyArray[i];
                  let markerData = data[markerNo];
                  lastKey = lastKey + 1;
                  dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/" + lastKey;
                  this.db.object(dbPath).update(markerData);
                }
                dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo;
                this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
                this.setTotal(wardNo, lineNo, markerCount);
              });
          }
        }
      }
    );
  }

  setTotal(wardNo: any, lineNo: any, markerCount: any) {
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo + "/marksCount";
    let markerCountInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerCountInstance.unsubscribe();
        let count = markerCount;
        if (data != null) {
          count = count + Number(data);
        }
        dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "/" + lineNo;
        this.db.object(dbPath).update({ marksCount: count });
      }
    );

    // datewise total

    dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/2022-07-12/" + wardNo + "/marked";
    let dateMarkedInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        dateMarkedInstance.unsubscribe();
        let markedCount = markerCount;
        if (data != null) {
          markedCount = markedCount + Number(data);
        }
        dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/DateWise/2022-07-12/" + wardNo;
        this.db.object(dbPath).update({ marked: markedCount });
      }
    );

    // ward wise total
    dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo + "/marked";
    let wardInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        wardInstance.unsubscribe();
        let wardTotalCount = markerCount;
        if (data != null) {
          wardTotalCount = wardTotalCount + Number(data);
        }
        dbPath = "EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/" + wardNo;
        this.db.object(dbPath).update({ marked: wardTotalCount });
      }
    );

  }

  moveMalviyanagarImages() {

    let wardNo = "125-R1";
    let dbPath = "EntityMarkingData/MarkedHouses/" + wardNo;
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let lineObject = data[lineNo];
              let lineKeyArray = Object.keys(lineObject);
              for (let j = 0; j < lineKeyArray.length; j++) {
                let markerNo = lineKeyArray[j];
                if (lineObject[markerNo]["image"] != null) {
                  let image = lineObject[markerNo]["image"];
                  let imageId = image.split('.')[0];
                  //if (imageId == markerNo) {
                  console.log("lineNo : " + lineNo + " markerNo : " + markerNo + " image : " + imageId);
                  const pathOld = "JaipurD2D/MarkingSurveyImages/" + wardNo + "/" + lineNo + "/" + image;
                  const ref = this.storage.storage.app.storage("https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/").ref(pathOld);
                  ref.getDownloadURL()
                    .then((url) => {
                      var xhr = new XMLHttpRequest();
                      xhr.responseType = 'blob';
                      xhr.onload = (event) => {
                        var blob = xhr.response;
                        const pathNew = "Jaipur-Malviyanagar/MarkingSurveyImagesNew/" + wardNo + "/" + lineNo + "/" + image;
                        const ref1 = this.storage.storage.app.storage("https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/").ref(pathNew);
                        ref1.put(blob).then((promise) => {

                        });
                      };
                      xhr.open('GET', url);

                      xhr.send();
                    })
                    .catch((error) => {
                    });
                  //}
                }
              }
            }
          }
        }
      });
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

  moveMarker() {
    let zoneNo = $("#txtZoneNo").val();
    let dbPath = "Houses/" + zoneNo;
    let markingInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markingInstance.unsubscribe();
        if (markerData != null) {
          let keyArray = Object.keys(markerData);
          for (let i = 0; i < keyArray.length; i++) {
            let lineNo = keyArray[i];
            let cardObj = markerData[lineNo];
            let cardArray = Object.keys(cardObj);

            console.log(lineNo + " => " + cardArray.length);
          }
        }
      });

  }

  addHouseToMarker() {
    let zoneNo = $("#txtZoneNo").val();
    let lineNo = $("#txtLineNo").val();
    let dbPath = "Houses/" + zoneNo + "/" + lineNo;
    let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
      houseData => {
        houseInstance.unsubscribe();
        if (houseData != null) {
          let keyArray = Object.keys(houseData);

          for (let i = 0; i < keyArray.length; i++) {

            let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
            let markingInstance = this.db.object(dbPath).valueChanges().subscribe(
              markerData => {
                markingInstance.unsubscribe();
                if (markerData != null) {
                  let cardNo = keyArray[i];
                  // console.log(cardNo);
                  let isCard = false;
                  let markerArray = Object.keys(markerData);
                  for (let j = 0; j < markerArray.length; j++) {
                    let index = markerArray[j];
                    if (markerData[index]["cardNumber"] != null) {
                      if (cardNo == markerData[index]["cardNumber"]) {
                        isCard = true;
                        j = markerArray.length;
                      }
                    }
                  }
                  if (isCard == false) {
                    console.log("cardNo : " + cardNo);

                  }
                }
              });

          }
        }
      });
  }





  addHouse() {
    let zoneNo = $("#txtZoneNo").val();
    let lineNo = $("#txtLineNo").val();
    let cardNoCount = Number(localStorage.getItem("cardNoCount"));
    let rfIdCount = Number(localStorage.getItem("rfIdCount"));
    console.log(cardNoCount);
    console.log(rfIdCount);
    let surveyedCount = 0;
    let currentSurveyCount = 0;
    let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
    console.log(dbPath);
    let markingInstance = this.db.object(dbPath).valueChanges().subscribe(
      markerData => {
        markingInstance.unsubscribe();
        if (markerData != null) {
          let keyArray = Object.keys(markerData);
          if (markerData["surveyedCount"] != null) {
            surveyedCount = Number(markerData["surveyedCount"]);
          }
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (markerData[index]["latLng"] != null) {
                if (markerData[index]["cardNumber"] == null) {
                  cardNoCount++;
                  rfIdCount++;
                  surveyedCount++;
                  currentSurveyCount++;
                  let cardNo = "KNGH" + cardNoCount;
                  let rfId = "081099" + rfIdCount;
                  let markerObject = markerData[index];
                  this.generateMobileNo(markerObject, cardNo, rfId, index, zoneNo, lineNo, surveyedCount);
                }
              }
            }

            localStorage.setItem("cardNoCount", cardNoCount.toString());
            localStorage.setItem("rfIdCount", rfIdCount.toString());

            dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/surveyedCount";
            this.db.database.ref(dbPath).set(surveyedCount);

            dbPath = "EntitySurveyData/TotalHouseCount/" + zoneNo;
            let totalRevisitCountInstance = this.db.object(dbPath).valueChanges().subscribe(
              count => {
                totalRevisitCountInstance.unsubscribe();
                let surveyedCounts = 1;
                if (count != null) {
                  surveyedCounts = Number(count) + currentSurveyCount;
                }
                dbPath = "EntitySurveyData/TotalHouseCount/" + zoneNo;
                this.db.database.ref(dbPath).set(surveyedCounts);
              }
            );
          }
        }
      }
    );
  }

  saveHouse(markerObj: any, zoneNo: any, cardNo: any, lineNo: any, rfId: any, mobileNo: any, markerNo: any, surveyedCount: any) {

    let dbPath = "CardWardMapping/" + cardNo;
    this.db.object(dbPath).update({ line: lineNo, ward: zoneNo });

    dbPath = "HouseWardMapping/" + mobileNo;
    this.db.object(dbPath).update({ line: lineNo, ward: zoneNo });

    let random = Math.floor(Math.random() * this.nameList.length);
    let name = this.nameList[random].toString();
    let address = "Ward " + zoneNo;
    let houseType = markerObj["houseType"];
    let latLng = "(" + markerObj["latLng"] + ")";
    let cardType = "";
    let houseTypeDetail = this.cardTypeList.find(item => item.houseTypeId == houseType);
    if (houseTypeDetail != undefined) {
      cardType = houseTypeDetail.houseType;
    }


    let date = new Date();
    let hour = date.getHours();
    let min = date.getMinutes();
    let second = date.getSeconds();
    let time = (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;
    const data = {
      address: address,
      cardNo: cardNo,
      cardType: cardType,
      createdDate: this.commonService.setTodayDate() + " " + time,
      houseType: houseType,
      latLng: latLng,
      line: lineNo,
      mobile: mobileNo,
      name: name,
      phaseNo: "2",
      rfid: rfId,
      surveyorId: "-1",
      ward: zoneNo
    }

    dbPath = "Houses/" + zoneNo + "/" + lineNo + "/" + cardNo;
    this.db.object(dbPath).update(data);

    dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
    this.db.object(dbPath).update({ cardNumber: cardNo });



    console.log(data);
  }


  generateMobileNo(markerObject: any, cardNo: any, rfId: any, markerNo: any, zoneNo: any, lineNo: any, surveyedCount: any) {
    let mobilePrefixList = ["9001", "9166", "9571", "9784", "8003", "7568", "8385", "7597", "8993", "9530", "8764", "9694", "9785", "8058", "8502", "7891", "8741", "9887", "8442", "7014", "6001", "7737", "8233", "9214", "9251", "8823", "9549", "9587", "9982", "8094", "7229", "7665"];
    let random = Math.floor(Math.random() * mobilePrefixList.length);
    let postFix = Math.floor(100000 + Math.random() * 900000);
    let mobileNo = mobilePrefixList[random].toString() + postFix;
    let dbPath = "HouseWardMapping/" + mobileNo;
    let checkInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        checkInstance.unsubscribe();
        if (data != null) {
          this.generateMobileNo(markerObject, cardNo, rfId, markerNo, zoneNo, lineNo, surveyedCount);
        }
        else {
          this.saveHouse(markerObject, zoneNo, cardNo, lineNo, rfId, mobileNo, markerNo, surveyedCount);
        }
      }
    );
  }

  getCardTypeList() {
    let dbPath = "Defaults/FinalHousesType";
    let houseTypeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        houseTypeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let houseTypeId = keyArray[i];
            let houseType = data[houseTypeId]["name"].split('(')[0];
            this.cardTypeList.push({ houseTypeId: houseTypeId, houseType: houseType });
          }
          console.log(this.cardTypeList);
        }
      }
    );
  }

  getNameList() {
    this.nameList = ["Krishan kumar", "Satyanarayan", "Manoharlal", "Kishanlal Sharma", "Mahesh bhati", "Vinod saini", "Ratan Lal saini",
      "Arjun Saini", "Sitaram Sharma", "Rajiv kumar", "Gita Devi", "Pawan sharma", "Laxman Singh", "Abdul Sataar", "Mahendra gurjar", "Bajran Singh", "Gajendra Singh", "Indar Saini", "Sokhat khan", "Hitesh Sharma", "Suresh Kumar", "Omprakash Saini", "Kaluram saini", "Ganesh Kumar Saini", "Sunil pareek", "Rajkumar saini", "Motilal Verma", "Bhagwan Ram Saini", "Rahul saini", "Ramkisor", "Nemichand meena", "Mandan Singh", "Jitendra joshi", "Mahaveer Prasad", "Premchand Saini", "Dwarka prasad saini", "Dileep kumar", "Sayam singh", "Keshar Singh", "Gajraj Singh", "Kamal kishor", "Mulchand Shrama", "Bimla Devi", "Devipratap Singh", "Pappu soni", "Hanuman Singh", "Prabhu Singh", "Mahesh kumar", "Mangu Singh", "Sohanlal Jangir", "Jugalkishor", "Satendra Dhayal", "Omasankar", "Bhawani Devi", "Rajendra singh", "Rajveer singh", "Tara kunwar", "Sambhu Dayal", "Bansidhar Nayak", "Aakash Singh", "Murli Jangir", "Rampal", "Manprakash  Verma", "Birbal singh", "Bhawar Singh", "Surgun kumawat", "Vinod Kumar saini", "Harendra singh", "Vishnu sharma", "Gopal kumawat", "Dataram Sharma", "Ghanshyam sharma", "Balveer singh", "Nathuram soni", "Aaditya soni", "Abdul kalam", "Birju singh", "Moh. Farukh", "Debu gadhwal", " Sankar singh", "Manish kumar", "Gajanand singh", "Foolchand", "Rampal", "Dinesh", "Ram Swaroop kumawat", "Sultan khan", "Amin nagori", "Mohd Yashin", "Mohdsarif", "Naved", "Mohd Tohfik", "Mohd Salim", "Mohd Fharuk", "Rafik", "Mohd Ekbal", "Umar yashin", "Rahmdula", "Ram gopal verma", "Saroj devi", "Bihari Lal", "Behlim mumtaj", "Maqbool ahahmd", "Mohd Esub", "Jakir khan", "Mohmamd saruk", "Mohd Altab", "Mohammed daud", "Arif sadik", "Nijamudin", "Himamudin belim", "Mohammed salim", "Shidhusen", " Najma", "Mohammed kused", "Yasen", "Yakub", "Mohd Haneef", "Gulam nabi", "Abdul kariem", "Mohd Ishymal", "Mohd Essak", "Jamil ahmad", "Mohd Husain", "Mohd Ayub qureshi", "Abdul latief", "Mohd Ramjan", "Imamudeen", "Tofeek bhati", "Mohd Tanwar",
      "Keshav dev", "Mukesh", "Naru ram dhikiya", "Karan", "Raju kumar", "Mithun", "Balbeer", "Prahlad", "Santosh", "Mahaveer",
      "Anjali", "Sandip kumar", "Kailash Saini", "Umed Singh Rathor", "Mahender", "Boduram", "Sukhlal", "Gyani Devi", "Radhakishan",
      "Sushila devi", "Shobha Gupta", "Suraj Ruhela", "Arjun lal", "Bhagwan singh", "R.S. Shekhawat", "Bhivaram", "Suraj", "Bugli devi",
      "Ashok", "Vikram Nawriya", "Arun sharma", "Gopal dikiya", "Niraj kumar pareek", "Vinod", "Naresh Kumar", "Pawan sindhi",
      "Surendra kumar", "Krishan soni", "Dindayal sharma", "Nathamal sharma", "Rughuvir harijan", "Gopal Singh", "Krishan",
      "HARLAL SINGH", "Ranjit Singh ", "Rajendra Prasad ", "Ramavtar singh", "KESHRAM DHAYAL", "Sumesh Kumar", "Jagdish parsad",
      "Mahipal Singh", "Amarjit singh", "Ram Kumar", "Bhawar Lal", "Vajay kumar", "Gowrishankar sharma", "Sukharam chodhary",
      "Archana pareek", "RICHHPAL", "Madan Pal", "Dinesh Kumar", "Dinesh Kumar", "Murari lal", "Ratan Lal", "Sunil gupta", "Sanjay Kumar",
      "Dipak Sharma", "Rameswar lal", "RAMDEV SINGH DHAKA", "Udaram ji", "Narapat singh", "Surji devi", "Triilok Khandelwal",
      "Manish Kumar", "S. K. Nirmal", "Abdul ahaman", "Kelash Saini", "RAMSINGH BHATI", "GORI SHANKAR SHARMA", "RAMNARAYAN",
      "SHUSHIL PAREEK", "PURUSHOTAM", "SARWAN KUMAR PAREEK", "Tilak Singh", "Naresh Kumar", "Prakash Kumar soni", "Fhatechand jangid",
      "Anand Singh Sekhawat", "Adhil Singh bhati", "Mala singh", "Shersingh sekhawat", "Indu devi", "Ankush agarwal", "Pritam Singh",
      "Laxmi kant", "Sudhir", "Mahima singh", "Om Prakash singh", "Ganpat Singh Gadwal", "Mangal Chand", "Karan Singh beniwal", "Raj vijaya", "Rukmani devi", "Vinod kumar", "Baijnath Dheewan", "Jagdish Bhaskar", "Sanwar Mal Kajla", "Banarsi Devi", "Shiv narayan", "Vidhyadhar", "Hari Singh", "RAJENDRA SIYAG", "Sharwan ji", "Jagan Singh matwa", "Sukhdev", "Sharwan Gadwal", "Ram niwas Gadwal", "Ramswarup nehra", "Mamta devi", "Birju Singh jakhar", "Sultan Singh pilaniya", "Madhya ram ji dayal", "Kaishar Singh ranva", "Vikram Singh", "Raj Singh Choudhary", "Suresh kumar poonia", "Bhiwaram badariya", "Kusum lata", "Saver mal ji", "Mahaveer Singh", "Vijay Kumar rad", "Subhash Kumar", "Birbal", "Omparkash gadwal", "Kuldeep dhaka", "Bihari lal khichar", "Kuldeep", "Sumitra gadwal", "Bhagwan Singh karshniya", "Ram Gopal", "Ramniwas", "Manoj kumar nehra", "Ramdev Singh", "Omparkash jheegar", "Satender", "Sultan singh", "Banwari lal", "Nemichand", "Ramniwas dhaka", "Jagan singh", "Jagan Singh", "Khiv Singh", "Ramesh", "Anandpal", "Hariram", "Murari ji", "Om prakash", "Silochana", "Raja ram ji", "Jaber ji", "Shivdayal ji", "Ram Chandra Singh bagriya", "Harlal", "Mahendra singh", "Monu g", "Loked", "Govind Singh dotasara", "Dharmpal", "Omprkash", "Harpal singh", "Shahu sharma", "Shree chand", "Rajesh meel", "Sukhveer singh", "Shri chand dhaka", "Ramchandra ji", "Jagmal singh", "Dilip Garhwal", "Vidhadhar ji garwal", "Banvari ji", "Suresh garwal", "Rajiv sunda", "Dilip agarwal", "Mamraj dhareewal", "Tala laga hua", "Murari", "Vedant swami", "Subhash jakhar", "Maveer ji", "Gordhan ji", "Harmful singh", "Trilok singh", "Prem singh", "Rajesh kumar", "Rakesh Kumar ji", "Banvari ji", "Onkar Mal", "Bihari Lal khichar", "Satyaveer Singh poonia", "Chuni lalji", "Mahesh ji", "Ghanshyam ji", "Hanuman Singh", "Moolchandji", "Manoj Kumar ji", "Sheeshram Kajla", "Shohni devi", "Om Prakash kichar", "Shyam sundar", "Shiv prasad", "Balbir", "Hari Ram", "Sitaram kumawat", "Somnath", "Ghyarshiram", "Sarita sunda", "Ram kisan", "Sarwan", "Parkash chand", "Sarita w/o Har Lal Singh", "Nathu singh bhukar", "rashpal Singh bijarniya", "Shisupal", "Ramkumar Jangid", "Tarachand",
      "Sarwan kumar", "Hari ram", "A K SCHOOL DRAISH", "Ravendhar ji", "Ramratan ji", "Amar chand", "Kuldha ji", "Ranjeet ji", "Bhagirth mal", "Santhosh mood", "Rcs burdak", "Shivparshad", "Sukhveer", "Lokesh", "Kanhaiya Lal ji", "Dinesh kumar", "Jagdish ji", "Aravind", "Kelash kumar", "Jawahar singh", "Prakash chand ji", "Riddhi Siddhi PG", "Harlal singh", "Mahipal", "Mukul", "Chotu singh", "Chotu Singh ji", "Debu gora", "Onkarmal", "Roshan lal", "Bl. Bhamu", "Manju devi", "Mega ram", "Bhagirath singh", "Bhagoti devi", "Payarelal puniya", "Babulal", "Suresh Kumar", "Subhash chand", "Surjan singh", "Manoj Kumar", "Rakesh ji", "Santra", "Sukhbir Singh", "sanvarmal", "Rajesh", "Balbir singh", "Manoj", "Lekhram", "Manoj meel", "Sudhir kumar", "Ramakant sharma", "Jai parkash", "ARvind kumar", "Lalchand", "Surendra meel", "SUDHIR KUMAR KHICHAR", "Sultan Singh ji", "Jagdish ruhela", "Rajesh kumar poonia", "Suresh", "dr.rajenderkumar", "Mulchand ji meel", "Dr.k.k.choudhary", "Jaipal lamboriya", "Suresh bagariya", "PHOOLCHAND", "Bhanwar lal choudhary", "Lakhan kumar", "Rajesh choudhary", "Vidhadhar ji", "Bulbir ji gora", "Vedparkash", "Harlal ji", "Ramdev singh ji gora", "Bhanwer ji", "Davender duti", "Satish Chand punia", "Rajender singh dhaka", "Sukhaveer ji", "Mahendar kumer", "Naveen sunda", "Ashok ji", "Mukesh Kumar puniya", "Santra dave", "Gangadhar ji dhutt", "Nekiram mood", "ASHOK PILANIYA", "Sukhdevi davi", "Mahander ji", "Mohini dave", "Subhash ji", "Kamal ji", "Rajuveer singh", "Ramprath ji", "Parmeshwari devi", "Raghuveer ji", "Harish Kumar", "Banwari lal ola", "Hemaram ranwa", "Pithram", "IKRAMUDEEN", "Sunil Gadwal", "Sukhdev Singh", "Surendra ji", "Rajender kumar nehra", "Maju devi", "Dinesh nehra", "Hardev haritwal", "Kaluram", "Ramkumar", "KISHAN SINGH", "NEMICHAND KHICHAR", "BHANWARI DEVI", "SURESH KUMAR", "Susila ji", "Karan Singh Choudhary", "Jeevan ram chodhari", "Jhabar ji Chaudhary", "Shashibala", "H D S FAGERIA", "NEKIRAM", "Darmesh", "Mohan lal", "Satish bhichar", "ASHOK KUMAR JI SHARMA", "Rajeev kumar", "Balbir Singh", "Raguveer singh kajala", "Naresh mohar", "Raghuveer ji kajla", "Mahadev kajla", "Ranveer singh kajla", "Ashok Kumar", "Harlal ji kalwaniya", "Vidyadhar ji", "Prabhu dayal jangir", "Vijay", "Kuldaram jakhar", "Rajendar singh dhaka", "Kamla choudhary", "Birbal singh dotasara", "Radheshyam ji", "Saroj bugaliya", "MAHA SINGH RAO", "Parmeshar Lal swami", "Ramjilal swami", "Vidya Dhar ji pilania", "SANWAR MAL JANGIR", "HANSRAJ", "Jodhraj", "Jaiveer singh", "Nitesh kumar", "Santosh devi", "Ramchandra Singh pachar", "Ganesh ji", "Ram chandra", "Chotu ram dhaka", "Hansh Raj ji", "Shyam Chaudhary", "Hanshraj", "SHIVBHAGWAN", "S.R.katariya", "Santosh ji josi", "Nandlal meel", "SITA DEVI JANGID", "SATYANARAYAN SHASTRI", "Rajendar parsad", "Manju Sharma", "Hanuman singh", "Devendra", "MADAN LAL BIJARNIYA", "Sharda bijarniya", "Sunita khichar", "Rajesh Kumar dhaka", "Anil ji", "Amrchand", "Manohar lal", "Mahesh", "Shishram", "SUNITA DEVI", "MAHIPAL MOOND", "SATVEER SINGH", "RAMNIWASH MEEL", "GAYATRI DEVI", "PANKAJ BIRBAL", "Birju Singh", "MAHESH SUNDA", "DAYANAND DHATARWAL", "SAROJ DEVI", "SHISHAM KHICHAR", "TENDRA KUMAR", "RAJENDRA", "SAVITA DEVI", "NARESH KULHARI", "LAL BAHADUR", "ASHOK KUMAR", "PREM DEVI", "RAMDEV DHAKA", "AHA LAL SAIN", "VINIT KHICHAR", "DILIP SINGH MAHELA", "HIMMAT SINGH", "TENDRA SINGH", "OMPRAKASH SAIN", "RAKESH", "RAJENDRA KUMAR", "SAVINTRA DHAKA", "BIRBAL SINGH", "Ramlal", "Norang singh", "Vidhadhar singh", "Rajveer", "Subhita devi", "Shodanji", "Phochand fagediya", "YASHWANT SINGH DHAYAL", "Bhawar lal", "Surendra singh", "Shiv chand", "Ganeshram", "Ramesh Sharma", "Manoj shrma", "NATHURAM MEEL", "BL MEEL", "MAHIPAL MEEL", "SANJAY KUMAR S/O SHIV PRASAD", "Rajender parsad", "MR NAHAR SINGH", "MAHENDRA DHUKIYA", "RAJENDRA KULHARI", "BALVEER SINGH", "Ramesh Kumar", "Arjun singh", "Surendra Kumar batar", "Pyarelal shivran", "Niraj daya", "RAJENDRA CHOUDHARY", "BHANWAR LAL BAGDIA", "Mahendr bohra", "Omparkash", "PRAKASH SORAN", "RAMCHANDRA", "MAHESH KUMAR", "OMPRAKASH MEEL", "SUMAN DEVI W/O MAHESH KUMAR", "RAMCHANDRA SARAN", "BHANWAR LAL SUNDA", "Hari Ram ji", "Mahinder", "Sandeep", "Naresh", "Mukesh kumar", "Ramnivash", "Honny", "Jagdish", "Subash", "BRIJMOHAN", "MANOJ KUMAR PILANIYA", "Ramsingh", "Arjun Lal jangir", "BUDANIA GIRLS HOSTEL", "VIJAY KUMAR", "GOPAL", "SUKHVEER SINGH BUDANIA", "NAND LAL RANWA", "HEMANT KUMAR", "Harsh", "BHAGCHAND MAWLIYA", "JAGDISH PRASAD GADHWAL", "Kisturi devi", "Jagdish gadhwal", "SITA DEVI", "HANS RAM KHARBAS", "VIJAY SINGH", "PRAKASH CHAND FAGEDIYA", "PRAMESHWAR SINGH", "SURENDRA KUMAR POONIA", "SURENDRA SINGH", "Surnder Singh kajla", "Sukhadev", "Bhagchand", "Ramkumar", "NEMICHAND KAJLA", "SATYAPAL SINGH", "Namichand ji", "Bhagirat maal rewad ji", "Nemaram Nehra", "Sohan Singh khichar", "Kesardev  sain", "RAMSWAROOP BAGDIYA", "Chanderbhan Singh khara", "Ranjeet", "TARUN KUMAR DHABAI", "Rajesh Kajla", "Do. Vinay mund", "Laxman singh", "Banwar ji", "LAXMAN SINGH", "Ratan ji", "Laxman singh", "MOOLARAM MEEL", "SANWAR MAL SAIN", "OMPRAKASH BIJARNIYA", "MAHENDRA GADHWAL", "DALIP KUMAR", "VIMLA DEVI", "MAHIPAL KHICHAR", "DHARMPAL GADHWAL", "Rajender", "VIDHYADHAR KULHARI",
      "SURENDRA KUMAR BHASKAR", "SUBHASH CHAND", "RAJPAL BUDANIA", "RICHPAL SINGH BATAD", "Phoolchand", "Bhagirathi singh", "RAMCHAND HUDDA", "RAMPRATAP GADHWAL", "Ashok bijarniya", "SHANTI DEVI", "RAMESHWAR", "Rajesh", "Ram lal ji", "Harpal singh bhuriya", "Vidhyadhar ji ranwa", "OMPRAKASH BALBADA", "MANOJ KUMAR", "Nemichand ji", "Surendar singh payal", "Pahlad singh", "Laxmi narayan", "Pardeep", "BEDPAL", "Suresh ji", "Sumitra katariya", "Gdwal bhawan", "Shyam lal", "Jagu", "Misra", "Gjander", "Monika", "Lokender", "Davi lal ji", "Rameshver ji", "Bhola ram", "vishal", "Mulchand ji", "Mulchand bagriya", "Mahipal singh", "Mahaveer gadhwal", "Sarwan kumar jakhar", "Mani devi", "Jyani devi", "Kunal", "Harsh Garden", "Dalel singh", "Sumitra bijarniya", "Mahipal dhaka", "Ranveer singh", "Vishanu  prasad", "Nandkishor", "Kisar dev khyaliya", "Sunil ji", "Nathu ji saini", "Hari parsad saini", "Rahul", "Gori sankar", "Sarda devi", "Laxmi ji", "Indra jakhar", "Nemichand ji", "Subhkarn ji", "Birbal ji", "Nemichand bhaskar", "Om parkas  pangal", "Narendra ji", "Sisram ji", "Narendra kumar", "Goverdhan poonia", "Ummed singh", "Laxman  poonia", "Lekhram mahala", "Danaram choudhary", "Ram kumar ji", "Subhash chandra bugaliya", "BHAGIRATH", "Ram lal", "Ramniwash", "Mahaveer singh", "SHAYOPAL", "MAHESH KUMAWAT", "SANWAR MAL", "SHAYOPAL KUMAWAT", "AMAR CHAND", "RAJKUMAR KUMAWAT", "PRABHU RAM KUMAWAT", "Druga ram", "Surender", "Girdhari kumwat", "Hari", "Bhagwati devi", "Rameshwar", "Ashoka", "Bhagwati devi", "HARDEVA RAM", "OM PRAKASH PILANIA", "RAJURAM JAT", "DAVENDRA SINGH", "RAMSWAROOP", "MANOJ", "RAMKARAN", "Rakes kumar ranwa", "Bhagirath ji kajla", "Ghasi ram", "Manoj", "Devendra kajla", "SHIV CHAND", "VIDHYADHAR SINGH", "Inder g", "Bajrang lal ji", "Banwari lal", "Monu", "mukesh", "Mahver parshad", "Rohit Kumar", "Balveer", "Agrval house", "Mohan chand", "Bharti singh", "Ravi", "Vikash", "Manish", "Harish", "MOHAN SINGH", "Rukmani", "RAMCHANDRA", "BHANWAR LAL", "RAMSWAROOP SONI", "Mahesh Kumar daka", "BABULAL", "Saver ji", "Vijender ji",
      "Rameswar ji", "Payarelal ji", "Hemanshu", "Nayna", "Podar house", "Bhawani shankar ji", "Rajendra", "Omparkesh ji", "Manoj ji", "Mukesh ji", "Shisram", "Vishnu", "Keshav", "Mohit", "Suresh", "Jassraaj ji", "Sarojdevi", "Surendra", "Rohit", "Ratesh", "Sohan", "Babulal Singh", "BIRJU SINGH Bhaskar", "Fateh Mohammed shekh", "Shyam Lal Chawla", "Surjaram", "Panna Lal kumawat", "SUNITA W/O RAM KRISHANA", "TARACHAND CHOUDHARY ( INSPECTOR)", "RAMLAL SINGH", "VISHAL SINGH", "SARWAN KUMAR JANGID", "TARACHAND MAHALA", "Hrish", "Jagdish singh", "Laxmi chand", "PRAKASH", "SUBASH", "UMESH KUMAR JANGID", "SANWARMAL GADHWAL", "Ramutar", "Hanshu", "Subhash Chand", "Dharmapal matwa", "Sumar", "Babulal", "Suraj bhan singh", "Bhagir g", "Gopal", "Hanuman", "RAKESH KUMAR DHAKA", "MUKESH DHAKA", "Happy", "Rajash", "Abbas", "SHIV KUMAR MEEL", "NIRANJAN LAL", "Nirjan lal", "raghu", "JASHVEER CHOUDHRY", "Rishpal Singh ruhla", "Bhagirath Mal Jat mali", "Manroop batar", "Rameshar lal", "DEVKARAN", "Ram kumar", "Shiv pal Singh", "Suresh pooniya", "Ranjeet Singh", "Rakesh kumar", "Kelash", "SURESH", "Shevda Academy", "Janu house", "MUKESH", "CHUNNI LAL", "Yogesh", "Parveen ji", "Khulda ram ji", "SUNIL CHOUDHARY", "PRADEEEP SINGH", "ALKA SINGH", "SARITA DEVI", "GAJENDRA KUMAR", "NEMICHAND", "BAJARANG LAL", "MAHIPAL", "MAMRAJ BATAD", "DINESH KUMAR", "Shree shayam", "Kamal", "LAXMI CHAND", "HARI RAM BHADIYA", "Gerdari", "KAMAL FAGEDIYA", "KAJODMAL VYAVSTHAPAK", "Mahaveer singh", "Manmohan ji", "Rajan", "Balvir singh", "Satguru classes", "Satguru", "Raguveer", "Ranglal ji", "Eshwar singh", "Karan singh", "Suresh ji jakhar", "Mohar Singh ji", "Jagdesh ji", "Raju ji", "Kavita ji", "Gopchand ji", "Rajesh kumawt", "Suresh Kumar nayen", "Harisingh dhyal", "Sudhir jakhar", "Deelep", "Pankaj mahala", "Vijay singh", "Randheer ji", "Naveen", "Vasu dev jhakhar", "Kailash kumar", "Bahadur mal", "Banwari", "Vasu dev", "Ramesh kumar", "Aamod kumar", "Dataram dhayal", "Tarachand", "Sohanlal", "Muni devi", "Jagdish", "Reena devi", "Satkesh Kumar", "Ramkumar meel", "Pawan ji", "Mohan rewar", "Sunil Kumar", "Hariprasad dhaka", "Surendra", "Rajiv choudhary", "Ranveer Singh mahla", "Jatashnakr puniya", "Hemaram", "Sanju", "Pyare Lal", "Sawarmal bhuriya", "Ram Lal singh", "Mukesh", "Ranjeet", "Sardar singh", "Jagan lal", "Nikhil", "Kamla devi", "harendra", "Abhinav", "Vidhadhar", "Babulal ola", "Suresh kumar Dhaka", "Jeatender", "Hari kesan", "Sankar Lal sharma", "Surender singh mahla", "Suresh Jakhar", "Ram singh Dhaka", "Hari Dhyal", "bharat", "Sandeep singh", "Yashpal",
      "Saurabh", "Kailash", "Mahipal", "Rampartap", "Sudhir ji", "Mukesh Kumar", "Mahesh bhukar", "Om parkash", "Phoolchand kumawat", "Sawal singh", "Chanda devi", "Sunita", "Supayar choudhary", "Harpool baniwal", "Savita", "narendra", "Manaram", "Sunita devi", "RAJENDRA GADHWAL", "Sabir khan", "Bhagwana ram", "Dharmapal", "Poolchand", "rajendara singh", "Boduram saini", "Pankaj", "Vidhadhar meel", "Haribax", "VINOD KUMAR", "Mukan singh", "Bhpendra kumar", "Kuldeep kumar", "Sunil bhukar", "INDIRA DEVI", "Pardeep", "Goru ram", "Moti singh", "Chandra singh", "Ravidar singh", "Parmeshar lal", "Mukan meel", "Jabhar kajla", "Baldev singh", "Subhkarn singh", "Shoyobax sunda", "Sultan ji", "Nemichand", "Bhupendra singh", "Bansidhar kajla", "Savantri devi", "Manoj dhaka", "Rameshwar singh", "Singh house", "Omparakesh", "Ram Singh", "Satyeparkash", "Sumer ji", "Nanak ram", "Shyam sundar", "Rakesh Kumar sunda", "MAHESH BARI", "MADAN SINGH KAJLA", "Hanuman bagadiya", "Banchan Singh", "Mahavir ji batad", "Gopal ji", "Jitendra singh", "Nihal Singh", "Prameshwarlal", "Vikash rulaniya", "Kishore sunda", "Vikram singh", "Ramesh nayak", "Upandar kudi", "Dhruval sunda", "SANDEEP BABAL", "GOVIND RAM", "Aman", "Gopal gadwal", "Ved ji", "Mahi pal", "Fulchand bukar", "Kuma ram bhukar", "Dinesh shiran", "RAJKUMAR RAO", "Mukand Singh", "Randheer Singh", "Ranbir", "Choti devi", "Vishnu nathshrma", "Sanjiv nehara", "Dr. S. R. Pooina", "Birbal jhakhar", "Gopal ranwa", "Jungle ji jat", "SHARWAN KUMAR KHAYALIA", "Rajeev bagdriya", "Harlal Singh", "SURENDRA KUMAR", "Ramavtar", "Hariram", "Ranjeet", "Mahendra ji", "Goverdhan", "Ramavatar", "Baldev Singh", "Subhash chandra", "Vijay pal", "Kiran", "Pyarelal ji pooina", "Rakesh gajraj", "Phool chand", "Punit kumar mahla", "Prem devi", "Hanumansingh", "KURDARAM SAINI", "Rajkamal", "Chander Singh", "Tarachand dhayal", "Hanuman ji", "Dr. Bal veer sesmaw", "Sunil kumar", "Bhohit ram", "Ramchander", "Sanju", "Partap Singh", "Vikash", "Bhoitram ji", "HARPHOOL SINGH", "Mohar Singh", "Jagdish parsad poonia", "Dil sukh choudhary", "Sandeep ji", "Vidhayadhar", "Om parkash", "Shri chand", "Mhaveer parsad", "Saroj devi", "Mohan poonia", "Mohan Singh puniya", "Vivek", "Bhagirath", "Narendra", "Goverdhan singh bhaskar", "Rajendra", "Shyam lal varma", "Bhivaram", "Om ji", "Ramkumar", "Manoj kumar", "Satya sharma", "Manju Devi", "Girdhari lal", "Sitaram", "Chote lal sarwa", "Vijendra", "Naman", "Dr KAILASH CHANDRA", "Krishna bhawan", "Kailash", "Bhagirath Singh", "Mahipal", "Narendra", "PITARAM MEEL", "Bhagwan Singh", "SUNITA", "RAMCHANDRA SINGH", "Madan pooniya", "Ram parsad bari", "Vidhadhar",
      "Shivnath singh", "Rich pal Singh batar", "Vimla jakhar", "Kanyalal dara", "Naresh bydania", "Suman davi", "Surya pal", "Makhan Lal", "Hem Singh", "Rajesh gadwal", "Amar Singh matwa", "Daksh", "Nakul bagaria", "Moti Singh pooniya", "Harpool Singh", "BALVEER SINGH BHASKAR", "OMPRAKASH BHASKAR", "MANGAL CHAND MISHRA", "Hera lalsharma", "Dindayal nehara", "Rajkumari", "Madan singh", "DEVKARAN CHOUDHARY", "AJAY CHOUDHARY", "Rajesh Bhukar", "Tan Singh", "Ram chandra dhaka", "VIJENDRA SINGH GILL", "SURAJ MAL ARYA", "Dr Bhim bijarniya", "Dayanand dhaka", "Rajendra meel", "RAJKUMAR FAGEDIYA", "SANTOSH DHAKA", "RATAN SINGH", "RAJENDRA BAGDIYA", "BHAGIRATH MAL KHAYALIYA", "Ramdev bijarniya", "Hoshiyar Singh meel", "Bhawar Singh", "ASHOK SAINI", "SOHANI DEVI", "Pokhar Singh", "Mahesh meel", "Pramod meel", "Rajkumar fagediya", "NEMICHAND", "SHILA DEVI", "VIKASH SHARMA", "Deshraj", "Shri shyam complex", "Aashiyana complex", "Shishpal", "Pardeep jakhar", "NAVEEN KUMAR", "Pardeep kymar", "Sukhbeer Singh bhukar", "Pawan kumar", "BHANWAR", "DR ABHISEK", "banwari lal", "Suresh godara", "VIDHYADAHR", "GORDHAN SINGH GUDHA", "Sobhagaya ragidansy", "Shawai singh", "Banwar lal", "MANOHAR LAL", "Ram parsad", "Gordhan singh", "Madan Singh", "Chataru Singh", "chotu ram kumawat", "Choturam", "Sanju davi", "Sumit", "Bhagwan ji", "Sarwan achra", "Mahendra bhaskar", "Bhomaram", "Mahendra poonia", "No rang singh", "Ramesh soni", "Madan Lal bagdiya", "Kailash butolia", "Vidhadhar dhaka", "Navdeep", "Bhaghath Mal", "REKHA RAM", "Radha krishan", "VIKASH", "Savran Singh", "Maninadar Singh", "Ramdhan", "Rajesh bagria", "Rajpal", "Raj Singh", "Rajpal bhkar", "Kelash shawar mal", "BUDHRAM", "Ram chandra ola", "SUBHITA KAJLA", "DINESH RANWA", "BABULAL KUMAWAT", "Sunita tiffin centre", "ASHOK", "Subhash kumawat", "Dilsukh thalor", "Vidhadhar Singh", "Er Narendra", "Sultan meel", "Subhash Kumar", "Dinesh gadwal", "SURESH KUMAR DHAKA", "Nemichand mahala", "Ramesh", "Mohan singh", "RAJU SARPANCH", "Rajendra seshma", "SHUSHIL BARI", "Ashok kumar", "Ghisaram jakhar", "Dilbag Singh", "Sukhbeer", "Kalu ram", "Bhagirath singh ranwa", "Shyamshunder shain", "Yash apartment", "New house", "Gopal githala", "VEER TEJA APARTMENT", "Mukesh", "MAHESH", "Ramsavroop joshi", "Parbhudayal", "Maya", "Vinod meena", "Mahaveer parsad", "Narayan Lal rewad", "Mahesh", "Mahendra", "Mahendra Kumar godara", "DHANSINGH LAMBA", "URMILA", "Ram chandra sevda", "Bajranglal", "Makhan lal", "Balbir bhukar", "Bhagarthai davi", "Mahindra Singh", "POONAM DEVI", "DEEPAK KUMAR", "DEVA NAND", "BHAGIRATH", "BOY'S HOSTEL", "SHANKAR LAL", "GUNJAN MATWA",
      "RANDHEER SINGH PILANIYA", "LOKESH MAHALA", "DHANE SINGH", "Surendra", "LAXMICHAND PILANIYA", "HANUMAN", "Mahandra sing", "Ramkuvar", "Ramkuwar", "Ram chandra samota", "Silpa devi", "Mahesh godara", "VISHVANATH SONI", "BIRJMOHAN", "SARWAN", "MUKESH KUMAR JANGID", "Mahendra Singh", "Vikram Singh", "Harish chahar", "Rajendra Singh", "Ramdevi", "Chandan sungh katewa", "Suresh kumawat", "Subhash sharma", "Bhawar singh", "Parkash", "Kuldeep Nehra", "Manoj kumar", "Meena sharma", "Banwari Lal baskar", "Tajpal", "Sarwan", "Mahendra singh mood", "Amarnath butolia", "Dwarka", "Rajesh Kumar bagdiya", "Jhabahar mal bajaya", "Keshar bagdiya", "Subhash kumar", "Amarnath butoliya", "SURESH KUMAR SHARMA", "HARFOOL SINGH KHICHAR", "KANEHYA LAL", "BHAGWAN SINGH JHURIYA", "Kundan singh", "Virendara dotasara", "Virendra Singh", "Hukum Singh mahala", "Bhawar basakar", "SATYAPAL MAHRIYA", "TARACHAND", "Norang Singh kajala", "Norang Singh kajla", "Bhawar Lal dotasara", "SUBASH", "Bhagirath singh matwa", "omparkash", "SURENDRA KUMAR", "PUJA DEVI / LALIT KUMAR", "KELASH CHAND", "Radeshyam kumawat", "Dawarka parsad", "Gopichand", "vikash", "mhadev kumavat", "ramavtar", "radeshyam sharma", "bejrang lal meel", "mahendra", "sankar kumat", "sankar", "Sudhir", "Ramatar dhaka", "KAMLESH KUMAR PUNIYA", "VIJAY KUMAR AGARWAL", "PRAVEEN AGARWAL", "MAHESH KUMAR / DINESH", "SARWAN KUMAR", "Mahesh agrawal", "Shiv bhagwan", "Parveen", "Barjmohan swami", "Vijay Pal", "Mahaveer ji Jangid", "Ramvtar Sharma", "Vimal kumar", "BHANWARLAL NAGA", "RICHPAL", "RAM DEVI / VIKASH KAJALA", "Birabl singh", "SUNIL KUMAR", "MAHENDRA KUMAR MEEL", "SUNDA COLONY", "Dr B R SAINI", "Kumbha ram", "Sahnaj fansy store", "Mahesh kumar", "MANI DEVI", "MAHENDRA KUMAR MEEL", "Ramniwash nithala", "Big apartment", "Ashok kulhari", "Radhika house", "Kiran swami", "Dharmpal", "Dadu ram", "Harish kumar", "Baba men's parler", "Kedar Maan Singh", "Ramlal Singh", "Dr. Ranveer Singh", "Kasar ram bijraniya", "Hari ram meel", "Gora devi", "Indraj", "Ramji lal", "Ramwataar", "Sewa ram", "Sandeep", "Arvind bhaskar", "Ramchandr", "GODAVARI DEVIF", "Ramniwas", "Sunita meel", "SHISHRAM", "Baldev meel", "RANVEER SINGH", "Ram sukh sunda", "Dharmveer", "Manoj kumar pooina", "Johimal", "Anup kumar", "Anil kumar", "Dharmpal sesma", "Pyarelal dhaka", "Ramniwas dhaka", "M. K. General store", "Ravidar jangar", "Makhan Lal jangir", "Prabhudayaal", "Wahid", "Saroj davi", "Sila devi", "Chain Singh khedar", "Karsan kumar", "Dharmendar choudhary", "Vidhader mila", "Santhosh", "Royal digital photo studio", "Birda ram", "Gangadhar"];
  }

  checkFileUpdateDate() {
    let wardLineWeightageAllowed = [];
    let wardForWeightageList = [];
    if (localStorage.getItem("wardLineWeightageAllowed") != null) {
      wardLineWeightageAllowed = JSON.parse(localStorage.getItem("wardLineWeightageAllowed"));
    }
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FWardLineWeightageJson%2FwardLineWeightageAllowed.json";
    let jsonInstance = this.httpService.get(path).subscribe(metaData => {
      jsonInstance.unsubscribe();
      if (metaData["updated"] != null) {
        let detail = wardLineWeightageAllowed.find(item => item.city == localStorage.getItem("cityName"));
        if (detail == undefined) {
          const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FWardLineWeightageJson%2FwardLineWeightageAllowed.json?alt=media";
          jsonInstance = this.httpService.get(path).subscribe(dataDate => {
            jsonInstance.unsubscribe();
            let list = JSON.parse(JSON.stringify(dataDate));
            if (list.length > 0) {
              for (let i = 0; i < list.length; i++) {
                wardForWeightageList.push({ zoneNo: list[i].trim() });
              }
            }
            wardLineWeightageAllowed.push({ city: localStorage.getItem("cityName"), fileUpdateDate: metaData["updated"], wardForWeightageList: wardForWeightageList });
            localStorage.setItem("wardLineWeightageAllowed", JSON.stringify(wardLineWeightageAllowed));
          });
        }
        else {
          if (detail.fileUpdateDate != metaData["updated"]) {
            const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FWardLineWeightageJson%2FwardLineWeightageAllowed.json?alt=media";
            jsonInstance = this.httpService.get(path).subscribe(dataDate => {
              jsonInstance.unsubscribe();
              let list = JSON.parse(JSON.stringify(dataDate));
              if (list.length > 0) {
                for (let i = 0; i < list.length; i++) {
                  wardForWeightageList.push({ zoneNo: list[i].trim() });
                }
              }
              detail.fileUpdateDate = dataDate["updated"];
              detail.wardForWeightageList = wardForWeightageList;
              localStorage.setItem("wardLineWeightageAllowed", JSON.stringify(wardLineWeightageAllowed));
            });
          }
        }
      }
    });
  }



}
