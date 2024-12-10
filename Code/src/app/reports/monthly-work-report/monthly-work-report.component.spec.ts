import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyWorkReportComponent } from './monthly-work-report.component';

describe('MonthlyWorkReportComponent', () => {
  let component: MonthlyWorkReportComponent;
  let fixture: ComponentFixture<MonthlyWorkReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyWorkReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyWorkReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
