import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { interval } from "rxjs";
import { AngularFireDatabase } from "angularfire2/database";
import { FirebaseService } from "../../firebase.service";

//services
import { CommonService } from "../../services/common/common.service";
import { MapService } from "../../services/map/map.service";

@Component({
  selector: "app-skip-line",
  templateUrl: "./skip-line.component.html",
  styleUrls: ["./skip-line.component.scss"],
})
export class SkipLineComponent implements OnInit {
  constructor(
    public fs: FirebaseService,
    private mapService: MapService,
    private commonService: CommonService,
    private httpService: HttpClient
  ) {}
  db:any;
  index: any;
  studentDetail: any;
  zoneList: any[];

  selectedZoneNo: any;
  selectedZoneName: any;
  selectedDate: any;

  public selectedZone: any;
  marker = new google.maps.Marker();
  previousLat: any;
  previousLng: any;
  allLines: any[];
  activeZone: any;
  vehicleLocationFirstTime: any;
  skippedLines: any[];

  ngOnInit() {
    this.db = this.fs.getDatabaseByCity(localStorage.getItem("cityName"));
    this.commonService.chkUserPageAccess(
      window.location.href,
      localStorage.getItem("cityName")
    );

    this.getZoneList();
  }

  getZoneList() {
    this.zoneList = [];
    this.zoneList = this.mapService.getAllZones();
  }

  setDate(filterVal: any) {
    this.selectedDate = filterVal;
  }

  showReport() {
    this.getSkipLines();
  }

  getSkipLines() {
    this.skippedLines = [];
    let i = 0;
    for (let index = 0; index < this.zoneList.length; index++) {
      let dbPath =
        "WasteCollectionInfo/" +
        this.zoneList[index]["zoneNo"] +
        "/" +
        this.selectedDate +
        "/LineStatus";

      let lineData = this.db
        .list(dbPath)
        .valueChanges()
        .subscribe((data) => {
          if (data.length > 0) {
            let wardInserted = false;

            for (let j = 0; j < data.length; j++) {
              if (data[j]["Status"] == "skip") {
                if (!wardInserted) {
                  this.skippedLines.push({
                    wardName: "Ward " + this.zoneList[index]["zoneNo"],
                    lines: [],
                  });
                  wardInserted = true;
                  i++;
                }

                this.skippedLines[i - 1].lines.push({
                  lineNo: "Line " + (j + 1),
                  reason: data[j]["Reason"],
                });
              }
            }

            lineData.unsubscribe();
          }
        });
    }
  }
}
