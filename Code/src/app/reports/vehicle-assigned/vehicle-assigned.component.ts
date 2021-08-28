import { Subscription } from 'rxjs';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/common/user.service';
import { MapService } from '../../services/map/map.service';
import { HttpClient } from '@angular/common/http';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-vehicle-assigned',
  templateUrl: './vehicle-assigned.component.html',
  styleUrls: ['./vehicle-assigned.component.scss']
})
export class VehicleAssignedComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal) { }
  toDayDate: any;
  selectedDate: any;
  vehicleList: any[];
  assignedVehicleList: any[];
  currentYear: any;
  currentMonth: any[];
  db: any;
  cityName: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedDate = this.toDayDate;
    $("#txtDate").val(this.selectedDate);
    this.getVehicle();

  }

  getVehicle() {
    this.vehicleList = [];
    let vehicleStorageList = JSON.parse(localStorage.getItem("vehicle"));
    if (vehicleStorageList == null) {
      let dbPath = "Vehicles";
      let vehicleInstance = this.db
        .object(dbPath)
        .valueChanges()
        .subscribe((vehicle) => {
          vehicleInstance.unsubscribe();
          if (vehicle != null) {
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
    this.assignedVehicleList = [];
    let monthName = this.commonService.getCurrentMonthName(
      new Date(this.selectedDate).getMonth()
    );
    let year = this.selectedDate.split("-")[0];
    // dustbin assign vehicle
    let dbPath = "DustbinData/DustbinAssignment/" + year + "/" + monthName + "/" + this.selectedDate;
    let dustbinInstance = this.db.list(dbPath).valueChanges().subscribe(
      data => {
        dustbinInstance.unsubscribe();
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            let vehicle = data[i]["vehicle"];
            let vehicleDetail = this.assignedVehicleList.find(item => item.vehicle == vehicle);
            if (vehicleDetail == undefined) {
              this.assignedVehicleList.push({ vehicle: vehicle });
              this.assignedVehicleList=this.commonService.transformNumeric(this.assignedVehicleList,"vehicle");
            }
          }
        }
      }
    );

    // ward assign vehicle
    let zoneList=JSON.parse(localStorage.getItem("latest-zones"));
    
    for (let j = 1; j < zoneList.length; j++) {
      let wardNo = zoneList[j]["zoneNo"];
      dbPath = "WasteCollectionInfo/" + wardNo + "/" + year + "/" + monthName + "/" + this.selectedDate + "/WorkerDetails/vehicle";
      let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          vehicleInstance.unsubscribe();
          if (data != null) {
            let vehicles = data.toString().split(',');
            for (let k = 0; k < vehicles.length; k++) {
              let vehicle = vehicles[k];
              let vehicleDetail = this.assignedVehicleList.find(item => item.vehicle == vehicle);
              if (vehicleDetail == undefined) {
                this.assignedVehicleList.push({ vehicle: vehicle });
                this.assignedVehicleList=this.commonService.transformNumeric(this.assignedVehicleList,"vehicle");
              }
            }
          }
        }
      );
    }

  }

  setDate(filterVal: any, type: string) {
    if (type == "current") {
      this.selectedDate = filterVal;
    } else if (type == "next") {
      let nextDate = this.commonService.getNextDate($("#txtDate").val(), 1);
      this.selectedDate = nextDate;
    } else if (type == "previous") {
      let previousDate = this.commonService.getPreviousDate(
        $("#txtDate").val(),
        1
      );
      this.selectedDate = previousDate;
    }
    if (new Date(this.selectedDate) > new Date(this.toDayDate)) {
      this.selectedDate = this.toDayDate;
      this.commonService.setAlertMessage(
        "error",
        "Please select current or previos date!!!"
      );
    }
    $("#txtDate").val(this.selectedDate);
    this.getAssignedVehicle();
  }
}
