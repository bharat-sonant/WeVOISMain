import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAccountServiceComponent } from './employee-account-service.component';

describe('EmployeeAccountServiceComponent', () => {
  let component: EmployeeAccountServiceComponent;
  let fixture: ComponentFixture<EmployeeAccountServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmployeeAccountServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeeAccountServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
