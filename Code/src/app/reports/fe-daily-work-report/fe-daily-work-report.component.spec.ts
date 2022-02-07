import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeDailyWorkReportComponent } from './fe-daily-work-report.component';

describe('FeDailyWorkReportComponent', () => {
  let component: FeDailyWorkReportComponent;
  let fixture: ComponentFixture<FeDailyWorkReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeDailyWorkReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeDailyWorkReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
