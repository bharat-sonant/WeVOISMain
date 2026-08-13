// Har city ka apna Realtime Database instance hai, isliye har instance ke liye
// ek alag trigger banta hai. Yahan sirf wahi instances daalein jinme ye chalu
// karna hai - jo yahan nahi hai us DB par kuch nahi hoga.
//
// db              = RTDB instance ka naam (databaseURL me se, e.g.
//                   https://dtdnavigatortesting.firebaseio.com -> "dtdnavigatortesting")
// oldImageFolder  = app marker ki image jis folder me daalti hai
//                   ({oldImageFolder}/MarkingSurveyImages/{ward}/{line}/{markerNo}.jpg).
//                   Khali chhod dein to image copy band rahegi (data + mapping
//                   phir bhi banega).
// bucket          = Storage bucket. Khali = project ka default bucket.
//
// NOTE: functions usi Firebase project me deploy hote hain jisme ye databases
// hain. Jin cities ka apna alag projectId hai (dtdtonk, dtdratangarh, dtdnokha,
// dtdlosal) unke liye alag se deploy karna padega.
module.exports = [
  {
    db: "dtdnavigatortesting",
    oldImageFolder: "",
    bucket: "",
  },
];
