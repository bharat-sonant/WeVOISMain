import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/common/user.service';
import { CommonService } from '../../services/common/common.service';
//import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive form services
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { AngularFireDatabase } from 'angularfire2/database';
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-user-access',
  templateUrl: './user-access.component.html',
  styleUrls: ['./user-access.component.scss']
})
export class UserAccessComponent implements OnInit {

  constructor(public httpService: HttpClient, public dbFireStore: AngularFirestore, private router: Router, public usrService: UserService, private actRoute: ActivatedRoute, public commonService: CommonService, public toastr: ToastrService, public db: AngularFireDatabase) { }
  userid: any;
  accessList: any[];
  portalAccessList: any[];
  userAccessPages: any[];
  cityName: any;
  selectedCity:any;
  saveType: any;
  userDetail: userDetail =
    {
      name: '',
      userType: ''
    };

  ngOnInit() {
    //this.setPortalPages();
    //this.getPortalPages();
    this.cityName = localStorage.getItem('cityName');
    const id = this.actRoute.snapshot.paramMap.get('id');
    this.getUserAccess(id);
  }

  setPortalPages() {
    let portalAccessList = [];
    let dbPath = "Defaults/PortalSectionAccess";
    let pagesInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        pagesInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              portalAccessList.push({ parentId: 0, pageID: index, name: data[index]["name"], img: data[index]["img"], position: data[index]["position"], url: data[index]["url"] });
              if (data[index]["SubPages"] != null) {
                let data2 = data[index]["SubPages"];
                let keyArray2 = Object.keys(data2);
                if (keyArray2.length > 0) {
                  for (let j = 0; j < keyArray2.length; j++) {
                    let index2 = keyArray2[j];
                    portalAccessList.push({ parentId: index, pageID: index2, name: data2[index2]["name"], img: data2[index2]["img"], position: data2[index2]["position"], url: data2[index2]["url"] });
                    if (data2[index2]["SubPages"] != null) {
                      let data3 = data2[index2]["SubPages"];
                      let keyArray3 = Object.keys(data3);
                      for (let k = 0; k < keyArray3.length; k++) {
                        let index3 = keyArray3[k];
                        portalAccessList.push({ parentId: index2, pageID: index3, name: data3[index3]["name"], img: data3[index3]["img"], position: data3[index3]["position"], url: data3[index3]["url"] });
                      }
                    }
                  }
                }
              }
            }
            let pagesData = JSON.stringify(portalAccessList);
            const aa = {
              pages: pagesData
            }
            this.dbFireStore
              .collection("UserManagement").doc("PortalSectionAccess").collection("Pages").add(aa);
            console.log(this.portalAccessList);

          }
        }
      }
    );
  }

  getUserAccess(userKey) {
    this.selectedCity=$('#ddlCity').val();
    this.userAccessPages = [];
    this.dbFireStore
      .collection("UserManagement").doc("Users").collection("Users").doc(userKey)
      .get()
      .subscribe((doc) => {
        this.userDetail.name = doc.data()["name"];
        this.userDetail.userType = doc.data()["userType"];
        this.userid = doc.data()["userId"].toString();
        this.dbFireStore
          .collection("UserManagement").doc("UserAccess").collection("UserAccess").doc(this.userid).collection(this.selectedCity).doc(this.selectedCity)
          .get()
          .subscribe((doc) => {
            if (doc.data() == undefined) {
              this.saveType = "add";
            }
            else {
              if(doc.data()["pageId"]!=null){
              let pageId = doc.data()["pageId"];
              let dataList = pageId.toString().split(',');
              for (let i = 0; i < dataList.length; i++) {
                this.userAccessPages.push({ pageId: dataList[i].trim() });
              }
              this.saveType = "update";
            }
          }
            this.getPortalPages();
          });
      });
  }

  getPortalPages() {
    this.portalAccessList = [];
    this.accessList = [];
    this.dbFireStore
      .collection("UserManagement").doc("PortalSectionAccess").collection("Pages").doc("gR6kziY4rXIv7yIgIK4g")
      .get()
      .subscribe((doc) => {
        let pageList = JSON.parse(doc.data()["pages"]);
        let firstData = pageList.filter(e => ((e.parentId === 0)));
        if (firstData.length > 0) {
          for (let i = 0; i < firstData.length; i++) {
            let index = firstData[i]["pageID"];
            let sno = firstData[i]["position"];
            let name = firstData[i]["name"];
            let isCheck = "";
            let pageAccess = this.userAccessPages.find(item => item.pageId == index);
            if (pageAccess != undefined) {
              isCheck = "checked";
            }
            let secondLevel = [];
            this.accessList.push({ sno: sno, pageID: index, name: name, ischeck: isCheck, secondLevel: secondLevel });
            let secondData = pageList.filter(e => ((e.parentId === index)));
            if (secondData.length > 0) {
              for (let j = 0; j < secondData.length; j++) {
                index = secondData[j]["pageID"];
                sno = secondData[j]["position"];
                name = secondData[j]["name"];
                isCheck = "";
                let pageAccess = this.userAccessPages.find(item => item.pageId == index);
                if (pageAccess != undefined) {
                  isCheck = "checked";
                }
                let thirdLevel = [];
                secondLevel.push({ sno: sno, pageID: index, name: name, ischeck: isCheck, thirdLevel: thirdLevel });
                let thirdData = pageList.filter(e => ((e.parentId === index)));
                if (thirdData.length > 0) {
                  for (let k = 0; k < thirdData.length; k++) {
                    index = thirdData[k]["pageID"];
                    sno = thirdData[k]["position"];
                    name = thirdData[k]["name"];
                    isCheck = "";
                    let pageAccess = this.userAccessPages.find(item => item.pageId == index);
                    if (pageAccess != undefined) {
                      isCheck = "checked";
                    }
                    thirdLevel.push({ sno: sno, pageID: index, name: name, ischeck: isCheck });
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
    const aa = {
      pageId: accessPages
    }
    if (this.saveType == "add") {
      this.dbFireStore.doc("UserManagement/UserAccess").collection("UserAccess").doc(this.userid).collection(this.selectedCity).doc(this.selectedCity).set(aa);
    }
    else {
      this.dbFireStore.doc("UserManagement/UserAccess").collection("UserAccess").doc(this.userid).collection(this.selectedCity).doc(this.selectedCity).update(aa);
    }
    this.toastr.error("Portal Accesss Updated Successfully for "+this.selectedCity+" City !!!", '', {
      timeOut: 6000,
      enableHtml: true,
      closeButton: true,
      toastClass: "alert alert-info alert-with-icon",
      positionClass: 'toast-bottom-right'
    });
    //this.router.navigate(['/' + this.cityName + '/users']);
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

  changeCity(){
    const id = this.actRoute.snapshot.paramMap.get('id');
    this.getUserAccess(id);
  }
}

export class userDetail {
  name: string;
  userType: string;
}
