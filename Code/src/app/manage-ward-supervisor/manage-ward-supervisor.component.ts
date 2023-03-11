import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from "../services/common/common.service";
@Component({
  selector: 'app-manage-ward-supervisor',
  templateUrl: './manage-ward-supervisor.component.html',
  styleUrls: ['./manage-ward-supervisor.component.scss']
})
export class ManageWardSupervisorComponent implements OnInit {
supervisorList:any[]=[];
wardList:any[]=[];
constructor(private http:HttpClient,public actRoute:ActivatedRoute,private commonService: CommonService) { }
ngOnInit() {
    this.wardList = JSON.parse(localStorage.getItem("markingWards"));
    this.getSupervisor()
  }
getSupervisor(){
 const path=this.commonService.fireStoragePath+"VehicleMaintenence%2FMasters%2Fward-supervisor%2Fward-supervisor.json?alt=media"
  let supervisorInstance=this.http.get(path).subscribe((supervisorJsondata)=>{
  supervisorInstance.unsubscribe();
  let keyArray = Object.keys(supervisorJsondata);
  for (let i = 0; i < keyArray.length; i++) {
    let key = keyArray[i];
    if (key != "lastKey"){
     
      let supervisor=supervisorJsondata[key]["supervisor"];
      this.supervisorList.push({supervisor:supervisor, key: key })
    }
  }
  this.supervisorList=[];
    if(this.wardList.length > 0) {
    for (let i = 0; i < this.wardList.length; i++) {
      let wardNo = this.wardList[i]["zoneNo"];
    
      this.supervisorList.push({ wardNo: wardNo});


    }}})
}


 
}
