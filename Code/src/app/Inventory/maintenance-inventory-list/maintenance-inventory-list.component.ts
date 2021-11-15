import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { Router } from '@angular/router';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-maintenance-inventory-list',
  templateUrl: './maintenance-inventory-list.component.html',
  styleUrls: ['./maintenance-inventory-list.component.scss']
})
export class MaintenanceInventoryListComponent implements OnInit {

  constructor(private router: Router, public fs: FirebaseService, private commonService: CommonService) { }

  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  yearList: any[] = [];
  maintenanceList: any[] = [];
  partAllList: any[] = [];
  userId: any;
  partList: any = [];
  totalAmount: any = 0;
  cityName: any;
  db: any;
  costData: costDatail =
    {
      totalAmount: "0.00"
    }

  ngOnInit() {
    this.cityName = localStorage.getItem('cityName');
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);

    this.userId = localStorage.getItem('userID');
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.getParts();
    $('#ddlPart').val("All Parts");
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.getMaintenanceList("All Parts", $('#date').val());
  }

  getParts() {
    let dbPath = "Defaults/VehicleParts";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      vehicle => {
        vehicleInstance.unsubscribe();
        this.partList.push({ part: "All Parts" });
        this.partAllList.push({ part: "All Parts" });
        if (vehicle != null) {
          let keyArray = Object.keys(vehicle);
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            this.partList.push({ part: vehicle[index]["name"] });
            this.partAllList.push({ part: vehicle[index]["name"] });
          }
        }
      });
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  deleteEntry(entryNo: any, date: any) {
    let year = date.toString().split('-')[0];
    let monthName = this.commonService.getCurrentMonthName(Number(date.toString().split('-')[1]) - 1);
    this.db.object("Inventory/VehiclePartData/" + year + "/" + monthName + "/" + date + "/" + entryNo).update({
      "isDelete": 1
    });
    this.getMaintenanceList($('#ddlPart').val(), $('#date').val());
  }

  getMaintenanceList(part: any, date: any) {
    this.maintenanceList = [];
    this.totalAmount = 0;
    if (date == "") {
      let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
      let rowTo = days;
      if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
        rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
      }
      for (let j = 1; j <= rowTo; j++) {
        let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
        let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
        this.getMaintenance(part, monthName, monthDate);
      }
    }
    else {
      let monthName = this.commonService.getCurrentMonthName(parseInt(date.split('-')[1]) - 1);
      this.getMaintenance(part, monthName, date);
    }
  }

  getDateList() {
    this.getMaintenanceList($('#ddlPart').val(), $('#date').val());
  }

  getMaintenance(part: any, monthName: any, monthDate: any) {
    let dbPath = "Inventory/VehiclePartData/" + this.selectedYear + "/" + monthName + "/" + monthDate + "";
    let petrolInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        petrolInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length - 1; i++) {
              let index = keyArray[i];
              if (data[index]["isDelete"] == 0) {
                if (part == "All Parts" || part == "") {
                  let parts = data[index]["Detail"];
                  this.totalAmount = this.totalAmount + Number(data[index]["netAmount"]);
                  let billImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FVehiclePartBill%2F" + data[index]["date"] + "%2F" + data[index]["billImage"] + "?alt=media";
                  this.maintenanceList.push({ entryNo: index, date: data[index]["date"], billNo: data[index]["billNo"], netAmount: data[index]["netAmount"], userId: this.userId, createdBy: data[index]["userId"], billImageURL: billImageURL, remark: data[index]["remark"], details: parts });
                }
                else {
                  if (data[index]["Detail"] != null) {
                    let detailList = data[index]["Detail"];
                    let partAmount = 0;
                    if (detailList.length > 0) {
                      for (let j = 0; j < detailList.length; j++) {
                        if (detailList[j]["part"] == part) {
                          this.totalAmount = this.totalAmount + Number(detailList[j]["amount"]);
                          partAmount = Number(detailList[j]["amount"]);
                        }
                      }
                      if (partAmount != 0) {
                        let billImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FVehiclePartBill%2F" + data[index]["date"] + "%2F" + data[index]["billImage"] + "?alt=media";
                        this.maintenanceList.push({ entryNo: index, date: data[index]["date"], billNo: data[index]["billNo"], netAmount: partAmount, userId: this.userId, createdBy: data[index]["userId"], billImageURL: billImageURL, remark: data[index]["remark"], details: data[index]["Detail"] });
                      }
                    }
                  }
                }
              }
            }
            this.costData.totalAmount = Number(this.totalAmount).toFixed(2);
          }
        }
      });
  }


  resetAllFilter() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    $('#date').val("");
    $('#ddlPart').val("All Parts");
    this.getMaintenanceList("All Parts", "");
  }

  showRemark(id: any) {
    this.hideRemark();
    $('#remark' + id).show();
  }

  hideRemark() {
    if (this.maintenanceList.length > 0) {
      for (let i = 0; i < this.maintenanceList.length; i++) {
        $('#remark' + i).hide();
      }
    }
  }


  showDetail(id: any) {
    this.hideDetail();
    $('#detail' + id).show();
  }

  hideDetail() {
    if (this.maintenanceList.length > 0) {
      for (let i = 0; i < this.maintenanceList.length; i++) {
        $('#detail' + i).hide();
      }
    }
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.getMaintenanceList($('#ddlPart').val(), $('#date').val());
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getMaintenanceList($('#ddlPart').val(), $('#date').val());
  }

  getFilters() {
    this.partList = [];
    let flt = $('#ddlPart').val();
    if (flt != "") {
      if (this.partAllList.length > 0) {
        for (let i = 0; i < this.partAllList.length; i++) {
          if (this.partAllList[i]["part"].toString().toUpperCase().includes(flt.toString().toUpperCase())) {
            this.partList.push({ part: this.partAllList[i]["part"] });
          }
        }
      }
    }
    else {
      if (this.partAllList.length > 0) {
        for (let i = 0; i < this.partAllList.length; i++) {
          this.partList.push({ part: this.partAllList[i]["part"] });
        }
      }
    }
  }

  showList() {
    $('#partList').show();
  }

  hideList() {
    setTimeout(() => {
      $('#partList').hide();
    }, 500);

  }

  getValue(e) {
    $('#ddlPart').val(e.target.innerHTML);
    $('#partList').hide();
    this.getMaintenanceList(e.target.innerHTML, $('#date').val());
  }
  addNew() {
    this.router.navigate(['/' + this.cityName + '/maintenance-inventory-entry']);
  }
}

export class costDatail {
  totalAmount: string;
}
