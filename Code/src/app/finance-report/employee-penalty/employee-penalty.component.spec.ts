import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeePenaltyComponent } from './employee-penalty.component';

describe('EmployeePenaltyComponent', () => {
  let component: EmployeePenaltyComponent;
  let fixture: ComponentFixture<EmployeePenaltyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeePenaltyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeePenaltyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
