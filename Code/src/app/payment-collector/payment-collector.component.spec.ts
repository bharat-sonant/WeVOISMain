import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCollectorComponent } from './payment-collector.component';

describe('PaymentCollectorComponent', () => {
  let component: PaymentCollectorComponent;
  let fixture: ComponentFixture<PaymentCollectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentCollectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentCollectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
