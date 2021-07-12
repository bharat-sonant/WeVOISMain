import { OrderByPipe } from './../order-by.pipe';
import { LineCardMappingComponent } from "./../line-card-mapping/line-card-mapping.component";
import { Component, OnInit } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { AngularFireDatabase } from "angularfire2/database";
import { CommonService } from "../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFirestore } from "@angular/fire/firestore";

@Component({
  selector: "app-task-manager",
  templateUrl: "./task-manager.component.html",
  styleUrls: ["./task-manager.component.scss"],
})
export class TaskManagerComponent implements OnInit {
  constructor(
    private router: Router,
    public db: AngularFireDatabase,
    private commonService: CommonService,
    public dbFireStore: AngularFirestore,
    private modalService: NgbModal
  ) {}
  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  yearList: any[] = [];
  userId: any;
  cityName: any;
  mainList: any[] = [];
  catList: any[] = [];
  projList: any[] = [];
  projectList: any[] = [];
  taskList: any[] = [];
  categoryList: any[] = [];
  modulesObject: any;
  userTaskList: any[];
  allTaskList: any[];
  summaryList: any[];
  userList: any[] = [];
  empID: any;
  empLocation: any;
  isFirst: any;
  isTaskManager: any;
  taskData: taskDatail = {
    totalMinutes: "0",
  };

  ngOnInit() {
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );
    this.isFirst = false;
    this.cityName = localStorage.getItem("cityName");
    this.userId = localStorage.getItem("userID");
    this.empID = localStorage.getItem("officeAppUserId");
    this.empLocation = localStorage.getItem("empLocation");
    this.isTaskManager = localStorage.getItem("isTaskManager");
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split("-")[1];
    this.selectedYear = this.toDayDate.split("-")[0];
    $("#ddlMonth").val(this.selectedMonth);
    $("#ddlYear").val(this.selectedYear);
    $("#txtDate").val(this.toDayDate);
    this.fillDropdown();
    this.fillUsers();
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split("-")[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  fillDropdown() {
    this.dbFireStore
      .collection("UserManagement")
      .doc("TaskManagement")
      .collection("Tasks")
      .get()
      .subscribe((ss) => {
        ss.forEach((doc) => {
          this.mainList.push({ mainCat: doc.id });
        });
      });
  }

  getCategory(id: any) {
    this.categoryList = [];
    this.dbFireStore
      .collection("UserManagement")
      .doc("TaskManagement")
      .collection("Tasks")
      .doc(id)
      .get()
      .subscribe((ss) => {
        let catList = ss.data()["Category"];
        for (let i = 0; i < catList.length; i++) {
          this.categoryList.push({ category: catList[i] });
        }
      });
  }

  getProjects(id: any, project: any) {
    this.projectList = [];
    this.dbFireStore
      .collection("UserManagement")
      .doc("TaskManagement")
      .collection("Tasks")
      .doc(id)
      .collection("Modules")
      .get()
      .subscribe((ss) => {
        ss.forEach((doc) => {
          this.projectList.push({
            project: doc.id,
            taskList: doc.data()["Modules"],
          });
        });
        this.getTask(project);
      });

    this.getCategory(id);
  }

  fillUsers() {
    this.taskData.totalMinutes = "0";
    this.userList = [];
    this.userTaskList = [];
    if (this.isTaskManager == "1") {
      $("#showName").show();
      $("#ddlUsers").show();
      this.dbFireStore
        .collection("UserManagement")
        .doc("Users")
        .collection("TaskUsers")
        .get()
        .subscribe((ss) => {
          ss.forEach((doc) => {
            this.userList.push({
              empID: doc.id,
              name: doc.data()["name"],
            });
            this.getEmployeeTaskList(doc.id, doc.data()["name"], "1");
          });
        });
    } else {
      $("#showName").hide();
      $("#ddlUsers").hide();
      this.userList.push({
        empID: this.empID,
        name: localStorage.getItem("userName"),
      });
      setTimeout(() => {
        $("#ddlUsers").val(this.empID);
        this.getEmployeeTaskList(
          this.empID,
          localStorage.getItem("userName"),
          "0"
        );
      }, 100);
    }
  }

  getTaskList() {
    this.taskData.totalMinutes = "0";
    let empID = $("#ddlUsers").val();
    console.log(empID);
    this.userTaskList = [];
    if (this.isTaskManager == "0") {
      this.getEmployeeTaskList(empID, localStorage.getItem("userName"), "0");
    } else {
      if (empID == "0") {
        for (let i = 0; i < this.userList.length; i++) {
          this.getEmployeeTaskList(
            this.userList[i]["empID"],
            this.userList[i]["name"],
            "1"
          );
        }
      } else {
        let userDetail = this.userList.find((item) => item.empID === empID);
        if (userDetail != undefined) {
          this.getEmployeeTaskList(empID, userDetail.name, "1");
        }
      }
    }
  }

  getEmployeeTaskList(empID: any, name: any, isNameShow: any) {
    this.userTaskList = [];
    let date = $("#txtDate").val();
    let year = $("#ddlYear").val();
    let month = $("#ddlMonth").val();
    let project = $("#ddlCategory").val();
    if (date != "") {
      date =
        date.toString().split("-")[2] +
        "-" +
        date.toString().split("-")[1] +
        "-" +
        date.toString().split("-")[0];
    }
    if (month != "0") {
      month = this.commonService.getCurrentMonthName(Number(month) - 1);
    }

    const userTaskLists = [];

    let filterRef = this.dbFireStore
      .doc("UserManagement/TaskManagement")
      .collection("UserTasks", (ref) => {
        let query:
          | firebase.firestore.CollectionReference
          | firebase.firestore.Query = ref;
        if (empID) {
          query = query.where("empID", "==", empID);
        }
        if (date != "") {
          query = query.where("date", "==", date);
        }
        if (year != "0") {
          query = query.where("year", "==", year);
        }
        if (month != "0") {
          query = query.where("month", "==", month);
        }
        if (project != "0") {
          query = query.where("project", "==", project);
        }
       // query=query.orderBy('date');
        return query;
      });

    filterRef.get().subscribe((ss) => {
      let todayDate = (date =
        this.toDayDate.toString().split("-")[2] +
        "-" +
        this.toDayDate.toString().split("-")[1] +
        "-" +
        this.toDayDate.toString().split("-")[0]);
      let i = 0;
      let totalMinutes = 0;
      ss.forEach(function (doc) {
        i = i + 1;
        totalMinutes += Number(doc.data()["timeInMinutes"]);
        userTaskLists.push({
          sno: i,
          key: doc.id,
          category: doc.data()["category"],
          date: doc.data()["date"],
          project: doc.data()["project"],
          task: doc.data()["task"],
          description: doc.data()["description"],
          timeInMinutes: doc.data()["timeInMinutes"],
          todayDate: todayDate,
          status: doc.data()["status"],
          remark: doc.data()["remark"],
          empID: doc.data()["empID"],
          month: doc.data()["month"],
          year: doc.data()["year"],
          name: name,
          isNameShow: isNameShow,
          taskFor: doc.data()["taskFor"],
        });
      });
      this.taskData.totalMinutes = (
        Number(this.taskData.totalMinutes) + Number(totalMinutes)
      ).toString();
      if (userTaskLists.length > 0) {
        for (let i = 0; i < userTaskLists.length; i++) {
          this.userTaskList.push({
            sno: userTaskLists[i]["sno"],
            key: userTaskLists[i]["key"],
            category: userTaskLists[i]["category"],
            date: userTaskLists[i]["date"],
            project: userTaskLists[i]["project"],
            task: userTaskLists[i]["task"],
            description: userTaskLists[i]["description"],
            timeInMinutes: userTaskLists[i]["timeInMinutes"],
            todayDate: todayDate,
            status: userTaskLists[i]["status"],
            remark: userTaskLists[i]["remark"],
            empID: userTaskLists[i]["empID"],
            month: userTaskLists[i]["month"],
            year: userTaskLists[i]["year"],
            name: userTaskLists[i]["name"],
            isNameShow: userTaskLists[i]["isNameShow"],
            taskFor: userTaskLists[i]["taskFor"],
          });
        }
      }
       this.userTaskList = this.commonService.transformNumeric(this.userTaskList,'date');
    });
  }

  resetAllFilter() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedMonth = this.toDayDate.split("-")[1];
    this.selectedYear = this.toDayDate.split("-")[0];
    $("#ddlMonth").val(this.selectedMonth);
    $("#ddlYear").val(this.selectedYear);
    if (this.isTaskManager == "1") {
      $("#ddlUsers").val("0");
    }
    $("#ddlCategory").val("0");
    $("#txtDate").val("");
    this.getTaskList();
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    if (type == "task") {
      let height = 490;
      let width = 350;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content")
        .parent()
        .css("max-width", "" + width + "px")
        .css("margin-top", marginTop);
      $("div .modal-content")
        .css("height", height + "px")
        .css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      if (id != "0") {
        let taskDetails = this.userTaskList.find((item) => item.key == id);
        if (taskDetails != undefined) {
          $("#key").val(id);
          let taskFor = taskDetails.taskFor;
          let project = taskDetails.project;
          let category = taskDetails.category;
          let task = taskDetails.task;
          let status = taskDetails.status;
          let remark = taskDetails.remark;
          this.getProjects(taskFor, project);
          this.getTask(project);
          setTimeout(() => {
            $("#remark").val(remark);
            $("#status").val(status);
            $("#drpProject").val(project);
            $("#drpCategory").val(category);
            $("#drpFor").val(taskFor);
            $("#drpTask").val(task);
            $("#estmateTime").val(taskDetails.timeInMinutes);
            $("#txtDescription").val(taskDetails.description);
          }, 1000);
        }
      }
    } else if (type == "status") {
      let height = 350;
      let width = 350;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content")
        .parent()
        .css("max-width", "" + width + "px")
        .css("margin-top", marginTop);
      $("div .modal-content")
        .css("height", height + "px")
        .css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      let taskDetails = this.userTaskList.find((item) => item.key == id);
      if (taskDetails != undefined) {
        $("#key").val(id);
        $("#drpStatus").val(taskDetails.status);
        $("#txtRemark").val(taskDetails.remark);
      }
    } else {
      let height = (windowHeight * 90) / 100;
      let width = 400;
      let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
      $("div .modal-content")
        .parent()
        .css("max-width", "" + width + "px")
        .css("margin-top", marginTop);
      $("div .modal-content")
        .css("height", height + "px")
        .css("width", "" + width + "px");
      $("div .modal-dialog-centered").css("margin-top", "26px");
      setTimeout(() => {
        $("#ddlYearSummary").val(this.selectedYear);
        $("#ddlMonthSummary").val(this.selectedMonth);
        this.getSummary();
      }, 600);
    }
  }

  closeModel() {
    this.summaryList = [];
    this.modalService.dismissAll();
  }

  getTask(id: any) {
    this.taskList = [];
    let projectDetails = this.projectList.find((item) => item.project == id);
    if (projectDetails != undefined) {
      let taskList = projectDetails.taskList;
      for (let i = 0; i < taskList.length; i++) {
        this.taskList.push({ task: taskList[i] });
      }
    }
  }

  saveTask() {
    let key = $("#key").val();
    let status = $("#status").val();
    let remark = $("#remark").val();
    if ($("#drpFor").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Task For");
      return;
    }
    if ($("#drpProject").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Project");
      return;
    }
    if ($("#drpTask").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Task");
      return;
    }
    if ($("#drpCategory").val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Category");
      return;
    }
    if ($("#estmateTime").val() == "") {
      this.commonService.setAlertMessage(
        "error",
        "Please select Estimate Time"
      );
      return;
    }
    if ($("#txtDescription").val() == "") {
      this.commonService.setAlertMessage(
        "error",
        "Please select Task Description"
      );
      return;
    }
    let category = $("#drpCategory").val();
    let date =
      this.toDayDate.split("-")[2] +
      "-" +
      this.toDayDate.split("-")[1] +
      "-" +
      this.toDayDate.split("-")[0];
    let description = $("#txtDescription").val();
    let empID = this.empID;
    let month = this.commonService.getCurrentMonthName(
      Number(this.toDayDate.toString().split("-")[1]) - 1
    );
    let taskFor = $("#drpFor").val();
    let project = $("#drpProject").val();
    let task = $("#drpTask").val();
    let timeInMinutes = $("#estmateTime").val();
    let year = this.toDayDate.toString().split("-")[0];
    const data = {
      taskFor: taskFor,
      category: category,
      date: date,
      description: description,
      empID: empID,
      month: month,
      project: project,
      task: task,
      timeInMinutes: timeInMinutes,
      year: year,
      status: status,
      remark: remark,
    };
    if (key == "0") {
      this.dbFireStore
        .doc("UserManagement/TaskManagement")
        .collection("UserTasks")
        .add(data);

      this.dbFireStore
        .collection("UserManagement")
        .doc("Users")
        .collection("TaskUsers")
        .doc(this.empID)
        .get()
        .subscribe((ss) => {
          if (ss.data() == null) {
            const data = {
              name: localStorage.getItem("userName"),
            };
            this.dbFireStore
              .collection("UserManagement")
              .doc("Users")
              .collection("TaskUsers")
              .doc(this.empID)
              .set(data);
          }
        });

      this.commonService.setAlertMessage(
        "success",
        "Task added successfully!!!"
      );
    } else {
      this.dbFireStore
        .doc("UserManagement/TaskManagement")
        .collection("UserTasks")
        .doc(key.toString())
        .update(data);
      this.commonService.setAlertMessage(
        "success",
        "Task updated successfully!!!"
      );
    }
    $("#key").val("0");
    $("#remark").val("");
    $("#status").val("In Progress");
    $("#drpFor").val("0");
    $("#drpCategory").val("0");
    $("#drpProject").val("0");
    $("#drpTask").val("0");
    $("#txtDescription").val("");
    $("#estmateTime").val("");
    this.closeModel();
    this.getTaskList();
  }

  //#region Task Status

  delete(id: any) {
    this.dbFireStore
      .doc("UserManagement/TaskManagement")
      .collection("UserTasks")
      .doc(id.toString())
      .delete();
    this.commonService.setAlertMessage(
      "success",
      "Task deleted successfully!!!"
    );
    setTimeout(() => {
      this.getTaskList();
    }, 600);
  }

  saveTaskStatus() {
    let key = $("#key").val();
    let status = $("#drpStatus").val();
    let remark = $("#txtRemark").val();
    if (status == "0") {
      this.commonService.setAlertMessage("error", "Please select Task status");
      return;
    }
    let taskDetails = this.userTaskList.find((item) => item.key == key);
    if (taskDetails != undefined) {
      taskDetails.status = status;
      taskDetails.remark = remark;
    }

    this.dbFireStore
      .doc("UserManagement/TaskManagement")
      .collection("UserTasks")
      .doc(key.toString())
      .update({ status: status, remark: remark });
    this.commonService.setAlertMessage(
      "success",
      "Task status updated successfully!!!"
    );
    this.closeModel();
  }
  //#endregion

  //#region Summary

  getSummary() {
    let empID = $("#ddlUsers").val();
    this.summaryList = [];
    this.allTaskList = [];
    const allTaskLists = [];
    let year = $("#ddlYearSummary").val();
    let month = $("#ddlMonthSummary").val();
    let project = $("#ddlCategorySummary").val();
    if (month != "0") {
      month = this.commonService.getCurrentMonthName(Number(month) - 1);
    }
    let filterRef = this.dbFireStore
      .doc("UserManagement/TaskManagement")
      .collection("UserTasks", (ref) => {
        let query:
          | firebase.firestore.CollectionReference
          | firebase.firestore.Query = ref;
        if (empID != "0") {
          query = query.where("empID", "==", empID);
        }
        if (year != "0") {
          query = query.where("year", "==", year);
        }
        if (month != "0") {
          query = query.where("month", "==", month);
        }
        // if (project != "0") {
        //   query = query.where("project", "==", project);
        // }
        return query;
      });

    filterRef.get().subscribe((ss) => {
      let i = 0;
      let totalMinutes = 0;
      ss.forEach(function (doc) {
        i = i + 1;
        // totalMinutes += Number(doc.data()["timeInMinutes"]);
        allTaskLists.push({
          sno: i,
          key: doc.id,
          category: doc.data()["category"],
          date: doc.data()["date"],
          project: doc.data()["project"],
          task: doc.data()["task"],
          description: doc.data()["description"],
          timeInMinutes: doc.data()["timeInMinutes"],
        });
      });
      //this.taskData.totalMinutes = totalMinutes.toString();
      this.allTaskList = allTaskLists;
      if (this.allTaskList.length > 0) {
        for (let i = 0; i < this.allTaskList.length; i++) {
          let project = this.allTaskList[i]["project"];
          let time = Number(this.allTaskList[i]["timeInMinutes"]);
          let task = this.allTaskList[i]["task"];
          let category = this.allTaskList[i]["category"];
          let summaryDetails = this.summaryList.find(
            (item) => item.project == this.allTaskList[i]["project"]
          );
          if (summaryDetails == undefined) {
            let categoryList = [];
            categoryList.push({ category: category, min: time });
            let taskList = [];
            taskList.push({ task: task, min: time, categoryList });
            this.summaryList.push({ project: project, min: time, taskList });
          } else {
            summaryDetails.min = Number(summaryDetails.min) + time;
            let taskList = summaryDetails.taskList;
            let taskDetails = taskList.find(
              (item) => item.task == this.allTaskList[i]["task"]
            );
            if (taskDetails != undefined) {
              taskDetails.min = Number(taskDetails.min) + time;
              let categoryList = taskDetails.categoryList;
              let categoryDetails = categoryList.find(
                (item) => item.category == this.allTaskList[i]["category"]
              );
              if (categoryDetails != undefined) {
                categoryDetails.min = Number(categoryDetails.min) + time;
              } else {
                categoryList.push({ category: category, min: time });
              }
            } else {
              let categoryList = [];
              categoryList.push({ category: category, min: time });
              taskList.push({
                task: task,
                min: time,
                categoryList: categoryList,
              });
            }
          }
        }
      }
    });
  }

  //#endregion
}

export class taskDatail {
  totalMinutes: string;
}
