import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DueAmountReportV1Component } from './due-amount-report-v1.component';

describe('DueAmountReportV1Component', () => {
  let component: DueAmountReportV1Component;
  let fixture: ComponentFixture<DueAmountReportV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DueAmountReportV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DueAmountReportV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
