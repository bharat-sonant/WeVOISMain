import { Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from "angularfire2/database";
import { FirebaseAppConfig, _firebaseAppFactory } from "angularfire2";

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private _db: AngularFireDatabase;
  public fireBase: any;
  constructor(public zone: NgZone) { }


  getDatabaseByCity(city: any) {
    let databaseName = "";
    let databaseURL = "";
    let storageBucket="";

    if (city == 'sikar') {
      this.fireBase = {
        apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnavigator.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786"
      };
      databaseName = "dtdnavigator";
      databaseURL = "https://dtdnavigator.firebaseio.com";
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
      databaseName = "dtdreengus";
      databaseURL = "https://dtdreengus.firebaseio.com";
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
      databaseName = "dtdnavigatortesting";
      databaseURL = "https://dtdnavigatortesting.firebaseio.com";
      /*
            this.fireBase = {
              apiKey: "AIzaSyAXeDgQu4b7pNzCbFf0GmYm-0xYmZ6LEbw",
              authDomain: "wevoiscomplaints.firebaseapp.com",
              databaseURL: "https://wevoiscomplaints-default-rtdb.firebaseio.com",
              projectId: "wevoiscomplaints",
              storageBucket: "wevoiscomplaints.appspot.com",
              messagingSenderId: "501093550605"
            };
            databaseName = "wevoiscomplaints-default-rtdb";
            databaseURL = "https://wevoiscomplaints-default-rtdb.firebaseio.com";*/
    }
    else if (city == 'jaipur-office') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjaipur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdjaipur";
      databaseURL = "https://dtdjaipur.firebaseio.com";
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
      databaseName = "dtdshahpura";
      databaseURL = "https://dtdshahpura.firebaseio.com";
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
      databaseName = "iejaipurgreater";
      databaseURL = "https://iejaipurgreater.firebaseio.com";
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
      databaseName = "dtdkishangarh";
      databaseURL = "https://dtdkishangarh.firebaseio.com";
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
      databaseName = "dtdniwai";
      databaseURL = "https://dtdniwai.firebaseio.com";
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
      databaseName = "dtdjaisalmer";
      databaseURL = "https://dtdjaisalmer.firebaseio.com";
    }
    else if (city == 'salasar') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdsalasar.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdsalasar";
      databaseURL = "https://dtdsalasar.firebaseio.com";
    }
    else if (city == 'behror') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdbehror.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdbehror";
      databaseURL = "https://dtdbehror.firebaseio.com";
    }
    else if (city == 'jaipur') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipurd2d.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipurd2d";
      databaseURL = "https://jaipurd2d.firebaseio.com";
    }
    else if (city == 'jaipur-jagatpura') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-jagatpura.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-jagatpura";
      databaseURL = "https://jaipur-jagatpura.firebaseio.com";
    }
    else if (city == 'jaipur-jhotwara') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-jhotwara.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-jhotwara";
      databaseURL = "https://jaipur-jhotwara.firebaseio.com";
    }
    else if (city == 'jaipur-malviyanagar') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-malviyanagar.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-malviyanagar";
      databaseURL = "https://jaipur-malviyanagar.firebaseio.com";
    }
    else if (city == 'jaipur-mansarovar') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-mansarovar.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-mansarovar";
      databaseURL = "https://jaipur-mansarovar.firebaseio.com";
    }
    else if (city == 'jaipur-murlipura') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-murlipura.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-murlipura";
      databaseURL = "https://jaipur-murlipura.firebaseio.com";
    }
    else if (city == 'jaipur-sanganer') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-sanganer.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-sanganer";
      databaseURL = "https://jaipur-sanganer.firebaseio.com";
    }
    else if (city == 'jaipur-vidhyadhar') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-vidhyadhar.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-vidhyadhar";
      databaseURL = "https://jaipur-vidhyadhar.firebaseio.com";
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
      databaseName = "dtdchuru";
      databaseURL = "https://dtdchuru.firebaseio.com";
    }
    else if (city == 'bhiwadi') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdbhiwadi.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdbhiwadi";
      databaseURL = "https://dtdbhiwadi.firebaseio.com";
    }
    else if (city == 'chhapar') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdchhapar.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdchhapar";
      databaseURL = "https://dtdchhapar.firebaseio.com";
    }
    else if (city == 'wevois-others') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdwevois.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdwevois";
      databaseURL = "https://dtdwevois.firebaseio.com";
    }
    else if (city == 'gwalior') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdgwalior.firebaseapp.com",
        databaseURL: "https://dtdwevois.firebaseio.com",
        projectId: "dtdgwalior",
        storageBucket: "dtdgwalior.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdgwalior";
      databaseURL = "https://dtdgwalior.firebaseio.com";
    }
    else if (city == 'tonk') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdtonk.firebaseio.com",
        projectId: "dtdtonk",
        storageBucket: "dtdtonk.appspot.com",
        messagingSenderId: "381118272786",
        //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
      };
      databaseName = "dtdtonk";
      databaseURL = "https://dtdtonk.firebaseio.com";
    }
    else if (city == 'ratangarh') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdratangarh.firebaseio.com",
        projectId: "dtdratangarh",
        storageBucket: "dtdratangarh.appspot.com",
        messagingSenderId: "381118272786",
        //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
      };
      databaseName = "dtdratangarh";
      databaseURL = "https://dtdratangarh.firebaseio.com";
    }
    else if (city == 'nokha') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnokha.firebaseio.com",
        projectId: "dtdnokha",
        storageBucket: "dtdnokha.appspot.com",
        messagingSenderId: "381118272786",
        //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
      };
      databaseName = "dtdnokha";
      databaseURL = "https://dtdnokha.firebaseio.com";
    }
    else if (city == 'losal') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdlosal.firebaseio.com",
        projectId: "dtdlosal",
        storageBucket: "dtdlosal.appspot.com",
        messagingSenderId: "381118272786",
        //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
      };
      databaseName = "dtdlosal";
      databaseURL = "https://dtdlosal.firebaseio.com";
    }
    else if (city == 'jaipur-test') {
      this.fireBase = {
        apiKey: "AIzaSyDY3RKGXoZ8IhMZomjJigmLDTJHiu6dFE8",
        authDomain: "wevois-qa-main.firebaseapp.com",
        databaseURL: "https://dtdjaipurtest.firebaseio.com",
        projectId: "wevois-qa-main",
        storageBucket: "wevois-qa-main.appspot.com",
        messagingSenderId: "422543231527",
        appId: "1:422543231527:web:16b4b0a7ddd94e5955dc02"
      };
      databaseName = "dtdjaipurtest";
      databaseURL = "https://dtdjaipurtest.firebaseio.com";
      storageBucket="wevois-qa-main.appspot.com";
    }
    else if (city == 'mnz-test') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdmnz-test.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdmnz-test";
      databaseURL = "https://dtdmnz-test.firebaseio.com";
    }
    else if (city == 'mpz-test') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdmpz-test.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdmpz-test";
      databaseURL = "https://dtdmpz-test.firebaseio.com";
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
