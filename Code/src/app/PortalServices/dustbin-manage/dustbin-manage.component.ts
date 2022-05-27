import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { DustbinService } from "../../services/dustbin/dustbin.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-dustbin-manage',
  templateUrl: './dustbin-manage.component.html',
  styleUrls: ['./dustbin-manage.component.scss']
})

export class DustbinManageComponent implements OnInit {

  constructor(private dustbinService: DustbinService, private commonService: CommonService, private modalService: NgbModal) { }
  selectedZone: any;
  zoneList: any[] = [];
  dustbinStorageList: any[] = [];
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
  ddlStatus = "#ddlStatus";

  ngOnInit() {
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.getZoneList();
  }

  getZoneList() {
    this.zoneList = [];
    this.dustbinStorageList = [];
    this.dustbinStorageList = JSON.parse(localStorage.getItem("dustbin"));
    console.log(this.dustbinStorageList);
    if (this.dustbinStorageList != null) {
      let list = this.dustbinStorageList.map(item => item.zone).filter((value, index, self) => self.indexOf(value) === index);
      for (let i = 0; i < list.length; i++) {
        this.zoneList.push({ zoneNo: list[i], zone: "Zone " + list[i] });
      }
      this.zoneList = this.commonService.transformNumeric(this.zoneList, 'zone');
      this.selectedZone = this.zoneList[0]["zoneNo"];
      this.getDustbins();
    }
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;
    this.getDustbins();
  }

  getDustbins() {
    this.dustbinList = [];
    let list = [];
    if (this.dustbinStorageList.length > 0) {
      if (this.selectedZone == "0") {
        list = this.dustbinStorageList;
      }
      else {
        list = this.dustbinStorageList.filter(item => item.zone == this.selectedZone);
      }
      for (let i = 0; i < list.length; i++) {
        this.dustbinList.push({ zoneNo: list[i]["zone"], type: list[i]["type"], dustbin: list[i]["dustbin"], ward: list[i]["ward"], lat: list[i]["lat"], lng: list[i]["lng"], address: list[i]["address"], pickFrequency: list[i]["pickFrequency"], isDisabled: list[i]["isDisabled"] });
      }
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
    let isDisabled = $(this.ddlStatus).val();
    let pickFrequency = $(this.txtFreq).val();
    let disabledDate = null;
    if (isDisabled == "yes") {
      disabledDate = this.commonService.setTodayDate();
    }
    const data = {
      address: address,
      zone: zone,
      ward: ward,
      lat: lat,
      lng: lng,
      type: type,
      isDisabled: isDisabled,
      pickFrequency: pickFrequency,
      disabledDate: disabledDate,
      createdDate: this.commonService.setTodayDate()
    }
    if (dustbinId == "0") {
      this.addDustbin(data);
    }
    else {
      this.updateDustbin(dustbinId, data);
    }
  }

  addDustbin(data: any) {
    let dustbin = Number(this.dustbinStorageList[this.dustbinStorageList.length - 1]["dustbin"]) + 1;
    this.dustbinService.updateDustbinDetail(dustbin, data, 'add');
    this.dustbinStorageList.push({ address: data.address, dustbin: dustbin.toString(), isApproved: false, isAssigned: "false", isBroken: false, isDisabled: "no", lat: data.lat, lng: data.lng, pickFrequency: data.pickFrequency, type: data.type, ward: data.ward, zone: data.zone });
    localStorage.setItem("dustbin", JSON.stringify(this.dustbinStorageList));
    this.getDustbins();
    this.commonService.setAlertMessage("success", "Dustbin detail added successfully !!!");
  }

  updateDustbin(dustbin: any, data: any) {
    this.dustbinService.updateDustbinDetail(dustbin, data, 'update');
    this.updateLocalStorageDustbin(dustbin, data);
    this.getDustbins();
    this.commonService.setAlertMessage("success", "Dustbin detail updated successfully !!!");
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
      dustbinStorageDetail.isDisabled = data.isDisabled;
    }
    localStorage.setItem("dustbin", JSON.stringify(this.dustbinStorageList));
  }

  openModel(content: any, id: any, type: any) {
    this.modalService.open(content, { size: "lg" });
    let windowHeight = $(window).height();
    let height = 550;
    let width = 400;
    let marginTop = Math.max(0, (windowHeight - height) / 2) + "px";
    $("div .modal-content").parent().css("max-width", "" + width + "px").css("margin-top", marginTop);
    $("div .modal-content").css("height", height + "px").css("width", "" + width + "px");
    $("div .modal-dialog-centered").css("margin-top", "26px");
    $(this.dustbinId).val(id);
    if (type == "update") {
      $("#exampleModalLongTitle").html("Manage Dustbin");
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
          $(this.ddlStatus).val(dustbinDetail.isDisabled);
        }, 100);
      }
    }
    else {
      $("#exampleModalLongTitle").html("Add Dustbin");
      setTimeout(() => {
        $(this.ddlStatus).val('no');
        document.getElementById('txtaddress').removeAttribute('readonly');
      }, 100);
    }
  }

  closeModel() {
    this.modalService.dismissAll();
  }
}
