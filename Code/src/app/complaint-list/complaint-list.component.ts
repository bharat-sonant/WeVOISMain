import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-complaint-list',
  templateUrl: './complaint-list.component.html',
  styleUrls: ['./complaint-list.component.scss']
})
export class ComplaintListComponent implements OnInit {
complainList:any[]=[];
  constructor(private http:HttpClient) { }

  ngOnInit() {
    this.getComplaint()
  }
getComplaint(){
  let path="https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/"+"Jaipur-Malviyanagar%2Fcity%2FComplaintrequest%2FComplaintrequest.json?alt=media"
  let complainInstance=this.http.get(path).subscribe((complainJsondata)=>{
    complainInstance.unsubscribe();
    let keyArray=Object.keys(complainJsondata);
    for(let i=0;i<keyArray.length;i++){
      let key=keyArray[i];
      if (key != "lastKey"){
      let date=complainJsondata[key]["date"];
      let complaintype=complainJsondata[key]["complaintype"];
      let zone=complainJsondata[key]["zone"];
      let name=complainJsondata[key]["name"];
      let message=complainJsondata[key]["message"];     
this.complainList.push({date:date,complaintype:complaintype,zone:zone,
  name:name,message:message,key:key})
    }}
  })
}}

