import { Component, OnInit } from "@angular/core";
import { CommonService } from "../services/common/common.service";

@Component({
  selector: "app-portal-access",
  templateUrl: "./portal-access.component.html",
  styleUrls: ["./portal-access.component.scss"],
})
export class PortalAccessComponent implements OnInit {
  constructor(private commonService: CommonService) {}
  cityList: any[] = [];
  ngOnInit() {
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    this.cityList.push({ city: "sikar",name:"Sikar" });
    this.cityList.push({ city: "reengus",name:"Reengus" });
    this.cityList.push({ city: "shahpura",name:"Shahpura" });
    this.cityList.push({ city: "test",name:"Test" });
    this.cityList.push({ city: "demo",name:"Demo" });
    localStorage.setItem("cityList", JSON.stringify(this.cityList));
  }

  getCity(city: any) {
      localStorage.setItem("cityName", city);
      localStorage.setItem("isCityChange", "yes");
      let path = city + "/login";
      window.location.href = path;
  }
}
