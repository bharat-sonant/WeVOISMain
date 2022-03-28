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
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.userId = localStorage.getItem("userID");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.getUserAccess();
  }

  getUserAccess() {
    let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
    if (userAccessList != null) {
      for (let i = 0; i < userAccessList.length; i++) {
        if (userAccessList[i]["pageId"] == "8A" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divLineCard").show();
        }
        if (userAccessList[i]["pageId"] == "8D" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divTaskMasters").show();
        }
        if (userAccessList[i]["pageId"] == "8E" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divMapReview").show();
        }
        if (userAccessList[i]["pageId"] == "8F" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divLineMarker").show();
        }
        if (userAccessList[i]["pageId"] == "8G" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divVTSRoute").show();
        }
        if (userAccessList[i]["pageId"] == "8J" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divCreateRoute").show();
        }
        if (userAccessList[i]["pageId"] == "8K" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divUploadRouteExcel").show();
        }
        if (userAccessList[i]["pageId"] == "8L" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divVehicleTrack").show();
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
        if (userAccessList[i]["pageId"] == "8P" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divDustbinService").show();
        }
        if (userAccessList[i]["pageId"] == "8Q" && userAccessList[i]["userId"] == this.userId && userAccessList[i]["city"] == this.cityName) {
          $("#divWorkPercentage").show();
        }
      }
    }
  }


  showAlert() {
    this.toastr.error("Updated Successfully !!!", "", {
      timeOut: 2000,
      enableHtml: true,
      closeButton: true,
      toastClass: "alert alert-info alert-with-icon",
      positionClass: "toast-bottom-right",
    });
  }

  goToPage(url: any) {
    console.log(url);
    url = localStorage.getItem("cityName") + url;
    this.router.navigate([url]);
  }
}
