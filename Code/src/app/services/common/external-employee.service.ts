import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FirebaseService } from "../../firebase.service";

/*
  Employees registered in Jaipur Office whose GeneralDetails.branch is another city
  are shown on that city's Employee / Attendance pages and hidden in Jaipur Office.
  One mapping for all cities, kept in the Jaipur Office database:
    ExternalEmployeeMapping/{cityKey}/{empId} = { empCode, name, status, movedTo? }
    ExternalEmployeeMapping/lastSyncAt
  Their data is read from and saved to the Jaipur Office database.
  In page lists such an employee's empId is "ext-{empId}", so it never clashes with the city's own ids.
*/
@Injectable({
  providedIn: "root",
})
export class ExternalEmployeeService {
  readonly sourceCity = "jaipur-office";
  readonly syncUserId = "4";
  readonly mappingPath = "ExternalEmployeeMapping";
  readonly keyPrefix = "ext-";

  private sourceDb: any;

  constructor(private fs: FirebaseService, private httpService: HttpClient) { }

  getSourceDb() {
    if (!this.sourceDb) {
      this.sourceDb = this.fs.getDatabaseByCity(this.sourceCity);
    }
    return this.sourceDb;
  }

  isSourceCity(city: any) {
    return city == this.sourceCity;
  }

  canSync() {
    return localStorage.getItem("userID") == this.syncUserId;
  }

  toKey(empId: any) {
    return this.keyPrefix + empId;
  }

  isExternalKey(key: any) {
    return String(key).startsWith(this.keyPrefix);
  }

  toSourceEmpId(key: any) {
    return this.isExternalKey(key) ? String(key).substring(this.keyPrefix.length) : String(key);
  }

  /* Portal city key for a branch value (branch keeps the city's cityName, e.g. "Dausa"), "" when no city matches */
  getCityKeyByBranch(branch: any) {
    let name = String(branch || "").trim().toLowerCase();
    if (name == "") {
      return "";
    }
    let list = JSON.parse(localStorage.getItem("CityDetailList")) || [];
    let detail = list.find(item => String(item.cityName || "").trim().toLowerCase() == name);
    return detail != undefined ? detail.city : "";
  }

  /* True when a Jaipur Office employee works in another city, so Jaipur Office pages do not show it */
  isWorkingElsewhere(branch: any) {
    let cityKey = this.getCityKeyByBranch(branch);
    return cityKey != "" && cityKey != this.sourceCity;
  }

  readOnce(db: any, path: string) {
    return new Promise<any>((resolve) => {
      let instance = db.object(path).valueChanges().subscribe(data => {
        instance.unsubscribe();
        resolve(data);
      }, () => {
        resolve(null);
      });
    });
  }

  /* Mapped employees of a city (moved ones are left out): [{ empId, empCode, name, status }] */
  async getMappedEmployees(city: any) {
    if (this.isSourceCity(city)) {
      return [];
    }
    let data = await this.readOnce(this.getSourceDb(), this.mappingPath + "/" + city);
    let list = [];
    if (data != null) {
      Object.keys(data).forEach(empId => {
        if (data[empId] && !data[empId]["movedTo"]) {
          list.push({ empId: empId, empCode: data[empId]["empCode"] || "", name: data[empId]["name"] || "", status: data[empId]["status"] || "" });
        }
      });
    }
    return list;
  }

  getLastSyncAt() {
    return this.readOnce(this.getSourceDb(), this.mappingPath + "/lastSyncAt");
  }

  /* Rebuilds the mapping of all cities from the Jaipur Office employees (active and inactive). Never deletes an entry. */
  async syncMapping(lastSyncAt: string) {
    if (!this.canSync()) {
      return { status: "fail", message: "You are not allowed to sync." };
    }
    let db = this.getSourceDb();
    let lastEmpId = Number(await this.readOnce(db, "Employees/lastEmpId")) || 0;
    const promises = [];
    for (let i = 1; i <= lastEmpId; i++) {
      promises.push(this.readOnce(db, "Employees/" + i + "/GeneralDetails").then(detail => ({ empId: i.toString(), detail: detail })));
    }
    let employees = await Promise.all(promises);
    let mapping = {};
    let workingCityByEmpId = {};
    employees.forEach(item => {
      if (item.detail == null) {
        return;
      }
      let cityKey = this.getCityKeyByBranch(item.detail["branch"]);
      workingCityByEmpId[item.empId] = cityKey != "" ? cityKey : this.sourceCity;
      if (cityKey == "" || cityKey == this.sourceCity) {
        return;
      }
      if (mapping[cityKey] == undefined) {
        mapping[cityKey] = {};
      }
      mapping[cityKey][item.empId] = {
        empCode: item.detail["empCode"] || "",
        name: item.detail["name"] || "",
        status: item.detail["status"] != null ? String(item.detail["status"]) : ""
      };
    });
    // An employee no longer working in a city stays in its old entry, marked inactive with the city it moved to
    let existing = await this.readOnce(db, this.mappingPath) || {};
    Object.keys(existing).forEach(cityKey => {
      if (existing[cityKey] == null || typeof existing[cityKey] != "object") {
        return;
      }
      Object.keys(existing[cityKey]).forEach(empId => {
        if (mapping[cityKey] != undefined && mapping[cityKey][empId] != undefined) {
          return;
        }
        if (mapping[cityKey] == undefined) {
          mapping[cityKey] = {};
        }
        mapping[cityKey][empId] = { ...existing[cityKey][empId], status: "2", movedTo: workingCityByEmpId[empId] || "" };
      });
    });
    let count = 0;
    Object.keys(mapping).forEach(cityKey => {
      count += Object.keys(mapping[cityKey]).filter(empId => !mapping[cityKey][empId]["movedTo"]).length;
    });
    mapping["lastSyncAt"] = lastSyncAt;
    await db.object(this.mappingPath).update(mapping);
    return { status: "success", message: count + " employees synced.", lastSyncAt: lastSyncAt };
  }

  /* Pending attendance modification requests of the given Jaipur Office empIds, read the same way the Jaipur Office page reads them */
  async getModificationRequests(empIds: string[], todayDate: string) {
    if (empIds.length == 0) {
      return [];
    }
    let db = this.getSourceDb();
    let list = [];
    let fromJson = false;
    let cityDetail = (JSON.parse(localStorage.getItem("CityDetailList")) || []).find(item => item.city == this.sourceCity);
    if (cityDetail != undefined) {
      let basePath = cityDetail.firebaseStoragePath + cityDetail.storageCity + "%2FAttendanceModificationRequestJSON%2F";
      let dateObj = await this.getJson(basePath + "lastUpdateDate.json?alt=media");
      if (dateObj && new Date(dateObj["lastUpdatedAt"]).toDateString() == new Date(todayDate).toDateString()) {
        let response = await this.getJson(basePath + "modifcationRequest.json?alt=media");
        if (Array.isArray(response)) {
          list = response;
          fromJson = true;
        }
      }
    }
    if (!fromJson) {
      let data = await this.readOnce(db, "ModificationRequests");
      if (data != null) {
        Object.keys(data).forEach(id => {
          if (data[id] && String(data[id]["isApproved"]) === "false") {
            list.push({ modificationId: id, ...data[id] });
          }
        });
      }
    }
    list = list.filter(item => empIds.includes(String(item.empId)));
    if (fromJson) {
      // The file can be old, so check each request is still not approved
      let checked = await Promise.all(list.map(item => this.readOnce(db, "ModificationRequests/" + item.modificationId + "/isApproved")));
      list = list.filter((item, index) => String(checked[index]) === "false");
    }
    return list;
  }

  private getJson(path: string) {
    return new Promise<any>((resolve) => {
      let instance = this.httpService.get(path).subscribe(response => {
        instance.unsubscribe();
        resolve(response);
      }, () => {
        resolve(null);
      });
    });
  }
}
