import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BvgRoutesComponent } from './bvg-routes.component';

describe('BvgRoutesComponent', () => {
  let component: BvgRoutesComponent;
  let fixture: ComponentFixture<BvgRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BvgRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BvgRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
