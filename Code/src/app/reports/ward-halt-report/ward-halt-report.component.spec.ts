import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardHaltReportComponent } from './ward-halt-report.component';

describe('WardHaltReportComponent', () => {
  let component: WardHaltReportComponent;
  let fixture: ComponentFixture<WardHaltReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardHaltReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardHaltReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
