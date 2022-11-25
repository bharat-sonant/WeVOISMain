import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageWardSupervisorComponent } from './manage-ward-supervisor.component';

describe('ManageWardSupervisorComponent', () => {
  let component: ManageWardSupervisorComponent;
  let fixture: ComponentFixture<ManageWardSupervisorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageWardSupervisorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageWardSupervisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
