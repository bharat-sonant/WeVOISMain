import { Component, OnInit, Renderer2 } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";
import { filter } from 'rxjs/operators';
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
    public router: Router,
    private renderer: Renderer2
  ) { }

  isShow = false;
  userid: any;
  userType: any;
  isActual: any;
  cityName: any;
  db: any;
  isDehradun: boolean;
  pageList: any[] = [];

  isMonitoringPage: boolean = false;  // 👈 Add this at the top

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
    if (id == "2") {
      this.isMonitoringPage = true;
    }
    else {
      this.isMonitoringPage = false;
    }
    let pageList = id.split("-");
    this.getPages(pageList[pageList.length - 1]);
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const id1 = this.actRoute.snapshot.paramMap.get("id");
        if (id1 == "2") {
          this.isMonitoringPage = true;
        }
        else {
          this.isMonitoringPage = false;
        }
        let pageList = id1.split("-");
        this.getPages(pageList[pageList.length - 1]);
      });

    // this.setDesign();
  }



  public getPages(pageId: any) {
    this.clearAll();
    this.accessList = [];
    this.pageList = [];
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
        if (userAccessList[i]["parentId"] == pageId && userAccessList[i]["userId"] == localStorage.getItem("userID") && userAccessList[i]["city"] == localStorage.getItem("cityName")) {

          // k = k + 1;
          //  this.setLink(k, userAccessList, i);
          this.pageList.push({ name: userAccessList[i]["name"], img: userAccessList[i]["img"], url: userAccessList[i]["url"], pageId: userAccessList[i]["pageId"] });
        }
      }
    }
  }


  setLink(k: any, userAccessList: any, i: any) {
    let element = <HTMLElement>document.getElementById("div" + k);
    if (element != undefined) {
      $("#div" + k).show();
      $("#span" + k).html(userAccessList[i]["name"]);
      let className = $("#icon" + k).attr("class");
      //  $("#icon" + k).removeClass(className);
      // $("#icon" + k).addClass(userAccessList[i]["img"]);
      let imgElement = <HTMLImageElement>document.getElementById("icon" + k);
      imgElement.src = userAccessList[i]["img"];
      if (element != null) {
        element.addEventListener("click", (e) => {
          if (userAccessList[i]["url"].toString().includes("https")) {
            if (localStorage.getItem("cityName") == "ajmer" && userAccessList[i]["pageId"] == "10A19") {
              this.goToOuterURL(userAccessList[i]["url"] + "s");
            }
            else {
              this.goToOuterURL(userAccessList[i]["url"]);
            }
          }
          else {
            if (localStorage.getItem("cityName") == "ajmer" && userAccessList[i]["pageId"] == "2Y" && localStorage.getItem("userType") == "External User") {
              let url1 = "/ward-route-tracking";
              this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + url1);
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
      let className = $("#iconMob" + k).attr("class");
      // $("#iconMob" + k).removeClass(className);
      //  $("#iconMob" + k).addClass(userAccessList[i]["img"]);
      let imgElement = <HTMLImageElement>document.getElementById("iconMob" + k);
      imgElement.src = userAccessList[i]["img"];

      if (element != null) {
        element.addEventListener("click", (e) => {
          if (userAccessList[i]["url"].toString().includes("https")) {
            if (localStorage.getItem("cityName") == "ajmer" && userAccessList[i]["pageId"] == "10A19") {
              this.goToOuterURL(userAccessList[i]["url"] + "s");
            }
            else {
              this.goToOuterURL(userAccessList[i]["url"]);
            }
          }
          else {
            if (localStorage.getItem("cityName") == "ajmer" && userAccessList[i]["pageId"] == "2Y" && localStorage.getItem("userType") == "External User") {
              let url1 = "/ward-route-tracking";
              this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + url1);
            }
            else {
              this.getPage("/" + this.cityName + "/" + userAccessList[i]["pageId"] + userAccessList[i]["url"]);
            }
          }
        });
      }
    }
  }

  goToURL(url: any, pageId: any) {
    if (url.toString().includes("https")) {
      if (localStorage.getItem("cityName") == "ajmer" && pageId == "10A19") {
        this.goToOuterURL(url + "s");
      }
      else {
        this.goToOuterURL(url);
      }
    }
    else {
      if (localStorage.getItem("cityName") == "ajmer" && pageId == "2Y" && localStorage.getItem("userType") == "External User") {
        let url1 = "/ward-route-tracking";
        this.getPage("/" + this.cityName + "/" + pageId + url1);
      }
      else {
        this.getPage("/" + this.cityName + "/" + pageId + url);
      }
    }

  }

  goToOuterURL(url: any) {
    let newUrl = url.split("https://mainportal-react.web.app/userId/")[1];
    url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userid + "/" + this.userType + "/" + this.isActual + "/" + newUrl;
    window.open(url, "_blank");
  }

  getPage(value: any) {
    this.userid = localStorage.getItem("userID");
    let list = value.split("/");
    if (list.length <= 4) {
      this.router.navigate([value], { replaceUrl: true });
    } else {
      this.router.navigate([value], { replaceUrl: true });
      //const id = list[list.length - 1];
      //let pageList = id.split("-");
      // this.getPages(pageList[pageList.length - 1]);
    }
  }

  clearAll() {
    for (let k = 1; k <= 30; k++) {
      $("#div" + k).hide();
      $("#divMob" + k).hide();
    }
  }
}
