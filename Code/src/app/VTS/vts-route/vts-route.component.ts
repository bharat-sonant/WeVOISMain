import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from "../../services/common/common.service";

@Component({
  selector: 'app-vts-route',
  templateUrl: './vts-route.component.html',
  styleUrls: ['./vts-route.component.scss']
})
export class VtsRouteComponent implements OnInit {
  constructor(private fs: FirebaseService, private commonService: CommonService) { }
  vehicleList: any[];
  db: any;
  cityName: any;
  toDayDate: any;
  selectedDate: any;
  summaryVehicleList: any[];
  fileRouteList: any[];
  routeList: any[];
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $('#txtDate').val(this.selectedDate);
    this.getVehicle();
    this.fileRouteList = [];
    this.routeList = [];
  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate($("#txtDate").val(), 1);
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.toDayDate)) {
      this.selectedDate = this.toDayDate;
      this.commonService.setAlertMessage("error", "Please select current or previos date!!!");
      return;
    }
    $("#txtDate").val(this.selectedDate);
    this.getVehicle();
  }

  getVehicle() {
    this.vehicleList = [];
    let year = this.selectedDate.split('-')[0];
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let dbPath = "VTSRoute/" + year + "/" + monthName + "/" + this.selectedDate + "/Summary/";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        vehicleInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              this.vehicleList.push({ vehicle: keyArray[i] });
            }
          }
        }
      }
    );
  }

  saveData() {
    this.summaryVehicleList = [];
    this.routeList = [];
    let isFile = false;
    if ($('#txtJson').val() != "") {
      isFile = true;
      try {
        this.routeList = JSON.parse($('#txtJson').val().toString());
      } catch {
        isFile = false;
        this.commonService.setAlertMessage("error", "Please enter correct json !!!");
      }
    }
    if (isFile == false) {
      if (this.fileRouteList.length > 0) {
        isFile = true;
        this.routeList = this.fileRouteList;
      }
    }
    if (isFile == false) {
      this.commonService.setAlertMessage("error", "Please paste or browse json file!!!");
    }
    else {
      if (this.routeList.length > 0) {
        for (let i = 0; i < this.routeList.length; i++) {
          let dateTime = this.routeList[i]["datetimerpl"];
          let vehicle = this.routeList[i]["vehicleNamerpl"];
          let color = this.routeList[i]["color"];
          let lat = this.routeList[i]["lat"];
          let lng = this.routeList[i]["lng"];
          let time = dateTime.toString().split(' ')[1] + " " + dateTime.toString().split(' ')[2];
          let date = dateTime.toString().split(' ')[0];
          let year = date.split('/')[2];
          date = date.split('/')[2] + "-" + date.split('/')[0] + "-" + date.split('/')[1];
          let monthName = this.commonService.getCurrentMonthName(new Date(date).getMonth());
          const data = {
            vehicle: vehicle,
            color: color,
            lat: lat,
            lng: lng
          }
          let dbPath = "VTSRoute/" + year + "/" + monthName + "/" + date + "/" + vehicle + "/" + time;
          this.db.object(dbPath).update(data);
          let vehicleDetail = this.summaryVehicleList.find(item => item.vehicle == vehicle);
          if (vehicleDetail == undefined) {
            dbPath = "VTSRoute/" + year + "/" + monthName + "/" + date + "/Summary/" + vehicle;
            this.db.database.ref(dbPath).set("1");
            this.summaryVehicleList.push({ vehicle: vehicle });
          }
          if (date == this.selectedDate) {
            vehicleDetail = this.vehicleList.find(item => item.vehicle == vehicle);
            if (vehicleDetail == undefined) {
              this.vehicleList.push({ vehicle: vehicle });
            }
          }
          if (i == this.routeList.length - 1) {
            $('#txtJson').val("");
            this.commonService.setAlertMessage("success", "Data added successfully !!!");
          }
        }
      }
    }
  }

  onFileChanged(event) {
    this.fileRouteList = [];
    let selectedFile = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        this.fileRouteList = JSON.parse(fileReader.result.toString());
      }
      catch {
        this.commonService.setAlertMessage("error", "Please upload json file!!!");
      }
    }
    fileReader.readAsText(selectedFile);
  }
}