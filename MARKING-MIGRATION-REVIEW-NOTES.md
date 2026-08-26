# Marking Migration — Review Notes

**Branch:** `dev/marking-management`  •  **Compare against:** `master`
**Shuru:** 2026-08-21  •  **Aakhri update:** 2026-08-24

---

## Governing Rule

> **Sirf marking data ka DB read/write path badlega. Baaki saari functionality master jaisi hi rahegi.**

Old path: `EntityMarkingData/MarkedHouses/{ward}/{line}/{markerNo}`
New path: `EntityMarkingData/MarkersData/{uid}` + `MarkersMapping/*`

Har change ko do me baanta jaata hai:

1. **Path change** → rakho
2. **Behaviour change** (naya `if`, naya filter, nayi validation, alag count source) → user ko batao aur default me **hatao**, chahe wo logically sahi lage

---

## New Data Structure — Reference

| Node | Content |
|---|---|
| `EntityMarkingData/MarkersData/{uid}` | Poora record + `ward` + `line` + `markerNo` + `imgRef` |
| `MarkersMapping/MarkerWise/{uid}` | `{ ward, line }` |
| `MarkersMapping/WardWise/{ward}/{uid}` | line |
| `MarkersMapping/LineWise/{ward}/{line}/{markerNo}` | uid |
| `MarkersMapping/LineSummary/{ward}/{line}` | `ApproveStatus`, `marksCount`, `lastMarkerKey` |
| `MarkersMapping/OriginalToUid/{ward}/{line}/{markerNo}` | uid (permanent migration ledger, kabhi clean nahi hota) |
| `MarkersMapping/lastMarkerKey` | global M counter |
| `MarkerMovementData/MoveHistory/{uid}/{pushKey}` | move entries |

**Image:**
old `{city}/MarkingSurveyImages/{ward}/{line}/{image}`
new `{city}/MarkingSurveyImages/AllMarkerImages/{uid}.jpg` — `imgRef` hamesha `uid + ".jpg"`

**`WardWise ∪ LineWise` union pattern:** `LineWise` historically adhoora hai (cloud function ne kaafi samay tak wo node likha hi nahi tha), isliye ward ka data padhte waqt dono ka union liya jaata hai.

---

# PAGE 1 — `house-survey/house-marking/house-marking.component.ts`

**Status:** ✅ Complete

## 1.1 Delete band tha — chalu kiya

| | |
|---|---|
| **Problem** | Ek early-return block tha jo "Marker delete abhi band hai" alert dikha kar return kar deta tha. Master me delete kaam karta tha. |
| **Wajah jo likhi thi** | Delete karne par orphan mapping bach jaati thi |
| **Asliyat** | `markerMapping.removeMarker()` pehle se hi record + teeno mapping ek atomic update me hataata hai — blocker tha hi nahi |
| **Fix** | Early-return hata diya. `removeMarker()` ab field-nulling loop ki jagah service call karta hai |

```ts
dbPath = "EntityMarkingData/RemovedMarkers/" + zoneNo + "/" + lineNo + "/" + removedUid;
this.db.object(dbPath).update(data);

this.besuh.saveBackEndFunctionDataUsesHistory(this.serviceName, "removeMarker", data);
// Marker hataate waqt record ke saath teeno mapping bhi jaani chahiye,
// warna mapping aise uid par point karti reh jaati hai jiska record
// hi nahi hai. Service teeno ek hi atomic update me hataati hai, aur
// marksCount bhi wahi transaction se ghataati hai.
this.markerMapping.removeMarker(this.db, removedUid);
```

## 1.2 `marksCount` double decrement — bug tha, fix kiya

| | |
|---|---|
| **Problem** | `removeMarker()` service transaction se `marksCount` −1 karti hai, aur component bhi alag se DB write kar raha tha → **ek delete par count 2 se girta** |
| **Fix** | Component ka DB write hata diya, sirf screen ke counter update hote hain |

```ts
// marksCount ka DB write markerMapping.removeMarker() ke transaction
// me ho chuka hai. Yahan dobara likhein to ek hi delete par count
// 2 se gir jaayega. Isliye yahan sirf screen ke counter ghatate hain.
```

## 1.3 `getLineApproveStatus()` — master ka logic wapas

Branch me ise re-write kar diya gaya tha. Master ka live-listener + `push` wala logic wapas laaya gaya, **sirf path naya**:

```ts
let dbPath = this.getLineSummaryPath(this.selectedZone, lineNo) + "/ApproveStatus/status";
let approveStatusInstance = this.db.object(dbPath).valueChanges().subscribe(approveStatus => {
  if (approveStatus != null) { this.besuh.saveBackEndFunctionDataUsesHistory(...); }
  let color = "";
  if (approveStatus == "Confirm") {
    color = "#00f645";
    this.lines.push({ lineNo, latlng: latLng, color, approveStatus });
    this.plotLineOnMap(lineNo, latLng, i, this.selectedZone, approveStatus);
  } else {
    color = "#fa0000";
    this.lines.push({ lineNo, latlng: latLng, color, approveStatus });
    this.plotLineOnMap(lineNo, latLng, i, this.selectedZone, approveStatus);
  }
});
```

## 1.4 Extra functions hataye (master me the hi nahi)

| Function | Kya karta tha | Kyun hataya |
|---|---|---|
| `setLineDetail()` | line detail set | master me nahi |
| `refreshLineOnMap()` | save ke baad line refresh | master me nahi |
| `getNewPathLineApproveStatus()` | duplicate of 1.3 | master me nahi |
| `formatApproveDate()` | date format | master me nahi |
| `trimValue()` | 13 jagah input trim | master me nahi — sab call sites raw `$(...).val()` par wapas, `servingCount`/`plotBreadth` par master ka `.toString()` |
| `loadMoveHistory()` + `markerMoveHistory` | move history popup | **dead code** — neeche 1.5 dekho |

Iske alawa hataya gaya:
- ward-change par `this.markerData.wardno = this.selectedZone;`
- `showApproveDate` assignment
- `saveData()` ka `.then(() => refreshLineOnMap(...))`

## 1.5 Move History — dead code tha

| | |
|---|---|
| **Problem** | `loadMoveHistory(markerUID)` ko UI-only random key milti thi: `${zone}_${line}_${index}_${Date.now()}_${i}_${random}` |
| **Chahiye tha** | Asli uid, jaise `M23` |
| **Nateeja** | Hamesha `[]` return karta tha, popup kabhi render hi nahi hota tha |
| **Fix** | TS ka function + variable hataya, HTML ka 13-line block hataya |

**`house-marking.component.html` ab master se byte-identical hai.**

## 1.6 `approveMarker()` — `approvedOn` single timestamp (jaan-bujh ke)

Master me UI aur DB dono call ek saath the. Ab DB write `markerNo → uid` wale async read ke **baad** hoti hai — dobara `getTodayDateTime()` call karte to minute badalne par screen aur DB par alag time pad sakta tha.

```ts
// Ek hi timestamp UI aur DB dono ke liye. Old path me dono call ek saath
// the (beech me kuch nahi), par ab DB write markerNo -> uid wale async
// read ke baad hoti hai - dobara call karte to minute badalne par screen
// aur DB par alag time pad sakta tha.
let approvedOn = this.commonService.getTodayDateTime();
```

## 1.7 `getLineApprove()` — actual records count karta hai (user ne chuna)

`LineSummary/marksCount` bharosemand nahi hai:

| Event | `marksCount` update hota hai? |
|---|---|
| Portal se marker banaya | ✅ +1 |
| Portal se marker delete | ✅ −1 |
| **App se marker banaya** (cloud function) | ❌ sirf `lastMarkerKey` |
| **Marker move** (`moveMarker()`) | ❌ chhuta hi nahi |

Isliye `getLineApprove()` records ginta hai, `marksCount` par bharosa nahi karta.

## 1.8 Icon size clamp — user ke kehne par wapas

Map par ek icon bahut bada dikh raha tha. Sabhi default marker PNG **21px** oonche hain (`marking-house` 21×21, `marking-shop` 27×21, `marking-hospital` 31×21, `marking-thela` 18×21). Custom `iconImage` par clamp lagaya:

```ts
houseTypeIconSize = 21;

buildMarkerIcon(markerURL: any, isHouseTypeIcon: boolean) {
  let icon: any = {
    url: markerURL,
    fillOpacity: 1,
    strokeWeight: 0,
    origin: new google.maps.Point(0, 0),
  };
  if (isHouseTypeIcon) {
    icon.scaledSize = new google.maps.Size(this.houseTypeIconSize, this.houseTypeIconSize);
  }
  return icon;
}
```

`setMarker()` par `isHouseTypeIcon?: boolean` param, dono callers (`showMarkers` ~line 517, `getMarkedHouses` ~line 918) `iconImage != ""` pass karte hain.

## 1.9 Debug logs

10 `TEMP-LOG` / `[DEL-x]` console.log daale gaye the delete flow verify karne ke liye — **sab hata diye**. File me ab 0 `console.log`.

## 1.10 Popup me `---` — code ki galti nahi, data hi nahi tha

Screenshot me Owner Name / Mobile No. / House No. / Address sab `---` the, par Street/Colony aur Ward populated the.

- Migration ka `buildRecord()` `Object.assign({}, old)` karta hai — **koi field drop nahi hoti** (sirf `movedMarkerUid`/`movedToNewPath` delete hoti hain)
- Street/Colony aur Ward usi record se aa rahe the jisme baaki fields hain — matlab record theek padha ja raha tha
- Popup ka `data.ownerName || "---"` → field khali hai
- **Master me bhi wahi `---` dikhta** — us marker me ye fields kabhi bhare hi nahi gaye

**Koi change nahi kiya.**

## 1.11 Bacha hua / decide karna hai

| Item | Status |
|---|---|
| `getDeletedMarkerData()` refactor (early-return + `typeof != "object"` guard vs master ka `if (lineKey != "totalRemovedMarkersCount")`) | Output equivalent. Master form par revert karna hai ya nahi — **user ne decide nahi kiya** |
| Runtime testing (delete flow, counts, popup, images) | ❌ Nahi hua. Sirf static review + `tsc --noEmit` |

---

# PAGE 2 — `house-survey/house-marking-assignment/house-marking-assignment.component.ts`

**Status:** ✅ Complete

## 2.1 `getLinesWithMarkers()` — 93 line ka naya function hataya

| | |
|---|---|
| **Kya tha** | `WardWise ∪ LineWise` padh kar wo lines nikalta tha jinpar sach me marker pada hai, aur `getLines()` me `linesWithMarkers[String(index)] == true` guard lagaya gaya tha |
| **Iraada** | "Approve to hai par saare marker doosri line par move ho gaye" wali khali line assign list me na aaye |
| **Problem** | Ye guard master me tha hi nahi — behaviour change hai, path change nahi |
| **Fix** | Poora function + guard + `.then()` wrapper hata diya |

## 2.2 Final diff — sirf 1 logical line

```diff
- this.dbPath = "EntityMarkingData/MarkedHouses/" + wardNo + "";
+ this.dbPath = "EntityMarkingData/MarkersMapping/LineSummary/" + wardNo + "";
```

Shape wahi hai: `{line: {ApproveStatus: {status}}}`

---

# PAGE 3 — `house-survey/ward-marking-summary/ward-marking-summary.component.ts`

**Status:** ✅ Complete

## 3.1 Cache ka rule — user ne set kiya

> **"Jiska data aa chuka hai use baar-baar get nahi karna. Jiska nahi aaya wahi get ho. Page refresh par cache clear ho."**

Is rule par is page ki saari `clearLinkCache()` calls dobara dekhi gayi.

## 3.2 Export loop me cache thrash — 🔴 asli bug tha

`clearLinkCache()` teen jagah **per-marker async callback** ke andar tha:

| Line | Kahan | Kyun bura |
|---|---|---|
| 510 | `getAddressFromCoords().then()` — Google geocode HTTP | har response alag macrotask me aata hai |
| 601 | `Houses/{ward}/{line}/{card}/address` ke DB callback me | wahi baat |
| 618 | `else` branch (sync) | khud thrash nahi karta, par 510/601 ki cache udata hai |

**Mechanism** — [marker-mapping.service.ts:310](Code/src/app/services/marker/marker-mapping.service.ts#L310):
```ts
getWardLinks(db, ward) {
  if (this.linkCache[cacheKey] == null) {
    this.linkCache[cacheKey] = Promise.all([
      this.readOnce(db, this.wardWisePath + ward),   // read 1
      this.readOnce(db, this.lineWisePath + ward)    // read 2
    ]);
  }
  ...
}
```

```
t=200ms  Marker 1 geocode response → cache khali → 2 READ → clearLinkCache() → SAAF
t=213ms  Marker 2 geocode response → cache khali → 2 READ → clearLinkCache() → SAAF
t=225ms  Marker 3 → 2 READ → SAAF ...
```

| Ek ward, 500 marker | Index reads |
|---|---|
| Clear ke saath | **1002** |
| Bina clear ke | **2** |

`--All--` export (60 ward): ~60,000 → ~120

**Aur ye clear zaroori bhi nahi thi** — update `MarkersData/{uid}` ka `address` field badalta hai, `markerNo → uid` mapping nahi. Cache basi hoti hi nahi.

**Master me:**
```ts
this.db.object(path).update({ address: address });
```
Bas — cache ka concept hi nahi tha.

**Fix:** teeno jagah se sirf `clearLinkCache()` line hatai. `getMarkerNewPath()` + `update()` jaise the waise.

## 3.3 `getMarkingDetail()` ka clear — hataya

Har ward select karne par poori cache udti thi. Ward 12 → 15 → wapas 12 par 12 dobara poora read hota tha.

Cache ward-wise alag key par hai, to mixing ka risk nahi. User ke rule ke hisaab se hata diya.

## 3.4 `updateCounts()` ka clear — targeted kar diya

Ye function sach me `LineSummary/{ward}` **likhta** hai, to clear zaroori hai — warna table apne hi likhe naye counts nahi dikhayega. Par poori cache udana zyada tha.

Service me naya function — [marker-mapping.service.ts:315](Code/src/app/services/marker/marker-mapping.service.ts#L315):
```ts
clearWardSummary(ward: any) {
  delete this.summaryCache[String(ward)];
}
```

Component me `clearLinkCache()` → `clearWardSummary(zoneNo)`.

### Cache ka final hisaab

| | Pehle | Ab |
|---|---|---|
| `clearLinkCache()` is page me | 5 jagah | **0** |
| Targeted clear | — | 1 (`clearWardSummary`) |

Service ke andar `clearLinkCache()` ab bhi 2 jagah hai — `writePlace()` aur `removeMarker()`. Wahan **mapping sach me badalti hai** (naya marker / delete / move), to wo sahi hai.

## 3.5 Master ke 3 bug — RAKHE GAYE (user ka faisla)

Master har count par **do read** karta tha: pehle `actualX`, na mile to `X`. Naye structure me `LineSummary` ka **ek hi read** hai, to wo fallback branch hai hi nahi — uske andar ke teen bug apne aap khatam.

> **User ka faisla:** *"hume hatana kuch nahi hein, new structure ke according set karna hein"* — teeno rehenge. Ye behaviour change nahi, naye structure ka natural nateeja hai.

### B1 — `getLineHouses()` me `houses` hamesha 0

```ts
// master ka fallback:
lineDetail.houses = Number(data);      // sahi
houses = Number(houseData);            // houseData null hai -> houses = 0
```

`houses = 0` hone se `diff` hamesha 0 aur `lineDetail.markers` hamesha `markers`.

**Kab dikhta tha:** sirf **Ajmer + External User** — kyunki [line 93](Code/src/app/house-survey/ward-marking-summary/ward-marking-summary.component.ts#L93) par `hideComplex = 1` sirf wahi set hota hai. `hideComplex == 0` par `houses` use hi nahi hota, dono branch identical.

### B2 — `getLineHousesInComplex()` galat column

```ts
// master ka fallback:
lineDetail.complex = Number(data);     // houseInComplex hona chahiye tha
```

Master **Complex** column overwrite karta tha aur **House in Complex** 0 chhod deta tha.

**Kab dikhta tha:** koi bhi city + External User (`hideComplex` se lena-dena nahi).

### B3 — `lineDetail` undefined par crash

Master me guard sirf pehli do line par tha, `lineDetail.markers` / `lineDetail.diff` guard ke bahar.

**Ho hi nahi sakta** — [line 895-898](Code/src/app/house-survey/ward-marking-summary/ward-marking-summary.component.ts#L895) par `lineMarkerList.push({lineNo: i})` ke turant baad `getLineMarkers(wardNo, i)` chalta hai, to `find()` hamesha milta hai. Dead code.

## 3.6 Comment cleanup

| Kahan | Kya tha |
|---|---|
| ~line 795 | Orphan comment jiske neeche koi code hi nahi — `// Whole MarkersData cache — heavy read ek hi baar...` |
| `getNewPathImageUrl` ke upar | Do line ek hi baat |
| `updateDeleteCounts` ke upar | `"Archive ab uid par flat hai"` (galat) neeche `"Archive purani jagah par hi hai"` (sahi) — path badla hi nahi tha |

## 3.7 Verified — koi change nahi chahiye

| Cheez | Nateeja |
|---|---|
| **Sikar ka `Sikar-Survey` override** | Service me maujood — [line 1213](Code/src/app/services/marker/marker-mapping.service.ts#L1213) `localStorage.getItem("cityName") == "sikar"`. Component ka `this.cityName` bhi wahi source. ✅ Same |
| **`summaryValue()`** | Master ke 2-step fallback ke bilkul barabar, bas 2 DB read ki jagah 1 in-memory check |
| **`resetEmptyLineSummaries()` ka hona** | Naya feature **nahi** — master me khali line ka node bacha rehta tha aur loop me aakar 0 ho jaati thi; naye path me `LineWise` node hi gayab ho jaata hai. Ye wahi gap bharta hai. ✅ Rakhna zaroori (uski field list ka issue 3.9 me) |
| **`parseInt(markerNo)` → `typeof == "object"`** | Union ki zaroorat — `parseInt("M12")` = NaN, warna wahi purane marker chhoot jaate jinke liye union banaya tha |
| **`updateDeleteCounts` ka loop refactor** | Output same (`totalRemovedMarkersCount` scalar hai, `typeof != "object"` par skip) |

## 3.9 `resetEmptyLineSummaries` 4 extra field zero kar raha tha — 🔴 data loss

Pehle ye check chhoot gaya tha aur point 2 galti se band kar diya gaya tha. User ne dobara khulwaya.

### Problem

`updateCounts` ise bulata hai. Field list thi — [marker-mapping.service.ts:1061](Code/src/app/services/marker/marker-mapping.service.ts#L1061):

```ts
lineCountFields = [
  "marksCount", "marksHouse", "marksComplex", "marksHouseInComplex",
  "actualMarksCount", "actualMarksHouse", "actualMarksComplex", "actualMarksHouseInComplex",
  "surveyedCount", "lineRevisitCount", "lineRfidNotFoundCount", "alreadyInstalledCount"   // ← ye 4
];
```

Par master me ye page khali line par sirf **8** field zero karta tha — wahi 8 jo `updateCounts` khud likhta hai ([line 1717](Code/src/app/house-survey/ward-marking-summary/ward-marking-summary.component.ts#L1717)).

Wo extra 4 marker ke count hain hi nahi:

| Field | Kya hai |
|---|---|
| `alreadyInstalledCount` | line par pehle se lage card |
| `surveyedCount` | survey ka progress |
| `lineRevisitCount` | revisit ki ginti |
| `lineRfidNotFoundCount` | RFID na milne ki ginti |

Line par marker 0 ho sakte hain par card/survey ka record phir bhi hota hai. **"Update Counts" dabate hi wo ud jaata** — aur wapas nahi aata (recalculate hone wala number nahi hai). Isi page ka **Already Card** column bhi 0 ho jaata.

### ⚠️ Pehla proposed fix GALAT tha

Maine array chhota karne ko kaha tha. User ne poocha *"isse pehle wala flow nahi bigdega kya"* — verify karne par nikla ki **bigadta**.

`resetEmptyLineSummaries` **4 pages** bulate hain:

| Page | Master me ye page khali line par kya zero karta tha |
|---|---|
| ward-marking-summary | sirf 8 count fields |
| line-marker-mapping | `marksCount` + wo 4 (master line 1047) |
| change-line-marker-data | wo 4 (master line 1254-1257) |
| ward-survey-summary | `surveyedCount`, `lineRevisitCount` (master line 719-720) |

Array 12 ka isliye tha ki wo **chaaron ka jod** hai. Chhota karne se baaki teen pages par purane counts pade reh jaate — wahi bug jiske liye ye function bana tha.

### ✅ Actual fix — field list caller se (user ne B chuna)

Service me naya list + optional param:

```ts
// Sirf marker ke count. Upar wali list CHAARON caller ka JOD hai.
markerCountFields = [
  "marksCount", "marksHouse", "marksComplex", "marksHouseInComplex",
  "actualMarksCount", "actualMarksHouse", "actualMarksComplex", "actualMarksHouseInComplex"
];

resetEmptyLineSummaries(db, ward, markerData, fields: any = null) {
  let fieldList = fields != null ? fields : this.lineCountFields;   // default = purani poori list
  ...
}
```

Component:
```ts
this.markerMapping.resetEmptyLineSummaries(this.db, zoneNo, markerData, this.markerMapping.markerCountFields);
```

| Page | Badla? |
|---|---|
| ward-marking-summary | ✅ ab sirf apne 8 field zero karta hai (master jaisa) |
| line-marker-mapping | ❌ ek line bhi nahi — default list par |
| change-line-marker-data | ❌ default list par |
| ward-survey-summary | ❌ default list par |

> Baaki teen pages jab review honge tab wo bhi apni list pass kar sakte hain.

## 3.10 Bacha hua

`tsc --noEmit` clean. **Runtime testing nahi hua** — export flow, counts, line table, image — sirf static review.

**Doosre page ka issue (yahan fix nahi karna):** [cms1.component.ts:3447](Code/src/app/cms1/cms1.component.ts#L3447) abhi bhi `surveyedCount` **purane path** (`MarkedHouses/{ward}/{line}`) par likhta hai — migration ke baad wo LineSummary tak pahunchega hi nahi. cms1 Phase 3 (#10) me hai.

---

# PAGE 4 — `house-survey/ward-survey-summary/ward-survey-summary.component.ts`

**Status:** ✅ Complete

## 4.1 Master ke 15 marking call sites — sab 1:1 map

Purane path ka **ek bhi live reference nahi bacha** (sab comment me reference ke liye hain).

| Master | Kaam | Ab |
|---|---|---|
| `MarkedHouses/{ward}` ×5 | ward ka data | `getWardRecords()` |
| `MarkedHouses/{w}/{l}` ×4 | line ke counts / houseHold write | `LineSummary/{w}/{l}` |
| `MarkedHouses/{w}/{l}/{n}` ×4 | marker read/write | `MarkersData/{uid}` |
| `MarkedHouses/{w}/{l}` ×1 | line ka data read | `getLineRecords()` |
| `MarkedHouses/{ward}` ×1 | `getSurveyDetail` | `LineSummary` + `getWardRecords` ka merge |

## 4.2 Cache — 5 me se 4 hataye

| Line | Kya DB me likhta hai | Faisla |
|---|---|---|
| `updateCounts_Bharat` | **LineSummary** | `clearWardSummary(zoneNo)` |
| `updateVirtualCards` | record ka `cardNumber` | ❌ hataya |
| ward select par reset | **kuch nahi** | ❌ hataya |
| `updateHouseType` | record ka `houseType` | ❌ hataya |
| houseType loop | record ka field, **per marker** | ❌ hataya |

Wajah [[marker-service-cache-rule]] me — record ka field badalne se `markerNo → uid` mapping basi hoti hi nahi.

## 4.3 `resetEmptyLineSummaries` — master wale 4 field

Master ka `updateCounts_Bharat` khali line par sirf ye likhta tha:
```ts
marksCount, surveyedCount, lineRevisitCount, actualMarksCount
```

Default 12-field list par chalte to ye page `marksHouse` / `marksComplex` / `alreadyInstalledCount` jaise **Ward Marking Summary ke field** bhi zero kar deta.

```ts
this.markerMapping.resetEmptyLineSummaries(this.db, zoneNo, markerData,
  ["marksCount", "surveyedCount", "lineRevisitCount", "actualMarksCount"]);
```

## 4.4 `console.log` + if/else — master jaisa wapas

Master me `console.log(isMarker)` tha aur do `if/else` branch jinke **body hu-ba-hu same** the, phir `lastMarkerKey` ka teesra alag write. Branch ne teeno ko ek patch me merge kar diya tha.

**Output bilkul same tha**, par master ki shakal alag thi — isliye master jaisa wapas kiya.

## 4.5 `getNewPathWardLineSummary` — cached banaya

Seedha `db.object()` se padhta tha, service ki cache use nahi karta tha. Ab `getWardLineSummaries()` se — par null semantics master jaisi rakhi:

```ts
return this.markerMapping.getWardLineSummaries(this.db, wardNo).then((data: any) => {
  return data != null && Object.keys(data).length > 0 ? data : null;   // {} ko null banao
});
```

Neeche wala block "ward me kuch hai hi nahi" ko `null` se pehchanta hai, aur old path bhi khali hone par null hi deta tha.

## 4.6 Structure ki majboori — rakhe gaye

| Change | Master me zaroorat kyun nahi thi |
|---|---|
| `parseInt(markerNo)` → `typeof == "object"` (2 jagah) | key hamesha number thi; ab uid key (`M12`) par `parseInt` = NaN → **marker ginti se gayab** |
| `lastMarkerKey` ab **max** leta hai | ascending keys me aakhri = sabse bada; uid key aakhir me `NaN` de deti thi |
| `getSurveyDetail` ka merge | pehle scalars + markers **ek hi node** me the |
| `resetEmptyLineSummaries` ka hona | khali line ka `LineWise` node hi gayab ho jaata hai |

## 4.7 Ward table migration se juda hi nahi

Upar wala **Ward table** (`Ward | Markers | Cards | Houses | Revisit`) alag node padhta hai:

```
EntityMarkingData/MarkingSurveyData/WardSurveyData/WardWise/{ward}   → marked, houseCount
EntitySurveyData/TotalRevisitRequest/{ward}                          → revisit
```

**Master me bilkul yahi tha.** Isiliye naya structure delete karne par bhi ward table me purane number rah jaate hain — wo "Update Counts" se hi banenge.

## 4.8 Verified — kuch nahi karna

`updateVirtualCards` ka `null` par skip (master bhi `if (markerData != null)` par skip karta tha), `readMarkerWard` ka `.catch()`, `getZoneHouseType` ka guard reorder — sab master ke barabar.

---

# PAGE 5 — `house-survey/line-card-mapping/line-card-mapping.component.ts`

**Status:** ✅ Complete

## 5.1 `showHouses` ke debug console.log — hataye

Master ka `showHouses` saaf tha. Branch me 2 `console.log` + 2 counter (`withLatLng`/`withoutLatLng`) + ek `else` branch **sirf log ke liye** jude the.

Ye function `Houses/` node padhta hai — **marking structure se juda hi nahi**. Map par pin lagane ka logic ek line bhi nahi badla tha.

Ab function **master se byte-identical** hai; file me 0 `console.log`.

## 5.2 `getSafeLastKey` — master jaisa wapas

**Branch me tha:** `lastMarkerKey` aur line ki asli sabse badi key, dono me se bada.
**Master me tha:** sirf `lastMarkerKey`, `readOnceWithRetry` ke saath.

```ts
let lastMarkerKeyData = await this.moveHelper.readOnceWithRetry(this.db,
  "EntityMarkingData/MarkersMapping/LineSummary/" + zone + "/" + lineTo + "/lastMarkerKey", this.run);
let startKey = 1;
if (lastMarkerKeyData != null) { startKey = Number(lastMarkerKeyData) + 1; }
```

**Kyun master jaisa:**
1. Max lena **path change nahi**, naya safety feature hai
2. `lastMarkerKey` chaaron writer maintain karte hain (cloud function peeche nahi jaane deta, portal, migration, aur `resetEmptyLineSummaries` ise chhodta hai)
3. Har move par destination line ka poora read bachta hai
4. **Saath me retry wapas aa gayi** — `getSafeLastKey` plain read tha

> `getSafeLastKey()` helper ab is page me **use nahi hota**, sirf define pada hai. Hataana baaki hai.

## 5.3 Retry / cancel / timeout — master jaisa

Bulk line read ka `readOnceWithRetry` chala gaya tha. Wrapper banaya jo master ke loop se line-by-line milta hai:

```ts
private async readLineDataWithRetry(ward: any, line: any): Promise<any> {
  let lastError: any = null;
  for (let attempt = 0; attempt < this.moveHelper.IMAGE_ATTEMPTS; attempt++) {
    if (this.run.isCancelled()) { throw new Error("cancelled"); }
    try {
      return await this.getNewPathLineData(ward, line);
    } catch (e) {
      lastError = e;
      if (!this.moveHelper.isNetworkError(e)) { break; }
      await this.moveHelper.waitForNetwork(this.run);
      await this.moveHelper.delay(500 * Math.pow(2, attempt));
    }
  }
  throw lastError;
}
```

Chalta isliye hai kyunki `isNetworkError()` `"db-timeout"` ko network error maanta hai, aur `cachePromise` fail hui promise cache se hata deta hai.

## 5.4 User ke faisle — rakhe gaye

| | |
|---|---|
| `MarkerWardMapping` me `image` → `markerkey` | ✅ rakha — image ab `markerkey` → uid → `imgRef` se aayegi, `image` field ki zaroorat hi nahi |
| `movedFrom*` + `MoveHistory/{uid}` | ✅ rakha — naya audit data (kisne, kab, kahan se kahan) |

## 5.5 Duplicate `saveMoveHistory` — pehle se theek

Master me ye function **do baar** define tha (line 442 aur 495). Body me farak sirf `note` wali line ki formatting ka tha. Branch ne ek hata diya — output same.

## 5.6 Structure ke changes — rakhe gaye

| Change | |
|---|---|
| **Image copy hata di** | image `AllMarkerImages/{uid}.jpg` par sthir hai — move par file transfer ki zaroorat hi nahi |
| `newImage` = `imgRef` | naam kabhi badalta hi nahi |
| Marker "move" | record apni jagah, sirf `ward`/`line`/`markerNo` patch + `writePlace()` |
| Purani line se hatana | record delete nahi — sirf `LineWise` entry |
| `clearLinkCache()` cleanup/rollback me | ✅ sahi — yahan **mapping sach me badalti hai** |

---

# PAGE 6 — `house-survey/line-marker-mapping/line-marker-mapping.component.ts`

**Status:** ✅ Complete

Page 5 se kaafi milta-julta. Chhe point mile, chaar theek kiye, do rakhe.

## 6.1 `updateCounts` ka cache

```diff
- this.markerMapping.clearLinkCache();        // poori cache
+ this.markerMapping.clearWardSummary(zoneNo); // sirf us ward ka summary
```

Master me cache thi hi nahi — ye naye structure ke saath aayi, isliye [[marker-service-cache-rule]] se naapa gaya.

## 6.2 `resetEmptyLineSummaries` — master wale 5 field

Master is page par khali line par ye 5 likhta tha:
```ts
marksCount, surveyedCount, lineRevisitCount, lineRfidNotFoundCount, alreadyInstalledCount
```

## 6.3 `getSafeLastKey` — master jaisa wapas

Page 5 wali hi wajah. **User ka faisla:** *"jo cheez master mein bhi same hai use rehne do"* — wo takraav ka hole master me bhi hai (`lastMarkerKey` move ke **sabse aakhir me** likha jaata hai, beech me ruk gaya to peeche reh jaata hai), isliye nayi safety nahi jodi.

## 6.4 Retry — Page 5 wala wrapper yahan bhi

`readLineDataWithRetry()` copy hua, bulk read uspar chala gaya.

## 6.5 Do write master jaise alag-alag

Branch ne counts aur `lastMarkerKey` ko ek patch me merge kar diya tha. Master me do alag `update()` the — wahi wapas:

```ts
this.db.object(dbPath).update({ marksCount, surveyedCount, lineRevisitCount, lineRfidNotFoundCount, alreadyInstalledCount })
if (lastMarkerKey > 0) {
  this.db.object(dbPath).update({ lastMarkerKey: lastMarkerKey });
}
```

## 6.6 `uid == null` par throw — RAKHA GAYA

```ts
row.failedStep = "Marker UID";
let uid = await this.getMarkerUid(zone, lineFrom, row.markerNo);
if (uid == null) { throw new Error("marker naye path par nahi mila (LineWise me uid nahi hai)"); }
```

**Pehle isse "naya behaviour" flag kiya tha — wo galat tha.** Master is page par pehle se throw karta tha:

```ts
let data = ctx.dataByMarkerNo[row.markerNo];
if (data == null) { throw new Error("marker data not found"); }   // ← master, line 846
```

Wo line **abhi bhi maujood hai**; naya throw uske saath kaam karta hai. Aur "dono move pages ka bartaav alag hai" wali baat bhi master ki apni hai — master ka `line-card-mapping` isi haalat me chup-chaap chhod deta tha.

**Throw safe hai:** kisi bhi write se pehle hota hai, `destMarkerWritten`/`destMappingWritten` false rehte hain, rollback ko karne ko kuch nahi bachta, row "Failed — Marker UID" dikhati hai, baaki markers normally move hote hain.

**Trigger hoga hi nahi:** rows usi data se banti hain jo `getLineRecords()` deta hai, to `getUid()` ke teen raaste (uid-key / LineWise / record ka `markerNo`) me se koi na koi mil hi jaata hai.

## 6.7 Backup — sahi hai, master jitna hi cover karta hai

| Move jo badalta hai | Backup me? | Master me tha? |
|---|---|---|
| `MarkersData/{uid}` | ✅ `markersData` | ✅ |
| `LineWise` / `WardWise` / `MarkerWise` | ✅ | — *(node hi nahi the)* |
| `Houses/{w}/{l}/{card}` | ✅ `houses` | ✅ |
| `CardWardMapping` / `HouseWardMapping` / `MarkerWardMapping` / `RevisitRequest` | ❌ | ❌ **master me bhi nahi** |
| `LineSummary/lastMarkerKey` | ❌ | ✅ *(scalars saath aate the)* |
| `MoveHistory/{uid}` | ❌ | — *(naya, rollback khud hata deta hai)* |

**Backup me poora node nahi jaata — sirf us line ke markers.** `lineWise` aur `houses` apne node ke liye poore hain (safe full import); `markersData` / `markerWise` / `wardWise` **shared node ke slice** hain, isliye unhe **uid ke hisaab se ek-ek** import karna hota hai. Sahi key par restore karne se kuch nahi mitega — warning sirf poore blob ko parent node par import karne ki galti se bachne ke liye hai. Rasta `meta.restorePaths` me likha hai.

`LineSummary` chhoot rahi hai par **nuksaan nahi**: move `ApproveStatus` ko chhuta hi nahi, aur counts "Update Counts" se ban jaate hain — ye `buildRestoreNotes()` me likha hua hai.

> 🟢 Chhoti safai baaki: `state` object me naye field (`uid`, `destMappingWritten`, `prevMoved`, `moveHistoryKey`) declare nahi hain — runtime par jud jaate hain, chalta theek hai.

---

# Shared service ke changes (`marker-mapping.service.ts`)

Ye page-review ke dauraan jude — teeno ka asar **saare pages** par hai.

## S.1 `clearWardSummary(ward)` — targeted cache clear

```ts
clearWardSummary(ward: any) {
  delete this.summaryCache[String(ward)];
}
```

`clearLinkCache()` chaaron cache (`linkCache`, `recordCache`, `markerCache`, `summaryCache`) uda deta hai. Jo page sirf `LineSummary` likhta hai use bas apne ward ka summary bhulana hai — poore shehar ka marker data dobara padhna nahi.

Use karte hain: Ward Marking Summary, Ward Survey Summary, Line Marker Mapping.

## S.2 `readOnce` par 30 second timeout

```ts
readTimeoutMs = 30000;   // MoveHelper ke READ_TIMEOUT_MS jitna hi
```

Pehle `readOnce` me **reject ka rasta hi nahi tha** aur na timeout. Net na ho aur path Firebase SDK ki local cache me bhi na ho to `valueChanges()` koi event bhejta hi nahi — promise **kabhi settle nahi hoti**. Move jaisa lamba kaam wahin latak jaata: na error, na message, Cancel bhi bekaar.

Old path par ye saare read `MoveHelper.readOnce` se jaate the jisme yahi timeout pehle se hai — **ye naya vyavhaar nahi, purana wapas hai**.

Timer read aate hi `clearTimeout` ho jaata hai (ek page hazaron read maarta hai).

## S.3 `cachePromise()` — fail hui read cache me nahi baithti

```ts
cachePromise(store: any, key: string, make: () => Promise<any>): Promise<any> {
  if (store[key] == null) {
    let p: any = make().catch((e: any) => {
      if (store[key] === p) { delete store[key]; }
      throw e;
    });
    store[key] = p;
  }
  return store[key];
}
```

Nakaam promise cache me pade rehna sabse buri haalat thi: ek read timeout hua to **har agla caller wahi mari hui promise pakadta** — page refresh tak dobara koshish hoti hi nahi. Old path par cache thi hi nahi, wahan har retry sach me nayi read bhejta tha.

Paanchon cache isi se guzarti hain: `markerCache`, `linkCache`, `summaryCache`, `recordCache` (line), `recordCache` (ward).

**S.2 + S.3 ka faayda chaaron move pages ko:** `line-card-mapping`, `line-marker-mapping`, `change-line-marker-data`, `change-line-surveyed-data`. Aakhri do abhi review nahi hue — unpar pahunch kar confirm karna hai.

## S.4 `resetEmptyLineSummaries(db, ward, markerData, fields?)`

Optional `fields` param. Na do to purani poori 12-wali list chalti hai, isliye purane caller bina chhede kaam karte rehte hain. Poora niyam [[reset-empty-line-summaries-field-list]] me.

---

# Cross-cutting fix — DevTest hardcode (5 jagah)

**Status:** ✅ Complete

## Problem

Image ka **source** path dynamic tha (`getFireStoreCity()` se), par **destination** hardcoded `DevTest/...` tha. Nateeja: saari cities ki images ek hi `DevTest` folder me jama ho rahi thi.

## Fix — 5 files

### `services/marker/marker-mapping.service.ts`
`imageBasePath` const → method:
```ts
imageBasePath(): string {
  return this.storageCity() + "%2FMarkingSurveyImages%2FAllMarkerImages%2F";
}
```
2 call sites `this.imageBasePath()` par update.

### `functions/marker-mapping.js`
```js
// pehle: const NEW_IMAGE_FOLDER = "DevTest/...";
function newImageFolder(entry) {
  return entry.oldImageFolder + "/MarkingSurveyImages/AllMarkerImages";
}
```
`copyImage()` ab `newImageFolder(entry)` use karta hai; export rename hua.

### `Developers/marker-data-move/marker-data-move.component.ts`
```ts
// pehle: pathNew = "DevTest/..."
pathNew = city + "/MarkingSurveyImages/AllMarkerImages/" + uid + ".jpg";
```

### `house-survey/ward-survey-analysis/ward-survey-analysis.component.ts`
`pathOld` — DevTest → `city + "/..."`

### `reports/card-transection-detail/card-transection-detail.component.ts`
`"DevTest%2F..."` → `city + "%2FMarkingSurveyImages%2FAllMarkerImages%2F"`

Iske alawa `functions/README.md` aur `line-marker-mapping.component.ts` ke stale DevTest comments update kiye.

---

# Verified — koi change nahi chahiye

## `marker-mapping.service.ts` ke functions

Ye sab padh kar verify kiye, **modify nahi kiye**:

| Function | Kya karta hai |
|---|---|
| `writePlace()` | teeno mapping likhta hai |
| `removeMarker(db, uid)` | record + 3 mapping null + `marksCount` transaction −1 |
| `writeMarker()` | data → `writePlace` → `lastMarkerKey` → `marksCount` +1 transaction |
| `moveMarker()` | `marksCount` ko **chhuta nahi** |
| `recordMove()` | `MoveHistory/{uid}` push |
| `getMoveHistory()`, `getLineRecords()`, `getWardRecords()` | read helpers |
| `buildWardLinks()` | `WardWise ∪ LineWise` union |
| `markerImageUrl()` | `imgRef` hai to flat folder, warna `oldImageUrl` |

## "Invisible data" wala dar — nahi hai

Teeno writer (app ka cloud function, migration, portal) saari mapping likhte hain, aur `WardWise ∪ LineWise` union hai. **Closed as not-a-problem.**

## Migration ke do genuine findings (scope se bahar — cloud function me)

1. `isRealMarker()` un records ko skip karta hai jinme `houseType` nahi hai
2. Sync **create-only** hai — app ke `MarkedHouses` par baad ke update kabhi `MarkersData` tak nahi pahunchte

**User ne confirm kiya:** #2 by design hai — *"data ek baar move hoga phir MarkersData hi use hoga"*, aur go-live se pehle saare ward migrate ho jayenge.

---

# Bacha hua kaam — Prioritized

## ✅ Ho gaye (2 pages)

| # | Page | |
|---|---|---|
| 1 | `house-marking.component.ts` + `.html` | ✅ |
| 2 | `house-marking-assignment.component.ts` | ✅ |
| 3 | `ward-marking-summary.component.ts` | ✅ *(debug console lage hain — test ke liye)* |
| 4 | `ward-survey-summary.component.ts` | ✅ |
| 5 | `line-card-mapping.component.ts` | ✅ |
| 6 | `line-marker-mapping.component.ts` | ✅ |

## 🟢 PHASE 1 — Turant (9 files, ~1.5 ghante)

| # | File | Lines | Note |
|---|---|---|---|
| 3 | `layouts/admin-layout/admin-layout.module.ts` | 2 | naya route register |
| 4 | `layouts/admin-layout/admin-layout.routing.ts` | 2 | naya route |
| 5 | `Developers/set-marker-images/set-marker-images.component.ts` | 12 | **page band kar diya** — decide karna hai |
| 6 | `Developers/manage-marking-data/manage-marking-data.component.ts` | 16 | **page band kar diya** — decide karna hai |
| 7 | `reports/due-amount-report/due-amount-report.component.ts` | 22 | seedha path swap |
| 8 | `reports/collected-amount-report/collected-amount-report.component.ts` | 22 | #7 ka copy — saath dekho |
| 9 | `services/common/move-helper.service.ts` | 25 | cache clear |
| 10 | `reports/card-transection-detail/card-transection-detail.component.ts` | 71 | sirf image URL |
| 11 | `house-survey/supervisor-report/supervisor-report.component.ts` | 121 | 5 marking refs |

## 🔵 PHASE 2 — Marking se lena-dena nahi (7 files, ~30 min)

| # | File | Lines | Note |
|---|---|---|---|
| 12 | `realtime-monitoring/realtime-monitoring.component.ts` | 27 | 🔴 **6 `console.log` bache hue** + bharatpur Rickshaw filter |
| 13 | `payment-collector/*` (ts+html+scss) | 223 | naya UI |
| 14 | `EmployeeManagement/monthly-attendance/*` (ts+html+scss) | 91 | naya UI |

## 🟡 PHASE 3 — Medium (7 files, ~4 ghante)

| # | File | Lines | Marking refs |
|---|---|---|---|
| 15 | `cms1/cms1.component.ts` | 138 | 26 |
| 16 | `PortalServices/change-line-surveyed-data/...` | 200 | 42 |
| 17 | `Developers/add-marker-against-cards/...` | 204 | 14 |
| ~~18~~ | ~~`house-survey/line-card-mapping/...`~~ | — | ✅ **ho gaya** |
| 19 | `PortalServices/change-line-marker-data/...` | 263 | 51 |
| ~~20~~ | ~~`house-survey/line-marker-mapping/...`~~ | — | ✅ **ho gaya** |
| 21 | `Developers/card-marker-mapping/...` | 291 | 46 |

## 🔴 PHASE 4 — Bhaari (4 files, ~6 ghante)

| # | File | Lines | Marking refs |
|---|---|---|---|
| ~~22~~ | ~~`house-survey/ward-survey-summary/...`~~ | — | ✅ **ho gaya** |
| 23 | `house-survey/ward-survey-analysis/...` | 394 | **103** ⚠️ |
| ~~24~~ | ~~`house-survey/ward-marking-summary/...`~~ | — | ✅ **ho gaya** |
| 25 | `marker-approval-test/...` | 495 | 67 |

## ⚪ PHASE 5 — Naye files (master se compare ho hi nahi sakta)

| # | File | Lines |
|---|---|---|
| 26 | `services/marker/marker-mapping.service.ts` | 1294 🆕 |
| 27 | `Developers/marker-data-move/*` (ts+html+scss) | 876 🆕 |
| 28 | `functions/*` (6 files) | ~570 🆕 |

---

# Process Notes

- Change karne se **pehle** user se discuss karna hai
- Code ke comment par bharosa nahi — actual code se verify karna hai
- Ek page complete kiye bina agle page par nahi jaana
- Behaviour change default me **hatana** hai, chahe wo logically sahi lage

---

# Cross-cutting fix — Master ke crash guards (user ne "A" chuna)

**Status:** ✅ Complete

Ye dono crash **master ke apne bug** hain, migration se nahi aaye. Rule
"master jaisa rakho" ke bawajood user ne fix karne ko bola, kyunki master
yahan **crash** karta hai — wo behaviour nahi hai.

Dono ka ek hi karan: `EntityMarkingData/WardSurveyData/WardWise/{ward}` aur
`EntityMarkingData/LastScanTime/Ward/{ward}` "Update Counts" dabane par bante
hain. Naye / kabhi update na hue ward par node ya field hoti hi nahi.

## C.1 `house-marking.component.ts` — `getTotalMarkers()`

Line 287-292. `alreadyInstalled` par guard pehle se tha, baaki 3 par nahi:

```ts
// pehle
this.markerData.totalMarkers = data["marked"].toString();          // undefined.toString()
this.markerData.approvedLines = data["approved"].toString();        // ← line 291 crash
this.markerData.totalHouseTypeModifiedCount = data["totalHouseTypeModifiedCount"].toString();

// ab — teeno par wahi guard jo alreadyInstalled par tha
if (data["marked"] != null) { ... }
if (data["approved"] != null) { ... }
if (data["totalHouseTypeModifiedCount"] != null) { ... }
```

Error tha: `TypeError: Cannot read properties of undefined (reading 'toString')`

## C.2 `ward-marking-summary.component.ts` — `getMarkingDetail()`

Line 858. `split()` null check se **pehle** chal raha tha:

```ts
// pehle
let lastscandata = data.split(":");        // ← null.split() crash
let scandata = lastscandata[0] + ":" + lastscandata[1];
if (data != null) { ... this.markerData.lastScan = scandata; }

// ab — split if ke andar
if (data != null) {
  let lastscandata = String(data).split(":");
  let scandata = lastscandata[0] + ":" + lastscandata[1];
  this.markerData.lastScan = scandata;
}
```

Error tha: `TypeError: Cannot read properties of null (reading 'split')`

`String(data)` isliye ki node me number aa jaaye to bhi na phate.

## Note

Ye 3.5 wale "Master ke 3 bug — RAKHE GAYE" se alag hain. Wo teeno **galat
value** dikhate hain (page chalta rehta hai), ye do **page hi tod** dete hain.

---

# S.5 `getUid()` fallback — 🔴 silent write loss (asli bug)

**File:** `services/marker/marker-mapping.service.ts` → `getUid()`
**Status:** ✅ Fixed

## Symptom

House Marking par marker approve karo — screen par "approved" ho jaata hai,
success message bhi aata hai, par **DB me kuch nahi likha jaata**. Koi error
nahi, koi console nahi. Sirf approve nahi — us marker ki har write gayab.

## Karan

Jis marker ki `LineWise` entry nahi hai (sirf `WardWise` me hai), uski link key
**uid** hoti hai, number nahi:

```
buildWardLinks:320-323  ->  markersData null hai, to record null
                        ->  markerNo = "" -> key uid ban jaati hai
links = { "M123": "M123" }
```

`shapeLine():666-672` display ke liye key badal deta hai:

```
lineData = { "5": record }        // page par marker #5 dikhta hai
```

Ab `getUid(ward, line, "5")`:

| Step | Nateeja |
|---|---|
| `links["5"]` | ❌ undefined (key `"M123"` hai) |
| fallback: `lineData["5"].markerNo == "5"` | ✅ mila |
| `uidFromRecordKey("5", links)` | `"5"` `M` se shuru nahi -> `links["5"]` -> ❌ **null** |

uid `null` -> `getMarkerDataPath` `null` -> har caller `if (path != null)` ke
andar likhta hai -> **write skip, chup-chaap**.

Galti ye thi ki fallback `shapeLine` ki **badli hui** key `uidFromRecordKey` ko
de raha tha, jabki wo function **asli link key** maangta hai.

## Fix

Fallback `shapeLine` ki reshaped keys se guzarna hi band kar diya — seedha
`links` ki values (uid) par record match:

```ts
// pehle
return this.getLineRecords(db, ward, line).then((lineData: any) => {
  ...
  return this.uidFromRecordKey(keyArray[i], links);   // reshaped key -> null
});

// ab
let uidArray = Object.keys(links).map((key: any) => links[key]);
return this.getMarkerRecords(db, uidArray).then((records: any) => {
  for (let i = 0; i < uidArray.length; i++) {
    let record = records[uidArray[i]];
    if (record != null && String(record["markerNo"]) == String(markerNo)) {
      return uidArray[i];
    }
  }
  return null;
});
```

| | |
|---|---|
| Pehla raasta `links[markerNo]` | **nahi chhua** — jo marker sahi chal rahe the waise hi |
| Extra DB read | **0** — `getMarker()` cached, line khulte waqt hi aa chuke hote hain |
| Page files | **koi nahi chhedi** |
| Marker dikhna/chhupna | **nahi badla** |
| `uidFromRecordKey()` | ab **unused** — delete nahi kiya, user ke kehne par hatega |

## Asar

Har page jo `getUid` / `getMarkerDataPath` use karta hai. House Marking par
approve, reject, houseType, markerRemark, building detail — sab.

## Note — "mapping nahi hai to marker show nahi hona chahiye"?

Nahi. Mapping **hai** — `WardWise` me. Missing sirf `LineWise` hai. Marker asli
hai, uid hai, record hai. Master me bhi dikhta tha. Kharabi dikhane me nahi,
uid wapas dhoondhne me thi.

---

# PAGE 8 — Marker Approval (`marker-approval-test`)

**Status:** 🟡 Chal raha hai — abhi sirf ek fix, poora review baaki

Ye page apna alag implementation rakhta hai - `MarkerMappingService` ke
`getLineRecords`/`getWardRecords` use NAHI karta. Iske apne cache aur apne
index reader hain:

| Iska apna | Kaam |
|---|---|
| `wardIndexCache` | `MarkersMapping/WardWise/{ward}` raw |
| `markerRecordCache` | `MarkersData/{uid}` raw |
| `loadWardIndex()` / `getLineUids()` | WardWise se line ke uid |
| `getLineUidsFromLineWise()` | fallback, sirf jab WardWise us line par khaali ho |
| `readMarkerRecords()` | uid -> record, jiska record na ho wo chhod deta hai |
| `getNewPathLineData()` | `{ uid: record }` (key uid hai, markerNo nahi) |

Cache sirf **ward badalne** par clear hote hain (`line 164-165`).

## 8.1 `getMarkerNewPath()` mapping check kiye bina path bana raha tha — 🔴 fix kiya

### Problem

```ts
// pehle
if (markerNo != null && String(markerNo).charAt(0) == "M") {
  return Promise.resolve("EntityMarkingData/MarkersData/" + markerNo);
}
```

Sirf `"M"` dekh kar path bana deta tha. Nateeja: jis marker ki mapping
(`WardWise`/`LineWise`) hata di gayi ho, uspar bhi approve / reject /
houseType / remove ki write `MarkersData/{uid}` par chali jaati thi.

House Marking se **ulta** behaviour - wahan `getUid` mapping se hi resolve
hota hai aur na milne par write skip hoti hai.

### Fix

Uid aane par bhi mapping check hoti hai, aur check **wahi** hai jis se list
banti hai - isliye jo screen par dikh raha hai wo hamesha paas hoga:

```ts
if (markerNo != null && String(markerNo).charAt(0) == "M") {
  let uid = String(markerNo);
  return this.loadWardIndex(ward).then((wardIndex: any) => {
    if (wardIndex != null && String(wardIndex[uid]) == String(line)) {
      return "EntityMarkingData/MarkersData/" + uid;
    }
    return this.getLineUidsFromLineWise(ward, line).then((oldUids: any) => {
      return oldUids.indexOf(uid) >= 0 ? "EntityMarkingData/MarkersData/" + uid : null;
    });
  });
}
```

| | |
|---|---|
| Extra DB read | 0 normal case me (`loadWardIndex` cached) |
| LineWise read | sirf tab jab WardWise me na mile - wahi rare raasta |
| Purana markerNo (1,2,3) wala raasta | **nahi chhua** |
| Callers | 5 - `houseType`, `modifiedHouseTypeHistoryId`, `removeMarker`, `reject`, `approve`. Sab ab mapping ke bina skip karenge |

## 8.2 Khula sawaal — "bina mapping ka record dikh raha hai"

Code padh kar dekha: is page ki list **mapping se hi** banti hai
(`WardWise`, ya `LineWise` fallback), aur `readMarkerRecords()` jiska record
na mile use chhod deta hai. Yaani **list = mapping ∩ record** - mapping ke
bahar se kuch aa hi nahi sakta.

Agar phir bhi dikhe to teen wajah:

1. **Cache** - `wardIndexCache` / `markerRecordCache` sirf ward badalne par
   clear hote hain. Mapping DB se hataakar wahi ward dobara khola to purana
   index memory se chal raha hoga. Hard refresh se confirm karna hai.
2. Mapping doosri jagah bachi hai (WardWise se hataayi, LineWise me reh gayi).
3. Page ke apne log dekhne hain - refresh karke line kholne par:
   `[marker-approval] ward: X line: Y wardIndex keys: N line uids: M [...]`

**Confirm hona baaki hai.** Us marker ka ward/line/uid aur upar wale console
log chahiye.

## 8.3 Bacha hua

- Poora page review nahi hua - sirf 8.1 fix hua
- TEMP DEBUG lage hue hain: `debugApprove()` + approve ke aas-paas console.log
  (`========== APPROVE REPORT ==========`) - baad me hatane hain
- Ye page apna alag cache/index rakhta hai jabki service me wahi kaam pehle se
  hai - ek din merge karne layak, par abhi **nahi chhedna**

---

# S.6 Link index — UNION hataya, ab DONO mapping zaroori (user ka faisla)

**File:** `services/marker/marker-mapping.service.ts` -> `buildWardLinks()`
**Status:** ✅ Laga diya
**Asar:** 🔴 BADA — har wo page jo `MarkerMappingService` se list banata hai

## Faisla

User: *"marker jo hein ward wise and line wise dono mein hona chaye okay tab
hi show hoga"*

Chetavni pehle di gayi thi (LineWise adhoora hai, bahut marker gayab ho
sakte hain), user ne dobara confirm kiya.

## Pehle kya tha (UNION)

```
result = LineWise ki saari entry
       + WardWise ke bache hue uid (record ke markerNo par, ya uid par)
```

Wajah: `LineWise` ADHOORA hai — app ka cloud function kaafi samay tak wo node
likhta hi nahi tha, aur purani migration ke marker bhi usme nahi aaye. Un
markers ka record `MarkersData` me hai aur `WardWise` me bhi, sirf `LineWise`
me nahi. Union ke bina wo poori line khaali dikhti thi.

## Ab kya hai (INTERSECTION)

`LineWise` par chalte hain, aur har entry par do shart:

```ts
if (String(index[uid]) != String(lineNo)) { continue; }   // WardWise me bhi, usi line par
if (markersData != null && markersData[uid] == null) { continue; }
```

- `LineWise` node hi na ho -> poora ward khaali
- `WardWise` me uid na ho -> marker nahi dikhega
- Dono me ho par **line alag** batayein -> marker nahi dikhega (kisi bhi line
  par bharosemand nahi hai)
- `placed` variable ki zaroorat khatam

## Nateeja

| | |
|---|---|
| List / map | sirf wo marker jo dono mapping me hain |
| Write | `getUid` bhi ab wahi links dekhta hai -> adhoore marker par write skip |
| `Ansh` ward (test data) | `LineWise/Ansh/1` khaali hai -> **ab 0 marker dikhenge** |

## Khule sire (abhi NAHI chhede)

1. `getUid()` ka `"M"` shortcut (line ~421) mapping check kiye bina uid laut
   deta hai. Ab keys hamesha markerNo hoti hain, par agar koi caller seedha uid
   de to write mapping ke bina chali jayegi. Move flows uid pakadte hain,
   isliye bina pooche nahi badla.
2. `marker-approval-test` apna alag reader rakhta hai (`getLineUids` — sirf
   WardWise, `getLineUidsFromLineWise` — fallback). Wo abhi bhi WardWise-only
   marker dikhayega. Naye niyam se align karna ho to alag se karna hoga.
3. `shapeLine()` ka uid-key wala hissa (line ~666) ab bekaar hai — keys hamesha
   markerNo hoti hain. Hataya nahi.
4. `uidFromRecordKey()` — S.5 se unused.

## Asli sawaal jo abhi bhi khula hai

`LineWise` khaali kyun hai? Do wajah:
1. Migration ne `LineWise` likhi hi nahi
2. Kisi ne node delete kiya

Agar (1) hai, to asli fix migration me `LineWise` likhwana hai — display se
hatana sirf lakshan chhupata hai.

---

# S.7 Image URL — purana path fallback hataya (user ka faisla)

**File:** `services/marker/marker-mapping.service.ts`
**Status:** ✅ Service me laga | 🟡 4 page abhi baaki

## Faisla

User: *"sab new path se hona chaye old image nhi use hoga"*

## Pehle

```ts
markerImageUrl(entry, ward, line) {
  if (entry["imgRef"]) return AllMarkerImages/{imgRef};
  return this.oldImageUrl(entry["image"], ward, line);   // {city}/…/{ward}/{line}/{image}
}
imageUrlFromName(name, ward, line) {
  if (/^M[0-9]+\.jpg$/i.test(name)) return AllMarkerImages/{name};
  return this.oldImageUrl(name, ward, line);
}
```

## Ab

Dono me fallback ki jagah `return ""`.

| Marker | Pehle | Ab |
|---|---|---|
| `imgRef` hai | AllMarkerImages se image | **same** |
| `imgRef` nahi | purani jagah se image dikhti thi | 🔴 image nahi dikhegi (file Storage me hoti hui bhi) |

Migration chalne par apne aap wapas aa jayegi.

- `ward`/`line` parameters ab bekaar, par signature **nahi badla** — 15+ call
  site inhe bhejte hain
- `oldImageUrl()` ab koi nahi bulata. Delete nahi kiya, comment laga diya
- Purane naam ko flat folder me jodna KABHI nahi — us folder me wo file hai hi
  nahi, sirf tooti image milti hai. Khaali URL behtar hai

## ✅ 3 page jo apna URL khud banate the — theek kar diye

Ye teenon service se guzarte hi nahi the, apna `imgRef ? naya : purana` ternary
rakhte the. Teenon jagah `else` wala purana raasta hata diya:

| File | Pehle | Ab |
|---|---|---|
| `house-survey/house-marking` (deleted-markers list) | ternary, else me per-line URL | `this.getNewPathImageUrl(dataKey)` |
| `marker-approval-test` (deleted-markers list) | wahi | `this.getNewPathImageUrl(dataKey)` |
| `reports/card-transection-detail` | URL haath se banta tha (dono branch) | `this.markerMapping.markerImageUrl(marker)` |

Teenon jagah local `city` aur `image` variable bhi hat gaye (ab kahin use nahi
the). `sikar` wala city override ab service ke `storageCity()` se aata hai — ek
hi jagah.

`tsc --noEmit` clean.

## ℹ️ Correction — `ward-survey-analysis:751` live NAHI hai

Pehle ise "live" likha gaya tha. Wo galat tha — line 731-755 ek `/* */` block
ke andar hain. Wahan kuch nahi karna. (Us commented code me bucket bhi hardcoded
hai: `dtdnavigator.appspot.com`.)

## ❌ Ye NAHI chhedne

`cms1:1860`, `Developers/set-marker-images:114`, `Developers/marker-data-move:674`,
`Developers/manage-marking-data:100` — ye migration ka **source** path hai
(purani file yahi se padh kar `AllMarkerImages/{uid}.jpg` par copy hoti hai).
Hataya to migration hi tootegi.

---

# PAGE 9 — Change Line Marker Data (`PortalServices/change-line-marker-data`)

**Status:** ✅ Complete
**Master se diff:** 276 line

Ye teesra move page hai (Page 5 line-card-mapping aur Page 6 line-marker-mapping
ke baad). `MoveHelperService` ke bajaye apne `dbUpdate`/`dbSet`/`dbRemove`
rakhta hai.

## 9.1 `image` ka naam har move par naya ban raha tha — 🔴 fix kiya

```ts
// pehle (runMoveLoop me)
row.newImage = key + ".jpg";        // "57.jpg" - har move par naya naam

// ab
let data = ctx.markerData[row.markerNo];
row.newImage = (data != null && data["imgRef"] != null) ? data["imgRef"] : row.oldImage;
```

Master me `key + ".jpg"` **sahi** tha, kyunki master file ko
`{zoneTo}/{lineTo}/57.jpg` par **copy** karta tha (master:976-978). Naye
structure me image `AllMarkerImages/{uid}.jpg` par flat padi hai aur move par
hilti hi nahi, isliye copy hata di gayi — par **naam badalna peeche reh gaya**.
Do change aapas me mel nahi khate the.

| Marker | Pehle | Ab |
|---|---|---|
| `imgRef` hai | `image` = `"57.jpg"` — purana naam kho gaya (URL imgRef se banta tha to dikhti rahi) | `imgRef` |
| `imgRef` nahi | `image` = `"57.jpg"`, file kahin banayi hi nahi — 🔴 image **permanently toot** jaati | purana asli naam |

Rollback ka masla bhi khatam - `undo` patch me `image` tha hi nahi, to fail par
galat naam pada reh jaata tha. Ab naam badalta hi nahi.

`newKey` / `newMarkerNo` **nahi chhue** - wo line par serial hai, move par
badalna hi chahiye.

Page 6 par ye pehle se laga hua tha (`line-marker-mapping:872-873`).

## 9.2 `resetEmptyLineSummaries` bina field list — 🔴 fix kiya

```ts
// pehle: default 12-wali list -> 7 extra field zero
await this.markerMapping.resetEmptyLineSummaries(this.db, zoneNo, markerData);

// ab: wahi 5 jo ye page khud likhta hai
await this.markerMapping.resetEmptyLineSummaries(this.db, zoneNo, markerData,
  ["marksCount", "surveyedCount", "lineRevisitCount", "lineRfidNotFoundCount", "alreadyInstalledCount"]);
```

**Master me kitne zero hote the: exactly 5.** Master ka loop har line par yahi 5
field hamesha likhta tha (master:1252) - khaali line par ginti 0 par aa girti
thi, alag se "zero karne" wala koi step tha hi nahi. Khaali line loop me aa
jaati thi kyunki old path me line ka node scalars ki wajah se zinda rehta tha.

Baaki 7 (`marksHouse`, `marksComplex`, `marksHouseInComplex`, `actualMarks*`)
master ne **kabhi haath nahi lagaye** - wo Ward Marking Summary ke hain.

## 9.3 Retry wapas — 🔴 fix kiya

Master dono reads par `readOnceWithRetry` use karta tha; branch me dono bina
retry ke the.

Naya wrapper `readWithRetry(read)` daala - `readOnceWithRetry` ke exactly wahi
15 line, sirf `this.readOnce(path)` ki jagah `read()` thunk. `readOnceWithRetry`
**chhua nahi**.

| Read | Pehle | Ab |
|---|---|---|
| source line | `getNewPathLineData(...)` | `readWithRetry(() => getNewPathLineData(...))` |
| `lastMarkerKey` | `getSafeLastKey(...)` | `readWithRetry(() => getSafeLastKey(...))` |

## 9.4 Read se pehle wali `clearLinkCache()` hatayi

Do jagah - `updateWardMarker()` aur `recalcZoneCounts()` - function ki pehli
line par poori cache udayi ja rahi thi, phir ward ka data padha jaata tha.

Zaroorat nahi: har `dbUpdate`/`dbSet`/`dbRemove` me `clearMarkerCache(path)`
lagi hai jo `MarkersData`/`MarkersMapping` wale path par `clearLinkCache()`
bula deti hai, aur `writePlace()` khud bhi karta hai.

**Bachat:** `N + 2` reads (N = ward ke marker) - 2000 marker ward par ~2002.
Move ke baad kuch nahi bachta (cache waise bhi khaali hoti hai), par "Update
Marker Counts" / `updateWardMarker` button akela dabane par pura bachta hai.

Page 3, 4, 6 par yahi pattern pehle laga hua hai.

## 9.5 `state` object me 4 naye field declare kiye

Master wale 8 **jyon ke tyon**. Neeche 4 nayi jodi jo new structure ke saath
aayi thi par declare nahi thi: `uid`, `destMappingWritten`, `prevMoved`,
`moveHistoryKey`. Type `any` kar diya.

Zero behaviour change - sirf padhne ki safaai. `destMappingWritten` set hoti
hai par **kahin padhi nahi jaati** (rollback me mapping hataana
`destMarkerWritten` ke andar hai). Rakhi hai, hatayi nahi.

## ✅ Verified — kuch nahi karna

- **Backup** sahi hai: `buildLineBackup` chaaron node theek shape me banata hai
  (`markersData` / `lineWise` / `markerWise` / `wardWise`), record move se
  **pehle** padha jaata hai isliye `markerWise`/`wardWise` me purani ward/line
  jaati hai, aur `restorePaths` + `skippedNoUid` + `orphanLinks` meta me hain
- `LineSummary` backup me nahi - jaan-bujh kar, restore ke baad Update Counts
- `MarkerWardMapping` backup me nahi - **master me bhi nahi tha**
- Image copy hataana, `uid == null` par throw, MoveHistory + uski rollback
  entry, rollback me record delete na karna - sab sahi

## ❌ Band kiye (user ka faisla)

| # | Kya | Kyun band |
|---|---|---|
| P3 | `getSafeLastKey` ka form | logic master se **behtar** hai (lastMarkerKey ke saath line ki asli sabse badi key bhi dekhta hai), retry 9.3 me lag gayi |
| P4 | do write ek patch me merge | merged **behtar** hai - aadhe write, aur ek hi atomic call. Master me do alag the par wahan bhi Page 4/6 par dono `await` ke bina chalti hain (koi gap nahi), yahan dono `await` hoti hain - to yahan merged rakhna hi theek |
| P7 | naya "MOVE MARKER DATA TO NEW PATH" button | test case, nahi chhedna |
| P8 | `MarkerWardMapping` me `image` -> `markerkey` | test case, nahi chhedna |

## 🔜 Baad ke liye — P5b

`clearMarkerCache(path)` ka path-match bahut mota hai: `LineSummary` par likhne
par bhi **poori** cache udti hai. `recalcZoneCounts` ke write loop me 50-line
ward par **50 baar poori cache wipe** hoti hai.

Nuksaan abhi nahi hota (saare reads pehle ho chuke hote hain), par `LineSummary`
par sirf `clearWardSummary(ward)` chahiye tha. Path se ward parse karna padega
aur ye helper move ke saare writes par lagi hai - isliye alag se, thehar kar
karne wali cheez hai.

---

# S.8 Cache — write par poori cache udna band (user ka faisla)

**Status:** ✅ Complete — 9 file
**Faayda:** ek marker approve/edit ke baad ward dobara padhna **~2002 read se 1 read**

## Problem

`clearLinkCache()` chaaron cache ek saath udata tha:

| Cache | Kya | Dobara banne ka kharcha |
|---|---|---|
| `linkCache` | WardWise + LineWise raw | **2 read** |
| `recordCache` | shaped `{markerNo: record}` | **0 read** (markerCache se banti hai) |
| `markerCache` | `MarkersData/{uid}` har ek | 🔴 **N read** (2000 marker = 2000) |
| `summaryCache` | `LineSummary/{ward}` | 1 read |

Saara kharcha `markerCache` me hai. Par mapping badalne se record badalta hi
nahi — record `uid` se bandha hai aur **uid kabhi nahi badalta**.

Nateeja: ek marker approve karte hi poore ward ke 2000 record phenk diye jaate
the. 10 marker approve = **~20,000 read**.

## Fix — service me 3 naye function

```ts
clearLinks()          // mapping badli: linkCache + recordCache + summaryCache
dropMarker(uid)       // ek record badla: us uid ki cache + recordCache
clearForPath(path)    // path dekh kar khud faisla
```

`clearForPath()` ka rule:
- `MarkersData/{uid}/...` -> `dropMarker(uid)`
- `MarkersMapping/...`    -> `clearLinks()`

`clearLinkCache()` **rakha gaya** - sirf wahan jahan sach me poora reset chahiye.

`dropMarker` `recordCache` bhi saaf karta hai, kyunki `shapeLine` record ka
**reference** rakhta hai (copy nahi) - chhod dein to purana record shaped list
me zinda reh jaata. Dobara banne me koi read nahi lagti, bas us ek uid ki.

## Kahan-kahan laga

| File | Kya |
|---|---|
| `services/marker/marker-mapping.service.ts` | 3 naye function; `writePlace` -> `clearLinks()`; `removeMarker` / `writeMarker` / `moveMarker` -> `dropMarker(uid)` |
| `services/common/move-helper.service.ts` | `clearMarkerCache(path)` -> `clearForPath(path)` (3 move page iske peeche hain) |
| `PortalServices/change-line-marker-data` | apni `clearMarkerCache(path)` -> `clearForPath(path)`; 2 site -> `clearLinks()` |
| `house-survey/house-marking` | `updateMarkerData()` -> `clearForPath(markerPath)` |
| `house-survey/line-card-mapping` | 2 site -> `clearLinks()` |
| `house-survey/line-marker-mapping` | 2 site -> `clearLinks()` |
| `PortalServices/change-line-surveyed-data` | 2 site -> `clearLinks()` |
| `house-survey/ward-survey-analysis` | 5 site -> `clearForPath(newMarkerPath)` |
| `Developers/card-marker-mapping` | 3 site -> `dropMarker(uid)` / `clearLinks()` |
| `marker-approval-test` | apni alag cache thi - naya `dropMarkerRecord(path)`, 5 site uspar |

## `clearLinkCache()` ab sirf 5 jagah — sab jaayaz

| File | Kab |
|---|---|
| `house-marking:232` | ward badla |
| `ward-survey-analysis:207` | ward badla |
| `marker-approval-test:166` | ward badla |
| `card-marker-mapping:49` | `resetNewPathCache()` - operation shuru |
| `marker-data-move:274` | poore ward ki migration khatam |

## Nateeja

| Kaam | Pehle | Ab |
|---|---|---|
| Ek marker approve/edit | ~2002 read | **1** |
| Marker move (mapping badli) | ~2002 | **2** |
| 10 marker approve + ward dekha | ~20,000 | **~2020** |
| Page refresh | 2002 | 2002 (waisa hi) |

## Naya risk — jaan lena zaroori

Pehle poori cache udti thi, isliye stale data ka risk **zero** tha. Ab har wo
jagah jahan `MarkersData/{uid}` par likha jaata hai, `clearForPath` /
`dropMarker` se guzarni chahiye. Ek chhoot gayi to **wo marker purana dikhega**.

Isliye upar wali list poori honi chahiye. Naya write site banate waqt yaad
rakhna: seedha `db.object(...).update()` mat likhna, funnel se jaana.

`tsc --noEmit` clean (sirf purana `e2e/app.e2e-spec.ts` ka error, jo pehle se hai).

## 🔜 Aage aur ho sakta hai

`linkCache` ko bhi jagah par update kiya ja sakta hai (move par purani entry
hata kar nayi daal do) - to wo 2 read bhi bach jaayein. Par usme har case
(ward badla / line badli / markerNo badla) theek se handle karna padega; ek
bhi chhoota to **galat data**, jo 2 read se bahut bura hai. Abhi nahi kiya.

Sabse badi bachat isse bhi zyada `wardQueryEnabled` me hai: **2002 -> 3 read**,
pehli baar padhne par bhi. Uske liye DB rules me chahiye:
`"MarkersData": { ".indexOn": ["ward"] }` - **index ke bina ON mat karna**,
warna RTDB chupchaap poora `MarkersData` (poore sheher ke marker) utaar dega.

---

# S.8b Cache ab PHENKI nahi jaati — patch laga kar theek hoti hai

**Status:** ✅ Complete
**Faayda:** ek marker edit par **1 read se 0 read**

## Faisla

User: *"agar mein page per kuch bhi update karta hu to database or cache dono
update honge taki user ko real time and after refresh vo hi data mile jo vo
edit, add and view kiya hota hein"* aur *"or hi record update hoga jo select
huaa hoga"*

## Fix

`clearForPath(path, patch?)` ab optional patch leta hai:

| Path | patch | Kya hota hai | Reads |
|---|---|---|---|
| `MarkersData/{uid}` | diya | `applyPatch()` - cache wale record par wahi patch | **0** |
| `MarkersData/{uid}/field` | koi bhi | `dropMarker(uid)` - poora record nahi hai | 1 |
| `MarkersData/{uid}` | nahi diya | `dropMarker(uid)` | 1 |
| `MarkersMapping/...` | — | `clearLinks()` | 2 |

```ts
applyPatch(uid, patch) {
  let cached = this.markerCache[String(uid)];
  if (cached == null) { return; }          // cache me hai hi nahi
  cached.then((record) => {
    for (let key of Object.keys(patch)) {
      if (patch[key] == null) { delete record[key]; }   // null = field hatao
      else { record[key] = patch[key]; }
    }
  }, () => { delete this.markerCache[String(uid)]; });   // read hi fail thi
}
```

**Sirf wahi ek record chhua jaata hai** jiska path diya gaya. Baaki records,
`linkCache`, `summaryCache` - kuch nahi.

`shapeLine` cache wale USI object ka reference rakhta hai (copy nahi), isliye
field badalte hi wo har shaped list, map aur table me apne aap sahi ho jaata
hai - `recordCache` saaf karne ki bhi zaroorat nahi.

## Kahan-kahan patch jaane laga

| File | Kya |
|---|---|
| `move-helper.service.ts` | `dbUpdate` -> patch bhejti hai; `dbSet` nahi (set poora node replace karta hai) |
| `change-line-marker-data` | wahi - `dbUpdate` patch ke saath, `dbSet` bina |
| `house-marking` | `updateMarkerData(path, patch)` -> `clearForPath(path, patch)` |
| `ward-survey-analysis` | 5 site. Jahan aage `.set(null)` bhi hoti hai wahan patch me wo field `null` jodi (`revisitKey`, `rfidNotFoundKey`) |
| `card-marker-mapping` | 3 site `applyPatch`; move wali jagah `applyPatch` + `clearLinks()` |
| `marker-approval-test` | apni cache - naya `applyMarkerPatch(path, patch)`, 4 site. Remove-flow par `dropMarkerRecord` hi |

`marker-approval-test` ke approve me `approveDate` ab **ek hi baar** banta hai
(`approvePatch` object), warna DB aur cache par alag minute pad sakta tha.

## Do chhooti hui jagah bhi theek ki

`card-marker-mapping:317` aur `:329` - `MarkersData/{uid}/cardNumber` par
`remove()` ho rahi thi aur cache ko koi khabar nahi thi. **Ye kami pehle se
thi**, S.8 se nahi aayi. Ab dono jagah:

```ts
this.markerMapping.applyPatch(uid, { cardNumber: null });
this.db.object(dbPath).remove();
```

## Ab poora hisaab

| Kaam | Master | S.8 se pehle | S.8 | S.8b (ab) |
|---|---|---|---|---|
| Ek marker approve/edit, phir ward | 1 | ~2002 | 1 | **0** |
| Marker move (mapping badli) | 1 | ~2002 | 2 | 2 |
| 10 marker approve + ward | ~10 | ~20,000 | ~2020 | **~2002** |
| Page refresh | 1 | 2002 | 2002 | 2002 |

Yaani ab ward ka data **ek baar** aata hai aur session bhar chalta hai; edit
karne par cache wahin theek ho jaati hai. Poori cache sirf **browser refresh**
par jaati hai (service `providedIn: "root"` singleton hai - route badalne par
zinda rehti hai).

`tsc --noEmit` clean (sirf purana `e2e/app.e2e-spec.ts` ka error).

---

# PAGE 10 — Change Line Surveyed Data (`PortalServices/change-line-surveyed-data`)

**Status:** ✅ Complete
**Master se diff:** 209 line
**Points:** sirf 2 - baaki poora page saaf tha

Ye chautha move page hai. `MoveHelperService` use karta hai (apne dbUpdate nahi
rakhta, ulta change-line-marker-data se).

## 10.1 Retry gayab thi — 🔴 fix kiya

Master me dono reads `moveHelper.readOnceWithRetry(db, path, this.run)` se hoti
thi. Migration me DB path badalte waqt retry wala wrapper hat gaya aur seedhi
service call lag gayi.

Asangati bhi thi: usi function ki teesri read (`houseData`, line 246) par retry
**abhi bhi** thi - do protected, do nahi.

**Fix:** `MoveHelperService` me naya `readWithRetry(read, run)` - uske apne
`readOnceWithRetry` ke exactly wahi 14 line, bas `path` ki jagah thunk.
`readOnceWithRetry` **chhua nahi**. Ye saare move pages ke kaam aayega.

| Read | Pehle | Ab |
|---|---|---|
| `lastMarkerKey` (`getSafeLastKey`) | bina retry | `moveHelper.readWithRetry(() => ..., this.run)` |
| source line (`getNewPathLineData`) | bina retry | wahi |

**Kitna gambhir:** data ka bug NAHI - dono read kisi bhi write se pehle hain, to
fail hone par kuch likha hi nahi jaata. Masla bharosemand hone ka tha: WiFi ka
2 second ka jhatka bhi move shuru hote hi abort kar deta tha (30 sec timeout,
phir error, phir user ko dobara SAVE dabana padta).

## 10.2 `state` object me 4 naye field declare kiye

Master wale 6 **jyon ke tyon**. Neeche 4 nayi jodi: `uid`, `destMappingWritten`,
`prevMoved`, `moveHistoryKey`. Type `any`. Zero behaviour change.

## ✅ Verified — kuch nahi karna

Jo galtiyaan Page 9 par nikli thi, **yahan hain hi nahi**:

| | |
|---|---|
| `image` ka naam | ✅ pehle se theek - `imgRef` / `oldImage`, naya naam nahi banta (Page 9 ka P9 yahan pehle se laga hua tha) |
| `resetEmptyLineSummaries` | ✅ zaroorat hi nahi - ye page counts recalc karta hi nahi, sirf `lastMarkerKey` aur `houseHoldCount`/`complexCount` likhta hai |
| Do-write merge | ✅ masla hai hi nahi |
| Cache | ✅ dono site `clearLinks()` (S.8 me theek hua), koi upfront clear nahi |
| Backup | ✅ `markersData`/`lineWise`/`markerWise`/`wardWise` + `restorePaths` + `skippedNoUid` + `orphanLinks` |
| Rollback | ✅ record delete nahi, mapping wapas point, `MoveHistory` entry hatana, `prevMoved` wapas |
| uid na mile | ✅ house move ho jaata hai, marker chhut jaata hai - master me bhi `markerObj == null` par yahi tha |
| `MarkerWardMapping` me `markerkey` | ✅ test case, nahi chhedna |
| `houseHoldCount`/`complexCount` ab LineSummary par | ✅ sirf node badla |

`tsc --noEmit` clean.

---

# PAGE 11 — Card Marker Mapping (`Developers/card-marker-mapping`)

**Status:** ✅ Complete
**Master se diff:** 327 line
**Points:** 3 - ek me poora page hi kaam nahi kar raha tha

Developer utility hai (route `:cityId/:id/card-marker-mapping`, sidebar entry
code me nahi - menu DB se aata hai). Do kaam karta hai:

1. **Update Card Marker Mapping** - ward ke har marker ka `cardNumber`
   `CardWardMapping` se milata hai. Card usi line par -> `latLng` update; card
   doosri line par -> marker bhi wahan move; card kahin nahi -> marker se
   `cardNumber` hatao
2. **Update Card Marker Location** - ek card ka naya `latLng` uske marker par

## 11.1 `uidMap` kabhi bharta hi nahi tha — 🔴 poora page dead

```
setUid()  ->  declare tha, par call KAHIN NAHI
uidMap    ->  hamesha {}
getUid()  ->  hamesha null
```

`null` par dono operation chup-chaap skip kar dete the:

| Operation | Kya hota tha |
|---|---|
| Update Card Marker Mapping | har marker `notMigratedCount++` -> skip. Ant me *"Data Update Successfully!!! (2000 markers skipped — new path par nahi mile)"* - user ko lagta migration adhoori hai |
| Update Card Marker Location | `continue` -> kuch update nahi, koi message bhi nahi |

Line 216 ka comment kehta tha *"ward load ke waqt uidMap me bhar chuka hai"* -
par bharne wala code likha hi nahi gaya tha.

Master me ye chalta tha (wahan uid ka concept hi nahi tha, seedha
`MarkedHouses/{ward}/{line}/{markerNo}` par likh dete the).

**Fix:** naya `loadWardUids(wardNo)` - `getWardLinks()` se poore ward ka
`{ "ward|line|markerNo": uid }` bhar deta hai. Dono flows me
`getNewPathWardData()` / `getWardLine()` se **pehle** chalta hai.

**Extra DB read zero** - `getWardLinks()` wahi cache hai jise `getWardRecords()`
pehle se use karta hai.

## 11.2 Comment jhooth bol raha tha — theek kiya

`setMarkerLocation()` ka comment: *"poora ward EK query me (getWardRecords ->
orderByChild("ward"))... 8000 record ek hi ward query me aa jaate hain"*.

Par `wardQueryEnabled = false` hai - wo query chalti hi nahi, abhi bhi N alag
read jaati hain. Ward-wise padhna phir bhi sahi hai (line-by-line se behtar),
bas "EK query" wala daawa galat tha. Comment me ab saaf likha hai ki query
raasta OFF kyun hai.

## 11.3 `markersDataPromise` — dead code, COMMENT kiya (hataya nahi)

Declare aur reset hota tha, use kahin nahi. User ka niyam: code hataana nahi,
comment karna hai - taaki review me saamne rahe aur zaroorat padne par wapas
lagana asaan ho.

## ✅ Verified — kuch nahi karna

| | |
|---|---|
| Image copy hataana | ✅ flat folder, naam nahi badalta |
| `moveMarkerOnNewPath` | ✅ record patch + teeno mapping + `MoveHistory` |
| Poora record ki jagah sirf badle fields | ✅ **achha fix** - beech me hua approve/edit ab overwrite nahi hota |
| Khaali line par recursion ruk jaana | ✅ theek kiya (master me loader hamesha chalta reh jaata tha) |
| Ward me kuch na mile to loader + message | ✅ theek kiya |
| Cache | ✅ S.8/S.8b me ho chuka - `applyPatch` + `clearLinks` |
| Backup / retry | master me bhi nahi tha - Developer utility hai, sawaal uthta hi nahi |

`tsc --noEmit` clean.

---

# PAGE 12 — Add Marker Against Cards (`Developers/add-marker-against-cards`)

**Status:** ✅ Complete
**Master se diff:** 205 line
**Points:** 3 - P1 discuss karke **jaisa tha waisa hi rakha**, P2 aur P3 fix

Developer utility (route `:cityId/:id/add-marker-against-cards`). Kaam: jin
survey ho chuke card/ghar par marker nahi laga, unpar marker bana deta hai.
Marker ka data card se hi banta hai (`address`, `createdDate`, `houseType`,
`latLng`, `cardNumber`, `isApprove: "1"`, `userId: "-1"`).

## Poora flow (P1 - koi change nahi)

```
1. MarkerWardMapping ki KEYS      -> kis card par marker pehle se hai
2. Houses/{ward}/{line}/{cardNo}  -> saare card
3. jispar marker nahi             -> markerAddList
4. createMarker()                 -> uid + markerNo dono TRANSACTION se reserve,
                                     phir MarkersData + MarkerWise + WardWise +
                                     LineWise + LineSummary(lastMarkerKey,
                                     marksCount) + MarkerWardMapping
```

Aakhri line se chakkar apne aap band ho jaata hai: naya marker banate hi uska
card index me chala jaata hai, to page dobara chalane par wahi card skip ho
jaata hai - duplicate nahi banta.

### P1 par discussion ka nateeja

Pehle maine poora `MarkersData` padhne ki salah di thi (master `MarkedHouses`
poora padhta tha). **Wo salah wapas le li** - user ne theek kaha ki
`MarkerWardMapping` hi is kaam ka index hai. Verify kiya, har naya raasta use
maintain karta hai:

| Kaun | `writeCardMapping` |
|---|---|
| `writeMarker()` (har naya marker) | ✅ |
| `moveMarker()` (har move) | ✅ |
| Migration `marker-data-move` | ✅ + purani entries me `markerkey` backfill |
| `ward-survey-analysis` (card assign ke 3 flow) | ✅ |
| Move pages | ✅ `markerkey` likhte hain |

**Aur ek request bhi hai, poore MarkersData jitni nahi** - dono ek hi
`db.object(...)` read hain, bas payload chhota hai.

### `markerkey` yahan use NAHI hota - jaan-bujh kar

Sirf entry ka **hona** dekha jaata hai. Purani (master-era) entries me
`markerkey` field nahi hai par unka matlab bhi wahi hai - card par marker hai.
`markerkey` maangte to wo entries "marker nahi hai" mani jaati aur unpar
**duplicate marker** ban jaata. Key wala check dono haalat me sahi hai.

(`markerkey` tab chahiye jab card se marker tak **pahunchna** ho - jaise
`getUidByCard()`.)

## 12.1 `data == null` par ruk jaana — 🔴 fix kiya

```ts
// pehle - null par bhi aage
if (data != null) { ...map bharo... }
this.getHouseData(1);

// ab - master jaisa
if (data != null) { ...map bharo...; this.getHouseData(1); }
else { $(divLoader).hide(); setAlertMessage("error", "Marker card mapping nahi mili — kuch nahi kiya gaya."); }
```

Khatra: node kisi wajah se na mile (galat city, node abhi bana hi nahi, read
fail) to page har card ko "marker nahi hai" maan kar **POORE SHEHER par marker
bana deta**. Master sirf loader hata kar ruk jaata tha.

## 12.2 `markerCardList` array — comment me wapas daala

Array -> map wala badlaav **sahi** hai (hazaaron cards par `.find()` har card ke
liye poori list scan karta tha). Par purana code delete ho gaya tha; user ke
niyam ke hisaab se ab comment me hai.

## ✅ Master se behtar

| | Master | Ab |
|---|---|---|
| Card list source | poora `MarkedHouses` | `MarkerWardMapping` index |
| Card lookup | `.find()` (O(n) har card par) | map lookup |
| Naya number | `lastMarkerKey` padho -> +1 -> likho | **transaction** |
| Do user ek saath | 🔴 dono ko same number, ek marker dab jaata | ✅ alag number |
| `marksCount` | update nahi hota tha | ✅ transaction se +1 |
| Card index | update nahi hota tha | ✅ likha jaata hai |
| `uid` reserve fail | — | ✅ card skip karke aage, poori list nahi rukti |

`tsc --noEmit` clean.

## 🔗 Cross-page — cms1 (abhi review nahi hui)

`cms1:3516` aur `cms1:2713` card assign karte waqt:
1. `MarkerWardMapping` update **nahi** karte
2. **OLD path** (`MarkedHouses`) par likhte hain

Cloud function (`functions/index.js`) **create-only** hai - sirf naye marker par
chalti hai, update mirror nahi karti. Yaani cms1 se assign hua card na
`MarkersData` me dikhega, na index me. Aisa card is page ko "marker nahi hai"
dikhega -> duplicate marker.

**Ye cms1 ka masla hai**, add-marker-against-cards ka nahi. cms1 ki review me
dekhna hai.

---

# PAGE 13 — Manage Marking Data (`Developers/manage-marking-data`)

**Status:** ✅ Complete — koi change nahi kiya
**Master se diff:** 18 line judi, ek bhi line badli/hati nahi

## Kya kiya gaya tha

Dono function ke shuru me early `return` + error message:

```ts
setMarkerData() {
  // YE PAGE ABHI BAND HAI (purani scheme).
  this.commonService.setAlertMessage("error", "Ye page purani marker scheme ka hai aur band kar diya gaya hai. Marker migration ke liye 'Marker Data Move' page use karein.");
  return;

  $(this.divLoader).show();     // <- poora purana code jyon ka tyon neeche pada hai
  ...
}
```

`setMarkerMapping()` me bhi wahi. **Purana code ek line bhi nahi hataya** -
comment me likha hai *"Chalu karne ke liye: neeche wale 2 line hata dein"*.

## Band karna sahi tha - verify kiya

Ye page teen node par kaam karta tha. **Teenon ko poore `src` + `functions` me
koi nahi padhta** (sirf isi file me milte hain):

| Node | Padhne wala |
|---|---|
| `EntityMarkingData/Markers/M{n}` | koi nahi |
| `EntityMarkingData/WardLineMapping` | koi nahi |
| `MarkingImages/` (Storage) | koi nahi |

Aur dono function ki **pehli hi line destructive thi**:
```ts
this.db.object("EntityMarkingData/WardLineMapping").remove();
```
Button dabate hi wo node ud jaata, phir naya junk banta.

Yahi kaam ab **Marker Data Move** naye structure me theek se karta hai
(`MarkersData` + `MarkersMapping`).

## Poora page dead hai

| | |
|---|---|
| `setMarkerData()` | line 36 par `return` |
| `setMarkerMapping()` | wahi |
| `addFlatMarkerData()` | sirf `setMarkerData()` se bulaya jaata tha -> kabhi nahi chalta |
| `setWardLineMapping()` | sirf `addFlatMarkerData()` se -> kabhi nahi |
| `ngOnInit()` | chalta hai (city, db, page access) |
| HTML ke 2 button | dikhte hain, dabane par sirf error message |

180 line ki file me ~150 line kabhi nahi chalti.

## Ek vikalp jo NAHI liya (user ka faisla: jaisa hai waisa theek)

Dead body ko `/* ... */` block me daala ja sakta tha - tab (a) pehli nazar me
dikhta ki jaan-bujh kar band hai, aur (b) us code ka compile hona band ho jaata
(abhi wo compile to hota hai, chalta nahi - kisi purani API par toote to build
fail kar sakta hai).

User ne kaha jaisa hai waisa theek hai. **Koi change nahi kiya.**

---

# PAGE 14 — Due Amount Report (`reports/due-amount-report`)

**Status:** ✅ Complete — koi change nahi kiya
**Master se diff:** 22 line judi, 5 hati
**Points:** koi nahi

Ab tak ka sabse saaf page. Poore 748 line me marker ka **sirf ek read** hai.

## Ek hi cheez badli

```ts
// pehle
let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone;
this.db.object(dbPath).valueChanges().subscribe(markerData => { ... })

// ab
this.getNewPathWardData(this.selectedZone).then((markerData: any) => { ... })
```

Judi hui 22 line: import, constructor param, `getNewPathWardData()` helper,
4 comment line, naya `.then(`. Hati hui 5: purani 3 read line + blank (aur wo
comment me pade hain).

**Loop ki ek bhi line nahi badli** - `latLng` check, `cardNumber`/`markerId`
fallback, `getDefaultCardPrefix()`, `entityTypeList.find`, `wardCardPaymentList`
- sab master jaisa hu-ba-hu.

## Verified

| | |
|---|---|
| Shape | ✅ wahi `{line: {markerNo: record}}` |
| Cache clear | ✅ zaroorat nahi - page marker par kuch **likhta hi nahi** |
| `markerData == null` | ✅ master jaisa |
| Doosra koi marker read | ✅ nahi - poore file me sirf line 292 |

Naya shape thoda **safe** bhi hai:

| | Master | Ab |
|---|---|---|
| `lineData` null ho sakta hai | ho sakta tha | ❌ `getWardRecords` khaali line daalta hi nahi |
| `lineData[markerNo]` scalar (`marksCount`, `lastMarkerKey`, `ApproveStatus`) | ✅ aate the (crash nahi karte the, bekaar chakkar lagta tha) | ❌ sirf records |

## Poore portal ke faisle jo ispar asar dalenge (is page ke points nahi)

1. Reads `1` -> `2+N` - `wardQueryEnabled` wala faisla isse theek karega
2. Union -> intersection (S.6) - ab sirf wahi marker aayenge jo dono mapping me hain

---

## 📍 `MarkedHouses` ab LIVE kahan-kahan hai (poore project ka survey)

| Kahan | Kyun | Haalat |
|---|---|---|
| `functions/index.js:27`, `functions/marker-mapping.js:39` | App abhi bhi yahin likhti hai; trigger yahan se naye structure me le jaata hai | ✅ zaroori bridge |
| `marker-data-move:125, 558` | Migration ka source + `movedToNewPath` stamp | ✅ zaroori |
| `manage-marking-data:42, 90` | Page band hai (PAGE 13) | ✅ dead |
| `house-marking-assignment:510` | `/* */` block ke andar | ✅ dead |
| `survey-verification:342, 356` | `SurveyVerifierData/MarkedHousesByVerifier` - **alag node** | ✅ isse taalluk nahi |
| `getMarkedHouses()` naam wale function (house-marking, line-marker-mapping, ward-survey-analysis, marker-approval-test) | sirf function ka **naam** purana, andar naya path | ✅ |
| 🔴 **`cms1.component.ts` — 40 jagah** | sach me purane path par padhta AUR likhta hai | ❌ **review baaki** |

Yaani migration ke hisaab se **sirf `cms1` bacha hai**.

---

# PAGE 15 — Collected Amount Report (`reports/collected-amount-report`)

**Status:** ✅ Complete — koi change nahi kiya
**Master se diff:** 22 line judi, 5 hati
**Points:** koi nahi

PAGE 14 (Due Amount Report) ka hu-ba-hu jodidar - wahi diff, wahi ek change.

## Ek hi cheez badli

```ts
// pehle
let dbPath = "EntityMarkingData/MarkedHouses/" + this.selectedZone;
this.db.object(dbPath).valueChanges().subscribe(markerData => { markerInstance.unsubscribe(); ... })

// ab
this.getNewPathWardData(this.selectedZone).then((markerData: any) => { ... })
```

Master aur branch ka loop **line-by-line milaya** - ek bhi character alag nahi:
`latLng` check, `cardNumber` fallback, `markerId` + prefix, `houseType`,
`entityTypeList.find`, `wardCardPaymentList` - sab wahi. Uske aage ka
`if (this.wardCardPaymentList.length > 0)` block bhi dono me wahi jagah.

## Poore page ka survey

| | |
|---|---|
| File size | 769 line |
| Marker ka read | **sirf 1** (line 291) |
| Marker par koi write | ❌ nahi - report page hai |
| `MarkedHouses` live use | ❌ nahi - sirf comment me |
| `MarkersData`/`MarkersMapping` seedha use | ❌ nahi - sab service ke through |
| Cache clear | ❌ zaroorat nahi - kuch likhta hi nahi |
| Baaki page (`getCollectedAmountNew`, `setMonthAmountInList`, month loops, export) | payment data par chalta hai, marker se taalluk nahi |

## Poore portal ke faisle jo ispar asar dalenge (is page ke points nahi)

1. Reads `1` -> `2+N` - `wardQueryEnabled` wala faisla isse theek karega
2. Union -> intersection (S.6) - ab sirf wahi marker aayenge jo dono mapping me hain

---

# PAGE 16 — Card Transection Detail (`reports/card-transection-detail`)

**File:** `Code/src/app/reports/card-transection-detail/card-transection-detail.component.ts`

Poore page me marking se sirf **ek** cheez judi hai: `getMarkerImage(lineNo, cardNo)` —
card ki marker photo. Baaki sab (`CardWardMapping`, `Houses`,
`PaymentCollectionInfo/PaymentTransactionHistory`, entity list, export) payment/house
data par chalta hai, marking se taalluk nahi.

## 16.1 Card se marker ab `markerkey` se milta hai (user ka faisla)

**User:** *"markerNo ese resolve nhi hoga markery key se hi hoga vo new structure ke liye set hein"*

### Pehle (is branch me, fix se pehle)

`getNewPathLineData(ward, lineNo)` se **poori line** ka data uthta tha, phir usme
har record ka `cardNumber` match karke marker dhoondha jaata tha.

```
getWardLinks           2 read
line ke ~40 record    40 read
                     -------
                     ~42 read     (master me ye 1 read tha)
```

### Ab

```
MarkerWardMapping/{cardNo}   -> markerkey ("M12")     read 1
MarkersData/M12              -> record, imgRef        read 2   (cached)
markerImageUrl(record)       -> AllMarkerImages/M12.jpg
```

**~42 read -> 2 read**, aur dono cached (`markerCache`) — dobara wahi card khola to 0.

### Kyun ye behtar hai (sirf read count ki baat nahi)

`markerNo` line ke andar ka serial hai aur marker ke **move par badal jaata hai**.
`uid` (`markerkey`) kabhi nahi badalta. Naye structure me card-to-marker ka rishta
`markerkey` me pehle se likha hai — dhoondhne ki zaroorat hi nahi.

### Behaviour ka farq

| Halat | Pehle | Ab |
|---|---|---|
| `markerkey` hai | image dikhti | image dikhti, 2 read me |
| `MarkerWardMapping` entry hi nahi | line-scan phir bhi dhoondh leta | image nahi dikhegi |

`createMarker` / `moveMarker` dono `writeCardMapping` bulate hain, isliye entry
banni hi chahiye.

### Comment me gaya (hataya nahi)

- poora purana line-scan loop
- `getNewPathLineData()` helper — ab koi nahi bulata
- purana per-line folder wala image URL fallback (S.7 ke mutabik pehle hi band tha)

## 16.2 P1 — `parseInt` guard ka comment purana pad chuka tha

Comment me likha tha ki "union me marker ki key uid ban jaati hai (`{M12: rec}`),
isliye `parseInt` NaN deta tha". **S.6 ke baad union hai hi nahi** — intersection
me key hamesha `markerNo` hoti hai, `{M12: rec}` wali soorat aati hi nahi.

Guard hataana phir bhi sahi tha, par wajah galat likhi thi. 16.1 me poora block
comment me chala gaya, isliye ye apne aap nipat gaya.

## ✅ Verified — kuch nahi karna

| Cheez | Haal |
|---|---|
| `CardWardMapping` / `Houses` reads | marking se juda nahi |
| `getSikarHouseImages` | house image, marker nahi |
| Entity list, transaction list, export | marking se juda nahi |
| Cache clear | ❌ zaroorat nahi — page kuch likhta hi nahi |
| DevTest hardcode | pehle hi theek (cross-cutting fix me) |

---

# S.9 `getUidByCard()` — fallback hataya, ab sirf `markerkey` (user ka faisla)

**User:** *"fallback ki requirement nhi hein agar nhi hein to nhi hein"* / *"markerkey se hi hoga"*

## Pehle

```ts
if (entry["markerkey"] != null && entry["markerkey"] !== "") {
  return String(entry["markerkey"]);
}
// fallback - purani (master-era) entries ke liye:
if (entry["ward"] == null || entry["line"] == null || entry["markerNo"] == null) {
  return null;
}
return this.getUid(db, entry["ward"], entry["line"], entry["markerNo"], markersData);
```

## Ab

`markerkey` na ho -> **`null`**. Purana block comment me hai.

## Kyun

Fallback thik un_hi_ teen fields par bharosa karta tha (`ward`/`line`/`markerNo`)
jo marker ke move par badal jaate hain. Agar kisi flow ne move ke waqt
`writeCardMapping` na bulaya ho to teeno purane pade reh jaate hain — aur fallback
**galat marker** de deta, jo `null` se bhi bura hai.

## Asar ka daayra

`getUidByCard` ka poore project me **sirf ek caller** hai — Page 16 ka
`getMarkerImage()`. `getMarkerDataPathByCard()` ko koi nahi bulata (dead).
Yaani ye change sirf Page 16 par lagta hai.

`markersData` param signature me chhod diya hai (`getMarkerDataPathByCard` bhejta
hai), par ab kahin use nahi hota.

## Verify

`tsc --noEmit` saaf — sirf purana `e2e/app.e2e-spec.ts(12,45)` wala error, jo
pehle se hai.

---

# PAGE 21 — cms1 (`cms1.component.ts`) — poore 26 function

Beech me is page ke saare marking function `oldPathBlocked()` se band kar diye
gaye the. Ab **26 ke 26** naye structure par hain aur `oldPathBlocked()` khud
comment me chala gaya hai.

**User ka niyam yahan:** *"flow change nhi karna hein, naye structure mein sirf
data update and read and add hoga"* — isliye har function ka loop, shart,
`parseInt` guard, recursion, alert sab jyon ka tyon hai. Sirf DB ka path badla.

## Raasta ek hi rakha

```
1. mapping     getWardLinks(db, ward)   ya   getUid(db, ward, line, markerNo)
2. uid         links[line][markerNo]  ->  "MK12"
3. data        getMarker / getWardRecords / getLineRecords
4. update      MarkersData/{uid}  +  clearForPath(path, patch)
   ya          removeMarker / writeMarker / writeCardMapping
```

`getWardRecords()` aur `getLineRecords()` **purana hi shape** dete hain
(`{line: {markerNo: record}}`), isliye page ke loop chhedne nahi pade.

## Function-wise

| Batch | Function | Kya badla |
|---|---|---|
| 1 | `deleteHisarMarker` | `getUid` → `removeMarker` |
| 1 | `hisarMarkerUpload` | `reserveUidBlock` + `writeMarker` |
| 1 | `removeLineApprove` | `ApproveStatus` → `LineSummary` |
| 1 | `updateRevisitMarker` | `revisitKey` → `MarkersData/{uid}` |
| 1 | `checkMarkerCount` | counts → `LineSummary` |
| 1 | `removeMarkerRejectStatus` | naya `getAllMarkersOldShape()` |
| 1 | `setMarkerID` | `markerId` → `MarkersData/{uid}` |
| 2 | `exportMarkers` | `getAllMarkersOldShape()` |
| 2 | `updateMarkingData` | `getWardRecords` |
| 2 | `addHouseToMarker` | `getLineRecords` (cached — 200 read se 2+N) |
| 2 | `getOldMarkerDataMalviyaNagar` | `getWardRecords` (cached) |
| 3 | `deleteOldDataMalviyanagar` | `getUid` → `removeMarker` |
| 3 | `updateMalviyaNagarHouseData` | `removeMarker` |
| 4 | `addHouse` | `surveyedCount` → `LineSummary` |
| 4 | `saveHouse` | `cardNumber` → `MarkersData/{uid}` + `writeCardMapping` |
| 4 | `updateMurlipuraHouseData` | record + `writeCardMapping` |
| 5 | `getHouseData` | counts → `LineSummary` |
| 5 | `setDehradunWardLineData` | `getWardLineSummaries` |
| 5 | `addCardsMalviyanagar` | `writeMarker` |
| 5 | `getD2DMatkers` | `getWardRecords` |
| 5 | `updateMalviyaNagarData` | `getSafeLastKey` + `writeMarker` |
| 5 | `setTotal` | `marksCount` ka jod **hataya** — neeche dekho |
| 6 | `moveMalviyanagarImages` | record ka `image` → `imgRef` |
| 6 | `getMistakeMarkerNo` · `exportNewCardNo` · `compairMarkerHouseData` | sirf guard hataya (test node / dead) |

## Naya helper — `getAllMarkersOldShape()`

`MarkersData` ek read, phir purane 3-level shape
(`{ward: {line: {markerNo: record}}}`) me. Record me `ward`/`line`/`markerNo`
maujood hain, isliye shape wapas ban jaata hai — aur `removeMarkerRejectStatus`
aur `exportMarkers` ke teeno loop chhedne nahi pade. Record ke saath `uid` bhi
rakh dete hain taaki likhte waqt mapping dobara na padhni pade.

## `setTotal` me `marksCount` ka jod hataya — JAAN-BUJH KAR

Purane path par marker likhna (`update`) `marksCount` ko haath nahi lagata tha,
isliye ginti `setTotal` me alag se jodni padti thi. `writeMarker` har marker par
`LineSummary.marksCount` transaction se 1 badha deta hai. **Dono karte to ginti
DUGNI ho jaati.** Nateeja wahi hai jo master deta tha; bas jodne ka kaam ab
`writeMarker` karta hai.

## Jo waise ka waisa chhoda (user ka faisla)

| Node | Kyun |
|---|---|
| `EntityMarkingData/lastMarkerId` + `markerId` field | alag cheez hai, `uid` se koi taalluk nahi. Ek hi marker par `uid: "MK81"` aur `markerId: "M41"` baith sakte hain |
| `EntityMarkingData/MarkedHousesNew` | naye structure ka hissa nahi |
| `CardDataUpdateTest/MNZ-Test/...` | test node |
| `Houses` · `CardWardMapping` · `HouseWardMapping` · `EntitySurveyData` · `WardSurveyData` · `localStorage` | marking node nahi |

## `removeMarker` ab count ghataata hai

Master ka `.remove()` `marksCount` peeche nahi karta tha, isliye delete ke baad
line ka count bada dikhta rehta tha. Naye structure me count `LineSummary` par
hai aur wahi sach maana jaata hai, isliye ghatana hi sahi hai.

---

# S.10 — Mapping structure DB se mel khaya (sabse bada fix)

`devtest-62768-default-rtdb-MarkersMapping-export.json` dekhne par pata chala ki
**DB ka structure code se alag hai**:

| | Code kya maanta tha | DB me asli me kya hai |
|---|---|---|
| uid | `M1` | **`MK1`** |
| `LineWise/{ward}/{line}` | `{ markerNo: uid }` | **`{ uid: true }`** |
| `WardWise/{ward}` | `{ uid: line }` | wahi ✅ |
| `MarkerWise/{uid}` | `{ ward, line }` | wahi ✅ |

## Data kyun nahi dikh raha tha

`buildWardLinks()` me:

```
let uid = links[markerArray[j]];       // DB: true
if (String(index[uid]) != String(lineNo)) { continue; }   // index[true] = undefined
```

`uid` me `true` aa jaata tha, `WardWise` me `true` naam ki koi entry hoti nahi,
isliye **har marker `continue` par nikal jaata tha** aur ward khaali lautta tha —
list bhi khaali, map bhi khaali.

## 8 jagah tooti thi — sab theek

| # | Kahan | Kya |
|---|---|---|
| 1 | `buildWardLinks` | key hi uid hai; dono roop (naya + purana) padhta hai |
| 2 | `writePlace` | `LineWise/{w}/{l}/{uid} = true` |
| 3 | `writeMarker` | `uid = uidPrefix + n` |
| 4 | `removeMarker` | dono roop se entry hatati hai |
| 5 | `imageUrlFromName` | regex prefix se banti hai (`MK21.jpg` reject ho raha tha) |
| 6 | `getLineMarkerUids` | sort `substring(prefix.length)` se |
| 7 | `nextLineKey` | records ke `markerNo` se max (`Number("MK21")` NaN deta tha) |
| 8 | `moveMarker` | purani entry uid se; sirf markerNo badle to ab kuch hataata hi nahi |

## `uidPrefix = "MK"` — ek hi jagah

Prefix chhe jagah pehchana jaata hai (banane me, "ye key uid hai ya markerNo"
wale check me, sort me, image ke naam me). Ab ek constant se aata hai
(`marker-mapping.service.ts`), aur cloud function me bhi wahi (`UID_PREFIX`).

> **NOTE:** iska `markerId` field se koi lena-dena nahi. Wo alag cheez hai — apna
> counter (`EntityMarkingData/lastMarkerId`), apna roop (`"M41"`), aur wo cms1 ka
> `setMarkerID()` banata hai.

## Kahan-kahan laga — 10 file

`marker-mapping.service.ts` · `functions/marker-mapping.js` + `README.md` ·
`card-marker-mapping` · `marker-data-move` · `line-marker-mapping` ·
`line-card-mapping` · `change-line-marker-data` · `change-line-surveyed-data` ·
`house-marking` · `marker-approval-test`

## Dono roop padhna — kyun

`buildWardLinks`, `removeMarker`, `getLineUidsFromLineWise` naya `{uid: true}`
aur purana `{markerNo: uid}` **dono** samajhte hain. Farak key se tay hota hai:
markerNo hamesha number hota hai, uid nahi (`isNaN(Number(key))`). Ye prefix se
nahi dekhte — wo `"M"` bhi ho sakta hai aur `"MK"` bhi.

Move flows me purane roop ki entry bhi hatati hai — aisi entry na ho to wo
remove kuch karta hi nahi.

---

# Merge — `origin/dev/marking-management` (commit 57375cc)

Ansh ne bhi thik yahi fix kiya tha (LineWise uid-keyed). 9 file me conflict aaya;
har jagah **dono taraf ka faayda** rakha.

## Unse liya

| Kya | Kyun zaroori tha |
|---|---|
| cloud function ke record me `markerNo` | LineWise uid-keyed hone ke baad `markerNo` sirf record me bachta hai. Iske bina ward-map aur line view un markers ko chhod dete (dono `Number(key)` par filter karte hain) |
| LineWise ke DONO roop padhna | aadhi-migrate DB bhi chalti rahe |
| move flows me purane roop ki entry bhi hatana | marker purani line par bhoot ban kar na dikhe |

## Apna rakha

`uidPrefix = "MK"` (unka abhi bhi `"M"` tha) · WardWise+LineWise ka
**intersection** (S.6 — unka commit purane union wale version par bana tha) ·
`imageUrlFromName` ka regex · `nextLineKey` records se · `clearLinks()` (targeted
cache, S.8) · aaj ka baaki sab kaam.

---

# Temp debug band (3 page)

`house-marking` (`debugMapping` + `debugApprove`), `marker-approval-test`
(`debugApprove`), `ward-marking-summary` (`debugWardData`) — teeno `/* */` me,
saare `[APPROVE]` / `[WMS]` console.log comment me. **Hataye nahi** — koi naya
sawaal aaye to `/* */` hata do.

---

# PAGE 22 — Ward Survey Analysis

| # | Kya | Asar |
|---|---|---|
| P1 | `changeZoneSelection()` par `clearLinkCache()` hataya | wo chaaron cache wipe karta tha jabki yahan koi write hi nahi hoti. Ward A→B→A par poora data dobara aata tha |
| P2 | `detail.image != ""` → `detail.imageUrl != ""` | `image` ab `imgRef` se bharta hai; `undefined != ""` hamesha sach tha, aur khaali URL `<img src="">` bana deta — default `system-generated-image.jpg` kabhi lagti hi nahi |
| P3 | `imageName` ab sirf `imgRef` | purana naam aage flat `AllMarkerImages` folder me joda jaata tha jahan wo file hoti hi nahi (S.7 ka niyam) |
| P4/P5 | "union" aur "purane folder ka fallback" wale comment | S.6/S.7 ke baad purane pad chuke the |

**P6 galat tha** — `dbPath` dead nahi, `Houses/...latLng` ke liye chalta hai.

---

# PAGE 23 — Supervisor Report

| # | Kya | Asar |
|---|---|---|
| P1 🔴 | `markersData` null par ab **ruk jaata hai** | pehle khaali object le kar aage badhta aur `markingSurviorDetail.json` ko KHAALI list se overwrite kar deta — poori report chali jaati, aur `lastUpdated.json` naya time likh deta to pata bhi na chalta. Master chup-chaap rukta tha |
| P2 | `image` → `imgRef` | naye record me `image` field hai hi nahi |
| P3 | `webPortalUserList` ka `JSON.parse` loop ke **baahar** | har approve hue marker par dobara parse hota tha (50,000 marker = 50,000 parse). List badalti nahi |

Migration khud theek tha: `MarkedHouses/` (1 read) → `MarkersData` (1 read), aur
teen nested loop ek me — kyunki record khud `ward`/`line` rakhta hai.

## Alert message — sab English

Master ke saare message English me hain (`"Please enter ward No."`,
`"Marker added Successfully !!!"`). Is branch me jo Hinglish aa gaye the, wo 9
jagah English kar diye — cms1 (3), `marker-data-move`, `add-marker-against-cards`,
`manage-marking-data` (2), `set-marker-images`, `marker-approval-test`,
`supervisor-report`.

*(Code ke comment Hinglish me hi hain — wo user ko dikhte nahi.)*

---

# PAGE 24 — Marker Data Move

## 🔴 F1 — Image na mile to marker ka DATA bhi migrate nahi hota tha

`copyImage()` ke `.catch()` me `onFail()` tha. Source image Storage me na ho
(delete ho gayi, kabhi upload hi nahi hui, naam galat pada hai) to
`writeRecordAndMapping()` chalta hi nahi tha — **record `MarkersData` me likha hi
nahi jaata**. Re-run par bhi wahi fail hota, hamesha.

**Khud se ulta bhi tha:** image ka NAAM hi na ho to `onSuccess(false)` hota hai
aur data migrate ho jaata hai. Dono me nateeja ek hi hai — image nahi hai.

**Fix:** dono soorat me `onSuccess(false)`. Ab wo marker `noImageCount` me
ginega, migrate ho jaayega, aur `imgRef` set rahegi — image baad me us naam se
upload ho jaaye to apne aap dikhne lagegi.

`onFail()` ab sirf upload/network ki us naakami par hai jo teen koshish ke baad
bhi na sudhre.

> **Karne wala kaam:** `MarkerMovementData/MoveFailures` me jinme
> `reason: "image copy failed"` hai, wo marker abhi tak migrate nahi hue. Us ward
> par migration dobara chalane se aa jayenge.

## F2 / F3

`isSame()` aur `readOnce()` dead the — comment me. Header ka structure-doc
`M{n}` keh raha tha, ab `{uid}` / `MK{n}`.

---

# PAGE 25 — `Code/functions/` (cloud function)

## Sabse zaroori baat: **ye ab chalta hi nahi**

Ye pul us waqt ka hai jab **app purane path par likhti thi**. **Ab app khud
seedha new structure likhti hai** — `MarkersData/{uid}` + poori `MarkersMapping`,
prefix `MK`. Yaani `MarkedHouses` par koi naya marker aata hi nahi aur
`syncMarker_*` trigger kabhi chalta nahi.

> ### ⚠️ Yahan `marksCount` +1 ya `MarkerWardMapping` MAT jodna
>
> Portal ka `MarkerMappingService.writeMarker()` ye dono karta hai, par **app bhi
> khud karti hai**. Cloud function bhi kare to line ki ginti **DUGNI** ho jaayegi,
> aur galat ginti wapas theek karna bahut mushkil hai.
>
> Pehle ye jodne ka plan bana tha — tab pata chala ki app khud naya structure
> likhti hai, isliye rok diya.

Code hataya nahi: `marker-data-move` abhi purane tree se data la raha hai, aur kal
koi purane path par likh de to ye pul phir kaam aayega. Us soorat ke liye iska
format aaj theek ho chuka hai (`MK{n}`, `{uid}: true`).

Ye baat `functions/README.md` aur `functions/index.js` dono ke sar par likh di
gayi hai.

## `MK` kahan se aaya — ye sawaal kaise hal hua

DB me `MK1`…`MK80` aur `LineWise = {uid: true}` tha. Portal aur cloud function
**dono** us waqt `M{n}` aur `{markerNo: uid}` likh rahe the. Yaani dono me se
kisi ne wo nahi likha — **app ne likha tha**. Isi se pata chala ki app khud naya
structure likhti hai.

---

# S.11 — Service ka poora review

## 🔴 S1 — Move ka BACKUP khaali ban raha tha

`buildLineBackup()` `links` ko `{markerNo: uid}` maanta tha. Naye `{uid: true}`
format me `links["7"]` hamesha `undefined` milta — yaani **HAR marker
`skippedNoUid` me chala jaata aur backup POORI TARAH KHAALI banta**:
`markersData` / `lineWise` / `markerWise` / `wardWise` sab khaali, aur har link
`orphanLinks` me.

Aur ye **chup-chaap** hota tha: file ban jaati thi (Storage par
`{city}/MovingBackUp/{page}/{year}/{month}/{date}/...json`), move usko `await`
bhi karta tha (3 retry + timeout), bas usme kuch hota nahi tha. **Move bigadne
par restore ke liye kuch bachta hi nahi.**

**Fix:** naya `buildLineBackupFor(db, ward, line)` — service khud mapping aur
records dono padh kar backup banati hai, isliye `markerNo` ↔ `uid` jodne ki
zaroorat hi nahi (naye structure me wo jod caller ke paas ban hi nahi sakta tha:
LineWise me markerNo hai hi nahi aur record me uid nahi hota).

Backup ab:

```
markersData = { uid: record }
lineWise    = { uid: true }          <- naye format me
markerWise  = { uid: {ward, line} }
wardWise    = { uid: line }
orphanLinks = jinki mapping hai par record nahi
```

4 call site badle. Purana `buildLineBackup()` comment me.

> **Jaan lena:** jo move LineWise format badalne ke baad hue, unki backup file
> khaali hai (`markersData: {}`). Un par restore nahi ho sakta.

## ⚪ S2 — 7 function dead, sab par nishaan laga diya

`getWardMarkers` → `getLineMarkerUids` → `getLineMarkers` (poori chain),
`uidFromRecordKey`, `getMoveHistory`, `getMarkerDataPathByCard`, `oldImageUrl`,
`getAllLinks`. Koi hataya nahi — har ek par "AB KOI NAHI BULATA" likh diya.

## 🟡 S3 — `moveMarker()` bana hua hai par koi use nahi karta

Service me poora move likha hai (record ka ward/line, teeno mapping, purani entry
hatana, card index). Par **paanch page apna move HAATH SE likhte hain** —
`writePlace()` + khud LineWise hataana.

**Isi wajah se LineWise wala bug paanchon file me alag-alag theek karna pada.**
Sab `moveMarker()` bulate to ek jagah theek karna kaafi hota.

Flow badalna user ka niyam nahi tha, isliye chheda nahi — bas function ke sar par
likh diya.

## ✅ Baaki sab theek

Cache (4 store, `clearForPath` / `applyPatch` / `dropMarker`), `readOnce` ka 30s
timeout, `cachePromise` ka fail-par-hatao, `reserveUidBlock`, `getSafeLastKey`,
`resetEmptyLineSummaries` ki field list, `writeCardMapping`, `getUidByCard`,
image URL — sab sahi.

---

# `actualMarks*` — ye chaar field kya hain

`actualMarksCount` · `actualMarksHouse` · `actualMarksComplex` ·
`actualMarksHouseInComplex`

Ye **master se hi hain** aur **portal hi banata hai** (app nahi).

| | Kisko dikhta hai |
|---|---|
| `marksCount`, `marksHouse`, `marksComplex`, `marksHouseInComplex` | andar wale users |
| `actualMarks*` | **External User** |

```
let dataKey = this.userIsExternal ? 'actualMarksCount' : 'marksCount';
```

**Likhta kaun hai:** portal ka "Update Counts" flow — `ward-marking-summary` aur
`ward-survey-summary`.

**Migration me theek hai:** likhna `MarkedHouses/{w}/{l}` se
`LineSummary/{w}/{l}` par chala gaya (chaaron ek hi `update()` me), padhna
`summaryValue(summary, "actualMarksCount", "marksCount")` se (ek read me dono),
aur service ke `lineCountFields` / `markerCountFields` me chaaron maujood hain to
`resetEmptyLineSummaries` inhe bhi zero karta hai.

---

# Ab bacha hua

| | |
|---|---|
| ⚪ | `cms1.component.ts` ~3583 — `updateMarkingData` me ek dead variable me purana path ka naam pada hai (DB call koi nahi; master me bhi wo write comment me tha) |
| ⚠️ | `marker-approval-test` ~1279 — **marker delete band hai**. User ka faisla: band hi rehne dena |

## Test karne ki cheezein

1. Ward kholo — marker dikhne chahiye (S.10 ke baad)
2. Marker approve karo — `MarkersData/{uid}` par jaana chahiye
3. Ek move karo, backup file khol kar dekho — `markersData` bharа hona chahiye (S1)
4. `MoveFailures` me `"image copy failed"` wale ward par migration dobara chalao (F1)
