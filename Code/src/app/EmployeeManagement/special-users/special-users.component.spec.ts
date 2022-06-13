import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialUsersComponent } from './special-users.component';

describe('SpecialUsersComponent', () => {
  let component: SpecialUsersComponent;
  let fixture: ComponentFixture<SpecialUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpecialUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpecialUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
