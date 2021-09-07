import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardScancardSummaryComponent } from './ward-scancard-summary.component';

describe('WardScancardSummaryComponent', () => {
  let component: WardScancardSummaryComponent;
  let fixture: ComponentFixture<WardScancardSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardScancardSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardScancardSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
