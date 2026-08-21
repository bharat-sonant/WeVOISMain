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

  // Ek-ek marker ke record ki cache: { uid: Promise<record> }.
  //
  // Yahi cache poore refactor ka sabse bada bachat point hai. Pehle har raasta
  // apne aap record padhta tha:
  //   - ward ka data (getWardRecords) ek query me aa jaata tha, phir usi ward
  //     ki ek line kholte hi (getLineRecords) wahi record DOBARA network se
  //     aate the - kyunki dono ki cache alag key par thi.
  //   - "Show All Markers" jaisa loop har line par alag se 40-50 read maarta
  //     tha, jabki poore ward ke record ek hi query me aa chuke hote the.
  //
  // Ab har record sirf EK BAAR aata hai. Ward wali query jo bhi record laati
  // hai wo yahin bhar diye jaate hain (seedRecordCache), isliye uske baad us
  // ward ki koi bhi line kholna zero network hai.
  //
  // Result nahi, PROMISE cache hota hai - ek saath chal rahe 50 lookup ek hi
  // read ka intezaar karte hain, 50 alag read nahi bhejte.
  markerCache: any = {};

  // Ek marker ka poora record. Na ho to null.
  getMarker(db: any, uid: any): Promise<any> {
    if (uid == null || uid == "") {
      return Promise.resolve(null);
    }
    let key = String(uid);
    if (this.markerCache[key] == null) {
      this.markerCache[key] = this.readOnce(db, this.markersDataPath + key);
    }
    return this.markerCache[key];
  }

  // Ek saath mile hue record cache me daal do, taaki inpar dobara read na jaaye.
  //
  // `absent` un uid ki list hai jo query me MILE HI NAHI - unhe null cache
  // karna zaroori hai, warna har baar "shayad ab mil jaaye" wali ek read
  // jaati rahegi.
  seedRecordCache(records: any, absent: any = null) {
    if (records != null && typeof records == "object") {
      let uidArray = Object.keys(records);
      for (let i = 0; i < uidArray.length; i++) {
        this.markerCache[uidArray[i]] = Promise.resolve(records[uidArray[i]]);
      }
    }
    if (absent != null) {
      for (let i = 0; i < absent.length; i++) {
        this.markerCache[String(absent[i])] = Promise.resolve(null);
      }
    }
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

  // ---------------- LINK INDEX (WardWise + LineWise ka union) ----------------
  //
  // Line par kaun se marker hain, ye DB me do jagah likha jaata hai:
  //   WardWise/{ward}/{uid}             = line
  //   LineWise/{ward}/{line}/{markerNo} = uid
  //
  // LineWise ADHOORA hai - app ka cloud function kaafi samay tak wo node likhta
  // hi nahi tha, aur purani migration ke markers bhi usme nahi aaye. Un markers
  // ka record MarkersData me maujood hai aur WardWise me bhi, sirf LineWise me
  // nahi. Isliye jo page sirf LineWise se list banate the unpar poori line
  // khaali dikhti thi - counts (LineSummary se) dikhte the par marker aur map
  // dono gayab.
  //
  // WardWise har writer likhta hai (app ka function, migration, portal), isliye
  // wahi bharosemand hai - par usme markerNo nahi hota, sirf line. Isliye dono
  // ka union lete hain: LineWise ki entries jaise hain waise, aur WardWise ke
  // bache hue uid record ke apne markerNo par.
  //
  // markerNo bhi na mile (bahut purane record me ye field nahi tha) ya us number
  // par pehle se doosra marker ho, to key uid hi rakh dete hain - warna ek
  // marker doosre ko dhak deta. Page uspar bhi chalta hai kyunki key sirf lookup
  // ke liye hai, aur getUid() uid wali key ko seedha pehchan leta hai.
  buildWardLinks(wardIndex: any, wardLinks: any, markersData: any): any {
    let result: any = {};
    let placed: any = {};

    // 1) LineWise - jaise DB me hai waise hi.
    if (wardLinks != null && typeof wardLinks == "object") {
      let lineArray = Object.keys(wardLinks);
      for (let i = 0; i < lineArray.length; i++) {
        let lineNo = lineArray[i];
        let links = wardLinks[lineNo];
        if (links == null || typeof links != "object") {
          continue;
        }
        let markerArray = Object.keys(links);
        for (let j = 0; j < markerArray.length; j++) {
          let uid = links[markerArray[j]];
          if (uid == null || uid == "") {
            continue; // numeric keys ki wajah se aaye array-nulls skip
          }
          // Mapping hai par record nahi - aisa marker hai hi nahi.
          if (markersData != null && markersData[uid] == null) {
            continue;
          }
          if (result[lineNo] == null) {
            result[lineNo] = {};
          }
          result[lineNo][markerArray[j]] = uid;
          placed[uid] = true;
        }
      }
    }

    // 2) WardWise ke bache hue marker.
    if (wardIndex != null && typeof wardIndex == "object") {
      let uidArray = Object.keys(wardIndex);
      for (let i = 0; i < uidArray.length; i++) {
        let uid = uidArray[i];
        // lastMarkerKey jaisa scalar bhi isi node me padta hai - marker nahi hai.
        if (uid.charAt(0) != "M" || placed[uid] == true) {
          continue;
        }
        let lineNo = wardIndex[uid];
        if (lineNo == null || lineNo === "") {
          continue;
        }
        let record = (markersData != null) ? markersData[uid] : null;
        if (markersData != null && record == null) {
          continue; // index hai par record nahi
        }
        // line kahin number me padi hai kahin string me - key ek jaisi rakho.
        let lineKey = String(lineNo);
        if (result[lineKey] == null) {
          result[lineKey] = {};
        }
        let markerNo = "";
        if (record != null && Number(record["markerNo"]) > 0) {
          markerNo = String(Number(record["markerNo"]));
        }
        if (markerNo == "" || (result[lineKey][markerNo] != null && result[lineKey][markerNo] != uid)) {
          markerNo = uid;
        }
        result[lineKey][markerNo] = uid;
        placed[uid] = true;
      }
    }
    return result;
  }

  // Ward ke do index node ki cache (raw, bina bane).
  //
  // Union banane ke liye har lookup par dono node padhne padte hain. Ek line ke
  // 50 marker par 50 lookup = 100 read - export/backfill jaise loop me ye page
  // ko ghutno par le aata hai. Dono node sirf index hain (uid aur line), poora
  // record nahi, isliye ek ward ka index yaad rakh lena sasta hai.
  //
  // Result nahi, PROMISE cache hota hai - ek saath aane wali kai calls ek hi
  // read ka intezaar karti hain.
  //
  // Cache sirf write par saaf hoti hai: har wo jagah jahan page apna
  // markersDataCache null karta hai, wahin clearLinkCache() bhi bulata hai.
  linkCache: any = {};

  clearLinkCache() {
    this.linkCache = {};
    this.recordCache = {};
    this.markerCache = {};
    this.summaryCache = {};
  }

  // Ek ward ka poora link index: { line: { markerNo: uid } }.
  // markersData de do to orphan (record-rahit) entries apne aap chhant jaati hain.
  getWardLinks(db: any, ward: any, markersData: any = null): Promise<any> {
    let cacheKey = String(ward);
    if (this.linkCache[cacheKey] == null) {
      this.linkCache[cacheKey] = Promise.all([
        this.readOnce(db, this.wardWisePath + ward),
        this.readOnce(db, this.lineWisePath + ward)
      ]);
    }
    return this.linkCache[cacheKey].then((res: any) => {
      return this.buildWardLinks(res[0], res[1], markersData);
    });
  }

  // Ek line ka link index: { markerNo: uid }. Kuch na ho to khaali object.
  //
  // Poora ward padhna padta hai kyunki WardWise line ke hisaab se saja hua nahi
  // hai - par dono node sirf index hain (uid aur line), record nahi, isliye ye
  // read halka rehta hai.
  getLineLinks(db: any, ward: any, line: any, markersData: any = null): Promise<any> {
    return this.getWardLinks(db, ward, markersData).then((wardLinks: any) => {
      let links = wardLinks[String(line)];
      return links != null ? links : {};
    });
  }

  // Saare ward ka link index: { ward: { line: { markerNo: uid } } }.
  // Poore shehar par chalne wale report page iska istemaal karte hain.
  //
  // !! ABHI KOI ISE NAHI BULATA, aur bulane se pehle do baar sochein. Ye poora
  // WardWise AUR poora LineWise ek saath padhta hai - yaani poore shehar ka
  // index. Kisi bhi ek page ko itna kabhi nahi chahiye hota: ek ward ke liye
  // getWardLinks() hai, ek line ke liye getLineLinks(). Ye sirf tab jaayaz hai
  // jab sach me saare ward ek saath chahiye (jaise koi ek-baar ka audit).
  getAllLinks(db: any, markersData: any = null): Promise<any> {
    return Promise.all([
      this.readOnce(db, "EntityMarkingData/MarkersMapping/WardWise"),
      this.readOnce(db, "EntityMarkingData/MarkersMapping/LineWise")
    ]).then((res: any) => {
      let wardIndexAll = res[0] != null ? res[0] : {};
      let wardLinksAll = res[1] != null ? res[1] : {};
      let wardArray = Object.keys(wardIndexAll).concat(Object.keys(wardLinksAll));
      let result: any = {};
      for (let i = 0; i < wardArray.length; i++) {
        let ward = wardArray[i];
        if (result[ward] != null) {
          continue; // dono list me aane wala ward do baar na bane
        }
        result[ward] = this.buildWardLinks(wardIndexAll[ward], wardLinksAll[ward], markersData);
      }
      return result;
    });
  }

  // markerNo se uid. Na mile to null.
  //
  // Union me jis marker ka markerNo pata nahi chala uski key uid hi hoti hai,
  // isliye "M" se shuru hone wali key seedha uid maan lete hain.
  getUid(db: any, ward: any, line: any, markerNo: any, markersData: any = null): Promise<any> {
    if (markerNo != null && String(markerNo).charAt(0) == "M") {
      return Promise.resolve(String(markerNo));
    }
    return this.getLineLinks(db, ward, line).then((links: any) => {
      let uid = links[markerNo];
      if (uid != null && uid != "") {
        return uid;
      }
      // Link index me is number par kuch nahi mila. Aisa us marker par hota
      // hai jiski LineWise entry bani hi nahi - uska number sirf record ke
      // andar hai. Line ke records waise bhi cache me hote hain, isliye ye
      // koshish sasti hai.
      return this.getLineRecords(db, ward, line).then((lineData: any) => {
        if (lineData == null) {
          return null;
        }
        let keyArray = Object.keys(lineData);
        for (let i = 0; i < keyArray.length; i++) {
          if (String(lineData[keyArray[i]]["markerNo"]) == String(markerNo)) {
            return this.uidFromRecordKey(keyArray[i], links);
          }
        }
        return null;
      });
    });
  }

  // shapeLine() ki key ya to markerNo hoti hai ya uid. uid ho to wahi lauta do,
  // warna link index se uid nikaalo.
  uidFromRecordKey(key: any, links: any): any {
    if (String(key).charAt(0) == "M") {
      return String(key);
    }
    let uid = links[key];
    return (uid != null && uid != "") ? uid : null;
  }

  // markerNo se MarkersData ka object-path. Na mile to null -> caller write skip kare.
  getMarkerDataPath(db: any, ward: any, line: any, markerNo: any, markersData: any = null): Promise<any> {
    return this.getUid(db, ward, line, markerNo, markersData).then((uid: any) => {
      return uid != null ? this.markersDataPath + uid : null;
    });
  }

  // Link index ko poore record me badal deta hai: { markerNo: record }.
  // Purane page isi shape par bane hain (pehle ye MarkedHouses/{ward}/{line} tha).



  // Poore ward ka data purane shape me: { line: { markerNo: record } }.
  // Kuch na mile to null - purane page null hi check karte hain.



  // Ek line ka data purane shape me ({ markerNo: record }). Khaali ho to null.



  // Poore ward ka data purane shape me. Khaali ho to null.



  // ---------------- RECORD FETCH ----------------
  //
  // Yahan ka poora maksad ek hi hai: POORA MarkersData node kabhi na padhna.
  //
  // Pehle har page `MarkersData` (poore shehar ke saare marker) ek baar padh
  // kar rakh leta tha aur usme se apni line ke 40 record chun leta tha. Mapping
  // pehle se bata deti hai ki kaunse uid chahiye, isliye wo read shuru se hi
  // bekaar tha - 50,000 record utha kar 40 istemaal karna.
  //
  // Har jagah pehle mapping se poochte hain ki kaun se uid chahiye, phir sirf
  // wahi record padhte hain - line ke liye bhi, ward ke liye bhi. Isme kisi
  // DB index ki zaroorat nahi hai.
  //
  // Ward ke liye ek tez vikalp bhi hai (ek hi query: orderByChild("ward")),
  // par wo DEFAULT OFF hai - poori wajah `wardQueryEnabled` par neeche likhi
  // hai. Chhota sa saar: index na laga ho to wo query chupchaap poore shehar
  // ka data khinch leti hai aur ye galti kahin dikhti nahi.

  // Diye gaye uid ke record: { uid: record }. Jo na mile wo chhod dete hain
  // (mapping hai par record nahi = aisa marker hai hi nahi).
  getMarkerRecords(db: any, uidArray: any): Promise<any> {
    if (uidArray == null || uidArray.length == 0) {
      return Promise.resolve({});
    }
    return Promise.all(uidArray.map((uid: any) => this.getMarker(db, uid))).then((recordArray: any) => {
      let records: any = {};
      for (let i = 0; i < uidArray.length; i++) {
        if (recordArray[i] != null) {
          records[uidArray[i]] = recordArray[i];
        }
      }
      return records;
    });
  }

  // Ward ka data query se laayein ya mapping se? DEFAULT: mapping (false).
  //
  // Ward ke record do tareeke se aa sakte hain, aur dono ka jawab BILKUL EK
  // JAISA hota hai - farak sirf kharche ka hai:
  //
  //   false (mapping) - WardWise/{ward} pehle se bata deta hai ki is ward me
  //                     kaun se uid hain, to seedha wahi uid padh lo.
  //                     N chhoti read, par utna hi data jitna chahiye.
  //                     Index ki zaroorat NAHI.
  //
  //   true  (query)   - orderByChild("ward").equalTo(ward), ek hi read.
  //                     Sabse tez - PAR sirf tab jab us project ke DB rules me
  //                     "MarkersData": { ".indexOn": ["ward"] } laga ho.
  //
  // Default false kyun, jabki query tez hai:
  //
  // Index na laga ho to RTDB query se mana nahi karta - wo POORA MarkersData
  // node browser ko bhej deta hai aur chhantni yahan hoti hai. Yaani ek ward
  // kholne par poore shehar ke marker utar aate hain. 2,000 marker wale ward
  // aur 50,000 marker wale shehar me ye 25 guna kharcha hai - aur ye galti
  // code me kahin dikhti nahi, na error aata hai, na page rukta hai. Sirf
  // browser console me ek warning aati hai jo koi nahi dekhta.
  //
  // Mapping wala raasta us galti ko namumkin bana deta hai: sabse bura case
  // "thodi zyada requests" hai, "poora shehar download" nahi.
  //
  // Isliye: pehle city ke Firebase project me index lagaayein, ward page
  // kholkar console me warning na aane ki tasdeek karein, TAB ise true karein.
  // Har city ka apna project hai - ek me laga hone ka matlab baaki me laga
  // hona nahi hai. Snippet: functions/database-index.rules.json
  wardQueryEnabled = false;

  // Ek ward ke saare record: { uid: record }.
  //
  // Query wale raaste me: query record ke apne `ward` field par chalti hai.
  // Kisi record me wo field na ho ya type alag ho (12 vs "12") to wo query me
  // nahi aayega - isliye index me maujood par query se gayab uid alag se padh
  // lete hain. Us soorat me jawab phir bhi poora rehta hai, bas thodi reads
  // badh jaati hain.
  getWardMarkerRecords(db: any, ward: any, uidArray: any): Promise<any> {
    if (!this.wardQueryEnabled) {
      // Mapping wala raasta. uidArray already WardWise se aaya hai, yaani is
      // ward ke theek utne hi marker - kuchh chhanta nahi ja raha. getMarker
      // markerCache se guzarta hai, isliye ek record dobara kabhi nahi aata.
      return this.getMarkerRecords(db, uidArray);
    }
    return db.database.ref("EntityMarkingData/MarkersData")
      .orderByChild("ward").equalTo(ward).once("value")
      .then((snap: any) => {
        let records = snap.val();
        if (records == null || typeof records != "object") {
          records = {};
        }
        // Query jo laayi wo seedha cache me. Iske baad isi ward ki koi bhi line
        // kholna (getLineRecords) zero network hai - pehle wahi record dobara
        // ek-ek karke padhe jaate the.
        this.seedRecordCache(records);
        let missing: any = [];
        for (let i = 0; i < uidArray.length; i++) {
          if (records[uidArray[i]] == null) {
            missing.push(uidArray[i]);
          }
        }
        if (missing.length == 0) {
          return records;
        }
        return this.getMarkerRecords(db, missing).then((extra: any) => {
          return Object.assign(records, extra);
        });
      });
  }

  // ---------------- LINE SUMMARY (ek ward, ek read) ----------------
  //
  // LineSummary/{ward} me ward ki SAARI lines ke counts aur ApproveStatus ek
  // saath pade hain, aur ye node chhota hai - marker record isme aate hi nahi.
  //
  // Isliye "har line par alag field read" ab bekaar hai. Pehle wo majboori thi:
  // ye sab MarkedHouses/{ward}/{line} par tha aur us node ke saath us line ke
  // saare marker record bhi utar aate the, isliye page field-by-field padhta
  // tha. Ab poore ward ka summary ek read me aa jaata hai.
  //
  // 300 line wale ward par: pehle ~1500 read (5 field x 300 line), ab 1.
  summaryCache: any = {};

  getWardLineSummaries(db: any, ward: any): Promise<any> {
    let cacheKey = String(ward);
    if (this.summaryCache[cacheKey] == null) {
      this.summaryCache[cacheKey] = this.readOnce(db, this.lineSummaryPath + ward).then((data: any) => {
        return data != null && typeof data == "object" ? data : {};
      });
    }
    return this.summaryCache[cacheKey];
  }

  // Ek line ka summary ward wale read me se. Na mile to khaali object.
  getLineSummary(db: any, ward: any, line: any): Promise<any> {
    return this.getWardLineSummaries(db, ward).then((all: any) => {
      let summary = all[String(line)];
      return summary != null && typeof summary == "object" ? summary : {};
    });
  }

  // Line/ward ka data thodi der ke liye yaad rakhte hain.
  //
  // Ek hi operation me kai baar wahi line chahiye hoti hai (list, phir har
  // marker par getMarkerDataPath, phir counts). Cache ke bina export jaise loop
  // me har marker par dobara reads jaati. Cache linkCache ke saath hi saaf hoti
  // hai - clearLinkCache() dono clear karta hai.
  recordCache: any = {};

  // Ek line ka data purane shape me ({ markerNo: record }). Khaali ho to null.
  //
  // Do chakkar lagte hain kyunki markerNo do jagah se aa sakta hai: LineWise ki
  // key se, ya record ke apne markerNo field se. Pehle mapping se uid nikaalte
  // hain, phir record padh kar jinki key uid reh gayi thi unhe theek karte hain.
  getLineRecords(db: any, ward: any, line: any, markersData: any = null): Promise<any> {
    let cacheKey = String(ward) + "||" + String(line);
    if (this.recordCache[cacheKey] == null) {
      this.recordCache[cacheKey] = this.getWardLinks(db, ward).then((wardLinks: any) => {
        let links = wardLinks[String(line)];
        if (links == null) {
          return null;
        }
        let keyArray = Object.keys(links);
        if (keyArray.length == 0) {
          return null;
        }
        let uidArray = keyArray.map((key: any) => links[key]);
        return this.getMarkerRecords(db, uidArray).then((records: any) => {
          return this.shapeLine(links, records);
        });
      });
    }
    return this.recordCache[cacheKey];
  }

  // links ({ key: uid }) + records ({ uid: record })  ->  { markerNo: record }.
  // Jis entry ki key uid hai (matlab LineWise me uska markerNo tha hi nahi)
  // uska number record se le lete hain.
  shapeLine(links: any, records: any): any {
    let lineData: any = {};
    let keyArray = Object.keys(links);
    for (let i = 0; i < keyArray.length; i++) {
      let uid = links[keyArray[i]];
      let record = records[uid];
      if (record == null) {
        continue; // mapping hai par record nahi
      }
      let key = keyArray[i];
      if (key == uid && Number(record["markerNo"]) > 0) {
        let numberKey = String(Number(record["markerNo"]));
        // Us number par pehle se koi doosra marker na ho - warna ek doosre ko
        // dhak dega. Aisi soorat me key uid hi rehne dete hain.
        if (lineData[numberKey] == null) {
          key = numberKey;
        }
      }
      lineData[key] = record;
    }
    return Object.keys(lineData).length > 0 ? lineData : null;
  }

  // Poore ward ka data purane shape me ({ line: { markerNo: record } }).
  // Khaali ho to null. Records ek hi query me aate hain.
  getWardRecords(db: any, ward: any, markersData: any = null): Promise<any> {
    let cacheKey = "ward||" + String(ward);
    if (this.recordCache[cacheKey] == null) {
      this.recordCache[cacheKey] = this.getWardLinks(db, ward).then((wardLinks: any) => {
        let lineArray = Object.keys(wardLinks);
        let uidArray: any = [];
        for (let i = 0; i < lineArray.length; i++) {
          let links = wardLinks[lineArray[i]];
          let keyArray = Object.keys(links);
          for (let j = 0; j < keyArray.length; j++) {
            uidArray.push(links[keyArray[j]]);
          }
        }
        if (uidArray.length == 0) {
          return null;
        }
        return this.getWardMarkerRecords(db, ward, uidArray).then((records: any) => {
          let wardData: any = {};
          let found = 0;
          for (let i = 0; i < lineArray.length; i++) {
            let lineData = this.shapeLine(wardLinks[lineArray[i]], records);
            if (lineData != null) {
              wardData[lineArray[i]] = lineData;
              found = found + Object.keys(lineData).length;
            }
          }
          return found > 0 ? wardData : null;
        });
      });
    }
    return this.recordCache[cacheKey];
  }

  // Target line ka agla safe markerNo: LineSummary ka lastMarkerKey aur line ki
  // asli sabse badi key, dono me se bada.
  //
  // Sirf lastMarkerKey par bharosa karna kaafi nahi - wo peeche reh sakta hai
  // (jaise koi marker move hokar is line par aa gaya ho), aur tab naye marker ko
  // wahi number mil jaata hai jo pehle se kisi ke paas hai.
  //
  // Key uid wali entries (jinka markerNo pata nahi chala) Number() par NaN deti
  // hain aur apne aap chhant jaati hain.
  getSafeLastKey(db: any, ward: any, line: any, markersData: any = null): Promise<any> {
    return Promise.all([
      this.readOnce(db, this.lineSummaryPath + ward + "/" + line + "/lastMarkerKey"),
      this.getLineRecords(db, ward, line)
    ]).then((res: any) => {
      let fromSummary = res[0] != null ? Number(res[0]) : 0;
      if (isNaN(fromSummary)) {
        fromSummary = 0;
      }
      let maxKey = 0;
      let lineData = res[1] != null ? res[1] : {};
      let keyArray = Object.keys(lineData);
      for (let i = 0; i < keyArray.length; i++) {
        // Key numeric ho to wahi markerNo hai; uid wali key par record ka
        // apna markerNo dekhte hain.
        let n = Number(keyArray[i]);
        if (isNaN(n)) {
          n = Number(lineData[keyArray[i]]["markerNo"]);
        }
        if (!isNaN(n) && n > maxKey) {
          maxKey = n;
        }
      }
      return fromSummary > maxKey ? fromSummary : maxKey;
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
      // Card se marker dhoondhne ka index. Card na ho to ye chup-chaap skip.
      return this.writeCardMapping(db, this.cardKeyFor(record), uid, ward, lineVal, markerNo);
    }).then(() => {
      // Line ki ginti bhi yahin badh jaati hai.
      //
      // Pehle marksCount sirf "Update Counts" wale batch flows se banti thi,
      // isliye naya marker banne par wo peeche reh jaati thi aur count-wale
      // page purana number dikhate rehte the. Transaction isliye ki do surveyor
      // ek saath marker banayein to ek ginti gum na ho.
      return db.database.ref(this.lineSummaryPath + ward + "/" + line + "/marksCount").transaction(
        (current: any) => (Number(current) || 0) + 1
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
      // Card mapping me marker ki nayi jagah. markerkey nahi badalta (uid wahi
      // hai), par ward/line/markerNo purane pade reh jaate to card se banne
      // wale purane raaste galat jagah point karte.
      return this.getMarker(db, uid).then((record: any) => {
        return this.writeCardMapping(db, this.cardKeyFor(record), uid, wardTo, lineVal, markerNoTo);
      });
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

  // Ek move ki history entry ka path.
  //
  // Move beech me fail ho kar rollback hua to ye entry hatani padti hai. Warna
  // marker to apni purani jagah wapas chala jaata hai par history wo move
  // dikhati rehti hai jo hua hi nahi, aur retry successful hone par usi ek move
  // ki do entries chadh jaati hain. Path yahin se milta hai taaki har move page
  // me ye string dobara na likhni pade.
  moveRecordPath(uid: any, historyKey: any): string {
    return this.moveHistoryPath + uid + "/" + historyKey;
  }

  // ---------------- BACKUP ----------------

  // Ek line ka raw mapping: { markerNo: uid }.
  //
  // Backup ke liye ye alag se chahiye. getNewPathLineData() jaise helper line
  // ka data purani shape ({ markerNo: record }) me dete hain aur uid beech me
  // hi chhod dete hain - par record ke andar uid hota nahi, aur naye path par
  // har node ki key uid hi hai. uid ke bina backup file restore layak nahi
  // rehti.
  readLineLinks(db: any, ward: any, line: any): Promise<any> {
    return this.readOnce(db, this.lineWisePath + ward + "/" + line);
  }

  /**
   * Move se pehle source line ka backup, bilkul usi shape me jaise DB me pada
   * hai - taaki file ka har key seedha apne node par import kiya ja sake.
   *
   * links    = LineWise/{ward}/{line}   -> { markerNo: uid }
   * lineData = getNewPathLineData()     -> { markerNo: record }
   *
   * Pehle backup me sirf `markedHouses` jaata tha jiski key markerNo thi. Wo
   * tab sahi tha jab data khud MarkedHouses/{ward}/{line}/{markerNo} par rehta
   * tha - file ko wapas usi node par daal dete the. Ab record MarkersData/{uid}
   * par hai, isliye markerNo wali file kahin fit hi nahi hoti: MarkedHouses par
   * daalo to portal wahan se padhta nahi (aur cloud trigger use naya marker
   * samajh kar duplicate bana deta hai), MarkersData par daalo to key hi match
   * nahi karti.
   *
   * Isliye ab wahi chaar node banate hain jo move badalta hai. `markerWise` aur
   * `wardWise` ki value record se hi leti hai (record move se pehle padha gaya
   * hai, yaani usme purani ward/line hi hai).
   *
   * Jis markerNo ka uid na mile use chhodte hain par chupchaap nahi - dono
   * list (skippedNoUid / orphanLinks) meta me chali jaati hain, warna restore
   * karne wale ko pata hi nahi chalega ki kuch chhoot gaya.
   */
  buildLineBackup(links: any, lineData: any): any {
    let markersData: any = {};
    let lineWise: any = {};
    let markerWise: any = {};
    let wardWise: any = {};
    let skippedNoUid: any[] = [];
    let orphanLinks: any[] = [];

    if (lineData != null && typeof lineData == "object") {
      let markerArray = Object.keys(lineData);
      for (let i = 0; i < markerArray.length; i++) {
        let markerNo = markerArray[i];
        let record = lineData[markerNo];
        if (record == null || typeof record != "object") {
          continue;
        }
        let uid = (links != null) ? links[markerNo] : null;
        if (uid == null || uid == "") {
          skippedNoUid.push(markerNo);
          continue;
        }
        markersData[uid] = record;
        lineWise[markerNo] = uid;
        let ward = (record["ward"] != null) ? record["ward"] : null;
        let line = (record["line"] != null) ? record["line"] : null;
        markerWise[uid] = { ward: ward, line: line };
        wardWise[uid] = line;
      }
    }

    // Mapping to hai par record nahi - aisa marker hai hi nahi, isliye move use
    // chhuta bhi nahi. Restore me bhi nahi jaana chahiye (warna orphan wapas
    // ban jaayega), bas dikh jaana chahiye.
    if (links != null && typeof links == "object") {
      let linkArray = Object.keys(links);
      for (let i = 0; i < linkArray.length; i++) {
        let markerNo = linkArray[i];
        let uid = links[markerNo];
        if (uid == null || uid == "") {
          continue;
        }
        if (lineData == null || lineData[markerNo] == null) {
          orphanLinks.push(markerNo + " -> " + uid);
        }
      }
    }

    return {
      markersData: markersData,
      lineWise: lineWise,
      markerWise: markerWise,
      wardWise: wardWise,
      skippedNoUid: skippedNoUid,
      orphanLinks: orphanLinks
    };
  }

  // Backup file ke har key ko kis node par wapas daalna hai - restore ka koi
  // code nahi hai, ye haath se Firebase console par hota hai, isliye ye baat
  // file ke andar likhi honi chahiye.
  //
  // {uid} wali do jagah jaan-boojh kar template hain: MarkersData aur
  // MarkerWise saare ward ke shared node hain. Unpar poora JSON import karna
  // matlab baaki poore shehar ka data uda dena - console ka import node ko
  // REPLACE karta hai, merge nahi. LineWise ka node sirf isi line ka hai
  // (backup me line ke saare marker hain), isliye wahan poora import chalta hai.
  buildRestoreNotes(ward: any, line: any): any {
    return {
      markersData: this.markersDataPath + "{uid}",
      lineWise: this.lineWisePath + ward + "/" + line,
      markerWise: this.markerWisePath + "{uid}",
      wardWise: this.wardWisePath + ward + "/{uid}",
      // LineSummary backup me nahi hai - usme sirf ginti (marksCount) aur
      // lastMarkerKey rehti hai, marker ka data nahi. Restore ke baad ginti
      // "Update Counts" se dobara ban jaati hai, isliye use file me rakhne ka
      // matlab nahi - par restore karne wale ko ye pata hona chahiye.
      lineSummary: this.lineSummaryPath + ward + "/" + line + " - backup me nahi hai. Restore ke baad Ward Marking Summary se Update Counts chala dena.",
      warning: "Firebase console ka import poore node ko REPLACE karta hai. markersData aur markerWise shared node hain - unhe uid ke hisaab se ek-ek node par import karo, poora JSON kabhi nahi."
    };
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

  // ---------------- CARD <-> MARKER ----------------
  //
  // MarkerWardMapping/{cardNo} pehle se maujood hai aur uski key card number hi
  // hai, isliye card se marker dhoondhne ke liye koi naya node nahi banaya.
  // Usme ab `markerkey` (marker ka uid) bhi likhte hain.
  //
  // Pehle raasta do hop ka tha: card -> {ward, line, markerNo} -> LineWise ->
  // uid. Uske do nuksan the - LineWise adhoora hai (to link toot jaata tha),
  // aur move par teeno field badal jaate the. markerkey se ek hop me kaam ho
  // jaata hai aur move-proof bhi hai, kyunki uid kabhi nahi badalta.
  //
  // `image` yahan JAAN-BOOJH KAR nahi likhi jaati. Image ka naam hamesha
  // {uid}.jpg hota hai, yaani markerkey se khud ban jaata hai - use dobara
  // rakhna sirf ek aur field hai jo purani padi reh sakti hai. Portal aur
  // React dono ab uid se URL banate hain, is field ko koi padhta nahi.
  cardMappingPath = "EntityMarkingData/MarkerWardMapping/";

  // Record ka card key - pehle cardNumber, na ho to markerId prefix ke saath
  // (yahi jodi poore portal me MarkerWardMapping ki key banti hai).
  cardKeyFor(data: any): string {
    if (data == null) {
      return "";
    }
    if (data["cardNumber"] != null && data["cardNumber"] !== "") {
      return String(data["cardNumber"]);
    }
    if (data["markerId"] != null && data["markerId"] !== "") {
      return this.commonService.getDefaultCardPrefix() + data["markerId"];
    }
    return "";
  }

  // MarkerWardMapping/{cardNo} - markerkey ke saath marker ki current jagah.
  // Card na ho to kuch nahi karta (bina card wale marker is node me aate hi nahi).
  writeCardMapping(db: any, cardNo: any, uid: any, ward: any, line: any, markerNo: any): Promise<any> {
    if (cardNo == null || cardNo === "" || uid == null || uid === "") {
      return Promise.resolve(null);
    }
    return db.object(this.cardMappingPath + cardNo).update({
      markerkey: uid,
      line: String(line),
      markerNo: String(markerNo),
      ward: ward
    });
  }

  // "EntityMarkingData/MarkersData/M12" -> "M12". Kai jagah marker ka path
  // pehle se haath me hota hai aur uid dobara dhoondhna bekaar ka read hai.
  uidFromPath(markerPath: any): string {
    if (markerPath == null || markerPath === "") {
      return "";
    }
    let path = String(markerPath);
    return path.substring(path.lastIndexOf("/") + 1);
  }

  // Card se marker ka uid.
  //
  // Pehle markerkey dekhte hain. Purani entries me wo field nahi hai, isliye
  // fallback me purana raasta chalta hai: card ke ward/line/markerNo se link
  // index. Migration backfill ke baad ye fallback apne aap bekaar ho jaayega.
  getUidByCard(db: any, cardNo: any, markersData: any = null): Promise<any> {
    if (cardNo == null || cardNo === "") {
      return Promise.resolve(null);
    }
    return this.readOnce(db, this.cardMappingPath + cardNo).then((entry: any) => {
      if (entry == null) {
        return null;
      }
      if (entry["markerkey"] != null && entry["markerkey"] !== "") {
        return String(entry["markerkey"]);
      }
      if (entry["ward"] == null || entry["line"] == null || entry["markerNo"] == null) {
        return null;
      }
      return this.getUid(db, entry["ward"], entry["line"], entry["markerNo"], markersData);
    });
  }

  // Card se seedha MarkersData ka path. Na mile to null.
  getMarkerDataPathByCard(db: any, cardNo: any, markersData: any = null): Promise<any> {
    return this.getUidByCard(db, cardNo, markersData).then((uid: any) => {
      return uid != null ? this.markersDataPath + uid : null;
    });
  }

  // ---------------- MARKER IMAGE URL ----------------
  //
  // Marker ki image DO jagah ho sakti hai, aur ye poori tarah is baat par hai
  // ki wo marker migrate hua ya nahi:
  //
  //   migrate ho chuka  -> imgRef hai (hamesha "M{n}.jpg")
  //                        DevTest/MarkingSurveyImages/AllMarkerImages/{imgRef}
  //   migrate nahi hua  -> imgRef NAHI hai, sirf purana `image` naam
  //                        {city}/MarkingSurveyImages/{ward}/{line}/{image}
  //
  // Ye rule ek jagah likhna zaroori tha. Har page apna fallback likh raha tha
  // aur kai jagah wo GALAT tha: imgRef na milne par purana naam bhi flat
  // AllMarkerImages folder me jod diya jaata tha - us folder me purane naam ki
  // file hai hi nahi, to sirf tooti hui image milti thi.
  //
  // Image copy ke baad bhi purani file apni jagah padi rehti hai, isliye
  // migrate na hue marker ke liye purana URL aaj bhi sahi chalta hai.
  imageBasePath = "DevTest%2FMarkingSurveyImages%2FAllMarkerImages%2F";

  storageCity(): string {
    let city = this.commonService.getFireStoreCity();
    // Sikar ka storage folder city list se match nahi karta - poore portal me
    // ye override haath se lagta hai.
    if (localStorage.getItem("cityName") == "sikar") {
      city = "Sikar-Survey";
    }
    return city;
  }

  // Record se image ka URL. ward/line sirf tab lagte hain jab marker abhi
  // migrate nahi hua - na dein to us soorat me khaali URL milega.
  markerImageUrl(entry: any, ward: any = null, line: any = null): string {
    if (entry != null && entry["imgRef"] != null && entry["imgRef"] !== "") {
      return this.commonService.fireStoragePath + this.imageBasePath + entry["imgRef"] + "?alt=media";
    }
    let image = entry != null && entry["image"] != null ? entry["image"] : "";
    return this.oldImageUrl(image, ward, line);
  }

  // Jahan record haath me nahi, sirf naam hai. imgRef hamesha "M{n}.jpg" hota
  // hai, isliye naam ka roop hi bata deta hai ki wo naya hai ya purana.
  imageUrlFromName(name: any, ward: any = null, line: any = null): string {
    let value = name != null ? String(name) : "";
    if (/^M[0-9]+\.jpg$/i.test(value)) {
      return this.commonService.fireStoragePath + this.imageBasePath + value + "?alt=media";
    }
    return this.oldImageUrl(value, ward, line);
  }

  oldImageUrl(image: any, ward: any, line: any): string {
    if (image == null || image === "" || ward == null || line == null) {
      return "";
    }
    return this.commonService.fireStoragePath + this.storageCity()
      + "%2FMarkingSurveyImages%2F" + ward + "%2F" + line + "%2F" + image + "?alt=media";
  }

  // Teeno mapping ek saath - aadha likha rehna sabse kharab haalat hai.
  writePlace(db: any, uid: any, ward: any, lineVal: any, markerNo: any): Promise<any> {
    this.clearLinkCache();
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
    this.clearLinkCache();
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
      }).then(() => {
        // Ginti bhi ghata do - warna delete ke baad line ka count bada dikhta
        // rehta hai. Zero se neeche kabhi nahi jaana chahiye.
        return db.database.ref(this.lineSummaryPath + place["ward"] + "/" + place["line"] + "/marksCount").transaction(
          (current: any) => {
            let count = (Number(current) || 0) - 1;
            return count > 0 ? count : 0;
          }
        );
      });
    });
  }
}
