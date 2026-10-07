import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMarkerMappingV1Component } from './card-marker-mapping-v1.component';

describe('CardMarkerMappingV1Component', () => {
  let component: CardMarkerMappingV1Component;
  let fixture: ComponentFixture<CardMarkerMappingV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardMarkerMappingV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardMarkerMappingV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
