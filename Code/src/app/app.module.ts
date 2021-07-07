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

let firebase = {
  apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
  authDomain: "dtdnavigator.firebaseapp.com",
  databaseURL: "https://dtdnavigator.firebaseio.com",
  projectId: "dtdnavigator",
  storageBucket: "dtdnavigator.appspot.com",
  messagingSenderId: "381118272786"
};
let city = localStorage.getItem('cityName');
if (city == 'sikar') {
  firebase = {
    apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
    authDomain: "dtdnavigator.firebaseapp.com",
    databaseURL: "https://dtdnavigator.firebaseio.com",
    projectId: "dtdnavigator",
    storageBucket: "dtdnavigator.appspot.com",
    messagingSenderId: "381118272786"
  };
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
}
else if (city == 'jaipur') {
  firebase = {
    apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
    authDomain: "dtdnavigator.firebaseapp.com",
    databaseURL: "https://dtdjaipur.firebaseio.com",
    projectId: "dtdnavigator",
    storageBucket: "dtdnavigator.appspot.com",
    messagingSenderId: "381118272786",
  };
}
else if (city == 'demo') {
  firebase = {
    apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
    authDomain: "dtdnavigator.firebaseapp.com",
    databaseURL: "https://dtdnavigatortesting.firebaseio.com",
    projectId: "dtdnavigator",
    storageBucket: "dtdnavigator.appspot.com",
    messagingSenderId: "381118272786"
  };
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
    AngularFirestoreModule // for firestore
  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent,
  ],
  providers: [{ provide: FirestoreSettingsToken, useValue: {} }],
  bootstrap: [AppComponent]
})
export class AppModule {

}
