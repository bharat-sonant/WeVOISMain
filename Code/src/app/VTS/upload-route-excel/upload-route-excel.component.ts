import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-upload-route-excel',
  templateUrl: './upload-route-excel.component.html',
  styleUrls: ['./upload-route-excel.component.scss']
})
export class UploadRouteExcelComponent implements OnInit {

  constructor(private storage: AngularFireStorage, private fs: FirebaseService, private commonService: CommonService) { }
  db: any;
  cityName: any;
  selectedDate: any;
  fileRouteList: any[];
  vehicleList: any[];
  file: any;
  arrayBuffer: any;
  routeList: any[];
  fileDate: any;
  first_sheet_name: any;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.selectedDate = this.commonService.setTodayDate();
    $('#txtDate').val(this.selectedDate);
  }

  resetAll() {
    this.routeList = [];
    this.vehicleList = [];
  }

  onFileChanged(event) {
    $('#divLoader').show();
    this.fileRouteList = [];
    this.file = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(this.file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      this.first_sheet_name = workbook.SheetNames[0];
      this.fileDate = this.commonService.getDateConvert(this.first_sheet_name);
      var worksheet = workbook.Sheets[this.first_sheet_name];
      this.fileRouteList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      $('#divLoader').hide();
    }
  }

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
  }

  saveData() {
    this.resetAll();
    if (this.first_sheet_name == "") {
      this.commonService.setAlertMessage("error", "Please select file !!!");
      $('#fileUpload').val("");
      return;
    }
    $('#divLoader').show();

    if (this.fileRouteList.length > 0) {
      for (let i = 0; i < this.fileRouteList.length; i++) {
        let date = this.getExcelDatetoDate(this.fileRouteList[i]["Date"]);
        let vehicle = this.fileRouteList[i]["Vehicle Name"];
        let lat = this.fileRouteList[i]["latitude"];
        let lng = this.fileRouteList[i]["longitude"];
        if (vehicle == undefined) {
          this.commonService.setAlertMessage("error", "Column name vehicleName is not correct");
          $('#divLoader').hide();
          $('#fileUpload').val("");
          return;
        }
        if (lat == undefined) {
          this.commonService.setAlertMessage("error", "Column name latitude is not correct");
          $('#divLoader').hide();
          $('#fileUpload').val("");
          return;
        }
        if (lng == undefined) {
          this.commonService.setAlertMessage("error", "Column name longitude is not correct");
          $('#divLoader').hide();
          $('#fileUpload').val("");
          return;
        }
        if (vehicle != "") {
          if (lat != "") {
            if (lng != "") {
              let latLng = lat + "," + lng;
              let dateDetail = this.routeList.find(item => item.date == date);
              if (dateDetail != undefined) {
                let vehicles = dateDetail.vehicles;
                let vehicleDetail = vehicles.find(item => item.vehicle == vehicle);
                if (vehicleDetail != undefined) {
                  let latLngString = latLng;
                  vehicleDetail.latLngString = vehicleDetail.latLngString + "~" + latLngString;
                }
                else {
                  let latLngString = latLng;
                  vehicles.push({ vehicle: vehicle, latLngString: latLngString });
                  dateDetail.vehicles = vehicles;
                }
              }
              else {
                let vehicles = [];
                let latLngString = latLng;
                vehicles.push({ vehicle: vehicle, latLngString: latLngString });
                this.routeList.push({ date: date, vehicles: vehicles });
              }
            }
          }
        }
      }
      if (this.routeList.length > 0) {
        for (let i = 0; i < this.routeList.length; i++) {
          let date = this.routeList[i]["date"];
          let vehicles = this.routeList[i]["vehicles"];
          if (vehicles.length > 0) {
            let vehicleList = [];
            for (let j = 0; j < vehicles.length; j++) {
              vehicleList.push({ vehicle: vehicles[j]["vehicle"] });
              this.saveRealTimeData(date,vehicles[j]["vehicle"], vehicles[j]["latLngString"]);
            }
            let dbPath = "BVGRoutes/" + date + "/main";
            this.db.database.ref(dbPath).set(vehicleList);
          }
        }
      }
      setTimeout(() => {
        $('#fileUpload').val("");
        $('#divLoader').hide();
        this.commonService.setAlertMessage("success", "File uploaded successfully !!!");
      }, 2000);
    }
  }

  saveRealTimeData(date:any,fileName: any, latLngString: any) {
    let dbPath = "BVGRoutes/" + date + "/" + fileName;
    this.db.database.ref(dbPath).set(latLngString);
  }

  getExcelDatetoDate(serial: any) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);
    return this.commonService.getDateWithDate(date_info);
  }
}
