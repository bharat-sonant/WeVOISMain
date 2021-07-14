import { Component, OnInit } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import { AngularFireStorage } from "angularfire2/storage";
import { HttpClient } from "@angular/common/http";
import { CommonService } from "../../services/common/common.service";
import { ToastrService } from "ngx-toastr"; // Alert message using NGX toastr
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-petrol-inventory-entry",
  templateUrl: "./petrol-inventory-entry.component.html",
  styleUrls: ["./petrol-inventory-entry.component.scss"],
})
export class PetrolInventoryEntryComponent implements OnInit {
  constructor(
    private storage: AngularFireStorage,
    public http: HttpClient,
    private router: Router,
    public db: AngularFireDatabase,
    public httpService: HttpClient,
    public toastr: ToastrService,
    private actRoute: ActivatedRoute,
    private commonService: CommonService
  ) {}
  selectedFile: File;
  vehicleList: any[] = [];
  vehicleAllList: any[] = [];
  currentYear: any;
  currentMonthName: any;
  toDayDate: any;
  lastEntry: any;
  entryNo: any;
  entryDate: any;
  slipImage: any;
  slipImageURL: any;
  imageUrl: any;
  vehiclePreKm: any = 0;
  averageList: any[] = [];
  vehicleLastMeterReading: any;
  preDate: any;
  preSlipImage: any;

  cityName: any;
  base64Image: any;

  vehicleDataDetail: vehicleDatail = {
    date: "",
    vehicleNo: "",
    liters: "",
  };

  ngOnInit() {
    // this.commonService.chkUserPageAccess(window.location.href,localStorage.getItem("cityName"));
    this.cityName = localStorage.getItem("cityName");
    this.preDate = null;
    this.preSlipImage = null;
    const id = this.actRoute.snapshot.paramMap.get("id");
    const id2 = this.actRoute.snapshot.paramMap.get("id2");
    const id3 = this.actRoute.snapshot.paramMap.get("id3");
    this.toDayDate = this.commonService.setTodayDate();
    let petrolPrice = localStorage.getItem("petrolPrice");
    if (petrolPrice != null) {
      $("#price").val(petrolPrice);
    }
    if (id != null) {
      this.entryNo = id2;
    }
    if (id2 != null) {
      this.toDayDate = id;
      this.currentMonthName = this.commonService.getCurrentMonthName(
        new Date(this.toDayDate).getMonth()
      );
      this.currentYear = this.toDayDate.split("-")[0];
    } else {
      this.currentMonthName = this.commonService.getCurrentMonthName(
        new Date(this.toDayDate).getMonth()
      );
      this.currentYear = new Date().getFullYear();
    }
    $("#date").val(this.toDayDate);
    this.getVehicle();
    if (this.entryNo != null) {
      this.getEntryData(this.entryNo, id3);
    }
  }

  setPreImage() {
    let date = $("#date").val();
    if (this.preDate != date) {
      this.slipImage = null;
    } else {
      this.slipImage = this.preSlipImage;
    }
  }

  getEntryData(id: any, vehicleNo: any) {
    let dbPath =
      "Inventory/PetrolData/" +
      this.currentYear +
      "/" +
      this.currentMonthName +
      "/" +
      this.toDayDate +
      "/" +
      vehicleNo +
      "/" +
      id;
    let petrolInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        petrolInstance.unsubscribe();
        if (data != null) {
          $("#liters").val(data["liters"]);
          $("#price").val(data["price"]);
          $("#ddlVehicle").val(vehicleNo);
          $("#date").val(this.toDayDate);
          this.preDate = this.toDayDate;
          $("#amount").val(data["amount"]);
          $("#km").val(data["vehicleMeterReading"]);
          if (data["address"] != null) {
            $("#address").val(data["address"]);
          }
          if (data["slipImage"] != null) {
            this.slipImage = data["slipImage"];
            this.preSlipImage = data["slipImage"];
          }
          if (data["remark"] != null) {
            $("#remark").val(data["remark"]);
          }
        }
      });
  }

  onFileChanged(event) {
    this.selectedFile = event.target.files[0];
    let self = this;
    let preview = <HTMLImageElement>document.getElementById("source_image");
    this.slipImage = this.selectedFile;
    let reader = new FileReader();
    reader.addEventListener(
      "load",
      function (e: any) {
        var fileUrl = e.target.result;
        preview.src = fileUrl.toString();
        preview.onload = () => {
          self.resizeFile(preview, preview);
        };
      },
      false
    );

    if (this.selectedFile) {
      reader.readAsDataURL(this.selectedFile);
    }
  }

  resizeFile(loadedData, preview) {
    var canvas = document.createElement("canvas"),
      ctx;
    var maxWidth = 800;
    var maxHeight = 800;
    if (loadedData.height <= maxHeight && loadedData.width <= maxWidth) {
      maxHeight = loadedData.height;
      maxWidth = loadedData.width;
    } else {
      if (loadedData.height > loadedData.width) {
        maxWidth = Math.floor(
          maxHeight * (loadedData.width / loadedData.height)
        );
      } else {
        maxHeight = Math.floor(
          maxWidth * (loadedData.height / loadedData.width)
        );
      }
    }
    canvas.width = Math.round(maxWidth);
    canvas.height = Math.round(maxHeight);
    ctx = canvas.getContext("2d");
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    // compress Image

    var result_image = <HTMLImageElement>(
      document.getElementById("result_compress_image")
    );
    var quality = 50;
    var mime_type = "image/jpeg";
    var newImageData = canvas.toDataURL(mime_type, quality / 100);
    var result_image_obj = new Image();
    result_image_obj.src = newImageData;
    result_image.src = result_image_obj.src;
    this.imageUrl = result_image_obj;
    result_image.onload = function () {};
  }

  getVehicle() {
    let vehicleStorageList = JSON.parse(localStorage.getItem("vehicle"));
    if (vehicleStorageList == null) {
      let dbPath = "Vehicles";
      let vehicleInstance = this.db
        .object(dbPath)
        .valueChanges()
        .subscribe((vehicle) => {
          vehicleInstance.unsubscribe();
          if (vehicle != null) {
            this.vehicleList.push({ vehicle: "Select Vehicle" });
            this.vehicleList.push({ vehicle: "Drum/Can" });

            this.vehicleAllList.push({ vehicle: "Select Vehicle" });
            this.vehicleAllList.push({ vehicle: "Drum/Can" });
            let keyArrray = Object.keys(vehicle);
            if (keyArrray.length > 0) {
              for (let i = 0; i < keyArrray.length; i++) {
                if (keyArrray[i] != "NotApplicable") {
                  this.vehicleList.push({ vehicle: keyArrray[i] });
                  this.vehicleAllList.push({ vehicle: keyArrray[i] });
                }
              }
            }
          }
        });
    } else {
      this.vehicleList = vehicleStorageList;
      this.vehicleAllList = vehicleStorageList;
    }
  }

  getFilters() {
    this.vehicleList = [];
    let flt = $("#ddlVehicle").val();
    if (flt != "") {
      if (this.vehicleAllList.length > 0) {
        for (let i = 0; i < this.vehicleAllList.length; i++) {
          if (
            this.vehicleAllList[i]["vehicle"]
              .toString()
              .includes(flt.toString().toUpperCase())
          ) {
            this.vehicleList.push({
              vehicle: this.vehicleAllList[i]["vehicle"],
            });
          }
        }
      }
    } else {
      if (this.vehicleAllList.length > 0) {
        for (let i = 0; i < this.vehicleAllList.length; i++) {
          this.vehicleList.push({ vehicle: this.vehicleAllList[i]["vehicle"] });
        }
      }
    }
  }

  showList() {
    $("#vehicleList").show();
  }

  hideList() {
    setTimeout(() => {
      $("#vehicleList").hide();
    }, 500);
  }

  getValue(e) {
    $("#ddlVehicle").val(e.target.innerHTML);
    $("#vehicleList").hide();
    this.getLastMeterReading();
  }

  getAmount() {
    let price = 0;
    let liters = 0;
    if ($("#liters").val() != "") {
      liters = Number($("#liters").val());
    }
    if ($("#price").val() != "") {
      price = Number($("#price").val());
    }
    let amount = (price * liters).toFixed(2);
    $("#amount").val(amount);
  }

  getPrice() {
    let amount = 0;
    let liters = 0;
    if ($("#liters").val() != "") {
      liters = Number($("#liters").val());
    }
    if ($("#amount").val() != "") {
      amount = Number($("#amount").val());
    }
    let price = (amount / liters).toFixed(2);
    $("#price").val(price);
  }

  clearAll() {
    $("#ddlVehicle").val("Select Vehicle");
    $("#liters").val("");
    $("#amount").val("");
    $("#km").val("");
    $("#address").val("");
    $("#remark").val("");
    $("#kmReading").val("");
    $("#kmReading").hide();
    this.slipImage = null;
    var result_image = <HTMLImageElement>(
      document.getElementById("result_compress_image")
    );
    result_image.src = "";
    this.preDate = null;
    this.preSlipImage = null;
  }

  saveData() {
    const id = this.actRoute.snapshot.paramMap.get("id");

    if ($("#date").val() == "") {
      this.setAlertMessage("error", "Please fill date !!!");
      return;
    }

    if ($("#ddlVehicle").val() == "") {
      this.setAlertMessage("error", "Please select Vehicle !!!");
      return;
    }

    if ($("#ddlVehicle").val() == "Select Vehicle") {
      this.setAlertMessage("error", "Please select Vehicle !!!");
      return;
    }

    if ($("#ddlVehicle").val() != "Drum/Can") {
      if ($("#km").val() != "") {
        let reading = $("#km").val();
        if (Number(reading) < this.vehicleLastMeterReading) {
          this.setAlertMessage(
            "error",
            "Please fill Meter reading more than " +
              this.vehicleLastMeterReading +
              ""
          );
          return;
        }
      } else {
        this.setAlertMessage("error", "Please fill km reading !!!");
        return;
      }
    }

    if ($("#liters").val() == "") {
      this.setAlertMessage("error", "Please fill liters !!!");
      return;
    }

    if ($("#price").val() == "") {
      this.setAlertMessage("error", "Please fill price !!!");
      return;
    }

    if (this.slipImage == null) {
      this.setAlertMessage("error", "Please select petrol slip !!!");
      return;
    }

    $("#divLoader").show();

    let elementSave = <HTMLButtonElement>document.getElementById("btnSave");
    elementSave.disabled = true;
    let elementCancel = <HTMLButtonElement>document.getElementById("btnCancel");
    elementCancel.disabled = true;

    let vehicleNo = $("#ddlVehicle").val();
    if (this.entryNo == null) {
      let vehicleDetails = this.vehicleAllList.find(
        (item) => item.vehicle == vehicleNo
      );
      if (vehicleDetails == undefined) {
        this.setAlertMessage("error", "Please select Correct Vehicle!!!!");
        $("#alertBox").hide();
        elementSave.disabled = false;
        elementCancel.disabled = false;
        $("#ddlVehicle").val("");
        return;
      }
    }

    let liters = $("#liters").val();
    let date = $("#date").val();
    let km = 0;
    let dbPath =
      "Inventory/PetrolData/" +
      this.currentYear +
      "/" +
      this.currentMonthName +
      "/" +
      date +
      "";
    let petrolInstance = this.db
      .object(dbPath)
      .valueChanges()
      .subscribe((data) => {
        petrolInstance.unsubscribe();
        if (data != null) {
          let keyArray = Object.keys(data);
          if (keyArray.length > 0) {
            let isData = false;
            for (let i = 0; i < keyArray.length - 1; i++) {
              let index = keyArray[i];
              if (
                data[index]["isDelete"] == 0 &&
                data[index]["vehicleNo"] == vehicleNo &&
                data[index]["liters"] == liters
              ) {
                i = keyArray.length;
                this.vehicleDataDetail.date = date.toString();
                this.vehicleDataDetail.vehicleNo = vehicleNo.toString();
                this.vehicleDataDetail.liters = liters.toString();
                $("#alertBox").show();
                isData = true;
              }
            }
            if (isData == false) {
              this.saveAllData();
            }
          }
        } else {
          this.saveAllData();
        }
      });
  }

  saveAllData() {
    $("#alertBox").hide();
    let elementSave = <HTMLButtonElement>document.getElementById("btnSave");
    elementSave.disabled = true;
    let elementCancel = <HTMLButtonElement>document.getElementById("btnCancel");
    elementCancel.disabled = true;

    let vehicleNo = $("#ddlVehicle").val();
    let price = $("#price").val();
    let liters = $("#liters").val();
    let amount = $("#amount").val();
    let date = $("#date").val();
    let km = 0;

    if ($("#km").val() != "") {
      km = Number($("#km").val());
    }
    let isDelete = 0;
    let address = null;
    let remark = null;
    if ($("#address").val() != "") {
      address = $("#address").val();
    }
    if ($("#remark").val() != "") {
      remark = $("#remark").val();
    }

    localStorage.setItem("petrolPrice", price.toString());
    let userId = localStorage.getItem("userID");
    this.currentYear = date.toString().split("-")[0];
    this.toDayDate = date;
    this.currentMonthName = this.commonService.getCurrentMonthName(
      Number(date.toString().split("-")[1]) - 1
    );
    if (this.entryNo == null) {
      let dbPath =
        "Inventory/PetrolData/" +
        this.currentYear +
        "/" +
        this.currentMonthName +
        "/" +
        this.toDayDate +
        "/" +
        vehicleNo +
        "/lastEntry";
      let lastEntryInstance = this.db
        .object(dbPath)
        .valueChanges()
        .subscribe((data) => {
          lastEntryInstance.unsubscribe();
          if (data != null) {
            this.lastEntry = data;
          } else {
            this.lastEntry = 0;
          }
          this.lastEntry = Number(this.lastEntry) + 1;
          if (this.selectedFile != null) {
            let fileName =
              vehicleNo.toString().replace("/Can", "") +
              "_" +
              this.lastEntry +
              ".png";

            const path =
              "" +
              this.commonService.getFireStoreCity() +
              "/PetrolSlip/" +
              this.currentYear +
              "/" +
              this.currentMonthName +
              "/" +
              date +
              "/" +
              vehicleNo +
              "/" +
              fileName;
            this.slipImage = fileName;
            //const ref = this.storage.ref(path);
            const ref = this.storage.storage.app
              .storage("https://firebasestorage.googleapis.com")
              .ref(path);

            var byteString;
            if (this.imageUrl.src.split(",")[0].indexOf("base64") >= 0)
              byteString = atob(this.imageUrl.src.split(",")[1]);
            else byteString = unescape(this.imageUrl.src.split(",")[1]);

            // separate out the mime component
            var mimeString = this.imageUrl.src
              .split(",")[0]
              .split(":")[1]
              .split(";")[0];

            // write the bytes of the string to a typed array
            var ia = new Uint8Array(byteString.length);
            for (var i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }

            let blob = new Blob([ia], { type: mimeString });
            const task = ref.put(blob);
          }
          this.db
            .object(
              "Inventory/PetrolData/" +
                this.currentYear +
                "/" +
                this.currentMonthName +
                "/" +
                this.toDayDate +
                "/" +
                vehicleNo +
                ""
            )
            .update({
              lastEntry: this.lastEntry,
            });
          this.db
            .object(
              "Inventory/PetrolData/" +
                this.currentYear +
                "/" +
                this.currentMonthName +
                "/" +
                this.toDayDate +
                "/" +
                vehicleNo +
                "/" +
                this.lastEntry
            )
            .update({
              price: price,
              liters: liters,
              amount: amount,
              userId: userId,
              creationDate: this.commonService.setTodayDate(),
              address: address,
              isDelete: isDelete,
              slipImage: this.slipImage,
              vehicleMeterReading: km,
              remark: remark,
            });
          if (vehicleNo != "Drum/Can") {
            this.setVehicleAverage(vehicleNo);
          }
          setTimeout(() => {
            $("#divLoader").hide();
            elementSave.disabled = false;
            elementCancel.disabled = false;
            this.setAlertMessage("success", "Entry Added Successfully !!!");
            this.clearAll();
          }, 4000);
        });
    } else {
      this.lastEntry = this.entryNo;
      if (this.preDate != date) {
        if (this.slipImage == null) {
          this.setAlertMessage("error", "Please select petrol slip !!!");
          return;
        }
      }
      if (this.selectedFile != null) {
        let fileName =
          vehicleNo.toString().replace("/Can", "") +
          "_" +
          this.lastEntry +
          ".png";

        const path =
          "" +
          this.commonService.getFireStoreCity() +
          "/PetrolSlip/" +
          this.currentYear +
          "/" +
          this.currentMonthName +
          "/" +
          date +
          "/" +
          vehicleNo +
          "/" +
          fileName;
        this.slipImage = fileName;
        //const ref = this.storage.ref(path);
        const ref = this.storage.storage.app
          .storage("gs://dtdnavigator.appspot.com")
          .ref(path);

        var byteString;
        if (this.imageUrl.src.split(",")[0].indexOf("base64") >= 0)
          byteString = atob(this.imageUrl.src.split(",")[1]);
        else byteString = unescape(this.imageUrl.src.split(",")[1]);

        // separate out the mime component
        var mimeString = this.imageUrl.src
          .split(",")[0]
          .split(":")[1]
          .split(";")[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        let blob = new Blob([ia], { type: mimeString });
        const task = ref.put(blob);
      }
      if (this.preDate != date) {
        let year = this.preDate.toString().split("-")[0];
        let monthName = this.commonService.getCurrentMonthName(
          Number(this.preDate.toString().split("-")[1]) - 1
        );
        this.db
          .object(
            "Inventory/PetrolData/" +
              year +
              "/" +
              monthName +
              "/" +
              this.preDate +
              "/" +
              vehicleNo +
              "/" +
              this.lastEntry
          )
          .update({
            isDelete: 1,
          });
        let dbPath =
          "Inventory/PetrolData/" +
          this.currentYear +
          "/" +
          this.currentMonthName +
          "/" +
          this.toDayDate +
          "/" +
          vehicleNo +
          "/lastEntry";
        let lastEntryInstance = this.db
          .object(dbPath)
          .valueChanges()
          .subscribe((data) => {
            lastEntryInstance.unsubscribe();
            if (data != null) {
              this.lastEntry = data;
            } else {
              this.lastEntry = 0;
            }
            this.lastEntry = Number(this.lastEntry) + 1;
            this.db
              .object(
                "Inventory/PetrolData/" +
                  this.currentYear +
                  "/" +
                  this.currentMonthName +
                  "/" +
                  this.toDayDate +
                  "/" +
                  vehicleNo +
                  ""
              )
              .update({
                lastEntry: this.lastEntry,
              });

            this.db
              .object(
                "Inventory/PetrolData/" +
                  this.currentYear +
                  "/" +
                  this.currentMonthName +
                  "/" +
                  this.toDayDate +
                  "/" +
                  vehicleNo +
                  "/" +
                  this.lastEntry
              )
              .update({
                price: price,
                liters: liters,
                amount: amount,
                userId: userId,
                creationDate: this.commonService.setTodayDate(),
                address: address,
                isDelete: isDelete,
                slipImage: this.slipImage,
                vehicleMeterReading: km,
                remark: remark,
              });
          });
      } else {
        this.db
          .object(
            "Inventory/PetrolData/" +
              this.currentYear +
              "/" +
              this.currentMonthName +
              "/" +
              this.toDayDate +
              "/" +
              vehicleNo +
              "/" +
              this.lastEntry
          )
          .update({
            price: price,
            liters: liters,
            amount: amount,
            userId: userId,
            creationDate: this.commonService.setTodayDate(),
            address: address,
            isDelete: isDelete,
            slipImage: this.slipImage,
            vehicleMeterReading: km,
            remark: remark,
          });
      }
      if (vehicleNo == "Drum/Can") {
      } else if (vehicleNo == "Motor Cycle") {
      } else {
        this.setVehicleAverage(vehicleNo);
      }
      setTimeout(() => {
        this.setAlertMessage("success", "Entry Updated Successfully !!!");
        this.router.navigate([
          "/" + this.cityName + "/7A/petrol-inventory-list",
        ]);
        //this.router.navigate(['/petrol-inventory-list']);
      }, 4000);
    }
  }

  cancelEntry() {
    this.router.navigate(["/" + this.cityName + "/7A/petrol-inventory-list"]);
  }

  setAlertMessage(type: any, message: any) {
    if (type == "error") {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-danger alert-with-icon",
        positionClass: "toast-bottom-right",
      });
    } else {
      this.toastr.error(message, "", {
        timeOut: 6000,
        enableHtml: true,
        closeButton: true,
        toastClass: "alert alert-info alert-with-icon",
        positionClass: "toast-bottom-right",
      });
    }
  }

  setVehicleAverage(vehicleNo: any) {
    this.averageList = [];
    let days = new Date(
      parseInt(this.currentYear),
      parseInt(this.currentMonthName),
      0
    ).getDate();
    let rowTo = days;
    if (
      this.toDayDate.toString().split("-")[1] ==
      this.commonService.setTodayDate().split("-")[1]
    ) {
      rowTo = parseInt(this.commonService.setTodayDate().split("-")[2]);
    }
    for (let j = 1; j <= rowTo; j++) {
      let monthDate =
        this.currentYear +
        "-" +
        this.toDayDate.split("-")[1] +
        "-" +
        (j < 10 ? "0" : "") +
        j;
      let monthName = this.commonService.getCurrentMonthName(
        parseInt(monthDate.split("-")[1]) - 1
      );
      let dbPath =
        "Inventory/PetrolData/" +
        this.currentYear +
        "/" +
        monthName +
        "/" +
        monthDate +
        "/" +
        vehicleNo +
        "";
      let petrolInstance = this.db
        .object(dbPath)
        .valueChanges()
        .subscribe((data) => {
          petrolInstance.unsubscribe();
          if (data != null) {
            let keyArray = Object.keys(data);
            if (keyArray.length > 0) {
              for (let i = 0; i < keyArray.length - 1; i++) {
                let index = keyArray[i];
                if (data[index]["isDelete"] == 0) {
                  this.averageList.push({
                    km: data[index]["vehicleMeterReading"],
                    petrol: data[index]["liters"],
                    date: monthDate,
                  });
                }
              }
            }
          }
        });
    }

    setTimeout(() => {
      if (this.averageList.length > 0) {
        this.averageList = this.commonService.transform(this.averageList, "km");
        let Km = 0;
        let preKm = 0;
        let currentKm = Number(
          this.averageList[this.averageList.length - 1]["km"]
        );
        for (let preIndex = 0; preIndex < this.averageList.length; preIndex++) {
          if (
            Number(this.averageList[preIndex]["km"]) != 0 &&
            Number(this.averageList[preIndex]["km"]) != -1
          ) {
            preKm = Number(this.averageList[preIndex]["km"]);
            Km = currentKm - preKm;
            preIndex = this.averageList.length;
          }
        }
        let petrol = 0;
        let totalKm = 0;
        let totalPetrol = 0;
        for (let i = 0; i < this.averageList.length; i++) {
          if (i < this.averageList.length - 1) {
            petrol = petrol + Number(this.averageList[i]["petrol"]);
          }
          totalPetrol = totalPetrol + Number(this.averageList[i]["petrol"]);
          totalKm = Number(this.averageList[i]["km"]);
        }
        let avgrage = 0;
        if (preKm != 0) {
          if (petrol != 0) {
            avgrage = Number((Km / petrol).toFixed(2));
          }
        }
        this.db
          .object(
            "Inventory/PetrolData/" +
              this.currentYear +
              "/" +
              this.currentMonthName +
              "/Vehicles/" +
              vehicleNo
          )
          .update({
            average: avgrage,
            km: Km,
            petrol: petrol,
            totalKm: totalKm,
            totalPetrol: totalPetrol,
          });
      }
    }, 2000);
  }

  getLastMeterReading() {
    this.vehicleLastMeterReading = 0;
    let vehicleNo = $("#ddlVehicle").val();
    let readingDate = $("#date").val();
    if (vehicleNo != "Select Vehicle" && vehicleNo != "") {
      $("#kmReading").show();
      $("#kmReading").html("(Previous Reading <b>0 KM</b>)");
      this.getLastReading(vehicleNo, readingDate);
    } else {
      $("#kmReading").hide();
      $("#kmReading").html("");
    }
  }

  getLastReading(vehicleNo: any, date: any) {
    if (date != "2021-01-01") {
      let year = date.split("-")[0];
      let monthName = this.commonService.getCurrentMonthName(
        parseInt(date.split("-")[1]) - 1
      );
      let dbPath =
        "Inventory/PetrolData/" +
        year +
        "/" +
        monthName +
        "/" +
        date +
        "/" +
        vehicleNo;
      let readingInstance = this.db
        .object(dbPath)
        .valueChanges()
        .subscribe((readingData) => {
          readingInstance.unsubscribe();
          if (readingData != null) {
            let meterReading = 0;
            let keyArray = Object.keys(readingData);
            if (keyArray.length > 0) {
              for (let k = keyArray.length - 2; k >= 0; k--) {
                let index = keyArray[k];
                if (readingData[index]["isDelete"] == 0) {
                  if (readingData[index]["vehicleMeterReading"] != 0) {
                    meterReading = readingData[index]["vehicleMeterReading"];
                    this.vehicleLastMeterReading = meterReading;
                  }
                }
              }
            }
            if (meterReading == 0) {
              this.getLastReading(
                vehicleNo,
                this.commonService.getPreviousDate(date, 1)
              );
            } else {
              $("#kmReading").html(
                "(Previous Reading <b>" + meterReading + " KM/" + date + "</b>)"
              );
            }
          } else {
            this.getLastReading(
              vehicleNo,
              this.commonService.getPreviousDate(date, 1)
            );
          }
        });
    }
  }

  checkReading() {
    if (this.entryNo == null) {
      let reading = $("#km").val();
      if (reading != "") {
        if (Number(reading) < this.vehicleLastMeterReading) {
          $("#km").val("");
          this.setAlertMessage(
            "error",
            "Please fill Meter reading more than " +
              this.vehicleLastMeterReading +
              ""
          );
        }
      }
    }
  }
}

export class vehicleDatail {
  date: string;
  vehicleNo: string;
  liters: string;
}
