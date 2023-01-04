import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {

  constructor() {
  }

  divSonant = "#divSonant";
  iframeSonant="iframeSonant";
  isShow: any;

  ngOnInit() {
    //$('.navbar-toggler').hide();
    $("#divSideMenus").hide();
    $("#divMainContent").css("width", "calc(100% - 1px)");
    // When the user scrolls down 20px from the top of the document, show the button
    //window.onscroll = function () { this.scrollFunction() };
    this.isShow = false;
  }

  setNavBar() {
    let element = <HTMLDivElement>document.getElementById("navbarCollapse");
    let className = element.className;
    $("#navbarCollapse").removeClass(className);
    if (className.includes("show")) {
      $("#navbarCollapse").addClass("collapse navbar-collapse justify-content-end");
    }
    else {
      $("#navbarCollapse").addClass("collapse show navbar-collapse justify-content-end");
    }
  }

  scrollFunction() {
    var mybutton = document.getElementById("myBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      mybutton.style.display = "block";
    } else {
      mybutton.style.display = "none";
    }
  }

  getDetail(id: any) {
    document.getElementById(id).scrollIntoView();
    this.setNavBar();
  }

  myFunction() {
    var dots = document.getElementById("dots");
    var moreText = document.getElementById("more");
    var btnText = document.getElementById("myBtnmore");

    if (dots.style.display === "none") {
      dots.style.display = "inline";
      btnText.innerHTML = "Load more";
      moreText.style.display = "none";
    } else {
      dots.style.display = "none";
      btnText.innerHTML = "View less";
      moreText.style.display = "inline";
    }
  }

}
