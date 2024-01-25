import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryCollectionAnalysisComponent } from './secondary-collection-analysis.component';

describe('SecondaryCollectionAnalysisComponent', () => {
  let component: SecondaryCollectionAnalysisComponent;
  let fixture: ComponentFixture<SecondaryCollectionAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondaryCollectionAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryCollectionAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
