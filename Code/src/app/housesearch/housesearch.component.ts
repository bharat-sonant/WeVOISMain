import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { query } from '@angular/core/src/render3';
import { ToastrService } from 'ngx-toastr';
import * as $ from "jquery";
import { formatDate } from '@angular/common';


@Component({
  selector: 'app-house-search',
  templateUrl: './housesearch.component.html',
  styleUrls: ['./housesearch.component.scss']
})

export class HouseSearchComponent implements OnInit {
  wardno: any;
  lineno: any;
  name: any;
  cardno: any;
  address: any;
  rfid: any;
  swapdetails: any;
  carddetails: any;
  day: any;
  details: any;
  nocontactrecord: any;
  nocardrecord: any;
  lesswork: any;
  averagework: any;
  mostwork: any;
  countpercentage: any;

  constructor(public db: AngularFireDatabase, private toastr: ToastrService) { }
  ngOnInit() {
  }


  onSubmit() {


    let contact = (<HTMLInputElement>document.getElementById("contact")).value;
    let card = (<HTMLInputElement>document.getElementById("card")).value;


    if (contact) {

      if ((<HTMLInputElement>document.getElementById("month")).value == "empty") {
        $('table').hide();
        $('#nocontactrecord').hide();
        $('#nocardrecord').hide();
        this.toastr.error("Please enter a month.", '', {
          timeOut: 60000,
          enableHtml: true,
          closeButton: true,
          toastClass: "alert alert-danger alert-with-icon",
          positionClass: 'toast-bottom-right'
        });
      }



      else {

        let dbPath = 'HouseWardMapping/' + contact;
        this.db.object(dbPath).valueChanges().subscribe(data => {
          if (data == null) {
            $('table').hide();
            $('#nocardrecord').hide();
            $('#nocontactrecord').show();
            this.nocontactrecord = [];
            // this.toastr.error("Please enter a valid contact.", '', {
            //   timeOut: 60000,
            //   enableHtml: true,
            //   closeButton: true,
            //   toastClass: "alert alert-danger alert-with-icon",
            //   positionClass: 'toast-bottom-right'
            // });
          }
          else {
            $('table').show();
            $('#nocontactrecord').hide();
            $('#nocardrecord').hide();
            this.wardno = data["ward"];
            this.lineno = data["line"];

            this.swapdetails = [];
            let dbPath1 = 'Houses/' + this.wardno + '/' + this.lineno + '/' + contact;
            this.db.object(dbPath1).valueChanges().subscribe(data => {
              this.name = data["name"];
              this.cardno = data["card-no"];
              this.address = data["address"];
              this.rfid = data["rfid"];
              this.swapdetails.push({
                names: this.name,
                cards: this.cardno,
                addresses: this.address
              })

              this.day = [];
              this.countpercentage = [];

              let date = new Date();
              var year = date.getFullYear();

              //this.date1 = formatDate(new Date(), 'yyyy-MM-dd', 'en');
              for (let index = 1; index < 32; index++) {
                let count = 0;
                let tempDay;
                if (index.toString().length == 1) {
                  tempDay = "0" + index;

                } else {
                  tempDay = index;
                }
                let date = year + '-' + (<HTMLInputElement>document.getElementById("month")).value + '-' + tempDay;
                //this.date1.push( tempDay +' '+ (<HTMLInputElement>document.getElementById("month")).value + ' ' + year);
               
                let status;

                let dbPath4 = 'HousesCollectionInfo/' + this.wardno + '/' + date + '/' + this.rfid;

                this.db.object(dbPath4).valueChanges().subscribe(data => {


                  if (data == null) {
                    status = "NO"
                    count = count;
                  }
                  else {
                    status = "YES"
                    count++;
                  }
                  this.countpercentage = (count / 31) * 100;

                  if (this.countpercentage <= 50) {
                    this.lesswork = [];
                  }
                  else if (50 < this.countpercentage && this.countpercentage <= 70) {
                    this.averagework = [];
                  }
                  else {
                    this.mostwork = [];
                  }
                  this.day.push({ 'reportDate': date = formatDate(date, 'dd MMMM, yyyy', 'en'), 'cardScanned': status });
                })


              }
            });
          }
        });
      }
    }

    else if (card) {
      if ((<HTMLInputElement>document.getElementById("month")).value == "empty") {
        $('table').hide();
        $('#nocontactrecord').hide();
        $('#nocardrecord').hide();
        this.toastr.error("Please enter a month.", '', {
          timeOut: 60000,
          enableHtml: true,
          closeButton: true,
          toastClass: "alert alert-danger alert-with-icon",
          positionClass: 'toast-bottom-right'
        });
      }
      else {

        let dbPath3 = 'CardWardMapping/' + card;
        this.db.object(dbPath3).valueChanges().subscribe(data => {
          if (data == null) {
            $('table').hide();
            $('#nocontactrecord').hide();
            $('#nocardrecord').show();
            this.nocardrecord = [];
            // this.toastr.error("Please enter a valid card no. .", '', {
            //   timeOut: 60000,
            //   enableHtml: true,
            //   closeButton: true,
            //   toastClass: "alert alert-danger alert-with-icon",
            //   positionClass: 'toast-bottom-right'
            // });
          }
          else {
            $('table').show();
            $('#nocontactrecord').hide();
            $('#nocardrecord').hide();
            this.wardno = data["ward"];
            this.lineno = data["line"];

            this.details = [];
            // this.rfid1 = [];
            this.swapdetails = [];
            let dbPath5 = 'Houses/' + this.wardno + '/' + this.lineno;
            this.db.list(dbPath5).valueChanges().subscribe(data => {
              this.details = data;



              let myData = this.details.find(item => item["card-no"] == card);
              this.name = myData["name"];
              this.cardno = myData["card-no"];
              this.address = myData["address"];
              this.swapdetails.push({
                names: this.name,
                cards: this.cardno,
                addresses: this.address
              })

              this.day = [];
              this.countpercentage = [];
              let month = (<HTMLInputElement>document.getElementById("month")).value;
              let d = new Date();
              var year = d.getFullYear();

              for (let index = 1; index < 32; index++) {
                let count = 0;
                let tempDay;
                if (index.toString().length == 1) {
                  tempDay = "0" + index;

                } else {
                  tempDay = index;
                }
                let date = year + '-' + month + '-' + tempDay;
                let status;
                let dbPath4 = 'HousesCollectionInfo/' + this.wardno + '/' + date + '/' + myData["rfid"];
               


                this.db.object(dbPath4).valueChanges().subscribe(data => {


                  if (data == null) {
                    status = "NO"
                    count = count;
                  }
                  else {
                    status = "YES"
                    count++;
                  }
                  this.countpercentage = (count / 31) * 100;
                  if (this.countpercentage <= 50) {
                    this.lesswork = [];
                  }
                  else if (50 < this.countpercentage && this.countpercentage <= 70) {
                    this.averagework = [];
                  }
                  else {
                    this.mostwork = [];
                  }
                  this.day.push({ 'reportDate': date = formatDate(date, 'dd MMMM, yyyy', 'en'), 'cardScanned': status });
                })



              }
            });
          }
        });
      }
    }
    else {
      this.toastr.error("Enter either contact or card-no.", '', {
        timeOut: 60000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-danger alert-with-icon",
        positionClass: 'toast-bottom-right'
      });

    }
  }
}
/*
          for (let index = 0; index < data.length; index++) {

            if (data[index]["card-no"] == card) {
              this.rfid1.push(data[index]["rfid"]);
              this.day = [];


              }



            }
            else {
              alert("nooooooooooooo")
            }

          }

*/




    //       // this.carddetails = [];



    //         // this.carddetails.push({
    //         //   line: data["line"],
    //         //   ward: data["ward"]
    //         // })





    // //        let dbPath5='Houses/'+this.wardno+'/'+ this.lineno;
    // //        this.db.object(dbPath5, query: { 
    // //          orderByChild: "card-no",
    // //          equalTo: card,
    // //        }
    // //       ).valueChanges().subscribe(data=>{
    // // this.details=data;
    // //       }) ;





    //   this.day = [];

    //   let month = (<HTMLInputElement>document.getElementById("month")).value;
    //   let d = new Date();
    //   var year = d.getFullYear();

    //   for (let index = 1; index < 32; index++) {

    //     let tempDay;
    //     if (index.toString().length == 1) {
    //       tempDay = "0" + index;

    //     } else {
    //       tempDay = index;
    //     }
    //     let date = year + '-' + month + '-' + tempDay;
    //     let status;
    //     let dbPath4 = 'HousesCollectionInfo/' + this.wardno + '/' + date + '/' + this.rfid1;

    //     this.db.object(dbPath4).valueChanges().subscribe(data => {


    //       if (data == null) {
    //         status = "NO"
    //       }
    //       else {
    //         status = "YES"
    //       }

    //       this.day.push({ 'reportDate': date, 'cardScanned': status });
    //     })
    //   }
    // });  
    //     // });
    //     });    

