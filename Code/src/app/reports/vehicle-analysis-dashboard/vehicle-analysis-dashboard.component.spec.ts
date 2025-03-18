import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAnalysisDashboardComponent } from './vehicle-analysis-dashboard.component';

describe('VehicleAnalysisDashboardComponent', () => {
  let component: VehicleAnalysisDashboardComponent;
  let fixture: ComponentFixture<VehicleAnalysisDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleAnalysisDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleAnalysisDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
