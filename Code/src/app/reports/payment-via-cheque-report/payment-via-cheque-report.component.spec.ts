import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentViaChequeReportComponent } from './payment-via-cheque-report.component';

describe('PaymentViaChequeReportComponent', () => {
  let component: PaymentViaChequeReportComponent;
  let fixture: ComponentFixture<PaymentViaChequeReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentViaChequeReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentViaChequeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
