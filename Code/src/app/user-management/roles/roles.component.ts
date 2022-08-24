import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UsersService } from "../../services/users/users.service";

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {

  constructor(public userService:UsersService, private commonService: CommonService, private modalService: NgbModal) { }

  txtRoleName = "#txtRoleName";
  key = "#key";
  deleteId = "#deleteId";
  roleList: any[] = [];
  roleJSONData: any;
  public cityName:any;

  ngOnInit() {
    this.setDefault();
  }

  setDefault() {
    this.cityName = localStorage.getItem('cityName');
    this.getRoles();
  }

  getRoles() {
    this.userService.getRoles().then((data: any) => {
      if (data != null) {
        this.roleJSONData = data;
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let roleId = keyArray[i];
            if (data[roleId]["roleName"] != null) {
              let roleName = data[roleId]["roleName"];
              this.roleList.push({ roleId: roleId, roleName: roleName });
              this.roleList=this.commonService.transformNumeric(this.roleList,"roleName");
            }
          }
        }
      }
    });
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 150;
    let width = 400;
    if (type != "delete") {
      height = 190;
    }
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.key).val(id);
    $(this.deleteId).val(id);
    if (type == "update") {
      let roleDetail = this.roleList.find(item => item.roleId == id);
      if (roleDetail != undefined) {
        $(this.txtRoleName).val(roleDetail.roleName);
      }
    }
  }

  saveRole() {
    let id = $(this.key).val();
    let roleName = $(this.txtRoleName).val();
    if (roleName == "") {
      this.commonService.setAlertMessage("error", "Please enter role name");
      return;
    }
    const data = {
      roleName: roleName
    }
    let lastKey = 0;
    if (this.roleJSONData == null) {
      this.roleJSONData = {};
    }
    else {
      lastKey = Number(this.roleJSONData["lastKey"]);
    }
    if (id == "0") {
      lastKey++;
      this.roleJSONData["lastKey"] = lastKey;
      this.roleList.push({ roleId: lastKey, roleName: roleName });
      this.roleList=this.commonService.transformNumeric(this.roleList,"roleName");
    }
    else {
      lastKey = Number(id);
      let roleDetail = this.roleList.find(item => item.roleId == id);
      if (roleDetail != undefined) {
        roleDetail.roleName = roleName;
      }
    }
    this.roleJSONData[lastKey.toString()] = data;
    this.userService.saveRoles(this.roleJSONData);
    this.commonService.setAlertMessage("success", "Role saved successfully !!!");
    this.closeModel();
  }

  removeRole() {
    let id = $(this.deleteId).val();
    delete this.roleJSONData[id.toString()];
    let list = this.roleList.filter(item => item.roleId != id);
    this.roleList = list;
    this.userService.saveRoles(this.roleJSONData);
    this.commonService.setAlertMessage("success", "Role deleted successfully !!!");
    this.closeModel();
  }

  closeModel() {
    this.modalService.dismissAll();
  }

}
