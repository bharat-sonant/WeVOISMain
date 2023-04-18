import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewTripImagesComponent } from './review-trip-images.component';

describe('ReviewTripImagesComponent', () => {
  let component: ReviewTripImagesComponent;
  let fixture: ComponentFixture<ReviewTripImagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewTripImagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewTripImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
