import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentViaCitizenappComponent } from './payment-via-citizenapp.component';

describe('PaymentViaCitizenappComponent', () => {
  let component: PaymentViaCitizenappComponent;
  let fixture: ComponentFixture<PaymentViaCitizenappComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentViaCitizenappComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentViaCitizenappComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
