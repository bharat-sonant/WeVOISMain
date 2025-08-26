import { Component, OnInit } from '@angular/core';
import { CommonService } from "../services/common/common.service";
import { DustbinService } from "../services/dustbin/dustbin.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "@angular/fire/storage";
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-secondary-collection-manage',
  templateUrl: './secondary-collection-manage.component.html',
  styleUrls: ['./secondary-collection-manage.component.scss']
})
export class SecondaryCollectionManageComponent implements OnInit {
  constructor(private dustbinService: DustbinService, private commonService: CommonService, private storage: AngularFireStorage, private modalService: NgbModal) { }
  selectedZone: any;
  selectedStatus: any;
  zoneList: any[] = [];
  dustbinStorageList: any[] = [];
  dustbinAllStorageList: any[] = [];
  dustbinList: any[] = [];
  ddlZone = "#ddlZone";
  dustbinId = "#dustbinId";
  txtaddress = "#txtaddress";
  ddlZoneUpdate = "#ddlZoneUpdate";
  txtWard = "#txtWard";
  txtLat = "#txtLat";
  txtLng = "#txtLng";
  txtFreq = "#txtFreq";
  ddlDustbinType = "#ddlDustbinType";
  isShowDisabledBy: any;
 public cityName:any;

  dustbinSummary: dustbinSummary = {
    totalDustbin: 0,
    wardDustbin: 0,
    disableDustbin: 0,
    enableDustbin: 0
  }

  ngOnInit() {
    this.cityName=localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.commonService.savePageLoadHistory("Secondary-Collection-Management", "Manage-Secondary-Collection", localStorage.getItem("userID"));
    this.getZoneList();
  }

  getZoneList() {
    this.zoneList = [];
    this.isShowDisabledBy = "0";
    this.dustbinService.getDustbinZone().then((zones: any) => {
      if (zones != null) {
        let list = zones.toString().split(',');
        for (let i = 0; i < list.length; i++) {
          this.zoneList.push({ zoneNo: list[i], zone: "Zone " + list[i] });
        }
        this.zoneList = this.commonService.transformNumeric(this.zoneList, 'zone');
        this.selectedZone = this.zoneList[0]["zoneNo"];
        this.dustbinStorageList = [];
        this.dustbinStorageList = JSON.parse(localStorage.getItem("openDepot"));
        this.dustbinAllStorageList = [];
        this.dustbinAllStorageList = JSON.parse(localStorage.getItem("allDustbin"));
        if (this.dustbinStorageList != null) {
          this.dustbinSummary.totalDustbin = this.dustbinStorageList.filter(item => item.isDisabled != "yes").length;
          this.selectedStatus = "enabled";
          this.getDustbins();
        }
      }

    });

  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;
    this.getDustbins();
  }

  changeStatusSelection(filterVal: any) {
    this.selectedStatus = filterVal;
    this.getDustbins();
  }

  getDustbins() {
    this.dustbinList = [];
    let list = [];
    let userList = JSON.parse(localStorage.getItem("webPortalUserList"));
    if (this.dustbinStorageList.length > 0) {
      list = this.dustbinStorageList.filter(item => item.zone.toString().trim() == this.selectedZone.toString().trim());
      this.dustbinSummary.wardDustbin = list.filter(item => item.isDisabled != "yes").length;
      if (this.selectedStatus == "enabled") {
        list = list.filter(item => item.isDisabled != "yes");
        this.isShowDisabledBy = "0";
      }
      else if (this.selectedStatus == "disabled") {
        list = list.filter(item => item.isDisabled == "yes");
        this.isShowDisabledBy = "1";
      }
      else {
        this.isShowDisabledBy = "1";

      }
      for (let i = 0; i < list.length; i++) {
        let disabledByName = "";
        if (list[i]["disabledBy"] != "") {
          let detail = userList.find(item => item.userId == list[i]["disabledBy"]);
          if (detail != undefined) {
            disabledByName = detail.name;
          }

        }
        this.dustbinList.push({ zoneNo: list[i]["zone"], type: list[i]["type"], dustbin: list[i]["dustbin"], ward: list[i]["ward"], lat: list[i]["lat"], lng: list[i]["lng"], address: list[i]["address"], pickFrequency: list[i]["pickFrequency"], isDisabled: list[i]["isDisabled"], disabledBy: list[i]["disabledBy"], disabledByName: disabledByName });
      }
    }
  }

  downloadQRCode(dustbinId: any) {
    let fileName = dustbinId + ".png";
    let imageUrl = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + "%2FDustbinData%2FQRcodes%2F" + fileName + "?alt=media&token";
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }


  async uploadQRCodWithText(url: any, dustbinId: any) {
    let qrData: string = url;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    QRCode.toCanvas(canvas, qrData.trim(), { width: 400 }, (err) => {
      if (err) throw err;

      // Resize canvas for text space
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height + 40; // extra space for text
      const finalCtx = finalCanvas.getContext('2d');

      // Draw QR
      finalCtx.drawImage(canvas, 0, 0);

      // Draw text
      finalCtx.font = 'bold 16px Arial';
      finalCtx.textAlign = 'center';
      finalCtx.fillText(qrData.trim(), finalCanvas.width / 2, canvas.height + 25);

      let qrCodeImage = finalCanvas.toDataURL('image/png');
      //let qrCodeImage = await QRCode.toDataURL(qrData);
      var byteString = atob(qrCodeImage.split(',')[1]);

      // separate out the mime component
      var mimeString = qrCodeImage.split(',')[0].split(':')[1].split(';')[0]

      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);

      // create a view into the buffer
      var ia = new Uint8Array(ab);

      // set the bytes of the buffer to the correct values
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      // write the ArrayBuffer to a blob, and you're done
      var blob = new Blob([ab], { type: mimeString });
      // let filePath = "/CollectionManagement/" + this.lastEmpId + "/";
      let fileName = dustbinId + ".png";
      let filePath = "/DustbinData/QRcodes/";
      const path = this.commonService.getFireStoreCity() + filePath + fileName;
      const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(path);
      const task = ref.put(blob);
      setTimeout(() => {
        this.downloadQRCode(dustbinId);
      }, 600);
    });
  }


  exportToExcel() {
    let exportList = this.commonService.transformNumeric(this.dustbinStorageList, "zone");
    if (exportList.length > 0) {
      let htmlString = "";
      htmlString = "<table>";
      htmlString += "<tr>";
      htmlString += "<td>";
      htmlString += "Zone No";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Ward No";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Address";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Latitude";
      htmlString += "</td>";
      htmlString += "<td>";
      htmlString += "Longitude";
      htmlString += "</td>";
      htmlString += "</tr>";
      if (exportList.length > 0) {
        for (let i = 0; i < exportList.length; i++) {
          if (exportList[i]["isDisabled"] == "no") {
            htmlString += "<tr>";
            htmlString += "<td>";
            htmlString += exportList[i]["zone"];
            htmlString += "</td>";
            htmlString += "<td t='s'>";
            htmlString += exportList[i]["ward"];
            htmlString += "</td>";
            htmlString += "<td t='s'>";
            htmlString += exportList[i]["address"];
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += exportList[i]["lat"];
            htmlString += "</td>";
            htmlString += "<td>";
            htmlString += exportList[i]["lng"];
            htmlString += "</td>";
            htmlString += "</tr>";
          }
        }
      }
      htmlString += "</table>";
      let fileName = this.commonService.getFireStoreCity() + "-Open-Depot.xlsx";
      this.commonService.exportExcel(htmlString, fileName);
    }
  }

  addUpdateDustbin() {
    if (this.isValidate() == false) {
      return;
    }
    let dustbinId = $(this.dustbinId).val();
    let address = $(this.txtaddress).val();
    let zone = $(this.ddlZoneUpdate).val();
    let ward = $(this.txtWard).val();
    let lat = $(this.txtLat).val();
    let lng = $(this.txtLng).val();
    let type = $(this.ddlDustbinType).val();
    let pickFrequency = $(this.txtFreq).val();
    const data = {
      address: address,
      zone: zone,
      ward: ward,
      lat: lat,
      lng: lng,
      type: type,
      pickFrequency: pickFrequency,
      createdDate: this.commonService.setTodayDate(),
      dustbinType: "Open Depot"
    }
    if (dustbinId == "0") {
      this.addDustbin(data);
    }
    else {
      this.updateDustbin(dustbinId, data);
    }
  }

  addDustbin(data: any) {
    let dustbin = 1;
    if (this.dustbinAllStorageList.length > 0) {
      dustbin = Number(this.dustbinAllStorageList[this.dustbinAllStorageList.length - 1]["dustbin"]) + 1;
      if (isNaN(dustbin)) {
        this.commonService.setAlertMessage("error", "Please try again !!!");
        return;
      }
    }
    this.dustbinService.updateDustbinDetail(dustbin, data, 'add');
    this.dustbinStorageList.push({ address: data.address, dustbin: dustbin.toString(), isApproved: false, isAssigned: "false", isBroken: false, isDisabled: "no", lat: data.lat, lng: data.lng, pickFrequency: data.pickFrequency, type: data.type, ward: data.ward, zone: data.zone, dustbinType: "Open Depot" });
    localStorage.setItem("openDepot", JSON.stringify(this.dustbinStorageList));
    this.dustbinAllStorageList.push({ address: data.address, dustbin: dustbin.toString(), isApproved: false, isAssigned: "false", isBroken: false, isDisabled: "no", lat: data.lat, lng: data.lng, pickFrequency: data.pickFrequency, type: data.type, ward: data.ward, zone: data.zone, dustbinType: "Open Depot" });
    localStorage.setItem("allDustbin", JSON.stringify(this.dustbinAllStorageList));
    this.getDustbins();
    this.commonService.setAlertMessage("success", "Open depot detail added successfully !!!");
    this.closeModel();
  }

  updateDustbin(dustbin: any, data: any) {

    this.dustbinService.updateDustbinDetail(dustbin, data, 'update');
    this.updateLocalStorageDustbin(dustbin, data);
    this.getDustbins();
    this.commonService.setAlertMessage("success", "Open depot detail updated successfully !!!");
  }

  updateDustbinStatus(dustbin: any, status: any) {
    this.dustbinService.updateDustbinStatus(dustbin, status);
    let detail = this.dustbinStorageList.find(item => item.dustbin == dustbin);
    if (detail != undefined) {
      detail.isDisabled = status;
      if (status == "yes") {
        detail.disabledBy = localStorage.getItem("userID");
      }
      else {
        detail.disabledBy = "";
      }
    }
    localStorage.setItem("openDepot", JSON.stringify(this.dustbinStorageList));
    this.getDustbins();
    this.commonService.setAlertMessage("susscee", "Open depot status updated !!!");
  }

  isValidate() {
    let isValid = true;
    let msg = "";
    if ($(this.txtFreq).val() == "") {
      isValid = false;
      msg = "Please enter pick frequency !!!";
    }
    if ($(this.txtLat).val() == "") {
      isValid = false;
      msg = "Please enter latitude !!!";
    }
    if ($(this.txtLng).val() == "") {
      isValid = false;
      msg = "Please enter longitude !!!";
    }
    if ($(this.txtWard).val() == "") {
      isValid = false;
      msg = "Please enter ward no. !!!";
    }
    if ($(this.txtaddress).val() == "") {
      isValid = false;
      msg = "Please enter address !!!";
    }
    if (isValid == false) {
      this.commonService.setAlertMessage("error", msg);
    }
    return isValid;
  }

  updateLocalStorageDustbin(dustbin: any, data: any) {
    let dustbinStorageDetail = this.dustbinStorageList.find((item) => item.dustbin == dustbin);
    if (dustbinStorageDetail != undefined) {
      dustbinStorageDetail.zone = data.zone;
      dustbinStorageDetail.type = data.type;
      dustbinStorageDetail.ward = data.ward;
      dustbinStorageDetail.lat = data.lat;
      dustbinStorageDetail.lng = data.lng;
      dustbinStorageDetail.address = data.address;
      dustbinStorageDetail.pickFrequency = data.pickFrequency;
    }
    localStorage.setItem("openDepot", JSON.stringify(this.dustbinStorageList));
    this.closeModel();
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 480;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.dustbinId).val(id);
    if (type == "update") {
      $("#exampleModalLongTitle").html("Manage Open depot");
      let dustbinDetail = this.dustbinList.find((item) => item.dustbin == id);
      if (dustbinDetail != undefined) {
        setTimeout(() => {
          $(this.txtaddress).val(dustbinDetail.address);
          $(this.ddlZoneUpdate).val(dustbinDetail.zoneNo);
          $(this.txtWard).val(dustbinDetail.ward);
          $(this.txtLat).val(dustbinDetail.lat);
          $(this.txtLng).val(dustbinDetail.lng);
          $(this.txtFreq).val(dustbinDetail.pickFrequency);
          $(this.ddlDustbinType).val(dustbinDetail.type);
        }, 100);
      }
    }
    else {
      $("#exampleModalLongTitle").html("Add Open depot");
      setTimeout(() => {
        document.getElementById('txtaddress').removeAttribute('readonly');
      }, 100);
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }


}

export class dustbinSummary {
  totalDustbin: number;
  wardDustbin: number;
  disableDustbin: number;
  enableDustbin: number;

}

