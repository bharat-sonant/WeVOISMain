import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from 'angularfire2/database';
import { Users } from '../../Users/users';  // Users data type interface class
import { UserAccess } from '../../Users/users';  // Users data type interface class
import { Remarks } from '../../Users/users';  // Users data type interface class

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(public db: AngularFireDatabase) { }

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
    this.usersRef = this.db.list('/Users');
    this.usersRef.push({
      userId: user.userId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      password: user.password,
      userType: user.userType,
      creattionDate: user.creattionDate,
      isDelete: 0,
      notificationHalt: user.notificationHalt,
      notificationMobileDataOff: user.notificationMobileDataOff,
      notificationSkippedLines: user.notificationSkippedLines,
      notificationPickDustbins: user.notificationPickDustbins,
      expiryDate: user.expiryDate,
      notificationGeoSurfing:user.notificationGeoSurfing,
      officeAppUserId:user.officeAppUserId,
      empLocation:user.empLocation
    })
  }

  // Update User Object
  UpdateUser(user: Users) {
    this.userRef = this.db.object('/Users/' + user.$Key);
    this.userRef.update({
      userId: user.userId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      password: user.password,
      userType: user.userType,
      isDelete: 0,
      notificationHalt: user.notificationHalt,
      notificationMobileDataOff: user.notificationMobileDataOff,
      notificationSkippedLines: user.notificationSkippedLines,
      notificationPickDustbins: user.notificationPickDustbins,
      expiryDate: user.expiryDate,
      notificationGeoSurfing:user.notificationGeoSurfing,
      officeAppUserId:user.officeAppUserId,
      empLocation:user.empLocation
    })
  }

  // Fetch Single User Object
  GetUser(id: string) {
    this.userRef = this.db.object('users/' + id);
    return this.userRef;
  }

  // Fetch Users List
  GetUsersList() {
    this.usersRef = this.db.list('users');
    return this.usersRef;
  }

  // Delete User Object
  DeleteUser(id: string) {
    this.userRef = this.db.object('/Users/' + id);
    this.userRef.update({
      isDelete: 1
    })
  }


  // Create User
  AddUserAccess(useraccess: UserAccess) {
    this.accesssRef = this.db.list('/UserAccess');
    this.accesssRef.push({
      userId: useraccess.userId,
      pageID: useraccess.pageID
    })
  }

  // Delete User Object
  DeleteUserAccess(id: string) {
    this.userRef = this.db.object('/UserAccess/' + id);
    this.userRef.remove();
  }


  //#region remarks

  addRemarks(remark: Remarks, path: any) {
    this.remarksRef = this.db.list(path);
    this.remarksRef.push({
      userId: remark.userId,
      category: remark.category,
      remark: remark.remark,
      time: remark.time,
      image: remark.image
    })
  }

  UpdateRemarks(remark: Remarks, path: any) {
    this.userRef = this.db.object('/' + path + '/' + remark.$Key);
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
    this.plansRef = this.db.list(path);
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
      isConfirmed:plan.isConfirmed,
      pickedDustbin:plan.pickedDustbin,
      highPriority:plan.highPriority
    })
  }

  UpdatePlan(plan: DustbinPlans, path: any) {
    this.planRef = this.db.object('/' + path + '/' + plan.$Key);
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
      isConfirmed:plan.isConfirmed,
      pickedDustbin:plan.pickedDustbin,
      highPriority:plan.highPriority
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
  isConfirmed:string;
  pickedDustbin:string;
  highPriority:string;
}
