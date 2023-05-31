import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadRouteExcelComponent } from './upload-route-excel.component';

describe('UploadRouteExcelComponent', () => {
  let component: UploadRouteExcelComponent;
  let fixture: ComponentFixture<UploadRouteExcelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadRouteExcelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadRouteExcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
