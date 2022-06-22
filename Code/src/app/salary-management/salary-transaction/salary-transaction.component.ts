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
  employeeType: any;
  fireStoragePath: any;
  userId: any;
  uploadYear: any;
  uploadJsonObj: any;
  salaryDetail: salaryDetail = {
    name: "---",
    uploadedSalary: "0.00",
    transferredSalary: "0.00"
  }
  ddlYear = "#ddlYear";
  fileUpload = "#fileUpload";
  txtSearch = "#txtSearch";
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.userId = localStorage.getItem("userID");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.fireStoreCity = this.commonService.getFireStoreCity();
    this.fireStoragePath = "https://firebasestorage.googleapis.com/v0/b/dtdnavigator.appspot.com/o/";
    this.toDayDate = this.commonService.setTodayDate();
    this.uploadYear = this.toDayDate.split('-')[0];
    let date = this.commonService.getPreviousMonth(this.toDayDate, 1);
    this.yearList = [];
    this.employeeList = [];
    this.transactionList = [];
    this.getYear();
    this.getTransactionList();
    this.getEmployee();
    this.selectedYear = date.split('-')[0];
    $(this.ddlYear).val(this.selectedYear);
  }

  getTransactionList() {
    for (let i = 1; i <= 12; i++) {
      let list = [];
      this.transactionList.push({ month: this.commonService.getCurrentMonthName(i - 1), list: list });
    }
  }

  getSalaryTranscation(empId: any, name: any, empCode: any) {
    $(this.divLoader).show();
    this.clearData();
    let year = $(this.ddlYear).val();
    if (year == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      return;
    }
    if (empId != "0") {
      this.getUploadedSalary(empId);
      this.salaryDetail.name = name + " (" + empCode + ")";
      const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeSalaryTransaction%2F" + this.selectedYear + "%2F" + empId + ".json?alt=media";
      let transferredInstance = this.httpService.get(path).subscribe(data => {
        transferredInstance.unsubscribe();
        if (data != null) {
          let empTransactionObj = JSON.parse(JSON.stringify(data));
          let keyArray = Object.keys(empTransactionObj);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let index = keyArray[i];
              let monthName = empTransactionObj[index]["month"];
              let detail = this.transactionList.find(item => item.month == monthName);
              if (detail != undefined) {
                if (empTransactionObj[index]["amount"] != null) {
                  this.salaryDetail.transferredSalary = (Number(this.salaryDetail.transferredSalary) + Number(empTransactionObj[index]["amount"])).toFixed(2);
                }
                detail.list.push({ amount: empTransactionObj[index]["amount"], transationDate: empTransactionObj[index]["transationDate"], utrNo: empTransactionObj[index]["utrNo"], remarks: empTransactionObj[index]["remarks"] });
              }
            }
          }
        }
        $(this.divLoader).hide();
      }, error => {
        $(this.divLoader).hide();
      });
    }
  }

  getUploadedSalary(empId: any) {
    for (let i = 1; i <= 12; i++) {
      let monthName = this.commonService.getCurrentMonthName(i - 1);
      this.dbFireStore.doc(this.fireStoreCity + "/EmployeeUpdatedSalary/" + this.selectedYear + "/" + monthName + "/data/" + empId + "").get().subscribe(
        (doc) => {
          let detail = this.transactionList.find(item => item.month == monthName);
          if (detail != undefined) {
            if (doc.data() != null) {
              detail.uploadedSalary = doc.data()["uploadedSalary"].toFixed(2);
              this.salaryDetail.uploadedSalary = (Number(this.salaryDetail.uploadedSalary) + Number(detail.uploadedSalary)).toFixed(2);
            }
            else {
              detail.uploadedSalary = "0.00";
            }
          }
        });
    }
  }

  changeYear() {
    this.clearData();
  }

  clearData() {
    this.salaryDetail.name = "---";
    this.salaryDetail.uploadedSalary = "0.00";
    this.salaryDetail.transferredSalary = "0.00";
    for (let i = 0; i < this.transactionList.length; i++) {
      this.transactionList[i]["list"] = [];
    }
  }

  downloadTemplate() {
    let link = document.createElement("a");
    link.download = "sample";
    link.href = "../../../assets/sample/sample.xlsx";
    link.click();
    link.remove();
  }

  getEmployee() {
    const path = this.fireStoragePath + this.commonService.getFireStoreCity() + "%2FEmployeeAccount%2FaccountDetail.json?alt=media";
    let employeeInstance = this.httpService.get(path).subscribe(data => {
      employeeInstance.unsubscribe();
      if (data != null) {
        let jsonData = JSON.stringify(data);
        let list = JSON.parse(jsonData).filter(item => item.empType = 2);
        this.allEmployeeList = list.sort((a, b) => Number(b.empId) < Number(a.empId) ? 1 : -1);
        let activeList = this.allEmployeeList.filter(item => item.status == "1");
        if (activeList.length > 0) {
          this.employeeList = activeList;
          this.employeeType = "active";
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

  filterData(type: any) {
    if (type == "active") {
      let element = <HTMLInputElement>document.getElementById("rdoUnactive");
      element.checked = false;
      let list = this.allEmployeeList.filter(item => item.status == "1");
      if (list.length > 0) {
        this.employeeList = list;
        this.employeeType = "active";
      }
    }
    else if (type == "inactive") {
      let element = <HTMLInputElement>document.getElementById("rdoActive");
      element.checked = false;
      let list = this.allEmployeeList.filter(item => item.status != "1");
      if (list.length > 0) {
        this.employeeList = list;
        this.employeeType = "inactive";
      }
    }
  }

  getEmployees() {
    let name = $(this.txtSearch).val();
    name = name.toString().toUpperCase();
    if (this.employeeType == "active") {
      let list = this.allEmployeeList.filter(item => item.status == "1" && (item.name.includes(name) || item.empCode.includes(name)));
      if (list.length > 0) {
        this.employeeList = list;
      }
      else {
        this.employeeList = [];
      }
    }
    else {
      let list = this.allEmployeeList.filter(item => item.status != "1" && (item.name.includes(name) || item.empCode.includes(name)));
      if (list.length > 0) {
        this.employeeList = list;
      }
      else {
        this.employeeList = [];
      }
    }
  }

  uploadTransferredSalary() {
    let element = <HTMLInputElement>document.getElementById("fileUpload");
    if (element.files[0] == null) {
      this.commonService.setAlertMessage("error", "Please select excel !!!");
      $(this.fileUpload).val("");
      return;
    }
    if (this.selectedYear == "0") {
      this.commonService.setAlertMessage("error", "Please select year !!!");
      $(this.fileUpload).val("");
      return;
    }
    let file = element.files[0];
    let fileName = file.name;
    let fileExt = fileName.split('.');
    if (fileExt[fileExt.length - 1] != "xlsx" && fileExt[fileExt.length - 1] != "xls") {
      this.commonService.setAlertMessage("error", "Please upload only excel file !!!");
      $(this.fileUpload).val("");
      return;
    }

    // upload on storage

    const excelFile = element.files[0];
    let key = 1;

    const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeSalaryTransaction%2F" + this.uploadYear + "%2FuploadHistory.json?alt=media";
    let uploadHistoryInstance = this.httpService.get(path).subscribe(data => {
      uploadHistoryInstance.unsubscribe();
      if (data != null) {
        this.uploadJsonObj = JSON.parse(JSON.stringify(data));
        let lastKey = this.uploadJsonObj["lastKey"];
        key = Number(lastKey) + 1;
        this.addUploadHistory(key, excelFile);
      }
    }, error => {
      this.addUploadHistory(key, excelFile);
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
      var worksheet = workbook.Sheets[workbook.SheetNames[0]];
      let fileList = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      this.saveData(fileList);
    }
  }

  addUploadHistory(key: any, excelFile: any) {
    let fileName = key + ".xlsx";
    const data = {
      uploadBy: this.userId,
      uploadDate: this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond(),
      fileName: fileName
    }

    let obj = {};
    if (this.uploadJsonObj != null) {
      obj = this.uploadJsonObj;
    }
    obj[key] = data;
    obj["lastKey"] = key;
    let filePath = "/EmployeeSalaryTransaction/" + this.uploadYear + "/";
    this.commonService.saveJsonFile(obj, "uploadHistory.json", filePath);

    const path = "" + this.commonService.getFireStoreCity() + "/EmployeeSalaryTransaction/" + this.uploadYear + "/Files/" + fileName;
    this.storage.upload(path, excelFile);
  }

  saveData(fileList: any) {
    $(this.divLoader).show();
    let errorData = [];
    let transationList = [];
    if (fileList.length > 0) {
      if (fileList[0]["Employee Code"] == undefined) {
        this.commonService.setAlertMessage("error", "Please check EmployeeCode column in excel !!!");
        $(this.fileUpload).val("");
        $(this.divLoader).hide();
        return;
      }
      if (fileList[0]["Amount"] == undefined) {
        this.commonService.setAlertMessage("error", "Please check Amount column in excel !!!");
        $(this.fileUpload).val("");
        $(this.divLoader).hide();
        return;
      }
      if (fileList[0]["Amount"] == undefined) {
        this.commonService.setAlertMessage("error", "Please check UTR Number column in excel !!!");
        $(this.fileUpload).val("");
        $(this.divLoader).hide();
        return;
      }
      for (let i = 0; i < fileList.length; i++) {
        let empCode = fileList[i]["Employee Code"];
        let name = fileList[i]["Beneficiary Name"];
        let accountNo = fileList[i]["Beneficiary Account Number"];
        let ifsc = fileList[i]["IFSC"];
        let emailId = "";
        if (fileList[i]["Beneficiary Email ID"] != undefined) {
          emailId = fileList[i]["Beneficiary Email ID"];
        }
        let utrNo = "";
        if (fileList[i]["UTR Number"] != undefined) {
          utrNo = fileList[i]["UTR Number"];
        }
        let transactionType = fileList[i]["Transaction Type"];
        let debitAccountNo = fileList[i]["Debit Account No"];
        if (debitAccountNo == undefined) {
          debitAccountNo = "";
        }
        let transationDate = fileList[i]["Transaction Date"];
        let amount = fileList[i]["Amount"];
        let currency = fileList[i]["Currency"];
        let remarks = "";
        if (fileList[i]["Remarks"] != undefined) {
          remarks = fileList[i]["Remarks"];
        }
        let remark = "";

        if (empCode != undefined && amount != undefined) {
          let isCorrect = true;
          let chkamount = Number(amount);
          if (Number.isNaN(chkamount)) {
            isCorrect = false;
            remark = "Amount is not in correct format.";
          }
          if (isCorrect == true) {
            if (utrNo == "") {
              remark = "UTR Number not found.";
              errorData.push({ empCode: empCode, amount: amount, name: name, remark: remark });
            }
            else {
              let detail = this.allEmployeeList.find(item => item.empCode == empCode);
              if (detail != undefined) {
                if (detail.name.trim() == name.trim()) {
                  if (transationDate != null) {
                    let checkDate = transationDate.toString().split('/');
                    if (checkDate.length == 1) {
                      transationDate = this.getExcelDatetoDate(transationDate);
                      transationDate = transationDate.split('-')[1] + "/" + transationDate.split('-')[2] + "/" + transationDate.split('-')[0];
                    }
                    let year = transationDate.split('/')[2];
                    transationList.push({ empId: detail.empId, transationDate: transationDate, name: name, accountNo: accountNo, ifsc: ifsc, transactionType: transactionType, debitAccountNo: debitAccountNo, amount: amount, currency: currency, emailId: emailId, utrNo: utrNo, remarks: remarks, year: year });
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
          }
          else {
            errorData.push({ empCode: empCode, amount: amount, name: name, remark: remark });
          }
        }
      }
      this.getEmployeeTransactionList(transationList);

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
        htmlString += "Amount";
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
          htmlString += errorData[i]["amount"];
          htmlString += "</td>";
          htmlString += "<td>";
          htmlString += errorData[i]["remark"];
          htmlString += "</td>";
          htmlString += "</tr>";
        }

        htmlString += "</table>";

        let fileName = "Error-Data-Salary-Transaction.xlsx";
        this.exportExcel(htmlString, fileName);
        $(this.fileUpload).val("");
        $(this.divLoader).hide();
      }
    }
  }

  getEmployeeTransactionList(transactionList) {
    let employeeDistinctList = transactionList.map(item => item.empId)
      .filter((value, index, self) => self.indexOf(value) === index);
    for (let i = 0; i < employeeDistinctList.length; i++) {
      let empId = employeeDistinctList[i];
      let list = transactionList.filter(item => item.empId == empId);
      if (list.length > 0) {
        let yearDistinctList = list.map(item => item.year)
          .filter((value, index, self) => self.indexOf(value) === index);
        if (yearDistinctList.length > 0) {
          for (let j = 0; j < yearDistinctList.length; j++) {
            let year = yearDistinctList[j];
            let list1 = list.filter(item => item.year == year);
            if (list1.length > 0) {
              this.saveTransactionData(empId, year, list1);
            }
          }
        }
      }
      if (i == employeeDistinctList.length - 1) {
        this.commonService.setAlertMessage("success", "File uploaded successfully !!!");
        $(this.fileUpload).val("");
        $(this.divLoader).hide();
      }
    }
  }

  saveTransactionData(empId: any, year: any, list: any) {
    const path = this.fireStoragePath + this.fireStoreCity + "%2FEmployeeSalaryTransaction%2F" + year + "%2F" + empId + ".json?alt=media";
    let transactionInstance = this.httpService.get(path).subscribe(empData => {
      transactionInstance.unsubscribe();
      let obj = {};
      if (empData != null) {
        obj = JSON.parse(JSON.stringify(empData));
      }
      this.saveTransferredSalaryJson(obj, list, empId, year);
    }, error => {
      let obj = {};
      this.saveTransferredSalaryJson(obj, list, empId, year);
    });
  }

  saveTransferredSalaryJson(obj: any, list: any, empId: any, year: any) {
    for (let i = 0; i < list.length; i++) {
      let transationDate = list[i]["transationDate"];
      let month = transationDate.split('/')[1];
      if (month.toString().length == 1) {
        month = "0" + month;
      }
      let year = transationDate.split('/')[2];
      let day = transationDate.split('/')[0];
      if (day.toString().length == 1) {
        day = "0" + day;
      }
      let date = year + "-" + month + "-" + day;
      let monthName = this.commonService.getCurrentMonthName(Number(month) - 1);
      const data = {
        name: list[i]["name"],
        accountNo: list[i]["accountNo"],
        ifsc: list[i]["ifsc"],
        transactionType: list[i]["transactionType"],
        debitAccountNo: list[i]["debitAccountNo"],
        transationDate: list[i]["transationDate"],
        amount: list[i]["amount"],
        currency: list[i]["currency"],
        emailId: list[i]["emailId"],
        utrNo: list[i]["utrNo"],
        remarks: list[i]["remarks"],
        uploadBy: localStorage.getItem("userID"),
        uploadDate: this.toDayDate + " " + this.commonService.getCurrentTimeWithSecond(),
        year: year,
        month: monthName
      }
      obj[date] = data;
    }
    let filePath = "/EmployeeSalaryTransaction/" + year + "/";
    this.commonService.saveJsonFile(obj, empId + ".json", filePath);
  }


  exportExcel(htmlString: any, fileName: any) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(htmlString, 'text/html');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(doc);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, fileName);
  }

  getExcelDatetoDate(serial: any) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);
    return this.commonService.getDateWithDate(date_info);
  }

}

export class salaryDetail {
  name: string;
  uploadedSalary: string;
  transferredSalary: string;
}
