import { Injectable } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }

  getRoles() {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + "Common%2FRoles.json?alt=media";
      let roleJSONInstance = this.httpService.get(path).subscribe(roleJsonData => {
        roleJSONInstance.unsubscribe();
        resolve(roleJsonData);
      }, error => {
        roleJSONInstance.unsubscribe();
        resolve(null);
      });
    });
  }

  getPortalPages() {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + "Common%2FPortalPages.json?alt=media";
      let portalPageJSONInstance = this.httpService.get(path).subscribe(portalPageJsonData => {
        portalPageJSONInstance.unsubscribe();
        resolve(portalPageJsonData);
      }, error => {
        portalPageJSONInstance.unsubscribe();
        resolve(null);
      });
    });
  }

  getPortalAccessPages() {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + "Common%2FRoles.json?alt=media";
      let roleJSONInstance = this.httpService.get(path).subscribe(roleJsonData => {
        roleJSONInstance.unsubscribe();
        resolve(roleJsonData);
      }, error => {
        roleJSONInstance.unsubscribe();
        resolve(null);
      });
    });
  }

  saveRoles(roleJSONData: any) {
    this.commonService.saveCommonJsonFile(roleJSONData, "Roles.json", "/Common/");
  }

  getPortalUsers() {
    return new Promise((resolve) => {
      const path = this.commonService.fireStoragePath + "Common%2FPortalUsers.json?alt=media";
      let portalUsersJSONInstance = this.httpService.get(path).subscribe(portalUsersJsonData => {
        portalUsersJSONInstance.unsubscribe();
        resolve(portalUsersJsonData);
      }, error => {
        portalUsersJSONInstance.unsubscribe();
        resolve(null);
      });
    });
  }

  savePortalUsers(portalUsersJSONData: any) {
    this.commonService.saveCommonJsonFile(portalUsersJSONData, "PortalUsers.json", "/Common/");
  }

  getUserLastLogin(userId:any){
    return new Promise((resolve) => {
      let lastLogin="---";
      const path = this.commonService.fireStoragePath + "Common%2FEmployeeLastLogin%2F"+userId+".json?alt=media";
      let lastLoginJSONInstance = this.httpService.get(path).subscribe(lastLoginJsonData => {
        lastLoginJSONInstance.unsubscribe();        
        if(lastLoginJsonData["lastLogin"]!=null){
          let days=this.commonService.getDaysBetweenDates(lastLoginJsonData["lastLogin"].split(" ")[0],this.commonService.setTodayDate());
          lastLogin=days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} Days Ago`;
        }
        resolve(lastLogin);
      }, error => {
        lastLoginJSONInstance.unsubscribe();
        resolve(lastLogin);
      });
    });

  }

  setWebPortalUsers() {
    
    let userList = [];
    this.getPortalUsers().then((data: any) => {
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let key = keyArray[i];
            if (data[key]["name"] != null) {
              let imgUrl = "internal-user.png";
              let utitle = "Internal User";
              if (data[key]["userType"] == "External User") {
                imgUrl = "external-user.png";
                utitle = "External User";
              }
              let haltDisableAccess = 0;
              let isActual = 0;
              let isLock = 0;
              let isAdmin = 0;
              let isActualWorkPercentage=0;
              let isAttendanceApprover=0;
              let isManager = 0;
              let roleId = 0;
              let accessCities = "";
              let canUpdateOpendepotPickDetail=0;
              if (data[key]["haltDisableAccess"] != undefined) {
                haltDisableAccess = data[key]["haltDisableAccess"];
              }
              if (data[key]["isActual"] != undefined) {
                isActual = data[key]["isActual"];
              }
              if (data[key]["isActualWorkPercentage"] != undefined) {
                isActualWorkPercentage = data[key]["isActualWorkPercentage"];
              }
              if (data[key]["isAttendanceApprover"] != undefined) {
                isAttendanceApprover = data[key]["isAttendanceApprover"];
              }
              if (data[key]["isLock"] != undefined) {
                isLock = data[key]["isLock"];
              }
              if (data[key]["isAdmin"] != undefined) {
                isAdmin = data[key]["isAdmin"];
              }
              if (data[key]["isManager"] != undefined) {
                isManager = data[key]["isManager"];
              }
              if (data[key]["roleId"] != undefined) {
                roleId = data[key]["roleId"];
              }
              if (data[key]["accessCities"] != undefined) {
                accessCities = data[key]["accessCities"];
              }
              if (data[key]["canUpdateOpendepotPickDetail"] != undefined) {
                canUpdateOpendepotPickDetail = data[key]["canUpdateOpendepotPickDetail"];
              }
              if (data[key]["isDelete"] == "0") {
                userList.push({
                  userKey: data[key]["userId"],
                  userId: data[key]["userId"],
                  name: data[key]["name"],
                  email: data[key]["email"],
                  password: data[key]["password"],
                  userType: data[key]["userType"],
                  expiryDate: data[key]["expiryDate"],
                  notificationHalt: data[key]["notificationHalt"],
                  notificationMobileDataOff: data[key]["notificationMobileDataOff"],
                  notificationSkippedLines: data[key]["notificationSkippedLines"],
                  notificationPickDustbins: data[key]["notificationPickDustbins"],
                  notificationGeoSurfing: data[key]["notificationGeoSurfing"],
                  officeAppUserId: data[key]["officeAppUserId"],
                  isTaskManager: data[key]["isTaskManager"],
                  haltDisableAccess: haltDisableAccess,
                  isActual: isActual,
                  isActualWorkPercentage:isActualWorkPercentage,
                  isAttendanceApprover:isAttendanceApprover,
                  isLock: isLock,
                  isAdmin: isAdmin,
                  isManager: isManager,
                  roleId: roleId,
                  accessCities: accessCities,
                  imgUrl:imgUrl,
                  utitle:utitle,
                  canUpdateOpendepotPickDetail:canUpdateOpendepotPickDetail
                });
              }
            }
          }
        }        
        localStorage.setItem("webPortalUserList", JSON.stringify(userList));
      }
    });
  }

  setPortalPages() {
    let portalAccessList = [];
    const path = this.commonService.fireStoragePath + "Common%2FPortalPages.json?alt=media";
    let pageJSONInstance = this.httpService.get(path).subscribe(pageJsonData => {
      pageJSONInstance.unsubscribe();
      let pageList = JSON.parse(JSON.stringify(pageJsonData));
      portalAccessList = this.commonService.transform(pageList, "position");
      localStorage.setItem("portalAccess", JSON.stringify(portalAccessList));
    });
  }
}
