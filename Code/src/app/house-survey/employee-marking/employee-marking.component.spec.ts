import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMarkingComponent } from './employee-marking.component';

describe('EmployeeMarkingComponent', () => {
  let component: EmployeeMarkingComponent;
  let fixture: ComponentFixture<EmployeeMarkingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeeMarkingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeeMarkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
