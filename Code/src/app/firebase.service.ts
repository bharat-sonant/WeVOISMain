import { Injectable,NgZone,PLATFORM_ID } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from "angularfire2/database";
import { FirebaseAppConfig,_firebaseAppFactory } from "angularfire2";

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private _db: AngularFireDatabase;
  public fireBase:any
  constructor(public zone:NgZone) { }

  
  getDatabaseByCity(city: any) {
    let databaseName="";
    let databaseURL="";
    
    if (city == 'sikar') {
      this.fireBase = {
        apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnavigator.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786"
      };
      databaseName="dtdnavigator";
      databaseURL="https://dtdnavigator.firebaseio.com";
    }
    else if (city == 'reengus') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdreengus.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
        //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
      };
      databaseName="dtdreengus";
      databaseURL= "https://dtdreengus.firebaseio.com";
    }
    else if (city == 'test') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnavigatortesting.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786"
      };
      databaseName="dtdnavigatortesting";
      databaseURL= "https://dtdnavigatortesting.firebaseio.com";
    }
    else if (city == 'demo') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjaipur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName="dtdjaipur";
      databaseURL= "https://dtdjaipur.firebaseio.com";
    }
    
    return new AngularFireDatabase(
      _firebaseAppFactory(this.fireBase, databaseName),
      databaseName,
      databaseURL,
      PLATFORM_ID,
      this.zone
    );
  }
}