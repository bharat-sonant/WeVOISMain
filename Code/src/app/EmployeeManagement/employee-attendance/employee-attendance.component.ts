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
  chkFieldExecutive = "chkFieldExecutive";
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
  divConfirmApprove = "#divConfirmApprove";
  markers: any[] = [];
  logoutMarkers: any[] = [];
  bounds = new google.maps.LatLngBounds();
  showStatus: any;
  public filterType: any;
  serviceName = "employee-attendance";
  isAttendanceApprover: any;
  userList: any[] = [];
  public notApprovedCount: any;

  public mapLocation: google.maps.Map;

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.isAttendanceApprover = localStorage.getItem("isAttendanceApprover");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.userList = JSON.parse(localStorage.getItem("webPortalUserList"));
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

  getEmployees() {
    $(this.divLoader).show();
    this.allEmployeeList = [];
    this.employeeList = [];
    const path = this.fireStorePath + this.commonService.getFireStoreCity() + "%2FEmployees.json?alt=media";
    let accountInstance = this.httpService.get(path).subscribe(data => {
      accountInstance.unsubscribe();
      if (data != null) {
        let keyArray = Object.keys(data);
        if (keyArray.length > 0) {
          for (let i = 0; i < keyArray.length; i++) {
            let empId = keyArray[i];
            if (data[empId]["GeneralDetails"]["empType"] == 1) {
              this.allEmployeeList.push({ empId: empId.toString(), empCode: data[empId]["GeneralDetails"]["empCode"], name: data[empId]["GeneralDetails"]["name"], designationId: data[empId]["GeneralDetails"]["designationId"], designation: data[empId]["GeneralDetails"]["designation"], status: data[empId]["GeneralDetails"]["status"], empType: data[empId]["GeneralDetails"]["empType"] });
            }
          }
        }
        this.allEmployeeList = this.commonService.transformNumeric(this.allEmployeeList, "name"); this.getFilterEmployee();
        this.getAttendance();
      }
    }, error => {
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
      let designationId = this.allEmployeeList[i]["designationId"];
      let dbPath = "Attendance/" + empId + "/" + this.selectedYear + "/" + this.selectedMonthName + "/" + this.selectedDate;

      let employeeAttendanceInstance = this.db.object(dbPath).valueChanges().subscribe(
        attendanceData => {
          employeeAttendanceInstance.unsubscribe();

          if (attendanceData != null) {
            this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAttendance", attendanceData);
            let detail = this.allEmployeeList.find(item => item.empId == empId);
            if (detail != undefined) {
              let inTime = "";
              let outTime = "";
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

              let cssClass = "text-left br-1";
              let cssWorkingClass = "text-left br-1";
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inLocationFull=attendanceData["inDetails"]["address"];
                  if (attendanceData["inDetails"]["address"].toString().length > 30) {
                    inLocation = attendanceData["inDetails"]["address"].toString().substring(0, 30) + "......";
                  }
                  else {
                    inLocation = attendanceData["inDetails"]["address"];
                  }
                  let latLngString = attendanceData["inDetails"]["location"]
                  if (latLngString != undefined) {
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
                    let approveAt = attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[1])) + " " + attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[0] + " at " + attendanceData["inDetails"]["approveAt"].split(" ")[1];
                    approveBy = approveBy + " on " + approveAt;
                  }
                }
              }
              if (attendanceData["outDetails"] != null) {
                if (attendanceData["outDetails"]["time"] != null) {
                  outTime = attendanceData["outDetails"]["time"];
                  if (attendanceData["outDetails"]["address"] != null) {
                    outLocationFull=attendanceData["outDetails"]["address"];
                    if (attendanceData["outDetails"]["address"].toString().length > 30) {
                      outLocation = attendanceData["outDetails"]["address"].toString().substring(0, 30) + "......";
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
                empId: empId, name: detail.name, empCode: detail.empCode, designationId: designationId, inTime: inTime, outTime: outTime, workingHour: workingHour,
                inTimestemp: inTimestemp, cssClass: cssClass, cssWorkingClass: cssWorkingClass, inLocation: inLocation,
                outLocation: outLocation, inLatLng: { inLat: inLat, inLng: inLng }, outLatLng: { outLat: outLat, outLng: outLng }, approverStatus: approverStatus, status: status, approveBy: approveBy,inLocationFull:inLocationFull,outLocationFull:outLocationFull
              });
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
              let workingHour = "";
              let inTimestemp = 0;
              let status = "";
              let approverStatus = "0";
              let inLocation = "";
              let inLocationFull="";
              let outLocationFull="";
              let outLocation = "";
              let inLat: "";
              let inLng: "";
              let outLat = "";
              let outLng = "";
              let approveBy = "";
              let cssClass = "text-left br-1";
              let cssWorkingClass = "text-left br-1";
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["status"] != null) {
                  status = attendanceData["inDetails"]["status"];
                  approverStatus = status;
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
                  let approveAt = attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[2] + " " + this.commonService.getCurrentMonthShortName(Number(attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[1])) + " " + attendanceData["inDetails"]["approveAt"].split(" ")[0].split('-')[0] + " at " + attendanceData["inDetails"]["approveAt"].split(" ")[1];
                  approveBy = approveBy + " on " + approveAt;
                }
              }
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inLocationFull=attendanceData["inDetails"]["address"];
                  if (attendanceData["inDetails"]["address"].toString().length > 30) {
                    inLocation = attendanceData["inDetails"]["address"].toString().substring(0, 30) + "......";
                  }
                  else {
                    inLocation = attendanceData["inDetails"]["address"];
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
                if (attendanceData["outDetails"]["time"] != null) {
                  outTime = attendanceData["outDetails"]["time"];
                  if (attendanceData["outDetails"]["address"] != null) {
                    outLocationFull=attendanceData["outDetails"]["address"];
                    if (attendanceData["outDetails"]["address"].toString().length > 30) {
                      outLocation = attendanceData["outDetails"]["address"].toString().substring(0, 30) + "......";
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
              this.employeeList.push({ empId: empId, name: date, empCode: detail.empCode, inTime: inTime, outTime: outTime, workingHour: workingHour, inTimestemp: inTimestemp, cssClass: cssClass, cssWorkingClass: cssWorkingClass, status: status, inLocation: inLocation, outLocation: outLocation, inLatLng: { inLat: inLat, inLng: inLng }, outLatLng: { outLat: outLat, outLng: outLng }, approverStatus: approverStatus, approveBy: approveBy,inLocationFull:inLocationFull,outLocationFull:outLocationFull });
            }
            this.setAllMarker()
            this.getAttendanceEmployee(empId, this.commonService.getNextDate(date, 1), dateTo);
          }
          else {
            this.getAttendanceEmployee(empId, this.commonService.getNextDate(date, 1), dateTo);
          }
        });
    }
    else {
      this.attendanceList = this.employeeList;
      this.getNotApprovedAttendanceCount();
      $(this.divLoader).hide();
    }
  }

  getNotApprovedAttendanceCount() {
    this.notApprovedCount = Number(this.attendanceList.filter(item => item.status == "Not Approved").length);
  }

  setDate(filterVal: any, type: string) {
    (<HTMLInputElement>document.getElementById(this.chkNotApproved)).checked = false;
    (<HTMLInputElement>document.getElementById(this.chkNotApprovedEmployee)).checked = false;
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $(this.txtDate).val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        $(this.divLoader).show();
        this.getSelectedYearMonthName();
        this.getAttendance();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }

  filterData() {
    this.attendanceList = [];
    let filterVal = $(this.ddlTime).val();
    if (filterVal == "0") {
      this.attendanceList = this.employeeList;
    }
    else {
      let filterTimestemp = new Date(this.selectedDate + " " + filterVal).getTime();
      this.attendanceList = this.employeeList.filter(item => item.inTimestemp >= filterTimestemp);
    }
    if ((<HTMLInputElement>document.getElementById(this.chkFieldExecutive)).checked == false) {
      this.attendanceList = this.attendanceList.filter(item => item.designationId != "25");
    }
    if ((<HTMLInputElement>document.getElementById(this.chkNotApproved)).checked == true) {
      this.attendanceList = this.attendanceList.filter(item => item.status == "Not Approved");
    }
    if (filterVal == "0") {
      this.getNotApprovedAttendanceCount();
    }
  }


  filterDataEmployee() {
    this.attendanceList = [];
    this.attendanceList = this.employeeList;
    if ((<HTMLInputElement>document.getElementById(this.chkNotApprovedEmployee)).checked == true) {
      this.attendanceList = this.attendanceList.filter(item => item.status == "Not Approved");
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
    let height = 250;
    let width = 300;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    let empId = this.attendanceList[index]["empId"];
    let date = $(this.txtDate).val().toString();
    if (this.filterType != "byDate") {
      date = this.attendanceList[index]["name"];
    }
    $(this.ddlStatus).val(approverStatus);
    $(this.hddEmpId).val(empId);
    $(this.hddDate).val(date);
    $(this.hddIndex).val(index);
  }

  approveAttendance() {
    let date = $(this.hddDate).val().toString();
    let index = $(this.hddIndex).val().toString();
    let approveStatus = $(this.ddlStatus).val();
    let empId = $(this.hddEmpId).val();
    let year = date.split('-')[0];
    let approveDate = this.commonService.getTodayDateTime();
    let monthName = this.commonService.getCurrentMonthName(Number(date.split('-')[1]) - 1);
    let dbPath = "Attendance/" + empId + "/" + year + "/" + monthName + "/" + date + "/inDetails";
    this.db.object(dbPath).update({ status: approveStatus, approveBy: localStorage.getItem("userID"), approveAt: approveDate });
    this.attendanceList[index]["approverStatus"] = approveStatus;
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
      this.attendanceList[index]["approveBy"] = userDetail.name + " on " + approveAt
    }
    this.getNotApprovedAttendanceCount();
    if (this.filterType == "byDate") {
      let detail = this.employeeList.find(item => item.empId == this.attendanceList[index]["empId"]);
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

}
