import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PenaltyReviewComponent } from './penalty-review.component';

describe('PenaltyReviewComponent', () => {
  let component: PenaltyReviewComponent;
  let fixture: ComponentFixture<PenaltyReviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PenaltyReviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PenaltyReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
