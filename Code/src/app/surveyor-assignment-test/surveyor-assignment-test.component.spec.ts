import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyorAssignmentTestComponent } from './surveyor-assignment-test.component';

describe('SurveyorAssignmentTestComponent', () => {
  let component: SurveyorAssignmentTestComponent;
  let fixture: ComponentFixture<SurveyorAssignmentTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SurveyorAssignmentTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveyorAssignmentTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
