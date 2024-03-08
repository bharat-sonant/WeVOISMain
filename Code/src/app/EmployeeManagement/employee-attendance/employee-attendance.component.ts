import { Component, OnInit, ViewChild } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';
//  <reference types="@types/googlemaps" />


@Component({
  selector: 'app-employee-attendance',
  templateUrl: './employee-attendance.component.html',
  styleUrls: ['./employee-attendance.component.scss']
})
export class EmployeeAttendanceComponent implements OnInit {

  @ViewChild("gmap", null) gmap: any;
  public map: google.maps.Map;

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, public httpService: HttpClient) { }
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
  rdoByDate = "rdoByDate";
  rdoByEmployee = "rdoByEmployee";
  divByDate = "#divByDate";
  divByEmployee = "#divByEmployee";
  txtDateFrom = "#txtDateFrom";
  txtDateTo = "#txtDateTo";
  ddlEmployee = "#ddlEmployee";
  markers: any[] = [];
  logoutMarkers: any[] = [];
  bounds = new google.maps.LatLngBounds();
  showStatus: any;
  public filterType: any;
  serviceName = "employee-attendance";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.setHeight()
    this.setDefaultMap()
    this.showStatus = false;
    this.filterType = "byDate";
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
    $(this.ddlEmployee).val(empId);
    this.selectedDate = this.toDayDate;
    $(this.txtDate).val(this.selectedDate);
    $(this.txtDateFrom).val(this.selectedDate);
    $(this.txtDateTo).val(this.selectedDate);
    this.attendanceList = [];
    if (this.filterType == "byDate") {
      this.getAttendance();
      this.showStatus = false;
      this.setDefaultMap()
      this.clearMarkers()
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
              let inLat = "";
              let inLng = "";
              let outLat = "";
              let outLng = "";

              let cssClass = "text-left br-1";
              let cssWorkingClass = "text-left br-1";
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inLocation = attendanceData["inDetails"]["address"];
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
                }
              }
              if (attendanceData["outDetails"] != null) {
                if (attendanceData["outDetails"]["time"] != null) {
                  outTime = attendanceData["outDetails"]["time"];
                  outLocation = attendanceData["outDetails"]["address"];
                  let latLngString = attendanceData["outDetails"]["location"]
                  if (latLngString != undefined) {
                    let [latitude, longitude] = latLngString.split(',');
                    outLat = latitude
                    outLng = longitude
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
                outLocation: outLocation, inLatLng: { inLat: inLat, inLng: inLng }, outLatLng: { outLat: outLat, outLng: outLng }
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
              let inLocation = "";
              let outLocation = "";
              let inLat: "";
              let inLng: "";
              let outLat = "";
              let outLng = "";
              let cssClass = "text-left br-1";
              let cssWorkingClass = "text-left br-1";
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["status"] != null) {
                  status = attendanceData["inDetails"]["status"];
                  if (status == "0") {
                    status = "Not Approved";
                  } if (status == "1") {
                    status = "Full Day";
                  }
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
              if (attendanceData["inDetails"] != null) {
                if (attendanceData["inDetails"]["time"] != null) {
                  inTime = attendanceData["inDetails"]["time"];
                  inLocation = attendanceData['inDetails']["address"]
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
                  outLocation = attendanceData['outDetails']["address"]
                  let latLngString = attendanceData["outDetails"]["location"]
                  if (latLngString != undefined) {
                    let [latitude, longitude] = latLngString.split(',');
                    outLat = latitude
                    outLng = longitude
                  }
                }

              }
              if (outTime != "") {
                if(inTime=="12:00"){
                  inTime="10:59";
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
              this.attendanceList.push({ empId: empId, name: date, empCode: detail.empCode, inTime: inTime, outTime: outTime, workingHour: workingHour, inTimestemp: inTimestemp, cssClass: cssClass, cssWorkingClass: cssWorkingClass, status: status, inLocation: inLocation, outLocation: outLocation, inLatLng: { inLat: inLat, inLng: inLng }, outLatLng: { outLat: outLat, outLng: outLng } });
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
      $(this.divLoader).hide();
    }
  }

  setDate(filterVal: any, type: string) {
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


      if (this.showStatus == true) {
        htmlString += "<td>";
        htmlString += "Status"
        htmlString += "</td>";
      }
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
        if (this.showStatus == true) {
          htmlString += "<td>";
          htmlString += this.attendanceList[i]["status"];
          htmlString += "</td>";
        }
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["inLocation"];
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += this.attendanceList[i]["outLocation"];
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

  setMarkerOnMap(inLatLng: any, outLatLng: any) {
    if (this.showStatus != true) {
      this.clearMarkers();
      let loginTitle = "Login Location"
      let logoutTitile = "Logout Location"
      const loginIconURL = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
      const logoutIconURL = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
      this.setMarker(loginIconURL, inLatLng.inLat, inLatLng.inLng, loginTitle)
      if (outLatLng.outLat != "" && outLatLng.outLng != "") {
        this.setMarker(logoutIconURL, outLatLng.outLat, outLatLng.outLng, logoutTitile)

      }
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
      "height": newHeight + "vh",
      "width": newWidth + "vh",
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
      map: this.map,
      title: title,
      icon: iconUrl
    });
    this.bounds.extend({ lat: Number(Lat), lng: Number(Lng) })
    this.map.fitBounds(this.bounds);
    this.markers.push(marker);
  }

  setAllMarker() {
    for (let i = 0; i < this.attendanceList.length; i++) {
      let loginLatLng = this.attendanceList[i].inLatLng
      let logoutLatLng = this.attendanceList[i].outLatLng

      let loginMarker = new google.maps.Marker({
        position: { lat: Number(loginLatLng.inLat), lng: Number(loginLatLng.inLng) },
        map: this.map,
        title: "Login Location",
        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });
      if (logoutLatLng.outLat != "" && logoutLatLng.outLng != "") {
        let logoutMarker = new google.maps.Marker({
          position: { lat: Number(logoutLatLng.outLat), lng: Number(logoutLatLng.outLng) },
          map: this.map,
          title: "Logout Location",
          icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        this.logoutMarkers.push(logoutMarker)
        this.bounds.extend({ lat: Number(logoutLatLng.outLat), lng: Number(logoutLatLng.outLng) })
        this.map.fitBounds(this.bounds);
      }
      this.bounds.extend({ lat: Number(loginLatLng.inLat), lng: Number(loginLatLng.inLng) })
      this.map.fitBounds(this.bounds);
      this.markers.push(loginMarker);

    }
  }

}
