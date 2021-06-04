import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HaltReportComponent } from './halt-report.component';

describe('HaltReportComponent', () => {
  let component: HaltReportComponent;
  let fixture: ComponentFixture<HaltReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HaltReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HaltReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
