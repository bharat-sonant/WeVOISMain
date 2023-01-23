import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './components/components.module';
import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireStorageModule } from 'angularfire2/storage';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { FirestoreSettingsToken } from '@angular/fire/firestore';
import { SpeedTestModule } from 'ng-speed-test';



//import * as express from 'express';
//import * as cors from '@Types/cors';

//const app = express();

//app.use(function(req, res, next) {
//  res.header("Access-Control-Allow-Origin", "*");
//  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//  next();
//});

let firebase = {
  apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
  authDomain: "dtdnavigator.firebaseapp.com",
  databaseURL: "https://dtdnavigator.firebaseio.com",
  projectId: "dtdnavigator",
  storageBucket: "dtdnavigator.appspot.com",
  messagingSenderId: "381118272786",
};

let databaseName = "dtdnavigator";
let databaseURL = "https://dtdnavigator.firebaseio.com";

let city = localStorage.getItem("cityName");
if (city != null) {
  if (city == 'sikar') {
    firebase = {
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
    firebase = {
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
    firebase = {
      apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
      authDomain: "dtdnavigator.firebaseapp.com",
      databaseURL: "https://dtdnavigatortesting.firebaseio.com",
      projectId: "dtdnavigator",
      storageBucket: "dtdnavigator.appspot.com",
      messagingSenderId: "381118272786"
    };
    databaseName = "dtdnavigatortesting";
    databaseURL = "https://dtdnavigatortesting.firebaseio.com";
  }
  else if (city == 'jaipur-office') {
    firebase = {
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
    firebase = {
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
    firebase = {
      apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
      authDomain: "dtdnavigator.firebaseapp.com",
      databaseURL: "https://iejaipurgreater.firebaseio.com",
      projectId: "dtdnavigator",
      storageBucket: "dtdnavigator.appspot.com",
      messagingSenderId: "381118272786",
      //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
    };
    databaseName = "dtdreengus";
    databaseURL = "https://dtdreengus.firebaseio.com";
  }
  else if (city == 'kishangarh') {
    firebase = {
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
}


@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ComponentsModule,
    RouterModule,
    AppRoutingModule,
    NgbModule,
    ToastrModule.forRoot(),
    AngularFireModule.initializeApp(firebase),
    AngularFireDatabaseModule, // for database
    AngularFireStorageModule, // for storage
    AngularFirestoreModule, // for firestore
    SpeedTestModule,
  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent
 
  
   
  ],
  providers: [{ provide: FirestoreSettingsToken, useValue: {} }],
  bootstrap: [AppComponent]
})
export class AppModule {

}
