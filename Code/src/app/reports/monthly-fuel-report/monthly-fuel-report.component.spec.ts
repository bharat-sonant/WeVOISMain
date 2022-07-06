import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyFuelReportComponent } from './monthly-fuel-report.component';

describe('MonthlyFuelReportComponent', () => {
  let component: MonthlyFuelReportComponent;
  let fixture: ComponentFixture<MonthlyFuelReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyFuelReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyFuelReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
