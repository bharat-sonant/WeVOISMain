import { Component, OnInit } from "@angular/core";
import { CommonService } from "../../services/common/common.service";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFirestore } from "@angular/fire/firestore";
import { HtmlAstPath } from "@angular/compiler";

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
  projectCategoryList: any[];
  moduleProjectList: any[];
  taskList: any[];
  isMaincatNew = false;
  isProjectNew = false;

  ngOnInit() {
    this.setActiveTab("Category");
    this.getMainTask();
  }

  setActiveTab(tab: any) {
    $("#Department").hide();
    $("#Category").hide();
    $("#Projects").hide();
    $("#Modules").hide();

    let element = <HTMLButtonElement>document.getElementById("tabDepartment");
    let className = element.className;
    $("#tabDepartment").removeClass(className);
    $("#tabDepartment").addClass("tablink");

    element = <HTMLButtonElement>document.getElementById("tabCategory");
    className = element.className;
    $("#tabCategory").removeClass(className);
    $("#tabCategory").addClass("tablink");

    element = <HTMLButtonElement>document.getElementById("tabProjects");
    className = element.className;
    $("#tabProjects").removeClass(className);
    $("#tabProjects").addClass("tablink");

    element = <HTMLButtonElement>document.getElementById("tabModules");
    className = element.className;
    $("#tabModules").removeClass(className);
    $("#tabModules").addClass("tablink");

    if (tab == "Department") {
      $("#Department").show();
      element = <HTMLButtonElement>document.getElementById("tabDepartment");
      className = element.className;
      $("#tabDepartment").removeClass(className);
      $("#tabDepartment").addClass("tablink active-tab");
    } else if (tab == "Category") {
      $("#Category").show();
      element = <HTMLButtonElement>document.getElementById("tabCategory");
      className = element.className;
      $("#tabCategory").removeClass(className);
      $("#tabCategory").addClass("tablink active-tab");
    } else if (tab == "Projects") {
      $("#Projects").show();
      element = <HTMLButtonElement>document.getElementById("tabProjects");
      className = element.className;
      $("#tabProjects").removeClass(className);
      $("#tabProjects").addClass("tablink active-tab");
    } else if (tab == "Modules") {
      $("#Modules").show();
      element = <HTMLButtonElement>document.getElementById("tabModules");
      className = element.className;
      $("#tabModules").removeClass(className);
      $("#tabModules").addClass("tablink active-tab");
    }
  }

  getMainTask() {
    this.mainTaskList = [];
    this.categoryList = [];
    this.projectList = [];
    this.taskList = [];
    this.moduleProjectList = [];
    this.dbFireStore
      .collection("UserManagement")
      .doc("TaskManagement")
      .collection("Tasks")
      .get()
      .subscribe((ss) => {
        ss.forEach((doc) => {
          this.mainTaskList.push({ mainCat: doc.id });
          let mainCategory = doc.id;
          //for category list
          const refCategory = doc.ref.path + "/Category";
          this.dbFireStore
            .collection(refCategory)
            .get()
            .subscribe((cat) => {
              cat.forEach((catDoc) => {
                let id = catDoc.id;
                let name = catDoc.data()["name"];
                this.categoryList.push({
                  mainCategory: mainCategory,
                  id: id,
                  name: name,
                });
              });
            });
          // for Project List
          const refProject = doc.ref.path + "/Projects";
          this.dbFireStore
            .collection(refProject)
            .get()
            .subscribe((project) => {
              project.forEach((projectDoc) => {
                let project = projectDoc.id;
                let projectCategory = "";
                let projectCategoryId = "";
                if (projectDoc.data()["Category"] != undefined) {
                  let projectCategoryList = projectDoc.data()["Category"];
                  for (let i = 0; i < projectCategoryList.length; i++) {
                    let categoryDetail = this.categoryList.find(
                      (item) => item.id == projectCategoryList[i]
                    );
                    if (categoryDetail != undefined) {
                      if (i == 0) {
                        projectCategory = categoryDetail.name;
                        projectCategoryId = categoryDetail.id;
                      } else {
                        projectCategory =
                          projectCategory + ", " + categoryDetail.name;
                        projectCategoryId =
                          projectCategoryId + ", " + categoryDetail.id;
                      }
                    }
                  }
                }
                this.projectList.push({
                  mainCategory: mainCategory,
                  id: project,
                  name: project,
                  projectCategory: projectCategory,
                  projectCategoryId:projectCategoryId
                });
                const refModule = projectDoc.ref.path + "/Modules";
                this.dbFireStore
                  .collection(refModule)
                  .get()
                  .subscribe((module) => {
                    module.forEach((ModuleDoc) => {
                      let moduleId = ModuleDoc.id;
                      let name = ModuleDoc.data()["name"];
                      this.taskList.push({
                        mainCategory: mainCategory,
                        project: project,
                        id: moduleId,
                        name: name,
                      });
                    });
                  });
              });
            });
        });
      });
  }

  //#region common function

  openModel(content: any, id: any, type: any) {
    console.log(type);
    if (type == "department") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 280;
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
      if (id == 0) {
        $("#exampleModalLongTitle").html("Add Task Department");
      } else {
        $("#exampleModalLongTitle").html("Update Task Department");
        $("#departmentId").val(id);
        $("#txtDepartment").val(id);
      }
    } else if (type == "category") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 280;
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
      $("#addNewMainCategory").show();
      if (id != "0") {
        $("#exampleModalLongTitle").html("Update Category");
        this.isMaincatNew == false;
        let categoryDetail = this.categoryList.find((item) => item.id == id);
        if (categoryDetail != undefined) {
          setTimeout(() => {
            $("#ddlMainCategory").val(categoryDetail.mainCategory);
          }, 100);
          $("#txtCategory").val(categoryDetail.name);
          $("#catId").val(id);
          $("#maincatId").val(categoryDetail.mainCategory);
          $("#addNewMainCategory").hide();
        }
      } else {
        $("#exampleModalLongTitle").html("Add Category");
      }
    } else if (type == "project") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 280;
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
      $("#addNewMainProjectCategory").show();
      if (id != "0") {
        $("#exampleModalLongTitle").html("Update Project");
        this.isMaincatNew == false;
        let projectDetail = this.projectList.find((item) => item.id == id);
        if (projectDetail != undefined) {
          setTimeout(() => {
            $("#ddlMainProjectCategory").val(projectDetail.mainCategory);
          }, 100);
          $("#txtProject").val(projectDetail.name);
          $("#projectId").val(id);
          $("#projectmaincatId").val(projectDetail.mainCategory);
          $("#addNewMainProjectCategory").hide();
        }
      } else {
        $("#exampleModalLongTitle").html("Add Project");
      }
    } else if (type == "module") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 320;
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
      if (id == "0") {
        $("#exampleModalLongTitle").html("Add Module");
        $("#ddlMainModuleCategory").val("Office");
        let projectList = this.projectList.filter(
          (item) => item.mainCategory == "Office"
        );
        if (projectList.length > 0) {
          for (let i = 0; i < projectList.length; i++) {
            this.moduleProjectList.push({
              id: projectList[i]["id"],
              name: projectList[i]["name"],
            });
          }
        }
      } else {
        $("#exampleModalLongTitle").html("Update Module");
        let moduleDetail = this.taskList.find((item) => item.id == id);
        if (moduleDetail != undefined) {
          setTimeout(() => {
            $("#ddlMainModuleCategory").val(moduleDetail.mainCategory);
            let projectList = this.projectList.filter(
              (item) => item.mainCategory == moduleDetail.mainCategory
            );
            if (projectList.length > 0) {
              for (let i = 0; i < projectList.length; i++) {
                this.moduleProjectList.push({
                  id: projectList[i]["id"],
                  name: projectList[i]["name"],
                });
              }
              setTimeout(() => {
                $("#ddlProject").val(moduleDetail.project);
              }, 100);
            }
            $("#txtModule").val(moduleDetail.name);
            $("#moduleId").val(id);
            $("#modulemaincatId").val(moduleDetail.mainCategory);
            $("#moduleprojectId").val(moduleDetail.project);
          }, 100);
        }
      }
    } else if (type == "projectCategory") {
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 600;
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
      $("#exampleModalLongTitle").html("Choose Category for " + id);
      $("#projectCatgoryId").val(id);
      setTimeout(() => {
        let projectDetail = this.projectList.find((item) => item.id == id);
        if (projectDetail != undefined) {
          let projectCategoryList = projectDetail.projectCategoryId.split(",");
          if (projectCategoryList.length > 0) {
            for (let i = 0; i < this.categoryList.length; i++) {
              for (let j = 0; j < projectCategoryList.length; j++) {
                if (
                  this.categoryList[i]["id"] == projectCategoryList[j].trim()
                ) {
                  let element = <HTMLInputElement>(
                    document.getElementById("chk" + i)
                  );
                  element.checked = true;
                }
              }
            }
          }
        }
      }, 600);
    }
    else if(type=="deleteCategory"){
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 170;
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
      $("#deleteId").val(id);
      $('#confirmType').val('category');
    }
    else if(type=="deleteProject"){
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 170;
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
      $("#deleteId").val(id);
      $('#confirmType').val('project');
    }
    else if(type=="deleteModule"){
      this.modalService.open(content, { size: "lg" });
      let windowHeight = $(window).height();
      let height = 170;
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
      $("#deleteId").val(id);
      $('#confirmType').val('module');
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }

  confirmDelete()
  {
    let deleteId=$('#deleteId').val();
    let confirmType=$('#confirmType').val();
    if(confirmType=="category"){
      this.deleteCategory(deleteId);
    } else if(confirmType=="project"){
      this.deleteProject(deleteId);
    } else if(confirmType=="module"){
      this.deleteModule(deleteId);
    }
  }


  //#endregion

  

  //#region Task Department

  addTaskDepartment() {
    let id = $("#departmentId").val();
    let department = $("#txtDepartment").val();

    if (department == "") {
      this.commonService.setAlertMessage("error", "Please enter project !!!");
      return;
    }
    const data = {};
    let message = "";
    if (id == "0") {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(department.toString())
        .set(data);
      message = "Task Department Added Successfully!!!";
    } else {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(id.toString())
        .delete();

      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(department.toString())
        .set(data);
      message = "Task Department Updated Successfully!!!";
    }
    $("#departmentId").val("0");
    $("#txtDepartment").val("");
    this.commonService.setAlertMessage("success", message);
    setTimeout(() => {
      this.getMainTask();
    }, 200);
    this.closeModel();
  }

  deleteTaskDepartment(id: any) {
    this.dbFireStore
      .collection("UserManagement")
      .doc("TaskManagement")
      .collection("Tasks")
      .doc(id.toString())
      .delete();
    this.commonService.setAlertMessage(
      "success",
      "Project deleted successfully !!!"
    );
    setTimeout(() => {
      this.getMainTask();
    }, 200);
  }

  //#endregion

  //#region Category

  addCategory() {
    let id = $("#catId").val();
    let mainCatId = $("#maincatId").val();
    let mainCategory = $("#ddlMainCategory").val();
    let category = $("#txtCategory").val();
    if (mainCategory == "0") {
      this.commonService.setAlertMessage(
        "error",
        "Please select Main Category !!!"
      );
      return;
    }
    if (category == "") {
      this.commonService.setAlertMessage("error", "Please enter Category !!!");
      return;
    }

    const data = {
      name: category,
    };
    let message = "";
    if (id == "0") {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(mainCategory.toString())
        .collection("Category")
        .add(data);
      message = "Category Added Successfully!!!";
    } else {
      if (mainCatId != mainCategory) {
        this.dbFireStore
          .collection("UserManagement")
          .doc("TaskManagement")
          .collection("Tasks")
          .doc(mainCatId.toString())
          .collection("Category")
          .doc(id.toString())
          .delete();

        this.dbFireStore
          .collection("UserManagement")
          .doc("TaskManagement")
          .collection("Tasks")
          .doc(mainCategory.toString())
          .collection("Category")
          .add(data);
      } else {
        this.dbFireStore
          .collection("UserManagement")
          .doc("TaskManagement")
          .collection("Tasks")
          .doc(mainCategory.toString())
          .collection("Category")
          .doc(id.toString())
          .update(data);
      }
      message = "Category Updated Successfully!!!";
    }
    $("#catId").val("0");
    $("#ddlMainCategory").val("0");
    $("#txtCategory").val("");
    this.commonService.setAlertMessage("success", message);
    this.isMaincatNew = false;
    setTimeout(() => {
      this.getMainTask();
    }, 600);

    this.closeModel();
  }

  deleteCategory(id: any) {
    let categoryDetail = this.categoryList.find((item) => item.id == id);
    if (categoryDetail != undefined) {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(categoryDetail.mainCategory.toString())
        .collection("Category")
        .doc(id.toString())
        .delete();
      this.commonService.setAlertMessage(
        "success",
        "Category deleted successfully !!!"
      );
      this.isMaincatNew = false;
      setTimeout(() => {
        this.getMainTask();
      }, 600);
    }
  }

  //#endregion

  //#region Project

  addProjectCategory() {
    let projectId = $("#projectCatgoryId").val();
    let projectDetail = this.projectList.find((item) => item.id == projectId);
    if (projectDetail != undefined) {
      let projectCategory = "";
      for (let i = 0; i < this.categoryList.length; i++) {
        let chk = "chk" + i;
        let element = <HTMLInputElement>document.getElementById(chk);
        if (element.checked == true) {
          if (projectCategory == "") {
            projectCategory = this.categoryList[i]["id"];
          } else {
            projectCategory =
              projectCategory + "," + this.categoryList[i]["id"];
          }
        }
      }
      if (projectCategory != "") {
        let projectCategoryList = projectCategory.split(",");
        const data = {
          Category: projectCategoryList,
        };
        this.dbFireStore
          .collection("UserManagement")
          .doc("TaskManagement")
          .collection("Tasks")
          .doc(projectDetail.mainCategory.toString())
          .collection("Projects")
          .doc(projectId.toString())
          .set(data);
      }
      this.commonService.setAlertMessage(
        "success",
        "Project category updated successfully !!!"
      );
      setTimeout(() => {
        this.getMainTask();
      }, 600);
      this.closeModel();
    }
  }

  addProject() {
    let id = $("#projectId").val();
    let projectmaincatId = $("#projectmaincatId").val();
    let mainCategory = $("#ddlMainProjectCategory").val();
    let project = $("#txtProject").val();
    if (mainCategory == "0") {
      this.commonService.setAlertMessage(
        "error",
        "Please select Main Category !!!"
      );
      return;
    }
    if (project == "") {
      this.commonService.setAlertMessage("error", "Please enter project !!!");
      return;
    }
    const data = {};
    let message = "";
    if (id == "0") {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(mainCategory.toString())
        .collection("Projects")
        .doc(project.toString())
        .set(data);
      message = "Project Added Successfully!!!";
    } else {
      let deleteCategory = mainCategory;
      if (projectmaincatId != mainCategory) {
        deleteCategory = projectmaincatId;
      }
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(deleteCategory.toString())
        .collection("Projects")
        .doc(id.toString())
        .delete();

      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(mainCategory.toString())
        .collection("Projects")
        .doc(project.toString())
        .set(data);
      message = "Project Updated Successfully!!!";
    }
    $("#projectId").val("0");
    $("#ddlMainProjectCategory").val("0");
    $("#txtProject").val("");
    this.commonService.setAlertMessage("success", message);
    this.isMaincatNew = false;
    setTimeout(() => {
      this.getMainTask();
    }, 600);

    this.closeModel();
  }

  deleteProject(id: any) {
    let projectDetail = this.projectList.find((item) => item.id == id);
    if (projectDetail != undefined) {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(projectDetail.mainCategory.toString())
        .collection("Projects")
        .doc(id.toString())
        .delete();
      this.commonService.setAlertMessage(
        "success",
        "Project deleted successfully !!!"
      );
      this.isMaincatNew = false;
      setTimeout(() => {
        this.getMainTask();
      }, 600);
    }
  }

  //#endregion Project

  //#region Modules

  getModuleProject() {
    this.moduleProjectList = [];
    let mainCategory = $("#ddlMainModuleCategory").val();
    if (mainCategory == "0") {
      this.commonService.setAlertMessage(
        "error",
        "Please select main category !!!"
      );
      return;
    }
    let projectList = this.projectList.filter(
      (item) => item.mainCategory == mainCategory
    );
    if (projectList.length > 0) {
      for (let i = 0; i < projectList.length; i++) {
        this.moduleProjectList.push({
          id: projectList[i]["id"],
          name: projectList[i]["name"],
        });
      }
    }
  }

  addModule() {
    let id = $("#moduleId").val();
    let maincatid = $("#modulemaincatId").val();
    let projectid = $("#moduleprojectId").val();
    let mainCategory = $("#ddlMainModuleCategory").val();
    let project = $("#ddlProject").val();
    let module = $("#txtModule").val();

    if (mainCategory == "0") {
      this.commonService.setAlertMessage(
        "error",
        "Please select main category !!!"
      );
      return;
    }
    if (project == "0") {
      this.commonService.setAlertMessage("error", "Please select project !!!");
      return;
    }
    if (module == "") {
      this.commonService.setAlertMessage("error", "Please enter module !!!");
      return;
    }

    const data = {
      name: module,
    };
    let message = "";
    if (id == "0") {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(mainCategory.toString())
        .collection("Projects")
        .doc(project.toString())
        .collection("Modules")
        .add(data);
      message = "Module Added Successfully!!!";
    } else {
      if (projectid != project) {
        this.dbFireStore
          .collection("UserManagement")
          .doc("TaskManagement")
          .collection("Tasks")
          .doc(maincatid.toString())
          .collection("Projects")
          .doc(projectid.toString())
          .collection("Modules")
          .doc(id.toString())
          .delete();

        this.dbFireStore
          .collection("UserManagement")
          .doc("TaskManagement")
          .collection("Tasks")
          .doc(mainCategory.toString())
          .collection("Projects")
          .doc(project.toString())
          .collection("Modules")
          .add(data);
      } else {
        this.dbFireStore
          .collection("UserManagement")
          .doc("TaskManagement")
          .collection("Tasks")
          .doc(mainCategory.toString())
          .collection("Projects")
          .doc(project.toString())
          .collection("Modules")
          .doc(id.toString())
          .update(data);
      }
      message = "Module Updated Successfully!!!";
    }
    $("#moduleId").val("0");
    $("#ddlMainModuleCategory").val("0");
    $("#ddlProject").val("0");
    $("#txtModule").val("");
    this.commonService.setAlertMessage("success", message);
    setTimeout(() => {
      this.getMainTask();
    }, 600);

    this.closeModel();
  }

  deleteModule(id: any) {
    let moduleDetail = this.taskList.find((item) => item.id == id);
    if (moduleDetail != undefined) {
      this.dbFireStore
        .collection("UserManagement")
        .doc("TaskManagement")
        .collection("Tasks")
        .doc(moduleDetail.mainCategory.toString())
        .collection("Projects")
        .doc(moduleDetail.project.toString())
        .collection("Modules")
        .doc(id.toString())
        .delete();
      this.commonService.setAlertMessage(
        "success",
        "Module deleted successfully !!!"
      );
      this.isMaincatNew = false;
      setTimeout(() => {
        this.getMainTask();
      }, 600);
    }
  }

  //#endregion
}
