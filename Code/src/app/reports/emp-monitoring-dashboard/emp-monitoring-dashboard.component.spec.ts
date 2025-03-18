import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpMonitoringDashboardComponent } from './emp-monitoring-dashboard.component';

describe('EmpMonitoringDashboardComponent', () => {
  let component: EmpMonitoringDashboardComponent;
  let fixture: ComponentFixture<EmpMonitoringDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmpMonitoringDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpMonitoringDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
