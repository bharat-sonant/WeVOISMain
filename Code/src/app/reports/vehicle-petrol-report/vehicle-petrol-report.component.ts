import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { MapService } from '../../services/map/map.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr

@Component({
  selector: 'app-vehicle-petrol-report',
  templateUrl: './vehicle-petrol-report.component.html',
  styleUrls: ['./vehicle-petrol-report.component.scss']
})
export class VehiclePetrolReportComponent implements OnInit {

  vehicleList: any[] = [];
  toDayDate: any;
  vehiclePetrolList: any[];
  shortOption: any;
  shortType: any;
  vehicleDataList: any[];
  totalLiters: any;
  totalAmount: any;
  vehicleAllPetrolList: any[];
  vehicleDetailList: any[];
  selectedVehicle: any;

  vehicleData: vehicleDetail =
    {
      vehicles: 0,
      totalLiters: 0,
      totalLiterFilter: 0,
      totalAmount: 0
    }

  public lineBigDashboardChartType;
  public gradientStroke;
  public chartColor;
  public canvas: any;
  public ctx;
  public gradientFill;
  public lineBigDashboardChartData: Array<any>;
  public lineBigDashboardChartOptions: any;
  public lineBigDashboardChartLabels: Array<any>;
  public lineBigDashboardChartColors: Array<any>

  constructor(public db: AngularFireDatabase, private modalService: NgbModal, public toastr: ToastrService, private mapService: MapService, public httpService: HttpClient, private commonService: CommonService) { }

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.toDayDate = this.commonService.setTodayDate();
    this.getVehicle();
    $('#divLoader').show();
    setTimeout(() => {
      this.getAverageData();
    }, 1000);
  }

  getVehicle() {
    let vehicleStorageList = JSON.parse(localStorage.getItem("vehicle"));
    if (vehicleStorageList == null) {
      let dbPath = "Vehicles";
      let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
        vehicle => {
          vehicleInstance.unsubscribe();
          if (vehicle != null) {
            let keyArrray = Object.keys(vehicle);
            if (keyArrray.length > 0) {
              for (let i = 0; i < keyArrray.length; i++) {
                if (keyArrray[i] != "NotApplicable") {
                  this.vehicleList.push({ vehicle: keyArrray[i] });
                }
              }
            }
          }
        });
    }
    else {
      if (vehicleStorageList.length > 0) {
        for (let i = 3; i < vehicleStorageList.length; i++) {
          this.vehicleList.push({ vehicle: vehicleStorageList[i]["vehicle"] });
        }
      }
    }
  }

  getAverageData() {
    this.vehiclePetrolList = [];
    this.vehicleDataList = [];
    this.vehicleAllPetrolList = [];
    this.totalLiters = 0;
    this.totalAmount = 0;
    if (this.vehicleList.length > 0) {
      for (let i = 0; i < this.vehicleList.length; i++) {
        let days = this.commonService.getDaysBetweenDates("2021-01-01", this.toDayDate);
        for (let j = 0; j < days; j++) {
          let monthDate = this.commonService.getPreviousDate(this.toDayDate, j);
          let year = monthDate.split('-')[0];
          let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.toString().split('-')[1]) - 1);
          let dbPath = "Inventory/PetrolData/" + year + "/" + monthName + "/" + monthDate + "/" + this.vehicleList[i]["vehicle"] + "";
          let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
            data => {
              vehicleInstance.unsubscribe();
              if (data != null) {
                let keyArray = Object.keys(data);
                if (keyArray.length > 0) {
                  for (let k = 0; k < keyArray.length - 1; k++) {
                    let index = keyArray[k];
                    if (data[index]["isDelete"] == 0) {
                      this.vehicleDataList.push({ vehicle: this.vehicleList[i]["vehicle"], km: data[index]["vehicleMeterReading"], petrol: data[index]["liters"], average: 0, petrolConsumption: 0, amount: data[index]["amount"], price: data[index]["price"], date: monthDate });
                    }
                  }
                }
              }
            });
        }
      }
      setTimeout(() => {
        if (this.vehicleDataList.length > 0) {
          this.vehiclePetrolList = [];
          let vehicles = [];
          this.vehicleDataList = this.commonService.transform(this.vehicleDataList, 'km');
          for (let i = 0; i < this.vehicleList.length; i++) {
            let vehicleDetails = this.vehicleDataList.find(item => item.vehicle == this.vehicleList[i]["vehicle"]);
            if (vehicleDetails != undefined) {
              let totalPetrol = 0;
              let totalAmount = 0;
              let petrol = 0;
              let firstKm = 0;
              let lastKm = 0;
              let totalKm = 0;
              let average = 0;
              let dataList = [];
              for (let j = 0; j < this.vehicleDataList.length; j++) {
                if (this.vehicleList[i]["vehicle"] == this.vehicleDataList[j]["vehicle"]) {
                  dataList.push({ km: this.vehicleDataList[j]["km"], petrol: this.vehicleDataList[j]["petrol"], amount: this.vehicleDataList[j]["amount"] });
                }
              }
              for (let j = 0; j < dataList.length; j++) {
                totalAmount = totalAmount + Number(Number(dataList[j]["amount"]).toFixed(2));
                totalPetrol = totalPetrol + Number(Number(dataList[j]["petrol"]).toFixed(2));
                if (j != dataList.length - 1) {
                  petrol = petrol + Number(dataList[j]["petrol"]);
                }
                if (firstKm == 0) {
                  if (dataList[j]["km"] > 0) {
                    firstKm = Number(dataList[j]["km"]);
                  }
                }
                if (j == dataList.length - 1) {
                  lastKm = Number(dataList[j]["km"]);
                }
              }
              totalKm = lastKm - firstKm;
              if (totalKm != 0) {
                average = Number((totalKm / petrol).toFixed(2));
              }
              this.totalLiters = this.totalLiters + totalPetrol;
              this.totalAmount = this.totalAmount + totalAmount;
              vehicles.push({ vehicle: this.vehicleList[i]["vehicle"], km: totalKm, petrol: totalPetrol, average: average, petrolConsumption: Number(totalPetrol.toFixed(2)), amount: Number(totalAmount.toFixed(2)) });
            }
            else {
              vehicles.push({ vehicle: this.vehicleList[i]["vehicle"], km: 0, petrol: 0, average: 0, petrolConsumption: 0, amount: 0 });
            }
          }
          this.shortOption = "petrolConsumption";
          this.shortType = "desc";
          // this.vehicleDataList = [];
          // this.vehicleDataList = vehicles;
          this.vehiclePetrolList = this.commonService.transform(vehicles, '-petrolConsumption');
          this.vehicleAllPetrolList = this.vehiclePetrolList;
          this.vehicleData.totalLiters = this.totalLiters.toFixed(2);
          this.vehicleData.totalAmount = this.totalAmount.toFixed(2);
        }

        $('#divLoader').hide();
        setTimeout(() => {
          this.getVehicleDetail(this.vehiclePetrolList[0]["vehicle"],0);
        }, 1000);
      }, 12000);
    }
  }

  getVehicleDetail(vehicle: any, index: any) {
    this.selectedVehicle = vehicle;
    for (let i = 0; i < this.vehiclePetrolList.length; i++) {
      let className = $('#tr' + i).attr('class');
      $('#tr' + i).removeClass(className);
      if (i == index) {
        $('#tr' + i).addClass("active-vehicle");
      }
      else {
        $('#tr' + i).addClass("in-active-vehicle");
      }
    }
    $('#divDetail').show();
    this.vehicleDetailList = [];
    if (this.vehicleDataList.length > 0) {
      for (let i = 0; i < this.vehicleDataList.length; i++) {
        if (this.vehicleDataList[i]["vehicle"] == vehicle) {
          this.vehicleDetailList.push({ date: this.vehicleDataList[i]["date"], liters: this.vehicleDataList[i]["petrol"], km: this.vehicleDataList[i]["km"] });
        }
      }
      this.vehicleDetailList = this.vehicleDetailList.sort((a, b) => (b.date < a.date) ? 1 : -1);
    }
    if(this.vehicleDetailList.length==0)
    {
      $('#divMessage').show();
    }
    else
    {      
      $('#divMessage').hide();
    }
  }

  getValue(vehicle: any, index: any) {
    this.totalAmount = 0;
    this.totalLiters = 0;
    if (this.vehiclePetrolList.length > 0) {
      for (let i = 0; i <= 5; i++) {
        let className = $('#div' + i).attr('class');
        let iconClassName = $('#icon' + i).attr('class');
        $('#div' + i).removeClass(className);
        $('#icon' + i).removeClass(iconClassName);
        if (i == index) {
          $('#div' + i).addClass("list-active");
          $('#icon' + i).addClass("fas fa-caret-right icon-active");
        }
        else {
          $('#div' + i).addClass("list-inactive");
          $('#icon' + i).addClass("fas fa-caret-right icon-inactive");
        }
      }

      this.vehiclePetrolList = [];
      this.shortOption = "petrolConsumption";
      this.shortType = "desc";
      if (this.vehicleAllPetrolList.length > 0) {
        if (vehicle == "ALL") {
          this.vehiclePetrolList = this.vehicleAllPetrolList;
          for (let i = 0; i < this.vehicleAllPetrolList.length; i++) {
            this.totalLiters = this.totalLiters + Number(this.vehicleAllPetrolList[i]["petrolConsumption"]);
            this.totalAmount = this.totalAmount + Number(this.vehicleAllPetrolList[i]["amount"]);
          }
        }
        else {
          for (let i = 0; i < this.vehicleAllPetrolList.length; i++) {
            if (this.vehicleAllPetrolList[i]["vehicle"].toString().includes(vehicle)) {
              this.vehiclePetrolList.push({ vehicle: this.vehicleAllPetrolList[i]["vehicle"], km: this.vehicleAllPetrolList[i]["km"], petrol: this.vehicleAllPetrolList[i]["petrol"], average: this.vehicleAllPetrolList[i]["average"], petrolConsumption: Number(this.vehicleAllPetrolList[i]["petrolConsumption"].toFixed(2)) });
              this.totalLiters = this.totalLiters + Number(this.vehicleAllPetrolList[i]["petrolConsumption"]);
              this.totalAmount = this.totalAmount + Number(this.vehicleAllPetrolList[i]["amount"]);
            }
          }
        }
        this.vehicleData.totalLiters = this.totalLiters.toFixed(2);
        this.vehicleData.totalAmount = this.totalAmount.toFixed(2);
        setTimeout(() => {
          for (let i = 0; i < this.vehiclePetrolList.length; i++) {
            let classTrName = $('#tr' + i).attr('class');
            $('#tr' + i).removeClass(classTrName);
            if (this.vehiclePetrolList[i]["vehicle"] == this.selectedVehicle) {
              $('#tr' + i).addClass("active-vehicle");
            }
            else {
              $('#tr' + i).addClass("in-active-vehicle");
            }
          }
        }, 600);
        
      }
    }
  }

  getShortData(shortOption: any) {
    this.shortOption = shortOption;
    if (this.shortType == "desc") {
      this.shortType = "ace";
      if (this.shortOption != "vehicle") {
        this.vehiclePetrolList = this.commonService.transform(this.vehiclePetrolList, this.shortOption);
      }
      else {
        this.vehiclePetrolList = this.vehiclePetrolList.sort((a, b) => (a.vehicle > b.vehicle) ? 1 : -1);
      }
    }
    else {
      this.shortType = "desc";
      if (this.shortOption != "vehicle") {
        this.shortOption = "-" + shortOption;
        this.vehiclePetrolList = this.commonService.transform(this.vehiclePetrolList, this.shortOption);
      }
      else {
        this.vehiclePetrolList = this.vehiclePetrolList.sort((a, b) => (b.vehicle > a.vehicle) ? 1 : -1);
      }
    }
  }
}



export class vehicleDetail {
  vehicles: number;
  totalLiters: number;
  totalLiterFilter: any;
  totalAmount: number;
}
