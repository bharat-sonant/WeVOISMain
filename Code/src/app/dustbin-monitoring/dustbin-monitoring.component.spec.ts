import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinMonitoringComponent } from './dustbin-monitoring.component';

describe('DustbinMonitoringComponent', () => {
  let component: DustbinMonitoringComponent;
  let fixture: ComponentFixture<DustbinMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
