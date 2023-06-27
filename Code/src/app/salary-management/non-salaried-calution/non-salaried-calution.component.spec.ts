import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NonSalariedCalutionComponent } from './non-salaried-calution.component';

describe('NonSalariedCalutionComponent', () => {
  let component: NonSalariedCalutionComponent;
  let fixture: ComponentFixture<NonSalariedCalutionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NonSalariedCalutionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NonSalariedCalutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
