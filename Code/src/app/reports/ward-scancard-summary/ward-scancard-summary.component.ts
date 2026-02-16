import { Component, OnInit } from '@angular/core';
import { AngularFireModule } from "angularfire2";
import { HttpClient } from "@angular/common/http";
//services
import { CommonService } from "../../services/common/common.service";
import * as $ from "jquery";
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-ward-scancard-summary',
  templateUrl: './ward-scancard-summary.component.html',
  styleUrls: ['./ward-scancard-summary.component.scss']
})
export class WardScancardSummaryComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, public httpService: HttpClient, private commonService: CommonService) { }

  wardList: any[];
  selectedCircle: any;
  selectedDate: any;
  toDayDate: any;
  wardDataList: any[];
  wardScaanedList: any;
  totalScannedCards: any;
  totalNotScannedCards: any;
  isFirst = true;

  db: any;
  public cityName: any;
  serviceName = "ward-scan-card-summary";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("General-Reports", "Ward-Scan-Card-Summary", localStorage.getItem("userID"));
    this.showLoder();
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    this.totalNotScannedCards = 0;
    this.totalScannedCards = 0;
    $("#txtDate").val(this.selectedDate);
    this.getWards();
  }

  showLoder() {
    $("#divLoader").show();
    setTimeout(() => {
      $("#divLoader").hide();
    }, 6000);
  }

  getWards() {
    this.wardList = [];
    this.commonService.getCityWiseWard().then((wardList: any) => {
      this.wardList = JSON.parse(wardList);
      this.selectedCircle = 'Circle1';
      this.onSubmit();
    });
  }

  changeCircleSelection(filterVal: any) {
    this.showLoder();
    this.selectedCircle = filterVal;
    this.isFirst = true;
    this.onSubmit();
  }

  onSubmit() {
    this.wardDataList = [];
    let circleWardList = this.wardList.filter((item) => item.circle == this.selectedCircle);
    if (circleWardList.length > 0) {
      for (let i = 0; i < circleWardList.length; i++) {
        if (circleWardList[i]["wardNo"] != undefined) {
          this.wardDataList.push({ wardNo: circleWardList[i]["wardNo"], scanned: 0, isPenaltyRemarkChange: false, notScanned: 0, scannedTotalCards: 0, workPercentage: "0", helperCode: "", helperId: '0', helper: "", penalty: "", remark: "", isDataFound: false });
        }
      }

      this.getWardDetail();
    }
  }

  getWardDetail() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardDetail");
    this.totalScannedCards = 0;
    this.totalNotScannedCards = 0;
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    for (let i = 0; i < this.wardList.length; i++) {
      let wardNo = this.wardList[i]["wardNo"];
      let dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/helperName";
      let helperInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", data);
          helperInstance.unsubscribe();
          let helper = "";
          let helperId = "0";
          let empCode = "";
          let scanned = 0;
          let notScanned = 0;
          let scannedTotalCards = 0;
          let workPercentage = '0';
          if (data != null) {
            helper = data.toString();
          }
          let dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/helper";
          let helperIdInstance = this.db.object(dbPath).valueChanges().subscribe(
            helperdata => {
              helperIdInstance.unsubscribe();
              if (helperdata != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", helperdata);
                helperId = helperdata.toString().split(',')[0];
                dbPath = "Employees/" + helperId + "/GeneralDetails/empCode";
                let empInstance = this.db.object(dbPath).valueChanges().subscribe(
                  empCodeData => {
                    empInstance.unsubscribe();

                    if (empCodeData != null) {
                      empCode = empCodeData.toString();

                    }
                    dbPath = "HousesCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/ImagesData/";
                    let notScannedInstance = this.db.object(dbPath).valueChanges().subscribe(
                      notScannedData => {
                        notScannedInstance.unsubscribe();
                        if (notScannedData != null) {

                          this.besuh.saveBackEndFunctionDataUsesHistory(
                            this.serviceName,
                            "getWardDetail",
                            notScannedData
                          );

                          let keyArray = Object.keys(notScannedData)
                            .filter(key => key !== 'lastKey' && key !== 'totalCount');

                          notScanned = keyArray.length;          // ✅ correct count
                          scannedTotalCards += notScanned;
                        }

                        dbPath = "HousesCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate;
                        let scannedInstance = this.db.object(dbPath).valueChanges().subscribe(
                          scannedData => {
                            scannedInstance.unsubscribe();
                            if (scannedData != null) {
                              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", scannedData);
                              let keyArray = Object.keys(scannedData).filter(key => key !== 'recentScanned' && key !== 'totalScanned' && key !== 'ImagesData' && key !== 'totalActualScanned');

                              for (let j = 0; j < keyArray.length; j++) {
                                let index = keyArray[j];
                                /* ===============================
                                     INTERNAL USER → filter scanBy
                                  =============================== */
                                if (localStorage.getItem("userType") !== "External User") {

                                  if (scannedData[index].scanBy != "-1") {

                                    scanned++;
                                  }

                                }
                                /* ===============================
                                   EXTERNAL USER → NO scanBy filter
                                   =============================== */
                                else {

                                  scanned++;
                                }

                              }
                            }
                            dbPath = "/WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/" + "Summary" + "/" + "workPercentage";
                            let workPercentageInstance = this.db.object(dbPath).valueChanges().subscribe(
                              workPercentageData => {
                                workPercentageInstance.unsubscribe();
                                if (workPercentageData !== null && workPercentageData !== undefined) {
                                  this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", workPercentageData);
                                  workPercentage = workPercentageData;
                                }
                                dbPath = "WardScanCardPenalties" + "/" + year + "/" + monthName + "/" + this.selectedDate + "/" + helperId + "/" + wardNo + "/";
                                let penaltyInstance = this.db.object(dbPath).valueChanges().subscribe(penaltyData => {
                                  penaltyInstance.unsubscribe();
                                  let detail = this.wardDataList.find(item => item.wardNo == wardNo);
                                  if (penaltyData != null && penaltyData.isCardScanPenalty !== undefined && penaltyData.isCardScanPenalty === 1) {
                                    this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardDetail", penaltyData);
                                    detail.penalty = penaltyData.amount;
                                    detail.remark = penaltyData.reason;
                                  }
                                  if (detail != undefined) {

                                    scannedTotalCards += scanned;
                                    detail.helper = helper;
                                    detail.helperCode = empCode;
                                    detail.helperId = helperId;
                                    detail.scanned = scanned;
                                    detail.isDataFound = true;
                                    detail.notScanned = notScanned;
                                    detail.workPercentage = workPercentage + "%";
                                    detail.scannedTotalCards = scannedTotalCards ? scannedTotalCards : 0;
                                    this.totalNotScannedCards += Number(notScanned);
                                    this.totalScannedCards += Number(scanned);
                                  }
                                });

                              }
                            );
                          }
                        );

                      }
                    );
                  }
                );
              }
              else {
                let detail = this.wardDataList.find(item => item.wardNo == wardNo);
                if (detail) {
                  detail.isDataFound = false;
                }
              }

            });
        }
      );
    }


  }
  handleChange(index: number, type: string, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (type === 'penalty') {
      inputElement.value = inputElement.value.replace(/\D/g, ''); // Remove non-numeric characters
      this.wardDataList[index].penalty = inputElement.value;
      this.wardDataList[index].isPenaltyRemarkChange = true;
    } else {
      this.wardDataList[index].remark = inputElement.value;
      this.wardDataList[index].isPenaltyRemarkChange = true;
    }
  }

  exportWardScanTypeList() {
    if (this.wardDataList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "WardNo";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Employee Code";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Helper";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Scanned";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += " Not Scanned Card";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total Scanned Cards";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Work Percentage";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Penalty";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Remark";
      htmlString += "</td>";
      htmlString += "</tr>";
      for (let i = 0; i < this.wardDataList.length; i++) {
        htmlString += "<tr>";
        htmlString += "<td t='s'>";
        htmlString += this.wardDataList[i]["wardNo"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.wardDataList[i]["helperCode"];
        htmlString += "</td>";
        htmlString += "<td t='s'>";
        htmlString += this.wardDataList[i]["helper"];
        htmlString += "</td>";
        htmlString += "<td >";
        htmlString += this.wardDataList[i]["scanned"];
        htmlString += "</td>";
        htmlString += "<td >";
        htmlString += this.wardDataList[i]["notScanned"];
        htmlString += "</td>";
        htmlString += "<td >";
        htmlString += this.wardDataList[i]["scannedTotalCards"];
        htmlString += "</td>";
        htmlString += "<td t=s >";
        htmlString += this.wardDataList[i]["workPercentage"];
        htmlString += "</td>";
        htmlString += "<td >";
        htmlString += this.wardDataList[i]["penalty"];
        htmlString += "</td>";
        htmlString += "<td >";
        htmlString += this.wardDataList[i]["remark"];
        htmlString += "</td>";
        htmlString += "</tr>";
      }
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += " ";
      htmlString += "</td>";
      htmlString += "</tr>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Total";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += this.totalScannedCards;
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += this.totalNotScannedCards;
      htmlString += "</td>";
      htmlString += "</tr>";
      htmlString += "</table>";
      let fileName = "WardScanSummary-" + this.selectedDate + ".xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
  setDate(filterVal: any, type: string) {
    this.showLoder();
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.onSubmit();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }
  /*
  Function name : savePenalty
  Description : This function is working for save penalty  by helper employee code
  Written by : Ritik Parmar
  Written date : 27 Feb 2025
 */
  savePenalty() {
    if (this.wardDataList.length === 0) return;
    let userId = localStorage.getItem('userID');
    let data: any = {};
    let isPenalty = this.wardDataList.some((item) => item.penalty !== '' && Number(item.penalty) === 0);
    if (isPenalty) return this.commonService.setAlertMessage('error', 'Please enter penalty greater than 0');
    let detail = this.wardDataList.some(item => item.penalty && item.remark === '');
    if (detail) return this.commonService.setAlertMessage('error', "Please write remark");
    let savePenaltyList = this.wardDataList.filter(item => item.penalty !== '' && item.remark !== '');
    if (savePenaltyList.length === 0) return this.commonService.setAlertMessage('error', "Please fill penalty and remark");
    let validate = savePenaltyList.every((item) => item.helperId !== '0' && item.penalty && item.remark);
    if (!validate) return this.commonService.setAlertMessage('error', 'Something went wrong');
    let isSaved = false;
    for (let i = 0; i < savePenaltyList.length; i++) {
      let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
      let year = this.selectedDate.split("-")[0];
      let ward = savePenaltyList[i];
      if (ward.penalty && ward.remark && ward.helperId !== '0' && ward.isPenaltyRemarkChange) {
        let dbPath = 'WardScanCardPenalties' + "/" + year + "/" + monthName + "/" + this.selectedDate + "/" + ward.helperId + "/" + ward.wardNo + "/";
        data = {
          amount: Number(ward.penalty),
          reason: ward.remark,
          createdBy: userId,
          createdOn: this.commonService.getTodayDateTime(),
          penaltyType: 'Penalty',
          isCardScanPenalty: 1
        };
        this.db.object(dbPath).update(data);
        isSaved = true;
        let detail = this.wardDataList.find(item => item.wardNo === ward.wardNo);
        if (detail) {
          detail.isPenaltyRemarkChange = false;
        }
      }
    }
    if (isSaved) {
      this.commonService.setAlertMessage('success', 'Penalty updated successfully');
      isSaved = false;
      return;
    }
    else {
      return this.commonService.setAlertMessage('error', "No Changes Found");
    }
  }
}

