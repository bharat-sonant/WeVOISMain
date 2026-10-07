import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeLineSurveyedDataV1Component } from './change-line-surveyed-data-v1.component';

describe('ChangeLineSurveyedDataV1Component', () => {
  let component: ChangeLineSurveyedDataV1Component;
  let fixture: ComponentFixture<ChangeLineSurveyedDataV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeLineSurveyedDataV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeLineSurveyedDataV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
