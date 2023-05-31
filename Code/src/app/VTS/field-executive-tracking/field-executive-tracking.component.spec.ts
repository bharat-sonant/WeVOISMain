import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldExecutiveTrackingComponent } from './field-executive-tracking.component';

describe('FieldExecutiveTrackingComponent', () => {
  let component: FieldExecutiveTrackingComponent;
  let fixture: ComponentFixture<FieldExecutiveTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FieldExecutiveTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldExecutiveTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
