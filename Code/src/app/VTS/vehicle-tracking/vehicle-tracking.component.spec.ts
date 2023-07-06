import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleTrackingComponent } from './vehicle-tracking.component';

describe('VehicleTrackingComponent', () => {
  let component: VehicleTrackingComponent;
  let fixture: ComponentFixture<VehicleTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
