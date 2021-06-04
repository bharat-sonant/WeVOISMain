import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeDistanceComponent } from './time-distance.component';

describe('TimeDistanceComponent', () => {
  let component: TimeDistanceComponent;
  let fixture: ComponentFixture<TimeDistanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeDistanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeDistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
