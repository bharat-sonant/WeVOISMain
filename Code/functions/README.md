# Marker sync functions

> ## ⚠️ Ye ab chalti nahi hain — pul ka kaam khatam ho chuka hai
>
> Ye functions us waqt banayi gayi thin jab **app purane path par likhti thi**.
> Tab ye har naye marker ko turant new structure me copy kar deti thin, taaki
> portal par wo dikhne lage aur `marker-data-move` chalana na pade.
>
> **Ab app khud seedha new structure likhti hai** — `MarkersData/{uid}` aur
> poori `MarkersMapping` (MarkerWise, WardWise, LineWise, LineSummary), uid
> prefix `MK` ke saath. Yaani `MarkedHouses` par ab koi naya marker aata hi
> nahi, aur ye trigger kabhi chalta hi nahi.
>
> Isliye:
> - **Yahan `marksCount` +1 ya `MarkerWardMapping` mat jodna.** Portal ka
>   `MarkerMappingService.writeMarker()` ye dono karta hai, par app bhi khud
>   karti hai. Dono taraf se hone par ginti **dugni** ho jaati.
> - Code hataya nahi gaya: `marker-data-move` abhi purane tree se data la raha
>   hai, aur kal koi purane path par likh de to ye pul phir kaam aa jayega.
>   Us soorat ke liye iska format aaj theek kar diya gaya hai (uid `MK{n}`,
>   LineWise `{uid}: true`) - pehle ye `M{n}` likhta tha, jo app se mel nahi
>   khaata.

## Kaam kya karti hain (jab chalti thin)

App purane path par likhti thi:

```
EntityMarkingData/MarkedHouses/{ward}/{line}/{markerNo}
```

Wahan naya marker aate hi `syncMarker_*` trigger ye banata hai (bilkul wahi jo
portal ka `MarkerMappingService` banata hai) — **isi order me**:

| # | Path | Value |
| --- | --- | --- |
| 1 | `MarkersMapping/lastMarkerKey` | counter +1 (transaction) → uid `MK{n}` |
| 2 | `MarkersData/{uid}` | poora record + `ward`, `line`, `imgRef` |
| 3 | `MarkersMapping/MarkerWise/{uid}` | `{ward, line}` |
| 4 | `MarkersMapping/WardWise/{ward}/{uid}` | line |
| 5 | `MarkersMapping/LineWise/{ward}/{line}/{uid}` | `true` (uid ka SET, naksha nahi) |
| 6 | `MarkersMapping/LineSummary/{ward}/{line}/lastMarkerKey` | max(purana, markerNo) |
| 7 | `MarkedHouses/{ward}/{line}/{markerNo}/uid` | uid (duplicate guard) |
| 8 | `MarkedHouses/{ward}/{line}/{markerNo}/movedToNewPath` | `{newMarkerUid, newImageName, movedOn}` |

3, 4 aur 5 ek hi multi-path `update()` me jaate hain — aadhi mapping likhi rehna
sabse kharab haalat hai.

Image `{oldImageFolder}/MarkingSurveyImages/{ward}/{line}/{image}` se
`{oldImageFolder}/MarkingSurveyImages/AllMarkerImages/{uid}.jpg` par copy hoti hai.
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

## Database index (optional — sirf speed ke liye)

**Ye lagaye bina bhi portal poora sahi chalta hai.** Default me ward ka data
mapping se aata hai (`WardWise/{ward}` batati hai kaun se uid chahiye, phir
sirf wahi record padhe jaate hain) — isme koi index nahi chahiye.

Ek tez vikalp bhi hai: ward ka poora data **ek hi query** me —

```js
MarkersData.orderByChild("ward").equalTo(ward)
```

Iske liye RTDB rules me index chahiye:

```json
"EntityMarkingData": { "MarkersData": { ".indexOn": ["ward"] } }
```

Snippet `functions/database-index.rules.json` me pada hai — use apne maujooda
rules me **merge** karein (replace nahi), Firebase Console > Realtime Database >
Rules se. Phir Publish.

### Chalu kaise karein

1. Us city ke project me upar wala index lagaayein.
2. Portal me ward page kholein, browser console (F12) dekhein.
   `FIREBASE WARNING: Using an unspecified index...` **nahi** aani chahiye.
3. Tabhi `marker-mapping.service.ts` me `wardQueryEnabled = true` karein.

**Har city ka apna project hai** (`dtdtonk`, `dtdratangarh`, `dtdnokha`,
`dtdlosal`...) — ek me index laga hone ka matlab baaki me laga hona nahi.

### Default `false` kyun hai

Index na laga ho to RTDB query se **mana nahi karta** — wo poora `MarkersData`
node browser ko bhej deta hai aur chhantni wahan hoti hai. Yaani ek ward
kholne par poore shehar ke marker utar aate hain (2,000 marker wale ward aur
50,000 wale shehar me ~25 guna kharcha) — theek wahi kharcha jo purane
`MarkedHouses` wale din tha, jise hatane ke liye ye refactor hua.

Aur ye galti **kahin dikhti nahi**: koi error nahi, page nahi rukta, data bhi
sahi hi aata hai — sirf console me ek warning jo koi nahi dekhta.

Isliye default surakshit raasta hai. Us par sabse bura case "thodi zyada
requests" hai, "poora shehar download" nahi.

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
