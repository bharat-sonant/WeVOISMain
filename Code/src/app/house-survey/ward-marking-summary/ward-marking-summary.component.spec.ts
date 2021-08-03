import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardMarkingSummaryComponent } from './ward-marking-summary.component';

describe('WardMarkingSummaryComponent', () => {
  let component: WardMarkingSummaryComponent;
  let fixture: ComponentFixture<WardMarkingSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardMarkingSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardMarkingSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
