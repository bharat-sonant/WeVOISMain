import { Component, OnInit } from '@angular/core';
import { CommonService } from "../../services/common/common.service";
import { MarkerMappingService } from "../../services/marker/marker-mapping.service";
import { FirebaseService } from "../../firebase.service";
import { AngularFireStorage } from "angularfire2/storage";

@Component({
  selector: 'app-card-marker-mapping',
  templateUrl: './card-marker-mapping.component.html',
  styleUrls: ['./card-marker-mapping.component.scss']
})
export class CardMarkerMappingComponent implements OnInit {

  constructor(public fs: FirebaseService, private commonService: CommonService, private storage: AngularFireStorage, private markerMapping: MarkerMappingService) { }
  cityName: any;
  db: any;
  todayDate: any;
  public selectedZone: any;
  zoneList: any[];
  markerList: any[];
  ddlZone = "#ddlZone";
  ddlZoneCount = "#ddlZoneCount";
  divLoaderLineMove = "#divLoaderLineMove";
  public totalLineCount: any;
  public movedLineCount: any;
  ngOnInit() {
    this.cityName = localStorage.getItem("cityName");
    this.commonService.chkUserPageAccess(window.location.href, this.cityName);
    this.setDefault();
  }

  setDefault() {
    this.db = this.fs.getDatabaseByCity(this.cityName);
    this.todayDate = this.commonService.setTodayDate();
    this.getZones();
  }

  getZones() {
    this.zoneList = JSON.parse(localStorage.getItem("latest-zones"));
  }


  markersDataPromise: any = null;
  uidMap: any = {};
  notMigratedCount = 0;

  // Cache sirf operation ke shuru me clear hota hai, har write par nahi.
  resetNewPathCache() {
    this.markerMapping.clearLinkCache();
    this.markersDataPromise = null;
    this.uidMap = {};
    this.notMigratedCount = 0;
  }




  setUid(ward: any, line: any, markerNo: any, uid: any) {
    this.uidMap[ward + "|" + line + "|" + markerNo] = uid;
  }

  getUid(ward: any, line: any, markerNo: any) {
    let uid = this.uidMap[ward + "|" + line + "|" + markerNo];
    return uid != null && uid != "" ? uid : null;
  }

  // Line/ward ki list ab MarkerMappingService se aati hai, jo WardWise aur
  // LineWise dono ka union leti hai. Pehle sirf LineWise padha jaata tha aur
  // wo node adhoora hai - un wards ki lines poori khaali dikhti thi.
  getNewPathLineData(wardNo: any, lineNo: any): Promise<any> {
    return this.markerMapping.getLineRecords(this.db, wardNo, lineNo);
  }

  getNewPathWardData(wardNo: any): Promise<any> {
    return this.markerMapping.getWardRecords(this.db, wardNo);
  }

  // Line-level scalars (counts, lastMarkerKey, ApproveStatus) ka new-path base.
  getLineSummaryPath(ward: any, line: any): string {
    return "EntityMarkingData/MarkersMapping/LineSummary/" + ward + "/" + line;
  }

  // Agla safe markerNo: LineSummary ka lastMarkerKey aur us line ki asli mapping keys, dono me se bada.
  getSafeLastKey(zoneTo: any, lineTo: any): Promise<any> {
    return this.markerMapping.getSafeLastKey(this.db, zoneTo, lineTo);
  }

  // Marker ko nayi line/ward par. Data global rehta hai, sirf mapping re-point hoti hai. OriginalToUid yahan NAHI chhuti, warna migration re-run par duplicate uid ban jaayega.
  moveMarkerOnNewPath(uid: any, zoneFrom: any, lineFrom: any, markerNoFrom: any, zoneTo: any, lineTo: any, newMarkerNo: any, data: any, extra: any = null) {
    // Move history: marker kahan se kahan gaya, iska permanent record.
    this.markerMapping.recordMove(this.db, uid, zoneFrom, lineFrom, markerNoFrom, zoneTo, lineTo, newMarkerNo);

    // line kabhi string ("7") ban kar aa sakti hai, jabki marker-data-move ne
    // migration me line NUMBER (7) likhi thi — Number me convert kar ke likhte hain.
    let lineVal = isNaN(Number(lineTo)) ? lineTo : Number(lineTo);

    // Sirf badle hue fields likhte hain, poora record nahi. Old path par record nayi key par banta tha isliye poora likhna padta tha; yahan record apni hi jagah rehta hai.
    let patch: any = {
      line: (isNaN(Number(lineTo)) ? lineTo : Number(lineTo)),
      ward: zoneTo,
      // markerNo record ke andar bhi jaana chahiye - baaki chaaron move page
      // ise likhte hain. Abhi koi page record ka markerNo padhta nahi (sab
      // LineWise ki key se number lete hain), par record aur mapping alag-alag
      // number dikhayein to baad me dhoka hoga.
      markerNo: Number(newMarkerNo) || 0,
      movedFromWard: zoneFrom,
      movedFromLine: lineFrom,
      movedFromMarkerNo: markerNoFrom,
      movedOn: this.commonService.getTodayDateTime()
    };
    if (data["latLng"] != null) { patch["latLng"] = data["latLng"]; }
    if (extra != null) {
      let eKeys = Object.keys(extra);
      for (let e = 0; e < eKeys.length; e++) { patch[eKeys[e]] = extra[eKeys[e]]; }
    }
    // in-memory record bhi sync rakho, caller isi object ko aage use karta hai
    let pKeys = Object.keys(patch);
    for (let k = 0; k < pKeys.length; k++) { data[pKeys[k]] = patch[pKeys[k]]; }
    this.db.object("EntityMarkingData/MarkersData/" + uid).update(patch);

    // LineWise: nayi jagah add, purani jagah se hata do
    this.db.object("EntityMarkingData/MarkersMapping/LineWise/" + zoneTo + "/" + lineTo + "/" + newMarkerNo).set(uid);
    this.db.database.ref("EntityMarkingData/MarkersMapping/LineWise/" + zoneFrom + "/" + lineFrom + "/" + markerNoFrom).set(null);

    // MarkerWise mapping
    this.db.object("EntityMarkingData/MarkersMapping/MarkerWise/" + uid).update({ line: lineVal, ward: zoneTo });

    // WardWise mapping: ward badla to purane ward se hata do
    if (zoneFrom != zoneTo) {
      this.db.database.ref("EntityMarkingData/MarkersMapping/WardWise/" + zoneFrom + "/" + uid).set(null);
    }
    this.db.object("EntityMarkingData/MarkersMapping/WardWise/" + zoneTo + "/" + uid).set(lineVal);

    // Cache saaf SABSE AAKHIR me - pehle karne se beech me aayi koi read
    // purani list dobara cache kar leti.
    this.markerMapping.clearLinkCache();
  }

  mapHouseMarkerData() {
    if ($(this.ddlZoneCount).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Zone !!!");
      return;
    }
    $(this.divLoaderLineMove).show();
    this.resetNewPathCache();
    let zoneNo = $(this.ddlZoneCount).val();
    // OLD PATH (reference ke liye rakha hai):
    // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo;
    // let markerInstance = this.db.object(dbPath).valueChanges().subscribe(
    //   data => {
    //     markerInstance.unsubscribe();
    // NEW PATH: MarkersData + LineWise (same {lineNo: {markerNo: record}} shape)
    this.getNewPathWardData(zoneNo).then(
      (data: any) => {
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            this.totalLineCount = keyArray.length;
            this.getWardLinesMarker(zoneNo, data, keyArray, 0);
            return;
          }
        }
        // Ward me ek bhi migrate hua marker nahi mila. Pehle yahan kuch nahi hota
        // tha aur loader hamesha ke liye chalta reh jaata tha.
        $(this.divLoaderLineMove).hide();
        this.commonService.setAlertMessage("error", "Sorry! No marker data found on new path for this ward.");
      }
    );
  }

  getWardLinesMarker(zoneNo: any, data: any, keyArray: any, index: any) {
    if (index == keyArray.length) {
      $(this.divLoaderLineMove).hide();
      // OLD PATH (reference ke liye rakha hai):
      // this.commonService.setAlertMessage("success", "Data Update Successfully!!!");
      let msg = "Data Update Successfully!!!";
      if (this.notMigratedCount > 0) {
        msg = msg + " (" + this.notMigratedCount + " markers skipped — new path par nahi mile)";
      }
      this.commonService.setAlertMessage("success", msg);
    }
    else {
      let lineNo = keyArray[index];
      let markerData = data[lineNo];
      let markerKeyArray = Object.keys(markerData);
      if (markerKeyArray.length > 0) {
        this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, 0, markerKeyArray);
      }
      else {
        // Khaali line par pehle recursion yahin ruk jaati thi (na aage badhti, na
        // loader hatta). Ab agli line par chale jaate hain.
        index++;
        this.getWardLinesMarker(zoneNo, data, keyArray, index);
      }
    }
  }

  mapData(zoneNo: any, data: any, keyArray: any, index: any, lineNo: any, markerData: any, markerIndex: any, markerKeyArray: any) {
    if (markerIndex == markerKeyArray.length) {
      index++;
      this.getWardLinesMarker(zoneNo, data, keyArray, index);
    }
    else {
      let markerNo = markerKeyArray[markerIndex];
      if (markerData[markerNo]["cardNumber"] != null) {

        let cardNo = markerData[markerNo]["cardNumber"];
        // NEW PATH: is marker ka uid — ward load ke waqt uidMap me bhar chuka hai,
        let uid = this.getUid(zoneNo, lineNo, markerNo);
        if (uid == null) {
          // marker new path par nahi hai -> is marker par kuch nahi karna
          this.notMigratedCount++;
          markerIndex++;
          this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
          return;
        }
        let dbPath = "CardWardMapping/" + cardNo;
        let cardWardMappingInstance = this.db.object(dbPath).valueChanges().subscribe(
          mappingData => {
            cardWardMappingInstance.unsubscribe();
            if (mappingData != null) {
              let zoneTo = mappingData["ward"];
              let lineTo = mappingData["line"];
              this.movedLineCount = lineNo;
              let dbPath = "Houses/" + zoneTo + "/" + lineTo + "/" + cardNo;
              let houseInstance = this.db.object(dbPath).valueChanges().subscribe(
                houseData => {
                  houseInstance.unsubscribe();
                  if (houseData != null) {
                    let latLng = houseData["latLng"].toString().replace("(", "").replace(")", "");
                    markerData[markerNo]["latLng"] = latLng;
                    markerData[markerNo]["alreadyInstalled"] = null;
                    if (zoneNo == zoneTo && lineNo == lineTo) {
                     // console.log(markerData[markerNo]);
                      // OLD PATH (reference ke liye rakha hai):
                      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                      // this.db.object(dbPath).update(markerData[markerNo]);
                      // NEW PATH: marker apni hi line par hai. Sirf wahi do fields likhte hain jo upar badle hain, poora record nahi - warna beech me hua koi approve/edit purane snapshot se overwrite ho jaata.
                      this.db.object("EntityMarkingData/MarkersData/" + uid).update({ latLng: latLng, alreadyInstalled: null });
                      this.markerMapping.clearLinkCache();
                      markerIndex++;
                      this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
                    }
                    else {
                      let lastMarkerKey = 1;
                      // OLD PATH (reference ke liye rakha hai):
                      // let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/lastMarkerKey";
                      // let lastMarkerKeyInstance = this.db.object(dbPath).valueChanges().subscribe(
                      //   lastMarkerKeyData => {
                      //     lastMarkerKeyInstance.unsubscribe();
                      //     if (lastMarkerKeyData != null) {
                      //       lastMarkerKey = Number(lastMarkerKeyData) + 1;
                      //     }
                      //     let oldImageName = markerData[markerNo]["image"];
                      //     markerData[markerNo]["image"] = lastMarkerKey + ".jpg";
                      //     let newImageName = lastMarkerKey + ".jpg";
                        //  console.log(markerData[markerNo]);
                      //     const pathOld = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneNo + "/" + lineNo + "/" + oldImageName;
                      //     const ref = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathOld);
                      //     ref.getDownloadURL()
                      //       .then((url) => {
                      //         var xhr = new XMLHttpRequest();
                      //         xhr.responseType = 'blob';
                      //         xhr.onload = (event) => {
                      //           var blob = xhr.response;
                      //           const pathNew = this.commonService.getFireStoreCity() + "/MarkingSurveyImages/" + zoneTo + "/" + lineTo + "/" + newImageName;
                      //           const ref1 = this.storage.storage.app.storage(this.commonService.fireStoragePath).ref(pathNew);
                      //           ref1.put(blob).then((promise) => {
                                  // ref.delete();
                      //           }
                      //           ).catch((error) => {
                      //           });
                      //         };
                      //         xhr.open('GET', url);
                      //         xhr.send();
                      //       })
                      //       .catch((error) => {
                      //       });
                      //     let dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo + "/" + lastMarkerKey;
                      //     this.db.object(dbPath).update(markerData[markerNo]);
                      //     dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo;
                      //     this.db.object(dbPath).remove();
                      //     dbPath = "EntityMarkingData/MarkedHouses/" + zoneTo + "/" + lineTo;
                      // NEW PATH: agla markerNo = LineSummary ka lastMarkerKey aur line ki asli mapping keys, dono me se bada.
                      this.getSafeLastKey(zoneTo, lineTo).then(
                        (safeLastKey: any) => {
                          lastMarkerKey = Number(safeLastKey) + 1;
                          // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.

                          // NEW PATH: mapping re-point karo (data global hi rehta hai).
                          this.moveMarkerOnNewPath(uid, zoneNo, lineNo, markerNo, zoneTo, lineTo, lastMarkerKey, markerData[markerNo], { alreadyInstalled: null });

                          // NEW PATH: LineSummary
                          let dbPath = this.getLineSummaryPath(zoneTo, lineTo);
                          this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
                          markerIndex++;
                          this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);

                        });
                    }
                  }
                  else {
                  //  console.log("Card house not found => " + cardNo);
                    // OLD PATH (reference ke liye rakha hai):
                    // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/cardNumber";
                    // NEW PATH: MarkersData/{uid}/cardNumber
                    dbPath = "EntityMarkingData/MarkersData/" + uid + "/cardNumber";
                    this.db.object(dbPath).remove();
                    markerIndex++;
                    this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
                  }
                });
            }
            else {
             // console.log("Card not mapped => " + cardNo);
              // OLD PATH (reference ke liye rakha hai):
              // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/cardNumber";
              // NEW PATH: MarkersData/{uid}/cardNumber
              dbPath = "EntityMarkingData/MarkersData/" + uid + "/cardNumber";
              this.db.object(dbPath).remove();
              markerIndex++;
              this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
            }
          });
      }
      else {
        markerIndex++;
        this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
      }
    }
  }

  updateMarkerLocation() {
    if ($(this.ddlZone).val() == "0") {
      this.commonService.setAlertMessage("error", "Please select Zone !!!");
      return;
    }
    let zoneNo = $(this.ddlZone).val();
    this.resetNewPathCache();
    this.commonService.getWardLine(zoneNo, this.todayDate).then((linesData: any) => {
      let totalLines = JSON.parse(linesData)["totalLines"];
      let dbPath = "Houses/" + zoneNo;
      let houseInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
        houseInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            for (let i = 0; i < keyArray.length; i++) {
              let lineNo = keyArray[i];
              let houseData = data[lineNo];
              let cardKeyArray = Object.keys(houseData);
              if (cardKeyArray.length > 0) {
                for (let j = 0; j < cardKeyArray.length; j++) {
                  let cardNo = cardKeyArray[j];
                  let latLng = houseData[cardNo]["latLng"];
                  latLng = latLng.toString().replace('(', '').replace(')', '');
                  this.setMarkerLocation(zoneNo, cardNo, latLng, totalLines);
                }
              }

            }
          }
        }
      });
    });
  }

  setMarkerLocation(zoneNo: any, cardNo: any, latLng: any, totalLines: any) {
    // OLD PATH (reference ke liye rakha hai) - har line ka node alag padhna
    // padta tha kyunki marker record wahin line ke neeche rehte the:
    // for (let i = 1; i <= totalLines; i++) {
    //   let dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + i;
    //   let markerInstance = this.db.object(dbPath).valueChanges().subscribe(data => {
    //     markerInstance.unsubscribe();
    //
    // NEW PATH: poora ward EK query me (getWardRecords -> orderByChild("ward")).
    //
    // Line-by-line padhne ka ab koi faayda nahi raha, ulta nuksan tha: naye
    // structure me ek line ka data mapping ke uid se ban'ta hai, yaani har line
    // ke liye us line ke har marker ka alag read. 200 line x 40 marker = 8000
    // reads, jabki wahi 8000 record ek hi ward query me aa jaate hain.
    //
    // Yahan card poore ward me kahin bhi ho sakta hai, isliye ward hi sahi
    // daayra hai. totalLines ab sirf itna batata hai ki kahan tak dekhna hai.
    this.getNewPathWardData(zoneNo).then((wardData: any) => {
      if (wardData == null) {
        return;
      }
      let updated = false;
      for (let i = 1; i <= totalLines; i++) {
        let data = wardData[i] != null ? wardData[i] : wardData[String(i)];
        if (data == null) {
          continue;
        }
        let keyArray = Object.keys(data);
        for (let j = 0; j < keyArray.length; j++) {
          let markerNo = keyArray[j];
          if (data[markerNo] == null || typeof data[markerNo] != "object") {
            continue;
          }
          if (data[markerNo]["cardNumber"] == null || data[markerNo]["cardNumber"] != cardNo) {
            continue;
          }
          // OLD PATH (reference ke liye rakha hai):
          // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + i + "/" + markerNo;
          // this.db.object(dbPath).update({ latLng: latLng, preLatLng: data[markerNo]["latLng"] });
          // NEW PATH: MarkersData/{uid}
          let uid = this.getUid(zoneNo, i, markerNo);
          if (uid == null) {
            continue; // marker new path par nahi hai
          }
          this.db.object("EntityMarkingData/MarkersData/" + uid).update({ latLng: latLng, preLatLng: data[markerNo]["latLng"] });
          updated = true;
        }
      }
      // Cache clear loop ke BAAD, ek baar. Pehle ye har matching marker par
      // andar chalta tha - usi ward ka data jo abhi utara tha wo turant phenk
      // deta tha, aur agla card phir se poori query maarta tha.
      if (updated) {
        this.markerMapping.clearLinkCache();
      }
    });
  }
}
