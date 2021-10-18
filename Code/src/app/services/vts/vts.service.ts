import { CommonService } from './../common/common.service';
import { Injectable } from '@angular/core';
import { FirebaseService } from "../../firebase.service";

@Injectable({
  providedIn: 'root'
})
export class VtsService {

  constructor(private fs:FirebaseService) { }
  
}
