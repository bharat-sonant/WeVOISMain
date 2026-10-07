import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerApprovalTestV1Component } from './marker-approval-test-v1.component';

describe('MarkerApprovalTestV1Component', () => {
  let component: MarkerApprovalTestV1Component;
  let fixture: ComponentFixture<MarkerApprovalTestV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkerApprovalTestV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkerApprovalTestV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
