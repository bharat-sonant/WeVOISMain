import { Component, OnInit } from '@angular/core';
import { attachEmbeddedView } from '@angular/core/src/view';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../services/common/common.service';
import { Router } from '@angular/router'
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.scss']
})
export class TaskManagerComponent implements OnInit {

  constructor(private router: Router, public db: AngularFireDatabase, private commonService: CommonService, public dbFireStore: AngularFirestore) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  yearList: any[] = [];
  userId: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    this.userId = localStorage.getItem('userID');
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    $('#txtDate').val(this.toDayDate);

    const ref = this.dbFireStore.collection('Jaipur');
    console.log(ref);
    let taskCategorysss = ref.doc("Defaults").collection("OfficeTask").doc('Module');
    //const collections = taskCategorysss.listCollections();
    console.log(taskCategorysss);
    let taskCategorys = ref.doc("Defaults").collection("OfficeTask").doc('Module').snapshotChanges().subscribe(
      data1=>{
        console.log(data1);
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



}
