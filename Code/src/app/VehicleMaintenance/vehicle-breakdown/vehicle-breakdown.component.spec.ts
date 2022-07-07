import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleBreakdownComponent } from './vehicle-breakdown.component';

describe('VehicleBreakdownComponent', () => {
  let component: VehicleBreakdownComponent;
  let fixture: ComponentFixture<VehicleBreakdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleBreakdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
