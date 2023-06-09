import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPaymentReportComponent } from './daily-payment-report.component';

describe('DailyPaymentReportComponent', () => {
  let component: DailyPaymentReportComponent;
  let fixture: ComponentFixture<DailyPaymentReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DailyPaymentReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyPaymentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
