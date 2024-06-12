import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCollectorTrackingComponent } from './payment-collector-tracking.component';

describe('PaymentCollectorTrackingComponent', () => {
  let component: PaymentCollectorTrackingComponent;
  let fixture: ComponentFixture<PaymentCollectorTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentCollectorTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentCollectorTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
