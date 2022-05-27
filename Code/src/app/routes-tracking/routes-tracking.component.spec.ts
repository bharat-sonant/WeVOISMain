import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesTrackingComponent } from './routes-tracking.component';

describe('RoutesTrackingComponent', () => {
  let component: RoutesTrackingComponent;
  let fixture: ComponentFixture<RoutesTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoutesTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutesTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
