import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { CommonService } from '../services/common/common.service';
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import { query } from 'chartist';
import { min } from 'rxjs/operators';

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
  allTaskList: any[];
  summaryList: any[];
  empID: any;
  empLocation: any;
  isFirst: any;
  taskData: taskDatail =
    {
      totalMinutes: "0"
    }

  ngOnInit() {
    this.isFirst = false;
    this.cityName = localStorage.getItem('cityName');
    this.userId = localStorage.getItem('userID');
    this.empID = localStorage.getItem('officeAppUserId');
    this.empLocation = localStorage.getItem('empLocation');
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
      .doc("" + this.empLocation + "/Defaults/OfficeTask/Module")
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
      .doc("" + this.empLocation + "/Defaults/OfficeTask/Category")
      .get()
      .subscribe((ss) => {
        let categoriesArrayList = ss.get("Office");
        for (let i = 0; i < categoriesArrayList.length; i++) {
          this.categoryList.push({ category: categoriesArrayList[i] });
        }
      });
  }

  getTaskList() {
    console.log("gsgsdh");
    let date = $('#txtDate').val();
    let year = $('#ddlYear').val();
    let month = $('#ddlMonth').val();
    let project = $('#ddlCategory').val();
    if (date != "") {
      date = date.toString().split('-')[2] + '-' + date.toString().split('-')[1] + '-' + date.toString().split('-')[0];
    }
    if (month != "0") {
      month = this.commonService.getCurrentMonthName(Number(month) - 1);
    }

    const userTaskLists = [];

    if (this.isFirst == false) {
      this.isFirst = true;
      let filterRef = this.dbFireStore.doc("" + this.empLocation + "/TaskManagement").collection("Tasks", ref => ref.where('empID', '==', this.empID).where('date', '==', date));

      filterRef.get().subscribe((ss) => {
        let todayDate = date = this.toDayDate.toString().split('-')[2] + '-' + this.toDayDate.toString().split('-')[1] + '-' + this.toDayDate.toString().split('-')[0];
        let i = 0;
        let totalMinutes = 0;
        ss.forEach(function (doc) {
          i = i + 1;
          totalMinutes += Number(doc.data()["timeInMinutes"]);
          userTaskLists.push({ sno: i, key: doc.id, category: doc.data()["category"], date: doc.data()["date"], project: doc.data()["project"], task: doc.data()["task"], description: doc.data()["description"], timeInMinutes: doc.data()["timeInMinutes"], todayDate: todayDate });
        });
        this.taskData.totalMinutes = totalMinutes.toString();
        this.userTaskList = userTaskLists;
      });
    }
    else {
      let filterRef = this.dbFireStore.doc("" + this.empLocation + "/TaskManagement").collection("Tasks", ref => {
        let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
        if (this.empID) { query = query.where('empID', '==', this.empID) };
        if (date != "") { query = query.where('date', '==', date) };
        if (year != "0") { query = query.where('year', '==', year) };
        if (month != "0") { query = query.where('month', '==', month) };
        if (project != "0") { query = query.where('project', '==', project) };
        return query;
      });

      filterRef.get().subscribe((ss) => {
        let todayDate = date = this.toDayDate.toString().split('-')[2] + '-' + this.toDayDate.toString().split('-')[1] + '-' + this.toDayDate.toString().split('-')[0];
        let i = 0;
        let totalMinutes = 0;
        ss.forEach(function (doc) {
          i = i + 1;
          totalMinutes += Number(doc.data()["timeInMinutes"]);
          userTaskLists.push({ sno: i, key: doc.id, category: doc.data()["category"], date: doc.data()["date"], project: doc.data()["project"], task: doc.data()["task"], description: doc.data()["description"], timeInMinutes: doc.data()["timeInMinutes"], todayDate: todayDate });
        });
        this.taskData.totalMinutes = totalMinutes.toString();
        this.userTaskList = userTaskLists;
      });
    }
  }


  getSummary() {
    this.summaryList = [];
    this.allTaskList = [];
    const allTaskLists = [];
    let year = $('#ddlYearSummary').val();
    let month = $('#ddlMonthSummary').val();
    let project = $('#ddlCategorySummary').val();

    if (month != "0") {
      month = this.commonService.getCurrentMonthName(Number(month) - 1);
    }
    let filterRef = this.dbFireStore.doc("" + this.empLocation + "/TaskManagement").collection("Tasks", ref => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      if (this.empID) { query = query.where('empID', '==', this.empID) };
      if (year != "0") { query = query.where('year', '==', year) };
      if (month != "0") { query = query.where('month', '==', month) };
      if (project != "0") { query = query.where('project', '==', project) };
      return query;
    });

    filterRef.get().subscribe((ss) => {
      let i = 0;
      let totalMinutes = 0;
      ss.forEach(function (doc) {
        i = i + 1;
        totalMinutes += Number(doc.data()["timeInMinutes"]);
        allTaskLists.push({ sno: i, key: doc.id, category: doc.data()["category"], date: doc.data()["date"], project: doc.data()["project"], task: doc.data()["task"], description: doc.data()["description"], timeInMinutes: doc.data()["timeInMinutes"] });
      });
      this.taskData.totalMinutes = totalMinutes.toString();
      this.allTaskList = allTaskLists;
      if (this.allTaskList.length > 0) {
        for (let i = 0; i < this.allTaskList.length; i++) {
          let project = this.allTaskList[i]["project"];
          let time = Number(this.allTaskList[i]["timeInMinutes"]);
          let task = this.allTaskList[i]["task"];
          let category = this.allTaskList[i]["category"];
          let summaryDetails = this.summaryList.find(item => item.project == this.allTaskList[i]["project"]);
          if (summaryDetails == undefined) {
            let categoryList = [];
            categoryList.push({ category: category, min: time });
            let taskList = [];
            taskList.push({ task: task, min: time, categoryList });
            this.summaryList.push({ project: project, min: time, taskList });
          }
          else {
            summaryDetails.min = Number(summaryDetails.min) + time;
            let taskList = summaryDetails.taskList;
            let taskDetails = taskList.find(item => item.task == this.allTaskList[i]["task"]);
            if (taskDetails != undefined) {
              taskDetails.min = Number(taskDetails.min) + time;
              let categoryList = taskDetails.categoryList;
              let categoryDetails = categoryList.find(item => item.category == this.allTaskList[i]["category"]);
              if (categoryDetails != undefined) {
                categoryDetails.min = Number(categoryDetails.min) + time;
              }
              else {
                categoryList.push({ category: category, min: time });
              }
            }
            else {
              let categoryList = [];
              categoryList.push({ category: category, min: time });
              taskList.push({ task: task, min: time, categoryList: categoryList });
            }
          }
        }
      }
    });
  }

  resetAllFilter() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    $('#ddlCategory').val("0");
    $('#txtDate').val("");
    this.getTaskList();
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    if (type == "task") {
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
    else {
      let height = windowHeight * 90 / 100;
      let width = 550;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $('div .modal-content').parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
      $('div .modal-content').css("height", height + "px").css("width", "" + width + "px");
      $('div .modal-dialog-centered').css("margin-top", "26px");
      setTimeout(() => {
        $('#ddlYearSummary').val(this.selectedYear);
        $('#ddlMonthSummary').val(this.selectedMonth);
        this.getSummary();
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
    if($('#drpProject').val()=="0")
    {
      this.commonService.setAlertMessage("error","Please select Project");
      return;
    }
    if($('#drpTask').val()=="0")
    {
      this.commonService.setAlertMessage("error","Please select Task");
      return;
    }
    if($('#drpCategory').val()=="0")
    {
      this.commonService.setAlertMessage("error","Please select Category");
      return;
    }
    if($('#estmateTime').val()=="")
    {
      this.commonService.setAlertMessage("error","Please select Estimate Time");
      return;
    }
    if($('#txtDescription').val()=="")
    {
      this.commonService.setAlertMessage("error","Please select Task Description");
      return;
    }
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
      this.dbFireStore.doc("" + this.empLocation + "/TaskManagement").collection("Tasks").add(data);
      this.commonService.setAlertMessage("success", "Task added successfully!!!");
    }
    else {
      this.dbFireStore.doc("" + this.empLocation + "/TaskManagement").collection("Tasks").doc(key.toString()).update(data);
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
    this.dbFireStore.doc("" + this.empLocation + "/TaskManagement").collection("Tasks").doc(id.toString()).delete();
    this.commonService.setAlertMessage("success", "Task deleted successfully!!!");
    setTimeout(() => {
      this.getTaskList();
    }, 600);
  }
}


export class taskDatail {
  totalMinutes: string;
}
