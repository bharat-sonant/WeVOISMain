import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
//import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms'; // Reactive form services
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { Users } from '../../Users/users';  // Users data type interface class
import * as $ from 'jquery';
import { Router } from '@angular/router';
import { UsersService } from '../../services/users/users.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})

export class UserListComponent implements OnInit {

  constructor(private router: Router, private userService: UsersService, public commonService: CommonService, public toastr: ToastrService) { }

  userRecord: any[];
  filteredUserRecord:any[]=[];
  User: Users[];
  cityName: any;
  userJsonData: any;
  divLoader = "#divLoader";
  isShowAction:any;
  rolesList:any[]=[];

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.commonService.savePageLoadHistory("Users","Users",localStorage.getItem("userID"));
    (<HTMLInputElement>document.getElementById("chkFilter")).checked = true;
    this.isShowAction=true;
    this.getRolesList();
    this.getUserList();
  }

  getUserList() {
    this.userRecord = [];
    this.filteredUserRecord  = [];
    $(this.divLoader).show();
    this.userService.getPortalUsers().then((data: any) => {
      if (data != null) {
        this.userJsonData = data;
        this.getFilterUsers();
      }
      $(this.divLoader).hide();
    });
  }

  getFilterUsers(){
    this.userRecord = [];
    let promise=null;
    if ((<HTMLInputElement>document.getElementById("chkFilter")).checked == false) {
      this.isShowAction=false;
      $("#lblStatus").html("In-Active")
      let keyArray = Object.keys(this.userJsonData);
        if (keyArray.length > 0) {
          promise=keyArray.map(i => {
            let userId = i;
            let imgUrl = "internal-user.png";
            let utitle = "Internal User";
            if (this.userJsonData[userId]["userType"] == "External User") {
              imgUrl = "external-user.png";
              utitle = "External User";
            }
            if (this.userJsonData[userId]["isDelete"] == "1") {
              this.userRecord.push({ uid: this.userJsonData[userId]["uid"], userId: this.userJsonData[userId]["userId"], name: this.userJsonData[userId]["name"], email: this.userJsonData[userId]["email"], mobile: this.userJsonData[userId]["mobile"], userType: this.userJsonData[userId]["userType"], password: this.userJsonData[userId]["password"], $Key: this.userJsonData[userId], imgUrl: imgUrl, utitle: utitle, cityName: this.cityName,lastLogin:"---" });
              this.getUserLastLogin(userId);
            }
          })
        
          // this.userRecord = this.commonService.transformNumeric(this.userRecord, "name");
        }
    }
    else{
      $("#lblStatus").html("Active");
      this.isShowAction=true;
      let keyArray = Object.keys(this.userJsonData);
      if (keyArray.length > 0) {
        promise=keyArray.map(i => {
          let userId = i;
          let imgUrl = "internal-user.png";
          let utitle = "Internal User";
          if (this.userJsonData[userId]["userType"] == "External User") {
            imgUrl = "external-user.png";
            utitle = "External User";
          }
          if (this.userJsonData[userId]["isDelete"] == "0") {
            this.userRecord.push({ uid: this.userJsonData[userId]["uid"], userId: this.userJsonData[userId]["userId"], name: this.userJsonData[userId]["name"], email: this.userJsonData[userId]["email"], mobile: this.userJsonData[userId]["mobile"], userType: this.userJsonData[userId]["userType"], password: this.userJsonData[userId]["password"], $Key: this.userJsonData[userId], imgUrl: imgUrl, utitle: utitle, cityName: this.cityName,lastLogin:"---" });
            this.getUserLastLogin(userId);
          }
        });
        // this.userRecord = this.commonService.transformNumeric(this.userRecord, "name");
      }
    }
    Promise.all(promise).then(resp=>{
      this.userRecord = this.commonService.transformNumeric(this.userRecord, "name");
      this.filteredUserRecord = this.userRecord;
      
      this.rolesList.map(role=>{
        let activeRoleEmployees=this.userRecord.filter(item=>Number(item.$Key.roleId)===Number(role.roleId)).length;
        role.active = activeRoleEmployees;
      })
    })

  }

  getUserLastLogin(userId:any){
    this.userService.getUserLastLogin(userId).then(lastLogin=>{
      let detail=this.userRecord.find(item=>item.userId==userId);
      if(detail!=undefined){
        detail.lastLogin=lastLogin;
      }
    });
  }

  changeUserStatus(userId: any,status:string) {
    if (window.confirm(`Are sure you want to ${status} this user ?`)) { // Asking from user before changing employee status.
      this.userJsonData[userId.toString()]["isDelete"] = status==='deactive'? 1 : 0;
      this.userService.savePortalUsers(this.userJsonData);
      this.getFilterUsers();
      this.toastr.error(`User ${status==='deactive'?'Deactivated':'Activated'} Successfully !!!`, '', {
        timeOut: 6000,enableHtml: true,closeButton: true,toastClass: "alert alert-info alert-with-icon",positionClass:'toast-bottom-right'});
        // Alert message will show up when user status changed successfully.

      //setTimeout(() => {
     //   this.getUserList();
      //}, 300);
    }
  }

  addNew() {
    this.router.navigate(['/' + this.cityName + '/useradd']);
  }
  getRolesList=()=>{
    this.rolesList=[];
    this.userService.getRoles().then(rolesResp=>{
      if(rolesResp){
        Object.keys(rolesResp).forEach(roleId=>{
          if(rolesResp[roleId].roleName){
            this.rolesList.push({roleId,roleName:rolesResp[roleId].roleName,active:0});
          }
        });
      }
    });
  }
  filterUserList=(roleSelect:any)=>{
    if(Number(roleSelect.value)){
      this.filteredUserRecord = this.userRecord.filter(item=>Number(item.$Key.roleId)===Number(roleSelect.value));
    }
    else{
      this.filteredUserRecord = this.userRecord;
    }
  }
}
