import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RolePageAccessComponent } from './role-page-access.component';

describe('RolePageAccessComponent', () => {
  let component: RolePageAccessComponent;
  let fixture: ComponentFixture<RolePageAccessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RolePageAccessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RolePageAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
