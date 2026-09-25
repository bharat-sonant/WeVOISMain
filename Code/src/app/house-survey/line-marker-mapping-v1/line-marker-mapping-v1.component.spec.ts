import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineMarkerMappingV1Component } from './line-marker-mapping-v1.component';

describe('LineMarkerMappingV1Component', () => {
  let component: LineMarkerMappingV1Component;
  let fixture: ComponentFixture<LineMarkerMappingV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineMarkerMappingV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineMarkerMappingV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
