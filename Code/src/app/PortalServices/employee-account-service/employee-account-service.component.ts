import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-employee-account-service',
  templateUrl: './employee-account-service.component.html',
  styleUrls: ['./employee-account-service.component.scss']
})
export class EmployeeAccountServiceComponent implements OnInit {

  constructor(private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  accountList: any[];

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);

  }

  saveData() {
    $('#divLoader').show();
    this.accountList = [];
    let dbPath = "Employees";
    let employeeInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        employeeInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let empId = keyArray[i];
              if (data[empId]["GeneralDetails"] != null) {
                if (data[empId]["GeneralDetails"]["status"] == "1") {
                  let name = data[empId]["GeneralDetails"]["name"];
                  let doj = data[empId]["GeneralDetails"]["dateOfJoining"];
                  let empCode=data[empId]["GeneralDetails"]["empCode"];
                  let accountNo = "";
                  let ifsc = "";
                  let aadharNo = "";
                  let panNo = "";
                  if (data[empId]["BankDetails"] != null) {
                    if (data[empId]["BankDetails"]["AccountDetails"] != null) {
                      if (data[empId]["BankDetails"]["AccountDetails"]["accountNumber"] != null) {
                        accountNo = data[empId]["BankDetails"]["AccountDetails"]["accountNumber"];
                      }
                      if (data[empId]["BankDetails"]["AccountDetails"]["ifsc"] != null) {
                        ifsc = data[empId]["BankDetails"]["AccountDetails"]["ifsc"];
                      }
                    }
                  }
                  if (data[empId]["IdentificationDetails"] != null) {
                    if (data[empId]["IdentificationDetails"]["AadharCardDetails"] != null) {
                      if (data[empId]["IdentificationDetails"]["AadharCardDetails"]["aadharNumber"] != null) {
                        aadharNo = data[empId]["IdentificationDetails"]["AadharCardDetails"]["aadharNumber"];
                      }
                      if (data[empId]["IdentificationDetails"]["PanCardDetails"]["panNumber"] != null) {
                        panNo = data[empId]["IdentificationDetails"]["PanCardDetails"]["panNumber"];
                      }
                    }
                  }
                  this.accountList.push({ empId: empId,empCode:empCode, name: name, doj: doj, accountNo: accountNo, ifsc: ifsc, aadharNo: aadharNo, panNo: panNo })
                }
              }
            }
            this.saveJsonFile(this.accountList);
          }
        }
      }
    );
  }

  
  saveJsonFile(listArray: any) {
    var jsonFile = JSON.stringify(listArray);
    var uri = "data:application/json;charset=UTF-8," + encodeURIComponent(jsonFile);
    const path = "" + this.commonService.getFireStoreCity() + "/EmployeeAccount/accountDetail.json";

    //const ref = this.storage.ref(path);
    const ref = this.storage.storage.app.storage("https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/").ref(path);
    var byteString;
    // write the bytes of the string to a typed array

    byteString = unescape(uri.split(",")[1]);
    var mimeString = uri
      .split(",")[0]
      .split(":")[1]
      .split(";")[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    let blob = new Blob([ia], { type: mimeString });
    const task = ref.put(blob);
    this.commonService.setAlertMessage("success", "JSON converted successfully !!!");
    $('#divLoader').hide();
  }

}
