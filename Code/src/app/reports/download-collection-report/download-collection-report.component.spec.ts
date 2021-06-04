import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadCollectionReportComponent } from './download-collection-report.component';

describe('DownloadCollectionReportComponent', () => {
  let component: DownloadCollectionReportComponent;
  let fixture: ComponentFixture<DownloadCollectionReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DownloadCollectionReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadCollectionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
