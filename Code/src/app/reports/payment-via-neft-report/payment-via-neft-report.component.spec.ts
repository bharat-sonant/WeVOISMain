import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentViaNeftReportComponent } from './payment-via-neft-report.component';

describe('PaymentViaNeftReportComponent', () => {
  let component: PaymentViaNeftReportComponent;
  let fixture: ComponentFixture<PaymentViaNeftReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentViaNeftReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentViaNeftReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
