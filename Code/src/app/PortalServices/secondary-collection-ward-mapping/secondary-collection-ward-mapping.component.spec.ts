import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryCollectionWardMappingComponent } from './secondary-collection-ward-mapping.component';

describe('SecondaryCollectionWardMappingComponent', () => {
  let component: SecondaryCollectionWardMappingComponent;
  let fixture: ComponentFixture<SecondaryCollectionWardMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondaryCollectionWardMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryCollectionWardMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
