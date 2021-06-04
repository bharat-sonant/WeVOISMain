import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthSalaryReportComponent } from './month-salary-report.component';

describe('MonthSalaryReportComponent', () => {
  let component: MonthSalaryReportComponent;
  let fixture: ComponentFixture<MonthSalaryReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthSalaryReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthSalaryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
