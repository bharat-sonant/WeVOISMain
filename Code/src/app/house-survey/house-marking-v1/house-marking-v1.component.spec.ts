import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseMarkingV1Component } from './house-marking-v1.component';

describe('HouseMarkingV1Component', () => {
  let component: HouseMarkingV1Component;
  let fixture: ComponentFixture<HouseMarkingV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HouseMarkingV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HouseMarkingV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
