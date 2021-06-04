import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteTrackingComponent } from './route-tracking.component';

describe('RouteTrackingComponent', () => {
  let component: RouteTrackingComponent;
  let fixture: ComponentFixture<RouteTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
