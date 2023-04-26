import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectedAmountReportComponent } from './collected-amount-report.component';

describe('CollectedAmountReportComponent', () => {
  let component: CollectedAmountReportComponent;
  let fixture: ComponentFixture<CollectedAmountReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectedAmountReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectedAmountReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
