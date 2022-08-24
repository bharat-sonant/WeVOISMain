import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { UsersService } from "../../services/users/users.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AngularFirestore } from "@angular/fire/firestore";

@Component({
  selector: 'app-role-page-access',
  templateUrl: './role-page-access.component.html',
  styleUrls: ['./role-page-access.component.scss']
})
export class RolePageAccessComponent implements OnInit {

  constructor(public userService: UsersService, public dbFireStore: AngularFirestore, private commonService: CommonService, private router: Router, private actRoute: ActivatedRoute) { }
  roleJSONData: any;
  roleId: any;
  roleName: any;
  cityName: any;
  accessList: any;
  roleAccessPages: any[] = [];

  ngOnInit() {
    this.setDefaults();
  }

  setDefaults() {
    this.cityName = localStorage.getItem('cityName');
    this.roleId = this.actRoute.snapshot.paramMap.get("id");
    this.getRoles();
  }

  getRoles() {
    this.userService.getRoles().then((data: any) => {
      if (data != null) {
        this.roleJSONData = data;
        this.roleName = "(" + this.roleJSONData[this.roleId.toString()]["roleName"] + ")";
        if (this.roleJSONData[this.roleId.toString()]["pages"] != null) {
          let pages=this.roleJSONData[this.roleId.toString()]["pages"];
          let dataList = pages.toString().split(",");
            for (let i = 0; i < dataList.length; i++) {
              this.roleAccessPages.push({ pageId: dataList[i].trim() });
            }
        }
        this.getPortalPages();
      }
    });
  }

  getPortalPages() {
    this.accessList = [];
    this.dbFireStore.collection("UserManagement").doc("PortalSectionAccess").collection("Pages").doc("gR6kziY4rXIv7yIgIK4g").get().subscribe((doc) => {
      let pageList = JSON.parse(doc.data()["pages"]);
      let firstData = pageList.filter((e) => e.parentId === 0);
      if (firstData.length > 0) {
        for (let i = 0; i < firstData.length; i++) {
          let index = firstData[i]["pageID"];
          let sno = firstData[i]["position"];
          let name = firstData[i]["name"];
          let isCheck = "";
          let pageAccess = this.roleAccessPages.find((item) => item.pageId == index);
          if (pageAccess != undefined) {
            isCheck = "checked";
          }
          let secondLevel = [];
          this.accessList.push({ sno: sno, pageID: index, name: name, ischeck: isCheck, secondLevel: secondLevel, });
          let secondData = pageList.filter((e) => e.parentId === index);
          if (secondData.length > 0) {
            for (let j = 0; j < secondData.length; j++) {
              index = secondData[j]["pageID"];
              sno = secondData[j]["position"];
              name = secondData[j]["name"];
              isCheck = "";
              let pageAccess = this.roleAccessPages.find((item) => item.pageId == index);
              if (pageAccess != undefined) {
                isCheck = "checked";
              }
              let thirdLevel = [];

              secondLevel.push({ sno: sno, pageID: index, name: name, ischeck: isCheck, thirdLevel: thirdLevel, });
              let thirdData = pageList.filter((e) => e.parentId === index);
              if (thirdData.length > 0) {
                for (let k = 0; k < thirdData.length; k++) {
                  index = thirdData[k]["pageID"];
                  sno = thirdData[k]["position"];
                  name = thirdData[k]["name"];
                  isCheck = "";
                  let pageAccess = this.roleAccessPages.find((item) => item.pageId == index);
                  if (pageAccess != undefined) {
                    isCheck = "checked";
                  }
                  thirdLevel.push({ sno: sno, pageID: index, name: name, ischeck: isCheck, });
                }
                secondLevel[secondLevel.length - 1]["thirdLevel"] = thirdLevel;
              }
            }
            this.accessList[this.accessList.length - 1]["secondLevel"] = secondLevel;
          }
        }
      }
    });
  }
  
  saveRoleAccess() {
    let accessPages = "";
    for (let i = 0; i < this.accessList.length; i++) {
      let pageID = this.accessList[i]["pageID"];
      let elmID = "chk" + pageID;
      let element = <HTMLInputElement>document.getElementById(elmID);
      if (element.checked == true) {
        if (accessPages != "") {
          accessPages = accessPages + ", ";
        }
        accessPages = accessPages + pageID;
      }
      if (this.accessList[i]["secondLevel"].length > 0) {
        let secondLevel = this.accessList[i]["secondLevel"];
        for (let j = 0; j < secondLevel.length; j++) {
          pageID = secondLevel[j]["pageID"];
          elmID = "chk" + pageID;
          element = <HTMLInputElement>document.getElementById(elmID);
          if (element.checked == true) {
            if (accessPages != "") {
              accessPages = accessPages + ", ";
            }
            accessPages = accessPages + pageID;
          }

          if (secondLevel[j]["thirdLevel"].length > 0) {
            let thirdLevel = secondLevel[j]["thirdLevel"];
            for (let k = 0; k < thirdLevel.length; k++) {
              pageID = thirdLevel[k]["pageID"];
              elmID = "chk" + pageID;
              element = <HTMLInputElement>document.getElementById(elmID);
              if (element.checked == true) {
                if (accessPages != "") {
                  accessPages = accessPages + ", ";
                }
                accessPages = accessPages + pageID;
              }
            }
          }
        }
      }
    }
    if (accessPages == ""){
      delete this.roleJSONData[this.roleId.toString()]["pages"];
    }
    else{
      this.roleJSONData[this.roleId.toString()]["pages"]=accessPages;
    }    
    this.userService.saveRoles(this.roleJSONData);
    this.commonService.setAlertMessage("success","Portal access updated successfully");
    this.router.navigate(['/' + this.cityName + '/18A/roles']);
  }

  cancelEntry() {
    this.router.navigate(["/" + this.cityName + "/18A/roles"]);
  }
  
  setAccess(mainPageId: any, secondPageId: any) {
    let pageDetail = this.accessList.find(item => item.pageID == mainPageId);
    if (pageDetail != undefined) {
      let isMainChecked = false;
      let isSecondChecked = false;
      let secondList = pageDetail.secondLevel;
      let secondPageDetail = secondList.find(item => item.pageID == secondPageId);
      if (secondPageDetail != undefined) {
        let thirdList = secondPageDetail.thirdLevel;
        if (thirdList.length > 0) {
          for (let j = 0; j < thirdList.length; j++) {
            if ((<HTMLInputElement>document.getElementById("chk" + thirdList[j]["pageID"])).checked == true) {
              isSecondChecked = true;
              isMainChecked = true;
            }
          }
          if (isSecondChecked == true) {
            (<HTMLInputElement>document.getElementById("chk" + secondPageId)).checked = true;
          }
          else {
            (<HTMLInputElement>document.getElementById("chk" + secondPageId)).checked = false;
          }
        }
      }
      else if ((<HTMLInputElement>document.getElementById("chk" + mainPageId)).checked == true) {
        isMainChecked = true;
      }
      if (isMainChecked == false) {
        for (let j = 0; j < secondList.length; j++) {
          if ((<HTMLInputElement>document.getElementById("chk" + secondList[j]["pageID"])).checked == true) {
            isMainChecked = true;
          }
        }
      }

      if (isMainChecked == true) {
        (<HTMLInputElement>document.getElementById("chk" + mainPageId)).checked = true;
      }
      else {
        (<HTMLInputElement>document.getElementById("chk" + mainPageId)).checked = false;
      }
    }
  }
}
