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
  }

  resetAll() {
    this.routeList = [];
    this.vehicleList = [];
  }

  saveDataMultiple() {
    this.resetAll();
    let element = <HTMLInputElement>document.getElementById("fileUpload");
    for (let i = 0; i < element.files.length; i++) {
      let file = element.files[i];
      let fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = (e) => {
        this.arrayBuffer = fileReader.result;
        var data = new Uint8Array(this.arrayBuffer);
        var arr = new Array();
        for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
        var bstr = arr.join("");
        var workbook = XLSX.read(bstr, { type: "binary" });
        this.first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[this.first_sheet_name];
        let fileList=XLSX.utils.sheet_to_json(worksheet, { raw: true });
        this.saveData(fileList);
      }
    }
    setTimeout(() => {
      $('#fileUpload').val("");
      $('#divLoader').hide();
      this.commonService.setAlertMessage("success", "File uploaded successfully !!!");
    }, 2000);
  }

  saveData(fileList:any) {
    
    $('#divLoader').show();

    if (fileList.length > 0) {
      for (let i = 0; i < fileList.length; i++) {
        let date = this.getExcelDatetoDate(fileList[i]["Date"]);
        let vehicle = fileList[i]["Vehicle Name"];
        let lat = fileList[i]["latitude"];
        let lng = fileList[i]["longitude"];
        if (vehicle == undefined) {
          vehicle = fileList[i]["VehicleName"];
          if (vehicle == undefined) {
            vehicle = fileList[i]["vhicleName"];
            if (vehicle == undefined) {
              vehicle = fileList[i]["vhiclename"];
              if (vehicle == undefined) {
                vehicle = fileList[i]["Vhiclename"];
                if (vehicle == undefined) {
                  this.commonService.setAlertMessage("error", "Column name vehicleName is not correct");
                  $('#divLoader').hide();
                  $('#fileUpload').val("");
                  return;
                }
              }
            }
          }
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
          let year = date.split('-')[0];
          let month = date.split('-')[1];
          let monthName = this.commonService.getCurrentMonthName(Number(month) - 1);
          let vehicles = this.routeList[i]["vehicles"];
          if (vehicles.length > 0) {
            let vehicleList = [];
            for (let j = 0; j < vehicles.length; j++) {
              vehicleList.push({ vehicle: vehicles[j]["vehicle"] });
              let dbPath = "BVGRoutes/" + year + "/" + monthName + "/" + date + "/" + vehicles[j]["vehicle"];
              this.db.database.ref(dbPath).set(vehicles[j]["latLngString"]);
            }
            let dbPath = "BVGRoutes/" + year + "/" + monthName + "/" + date + "/main";
            this.db.database.ref(dbPath).set(vehicleList);
          }
        }
      }
      
    }
  }

  getExcelDatetoDate(serial: any) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);
    return this.commonService.getDateWithDate(date_info);
  }
}
