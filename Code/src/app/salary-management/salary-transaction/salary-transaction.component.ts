import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';
import { HttpClient } from "@angular/common/http";
import { AngularFireStorage } from "angularfire2/storage";
import * as XLSX from 'xlsx';
import { AngularFirestore } from "@angular/fire/firestore";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-salary-transaction',
  templateUrl: './salary-transaction.component.html',
  styleUrls: ['./salary-transaction.component.scss']
})
export class SalaryTransactionComponent implements OnInit {

  constructor(public dbFireStore: AngularFirestore, private modalService: NgbModal, private storage: AngularFireStorage, public fs: FirebaseService, private commonService: CommonService, public httpService: HttpClient) { }
  db: any;
  cityName: any;
  fireStoreCity: any;
  toDayDate: any;
  selectedYear: any;
  yearList: any[];
  employeeList: any[];
  allEmployeeList: any[];
  public transactionList: any[];
  arrayBuffer: any;
  first_sheet_name: any;
  salaryDetail: salaryDetail = {
    totalSalary: "0.00"
  }

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    console.log(this.cityName);
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }


  setDefault() {
    this.fireStoreCity = this.commonService.getFireStoreCity();
    if (this.fireStoreCity == "Test") {
      this.fireStoreCity = "Testing";
    }
    this.toDayDate = this.commonService.setTodayDate();
    let date = this.commonService.getPreviousMonth(this.toDayDate, 1);
    this.yearList = [];
    this.employeeList = [];
    this.transactionList = [];
    this.getYear();
    this.getEmployee();
    this.selectedYear = date.split('-')[0];
    $('#ddlYear').val(this.selectedYear);
  }

  getSalaryTranscation() {
    this.transactionList = [];
    let year = $("#ddlYear").val();
    let empId = $("#ddlEmployee").val();
    if (year == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if (empId != "0") {
      let empCode = "";
      let detail = this.employeeList.find(item => item.empId = empId);
      if (detail != undefined) {
        empCode = detail.empCpde;
      }
      const list = [];
      const commonService = this.commonService;
      let filterRef = this.dbFireStore
        .doc(this.fireStoreCity + "/SalaryTransaction/")
        .collection(empId.toString(), (ref) => {
          let query:
            | firebase.firestore.CollectionReference
            | firebase.firestore.Query = ref;
         // query = query.where("year", "==", year);
          return query;
        });

      filterRef.get().subscribe((ss) => {
        ss.forEach(function (doc) {
          let userData = commonService.getPortalUserDetailById(doc.data()["uploadBy"]);
          if (userData != undefined) {
            list.push({ name: doc.data()["name"], accountNo: doc.data()["accountNo"], amount: doc.data()["amount"], debitAccountNo: doc.data()["debitAccountNo"], ifsc: doc.data()["ifsc"], transactionType: doc.data()["transactionType"], transationDate: doc.data()["transationDate"], uploadDate: doc.data()["uploadDate"], uploadBy: userData["name"] });
          }
        });
        this.transactionList = list;
      });

    }

  }



  getEmployee() {
    const path = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/" + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let employeeInstance = this.httpService.get(path).subscribe(data => {
      employeeInstance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        let list = JSON.parse(jsonData);
        this.allEmployeeList = this.commonService.transformNumeric(list, "name");
        let activeList = this.allEmployeeList.filter(item => item.status == "1");
        if (activeList.length > 0) {
          this.employeeList = activeList;
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

  filterData() {
    let type = $("#ddlType").val();
    if (type == "all") {
      this.employeeList = this.allEmployeeList;
    }
    else if (type == "active") {
      let list = this.allEmployeeList.filter(item => item.status == "1");
      if (list.length > 0) {
        this.employeeList = list;
      }
    }
    else if (type == "inactive") {
      let list = this.allEmployeeList.filter(item => item.status != "1");
      if (list.length > 0) {
        this.employeeList = list;
      }
    }
  }

  uploadSalary(event) {
    let element = <HTMLInputElement>document.getElementById("fileUpload");
    if (element.files[0] == null) {
      this.commonService.setAlertMessage("error", "Please select excel !!!");
      $('#fileUpload').val("");
      return;
    }
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      $('#fileUpload').val("");
      return;
    }
    let file = element.files[0];
    let fileName = file.name;
    let fileExt = fileName.split('.');
    if (fileExt[fileExt.length - 1] != "xlsx" && fileExt[fileExt.length - 1] != "xls") {
      this.commonService.setAlertMessage("error", "Please upload only excel file !!!");
      $('#fileUpload').val("");
      return;
    }

    // upload on storage

    const excelFile = element.files[0];

    this.dbFireStore.doc(this.fireStoreCity + "/SalaryTransaction").get().subscribe((ss) => {
      let key = 1;
      if (ss.data() != null) {
        if (ss.data()["lastKey"] != undefined) {
          key += Number(ss.data()["lastKey"]);
        }
      }
      let filename = key + ".xlsx";
      const data = {
        uploadBy: localStorage.getItem("userID"),
        uploadDate: this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond(),
        filename: filename
      }

      this.dbFireStore.doc(this.fireStoreCity + "/SalaryTransaction").set({ lastKey: key });
      this.dbFireStore.doc(this.fireStoreCity + "/SalaryTransaction/UploadHistory/" + key.toString()).set(data);


      const path = "" + this.commonService.getFireStoreCity() + "/SalaryTransactionFiles/" + filename;

      this.storage.upload(path, excelFile);
    });
    
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      this.first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[this.first_sheet_name];
      let fileList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      this.saveData(fileList);
    }
  }

  saveData(fileList: any) {
    let errorData = [];
    if (fileList.length > 0) {
      if (fileList[0]["EmployeeCode"] == undefined) {
        this.commonService.setAlertMessage("error", "Please check EmployeeCode column in excel !!!");
        $('#fileUpload').val("");
        return;
      }
      if (fileList[0]["Amount"] == undefined) {
        this.commonService.setAlertMessage("error", "Please check Amount column in excel !!!");
        $('#fileUpload').val("");
        return;
      }
      for (let i = 0; i < fileList.length; i++) {
        let empCode = fileList[i]["EmployeeCode"];
        let name = fileList[i]["Beneficiary Name"];
        let accountNo = fileList[i]["Beneficiary Account Number"];
        let ifsc = fileList[i]["IFSC"];
        let transactionType = fileList[i]["Transaction Type"];
        let debitAccountNo = fileList[i]["Debit Account No"];
        if (debitAccountNo == undefined) {
          debitAccountNo = "";
        }
        let transationDate = fileList[i]["Transaction Date"];
        let amount = fileList[i]["Amount"];
        let currency = fileList[i]["Currency"];
        let salaryMonth=fileList[i]["Salary Month"];
        let salaryYear=fileList[i]["Salary Year"];
        let remark = "";

        if (empCode != undefined && amount != undefined) {
          let isCorrect = true;
          let chkamount = Number(amount);
          if (Number.isNaN(chkamount)) {
            isCorrect = false;
            remark = "Amount is not in correct format.";
          }
          if (isCorrect == true) {
            let detail = this.allEmployeeList.find(item => item.empCode == empCode);
            if (detail != undefined) {
              if (detail.name.trim() == name.trim()) {
                if (transationDate != null) {
                  let month = transationDate.split('/')[1];
                  let year = transationDate.split('/')[2];
                  let day = transationDate.split('/')[0];
                  let date = year + "-" + month + "-" + day;
                  const data = {
                    name: name,
                    accountNo: accountNo,
                    ifsc: ifsc,
                    transactionType: transactionType,
                    debitAccountNo: debitAccountNo,
                    transationDate: transationDate,
                    amount: amount,
                    currency: currency,
                    uploadBy: localStorage.getItem("userID"),
                    uploadDate: this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond(),
                    year: salaryYear,
                    month: salaryMonth
                  }
                  this.dbFireStore.doc(this.fireStoreCity + "/SalaryTransaction/" + detail.empId + "/" + date + "").set(data);
                }
              }
              else {
                remark = "Name is not correct for this EmployeeId";
                errorData.push({ empCode: empCode, amount: amount, name: name, remark: remark });
              }
            }
            else {
              remark = "EmployeeCode not in list.";
              errorData.push({ empCode: empCode, amount: amount, name: name, remark: remark });
            }
          }
          else {
            errorData.push({ empCode: empCode, amount: amount, name: name, remark: remark });
          }
        }
      }

      if (errorData.length > 0) {
        let htmlString = "";
        htmlString = "<table>";
        htmlString += "<tr>";
        htmlString += "<td>";
        htmlString += "EmployeeId";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Name";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Salary";
        htmlString += "</td>";
        htmlString += "<td>";
        htmlString += "Remark";
        htmlString += "</td>";
        htmlString += "</tr>";
        for (let i = 0; i < errorData.length; i++) {
          htmlString += "<tr>";
          htmlString += "<td>";
          htmlString += errorData[i]["empCode"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += errorData[i]["name"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += errorData[i]["salary"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += errorData[i]["remark"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }

        htmlString += "</table>";

        let fileName = "Error-Data-Salary.xlsx";
        //this.exportExcel(htmlString, fileName);
        $('#fileUpload').val("");
      }
      else {
        this.commonService.setAlertMessage("success", "Salary uploaded successfully !!!");
        $('#fileUpload').val("");
      }
    }
  }

}

export class salaryDetail {
  totalSalary: string;
}
