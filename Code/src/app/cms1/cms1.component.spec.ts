import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Cms1Component } from './cms1.component';

describe('Cms1Component', () => {
  let component: Cms1Component;
  let fixture: ComponentFixture<Cms1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Cms1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Cms1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
