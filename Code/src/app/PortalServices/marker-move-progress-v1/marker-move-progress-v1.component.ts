import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface MarkerMoveRow {
  srNo: number;
  // PEHLE YE TEEN THE (hataye nahi, comment kiye hain):
  //
  //   markerNo: string;      // line par marker ka serial ("7")
  //   newKey: number;        // destination line par uska naya number
  //   newMarkerNo: string;   // wahi, dikhane ke liye string me
  //
  // Marker ab move par renumber hota hi nahi - uski pehchaan uid hai jo global
  // counter se aata hai aur kabhi badalta nahi. Isliye "naya number" jaisi koi
  // cheez rahi hi nahi, aur dikhane ke liye ek hi column bachta hai: uid.
  markerUid: string;
  fromZone: string;
  fromLine: string;
  toZone: string;
  toLine: string;
  cardNo: string;
  oldImage: string;
  newImage: string;
  imageMissing: boolean;   // image file hi nahi thi - marker phir bhi move hua
  status: string;          // pending | moving | moved | failed
  failedStep: string;
  error: string;
  attempts: number;
}

export interface MarkerMoveSummary {
  running: boolean;
  waitingForNetwork: boolean;
  statusText: string;
  fromZone: string;
  fromLine: string;
  toZone: string;
  toLine: string;
  backupFile: string;
  total: number;
  moved: number;
  failed: number;
  pending: number;
  imageMissing: number;
}

@Component({
  selector: 'app-marker-move-progress-v1',
  templateUrl: './marker-move-progress-v1.component.html',
  styleUrls: ['./marker-move-progress-v1.component.scss']
})
export class MarkerMoveProgressV1Component {

  @Input() rows: MarkerMoveRow[] = [];
  @Input() summary: MarkerMoveSummary;
  @Input() showHeader = true;        // popup ke andar modal-header hi kaafi hai

  @Output() retryFailed = new EventEmitter<void>();
  @Output() cancelMove = new EventEmitter<void>();

  currentFilter = "all";

  get visibleRows(): MarkerMoveRow[] {
    if (this.rows == null) {
      return [];
    }
    if (this.currentFilter == "all") {
      return this.rows;
    }
    if (this.currentFilter == "imageMissing") {
      return this.rows.filter(r => r.imageMissing == true);
    }
    return this.rows.filter(r => r.status == this.currentFilter);
  }

  get progressPercent(): number {
    if (this.summary == null || this.summary.total == 0) {
      return 0;
    }
    let done = this.summary.moved + this.summary.failed;
    return Math.round((done * 100) / this.summary.total);
  }

  setFilter(value: string) {
    this.currentFilter = value;
  }

  trackByRow(index: number, row: MarkerMoveRow) {
    return row.srNo;
  }

  statusLabel(status: string): string {
    if (status == "moved") { return "Moved"; }
    if (status == "failed") { return "Failed"; }
    if (status == "moving") { return "Moving"; }
    return "Pending";
  }

  onRetryFailed() {
    this.retryFailed.emit();
  }

  onCancelMove() {
    this.cancelMove.emit();
  }

  /** Jo rows abhi filter me dikh rahi hain wahi export hoti hain -
   *  isse "Failed" aur "No Image" dono ki list nikaali ja sakti hai. */
  exportFailed() {
    let exportRows = this.visibleRows;
    if (exportRows.length == 0) {
      return;
    }
    // PEHLE header me "MarkerNo" tha aur row me r.markerNo jaata tha.
    let lines = ["SrNo,MarkerUid,FromZone,FromLine,ToZone,ToLine,CardNo,Image,ImageMissing,Status,FailedStep,Error,Attempts"];
    for (let i = 0; i < exportRows.length; i++) {
      let r = exportRows[i];
      lines.push([
        r.srNo, r.markerUid, r.fromZone, r.fromLine, r.toZone, r.toLine,
        r.cardNo, r.oldImage, (r.imageMissing ? "yes" : "no"), r.status,
        r.failedStep, ("" + r.error).replace(/,/g, ";"), r.attempts
      ].join(","));
    }
    let blob = new Blob([lines.join("\n")], { type: "text/csv" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "marker-move-" + this.currentFilter + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}
