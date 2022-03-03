import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardWorkTrackingComponent } from './ward-work-tracking.component';

describe('WardWorkTrackingComponent', () => {
  let component: WardWorkTrackingComponent;
  let fixture: ComponentFixture<WardWorkTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardWorkTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardWorkTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
