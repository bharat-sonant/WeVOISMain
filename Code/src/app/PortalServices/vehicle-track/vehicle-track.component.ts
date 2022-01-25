import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-vehicle-track',
  templateUrl: './vehicle-track.component.html',
  styleUrls: ['./vehicle-track.component.scss']
})
export class VehicleTrackComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  vehicleList: any[];
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.vehicleList = [];
    this.getYear();
  }


  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  saveData() {
    this.selectedYear = $('#ddlYear').val();
    this.selectedMonth = $('#ddlMonth').val();
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if (this.selectedMonth == "0") {
      this.commonService.setAlertMessage("error", "Please select month !!!");
      return;
    }
    $('#divLoader').show();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let days = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      days = parseInt(this.commonService.setTodayDate().split("-")[2]) - 1;
    }
    this.saveData1(1, days);
    /*
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FVehicleTrack%2F" + this.selectedYear + "%2F" + this.selectedMonthName + "%2Ftrack.json?alt=media";
    let fuelInstance = this.httpService.get(path).subscribe(data => {
      fuelInstance.unsubscribe();
      if (data != null) {
        let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (days < 10 ? '0' : '') + days;
        if (data["updateDate"] != null) {
          if (monthDate == data["updateDate"]) {
            this.commonService.setAlertMessage("error", "Month data already updated upto " + monthDate + "");
            $('#divLoader').hide();

          }
          else {
            this.saveData1(1, days);
          }
        }
        else {
          this.saveData1(1, days);
        }
      }
    }, error => {
      this.saveData1(1, days);
    });
    */
  }

  saveData1(stratDays: any, days: any) {
    let workDetailList = [];
    for (let i = stratDays; i <= days; i++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (i < 10 ? '0' : '') + i;
      let dbPath = "DailyWorkDetail/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate;
      let workDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          workDetailInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let j = 0; j < keyArray.length; j++) {
                let empId = keyArray[j];
                this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                  if (employee["designation"] == "Transportation Executive") {
                    for (let k = 1; k <= 5; k++) {
                      if (data[empId]["task" + k] != null) {
                        let ward = data[empId]["task" + k]["task"];
                        let vehicle = data[empId]["task" + k]["vehicle"];
                        if (vehicle != "NotApplicable") {
                          let dbLocationPath = "LocationHistory/" + ward + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/TotalCoveredDistance";
                          if (ward.includes("BinLifting")) {
                            dbLocationPath = "LocationHistory/BinLifting/" + vehicle + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + monthDate + "/TotalCoveredDistance";
                          }
                          let locationInstance = this.db.object(dbLocationPath).valueChanges().subscribe(
                            locationData => {
                              locationInstance.unsubscribe();
                              let distance = 0;
                              if (locationData != null) {
                                distance = locationData;
                              }
                              let preDetail = workDetailList.find(item => item.date == monthDate && item.ward == ward);
                              if (preDetail == undefined) {
                                let orderBy = new Date(monthDate).getTime();
                                this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                                  let name = employee["name"];
                                  workDetailList.push({ date: monthDate, vehicle: vehicle, ward: ward, distance: distance, empId: empId, orderBy: orderBy, name: name });
                                });
                              }
                            }
                          );
                        }
                      }
                    }
                  }
                });
              }
            }
          }
        }
      );
    }
    setTimeout(() => {
      this.createJSON(workDetailList, days);
      this.commonService.setAlertMessage("success", "Data updated successfully !!!");
      $('#divLoader').hide();
    }, 24000);
  }

  createJSON(workDetailList: any, days: any) {
    if (workDetailList.length > 0) {
      workDetailList = workDetailList.sort((a, b) =>
        b.orderBy > a.orderBy ? -1 : 1
      );
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (days < 10 ? '0' : '') + days;
      const data = [];
      const map = new Map();
      for (const item of workDetailList) {
        if (!map.has(item.vehicle)) {
          map.set(item.vehicle, true);    // set any value to Map
          data.push(item.vehicle);
        }
      }
      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          let vehicle = data[i];
          let list = workDetailList.filter(item => item.vehicle == vehicle);
          if (list.length > 0) {
            const objDate = {}
            const aa = []
            for (let j = 0; j < list.length; j++) {
              let date = list[j]["date"];
              let list2 = list.filter(item => item.date == date);
              const bb = [];
              if (list2.length > 0) {
                for (let k = 0; k < list2.length; k++) {
                  let distance = Number(list2[k]["distance"]) / 1000;
                  distance = Math.round(distance * 10) / 10;
                  bb.push({ ward: list2[k]["ward"], distance: distance.toFixed(1), driver: list2[k]["empId"], name: list2[k]["name"] });
                }
              }
              objDate[date] = bb;
              aa[j] = objDate[date];
            }
            this.saveJsonFile(objDate, vehicle);
          }
        }
      }
    }
  }

  saveJsonFile(listArray: any, fileName: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + this.commonService.getFireStoreCity() + "/VehicleWardKM/" + this.selectedYear + "/" + this.selectedMonthName + "/" + fileName + ".json";

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
