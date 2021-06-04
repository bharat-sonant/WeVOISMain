import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cms1',
  templateUrl: './cms1.component.html',
  styleUrls: ['./cms1.component.scss']
})
export class Cms1Component implements OnInit {

  constructor() { }

  ngOnInit() {
    this.setDesign();
  }

  setDesign() {
    let height = 0;
    let width = 0;
    let top = 0;
    let marginTop = 0;
    let windowHeight = $(window).height();
    let windowWidth = $(window).width();

    // for line 1
    let extraHeight = 300;
    let iconHeight = 136;
    height = (windowHeight - extraHeight - iconHeight - 10);
    top = iconHeight;
    $('#divLine1').css("height", height);
    $('#divLine1').css("margin-top", top);

    //for line 2

    marginTop = (windowHeight * 10) / 100;
    height = (windowHeight - extraHeight - iconHeight - (marginTop / 2));

    top = iconHeight - (marginTop / 5);

    $('#div2').css("margin-top", marginTop).css("margin-left", "20px");
    $('#divLine2').css("height", height).css("margin-left", "12vh").css("margin-top", top).css("transform", "rotate(-30deg)");


    //for line 3

    marginTop = (windowHeight * 10) / 100;
    height = (windowHeight - extraHeight - iconHeight - (marginTop / 2));

    top = iconHeight - (marginTop / 4);

    $('#div3').css("margin-top", marginTop).css("margin-left", "20px");
    $('#divLine3').css("height", height).css("margin-right", "15vh").css("margin-top", top).css("transform", "rotate(30deg)");

    if (windowHeight > 680) {

      //for line 4

      marginTop = (windowHeight * 25) / 100;
      height = (windowHeight - extraHeight - iconHeight - 70);

      top = 20;
      let marginLeft = (windowWidth / 4);

      $('#div4').css("margin-top", marginTop).css("margin-left", "20px");
      $('#divLine4').css("height", height).css("margin-left", marginLeft).css("margin-top", top).css("transform", "rotate(-50deg)");

      //for line 5
      marginTop = (windowHeight * 23) / 100;
      height = (windowHeight - extraHeight - iconHeight - 50);

      top = iconHeight + 30;
      let marginRight = -iconHeight - 50;

      $('#div5').css("margin-top", marginTop).css("margin-left", "20px");
      $('#divLine5').css("height", height).css("margin-left", marginRight).css("margin-top", top).css("transform", "rotate(50deg)");

      //for line 6

      marginTop = (windowHeight * 55) / 100;
      height = (windowHeight - extraHeight - iconHeight - 50);

      top = -(extraHeight) + (iconHeight / 2) + 70;
      marginLeft = (windowWidth / 2) - 150;

      $('#div6').css("margin-top", marginTop).css("margin-left", "20px");
      $('#divLine6').css("height", height).css("margin-left", marginLeft).css("margin-top", top).css("transform", "rotate(-70deg)");

      //for line 7
      marginTop = (windowHeight * 49) / 100;
      height = (windowHeight - extraHeight - iconHeight - 50);

      top = -(extraHeight) + (iconHeight * 2) + 80;
      marginRight = (windowWidth / 3) + 20;

      $('#div7').css("margin-top", marginTop).css("margin-left", "20px");
      $('#divLine7').css("height", height).css("margin-right", marginRight).css("margin-top", top).css("transform", "rotate(70deg)");
    }
    else {
      //for line 4

      marginTop = (windowHeight * 25) / 100;

      $('#div4').css("margin-top", marginTop).css("margin-left", "20px");
      let element=<HTMLImageElement>document.getElementById("img4");
      element.src="../../assets/img/pages1.svg";
      $('#divLine4').css("transform","rotate(360deg)").css("position","absolute").css("left","24vh").css("width","60%").css("top","58%");      

      //for line 5
      marginTop = (windowHeight * 23) / 100;

      element=<HTMLImageElement>document.getElementById("img5");
      element.src="../../assets/img/pages1.svg";

      $('#div5').css("margin-top", marginTop).css("margin-left", "20px");
      $('#divLine5').css("transform","rotate(115deg)").css("position","absolute").css("right","25vh").css("width","60%").css("top","58%");      

      //for line 6

      marginTop = (windowHeight * 60) / 100;

      element=<HTMLImageElement>document.getElementById("img6");
      element.src="../../assets/img/line-bottom.svg";
      $('#img6').addClass("w-100");

      $('#div6').css("margin-top", marginTop).css("margin-left", "20px");
      $('#divLine6').css("transform","rotate(330deg)").css("position","absolute").css("left","45vh").css("width","85%");      

      //for line 7
      marginTop = (windowHeight * 52) / 100;

      element=<HTMLImageElement>document.getElementById("img7");
      element.src="../../assets/img/line-bottom.svg";
      $('#img7').addClass("w-100");
      

      $('#div7').css("margin-top", marginTop).css("margin-left", "20px");
      $('#divLine7').css("transform","rotate(-215deg)").css("position","absolute").css("right","45vh").css("width","85%").css("top","50%");      

    }
  }

}
