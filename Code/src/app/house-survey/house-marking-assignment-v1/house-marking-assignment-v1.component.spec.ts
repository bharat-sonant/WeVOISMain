import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseMarkingAssignmentV1Component } from './house-marking-assignment-v1.component';

describe('HouseMarkingAssignmentV1Component', () => {
  let component: HouseMarkingAssignmentV1Component;
  let fixture: ComponentFixture<HouseMarkingAssignmentV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HouseMarkingAssignmentV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HouseMarkingAssignmentV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
