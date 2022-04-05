import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeLineSurveyedDataComponent } from './change-line-surveyed-data.component';

describe('ChangeLineSurveyedDataComponent', () => {
  let component: ChangeLineSurveyedDataComponent;
  let fixture: ComponentFixture<ChangeLineSurveyedDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeLineSurveyedDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeLineSurveyedDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
