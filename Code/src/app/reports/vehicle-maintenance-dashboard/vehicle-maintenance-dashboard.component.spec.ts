import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleMaintenanceDashboardComponent } from './vehicle-maintenance-dashboard.component';

describe('VehicleMaintenanceDashboardComponent', () => {
  let component: VehicleMaintenanceDashboardComponent;
  let fixture: ComponentFixture<VehicleMaintenanceDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleMaintenanceDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleMaintenanceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
