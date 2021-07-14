import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFirestore } from "@angular/fire/firestore";

@Component({
  selector: "app-task-management-masters",
  templateUrl: "./task-management-masters.component.html",
  styleUrls: ["./task-management-masters.component.scss"],
})
export class TaskManagementMastersComponent implements OnInit {
  constructor(
    private router: Router,
    private commonService: CommonService,
    public dbFireStore: AngularFirestore,
    private modalService: NgbModal
  ) {}

  mainTaskList: any[];
  categoryList: any[];
  projectList: any[];
  taskList: any[];
  isMaincatNew = false;
  isProjectNew = false;

  ngOnInit() {
    this.getMainTask();
  }

  getMainTask() {
    this.mainTaskList = [];
    this.categoryList = [];
    this.dbFireStore
      .collection("UserManagement")
      .doc("TaskManagement")
      .collection("Tasks")
      .get()
      .subscribe((ss) => {
        ss.forEach((doc) => {
          this.mainTaskList.push({ mainCat: doc.id });
        });
      });
  }

  addMainCategory() {
    if (this.isMaincatNew == false) {
      this.isMaincatNew = true;
      $("#txtMainCategory").show();
      $("#ddlMainCategory").hide();
      $("#addNewMainCategory").html("Reset");
    } else {
      this.isMaincatNew = false;
      $("#txtMainCategory").hide();
      $("#ddlMainCategory").show();
      $("#addNewMainCategory").html("add New");
    }
  }

  addCategory() {
    let mainCategory = "";
    let category = $("#txtCategory").val();
    if (this.isMaincatNew == false && $("#ddlMainCategory").val() == "0") {
      this.commonService.setAlertMessage(
        "error",
        "Please select Main Category !!!"
      );
      return;
    } else if (this.isMaincatNew == true && $("#txtMainCategory").val() == "") {
      this.commonService.setAlertMessage(
        "error",
        "Please enter Main Category !!!"
      );
      return;
    }
    if (category == "") {
      this.commonService.setAlertMessage("error", "Please enter Category !!!");
      return;
    }
    let catList = [];
    if (this.isMaincatNew == false) {
      mainCategory = $("#ddlMainCategory").val().toString();
    } else {
      mainCategory = $("#txtMainCategory").val().toString();
    }
    const data = {
      name: category
    };
    this.dbFireStore
      .collection("UserManagement")
      .doc("TaskManagement")
      .collection("Tasks")
      .doc(mainCategory.toString()).collection("Category").add(data);
    $("#ddlMainCategory").val("0");
    $("#txtMainCategory").val("");
    $("#txtCategory").val("");
    this.commonService.setAlertMessage(
      "success",
      "Category Added Successfully!!!"
    );
    this.isMaincatNew = false;
    this.addMainCategory();
  }

}
