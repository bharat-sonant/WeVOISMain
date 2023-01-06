import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyVerificationComponent } from './survey-verification.component';

describe('SurveyVerificationComponent', () => {
  let component: SurveyVerificationComponent;
  let fixture: ComponentFixture<SurveyVerificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SurveyVerificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveyVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
