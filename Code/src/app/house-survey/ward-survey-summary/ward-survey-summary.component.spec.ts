import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardSurveySummaryComponent } from './ward-survey-summary.component';

describe('WardSurveySummaryComponent', () => {
  let component: WardSurveySummaryComponent;
  let fixture: ComponentFixture<WardSurveySummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardSurveySummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardSurveySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
