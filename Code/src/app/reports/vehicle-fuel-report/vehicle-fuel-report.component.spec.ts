import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleFuelReportComponent } from './vehicle-fuel-report.component';

describe('VehicleFuelReportComponent', () => {
  let component: VehicleFuelReportComponent;
  let fixture: ComponentFixture<VehicleFuelReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleFuelReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleFuelReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
