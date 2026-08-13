import { Component, Input } from '@angular/core';
import { MoveHelperService } from '../../services/common/move-helper.service';

/**
 * ActionHistory/{section}/{pageName}/{date} ka viewer.
 * Sirf userId 4 ke liye - page apne HTML me *ngIf="canView" laga kar hi ise
 * dikhata hai, aur yahan bhi dobara check hota hai.
 */
@Component({
  selector: 'app-action-history',
  templateUrl: './action-history.component.html',
  styleUrls: ['./action-history.component.scss']
})
export class ActionHistoryComponent {

  @Input() db: any;
  @Input() section = "";
  @Input() pageName = "";

  selectedDate = "";
  records: any[] = [];
  loading = false;
  loaded = false;
  errorText = "";
  expandedKey = "";

  get canView(): boolean {
    return this.moveHelper.canViewActionHistory();
  }

  /** userId -> name. Record me sirf userId save hota hai, naam yahan dikhane
   *  ke liye localStorage ki user list se nikala jata hai. */
  private userNameMap: any = {};

  constructor(private moveHelper: MoveHelperService) {
    this.selectedDate = this.moveHelper.getDateString(new Date());
    this.buildUserNameMap();
  }

  private buildUserNameMap() {
    try {
      let list = JSON.parse(localStorage.getItem("webPortalUserList"));
      if (list == null || list.length == null) {
        return;
      }
      for (let i = 0; i < list.length; i++) {
        if (list[i] != null && list[i]["userId"] != null) {
          this.userNameMap["" + list[i]["userId"]] = list[i]["name"];
        }
      }
    } catch (e) {
      this.userNameMap = {};
    }
  }

  /** "Ritik (4)" - naam na mile to sirf id */
  userText(record: any): string {
    let id = record["userId"];
    if (id == null || id == "") {
      return "-";
    }
    let name = this.userNameMap["" + id];
    if (name == null || name == "") {
      return "" + id;
    }
    return name + " (" + id + ")";
  }

  async load() {
    if (!this.canView || this.db == null || this.loading) {
      return;
    }
    if (this.selectedDate == "") {
      this.errorText = "पहले date चुनें।";
      return;
    }
    this.loading = true;
    this.errorText = "";
    this.expandedKey = "";
    try {
      this.records = await this.moveHelper.readActionHistory(this.db, this.section, this.pageName, this.selectedDate);
    } catch (e) {
      this.records = [];
      this.errorText = "History नहीं मिल पाई: " + ((e && e.message) ? e.message : e);
    }
    this.loading = false;
    this.loaded = true;
  }

  toggleDetail(record: any) {
    this.expandedKey = (this.expandedKey == record["key"]) ? "" : record["key"];
  }

  failedCount(record: any): number {
    if (record["failedItems"] == null) {
      return 0;
    }
    return record["failedItems"].length;
  }

  routeText(record: any): string {
    let from = record["from"];
    let to = record["to"];
    if (from == null || to == null) {
      return "-";
    }
    if (from["ward"] == to["ward"]) {
      return "Zone " + from["ward"] + " : Line " + from["line"] + " → Line " + to["line"];
    }
    return "Zone " + from["ward"] + " / Line " + from["line"] + " → Zone " + to["ward"] + " / Line " + to["line"];
  }

  timeText(record: any): string {
    let value = record["startTime"];
    if (value == null || ("" + value).indexOf(" ") < 0) {
      return "" + (value != null ? value : "-");
    }
    return ("" + value).split(" ")[1];
  }
}
