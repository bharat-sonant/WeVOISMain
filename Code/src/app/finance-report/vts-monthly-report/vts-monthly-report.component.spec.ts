import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VtsMonthlyReportComponent } from './vts-monthly-report.component';

describe('VtsMonthlyReportComponent', () => {
  let component: VtsMonthlyReportComponent;
  let fixture: ComponentFixture<VtsMonthlyReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VtsMonthlyReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VtsMonthlyReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
