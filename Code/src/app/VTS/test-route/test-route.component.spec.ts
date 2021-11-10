import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestRouteComponent } from './test-route.component';

describe('TestRouteComponent', () => {
  let component: TestRouteComponent;
  let fixture: ComponentFixture<TestRouteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestRouteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
