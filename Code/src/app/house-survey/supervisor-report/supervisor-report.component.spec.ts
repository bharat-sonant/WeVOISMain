import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SupervisorReportComponent } from './supervisor-report.component';

describe('SupervisorReportComponent', () => {
  let component: SupervisorReportComponent;
  let fixture: ComponentFixture<SupervisorReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SupervisorReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupervisorReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
