import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as $ from 'jquery';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireModule } from 'angularfire2';
import { CommonService } from '../services/common/common.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  constructor(private router: Router, private commonService: CommonService, private toastr: ToastrService, public db: AngularFireDatabase) { }
  userId: any;
  userName: any = "admin";
  expiryDate: any;
  portalAccessList: any[];
  vehicleList: any[];
  dustbinList: any[];
  fixdGeoLocations: any[];
  cityName: any;

  ngOnInit() {
    console.log("ddgdgdfg")
    this.cityName = localStorage.getItem('cityName');
    $('.navbar-toggler').hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    this.getWebPortalUsers();
    this.getPortalPages();
    this.getVehicle();
    this.getDustbin();
    this.getFixedLoctions();
  }

  getWebPortalUsers() {
    let userList = [];
    this.db.object('Users').valueChanges().subscribe(
      data => {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              userList.push({ userKey: index, userId: data[index]["userId"], name: data[index]["name"], email: data[index]["email"], password: data[index]["password"], userType: data[index]["userType"], expiryDate: data[index]["expiryDate"], notificationHalt: data[index]["notificationHalt"], notificationMobileDataOff: data[index]["notificationMobileDataOff"], notificationSkippedLines: data[index]["notificationSkippedLines"], notificationPickDustbins: data[index]["notificationPickDustbins"], notificationGeoSurfing: data[index]["notificationGeoSurfing"],officeAppUserId:data[index]["officeAppUserId"],empLocation:data[index]["empLocation"] });
            }
          }
        }
        localStorage.setItem('webPortalUserList', JSON.stringify(userList));
      });
  }

  getUserAccess() {
    let accessList = [];
    let dbPath = "UserAccess";
    let userList = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        userList.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (data[index]["pageId"] != null) {
                let pageAccess = data[index]["pageId"].split([',']);
                if (pageAccess.length > 0) {
                  for (let j = 0; j < pageAccess.length; j++) {
                    let accessDetails = this.portalAccessList.find(item => item.pageID == pageAccess[j].trim());
                    if (accessDetails != undefined) {
                      accessList.push({ userId: index, parentId: accessDetails.parentId, pageId: accessDetails.pageID, name: accessDetails.name, url: accessDetails.url, position: accessDetails.position, img: accessDetails.img });
                    }
                  }
                }
              }
            }
            accessList = this.commonService.transform(accessList, 'position');
            localStorage.setItem('userAccessList', JSON.stringify(accessList));
          }
        }
      });
  }

  getPortalPages() {
    this.portalAccessList = [];
    let dbPath = "Defaults/PortalSectionAccess";
    let pagesInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        pagesInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];

              this.portalAccessList.push({ parentId: 0, pageID: index, name: data[index]["name"], img: data[index]["img"], position: data[index]["position"], url: "/" + this.cityName + data[index]["url"] });
              if (data[index]["SubPages"] != null) {
                let data2 = data[index]["SubPages"];
                let keyArray2 = Object.keys(data2);
                if (keyArray2.length > 0) {
                  for (let j = 0; j < keyArray2.length; j++) {
                    let index2 = keyArray2[j];
                    this.portalAccessList.push({ parentId: index, pageID: index2, name: data2[index2]["name"], img: data2[index2]["img"], position: data2[index2]["position"], url: "/" + this.cityName + data2[index2]["url"] });
                    if (data2[index2]["SubPages"] != null) {
                      let data3 = data2[index2]["SubPages"];
                      let keyArray3 = Object.keys(data3);
                      for (let k = 0; k < keyArray3.length; k++) {
                        let index3 = keyArray3[k];
                        this.portalAccessList.push({ parentId: index2, pageID: index3, name: data3[index3]["name"], img: data3[index3]["img"], position: data3[index3]["position"], url: "/" + this.cityName + data3[index3]["url"] });
                      }
                    }
                  }
                }
              }
            }
            this.portalAccessList = this.commonService.transform(this.portalAccessList, 'position');
            this.getUserAccess();
            localStorage.setItem('portalAccess', JSON.stringify(this.portalAccessList));

          }
        }
      }
    );
  }


  doLogin() {
    let userName = $("#txtUserName").val();
    let password = $("#txtPassword").val();
    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    let userDetails = userList.find(item => item.email == userName && item.password == password);
    if (userDetails != undefined) {

      if (userDetails.expiryDate != null) {
        this.expiryDate = userDetails.expiryDate;
        localStorage.setItem('expiryDate', this.expiryDate);
      }
      else {
        this.expiryDate = null;
        localStorage.setItem('expiryDate', null);
      }
      localStorage.setItem('userName', userDetails.name);
      localStorage.setItem('userID', userDetails.userId);
      localStorage.setItem('userKey', userDetails.userKey);
      localStorage.setItem('userType', userDetails.userType);
      if (userDetails.officeAppUserId != undefined) {
        localStorage.setItem('officeAppUserId', userDetails.officeAppUserId);
      }
      if (userDetails.empLocation != undefined) {
        localStorage.setItem('empLocation', userDetails.empLocation);
      }
      localStorage.setItem('notificationHalt', userDetails.notificationHalt);
      localStorage.setItem('notificationMobileDataOff', userDetails.notificationMobileDataOff);
      localStorage.setItem('notificationSkippedLines', userDetails.notificationSkippedLines);
      localStorage.setItem('notificationPickDustbins', userDetails.notificationPickDustbins);
      localStorage.setItem('notificationGeoSurfing', userDetails.notificationGeoSurfing);
      if (this.expiryDate != null) {
        if (new Date(this.commonService.setTodayDate()) < new Date(this.expiryDate)) {
          localStorage.setItem('loginStatus', "Success");
          setTimeout(() => {
            window.location.href = this.cityName + "/home";
            //  $("#divMainContent").css("width", "calc(100% - 80px)");
            //  $("#divSideMenus").show();
          }, 1000);
          // this.router.navigate(['/home']);
        }
        else {
          localStorage.setItem('loginStatus', "Fail");
          this.commonService.setAlertMessage("error", "Account Not Activate !!!");
        }
      }
      else {
        localStorage.setItem('expiryDate', null);
        localStorage.setItem('loginStatus', "Success");
        setTimeout(() => {
          window.location.href = this.cityName + "/home";
          // $("#divMainContent").css("width", "calc(100% - 80px)");
          //$("#divSideMenus").show();
        }, 1000);
      }
    }
    else {
      localStorage.setItem('loginStatus', "Fail");
      this.commonService.setAlertMessage("error", "Invalid username or password !!!");
    }
  }

  getFixedLoctions() {
    let fixedLocation = [];
    let dbLocationPath = "Defaults/GeoLocations/FixedLocations";
    let locationDetail = this.db.list(dbLocationPath).valueChanges().subscribe(
      locationPath => {
        locationDetail.unsubscribe();
        for (let i = 0; i < locationPath.length; i++) {
          fixedLocation.push({ name: locationPath[i]["name"], address: locationPath[i]["address"], img: locationPath[i]["img"], lat: locationPath[i]["lat"], lng: locationPath[i]["lng"] });
        }
        this.fixdGeoLocations = fixedLocation;
        localStorage.setItem('fixedLocation', JSON.stringify(fixedLocation));
      });
  }

  getVehicle() {
    this.vehicleList = [];
    let dbPath = "Vehicles";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      vehicle => {
        vehicleInstance.unsubscribe();
        if (vehicle != null) {
          this.vehicleList.push({ vehicle: "Select Vehicle" });
          this.vehicleList.push({ vehicle: "Drum/Can" });
          this.vehicleList.push({ vehicle: "Motor Cycle" });
          let keyArrray = Object.keys(vehicle);
          if (keyArrray.length > 0) {
            for (let i = 0; i < keyArrray.length; i++) {
              if (keyArrray[i] != "NotApplicable") {
                this.vehicleList.push({ vehicle: keyArrray[i] });
              }
            }
          }
          localStorage.setItem('vehicle', JSON.stringify(this.vehicleList));
        }
      });
  }

  getDustbin() {
    this.dustbinList = [];
    let dbPath = "DustbinData/DustbinDetails";
    let dustbinInstance = this.db.object(dbPath).valueChanges().subscribe(
      dustbin => {
        dustbinInstance.unsubscribe();
        if (dustbin != null) {
          let keyArrray = Object.keys(dustbin);
          if (keyArrray.length > 0) {
            for (let i = 0; i < keyArrray.length; i++) {
              let index = keyArrray[i];
              let pickFrequency = 0;
              let isDisabled = "no";
              let isBroken = false;
              if (dustbin[index]["pickFrequency"] != null) {
                pickFrequency = Number(dustbin[index]["pickFrequency"]);
              }
              if (dustbin[index]["isDisabled"] != null) {
                isDisabled = dustbin[index]["isDisabled"];
              }
              if (dustbin[index]["isBroken"] != null) {
                isBroken = dustbin[index]["isBroken"];
              }
              this.dustbinList.push({ zone: dustbin[index]["zone"], dustbin: keyArrray[i], address: dustbin[index]["address"], type: dustbin[index]["type"], pickFrequency: pickFrequency, lat: dustbin[index]["lat"], lng: dustbin[index]["lng"], isAssigned: dustbin[index]["isAssigned"], spelledRight: dustbin[index]["spelledRight"], ward: dustbin[index]["ward"], isDisabled: isDisabled, isBroken: isBroken });
            }
          }
          localStorage.setItem('dustbin', JSON.stringify(this.dustbinList));
        }
      });
  }

}
