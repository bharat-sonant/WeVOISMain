import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyPaymentReportComponent } from './monthly-payment-report.component';

describe('MonthlyPaymentReportComponent', () => {
  let component: MonthlyPaymentReportComponent;
  let fixture: ComponentFixture<MonthlyPaymentReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyPaymentReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyPaymentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
