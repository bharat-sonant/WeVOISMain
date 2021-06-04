// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  
  firebase: { 
    apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
    authDomain: "dtdnavigator.firebaseapp.com",
    databaseURL: "https://dtdnavigator.firebaseio.com",
    projectId: "dtdnavigator",
    storageBucket: "dtdnavigator.appspot.com",
    messagingSenderId: "381118272786"
  },

  firebaseReengus: {
    apiKey: "AIzaSyBGZ_IB4y5Ov1nuqIhWndGU8hfJadlE85I",
    authDomain: "dtdnavigator.firebaseapp.com",
    databaseURL: "https://dtdreengus.firebaseio.com",
    projectId: "dtdnavigator",
    storageBucket: "dtdnavigator.appspot.com",
    messagingSenderId: "381118272786",
    //appId: "1:381118272786:web:7721ceb096f806bcec0fcb"
  }

 /* 

  firebase: {
    apiKey: "AIzaSyA1ZU5hI7Fho0B4ZJO2w8-fsCKMbq95m4c",
    authDomain: "dtdnavigatortesting.firebaseapp.com",
    databaseURL: "https://dtdnavigatortesting.firebaseio.com",
    projectId: "dtdnavigatortesting",
    storageBucket: "dtdnavigatortesting.appspot.com",
    messagingSenderId: "381118272786"
  }
*/
};

