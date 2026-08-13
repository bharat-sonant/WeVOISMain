import { Injectable } from "@angular/core";
import { CommonService } from "../common/common.service";

// Naya marker banate waqt saara mapping ek hi jagah se likha jaata hai, warna
// har page apna adhoora mapping likhta hai aur marker portal par dikhna band
// ho jaata hai.
//
//   MarkersData/{uid}                              = poora record + ward + line + imgRef
//   MarkersMapping/MarkerWise/{uid}                = { ward, line }
//   MarkersMapping/WardWise/{ward}/{uid}           = line
//   MarkersMapping/LineWise/{ward}/{line}/{markerNo} = uid
//   MarkersMapping/lastMarkerKey                   = global M counter
//   MarkersMapping/LineSummary/{ward}/{line}/lastMarkerKey = line ka aakhri markerNo
//   MarkerMovementData/MoveHistory/{uid}/{pushKey} = har move ka permanent record
//
// Marker ki asli pehchaan uid (M1, M2...) hai. markerNo sirf line par uska
// serial number hai - wahi portal aur app screen par dikhate hain, aur wo
// LineWise ki key me hi rakha hota hai (record ke andar nahi).
//
// LineWise ke bina marker DB me to ban jaata hai par portal par dikhta nahi -
// portal ke 14 page aur app dono line ki list isi se banate hain. Isliye ise
// likhna optional nahi hai.
//
// Likhne ka order hamesha: pehle DATA, phir MAPPING. Beech me kuch fail ho to
// data to bach jaata hai; ulta hone par mapping ek aise uid par point karti
// jiska record hi nahi hota.
//
// Image hamesha AllMarkerImages/{uid}.jpg par rehti hai, isliye marker move
// hone par image ko haath lagane ki zaroorat nahi padti.
//
// marksCount / ApproveStatus line-level cheezein hain, marker mapping ka hissa
// nahi - wo LineSummary par jaise hain waise hi rehti hain.
@Injectable({
  providedIn: "root",
})
export class MarkerMappingService {

  constructor(public commonService: CommonService) { }

  counterPath = "EntityMarkingData/MarkersMapping/lastMarkerKey";
  markersDataPath = "EntityMarkingData/MarkersData/";
  markerWisePath = "EntityMarkingData/MarkersMapping/MarkerWise/";
  wardWisePath = "EntityMarkingData/MarkersMapping/WardWise/";
  lineWisePath = "EntityMarkingData/MarkersMapping/LineWise/";
  lineSummaryPath = "EntityMarkingData/MarkersMapping/LineSummary/";
  moveHistoryPath = "EntityMarkingData/MarkerMovementData/MoveHistory/";

  // Ek baar padho aur chhod do - poore code me yahi pattern hai.
  readOnce(db: any, path: string): Promise<any> {
    return new Promise((resolve) => {
      let instance = db.object(path).valueChanges().subscribe((data: any) => {
        instance.unsubscribe();
        resolve(data);
      });
    });
  }

  // Line number ko wahi type banata hai jo DB me jaata hai. "12" aur 12 alag
  // value hain - compare karte waqt ye mismatch hi sabse zyada pareshan karta
  // hai, isliye set aur read dono yahi se guzarte hain.
  lineValue(line: any): any {
    return isNaN(Number(line)) ? line : Number(line);
  }

  // markerNo hamesha number hai (line par serial). Kahin textbox se "4" aata
  // hai kahin mapping se 4 - history me dono ek jaise hone chahiye, warna
  // entries ko chain karke padhna (pichhli ka toMarkerNo = agli ka
  // fromMarkerNo) fail ho jaata hai.
  markerNoValue(markerNo: any): number {
    return Number(markerNo) || 0;
  }

  // ---------------- READ ----------------

  // Poore ward ke markers ka index: { uid: line }. Kuch na ho to null.
  getWardMarkers(db: any, ward: any): Promise<any> {
    return this.readOnce(db, this.wardWisePath + ward).then((data: any) => {
      if (data == null || typeof data != "object") {
        return null;
      }
      let markers: any = {};
      let uidArray = Object.keys(data);
      for (let i = 0; i < uidArray.length; i++) {
        let uid = uidArray[i];
        // Ward ke neeche sirf marker rehte hain, phir bhi kabhi koi scalar
        // aa jaaye to wo marker nahi hai.
        if (uid.charAt(0) != "M") {
          continue;
        }
        markers[uid] = data[uid];
      }
      return Object.keys(markers).length > 0 ? markers : null;
    });
  }

  // Ek line ke marker uid: ["M1", "M7", ...]. Ward index se filter hota hai,
  // isliye line par alag index rakhne ki zaroorat nahi.
  getLineMarkerUids(db: any, ward: any, line: any): Promise<any> {
    let lineVal = this.lineValue(line);
    return this.getWardMarkers(db, ward).then((markers: any) => {
      if (markers == null) {
        return [];
      }
      let uidArray = Object.keys(markers);
      let result: any = [];
      for (let i = 0; i < uidArray.length; i++) {
        let uid = uidArray[i];
        // String/number dono taraf se compare - purana data string me pada ho
        // sakta hai.
        if (markers[uid] == lineVal || String(markers[uid]) == String(lineVal)) {
          result.push(uid);
        }
      }
      // M2 M10 se pehle aaye - number se sort, warna list ulti-pulti dikhti hai.
      result.sort((a: any, b: any) => Number(a.substring(1)) - Number(b.substring(1)));
      return result;
    });
  }

  // Ek marker ka poora record. Na ho to null.
  getMarker(db: any, uid: any): Promise<any> {
    if (uid == null || uid == "") {
      return Promise.resolve(null);
    }
    return this.readOnce(db, this.markersDataPath + uid);
  }

  // Marker abhi kis ward/line par hai. Move ke waqt "kahan se hataana hai" yahi
  // batata hai. Na mile to null.
  getMarkerPlace(db: any, uid: any): Promise<any> {
    return this.readOnce(db, this.markerWisePath + uid).then((place: any) => {
      if (place == null || place["ward"] == null) {
        return null;
      }
      return place;
    });
  }

  // Ek line ke poore records: { uid: record }. Display pages isi se list
  // banate hain.
  getLineMarkers(db: any, ward: any, line: any): Promise<any> {
    return this.getLineMarkerUids(db, ward, line).then((uidArray: any) => {
      let readArray = uidArray.map((uid: any) => this.getMarker(db, uid));
      return Promise.all(readArray).then((recordArray: any) => {
        let markers: any = {};
        for (let i = 0; i < uidArray.length; i++) {
          if (recordArray[i] != null) {
            markers[uidArray[i]] = recordArray[i];
          }
        }
        return markers;
      });
    });
  }

  // ---------------- WRITE ----------------

  // GLOBAL M counter se ek block reserve karta hai. Transaction server par
  // atomic hai, isliye ek saath chalne wale app/portal ko same M number nahi
  // milta. Return = block ka start; pehla uid (start + 1) hota hai.
  // Block ka koi number use na ho to bas gap reh jaata hai, nuksan nahi.
  reserveUidBlock(db: any, blockSize: number): Promise<any> {
    return db.database.ref(this.counterPath).transaction(
      (current: any) => (Number(current) || 0) + blockSize
    ).then((res: any) => {
      if (res == null || !res.committed) {
        return null;
      }
      return Number(res.snapshot.val()) - blockSize;
    });
  }

  // Line ka agla markerNo.
  //
  // Sirf lastMarkerKey par +1 karna KAAFI NAHI hai - wo counter peeche reh
  // sakta hai (jaise koi marker move hokar is line par aa gaya ho). Aise me
  // naye marker ko wahi number mil jaata jo pehle se kisi marker ke paas hai,
  // aur LineWise me ek key par doosra uid chadh kar purana marker portal se
  // gaayab kar deta.
  //
  // Isliye pehle line ki asli sabse badi key nikalte hain, phir transaction me
  // dono me se bada leke +1 karte hain. Portal ke move flows ka getSafeLastKey()
  // bhi yahi karta hai.
  nextLineKey(db: any, ward: any, line: any): Promise<any> {
    return this.readOnce(db, this.lineWisePath + ward + "/" + line).then((links: any) => {
      let maxKey = 0;
      if (links != null && typeof links == "object") {
        let keyArray = Object.keys(links);
        for (let i = 0; i < keyArray.length; i++) {
          if (links[keyArray[i]] == null || links[keyArray[i]] == "") {
            continue; // numeric keys ki wajah se aaye array-nulls skip
          }
          let n = Number(keyArray[i]);
          if (!isNaN(n) && n > maxKey) {
            maxKey = n;
          }
        }
      }
      return db.database.ref(this.lineSummaryPath + ward + "/" + line + "/lastMarkerKey").transaction(
        (current: any) => {
          let currentKey = Number(current) || 0;
          return (currentKey > maxKey ? currentKey : maxKey) + 1;
        }
      );
    }).then((res: any) => {
      if (res == null || !res.committed) {
        return null;
      }
      return Number(res.snapshot.val());
    });
  }

  // Ek naya marker: uid + markerNo dono reserve, phir data + poora mapping.
  // Return = uid ("M12"), counter fail hone par null.
  // Loop me bulane par har marker ke apne transaction chalte hain; bahut saare
  // markers ek saath bana rahe ho to reserveUidBlock + writeMarker use karo.
  createMarker(db: any, ward: any, line: any, data: any): Promise<any> {
    return Promise.all([
      this.reserveUidBlock(db, 1),
      this.nextLineKey(db, ward, line)
    ]).then((result: any) => {
      let blockStart = result[0];
      let markerNo = result[1];
      if (blockStart == null || markerNo == null) {
        return null;
      }
      return this.writeMarker(db, ward, line, data, blockStart + 1, markerNo);
    });
  }

  // Pehle se reserve kiye hue number par marker likhta hai. Return = uid.
  // Pehle data, uske confirm hone ke baad mapping.
  //
  // markerNo line par marker ka serial number hai - LineWise ki key wahi banti
  // hai, aur portal/app screen par wahi dikhta hai. Migration jaisa flow jo
  // purana number bachana chahta hai wo apna markerNo yahan bhej deta hai.
  writeMarker(db: any, ward: any, line: any, data: any, keyNumber: number, markerNo: any): Promise<any> {
    let uid = "M" + keyNumber;
    let lineVal = this.lineValue(line);

    let record = Object.assign({}, data);
    record["ward"] = ward;
    record["line"] = lineVal;
    // markerNo = line par marker ka serial number (screen par yahi dikhta hai).
    // Pehle ye sirf LineWise ki key me rehta tha, isliye number jaanne ke liye
    // ek alag index rakhna padta tha. Record ke andar hone se ye marker ke saath
    // khud chalta hai - move par alag se sync karne ki zaroorat nahi.
    record["markerNo"] = Number(markerNo) || 0;
    // imgRef hamesha set hota hai - image baad me is naam se upload ho sakti hai.
    record["imgRef"] = uid + ".jpg";

    return db.object(this.markersDataPath + uid).update(record).then(() => {
      return this.writePlace(db, uid, ward, lineVal, markerNo);
    }).then(() => {
      // Line ka lastMarkerKey kabhi peeche nahi jaana chahiye - migration
      // purana (bada) markerNo bhej sakti hai, isliye max lete hain.
      return db.database.ref(this.lineSummaryPath + ward + "/" + line + "/lastMarkerKey").transaction(
        (current: any) => {
          let currentKey = Number(current) || 0;
          let newKey = Number(markerNo) || 0;
          return newKey > currentKey ? newKey : currentKey;
        }
      );
    }).then(() => {
      return uid;
    });
  }

  // Marker ko nayi ward/line par le jaata hai. Data ka uid aur image dono wahi
  // rehte hain - sirf jagah badalti hai.
  // Purani jagah ki entry hatana zaroori hai, warna marker dono jagah dikhta
  // rahega. LineWise ke liye purana markerNo chahiye, isliye wo caller deta hai
  // (usi ke paas hota hai ki marker kis number par pada tha).
  moveMarker(db: any, uid: any, wardFrom: any, lineFrom: any, markerNoFrom: any, wardTo: any, lineTo: any, markerNoTo: any): Promise<any> {
    let lineVal = this.lineValue(lineTo);
    // History yahi likhi jaati hai, alag se nahi - jagah badalna aur uska
    // record rakhna ek hi kaam hai. Har move page ise apne paas likhta tha, to
    // koi naya page ise likhna bhool bhi sakta tha.
    this.recordMove(db, uid, wardFrom, lineFrom, markerNoFrom, wardTo, lineTo, markerNoTo);
    return db.object(this.markersDataPath + uid).update({ ward: wardTo, line: lineVal }).then(() => {
      return this.writePlace(db, uid, wardTo, lineVal, markerNoTo);
    }).then(() => {
      let updates: any = {};
      // Ward badla ho tabhi WardWise ki purani entry hatani hai. Same ward me
      // sirf line badalne par value upar overwrite ho chuki hoti hai.
      if (String(wardFrom) != String(wardTo)) {
        updates[this.wardWisePath + wardFrom + "/" + uid] = null;
      }
      // LineWise har move par hatani padti hai - line badle ya markerNo, purani
      // key apni jagah padi reh jaati hai aur marker do jagah dikhne lagta hai.
      if (String(wardFrom) != String(wardTo) || String(lineFrom) != String(lineTo) || String(markerNoFrom) != String(markerNoTo)) {
        updates[this.lineWisePath + wardFrom + "/" + lineFrom + "/" + markerNoFrom] = null;
      }
      if (Object.keys(updates).length == 0) {
        return null;
      }
      return db.database.ref().update(updates);
    }).then(() => {
      return uid;
    });
  }

  // Har move ka permanent record: MoveHistory/{uid}/{pushKey}.
  //
  // Push key ke shuru me timestamp hota hai, isliye entries apne aap
  // purani-se-nayi sort ho jaati hain - alag se counter ya sort field ki
  // zaroorat nahi. Counter rakhte to transaction lagta aur do log ek saath
  // move karein to clash bhi ho sakta tha.
  //
  // line aur markerNo dono taraf normalize karke likhte hain. Bina iske ek
  // entry me fromLine 1 (number) aur toLine "2" (string) pad jaati thi, aur
  // history ko chain karke padhna (pichhli ka toLine = agli ka fromLine) match
  // hi nahi karta tha.
  //
  // Naam (movedByName) id ke saath yahin likh dete hain. History permanent
  // record hai - employee baad me hat jaaye ya userList me na mile, to sirf id
  // se history hamesha "4" hi dikhati rehti.
  recordMove(db: any, uid: any, wardFrom: any, lineFrom: any, markerNoFrom: any, wardTo: any, lineTo: any, markerNoTo: any): any {
    let entry = {
      fromWard: wardFrom,
      fromLine: this.lineValue(lineFrom),
      fromMarkerNo: this.markerNoValue(markerNoFrom),
      toWard: wardTo,
      toLine: this.lineValue(lineTo),
      toMarkerNo: this.markerNoValue(markerNoTo),
      movedBy: localStorage.getItem("userID"),
      movedByName: localStorage.getItem("userName"),
      movedOn: this.commonService.getTodayDateTime()
    };
    return db.list(this.moveHistoryPath + uid).push(entry);
  }

  // Ek marker ki poori move history, purani se nayi order me. Har entry par
  // uski push key bhi rakh dete hain (`historyId`), taaki UI ko alag se
  // Object.keys karne ki zaroorat na pade. Kuch na ho to khaali array.
  getMoveHistory(db: any, uid: any): Promise<any> {
    return this.readOnce(db, this.moveHistoryPath + uid).then((data: any) => {
      if (data == null || typeof data != "object") {
        return [];
      }
      // Push key khud time se sort hoti hai, isliye keys sort karna hi kaafi hai.
      let keyArray = Object.keys(data).sort();
      let list: any = [];
      for (let i = 0; i < keyArray.length; i++) {
        let entry = data[keyArray[i]];
        if (entry == null || typeof entry != "object") {
          continue;
        }
        list.push(Object.assign({ historyId: keyArray[i] }, entry));
      }
      return list;
    });
  }

  // Line ke saare count fields. Khali line par ye sab zero hone chahiye -
  // aadhe zero karne se Markers 0 dikhta hai par Houses purana number dikhata
  // rehta hai, aur external user ko to Markers bhi purana hi dikhta hai
  // (wo actualMarks* padhta hai).
  lineCountFields = [
    "marksCount", "marksHouse", "marksComplex", "marksHouseInComplex",
    "actualMarksCount", "actualMarksHouse", "actualMarksComplex", "actualMarksHouseInComplex",
    "surveyedCount", "lineRevisitCount", "lineRfidNotFoundCount", "alreadyInstalledCount"
  ];

  // Jin lines par ab ek bhi marker nahi bacha, unke counts zero.
  //
  // Old path me line ka node markers ke SAATH hi rehta tha, isliye khali line
  // bhi count wale loop me aa jaati thi aur wahan saare counts 0 likh diye
  // jaate the. New path me line ki list LineWise se banti hai, aur line ka
  // aakhri marker nikalte hi LineWise/{ward}/{line} node hi gayab ho jaata hai
  // - line loop me aati hi nahi aur uske purane counts LineSummary par jyon ke
  // tyon pade rehte hain. Isliye har count-update ke saath ye pass chalana
  // zaroori hai.
  //
  // markerData = wahi {line: {markerNo: record}} jo LineWise se bana hai; jo
  // line usme nahi hai wahi khali maani jaati hai.
  //
  // lastMarkerKey ko haath nahi lagate - wo zero karne par nayi marker ko wahi
  // number mil jaata jo pehle kisi ke paas tha.
  resetEmptyLineSummaries(db: any, ward: any, markerData: any): Promise<any> {
    let wardSummaryPath = this.lineSummaryPath + ward;
    return this.readOnce(db, wardSummaryPath).then((summary: any) => {
      if (summary == null || typeof summary != "object") {
        return null;
      }
      let updates: any = {};
      let lineArray = Object.keys(summary);
      for (let i = 0; i < lineArray.length; i++) {
        let lineNo = lineArray[i];
        if (summary[lineNo] == null || typeof summary[lineNo] != "object") {
          continue; // ward-level scalars skip
        }
        if (markerData != null && markerData[lineNo] != null) {
          continue; // is line par markers hain -> caller ka loop count karega
        }
        for (let f = 0; f < this.lineCountFields.length; f++) {
          updates[wardSummaryPath + "/" + lineNo + "/" + this.lineCountFields[f]] = 0;
        }
      }
      if (Object.keys(updates).length == 0) {
        return null;
      }
      return db.database.ref().update(updates);
    });
  }

  // Teeno mapping ek saath - aadha likha rehna sabse kharab haalat hai.
  writePlace(db: any, uid: any, ward: any, lineVal: any, markerNo: any): Promise<any> {
    let updates: any = {};
    updates[this.markerWisePath + uid] = { ward: ward, line: lineVal };
    updates[this.wardWisePath + ward + "/" + uid] = lineVal;
    updates[this.lineWisePath + ward + "/" + lineVal + "/" + markerNo] = uid;
    return db.database.ref().update(updates);
  }

  // Marker hataate waqt data ke sath teeno mapping bhi jaani chahiye, warna
  // mapping aise uid par point karti reh jaati hai jiska record nahi hai.
  // markerNo mapping me hi dhoondh lete hain, taaki caller ko yaad na rakhna pade.
  removeMarker(db: any, uid: any): Promise<any> {
    return this.getMarkerPlace(db, uid).then((place: any) => {
      if (place == null) {
        // Mapping hai hi nahi - sirf record hata do.
        return db.database.ref(this.markersDataPath + uid).set(null);
      }
      let linePath = this.lineWisePath + place["ward"] + "/" + place["line"];
      return this.readOnce(db, linePath).then((links: any) => {
        let updates: any = {};
        updates[this.markersDataPath + uid] = null;
        updates[this.markerWisePath + uid] = null;
        updates[this.wardWisePath + place["ward"] + "/" + uid] = null;
        if (links != null && typeof links == "object") {
          let keyArray = Object.keys(links);
          for (let i = 0; i < keyArray.length; i++) {
            if (links[keyArray[i]] == uid) {
              updates[linePath + "/" + keyArray[i]] = null;
            }
          }
        }
        return db.database.ref().update(updates);
      });
    });
  }
}
