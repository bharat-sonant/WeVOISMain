import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServingareaComponent } from './servingarea.component';

describe('ServingareaComponent', () => {
  let component: ServingareaComponent;
  let fixture: ComponentFixture<ServingareaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServingareaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServingareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
