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
  penaltyList:any[];
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
    this.getYear();
  }

  
  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  saveData(){
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
    if(this.selectedYear==this.toDayDate.split('-')[0] && this.selectedMonth==this.toDayDate.split('-')[1]){
      this.commonService.setAlertMessage("error","Sorry! you can not generate json for current year and current month !!!");
      return;
    }
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedMonth) - 1);
    let dbPath="Penalties/"+this.selectedYear+"/"+this.selectedMonthName;
    let penaltyInstance=this.db.object(dbPath).valueChanges().subscribe(
      data=>{
        penaltyInstance.unsubscribe();
        if(data!=null){
          this.saveJsonFile(data);
        }
      }
    );
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
