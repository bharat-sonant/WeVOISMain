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
  ngOnInit() {
    $(".navbar-toggler").hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    this.accessCity = JSON.parse(localStorage.getItem("accessCity"));
    this.getCityAccess();

  }

  getCityAccess() {
    let isBaseCity = false;
    for (let i = 0; i < this.accessCity.length; i++) {
      if (this.accessCity[i]["city"] == "sikar") {
        $("#sikarBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "reengus") {
        $("#reengusBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jaipur-office") {
        $("#jaipurOfficeBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jaipur-greater") {
        $("#jaipurGreaterBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "kishangarh") {
        $("#kishangarhBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "salasar") {
        $("#salasarBox").show();
        //isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "chirawa") {
        $("#chirawaBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "tonk") {
        $("#tonkBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "wevois-others") {
        $("#wevoisBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "ratangarh") {
        $("#ratangarhBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "nokha") {
        $("#nokhaBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "losal") {
        $("#losalBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jaipur-test") {
        $("#jaipurTestBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jammu-survey") {
        $("#jammuSurveyBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jammu-survey") {
        $("#jammuSurveyBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "khandela") {
        $("#khandelaBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "dehradun") {
        $("#dehradunBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "pali") {
        $("#paliBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "sujangarh") {
        $("#sujangarhBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "noida") {
        $("#noidaBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "sikar-survey") {
        $("#sikarSurveyBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jodhpur") {
        $("#jodhpurBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "kuchaman") {
        $("#kuchamanBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "iit-roorkee") {
        $("#iitRoorkeeBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "nawa") {
        $("#nawaBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "sonipat") {
        $("#sonipatBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jodhpur-bwg") {
        $("#jodhpurBwgBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "tonk-raj") {
        $("#tonkRajBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jaipur-bwg") {
        $("#jaipurBWGBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "etmadpur") {
        $("#etmadpurBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "bharatpur") {
        $("#bharatpurBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "ajmer") {
        $("#ajmerBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "sujalpur") {
        $("#sujalpurBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "uniara") {
        $("#uniaraBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "rajsamand") {
        $("#rajsamandBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "sultanpur") {
        $("#sultanpurBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "khairabad") {
        $("#khairabadBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "sanchore") {
        $("#sanchoreBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "jaunpur") {
        $("#jaunpurBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "mapusa-goa") {
        $("#mapusaBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "ecogram") {
        $("#ecogramBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "jaipur-textile-recycling-facility") {
        $("#jaipurRecyclingBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "chennai") {
        $("#chennaiBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "dausa") {
        $("#dausaBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "dei-bundi") {
        $("#deibundiBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "biofics-surat") {
        $("#bioficsSuratBox").show();
        isBaseCity = true;
      }else if (this.accessCity[i]["city"] == "nainwa") {
        $("#nainwaBox").show();
        isBaseCity = true;
      } else if (this.accessCity[i]["city"] == "jaipur-jagatpura" || this.accessCity[i]["city"] == "jaipur-jhotwara" || this.accessCity[i]["city"] == "jaipur-malviyanagar" || this.accessCity[i]["city"] == "jaipur-mansarovar" || this.accessCity[i]["city"] == "jaipur-murlipura" || this.accessCity[i]["city"] == "jaipur-sanganer" || this.accessCity[i]["city"] == "jaipur-vidhyadhar" || this.accessCity[i]["city"] == "jaipur-civil-line" || this.accessCity[i]["city"] == "jaipur-kishanpole") {
        $("#jaipurBox").show();
      }
    }
  }

  getCity(city: any) {
    localStorage.setItem("cityName", city);
    localStorage.setItem("isCityChange", "yes");
    let path = city + "/login";
    window.location.href = path;
  }

  changeCity(cityName: any) {
    localStorage.removeItem("mapUpdateHistory");
    localStorage.setItem("cityName", cityName);
    localStorage.setItem("isCityChange", "yes");
    this.closeMapModel();
    window.location.href = "/" + cityName + "/home";
  }


  openCityModel(content: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 300;
    let width = 767;



    let windowwidth = $(window).width();

    if (windowwidth >= 1350) {
      width = 767;
      $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", "15%");

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
    $("div .modal-dialog-centered").css("margin-top", "50px");

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
