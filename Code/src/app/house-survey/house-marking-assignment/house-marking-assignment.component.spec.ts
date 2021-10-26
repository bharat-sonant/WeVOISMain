import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseMarkingAssignmentComponent } from './house-marking-assignment.component';

describe('HouseMarkingAssignmentComponent', () => {
  let component: HouseMarkingAssignmentComponent;
  let fixture: ComponentFixture<HouseMarkingAssignmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HouseMarkingAssignmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HouseMarkingAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
