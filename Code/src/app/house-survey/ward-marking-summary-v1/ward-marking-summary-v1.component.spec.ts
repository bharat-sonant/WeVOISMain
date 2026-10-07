import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardMarkingSummaryV1Component } from './ward-marking-summary-v1.component';

describe('WardMarkingSummaryV1Component', () => {
  let component: WardMarkingSummaryV1Component;
  let fixture: ComponentFixture<WardMarkingSummaryV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardMarkingSummaryV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardMarkingSummaryV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
