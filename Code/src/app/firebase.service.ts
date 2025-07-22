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
    let storageBucket = "";

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
       apiKey: "AIzaSyCajQzNe9gN3DrINuPm4kBGEnW-ZnP1zj8",
       authDomain: "wevois-dev.firebaseapp.com",
       databaseURL: "https://wevois-tm.firebaseio.com",
       projectId: "wevois-dev",
       storageBucket: "wevois-dev.appspot.com",
       messagingSenderId: "255015005490",
       appId: "1:255015005490:web:d5ae79aea93ffe6c37bb2b",
       measurementId: "G-FC4JRSRMZB"
     };
     databaseName = "wevois-tm";
     databaseURL = "https://wevois-tm.firebaseio.com";
     */

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
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjaipur-test.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
        //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
      };
      databaseName = "dtdjaipur-test";
      databaseURL = "https://dtdjaipur-test.firebaseio.com";
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
    else if (city == 'jammu-survey') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjammu-survey.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdjammu-survey";
      databaseURL = "https://dtdjammu-survey.firebaseio.com";
    }
    else if (city == 'khandela') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdkhandela.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdkhandela";
      databaseURL = "https://dtdkhandela.firebaseio.com";
    }
    else if (city == 'dehradun') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtddehradun.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtddehradun";
      databaseURL = "https://dtddehradun.firebaseio.com";
    }
    else if (city == 'pali') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdpali.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdpali";
      databaseURL = "https://dtdpali.firebaseio.com";
    }
    else if (city == 'phulwari-sharif') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdphulwari-sharif.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdphulwari-sharif";
      databaseURL = "https://dtdphulwari-sharif.firebaseio.com";
    }
    else if (city == 'sujangarh') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdsujangarh.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdsujangarh";
      databaseURL = "https://dtdsujangarh.firebaseio.com";
    }
    else if (city == 'noida') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnoida.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdnoida";
      databaseURL = "https://dtdnoida.firebaseio.com";
    }
    else if (city == 'sikar-survey') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdsikar-survey.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdsikar-survey";
      databaseURL = "https://dtdsikar-survey.firebaseio.com";
    }
    else if (city == 'jodhpur') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnjodhpur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdnjodhpur";
      databaseURL = "https://dtdnjodhpur.firebaseio.com";
    }
    else if (city == 'kuchaman') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdkuchaman.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdkuchaman";
      databaseURL = "https://dtdkuchaman.firebaseio.com";
    }
    else if (city == 'jodhpur-bwg') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjodhpur-bwg.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdjodhpur-bwg";
      databaseURL = "https://dtdjodhpur-bwg.firebaseio.com";
    }
    else if (city == 'chirawa') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdchirawa.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdchirawa";
      databaseURL = "https://dtdchirawa.firebaseio.com";
    }
    else if (city == 'nawa') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdnawa.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdnawa";
      databaseURL = "https://dtdnawa.firebaseio.com";
    }
    else if (city == 'chirawa') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdchirawa.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdchirawa";
      databaseURL = "https://dtdchirawa.firebaseio.com";
    }
    else if (city == 'sonipat') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdsonipat-new.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdsonipat-new";
      databaseURL = "https://dtdsonipat-new.firebaseio.com";
    }
    else if (city == 'iit-roorkee') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdiit-roorkee.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdiit-roorkee";
      databaseURL = "https://dtdiit-roorkee.firebaseio.com";
    }
    else if (city == 'tonk-raj') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdtonk-raj.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdtonk-raj";
      databaseURL = "https://dtdtonk-raj.firebaseio.com";
    }
    else if (city == 'jaipur-bwg') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjaipur-bwg.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdjaipur-bwg";
      databaseURL = "https://dtdjaipur-bwg.firebaseio.com";
    }
    else if (city == 'bharatpur') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdbharatpur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdbharatpur";
      databaseURL = "https://dtdbharatpur.firebaseio.com";
    }
    else if (city == 'etmadpur') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdetmadpur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdetmadpur";
      databaseURL = "https://dtdetmadpur.firebaseio.com";
    }
    else if (city == 'uniara') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtduniara.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtduniara";
      databaseURL = "https://dtduniara.firebaseio.com";
    }
    else if (city == 'sujalpur') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdsujalpur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdsujalpur";
      databaseURL = "https://dtdsujalpur.firebaseio.com";
    }
    else if (city == 'ajmer') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdajmer.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdajmer";
      databaseURL = "https://dtdajmer.firebaseio.com";
    }
    else if (city == 'rajsamand') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdrajsamand.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdrajsamand";
      databaseURL = "https://dtdrajsamand.firebaseio.com";
    }
    else if (city == 'sultanpur') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdsultanpur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdsultanpur";
      databaseURL = "https://dtdsultanpur.firebaseio.com";
    }
    else if (city == 'khairabad') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdkhairabad.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdkhairabad";
      databaseURL = "https://dtdkhairabad.firebaseio.com";
    }
    else if (city == 'sanchore') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdsanchore.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdsanchore";
      databaseURL = "https://dtdsanchore.firebaseio.com";
    }
    else if (city == 'jaunpur') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdjaunpur.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdjaunpur";
      databaseURL = "https://dtdjaunpur.firebaseio.com";
    }
    else if (city == 'jaipur-civil-line') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-civil-line.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-civil-line";
      databaseURL = "https://jaipur-civil-line.firebaseio.com";
    }
    else if (city == 'jaipur-kishanpole') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-kishanpole.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "jaipur-kishanpole";
      databaseURL = "https://jaipur-kishanpole.firebaseio.com";
    }
    else if (city == 'mapusa-goa') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdmapusa-goa.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdmapusa-goa";
      databaseURL = "https://dtdmapusa-goa.firebaseio.com";
    }
    else if (city == 'ecogram') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdecogram.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdecogram";
      databaseURL = "https://dtdecogram.firebaseio.com";
    }
    else if (city == 'jaipur-textile-recycling-facility') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://jaipur-textile-recycling-facility.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdecogram";
      databaseURL = "https://jaipur-textile-recycling-facility.firebaseio.com";
    }
    else if (city == 'chennai') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdchennai.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdchennai";
      databaseURL = "https://dtdchennai.firebaseio.com";
    }
    else if (city == 'dausa') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtddausa.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtddausa";
      databaseURL = "https://dtddausa.firebaseio.com";
    }
    else if (city == 'dei-bundi') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtddei-bundi.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtddei-bundi";
      databaseURL = "https://dtddei-bundi.firebaseio.com";
    }
    else if (city == 'biofics-surat') {
      this.fireBase = {
        apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
        authDomain: "dtdnavigator.firebaseapp.com",
        databaseURL: "https://dtdbiofics-surat.firebaseio.com",
        projectId: "dtdnavigator",
        storageBucket: "dtdnavigator.appspot.com",
        messagingSenderId: "381118272786",
      };
      databaseName = "dtdbiofics-surat";
      databaseURL = "https://dtdbiofics-surat.firebaseio.com";
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
