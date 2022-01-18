import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-penalty-portal-service',
  templateUrl: './penalty-portal-service.component.html',
  styleUrls: ['./penalty-portal-service.component.scss']
})
export class PenaltyPortalServiceComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  toDayDate: any;
  selectedMonth: any;
  selectedYear: any;
  selectedMonthName: any;
  yearList: any[];
  penaltyList: any[];
  specialUserList: any[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.toDayDate = this.commonService.setTodayDate();
    this.yearList = [];
    this.penaltyList = [];
    this.specialUserList = [];
    this.getYear();
    this.getSpecialUsers();
  }

  getSpecialUsers() {
    let dbPath = "Settings/SpecialUsers";
    let userInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        userInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            this.specialUserList.push({ name: data[i]["username"] });
          }
        }
      }
    );
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
    if (this.selectedYear == this.toDayDate.split('-')[0] && this.selectedMonth == this.toDayDate.split('-')[1]) {
      this.commonService.setAlertMessage("error", "Sorry! you can not generate json for current year and current month !!!");
      return;
    }
    $('#divLoader').show();
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let dbPath = "Penalties/" + this.selectedYear + "/" + this.selectedMonthName;
    let penaltyInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        penaltyInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let date = keyArray[i];
              let empObj = data[date];
              let empList = Object.keys(empObj);
              if (empList.length > 0) {
                for (let j = 0; j < empList.length; j++) {
                  let empId = empList[j];
                  this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
                    let name = employee["name"];
                    let createdBy = empObj[empId]["createdBy"];
                    let createdOn = empObj[empId]["createdOn"];
                    let penaltyType = empObj[empId]["penaltyType"];
                    let reason = empObj[empId]["reason"];
                    let amount = empObj[empId]["amount"];
                    dbPath = "Employees/" + createdBy + "/GeneralDetails/name";
                    let empInstance = this.db.object(dbPath).valueChanges().subscribe(
                      empData => {
                        empInstance.unsubscribe();
                        if (empData != null) {
                          createdBy = empData;
                        }
                        this.penaltyList.push({ name: name, empId: empId, date: date, amount: amount, createdOn: createdOn, penaltyType: penaltyType, reason: reason, createdBy: createdBy });
                      }
                    );
                  });
                }
              }
            }
          }
          setTimeout(() => {
            this.createJSON(this.penaltyList);
          }, 18000);
          //this.saveJsonFile(data);
        }
      }
    );
  }


  createJSON(workDetailList: any) {
    if (workDetailList.length > 0) {
      workDetailList = workDetailList.sort((a, b) =>
        b.orderBy > a.orderBy ? -1 : 1
      );
      const data = [];
      const map = new Map();
      for (const item of workDetailList) {
        if (!map.has(item.date)) {
          map.set(item.date, true);    // set any value to Map
          data.push(item.date);
        }
      }
      if (data.length > 0) {
        const objDate = {}
        for (let i = 0; i < data.length; i++) {
          let date = data[i];
          let list = workDetailList.filter(item => item.date == date);
          if (list.length > 0) {

            const aa = []
            for (let j = 0; j < list.length; j++) {
              let date = list[j]["date"];
              let list2 = list.filter(item => item.date == date);
              const bb = [];
              if (list2.length > 0) {
                for (let k = 0; k < list2.length; k++) {
                  bb.push({ name: list2[k]["name"], empId: list2[k]["empId"], amount: list2[k]["amount"], createdOn: list2[k]["createdOn"], penaltyType: list2[k]["penaltyType"], reason: list2[k]["reason"], createdBy: list2[k]["createdBy"] });
                }
              }
              objDate[date] = bb;
              aa[j] = objDate[date];
            }
          }
        }
        this.saveJsonFile(objDate);

      }
    }
    else {
      $('#divLoader').hide();
    }
  }


  saveJsonFile(listArray: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + this.commonService.getFireStoreCity() + "/Penality/" + this.selectedYear + "/" + this.selectedMonthName + ".json";

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
    this.commonService.setAlertMessage("success", "Data updated successfully !!!");
    $('#divLoader').hide();
  }

}
