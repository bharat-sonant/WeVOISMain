import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VtsRouteComponent } from './vts-route.component';

describe('VtsRouteComponent', () => {
  let component: VtsRouteComponent;
  let fixture: ComponentFixture<VtsRouteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VtsRouteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VtsRouteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
