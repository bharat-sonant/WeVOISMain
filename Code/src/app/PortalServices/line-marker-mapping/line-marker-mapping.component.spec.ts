import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LineMarkerMappingComponent } from './line-marker-mapping.component';

describe('LineMarkerMappingComponent', () => {
  let component: LineMarkerMappingComponent;
  let fixture: ComponentFixture<LineMarkerMappingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LineMarkerMappingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LineMarkerMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
