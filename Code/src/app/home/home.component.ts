import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  userid: any;
  isShow: any;
  accessList: any[];
  portalAccessList: any[];
  cityList: any[];
  userType: any;
  cityName: any;
  isDehradun: boolean;
  db: any;
  userDetail: userDetail = {
    name: "",
    cityName: "",
  };

  constructor(private commonService: CommonService, public dbFireStore: AngularFirestore, public fs: FirebaseService,) { }

  ngOnInit() {
    this.isDehradun = false;
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.userid = localStorage.getItem("userID");
    if(this.userid=="4" || this.userid=="182"){
      $("#devendraLink").show();
    }
    this.userType = localStorage.getItem("userType");
    this.userDetail.name = localStorage.getItem("userName");
    this.portalAccessList = [];
    this.portalAccessList = JSON.parse(localStorage.getItem("portalAccess"));
   let instance= this.db.object("AuthorizationData").valueChanges().subscribe(data=>{
    instance.unsubscribe();
    })
    if (localStorage.getItem("isCityChange") == "yes") {
      localStorage.setItem("isCityChange", "no");
      setTimeout(() => {
        this.getUserAccess();
      }, 2000);
    } else {
      this.getUserAccess();
    }
    $('#divLoader').show();
    let obj={
      lastLogin:this.commonService.getTodayDateTime()
    }
    this.commonService.saveCommonJsonFile(obj, this.userid+".json", "/Common/EmployeeLastLogin/");


    this.userDetail.cityName = this.commonService.getCityName(this.cityName);
    setTimeout(() => {
      $('#divLoader').hide();
    }, 18000);
  }

  getUserAccess() {
    this.accessList = [];
    let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
    if (userAccessList != null) {
      if (this.cityName == "dehradun" || this.cityName == "test") {
        this.isDehradun = true;
      }
      for (let i = 0; i < userAccessList.length; i++) {
        if (userAccessList[i]["parentId"] == 0 && userAccessList[i]["userId"] == this.userid && userAccessList[i]["city"] == this.cityName) {
          let url = "javaScript:void(0);";
          let dataClass = "dashboard-widgets";
          this.isShow = false;
          let isOuterUrl = "no";
          if (userAccessList[i]["url"].includes("https")) {
            isOuterUrl = "yes";
            let newUrl = userAccessList[i]["url"].split("https://mainportal-react.web.app/userId/")[1];
            
              url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userid + "/" + newUrl;
            
            if (userAccessList[i]["url"].includes("dehradun-pmc")) {
              if (this.isDehradun == true) {
                let userType = "1";
                if (localStorage.getItem("userType") != "Internal User") {
                  userType = "2";
                }
                url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userid + "/" + userType + "/" + newUrl;
                this.accessList.push({ name: userAccessList[i]["name"], url: url, isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass, isOuterUrl: isOuterUrl });
              }
            }
            else {
              this.accessList.push({ name: userAccessList[i]["name"], url: url, isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass, isOuterUrl: isOuterUrl });
            }
          }
          else {
            if (userAccessList[i]["url"].includes("task-manager")) {
              if (localStorage.getItem("officeAppUserId") != null) {
                this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass, isOuterUrl: isOuterUrl });
              }
            }
            else if (userAccessList[i]["url"].includes("/cms/22")) {
              if (this.isDehradun == true) {
                this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass, isOuterUrl: isOuterUrl });
              }
            }
            else if (userAccessList[i]["url"].includes("/cms/21")) {
              if (this.cityName == "jaipur-greater"  || this.cityName=="dehradun" || this.cityName=="test") {
                this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass, isOuterUrl: isOuterUrl });
              }
            } else {
              this.accessList.push({ name: userAccessList[i]["name"], url: "/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"], isShow: this.isShow, position: userAccessList[i]["position"], img: userAccessList[i]["img"], dataClass: dataClass, isOuterUrl: isOuterUrl });
            }
          }
        }
      }
    }
  }
}
export class userDetail {
  name: string;
  cityName: string;
}
