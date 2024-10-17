import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common/common.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseService } from "../../firebase.service";
import { BackEndServiceUsesHistoryService } from '../../services/common/back-end-service-uses-history.service';

@Component({
  selector: 'app-vehicle-assigned',
  templateUrl: './vehicle-assigned.component.html',
  styleUrls: ['./vehicle-assigned.component.scss']
})
export class VehicleAssignedComponent implements OnInit {

  constructor(public fs: FirebaseService, private besuh: BackEndServiceUsesHistoryService, private commonService: CommonService, private modalService: NgbModal) { }
  toDayDate: any;
  selectedDate: any;
  vehicleList: any[];
  assignedVehicleList: any[];
  currentYear: any;
  currentMonth: any[];
  db: any;
  cityName: any;
  serviceName = "vehicle-assigned-report";
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.savePageLoadHistory("General-Reports","Vehicle-Assigned-Report",localStorage.getItem("userID"));
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.selectedDate);
    this.getVehicle();
  }

  getVehicle() {
    this.vehicleList = [];
    let vehicleStorageList = JSON.parse(localStorage.getItem("vehicle"));
    if (vehicleStorageList == null) {
      this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getVehicle");
      let dbPath = "Vehicles";
      let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe((vehicle) => {
        vehicleInstance.unsubscribe();
        if (vehicle != null) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getVehicle", vehicle);
          let keyArrray = Object.keys(vehicle);
          if (keyArrray.length > 0) {
            for (let i = 0; i < keyArrray.length; i++) {
              this.vehicleList.push({ vehicle: keyArrray[i] });
            }
          }
          this.getAssignedVehicle();
        }
      });
    }
    else {
      for (let i = 3; i < vehicleStorageList.length; i++) {
        this.vehicleList.push({ vehicle: vehicleStorageList[i]["vehicle"] });
      }
      this.getAssignedVehicle();
    }
  }

  getAssignedVehicle() {
    this.besuh.saveBackEndFunctionCallingHistory(this.serviceName, "getAssignedVehicle");
    this.assignedVehicleList = [];
    let monthName = this.commonService.getCurrentMonthName(new Date(this.selectedDate).getMonth());
    let year = this.selectedDate.split("-")[0];
    // dustbin assign vehicle
    let dbPath = "DustbinData/DustbinAssignment/" + year + "/" + monthName + "/" + this.selectedDate;
   
    let dustbinInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        dustbinInstance.unsubscribe();
        if (data.length > 0) {
          this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedVehicle", data);
          for (let i = 0; i < data.length; i++) {
            let vehicle = data[i]["vehicle"];
            let driverId = data[i]["driver"];
            let vehicleDetail = this.assignedVehicleList.find(item => item.vehicle == vehicle);
            if (vehicleDetail == undefined) {
              let driverDetail = [];
              this.assignedVehicleList.push({ vehicle: vehicle, driverDetail: driverDetail });
              this.assignedVehicleList = this.commonService.transformNumeric(this.assignedVehicleList, "vehicle");
            }
            this.getEmployeeDetail(driverId, vehicle);
          }          
        }
        // ward assign vehicle
        let zoneList = JSON.parse(localStorage.getItem("latest-zones"));
        for (let j = 1; j < zoneList.length; j++) {
          let wardNo = zoneList[j]["zoneNo"];
          dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails";
          let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              vehicleInstance.unsubscribe();
              if (data != null) {
                this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "getAssignedVehicle", data);
                let vehicles = data["vehicle"].toString().split(',');
                let drivers = data["driver"].toString().split(',');
                for (let k = 0; k < vehicles.length; k++) {
                  let vehicle = vehicles[k].trim();
                  let vehicleDetail = this.assignedVehicleList.find(item => item.vehicle == vehicle);
                  if (vehicleDetail == undefined) {
                    let driverDetail = [];
                    this.assignedVehicleList.push({ vehicle: vehicle, driverDetail: driverDetail });
                    this.assignedVehicleList = this.commonService.transformNumeric(this.assignedVehicleList, "vehicle");
                  }
                  let driverId = drivers[k];
                  this.getEmployeeDetail(driverId, vehicle);
                }
              }
            }
          );
        }
      }
    );
  }

  getEmployeeDetail(empId: any, vehicle: any) {
    this.commonService.getEmplyeeDetailByEmployeeId(empId).then((employee) => {
      let driver = employee["name"];
      let driverMobile = employee["mobile"] != null ? employee["mobile"] : "---";
      let vehicleDetail = this.assignedVehicleList.find(item => item.vehicle == vehicle);
      if (vehicleDetail != undefined) {
        let list = vehicleDetail.driverDetail;
        let driverDetail = list.find(item => item.driver == driver);
        if (driverDetail == undefined) {
          list.push({ driver: driver, driverMobile: driverMobile });
        }
      }
    });
  }

  setDate(filterVal: any, type: string) {
    this.commonService.setDate(this.selectedDate, filterVal, type).then((newDate: any) => {
      $("#txtDate").val(newDate);
      if (newDate != this.selectedDate) {
        this.selectedDate = newDate;
        this.getAssignedVehicle();
      }
      else {
        this.commonService.setAlertMessage("error", "Date can not be more than today date!!!");
      }
    });
  }
  exportToExcel() {
    if (this.assignedVehicleList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Vehicle";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Driver";
      htmlString += "</td>";
      htmlString += "</tr>";

      for (let i = 0; i < this.assignedVehicleList.length; i++) {
        const vehicle = this.assignedVehicleList[i];
        for (let j = 0; j < vehicle.driverDetail.length; j++) {
          htmlString += "<tr>";
          if (j === 0) {
            htmlString += "<td t='s' rowspan='" + vehicle.driverDetail.length + "'>";
            htmlString += vehicle["vehicle"];
            htmlString += "</td>";
          }
          htmlString += "<td t='s'>";
          htmlString += vehicle.driverDetail[j]["driver"]+" - "+ vehicle.driverDetail[j]["driverMobile"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }
      }
      htmlString += "</table>";
      let fileName = "Vehicle Assigned Report - " + this.selectedDate + " .xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }
}
