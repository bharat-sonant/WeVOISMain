import { Component, OnInit } from '@angular/core';
import { CommonService } from "../services/common/common.service";
import { FirebaseService } from "../firebase.service";

@Component({
  selector: 'app-cms1',
  templateUrl: './cms1.component.html',
  styleUrls: ['./cms1.component.scss']
})
export class Cms1Component implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  db: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
  }

  setData() {
    let dbPath = "WastebinMonitor/ImagesData/2021-10-01";
    let dataInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        dataInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let transferIndex=0;
            let openIndex=0;
            let litterIndex=0;
            let roadIndex=0;
            let addindex=0;
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              if (data[index]["category"] != null) {
                let dataObject = data[index];
                let category = data[index]["category"];
                if(category=="1"){
                  transferIndex=transferIndex+1;
                  addindex=transferIndex;
                } else if(category=="2"){
                  openIndex=openIndex+1;
                  addindex=openIndex;
                } else if(category=="3"){
                  litterIndex=litterIndex+1;
                  addindex=litterIndex;
                } else if(category=="4"){
                  roadIndex=roadIndex+1;
                  addindex=roadIndex;
                }
                dbPath = "WastebinMonitor/ImagesData/2021/October/2021-10-01/" + category + "/" + addindex;
                this.db.object(dbPath).update(dataObject);
              }
            }
          }
        }
      }
    );

  }

}
