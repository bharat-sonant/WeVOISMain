import { Component, OnInit } from '@angular/core';
import { attachEmbeddedView } from '@angular/core/src/view';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-petrol-inventory-list',
  templateUrl: './petrol-inventory-list.component.html',
  styleUrls: ['./petrol-inventory-list.component.scss']
})
export class PetrolInventoryListComponent implements OnInit {

  constructor(private router: Router, public db: AngularFireDatabase, private commonService: CommonService) { }

  toDayDate: any;
  selectedMonth: any;
  public selectedYear: any;
  yearList: any[] = [];
  petrolList: any[] = [];
  userId: any;
  vehicleList: any[] = [];
  vehicleAllList: any[] = [];
  totalLiters: any = 0;
  totalAmount: any = 0;
  cityName:any;
  costData: costDatail =
    {
      totalLiters: "0.000",
      totalAmount: "0.00"
    }

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.cityName = localStorage.getItem('cityName');
    this.userId = localStorage.getItem('userID');
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    $('#txtDate').val(this.toDayDate);
    this.getVehicle();
    $('#ddlVehicle').val("All Vehicle");
    this.getPetrolList("All Vehicle");
    //this.setNewDataStructure();
  }


  setNewDataStructure() {
    let currentYear = "2021";
    let currentMonth = "03";
    let currentMonthName = "March";
    let days = new Date(parseInt(currentYear), parseInt(currentMonth), 0).getDate();
    let rowTo = days;
    //  rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    for (let j = 1; j <= days; j++) {
      let monthDate = currentYear + '-' + currentMonth + '-' + (j < 10 ? '0' : '') + j;
      let dbPath = "Inventory/PetrolData/" + currentYear + "/" + currentMonthName + "/" + monthDate + "";
      let petrolInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          petrolInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let k = 0; k < keyArray.length - 1; k++) {
                let keyIndex = 1;
                let index = keyArray[k];
                let vehicleNo = data[index]["vehicleNo"];
                let userId = data[index]["userId"];
                let slipImage = data[index]["slipImage"];
                let remark = null;
                if (data[index]["remark"] != null) {
                  remark = data[index]["remark"];
                }
                let price = data[index]["price"];
                let liters = data[index]["liters"];
                let vehicleMeterReading = 0;
                if (data[index]["km"] != null) {
                  vehicleMeterReading = data[index]["km"];
                }
                let isDelete = data[index]["isDelete"];
                let date = data[index]["date"];
                let amount = data[index]["amount"];
                let address = null;
                if (data[index]["address"] != null) {
                  address = data[index]["address"];
                }
                let creationDate = data[index]["creationDate"];
                let dbPath = "Inventory/PetrolData/" + currentYear + "/" + currentMonthName + "/" + monthDate + "/" + vehicleNo + "/lastEntry";
                let lastEntryInstance = this.db.object(dbPath).valueChanges().subscribe(
                  lastData => {
                    lastEntryInstance.unsubscribe();
                    if (lastData != null) {
                      keyIndex = Number(lastData) + 1;
                    }
                    this.db.object("Inventory/PetrolData/" + currentYear + "/" + currentMonthName + "/" + monthDate + "/" + vehicleNo + "/" + keyIndex).update({
                      "userId": userId,
                      "slipImage": slipImage,
                      "remark": remark,
                      "price": price,
                      "liters": liters,
                      "vehicleMeterReading": vehicleMeterReading,
                      "isDelete": isDelete,
                      "amount": amount,
                      "address": address,
                      "creationDate": creationDate
                    });

                    this.db.object("Inventory/PetrolData/" + currentYear + "/" + currentMonthName + "/" + monthDate + "/" + vehicleNo).update({
                      "lastEntry": keyIndex
                    });

                  });
              }
            }
          }
        });
    }

  }

  resetAllFilter() {
    this.toDayDate = this.commonService.setTodayDate();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    $('#txtDate').val("");
    $('#ddlVehicle').val("All Vehicle");
    this.getPetrolList("All Vehicle");
  }

  getYear() {
    this.yearList = [];
    let year = parseInt(this.toDayDate.split('-')[0]);
    for (let i = year - 2; i <= year; i++) {
      this.yearList.push({ year: i });
    }
  }

  deleteEntry(entryNo: any, date: any, vehicleNo: any) {
    let year = date.toString().split('-')[0];
    let month = date.toString().split('-')[1];
    let monthName = this.commonService.getCurrentMonthName(Number(date.toString().split('-')[1]) - 1);
    this.db.object("Inventory/PetrolData/" + year + "/" + monthName + "/" + date + "/" + vehicleNo + "/" + entryNo).update({
      "isDelete": 1
    });
    this.setVehicleAverage(vehicleNo, year, monthName, month);
    this.getPetrolList("All Vehicle");
    $('#ddlVehicle').val("All Vehicle");
  }

  averageList: any[] = [];


  setVehicleAverage(vehicleNo: any, year: any, monthName: any, month: any) {
    this.averageList = [];
    let days = new Date(parseInt(year), parseInt(month), 0).getDate();
    let rowTo = days;
    rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    for (let j = 1; j <= rowTo; j++) {
      let monthDate = year + '-' + month + '-' + (j < 10 ? '0' : '') + j;
      let dbPath = "Inventory/PetrolData/" + year + "/" + monthName + "/" + monthDate + "/" + vehicleNo + "";
      let petrolInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          petrolInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length - 1; i++) {
                let index = keyArray[i];
                if (data[index]["isDelete"] == 0) {
                  this.averageList.push({ km: data[index]["vehicleMeterReading"], petrol: data[index]["liters"],date:monthDate });
                }
              }
            }
          }
        });
    }

    setTimeout(() => {
      if (this.averageList.length > 0) {
        this.averageList = this.commonService.transform(this.averageList, "km");
        let Km = 0;
        let preKm = 0;
        let currentKm = Number(this.averageList[this.averageList.length - 1]["km"]);
        for (let preIndex = 0; preIndex < this.averageList.length; preIndex++) {
          if (Number(this.averageList[preIndex]["km"]) != 0 && Number(this.averageList[preIndex]["km"]) != -1) {
            preKm = Number(this.averageList[preIndex]["km"]);
            Km = currentKm - preKm;
            preIndex = this.averageList.length;
          }
        }
        let petrol = 0;
        let totalKm = 0;
        let totalPetrol = 0;
        for (let i = 0; i < this.averageList.length; i++) {
          if (i < this.averageList.length - 1) {
            petrol = petrol + Number(this.averageList[i]["petrol"]);
          }
          totalPetrol = totalPetrol + Number(this.averageList[i]["petrol"]);
          totalKm = Number(this.averageList[i]["km"]);
        }
        let avgrage = 0;
        if (preKm != 0) {
          if (petrol != 0) {
            avgrage = Number((Km / petrol).toFixed(2))
          }
        }
                
        this.db.object("Inventory/PetrolData/" + year + "/" + monthName + "/Vehicles/" + vehicleNo).update({
          "average": avgrage,
          "km": Km,
          "petrol": petrol,
          "totalKm": totalKm,
          "totalPetrol": totalPetrol
        });
      }
    }, 2000);
  }

  getVehicle() {
    let vehicleStorageList = JSON.parse(localStorage.getItem("vehicle"));
    if (vehicleStorageList == null) {
      let dbPath = "Vehicles";
      let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
        vehicle => {
          vehicleInstance.unsubscribe();
          if (vehicle != null) {
            this.vehicleList.push({ vehicle: "Select Vehicle" });
            this.vehicleList.push({ vehicle: "Drum/Can" });
            this.vehicleList.push({ vehicle: "Motor Cycle" });
            this.vehicleList.push({ vehicle: "Select Vehicle" });
            this.vehicleList.push({ vehicle: "Drum/Can" });
            this.vehicleList.push({ vehicle: "Motor Cycle" });
            let keyArrray = Object.keys(vehicle);
            if (keyArrray.length > 0) {
              for (let i = 0; i < keyArrray.length; i++) {
                if (i == 0) {
                  this.vehicleList.push({ vehicle: "All Vehicle" });
                  this.vehicleAllList.push({ vehicle: "All Vehicle" });
                }
                else {
                  this.vehicleList.push({ vehicle: keyArrray[i] });
                  this.vehicleAllList.push({ vehicle: keyArrray[i] });
                }
              }
            }
          }
        });
    }
    else {
      this.vehicleList = vehicleStorageList;
      this.vehicleList[0]["vehicle"] = "All Vehicle";
      this.vehicleAllList = vehicleStorageList;
      this.vehicleAllList[0]["vehicle"] = "All Vehicle";
    }
  }

  getDateList() {
    this.getPetrolList($('#ddlVehicle').val());
  }

  getPetrolList(vehicle: any) {
    this.petrolList = [];
    this.totalAmount = 0;
    this.totalLiters = 0;
    this.costData.totalAmount = Number(0).toFixed(2);
    this.costData.totalLiters = Number(0).toFixed(3);
    if ($('#txtDate').val() != "") {
      let monthDate = $('#txtDate').val();
      let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.toString().split('-')[1]) - 1);
      this.getPetrolListData(vehicle, monthDate, monthName);
    }
    else {
      let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
      let rowTo = days;
      if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
        rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
      }
      for (let j = 1; j <= rowTo; j++) {
        let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
        let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
        this.getPetrolListData(vehicle, monthDate, monthName);
      }
    }
  }

  getPetrolListData(vehicle: any, monthDate: any, monthName: any) {
    if (vehicle == "All Vehicle") {
      for (let i = 0; i < this.vehicleAllList.length; i++) {
        let dbPath = "Inventory/PetrolData/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/" + this.vehicleAllList[i]["vehicle"];
        let petrolInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            petrolInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let j = 0; j < keyArray.length - 1; j++) {
                  let index = keyArray[j];
                  if (data[index]["isDelete"] == 0) {
                    let km = "0 KM";
                    if (data[index]["vehicleMeterReading"] != null) {
                      km = data[index]["vehicleMeterReading"];
                    }
                    this.totalLiters = this.totalLiters + Number(data[index]["liters"]);
                    this.totalAmount = this.totalAmount + Number(data[index]["amount"]);
                    let slipImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/"+this.commonService.getFireStoreCity()+"%2FPetrolSlip%2F" + monthDate.split('-')[0] + "%2F" + monthName + "%2F" + monthDate + "%2F" + this.vehicleAllList[i]["vehicle"] + "%2F" + data[index]["slipImage"] + "?alt=media";
                    if(new Date(monthDate)<=new Date("2021-03-16"))
                    { 
                      slipImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/"+this.commonService.getFireStoreCity()+"%2FPetrolSlip%2F" + monthDate + "%2F" + data[index]["slipImage"] + "?alt=media";
                    }
                    this.petrolList.push({ entryNo: index, km: km, date: monthDate, vehicleNo: this.vehicleAllList[i]["vehicle"], liters: data[index]["liters"], price: Number(data[index]["price"]).toFixed(2), amount: data[index]["amount"], userId: this.userId, createdBy: data[index]["userId"], slipImageURL: slipImageURL, remark: data[index]["remark"] });
                  }
                }
              }
            }
            this.costData.totalAmount = Number(this.totalAmount).toFixed(2);
            this.costData.totalLiters = Number(this.totalLiters).toFixed(3);
          });
      }
    }
    else {
      let dbPath = "Inventory/PetrolData/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/" + vehicle;
      let petrolInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          petrolInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length - 1; i++) {
                let index = keyArray[i];
                if (data[index]["isDelete"] == 0) {
                  let km = "0 KM";
                  if (data[index]["vehicleMeterReading"] != null) {
                    km = data[index]["vehicleMeterReading"];
                  }
                  this.totalLiters = this.totalLiters + Number(data[index]["liters"]);
                  this.totalAmount = this.totalAmount + Number(data[index]["amount"]);
                  let slipImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/"+this.commonService.getFireStoreCity()+"%2FPetrolSlip%2F" + monthDate.split('-')[0] + "%2F" + monthName + "%2F" + monthDate + "%2F" + vehicle + "%2F" + data[index]["slipImage"] + "?alt=media";
                   if(new Date(monthDate)<=new Date("2021-03-16"))
                  { 
                    slipImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/"+this.commonService.getFireStoreCity()+"%2FPetrolSlip%2F" + monthDate + "%2F" + data[index]["slipImage"] + "?alt=media";
                  }
                  this.petrolList.push({ entryNo: index, km: km, date: monthDate, vehicleNo: vehicle, liters: data[index]["liters"], price: Number(data[index]["price"]).toFixed(2), amount: data[index]["amount"], userId: this.userId, createdBy: data[index]["userId"], slipImageURL: slipImageURL, remark: data[index]["remark"] });
                }
              }
            }
          }
          this.costData.totalAmount = Number(this.totalAmount).toFixed(2);
          this.costData.totalLiters = Number(this.totalLiters).toFixed(3);
        });
    }
    setTimeout(() => {
      if(this.petrolList.length>0)
      {
        $('#divMessage').hide();
      }
      else
      {
        $('#divMessage').show();
      }
    }, 1000);
  }

  showRemark(id: any) {
    this.hideRemark();
    $('#remark' + id).show();
  }

  hideRemark() {
    if (this.petrolList.length > 0) {
      for (let i = 0; i < this.petrolList.length; i++) {
        $('#remark' + i).hide();
      }
    }
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.getPetrolList($('#ddlVehicle').val());
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.getPetrolList($('#ddlVehicle').val());
  }

  getFilters() {
    this.vehicleList = [];
    let flt = $('#ddlVehicle').val();
    if (flt != "") {
      if (this.vehicleAllList.length > 0) {
        for (let i = 0; i < this.vehicleAllList.length; i++) {
          if (this.vehicleAllList[i]["vehicle"].toString().includes(flt.toString().toUpperCase())) {
            this.vehicleList.push({ vehicle: this.vehicleAllList[i]["vehicle"] });
          }
        }
      }
    }
    else {
      if (this.vehicleAllList.length > 0) {
        for (let i = 0; i < this.vehicleAllList.length; i++) {
          this.vehicleList.push({ vehicle: this.vehicleAllList[i]["vehicle"] });
        }
      }
    }
  }

  showList() {
    $('#vehicleList').show();
  }

  hideList() {
    setTimeout(() => {
      $('#vehicleList').hide();
    }, 500);

  }

  getValue(e) {
    $('#ddlVehicle').val(e.target.innerHTML);
    $('#vehicleList').hide();
    this.getPetrolList(e.target.innerHTML);
  }
  addNew() {
    this.router.navigate(['/' + this.cityName + '/petrol-inventory-entry']);
  }
}

export class costDatail {
  totalLiters: string;
  totalAmount: string;
}
