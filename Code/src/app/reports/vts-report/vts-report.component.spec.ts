import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VtsReportComponent } from './vts-report.component';

describe('VtsReportComponent', () => {
  let component: VtsReportComponent;
  let fixture: ComponentFixture<VtsReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VtsReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VtsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
