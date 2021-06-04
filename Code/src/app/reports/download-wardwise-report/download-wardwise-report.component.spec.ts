import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadWardwiseReportComponent } from './download-wardwise-report.component';

describe('DownloadWardwiseReportComponent', () => {
  let component: DownloadWardwiseReportComponent;
  let fixture: ComponentFixture<DownloadWardwiseReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DownloadWardwiseReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadWardwiseReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
