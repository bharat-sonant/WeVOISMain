import { Injectable } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AngularFirestore } from "@angular/fire/firestore";
import { FirebaseService } from "../../firebase.service";
import { HttpClient } from "@angular/common/http";
import * as CryptoJS from 'crypto-js';
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: "root",
})
export class CommonService {
  constructor(private router: Router, private storage: AngularFireStorage, public dbFireStore: AngularFirestore, public fs: FirebaseService, private toastr: ToastrService, public httpService: HttpClient) { }

  notificationInterval: any;
  fsDb: any;
  zoneKML: any;
  map: any;
  wardBoundary: any;
  polylines = [];
  fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";


  setTodayDate() {
    let d = new Date();
    let month = d.getMonth() + 1;
    let day = d.getDate();
    return (d.getFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day);
  }

  getCityName(city: any) {
    let cityName = city;
    let cityList = JSON.parse(localStorage.getItem("cityList"));
    let detail = cityList.find(item => item.city == city);
    if (detail != undefined) {
      cityName = detail.name;
    }
    return cityName;
  }

  getDateWithDate(d: any) {
    let month = d.getMonth() + 1;
    let day = d.getDate();
    return (d.getFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day);
  }

  getDate(day: any, month: any, year: any) {
    return (year + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day);
  }

  getTodayDateTime() {
    let d = new Date();
    let month = d.getMonth() + 1;
    let day = d.getDate();
    let hour = d.getHours();
    let min = d.getMinutes();
    return (d.getFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + (day < 10 ? "0" : "") + day + " " + (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min);
  }

  getDaysBetweenDates(date1: any, date2: any) {
    let Difference_In_Time = new Date(date2.toString()).getTime() - new Date(date1.toString()).getTime();
    return Difference_In_Time / (1000 * 3600 * 24);
  }

  getNextDate(currentDate: any, addDay: any) {
    if (addDay == 0) {
      return currentDate;
    }
    let year = currentDate.split('-')[0];
    let month = Number(currentDate.split('-')[1]);
    let day = Number(currentDate.split('-')[2]);
    let newMonth = "";
    let days = new Date(Number(year), Number(month), 0).getDate();
    if (days == day) {
      day = 0;
      if (month == 12) {
        month = 1;
        year = Number(year) + 1;
      }
      else {
        month++;
      }
    }
    let nextday = day + addDay;
    if (nextday.toString().length == 1) {
      nextday = "0" + nextday;
    }
    if (month.toString().length == 1) {
      newMonth = "0" + month.toString();
    }
    else {
      newMonth = month.toString();
    }
    return year + "-" + newMonth + "-" + nextday;
  }

  getPreviousDate(currentDate: any, addDay: any) {
    let year = currentDate.split('-')[0];
    let month = Number(currentDate.split('-')[1]);
    let day = Number(currentDate.split('-')[2]);
    let newMonth = "";
    let nextday = "";
    if (day == 1) {
      if (month == 1) {
        month = 12;
        year = year - 1;
      }
      else {
        month--;
      }
      let days = new Date(Number(year), Number(month), 0).getDate();
      day = days + 1;
    }
    day = day - addDay;
    if (day.toString().length == 1) {
      nextday = "0" + day;
    }
    else {
      nextday = day.toString();
    }
    if (month.toString().length == 1) {
      newMonth = "0" + month.toString();
    }
    else {
      newMonth = month.toString();
    }
    return year + "-" + newMonth + "-" + nextday;
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


  getDefaultCardPrefix() {
    let cardPrefix = "";
    let cityName = localStorage.getItem("cityName");
    if (cityName == "test") {
      cardPrefix = "TEST";
    }
    else if (cityName == "jaipur-test") {
      cardPrefix = "JPT";
    }
    else if (cityName == "jaipur-office") {
      cardPrefix = "TEST";
    }
    else if (cityName == "jaipur") {
      cardPrefix = "TEST";
    }
    else if (cityName == "sikar") {
      cardPrefix = "SIKA";
    }
    else if (cityName == "sikar-survey") {
      cardPrefix = "SIKA";
    }
    else if (cityName == "reengus") {
      cardPrefix = "RENA";
    }
    else if (cityName == "kishangarh") {
      cardPrefix = "KNGH";
    }
    else if (cityName == "salasar") {
      cardPrefix = "SALA";
    }
    else if (cityName == "jaipur-malviyanagar") {
      cardPrefix = "MNZ";
    }
    else if (cityName == "mnz-test") {
      cardPrefix = "MNZ";
    }
    else if (cityName == "jaipur-murlipura") {
      cardPrefix = "MPZ";
    }
    else if (cityName == "mpz-test") {
      cardPrefix = "MPZ";
    }
    else if (cityName == "wevois-others") {
      cardPrefix = "WEVO";
    }
    else if (cityName == "tonk") {
      cardPrefix = "TONK";
    }
    else if (cityName == "ratangarh") {
      cardPrefix = "RATG";
    }
    else if (cityName == "nokha") {
      cardPrefix = "NKH";
    }
    else if (cityName == "losal") {
      cardPrefix = "LSA";
    }
    else if (cityName == "jammu-survey") {
      cardPrefix = "JAM";
    }
    else if (cityName == "khandela") {
      cardPrefix = "KHL";
    }
    else if (cityName == "dehradun") {
      cardPrefix = "DEH";
    }
    else if (cityName == "pali") {
      cardPrefix = "PAL";
    }
    else if (cityName == "sujangarh") {
      cardPrefix = "SUG";
    }
    else if (cityName == "noida") {
      cardPrefix = "NOI";
    }
    else if (cityName == "jodhpur") {
      cardPrefix = "JODH";
    }
    else if (cityName == "kuchaman") {
      cardPrefix = "KUMN";
    }
    else if (cityName == "jodhpur-bwg") {
      cardPrefix = "JODBWG";
    }
    else if (cityName == "chirawa") {
      cardPrefix = "CHI";
    }
    else if (cityName == "tonk-raj") {
      cardPrefix = "TONR";
    }
    else if (cityName == "jaipur-bwg") {
      cardPrefix = "JAIBWG";
    }
    else if (cityName == "etmadpur") {
      cardPrefix = "ETM";
    }
    else if (cityName == "bharatpur") {
      cardPrefix = "BHA";
    }
    else if (cityName == "uniara") {
      cardPrefix = "UNI";
    }
    else if (cityName == "sujalpur") {
      cardPrefix = "SUJ";
    }
    else if (cityName == "ajmer") {
      cardPrefix = "AJM";
    }
    else if (cityName == "rajsamand") {
      cardPrefix = "RAJ";
    }
    else if (cityName == "sultanpur") {
      cardPrefix = "SUL";
    }
    else if (cityName == "khairabad") {
      cardPrefix = "KHAI";
    }
    else if (cityName == "sanchore") {
      cardPrefix = "SAN";
    }
    else if (cityName == "jaipur-civil-line") {
      cardPrefix = "JAIC";
    }
    else if (cityName == "jaipur-kishanpole") {
      cardPrefix = "JAIK";
    }
    else if (cityName == "jaunpur") {
      cardPrefix = "JAUN";
    }
    else if (cityName == "mapusa-goa") {
      cardPrefix = "MAP";
    }
    else if (cityName == "chennai") {
      cardPrefix = "CHE";
    }
    else if (cityName == "dausa") {
      cardPrefix = "DAU";
    }
    else if (cityName == "dei-bundi") {
      cardPrefix = "DEI";
    }
    else if (cityName == "biofics-surat") {
      cardPrefix = "BIO";
    }
    return cardPrefix;
  }

  getDefaultCityLatLng() {
    let latLng = [];
    let cityName = localStorage.getItem("cityName");
    if (cityName == "jaipur-greater") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "test") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-test") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-office") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "sikar") {
      latLng.push({ lat: 27.616270, lng: 75.152443 });
    }
    else if (cityName == "sikar-survey") {
      latLng.push({ lat: 27.616270, lng: 75.152443 });
    }
    else if (cityName == "reengus") {
      latLng.push({ lat: 27.369301, lng: 75.566200 });
    }
    else if (cityName == "kishangarh") {
      latLng.push({ lat: 26.5948983, lng: 74.8162661 });
    }
    else if (cityName == "salasar") {
      latLng.push({ lat: 27.7186438, lng: 74.7206506 });
    }
    else if (cityName == "jaipur-jagatpura") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-jhotwara") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-malviyanagar") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "mnz-test") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-mansarovar") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-murlipura") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "mpz-test") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-sanganer") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "jaipur-vidhyadhar") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "wevois-others") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "tonk") {
      latLng.push({ lat: 26.165516, lng: 75.779292 });
    }
    else if (cityName == "ratangarh") {
      latLng.push({ lat: 28.074173, lng: 74.595064 });
    }
    else if (cityName == "nokha") {
      latLng.push({ lat: 27.55713, lng: 73.4700985 });
    }
    else if (cityName == "losal") {
      latLng.push({ lat: 27.3966561, lng: 74.9193112 });
    }
    else if (cityName == "jammu-survey") {
      latLng.push({ lat: 32.7346044, lng: 74.8570259 });
    }
    else if (cityName == "khandela") {
      latLng.push({ lat: 27.6041575, lng: 75.4998704 });
    }
    else if (cityName == "dehradun") {
      latLng.push({ lat: 30.3164945, lng: 78.0321918 });
    }
    else if (cityName == "pali") {
      latLng.push({ lat: 25.7794331, lng: 73.3779516 });
    }
    else if (cityName == "sujangarh") {
      latLng.push({ lat: 27.7066465, lng: 74.4631898 });
    }
    else if (cityName == "noida") {
      latLng.push({ lat: 28.5433155, lng: 77.3640599 });
    }
    else if (cityName == "jodhpur") {
      latLng.push({ lat: 26.2405459, lng: 73.0197328 });
    }
    else if (cityName == "kuchaman") {
      latLng.push({ lat: 27.150367, lng: 74.85469 });
    }
    else if (cityName == "jodhpur-bwg") {
      latLng.push({ lat: 26.2405459, lng: 73.0197328 });
    }
    else if (cityName == "chirawa") {
      latLng.push({ lat: 28.2421284, lng: 75.6382847 });
    }
    else if (cityName == "nawa") {
      latLng.push({ lat: 27.02355529, lng: 75.0051479 });
    }
    else if (cityName == "nawa") {
      latLng.push({ lat: 27.02355529, lng: 75.0051479 });
    }
    else if (cityName == "sonipat") {
      latLng.push({ lat: 28.99438060, lng: 77.0191231 });
    }
    else if (cityName == "iit-roorkee") {
      latLng.push({ lat: 29.86603638, lng: 77.89051172 });
    }
    else if (cityName == "tonk-raj") {
      latLng.push({ lat: 26.165516, lng: 75.779292 });
    }
    else if (cityName == "jaipur-bwg") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "bharatpur") {
      latLng.push({ lat: 27.214840, lng: 77.5002347 });
    }
    else if (cityName == "etmadpur") {
      latLng.push({ lat: 27.2547723, lng: 78.1590455 });
    }
    else if (cityName == "ajmer") {
      latLng.push({ lat: 26.4497603, lng: 74.638332 });
    }
    else if (cityName == "sujalpur") {
      latLng.push({ lat: 23.3941437, lng: 76.7070692 });
    }
    else if (cityName == "uniara") {
      latLng.push({ lat: 25.9190125, lng: 76.0210168 });
    }
    else if (cityName == "rajsamand") {
      latLng.push({ lat: 25.070579, lng: 73.8750379 });
    }
    else if (cityName == "sultanpur") {
      latLng.push({ lat: 25.2872046, lng: 76.0210168 });
    }
    else if (cityName == "khairabad") {
      latLng.push({ lat: 24.6568575, lng: 75.9264164 });
    }
    else if (cityName == "sanchore") {
      latLng.push({ lat: 24.749691, lng: 71.7724481 });
    }
    else if (cityName == "jaipur-civil-line") {
      latLng.push({ lat: 26.908028, lng: 75.7782204 });
    }
    else if (cityName == "jaipur-kishanpole") {
      latLng.push({ lat: 26.9204252, lng: 75.8110759 });
    }
    else if (cityName == "jaunpur") {
      latLng.push({ lat: 25.7462391, lng: 82.6760959 });
    }
    else if (cityName == "mapusa-goa") {
      latLng.push({ lat: 15.5908594, lng: 73.8086133 });
    }
    else if (cityName == "ecogram") {
      latLng.push({ lat: 13.1836585, lng: 77.569515 });
    }
    else if (cityName == "jaipur-textile-recycling-facility") {
      latLng.push({ lat: 26.912434, lng: 75.787270 });
    }
    else if (cityName == "chennai") {
      latLng.push({ lat: 13.0841297, lng: 80.2680208 });
    }
    else if (cityName == "dausa") {
      latLng.push({ lat: 26.9006581, lng: 76.3283162 });
    }
    else if (cityName == "dei-bundi") {
      latLng.push({ lat: 25.6761984, lng: 75.9133425 });
    }
    else if (cityName == "biofics-surat") {
      latLng.push({ lat: 21.1544467, lng: 72.8075473 });
    }
    return latLng;
  }

  initMapProperties() {
    let latLng = this.getDefaultCityLatLng();
    var mapProp = {
      center: new google.maps.LatLng(Number(latLng[0]["lat"]), Number(latLng[0]["lng"])),
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      backgroundColor: "none",
      mapTypeControl: true,
      fullscreenControl: false,
      streetViewControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,

    };

    return mapProp;
  }

  initMapPropertiesDefault() {
    let latLng = this.getDefaultCityLatLng();
    var mapProp = {
      center: new google.maps.LatLng(Number(latLng[0]["lat"]), Number(latLng[0]["lng"])),
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
    let latLng = this.getDefaultCityLatLng();
    var mapProp = {
      center: new google.maps.LatLng(Number(latLng[0]["lat"]), Number(latLng[0]["lng"])),
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
    let latLng = this.getDefaultCityLatLng();
    var mapProp = {
      center: new google.maps.LatLng(Number(latLng[0]["lat"]), Number(latLng[0]["lng"])),
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
    let latLng = this.getDefaultCityLatLng();
    var mapProp = {
      center: new google.maps.LatLng(Number(latLng[0]["lat"]), Number(latLng[0]["lng"])),
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


  getMonthShortNameToMonth(monthName: string) {
    var d = new Date();
    var month = new Array();
    month["Jan"] = "01";
    month["Feb"] = "02";
    month["Mar"] = "03";
    month["Apr"] = "04";
    month["May"] = "05";
    month["Jun"] = "06";
    month["Jul"] = "07";
    month["Aug"] = "08";
    month["Sep"] = "09";
    month["Oct"] = "10";
    month["Nov"] = "11";
    month["Dec"] = "12";
    if (monthName != undefined) {
      return month[monthName];
    }
  }

  getDateConvert(value: any) {
    let list = value.split(' ');
    let day = list[0];
    let monthName = list[1];
    let year = list[2];
    let month = "00"
    if (monthName == "Jan") {
      month = "01";
    }
    else if (monthName == "Feb") {
      month = "02";
    }
    else if (monthName == "Mar") {
      month = "03";
    }
    else if (monthName == "Apr") {
      month = "04";
    }
    else if (monthName == "May") {
      month = "05";
    }
    else if (monthName == "Jun") {
      month = "06";
    }
    else if (monthName == "Jul") {
      month = "07";
    }
    else if (monthName == "Aug") {
      month = "08";
    }
    else if (monthName == "Sep") {
      month = "09";
    }
    else if (monthName == "Oct") {
      month = "10";
    }
    else if (monthName == "Nov") {
      month = "11";
    }
    else if (monthName == "Dec") {
      month = "12";
    }

    return year + "-" + month + "-" + day;

  }

  getCurrentMonthShortName(monthNumber: number) {
    var d = new Date();
    var month = new Array();
    month[1] = "Jan";
    month[2] = "Feb";
    month[3] = "Mar";
    month[4] = "Apr";
    month[5] = "May";
    month[6] = "Jun";
    month[7] = "Jul";
    month[8] = "Aug";
    month[9] = "Sep";
    month[10] = "Oct";
    month[11] = "Nov";
    month[12] = "Dec";
    if (monthNumber != undefined) {
      return month[monthNumber];
    } else {
      return month[d.getMonth()];
    }
  }

  tConvert(time: any) {
    // Check correct time format and split into components
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

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
    return ((parseFloat(minutes) / 60).toFixed(2).split(".")[0] + " hr " + (parseFloat((parseFloat(minutes) / 60).toFixed(2).split(".")[1]) * 60).toString().slice(0, 2) + " min");
  }

  getDiffrernceHrMin(dt2: Date, dt1: Date) {

    let diff = (dt2.getTime() - dt1.getTime());
    let minutes = Math.floor((diff / (1000 * 60)) % 60);
    let hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    return ((hours < 10) ? "0" + hours : hours) + " hr " + ((minutes < 10) ? " 0" + minutes : minutes) + " min";
  }

  getCurrentTime() {
    return (new Date().toTimeString().split(" ")[0].split(":")[0] + ":" + new Date().toTimeString().split(" ")[0].split(":")[1]);
  }

  getCurrentTimeWithSecond() {
    let date = new Date();
    let hour = date.getHours();
    let min = date.getMinutes();
    let second = date.getSeconds();
    return (hour < 10 ? "0" : "") + hour + ":" + (min < 10 ? "0" : "") + min + ":" + (second < 10 ? "0" : "") + second;
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
      let employeeData = employeeList.find((item) => item.userName == employeeId && item.city == localStorage.getItem("cityName"));
      if (employeeData == undefined) {
        this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
        let employeeDbPath = "Employees/" + employeeId + "/GeneralDetails";
        let employee = this.fsDb.object(employeeDbPath).valueChanges().subscribe((data) => {
          employee.unsubscribe();

          if (localStorage.getItem("designation") != null) {
            let designationList = JSON.parse(localStorage.getItem("designation"));
            let detail = designationList.find(item => item.designationId == data["designationId"]);
            if (detail != undefined) {
              employeeList.push({
                userName: data["userName"],
                name: data["name"],
                mobile: data["mobile"],
                profilePhotoURL: data["profilePhotoURL"],
                designation: detail.designation,
                city: localStorage.getItem("cityName"),
                empCode: data["empCode"]
              });
              employeeList = this.transformNumeric(employeeList, "empCode");
              localStorage.setItem("employeeList", JSON.stringify(employeeList));
              let list = JSON.parse(localStorage.getItem("employeeList"));
              let employeeData = list.find((item) => item.userName == employeeId);
              resolve(employeeData);
            }
          }

        });
      } else {
        resolve(employeeData);
      }
    });
  }

  getPortalUserDetailById(userId: string) {
    return new Promise((resolve) => {
      let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
      if (userList == null) {
        userList = [];
      }
      let userData = userList.find((item) => item.userId == userId);
      resolve(userData);
    });
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
    let pageDetails = accessList.find((item) => item.pageId == pageId && item.city == city);
    if (pageDetails == undefined) {
      let value = "/" + city + "/home";
      this.router.navigate([value], { replaceUrl: true });
    }
  }

  getFireStoreCity() {
    let storageCityName = "";
    let cityName = localStorage.getItem("cityName");
    if (cityName == "jaipur-test") {
      storageCityName = "Nokha";
    }
    else {
      let cityList = JSON.parse(localStorage.getItem("cityList"));
      let detail = cityList.find(item => item.city == cityName);
      if (detail != undefined) {
        storageCityName = detail.storagePath;
      }
    }
    return storageCityName;
  }


  //#region  all local storage

  setLocalStorageData(newDb: any) {
    this.fsDb = newDb;
    this.setWardForLineWeitage();
    this.setDesignation();
    this.setZones();
    this.setFixedLoctions(newDb);
    this.setVehicle(newDb);
    this.setDustbin(newDb);
    this.setMarkerZone();
    this.setMarkingWards();
    this.setAllDepartments();
    this.setAllZones(newDb)
  }

  setDesignation() {
    const path = this.fireStoragePath + "Common%2FDesignations.json?alt=media";
    let Instance = this.httpService.get(path).subscribe(dataDate => {
      Instance.unsubscribe();
      let designationList = [];
      let list = JSON.parse(JSON.stringify(dataDate));
      for (let i = 1; i < list.length; i++) {
        if (list[i] != null) {
          let designationId = i;
          let deptId = list[i]["deptId"];
          let designation = list[i]["name"];
          designationList.push({ designationId: designationId, designation: designation, departmentId: deptId });
          designationList = this.transformNumeric(designationList, "designation");
        }
      }
      localStorage.setItem("designation", JSON.stringify(designationList));
    });
  }
  setAllDepartments = async () => {

    const path = this.fireStoragePath + "Common%2FDepartments.json?alt=media";
    let departmentInstance = this.httpService.get(path).subscribe(data => {
      departmentInstance.unsubscribe();
      let departmentList = [];
      let list = JSON.parse(JSON.stringify(data))
      for (let i = 1; i < list.length; i++) {
        if (list[i] != null) {
          let id = list[i]["id"];
          let name = list[i]["name"];
          departmentList.push({ id: id, name: name, });
          departmentList = this.transformNumeric(departmentList, "name");
        }
      }
      localStorage.setItem("department", JSON.stringify(departmentList));
    });
  }

  setMarkerZone() {
    let zoneList = [];
    let wardCheckList = [];
    if (localStorage.getItem("cityName") == "sikar") {
      wardCheckList.push({ wardNo: "1" });
      wardCheckList.push({ wardNo: "2" });
      wardCheckList.push({ wardNo: "3" });
      wardCheckList.push({ wardNo: "4" });
      wardCheckList.push({ wardNo: "30" });
      wardCheckList.push({ wardNo: "31" });
    }
    const path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FCircleWiseWards.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            if (index == "Circle1") {
              let circleDataList = data[index];
              if (circleDataList.length > 0) {
                for (let j = 1; j < circleDataList.length; j++) {
                  if (circleDataList[j] != null) {
                    let zoneNo = circleDataList[j];
                    let zoneName = circleDataList[j];
                    if (zoneNo != undefined) {
                      if (zoneNo.toString().includes("mkt1")) {
                        zoneName = "Market 1";
                      } else if (zoneNo.toString().includes("mkt2")) {
                        zoneName = "Market 2";
                      } else if (zoneNo.toString().includes("mkt3")) {
                        zoneName = "Market 3";
                      } else if (zoneNo.toString().includes("mkt4")) {
                        zoneName = "Market 4";
                      } else {
                        if (localStorage.getItem("cityName") == 'kishangarh' || data[index].toString() == "60") {
                          zoneName = "Zone 60";
                        }
                        else {
                          zoneName = "Zone " + zoneNo;
                        }
                        zoneName = "Zone " + zoneNo;
                      }
                      let wardDetail = wardCheckList.find(item => item.wardNo == zoneNo);
                      if (wardDetail == undefined) {
                        zoneList.push({ zoneNo: zoneNo, zoneName: zoneName });
                      }
                    }

                  }
                }
              }
            }
          }
          localStorage.setItem("markerZone", JSON.stringify(zoneList));
        }
        localStorage.setItem("markerZone", JSON.stringify(zoneList));
      }
      else {
        localStorage.setItem("markerZone", JSON.stringify(zoneList));
      }
    });
  }

  setFixedLoctions(newDb: any) {
    let fixedLocation = [];
    let dbLocationPath = "Defaults/GeoLocations/FixedLocations";
    let locationDetail = newDb.list(dbLocationPath).valueChanges().subscribe((locationPath) => {
      locationDetail.unsubscribe();
      if (locationPath.length > 0) {
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
      }
      else {
        localStorage.setItem("fixedLocation", JSON.stringify(fixedLocation));
      }
    });
  }

  setVehicle(newDb: any) {
    let vehicleList = [];
    let dbPath = "Vehicles";
    let vehicleInstance = newDb.object(dbPath).valueChanges().subscribe((vehicle) => {
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
      else {
        localStorage.setItem("vehicle", JSON.stringify(vehicleList));
      }
    });
  }

  setDustbin(newDb: any) {
    let dustbinList = [];
    let openDepotList = [];
    let allDustbinList = [];
    let dbPath = "DustbinData/DustbinDetails";
    let dustbinInstance = newDb.object(dbPath).valueChanges().subscribe((dustbin) => {
      dustbinInstance.unsubscribe();
      if (dustbin != null) {
        let keyArrray = Object.keys(dustbin);
        if (keyArrray.length > 0) {
          for (let i = 0; i < keyArrray.length; i++) {
            let index = keyArrray[i];
            if (dustbin[index]["lat"] != null) {
              let pickFrequency = 0;
              let isDisabled = "no";
              let disabledBy = "";
              let isBroken = false;
              let disabledDate = "";
              if (dustbin[index]["pickFrequency"] != null) {
                pickFrequency = Number(dustbin[index]["pickFrequency"]);
              }
              if (dustbin[index]["isDisabled"] != null) {
                isDisabled = dustbin[index]["isDisabled"];
              }
              if (dustbin[index]["isBroken"] != null) {
                isBroken = dustbin[index]["isBroken"];
              }
              if (dustbin[index]["disabledBy"] != null) {
                disabledBy = dustbin[index]["disabledBy"];
              }
              if (dustbin[index]["disabledDate"] != null) {
                disabledDate = dustbin[index]["disabledDate"];
              }
              if (dustbin[index]["dustbinType"] != null) {
                allDustbinList.push({
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
                  disabledBy: disabledBy,
                  disabledDate: disabledDate
                });
                if (dustbin[index]["dustbinType"] == "Open Depot") {
                  openDepotList.push({
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
                    disabledBy: disabledBy,
                    disabledDate: disabledDate
                  });
                }
                else {
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
                    disabledBy: disabledBy,
                    disabledDate: disabledDate
                  });
                }

              }
              else {
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
                  disabledBy: disabledBy,
                  disabledDate: disabledDate
                });
              }
            }
            else {
              newDb.object(dbPath + "/" + index).remove();
            }
          }
        }
        localStorage.setItem("dustbin", JSON.stringify(dustbinList));
        localStorage.setItem("openDepot", JSON.stringify(openDepotList));
        localStorage.setItem("allDustbin", JSON.stringify(allDustbinList));
      }
      else {
        localStorage.setItem("dustbin", JSON.stringify(dustbinList));
        localStorage.setItem("openDepot", JSON.stringify(openDepotList));
        localStorage.setItem("allDustbin", JSON.stringify(allDustbinList));
      }
    });
  }

  setAllZones(newDb: any) {
    let zoneList = [];
    let hiddenList = [{ zone: "Beed-Tractor" }, { zone: "BinLifting" }, { zone: "Commercial" }, { zone: "Compactor" }, { zone: "FixedWages" }, { zone: "GarageWork" }, { zone: "GeelaKachra" }, { zone: "Maint" }, { zone: "Market" }, { zone: "SegregationWork" }, { zone: "UIT" }, { zone: "WetWaste" }, { zone: "mkt" }, { zone: "QRT" }];
    zoneList.push({ zoneNo: "0", zoneName: "-- Select --" });
    let dbPath = "Tasks";
    let zoneInstance = newDb.object(dbPath).valueChanges().subscribe(data => {
      zoneInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        for (let i = 0; i < keyArray.length; i++) {
          let zone = keyArray[i];
          let detail = hiddenList.find(item => zone.toString().includes(item.zone.toString()));
          if (detail == undefined) {
            zoneList.push({ zoneNo: zone, zoneName: "Zone " + zone });
          }
        }
      }
      localStorage.setItem("allZoneList", JSON.stringify(zoneList));
    })
  }

  setMarkingWards() {
    let markingWards = [];
    markingWards.push({ zoneNo: "0", zoneName: "-- Select --" });
    let cityName = localStorage.getItem("cityName");
    let path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FAvailableWard.json?alt=media";
    if (cityName == "jodhpur") {
      path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FMarkingWards.json?alt=media";
    }
    let markingWardInstance = this.httpService.get(path).subscribe(data => {
      markingWardInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));
      if (list.length > 0) {
        for (let index = 0; index < list.length; index++) {
          if (list[index] != null) {
            if (!list[index].toString().includes("Test") && list[index] != "OfficeWork" && list[index] != "FixedWages" && list[index] != "BinLifting" && list[index] != "GarageWork" && list[index] != "Compactor" && list[index] != "SegregationWork" && list[index] != "GeelaKachra" && list[index] != "SecondHelper" && list[index] != "ThirdHelper") {
              if (list[index].toString().includes("mkt")) {
                markingWards.push({ zoneNo: list[index], zoneName: "Market " + list[index].toString().replace("mkt", ""), });
              } else if (list[index].toString().includes("MarketRoute1")) {
                markingWards.push({ zoneNo: list[index], zoneName: "Market 1" });
              } else if (list[index].toString().includes("MarketRoute2")) {
                markingWards.push({ zoneNo: list[index], zoneName: "Market 2" });
              } else if (list[index].toString() == "WetWaste") {
                markingWards.push({ zoneNo: list[index], zoneName: "Wet 1" });
              } else if (list[index].toString() == "WetWaste1") {
                markingWards.push({ zoneNo: list[index], zoneName: "Wet 2" });
              } else if (list[index].toString() == "WetWaste2") {
                markingWards.push({ zoneNo: list[index], zoneName: "Wet 3" });
              } else if (list[index].toString() == "WetWaste4") {
                markingWards.push({ zoneNo: list[index], zoneName: "Wet 4" });
              } else if (list[index].toString() == "WetWaste5") {
                markingWards.push({ zoneNo: list[index], zoneName: "Wet 5" });
              } else if (list[index].toString() == "WetWaste6") {
                markingWards.push({ zoneNo: list[index], zoneName: "Wet 6" });
              } else if (list[index].toString() == "WetWaste7") {
                markingWards.push({ zoneNo: list[index], zoneName: "Wet 7" });
              } else if (list[index].toString() == "CompactorTracking1") {
                markingWards.push({ zoneNo: list[index], zoneName: "CompactorTracking1", });
              } else if (list[index].toString() == "CompactorTracking2") {
                markingWards.push({ zoneNo: list[index], zoneName: "CompactorTracking2", });
              } else if (list[index].toString().includes("Commercial") || list[index].toString().includes("Market")) {
                markingWards.push({ zoneNo: list[index], zoneName: data[index], });
              } else {
                if (cityName == 'kishangarh' && data[index].toString() == "60") {
                  markingWards.push({ zoneNo: data[index], zoneName: "Zone 58_60" });
                }
                else {
                  markingWards.push({ zoneNo: data[index], zoneName: "Zone " + data[index], });
                }
              }
            }
          }
        }
        localStorage.setItem("markingWards", JSON.stringify(markingWards));
      }
    }, error => {
      localStorage.setItem("markingWards", JSON.stringify(markingWards));
    });
  }

  getAllowMarkingWards() {
    return new Promise((resolve) => {
      let markingWards = [];
      markingWards.push({ zoneNo: "0", zoneName: "-- Select --" });
      let path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FAvailableWardForMarking.json?alt=media";
      let markingWardInstance = this.httpService.get(path).subscribe(data => {
        markingWardInstance.unsubscribe();
        let list = JSON.parse(JSON.stringify(data));
        if (list.length > 0) {
          for (let index = 0; index < list.length; index++) {
            if (list[index] != null) {
              markingWards.push({ zoneNo: data[index], zoneName: "Zone " + data[index], });
            }
          }
        }

        resolve(markingWards);
      }, error => {
        resolve(null);
      });
    });
  }

  setZones() {
    let letestZone = [];
    let cityName = localStorage.getItem("cityName");
    letestZone.push({ zoneNo: "0", zoneName: "-- Select --" });

    let path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FAvailableWard.json?alt=media";
    if (cityName == "Nokha") {
      path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FWards.json?alt=media";
    }
    let availableWardInstance = this.httpService.get(path).subscribe(data => {
      availableWardInstance.unsubscribe();
      let list = JSON.parse(JSON.stringify(data));

      if (list.length > 0) {
        for (let index = 0; index < list.length; index++) {
          if (list[index] != null) {
            if (!list[index].toString().includes("Test") && list[index] != "OfficeWork" && list[index] != "FixedWages" && list[index] != "BinLifting" && list[index] != "GarageWork" && list[index] != "Compactor" && list[index] != "SegregationWork" && list[index] != "GeelaKachra" && list[index] != "SecondHelper" && list[index] != "ThirdHelper") {
              if (list[index].toString().includes("mkt")) {
                letestZone.push({ zoneNo: list[index], zoneName: "Market " + list[index].toString().replace("mkt", ""), });
              } else if (list[index].toString().includes("MarketRoute1")) {
                letestZone.push({ zoneNo: list[index], zoneName: "Market 1" });
              } else if (list[index].toString().includes("MarketRoute2")) {
                letestZone.push({ zoneNo: list[index], zoneName: "Market 2" });
              } else if (list[index].toString() == "WetWaste") {
                letestZone.push({ zoneNo: list[index], zoneName: "Wet 1" });
              } else if (list[index].toString() == "WetWaste1") {
                letestZone.push({ zoneNo: list[index], zoneName: "Wet 2" });
              } else if (list[index].toString() == "WetWaste2") {
                letestZone.push({ zoneNo: list[index], zoneName: "Wet 3" });
              } else if (list[index].toString() == "WetWaste4") {
                letestZone.push({ zoneNo: list[index], zoneName: "Wet 4" });
              } else if (list[index].toString() == "WetWaste5") {
                letestZone.push({ zoneNo: list[index], zoneName: "Wet 5" });
              } else if (list[index].toString() == "WetWaste6") {
                letestZone.push({ zoneNo: list[index], zoneName: "Wet 6" });
              } else if (list[index].toString() == "WetWaste7") {
                letestZone.push({ zoneNo: list[index], zoneName: "Wet 7" });
              } else if (list[index].toString() == "CompactorTracking1") {
                letestZone.push({ zoneNo: list[index], zoneName: "CompactorTracking1", });
              } else if (list[index].toString() == "CompactorTracking2") {
                letestZone.push({ zoneNo: list[index], zoneName: "CompactorTracking2", });
              } else if (list[index].toString().includes("Commercial") || list[index].toString().includes("Market")) {
                letestZone.push({ zoneNo: list[index], zoneName: data[index], });
              } else {
                if (cityName == 'kishangarh' && data[index].toString() == "60") {
                  letestZone.push({ zoneNo: data[index], zoneName: "Zone 58_60" });
                }
                else {
                  letestZone.push({ zoneNo: data[index], zoneName: "Zone " + data[index], });
                }
              }
              //this.saveLocationHistory(data[index]);
            }
          }
        }
        localStorage.setItem("latest-zones", JSON.stringify(letestZone));
      }
    }, error => {
      localStorage.setItem("latest-zones", JSON.stringify(letestZone));
    });
  }

  saveLocationHistory(zone: any) {
    let preDate = this.getPreviousDate(this.setTodayDate(), 1);
    let path = "LocationHistory/" + zone + "/" + preDate.split("-")[0] + "/" + this.getCurrentMonthName(Number(preDate.split("-")[1]) - 1) + "/" + preDate;
    this.getStorageLocationHistory(path).then(response => {
      if (response["status"] == "Fail") {
        this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
        let locationInstance = this.fsDb.object(path).valueChanges().subscribe(
          locationData => {
            locationInstance.unsubscribe();
            if (locationData != null) {
              this.saveJsonFile(locationData, "route.json", "/" + path + "/");
            }
          });
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

  getWardBoundary(zoneNo: any, zoneKML: any, strokeWeight: any) {
    return new Promise((resolve) => {
      let polylines = [];
      let cityName = localStorage.getItem("cityName");
      if (cityName == "jaipur-office") {
        cityName = "jaipur"
      }
      this.httpService.get("../../assets/jsons/WardBoundries/" + cityName + "/" + zoneNo + ".json").subscribe(data => {
        if (zoneKML != undefined) {
          zoneKML[0]["line"].setMap(null);
        }
        if (data != null) {
          //let str = "";
          let points = data["points"];
          if (points.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            var latLng = [];
            for (let j = 0; j < points.length; j++) {
              latLng.push({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
              bounds.extend({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
              // str += points[j][1] + "," + points[j][0] + ",0 ";
            }
            // console.log(str);
            let line = new google.maps.Polyline({
              path: latLng,
              strokeColor: "black",
              strokeWeight: strokeWeight,
            });
            polylines.push({ line: line, latLng: latLng });
            resolve(polylines);
          }
        }
      });

    });
  }

  setMapHeight() {
    $(".navbar-toggler").show();
    $("#divMap").css("height", $(window).height() - 80);
  }

  setMap(gmap: any) {
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

  setMapById(mapId: any) {
    let mapProp = this.mapForHaltReport();
    return new google.maps.Map(
      document.getElementById(mapId),
      mapProp
    );
  }

  //#endregion

  //#region  local json


  getWardLineLength(wardNo: any) {
    return new Promise((resolve) => {
      let lineLengthList = [];
      let cityName = localStorage.getItem("cityName");
      if (cityName == "jaipur-office") {
        cityName = "jaipur"
      }
      this.httpService.get("../../assets/jsons/WardLineLength/" + cityName + "/" + wardNo + ".json").subscribe(data => {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (data[index] != null) {
                lineLengthList.push({ lineNo: index, length: data[index] });
              }
            }
          }
          resolve(JSON.stringify(lineLengthList));
        }
      });
    });
  }

  getCategory() {
    return new Promise((resolve) => {
      this.httpService.get("../../assets/jsons/Common/Category.json").subscribe(data => {
        let categoryList = [];
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              categoryList.push({ id: index, optionType: data[index]["en"] });
            }
          }
          resolve(JSON.stringify(categoryList));
        }
      });
    });
  }

  getCircleWiseWard() {
    return new Promise((resolve) => {
      let cityName = localStorage.getItem("cityName");
      if (cityName == "jaipur-office") {
        cityName = "jaipur"
      }
      let circleList = [];
      this.httpService.get("../../assets/jsons/CircleWiseWard/" + cityName + ".json").subscribe(data => {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let circleName = keyArray[i];
              let wardList = data[circleName];
              circleList.push({ circleName: circleName, wardList: wardList });
            }
            resolve(JSON.stringify(circleList));
          }
        }
      });
    });
  }

  getZoneWiseWard() {
    return new Promise((resolve) => {
      let zoneList = [];
      let cityName = localStorage.getItem("cityName");
      this.httpService.get("../../assets/jsons/CircleWiseWard/" + cityName + ".json").subscribe(data => {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let zoneName = keyArray[i];
              let wardList = data[zoneName];
              zoneList.push({ zoneName: zoneName, wardList: wardList });
            }
            resolve(JSON.stringify(zoneList));
          }
        }
      });
    });
  }

  setWardBoundary(zoneNo: any, map: any) {
    return new Promise((resolve) => {
      let cityName = localStorage.getItem("cityName");
      if (cityName == "jaipur-office") {
        cityName = "jaipur"
      }
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FWardBoundryJson%2F" + zoneNo + ".json?alt=media";
      let fuelInstance = this.httpService.get(path).subscribe(data => {
        fuelInstance.unsubscribe();
        if (data != null) {
          let strokeWeight = 8;
          let points = data["points"];
          if (points.length > 0) {
            let bounds = new google.maps.LatLngBounds();
            var latLng = [];
            for (let j = 0; j < points.length; j++) {
              latLng.push({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
              bounds.extend({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
            }
            let line = new google.maps.Polyline({
              path: latLng,
              strokeColor: "black",
              strokeWeight: strokeWeight,
            });
            this.polylines[0] = line;
            this.polylines[0].setMap(map);
            map.fitBounds(bounds);
            resolve(this.polylines);
          }
        }
      });
    });
  }

  getJaipurGreaterWardBoundary(boundaryPath: any, boundary: any, strokeWeight: any) {
    return new Promise((resolve) => {
      let polylines = [];
      this.httpService.get(boundaryPath + ".json").subscribe(data => {
        if (boundary != undefined) {
          boundary[0]["line"].setMap(null);
        }
        if (data != null) {
          let points = data["points"];
          if (points.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            var latLng = [];
            for (let j = 0; j < points.length; j++) {
              latLng.push({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
              bounds.extend({ lat: Number(points[j][0]), lng: Number(points[j][1]) });
            }
            let line = new google.maps.Polyline({
              path: latLng,
              strokeColor: "black",
              strokeWeight: strokeWeight,
            });
            polylines.push({ line: line, latLng: latLng });
            resolve(polylines);
          }
        }
      });
    });
  }


  getWardLine(zoneNo: any, date: any) {
    return new Promise((resolve) => {
      let dat1 = new Date(date);
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLinesHouseJson%2F" + zoneNo + "%2FmapUpdateHistoryJson.json?alt=media";
      let jsonInstance = this.httpService.get(path).subscribe(dataDate => {
        jsonInstance.unsubscribe();
        let list = JSON.parse(JSON.stringify(dataDate));
        let jsonDate = "";
        if (list.length == 1) {
          jsonDate = list[0].toString().trim();
        }
        else {
          for (let i = list.length - 1; i >= 0; i--) {
            let dat2 = new Date(list[i]);
            if (dat1 >= dat2) {
              jsonDate = list[i].toString().trim();
              i = -1;
            }
          }
        }
        const pathDate = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLinesHouseJson%2F" + zoneNo + "%2F" + jsonDate + ".json?alt=media";
        let wardLineInstance = this.httpService.get(pathDate).subscribe(data => {
          wardLineInstance.unsubscribe();
          if (data != null) {
            resolve(JSON.stringify(data));
          }
        });
        /*
                this.httpService.get("../../assets/jsons/WardLines/" + localStorage.getItem("cityName") + "/" + zoneNo + "/" + jsonDate + ".json").subscribe(data => {
                  resolve(JSON.stringify(data));
                }, error => {
                  
                });
                */
      });
    });
  }


  getWardLineRoadDetail(zoneNo: any, date: any) {
    return new Promise((resolve) => {
      let dat1 = new Date(date);
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLinesHouseJson%2F" + zoneNo + "%2FmapUpdateHistoryJson.json?alt=media";
      let jsonInstance = this.httpService.get(path).subscribe(dataDate => {
        jsonInstance.unsubscribe();
        let list = JSON.parse(JSON.stringify(dataDate));
        let jsonDate = "";
        jsonDate = list[0].toString().trim();
        const pathDate = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLinesHouseJson%2F" + zoneNo + "%2F" + jsonDate + ".json?alt=media";
        let wardLineInstance = this.httpService.get(pathDate).subscribe(data => {
          wardLineInstance.unsubscribe();
          if (data != null) {
            resolve(JSON.stringify(data));
          }
        });
      });
    });
  }


  //#endregion


  getVTSUserDetailByUserId(userId: string) {
    return new Promise((resolve) => {
      let userList = JSON.parse(localStorage.getItem("vtsUserList"));
      if (userList == undefined) {
        userList = [];
      }

      let userData = userList.find((item) => item.userId == userId);
      if (userData == undefined) {
        this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
        let userDbPath = "WastebinMonitor/Users/" + userId;
        let userDataInstance = this.fsDb.object(userDbPath).valueChanges().subscribe((data) => {
          userDataInstance.unsubscribe();
          userList.push({ userId: userId, name: data["name"], email: data["email"] });
          localStorage.setItem("vtsUserList", JSON.stringify(userList));
          let list = JSON.parse(localStorage.getItem("vtsUserList"));
          let userData = list.find((item) => item.userId == userId);
          resolve(userData);
        });
      } else {
        resolve(userData);
      }
    });
  }


  getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6377830; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in metres
  }

  deg2rad(deg: any) {
    return deg * (Math.PI / 180)
  }


  getBVGUserById(userId: string) {
    return new Promise((resolve) => {
      let userList = JSON.parse(localStorage.getItem("bvgUserList"));
      if (userList == undefined) {
        userList = [];
      }
      let userData = userList.find((item) => item.userId == userId);
      if (userData == undefined) {
        this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
        let userDbPath = "WastebinMonitor/BVGUsers/" + userId + "/name";
        let user = this.fsDb.object(userDbPath).valueChanges().subscribe((data) => {
          user.unsubscribe();
          userList.push({
            userId: userId,
            name: data
          });
          localStorage.setItem("bvgUserList", JSON.stringify(userList));
          let list = JSON.parse(localStorage.getItem("bvgUserList"));
          let userData = list.find((item) => item.userId == userId);
          resolve(userData);

        });
      } else {
        resolve(userData);
      }
    });
  }

  checkInternetConnection() {
    return localStorage.getItem("isConnected");
  }

  getDefaultAllWards() {
    return new Promise((resolve) => {
      let allWardList = [];
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FAllWard.json?alt=media";
      let fuelInstance = this.httpService.get(path).subscribe(data => {
        fuelInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let circleDataList = data[index];
              if (circleDataList.length > 0) {
                for (let j = 1; j < circleDataList.length; j++) {
                  if (circleDataList[j] != null) {
                    allWardList.push({ circle: index, wardNo: circleDataList[j]["wardNo"], startDate: circleDataList[j]["startDate"], endDate: circleDataList[j]["endDate"], displayIndex: circleDataList[j]["displayIndex"] });
                  }
                }
              }
            }
            resolve(JSON.stringify(allWardList));
          }
        }
      });
    });

  }

  getCityWiseWard() {
    return new Promise((resolve) => {
      let allWardList = [];
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FDefaults%2FCircleWiseWards.json?alt=media";
      let fuelInstance = this.httpService.get(path).subscribe(data => {
        fuelInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let circleDataList = data[index];
              if (circleDataList.length > 0) {
                for (let j = 1; j < circleDataList.length; j++) {
                  if (circleDataList[j] != null) {
                    allWardList.push({ circle: index, wardNo: circleDataList[j] });
                  }
                }
              }
            }
            resolve(JSON.stringify(allWardList));
          }
        }
      });
    });
  }

  //The set method is use for encrypt the value.
  setEncrypt(keys, value) {
    var key = CryptoJS.enc.Utf8.parse(keys);
    var iv = CryptoJS.enc.Utf8.parse(keys);
    var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value.toString()), key,
      {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

    return encrypted.toString();
  }

  //The get method is use for decrypt the value.
  getEncrypt(keys, value) {
    var key = CryptoJS.enc.Utf8.parse(keys);
    var iv = CryptoJS.enc.Utf8.parse(keys);
    var decrypted = CryptoJS.AES.decrypt(value, key, {
      keySize: 128 / 8,
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  saveJsonFile(listArray: any, fileName: any, filePath: any) {
    return new Promise((resolve) => {

      let fireStorePath = this.fireStoragePath;
      var jsonFile = JSON.stringify(listArray);
      var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
      const path = this.getFireStoreCity() + filePath + fileName;

      //const ref = this.storage.ref(path);
      const ref = this.storage.storage.app.storage(fireStorePath).ref(path);
      var byteString;
      // write the bytes of the string to a typed array

      byteString = unescape(uri.split(",")[1]);
      var mimeString = uri
        .split(",")[0]
        .split(":")[1]
        .split(";")[0];

      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      let blob = new Blob([ia], { type: mimeString });
      const task = ref.put(blob);
      resolve(task);
    });
  }

  saveCommonJsonFile(listArray: any, fileName: any, filePath: any) {
    let fireStorePath = this.fireStoragePath;
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = filePath + fileName;

    //const ref = this.storage.ref(path);
    const ref = this.storage.storage.app.storage(fireStorePath).ref(path);
    var byteString;
    // write the bytes of the string to a typed array

    byteString = unescape(uri.split(",")[1]);
    var mimeString = uri
      .split(",")[0]
      .split(":")[1]
      .split(";")[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    let blob = new Blob([ia], { type: mimeString });
    const task = ref.put(blob);
  }

  getCarePrefix() {
    return new Promise((resolve) => {
      const path = this.fireStoragePath + "CityDetails%2FCityDetails.json?alt=media";
      let cityDataInstance = this.httpService.get(path).subscribe(cityData => {
        cityDataInstance.unsubscribe();
        if (cityData != null) {
          let cityList = JSON.parse(JSON.stringify(cityData));
          let detail = cityList.find(item => item.cityName == this.getFireStoreCity());
          if (detail != undefined) {
            resolve(detail.key);
          }
        }
      });
    });
  }

  getWardLineWeightage(zoneNo: any, date: any) {
    return new Promise((resolve) => {
      let lineList = [];
      this.getWardLine(zoneNo, date).then((linesData: any) => {
        let wardLinesDataObj = JSON.parse(linesData);
        let keyArray = Object.keys(wardLinesDataObj);
        for (let i = 0; i < keyArray.length - 3; i++) {
          let lineNo = Number(keyArray[i]);
          lineList.push({ lineNo: lineNo, weightage: 1, lineLength: wardLinesDataObj[lineNo]["lineLength"], points: wardLinesDataObj[lineNo]["points"] });
        }
        lineList.push({ totalLines: wardLinesDataObj["totalLines"] });
        this.getWardLineWeightageList(lineList, date, zoneNo).then((wardLineWeightageList: any) => {
          resolve(wardLineWeightageList);
        });
      });
    });
  }

  getWardLineWeightageList(lineWeightageList: any, date: any, zoneNo: any) {
    return new Promise((resolve) => {
      let dat1 = new Date(date);
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLineWeightageJson%2F" + zoneNo + "%2FweightageUpdateHistoryJson.json?alt=media";
      let jsonInstance = this.httpService.get(path).subscribe(dataDate => {
        jsonInstance.unsubscribe();
        if (dataDate == null) {
          resolve(lineWeightageList);
        }
        else {
          let list = JSON.parse(JSON.stringify(dataDate));
          let jsonDate = "";
          for (let i = list.length - 1; i >= 0; i--) {
            let dat2 = new Date(list[i]);
            if (dat1 >= dat2) {
              jsonDate = list[i].toString().trim();
              i = -1;
            }
          }
          if (jsonDate != "") {
            const pathDate = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLineWeightageJson%2F" + zoneNo + "%2F" + jsonDate + ".json?alt=media";
            let wardLineInstance = this.httpService.get(pathDate).subscribe(data => {
              wardLineInstance.unsubscribe();
              if (data != null) {
                let list = JSON.parse(JSON.stringify(data));
                for (let i = 0; i < list.length - 1; i++) {
                  let lineDetail = lineWeightageList.find(item => item.lineNo == list[i]["lineNo"]);
                  if (lineDetail != undefined) {
                    lineDetail.weightage = list[i]["weightage"];
                  }
                }
                resolve(lineWeightageList);
              }
            });
          }
          else {
            resolve(lineWeightageList);
          }
        }
      }, error => {
        resolve(lineWeightageList);
      });

    });
  }

  getWeightageUpdateHistoryJson(zoneNo: any) {
    return new Promise((resolve) => {
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLineWeightageJson%2F" + zoneNo + "%2FweightageUpdateHistoryJson.json?alt=media";
      let jsonInstance = this.httpService.get(path).subscribe(dataDate => {
        jsonInstance.unsubscribe();
        resolve(JSON.stringify(dataDate));
      }, error => {
        resolve(null);
      });
    });
  }

  getWardForLineWeitage() {
    return new Promise((resolve) => {
      let wardForWeightageList = [];
      const path = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLineWeightageJson%2FwardLineWeightageAllowed.json?alt=media";
      let jsonInstance = this.httpService.get(path).subscribe(dataDate => {
        jsonInstance.unsubscribe();
        if (dataDate != null) {
          let list = JSON.parse(JSON.stringify(dataDate));
          if (list.length > 0) {
            for (let i = 0; i < list.length; i++) {
              wardForWeightageList.push({ zoneNo: list[i].trim() });
            }
          }
        }
        resolve(wardForWeightageList);
      }, error => {
        resolve(wardForWeightageList);
      });
    });
  }

  setWardForLineWeitage() {
    let wardForWeightageList = [];
    const path = this.fireStoragePath + this.getFireStoreCity() + "%2FWardLineWeightageJson%2FwardLineWeightageAllowed.json?alt=media";
    let jsonInstance = this.httpService.get(path).subscribe(dataDate => {
      jsonInstance.unsubscribe();
      if (dataDate == null) {
        localStorage.setItem("wardForLineWeightage", JSON.stringify(wardForWeightageList));
      }
      else {
        let list = JSON.parse(JSON.stringify(dataDate));
        if (list.length > 0) {
          for (let i = 0; i < list.length; i++) {
            wardForWeightageList.push({ zoneNo: list[i].trim() });
          }
        }
        localStorage.setItem("wardForLineWeightage", JSON.stringify(wardForWeightageList));
      }
    }, error => {
      localStorage.setItem("wardForLineWeightage", JSON.stringify(wardForWeightageList));
    });
  }


  exportExcel(htmlString: any, fileName: any) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, fileName);
  }

  setDate(selectedDate: any, filterVal: any, type: string) {
    return new Promise((resolve) => {
      let newDate = "";
      if (type == 'current') {
        newDate = filterVal;
      } else if (type == 'next') {
        let nextDate = this.getNextDate(selectedDate, 1);
        newDate = nextDate;
      } else if (type == 'previous') {
        let previousDate = this.getPreviousDate(selectedDate, 1);
        newDate = previousDate;
      }
      if (new Date(newDate) > new Date(this.getNextDate(this.setTodayDate(), 1))) {
        newDate = selectedDate;
      }
      resolve(newDate);
    });
  }

  savePageLoadHistory(mainPage: any, pageName: any, userId: any) {
    this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    let date = this.setTodayDate();
    let year = date.split("-")[0];
    let monthName = this.getCurrentMonthName(Number(date.split('-')[1]) - 1);
    let dbPath = "PageLoadHistory/" + year + "/" + monthName + "/" + mainPage + "/" + pageName + "/" + date + "/" + userId;
    let pageHistoryInstance = this.fsDb.object(dbPath).valueChanges().subscribe((response) => {
      pageHistoryInstance.unsubscribe();
      let count = response === null ? 1 : (Number(response) + 1);
      this.fsDb.object(dbPath).set(count);
      dbPath = "PageLoadHistory/Summary/" + pageName;
      let summaryInstance = this.fsDb.object(dbPath).valueChanges().subscribe((respSummary) => {
        summaryInstance.unsubscribe();
        let summaryCount = respSummary === null ? 1 : (Number(respSummary) + 1);
        this.fsDb.object(dbPath).set(summaryCount);
      })
    });
  }

  getStorageLocationHistory(path: any) {
    return new Promise((resolve) => {
      path = this.fireStoragePath + this.getFireStoreCity() + "%2F" + path.toString().replaceAll("/", "%2F") + "%2Froute.json?alt=media";
      let Instance = this.httpService.get(path).subscribe(routeData => {
        Instance.unsubscribe();
        resolve({ status: "Success", data: routeData });
      }, error => {
        resolve({ status: "Fail", data: {} })
      });
    });

  }

  getStorageDailyWorkDetail(path: any) {
    return new Promise((resolve) => {
      path = this.fireStoragePath + this.getFireStoreCity() + "%2F" + path.toString().replaceAll("/", "%2F") + ".json?alt=media";
      let Instance = this.httpService.get(path).subscribe(workData => {
        Instance.unsubscribe();
        resolve({ status: "Success", data: workData });
      }, error => {
        resolve({ status: "Fail", data: {} })
      });
    });

  }

  checkSelectedCity(city: any) {
    if (city != localStorage.getItem("cityName")) {
      this.setAlertMessage("error", "Your Current City is " + localStorage.getItem("cityName") + " and selected city is " + city + ". Please refersh page !!!");
      return "no";
    }
    else {
      return "yes";
    }

  }
  convertDateWithMonthName = (date: string) => {
    if (date) {
      let splittedDateArray = date.split(' ')[0].split('-');
      let time = date.split(' ')[1];
      splittedDateArray[1] = this.getCurrentMonthShortName(Number(splittedDateArray[1]))
      let newDateString = (splittedDateArray.reverse().join(' ')).concat(time ? ` ${time}` : '')
      return newDateString;

    }
    return '';
  }


  checkImageExist(imagePath: any) {
    return new Promise((resolve) => {
      const ref = this.storage.storage.app.storage(this.fireStoragePath).ref(imagePath);
      ref.getDownloadURL()
        .then(() => resolve(true)).catch((error) => {
          if (error.code === 'storage/object-not-found') {
            resolve(false); // Image does not exist
          } else {
            console.error('Firebase error:', error);
            throw error; // Some other error
          }
        });

    });
  }
}
