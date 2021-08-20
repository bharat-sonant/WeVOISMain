import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAssignedComponent } from './vehicle-assigned.component';

describe('VehicleAssignedComponent', () => {
  let component: VehicleAssignedComponent;
  let fixture: ComponentFixture<VehicleAssignedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleAssignedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleAssignedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
