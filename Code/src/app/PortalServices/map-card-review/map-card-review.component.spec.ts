import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapCardReviewComponent } from './map-card-review.component';

describe('MapCardReviewComponent', () => {
  let component: MapCardReviewComponent;
  let fixture: ComponentFixture<MapCardReviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapCardReviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapCardReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
