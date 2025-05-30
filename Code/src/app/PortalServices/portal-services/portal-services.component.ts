import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";
import { ToastrService } from "ngx-toastr"; // Alert message using NGX toastr
import { ActivatedRoute, Router } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: "app-portal-services",
  templateUrl: "./portal-services.component.html",
  styleUrls: ["./portal-services.component.scss"],
})
export class PortalServicesComponent implements OnInit {
  constructor(public fs: FirebaseService, private router: Router, public toastr: ToastrService, private commonService: CommonService, private mapService: MapService) { }

  userId: any;
  cityName: any;
  db: any;
  userType: any;
  isActual: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.userId = localStorage.getItem("userID");
    if (localStorage.getItem("userType") == "External User") {
      this.userType = "1";
    }
    else {
      this.userType = "2";
    }
    this.isActual = localStorage.getItem("isActual");
    this.getUserAccess();
  }

  getUserAccess() {
    console.log(localStorage.getItem("canAddWardDutyOn"));
    let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
    if (userAccessList != null) {
      for (let i = 0; i < userAccessList.length; i++) {
        if (userAccessList[i]["pageId"] == "8D" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divTaskMasters").show();
        }
        if (userAccessList[i]["pageId"] == "8E" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divMapReview").show();
        }
        if (userAccessList[i]["pageId"] == "8M" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divPenalty").show();
        }
        if (userAccessList[i]["pageId"] == "8N" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divAccount").show();
        }
        if (userAccessList[i]["pageId"] == "8O" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divKMLtoJSON").show();
        }
        if (userAccessList[i]["pageId"] == "8Q" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divWorkPercentage").show();
        }
        if (userAccessList[i]["pageId"] == "8R" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divChangeLineData").show();
        }
        if (userAccessList[i]["pageId"] == "8S" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divSettings").show();
        }
        if (userAccessList[i]["pageId"] == "8V" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divDustbinWardMapping").show();
        }
        if (userAccessList[i]["pageId"] == "8W" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divWardLineWeightage").show();
        }
        if (userAccessList[i]["pageId"] == "8X" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divChangeLineMarkerData").show();
        }
        if (userAccessList[i]["pageId"] == "8Y" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divScanCardManipulation").show();
        }
        if (userAccessList[i]["pageId"] == "8Z" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divSetNearbyWard").show();
        }
        if (userAccessList[i]["pageId"] == "8Z" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divSetNearbyWard").show();
        }
        if (userAccessList[i]["pageId"] == "8A1" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          if (this.cityName == "test") {
            $("#divBGManagement").show();
          }
        }
        if (userAccessList[i]["pageId"] == "8A2" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divPortalReview").show();
        }
        if (userAccessList[i]["pageId"] == "8A3" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divManageWardWorkTime").show();
        }
        if (userAccessList[i]["pageId"] == "8A4" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divOpenDepotWardMapping").show();
        }
        if (userAccessList[i]["pageId"] == "8A5" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divWebPortalSettings").show();
        }
        if (userAccessList[i]["pageId"] == "8A6" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          
          if (localStorage.getItem("canAddWardDutyOn") == "1") {
            $("#divWardDutyOn").show();
          }
        }
      }
    }
  }

  goToPage(url: any) {
    url = localStorage.getItem("cityName") + url;
    this.router.navigate([url]);
  }

  goToURL(url: any) {
    let newUrl = url.split("https://mainportal-react.web.app/userId/")[1];
    if (this.cityName == "test") {
      url = "https://mainportal-react.web.app/" + localStorage.getItem("userID") + "/" + newUrl;
    }
    else {
      url = "https://main-wevois.firebaseapp.com/" + localStorage.getItem("userID") + "/" + newUrl;
    }
    window.open(url, "_blank");
  }

  goToOuterURL(url: any) {
    let newUrl = url.split("https://mainportal-react.web.app/userId/")[1];
    if (this.cityName == "test") {
      url = "https://mainportal-react.web.app/" + this.cityName + "/" + this.userId + "/" + this.userType + "/" + this.isActual + "/" + newUrl;
    }
    else {
      url = "https://main-wevois.firebaseapp.com/" + this.cityName + "/" + this.userId + "/" + this.userType + "/" + this.isActual + "/" + newUrl;
    }
    window.open(url, "_blank");
  }
}
