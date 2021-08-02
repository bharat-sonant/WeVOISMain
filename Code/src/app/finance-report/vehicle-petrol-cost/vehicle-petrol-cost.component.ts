import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { CommonService } from '../../services/common/common.service';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-vehicle-petrol-cost',
  templateUrl: './vehicle-petrol-cost.component.html',
  styleUrls: ['./vehicle-petrol-cost.component.scss']
})
export class VehiclePetrolCostComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  selectedMonth: any;
  public selectedYear: any;
  selectedCircle: any;
  vehicleList: any[] = [];
  petrolDataList: any[] = [];
  yearList: any[] = [];
  toDayDate: any;
  userList: any[] = [];
  db:any;

  costData: costDatail =
    {
      totalCost: "0",
      day1: "0.00",
      day2: "0.00",
      day3: "0.00",
      day4: "0.00",
      day5: "0.00",
      day6: "0.00",
      day7: "0.00",
      day8: "0.00",
      day9: "0.00",
      day10: "0.00",
      day11: "0.00",
      day12: "0.00",
      day13: "0.00",
      day14: "0.00",
      day15: "0.00",
      day16: "0.00",
      day17: "0.00",
      day18: "0.00",
      day19: "0.00",
      day20: "0.00",
      day21: "0.00",
      day22: "0.00",
      day23: "0.00",
      day24: "0.00",
      day25: "0.00",
      day26: "0.00",
      day27: "0.00",
      day28: "0.00",
      day29: "0.00",
      day30: "0.00",
      day31: "0.00"
    };

  ngOnInit() {
    this.db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.toDayDate = this.commonService.setTodayDate();
    this.getYear();
    this.selectedMonth = this.toDayDate.split('-')[1];
    this.selectedYear = this.toDayDate.split('-')[0];
    $('#ddlMonth').val(this.selectedMonth);
    $('#ddlYear').val(this.selectedYear);
    this.getVehicle();
    this.getUserData();
    setTimeout(() => {
      this.onSubmit();
    }, 2000);

  }

  getUserData() {
    let dbPath = "Users";
    let userInstance = this.db.list(dbPath).valueChanges().subscribe(
      userData => {
        userInstance.unsubscribe();
        if (userData.length > 0) {
          for (let i = 0; i < userData.length; i++) {
            this.userList.push({ userId: userData[i]["userId"], name: userData[i]["name"] });

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

  getVehicle() {
    let dbPath = "Vehicles";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      vehicle => {
        vehicleInstance.unsubscribe();
        if (vehicle != null) {
          let keyArrray = Object.keys(vehicle);
          if (keyArrray.length > 0) {
            this.vehicleList.push({ vehicle: "Drum/Can" });
            for (let i = 0; i < keyArrray.length; i++) {
              this.vehicleList.push({ vehicle: keyArrray[i] });
            }
          }
        }
      });
  }

  onSubmit() {

    this.clearAll();
    for (let i = 0; i < this.vehicleList.length; i++) {
      this.petrolDataList.push({ vehicleNo: this.vehicleList[i]["vehicle"], cost: 0 });
    }
    let days = new Date(parseInt(this.selectedYear), parseInt(this.selectedMonth), 0).getDate();
    let rowTo = days;
    if (this.selectedMonth == this.commonService.setTodayDate().split("-")[1]) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let j = 1; j <= rowTo; j++) {
      let monthDate = this.selectedYear + '-' + this.selectedMonth + '-' + (j < 10 ? '0' : '') + j;
      let monthName = this.commonService.getCurrentMonthName(parseInt(monthDate.split('-')[1]) - 1);
      for (let vehicleIndex = 0; vehicleIndex < this.vehicleList.length; vehicleIndex++) {
        let vehicleNo = this.vehicleList[vehicleIndex]["vehicle"];
        let dbPath = "Inventory/PetrolData/" + this.selectedYear + "/" + monthName + "/" + monthDate + "/" + vehicleNo;

        let petrolInstance = this.db.object(dbPath).valueChanges().subscribe(
          data => {
            petrolInstance.unsubscribe();
            if (data != null) {
              let keyArray = Object.keys(data);
              if (keyArray.length > 0) {
                for (let j = 0; j < keyArray.length - 1; j++) {
                  let index = keyArray[j];
                  if (data[index]["isDelete"] == 0) {
                    let d = "day" + parseFloat(monthDate.split("-")[2]);
                    let vehicleDetails = this.petrolDataList.find(item => item.vehicleNo == vehicleNo);
                    if (vehicleDetails != undefined) {
                      let leters = data[index]["liters"];
                      let amount = data[index]["amount"];
                      let userId = data[index]["userId"];
                      if (data[index]["slipImage"] != null) {
                        // let slipImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/Sikar%2FPetrolSlip%2F" + petrolList[k]["date"] + "%2F" + petrolList[k]["slipImage"] + "?alt=media";
                        let slipImageURL = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/"+this.commonService.getFireStoreCity()+"%2FPetrolSlip%2F" + monthDate.split('-')[0] + "%2F" + monthName + "%2F" + monthDate + "%2F" + index + "%2F" + data[index]["slipImage"] + "?alt=media";

                        vehicleDetails[d] = "<a class='single_2'  href='" + slipImageURL + "' title='" + index + " / " + leters + " ltr ₹" + amount + " on " + data[index]["date"] + "'><i class='far fa-eye' style='font-size: 18px; color: chocolate;'></i></a> " + leters + " liter at " + amount + "<br/>(---)";
                      }
                      else {
                        vehicleDetails[d] = leters + " liter at " + amount + "<br/>(---)";
                      }
                      vehicleDetails.cost = (parseFloat(vehicleDetails.cost) + parseFloat(amount)).toFixed(2);
                      this.costData.totalCost = (parseFloat(this.costData.totalCost) + parseFloat(amount)).toFixed(2);
                      this.getSum(d, amount);
                      if (this.userList.length > 0) {
                        let userDetails = this.userList.find(item => item.userId == userId);
                        if (userDetails != undefined) {
                          vehicleDetails[d] = vehicleDetails[d].toString().replace('---', userDetails.name);
                        }
                      }
                    }
                  }
                }
              }
            }
          });
      }
    }
  }

  changeMonthSelection(filterVal: any) {
    this.selectedMonth = filterVal;
    this.onSubmit();
  }

  changeYearSelection(filterVal: any) {
    this.selectedYear = filterVal;
    this.onSubmit();
  }

  clearAll() {
    this.costData.totalCost = "0.00";
    this.petrolDataList = [];
    this.costData.day1 = "0.00";
    this.costData.day2 = "0.00";
    this.costData.day3 = "0.00";
    this.costData.day4 = "0.00";
    this.costData.day5 = "0.00";
    this.costData.day6 = "0.00";
    this.costData.day7 = "0.00";
    this.costData.day8 = "0.00";
    this.costData.day9 = "0.00";
    this.costData.day10 = "0.00";
    this.costData.day11 = "0.00";
    this.costData.day12 = "0.00";
    this.costData.day13 = "0.00";
    this.costData.day14 = "0.00";
    this.costData.day15 = "0.00";
    this.costData.day16 = "0.00";
    this.costData.day17 = "0.00";
    this.costData.day18 = "0.00";
    this.costData.day19 = "0.00";
    this.costData.day20 = "0.00";
    this.costData.day21 = "0.00";
    this.costData.day22 = "0.00";
    this.costData.day23 = "0.00";
    this.costData.day24 = "0.00";
    this.costData.day25 = "0.00";
    this.costData.day26 = "0.00";
    this.costData.day27 = "0.00";
    this.costData.day28 = "0.00";
    this.costData.day29 = "0.00";
    this.costData.day30 = "0.00";
    this.costData.day31 = "0.00";
  }


  getSum(day: any, cost: any) {
    if (day == "day1") {
      this.costData.day1 = (parseFloat(this.costData.day1) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day2") {
      this.costData.day2 = (parseFloat(this.costData.day2) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day3") {
      this.costData.day3 = (parseFloat(this.costData.day3) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day4") {
      this.costData.day4 = (parseFloat(this.costData.day4) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day5") {
      this.costData.day5 = (parseFloat(this.costData.day5) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day6") {
      this.costData.day6 = (parseFloat(this.costData.day6) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day7") {
      this.costData.day7 = (parseFloat(this.costData.day7) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day8") {
      this.costData.day8 = (parseFloat(this.costData.day8) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day9") {
      this.costData.day9 = (parseFloat(this.costData.day9) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day10") {
      this.costData.day10 = (parseFloat(this.costData.day10) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day11") {
      this.costData.day11 = (parseFloat(this.costData.day11) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day12") {
      this.costData.day12 = (parseFloat(this.costData.day12) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day13") {
      this.costData.day13 = (parseFloat(this.costData.day13) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day14") {
      this.costData.day14 = (parseFloat(this.costData.day14) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day15") {
      this.costData.day15 = (parseFloat(this.costData.day15) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day16") {
      this.costData.day16 = (parseFloat(this.costData.day16) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day17") {
      this.costData.day17 = (parseFloat(this.costData.day17) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day18") {
      this.costData.day18 = (parseFloat(this.costData.day18) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day19") {
      this.costData.day19 = (parseFloat(this.costData.day19) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day20") {
      this.costData.day20 = (parseFloat(this.costData.day20) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day21") {
      this.costData.day21 = (parseFloat(this.costData.day21) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day22") {
      this.costData.day22 = (parseFloat(this.costData.day22) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day23") {
      this.costData.day23 = (parseFloat(this.costData.day23) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day24") {
      this.costData.day24 = (parseFloat(this.costData.day24) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day25") {
      this.costData.day25 = (parseFloat(this.costData.day25) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day26") {
      this.costData.day26 = (parseFloat(this.costData.day26) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day27") {
      this.costData.day27 = (parseFloat(this.costData.day27) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day28") {
      this.costData.day28 = (parseFloat(this.costData.day28) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day29") {
      this.costData.day29 = (parseFloat(this.costData.day29) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day30") {
      this.costData.day30 = (parseFloat(this.costData.day30) + parseFloat(cost)).toFixed(2);
    }
    if (day == "day31") {
      this.costData.day31 = (parseFloat(this.costData.day31) + parseFloat(cost)).toFixed(2);
    }

  }

}


export class costDatail {
  totalCost: string;
  day1: string;
  day2: string;
  day3: string;
  day4: string;
  day5: string;
  day6: string;
  day7: string;
  day8: string;
  day9: string;
  day10: string;
  day11: string;
  day12: string;
  day13: string;
  day14: string;
  day15: string;
  day16: string;
  day17: string;
  day18: string;
  day19: string;
  day20: string;
  day21: string;
  day22: string;
  day23: string;
  day24: string;
  day25: string;
  day26: string;
  day27: string;
  day28: string;
  day29: string;
  day30: string;
  day31: string;
}
