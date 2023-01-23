import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkerApprovalTestComponent } from './marker-approval-test.component';

describe('MarkerApprovalTestComponent', () => {
  let component: MarkerApprovalTestComponent;
  let fixture: ComponentFixture<MarkerApprovalTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkerApprovalTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkerApprovalTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
