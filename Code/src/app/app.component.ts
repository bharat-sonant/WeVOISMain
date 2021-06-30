import { Component, ɵSWITCH_CHANGE_DETECTOR_REF_FACTORY__POST_R3__ } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Router } from '@angular/router';
//services

import { CommonService } from './services/common/common.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {

  

  
  constructor(private router: Router, public db: AngularFireDatabase, public commonService: CommonService, private toastr: ToastrService) {
    
    let userKey = localStorage.getItem("userKey");
    if (userKey != null) {

      let User = this.db.object('Users/' + userKey + '/expiryDate').valueChanges().subscribe(
        data => {
          User.unsubscribe();
          if (data != null) {
            if (new Date(this.commonService.setTodayDate()) >= new Date(data.toString())) {
              this.router.navigate(['/index']);
              localStorage.setItem('loginStatus', "Fail");
              this.toastr.error("Account Not Activate !!!", '', {
                timeOut: 60000,
                enableHtml: true,
                closeButton: true,
                toastClass: "alert alert-danger alert-with-icon",
                positionClass: 'toast-bottom-right'
              });
            }
          }
        });
    }

  }
}
