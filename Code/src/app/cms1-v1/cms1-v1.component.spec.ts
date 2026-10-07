import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Cms1V1Component } from './cms1-v1.component';

describe('Cms1V1Component', () => {
  let component: Cms1V1Component;
  let fixture: ComponentFixture<Cms1V1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Cms1V1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Cms1V1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
