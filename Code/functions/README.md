# Marker sync functions

App se naya marker aate hi use new marker structure me daal deti hain, taaki
`marker-data-move` chalane ki zaroorat na pade.

## Kaam kya karti hain

App purane path par likhti hai:

```
EntityMarkingData/MarkedHouses/{ward}/{line}/{markerNo}
```

Wahan naya marker aate hi `syncMarker_*` trigger ye banata hai (bilkul wahi jo
portal ka `MarkerMappingService` banata hai) — **isi order me**:

| # | Path | Value |
| --- | --- | --- |
| 1 | `MarkersMapping/lastMarkerKey` | counter +1 (transaction) → uid `M{n}` |
| 2 | `MarkersData/{uid}` | poora record + `ward`, `line`, `imgRef` |
| 3 | `MarkersMapping/MarkerWise/{uid}` | `{ward, line}` |
| 4 | `MarkersMapping/WardWise/{ward}/{uid}` | line |
| 5 | `MarkersMapping/LineWise/{ward}/{line}/{markerNo}` | uid |
| 6 | `MarkersMapping/LineSummary/{ward}/{line}/lastMarkerKey` | max(purana, markerNo) |
| 7 | `MarkedHouses/{ward}/{line}/{markerNo}/uid` | uid (duplicate guard) |
| 8 | `MarkedHouses/{ward}/{line}/{markerNo}/movedToNewPath` | `{newMarkerUid, newImageName, movedOn}` |

3, 4 aur 5 ek hi multi-path `update()` me jaate hain — aadhi mapping likhi rehna
sabse kharab haalat hai.

Image `{oldImageFolder}/MarkingSurveyImages/{ward}/{line}/{image}` se
`DevTest/MarkingSurveyImages/AllMarkerImages/{uid}.jpg` par copy hoti hai.
Image DB record ke baad aaye to `syncMarkerImage_*` (Storage trigger) use baad
me copy kar deta hai.

## Zaroori baatein

- **Pehle data, phir mapping.** Ulta karne par mapping kuch der ke liye aise uid
  par point karti hai jiska record hi nahi hota.
- **Create-only.** Marker ek baar new path par aa gaya to ye use dobara kabhi
  nahi likhtin. Purane record se refresh karne par portal ke approve/edit ud
  jaate — migration me yahi galti pehle ho chuki hai.
- **Guard app ke record par hai** (`MarkedHouses/.../{markerNo}/uid`). Us write
  se trigger dobara chalta hai, par doosri baar `uid` dekh kar ruk jaata hai.
  `movedToNewPath.newMarkerUid` aur (refactor se pehle sync hue markers ke liye)
  purana `OriginalToUid` bhi guard ki tarah padhe jaate hain — warna
  `marker-data-move` se aaye markers dobara ban jaate.
- **Old record se kuch delete nahi hota.** Sirf `uid` aur `movedToNewPath` add
  hote hain, taaki old record khud bata de ki marker new path par ja chuka hai
  aur wahan uska naam kya hai. Mapping node kho jaaye to recovery isi se hoti hai.
- **Marker ABHI kahan hai, ye `movedToNewPath` me NAHI hai** — uska ek hi maalik
  hai, `MarkerWise/{uid}`. Old record par uski copy rakhte to marker move hone
  par wo purani pad jaati aur jhoot bolti.
- **UID transaction se milta hai** (`MarkersMapping/lastMarkerKey`), isliye app
  aur portal ek saath chalein to bhi do markers ko same M number nahi milega.
- **`LineWise` likhna zaroori hai.** Portal ke 15 page ek line ki marker-list
  isi node se banate hain. Iske bina marker `MarkersData` me ban to jaata hai
  par portal par dikhta nahi (pehle yahi chhoot gaya tha). Key = `markerNo`,
  value = uid.
- **`marksCount` / `ApproveStatus` line-level cheezein hain**, marker mapping ka
  hissa nahi — wo `LineSummary` par jaise hain waise rehti hain.
- Line ke neeche pade scalars (`lastMarkerKey`, `marksCount`, `ApproveStatus`)
  aur bina `houseType` wale adhoore record skip hote hain. `houseType` baad me
  aayega to trigger dobara chalega aur tab marker ban jaayega.

## Setup

1. `functions/config.js` me apne database instances daalein:

   ```js
   { db: "dtdnavigatortesting", oldImageFolder: "", bucket: "" }
   ```

   - `db` — RTDB instance ka naam (`https://<db>.firebaseio.com` me se)
   - `oldImageFolder` — app image jahan daalti hai (jaise `Sikar-Survey`).
     Khali chhodenge to sirf data + mapping banega, image copy nahi hogi.
   - `bucket` — khali = project ka default bucket

2. Install + deploy:

   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

## Dhyan rakhein

- **Blaze (pay-as-you-go) plan chahiye** — Cloud Functions free plan par nahi
  chalte.
- Functions usi Firebase project me deploy hote hain jisme database hai. Jin
  cities ka apna projectId hai (`dtdtonk`, `dtdratangarh`, `dtdnokha`,
  `dtdlosal`) unke liye alag deploy karna padega
  (`firebase use <project>` phir dobara deploy).
- Pehle **sirf test DB** par deploy karke check karein: app se ek marker
  daalein aur dekhein ki `MarkersData` + saari mapping ban rahi hai. Sahi lage
  tabhi baaki cities `config.js` me jodein.
- Purane (pehle se pade) markers ke liye ye trigger kuch nahi karega — un par
  ek baar `marker-data-move` chala dein. Uske baad ke saare naye markers ye
  khud sambhal legi.
