import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinsMonitoringComponent } from './dustbins-monitoring.component';

describe('DustbinsMonitoringComponent', () => {
  let component: DustbinsMonitoringComponent;
  let fixture: ComponentFixture<DustbinsMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinsMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinsMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
