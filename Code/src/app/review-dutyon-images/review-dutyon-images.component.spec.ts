import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewDutyonImagesComponent } from './review-dutyon-images.component';

describe('ReviewDutyonImagesComponent', () => {
  let component: ReviewDutyonImagesComponent;
  let fixture: ComponentFixture<ReviewDutyonImagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewDutyonImagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewDutyonImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
