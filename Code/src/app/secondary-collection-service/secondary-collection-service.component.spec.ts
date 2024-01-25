import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryCollectionServiceComponent } from './secondary-collection-service.component';

describe('SecondaryCollectionServiceComponent', () => {
  let component: SecondaryCollectionServiceComponent;
  let fixture: ComponentFixture<SecondaryCollectionServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondaryCollectionServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryCollectionServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
