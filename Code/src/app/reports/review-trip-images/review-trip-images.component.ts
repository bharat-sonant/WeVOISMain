import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "@angular/fire/storage";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-review-trip-images',
  templateUrl: './review-trip-images.component.html',
  styleUrls: ['./review-trip-images.component.scss']
})
export class ReviewTripImagesComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private storage: AngularFireStorage, private httpService: HttpClient, public actRoute: ActivatedRoute, private commonService: CommonService) { }
  zoneList: any[] = [];
  zoneTripList: any[] = [];
  db: any;
  cityName: any;
  todayDate: any;
  selectedDate: any;
  selectedYear: any;
  selectedMonthName: any;
  divMainLoader = "#divMainLoader";
  serviceName = "review-trip-images";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("General-Reports","Review-Trip-Images",localStorage.getItem("userID"));
    this.setDefault();
  }

  setDefault() {
    this.todayDate = this.commonService.setTodayDate();
    this.selectedDate = this.todayDate;
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
    this.getZones();
  }

  getSelectedYearMonthName() {
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
  }

  getZones() {
    $(this.divMainLoader).show();
    let path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTripJSON%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + ".json?alt=media";
    let tripInstance = this.httpService.get(path).subscribe(data => {
      tripInstance.unsubscribe();
      if (data != null) {
        this.zoneTripList=JSON.parse(JSON.stringify(data));
      }
      $(this.divMainLoader).hide();
    }, error => {
      this.zoneList = [];
      this.zoneTripList = [];
      this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
      for (let i = 1; i < this.zoneList.length; i++) {
        this.zoneTripList.push({ zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"], tripImageList: [] });
      }
      this.getTripImages(0);
    });
  }

  getTripImages(index: any) {
    if (index == this.zoneTripList.length) {
      if (this.selectedDate != this.todayDate) {
        setTimeout(() => {
          $(this.divMainLoader).hide();
          let filePath = "/WardTripJSON/" + this.selectedYear + "/" + this.selectedMonthName + "/";
          this.commonService.saveJsonFile(this.zoneTripList, this.selectedDate + ".json", filePath);
        }, 3000);
      }
      else {
        $(this.divMainLoader).hide();
      }
    }
    else {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getTripImages");
      let zone = this.zoneTripList[index]["zoneNo"];
      let detail = this.zoneTripList.find(item => item.zoneNo == zone);
      if (detail != undefined) {
        let dbPath = "WardTrips/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + zone;
        let tripInstance = this.db.object(dbPath).valueChanges().subscribe(
          tripData => {
            tripInstance.unsubscribe();
            if (tripData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getTripImages", tripData);
              let keyArray = Object.keys(tripData);
              for (let i = 0; i < keyArray.length; i++) {
                let key = keyArray[i];
                let time = tripData[key]["time"].split(':')[0] + ":" + tripData[key]["time"].split(':')[1];
                let vehicle = tripData[key]["vehicle"];
                let imageName = tripData[key]["imageName"];
                let driverId = tripData[key]["driverId"];
                let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTrips%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + zone + "%2F" + key + "%2F" + imageName + "?alt=media";
                detail.tripImageList.push({ time: time, vehicle: vehicle, driverId: driverId, driver: "---", imageUrl: imageUrl });
              }
              this.getEmployeeNamebyId(zone);
            }
            index++;
            this.getTripImages(index);
          });
      }
    }
  }

  syncData(){
    $(this.divMainLoader).show();
    for(let i=0;i<this.zoneTripList.length;i++){
      this.zoneTripList[i]["tripImageList"]=[];
    }
    this.getTripImages(0);
  }

  getEmployeeNamebyId(zone: any) {
    let detail = this.zoneTripList.find(item => item.zoneNo == zone);
    if (detail != undefined) {
      let list = detail.tripImageList;
      for (let i = 0; i < list.length; i++) {
        this.commonService.getEmplyeeDetailByEmployeeId(list[i]["driverId"]).then((employee) => {
          list[i]["driver"] = employee["name"] != null ? employee["name"].toUpperCase() : "---";
        });
      }
    }
  }

  setDate(type: string) {
    if (type == "previous") {
      this.selectedDate = this.commonService.getPreviousDate(this.selectedDate, 1);
    }
    else if (type == "next") {
      this.selectedDate = this.commonService.getNextDate(this.selectedDate, 1);
    }
    if (new Date(this.selectedDate) > new Date(this.todayDate)) {
      this.commonService.setAlertMessage("error", "Selected date can not be more than " + this.todayDate + "");
      return;
    }
    this.getSelectedYearMonthName();
    this.getZones();
  }
}
