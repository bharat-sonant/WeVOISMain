import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HaltSummaryComponent } from './halt-summary.component';

describe('HaltSummaryComponent', () => {
  let component: HaltSummaryComponent;
  let fixture: ComponentFixture<HaltSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HaltSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HaltSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
