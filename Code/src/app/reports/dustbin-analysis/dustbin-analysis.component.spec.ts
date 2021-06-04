import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DustbinAnalysisComponent } from './dustbin-analysis.component';

describe('DustbinAnalysisComponent', () => {
  let component: DustbinAnalysisComponent;
  let fixture: ComponentFixture<DustbinAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DustbinAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DustbinAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
