import { LineCardMappingComponent } from "./../../line-card-mapping/line-card-mapping.component";
import { Injectable } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { environment } from "../../../environments/environment";
import { data } from "jquery";
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
  ) {}

  notificationInterval: any;
  fsDb: any;

  getAllZones() {
    return JSON.parse(localStorage.getItem("zones"));
  }

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
      // center: new google.maps.LatLng(28.4041, 77.07301009999999),
      center: new google.maps.LatLng(27.6094, 75.1077),
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      backgroundColor: "none",
      mapTypeControl: true,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      // styles: [
      //   { "elementType": "labels.icon", "stylers": [ { "visibility": "on" } ] },
      //   { "elementType": "labels.text.fill", "stylers": [ { "color": "#757575" },{ "visibility": "on" }] },
      //   { "featureType": "road.local", "elementType": "labels.text.fill",  "stylers": [ { "color": "#4e4e4e" },{ "visibility": "on" } ] },
      //   { "featureType": "administrative", "elementType": "labels", "stylers": [ { "visibility": "off" },{"weight" : "5"} ] },
      // ]
    };

    return mapProp;
  }

  initMapPropertiesDefault() {
    var mapProp = {
      center: new google.maps.LatLng(27.6094, 75.1077),
      //center: new google.maps.LatLng(27.609602241246694, 75.07276436205115),
      zoom: 12,
      disableDefaultUI: false,
      zoomControl: false,
      backgroundColor: "none",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      // styles: [
      //   { "elementType": "labels.icon", "stylers": [ { "visibility": "on" } ] },
      //   { "elementType": "labels.text.fill", "stylers": [ { "color": "#757575" },{ "visibility": "on" }] },
      //   { "featureType": "road.local", "elementType": "labels.text.fill",  "stylers": [ { "color": "#4e4e4e" },{ "visibility": "on" } ] },
      //   { "featureType": "administrative", "elementType": "labels", "stylers": [ { "visibility": "off" },{"weight" : "5"} ] },
      // ]
    };

    return mapProp;
  }

  initMapPropertiesRealTime() {
    var mapProp = {
      center: new google.maps.LatLng(27.6094, 75.1077),
      //center: new google.maps.LatLng(27.609602241246694, 75.07276436205115),
      zoom: 50,
      disableDefaultUI: false,
      zoomControl: false,
      backgroundColor: "none",
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      // styles: [
      //   { "elementType": "labels.icon", "stylers": [ { "visibility": "on" } ] },
      //   { "elementType": "labels.text.fill", "stylers": [ { "color": "#757575" },{ "visibility": "on" }] },
      //   { "featureType": "road.local", "elementType": "labels.text.fill",  "stylers": [ { "color": "#4e4e4e" },{ "visibility": "on" } ] },
      //   { "featureType": "administrative", "elementType": "labels", "stylers": [ { "visibility": "off" },{"weight" : "5"} ] },
      // ]
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
      // styles: [
      //   { "elementType": "labels.icon", "stylers": [{ "visibility": "on" }] },
      //   { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }, { "visibility": "on" }] },
      //   { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e4e4e" }, { "visibility": "on" }] },
      //   { "featureType": "administrative", "elementType": "labels", "stylers": [{ "visibility": "off" }, { "weight": "5" }] },
      // ]
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
      // styles: [
      //   { "elementType": "labels.icon", "stylers": [ { "visibility": "on" } ] },
      //   { "elementType": "labels.text.fill", "stylers": [ { "color": "#757575" },{ "visibility": "on" }] },
      //   { "featureType": "road.local", "elementType": "labels.text.fill",  "stylers": [ { "color": "#4e4e4e" },{ "visibility": "on" } ] },
      //   { "featureType": "administrative", "elementType": "labels", "stylers": [ { "visibility": "off" },{"weight" : "5"} ] },
      // ]
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

      //mapTypeIds: ['roadmap', 'styled_map'],
      //styledMapType: mapstyle,
      //styles: myStyles
      // styles: [
      //   { "elementType": "labels.icon", "stylers": [ { "visibility": "on" } ] },
      //   { "elementType": "labels.text.fill", "stylers": [ { "color": "#757575" },{ "visibility": "on" }] },
      //   { "featureType": "road.local", "elementType": "labels.text.fill",  "stylers": [ { "color": "#4e4e4e" },{ "visibility": "on" } ] },
      //   { "featureType": "administrative", "elementType": "labels", "stylers": [ { "visibility": "off" },{"weight" : "5"} ] },
      // ]
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

  getkmlFilePath(selectedZone: any) {
    var kmlFilepath: any;
    var filePath =
      "https://firebasestorage.googleapis.com/v0/b/wevois-staging.appspot.com/o/sikar-kmls%2F";

    switch (selectedZone) {
      case "1_50":
        kmlFilepath =
          filePath +
          "1_50.kml?alt=media&token=05ed09a1-4ae7-4720-b3f0-f00fa29b09ca";
        break;
      case "1000":
        kmlFilepath =
          filePath +
          "1000.kml?alt=media&token=cf545cb5-611d-46af-baf0-2892ff48b6ae";
        break;
      case "2":
        kmlFilepath =
          filePath +
          "2.kml?alt=media&token=1486c1ce-9194-4e21-8a4e-095639945263";
        break;
      case "3":
        kmlFilepath =
          filePath +
          "3.kml?alt=media&token=35f24e5e-4181-4d36-aa5d-21ab3f8e74bd";
        break;
      case "5":
        kmlFilepath =
          filePath +
          "5.kml?alt=media&token=8598862d-7604-4aff-8af7-94bafd544cab";
        break;
      case "6_7":
        kmlFilepath =
          filePath +
          "6_7.kml?alt=media&token=3541f10f-dbcf-496e-b918-99ba9bd62828";
        break;
      case "08":
        kmlFilepath =
          filePath +
          "08.kml?alt=media&token=a1b00586-b96f-4e40-94d0-a9a3cdce0c63";
        break;
      case "9":
        kmlFilepath =
          filePath +
          "9.kml?alt=media&token=edf31029-1181-483f-94ac-d7f5d1f2b510";
        break;
      case "10":
        kmlFilepath =
          filePath +
          "10.kml?alt=media&token=7ec7dde5-b72c-4d96-884c-ca9020a049d1";
        break;
      case "11":
        kmlFilepath =
          filePath +
          "11.kml?alt=media&token=49b74dfa-df76-40b1-9daf-841d099fe349";
        break;
      case "12_13":
        kmlFilepath =
          filePath +
          "12_13.kml?alt=media&token=09d3ce83-b6ef-4cd7-8fc2-93f3c88ada99";
        break;
      case "14_15":
        kmlFilepath =
          filePath +
          "14_15.kml?alt=media&token=6c1b938a-004d-4507-b00b-deac9a5d8cee";
        break;
      case "16_31":
        kmlFilepath =
          filePath +
          "16_31.kml?alt=media&token=51320501-2c7d-4d9d-8ea7-12d01c80720f";
        break;
      case "17":
        kmlFilepath =
          filePath +
          "17.kml?alt=media&token=72003ea3-8013-4927-913d-c144d488774e";
        break;
      case "18":
        kmlFilepath =
          filePath +
          "18.kml?alt=media&token=8cbe8013-2956-4813-a387-1331584b4e48";
        break;
      case "19":
        kmlFilepath =
          filePath +
          "19.kml?alt=media&token=dc88173e-4024-416a-8a4b-eb8f546308d7";
        break;
      case "20":
        kmlFilepath =
          filePath +
          "20.kml?alt=media&token=aa76564f-379b-4d44-bf6a-cd4b1622a489";
        break;
      case "21":
        kmlFilepath =
          filePath +
          "21.kml?alt=media&token=6a5591d2-dbcf-465b-b72c-992f8e3aae1f";
        break;
      case "22":
        kmlFilepath =
          filePath +
          "22.kml?alt=media&token=2f97fa3a-5bb5-47a7-9ce1-7c9ea76e87a5";
        break;
      case "24":
        kmlFilepath =
          filePath +
          "24.kml?alt=media&token=65680eea-2e64-4919-bee9-89cb3c558029";
        break;
      case "25":
        kmlFilepath =
          filePath +
          "25.kml?alt=media&token=33604ad2-d1f8-4e72-baf2-56dd2cc1c6f9";
        break;
      case "26":
        kmlFilepath =
          filePath +
          "26.kml?alt=media&token=a216589a-0ac9-4526-be64-556476e06c11";
        break;
      case "27":
        kmlFilepath =
          filePath +
          "27.kml?alt=media&token=e5b2c3ba-2929-4286-88b8-e316129e8510";
        break;
      case "28":
        kmlFilepath =
          filePath +
          "28.kml?alt=media&token=c7bfae14-f386-4ddc-8fc6-2a2e37701b22";
        break;
      case "29":
        kmlFilepath =
          filePath +
          "29.kml?alt=media&token=d630e788-42f4-4069-9683-e596ad308bad";
        break;
      case "30":
        kmlFilepath =
          filePath +
          "30.kml?alt=media&token=4f23090d-c238-45dc-b03c-f52fdd282ec2";
        break;
      case "32":
        kmlFilepath =
          filePath +
          "32.kml?alt=media&token=50b48a06-778d-45a0-b640-c2aed4bd3f80";
        break;
      case "33":
        kmlFilepath =
          filePath +
          "33.kml?alt=media&token=5e43ab3d-0f26-4203-8bb3-6c660c2c18e9";
        break;
      case "34":
        kmlFilepath =
          filePath +
          "34.kml?alt=media&token=303683d2-4426-4ba7-911c-cece69ea137c";
        break;
      case "35":
        kmlFilepath =
          filePath +
          "35.kml?alt=media&token=424dbeb3-70aa-4099-84ac-3662847dd648";
        break;
      case "36":
        kmlFilepath =
          filePath +
          "36.kml?alt=media&token=4280e7ad-c2d4-4cfa-aab9-c3d5854d3571";
        break;
      case "37":
        kmlFilepath =
          filePath +
          "37.kml?alt=media&token=14b43eb3-5d6e-48a4-94f3-8bf731dbb325";
        break;
      case "38":
        kmlFilepath =
          filePath +
          "38.kml?alt=media&token=5c91febb-4504-4653-bbe2-1644b49d3ff4";
        break;
      case "39":
        kmlFilepath =
          filePath +
          "39.kml?alt=media&token=5fb28e40-4f98-484f-9806-db0552bee554";
        break;
      case "40":
        kmlFilepath =
          filePath +
          "40.kml?alt=media&token=c1097b5f-cf03-4003-9ac3-d13d98856600";
        break;
      case "40A":
        kmlFilepath =
          filePath +
          "40A.kml?alt=media&token=781c7a96-fd64-44d2-8d99-f54c3f94a1e3";
        break;
      case "40B":
        kmlFilepath =
          filePath +
          "40B.kml?alt=media&token=eb3042b4-025d-4981-8cef-3316593cddaf";
        break;
      case "41":
        kmlFilepath =
          filePath +
          "41.kml?alt=media&token=76523ced-204a-4d63-96d9-f4f39160291d";
        break;
      case "41A":
        kmlFilepath =
          filePath +
          "41A.kml?alt=media&token=4609093d-347b-45c5-a230-ecac26be6a2e";
        break;
      case "41B":
        kmlFilepath =
          filePath +
          "41B.kml?alt=media&token=343f3177-ad27-4005-9141-80d109ec6907";
        break;
      case "42":
        kmlFilepath =
          filePath +
          "42.kml?alt=media&token=89543b7e-c2ba-4b2e-968b-d2bfde4050b4";
        break;
      case "42A":
        kmlFilepath =
          filePath +
          "42A.kml?alt=media&token=5d063527-d754-4823-b983-fcc6666e9675";
        break;
      case "42B":
        kmlFilepath =
          filePath +
          "42B.kml?alt=media&token=fcd97e0f-d0c4-4372-981a-4b629869c631";
        break;
      case "43A":
        kmlFilepath =
          filePath +
          "43A.kml?alt=media&token=4d04e2fc-b1b1-4848-9cfb-65f1308c2770";
        break;
      case "43B":
        kmlFilepath =
          filePath +
          "43B.kml?alt=media&token=d0f7811b-422c-40ee-9954-342889a1f060";
        break;
      case "44":
        kmlFilepath =
          filePath +
          "44.kml?alt=media&token=e36a16b7-1559-4a5b-8ff0-5d9e37b95c7b";
        break;
      case "45":
        kmlFilepath =
          filePath +
          "45.kml?alt=media&token=c5661dfd-3eb5-4595-88b2-7d02b5d78d6d";
        break;
      case "46":
        kmlFilepath =
          filePath +
          "46.kml?alt=media&token=886bbdd0-87a2-4d12-a8f0-049b25e705f9";
        break;
      case "47":
        kmlFilepath =
          filePath +
          "47.kml?alt=media&token=f38662c9-6463-4876-af05-73b42409893f";
        break;
      case "48":
        kmlFilepath =
          filePath +
          "48.kml?alt=media&token=5e033028-ff5e-40d5-972f-1f28ff3ea207";
        break;
      case "49":
        kmlFilepath =
          filePath +
          "49.kml?alt=media&token=69fb67f1-c219-44d3-b304-e8525ef70f67";
        break;
      case "50":
        kmlFilepath =
          filePath +
          "50.kml?alt=media&token=f2470061-ab4a-4c33-b143-ad008a00e57f";
        break;
      case "52":
        kmlFilepath =
          filePath +
          "52.kml?alt=media&token=fb7733f0-b617-4656-99f3-b982a784b1c6";
        break;
      case "53":
        kmlFilepath =
          filePath +
          "53.kml?alt=media&token=1781f9c4-54ae-46ae-891b-dee9fac574c6";
        break;
      case "54":
        kmlFilepath =
          filePath +
          "54.kml?alt=media&token=8cd7a230-1160-44fb-9af7-5bee0aa8d648";
        break;
      case "mkt1":
        kmlFilepath =
          filePath +
          "mkt1.kml?alt=media&token=4f453f98-6091-43c6-bdb4-35cb020a0616";
        break;
      case "mkt2":
        kmlFilepath =
          filePath +
          "mkt2.kml?alt=media&token=05bcedf9-0f1f-4016-b9d4-c6d42f24049f";
        break;
      case "mkt2":
        kmlFilepath =
          filePath +
          "mkt2.kml?alt=media&token=05bcedf9-0f1f-4016-b9d4-c6d42f24049f";
        break;
      default:
        kmlFilepath = "";
    }

    return kmlFilepath;
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
    let userKey = localStorage.getItem("userKey");
    if (userKey != null) {
      let User = this.fsDb
        .object("Users/" + userKey + "/expiryDate")
        .valueChanges()
        .subscribe((data) => {
          User.unsubscribe();
          if (data != null) {
            if (new Date(this.setTodayDate()) >= new Date(data.toString())) {
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
        });
    }
  }

  chkUserPermission(pageName: any) {
    let userID = localStorage.getItem("userID");
    let userKey = localStorage.getItem("userKey");
    if (userKey != null) {
      let User = this.fsDb
        .object("Users/" + userKey + "/expiryDate")
        .valueChanges()
        .subscribe((data) => {
          User.unsubscribe();
          if (data != null) {
            if (new Date(this.setTodayDate()) >= new Date(data.toString())) {
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
        });
    }

    // if (userID != "0") {
    //  let userAccess = JSON.parse(localStorage.getItem("userAccess"));
    //  if (userAccess != null) {
    //    let userDetails = userAccess.find(item => item.name == pageName);
    //    if (userDetails == undefined) {
    //      this.router.navigate(['/home']);
    //    }
    //  }
    //}
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

  replaceAll(value: any, replaceFrom: any, replaceTo: any) {
    let returnValue = "";
    let valueList = value.split(replaceFrom);
    for (let i = 0; i < valueList.length; i++) {
      returnValue = returnValue + valueList[i] + replaceTo;
    }
    return returnValue;
  }

  chkUserPageAccess(pageURL: any, city: any) {
    //if (this.setTodayDate() != localStorage.getItem("loginDate")) {
    //  window.location.href = "/portal-access";
    //}
    let urlCity = pageURL.split("/")[pageURL.split("/").length - 3];
    if (city != urlCity) {
      let value = "/" + city + "/home";
      this.router.navigate([value], { replaceUrl: true });
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

  //#region  all local storage

  setLocalStorageData(newDb: any) {
    this.fsDb = newDb;
    this.setPortalPages();
    this.setWebPortalUsers();
    this.setZones(newDb);
    this.setFixedLoctions(newDb);
    this.setVehicle(newDb);
    this.setDustbin(newDb);
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

  //#endregion
}
