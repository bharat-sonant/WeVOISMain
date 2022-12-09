import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMarkerAgainstCardsComponent } from './add-marker-against-cards.component';

describe('AddMarkerAgainstCardsComponent', () => {
  let component: AddMarkerAgainstCardsComponent;
  let fixture: ComponentFixture<AddMarkerAgainstCardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMarkerAgainstCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMarkerAgainstCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
