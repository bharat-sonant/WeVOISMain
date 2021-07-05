import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-portal-access",
  templateUrl: "./portal-access.component.html",
  styleUrls: ["./portal-access.component.scss"],
})
export class PortalAccessComponent implements OnInit {
  constructor() {}
  cityList: any[] = [];
  ngOnInit() {
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    this.cityList.push({ city: "sikar",name:"Sikar" });
    this.cityList.push({ city: "reengus",name:"Reengus" });
    this.cityList.push({ city: "jaipur",name:"Jaipur" });
    this.cityList.push({ city: "demo",name:"Demo" });
    localStorage.setItem("cityList", JSON.stringify(this.cityList));
  }

  getCity(city: any) {
    localStorage.setItem("cityName", city);
    localStorage.setItem("isCityChange", "no");
    let path = city + "/login";
    window.location.href = path;
  }
}
