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


  // DEAD CODE (hataya nahi, comment kiya hai): declare aur reset hota tha par
  // use kahin nahi hota tha.
  // markersDataPromise: any = null;

  // { "ward|line|markerNo": uid } - poore ward ka lookup, operation ke shuru me
  // ek baar bhar liya jaata hai (loadWardUids).
  uidMap: any = {};
  notMigratedCount = 0;

  // Cache sirf operation ke shuru me clear hota hai, har write par nahi.
  resetNewPathCache() {
    this.markerMapping.clearLinkCache();
    // DEAD CODE (hataya nahi, comment kiya hai):
    // this.markersDataPromise = null;
    this.uidMap = {};
    this.notMigratedCount = 0;
  }

  // Ward ki poori mapping se uidMap bhar do.
  //
  // Ye pehle likha hi nahi gaya tha: setUid() maujood tha par use koi bulata
  // nahi tha, isliye uidMap hamesha khaali rehta aur getUid() hamesha null
  // deta. Nateeja - is page ke DONO operation har marker ko "new path par nahi
  // mila" maan kar chup-chaap skip kar dete the, aur upar se "Data Update
  // Successfully" ka message bhi aa jaata tha.
  //
  // Extra DB read zero: getWardLinks() wahi cache hai jise getWardRecords()
  // pehle se use karta hai.
  loadWardUids(wardNo: any): Promise<any> {
    return this.markerMapping.getWardLinks(this.db, wardNo).then((wardLinks: any) => {
      this.uidMap = {};
      if (wardLinks == null || typeof wardLinks != "object") {
        return null;
      }
      let lineArray = Object.keys(wardLinks);
      for (let i = 0; i < lineArray.length; i++) {
        let links = wardLinks[lineArray[i]];
        if (links == null || typeof links != "object") {
          continue;
        }
        let keyArray = Object.keys(links);
        for (let j = 0; j < keyArray.length; j++) {
          this.setUid(wardNo, lineArray[i], keyArray[j], links[keyArray[j]]);
        }
      }
      return null;
    });
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
  // AB KOI NAHI BULATA (hataya nahi, comment kiya hai) - service ka
  // getSafeLastKey() bhi retire ho chuka hai (per-line counter khatam).
  // getSafeLastKey(zoneTo: any, lineTo: any): Promise<any> {
  //   return this.markerMapping.getSafeLastKey(this.db, zoneTo, lineTo);
  // }

  // Marker ko nayi line/ward par. Data global rehta hai, sirf mapping re-point hoti hai. OriginalToUid yahan NAHI chhuti, warna migration re-run par duplicate uid ban jaayega.
  //
  // PEHLE do param aur the (purana signature):
  //   moveMarkerOnNewPath(uid, zoneFrom, lineFrom, markerNoFrom, zoneTo, lineTo, newMarkerNo, data, extra)
  // Move ab renumber karta hi nahi, isliye markerNoFrom/newMarkerNo dono hat gaye.
  moveMarkerOnNewPath(uid: any, zoneFrom: any, lineFrom: any, zoneTo: any, lineTo: any, data: any, extra: any = null) {
    // Move history: marker kahan se kahan gaya, iska permanent record.
    this.markerMapping.recordMove(this.db, uid, zoneFrom, lineFrom, zoneTo, lineTo);

    // line kabhi string ("7") ban kar aa sakti hai, jabki marker-data-move ne
    // migration me line NUMBER (7) likhi thi — Number me convert kar ke likhte hain.
    let lineVal = isNaN(Number(lineTo)) ? lineTo : Number(lineTo);

    // Sirf badle hue fields likhte hain, poora record nahi. Old path par record nayi key par banta tha isliye poora likhna padta tha; yahan record apni hi jagah rehta hai.
    let patch: any = {
      line: (isNaN(Number(lineTo)) ? lineTo : Number(lineTo)),
      ward: zoneTo,
      // PEHLE ye do field bhi jaate the (hataye nahi, comment kiye hain):
      //   markerNo: Number(newMarkerNo) || 0,
      //   movedFromMarkerNo: markerNoFrom,
      // Marker ab renumber hota hi nahi.
      movedFromWard: zoneFrom,
      movedFromLine: lineFrom,
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
    //
    // PEHLE YE THA (hataya nahi, comment kiya hai) - LineWise ko
    // { markerNo: uid } maana jaata tha:
    //
    // this.db.object("EntityMarkingData/MarkersMapping/LineWise/" + zoneTo + "/" + lineTo + "/" + newMarkerNo).set(uid);
    //
    // Naye structure me LineWise uid ka SET hai: { "MK1": true }. Key hi uid hai
    // aur value sirf maujoodgi ka nishaan - markerNo record ke andar upar patch
    // me chala hi gaya hai.
    this.db.object("EntityMarkingData/MarkersMapping/LineWise/" + zoneTo + "/" + lineTo + "/" + uid).set(true);
    // BEECH ME purane roop wali entry bhi hatayi jaati thi:
    //   ... + "/" + markerNoFrom).set(null);
    // DB me ab koi number wali key hai hi nahi, isliye wo hata diya gaya.
    this.db.database.ref("EntityMarkingData/MarkersMapping/LineWise/" + zoneFrom + "/" + lineFrom + "/" + uid).set(null);

    // MarkerWise mapping
    this.db.object("EntityMarkingData/MarkersMapping/MarkerWise/" + uid).update({ line: lineVal, ward: zoneTo });

    // WardWise mapping: ward badla to purane ward se hata do
    if (zoneFrom != zoneTo) {
      this.db.database.ref("EntityMarkingData/MarkersMapping/WardWise/" + zoneFrom + "/" + uid).set(null);
    }
    this.db.object("EntityMarkingData/MarkersMapping/WardWise/" + zoneTo + "/" + uid).set(lineVal);

    // Cache saaf SABSE AAKHIR me - pehle karne se beech me aayi koi read
    // purani list dobara cache kar leti.
    //
    // Yahan record bhi badla hai aur mapping bhi, isliye dono. Record ka patch
    // pata hai, to use cache me laga dete hain (phenkte nahi) - ek bhi extra
    // read nahi. Mapping sach me badli hai, wo clearLinks() se jayegi.
    //
    // Pehle clearLinkCache() tha jo poore ward ke saare records bhi phenk deta
    // tha - ek marker ke move par 2000 record dobara padhne padte the.
    this.markerMapping.applyPatch(uid, patch);
    this.markerMapping.clearLinks();
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
    //
    // uidMap pehle bhar lete hain - neeche har marker par uski zaroorat padti
    // hai aur wo mapping se hi milta hai (record ke andar uid hota nahi).
    this.loadWardUids(zoneNo).then(() => {
      return this.getNewPathWardData(zoneNo);
    }).then(
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
                      // Sirf ye ek record badla - mapping ko haath nahi laga.
                      // Patch cache me bhi laga do, phenkna nahi.
                      this.markerMapping.applyPatch(uid, { latLng: latLng, alreadyInstalled: null });
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
                      // PEHLE YE THA (hataya nahi, comment kiya hai) - destination
                      // line ka agla markerNo nikaal kar marker ko wo number diya
                      // jaata tha aur LineSummary ka counter aage badhaya jaata tha:
                      //
                      // this.getSafeLastKey(zoneTo, lineTo).then((safeLastKey: any) => {
                      //   lastMarkerKey = Number(safeLastKey) + 1;
                      //   this.moveMarkerOnNewPath(uid, zoneNo, lineNo, markerNo, zoneTo, lineTo, lastMarkerKey, markerData[markerNo], { alreadyInstalled: null });
                      //   let dbPath = this.getLineSummaryPath(zoneTo, lineTo);
                      //   this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
                      //   ...
                      // });
                      //
                      // Number allot hote hi nahi ab - marker apne uid ke saath
                      // jaata hai - isliye wo poora read+write hat gaya.
                      // NEW PATH: image global hai (AllMarkerImages/{imgRef}) - move par copy/rename ki zaroorat nahi.

                      // NEW PATH: mapping re-point karo (data global hi rehta hai).
                      this.moveMarkerOnNewPath(uid, zoneNo, lineNo, zoneTo, lineTo, markerData[markerNo], { alreadyInstalled: null });
                      markerIndex++;
                      this.mapData(zoneNo, data, keyArray, index, lineNo, markerData, markerIndex, markerKeyArray);
                    }
                  }
                  else {
                  //  console.log("Card house not found => " + cardNo);
                    // OLD PATH (reference ke liye rakha hai):
                    // dbPath = "EntityMarkingData/MarkedHouses/" + zoneNo + "/" + lineNo + "/" + markerNo + "/cardNumber";
                    // NEW PATH: MarkersData/{uid}/cardNumber
                    dbPath = "EntityMarkingData/MarkersData/" + uid + "/cardNumber";
                    // cardNumber hat raha hai - cache me bhi hata do, warna
                    // wahan purana cardNumber baitha reh jaata hai.
                    this.markerMapping.applyPatch(uid, { cardNumber: null });
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
              // cardNumber hat raha hai - cache me bhi hata do.
              this.markerMapping.applyPatch(uid, { cardNumber: null });
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
    // uidMap pehle bhar lete hain - setMarkerLocation() ko har marker ka uid
    // chahiye hota hai aur wo sirf mapping me hota hai, record ke andar nahi.
    this.loadWardUids(zoneNo).then(() => {
      return this.commonService.getWardLine(zoneNo, this.todayDate);
    }).then((linesData: any) => {
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
    // NEW PATH: poora ward ek baar (getWardRecords), line-by-line nahi.
    //
    // Line-by-line padhne ka ab koi faayda nahi raha: naye structure me ek line
    // ka data mapping ke uid se banta hai, yaani har line ke liye us line ke har
    // marker ka alag read - aur wahi marker doosri line ke chakkar me dobara
    // nahi aate, to har line par nayi reads. Ward-wise padhne par wo saare
    // record ek hi baar aate hain aur cache me baithe rehte hain.
    //
    // (Service me ek "poora ward EK query me" wala raasta bhi hai -
    // orderByChild("ward") - par wo `wardQueryEnabled = false` se OFF hai,
    // kyunki bina DB index ke wo query chupchaap poora MarkersData utaar leti
    // hai. Yaani abhi bhi N alag read hi jaati hain, bas ward me ek baar.)
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
          // Sirf is ek record ki cache, aur wo bhi patch laga kar - phenkna
          // nahi. Pehle poori cache loop ke baad ek baar udayi jaati thi (aur
          // usse pehle har marker par - jo aur bura tha), kyunki
          // clearLinkCache() ward ke saare records bhi phenk deta hai.
          this.markerMapping.applyPatch(uid, { latLng: latLng, preLatLng: data[markerNo]["latLng"] });
          updated = true;
        }
      }
      // PEHLE YE THA (hataya nahi, comment kiya hai) - cache clear loop ke BAAD,
      // ek baar. Ab zaroorat nahi: upar har marker par applyPatch() cache ko
      // wahin theek kar deta hai, isliye kuch phenkna hi nahi padta.
      // if (updated) {
      //   this.markerMapping.clearLinkCache();
      // }
    });
  }
}
