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
      // console.log(XLSX.utils.sheet_to_json(worksheet, { raw: true }));
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
      return;
    }
    if (this.selectedDate != this.fileDate) {
      this.commonService.setAlertMessage("error", "Please select correct date or check sheet name !!!");
      return;
    }
    $('#divLoader').show();

    if (this.fileRouteList.length > 0) {
      for (let i = 0; i < this.fileRouteList.length; i++) {
        let vehicle = this.fileRouteList[i]["vehicleName"];
        let lat = this.fileRouteList[i]["latitude"];
        let lng = this.fileRouteList[i]["longitude"];
        if (vehicle == undefined) {
          this.commonService.setAlertMessage("error", "Column name vehicleName is not correct");
          $('#divLoader').hide();
          return;
        }
        if (lat == undefined) {
          this.commonService.setAlertMessage("error", "Column name latitude is not correct");
          $('#divLoader').hide();
          return;
        }
        if (lng == undefined) {
          this.commonService.setAlertMessage("error", "Column name longitude is not correct");
          $('#divLoader').hide();
          return;
        }
        if (vehicle != "") {
          if (lat != "") {
            if (lng != "") {
              let vehicleDetail = this.routeList.find(item => item.vehicle == vehicle);
              if (vehicleDetail == undefined) {
                this.vehicleList.push({ vehicle: vehicle });
                let points = [];
                let latLng = lat + "," + lng;
                let latLngString = latLng;
                points.push({ latLng });
                this.routeList.push({ vehicle: vehicle, points: points, latLngString: latLngString });
              }
              else {
                let latLng = lat + "," + lng;
                vehicleDetail.latLngString = vehicleDetail.latLngString + "~" + latLng;
                vehicleDetail.points.push({ latLng });
              }
            }
          }
        }
      }
      console.log(this.routeList);
      if (this.vehicleList.length > 0) {
        let fileName = "main";
        let dbPath = "BVGRoutes/" + this.selectedDate + "/" + fileName;
        this.db.database.ref(dbPath).set(this.vehicleList);
        // this.saveJsonFile(this.vehicleList, fileName);
        if (this.routeList.length > 0) {
          for (let i = 0; i < this.vehicleList.length; i++) {
            let routeDetail = this.routeList.find(item => item.vehicle == this.vehicleList[i]["vehicle"]);
            if (routeDetail != undefined) {
              this.saveRealTimeData(routeDetail.points, this.vehicleList[i]["vehicle"], routeDetail.latLngString);
              // this.saveJsonFile(routeDetailList, this.vehicleList[i]["vehicle"]);
            }
          }
          setTimeout(() => {
            $('#divLoader').hide();
            this.commonService.setAlertMessage("success", "File uploaded successfully !!!");
          }, 2000);
        }
      }
    }
  }

  saveRealTimeData(listArray: any, fileName: any, latLngString: any) {
    let dbPath = "BVGRoutes/" + this.selectedDate + "/" + fileName;
    this.db.database.ref(dbPath).set(latLngString);
  }

  saveJsonFile(listArray: any, fileName: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + this.commonService.getFireStoreCity() + "/BVGRouteJson/" + this.selectedDate + "/" + fileName + ".json";

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
  }
}
