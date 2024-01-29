import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { FirebaseService } from "../../firebase.service";

@Injectable({
  providedIn: 'root'
})
export class BackEndServiceUsesHistoryService {
  fsDb: any;
  constructor(private commonService: CommonService, public fs: FirebaseService) { }

  saveBackEndFunctionCallingHistory(serviceFileName: any, functionName: any) {
    let date = this.commonService.setTodayDate();
    let year = date.split("-")[0];
    let month = this.commonService.getCurrentMonthShortName(Number(date.split('-')[1]));
    this.updateCounts("BackEndFunctionCallingHistory/History/" + serviceFileName + "/" + functionName + "/" + year + "/" + month + "/" + date + "/count",1);
    this.updateCounts("BackEndFunctionCallingHistory/History/" + serviceFileName + "/" + functionName + "/" + year + "/" + month + "/count",1);
    this.updateCounts("BackEndFunctionCallingHistory/Summary/" + serviceFileName + "/" + functionName + "/count",1);
  }

  saveBackEndFunctionDataUsesHistory(serviceFileName:any,functionName:any,data:any){
    let date=this.commonService.setTodayDate();
    let year=date.split("-")[0];
    let month=this.commonService.getCurrentMonthShortName(Number(date.split('-')[1]));
    let dataSize=null;
    if(data!==null) {
        const jsonString=JSON.stringify(data);
        //  Calculate the size of the JSON string in bytes
        let dataSizeInBytes=new TextEncoder().encode(jsonString).length;
        let dataSizeInKb=(dataSizeInBytes/1024).toFixed(4);
        dataSize=dataSizeInKb;
    }
    if(dataSize!==null) {
        // update total data size
        this.updateDataSize("BackEndFunctionCallingHistory/History/"+serviceFileName+"/"+functionName+"/"+year+"/"+month+"/"+date+"/dataSize",dataSize);
        this.updateDataSize("BackEndFunctionCallingHistory/History/"+serviceFileName+"/"+functionName+"/"+year+"/"+month+"/dataSize",dataSize);
        this.updateDataSize("BackEndFunctionCallingHistory/Summary/"+serviceFileName+"/"+functionName+"/dataSize",dataSize);
    }
};

  updateCounts(path: any, count: any) {
    this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    const countRef = this.fsDb.object(path);
    countRef.query.ref.transaction(current => (current || 0) + count);
  }

  updateDataSize(path: any, increment: any) {
    this.fsDb = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    const countRef = this.fsDb.object(path);
    countRef.query.ref.transaction(current => Number(((Number(current) || 0) + Number(increment)).toFixed(4)));
  }
}
