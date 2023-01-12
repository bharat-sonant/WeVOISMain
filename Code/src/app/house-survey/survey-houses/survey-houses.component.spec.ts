import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyHousesComponent } from './survey-houses.component';

describe('SurveyHousesComponent', () => {
  let component: SurveyHousesComponent;
  let fixture: ComponentFixture<SurveyHousesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SurveyHousesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveyHousesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
