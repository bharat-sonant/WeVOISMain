import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NonSalariedCalculationComponent } from './non-salaried-calculation.component';

describe('NonSalariedCalculationComponent', () => {
  let component: NonSalariedCalculationComponent;
  let fixture: ComponentFixture<NonSalariedCalculationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NonSalariedCalculationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NonSalariedCalculationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
