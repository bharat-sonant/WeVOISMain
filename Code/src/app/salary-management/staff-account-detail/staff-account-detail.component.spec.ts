import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffAccountDetailComponent } from './staff-account-detail.component';

describe('StaffAccountDetailComponent', () => {
  let component: StaffAccountDetailComponent;
  let fixture: ComponentFixture<StaffAccountDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StaffAccountDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StaffAccountDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
