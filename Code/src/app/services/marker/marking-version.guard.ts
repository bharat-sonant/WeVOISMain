import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { FirebaseService } from "../../firebase.service";

// Marking pages ab do roop me hain: legacy (purana MarkedHouses structure) aur
// v1 (naya MarkersData structure). Kaunsa chalega ye har city ki apni setting
// tay karti hai:
//
//   Settings/markingManagementSystem = true   -> v1
//   false / key hi nahi                       -> legacy
//
// Ye guard page banne se PEHLE chalta hai, isliye legacy page ki koi DB read
// fire hi nahi hoti aur user ko ek page flash hokar doosre par jaata nahi
// dikhta. Legacy page ki file me kuch nahi badla - sirf route par guard laga hai.
//
// Dono taraf redirect karta hai:
//   setting ON  + legacy URL -> v1 URL
//   setting OFF + v1 URL     -> legacy URL  (bookmark / chipkaya hua link)
//
// Setting padhne me dikkat ho (error, ya der tak jawab na aaye) to KOI redirect
// nahi - user jahan hai wahin rehta hai. Migrate ho chuki city ko chupchaap
// legacy par bhej dena sabse bura hota: legacy page us city me purane structure
// ka data likh deta.
//
// JAAN-BOOJH KAR sirf wahi cheezein istemaal ki hain jo is project me pehle se
// har jagah chalti hain: valueChanges().subscribe() + unsubscribe(), Promise, aur
// router.navigate(). Koi rxjs operator nahi, UrlTree nahi - Angular/RxJS ka
// version purana hai aur naye APIs par code toot sakta hai.
@Injectable({
  providedIn: "root"
})
export class MarkingVersionGuard implements CanActivate {

  settingPath = "Settings/markingManagementSystem";

  // Itni der me setting na aaye to user ko rokte nahi - jahan hai wahin chalne do.
  readTimeoutMs = 5000;

  constructor(private fs: FirebaseService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise((resolve) => {
      let pageIndex = this.getPageIndex(route);
      if (pageIndex < 0) {
        resolve(true);
        return;
      }
      let isV1 = this.isV1Segment(route.routeConfig.path.split("/")[pageIndex]);

      // Pages bhi yahi city padhte hain (ngOnInit me) - guard aur page ek hi DB dekhein.
      let cityName = localStorage.getItem("cityName");
      if (cityName == null || cityName == "") {
        resolve(true);
        return;
      }

      let db: any;
      try {
        db = this.fs.getDatabaseByCity(cityName);
      } catch (error) {
        resolve(true);
        return;
      }

      let done = false;
      let settingInstance: any = null;
      let finish = (allow: boolean) => {
        if (!done) {
          done = true;
          resolve(allow);
        }
      };

      let timer = setTimeout(() => {
        if (settingInstance != null) {
          settingInstance.unsubscribe();
        }
        finish(true);
      }, this.readTimeoutMs);

      settingInstance = db.object(this.settingPath).valueChanges().subscribe(
        (value: any) => {
          settingInstance.unsubscribe();
          clearTimeout(timer);
          if (done) {
            return;
          }
          let wantV1 = value === true;
          if (wantV1 == isV1) {
            finish(true);
            return;
          }
          let target = this.swapPath(route, state.url, pageIndex, wantV1);
          if (target == null) {
            finish(true);
            return;
          }
          finish(false);
          this.router.navigate([target], { queryParams: route.queryParams });
        },
        () => {
          clearTimeout(timer);
          finish(true);
        }
      );
    });
  }

  // Route config me page ka apna segment - aakhri wala jo ":param" nahi hai.
  //   ':cityId/:id/house-marking/:id1'  ->  index 2 ('house-marking')
  getPageIndex(route: ActivatedRouteSnapshot): number {
    if (route.routeConfig == null || route.routeConfig.path == null) {
      return -1;
    }
    let segs = route.routeConfig.path.split("/");
    for (let i = segs.length - 1; i >= 0; i--) {
      if (segs[i] != "" && segs[i].charAt(0) != ":") {
        return i;
      }
    }
    return -1;
  }

  isV1Segment(seg: string): boolean {
    return seg != null && seg.length > 3 && seg.substring(seg.length - 3) == "-v1";
  }

  // Asli URL me sirf page wala segment badalta hai - city, id, params jyon ke
  // tyon. Route config ke segments URL ke AAKHRI segments se milte hain, isliye
  // index peeche se ginte hain. Query string yahan se hata di jaati hai -
  // navigate() use queryParams ke roop me alag se wapas lagata hai.
  swapPath(route: ActivatedRouteSnapshot, url: string, pageIndex: number, toV1: boolean): string {
    let path = url;
    let cut = path.indexOf("?");
    if (cut >= 0) {
      path = path.substring(0, cut);
    }
    cut = path.indexOf("#");
    if (cut >= 0) {
      path = path.substring(0, cut);
    }

    let cfgCount = route.routeConfig.path.split("/").length;
    let urlSegs = path.split("/").filter((s) => s != "");
    let idx = urlSegs.length - cfgCount + pageIndex;
    if (idx < 0 || idx >= urlSegs.length) {
      return null;
    }

    let seg = urlSegs[idx];
    if (toV1) {
      urlSegs[idx] = seg + "-v1";
    } else if (this.isV1Segment(seg)) {
      urlSegs[idx] = seg.substring(0, seg.length - 3);
    } else {
      return null;
    }
    return "/" + urlSegs.join("/");
  }
}
