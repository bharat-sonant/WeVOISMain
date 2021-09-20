import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  userid: any;
  isShow: any;
  accessList: any[];
  portalAccessList: any[];
  userType: any;
  cityName: any;
  db: any;
  userDetail: userDetail = {
    name: "",
  };

  constructor(
    private commonService: CommonService,
    public dbFireStore: AngularFirestore, public fs: FirebaseService,
  ) { }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    //this.getBreakDustbin();
    //this.setRemark();
    //this.setAllWard();
    // this.setAvailableWard();
    //console.log("home");
    //this.getJsonFile();
    this.commonService.getFireStoreCity();
    this.userid = localStorage.getItem("userID");
    this.userType = localStorage.getItem("userType");
    this.userDetail.name = localStorage.getItem("userName");
    //this.commonService.chkUserExpiryDate();
    this.portalAccessList = [];
    this.portalAccessList = JSON.parse(localStorage.getItem("portalAccess"));
    if (localStorage.getItem("isCityChange") == "yes") {
      localStorage.setItem("isCityChange", "no");
      setTimeout(() => {
        this.getUserAccess();
      }, 2000);
    } else {
      this.getUserAccess();
    }
    // this.commonService.setCityData();
    // if (localStorage.getItem('isCityChange') == "yes") {
    //   localStorage.setItem('isCityChange', "no");
    // setTimeout(() => {
    //   window.location.href = window.location.href;
    //}, 1000);
    //  }
    //  else {
    //setTimeout(() => {

    // }, 1000);
    //  }
  }

  getJsonFile() {
    /*
   // let require: any

    var obj = {
      table: []
    };
    obj.table.push({ id: 1, square: 2 });
    var json = JSON.stringify(obj);
    let fsa = require('browserify-fs');
    fsa.writeFile('myjsonfile.json', json, 'utf8');
    fsa.readFile('myjsonfile.json', 'utf8', function readFileCallback(err, data) {
      if (err) {
        console.log(err);
      } else {
        obj = JSON.parse(data); //now it an object
        obj.table.push({ id: 2, square: 3 }); //add some data
        json = JSON.stringify(obj); //convert it back to json
        fsa.writeFile('myjsonfile.json', json, 'utf8'); // write it back 
      }
    });
    */

  }

  getBreakDustbin() {
    let dbPath = "DustbinData/DustbinDetails";
    let instance = this.db
      .list(dbPath)
      .valueChanges()
      .subscribe((data) => {
        instance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let zone = data[i]["zone"];
            let ward = data[i]["ward"];
            if (data[i]["isBroken"] != null) {
              if (data[i]["isBroken"] == true) {
                console.log(
                  "Zone: " + zone + "  address: " + data[i]["address"]
                );
              }
            }
          }
        }
      });
  }

  setRemark() {
    this.db.object("Defaults/MarkingWards").update({
      "1": "1_34_35",
      "2": "2_3",
      "3": "4_5_6",
      "4": "7_8",
      "5": "9_21_22",
      "6": "10_11_12_13",
      "7": "14",
      "8": "15_33",
      "9": "16_17_30_32",
      "10": "18_23_29",
      "11": "19_25_26",
      "12": "20_24",
      "13": "27_28",
      "14": "31",
    });
  }

  setAllWard() {
    this.db.object("Defaults/AllWard/Circle1").update({
      "1": "[{wardNo:1, startDate:'2021-12-02'}]",
      "2": "2",
      "3": "3",
      "4": "4",
      "5": "5",
      "6": "6",
      "7": "7",
      "8": "8",
      "9": "9",
      "10": "10",
      "11": "11",
      "12": "12",
      "13": "13",
      "14": "14",
      "15": "14_15",
      "16": "15_16",
      "17": "16",
      "18": "17",
      "19": "18",
      "20": "19",
      "21": "20",
      "22": "21",
      "23": "22",
      "24": "23",
      "25": "24",
      "26": "30",
      "27": "31",
      "28": "mkt4",
    });
  }

  setAvailableWard() {
    this.db.object("Defaults/AvailableWard").update({
      "1": "1",
      "2": "2",
      "3": "3",
      "4": "4",
      "5": "5",
      "6": "6",
      "7": "7",
      "8": "8",
      "9": "9",
      "10": "10",
      "11": "11",
      "12": "12",
      "13": "13",
      "14": "14",
      "15": "15_16",
      "16": "17",
      "17": "18",
      "18": "19",
      "19": "20",
      "20": "21",
      "21": "22",
      "22": "23",
      "23": "24",
      "24": "25",
      "25": "26",
      "26": "27",
      "27": "28",
      "28": "29",
      "29": "30",
      "30": "31",
      "31": "32",
      "32": "33",
      "33": "34",
      "34": "35",
      "35": "36",
      "36": "37",
      "37": "37_39",
      "38": "38",
      "39": "39",
      "40": "40",
      "41": "41",
      "42": "42",
      "43": "43",
      "44": "44",
      "45": "45",
      "46": "47P2_46",
      "47": "47P1_48",
      "48": "49_51",
      "49": "50",
      "50": "52",
      "51": "53",
      "52": "54",
      "53": "55",
      "54": "56A",
      "55": "56B",
      "56": "57_58",
      "57": "59",
      "58": "60",
      "59": "61",
      "60": "62",
      "61": "63_64",
      "62": "65",
      "63": "mkt1",
      "64": "mkt2",
      "65": "mkt3",
      "66": "mkt4",
      "67": "mkt5",
      "68": "OfficeWork",
      "69": "BinLifting",
      "70": "GarageWork",
      "71": "Compactor",
      "72": "SegregationWork",
      "73": "GeelaKachra",
      "74": "SecondHelper",
      "75": "ThirdHelper",
      "76": "Test_Ward_29",
      "77": "Test_Ward_41",
      "78": "Test_Ward_62",
      "79": "Test_Ward_63",
      "80": "Test_Ward_64",
      "81": "Test_Ward_55",
      "82": "FixedWages",
    });
  }

  getUserAccess() {
    
    this.accessList = [];
    let userAccessList = JSON.parse(localStorage.getItem("userAccessList"));
    if (userAccessList != null) {
      for (let i = 0; i < userAccessList.length; i++) {
        if (
          userAccessList[i]["parentId"] == 0 &&
          userAccessList[i]["userId"] == this.userid &&
          userAccessList[i]["city"] == this.cityName
        ) {
          let url = "javaScript:void(0);";
          let dataClass = "dashboard-widgets";
          this.isShow = false;
          if (userAccessList[i]["url"].includes("task-manager")) {
            if (localStorage.getItem("officeAppUserId") != null) {
              this.accessList.push({
                name: userAccessList[i]["name"],
                url:
                  "/" +
                  this.cityName +
                  "/" +
                  userAccessList[i]["pageId"] +
                  userAccessList[i]["url"],
                isShow: this.isShow,
                position: userAccessList[i]["position"],
                img: userAccessList[i]["img"],
                dataClass: dataClass,
              });
            }
          } else {
            this.accessList.push({
              name: userAccessList[i]["name"],
              url:
                "/" +
                this.cityName +
                "/" +
                userAccessList[i]["pageId"] +
                userAccessList[i]["url"],
              isShow: this.isShow,
              position: userAccessList[i]["position"],
              img: userAccessList[i]["img"],
              dataClass: dataClass,
            });
          }
        }
      }
    }
  }
}
export class userDetail {
  name: string;
}
