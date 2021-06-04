import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclePetrolReportComponent } from './vehicle-petrol-report.component';

describe('VehiclePetrolReportComponent', () => {
  let component: VehiclePetrolReportComponent;
  let fixture: ComponentFixture<VehiclePetrolReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehiclePetrolReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehiclePetrolReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
