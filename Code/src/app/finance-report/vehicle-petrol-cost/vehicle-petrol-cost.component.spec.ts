import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiclePetrolCostComponent } from './vehicle-petrol-cost.component';

describe('VehiclePetrolCostComponent', () => {
  let component: VehiclePetrolCostComponent;
  let fixture: ComponentFixture<VehiclePetrolCostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehiclePetrolCostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehiclePetrolCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
