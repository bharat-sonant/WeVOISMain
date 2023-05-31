import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PenaltySummaryComponent } from './penalty-summary.component';

describe('PenaltySummaryComponent', () => {
  let component: PenaltySummaryComponent;
  let fixture: ComponentFixture<PenaltySummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PenaltySummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PenaltySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
