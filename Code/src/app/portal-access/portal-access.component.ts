import { Component, OnInit } from "@angular/core";
import { CommonService } from "../services/common/common.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-portal-access",
  templateUrl: "./portal-access.component.html",
  styleUrls: ["./portal-access.component.scss"],
})
export class PortalAccessComponent implements OnInit {
  constructor(private commonService: CommonService,private modalService: NgbModal) { }
  cityList: any[] = [];
  ngOnInit() {
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    this.cityList.push({ city: "sikar", name: "Sikar", storagePath:"Sikar" });
    this.cityList.push({ city: "reengus", name: "Reengus", storagePath:"Reengus" });
    this.cityList.push({ city: "shahpura", name: "Shahpura", storagePath:"Shahpura" });
    this.cityList.push({ city: "test", name: "Test", storagePath:"Test" });
    this.cityList.push({ city: "jaipur-office", name: "Jaipur Office", storagePath:"Jaipur" });
    this.cityList.push({ city: "jaipur", name: "Jaipur", storagePath:"JaipurD2D" });
    this.cityList.push({ city: "jaipur-greater", name: "Jaipur Greater", storagePath:"Jaipur-Greater" });
    this.cityList.push({ city: "kishangarh", name: "Kishangarh", storagePath:"Kishangarh" });
    this.cityList.push({ city: "niwai", name: "Niwai", storagePath:"Niwai" });
    this.cityList.push({ city: "jaisalmer", name: "Jaisalmer", storagePath:"Jaisalmer" });
    this.cityList.push({ city: "churu", name: "Churu", storagePath:"Churu" });
    this.cityList.push({ city: "behror", name: "Behror", storagePath:"Behror" });
    this.cityList.push({ city: "salasar", name: "Salasar Balaji", storagePath:"Salasar" });
    
    this.cityList.push({ city: "jaipur-jagatpura", name: "Jagatpura", storagePath:"Jaipur-Jagatpura" });
    this.cityList.push({ city: "jaipur-jhotwara", name: "Jhotwara", storagePath:"Jaipur-Jhotwara" });
    this.cityList.push({ city: "jaipur-malviyanagar", name: "Malviyanagar", storagePath:"Jaipur-Malviyanagar" });
    this.cityList.push({ city: "jaipur-mansarovar", name: "Mansarovar", storagePath:"Jaipur-Mansarovar" });
    this.cityList.push({ city: "jaipur-murlipura", name: "Murlipura", storagePath:"Jaipur-Murlipura" });
    this.cityList.push({ city: "jaipur-sanganer", name: "Sanganer", storagePath:"Jaipur-Sanganer" });
    this.cityList.push({ city: "jaipur-vidhyadhar", name: "Vidhyadhar", storagePath:"Jaipur-Vidhyadhar" });
    localStorage.setItem("cityList", JSON.stringify(this.cityList));
  }

  getCity(city: any) {
    localStorage.setItem("cityName", city);
    localStorage.setItem("isCityChange", "yes");
    let path = city + "/login";
    window.location.href = path;
  }

  
  openCityModel(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 500;
    let width = 767;



    let windowwidth = $(window).width();

    if (windowwidth >= 1350) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "5%");

    } else if (windowwidth <= 1349 && windowwidth >= 1201) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 1200 && windowwidth >= 1025) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 1024 && windowwidth >= 768) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "50px");

    } else if (windowwidth <= 767 && windowwidth >= 577) {
      width = 575;


    } else if (windowwidth <= 576 && windowwidth >= 410) {
      width = 400;

    } else if (windowwidth <= 413 && windowwidth >= 270) {
      width = 265;

    }

    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top");
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
  }

  closeMapModel() {
    this.modalService.dismissAll();
  }
}
