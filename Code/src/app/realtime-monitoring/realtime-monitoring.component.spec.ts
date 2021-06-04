import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RealtimeMonitoringComponent } from './realtime-monitoring.component';

describe('RealtimeMonitoringComponent', () => {
  let component: RealtimeMonitoringComponent;
  let fixture: ComponentFixture<RealtimeMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RealtimeMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RealtimeMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
