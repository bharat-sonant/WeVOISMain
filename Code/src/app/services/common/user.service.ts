import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
import { Users } from '../../Users/users';  // Users data type interface class
import { UserAccess } from '../../Users/users';  // Users data type interface class
import { Remarks } from '../../Users/users';  // Users data type interface class
import { AngularFirestore } from '@angular/fire/firestore';
import { FirebaseService } from "../../firebase.service";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(public fs: FirebaseService,public dbFireStore: AngularFirestore) { }

  usersRef: AngularFireList<any>;    // Reference to Users data list, its an Observable
  userRef: AngularFireObject<any>;   // Reference to Users object, its an Observable too

  accesssRef: AngularFireList<any>;    // Reference to Users data list, its an Observable
  accessRef: AngularFireObject<any>;   // Reference to Users object, its an Observable too

  remarksRef: AngularFireList<any>;
  remarkRef: AngularFireObject<any>;

  plansRef: AngularFireList<any>;
  planRef: AngularFireObject<any>;

  // Create User
  AddUser(user: Users) {
    this.dbFireStore.doc("UserManagement/Users").collection("Users").add(user);
  }

  // Update User Object
  UpdateUser(id:any,user: Users) {
    this.dbFireStore.doc("UserManagement/Users").collection("Users").doc(id).update(user);
  }

  // Fetch Single User Object
  GetUser(id: string) {
    
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.userRef = db.object('users/' + id);
    return this.userRef;
  }

  // Fetch Users List
  GetUsersList() {
    
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.usersRef = db.list('users');
    return this.usersRef;
  }

  // Delete User Object
  DeleteUser(id: string) {
    this.dbFireStore.doc("UserManagement/Users").collection("Users").doc(id).update({isDelete:1});
  }


  // Create User
  AddUserAccess(useraccess: UserAccess) {
    
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.accesssRef = db.list('/UserAccess');
    this.accesssRef.push({
      userId: useraccess.userId,
      pageID: useraccess.pageID
    })
  }

  // Delete User Object
  DeleteUserAccess(id: string) {
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.userRef = db.object('/UserAccess/' + id);
    this.userRef.remove();
  }


  //#region remarks

  addRemarks(remark: Remarks, path: any) {
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.remarksRef = db.list(path);
    this.remarksRef.push({
      userId: remark.userId,
      category: remark.category,
      remark: remark.remark,
      time: remark.time,
      image: remark.image
    })
  }

  UpdateRemarks(remark: Remarks, path: any) {
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.userRef = db.object('/' + path + '/' + remark.$Key);
    this.userRef.update({
      userId: remark.userId,
      category: remark.category,
      remark: remark.remark,
      time: remark.time,
      image: remark.image
    })
  }

  //#endregion

  //#region remarks

  addPlan(plan: DustbinPlans, path: any) {
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.plansRef = db.list(path);
    this.plansRef.push({
      bins: plan.bins,
      createdAt: plan.createdAt,
      createdBy: plan.createdBy,
      dustbinPickingPosition: plan.dustbinPickingPosition,
      isAssigned: plan.isAssigned,
      pickingSequence: plan.pickingSequence,
      planName: plan.planName,
      totalDustbin: plan.totalDustbin,
      updatedAt: plan.updatedAt,
      updatedBy: plan.updatedBy,
      zone: plan.zone,
      maxDustbinCapacity: plan.maxDustbinCapacity,
      isConfirmed: plan.isConfirmed,
      pickedDustbin: plan.pickedDustbin,
      highPriority: plan.highPriority
    })
  }

  UpdatePlan(plan: DustbinPlans, path: any) {
    let db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.planRef = db.object('/' + path + '/' + plan.$Key);
    this.planRef.update({
      bins: plan.bins,
      createdAt: plan.createdAt,
      createdBy: plan.createdBy,
      dustbinPickingPosition: plan.dustbinPickingPosition,
      isAssigned: plan.isAssigned,
      pickingSequence: plan.pickingSequence,
      planName: plan.planName,
      totalDustbin: plan.totalDustbin,
      updatedAt: plan.updatedAt,
      updatedBy: plan.updatedBy,
      zone: plan.zone,
      maxDustbinCapacity: plan.maxDustbinCapacity,
      isConfirmed: plan.isConfirmed,
      pickedDustbin: plan.pickedDustbin,
      highPriority: plan.highPriority
    })
  }

  //#endregion

}

export interface DustbinPlans {
  $Key: any;
  bins: string;
  createdAt: string;
  createdBy: string;
  dustbinPickingPosition: string;
  isAssigned: string;
  pickingSequence: string;
  planName: string;
  totalDustbin: number;
  updatedAt: string;
  updatedBy: string;
  zone: string;
  maxDustbinCapacity: number;
  isConfirmed: string;
  pickedDustbin: string;
  highPriority: string;
}
