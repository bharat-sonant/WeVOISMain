import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclePartReportComponent } from './vehicle-part-report.component';

describe('VehiclePartReportComponent', () => {
  let component: VehiclePartReportComponent;
  let fixture: ComponentFixture<VehiclePartReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehiclePartReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehiclePartReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
