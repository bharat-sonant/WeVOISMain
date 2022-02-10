import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryTransactionComponent } from './salary-transaction.component';

describe('SalaryTransactionComponent', () => {
  let component: SalaryTransactionComponent;
  let fixture: ComponentFixture<SalaryTransactionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SalaryTransactionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SalaryTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
