import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardMonitoringComponent } from './ward-monitoring.component';

describe('WardMonitoringComponent', () => {
  let component: WardMonitoringComponent;
  let fixture: ComponentFixture<WardMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
