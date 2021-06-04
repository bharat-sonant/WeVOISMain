import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleMaintenanceCostComponent } from './vehicle-maintenance-cost.component';

describe('VehicleMaintenanceCostComponent', () => {
  let component: VehicleMaintenanceCostComponent;
  let fixture: ComponentFixture<VehicleMaintenanceCostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleMaintenanceCostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleMaintenanceCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
