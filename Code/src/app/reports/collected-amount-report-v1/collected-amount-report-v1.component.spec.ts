import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectedAmountReportV1Component } from './collected-amount-report-v1.component';

describe('CollectedAmountReportV1Component', () => {
  let component: CollectedAmountReportV1Component;
  let fixture: ComponentFixture<CollectedAmountReportV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectedAmountReportV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectedAmountReportV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
