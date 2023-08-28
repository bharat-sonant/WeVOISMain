import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentViaNeftComponent } from './payment-via-neft.component';

describe('PaymentViaNeftComponent', () => {
  let component: PaymentViaNeftComponent;
  let fixture: ComponentFixture<PaymentViaNeftComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentViaNeftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentViaNeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
