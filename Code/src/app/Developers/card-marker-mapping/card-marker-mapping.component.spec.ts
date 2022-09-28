import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMarkerMappingComponent } from './card-marker-mapping.component';

describe('CardMarkerMappingComponent', () => {
  let component: CardMarkerMappingComponent;
  let fixture: ComponentFixture<CardMarkerMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardMarkerMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardMarkerMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
