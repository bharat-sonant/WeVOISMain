import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskManagementMastersComponent } from './task-management-masters.component';

describe('TaskManagementMastersComponent', () => {
  let component: TaskManagementMastersComponent;
  let fixture: ComponentFixture<TaskManagementMastersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskManagementMastersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskManagementMastersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
