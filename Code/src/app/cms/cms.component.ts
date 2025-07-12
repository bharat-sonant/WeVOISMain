import { Component, OnInit, Renderer2 } from "@angular/core";
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
    this.accessList = [];
    this.pageList=[];
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
          this.pageList.push({ name: userAccessList[i]["name"], img: userAccessList[i]["img"], url: userAccessList[i]["url"], pageId: userAccessList[i]["pageId"] });
        }
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
        this.getPage("/" + this.cityName + "/" +pageId + url1);
      }
      else {
        this.getPage("/" + this.cityName + "/" + pageId + url);
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
}
