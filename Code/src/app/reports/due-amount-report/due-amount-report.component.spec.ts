import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DueAmountReportComponent } from './due-amount-report.component';

describe('DueAmountReportComponent', () => {
  let component: DueAmountReportComponent;
  let fixture: ComponentFixture<DueAmountReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DueAmountReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DueAmountReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
