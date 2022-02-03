import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryHoldingManagementComponent } from './salary-holding-management.component';

describe('SalaryHoldingManagementComponent', () => {
  let component: SalaryHoldingManagementComponent;
  let fixture: ComponentFixture<SalaryHoldingManagementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalaryHoldingManagementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalaryHoldingManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
