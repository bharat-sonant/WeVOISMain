import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleBreakdownReportComponent } from './vehicle-breakdown-report.component';

describe('VehicleBreakdownReportComponent', () => {
  let component: VehicleBreakdownReportComponent;
  let fixture: ComponentFixture<VehicleBreakdownReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleBreakdownReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleBreakdownReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
