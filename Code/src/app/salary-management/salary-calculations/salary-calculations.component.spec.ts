import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryCalculationsComponent } from './salary-calculations.component';

describe('SalaryCalculationsComponent', () => {
  let component: SalaryCalculationsComponent;
  let fixture: ComponentFixture<SalaryCalculationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalaryCalculationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalaryCalculationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
