import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WardWorkPercentageComponent } from './ward-work-percentage.component';

describe('WardWorkPercentageComponent', () => {
  let component: WardWorkPercentageComponent;
  let fixture: ComponentFixture<WardWorkPercentageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WardWorkPercentageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WardWorkPercentageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
