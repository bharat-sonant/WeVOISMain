import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
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
    public db: AngularFireDatabase,
    private commonService: CommonService,
    public actRoute: ActivatedRoute,
    public router: Router
  ) {}

  isShow = false;
  userid: any;
  cityName: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.userid = localStorage.getItem("userID");
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
      let detail = userAccessList.find((item) => item.pageId == pageId);
      if (detail != undefined) {
        $("#pageName").html(detail.name);
        $("#pageNameMobile").html(detail.name);
      }
      let k = 0;
      for (let i = 0; i < userAccessList.length; i++) {
        if (
          userAccessList[i]["parentId"] == pageId &&
          userAccessList[i]["userId"] == this.userid &&
          userAccessList[i]["city"] == this.cityName
        ) {
          k = k + 1;
          let element = <HTMLElement>document.getElementById("div" + k);
          if (element != undefined) {
            $("#div" + k).show();
            $("#span" + k).html(userAccessList[i]["name"]);
            let className = $("#icon" + k).attr("class");
            $("#icon" + k).removeClass(className);
            $("#icon" + k).addClass(userAccessList[i]["img"]);
            if (element != null) {
              element.addEventListener("click", (e) => {
                this.getPage("/" + this.cityName+"/"+userAccessList[i]["pageId"] + userAccessList[i]["url"]);
              });
            }
          }
          element = <HTMLElement>document.getElementById("divMob" + k);
          if (element != undefined) {
            $("#divMob" + k).show();
            $("#spanMob" + k).html(userAccessList[i]["name"]);
            let className = $("#iconMob" + k).attr("class");
            $("#iconMob" + k).removeClass(className);
            $("#iconMob" + k).addClass(userAccessList[i]["img"]);
            if (element != null) {
              element.addEventListener("click", (e) => {
                this.getPage("/" + this.cityName+"/"+userAccessList[i]["pageId"] + userAccessList[i]["url"]);
              });
            }
          }
        }
      }
    }
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
    for (let k = 1; k <= 12; k++) {
      $("#div" + k).hide();
      $("#divMob" + k).hide();
    }
  }
}
