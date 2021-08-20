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
  selector: 'app-ward-halt-report',
  templateUrl: './ward-halt-report.component.html',
  styleUrls: ['./ward-halt-report.component.scss']
})
export class WardHaltReportComponent implements OnInit{

  constructor(public fs: FirebaseService, private commonService: CommonService, private modalService: NgbModal) { }

  

  ngOnInit() {
   
  }

}
