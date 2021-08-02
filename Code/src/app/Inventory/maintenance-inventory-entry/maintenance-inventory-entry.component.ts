import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireStorage } from 'angularfire2/storage';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../services/common/common.service';
import { ToastrService } from 'ngx-toastr'; // Alert message using NGX toastr
import { ActivatedRoute, Router } from "@angular/router";
import { AnonymousSubject } from 'rxjs/internal/Subject';
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-maintenance-inventory-entry',
  templateUrl: './maintenance-inventory-entry.component.html',
  styleUrls: ['./maintenance-inventory-entry.component.scss']
})
export class MaintenanceInventoryEntryComponent implements OnInit {

  constructor(private storage: AngularFireStorage, private http: HttpClient, private router: Router, public fs: FirebaseService, public httpService: HttpClient, public toastr: ToastrService, private actRoute: ActivatedRoute, private commonService: CommonService) { }
  selectedFile: File;
  partFilterList: any[] = [];
  partAllList: any[] = [];
  currentYear: any;
  currentMonthName: any;
  toDayDate: any;
  lastEntry: any;
  entryNo: any;
  entryDate: any;
  billImage: any;
  billImageURL: any;
  imageUrl: any;
  isNew: boolean = false;
  partList: any = [];
  sno: any = 0;
  partNo: any = 0;
  cityName:any;
  db:any;

  ngOnInit() {
    this.db=this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
   // this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.cityName=localStorage.getItem('cityName');
    const id = this.actRoute.snapshot.paramMap.get('id');
    const id2 = this.actRoute.snapshot.paramMap.get('id2');
    if (id != null) {
      this.entryNo = id2;
    }
    if (id2 != null) {
      this.toDayDate = id;
      this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.toDayDate).getMonth());
      this.currentYear = this.toDayDate.split('-')[0];
    }
    else {
      this.toDayDate = this.commonService.setTodayDate();
      this.currentMonthName = this.commonService.getCurrentMonthName(new Date(this.toDayDate).getMonth());
      this.currentYear = new Date().getFullYear();
    }
    $('#parts').hide();
    $('#selectList').hide();
    this.getParts();
    if (this.entryNo != null) {
      this.getEntryData(this.entryNo);
    }
  }

  addMore() {
    let part = "";
    let qty = 0;
    let price = 0;
    let amount = 0;
    let unit = "";
    let sno = 0;
    if (this.isNew == false) {
      if ($('#ddlParts').val() == "") {
        this.setAlertMessage("error", "Please select part/accessory !!!");
        return;
      }
      else {
        part = $('#ddlParts').val().toString();
      }
    }
    else {
      if ($('#parts').val() == "") {
        this.setAlertMessage("error", "Please fill part/accessory !!!");
        return;
      }
      else {
        part = $('#parts').val().toString();
      }
    }
    if ($('#qty').val() == "") {
      this.setAlertMessage("error", "Please fill quantity !!!");
      return;
    }
    else {
      qty = Number($('#qty').val());
      amount = price * qty;
    }

    if ($('#price').val() == "") {
      this.setAlertMessage("error", "Please fill price !!!");
      return;
    }
    else {
      price = Number($('#price').val());
      amount = price * qty;
    }

    if ($('#ddlUnit').val() == "0") {
      this.setAlertMessage("error", "Please select unit !!!");
      return;
    }
    else {
      unit = $('#ddlUnit').val().toString();
    }
    if (this.partList.length > 0) {
      sno = this.partList.length;
    }
    this.partList.push({ sno: sno, part: part, qty: qty, price: price.toFixed(2), amount: amount.toFixed(2), unit: unit, isNew: this.isNew });
    $('#ddlUnit').val("0");
    $('#ddlParts').val("");
    $('#qty').val("");
    $('#price').val("");
    $('#amount').val("0");
    $('#parts').val("");
    this.cancel();
    this.getNetAmount();
  }

  getNetAmount() {
    let netAmount = 0;
    if (this.partList.length > 0) {

      for (let i = 0; i < this.partList.length; i++) {
        netAmount = netAmount + Number(this.partList[i]["amount"]);
      }
    }
    $('#netAmount').val(netAmount.toFixed(2));
  }

  getAmount() {
    let qty = 0;
    let price = 0;
    if ($('#qty').val() != "") {
      qty = Number($('#qty').val());
    }
    if ($('#price').val() != "") {
      price = Number($('#price').val());
    }
    let amount = (price * qty).toFixed(2);
    $('#amount').val(amount);

  }

  deleteEntry(sno: any) {
    let tempList = [];
    if (this.partList.length > 0) {
      let snoNew = 0;
      for (let i = 0; i < this.partList.length; i++) {
        if (this.partList[i]["sno"] != sno) {
          tempList.push({ sno: snoNew, part: this.partList[i]["part"], qty: this.partList[i]["qty"], price: this.partList[i]["price"], amount: this.partList[i]["amount"], unit: this.partList[i]["unit"] });
          snoNew++;
        }
      }
      this.partList = tempList;
      this.getNetAmount();
    }
  }

  addNew() {
    this.isNew = true;
    $('#parts').show();
    $('#selectList').show();
    $('#ddlParts').hide();
    $('#ddlParts').val("");
    $('#addNew').hide();
    $('#parts').val("");
  }

  cancel() {
    this.isNew = false;
    $('#ddlParts').val("");
    $('#parts').val("");
    $('#parts').hide();
    $('#selectList').hide();
    $('#ddlParts').show();
    $('#addNew').show();
  }

  getEntryData(id: any) {
    let dbPath = "Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/" + id;
    let petrolInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        petrolInstance.unsubscribe();
        if (data != null) {
          $('#billNo').val(data["billNo"]);
          $('#date').val(data["date"]);
          $('#netAmount').val(data["netAmount"]);
          if (data["vendorName"] != null) {
            $('#vendorName').val(data["vendorName"]);
          }
          if (data["remark"] != null) {
            $('#remark').val(data["remark"]);
          }
          if (data["billImage"] != null) {
            this.billImage = data["billImage"];
          }
          let listData = data["Detail"];
          if (listData.length > 0) {
            for (let i = 0; i < listData.length; i++) {
              this.partList.push({ sno: i, part: listData[i]["part"], qty: listData[i]["qty"], price: listData[i]["price"], amount: listData[i]["amount"], unit: listData[i]["unit"] });
            }
          }
        }
      });
  }

  onFileChanged(event) {
    this.selectedFile = event.target.files[0];
    let self = this;
    let preview = <HTMLImageElement>document.getElementById("source_image");
    this.billImage = this.selectedFile;
    let reader = new FileReader();
    reader.addEventListener("load", function (e: any) {
      var fileUrl = e.target.result;
      preview.src = fileUrl.toString();
      preview.onload = () => {
        self.resizeFile(preview, preview);
      };
    }, false);

    if (this.selectedFile) {
      reader.readAsDataURL(this.selectedFile);
    }
  }


  resizeFile(loadedData, preview) {
    var canvas = document.createElement('canvas'),
      ctx;
    var maxWidth = 800;
    var maxHeight = 800;
    if (loadedData.height <= maxHeight && loadedData.width <= maxWidth) {
      maxHeight = loadedData.height;
      maxWidth = loadedData.width;
    }
    else {
      if (loadedData.height > loadedData.width) {
        maxWidth = Math.floor(maxHeight * (loadedData.width / loadedData.height));
      }
      else {
        maxHeight = Math.floor(maxWidth * (loadedData.height / loadedData.width));
      }
    }
    canvas.width = Math.round(maxWidth);
    canvas.height = Math.round(maxHeight);
    ctx = canvas.getContext('2d');
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    // compress Image

    var result_image = <HTMLImageElement>document.getElementById('result_compress_image');
    var quality = 50;
    var mime_type = "image/jpeg";
    var newImageData = canvas.toDataURL(mime_type, quality / 100);
    var result_image_obj = new Image();
    result_image_obj.src = newImageData;
    result_image.src = result_image_obj.src;
    this.imageUrl = result_image_obj;
    result_image.onload = function () {

    }
  }

  getParts() {
    let dbPath = "Defaults/VehicleParts";
    let vehicleInstance = this.db.object(dbPath).valueChanges().subscribe(
      vehicle => {
        vehicleInstance.unsubscribe();
        if (vehicle != null) {
          let keyArray = Object.keys(vehicle);
          this.partNo = Number(keyArray[keyArray.length - 1]) + 1;
          for (let i = 0; i < keyArray.length; i++) {
            let index = keyArray[i];
            this.partFilterList.push({ part: vehicle[index]["name"] });
          }
        }
      });
  }


  submitData() {
    const id = this.actRoute.snapshot.paramMap.get('id');

    if ($("#date").val() == "") {
      this.setAlertMessage("error", "Please fill date !!!");
      return;
    }
    if ($("#billNo").val() == "") {
      this.setAlertMessage("error", "Please fill Bill No. !!!");
      return;
    }
    if (this.partList.length == 0) {
      this.setAlertMessage("error", "Please fill part/accessory detail !!!");
      return;
    }
    if (this.billImage == null) {
      this.setAlertMessage("error", "Please select bill slip !!!");
      return;
    }
    $('#divLoader').show();
    let elementSave = <HTMLButtonElement>document.getElementById("btnSave");
    elementSave.disabled = true;
    let elementCancel = <HTMLButtonElement>document.getElementById("btnCancel");
    elementCancel.disabled = true;

    let billNo = $("#billNo").val();
    let date = $("#date").val();
    let vendorName = null;
    if ($("#vendorName").val() != "") {
      vendorName = $("#vendorName").val();
    }
    let remark = null;
    if ($("#remark").val() != "") {
      remark = $("#remark").val();
    }
    let netAmount = $("#netAmount").val();
    let isDelete = 0;
    if (this.selectedFile != null) {
      let fileName = billNo + "_" + this.selectedFile.name;
      const path = ""+this.commonService.getFireStoreCity()+"/VehiclePartBill/" + date + "/" + fileName;
      this.billImage = fileName;
      const ref = this.storage.storage.app.storage('gs://dtdnavigator.appspot.com').ref(path);

      var byteString;
      if (this.imageUrl.src.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(this.imageUrl.src.split(',')[1]);
      else
        byteString = unescape(this.imageUrl.src.split(',')[1]);

      // separate out the mime component
      var mimeString = this.imageUrl.src.split(',')[0].split(':')[1].split(';')[0];

      // write the bytes of the string to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      let blob = new Blob([ia], { type: mimeString });
      const task = ref.put(blob);
    }
    let userId = localStorage.getItem('userID');
    this.currentYear = date.toString().split('-')[0];
    this.toDayDate = date;
    this.currentMonthName = this.commonService.getCurrentMonthName(Number(date.toString().split('-')[1]) - 1);
    if (this.entryNo == null) {
      let dbPath = "Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/lastEntry";
      let lastEntryInstance = this.db.object(dbPath).valueChanges().subscribe(
        data => {
          lastEntryInstance.unsubscribe();
          if (data != null) {
            this.lastEntry = data;
          }
          else {
            this.lastEntry = 0;
          }
          this.lastEntry = Number(this.lastEntry) + 1;
          this.db.object("Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "").update({
            "lastEntry": this.lastEntry
          });
          this.db.object("Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/" + this.lastEntry).update({
            "billNo": billNo,
            "date": date,
            "vendorName": vendorName,
            "netAmount": netAmount,
            "userId": userId,
            "creationDate": this.toDayDate,
            "isDelete": isDelete,
            "billImage": this.billImage,
            "remark": remark
          });
          if (this.partList.length > 0) {
            for (let i = 0; i < this.partList.length; i++) {
              if (this.partList[i]["isNew"] == true) {
                let path = "Defaults/VehicleParts/" + this.partNo;
                this.db.object(path).update({
                  "name": this.partList[i]["part"]
                });
              }
              this.db.object("Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/" + this.lastEntry + "/Detail/" + this.partList[i]["sno"]).update({
                "part": this.partList[i]["part"],
                "qty": this.partList[i]["qty"],
                "price": this.partList[i]["price"],
                "amount": this.partList[i]["amount"],
                "unit": this.partList[i]["unit"]
              });
            }
          }
          setTimeout(() => {
            $('#divLoader').hide();
            elementSave.disabled = false;
            elementCancel.disabled = false;
            this.setAlertMessage("success", "Entry Added Successfully !!!");
            this.clearAll();
          }, 4000);
        });
    }
    else {
      this.lastEntry = this.entryNo;
      this.db.object("Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/" + this.lastEntry).update({
        "billNo": billNo,
        "date": date,
        "vendorName": vendorName,
        "netAmount": netAmount,
        "userId": userId,
        "creationDate": this.toDayDate,
        "isDelete": isDelete,
        "billImage": this.billImage,
        "remark": remark
      });
      if (this.partList.length > 0) {
        this.db.object("Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/" + this.lastEntry).update({
          "Detail": null
        });

        for (let i = 0; i < this.partList.length; i++) {
          if (this.partList[i]["isNew"] == true) {
            let path = "Defaults/VehicleParts/" + this.partNo;
            this.db.object(path).update({
              "name": this.partList[i]["part"]
            });
          }
          this.db.object("Inventory/VehiclePartData/" + this.currentYear + "/" + this.currentMonthName + "/" + this.toDayDate + "/" + this.lastEntry + "/Detail/" + this.partList[i]["sno"]).update({
            "part": this.partList[i]["part"],
            "qty": this.partList[i]["qty"],
            "price": this.partList[i]["price"],
            "amount": this.partList[i]["amount"],
            "unit": this.partList[i]["unit"]
          });
        }
      }
      setTimeout(() => {
        this.setAlertMessage("success", "Entry Updated Successfully !!!");
        this.router.navigate(['/' + this.cityName + '/7B/maintenance-inventory-list']);
        //this.router.navigate(['/maintenance-inventory-list']);
      }, 4000);
    }

  }

  clearAll() {
    this.partList=[];
    $("#billNo").val("");
    $("#vendorName").val("");
    $('#netAmount').val("");
    $('#remark').val("");
    this.billImage = null;
    var result_image = <HTMLImageElement>document.getElementById('result_compress_image');
    result_image.src = "";
  }

  cancelEntry() {
    this.router.navigate(['/' + this.cityName + '/7B/maintenance-inventory-list']);
  }

  setAlertMessage(type: any, message: any) {
    if (type == "error") {
      this.toastr.error(message, '', {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-danger alert-with-icon",
        positionClass: 'toast-bottom-right'
      });
    }
    else {
      this.toastr.error(message, '', {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-info alert-with-icon",
        positionClass: 'toast-bottom-right'
      });
    }
  }


  getFilters() {
    this.partFilterList = [];
    let flt = $('#ddlParts').val();
    if (flt != "") {
      if (this.partAllList.length > 0) {
        for (let i = 0; i < this.partAllList.length; i++) {
          if (this.partAllList[i]["vehicle"].toString().includes(flt.toString().toUpperCase())) {
            this.partFilterList.push({ vehicle: this.partAllList[i]["vehicle"] });
          }
        }
      }
    }
    else {
      if (this.partAllList.length > 0) {
        for (let i = 0; i < this.partAllList.length; i++) {
          this.partFilterList.push({ vehicle: this.partAllList[i]["vehicle"] });
        }
      }
    }
  }

  showList() {
    $('#partList').show();
  }

  hideList() {
    setTimeout(() => {
      $('#partList').hide();
    }, 500);

  }

  getValue(e) {
    $('#ddlParts').val(e.target.innerHTML);
    $('#partList').hide();
  }
}
