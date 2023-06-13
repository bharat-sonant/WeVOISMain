import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityPaymentReportComponent } from './entity-payment-report.component';

describe('EntityPaymentReportComponent', () => {
  let component: EntityPaymentReportComponent;
  let fixture: ComponentFixture<EntityPaymentReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntityPaymentReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityPaymentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
