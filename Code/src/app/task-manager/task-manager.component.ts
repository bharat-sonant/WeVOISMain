import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { CommonService } from '../services/common/common.service';
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { query } from 'chartist';

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.scss']
})
export class TaskManagerComponent implements OnInit {

  constructor(private router: Router, public db: AngularFireDatabase, private commonService: CommonService, public dbFireStore: AngularFirestore, private modalService: NgbModal) { }
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  yearList: any[] = [];
  userId: any;
  cityName: any;
  projectList: any[] = [];
  taskList: any[] = [];
  categoryList: any[] = [];
  modulesObject: any;
  userTaskList: any[];
  taskData: taskDatail =
    {
      totalMinutes: "0"
    }

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
    this.fillDropdown();
    this.getTaskList();
  }
  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  fillDropdown() {
    this.dbFireStore
      .doc("Jaipur/Defaults/OfficeTask/Module")
      .get()
      .subscribe((ss) => {
        this.modulesObject = ss;
        let keyArray = Object.keys(ss.data());
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            this.projectList.push({ project: keyArray[i] });
          }
        }
      });

    this.dbFireStore
      .doc("Jaipur/Defaults/OfficeTask/Category")
      .get()
      .subscribe((ss) => {
        let categoriesArrayList = ss.get("Office");
        for (let i = 0; i < categoriesArrayList.length; i++) {
          this.categoryList.push({ category: categoriesArrayList[i] });
        }
      });
  }

  getTaskList() {
    let date = $('#txtDate').val();
    date = date.toString().split('-')[2] + '-' + date.toString().split('-')[1] + '-' + date.toString().split('-')[0];
    const userTaskLists = [];

    let filterRef = this.dbFireStore.doc("Jaipur/TaskManagement").collection("Tasks", ref => ref.where('empID', '==', '108'));
    
    filterRef.get().subscribe((ss) => {
      let i = 0;
      let totalMinutes = 0;
      ss.forEach(function (doc) {
        i = i + 1;
        totalMinutes += Number(doc.data()["timeInMinutes"]);
        userTaskLists.push({ sno: i, key: doc.id, category: doc.data()["category"], date: doc.data()["date"], project: doc.data()["project"], task: doc.data()["task"], description: doc.data()["description"], timeInMinutes: doc.data()["timeInMinutes"] });
      });
      this.taskData.totalMinutes=totalMinutes.toString();
      this.userTaskList = userTaskLists;
    });
  }

  addNew(content: any, id: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let height = 490;
    let width = 350;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
    $('div .modal-dialog-centered').css("margin-top", "26px");
    if (id != "0") {
      setTimeout(() => {
        let taskDetails = this.userTaskList.find(item => item.key == id);
        if (taskDetails != undefined) {
          $('#key').val(id);
          let project = taskDetails.project;
          let category = taskDetails.category;
          let task = taskDetails.task;

          $('#drpProject').val(project);
          $('#drpCategory').val(category);
          this.taskList = [];

          let taskArrayList = this.modulesObject.get(project);
          for (let i = 0; i < taskArrayList.length; i++) {
            this.taskList.push({ task: taskArrayList[i] });
          }
          setTimeout(() => {
            $('#drpTask').val(task);
          }, 100);
          $('#estmateTime').val(taskDetails.timeInMinutes);
          $('#txtDescription').val(taskDetails.description);
        }
      }, 600);

    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  getTask(id: any) {
    this.taskList = [];
    if (id != "0") {
      let taskArrayList = this.modulesObject.get(id);
      for (let i = 0; i < taskArrayList.length; i++) {
        this.taskList.push({ task: taskArrayList[i] });
      }
    }
  }

  saveTask() {
    let key = $('#key').val();
    let category = $('#drpCategory').val();
    let date = this.toDayDate.split('-')[2] + "-" + this.toDayDate.split('-')[1] + "-" + this.toDayDate.split('-')[0];
    let description = $('#txtDescription').val();
    let empID = "108";
    let month = this.commonService.getCurrentMonthName(Number(this.toDayDate.toString().split('-')[1]) - 1);
    let project = $('#drpProject').val();
    let task = $('#drpTask').val();
    let timeInMinutes = $('#estmateTime').val();
    let year = this.toDayDate.toString().split('-')[0];
    const data = {
      category: category,
      date: date,
      description: description,
      empID: empID,
      month: month,
      project: project,
      task: task,
      timeInMinutes: timeInMinutes,
      year: year
    };
    if (key == "0") {
      this.dbFireStore.doc("Jaipur/TaskManagement").collection("Tasks").add(data);
      this.commonService.setAlertMessage("success", "Task added successfully!!!");
    }
    else {
      this.dbFireStore.doc("Jaipur/TaskManagement").collection("Tasks").doc(key.toString()).update(data);
      this.commonService.setAlertMessage("success", "Task updated successfully!!!");
    }
    $('#key').val("0");
    $('#drpCategory').val("0");
    $('#drpProject').val("0");
    $('#drpTask').val("0");
    $('#txtDescription').val("");
    $('#estmateTime').val("");
    this.closeModel();
    this.getTaskList();
  }

  delete(id: any) {
    const data = {
      category: null,
      date: null,
      description: null,
      empID: null,
      month: null,
      project: null,
      task: null,
      timeInMinutes: null,
      year: null
    };
    this.dbFireStore.doc("Jaipur/TaskManagement").collection("Tasks").doc(id.toString()).delete();
    this.commonService.setAlertMessage("success", "Task deleted successfully!!!");
    setTimeout(() => {
      this.getTaskList();
    }, 600);

  }
}


export class taskDatail {
  totalMinutes: string;
}
