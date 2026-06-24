import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardRouteAutoScanComponent } from './ward-route-auto-scan.component';

describe('WardRouteAutoScanComponent', () => {
  let component: WardRouteAutoScanComponent;
  let fixture: ComponentFixture<WardRouteAutoScanComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardRouteAutoScanComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardRouteAutoScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
