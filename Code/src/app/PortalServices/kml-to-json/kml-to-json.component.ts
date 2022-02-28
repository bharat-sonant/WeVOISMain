import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-kml-to-json',
  templateUrl: './kml-to-json.component.html',
  styleUrls: ['./kml-to-json.component.scss']
})
export class KmlToJsonComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  selectedZone: any;
  zoneList: any[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.selectedZone = "0";
    this.zoneList = [];
    this.getZones();

  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["zoneName"] = "--Select Zone--";
  }

  saveData() {
    let kmlString = $("#txtLatLng").val();
    let wardNo = $("#ddlZone").val();
    let list = kmlString.toString().split(",0");
    if (list.length > 0) {
      const point = [];
      for (let i = 0; i < list.length; i++) {
        let latLng = list[i].trim();
        const aa = [];
        if (latLng.split(",")[1] != null) {
          aa[0] = latLng.split(",")[1];
          aa[1] = latLng.split(",")[0];
          point[i] = aa;
        }
      }
      const obj = {
        points: point
      };
      this.saveJsonFile(obj, wardNo);
      $("#txtLatLng").val("");
    }
  }


  saveJsonFile(listArray: any, ward: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + this.commonService.getFireStoreCity() + "/WardBoundryJson/" + ward + ".json";

    //const ref = this.storage.ref(path);
    const ref = this.storage.storage.app.storage("https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/").ref(path);
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
    this.commonService.setAlertMessage("success", "Data saved successfully !!!");
    $('#divLoader').hide();
  }

}
