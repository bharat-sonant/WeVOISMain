import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import {
  ActivatedRoute,
  Router,
  NavigationEnd,
  RouterLink,
} from "@angular/router";

@Component({
  selector: "app-cms",
  templateUrl: "./cms.component.html",
  styleUrls: ["./cms.component.scss"],
})
export class CmsComponent implements OnInit {
  accessList: any[];
  constructor(
    public fs: FirebaseService,
    private commonService: CommonService,
    public actRoute: ActivatedRoute,
    public router: Router
  ) { }

  isShow = false;
  userid: any;
  userType: any;
  isActual: any;
  cityName: any;
  db: any;
  isDehradun: boolean;

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.cityName = localStorage.getItem("cityName");
    this.userid = localStorage.getItem("userID");
    if (localStorage.getItem("userType") == "External User") {
      this.userType = "1";
    }
    else {
      this.userType = "2";
    }
    this.isActual = localStorage.getItem("isActual");
    const id = this.actRoute.snapshot.paramMap.get("id");
    let pageList = id.split("-");
    this.getPages(pageList[pageList.length - 1]);

    // this.setDesign();
  }

  getPages(pageId: any) {
    this.clearAll();
    this.accessList = [];
    let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
    if (userAccessList != null) {
      if (this.cityName == "dehradun" || this.cityName == "test") {
        this.isDehradun = true;
      }
      let detail = userAccessList.find((item) => item.pageId == pageId);
      if (detail != undefined) {
        $("#pageName").html(detail.name);
        $("#pageNameMobile").html(detail.name);
      }
      let k = 0;
      for (let i = 0; i < userAccessList.length; i++) {
        if (userAccessList[i]["parentId"] == pageId && userAccessList[i]["userId"] == this.userid && userAccessList[i]["city"] == this.cityName) {
          k = k + 1;
          this.setLink(k, userAccessList, i);
        }
      }
    }
  }

  setLink(k: any, userAccessList: any, i: any) {
    let element = <HTMLElement>document.getElementById("div" + k);
    if (element != undefined) {
      $("#div" + k).show();
      $("#span" + k).html(userAccessList[i]["name"]);
      // let className = $("#icon" + k).attr("class");
      // $("#icon" + k).addClass(className);
      let imgElement = <HTMLImageElement>document.getElementById("icon" + k);
      imgElement.src = userAccessList[i]["img"];
      // $("#icon" + k).addClass(userAccessList[i]["img"]);
      if (element != null) {
        element.addEventListener("click", (e) => {
          if (userAccessList[i]["url"].toString().includes("https")) {
            if (localStorage.getItem("cityName") == "ajmer" && userAccessList[i]["pageId"] == "10A19") {
              this.goToOuterURL(userAccessList[i]["url"]+"s");
            }
            else {
              this.goToOuterURL(userAccessList[i]["url"]);
            }
          }
          else {
            if (localStorage.getItem("cityName") == "ajmer" && userAccessList[i]["pageId"] == "2Y" && localStorage.getItem("userType") == "External User") {
              let url = "/ward-route-tracking";
              this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + url);
            }
            else {
              this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"]);
            }
          }
        });
      }
    }

    element = <HTMLElement>document.getElementById("divMob" + k);
    if (element != undefined) {
      $("#divMob" + k).show();
      $("#spanMob" + k).html(userAccessList[i]["name"]);
      // let className = $("#iconMob" + k).attr("class");
      // $("#iconMob" + k).removeClass(className);
      let imgElement = <HTMLImageElement>document.getElementById("iconMob" + k);
      imgElement.src = userAccessList[i]["img"];
      // $("#iconMob" + k).addClass(userAccessList[i]["img"]);
      if (element != null) {
        element.addEventListener("click", (e) => {
          if (userAccessList[i]["url"].toString().includes("https")) {
            this.goToOuterURL(userAccessList[i]["url"]);
          }
          else {
            this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"]);
          }
        });
      }
    }
  }

  goToOuterURL(url: any) {
    let newUrl = url.split("https://mainportal-react.web.app/userId/")[1];
    if (this.cityName == "test") {
      url = "https://mainportal-react.web.app/" + this.cityName + "/" + this.userid + "/" + this.userType + "/" + this.isActual + "/" + newUrl;
    }
    else {
      url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userid + "/" + this.userType + "/" + this.isActual + "/" + newUrl;
    }
    window.open(url, "_blank");
  }

  getPage(value: any) {
    this.userid = localStorage.getItem("userID");
    let list = value.split("/");
    if (list.length <= 4) {
      this.router.navigate([value], { replaceUrl: true });
    } else {
      const id = list[list.length - 1];
      let pageList = id.split("-");
      this.getPages(pageList[pageList.length - 1]);
    }
  }

  clearAll() {
    for (let k = 1; k <= 30; k++) {
      $("#div" + k).hide();
      $("#divMob" + k).hide();
    }
  }
}
