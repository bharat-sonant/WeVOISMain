import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinReportComponent } from './dustbin-report.component';

describe('DustbinReportComponent', () => {
  let component: DustbinReportComponent;
  let fixture: ComponentFixture<DustbinReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
