import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardSurveySummaryV1Component } from './ward-survey-summary-v1.component';

describe('WardSurveySummaryV1Component', () => {
  let component: WardSurveySummaryV1Component;
  let fixture: ComponentFixture<WardSurveySummaryV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardSurveySummaryV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardSurveySummaryV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
