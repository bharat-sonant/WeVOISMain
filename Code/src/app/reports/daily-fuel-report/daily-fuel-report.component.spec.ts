import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyFuelReportComponent } from './daily-fuel-report.component';

describe('DailyFuelReportComponent', () => {
  let component: DailyFuelReportComponent;
  let fixture: ComponentFixture<DailyFuelReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DailyFuelReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyFuelReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
