import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {

  constructor(private commonService: CommonService) { }

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
  }

}
