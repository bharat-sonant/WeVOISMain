import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetNearbyWardComponent } from './set-nearby-ward.component';

describe('SetNearbyWardComponent', () => {
  let component: SetNearbyWardComponent;
  let fixture: ComponentFixture<SetNearbyWardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetNearbyWardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetNearbyWardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
