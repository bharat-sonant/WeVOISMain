import { Injectable } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AngularFirestore } from "@angular/fire/firestore";
import { FirebaseService } from "../../firebase.service";

@Injectable({
  providedIn: "root",
})
export class CommonService {
  constructor(
    private router: Router,
    public dbFireStore: AngularFirestore,
    public fs: FirebaseService,
    public db: AngularFireDatabase,
    private toastr: ToastrService
  ) { }

  notificationInterval: any;
  fsDb: any;
  zoneKML: any;
  map:any;


  setTodayDate() {
    let d = new Date();

    let month = d.getMonth() + 1;
    let day = d.getDate();

    return (
      d.getFullYear() +
      "-" +
      (month < 10 ? "0" : "") +
      month +
      "-" +
      (day < 10 ? "0" : "") +
      day
    );
  }

  getDate(day: any, month: any, year: any) {
    return (
      year +
      "-" +
      (month < 10 ? "0" : "") +
      month +
      "-" +
      (day < 10 ? "0" : "") +
      day
    );
  }

  getTodayDateTime() {
    let d = new Date();
    let month = d.getMonth() + 1;
    let day = d.getDate();
    let hour = d.getHours();
    let min = d.getMinutes();

    return (
      d.getFullYear() +
      "-" +
      (month < 10 ? "0" : "") +
      month +
      "-" +
      (day < 10 ? "0" : "") +
      day +
      " " +
      (hour < 10 ? "0" : "") +
      hour +
      ":" +
      (min < 10 ? "0" : "") +
      min
    );
  }

  getDaysBetweenDates(date1: any, date2: any) {
    let Difference_In_Time =
      new Date(date2.toString()).getTime() -
      new Date(date1.toString()).getTime();
    return Difference_In_Time / (1000 * 3600 * 24);
  }

  getNextDate(currentDate: any, addDay: any) {
    let date = new Date(currentDate.toString());
    date.setDate(date.getDate() + addDay);
    let month = (date.getMonth() + 1).toFixed(0);
    if (month.toString().length == 1) {
      month = "0" + month;
    }
    let day = date.getDate();
    let nextday = day.toString();
    let year = date.getFullYear();
    if (day.toString().length == 1) {
      nextday = "0" + day;
    }
    return year + "-" + month + "-" + nextday;
  }

  getPreviousDate(currentDate: any, addDay: any) {
    let date = new Date(currentDate.toString());
    date.setDate(date.getDate() - addDay);
    let month = (date.getMonth() + 1).toFixed(0);
    if (month.toString().length == 1) {
      month = "0" + month;
    }
    let day = date.getDate();
    let nextday = day.toString();
    let year = date.getFullYear();
    if (day.toString().length == 1) {
      nextday = "0" + day;
    }
    return year + "-" + month + "-" + nextday;
  }

  getPreviousMonth(currentDate: any, addMonth: any) {
    let date = new Date(currentDate.toString());
    date.setMonth(date.getMonth() - addMonth);
    let month = (date.getMonth() + 1).toFixed(0);
    if (month.toString().length == 1) {
      month = "0" + month;
    }
    let day = date.getDate();
    let nextday = day.toString();
    let year = date.getFullYear();
    if (day.toString().length == 1) {
      nextday = "0" + day;
    }
    return year + "-" + month + "-" + nextday;
  }

  initMapProperties() {
    var mapProp = {
      center: new google.maps.LatLng(27.6094, 75.1077),
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      backgroundColor: "none",
      mapTypeControl: true,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
     
    };

    return mapProp;
  }

  initMapPropertiesDefault() {
    var mapProp = {
      center: new google.maps.LatLng(27.6094, 75.1077),
      zoom: 12,
      disableDefaultUI: false,
      zoomControl: false,
      backgroundColor: "none",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    return mapProp;
  }

  initMapPropertiesRealTime() {
    var mapProp = {
      center: new google.maps.LatLng(27.6094, 75.1077),
      zoom: 50,
      disableDefaultUI: false,
      zoomControl: false,
      backgroundColor: "none",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    return mapProp;
  }

  initPropertiesForEditCardMap(lat: any, lng: any) {
    var mapProp = {
      center: new google.maps.LatLng(lat, lng),
      zoom: 19,
      disableDefaultUI: false,
      zoomControl: true,
      backgroundColor: "none",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    return mapProp;
  }

  mapForReport() {
    var mapProp = {
      center: new google.maps.LatLng(27.6094, 75.1077),
      optimized: false,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      backgroundColor: "none",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      draggable: false,
      scaleControl: false,
      scrollwheel: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    return mapProp;
  }

  mapForHaltReport() {
    var myStyles = [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ];

    var mapProp = {
      center: new google.maps.LatLng(27.6094, 75.1077),
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: true,
      backgroundColor: "none",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    return mapProp;
  }

  getKmlPathFromStorage(wardName: any) {
    this.fsDb
      .object("Defaults/KmlBoundary/storagePathUrl")
      .valueChanges()
      .subscribe((path) => {
        this.db
          .object("Defaults/KmlBoundary/" + wardName)
          .valueChanges()
          .subscribe((wardPath) => {
            return path + "" + wardPath;
          });
      });
  }

  getLineColor(status: any) {
    if (status == "LineCompleted") {
      return "#00f645";
    } else if (status == "PartialLineCompleted") {
      return "#faa700";
    } else if (status == "Skipped") {
      return "#fa0000";
    } else if (status == "skip") {
      return "#fa0000";
    } else if (status == "requestedLine") {
      return "#4400ff";
    } else {
      return "#60c2ff";
    }
  }

  getHrs(minutes: any) {
    let totalHrs = (minutes / 60).toString().split(".");

    let hrs = totalHrs[0];
    let mins: any;

    if (totalHrs.length > 1) {
      let min = Math.round(Number("." + totalHrs[1]) * 60);
      mins = min.toString().length == 1 ? "0" + min : min;
    } else {
      mins = "00";
    }
    return hrs + ":" + mins; // Number(mins).toFixed(2);
  }
  getHrsFull(minutes: any) {
    let totalHrs = (minutes / 60).toString().split(".");

    let hrs = totalHrs[0];
    let mins: any;

    if (totalHrs.length > 1) {
      let min = Math.round(Number("." + totalHrs[1]) * 60);
      mins = min.toString().length == 1 ? "0" + min : min;
    } else {
      mins = "00";
    }
    return hrs + " hr " + mins + " min"; // Number(mins).toFixed(2);
  }

  getBreakTimeBGColor(breakTime: Number) {
    let breakTimeBG = "#FFFFFF";
    if (breakTime == 0) {
      breakTimeBG = "rgb(182 182 182)"; // Grey
    } else if (breakTime > 0 && breakTime <= 30) {
      breakTimeBG = "rgb(9 189 51)"; // Green
    } else if (breakTime > 30 && breakTime <= 60) {
      breakTimeBG = "rgb(236 142 86)"; // Orange
    } else if (breakTime > 60) {
      breakTimeBG = "rgb(209 15 15)"; // Red
    }

    return breakTimeBG;
  }

  getCurrentMonthName(monthNumber: number) {
    var d = new Date();
    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    if (monthNumber != undefined) {
      return month[monthNumber];
    } else {
      return month[d.getMonth()];
    }
  }

  getCurrentMonthShortName(monthNumber: number) {
    var d = new Date();
    var month = new Array();
    month[0] = "Jan";
    month[1] = "Feb";
    month[2] = "Mar";
    month[3] = "Apr";
    month[4] = "May";
    month[5] = "Jun";
    month[6] = "Jul";
    month[7] = "Aug";
    month[8] = "Sep";
    month[9] = "Oct";
    month[10] = "Nov";
    month[11] = "Dec";
    if (monthNumber != undefined) {
      return month[monthNumber];
    } else {
      return month[d.getMonth()];
    }
  }

  tConvert(time: any) {
    // Check correct time format and split into components
    time = time
      .toString()
      .match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    if (time.length > 1) {
      // If time format correct
      time = time.slice(1); // Remove full string match value
      time[5] = +time[0] < 12 ? " AM" : " PM"; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    return time.join(""); // return adjusted time or original string
  }

  chkUserExpiryDate() {
    if (localStorage.getItem("expiryDate") != null) {
      if (new Date(this.setTodayDate()) >= new Date(localStorage.getItem("expiryDate"))) {
        this.router.navigate(["/login"]);
        localStorage.setItem("loginStatus", "Fail");
        this.toastr.error("Account Not Activate !!!", "", {
          timeOut: 60000,
          enableHtml: true,
          closeButton: true,
          toastClass: "alert alert-danger alert-with-icon",
          positionClass: "toast-bottom-right",
        });
      }
    }
  }


  transform(array: Array<any>, args: string): Array<any> {
    if (typeof args[0] === "undefined") {
      return array;
    }
    if (typeof array === "undefined") {
      return array;
    }
    let direction = args[0][0];
    let column = args.replace("-", "");
    array.sort((a: any, b: any) => {
      let left = Number(new Date(a[column]));
      let right = Number(new Date(b[column]));
      return direction === "-" ? right - left : left - right;
    });
    return array;
  }

  transformString(array: Array<any>, args: string): Array<any> {
    if (typeof args[0] === "undefined") {
      return array;
    }
    if (typeof array === "undefined") {
      return array;
    }
    var reA = "/[^a-zA-Z]/g";
    var reN = "/[^0-9]/g";
    let direction = args[0][0];
    let column = args;
    array.sort((a: any, b: any) => {
      if (a === b) {
        return 0;
      }
      if (typeof a === typeof b) {
        return a < b ? -1 : 1;
      }
      return typeof a < typeof b ? -1 : 1;
    });

    return array;
  }

  transformNumeric(array: Array<any>, args: string): Array<any> {
    if (typeof args[0] === "undefined") {
      return array;
    }
    if (typeof array === "undefined") {
      return array;
    }
    let direction = args[0][0];
    let column = args;
    array.sort((a: any, b: any) => {
      let left = a[column];
      let right = b[column];
      return left > right ? 1 : -1;
    });
    return array;
  }

  convert24(time: any) {
    let hours = Number(time.match(/^(\d+)/)[1]);
    let minutes = Number(time.match(/:(\d+)/)[1]);
    let AMPM = time.match(/\s(.*)$/)[1].toLowerCase();

    if (AMPM == "pm" && hours < 12) hours = hours + 12;
    if (AMPM == "am" && hours == 12) hours = hours - 12;
    let sHours = hours.toString();
    let sMinutes = minutes.toString();
    if (hours < 10) sHours = "0" + sHours;
    if (minutes < 10) sMinutes = "0" + sMinutes;

    return sHours + ":" + sMinutes;
  }

  timeDifferenceMin(dt2: Date, dt1: Date) {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
  }

  getMinuteToHHMM(minutes: any) {
    return (
      (parseFloat(minutes) / 60).toFixed(2).split(".")[0] +
      " hr " +
      (parseFloat((parseFloat(minutes) / 60).toFixed(2).split(".")[1]) * 60)
        .toString()
        .slice(0, 2) +
      " min"
    );
  }

  getCurrentTime() {
    return (
      new Date().toTimeString().split(" ")[0].split(":")[0] +
      ":" +
      new Date().toTimeString().split(" ")[0].split(":")[1]
    );
  }

  gteHrsAndMinutesOnly(time: string) {
    let hrsAndMinutes = "";
    if (time != "") {
      hrsAndMinutes = time.split(" ")[1].toString().substring(0, 5);
    }

    return hrsAndMinutes;
  }

  getEmplyeeDetailByEmployeeId(employeeId: string) {
    return new Promise((resolve) => {
      let employeeList = JSON.parse(localStorage.getItem("employeeList"));
      if (employeeList == undefined) {
        employeeList = [];
      }

      let employeeData = employeeList.find(
        (item) => item.userName == employeeId
      );
      if (employeeData == undefined) {
        this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
        let employeeDbPath = "Employees/" + employeeId + "/GeneralDetails";
        let employee = this.fsDb
          .object(employeeDbPath)
          .valueChanges()
          .subscribe((data) => {
            employee.unsubscribe();
            let designationDbPath =
              "Defaults/Designations/" + data["designationId"] + "/name";
            let designation = this.db
              .object(designationDbPath)
              .valueChanges()
              .subscribe((designationData) => {
                designation.unsubscribe();
                employeeList.push({
                  userName: data["userName"],
                  name: data["name"],
                  mobile: data["mobile"],
                  profilePhotoURL: data["profilePhotoURL"],
                  designation: designationData,
                });
                localStorage.setItem(
                  "employeeList",
                  JSON.stringify(employeeList)
                );
                let list = JSON.parse(localStorage.getItem("employeeList"));
                let employeeData = list.find(
                  (item) => item.userName == employeeId
                );
                resolve(employeeData);
              });
          });
      } else {
        resolve(employeeData);
      }
    });
  }

  getPortalUserDetailById(userId: string) {
    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    if (userList == null) {
      userList = [];
    }
    let userData = userList.find((item) => item.userId == userId);
    return userData;
  }

  setAlertMessage(type: any, message: any) {
    if (type == "error") {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-danger alert-with-icon",
        positionClass: "toast-bottom-right",
      });
    } else {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-info alert-with-icon",
        positionClass: "toast-bottom-right",
      });
    }
  }

  setAlertMessageWithCss(type: any, message: any, cssClass: any) {
    if (type == "error") {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: cssClass,
        positionClass: "toast-bottom-right",
      });
    } else {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: cssClass,
        positionClass: "toast-bottom-right",
      });
    }
  }

  setAlertMessageWithLeftPosition(type: any, message: any, cssClass: any) {
    if (type == "error") {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: cssClass,
        positionClass: "toast-bottom-left",
      });
    } else {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: cssClass,
        positionClass: "toast-bottom-left",
      });
    }
  }

  replaceAll(value: any, replaceFrom: any, replaceTo: any) {
    let returnValue = "";
    let valueList = value.split(replaceFrom);
    for (let i = 0; i < valueList.length; i++) {
      returnValue = returnValue + valueList[i] + replaceTo;
    }
    return returnValue;
  }

  chkUserPageAccess(pageURL: any, city: any) {

    let urlCity = pageURL.split("/")[pageURL.split("/").length - 3];
    if (city != urlCity) {
      urlCity = pageURL.split("/")[pageURL.split("/").length - 4];
      if (city != urlCity) {
        let value = "/" + city + "/home";
        this.router.navigate([value], { replaceUrl: true });
      }
    }
    let pageId = pageURL.split(city)[1].split("/")[1];
    let accessList = JSON.parse(localStorage.getItem("userAccessList"));
    let pageDetails = accessList.find(
      (item) => item.pageId == pageId && item.city == city
    );
    if (pageDetails == undefined) {
      let value = "/" + city + "/home";
      this.router.navigate([value], { replaceUrl: true });
    }
  }

  getFireStoreCity() {
    let city =
      localStorage.getItem("cityName").charAt(0).toUpperCase() +
      localStorage.getItem("cityName").slice(1);
    if (city == "Demo") {
      city = "Jaipur";
    }
    return city;
  }

  getWardLines(newDb: any, wardNo: any) {
    return new Promise((resolve) => {
      let wardLineCount = newDb
        .object("WardLines/" + wardNo + "")
        .valueChanges()
        .subscribe((lineCount) => {
          wardLineCount.unsubscribe();
          if (lineCount != null) {
            resolve(lineCount);
          }
        });
    });
  }

  getWardKML(newDb: any, wardNo: any) {
    return new Promise((resolve) => {
      newDb
        .object("Defaults/KmlBoundary/" + wardNo)
        .valueChanges()
        .subscribe((wardPath) => {
          resolve(wardPath);
        });
    });
  }


  //#region  all local storage

  setLocalStorageData(newDb: any) {
    this.fsDb = newDb;
    this.setPortalPages();
    this.setWebPortalUsers();
    this.setZones(newDb);
    this.setFixedLoctions(newDb);
    this.setVehicle(newDb);
    this.setDustbin(newDb);
    this.setWardLines(newDb);
    this.setMarkerZone(newDb);
    this.setWardKML(newDb);
  }

  setMarkerZone(newDb: any) {
    let zoneList = [];
    let dbPath = "Defaults/CircleWiseWards/Circle1";
    let zoneInstance = newDb
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
        zoneInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let zoneNo = data[i];
            let zoneName = data[i];
            if (data[i].toString().includes("mkt1")) {
              zoneName = "Market 1";
            } else if (data[i].toString().includes("mkt2")) {
              zoneName = "Market 2";
            } else if (data[i].toString().includes("mkt3")) {
              zoneName = "Market 3";
            } else if (data[i].toString().includes("mkt4")) {
              zoneName = "Market 4";
            } else {
              zoneName = "Ward " + data[i];
            }
            zoneList.push({ zoneNo: zoneNo, zoneName: zoneName });
          }
          localStorage.setItem("markerZone", JSON.stringify(zoneList));
        }
      });
  }

  setFixedLoctions(newDb: any) {
    let fixedLocation = [];
    let dbLocationPath = "Defaults/GeoLocations/FixedLocations";
    let locationDetail = newDb
      .list(dbLocationPath)
      .valueChanges()
      .subscribe((locationPath) => {
        locationDetail.unsubscribe();
        for (let i = 0; i < locationPath.length; i++) {
          fixedLocation.push({
            name: locationPath[i]["name"],
            address: locationPath[i]["address"],
            img: locationPath[i]["img"],
            lat: locationPath[i]["lat"],
            lng: locationPath[i]["lng"],
          });
        }
        localStorage.setItem("fixedLocation", JSON.stringify(fixedLocation));
      });
  }

  setVehicle(newDb: any) {
    let vehicleList = [];
    let dbPath = "Vehicles";
    let vehicleInstance = newDb
      .object(dbPath)
      .valueChanges()
      .subscribe((vehicle) => {
        vehicleInstance.unsubscribe();
        if (vehicle != null) {
          vehicleList.push({ vehicle: "Select Vehicle" });
          vehicleList.push({ vehicle: "Drum/Can" });
          vehicleList.push({ vehicle: "Motor Cycle" });
          let keyArrray = Object.keys(vehicle);
          if (keyArrray.length > 0) {
            for (let i = 0; i < keyArrray.length; i++) {
              if (keyArrray[i] != "NotApplicable") {
                vehicleList.push({ vehicle: keyArrray[i] });
              }
            }
          }
          localStorage.setItem("vehicle", JSON.stringify(vehicleList));
        }
      });
  }

  setDustbin(newDb: any) {
    let dustbinList = [];
    let dbPath = "DustbinData/DustbinDetails";
    let dustbinInstance = newDb
      .object(dbPath)
      .valueChanges()
      .subscribe((dustbin) => {
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
              dustbinList.push({
                zone: dustbin[index]["zone"],
                dustbin: keyArrray[i],
                address: dustbin[index]["address"],
                type: dustbin[index]["type"],
                pickFrequency: pickFrequency,
                lat: dustbin[index]["lat"],
                lng: dustbin[index]["lng"],
                isAssigned: dustbin[index]["isAssigned"],
                spelledRight: dustbin[index]["spelledRight"],
                ward: dustbin[index]["ward"],
                isDisabled: isDisabled,
                isBroken: isBroken,
              });
            }
          }
          localStorage.setItem("dustbin", JSON.stringify(dustbinList));
        }
      });
  }

  setWardKML(newDb: any) {
    let dbPath = "Defaults/KmlBoundary/";
    let wardLinesInstance = newDb.object(dbPath).valueChanges().subscribe(
      data => {
        wardLinesInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          let wardLineList = [];
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let wardNo = keyArray[i];
              let kmlUrl = data[wardNo];
              wardLineList.push({ wardNo: wardNo, kmlUrl: kmlUrl });
            }
            localStorage.setItem("wardKMList", JSON.stringify(wardLineList));
          }
        }
      }
    );
  }

  setWardLines(newDb: any) {
    let dbPath = "WardLines";
    let wardLinesInstance = newDb.object(dbPath).valueChanges().subscribe(
      data => {
        wardLinesInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          let wardLineList = [];
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let wardNo = keyArray[i];
              let wardLines = data[wardNo];
              wardLineList.push({ wardNo: wardNo, wardLines: wardLines });
            }
            localStorage.setItem("wardLineList", JSON.stringify(wardLineList));
          }
        }
      }
    );
  }


  setZones(newDb: any) {
    let letestZone = [];
    let dbPath = "Defaults/AvailableWard";
    let wardDetail = newDb
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
        if (data.length > 0) {
          letestZone.push({ zoneNo: "0", zoneName: "-- Select --" });
          for (let index = 0; index < data.length; index++) {
            if (
              !data[index].toString().includes("Test") &&
              data[index] != "OfficeWork" &&
              data[index] != "FixedWages" &&
              data[index] != "BinLifting" &&
              data[index] != "GarageWork" &&
              data[index] != "Compactor" &&
              data[index] != "SegregationWork" &&
              data[index] != "GeelaKachra" &&
              data[index] != "SecondHelper" &&
              data[index] != "ThirdHelper"
            ) {
              if (data[index].toString().includes("mkt")) {
                letestZone.push({
                  zoneNo: data[index],
                  zoneName:
                    "Market " + data[index].toString().replace("mkt", ""),
                });
              } else if (data[index].toString().includes("MarketRoute1")) {
                letestZone.push({ zoneNo: data[index], zoneName: "Market 1" });
              } else if (data[index].toString().includes("MarketRoute2")) {
                letestZone.push({ zoneNo: data[index], zoneName: "Market 2" });
              } else if (data[index].toString() == "WetWaste") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 1" });
              } else if (data[index].toString() == "WetWaste1") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 2" });
              } else if (data[index].toString() == "WetWaste2") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 3" });
              } else if (data[index].toString() == "WetWaste4") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 4" });
              } else if (data[index].toString() == "WetWaste5") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 5" });
              } else if (data[index].toString() == "WetWaste6") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 6" });
              } else if (data[index].toString() == "CompactorTracking1") {
                letestZone.push({
                  zoneNo: data[index],
                  zoneName: "CompactorTracking1",
                });
              } else if (data[index].toString() == "CompactorTracking2") {
                letestZone.push({
                  zoneNo: data[index],
                  zoneName: "CompactorTracking2",
                });
              } else {
                letestZone.push({
                  zoneNo: data[index],
                  zoneName: "Ward " + data[index],
                });
              }
            }
          }
          localStorage.setItem("latest-zones", JSON.stringify(letestZone));
        }
        wardDetail.unsubscribe();
      });
  }

  setWebPortalUsers() {
    let userList = [];
    this.dbFireStore
      .collection("UserManagement")
      .doc("Users")
      .collection("Users")
      .get()
      .subscribe((ss) => {
        const document = ss.docs;
        document.forEach((doc) => {
          let imgUrl = "internal-user.png";
          let utitle = "Internal User";
          if (doc.data()["userType"] == "External User") {
            imgUrl = "external-user.png";
            utitle = "External User";
          }
          let haltDisableAccess = 0;
          if (doc.data()["haltDisableAccess"] != undefined) {
            haltDisableAccess = doc.data()["haltDisableAccess"];
          }
          if (doc.data()["isDelete"] == "0") {
            userList.push({
              userKey: doc.id,
              userId: doc.data()["userId"],
              name: doc.data()["name"],
              email: doc.data()["email"],
              password: doc.data()["password"],
              userType: doc.data()["userType"],
              expiryDate: doc.data()["expiryDate"],
              notificationHalt: doc.data()["notificationHalt"],
              notificationMobileDataOff:
                doc.data()["notificationMobileDataOff"],
              notificationSkippedLines: doc.data()["notificationSkippedLines"],
              notificationPickDustbins: doc.data()["notificationPickDustbins"],
              notificationGeoSurfing: doc.data()["notificationGeoSurfing"],
              officeAppUserId: doc.data()["officeAppUserId"],
              isTaskManager: doc.data()["isTaskManager"],
              haltDisableAccess: haltDisableAccess,
            });
          }
        });
        localStorage.setItem("webPortalUserList", JSON.stringify(userList));
      });
  }

  setPortalPages() {
    let portalAccessList = [];
    this.dbFireStore
      .collection("UserManagement")
      .doc("PortalSectionAccess")
      .collection("Pages")
      .doc("gR6kziY4rXIv7yIgIK4g")
      .get()
      .subscribe((doc) => {
        let pageList = JSON.parse(doc.data()["pages"]);
        portalAccessList = this.transform(pageList, "position");
        localStorage.setItem("portalAccess", JSON.stringify(portalAccessList));
      });
  }

  setUserAccess(userid: any) {
    let accessList = [];
    let accessCity = [];
    let cityList = JSON.parse(localStorage.getItem("cityList"));
    for (let i = 0; i < cityList.length; i++) {
      let city = cityList[i]["city"];
      let name = cityList[i]["name"];
      let portalAccessList = JSON.parse(localStorage.getItem("portalAccess"));
      this.dbFireStore
        .collection("UserManagement")
        .doc("UserAccess")
        .collection("UserAccess")
        .doc(userid.toString())
        .collection(city)
        .doc(city)
        .get()
        .subscribe((doc) => {
          let pageId = doc.data()["pageId"];
          if (pageId != null) {
            let dataList = pageId.toString().split(",");
            for (let i = 0; i < dataList.length; i++) {
              let accessDetails = portalAccessList.find(
                (item) => item.pageID == dataList[i].trim()
              );
              if (accessDetails != undefined) {
                accessList.push({
                  city: city,
                  userId: userid,
                  parentId: accessDetails.parentId,
                  pageId: accessDetails.pageID,
                  name: accessDetails.name,
                  url: accessDetails.url,
                  position: accessDetails.position,
                  img: accessDetails.img,
                });
              }
            }
            accessCity.push({ city: city, name: name });
          }
          accessList = this.transform(accessList, "position");
          localStorage.setItem("userAccessList", JSON.stringify(accessList));
          localStorage.setItem("accessCity", JSON.stringify(accessCity));
        });
    }
  }

  checkUserCity(userid: any, city: any) {
    let isAccess = false;
    this.dbFireStore
      .collection("UserManagement")
      .doc("UserAccess")
      .collection("UserAccess")
      .doc(userid.toString())
      .collection(city)
      .doc(city)
      .get()
      .subscribe((doc) => {
        let pageId = doc.data()["pageId"];
        if (pageId != null) {
          return (isAccess = true);
        }
      });
  }

  setNotificationPermissions(userId: any) {
    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    let userDetails = userList.find((item) => item.userId == userId);
    if (userDetails != undefined) {
      if (userDetails.officeAppUserId != undefined) {
        localStorage.setItem("officeAppUserId", userDetails.officeAppUserId);
      }
      if (userDetails.empLocation != undefined) {
        localStorage.setItem("empLocation", userDetails.empLocation);
      }
      if (userDetails.isTaskManager != undefined) {
        localStorage.setItem("isTaskManager", userDetails.isTaskManager);
      } else {
        localStorage.setItem("isTaskManager", "0");
      }
      localStorage.setItem("notificationHalt", userDetails.notificationHalt);
      localStorage.setItem(
        "notificationMobileDataOff",
        userDetails.notificationMobileDataOff
      );
      localStorage.setItem(
        "notificationSkippedLines",
        userDetails.notificationSkippedLines
      );
      localStorage.setItem(
        "notificationPickDustbins",
        userDetails.notificationPickDustbins
      );
      localStorage.setItem(
        "notificationGeoSurfing",
        userDetails.notificationGeoSurfing
      );
    }
  }

  setCityData() {
    if (localStorage.getItem("isCityChange") == "yes") {
      localStorage.setItem("isCityChange", "no");
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 1000);
    }
  }

 

  setKML(zoneNo: any, map: any) {
    let wardKMLList = JSON.parse(localStorage.getItem("wardKMList"));
    if (wardKMLList != null) {
      let wardKML = wardKMLList.find(item => item.wardNo == zoneNo);
      if (wardKML != undefined) {
        this.zoneKML = new google.maps.KmlLayer({
          url: wardKML.kmlUrl.toString(),
          map: map,
        });
      }
    }
    return this.zoneKML;
  }

  setMapHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  setMap(gmap:any)
  {
    var mapstyle = new google.maps.StyledMapType([
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ]);
    let mapProp = this.initMapProperties();
    this.map = new google.maps.Map(gmap.nativeElement, mapProp);
    this.map.mapTypes.set("styled_map", mapstyle);
    this.map.setMapTypeId("styled_map");
    return this.map;
  }

  //#endregion
}
