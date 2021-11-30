import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VtsAnalysisComponent } from './vts-analysis.component';

describe('VtsAnalysisComponent', () => {
  let component: VtsAnalysisComponent;
  let fixture: ComponentFixture<VtsAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VtsAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VtsAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
