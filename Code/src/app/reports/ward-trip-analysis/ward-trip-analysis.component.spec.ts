import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardTripAnalysisComponent } from './ward-trip-analysis.component';

describe('WardTripAnalysisComponent', () => {
  let component: WardTripAnalysisComponent;
  let fixture: ComponentFixture<WardTripAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardTripAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardTripAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
