import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorReportV1Component } from './supervisor-report-v1.component';

describe('SupervisorReportV1Component', () => {
  let component: SupervisorReportV1Component;
  let fixture: ComponentFixture<SupervisorReportV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SupervisorReportV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupervisorReportV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
