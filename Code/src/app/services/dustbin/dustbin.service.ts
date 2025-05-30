import { Injectable } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";
import { HttpClient } from "@angular/common/http";
import { AngularFireList, AngularFireObject } from 'angularfire2/database';
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Injectable({
  providedIn: 'root'
})
export class DustbinService {

  plansRef: AngularFireList<any>;
  planRef: AngularFireObject<any>;
  db: any;
  serviceName = "dustbin-service";
  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }

  getDustbinZone() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinZone");
    return new Promise((resolve) => {
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/AvailableZone/zone";
      let zoneInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          zoneInstance.unsubscribe();
          if (data != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinZone", data);
            resolve(data);
          }
        }, error => {
          resolve(null);
        });
    });
  }




  updateDustbinDetail(dustbinId: any, data: any, type: any) {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    let dbPath = "DustbinData/DustbinDetails/" + dustbinId;
    if (type == "add") {
      this.db.object(dbPath).update({ address: data.address, zone: data.zone, ward: data.ward, lat: data.lat, lng: data.lng, type: data.type, pickFrequency: data.pickFrequency, createdDate: data.createdDate, dustbinType: data.dustbinType });
    }
    else {
      this.db.object(dbPath).update({ address: data.address, zone: data.zone, ward: data.ward, lat: data.lat, lng: data.lng, type: data.type, pickFrequency: data.pickFrequency });
    }
  }

  updateDustbinStatus(dustbinId: any, status: any) {
    let disabledDate = null;
    if (status == "yes") {
      disabledDate = this.commonService.setTodayDate();
    }
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    let dbPath = "DustbinData/DustbinDetails/" + dustbinId;
    this.db.object(dbPath).update({ isDisabled: status, disabledDate: disabledDate });
  }

  getDustbinWardMappingJson() {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDustbinData%2FmappingDustbinWard.json?alt=media";
      let dutbinWardJSONInstance = this.httpService.get(path).subscribe(DustbinWardJsonData => {
        dutbinWardJSONInstance.unsubscribe();
        resolve(DustbinWardJsonData);
      }, error => {
        resolve(null);
      });
    });
  }

  getOpenDepotWardMappingJson() {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDustbinData%2FmappingOpenDepotWard.json?alt=media";
      let dutbinWardJSONInstance = this.httpService.get(path).subscribe(DustbinWardJsonData => {
        dutbinWardJSONInstance.unsubscribe();
        resolve(DustbinWardJsonData);
      }, error => {
        resolve(null);
      });
    });
  }

  getDustbinPickingPlanHistory(year: any, monthName: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPickingPlanHistory");
    return new Promise((resolve) => {
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName;
      let dustbinPlanHistoryInstance = this.db.object(dbPath).valueChanges().subscribe(
        planHistoryData => {
          dustbinPlanHistoryInstance.unsubscribe();
          if (planHistoryData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPickingPlanHistory", planHistoryData);
          }
          resolve(planHistoryData);
        }
      );
    });
  }

  getDustbinPickingPlanHistoryDateWise(year: any, monthName: any, date: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPickingPlanHistoryDateWise");
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDustbinData%2FDustbinPickingPlanHistory%2F" + year + "%2F" + monthName + "%2F" + date + ".json?alt=media";
      let dustbinPlanHistoryInstance = this.httpService.get(path).subscribe(planHistoryData => {
        dustbinPlanHistoryInstance.unsubscribe();
        resolve(planHistoryData);
      }, error => {
        this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
        let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date;
        let dustbinPlanHistoryInstance = this.db.object(dbPath).valueChanges().subscribe(
          planHistoryData => {
            if (planHistoryData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPickingPlanHistoryDateWise", planHistoryData);
            }
            dustbinPlanHistoryInstance.unsubscribe();
            this.commonService.saveJsonFile(planHistoryData, date + ".json", "/DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/")
            resolve(planHistoryData);
          }
        );
      });
    });
  }

  getDustbinPickingPlans() {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPickingPlans");
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlans";
      let dustbinPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
        planData => {
          dustbinPlanInstance.unsubscribe();
          if (planData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPickingPlans", planData);
          }
          resolve(planData);
        }
      );
    });
  }

  getDustbinPickingPlansByDate(date: any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPickingPlansByDate");
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date;
      if (date == this.commonService.setTodayDate()) {
        dbPath = "DustbinData/DustbinPickingPlans/" + date;
      }
      let dustbinPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
        planListData => {
          dustbinPlanInstance.unsubscribe();
          if (planListData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPickingPlansByDate", planListData);
          }
          resolve(planListData);
        }
      );
    });
  }

  getAssignedDustbinByDate(date: any) {
    return new Promise((resolve) => {
      let planList = [];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      let year = date.split("-")[0];
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinAssignment/" + year + "/" + monthName + "/" + date;
      let assignedPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          assignedPlanInstance.unsubscribe();
          if (data != null) {
            const promises = [];
            let keyArray = Object.keys(data);
            for (let i = 0; i < keyArray.length; i++) {
              const planId = keyArray[i];
              promises.push(Promise.resolve(this.getAssignedDustbinPlanByPlanId(planId, date, data)));
            }

            Promise.all(promises).then((results) => {
              let merged = [];
              for (let i = 0; i < results.length; i++) {
                if (results[i]["status"] == "success") {
                  merged = merged.concat(results[i]["data"]);
                }
              }
              planList = merged;
              if (planList.length > 0) {
                resolve({ status: "success", data: planList });
              }
              else {
                resolve({ status: "fail", data: planList });
              }
            });
          }
          else {
            resolve({ status: "fail", data: planList });
          }
        });


    });
  }


  getAssignedDustbinPlanByPlanId(planId: any, date: any, assignedData: any) {
    return new Promise((resolve) => {
      let list = [];
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId");
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date + "/" + planId;
      let preDateInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        preDateInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId", data);
          if (data["planName"] != "") {
            if (data["planType"] == null || data["planType"] == "Dustbin") {
              if (data["isWardPlan"] == null) {
                list.push({ id: planId, planName: assignedData[planId]["planName"], vehicle: assignedData[planId]["vehicle"], driver: assignedData[planId]["driver"], planData: data });
              }
            }
          }

          dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId", planData);
              if (planData["planName"] != "") {
                if (planData["planType"] == null || planData["planType"] == "Dustbin") {
                  if (planData["isWardPlan"] == null) {
                    list.push({ id: planId, planName: assignedData[planId]["planName"], vehicle: assignedData[planId]["vehicle"], driver: assignedData[planId]["driver"], planData: planData });
                  }
                }
              }
            }
            resolve({ status: "success", data: list });
          });
        }
        else {
          dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId", planData);
              if (planData["planName"] != "") {
                if (planData["planType"] == null || planData["planType"] == "Dustbin") {
                  if (planData["isWardPlan"] == null) {
                    list.push({ id: planId, planName: assignedData[planId]["planName"], vehicle: assignedData[planId]["vehicle"], driver: assignedData[planId]["driver"], planData: planData });
                  }
                }
              }
            }
            resolve({ status: "success", data: list });
          });

        }
      });
    });
  }

  getAssignedOpenDepotByDate(date: any) {
    return new Promise((resolve) => {
      let planList = [];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      let year = date.split("-")[0];
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinAssignment/" + year + "/" + monthName + "/" + date;
      let assignedPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          assignedPlanInstance.unsubscribe();
          if (data != null) {
            const promises = [];
            let keyArray = Object.keys(data);
            for (let i = 0; i < keyArray.length; i++) {
              const planId = keyArray[i];
              promises.push(Promise.resolve(this.getAssignedOpenDepotPlanByPlanId(planId, date, data)));
            }

            Promise.all(promises).then((results) => {
              let merged = [];
              for (let i = 0; i < results.length; i++) {
                if (results[i]["status"] == "success") {
                  merged = merged.concat(results[i]["data"]);
                }
              }
              planList = merged;
              if (planList.length > 0) {
                resolve({ status: "success", data: planList });
              }
              else {
                resolve({ status: "fail", data: planList });
              }
            });
          }
          else {
            resolve({ status: "fail", data: planList });
          }
        });


    });
  }



  getAssignedOpenDepotPlanByPlanId(planId: any, date: any, assignedData: any) {
    return new Promise((resolve) => {
      let list = [];
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId");
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date + "/" + planId;
      let preDateInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        preDateInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId", data);
          if (data["planName"] != "") {
            if (data["planType"] == "Open Depot") {
              let isWardPlan = "0"
              if (data["isWardPlan"] != null) {
                isWardPlan = data["isWardPlan"];
              }
              // if (data["isWardPlan"] == null) {
              list.push({ id: planId, planName: assignedData[planId]["planName"], vehicle: assignedData[planId]["vehicle"], driver: assignedData[planId]["driver"], planData: data, isWardPlan: isWardPlan });
              // }
            }
          }

          dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId", planData);
              if (planData["planName"] != "") {
                if (planData["planType"] == "Open Depot") {
                  let isWardPlan = "0"
                  if (planData["isWardPlan"] != null) {
                    isWardPlan = planData["isWardPlan"];
                  }
                  //  if (planData["isWardPlan"] == null) {
                  list.push({ id: planId, planName: assignedData[planId]["planName"], vehicle: assignedData[planId]["vehicle"], driver: assignedData[planId]["driver"], planData: planData, isWardPlan: isWardPlan });
                  //  }
                }
              }
            }
            resolve({ status: "success", data: list });
          });
        }
        else {
          dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedOpenDepotPlanByPlanId", planData);
              if (planData["planName"] != "") {
                if (planData["planType"] == "Open Depot") {
                  let isWardPlan = "0"
                  if (planData["isWardPlan"] != null) {
                    isWardPlan = planData["isWardPlan"];
                  }
                  // if (planData["isWardPlan"] == null) {
                  list.push({ id: planId, planName: assignedData[planId]["planName"], vehicle: assignedData[planId]["vehicle"], driver: assignedData[planId]["driver"], planData: planData,isWardPlan:isWardPlan });
                  // }
                }
              }
            }
            resolve({ status: "success", data: list });
          });

        }
      });
    });
  }


  getOpenDepotPreviousPlanByDate(date: any) {
    return new Promise((resolve) => {
      let list = [];
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getOpenDepotPreviousPlanByDate");
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date;
      let preDateInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        preDateInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getOpenDepotPreviousPlanByDate", data);
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let planId = keyArray[i];
            if (data[planId]["planName"] != null) {
              if (data[planId]["planType"] == "Open Depot") {
                if (data[planId]["isWardPlan"] == null) {
                  list.push({ planId: planId, planName: data[planId]["planName"], planData: data[planId] });
                }
              }
            }
          }
          dbPath = "DustbinData/DustbinPickingPlans/" + date;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getOpenDepotPreviousPlanByDate", planData);
              let keyArray = Object.keys(planData);
              for (let i = 0; i < keyArray.length; i++) {
                let planId = keyArray[i];
                if (planData[planId]["planName"] != null) {
                  if (planData[planId]["planType"] == "Open Depot") {
                    if (planData[planId]["isWardPlan"] == null) {
                      list.push({ planId: planId, planName: planData[planId]["planName"], planData: planData[planId] });
                    }
                  }
                }
              }

            }
            resolve(list);
          });
        }
        else {
          dbPath = "DustbinData/DustbinPickingPlans/" + date;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getOpenDepotPreviousPlanByDate", planData);
              let keyArray = Object.keys(planData);
              for (let i = 0; i < keyArray.length; i++) {
                let planId = keyArray[i];
                if (planData[planId]["planName"] != null) {
                  if (planData[planId]["planType"] == "Open Depot") {
                    if (planData[planId]["isWardPlan"] == null) {
                      list.push({ planId: planId, planName: planData[planId]["planName"], planData: planData[planId] });
                    }
                  }
                }
              }

            }
            resolve(list);
          });

        }
      });
    });
  }

  getDustbinPreviousPlanByDate(date: any) {
    return new Promise((resolve) => {
      let list = [];
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPreviousPlanByDate");
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date;
      let preDateInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        preDateInstance.unsubscribe();
        if (data != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPreviousPlanByDate", data);
          let keyArray = Object.keys(data);
          for (let i = 0; i < keyArray.length; i++) {
            let planId = keyArray[i];
            if (data[planId]["planName"] != null) {
              if (data[planId]["planType"] == null || data[planId]["planType"] == "Dustbin") {
                list.push({ planId: planId, planName: data[planId]["planName"], planData: data[planId] });
              }
            }
          }
          dbPath = "DustbinData/DustbinPickingPlans/" + date;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPreviousPlanByDate", planData);
              let keyArray = Object.keys(planData);
              for (let i = 0; i < keyArray.length; i++) {
                let planId = keyArray[i];
                if (planData[planId]["planName"] != null) {
                  if (planData[planId]["planType"] == null || planData[planId]["planType"] == "Dustbin") {
                    list.push({ planId: planId, planName: planData[planId]["planName"], planData: planData[planId] });
                  }
                }
              }

            }
            resolve(list);
          });
        }
        else {
          dbPath = "DustbinData/DustbinPickingPlans/" + date;
          let planInstance = this.db.object(dbPath).valueChanges().subscribe(planData => {
            planInstance.unsubscribe();
            if (planData != null) {
              this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPreviousPlanByDate", planData);
              let keyArray = Object.keys(planData);
              for (let i = 0; i < keyArray.length; i++) {
                let planId = keyArray[i];
                if (planData[planId]["planName"] != null) {
                  if (planData[planId]["planType"] == null || planData[planId]["planType"] == "Dustbin") {
                    list.push({ planId: planId, planName: planData[planId]["planName"], planData: planData[planId] });
                  }
                }
              }

            }
            resolve(list);
          });

        }
      });
    });
  }


  getWardAssignedDustbin(year: any, monthName: any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getWardAssignedDustbin");
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinAssignToWard/" + year + "/" + monthName;
      let wardDustbinPlanInstance = this.db.object(dbPath).valueChanges().subscribe(
        planData => {
          wardDustbinPlanInstance.unsubscribe();
          if (planData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getWardAssignedDustbin", planData);
          }
          resolve(planData);
        }
      );
    });
  }

  getDustbinHistoryJson(year: any, monthName: any, zone: any) {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDustbinData%2F" + year + "%2F" + monthName + "%2F" + zone + ".json?alt=media";
      let dutbinJSONInstance = this.httpService.get(path).subscribe(planJsonData => {
        dutbinJSONInstance.unsubscribe();
        resolve(planJsonData);
      });
    });
  }

  getDustbinPlanDetail(date: any, key: any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPlanDetail");
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + key + "";
      let planInstance = this.db.object(dbPath).valueChanges().subscribe(
        planData => {
          planInstance.unsubscribe();
          if (planData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPlanDetail", planData);
          }
          resolve(planData);
        });
    });
  }

  getDustbinPlanData(date: any, planId: any, type: any, year: any, monthName: any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPlanData");
      let dbPath = "DustbinData/DustbinPickingPlans/" + date + "/" + planId + "";
      if (type == "History") {
        dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date + "/" + planId + "";
      }
      let planDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
        planDustbinData => {
          planDustbinInstance.unsubscribe();
          if (planDustbinData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPlanData", planDustbinData);
          }
          resolve(planDustbinData);
        });
    });
  }

  getDustbinPickHistory(year: any, monthName: any, date: any, dustbinId: any, planId: any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPickHistory");
      let dbPath = "DustbinData/DustbinPickHistory/" + year + "/" + monthName + "/" + date + "/" + dustbinId + "/" + planId;
      let dustbinPickInstance = this.db.object(dbPath).valueChanges().subscribe(
        dustbinPickData => {
          dustbinPickInstance.unsubscribe();
          if (dustbinPickData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPickHistory", dustbinPickData);
          }
          resolve(dustbinPickData);
        });
    });
  }

  getDustbinPickedAnalysisDetail(year: any, monthName: any, date: any, dustbinId: any, planId: any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getDustbinPickedAnalysisDetail");
      let dbPath = "DustbinData/DustbinPickHistory/" + year + "/" + monthName + "/" + date + "/" + dustbinId + "/" + planId + "/Analysis";
      let pickedAnalysisDustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
        pickAnalysisData => {
          pickedAnalysisDustbinInstance.unsubscribe();
          if (pickAnalysisData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getDustbinPickedAnalysisDetail", pickAnalysisData);
          }
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
      planType: plan.planType,
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
      planType: plan.planType,
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

  movePlanToDustbinPlanHistory(date: any,planData:any,planId:any) {
    return new Promise((resolve) => {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "movePlanToDustbinPlanHistory");
      let year = date.split('-')[0];
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
      let dbPath = "DustbinData/DustbinPickingPlanHistory/" + year + "/" + monthName + "/" + date+"/"+planId;
      console.log(dbPath);
      console.log(planData);
      this.db.object(dbPath).update(planData);
     
    });
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
  planType: string;
  totalDustbin: number;
  updatedAt: string;
  updatedBy: string;
  zone: string;
  maxDustbinCapacity: number;
  isConfirmed: string;
  pickedDustbin: string;
  highPriority: string;
}