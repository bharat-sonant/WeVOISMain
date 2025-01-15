import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
//  <reference types="@types/googlemaps" />


@Component({
  selector: 'app-employee-attendance',
  templateUrl: './employee-attendance.component.html',
  styleUrls: ['./employee-attendance.component.scss']
})

export class EmployeeAttendanceComponent implements OnInit {

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private modalService: NgbModal, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  divLoader = "#divLoader";
  allEmployeeList: any[] = [];
  filterEmployeeList: any[] = [];
  options: any[] = [];
  employeeList: any[];
  attendanceList: any[];
  fireStorePath: any;
  selectedYear: any;
  selectedMonthName: any;
  selectedDate: any;
  toDayDate: any;
  txtDate = "#txtDate";
  ddlTime = "#ddlTime";
  ddlAttendanceManager = "#ddlAttendanceManager";
  chkIncludeInactive = "chkIncludeInactive";
  chkNotApproved = "chkNotApproved";
  chkNotApprovedEmployee = "chkNotApprovedEmployee";
  rdoByDate = "rdoByDate";
  rdoByEmployee = "rdoByEmployee";
  divByDate = "#divByDate";
  divByEmployee = "#divByEmployee";
  txtDateFrom = "#txtDateFrom";
  txtDateTo = "#txtDateTo";
  ddlEmployee = "#ddlEmployee";
  hddEmpId = "#hddEmpId";
  hddDate = "#hddDate";
  hddStatus = "#hddStatus";
  hddIndex = "#hddIndex";
  ddlStatus = "#ddlStatus";
  mdStatus1 = '#mdStatus1';
  divConfirmApprove = "#divConfirmApprove";
  markers: any[] = [];
  logoutMarkers: any[] = [];
  bounds = new google.maps.LatLngBounds();
  showStatus: any;
  public filterType: any;
  serviceName = "employee-attendance";
  isAttendanceApprover: any;
  canViewAttendance: any;
  userList: any[] = [];
  attendanceManagerList: any[] = [];
  modificationRequestList: any[] = [];
  modificationPopUpData: any
  public notApprovedCount: any;

  public mapLocation: google.maps.Map;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.isAttendanceApprover = localStorage.getItem("isAttendanceApprover");
    this.canViewAttendance = localStorage.getItem("canViewAttendance");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    if (this.userList.length > 0) {
      this.attendanceManagerList = this.userList.filter(item => item.isAttendanceApprover == 1).sort((a, b) =>
        b.name < a.name ? 1 : -1
      );
    }
    if (localStorage.getItem("roleId") == "17" || localStorage.getItem("roleId") == "10") {
      $(this.ddlAttendanceManager).show();
    }
    //this.setHeight()
    //this.setDefaultMap()
    this.showStatus = false;
    this.filterType = "byDate";
    this.notApprovedCount = 0;
    (<HTMLInputElement>document.getElementById(this.rdoByDate)).checked = true;
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateFrom).val(this.selectedDate);
    $(this.txtDateTo).val(this.selectedDate);
    this.getSelectedYearMonthName();
    this.fireStorePath = this.commonService.fireStoragePath;
    this.getEmployees();
    this.updateModificationRequestList();
  }

  setFilterType(filterVal: any, empId: any) {
    this.filterType = filterVal;
    this.notApprovedCount = 0;
    $(this.ddlEmployee).val(empId);
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateFrom).val(this.selectedDate);
    $(this.txtDateTo).val(this.selectedDate);
    this.attendanceList = [];
    this.employeeList = [];
    (<HTMLInputElement>document.getElementById(this.chkNotApproved)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotApprovedEmployee)).checked = false;
    if (this.filterType == "byDate") {
      this.getAttendance();
      this.showStatus = true;
      this.setDefaultMap()
      this.clearMarkers();
    }
    else {
      this.showStatus = true;
      this.setDefaultMap()
      this.clearMarkers()
    }

  }

  getSelectedYearMonthName() {
    this.selectedYear = this.selectedDate.split('-')[0];
    this.selectedMonthName = this.commonService.getCurrentMonthName(Number(this.selectedDate.split('-')[1]) - 1);
  }

  getEmployeeDetail(empId: any) {
    return new Promise((resolve) => {
      let employeeData = {};
      let dbPath = "Employees/" + empId + "/GeneralDetails";
      let employeeDetailInstance = this.db.object(dbPath).valueChanges().subscribe(
        employeeDetail => {

          employeeDetailInstance.unsubscribe();
          if (employeeDetail) {
            let attendanceManager = "";
            if (employeeDetail.attendanceApprover) {
              let detail = this.attendanceManagerList.find(item => item.userId == employeeDetail.attendanceApprover);
              if (detail != undefined) {
                attendanceManager = detail.name;
              }
            }
            if (employeeDetail.designationId == "5" || employeeDetail.designationId == "6") {
              resolve({ status: "fail", data: employeeData });
            }
            else {
              if (localStorage.getItem("roleId") == "17") {
                employeeData = { empId: empId.toString(), empCode: employeeDetail.empCode, name: employeeDetail.name, designationId: employeeDetail.designationId, status: employeeDetail.status, isAttendanceApprover: "1", attendanceApprover: employeeDetail.attendanceApprover || 0, attendanceManager: attendanceManager };
                resolve({ status: "success", data: employeeData });
              }
              else if (localStorage.getItem("roleId") == "10") {
                if (employeeDetail.attendanceApprover) {
                  if (employeeDetail.attendanceApprover == localStorage.getItem("userID")) {
                    employeeData = { empId: empId.toString(), empCode: employeeDetail.empCode, name: employeeDetail.name, designationId: employeeDetail.designationId, status: employeeDetail.status, isAttendanceApprover: "1", attendanceApprover: employeeDetail.attendanceApprover || 0, attendanceManager: attendanceManager };
                    resolve({ status: "success", data: employeeData });
                  }
                  else {
                    employeeData = { empId: empId.toString(), empCode: employeeDetail.empCode, name: employeeDetail.name, designationId: employeeDetail.designationId, status: employeeDetail.status, isAttendanceApprover: "0", attendanceApprover: employeeDetail.attendanceApprover || 0, attendanceManager: attendanceManager };
                    resolve({ status: "success", data: employeeData });
                  }
                }
                else {
                  employeeData = { empId: empId.toString(), empCode: employeeDetail.empCode, name: employeeDetail.name, designationId: employeeDetail.designationId, status: employeeDetail.status, isAttendanceApprover: "0", attendanceApprover: employeeDetail.attendanceApprover || 0, attendanceManager: attendanceManager };
                  resolve({ status: "success", data: employeeData });
                }
              }
              else {
                if (employeeDetail.attendanceApprover) {
                  if (employeeDetail.attendanceApprover == localStorage.getItem("userID")) {
                    employeeData = { empId: empId.toString(), empCode: employeeDetail.empCode, name: employeeDetail.name, designationId: employeeDetail.designationId, status: employeeDetail.status, isAttendanceApprover: "1", attendanceManager: attendanceManager };
                    resolve({ status: "success", data: employeeData });
                  }
                  else if (this.canViewAttendance == "1") {

                    employeeData = { empId: empId.toString(), empCode: employeeDetail.empCode, name: employeeDetail.name, designationId: employeeDetail.designationId, status: employeeDetail.status, isAttendanceApprover: "0", attendanceManager: attendanceManager };
                    resolve({ status: "success", data: employeeData });
                  }
                  else {
                    resolve({ status: "fail", data: employeeData });
                  }
                }
                else if (this.canViewAttendance == "1") {
                  employeeData = { empId: empId.toString(), empCode: employeeDetail.empCode, name: employeeDetail.name, designationId: employeeDetail.designationId, status: employeeDetail.status, isAttendanceApprover: "0", attendanceManager: attendanceManager };
                  resolve({ status: "success", data: employeeData });
                }
                else {
                  resolve({ status: "fail", data: employeeData });
                }

              }
            }
          }
          else {
            resolve({ status: "fail", data: employeeData });
          }
        });
    });
  }

  getEmployees() {
    $(this.divLoader).show();
    this.allEmployeeList = [];
    this.employeeList = [];

    let lastEmpIdInstance = this.db.object("Employees/lastEmpId").valueChanges().subscribe(lastKeyData => {
      lastEmpIdInstance.unsubscribe();
      if (lastKeyData != null) {
        let lastEmpId = Number(lastKeyData);
        const promises = [];
        for (let i = 1; i <= lastEmpId; i++) {
          promises.push(Promise.resolve(this.getEmployeeDetail(i)));
        }
        Promise.all(promises).then((results) => {
          let merged = [];
          for (let i = 0; i < results.length; i++) {
            if (results[i]["status"] == "success") {
              merged = merged.concat(results[i]["data"]);
            }
          }
          if (merged.length > 0) {
            this.allEmployeeList = merged;
            this.allEmployeeList = this.commonService.transformNumeric(this.allEmployeeList, "name");
            this.getFilterEmployee();
            this.getAttendance();
          }
          else {
            $(this.divLoader).hide();
          }
        });
      }
    });
  }

  getFilterEmployee() {
    this.filterEmployeeList = [];
    if ((<HTMLInputElement>document.getElementById(this.chkIncludeInactive)).checked == true) {
      this.filterEmployeeList = this.allEmployeeList;
    }
    else {
      this.filterEmployeeList = this.allEmployeeList.filter(item => item.status == "1");
    }
    $(this.ddlEmployee).val("0");
    this.attendanceList = [];
  }

  getAttendance() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAttendance");
    $(this.ddlTime).val("0");
    this.employeeList = [];
    this.attendanceList = [];
    (<HTMLInputElement>document.getElementById(this.chkNotApproved)).checked = false;
    this.notApprovedCount = 0;
    for (let i = 0; i < this.allEmployeeList.length; i++) {
      let empId = this.allEmployeeList[i]["empId"];
      let isAttendanceApprover = this.allEmployeeList[i]["isAttendanceApprover"];
      let attendanceApprover = this.allEmployeeList[i]["attendanceApprover"];
      let attendanceManager = this.allEmployeeList[i]["attendanceManager"];
      let designationId = this.allEmployeeList[i]["designationId"];

      let dbPath = "Attendance/" + empId + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;
      let employeeAttendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
        attendanceData => {
          employeeAttendanceInstance.unsubscribe();
          if (attendanceData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAttendance", attendanceData);
            let detail = this.allEmployeeList.find(item => Number(item.empId) == Number(empId));
            if (detail != undefined) {
              let inTime = "";
              let outTime = "";
              let inServerTime = '';
              let outServerTime = '';
              let workingHour = "";
              let inTimestemp = 0;
              let inLocation = "";
              let outLocation = "";
              let inLocationFull = "";
              let outLocationFull = "";
              let inLat = "";
              let inLng = "";
              let outLat = "";
              let outLng = "";
              let status = "";
              let approverStatus = "0";
              let approveBy = "";
              let inImageUrl = '';
              let outImageUrl = '';
              let approveAt = ''; //to show approve at time in new line
              let reason = '';

              let cssClass = "text-left br-1";
              let cssWorkingClass = "text-left br-1";
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inServerTime = attendanceData['inDetails']['serverTime']?attendanceData['inDetails']['serverTime']:"";
                  inLocationFull = attendanceData["inDetails"]["address"];
                  inImageUrl = attendanceData["inDetails"]['imageURL'] || '';
                  if (attendanceData["inDetails"]["address"] && attendanceData["inDetails"]["address"].toString().length > 85) {
                    inLocation = attendanceData["inDetails"]["address"].toString().substring(0, 85) + "...";
                  }
                  else {
                    inLocation = attendanceData["inDetails"]["address"];
                  }
                  let latLngString = attendanceData["inDetails"]["location"]
                  if (latLngString && latLngString != undefined) {
                    let [latitude, longitude] = latLngString.split(',');
                    inLat = latitude
                    inLng = longitude
                  }


                  inTimestemp = new Date(this.selectedDate + " " + inTime).getTime();
                  let afterTimestemp = new Date(this.selectedDate + " 08:30").getTime();
                  if (inTimestemp > afterTimestemp) {
                    cssClass = "text-left br-1 afterTime";
                  }
                  if (attendanceData["inDetails"]["status"] != null) {
                    status = attendanceData["inDetails"]["status"];
                    approverStatus = status;
                    reason = attendanceData["inDetails"]["reason"]
                    if (status == "0") {
                      status = "Not Approved";
                    } if (status == "1") {
                      status = "Full Day";
                    } if (status == "2") {
                      status = "Pre Lunch";

                    } if (status == "3") {
                      status = "Post Lunch";

                    } if (status == "4") {
                      status = "Absent";

                    } if (status == "default") {
                      status = "Leave";
                    }
                  }
                  if (attendanceData["inDetails"]["approveBy"] != null) {
                    let userDetail = this.userList.find(item => item.userId == attendanceData["inDetails"]["approveBy"]);
                    if (userDetail != undefined) {
                      approveBy = userDetail.name;
                    }
                  }
                  if (attendanceData["inDetails"]["approveAt"] != null) {
                    let approveAtDetail = attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[1])) + " " + attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[0] + " at " + attendanceData["inDetails"]["approveAt"].split(" ")[1];
                    // approveBy = approveBy + " on " + approveAt;
                    approveAt = approveAtDetail //to show approve at time in new line
                  }
                }
              }
              if (attendanceData["outDetails"] != null) {
                if (attendanceData["outDetails"]["time"] != null) {
                  outTime = attendanceData["outDetails"]["time"];
                  outServerTime = attendanceData['outDetails']['serverTime']?attendanceData['outDetails']['serverTime']:'';
                  outImageUrl = attendanceData["outDetails"]['imageURL'] || '';
                  if (attendanceData["outDetails"]["address"] != null) {
                    outLocationFull = attendanceData["outDetails"]["address"];
                    if (attendanceData["outDetails"]["address"].toString().length > 85) {
                      outLocation = attendanceData["outDetails"]["address"].toString().substring(0, 85) + "...";
                    }
                    else {
                      outLocation = attendanceData["outDetails"]["address"];
                    }
                    let latLngString = attendanceData["outDetails"]["location"];
                    if (latLngString != undefined) {
                      let [latitude, longitude] = latLngString.split(',');
                      outLat = latitude
                      outLng = longitude
                    }
                  }

                }
              }
              if (outTime != "") {
                let currentTime = new Date(this.selectedDate + " " + outTime);
                let inTimes = new Date(this.selectedDate + " " + inTime);
                let diff = (currentTime.getTime() - inTimes.getTime());
                let hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                let minutes = Math.floor((diff / (1000 * 60)) % 60);
                let rminutes = minutes + hours * 60;
                if (rminutes < 525) {
                  cssWorkingClass = "text-left br-1 workingTime";
                }
                workingHour = (this.commonService.getDiffrernceHrMin(currentTime, inTimes)).toString();
              }
              this.employeeList.push({
                empId: empId, name: detail.name, empCode: detail.empCode,inServerTime:inServerTime,outServerTime:outServerTime ,designationId: designationId, inTime: inTime, outTime: outTime, workingHour: workingHour,
                inTimestemp: inTimestemp, cssClass: cssClass, cssWorkingClass: cssWorkingClass, inLocation: inLocation,
                outLocation: outLocation, inLatLng: { inLat: inLat, inLng: inLng }, outLatLng: { outLat: outLat, outLng: outLng }, approverStatus: approverStatus, status: status, approveBy: approveBy, inLocationFull: inLocationFull, outLocationFull: outLocationFull, isAttendanceApprover: isAttendanceApprover, attendanceApprover: attendanceApprover, attendanceManager: attendanceManager, inImageUrl, outImageUrl, approveAt, displayName: detail.name, reason: reason
              });

            }
          }
          else {

            let data = this.getModificationRequestByEmployeeId(empId, this.selectedDate)
            if (data) {
              this.employeeList.push(data)
            }
          }
          if (i == this.allEmployeeList.length - 1) {
            this.filterData();
            $(this.divLoader).hide();
          }
        }
      );
    }

  }
  getModificationRequestByEmployeeId(empId: any, date: any) {
    let detail = this.modificationRequestList.find(emp => Number(emp.empId) === Number(empId) && new Date(date).toDateString() === new Date(emp.date).toDateString())
    if (detail) {
      let empDetail = this.allEmployeeList.find(emp => Number(emp.empId) === Number(empId));
      let isAttendanceApprover = empDetail["isAttendanceApprover"];
      let attendanceApprover = empDetail["attendanceApprover"];
      let attendanceManager = empDetail["attendanceManager"];
      let designationId = empDetail["designationId"];
      let inTime = detail ? detail['inTime'].split('~')[1] : ""
      let outTime = detail ? detail['outTime'].split('~')[1] : ""
      let data = {
        empId: empId,
        displayName: this.filterType === 'byDate' ? empDetail.name : this.commonService.convertDateWithMonthName(date),
        name: this.filterType === 'byDate' ? empDetail.name : date,
        empCode: empDetail.empCode,
        inTime: inTime ? inTime !== '--' ? inTime : "--/--" : "--/--",
        outTime: outTime ? outTime !== '--' ? outTime : "--/--" : "--/--",
        status: 'Not Approved',
        approverStatus: '0',
        designationId: designationId,
        isAttendanceApprover: isAttendanceApprover,
        attendanceApprover: attendanceApprover,
        attendanceManager: attendanceManager,
      }
      if (this.filterType !== 'byDate') {
        data['isModificationRequired'] = true;
      }
      return data
    }
    else {
      return null
    }

  }

  getAttendanceByEmployee() {
    this.attendanceList = [];
    this.employeeList = [];
    this.notApprovedCount = 0;
    if ($(this.ddlEmployee).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select employee !!!");
      return;
    }
    let empId = $(this.ddlEmployee).val();
    let dateFrom = $(this.txtDateFrom).val();
    let dateTo = $(this.txtDateTo).val();
    if (new Date(dateFrom.toString()) > new Date(dateTo.toString())) {
      this.commonService.setAlertMessage("error", "Please select correct date range !!!");
      return;
    }
    $(this.divLoader).show();
    this.getAttendanceEmployee(empId, dateFrom, dateTo);
    this.clearMarkers()
  }

  getAttendanceEmployee(empId: any, date: any, dateTo: any) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAttendanceEmployee");

    this.showStatus = true;
    if (new Date(date) <= new Date(dateTo)) {
      let year = date.split('-')[0];
      let isAttendanceApprover = "0";
      let attendanceManager = "";
      let detail = this.allEmployeeList.find(item => item.empId == empId);
      if (detail != undefined) {
        isAttendanceApprover = detail.isAttendanceApprover;
        attendanceManager = detail.attendanceManager;
      }
      let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      let dbPath = "Attendance/" + empId + "/" + year + "/" + monthName + "/" + date;
      let employeeAttendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
        attendanceData => {
          employeeAttendanceInstance.unsubscribe();
          if (attendanceData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAttendanceEmployee", attendanceData);
            let detail = this.allEmployeeList.find(item => item.empId == empId);
            if (detail != undefined) {
              let inTime = "";
              let outTime = "";
              let inServerTime='';
              let outServerTime='';
              let workingHour = "";
              let inTimestemp = 0;
              let status = "";
              let approverStatus = "0";
              let inLocation = "";
              let inLocationFull = "";
              let outLocationFull = "";
              let outLocation = "";
              let inLat: "";
              let inLng: "";
              let outLat = "";
              let outLng = "";
              let approveBy = "";
              let cssClass = "text-left br-1";
              let cssWorkingClass = "text-left br-1";
              let inImageUrl = '';
              let outImageUrl = '';
              let approveAt = '';//to show approve at time in new line
              let reason = '';

              if (attendanceData["inDetails"] != null) {
                inImageUrl = attendanceData["inDetails"]['imageURL'] || '';

                if (attendanceData["inDetails"]["status"] != null) {
                  status = attendanceData["inDetails"]["status"];
                  approverStatus = status;
                  reason = attendanceData["inDetails"]["reason"]
                  if (status == "0") {
                    status = "Not Approved";
                  } if (status == "1") {
                    status = "Full Day";
                  } if (status == "2") {
                    status = "Pre Lunch";

                  } if (status == "3") {
                    status = "Post Lunch";

                  } if (status == "4") {
                    status = "Absent";

                  } if (status == "default") {
                    status = "Leave";

                  }
                }

                if (attendanceData["inDetails"]["approveBy"] != null) {
                  let userDetail = this.userList.find(item => item.userId == attendanceData["inDetails"]["approveBy"]);
                  if (userDetail != undefined) {
                    approveBy = userDetail.name;
                  }
                }
                if (attendanceData["inDetails"]["approveAt"] != null) {
                  let approveAtDetail = attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[1])) + " " + attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[0] + " at " + attendanceData["inDetails"]["approveAt"].split(" ")[1];
                  // approveBy = approveBy + " on " + approveAt;
                  approveAt = approveAtDetail; //to show approve at time in new line
                }
              }
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inServerTime = attendanceData['inDetails']['serverTime']?attendanceData['inDetails']['serverTime']:""
                  if (attendanceData["inDetails"]["address"] != null) {
                    inLocationFull = attendanceData["inDetails"]["address"];
                    if (attendanceData["inDetails"]["address"].toString().length > 85) {
                      inLocation = attendanceData["inDetails"]["address"].toString().substring(0, 85) + "...";
                    }
                    else {
                      inLocation = attendanceData["inDetails"]["address"];
                    }
                  }
                  let latLngString = attendanceData["inDetails"]["location"]
                  if (latLngString != undefined) {
                    let [latitude, longitude] = latLngString.split(',');
                    inLat = latitude
                    inLng = longitude
                  }

                  inTimestemp = new Date(date + " " + inTime).getTime();
                  let afterTimestemp = new Date(date + " 08:30").getTime();
                  if (inTimestemp > afterTimestemp) {
                    cssClass = "text-left br-1 afterTime";
                  }

                }
              }
              if (attendanceData["outDetails"] != null) {
                outImageUrl = attendanceData["outDetails"]['imageURL'] || '';
                if (attendanceData["outDetails"]["time"] != null) {
                  outTime = attendanceData["outDetails"]["time"];
                  outServerTime = attendanceData['outDetails']['serverTime']?attendanceData['outDetails']['serverTime']:"";
                  if (attendanceData["outDetails"]["address"] != null) {
                    outLocationFull = attendanceData["outDetails"]["address"];
                    if (attendanceData["outDetails"]["address"].toString().length > 85) {
                      outLocation = attendanceData["outDetails"]["address"].toString().substring(0, 85) + "...";
                    }
                    else {
                      outLocation = attendanceData["outDetails"]["address"];
                    }
                    let latLngString = attendanceData["outDetails"]["location"];
                    if (latLngString != undefined) {
                      let [latitude, longitude] = latLngString.split(',');
                      outLat = latitude
                      outLng = longitude
                    }
                  }
                }

              }
              if (outTime != "") {
                if (inTime == "12:00") {
                  inTime = "10:59";
                }
                let currentTime = new Date(this.selectedDate + " " + outTime);
                let inTimes = new Date(this.selectedDate + " " + inTime);
                let diff = (currentTime.getTime() - inTimes.getTime());
                let hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                let minutes = Math.floor((diff / (1000 * 60)) % 60);
                let rminutes = minutes + hours * 60;
                if (rminutes < 525) {
                  cssWorkingClass = "text-left br-1 workingTime";
                }
                workingHour = (this.commonService.getDiffrernceHrMin(currentTime, inTimes)).toString();
              }
              let modificationDetail = this.modificationRequestList.find(item => Number(item.empId) == Number(empId) && new Date(date).toDateString() === new Date(item.date).toDateString())


              this.employeeList.push({ empId: empId, name: date,inServerTime:inServerTime,outServerTime:outServerTime ,isModificationRequired: modificationDetail ? true : false, empCode: detail.empCode, inTime: inTime, outTime: outTime, workingHour: workingHour, inTimestemp: inTimestemp, cssClass: cssClass, cssWorkingClass: cssWorkingClass, status: status, inLocation: inLocation, outLocation: outLocation, inLatLng: { inLat: inLat, inLng: inLng }, outLatLng: { outLat: outLat, outLng: outLng }, approverStatus: approverStatus, approveBy: approveBy, inLocationFull: inLocationFull, outLocationFull: outLocationFull, isAttendanceApprover: isAttendanceApprover, attendanceManager: attendanceManager, inImageUrl, outImageUrl, approveAt, displayName: this.commonService.convertDateWithMonthName(date), reason: reason });
            }
            this.setAllMarker()
            this.getAttendanceEmployee(empId, this.commonService.getNextDate(date, 1), dateTo);
          }
          else {
            let data = this.getModificationRequestByEmployeeId(empId, date)
            if (data) {
              this.employeeList.push(data)
            }
            this.getAttendanceEmployee(empId, this.commonService.getNextDate(date, 1), dateTo);

          }
        });
    }
    else {
      this.attendanceList = this.employeeList
      this.getNotApprovedAttendanceCount();
      $(this.divLoader).hide();
    }
  }

  getNotApprovedAttendanceCount() {
    this.notApprovedCount = Number(this.attendanceList.filter(item => item.status == "Not Approved" && item.isAttendanceApprover == "1").length);
  }

  setDate(filterVal: any, type: string) {
    (<HTMLInputElement>document.getElementById(this.chkNotApproved)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotApprovedEmployee)).checked = false;
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        if (this.allEmployeeList.length > 0) {
          $(this.divLoader).show();
          this.getSelectedYearMonthName();
          this.getAttendance();
        }
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  filterData() {
    this.attendanceList = [];
    let updatedList;
    let filterVal = $(this.ddlTime).val();
    if (filterVal == "0") {
      this.attendanceList = this.employeeList;
    }
    else {
      let filterTimestemp = new Date(this.selectedDate + " " + filterVal).getTime();
      this.attendanceList = this.employeeList.filter(item => item.inTimestemp > filterTimestemp);
    }
    if ($(this.ddlAttendanceManager).val() !== "0") {
      this.attendanceList = this.employeeList.filter(item => item.attendanceApprover == $(this.ddlAttendanceManager).val());
    }

    if ((<HTMLInputElement>document.getElementById(this.chkNotApproved)).checked == true) {
      this.attendanceList = this.attendanceList.filter(item => item.status == "Not Approved" && item.isAttendanceApprover == "1");
    }
    if (filterVal == "0") {
      this.getNotApprovedAttendanceCount();
    }

    if (this.modificationRequestList.length > 0 && this.attendanceList.length > 0) {
      let date = $(this.txtDate).val().toString()
      updatedList = this.attendanceList.map(emp => {
        const detail = this.modificationRequestList.find(item => Number(item.empId) === Number(emp.empId) && new Date(date).toDateString() === new Date(item.date).toDateString());
        if (detail) {
          return { ...emp, isModificationRequired: true };
        } else {
          return { ...emp, isModificationRequired: false };
        }
      })
      this.attendanceList = updatedList

    }
  }
  /*
  Function name : filterByMismatchTime
  Description : This function is working for filter employees attendance data by their mobile inOutTime and server inOutTime
  Written by : Ritik Parmar
  Written date : 15 Jan 2025
   */
filterByMismatchTime(event:Event){
  const isChecked = (event.target as HTMLInputElement).checked;
   if (isChecked) {
      let filterList =this.employeeList.filter(emp=>emp.inTime.toString()!==emp.inServerTime.toString()||emp.outTime.toString()!==emp.outServerTime.toString())
      this.attendanceList = filterList
   }
   else{
    this.attendanceList = this.employeeList
   }
}

  filterDataEmployee() {
    this.attendanceList = [];
    this.attendanceList = this.employeeList;
    if ((<HTMLInputElement>document.getElementById(this.chkNotApprovedEmployee)).checked == true) {
      this.attendanceList = this.attendanceList.filter(item => item.status == "Not Approved" && item.isAttendanceApprover == "1");
    }
  }

  openLocation(content: any, index: any, type: any) {
    if (this.attendanceList.length == 0) {
      this.commonService.setAlertMessage("error", "No Locations found !!!");
      return;
    }
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();
    let height = (windowHeight * 90) / 100;
    let width = (windowWidth * 90) / 100;
    let mapHeight = height - 200 + "px";
    if (type == "All") {
      mapHeight = height - 100 + "px";
      $("#divLocation").hide();
    }
    else {
      $("#divLocation").show();
    }
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $("#locationtMap").css("height", mapHeight);

    this.setMapLocation();
    setTimeout(() => {
      if (type == "All") {
        let detail = this.allEmployeeList.find(item => item.empId == $(this.ddlEmployee).val());
        if (detail != undefined) {
          $("#lblName").html(detail.name + " [" + detail.empCode + "]");
        }
        this.setAllMarker();
      }
      else {
        let inLocation = this.attendanceList[index]["inLocationFull"];
        let outLocation = this.attendanceList[index]["outLocationFull"];
        let name = "";
        if (this.filterType == "byDate") {
          name = this.attendanceList[index]["name"] + " [" + this.attendanceList[index]["empCode"] + "]";
        }
        else {
          let detail = this.allEmployeeList.find(item => item.empId == $(this.ddlEmployee).val());
          if (detail != undefined) {
            name = detail.name + " [" + detail.empCode + "]";
          }
        }
        $("#lblName").html(name);
        $("#lblInLocation").html(inLocation);
        $("#lblOutLocation").html(outLocation);
        this.setMarkerOnMap(this.attendanceList[index]["inLatLng"], this.attendanceList[index]["outLatLng"]);
      }
    }, 200);

  }

  setMapLocation() {
    let mapProp = this.commonService.mapForHaltReport();
    this.mapLocation = new google.maps.Map(document.getElementById("locationtMap"), mapProp);
  }

  setMarkerOnMap(inLatLng: any, outLatLng: any) {
    let loginTitle = "Login Location"
    let logoutTitile = "Logout Location"
    const loginIconURL = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    const logoutIconURL = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    this.setMarker(loginIconURL, inLatLng.inLat, inLatLng.inLng, loginTitle);
    if (outLatLng.outLat != "" && outLatLng.outLng != "") {
      this.setMarker(logoutIconURL, outLatLng.outLat, outLatLng.outLng, logoutTitile);
    }
  }

  openApprovePopup(content: any, index: any, approverStatus: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 300;
    let width = 300;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    let empId = this.attendanceList[index]["empId"];
    let date = $(this.txtDate).val().toString();
    let reason = this.attendanceList[index]["reason"];
    if (this.filterType != "byDate") {
      date = this.attendanceList[index]["name"];
    }
    $(this.ddlStatus).val(approverStatus);
    $(this.hddEmpId).val(empId);
    $(this.hddDate).val(date);
    $(this.hddIndex).val(index);
    setTimeout(() => {
      $('#inputReason').val(reason)
    }, 200);
  }
  /*
  Funtion name :  openModificationPopup
  Description : This function is working for open modification popup window of the selected employee and set employee modification details in popup window
  Written by : Ritik Parmar
  Written date : 26 Dec 2024
   */
  openModificationPopup(content: any, index: any, approverStatus: any) {
    this.modalService.open(content, { size: 'lg' });
    let windowHeight = $(window).height();
    let height = 450;
    let width = 300;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $('#mdStatus1').val(approverStatus)
    let empId = this.attendanceList[index]["empId"];
    let inTime = this.attendanceList[index]["inTime"];
    let outTime = this.attendanceList[index]["outTime"];
    let name = this.attendanceList[index]["name"];
    let date = this.filterType === 'byDate' ? $(this.txtDate).val().toString() : name;
    let detail = this.modificationRequestList.find((emp) => Number(emp.empId) === Number(empId) && new Date(date).toDateString() === new Date(emp.date).toDateString());
    let requestedInTime = detail && detail.inTime ? detail.inTime.split('~') : ''
    let requestedOutTime = detail && detail.outTime ? detail.outTime.split('~') : ""
    let remark = detail && detail.remark ? detail.remark : '';
    let modificationCase = detail && detail.case ? detail.case : '';

    this.modificationPopUpData = {
      empId: empId,
      index: index,
      date: date ? date : '',
      modificationId: detail && detail.modificationId ? detail.modificationId : '',
      modificationCase: modificationCase ? modificationCase : '---',
      inTime: inTime ? inTime : '--/--',
      outTime: outTime ? outTime : '--/--',
      requestedInTime: requestedInTime ? requestedInTime[0] !== '--' ? requestedInTime[0] : requestedInTime[1] : '--/--',
      requestedOutTime: requestedOutTime ? requestedOutTime[0] !== '--' ? requestedOutTime[0] : requestedOutTime[1] : '--/--',
      remark: remark ? remark : "---",
    }
  }
  /* 
  Funtion name : updateEmployeeAttendance
  Description : This function is working for update employee attendance as per its modification request and set updated data locally in attandance list
  Written by  : Ritik Parmar
  Written date : 26 Dec 2024
  Updated by : Ritik Parmar
  Updated date : 28 Dec 2024
  */
  updateEmployeeAttendance() {
    let attendanceStatusValue = $('#mdStatus1').val();
    let data = this.modificationPopUpData;
    let { empId, index, modificationId, requestedInTime, requestedOutTime, date } = data;
    let cssClass = "text-left br-1";
    let cssWorkingClass = "text-left br-1";
    let workingHour = "";
    let inTimestemp = 0;
    if (empId && modificationId && requestedInTime && requestedOutTime && date) {
      let year = date.split('-')[0];
      let month = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
      let approveDate = this.commonService.getTodayDateTime()
      let inDetailsPath = `/Attendance/${empId}/${year}/${month}/${date}/inDetails`
      let outDetailsPath = `/Attendance/${empId}/${year}/${month}/${date}/outDetails`
      let modificationPath = `/ModificationRequests/${modificationId}/`
      this.db.object(inDetailsPath).update({ status: attendanceStatusValue, approveAt: approveDate, approveBy: localStorage.getItem('userID'), time: requestedInTime })
      this.db.object(outDetailsPath).update({ time: requestedOutTime });
      this.db.object(modificationPath).update({ isApproved: 'true' });

      this.attendanceList[index]["approverStatus"] = attendanceStatusValue;

      if (attendanceStatusValue == "0") {
        this.attendanceList[index]["status"] = "Not Approved";
      } else if (attendanceStatusValue == "1") {
        this.attendanceList[index]["status"] = "Full Day";
      } else if (attendanceStatusValue == "2") {
        this.attendanceList[index]["status"] = "Pre Lunch";

      } else if (attendanceStatusValue == "3") {
        this.attendanceList[index]["status"] = "Post Lunch";

      } else if (attendanceStatusValue == "4") {
        this.attendanceList[index]["status"] = "Absent";
      }

      let approveAt = approveDate.split(" ")[0].split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(approveDate.split(" ")[0].split('-')[1])) + " " + approveDate.split(" ")[0].split('-')[0] + " at " + approveDate.split(" ")[1];
      let userDetail = this.userList.find(item => item.userId == localStorage.getItem("userID"));
      if (requestedInTime) {
        inTimestemp = new Date(date + " " + requestedInTime).getTime();
        let afterTimestemp = new Date(date + " 08:30").getTime();
        if (inTimestemp > afterTimestemp) {
          cssClass = "text-left br-1 afterTime";
        }
      }

      if (requestedOutTime) {
        let currentTime = new Date(this.selectedDate + " " + requestedOutTime);
        let inTimes = new Date(this.selectedDate + " " + requestedInTime);
        let diff = (currentTime.getTime() - inTimes.getTime());
        let hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        let minutes = Math.floor((diff / (1000 * 60)) % 60);
        let rminutes = minutes + hours * 60;
        if (rminutes < 525) {
          cssWorkingClass = "text-left br-1 workingTime";
        }
        workingHour = (this.commonService.getDiffrernceHrMin(currentTime, inTimes)).toString();
      }
      this.attendanceList[index]['isModificationRequired'] = false;
      this.attendanceList[index]['inTime'] = requestedInTime;
      this.attendanceList[index]['outTime'] = requestedOutTime;
      this.attendanceList[index]['cssClass'] = cssClass
      this.attendanceList[index]['cssWorkingClass'] = cssWorkingClass
      this.attendanceList[index]['workingHour'] = workingHour
      this.attendanceList[index]['inTimestemp'] = inTimestemp
      this.attendanceList[index]["approveBy"] = userDetail ? userDetail.name : "";
      this.attendanceList[index]["approveAt"] = approveAt; //to show approve at time in new line
      this.modificationRequestList = this.modificationRequestList.map(item => {
        if (Number(item.empId) === Number(empId) && new Date(date).toDateString() === new Date(item.date).toDateString()) {
          return { ...item, isApproved: 'true' }
        }
        return item
      });
      let updatedModificationRequestList = this.modificationRequestList.filter(emp => emp.isApproved.toString() === 'false')
      this.modificationRequestList = updatedModificationRequestList
      this.commonService.saveJsonFile(updatedModificationRequestList, 'modifcationRequest.json', '/AttendanceModificationRequestJSON/');
      this.commonService.saveJsonFile({ lastUpdatedAt: this.commonService.getTodayDateTime() }, 'lastUpdateDate.json', '/AttendanceModificationRequestJSON/');

      this.commonService.setAlertMessage("success", "Attendance update successfully.");
      this.cancelModificationPopup();
    }
    else {
      this.commonService.setAlertMessage('error', 'Error saving changes !!!');

      return
    }

  }
    /* 
  Funtion name : updateEmployeeAttendance
  Description : This function is working for close modification popup window
  Written by  : Ritik Parmar
  Written date : 26 Dec 2024
  */
  cancelModificationPopup() {
    this.modificationPopUpData = {}
    this.modalService.dismissAll()
  }
  approveAttendance() {
    let date = $(this.hddDate).val().toString();
    let index = $(this.hddIndex).val().toString();
    let approveStatus = $(this.ddlStatus).val();
    let reason = $('#inputReason').val() ? $('#inputReason').val().toString() : '';
    if ((approveStatus == "2" || approveStatus == "3" || approveStatus == "4") && reason.trim() === '') {
      this.commonService.setAlertMessage("error", "Please enter the reason!");
      return;
    }
    let empId = $(this.hddEmpId).val();
    let year = date.split('-')[0];
    let approveDate = this.commonService.getTodayDateTime();
    let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
    let dbPath = "Attendance/" + empId + "/" + year + "/" + monthName + "/" + date + "/inDetails";
    this.db.object(dbPath).update({ status: approveStatus, approveBy: localStorage.getItem("userID"), approveAt: approveDate, reason: reason });
    this.attendanceList[index]["approverStatus"] = approveStatus;
    this.attendanceList[index]["reason"] = reason;
    if (approveStatus == "0") {
      this.attendanceList[index]["status"] = "Not Approved";
    } else if (approveStatus == "1") {
      this.attendanceList[index]["status"] = "Full Day";
    } else if (approveStatus == "2") {
      this.attendanceList[index]["status"] = "Pre Lunch";

    } else if (approveStatus == "3") {
      this.attendanceList[index]["status"] = "Post Lunch";

    } else if (approveStatus == "4") {
      this.attendanceList[index]["status"] = "Absent";
    }
    let approveAt = approveDate.split(" ")[0].split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(approveDate.split(" ")[0].split('-')[1])) + " " + approveDate.split(" ")[0].split('-')[0] + " at " + approveDate.split(" ")[1];
    this.attendanceList[index]["approveAt"] = approveAt;
    let userDetail = this.userList.find(item => item.userId == localStorage.getItem("userID"));
    if (userDetail != undefined) {
      // this.attendanceList[index]["approveBy"] = userDetail.name + " on " + approveAt
      this.attendanceList[index]["approveBy"] = userDetail.name;
      this.attendanceList[index]["approveAt"] = approveAt; //to show approve at time in new line

    }
    this.getNotApprovedAttendanceCount();
    if (this.filterType == "byDate") {
      let detail = this.employeeList.find(item => Number(item.empId) === Number(empId));
      if (detail != undefined) {
        detail.status = this.attendanceList[index]["status"];
      }
      this.filterData();
    }
    else {
      this.filterDataEmployee();
    }
    this.commonService.setAlertMessage("success", "Attendance approved successfully.");
    this.modalService.dismissAll();

  }

  cancelApprove() {
    $(this.hddDate).val("");
    $(this.ddlStatus).val("0");
    $(this.hddEmpId).val("0");
    $(this.hddIndex).val("0");
    this.modalService.dismissAll();
  }



  exportToExcel() {
    if (this.attendanceList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      if (this.filterType == "byDate") {
        htmlString += "<td>";
        htmlString += "Employee ID";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Name";
        htmlString += "</td>";
      }
      else {
        htmlString += "<td>";
        htmlString += "Date";
        htmlString += "</td>";
      }
      htmlString += "<td>";
      htmlString += "In Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Out Time";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += " Working Hrs";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Status"
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Approved By"
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Approved At"
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "In location";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Out location";
      htmlString += "</td>";
      htmlString += "</tr>";

      for (let i = 0; i < this.attendanceList.length; i++) {
        htmlString += "<tr>";
        if (this.filterType == "byDate") {
          htmlString += "<td>";
          htmlString += this.attendanceList[i]["empCode"];
          htmlString += "</td>";
        }
        htmlString += "<td t='s'>";
        htmlString += this.attendanceList[i]["name"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["inTime"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["outTime"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["workingHour"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["status"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["approveBy"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["approveAt"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["inLocationFull"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["outLocationFull"];
        htmlString += "</td>";
        htmlString += "</tr>";


      }
      htmlString += "</table>";
      let fileName = "Attendance-" + this.selectedDate + ".xlsx";
      if (this.filterType == "byEmployee") {
        let detail = this.allEmployeeList.find(item => item.empId == $(this.ddlEmployee).val());
        if (detail != undefined) {
          fileName = detail.name + "-Attendance.xlsx";
        }
      }
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

  clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.logoutMarkers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];
    this.logoutMarkers = [];
  }
  setHeight() {
    $(".navbar-toggler").show();
    const newHeight = 88;
    const newWidth = 100;

    $("#divMap").css({
      "height": "400px",
      "width": "400px",
    });
  }
  setDefaultMap() {
    let mapProp = this.commonService.initMapProperties();
    this.map = new google.maps.Map(this.gmap.nativeElement, mapProp);
    this.map.setOptions({ zoomControl: false });
  }

  setMarker(iconUrl: any, Lat: any, Lng: any, title: any) {
    let marker = new google.maps.Marker({
      position: { lat: Number(Lat), lng: Number(Lng) },
      map: this.mapLocation,
      title: title,
      icon: iconUrl
    });
    this.bounds.extend({ lat: Number(Lat), lng: Number(Lng) })
    this.mapLocation.fitBounds(this.bounds);
    this.markers.push(marker);
  }

  setAllMarker() {
    for (let i = 0; i < this.attendanceList.length; i++) {
      let loginLatLng = this.attendanceList[i].inLatLng
      let logoutLatLng = this.attendanceList[i].outLatLng

      let loginMarker = new google.maps.Marker({
        position: { lat: Number(loginLatLng.inLat), lng: Number(loginLatLng.inLng) },
        map: this.mapLocation,
        title: "Login Location",
        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });
      if (logoutLatLng.outLat != "" && logoutLatLng.outLng != "") {
        let logoutMarker = new google.maps.Marker({
          position: { lat: Number(logoutLatLng.outLat), lng: Number(logoutLatLng.outLng) },
          map: this.mapLocation,
          title: "Logout Location",
          icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        this.logoutMarkers.push(logoutMarker)
        this.bounds.extend({ lat: Number(logoutLatLng.outLat), lng: Number(logoutLatLng.outLng) })
        this.mapLocation.fitBounds(this.bounds);
      }
      this.bounds.extend({ lat: Number(loginLatLng.inLat), lng: Number(loginLatLng.inLng) })
      this.mapLocation.fitBounds(this.bounds);
      this.markers.push(loginMarker);

    }
  }

  /*
    function name : updateModificationRequestList
    Description : This function is written for update employee's modification request list
    Written By : Ritik Parmar 
    Written Date  : 24 Dec 2024
  
  */
  updateModificationRequestList() {
    try {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "updateModificationRequestList");
      let storagePath = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FAttendanceModificationRequestJSON%2FlastUpdateDate.json?alt=media"
      let storageInstance = this.httpService.get(storagePath).subscribe(dateObj => {
        storageInstance.unsubscribe()
        if (dateObj) {
          let lastUpdatedAt = new Date(dateObj['lastUpdatedAt']);
          let currentDate = new Date()
          if (dateObj && lastUpdatedAt.toDateString() === currentDate.toDateString()) {
            storagePath = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FAttendanceModificationRequestJSON%2FmodifcationRequest.json?alt=media"
            this.getAllModificationRequest(storagePath)
          }
          else {
            this.getAllModificationRequest('')
          }
        }
        else {
          this.getAllModificationRequest('')
        }
      }, error => {
        this.getAllModificationRequest('')
      })
    } catch (error) {
      return
    }

  }
  /*
  Function name : getAllmodificationRequest
  Description : This function is written for get all modification requests,
  based on path parameter and if path is given then it will get data from storage,
  and  if not given then get from data base and save json file.
  Written by : Ritik Parmar
  Written date  : 23-12-2024 
  Updated by : Ritik Parmar
  Updated date : 24 Dec 2024 
  */
  getAllModificationRequest(path: string) {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAllModificationRequest");
    if (path) {
      let storageInstance = this.httpService.get(path).subscribe(response => {
        storageInstance.unsubscribe();
        if (response) {
          this.modificationRequestList = JSON.parse(JSON.stringify(response));
        } else {
          this.modificationRequestList = [];
        }
      });
    } else {
      let modificationInstance = this.db.object('ModificationRequests/').valueChanges().subscribe(
        modificationData => {
          modificationInstance.unsubscribe();
          if (modificationData !== null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAllModificationRequest", modificationData);
            let list = Object.keys(modificationData).reduce((acc, id) => {
              if (modificationData[id]['isApproved'].toString() === 'false') {
                acc.push({ modificationId: id, ...modificationData[id] });
              }
              return acc;
            }, []);
            if (list && list.length > 0) {
              this.modificationRequestList = list;
              this.commonService.saveJsonFile(list, 'modifcationRequest.json', '/AttendanceModificationRequestJSON/');
              this.commonService.saveJsonFile({ lastUpdatedAt: this.commonService.getTodayDateTime() }, 'lastUpdateDate.json', '/AttendanceModificationRequestJSON/');
            } else {
              this.modificationRequestList = [];
            }
          } else {
            this.modificationRequestList = [];
          }
          // Call after modificationRequestList is updated

        }
      );
    }
  }
}
