import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardRouteTrackingComponent } from './ward-route-tracking.component';

describe('WardRouteTrackingComponent', () => {
  let component: WardRouteTrackingComponent;
  let fixture: ComponentFixture<WardRouteTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardRouteTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardRouteTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
