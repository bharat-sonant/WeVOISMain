import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GarbageCaptureAnalysisComponent } from './garbage-capture-analysis.component';

describe('GarbageCaptureAnalysisComponent', () => {
  let component: GarbageCaptureAnalysisComponent;
  let fixture: ComponentFixture<GarbageCaptureAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GarbageCaptureAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GarbageCaptureAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
