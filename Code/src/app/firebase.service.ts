import { Injectable,NgZone,PLATFORM_ID } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from "angularfire2/database";
import { FirebaseAppConfig,_firebaseAppFactory } from "angularfire2";

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private _db: AngularFireDatabase;
  constructor(public zone:NgZone) { }

  /** Function to initialize firebase application and
     * get DB provider for the corresponding application.
     */
   public initFirebaseApp(config: FirebaseAppConfig, firebaseAppName: string) {
    this._db = new AngularFireDatabase(_firebaseAppFactory(config, firebaseAppName),firebaseAppName,"",PLATFORM_ID,this.zone);
}

/** Function to get firebase DB list */
public getList(path: string): AngularFireList<{}> {
    return this._db.list(path);
}

/** Function to get firebase DB object */
public getObject(path: string): AngularFireObject<{}> {
    return this._db.object(path);
}
}
