import { Component, OnInit } from "@angular/core";
import { CommonService } from "../services/common/common.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router, } from "@angular/router";

@Component({
  selector: "app-portal-access",
  templateUrl: "./portal-access.component.html",
  styleUrls: ["./portal-access.component.scss"],
})
export class PortalAccessComponent implements OnInit {
  constructor(private commonService: CommonService, private modalService: NgbModal, public router: Router) { }
  accessCity: any[] = [];
  citySelectionList: any[] = [];
  jaipurCityList: any[] = [];
  ngOnInit() {
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    this.commonService.setStoragePath(localStorage.getItem("cityName"));
    this.accessCity = JSON.parse(localStorage.getItem("accessCity"));
    this.getCityAccess();

  }

  getCityAccess() {
    let cityList = JSON.parse(localStorage.getItem("cityList"));
    let isJaipurCity = false;
    for (let i = 0; i < this.accessCity.length; i++) {
      let detail = cityList.find(item => item.city == this.accessCity[i]["city"]);
      if (detail != undefined) {
        if (this.accessCity[i]["city"] == "jaipur-jagatpura" || this.accessCity[i]["city"] == "jaipur-jhotwara" || this.accessCity[i]["city"] == "jaipur-malviyanagar" || this.accessCity[i]["city"] == "jaipur-mansarovar" || this.accessCity[i]["city"] == "jaipur-murlipura" || this.accessCity[i]["city"] == "jaipur-sanganer" || this.accessCity[i]["city"] == "jaipur-vidhyadhar" || this.accessCity[i]["city"] == "jaipur-civil-line" || this.accessCity[i]["city"] == "jaipur-kishanpole") {
          isJaipurCity = true;
          this.jaipurCityList.push({ city: detail.city, cityLogo: detail.cityLogo ? detail.cityLogo : "", name: detail.cityName });
        }
        else {
          this.citySelectionList.push({ city: detail.city, cityLogo: detail.cityLogo ? detail.cityLogo : "", name: detail.cityName });
        }
      }

    }
    if (isJaipurCity == true) {
      this.citySelectionList.push({ city: "", cityLogo: "../../../assets/images/jaipur icon.png", name: "Jaipur D2D" });
    }
    this.citySelectionList=this.citySelectionList.sort((a, b) => b.name < a.name ? 1 : -1);

  }

  getCity(city: any) {
    localStorage.setItem("cityName", city);
    localStorage.setItem("isCityChange", "yes");
    let path = city + "/login";
    window.location.href = path;
  }

  changeCity(cityName: any) {
    localStorage.removeItem("mapUpdateHistory");
    this.commonService.setStoragePath(cityName);
    localStorage.setItem("cityName", cityName);
    localStorage.setItem("isCityChange", "yes");
    this.closeMapModel();
    window.location.href = "/" + cityName + "/home";
  }


  openCityModel(content: any) {
    console.log(content)
    this.modalService.open(content, { size: "lg" });
    $("div .modal-content").css("background", "transparent").css("box-shadow", "none").css("border", "none");
    // let windowHeight = $(window).height();
    // let height = 300;
    // let width = 767;



    // let windowwidth = $(window).width();

    // if (windowwidth >= 1350) {
    //   width = 767;
    //   $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "15%");

    // } else if (windowwidth <= 1349 && windowwidth >= 1201) {
    //   width = 767;
    //   $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    // } else if (windowwidth <= 1200 && windowwidth >= 1025) {
    //   width = 767;
    //   $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    // } else if (windowwidth <= 1024 && windowwidth >= 768) {
    //   width = 767;
    //   $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    // } else if (windowwidth <= 767 && windowwidth >= 577) {
    //   width = 575;


    // } else if (windowwidth <= 576 && windowwidth >= 410) {
    //   width = 400;

    // } else if (windowwidth <= 413 && windowwidth >= 270) {
    //   width = 265;

    // }

    // $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top");
    // $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    // $("div .modal-dialog-centered").css("margin-top", "50px");

    for (let i = 0; i < this.accessCity.length; i++) {
      if (this.accessCity[i]["city"] == "jaipur-civil-line") {
        $("#jaipurCivilLineBox").show();
      } else if (this.accessCity[i]["city"] == "jaipur-kishanpole") {
        $("#jaipurKishanpoleBox").show();
      } else if (this.accessCity[i]["city"] == "jaipur-malviyanagar") {
        $("#jaipurMalviyanagarBox").show();
      } else if (this.accessCity[i]["city"] == "jaipur-mansarovar") {
        // $("#jaipurMansarovarBox").show();
      } else if (this.accessCity[i]["city"] == "jaipur-murlipura") {
        $("#jaipurMurlipuraBox").show();
      } else if (this.accessCity[i]["city"] == "jaipur-sanganer") {
        // $("#jaipurSanganerBox").show();
      } else if (this.accessCity[i]["city"] == "mnz-test") {
        $("#jaipurMPZBox").show();
      } else if (this.accessCity[i]["city"] == "mpz-test") {
        $("#jaipurMNZBox").show();
      }
    }
  }

  closeMapModel() {
    this.modalService.dismissAll();
  }
}
