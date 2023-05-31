import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentViaChequeComponent } from './payment-via-cheque.component';

describe('PaymentViaChequeComponent', () => {
  let component: PaymentViaChequeComponent;
  let fixture: ComponentFixture<PaymentViaChequeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentViaChequeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentViaChequeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
