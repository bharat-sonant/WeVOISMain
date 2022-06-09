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
      let filePath = "/WardBoundryJson/";
      let fileName = wardNo + ".json";
      this.commonService.saveJsonFile(obj, fileName, filePath);
      $("#txtLatLng").val("");
      this.commonService.setAlertMessage("success","Json saved successfullt !!!");
    }
  }

}
