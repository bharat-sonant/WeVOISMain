import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetMonitorComponent } from './fleet-monitor.component';

describe('FleetMonitorComponent', () => {
  let component: FleetMonitorComponent;
  let fixture: ComponentFixture<FleetMonitorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FleetMonitorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FleetMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
