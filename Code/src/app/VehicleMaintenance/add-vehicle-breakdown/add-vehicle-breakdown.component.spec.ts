import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVehicleBreakdownComponent } from './add-vehicle-breakdown.component';

describe('AddVehicleBreakdownComponent', () => {
  let component: AddVehicleBreakdownComponent;
  let fixture: ComponentFixture<AddVehicleBreakdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddVehicleBreakdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVehicleBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
