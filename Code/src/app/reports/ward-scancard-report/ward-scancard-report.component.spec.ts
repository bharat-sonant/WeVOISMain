import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardScancardReportComponent } from './ward-scancard-report.component';

describe('WardScancardReportComponent', () => {
  let component: WardScancardReportComponent;
  let fixture: ComponentFixture<WardScancardReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardScancardReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardScancardReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
