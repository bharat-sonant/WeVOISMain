import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from "../../services/common/common.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "@angular/fire/storage";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { promise } from 'protractor';

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
  vehicleCapacityObject:any={};
  totalWasteCollected:number=0;
  totalTripCounts:number=0;
  imageNotAvailablePath = "../assets/img/img-not-available-01.jpg";

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
    this.getVehicleTypeCapacity();
    this.getZones();
    
  }

  getSelectedYearMonthName() {
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
  }

  getZones=async()=>{
    $(this.divMainLoader).show();
    this.zoneList = [];
    this.zoneTripList = [];
    this.totalWasteCollected=0;
    this.totalTripCounts = 0;
    let dustbinPlans=await this.getDustbinPickingPlans();
    

    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    for (let i = 1; i < this.zoneList.length; i++) {
      this.zoneTripList.push({ zoneNo: this.zoneList[i]["zoneNo"], zoneName: this.zoneList[i]["zoneName"], tripImageList: [] });
    }
    this.zoneTripList = this.zoneTripList.concat(dustbinPlans);
    const promises = [];
        for (let i = 0; i < this.zoneTripList.length; i++) {
          promises.push(Promise.resolve(this.getTripImages(this.zoneTripList[i].zoneNo)));
        }
        Promise.all(promises).then((results) => {
          for (let i = 0; i < results.length; i++) {
            if (results[i]["status"] == "success") {
              let detail=this.zoneTripList.find(item=>item.zoneNo==results[i]["data"].zoneNo);
              if(detail!=undefined){
                detail.tripImageList=results[i]["data"].tripImageList;
                detail.collectedZoneWaste=results[i]["data"].collectedZoneWaste;
                this.getEmployeeNamebyId(results[i]["data"].zoneNo);
                const tripCount = results[i]["data"].tripImageList.length || 0;
                detail.tripCount = tripCount;
                this.totalTripCounts += tripCount;
              }
            }
          }          
         $(this.divMainLoader).hide();
        });
  }

  getTripImages(zoneNo:any){
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getTripImages");
    return new Promise((resolve) => {
      let dbPath = "WardTrips/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate + "/" + zoneNo;
      let tripInstance = this.db.object(dbPath).valueChanges().subscribe(
        tripData => {
          tripInstance.unsubscribe();
          if (tripData != null) {
            let tripImageList=[];
            let collectedZoneWaste=0;
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getTripImages", tripData);
            let keyArray = Object.keys(tripData);
            for (let i = 0; i < keyArray.length; i++) {
              let key = keyArray[i];
              let time = "";
              let yardTime="";
              if(tripData[key]["time"]!=null){
                time=tripData[key]["time"].split(':')[0] + ":" + tripData[key]["time"].split(':')[1];
              }
              if(tripData[key]["yardTime"]!=null){
                yardTime=tripData[key]["yardTime"].split(':')[0] + ":" + tripData[key]["yardTime"].split(':')[1];
              }
              let vehicle = tripData[key]["vehicle"];
              let wasteCollection=this.getWasteCollectionByVehicle(vehicle);
              collectedZoneWaste+= Number(wasteCollection);
              
              let imageName =tripData[key]["imageName"]? tripData[key]["imageName"]:"";
              let imageName2 =tripData[key]["imageName2"]?tripData[key]["imageName2"]:"";
              
              let yardImageName =tripData[key]["yardImageName1"]? tripData[key]["yardImageName1"]:"";
              let yardImageName2 =tripData[key]["yardImageName2"]?tripData[key]["yardImageName2"]:"";

              let driverId = tripData[key]["driverId"];
              let imageUrl =imageName!=""? this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTrips%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + zoneNo + "%2F" + key + "%2F" + imageName + "?alt=media":this.imageNotAvailablePath;
              let imageUrl2 =imageName2!=""? this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTrips%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + zoneNo + "%2F" + key + "%2F" + imageName2 + "?alt=media":this.imageNotAvailablePath;
              let imageUrl3 =yardImageName!=""? this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTrips%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + zoneNo + "%2F" + key + "%2F" + yardImageName + "?alt=media":this.imageNotAvailablePath;
              let imageUrl4 =yardImageName2!=""? this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FWardTrips%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2F" + this.selectedDate + "%2F" + zoneNo + "%2F" + key + "%2F" + yardImageName2 + "?alt=media":this.imageNotAvailablePath;
              tripImageList.push({ time: time, vehicle: vehicle, driverId: driverId, driver: "---",yardTime:yardTime, imageUrl: imageUrl,imageUrl2:imageUrl2,imageUrl3:imageUrl3,imageUrl4:imageUrl4,wasteCollection });
            }
            this.totalWasteCollected += Number(collectedZoneWaste)
            resolve({ status: "success", data: {zoneNo:zoneNo,tripImageList:tripImageList,collectedZoneWaste} });
          }
          else{
            resolve({ status: "fail", data: {} });
          } 
        });
    });    
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
  getDustbinPickingPlans=async()=>{
    const pickingPlanPromise = new Promise((resolve, reject) => {
      const pickingPlanInstance = this.db.object(`DustbinData/DustbinPickingPlans/${this.selectedDate}`).valueChanges().subscribe(
        planData => {
          resolve(planData || {});
          pickingPlanInstance.unsubscribe();
        },
        error => resolve({})
      );
    });
  
    const pickingPlanHistoryPromise = new Promise((resolve, reject) => {
      const pickingPlanHistoryInstance = this.db.object(`DustbinData/DustbinPickingPlanHistory/${this.selectedYear}/${this.selectedMonthName}/${this.selectedDate}`).valueChanges().subscribe(
        historyData => {
          resolve(historyData || {});
          pickingPlanHistoryInstance.unsubscribe();
        },
        error => resolve({})
      );
    });
      
    return Promise.all([pickingPlanPromise, pickingPlanHistoryPromise])
    .then(responses => {
      const [planData, historyData]:any = responses;
      let mergedObj={...planData,...historyData};
      let binLiftingArray=Object.keys(mergedObj).map(key=>({ zoneNo:key, zoneName: mergedObj[key]["planName"], tripImageList: [] }));
      return binLiftingArray; // Return the combined data
    })
    .catch(error => {
      console.error("Error fetching data:", error);
    });
  }
  getVehicleTypeCapacity=()=>{
    this.vehicleCapacityObject={};
    let vehicleCapacityInstance=this.db.object(`Settings/WasteCollectionVehicleCapacity`).valueChanges().subscribe(data=>{
      vehicleCapacityInstance.unsubscribe();
      if(data){
        this.vehicleCapacityObject=data;
      }
    });
  }
  getWasteCollectionByVehicle=(vehicle:any)=>{
    if(vehicle){
      let vehicleKeys = vehicle.split('-');
      let collectionWeight=0;
      vehicleKeys.forEach(key=>{
        if(this.vehicleCapacityObject[key]){
          collectionWeight= Number(this.vehicleCapacityObject[key]);
        }
      });
      return collectionWeight;
    }
    else{
      return 0;
    }
  }
}
