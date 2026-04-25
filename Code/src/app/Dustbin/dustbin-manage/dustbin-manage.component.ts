import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { DustbinService } from "../../services/dustbin/dustbin.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FirebaseService } from "../../firebase.service";

@Component({
  selector: 'app-dustbin-manage',
  templateUrl: './dustbin-manage.component.html',
  styleUrls: ['./dustbin-manage.component.scss']
})

export class DustbinManageComponent implements OnInit {

  constructor(public fs: FirebaseService, private dustbinService: DustbinService, private commonService: CommonService, private modalService: NgbModal) { }
  db: any;
  cityName: any;
  selectedZone: any;
  selectedStatus: any;
  zoneList: any[] = [];
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
  lastDustbinId: any;

  allDustbinList: any[] = [];
  dustbinList: any[] = [];
  dustbinFilterList: any[] = [];
  userList: any[] = [];



  dustbinSummary: dustbinSummary = {
    totalDustbin: 0,
    wardDustbin: 0,
    disableDustbin: 0,
    enableDustbin: 0
  }

  ngOnInit() {
    this.lastDustbinId = 0;
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, localStorage.getItem("cityName"));
    this.commonService.savePageLoadHistory("Dustbin-Management", "Manage-Dustbin", localStorage.getItem("userID"));
    this.userList = JSON.parse(localStorage.getItem("webPortalUserList"));
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
        this.selectedStatus = "enabled";
        this.getDustbins();
      }
    });
  }

  changeZoneSelection(filterVal: any) {
    this.selectedZone = filterVal;
    this.filterDustbin();
  }

  changeStatusSelection(filterVal: any) {
    this.selectedStatus = filterVal;
    this.filterDustbin();
  }

  filterDustbin() {
    this.dustbinFilterList = [];
    let list = this.dustbinList.filter(item => item.zone.toString().trim() == this.selectedZone.toString().trim());
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
        let detail = this.userList.find(item => item.userId == list[i]["disabledBy"]);
        if (detail != undefined) {
          disabledByName = detail.name;
        }

      }
      this.dustbinFilterList.push({ zoneNo: list[i]["zone"], type: list[i]["type"], dustbin: list[i]["dustbin"], ward: list[i]["ward"], lat: list[i]["lat"], lng: list[i]["lng"], address: list[i]["address"], pickFrequency: list[i]["pickFrequency"], isDisabled: list[i]["isDisabled"], disabledBy: list[i]["disabledBy"], disabledByName: disabledByName });
    }
  }

  getDustbins() {
    this.dustbinList = [];
    this.allDustbinList = [];
    let list = [];
    let dbPath = "DustbinData/DustbinDetails";
    let dustbinInstance = this.db.object(dbPath).valueChanges().subscribe((dustbin) => {
      dustbinInstance.unsubscribe();
      if (dustbin != null) {
        let keyArray = Object.keys(dustbin);
        for (let i = 0; i < keyArray.length; i++) {
          let dustbinId = keyArray[i];
          if (dustbin[dustbinId]["lat"] != null) {
            let pickFrequency = 0;
            let isDisabled = "no";
            let disabledBy = "";
            let isBroken = false;
            let disabledDate = "";
            if (dustbin[dustbinId]["pickFrequency"] != null) {
              pickFrequency = Number(dustbin[dustbinId]["pickFrequency"]);
            }
            if (dustbin[dustbinId]["isDisabled"] != null) {
              isDisabled = dustbin[dustbinId]["isDisabled"];
            }
            if (dustbin[dustbinId]["isBroken"] != null) {
              isBroken = dustbin[dustbinId]["isBroken"];
            }
            if (dustbin[dustbinId]["disabledBy"] != null) {
              disabledBy = dustbin[dustbinId]["disabledBy"];
            }
            if (dustbin[dustbinId]["disabledDate"] != null) {
              disabledDate = dustbin[dustbinId]["disabledDate"];
            }
            this.allDustbinList.push({
              zone: dustbin[dustbinId]["zone"],
              dustbin: dustbinId,
              address: dustbin[dustbinId]["address"],
              type: dustbin[dustbinId]["type"],
              pickFrequency: pickFrequency,
              lat: dustbin[dustbinId]["lat"],
              lng: dustbin[dustbinId]["lng"],
              isAssigned: dustbin[dustbinId]["isAssigned"],
              spelledRight: dustbin[dustbinId]["spelledRight"],
              ward: dustbin[dustbinId]["ward"],
              isDisabled: isDisabled,
              isBroken: isBroken,
              disabledBy: disabledBy,
              disabledDate: disabledDate
            });

            if (dustbin[dustbinId]["dustbinType"] != null) {
              if (dustbin[dustbinId]["dustbinType"] != "Open Depot") {
                this.dustbinList.push({
                  zone: dustbin[dustbinId]["zone"],
                  dustbin: dustbinId,
                  address: dustbin[dustbinId]["address"],
                  type: dustbin[dustbinId]["type"],
                  pickFrequency: pickFrequency,
                  lat: dustbin[dustbinId]["lat"],
                  lng: dustbin[dustbinId]["lng"],
                  isAssigned: dustbin[dustbinId]["isAssigned"],
                  spelledRight: dustbin[dustbinId]["spelledRight"],
                  ward: dustbin[dustbinId]["ward"],
                  isDisabled: isDisabled,
                  isBroken: isBroken,
                  disabledBy: disabledBy,
                  disabledDate: disabledDate
                });
              }
            }
            else {
              this.dustbinList.push({
                zone: dustbin[dustbinId]["zone"],
                dustbin: dustbinId,
                address: dustbin[dustbinId]["address"],
                type: dustbin[dustbinId]["type"],
                pickFrequency: pickFrequency,
                lat: dustbin[dustbinId]["lat"],
                lng: dustbin[dustbinId]["lng"],
                isAssigned: dustbin[dustbinId]["isAssigned"],
                spelledRight: dustbin[dustbinId]["spelledRight"],
                ward: dustbin[dustbinId]["ward"],
                isDisabled: isDisabled,
                isBroken: isBroken,
                disabledBy: disabledBy,
                disabledDate: disabledDate
              });
            }
          }
        }
        list = this.dustbinList.filter(item => item.zone.toString().trim() == this.selectedZone.toString().trim());
        this.dustbinSummary.totalDustbin = this.dustbinList.filter(item => item.isDisabled != "yes").length;
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
            let detail = this.userList.find(item => item.userId == list[i]["disabledBy"]);
            if (detail != undefined) {
              disabledByName = detail.name;
            }

          }
          this.dustbinFilterList.push({ zoneNo: list[i]["zone"], type: list[i]["type"], dustbin: list[i]["dustbin"], ward: list[i]["ward"], lat: list[i]["lat"], lng: list[i]["lng"], address: list[i]["address"], pickFrequency: list[i]["pickFrequency"], isDisabled: list[i]["isDisabled"], disabledBy: list[i]["disabledBy"], disabledByName: disabledByName });
        }

      }
    });
  }


  exportToExcel() {
    let exportList = this.commonService.transformNumeric(this.dustbinList, "zone");
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
      let fileName = this.commonService.getFireStoreCity() + "-Dustbins.xlsx";
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
      dustbinType: "dustbin"
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
    let dbPath = "DustbinData/DustbinDetails";
    let dustbinInstance = this.db.object(dbPath).valueChanges().subscribe((dustbin) => {
      dustbinInstance.unsubscribe();
      if (dustbin != null) {
        let keyArray = Object.keys(dustbin);
        if (keyArray.length > 0) {
          dustbin = Number(keyArray[keyArray.length - 1]) + 1;
        }
      }
      this.dustbinService.updateDustbinDetail(dustbin, data, 'add');
      data.isDisabled = "no";
      data.disabledBy = "";
      data.isBroken = false;
      data.disabledDate = "";
      this.dustbinList.push(data);
      this.allDustbinList.push(data);
      this.updateLocalStorageDustbin();
      this.filterDustbin();
      this.commonService.setAlertMessage("success", "Dustbin detail added successfully !!!");
      this.closeModel();
    });
  }

  updateDustbin(dustbin: any, data: any) {
    this.dustbinService.updateDustbinDetail(dustbin, data, 'update');
    let detail = this.allDustbinList.find(item => item.dustbin == dustbin);
    if (detail != undefined) {
      detail.zone = data.zone;
      detail.type = data.type;
      detail.ward = data.ward;
      detail.lat = data.lat;
      detail.lng = data.lng;
      detail.address = data.address;
      detail.pickFrequency = data.pickFrequency;
      detail.dustbinType = "dustbin";
    }
    detail = this.dustbinList.find(item => item.dustbin == dustbin);
    if (detail != undefined) {
      detail.zone = data.zone;
      detail.type = data.type;
      detail.ward = data.ward;
      detail.lat = data.lat;
      detail.lng = data.lng;
      detail.address = data.address;
      detail.pickFrequency = data.pickFrequency;
      detail.dustbinType = "dustbin";
    }
    this.updateLocalStorageDustbin();
    this.filterDustbin();
    this.closeModel();
    $(this.dustbinId).val("0");
    this.commonService.setAlertMessage("success", "Dustbin detail updated successfully !!!");
  }

  updateDustbinStatus(dustbin: any, status: any) {
    let disabledBy = "";
    if (status == "yes") {
      disabledBy = localStorage.getItem("userID");
    }
    this.dustbinService.updateDustbinStatus(dustbin, status, disabledBy);
    let detail = this.allDustbinList.find(item => item.dustbin == dustbin);
    if (detail != undefined) {
      detail.isDisabled = status;
      if (status == "yes") {
        detail.disabledBy = localStorage.getItem("userID");
      }
      else {
        detail.disabledBy = "";
      }
    }
    detail = this.dustbinList.find(item => item.dustbin == dustbin);
    if (detail != undefined) {
      detail.isDisabled = status;
      if (status == "yes") {
        detail.disabledBy = localStorage.getItem("userID");
      }
      else {
        detail.disabledBy = "";
      }
    }
    this.updateLocalStorageDustbin();
    this.filterDustbin();
    this.commonService.setAlertMessage("susscee", "Dustbin staus updated !!!");
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

  updateLocalStorageDustbin() {
    localStorage.setItem("dustbin", JSON.stringify(this.dustbinList));
    localStorage.setItem("allDustbin", JSON.stringify(this.allDustbinList));
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
    if (type == "update") {
      $(this.dustbinId).val(id);
      $("#exampleModalLongTitle").html("Manage Dustbin");
      let dustbinDetail = this.dustbinList.find((item) => item.dustbin == id);
      if (dustbinDetail != undefined) {
        setTimeout(() => {
          $(this.txtaddress).val(dustbinDetail.address);
          $(this.ddlZoneUpdate).val(dustbinDetail.zone);
          $(this.txtWard).val(dustbinDetail.ward);
          $(this.txtLat).val(dustbinDetail.lat);
          $(this.txtLng).val(dustbinDetail.lng);
          $(this.txtFreq).val(dustbinDetail.pickFrequency);
          $(this.ddlDustbinType).val(dustbinDetail.type);
        }, 100);
      }
    }
    else {
      $(this.dustbinId).val("0");
      $("#exampleModalLongTitle").html("Add Dustbin");
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
