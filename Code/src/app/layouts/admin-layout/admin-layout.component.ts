import { filter } from 'rxjs/operators';
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy, PopStateEvent } from '@angular/common';
import { AngularFireDatabase } from 'angularfire2/database';
import { ToastrService } from 'ngx-toastr';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import PerfectScrollbar from 'perfect-scrollbar';
import { ToastrModule } from 'ngx-toastr';
import * as $ from "jquery";

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
    private _router: Subscription;
    private lastPoppedUrl: string;
    private yScrollStack: number[] = [];

    constructor(public location: Location, private router: Router, public db: AngularFireDatabase, private toastr: ToastrService) { }

    ngOnInit() {
        let path = window.location.href;
        if (!path.includes("index") && !path.includes("portal-access") && !path.includes("login")) {
            if (localStorage.getItem('loginStatus') != "Success") {
                this.router.navigate(['/index']);
                $("#divSideMenus").hide();
                return;
            }
        }

        const isWindows = navigator.platform.indexOf('Win') > -1 ? true : false;

        if (isWindows && !document.getElementsByTagName('body')[0].classList.contains('sidebar-mini')) {
            // if we are on windows OS we activate the perfectScrollbar function

            document.getElementsByTagName('body')[0].classList.add('perfect-scrollbar-on');
        } else {
            document.getElementsByTagName('body')[0].classList.remove('perfect-scrollbar-off');
        }


        const elemMainPanel = <HTMLElement>document.querySelector('.main-panel');
        const elemSidebar = <HTMLElement>document.querySelector('.sidebar .sidebar-wrapper');

        this.location.subscribe((ev: PopStateEvent) => {
            this.lastPoppedUrl = ev.url;
        });
        this.router.events.subscribe((event: any) => {
            if (event instanceof NavigationStart) {
                if (event.url != this.lastPoppedUrl)
                    this.yScrollStack.push(window.scrollY);
            } else if (event instanceof NavigationEnd) {
                if (event.url == this.lastPoppedUrl) {
                    this.lastPoppedUrl = undefined;
                    window.scrollTo(0, this.yScrollStack.pop());
                } else
                    window.scrollTo(0, 0);
            }
        });
        this._router = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            elemMainPanel.scrollTop = 0;
            elemSidebar.scrollTop = 0;
        });
        if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
            let ps = new PerfectScrollbar(elemMainPanel);
            ps = new PerfectScrollbar(elemSidebar);
        }

        //this.getSkippedLines();

    }

    getSkippedLines() {

        this.db.list('SkipNotification').valueChanges().subscribe(
            data => {

                data.forEach(element => {

                    if (new Date().toJSON().slice(0, 10) == element["date"]) {

                        let currentHrs = new Date().getHours();
                        let currentMinutes = new Date().getMinutes();
                        let lineSkkipedHrs = element["time"].split(':')[0];
                        let lineSkkipedMinutes = element["time"].split(':')[1];
                        if (currentHrs == lineSkkipedHrs && lineSkkipedMinutes >= currentMinutes) {

                            let msg = '<span class="now-ui-icons ui-1_bell-53"></span> Line <b >' + element["line"] + '</b> of ward <b >' + element["zone"] + '</b> is skipped.<br/> <br/> Please check it with field executive.'

                            this.toastr.error(msg, '', {
                                timeOut: 60000,
                                enableHtml: true,
                                closeButton: true,
                                toastClass: "alert alert-danger alert-with-icon",
                                positionClass: 'toast-bottom-right'
                            });


                        }
                    }

                });

            });
    }



    ngAfterViewInit() {
        this.runOnRouteChange();
    }
    isMaps(path) {
        var titlee = this.location.prepareExternalUrl(this.location.path());
        titlee = titlee.slice(1);
        if (path == titlee) {
            return false;
        }
        else {
            return true;
        }
    }
    runOnRouteChange(): void {
        if (window.matchMedia(`(min-width: 960px)`).matches && !this.isMac()) {
            const elemMainPanel = <HTMLElement>document.querySelector('.main-panel');
            const ps = new PerfectScrollbar(elemMainPanel);
            ps.update();
        }
    }
    isMac(): boolean {
        let bool = false;
        if (navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.platform.toUpperCase().indexOf('IPAD') >= 0) {
            bool = true;
        }
        return bool;
    }

}
