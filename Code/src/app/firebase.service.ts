import { Injectable,NgZone,PLATFORM_ID } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from "angularfire2/database";
import { FirebaseAppConfig,_firebaseAppFactory } from "angularfire2";

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private _db: AngularFireDatabase;
  public fireBase:any;
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
    else if (city == 'shahpura') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdshahpura.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName="dtdshahpura";
      databaseURL= "https://dtdshahpura.firebaseio.com";
    }
    else if (city == 'jaipur-greater') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://iejaipurgreater.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName="iejaipurgreater";
      databaseURL= "https://iejaipurgreater.firebaseio.com";
    }
    else if (city == 'kishangarh') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdkishangarh.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName="dtdkishangarh";
      databaseURL= "https://dtdkishangarh.firebaseio.com";
    }
    else if (city == 'niwai') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdniwai.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName="dtdniwai";
      databaseURL= "https://dtdniwai.firebaseio.com";
    }
    else if (city == 'jaisalmer') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjaisalmer.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName="dtdjaisalmer";
      databaseURL= "https://dtdjaisalmer.firebaseio.com";
    }
    else if (city == 'churu') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdchuru.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName="dtdchuru";
      databaseURL= "https://dtdchuru.firebaseio.com";
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
