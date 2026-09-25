import { Component, OnInit } from '@angular/core';
import { FirebaseService } from "../../firebase.service";
import { CommonService } from '../../services/common/common.service';

@Component({
  selector: 'app-add-marker-against-cards',
  templateUrl: './add-marker-against-cards.component.html',
  styleUrls: ['./add-marker-against-cards.component.scss']
})
export class AddMarkerAgainstCardsComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService) { }
  db: any;
  cityName: any;
  selectedZone: any;
  zoneList: any[];
  markerCardList: any[];
  markerAddList: any[];
  divLoader = "#divLoader";

  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.selectedZone = "0";
    this.zoneList = [];
    this.getZones();

  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
    this.zoneList[0]["zoneName"] = "--Select Zone--";
  }

  getMarkerData() {
    this.markerCardList = [];
    this.markerAddList = [];
    $(this.divLoader).show();
    let dbPath = "EntityMarkingData/MarkedHouses/";
    let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
      data => {
        markerInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let zoneNo = keyArray[i];
              let lineData = data[zoneNo];
              let lineKeyArray = Object.keys(lineData);
              for (let j = 0; j < lineKeyArray.length; j++) {
                let lineNo = lineKeyArray[j];
                let markerData = lineData[lineNo];
                let markerKeyArray = Object.keys(markerData);
                for (let k = 0; k < markerKeyArray.length; k++) {
                  let markerNo = markerKeyArray[k];
                  if (parseInt(markerNo)) {
                    if (markerData[markerNo]["cardNumber"] != null) {
                      this.markerCardList.push({ cardNo: markerData[markerNo]["cardNumber"] });
                    }
                  }
                }
              }
            }
            this.getHouseData(1);
          }
        }
        else {
          $(this.divLoader).hide();
        }
      }
    );
  }

  getHouseData(index: any) {
    if (index == this.zoneList.length) {
      if (this.markerAddList.length > 0) {
        this.createMarker(0);
      }
      else {
        $(this.divLoader).hide();
        this.commonService.setAlertMessage("error", "Sorry no card available !!!");
      }
    }
    else {
      let zoneNo = this.zoneList[index]["zoneNo"];
      let dbPath = "Houses/" + zoneNo;
      let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
        houseData => {
          houseInstance.unsubscribe();
          if (houseData != null) {
            let keyArray = Object.keys(houseData);
            if (keyArray.length > 0) {
              let wardLastLineNo = keyArray[keyArray.length - 1];
              for (let i = 1; i <= parseInt(wardLastLineNo); i++) {
                let lineNo = i;
                let cardObj = houseData[lineNo];
                if (cardObj != undefined) {
                  let cardKeyArray = Object.keys(cardObj);
                  for (let j = 0; j < cardKeyArray.length; j++) {
                    let cardNo = cardKeyArray[j];
                    let detail = this.markerCardList.find(item => item.cardNo == cardNo);
                    if (detail == undefined) {
                      let cardDetail = cardObj[cardNo];
                      this.markerAddList.push({ zoneNo: zoneNo, lineNo: lineNo, cardNo: cardNo, cardDetail: cardDetail });
                    }
                  }
                }
              }
            }
            index++;
            this.getHouseData(index);
          }
          else {
            index++;
            this.getHouseData(index);
          }
        });
    }
  }

  createMarker(index: any) {
    if (index == this.markerAddList.length) {
      $(this.divLoader).hide();
      this.commonService.setAlertMessage("success", "Marker created successfully !!!");
    }
    else {
      let zoneNo = this.markerAddList[index]["zoneNo"];
      let lineNo = this.markerAddList[index]["lineNo"];
      let cardNo = this.markerAddList[index]["cardNo"];
      let cardDetail = this.markerAddList[index]["cardDetail"];
      let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/lastMarkerKey";
      let lastMarkerInstance = this.db.object(dbPath).valueChanges().subscribe(
        lastMarkerKey => {
          lastMarkerInstance.unsubscribe();
          let lastKey = 1;
          if (lastMarkerKey != null) {
            lastKey = Number(lastMarkerKey) + 1;
          }

          let address = "";
          let date = "";
          let houseType = "";
          let isApprove = "1";
          let latLng = "";
          let userId = "-1";
          if (cardDetail["address"] != null) {
            address = cardDetail["address"];
          }
          if (cardDetail["createdDate"] != null) {
            date = cardDetail["createdDate"];
          }
          if (cardDetail["houseType"] != null) {
            houseType = cardDetail["houseType"];
          }
          if (cardDetail["latLng"] != null) {
            latLng = cardDetail["latLng"].toString().replace('(', "").replace(')', "");
          }
          const data = {
            address: address,
            date: date,
            houseType: houseType,
            isApprove: isApprove,
            latLng: latLng,
            userId: userId,
            cardNumber: cardNo
          }
          dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + lastKey;
          this.db.object(dbPath).update(data);
          dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo;
          this.db.object(dbPath).update({ lastMarkerKey: lastKey });

          index++;
          setTimeout(() => {
            this.createMarker(index);
          }, 200);

        }
      );
    }
  }
}
