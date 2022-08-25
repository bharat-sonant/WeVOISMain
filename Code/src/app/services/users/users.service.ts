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
      const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + "Common%2FRoles.json?alt=media";
      let roleJSONInstance = this.httpService.get(path).subscribe(roleJsonData => {
        roleJSONInstance.unsubscribe();
        resolve(roleJsonData);
      }, error => {
        roleJSONInstance.unsubscribe();
        resolve(null);
      });
    });
  }

  saveRoles(roleJSONData:any){
    this.commonService.saveCommonJsonFile(roleJSONData, "Roles.json", "/Common/");
  }

  
}
