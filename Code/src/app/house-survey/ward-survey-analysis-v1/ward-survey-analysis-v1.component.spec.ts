import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardSurveyAnalysisV1Component } from './ward-survey-analysis-v1.component';

describe('WardSurveyAnalysisV1Component', () => {
  let component: WardSurveyAnalysisV1Component;
  let fixture: ComponentFixture<WardSurveyAnalysisV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardSurveyAnalysisV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardSurveyAnalysisV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
