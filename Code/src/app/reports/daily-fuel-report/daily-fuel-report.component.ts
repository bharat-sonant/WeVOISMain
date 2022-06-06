import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-daily-fuel-report',
  templateUrl: './daily-fuel-report.component.html',
  styleUrls: ['./daily-fuel-report.component.scss']
})
export class DailyFuelReportComponent implements OnInit {

  constructor() { }
  vehicleList:any[]=[];

  ngOnInit() {
  }

}
