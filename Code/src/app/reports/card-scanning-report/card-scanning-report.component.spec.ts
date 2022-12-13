import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardScanningReportComponent } from './card-scanning-report.component';

describe('CardScanningReportComponent', () => {
  let component: CardScanningReportComponent;
  let fixture: ComponentFixture<CardScanningReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardScanningReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardScanningReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
