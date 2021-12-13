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
        let fileList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
        this.saveData(fileList);
      }
    }
    setTimeout(() => {
      $('#fileUpload').val("");
      $('#divLoader').hide();
      this.commonService.setAlertMessage("success", "File uploaded successfully !!!");
    }, 3000);
  }

  saveData(fileList: any) {
    $('#divLoader').show();
    if (fileList.length > 0) {
      for (let i = 0; i < fileList.length; i++) {
        let date = "";
        let dat = fileList[i]["Date"];
        let dat1 = dat.toString().split('-');
        if (dat1.length > 1) {
          date = dat1[2] + "-" + dat1[1] + "-" + dat1[0];
        }
        else {
          date = this.getExcelDatetoDate(fileList[i]["Date"]);
        }
        let vehicle = fileList[i]["Vehicle Name"];
        let lat = fileList[i]["latitude"];
        let lng = fileList[i]["longitude"];
        let speed = fileList[i]["speed"];

        if (vehicle == undefined) {
          vehicle = fileList[i]["VehicleName"];
          if (vehicle == undefined) {
            vehicle = fileList[i]["vehicleName"];
            if (vehicle == undefined) {
              vehicle = fileList[i]["vehiclename"];
              if (vehicle == undefined) {
                vehicle = fileList[i]["Vehiclename"];
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
              let latLng = lat + "," + lng + "," + speed;
              let dateDetail = this.routeList.find(item => item.date == date);
              if (dateDetail != undefined) {
                let vehicles = dateDetail.vehicles;
                let vehicleDetail = vehicles.find(item => item.vehicle == vehicle);
                if (vehicleDetail != undefined) {
                  let latLngString = latLng;
                  let points = vehicleDetail.points;
                  points.push({ latLng: latLng });
                  vehicleDetail.points = points;
                  vehicleDetail.latLngString = vehicleDetail.latLngString + "~" + latLngString;
                }
                else {
                  let latLngString = latLng;
                  let points = [];
                  points.push({ latLng: latLng });
                  vehicles.push({ vehicle: vehicle, points: points, latLngString: latLngString });
                  dateDetail.vehicles = vehicles;
                }
              }
              else {
                let vehicles = [];
                let latLngString = latLng;
                let points = [];
                points.push({ latLng: latLng });
                vehicles.push({ vehicle: vehicle, points: points, latLngString: latLngString });
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
          let dbPath = "BVGRoutes/" + year + "/" + monthName + "/" + date + "/main";
          let mainInstance = this.db.list(dbPath).valueChanges().subscribe(
            data => {
              mainInstance.unsubscribe();
              let vehicleList = data;
              for (let j = 0; j < vehicles.length; j++) {
                let detail = vehicleList.find(item => item.vehicle == vehicles[j]["vehicle"]);
                if (detail == undefined) {
                  vehicleList.push({ vehicle: vehicles[j]["vehicle"] });
                  let latLngString = vehicles[j]["latLngString"];
                  let dbPathVehicle = "BVGRoutes/" + year + "/" + monthName + "/" + date + "/" + vehicles[j]["vehicle"] + "/0";
                  this.db.database.ref(dbPathVehicle).set(latLngString);
                }
                else {
                  let dbPathVehicle = "BVGRoutes/" + year + "/" + monthName + "/" + date + "/" + vehicles[j]["vehicle"];
                  let vehicleInstance = this.db.list(dbPathVehicle).valueChanges().subscribe(
                    vehicleData => {
                      vehicleInstance.unsubscribe();
                      let isData = false;
                      let latLngString = vehicles[j]["latLngString"];
                      let updateIndex = -1;
                      if (vehicleData.length > 0) {
                        let newLatLngList = vehicles[j]["points"];
                        for (let k = 0; k < vehicleData.length; k++) {
                          let count = 0;
                          let oldLatLngList = vehicleData[k].split('~');
                          for (let l = 0; l < oldLatLngList.length; l++) {
                            let latLngDetail = newLatLngList.find(item => item.latLng == oldLatLngList[l]);
                            if (latLngDetail != undefined) {
                              count = count + 1;
                              let percentage = Number(((count / newLatLngList.length) * 100).toFixed(0));
                              if (percentage >= 50) {
                                isData = true;
                                updateIndex = k;
                                k = vehicleData.length;
                                l = oldLatLngList.length;
                              }
                            }
                          }
                        }
                      }
                      if (isData == false) {
                        this.db.database.ref(dbPathVehicle + "/" + vehicleData.length).set(latLngString);
                      }
                      else {
                        this.db.database.ref(dbPathVehicle + "/" + updateIndex).set(latLngString);
                      }
                    }
                  );
                }
              }
              this.db.database.ref(dbPath).set(vehicleList);
            }
          );
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
