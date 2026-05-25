import { Component, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common/common.service';
import { HttpClient } from '@angular/common/http';
import { AngularFireStorage } from 'angularfire2/storage';

@Component({
  selector: 'app-survey-app-settings',
  templateUrl: './survey-app-settings.component.html',
  styleUrls: ['./survey-app-settings.component.scss']
})
export class SurveyAppSettingsComponent implements OnInit {

  constructor(private commonService: CommonService, public httpService: HttpClient, private storage: AngularFireStorage) { }

  surveyAppSetting: any = this.getDefaultSetting();
  supportedCodesText: string = '';

  uhfSurveySetting: any = this.getDefaultUhfSetting();
  uhfExpanded: boolean = false;

  isDeveloper: boolean = false;

  ngOnInit() {
    this.isDeveloper = (localStorage.getItem('isDeveloper') || '').toLowerCase() === 'yes';
    this.getSurveyAppSetting();
    this.getUhfSurveySetting();
  }

  toggleUhf() {
    this.uhfExpanded = !this.uhfExpanded;
  }

  getDefaultUhfSetting() {
    return {
      survey: {
        requiredDistanceMeters: 30,
        maxAcceptableAccuracyMeters: 25
      },
      map: {
        defaultRegion: {
          latitude: 28.6139,
          longitude: 77.2090,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012
        },
        locationAnimateRegion: {
          latitudeDelta: 0.0045,
          longitudeDelta: 0.0045,
          animateDuration: 450
        },
        markerAnimateDuration: 800
      },
      location: {
        watchPosition: {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 3000,
          timeout: 15000,
          maximumAge: 2000
        },
        getCurrentPosition: {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      },
      sync: {
        intervalMs: 20000
      },
      messages: {
        survey: {
          missingFields: 'सभी जरूरी सर्वे स्टेप पूरे करें।',
          saveSuccess: 'Survey saved successfully!',
          saveFailed: 'Survey save failed'
        },
        location: {
          gpsUnavailable: 'GPS बंद है या उपलब्ध नहीं है। कृपया पुनः प्रयास करें।',
          gpsTurnOn: 'कृपया GPS / Location चालू करें।',
          accuracyLow: 'GPS accuracy कम है। पुनः प्रयास करें।',
          permissionDenied: 'Location permission denied. कृपया location अनुमति दें।',
          lineStartUnavailable: 'Line start point available नहीं है।'
        },
        distance: {
          outOfRange: 'आप अभी {{currentDistance}} मीटर दूर हैं। कृपया सर्वे के लिए {{requiredDistance}} मीटर की रेंज में आएँ।'
        },
        card: {
          duplicateCardTemplate: 'यह कार्ड <b>${cardNumber}</b> किसी ओर house पे पहले से ही लगा है'
        }
      }
    };
  }

  getUhfSurveySetting() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + '%2FSettings%2FHUFSurveySettings.json?alt=media';
    let instance = this.httpService.get(path).subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        this.uhfSurveySetting = this.deepMerge(this.getDefaultUhfSetting(), data);
      }
    }, () => { });
  }

  saveUhfSurveySetting() {
    const u = this.uhfSurveySetting;

    u.survey.requiredDistanceMeters = Number(u.survey.requiredDistanceMeters);
    u.survey.maxAcceptableAccuracyMeters = Number(u.survey.maxAcceptableAccuracyMeters);

    const dr = u.map.defaultRegion;
    dr.latitude = Number(dr.latitude);
    dr.longitude = Number(dr.longitude);
    dr.latitudeDelta = Number(dr.latitudeDelta);
    dr.longitudeDelta = Number(dr.longitudeDelta);

    const lar = u.map.locationAnimateRegion;
    lar.latitudeDelta = Number(lar.latitudeDelta);
    lar.longitudeDelta = Number(lar.longitudeDelta);
    lar.animateDuration = Number(lar.animateDuration);

    u.map.markerAnimateDuration = Number(u.map.markerAnimateDuration);

    const wp = u.location.watchPosition;
    wp.distanceFilter = Number(wp.distanceFilter);
    wp.interval = Number(wp.interval);
    wp.fastestInterval = Number(wp.fastestInterval);
    wp.timeout = Number(wp.timeout);
    wp.maximumAge = Number(wp.maximumAge);

    const gp = u.location.getCurrentPosition;
    gp.timeout = Number(gp.timeout);
    gp.maximumAge = Number(gp.maximumAge);

    u.sync.intervalMs = Number(u.sync.intervalMs);

    this.uploadCleanJson(this.uhfSurveySetting, 'HUFSurveySettings.json');
  }

  getDefaultSetting() {
    return {
      messages: {
        messageMinimumDistanceMarkerAndSurvey: {
          template: 'आप अभी ${currentDistance} दूर हैं। कृपया सर्वे के लिए ${requiredDistance} मीटर की रेंज में आएँ।',
          placeholders: ['currentDistance', 'requiredDistance']
        },
        sameCardOnTwoMarkerMessage: {
          template: 'यह कार्ड <b>${cardNumber}</b> किसी ओर मार्कर पे पहले से ही लगा है',
          placeholders: ['cardNumber']
        },
        scanByCameraNoteMessage: {
          template: 'नोट : कृपया कार्ड को <span>Scan Card</span> बटन पर Click करके स्कैन करें |'
        },
        alreadyRevisited: {
          template: 'इस मार्किंग पे पहले ही <b>Revisit</b> हो चुका है।'
        },
        alreadySurveyed: {
          template: 'इस मार्किंग पर पहले ही <b>Survey</b> हो चुका है।'
        },
        versionExperiedMessage: {
          template: 'This app version has expired. Please update.'
        },
        NoWorkAssignedPopupMessage: {
          template: 'No work assigned, please contact to administrator'
        },
        logOutPopupText: {
          template: 'Are you sure you want to log out?'
        },
        locationOffPopupmessage: {
          template: 'कृपया GPS / Location चालू करें।'
        },
        lowAccuracyMessage: {
          template: 'GPS accuracy कम है। पुनः प्रयास करें।'
        },
        locationErrorMessage: {
          template: 'GPS बंद है या उपलब्ध नहीं है। कृपया पुनः प्रयास करें।'
        },
        networkOffPopupmessage: {
          template: 'कृपया Mobile Data या Wi-Fi चालू करें।'
        },
        noDataFoundMessage: {
          template: 'कोई डेटा उपलब्ध नहीं है। कृपया प्रशासक (Administrator) से संपर्क करें।'
        },
        exitAppMessage: {
          template: 'Do you want to exit the application?'
        }
      },
      settings: {
        minimumDistanceBetweenMarkerAndSurvey: 200,
        isBuildingDetailRequired: 'yes',
        surveyByQrCode: 'yes',
        minAccForSurvey: 50,
        redirectGoogleMapAccuracy: 20,
        showCurrentLocationAccuracy: 20,
        isUhfCardScan: 'no'
      },
      locationTrackingSettings: {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 10000,
        fastestInterval: 6000,
        useSignificantChanges: false,
        maximumAge: 0,
        accuracy: 20
      },
      NativeSettings: {
        qrScannerSettings: {
          messages: {
            permissionDenied: 'कृपया कैमरा अनुमति दें।',
            cameraLoading: 'कैमरा लोड हो रहा है…',
            alignQR: '📷✨ कृपया QR को फ्रेम के अंदर रखें।',
            cameraPermissionRequired: 'कैमरा उपयोग की अनुमति आवश्यक है।'
          },
          scanConfig: {
            scanLineSpeed: 1500,
            frameSizeRatio: 0.70,
            supportedCodes: ['qr', 'ean-13']
          }
        },
        imageCapture: {
          compression: {
            maxFileSizeKB: 50,
            initialQuality: 100,
            minQuality: 50,
            qualityStep: 5,
            initialWidth: 800,
            initialHeight: 800,
            minWidth: 600,
            minHeight: 600,
            resolutionStep: 200
          },
          layout: {
            popupHeightRatio: 0.72
          }
        },
        CardOcrSettings: {
          layout: {
            popupWidthRatio: 0.88,
            frameHeight: 230
          },
          scanConfig: {
            maxRetries: 10,
            retryDelay: 200,
            frameProcessorFps: 3,
            initDelay: 2500
          },
          messages: {
            loadingDeviceMessage: 'कैमरा लोड हो रहा है…',
            permissionDeniedMessage: 'कृपया कैमरा अनुमति दें।',
            cameraPermissionRequired: 'कैमरा उपयोग की अनुमति आवश्यक है।'
          }
        }
      }
    };
  }

  get buildingDetailBool(): boolean {
    return this.surveyAppSetting.settings.isBuildingDetailRequired === 'yes';
  }
  set buildingDetailBool(v: boolean) {
    this.surveyAppSetting.settings.isBuildingDetailRequired = v ? 'yes' : 'no';
  }

  get surveyByQrBool(): boolean {
    return this.surveyAppSetting.settings.surveyByQrCode === 'yes';
  }
  set surveyByQrBool(v: boolean) {
    this.surveyAppSetting.settings.surveyByQrCode = v ? 'yes' : 'no';
  }

  get uhfCardScanBool(): boolean {
    return this.surveyAppSetting.settings.isUhfCardScan === 'yes';
  }
  set uhfCardScanBool(v: boolean) {
    this.surveyAppSetting.settings.isUhfCardScan = v ? 'yes' : 'no';
  }

  getSurveyAppSetting() {
    const path = this.commonService.fireStoragePath + this.commonService.getFireStoreCity() + '%2FSettings%2FSurveySettings.json?alt=media';
    let instance = this.httpService.get(path).subscribe(data => {
      instance.unsubscribe();
      if (data != null) {
        this.surveyAppSetting = this.mergeWithDefault(data);
      }
      this.supportedCodesText = (this.surveyAppSetting.NativeSettings.qrScannerSettings.scanConfig.supportedCodes || []).join(',');
    }, () => {
      this.supportedCodesText = (this.surveyAppSetting.NativeSettings.qrScannerSettings.scanConfig.supportedCodes || []).join(',');
    });
  }

  mergeWithDefault(data: any) {
    const def = this.getDefaultSetting();
    const out = JSON.parse(JSON.stringify(def));
    for (const section of Object.keys(out)) {
      if (data[section]) {
        if (section === 'messages') {
          for (const key of Object.keys(out.messages)) {
            if (data.messages && data.messages[key]) {
              out.messages[key].template = data.messages[key].template || out.messages[key].template;
              if (data.messages[key].placeholders) {
                out.messages[key].placeholders = data.messages[key].placeholders;
              }
            }
          }
        } else if (section === 'NativeSettings') {
          out.NativeSettings = this.deepMerge(out.NativeSettings, data.NativeSettings);
        } else {
          out[section] = { ...out[section], ...data[section] };
        }
      }
    }
    return out;
  }

  deepMerge(target: any, source: any) {
    if (!source) return target;
    const out = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        out[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }

  saveSurveyAppSetting() {
    this.surveyAppSetting.NativeSettings.qrScannerSettings.scanConfig.supportedCodes =
      (this.supportedCodesText || '').split(',').map(s => s.trim()).filter(s => s.length > 0);

    const s = this.surveyAppSetting.settings;
    s.minimumDistanceBetweenMarkerAndSurvey = Number(s.minimumDistanceBetweenMarkerAndSurvey);
    s.minAccForSurvey = Number(s.minAccForSurvey);
    s.redirectGoogleMapAccuracy = Number(s.redirectGoogleMapAccuracy);
    s.showCurrentLocationAccuracy = Number(s.showCurrentLocationAccuracy);
    s.isBuildingDetailRequired = this.normaliseYesNo(s.isBuildingDetailRequired);
    s.surveyByQrCode = this.normaliseYesNo(s.surveyByQrCode);
    s.isUhfCardScan = this.normaliseYesNo(s.isUhfCardScan);

    const lt = this.surveyAppSetting.locationTrackingSettings;
    lt.distanceFilter = Number(lt.distanceFilter);
    lt.interval = Number(lt.interval);
    lt.fastestInterval = Number(lt.fastestInterval);
    lt.maximumAge = Number(lt.maximumAge);
    lt.accuracy = Number(lt.accuracy);

    const qs = this.surveyAppSetting.NativeSettings.qrScannerSettings.scanConfig;
    qs.scanLineSpeed = Number(qs.scanLineSpeed);
    qs.frameSizeRatio = Number(qs.frameSizeRatio);

    const ic = this.surveyAppSetting.NativeSettings.imageCapture;
    const c = ic.compression;
    c.maxFileSizeKB = Number(c.maxFileSizeKB);
    c.initialQuality = Number(c.initialQuality);
    c.minQuality = Number(c.minQuality);
    c.qualityStep = Number(c.qualityStep);
    c.initialWidth = Number(c.initialWidth);
    c.initialHeight = Number(c.initialHeight);
    c.minWidth = Number(c.minWidth);
    c.minHeight = Number(c.minHeight);
    c.resolutionStep = Number(c.resolutionStep);
    ic.layout.popupHeightRatio = Number(ic.layout.popupHeightRatio);

    const oc = this.surveyAppSetting.NativeSettings.CardOcrSettings;
    oc.layout.popupWidthRatio = Number(oc.layout.popupWidthRatio);
    oc.layout.frameHeight = Number(oc.layout.frameHeight);
    oc.scanConfig.maxRetries = Number(oc.scanConfig.maxRetries);
    oc.scanConfig.retryDelay = Number(oc.scanConfig.retryDelay);
    oc.scanConfig.frameProcessorFps = Number(oc.scanConfig.frameProcessorFps);
    oc.scanConfig.initDelay = Number(oc.scanConfig.initDelay);

    this.uploadCleanJson(this.surveyAppSetting, 'SurveySettings.json');
  }

  private uploadCleanJson(data: any, fileName: string) {
    const jsonStr = JSON.stringify(data, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const fireStorePath = this.commonService.fireStoragePath;
    const path = this.commonService.getFireStoreCity() + '/Settings/' + fileName;
    const ref = (this.storage as any).storage.app.storage(fireStorePath).ref(path);
    ref.put(blob).then(() => {
      this.commonService.setAlertMessage('success', 'Survey app setting updated !!!');
    }).catch(() => {
      this.commonService.setAlertMessage('error', 'Failed to save Survey settings.');
    });
  }

  normaliseYesNo(v: any): string {
    const s = (v || '').toString().trim().toLowerCase();
    return s === 'yes' ? 'yes' : 'no';
  }
}
