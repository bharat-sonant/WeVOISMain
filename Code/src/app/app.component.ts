import { Component, ɵSWITCH_CHANGE_DETECTOR_REF_FACTORY__POST_R3__ } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Router } from '@angular/router';
//services

import { CommonService } from './services/common/common.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {

  getFireBase() {
    let city = localStorage.getItem('cityName');
    if (city == "sikar") {
      const firebase = {
        apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnavigator.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786"
      }
      return firebase;
    }
    else if(city == "reengus") {
      const firebase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdreengus.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      }
      return firebase;
    }
    else if(city == "jaipur") {
      const firebase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjaipur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      }
      return firebase;
    }
    else
    {
      const firebase = {
        apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
        authDomain: "dtdnavigatortesting.firebaseapp.com",
        databaseURL: "https://dtdnavigatortesting.firebaseio.com",
        projectId: "dtdnavigatortesting",
        storageBucket: "dtdnavigatortesting.appspot.com",
        messagingSenderId: "381118272786"
      }
      return firebase;
    }
  }


  zoneList = [
    { zoneNo: "0", zoneName: "-- Select --" },
    { zoneNo: "25", zoneName: "Ward 25" },
    { zoneNo: "26", zoneName: "Ward 26" },
    { zoneNo: "27", zoneName: "Ward 27" },
    { zoneNo: "28", zoneName: "Ward 28" },
    { zoneNo: "36", zoneName: "Ward 36" },
    { zoneNo: "37", zoneName: "Ward 37" },
    { zoneNo: "38", zoneName: "Ward 38" },
    { zoneNo: "39", zoneName: "Ward 39" },
    { zoneNo: "40", zoneName: "Ward 40" },
    { zoneNo: "41", zoneName: "Ward 41" },
    { zoneNo: "42", zoneName: "Ward 42" },
    { zoneNo: "43A", zoneName: "Ward 43A" },
    { zoneNo: "43B", zoneName: "Ward 43B" },
    { zoneNo: "44", zoneName: "Ward 44" }
    // { zoneNo: "1000", zoneName: "Ward 1000" }
  ];

  latestZone = [
    { zoneNo: "0", zoneName: "-- Select --" },
    { zoneNo: "1", zoneName: "Ward 1" },
    { zoneNo: "2", zoneName: "Ward 2" },
    { zoneNo: "3", zoneName: "Ward 3" },
    { zoneNo: "4", zoneName: "Ward 4" },
    { zoneNo: "5", zoneName: "Ward 5" },
    { zoneNo: "6", zoneName: "Ward 6" },
    { zoneNo: "7", zoneName: "Ward 7" },
    { zoneNo: "8", zoneName: "Ward 8" },
    { zoneNo: "9", zoneName: "Ward 9" },
    { zoneNo: "10", zoneName: "Ward 10" },
    { zoneNo: "11", zoneName: "Ward 11" },
    { zoneNo: "12", zoneName: "Ward 12" },
    { zoneNo: "13", zoneName: "Ward 13" },
    { zoneNo: "14", zoneName: "Ward 14" },
    { zoneNo: "15_16", zoneName: "Ward 15_16" },
    { zoneNo: "17", zoneName: "Ward 17" },
    { zoneNo: "18", zoneName: "Ward 18" },
    { zoneNo: "19", zoneName: "Ward 19" },
    { zoneNo: "20", zoneName: "Ward 20" },
    { zoneNo: "21", zoneName: "Ward 21" },
    { zoneNo: "22", zoneName: "Ward 22" },
    { zoneNo: "23", zoneName: "Ward 23" },
    { zoneNo: "24", zoneName: "Ward 24" },
    { zoneNo: "25", zoneName: "Ward 25" },
    { zoneNo: "26", zoneName: "Ward 26" },
    { zoneNo: "27", zoneName: "Ward 27" },
    { zoneNo: "28", zoneName: "Ward 28" },
    { zoneNo: "29", zoneName: "Ward 29" },
    { zoneNo: "30", zoneName: "Ward 30" },
    { zoneNo: "31", zoneName: "Ward 31" },
    { zoneNo: "32", zoneName: "Ward 32" },
    { zoneNo: "33", zoneName: "Ward 33" },
    { zoneNo: "34", zoneName: "Ward 34" },
    { zoneNo: "35", zoneName: "Ward 35" },
    { zoneNo: "36", zoneName: "Ward 36" },
    { zoneNo: "37", zoneName: "Ward 37" },
    { zoneNo: "38", zoneName: "Ward 38" },
    { zoneNo: "39", zoneName: "Ward 39" },
    { zoneNo: "40", zoneName: "Ward 40" },
    { zoneNo: "41", zoneName: "Ward 41" },
    { zoneNo: "42", zoneName: "Ward 42" },
    { zoneNo: "43", zoneName: "Ward 43" },
    { zoneNo: "44", zoneName: "Ward 44" },
    { zoneNo: "45", zoneName: "Ward 45" },
    { zoneNo: "47P2_46", zoneName: "Ward 47P2_46" },
    { zoneNo: "47P1_48", zoneName: "Ward 47P1_48" },
    { zoneNo: "49_51", zoneName: "Ward 49_51" },
    { zoneNo: "50", zoneName: "Ward 50" },
    // { zoneNo: "51", zoneName: "Ward 51" },
    { zoneNo: "52", zoneName: "Ward 52" },
    { zoneNo: "53", zoneName: "Ward 53" },
    { zoneNo: "54", zoneName: "Ward 54" },
    { zoneNo: "55A", zoneName: "Ward 55A" },
    { zoneNo: "55B", zoneName: "Ward 55B" },
    { zoneNo: "56A", zoneName: "Ward 56A" },
    { zoneNo: "56B", zoneName: "Ward 56B" },
    { zoneNo: "57_58", zoneName: "Ward 57_58" },
    { zoneNo: "59", zoneName: "Ward 59" },
    { zoneNo: "60", zoneName: "Ward 60" },
    //{ zoneNo: "61_62", zoneName: "Ward 61_62" },
    { zoneNo: "61", zoneName: "Ward 61" },
    { zoneNo: "62", zoneName: "Ward 62" },
    { zoneNo: "63_64", zoneName: "Ward 63_64" },
    { zoneNo: "65", zoneName: "Ward 65" },
    { zoneNo: "mkt1", zoneName: "Market 1 " },
    { zoneNo: "mkt2", zoneName: "Market 2 " },
    { zoneNo: "mkt3", zoneName: "Market 3 " },
    { zoneNo: "mkt4", zoneName: "Market 4 " },
    { zoneNo: "mkt5", zoneName: "Market 5 " }
  ];

  marchToAprilZones = [
    { zoneNo: "0", zoneName: "-- Select --" },
    { zoneNo: "25", zoneName: "Ward 25" },
    { zoneNo: "26", zoneName: "Ward 26" },
    { zoneNo: "27", zoneName: "Ward 27" },
    { zoneNo: "28", zoneName: "Ward 28" },
    { zoneNo: "36", zoneName: "Ward 36" },
    { zoneNo: "37", zoneName: "Ward 37" },
    { zoneNo: "38", zoneName: "Ward 38" },
    { zoneNo: "39", zoneName: "Ward 39" },
    { zoneNo: "40A", zoneName: "Ward 40A" },
    { zoneNo: "40B", zoneName: "Ward 40B" },
    { zoneNo: "41A", zoneName: "Ward 41A" },
    { zoneNo: "41B", zoneName: "Ward 41B" },
    { zoneNo: "42A", zoneName: "Ward 42A" },
    { zoneNo: "42B", zoneName: "Ward 42B" },
    { zoneNo: "43A", zoneName: "Ward 43A" },
    { zoneNo: "43B", zoneName: "Ward 43B" },
    { zoneNo: "44", zoneName: "Ward 44" },
    { zoneNo: "mkt1", zoneName: "Market 1 (Piprali Road + Nawalgarh Road) " },
    { zoneNo: "mkt2", zoneName: "Market 2 (Jaipur Road + Ranisati Road) " }
  ];

  decemberToMarchZones = [
    { zoneNo: "0", zoneName: "-- Select --" },
    { zoneNo: "25", zoneName: "Ward 25" },
    { zoneNo: "26", zoneName: "Ward 26" },
    { zoneNo: "27", zoneName: "Ward 27" },
    { zoneNo: "28", zoneName: "Ward 28" },
    { zoneNo: "36", zoneName: "Ward 36" },
    { zoneNo: "37", zoneName: "Ward 37" },
    { zoneNo: "38", zoneName: "Ward 38" },
    { zoneNo: "39", zoneName: "Ward 39" },
    { zoneNo: "40A", zoneName: "Ward 40A" },
    { zoneNo: "40B", zoneName: "Ward 40B" },
    { zoneNo: "41A", zoneName: "Ward 41A" },
    { zoneNo: "41B", zoneName: "Ward 41B" },
    { zoneNo: "42A", zoneName: "Ward 42A" },
    { zoneNo: "42B", zoneName: "Ward 42B" },
    { zoneNo: "43A", zoneName: "Ward 43A" },
    { zoneNo: "43B", zoneName: "Ward 43B" },
    { zoneNo: "44", zoneName: "Ward 44" },
    { zoneNo: "mkt1", zoneName: "Market 1 (Piprali Road + Nawalgarh Road) " },
    { zoneNo: "mkt2", zoneName: "Market 2 (Jaipur Road + Ranisati Road) " }
    //{ zoneNo: "1000", zoneName: "Ward 1000" }
  ];

  allZoneList = [
    { zoneNo: "0", zoneName: "-- Select --" },
    { zoneNo: "1_50", zoneName: "Ward 1_50" },
    { zoneNo: "2", zoneName: "Ward 2" },
    { zoneNo: "3", zoneName: "Ward 3" },
    { zoneNo: "5", zoneName: "Ward 5" },
    { zoneNo: "6_7", zoneName: "Ward 6_7" },
    { zoneNo: "08", zoneName: "Ward 8" },
    { zoneNo: "9", zoneName: "Ward 9" },
    { zoneNo: "10", zoneName: "Ward 10" },
    { zoneNo: "11", zoneName: "Ward 11" },
    { zoneNo: "12_13", zoneName: "Ward 12_13" },
    { zoneNo: "14_15", zoneName: "Ward 14_15" },
    { zoneNo: "16_31", zoneName: "Ward 16_31" },
    { zoneNo: "17", zoneName: "Ward 17" },
    { zoneNo: "18", zoneName: "Ward 18" },
    { zoneNo: "19", zoneName: "Ward 19" },
    { zoneNo: "20", zoneName: "Ward 20" },
    { zoneNo: "21", zoneName: "Ward 21_33" },
    { zoneNo: "22", zoneName: "Ward 22" },
    { zoneNo: "24", zoneName: "Ward 24" },
    { zoneNo: "25", zoneName: "Ward 25" },
    { zoneNo: "26", zoneName: "Ward 26" },
    { zoneNo: "27", zoneName: "Ward 27" },
    { zoneNo: "28", zoneName: "Ward 28" },
    { zoneNo: "29", zoneName: "Ward 29" },
    { zoneNo: "30", zoneName: "Ward 30" },
    { zoneNo: "32", zoneName: "Ward 32" },
    { zoneNo: "33", zoneName: "Ward 33" },
    { zoneNo: "34", zoneName: "Ward 34" },
    { zoneNo: "35", zoneName: "Ward 35" },
    { zoneNo: "36", zoneName: "Ward 36" },
    { zoneNo: "37", zoneName: "Ward 37" },
    { zoneNo: "38", zoneName: "Ward 38" },
    { zoneNo: "39", zoneName: "Ward 39" },
    { zoneNo: "41", zoneName: "Ward 41" },
    { zoneNo: "42", zoneName: "Ward 42" },
    { zoneNo: "43A", zoneName: "Ward 43A" },
    { zoneNo: "43B", zoneName: "Ward 43B" },
    { zoneNo: "44", zoneName: "Ward 44" },
    { zoneNo: "45", zoneName: "Ward 45" },
    { zoneNo: "46", zoneName: "Ward 46" },
    { zoneNo: "47", zoneName: "Ward 47" },
    { zoneNo: "48", zoneName: "Ward 48" },
    { zoneNo: "49", zoneName: "Ward 49" },
    { zoneNo: "50", zoneName: "Ward 50" }
  ];
  constructor(private router: Router, public db: AngularFireDatabase, public commonService: CommonService, private toastr: ToastrService) {
   
    
    let userKey = localStorage.getItem("userKey");
    if (userKey != null) {

      let User = this.db.object('Users/' + userKey + '/expiryDate').valueChanges().subscribe(
        data => {
          User.unsubscribe();
          if (data != null) {
            if (new Date(this.commonService.setTodayDate()) >= new Date(data.toString())) {
              this.router.navigate(['/index']);
              localStorage.setItem('loginStatus', "Fail");
              this.toastr.error("Account Not Activate !!!", '', {
                timeOut: 60000,
                enableHtml: true,
                closeButton: true,
                toastClass: "alert alert-danger alert-with-icon",
                positionClass: 'toast-bottom-right'
              });
            }
          }
        });
    }



    let letestZone = [];
    let dbPath = "Defaults/AvailableWard";
    let wardDetail = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        if (data.length > 0) {
          letestZone.push({ zoneNo: "0", zoneName: "-- Select --" });
          for (let index = 0; index < data.length; index++) {
            if (!data[index].toString().includes("Test") && data[index] != "OfficeWork" && data[index] != "FixedWages" && data[index] != "BinLifting" && data[index] != "GarageWork" && data[index] != "Compactor" && data[index] != "SegregationWork" && data[index] != "GeelaKachra" && data[index] != "SecondHelper" && data[index] != "ThirdHelper") {
              if (data[index].toString().includes("mkt")) {
                letestZone.push({ zoneNo: data[index], zoneName: "Market " + data[index].toString().replace("mkt", "") });
              }
              else if (data[index].toString().includes("MarketRoute1")) {
                letestZone.push({ zoneNo: data[index], zoneName: "Market 1" });
              }
              else if (data[index].toString().includes("MarketRoute2")) {
                letestZone.push({ zoneNo: data[index], zoneName: "Market 2" });
              }
              else if (data[index].toString() == "WetWaste") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 1" });
              }
              else if (data[index].toString() == "WetWaste1") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 2" });
              }
              else if (data[index].toString() == "WetWaste2") {
                letestZone.push({ zoneNo: data[index], zoneName: "Wet 3" });
              }
              else if (data[index].toString() == "CompactorTracking1") {
                letestZone.push({ zoneNo: data[index], zoneName: "CompactorTracking1" });
              }
              else if (data[index].toString() == "CompactorTracking2") {
                letestZone.push({ zoneNo: data[index], zoneName: "CompactorTracking2" });
              }
              else {
                letestZone.push({ zoneNo: data[index], zoneName: "Ward " + data[index] });
              }
            }
          }
          localStorage.setItem('latest-zones', JSON.stringify(letestZone));
        }
        wardDetail.unsubscribe();
      });
    localStorage.setItem('zones', JSON.stringify(this.zoneList));
    localStorage.setItem('all-zones', JSON.stringify(this.allZoneList));
    localStorage.setItem('decemberToMarchZones', JSON.stringify(this.decemberToMarchZones));
    localStorage.setItem('marchToToAprilZones', JSON.stringify(this.marchToAprilZones));


    // zone wise dustbin
    /*
        let dustbinZone = [];
        let dustbinList = [];
        dbPath = "DustbinData/AvailableZone";
        console.log("dustbinData")
        let dustbinZoneDetail = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            dustbinZoneDetail.unsubscribe();
            if (data != null) {
              dustbinZone = data["zone"].toString().replaceAll(' ', '').split(',');
              if (dustbinZone.length > 0) {
                dbPath = "DustbinData/DustbinDetails";
                let dustbinDetail = this.db.object(dbPath).valueChanges().subscribe(
                  dustbinData => {
                    dustbinDetail.unsubscribe();
                    if (dustbinData != null) {
                      let keyArray = Object.keys(dustbinData);
                      if (keyArray.length > 0) {
                        for (let i = 0; i < keyArray.length; i++) {
                          let index=keyArray[i];
                          dustbinList.push({zone:dustbinData[index]["zone"],dustbinNo:index,type:dustbinData[index]["type"],address:dustbinData[index]["address"]});
                        }
                      }
    
                    }
                  });
              }
            }
          });
    
    */









  }
}
