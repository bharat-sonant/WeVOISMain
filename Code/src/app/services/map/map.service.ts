import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class MapService {

  constructor() { }

  getAllZones() {
    return JSON.parse(localStorage.getItem('zones'));
  }

  getOldZones() {
    return JSON.parse(localStorage.getItem('all-zones'));
  }

  getlatestZones() {
    return JSON.parse(localStorage.getItem('latest-zones'));
  }

  getZones(selectedDate: any) {

    if (new Date(selectedDate) < new Date("2019-08-21")) {
      return JSON.parse(localStorage.getItem('all-zones'));
    } else if (new Date(selectedDate) > new Date("2019-08-21") && new Date(selectedDate) < new Date("2019-12-26")) {
      return JSON.parse(localStorage.getItem('zones'));
    }
    else if (new Date(selectedDate) > new Date("2019-12-26") && new Date(selectedDate) < new Date("2020-04-05")) {
      return JSON.parse(localStorage.getItem('marchToToAprilZones'));
    }
    else {
      return JSON.parse(localStorage.getItem('latest-zones'));
    }
  }
}
 