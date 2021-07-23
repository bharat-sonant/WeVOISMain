import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardSurveyAnalysisComponent } from './ward-survey-analysis.component';

describe('WardSurveyAnalysisComponent', () => {
  let component: WardSurveyAnalysisComponent;
  let fixture: ComponentFixture<WardSurveyAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardSurveyAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardSurveyAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
