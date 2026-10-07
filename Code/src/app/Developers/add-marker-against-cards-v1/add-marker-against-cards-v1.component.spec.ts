import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMarkerAgainstCardsV1Component } from './add-marker-against-cards-v1.component';

describe('AddMarkerAgainstCardsV1Component', () => {
  let component: AddMarkerAgainstCardsV1Component;
  let fixture: ComponentFixture<AddMarkerAgainstCardsV1Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMarkerAgainstCardsV1Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMarkerAgainstCardsV1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
