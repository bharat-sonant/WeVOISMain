import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldExecutiveAttendanceComponent } from './field-executive-attendance.component';

describe('FieldExecutiveAttendanceComponent', () => {
  let component: FieldExecutiveAttendanceComponent;
  let fixture: ComponentFixture<FieldExecutiveAttendanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FieldExecutiveAttendanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldExecutiveAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
