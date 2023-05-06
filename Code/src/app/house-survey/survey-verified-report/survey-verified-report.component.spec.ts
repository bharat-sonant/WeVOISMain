import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyVerifiedReportComponent } from './survey-verified-report.component';

describe('SurveyVerifiedReportComponent', () => {
  let component: SurveyVerifiedReportComponent;
  let fixture: ComponentFixture<SurveyVerifiedReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SurveyVerifiedReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveyVerifiedReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
