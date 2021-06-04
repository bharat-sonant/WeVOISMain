import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/common/user.service';
import { CommonService } from '../../services/common/common.service';
//import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive form services
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { AngularFireDatabase } from 'angularfire2/database';
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-access',
  templateUrl: './user-access.component.html',
  styleUrls: ['./user-access.component.scss']
})
export class UserAccessComponent implements OnInit {

  constructor(public httpService: HttpClient, private router: Router, public usrService: UserService, private actRoute: ActivatedRoute, public commonService: CommonService, public toastr: ToastrService, public db: AngularFireDatabase) { }
  userid: any;
  accessList: any[];
  portalAccessList: any[];
  userAccessPages: any[];
  cityName: any;

  userDetail: userDetail =
    {
      name: '',
      userType: ''
    };

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    const id = this.actRoute.snapshot.paramMap.get('id');
    this.getUserAccess(id);
  }

  getUserAccess(userKey) {
    this.userAccessPages = [];
    let myUser = this.db.object('Users/' + userKey).valueChanges().subscribe(
      data => {
        myUser.unsubscribe();
        let details = this.userDetail;
        details.name = data["name"];
        details.userType = data["userType"];
        this.userid = data["userId"];
        let dbPath = "UserAccess/" + this.userid + "/pageId";
        let accessInstance = this.db.object(dbPath).valueChanges().subscribe(
          accessData => {
            accessInstance.unsubscribe();
            if (accessData != null) {
              let dataList = accessData.toString().split(',');
              if (dataList.length > 0) {
                for (let i = 0; i < dataList.length; i++) {
                  this.userAccessPages.push({ pageId: dataList[i].trim() });
                }
              }
            }
            this.getPortalPages();
          });
      });
  }

  getPortalPages() {
    this.portalAccessList = [];
    this.accessList = [];
    let dbPath = "Defaults/PortalSectionAccess";
    let pageInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        pageInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let isCheck = "";
              let index = keyArray[i];
              let name = "Self";
              let pageAccess = this.userAccessPages.find(item => item.pageId == index);
              if (pageAccess != undefined) {
                isCheck = "checked";
              }

              let secondLevel = [];
              this.accessList.push({ parent: name, sno: data[index]["position"], pageID: index, name: data[index]["name"], ischeck: isCheck, secondLevel: secondLevel });
              if (data[index]["SubPages"] != null) {
                let data2 = data[index]["SubPages"];
                let keyArray2 = Object.keys(data2);
                if (keyArray2.length > 0) {
                  for (let j = 0; j < keyArray2.length; j++) {
                    let thirdLevel = [];
                    let index2 = keyArray2[j];
                    isCheck = "";
                    let pageAccess = this.userAccessPages.find(item => item.pageId == index2);
                    if (pageAccess != undefined) {
                      isCheck = "checked";
                    }
                    name = data[index]["name"];
                    secondLevel.push({ parent: name, sno: data2[index2]["position"], pageID: index2, name: data2[index2]["name"], ischeck: isCheck, thirdLevel: thirdLevel });
                    if (data2[index2]["SubPages"] != null) {
                      let data3 = data2[index2]["SubPages"];
                      let keyArray3 = Object.keys(data3);
                      if (keyArray3.length > 0) {
                        for (let k = 0; k < keyArray3.length; k++) {
                          let index3 = keyArray3[k];
                          isCheck = "";
                          let pageAccess = this.userAccessPages.find(item => item.pageId == index3);
                          if (pageAccess != undefined) {
                            isCheck = "checked";
                          }
                          name = data[index]["name"] + " | " + data2[index2]["name"];
                          thirdLevel.push({ parent: name, sno: data3[index3]["position"], pageID: index3, name: data3[index3]["name"], ischeck: isCheck });
                        }
                        secondLevel[secondLevel.length - 1]["thirdLevel"] = thirdLevel;
                      }
                    }
                  }
                  this.accessList[this.accessList.length - 1]["secondLevel"] = secondLevel;
                }
              }
            }
          }
        }
      }
    );
  }

  saveData() {
    let accessPages = "";
    for (let i = 0; i < this.accessList.length; i++) {
      let pageID = this.accessList[i]["pageID"];
      let elmID = "chk" + pageID;
      let element = <HTMLInputElement>document.getElementById(elmID);
      let isChecked = element.checked;
      if (element.checked == true) {
        if (accessPages != "") { accessPages = accessPages + ", " };
        accessPages = accessPages + pageID;
      }
      if (this.accessList[i]["secondLevel"].length > 0) {
        let secondLevel = this.accessList[i]["secondLevel"];
        for (let j = 0; j < secondLevel.length; j++) {
          pageID = secondLevel[j]["pageID"];
          elmID = "chk" + pageID;
          element = <HTMLInputElement>document.getElementById(elmID);
          if (element.checked == true) {
            if (accessPages != "") { accessPages = accessPages + ", " };
            accessPages = accessPages + pageID;
          }

          if (secondLevel[j]["thirdLevel"].length > 0) {
            let thirdLevel = secondLevel[j]["thirdLevel"];
            for (let k = 0; k < thirdLevel.length; k++) {
              pageID = thirdLevel[k]["pageID"];
              elmID = "chk" + pageID;
              element = <HTMLInputElement>document.getElementById(elmID);
              if (element.checked == true) {
                if (accessPages != "") { accessPages = accessPages + ", " };
                accessPages = accessPages + pageID;
              }
            }
          }
        }

      }
    }
    if (accessPages == "")
      accessPages = null;
    this.db.object("UserAccess/" + this.userid).update({
      "pageId": accessPages
    });

    this.toastr.error("Portal Accesss Updated Successfully !!!", '', {
      timeOut: 6000,
      enableHtml: true,
      closeButton: true,
      toastClass: "alert alert-info alert-with-icon",
      positionClass: 'toast-bottom-right'
    });
    this.router.navigate(['/' + this.cityName + '/users']);
  }
  cancelEntry() {
    this.router.navigate(['/' + this.cityName + '/users']);
  }

  setAccess(pageID: any, type: any) {
    let elementID = "chk" + pageID;
    let element = <HTMLInputElement>document.getElementById(elementID);
    let isCheck = "";
    if (element.checked == true) {
      isCheck = "checked";
    }

    for (let i = 0; i < this.accessList.length; i++) {
      if (this.accessList[i]["pageID"] == pageID) {
        if (this.accessList[i]["secondLevel"].length > 0) {
          let secondList = this.accessList[i]["secondLevel"];
          for (let j = 0; j < secondList.length; j++) {
            elementID = "chk" + secondList[j]["pageID"];
            element = <HTMLInputElement>document.getElementById(elementID);
            if (isCheck == "") {
              element.checked = false;
            }
            else {
              element.checked = true;
            }

            if (secondList[j]["thirdLevel"].length > 0) {
              let thirdList = secondList[j]["thirdLevel"];
              for (let k = 0; k < thirdList.length; k++) {
                elementID = "chk" + thirdList[k]["pageID"];
                element = <HTMLInputElement>document.getElementById(elementID);
                if (isCheck == "") {
                  element.checked = false;
                }
                else {
                  element.checked = true;
                }
              }
            }
          }
        }
      }
      else {
        if (this.accessList[i]["secondLevel"].length > 0) {
          let secondList = this.accessList[i]["secondLevel"];
          for (let j = 0; j < secondList.length; j++) {
            if (pageID == secondList[j]["pageID"]) {
              elementID = "chk" + secondList[j]["pageID"];
              element = <HTMLInputElement>document.getElementById(elementID);
              if (isCheck == "") {
                element.checked = false;
              }
              else {
                element.checked = true;
              }

              if (secondList[j]["thirdLevel"].length > 0) {
                let thirdList = secondList[j]["thirdLevel"];
                for (let k = 0; k < thirdList.length; k++) {
                  elementID = "chk" + thirdList[k]["pageID"];
                  element = <HTMLInputElement>document.getElementById(elementID);
                  if (isCheck == "") {
                    element.checked = false;
                  }
                  else {
                    element.checked = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

export class userDetail {
  name: string;
  userType: string;
}
