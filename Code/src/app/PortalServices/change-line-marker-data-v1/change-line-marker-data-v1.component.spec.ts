import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeLineMarkerDataV1Component } from './change-line-marker-data-v1.component';

describe('ChangeLineMarkerDataV1Component', () => {
  let component: ChangeLineMarkerDataV1Component;
  let fixture: ComponentFixture<ChangeLineMarkerDataV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeLineMarkerDataV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeLineMarkerDataV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
