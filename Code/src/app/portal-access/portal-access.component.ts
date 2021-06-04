import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-portal-access',
  templateUrl: './portal-access.component.html',
  styleUrls: ['./portal-access.component.scss']
})
export class PortalAccessComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    $('.navbar-toggler').hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
  }

  getCity(city:any)
  {
    localStorage.setItem('cityName', city);
    let path=city+"/login";
    window.location.href=path;
  }

}
