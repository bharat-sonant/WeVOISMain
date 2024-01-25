import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryCollectionPlaningComponent } from './secondary-collection-planing.component';

describe('SecondaryCollectionPlaningComponent', () => {
  let component: SecondaryCollectionPlaningComponent;
  let fixture: ComponentFixture<SecondaryCollectionPlaningComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondaryCollectionPlaningComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryCollectionPlaningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
