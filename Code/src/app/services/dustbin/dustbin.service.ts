import { Injectable } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireList, AngularFireObject } from 'angularfire2/database';

@Injectable({
  providedIn: 'root'
})
export class DustbinService {

  plansRef: AngularFireList<any>;
  planRef: AngularFireObject<any>;
  db: any;
  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) {

  }

  getDustbinPickingPlanHistory(year: any, monthName: any) {
    return new Promise((resolve) => {
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName;
      let dustbinPlanHistoryInstance = this.db.object(dbPath).valueChanges().subscribe(
        planHistoryData => {
          dustbinPlanHistoryInstance.unsubscribe();
          resolve(planHistoryData);
        }
      );
    });
  }

  getDustbinPickingPlans() {
    return new Promise((resolve) => {
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlans";
      let dustbinPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
        planData => {
          dustbinPlanInstance.unsubscribe();
          resolve(planData);
        }
      );
    });
  }

  getDustbinHistoryJson(year: any, monthName: any, zone: any) {
    return new Promise((resolve) => {
      const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FDustbinData%2F" + year + "%2F" + monthName + "%2F" + zone + ".json?alt=media";
      let dutbinJSONInstance = this.httpService.get(path).subscribe(planJsonData => {
        dutbinJSONInstance.unsubscribe();
        resolve(planJsonData);
      });
    });
  }

  getDustbinPlanDetail(date: any, key: any) {
    return new Promise((resolve) => {
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + key + "";
      let planInstance = this.db.object(dbPath).valueChanges().subscribe(
        planData => {
          planInstance.unsubscribe();
          resolve(planData);
        });
    });
  }

  getDustbinPlanData(date: any, planId: any, type: any, year: any, monthName: any) {
    return new Promise((resolve) => {
      let dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId + "";
      if (type == "History") {
        dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date + "/" + planId + "";
      }
      let planDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
        planDustbinData => {
          planDustbinInstance.unsubscribe();
          resolve(planDustbinData);
        });
    });
  }

  getDustbinPickHistory(year: any, monthName: any, date: any, dustbinId: any, planId: any) {
    return new Promise((resolve) => {
      let dbPath = "DustbinData/DustbinPickHistory/" + year + "/" + monthName + "/" + date + "/" + dustbinId + "/" + planId;
      let dustbinPickInstance = this.db.object(dbPath).valueChanges().subscribe(
        dustbinPickData => {
          dustbinPickInstance.unsubscribe();
          resolve(dustbinPickData);
        });
    });
  }

  getDustbinPickedAnalysisDetail(year: any, monthName: any, date: any, dustbinId: any, planId: any) {
    return new Promise((resolve) => {
      let dbPath = "DustbinData/DustbinPickHistory/" + year + "/" + monthName + "/" + date + "/" + dustbinId + "/" + planId + "/Analysis";
      let pickedAnalysisDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
        pickAnalysisData => {
          pickedAnalysisDustbinInstance.unsubscribe();
          resolve(pickAnalysisData);
        });
    });
  }

  updateDustbinPlans(bins: any, zone: any, totalDustbin: any, date, planId: any, sequence: any, highPriority: any) {
    this.db.object("DustbinData/DustbinPickingPlans/" + date + "/" + planId + "").update({
      "bins": bins,
      "pickingSequence": sequence,
      "updatedAt": this.commonService.getTodayDateTime(),
      "updatedBy": localStorage.getItem("userId"),
      "zone": zone,
      "totalDustbin": totalDustbin,
      "highPriority": highPriority
    });
  }

  getIcon(type: any) {
    let icon = "";
    if (type == "picked") {
      icon = "<img src='../../assets/img/Green-Circle-dustbin.png' height='20px'>";
    }
    else if (type == "dustbinNotFound") {
      icon = "<img src='../../assets/img/dustbin-circular-red.png' height='20px'>";
    }
    else if (type == "assignedNotPicked") {
      icon = "<img src='../../assets/img/blue without tick rectangle.png' height='20px'>";
    }
    else if (type == "dustbinNotFilled") {
      icon = "<img src='../../assets/img/Green-Circle-dustbin.png' height='20px'>";
    }
    else if (type == "planDustbin") {
      icon = "../../assets/img/blue-rectange-dustbin.svg";
    }
    else if (type == "selectedDustbin") {
      icon = "../../assets/img/blue-rectange-dustbin.svg";
    }
    else if (type == "pickedDustbin") {
      icon = "../../assets/img/green-rectange-dustbin.svg";
    }
    return icon;
  }

  addPlan(plan: DustbinPlans, path: any) {
    let db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.plansRef = db.list(path);
    this.plansRef.push({
      bins: plan.bins,
      createdAt: plan.createdAt,
      createdBy: plan.createdBy,
      dustbinPickingPosition: plan.dustbinPickingPosition,
      isAssigned: plan.isAssigned,
      pickingSequence: plan.pickingSequence,
      planName: plan.planName,
      totalDustbin: plan.totalDustbin,
      updatedAt: plan.updatedAt,
      updatedBy: plan.updatedBy,
      zone: plan.zone,
      maxDustbinCapacity: plan.maxDustbinCapacity,
      isConfirmed: plan.isConfirmed,
      pickedDustbin: plan.pickedDustbin,
      highPriority: plan.highPriority
    })
  }

  UpdatePlan(plan: DustbinPlans, path: any) {
    let db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.planRef = db.object('/' + path + '/' + plan.$Key);
    this.planRef.update({
      bins: plan.bins,
      createdAt: plan.createdAt,
      createdBy: plan.createdBy,
      dustbinPickingPosition: plan.dustbinPickingPosition,
      isAssigned: plan.isAssigned,
      pickingSequence: plan.pickingSequence,
      planName: plan.planName,
      totalDustbin: plan.totalDustbin,
      updatedAt: plan.updatedAt,
      updatedBy: plan.updatedBy,
      zone: plan.zone,
      maxDustbinCapacity: plan.maxDustbinCapacity,
      isConfirmed: plan.isConfirmed,
      pickedDustbin: plan.pickedDustbin,
      highPriority: plan.highPriority
    })
  }

  deletePlan(date: any, key: any) {
    let dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + key + "";
    this.db.object(dbPath).remove();
  }
}


export interface DustbinPlans {
  $Key: any;
  bins: string;
  createdAt: string;
  createdBy: string;
  dustbinPickingPosition: string;
  isAssigned: string;
  pickingSequence: string;
  planName: string;
  totalDustbin: number;
  updatedAt: string;
  updatedBy: string;
  zone: string;
  maxDustbinCapacity: number;
  isConfirmed: string;
  pickedDustbin: string;
  highPriority: string;
}