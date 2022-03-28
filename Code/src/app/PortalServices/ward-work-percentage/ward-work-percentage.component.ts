import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-ward-work-percentage',
  templateUrl: './ward-work-percentage.component.html',
  styleUrls: ['./ward-work-percentage.component.scss']
})
export class WardWorkPercentageComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  
  db: any;
  cityName: any;
  selectedDate: any;
  zoneList:any[]=[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.selectedDate = this.commonService.setTodayDate();
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }

  saveData(){
    if($("#txtDate").val()==""){
      this.commonService.setAlertMessage("error","Please enter date !!!");
      return;
    }
    if($("#ddlZone").val()=="0"){
      this.commonService.setAlertMessage("error","Please select zone !!!");
      return;
    }
    if($("#txtPercentage").val()==""){
      this.commonService.setAlertMessage("error","Please enter expected percentage !!!");
      return;
    }
  }

}
